from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum
from app.database.base import Base

class NotificationType(str, enum.Enum):
    REPLY = "REPLY"
    REACTION = "REACTION"
    MENTION = "MENTION"
    BADGE = "BADGE"
    LEVEL_UP = "LEVEL_UP"
    PROJECT_VOTE = "PROJECT_VOTE"
    PROJECT_COMMENT = "PROJECT_COMMENT"
    PROJECT_STATUS_CHANGE = "PROJECT_STATUS_CHANGE"
    PROJECT_RECOMMENDED = "PROJECT_RECOMMENDED"
    PROJECT_CONVERTED = "PROJECT_CONVERTED"

class ForumNotification(Base):
    __tablename__ = "forum_notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(SQLEnum(NotificationType), nullable=False)
    reference_id = Column(String, nullable=True) # ID of post, comment, or badge
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="notifications")

class ForumBadge(Base):
    __tablename__ = "forum_badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True) # URL or icon name
    points_required = Column(Integer, default=0)

class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("forum_badges.id"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="badges")
    badge = relationship("ForumBadge")

class ForumTrendingCache(Base):
    __tablename__ = "forum_trending_cache"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(UUID(as_uuid=True), ForeignKey("forum_posts.id"), nullable=False)
    score = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    post = relationship("ForumPost")
