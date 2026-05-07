"""
End-to-end pipeline evaluation using real DB data + LLM judge.

Strategy
--------
1.  For all (candidate × job) combinations, compute fit score using the real
    scored competencies already in the DB (no new LLM scoring calls).
2.  Skip data_gap outcomes — those are routed to clarifying questions, not
    a scoring error.
3.  For every evaluable (non-data_gap) pair, parse the candidate's resume and
    call an LLM judge with (resume_text, job_description) to produce ground truth.
4.  Compare pipeline prediction vs judge ground truth → Precision / Recall / F1.

Tier → prediction mapping
    skill_gap / fully_qualified  →  "match"
    below_requirements           →  "no_match"

Requires
    DATABASE_URL env var (PostgreSQL connection string)
    ANTHROPIC_API_KEY  (or GEMINI_API_KEY + LLM_PROVIDER=gemini)

Run
    python tests/evaluation/evaluate_pipeline.py
"""
import sys
import os
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from dotenv import load_dotenv
load_dotenv()


# ─── LLM judge ────────────────────────────────────────────────────────────────

_JUDGE_SYSTEM = """\
You are an experienced HR recruiter evaluating candidate-job fit.
Given a resume and a job description, classify the match.

Output ONLY valid JSON, no markdown, no extra text:
{"fit": "good_fit" | "poor_fit"}

good_fit  — the candidate meets most core requirements and would likely
            succeed in the role.
poor_fit  — the candidate is missing core requirements or is significantly
            underqualified for this role.\
"""


def _llm_judge(resume_text: str, job_text: str) -> str:
    """Calls LLM and returns 'good_fit' or 'poor_fit'."""
    import litellm
    from app.services.llm_scorer import LLM_MODEL

    response = litellm.completion(
        model=LLM_MODEL,
        max_tokens=64,
        temperature=0,
        messages=[
            {"role": "system", "content": _JUDGE_SYSTEM},
            {"role": "user",
             "content": f"Resume:\n{resume_text}\n\nJob Description:\n{job_text}"},
        ],
    )
    raw = response.choices[0].message.content or ""
    raw = raw.strip()
    # strip markdown fences if present
    import re
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
    if m:
        raw = m.group(1).strip()
    return json.loads(raw)["fit"]


# ─── main evaluation ──────────────────────────────────────────────────────────

TIER_TO_PREDICTION = {
    "fully_qualified":   "match",
    "skill_gap":         "match",
    "below_requirements": "no_match",
    "data_gap":          None,   # excluded — routes to clarifying questions
}

JUDGE_TO_TRUTH = {
    "good_fit":  "match",
    "poor_fit":  "no_match",
}


def evaluate(max_evaluated: int = 40) -> None:
    from app.database import SessionLocal
    from app.models.models import (
        Candidate, JobPost, CandidateCompetency, JobCompetency, Resume
    )
    from app.services.scorer import compute_fit_score
    from app.services.resume_parser import parse_resume_bytes
    from sqlalchemy.orm import joinedload
    from sklearn.metrics import classification_report

    db = SessionLocal()
    try:
        candidates = db.query(Candidate).all()
        jobs       = db.query(JobPost).all()

        # Cache parsed resume texts keyed by candidate_id
        resume_cache: dict[int, str | None] = {}

        def get_resume_text(candidate_id: int) -> str | None:
            if candidate_id in resume_cache:
                return resume_cache[candidate_id]
            resume = (
                db.query(Resume)
                .filter_by(candidate_id=candidate_id)
                .order_by(Resume.upload_date.desc())
                .first()
            )
            text = parse_resume_bytes(resume.resume_file) if resume else None
            resume_cache[candidate_id] = text
            return text

        evaluable: list[dict] = []

        print("Computing fit scores for all candidate×job pairs...")
        for cand in candidates:
            cand_comps = (
                db.query(CandidateCompetency)
                .filter_by(candidate_id=cand.candidate_id)
                .all()
            )
            if not cand_comps:
                continue
            candidate_levels = {r.competency_id: r.level_score for r in cand_comps}

            for job in jobs:
                job_reqs = (
                    db.query(JobCompetency)
                    .filter_by(job_id=job.job_id)
                    .options(joinedload(JobCompetency.competency))
                    .all()
                )
                if not job_reqs:
                    continue

                result = compute_fit_score(candidate_levels, job_reqs)
                tier   = result["qualification_tier"]
                pred   = TIER_TO_PREDICTION.get(tier)

                if pred is not None:
                    evaluable.append({
                        "candidate_id": cand.candidate_id,
                        "job_id":       job.job_id,
                        "job_title":    job.title,
                        "job_desc":     job.description,
                        "tier":         tier,
                        "prediction":   pred,
                        "score":        result["match_score"],
                    })

        # Tier distribution summary
        from collections import Counter
        all_tiers = Counter()
        for cand in candidates:
            cand_comps = db.query(CandidateCompetency).filter_by(candidate_id=cand.candidate_id).all()
            if not cand_comps:
                continue
            cl = {r.competency_id: r.level_score for r in cand_comps}
            for job in jobs:
                jr = (db.query(JobCompetency).filter_by(job_id=job.job_id)
                      .options(joinedload(JobCompetency.competency)).all())
                if not jr:
                    continue
                all_tiers[compute_fit_score(cl, jr)["qualification_tier"]] += 1

        total = sum(all_tiers.values())
        print(f"\nTier distribution across all {total} pairs:")
        for tier, count in all_tiers.most_common():
            pct = 100 * count / total
            label = " (evaluated)" if tier != "data_gap" else " (skipped — routes to clarifying questions)"
            print(f"  {tier:<22} {count:>3}  ({pct:.0f}%){label}")

        # Cap at max_evaluated (balanced sample)
        import random
        random.seed(42)
        matches    = [e for e in evaluable if e["prediction"] == "match"]
        no_matches = [e for e in evaluable if e["prediction"] == "no_match"]
        half = max_evaluated // 2
        sample = random.sample(matches, min(half, len(matches))) + \
                 random.sample(no_matches, min(half, len(no_matches)))
        random.shuffle(sample)

        print(f"\nCalling LLM judge on {len(sample)} pairs "
              f"({len(matches)} match / {len(no_matches)} no_match evaluable, "
              f"sampling up to {max_evaluated})...")
        print()
        print(f"{'Candidate':>12}  {'Job':<30}  {'Tier':<22}  {'Pred':<10}  {'Judge':<10}  OK")
        print("-" * 100)

        y_pred, y_true = [], []
        errors = 0

        for e in sample:
            resume_text = get_resume_text(e["candidate_id"])
            if not resume_text:
                print(f"  cand={e['candidate_id']}  {e['job_title']:<30}  — no resume, SKIP")
                continue
            try:
                judge_raw = _llm_judge(resume_text, e["job_desc"])
                judge_family = JUDGE_TO_TRUTH.get(judge_raw, judge_raw)
                ok = "✓" if e["prediction"] == judge_family else "✗"
                print(f"  cand={e['candidate_id']:>4}  {e['job_title']:<30}  "
                      f"{e['tier']:<22}  {e['prediction']:<10}  {judge_family:<10}  {ok}")
                y_pred.append(e["prediction"])
                y_true.append(judge_family)
            except Exception as exc:
                print(f"  cand={e['candidate_id']:>4}  {e['job_title']:<30}  ERROR: {exc}")
                errors += 1

        if not y_true:
            print("\nNo evaluable pairs — cannot compute classification report.")
            return

        correct = sum(p == t for p, t in zip(y_pred, y_true))
        print(f"\nResults: {correct}/{len(y_true)} correct  ({errors} errors)")
        print("\nClassification Report (pipeline vs LLM judge ground truth):")
        print(classification_report(y_true, y_pred, zero_division=0))

    finally:
        db.close()


if __name__ == "__main__":
    print("=== Pipeline Evaluation (DB data + LLM judge) ===\n")
    evaluate()
