import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database.base import Base


class CmsStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class CmsContentFormat(str, enum.Enum):
    MARKDOWN = "MARKDOWN"


class CmsRevisionEntityType(str, enum.Enum):
    PAGE = "PAGE"
    POST = "POST"


class CmsCategory(Base):
    __tablename__ = "cms_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    posts = relationship("CmsPost", back_populates="category")


class CmsTag(Base):
    __tablename__ = "cms_tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class CmsPostTag(Base):
    __tablename__ = "cms_post_tags"
    __table_args__ = (UniqueConstraint("post_id", "tag_id", name="uq_cms_post_tag"),)

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(UUID(as_uuid=True), ForeignKey("cms_posts.id"), nullable=False, index=True)
    tag_id = Column(Integer, ForeignKey("cms_tags.id"), nullable=False, index=True)

    tag = relationship("CmsTag")


class CmsPage(Base):
    __tablename__ = "cms_pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False, default="")
    content_format = Column(SQLEnum(CmsContentFormat), nullable=False, default=CmsContentFormat.MARKDOWN)
    excerpt = Column(Text, nullable=True)
    meta_title = Column(String, nullable=True)
    meta_description = Column(Text, nullable=True)
    status = Column(SQLEnum(CmsStatus), nullable=False, default=CmsStatus.DRAFT, index=True)
    published_at = Column(DateTime, nullable=True, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)

    author = relationship("User")


class CmsPost(Base):
    __tablename__ = "cms_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False, default="")
    content_format = Column(SQLEnum(CmsContentFormat), nullable=False, default=CmsContentFormat.MARKDOWN)
    excerpt = Column(Text, nullable=True)
    cover_image_url = Column(String, nullable=True)
    meta_title = Column(String, nullable=True)
    meta_description = Column(Text, nullable=True)
    status = Column(SQLEnum(CmsStatus), nullable=False, default=CmsStatus.DRAFT, index=True)
    published_at = Column(DateTime, nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("cms_categories.id"), nullable=True, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)

    author = relationship("User")
    category = relationship("CmsCategory", back_populates="posts")
    tags = relationship("CmsPostTag", cascade="all, delete-orphan")


class CmsMedia(Base):
    __tablename__ = "cms_media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    file_url = Column(String, nullable=False)
    mime = Column(String, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    author = relationship("User")


class CmsRevision(Base):
    __tablename__ = "cms_revisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    entity_type = Column(SQLEnum(CmsRevisionEntityType), nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    snapshot = Column(JSONB, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    author = relationship("User")

