from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.core.security import decode_access_token

bearer_scheme = HTTPBearer()


def get_current_user(
  credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
  db: Session = Depends(get_db)
) -> User:
  try:
    payload = decode_access_token(credentials.credentials)
    sub = payload.get("sub")
    if sub is None:
      raise ValueError()
    user_id = int(sub)
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