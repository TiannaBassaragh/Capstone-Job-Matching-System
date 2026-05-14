from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.models.models import JobPost, Employer, User, Match, Candidate, JobCompetency, Competency, Notification
from app.schemas.schemas import JobPostCreate, JobPostUpdate, JobPostResponse, JobStatusUpdate, CandidateRankingEntry, JobProfileResponse, JobCompetencyEntry, ShortlistUpdate
from app.core.dependencies import get_current_user, require_recruiter
from app.services.scorer import score_job_post
from app.services.resume_parser import parse_resume_bytes
from app.routers.matches import _run_job_matching

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


@router.post("/parse-description", status_code=status.HTTP_200_OK)
async def parse_job_description(
  file: UploadFile = File(...),
  current_user: User = Depends(require_recruiter)
):
  """Extract plain text from an uploaded PDF or DOCX job description."""
  data = await file.read()
  try:
    text = parse_resume_bytes(data)
  except ValueError as e:
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
  return {"text": text}


@router.post("/", response_model=JobPostResponse, status_code=status.HTTP_201_CREATED)
def create_job(
  payload: JobPostCreate,
  background_tasks: BackgroundTasks,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter)
):
  employer = get_employer_or_404(current_user, db)

  job = JobPost(
    employer_id = employer.employer_id,
    title       = payload.title,
    description = payload.description,
    location    = payload.location,
    work_type   = payload.work_type,
    pay_low     = payload.pay_low,
    pay_high    = payload.pay_high,
    experience  = payload.experience,
    expires_at  = payload.expires_at,
  )
  db.add(job)
  db.commit()
  db.refresh(job)
  score_job_post(job, db)
  background_tasks.add_task(_run_job_matching, job.job_id)
  return job


@router.get("/", response_model=List[JobPostResponse])
def list_jobs(
  skip: int = Query(0, ge=0),
  limit: int = Query(50, ge=1, le=200),
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter)
):
  employer = get_employer_or_404(current_user, db)
  return db.query(JobPost).filter(JobPost.employer_id == employer.employer_id).offset(skip).limit(limit).all()


@router.get("/stats", status_code=status.HTTP_200_OK)
def get_employer_stats(
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter),
):
  """Unique candidate counts across all of this employer's jobs."""
  employer = get_employer_or_404(current_user, db)
  job_ids = [
    row.job_id
    for row in db.query(JobPost.job_id).filter(JobPost.employer_id == employer.employer_id).all()
  ]
  if not job_ids:
    return {"total_candidates": 0, "new_this_week": 0}

  total = db.query(func.count(func.distinct(Match.candidate_id))).filter(
    Match.job_id.in_(job_ids)
  ).scalar() or 0

  one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
  new_this_week = db.query(func.count(func.distinct(Match.candidate_id))).filter(
    Match.job_id.in_(job_ids),
    Match.created_at >= one_week_ago,
  ).scalar() or 0

  return {"total_candidates": total, "new_this_week": new_this_week}


@router.get("/{job_id}", response_model=JobPostResponse)
def get_job(
  job_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  job = get_job_or_404(job_id, db)
  if current_user.account_type == "recruiter":
    employer = get_employer_or_404(current_user, db)
    if job.employer_id != employer.employer_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own job posts")
  return job


@router.get("/{job_id}/competencies", response_model=JobProfileResponse)
def get_job_competencies(
  job_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  """Return the competency requirements extracted from a job posting."""
  job = get_job_or_404(job_id, db)
  if current_user.account_type == "recruiter":
    employer = get_employer_or_404(current_user, db)
    if job.employer_id != employer.employer_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view competencies for your own job posts")

  rows = (
    db.query(JobCompetency, Competency)
    .join(Competency, JobCompetency.competency_id == Competency.competency_id)
    .filter(JobCompetency.job_id == job_id)
    .all()
  )

  competencies = [
    JobCompetencyEntry(
      competency_id    = comp.competency_id,
      competency_name  = comp.competency_name,
      onet_element_id  = comp.onet_element_id,
      category         = comp.category,
      required_level   = jc.required_level,
      importance       = jc.importance,
      requirement_type = jc.requirement_type,
    )
    for jc, comp in rows
  ]

  return JobProfileResponse(
    job_id        = job.job_id,
    title         = job.title,
    tech_keywords = job.tech_keywords or [],
    competencies  = competencies,
  )


@router.put("/{job_id}", response_model=JobPostResponse)
def update_job(
  job_id: int,
  payload: JobPostUpdate,
  background_tasks: BackgroundTasks,
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
    background_tasks.add_task(_run_job_matching, job.job_id)

  return job


@router.patch("/{job_id}/status", response_model=JobPostResponse)
def set_job_status(
  job_id: int,
  payload: JobStatusUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter)
):
  employer = get_employer_or_404(current_user, db)
  job = get_job_or_404(job_id, db)
  if job.employer_id != employer.employer_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own job posts")
  job.is_active = payload.is_active
  db.commit()
  db.refresh(job)
  return job


@router.get("/{job_id}/rankings", response_model=List[CandidateRankingEntry])
def get_job_rankings(
  job_id: int,
  limit: int = Query(50, ge=1, le=200),
  tier: Optional[str] = Query(None, description="Filter by qualification_tier"),
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter),
):
  """Ranked list of candidates for a job, sorted by match score descending."""
  employer = get_employer_or_404(current_user, db)
  job = get_job_or_404(job_id, db)
  if job.employer_id != employer.employer_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view rankings for your own jobs")

  q = db.query(Match).filter(Match.job_id == job_id)
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
      job_id             = job_id,
      candidate_id       = m.candidate_id,
      candidate_name     = f"{user.f_name} {user.l_name}" if user else "Unknown",
      candidate_avatar   = user.avatar if user else None,
      match_score        = m.match_score or 0.0,
      coverage           = m.coverage or 0.0,
      job_score          = (m.match_score or 0.0) * (m.coverage or 0.0),
      qualification_tier = m.qualification_tier or "unknown",
      knockout_failed    = m.knockout_failed,
      shortlisted        = m.shortlisted,
      interested         = m.interested,
      match_created_at   = m.created_at,
    ))
  return result


@router.patch("/{job_id}/rankings/{candidate_id}/shortlist", status_code=status.HTTP_200_OK)
def set_shortlist(
  job_id: int,
  candidate_id: int,
  payload: ShortlistUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter),
):
  employer = get_employer_or_404(current_user, db)
  job = get_job_or_404(job_id, db)
  if job.employer_id != employer.employer_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only shortlist candidates for your own jobs")

  match = db.query(Match).filter(Match.job_id == job_id, Match.candidate_id == candidate_id).first()
  if not match:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

  match.shortlisted = payload.shortlisted

  if payload.shortlisted:
    candidate = db.query(Candidate).filter(Candidate.candidate_id == candidate_id).first()
    if candidate:
      db.add(Notification(
        user_id     = candidate.user_id,
        type        = "shortlisted",
        title       = f"You were shortlisted for {job.title}",
        description = f"A recruiter shortlisted you for the position \"{job.title}\".",
        link        = f"/matches/{match.match_id}",
        match_id    = match.match_id,
      ))

  db.commit()
  return {"shortlisted": match.shortlisted}


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
