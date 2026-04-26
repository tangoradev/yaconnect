from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.forum_extension import ForumBadge, UserBadge, NotificationType
from app.models.user import User
from app.models.forum import ForumPost, ForumComment, ForumReaction
from app.services import notification_service
from app.schemas.forum_extension import ForumNotificationCreate
from uuid import UUID
from typing import List

# --- Constants ---
BADGE_FIRST_POST = "First Post"
BADGE_FIRST_100_POINTS = "First 100 Points"
BADGE_TOP_INNOVATOR = "Top Innovator"
BADGE_ENVIRONMENTAL_CHAMPION = "Environmental Champion"
BADGE_COMMUNITY_LEADER = "Community Leader"
BADGE_AMBASSADOR = "Ambassador"

def init_badges(db: Session):
    badges = [
        {"name": BADGE_FIRST_POST, "description": "Created your first post", "points_required": 5},
        {"name": BADGE_FIRST_100_POINTS, "description": "Earned 100 points", "points_required": 100},
        {"name": BADGE_TOP_INNOVATOR, "description": "Received 50 'Innovative' reactions", "points_required": 0},
        {"name": BADGE_ENVIRONMENTAL_CHAMPION, "description": "Received 50 'Environmental Impact' reactions", "points_required": 0},
        {"name": BADGE_COMMUNITY_LEADER, "description": "Top 1% contributor", "points_required": 1000},
        {"name": BADGE_AMBASSADOR, "description": "Official GRIN17 Ambassador", "points_required": 0},
    ]
    
    for badge_data in badges:
        existing = db.query(ForumBadge).filter(ForumBadge.name == badge_data["name"]).first()
        if not existing:
            db.add(ForumBadge(**badge_data))
    db.commit()

def award_badge(db: Session, user_id: UUID, badge_name: str):
    badge = db.query(ForumBadge).filter(ForumBadge.name == badge_name).first()
    if not badge:
        return # Badge not defined
        
    # Check if user already has it
    existing = db.query(UserBadge).filter(UserBadge.user_id == user_id, UserBadge.badge_id == badge.id).first()
    if existing:
        return # Already has badge
        
    # Award badge
    user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
    db.add(user_badge)
    db.commit()
    
    # Notify user
    notification_service.create_notification(db, ForumNotificationCreate(
        user_id=user_id,
        type=NotificationType.BADGE,
        message=f"Félicitations ! Vous avez obtenu le badge : {badge.name}",
        reference_id=str(badge.id)
    ))

def check_badges(db: Session, user_id: UUID):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return

    # Check Points
    if user.score >= 100:
        award_badge(db, user_id, BADGE_FIRST_100_POINTS)
        
    # Check First Post
    post_count = db.query(ForumPost).filter(ForumPost.user_id == user_id).count()
    if post_count >= 1:
        award_badge(db, user_id, BADGE_FIRST_POST)
        
    # Check Ambassador (Simplified logic for immediate check, usually batch)
    if user.community_level == "Ambassador":
        award_badge(db, user_id, BADGE_AMBASSADOR)

def get_user_badges(db: Session, user_id: UUID):
    return db.query(UserBadge).filter(UserBadge.user_id == user_id).all()

def get_leaderboard(db: Session, limit: int = 10):
    # This is a basic leaderboard. Ideally, we should join with UserBadge count.
    users = db.query(User).order_by(User.score.desc()).limit(limit).all()
    # We might want to enrich this with badge counts
    return users

def update_ambassadors(db: Session):
    # Top 3% logic
    total_users = db.query(User).count()
    if total_users < 10:
        return # Too few users
        
    limit = max(1, int(total_users * 0.03))
    
    top_users = db.query(User).order_by(User.score.desc()).limit(limit).all()
    
    for user in top_users:
        if user.community_level != "Ambassador":
            user.community_level = "Ambassador"
            award_badge(db, user.id, BADGE_AMBASSADOR)
            # Notify
            notification_service.create_notification(db, ForumNotificationCreate(
                user_id=user.id,
                type=NotificationType.LEVEL_UP,
                message="Vous êtes maintenant un Ambassadeur GRIN17 !",
                reference_id="ambassador"
            ))
            
    db.commit()
