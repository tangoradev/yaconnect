from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class ReactionType(str, Enum):
    PERTINENT = "PERTINENT"
    INNOVATIVE = "INNOVATIVE"
    ENVIRONMENTAL_IMPACT = "ENVIRONMENTAL_IMPACT"
    SOLIDARITY = "SOLIDARITY"
    INSPIRING = "INSPIRING"

class ReportStatus(str, Enum):
    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    DISMISSED = "DISMISSED"
    ACTION_TAKEN = "ACTION_TAKEN"

# --- Reactions ---
class ForumReactionBase(BaseModel):
    reaction_type: ReactionType

class ForumReactionCreate(ForumReactionBase):
    post_id: UUID4

class ForumReaction(ForumReactionBase):
    id: UUID4
    user_id: UUID4
    post_id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

# --- Comments ---
class ForumCommentBase(BaseModel):
    content: str
    parent_id: Optional[UUID4] = None

class ForumCommentCreate(ForumCommentBase):
    post_id: UUID4

class ForumComment(ForumCommentBase):
    id: UUID4
    user_id: UUID4
    post_id: UUID4
    created_at: datetime
    # We might want to include author info here for easier frontend consumption
    author_name: Optional[str] = None
    author_avatar: Optional[str] = None

    class Config:
        from_attributes = True

# --- Posts ---
class ForumPostBase(BaseModel):
    title: Optional[str] = None
    content: str
    media_url: Optional[str] = None

class ForumPostCreate(ForumPostBase):
    topic_id: UUID4

class ForumPostUpdate(ForumPostBase):
    is_pinned: Optional[bool] = None
    is_locked: Optional[bool] = None

class ForumPost(ForumPostBase):
    id: UUID4
    topic_id: UUID4
    user_id: UUID4
    is_pinned: bool
    is_locked: bool
    created_at: datetime
    updated_at: datetime
    comments: List[ForumComment] = []
    reaction_counts: dict = {} # aggregated counts
    user_reaction: Optional[ReactionType] = None # current user's reaction

    class Config:
        from_attributes = True

# --- Topics ---
class ForumTopicBase(BaseModel):
    title: str
    description: Optional[str] = None
    theme_id: Optional[int] = None

class ForumTopicCreate(ForumTopicBase):
    pass

class ForumTopic(ForumTopicBase):
    id: UUID4
    created_by: UUID4
    created_at: datetime
    post_count: int = 0
    last_post_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Reports ---
class ForumReportCreate(BaseModel):
    post_id: UUID4
    reason: str

class ForumReport(ForumReportCreate):
    id: UUID4
    reported_by: UUID4
    status: ReportStatus
    created_at: datetime

    class Config:
        from_attributes = True
