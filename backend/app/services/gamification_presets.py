from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.gamification import GamificationRule, GamificationLevel, GamificationMission, GamificationBadgeRule
from app.models.forum_extension import ForumBadge


def reset_ci_presets(db: Session):
    levels = [
        {"id": 1, "name": "Explorer", "min_score": 0, "sort_order": 1, "is_active": True},
        {"id": 2, "name": "Actor", "min_score": 50, "sort_order": 2, "is_active": True},
        {"id": 3, "name": "Leader", "min_score": 200, "sort_order": 3, "is_active": True},
        {"id": 4, "name": "Ambassador", "min_score": 500, "sort_order": 4, "is_active": True},
    ]
    for l in levels:
        existing = db.query(GamificationLevel).filter(GamificationLevel.id == l["id"]).first()
        if existing:
            existing.name = l["name"]
            existing.min_score = l["min_score"]
            existing.sort_order = l["sort_order"]
            existing.is_active = l["is_active"]
        else:
            db.add(GamificationLevel(**l))

    rules = [
        ("FORUM_POST_CREATE", 5, 1.0, True, {}),
        ("FORUM_COMMENT_CREATE", 3, 1.0, True, {}),
        ("FORUM_REACTION_RECEIVED_PERTINENT", 2, 1.0, True, {}),
        ("FORUM_REACTION_RECEIVED_INNOVATIVE", 4, 1.0, True, {}),
        ("FORUM_REACTION_RECEIVED_ENVIRONMENTAL_IMPACT", 6, 1.0, True, {}),
        ("FORUM_REACTION_RECEIVED_SOLIDARITY", 3, 1.0, True, {}),
        ("FORUM_REACTION_RECEIVED_INSPIRING", 4, 1.0, True, {}),
        ("FORUM_REACTION_CAST", 0, 1.0, True, {}),
        ("PROJECT_SUBMIT", 10, 1.0, True, {}),
        ("PROJECT_RECOMMENDED", 25, 1.0, True, {}),
        ("PROJECT_COMMENT_CREATE", 2, 1.0, True, {}),
        ("PROJECT_VOTE_CAST", 1, 1.0, True, {}),
        ("PROJECT_VOTE_SUPPORT", 1, 1.0, True, {}),
        ("PROJECT_VOTE_TOGGLE_OFF", -1, 1.0, True, {}),
        ("MISSION_COMPLETED", 0, 1.0, True, {}),
        ("MULTIPLIER_NEW_USER", 0, 1.2, True, {"days": 7}),
        ("MULTIPLIER_REGION_ACTIVITY", 0, 1.1, True, {"top_regions": 2}),
        ("MULTIPLIER_WEEKLY_CHALLENGE", 0, 1.15, True, {"enabled": True}),
        ("WEEKLY_RESET_STRICT", 0, 1.0, True, {"enabled": True}),
    ]

    for action_type, points, mult, active, meta in rules:
        r = db.query(GamificationRule).filter(GamificationRule.action_type == action_type).first()
        if r:
            r.points = int(points)
            r.multiplier = float(mult)
            r.is_active = bool(active)
            r.metadata_ = meta
            r.updated_at = datetime.utcnow()
        else:
            db.add(
                GamificationRule(
                    id=uuid4(),
                    action_type=action_type,
                    points=int(points),
                    multiplier=float(mult),
                    is_active=bool(active),
                    metadata_=meta,
                    updated_at=datetime.utcnow(),
                )
            )

    missions = [
        {
            "code": "CI_WEEKLY_POST_3",
            "title": "Publier 3 discussions",
            "description": "Publiez 3 posts sur le forum cette semaine",
            "requirements": {"actions": [{"action_type": "FORUM_POST_CREATE", "count": 3}]},
            "reward_points": 15,
            "is_active": True,
        },
        {
            "code": "CI_WEEKLY_COMMENT_5",
            "title": "Commenter 5 fois",
            "description": "Ajoutez 5 commentaires sur le forum cette semaine",
            "requirements": {"actions": [{"action_type": "FORUM_COMMENT_CREATE", "count": 5}]},
            "reward_points": 12,
            "is_active": True,
        },
        {
            "code": "CI_WEEKLY_SUPPORT_2",
            "title": "Soutenir 2 projets",
            "description": "Votez SUPPORT sur 2 projets",
            "requirements": {"actions": [{"action_type": "PROJECT_VOTE_SUPPORT", "count": 2}]},
            "reward_points": 10,
            "is_active": True,
        },
    ]
    for m in missions:
        existing = db.query(GamificationMission).filter(GamificationMission.code == m["code"]).first()
        if existing:
            existing.title = m["title"]
            existing.description = m["description"]
            existing.requirements = m["requirements"]
            existing.reward_points = m["reward_points"]
            existing.is_active = m["is_active"]
        else:
            db.add(GamificationMission(**m, created_at=datetime.utcnow()))

    badges = [
        ("First Post", "Publier votre première discussion sur le forum", "📝"),
        ("First 100 Points", "Atteindre 100 points", "💯"),
        ("Project Recommended", "Avoir un projet recommandé par la communauté", "⭐"),
        ("Ambassador", "Faire partie des ambassadeurs GRIN17", "🏆"),
        ("Top Contributor Weekly", "Top contributeur de la semaine", "🥇"),
    ]
    badge_by_name = {}
    for name, desc, icon in badges:
        b = db.query(ForumBadge).filter(ForumBadge.name == name).first()
        if b:
            b.description = desc
            b.icon = icon
        else:
            b = ForumBadge(name=name, description=desc, icon=icon)
            db.add(b)
            db.flush()
        badge_by_name[name] = b

    badge_rules = [
        ("First Post", "FIRST_ACTION", "FORUM_POST_CREATE", None, {}),
        ("First 100 Points", "SCORE_THRESHOLD", None, 100, {}),
        ("Project Recommended", "ON_ACTION", "PROJECT_RECOMMENDED", None, {}),
        ("Ambassador", "LEVEL_REACHED", None, None, {"level": "Ambassador"}),
        ("Top Contributor Weekly", "WEEKLY_TOP", None, None, {"leaderboard": "contributors", "period": "weekly", "rank_max": 1}),
    ]

    for badge_name, rule_type, action_type, threshold, meta in badge_rules:
        badge_id = badge_by_name[badge_name].id
        existing = db.query(GamificationBadgeRule).filter(GamificationBadgeRule.badge_id == badge_id, GamificationBadgeRule.rule_type == rule_type).first()
        if existing:
            existing.action_type = action_type
            existing.threshold = threshold
            existing.metadata_ = meta
            existing.is_active = True
        else:
            db.add(
                GamificationBadgeRule(
                    id=uuid4(),
                    badge_id=badge_id,
                    rule_type=rule_type,
                    action_type=action_type,
                    threshold=threshold,
                    metadata_=meta,
                    is_active=True,
                )
            )

    db.commit()
    return {
        "levels": len(levels),
        "rules": len(rules),
        "missions": len(missions),
        "badges": len(badges),
        "badge_rules": len(badge_rules),
    }

