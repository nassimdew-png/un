import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

OLD_HOST = "root@145.223.116.54"
SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

cmd = """
pm2 jlist
"""
res = subprocess.run([SSH_BIN, '-i', SSH_KEY, '-o', 'StrictHostKeyChecking=no', OLD_HOST, cmd], capture_output=True, text=False)
import json
try:
    data = json.loads(res.stdout.decode('utf-8', errors='replace'))
    for proc in data:
        print(f"ID: {proc.get('pm_id')} | Name: {proc.get('name')} | Script: {proc.get('pm2_env', {}).get('pm_exec_path')} | CWD: {proc.get('pm2_env', {}).get('pm_cwd')} | Args: {proc.get('pm2_env', {}).get('args')}")
except Exception as e:
    print("Error parsing PM2 jlist:", e)
    print(res.stdout.decode('utf-8', errors='replace')[:500])
