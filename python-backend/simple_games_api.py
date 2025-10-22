from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import sqlite3
import json

# FastAPI App
app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models für Games
class GameCreate(BaseModel):
    title: str
    description: Optional[str] = None
    genre: Optional[str] = None
    platform: Optional[str] = "Windows"
    price: Optional[float] = 0.0
    is_free: bool = True
    download_url: Optional[str] = None
    image_url: Optional[str] = None

class GameResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    genre: Optional[str] = None
    platform: Optional[str] = None
    price: Optional[float] = 0.0
    is_free: bool = True
    download_url: Optional[str] = None
    image_url: Optional[str] = None
    developer_id: int

class UserLogin(BaseModel):
    username: str
    password: str

# Einfache Token-Verifikation
def get_current_user_from_token(token: str):
    """Vereinfachte Token-Verifikation - für Entwicklung"""
    # Für jetzt nehmen wir an, dass test_entwicker (ID 5) der Benutzer ist
    return {"id": 5, "username": "test_entwicker", "is_developer": True}

@app.get("/")
def read_root():
    return {"message": "Spiele-API läuft!"}

@app.post("/games/", response_model=GameResponse)
def create_game(game: GameCreate):
    """Neues Spiel erstellen (ohne Authentifizierung für Tests)"""
    try:
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        
        # Einfache Insertion
        cursor.execute("""
            INSERT INTO games (title, description, genre, platform, price, is_free, download_url, image_url, developer_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            game.title,
            game.description,
            game.genre,
            game.platform,
            game.price,
            game.is_free,
            game.download_url,
            game.image_url,
            5  # test_entwicker ID
        ))
        
        game_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Returniere das erstellte Spiel
        return GameResponse(
            id=game_id,
            title=game.title,
            description=game.description,
            genre=game.genre,
            platform=game.platform,
            price=game.price,
            is_free=game.is_free,
            download_url=game.download_url,
            image_url=game.image_url,
            developer_id=5
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Erstellen: {str(e)}")

# User-Endpoints
@app.post("/login")
def login_user(credentials: UserLogin):
    """Benutzer anmelden"""
    try:
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE username = ?", (credentials.username,))
        user = cursor.fetchone()
        conn.close()
        
        if not user or user[3] != credentials.password:  # user[3] ist password
            raise HTTPException(status_code=401, detail="Ungültige Anmeldedaten")
        
        # Einfacher Token (in Produktion würde man JWT verwenden)
        token = f"token_{user[1]}_{user[0]}"  # username_id
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user[0],
                "username": user[1],
                "email": user[2],
                "role": user[5] if len(user) > 5 else "user",
                "is_developer": user[6] if len(user) > 6 else False,
                "is_admin": user[7] if len(user) > 7 else False
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login-Fehler: {str(e)}")

@app.get("/users/me/")
def get_current_user(authorization: str = Header(None)):
    """Aktuell angemeldeten Benutzer abrufen"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token fehlt")
    
    token = authorization.replace("Bearer ", "")
    
    # Einfache Token-Validierung
    if not token.startswith("token_"):
        raise HTTPException(status_code=401, detail="Ungültiger Token")
    
    try:
        # Token format: token_username_id
        parts = token.split("_")
        if len(parts) < 3:
            raise HTTPException(status_code=401, detail="Ungültiger Token")
        
        user_id = int(parts[-1])
        
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            raise HTTPException(status_code=401, detail="Benutzer nicht gefunden")
        
        return {
            "id": user[0],
            "username": user[1],
            "email": user[2],
            "role": user[5] if len(user) > 5 else "user",
            "is_developer": user[6] if len(user) > 6 else False,
            "is_admin": user[7] if len(user) > 7 else False
        }
    except ValueError:
        raise HTTPException(status_code=401, detail="Ungültiger Token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Abrufen der Benutzerdaten: {str(e)}")

@app.get("/games/")
def get_games():
    """Alle Spiele abrufen"""
    try:
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT g.id, g.title, g.description, g.genre, g.platform, g.price, g.is_free, 
                   g.download_url, g.image_url, g.developer_id, u.username
            FROM games g
            LEFT JOIN users u ON g.developer_id = u.id
        """)
        
        games = []
        for row in cursor.fetchall():
            games.append({
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "genre": row[3],
                "platform": row[4],
                "price": row[5],
                "is_free": bool(row[6]),
                "download_url": row[7],
                "image_url": row[8],
                "developer_id": row[9],
                "developer": {"username": row[10]} if row[10] else None
            })
        
        conn.close()
        return games
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Laden: {str(e)}")

@app.delete("/games/{game_id}")
def delete_game(game_id: int):
    """Spiel löschen"""
    try:
        conn = sqlite3.connect('test.db')
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM games WHERE id = ?", (game_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Spiel nicht gefunden")
        
        conn.commit()
        conn.close()
        
        return {"message": "Spiel erfolgreich gelöscht"}
        
    except Exception as e:
        if "nicht gefunden" in str(e):
            raise e
        raise HTTPException(status_code=500, detail=f"Fehler beim Löschen: {str(e)}")

# User-Endpoints hinzufügen
@app.get("/users/me/")
def get_current_user():
    """Aktuellen Benutzer abrufen (vereinfacht für Tests)"""
    # Für Tests nehmen wir an, dass test_entwickler eingeloggt ist
    return {
        "id": 5,
        "username": "test_entwicker", 
        "email": "test@example.com",
        "is_developer": True,
        "is_admin": False,
        "birth_date": "1990-01-01",
        "avatar_url": None
    }

# Importiere auth für Login (vereinfacht)
try:
    import auth
    app.include_router(auth.router)
except ImportError:
    pass  # Falls auth nicht verfügbar ist

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)