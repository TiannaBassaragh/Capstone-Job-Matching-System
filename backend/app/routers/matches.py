from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db, SessionLocal
from app.models.models import (
  Match, Candidate, CandidateCompetency, JobCompetency,
  Competency, Employer, JobPost, User, Resume, Notification
)
from app.schemas.schemas import MatchResponse, JobRecommendation
from app.core.dependencies import get_current_user, require_applicant, require_recruiter
from app.services.scorer import compute_fit_score
from app.services.llm_scorer import generate_match_explanation
from app.services.resume_parser import parse_resume_bytes

router = APIRouter(prefix="/matches", tags=["Matches"])


# ─── helpers ─────────────────────────────────────────────────────────────────

def get_candidate_or_404(user: User, db: Session) -> Candidate:
  candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
  if not candidate:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found")
  return candidate


def get_employer_or_404(user: User, db: Session) -> Employer:
  employer = db.query(Employer).filter(Employer.user_id == user.user_id).first()
  if not employer:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer profile not found")
  return employer


def _score_resume(candidate: Candidate, db: Session) -> dict[int, float | None]:
  """
  Returns the candidate's scored competencies from the DB.
  Scoring happens at resume upload time; this is a read-only operation.
  Raises 422 if no competencies have been scored yet (no resume uploaded).
  """
  rows = (
    db.query(CandidateCompetency)
    .filter(CandidateCompetency.candidate_id == candidate.candidate_id)
    .all()
  )
  if not rows:
    raise HTTPException(
      status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
      detail="No scored competencies on file. Please upload a resume first."
    )
  return {row.competency_id: row.level_score for row in rows}


def _upsert_match(candidate_id: int, job_id: int, result: dict, db: Session) -> None:
  existing = db.query(Match).filter_by(candidate_id=candidate_id, job_id=job_id).first()
  if existing:
    existing.match_score          = result["match_score"]
    existing.coverage             = result["coverage"]
    existing.recommendation_score = result["recommendation_score"]
    existing.knockout_failed      = result["knockout_failed"]
    existing.qualification_tier   = result["qualification_tier"]
    existing.gap_profile          = result["gap_profile"]
    existing.explanation          = result["explanation"]
  else:
    db.add(Match(
      candidate_id          = candidate_id,
      job_id                = job_id,
      match_score           = result["match_score"],
      coverage              = result["coverage"],
      recommendation_score  = result["recommendation_score"],
      knockout_failed       = result["knockout_failed"],
      qualification_tier    = result["qualification_tier"],
      gap_profile           = result["gap_profile"],
      explanation           = result["explanation"],
    ))


# ─── matching status tracking ─────────────────────────────────────────────────

import threading

_active_candidate_ids: set[int] = set()
_active_job_ids: set[int] = set()
_lock = threading.Lock()


def _is_matching(candidate_id: int = None, job_id: int = None) -> bool:
  with _lock:
    if candidate_id is not None:
      return candidate_id in _active_candidate_ids
    if job_id is not None:
      return job_id in _active_job_ids
    return False


# ─── background workers ───────────────────────────────────────────────────────

def _run_candidate_matching(candidate_id: int) -> None:
  with _lock:
    _active_candidate_ids.add(candidate_id)
  db = SessionLocal()
  try:
    candidate = db.query(Candidate).filter_by(candidate_id=candidate_id).first()
    candidate_tech = candidate.tech_keywords if candidate else None
    candidate_levels = {
      row.competency_id: row.level_score
      for row in db.query(CandidateCompetency)
      .filter(CandidateCompetency.candidate_id == candidate_id)
      .all()
    }
    for job in db.query(JobPost).filter(JobPost.is_active == True).all():
      job_reqs = (
        db.query(JobCompetency)
        .filter(JobCompetency.job_id == job.job_id)
        .options(joinedload(JobCompetency.competency))
        .all()
      )
      if not job_reqs:
        continue
      result = compute_fit_score(candidate_levels, job_reqs,
                                  candidate_tech=candidate_tech,
                                  job_tech=job.tech_keywords)
      _upsert_match(candidate_id, job.job_id, result, db)
    db.commit()
  finally:
    db.close()
    with _lock:
      _active_candidate_ids.discard(candidate_id)


def _run_job_matching(job_id: int) -> None:
  with _lock:
    _active_job_ids.add(job_id)
  db = SessionLocal()
  try:
    job = db.query(JobPost).filter_by(job_id=job_id).first()
    job_tech = job.tech_keywords if job else None
    job_reqs = (
      db.query(JobCompetency)
      .filter(JobCompetency.job_id == job_id)
      .options(joinedload(JobCompetency.competency))
      .all()
    )
    scored_candidate_ids = [
      row.candidate_id
      for row in db.query(CandidateCompetency.candidate_id).distinct().all()
    ]
    for candidate_id in scored_candidate_ids:
      candidate = db.query(Candidate).filter_by(candidate_id=candidate_id).first()
      candidate_tech = candidate.tech_keywords if candidate else None
      candidate_levels = {
        row.competency_id: row.level_score
        for row in db.query(CandidateCompetency)
        .filter(CandidateCompetency.candidate_id == candidate_id)
        .all()
      }
      result = compute_fit_score(candidate_levels, job_reqs,
                                  candidate_tech=candidate_tech,
                                  job_tech=job_tech)
      _upsert_match(candidate_id, job_id, result, db)
    db.commit()
  finally:
    db.close()
    with _lock:
      _active_job_ids.discard(job_id)


# ─── status ──────────────────────────────────────────────────────────────────

@router.get("/status")
def matching_status(
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  """Check if matching is currently running for this user."""
  if current_user.account_type == "applicant":
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.user_id).first()
    matching = _is_matching(candidate_id=candidate.candidate_id) if candidate else False
  else:
    employer = db.query(Employer).filter(Employer.user_id == current_user.user_id).first()
    if employer:
      job_ids = [
        r.job_id for r in db.query(JobPost.job_id).filter(JobPost.employer_id == employer.employer_id).all()
      ]
      matching = any(_is_matching(job_id=jid) for jid in job_ids)
    else:
      matching = False
  return {"matching": matching}


# ─── triggers ────────────────────────────────────────────────────────────────

@router.post("/trigger", status_code=status.HTTP_202_ACCEPTED)
def trigger_candidate(
  background_tasks: BackgroundTasks,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant),
):
  """Candidate-triggered: match my scored resume against every job (async)."""
  candidate = get_candidate_or_404(current_user, db)
  _score_resume(candidate, db)  # validates competencies exist; raises 422 if not
  background_tasks.add_task(_run_candidate_matching, candidate.candidate_id)
  return {"status": "accepted", "message": "Matching is running in the background."}


@router.post("/trigger/{job_id}", status_code=status.HTTP_202_ACCEPTED)
def trigger_job(
  job_id: int,
  background_tasks: BackgroundTasks,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter),
):
  """Recruiter-triggered: match this job against every scored candidate (async)."""
  employer = get_employer_or_404(current_user, db)

  job = db.query(JobPost).filter(JobPost.job_id == job_id).first()
  if not job:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job post not found")
  if job.employer_id != employer.employer_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only trigger matches for your own jobs")

  job_reqs = (
    db.query(JobCompetency)
    .filter(JobCompetency.job_id == job_id)
    .all()
  )
  if not job_reqs:
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Job has no scored competencies")

  background_tasks.add_task(_run_job_matching, job_id)
  return {"status": "accepted", "message": "Matching is running in the background."}


# ─── read endpoints ───────────────────────────────────────────────────────────

@router.get("/recommendations", response_model=List[JobRecommendation])
def get_recommendations(
  limit: int = Query(10, ge=1, le=200),
  tier: Optional[str] = Query(None, description="Filter by qualification_tier"),
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant),
):
  """Top job matches for the logged-in candidate, sorted by match score descending."""
  candidate = get_candidate_or_404(current_user, db)

  q = (
    db.query(Match)
    .filter(Match.candidate_id == candidate.candidate_id)
    .filter(Match.match_score.isnot(None))   # exclude unscored matches
  )
  if tier:
    q = q.filter(Match.qualification_tier == tier)
  sort_key = func.coalesce(Match.match_score * Match.coverage, -1)
  matches = q.order_by(sort_key.desc()).limit(limit).all()

  # batch-load jobs and employers
  job_ids = [m.job_id for m in matches]
  jobs = {j.job_id: j for j in db.query(JobPost).filter(JobPost.job_id.in_(job_ids)).all()}
  employer_ids = [j.employer_id for j in jobs.values()]
  employers = {
    e.employer_id: e
    for e in db.query(Employer).filter(Employer.employer_id.in_(employer_ids)).all()
  }
  employer_user_ids = [e.user_id for e in employers.values()]
  employer_users = {
    u.user_id: u
    for u in db.query(User).filter(User.user_id.in_(employer_user_ids)).all()
  }

  result = []
  for rank, m in enumerate(matches, start=1):
    job = jobs.get(m.job_id)
    employer = employers.get(job.employer_id) if job else None
    employer_user = employer_users.get(employer.user_id) if employer else None
    result.append(JobRecommendation(
      rank                 = rank,
      match_id             = m.match_id,
      job_id               = m.job_id,
      employer_id          = job.employer_id if job else 0,
      title                = job.title if job else "Unknown",
      company_name         = employer.company_name if employer else "Unknown",
      company_logo         = employer.logo if employer else None,
      description          = job.description if job else None,
      location             = job.location   if job else None,
      work_type            = job.work_type  if job else None,
      pay_low              = job.pay_low    if job else None,
      pay_high             = job.pay_high   if job else None,
      experience           = job.experience if job else None,
      expires_at           = job.expires_at if job else None,
      match_score          = m.match_score,
      job_score            = m.match_score * m.coverage if m.match_score is not None else None,
      recommendation_score = m.recommendation_score or 0.0,
      qualification_tier   = m.qualification_tier or "unknown",
      knockout_failed      = m.knockout_failed,
      shortlisted          = m.shortlisted,
      interested           = m.interested,
      explanation          = m.explanation,
      gap_profile          = m.gap_profile,
      recruiter_name       = f"{employer_user.f_name} {employer_user.l_name}".strip() if employer_user else None,
      recruiter_email      = employer_user.email if employer_user else None,
    ))
  return result


@router.get("/candidate/{candidate_id}", response_model=List[MatchResponse])
def get_matches_for_candidate(
  candidate_id: int,
  skip: int = Query(0, ge=0),
  limit: int = Query(50, ge=1, le=200),
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant)
):
  candidate = get_candidate_or_404(current_user, db)
  if candidate.candidate_id != candidate_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own matches")
  return db.query(Match).filter(Match.candidate_id == candidate_id).offset(skip).limit(limit).all()


@router.get("/job/{job_id}", response_model=List[MatchResponse])
def get_matches_for_job(
  job_id: int,
  skip: int = Query(0, ge=0),
  limit: int = Query(50, ge=1, le=200),
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter)
):
  employer = get_employer_or_404(current_user, db)
  job = db.query(JobPost).filter(JobPost.job_id == job_id).first()
  if not job:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job post not found")
  if job.employer_id != employer.employer_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view matches for your own job posts")
  return db.query(Match).filter(Match.job_id == job_id).offset(skip).limit(limit).all()


@router.get("/{match_id}", response_model=MatchResponse)
def get_match(
  match_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  match = db.query(Match).filter(Match.match_id == match_id).first()
  if not match:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

  if current_user.account_type == "applicant":
    candidate = get_candidate_or_404(current_user, db)
    if match.candidate_id != candidate.candidate_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own matches")
  else:
    employer = get_employer_or_404(current_user, db)
    job = db.query(JobPost).filter(JobPost.job_id == match.job_id).first()
    if not job or job.employer_id != employer.employer_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view matches for your own job posts")

  return match


@router.get("/{match_id}/explain")
def explain_match(
  match_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  """
  Generate (or return cached) a human-readable explanation of this match.
  Written from the candidate's perspective for applicants, or the hiring
  manager's perspective for recruiters. Result is cached on the match record.
  """
  match = db.query(Match).filter(Match.match_id == match_id).first()
  if not match:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

  # Authorisation — same rules as get_match
  if current_user.account_type == "applicant":
    candidate = get_candidate_or_404(current_user, db)
    if match.candidate_id != candidate.candidate_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own matches")
    viewer = "candidate"
  else:
    employer = get_employer_or_404(current_user, db)
    job = db.query(JobPost).filter(JobPost.job_id == match.job_id).first()
    if not job or job.employer_id != employer.employer_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view matches for your own job posts")
    viewer = "recruiter"

  # Return cached explanation if available
  if match.explanation:
    return {"match_id": match_id, "explanation": match.explanation}

  if not match.gap_profile:
    raise HTTPException(
      status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
      detail="Match has not been scored yet — no gap profile available.",
    )

  # Fetch the candidate's most recent resume text
  resume = (
    db.query(Resume)
    .filter(Resume.candidate_id == match.candidate_id)
    .order_by(Resume.upload_date.desc())
    .first()
  )
  if not resume:
    raise HTTPException(
      status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
      detail="No resume on file for this candidate.",
    )
  try:
    resume_text = parse_resume_bytes(resume.resume_file)
  except ValueError as e:
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

  # Fetch job details
  job = db.query(JobPost).filter(JobPost.job_id == match.job_id).first()
  if not job:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job post not found")

  explanation = generate_match_explanation(
    gap_profile     = match.gap_profile,
    job_title       = job.title,
    job_description = job.description,
    resume_text     = resume_text,
    viewer          = viewer,
  )

  # Cache on the match record
  match.explanation = explanation
  db.commit()

  return {"match_id": match_id, "explanation": explanation}


@router.patch("/{match_id}/interest", status_code=status.HTTP_200_OK)
def show_interest(
  match_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant),
):
  """Candidate marks interest in a job match. Notifies the recruiter."""
  candidate = get_candidate_or_404(current_user, db)
  match = db.query(Match).filter(Match.match_id == match_id).first()
  if not match:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
  if match.candidate_id != candidate.candidate_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only express interest in your own matches")

  if match.interested:
    return {"interested": True}

  match.interested = True

  job = db.query(JobPost).filter(JobPost.job_id == match.job_id).first()
  employer = db.query(Employer).filter(Employer.employer_id == job.employer_id).first() if job else None
  if employer:
    candidate_name = f"{current_user.f_name} {current_user.l_name}".strip()
    db.add(Notification(
      user_id     = employer.user_id,
      type        = "interest",
      title       = f"{candidate_name} is interested in {job.title}",
      description = f"{candidate_name} expressed interest in your job posting \"{job.title}\".",
      link        = f"/jobs/{job.job_id}/candidate/{candidate.candidate_id}",
      match_id    = match.match_id,
    ))

  db.commit()
  return {"interested": True}
