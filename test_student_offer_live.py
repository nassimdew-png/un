import urllib.request
import urllib.parse
import json
import ssl
import sys

# Ensure UTF-8 output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_URL = "https://psypro.tech"

def test_public_offer_config():
    print("--- 1. Testing GET /api/public/student-offer ---")
    url = f"{BASE_URL}/api/public/student-offer"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("Status Code:", resp.status)
            print("Response Success:", data.get('success'))
            print("Offer Config:", json.dumps(data.get('config'), ensure_ascii=False, indent=2))
            print("Universities count:", len(data.get('universities', [])))
            print("Stats:", data.get('stats'))
            assert data.get('success') is True, "Expected success: true"
            assert data.get('config', {}).get('duration_months') == 9, "Expected 9 months duration"
            print("✅ Public student offer config verified successfully!")
    except Exception as e:
        print("❌ Error fetching public offer config:", e)

def test_superadmin_student_offer_api():
    print("\n--- 2. Testing SuperAdmin Student Offer Endpoints ---")
    login_url = f"{BASE_URL}/api/login"
    login_payload = json.dumps({"email": "admin@psypro.tech", "password": "password"}).encode('utf-8')
    req = urllib.request.Request(login_url, data=login_payload, headers={
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
    })
    token = None
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            token = res.get('token')
            print("SuperAdmin Login Status:", resp.status)
    except Exception as e:
        print("Login failed, checking alternative superadmin account:", e)
        # Try fallback
        try:
            fallback_payload = json.dumps({"email": "superadmin@clinic-saas.dz", "password": "password"}).encode('utf-8')
            req2 = urllib.request.Request(login_url, data=fallback_payload, headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0"
            })
            with urllib.request.urlopen(req2, context=ctx, timeout=15) as resp2:
                res2 = json.loads(resp2.read().decode('utf-8'))
                token = res2.get('token')
                print("Fallback SuperAdmin Login Status:", resp2.status)
        except Exception as e2:
            print("Fallback login error:", e2)

    if token:
        # Check superadmin config
        url_cfg = f"{BASE_URL}/api/superadmin/student-offers/config"
        req_cfg = urllib.request.Request(url_cfg, headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0"
        })
        try:
            with urllib.request.urlopen(req_cfg, context=ctx, timeout=15) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                print("SuperAdmin Config Status:", resp.status)
                print("SuperAdmin Config Success:", data.get('success'))
                print("SuperAdmin Config Data:", json.dumps(data.get('config'), ensure_ascii=False, indent=2))
                print("✅ SuperAdmin Student Offer Config endpoint verified!")
        except Exception as e:
            print("❌ SuperAdmin config endpoint failed:", e)

        # Check superadmin applications list
        url_apps = f"{BASE_URL}/api/superadmin/student-offers/applications"
        req_apps = urllib.request.Request(url_apps, headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0"
        })
        try:
            with urllib.request.urlopen(req_apps, context=ctx, timeout=15) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                print("Applications List Status:", resp.status)
                print("Applications Count:", len(data.get('applications', {}).get('data', [])))
                print("✅ SuperAdmin Applications List endpoint verified!")
        except Exception as e:
            print("❌ SuperAdmin applications endpoint failed:", e)
    else:
        print("⚠️ Could not acquire superadmin token to test superadmin endpoints.")

def test_frontend_routes():
    print("\n--- 3. Testing Frontend Landing Route Status ---")
    urls = [
        f"{BASE_URL}/student-offer",
        f"{BASE_URL}/students",
        f"{BASE_URL}/academic"
    ]
    for u in urls:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                print(f"{u} -> HTTP {resp.status}")
        except Exception as e:
            print(f"{u} -> Error: {e}")

if __name__ == '__main__':
    test_public_offer_config()
    test_superadmin_student_offer_api()
    test_frontend_routes()
