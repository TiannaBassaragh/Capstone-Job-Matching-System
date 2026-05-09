from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import JobPost, Employer, User, Match, Candidate
from app.schemas.schemas import JobPostCreate, JobPostUpdate, JobPostResponse, CandidateRankingEntry
from app.core.dependencies import get_current_user, require_recruiter
from app.services.scorer import score_job_post

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def get_employer_or_404(user: User, db: Session) -> Employer:
  employer = db.query(Employer).filter(Employer.user_id == user.user_id).first()
  if not employer:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Employer profile not found"
    )
  return employer


def get_job_or_404(job_id: int, db: Session) -> JobPost:
  job = db.query(JobPost).filter(JobPost.job_id == job_id).first()
  if not job:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Job post not found"
    )
  return job


@router.post("/", response_model=JobPostResponse, status_code=status.HTTP_201_CREATED)
def create_job(
  payload: JobPostCreate,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter)
):
  employer = get_employer_or_404(current_user, db)

  job = JobPost(
    employer_id=employer.employer_id,
    title=payload.title,
    description=payload.description
  )
  db.add(job)
  db.commit()
  db.refresh(job)
  score_job_post(job, db)
  return job


@router.get("/", response_model=List[JobPostResponse])
def list_jobs(
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  return db.query(JobPost).all()


@router.get("/{job_id}", response_model=JobPostResponse)
def get_job(
  job_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  return get_job_or_404(job_id, db)


@router.put("/{job_id}", response_model=JobPostResponse)
def update_job(
  job_id: int,
  payload: JobPostUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter)
):
  employer = get_employer_or_404(current_user, db)
  job = get_job_or_404(job_id, db)

  if job.employer_id != employer.employer_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only update your own job posts"
    )

  updated_fields = payload.model_dump(exclude_none=True)
  description_changed = "description" in updated_fields

  for field, value in updated_fields.items():
    setattr(job, field, value)

  db.commit()
  db.refresh(job)

  if description_changed:
    score_job_post(job, db)

  return job


@router.get("/{job_id}/rankings", response_model=List[CandidateRankingEntry])
def get_job_rankings(
  job_id: int,
  limit: int = Query(50, ge=1, le=200),
  tier: Optional[str] = Query(None, description="Filter by qualification_tier"),
  exclude_knockouts: bool = Query(True, description="Hide knockout-failed candidates"),
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter),
):
  """Ranked list of candidates for a job, sorted by match score descending."""
  employer = get_employer_or_404(current_user, db)
  job = get_job_or_404(job_id, db)
  if job.employer_id != employer.employer_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view rankings for your own jobs")

  q = db.query(Match).filter(Match.job_id == job_id)
  if exclude_knockouts:
    q = q.filter(Match.knockout_failed == False)
  if tier:
    q = q.filter(Match.qualification_tier == tier)
  # Over-fetch then sort in Python by coverage-scaled fit score.
  matches = q.limit(limit * 10).all()
  matches = sorted(
    matches,
    key=lambda m: (m.match_score or 0.0) * (m.coverage or 0.0),
    reverse=True,
  )[:limit]

  # batch-load candidates and users
  candidate_ids = [m.candidate_id for m in matches]
  candidates = {
    c.candidate_id: c
    for c in db.query(Candidate).filter(Candidate.candidate_id.in_(candidate_ids)).all()
  }
  user_ids = [c.user_id for c in candidates.values()]
  users = {
    u.user_id: u
    for u in db.query(User).filter(User.user_id.in_(user_ids)).all()
  }

  result = []
  for rank, m in enumerate(matches, start=1):
    cand = candidates.get(m.candidate_id)
    user = users.get(cand.user_id) if cand else None
    result.append(CandidateRankingEntry(
      rank               = rank,
      match_id           = m.match_id,
      candidate_id       = m.candidate_id,
      candidate_name     = f"{user.f_name} {user.l_name}" if user else "Unknown",
      match_score        = m.match_score or 0.0,
      coverage           = m.coverage or 0.0,
      job_score          = (m.match_score or 0.0) * (m.coverage or 0.0),
      qualification_tier = m.qualification_tier or "unknown",
      knockout_failed    = m.knockout_failed,
    ))
  return result


@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
def delete_job(
  job_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter)
):
  employer = get_employer_or_404(current_user, db)
  job = get_job_or_404(job_id, db)

  if job.employer_id != employer.employer_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only delete your own job posts"
    )

  db.delete(job)
  db.commit()
  return {"message": "Job post deleted successfully"}
