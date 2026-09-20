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

res = run_ssh("""cd /var/www/clinic-saas/backend && php -r '
$plans = App\\Models\\SubscriptionPlan::all();
foreach ($plans as $p) {
    echo $p->slug . " => kiosk: " . ($p->features["kiosk_self_checkin"] ?? "none") . "\\n";
}
$cnt = App\\Models\\TherapySession::count();
echo "Total Therapy Sessions in DB: " . $cnt . "\\n";
'""")

with open(r"E:\3\scratch\final_check.txt", "w", encoding="utf-8") as f:
    f.write(res.stdout)
    f.write("\nSTDERR:\n" + res.stderr)

print("Finished check. Written to E:\\3\\scratch\\final_check.txt")
