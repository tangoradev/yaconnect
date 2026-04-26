from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime
from app.models.forum_extension import NotificationType

# --- Notifications ---
class ForumNotificationBase(BaseModel):
    message: str
    type: NotificationType
    reference_id: Optional[str] = None
    is_read: bool = False

class ForumNotificationCreate(ForumNotificationBase):
    user_id: UUID4

class ForumNotification(ForumNotificationBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

# --- Badges ---
class ForumBadgeBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    points_required: int = 0

class ForumBadgeCreate(ForumBadgeBase):
    pass

class ForumBadge(ForumBadgeBase):
    id: int

    class Config:
        from_attributes = True

class UserBadgeBase(BaseModel):
    user_id: UUID4
    badge_id: int

class UserBadge(UserBadgeBase):
    id: int
    earned_at: datetime
    badge: ForumBadge

    class Config:
        from_attributes = True

# --- Search ---
class SearchResult(BaseModel):
    id: UUID4
    type: str
    title: Optional[str] = None
    content: str
    created_at: datetime
    author_id: UUID4
    relevance: float = 0.0

# --- Leaderboard ---
class LeaderboardEntry(BaseModel):
    user_id: UUID4
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    score: int
    rank: int
    avatar: Optional[str] = None
    badges_count: int = 0


class ProjectSuggestion(BaseModel):
    post_id: UUID4
    title: Optional[str] = None
    excerpt: str
    score: int
    reactions: int
    comments: int
    already_converted: bool
    project_id: Optional[UUID4] = None
