#!/usr/bin/env bash
set -e

echo "=== [1/4] Creating Superadmin & Backup Controllers ==="
cd /var/www/clinic-saas/backend

mkdir -p storage/app/backups
chmod -R 775 storage/app/backups

cat << 'EOF' > app/Http/Controllers/Api/SuperadminController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\ClinicalAssessment;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Tenant;
use App\Models\TherapySession;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SuperadminController extends Controller
{
    /**
     * System metrics and global analytics.
     */
    public function systemMetrics(): JsonResponse
    {
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', 'active')->count();
        $trialTenants = Tenant::where('status', 'trial')->count();
        $suspendedTenants = Tenant::where('status', 'suspended')->count();

        $totalPatients = Patient::withoutGlobalScopes()->count();
        $totalUsers = User::withoutGlobalScopes()->where('role', '!=', 'superadmin')->count();
        $totalAppointments = Appointment::withoutGlobalScopes()->count();
        $totalAssessments = ClinicalAssessment::withoutGlobalScopes()->count();
        $totalSessions = TherapySession::withoutGlobalScopes()->count();

        $totalBilled = Invoice::withoutGlobalScopes()->sum('total_amount');
        $totalPaid = Invoice::withoutGlobalScopes()->sum('paid_amount');

        $specialties = [
            'orthophony' => Tenant::where('type', 'orthophony')->count(),
            'psychology' => Tenant::where('type', 'psychology')->count(),
            'multidisciplinary' => Tenant::where('type', 'multidisciplinary')->count(),
        ];

        return response()->json([
            'tenants' => [
                'total' => $totalTenants,
                'active' => $activeTenants,
                'trial' => $trialTenants,
                'suspended' => $suspendedTenants,
            ],
            'clinical' => [
                'total_patients' => $totalPatients,
                'total_specialists' => $totalUsers,
                'total_appointments' => $totalAppointments,
                'total_assessments' => $totalAssessments,
                'total_sessions' => $totalSessions,
            ],
            'financial' => [
                'total_billed_dzd' => (float) $totalBilled,
                'total_collected_dzd' => (float) $totalPaid,
                'currency' => 'DZD',
            ],
            'specialties_distribution' => $specialties,
        ]);
    }

    /**
     * List all clinics with operational metrics.
     */
    public function indexTenants(Request $request): JsonResponse
    {
        $query = Tenant::withCount([
            'patients' => fn($q) => $q->withoutGlobalScopes(),
            'users' => fn($q) => $q->withoutGlobalScopes(),
            'appointments' => fn($q) => $q->withoutGlobalScopes(),
            'invoices' => fn($q) => $q->withoutGlobalScopes(),
        ]);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('subdomain', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        $tenants = $query->latest()->paginate((int) $request->query('per_page', 20));

        // Attach primary admin to each tenant
        $tenants->getCollection()->transform(function ($tenant) {
            $admin = User::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('role', 'clinic_admin')
                ->first();

            $tenant->primary_admin = $admin ? [
                'name' => $admin->name,
                'email' => $admin->email,
                'phone' => $admin->phone,
            ] : null;

            return $tenant;
        });

        return response()->json($tenants);
    }

    /**
     * Provision a new clinic (Tenant + Admin User).
     */
    public function storeTenant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subdomain' => 'required|string|max:64|alpha_dash|unique:tenants,subdomain',
            'type' => 'required|in:orthophony,psychology,multidisciplinary',
            'plan' => 'nullable|in:trial,standard,pro,enterprise',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_phone' => 'nullable|string|max:30',
            'admin_password' => 'required|string|min:6',
            'city' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
        ]);

        return DB::transaction(function () use ($validated) {
            $plan = $validated['plan'] ?? 'pro';

            $tenant = Tenant::create([
                'name' => $validated['name'],
                'subdomain' => strtolower($validated['subdomain']),
                'type' => $validated['type'],
                'status' => 'active',
                'subscription_meta' => [
                    'plan' => $plan,
                    'max_users' => $plan === 'enterprise' ? 50 : ($plan === 'pro' ? 15 : 5),
                    'expires_at' => date('Y-12-31', strtotime('+1 year')),
                ],
                'settings' => [
                    'city' => $validated['city'] ?? 'Alger',
                    'address' => $validated['address'] ?? 'Cabinet Médical',
                    'phone' => $validated['phone'] ?? $validated['admin_phone'] ?? '023000000',
                    'currency' => 'DZD',
                ],
            ]);

            $admin = User::create([
                'tenant_id' => $tenant->id,
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'phone' => $validated['admin_phone'] ?? '0550000000',
                'password' => Hash::make($validated['admin_password']),
                'role' => 'clinic_admin',
                'specialty_license_number' => strtoupper($validated['type']) . '-DZ-' . rand(10, 99) . '-' . rand(100, 999),
                'is_active' => true,
            ]);

            return response()->json([
                'message' => 'Cabinet créé et provisionné avec succès.',
                'tenant' => $tenant,
                'admin' => [
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'role' => $admin->role,
                ],
            ], 201);
        });
    }

    /**
     * Update tenant status (active, trial, suspended) or plan.
     */
    public function updateTenantStatus(Request $request, string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'status' => 'sometimes|required|in:active,trial,suspended',
            'plan' => 'nullable|in:trial,standard,pro,enterprise',
            'type' => 'sometimes|required|in:orthophony,psychology,multidisciplinary',
        ]);

        if (isset($validated['status'])) {
            $tenant->status = $validated['status'];
        }

        if (isset($validated['type'])) {
            $tenant->type = $validated['type'];
        }

        if (isset($validated['plan'])) {
            $meta = $tenant->subscription_meta ?? [];
            $meta['plan'] = $validated['plan'];
            $tenant->subscription_meta = $meta;
        }

        $tenant->save();

        return response()->json([
            'message' => 'Statut du cabinet mis à jour.',
            'tenant' => $tenant,
        ]);
    }

    /**
     * Delete a tenant and its isolated data.
     */
    public function deleteTenant(string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);
        $tenantName = $tenant->name;
        $tenant->delete();

        return response()->json([
            'message' => "Cabinet '{$tenantName}' supprimé avec succès.",
        ]);
    }
}
EOF

cat << 'EOF' > app/Http/Controllers/Api/BackupController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    /**
     * List all database backups.
     */
    public function listBackups(): JsonResponse
    {
        $backupDir = storage_path('app/backups');
        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $files = File::files($backupDir);
        $backups = [];

        foreach ($files as $file) {
            if ($file->getExtension() === 'gz' || $file->getExtension() === 'sql') {
                $backups[] = [
                    'filename' => $file->getFilename(),
                    'size_mb' => round($file->getSize() / 1024 / 1024, 2),
                    'size_kb' => round($file->getSize() / 1024, 1),
                    'created_at' => date('Y-m-d H:i:s', $file->getMTime()),
                ];
            }
        }

        // Sort descending by creation date
        usort($backups, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));

        return response()->json([
            'backups' => $backups,
            'total_count' => count($backups),
        ]);
    }

    /**
     * Trigger a new database dump backup.
     */
    public function createBackup(): JsonResponse
    {
        $backupDir = storage_path('app/backups');
        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $filename = 'backup_clinic_saas_' . date('Y_m_d_His') . '.sql.gz';
        $filepath = $backupDir . '/' . $filename;

        $dbHost = env('DB_HOST', '127.0.0.1');
        $dbName = env('DB_DATABASE', 'clinic_saas_db');
        $dbUser = env('DB_USERNAME', 'clinic_user');
        $dbPass = env('DB_PASSWORD', 'clinic_secure_password123');

        // Execute mysqldump via Docker container
        $cmd = "docker exec clinic_mysql mysqldump -u {$dbUser} -p{$dbPass} {$dbName} 2>/dev/null | gzip > " . escapeshellarg($filepath);
        exec($cmd, $output, $returnCode);

        if ($returnCode !== 0 || !File::exists($filepath) || File::size($filepath) === 0) {
            // Fallback host mysqldump
            $fallbackCmd = "mysqldump -h {$dbHost} -u {$dbUser} -p{$dbPass} {$dbName} 2>/dev/null | gzip > " . escapeshellarg($filepath);
            exec($fallbackCmd, $outputFallback, $returnCodeFallback);

            if ($returnCodeFallback !== 0 || !File::exists($filepath)) {
                return response()->json([
                    'message' => 'Échec de la sauvegarde de la base de données.',
                ], 500);
            }
        }

        return response()->json([
            'message' => 'Sauvegarde de la base de données générée avec succès.',
            'backup' => [
                'filename' => $filename,
                'size_kb' => round(File::size($filepath) / 1024, 1),
                'created_at' => date('Y-m-d H:i:s'),
            ],
        ], 201);
    }

    /**
     * Download backup file.
     */
    public function downloadBackup(string $filename): BinaryFileResponse|JsonResponse
    {
        // Sanitize filename to prevent path traversal
        if (!preg_match('/^[a-zA-Z0-9_\-\.]+\.(sql|sql\.gz)$/', $filename)) {
            return response()->json(['message' => 'Nom de fichier invalide.'], 400);
        }

        $filepath = storage_path('app/backups/' . $filename);

        if (!File::exists($filepath)) {
            return response()->json(['message' => 'Fichier de sauvegarde introuvable.'], 404);
        }

        return response()->download($filepath, $filename, [
            'Content-Type' => 'application/gzip',
        ]);
    }
}
EOF

echo "=== [2/4] Registering Superadmin Routes in routes/api.php ==="
cat << 'EOF' > routes/api.php
<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\ClinicalAssessmentController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\KioskController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\SuperadminController;
use App\Http\Controllers\Api\TherapySessionController;
use Illuminate\Support\Facades\Route;

// Public Authentication & Kiosk Check-In
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});

Route::post('/kiosk/check-in', [KioskController::class, 'checkIn'])->name('kiosk.checkin');

// Protected Superadmin Control Plane
Route::middleware(['auth:sanctum', 'role:superadmin'])->prefix('superadmin')->group(function () {
    Route::get('/metrics', [SuperadminController::class, 'systemMetrics'])->name('superadmin.metrics');
    Route::get('/tenants', [SuperadminController::class, 'indexTenants'])->name('superadmin.tenants.index');
    Route::post('/tenants', [SuperadminController::class, 'storeTenant'])->name('superadmin.tenants.store');
    Route::put('/tenants/{id}/status', [SuperadminController::class, 'updateTenantStatus'])->name('superadmin.tenants.status');
    Route::delete('/tenants/{id}', [SuperadminController::class, 'deleteTenant'])->name('superadmin.tenants.destroy');

    Route::get('/backups', [BackupController::class, 'listBackups'])->name('superadmin.backups.index');
    Route::post('/backups', [BackupController::class, 'createBackup'])->name('superadmin.backups.create');
    Route::get('/backups/{filename}/download', [BackupController::class, 'downloadBackup'])->name('superadmin.backups.download');
});

// Protected Multi-Tenant API
Route::middleware(['auth:sanctum', 'tenant.active'])->group(function () {
    // Auth Session
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
    });

    // Patients Management
    Route::apiResource('patients', PatientController::class);

    // Clinical Assessments & PDF Generation
    Route::get('assessments/{id}/pdf', [ClinicalAssessmentController::class, 'generatePdf'])->name('assessments.pdf');
    Route::apiResource('assessments', ClinicalAssessmentController::class);

    // Therapy & Rehabilitation Sessions
    Route::apiResource('sessions', TherapySessionController::class);

    // Smart Appointments Scheduling
    Route::apiResource('appointments', AppointmentController::class);

    // Billing, Invoicing & Receipts PDF
    Route::get('invoices/{id}/pdf', [InvoiceController::class, 'generatePdf'])->name('invoices.pdf');
    Route::apiResource('invoices', InvoiceController::class);
});
EOF

echo "=== [3/4] Testing Backup Generation ==="
php -r "
require __DIR__.'/vendor/autoload.php';
\$app = require_once __DIR__.'/bootstrap/app.php';
\$kernel = \$app->make(Illuminate\Contracts\Console\Kernel::class);
\$kernel->bootstrap();
\$controller = new App\Http\Controllers\Api\BackupController();
\$res = \$controller->createBackup();
echo \$res->getContent() . PHP_EOL;
"

echo "=== [4/4] Phase 6 Backend Setup Completed ==="
