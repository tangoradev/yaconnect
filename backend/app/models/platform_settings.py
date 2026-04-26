from sqlalchemy import Column, Integer, String, Boolean
from app.database.base import Base

class PlatformSettings(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    platform_name = Column(String, default="GRIN17")
    email_sender = Column(String, default="noreply@grin17.ci")
    maintenance_mode = Column(Boolean, default=False)
    score_multiplier = Column(Integer, default=1)
    auto_moderation_enabled = Column(Boolean, default=True)
