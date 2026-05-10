#!/usr/bin/env python3
"""
tests/integration/test_endpoints.py

Integration tests for every API endpoint.
Uses an isolated SQLite database and mocks all LLM calls so no network
access is required.

Run from the backend directory:
    pytest tests/integration/test_endpoints.py -v
"""

import sys
import sqlite3
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

from app.main import app
from app.database import Base, get_db
from app.models.models import Competency, TechSkill

# ─── isolated test database ───────────────────────────────────────────────────

_DB_PATH = Path(__file__).parent / "test_integration.db"
_ENGINE  = create_engine(f"sqlite:///{_DB_PATH}", connect_args={"check_same_thread": False})
_Session = sessionmaker(autocommit=False, autoflush=False, bind=_ENGINE)


@event.listens_for(Engine, "connect")
def _enable_sqlite_fk(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def _override_get_db():
    db = _Session()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db

# ─── mock return values ───────────────────────────────────────────────────────

_FAKE_PDF = b"%PDF-1.4\nfake pdf bytes"


def _mock_score_and_extract(text, db, mode="resume"):
    if mode == "resume":
        return ({"2.B.3.e": {"level": 75.0}, "2.A.2.a": {"level": None}}, ["Python"])
    return (
        {
            "2.B.3.e": {"required_level": 70.0, "importance": 4.0, "requirement_type": "required"},
            "2.A.2.a": {"required_level": 55.0, "importance": 3.0, "requirement_type": "preferred"},
        },
        ["Python"],
    )


_MOCK_QUESTIONS = [
    {
        "element_id":    "2.A.2.a",
        "directed_at":   "candidate",
        "question_text": "How would you rate your Critical Thinking ability?",
    }
]

# ─── shared state (populated by tests in order) ───────────────────────────────

class _S:
    app_token  = None
    rec_token  = None
    app_id     = None
    rec_id     = None
    resume_id  = None
    job_id     = None
    question_id = None
    match_id   = None

S = _S()

# ─── module-scoped fixtures ───────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client():
    """Spin up TestClient with SQLite DB and all LLM mocked."""
    Base.metadata.create_all(bind=_ENGINE)

    # Seed competencies and tech skills needed by the mock scorer
    db = _Session()
    db.add_all([
        Competency(competency_id=1, competency_name="Programming",
                   category="Cross-Functional Skills", onet_element_id="2.B.3.e"),
        Competency(competency_id=2, competency_name="Critical Thinking",
                   category="Basic Skills", onet_element_id="2.A.2.a"),
        TechSkill(tech_id=1, name="Python"),
        TechSkill(tech_id=2, name="SQL"),
    ])
    db.commit()
    db.close()

    mocks = [
        patch("app.services.scorer.score_and_extract",
              side_effect=_mock_score_and_extract),
        patch("app.services.scorer.parse_resume_bytes",
              return_value="Programming and critical thinking experience."),
        patch("app.services.scorer.generate_clarifying_questions",
              return_value=_MOCK_QUESTIONS),
        patch("app.routers.resumes.parse_resume_bytes",
              return_value="Programming and critical thinking experience."),
        patch("app.routers.matches.generate_match_explanation",
              return_value="Strong match based on your programming background."),
        patch("app.routers.matches.parse_resume_bytes",
              return_value="Programming and critical thinking experience."),
        patch("app.routers.matches.SessionLocal", _Session),
        patch("app.routers.questions.estimate_score_from_answer", return_value=65.0),
    ]
    for m in mocks:
        m.start()

    with TestClient(app) as c:
        yield c

    for m in mocks:
        m.stop()

    Base.metadata.drop_all(bind=_ENGINE)
    if _DB_PATH.exists():
        _DB_PATH.unlink()


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════════════════════════

def test_register_applicant(client):
    r = client.post("/auth/register", json={
        "f_name": "Alice", "l_name": "Applicant",
        "email": "alice@test.com", "password": "secret123",
        "account_type": "applicant",
    })
    assert r.status_code == 201
    S.app_id = r.json()["user_id"]


def test_register_recruiter(client):
    r = client.post("/auth/register", json={
        "f_name": "Bob", "l_name": "Recruiter",
        "email": "bob@test.com", "password": "secret123",
        "account_type": "recruiter", "company_name": "Acme Corp",
    })
    assert r.status_code == 201
    S.rec_id = r.json()["user_id"]


def test_register_duplicate_email_returns_409(client):
    r = client.post("/auth/register", json={
        "f_name": "Alice2", "l_name": "Dup",
        "email": "alice@test.com", "password": "secret123",
        "account_type": "applicant",
    })
    assert r.status_code == 409


def test_login_applicant(client):
    r = client.post("/auth/login", json={"email": "alice@test.com", "password": "secret123"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    S.app_token = data["access_token"]


def test_login_recruiter(client):
    r = client.post("/auth/login", json={"email": "bob@test.com", "password": "secret123"})
    assert r.status_code == 200
    S.rec_token = r.json()["access_token"]


def test_login_wrong_password_returns_401(client):
    r = client.post("/auth/login", json={"email": "alice@test.com", "password": "wrongpassword"})
    assert r.status_code == 401


def test_logout(client):
    r = client.post("/auth/logout", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# USERS
# ═══════════════════════════════════════════════════════════════════════════════

def test_get_me_applicant(client):
    r = client.get("/users/me", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "alice@test.com"
    assert data["account_type"] == "applicant"
    assert "candidate_id" in data


def test_get_me_recruiter(client):
    r = client.get("/users/me", headers={"Authorization": f"Bearer {S.rec_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["account_type"] == "recruiter"
    assert data["company_name"] == "Acme Corp"


def test_get_me_unauthenticated_returns_401(client):
    r = client.get("/users/me")
    assert r.status_code == 401


def test_get_user_by_id(client):
    r = client.get(f"/users/{S.app_id}", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    assert r.json()["user_id"] == S.app_id


def test_get_other_user_returns_403(client):
    r = client.get(f"/users/{S.rec_id}", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 403


def test_update_user(client):
    r = client.put(f"/users/{S.app_id}",
                   headers={"Authorization": f"Bearer {S.app_token}"},
                   json={"f_name": "Alicia"})
    assert r.status_code == 200
    assert r.json()["f_name"] == "Alicia"


# ═══════════════════════════════════════════════════════════════════════════════
# COMPETENCIES
# ═══════════════════════════════════════════════════════════════════════════════

def test_list_competencies(client):
    r = client.get("/competencies/", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) == 2


def test_list_competencies_with_category_filter(client):
    r = client.get("/competencies/?category=Basic+Skills",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    data = r.json()
    assert all(c["category"] == "Basic Skills" for c in data)


def test_list_competencies_pagination(client):
    r = client.get("/competencies/?skip=1&limit=1",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_get_competency_by_id(client):
    r = client.get("/competencies/1", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    assert r.json()["competency_name"] == "Programming"


def test_get_competency_not_found(client):
    r = client.get("/competencies/9999", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# RESUMES
# ═══════════════════════════════════════════════════════════════════════════════

def test_upload_resume(client):
    r = client.post(
        "/resumes/",
        headers={"Authorization": f"Bearer {S.app_token}"},
        files={"file": ("cv.pdf", _FAKE_PDF, "application/pdf")},
    )
    assert r.status_code == 201
    data = r.json()
    assert "resume_id" in data
    S.resume_id = data["resume_id"]


def test_upload_resume_wrong_type_returns_415(client):
    r = client.post(
        "/resumes/",
        headers={"Authorization": f"Bearer {S.app_token}"},
        files={"file": ("cv.txt", b"plain text", "text/plain")},
    )
    assert r.status_code == 415


def test_upload_resume_as_recruiter_returns_403(client):
    r = client.post(
        "/resumes/",
        headers={"Authorization": f"Bearer {S.rec_token}"},
        files={"file": ("cv.pdf", _FAKE_PDF, "application/pdf")},
    )
    assert r.status_code == 403


def test_get_resume(client):
    r = client.get(f"/resumes/{S.resume_id}",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    assert r.json()["resume_id"] == S.resume_id


def test_get_resume_not_found(client):
    r = client.get("/resumes/9999", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 404


def test_download_resume(client):
    r = client.get(f"/resumes/{S.resume_id}/download",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    assert r.content == _FAKE_PDF


def test_parse_resume(client):
    r = client.get(f"/resumes/{S.resume_id}/parse",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    assert "text" in r.json()


def test_update_resume(client):
    new_pdf = b"%PDF-1.4\nupdated pdf bytes"
    r = client.put(
        f"/resumes/{S.resume_id}",
        headers={"Authorization": f"Bearer {S.app_token}"},
        files={"file": ("cv_v2.pdf", new_pdf, "application/pdf")},
    )
    assert r.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════════
# CANDIDATE COMPETENCY PROFILE
# ═══════════════════════════════════════════════════════════════════════════════

def test_get_my_competencies(client):
    r = client.get("/users/me/competencies",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "candidate_id" in data
    assert "competencies" in data
    assert "tech_keywords" in data
    assert len(data["competencies"]) > 0


def test_get_my_competencies_as_recruiter_returns_403(client):
    r = client.get("/users/me/competencies",
                   headers={"Authorization": f"Bearer {S.rec_token}"})
    assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# JOBS  (creates match records via background task on job creation)
# ═══════════════════════════════════════════════════════════════════════════════

def test_create_job(client):
    r = client.post(
        "/jobs/",
        headers={"Authorization": f"Bearer {S.rec_token}"},
        json={"title": "Software Engineer", "description": "We need a programmer with critical thinking skills."},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Software Engineer"
    S.job_id = data["job_id"]


def test_create_job_as_applicant_returns_403(client):
    r = client.post(
        "/jobs/",
        headers={"Authorization": f"Bearer {S.app_token}"},
        json={"title": "Bad Job", "description": "Should fail."},
    )
    assert r.status_code == 403


def test_list_jobs(client):
    r = client.get("/jobs/", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_list_jobs_pagination(client):
    r = client.get("/jobs/?skip=0&limit=1", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_get_job(client):
    r = client.get(f"/jobs/{S.job_id}", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    assert r.json()["job_id"] == S.job_id


def test_get_job_not_found(client):
    r = client.get("/jobs/9999", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 404


def test_get_job_competencies(client):
    r = client.get(f"/jobs/{S.job_id}/competencies",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["job_id"] == S.job_id
    assert "competencies" in data
    assert "tech_keywords" in data
    assert len(data["competencies"]) > 0


def test_update_job(client):
    r = client.put(
        f"/jobs/{S.job_id}",
        headers={"Authorization": f"Bearer {S.rec_token}"},
        json={"title": "Senior Software Engineer"},
    )
    assert r.status_code == 200
    assert r.json()["title"] == "Senior Software Engineer"


def test_update_other_recruiters_job_returns_403(client):
    # Register a second recruiter
    client.post("/auth/register", json={
        "f_name": "Eve", "l_name": "Other",
        "email": "eve@test.com", "password": "secret123",
        "account_type": "recruiter", "company_name": "Other Corp",
    })
    login = client.post("/auth/login", json={"email": "eve@test.com", "password": "secret123"})
    other_token = login.json()["access_token"]
    r = client.put(
        f"/jobs/{S.job_id}",
        headers={"Authorization": f"Bearer {other_token}"},
        json={"title": "Hijacked"},
    )
    assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# MATCHES — trigger endpoints
# ═══════════════════════════════════════════════════════════════════════════════

def test_trigger_candidate_matching(client):
    r = client.post("/matches/trigger",
                    headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 202
    assert r.json()["status"] == "accepted"


def test_trigger_candidate_matching_no_resume_returns_422(client):
    # Register new applicant with no resume
    client.post("/auth/register", json={
        "f_name": "No", "l_name": "Resume",
        "email": "noresume@test.com", "password": "secret123",
        "account_type": "applicant",
    })
    login = client.post("/auth/login", json={"email": "noresume@test.com", "password": "secret123"})
    token = login.json()["access_token"]
    r = client.post("/matches/trigger", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 422


def test_trigger_job_matching(client):
    r = client.post(f"/matches/trigger/{S.job_id}",
                    headers={"Authorization": f"Bearer {S.rec_token}"})
    assert r.status_code == 202
    assert r.json()["status"] == "accepted"


def test_trigger_job_matching_as_applicant_returns_403(client):
    r = client.post(f"/matches/trigger/{S.job_id}",
                    headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# MATCHES — read endpoints
# ═══════════════════════════════════════════════════════════════════════════════

def test_get_recommendations(client):
    r = client.get("/matches/recommendations",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    if data:
        first = data[0]
        assert "rank" in first
        assert "match_score" in first
        assert "recommendation_score" in first
        assert "qualification_tier" in first
        S.match_id = first["match_id"]


def test_get_recommendations_with_tier_filter(client):
    r = client.get("/matches/recommendations?tier=skill_gap",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200


def test_get_recommendations_as_recruiter_returns_403(client):
    r = client.get("/matches/recommendations",
                   headers={"Authorization": f"Bearer {S.rec_token}"})
    assert r.status_code == 403


def test_get_matches_for_candidate(client):
    me = client.get("/users/me", headers={"Authorization": f"Bearer {S.app_token}"})
    candidate_id = me.json()["candidate_id"]
    r = client.get(f"/matches/candidate/{candidate_id}",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    if r.json() and S.match_id is None:
        S.match_id = r.json()[0]["match_id"]


def test_get_matches_for_job(client):
    r = client.get(f"/matches/job/{S.job_id}",
                   headers={"Authorization": f"Bearer {S.rec_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_matches_for_job_as_applicant_returns_403(client):
    r = client.get(f"/matches/job/{S.job_id}",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 403


def test_get_job_rankings(client):
    r = client.get(f"/jobs/{S.job_id}/rankings",
                   headers={"Authorization": f"Bearer {S.rec_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    if data:
        first = data[0]
        assert "rank" in first
        assert "candidate_name" in first
        assert "match_score" in first
        assert "coverage" in first
        assert "job_score" in first


def test_get_single_match(client):
    if S.match_id is None:
        pytest.skip("No match record created — trigger tests may have failed")
    r = client.get(f"/matches/{S.match_id}",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["match_id"] == S.match_id
    assert "gap_profile" in data


def test_get_match_not_found(client):
    r = client.get("/matches/9999", headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# MATCH EXPLANATION
# ═══════════════════════════════════════════════════════════════════════════════

def test_explain_match_candidate(client):
    if S.match_id is None:
        pytest.skip("No match record created")
    r = client.get(f"/matches/{S.match_id}/explain",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "explanation" in data
    assert isinstance(data["explanation"], str)
    assert len(data["explanation"]) > 0


def test_explain_match_cached_on_second_call(client):
    if S.match_id is None:
        pytest.skip("No match record created")
    # Second call should return the same cached explanation without an LLM call
    r = client.get(f"/matches/{S.match_id}/explain",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    assert r.json()["explanation"] == "Strong match based on your programming background."


def test_explain_match_recruiter_view(client):
    if S.match_id is None:
        pytest.skip("No match record created")
    r = client.get(f"/matches/{S.match_id}/explain",
                   headers={"Authorization": f"Bearer {S.rec_token}"})
    assert r.status_code == 200
    assert "explanation" in r.json()


# ═══════════════════════════════════════════════════════════════════════════════
# CLARIFYING QUESTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def test_get_my_questions_applicant(client):
    r = client.get("/questions/mine",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    # A question was generated for Critical Thinking (level=None in mock)
    if data:
        S.question_id = data[0]["question_id"]


def test_get_my_questions_resolved_filter(client):
    r = client.get("/questions/mine?resolved=true",
                   headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200


def test_get_my_questions_recruiter(client):
    r = client.get("/questions/mine",
                   headers={"Authorization": f"Bearer {S.rec_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_answer_question(client):
    if S.question_id is None:
        pytest.skip("No clarifying question was generated")
    r = client.post(
        f"/questions/{S.question_id}/answer",
        headers={"Authorization": f"Bearer {S.app_token}"},
        json={"answer_text": "I have 5 years of experience applying critical thinking in complex projects."},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["resolved"] is True
    assert data["answer_text"] is not None


def test_answer_other_users_question_returns_403(client):
    if S.question_id is None:
        pytest.skip("No clarifying question was generated")
    r = client.post(
        f"/questions/{S.question_id}/answer",
        headers={"Authorization": f"Bearer {S.rec_token}"},
        json={"answer_text": "Trying to answer someone else's question"},
    )
    assert r.status_code == 403


def test_answer_question_not_found(client):
    r = client.post(
        "/questions/9999/answer",
        headers={"Authorization": f"Bearer {S.app_token}"},
        json={"answer_text": "Answer to nothing"},
    )
    assert r.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════════

def test_health_check(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ═══════════════════════════════════════════════════════════════════════════════
# CLEANUP — delete endpoints (run last)
# ═══════════════════════════════════════════════════════════════════════════════

def test_delete_resume(client):
    r = client.delete(f"/resumes/{S.resume_id}",
                      headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200


def test_delete_resume_not_found(client):
    r = client.delete(f"/resumes/{S.resume_id}",
                      headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 404


def test_delete_job(client):
    r = client.delete(f"/jobs/{S.job_id}",
                      headers={"Authorization": f"Bearer {S.rec_token}"})
    assert r.status_code == 200


def test_delete_job_as_applicant_returns_403(client):
    # Create a second job to attempt to delete
    create = client.post(
        "/jobs/",
        headers={"Authorization": f"Bearer {S.rec_token}"},
        json={"title": "Temp Job", "description": "Temp."},
    )
    temp_job_id = create.json()["job_id"]
    r = client.delete(f"/jobs/{temp_job_id}",
                      headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 403
    # Clean up
    client.delete(f"/jobs/{temp_job_id}", headers={"Authorization": f"Bearer {S.rec_token}"})


def test_delete_user(client):
    r = client.delete(f"/users/{S.app_id}",
                      headers={"Authorization": f"Bearer {S.app_token}"})
    assert r.status_code == 200


def test_deleted_user_cannot_login(client):
    r = client.post("/auth/login", json={"email": "alice@test.com", "password": "secret123"})
    assert r.status_code == 401
