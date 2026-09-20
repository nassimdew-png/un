import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

OLD_HOST = "root@145.223.116.54"
NEW_HOST = "root@197.140.142.48"
SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

# Step 1: From old host, copy authorized_keys to new host
setup_keys_cmd = """
set -e
echo "=== Transferring authorized_keys from staging to new production VPS ==="
sshpass -p 'nassim123' ssh -o StrictHostKeyChecking=no root@197.140.142.48 'mkdir -p ~/.ssh && chmod 700 ~/.ssh'
cat ~/.ssh/authorized_keys | sshpass -p 'nassim123' ssh -o StrictHostKeyChecking=no root@197.140.142.48 'cat >> ~/.ssh/authorized_keys && sort -u -o ~/.ssh/authorized_keys ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
echo "Key transfer complete!"
"""

res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", OLD_HOST, setup_keys_cmd], capture_output=True, text=True)
print(res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)

# Step 2: Test direct connection from Windows using local SSH key
print("\n=== Testing DIRECT SSH from Windows to NEW VPS ===")
test_direct = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10", NEW_HOST, "echo 'DIRECT SSH TO NEW VPS SUCCESSFUL: ' $(hostname)"], capture_output=True, text=True)
print(test_direct.stdout)
if test_direct.stderr:
    print("DIRECT STDERR:", test_direct.stderr)
