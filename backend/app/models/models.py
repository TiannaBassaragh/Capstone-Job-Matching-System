from sqlalchemy import (
    Column, Integer, String, Text, Float, Enum,
    TIMESTAMP, LargeBinary, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
  __tablename__ = "users"

  user_id = Column(Integer, primary_key=True, autoincrement=True)
  f_name = Column(String(100), nullable=False)
  l_name = Column(String(100), nullable=False)
  email = Column(String(150), unique=True, nullable=False)
  password = Column(String(150), nullable=False)
  account_type = Column(Enum("applicant", "recruiter"), nullable=False)
  created_at = Column(TIMESTAMP, server_default=func.now())

  candidate = relationship("Candidate", back_populates="user", uselist=False)
  employer = relationship("Employer", back_populates="user", uselist=False)


class Candidate(Base):
  __tablename__ = "candidates"

  candidate_id = Column(Integer, primary_key=True, autoincrement=True)
  user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)

  user = relationship("User", back_populates="candidate")
  resumes = relationship("Resume", back_populates="candidate")
  competencies = relationship("CandidateCompetency", back_populates="candidate")
  matches = relationship("Match", back_populates="candidate")


class Employer(Base):
  __tablename__ = "employers"

  employer_id = Column(Integer, primary_key=True, autoincrement=True)
  user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
  company_name = Column(String(200))

  user = relationship("User", back_populates="employer")
  job_posts = relationship("JobPost", back_populates="employer")


class Resume(Base):
  __tablename__ = "resumes"

  resume_id = Column(Integer, primary_key=True, autoincrement=True)
  candidate_id = Column(Integer, ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=False)
  resume_file = Column(LargeBinary(length=2**32 - 1))  # LONGBLOB
  upload_date = Column(TIMESTAMP, server_default=func.now())

  candidate = relationship("Candidate", back_populates="resumes")


class JobPost(Base):
  __tablename__ = "job_post"

  job_id = Column(Integer, primary_key=True, autoincrement=True)
  employer_id = Column(Integer, ForeignKey("employers.employer_id", ondelete="CASCADE"), nullable=False)
  title = Column(String(200))
  description = Column(Text)
  created_at = Column(TIMESTAMP, server_default=func.now())

  employer = relationship("Employer", back_populates="job_posts")
  competencies = relationship("JobCompetency", back_populates="job")
  matches = relationship("Match", back_populates="job")


class Competency(Base):
  __tablename__ = "competencies"

  competency_id = Column(Integer, primary_key=True, autoincrement=True)
  competency_name = Column(String(200), unique=True, nullable=False)
  category = Column(String(100))

  candidate_competencies = relationship("CandidateCompetency", back_populates="competency")
  job_competencies = relationship("JobCompetency", back_populates="competency")


class CandidateCompetency(Base):
  __tablename__ = "candidate_competencies"

  candidate_id = Column(Integer, ForeignKey("candidates.candidate_id", ondelete="CASCADE"), primary_key=True)
  competency_id = Column(Integer, ForeignKey("competencies.competency_id"), primary_key=True)
  proficiency_level = Column(String(50))
  years_experience = Column(Integer)

  candidate = relationship("Candidate", back_populates="competencies")
  competency = relationship("Competency", back_populates="candidate_competencies")


class JobCompetency(Base):
  __tablename__ = "job_competencies"

  job_id = Column(Integer, ForeignKey("job_post.job_id", ondelete="CASCADE"), primary_key=True)
  competency_id = Column(Integer, ForeignKey("competencies.competency_id"), primary_key=True)
  requirement_type = Column(Enum("required", "preferred"))
  weight = Column(Float)

  job = relationship("JobPost", back_populates="competencies")
  competency = relationship("Competency", back_populates="job_competencies")


class Match(Base):
  __tablename__ = "matches"

  match_id = Column(Integer, primary_key=True, autoincrement=True)
  candidate_id = Column(Integer, ForeignKey("candidates.candidate_id", ondelete="CASCADE"), nullable=False)
  job_id = Column(Integer, ForeignKey("job_post.job_id", ondelete="CASCADE"), nullable=False)
  qualification_status = Column(Enum("qualified", "not_qualified"))
  match_score = Column(Float)
  explanation = Column(Text)
  created_at = Column(TIMESTAMP, server_default=func.now())

  __table_args__ = (
    UniqueConstraint("candidate_id", "job_id", name="uq_candidate_job"),
  )

  candidate = relationship("Candidate", back_populates="matches")
  job = relationship("JobPost", back_populates="matches")
