"""
Deterministic scorer evaluation.

Runs compute_fit_score against 15 hand-crafted scenarios with known expected tiers,
then prints a sklearn classification_report (Precision / Recall / F1 per tier).

Run with:
  python -m pytest tests/evaluation/evaluate_scorer.py -v -s
  or
  python tests/evaluation/evaluate_scorer.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from unittest.mock import MagicMock
from sklearn.metrics import classification_report
import pytest
from app.services.scorer import compute_fit_score


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def req(cid, job_level, importance, req_type="preferred", name=None, eid=None):
    r = MagicMock()
    r.competency_id = cid
    r.required_level = job_level
    r.importance = importance
    r.requirement_type = req_type
    r.competency = MagicMock()
    r.competency.competency_name = name or f"Comp-{cid}"
    r.competency.onet_element_id = eid or f"1.A.{cid}"
    return r


# ---------------------------------------------------------------------------
# Scenarios
# candidate_levels: {competency_id: level | None}
#   key present + float value  → detected, level known
#   key present + None value   → detected, level undetermined
#   key absent                 → not detected at all
#
# Tier logic:
#   above_count    = scored dims where gap == 0
#   below_count    = scored dims where gap >  0
#   data_gap_count = len(undetermined) + len(absent)
#
#   below==0 and data_gap==0  → fully_qualified
#   below==0                  → data_gap
#   above >= below            → skill_gap
#   else                      → below_requirements
# ---------------------------------------------------------------------------

SCENARIOS = [
    # -----------------------------------------------------------------------
    # fully_qualified (4 scenarios)
    # -----------------------------------------------------------------------
    {
        "name": "fq_two_dims_both_above",
        # dim1: cand=80, job=70 → gap=0 (above); dim2: cand=90, job=80 → gap=0 (above)
        # above=2, below=0, data_gap=0 → fully_qualified
        "candidate_levels": {1: 80.0, 2: 90.0},
        "job_requirements": [
            req(1, 70.0, 1.0),
            req(2, 80.0, 1.0),
        ],
        "expected_tier": "fully_qualified",
    },
    {
        "name": "fq_three_dims_exact_matches",
        # All exact matches → gap=0 for all, above=3, below=0, data_gap=0 → fully_qualified
        "candidate_levels": {1: 70.0, 2: 80.0, 3: 90.0},
        "job_requirements": [
            req(1, 70.0, 1.0),
            req(2, 80.0, 0.5),
            req(3, 90.0, 2.0),
        ],
        "expected_tier": "fully_qualified",
    },
    {
        "name": "fq_five_dims_candidate_well_above",
        # All candidates significantly above job levels → all gap=0 → fully_qualified
        "candidate_levels": {1: 95.0, 2: 88.0, 3: 92.0, 4: 85.0, 5: 100.0},
        "job_requirements": [
            req(1, 60.0, 1.0),
            req(2, 50.0, 0.8),
            req(3, 70.0, 1.2),
            req(4, 40.0, 0.6),
            req(5, 75.0, 1.5),
        ],
        "expected_tier": "fully_qualified",
    },
    {
        "name": "fq_one_dim_importance_unknown_candidate_above",
        # importance=None → treated as weight 1.0; cand=85, job=70 → gap=0 → fully_qualified
        "candidate_levels": {1: 85.0},
        "job_requirements": [
            req(1, 70.0, None),
        ],
        "expected_tier": "fully_qualified",
    },

    # -----------------------------------------------------------------------
    # data_gap (3 scenarios)
    # -----------------------------------------------------------------------
    {
        "name": "dg_one_above_one_undetermined",
        # dim1: cand=80, job=70 → above (gap=0); dim2: cand=None → undetermined
        # below=0, data_gap_count=1 → data_gap
        "candidate_levels": {1: 80.0, 2: None},
        "job_requirements": [
            req(1, 70.0, 1.0),
            req(2, 60.0, 1.0),
        ],
        "expected_tier": "data_gap",
    },
    {
        "name": "dg_one_above_one_absent_preferred",
        # dim1: cand=80, job=70 → above; dim2: absent (preferred)
        # below=0, data_gap_count=1 → data_gap
        "candidate_levels": {1: 80.0},
        "job_requirements": [
            req(1, 70.0, 1.0),
            req(2, 60.0, 0.7, req_type="preferred"),
        ],
        "expected_tier": "data_gap",
    },
    {
        "name": "dg_two_above_two_absent",
        # dim1,dim2 scored above; dim3,dim4 absent
        # below=0, data_gap_count=2 → data_gap
        "candidate_levels": {1: 90.0, 2: 85.0},
        "job_requirements": [
            req(1, 80.0, 1.0),
            req(2, 75.0, 0.8),
            req(3, 60.0, 0.6),
            req(4, 55.0, 0.5),
        ],
        "expected_tier": "data_gap",
    },

    # -----------------------------------------------------------------------
    # skill_gap (4 scenarios)
    # -----------------------------------------------------------------------
    {
        "name": "sg_one_above_one_below_equal_counts",
        # dim1: cand=80, job=70 → gap=0 (above); dim2: cand=50, job=80 → gap>0 (below)
        # above=1, below=1 → above >= below → skill_gap
        "candidate_levels": {1: 80.0, 2: 50.0},
        "job_requirements": [
            req(1, 70.0, 1.0),
            req(2, 80.0, 1.0),
        ],
        "expected_tier": "skill_gap",
    },
    {
        "name": "sg_two_above_one_below",
        # dim1,dim2: above; dim3: below
        # above=2, below=1 → above >= below → skill_gap
        "candidate_levels": {1: 85.0, 2: 90.0, 3: 40.0},
        "job_requirements": [
            req(1, 70.0, 1.0),
            req(2, 80.0, 0.8),
            req(3, 80.0, 1.2),
        ],
        "expected_tier": "skill_gap",
    },
    {
        "name": "sg_three_above_two_below",
        # dim1,2,3: above; dim4,5: below
        # above=3, below=2 → above > below → skill_gap
        "candidate_levels": {1: 80.0, 2: 85.0, 3: 90.0, 4: 30.0, 5: 20.0},
        "job_requirements": [
            req(1, 70.0, 1.0),
            req(2, 75.0, 0.9),
            req(3, 80.0, 1.1),
            req(4, 80.0, 0.8),
            req(5, 90.0, 0.7),
        ],
        "expected_tier": "skill_gap",
    },
    {
        "name": "sg_two_above_one_below_one_undetermined",
        # dim1,2: above; dim3: below; dim4: undetermined (cand=None)
        # above=2, below=1, data_gap_count=1 → below>0, above>=below → skill_gap
        "candidate_levels": {1: 80.0, 2: 90.0, 3: 40.0, 4: None},
        "job_requirements": [
            req(1, 70.0, 1.0),
            req(2, 80.0, 0.8),
            req(3, 80.0, 1.0),
            req(4, 60.0, 0.6),
        ],
        "expected_tier": "skill_gap",
    },

    # -----------------------------------------------------------------------
    # below_requirements (4 scenarios)
    # -----------------------------------------------------------------------
    {
        "name": "br_one_above_two_below",
        # dim1: above; dim2,3: below
        # above=1, below=2 → above < below → below_requirements
        "candidate_levels": {1: 80.0, 2: 40.0, 3: 30.0},
        "job_requirements": [
            req(1, 70.0, 1.0),
            req(2, 80.0, 1.0),
            req(3, 80.0, 0.9),
        ],
        "expected_tier": "below_requirements",
    },
    {
        "name": "br_all_three_below",
        # dim1,2,3: all below job level
        # above=0, below=3 → above < below → below_requirements
        "candidate_levels": {1: 20.0, 2: 30.0, 3: 10.0},
        "job_requirements": [
            req(1, 80.0, 1.0),
            req(2, 80.0, 1.0),
            req(3, 80.0, 1.0),
        ],
        "expected_tier": "below_requirements",
    },
    {
        "name": "br_zero_above_one_below",
        # dim1: below; no dims above
        # above=0, below=1 → above < below → below_requirements
        "candidate_levels": {1: 20.0},
        "job_requirements": [
            req(1, 80.0, 1.0),
        ],
        "expected_tier": "below_requirements",
    },
    {
        "name": "br_zero_above_two_below_one_undetermined",
        # dim1,2: below; dim3: undetermined (cand=None)
        # above=0, below=2, data_gap_count=1 → below>0, above<below → below_requirements
        "candidate_levels": {1: 20.0, 2: 30.0, 3: None},
        "job_requirements": [
            req(1, 80.0, 1.0),
            req(2, 80.0, 0.8),
            req(3, 60.0, 0.6),
        ],
        "expected_tier": "below_requirements",
    },
]


# ---------------------------------------------------------------------------
# pytest parametrised test — one test per scenario
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("scenario", SCENARIOS, ids=[s["name"] for s in SCENARIOS])
def test_scenario(scenario):
    result = compute_fit_score(scenario["candidate_levels"], scenario["job_requirements"])
    assert result["qualification_tier"] == scenario["expected_tier"], (
        f"Expected {scenario['expected_tier']!r}, got {result['qualification_tier']!r}"
    )


# ---------------------------------------------------------------------------
# Standalone report function (python tests/evaluation/evaluate_scorer.py)
# ---------------------------------------------------------------------------

def run_report():
    y_true, y_pred = [], []
    passed = failed = 0
    for s in SCENARIOS:
        result = compute_fit_score(s["candidate_levels"], s["job_requirements"])
        pred = result["qualification_tier"]
        y_true.append(s["expected_tier"])
        y_pred.append(pred)
        status = "PASS" if pred == s["expected_tier"] else "FAIL"
        if pred == s["expected_tier"]:
            passed += 1
        else:
            failed += 1
        print(f"  [{status}] {s['name']:50s}  expected={s['expected_tier']:<22} got={pred}")

    print(f"\nResults: {passed}/{len(SCENARIOS)} passed")
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, zero_division=0))


if __name__ == "__main__":
    print("=== Scorer Evaluation ===\n")
    run_report()
