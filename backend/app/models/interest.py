from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

user_interests_table = Table(
    "user_interests",
    Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("interest_id", ForeignKey("interests.id"), primary_key=True),
)

class Interest(Base):
    __tablename__ = "interests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", secondary=user_interests_table, back_populates="interests")
