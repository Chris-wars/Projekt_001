# Administrator-Verwaltung

## Sicherheitskonzept

Administrator-Rechte können **nur über das Terminal** verwaltet werden. Dies gewährleistet, dass nur Personen mit direktem Zugang zum Backend-Server Admin-Rechte vergeben oder entziehen können.

## Terminal-Tool verwenden

Das `admin_manager.py` Tool im `python-backend` Ordner ermöglicht die sichere Verwaltung von Administrator-Rechten.

### Verfügbare Befehle

```bash
# Ins Backend-Verzeichnis wechseln
cd python-backend

# Alle Benutzer anzeigen
python admin_manager.py list

# Administrator-Rechte vergeben
python admin_manager.py grant <benutzername_oder_id>

# Administrator-Rechte entziehen  
python admin_manager.py revoke <benutzername_oder_id>

# Neuen Administrator erstellen
python admin_manager.py create

# Benutzer-Statistiken anzeigen
python admin_manager.py stats
```

### Beispiele

```bash
# Admin-Rechte an Benutzer "john" vergeben
python admin_manager.py grant john

# Admin-Rechte von Benutzer mit ID 5 entziehen
python admin_manager.py revoke 5

# Alle Benutzer mit ihren Rollen anzeigen
python admin_manager.py list

# Neuen Administrator interaktiv erstellen
python admin_manager.py create
```

## Sicherheitsfeatures

- ✅ **Terminal-only**: Admin-Rechte können nur über das Terminal geändert werden
- ✅ **Bestätigung**: Alle Admin-Änderungen erfordern eine explizite Bestätigung
- ✅ **Logging**: Alle Admin-Aktionen werden in `admin_actions.log` protokolliert
- ✅ **Passwort-Hashing**: Sichere Speicherung mit bcrypt
- ✅ **Validierung**: Benutzer-Existenz wird vor Änderungen überprüft

## Frontend-Verhalten

- **Registrierung**: Admin-Option ist nicht verfügbar
- **Profil-Bearbeitung**: Admin-Checkbox ist entfernt, nur Entwickler-Rolle editierbar
- **Anzeige**: Admin-Status wird weiterhin angezeigt (read-only)
- **Warnung**: Hinweis, dass Admin-Rechte nur über Terminal geändert werden können

## Log-Datei

Alle Administrator-Aktionen werden automatisch in `python-backend/admin_actions.log` protokolliert:

```log
[2024-01-15 14:30:25] Admin-Rechte vergeben an john (ID: 5)
[2024-01-15 14:35:10] Admin-Benutzer erstellt: admin_user (ID: 8)
[2024-01-15 15:20:45] Admin-Rechte entzogen von old_admin (ID: 3)
```

## Erste Admin-Erstellung

Wenn noch kein Administrator existiert:

```bash
cd python-backend
python admin_manager.py create
```

Das Tool führt Sie durch die interaktive Erstellung des ersten Administrator-Accounts.