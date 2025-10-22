from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

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

    # Relationship zu Games (für Entwickler)
    games = relationship("Game", back_populates="developer")

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    genre = Column(String, nullable=True)  # z.B. "Action", "RPG", "Puzzle"
    platform = Column(String, nullable=True)  # z.B. "Windows", "Mac", "Linux"
    price = Column(Float, default=0.0)  # Preis in Euro
    is_free = Column(Boolean, default=True)  # Kostenlos oder kostenpflichtig
    image_url = Column(String, nullable=True)  # URL zum Spiel-Bild
    release_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Entwickler-Beziehung
    developer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    developer = relationship("User", back_populates="games")
    
    # Status und Metadaten
    is_published = Column(Boolean, default=False)  # Veröffentlicht oder Entwurf
    download_url = Column(String, nullable=True)  # Link zum Spiel-Download
    screenshot_urls = Column(String, nullable=True)  # JSON-String mit Screenshot-URLs
    tags = Column(String, nullable=True)  # Komma-getrennte Tags
