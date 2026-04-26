from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum as SQLEnum, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from app.database.base import Base


class ProjectStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    IN_DISCUSSION = "IN_DISCUSSION"
    COMMUNITY_VALIDATION = "COMMUNITY_VALIDATION"
    RECOMMENDED = "RECOMMENDED"
    AMBASSADOR_PROJECT = "AMBASSADOR_PROJECT"
    ARCHIVED = "ARCHIVED"


class ProjectMediaType(str, enum.Enum):
    IMAGE = "image"
    DOCUMENT = "document"
    VIDEO = "video"


class ProjectVoteType(str, enum.Enum):
    SUPPORT = "support"
    OPPOSE = "oppose"


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    problem_statement = Column(Text, nullable=False)
    objectives = Column(Text, nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.DRAFT, nullable=False, index=True)
    budget_estimate = Column(Numeric(12, 2), nullable=True)
    partners_needed = Column(Text, nullable=True)
    video_url = Column(String, nullable=True)
    source_post_id = Column(UUID(as_uuid=True), ForeignKey("forum_posts.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)

    author = relationship("User", backref="projects")
    region = relationship("Region")
    source_post = relationship("ForumPost")
    media = relationship("ProjectMedia", back_populates="project", cascade="all, delete-orphan")
    comments = relationship("ProjectComment", back_populates="project", cascade="all, delete-orphan")
    votes = relationship("ProjectVote", back_populates="project", cascade="all, delete-orphan")
    status_history = relationship("ProjectStatusHistory", back_populates="project", cascade="all, delete-orphan")


class ProjectMedia(Base):
    __tablename__ = "project_media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    file_url = Column(String, nullable=False)
    type = Column(SQLEnum(ProjectMediaType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="media")


class ProjectComment(Base):
    __tablename__ = "project_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    project = relationship("Project", back_populates="comments")
    author = relationship("User", backref="project_comments")


class ProjectVote(Base):
    __tablename__ = "project_votes"
    __table_args__ = (UniqueConstraint("project_id", "user_id", name="uq_project_vote_user"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    vote_type = Column(SQLEnum(ProjectVoteType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    project = relationship("Project", back_populates="votes")
    user = relationship("User", backref="project_votes")


class ProjectStatusHistory(Base):
    __tablename__ = "project_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    status = Column(SQLEnum(ProjectStatus), nullable=False, index=True)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    project = relationship("Project", back_populates="status_history")
    actor = relationship("User", backref="project_status_changes")
