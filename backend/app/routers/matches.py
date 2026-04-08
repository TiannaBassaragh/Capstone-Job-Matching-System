from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.models import (
  Match, Candidate, CandidateCompetency, JobCompetency,
  Competency, Employer, JobPost, User
)
from app.schemas.schemas import MatchResponse
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
    existing.match_score     = result["match_score"]
    existing.knockout_failed = result["knockout_failed"]
    existing.gap_profile     = result["gap_profile"]
    existing.explanation     = result["explanation"]
  else:
    db.add(Match(
      candidate_id    = candidate_id,
      job_id          = job_id,
      match_score     = result["match_score"],
      knockout_failed = result["knockout_failed"],
      gap_profile     = result["gap_profile"],
      explanation     = result["explanation"],
    ))


# ─── triggers ────────────────────────────────────────────────────────────────

@router.post("/trigger", status_code=status.HTTP_202_ACCEPTED)
def trigger_candidate(
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant),
):
  """Candidate-triggered: score my resume and match against every job."""
  candidate = get_candidate_or_404(current_user, db)
  candidate_levels = _score_resume(candidate, db)

  jobs = db.query(JobPost).all()
  matched = knockout = 0

  for job in jobs:
    job_reqs = (
      db.query(JobCompetency)
      .filter(JobCompetency.job_id == job.job_id)
      .options(joinedload(JobCompetency.competency))
      .all()
    )
    if not job_reqs:
      continue

    result = compute_fit_score(candidate_levels, job_reqs)
    _upsert_match(candidate.candidate_id, job.job_id, result, db)
    matched += 1
    if result["knockout_failed"]:
      knockout += 1

  db.commit()
  return {"jobs_matched": matched, "knockouts": knockout}


@router.post("/trigger/{job_id}", status_code=status.HTTP_202_ACCEPTED)
def trigger_job(
  job_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter),
):
  """Recruiter-triggered: match this job against every candidate who is already scored."""
  employer = get_employer_or_404(current_user, db)

  job = db.query(JobPost).filter(JobPost.job_id == job_id).first()
  if not job:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job post not found")
  if job.employer_id != employer.employer_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only trigger matches for your own jobs")

  job_reqs = (
    db.query(JobCompetency)
    .filter(JobCompetency.job_id == job_id)
    .options(joinedload(JobCompetency.competency))
    .all()
  )
  if not job_reqs:
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Job has no scored competencies")

  # Only candidates who already have competency scores
  scored_candidate_ids = [
    row.candidate_id
    for row in db.query(CandidateCompetency.candidate_id).distinct().all()
  ]

  matched = knockout = 0

  for candidate_id in scored_candidate_ids:
    candidate_levels = {
      row.competency_id: row.level_score
      for row in db.query(CandidateCompetency)
      .filter(CandidateCompetency.candidate_id == candidate_id)
      .all()
    }
    result = compute_fit_score(candidate_levels, job_reqs)
    _upsert_match(candidate_id, job_id, result, db)
    matched += 1
    if result["knockout_failed"]:
      knockout += 1

  db.commit()
  return {"candidates_matched": matched, "knockouts": knockout}


# ─── read endpoints ───────────────────────────────────────────────────────────

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
