from datetime import datetime, timedelta
from typing import Dict, List
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.user import User
from app.models.forum import ForumPost, ForumReport, ReportStatus
from app.models.gamification import UserActivityLog
from app.models.forum_extension import ForumBadge, UserBadge, ForumNotification, NotificationType


def detect_ambassadors(db: Session) -> Dict[str, int]:
    now = datetime.utcnow()
    since = now - timedelta(days=90)

    eligible_users = (
        db.query(User.id)
        .filter(User.is_active == True)
        .all()
    )
    user_ids = [u.id for u in eligible_users]
    if not user_ids:
        return {"eligible": 0, "selected": 0, "new": 0}

    activity_days = (
        db.query(UserActivityLog.user_id, func.count(func.distinct(func.date(UserActivityLog.created_at))).label("days"))
        .filter(UserActivityLog.created_at >= since)
        .filter(UserActivityLog.user_id.in_(user_ids))
        .group_by(UserActivityLog.user_id)
        .subquery()
    )

    project_activity = (
        db.query(UserActivityLog.user_id.label("user_id"))
        .filter(UserActivityLog.created_at >= since)
        .filter(UserActivityLog.action_type.like("PROJECT_%"))
        .group_by(UserActivityLog.user_id)
        .subquery()
    )

    moderation_flags = (
        db.query(ForumPost.user_id.label("user_id"), func.count(ForumReport.id).label("flags"))
        .join(ForumReport, ForumReport.post_id == ForumPost.id)
        .filter(ForumReport.status == ReportStatus.ACTION_TAKEN)
        .filter(ForumReport.created_at >= since)
        .group_by(ForumPost.user_id)
        .subquery()
    )

    hidden_posts = (
        db.query(ForumPost.user_id.label("user_id"), func.count(ForumPost.id).label("hidden"))
        .filter(ForumPost.is_hidden == True)
        .filter(ForumPost.updated_at >= since)
        .group_by(ForumPost.user_id)
        .subquery()
    )

    candidates = (
        db.query(User)
        .outerjoin(activity_days, activity_days.c.user_id == User.id)
        .outerjoin(project_activity, project_activity.c.user_id == User.id)
        .outerjoin(moderation_flags, moderation_flags.c.user_id == User.id)
        .outerjoin(hidden_posts, hidden_posts.c.user_id == User.id)
        .filter(User.id.in_(user_ids))
        .filter(func.coalesce(activity_days.c.days, 0) >= 45)
        .filter(project_activity.c.user_id != None)
        .filter(func.coalesce(moderation_flags.c.flags, 0) == 0)
        .filter(func.coalesce(hidden_posts.c.hidden, 0) == 0)
        .order_by(User.score.desc())
        .all()
    )

    eligible = len(candidates)
    if eligible == 0:
        return {"eligible": 0, "selected": 0, "new": 0}

    selected_count = max(1, int(eligible * 0.03))
    selected = candidates[:selected_count]

    badge = db.query(ForumBadge).filter(ForumBadge.name == "Ambassador").first()
    new_count = 0

    for u in selected:
        if u.community_level != "Ambassador":
            u.community_level = "Ambassador"
            db.add(
                ForumNotification(
                    user_id=u.id,
                    type=NotificationType.LEVEL_UP,
                    message="Vous êtes maintenant un Ambassadeur GRIN17 !",
                    reference_id="ambassador",
                )
            )
        if badge:
            has = db.query(UserBadge).filter(UserBadge.user_id == u.id, UserBadge.badge_id == badge.id).first()
            if not has:
                db.add(UserBadge(user_id=u.id, badge_id=badge.id, earned_at=now))
                db.add(
                    ForumNotification(
                        user_id=u.id,
                        type=NotificationType.BADGE,
                        message=f"Badge obtenu : {badge.name}",
                        reference_id=str(badge.id),
                    )
                )
                new_count += 1

        db.add(
            UserActivityLog(
                user_id=u.id,
                action_type="AMBASSADOR_ASSIGNED",
                reference_id=None,
                points=0,
                metadata_={"window_days": 90, "top_percent": 3},
                created_at=now,
            )
        )

    db.commit()
    return {"eligible": eligible, "selected": selected_count, "new": new_count}
