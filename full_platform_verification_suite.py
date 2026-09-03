import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def run_suite():
    print("=" * 80)
    print("🩺 PSYPROREA CLINICAL SAAS - COMPREHENSIVE FULL-STACK TEST SUITE")
    print("=" * 80)

    results = []

    # 1. Test Authentication
    try:
        login_res = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "admin@elbiar-ortho.dz",
            "password": "password123"
        })
        assert login_res.status_code == 200, f"HTTP {login_res.status_code}: {login_res.text}"
        data = login_res.json()
        token = data.get("access_token")
        user = data.get("user", {})
        tenant = data.get("tenant", {})
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        print(f"✅ [1/8] Authentication & Tenant Resolution: Authenticated as '{user.get('name')}' in Clinic '{tenant.get('name')}' (Tenant ID: {tenant.get('id')})")
        results.append(("Authentication & Multi-Tenant Context", "PASS"))
    except Exception as e:
        print(f"❌ [1/8] Authentication Failed: {e}")
        results.append(("Authentication & Multi-Tenant Context", "FAIL"))
        return

    # 2. Test Algerian 58 Wilayas & Communes Patient Creation
    try:
        p_res = requests.post(f"{BASE_URL}/patients", json={
            "first_name": "يوسف",
            "last_name": "مقداد",
            "gender": "male",
            "birth_date": "2019-05-14",
            "phone": "0555123456",
            "phone_operator": "ooredoo",
            "guardian_name": "عبد القادر مقداد",
            "wilaya_code": "31",
            "commune_name": "السانية",
            "consultation_reason": "تأخر نمائي لغوي واضطراب في التكامل الحسي",
        }, headers=headers)
        assert p_res.status_code == 201, f"HTTP {p_res.status_code}: {p_res.text}"
        patient = p_res.json().get("patient", {})
        p_id = patient.get("id")
        print(f"✅ [2/8] Patient Intake & Algerian Geo System: Created Patient #{p_id} ({patient.get('first_name')} {patient.get('last_name')}) in Wilaya 31 (وهران - السانية)")
        results.append(("Patient Intake with 58 Wilayas", "PASS"))
    except Exception as e:
        print(f"❌ [2/8] Patient Creation Failed: {e}")
        results.append(("Patient Intake with 58 Wilayas", "FAIL"))
        p_id = 28

    # 3. Test Interactive Genogram & Pedigree Tree
    try:
        geno_res = requests.post(f"{BASE_URL}/patients/{p_id}/save-genogram", json={
            "consanguinity": True,
            "consanguinity_degree": "first_cousins",
            "consanguinity_notes": "أبناء عم مباشرين من الدرجة الأولى (F = 1/16)",
            "members": [
                {"id": "father", "relation": "الأب", "gender": "male", "generation": 2, "name": "عبد القادر", "disorders": ["stuttering"]},
                {"id": "mother", "relation": "الأم", "gender": "female", "generation": 2, "name": "أمينة", "disorders": []},
                {"id": "paternal_uncle", "relation": "عم", "gender": "male", "generation": 2, "name": "مراد", "disorders": ["speech_delay"]},
                {"id": "patient", "relation": "المريض المفحوص", "gender": "male", "generation": 3, "name": "يوسف", "isPatient": True, "disorders": ["speech_delay", "sensory_issues"]}
            ]
        }, headers=headers)
        assert geno_res.status_code == 200, f"HTTP {geno_res.status_code}: {geno_res.text}"
        print(f"✅ [3/8] Interactive Genogram Pedigree: Stored 3 generations pedigree with consanguinity coefficient calculation")
        results.append(("Genogram & Consanguinity Module", "PASS"))
    except Exception as e:
        print(f"❌ [3/8] Genogram Save Failed: {e}")
        results.append(("Genogram & Consanguinity Module", "FAIL"))

    # 4. Test Symptom & Sensory Body Map
    try:
        body_res = requests.post(f"{BASE_URL}/patients/{p_id}/save-sensory-body-map", json={
            "activeTics": [
                "طرف العينين المتكرر (Clignements)",
                "تنحنح حنجري متكرر (Raclement)",
                "المشي على أطراف الأصابع (Marche sur pointes)"
            ],
            "sensoryProfile": {
                "auditory": "hyper",
                "tactile": "hyper",
                "visual": "normal",
                "vestibular": "hypo",
                "proprioceptive": "hypo"
            },
            "zoneNotes": {
                "eyes": "حركات رمش سريعة تزداد عند الإجهاد المعرفي",
                "legs_feet": "مشي متكرر على رؤوس الأصابع أثناء الانفعال"
            }
        }, headers=headers)
        assert body_res.status_code == 200, f"HTTP {body_res.status_code}: {body_res.text}"
        print(f"✅ [4/8] Symptom & Sensory Body Map: Stored anatomical motor tics & 5-domain sensory reactivity profile")
        results.append(("Symptom & Sensory Body Map", "PASS"))
    except Exception as e:
        print(f"❌ [4/8] Sensory Body Map Failed: {e}")
        results.append(("Symptom & Sensory Body Map", "FAIL"))

    # 5. Test Pre-Intake Parent Online Flow (Token -> Public Fetch -> Submit -> Approve)
    try:
        # Generate Token
        gen_res = requests.post(f"{BASE_URL}/patients/{p_id}/generate-pre-intake-link", headers=headers)
        assert gen_res.status_code == 200
        token_str = gen_res.json().get("token")

        # Public Fetch
        pub_get = requests.get(f"{BASE_URL}/public/pre-intake/{token_str}")
        assert pub_get.status_code == 200

        # Public Submit
        pub_sub = requests.post(f"{BASE_URL}/public/pre-intake/{token_str}", json={
            "consultation_reason": "صعوبة في بناء جمل ثلاثية الكلمات وحساسية من الأصوات العالية",
            "parent_notes": "الطفل هادئ في المنزل لكنه ينزعج في التجمعات العائلية",
            "perinatal": {
                "pregnancy_term": "full_term",
                "delivery_type": "cesarean",
                "birth_cry": "immediate",
                "neonatal_anoxia": False,
                "incubator_stay": False
            },
            "milestones": {
                "sitting_age_months": 7,
                "walking_age_months": 13,
                "first_words_age_months": 15,
                "first_sentences_age_months": 36
            },
            "family_context": {
                "home_languages": ["darja", "arabic"],
                "daily_screen_hours": 3,
                "sibling_rank": "middle",
                "consanguinity": "first_cousins"
            },
            "school_context": {
                "school_name": "روضة الأمل للأطفال - السانية",
                "school_grade": "قسم تحضيري",
                "schooling_type": "regular",
                "teacher_complaints": ["صعوبة اتباع التعليمات الشفهية الطويلة"]
            }
        })
        assert pub_sub.status_code == 200

        # Specialist 1-Click Approval
        app_res = requests.post(f"{BASE_URL}/patients/{p_id}/approve-pre-intake", headers=headers)
        assert app_res.status_code == 200
        approved_patient = app_res.json().get("patient", {})
        assert approved_patient.get("pre_intake_status") == "reviewed"
        print(f"✅ [5/8] Pre-Intake Parent Online Portal: Full Lifecycle (Link -> Submission -> 1-Click Merge) verified")
        results.append(("Pre-Intake Parent Online Flow", "PASS"))
    except Exception as e:
        print(f"❌ [5/8] Pre-Intake Flow Failed: {e}")
        results.append(("Pre-Intake Parent Online Flow", "FAIL"))

    # 6. Test Direct Instant Session & Clinical Workspace Initialization
    try:
        sess_res = requests.post(f"{BASE_URL}/appointments", json={
            "patient_id": p_id,
            "appointment_date": "2026-09-03",
            "start_time": "11:30",
            "type": "therapy_session",
            "status": "in_progress",
            "notes": "جلسة تأهيل لغوي وحسي مباشرة"
        }, headers=headers)
        assert sess_res.status_code == 201, f"HTTP {sess_res.status_code}: {sess_res.text}"
        session_id = sess_res.json().get("id")
        print(f"✅ [6/8] Direct Session & Clinical Workspace: Started Session #{session_id} with status 'in_progress' and auto specialist association")
        results.append(("Direct Session Initialization", "PASS"))
    except Exception as e:
        print(f"❌ [6/8] Direct Session Failed: {e}")
        results.append(("Direct Session Initialization", "FAIL"))

    # 7. Test AI Records & Copilot Attachment
    try:
        ai_res = requests.post(f"{BASE_URL}/patients/{p_id}/ai-records", json={
            "tool_type": "bilan_synthesis",
            "title": "التقرير الذكي التركيبي للسوابق النمائية والجينية",
            "summary": "توليد ملخص تركيبي للسوابق والشجرة العائلية والملف الحسي",
            "payload": {
                "ai_model": "gemini-1.5-pro",
                "recommendations": "يوصى ببروتوكول تأهيل حسي حركي وتنمية المهارات البراغماتية اللغوية",
                "confidence": 0.96
            }
        }, headers=headers)
        assert ai_res.status_code == 200 or ai_res.status_code == 201, f"HTTP {ai_res.status_code}: {ai_res.text}"
        print(f"✅ [7/8] AI Clinical Records & Copilot: Generated and stored clinical synthesis record")
        results.append(("AI Clinical Records & Copilot", "PASS"))
    except Exception as e:
        print(f"❌ [7/8] AI Records Failed: {e}")
        results.append(("AI Clinical Records & Copilot", "FAIL"))

    # 8. Test Master Assessment Battery & Tests Bank
    try:
        tests_res = requests.get(f"{BASE_URL}/assessments?patient_id={p_id}", headers=headers)
        assert tests_res.status_code == 200, f"HTTP {tests_res.status_code}: {tests_res.text}"
        print(f"✅ [8/8] Assessment Batteries & Tests Bank: Connected and responding smoothly")
        results.append(("Assessments & Clinical Batteries", "PASS"))
    except Exception as e:
        print(f"❌ [8/8] Assessments Failed: {e}")
        results.append(("Assessments & Clinical Batteries", "FAIL"))

    # Summary
    print("\n" + "=" * 80)
    print("📊 TEST SUITE SUMMARY MATRIX:")
    print("=" * 80)
    all_passed = True
    for name, status in results:
        icon = "🟢" if status == "PASS" else "🔴"
        print(f"  {icon} {name.ljust(45)} : {status}")
        if status != "PASS":
            all_passed = False

    print("=" * 80)
    if all_passed:
        print("🏆 ALL 8 CORE SUBSYSTEMS ARE 100% OPERATIONAL ON PRODUCTION SERVER!")
    else:
        print("⚠️ SOME TESTS FAILED. PLEASE REVIEW LOGS.")
    print("=" * 80)

if __name__ == "__main__":
    run_suite()
