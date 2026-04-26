from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.core import dependencies
from app.models.gamification import GamificationRule, GamificationLevel, GamificationMission, GamificationBadgeRule
from app.models.forum_extension import ForumBadge
from app.schemas.gamification import (
    GamificationRule as GamificationRuleSchema,
    GamificationRuleUpdate,
    GamificationLevel as GamificationLevelSchema,
    GamificationLevelUpdate,
    Mission as MissionSchema,
    MissionCreate,
    MissionUpdate,
    BadgeRule as BadgeRuleSchema,
    BadgeRuleCreate,
    BadgeRuleUpdate,
)
from app.services import leaderboard_service
from app.services.gamification_presets import reset_ci_presets
from app.services.ambassador_service import detect_ambassadors


router = APIRouter()


@router.get("/rules", response_model=List[GamificationRuleSchema])
def list_rules(
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    return db.query(GamificationRule).order_by(GamificationRule.action_type.asc()).all()


@router.put("/rules/{rule_id}", response_model=GamificationRuleSchema)
def update_rule(
    rule_id: UUID,
    rule_in: GamificationRuleUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    rule = db.query(GamificationRule).filter(GamificationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if rule_in.points is not None:
        rule.points = rule_in.points
    if rule_in.multiplier is not None:
        rule.multiplier = rule_in.multiplier
    if rule_in.is_active is not None:
        rule.is_active = rule_in.is_active
    if rule_in.metadata is not None:
        rule.metadata_ = rule_in.metadata
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/levels", response_model=List[GamificationLevelSchema])
def list_levels(
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    return db.query(GamificationLevel).order_by(GamificationLevel.sort_order.asc()).all()


@router.put("/levels/{level_id}", response_model=GamificationLevelSchema)
def update_level(
    level_id: int,
    level_in: GamificationLevelUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    level = db.query(GamificationLevel).filter(GamificationLevel.id == level_id).first()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    if level_in.name is not None:
        level.name = level_in.name
    if level_in.min_score is not None:
        level.min_score = level_in.min_score
    if level_in.sort_order is not None:
        level.sort_order = level_in.sort_order
    if level_in.is_active is not None:
        level.is_active = level_in.is_active
    db.commit()
    db.refresh(level)
    return level


@router.get("/missions", response_model=List[MissionSchema])
def list_missions(
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    return db.query(GamificationMission).order_by(GamificationMission.created_at.desc()).all()


@router.post("/missions", response_model=MissionSchema)
def create_mission(
    mission_in: MissionCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    m = GamificationMission(**mission_in.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.put("/missions/{mission_id}", response_model=MissionSchema)
def update_mission(
    mission_id: UUID,
    mission_in: MissionUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    m = db.query(GamificationMission).filter(GamificationMission.id == mission_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")
    payload = mission_in.model_dump(exclude_unset=True)
    for k, v in payload.items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return m


@router.post("/leaderboards/refresh")
def refresh_leaderboards(
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    return leaderboard_service.refresh_all(db)


@router.post("/ambassadors/detect")
def run_ambassador_detection(
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    return detect_ambassadors(db)


@router.get("/badge-rules", response_model=List[BadgeRuleSchema])
def list_badge_rules(
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    rows = (
        db.query(GamificationBadgeRule, ForumBadge)
        .join(ForumBadge, ForumBadge.id == GamificationBadgeRule.badge_id)
        .order_by(ForumBadge.name.asc())
        .all()
    )
    out = []
    for r, b in rows:
        out.append(
            {
                "id": r.id,
                "badge_id": r.badge_id,
                "badge_name": b.name,
                "rule_type": r.rule_type,
                "action_type": r.action_type,
                "threshold": r.threshold,
                "metadata": r.metadata_,
                "is_active": r.is_active,
            }
        )
    return out


@router.post("/badge-rules", response_model=BadgeRuleSchema)
def create_badge_rule(
    rule_in: BadgeRuleCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    badge = db.query(ForumBadge).filter(ForumBadge.id == rule_in.badge_id).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    r = GamificationBadgeRule(
        badge_id=rule_in.badge_id,
        rule_type=rule_in.rule_type,
        action_type=rule_in.action_type,
        threshold=rule_in.threshold,
        metadata_=rule_in.metadata or {},
        is_active=rule_in.is_active,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return {
        "id": r.id,
        "badge_id": r.badge_id,
        "badge_name": badge.name,
        "rule_type": r.rule_type,
        "action_type": r.action_type,
        "threshold": r.threshold,
        "metadata": r.metadata_,
        "is_active": r.is_active,
    }


@router.put("/badge-rules/{rule_id}", response_model=BadgeRuleSchema)
def update_badge_rule(
    rule_id: UUID,
    rule_in: BadgeRuleUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    r = db.query(GamificationBadgeRule).filter(GamificationBadgeRule.id == rule_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Badge rule not found")
    payload = rule_in.model_dump(exclude_unset=True)
    if "metadata" in payload:
        r.metadata_ = payload.pop("metadata") or {}
    for k, v in payload.items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    badge = db.query(ForumBadge).filter(ForumBadge.id == r.badge_id).first()
    return {
        "id": r.id,
        "badge_id": r.badge_id,
        "badge_name": badge.name if badge else None,
        "rule_type": r.rule_type,
        "action_type": r.action_type,
        "threshold": r.threshold,
        "metadata": r.metadata_,
        "is_active": r.is_active,
    }


@router.post("/presets/ci/reset")
def reset_presets_ci(
    db: Session = Depends(get_db),
    current_admin=Depends(dependencies.get_current_admin),
):
    return reset_ci_presets(db)
