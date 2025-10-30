"""
Pydantic Schema Definitionen für Indie Game Platform API

Dieses Modul definiert alle Pydantic-Modelle für die Datenvalidierung
und Serialisierung in der FastAPI-Anwendung. Die Schemas werden verwendet für:
- Request/Response-Validierung
- Automatische API-Dokumentation
- Datentyp-Sicherheit
- Input-Sanitisierung

Kategorien:
- User Schemas: Benutzerregistrierung, -aktualisierung und -authentifizierung
- Game Schemas: Spieledatenmodelle für CRUD-Operationen
- Token Schemas: JWT-Authentifizierung

Autor: Projekt Team
Version: 1.0.0
"""

from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, date

# ===== USER SCHEMAS =====

class UserBase(BaseModel):
    """
    Basis-Schema für Benutzerdaten
    
    Enthält die grundlegenden Felder, die für alle User-Operationen
    benötigt werden. Wird als Basis für andere User-Schemas verwendet.
    
    Attributes:
        username (str): Eindeutiger Benutzername (3-50 Zeichen)
        email (str): E-Mail-Adresse für Kommunikation und Login
        is_developer (bool): Entwickler-Status für Spieleupload-Berechtigung
        is_admin (bool): Administrator-Status für erweiterte Berechtigungen
    """
    username: str
    email: str
    is_developer: bool
    is_admin: bool

class UserCreate(BaseModel):
    """
    Schema für die Benutzerregistrierung
    
    Enthält alle erforderlichen Felder für die Registrierung neuer Benutzer.
    Neue Benutzer haben standardmäßig keine Admin-/Entwicklerrechte.
    
    Attributes:
        username (str): Eindeutiger Benutzername (3-50 Zeichen)
        email (str): E-Mail-Adresse für Kommunikation und Login
        password (str): Klartext-Passwort (wird gehasht gespeichert)
        is_developer (bool): Entwickler-Status (Standard: False)
        is_admin (bool): Administrator-Status (Standard: False)
        
    Note:
        Geburtsdatum-Validierung ist temporär deaktiviert für Testing.
        In Produktion sollte USK-Compliance-Validierung aktiviert werden.
    """
    username: str
    email: str
    password: str
    is_developer: bool = False
    is_admin: bool = False
    
    # Temporär deaktiviert für Testing
    # @validator('birth_date')
    # def validate_birth_date(cls, v, values):
    #     """Validiere Geburtsdatum für USK-Compliance"""
    #     if v is not None:
    #         today = date.today()
    #         age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
    #         
    #         # Mindestalter 6 Jahre für USK-Compliance
    #         if age < 6:
    #             raise ValueError('Mindestalter 6 Jahre erforderlich (USK-Compliance)')
    #         
    #         # Geburtsdatum nicht in der Zukunft
    #         if v > today:
    #             raise ValueError('Geburtsdatum kann nicht in der Zukunft liegen')
    #             
    #         # Realistisches Maximalalter (150 Jahre)
    #         if age > 150:
    #             raise ValueError('Geburtsdatum zu weit in der Vergangenheit')
    #     
    #     # Für User und Entwickler ist Geburtsdatum erforderlich (außer Admin)
    #     is_admin = values.get('is_admin', False)
    #     if not is_admin and v is None:
    #         raise ValueError('Geburtsdatum ist für User und Entwickler erforderlich (USK-Compliance)')
    #         
    #     return v
    
    # Temporär deaktiviert für Testing  
    # @validator('birth_year')
    # def validate_birth_year_legacy(cls, v, values):
    #     """Legacy-Validator für Geburtsjahr (falls birth_date nicht gesetzt)"""
    #     birth_date = values.get('birth_date')
    #     if birth_date is None and v is not None:
    #         current_year = datetime.now().year
    #         if v < 1900 or v > current_year - 6:
    #             raise ValueError(f'Geburtsjahr muss zwischen 1900 und {current_year - 6} liegen')
    #     return v

class UserUpdate(BaseModel):
    """
    Schema für Benutzer-Profil-Updates
    
    Ermöglicht partielle Updates von Benutzerdaten. Alle Felder sind optional,
    sodass nur die gewünschten Änderungen übermittelt werden müssen.
    
    Attributes:
        username (Optional[str]): Neuer Benutzername (falls geändert)
        email (Optional[str]): Neue E-Mail-Adresse (falls geändert)
        is_developer (Optional[bool]): Entwickler-Status ändern
        is_admin (Optional[bool]): Administrator-Status ändern (nur für Admins)
        avatar_url (Optional[str]): URL zum Profilbild
        birth_year (Optional[int]): Geburtsjahr (deprecated, verwende birth_date)
        birth_date (Optional[date]): Vollständiges Geburtsdatum für USK-Compliance
        
    Validation:
        - Geburtsdatum muss USK-Anforderungen erfüllen (mindestens 6 Jahre alt)
        - Keine Zukunftsdaten erlaubt
        - Realistisches Maximalalter (150 Jahre)
    """
    username: Optional[str] = None
    email: Optional[str] = None
    is_developer: Optional[bool] = None
    is_admin: Optional[bool] = None
    avatar_url: Optional[str] = None
    birth_year: Optional[int] = None  # Deprecated
    birth_date: Optional[date] = None
    
    @validator('birth_date')
    def validate_birth_date_update(cls, v):
        """Validiere Geburtsdatum bei Updates"""
        if v is not None:
            today = date.today()
            age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
            
            if age < 6:
                raise ValueError('Mindestalter 6 Jahre erforderlich (USK-Compliance)')
            if v > today:
                raise ValueError('Geburtsdatum kann nicht in der Zukunft liegen')
            if age > 150:
                raise ValueError('Geburtsdatum zu weit in der Vergangenheit')
        return v

class User(UserBase):
    """
    Schema für vollständige Benutzerdaten (Response)
    
    Wird für API-Responses verwendet und enthält alle öffentlichen
    Benutzerdaten ohne sensible Informationen wie Passwort-Hash.
    
    Attributes:
        id (int): Eindeutige Benutzer-ID (Primärschlüssel)
        is_active (bool): Konto-Status (aktiv/deaktiviert)
        avatar_url (Optional[str]): URL zum Profilbild
        
    Config:
        from_attributes = True: Ermöglicht Erstellung aus SQLAlchemy-Modellen
    """
    id: int
    is_active: bool
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

# ===== AUTHENTICATION SCHEMAS =====

class Token(BaseModel):
    """
    Schema für JWT-Token Response
    
    Wird nach erfolgreicher Authentifizierung zurückgegeben.
    
    Attributes:
        access_token (str): JWT-Token für API-Zugriff
        token_type (str): Token-Typ (standardmäßig "bearer")
    """
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """
    Schema für Token-Daten-Extraktion
    
    Wird intern für die Verarbeitung von JWT-Token-Inhalten verwendet.
    
    Attributes:
        username (Optional[str]): Benutzername aus Token-Payload
    """
    username: Optional[str] = None

# ===== GAME/LIBRARY SCHEMAS =====

class GameBase(BaseModel):
    """
    Basis-Schema für Spieledaten
    
    Enthält die grundlegenden Felder für alle Spiele-Operationen.
    Definiert Standard-Werte für neue Spiele.
    
    Attributes:
        title (str): Spieltitel (erforderlich, 3-100 Zeichen)
        description (Optional[str]): Detaillierte Spielbeschreibung
        genre (Optional[str]): Spielgenre aus vordefinierter Liste
        version (str): Versionsnummer (Standard: "1.0.0")
        price (Optional[float]): Preis als Dezimalzahl (Standard: 0.0 für kostenlos)
        usk_rating (str): USK-Altersfreigabe (Standard: "USK 6")
        download_url (Optional[str]): URL zum Spiele-Download
        tags (Optional[str]): Komma-getrennte Tags für Kategorisierung
        platform (Optional[str]): Zielplattform (Standard: "Windows")
        image_url (Optional[str]): URL zum Spiele-Bild
        is_free (bool): Ob das Spiel kostenlos ist (Standard: True)
    """
    title: str
    description: Optional[str] = None
    genre: Optional[str] = None
    version: str = "1.0.0"
    price: Optional[float] = 0.0
    usk_rating: str = "USK 6"
    download_url: Optional[str] = None
    tags: Optional[str] = None
    platform: Optional[str] = "Windows"
    image_url: Optional[str] = None
    is_free: bool = True

class GameCreate(GameBase):
    """
    Schema für die Erstellung neuer Spiele durch Entwickler
    
    Erweitert GameBase um Validierungslogik für neue Spiele.
    Stellt sicher, dass alle erforderlichen Daten korrekt sind.
    
    Validation Rules:
        - Titel: 3-100 Zeichen, nur gültige Zeichen
        - USK-Rating: Muss gültiger deutscher USK-Wert sein
        - Genre: Muss aus vordefinierter Liste stammen
        
    Raises:
        ValueError: Bei ungültigen Eingabedaten
    """
    
    @validator('title')
    def validate_title(cls, v):
        """
        Validiere Spieltitel
        
        Überprüft Länge und Format des Spieltitels.
        """
        if not v or len(v.strip()) < 3:
            raise ValueError('Spieltitel muss mindestens 3 Zeichen lang sein')
        if len(v) > 100:
            raise ValueError('Spieltitel darf maximal 100 Zeichen lang sein')
        return v.strip()
    
    @validator('usk_rating')
    def validate_usk_rating(cls, v):
        """
        Validiere USK-Altersfreigabe
        
        Stellt sicher, dass nur gültige deutsche USK-Bewertungen verwendet werden.
        """
        valid_ratings = ["USK 0", "USK 6", "USK 12", "USK 16", "USK 18"]
        if v not in valid_ratings:
            raise ValueError(f'USK-Bewertung muss einer der folgenden Werte sein: {", ".join(valid_ratings)}')
        return v
    
    @validator('genre')
    def validate_genre(cls, v):
        """
        Validiere Spielgenre
        
        Überprüft, ob das angegebene Genre in der Liste unterstützter Genres ist.
        """
        if v:
            valid_genres = [
                "Action", "Adventure", "RPG", "Strategy", "Simulation", 
                "Sports", "Racing", "Puzzle", "Platform", "Shooter",
                "Indie", "Casual", "Arcade", "Horror", "Survival"
            ]
            if v not in valid_genres:
                raise ValueError(f'Genre muss einer der folgenden Werte sein: {", ".join(valid_genres)}')
        return v

class GameUpdate(BaseModel):
    """
    Schema für Updates von Spielen
    
    Ermöglicht partielle Updates von Spieledaten. Alle Felder sind optional,
    sodass nur die gewünschten Änderungen übermittelt werden müssen.
    
    Attributes:
        title (Optional[str]): Neuer Spieltitel
        description (Optional[str]): Neue Beschreibung
        genre (Optional[str]): Neues Genre
        version (Optional[str]): Neue Versionsnummer
        price (Optional[str]): Neue Preis-Information
        usk_rating (Optional[str]): Neue USK-Bewertung
        download_url (Optional[str]): Neue Download-URL
        tags (Optional[str]): Neue Tags
        is_published (Optional[bool]): Veröffentlichungsstatus ändern
    """
    title: Optional[str] = None
    description: Optional[str] = None
    genre: Optional[str] = None
    version: Optional[str] = None
    price: Optional[str] = None
    usk_rating: Optional[str] = None
    download_url: Optional[str] = None
    tags: Optional[str] = None
    is_published: Optional[bool] = None

class Game(GameBase):
    """
    Schema für die Rückgabe von vollständigen Spiel-Daten
    
    Enthält alle Spieledaten inklusive Metadaten wie ID, Entwickler-Info,
    Zeitstempel und Veröffentlichungsstatus.
    
    Attributes:
        id (int): Eindeutige Spiel-ID (Primärschlüssel)
        developer_id (int): ID des Entwicklers (Fremdschlüssel)
        developer (User): Vollständige Entwickler-Daten (Relation)
        is_published (bool): Veröffentlichungsstatus
        release_date (datetime, optional): Zeitpunkt der Veröffentlichung
        created_at (datetime, optional): Erstellungszeitpunkt
        updated_at (datetime, optional): Letzte Änderung
        
    Config:
        from_attributes = True: Ermöglicht Erstellung aus SQLAlchemy-Modellen
    """
    id: int
    developer_id: int
    developer: User
    is_published: bool
    release_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class GameSummary(BaseModel):
    """
    Kompakte Übersicht für Spielelisten
    
    Reduzierte Spieledaten für Listen und Übersichten, um die Performance
    zu optimieren und nur die wichtigsten Informationen zu übertragen.
    
    Attributes:
        id (int): Spiel-ID
        title (str): Spieltitel
        genre (Optional[str]): Spielgenre
        usk_rating (str): USK-Altersfreigabe
        price (Optional[str]): Preis-Information
        developer_name (str): Name des Entwicklers
        is_published (bool): Veröffentlichungsstatus
        release_date (datetime): Veröffentlichungsdatum
        
    Config:
        from_attributes = True: Ermöglicht Erstellung aus SQLAlchemy-Modellen
    """
    id: int
    title: str
    genre: Optional[str]
    usk_rating: str
    price: Optional[str]
    developer_name: str
    is_published: bool
    release_date: datetime
    
    class Config:
        from_attributes = True
