from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import (
  Candidate, Employer, User, JobPost, Match, CandidateCompetency, Competency, Resume
)
from app.services.resume_parser import parse_resume_bytes
from app.schemas.schemas import (
  PublicCandidateProfile, PublicCandidateCompetencyEntry, MatchForCandidateProfile,
  PublicEmployerProfile, PublicJobSummary, MatchForEmployerProfile,
)
from app.core.dependencies import require_applicant, require_recruiter

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("/candidate/{candidate_id}", response_model=PublicCandidateProfile)
def get_candidate_profile(
  candidate_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter),
):
  """Recruiter views a candidate's public profile with their match data for this recruiter's jobs."""
  employer = db.query(Employer).filter(Employer.user_id == current_user.user_id).first()
  if not employer:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer profile not found")

  candidate = db.query(Candidate).filter(Candidate.candidate_id == candidate_id).first()
  if not candidate:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

  user = db.query(User).filter(User.user_id == candidate.user_id).first()
  name = f"{user.f_name} {user.l_name}" if user else "Unknown"

  rows = (
    db.query(CandidateCompetency, Competency)
    .join(Competency, CandidateCompetency.competency_id == Competency.competency_id)
    .filter(CandidateCompetency.candidate_id == candidate_id)
    .order_by(CandidateCompetency.level_score.desc())
    .all()
  )
  competencies = [
    PublicCandidateCompetencyEntry(
      competency_name = comp.competency_name,
      category        = comp.category,
      level_score     = cc.level_score,
    )
    for cc, comp in rows
  ]

  employer_job_ids = [
    row.job_id
    for row in db.query(JobPost.job_id).filter(JobPost.employer_id == employer.employer_id).all()
  ]
  job_map = {
    j.job_id: j
    for j in db.query(JobPost).filter(JobPost.job_id.in_(employer_job_ids)).all()
  }
  match_rows = db.query(Match).filter(
    Match.candidate_id == candidate_id,
    Match.job_id.in_(employer_job_ids),
  ).all()
  matches = [
    MatchForCandidateProfile(
      match_id           = m.match_id,
      job_id             = m.job_id,
      job_title          = job_map[m.job_id].title if m.job_id in job_map else "Unknown",
      match_score        = m.match_score or 0.0,
      coverage           = m.coverage or 0.0,
      job_score          = (m.match_score or 0.0) * (m.coverage or 0.0),
      qualification_tier = m.qualification_tier or "unknown",
      knockout_failed    = m.knockout_failed,
      gap_profile        = m.gap_profile,
      explanation        = m.explanation,
    )
    for m in match_rows
  ]

  return PublicCandidateProfile(
    candidate_id  = candidate_id,
    name          = name,
    email         = user.email  if user else None,
    avatar        = user.avatar if user else None,
    tech_keywords = candidate.tech_keywords or [],
    competencies  = competencies,
    matches       = matches,
  )


@router.get("/candidate/{candidate_id}/resume/download")
def download_candidate_resume(
  candidate_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter),
):
  """Return the candidate's latest resume as a PDF download, for recruiters."""
  employer = db.query(Employer).filter(Employer.user_id == current_user.user_id).first()
  if not employer:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer profile not found")

  employer_job_ids = [
    row.job_id
    for row in db.query(JobPost.job_id).filter(JobPost.employer_id == employer.employer_id).all()
  ]
  if not db.query(Match).filter(
    Match.candidate_id == candidate_id,
    Match.job_id.in_(employer_job_ids),
  ).first():
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No match between this candidate and your jobs")

  resume = (
    db.query(Resume)
    .filter(Resume.candidate_id == candidate_id)
    .order_by(Resume.upload_date.desc())
    .first()
  )
  if not resume:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No resume on file for this candidate")

  from fastapi.responses import Response as FastAPIResponse
  return FastAPIResponse(
    content=resume.resume_file,
    media_type="application/pdf",
    headers={"Content-Disposition": f"attachment; filename=candidate_{candidate_id}_resume.pdf"}
  )


@router.get("/candidate/{candidate_id}/resume")
def get_candidate_resume_text(
  candidate_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter),
):
  """Return the parsed resume text of a candidate, provided they have matched with one of this recruiter's jobs."""
  employer = db.query(Employer).filter(Employer.user_id == current_user.user_id).first()
  if not employer:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer profile not found")

  employer_job_ids = [
    row.job_id
    for row in db.query(JobPost.job_id).filter(JobPost.employer_id == employer.employer_id).all()
  ]
  if not db.query(Match).filter(
    Match.candidate_id == candidate_id,
    Match.job_id.in_(employer_job_ids),
  ).first():
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No match between this candidate and your jobs")

  resume = (
    db.query(Resume)
    .filter(Resume.candidate_id == candidate_id)
    .order_by(Resume.upload_date.desc())
    .first()
  )
  if not resume:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No resume on file for this candidate")

  try:
    text = parse_resume_bytes(resume.resume_file)
  except ValueError as e:
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

  return {"candidate_id": candidate_id, "resume_text": text}


@router.get("/employer/{employer_id}", response_model=PublicEmployerProfile)
def get_employer_profile(
  employer_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant),
):
  """Applicant views an employer's public profile with their own match scores for that employer's active jobs."""
  candidate = db.query(Candidate).filter(Candidate.user_id == current_user.user_id).first()
  if not candidate:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found")

  employer = db.query(Employer).filter(Employer.employer_id == employer_id).first()
  if not employer:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer not found")

  jobs = (
    db.query(JobPost)
    .filter(JobPost.employer_id == employer_id, JobPost.is_active == True)
    .order_by(JobPost.created_at.desc())
    .all()
  )
  job_ids = [j.job_id for j in jobs]

  match_map = {
    m.job_id: m
    for m in db.query(Match).filter(
      Match.candidate_id == candidate.candidate_id,
      Match.job_id.in_(job_ids),
    ).all()
  }

  job_summaries = []
  for job in jobs:
    m = match_map.get(job.job_id)
    job_summaries.append(PublicJobSummary(
      job_id     = job.job_id,
      title      = job.title,
      is_active  = job.is_active,
      created_at = job.created_at,
      match      = MatchForEmployerProfile(
        match_id             = m.match_id,
        match_score          = m.match_score or 0.0,
        recommendation_score = m.recommendation_score or 0.0,
        qualification_tier   = m.qualification_tier or "unknown",
        knockout_failed      = m.knockout_failed,
      ) if m else None,
    ))

  return PublicEmployerProfile(
    employer_id  = employer.employer_id,
    company_name = employer.company_name,
    jobs         = job_summaries,
  )
