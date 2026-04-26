from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime
from enum import Enum


class EventStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class EventRegistrationStatus(str, Enum):
    REGISTERED = "REGISTERED"
    CANCELLED = "CANCELLED"
    ATTENDED = "ATTENDED"


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[UUID4] = None
    region_id: Optional[int] = None
    location: Optional[str] = None
    start_date: datetime
    end_date: datetime
    capacity: Optional[int] = None
    status: Optional[EventStatus] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[UUID4] = None
    region_id: Optional[int] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    capacity: Optional[int] = None
    status: Optional[EventStatus] = None
    banner_url: Optional[str] = None


class Event(EventBase):
    id: UUID4
    banner_url: Optional[str] = None
    created_by: UUID4
    status: EventStatus
    created_at: datetime
    updated_at: datetime
    registrations_count: int = 0
    remaining_capacity: Optional[int] = None

    class Config:
        from_attributes = True


class EventRegistration(BaseModel):
    id: UUID4
    event_id: UUID4
    user_id: UUID4
    status: EventRegistrationStatus
    registered_at: datetime
    attended_at: Optional[datetime] = None
    reward_granted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EventRegistrationCreate(BaseModel):
    pass


class EventRegistrationAdmin(EventRegistration):
    user_first_name: Optional[str] = None
    user_last_name: Optional[str] = None
    user_email: Optional[str] = None
