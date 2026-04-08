from sqlalchemy.orm import Session
from app.models.models import JobCompetency, JobPost, Competency, Candidate, CandidateCompetency, Resume
from app.services.resume_parser import parse_resume_bytes
from app.services.llm_scorer import score_document


def score_resume(candidate: Candidate, resume: Resume, db: Session) -> None:
    """
    Scores a resume via LLM and writes candidate_competencies to the DB.
    Replaces any existing competencies for this candidate.
    Called on resume upload and on resume replacement.
    """
    text = parse_resume_bytes(resume.resume_file)
    scores = score_document(text, db, mode="resume")

    comp_map = {
        c.onet_element_id: c.competency_id
        for c in db.query(Competency)
        .filter(Competency.onet_element_id.in_(list(scores.keys())))
        .all()
    }

    db.query(CandidateCompetency).filter(
        CandidateCompetency.candidate_id == candidate.candidate_id
    ).delete()

    for eid, data in scores.items():
        cid = comp_map.get(eid)
        if cid is None:
            continue
        db.add(CandidateCompetency(
            candidate_id=candidate.candidate_id,
            competency_id=cid,
            level_score=data.get("level"),
        ))

    db.commit()


def score_job_post(job: JobPost, db: Session) -> None:
    """
    Scores a job description via LLM and writes job_competencies to the DB.
    Replaces any existing competencies for this job.
    Called on job create and on description update.
    """
    scores = score_document(job.description, db, mode="job")

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
            required_level   = data.get("required_level"),
            importance       = data.get("importance"),
            requirement_type = data.get("requirement_type", "preferred"),
        ))

    db.commit()


def compute_fit_score(
    candidate_levels: dict[int, float | None],
    job_requirements: list[JobCompetency],
) -> dict:
    """
    Computes the fit score for a candidate-job pair.

    candidate_levels: {competency_id: level_score}
      - key present, float value  → detected, level known
      - key present, None value   → detected, level undetermined
      - key absent                → not detected at all

    job_requirements: list of JobCompetency ORM rows (with .competency loaded)

    Returns:
      match_score     — weighted fit over fully-scored dimensions; None if nothing could be scored
      coverage        — fraction of job dimensions that were fully scored (0.0–1.0)
      knockout_failed — True only when a required dimension is entirely absent from the candidate
      gap_profile     — {scored: {...}, undetermined: {...}, absent: {...}}
      explanation     — human-readable summary
    """
    scored       = {}
    undetermined = {}
    absent       = {}
    knockout_failed = False

    weighted_sum    = 0.0
    total_weight    = 0.0
    equal_weight_count = 0  # dimensions scored but with unknown importance

    for req in job_requirements:
        cid        = req.competency_id
        job_level  = req.required_level   # float | None
        importance = req.importance        # float | None
        is_required = req.requirement_type == "required"
        name = req.competency.competency_name if req.competency else str(cid)
        eid  = req.competency.onet_element_id if req.competency else str(cid)

        if cid not in candidate_levels:
            # No evidence of this competency in the candidate's profile.
            absent[eid] = {
                "name":              name,
                "required_level":    job_level,
                "knockout_dimension": is_required,
            }
            if is_required:
                knockout_failed = True

        elif candidate_levels[cid] is None:
            # Competency detected in resume but proficiency level could not be inferred.
            undetermined[eid] = {
                "name":              name,
                "required_level":    job_level,
                "candidate_level":   None,
                "candidate_status":  "undetermined",
                "job_level_status":  "detected" if job_level is not None else "undetermined",
                "knockout_dimension": is_required,
            }

        else:
            candidate_level = candidate_levels[cid]

            if job_level is None:
                # Candidate level known but job's required level was not inferrable.
                undetermined[eid] = {
                    "name":              name,
                    "required_level":    None,
                    "candidate_level":   candidate_level,
                    "candidate_status":  "detected",
                    "job_level_status":  "undetermined",
                    "knockout_dimension": is_required,
                }

            else:
                # Both levels known — compute gap.
                gap       = max(0.0, (job_level - candidate_level) / 100.0)
                fit_value = round(1.0 - gap, 3)

                # When importance is unknown we treat this dimension as equally
                # weighted (w=1.0) — the least-biased assumption available.
                w = importance if importance is not None else 1.0
                if importance is None:
                    equal_weight_count += 1

                weighted_sum += w * fit_value
                total_weight += w

                scored[eid] = {
                    "name":              name,
                    "fit_value":         fit_value,
                    "required_level":    job_level,
                    "candidate_level":   candidate_level,
                    "gap":               round(gap, 3),
                    "importance":        importance,
                    "knockout_dimension": is_required,
                }

    total_dims  = len(job_requirements)
    scored_dims = len(scored)

    match_score = round(weighted_sum / total_weight, 3) if total_weight > 0 else None
    coverage    = round(scored_dims / total_dims, 3)    if total_dims  > 0 else 0.0

    gap_profile = {
        "coverage":    coverage,
        "scored":      scored,
        "undetermined": undetermined,
        "absent":      absent,
    }

    # Build a plain-language explanation.
    parts = []
    if match_score is not None:
        parts.append(
            f"Fit score: {match_score:.2f} "
            f"({scored_dims}/{total_dims} dimensions fully assessed)."
        )
        if equal_weight_count:
            parts.append(
                f"{equal_weight_count} scored dimension(s) had unknown importance "
                f"and were weighted equally."
            )
    else:
        parts.append("Fit score could not be computed — no dimensions were fully assessable.")

    if undetermined:
        parts.append(
            f"{len(undetermined)} dimension(s) detected but not fully assessable."
        )
    if absent:
        parts.append(
            f"{len(absent)} job dimension(s) absent from candidate profile."
        )
    if knockout_failed:
        parts.append(
            "Knockout: candidate has no evidence of one or more required dimensions."
        )

    return {
        "match_score":     match_score,
        "coverage":        coverage,
        "knockout_failed": knockout_failed,
        "gap_profile":     gap_profile,
        "explanation":     " ".join(parts),
    }
