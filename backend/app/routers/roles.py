from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.role import Role
from app.schemas.role import Role as RoleSchema

router = APIRouter()

@router.get("/", response_model=List[RoleSchema])
def read_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> Any:
    roles = db.query(Role).offset(skip).limit(limit).all()
    return roles
