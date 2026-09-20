import os
import tarfile
import paramiko

ssh_key_path = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
staging_ip = "145.223.116.54"

files_to_sync = [
    ("backend/app/Http/Controllers/Api/SuperAdmin/HelpCenterStudioController.php", "/var/www/clinic-saas/backend/app/Http/Controllers/Api/SuperAdmin/HelpCenterStudioController.php"),
    ("backend/routes/api.php", "/var/www/clinic-saas/backend/routes/api.php"),
    ("frontend/src/components/help/HelpCenterView.jsx", "/var/www/clinic-saas/frontend/src/components/help/HelpCenterView.jsx"),
    ("frontend/src/components/public/LandingPageView.jsx", "/var/www/clinic-saas/frontend/src/components/public/LandingPageView.jsx"),
    ("frontend/src/components/super-admin/HelpCenterStudioTab.jsx", "/var/www/clinic-saas/frontend/src/components/super-admin/HelpCenterStudioTab.jsx"),
    ("frontend/src/App.jsx", "/var/www/clinic-saas/frontend/src/App.jsx"),
    ("frontend/src/components/layout/Sidebar.jsx", "/var/www/clinic-saas/frontend/src/components/layout/Sidebar.jsx"),
]

archive_path = r"e:\3\scratch\patch_help_center.tar.gz"
with tarfile.open(archive_path, "w:gz") as tar:
    for local_rel, _ in files_to_sync:
        full_local = os.path.join(r"e:\3", local_rel.replace("/", os.sep))
        tar.add(full_local, arcname=local_rel)
print(f"Created archive {archive_path}")

k = paramiko.Ed25519Key.from_private_key_file(ssh_key_path)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(staging_ip, username="root", pkey=k, timeout=20)
print(f"Connected to staging {staging_ip}")

sftp = ssh.open_sftp()
sftp.put(archive_path, "/tmp/patch_help_center.tar.gz")
sftp.close()
print("Uploaded archive to /tmp/patch_help_center.tar.gz")

deploy_cmd = """
cd /var/www/clinic-saas &&
tar -xzf /tmp/patch_help_center.tar.gz &&
cd /var/www/clinic-saas/backend &&
php artisan optimize:clear &&
cd /var/www/clinic-saas/frontend &&
npm run build &&
pm2 restart all &&
pm2 status
"""

stdin, stdout, stderr = ssh.exec_command(deploy_cmd)
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')

print("DEPLOY STDOUT:\n", out)
if err:
    print("DEPLOY STDERR:\n", err)

ssh.close()
