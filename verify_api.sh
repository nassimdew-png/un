#!/usr/bin/env bash
set -e

cd /var/www/clinic-saas/backend

# Start Laravel development server in background if not already running on port 8000
if ! lsof -i :8000 > /dev/null 2>&1; then
    nohup php artisan serve --host=127.0.0.1 --port=8000 > /tmp/laravel_serve.log 2>&1 &
    sleep 2
fi

echo "=================================================="
echo "TEST 1: Login as Tenant 1 Admin (Orthophonie Alger)"
echo "=================================================="
LOGIN_RESP_1=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@elbiar-ortho.dz","password":"password123","subdomain":"elbiar-ortho"}')

echo "$LOGIN_RESP_1" | jq .

TOKEN_1=$(echo "$LOGIN_RESP_1" | jq -r '.access_token')

echo ""
echo "=================================================="
echo "TEST 2: GET /api/auth/me (Orthophonie Alger)"
echo "=================================================="
curl -s -X GET http://127.0.0.1:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN_1" \
  -H "Accept: application/json" | jq .

echo ""
echo "=================================================="
echo "TEST 3: GET /api/patients (Tenant 1 - Orthophonie Patients)"
echo "=================================================="
curl -s -X GET http://127.0.0.1:8000/api/patients \
  -H "Authorization: Bearer $TOKEN_1" \
  -H "Accept: application/json" | jq '{total: .total, data: [.data[] | {id: .id, name: (.first_name + " " + .last_name), phone: .phone, reason: .anamnesis_data.consultation_reason}]}'

echo ""
echo "=================================================="
echo "TEST 4: POST /api/patients (Create New Patient in Tenant 1)"
echo "=================================================="
CREATE_PATIENT_RESP=$(curl -s -X POST http://127.0.0.1:8000/api/patients \
  -H "Authorization: Bearer $TOKEN_1" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "first_name": "Tarek",
    "last_name": "Zerrouki",
    "birth_date": "2018-10-12",
    "gender": "male",
    "guardian_name": "Farouk Zerrouki",
    "phone": "0669876543",
    "emergency_contact": "0770554433",
    "kiosk_pin": "654321",
    "anamnesis_data": {
      "consultation_reason": "Bégaiement et trouble du rythme",
      "speech_assessment": "Hésitations verbales fréquentes"
    }
  }')

echo "$CREATE_PATIENT_RESP" | jq .

echo ""
echo "=================================================="
echo "TEST 5: Login as Tenant 2 Admin (Psychologie Oran)"
echo "=================================================="
LOGIN_RESP_2=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@oran-psy.dz","password":"password123","subdomain":"oran-psy"}')

echo "$LOGIN_RESP_2" | jq .

TOKEN_2=$(echo "$LOGIN_RESP_2" | jq -r '.access_token')

echo ""
echo "=================================================="
echo "TEST 6: GET /api/patients (Tenant 2 - Isolation Verification)"
echo "=================================================="
curl -s -X GET http://127.0.0.1:8000/api/patients \
  -H "Authorization: Bearer $TOKEN_2" \
  -H "Accept: application/json" | jq '{total: .total, data: [.data[] | {id: .id, name: (.first_name + " " + .last_name), phone: .phone, reason: .anamnesis_data.consultation_reason}]}'

echo ""
echo "=================================================="
echo "TEST 7: Logout Tenant 1"
echo "=================================================="
curl -s -X POST http://127.0.0.1:8000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN_1" \
  -H "Accept: application/json" | jq .
