"""
Indie Game Platform - Main FastAPI Application

Eine umfassende Plattform für Indie-Spiele mit Benutzerauthentifizierung,
Spielemanagement, Wunschlisten und Export-Funktionalitäten.

Architektur:
- FastAPI Backend mit modularisierten Routern
- SQLite Datenbank mit SQLAlchemy ORM
- JWT-basierte Authentifizierung
- CORS-aktiviert für Frontend-Integration
- Legacy-kompatible API-Endpunkte

Module:
- auth: Benutzerauthentifizierung und -registrierung
- library_api: Spiele-Management und Bibliotheks-Features
- legacy_compat_api: Vereinfachte API für Frontend-Kompatibilität
"""

from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Optional
from datetime import datetime, timedelta
import shutil
import os

import auth
import models
import schemas
import crud
import library_api
import legacy_compat_api
import wishlist_api  # Wunschliste-API hinzufügen
from database import engine, get_db
from security import SECRET_KEY, ALGORITHM, create_access_token, verify_password
from export_service import UserExportService
from auth import get_current_user

# Erstelle die Datenbanktabellen
models.Base.metadata.create_all(bind=engine)

# Erstelle Ordner für Avatare und Exports
AVATAR_DIR = "avatars"
os.makedirs(AVATAR_DIR, exist_ok=True)

# Export Service initialisieren
export_service = UserExportService()

app = FastAPI(
    title="Indie Game Platform API",
    description="Eine umfassende API für eine Indie-Spiele-Plattform mit Benutzerauthentifizierung, Spielemanagement und Export-Funktionalitäten.",
    version="1.0.0",
    contact={
        "name": "Projekt Team",
        "email": "support@indiegameplatform.com",
    },
    license_info={
        "name": "MIT",
    },
)

# Static files für Avatare
app.mount("/avatars", StaticFiles(directory=AVATAR_DIR), name="avatars")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Erlaube alle Origins für Development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Health Check Endpoint für Docker
@app.get("/health", summary="Health Check", tags=["System"])
def health_check():
    """
    Systemstatus prüfen
    
    Einfacher Health Check Endpoint für Container-Monitoring und
    Load Balancer. Überprüft, ob die API grundsätzlich erreichbar ist.
    
    Returns:
        dict: Status-Information der API
    """
    return {
        "status": "healthy",
        "service": "Indie Game Platform API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

app.include_router(auth.router)

# JSON-Login für Frontend (kompatibel mit Legacy)
@app.post("/login-json", summary="JSON Login", tags=["Auth"])
def login_json(credentials: dict, db: Session = Depends(get_db)):
    """
    JSON-basiertes Login für Frontend-Kompatibilität
    
    Args:
        credentials (dict): {"username": str, "password": str}
        db (Session): Datenbank-Session
        
    Returns:
        dict: Token und Benutzerdaten
    """
    username = credentials.get("username")
    password = credentials.get("password")
    
    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username und Password erforderlich"
        )
    
    # Benutzer authentifizieren
    user = crud.get_user_by_username(db, username=username)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültige Anmeldedaten"
        )
    
    # Token erstellen
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_developer": user.is_developer,
            "is_admin": user.is_admin,
            "avatar_url": user.avatar_url
        }
    }
app.include_router(library_api.router)  # Bibliotheks-API hinzufügen
app.include_router(legacy_compat_api.router)
app.include_router(wishlist_api.router)  # Wunschliste-API hinzufügen

@app.get("/", summary="API Root", tags=["General"])
def read_root():
    """
    API Root Endpoint
    
    Gibt eine Willkommensnachricht zurück und bestätigt, dass die API läuft.
    
    Returns:
        dict: Willkommensnachricht der API
    """
    return {"message": "Willkommen bei der Indie-Game-Plattform API"}

# Einfache Games API für Frontend
@app.post("/games/", response_model=schemas.Game, summary="Spiel erstellen", tags=["Games"])
def create_game(
    game: schemas.GameCreate,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Neues Spiel erstellen (nur für Entwickler)
    
    Erstellt ein neues Spiel in der Datenbank. Nur Benutzer mit Entwickler-Rechten
    können Spiele hinzufügen.
    
    Args:
        game (GameCreate): Spiel-Daten für die Erstellung
        current_user (User): Aktuell authentifizierter Benutzer
        db (Session): Datenbank-Session
        
    Returns:
        Game: Das erstellte Spiel mit zugewiesener ID
        
    Raises:
        HTTPException: 403 wenn Benutzer kein Entwickler ist
    """
    if not current_user.is_developer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Entwickler können Spiele hinzufügen"
        )
    
    # Erstelle neues Spiel in der Datenbank
    db_game = models.Game(
        title=game.title,
        description=game.description,
        genre=game.genre,
        platform=game.platform,
        price=float(game.price) if game.price else 0.0,
        is_free=game.is_free,
        download_url=game.download_url,
        image_url=game.image_url,
        developer_id=current_user.id
    )
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    
    return db_game

@app.get("/games/", response_model=list[schemas.Game], summary="Neueste Spiele abrufen", tags=["Games"])
def get_games(db: Session = Depends(get_db)):
    """
    Die 10 neuesten verfügbaren Spiele abrufen
    
    Gibt eine Liste der 10 neuesten Spiele in der Datenbank zurück, sortiert nach
    Erstellungsdatum (neueste zuerst). Diese Funktion benötigt keine Authentifizierung
    und ist öffentlich zugänglich.
    
    Args:
        db (Session): Datenbank-Session
        
    Returns:
        list[Game]: Liste der 10 neuesten verfügbaren Spiele
    """
    games = db.query(models.Game).order_by(models.Game.id.desc()).limit(10).all()
    return games

@app.get("/admin/games/", response_model=list[schemas.Game], summary="Alle Spiele für Admin abrufen", tags=["Admin"])
def get_all_games_admin(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Alle verfügbaren Spiele für Administratoren abrufen
    
    Gibt eine Liste aller Spiele in der Datenbank zurück. Diese Funktion
    ist nur für Administratoren zugänglich.
    
    Args:
        current_user (User): Aktuell authentifizierter Benutzer (muss Admin sein)
        db (Session): Datenbank-Session
        
    Returns:
        list[Game]: Liste aller verfügbaren Spiele
        
    Raises:
        HTTPException: 403 wenn Benutzer kein Administrator ist
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Nur Administratoren können auf alle Spiele zugreifen")
    
    games = db.query(models.Game).all()
    return games

@app.delete("/games/{game_id}", summary="Spiel löschen", tags=["Games"])
def delete_game(
    game_id: int,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Spiel löschen (nur eigene Spiele)
    
    Löscht ein Spiel aus der Datenbank. Entwickler können nur ihre eigenen Spiele
    löschen, Administratoren können alle Spiele löschen.
    
    Args:
        game_id (int): ID des zu löschenden Spiels
        current_user (User): Aktuell authentifizierter Benutzer
        db (Session): Datenbank-Session
        
    Returns:
        dict: Bestätigungsnachricht über erfolgreiche Löschung
        
    Raises:
        HTTPException: 404 wenn Spiel nicht gefunden
        HTTPException: 403 wenn Benutzer nicht berechtigt ist
    """
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spiel nicht gefunden"
        )
    
    # Nur eigene Spiele oder als Admin
    if not current_user.is_admin and game.developer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sie können nur ihre eigenen Spiele löschen"
        )
    
    db.delete(game)
    db.commit()
    return {"message": "Spiel erfolgreich gelöscht"}

@app.put("/games/{game_id}", response_model=schemas.Game, summary="Spiel bearbeiten", tags=["Games"])
def update_game(
    game_id: int,
    game_update: schemas.GameUpdate,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Spiel bearbeiten (Entwickler für eigene Spiele, Admins für alle)
    
    Aktualisiert die Daten eines Spiels in der Datenbank. Entwickler können nur 
    ihre eigenen Spiele bearbeiten, Administratoren können alle Spiele bearbeiten.
    
    Args:
        game_id (int): ID des zu bearbeitenden Spiels
        game_update (GameUpdate): Zu aktualisierende Spiel-Daten
        current_user (User): Aktuell authentifizierter Benutzer
        db (Session): Datenbank-Session
        
    Returns:
        Game: Das aktualisierte Spiel mit neuen Daten
        
    Raises:
        HTTPException: 404 wenn Spiel nicht gefunden
        HTTPException: 403 wenn Benutzer nicht berechtigt ist
    """
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spiel nicht gefunden"
        )
    
    # Nur eigene Spiele oder als Admin
    if not current_user.is_admin and game.developer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sie können nur ihre eigenen Spiele bearbeiten"
        )
    
    # Update nur die Felder, die übermittelt wurden
    update_data = game_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(game, field, value)
    
    db.commit()
    db.refresh(game)
    
    return game

@app.get("/games/{game_id}", response_model=schemas.Game, summary="Einzelnes Spiel abrufen", tags=["Games"])
def get_game_by_id(
    game_id: int,
    db: Session = Depends(get_db)
):
    """
    Einzelnes Spiel nach ID abrufen
    
    Gibt die vollständigen Daten eines spezifischen Spiels zurück.
    
    Args:
        game_id (int): ID des gewünschten Spiels
        db (Session): Datenbank-Session
        
    Returns:
        Game: Vollständige Spiel-Daten
        
    Raises:
        HTTPException: 404 wenn Spiel nicht gefunden
    """
    game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Spiel nicht gefunden"
        )
    return game

# Benutzer-Management API
@app.get("/users/me/", response_model=schemas.User, summary="Eigenes Profil abrufen", tags=["Users"])
def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    """
    Eigenes Benutzerprofil abrufen
    
    Gibt die Profildaten des aktuell authentifizierten Benutzers zurück.
    
    Args:
        current_user (User): Aktuell authentifizierter Benutzer
        
    Returns:
        User: Vollständige Benutzerdaten des aktuellen Benutzers
    """
    # Debug-Logging für Admin-User
    if current_user.username == "Admin":
        print(f"🔧 DEBUG /users/me/ - Admin User:")
        print(f"   ID: {current_user.id}")
        print(f"   Username: {current_user.username}")
        print(f"   is_admin: {current_user.is_admin}")
        print(f"   is_developer: {current_user.is_developer}")
    
    return current_user

@app.put("/users/me/", response_model=schemas.User, summary="Profil aktualisieren", tags=["Users"])
def update_user_profile(
    user_update: schemas.UserUpdate,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Benutzerprofil aktualisieren
    
    Aktualisiert die Profildaten des aktuell authentifizierten Benutzers.
    Prüft auf eindeutige Benutzernamen und E-Mail-Adressen.
    
    Args:
        user_update (UserUpdate): Zu aktualisierende Benutzerdaten
        current_user (User): Aktuell authentifizierter Benutzer
        db (Session): Datenbank-Session
        
    Returns:
        User: Aktualisierte Benutzerdaten
        
    Raises:
        HTTPException: 400 wenn Benutzername oder E-Mail bereits vergeben
        HTTPException: 404 wenn Benutzer nicht gefunden
    """
    # Prüfe, ob der neue Benutzername bereits existiert (falls geändert)
    if user_update.username and user_update.username != current_user.username:
        existing_user = crud.get_user_by_username(db, user_update.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Benutzername bereits vergeben"
            )
    
    # Prüfe, ob die neue E-Mail bereits existiert (falls geändert)
    if user_update.email and user_update.email != current_user.email:
        existing_user = crud.get_user_by_email(db, user_update.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="E-Mail bereits vergeben"
            )
    
    updated_user = crud.update_user_profile(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benutzer nicht gefunden"
        )
    
    return updated_user

# Avatar-Upload API
@app.post("/upload-avatar/", response_model=schemas.User, summary="Avatar hochladen", tags=["Users"])
async def upload_avatar(
    file: UploadFile = File(...), 
    current_user: schemas.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Benutzer-Avatar hochladen
    
    Lädt ein neues Profilbild für den aktuell authentifizierten Benutzer hoch.
    Unterstützt JPG, JPEG und PNG Formate.
    
    Args:
        file (UploadFile): Hochzuladende Bilddatei (JPG, JPEG, PNG)
        current_user (User): Aktuell authentifizierter Benutzer
        db (Session): Datenbank-Session
        
    Returns:
        User: Aktualisierte Benutzerdaten mit neuer Avatar-URL
        
    Raises:
        HTTPException: 400 wenn Dateiformat nicht unterstützt
        HTTPException: 500 bei Upload-Fehlern
    """
    # Dateinamen generieren, um Kollisionen zu vermeiden
    file_extension = file.filename.split(".")[-1]
    if file_extension not in ["jpg", "jpeg", "png"]:
        raise HTTPException(status_code=400, detail="Nur JPG, JPEG und PNG sind erlaubt")
        
    avatar_filename = f"{current_user.id}_{current_user.username}.{file_extension}"
    avatar_path = os.path.join(AVATAR_DIR, avatar_filename)
    
    # Datei speichern
    with open(avatar_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Avatar-URL im User-Modell speichern
    avatar_url = f"/avatars/{avatar_filename}"
    user_update = schemas.UserUpdate(avatar_url=avatar_url)
    updated_user = crud.update_user_profile(db, current_user.id, user_update)
    
    return updated_user

# Admin-API Endpunkte
@app.get("/admin/users/", response_model=list[schemas.User], summary="Alle Benutzer auflisten", tags=["Admin"])
def get_all_users(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Alle registrierten Benutzer auflisten (nur Administratoren)
    
    Gibt eine Liste aller registrierten Benutzer zurück. Diese Funktion
    ist nur für Benutzer mit Administrator-Rechten zugänglich.
    
    Args:
        current_user (User): Aktuell authentifizierter Benutzer
        db (Session): Datenbank-Session
        
    Returns:
        list[User]: Liste aller registrierten Benutzer
        
    Raises:
        HTTPException: 403 wenn Benutzer kein Administrator ist
    """
    # Prüfe, ob der aktuelle Nutzer Admin-Rechte hat
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren haben Zugriff auf die Nutzerliste"
        )
    
    users = crud.get_all_users(db)
    return users

# Entwickler-Endpoint entfernt - nur Administratoren können Benutzer verwalten

@app.put("/admin/users/{user_id}/role", response_model=schemas.User, summary="Entwicklerrolle ändern", tags=["Admin"])
def update_user_role(
    user_id: int,
    role_update: schemas.UserUpdate,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Entwicklerrolle ändern (nur Administratoren)
    
    Ändert nur den Entwickler-Status eines Benutzers. Admin-Rechte können 
    nicht über die API vergeben werden und müssen direkt in der Datenbank 
    geändert werden. Diese Funktion ist nur für Administrator zugänglich.
    
    Args:
        user_id (int): ID des Benutzers, dessen Entwickler-Status geändert werden soll
        role_update (UserUpdate): Neue Rollendaten (nur is_developer wird berücksichtigt)
        current_user (User): Aktuell authentifizierter Benutzer
        db (Session): Datenbank-Session
        
    Returns:
        User: Aktualisierte Benutzerdaten mit neuer Entwicklerrolle
        
    Raises:
        HTTPException: 403 wenn Benutzer kein Administrator ist
        HTTPException: 404 wenn zu ändernder Benutzer nicht gefunden
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren können Nutzer-Rollen ändern"
        )
    
    # Nur Entwickler-Status kann über API geändert werden
    # Admin-Status muss direkt in der Datenbank geändert werden
    user_update = schemas.UserUpdate(
        is_developer=role_update.is_developer
        # is_admin wird NICHT mehr über API geändert
    )
    
    updated_user = crud.update_user_profile(db, user_id, user_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benutzer nicht gefunden"
        )
    
    return updated_user

# Export-API Endpunkte
@app.post("/admin/export/users/json", summary="Benutzer als JSON exportieren", tags=["Export"])
def export_users_json(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Alle Benutzerdaten als JSON exportieren (nur Administratoren)
    
    Erstellt einen JSON-Export aller Benutzerdaten. Diese Funktion
    ist nur für Benutzer mit Administrator-Rechten zugänglich.
    
    Args:
        current_user (User): Aktuell authentifizierter Benutzer
        db (Session): Datenbank-Session
        
    Returns:
        FileResponse: JSON-Datei mit allen Benutzerdaten
        
    Raises:
        HTTPException: 403 wenn Benutzer kein Administrator ist
    """
    """
    Exportiere alle Nutzer als JSON-Datei - nur für Administratoren
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren können Nutzer-Daten exportieren"
        )
    
    try:
        filepath = export_service.export_all_users_json(db)
        return {
            "message": "Export erfolgreich erstellt",
            "filepath": filepath,
            "download_url": f"/admin/export/download/{os.path.basename(filepath)}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Export: {str(e)}"
        )

@app.post("/admin/export/users/csv")
def export_users_csv(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exportiere alle Nutzer als CSV-Datei - nur für Administratoren
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren können Nutzer-Daten exportieren"
        )
    
    try:
        filepath = export_service.export_all_users_csv(db)
        return {
            "message": "CSV-Export erfolgreich erstellt",
            "filepath": filepath,
            "download_url": f"/admin/export/download/{os.path.basename(filepath)}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim CSV-Export: {str(e)}"
        )

@app.post("/admin/export/users/by-role/{role}")
def export_users_by_role(
    role: str,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exportiere Nutzer nach Rolle (admin, developer, user, all) - nur für Administratoren
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren können Nutzer-Daten exportieren"
        )
    
    valid_roles = ["admin", "developer", "user", "all"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ungültige Rolle. Erlaubte Werte: {', '.join(valid_roles)}"
        )
    
    try:
        filepath = export_service.export_users_by_role(db, role)
        return {
            "message": f"Export für Rolle '{role}' erfolgreich erstellt",
            "filepath": filepath,
            "download_url": f"/admin/export/download/{os.path.basename(filepath)}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Rollen-Export: {str(e)}"
        )

@app.post("/admin/export/report/summary")
def create_user_summary_report(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Erstelle einen detaillierten Nutzer-Zusammenfassungsreport - nur für Administratoren
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren können Reports erstellen"
        )
    
    try:
        filepath = export_service.create_user_summary_report(db)
        return {
            "message": "Zusammenfassungsreport erfolgreich erstellt",
            "filepath": filepath,
            "download_url": f"/admin/export/download/{os.path.basename(filepath)}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Report-Export: {str(e)}"
        )

@app.get("/admin/export/list")
def list_exports(
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Liste aller verfügbaren Export-Dateien - nur für Administratoren
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren können Export-Listen einsehen"
        )
    
    try:
        exports = export_service.get_latest_exports()
        return {
            "exports": exports,
            "total_count": len(exports)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Laden der Export-Liste: {str(e)}"
        )

@app.get("/admin/export/download/{filename}")
def download_export_file(
    filename: str,
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Lade eine Export-Datei herunter - nur für Administratoren
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren können Export-Dateien herunterladen"
        )
    
    # Sicherheitscheck: Nur Dateien aus dem exports Ordner
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ungültiger Dateiname"
        )
    
    filepath = os.path.join(export_service.export_dir, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export-Datei nicht gefunden"
        )
    
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type='application/octet-stream'
    )
