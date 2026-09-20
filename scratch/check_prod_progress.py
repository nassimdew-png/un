import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

k = paramiko.Ed25519Key.from_private_key_file(r"C:\Users\Nassim\.ssh\id_ed25519_vps")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("197.140.142.48", username="root", pkey=k, timeout=10)

stdin, stdout, stderr = ssh.exec_command("du -sh /var/www/clinic-saas; pm2 status; ps aux | grep -E '(tar|node|vite|artisan|mysql)' | grep -v grep")
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
