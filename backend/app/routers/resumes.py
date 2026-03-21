from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Resume, Candidate, User
from app.schemas.schemas import ResumeResponse
from app.core.dependencies import get_current_user, require_applicant

router = APIRouter(prefix="/resumes", tags=["Resumes"])

ALLOWED_TYPES = {"application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}


def get_candidate_or_404(user: User, db: Session) -> Candidate:
  candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
  if not candidate:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Candidate profile not found"
    )
  return candidate


def get_resume_or_404(resume_id: int, db: Session) -> Resume:
  resume = db.query(Resume).filter(Resume.resume_id == resume_id).first()
  if not resume:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Resume not found"
    )
  return resume


@router.post("/", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
  file: UploadFile = File(...),
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant)
):
  if file.content_type not in ALLOWED_TYPES:
    raise HTTPException(
      status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
      detail="Only PDF and Word documents are accepted"
    )

  candidate = get_candidate_or_404(current_user, db)
  contents = await file.read()

  resume = Resume(candidate_id=candidate.candidate_id, resume_file=contents)
  db.add(resume)
  db.commit()
  db.refresh(resume)
  return resume


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
  resume_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant)
):
  candidate = get_candidate_or_404(current_user, db)
  resume = get_resume_or_404(resume_id, db)

  if resume.candidate_id != candidate.candidate_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only access your own resumes"
    )

  return resume


@router.get("/{resume_id}/download")
def download_resume(
  resume_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant)
):
  candidate = get_candidate_or_404(current_user, db)
  resume = get_resume_or_404(resume_id, db)

  if resume.candidate_id != candidate.candidate_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only access your own resumes"
    )

  return Response(
    content=resume.resume_file,
    media_type="application/octet-stream",
    headers={"Content-Disposition": f"attachment; filename=resume_{resume_id}.pdf"}
  )


@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
  resume_id: int,
  file: UploadFile = File(...),
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant)
):
  if file.content_type not in ALLOWED_TYPES:
    raise HTTPException(
      status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
      detail="Only PDF and Word documents are accepted"
    )

  candidate = get_candidate_or_404(current_user, db)
  resume = get_resume_or_404(resume_id, db)

  if resume.candidate_id != candidate.candidate_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only update your own resumes"
    )

  resume.resume_file = await file.read()
  db.commit()
  db.refresh(resume)
  return resume


@router.delete("/{resume_id}", status_code=status.HTTP_200_OK)
def delete_resume(
  resume_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(require_applicant)
):
  candidate = get_candidate_or_404(current_user, db)
  resume = get_resume_or_404(resume_id, db)

  if resume.candidate_id != candidate.candidate_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only delete your own resumes"
    )

  db.delete(resume)
  db.commit()
  return {"message": "Resume deleted successfully"}