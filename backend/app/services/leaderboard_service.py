from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case

from app.models.gamification import UserActivityLog, LeaderboardCache
from app.models.user import User
from app.models.region import Region
from app.models.project import Project, ProjectVote, ProjectComment, ProjectVoteType


def _upsert_cache(db: Session, cache_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    existing = db.query(LeaderboardCache).filter(LeaderboardCache.type == cache_type).first()
    if existing:
        existing.data = data
        existing.updated_at = datetime.utcnow()
    else:
        existing = LeaderboardCache(type=cache_type, data=data, updated_at=datetime.utcnow())
        db.add(existing)
    db.commit()
    db.refresh(existing)
    return {"type": existing.type, "data": existing.data, "updated_at": existing.updated_at}


def compute_contributors(db: Session, period: str = "weekly", limit: int = 20) -> Dict[str, Any]:
    now = datetime.utcnow()
    since = now - timedelta(days=7) if period == "weekly" else now - timedelta(days=90)

    rows = (
        db.query(User.id, User.first_name, User.last_name, User.region_id, func.coalesce(func.sum(UserActivityLog.points), 0).label("points"))
        .join(UserActivityLog, UserActivityLog.user_id == User.id)
        .filter(UserActivityLog.created_at >= since)
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
    return {"type": "contributors", "period": period, "items": items, "updated_at": now.isoformat()}


def compute_innovators(db: Session, period: str = "weekly", limit: int = 20) -> Dict[str, Any]:
    now = datetime.utcnow()
    since = now - timedelta(days=7) if period == "weekly" else now - timedelta(days=90)

    project_actions = (
        db.query(
            UserActivityLog.user_id.label("user_id"),
            func.count(UserActivityLog.id).label("actions"),
            func.coalesce(func.sum(UserActivityLog.points), 0).label("points"),
        )
        .filter(UserActivityLog.created_at >= since)
        .filter(UserActivityLog.action_type.like("PROJECT_%"))
        .group_by(UserActivityLog.user_id)
        .subquery()
    )

    rows = (
        db.query(User.id, User.first_name, User.last_name, User.region_id, project_actions.c.actions, project_actions.c.points)
        .join(project_actions, project_actions.c.user_id == User.id)
        .order_by(desc(project_actions.c.points), desc(project_actions.c.actions))
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
    return {"type": "innovators", "period": period, "items": items, "updated_at": now.isoformat()}


def compute_regions(db: Session, period: str = "daily", limit: int = 20) -> Dict[str, Any]:
    now = datetime.utcnow()
    since = now - timedelta(days=1) if period == "daily" else now - timedelta(days=7)

    rows = (
        db.query(User.region_id, func.coalesce(func.sum(UserActivityLog.points), 0).label("points"))
        .join(UserActivityLog, UserActivityLog.user_id == User.id)
        .filter(UserActivityLog.created_at >= since)
        .filter(User.region_id != None)
        .group_by(User.region_id)
        .order_by(desc("points"))
        .limit(limit)
        .all()
    )

    region_ids = [r.region_id for r in rows if r.region_id is not None]
    regions = db.query(Region).filter(Region.id.in_(region_ids)).all() if region_ids else []
    region_map = {r.id: r.name for r in regions}

    items = []
    for idx, r in enumerate(rows, start=1):
        items.append(
            {
                "rank": idx,
                "region_id": int(r.region_id),
                "region_name": region_map.get(int(r.region_id)) if r.region_id is not None else None,
                "points": int(r.points or 0),
            }
        )
    return {"type": "regions", "period": period, "items": items, "updated_at": now.isoformat()}


def compute_projects(db: Session, period: str = "weekly", limit: int = 20) -> Dict[str, Any]:
    now = datetime.utcnow()
    since = now - timedelta(days=7) if period == "weekly" else now - timedelta(days=90)

    support = func.sum(case((ProjectVote.vote_type == ProjectVoteType.SUPPORT, 1), else_=0)).label("support_votes")
    oppose = func.sum(case((ProjectVote.vote_type == ProjectVoteType.OPPOSE, 1), else_=0)).label("oppose_votes")
    comments = func.count(ProjectComment.id).label("comment_count")
    votes = func.count(ProjectVote.id).label("vote_count")
    score = (support - oppose + comments).label("score")

    rows = (
        db.query(Project.id, Project.title, Project.region_id, Project.status, support, oppose, votes, comments, score)
        .outerjoin(ProjectVote, ProjectVote.project_id == Project.id)
        .outerjoin(ProjectComment, ProjectComment.project_id == Project.id)
        .filter(Project.updated_at >= since)
        .group_by(Project.id)
        .order_by(desc("score"), Project.updated_at.desc())
        .limit(limit)
        .all()
    )

    items = []
    for idx, r in enumerate(rows, start=1):
        total = int(r.vote_count or 0)
        sup = int(r.support_votes or 0)
        approval = (sup / total * 100.0) if total > 0 else 0.0
        items.append(
            {
                "rank": idx,
                "project_id": str(r.id),
                "title": r.title,
                "region_id": r.region_id,
                "status": r.status.value if getattr(r.status, "value", None) else str(r.status),
                "votes": total,
                "comments": int(r.comment_count or 0),
                "approval": float(approval),
            }
        )
    return {"type": "projects", "period": period, "items": items, "updated_at": now.isoformat()}


def refresh_all(db: Session) -> Dict[str, Any]:
    contributors_weekly = compute_contributors(db, "weekly")
    innovators_weekly = compute_innovators(db, "weekly")
    regions_daily = compute_regions(db, "daily")
    projects_weekly = compute_projects(db, "weekly")

    _upsert_cache(db, "contributors_weekly", contributors_weekly)
    _upsert_cache(db, "innovators_weekly", innovators_weekly)
    _upsert_cache(db, "regions_daily", regions_daily)
    _upsert_cache(db, "projects_weekly", projects_weekly)

    return {
        "contributors_weekly": contributors_weekly,
        "innovators_weekly": innovators_weekly,
        "regions_daily": regions_daily,
        "projects_weekly": projects_weekly,
    }
