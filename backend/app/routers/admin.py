from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.core import dependencies
from app.models.user import User
from app.models.role import Role
from app.models.region import Region
from app.models.interest import Interest
from app.models.system_log import SystemLog
from app.models.platform_settings import PlatformSettings
from app.models.project import Project, ProjectStatus

from app.schemas.user import User as UserSchema, UserUpdate
from app.schemas.role import Role as RoleSchema, RoleCreate, RoleUpdate
from app.schemas.region import Region as RegionSchema, RegionCreate, RegionUpdate
from app.schemas.interest import Interest as InterestSchema, InterestCreate, InterestUpdate
from app.schemas.system_log import SystemLog as SystemLogSchema
from app.schemas.platform_settings import PlatformSettings as PlatformSettingsSchema, PlatformSettingsUpdate
from app.schemas.project import Project as ProjectSchema, ProjectStatus as ProjectStatusSchema, ProjectUpdate
from app.services import project_service

router = APIRouter()

# --- Users Management ---

@router.get("/users", response_model=List[UserSchema])
def get_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role_id: Optional[int] = None,
    region_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    query = db.query(User)
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) |
            (User.first_name.ilike(f"%{search}%")) |
            (User.last_name.ilike(f"%{search}%"))
        )
    if role_id:
        query = query.filter(User.role_id == role_id)
    if region_id:
        query = query.filter(User.region_id == region_id)
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.put("/users/{user_id}", response_model=UserSchema)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", response_model=UserSchema)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return user

# --- Roles Management ---

@router.get("/roles", response_model=List[RoleSchema])
def get_roles(
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    return db.query(Role).all()

@router.post("/roles", response_model=RoleSchema)
def create_role(
    role_in: RoleCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    role = Role(**role_in.model_dump())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

@router.put("/roles/{role_id}", response_model=RoleSchema)
def update_role(
    role_id: int,
    role_in: RoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    for field, value in role_in.model_dump(exclude_unset=True).items():
        setattr(role, field, value)
        
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

@router.delete("/roles/{role_id}", response_model=RoleSchema)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    db.delete(role)
    db.commit()
    return role

# --- Regions Management ---

@router.get("/regions", response_model=List[RegionSchema])
def get_regions(
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    return db.query(Region).all()

@router.post("/regions", response_model=RegionSchema)
def create_region(
    region_in: RegionCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    region = Region(**region_in.model_dump())
    db.add(region)
    db.commit()
    db.refresh(region)
    return region

@router.put("/regions/{region_id}", response_model=RegionSchema)
def update_region(
    region_id: int,
    region_in: RegionUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    region = db.query(Region).filter(Region.id == region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    
    for field, value in region_in.model_dump(exclude_unset=True).items():
        setattr(region, field, value)
        
    db.add(region)
    db.commit()
    db.refresh(region)
    return region

@router.delete("/regions/{region_id}", response_model=RegionSchema)
def delete_region(
    region_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    region = db.query(Region).filter(Region.id == region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    
    db.delete(region)
    db.commit()
    return region

# --- Interests Management ---

@router.get("/interests", response_model=List[InterestSchema])
def get_interests(
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    return db.query(Interest).all()

@router.post("/interests", response_model=InterestSchema)
def create_interest(
    interest_in: InterestCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    interest = Interest(**interest_in.model_dump())
    db.add(interest)
    db.commit()
    db.refresh(interest)
    return interest

@router.put("/interests/{interest_id}", response_model=InterestSchema)
def update_interest(
    interest_id: int,
    interest_in: InterestUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    interest = db.query(Interest).filter(Interest.id == interest_id).first()
    if not interest:
        raise HTTPException(status_code=404, detail="Interest not found")
    
    for field, value in interest_in.model_dump(exclude_unset=True).items():
        setattr(interest, field, value)
        
    db.add(interest)
    db.commit()
    db.refresh(interest)
    return interest

@router.delete("/interests/{interest_id}", response_model=InterestSchema)
def delete_interest(
    interest_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    interest = db.query(Interest).filter(Interest.id == interest_id).first()
    if not interest:
        raise HTTPException(status_code=404, detail="Interest not found")
    
    db.delete(interest)
    db.commit()
    return interest

# --- Stats ---

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    avg_score = db.query(func.avg(User.score)).scalar() or 0
    
    # Users by Region
    users_by_region = db.query(Region.name, func.count(User.id)).join(User).group_by(Region.name).all()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "average_score": round(avg_score, 2),
        "users_by_region": [{"name": name, "count": count} for name, count in users_by_region]
    }

# --- Logs ---

@router.get("/logs", response_model=List[SystemLogSchema])
def get_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    return db.query(SystemLog).order_by(SystemLog.timestamp.desc()).offset(skip).limit(limit).all()

# --- Settings ---

@router.get("/settings", response_model=PlatformSettingsSchema)
def get_settings(
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    settings = db.query(PlatformSettings).first()
    if not settings:
        # Create default if not exists
        settings = PlatformSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/settings", response_model=PlatformSettingsSchema)
def update_settings(
    settings_in: PlatformSettingsUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    settings = db.query(PlatformSettings).first()
    if not settings:
        settings = PlatformSettings()
        db.add(settings)
    
    for field, value in settings_in.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
        
    db.commit()
    db.refresh(settings)
    return settings


@router.get("/projects", response_model=List[ProjectSchema])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    region_id: Optional[int] = None,
    status_filter: Optional[ProjectStatusSchema] = None,
    sort: str = "recent",
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    projects = project_service.list_projects(db, skip=skip, limit=limit, region_id=region_id, status=status_filter, sort=sort)
    for p in projects:
        project_service.hydrate_project_metrics(db, p)
    return projects


@router.put("/projects/{project_id}/status", response_model=ProjectSchema)
def set_project_status(
    project_id: UUID,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    if project_in.status is None:
        raise HTTPException(status_code=400, detail="status is required")
    project = project_service.update_project(db, project_id, project_in, current_admin)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project_service.get_project(db, project_id)
