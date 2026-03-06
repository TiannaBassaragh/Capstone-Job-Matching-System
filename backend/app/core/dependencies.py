from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
  token: str = Depends(oauth2_scheme),
  db: Session = Depends(get_db)
) -> User:
  try:
    payload = decode_access_token(token)
    user_id: int = payload.get("sub")
    if user_id is None:
      raise ValueError()
  except ValueError:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Could not validate credentials",
      headers={"WWW-Authenticate": "Bearer"},
    )

  user = db.query(User).filter(User.user_id == user_id).first()
  if user is None:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="User not found",
      headers={"WWW-Authenticate": "Bearer"},
    )

  return user


def require_applicant(current_user: User = Depends(get_current_user)) -> User:
  if current_user.account_type != "applicant":
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Applicants only"
    )
  return current_user


def require_recruiter(current_user: User = Depends(get_current_user)) -> User:
  if current_user.account_type != "recruiter":
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="Recruiters only"
    )
  return current_user