from sqlalchemy import (
  Column, Integer, String, Text, Float, Boolean,
  TIMESTAMP, LargeBinary, ForeignKey, UniqueConstraint, CheckConstraint
)
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
  __tablename__ = "users"

  user_id      = Column(Integer, primary_key=True, autoincrement=True)
  f_name       = Column(String(100), nullable=False)
  l_name       = Column(String(100), nullable=False)
  email        = Column(String(150), unique=True, nullable=False)
  password     = Column(String(150), nullable=False)
  account_type = Column(String(20), CheckConstraint("account_type IN ('applicant', 'recruiter')"), nullable=False)
  avatar       = Column(Text, nullable=True)
  created_at   = Column(TIMESTAMP, server_default=func.now())

  candidate     = relationship("Candidate",    back_populates="user", uselist=False, passive_deletes=True)
  employer      = relationship("Employer",     back_populates="user", uselist=False, passive_deletes=True)
  notifications = relationship("Notification", back_populates="user", passive_deletes=True)


class TechSkill(Base):
  __tablename__ = "tech_skills"

  tech_id = Column(Integer, primary_key=True, autoincrement=True)
  name    = Column(String(200), unique=True, nullable=False)


class Candidate(Base):
  __tablename__ = "candidates"

  candidate_id  = Column(Integer, primary_key=True, autoincrement=True)
  user_id       = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
  tech_keywords = Column(JSON, nullable=True)   # extracted from most-recent resume
  headline      = Column(String(200), nullable=True)
  bio           = Column(Text, nullable=True)

  user         = relationship("User", back_populates="candidate")
  resumes      = relationship("Resume", back_populates="candidate", passive_deletes=True)
  competencies = relationship("CandidateCompetency", back_populates="candidate", passive_deletes=True)
  matches      = relationship("Match", back_populates="candidate", passive_deletes=True)
  questions    = relationship("ClarifyingQuestion", back_populates="candidate", cascade="all, delete-orphan")


class Employer(Base):
  __tablename__ = "employers"

  employer_id  = Column(Integer, primary_key=True, autoincrement=True)
  user_id      = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
  company_name = Column(String(200))
  logo         = Column(Text, nullable=True)

  user      = relationship("User", back_populates="employer")
  job_posts = relationship("JobPost", back_populates="employer", passive_deletes=True)


class Resume(Base):
  __tablename__ = "resumes"

  resume_id    = Column(Integer, primary_key=True, autoincrement=True)
  candidate_id = Column(Integer, ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=False)
  resume_file  = Column(LargeBinary)  # BYTEA in PostgreSQL
  upload_date  = Column(TIMESTAMP, server_default=func.now())

  candidate = relationship("Candidate", back_populates="resumes")


class JobPost(Base):
  __tablename__ = "job_post"

  job_id        = Column(Integer, primary_key=True, autoincrement=True)
  employer_id   = Column(Integer, ForeignKey("employers.employer_id", ondelete="CASCADE"), nullable=False)
  title         = Column(String(200))
  description   = Column(Text)
  location      = Column(String(50),  nullable=True)
  work_type     = Column(String(50),  nullable=True)
  pay_low       = Column(Integer,     nullable=True)
  pay_high      = Column(Integer,     nullable=True)
  experience    = Column(String(50),  nullable=True)
  tech_keywords = Column(JSON, nullable=True)
  is_active     = Column(Boolean, default=True, nullable=False)
  expires_at    = Column(TIMESTAMP, nullable=True)
  created_at    = Column(TIMESTAMP, server_default=func.now())

  employer     = relationship("Employer", back_populates="job_posts")
  competencies = relationship("JobCompetency", back_populates="job", passive_deletes=True)
  matches      = relationship("Match", back_populates="job", passive_deletes=True)
  questions    = relationship("ClarifyingQuestion", back_populates="job", cascade="all, delete-orphan")


class Competency(Base):
  __tablename__ = "competencies"

  competency_id   = Column(Integer, primary_key=True, autoincrement=True)
  competency_name = Column(String(200), nullable=False)
  category        = Column(String(100))
  onet_element_id = Column(String(20), unique=True)
  description     = Column(Text)

  candidate_competencies = relationship("CandidateCompetency", back_populates="competency")
  job_competencies       = relationship("JobCompetency",       back_populates="competency")
  level_anchors          = relationship("LevelScaleAnchor",    back_populates="competency")


class LevelScaleAnchor(Base):
  __tablename__ = "level_scale_anchors"

  id                 = Column(Integer, primary_key=True, autoincrement=True)
  onet_element_id    = Column(String(20), ForeignKey("competencies.onet_element_id", ondelete="CASCADE"), nullable=False)
  anchor_value       = Column(Integer, nullable=False)
  anchor_description = Column(String(1000), nullable=False)

  competency = relationship("Competency", back_populates="level_anchors")

  __table_args__ = (
    UniqueConstraint("onet_element_id", "anchor_value", name="uq_anchor"),
  )


class CandidateCompetency(Base):
  __tablename__ = "candidate_competencies"

  candidate_id  = Column(Integer, ForeignKey("candidates.candidate_id", ondelete="CASCADE"), primary_key=True)
  competency_id = Column(Integer, ForeignKey("competencies.competency_id"), primary_key=True)
  level_score   = Column(Float, nullable=True)

  candidate  = relationship("Candidate",  back_populates="competencies")
  competency = relationship("Competency", back_populates="candidate_competencies")


class JobCompetency(Base):
  __tablename__ = "job_competencies"

  job_id           = Column(Integer, ForeignKey("job_post.job_id", ondelete="CASCADE"), primary_key=True)
  competency_id    = Column(Integer, ForeignKey("competencies.competency_id"), primary_key=True)
  required_level   = Column(Float, nullable=True)
  importance       = Column(Float)
  requirement_type = Column(String(10), CheckConstraint("requirement_type IN ('required', 'preferred')"))

  job        = relationship("JobPost",    back_populates="competencies")
  competency = relationship("Competency", back_populates="job_competencies")


class Match(Base):
  __tablename__ = "matches"

  match_id        = Column(Integer, primary_key=True, autoincrement=True)
  candidate_id    = Column(Integer, ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=False)
  job_id          = Column(Integer, ForeignKey("job_post.job_id",         ondelete="CASCADE"), nullable=False)
  match_score          = Column(Float)
  coverage             = Column(Float)           # scored_dims / total_dims
  recommendation_score = Column(Float)           # candidate-side: blends fit, recall, tech overlap
  knockout_failed      = Column(Boolean, default=False)
  shortlisted          = Column(Boolean, default=False, nullable=False)
  interested           = Column(Boolean, default=False, nullable=False)
  qualification_tier   = Column(String(30))
  gap_profile          = Column(JSON)
  explanation          = Column(Text)
  created_at      = Column(TIMESTAMP, server_default=func.now())

  __table_args__ = (
    UniqueConstraint("candidate_id", "job_id", name="uq_candidate_job"),
  )

  candidate = relationship("Candidate", back_populates="matches")
  job       = relationship("JobPost",   back_populates="matches")


class ClarifyingQuestion(Base):
  __tablename__ = "clarifying_questions"

  question_id     = Column(Integer, primary_key=True, autoincrement=True)
  # Exactly one of candidate_id or job_id is set.
  candidate_id    = Column(Integer, ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=True)
  job_id          = Column(Integer, ForeignKey("job_post.job_id",         ondelete="CASCADE"), nullable=True)
  element_id      = Column(String(20), nullable=False)
  competency_name = Column(String(200), nullable=False)
  directed_at     = Column(String(10), CheckConstraint("directed_at IN ('candidate', 'recruiter')"), nullable=False)
  # reason: "candidate_level_unknown" | "required_level_unknown" | "importance_unknown"
  reason          = Column(String(30), nullable=False)
  question_text   = Column(Text, nullable=False)
  answer_text     = Column(Text, nullable=True)
  resolved        = Column(Boolean, default=False, nullable=False)
  created_at      = Column(TIMESTAMP, server_default=func.now())

  candidate = relationship("Candidate", back_populates="questions")
  job       = relationship("JobPost",   back_populates="questions")


class Notification(Base):
  __tablename__ = "notifications"

  notification_id = Column(Integer, primary_key=True, autoincrement=True)
  user_id         = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
  type            = Column(String(30), nullable=False)
  title           = Column(String(300), nullable=False)
  description     = Column(Text, nullable=True)
  link            = Column(String(300), nullable=True)
  read            = Column(Boolean, default=False, nullable=False)
  match_id        = Column(Integer, ForeignKey("matches.match_id", ondelete="SET NULL"), nullable=True)
  created_at      = Column(TIMESTAMP, server_default=func.now())

  user  = relationship("User",  back_populates="notifications")
  match = relationship("Match")
