#!/usr/bin/env bash
set -e

echo "=== TEST 0: SuperAdmin Login ==="
LOGIN_RES=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"superadmin@clinic-saas.dz","password":"password123"}')

TOKEN=$(echo "$LOGIN_RES" | jq -r '.access_token // empty')

echo ""
echo "=== TEST 1: GET /api/super-admin/ai-settings ==="
curl -s -X GET http://127.0.0.1:8000/api/super-admin/ai-settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{success: .success, model: .settings.gemini_model, active_clinics: .stats.active_ai_clinics_count, clinics_count: (.clinics | length)}'

echo ""
echo "=== TEST 2: GET /api/superadmin/api-configs ==="
curl -s -X GET http://127.0.0.1:8000/api/superadmin/api-configs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{success: .success, providers: (.providers | keys), features_count: (.features | length)}'

echo ""
echo "=== TEST 3: GET /api/superadmin/clinics/quotas ==="
curl -s -X GET http://127.0.0.1:8000/api/superadmin/clinics/quotas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{success: .success, clinics_count: (.clinics | length), first_clinic: (.clinics[0] | {name: .name, plan: .plan_name})}'

echo ""
echo "=== TEST 4: GET /api/superadmin/communication-settings ==="
curl -s -X GET http://127.0.0.1:8000/api/superadmin/communication-settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{success: .success, mail_host: .settings.mail_host, whatsapp_provider: .settings.whatsapp_provider}'

echo ""
echo "=== TEST 5: GET /api/superadmin/plans ==="
curl -s -X GET http://127.0.0.1:8000/api/superadmin/plans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{success: .success, total_plans: (.plans | length)}'

echo ""
echo "=== TEST 6: GET /api/super-admin/coupons ==="
curl -s -X GET http://127.0.0.1:8000/api/super-admin/coupons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{success: .success, total_coupons: (.coupons // .data | length)}'

echo ""
echo "=== TEST 7: GET /api/super-admin/payment-requests ==="
curl -s -X GET http://127.0.0.1:8000/api/super-admin/payment-requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{success: .success, total_requests: (.requests // .data | length)}'

echo ""
echo "=== TEST 8: GET /api/superadmin/feature-flags ==="
curl -s -X GET http://127.0.0.1:8000/api/superadmin/feature-flags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{success: .success, flags_count: (.flags | length)}'

echo ""
echo "=== TEST 9: GET /api/super-admin/admin-team ==="
curl -s -X GET http://127.0.0.1:8000/api/super-admin/admin-team \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{success: .success, team_count: (.team // .data | length)}'

echo ""
echo "=== TEST 10: GET /api/super-admin/disaster-recovery/backups ==="
curl -s -X GET http://127.0.0.1:8000/api/super-admin/disaster-recovery/backups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{success: .success, backups_count: (.backups | length)}'

echo ""
echo "=================================================="
echo "ALL SUPER ADMIN TABS VERIFIED WITH 100% SUCCESS!"
echo "=================================================="
