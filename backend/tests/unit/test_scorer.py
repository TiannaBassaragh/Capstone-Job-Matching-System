"""
Unit tests for compute_fit_score in app.services.scorer.
No database required — all job requirement rows are MagicMock objects.
"""
from unittest.mock import MagicMock
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
# 1. TestGapCalculation
# ---------------------------------------------------------------------------

class TestGapCalculation:
    """Verify gap and fit_value arithmetic for individual scored dimensions."""

    def test_candidate_below_job_level(self):
        # candidate=60, job=80 → gap=(80-60)/100=0.20, fit_value=0.80
        result = compute_fit_score({1: 60.0}, [req(1, 80.0, 1.0)])
        entry = result["gap_profile"]["scored"]["1.A.1"]
        assert entry["gap"] == pytest.approx(0.20, abs=1e-3)
        assert entry["fit_value"] == pytest.approx(0.80, abs=1e-3)

    def test_candidate_above_job_level_no_bonus(self):
        # candidate=90, job=70 → gap=max(0,(70-90)/100)=0, fit_value=1.0
        result = compute_fit_score({1: 90.0}, [req(1, 70.0, 1.0)])
        entry = result["gap_profile"]["scored"]["1.A.1"]
        assert entry["gap"] == pytest.approx(0.0, abs=1e-3)
        assert entry["fit_value"] == pytest.approx(1.0, abs=1e-3)

    def test_candidate_exactly_at_job_level(self):
        # candidate=75, job=75 → gap=0, fit_value=1.0
        result = compute_fit_score({1: 75.0}, [req(1, 75.0, 1.0)])
        entry = result["gap_profile"]["scored"]["1.A.1"]
        assert entry["gap"] == pytest.approx(0.0, abs=1e-3)
        assert entry["fit_value"] == pytest.approx(1.0, abs=1e-3)

    def test_gap_floors_at_zero_never_negative(self):
        # candidate=100, job=0 → gap=max(0,-1.0)=0
        result = compute_fit_score({1: 100.0}, [req(1, 0.0, 1.0)])
        entry = result["gap_profile"]["scored"]["1.A.1"]
        assert entry["gap"] == pytest.approx(0.0, abs=1e-3)
        assert entry["fit_value"] == pytest.approx(1.0, abs=1e-3)

    def test_full_gap_candidate_zero_job_max(self):
        # candidate=0, job=100 → gap=1.0, fit_value=0.0
        result = compute_fit_score({1: 0.0}, [req(1, 100.0, 1.0)])
        entry = result["gap_profile"]["scored"]["1.A.1"]
        assert entry["gap"] == pytest.approx(1.0, abs=1e-3)
        assert entry["fit_value"] == pytest.approx(0.0, abs=1e-3)

    def test_fractional_levels(self):
        # candidate=55.5, job=75.5 → gap=(75.5-55.5)/100=0.20, fit_value=0.80
        result = compute_fit_score({1: 55.5}, [req(1, 75.5, 1.0)])
        entry = result["gap_profile"]["scored"]["1.A.1"]
        assert entry["gap"] == pytest.approx(0.20, abs=1e-3)
        assert entry["fit_value"] == pytest.approx(0.80, abs=1e-3)


# ---------------------------------------------------------------------------
# 2. TestMatchScore
# ---------------------------------------------------------------------------

class TestMatchScore:
    """Verify match_score weighted arithmetic and None conditions."""

    def test_single_dim_perfect_score(self):
        # candidate=80, job=80 → fit=1.0, match_score=1.0
        result = compute_fit_score({1: 80.0}, [req(1, 80.0, 1.0)])
        assert result["match_score"] == pytest.approx(1.0, abs=1e-3)

    def test_two_dims_weighted_average(self):
        # dim1: imp=2.0, cand=60, job=80 → gap=0.20, fit=0.80, contrib=2.0*0.80=1.60
        # dim2: imp=1.0, cand=90, job=70 → gap=0,    fit=1.0,  contrib=1.0*1.0=1.00
        # match_score = 2.60/3.0 = 0.8667 → round(,3)=0.867
        candidate_levels = {1: 60.0, 2: 90.0}
        reqs = [req(1, 80.0, 2.0), req(2, 70.0, 1.0)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["match_score"] == pytest.approx(0.867, abs=1e-3)

    def test_three_dims_different_importances(self):
        # dim1: imp=3.0, cand=50, job=80 → gap=0.30, fit=0.70, contrib=3.0*0.70=2.10
        # dim2: imp=1.0, cand=75, job=75 → gap=0,    fit=1.0,  contrib=1.0*1.0=1.00
        # dim3: imp=2.0, cand=90, job=60 → gap=0,    fit=1.0,  contrib=2.0*1.0=2.00
        # match_score = 5.10/6.0 = 0.85
        candidate_levels = {1: 50.0, 2: 75.0, 3: 90.0}
        reqs = [req(1, 80.0, 3.0), req(2, 75.0, 1.0), req(3, 60.0, 2.0)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["match_score"] == pytest.approx(0.85, abs=1e-3)

    def test_unknown_importance_treated_as_weight_one(self):
        # importance=None should produce same result as importance=1.0
        candidate_levels = {1: 60.0}
        result_none = compute_fit_score(candidate_levels, [req(1, 80.0, None)])
        result_one  = compute_fit_score(candidate_levels, [req(1, 80.0, 1.0)])
        assert result_none["match_score"] == pytest.approx(result_one["match_score"], abs=1e-3)

    def test_all_importance_unknown_weights_all_one(self):
        # Two dims with None importance; each uses w=1.0
        # dim1: cand=60, job=80 → fit=0.80, contrib=1.0*0.80=0.80
        # dim2: cand=80, job=80 → fit=1.0,  contrib=1.0*1.0=1.00
        # match_score = 1.80/2.0 = 0.90
        candidate_levels = {1: 60.0, 2: 80.0}
        reqs = [req(1, 80.0, None), req(2, 80.0, None)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["match_score"] == pytest.approx(0.90, abs=1e-3)

    def test_match_score_none_when_candidate_level_is_none(self):
        # Candidate level=None → goes to undetermined, nothing scored → match_score=None
        result = compute_fit_score({1: None}, [req(1, 80.0, 1.0)])
        assert result["match_score"] is None

    def test_match_score_none_when_all_absent(self):
        # Competency not in candidate_levels at all → absent → match_score=None
        result = compute_fit_score({}, [req(1, 80.0, 1.0)])
        assert result["match_score"] is None

    def test_match_score_none_when_job_level_none_for_all_dims(self):
        # job_level=None → goes to undetermined, nothing scored → match_score=None
        result = compute_fit_score({1: 70.0}, [req(1, None, 1.0)])
        assert result["match_score"] is None


# ---------------------------------------------------------------------------
# 3. TestCoverage
# ---------------------------------------------------------------------------

class TestCoverage:
    """Verify coverage fraction calculation."""

    def test_all_dims_scored(self):
        candidate_levels = {1: 70.0, 2: 80.0}
        reqs = [req(1, 60.0, 1.0), req(2, 70.0, 1.0)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["coverage"] == pytest.approx(1.0, abs=1e-3)

    def test_two_of_three_scored_one_undetermined(self):
        # dim3 candidate_level=None → undetermined → not scored
        # coverage = round(2/3, 3) = 0.667
        candidate_levels = {1: 70.0, 2: 80.0, 3: None}
        reqs = [req(1, 60.0, 1.0), req(2, 70.0, 1.0), req(3, 50.0, 1.0)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["coverage"] == pytest.approx(0.667, abs=1e-3)

    def test_zero_coverage_when_all_absent(self):
        result = compute_fit_score({}, [req(1, 60.0, 1.0), req(2, 70.0, 1.0)])
        assert result["coverage"] == pytest.approx(0.0, abs=1e-3)

    def test_empty_requirements_gives_zero_coverage(self):
        result = compute_fit_score({1: 70.0}, [])
        assert result["coverage"] == pytest.approx(0.0, abs=1e-3)


# ---------------------------------------------------------------------------
# 4. TestGapProfileStructure
# ---------------------------------------------------------------------------

class TestGapProfileStructure:
    """Verify gap_profile dict structure and key presence."""

    def test_scored_dim_in_scored_not_elsewhere(self):
        result = compute_fit_score({1: 70.0}, [req(1, 60.0, 1.0)])
        gp = result["gap_profile"]
        assert "1.A.1" in gp["scored"]
        assert "1.A.1" not in gp["undetermined"]
        assert "1.A.1" not in gp["absent"]

    def test_absent_dim_in_absent_dict(self):
        result = compute_fit_score({}, [req(1, 60.0, 1.0)])
        gp = result["gap_profile"]
        assert "1.A.1" in gp["absent"]
        assert "1.A.1" not in gp["scored"]
        assert "1.A.1" not in gp["undetermined"]

    def test_candidate_level_none_goes_to_undetermined_with_correct_status(self):
        result = compute_fit_score({1: None}, [req(1, 60.0, 1.0)])
        gp = result["gap_profile"]
        assert "1.A.1" in gp["undetermined"]
        entry = gp["undetermined"]["1.A.1"]
        assert entry["candidate_status"] == "undetermined"

    def test_job_level_none_candidate_known_goes_to_undetermined(self):
        result = compute_fit_score({1: 70.0}, [req(1, None, 1.0)])
        gp = result["gap_profile"]
        assert "1.A.1" in gp["undetermined"]
        entry = gp["undetermined"]["1.A.1"]
        assert entry["job_level_status"] == "undetermined"
        assert entry["candidate_status"] == "detected"

    def test_both_levels_none_goes_to_undetermined_both_statuses_undetermined(self):
        result = compute_fit_score({1: None}, [req(1, None, 1.0)])
        gp = result["gap_profile"]
        assert "1.A.1" in gp["undetermined"]
        entry = gp["undetermined"]["1.A.1"]
        assert entry["candidate_status"] == "undetermined"
        assert entry["job_level_status"] == "undetermined"

    def test_scored_entry_has_all_required_keys(self):
        result = compute_fit_score({1: 70.0}, [req(1, 60.0, 0.8)])
        entry = result["gap_profile"]["scored"]["1.A.1"]
        for key in ("name", "fit_value", "required_level", "candidate_level",
                    "gap", "importance", "knockout_dimension"):
            assert key in entry, f"Missing key '{key}' in scored entry"

    def test_absent_entry_has_all_required_keys(self):
        result = compute_fit_score({}, [req(1, 60.0, 0.8)])
        entry = result["gap_profile"]["absent"]["1.A.1"]
        for key in ("name", "required_level", "knockout_dimension"):
            assert key in entry, f"Missing key '{key}' in absent entry"

    def test_undetermined_entry_has_all_required_keys(self):
        result = compute_fit_score({1: None}, [req(1, 60.0, 0.8)])
        entry = result["gap_profile"]["undetermined"]["1.A.1"]
        for key in ("name", "required_level", "candidate_level",
                    "candidate_status", "job_level_status", "knockout_dimension"):
            assert key in entry, f"Missing key '{key}' in undetermined entry"

    def test_importance_none_preserved_in_scored_entry_not_replaced(self):
        # importance=None in the scored dict must stay None (weight 1.0 used internally
        # but the stored value should be the original None)
        result = compute_fit_score({1: 70.0}, [req(1, 60.0, None)])
        entry = result["gap_profile"]["scored"]["1.A.1"]
        assert entry["importance"] is None


# ---------------------------------------------------------------------------
# 5. TestQualificationTier
# ---------------------------------------------------------------------------

class TestQualificationTier:
    """Verify the four qualification tiers are assigned correctly."""

    def test_all_above_no_gaps_fully_qualified(self):
        # Two dims both above job level → above=2, below=0, data_gap=0 → fully_qualified
        candidate_levels = {1: 80.0, 2: 90.0}
        reqs = [req(1, 70.0, 1.0), req(2, 80.0, 1.0)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["qualification_tier"] == "fully_qualified"

    def test_exact_level_match_fully_qualified(self):
        # Exact match → gap=0 → above_count counts it, below=0, data_gap=0 → fully_qualified
        result = compute_fit_score({1: 75.0}, [req(1, 75.0, 1.0)])
        assert result["qualification_tier"] == "fully_qualified"

    def test_all_above_one_undetermined_is_data_gap(self):
        # dim1 scored above, dim2 candidate_level=None → undetermined
        # below=0, data_gap_count=1 → data_gap
        candidate_levels = {1: 80.0, 2: None}
        reqs = [req(1, 70.0, 1.0), req(2, 60.0, 1.0)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["qualification_tier"] == "data_gap"

    def test_all_above_one_absent_is_data_gap(self):
        # dim1 scored above, dim2 absent
        # below=0, data_gap_count=1 → data_gap
        candidate_levels = {1: 80.0}
        reqs = [req(1, 70.0, 1.0), req(2, 60.0, 1.0)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["qualification_tier"] == "data_gap"

    def test_one_above_one_below_equal_counts_is_skill_gap(self):
        # above=1, below=1 → above_count(1) >= below_count(1) → skill_gap
        candidate_levels = {1: 80.0, 2: 50.0}
        reqs = [req(1, 70.0, 1.0), req(2, 80.0, 1.0)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["qualification_tier"] == "skill_gap"

    def test_two_above_one_below_is_skill_gap(self):
        # above=2, below=1 → above_count(2) >= below_count(1) → skill_gap
        candidate_levels = {1: 80.0, 2: 90.0, 3: 40.0}
        reqs = [req(1, 70.0, 1.0), req(2, 80.0, 1.0), req(3, 80.0, 1.0)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["qualification_tier"] == "skill_gap"

    def test_two_above_one_below_one_undetermined_is_skill_gap(self):
        # above=2, below=1, undetermined=1
        # below_count=1 > 0, above_count=2 >= below_count=1 → skill_gap
        candidate_levels = {1: 80.0, 2: 90.0, 3: 40.0, 4: None}
        reqs = [
            req(1, 70.0, 1.0),
            req(2, 80.0, 1.0),
            req(3, 80.0, 1.0),
            req(4, 60.0, 1.0),
        ]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["qualification_tier"] == "skill_gap"

    def test_one_above_two_below_is_below_requirements(self):
        # above=1, below=2 → above_count(1) < below_count(2) → below_requirements
        candidate_levels = {1: 80.0, 2: 40.0, 3: 30.0}
        reqs = [req(1, 70.0, 1.0), req(2, 80.0, 1.0), req(3, 80.0, 1.0)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["qualification_tier"] == "below_requirements"

    def test_all_below_is_below_requirements(self):
        # above=0, below=3 → below_requirements
        candidate_levels = {1: 20.0, 2: 30.0, 3: 10.0}
        reqs = [req(1, 80.0, 1.0), req(2, 80.0, 1.0), req(3, 80.0, 1.0)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["qualification_tier"] == "below_requirements"

    def test_zero_above_one_below_one_undetermined_is_below_requirements(self):
        # above=0, below=1, undetermined=1
        # below_count=1 > 0, above_count=0 < below_count=1 → below_requirements
        candidate_levels = {1: 20.0, 2: None}
        reqs = [req(1, 80.0, 1.0), req(2, 60.0, 1.0)]
        result = compute_fit_score(candidate_levels, reqs)
        assert result["qualification_tier"] == "below_requirements"


# ---------------------------------------------------------------------------
# 6. TestExplanation
# ---------------------------------------------------------------------------

class TestExplanation:
    """Explanation is generated on-demand via GET /matches/{id}/explain.
    compute_fit_score returns None — the LLM explanation is not pre-built."""

    def test_explanation_is_none_by_default(self):
        result = compute_fit_score({1: 70.0}, [req(1, 60.0, 1.0)])
        assert result["explanation"] is None

    def test_explanation_none_when_no_score(self):
        result = compute_fit_score({}, [req(1, 60.0, 1.0)])
        assert result["explanation"] is None

    def test_explanation_none_with_unknown_importance(self):
        result = compute_fit_score({1: 70.0}, [req(1, 60.0, None)])
        assert result["explanation"] is None

    def test_explanation_none_when_undetermined(self):
        result = compute_fit_score({1: None}, [req(1, 60.0, 1.0)])
        assert result["explanation"] is None

    def test_explanation_none_when_absent(self):
        result = compute_fit_score({}, [req(1, 60.0, 1.0)])
        assert result["explanation"] is None

    def test_explanation_none_when_knockout(self):
        result = compute_fit_score({}, [req(1, 60.0, 1.0, req_type="required")])
        assert result["explanation"] is None
