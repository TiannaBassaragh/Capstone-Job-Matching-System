from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Competency
from app.schemas.schemas import CompetencyResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/competencies", tags=["Competencies"])


@router.get("/", response_model=List[CompetencyResponse])
def list_competencies(
  db: Session = Depends(get_db),
  current_user=Depends(get_current_user)
):
  return db.query(Competency).all()


@router.get("/{competency_id}", response_model=CompetencyResponse)
def get_competency(
  competency_id: int,
  db: Session = Depends(get_db),
  current_user=Depends(get_current_user)
):
  competency = db.query(Competency).filter(
    Competency.competency_id == competency_id
  ).first()

  if not competency:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Competency not found"
    )

  return competency