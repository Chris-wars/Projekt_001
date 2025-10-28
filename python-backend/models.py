from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Text, ForeignKey, Float, Table
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# Association Table für Wunschliste (Many-to-Many zwischen User und Game)
wishlist_table = Table(
    'wishlist',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('game_id', Integer, ForeignKey('games.id'), primary_key=True),
    Column('added_at', DateTime, default=datetime.utcnow)
)

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
    
    # Wunschliste-Beziehung (Many-to-Many)
    wishlist = relationship("Game", secondary=wishlist_table, back_populates="wishlisted_by")

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
    
    # Wunschliste-Beziehung (Many-to-Many)
    wishlisted_by = relationship("User", secondary=wishlist_table, back_populates="wishlist")
    
    # Status und Metadaten
    is_published = Column(Boolean, default=False)  # Veröffentlicht oder Entwurf
    download_url = Column(String, nullable=True)  # Link zum Spiel-Download
    screenshot_urls = Column(String, nullable=True)  # JSON-String mit Screenshot-URLs
    tags = Column(String, nullable=True)  # Komma-getrennte Tags
