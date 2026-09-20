import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

ssh_key_path = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
staging_ip = "145.223.116.54"
prod_ip = "197.140.142.48"

k = paramiko.Ed25519Key.from_private_key_file(ssh_key_path)

# Connect to staging to get or generate its public key
ssh_stage = paramiko.SSHClient()
ssh_stage.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh_stage.connect(staging_ip, username="root", pkey=k)

cmd_key = "if [ ! -f /root/.ssh/id_ed25519.pub ]; then ssh-keygen -t ed25519 -N '' -f /root/.ssh/id_ed25519; fi; cat /root/.ssh/id_ed25519.pub"
stdin, stdout, stderr = ssh_stage.exec_command(cmd_key)
stage_pub_key = stdout.read().decode('utf-8').strip()
print("Staging pub key:", stage_pub_key)
ssh_stage.close()

# Add staging's public key to production authorized_keys
ssh_prod = paramiko.SSHClient()
ssh_prod.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh_prod.connect(prod_ip, username="root", pkey=k)

cmd_auth = f"echo '{stage_pub_key}' >> /root/.ssh/authorized_keys && sort -u /root/.ssh/authorized_keys -o /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys"
stdin, stdout, stderr = ssh_prod.exec_command(cmd_auth)
print("Added staging key to prod authorized_keys")
ssh_prod.close()

# Test SSH from staging to prod
ssh_stage.connect(staging_ip, username="root", pkey=k)
stdin, stdout, stderr = ssh_stage.exec_command(f"ssh -o StrictHostKeyChecking=no root@{prod_ip} 'echo Staging to Prod SSH connection SUCCESSFUL'")
res = stdout.read().decode('utf-8').strip()
err = stderr.read().decode('utf-8').strip()
print("Direct SSH test result:", res)
if err:
    print("Stderr:", err)
ssh_stage.close()
