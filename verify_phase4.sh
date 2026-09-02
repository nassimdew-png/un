#!/usr/bin/env bash
set -e

echo "=== [1/3] Login as Tenant 1 (Orthophonie Alger) ==="
LOGIN_RES=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@elbiar-ortho.dz","password":"password123","subdomain":"elbiar-ortho"}')

TOKEN=$(echo "$LOGIN_RES" | jq -r .access_token)
echo "Obtained Token: $TOKEN"

echo "=== [2/3] Fetching Clinical Assessments ==="
curl -s -X GET http://127.0.0.1:8000/api/assessments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{total: .total, data: [.data[] | {id: .id, title: .title, patient: (.patient.first_name + " " + .patient.last_name), type: .type, specialist: .specialist.name}]}'

echo "=== [3/3] Testing PDF Generation ==="
PDF_HEADER=$(curl -s -X GET http://127.0.0.1:8000/api/assessments/1/pdf \
  -H "Authorization: Bearer $TOKEN" | head -c 20)

echo "PDF Output Header: $PDF_HEADER"
if [[ "$PDF_HEADER" == *"%PDF"* ]]; then
    echo "SUCCESS: PDF generated valid %PDF format!"
else
    echo "FAILED: Expected %PDF header"
fi
