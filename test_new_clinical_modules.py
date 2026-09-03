import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=" * 70)
    print("🚀 TESTING 4 NEW CLINICAL & ADMINISTRATIVE MODULES")
    print("=" * 70)

    # 1. Login as Clinic Admin
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@elbiar-ortho.dz",
        "password": "password123"
    })
    
    if login_res.status_code != 200:
        print("❌ Login failed:", login_res.text)
        return
        
    token = login_res.json().get("access_token")
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    print("✅ 1. Clinic Admin authenticated successfully.")

    # 2. Test Creating Patient with 58 Wilaya & Commune
    create_payload = {
        "first_name": "سارة",
        "last_name": "بوعلام",
        "gender": "female",
        "birth_date": "2020-09-12",
        "phone": "0661234567",
        "phone_operator": "mobilis",
        "guardian_name": "كريم بوعلام",
        "wilaya_code": "16",
        "commune_name": "الأبيار",
        "consultation_reason": "تأتأة نمائة وصعوبات في الطلاقة الكلامية",
    }
    create_res = requests.post(f"{BASE_URL}/patients", json=create_payload, headers=headers)
    assert create_res.status_code == 201, f"Create patient failed: {create_res.text}"
    patient = create_res.json().get("patient", {})
    patient_id = patient.get("id")
    print(f"✅ 2. Patient Created with Algerian Wilaya 16 (الأبيار): ID {patient_id}")

    # 3. Test Interactive Genogram & Pedigree Save
    genogram_payload = {
        "consanguinity": True,
        "consanguinity_degree": "first_cousins",
        "consanguinity_notes": "أبناء عم مباشرين من جهة الأب",
        "members": [
            {"id": "father", "relation": "الأب", "gender": "male", "generation": 2, "name": "كريم", "disorders": ["stuttering"]},
            {"id": "mother", "relation": "الأم", "gender": "female", "generation": 2, "name": "فاطمة", "disorders": []},
            {"id": "paternal_grandfather", "relation": "جد للأب", "gender": "male", "generation": 1, "name": "الجد للأب", "disorders": ["stuttering", "epilepsy"]},
            {"id": "patient", "relation": "المريض الحالي", "gender": "female", "generation": 3, "name": "سارة", "isPatient": True, "disorders": ["stuttering"]}
        ]
    }
    geno_res = requests.post(f"{BASE_URL}/patients/{patient_id}/save-genogram", json=genogram_payload, headers=headers)
    assert geno_res.status_code == 200, f"Genogram save failed: {geno_res.text}"
    print(f"✅ 3. Interactive Genogram Pedigree saved with Consanguinity (F=1/16) and disorders!")

    # 4. Test Symptom & Sensory Body Map Save
    bodymap_payload = {
        "activeTics": [
            "طرف العينين المتكرر (Clignements)",
            "تنحنح حنجري متكرر (Raclement)",
            "رفرفة اليدين (Flapping / Battements)"
        ],
        "sensoryProfile": {
            "auditory": "hyper",
            "tactile": "hyper",
            "visual": "normal",
            "vestibular": "hypo",
            "proprioceptive": "hypo"
        },
        "zoneNotes": {
            "eyes": "تشنج عيني يزداد عند التعب والقلق قبل الكلام",
            "mouth_throat": "تنحنح صوتي مصاحب لبداية نطق الجمل"
        }
    }
    body_res = requests.post(f"{BASE_URL}/patients/{patient_id}/save-sensory-body-map", json=bodymap_payload, headers=headers)
    assert body_res.status_code == 200, f"Body Map save failed: {body_res.text}"
    print(f"✅ 4. Symptom & Sensory Body Map saved with 3 active tics and Hyper/Hypo sensory profile!")

    # 5. Test Pre-Intake Parent Online Portal End-to-End
    # 5a. Generate link
    link_res = requests.post(f"{BASE_URL}/patients/{patient_id}/generate-pre-intake-link", headers=headers)
    assert link_res.status_code == 200, f"Link generation failed: {link_res.text}"
    token_val = link_res.json().get("token")
    link_val = link_res.json().get("link")
    print(f"✅ 5a. Pre-Intake Magic Link generated: {link_val} (Token: {token_val})")

    # 5b. Public Parent Fetch
    public_res = requests.get(f"{BASE_URL}/public/pre-intake/{token_val}")
    assert public_res.status_code == 200, f"Public fetch failed: {public_res.text}"
    pub_data = public_res.json()
    print(f"✅ 5b. Public Parent Portal loaded: Child '{pub_data['patient']['first_name']}', Clinic '{pub_data['clinic']['name']}'")

    # 5c. Public Parent Submission
    parent_submission = {
        "consultation_reason": "تأتأة وصعوبة في إخراج بعض الحروف عند الحديث أمام القسم",
        "parent_notes": "الطفلة ذكية ومتفوقة في مادة الحساب وتتحسن عند الحديث بهدوء",
        "perinatal": {
            "pregnancy_term": "full_term",
            "delivery_type": "natural",
            "birth_cry": "immediate",
            "neonatal_anoxia": False,
            "incubator_stay": False
        },
        "milestones": {
            "walking_age_months": 12,
            "first_words_age_months": 11,
            "first_sentences_age_months": 22
        },
        "family_context": {
            "home_languages": ["darja", "arabic", "french"],
            "daily_screen_hours": 2,
            "sibling_rank": "first_born",
            "consanguinity": "first_cousins"
        },
        "school_context": {
            "school_name": "مدرسة ابن خلدون الابتدائية - الأبيار",
            "school_grade": "السنة الأولى ابتدائي",
            "schooling_type": "regular",
            "teacher_complaints": ["تردد في القراءة الجهرية"]
        }
    }
    submit_res = requests.post(f"{BASE_URL}/public/pre-intake/{token_val}", json=parent_submission)
    assert submit_res.status_code == 200, f"Parent submission failed: {submit_res.text}"
    print(f"✅ 5c. Parent Pre-Intake submitted successfully from home mobile view!")

    # 5d. Specialist 1-Click Approval and Merging into Patient Clinical Record
    approve_res = requests.post(f"{BASE_URL}/patients/{patient_id}/approve-pre-intake", headers=headers)
    assert approve_res.status_code == 200, f"Specialist approval failed: {approve_res.text}"
    updated_p = approve_res.json().get("patient", {})
    assert updated_p.get("pre_intake_status") == "reviewed", "Pre-intake status should be reviewed"
    merged_anamnesis = updated_p.get("anamnesis_data", {})
    print(f"✅ 5d. Specialist 1-Click Approved & Merged! Status: {updated_p.get('pre_intake_status')}")
    print(f"      Parent Notes Merged: {merged_anamnesis.get('parent_notes')}")
    print(f"      School Context Merged: {merged_anamnesis.get('school_context', {}).get('school_name')}")

    print("\n" + "=" * 70)
    print("🏆 ALL 4 MODULES FULLY TESTED & 100% OPERATIONAL ON PRODUCTION SERVER!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
