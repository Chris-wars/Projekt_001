# Indie Game Platform - Frontend Dockerfile
# Multi-stage build für optimierte Production-Builds

# Build Stage - Node.js für React Build
FROM node:20-alpine AS build

# Metadata
LABEL maintainer="Projekt Team <support@indiegameplatform.com>"
LABEL description="React Frontend für Indie Game Platform"
LABEL version="1.0.0"

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package files kopieren für bessere Cache-Nutzung
COPY package*.json ./

# Dependencies installieren
RUN npm ci --only=production

# Source Code kopieren
COPY . .

# React App builden
RUN npm run build

# Production Stage - Nginx für Static File Serving
FROM nginx:alpine AS production

# Nginx Konfiguration kopieren
COPY nginx.conf /etc/nginx/nginx.conf

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

# Nginx starten
CMD ["nginx", "-g", "daemon off;"]