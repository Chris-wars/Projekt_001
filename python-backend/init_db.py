#!/usr/bin/env python
"""
Datenbank-Initialisierung für das Backend
Erstellt alle Tabellen mit den korrekten Spalten und fügt einen Admin-User hinzu
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, engine
import models
from security import get_password_hash
from datetime import date

def init_database():
    """Initialisiert die Datenbank mit allen Tabellen und Admin-User"""
    
    # Alle Tabellen löschen und neu erstellen
    print("🗑️ Lösche alte Tabellen...")
    Base.metadata.drop_all(bind=engine)
    
    print("🏗️ Erstelle neue Tabellen...")
    Base.metadata.create_all(bind=engine)
    
    # Session erstellen
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Admin-User erstellen
        print("👑 Erstelle Admin-User...")
        admin_user = models.User(
            username="Admin",
            email="admin@example.com",
            hashed_password=get_password_hash("123"),
            is_active=True,
            is_developer=True,
            is_admin=True,
            avatar_url="",
            birth_year=1990,
            birth_date=date(1990, 1, 1)
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Datenbank erfolgreich initialisiert!")
        print("📊 Admin-User erstellt:")
        print("   - Benutzername: Admin")
        print("   - Passwort: 123")
        print("   - Rollen: Admin + Entwickler")
        
    except Exception as e:
        print(f"❌ Fehler bei der Initialisierung: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database()