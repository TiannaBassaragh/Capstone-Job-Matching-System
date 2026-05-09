from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db, SessionLocal
from app.models.models import (
  Match, Candidate, CandidateCompetency, JobCompetency,
  Competency, Employer, JobPost, User
)
from app.schemas.schemas import MatchResponse, JobRecommendation
from app.core.dependencies import get_current_user, require_applicant, require_recruiter
from app.services.scorer import compute_fit_score

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


# ─── background workers ───────────────────────────────────────────────────────

def _run_candidate_matching(candidate_id: int) -> None:
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
    for job in db.query(JobPost).all():
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


def _run_job_matching(job_id: int) -> None:
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
  limit: int = Query(10, ge=1, le=50),
  tier: Optional[str] = Query(None, description="Filter by qualification_tier"),
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant),
):
  """Top job matches for the logged-in candidate, sorted by match score descending."""
  candidate = get_candidate_or_404(current_user, db)

  q = (
    db.query(Match)
    .filter(Match.candidate_id == candidate.candidate_id)
    .filter(Match.knockout_failed == False)
  )
  if tier:
    q = q.filter(Match.qualification_tier == tier)
  matches = q.order_by(Match.recommendation_score.desc()).limit(limit).all()

  # batch-load jobs and employers
  job_ids = [m.job_id for m in matches]
  jobs = {j.job_id: j for j in db.query(JobPost).filter(JobPost.job_id.in_(job_ids)).all()}
  employer_ids = [j.employer_id for j in jobs.values()]
  employers = {
    e.employer_id: e
    for e in db.query(Employer).filter(Employer.employer_id.in_(employer_ids)).all()
  }

  result = []
  for rank, m in enumerate(matches, start=1):
    job = jobs.get(m.job_id)
    employer = employers.get(job.employer_id) if job else None
    result.append(JobRecommendation(
      rank                 = rank,
      match_id             = m.match_id,
      job_id               = m.job_id,
      title                = job.title if job else "Unknown",
      company_name         = employer.company_name if employer else "Unknown",
      match_score          = m.match_score or 0.0,
      recommendation_score = m.recommendation_score or 0.0,
      qualification_tier   = m.qualification_tier or "unknown",
      knockout_failed      = m.knockout_failed,
    ))
  return result


@router.get("/candidate/{candidate_id}", response_model=List[MatchResponse])
def get_matches_for_candidate(
  candidate_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant)
):
  candidate = get_candidate_or_404(current_user, db)
  if candidate.candidate_id != candidate_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own matches")
  return db.query(Match).filter(Match.candidate_id == candidate_id).all()


@router.get("/job/{job_id}", response_model=List[MatchResponse])
def get_matches_for_job(
  job_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter)
):
  employer = get_employer_or_404(current_user, db)
  job = db.query(JobPost).filter(JobPost.job_id == job_id).first()
  if not job:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job post not found")
  if job.employer_id != employer.employer_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view matches for your own job posts")
  return db.query(Match).filter(Match.job_id == job_id).all()


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
