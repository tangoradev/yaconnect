from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, UniqueConstraint, Index, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.database.base import Base


class UserActivityLog(Base):
    __tablename__ = "user_activity_log"
    __table_args__ = (
        Index("ix_user_activity_log_user_created", "user_id", "created_at"),
        Index("ix_user_activity_log_action_created", "action_type", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    action_type = Column(String, nullable=False, index=True)
    reference_id = Column(String, nullable=True, index=True)
    points = Column(Integer, nullable=False, default=0)
    metadata_ = Column("metadata", JSONB, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", backref="activity_logs")


class UserScoresHistory(Base):
    __tablename__ = "user_scores_history"
    __table_args__ = (Index("ix_user_scores_history_user_created", "user_id", "created_at"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    score = Column(Integer, nullable=False)
    level = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", backref="score_history")


class LeaderboardCache(Base):
    __tablename__ = "leaderboard_cache"
    __table_args__ = (UniqueConstraint("type", name="uq_leaderboard_cache_type"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    type = Column(String, nullable=False, index=True)
    data = Column(JSONB, nullable=False, default=dict)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)


class LeaderboardArchive(Base):
    __tablename__ = "leaderboard_archive"
    __table_args__ = (
        UniqueConstraint("type", "period", "week_start", name="uq_leaderboard_archive_type_period_week"),
        Index("ix_leaderboard_archive_type_created", "type", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    type = Column(String, nullable=False, index=True)
    period = Column(String, nullable=False, index=True)
    week_start = Column(DateTime, nullable=False, index=True)
    week_end = Column(DateTime, nullable=False, index=True)
    data = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class GamificationRule(Base):
    __tablename__ = "gamification_rules"
    __table_args__ = (UniqueConstraint("action_type", name="uq_gamification_rules_action_type"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    action_type = Column(String, nullable=False, index=True)
    points = Column(Integer, nullable=False, default=0)
    multiplier = Column(Numeric(6, 3), nullable=False, default=1)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    metadata_ = Column("metadata", JSONB, nullable=False, default=dict)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)


class GamificationLevel(Base):
    __tablename__ = "gamification_levels"
    __table_args__ = (
        UniqueConstraint("name", name="uq_gamification_levels_name"),
        UniqueConstraint("sort_order", name="uq_gamification_levels_sort_order"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    min_score = Column(Integer, nullable=False, index=True)
    sort_order = Column(Integer, nullable=False, index=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)


class GamificationBadgeRule(Base):
    __tablename__ = "gamification_badge_rules"
    __table_args__ = (
        UniqueConstraint("badge_id", "rule_type", name="uq_gamification_badge_rules_badge_rule_type"),
        Index("ix_gamification_badge_rules_active", "is_active"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    badge_id = Column(Integer, ForeignKey("forum_badges.id"), nullable=False, index=True)
    rule_type = Column(String, nullable=False, index=True)
    action_type = Column(String, nullable=True, index=True)
    threshold = Column(Integer, nullable=True)
    metadata_ = Column("metadata", JSONB, nullable=False, default=dict)
    is_active = Column(Boolean, nullable=False, default=True)

    badge = relationship("ForumBadge")


class GamificationMission(Base):
    __tablename__ = "gamification_missions"
    __table_args__ = (UniqueConstraint("code", name="uq_gamification_missions_code"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    code = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    requirements = Column(JSONB, nullable=False, default=dict)
    reward_points = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    starts_at = Column(DateTime, nullable=True, index=True)
    ends_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class UserMissionProgress(Base):
    __tablename__ = "user_mission_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "mission_id", name="uq_user_mission_progress_user_mission"),
        Index("ix_user_mission_progress_user_updated", "user_id", "updated_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    mission_id = Column(UUID(as_uuid=True), ForeignKey("gamification_missions.id"), nullable=False, index=True)
    progress = Column(JSONB, nullable=False, default=dict)
    is_completed = Column(Boolean, nullable=False, default=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    claimed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)

    user = relationship("User", backref="missions_progress")
    mission = relationship("GamificationMission")
