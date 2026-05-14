from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import User, Candidate, Employer, CandidateCompetency, Competency
from app.schemas.schemas import UserResponse, UserUpdate, MeResponse, CandidateProfileResponse, CandidateCompetencyEntry, PasswordChangeRequest, CandidateProfileUpdate
from app.core.dependencies import get_current_user, require_applicant
from app.core.security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=MeResponse)
def get_me(
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  data = {
    "user_id":      current_user.user_id,
    "f_name":       current_user.f_name,
    "l_name":       current_user.l_name,
    "email":        current_user.email,
    "account_type": current_user.account_type,
    "created_at":   current_user.created_at,
    "avatar":       current_user.avatar,
  }

  if current_user.account_type == "applicant":
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.user_id).first()
    if candidate:
      data["candidate_id"] = candidate.candidate_id
      data["headline"]     = candidate.headline
      data["bio"]          = candidate.bio

  elif current_user.account_type == "recruiter":
    employer = db.query(Employer).filter(Employer.user_id == current_user.user_id).first()
    if employer:
      data["employer_id"]   = employer.employer_id
      data["company_name"]  = employer.company_name
      data["employer_logo"] = employer.logo

  return data


@router.get("/me/competencies", response_model=CandidateProfileResponse)
def get_my_competencies(
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant)
):
  """Return the competency profile extracted from the candidate's resume."""
  candidate = db.query(Candidate).filter(Candidate.user_id == current_user.user_id).first()
  if not candidate:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found")

  rows = (
    db.query(CandidateCompetency, Competency)
    .join(Competency, CandidateCompetency.competency_id == Competency.competency_id)
    .filter(CandidateCompetency.candidate_id == candidate.candidate_id)
    .all()
  )

  competencies = [
    CandidateCompetencyEntry(
      competency_id   = comp.competency_id,
      competency_name = comp.competency_name,
      onet_element_id = comp.onet_element_id,
      category        = comp.category,
      level_score     = cc.level_score,
    )
    for cc, comp in rows
  ]

  return CandidateProfileResponse(
    candidate_id  = candidate.candidate_id,
    tech_keywords = candidate.tech_keywords or [],
    competencies  = competencies,
  )


@router.post("/me/change-password", status_code=status.HTTP_200_OK)
def change_password(
  payload: PasswordChangeRequest,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  if not verify_password(payload.old_password, current_user.password):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Old password is incorrect")
  current_user.password = hash_password(payload.new_password)
  db.commit()
  return {"message": "Password changed successfully"}


@router.patch("/me/candidate-profile", status_code=status.HTTP_200_OK)
def update_candidate_profile(
  payload: CandidateProfileUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant),
):
  candidate = db.query(Candidate).filter(Candidate.user_id == current_user.user_id).first()
  if not candidate:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found")
  updates = payload.model_dump(exclude_none=True)
  for field, value in updates.items():
    setattr(candidate, field, value)
  db.commit()
  return {"headline": candidate.headline, "bio": candidate.bio}


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
  user_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  if current_user.user_id != user_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only access your own profile"
    )

  user = db.query(User).filter(User.user_id == user_id).first()
  if not user:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )

  return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
  user_id: int,
  payload: UserUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  if current_user.user_id != user_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only update your own profile"
    )

  user = db.query(User).filter(User.user_id == user_id).first()
  if not user:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )

  updates = payload.model_dump(exclude_none=True)
  if "password" in updates:
    updates["password"] = hash_password(updates["password"])

  company_name = updates.pop("company_name", None)
  logo         = updates.pop("logo",         None)
  for field, value in updates.items():
    setattr(user, field, value)

  if user.account_type == "recruiter" and (company_name is not None or logo is not None):
    employer = db.query(Employer).filter(Employer.user_id == user.user_id).first()
    if employer:
      if company_name is not None:
        employer.company_name = company_name
      if logo is not None:
        employer.logo = logo

  db.commit()
  db.refresh(user)
  return user


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
  user_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  if current_user.user_id != user_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only delete your own account"
    )

  user = db.query(User).filter(User.user_id == user_id).first()
  if not user:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )

  db.delete(user)
  db.commit()
  return {"message": "Account deleted successfully"}