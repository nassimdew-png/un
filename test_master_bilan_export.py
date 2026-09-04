import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=" * 75)
    print("📄 MASTER CLINICAL BILAN PDF EXPORT - AUTOMATED TEST SUITE")
    print("=" * 75)

    # 1. Authenticate
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@elbiar-ortho.dz",
        "password": "password123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json().get("access_token")
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    print("✅ 1. Clinic Admin authenticated.")

    # Find a patient (e.g. ID 28 or 29 or 30 from yesterday's tests)
    patient_id = 30
    patient_check = requests.get(f"{BASE_URL}/patients/{patient_id}", headers=headers)
    if patient_check.status_code != 200:
        # Fallback to any patient
        p_list = requests.get(f"{BASE_URL}/patients", headers=headers).json()
        items = p_list.get('data', p_list)
        if isinstance(items, list) and len(items) > 0:
            patient_id = items[0]['id']
        else:
            patient_id = 28

    print(f"👉 Testing with Patient #{patient_id}")

    # 2. Test getPatientBilanData
    data_res = requests.get(f"{BASE_URL}/patients/{patient_id}/bilan-data", headers=headers)
    assert data_res.status_code == 200, f"getBilanData failed: {data_res.text}"
    b_data = data_res.json()
    assert b_data.get("success") is True
    p_info = b_data.get("patient", {})
    print(f"✅ 2. Bilan Data Retrieved for {p_info.get('first_name')} {p_info.get('last_name')}:")
    print(f"      Age: {p_info.get('age_formatted')}")
    print(f"      Genogram Consanguinity: {p_info.get('family_genogram', {}).get('consanguinity')}")
    print(f"      Sensory Map Tics: {len(p_info.get('sensory_body_map', {}).get('activeTics', []))} active tics")

    # 3. Test Generate French Master Bilan
    fr_payload = {
        "title": "Compte-Rendu de Bilan Orthophonique & Évaluation Psychométrique",
        "bilan_type": "orthophonique",
        "language": "fr",
        "audience": "medical",
        "clinical_summary": "L'examen clinique met en évidence un retard d'acquisition du langage oral prédominant sur le versant expressif, associé à des particularités d'intégration sensorielle.",
        "psychometric_analysis": "Les scores aux épreuves standardisées objectivent un décalage de plus de 1.5 écart-type par rapport aux normes d'âge.",
        "strengths_weaknesses": "Points forts: Excellente appétence communicative, bonnes capacités praxiques non-verbales. Points faibles: Vocabulaire restreint, intelligibilité réduite.",
        "diagnosis_codes": "F80.1 Troubles de l'acquisition du langage - Versant expressif (CIM-11: 6A01.0)",
        "therapeutic_project": "Rééducation orthophonique bihebdomadaire axée sur l'évocation lexicale, la syntaxe et la régulation sensorielle.",
        "included_sections": {
            "genogram": True,
            "sensory_map": True,
            "anamnesis": True,
            "assessments": True,
            "therapeutic_project": True
        }
    }
    fr_gen_res = requests.post(f"{BASE_URL}/patients/{patient_id}/bilans/generate", json=fr_payload, headers=headers)
    assert fr_gen_res.status_code == 201, f"Generate FR Bilan failed: {fr_gen_res.text}"
    fr_bilan = fr_gen_res.json().get("bilan", {})
    fr_bilan_id = fr_bilan.get("id")
    fr_pdf_url = fr_gen_res.json().get("pdf_url")
    print(f"✅ 3. French Master Bilan Generated: ID #{fr_bilan_id} (PDF URL: {fr_pdf_url})")

    # 4. Test Generate Arabic Master Bilan
    ar_payload = {
        "title": "الحصيلة الإكلينيكية والتقييم النفسي-الأرطوفوني الشامل",
        "bilan_type": "orthophonique",
        "language": "ar",
        "audience": "medical",
        "clinical_summary": "بناءً على الفحص السريري والملاحظة الميدانية، يعاني المفحوص من تأخر لغوي نمائي مع مؤشرات فرط تحسس لمسي وسمعي.",
        "psychometric_analysis": "أظهرت المقاييس المطبقة تفاوتاً ملحوظاً بين الذكاء العملي غير اللفظي ومؤشرات الطلاقة اللفظية.",
        "strengths_weaknesses": "نقاط القوة: رغبة عالية في التواصل، قدرات بصرية ممتازة. نقاط الضعف: صعوبة في تركيب الجمل المركبة.",
        "diagnosis_codes": "F80.1 اضطراب نمائي لغوي أولي (DSM-5 / CIM-11)",
        "therapeutic_project": "مشروع تكفل أرطوفوني بواقع حصتين أسبوعياً (45 دقيقة لكل جلسة) مع متابعة أسرية وإرشاد مدرسي.",
        "included_sections": {
            "genogram": True,
            "sensory_map": True,
            "anamnesis": True,
            "assessments": True,
            "therapeutic_project": True
        }
    }
    ar_gen_res = requests.post(f"{BASE_URL}/patients/{patient_id}/bilans/generate", json=ar_payload, headers=headers)
    assert ar_gen_res.status_code == 201, f"Generate AR Bilan failed: {ar_gen_res.text}"
    ar_bilan = ar_gen_res.json().get("bilan", {})
    ar_bilan_id = ar_bilan.get("id")
    ar_pdf_url = ar_gen_res.json().get("pdf_url")
    print(f"✅ 4. Arabic Master Bilan Generated: ID #{ar_bilan_id} (PDF URL: {ar_pdf_url})")

    # 5. Download and Verify French PDF binary
    pdf_headers = {"Authorization": f"Bearer {token}"}
    fr_pdf_res = requests.get(f"{BASE_URL}/patient-bilans/{fr_bilan_id}/pdf", headers=pdf_headers)
    assert fr_pdf_res.status_code == 200, f"Download FR PDF failed: {fr_pdf_res.status_code}"
    assert fr_pdf_res.headers.get("content-type") == "application/pdf", "Content-Type must be application/pdf"
    assert fr_pdf_res.content.startswith(b"%PDF-"), "Invalid PDF binary signature"
    assert len(fr_pdf_res.content) > 3000, "PDF size too small"
    print(f"✅ 5. French PDF Stream Verified: {len(fr_pdf_res.content)} bytes, valid PDF header %PDF-")

    # 6. Download and Verify Arabic PDF binary
    ar_pdf_res = requests.get(f"{BASE_URL}/patient-bilans/{ar_bilan_id}/pdf", headers=pdf_headers)
    assert ar_pdf_res.status_code == 200, f"Download AR PDF failed: {ar_pdf_res.status_code}"
    assert ar_pdf_res.headers.get("content-type") == "application/pdf", "Content-Type must be application/pdf"
    assert ar_pdf_res.content.startswith(b"%PDF-"), "Invalid PDF binary signature"
    assert len(ar_pdf_res.content) > 3000, "PDF size too small"
    print(f"✅ 6. Arabic PDF Stream Verified: {len(ar_pdf_res.content)} bytes, valid PDF header %PDF-")

    # 7. List Patient Bilans
    list_res = requests.get(f"{BASE_URL}/patients/{patient_id}/bilans", headers=headers)
    assert list_res.status_code == 200, f"List Bilans failed: {list_res.text}"
    bilans_list = list_res.json().get("bilans", [])
    print(f"✅ 7. Patient Bilans Archive: {len(bilans_list)} bilans recorded for Patient #{patient_id}")

    # 8. Test AI Clinical Copilot Endpoints
    quota_res = requests.get(f"{BASE_URL}/clinic/ai/quota-status", headers=headers)
    assert quota_res.status_code == 200, f"AI Quota failed: {quota_res.text}"
    print(f"✅ 8a. AI Quota Status: {quota_res.json().get('quota', {}).get('status')} (Tokens: {quota_res.json().get('quota', {}).get('tokens_balance')})")

    ai_gen_res = requests.post(f"{BASE_URL}/clinic/ai/generate-bilan", json={
        "patient_id": patient_id,
        "language": "ar",
        "audience": "medical"
    }, headers=headers)
    assert ai_gen_res.status_code == 200, f"AI Generate failed: {ai_gen_res.text}"
    ai_data = ai_gen_res.json().get("data", {})
    assert "structured_sections" in ai_data, "Missing structured_sections in AI response"
    print(f"✅ 8b. AI Bilan Generation Engine: provider={ai_data.get('provider')}, model={ai_data.get('model')}")

    print("=" * 75)
    print("🏆 MASTER CLINICAL BILAN EXPORT TO PDF & AI COPILOT 100% OPERATIONAL!")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
