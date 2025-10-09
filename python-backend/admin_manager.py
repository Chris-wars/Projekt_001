#!/usr/bin/env python3
"""
Administrator Management Tool
Dieses Tool erlaubt die Verwaltung von Administrator-Rechten über das Terminal.
Nur Personen mit direktem Zugang zum Backend können diese Rechte ändern.
"""

import sys
import sqlite3
from pathlib import Path
import bcrypt
from getpass import getpass
import argparse
from datetime import datetime

# Pfad zur Datenbank
DB_PATH = Path(__file__).parent / "test.db"

class AdminManager:
    def __init__(self):
        self.conn = sqlite3.connect(DB_PATH)
        self.conn.row_factory = sqlite3.Row
        
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.conn.close()
    
    def list_users(self):
        """Alle Benutzer mit ihren Rollen anzeigen"""
        cursor = self.conn.execute("""
            SELECT id, username, email, is_developer, is_admin
            FROM users
            ORDER BY is_admin DESC, is_developer DESC, username
        """)
        
        users = cursor.fetchall()
        
        print("\n📋 Benutzer-Übersicht:")
        print("=" * 80)
        print(f"{'ID':<5} {'Benutzername':<20} {'E-Mail':<30} {'Rolle':<15}")
        print("-" * 70)
        
        for user in users:
            role = "👑 Admin" if user['is_admin'] else "👨‍💻 Entwickler" if user['is_developer'] else "🎮 User"
            print(f"{user['id']:<5} {user['username']:<20} {user['email']:<30} {role:<15}")
        
        print(f"\nGesamt: {len(users)} Benutzer")
        return users
    
    def get_user_by_identifier(self, identifier):
        """Benutzer per ID oder Benutzername finden"""
        if identifier.isdigit():
            cursor = self.conn.execute("SELECT * FROM users WHERE id = ?", (int(identifier),))
        else:
            cursor = self.conn.execute("SELECT * FROM users WHERE username = ?", (identifier,))
        
        return cursor.fetchone()
    
    def grant_admin(self, identifier):
        """Administrator-Rechte vergeben"""
        user = self.get_user_by_identifier(identifier)
        if not user:
            print(f"❌ Benutzer '{identifier}' nicht gefunden!")
            return False
            
        if user['is_admin']:
            print(f"ℹ️ Benutzer '{user['username']}' ist bereits Administrator.")
            return False
        
        # Bestätigung
        confirm = input(f"Administrator-Rechte an '{user['username']}' vergeben? (j/N): ")
        if confirm.lower() not in ['j', 'ja', 'y', 'yes']:
            print("❌ Vorgang abgebrochen.")
            return False
        
        # Admin-Rechte vergeben
        self.conn.execute("""
            UPDATE users 
            SET is_admin = 1, is_developer = 1
            WHERE id = ?
        """, (user['id'],))
        self.conn.commit()
        
        # Log-Eintrag
        self.log_action(f"Admin-Rechte vergeben an {user['username']} (ID: {user['id']})")
        
        print(f"✅ Administrator-Rechte erfolgreich an '{user['username']}' vergeben!")
        return True
    
    def revoke_admin(self, identifier):
        """Administrator-Rechte entziehen"""
        user = self.get_user_by_identifier(identifier)
        if not user:
            print(f"❌ Benutzer '{identifier}' nicht gefunden!")
            return False
            
        if not user['is_admin']:
            print(f"ℹ️ Benutzer '{user['username']}' ist kein Administrator.")
            return False
        
        # Bestätigung
        confirm = input(f"Administrator-Rechte von '{user['username']}' entziehen? (j/N): ")
        if confirm.lower() not in ['j', 'ja', 'y', 'yes']:
            print("❌ Vorgang abgebrochen.")
            return False
        
        # Admin-Rechte entziehen
        self.conn.execute("""
            UPDATE users 
            SET is_admin = 0
            WHERE id = ?
        """, (user['id'],))
        self.conn.commit()
        
        # Log-Eintrag
        self.log_action(f"Admin-Rechte entzogen von {user['username']} (ID: {user['id']})")
        
        print(f"✅ Administrator-Rechte erfolgreich von '{user['username']}' entzogen!")
        return True
    
    def create_admin_user(self):
        """Neuen Administrator-Benutzer erstellen"""
        print("\n👑 Neuen Administrator erstellen:")
        print("-" * 40)
        
        username = input("Benutzername: ").strip()
        if not username:
            print("❌ Benutzername darf nicht leer sein!")
            return False
        
        # Prüfen ob Username bereits existiert
        existing = self.get_user_by_identifier(username)
        if existing:
            print(f"❌ Benutzername '{username}' bereits vergeben!")
            return False
        
        email = input("E-Mail: ").strip()
        if not email:
            print("❌ E-Mail darf nicht leer sein!")
            return False
        
        full_name = input("Vollständiger Name (optional): ").strip()
        
        password = getpass("Passwort: ")
        if len(password) < 6:
            print("❌ Passwort muss mindestens 6 Zeichen lang sein!")
            return False
        
        password_confirm = getpass("Passwort bestätigen: ")
        if password != password_confirm:
            print("❌ Passwörter stimmen nicht überein!")
            return False
        
        # Passwort hashen
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Bestätigung
        print(f"\nNeuer Administrator wird erstellt:")
        print(f"  Benutzername: {username}")
        print(f"  E-Mail: {email}")
        print(f"  Name: {full_name or '(nicht angegeben)'}")
        
        confirm = input("\nBenutzer erstellen? (j/N): ")
        if confirm.lower() not in ['j', 'ja', 'y', 'yes']:
            print("❌ Vorgang abgebrochen.")
            return False
        
        # Benutzer erstellen
        try:
            cursor = self.conn.execute("""
                INSERT INTO users (username, email, hashed_password, is_active, is_developer, is_admin, birth_year, birth_date)
                VALUES (?, ?, ?, 1, 1, 1, 1990, '1990-01-01')
            """, (username, email, hashed_password))
            self.conn.commit()
            
            # Log-Eintrag
            self.log_action(f"Admin-Benutzer erstellt: {username} (ID: {cursor.lastrowid}, Geburtsdatum: 01.01.1990 - USK-konform 18+)")
            
            print(f"✅ Administrator '{username}' erfolgreich erstellt!")
            print(f"   📅 Geburtsdatum automatisch auf 01.01.1990 gesetzt (USK-konform 18+)")
            return True
            
        except sqlite3.IntegrityError as e:
            print(f"❌ Fehler beim Erstellen: {e}")
            return False
    
    def log_action(self, action):
        """Aktionen in eine Log-Datei schreiben"""
        log_file = Path(__file__).parent / "admin_actions.log"
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] {action}\n")
    
    def show_admin_stats(self):
        """Administrator-Statistiken anzeigen"""
        cursor = self.conn.execute("""
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN is_admin = 1 THEN 1 ELSE 0 END) as admin_count,
                SUM(CASE WHEN is_developer = 1 AND is_admin = 0 THEN 1 ELSE 0 END) as dev_count,
                SUM(CASE WHEN is_developer = 0 AND is_admin = 0 THEN 1 ELSE 0 END) as user_count
            FROM users
        """)
        
        stats = cursor.fetchone()
        
        print("\n📊 Benutzer-Statistiken:")
        print("=" * 30)
        print(f"👑 Administratoren: {stats['admin_count']}")
        print(f"👨‍💻 Entwickler:      {stats['dev_count']}")
        print(f"🎮 Benutzer:        {stats['user_count']}")
        print(f"📋 Gesamt:          {stats['total_users']}")

def main():
    # Prüfen ob Datenbank existiert
    if not DB_PATH.exists():
        print(f"❌ Datenbank nicht gefunden: {DB_PATH}")
        print("Stellen Sie sicher, dass das Backend gestartet wurde.")
        sys.exit(1)
    
    parser = argparse.ArgumentParser(
        description="Administrator Management Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Beispiele:
  python admin_manager.py list                    # Alle Benutzer anzeigen
  python admin_manager.py grant john             # Admin-Rechte an 'john' vergeben
  python admin_manager.py grant 5                # Admin-Rechte an Benutzer-ID 5 vergeben
  python admin_manager.py revoke john            # Admin-Rechte von 'john' entziehen
  python admin_manager.py create                 # Neuen Admin erstellen
  python admin_manager.py stats                  # Statistiken anzeigen
        """
    )
    
    parser.add_argument('action', choices=['list', 'grant', 'revoke', 'create', 'stats'],
                       help='Aktion die ausgeführt werden soll')
    parser.add_argument('user', nargs='?',
                       help='Benutzer-ID oder Benutzername (für grant/revoke)')
    
    args = parser.parse_args()
    
    print("👑 Administrator Management Tool")
    print("=" * 50)
    
    try:
        with AdminManager() as admin_mgr:
            if args.action == 'list':
                admin_mgr.list_users()
                
            elif args.action == 'stats':
                admin_mgr.show_admin_stats()
                
            elif args.action == 'create':
                admin_mgr.create_admin_user()
                
            elif args.action == 'grant':
                if not args.user:
                    print("❌ Benutzer-ID oder Benutzername erforderlich!")
                    parser.print_help()
                    sys.exit(1)
                admin_mgr.grant_admin(args.user)
                
            elif args.action == 'revoke':
                if not args.user:
                    print("❌ Benutzer-ID oder Benutzername erforderlich!")
                    parser.print_help()
                    sys.exit(1)
                admin_mgr.revoke_admin(args.user)
                
    except Exception as e:
        print(f"❌ Fehler: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()