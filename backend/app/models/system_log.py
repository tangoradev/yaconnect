from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String, index=True)
    resource = Column(String, nullable=True)
    status = Column(String, nullable=True)
    details = Column(Text, nullable=True)

    user = relationship("User", backref="logs")
