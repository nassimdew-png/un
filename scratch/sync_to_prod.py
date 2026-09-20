import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PROD_IP = '197.140.142.48'
STAGING_IP = '145.223.116.54'
SSH_KEY = r'C:\Users\Nassim\.ssh\id_ed25519_vps'

print("Step A: Creating /var/www/clinic-saas on Prod...")
ssh_prod = paramiko.SSHClient()
ssh_prod.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh_prod.connect(PROD_IP, username='root', key_filename=SSH_KEY)
stdin, stdout, stderr = ssh_prod.exec_command('mkdir -p /var/www/clinic-saas')
stdout.channel.recv_exit_status()
ssh_prod.close()
print("Done creating directory.")

print("Step B: Rsyncing codebase from Staging to Prod...")
ssh_staging = paramiko.SSHClient()
ssh_staging.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh_staging.connect(STAGING_IP, username='root', key_filename=SSH_KEY)
cmd = "rsync -avz --exclude='.git' /var/www/clinic-saas/ root@197.140.142.48:/var/www/clinic-saas/"
stdin, stdout, stderr = ssh_staging.exec_command(cmd)

while not stdout.channel.exit_status_ready():
    if stdout.channel.recv_ready():
        chunk = stdout.channel.recv(1024).decode('utf-8', errors='replace')
        sys.stdout.write(chunk)
        sys.stdout.flush()
    if stderr.channel.recv_stderr_ready():
        chunk = stderr.channel.recv_stderr(1024).decode('utf-8', errors='replace')
        sys.stderr.write(chunk)
        sys.stderr.flush()
    time.sleep(0.2)

exit_code = stdout.channel.recv_exit_status()
print(f"\nRsync exited with code: {exit_code}")
ssh_staging.close()
