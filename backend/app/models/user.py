from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database.base import Base
from app.models.interest import user_interests_table

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    community_level = Column(String, default="Member")
    score = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    role = relationship("Role", back_populates="users")
    region = relationship("Region", back_populates="users")
    interests = relationship("Interest", secondary=user_interests_table, back_populates="users")
