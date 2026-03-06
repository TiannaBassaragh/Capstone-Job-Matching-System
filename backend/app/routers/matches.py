from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Match, Candidate, Employer, User
from app.schemas.schemas import MatchResponse
from app.core.dependencies import get_current_user, require_applicant, require_recruiter

router = APIRouter(prefix="/matches", tags=["Matches"])


def get_candidate_or_404(user: User, db: Session) -> Candidate:
  candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
  if not candidate:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Candidate profile not found"
    )
  return candidate


def get_employer_or_404(user: User, db: Session) -> Employer:
  employer = db.query(Employer).filter(Employer.user_id == user.user_id).first()
  if not employer:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Employer profile not found"
    )
  return employer


@router.post("/trigger", status_code=status.HTTP_202_ACCEPTED)
def trigger_matching(
  current_user: User = Depends(get_current_user)
):
  # STUB — matching pipeline not yet implemented
  return {
    "message": "Matching pipeline triggered",
    "status": "pending",
    "matches": [
      {
        "match_id": 1,
        "candidate_id": 1,
        "job_id": 1,
        "qualification_status": "qualified",
        "match_score": 0.87,
        "explanation": "Stub match result — pipeline not yet implemented"
      }
    ]
  }


@router.get("/candidate/{candidate_id}", response_model=List[MatchResponse])
def get_matches_for_candidate(
  candidate_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant)
):
  candidate = get_candidate_or_404(current_user, db)

  if candidate.candidate_id != candidate_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only view your own matches"
    )

  return db.query(Match).filter(Match.candidate_id == candidate_id).all()


@router.get("/job/{job_id}", response_model=List[MatchResponse])
def get_matches_for_job(
  job_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter)
):
  employer = get_employer_or_404(current_user, db)

  job = db.query(Match).filter(Match.job_id == job_id).first()
  if job and job.candidate_id not in [
    e.candidate_id for e in db.query(Match).filter(Match.job_id == job_id).all()
  ]:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only view matches for your own job posts"
    )

  return db.query(Match).filter(Match.job_id == job_id).all()


@router.get("/{match_id}", response_model=MatchResponse)
def get_match(
  match_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  match = db.query(Match).filter(Match.match_id == match_id).first()
  if not match:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Match not found"
    )

  if current_user.account_type == "applicant":
    candidate = get_candidate_or_404(current_user, db)
    if match.candidate_id != candidate.candidate_id:
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You can only view your own matches"
      )
  else:
    employer = get_employer_or_404(current_user, db)
    job_belongs_to_employer = db.query(Match).join(
      Match.job
    ).filter(
      Match.match_id == match_id,
      Match.job.has(employer_id=employer.employer_id)
    ).first()
    if not job_belongs_to_employer:
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You can only view matches for your own job posts"
      )

  return match