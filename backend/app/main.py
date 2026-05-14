import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, resumes, jobs, matches, competencies, questions, profiles, notifications
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
  title="Job Matching System API",
  description="API for matching job candidates to job postings using NLP",
  version="0.1.0"
)

_frontend_urls = [
  u.strip()
  for u in os.getenv("FRONTEND_URL", "http://localhost:3000").split(",")
  if u.strip()
]

app.add_middleware(
  CORSMiddleware,
  allow_origins=_frontend_urls,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(matches.router)
app.include_router(competencies.router)
app.include_router(questions.router)
app.include_router(profiles.router)
app.include_router(notifications.router)


@app.get("/", tags=["Health"])
def health_check():
  return {"status": "ok", "message": "Job Matching System API is running"}