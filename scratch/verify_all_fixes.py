import subprocess
import json

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

def run_ssh(cmd):
    full_cmd = [
        SSH_BIN,
        "-i", SSH_KEY,
        "-o", "StrictHostKeyChecking=no",
        HOST,
        cmd
    ]
    res = subprocess.run(full_cmd, capture_output=True, encoding='utf-8', errors='replace')
    return res

print("=== 1. Testing TV Queue API Endpoint ===")
res = run_ssh("curl -s http://127.0.0.1:8000/api/public/tv-queue")
print("TV Queue HTTP response:")
try:
    data = json.loads(res.stdout)
    print(f"Success: {data.get('success')}")
    print(f"Clinic: {data.get('clinic', {}).get('name')}")
    print(f"Waiting count: {len(data.get('waiting_list', []))}")
    if data.get('waiting_list'):
        print("First patient in queue:", data['waiting_list'][0])
except Exception as e:
    print("Raw output:", res.stdout[:500])

print("\n=== 2. Testing Kiosk Check-In ===")
checkin_cmd = """curl -s -X POST http://127.0.0.1:8000/api/kiosk/check-in -H "Content-Type: application/json" -d '{"kiosk_pin":"1234"}'"""
res2 = run_ssh(checkin_cmd)
print("Kiosk Check-In response:")
try:
    cdata = json.loads(res2.stdout)
    print("Success:", cdata.get('success'))
    print("Message:", cdata.get('message'))
    print("Patient:", cdata.get('patient'))
except Exception as e:
    print("Raw output:", res2.stdout[:500])

print("\n=== 3. Testing TV Queue after Check-In ===")
res3 = run_ssh("curl -s http://127.0.0.1:8000/api/public/tv-queue")
try:
    data3 = json.loads(res3.stdout)
    print(f"Waiting count now: {len(data3.get('waiting_list', []))}")
    for p in data3.get('waiting_list', []):
        print(f" - {p.get('token')}: {p.get('patient_name')} ({p.get('status')})")
except Exception as e:
    print("Raw output:", res3.stdout[:500])

print("\n=== 4. Testing Subscription Plans Features ===")
plan_check = """cd /var/www/clinic-saas/backend && php -r '
$plans = App\\Models\\SubscriptionPlan::all();
foreach ($plans as $p) {
    echo $p->slug . " => kiosk: " . ($p->features["kiosk_self_checkin"] ?? "none") . ", tv: " . ($p->features["waiting_room_tv_queue"] ?? "none") . "\\n";
}
'"""
res4 = run_ssh(plan_check)
print(res4.stdout)

print("\n=== 5. Testing Therapy Sessions API via Tenant Token ===")
session_check = """cd /var/www/clinic-saas/backend && php -r '
$t = App\\Models\\Tenant::first();
$u = $t->users()->first();
$cnt = App\\Models\\TherapySession::where("tenant_id", $t->id)->count();
echo "Tenant " . $t->name . " has " . $cnt . " therapy sessions.\\n";
$latest = App\\Models\\TherapySession::where("tenant_id", $t->id)->latest()->first();
if ($latest) {
    echo "Latest session: id=" . $latest->id . ", status=" . $latest->attendance_status . ", notes=" . mb_substr($latest->progress_notes, 0, 50) . "\\n";
}
'"""
res5 = run_ssh(session_check)
print(res5.stdout)
