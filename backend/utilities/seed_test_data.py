"""
seed_test_data.py

Seeds 10 candidates (with DOCX resumes) and 10 recruiters (with job posts).
All accounts use password: testpass123

Run from backend/utilities/:
  python seed_test_data.py
"""

import io
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv()

from docx import Document
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import User, Candidate, Employer, Resume, JobPost
from app.core.security import hash_password
from app.services.scorer import score_job_post

PASSWORD = hash_password("testpass123")


# ─── resume text content ──────────────────────────────────────────────────────

RESUMES = [
  {
    "name": ("Alice", "Chen"),
    "lines": [
      "Alice Chen — Senior Software Engineer",
      "Led a team of 8 engineers to architect and build a distributed cloud platform.",
      "Designed and implemented microservices using Python and Kubernetes.",
      "Mentored junior developers and conducted technical interviews.",
      "Drove migration of legacy monolith to event-driven architecture.",
      "Expert in Python, Go, and distributed systems.",
      "5 years of experience building high-availability backend services.",
    ],
  },
  {
    "name": ("Ben", "Okafor"),
    "lines": [
      "Ben Okafor — Mid-Level Backend Engineer",
      "Developed and maintained REST APIs using Python and FastAPI.",
      "Built data pipelines processing 10 million events per day.",
      "Implemented automated testing achieving 90% code coverage.",
      "Proficient in Python, PostgreSQL, and Redis.",
      "3 years of experience in backend development.",
    ],
  },
  {
    "name": ("Carla", "Reyes"),
    "lines": [
      "Carla Reyes — Data Scientist",
      "Designed machine learning pipelines for customer churn prediction.",
      "Implemented deep learning models using TensorFlow and PyTorch.",
      "Developed feature engineering frameworks adopted across the organisation.",
      "Expert in Python, scikit-learn, and statistical modelling.",
      "Published two internal research papers on anomaly detection.",
    ],
  },
  {
    "name": ("David", "Park"),
    "lines": [
      "David Park — DevOps Engineer",
      "Built and managed CI/CD pipelines using GitHub Actions and Jenkins.",
      "Architected cloud infrastructure on AWS supporting 500k daily users.",
      "Established monitoring and alerting systems using Prometheus and Grafana.",
      "Proficient in Terraform, Docker, Kubernetes, and Bash scripting.",
      "Led incident response and reduced mean time to recovery by 40%.",
    ],
  },
  {
    "name": ("Eva", "Novak"),
    "lines": [
      "Eva Novak — Machine Learning Engineer",
      "Implemented and deployed NLP models for document classification.",
      "Designed model evaluation frameworks and automated retraining pipelines.",
      "Built recommendation systems serving 1 million users daily.",
      "Proficient in Python, HuggingFace Transformers, and MLflow.",
      "Senior member of the AI platform team.",
    ],
  },
  {
    "name": ("Felix", "Huang"),
    "lines": [
      "Felix Huang — Junior Software Developer",
      "Assisted senior engineers in developing backend features for a SaaS platform.",
      "Helped fix bugs and write unit tests under supervision.",
      "Familiar with Python and basic REST API concepts.",
      "Exposure to Git version control and Agile workflows.",
      "Recently completed a Bachelor of Computer Science.",
    ],
  },
  {
    "name": ("Grace", "Osei"),
    "lines": [
      "Grace Osei — Product Manager",
      "Led cross-functional teams of 12 to deliver three major product releases.",
      "Drove product strategy aligned with company OKRs and customer research.",
      "Established roadmap prioritisation process adopted org-wide.",
      "Spearheaded launch of mobile app achieving 50k downloads in first month.",
      "Strong stakeholder management and communication skills.",
    ],
  },
  {
    "name": ("Henry", "Müller"),
    "lines": [
      "Henry Müller — QA Engineer",
      "Developed automated test suites using Selenium and Pytest.",
      "Led quality assurance for three production releases with zero critical bugs.",
      "Designed test plans and coordinated UAT with business stakeholders.",
      "Proficient in Python, Selenium, and JIRA.",
      "4 years of experience in software quality assurance.",
    ],
  },
  {
    "name": ("Isabel", "Santos"),
    "lines": [
      "Isabel Santos — Frontend Developer",
      "Developed and maintained React applications for a fintech dashboard.",
      "Built reusable component libraries reducing development time by 30%.",
      "Collaborated with UX designers to implement accessible interfaces.",
      "Proficient in React, TypeScript, and CSS.",
      "Familiar with REST API integration and basic backend concepts.",
    ],
  },
  {
    "name": ("James", "Wright"),
    "lines": [
      "James Wright — Junior Data Analyst",
      "Assisted the analytics team with data cleaning and basic reporting.",
      "Learning SQL and Python for data analysis tasks.",
      "Exposure to Tableau for dashboard creation.",
      "Helped prepare weekly business performance summaries.",
      "Recent graduate with a degree in Business Information Systems.",
    ],
  },
]


# ─── job descriptions ─────────────────────────────────────────────────────────

JOBS = [
  {
    "recruiter": ("Sarah", "Kim", "TechCorp"),
    "title": "Senior Software Engineer",
    "description": (
      "We are looking for a Senior Software Engineer to lead our backend platform team. "
      "Must have 5+ years of Python experience. Required: strong experience designing "
      "distributed systems and microservices. Essential: proven leadership of engineering teams. "
      "You will architect scalable solutions and mentor junior engineers."
    ),
  },
  {
    "recruiter": ("Sarah", "Kim", "TechCorp"),
    "title": "Junior Python Developer",
    "description": (
      "Entry-level position for a developer eager to grow. "
      "Basic Python knowledge required. Familiarity with REST APIs preferred. "
      "You will assist senior engineers in feature development and bug fixing. "
      "No prior professional experience necessary."
    ),
  },
  {
    "recruiter": ("Marcus", "Blaine", "DataHouse"),
    "title": "Data Scientist",
    "description": (
      "DataHouse is hiring a Data Scientist to build predictive models at scale. "
      "Must have expertise in machine learning and statistical modelling. "
      "Required: proficiency in Python and experience with TensorFlow or PyTorch. "
      "Essential: ability to design and evaluate ML pipelines end-to-end."
    ),
  },
  {
    "recruiter": ("Marcus", "Blaine", "DataHouse"),
    "title": "Data Analyst",
    "description": (
      "We need a Data Analyst to support our business intelligence team. "
      "Required: SQL proficiency. Python experience preferred but not mandatory. "
      "You will prepare reports, analyse trends, and present findings to stakeholders. "
      "Experience with Tableau or Power BI is a plus."
    ),
  },
  {
    "recruiter": ("Linda", "Torres", "CloudBase"),
    "title": "DevOps Engineer",
    "description": (
      "CloudBase is seeking a DevOps Engineer to own our cloud infrastructure. "
      "Must have hands-on experience with AWS or GCP. "
      "Required: proficiency with Terraform, Docker, and Kubernetes. "
      "Essential: experience building and managing CI/CD pipelines. "
      "You will lead reliability initiatives and drive infrastructure automation."
    ),
  },
  {
    "recruiter": ("Linda", "Torres", "CloudBase"),
    "title": "Site Reliability Engineer",
    "description": (
      "We are looking for an SRE to improve system reliability and observability. "
      "Required: experience with monitoring tools such as Prometheus or Datadog. "
      "Must have strong scripting skills in Python or Bash. "
      "Familiarity with incident management processes is essential."
    ),
  },
  {
    "recruiter": ("Omar", "Farouq", "AI Ventures"),
    "title": "Machine Learning Engineer",
    "description": (
      "AI Ventures is building next-generation NLP products. "
      "Must have experience deploying machine learning models to production. "
      "Required: proficiency in Python and HuggingFace Transformers. "
      "Essential: experience with model evaluation and monitoring. "
      "Strong research background preferred."
    ),
  },
  {
    "recruiter": ("Omar", "Farouq", "AI Ventures"),
    "title": "AI Research Intern",
    "description": (
      "We welcome students and recent graduates interested in AI research. "
      "Basic knowledge of machine learning concepts required. "
      "Familiarity with Python and numpy preferred. "
      "You will assist researchers in running experiments and analysing results."
    ),
  },
  {
    "recruiter": ("Nina", "Patel", "FinStack"),
    "title": "Full Stack Developer",
    "description": (
      "FinStack needs a Full Stack Developer for our trading platform. "
      "Required: proficiency in Python for backend and React for frontend. "
      "Must have experience building production-grade REST APIs. "
      "Essential: understanding of financial data and real-time systems."
    ),
  },
  {
    "recruiter": ("Nina", "Patel", "FinStack"),
    "title": "QA Automation Engineer",
    "description": (
      "We are looking for a QA Automation Engineer to own test quality. "
      "Required: experience writing automated test suites using Selenium or Cypress. "
      "Must have proficiency in Python or JavaScript for test scripting. "
      "Essential: ability to design test plans and lead UAT sessions."
    ),
  },
]


# ─── helpers ──────────────────────────────────────────────────────────────────

def make_docx(lines: list[str]) -> bytes:
  doc = Document()
  for line in lines:
    doc.add_paragraph(line)
  buf = io.BytesIO()
  doc.save(buf)
  return buf.getvalue()


def get_or_create_user(db: Session, email: str, f_name: str, l_name: str, account_type: str) -> User:
  user = db.query(User).filter(User.email == email).first()
  if not user:
    user = User(
      f_name=f_name,
      l_name=l_name,
      email=email,
      password=PASSWORD,
      account_type=account_type,
    )
    db.add(user)
    db.flush()
  return user


# ─── seeding ──────────────────────────────────────────────────────────────────

def seed_candidates(db: Session):
  print("Seeding candidates...")
  for r in RESUMES:
    f, l = r["name"]
    email = f"{f.lower()}.{l.lower()}@example.com"
    user = get_or_create_user(db, email, f, l, "applicant")

    candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
    if not candidate:
      candidate = Candidate(user_id=user.user_id)
      db.add(candidate)
      db.flush()

    existing_resume = db.query(Resume).filter(Resume.candidate_id == candidate.candidate_id).first()
    if not existing_resume:
      db.add(Resume(candidate_id=candidate.candidate_id, resume_file=make_docx(r["lines"])))

    print(f"  {f} {l} (candidate_id={candidate.candidate_id})")

  db.commit()


def seed_jobs(db: Session):
  print("Seeding recruiters and job posts...")
  for j in JOBS:
    rf, rl, company = j["recruiter"]
    email = f"{rf.lower()}.{rl.lower()}@{company.lower().replace(' ', '')}.com"
    user = get_or_create_user(db, email, rf, rl, "recruiter")

    employer = db.query(Employer).filter(Employer.user_id == user.user_id).first()
    if not employer:
      employer = Employer(user_id=user.user_id, company_name=company)
      db.add(employer)
      db.flush()

    existing_job = db.query(JobPost).filter(
      JobPost.employer_id == employer.employer_id,
      JobPost.title == j["title"],
    ).first()
    if not existing_job:
      job = JobPost(employer_id=employer.employer_id, title=j["title"], description=j["description"])
      db.add(job)
      db.commit()
      db.refresh(job)
      score_job_post(job, db)

    print(f"  {j['title']} @ {company}")


def main():
  db: Session = SessionLocal()
  try:
    seed_candidates(db)
    seed_jobs(db)
    print("Done.")
  finally:
    db.close()


if __name__ == "__main__":
  main()
