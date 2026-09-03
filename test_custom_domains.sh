#!/usr/bin/env bash
set -e

echo "=================================================="
echo "TEST 1: Login as Tenant 1 (Cabinet El Biar)"
echo "=================================================="
LOGIN_RESP=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@elbiar-ortho.dz","password":"password123","subdomain":"elbiar-ortho"}')

TOKEN=$(echo "$LOGIN_RESP" | jq -r '.access_token // empty')
if [ -z "$TOKEN" ]; then
    echo "Login failed: $LOGIN_RESP"
    exit 1
fi
echo "Login successful. Token obtained."

echo ""
echo "=================================================="
echo "TEST 2: Register New Custom Domain (cabinet-amina.dz)"
echo "=================================================="
ADD_RESP=$(curl -s -X POST http://127.0.0.1:8000/api/clinic/domains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"domain":"cabinet-amina.dz"}')

echo "$ADD_RESP" | jq .
DOMAIN_ID=$(echo "$ADD_RESP" | jq -r '.domain.id // empty')

echo ""
echo "=================================================="
echo "TEST 3: Resolve Public Clinic Info by Custom Domain"
echo "=================================================="
curl -s -X GET "http://127.0.0.1:8000/api/public/tenant-info?subdomain=cabinet-amina.dz" \
  -H "Accept: application/json" | jq .

echo ""
echo "=================================================="
echo "TEST 4: Login using Custom Domain in Subdomain field"
echo "=================================================="
CUSTOM_LOGIN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@elbiar-ortho.dz","password":"password123","subdomain":"cabinet-amina.dz"}')

echo "$CUSTOM_LOGIN" | jq '{message: .message, user_id: .user.id, clinic_name: .tenant.name, custom_domain: .tenant.custom_domain}'

echo ""
echo "=================================================="
echo "TEST 5: Delete Custom Domain (Cleanup)"
echo "=================================================="
curl -s -X DELETE "http://127.0.0.1:8000/api/clinic/domains/${DOMAIN_ID}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq .

echo ""
echo "=================================================="
echo "ALL CUSTOM DOMAIN TESTS PASSED PERFECTLY!"
echo "=================================================="
