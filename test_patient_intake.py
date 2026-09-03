import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_patient_creation():
    print("=" * 60)
    print("🚀 TESTING TWO-STEP PATIENT INTAKE & DEEP ANAMNESIS")
    print("=" * 60)
    
    # 1. Login as Clinic Admin
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@elbiar-ortho.dz",
        "password": "password123"
    })
    
    if login_res.status_code != 200:
        print("Login failed:", login_res.text)
        return
        
    token = login_res.json().get("access_token")
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    # 2. Comprehensive Intake & Anamnesis Payload
    payload = {
        "first_name": "إلياس",
        "last_name": "عماري",
        "gender": "male",
        "birth_date": "2021-04-15",
        "phone": "0550123456",
        "phone_operator": "ooredoo",
        "guardian_name": "فريد عماري",
        "consultation_reason": "تأخر لغوي وتشتت انتباه في الروضة",
        "school_name": "روضة براعم الأمل - الأبيار",
        "school_grade": "قسم تحضيري",
        "anamnesis_data": {
            "consultation_reason": "تأخر لغوي وتشتت انتباه في الروضة",
            "urgency_level": "routine",
            "guardian_relation": "father",
            "perinatal": {
                "pregnancy_term": "full_term",
                "gestational_weeks": 39,
                "delivery_type": "natural",
                "birth_cry": "immediate",
                "neonatal_anoxia": False,
                "incubator_stay": False,
                "birth_weight_kg": 3.4
            },
            "milestones": {
                "sitting_age_months": 6,
                "crawling_age_months": 8,
                "walking_age_months": 13,
                "sphincter_day_months": 26,
                "sphincter_night_months": 32,
                "babbling_age_months": 6,
                "first_words_age_months": 16,
                "first_sentences_age_months": 28
            },
            "organic_exams": {
                "hearing": {"status": "normal", "notes": "فحص PEA سليم بالأذن والمخ"},
                "eeg": {"status": "normal", "notes": "تخطيط دماغ سليم"},
                "vision": {"status": "normal", "notes": "فحص نظر طبيعي"}
            },
            "family_context": {
                "home_languages": ["darja", "french"],
                "sibling_rank": "first_born",
                "siblings_count": 2,
                "consanguinity": "none",
                "daily_screen_hours": 3,
                "screen_start_age_months": 14
            },
            "school_context": {
                "school_name": "روضة براعم الأمل - الأبيار",
                "school_grade": "قسم تحضيري",
                "schooling_type": "regular",
                "teacher_complaints": ["تشتت الانتباه وعدم التركيز", "صعوبة في تعلم الحروف"]
            },
            "referral": {
                "referred_by_type": "pediatrician",
                "referred_by_name": "د. بن ناصر - مستشفى مصطفى باشا",
                "parallel_followups": ["psychomotrician"],
                "initial_complaint": "تأخر لغوي وتشتت انتباه"
            }
        }
    }
    
    r = requests.post(f"{BASE_URL}/patients", json=payload, headers=headers)
    print("HTTP Status:", r.status_code)
    if r.status_code == 201:
        data = r.json()
        patient = data.get("patient", {})
        print("✅ Patient successfully registered!")
        print("   ID:", patient.get("id"))
        print("   Name:", f"{patient.get('first_name')} {patient.get('last_name')}")
        print("   Gender:", patient.get("gender"), "| DOB:", patient.get("birth_date"))
        print("   Guardian:", patient.get("guardian_name"), "| Phone:", patient.get("phone"))
        print("   Perinatal Info:", json.dumps(patient.get("anamnesis_data", {}).get("perinatal"), ensure_ascii=False))
        print("   Family Languages:", json.dumps(patient.get("anamnesis_data", {}).get("family_context", {}).get("home_languages"), ensure_ascii=False))
        print("   School Info:", json.dumps(patient.get("anamnesis_data", {}).get("school_context"), ensure_ascii=False))
        print("   Medical Referral:", json.dumps(patient.get("anamnesis_data", {}).get("referral"), ensure_ascii=False))
    else:
        print("❌ Error:", r.text)

if __name__ == "__main__":
    test_patient_creation()
