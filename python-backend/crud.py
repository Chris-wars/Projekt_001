from sqlalchemy.orm import Session
import models
import schemas
from security import get_password_hash
from datetime import date

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_developer=user.is_developer,
        is_admin=user.is_admin,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_profile(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None
    
    # Aktualisiere nur die Felder, die übergeben wurden
    if user_update.username is not None:
        db_user.username = user_update.username
    if user_update.email is not None:
        db_user.email = user_update.email
    if user_update.is_developer is not None:
        db_user.is_developer = user_update.is_developer
    # Admin-Status wird NICHT mehr über API geändert - nur direkt in DB
    # if user_update.is_admin is not None:
    #     db_user.is_admin = user_update.is_admin
    if user_update.avatar_url is not None:
        db_user.avatar_url = user_update.avatar_url
    if user_update.birth_year is not None:
        db_user.birth_year = user_update.birth_year
    if user_update.birth_date is not None:
        db_user.birth_date = user_update.birth_date
    
    db.commit()
    db.refresh(db_user)
    return db_user

def get_all_users(db: Session):
    """Alle Nutzer aus der Datenbank abrufen"""
    return db.query(models.User).all()
