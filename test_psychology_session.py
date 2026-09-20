import urllib.request
import json

BASE_URL = 'http://145.223.116.54:8000/api'

# 1. Login
login_data = json.dumps({'email': 'admin@elbiar-ortho.dz', 'password': 'password123'}).encode('utf-8')
req = urllib.request.Request(f'{BASE_URL}/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as response:
    login_res = json.loads(response.read().decode('utf-8'))

token = login_res.get('access_token')
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

# 2. Create specialized Psychology Session
payload = {
    'patient_id': 35,
    'session_date': '2026-09-04',
    'duration_minutes': 45,
    'specialty': 'psychology',
    'attendance_status': 'present',
    'exercises_targeted': [
        'المقابلة العيادية والتشخيص الأولي (Entretien Clinique)',
        'المسح الانفعالي والمزاجي (Mood & Affect)',
        'تطبيق المقاييس والاختبارات النفسية (Tests Psychométriques)'
    ],
    'progress_notes': '''[SOAP CLINICAL NOTES - علم النفس العيادي (Psychologie)]
• Subjective: صرح الولي بوجود تراجع ملحوظ في التركيز ونوبات غضب سريعة عند أداء الواجبات المدرسية.
• Objective:
[التقييم النفسي العيادي والحالة الانفعالية]:
• المزاج السائد: قلق ومتوتر | التحالف العلاجي: تعاون ممتاز ومتفاعل | التواصل البصري: طبيعي ومستمر
• الاستبصار بالمرض/المشكلة: استبصار كامل ووعي بالمشكلة
• آليات الدفاع الملاحظة: التبرير (Rationalisation)
• التقنية العلاجية المطبقة: إعادة الهيكلة المعرفية (CBT)
• المقياس النفسي المطبق: Conners (فرط الحركة وتشتت الانتباه TDAH) (الدرجة: 28 - الدلالة: درجة متوسطة)
• Assessment: مؤشرات قلق واضحة مع تشتت انتباه متوسط يستجيب لإعادة التنظيم وتعديل السلوك المعرفي.
• Plan: تطبيق جدول التعزيز الإيجابي وتكليف الولي بمراقبة نوبات الغضب وتسجيلها.''',
}

req = urllib.request.Request(f'{BASE_URL}/therapy-sessions', data=json.dumps(payload).encode('utf-8'), headers=headers)
with urllib.request.urlopen(req) as response:
    session_data = json.loads(response.read().decode('utf-8'))

print('Specialized Psychology Session created successfully!')
print('Session ID:', session_data.get('id') or session_data.get('data', {}).get('id'))

# 3. Fetch all sessions for patient 35
req = urllib.request.Request(f'{BASE_URL}/patients/35/sessions', headers=headers)
with urllib.request.urlopen(req) as response:
    list_res = json.loads(response.read().decode('utf-8'))

sessions = list_res.get('data', [])
print(f'Total sessions for patient 35: {len(sessions)}')
if sessions:
    latest = sessions[0]
    print(f'Latest session specialty: {latest.get("specialty")}')
    print(f'Targeted exercises: {latest.get("exercises_targeted")}')
