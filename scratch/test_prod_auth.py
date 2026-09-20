import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('197.140.142.48', username='root', key_filename=r'C:\Users\Nassim\.ssh\id_ed25519_vps')

# Test SuperAdmin login
cmd = r"""
curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"superadmin@clinic-saas.com","password":"password123"}'
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
res = stdout.read().decode('utf-8', errors='replace')
print("Login result:", res[:400])

ssh.close()
