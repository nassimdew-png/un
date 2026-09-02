#!/usr/bin/env bash
set -e

echo "=== [1/4] Superadmin Login ==="
LOGIN_RES=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"superadmin@clinic-saas.dz","password":"password123"}')

TOKEN=$(echo "$LOGIN_RES" | jq -r .access_token)
echo "Superadmin Token obtained: $TOKEN"

echo "=== [2/4] Fetching System Metrics ==="
curl -s -X GET http://127.0.0.1:8000/api/superadmin/metrics \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq .

echo "=== [3/4] Provisioning New Clinic (Tenant + Admin) ==="
PROVISION_RES=$(curl -s -X POST http://127.0.0.1:8000/api/superadmin/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Cabinet Orthophonie Annaba",
    "subdomain": "annaba-ortho",
    "type": "orthophony",
    "plan": "pro",
    "admin_name": "Dr. Ryad Saidi",
    "admin_email": "admin@annaba-ortho.dz",
    "admin_phone": "0550998877",
    "admin_password": "password123",
    "city": "Annaba",
    "address": "Cours de la Révolution, Annaba"
  }')

echo "$PROVISION_RES" | jq .

echo "=== [4/4] Listing Database Backups ==="
curl -s -X GET http://127.0.0.1:8000/api/superadmin/backups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq .
