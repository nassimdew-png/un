import tarfile
import subprocess
import os
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"
ARCHIVE_NAME = "patch_cabinet_alger_fix.tar.gz"

FILES_TO_PACK = [
    "backend/app/Http/Controllers/Api/PublicAuthController.php",
    "backend/app/Http/Controllers/Api/AppointmentController.php",
    "backend/app/Http/Controllers/Api/QueueController.php",
    "backend/routes/api.php",
    "frontend/src/api.js",
    "frontend/src/components/auth/TenantLoginView.jsx",
    "frontend/src/components/KioskCheckIn.jsx",
]

php_seeder = """<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();

use App\\Models\\Tenant;
use App\\Models\\User;
use App\\Models\\Patient;
use App\\Models\\Appointment;
use App\\Models\\SubscriptionPlan;
use Illuminate\\Support\\Facades\\Hash;
use Illuminate\\Support\\Str;
use Carbon\\Carbon;

echo "=== SEEDING / ENSURING CABINET-ALGER TENANT ===" . PHP_EOL;

$plan = SubscriptionPlan::first();
$planId = $plan ? $plan->id : 1;

$tenant = Tenant::where('subdomain', 'cabinet-alger')->first();
if (!$tenant) {
    $tenant = new Tenant();
    $tenant->id = (string) Str::uuid();
    $tenant->subdomain = 'cabinet-alger';
}

$tenant->name = 'عيادة الجزائر السريرية (Cabinet Alger)';
$tenant->type = 'orthophony';
$tenant->plan_id = $planId;
$tenant->status = 'active';
$tenant->wilaya = '16 - الجزائر';
$tenant->wilaya_code = '16';
$tenant->phone = '0550123456';
$tenant->whatsapp_phone = '0550123456';
$tenant->header_title_ar = 'عيادة الجزائر السريرية للأرطوفونيا والتأهيل النفسي';
$tenant->header_title_fr = "Cabinet Clinique d'Orthophonie & Réhabilitation Alger";
$tenant->sub_header = 'فضاء الاستشارات والتشخيص والتأهيل العصبي واللغوي';
$tenant->address = 'حي العربي بن مهيدي، الجزائر الوسطى، الجزائر العاصمة';
$tenant->report_accent_color = '#0d9488';
$tenant->kiosk_pin = '1234';
$tenant->kiosk_enabled = 1;
$tenant->tv_display_ticker_text = 'مرحباً بكم في عيادة الجزائر السريرية. يرجى الانتظار حتى ظهور رقم التذكرة ونداء المعالج.';
$tenant->tv_audio_chime_enabled = 1;
$tenant->save();

echo "Tenant ID: {$tenant->id} | Subdomain: {$tenant->subdomain} | Status: {$tenant->status}" . PHP_EOL;

// Ensure Admin User for cabinet-alger
$user = User::where('email', 'admin@cabinet-alger.dz')->first();
if (!$user) {
    $user = new User();
    $user->email = 'admin@cabinet-alger.dz';
}
$user->name = 'د. أمين بن عمارة (Cabinet Alger)';
$user->role = 'admin_owner';
$user->tenant_id = $tenant->id;
$user->password = Hash::make('password123');
$user->save();

echo "Admin User: {$user->email} | ID: {$user->id}" . PHP_EOL;

// Ensure Sample Patients for cabinet-alger
$patientsData = [
    [
        'first_name' => 'أحمد',
        'last_name' => 'بن سالم',
        'phone' => '0550112233',
        'kiosk_pin' => '112233',
        'portal_pin' => '112233',
        'birth_date' => '2016-05-12',
        'gender' => 'male',
        'guardian_name' => 'عمر بن سالم',
    ],
    [
        'first_name' => 'ياسمين',
        'last_name' => 'بوحجر',
        'phone' => '0661223344',
        'kiosk_pin' => '223344',
        'portal_pin' => '223344',
        'birth_date' => '2018-09-20',
        'gender' => 'female',
        'guardian_name' => 'فاطمة بوحجر',
    ],
    [
        'first_name' => 'إلياس',
        'last_name' => 'عمراوي',
        'phone' => '0770334455',
        'kiosk_pin' => '334455',
        'portal_pin' => '334455',
        'birth_date' => '2015-11-03',
        'gender' => 'male',
        'guardian_name' => 'رشيد عمراوي',
    ],
];

$patientModels = [];
foreach ($patientsData as $pData) {
    $p = Patient::where('tenant_id', $tenant->id)
        ->where('phone', $pData['phone'])
        ->first();
    if (!$p) {
        $p = new Patient();
        $p->tenant_id = $tenant->id;
        $p->phone = $pData['phone'];
    }
    $p->first_name = $pData['first_name'];
    $p->last_name = $pData['last_name'];
    $p->kiosk_pin = $pData['kiosk_pin'];
    $p->portal_pin = $pData['portal_pin'];
    $p->birth_date = $pData['birth_date'];
    $p->gender = $pData['gender'];
    $p->guardian_name = $pData['guardian_name'];
    $p->save();
    $patientModels[] = $p;
    echo "Patient: {$p->first_name} {$p->last_name} | PIN: {$p->kiosk_pin}" . PHP_EOL;
}

// Ensure Appointments for Today
$today = Carbon::today();
$appointmentsConfig = [
    [
        'patient' => $patientModels[0],
        'status' => 'confirmed',
        'time_offset' => 0,
        'notes' => 'فحص أرطوفوني وتقييم مخارج الحروف الفونولوجية',
    ],
    [
        'patient' => $patientModels[1],
        'status' => 'scheduled',
        'time_offset' => 30,
        'notes' => 'جلسة إعادة تأهيل النطق والتخاطب',
    ],
    [
        'patient' => $patientModels[2],
        'status' => 'scheduled',
        'time_offset' => 60,
        'notes' => 'جلسة تأهيل التأتأة والطلاقة الكلامية',
    ],
];

foreach ($appointmentsConfig as $ac) {
    $appDate = Carbon::now()->addMinutes($ac['time_offset']);
    $existingApp = Appointment::where('tenant_id', $tenant->id)
        ->where('patient_id', $ac['patient']->id)
        ->whereDate('appointment_date', $today)
        ->first();
    
    if (!$existingApp) {
        $existingApp = new Appointment();
        $existingApp->tenant_id = $tenant->id;
        $existingApp->patient_id = $ac['patient']->id;
        $existingApp->specialist_id = $user->id;
    }
    
    $existingApp->appointment_date = $appDate;
    $existingApp->status = $ac['status'];
    $existingApp->notes = $ac['notes'];
    $existingApp->type = 'in_office';
    $existingApp->save();
    echo "Appointment: ID {$existingApp->id} | Patient {$ac['patient']->first_name} | Status: {$existingApp->status}" . PHP_EOL;
}

echo "=== COMPLETED SEEDING SUCCESSFULLY ===" . PHP_EOL;
"""

traefik_update_script = """import yaml
import os

saas_path = '/etc/dokploy/traefik/dynamic/clinic-saas.yml'
wildcard_path = '/etc/dokploy/traefik/dynamic/clinic-wildcard.yml'

# 1. Update clinic-saas.yml
if os.path.exists(saas_path):
    with open(saas_path, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f) or {}

    routers = data.setdefault('http', {}).setdefault('routers', {})

    # Add cabinet-alger routers
    routers['clinic-api-cabinet-alger'] = {
        'entryPoints': ['websecure'],
        'priority': 100,
        'rule': 'Host(`cabinet-alger.psypro.tech`) && PathPrefix(`/api`)',
        'service': 'clinic-api-service',
        'tls': {'certResolver': 'letsencrypt'}
    }
    routers['clinic-frontend-cabinet-alger'] = {
        'entryPoints': ['websecure'],
        'priority': 100,
        'rule': 'Host(`cabinet-alger.psypro.tech`)',
        'service': 'clinic-frontend-service',
        'tls': {'certResolver': 'letsencrypt'}
    }
    routers['clinic-storage-cabinet-alger'] = {
        'entryPoints': ['websecure'],
        'priority': 100,
        'rule': 'Host(`cabinet-alger.psypro.tech`) && PathPrefix(`/storage`)',
        'service': 'clinic-api-service',
        'tls': {'certResolver': 'letsencrypt'}
    }
    routers['clinic-http-frontend-cabinet-alger'] = {
        'entryPoints': ['web'],
        'priority': 100,
        'rule': 'Host(`cabinet-alger.psypro.tech`)',
        'service': 'clinic-frontend-service'
    }
    routers['clinic-http-api-cabinet-alger'] = {
        'entryPoints': ['web'],
        'priority': 100,
        'rule': 'Host(`cabinet-alger.psypro.tech`) && PathPrefix(`/api`)',
        'service': 'clinic-api-service'
    }

    with open(saas_path, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True)
    print("Updated clinic-saas.yml successfully with cabinet-alger routers!")

# 2. Update clinic-wildcard.yml with valid Traefik regex syntax
if os.path.exists(wildcard_path):
    with open(wildcard_path, 'r', encoding='utf-8') as f:
        wdata = yaml.safe_load(f) or {}
    wrouters = wdata.setdefault('http', {}).setdefault('routers', {})
    
    wrouters['clinic-wildcard-api-https'] = {
        'entryPoints': ['websecure'],
        'priority': 30,
        'rule': 'HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psypro.tech`) && PathPrefix(`/api`)',
        'service': 'clinic-api-service',
        'tls': {'certResolver': 'letsencrypt'}
    }
    wrouters['clinic-wildcard-storage-https'] = {
        'entryPoints': ['websecure'],
        'priority': 30,
        'rule': 'HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psypro.tech`) && PathPrefix(`/storage`)',
        'service': 'clinic-api-service',
        'tls': {'certResolver': 'letsencrypt'}
    }
    wrouters['clinic-wildcard-frontend-https'] = {
        'entryPoints': ['websecure'],
        'priority': 20,
        'rule': 'HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psypro.tech`)',
        'service': 'clinic-frontend-service',
        'tls': {'certResolver': 'letsencrypt'}
    }
    wrouters['clinic-wildcard-frontend-http'] = {
        'entryPoints': ['web'],
        'priority': 20,
        'rule': 'HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psypro.tech`)',
        'service': 'clinic-frontend-service'
    }
    wrouters['clinic-wildcard-api-http'] = {
        'entryPoints': ['web'],
        'priority': 30,
        'rule': 'HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psypro.tech`) && PathPrefix(`/api`)',
        'service': 'clinic-api-service'
    }

    with open(wildcard_path, 'w', encoding='utf-8') as f:
        yaml.dump(wdata, f, default_flow_style=False, allow_unicode=True)
    print("Updated clinic-wildcard.yml successfully!")
"""

def main():
    print("1. Creating tar.gz archive for updated backend & frontend files...")
    archive_path = os.path.join(r"E:\3", ARCHIVE_NAME)
    with tarfile.open(archive_path, "w:gz") as tar:
        for rel_path in FILES_TO_PACK:
            full_path = os.path.join(r"E:\3", rel_path)
            if os.path.exists(full_path):
                tar.add(full_path, arcname=rel_path)
                print(f"  + Added {rel_path}")
            else:
                print(f"  ! Warning: Missing file: {full_path}")

    print("\n2. Uploading archive and helper scripts to VPS...")
    seeder_path = os.path.join(r"E:\3", "seed_cabinet_alger.php")
    with open(seeder_path, "w", encoding="utf-8") as f:
        f.write(php_seeder)

    traefik_script_path = os.path.join(r"E:\3", "update_traefik.py")
    with open(traefik_script_path, "w", encoding="utf-8") as f:
        f.write(traefik_update_script)

    subprocess.run([SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", archive_path, f"{HOST}:{REMOTE_BASE}/"], check=True)
    subprocess.run([SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", seeder_path, f"{HOST}:{REMOTE_BASE}/backend/seed_cabinet_alger.php"], check=True)
    subprocess.run([SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", traefik_script_path, f"{HOST}:/tmp/update_traefik.py"], check=True)

    if os.path.exists(archive_path):
        os.remove(archive_path)
    if os.path.exists(seeder_path):
        os.remove(seeder_path)
    if os.path.exists(traefik_script_path):
        os.remove(traefik_script_path)

    print("  Uploaded successfully!")

    print("\n3. Executing deployment, Traefik update, DB seeding, frontend build & PM2 restart...")
    remote_cmd = (
        f"python3 /tmp/update_traefik.py && rm -f /tmp/update_traefik.py && "
        f"cd {REMOTE_BASE} && "
        f"tar -xzf {ARCHIVE_NAME} && "
        f"rm {ARCHIVE_NAME} && "
        f"cd backend && "
        f"php seed_cabinet_alger.php && rm -f seed_cabinet_alger.php && "
        f"php artisan optimize:clear && php artisan config:clear && php artisan route:clear && "
        f"cd ../frontend && "
        f"npm run build && "
        f"pm2 restart 0 && pm2 restart 1 && pm2 restart 2 && "
        f"pm2 status"
    )

    ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_cmd]
    res = subprocess.run(ssh_cmd, capture_output=True, encoding='utf-8', errors='replace')
    print("STDOUT:\n", res.stdout)
    if res.stderr:
        print("STDERR:\n", res.stderr)

if __name__ == '__main__':
    main()
