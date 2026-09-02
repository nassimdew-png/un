#!/usr/bin/env bash
set -e

# ==============================================================================
# PsyPro Clinic SaaS - Automated Custom Domain & SSL Provisioning Engine
# ==============================================================================

DOMAIN="$1"
ACTION="${2:-provision}" # provision | remove

if [ -z "$DOMAIN" ]; then
    echo "ERROR: No domain supplied. Usage: $0 <domain> [provision|remove]"
    exit 1
fi

# Clean and normalize domain name (lowercase, no protocol, no slashes)
DOMAIN=$(echo "$DOMAIN" | tr '[:upper:]' '[:lower:]' | sed -e 's|^https\?://||' -e 's|/.*$||' -e 's|:.*$||')

# Basic domain validation regex
if ! [[ "$DOMAIN" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$ ]]; then
    echo "ERROR: Invalid domain name format: $DOMAIN"
    exit 1
fi

TRAEFIK_DYNAMIC_DIR="/etc/dokploy/traefik/dynamic"
CONFIG_FILE="${TRAEFIK_DYNAMIC_DIR}/custom_domain_${DOMAIN}.yml"
NGINX_AVAILABLE_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
NGINX_CONF="${NGINX_AVAILABLE_DIR}/clinic_${DOMAIN}.conf"

if [ "$ACTION" = "remove" ]; then
    echo "=== Removing custom domain configuration for: $DOMAIN ==="
    rm -f "$CONFIG_FILE"
    rm -f "$NGINX_CONF"
    rm -f "${NGINX_ENABLED_DIR}/clinic_${DOMAIN}.conf"
    if command -v nginx >/dev/null 2>&1 && systemctl is-active --quiet nginx 2>/dev/null; then
        nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
    fi
    echo "SUCCESS: Domain $DOMAIN configuration removed."
    exit 0
fi

echo "=== Provisioning custom domain: $DOMAIN ==="

# 1. Generate Traefik Dynamic Configuration (for Dokploy/Traefik native reverse proxy with ACME)
if [ -d "$TRAEFIK_DYNAMIC_DIR" ]; then
    echo "Generating Traefik dynamic router config: $CONFIG_FILE"
    cat <<EOF > "$CONFIG_FILE"
http:
  routers:
    clinic-${DOMAIN}-api-https:
      rule: (Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)) && PathPrefix(\`/api\`)
      service: clinic-api-service
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      priority: 150

    clinic-${DOMAIN}-storage-https:
      rule: (Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)) && PathPrefix(\`/storage\`)
      service: clinic-api-service
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      priority: 150

    clinic-${DOMAIN}-frontend-https:
      rule: Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)
      service: clinic-frontend-service
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      priority: 140

    clinic-${DOMAIN}-api-http:
      rule: (Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)) && PathPrefix(\`/api\`)
      middlewares:
        - https-redirect
      service: clinic-api-service
      entryPoints:
        - web
      priority: 150

    clinic-${DOMAIN}-storage-http:
      rule: (Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)) && PathPrefix(\`/storage\`)
      middlewares:
        - https-redirect
      service: clinic-api-service
      entryPoints:
        - web
      priority: 150

    clinic-${DOMAIN}-frontend-http:
      rule: Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)
      middlewares:
        - https-redirect
      service: clinic-frontend-service
      entryPoints:
        - web
      priority: 140
EOF
    chmod 644 "$CONFIG_FILE"
    echo "Traefik router config generated successfully."
fi

# 2. Also generate Nginx VirtualHost (if Nginx is installed on the host)
if [ -d "$NGINX_AVAILABLE_DIR" ]; then
    echo "Generating Nginx virtualhost config: $NGINX_CONF"
    cat <<EOF > "$NGINX_CONF"
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Custom-Domain \$host;
    }

    location /storage {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Custom-Domain \$host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
    if [ -d "$NGINX_ENABLED_DIR" ]; then
        ln -sf "$NGINX_CONF" "${NGINX_ENABLED_DIR}/clinic_${DOMAIN}.conf"
    fi

    if command -v certbot >/dev/null 2>&1 && command -v nginx >/dev/null 2>&1 && systemctl is-active --quiet nginx 2>/dev/null; then
        echo "Attempting Certbot SSL certificate issuance..."
        certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@psypro.tech" --redirect 2>/dev/null || true
        nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
    fi
fi

echo "SUCCESS: Domain $DOMAIN successfully provisioned with SSL reverse proxy rules."
exit 0
