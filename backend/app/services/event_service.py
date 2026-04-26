from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.event import Event, EventRegistration, EventStatus, EventRegistrationStatus
from app.schemas.event import EventCreate, EventUpdate
from app.models.user import User
from app.services.score_engine import ScoreEngine


_engine = ScoreEngine()


def _hydrate_counts(db: Session, e: Event):
    count = db.query(func.count(EventRegistration.id)).filter(EventRegistration.event_id == e.id).filter(EventRegistration.status != EventRegistrationStatus.CANCELLED).scalar() or 0
    e.registrations_count = int(count)
    if e.capacity is None:
        e.remaining_capacity = None
    else:
        e.remaining_capacity = max(0, int(e.capacity) - int(count))
    return e


def list_events(db: Session, skip: int = 0, limit: int = 20, region_id: Optional[int] = None, status: Optional[EventStatus] = None) -> List[Event]:
    q = db.query(Event)
    if region_id is not None:
        q = q.filter(Event.region_id == region_id)
    if status is not None:
        q = q.filter(Event.status == status)
    events = q.order_by(Event.start_date.asc()).offset(skip).limit(limit).all()
    for e in events:
        _hydrate_counts(db, e)
    return events


def get_event(db: Session, event_id: UUID) -> Optional[Event]:
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        return None
    return _hydrate_counts(db, e)


def create_event(db: Session, event_in: EventCreate, current_user: User) -> Event:
    payload = event_in.model_dump()
    status = payload.get("status") or EventStatus.DRAFT
    payload["status"] = status
    e = Event(**payload, created_by=current_user.id)
    db.add(e)
    db.commit()
    db.refresh(e)
    _engine.record_action(db, current_user.id, "EVENT_CREATE", reference_id=str(e.id), force_points=0)
    return get_event(db, e.id)


def update_event(db: Session, event_id: UUID, event_in: EventUpdate, current_user: User) -> Optional[Event]:
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        return None
    is_admin = bool(current_user.role and current_user.role.name in ["SuperAdmin", "Admin"])
    if e.created_by != current_user.id and not is_admin:
        return None

    for k, v in event_in.model_dump(exclude_unset=True).items():
        setattr(e, k, v)
    db.add(e)
    db.commit()
    db.refresh(e)
    return get_event(db, e.id)


def register(db: Session, event_id: UUID, current_user: User) -> Optional[EventRegistration]:
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        return None
    if e.status != EventStatus.PUBLISHED:
        return None

    reg = db.query(EventRegistration).filter(EventRegistration.event_id == event_id, EventRegistration.user_id == current_user.id).first()
    if reg and reg.status == EventRegistrationStatus.REGISTERED:
        return reg
    if reg and reg.status == EventRegistrationStatus.CANCELLED:
        reg.status = EventRegistrationStatus.REGISTERED
        reg.registered_at = datetime.utcnow()
        db.commit()
        db.refresh(reg)
        _engine.record_action(db, current_user.id, "EVENT_REGISTER", reference_id=str(event_id), force_points=0)
        return reg

    if e.capacity is not None:
        current = db.query(func.count(EventRegistration.id)).filter(EventRegistration.event_id == event_id).filter(EventRegistration.status != EventRegistrationStatus.CANCELLED).scalar() or 0
        if int(current) >= int(e.capacity):
            return None

    reg = EventRegistration(event_id=event_id, user_id=current_user.id, status=EventRegistrationStatus.REGISTERED, registered_at=datetime.utcnow())
    db.add(reg)
    db.commit()
    db.refresh(reg)
    _engine.record_action(db, current_user.id, "EVENT_REGISTER", reference_id=str(event_id), force_points=0)
    return reg


def cancel_registration(db: Session, event_id: UUID, current_user: User) -> Optional[EventRegistration]:
    reg = db.query(EventRegistration).filter(EventRegistration.event_id == event_id, EventRegistration.user_id == current_user.id).first()
    if not reg:
        return None
    reg.status = EventRegistrationStatus.CANCELLED
    db.commit()
    db.refresh(reg)
    _engine.record_action(db, current_user.id, "EVENT_CANCEL", reference_id=str(event_id), force_points=0)
    return reg


def mark_attended(db: Session, event_id: UUID, user_id: UUID, actor: User) -> Optional[EventRegistration]:
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        return None
    is_admin = bool(actor.role and actor.role.name in ["SuperAdmin", "Admin"])
    if e.created_by != actor.id and not is_admin:
        return None

    reg = db.query(EventRegistration).filter(EventRegistration.event_id == event_id, EventRegistration.user_id == user_id).first()
    if not reg:
        reg = EventRegistration(event_id=event_id, user_id=user_id, status=EventRegistrationStatus.ATTENDED, registered_at=datetime.utcnow(), attended_at=datetime.utcnow())
        db.add(reg)
    else:
        reg.status = EventRegistrationStatus.ATTENDED
        reg.attended_at = datetime.utcnow()
    db.commit()
    db.refresh(reg)
    _engine.record_action(db, user_id, "EVENT_ATTEND", reference_id=str(event_id), force_points=0)
    return reg


def get_my_registration(db: Session, event_id: UUID, user: User) -> Optional[EventRegistration]:
    return (
        db.query(EventRegistration)
        .filter(EventRegistration.event_id == event_id, EventRegistration.user_id == user.id)
        .first()
    )


def list_registrations(db: Session, event_id: UUID, status: Optional[EventRegistrationStatus] = None) -> List[Dict[str, Any]]:
    q = (
        db.query(EventRegistration, User)
        .join(User, User.id == EventRegistration.user_id)
        .filter(EventRegistration.event_id == event_id)
    )
    if status is not None:
        q = q.filter(EventRegistration.status == status)
    rows = q.order_by(EventRegistration.registered_at.desc()).all()
    out = []
    for r, u in rows:
        out.append(
            {
                "id": r.id,
                "event_id": r.event_id,
                "user_id": r.user_id,
                "status": r.status,
                "registered_at": r.registered_at,
                "attended_at": r.attended_at,
                "reward_granted_at": r.reward_granted_at,
                "user_first_name": u.first_name,
                "user_last_name": u.last_name,
                "user_email": u.email,
            }
        )
    return out


def grant_reward(db: Session, event_id: UUID, user_id: UUID, actor: User) -> Optional[EventRegistration]:
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        return None
    is_admin = bool(actor.role and actor.role.name in ["SuperAdmin", "Admin"])
    if e.created_by != actor.id and not is_admin:
        return None

    reg = db.query(EventRegistration).filter(EventRegistration.event_id == event_id, EventRegistration.user_id == user_id).first()
    if not reg:
        return None
    if reg.status != EventRegistrationStatus.ATTENDED:
        return None
    if reg.reward_granted_at is None:
        reg.reward_granted_at = datetime.utcnow()
        db.commit()
        db.refresh(reg)
        _engine.record_action(db, user_id, "EVENT_REWARD_GRANTED", reference_id=str(event_id), force_points=0)
    return reg
