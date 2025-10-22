#!/usr/bin/env python3
"""
CRUD Operations für Games/Library System
Verwaltet Spiele-Datenbank und Entwickler-Content
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
import models
import schemas
from datetime import datetime

# ===== GAME CRUD OPERATIONS =====

def get_game_by_id(db: Session, game_id: int) -> Optional[models.Game]:
    """Einzelnes Spiel mit Entwickler-Informationen abrufen"""
    return db.query(models.Game).options(joinedload(models.Game.developer)).filter(models.Game.id == game_id).first()

def get_games(db: Session, skip: int = 0, limit: int = 100, published_only: bool = True) -> List[models.Game]:
    """Liste aller Spiele (mit Pagination)"""
    query = db.query(models.Game).options(joinedload(models.Game.developer))
    
    if published_only:
        query = query.filter(models.Game.is_published == True)
    
    return query.order_by(models.Game.release_date.desc()).offset(skip).limit(limit).all()

def get_games_by_developer(db: Session, developer_id: int, include_drafts: bool = False) -> List[models.Game]:
    """Alle Spiele eines bestimmten Entwicklers"""
    query = db.query(models.Game).options(joinedload(models.Game.developer)).filter(models.Game.developer_id == developer_id)
    
    if not include_drafts:
        query = query.filter(models.Game.is_published == True)
    
    return query.order_by(models.Game.created_at.desc()).all()

def get_games_by_genre(db: Session, genre: str, skip: int = 0, limit: int = 50) -> List[models.Game]:
    """Spiele nach Genre filtern"""
    return db.query(models.Game).options(joinedload(models.Game.developer)).filter(
        models.Game.genre == genre,
        models.Game.is_published == True
    ).order_by(models.Game.release_date.desc()).offset(skip).limit(limit).all()

def search_games(db: Session, search_term: str, skip: int = 0, limit: int = 50) -> List[models.Game]:
    """Spiele nach Titel oder Beschreibung durchsuchen"""
    search_pattern = f"%{search_term}%"
    return db.query(models.Game).options(joinedload(models.Game.developer)).filter(
        (models.Game.title.ilike(search_pattern) | 
         models.Game.description.ilike(search_pattern) |
         models.Game.tags.ilike(search_pattern)),
        models.Game.is_published == True
    ).order_by(models.Game.release_date.desc()).offset(skip).limit(limit).all()

def create_game(db: Session, game: schemas.GameCreate, developer_id: int) -> models.Game:
    """Neues Spiel erstellen (nur für Entwickler)"""
    
    # Prüfe ob Entwickler bereits ein Spiel mit diesem Titel hat
    existing_game = db.query(models.Game).filter(
        models.Game.title == game.title,
        models.Game.developer_id == developer_id
    ).first()
    
    if existing_game:
        raise ValueError(f"Sie haben bereits ein Spiel mit dem Titel '{game.title}'")
    
    db_game = models.Game(
        title=game.title,
        description=game.description,
        genre=game.genre,
        version=game.version,
        price=game.price,
        usk_rating=game.usk_rating,
        download_url=game.download_url,
        tags=game.tags,
        developer_id=developer_id,
        is_published=False,  # Standardmäßig als Entwurf
        release_date=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    
    # Lade das Spiel mit Entwickler-Informationen neu
    return get_game_by_id(db, db_game.id)

def update_game(db: Session, game_id: int, game_update: schemas.GameUpdate, developer_id: int) -> Optional[models.Game]:
    """Spiel aktualisieren (nur eigene Spiele)"""
    
    db_game = db.query(models.Game).filter(
        models.Game.id == game_id,
        models.Game.developer_id == developer_id
    ).first()
    
    if not db_game:
        return None
    
    # Update-Daten anwenden
    update_data = game_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_game, field, value)
    
    db_game.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_game)
    
    return get_game_by_id(db, db_game.id)

def publish_game(db: Session, game_id: int, developer_id: int) -> Optional[models.Game]:
    """Spiel veröffentlichen"""
    
    db_game = db.query(models.Game).filter(
        models.Game.id == game_id,
        models.Game.developer_id == developer_id
    ).first()
    
    if not db_game:
        return None
    
    # Validierung vor Veröffentlichung
    if not db_game.title or len(db_game.title.strip()) < 3:
        raise ValueError("Titel muss mindestens 3 Zeichen lang sein")
    
    if not db_game.description or len(db_game.description.strip()) < 10:
        raise ValueError("Beschreibung muss mindestens 10 Zeichen lang sein")
    
    db_game.is_published = True
    db_game.release_date = datetime.utcnow()
    db_game.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_game)
    
    return get_game_by_id(db, db_game.id)

def delete_game(db: Session, game_id: int, developer_id: int) -> bool:
    """Spiel löschen (nur eigene Spiele)"""
    
    db_game = db.query(models.Game).filter(
        models.Game.id == game_id,
        models.Game.developer_id == developer_id
    ).first()
    
    if not db_game:
        return False
    
    db.delete(db_game)
    db.commit()
    
    return True

# ===== STATISTICS AND ANALYTICS =====

def get_library_stats(db: Session) -> dict:
    """Statistiken der Spielebibliothek"""
    
    total_games = db.query(models.Game).filter(models.Game.is_published == True).count()
    total_developers = db.query(models.User).filter(models.User.is_developer == True).count()
    
    # Genre-Verteilung
    genre_stats = db.query(models.Game.genre, func.count(models.Game.id)).filter(
        models.Game.is_published == True,
        models.Game.genre.isnot(None)
    ).group_by(models.Game.genre).all()
    
    # USK-Verteilung
    usk_stats = db.query(models.Game.usk_rating, func.count(models.Game.id)).filter(
        models.Game.is_published == True
    ).group_by(models.Game.usk_rating).all()
    
    return {
        "total_published_games": total_games,
        "total_developers": total_developers,
        "genre_distribution": dict(genre_stats),
        "usk_distribution": dict(usk_stats)
    }

def get_developer_stats(db: Session, developer_id: int) -> dict:
    """Statistiken für einen bestimmten Entwickler"""
    
    published_games = db.query(models.Game).filter(
        models.Game.developer_id == developer_id,
        models.Game.is_published == True
    ).count()
    
    draft_games = db.query(models.Game).filter(
        models.Game.developer_id == developer_id,
        models.Game.is_published == False
    ).count()
    
    return {
        "published_games": published_games,
        "draft_games": draft_games,
        "total_games": published_games + draft_games
    }