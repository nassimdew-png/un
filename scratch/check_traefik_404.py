import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_script = """curl -s -k https://127.0.0.1/ -H "Host: unknown123456.psypro.tech" """

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST, test_script
], capture_output=True)

print("RESPONSE:", repr(res.stdout.decode('utf-8', errors='replace')))
