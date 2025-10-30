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

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    is_developer: Optional[bool] = None
    is_admin: Optional[bool] = None
    avatar_url: Optional[str] = None
    birth_date: Optional[str] = None


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


@router.post('/login-json')
def login_user(credentials: UserLogin):
    try:
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (credentials.username,))
        user = cursor.fetchone()
        conn.close()
        if not user:
            raise HTTPException(status_code=401, detail='Ungültige Anmeldedaten')
        
        # Prüfe gehashtes Passwort
        from security import verify_password
        if not verify_password(credentials.password, user[3]):  # user[3] ist hashed_password
            raise HTTPException(status_code=401, detail='Ungültige Anmeldedaten')
        
        # Erstelle JWT Token wie im auth.py
        from security import create_access_token
        from datetime import timedelta
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user[1]}, expires_delta=access_token_expires  # user[1] ist username
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user[0],
                "username": user[1],
                "email": user[2],
                "role": "admin" if user[6] else ("developer" if user[5] else "user"),
                "is_developer": bool(user[5]),
                "is_admin": bool(user[6])  # user[6] ist is_admin
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
    
    try:
        # Versuche JWT Token zu dekodieren
        from security import SECRET_KEY, ALGORITHM
        from jose import JWTError, jwt
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail='Ungültiger Token')
            
        # Lade User aus Datenbank
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            raise HTTPException(status_code=401, detail='Benutzer nicht gefunden')
        
        return {
            "id": user[0],
            "username": user[1],
            "email": user[2],
            "role": "developer" if user[5] else "user",
            "is_developer": bool(user[5]),
            "is_admin": bool(user[6])  # user[6] ist is_admin aus der Datenbank
        }
        
    except (JWTError, ValueError):
        # Fallback für einfache Token (Legacy)
        if not token.startswith('token_'):
            raise HTTPException(status_code=401, detail='Ungültiger Token')
        
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
            "role": "developer" if user[5] else "user",
            "is_developer": bool(user[5]),
            "is_admin": bool(user[6])  # user[6] ist is_admin aus der Datenbank
        }


@router.put('/users/me/')
def update_current_user(user_update: UserUpdate, authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Token fehlt')
    token = authorization.replace('Bearer ', '')
    
    try:
        # Versuche JWT Token zu dekodieren
        from security import SECRET_KEY, ALGORITHM
        from jose import JWTError, jwt
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail='Ungültiger Token')
            
        # Lade User aus Datenbank
        conn = _get_conn()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            raise HTTPException(status_code=401, detail='Benutzer nicht gefunden')
        
        user_id = user[0]
        
        # Prüfe, ob der neue Benutzername bereits existiert (falls geändert)
        if user_update.username and user_update.username != user[1]:
            cursor.execute('SELECT id FROM users WHERE username = ? AND id != ?', (user_update.username, user_id))
            if cursor.fetchone():
                conn.close()
                raise HTTPException(status_code=400, detail='Benutzername bereits vergeben')
        
        # Prüfe, ob die neue E-Mail bereits existiert (falls geändert)
        if user_update.email and user_update.email != user[2]:
            cursor.execute('SELECT id FROM users WHERE email = ? AND id != ?', (user_update.email, user_id))
            if cursor.fetchone():
                conn.close()
                raise HTTPException(status_code=400, detail='E-Mail bereits vergeben')
        
        # Erstelle UPDATE Query dynamisch
        update_fields = []
        update_values = []
        
        if user_update.username is not None:
            update_fields.append("username = ?")
            update_values.append(user_update.username)
        if user_update.email is not None:
            update_fields.append("email = ?")
            update_values.append(user_update.email)
        if user_update.is_developer is not None:
            update_fields.append("is_developer = ?")
            update_values.append(int(user_update.is_developer))
        if user_update.is_admin is not None:
            update_fields.append("is_admin = ?")
            update_values.append(int(user_update.is_admin))
        if user_update.avatar_url is not None:
            update_fields.append("avatar_url = ?")
            update_values.append(user_update.avatar_url)
        if user_update.birth_date is not None:
            update_fields.append("birth_date = ?")
            update_values.append(user_update.birth_date)
        
        if update_fields:
            update_values.append(user_id)
            update_query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(update_query, update_values)
            conn.commit()
        
        # Lade aktualisierten User
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        updated_user = cursor.fetchone()
        conn.close()
        
        if not updated_user:
            raise HTTPException(status_code=404, detail='Benutzer nicht gefunden')
        
        return {
            "id": updated_user[0],
            "username": updated_user[1],
            "email": updated_user[2],
            "role": "developer" if updated_user[5] else "user",
            "is_developer": bool(updated_user[5]),
            "is_admin": False,  # is_admin existiert nicht in dieser DB
            "avatar_url": None,  # avatar_url existiert nicht in dieser DB
            "birth_date": None   # birth_date existiert nicht in dieser DB
        }
        
    except (JWTError, ValueError) as e:
        raise HTTPException(status_code=401, detail=f'Token-Fehler: {str(e)}')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Serverfehler: {str(e)}')
