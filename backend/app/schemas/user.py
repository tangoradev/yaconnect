from pydantic import BaseModel, EmailStr, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = True
    is_verified: Optional[bool] = False
    community_level: Optional[str] = "Member"
    region_id: Optional[int] = None
    role_id: Optional[int] = None

class UserCreate(UserBase):
    password: str
    interest_ids: Optional[List[int]] = []

class UserUpdate(UserBase):
    password: Optional[str] = None
    email: Optional[EmailStr] = None

class UserInDBBase(UserBase):
    id: UUID4
    score: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str
