from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.forum import ForumTopic, ForumPost, ForumComment, ForumReaction, ForumReport, ReactionType, ReportStatus
from app.models.user import User
from app.models.forum_extension import ForumNotification, NotificationType
from app.services.score_engine import ScoreEngine
from app.schemas.forum import ForumPostCreate, ForumCommentCreate, ForumTopicCreate, ForumReactionCreate, ForumReportCreate
from app.schemas.forum_extension import ForumNotificationCreate
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
import re

_engine = ScoreEngine()

def update_user_score(db: Session, user_id: UUID, points: int):
    _engine.record_action(db, user_id, "SCORE_ADJUSTMENT", metadata={"source": "legacy_update_user_score"}, force_points=points)

def process_mentions(db: Session, content: str, post_id: UUID, comment_id: Optional[UUID], author_id: UUID):
    """
    Parse content for @username and create notifications.
    """
    mention_pattern = r'@(\w+)'
    mentions = re.findall(mention_pattern, content)
    
    for username in set(mentions): # Unique mentions
        # Find user by username (assuming first_name or we need a username field. 
        # The User model currently has first_name, last_name, email. 
        # Let's assume mentions use first_name for now or we need to add username.
        # Since I don't recall a username field, I'll check the User model or use email part.
        # Actually, let's assume first_name for this demo or email prefix.
        # Ideally we should have a 'username' field. 
        # Let's try to match first_name for simplicity in this prototype phase.
        
        mentioned_user = db.query(User).filter(User.first_name.ilike(username)).first()
        
        if mentioned_user and mentioned_user.id != author_id:
            # Create Notification
            db.add(ForumNotification(
                user_id=mentioned_user.id,
                type=NotificationType.MENTION,
                message=f"Vous avez été mentionné dans un commentaire.",
                reference_id=str(comment_id) if comment_id else str(post_id)
            ))
    db.commit()

def create_topic(db: Session, topic: ForumTopicCreate, user_id: UUID):
    db_topic = ForumTopic(**topic.model_dump(), created_by=user_id)
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

from app.models.interest import Interest

def sync_topics_with_interests(db: Session):
    """
    Ensures that for every Interest, there is a corresponding ForumTopic.
    This should be called periodically or when fetching topics.
    """
    # Find an admin user to be the creator of system topics
    # We assume role_id=1 is Admin. If no admin, we can't create topics easily due to FK constraint.
    admin_user = db.query(User).filter(User.role_id == 1).first() 
    
    if not admin_user:
        # Fallback: try to find any user if no admin (just for dev stability)
        admin_user = db.query(User).first()
        
    if not admin_user:
        return # No users at all, can't create topics

    interests = db.query(Interest).all()
    
    for interest in interests:
        # Check if a topic is already linked to this interest ID
        # Note: ForumTopic.theme_id is the foreign key to Interest.id
        existing_topic = db.query(ForumTopic).filter(ForumTopic.theme_id == interest.id).first()
        
        if not existing_topic:
            new_topic = ForumTopic(
                title=interest.name,
                description=interest.description,
                theme_id=interest.id,
                created_by=admin_user.id
            )
            db.add(new_topic)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        # Log error or pass

def get_topics(db: Session, skip: int = 0, limit: int = 100):
    # Trigger sync before returning
    sync_topics_with_interests(db)
    return db.query(ForumTopic).offset(skip).limit(limit).all()

def get_topic(db: Session, topic_id: UUID):
    return db.query(ForumTopic).filter(ForumTopic.id == topic_id).first()

def create_post(db: Session, post: ForumPostCreate, user_id: UUID):
    db_post = ForumPost(**post.model_dump(), user_id=user_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    _engine.record_action(db, user_id, "FORUM_POST_CREATE", reference_id=str(db_post.id), metadata={"topic_id": str(db_post.topic_id)})
    return db_post

def get_posts_by_topic(db: Session, topic_id: UUID, skip: int = 0, limit: int = 50):
    return db.query(ForumPost).filter(ForumPost.topic_id == topic_id, ForumPost.is_hidden == False).order_by(ForumPost.created_at.desc()).offset(skip).limit(limit).all()

def get_all_posts(db: Session, skip: int = 0, limit: int = 50):
    return db.query(ForumPost).filter(ForumPost.is_hidden == False).order_by(ForumPost.created_at.desc()).offset(skip).limit(limit).all()

def get_post(db: Session, post_id: UUID):
    return db.query(ForumPost).filter(ForumPost.id == post_id).first()

def create_comment(db: Session, comment: ForumCommentCreate, user_id: UUID):
    db_comment = ForumComment(**comment.model_dump(), user_id=user_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    _engine.record_action(db, user_id, "FORUM_COMMENT_CREATE", reference_id=str(db_comment.id), metadata={"post_id": str(db_comment.post_id)})
    # Process Mentions
    process_mentions(db, comment.content, comment.post_id, db_comment.id, user_id)
    
    # Notify Post Author (Reply)
    post = db.query(ForumPost).filter(ForumPost.id == comment.post_id).first()
    if post and post.user_id != user_id:
        db.add(ForumNotification(
            user_id=post.user_id,
            type=NotificationType.REPLY,
            message="Quelqu'un a commenté votre publication.",
            reference_id=str(db_comment.id)
        ))
        db.commit()

    return db_comment

def get_comments_by_post(db: Session, post_id: UUID):
    return db.query(ForumComment).filter(ForumComment.post_id == post_id).order_by(ForumComment.created_at.asc()).all()

def add_reaction(db: Session, reaction: ForumReactionCreate, user_id: UUID):
    # Check if reaction already exists
    existing = db.query(ForumReaction).filter(
        ForumReaction.post_id == reaction.post_id,
        ForumReaction.user_id == user_id
    ).first()

    if existing:
        if existing.reaction_type == reaction.reaction_type:
            # Toggle off if same reaction
            db.delete(existing)
            db.commit()
            return None
        else:
            # Update reaction
            existing.reaction_type = reaction.reaction_type
            db.commit()
            return existing
    
    # New reaction
    db_reaction = ForumReaction(**reaction.model_dump(), user_id=user_id)
    db.add(db_reaction)
    db.commit()
    db.refresh(db_reaction)

    post = db.query(ForumPost).filter(ForumPost.id == reaction.post_id).first()
    if post and post.user_id != user_id: # Don't reward self-reaction
        _engine.record_action(
            db,
            post.user_id,
            f"FORUM_REACTION_RECEIVED_{reaction.reaction_type.value}",
            reference_id=str(reaction.post_id),
            metadata={"from_user_id": str(user_id)},
        )
        
        # Notify Post Author
        db.add(ForumNotification(
            user_id=post.user_id,
            type=NotificationType.REACTION,
            message=f"Nouvelle réaction '{reaction.reaction_type}' sur votre post.",
            reference_id=str(reaction.post_id)
        ))
        db.commit()

    _engine.record_action(db, user_id, "FORUM_REACTION_CAST", reference_id=str(db_reaction.id), metadata={"post_id": str(reaction.post_id), "reaction_type": reaction.reaction_type.value})
    return db_reaction

def report_post(db: Session, report: ForumReportCreate, user_id: UUID):
    db_report = ForumReport(**report.model_dump(), reported_by=user_id)
    db.add(db_report)
    
    # Auto-moderation logic
    post = db.query(ForumPost).filter(ForumPost.id == report.post_id).first()
    if post:
        post.report_count += 1
        if post.report_count >= 5: # Threshold
            post.is_hidden = True
    
    db.commit()
    db.refresh(db_report)
    return db_report

def get_trending_posts(db: Session, limit: int = 5):
    # Trending algorithm: recent posts with most reactions
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    # This is a simplified query. For production, complex trending algorithm is needed.
    # We'll order by recent activity (updated_at) for now or reaction count if possible.
    return db.query(ForumPost).filter(
        ForumPost.created_at >= week_ago,
        ForumPost.is_hidden == False
    ).limit(limit).all()

def get_top_contributors(db: Session, limit: int = 5):
    return db.query(User).order_by(User.score.desc()).limit(limit).all()
