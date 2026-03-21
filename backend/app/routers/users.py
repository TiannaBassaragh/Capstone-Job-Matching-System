from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserResponse, UserUpdate
from app.core.dependencies import get_current_user
from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
  user_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  if current_user.user_id != user_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only access your own profile"
    )

  user = db.query(User).filter(User.user_id == user_id).first()
  if not user:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )

  return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
  user_id: int,
  payload: UserUpdate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  if current_user.user_id != user_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only update your own profile"
    )

  user = db.query(User).filter(User.user_id == user_id).first()
  if not user:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )

  updates = payload.model_dump(exclude_none=True)
  if "password" in updates:
    updates["password"] = hash_password(updates["password"])

  for field, value in updates.items():
    setattr(user, field, value)

  db.commit()
  db.refresh(user)
  return user


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
  user_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  if current_user.user_id != user_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="You can only delete your own account"
    )

  user = db.query(User).filter(User.user_id == user_id).first()
  if not user:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )

  db.delete(user)
  db.commit()
  return {"message": "Account deleted successfully"}