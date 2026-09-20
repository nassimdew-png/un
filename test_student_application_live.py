import urllib.request
import urllib.parse
import json
import ssl
import sys
import uuid

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_URL = "https://psypro.tech"

def test_student_registration():
    print("=== Testing Student Offer Application Submission ===")
    unique_id = uuid.uuid4().hex[:6]
    student_email = f"student_{unique_id}@test-univ.dz"
    student_phone = "0550123456"
    
    payload = {
        "student_name": f"طالب تجريبي {unique_id}",
        "email": student_email,
        "phone": student_phone,
        "password": "Password123!",
        "university_name": "جامعة الجزائر 2 - بوزريعة",
        "faculty": "كلية العلوم الاجتماعية",
        "specialty": "orthophonie",
        "degree_level": "master_m2",
        "clinic_name": f"عيادة تدريب الأرطوفونيا {unique_id}"
    }

    req = urllib.request.Request(
        f"{BASE_URL}/api/public/student-offer/apply",
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0"
        }
    )

    try:
        with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("Submission Status Code:", resp.status)
            print("Response:", json.dumps(data, ensure_ascii=False, indent=2))
            assert data.get('success') is True, "Submission failed"
            print("\n✅ Student successfully registered for 9 months free!")
            print("Student Email:", student_email)
            print("Sandbox Tenant ID:", data.get('sandbox_tenant_id'))
            print("Discount Code:", data.get('discount_code'))
            return student_email, "Password123!"
    except urllib.error.HTTPError as he:
        print("HTTP Error:", he.code)
        print("Body:", he.read().decode('utf-8'))
        raise
    except Exception as e:
        print("Error submitting application:", e)
        raise

if __name__ == '__main__':
    email, pwd = test_student_registration()
