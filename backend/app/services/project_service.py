from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc
from uuid import UUID
from typing import Optional, List, Tuple
from datetime import datetime, timedelta

from app.models.project import Project, ProjectComment, ProjectVote, ProjectMedia, ProjectStatusHistory, ProjectStatus, ProjectVoteType, ProjectMediaType
from app.models.forum import ForumPost
from app.models.user import User
from app.models.forum_extension import ForumNotification, NotificationType
from app.services import forum_service
from app.services.score_engine import ScoreEngine


_engine = ScoreEngine()


def _vote_counts(db: Session, project_id: UUID) -> Tuple[int, int, int, float]:
    support = db.query(func.count(ProjectVote.id)).filter(
        ProjectVote.project_id == project_id,
        ProjectVote.vote_type == ProjectVoteType.SUPPORT,
    ).scalar() or 0
    oppose = db.query(func.count(ProjectVote.id)).filter(
        ProjectVote.project_id == project_id,
        ProjectVote.vote_type == ProjectVoteType.OPPOSE,
    ).scalar() or 0
    total = support + oppose
    approval = (support / total * 100.0) if total > 0 else 0.0
    return support, oppose, total, approval


def _comment_count(db: Session, project_id: UUID) -> int:
    return db.query(func.count(ProjectComment.id)).filter(ProjectComment.project_id == project_id).scalar() or 0


def hydrate_project_metrics(db: Session, project: Project) -> Project:
    support, oppose, total, approval = _vote_counts(db, project.id)
    project.support_votes = support
    project.oppose_votes = oppose
    project.total_votes = total
    project.approval_percentage = approval
    project.comment_count = _comment_count(db, project.id)
    return project


def _add_status_history(db: Session, project_id: UUID, status: ProjectStatus, actor_id: UUID):
    db.add(ProjectStatusHistory(project_id=project_id, status=status, changed_by=actor_id))


def _notify(db: Session, user_id: UUID, ntype: NotificationType, message: str, reference_id: Optional[str] = None):
    db.add(ForumNotification(user_id=user_id, type=ntype, message=message, reference_id=reference_id))


def _maybe_advance_status(db: Session, project: Project, actor_id: UUID) -> bool:
    support, oppose, total, approval = _vote_counts(db, project.id)
    changed = False

    if project.status == ProjectStatus.IN_DISCUSSION and total >= 20:
        project.status = ProjectStatus.COMMUNITY_VALIDATION
        _add_status_history(db, project.id, project.status, actor_id)
        _notify(db, project.created_by, NotificationType.PROJECT_STATUS_CHANGE, "Votre projet est passé en validation communautaire.", str(project.id))
        changed = True

    if project.status in [ProjectStatus.IN_DISCUSSION, ProjectStatus.COMMUNITY_VALIDATION] and total >= 30 and approval >= 70.0:
        project.status = ProjectStatus.RECOMMENDED
        _add_status_history(db, project.id, project.status, actor_id)
        _engine.record_action(db, project.created_by, "PROJECT_RECOMMENDED", reference_id=str(project.id), metadata={"triggered_by": str(actor_id)}, commit=False)
        _notify(db, project.created_by, NotificationType.PROJECT_RECOMMENDED, "Votre projet a été recommandé par la communauté.", str(project.id))
        changed = True

    return changed


def create_project(db: Session, project_in, user: User) -> Project:
    status = project_in.status or ProjectStatus.IN_DISCUSSION
    project = Project(
        title=project_in.title,
        description=project_in.description,
        problem_statement=project_in.problem_statement,
        objectives=project_in.objectives,
        region_id=project_in.region_id,
        created_by=user.id,
        status=status,
        budget_estimate=project_in.budget_estimate,
        partners_needed=project_in.partners_needed,
        video_url=project_in.video_url,
        source_post_id=project_in.source_post_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    _add_status_history(db, project.id, project.status, user.id)
    db.commit()

    if project.status != ProjectStatus.DRAFT:
        _engine.record_action(db, user.id, "PROJECT_SUBMIT", reference_id=str(project.id), metadata={"source_post_id": str(project.source_post_id) if project.source_post_id else None})

    db.refresh(project)
    return project


def list_projects(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    region_id: Optional[int] = None,
    status: Optional[ProjectStatus] = None,
    sort: str = "recent",
) -> List[Project]:
    q = db.query(Project)
    if region_id is not None:
        q = q.filter(Project.region_id == region_id)
    if status is not None:
        q = q.filter(Project.status == status)

    if sort == "popularity":
        support_count = func.sum(case((ProjectVote.vote_type == ProjectVoteType.SUPPORT, 1), else_=0)).label("support_count")
        oppose_count = func.sum(case((ProjectVote.vote_type == ProjectVoteType.OPPOSE, 1), else_=0)).label("oppose_count")
        score = (support_count - oppose_count).label("score")
        q = q.outerjoin(ProjectVote, ProjectVote.project_id == Project.id).group_by(Project.id).order_by(desc(score), Project.updated_at.desc())
    elif sort == "trending":
        last_7_days = datetime.utcnow() - timedelta(days=7)
        vote_count = func.count(ProjectVote.id).label("vote_count")
        comment_count = func.count(ProjectComment.id).label("comment_count")
        activity = (vote_count * 2 + comment_count * 1).label("activity_score")
        q = (
            q.outerjoin(ProjectVote, ProjectVote.project_id == Project.id)
             .outerjoin(ProjectComment, ProjectComment.project_id == Project.id)
             .filter(Project.updated_at >= last_7_days)
             .group_by(Project.id)
             .order_by(desc(activity), Project.updated_at.desc())
        )
    else:
        q = q.order_by(Project.updated_at.desc())

    return q.offset(skip).limit(limit).all()


def get_project(db: Session, project_id: UUID) -> Optional[Project]:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return None
    return hydrate_project_metrics(db, project)


def update_project(db: Session, project_id: UUID, project_in, actor: User) -> Optional[Project]:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return None

    is_admin = bool(actor.role and actor.role.name in ["SuperAdmin", "Admin"])
    is_owner = project.created_by == actor.id

    if not (is_admin or is_owner):
        return None

    if project_in.title is not None:
        project.title = project_in.title
    if project_in.description is not None:
        project.description = project_in.description
    if project_in.problem_statement is not None:
        project.problem_statement = project_in.problem_statement
    if project_in.objectives is not None:
        project.objectives = project_in.objectives
    if project_in.region_id is not None:
        project.region_id = project_in.region_id
    if project_in.budget_estimate is not None:
        project.budget_estimate = project_in.budget_estimate
    if project_in.partners_needed is not None:
        project.partners_needed = project_in.partners_needed
    if project_in.video_url is not None:
        project.video_url = project_in.video_url

    if project_in.status is not None and project_in.status != project.status:
        allowed_owner = (
            (project.status == ProjectStatus.DRAFT and project_in.status == ProjectStatus.IN_DISCUSSION)
            or (project.status == ProjectStatus.IN_DISCUSSION and project_in.status == ProjectStatus.ARCHIVED)
            or (project.status == ProjectStatus.DRAFT and project_in.status == ProjectStatus.ARCHIVED)
        )
        if not is_admin and not allowed_owner:
            return None

        project.status = project_in.status
        _add_status_history(db, project.id, project.status, actor.id)

        if project.status == ProjectStatus.IN_DISCUSSION:
            already = db.query(func.count(ProjectStatusHistory.id)).filter(
                ProjectStatusHistory.project_id == project.id,
                ProjectStatusHistory.status == ProjectStatus.IN_DISCUSSION,
            ).scalar() or 0
            if already == 0:
                _engine.record_action(db, project.created_by, "PROJECT_SUBMIT", reference_id=str(project.id), commit=False)

        if project.status == ProjectStatus.RECOMMENDED:
            already = db.query(func.count(ProjectStatusHistory.id)).filter(
                ProjectStatusHistory.project_id == project.id,
                ProjectStatusHistory.status == ProjectStatus.RECOMMENDED,
            ).scalar() or 0
            if already == 0:
                _engine.record_action(db, project.created_by, "PROJECT_RECOMMENDED", reference_id=str(project.id), metadata={"triggered_by": str(actor.id)}, commit=False)

    db.commit()
    db.refresh(project)
    return hydrate_project_metrics(db, project)


def add_comment(db: Session, project_id: UUID, content: str, user: User) -> Optional[ProjectComment]:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return None

    comment = ProjectComment(project_id=project_id, user_id=user.id, content=content, created_at=datetime.utcnow())
    db.add(comment)
    db.commit()
    db.refresh(comment)

    _engine.record_action(db, user.id, "PROJECT_COMMENT_CREATE", reference_id=str(comment.id), metadata={"project_id": str(project.id)})

    if project.created_by != user.id:
        _notify(db, project.created_by, NotificationType.PROJECT_COMMENT, "Nouveau commentaire sur votre projet.", str(project.id))
        db.commit()

    if project.status in [ProjectStatus.IN_DISCUSSION, ProjectStatus.COMMUNITY_VALIDATION]:
        _maybe_advance_status(db, project, user.id)
        db.commit()

    return comment


def vote(db: Session, project_id: UUID, vote_type: ProjectVoteType, user: User) -> Optional[ProjectVote]:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return None

    existing = db.query(ProjectVote).filter(ProjectVote.project_id == project_id, ProjectVote.user_id == user.id).first()

    if existing and existing.vote_type == vote_type:
        db.delete(existing)
        db.commit()
        _engine.record_action(db, user.id, "PROJECT_VOTE_TOGGLE_OFF", reference_id=str(project.id), metadata={"vote_type": vote_type.value})
        return None

    if existing:
        existing.vote_type = vote_type
        db.commit()
        db.refresh(existing)
        if vote_type == ProjectVoteType.SUPPORT:
            _engine.record_action(db, user.id, "PROJECT_VOTE_SUPPORT", reference_id=str(project.id))
        else:
            _engine.record_action(db, user.id, "PROJECT_VOTE_CAST", reference_id=str(project.id), metadata={"vote_type": vote_type.value})
        if project.created_by != user.id:
            _notify(db, project.created_by, NotificationType.PROJECT_VOTE, "Un vote a été mis à jour sur votre projet.", str(project.id))
            db.commit()
        _maybe_advance_status(db, project, user.id)
        db.commit()
        return existing

    vote_obj = ProjectVote(project_id=project_id, user_id=user.id, vote_type=vote_type, created_at=datetime.utcnow())
    db.add(vote_obj)
    db.commit()
    db.refresh(vote_obj)

    if vote_type == ProjectVoteType.SUPPORT:
        _engine.record_action(db, user.id, "PROJECT_VOTE_SUPPORT", reference_id=str(project.id))
    else:
        _engine.record_action(db, user.id, "PROJECT_VOTE_CAST", reference_id=str(project.id), metadata={"vote_type": vote_type.value})

    if project.created_by != user.id:
        _notify(db, project.created_by, NotificationType.PROJECT_VOTE, "Nouveau vote sur votre projet.", str(project.id))
        db.commit()

    _maybe_advance_status(db, project, user.id)
    db.commit()
    return vote_obj


def convert_from_post(db: Session, post_id: UUID, user: User) -> Optional[Project]:
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        return None

    existing = db.query(Project).filter(Project.source_post_id == post_id).first()
    if existing:
        return existing

    title = post.title or (post.content[:80] + "..." if len(post.content) > 80 else post.content)
    project = Project(
        title=title,
        description=None,
        problem_statement=post.content,
        objectives="Objectifs à préciser avec la communauté.",
        region_id=user.region_id,
        created_by=user.id,
        status=ProjectStatus.IN_DISCUSSION,
        budget_estimate=None,
        partners_needed=None,
        video_url=None,
        source_post_id=post_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    _add_status_history(db, project.id, project.status, user.id)
    db.commit()
    _engine.record_action(db, user.id, "PROJECT_SUBMIT", reference_id=str(project.id), metadata={"source_post_id": str(post_id)})
    if post.user_id != user.id:
        _notify(db, post.user_id, NotificationType.PROJECT_CONVERTED, "Votre idée a été convertie en projet.", str(project.id))
        db.commit()
    db.refresh(project)
    return project


def add_media_record(db: Session, project_id: UUID, file_url: str, media_type: ProjectMediaType) -> ProjectMedia:
    media = ProjectMedia(project_id=project_id, file_url=file_url, type=media_type, created_at=datetime.utcnow())
    db.add(media)
    db.commit()
    db.refresh(media)
    return media
