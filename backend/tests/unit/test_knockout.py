"""
Unit tests focused on knockout logic in compute_fit_score.
No database required — all job requirement rows are MagicMock objects.
"""
from unittest.mock import MagicMock
import pytest
from app.services.scorer import compute_fit_score


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def req(cid, job_level=60, importance=0.8, req_type="preferred", eid=None):
    r = MagicMock()
    r.competency_id = cid
    r.required_level = job_level
    r.importance = importance
    r.requirement_type = req_type
    r.competency = MagicMock()
    r.competency.competency_name = f"Comp-{cid}"
    r.competency.onet_element_id = eid or f"1.A.{cid}"
    return r


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_required_dim_absent_triggers_knockout():
    """A required dimension with no evidence in candidate profile → knockout_failed=True."""
    result = compute_fit_score({}, [req(1, req_type="required")])
    assert result["knockout_failed"] is True


def test_required_dim_present_below_level_no_knockout():
    """Presence is sufficient for knockout — being below level is not a knockout."""
    # candidate=30, job=60 → gap exists, but competency IS present
    result = compute_fit_score({1: 30.0}, [req(1, job_level=60, req_type="required")])
    assert result["knockout_failed"] is False


def test_required_dim_present_above_level_no_knockout():
    """Required dim present and candidate exceeds job level → no knockout."""
    result = compute_fit_score({1: 90.0}, [req(1, job_level=60, req_type="required")])
    assert result["knockout_failed"] is False


def test_required_dim_present_level_unknown_no_knockout():
    """Required dim detected (level=None) but presence is enough — no knockout."""
    result = compute_fit_score({1: None}, [req(1, req_type="required")])
    assert result["knockout_failed"] is False


def test_preferred_dim_absent_no_knockout():
    """A preferred (not required) absent dimension does NOT trigger knockout."""
    result = compute_fit_score({}, [req(1, req_type="preferred")])
    assert result["knockout_failed"] is False


def test_preferred_dim_below_level_no_knockout():
    """Preferred dim present but below level — no knockout."""
    result = compute_fit_score({1: 20.0}, [req(1, job_level=60, req_type="preferred")])
    assert result["knockout_failed"] is False


def test_two_required_dims_both_present_no_knockout():
    """Both required dimensions present → no knockout."""
    candidate_levels = {1: 70.0, 2: 80.0}
    reqs = [req(1, req_type="required"), req(2, req_type="required")]
    result = compute_fit_score(candidate_levels, reqs)
    assert result["knockout_failed"] is False


def test_two_required_dims_one_absent_triggers_knockout():
    """One of two required dimensions absent → knockout_failed=True."""
    candidate_levels = {1: 70.0}
    reqs = [req(1, req_type="required"), req(2, req_type="required")]
    result = compute_fit_score(candidate_levels, reqs)
    assert result["knockout_failed"] is True


def test_two_required_dims_both_absent_triggers_knockout():
    """Both required dimensions absent → knockout_failed=True."""
    reqs = [req(1, req_type="required"), req(2, req_type="required")]
    result = compute_fit_score({}, reqs)
    assert result["knockout_failed"] is True


def test_required_absent_plus_preferred_absent_knockout_true():
    """One required absent + one preferred absent → knockout driven by required dim."""
    reqs = [req(1, req_type="required"), req(2, req_type="preferred")]
    result = compute_fit_score({}, reqs)
    assert result["knockout_failed"] is True


def test_knockout_dimension_flag_true_for_required_dim_in_absent():
    """Required absent dim should have knockout_dimension=True in gap_profile absent dict."""
    result = compute_fit_score({}, [req(1, req_type="required", eid="1.A.1")])
    absent_entry = result["gap_profile"]["absent"]["1.A.1"]
    assert absent_entry["knockout_dimension"] is True


def test_knockout_dimension_flag_false_for_preferred_dim_in_absent():
    """Preferred absent dim should have knockout_dimension=False in gap_profile absent dict."""
    result = compute_fit_score({}, [req(1, req_type="preferred", eid="1.A.1")])
    absent_entry = result["gap_profile"]["absent"]["1.A.1"]
    assert absent_entry["knockout_dimension"] is False
