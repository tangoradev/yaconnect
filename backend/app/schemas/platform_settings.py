from pydantic import BaseModel
from typing import Optional

class PlatformSettingsBase(BaseModel):
    platform_name: Optional[str] = "GRIN17"
    email_sender: Optional[str] = "noreply@grin17.ci"
    maintenance_mode: Optional[bool] = False
    score_multiplier: Optional[int] = 1
    auto_moderation_enabled: Optional[bool] = True

class PlatformSettingsCreate(PlatformSettingsBase):
    pass

class PlatformSettingsUpdate(PlatformSettingsBase):
    pass

class PlatformSettings(PlatformSettingsBase):
    id: int

    class Config:
        from_attributes = True
