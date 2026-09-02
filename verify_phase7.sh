#!/usr/bin/env bash
set -e

echo "=== [1/3] Login as Tenant 1 ==="
LOGIN_RES=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@elbiar-ortho.dz","password":"password123","subdomain":"elbiar-ortho"}')

TOKEN=$(echo "$LOGIN_RES" | jq -r .access_token)

echo "=== [2/3] Uploading Test Audio/Document Attachment ==="
echo "Contenu du bilan orthophonique externe" > /tmp/bilan_externe.txt

UPLOAD_RES=$(curl -s -X POST http://127.0.0.1:8000/api/patients/1/attachments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  -F "file=@/tmp/bilan_externe.txt" \
  -F "category=medical_report" \
  -F "notes=Bilan ORL externe transmis par les parents")

echo "$UPLOAD_RES" | jq .

echo "=== [3/3] Listing Patient Attachments ==="
curl -s -X GET http://127.0.0.1:8000/api/patients/1/attachments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq .
