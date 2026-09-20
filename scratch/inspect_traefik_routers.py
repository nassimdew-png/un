import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')
ssh_cmd = [
    r'C:\Windows\System32\OpenSSH\ssh.exe',
    '-i', r'C:\Users\Nassim\.ssh\id_ed25519_vps',
    '-o', 'StrictHostKeyChecking=no',
    'root@145.223.116.54',
    'docker exec dokploy-traefik wget -qO- http://127.0.0.1:8080/api/http/routers | jq -r \'.[] | .name + " === " + .rule\''
]
res = subprocess.run(ssh_cmd, capture_output=True, text=True, encoding='utf-8')
lines = [l for l in res.stdout.splitlines() if not l.startswith('clinic-api-') and not l.startswith('clinic-storage-')]
for l in lines[:60]:
    print(l)
print(f"Total lines: {len(res.stdout.splitlines())}")
