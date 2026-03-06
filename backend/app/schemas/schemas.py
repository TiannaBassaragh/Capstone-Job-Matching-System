from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime


# ─── AUTH ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
  f_name: str
  l_name: str
  email: EmailStr
  password: str
  account_type: Literal["applicant", "recruiter"]
  company_name: Optional[str] = None


class LoginRequest(BaseModel):
  email: EmailStr
  password: str


class TokenResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"


# ─── USERS ────────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
  user_id: int
  f_name: str
  l_name: str
  email: str
  account_type: str
  created_at: datetime

  class Config:
    from_attributes = True


class UserUpdate(BaseModel):
  f_name: Optional[str] = None
  l_name: Optional[str] = None
  email: Optional[EmailStr] = None
  password: Optional[str] = None


# ─── RESUMES ──────────────────────────────────────────────────────────────────

class ResumeResponse(BaseModel):
  resume_id: int
  candidate_id: int
  upload_date: datetime

  class Config:
    from_attributes = True


# ─── JOB POSTS ────────────────────────────────────────────────────────────────

class JobPostCreate(BaseModel):
  title: str
  description: str


class JobPostUpdate(BaseModel):
  title: Optional[str] = None
  description: Optional[str] = None


class JobPostResponse(BaseModel):
  job_id: int
  employer_id: int
  title: str
  description: str
  created_at: datetime

  class Config:
    from_attributes = True


# ─── COMPETENCIES ─────────────────────────────────────────────────────────────

class CompetencyResponse(BaseModel):
  competency_id: int
  competency_name: str
  category: Optional[str] = None

  class Config:
    from_attributes = True


# ─── MATCHES ──────────────────────────────────────────────────────────────────

class MatchResponse(BaseModel):
  match_id: int
  candidate_id: int
  job_id: int
  qualification_status: Optional[str] = None
  match_score: Optional[float] = None
  explanation: Optional[str] = None
  created_at: datetime

  class Config:
    from_attributes = True