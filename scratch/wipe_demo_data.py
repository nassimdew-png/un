import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

wipe_script = r"""
cd /var/www/clinic-saas/backend
php -r '
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Tenant;
use App\Models\Patient;
use App\Models\User;

echo "=== STARTING SAFE CLEANUP ===\n";

// 1. Core Reference Tenants to KEEP:
$preserveSubdomains = [
    "elbiar-ortho",
    "oran-psy",
    "constantine-sante",
    "annaba-ortho",
    "cabinet-alger"
];

$preservedTenants = Tenant::whereIn("subdomain", $preserveSubdomains)->pluck("id")->toArray();
echo "Preserving " . count($preservedTenants) . " benchmark clinics: " . implode(", ", $preserveSubdomains) . "\n";

DB::statement("SET FOREIGN_KEY_CHECKS=0;");

// 2. Wipe ALL patients and patient-related records across the system
$tablesToWipe = [
    "patients",
    "patient_medical_histories",
    "patient_diagnostics",
    "patient_school_profiles",
    "patient_consents",
    "clinical_assessments",
    "clinical_test_assignments",
    "appointments",
    "therapy_sessions",
    "therapy_session_notes",
    "prescriptions",
    "patient_home_care_assignments",
    "patient_audio_recordings",
    "patient_documents",
    "kiosk_checkins",
    "medical_certificates",
    "medical_letters"
];

foreach ($tablesToWipe as $table) {
    if (DB::getSchemaBuilder()->hasTable($table)) {
        $count = DB::table($table)->count();
        DB::table($table)->truncate();
        echo "Truncated {$table} (deleted {$count} records)\n";
    }
}

// 3. Find and Delete non-reference tenants
$tenantsToDelete = Tenant::whereNotIn("id", $preservedTenants)->get();
$deletedTenantsCount = 0;
$deletedUsersCount = 0;

foreach ($tenantsToDelete as $t) {
    // Delete users belonging to this tenant (EXCEPT superadmin)
    $users = User::withoutGlobalScopes()->where("tenant_id", $t->id)->where("role", "!=", "superadmin")->where("is_super_admin", false)->get();
    foreach ($users as $u) {
        $u->tokens()->delete();
        $u->delete();
        $deletedUsersCount++;
    }

    // Delete subscriptions / invoices / records belonging to this tenant safely
    foreach (["clinic_subscriptions", "saas_invoices", "system_broadcasts", "discount_coupons", "waiting_room_entries"] as $tbl) {
        if (DB::getSchemaBuilder()->hasTable($tbl)) {
            $cols = DB::getSchemaBuilder()->getColumnListing($tbl);
            if (in_array("tenant_id", $cols)) {
                DB::table($tbl)->where("tenant_id", $t->id)->delete();
            } elseif (in_array("clinic_id", $cols)) {
                DB::table($tbl)->where("clinic_id", $t->id)->delete();
            }
        }
    }

    $t->delete();
    $deletedTenantsCount++;
}

echo "Deleted {$deletedTenantsCount} demo/generated tenants.\n";
echo "Deleted {$deletedUsersCount} associated tenant users.\n";

DB::statement("SET FOREIGN_KEY_CHECKS=1;");

echo "\n=== REMAINING SYSTEM STATE ===\n";
echo "Remaining Tenants: " . Tenant::count() . "\n";
foreach (Tenant::all() as $t) {
    echo "  - [ID: {$t->id}] {$t->name} ({$t->subdomain})\n";
}

echo "Remaining Users: " . User::withoutGlobalScopes()->count() . "\n";
foreach (User::withoutGlobalScopes()->get() as $u) {
    echo "  - [ID: {$u->id}] {$u->name} ({$u->email}) - Role: {$u->role}\n";
}

echo "Remaining Patients: " . Patient::withoutGlobalScopes()->count() . "\n";
echo "=== CLEANUP COMPLETED SUCCESSFULLY ===\n";
'
"""

res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, wipe_script], capture_output=True, text=True, encoding='utf-8', errors='replace')
print(res.stdout)
if res.stderr:
    print("STDERR:\n", res.stderr)
