import sys
import paramiko

def run_remote(ip, cmd):
    key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Nassim\.ssh\id_ed25519_vps')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip, username='root', pkey=key, timeout=15)
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    ssh.close()
    return code, out, err

if __name__ == '__main__':
    ip = sys.argv[1] if len(sys.argv) > 1 else '197.140.142.48'
    cmd = ' '.join(sys.argv[2:]) if len(sys.argv) > 2 else 'uptime'
    code, out, err = run_remote(ip, cmd)
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    print(f"EXIT CODE: {code}")
    print("--- STDOUT ---")
    print(out)
    if err:
        print("--- STDERR ---")
        print(err)
