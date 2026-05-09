from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import Competency
from app.schemas.schemas import CompetencyResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/competencies", tags=["Competencies"])


@router.get("/", response_model=List[CompetencyResponse])
def list_competencies(
  skip: int = Query(0, ge=0),
  limit: int = Query(50, ge=1, le=200),
  category: Optional[str] = Query(None, description="Filter by category"),
  db: Session = Depends(get_db),
  current_user=Depends(get_current_user)
):
  q = db.query(Competency)
  if category:
    q = q.filter(Competency.category == category)
  return q.offset(skip).limit(limit).all()


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