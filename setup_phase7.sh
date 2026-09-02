#!/usr/bin/env bash
set -e

echo "=== [1/5] Creating Migration for Patient Attachments ==="
cd /var/www/clinic-saas/backend

cat << 'EOF' > database/migrations/2026_01_01_000011_create_patient_attachments_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('patient_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->enum('related_type', ['assessment', 'session', 'general'])->default('general');
            $table->unsignedBigInteger('related_id')->nullable();
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->integer('file_size_kb');
            $table->enum('category', ['audio_recording', 'medical_report', 'imaging', 'other'])->default('other');
            $table->string('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_attachments');
    }
};
EOF

echo "=== [2/5] Creating Model & Controller ==="
cat << 'EOF' > app/Models/PatientAttachment.php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PatientAttachment extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'related_type',
        'related_id',
        'file_name',
        'file_path',
        'mime_type',
        'file_size_kb',
        'category',
        'notes',
    ];

    protected $appends = ['url'];

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }
}
EOF

cat << 'EOF' > app/Models/Patient.php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'first_name',
        'last_name',
        'birth_date',
        'gender',
        'guardian_name',
        'phone',
        'emergency_contact',
        'kiosk_pin',
        'anamnesis_data',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'anamnesis_data' => 'array',
        ];
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(ClinicalAssessment::class, 'patient_id');
    }

    public function therapySessions(): HasMany
    {
        return $this->hasMany(TherapySession::class, 'patient_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'patient_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(PatientAttachment::class, 'patient_id');
    }
}
EOF

cat << 'EOF' > app/Http/Controllers/Api/AttachmentController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PatientAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AttachmentController extends Controller
{
    /**
     * List patient attachments (tenant-scoped).
     */
    public function index(Request $request, string $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);

        $query = PatientAttachment::where('patient_id', $patient->id);

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        $attachments = $query->latest()->get();

        return response()->json([
            'attachments' => $attachments,
            'total_count' => $attachments->count(),
        ]);
    }

    /**
     * Upload an audio recording or document for patient.
     */
    public function upload(Request $request, string $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);

        $validated = $request->validate([
            'file' => 'required|file|max:15360', // max 15MB
            'category' => 'nullable|in:audio_recording,medical_report,imaging,other',
            'related_type' => 'nullable|in:assessment,session,general',
            'related_id' => 'nullable|integer',
            'notes' => 'nullable|string|max:255',
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getMimeType();
        $sizeKb = round($file->getSize() / 1024);

        // Determine category automatically if not supplied
        $category = $validated['category'] ?? null;
        if (!$category) {
            if (str_starts_with($mimeType, 'audio/') || str_contains($originalName, '.wav') || str_contains($originalName, '.mp3') || str_contains($originalName, '.webm') || str_contains($originalName, '.ogg')) {
                $category = 'audio_recording';
            } elseif (str_starts_with($mimeType, 'image/')) {
                $category = 'imaging';
            } elseif ($mimeType === 'application/pdf') {
                $category = 'medical_report';
            } else {
                $category = 'other';
            }
        }

        $tenantId = Auth::user()->tenant_id;
        $folder = "tenants/{$tenantId}/patient_{$patient->id}";
        $path = $file->store($folder, 'public');

        $attachment = PatientAttachment::create([
            'patient_id' => $patient->id,
            'related_type' => $validated['related_type'] ?? 'general',
            'related_id' => $validated['related_id'] ?? null,
            'file_name' => $originalName,
            'file_path' => $path,
            'mime_type' => $mimeType,
            'file_size_kb' => $sizeKb,
            'category' => $category,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Fichier joint enregistré avec succès.',
            'attachment' => $attachment,
        ], 201);
    }

    /**
     * Download attachment file.
     */
    public function download(string $id): BinaryFileResponse|JsonResponse
    {
        $attachment = PatientAttachment::findOrFail($id);

        if (!Storage::disk('public')->exists($attachment->file_path)) {
            return response()->json(['message' => 'Fichier introuvable sur le disque.'], 404);
        }

        $filePath = Storage::disk('public')->path($attachment->file_path);

        return response()->download($filePath, $attachment->file_name);
    }

    /**
     * Delete an attachment.
     */
    public function destroy(string $id): JsonResponse
    {
        $attachment = PatientAttachment::findOrFail($id);

        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $attachment->delete();

        return response()->json([
            'message' => 'Fichier supprimé avec succès.',
        ]);
    }
}
EOF

echo "=== [3/5] Updating API Routes & Storage Link ==="
cat << 'EOF' > routes/api.php
<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AttachmentController;
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

    // Patient Attachments & Clinical Audio
    Route::get('patients/{patientId}/attachments', [AttachmentController::class, 'index'])->name('attachments.index');
    Route::post('patients/{patientId}/attachments', [AttachmentController::class, 'upload'])->name('attachments.upload');
    Route::get('attachments/{id}/download', [AttachmentController::class, 'download'])->name('attachments.download');
    Route::delete('attachments/{id}', [AttachmentController::class, 'destroy'])->name('attachments.destroy');

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

php artisan storage:link || true
php artisan migrate --force

echo "=== [4/5] Creating PM2 Ecosystem Configuration ==="
cat << 'EOF' > /var/www/clinic-saas/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'clinic-backend',
      script: 'artisan',
      args: 'serve --host=0.0.0.0 --port=8000',
      interpreter: 'php',
      cwd: '/var/www/clinic-saas/backend',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'clinic-frontend',
      script: 'node_modules/.bin/vite',
      args: 'preview --host 0.0.0.0 --port 3001',
      cwd: '/var/www/clinic-saas/frontend',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'clinic-queue',
      script: 'artisan',
      args: 'queue:work --sleep=3 --tries=3',
      interpreter: 'php',
      cwd: '/var/www/clinic-saas/backend',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

echo "=== [5/5] Switching to PM2 Process Manager and Optimizing Cache ==="
# Stop systemd services so PM2 can take over ports 8000 & 3001
systemctl stop clinic-backend clinic-frontend || true
systemctl disable clinic-backend clinic-frontend || true

# Kill any stray processes on 8000 or 3001
fuser -k 8000/tcp || true
fuser -k 3001/tcp || true

# Start PM2
pm2 start /var/www/clinic-saas/ecosystem.config.cjs
pm2 save

# Optimize Laravel cache
cd /var/www/clinic-saas/backend
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "=== Phase 7 Backend & PM2 Configured Successfully ==="
