#!/usr/bin/env bash
set -e

echo "=== [1/5] Creating Database Migrations for Phase 4 ==="
cd /var/www/clinic-saas/backend

cat << 'EOF' > database/migrations/2026_01_01_000007_create_clinical_assessments_table.php
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
        Schema::create('clinical_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('specialist_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['orthophony_bilan', 'psychometric_eval', 'initial_anamnesis']);
            $table->string('title');
            $table->date('assessment_date');
            $table->json('results_data')->nullable();
            $table->text('diagnostic_conclusion')->nullable();
            $table->text('recommendations')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinical_assessments');
    }
};
EOF

cat << 'EOF' > database/migrations/2026_01_01_000008_create_therapy_sessions_table.php
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
        Schema::create('therapy_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('specialist_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('session_date');
            $table->integer('duration_minutes')->default(45);
            $table->enum('specialty', ['orthophony', 'psychology']);
            $table->text('progress_notes')->nullable();
            $table->json('exercises_targeted')->nullable();
            $table->enum('attendance_status', ['present', 'absent', 'excused'])->default('present');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('therapy_sessions');
    }
};
EOF

echo "=== [2/5] Creating Models ==="
cat << 'EOF' > app/Models/ClinicalAssessment.php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicalAssessment extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'specialist_id',
        'type',
        'title',
        'assessment_date',
        'results_data',
        'diagnostic_conclusion',
        'recommendations',
    ];

    protected function casts(): array
    {
        return [
            'assessment_date' => 'date',
            'results_data' => 'array',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'specialist_id');
    }
}
EOF

cat << 'EOF' > app/Models/TherapySession.php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TherapySession extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'specialist_id',
        'session_date',
        'duration_minutes',
        'specialty',
        'progress_notes',
        'exercises_targeted',
        'attendance_status',
    ];

    protected function casts(): array
    {
        return [
            'session_date' => 'datetime',
            'duration_minutes' => 'integer',
            'exercises_targeted' => 'array',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'specialist_id');
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
}
EOF

cat << 'EOF' > app/Models/User.php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'phone',
        'password',
        'role',
        'specialty_license_number',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(ClinicalAssessment::class, 'specialist_id');
    }

    public function therapySessions(): HasMany
    {
        return $this->hasMany(TherapySession::class, 'specialist_id');
    }
}
EOF

echo "=== [3/5] Creating PDF View & API Controllers ==="
mkdir -p resources/views/pdf

cat << 'EOF' > resources/views/pdf/assessment_report.blade.php
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Compte-Rendu Clinique - {{ $assessment->title }}</title>
    <style>
        @page {
            margin: 28px 32px;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
        }
        body {
            font-size: 11.5px;
            line-height: 1.45;
            color: #1e293b;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .clinic-title {
            font-size: 16px;
            font-weight: bold;
            color: #0369a1;
            text-transform: uppercase;
        }
        .clinic-meta {
            font-size: 10px;
            color: #64748b;
            margin-top: 3px;
        }
        .report-title-badge {
            background-color: #0284c7;
            color: #ffffff;
            font-size: 13px;
            font-weight: bold;
            text-align: center;
            padding: 7px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
        }
        .info-grid {
            width: 100%;
            margin-bottom: 16px;
            border-collapse: collapse;
        }
        .info-grid td {
            padding: 6px 10px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .info-label {
            font-weight: bold;
            color: #475569;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .info-val {
            font-size: 11px;
            color: #0f172a;
            font-weight: 600;
        }
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #0369a1;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-top: 14px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .results-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
            font-size: 10px;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
        }
        .results-table td {
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            font-size: 11px;
        }
        .conclusion-box {
            background-color: #f0fdf4;
            border-left: 3.5px solid #16a34a;
            padding: 10px 12px;
            margin-top: 8px;
            border-radius: 2px;
            font-size: 11px;
            color: #14532d;
        }
        .recommendation-box {
            background-color: #eff6ff;
            border-left: 3.5px solid #2563eb;
            padding: 10px 12px;
            margin-top: 8px;
            border-radius: 2px;
            font-size: 11px;
            color: #1e3a8a;
        }
        .signature-table {
            width: 100%;
            margin-top: 24px;
            border-collapse: collapse;
        }
        .signature-box {
            border: 1px dashed #94a3b8;
            padding: 12px;
            height: 70px;
            text-align: center;
            border-radius: 4px;
            background-color: #fafafa;
        }
        .stamp-text {
            font-size: 9px;
            color: #64748b;
            font-style: italic;
            margin-top: 40px;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="vertical-align: top; width: 65%;">
                <div class="clinic-title">{{ $tenant->name }}</div>
                <div class="clinic-meta">
                    {{ $tenant->settings['address'] ?? 'Cabinet Médical' }} &bull; {{ $tenant->settings['city'] ?? 'Algérie' }}
                </div>
                <div class="clinic-meta">
                    Tél : {{ $tenant->settings['phone'] ?? '023123456' }} &bull; Email : {{ $specialist->email }}
                </div>
            </td>
            <td style="vertical-align: top; text-align: right; width: 35%;">
                <div style="font-size: 11px; font-weight: bold; color: #334155;">RÉPUBLIQUE ALGÉRIENNE</div>
                <div style="font-size: 10px; color: #64748b;">Espace Santé &bull; Dossier N° {{ $patient->id }}</div>
                <div style="font-size: 10px; color: #0284c7; font-weight: bold; margin-top: 4px;">
                    Date : {{ \Carbon\Carbon::parse($assessment->assessment_date)->format('d/m/Y') }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Title Badge -->
    <div class="report-title-badge">
        {{ $assessment->title }}
    </div>

    <!-- Patient & Specialist Info -->
    <table class="info-grid">
        <tr>
            <td style="width: 50%;">
                <div class="info-label">Informations du Patient</div>
                <div class="info-val">{{ $patient->first_name }} {{ $patient->last_name }}</div>
                <div style="font-size: 10.5px; color: #475569; margin-top: 2px;">
                    Né(e) le : {{ \Carbon\Carbon::parse($patient->birth_date)->format('d/m/Y') }} 
                    ({{ $patient->gender === 'male' ? 'Masculin' : 'Féminin' }})
                </div>
                <div style="font-size: 10.5px; color: #475569;">
                    Tuteur / Contact : {{ $patient->guardian_name ?? 'Majeur' }} &bull; {{ $patient->phone }}
                </div>
            </td>
            <td style="width: 50%;">
                <div class="info-label">Praticien Responsable</div>
                <div class="info-val">{{ $specialist->name }}</div>
                <div style="font-size: 10.5px; color: #475569; margin-top: 2px;">
                    Rôle : {{ ucfirst($specialist->role) }}
                </div>
                <div style="font-size: 10.5px; color: #0284c7; font-weight: 600;">
                    N° Agrément / Licence : {{ $specialist->specialty_license_number ?? 'ORTHO/PSY-DZ' }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Structured Results -->
    <div class="section-title">1. Résultats Détaillés de l'Évaluation</div>
    
    @if(!empty($assessment->results_data) && is_array($assessment->results_data))
        <table class="results-table">
            <thead>
                <tr>
                    <th style="width: 40%;">Domaine / Épreuve</th>
                    <th style="width: 60%;">Observations & Scores Cliniques</th>
                </tr>
            </thead>
            <tbody>
                @foreach($assessment->results_data as $key => $value)
                    <tr>
                        <td style="font-weight: 600; color: #334155;">{{ ucwords(str_replace('_', ' ', $key)) }}</td>
                        <td>
                            @if(is_array($value))
                                <ul style="margin: 0; padding-left: 14px;">
                                    @foreach($value as $k => $v)
                                        <li><strong>{{ ucwords(str_replace('_', ' ', $k)) }}:</strong> {{ is_array($v) ? json_encode($v) : $v }}</li>
                                    @endforeach
                                </ul>
                            @else
                                {{ $value }}
                            @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p style="font-style: italic; color: #64748b;">Aucune grille spécifique renseignée pour ce bilan.</p>
    @endif

    <!-- Diagnostic Conclusion -->
    <div class="section-title">2. Conclusion Clinique & Diagnostic</div>
    <div class="conclusion-box">
        <strong>Diagnostic :</strong><br>
        {{ $assessment->diagnostic_conclusion ?? 'Diagnostic clinique établi selon les épreuves standardisées.' }}
    </div>

    <!-- Recommendations -->
    <div class="section-title">3. Préconisations & Projet Thérapeutique</div>
    <div class="recommendation-box">
        <strong>Recommandations :</strong><br>
        {{ $assessment->recommendations ?? 'Poursuite des séances de prise en charge hebdomadaires.' }}
    </div>

    <!-- Signatures -->
    <table class="signature-table">
        <tr>
            <td style="width: 55%; vertical-align: bottom;">
                <div style="font-size: 10px; color: #64748b;">
                    Document officiel généré par le système <strong>ClinicSaaS DZ</strong>.<br>
                    Authenticité vérifiable sous le code d'identification #{{ $assessment->id }}-{{ substr($assessment->tenant_id, 0, 8) }}.
                </div>
            </td>
            <td style="width: 45%; vertical-align: top;">
                <div class="signature-box">
                    <div style="font-size: 11px; font-weight: bold; color: #1e293b;">Signature & Cachet du Praticien</div>
                    <div style="font-size: 10px; color: #0284c7; margin-top: 2px;">{{ $specialist->name }}</div>
                    <div class="stamp-text">Cachet officiel de la clinique</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        {{ $tenant->name }} &bull; Système Médical ClinicSaaS &bull; Page 1/1
    </div>

</body>
</html>
EOF

cat << 'EOF' > app/Http/Controllers/Api/ClinicalAssessmentController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicalAssessment;
use App\Models\Patient;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class ClinicalAssessmentController extends Controller
{
    /**
     * Display a listing of assessments (tenant-scoped).
     */
    public function index(Request $request): JsonResponse
    {
        $query = ClinicalAssessment::with(['patient', 'specialist']);

        if ($patientId = $request->query('patient_id')) {
            $query->where('patient_id', $patientId);
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('diagnostic_conclusion', 'like', "%{$search}%");
            });
        }

        $assessments = $query->latest('assessment_date')->paginate((int) $request->query('per_page', 20));

        return response()->json($assessments);
    }

    /**
     * Store a newly created assessment (tenant-scoped).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'type' => 'required|in:orthophony_bilan,psychometric_eval,initial_anamnesis',
            'title' => 'required|string|max:255',
            'assessment_date' => 'required|date',
            'results_data' => 'nullable|array',
            'diagnostic_conclusion' => 'nullable|string',
            'recommendations' => 'nullable|string',
        ]);

        $validated['specialist_id'] = Auth::id();

        $assessment = ClinicalAssessment::create($validated);

        return response()->json([
            'message' => 'Bilan clinique enregistré avec succès.',
            'assessment' => $assessment->load(['patient', 'specialist']),
        ], 201);
    }

    /**
     * Display the specified assessment.
     */
    public function show(string $id): JsonResponse
    {
        $assessment = ClinicalAssessment::with(['patient', 'specialist', 'tenant'])->findOrFail($id);

        return response()->json([
            'assessment' => $assessment,
        ]);
    }

    /**
     * Update the specified assessment.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $assessment = ClinicalAssessment::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'assessment_date' => 'sometimes|required|date',
            'results_data' => 'nullable|array',
            'diagnostic_conclusion' => 'nullable|string',
            'recommendations' => 'nullable|string',
        ]);

        $assessment->update($validated);

        return response()->json([
            'message' => 'Bilan clinique mis à jour.',
            'assessment' => $assessment->load(['patient', 'specialist']),
        ]);
    }

    /**
     * Remove the specified assessment.
     */
    public function destroy(string $id): JsonResponse
    {
        $assessment = ClinicalAssessment::findOrFail($id);
        $assessment->delete();

        return response()->json([
            'message' => 'Bilan clinique supprimé avec succès.',
        ]);
    }

    /**
     * Generate and stream/download clinical PDF report.
     */
    public function generatePdf(string $id): Response
    {
        $assessment = ClinicalAssessment::with(['patient', 'specialist', 'tenant'])->findOrFail($id);

        $pdf = Pdf::loadView('pdf.assessment_report', [
            'assessment' => $assessment,
            'patient' => $assessment->patient,
            'specialist' => $assessment->specialist,
            'tenant' => $assessment->tenant,
        ]);

        $fileName = 'Bilan_' . $assessment->patient->last_name . '_' . $assessment->id . '.pdf';

        return $pdf->stream($fileName);
    }
}
EOF

cat << 'EOF' > app/Http/Controllers/Api/TherapySessionController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TherapySession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TherapySessionController extends Controller
{
    /**
     * Display a listing of therapy sessions (tenant-scoped).
     */
    public function index(Request $request): JsonResponse
    {
        $query = TherapySession::with(['patient', 'specialist']);

        if ($patientId = $request->query('patient_id')) {
            $query->where('patient_id', $patientId);
        }

        if ($specialty = $request->query('specialty')) {
            $query->where('specialty', $specialty);
        }

        if ($status = $request->query('attendance_status')) {
            $query->where('attendance_status', $status);
        }

        $sessions = $query->latest('session_date')->paginate((int) $request->query('per_page', 25));

        return response()->json($sessions);
    }

    /**
     * Store a newly created session (tenant-scoped).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'session_date' => 'required|date',
            'duration_minutes' => 'nullable|integer|min:15|max:180',
            'specialty' => 'required|in:orthophony,psychology',
            'progress_notes' => 'nullable|string',
            'exercises_targeted' => 'nullable|array',
            'attendance_status' => 'nullable|in:present,absent,excused',
        ]);

        $validated['specialist_id'] = Auth::id();
        $validated['duration_minutes'] = $validated['duration_minutes'] ?? 45;
        $validated['attendance_status'] = $validated['attendance_status'] ?? 'present';

        $session = TherapySession::create($validated);

        return response()->json([
            'message' => 'Séance enregistrée avec succès.',
            'session' => $session->load(['patient', 'specialist']),
        ], 201);
    }

    /**
     * Display the specified session.
     */
    public function show(string $id): JsonResponse
    {
        $session = TherapySession::with(['patient', 'specialist'])->findOrFail($id);

        return response()->json([
            'session' => $session,
        ]);
    }

    /**
     * Update the specified session.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $session = TherapySession::findOrFail($id);

        $validated = $request->validate([
            'session_date' => 'sometimes|required|date',
            'duration_minutes' => 'nullable|integer|min:15|max:180',
            'specialty' => 'sometimes|required|in:orthophony,psychology',
            'progress_notes' => 'nullable|string',
            'exercises_targeted' => 'nullable|array',
            'attendance_status' => 'sometimes|required|in:present,absent,excused',
        ]);

        $session->update($validated);

        return response()->json([
            'message' => 'Séance mise à jour.',
            'session' => $session->load(['patient', 'specialist']),
        ]);
    }

    /**
     * Remove the specified session.
     */
    public function destroy(string $id): JsonResponse
    {
        $session = TherapySession::findOrFail($id);
        $session->delete();

        return response()->json([
            'message' => 'Séance supprimée avec succès.',
        ]);
    }
}
EOF

cat << 'EOF' > routes/api.php
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClinicalAssessmentController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\TherapySessionController;
use Illuminate\Support\Facades\Route;

// Public Authentication
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('login');
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
});
EOF

echo "=== [4/5] Updating Database Seeder with Realistic Assessments & Sessions ==="
cat << 'EOF' > database/seeders/DatabaseSeeder.php
<?php

namespace Database\Seeders;

use App\Models\ClinicalAssessment;
use App\Models\Patient;
use App\Models\Tenant;
use App\Models\TherapySession;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Superadmin
        User::create([
            'name' => 'Super Administrateur',
            'email' => 'superadmin@clinic-saas.dz',
            'phone' => '0550000000',
            'password' => Hash::make('password123'),
            'role' => 'superadmin',
            'is_active' => true,
        ]);

        // 2. Tenant 1: Orthophonie Alger
        $tenant1 = Tenant::create([
            'name' => 'Cabinet Orthophonie Alger',
            'subdomain' => 'elbiar-ortho',
            'type' => 'orthophony',
            'status' => 'active',
            'subscription_meta' => ['plan' => 'pro', 'max_users' => 10, 'expires_at' => '2027-12-31'],
            'settings' => [
                'city' => 'Alger',
                'commune' => 'El Biar',
                'address' => '12 Rue des Frères Bouadou, El Biar, Alger',
                'phone' => '023123456',
                'currency' => 'DZD',
            ],
        ]);

        $admin1 = User::create([
            'tenant_id' => $tenant1->id,
            'name' => 'Dr. Amina Benali (Admin)',
            'email' => 'admin@elbiar-ortho.dz',
            'phone' => '0551112233',
            'password' => Hash::make('password123'),
            'role' => 'clinic_admin',
            'specialty_license_number' => 'ORTHO-DZ-16-001',
            'is_active' => true,
        ]);

        $ortho1 = User::create([
            'tenant_id' => $tenant1->id,
            'name' => 'Yasmine Khelil (Orthophoniste)',
            'email' => 'ortho1@elbiar-ortho.dz',
            'phone' => '0552223344',
            'password' => Hash::make('password123'),
            'role' => 'orthophonist',
            'specialty_license_number' => 'ORTHO-DZ-16-045',
            'is_active' => true,
        ]);

        $p1 = Patient::create([
            'tenant_id' => $tenant1->id,
            'first_name' => 'Yanis',
            'last_name' => 'Meziani',
            'birth_date' => '2019-04-15',
            'gender' => 'male',
            'guardian_name' => 'Karim Meziani (Père)',
            'phone' => '0661234567',
            'emergency_contact' => '0770123456',
            'kiosk_pin' => '123456',
            'anamnesis_data' => [
                'consultation_reason' => 'Retard de langage et de parole',
                'medical_history' => 'Otites séro-muqueuses récidivantes',
                'speech_assessment' => 'Trouble de l articulation sur /s/ et /ch/',
            ],
        ]);

        $p2 = Patient::create([
            'tenant_id' => $tenant1->id,
            'first_name' => 'Inès',
            'last_name' => 'Boukhalfa',
            'birth_date' => '2017-09-20',
            'gender' => 'female',
            'guardian_name' => 'Fatima Boukhalfa (Mère)',
            'phone' => '0662345678',
            'emergency_contact' => '0555678901',
            'kiosk_pin' => '234567',
            'anamnesis_data' => [
                'consultation_reason' => 'Dyslexie et dysorthographie',
                'medical_history' => 'Développement psychomoteur normal',
                'speech_assessment' => 'Difficultés en voie phonologique, inversion b/d',
            ],
        ]);

        $p3 = Patient::create([
            'tenant_id' => $tenant1->id,
            'first_name' => 'Adel',
            'last_name' => 'Saadi',
            'birth_date' => '2016-11-03',
            'gender' => 'male',
            'guardian_name' => 'Mourad Saadi',
            'phone' => '0663456789',
            'kiosk_pin' => '345678',
            'anamnesis_data' => ['consultation_reason' => 'Bégaiement tonico-clonique'],
        ]);

        // Assessments for Tenant 1
        ClinicalAssessment::create([
            'tenant_id' => $tenant1->id,
            'patient_id' => $p1->id,
            'specialist_id' => $ortho1->id,
            'type' => 'orthophony_bilan',
            'title' => 'Bilan Phonologique et Articulatoire Complet',
            'assessment_date' => '2026-08-01',
            'results_data' => [
                'phonologie_test' => 'Sigmatisme interdental marqué sur /s/, /z/',
                'vocabulaire_score' => 'Percentile 25 (Retard lexical modéré)',
                'comprehension_syntaxique' => 'Score 18/20 (Norme normale)',
                'praxies_bucco_faciales' => 'Hypotonie linguale légère',
            ],
            'diagnostic_conclusion' => 'Retard de parole et trouble articulatoire isolé sans atteinte de la compréhension.',
            'recommendations' => 'Séances d orthophonie hebdomadaires (2x/semaine) axées sur le renforcement praxique et la différenciation phonologique.',
        ]);

        ClinicalAssessment::create([
            'tenant_id' => $tenant1->id,
            'patient_id' => $p2->id,
            'specialist_id' => $admin1->id,
            'type' => 'orthophony_bilan',
            'title' => 'Bilan du Langage Écrit (Lecture & Orthographe)',
            'assessment_date' => '2026-08-05',
            'results_data' => [
                'vitesse_lecture' => '65 mots/min (Attendu CM1 : 110 mots/min)',
                'voie_phonologique' => 'Difficulté sur les pseudo-mots complexes',
                'voie_lexicale' => 'Confusions homophoniques fréquentes',
            ],
            'diagnostic_conclusion' => 'Dyslexie mixte à prédominance phonologique avec dysorthographie associée.',
            'recommendations' => 'Aménagements scolaires (tiers-temps) et rééducation orthophonique ciblée sur l assemblage graphème-phonème.',
        ]);

        // Therapy Sessions for Tenant 1
        TherapySession::create([
            'tenant_id' => $tenant1->id,
            'patient_id' => $p1->id,
            'specialist_id' => $ortho1->id,
            'session_date' => '2026-08-10 10:00:00',
            'duration_minutes' => 45,
            'specialty' => 'orthophony',
            'progress_notes' => 'Travail du phonème /s/ en position initiale. Bonne participation de l enfant.',
            'exercises_targeted' => ['Loto des sons', 'Praxies labiales', 'Répétition de syllabes simples'],
            'attendance_status' => 'present',
        ]);

        TherapySession::create([
            'tenant_id' => $tenant1->id,
            'patient_id' => $p1->id,
            'specialist_id' => $ortho1->id,
            'session_date' => '2026-08-17 10:00:00',
            'duration_minutes' => 45,
            'specialty' => 'orthophony',
            'progress_notes' => 'Intégration du son /ch/ dans des mots bisyllabiques. Automatisation en cours.',
            'exercises_targeted' => ['Jeu de memory phonologique', 'Lecture guidée'],
            'attendance_status' => 'present',
        ]);

        TherapySession::create([
            'tenant_id' => $tenant1->id,
            'patient_id' => $p2->id,
            'specialist_id' => $admin1->id,
            'session_date' => '2026-08-12 14:30:00',
            'duration_minutes' => 45,
            'specialty' => 'orthophony',
            'progress_notes' => 'Entraînement au découpage syllabique et discrimination b/d.',
            'exercises_targeted' => ['Flashcards b/d', 'Dictée de logatomes'],
            'attendance_status' => 'present',
        ]);

        // 3. Tenant 2: Psychologie Oran
        $tenant2 = Tenant::create([
            'name' => 'Clinique Psychologie Oran',
            'subdomain' => 'oran-psy',
            'type' => 'psychology',
            'status' => 'active',
            'subscription_meta' => ['plan' => 'standard', 'max_users' => 5, 'expires_at' => '2027-06-30'],
            'settings' => [
                'city' => 'Oran',
                'commune' => 'Akid Lotfi',
                'address' => 'Boulevard Millenium, Akid Lotfi, Oran',
                'phone' => '041987654',
                'currency' => 'DZD',
            ],
        ]);

        $admin2 = User::create([
            'tenant_id' => $tenant2->id,
            'name' => 'Dr. Bilal Mansouri (Admin)',
            'email' => 'admin@oran-psy.dz',
            'phone' => '0554445566',
            'password' => Hash::make('password123'),
            'role' => 'clinic_admin',
            'specialty_license_number' => 'PSY-DZ-31-042',
            'is_active' => true,
        ]);

        $psy2 = User::create([
            'tenant_id' => $tenant2->id,
            'name' => 'Dr. Nadia Cherif (Psychologue)',
            'email' => 'psy1@oran-psy.dz',
            'phone' => '0555556677',
            'password' => Hash::make('password123'),
            'role' => 'psychologist',
            'specialty_license_number' => 'PSY-DZ-31-089',
            'is_active' => true,
        ]);

        $psyP1 = Patient::create([
            'tenant_id' => $tenant2->id,
            'first_name' => 'Nour',
            'last_name' => 'Zitouni',
            'birth_date' => '2005-06-12',
            'gender' => 'female',
            'phone' => '0666789012',
            'kiosk_pin' => '678901',
            'anamnesis_data' => ['consultation_reason' => 'Trouble anxieux généralisé et stress scolaire (Bac)'],
        ]);

        ClinicalAssessment::create([
            'tenant_id' => $tenant2->id,
            'patient_id' => $psyP1->id,
            'specialist_id' => $psy2->id,
            'type' => 'psychometric_eval',
            'title' => 'Évaluation Psychométrique & Échelle d Anxiété GAD-7',
            'assessment_date' => '2026-08-08',
            'results_data' => [
                'gad7_score' => '16/21 (Anxiété sévère)',
                'phq9_score' => '8/27 (Symptômes dépressifs légers)',
                'cognitions' => 'Peur anticipatoire d échec, hypervigilance somatique',
                'coping_strategies' => 'Évitement des situations d examen',
            ],
            'diagnostic_conclusion' => 'Trouble Anxieux Généralisé (TAG) à fort retentissement émotionnel et scolaire.',
            'recommendations' => 'Protocole TCC (Thérapie Cognitive et Comportementale) : Restructuration cognitive et relaxation de Jacobson.',
        ]);

        TherapySession::create([
            'tenant_id' => $tenant2->id,
            'patient_id' => $psyP1->id,
            'specialist_id' => $psy2->id,
            'session_date' => '2026-08-15 16:00:00',
            'duration_minutes' => 50,
            'specialty' => 'psychology',
            'progress_notes' => 'Séance 1 TCC : Psychoéducation sur le mécanisme de l anxiété et identification des pensées automatiques.',
            'exercises_targeted' => ['Colonne de Beck', 'Respiration abdominale'],
            'attendance_status' => 'present',
        ]);

        // 4. Tenant 3: Pluridisciplinaire Constantine
        $tenant3 = Tenant::create([
            'name' => 'Centre Pluridisciplinaire Constantine',
            'subdomain' => 'constantine-sante',
            'type' => 'multidisciplinary',
            'status' => 'trial',
            'subscription_meta' => ['plan' => 'trial', 'max_users' => 15, 'expires_at' => '2026-09-30'],
            'settings' => [
                'city' => 'Constantine',
                'commune' => 'Sidi Mabrouk',
                'address' => 'Cité 500 Logements, Sidi Mabrouk, Constantine',
                'phone' => '031456789',
                'currency' => 'DZD',
            ],
        ]);

        $admin3 = User::create([
            'tenant_id' => $tenant3->id,
            'name' => 'Dr. Tarek Benaissa (Admin)',
            'email' => 'admin@constantine-sante.dz',
            'phone' => '0556667788',
            'password' => Hash::make('password123'),
            'role' => 'clinic_admin',
            'is_active' => true,
        ]);

        $pMulti = Patient::create([
            'tenant_id' => $tenant3->id,
            'first_name' => 'Wassim',
            'last_name' => 'Guerfi',
            'birth_date' => '2016-05-10',
            'gender' => 'male',
            'phone' => '0661112233',
            'guardian_name' => 'Farid Guerfi',
            'kiosk_pin' => '112233',
            'anamnesis_data' => ['consultation_reason' => 'Suivi combiné Orthophonie + Psychologie'],
        ]);

        ClinicalAssessment::create([
            'tenant_id' => $tenant3->id,
            'patient_id' => $pMulti->id,
            'specialist_id' => $admin3->id,
            'type' => 'initial_anamnesis',
            'title' => 'Bilan Clinique Pluridisciplinaire d Entrée',
            'assessment_date' => '2026-08-04',
            'results_data' => [
                'orthophonie' => 'Dyscalculie et retard d acquisition lexicale',
                'psychologie' => 'Baisse marquée de l estime de soi en classe',
                'coordination' => 'Plan de soins coordonné bimensuel',
            ],
            'diagnostic_conclusion' => 'Trouble spécifique des apprentissages avec composante anxiogène secondaire.',
            'recommendations' => 'Prise en charge combinée : 1 séance orthophonie + 1 séance soutien psychologique par semaine.',
        ]);

        TherapySession::create([
            'tenant_id' => $tenant3->id,
            'patient_id' => $pMulti->id,
            'specialist_id' => $admin3->id,
            'session_date' => '2026-08-18 11:00:00',
            'duration_minutes' => 60,
            'specialty' => 'orthophony',
            'progress_notes' => 'Séance mixte de calcul mental et valorisation des réussites.',
            'exercises_targeted' => ['Matériel Montessori numérique', 'Renforcement positif'],
            'attendance_status' => 'present',
        ]);
    }
}
EOF

echo "=== [5/5] Running Migrations and Seeder ==="
php artisan migrate:fresh --seed --force

echo "=== Phase 4 Backend Setup Completed Successfully ==="
