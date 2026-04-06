# Job Matching System — Backend

A REST API that matches job candidates to job postings using the O\*NET competency framework and an LLM-based scoring pipeline.

## Stack

- **Framework:** FastAPI + SQLAlchemy 2.0
- **Database:** MySQL (PyMySQL dialect)
- **LLM:** Anthropic Claude (via `anthropic` SDK)
- **Competency framework:** O\*NET 30.2

## Setup

### 1. Prerequisites

- Python 3.12+
- MySQL instance running locally

### 2. Install dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```
DATABASE_URL='mysql+pymysql://<user>:<password>@localhost:3306/job_matching_system'
SECRET_KEY=<any long random string>
ANTHROPIC_API_KEY=<your key from console.anthropic.com>
```

### 4. Create the database schema

```bash
mysql -u <user> -p < Tables.sql
```

### 5. Seed O\*NET competency data

Download the following files from [O\*NET 30.2](https://www.onetcenter.org/database.html#mysql) and place them in `utilities/`:

- `01_content_model_reference.sql`
- `06_level_scale_anchors.sql`

Then run:

```bash
cd utilities
python seed_competencies.py
```

This seeds 160 competencies across Abilities, Basic Skills, Cross-Functional Skills, Knowledge, and Work Styles, along with their O\*NET level scale anchors.

### 6. Seed test data (optional)

Populates the database with 10 candidates (with resumes) and 10 recruiters (with job postings) for development and demo use. All accounts use the password `testpass123`.

```bash
cd utilities
python seed_test_data.py
```

This makes one LLM call per resume and per job post (20 calls total) so it takes a couple of minutes to complete.

### 7. Start the server

```bash
cd backend
python -m uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

---

## API Overview

| Router | Prefix | Description |
|---|---|---|
| Auth | `/auth` | Register and login (returns JWT) |
| Users | `/users` | View and update user profile |
| Resumes | `/resumes` | Upload, update, and download resumes (PDF/DOCX) |
| Jobs | `/jobs` | Create, update, and list job postings |
| Matches | `/matches` | Trigger matching and view results |
| Competencies | `/competencies` | Browse the O\*NET competency catalog |

### Authentication

All routes except registration and login require a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are issued at `POST /auth/login` and expire after 24 hours.

### Roles

| Role | Account type | Can do |
|---|---|---|
| Applicant | `applicant` | Upload resumes, trigger matching, view own matches |
| Recruiter | `recruiter` | Create job postings, trigger matching for a job, view matches for own jobs |

---

## Matching Pipeline

### On resume upload (`POST /resumes/`)

1. Resume file (PDF or DOCX) is parsed to plain text.
2. Text is sent to the Claude LLM with the full O\*NET competency catalog and level scale guidance.
3. LLM returns detected competencies and estimated proficiency levels (0–100).
4. Results are written to `candidate_competencies`. A `NULL` level means the competency was detected but its depth could not be inferred.

### On job post creation (`POST /jobs/`)

1. Job description is sent to the LLM.
2. LLM returns detected competencies with required level (0–100), importance (0.0–1.0), and requirement type (`required` / `preferred`).
3. Results are written to `job_competencies`.

### On match trigger (`POST /matches/trigger`)

Reads pre-scored data from the DB and computes a fit score for each candidate–job pair.

**Fit score formula:**

```
gap       = max(0, (required_level - candidate_level) / 100)
fit_value = 1 - gap
score     = Σ(importance × fit_value) / Σ(importance)
```

Only dimensions where both the candidate level and the required level are known contribute to the score. The result also includes:

- **`coverage`** — fraction of job dimensions that were fully assessable
- **`knockout_failed`** — `true` if the candidate has no evidence of any `required` dimension
- **`gap_profile`** — per-dimension breakdown split into `scored`, `undetermined`, and `absent` buckets

### Undetermined handling

The system distinguishes three states per competency:

| State | Meaning |
|---|---|
| **scored** | Both candidate level and required level are known — gap computed |
| **undetermined** | Competency detected on one or both sides, but at least one level is `NULL` |
| **absent** | No evidence of the competency in the candidate's profile |

This avoids fabricating scores for dimensions the system cannot assess with confidence.

---

## Project Structure

```
backend/
  app/
    main.py              # App entry point, router registration, CORS
    database.py          # SQLAlchemy engine and session
    models/models.py     # ORM models
    schemas/schemas.py   # Pydantic request/response schemas
    core/
      security.py        # JWT creation/decoding, bcrypt hashing
      dependencies.py    # get_current_user, require_applicant, require_recruiter
    routers/             # One file per resource
    services/
      llm_scorer.py      # LLM-based competency scoring (resume + job description)
      scorer.py          # score_resume, score_job_post, compute_fit_score
      resume_parser.py   # PDF/DOCX → plain text
  utilities/
    seed_competencies.py # O*NET competency and anchor seeding
    seed_test_data.py    # 10 candidates + 10 job postings for dev/demo
  Tables.sql             # Canonical DB schema
  requirements.txt
  .env.example
```
