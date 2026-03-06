from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import JobPost, Employer, User
from app.schemas.schemas import JobPostCreate, JobPostUpdate, JobPostResponse
from app.core.dependencies import get_current_user, require_recruiter

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

  for field, value in payload.model_dump(exclude_none=True).items():
    setattr(job, field, value)

  db.commit()
  db.refresh(job)
  return job


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