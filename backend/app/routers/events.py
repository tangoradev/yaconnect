from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import os
import io

from PIL import Image

from app.database.session import get_db
from app.core import dependencies
from app.models.user import User
from app.schemas.event import Event, EventCreate, EventUpdate, EventRegistration, EventStatus
from app.services import event_service


router = APIRouter()


@router.get("", response_model=List[Event])
def read_events(
    skip: int = 0,
    limit: int = 20,
    region_id: Optional[int] = None,
    status: Optional[EventStatus] = None,
    db: Session = Depends(get_db),
):
    return event_service.list_events(db, skip=skip, limit=limit, region_id=region_id, status=status)


@router.post("", response_model=Event)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    return event_service.create_event(db, event_in, current_user)


@router.get("/{event_id}", response_model=Event)
def read_event(
    event_id: UUID,
    db: Session = Depends(get_db),
):
    e = event_service.get_event(db, event_id)
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    return e


@router.put("/{event_id}", response_model=Event)
def update_event(
    event_id: UUID,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    e = event_service.update_event(db, event_id, event_in, current_user)
    if not e:
        raise HTTPException(status_code=404, detail="Event not found or not allowed")
    return e


@router.post("/{event_id}/register", response_model=EventRegistration)
def register_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    reg = event_service.register(db, event_id, current_user)
    if not reg:
        raise HTTPException(status_code=400, detail="Registration not allowed")
    return reg


@router.post("/{event_id}/cancel", response_model=EventRegistration)
def cancel_event_registration(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    reg = event_service.cancel_registration(db, event_id, current_user)
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    return reg


@router.get("/{event_id}/registration", response_model=Optional[EventRegistration])
def my_event_registration(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    return event_service.get_my_registration(db, event_id, current_user)


@router.post("/{event_id}/upload-banner")
def upload_event_banner(
    event_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    e = event_service.get_event(db, event_id)
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    is_admin = bool(current_user.role and current_user.role.name in ["SuperAdmin", "Admin"])
    if e.created_by != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")

    content_type = (file.content_type or "").lower()
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP are allowed")

    data = file.file.read(10 * 1024 * 1024 + 1)
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    try:
        img = Image.open(io.BytesIO(data))
        fmt = (img.format or "").upper()
        if fmt not in {"JPEG", "PNG", "WEBP"}:
            raise HTTPException(status_code=400, detail="Invalid image format")

        width, height = img.size
        if width > 1600:
            new_h = int(height * (1600 / float(width)))
            img = img.resize((1600, new_h), Image.Resampling.LANCZOS)

        os.makedirs("static/events", exist_ok=True)
        filename = f"{event_id}.webp"
        file_path = os.path.join("static", "events", filename)
        img.save(file_path, "WEBP", quality=80, method=6)
        url = f"/static/events/{filename}"
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Image processing failed")

    updated = event_service.update_event(db, event_id, EventUpdate(banner_url=url), current_user)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to save banner URL")
    return {"banner_url": url}


@router.delete("/{event_id}/banner")
def delete_event_banner(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    e = event_service.get_event(db, event_id)
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    is_admin = bool(current_user.role and current_user.role.name in ["SuperAdmin", "Admin"])
    if e.created_by != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")

    if e.banner_url:
        try:
            filename = os.path.basename(e.banner_url)
            file_path = os.path.join("static", "events", filename)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass

    updated = event_service.update_event(db, event_id, EventUpdate(banner_url=None), current_user)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update event")
    return {"banner_url": None}
