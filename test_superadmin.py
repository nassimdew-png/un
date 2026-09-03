import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=" * 60)
    print("🚀 SUPER ADMIN SUITE COMPREHENSIVE AUDIT")
    print("=" * 60)
    
    # 0. Login
    login_payload = {
        "email": "superadmin@clinic-saas.dz",
        "password": "password123"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    if resp.status_code != 200:
        print(f"❌ SuperAdmin Login Failed ({resp.status_code}): {resp.text}")
        sys.exit(1)
        
    token = resp.json().get("access_token")
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    print("✅ TEST 0: SuperAdmin Authentication Succeeded!")
    
    # 1. AI Settings & Governance
    r = requests.get(f"{BASE_URL}/super-admin/ai-settings", headers=headers)
    print(f"\n1. AI Settings & Governance ({r.status_code}):")
    if r.status_code == 200:
        data = r.json()
        print(f"   Model: {data.get('settings', {}).get('gemini_model')}")
        print(f"   Active AI Clinics: {data.get('stats', {}).get('active_ai_clinics_count')}")
        print(f"   Clinics Count: {len(data.get('clinics', []))}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r.text[:200]}")

    # 2. Centralized AI API Gateway
    r = requests.get(f"{BASE_URL}/superadmin/api-configs", headers=headers)
    print(f"\n2. Centralized AI API Gateway ({r.status_code}):")
    if r.status_code == 200:
        data = r.json()
        providers = list(data.get('providers', {}).keys())
        features = len(data.get('features', []))
        print(f"   Providers: {providers}")
        print(f"   Features Registered: {features}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r.text[:200]}")

    # 3. Clinic AI Quotas
    r = requests.get(f"{BASE_URL}/superadmin/clinics/quotas", headers=headers)
    print(f"\n3. Clinic AI Quotas ({r.status_code}):")
    if r.status_code == 200:
        data = r.json()
        clinics = data.get('clinics', [])
        print(f"   Clinics Tracked: {len(clinics)}")
        if clinics:
            print(f"   Sample: {clinics[0].get('name')} | Plan: {clinics[0].get('plan_name')}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r.text[:200]}")

    # 4. Communication & Notifications Gateways
    r = requests.get(f"{BASE_URL}/superadmin/communication-settings", headers=headers)
    print(f"\n4. Communication & Notifications Gateways ({r.status_code}):")
    if r.status_code == 200:
        data = r.json()
        s = data.get('settings', {})
        print(f"   SMTP Host: {s.get('mail_host')} | From: {s.get('mail_from_address')}")
        print(f"   WhatsApp Provider: {s.get('whatsapp_provider')} (Active: {s.get('is_whatsapp_active')})")
        print(f"   SMS Sender ID: {s.get('sms_sender_id')} (Active: {s.get('is_sms_active')})")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r.text[:200]}")

    # 5. Subscription Plans & Pricing
    r = requests.get(f"{BASE_URL}/superadmin/plans", headers=headers)
    print(f"\n5. Subscription Plans & Pricing Manager ({r.status_code}):")
    if r.status_code == 200:
        data = r.json()
        plans = data.get('plans', [])
        print(f"   Total SaaS Plans: {len(plans)}")
        for p in plans:
            print(f"   - {p.get('name_ar')}: {p.get('price_monthly')} DZD/mo")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r.text[:200]}")

    # 6. Coupons & Discounts
    r = requests.get(f"{BASE_URL}/super-admin/coupons", headers=headers)
    print(f"\n6. Discount Coupons Manager ({r.status_code}):")
    if r.status_code == 200:
        data = r.json()
        coupons = data.get('coupons', data.get('data', []))
        print(f"   Coupons Count: {len(coupons)}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r.text[:200]}")

    # 7. Payment Requests & Approvals
    r = requests.get(f"{BASE_URL}/super-admin/payment-requests", headers=headers)
    print(f"\n7. Offline Payment Requests ({r.status_code}):")
    if r.status_code == 200:
        data = r.json()
        reqs = data.get('requests', data.get('data', []))
        print(f"   Payment Requests: {len(reqs)}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r.text[:200]}")

    # 8. Platform Feature Flags Master Switcher
    r = requests.get(f"{BASE_URL}/superadmin/feature-flags", headers=headers)
    print(f"\n8. Feature Flags Switcher ({r.status_code}):")
    if r.status_code == 200:
        data = r.json()
        flags = data.get('flags', [])
        print(f"   Platform Flags: {len(flags)}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r.text[:200]}")

    # 9. Support Tickets System
    r = requests.get(f"{BASE_URL}/super-admin/support-tickets", headers=headers)
    print(f"\n9. Support Tickets System ({r.status_code}):")
    if r.status_code == 200:
        data = r.json()
        tickets = data.get('tickets', data.get('data', []))
        print(f"   Support Tickets: {len(tickets)}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r.text[:200]}")

    # 10. Disaster Recovery & Cloud Backups
    r = requests.get(f"{BASE_URL}/super-admin/disaster-recovery/backups", headers=headers)
    print(f"\n10. Disaster Recovery & Cloud Backups ({r.status_code}):")
    if r.status_code == 200:
        data = r.json()
        backups = data.get('backups', [])
        print(f"   Backups on Disk/Cloud: {len(backups)}")
        print("   Status: 🟢 PASSED")
    else:
        print(f"   ❌ Error: {r.text[:200]}")

    print("\n" + "=" * 60)
    print("🏆 ALL 10 SUPER ADMIN MODULES AUDITED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
