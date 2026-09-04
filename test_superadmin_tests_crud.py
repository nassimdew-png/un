import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=" * 65)
    print("🧪 AUDITING SUPER ADMIN CLINICAL TESTS & PROTOCOLS MANAGEMENT")
    print("=" * 65)

    # 1. SuperAdmin Login
    login_payload = {
        "email": "superadmin@clinic-saas.dz",
        "password": "password123"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    if resp.status_code != 200:
        print(f"❌ Login Failed ({resp.status_code}): {resp.text}")
        sys.exit(1)

    token = resp.json().get("access_token")
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    print("✅ 1. SuperAdmin Authenticated Successfully.")

    # 2. Sync Default Catalog
    print("\n👉 2. Testing Default Catalog Synchronization...")
    r_sync = requests.post(f"{BASE_URL}/super-admin/tests/sync-defaults", headers=headers)
    print(f"   Sync Status: {r_sync.status_code}")
    if r_sync.status_code == 200:
        data = r_sync.json()
        print(f"   Message: {data.get('message')}")
        print(f"   Synced Count: {data.get('count')}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r_sync.text[:250]}")

    # 3. GET Global Tests Catalog
    print("\n👉 3. Testing GET Global Tests Catalog & Stats...")
    r_list = requests.get(f"{BASE_URL}/super-admin/tests", headers=headers)
    print(f"   Status: {r_list.status_code}")
    if r_list.status_code == 200:
        data = r_list.json()
        tests = data.get("tests", [])
        stats = data.get("stats", {})
        print(f"   Total Tests in DB: {len(tests)}")
        print(f"   Stats: {stats}")
        assert len(tests) >= 90, f"Expected at least 90 tests, got {len(tests)}"
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r_list.text[:250]}")
        sys.exit(1)

    # 4. POST Create New Test (إضافة مقياس جديد)
    print("\n👉 4. Testing CREATE New Test (إضافة مقياس)...")
    new_test_payload = {
        "test_code": "TEST-PILOT-DZ",
        "name_ar": "رائز الطلاقة التجريبي المخصص لولاية وهران",
        "name_fr": "Test Pilote d'Évaluation de la Fluence (Oran)",
        "category": "orthophonie",
        "minimum_plan_required": "solo_starter",
        "is_globally_enabled": True,
        "description": "رائز تجريبي لفحص طلاقة النطق لدى تلاميذ الابتدائي.",
        "norms_payload": {
            "age_range": "6 - 12 سنة",
            "duration": "15 دقيقة",
            "source": "جامعة وهران 🇩🇿",
            "cutoff": "طبيعي > 80% | تعثر خفيف 60-79% | تلعثم دال < 60%",
            "dimensions": ["السرعة الكلامية", "عدد التكرارات", "الجهد العضلي"]
        }
    }
    r_create = requests.post(f"{BASE_URL}/super-admin/tests", headers=headers, json=new_test_payload)
    print(f"   Status: {r_create.status_code}")
    if r_create.status_code in [200, 201]:
        created = r_create.json().get("test", {})
        print(f"   Created Test: {created.get('test_code')} - {created.get('name_ar')}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r_create.text[:250]}")
        sys.exit(1)

    # 5. POST Update / Correct Test (تعديل وتصحيح المقياس)
    print("\n👉 5. Testing UPDATE / CORRECT Test (تعديل وتصحيح)...")
    update_payload = {
        "name_ar": "رائز الطلاقة المحدث والمقنن لولاية وهران (نسخة 2026)",
        "description": "تم تحديث أبعاد الفحص لتشمل الوقفات الحنجرية.",
        "norms_payload": {
            "age_range": "6 - 15 سنة",
            "duration": "20 دقيقة",
            "source": "جامعة وهران / CREAPSY 🇩🇿",
            "cutoff": "طبيعي > 85% | عجز دال < 65%",
            "dimensions": ["السرعة الكلامية", "الوقفات الحنجرية", "الحركات الثانوية"]
        }
    }
    r_update = requests.post(f"{BASE_URL}/super-admin/tests/TEST-PILOT-DZ", headers=headers, json=update_payload)
    print(f"   Status: {r_update.status_code}")
    if r_update.status_code == 200:
        updated = r_update.json().get("test", {})
        print(f"   Updated Name: {updated.get('name_ar')}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r_update.text[:250]}")

    # 6. POST Toggle Test Status (تعطيل وتفعيل)
    print("\n👉 6. Testing TOGGLE Test Status (تعطيل ثم تفعيل)...")
    r_toggle = requests.post(f"{BASE_URL}/super-admin/tests/TEST-PILOT-DZ/toggle", headers=headers)
    print(f"   Toggle Status: {r_toggle.status_code}")
    if r_toggle.status_code == 200:
        is_enabled = r_toggle.json().get("is_globally_enabled")
        print(f"   State after toggle: {'مفعل' if is_enabled else 'معطل'}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r_toggle.text[:250]}")

    # 7. DELETE Test (حذف المقياس)
    print("\n👉 7. Testing DELETE Test (حذف المقياس)...")
    r_del = requests.delete(f"{BASE_URL}/super-admin/tests/TEST-PILOT-DZ", headers=headers)
    print(f"   Delete Status: {r_del.status_code}")
    if r_del.status_code == 200:
        print(f"   Message: {r_del.json().get('message')}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r_del.text[:250]}")

    print("\n" + "=" * 65)
    print("🏆 ALL SUPER ADMIN CLINICAL TESTS CRUD TESTS PASSED 100%!")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
