#!/usr/bin/env bash
# ==============================================================================
# PsyPro SaaS - Custom Domain Deprovisioner
# Usage: sudo /usr/local/bin/remove-clinic-domain.sh <domain_name>
# ==============================================================================

set -e

DOMAIN="$1"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
CONF_FILE="${NGINX_AVAILABLE}/clinic_${DOMAIN}.conf"
LINK_FILE="${NGINX_ENABLED}/clinic_${DOMAIN}.conf"

if [ -z "$DOMAIN" ]; then
    echo "[ERROR] Missing domain argument. Usage: $0 <domain_name>" >&2
    exit 1
fi

DOMAIN=$(echo "$DOMAIN" | sed -e 's|^[^/]*//||' -e 's|/.*$||' | tr '[:upper:]' '[:lower:]')

echo "[INFO] Removing Nginx configuration for domain: $DOMAIN..."

rm -f "$LINK_FILE" "$CONF_FILE"

# Revoke or delete Let's Encrypt certificate if present
if command -v certbot >/dev/null 2>&1; then
    certbot delete --cert-name "$DOMAIN" --non-interactive 2>/dev/null || true
fi

# Test and reload Nginx
if nginx -t 2>/dev/null; then
    systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || true
    echo "[SUCCESS] Domain $DOMAIN removed successfully."
    exit 0
else
    echo "[WARNING] Nginx test had issues after removing domain $DOMAIN." >&2
    exit 1
fi
