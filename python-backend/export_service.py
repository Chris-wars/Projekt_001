import json
import csv
import os
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List
import models
import schemas

class UserExportService:
    def __init__(self, export_dir: str = "exports"):
        self.export_dir = export_dir
        os.makedirs(export_dir, exist_ok=True)
    
    def _get_timestamp(self) -> str:
        """Erstelle einen Zeitstempel für Dateinamen"""
        return datetime.now().strftime("%Y%m%d_%H%M%S")
    
    def _user_to_dict(self, user: models.User) -> dict:
        """Konvertiere User-Model zu Dictionary"""
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "is_developer": user.is_developer,
            "is_admin": user.is_admin,
            "avatar_url": user.avatar_url,
            "created_at": user.id,  # Vereinfacht, da kein created_at Feld vorhanden
            "role_display": self._get_role_display(user)
        }
    
    def _get_role_display(self, user: models.User) -> str:
        """Erstelle eine lesbare Rollen-Anzeige"""
        roles = []
        if user.is_admin:
            roles.append("Administrator")
        if user.is_developer:
            roles.append("Entwickler")
        if not user.is_admin and not user.is_developer:
            roles.append("User")
        return ", ".join(roles)
    
    def export_all_users_json(self, db: Session) -> str:
        """Exportiere alle Nutzer als JSON-Datei"""
        users = db.query(models.User).all()
        users_data = [self._user_to_dict(user) for user in users]
        
        # Statistiken hinzufügen
        export_data = {
            "export_info": {
                "timestamp": datetime.now().isoformat(),
                "total_users": len(users),
                "admins": len([u for u in users if u.is_admin]),
                "developers": len([u for u in users if u.is_developer and not u.is_admin]),
                "regular_users": len([u for u in users if not u.is_developer and not u.is_admin])
            },
            "users": users_data
        }
        
        filename = f"users_export_{self._get_timestamp()}.json"
        filepath = os.path.join(self.export_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        return filepath
    
    def export_all_users_csv(self, db: Session) -> str:
        """Exportiere alle Nutzer als CSV-Datei"""
        users = db.query(models.User).all()
        
        filename = f"users_export_{self._get_timestamp()}.csv"
        filepath = os.path.join(self.export_dir, filename)
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['id', 'username', 'email', 'is_active', 'is_developer', 'is_admin', 'avatar_url', 'role_display']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            
            writer.writeheader()
            for user in users:
                writer.writerow(self._user_to_dict(user))
        
        return filepath
    
    def export_users_by_role(self, db: Session, role: str = "all") -> str:
        """Exportiere Nutzer nach Rolle"""
        query = db.query(models.User)
        
        if role == "admin":
            users = query.filter(models.User.is_admin == True).all()
            filename_prefix = "admins"
        elif role == "developer":
            users = query.filter(models.User.is_developer == True, models.User.is_admin == False).all()
            filename_prefix = "developers"
        elif role == "user":
            users = query.filter(models.User.is_developer == False, models.User.is_admin == False).all()
            filename_prefix = "regular_users"
        else:
            users = query.all()
            filename_prefix = "all_users"
        
        users_data = [self._user_to_dict(user) for user in users]
        
        export_data = {
            "export_info": {
                "timestamp": datetime.now().isoformat(),
                "role_filter": role,
                "count": len(users)
            },
            "users": users_data
        }
        
        filename = f"{filename_prefix}_export_{self._get_timestamp()}.json"
        filepath = os.path.join(self.export_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        return filepath
    
    def create_user_summary_report(self, db: Session) -> str:
        """Erstelle einen detaillierten Zusammenfassungsreport"""
        users = db.query(models.User).all()
        
        # Statistiken sammeln
        stats = {
            "total_users": len(users),
            "active_users": len([u for u in users if u.is_active]),
            "inactive_users": len([u for u in users if not u.is_active]),
            "admins": len([u for u in users if u.is_admin]),
            "developers": len([u for u in users if u.is_developer and not u.is_admin]),
            "regular_users": len([u for u in users if not u.is_developer and not u.is_admin]),
            "users_with_avatars": len([u for u in users if u.avatar_url])
        }
        
        # Detaillierte Listen
        admin_list = [u.username for u in users if u.is_admin]
        developer_list = [u.username for u in users if u.is_developer and not u.is_admin]
        
        report = {
            "report_info": {
                "generated_at": datetime.now().isoformat(),
                "report_type": "User Summary Report"
            },
            "statistics": stats,
            "role_breakdown": {
                "administrators": {
                    "count": len(admin_list),
                    "usernames": admin_list
                },
                "developers": {
                    "count": len(developer_list),
                    "usernames": developer_list
                },
                "regular_users": {
                    "count": stats["regular_users"]
                }
            },
            "system_health": {
                "active_user_percentage": round((stats["active_users"] / stats["total_users"]) * 100, 2) if stats["total_users"] > 0 else 0,
                "avatar_adoption_rate": round((stats["users_with_avatars"] / stats["total_users"]) * 100, 2) if stats["total_users"] > 0 else 0
            }
        }
        
        filename = f"user_summary_report_{self._get_timestamp()}.json"
        filepath = os.path.join(self.export_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        return filepath
    
    def get_latest_exports(self) -> List[dict]:
        """Liste der letzten Export-Dateien"""
        if not os.path.exists(self.export_dir):
            return []
        
        files = []
        for filename in os.listdir(self.export_dir):
            if filename.endswith(('.json', '.csv')):
                filepath = os.path.join(self.export_dir, filename)
                stat = os.stat(filepath)
                files.append({
                    "filename": filename,
                    "size": stat.st_size,
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "type": "JSON" if filename.endswith('.json') else "CSV"
                })
        
        # Nach Erstellungsdatum sortieren (neueste zuerst)
        files.sort(key=lambda x: x['created'], reverse=True)
        return files[:10]  # Nur die letzten 10 Exports