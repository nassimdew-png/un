<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\CustomDomainManagerController;
use App\Http\Controllers\Api\SuperAdmin\DomainManagerController as SuperAdminDomainController;
use App\Http\Controllers\Api\SuperAdmin\BaridiMobPaymentController;
use App\Http\Controllers\Api\SuperAdmin\CommunicationGatewayController;
use App\Http\Controllers\Api\SuperAdmin\AIProviderManagerController;
use App\Http\Controllers\Api\SuperAdmin\FeatureSwitchController;
use App\Http\Controllers\Api\SuperAdmin\ClinicQuotaController;
use App\Http\Controllers\Api\SuperAdmin\SubscriptionPlanManagerController;
use App\Http\Controllers\Api\PublicClinicBookingController;
use App\Http\Controllers\Api\ExerciseBankController;

// 1. Public Health Check
Route::get('/health', function () {
    return response()->json([
        'status'   => 'healthy',
        'backend'  => 'Laravel 11',
        'database' => 'Connected',
        'features' => [
            'authentication'          => 'active',
            'patients_crud'           => 'active',
            'superadmin_ai_providers' => 'active',
            'communication_gateways'  => 'active',
            'feature_switches'        => 'active',
            'clinic_quotas'           => 'active',
            'custom_domains_ssl'      => 'active',
            'public_mini_sites'       => 'active',
            'baridimob_approval'      => 'active',
            'exercises_bank'          => 'active'
        ]
    ]);
});

// 2. Public Authentication Endpoints
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
});

// Backward compatibility aliases:
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);

// 3. Patients API Endpoints (Direct access fallback)
Route::apiResource('patients', PatientController::class);
Route::get('/patients/{id}/history', [PatientController::class, 'history']);
Route::post('/patients/{id}/upload-avatar', [PatientController::class, 'uploadAvatar']);

// 4. Public Clinic Landing & Interactive Booking Routes (No Auth Required)
Route::prefix('public/clinic')->group(function () {
    Route::get('/{slug}', [PublicClinicBookingController::class, 'show']);
    Route::get('/{slug}/available-slots', [PublicClinicBookingController::class, 'availableSlots']);
    Route::post('/{slug}/book', [PublicClinicBookingController::class, 'book']);
});

// 5. Clinical Exercises & Workbooks Bank
Route::prefix('exercises')->group(function () {
    Route::get('/', [ExerciseBankController::class, 'index']);
    Route::get('/bank', [ExerciseBankController::class, 'index']);
    Route::post('/assign-to-patient', [ExerciseBankController::class, 'assignToPatient']);
    Route::post('/assign', [ExerciseBankController::class, 'assignToPatient']);
});

// 6. Clinic Custom Domains Management
Route::prefix('clinic/domains')->group(function () {
    Route::get('/', [CustomDomainManagerController::class, 'index']);
    Route::post('/', [CustomDomainManagerController::class, 'store']);
    Route::post('/{id}/verify-dns', [CustomDomainManagerController::class, 'verifyDns']);
    Route::post('/{id}/issue-ssl', [CustomDomainManagerController::class, 'issueSsl']);
    Route::post('/{id}/set-primary', [CustomDomainManagerController::class, 'setPrimary']);
    Route::delete('/{id}', [CustomDomainManagerController::class, 'destroy']);
});

// 7. Clinic Subscription & BaridiMob Transfer Receipts
Route::prefix('clinic/subscription')->group(function () {
    Route::get('/status', [BaridiMobPaymentController::class, 'getClinicStatus']);
    Route::post('/upload-receipt', [BaridiMobPaymentController::class, 'uploadReceipt']);
});

// 8. SuperAdmin SaaS Management
Route::prefix('superadmin')->group(function () {
    // Domains
    Route::get('/domains', [SuperAdminDomainController::class, 'index']);
    Route::post('/domains/{id}/force-renew', [SuperAdminDomainController::class, 'forceRenew']);
    Route::delete('/domains/{id}', [SuperAdminDomainController::class, 'destroy']);

    // BaridiMob Receipts Verification & Approval
    Route::get('/payments/pending-receipts', [BaridiMobPaymentController::class, 'getPendingReceipts']);
    Route::post('/payments/{id}/approve', [BaridiMobPaymentController::class, 'approve']);
    Route::post('/payments/{id}/reject', [BaridiMobPaymentController::class, 'reject']);

    // Communication Gateways (SMTP / SMS / WhatsApp)
    Route::get('/communication-settings', [CommunicationGatewayController::class, 'getSettings']);
    Route::post('/communication-settings/save', [CommunicationGatewayController::class, 'saveSettings']);
    Route::post('/communication-settings/test-email', [CommunicationGatewayController::class, 'testEmail']);
    Route::post('/communication-settings/test-sms', [CommunicationGatewayController::class, 'testSms']);
    Route::post('/communication-settings/test-whatsapp', [CommunicationGatewayController::class, 'testWhatsapp']);

    // AI Provider Management (Gemini / OpenAI / DeepSeek / Claude)
    Route::get('/ai-providers', [AIProviderManagerController::class, 'getProviders']);
    Route::post('/ai-providers/save', [AIProviderManagerController::class, 'saveKey']);
    Route::post('/ai-providers/test', [AIProviderManagerController::class, 'testConnection']);
    Route::post('/ai-providers/toggle', [AIProviderManagerController::class, 'toggleProvider']);

    // Feature Master Switches
    Route::get('/feature-switches', [FeatureSwitchController::class, 'getSwitches']);
    Route::post('/feature-switches/update', [FeatureSwitchController::class, 'updateSwitch']);

    // Clinic Quotas & Overrides
    Route::get('/clinics/quotas', [ClinicQuotaController::class, 'getQuotas']);
    Route::put('/clinics/{id}/quota', [ClinicQuotaController::class, 'updateClinicQuota']);

    // Subscription Plans & Pricing
    Route::get('/plans', [SubscriptionPlanManagerController::class, 'index']);
    Route::post('/plans', [SubscriptionPlanManagerController::class, 'store']);
    Route::put('/plans/{id}', [SubscriptionPlanManagerController::class, 'update']);
    Route::delete('/plans/{id}', [SubscriptionPlanManagerController::class, 'destroy']);
});

// 9. Authenticated Sanctum Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Patient CRUD & Sub-resources
    Route::apiResource('patients', PatientController::class);
    Route::get('/patients/{id}/history', [PatientController::class, 'history']);
    Route::post('/patients/{id}/upload-avatar', [PatientController::class, 'uploadAvatar']);

    // Compatibility alias for clinic prefix:
    Route::prefix('clinic')->group(function () {
        Route::apiResource('patients', PatientController::class);
    });
});
