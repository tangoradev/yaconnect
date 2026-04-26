from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import json
from sqlalchemy import func

from app.database.session import get_db
from app.core import dependencies
from app.schemas.forum_extension import (
    ForumNotification, SearchResult, UserBadge, LeaderboardEntry, ProjectSuggestion
)
from app.services import notification_service, gamification_service, search_service
from app.models.forum import ForumPost, ForumReaction, ForumComment
from app.models.project import Project
from app.models.user import User

router = APIRouter()

# --- Notifications ---
@router.get("/notifications", response_model=List[ForumNotification])
def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user)
):
    return notification_service.get_notifications(db, current_user.id, skip, limit, unread_only)

@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user)
):
    return notification_service.mark_as_read(db, notification_id, current_user.id)

@router.post("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user)
):
    notification_service.mark_all_as_read(db, current_user.id)
    return {"status": "success"}

@router.get("/notifications/count")
def count_unread_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user)
):
    return {"count": notification_service.count_unread(db, current_user.id)}

# --- Search ---
@router.get("/forum/search", response_model=List[SearchResult])
def search_forum(
    q: str,
    db: Session = Depends(get_db)
):
    return search_service.search_forum(db, q)


@router.get("/forum/suggestions/projects", response_model=List[ProjectSuggestion])
async def suggest_projects_from_forum(
    request: Request,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    redis_client = getattr(request.app.state, "redis", None)
    post_ids = []
    if redis_client is not None:
        try:
            raw = await redis_client.get("forum:high_potential_posts")
            if raw:
                post_ids = json.loads(raw)
        except Exception:
            post_ids = []

    if not post_ids:
        post_ids = []

    suggestions = []
    for pid in post_ids[:limit]:
        try:
            post_uuid = UUID(pid)
        except Exception:
            continue
        post = db.query(ForumPost).filter(ForumPost.id == post_uuid).first()
        if not post:
            continue
        reactions = db.query(func.count(ForumReaction.id)).filter(ForumReaction.post_id == post.id).scalar() or 0
        comments = db.query(func.count(ForumComment.id)).filter(ForumComment.post_id == post.id).scalar() or 0
        score = reactions * 2 + comments
        existing_project = db.query(Project).filter(Project.source_post_id == post.id).first()
        suggestions.append(
            {
                "post_id": post.id,
                "title": post.title,
                "excerpt": post.content[:200] + "..." if len(post.content) > 200 else post.content,
                "score": int(score),
                "reactions": int(reactions),
                "comments": int(comments),
                "already_converted": bool(existing_project),
                "project_id": existing_project.id if existing_project else None,
            }
        )
    return suggestions

# --- Gamification ---
@router.get("/forum/badges/me", response_model=List[UserBadge])
def get_my_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user)
):
    return gamification_service.get_user_badges(db, current_user.id)

@router.get("/forum/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    users = gamification_service.get_leaderboard(db, limit)
    # Convert to LeaderboardEntry
    results = []
    for idx, user in enumerate(users):
        results.append({
            "user_id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "score": user.score,
            "rank": idx + 1,
            "avatar": None, # Add avatar logic if available
            "badges_count": len(user.badges)
        })
    return results

# --- Admin / Scheduled Tasks Triggers ---
@router.post("/admin/forum/calculate-ambassadors")
def trigger_ambassador_calculation(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_admin)
):
    background_tasks.add_task(gamification_service.update_ambassadors, db)
    return {"message": "Ambassador calculation triggered"}

@router.post("/admin/forum/init-badges")
def initialize_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_admin)
):
    gamification_service.init_badges(db)
    return {"message": "Badges initialized"}
