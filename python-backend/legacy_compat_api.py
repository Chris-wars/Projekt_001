from fastapi import APIRouter, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sqlite3

router = APIRouter()

class GameCreate(BaseModel):
    title: str
    description: Optional[str] = None
    genre: Optional[str] = None
    platform: Optional[str] = "Windows"
    price: Optional[float] = 0.0
    is_free: bool = True
    download_url: Optional[str] = None
    image_url: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str


def _get_conn():
    # Use the project's sqlite DB if present, otherwise fallback to test.db
    try:
        return sqlite3.connect('test.db')
    except Exception:
        return sqlite3.connect('test.db')


@router.get('/')
def root():
    return {"message": "Legacy compatibility API running"}


@router.post('/games/')
def create_game(game: GameCreate):
    try:
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO games (title, description, genre, platform, price, is_free, download_url, image_url, developer_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            game.title,
            game.description,
            game.genre,
            game.platform,
            game.price,
            int(game.is_free),
            game.download_url,
            game.image_url,
            5
        ))
        game_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return {"id": game_id, "title": game.title, "description": game.description, "genre": game.genre, "platform": game.platform, "price": str(game.price), "is_free": game.is_free, "download_url": game.download_url, "image_url": game.image_url, "developer_id": 5}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/games/')
def get_games():
    try:
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT g.id, g.title, g.description, g.genre, g.platform, g.price, g.is_free,
                   g.download_url, g.image_url, g.developer_id, u.username
            FROM games g
            LEFT JOIN users u ON g.developer_id = u.id
        ''')
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
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/games/{game_id}')
def delete_game(game_id: int):
    try:
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM games WHERE id = ?', (game_id,))
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail='Spiel nicht gefunden')
        conn.commit()
        conn.close()
        return {"message": "Spiel erfolgreich gelöscht"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/login')
def login_user(credentials: UserLogin):
    try:
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (credentials.username,))
        user = cursor.fetchone()
        conn.close()
        if not user or user[3] != credentials.password:
            raise HTTPException(status_code=401, detail='Ungültige Anmeldedaten')
        token = f"token_{user[1]}_{user[0]}"
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user[0],
                "username": user[1],
                "email": user[2],
                "role": user[5] if len(user) > 5 else "user",
                "is_developer": bool(user[6]) if len(user) > 6 else False,
                "is_admin": bool(user[7]) if len(user) > 7 else False
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/users/me/')
def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Token fehlt')
    token = authorization.replace('Bearer ', '')
    if not token.startswith('token_'):
        raise HTTPException(status_code=401, detail='Ungültiger Token')
    try:
        parts = token.split('_')
        if len(parts) < 3:
            raise HTTPException(status_code=401, detail='Ungültiger Token')
        user_id = int(parts[-1])
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        if not user:
            raise HTTPException(status_code=401, detail='Benutzer nicht gefunden')
        return {
            "id": user[0],
            "username": user[1],
            "email": user[2],
            "role": user[5] if len(user) > 5 else "user",
            "is_developer": bool(user[6]) if len(user) > 6 else False,
            "is_admin": bool(user[7]) if len(user) > 7 else False
        }
    except ValueError:
        raise HTTPException(status_code=401, detail='Ungültiger Token')
