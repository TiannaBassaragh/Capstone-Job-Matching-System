#!/usr/bin/env python3
"""
evaluate_llm_scorer.py — Controlled LLM scorer accuracy and discrimination tests.

Four test sections:

  1. DETECTION — resumes/jobs crafted from exact O*NET competency wording,
     then from synonyms. Checks the LLM identifies the target element_ids.

  2. SCORING RANGE — a controlled job scored against a high-fit, medium-fit,
     and low-fit resume. Checks BOTH recommendation_score (candidate side)
     AND job_score = match_score × coverage (recruiter side) are ordered
     correctly: High > Medium > Low.

  3. DOMAIN DISCRIMINATION — a software engineering job scored against four
     personas (software engineer, tech PM, electrician, retail manager).
     Checks ranking order for both candidate and recruiter scores.

  4. CONSISTENCY — the same resume scored twice independently. Checks that
     detected competencies, level scores, and final scores are stable.

All LLM calls are cached to tests/evaluation/llm_scorer_cache.json.

Usage:
  cd backend
  python tests/evaluation/evaluate_llm_scorer.py
"""

import json
import sys
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
CACHE_FILE  = Path(__file__).parent / "llm_scorer_cache.json"
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

import litellm
from app.database import SessionLocal
from app.models.models import Competency
from app.services.llm_scorer import score_and_extract
from app.services.scorer import compute_fit_score

# ── mock objects ───────────────────────────────────────────────────────────────

class _Comp:
    def __init__(self, cid, name, eid):
        self.competency_id   = cid
        self.competency_name = name
        self.onet_element_id = eid

class _JobReq:
    def __init__(self, cid, required_level, importance, requirement_type, comp):
        self.competency_id    = cid
        self.required_level   = required_level
        self.importance       = importance
        self.requirement_type = requirement_type
        self.competency       = comp


# ── cache helpers ──────────────────────────────────────────────────────────────

def load_cache() -> dict:
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    return {}

def save_cache(cache: dict) -> None:
    CACHE_FILE.write_text(json.dumps(cache, indent=2))

def score(text: str, mode: str, cache: dict, key: str):
    """Run score_and_extract with caching. Returns (competencies, tech_keywords)."""
    combined_key = f"{key}_combined"
    if combined_key not in cache:
        db = SessionLocal()
        try:
            for attempt in range(4):
                try:
                    comps, tech = score_and_extract(text, db, mode=mode)
                    cache[combined_key] = {"competencies": comps, "tech_keywords": tech}
                    save_cache(cache)
                    time.sleep(2)
                    break
                except litellm.RateLimitError:
                    if attempt == 3:
                        raise
                    wait = 60 * (2 ** attempt)
                    print(f"    ⏳ rate limit — waiting {wait}s ...", flush=True)
                    time.sleep(wait)
        finally:
            db.close()
    entry = cache[combined_key]
    return entry.get("competencies", {}), entry.get("tech_keywords", [])


def build_candidate_levels(raw: dict, comp_map: dict) -> dict:
    return {comp_map[eid]: data.get("level") for eid, data in raw.items() if eid in comp_map}

def build_job_reqs(raw: dict, comp_map: dict, name_map: dict) -> list:
    reqs = []
    for eid, data in raw.items():
        cid = comp_map.get(eid)
        if cid is None:
            continue
        reqs.append(_JobReq(
            cid              = cid,
            required_level   = data.get("required_level"),
            importance       = data.get("importance"),
            requirement_type = data.get("requirement_type", "preferred"),
            comp             = _Comp(cid, name_map.get(eid, eid), eid),
        ))
    return reqs

def job_score(result: dict) -> float:
    """Recruiter-side qualification score: match_score × coverage."""
    ms = result["match_score"] or 0.0
    cv = result.get("coverage") or 0.0
    return round(ms * cv, 4)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — DETECTION TESTS
# Target: score_and_extract should identify specific element_ids when
# the text is crafted from exact O*NET wording, then from synonyms.
# ══════════════════════════════════════════════════════════════════════════════

# Each entry: (element_id, exact_wording_text, synonym_text, mode)
DETECTION_CASES = [
    (
        "2.B.3.e",  # Programming (Cross-Functional Skills)
        "I write computer programs for various purposes. "
        "I have developed software programs using multiple programming languages "
        "and am skilled at programming solutions to complex technical problems.",
        "I develop software applications and build code-based solutions. "
        "I have spent years writing scripts and applications, translating "
        "business requirements into working software products.",
        "resume",
    ),
    (
        "2.A.2.a",  # Critical Thinking (Basic Skills)
        "I use logic and reasoning to identify the strengths and weaknesses of "
        "alternative solutions, conclusions, or approaches to problems. "
        "Critical thinking is central to everything I do.",
        "I evaluate options carefully before making decisions, weighing the pros "
        "and cons of each approach. I question assumptions and analyse evidence "
        "before drawing conclusions.",
        "resume",
    ),
    (
        "2.B.2.i",  # Complex Problem Solving (Cross-Functional Skills)
        "I identify complex problems and review related information to develop "
        "and evaluate options and implement solutions. "
        "Complex problem solving is a core strength I apply daily.",
        "When faced with difficult, multifaceted challenges I break them down "
        "systematically, research root causes, and work through solutions "
        "iteratively until the issue is resolved.",
        "resume",
    ),
    (
        "2.B.5.d",  # Management of Personnel Resources (Cross-Functional Skills)
        "I motivate, develop, and direct people as they work, identifying the "
        "best people for the job. I manage personnel resources effectively "
        "and oversee workforce planning and staff development.",
        "I lead teams, handle recruitment decisions, coach underperforming "
        "employees, and ensure the right people are in the right roles. "
        "Building and growing a high-performing team is my core responsibility.",
        "resume",
    ),
    (
        "2.B.1.f",  # Service Orientation (Cross-Functional Skills)
        "I actively look for ways to help people. Service orientation drives "
        "my work — I go out of my way to meet the needs of customers and "
        "provide assistance whenever possible.",
        "Putting customers first is my top priority. I proactively anticipate "
        "what people need and make sure they walk away satisfied, even when "
        "that means going beyond my standard responsibilities.",
        "resume",
    ),
    (
        "2.C.3.a",  # Computers and Electronics (Knowledge)
        "I have deep knowledge of computers and electronics, including circuit "
        "boards, processors, chips, electronic equipment, and computer hardware "
        "and software, including applications and programming.",
        "I understand how computer hardware and software systems work at a "
        "technical level — from processor architecture to application-layer "
        "software. I regularly work with electronic devices and computing systems.",
        "resume",
    ),
]


def run_detection_tests(cache: dict, comp_map: dict) -> tuple[int, int]:
    print("\n" + "═" * 70)
    print("SECTION 1 — DETECTION TESTS")
    print("═" * 70)
    print(f"  {'Element':12s}  {'Mode':8s}  {'Exact':6s}  {'Synonym':8s}  Competency name")
    print(f"  {'─'*65}")

    passed = total = 0

    for eid, exact_text, synonym_text, mode in DETECTION_CASES:
        if eid not in comp_map:
            print(f"  {eid:12s}  ⚠ element_id not in DB — skipping")
            continue

        exact_raw, _ = score(exact_text, mode, cache, f"detect_exact_{eid}")
        exact_hit = eid in exact_raw

        syn_raw, _ = score(synonym_text, mode, cache, f"detect_syn_{eid}")
        syn_hit = eid in syn_raw

        exact_mark = "✓" if exact_hit else "✗"
        syn_mark   = "✓" if syn_hit   else "✗"

        db = SessionLocal()
        try:
            comp = db.query(Competency).filter_by(onet_element_id=eid).first()
            name = comp.competency_name if comp else eid
        finally:
            db.close()

        print(f"  {eid:12s}  {mode:8s}  {exact_mark:6s}  {syn_mark:8s}  {name}")

        if exact_hit: passed += 1
        if syn_hit:   passed += 1
        total += 2

    return passed, total


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — SCORING RANGE
# A controlled software development job scored against three candidates
# with known relative fit: high > medium > low.
# Checks BOTH candidate-side (recommendation_score) and
# recruiter-side (job_score = match_score × coverage) ordering.
# ══════════════════════════════════════════════════════════════════════════════

RANGE_JOB = """
Senior Software Engineer

Required:
- 5+ years writing computer programs and developing software systems (required)
- Strong critical thinking: evaluating solutions, reasoning through trade-offs (required)
- Complex problem solving — debugging and resolving difficult technical issues (required)
- Knowledge of computers and electronics at a deep technical level (required)

Preferred:
- Programming skills across multiple languages
- Active learning: staying up-to-date with new technologies
"""

RANGE_HIGH = """
Senior Software Developer — 8 years experience

I write computer programs daily across Python, Go, and Java. I have deep knowledge
of computers and electronics — from hardware architecture to application-layer software.
I am known for strong critical thinking: I rigorously evaluate alternatives and
reason through complex trade-offs before committing to a technical approach.
Complex problem solving is my core strength — I have debugged and resolved some of
the most difficult distributed systems issues my team has encountered.
I actively learn new technologies and regularly apply new skills to my work.
"""

RANGE_MEDIUM = """
Software Developer — 3 years experience

I have some experience writing computer programs, primarily in Python for data
analysis scripts. I use critical thinking in my day-to-day work.
I am still developing my complex problem solving skills, particularly for
large-scale system issues. I have basic knowledge of computers and electronics.
"""

RANGE_LOW = """
Retail Store Manager — 6 years experience

I manage a team of 20 sales associates, focusing on customer service and
service orientation. I am skilled at selling products and influencing customers.
I handle scheduling, manage store inventory, and coordinate with suppliers.
I communicate regularly with customers and the public.
No programming or software development background.
"""


def run_range_tests(cache: dict, comp_map: dict, name_map: dict) -> tuple[int, int]:
    print("\n" + "═" * 70)
    print("SECTION 2 — SCORING RANGE")
    print("═" * 70)
    print("  Checks candidate-side (recommendation_score) and")
    print("  recruiter-side (job_score = match_score × coverage) ordering.\n")

    job_raw, job_tech = score(RANGE_JOB,    "job",    cache, "range_job")
    hi_raw,  hi_tech  = score(RANGE_HIGH,   "resume", cache, "range_high")
    md_raw,  md_tech  = score(RANGE_MEDIUM, "resume", cache, "range_medium")
    lo_raw,  lo_tech  = score(RANGE_LOW,    "resume", cache, "range_low")

    job_reqs = build_job_reqs(job_raw, comp_map, name_map)

    hi_result = compute_fit_score(build_candidate_levels(hi_raw, comp_map), job_reqs, candidate_tech=hi_tech, job_tech=job_tech)
    md_result = compute_fit_score(build_candidate_levels(md_raw, comp_map), job_reqs, candidate_tech=md_tech, job_tech=job_tech)
    lo_result = compute_fit_score(build_candidate_levels(lo_raw, comp_map), job_reqs, candidate_tech=lo_tech, job_tech=job_tech)

    hi_js = job_score(hi_result)
    md_js = job_score(md_result)
    lo_js = job_score(lo_result)

    print(f"  {'Candidate':12s}  {'match_score':>12}  {'coverage':>9}  {'job_score':>10}  {'rec_score':>10}  {'tier'}")
    print(f"  {'─'*75}")
    for label, res, js in [("High fit", hi_result, hi_js), ("Medium fit", md_result, md_js), ("Low fit", lo_result, lo_js)]:
        ms = f"{res['match_score']:.3f}" if res["match_score"] is not None else "  None"
        cv = f"{res.get('coverage', 0.0):.3f}"
        print(f"  {label:12s}  {ms:>12}  {cv:>9}  {js:>10.3f}  {res['recommendation_score']:>10.3f}  {res['qualification_tier']}")

    passed = total = 0

    hi_rec = hi_result["recommendation_score"]
    md_rec = md_result["recommendation_score"]
    lo_rec = lo_result["recommendation_score"]

    print("\n  Candidate-side (recommendation_score):")
    for desc, ok in [
        ("High > Medium", hi_rec > md_rec),
        ("Medium > Low",  md_rec > lo_rec),
        ("High > Low",    hi_rec > lo_rec),
    ]:
        mark = "✓" if ok else "✗"
        print(f"    {mark} {desc}  ({hi_rec:.3f} / {md_rec:.3f} / {lo_rec:.3f})")
        if ok: passed += 1
        total += 1

    print("\n  Recruiter-side (job_score = match_score × coverage):")
    for desc, ok in [
        ("High > Medium", hi_js > md_js),
        ("Medium > Low",  md_js > lo_js),
        ("High > Low",    hi_js > lo_js),
    ]:
        mark = "✓" if ok else "✗"
        print(f"    {mark} {desc}  ({hi_js:.3f} / {md_js:.3f} / {lo_js:.3f})")
        if ok: passed += 1
        total += 1

    return passed, total


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — DOMAIN DISCRIMINATION
# A software engineering job scored against four personas.
# Expected ranking: Software Engineer > Tech PM > Electrician > Retail Manager
# Checks both candidate-side and recruiter-side ordering.
# ══════════════════════════════════════════════════════════════════════════════

DISC_JOB = """
Senior Software Engineer

Required:
- Writing computer programs and developing software systems (required)
- Critical thinking and complex problem solving (required)
- Deep knowledge of computers and electronics (required)
- Programming in Python or similar language (required)
- Working with computers and software tools daily (required)

Preferred:
- Technology design and systems analysis
- Active learning: staying current with new frameworks and languages
"""

DISC_RESUMES = {
    "Software Engineer": """
    Senior Software Developer — 7 years
    Expert at writing computer programs in Python, Go, and TypeScript.
    Deep knowledge of computers and electronics — hardware and software systems.
    Strong critical thinking and complex problem solving: designed distributed
    systems handling millions of requests. Programming is my core competency.
    Work with computers and development tools every day.
    Technology design and systems analysis experience. Actively learning new
    frameworks and applying them to production systems.
    """,

    "Tech Project Manager": """
    Technical Project Manager — 8 years
    Manage cross-functional software engineering teams of 10–15 people.
    Coordinate the work and activities of others to deliver software projects.
    Background in software development (3 years coding before moving to management).
    Some knowledge of computers and electronics at a high level.
    Critical thinking applied to project planning and risk management.
    Scheduling work, developing objectives, and communicating with stakeholders.
    No hands-on programming in the past 5 years.
    """,

    "Electrician": """
    Master Electrician — 10 years
    Install, maintain, and repair electrical wiring, equipment, and fixtures.
    Strong troubleshooting skills: diagnose and repair electrical faults.
    Repairing and maintaining mechanical and electronic equipment.
    Read and interpret technical diagrams and blueprints.
    Knowledge of electronics at the hardware and circuit level.
    Physical work: handling and moving equipment, working in confined spaces.
    No software development or computer programming experience.
    """,

    "Retail Manager": """
    Retail Store Manager — 6 years
    Manage a team of 20 sales associates focused on customer service.
    Service orientation: actively find ways to help customers.
    Selling products and influencing purchasing decisions.
    Communicating with the public and resolving customer complaints.
    Scheduling shifts and managing store inventory.
    No technical, engineering, or software development background.
    """,
}

EXPECTED_ORDER = ["Software Engineer", "Tech Project Manager", "Electrician", "Retail Manager"]


def run_discrimination_tests(cache: dict, comp_map: dict, name_map: dict) -> tuple[int, int]:
    print("\n" + "═" * 70)
    print("SECTION 3 — DOMAIN DISCRIMINATION")
    print("═" * 70)
    print(f"  Expected ranking: {' > '.join(EXPECTED_ORDER)}\n")

    job_raw, job_tech = score(DISC_JOB, "job", cache, "disc_job")
    job_reqs = build_job_reqs(job_raw, comp_map, name_map)

    results = {}
    print(f"  {'Persona':22s}  {'match_score':>12}  {'job_score':>10}  {'rec_score':>10}  tier")
    print(f"  {'─'*75}")
    for persona, resume_text in DISC_RESUMES.items():
        key = f"disc_{persona.lower().replace(' ', '_')}"
        raw, tech = score(resume_text, "resume", cache, key)
        result = compute_fit_score(
            build_candidate_levels(raw, comp_map), job_reqs,
            candidate_tech=tech, job_tech=job_tech,
        )
        results[persona] = result
        ms = f"{result['match_score']:.3f}" if result["match_score"] is not None else "  None"
        js = job_score(result)
        print(f"  {persona:22s}  {ms:>12}  {js:>10.3f}  {result['recommendation_score']:>10.3f}  {result['qualification_tier']}")

    rec_order = sorted(results.keys(), key=lambda p: results[p]["recommendation_score"], reverse=True)
    js_order  = sorted(results.keys(), key=lambda p: job_score(results[p]), reverse=True)

    print(f"\n  Candidate-side actual:  {' > '.join(rec_order)}")
    print(f"  Recruiter-side actual:  {' > '.join(js_order)}")
    print(f"  Expected:               {' > '.join(EXPECTED_ORDER)}\n")

    passed = total = 0

    print("  Candidate-side (recommendation_score):")
    for i in range(len(EXPECTED_ORDER) - 1):
        a, b = EXPECTED_ORDER[i], EXPECTED_ORDER[i + 1]
        a_score = results[a]["recommendation_score"]
        b_score = results[b]["recommendation_score"]
        ok = a_score > b_score
        mark = "✓" if ok else "✗"
        print(f"    {mark} {a} ({a_score:.3f}) > {b} ({b_score:.3f})")
        if ok: passed += 1
        total += 1

    print("\n  Recruiter-side (job_score = match_score × coverage):")
    for i in range(len(EXPECTED_ORDER) - 1):
        a, b = EXPECTED_ORDER[i], EXPECTED_ORDER[i + 1]
        a_score = job_score(results[a])
        b_score = job_score(results[b])
        ok = a_score > b_score
        mark = "✓" if ok else "✗"
        print(f"    {mark} {a} ({a_score:.3f}) > {b} ({b_score:.3f})")
        if ok: passed += 1
        total += 1

    return passed, total


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — CONSISTENCY TEST
# The same resume is scored twice independently (two separate LLM calls,
# different cache keys). Measures stability of:
#   - detected competency set (Jaccard overlap)
#   - level scores for common competencies (mean absolute error)
#   - final recommendation_score and job_score delta
#
# Pass thresholds:
#   Jaccard ≥ 0.60   — at least 60% overlap in detected dimensions
#   Level MAE ≤ 15   — average level difference ≤ 15 points (out of 100)
#   Rec Δ ≤ 0.05     — recommendation_score changes by no more than 0.05
#   Job Δ ≤ 0.05     — job_score changes by no more than 0.05
# ══════════════════════════════════════════════════════════════════════════════

CONSISTENCY_RESUME = """
Senior Software Developer — 8 years experience

I write computer programs daily across Python, Go, and Java. I have deep knowledge
of computers and electronics — from hardware architecture to application-layer software.
I am known for strong critical thinking: I rigorously evaluate alternatives and
reason through complex trade-offs before committing to a technical approach.
Complex problem solving is my core strength — I have debugged and resolved some of
the most difficult distributed systems issues my team has encountered.
I design technology systems and perform systems analysis as part of my role.
I actively learn new technologies and regularly apply new skills to my work.
"""

CONSISTENCY_JOB = RANGE_JOB  # reuse the controlled software engineering job


def run_consistency_tests(cache: dict, comp_map: dict, name_map: dict) -> tuple[int, int]:
    print("\n" + "═" * 70)
    print("SECTION 4 — CONSISTENCY TEST")
    print("═" * 70)
    print("  Same resume scored twice independently — measures LLM stability.\n")

    job_raw, job_tech = score(CONSISTENCY_JOB, "job", cache, "range_job")  # reuse cached job
    job_reqs = build_job_reqs(job_raw, comp_map, name_map)

    # Two independent LLM calls with different cache keys
    raw1, tech1 = score(CONSISTENCY_RESUME, "resume", cache, "consistency_run_1")
    raw2, tech2 = score(CONSISTENCY_RESUME, "resume", cache, "consistency_run_2")

    eids1 = set(raw1.keys())
    eids2 = set(raw2.keys())
    intersection = eids1 & eids2
    union        = eids1 | eids2
    jaccard      = len(intersection) / len(union) if union else 0.0

    # Level MAE for common competencies
    level_diffs = []
    for eid in intersection:
        l1 = raw1[eid].get("level")
        l2 = raw2[eid].get("level")
        if l1 is not None and l2 is not None:
            level_diffs.append(abs(l1 - l2))
    mae = sum(level_diffs) / len(level_diffs) if level_diffs else 0.0

    result1 = compute_fit_score(build_candidate_levels(raw1, comp_map), job_reqs, candidate_tech=tech1, job_tech=job_tech)
    result2 = compute_fit_score(build_candidate_levels(raw2, comp_map), job_reqs, candidate_tech=tech2, job_tech=job_tech)

    rec1, rec2 = result1["recommendation_score"], result2["recommendation_score"]
    js1,  js2  = job_score(result1), job_score(result2)
    rec_delta  = abs(rec1 - rec2)
    js_delta   = abs(js1  - js2)

    print(f"  {'':25s}  {'Run 1':>8}  {'Run 2':>8}  {'Delta':>8}")
    print(f"  {'─'*60}")
    print(f"  {'Detected competencies':25s}  {len(eids1):>8}  {len(eids2):>8}")
    print(f"  {'Common / Union':25s}  {len(intersection):>8} / {len(union)}")
    print(f"  {'Jaccard overlap':25s}  {jaccard:>8.3f}")
    print(f"  {'Level MAE (common dims)':25s}  {mae:>8.1f}")
    print(f"  {'recommendation_score':25s}  {rec1:>8.3f}  {rec2:>8.3f}  {rec_delta:>8.3f}")
    print(f"  {'job_score':25s}  {js1:>8.3f}  {js2:>8.3f}  {js_delta:>8.3f}")

    passed = total = 0
    checks = [
        (f"Jaccard ≥ 0.60       (got {jaccard:.3f})",     jaccard >= 0.60),
        (f"Level MAE ≤ 15       (got {mae:.1f})",          mae <= 15),
        (f"Rec score Δ ≤ 0.05   (got {rec_delta:.3f})",   rec_delta <= 0.05),
        (f"Job score Δ ≤ 0.05   (got {js_delta:.3f})",    js_delta  <= 0.05),
    ]
    print()
    for desc, ok in checks:
        mark = "✓" if ok else "✗"
        print(f"  {mark} {desc}")
        if ok: passed += 1
        total += 1

    return passed, total


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5 — PROJECT MANAGER QUALIFICATION GRADIENT
# A Project Manager job scored against 5 PM candidates with clearly
# descending levels of PM experience and qualification.
#
# Expected ranking (both candidate and recruiter scores):
#   Senior PM > Mid-level PM > Junior PM > Coordinator > Software Developer
# ══════════════════════════════════════════════════════════════════════════════

PM_JOB = """
Senior Project Manager

Required:
- Coordinating the work and activities of others to get the job done — scheduling
  work, setting priorities, and managing resources (required)
- Judgment and decision making: evaluating project options and choosing the best
  course of action under uncertainty (required)
- Management of personnel resources: motivating, developing, and directing people,
  identifying the best person for the job (required)
- Time management: managing one's own time and the time of others (required)
- Critical thinking: using logic and reasoning to evaluate alternative solutions
  and approaches (required)

Preferred:
- Active listening and clear spoken communication with stakeholders
- Monitoring and assessing project performance to make improvements
- Problem sensitivity: identifying when something has gone or will go wrong
"""

PM_RESUMES = {
    "Senior PM": """
    Senior Programme Manager — 12 years experience. PMP and MSP certified.
    I coordinate the work and activities of large cross-functional teams of up to 35
    people across multiple simultaneous projects with budgets exceeding £10 million.
    Expert at judgment and decision making under uncertainty — I regularly evaluate
    competing project options and select the best course of action under time pressure.
    I motivate, develop, and direct people; I identify the best person for each role
    and manage underperformance directly. Time management is central to my work:
    I manage both my own time and the schedules of my entire programme team.
    I use critical thinking to evaluate alternative approaches and resolve project
    conflicts. I monitor and assess programme performance against KPIs continuously
    and communicate clearly with C-suite stakeholders through written reports and
    presentations. I have a strong track record of identifying risks before they
    materialise and escalating appropriately.
    """,

    "Mid-level PM": """
    Project Manager — 5 years experience. PRINCE2 Practitioner certified.
    I coordinate the day-to-day activities of project teams of 8–12 people, setting
    priorities and managing delivery milestones. I make judgment calls on scope changes
    and resource trade-offs and escalate major decisions to programme level.
    I manage personnel resources within my project: running one-to-ones, allocating
    work, and resolving team conflicts. I track project timelines closely and
    manage my own time effectively. I apply critical thinking when planning work
    and identifying risks. I communicate progress to stakeholders in weekly
    status reports and maintain a project risk register.
    """,

    "Junior PM": """
    Junior Project Manager — 2 years experience. PRINCE2 Foundation certified.
    I assist in coordinating project activities under the supervision of a senior PM.
    I maintain the project plan, chase actions, and update status trackers.
    I am developing my judgment and decision making skills — I flag issues to the
    lead PM and implement agreed solutions. I have some experience managing small
    sub-teams of 2–3 people for short task sprints. I manage my own time and
    deadlines effectively. I use critical thinking in my analysis of project data.
    I am building my stakeholder communication skills through regular meeting notes
    and email updates.
    """,

    "Project Coordinator": """
    Project Coordinator — 4 years experience. No formal PM certification.
    I provide administrative and scheduling support to a project management team.
    I coordinate meeting logistics, maintain action logs, and update project
    documentation. I prepare status report templates for the PM to review.
    I assist with scheduling work and tracking task completion in spreadsheets.
    I have not led a project independently and do not manage personnel or budgets.
    I am a reliable communicator and organise my own workload well.
    Familiar with project tools such as MS Project and Jira.
    """,

    "Software Developer": """
    Software Developer — 6 years experience.
    I design and build software systems, write computer programs, and solve complex
    technical problems. I work within agile delivery teams and contribute to sprint
    planning. I have some experience mentoring one junior developer.
    I use critical thinking and complex problem solving daily in debugging and
    system design. I have no experience managing projects, budgets, or teams.
    I occasionally present technical work to non-technical colleagues.
    Programming and software development are my core competencies.
    """,
}

PM_EXPECTED_ORDER = ["Senior PM", "Mid-level PM", "Junior PM", "Project Coordinator", "Software Developer"]


def run_pm_qualification_tests(cache: dict, comp_map: dict, name_map: dict) -> tuple[int, int]:
    print("\n" + "═" * 70)
    print("SECTION 5 — PROJECT MANAGER QUALIFICATION GRADIENT")
    print("═" * 70)
    print(f"  Expected: {' > '.join(PM_EXPECTED_ORDER)}\n")

    job_raw, job_tech = score(PM_JOB, "job", cache, "pm_job")
    job_reqs = build_job_reqs(job_raw, comp_map, name_map)

    results = {}
    print(f"  {'Persona':22s}  {'match_score':>12}  {'job_score':>10}  {'rec_score':>10}  tier")
    print(f"  {'─'*75}")
    for persona, resume_text in PM_RESUMES.items():
        key = f"pm_{persona.lower().replace(' ', '_').replace('-', '_')}"
        raw, tech = score(resume_text, "resume", cache, key)
        result = compute_fit_score(
            build_candidate_levels(raw, comp_map), job_reqs,
            candidate_tech=tech, job_tech=job_tech,
        )
        results[persona] = result
        ms = f"{result['match_score']:.3f}" if result["match_score"] is not None else "  None"
        js = job_score(result)
        print(f"  {persona:22s}  {ms:>12}  {js:>10.3f}  {result['recommendation_score']:>10.3f}  {result['qualification_tier']}")

    rec_order = sorted(results.keys(), key=lambda p: results[p]["recommendation_score"], reverse=True)
    js_order  = sorted(results.keys(), key=lambda p: job_score(results[p]), reverse=True)

    print(f"\n  Candidate-side actual:  {' > '.join(rec_order)}")
    print(f"  Recruiter-side actual:  {' > '.join(js_order)}")
    print(f"  Expected:               {' > '.join(PM_EXPECTED_ORDER)}\n")

    passed = total = 0

    print("  Candidate-side (recommendation_score):")
    for i in range(len(PM_EXPECTED_ORDER) - 1):
        a, b = PM_EXPECTED_ORDER[i], PM_EXPECTED_ORDER[i + 1]
        a_score = results[a]["recommendation_score"]
        b_score = results[b]["recommendation_score"]
        ok = a_score > b_score
        mark = "✓" if ok else "✗"
        print(f"    {mark} {a} ({a_score:.3f}) > {b} ({b_score:.3f})")
        if ok: passed += 1
        total += 1

    print("\n  Recruiter-side (job_score = match_score × coverage):")
    for i in range(len(PM_EXPECTED_ORDER) - 1):
        a, b = PM_EXPECTED_ORDER[i], PM_EXPECTED_ORDER[i + 1]
        a_score = job_score(results[a])
        b_score = job_score(results[b])
        ok = a_score > b_score
        mark = "✓" if ok else "✗"
        print(f"    {mark} {a} ({a_score:.3f}) > {b} ({b_score:.3f})")
        if ok: passed += 1
        total += 1

    return passed, total


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    cache = load_cache()
    print(f"Cache loaded — {len(cache)} entries.")

    db = SessionLocal()
    try:
        all_comps = db.query(Competency).all()
        comp_map  = {c.onet_element_id: c.competency_id   for c in all_comps}
        name_map  = {c.onet_element_id: c.competency_name for c in all_comps}
    finally:
        db.close()

    results = []

    p, t = run_detection_tests(cache, comp_map)
    results.append(("Detection", p, t))

    p, t = run_range_tests(cache, comp_map, name_map)
    results.append(("Scoring range", p, t))

    p, t = run_discrimination_tests(cache, comp_map, name_map)
    results.append(("Discrimination", p, t))

    p, t = run_consistency_tests(cache, comp_map, name_map)
    results.append(("Consistency", p, t))

    p, t = run_pm_qualification_tests(cache, comp_map, name_map)
    results.append(("PM qualification", p, t))

    print("\n" + "═" * 70)
    print("OVERALL SUMMARY")
    print("═" * 70)
    total_p = total_t = 0
    for section, p, t in results:
        pct = 100 * p / t if t else 0
        print(f"  {section:20s}  {p}/{t} passed  ({pct:.0f}%)")
        total_p += p
        total_t += t
    pct = 100 * total_p / total_t if total_t else 0
    print(f"  {'─'*40}")
    print(f"  {'Total':20s}  {total_p}/{total_t} passed  ({pct:.0f}%)")
    print("═" * 70)


if __name__ == "__main__":
    main()
