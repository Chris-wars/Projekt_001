# Indie Game Platform - Frontend Dockerfile
# Multi-stage build für optimierte Production-Builds

# Build Stage - Node.js für React Build
FROM node:20-bookworm-slim AS build

# Metadata
LABEL maintainer="Projekt Team <support@indiegameplatform.com>"
LABEL description="React Frontend für Indie Game Platform"
LABEL version="1.0.0"

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package files kopieren für bessere Cache-Nutzung
COPY package*.json ./

# Dependencies installieren
RUN npm ci

# System-Pakete aktualisieren, um Sicherheitslücken zu schließen
RUN apt-get update && apt-get upgrade -y

# Source Code aus dem client-Ordner kopieren
COPY . .

# React App builden
RUN npm run build

# Production Stage - Nginx für Static File Serving
FROM nginx:latest AS production


# Nginx Konfiguration und Entrypoint kopieren
COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Build Artifacts von build stage kopieren
COPY --from=build /app/build /usr/share/nginx/html

# Health Check Script
RUN echo '#!/bin/sh' > /health-check.sh && \
    echo 'wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1' >> /health-check.sh && \
    chmod +x /health-check.sh

# Port freigeben
EXPOSE 80

# Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /health-check.sh


# Entrypoint für dynamische nginx.conf
ENTRYPOINT ["/docker-entrypoint.sh"]