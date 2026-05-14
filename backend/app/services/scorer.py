from sqlalchemy.orm import Session
from app.models.models import JobCompetency, JobPost, Competency, Candidate, CandidateCompetency, Resume, ClarifyingQuestion
from app.services.resume_parser import parse_resume_bytes
from app.services.llm_scorer import score_and_extract, generate_clarifying_questions


def score_resume(candidate: Candidate, resume: Resume, db: Session) -> None:
  """
  Scores a resume via LLM and writes candidate_competencies to the DB.
  Replaces any existing competencies for this candidate.
  Called on resume upload and on resume replacement.
  """
  text = parse_resume_bytes(resume.resume_file)
  scores, tech_keywords = score_and_extract(text, db, mode="resume")

  comp_rows = (
    db.query(Competency)
    .filter(Competency.onet_element_id.in_(list(scores.keys())))
    .all()
  )
  comp_map       = {c.onet_element_id: c.competency_id   for c in comp_rows}
  comp_map_names = {c.onet_element_id: c.competency_name for c in comp_rows}

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

  candidate.tech_keywords = tech_keywords

  # Generate clarifying questions for competencies detected but with unknown level.
  null_inputs = [
    {
      "element_id":      eid,
      "competency_name": comp_map_names.get(eid, eid),
      "directed_at":     "candidate",
      "reason":          "candidate_level_unknown",
    }
    for eid, data in scores.items()
    if data.get("level") is None and eid in comp_map
  ]
  if null_inputs:
    generated = generate_clarifying_questions(null_inputs, db)
    gen_map = {q["element_id"]: q["question_text"] for q in generated}
    for inp in null_inputs:
      if not gen_map.get(inp["element_id"]):
        continue
      exists = db.query(ClarifyingQuestion).filter_by(
        candidate_id=candidate.candidate_id,
        element_id=inp["element_id"],
        reason="candidate_level_unknown",
      ).first()
      if not exists:
        db.add(ClarifyingQuestion(
          candidate_id    = candidate.candidate_id,
          element_id      = inp["element_id"],
          competency_name = inp["competency_name"],
          directed_at     = "candidate",
          reason          = "candidate_level_unknown",
          question_text   = gen_map[inp["element_id"]],
        ))

  db.commit()


def score_job_post(job: JobPost, db: Session) -> None:
  """
  Scores a job description via LLM and writes job_competencies to the DB.
  Replaces any existing competencies for this job.
  Called on job create and on description update.
  """
  scores, tech_keywords = score_and_extract(job.description, db, mode="job")

  comp_rows = (
    db.query(Competency)
    .filter(Competency.onet_element_id.in_(list(scores.keys())))
    .all()
  )
  comp_map       = {c.onet_element_id: c.competency_id   for c in comp_rows}
  comp_map_names = {c.onet_element_id: c.competency_name for c in comp_rows}

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

  job.tech_keywords = tech_keywords

  # Generate clarifying questions for undetermined required_level or importance.
  null_inputs = []
  for eid, data in scores.items():
    if eid not in comp_map:
      continue
    name = comp_map_names.get(eid, eid)
    if data.get("required_level") is None:
      null_inputs.append({
        "element_id": eid, "competency_name": name,
        "directed_at": "recruiter", "reason": "required_level_unknown",
      })
    if data.get("importance") is None:
      null_inputs.append({
        "element_id": eid, "competency_name": name,
        "directed_at": "recruiter", "reason": "importance_unknown",
      })

  if null_inputs:
    generated = generate_clarifying_questions(null_inputs, db)
    gen_map = {(q["element_id"], q.get("reason", q["directed_at"])): q["question_text"] for q in generated}
    # generated list uses element_id+directed_at as key; map by (element_id, reason) via null_inputs
    gen_by_eid_directed = {(q["element_id"], q["directed_at"]): q["question_text"] for q in generated}
    for inp in null_inputs:
      qt = gen_by_eid_directed.get((inp["element_id"], inp["directed_at"]))
      if not qt:
        continue
      exists = db.query(ClarifyingQuestion).filter_by(
        job_id=job.job_id,
        element_id=inp["element_id"],
        reason=inp["reason"],
      ).first()
      if not exists:
        db.add(ClarifyingQuestion(
          job_id          = job.job_id,
          element_id      = inp["element_id"],
          competency_name = inp["competency_name"],
          directed_at     = "recruiter",
          reason          = inp["reason"],
          question_text   = qt,
        ))

  db.commit()


def compute_fit_score(
  candidate_levels: dict[int, float | None],
  job_requirements: list[JobCompetency],
  candidate_tech: list[str] | None = None,
  job_tech: list[str] | None = None,
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

  above_count    = sum(1 for d in scored.values() if d["gap"] == 0)
  below_count    = sum(1 for d in scored.values() if d["gap"] >  0)
  # Absent required dimensions count as hard deficits — treat like a below-level score
  absent_required = sum(1 for d in absent.values() if d["knockout_dimension"])
  below_count    += absent_required
  data_gap_count  = len(undetermined) + len(absent)

  if below_count == 0 and data_gap_count == 0:
    tier = "strong_fit"
  elif below_count == 0:
    tier = "data_gap"
  else:
    tier = "partial_fit"

  gap_profile = {
    "coverage":    coverage,
    "scored":      scored,
    "undetermined": undetermined,
    "absent":      absent,
  }

  # ── recommendation_score (candidate-facing) ───────────────────────────────
  # Penalises jobs that use only a small fraction of the candidate's skill set
  # (recall), blended with tech keyword overlap (Jaccard).
  # Note: match_score already penalises candidates for absent dimensions,
  # making it suitable for job-facing candidate ranking.
  job_req_cids   = {req.competency_id for req in job_requirements}
  candidate_cids = {cid for cid, lvl in candidate_levels.items() if lvl is not None}
  recall = (
    len(job_req_cids & candidate_cids) / len(candidate_cids)
    if candidate_cids else 0.0
  )

  # Tech overlap: Jaccard similarity of O*NET tech skill sets.
  tech_overlap: float | None = None
  if candidate_tech and job_tech:
    ca, jt = set(candidate_tech), set(job_tech)
    union = ca | jt
    tech_overlap = len(ca & jt) / len(union) if union else 0.0

  # Harmonic mean of match_score and recall (F1-like), then blend with tech.
  _ONET_W = 0.7
  _TECH_W = 0.3
  if match_score is not None and (match_score + recall) > 0:
    onet_hybrid = 2 * match_score * recall / (match_score + recall)
  else:
    onet_hybrid = 0.0

  if tech_overlap is not None:
    recommendation_score = round(_ONET_W * onet_hybrid + _TECH_W * tech_overlap, 3)
  else:
    recommendation_score = round(onet_hybrid, 3)

  return {
    "match_score":          match_score,
    "recommendation_score": recommendation_score,
    "coverage":             coverage,
    "knockout_failed":      knockout_failed,
    "qualification_tier":   tier,
    "gap_profile":          gap_profile,
    "explanation":          None,
  }
