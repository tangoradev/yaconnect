from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class SystemLogBase(BaseModel):
    action: str
    resource: Optional[str] = None
    status: Optional[str] = None
    details: Optional[str] = None

class SystemLogCreate(SystemLogBase):
    user_id: Optional[UUID] = None

class SystemLog(SystemLogBase):
    id: int
    timestamp: datetime
    user_id: Optional[UUID] = None

    class Config:
        from_attributes = True
