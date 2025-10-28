#!/usr/bin/env python3
"""
Hilfsskript zum Markieren aller Spiele als veröffentlicht
"""

import sqlite3
import os

def publish_all_games():
    """Markiert alle Spiele in der Datenbank als veröffentlicht"""
    
    # Finde die Datenbank
    db_paths = [
        './data/game_platform.db',
        './python-backend/data/game_platform.db',
        './game_platform.db'
    ]
    
    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("❌ Datenbank nicht gefunden!")
        return False
    
    print(f"📁 Verwende Datenbank: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Zeige aktuelle Spiele
        cursor.execute("SELECT id, title, is_published FROM games")
        games = cursor.fetchall()
        
        print("\n📋 Aktuelle Spiele:")
        for game_id, title, is_published in games:
            status = "✅ Veröffentlicht" if is_published else "❌ Unveröffentlicht"
            print(f"  {game_id}: {title} - {status}")
        
        # Markiere alle als veröffentlicht
        cursor.execute("UPDATE games SET is_published = 1")
        updated_count = cursor.rowcount
        conn.commit()
        
        print(f"\n🎯 {updated_count} Spiele als veröffentlicht markiert")
        
        # Zeige aktualisierte Spiele
        cursor.execute("SELECT id, title, is_published FROM games")
        games = cursor.fetchall()
        
        print("\n📋 Aktualisierte Spiele:")
        for game_id, title, is_published in games:
            status = "✅ Veröffentlicht" if is_published else "❌ Unveröffentlicht"
            print(f"  {game_id}: {title} - {status}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Fehler: {e}")
        return False

if __name__ == "__main__":
    print("🎮 Markiere alle Spiele als veröffentlicht...")
    success = publish_all_games()
    
    if success:
        print("\n✅ Alle Spiele erfolgreich als veröffentlicht markiert!")
    else:
        print("\n❌ Fehler beim Aktualisieren der Spiele!")