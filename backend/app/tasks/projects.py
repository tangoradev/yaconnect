import json
from datetime import datetime, timedelta

import redis
from sqlalchemy import func, desc
import uuid as uuidlib

from app.core.celery_app import celery_app
from app.core.config import settings
from app.database.session import SessionLocal
from app.models.project import Project, ProjectVote, ProjectComment, ProjectStatus, ProjectVoteType, ProjectStatusHistory
from app.models.forum import ForumPost, ForumReaction, ForumComment as ForumCommentModel
from app.models.forum_extension import ForumNotification, NotificationType
from app.models.user import User
from app.services.score_engine import ScoreEngine


_engine = ScoreEngine()


def _redis():
    return redis.Redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)


def _system_actor_id(db):
    admin = db.query(User).filter(User.role.has(name="Admin")).first()
    if admin:
        return admin.id
    u = db.query(User).first()
    return u.id if u else None


@celery_app.task(name="app.tasks.projects.update_trending_projects")
def update_trending_projects():
    db = SessionLocal()
    r = None
    try:
        r = _redis()
        since = datetime.utcnow() - timedelta(days=7)

        vote_sub = (
            db.query(ProjectVote.project_id.label("project_id"), func.count(ProjectVote.id).label("votes"))
            .group_by(ProjectVote.project_id)
            .subquery()
        )
        comment_sub = (
            db.query(ProjectComment.project_id.label("project_id"), func.count(ProjectComment.id).label("comments"))
            .group_by(ProjectComment.project_id)
            .subquery()
        )

        q = (
            db.query(
                Project.id,
                (func.coalesce(vote_sub.c.votes, 0) * 2 + func.coalesce(comment_sub.c.comments, 0) * 1).label("score"),
            )
            .outerjoin(vote_sub, vote_sub.c.project_id == Project.id)
            .outerjoin(comment_sub, comment_sub.c.project_id == Project.id)
            .filter(Project.updated_at >= since)
            .filter(Project.status != ProjectStatus.ARCHIVED)
            .order_by(desc("score"), Project.updated_at.desc())
            .limit(50)
            .all()
        )

        ids = [str(row.id) for row in q]
        r.set("projects:trending:ids", json.dumps(ids), ex=60 * 60 * 24)
        return {"count": len(ids)}
    finally:
        try:
            if r:
                r.close()
        except Exception:
            pass
        db.close()


@celery_app.task(name="app.tasks.projects.weekly_project_promotion")
def weekly_project_promotion():
    db = SessionLocal()
    r = None
    try:
        r = _redis()
        actor_id = _system_actor_id(db)
        if not actor_id:
            return {"status": "no_users"}

        support_sub = (
            db.query(ProjectVote.project_id.label("project_id"), func.count(ProjectVote.id).label("support_votes"))
            .filter(ProjectVote.vote_type == ProjectVoteType.SUPPORT)
            .group_by(ProjectVote.project_id)
            .subquery()
        )
        oppose_sub = (
            db.query(ProjectVote.project_id.label("project_id"), func.count(ProjectVote.id).label("oppose_votes"))
            .filter(ProjectVote.vote_type == ProjectVoteType.OPPOSE)
            .group_by(ProjectVote.project_id)
            .subquery()
        )

        candidates = (
            db.query(Project)
            .outerjoin(support_sub, support_sub.c.project_id == Project.id)
            .outerjoin(oppose_sub, oppose_sub.c.project_id == Project.id)
            .filter(Project.status.in_([ProjectStatus.IN_DISCUSSION, ProjectStatus.COMMUNITY_VALIDATION]))
            .filter(Project.status != ProjectStatus.ARCHIVED)
            .all()
        )

        promoted_to_recommended = 0
        for p in candidates:
            support = db.query(func.count(ProjectVote.id)).filter(ProjectVote.project_id == p.id, ProjectVote.vote_type == ProjectVoteType.SUPPORT).scalar() or 0
            oppose = db.query(func.count(ProjectVote.id)).filter(ProjectVote.project_id == p.id, ProjectVote.vote_type == ProjectVoteType.OPPOSE).scalar() or 0
            total = support + oppose
            approval = (support / total * 100.0) if total > 0 else 0.0
            if total >= 30 and approval >= 70.0 and p.status != ProjectStatus.RECOMMENDED:
                p.status = ProjectStatus.RECOMMENDED
                db.add(ProjectStatusHistory(project_id=p.id, status=p.status, changed_by=actor_id))
                _engine.record_action(db, p.created_by, "PROJECT_RECOMMENDED", reference_id=str(p.id), metadata={"source": "weekly_project_promotion"}, commit=False)
                db.add(
                    ForumNotification(
                        user_id=p.created_by,
                        type=NotificationType.PROJECT_RECOMMENDED,
                        message="Votre projet a été recommandé par la communauté.",
                        reference_id=str(p.id),
                    )
                )
                promoted_to_recommended += 1

        db.commit()

        trending_ids_json = r.get("projects:trending:ids")
        trending_ids = json.loads(trending_ids_json) if trending_ids_json else []
        top_ids = trending_ids[:3]

        promoted_to_ambassador = 0
        for pid in top_ids:
            try:
                project_uuid = uuidlib.UUID(pid)
            except Exception:
                continue
            p = db.query(Project).filter(Project.id == project_uuid).first()
            if not p:
                continue
            if p.status == ProjectStatus.RECOMMENDED:
                p.status = ProjectStatus.AMBASSADOR_PROJECT
                db.add(ProjectStatusHistory(project_id=p.id, status=p.status, changed_by=actor_id))
                _engine.record_action(db, p.created_by, "PROJECT_AMBASSADOR_PROMOTED", reference_id=str(p.id), metadata={"source": "weekly_project_promotion"}, force_points=0, commit=False)
                db.add(
                    ForumNotification(
                        user_id=p.created_by,
                        type=NotificationType.PROJECT_STATUS_CHANGE,
                        message="Votre projet a été promu en projet Ambassadeur.",
                        reference_id=str(p.id),
                    )
                )
                promoted_to_ambassador += 1

        db.commit()
        return {"recommended": promoted_to_recommended, "ambassador": promoted_to_ambassador}
    finally:
        try:
            if r:
                r.close()
        except Exception:
            pass
        db.close()


@celery_app.task(name="app.tasks.projects.detect_high_potential_forum_posts")
def detect_high_potential_forum_posts():
    db = SessionLocal()
    r = None
    try:
        r = _redis()
        since = datetime.utcnow() - timedelta(days=14)

        reaction_sub = (
            db.query(ForumReaction.post_id.label("post_id"), func.count(ForumReaction.id).label("reactions"))
            .group_by(ForumReaction.post_id)
            .subquery()
        )
        comment_sub = (
            db.query(ForumCommentModel.post_id.label("post_id"), func.count(ForumCommentModel.id).label("comments"))
            .group_by(ForumCommentModel.post_id)
            .subquery()
        )

        q = (
            db.query(
                ForumPost.id,
                (func.coalesce(reaction_sub.c.reactions, 0) * 2 + func.coalesce(comment_sub.c.comments, 0) * 1).label("score"),
            )
            .outerjoin(reaction_sub, reaction_sub.c.post_id == ForumPost.id)
            .outerjoin(comment_sub, comment_sub.c.post_id == ForumPost.id)
            .filter(ForumPost.created_at >= since)
            .filter(ForumPost.is_hidden == False)
            .order_by(desc("score"), ForumPost.created_at.desc())
            .limit(50)
            .all()
        )

        ids = [str(row.id) for row in q if (row.score or 0) >= 10]
        r.set("forum:high_potential_posts", json.dumps(ids), ex=60 * 60 * 24)
        return {"count": len(ids)}
    finally:
        try:
            if r:
                r.close()
        except Exception:
            pass
        db.close()
