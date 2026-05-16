from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.role import Role
from app.models.region import Region
from app.models.interest import Interest
from app.models.user import User
from app.core.security import get_password_hash
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_roles(db: Session):
    roles = [
        {"name": "SuperAdmin", "description": "Full access to everything", "is_system": True},
        {"name": "Admin", "description": "Administrative access", "is_system": True},
        {"name": "Moderator", "description": "Can moderate content", "is_system": True},
        {"name": "Member", "description": "Regular user", "is_system": True},
    ]
    for role_in in roles:
        role = db.query(Role).filter(Role.name == role_in["name"]).first()
        if not role:
            role = Role(**role_in)
            db.add(role)
    db.commit()
    logger.info("Roles seeded.")

def seed_regions(db: Session):
    regions = [
        {"name": "Abidjan", "code": "ABJ"},
        {"name": "Yamoussoukro", "code": "YAM"},
        {"name": "Bouaké", "code": "BKE"},
        {"name": "San Pedro", "code": "SP"},
        {"name": "Korhogo", "code": "KGO"},
        {"name": "Daloa", "code": "DAL"},
        {"name": "Man", "code": "MAN"},
        {"name": "Bondoukou", "code": "BDK"},
    ]
    for region_in in regions:
        region = db.query(Region).filter(Region.name == region_in["name"]).first()
        if not region:
            region = Region(**region_in)
            db.add(region)
    db.commit()
    logger.info("Regions seeded.")

def seed_interests(db: Session):
    interests = [
        {"name": "Climate", "description": "Climate change and environmental issues"},
        {"name": "Biodiversity", "description": "Protecting biodiversity"},
        {"name": "Peace", "description": "Promoting peace and conflict resolution"},
        {"name": "Social Cohesion", "description": "Building stronger communities"},
    ]
    for interest_in in interests:
        interest = db.query(Interest).filter(Interest.name == interest_in["name"]).first()
        if not interest:
            interest = Interest(**interest_in)
            db.add(interest)
    db.commit()
    logger.info("Interests seeded.")

def seed_superuser(db: Session):
    # Ensure role exists
    role = db.query(Role).filter(Role.name == "SuperAdmin").first()
    if not role:
        return

    user = db.query(User).filter(User.email == "admin@grin17.ci").first()
    if not user:
        user = User(
            email="admin@grin17.ci",
            password_hash=get_password_hash("Admin123!"),
            first_name="Super",
            last_name="Admin",
            role_id=role.id,
            is_active=True,
            is_verified=True,
            community_level="Leader"
        )
        db.add(user)
        db.commit()
        logger.info("Superuser created: admin@grin17.ci / Admin123!")
    else:
        logger.info("Superuser already exists.")

def seed_specific_superuser(db: Session):
    # Ensure role exists
    role = db.query(Role).filter(Role.name == "SuperAdmin").first()
    if not role:
        return

    email = "soungalo.tangora@undp.org"
    user = db.query(User).filter(User.email == email).first()
    
    raw_password = os.getenv("SEED_SPECIFIC_SUPERUSER_PASSWORD")
    if not raw_password:
        raw_password = "Pr@dada10"
    password_hash = get_password_hash(raw_password)

    if not user:
        user = User(
            email=email,
            password_hash=password_hash,
            first_name="Soungalo",
            last_name="Tangora",
            role_id=role.id,
            is_active=True,
            is_verified=True,
            community_level="Leader"
        )
        db.add(user)
        db.commit()
        logger.info(f"Specific Superuser created: {email}")
    else:
        user.password_hash = password_hash
        user.first_name = "Soungalo"
        user.last_name = "Tangora"
        user.role_id = role.id
        db.commit()
        logger.info(f"Specific Superuser {email} updated.")

def main():
    db = SessionLocal()
    try:
        seed_roles(db)
        seed_regions(db)
        seed_interests(db)
        seed_superuser(db)
        seed_specific_superuser(db)
    finally:
        db.close()

if __name__ == "__main__":
    main()
