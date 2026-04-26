from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database.session import get_db
from app.core import dependencies
from app.models.user import User
from app.schemas.event import Event, EventCreate, EventUpdate, EventRegistration, EventRegistrationAdmin, EventRegistrationStatus
from app.services import event_service


router = APIRouter()


@router.get("/events", response_model=List[Event])
def admin_list_events(
    skip: int = 0,
    limit: int = 100,
    region_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
):
    return event_service.list_events(db, skip=skip, limit=limit, region_id=region_id, status=None)


@router.post("/events", response_model=Event)
def admin_create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
):
    return event_service.create_event(db, event_in, current_admin)


@router.put("/events/{event_id}", response_model=Event)
def admin_update_event(
    event_id: UUID,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
):
    e = event_service.update_event(db, event_id, event_in, current_admin)
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    return e


@router.post("/events/{event_id}/attendance/{user_id}", response_model=EventRegistration)
def admin_mark_attendance(
    event_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
):
    reg = event_service.mark_attended(db, event_id, user_id, current_admin)
    if not reg:
        raise HTTPException(status_code=404, detail="Event not found or not allowed")
    return reg


@router.get("/events/{event_id}/registrations", response_model=List[EventRegistrationAdmin])
def admin_list_registrations(
    event_id: UUID,
    status: Optional[EventRegistrationStatus] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
):
    return event_service.list_registrations(db, event_id, status=status)


@router.post("/events/{event_id}/reward/{user_id}", response_model=EventRegistration)
def admin_grant_reward(
    event_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
):
    reg = event_service.grant_reward(db, event_id, user_id, current_admin)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found or not eligible")
    return reg
