from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, Optional, Tuple, List
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.user import User
from app.models.gamification import (
    GamificationRule,
    GamificationLevel,
    UserActivityLog,
    UserScoresHistory,
    GamificationBadgeRule,
    GamificationMission,
    UserMissionProgress,
    LeaderboardCache,
)
from app.models.forum_extension import ForumNotification, NotificationType, UserBadge, ForumBadge


class ScoreEngine:
    def __init__(self, redis_client=None):
        self.redis = redis_client

    def record_action(
        self,
        db: Session,
        user_id: UUID,
        action_type: str,
        reference_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        force_points: Optional[int] = None,
        suppress_missions: bool = False,
        commit: bool = True,
    ) -> int:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return 0

        rule = db.query(GamificationRule).filter(GamificationRule.action_type == action_type).first()
        base_points = 0
        base_multiplier = Decimal("1")
        if rule and rule.is_active:
            base_points = int(rule.points or 0)
            try:
                base_multiplier = Decimal(str(rule.multiplier or 1))
            except Exception:
                base_multiplier = Decimal("1")

        points = force_points if force_points is not None else base_points
        dynamic_multiplier = self._dynamic_multiplier(db, user)
        final_points = int(round(float(Decimal(points) * base_multiplier) * dynamic_multiplier))

        old_score = int(user.score or 0)
        old_level = user.community_level or ""
        user.score = old_score + final_points

        new_level = self._resolve_level(db, int(user.score or 0))
        if new_level and new_level != old_level:
            user.community_level = new_level
            db.add(
                ForumNotification(
                    user_id=user.id,
                    type=NotificationType.LEVEL_UP,
                    message=f"Félicitations ! Vous avez atteint le niveau {new_level}.",
                    reference_id=None,
                )
            )

        db.add(
            UserActivityLog(
                user_id=user.id,
                action_type=action_type,
                reference_id=reference_id,
                points=final_points,
                metadata_=metadata or {},
                created_at=datetime.utcnow(),
            )
        )

        if final_points != 0 or (new_level and new_level != old_level):
            db.add(
                UserScoresHistory(
                    user_id=user.id,
                    score=int(user.score or 0),
                    level=user.community_level or new_level or old_level or "Explorer",
                    created_at=datetime.utcnow(),
                )
            )

        if not suppress_missions:
            self._update_missions(db, user, action_type)

        self._apply_badges(db, user, action_type)

        if commit:
            db.commit()
        else:
            db.flush()
        return final_points

    def _resolve_level(self, db: Session, score: int) -> str:
        level = (
            db.query(GamificationLevel)
            .filter(GamificationLevel.is_active == True)
            .filter(GamificationLevel.min_score <= score)
            .order_by(GamificationLevel.min_score.desc())
            .first()
        )
        return level.name if level else "Explorer"

    def _dynamic_multiplier(self, db: Session, user: User) -> float:
        mult = 1.0
        now = datetime.utcnow()

        new_user_rule = db.query(GamificationRule).filter(GamificationRule.action_type == "MULTIPLIER_NEW_USER").first()
        if new_user_rule and new_user_rule.is_active:
            days = int((new_user_rule.metadata_ or {}).get("days", 7))
            if user.created_at and user.created_at >= now - timedelta(days=days):
                try:
                    mult *= float(new_user_rule.multiplier or 1)
                except Exception:
                    pass

        weekly_rule = db.query(GamificationRule).filter(GamificationRule.action_type == "MULTIPLIER_WEEKLY_CHALLENGE").first()
        if weekly_rule and weekly_rule.is_active and bool((weekly_rule.metadata_ or {}).get("enabled", True)):
            try:
                active_missions = (
                    db.query(func.count(GamificationMission.id))
                    .filter(GamificationMission.is_active == True)
                    .scalar()
                    or 0
                )
                if active_missions > 0:
                    mult *= float(weekly_rule.multiplier or 1)
            except Exception:
                pass

        region_rule = db.query(GamificationRule).filter(GamificationRule.action_type == "MULTIPLIER_REGION_ACTIVITY").first()
        if region_rule and region_rule.is_active and user.region_id:
            top_n = int((region_rule.metadata_ or {}).get("top_regions", 0))
            if top_n > 0:
                in_top = self._is_region_in_top(db, user.region_id, top_n)
                if in_top:
                    try:
                        mult *= float(region_rule.multiplier or 1)
                    except Exception:
                        pass

        return mult

    def _is_region_in_top(self, db: Session, region_id: int, top_n: int) -> bool:
        cache = db.query(LeaderboardCache).filter(LeaderboardCache.type == "regions_daily").first()
        if not cache:
            return False
        data = cache.data or {}
        items = data.get("items") or []
        top = items[:top_n]
        return any(int(it.get("region_id")) == int(region_id) for it in top if it.get("region_id") is not None)

    def _apply_badges(self, db: Session, user: User, action_type: str):
        rules = db.query(GamificationBadgeRule).filter(GamificationBadgeRule.is_active == True).all()
        for r in rules:
            if self._rule_satisfied(db, user, r, action_type):
                self._award_badge(db, user.id, r.badge_id)

    def _rule_satisfied(self, db: Session, user: User, rule: GamificationBadgeRule, action_type: str) -> bool:
        if rule.rule_type == "SCORE_THRESHOLD" and rule.threshold is not None:
            return int(user.score or 0) >= int(rule.threshold)

        if rule.rule_type == "FIRST_ACTION" and rule.action_type:
            if rule.action_type != action_type:
                return False
            c = (
                db.query(func.count(UserActivityLog.id))
                .filter(UserActivityLog.user_id == user.id)
                .filter(UserActivityLog.action_type == rule.action_type)
                .scalar()
                or 0
            )
            return int(c) == 1

        if rule.rule_type == "ON_ACTION" and rule.action_type:
            return rule.action_type == action_type

        if rule.rule_type == "LEVEL_REACHED":
            target = (rule.metadata_ or {}).get("level")
            return bool(target) and (user.community_level == target)

        return False

    def _award_badge(self, db: Session, user_id: UUID, badge_id: int):
        existing = db.query(UserBadge).filter(UserBadge.user_id == user_id, UserBadge.badge_id == badge_id).first()
        if existing:
            return
        badge = db.query(ForumBadge).filter(ForumBadge.id == badge_id).first()
        if not badge:
            return
        db.add(UserBadge(user_id=user_id, badge_id=badge_id, earned_at=datetime.utcnow()))
        db.add(
            ForumNotification(
                user_id=user_id,
                type=NotificationType.BADGE,
                message=f"Badge obtenu : {badge.name}",
                reference_id=str(badge_id),
            )
        )

    def _update_missions(self, db: Session, user: User, action_type: str):
        now = datetime.utcnow()
        missions = (
            db.query(GamificationMission)
            .filter(GamificationMission.is_active == True)
            .filter((GamificationMission.starts_at == None) | (GamificationMission.starts_at <= now))
            .filter((GamificationMission.ends_at == None) | (GamificationMission.ends_at >= now))
            .all()
        )
        for m in missions:
            req = m.requirements or {}
            actions = req.get("actions") or []
            relevant = any(a.get("action_type") == action_type for a in actions)
            if not relevant:
                continue

            up = db.query(UserMissionProgress).filter(UserMissionProgress.user_id == user.id, UserMissionProgress.mission_id == m.id).first()
            if not up:
                up = UserMissionProgress(user_id=user.id, mission_id=m.id, progress={}, is_completed=False)
                db.add(up)
                db.flush()

            if up.is_completed:
                continue

            progress = dict(up.progress or {})
            progress[action_type] = int(progress.get(action_type, 0)) + 1
            up.progress = progress
            up.updated_at = now

            if self._mission_completed(progress, actions):
                up.is_completed = True
                up.completed_at = now
                up.claimed_at = now
                if int(m.reward_points or 0) > 0:
                    self.record_action(
                        db,
                        user.id,
                        "MISSION_COMPLETED",
                        reference_id=str(m.id),
                        metadata={"mission_code": m.code, "mission_title": m.title},
                        force_points=int(m.reward_points),
                        suppress_missions=True,
                        commit=False,
                    )

    def _mission_completed(self, progress: Dict[str, Any], actions: List[Dict[str, Any]]) -> bool:
        for a in actions:
            at = a.get("action_type")
            target = int(a.get("count") or 0)
            if not at or target <= 0:
                continue
            if int(progress.get(at, 0)) < target:
                return False
        return True
