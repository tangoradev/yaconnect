from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ProjectStatus(str, Enum):
    DRAFT = "DRAFT"
    IN_DISCUSSION = "IN_DISCUSSION"
    COMMUNITY_VALIDATION = "COMMUNITY_VALIDATION"
    RECOMMENDED = "RECOMMENDED"
    AMBASSADOR_PROJECT = "AMBASSADOR_PROJECT"
    ARCHIVED = "ARCHIVED"


class ProjectMediaType(str, Enum):
    image = "image"
    document = "document"
    video = "video"


class ProjectVoteType(str, Enum):
    support = "support"
    oppose = "oppose"


class ProjectMediaBase(BaseModel):
    file_url: str
    type: ProjectMediaType


class ProjectMedia(ProjectMediaBase):
    id: UUID4
    project_id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectCommentBase(BaseModel):
    content: str


class ProjectCommentCreate(ProjectCommentBase):
    pass


class ProjectComment(ProjectCommentBase):
    id: UUID4
    project_id: UUID4
    user_id: UUID4
    created_at: datetime
    author_name: Optional[str] = None
    author_avatar: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectVoteCreate(BaseModel):
    vote_type: ProjectVoteType


class ProjectVote(BaseModel):
    id: UUID4
    project_id: UUID4
    user_id: UUID4
    vote_type: ProjectVoteType
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectStatusHistory(BaseModel):
    id: UUID4
    project_id: UUID4
    status: ProjectStatus
    changed_by: UUID4
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    problem_statement: str
    objectives: str
    region_id: Optional[int] = None
    budget_estimate: Optional[float] = None
    partners_needed: Optional[str] = None
    video_url: Optional[str] = None


class ProjectCreate(ProjectBase):
    status: Optional[ProjectStatus] = None
    source_post_id: Optional[UUID4] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    problem_statement: Optional[str] = None
    objectives: Optional[str] = None
    region_id: Optional[int] = None
    budget_estimate: Optional[float] = None
    partners_needed: Optional[str] = None
    video_url: Optional[str] = None
    status: Optional[ProjectStatus] = None


class Project(ProjectBase):
    id: UUID4
    created_by: UUID4
    status: ProjectStatus
    source_post_id: Optional[UUID4] = None
    created_at: datetime
    updated_at: datetime

    media: List[ProjectMedia] = []
    comments: List[ProjectComment] = []

    support_votes: int = 0
    oppose_votes: int = 0
    total_votes: int = 0
    approval_percentage: float = 0.0
    comment_count: int = 0

    class Config:
        from_attributes = True

