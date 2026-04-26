from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, UUID4

from app.models.cms import CmsStatus, CmsContentFormat, CmsRevisionEntityType


class CmsCategoryBase(BaseModel):
    name: str
    slug: str


class CmsCategory(CmsCategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CmsTagBase(BaseModel):
    name: str
    slug: str


class CmsTag(CmsTagBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CmsPageBase(BaseModel):
    slug: Optional[str] = None
    title: str
    content: str
    content_format: CmsContentFormat = CmsContentFormat.MARKDOWN
    excerpt: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class CmsPageCreate(CmsPageBase):
    status: CmsStatus = CmsStatus.DRAFT
    published_at: Optional[datetime] = None


class CmsPageUpdate(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    content_format: Optional[CmsContentFormat] = None
    excerpt: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    status: Optional[CmsStatus] = None
    published_at: Optional[datetime] = None


class CmsPage(BaseModel):
    id: UUID4
    slug: str
    title: str
    content: str
    content_format: CmsContentFormat
    excerpt: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    status: CmsStatus
    published_at: Optional[datetime] = None
    created_by: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CmsPostBase(BaseModel):
    slug: Optional[str] = None
    title: str
    content: str
    content_format: CmsContentFormat = CmsContentFormat.MARKDOWN
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = []


class CmsPostCreate(CmsPostBase):
    status: CmsStatus = CmsStatus.DRAFT
    published_at: Optional[datetime] = None


class CmsPostUpdate(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    content_format: Optional[CmsContentFormat] = None
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    status: Optional[CmsStatus] = None
    published_at: Optional[datetime] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None


class CmsPost(BaseModel):
    id: UUID4
    slug: str
    title: str
    content: str
    content_format: CmsContentFormat
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    status: CmsStatus
    published_at: Optional[datetime] = None
    category_id: Optional[int] = None
    created_by: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CmsPostAdmin(CmsPost):
    tag_ids: List[int] = []


class CmsPostWithMeta(CmsPost):
    category: Optional[CmsCategory] = None
    tags: List[CmsTag] = []


class CmsMedia(BaseModel):
    id: UUID4
    file_url: str
    mime: str
    width: Optional[int] = None
    height: Optional[int] = None
    size_bytes: Optional[int] = None
    created_by: UUID4
    created_at: datetime

    class Config:
        from_attributes = True


class CmsRevision(BaseModel):
    id: UUID4
    entity_type: CmsRevisionEntityType
    entity_id: UUID4
    snapshot: Dict[str, Any]
    created_by: UUID4
    created_at: datetime

    class Config:
        from_attributes = True
