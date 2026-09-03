import requests

login = requests.post('http://127.0.0.1:8000/api/auth/login', json={'email':'admin@elbiar-ortho.dz', 'password':'password123'}).json()
token = login.get('access_token')
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'Accept': 'application/json'}

payload = {
    'patient_id': 28,
    'appointment_date': '2026-09-03',
    'start_time': '10:00',
    'type': 'consultation',
    'status': 'in_progress',
    'notes': 'جلسة علاجية فورية من ملف المريض'
}

res = requests.post('http://127.0.0.1:8000/api/appointments', json=payload, headers=headers)
print('Direct create status:', res.status_code)
print('Response:', res.json().get('message'), '| ID:', res.json().get('id'))
