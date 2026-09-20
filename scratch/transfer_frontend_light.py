import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

k = paramiko.Ed25519Key.from_private_key_file(r"C:\Users\Nassim\.ssh\id_ed25519_vps")

# Step 1: scp from staging to prod
ssh_stage = paramiko.SSHClient()
ssh_stage.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh_stage.connect("145.223.116.54", username="root", pkey=k)

cmd = "scp /tmp/frontend_light.tar.gz root@197.140.142.48:/tmp/"
stdin, stdout, stderr = ssh_stage.exec_command(cmd)
print("SCP frontend_light to prod:", stdout.read().decode('utf-8', errors='replace'))
print("SCP ERR:", stderr.read().decode('utf-8', errors='replace'))
ssh_stage.close()

# Step 2: extract on prod
ssh_prod = paramiko.SSHClient()
ssh_prod.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh_prod.connect("197.140.142.48", username="root", pkey=k)

extract_cmd = "tar -xzf /tmp/frontend_light.tar.gz -C /var/www/clinic-saas && ls -la /var/www/clinic-saas/frontend && ls -la /var/www/clinic-saas/frontend/dist"
stdin, stdout, stderr = ssh_prod.exec_command(extract_cmd)
print("Extract output:\n", stdout.read().decode('utf-8', errors='replace'))
print("Extract err:\n", stderr.read().decode('utf-8', errors='replace'))
ssh_prod.close()
