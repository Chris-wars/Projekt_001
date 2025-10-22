#!/usr/bin/env python3
"""
Game Library API Endpoints
Spiele-Bibliothek für Entwickler und Benutzer
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
import game_crud
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/library", tags=["games", "library"])

# ===== HELPER FUNCTIONS =====

def require_developer(current_user: schemas.User = Depends(get_current_user)):
    """Überprüft ob der aktuelle Benutzer Entwickler-Rechte hat"""
    if not current_user.is_developer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Entwickler können Spiele verwalten"
        )
    return current_user

# ===== PUBLIC ENDPOINTS (alle Benutzer) =====

@router.get("/", response_model=List[schemas.GameSummary])
def get_public_games(
    skip: int = Query(0, ge=0, description="Anzahl zu überspringender Einträge"),
    limit: int = Query(50, ge=1, le=100, description="Maximale Anzahl zurückgegebener Einträge"),
    genre: Optional[str] = Query(None, description="Nach Genre filtern"),
    search: Optional[str] = Query(None, description="Suchbegriff für Titel/Beschreibung"),
    db: Session = Depends(get_db)
):
    """
    Öffentliche Spielebibliothek - alle veröffentlichten Spiele
    Verfügbar für alle Benutzer (auch ohne Login)
    """
    
    if search:
        games = game_crud.search_games(db, search, skip, limit)
    elif genre:
        games = game_crud.get_games_by_genre(db, genre, skip, limit)
    else:
        games = game_crud.get_games(db, skip, limit, published_only=True)
    
    # Konvertiere zu GameSummary
    game_summaries = []
    for game in games:
        game_summaries.append(schemas.GameSummary(
            id=game.id,
            title=game.title,
            genre=game.genre,
            usk_rating=game.usk_rating,
            price=game.price,
            developer_name=game.developer.username,
            is_published=game.is_published,
            release_date=game.release_date
        ))
    
    return game_summaries

@router.get("/{game_id}", response_model=schemas.Game)
def get_game_details(
    game_id: int,
    db: Session = Depends(get_db)
):
    """
    Detailansicht eines Spiels
    Verfügbar für alle Benutzer
    """
    
    game = game_crud.get_game_by_id(db, game_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spiel nicht gefunden"
        )
    
    if not game.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spiel ist nicht veröffentlicht"
        )
    
    return game

@router.get("/stats/overview")
def get_library_overview(db: Session = Depends(get_db)):
    """
    Öffentliche Bibliotheksstatistiken
    """
    return game_crud.get_library_stats(db)

# ===== DEVELOPER ENDPOINTS (nur Entwickler) =====

@router.post("/developer/games", response_model=schemas.Game)
def create_new_game(
    game: schemas.GameCreate,
    current_user: schemas.User = Depends(require_developer),
    db: Session = Depends(get_db)
):
    """
    Neues Spiel erstellen (nur Entwickler)
    """
    
    try:
        new_game = game_crud.create_game(db, game, current_user.id)
        return new_game
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/developer/games", response_model=List[schemas.Game])
def get_my_games(
    include_drafts: bool = Query(True, description="Entwürfe einschließen"),
    current_user: schemas.User = Depends(require_developer),
    db: Session = Depends(get_db)
):
    """
    Alle Spiele des aktuellen Entwicklers
    """
    
    games = game_crud.get_games_by_developer(db, current_user.id, include_drafts)
    return games

@router.put("/developer/games/{game_id}", response_model=schemas.Game)
def update_my_game(
    game_id: int,
    game_update: schemas.GameUpdate,
    current_user: schemas.User = Depends(require_developer),
    db: Session = Depends(get_db)
):
    """
    Eigenes Spiel aktualisieren
    """
    
    updated_game = game_crud.update_game(db, game_id, game_update, current_user.id)
    if not updated_game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spiel nicht gefunden oder keine Berechtigung"
        )
    
    return updated_game

@router.post("/developer/games/{game_id}/publish", response_model=schemas.Game)
def publish_my_game(
    game_id: int,
    current_user: schemas.User = Depends(require_developer),
    db: Session = Depends(get_db)
):
    """
    Eigenes Spiel veröffentlichen
    """
    
    try:
        published_game = game_crud.publish_game(db, game_id, current_user.id)
        if not published_game:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Spiel nicht gefunden oder keine Berechtigung"
            )
        return published_game
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/developer/games/{game_id}")
def delete_my_game(
    game_id: int,
    current_user: schemas.User = Depends(require_developer),
    db: Session = Depends(get_db)
):
    """
    Eigenes Spiel löschen
    """
    
    success = game_crud.delete_game(db, game_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spiel nicht gefunden oder keine Berechtigung"
        )
    
    return {"message": "Spiel erfolgreich gelöscht"}

@router.get("/developer/stats")
def get_my_developer_stats(
    current_user: schemas.User = Depends(require_developer),
    db: Session = Depends(get_db)
):
    """
    Statistiken für den aktuellen Entwickler
    """
    
    return game_crud.get_developer_stats(db, current_user.id)

# ===== ADMIN ENDPOINTS (nur Administratoren) =====

@router.get("/admin/all-games", response_model=List[schemas.Game])
def get_all_games_admin(
    include_unpublished: bool = Query(False, description="Unveröffentlichte Spiele einschließen"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Alle Spiele anzeigen (nur Administratoren)
    """
    
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren haben Zugriff"
        )
    
    games = game_crud.get_games(db, skip, limit, published_only=not include_unpublished)
    return games

@router.delete("/admin/games/{game_id}")
def delete_game_admin(
    game_id: int,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Spiel löschen (nur Administratoren)
    """
    
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren können beliebige Spiele löschen"
        )
    
    game = game_crud.get_game_by_id(db, game_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spiel nicht gefunden"
        )
    
    success = game_crud.delete_game(db, game_id, game.developer_id)
    if success:
        return {"message": f"Spiel '{game.title}' erfolgreich gelöscht"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fehler beim Löschen des Spiels"
        )