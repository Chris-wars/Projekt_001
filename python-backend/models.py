from sqlalchemy import Column, Integer, String, Boolean, Date
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_developer = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    avatar_url = Column(String, nullable=True)
    birth_year = Column(Integer, nullable=True)  # Geburtsjahr für USK-Altersverifikation (deprecated)
    birth_date = Column(Date, nullable=True)  # Vollständiges Geburtsdatum für präzise USK-Altersverifikation
