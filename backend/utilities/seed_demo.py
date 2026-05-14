"""
Seed the database with 50 jobs (from CSV) and 50 candidates (LLM-generated resumes).

Usage:
    1. Start the backend:  python -m uvicorn app.main:app --port 8000
    2. In another terminal: python utilities/seed_demo.py

The script talks to the running API so that every resume and job goes through
the full scoring + matching pipeline automatically.
"""

import csv
import io
import os
import sys
import json
import random
import time
import requests
import litellm
from fpdf import FPDF
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── config ────────────────────────────────────────────────────────────────────

API = os.getenv("SEED_API_URL", "http://localhost:8000")
PASSWORD = "SeedPass123!"
CSV_PATH = Path(__file__).resolve().parent.parent / "job_postings" / "job_title_des.csv"

NUM_JOBS = 50
NUM_CANDIDATES = 50
RECRUITERS_PER_COMPANY = 1

litellm.suppress_debug_info = True

_PROVIDER = os.getenv("LLM_PROVIDER", "anthropic").lower()
_MODEL_MAP = {
    "anthropic": os.getenv("LLM_MODEL_ANTHROPIC", "claude-haiku-4-5-20251001"),
    "gemini":    os.getenv("LLM_MODEL_GEMINI",    "gemini/gemini-2.5-flash"),
}
LLM_MODEL = _MODEL_MAP.get(_PROVIDER, "claude-haiku-4-5-20251001")

# ── random metadata pools ────────────────────────────────────────────────────

COMPANIES = [
    "Nexora Technologies", "BrightPath Software", "CloudVertex Inc.",
    "DataForge Labs", "Synthwave Systems", "PulseGrid Solutions",
    "Orbit Digital", "Axion AI", "Quantum Reach", "BlueShift Corp.",
    "TerraStack", "NovaByte", "Ironclad Dev", "Prism Analytics",
    "ZenithOps", "ClearNode", "VectorMind", "HyperLattice",
    "ApexWare", "SummitCode",
]

FIRST_NAMES = [
    "James", "Maria", "Liam", "Sophia", "Ethan", "Olivia", "Noah", "Emma",
    "Aiden", "Ava", "Lucas", "Mia", "Mason", "Isabella", "Logan", "Charlotte",
    "Alex", "Amelia", "Elijah", "Harper", "Ben", "Evelyn", "Daniel", "Abigail",
    "Henry", "Emily", "Seb", "Ella", "Jack", "Lily", "Owen", "Grace",
    "Caleb", "Chloe", "Ryan", "Zoe", "Nathan", "Nora", "Samuel", "Riley",
    "Dylan", "Layla", "Carter", "Penelope", "Julian", "Aria", "Grayson",
    "Scarlett", "Leo", "Hannah",
]

LAST_NAMES = [
    "Anderson", "Chen", "Williams", "Garcia", "Patel", "Nguyen", "Kim",
    "Martinez", "Johnson", "Lopez", "Thompson", "Lee", "Harris", "Clark",
    "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright",
    "Scott", "Torres", "Hill", "Green", "Adams", "Baker", "Nelson",
    "Carter", "Mitchell", "Perez", "Roberts", "Turner", "Phillips",
    "Campbell", "Parker", "Evans", "Edwards", "Collins", "Stewart",
    "Sanchez", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell",
    "Murphy", "Bailey", "Rivera",
]

LOCATIONS = [
    "New York, NY", "San Francisco, CA", "Austin, TX", "Seattle, WA",
    "Chicago, IL", "Boston, MA", "Denver, CO", "Los Angeles, CA",
    "Atlanta, GA", "Miami, FL", "Portland, OR", "Remote",
    "Washington, DC", "Raleigh, NC", "Dallas, TX",
]

WORK_TYPES = ["Remote", "On-site", "Hybrid"]
EXPERIENCE_LEVELS = [
    "Entry Level", "1-2 years", "2-4 years", "3-5 years",
    "5-7 years", "5+ years", "7-10 years", "10+ years",
]

# Role templates for resume generation — tied to the job titles in the CSV
ROLE_TEMPLATES = [
    "Flutter Developer", "Django Developer", "Machine Learning Engineer",
    "Backend Developer", "Database Administrator", "DevOps Engineer",
    "Full Stack Developer", "Java Developer", "JavaScript Developer",
    "Network Administrator", "Node.js Developer", "PHP Developer",
    "Software Engineer", "WordPress Developer", "iOS Developer",
]

# ── helpers ───────────────────────────────────────────────────────────────────

def api_post(path, json_data=None, files=None, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = requests.post(f"{API}{path}", json=json_data, files=files, headers=headers, timeout=120)
    if not r.ok:
        print(f"  ERROR {r.status_code}: {r.text[:200]}")
    r.raise_for_status()
    return r.json()


def register_and_login(f_name, l_name, email, account_type, company_name=None):
    payload = {
        "f_name": f_name,
        "l_name": l_name,
        "email": email,
        "password": PASSWORD,
        "account_type": account_type,
    }
    if company_name:
        payload["company_name"] = company_name
    # Try to register; if already exists, just log in
    r = requests.post(f"{API}/auth/register", json=payload, timeout=30)
    if r.status_code == 409:
        pass  # already registered — that's fine
    elif not r.ok:
        r.raise_for_status()
    resp = api_post("/auth/login", {"email": email, "password": PASSWORD})
    return resp["access_token"]


def load_jobs_from_csv():
    rows = []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row["Job Title"].strip()
            desc = row["Job Description"].strip()
            if len(desc) > 200:  # skip very short descriptions
                rows.append({"title": title, "description": desc})
    random.shuffle(rows)
    return rows[:NUM_JOBS]


def random_salary():
    base = random.choice([50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150])
    return base * 1000, (base + random.randint(15, 40)) * 1000


def random_expiry():
    if random.random() < 0.4:
        from datetime import datetime, timedelta, timezone
        days = random.randint(5, 60)
        return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    return None


def _sanitize(text):
    """Replace non-latin-1 chars and break very long words to avoid PDF overflow."""
    safe = text.encode("latin-1", errors="replace").decode("latin-1")
    # Break any token longer than 60 chars (URLs, long paths, etc.)
    words = safe.split(" ")
    out = []
    for w in words:
        while len(w) > 60:
            out.append(w[:60])
            w = w[60:]
        out.append(w)
    return " ".join(out)


def text_to_pdf(text, name):
    # Strip markdown formatting the LLM may have added
    text = text.replace("**", "").replace("__", "")
    text = text.replace("*", "").replace("_", "")

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    w = pdf.w - pdf.l_margin - pdf.r_margin  # explicit width avoids fpdf2 bug

    pdf.set_font("Helvetica", "B", 16)
    pdf.multi_cell(w, 10, _sanitize(name))
    pdf.set_font("Helvetica", "", 10)
    pdf.ln(4)

    for line in text.split("\n"):
        line = line.strip()
        if not line:
            pdf.ln(3)
            continue

        # Strip leading markdown bullets/hashes
        if line.startswith("#"):
            line = line.lstrip("#").strip()
        # Normalize bullet prefixes to "- "
        if line.startswith("\u2022 ") or line.startswith("* "):
            line = "- " + line[2:]

        # Section headers (all caps or lines ending with colon)
        if line.isupper() or (line.endswith(":") and len(line) < 60):
            pdf.set_font("Helvetica", "B", 11)
            pdf.ln(2)
            pdf.multi_cell(w, 6, _sanitize(line))
            pdf.set_font("Helvetica", "", 10)
        else:
            pdf.multi_cell(w, 5, _sanitize(line))

    return pdf.output()


def generate_resume_text(role, name, email):
    years = random.randint(1, 12)
    prompt = f"""Generate a realistic professional resume for a {role} with {years} years of experience.

Name: {name}
Email: {email}

Requirements:
- Include a professional summary (2-3 sentences)
- Include 2-3 work experiences with company names, dates, and bullet points describing achievements
- Include an education section with a relevant degree
- Include a technical skills section listing specific technologies
- Include 1-2 certifications or projects if relevant
- Make it feel like a real person — vary the writing quality, detail level, and formatting naturally
- Use plain text formatting with section headers in ALL CAPS
- Do NOT use markdown. No asterisks, no hashtags, no bold markers.
- Keep it to about 400-600 words

Output ONLY the resume text, nothing else."""

    resp = litellm.completion(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
        temperature=0.9,
    )
    return resp.choices[0].message.content.strip()


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"API: {API}")
    print(f"LLM: {LLM_MODEL}")
    print(f"CSV: {CSV_PATH}")
    print()

    # Check API is running
    try:
        r = requests.get(f"{API}/", timeout=5)
        r.raise_for_status()
    except Exception as e:
        print(f"Cannot reach API at {API}: {e}")
        print("Start the backend first: python -m uvicorn app.main:app --port 8000")
        sys.exit(1)

    # ── Phase 1: Recruiters + Jobs (already seeded — skipping) ──────────────

    print("Phase 1 (recruiters + jobs) already seeded — skipping.")

    # ── Phase 2: Candidates + Resumes ───────────────────────────────────────

    print()
    print("=" * 60)
    print("PHASE 2: Creating candidates and uploading resumes")
    print("=" * 60)

    for i in range(NUM_CANDIDATES):
        f_name = FIRST_NAMES[i % len(FIRST_NAMES)]
        l_name = LAST_NAMES[i % len(LAST_NAMES)]
        # Use index in email to guarantee uniqueness across re-runs
        email = f"candidate{i+1}@seed.demo"
        role = random.choice(ROLE_TEMPLATES)
        full_name = f"{f_name} {l_name}"

        print(f"  Candidate {i+1}/{NUM_CANDIDATES}: {full_name} ({role})")

        # Register + login
        try:
            token = register_and_login(f_name, l_name, email, "applicant")
        except Exception as e:
            print(f"    SKIP (register failed): {e}")
            continue

        # Generate resume via LLM
        try:
            print(f"    Generating resume...", end=" ", flush=True)
            resume_text = generate_resume_text(role, full_name, email)
            print(f"({len(resume_text)} chars)")
        except Exception as e:
            print(f"\n    SKIP (LLM failed): {e}")
            continue

        # Convert to PDF
        try:
            pdf_bytes = text_to_pdf(resume_text, full_name)
        except Exception as e:
            print(f"    SKIP (PDF failed): {e}")
            continue

        # Upload resume through API (triggers scoring + matching)
        try:
            files = {"file": (f"{f_name}_{l_name}_resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
            resp = api_post("/resumes/", files=files, token=token)
            print(f"    Uploaded resume (id={resp['resume_id']}), scoring + matching queued")
        except Exception as e:
            print(f"    SKIP (upload failed): {e}")
            continue

        # Rate limiting for LLM calls
        if (i + 1) % 5 == 0:
            print(f"    [{i+1}/{NUM_CANDIDATES} done, pausing...]")
            time.sleep(2)

    print()
    print("=" * 60)
    print("SEEDING COMPLETE")
    print(f"  Jobs:       {NUM_JOBS}")
    print(f"  Candidates: {NUM_CANDIDATES}")
    print("=" * 60)
    print()
    print("Matching runs in the background — give it a minute to finish.")
    print("Check the dashboard to see results.")


if __name__ == "__main__":
    main()
