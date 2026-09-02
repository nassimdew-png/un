#!/usr/bin/env bash
set -e

echo "=== Step 1 & 2: Inspect Networks and Gateway IPs of dokploy-traefik ==="
docker inspect dokploy-traefik | jq -r '.[0].NetworkSettings.Networks | to_entries[] | "Network: \(.key) -> IP: \(.value.IPAddress) | Gateway: \(.value.Gateway)"'

# Ensure bridge network is connected so Traefik can talk to host
docker network connect bridge dokploy-traefik 2>/dev/null || true

echo "=== Connected Networks after ensuring bridge ==="
docker inspect dokploy-traefik | jq -r '.[0].NetworkSettings.Networks | to_entries[] | "Network: \(.key) -> IP: \(.value.IPAddress) | Gateway: \(.value.Gateway)"'

# Get the bridge Gateway IP
BRIDGE_GW=$(docker inspect dokploy-traefik | jq -r '.[0].NetworkSettings.Networks.bridge.Gateway // empty')
if [ -z "$BRIDGE_GW" ]; then
    BRIDGE_GW="172.16.0.1"
fi

echo "Exact Bridge Gateway IP: $BRIDGE_GW"

# Ensure Laravel serve is running on 0.0.0.0:8000
pkill -f 'artisan serve' || true
nohup php /var/www/clinic-saas/backend/artisan serve --host=0.0.0.0 --port=8000 > /tmp/laravel_serve.log 2>&1 &
sleep 2

echo "=== Step 3: Updating /etc/dokploy/traefik/dynamic/clinic-saas.yml ==="
mkdir -p /etc/dokploy/traefik/dynamic
cat << YML > /etc/dokploy/traefik/dynamic/clinic-saas.yml
http:
  routers:
    # 1. API Router (Laravel Backend)
    clinic-api:
      rule: "Host(\`145.223.116.54.nip.io\`) && PathPrefix(\`/api\`)"
      service: clinic-api-service
      entryPoints:
        - web
      priority: 100

    # 2. Frontend Router (React Frontend)
    clinic-frontend:
      rule: "Host(\`145.223.116.54.nip.io\`)"
      service: clinic-frontend-service
      entryPoints:
        - web
      priority: 10

  services:
    clinic-api-service:
      loadBalancer:
        servers:
          - url: "http://${BRIDGE_GW}:8000"

    clinic-frontend-service:
      loadBalancer:
        servers:
          - url: "http://${BRIDGE_GW}:3001"
YML

cat /etc/dokploy/traefik/dynamic/clinic-saas.yml

echo "=== Step 4: Testing Connectivity from inside Traefik ==="
docker exec dokploy-traefik wget -qO- "http://${BRIDGE_GW}:8000/up" || true
docker exec dokploy-traefik wget -qO- "http://${BRIDGE_GW}:8000/api/auth/me" || true

echo "=== Step 5: Testing Traefik Routing through Port 80 ==="
curl -s -o /dev/null -w "HTTP Code from Traefik: %{http_code}\n" -H "Host: 145.223.116.54.nip.io" http://127.0.0.1/api/auth/me
