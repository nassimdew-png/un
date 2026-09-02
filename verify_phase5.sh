#!/usr/bin/env bash
set -e

echo "=== [1/4] Testing Kiosk Check-In ==="
curl -s -X POST http://127.0.0.1:8000/api/kiosk/check-in \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"kiosk_pin":"123456","subdomain":"elbiar-ortho"}' | jq .

echo "=== [2/4] Testing Appointments List ==="
LOGIN_RES=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@elbiar-ortho.dz","password":"password123","subdomain":"elbiar-ortho"}')

TOKEN=$(echo "$LOGIN_RES" | jq -r .access_token)

curl -s -X GET http://127.0.0.1:8000/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{total: .total, data: [.data[] | {id: .id, patient: (.patient.first_name + " " + .patient.last_name), date: .appointment_date, status: .status}]}'

echo "=== [3/4] Testing Invoices List & Summary ==="
curl -s -X GET http://127.0.0.1:8000/api/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '{summary: .summary, total_invoices: .invoices.total, invoices: [.invoices.data[] | {number: .invoice_number, patient: (.patient.first_name + " " + .patient.last_name), amount: .total_amount, status: .payment_status, method: .payment_method}]}'

echo "=== [4/4] Testing Receipt PDF Export ==="
PDF_HEADER=$(curl -s -X GET http://127.0.0.1:8000/api/invoices/1/pdf \
  -H "Authorization: Bearer $TOKEN" | head -c 20)

echo "Receipt PDF Header: $PDF_HEADER"
if [[ "$PDF_HEADER" == *"%PDF"* ]]; then
    echo "SUCCESS: Receipt PDF generated valid %PDF format!"
else
    echo "FAILED: Expected %PDF header"
fi
