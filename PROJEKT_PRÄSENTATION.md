# 🎮 INDIE HUB - Projekt Präsentation

## 📋 Projekt-Übersicht

**Indie Hub** ist eine vollständige Gaming-Plattform, inspiriert von Steam, speziell für Indie-Spiele entwickelt. Das Projekt kombiniert moderne Web-Technologien mit einer durchdachten Benutzerführung und umfassenden Funktionen für Entwickler, Spieler und Administratoren.

---

## 🎯 Hauptfunktionen

### 👥 Benutzerrollen & Verwaltung
- **Standard-Benutzer**: Spiele durchsuchen, Wunschliste verwalten, Profile anpassen
- **Entwickler**: Spiele hinzufügen, verwalten und veröffentlichen
- **Administratoren**: Vollständige Benutzer- und Systemverwaltung

### 🎮 Spiele-Management
- **Spielebibliothek**: Vollständige Katalog aller verfügbaren Spiele
- **Store-Ansicht**: Benutzerfreundliche Einkaufserfahrung
- **Entwickler-Tools**: Spiele-Upload, -bearbeitung und -veröffentlichung
- **Rich Metadata**: Titel, Beschreibung, Genre, Plattform, Preise, Screenshots

### 💜 Wunschliste-System
- **Persönliche Sammlungen**: Benutzer können Spiele speichern
- **Statistiken**: Anzahl Spiele, Gesamtwert der Wunschliste
- **Echtzeit-Updates**: Sofortige UI-Aktualisierung bei Änderungen
- **Cross-Page Integration**: Wunschliste-Funktionen auf allen Seiten

### 👑 Admin-Funktionen
- **Benutzerverwaltung**: Rollenänderungen, Kontoübersicht
- **Datenexport**: JSON, CSV, rollenbasierte Exporte
- **System-Reports**: Detaillierte Zusammenfassungsberichte
- **Vollständige API-Kontrolle**: Admin-spezifische Endpunkte

---

## 🏗️ Technische Architektur

### Backend (Python/FastAPI)
```
🐍 FastAPI Framework
├── 🔐 JWT-basierte Authentifizierung
├── 🗄️ SQLAlchemy ORM mit SQLite
├── 📊 Modulare API-Router
├── 🔧 Automatische API-Dokumentation
├── 🛡️ Umfassende Sicherheit & Validierung
└── 📁 Export-Services für Admins
```

**Hauptmodule:**
- `main.py` - Haupt-API-App mit allen Endpunkten
- `auth.py` - Authentifizierung & Registrierung
- `library_api.py` - Spiele-Management für Entwickler
- `wishlist_api.py` - Wunschliste-Funktionalität
- `models.py` - Datenbankmodelle mit Relationships
- `export_service.py` - Admin-Export-Funktionen

### Frontend (React)
```
⚛️ React 19.1.1
├── 🎨 Tailwind CSS Styling
├── 🔄 State Management mit Hooks
├── 📱 Responsive Design
├── 🎭 Modal-basierte Interaktionen
├── 🔐 Token-basierte Authentifizierung
└── 🚀 Hot-Reload Development
```

**Hauptkomponenten:**
- `App.js` - Haupt-App mit Navigation & Routing
- `GameLibrary.js` - Spiele-Anzeige & Wunschliste-Integration
- `Library.js` - Dedizierte Wunschliste-Seite
- `UserList.js` - Admin-Benutzerverwaltung
- `Profile.js` - Benutzerprofile & Rollenbearbeitung
- `AddGame.js` - Entwickler-Spiele-Upload

### 🐳 Docker-Containerisierung
```
Docker Compose Setup
├── 🔧 Development Environment
│   ├── Hot-reload für beide Services
│   ├── Volume-Mapping für Entwicklung
│   └── UTF-8 Locale-Support
├── 🚀 Production Ready
│   ├── Multi-stage Builds
│   ├── Nginx Reverse Proxy
│   └── Health Checks
└── 📊 Persistente Datenbank & Uploads
```

---

## 🗄️ Datenbank-Design

### Haupttabellen

**Users**
```sql
- id (Primary Key)
- username (Unique)
- email (Unique)
- hashed_password
- is_developer (Boolean)
- is_admin (Boolean)
- avatar_url
- birth_date
```

**Games**
```sql
- id (Primary Key)
- title
- description
- genre
- platform
- price
- is_free (Boolean)
- is_published (Boolean)
- developer_id (Foreign Key → Users)
- download_url
- image_url
```

**Wishlist (Association Table)**
```sql
- user_id (Foreign Key → Users)
- game_id (Foreign Key → Games)
- added_at (Timestamp)
```

### Beziehungen
- **User ↔ Games**: One-to-Many (Entwickler → Spiele)
- **User ↔ Wishlist**: Many-to-Many (Benutzer ↔ Spiele)
- **Game ↔ Wishlist**: Many-to-Many (Spiele ↔ Benutzer)

---

## 🚀 API-Endpunkte (Auswahl)

### Authentifizierung
- `POST /login` - Benutzer-Anmeldung
- `POST /register` - Neue Registrierung
- `GET /users/me/` - Aktueller Benutzer

### Spiele-Management
- `GET /games/` - Alle öffentlichen Spiele
- `POST /games/` - Spiel erstellen (Entwickler)
- `DELETE /games/{id}` - Spiel löschen

### Wunschliste
- `GET /wishlist/` - Benutzer-Wunschliste
- `POST /wishlist/{game_id}` - Spiel hinzufügen
- `DELETE /wishlist/{game_id}` - Spiel entfernen
- `GET /wishlist/stats` - Wunschliste-Statistiken

### Administration
- `GET /admin/users/` - Alle Benutzer (Admin)
- `PUT /admin/users/{id}/role` - Rolle ändern
- `POST /admin/export/users/json` - Datenexport

---

## 🎨 Benutzeroberfläche

### Design-Prinzipien
- **Dark Theme**: Gaming-inspiriertes dunkles Design
- **Rot-Akzente**: Charakteristische Indie Hub Brandfarben
- **Responsive**: Funktioniert auf Desktop, Tablet und Mobile
- **Intuitiv**: Steam-inspirierte Benutzerführung

### Hauptseiten
1. **Store** - Spiele-Katalog mit Einkaufsfunktionen
2. **🎮 Spiele** - Vollständige Spielebibliothek
3. **💜 Wunschliste** - Persönliche Spiele-Sammlung
4. **Profil** - Benutzereinstellungen & Avatar
5. **👑 Nutzer verwalten** - Admin-Panel (nur Admins)
6. **📁 Export** - Datenexport-Tools (nur Admins)

### UI-Features
- **Modal-Dialoge**: Für Aktionsbestätigungen
- **Toast-Benachrichtigungen**: Erfolg/Fehler-Meldungen
- **Loading-States**: Benutzerfreundliche Lade-Anzeigen
- **Conditional Rendering**: Rollenbasierte UI-Elemente

---

## 🔧 Development Features

### Code-Qualität
- **TypeScript-ähnliche Validierung**: Pydantic-Schemas
- **Modulare Architektur**: Klare Trennung der Verantwortlichkeiten
- **Error Handling**: Umfassende Fehlerbehandlung
- **Logging**: Debug-Informationen für Entwicklung

### Deployment & DevOps
- **Docker-native**: Vollständig containerisiert
- **Environment-Configs**: Development/Production-Modi
- **Health Checks**: Container-Überwachung
- **Volume-Persistierung**: Datenbank & Uploads überleben Container-Neustarts

### Sicherheit
- **JWT-Tokens**: Sichere Authentifizierung
- **Password-Hashing**: bcrypt für Passwort-Sicherheit
- **Role-based Access**: Granulare Berechtigungen
- **CORS-konfiguriert**: Sichere Frontend-Backend-Kommunikation
- **Input-Validierung**: Schutz vor Injection-Angriffen

---

## 📈 Projektfortschritt & Meilensteine

### ✅ Abgeschlossen
- [x] **Basis-Authentifizierung** - Login/Register-System
- [x] **Spiele-Management** - CRUD-Operationen für Entwickler
- [x] **Wunschliste-System** - Vollständig funktionsfähig
- [x] **Admin-Panel** - Benutzer- & Rollenverwaltung
- [x] **Docker-Setup** - Development & Production-Ready
- [x] **Responsive UI** - Mobile-freundliches Design
- [x] **Datenexport** - Admin-Tools für Berichte
- [x] **UTF-8-Support** - Internationale Zeichen (üäö)

### 🔧 Technische Highlights
- **Many-to-Many Relationships**: Komplexe Datenbankstrukturen
- **Real-time State Management**: React Hooks für Wunschliste
- **API-Integration**: Nahtlose Frontend-Backend-Kommunikation
- **Role-based Security**: Dreistufiges Berechtigungssystem
- **Container-Orchestrierung**: Multi-Service Docker Setup

---

## 🎯 Use Cases & Zielgruppen

### 🎮 Für Spieler
> *"Als Gamer möchte ich Indie-Spiele entdecken und verwalten"*
- Spiele durchsuchen und filtern
- Wunschliste für zukünftige Käufe
- Personalisierte Profile
- Download-Links für gekaufte Spiele

### 👨‍💻 Für Entwickler
> *"Als Indie-Entwickler möchte ich meine Spiele veröffentlichen"*
- Spiele-Upload mit Rich Metadata
- Entwurf/Veröffentlichung-Workflow
- Entwickler-Dashboard
- Verkaufsstatistiken (erweiterbar)

### 👑 Für Administratoren
> *"Als Platform-Administrator möchte ich das System verwalten"*
- Benutzer- und Rollenverwaltung
- Datenexporte für Analysen
- System-Überwachung
- Content-Moderation

---

## 🚀 Zukunftserweiterungen

### Geplante Features
- **🛒 E-Commerce**: Bezahlsystem-Integration
- **📝 Reviews**: Spieler-Bewertungen & Kommentare
- **🏆 Achievements**: Erfolgs-System
- **👥 Community**: Freunde, Gruppen, Chat
- **📊 Analytics**: Detaillierte Nutzer-Statistiken
- **🔍 Erweiterte Suche**: Filter, Tags, Kategorien
- **📱 Mobile App**: Native iOS/Android Apps

### Skalierung
- **Database**: Migration zu PostgreSQL
- **CDN**: Asset-Delivery-Network
- **Microservices**: Service-Aufspaltung
- **Caching**: Redis für Performance
- **Load Balancing**: Horizontal Scaling

---

## 📊 Projektergebnis

**Indie Hub** ist eine **production-ready Gaming-Plattform** mit:

✨ **Vollständiger Funktionalität** - Alle Core-Features implementiert  
🏗️ **Solide Architektur** - Skalierbar und wartbar  
🔒 **Enterprise-Sicherheit** - JWT, Hashing, Validierung  
📱 **Modernes UI/UX** - Responsive, intuitiv, ansprechend  
🐳 **DevOps-Ready** - Containerisiert mit Docker  
👥 **Multi-User-System** - Rollen, Berechtigungen, Verwaltung  

> **"Ein komplettes, professionelles Gaming-Platform-Projekt, das moderne Webentwicklung mit durchdachter Benutzerführung verbindet."**

---

*Entwickelt mit ❤️ für die Indie-Gaming-Community*  
**© 2025 Indie Hub - Inspired by Steam and Sezuma*