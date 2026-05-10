from pydantic import BaseModel, EmailStr
from typing import Optional, Literal, List
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


class MeResponse(BaseModel):
  user_id: int
  f_name: str
  l_name: str
  email: str
  account_type: str
  created_at: datetime
  candidate_id: Optional[int] = None
  employer_id: Optional[int] = None
  company_name: Optional[str] = None

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
  is_active: bool = True
  created_at: datetime

  class Config:
    from_attributes = True


class JobStatusUpdate(BaseModel):
  is_active: bool


# ─── COMPETENCIES ─────────────────────────────────────────────────────────────

class CompetencyResponse(BaseModel):
  competency_id: int
  competency_name: str
  category: Optional[str] = None
  onet_element_id: Optional[str] = None
  description: Optional[str] = None

  class Config:
    from_attributes = True


# ─── COMPETENCY PROFILES ──────────────────────────────────────────────────────

class CandidateCompetencyEntry(BaseModel):
  competency_id:   int
  competency_name: str
  onet_element_id: Optional[str] = None
  category:        Optional[str] = None
  level_score:     Optional[float] = None

  class Config:
    from_attributes = True


class CandidateProfileResponse(BaseModel):
  candidate_id:  int
  tech_keywords: Optional[List[str]] = []
  competencies:  List[CandidateCompetencyEntry]


class JobCompetencyEntry(BaseModel):
  competency_id:    int
  competency_name:  str
  onet_element_id:  Optional[str] = None
  category:         Optional[str] = None
  required_level:   Optional[float] = None
  importance:       Optional[float] = None
  requirement_type: Optional[str] = None

  class Config:
    from_attributes = True


class JobProfileResponse(BaseModel):
  job_id:        int
  title:         str
  tech_keywords: Optional[List[str]] = []
  competencies:  List[JobCompetencyEntry]


# ─── CLARIFYING QUESTIONS ─────────────────────────────────────────────────────

class QuestionResponse(BaseModel):
  question_id:     int
  candidate_id:    Optional[int] = None
  job_id:          Optional[int] = None
  element_id:      str
  competency_name: str
  directed_at:     str
  reason:          str
  question_text:   str
  answer_text:     Optional[str] = None
  resolved:        bool
  created_at:      datetime

  class Config:
    from_attributes = True


class AnswerRequest(BaseModel):
  answer_text: str


# ─── RANKINGS / RECOMMENDATIONS ───────────────────────────────────────────────

class CandidateRankingEntry(BaseModel):
  rank: int
  match_id: int
  candidate_id: int
  candidate_name: str
  match_score: float
  coverage: float
  job_score: float
  qualification_tier: str
  knockout_failed: bool

  class Config:
    from_attributes = True


class JobRecommendation(BaseModel):
  rank: int
  match_id: int
  job_id: int
  employer_id: int
  title: str
  company_name: str
  match_score: float
  recommendation_score: float
  qualification_tier: str
  knockout_failed: bool
  explanation: Optional[str] = None
  gap_profile: Optional[dict] = None

  class Config:
    from_attributes = True


# ─── MATCHES ──────────────────────────────────────────────────────────────────

class TriggerRequest(BaseModel):
  job_id: int

class MatchResponse(BaseModel):
  match_id: int
  candidate_id: int
  job_id: int
  match_score: Optional[float] = None
  recommendation_score: Optional[float] = None
  knockout_failed: bool = False
  qualification_tier: Optional[str] = None
  gap_profile: Optional[dict] = None
  explanation: Optional[str] = None
  created_at: datetime

  class Config:
    from_attributes = True


# ─── PUBLIC PROFILES ──────────────────────────────────────────────────────────

class PublicCandidateCompetencyEntry(BaseModel):
  competency_name: str
  category: Optional[str] = None
  level_score: Optional[float] = None


class MatchForCandidateProfile(BaseModel):
  match_id: int
  job_id: int
  job_title: str
  match_score: float
  coverage: float
  job_score: float
  qualification_tier: str
  knockout_failed: bool


class PublicCandidateProfile(BaseModel):
  candidate_id: int
  name: str
  tech_keywords: Optional[List[str]] = []
  competencies: List[PublicCandidateCompetencyEntry]
  matches: List[MatchForCandidateProfile]


class MatchForEmployerProfile(BaseModel):
  match_id: int
  match_score: float
  recommendation_score: float
  qualification_tier: str
  knockout_failed: bool


class PublicJobSummary(BaseModel):
  job_id: int
  title: str
  is_active: bool
  created_at: datetime
  match: Optional[MatchForEmployerProfile] = None


class PublicEmployerProfile(BaseModel):
  employer_id: int
  company_name: Optional[str] = None
  jobs: List[PublicJobSummary]