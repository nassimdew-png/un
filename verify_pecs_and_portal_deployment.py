import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

def main():
    check_cmd = """
pm2 jlist
echo "--- Checking built JS bundle for PECS and Matching keywords ---"
grep -rn "pecs-cards-activity-btn" /var/www/clinic-saas/frontend/dist/assets/ || echo "not found in dist"
grep -rn "matching-activity-btn" /var/www/clinic-saas/frontend/dist/assets/ || echo "not found in dist"
echo "--- Checking built JS bundle for Parent Audio Upload keywords ---"
grep -rn "parent-audio-file-input" /var/www/clinic-saas/frontend/dist/assets/ || echo "not found in dist"
"""
    ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, check_cmd]
    res = subprocess.run(ssh_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    with open("verify_result.txt", "w", encoding="utf-8") as f:
        f.write(res.stdout)
        if res.stderr:
            f.write("\nSTDERR:\n" + res.stderr)
    print("Verification output written to verify_result.txt")

if __name__ == "__main__":
    main()
