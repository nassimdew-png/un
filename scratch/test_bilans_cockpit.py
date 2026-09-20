import urllib.request
import urllib.error
import ssl
import json

BASE_URL = "https://145.223.116.54/api"
ssl_ctx = ssl._create_unverified_context()

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ssl_ctx) as resp:
            content = resp.read()
            content_type = resp.headers.get("Content-Type", "")
            return resp.status, content, content_type
    except urllib.error.HTTPError as e:
        content = e.read()
        return e.code, content, e.headers.get("Content-Type", "")
    except Exception as e:
        return 500, str(e).encode(), ""

def run_test():
    print("=== 1. Login as Clinic Doctor / Specialist ===")
    login_payload = {
        "email": "doctor@clinic.dz",
        "password": "password"
    }
    
    status, body, _ = make_request(f"{BASE_URL}/auth/login", method="POST", data=login_payload)
    if status != 200:
        login_payload = {
            "email": "admin@clinic.dz",
            "password": "password"
        }
        status, body, _ = make_request(f"{BASE_URL}/auth/login", method="POST", data=login_payload)
        
    if status != 200:
        print("Login failed:", status, body.decode())
        return
        
    data = json.loads(body.decode())
    token = data.get("token") or data.get("access_token")
    user = data.get("user", {})
    print(f"Logged in successfully as: {user.get('name')} ({user.get('role')})")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    print("\n=== 2. Test GET /api/patient-bilans (Cockpit listing & stats) ===")
    status, body, _ = make_request(f"{BASE_URL}/patient-bilans", headers=headers)
    print("Status:", status)
    bilans_data = json.loads(body.decode())
    print("Total bilans:", bilans_data.get("total"))
    print("Stats:", json.dumps(bilans_data.get("stats"), ensure_ascii=False))
    print(f"Retrieved {len(bilans_data.get('data', []))} bilans in current page")

    print("\n=== 3. Get Patients List ===")
    status, body, _ = make_request(f"{BASE_URL}/patients", headers=headers)
    patients = json.loads(body.decode()).get("data", [])
    if not patients:
        print("No patients found.")
        return
    patient = patients[0]
    print(f"Selected patient: {patient.get('first_name')} {patient.get('last_name')} (ID: {patient.get('id')})")

    print("\n=== 4. Test Generating a New Master Bilan ===")
    bilan_payload = {
        "title": "الحصيلة الإكلينيكية والتقييم السريري الشامل المعتمد",
        "bilan_type": "orthophonique",
        "language": "ar",
        "audience": "medical",
        "clinical_summary": "مفحوص يعاني من اضطراب في النطق ومخارج الحروف مع تحسن ملحوظ بعد 6 حصص.",
        "psychometric_analysis": "تطبيق رائز النطق والفونولوجيا ومصفوفة الفحص الفونولوجي: اضطراب متمركز في الأصوات الصفيرية.",
        "strengths_weaknesses": "نقاط القوة: رغبة عالية في التعلم، إدراك سمعي سليم. نقاط الضعف: تموضع غير دقيق للسان.",
        "diagnosis_codes": "F80.0 اضطراب النطق النمائي الخاص",
        "therapeutic_project": "خطة عمل من 10 حصص تشمل التمارين الحركية للسان والنفخ والتثبيت الصوتي عبر النمذجة.",
        "pei_goals": [
            {"id": "g1", "text": "نطق صوت الراء /r/ في بداية الكلمة بدقة 80%", "status": "in_progress"},
            {"id": "g2", "text": "إنتاج جملة اسمية من 3 عناصر", "status": "achieved"}
        ],
        "included_sections": {
            "genogram": True,
            "sensory_map": True,
            "anamnesis": True,
            "assessments": True,
            "pei_goals": True,
            "therapeutic_project": True
        }
    }
    
    status, body, _ = make_request(f"{BASE_URL}/patients/{patient['id']}/bilans/generate", method="POST", data=bilan_payload, headers=headers)
    print("Generate Status:", status)
    gen_data = json.loads(body.decode())
    bilan = gen_data.get("bilan", {})
    bilan_id = bilan.get("id") or gen_data.get("bilan_id")
    print(f"Generated Bilan ID: {bilan_id}")
    print("PDF URL:", gen_data.get("pdf_url"))

    if bilan_id:
        print("\n=== 5. Test Show Single Bilan Details ===")
        status, body, _ = make_request(f"{BASE_URL}/patient-bilans/{bilan_id}", headers=headers)
        print("Show Status:", status)
        print("Bilan Title:", json.loads(body.decode()).get("bilan", {}).get("title"))

        print("\n=== 6. Test Cryptographic QR Verification ===")
        token_str = f"BILAN-{bilan_id}-test"
        status, body, _ = make_request(f"{BASE_URL}/public/verify/doc/{token_str}")
        print("Verify Status:", status)
        verify_data = json.loads(body.decode())
        doc = verify_data.get("document", {})
        print("Document Valid:", verify_data.get("is_valid"))
        print("Document Title:", doc.get("title"))
        print("Type Label:", doc.get("type_label"))
        print("Patient Ref (Masked):", doc.get("patient_reference"))
        print("Practitioner:", doc.get("practitioner_name"))
        print("SHA-256 Hash:", doc.get("sha256_hash"))

        print("\n=== 7. Test PDF Download / Stream ===")
        status, content, ctype = make_request(f"{BASE_URL}/patient-bilans/{bilan_id}/pdf?token={token}")
        print("PDF Stream Status:", status)
        print("Content-Type:", ctype)
        print(f"PDF Size: {len(content)} bytes")
        if status == 200 and content.startswith(b"%PDF"):
            print(">>> SUCCESS: PDF generated perfectly with standard PDF header (%PDF)! <<<")
        else:
            print("PDF generation output preview:", content[:200])

if __name__ == "__main__":
    run_test()
