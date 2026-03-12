# Indie Game Platform - Backend Dockerfile
# Stage 1: Builder-Phase zum Kompilieren von Abhängigkeiten
FROM python:3.12-slim-bookworm AS builder

# Metadaten
LABEL maintainer="Projekt Team <support@indiegameplatform.com>"
LABEL description="FastAPI Backend für Indie Game Platform"
LABEL version="1.1.0"

# Umgebungsvariablen
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# System-Abhängigkeiten für die Build-Phase installieren
RUN apt-get update && apt-get install -y --no-install-recommends gcc

# Ein virtuelles Environment erstellen
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Finale, produktive Phase mit Standard-Python-Image
FROM python:3.12-slim-bookworm

# Umgebungsvariablen für die Laufzeit
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

# Arbeitsverzeichnis setzen
WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY . .

# Port freigeben
EXPOSE 8000

# Startbefehl
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]