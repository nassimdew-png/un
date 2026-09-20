import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

k = paramiko.Ed25519Key.from_private_key_file(r"C:\Users\Nassim\.ssh\id_ed25519_vps")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("197.140.142.48", username="root", pkey=k, timeout=10)

cmd = "cd /var/www/clinic-saas/backend && export COMPOSER_ALLOW_SUPERUSER=1 && composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader"
stdin, stdout, stderr = ssh.exec_command(cmd)

for line in stdout:
    print(line, end="", flush=True)

err = stderr.read().decode('utf-8', errors='replace')
if err:
    print("\nSTDERR:\n", err)

ssh.close()
