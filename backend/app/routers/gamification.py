from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from uuid import UUID
import json
from datetime import datetime

from app.database.session import get_db
from app.core import dependencies
from app.core.config import settings
from app.models.gamification import LeaderboardCache, UserActivityLog, UserScoresHistory, GamificationLevel, GamificationMission, UserMissionProgress
from app.models.forum_extension import UserBadge, ForumBadge
from app.models.user import User
from app.schemas.gamification import LeaderboardResponse, MyGamificationSummary, ActivityLogEntry, ScoreHistoryEntry
from app.services import leaderboard_service


router = APIRouter()


@router.get("/leaderboards", response_model=LeaderboardResponse)
async def get_leaderboards(
    request: Request,
    type: str = "contributors",
    period: str = "weekly",
    limit: int = 20,
    db: Session = Depends(get_db),
):
    redis_client = getattr(request.app.state, "redis", None)
    cache_key = f"leaderboard:{type}:{period}:{limit}"

    if redis_client is not None:
        try:
            raw = await redis_client.get(cache_key)
            if raw:
                payload = json.loads(raw)
                return {
                    "type": payload.get("type", type),
                    "period": payload.get("period", period),
                    "updated_at": datetime.fromisoformat(payload["updated_at"]),
                    "items": payload.get("items") or [],
                }
        except Exception:
            pass

    if type == "contributors":
        data = leaderboard_service.compute_contributors(db, period=period, limit=limit)
    elif type == "innovators":
        data = leaderboard_service.compute_innovators(db, period=period, limit=limit)
    elif type == "regions":
        data = leaderboard_service.compute_regions(db, period="daily" if period == "daily" else "weekly", limit=limit)
    elif type == "projects":
        data = leaderboard_service.compute_projects(db, period=period, limit=limit)
    else:
        raise HTTPException(status_code=400, detail="Unsupported leaderboard type")

    leaderboard_service._upsert_cache(db, f"{type}_{period}", data)
    if redis_client is not None:
        try:
            await redis_client.set(cache_key, json.dumps(data), ex=settings.CACHE_TTL_SECONDS)
        except Exception:
            pass

    return {"type": data["type"], "period": data["period"], "updated_at": datetime.fromisoformat(data["updated_at"]), "items": data["items"]}


@router.get("/gamification/me", response_model=MyGamificationSummary)
def my_gamification(
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    levels = (
        db.query(GamificationLevel)
        .filter(GamificationLevel.is_active == True)
        .order_by(GamificationLevel.min_score.asc())
        .all()
    )
    score = int(current_user.score or 0)
    level_name = "Explorer"
    for lv in reversed(levels):
        if int(lv.min_score) <= score:
            level_name = lv.name
            break
    if current_user.community_level != level_name:
        current_user.community_level = level_name
        db.commit()

    next_level = None
    next_level_min_score = None
    progress_to_next = 0.0
    for i, lv in enumerate(levels):
        if lv.name == level_name:
            if i + 1 < len(levels):
                next_level = levels[i + 1].name
                next_level_min_score = int(levels[i + 1].min_score)
                span = max(1, int(levels[i + 1].min_score) - int(lv.min_score))
                progress_to_next = min(1.0, max(0.0, (score - int(lv.min_score)) / span))
            break

    badges_rows = (
        db.query(UserBadge, ForumBadge)
        .join(ForumBadge, ForumBadge.id == UserBadge.badge_id)
        .filter(UserBadge.user_id == current_user.id)
        .order_by(UserBadge.earned_at.desc())
        .all()
    )
    badges = [{"id": b.id, "name": badge.name, "description": badge.description, "icon": badge.icon, "earned_at": b.earned_at} for b, badge in badges_rows]

    rank_global = (
        db.query(func.count(User.id))
        .filter(User.score > score)
        .scalar()
        or 0
    ) + 1
    rank_region = None
    if current_user.region_id is not None:
        rank_region = (
            db.query(func.count(User.id))
            .filter(User.region_id == current_user.region_id)
            .filter(User.score > score)
            .scalar()
            or 0
        ) + 1

    activity_rows = (
        db.query(UserActivityLog)
        .filter(UserActivityLog.user_id == current_user.id)
        .order_by(UserActivityLog.created_at.desc())
        .limit(50)
        .all()
    )
    history_rows = (
        db.query(UserScoresHistory)
        .filter(UserScoresHistory.user_id == current_user.id)
        .order_by(UserScoresHistory.created_at.desc())
        .limit(60)
        .all()
    )

    missions = (
        db.query(GamificationMission)
        .filter(GamificationMission.is_active == True)
        .order_by(GamificationMission.created_at.desc())
        .all()
    )
    progress_rows = (
        db.query(UserMissionProgress)
        .filter(UserMissionProgress.user_id == current_user.id)
        .all()
    )
    progress_map = {p.mission_id: p for p in progress_rows}
    mission_progress = []
    for m in missions:
        p = progress_map.get(m.id)
        mission_progress.append(
            {
                "mission": m,
                "progress": (p.progress if p else {}),
                "is_completed": bool(p.is_completed) if p else False,
                "completed_at": p.completed_at if p else None,
            }
        )

    return {
        "user_id": current_user.id,
        "score": score,
        "level": level_name,
        "next_level": next_level,
        "next_level_min_score": next_level_min_score,
        "progress_to_next_level": float(progress_to_next),
        "badges": badges,
        "rank_global": int(rank_global),
        "rank_region": int(rank_region) if rank_region is not None else None,
        "activity": activity_rows,
        "score_history": history_rows,
        "missions": mission_progress,
    }
