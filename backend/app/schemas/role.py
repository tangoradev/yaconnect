from pydantic import BaseModel
from typing import Optional, Dict, Any

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions_json: Optional[Dict[str, Any]] = {}
    is_system: Optional[bool] = False

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):
    pass

class Role(RoleBase):
    id: int

    class Config:
        from_attributes = True
