from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Candidate, Employer
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
  existing = db.query(User).filter(User.email == payload.email).first()
  if existing:
    raise HTTPException(
      status_code=status.HTTP_409_CONFLICT,
      detail="Email already registered"
    )

  user = User(
    f_name=payload.f_name,
    l_name=payload.l_name,
    email=payload.email,
    password=hash_password(payload.password),
    account_type=payload.account_type
  )
  db.add(user)
  db.flush()

  if payload.account_type == "applicant":
    db.add(Candidate(user_id=user.user_id))
  else:
    if not payload.company_name:
      raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="company_name is required for recruiters"
      )
    db.add(Employer(user_id=user.user_id, company_name=payload.company_name))

  db.commit()
  db.refresh(user)
  return {"message": "Registration successful", "user_id": user.user_id}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
  user = db.query(User).filter(User.email == payload.email).first()
  if not user or not verify_password(payload.password, user.password):
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid email or password"
    )

  token = create_access_token({"sub": str(user.user_id)})
  return TokenResponse(access_token=token)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(current_user: User = Depends(get_current_user)):
  # JWT is stateless — logout is handled client-side by discarding the token
  return {"message": "Logged out successfully"}