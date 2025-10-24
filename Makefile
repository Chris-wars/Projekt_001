# Indie Game Platform - Docker Management
# Vereinfacht Docker-Operationen für Entwicklung und Deployment

.PHONY: help build up down logs clean dev prod restart

# Standard Target
help:
	@echo "Indie Game Platform - Docker Commands"
	@echo "====================================="
	@echo "Development:"
	@echo "  make dev          - Starte Development Environment"
	@echo "  make dev-build    - Build Development Containers"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Starte Production Environment"
	@echo "  make build        - Build Production Containers"
	@echo ""
	@echo "Management:"
	@echo "  make up           - Starte alle Services"
	@echo "  make down         - Stoppe alle Services"
	@echo "  make restart      - Restart alle Services"
	@echo "  make logs         - Zeige Logs aller Services"
	@echo "  make logs-f       - Folge Logs (live)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - Entferne Container und Images"
	@echo "  make clean-all    - Entferne alles (inkl. Volumes)"

# Development Environment
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

dev-build:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml build

dev-down:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Production Environment  
prod:
	docker-compose --profile production up -d

build:
	docker-compose build

# Basic Management
up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs

logs-f:
	docker-compose logs -f

# Service-specific commands
backend-logs:
	docker-compose logs -f backend

frontend-logs:
	docker-compose logs -f frontend

# Cleanup
clean:
	docker-compose down --rmi all --remove-orphans

clean-all:
	docker-compose down --rmi all --volumes --remove-orphans
	docker system prune -f

# Database Management
db-backup:
	docker-compose exec backend sqlite3 /app/data/game_platform.db ".backup /app/data/backup-$(shell date +%Y%m%d-%H%M%S).db"

db-shell:
	docker-compose exec backend sqlite3 /app/data/game_platform.db

# Health Checks
health:
	@echo "=== Backend Health ==="
	@curl -s http://localhost:8000/health | jq .
	@echo ""
	@echo "=== Frontend Health ==="
	@curl -s http://localhost:3000/health