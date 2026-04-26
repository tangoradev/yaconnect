from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.region import Region
from app.schemas.region import Region as RegionSchema

router = APIRouter()

@router.get("/", response_model=List[RegionSchema])
def read_regions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> Any:
    regions = db.query(Region).offset(skip).limit(limit).all()
    return regions
