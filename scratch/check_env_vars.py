import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('197.140.142.48', username='root', key_filename=r'C:\Users\Nassim\.ssh\id_ed25519_vps')

cmd = """
cat /var/www/clinic-saas/backend/.env | grep -E "APP_URL|FRONTEND_URL|SESSION_DOMAIN|SANCTUM|CORS|DOMAIN"
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
