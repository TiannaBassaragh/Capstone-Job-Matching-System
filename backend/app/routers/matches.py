from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.models import (
  Match, Candidate, CandidateCompetency, JobCompetency,
  Competency, Employer, JobPost, User, ClarifyingQuestion
)
from app.schemas.schemas import MatchResponse, QuestionResponse, AnswerRequest
from app.core.dependencies import get_current_user, require_applicant, require_recruiter
from app.services.scorer import compute_fit_score
from app.services.llm_scorer import generate_clarifying_questions, estimate_score_from_answer

router = APIRouter(prefix="/matches", tags=["Matches"])


# ─── helpers ─────────────────────────────────────────────────────────────────

def get_candidate_or_404(user: User, db: Session) -> Candidate:
  candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
  if not candidate:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found")
  return candidate


def get_employer_or_404(user: User, db: Session) -> Employer:
  employer = db.query(Employer).filter(Employer.user_id == user.user_id).first()
  if not employer:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer profile not found")
  return employer


def _score_resume(candidate: Candidate, db: Session) -> dict[int, float | None]:
  """
  Returns the candidate's scored competencies from the DB.
  Scoring happens at resume upload time; this is a read-only operation.
  Raises 422 if no competencies have been scored yet (no resume uploaded).
  """
  rows = (
    db.query(CandidateCompetency)
    .filter(CandidateCompetency.candidate_id == candidate.candidate_id)
    .all()
  )
  if not rows:
    raise HTTPException(
      status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
      detail="No scored competencies on file. Please upload a resume first."
    )
  return {row.competency_id: row.level_score for row in rows}


def _upsert_match(candidate_id: int, job_id: int, result: dict, db: Session) -> None:
  existing = db.query(Match).filter_by(candidate_id=candidate_id, job_id=job_id).first()
  if existing:
    existing.match_score        = result["match_score"]
    existing.knockout_failed    = result["knockout_failed"]
    existing.qualification_tier = result["qualification_tier"]
    existing.gap_profile        = result["gap_profile"]
    existing.explanation        = result["explanation"]
  else:
    db.add(Match(
      candidate_id        = candidate_id,
      job_id              = job_id,
      match_score         = result["match_score"],
      knockout_failed     = result["knockout_failed"],
      qualification_tier  = result["qualification_tier"],
      gap_profile         = result["gap_profile"],
      explanation         = result["explanation"],
    ))


# ─── clarifying question helpers ─────────────────────────────────────────────

def _build_question_inputs(gap_profile: dict) -> list[dict]:
  """
  Derives the list of dimensions that need clarification from a gap_profile.
  Returns dicts with element_id, competency_name, directed_at, reason.
  """
  inputs = []

  for eid, info in gap_profile["undetermined"].items():
    if info["candidate_status"] == "undetermined":
      inputs.append({
        "element_id":      eid,
        "competency_name": info["name"],
        "directed_at":     "candidate",
        "reason":          "candidate_level_unknown",
      })
    if info["job_level_status"] == "undetermined":
      inputs.append({
        "element_id":      eid,
        "competency_name": info["name"],
        "directed_at":     "recruiter",
        "reason":          "required_level_unknown",
      })

  for eid, info in gap_profile["scored"].items():
    if info["importance"] is None:
      inputs.append({
        "element_id":      eid,
        "competency_name": info["name"],
        "directed_at":     "recruiter",
        "reason":          "importance_unknown",
      })

  return inputs


def _save_questions(match_id: int, q_inputs: list[dict], generated: list[dict], db: Session) -> list[ClarifyingQuestion]:
  """
  Saves generated questions to the DB, skipping any already present
  (e.g. from a previous trigger run that may already have an answer).
  Returns the list of newly saved ClarifyingQuestion objects.
  """
  # Index generated questions by element_id for lookup
  gen_map: dict[tuple, str] = {
    (q["element_id"], q["directed_at"]): q["question_text"]
    for q in generated
  }

  saved = []
  for inp in q_inputs:
    key = (inp["element_id"], inp["directed_at"])
    question_text = gen_map.get(key)
    if not question_text:
      continue  # LLM didn't produce a question for this entry

    existing = (
      db.query(ClarifyingQuestion)
      .filter_by(match_id=match_id, element_id=inp["element_id"], directed_at=inp["directed_at"])
      .first()
    )
    if existing:
      continue  # already asked (may have an answer — don't overwrite)

    q = ClarifyingQuestion(
      match_id        = match_id,
      element_id      = inp["element_id"],
      competency_name = inp["competency_name"],
      directed_at     = inp["directed_at"],
      reason          = inp["reason"],
      question_text   = question_text,
    )
    db.add(q)
    saved.append(q)

  return saved


# ─── triggers ────────────────────────────────────────────────────────────────

@router.post("/trigger", status_code=status.HTTP_202_ACCEPTED)
def trigger_candidate(
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant),
):
  """Candidate-triggered: score my resume and match against every job."""
  candidate = get_candidate_or_404(current_user, db)
  candidate_levels = _score_resume(candidate, db)

  jobs = db.query(JobPost).all()
  matched = knockout = 0
  all_questions: list[dict] = []

  for job in jobs:
    job_reqs = (
      db.query(JobCompetency)
      .filter(JobCompetency.job_id == job.job_id)
      .options(joinedload(JobCompetency.competency))
      .all()
    )
    if not job_reqs:
      continue

    result = compute_fit_score(candidate_levels, job_reqs)
    _upsert_match(candidate.candidate_id, job.job_id, result, db)
    matched += 1
    if result["knockout_failed"]:
      knockout += 1

    # Generate clarifying questions for undetermined dimensions
    q_inputs = _build_question_inputs(result["gap_profile"])
    if q_inputs:
      db.flush()  # ensure match row has an id
      match_row = db.query(Match).filter_by(
        candidate_id=candidate.candidate_id, job_id=job.job_id
      ).first()
      generated = generate_clarifying_questions(q_inputs, db)
      saved = _save_questions(match_row.match_id, q_inputs, generated, db)
      for q in saved:
        all_questions.append({
          "match_id":       match_row.match_id,
          "job_id":         job.job_id,
          "element_id":     q.element_id,
          "competency_name": q.competency_name,
          "directed_at":    q.directed_at,
          "reason":         q.reason,
          "question_text":  q.question_text,
        })

  db.commit()
  return {
    "jobs_matched":         matched,
    "knockouts":            knockout,
    "clarifying_questions": all_questions,
  }


@router.post("/trigger/{job_id}", status_code=status.HTTP_202_ACCEPTED)
def trigger_job(
  job_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter),
):
  """Recruiter-triggered: match this job against every candidate who is already scored."""
  employer = get_employer_or_404(current_user, db)

  job = db.query(JobPost).filter(JobPost.job_id == job_id).first()
  if not job:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job post not found")
  if job.employer_id != employer.employer_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only trigger matches for your own jobs")

  job_reqs = (
    db.query(JobCompetency)
    .filter(JobCompetency.job_id == job_id)
    .options(joinedload(JobCompetency.competency))
    .all()
  )
  if not job_reqs:
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Job has no scored competencies")

  # Only candidates who already have competency scores
  scored_candidate_ids = [
    row.candidate_id
    for row in db.query(CandidateCompetency.candidate_id).distinct().all()
  ]

  matched = knockout = 0
  all_questions: list[dict] = []

  for candidate_id in scored_candidate_ids:
    candidate_levels = {
      row.competency_id: row.level_score
      for row in db.query(CandidateCompetency)
      .filter(CandidateCompetency.candidate_id == candidate_id)
      .all()
    }
    result = compute_fit_score(candidate_levels, job_reqs)
    _upsert_match(candidate_id, job_id, result, db)
    matched += 1
    if result["knockout_failed"]:
      knockout += 1

    # Generate clarifying questions for undetermined dimensions
    q_inputs = _build_question_inputs(result["gap_profile"])
    if q_inputs:
      db.flush()
      match_row = db.query(Match).filter_by(
        candidate_id=candidate_id, job_id=job_id
      ).first()
      generated = generate_clarifying_questions(q_inputs, db)
      saved = _save_questions(match_row.match_id, q_inputs, generated, db)
      for q in saved:
        all_questions.append({
          "match_id":        match_row.match_id,
          "candidate_id":    candidate_id,
          "element_id":      q.element_id,
          "competency_name": q.competency_name,
          "directed_at":     q.directed_at,
          "reason":          q.reason,
          "question_text":   q.question_text,
        })

  db.commit()
  return {
    "candidates_matched":   matched,
    "knockouts":            knockout,
    "clarifying_questions": all_questions,
  }


# ─── read endpoints ───────────────────────────────────────────────────────────

@router.get("/candidate/{candidate_id}", response_model=List[MatchResponse])
def get_matches_for_candidate(
  candidate_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant)
):
  candidate = get_candidate_or_404(current_user, db)
  if candidate.candidate_id != candidate_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own matches")
  return db.query(Match).filter(Match.candidate_id == candidate_id).all()


@router.get("/job/{job_id}", response_model=List[MatchResponse])
def get_matches_for_job(
  job_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_recruiter)
):
  employer = get_employer_or_404(current_user, db)
  job = db.query(JobPost).filter(JobPost.job_id == job_id).first()
  if not job:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job post not found")
  if job.employer_id != employer.employer_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view matches for your own job posts")
  return db.query(Match).filter(Match.job_id == job_id).all()


@router.get("/{match_id}/questions", response_model=List[QuestionResponse])
def get_questions(
  match_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  """
  List all clarifying questions for a match.
  Candidates see only questions directed at them; recruiters see only theirs.
  """
  match = db.query(Match).filter(Match.match_id == match_id).first()
  if not match:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

  if current_user.account_type == "applicant":
    candidate = get_candidate_or_404(current_user, db)
    if match.candidate_id != candidate.candidate_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own match questions")
    directed_at = "candidate"
  else:
    employer = get_employer_or_404(current_user, db)
    job = db.query(JobPost).filter(JobPost.job_id == match.job_id).first()
    if not job or job.employer_id != employer.employer_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view questions for your own job posts")
    directed_at = "recruiter"

  return (
    db.query(ClarifyingQuestion)
    .filter_by(match_id=match_id, directed_at=directed_at)
    .all()
  )


@router.post("/{match_id}/questions/{question_id}/answer", response_model=MatchResponse)
def answer_question(
  match_id: int,
  question_id: int,
  body: AnswerRequest,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  """
  Submit an answer to a clarifying question.
  Estimates a score from the answer, updates the relevant competency record,
  and re-scores the match.
  """
  match = db.query(Match).filter(Match.match_id == match_id).first()
  if not match:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

  question = db.query(ClarifyingQuestion).filter_by(
    question_id=question_id, match_id=match_id
  ).first()
  if not question:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

  # Authorisation: only the party the question is directed at can answer
  if current_user.account_type == "applicant":
    if question.directed_at != "candidate":
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This question is for the recruiter")
    candidate = get_candidate_or_404(current_user, db)
    if match.candidate_id != candidate.candidate_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only answer your own match questions")
  else:
    if question.directed_at != "recruiter":
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This question is for the candidate")
    employer = get_employer_or_404(current_user, db)
    job = db.query(JobPost).filter(JobPost.job_id == match.job_id).first()
    if not job or job.employer_id != employer.employer_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only answer questions for your own job posts")

  # Save the answer and estimate a score
  question.answer_text = body.answer_text
  score = estimate_score_from_answer(
    competency_name = question.competency_name,
    question_text   = question.question_text,
    answer_text     = body.answer_text,
    reason          = question.reason,
    db              = db,
  )

  if score is not None:
    # Find the competency_id for this element_id
    comp = db.query(Competency).filter_by(onet_element_id=question.element_id).first()
    if comp:
      if question.reason == "candidate_level_unknown":
        row = db.query(CandidateCompetency).filter_by(
          candidate_id=match.candidate_id, competency_id=comp.competency_id
        ).first()
        if row:
          row.level_score = score

      elif question.reason == "required_level_unknown":
        row = db.query(JobCompetency).filter_by(
          job_id=match.job_id, competency_id=comp.competency_id
        ).first()
        if row:
          row.required_level = score

      elif question.reason == "importance_unknown":
        row = db.query(JobCompetency).filter_by(
          job_id=match.job_id, competency_id=comp.competency_id
        ).first()
        if row:
          row.importance = score

    question.resolved = True

  # Re-score the match with updated competency data
  candidate_levels = {
    row.competency_id: row.level_score
    for row in db.query(CandidateCompetency)
    .filter_by(candidate_id=match.candidate_id)
    .all()
  }
  job_reqs = (
    db.query(JobCompetency)
    .filter(JobCompetency.job_id == match.job_id)
    .options(joinedload(JobCompetency.competency))
    .all()
  )
  result = compute_fit_score(candidate_levels, job_reqs)
  match.match_score        = result["match_score"]
  match.knockout_failed    = result["knockout_failed"]
  match.qualification_tier = result["qualification_tier"]
  match.gap_profile        = result["gap_profile"]
  match.explanation        = result["explanation"]

  db.commit()
  db.refresh(match)
  return match


@router.get("/{match_id}", response_model=MatchResponse)
def get_match(
  match_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  match = db.query(Match).filter(Match.match_id == match_id).first()
  if not match:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

  if current_user.account_type == "applicant":
    candidate = get_candidate_or_404(current_user, db)
    if match.candidate_id != candidate.candidate_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own matches")
  else:
    employer = get_employer_or_404(current_user, db)
    job = db.query(JobPost).filter(JobPost.job_id == match.job_id).first()
    if not job or job.employer_id != employer.employer_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view matches for your own job posts")

  return match
