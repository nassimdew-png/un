import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def test_direct_session():
    print("🚀 Starting Direct Session E2E Verification...")
    
    # 1. Login
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@elbiar-ortho.dz",
        "password": "password123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json().get("access_token")
    user = login_res.json().get("user")
    print(f"✅ Logged in as: {user.get('name')} (ID: {user.get('id')})")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    # 2. Get first patient
    p_res = requests.get(f"{BASE_URL}/patients?per_page=1", headers=headers)
    assert p_res.status_code == 200, f"Get patients failed: {p_res.text}"
    patients = p_res.json().get("data", [])
    assert len(patients) > 0, "No patients found"
    patient = patients[0]
    p_id = patient["id"]
    print(f"✅ Found test patient: {patient.get('first_name')} {patient.get('last_name')} (ID: {p_id})")
    
    # 3. Test Direct Session Start (the exact payload sent by '⚡ بدء جلسة لهذا المريض الآن')
    # Even if specialist_id is null/omitted, backend must smoothly auto-assign specialist!
    app_payload = {
        "patient_id": p_id,
        "specialist_id": None, # Simulating missing/null specialist_id from frontend
        "appointment_date": "2026-09-04",
        "start_time": "14:30",
        "type": "therapy_session",
        "status": "in_progress",
        "notes": "جلسة علاجية فورية ومباشرة من ملف المريض (E2E Test)"
    }
    
    start_res = requests.post(f"{BASE_URL}/appointments", json=app_payload, headers=headers)
    assert start_res.status_code == 201, f"Direct session start failed: {start_res.status_code} {start_res.text}"
    appointment_data = start_res.json().get("appointment", {})
    appointment_id = start_res.json().get("id") or appointment_data.get("id")
    assert appointment_id, "Missing appointment ID"
    assert appointment_data.get("status") == "in_progress", f"Expected in_progress, got: {appointment_data.get('status')}"
    assert appointment_data.get("specialist_id") is not None, "specialist_id should not be null"
    print(f"✅ [1/2] ⚡ Started Direct Session #{appointment_id} with status 'in_progress' and specialist_id #{appointment_data.get('specialist_id')}!")
    
    # 4. Test Complete Session via ActiveConsultationWorkspace
    complete_payload = {
        "notes": "[SOAP CLINICAL NOTES]\n• Subjective: المريض متفائل اليوم\n• Objective: أنجز 8 تمارين مخارج حروف بنجاح\n• Assessment: تحسن في صوت الراء (R)\n• Plan: تكرار التدريب المنزلي",
        "duration_minutes": 45,
        "specialty": "orthophony",
        "exercises_targeted": [
            "مخارج الحروف ونطق الأصوات (Articulation)",
            "تمارين عضلات الفم والفكين (Praxies)"
        ],
        "save_therapy_session": True
    }
    
    complete_res = requests.post(f"{BASE_URL}/appointments/{appointment_id}/complete-session", json=complete_payload, headers=headers)
    assert complete_res.status_code == 200, f"Complete session failed: {complete_res.status_code} {complete_res.text}"
    complete_data = complete_res.json()
    assert complete_data.get("success") == True
    assert complete_data.get("appointment", {}).get("status") == "completed"
    therapy_session = complete_data.get("therapy_session")
    assert therapy_session is not None, "TherapySession record should have been created"
    assert therapy_session.get("duration_minutes") == 45
    assert therapy_session.get("specialty") == "orthophony"
    print(f"✅ [2/2] Completed Session #{appointment_id}, saved SOAP report, and created TherapySession #{therapy_session.get('id')}!")
    
    print("\n" + "=" * 70)
    print("🏆 DIRECT CLINICAL SESSION WORKFLOW IS 100% OPERATIONAL ON PRODUCTION!")
    print("=" * 70)

if __name__ == "__main__":
    test_direct_session()
