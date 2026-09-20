"""
Production Deployment Script (psysnap.com)
Deploys approved code changes to the Live Production server (197.140.142.48)
WARNING: Run this script ONLY after testing and obtaining user approval!
"""
import paramiko
import os
import sys
import tarfile
import tempfile
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PROD_IP = '197.140.142.48'
SSH_KEY = r'C:\Users\Nassim\.ssh\id_ed25519_vps'
WORKSPACE = r'e:\3'

print("=" * 60)
print(f"🚨 DEPLOYING TO LIVE PRODUCTION SERVER ({PROD_IP}) - psysnap.com")
print("=" * 60)

# Create tar archive of production code
tar_path = os.path.join(tempfile.gettempdir(), 'prod_patch.tar.gz')
with tarfile.open(tar_path, 'w:gz') as tar:
    # Add frontend src
    frontend_src = os.path.join(WORKSPACE, 'frontend', 'src')
    if os.path.exists(frontend_src):
        tar.add(frontend_src, arcname='frontend/src')
    
    # Add backend app, routes, config, database
    for folder in ['app', 'routes', 'config', 'database']:
        p = os.path.join(WORKSPACE, 'backend', folder)
        if os.path.exists(p):
            tar.add(p, arcname=f'backend/{folder}')

print(f"📦 Archive created: {os.path.getsize(tar_path) / 1024 / 1024:.2f} MB")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(PROD_IP, username='root', key_filename=SSH_KEY)

sftp = ssh.open_sftp()
sftp.put(tar_path, '/var/www/clinic-saas/prod_patch.tar.gz')
sftp.close()
os.remove(tar_path)

cmd = """
cd /var/www/clinic-saas
tar -xzf prod_patch.tar.gz && rm prod_patch.tar.gz

cd /var/www/clinic-saas/backend
php artisan optimize:clear
php artisan route:clear
php artisan config:clear
php artisan migrate --force

cd /var/www/clinic-saas/frontend
npm run build

pm2 restart 0 1 2
sleep 2
pm2 list
"""

print("⚙️ Applying patch, migrating, building frontend, and restarting PM2 on Production...")
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))
ssh.close()
print("🎉 Production deployment completed successfully on https://psysnap.com!")
