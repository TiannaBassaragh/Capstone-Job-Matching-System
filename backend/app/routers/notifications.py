from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Notification, User
from app.schemas.schemas import NotificationResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  return (
    db.query(Notification)
    .filter(Notification.user_id == current_user.user_id)
    .order_by(Notification.created_at.desc())
    .limit(100)
    .all()
  )


@router.patch("/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_read(
  notification_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  notif = db.query(Notification).filter(
    Notification.notification_id == notification_id,
    Notification.user_id == current_user.user_id,
  ).first()
  if not notif:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
  notif.read = True
  db.commit()
  return {"read": True}


@router.patch("/read-all", status_code=status.HTTP_200_OK)
def mark_all_read(
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  db.query(Notification).filter(
    Notification.user_id == current_user.user_id,
    Notification.read == False,
  ).update({"read": True})
  db.commit()
  return {"read_all": True}
