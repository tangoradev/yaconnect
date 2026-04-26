from sqlalchemy.orm import Session
from app.schemas.user import UserCreate
from app.models.user import User
from app.models.interest import Interest
from app.repositories import user_repo
from app.core import security
from fastapi import HTTPException, status
from typing import Optional

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = user_repo.get_user_by_email(db, email=email)
    if not user:
        return None
    if not security.verify_password(password, user.password_hash):
        return None
    return user

def register_new_user(db: Session, user_in: UserCreate) -> User:
    user = user_repo.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    hashed_password = security.get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        password_hash=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone=user_in.phone,
        region_id=user_in.region_id,
        role_id=user_in.role_id,
        is_active=True,
    )
    
    if user_in.interest_ids:
        interests = db.query(Interest).filter(Interest.id.in_(user_in.interest_ids)).all()
        db_user.interests = interests

    return user_repo.create_user(db, db_user)
