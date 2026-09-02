#!/usr/bin/env bash
set -e

echo "=== [1/6] Setting up Phase 2 Directory & Files ==="
cd /var/www/clinic-saas/backend

mkdir -p app/Http/Controllers/Api
mkdir -p app/Http/Middleware
mkdir -p app/Http/Requests
mkdir -p database/seeders

echo "=== [2/6] Updating Tenant Model with Module Switcher ==="
cat << 'EOF' > app/Models/Tenant.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'subdomain',
        'custom_domain',
        'type',
        'status',
        'subscription_meta',
        'settings',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'enabled_modules',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subscription_meta' => 'array',
            'settings' => 'array',
        ];
    }

    /**
     * Get enabled specialty modules based on tenant type.
     *
     * @return array<string, bool>
     */
    public function getEnabledModulesAttribute(): array
    {
        return [
            'orthophony' => in_array($this->type, ['orthophony', 'multidisciplinary']),
            'psychology' => in_array($this->type, ['psychology', 'multidisciplinary']),
        ];
    }

    public function isOrthophony(): bool
    {
        return in_array($this->type, ['orthophony', 'multidisciplinary']);
    }

    public function isPsychology(): bool
    {
        return in_array($this->type, ['psychology', 'multidisciplinary']);
    }

    public function isMultidisciplinary(): bool
    {
        return $this->type === 'multidisciplinary';
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['active', 'trial']);
    }

    /**
     * Get the users associated with the tenant.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the patients associated with the tenant.
     */
    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class);
    }
}
EOF

echo "=== [3/6] Creating Middleware & Updating bootstrap/app.php ==="
cat << 'EOF' > app/Http/Middleware/EnsureTenantIsActive.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsActive
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->role !== 'superadmin' && $user->tenant_id) {
            $tenant = $user->tenant;
            if (!$tenant || !in_array($tenant->status, ['active', 'trial'])) {
                return response()->json([
                    'message' => 'Tenant account is inactive or suspended. Please contact support.',
                    'tenant_status' => $tenant ? $tenant->status : 'unknown',
                ], 403);
            }
        }

        return $next($request);
    }
}
EOF

cat << 'EOF' > app/Http/Middleware/CheckRole.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Unauthorized: Insufficient role permissions.',
                'required_roles' => $roles,
                'user_role' => $user ? $user->role : null,
            ], 403);
        }

        return $next($request);
    }
}
EOF

cat << 'EOF' > bootstrap/app.php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'tenant.active' => \App\Http\Middleware\EnsureTenantIsActive::class,
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
EOF

echo "=== [4/6] Creating Controllers, Form Requests & Routes ==="

cat << 'EOF' > app/Http/Requests/StorePatientRequest.php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'gender' => 'required|in:male,female',
            'guardian_name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:255',
            'emergency_contact' => 'nullable|string|max:255',
            'kiosk_pin' => 'nullable|string|size:6',
            'anamnesis_data' => 'nullable|array',
        ];
    }
}
EOF

cat << 'EOF' > app/Http/Requests/UpdatePatientRequest.php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'birth_date' => 'sometimes|required|date',
            'gender' => 'sometimes|required|in:male,female',
            'guardian_name' => 'nullable|string|max:255',
            'phone' => 'sometimes|required|string|max:255',
            'emergency_contact' => 'nullable|string|max:255',
            'kiosk_pin' => 'nullable|string|size:6',
            'anamnesis_data' => 'nullable|array',
        ];
    }
}
EOF

cat << 'EOF' > app/Http/Controllers/Api/AuthController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user and issue Sanctum token with tenant context & metadata.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'subdomain' => 'nullable|string',
        ]);

        $subdomain = $request->input('subdomain') 
            ?: $request->header('X-Tenant-Subdomain');

        $user = User::withoutGlobalScopes()->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'User account is deactivated.',
            ], 403);
        }

        $tenant = null;
        if ($user->role !== 'superadmin' && $user->tenant_id) {
            $tenant = Tenant::find($user->tenant_id);

            if (!$tenant) {
                return response()->json([
                    'message' => 'Associated tenant not found.',
                ], 404);
            }

            if ($subdomain && strtolower($tenant->subdomain) !== strtolower($subdomain)) {
                return response()->json([
                    'message' => 'User is not registered under this tenant subdomain.',
                ], 403);
            }

            if (!in_array($tenant->status, ['active', 'trial'])) {
                return response()->json([
                    'message' => 'Tenant subscription is suspended or expired.',
                    'tenant_status' => $tenant->status,
                ], 403);
            }
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'specialty_license_number' => $user->specialty_license_number,
                'is_active' => $user->is_active,
                'tenant_id' => $user->tenant_id,
            ],
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'custom_domain' => $tenant->custom_domain,
                'type' => $tenant->type,
                'status' => $tenant->status,
                'enabled_modules' => $tenant->enabled_modules,
                'is_orthophony' => $tenant->isOrthophony(),
                'is_psychology' => $tenant->isPsychology(),
                'settings' => $tenant->settings,
                'subscription_meta' => $tenant->subscription_meta,
            ] : null,
        ]);
    }

    /**
     * Revoke current Sanctum token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Return authenticated user profile and tenant metadata.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = $user->tenant_id ? Tenant::find($user->tenant_id) : null;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'specialty_license_number' => $user->specialty_license_number,
                'is_active' => $user->is_active,
                'tenant_id' => $user->tenant_id,
            ],
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'custom_domain' => $tenant->custom_domain,
                'type' => $tenant->type,
                'status' => $tenant->status,
                'enabled_modules' => $tenant->enabled_modules,
                'is_orthophony' => $tenant->isOrthophony(),
                'is_psychology' => $tenant->isPsychology(),
                'settings' => $tenant->settings,
                'subscription_meta' => $tenant->subscription_meta,
            ] : null,
        ]);
    }
}
EOF

cat << 'EOF' > app/Http/Controllers/Api/PatientController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    /**
     * Display a listing of patients (automatically scoped to tenant).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Patient::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($gender = $request->query('gender')) {
            $query->where('gender', $gender);
        }

        $perPage = (int) $request->query('per_page', 15);
        $patients = $query->latest()->paginate($perPage);

        return response()->json($patients);
    }

    /**
     * Store a newly created patient (tenant_id auto assigned by BelongsToTenant).
     */
    public function store(StorePatientRequest $request): JsonResponse
    {
        $patient = Patient::create($request->validated());

        return response()->json([
            'message' => 'Patient created successfully.',
            'patient' => $patient,
        ], 201);
    }

    /**
     * Display the specified patient.
     */
    public function show(string $id): JsonResponse
    {
        $patient = Patient::findOrFail($id);

        return response()->json([
            'patient' => $patient,
        ]);
    }

    /**
     * Update the specified patient.
     */
    public function update(UpdatePatientRequest $request, string $id): JsonResponse
    {
        $patient = Patient::findOrFail($id);
        $patient->update($request->validated());

        return response()->json([
            'message' => 'Patient updated successfully.',
            'patient' => $patient,
        ]);
    }

    /**
     * Remove the specified patient.
     */
    public function destroy(string $id): JsonResponse
    {
        $patient = Patient::findOrFail($id);
        $patient->delete();

        return response()->json([
            'message' => 'Patient deleted successfully.',
        ]);
    }
}
EOF

cat << 'EOF' > routes/api.php
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PatientController;
use Illuminate\Support\Facades\Route;

// Public Authentication
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
});

// Protected Multi-Tenant API
Route::middleware(['auth:sanctum', 'tenant.active'])->group(function () {
    // Auth Session
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
    });

    // Patients Management (Multi-tenant isolated)
    Route::apiResource('patients', PatientController::class);
});
EOF

echo "=== [5/6] Writing Database Seeder ==="
cat << 'EOF' > database/seeders/DatabaseSeeder.php
<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Superadmin (No Tenant)
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
            'custom_domain' => null,
            'type' => 'orthophony',
            'status' => 'active',
            'subscription_meta' => [
                'plan' => 'pro',
                'max_users' => 10,
                'expires_at' => '2027-12-31',
            ],
            'settings' => [
                'city' => 'Alger',
                'commune' => 'El Biar',
                'address' => '12 Rue des Frères Bouadou, El Biar, Alger',
                'phone' => '023123456',
                'currency' => 'DZD',
            ],
        ]);

        User::create([
            'tenant_id' => $tenant1->id,
            'name' => 'Dr. Amina Benali (Admin)',
            'email' => 'admin@elbiar-ortho.dz',
            'phone' => '0551112233',
            'password' => Hash::make('password123'),
            'role' => 'clinic_admin',
            'specialty_license_number' => 'ORTHO-DZ-16-001',
            'is_active' => true,
        ]);

        User::create([
            'tenant_id' => $tenant1->id,
            'name' => 'Yasmine Khelil (Orthophoniste)',
            'email' => 'ortho1@elbiar-ortho.dz',
            'phone' => '0552223344',
            'password' => Hash::make('password123'),
            'role' => 'orthophonist',
            'specialty_license_number' => 'ORTHO-DZ-16-045',
            'is_active' => true,
        ]);

        User::create([
            'tenant_id' => $tenant1->id,
            'name' => 'Samia Brahimi (Réception)',
            'email' => 'reception@elbiar-ortho.dz',
            'phone' => '0553334455',
            'password' => Hash::make('password123'),
            'role' => 'receptionist',
            'is_active' => true,
        ]);

        $orthoPatients = [
            [
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
                    'speech_assessment' => 'Trouble de l articulation sur /s/ et /ch/, vocabulaire restreint',
                    'school_level' => 'Moyenne section maternelle',
                ],
            ],
            [
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
                    'speech_assessment' => 'Difficultés en voie phonologique, inversion des graphèmes b/d',
                    'school_level' => '3ème Année Primaire',
                ],
            ],
            [
                'first_name' => 'Adel',
                'last_name' => 'Saadi',
                'birth_date' => '2016-11-03',
                'gender' => 'male',
                'guardian_name' => 'Mourad Saadi',
                'phone' => '0663456789',
                'emergency_contact' => '0777890123',
                'kiosk_pin' => '345678',
                'anamnesis_data' => [
                    'consultation_reason' => 'Bégaiement tonico-clonique',
                    'medical_history' => 'Apparition suite à un choc émotionnel à 5 ans',
                    'speech_assessment' => 'Blocages initiaux sévères sur les consonnes occlusives',
                    'school_level' => '4ème Année Primaire',
                ],
            ],
            [
                'first_name' => 'Rania',
                'last_name' => 'Haddad',
                'birth_date' => '2020-02-18',
                'gender' => 'female',
                'guardian_name' => 'Houda Haddad',
                'phone' => '0664567890',
                'emergency_contact' => '0550112233',
                'kiosk_pin' => '456789',
                'anamnesis_data' => [
                    'consultation_reason' => 'Trouble de la communication sociale / Suspicion TSA',
                    'medical_history' => 'Absence de pointage à 18 mois',
                    'speech_assessment' => 'Écholalies différées, contact visuel fuyant',
                    'school_level' => 'Petite section',
                ],
            ],
            [
                'first_name' => 'Mehdi',
                'last_name' => 'Larbi',
                'birth_date' => '2018-07-25',
                'gender' => 'male',
                'guardian_name' => 'Rachid Larbi',
                'phone' => '0665678901',
                'emergency_contact' => '0771234999',
                'kiosk_pin' => '567890',
                'anamnesis_data' => [
                    'consultation_reason' => 'Dysphasie expressive',
                    'medical_history' => 'Accouchement à terme sans complication',
                    'speech_assessment' => 'Agrammatisme marqué, compréhension préservée',
                    'school_level' => '2ème Année Primaire',
                ],
            ],
        ];

        foreach ($orthoPatients as $p) {
            Patient::create(array_merge($p, ['tenant_id' => $tenant1->id]));
        }

        // 3. Tenant 2: Psychologie Oran
        $tenant2 = Tenant::create([
            'name' => 'Clinique Psychologie Oran',
            'subdomain' => 'oran-psy',
            'custom_domain' => null,
            'type' => 'psychology',
            'status' => 'active',
            'subscription_meta' => [
                'plan' => 'standard',
                'max_users' => 5,
                'expires_at' => '2027-06-30',
            ],
            'settings' => [
                'city' => 'Oran',
                'commune' => 'Akid Lotfi',
                'address' => 'Boulevard Millenium, Akid Lotfi, Oran',
                'phone' => '041987654',
                'currency' => 'DZD',
            ],
        ]);

        User::create([
            'tenant_id' => $tenant2->id,
            'name' => 'Dr. Bilal Mansouri (Admin)',
            'email' => 'admin@oran-psy.dz',
            'phone' => '0554445566',
            'password' => Hash::make('password123'),
            'role' => 'clinic_admin',
            'specialty_license_number' => 'PSY-DZ-31-042',
            'is_active' => true,
        ]);

        User::create([
            'tenant_id' => $tenant2->id,
            'name' => 'Dr. Nadia Cherif (Psychologue)',
            'email' => 'psy1@oran-psy.dz',
            'phone' => '0555556677',
            'password' => Hash::make('password123'),
            'role' => 'psychologist',
            'specialty_license_number' => 'PSY-DZ-31-089',
            'is_active' => true,
        ]);

        $psyPatients = [
            [
                'first_name' => 'Nour',
                'last_name' => 'Zitouni',
                'birth_date' => '2005-06-12',
                'gender' => 'female',
                'guardian_name' => 'Salima Zitouni',
                'phone' => '0666789012',
                'emergency_contact' => '0551223344',
                'kiosk_pin' => '678901',
                'anamnesis_data' => [
                    'consultation_reason' => 'Trouble anxieux généralisé et stress scolaire (Bac)',
                    'clinical_notes' => 'Insomnies, palpitations, hyper-exigence cognitive',
                    'therapy_type' => 'TCC (Thérapie Cognitive et Comportementale)',
                ],
            ],
            [
                'first_name' => 'Sofiane',
                'last_name' => 'Belkacem',
                'birth_date' => '1998-03-30',
                'gender' => 'male',
                'guardian_name' => null,
                'phone' => '0667890123',
                'emergency_contact' => '0772334455',
                'kiosk_pin' => '789012',
                'anamnesis_data' => [
                    'consultation_reason' => 'Épisode dépressif modéré suite à un deuil',
                    'clinical_notes' => 'Anhédonie, ralentissement psychomoteur, isolement',
                    'therapy_type' => 'Soutien psychologique intégratif',
                ],
            ],
            [
                'first_name' => 'Meriem',
                'last_name' => 'Tahri',
                'birth_date' => '2012-10-08',
                'gender' => 'female',
                'guardian_name' => 'Omar Tahri (Père)',
                'phone' => '0668901234',
                'emergency_contact' => '0556778899',
                'kiosk_pin' => '890123',
                'anamnesis_data' => [
                    'consultation_reason' => 'Phobie scolaire et anxiété de séparation',
                    'clinical_notes' => 'Somatisations matinales (maux de ventre, nausées)',
                    'therapy_type' => 'Thérapie familiale systémique',
                ],
            ],
            [
                'first_name' => 'Khaled',
                'last_name' => 'Dahmani',
                'birth_date' => '2001-01-14',
                'gender' => 'male',
                'guardian_name' => null,
                'phone' => '0669012345',
                'emergency_contact' => '0773445566',
                'kiosk_pin' => '901234',
                'anamnesis_data' => [
                    'consultation_reason' => 'Trouble obsessionnel compulsif (TOC de vérification)',
                    'clinical_notes' => 'Rituels de vérification portes et gaz (1h/jour)',
                    'therapy_type' => 'Exposition avec prévention de la réponse (EPR)',
                ],
            ],
            [
                'first_name' => 'Amira',
                'last_name' => 'Slimani',
                'birth_date' => '2015-08-22',
                'gender' => 'female',
                'guardian_name' => 'Zahra Slimani',
                'phone' => '0660123456',
                'emergency_contact' => '0557889900',
                'kiosk_pin' => '012345',
                'anamnesis_data' => [
                    'consultation_reason' => 'TDAH (Trouble Déficit de l\'Attention / Hyperactivité)',
                    'clinical_notes' => 'Impulsivité motrice, difficultés de concentration prolongée',
                    'therapy_type' => 'Remédiation cognitive et psychoéducation parentale',
                ],
            ],
        ];

        foreach ($psyPatients as $p) {
            Patient::create(array_merge($p, ['tenant_id' => $tenant2->id]));
        }

        // 4. Tenant 3: Centre Pluridisciplinaire Constantine (Trial)
        $tenant3 = Tenant::create([
            'name' => 'Centre Pluridisciplinaire Constantine',
            'subdomain' => 'constantine-sante',
            'custom_domain' => null,
            'type' => 'multidisciplinary',
            'status' => 'trial',
            'subscription_meta' => [
                'plan' => 'trial',
                'max_users' => 15,
                'expires_at' => '2026-09-30',
            ],
            'settings' => [
                'city' => 'Constantine',
                'commune' => 'Sidi Mabrouk',
                'address' => 'Cité 500 Logements, Sidi Mabrouk, Constantine',
                'phone' => '031456789',
                'currency' => 'DZD',
            ],
        ]);

        User::create([
            'tenant_id' => $tenant3->id,
            'name' => 'Dr. Tarek Benaissa (Admin)',
            'email' => 'admin@constantine-sante.dz',
            'phone' => '0556667788',
            'password' => Hash::make('password123'),
            'role' => 'clinic_admin',
            'is_active' => true,
        ]);

        User::create([
            'tenant_id' => $tenant3->id,
            'name' => 'Dr. Leila Medjani (Orthophoniste)',
            'email' => 'ortho@constantine-sante.dz',
            'phone' => '0557778899',
            'password' => Hash::make('password123'),
            'role' => 'orthophonist',
            'specialty_license_number' => 'ORTHO-DZ-25-019',
            'is_active' => true,
        ]);

        User::create([
            'tenant_id' => $tenant3->id,
            'name' => 'Dr. Kamel Ouali (Psychologue)',
            'email' => 'psy@constantine-sante.dz',
            'phone' => '0558889900',
            'password' => Hash::make('password123'),
            'role' => 'psychologist',
            'specialty_license_number' => 'PSY-DZ-25-077',
            'is_active' => true,
        ]);

        $multiPatients = [
            [
                'first_name' => 'Wassim',
                'last_name' => 'Guerfi',
                'birth_date' => '2016-05-10',
                'gender' => 'male',
                'guardian_name' => 'Farid Guerfi',
                'phone' => '0661112233',
                'emergency_contact' => '0770998877',
                'kiosk_pin' => '112233',
                'anamnesis_data' => [
                    'consultation_reason' => 'Suivi combiné Orthophonie + Psychologie (Trouble des apprentissages et anxiété de performance)',
                    'orthophony_notes' => 'Dyscalculie et retard en lecture',
                    'psychology_notes' => 'Baisse importante de l\'estime de soi',
                ],
            ],
            [
                'first_name' => 'Lina',
                'last_name' => 'Derbal',
                'birth_date' => '2019-12-01',
                'gender' => 'female',
                'guardian_name' => 'Samira Derbal',
                'phone' => '0662223344',
                'emergency_contact' => '0554332211',
                'kiosk_pin' => '223344',
                'anamnesis_data' => [
                    'consultation_reason' => 'Mutisme sélectif en milieu scolaire',
                    'orthophony_notes' => 'Langage fluide à la maison, mutisme complet à l\'école',
                    'psychology_notes' => 'Prise en charge comportementale progressive',
                ],
            ],
            [
                'first_name' => 'Akram',
                'last_name' => 'Messaoudi',
                'birth_date' => '2014-08-19',
                'gender' => 'male',
                'guardian_name' => 'Abdelkader Messaoudi',
                'phone' => '0663334455',
                'emergency_contact' => '0771445566',
                'kiosk_pin' => '334455',
                'anamnesis_data' => [
                    'consultation_reason' => 'Trouble du spectre autistique (TSA) haut niveau',
                    'orthophony_notes' => 'Pragmatique du langage et habiletés sociales',
                    'psychology_notes' => 'Gestion de la flexibilité cognitive et régulation émotionnelle',
                ],
            ],
            [
                'first_name' => 'Chaima',
                'last_name' => 'Boudiaf',
                'birth_date' => '2018-03-27',
                'gender' => 'female',
                'guardian_name' => 'Malika Boudiaf',
                'phone' => '0664445566',
                'emergency_contact' => '0558112233',
                'kiosk_pin' => '445566',
                'anamnesis_data' => [
                    'consultation_reason' => 'Retard psychomoteur et trouble d\'articulation',
                    'orthophony_notes' => 'Déglutition atypique et respiration buccale',
                    'psychology_notes' => 'Accompagnement parental et stimulation cognitive',
                ],
            ],
            [
                'first_name' => 'Ilyes',
                'last_name' => 'Hamdi',
                'birth_date' => '2017-06-14',
                'gender' => 'male',
                'guardian_name' => 'Nasser Hamdi',
                'phone' => '0665556677',
                'emergency_contact' => '0779223344',
                'kiosk_pin' => '556677',
                'anamnesis_data' => [
                    'consultation_reason' => 'Bégaiement développemental et impulsivité',
                    'orthophony_notes' => 'Exercices de fluence et contrôle respiratoire',
                    'psychology_notes' => 'Gestion des crises de colère et guidance parentale',
                ],
            ],
        ];

        foreach ($multiPatients as $p) {
            Patient::create(array_merge($p, ['tenant_id' => $tenant3->id]));
        }
    }
}
EOF

echo "=== [6/6] Executing Seeder & Testing API ==="
php artisan migrate:fresh --seed --force

echo "=== Phase 2 Installation Complete ==="
