import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

k = paramiko.Ed25519Key.from_private_key_file(r"C:\Users\Nassim\.ssh\id_ed25519_vps")

# Check staging
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("145.223.116.54", username="root", pkey=k, timeout=10)
stdin, stdout, stderr = ssh.exec_command("ps aux | grep -E '(tar|scp)' | grep -v grep; ls -lh /tmp/*.tar.gz 2>/dev/null")
print("=== STAGING ===")
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()

# Check prod
ssh2 = paramiko.SSHClient()
ssh2.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh2.connect("197.140.142.48", username="root", pkey=k, timeout=10)
stdin2, stdout2, stderr2 = ssh2.exec_command("pm2 status; ps aux | grep -E '(tar|npm|vite|artisan|mysql|pm2)' | grep -v grep; ls -lh /tmp/*.tar.gz 2>/dev/null; du -sh /var/www/clinic-saas/* 2>/dev/null")
print("=== PROD ===")
print(stdout2.read().decode('utf-8', errors='replace'))
ssh2.close()
