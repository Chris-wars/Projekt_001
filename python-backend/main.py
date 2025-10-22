from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Optional
import shutil
import os

import auth
import models
import schemas
import crud
import library_api
import legacy_compat_api
from database import engine, get_db
from security import SECRET_KEY, ALGORITHM
from export_service import UserExportService
from auth import get_current_user

# Erstelle die Datenbanktabellen
models.Base.metadata.create_all(bind=engine)

# Erstelle Ordner für Avatare und Exports
AVATAR_DIR = "avatars"
os.makedirs(AVATAR_DIR, exist_ok=True)

# Export Service initialisieren
export_service = UserExportService()

app = FastAPI()

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

app.include_router(auth.router)
app.include_router(library_api.router)  # Bibliotheks-API hinzufügen
app.include_router(legacy_compat_api.router)

@app.get("/")
def read_root():
    return {"message": "Willkommen bei der Indie-Game-Plattform API"}

# Einfache Games API für Frontend
@app.post("/games/", response_model=schemas.Game)
def create_game(
    game: schemas.GameCreate,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Neues Spiel erstellen (nur Entwickler)"""
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

@app.get("/games/", response_model=list[schemas.Game])
def get_games(db: Session = Depends(get_db)):
    """Alle Spiele abrufen"""
    games = db.query(models.Game).all()
    return games

@app.delete("/games/{game_id}")
def delete_game(
    game_id: int,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Spiel löschen (nur eigene Spiele für Entwickler)"""
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

@app.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user

@app.put("/users/me/", response_model=schemas.User)
def update_user_profile(
    user_update: schemas.UserUpdate,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

@app.post("/upload-avatar/", response_model=schemas.User)
async def upload_avatar(
    file: UploadFile = File(...), 
    current_user: schemas.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
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

@app.get("/admin/users/", response_model=list[schemas.User])
def get_all_users(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Alle Nutzer anzeigen - nur für Administratoren
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

@app.put("/admin/users/{user_id}/role", response_model=schemas.User)
def update_user_role(
    user_id: int,
    role_update: schemas.UserUpdate,
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Nutzer-Rolle ändern - nur für Administratoren
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren können Nutzer-Rollen ändern"
        )
    
    # Nur Admin-Status und Entwickler-Status können geändert werden
    user_update = schemas.UserUpdate(
        is_admin=role_update.is_admin,
        is_developer=role_update.is_developer
    )
    
    updated_user = crud.update_user_profile(db, user_id, user_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Benutzer nicht gefunden"
        )
    
    return updated_user

# === USER EXPORT ENDPOINTS ===

@app.post("/admin/export/users/json")
def export_users_json(
    current_user: schemas.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
