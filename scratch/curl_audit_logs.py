import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

bash_cmd = """curl -s -w "\\nHTTP_STATUS:%{http_code}\\n" -H "Authorization: Bearer 558|sEwlApoMqb5PEMshK9D9DPNLY97UEQPUmK5gQByVd96ef96a" -H "Accept: application/json" http://127.0.0.1:8000/api/audit-logs"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST,
    bash_cmd
], capture_output=True, text=True)

print("STDOUT:\n", res.stdout)
