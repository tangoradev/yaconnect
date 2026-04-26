from pydantic import BaseModel, UUID4, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class GamificationRuleBase(BaseModel):
    action_type: str
    points: int
    multiplier: float = 1.0
    is_active: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_", serialization_alias="metadata")


class GamificationRule(GamificationRuleBase):
    id: UUID4
    updated_at: datetime

    class Config:
        from_attributes = True


class GamificationRuleUpdate(BaseModel):
    points: Optional[int] = None
    multiplier: Optional[float] = None
    is_active: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class GamificationLevelBase(BaseModel):
    name: str
    min_score: int
    sort_order: int
    is_active: bool = True


class GamificationLevel(GamificationLevelBase):
    id: int

    class Config:
        from_attributes = True


class GamificationLevelUpdate(BaseModel):
    name: Optional[str] = None
    min_score: Optional[int] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class ActivityLogEntry(BaseModel):
    id: UUID4
    user_id: UUID4
    action_type: str
    reference_id: Optional[str] = None
    points: int
    metadata: Dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_", serialization_alias="metadata")
    created_at: datetime

    class Config:
        from_attributes = True


class ScoreHistoryEntry(BaseModel):
    id: UUID4
    user_id: UUID4
    score: int
    level: str
    created_at: datetime

    class Config:
        from_attributes = True


class Mission(BaseModel):
    id: UUID4
    code: str
    title: str
    description: Optional[str] = None
    requirements: Dict[str, Any] = {}
    reward_points: int
    is_active: bool
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MissionCreate(BaseModel):
    code: str
    title: str
    description: Optional[str] = None
    requirements: Dict[str, Any] = {}
    reward_points: int = 0
    is_active: bool = True
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class MissionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[Dict[str, Any]] = None
    reward_points: Optional[int] = None
    is_active: Optional[bool] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class MissionProgress(BaseModel):
    mission: Mission
    progress: Dict[str, Any] = {}
    is_completed: bool
    completed_at: Optional[datetime] = None


class BadgeRule(BaseModel):
    id: UUID4
    badge_id: int
    badge_name: Optional[str] = None
    rule_type: str
    action_type: Optional[str] = None
    threshold: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_", serialization_alias="metadata")
    is_active: bool

    class Config:
        from_attributes = True


class BadgeRuleCreate(BaseModel):
    badge_id: int
    rule_type: str
    action_type: Optional[str] = None
    threshold: Optional[int] = None
    metadata: Dict[str, Any] = {}
    is_active: bool = True


class BadgeRuleUpdate(BaseModel):
    rule_type: Optional[str] = None
    action_type: Optional[str] = None
    threshold: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: Optional[UUID4] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    region_id: Optional[int] = None
    score: Optional[int] = None
    points: Optional[int] = None
    project_count: Optional[int] = None
    approval: Optional[float] = None


class LeaderboardResponse(BaseModel):
    type: str
    period: str
    updated_at: datetime
    items: List[Dict[str, Any]]


class MyGamificationSummary(BaseModel):
    user_id: UUID4
    score: int
    level: str
    next_level: Optional[str] = None
    next_level_min_score: Optional[int] = None
    progress_to_next_level: float = 0.0
    badges: List[Dict[str, Any]] = []
    rank_global: Optional[int] = None
    rank_region: Optional[int] = None
    activity: List[ActivityLogEntry] = []
    score_history: List[ScoreHistoryEntry] = []
    missions: List[MissionProgress] = []
