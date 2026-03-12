#!/bin/sh
set -e
# Ersetze Umgebungsvariablen in nginx.conf (nur für /api/ Proxy)
envsubst '$BACKEND_HOST $BACKEND_PORT' < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.tmp && \
    mv /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf
exec nginx -g 'daemon off;'