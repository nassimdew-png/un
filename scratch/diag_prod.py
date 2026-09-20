import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('197.140.142.48', username='root', key_filename=r'C:\Users\Nassim\.ssh\id_ed25519_vps')

cmd = """
echo "=== 1. Direct curl 3001 with Host psypro.tech ==="
curl -sI -H "Host: psypro.tech" http://127.0.0.1:3001/

echo "=== 2. Direct curl 3001 with Host localhost ==="
curl -sI -H "Host: localhost" http://127.0.0.1:3001/

echo "=== 3. What is listening on port 3001 ==="
ss -tulpn | grep 3001

echo "=== 4. PM2 logs clinic-frontend ==="
pm2 logs clinic-frontend --lines 15 --nostream

echo "=== 5. Check dist directory ==="
ls -la /var/www/clinic-saas/frontend/dist/
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
print("ERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
