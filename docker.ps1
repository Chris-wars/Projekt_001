# Indie Game Platform - PowerShell Docker Management
# Windows-optimierte Alternative zum Makefile

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "Indie Game Platform - Docker Commands" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Development:" -ForegroundColor Yellow
    Write-Host "  .\docker.ps1 dev          - Starte Development Environment"
    Write-Host "  .\docker.ps1 dev-build    - Build Development Containers"
    Write-Host "  .\docker.ps1 dev-down     - Stoppe Development Environment"
    Write-Host ""
    Write-Host "Production:" -ForegroundColor Yellow
    Write-Host "  .\docker.ps1 prod         - Starte Production Environment"
    Write-Host "  .\docker.ps1 build        - Build Production Containers"
    Write-Host ""
    Write-Host "Management:" -ForegroundColor Yellow
    Write-Host "  .\docker.ps1 up           - Starte alle Services"
    Write-Host "  .\docker.ps1 down         - Stoppe alle Services"
    Write-Host "  .\docker.ps1 restart      - Restart alle Services"
    Write-Host "  .\docker.ps1 logs         - Zeige Logs aller Services"
    Write-Host "  .\docker.ps1 logs-f       - Folge Logs (live)"
    Write-Host ""
    Write-Host "Service-spezifisch:" -ForegroundColor Yellow
    Write-Host "  .\docker.ps1 backend-logs - Backend Logs"
    Write-Host "  .\docker.ps1 frontend-logs- Frontend Logs"
    Write-Host ""
    Write-Host "Cleanup:" -ForegroundColor Yellow
    Write-Host "  .\docker.ps1 clean        - Entferne Container und Images"
    Write-Host "  .\docker.ps1 clean-all    - Entferne alles (inkl. Volumes)"
    Write-Host ""
    Write-Host "Datenbank:" -ForegroundColor Yellow
    Write-Host "  .\docker.ps1 db-backup    - Backup der Datenbank"
    Write-Host "  .\docker.ps1 db-shell     - SQLite Shell"
    Write-Host ""
    Write-Host "Health Check:" -ForegroundColor Yellow
    Write-Host "  .\docker.ps1 health       - Prüfe Service Health"
}

switch ($Command.ToLower()) {
    "help" { Show-Help }
    
    # Development
    "dev" { 
        Write-Host "🚀 Starte Development Environment..." -ForegroundColor Green
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
    }
    "dev-build" { 
        Write-Host "🔨 Baue Development Containers..." -ForegroundColor Green
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
    }
    "dev-down" { 
        Write-Host "🛑 Stoppe Development Environment..." -ForegroundColor Yellow
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
    }
    
    # Production
    "prod" { 
        Write-Host "🏭 Starte Production Environment..." -ForegroundColor Green
        docker-compose --profile production up -d
    }
    "build" { 
        Write-Host "🔨 Baue Production Containers..." -ForegroundColor Green
        docker-compose build
    }
    
    # Basic Management
    "up" { 
        Write-Host "▶️ Starte alle Services..." -ForegroundColor Green
        docker-compose up -d
    }
    "down" { 
        Write-Host "⏹️ Stoppe alle Services..." -ForegroundColor Yellow
        docker-compose down
    }
    "restart" { 
        Write-Host "🔄 Starte Services neu..." -ForegroundColor Yellow
        docker-compose restart
    }
    "logs" { 
        Write-Host "📋 Zeige Logs..." -ForegroundColor Blue
        docker-compose logs
    }
    "logs-f" { 
        Write-Host "📋 Folge Logs (Strg+C zum Beenden)..." -ForegroundColor Blue
        docker-compose logs -f
    }
    
    # Service-specific
    "backend-logs" { 
        Write-Host "📋 Backend Logs (Strg+C zum Beenden)..." -ForegroundColor Blue
        docker-compose logs -f backend
    }
    "frontend-logs" { 
        Write-Host "📋 Frontend Logs (Strg+C zum Beenden)..." -ForegroundColor Blue
        docker-compose logs -f frontend
    }
    
    # Cleanup
    "clean" { 
        Write-Host "🧹 Räume Container und Images auf..." -ForegroundColor Red
        docker-compose down --rmi all --remove-orphans
    }
    "clean-all" { 
        Write-Host "🧹 Räume alles auf (inkl. Volumes)..." -ForegroundColor Red
        docker-compose down --rmi all --volumes --remove-orphans
        docker system prune -f
    }
    
    # Database
    "db-backup" { 
        $backup_name = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').db"
        Write-Host "💾 Erstelle Datenbank-Backup: $backup_name" -ForegroundColor Green
        docker-compose exec backend sqlite3 /app/data/game_platform.db ".backup /app/data/$backup_name"
    }
    "db-shell" { 
        Write-Host "🗄️ Öffne SQLite Shell..." -ForegroundColor Blue
        docker-compose exec backend sqlite3 /app/data/game_platform.db
    }
    
    # Health Check
    "health" { 
        Write-Host "🏥 Prüfe Service Health..." -ForegroundColor Green
        Write-Host "=== Backend Health ===" -ForegroundColor Yellow
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
            $response | ConvertTo-Json -Depth 3
        } catch {
            Write-Host "❌ Backend nicht erreichbar" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "=== Frontend Health ===" -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Frontend ist gesund" -ForegroundColor Green
            }
        } catch {
            Write-Host "❌ Frontend nicht erreichbar" -ForegroundColor Red
        }
    }
    
    default { 
        Write-Host "❌ Unbekannter Befehl: $Command" -ForegroundColor Red
        Write-Host "Verwende '.\docker.ps1 help' für verfügbare Befehle." -ForegroundColor Yellow
    }
}