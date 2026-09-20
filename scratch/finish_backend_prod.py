import sys
import time
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

k = paramiko.Ed25519Key.from_private_key_file(r"C:\Users\Nassim\.ssh\id_ed25519_vps")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("197.140.142.48", username="root", pkey=k, timeout=30)

print("Waiting for /tmp/backend.tar.gz scp transfer to complete...")
prev_size = -1
for _ in range(60):
    stdin, stdout, stderr = ssh.exec_command("ls -l /tmp/backend.tar.gz 2>/dev/null | awk '{print $5}'")
    sz_str = stdout.read().decode().strip()
    if sz_str.isdigit():
        cur_sz = int(sz_str)
        print(f"Current size: {cur_sz / 1024 / 1024:.2f} MB")
        # Check if scp is still running
        stdin, stdout, stderr = ssh.exec_command("pgrep -f 'scp.*backend.tar.gz' || true")
        pgrep = stdout.read().decode().strip()
        if not pgrep and cur_sz > 90 * 1024 * 1024:
            print("Transfer completed!")
            break
    time.sleep(3)

print("Extracting backend.tar.gz...")
cmd_extract = """
tar -xzf /tmp/backend.tar.gz -C /var/www/clinic-saas
chown -R www-data:www-data /var/www/clinic-saas/backend/storage /var/www/clinic-saas/backend/bootstrap/cache
chmod -R 775 /var/www/clinic-saas/backend/storage /var/www/clinic-saas/backend/bootstrap/cache
cd /var/www/clinic-saas/backend
php artisan optimize:clear
php artisan --version
"""

stdin, stdout, stderr = ssh.exec_command(cmd_extract)
print("Extract STDOUT:\n", stdout.read().decode('utf-8', errors='replace'))
print("Extract STDERR:\n", stderr.read().decode('utf-8', errors='replace'))

print("Restarting PM2 processes...")
cmd_pm2 = """
pm2 restart all
sleep 3
pm2 status
"""
stdin, stdout, stderr = ssh.exec_command(cmd_pm2)
print("PM2 STDOUT:\n", stdout.read().decode('utf-8', errors='replace'))

ssh.close()
