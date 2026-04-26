from sqlalchemy.orm import Session
from app.models.forum_extension import ForumNotification, NotificationType
from app.schemas.forum_extension import ForumNotificationCreate
from uuid import UUID
from typing import List

def create_notification(db: Session, notification: ForumNotificationCreate):
    db_notification = ForumNotification(**notification.model_dump())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def get_notifications(db: Session, user_id: UUID, skip: int = 0, limit: int = 50, unread_only: bool = False):
    query = db.query(ForumNotification).filter(ForumNotification.user_id == user_id)
    if unread_only:
        query = query.filter(ForumNotification.is_read == False)
    return query.order_by(ForumNotification.created_at.desc()).offset(skip).limit(limit).all()

def mark_as_read(db: Session, notification_id: UUID, user_id: UUID):
    notification = db.query(ForumNotification).filter(
        ForumNotification.id == notification_id,
        ForumNotification.user_id == user_id
    ).first()
    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
    return notification

def mark_all_as_read(db: Session, user_id: UUID):
    db.query(ForumNotification).filter(
        ForumNotification.user_id == user_id,
        ForumNotification.is_read == False
    ).update({ForumNotification.is_read: True})
    db.commit()

def count_unread(db: Session, user_id: UUID):
    return db.query(ForumNotification).filter(
        ForumNotification.user_id == user_id,
        ForumNotification.is_read == False
    ).count()
