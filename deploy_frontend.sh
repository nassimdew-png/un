#!/usr/bin/env bash
set -e

echo "=== [1/4] Unpacking frontend files ==="
mkdir -p /var/www/clinic-saas
tar -xzf /tmp/frontend.tar.gz -C /var/www/clinic-saas
cd /var/www/clinic-saas/frontend

echo "=== [2/4] Installing dependencies ==="
npm install

echo "=== [3/4] Building production bundle ==="
npm run build

echo "=== [4/4] Starting Vite preview on port 3001 ==="
pkill -f 'vite preview' || true
nohup npx vite preview --host 0.0.0.0 --port 3001 > /var/log/frontend.log 2>&1 &
sleep 2

echo "=== Verifying Local Port 3001 ==="
curl -s -I http://127.0.0.1:3001 | head -n 5

echo "=== Verifying Public Traefik URL https://145.223.116.54.nip.io/ ==="
curl -s -k -I https://145.223.116.54.nip.io/ | head -n 5

echo "=== ALL FRONTEND DEPLOYMENT TASKS COMPLETED ==="
