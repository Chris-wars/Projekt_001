# Test der Zugriffskontrollen

## Testen Sie folgende Szenarien:

### 1. Als Administrator (Admin / 123):
✅ **Sollte Zugriff haben auf:**
- Profil bearbeiten (alle Rollen sichtbar)
- Nutzerverwaltung (👑 Nutzer verwalten)
- Export-Funktionen (📁 Export)

### 2. Als Entwickler:
Erstellen Sie einen Entwickler-Account oder loggen Sie sich als normaler User ein und aktivieren Sie die Entwickler-Rolle im Profil.

✅ **Sollte Zugriff haben auf:**
- Profil bearbeiten (nur Entwickler-Rolle änderbar)

❌ **KEINEN Zugriff auf:**
- Nutzerverwaltung (Navigation sollte nicht sichtbar sein)
- Export-Funktionen (Navigation sollte nicht sichtbar sein)
- Direkte URLs sollten "Zugriff verweigert" anzeigen

### 3. Als normaler User:
❌ **KEINEN Zugriff auf:**
- Nutzerverwaltung
- Export-Funktionen
- Admin-spezifische Bereiche

## Test-URLs (falls Backend läuft):
- `http://localhost:3000` - Hauptseite
- Versuchen Sie als Entwickler direkt: nicht möglich (Navigation versteckt)

## Erwartetes Verhalten:
- **Navigation**: Entwickler sehen keine Admin-Buttons
- **Direkte URLs**: Zeigen "Zugriff verweigert" für Entwickler
- **Backend**: 403 Forbidden für nicht-autorisierte Anfragen