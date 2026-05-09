from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import (
  ClarifyingQuestion, Candidate, Employer, JobPost,
  CandidateCompetency, JobCompetency, Competency, User
)
from app.schemas.schemas import QuestionResponse, AnswerRequest
from app.core.dependencies import get_current_user
from app.services.llm_scorer import estimate_score_from_answer
from app.routers.matches import _run_candidate_matching, _run_job_matching

router = APIRouter(prefix="/questions", tags=["Questions"])


def _get_candidate(user: User, db: Session) -> Candidate:
  c = db.query(Candidate).filter_by(user_id=user.user_id).first()
  if not c:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found")
  return c


def _get_employer(user: User, db: Session) -> Employer:
  e = db.query(Employer).filter_by(user_id=user.user_id).first()
  if not e:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer profile not found")
  return e


@router.get("/mine", response_model=List[QuestionResponse])
def get_my_questions(
  resolved: bool = False,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  """
  Return all questions directed at the calling user.
  Candidates see their own competency questions.
  Recruiters see questions for all their job postings.
  Pass ?resolved=true to include already-answered questions.
  """
  if current_user.account_type == "applicant":
    candidate = _get_candidate(current_user, db)
    q = db.query(ClarifyingQuestion).filter_by(candidate_id=candidate.candidate_id)
    if not resolved:
      q = q.filter_by(resolved=False)
    return q.order_by(ClarifyingQuestion.created_at.desc()).all()

  else:
    employer = _get_employer(current_user, db)
    job_ids  = [
      j.job_id for j in
      db.query(JobPost).filter_by(employer_id=employer.employer_id).all()
    ]
    if not job_ids:
      return []
    q = db.query(ClarifyingQuestion).filter(ClarifyingQuestion.job_id.in_(job_ids))
    if not resolved:
      q = q.filter(ClarifyingQuestion.resolved == False)  # noqa: E712
    return q.order_by(ClarifyingQuestion.created_at.desc()).all()


@router.post("/{question_id}/answer", response_model=QuestionResponse)
def answer_question(
  question_id: int,
  body: AnswerRequest,
  background_tasks: BackgroundTasks,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  """
  Submit an answer to a clarifying question.
  Estimates a proficiency or importance score from the answer,
  updates the stored competency record, and marks the question resolved.
  """
  question = db.query(ClarifyingQuestion).filter_by(question_id=question_id).first()
  if not question:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

  # Authorisation
  if current_user.account_type == "applicant":
    candidate = _get_candidate(current_user, db)
    if question.candidate_id != candidate.candidate_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your question")
  else:
    employer = _get_employer(current_user, db)
    job = db.query(JobPost).filter_by(job_id=question.job_id).first()
    if not job or job.employer_id != employer.employer_id:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your question")

  question.answer_text = body.answer_text

  score = estimate_score_from_answer(
    competency_name = question.competency_name,
    question_text   = question.question_text,
    answer_text     = body.answer_text,
    reason          = question.reason,
    db              = db,
  )

  if score is not None:
    comp = db.query(Competency).filter_by(onet_element_id=question.element_id).first()
    if comp:
      if question.reason == "candidate_level_unknown":
        row = db.query(CandidateCompetency).filter_by(
          candidate_id=question.candidate_id,
          competency_id=comp.competency_id,
        ).first()
        if row:
          row.level_score = score

      elif question.reason == "required_level_unknown":
        row = db.query(JobCompetency).filter_by(
          job_id=question.job_id,
          competency_id=comp.competency_id,
        ).first()
        if row:
          row.required_level = score

      elif question.reason == "importance_unknown":
        row = db.query(JobCompetency).filter_by(
          job_id=question.job_id,
          competency_id=comp.competency_id,
        ).first()
        if row:
          row.importance = score

    question.resolved = True

  db.commit()
  db.refresh(question)

  # Re-run matching with the updated competency data
  if score is not None:
    if question.candidate_id:
      background_tasks.add_task(_run_candidate_matching, question.candidate_id)
    elif question.job_id:
      background_tasks.add_task(_run_job_matching, question.job_id)

  return question
