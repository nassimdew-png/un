import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

def main():
    php_code = """
    $patient = \\App\\Models\\Patient::first();
    if ($patient) {
        $c = new \\App\\Http\\Controllers\\Api\\ParentPortalController();
        $res = $c->getPatientComplianceOverview(request(), (string)$patient->id);
        $data = $res->getData();
        echo "PATIENT: " . $data->patient_name . "\\n";
        echo "COMPLIANCE: " . $data->stats->compliance_rate . "%\\n";
        echo "STREAK: " . $data->stats->streak_days . " days\\n";
        echo "AUDIO SAMPLES: " . $data->stats->total_audio_samples . "\\n";
        echo "PORTAL URL: " . ($data->portal_url ?? 'N/A') . "\\n";
    }
    """
    cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, f"cd /var/www/clinic-saas/backend && php artisan tinker --execute='{php_code}'"]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    print("STDOUT:\n", res.stdout)

if __name__ == "__main__":
    main()
