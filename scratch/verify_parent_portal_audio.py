import subprocess
import json
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

def run_remote(cmd):
    res = subprocess.run(
        [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, cmd],
        capture_output=True,
        text=False
    )
    return res.stdout.decode('utf-8', errors='replace'), res.stderr.decode('utf-8', errors='replace'), res.returncode

def main():
    print("=== 1. Checking PM2 Processes ===")
    out, err, code = run_remote("pm2 jlist")
    try:
        data = json.loads(out)
        for proc in data:
            print(f"  PM2 [{proc['pm_id']}] {proc['name']}: {proc['pm2_env']['status']}")
    except:
        print(out[:300])

    print("\n=== 2. Testing Portal Token Retrieval & Audio Upload API ===")
    test_php = """
    require '/var/www/clinic-saas/backend/vendor/autoload.php';
    $app = require_once '/var/www/clinic-saas/backend/bootstrap/app.php';
    $kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
    $kernel->bootstrap();

    $patient = App\\Models\\Patient::withoutGlobalScopes()->first();
    if (!$patient) {
        echo json_encode(['error' => 'No patient found']);
        exit;
    }
    if (empty($patient->portal_access_token)) {
        $patient->portal_access_token = 'test_portal_token_123';
        $patient->saveQuietly();
    }
    echo json_encode([
        'patient_id' => $patient->id,
        'portal_token' => $patient->portal_access_token,
        'tenant_id' => $patient->tenant_id
    ]);
    """
    out, err, code = run_remote(f"php -r {repr(test_php)}")
    print(f"Patient info: {out}")
    try:
        patient_info = json.loads(out.strip())
        token = patient_info.get('portal_token', 'preview')
    except:
        token = 'preview'

    print(f"\n=== 3. Testing POST /api/portal/{token}/audio via curl ===")
    run_remote("echo 'test audio data webm binary stream' > /tmp/sample_audio.webm")
    curl_upload = f"""
    curl -s -X POST http://127.0.0.1:8000/api/portal/{token}/audio \\
      -F "file_name=test_voice_sample.webm" \\
      -F "notes=Test audio recording from parent verification" \\
      -F "audio=@/tmp/sample_audio.webm;filename=test_voice_sample.webm;type=audio/webm"
    """
    out, err, code = run_remote(curl_upload)
    print(f"Upload response: {out}")

    print(f"\n=== 4. Testing GET /api/portal/{token}/audio via curl ===")
    curl_get = f"curl -s http://127.0.0.1:8000/api/portal/{token}/audio"
    out, err, code = run_remote(curl_get)
    print(f"Get samples response: {out}")

    print("\n=== 5. Verifying Frontend Bundle for Parent Audio Upload Test IDs ===")
    grep_dist = "grep -o 'parent-audio-upload-input' /var/www/clinic-saas/frontend/dist/assets/*.js | head -n 5; grep -o 'parent-audio-history' /var/www/clinic-saas/frontend/dist/assets/*.js | head -n 5; grep -o 'parent-audio-upload-btn' /var/www/clinic-saas/frontend/dist/assets/*.js | head -n 5"
    out, err, code = run_remote(grep_dist)
    print(f"Dist bundle grep:\n{out}")

if __name__ == "__main__":
    main()
