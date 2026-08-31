<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\CustomDomainManagerController;
use App\Http\Controllers\Api\SuperAdmin\DomainManagerController as SuperAdminDomainController;
use App\Http\Controllers\Api\PublicClinicBookingController;
use App\Http\Controllers\Api\SuperAdmin\BaridiMobPaymentController;
use App\Http\Controllers\Api\ExerciseBankController;

// 1. Public Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'backend' => 'Laravel 11',
        'database' => 'MongoDB',
        'features' => [
            'custom_domains_ssl' => 'active',
            'public_mini_sites'  => 'active',
            'baridimob_approval' => 'active',
            'exercises_bank'     => 'active'
        ]
    ]);
});

// 2. Public Clinic Landing & Interactive Booking Routes (No Auth Required)
Route::prefix('public/clinic')->group(function () {
    Route::get('/{slug}', [PublicClinicBookingController::class, 'show']);
    Route::get('/{slug}/available-slots', [PublicClinicBookingController::class, 'availableSlots']);
    Route::post('/{slug}/book', [PublicClinicBookingController::class, 'book']);
});

// 3. Clinical Exercises & Workbooks Bank
Route::prefix('exercises')->group(function () {
    Route::get('/', [ExerciseBankController::class, 'index']);
    Route::get('/bank', [ExerciseBankController::class, 'index']);
    Route::post('/assign-to-patient', [ExerciseBankController::class, 'assignToPatient']);
    Route::post('/assign', [ExerciseBankController::class, 'assignToPatient']);
});

// 4. Auth Routes
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::get('/login', fn() => response()->json(['message' => 'Unauthenticated.'], 401));

// 5. Clinic Custom Domains Management
Route::prefix('clinic/domains')->group(function () {
    Route::get('/', [CustomDomainManagerController::class, 'index']);
    Route::post('/', [CustomDomainManagerController::class, 'store']);
    Route::post('/{id}/verify-dns', [CustomDomainManagerController::class, 'verifyDns']);
    Route::post('/{id}/issue-ssl', [CustomDomainManagerController::class, 'issueSsl']);
    Route::post('/{id}/set-primary', [CustomDomainManagerController::class, 'setPrimary']);
    Route::delete('/{id}', [CustomDomainManagerController::class, 'destroy']);
});

// 6. Clinic Subscription & BaridiMob Transfer Receipts
Route::prefix('clinic/subscription')->group(function () {
    Route::get('/status', [BaridiMobPaymentController::class, 'getClinicStatus']);
    Route::post('/upload-receipt', [BaridiMobPaymentController::class, 'uploadReceipt']);
});

// 7. SuperAdmin SaaS Management
Route::prefix('superadmin')->group(function () {
    // Domains
    Route::get('/domains', [SuperAdminDomainController::class, 'index']);
    Route::post('/domains/{id}/force-renew', [SuperAdminDomainController::class, 'forceRenew']);
    Route::delete('/domains/{id}', [SuperAdminDomainController::class, 'destroy']);

    // BaridiMob Receipts Verification & Approval
    Route::get('/payments/pending-receipts', [BaridiMobPaymentController::class, 'getPendingReceipts']);
    Route::post('/payments/{id}/approve', [BaridiMobPaymentController::class, 'approve']);
    Route::post('/payments/{id}/reject', [BaridiMobPaymentController::class, 'reject']);
});

// 8. Protected Sanctum Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});
