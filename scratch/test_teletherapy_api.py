import urllib.request
import json
import ssl

ctx = ssl._create_unverified_context()
BASE_URL = "https://145.223.116.54/api/super-admin"

def test_teletherapy():
    print("Testing GET /teletherapy/overview...")
    req = urllib.request.Request(f"{BASE_URL}/teletherapy/overview")
    with urllib.request.urlopen(req, context=ctx) as resp:
        print(f"Status: {resp.status}")
        data = json.loads(resp.read().decode())
        print("KPIs:", data.get('kpis'))
        print("Live Rooms count:", len(data.get('live_rooms', [])))
        print("Recent Sessions count:", len(data.get('recent_sessions', [])))

    print("\nTesting POST /teletherapy/settings...")
    new_settings = {
        "enabled": True,
        "webrtc_provider": "p2p_mesh",
        "stun_server_primary": "stun:stun.l.google.com:19302",
        "stun_server_secondary": "stun:global.stun.twilio.com:3478",
        "turn_server": "turn:turn.psypro.tech:3478",
        "turn_username": "psypro_user",
        "turn_credential": "secret_password",
        "max_session_minutes": 90,
        "allow_canvas": True,
        "allow_tests_passation": True,
        "allow_screen_share": True,
        "allow_cbt_protocols": True,
        "allow_recording": False,
        "eco_bandwidth_mode": True,
        "allowed_plans": ["starter", "pro", "enterprise", "clinic_unlimited"]
    }
    payload = json.dumps(new_settings).encode('utf-8')
    req2 = urllib.request.Request(
        f"{BASE_URL}/teletherapy/settings",
        data=payload,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req2, context=ctx) as resp2:
        print(f"POST Status: {resp2.status}")
        res2 = json.loads(resp2.read().decode())
        print("POST Response:", res2)

    print("\nVerifying updated settings via GET /teletherapy/settings...")
    req3 = urllib.request.Request(f"{BASE_URL}/teletherapy/settings")
    with urllib.request.urlopen(req3, context=ctx) as resp3:
        print(f"GET Status: {resp3.status}")
        res3 = json.loads(resp3.read().decode())
        print("Persisted Settings:", res3.get('settings'))
        assert res3.get('settings', {}).get('max_session_minutes') == 90
        print("\n>>> ALL TELETHERAPY SUPER ADMIN API TESTS PASSED! <<<")

if __name__ == "__main__":
    test_teletherapy()
