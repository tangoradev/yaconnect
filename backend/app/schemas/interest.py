from pydantic import BaseModel
from typing import Optional

class InterestBase(BaseModel):
    name: str
    description: Optional[str] = None

class InterestCreate(InterestBase):
    pass

class InterestUpdate(InterestBase):
    pass

class Interest(InterestBase):
    id: int

    class Config:
        from_attributes = True
