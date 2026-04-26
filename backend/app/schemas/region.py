from pydantic import BaseModel
from typing import Optional

class RegionBase(BaseModel):
    name: str
    country: str = "Côte d'Ivoire"
    code: str

class RegionCreate(RegionBase):
    pass

class RegionUpdate(RegionBase):
    pass

class Region(RegionBase):
    id: int

    class Config:
        from_attributes = True
