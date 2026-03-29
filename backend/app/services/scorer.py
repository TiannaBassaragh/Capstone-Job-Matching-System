import re
from sqlalchemy.orm import Session
from app.models.models import JobCompetency, JobPost, Competency
from app.services.embedder import get_anchor_store, score_document, adjust_levels

_KNOCKOUT_RE = re.compile(
    r"\bmust.have\b|\brequired\b|\bessential\b|\bmandatory\b",
    re.IGNORECASE,
)


def score_job_post(job: JobPost, db: Session) -> None:
    """
    Scores a job description and writes job_competencies to the DB.
    Replaces any existing competencies for this job.
    Called on job create and on description update.
    """
    store = get_anchor_store(db)
    scores = score_document(job.description, store)
    adjust_levels(scores)

    comp_map = {
        c.onet_element_id: c.competency_id
        for c in db.query(Competency)
        .filter(Competency.onet_element_id.in_(list(scores.keys())))
        .all()
    }

    db.query(JobCompetency).filter(JobCompetency.job_id == job.job_id).delete()

    for eid, data in scores.items():
        cid = comp_map.get(eid)
        if cid is None:
            continue
        db.add(JobCompetency(
            job_id           = job.job_id,
            competency_id    = cid,
            required_level   = data["estimated_level"],
            importance       = data["similarity"],
            requirement_type = "required" if _KNOCKOUT_RE.search(data["evidence"]) else "preferred",
        ))

    db.commit()

# A candidate fails knockout if their fit value on a required dimension drops below this.
KNOCKOUT_THRESHOLD = 0.5

# Partial penalty for missing dimensions, by O*NET category.
# Cognitive/behavioural dimensions get a softer penalty than technical/knowledge ones.
_MISSING_PENALTY: dict[str, float] = {
    "Abilities":               0.4,
    "Work Styles":             0.4,
    "Basic Skills":            0.3,
    "Cross-Functional Skills": 0.3,
    "Knowledge":               0.2,
    "Education":               0.2,
}
_DEFAULT_MISSING_PENALTY = 0.25


def compute_fit_score(
    candidate_levels: dict[int, float],
    job_requirements: list[JobCompetency],
) -> dict:
    """
    Computes the weighted fit score for a candidate-job pair.

    candidate_levels: {competency_id: level_score (0-100)}
    job_requirements: list of JobCompetency ORM rows (with .competency loaded)

    Returns:
      {match_score, knockout_failed, gap_profile, explanation}
    """
    total_weight  = 0.0
    weighted_sum  = 0.0
    gap_profile   = {}
    knockout_failed = False

    for req in job_requirements:
        cid         = req.competency_id
        job_level   = req.required_level
        importance  = req.importance if req.importance is not None else 0.5
        is_required = req.requirement_type == "required"
        category    = req.competency.category if req.competency else None
        eid         = req.competency.onet_element_id if req.competency else str(cid)

        candidate_level = candidate_levels.get(cid)

        if candidate_level is not None:
            gap       = max(0.0, (job_level - candidate_level) / 100.0)
            fit_value = 1.0 - gap
        else:
            fit_value       = _MISSING_PENALTY.get(category, _DEFAULT_MISSING_PENALTY)
            gap             = 1.0 - fit_value

        if is_required and fit_value < KNOCKOUT_THRESHOLD:
            knockout_failed = True

        total_weight += importance
        weighted_sum += importance * fit_value

        gap_profile[eid] = {
            "name":                req.competency.competency_name if req.competency else eid,
            "fit_value":           round(fit_value, 3),
            "required_level":      job_level,
            "candidate_level":     candidate_level,
            "gap":                 round(gap, 3),
            "knockout_dimension":  is_required,
        }

    match_score = round(weighted_sum / total_weight, 3) if total_weight > 0 else 0.0

    detected   = sum(1 for v in gap_profile.values() if v["candidate_level"] is not None)
    total      = len(gap_profile)

    if knockout_failed:
        explanation = (
            f"Knockout failed: candidate did not meet one or more required dimensions. "
            f"Fit score: {match_score:.2f} ({detected}/{total} dimensions detected)."
        )
    else:
        explanation = (
            f"Fit score: {match_score:.2f}. "
            f"Candidate matched {detected}/{total} job dimensions."
        )

    return {
        "match_score":    match_score,
        "knockout_failed": knockout_failed,
        "gap_profile":    gap_profile,
        "explanation":    explanation,
    }
