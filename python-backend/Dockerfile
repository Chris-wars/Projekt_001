# Indie Game Platform - Backend Dockerfile
# Multi-stage build für optimale Container-Größe und Sicherheit

FROM python:3.11-slim as base

# Metadata
LABEL maintainer="Projekt Team <support@indiegameplatform.com>"
LABEL description="FastAPI Backend für Indie Game Platform"
LABEL version="1.0.0"

# Umgebungsvariablen
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Arbeitsverzeichnis setzen
WORKDIR /app

# System-Dependencies installieren
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python Dependencies Stage
FROM base as dependencies

# Requirements kopieren und installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production Stage
FROM base as production

# Non-root User erstellen für Sicherheit
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Dependencies von dependencies stage kopieren
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Anwendungscode kopieren
COPY . .

# Verzeichnisse für Uploads und Datenbank erstellen
RUN mkdir -p /app/uploads/avatars /app/data \
    && chown -R appuser:appuser /app

# Port freigeben
EXPOSE 8000

# User wechseln
USER appuser

# Health Check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Startbefehl
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]