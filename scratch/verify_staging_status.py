import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko
import json

ssh_key_path = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
staging_ip = "145.223.116.54"

k = paramiko.Ed25519Key.from_private_key_file(ssh_key_path)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(staging_ip, username="root", pkey=k, timeout=20)

stdin, stdout, stderr = ssh.exec_command("pm2 jlist")
import json
pm2_data = json.loads(stdout.read().decode('utf-8'))
for proc in pm2_data:
    print(f"PM2 Process [{proc['name']}]: Status = {proc['pm2_env']['status']}, Restart Count = {proc['pm2_env']['restart_time']}")

# Test local curl on server for /api/public/help-center-config
stdin, stdout, stderr = ssh.exec_command("curl -s http://127.0.0.1:8000/api/public/help-center-config | head -c 200")
api_res = stdout.read().decode('utf-8', errors='replace')
print("\nBackend API Response (/api/public/help-center-config):")
print(api_res[:200])

# Test frontend preview server
stdin, stdout, stderr = ssh.exec_command("curl -s http://127.0.0.1:3001/ | grep -o '<title>.*</title>'")
fe_res = stdout.read().decode('utf-8', errors='replace')
print("\nFrontend title response:")
print(fe_res)

ssh.close()
