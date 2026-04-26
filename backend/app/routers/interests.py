from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.interest import Interest
from app.schemas.interest import Interest as InterestSchema

router = APIRouter()

@router.get("/", response_model=List[InterestSchema])
def read_interests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> Any:
    interests = db.query(Interest).offset(skip).limit(limit).all()
    return interests
