import json
from datetime import datetime, timedelta
from uuid import UUID

import redis
from sqlalchemy import func, desc, cast, String

from app.core.celery_app import celery_app
from app.core.config import settings
from app.database.session import SessionLocal
from app.services import leaderboard_service
from app.services.ambassador_service import detect_ambassadors
from app.models.gamification import LeaderboardArchive, LeaderboardCache, GamificationRule, GamificationBadgeRule, UserActivityLog
from app.models.user import User
from app.models.forum_extension import UserBadge, ForumBadge, ForumNotification, NotificationType
from app.models.project import Project


def _redis():
    return redis.Redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)


@celery_app.task(name="app.tasks.gamification.daily_update_leaderboards")
def daily_update_leaderboards():
    db = SessionLocal()
    r = None
    try:
        payload = leaderboard_service.refresh_all(db)
        r = _redis()
        for key, data in payload.items():
            r.set(f"leaderboard:{key}", json.dumps(data), ex=60 * 60 * 24)
        return {"updated": list(payload.keys())}
    finally:
        try:
            if r:
                r.close()
        except Exception:
            pass
        db.close()


@celery_app.task(name="app.tasks.gamification.weekly_select_ambassadors")
def weekly_select_ambassadors():
    db = SessionLocal()
    try:
        return detect_ambassadors(db)
    finally:
        db.close()


def _week_window(now: datetime):
    current_week_start = datetime(now.year, now.month, now.day) - timedelta(days=now.weekday())
    week_end = current_week_start
    week_start = week_end - timedelta(days=7)
    return week_start, week_end


def _award_badge(db, user_id, badge_id: int):
    if isinstance(user_id, str):
        try:
            user_id = UUID(user_id)
        except Exception:
            return False
    existing = db.query(UserBadge).filter(UserBadge.user_id == user_id, UserBadge.badge_id == badge_id).first()
    if existing:
        return False
    badge = db.query(ForumBadge).filter(ForumBadge.id == badge_id).first()
    if not badge:
        return False
    db.add(UserBadge(user_id=user_id, badge_id=badge_id, earned_at=datetime.utcnow()))
    db.add(
        ForumNotification(
            user_id=user_id,
            type=NotificationType.BADGE,
            message=f"Badge obtenu : {badge.name}",
            reference_id=str(badge_id),
        )
    )
    return True


def _compute_contributors_week(db, week_start: datetime, week_end: datetime, limit: int = 20):
    rows = (
        db.query(
            User.id,
            User.first_name,
            User.last_name,
            User.region_id,
            func.coalesce(func.sum(UserActivityLog.points), 0).label("points"),
        )
        .join(UserActivityLog, UserActivityLog.user_id == User.id)
        .filter(UserActivityLog.created_at >= week_start)
        .filter(UserActivityLog.created_at < week_end)
        .group_by(User.id)
        .order_by(desc("points"))
        .limit(limit)
        .all()
    )
    items = []
    for idx, r in enumerate(rows, start=1):
        items.append(
            {
                "rank": idx,
                "user_id": str(r.id),
                "first_name": r.first_name,
                "last_name": r.last_name,
                "region_id": r.region_id,
                "points": int(r.points or 0),
            }
        )
    return {"type": "contributors", "period": "weekly", "items": items, "updated_at": datetime.utcnow().isoformat()}


def _compute_innovators_week(db, week_start: datetime, week_end: datetime, limit: int = 20):
    rows = (
        db.query(
            User.id,
            User.first_name,
            User.last_name,
            User.region_id,
            func.count(UserActivityLog.id).label("actions"),
            func.coalesce(func.sum(UserActivityLog.points), 0).label("points"),
        )
        .join(UserActivityLog, UserActivityLog.user_id == User.id)
        .filter(UserActivityLog.created_at >= week_start)
        .filter(UserActivityLog.created_at < week_end)
        .filter(UserActivityLog.action_type.like("PROJECT_%"))
        .group_by(User.id)
        .order_by(desc("points"), desc("actions"))
        .limit(limit)
        .all()
    )
    items = []
    for idx, r in enumerate(rows, start=1):
        items.append(
            {
                "rank": idx,
                "user_id": str(r.id),
                "first_name": r.first_name,
                "last_name": r.last_name,
                "region_id": r.region_id,
                "points": int(r.points or 0),
                "project_actions": int(r.actions or 0),
            }
        )
    return {"type": "innovators", "period": "weekly", "items": items, "updated_at": datetime.utcnow().isoformat()}


def _compute_regions_week(db, week_start: datetime, week_end: datetime, limit: int = 20):
    rows = (
        db.query(
            User.region_id.label("region_id"),
            func.coalesce(func.sum(UserActivityLog.points), 0).label("points"),
        )
        .join(UserActivityLog, UserActivityLog.user_id == User.id)
        .filter(UserActivityLog.created_at >= week_start)
        .filter(UserActivityLog.created_at < week_end)
        .filter(User.region_id != None)
        .group_by(User.region_id)
        .order_by(desc("points"))
        .limit(limit)
        .all()
    )
    items = []
    for idx, r in enumerate(rows, start=1):
        items.append({"rank": idx, "region_id": int(r.region_id), "points": int(r.points or 0)})
    return {"type": "regions", "period": "weekly", "items": items, "updated_at": datetime.utcnow().isoformat()}


def _compute_projects_week(db, week_start: datetime, week_end: datetime, limit: int = 20):
    sub = (
        db.query(
            UserActivityLog.reference_id.label("project_id"),
            func.coalesce(func.sum(UserActivityLog.points), 0).label("points"),
        )
        .filter(UserActivityLog.created_at >= week_start)
        .filter(UserActivityLog.created_at < week_end)
        .filter(UserActivityLog.action_type.like("PROJECT_%"))
        .filter(UserActivityLog.reference_id != None)
        .group_by(UserActivityLog.reference_id)
        .subquery()
    )
    rows = (
        db.query(Project, sub.c.points)
        .join(sub, cast(Project.id, String) == sub.c.project_id)
        .order_by(sub.c.points.desc())
        .limit(limit)
        .all()
    )
    items = []
    for idx, (p, pts) in enumerate(rows, start=1):
        items.append(
            {
                "rank": idx,
                "project_id": str(p.id),
                "title": p.title,
                "region_id": p.region_id,
                "status": p.status.value if getattr(p.status, "value", None) else str(p.status),
                "points": int(pts or 0),
            }
        )
    return {"type": "projects", "period": "weekly", "items": items, "updated_at": datetime.utcnow().isoformat()}


@celery_app.task(name="app.tasks.gamification.weekly_reset_strict")
def weekly_reset_strict():
    db = SessionLocal()
    r = None
    try:
        cfg = db.query(GamificationRule).filter(GamificationRule.action_type == "WEEKLY_RESET_STRICT").first()
        if not cfg or not cfg.is_active or not bool((cfg.metadata_ or {}).get("enabled", True)):
            return {"enabled": False}

        now = datetime.utcnow()
        week_start, week_end = _week_window(now)

        contributors = _compute_contributors_week(db, week_start, week_end, limit=20)
        innovators = _compute_innovators_week(db, week_start, week_end, limit=20)
        regions = _compute_regions_week(db, week_start, week_end, limit=20)
        projects = _compute_projects_week(db, week_start, week_end, limit=20)

        archives = [
            ("contributors", "weekly", contributors),
            ("innovators", "weekly", innovators),
            ("regions", "weekly", regions),
            ("projects", "weekly", projects),
        ]
        archived = 0
        for t, p, data in archives:
            existing = (
                db.query(LeaderboardArchive)
                .filter(LeaderboardArchive.type == t)
                .filter(LeaderboardArchive.period == p)
                .filter(LeaderboardArchive.week_start == week_start)
                .first()
            )
            if not existing:
                db.add(
                    LeaderboardArchive(
                        type=t,
                        period=p,
                        week_start=week_start,
                        week_end=week_end,
                        data=data,
                        created_at=now,
                    )
                )
                archived += 1

        db.commit()

        rules = db.query(GamificationBadgeRule).filter(GamificationBadgeRule.is_active == True).filter(GamificationBadgeRule.rule_type == "WEEKLY_TOP").all()
        new_badges = 0
        for rule in rules:
            meta = rule.metadata_ or {}
            if meta.get("leaderboard") != "contributors" or meta.get("period") != "weekly":
                continue
            rank_max = int(meta.get("rank_max") or 1)
            winners = [it.get("user_id") for it in (contributors.get("items") or [])[:rank_max] if it.get("user_id")]
            for uid in winners:
                try:
                    ok = _award_badge(db, uid, rule.badge_id)
                    if ok:
                        new_badges += 1
                except Exception:
                    pass

        db.commit()

        for key in ["contributors_weekly", "innovators_weekly", "projects_weekly"]:
            db.query(LeaderboardCache).filter(LeaderboardCache.type == key).delete()
        db.commit()

        try:
            r = _redis()
            for pattern in ["leaderboard:*:weekly:*", "leaderboard:*_weekly", "leaderboard:contributors_weekly"]:
                for k in r.scan_iter(match=pattern, count=200):
                    r.delete(k)
        except Exception:
            pass

        return {"enabled": True, "week_start": week_start.isoformat(), "week_end": week_end.isoformat(), "archived": archived, "badges_awarded": new_badges}
    finally:
        try:
            if r:
                r.close()
        except Exception:
            pass
        db.close()
