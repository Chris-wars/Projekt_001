#!/usr/bin/env python3
"""
Wunschliste API für Indie Game Platform
Verwaltet Benutzer-Wunschlisten mit Spielen
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

# Einfaches Schema für Wunschliste-Spiele
class WishlistGame(BaseModel):
    id: int
    title: str
    genre: Optional[str] = None
    price: Optional[float] = None
    is_free: Optional[bool] = True
    platform: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    download_url: Optional[str] = None
    developer_name: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[WishlistGame])
def get_user_wishlist(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Alle Spiele aus der Wunschliste des aktuellen Benutzers abrufen
    """
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benutzer nicht gefunden"
        )
    
    # Konvertiere zu WishlistGame für bessere Kompatibilität
    wishlist_games = []
    for game in user.wishlist:
        wishlist_games.append(WishlistGame(
            id=game.id,
            title=game.title,
            genre=game.genre,
            price=game.price,
            is_free=game.is_free,
            platform=game.platform,
            description=game.description,
            image_url=game.image_url,
            download_url=game.download_url,
            developer_name=game.developer.username if game.developer else "Unbekannt"
        ))
    
    return wishlist_games

@router.post("/{game_id}")
def add_to_wishlist(
    game_id: int,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Spiel zur Wunschliste hinzufügen
    """
    # Prüfe, ob das Spiel existiert und veröffentlicht ist
    game = db.query(models.Game).filter(
        models.Game.id == game_id,
        models.Game.is_published == True
    ).first()
    
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spiel nicht gefunden oder nicht veröffentlicht"
        )
    
    # Lade den Benutzer mit Wunschliste
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benutzer nicht gefunden"
        )
    
    # Prüfe, ob das Spiel bereits in der Wunschliste ist
    if game in user.wishlist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Spiel ist bereits in der Wunschliste"
        )
    
    # Füge das Spiel zur Wunschliste hinzu
    user.wishlist.append(game)
    db.commit()
    
    return {"message": f"'{game.title}' wurde zur Wunschliste hinzugefügt"}

@router.delete("/{game_id}")
def remove_from_wishlist(
    game_id: int,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Spiel aus der Wunschliste entfernen
    """
    # Lade den Benutzer mit Wunschliste
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benutzer nicht gefunden"
        )
    
    # Prüfe, ob das Spiel in der Wunschliste ist
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spiel nicht gefunden"
        )
    
    if game not in user.wishlist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Spiel ist nicht in der Wunschliste"
        )
    
    # Entferne das Spiel aus der Wunschliste
    user.wishlist.remove(game)
    db.commit()
    
    return {"message": f"'{game.title}' wurde aus der Wunschliste entfernt"}

@router.get("/check/{game_id}")
def check_in_wishlist(
    game_id: int,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Prüfe, ob ein Spiel in der Wunschliste ist
    """
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benutzer nicht gefunden"
        )
    
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spiel nicht gefunden"
        )
    
    is_in_wishlist = game in user.wishlist
    
    return {
        "game_id": game_id,
        "game_title": game.title,
        "in_wishlist": is_in_wishlist
    }

@router.get("/stats")
def get_wishlist_stats(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Statistiken zur Wunschliste des Benutzers
    """
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benutzer nicht gefunden"
        )
    
    wishlist_games = user.wishlist
    total_games = len(wishlist_games)
    free_games = sum(1 for game in wishlist_games if game.is_free)
    paid_games = total_games - free_games
    total_value = sum(game.price for game in wishlist_games if not game.is_free)
    
    return {
        "total_games": total_games,
        "free_games": free_games,
        "paid_games": paid_games,
        "total_value": round(total_value, 2)
    }