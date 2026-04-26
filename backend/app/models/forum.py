from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum
from app.database.base import Base

class ReactionType(str, enum.Enum):
    PERTINENT = "PERTINENT"
    INNOVATIVE = "INNOVATIVE"
    ENVIRONMENTAL_IMPACT = "ENVIRONMENTAL_IMPACT"
    SOLIDARITY = "SOLIDARITY"
    INSPIRING = "INSPIRING"

class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    DISMISSED = "DISMISSED"
    ACTION_TAKEN = "ACTION_TAKEN"

class ForumTopic(Base):
    __tablename__ = "forum_topics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    theme_id = Column(Integer, ForeignKey("interests.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", backref="created_topics")
    theme = relationship("Interest")
    posts = relationship("ForumPost", back_populates="topic", cascade="all, delete-orphan")

class ForumPost(Base):
    __tablename__ = "forum_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("forum_topics.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, index=True, nullable=True) # Optional title for posts
    content = Column(Text, nullable=False)
    media_url = Column(String, nullable=True)
    is_pinned = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False) # For auto-moderation
    report_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    topic = relationship("ForumTopic", back_populates="posts")
    author = relationship("User", backref="forum_posts")
    comments = relationship("ForumComment", back_populates="post", cascade="all, delete-orphan")
    reactions = relationship("ForumReaction", back_populates="post", cascade="all, delete-orphan")

class ForumComment(Base):
    __tablename__ = "forum_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    post_id = Column(UUID(as_uuid=True), ForeignKey("forum_posts.id"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("forum_comments.id"), nullable=True) # For nested comments
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("ForumPost", back_populates="comments")
    author = relationship("User", backref="forum_comments")
    parent = relationship("ForumComment", remote_side=[id], backref="replies")

class ForumReaction(Base):
    __tablename__ = "forum_reactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    post_id = Column(UUID(as_uuid=True), ForeignKey("forum_posts.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reaction_type = Column(SQLEnum(ReactionType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("ForumPost", back_populates="reactions")
    user = relationship("User", backref="forum_reactions")

class ForumReport(Base):
    __tablename__ = "forum_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    post_id = Column(UUID(as_uuid=True), ForeignKey("forum_posts.id"), nullable=False)
    reported_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("ForumPost")
    reporter = relationship("User", foreign_keys=[reported_by])
