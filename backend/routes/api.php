<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\CustomDomainManagerController;
use App\Http\Controllers\Api\SuperAdmin\DomainManagerController as SuperAdminDomainController;

// Public Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'backend' => 'Laravel 11',
        'database' => 'MongoDB',
        'ssl_engine' => 'Certbot + Nginx Automation Ready'
    ]);
});

// المسارات العامة (Public Routes)
Route::post('/login', [AuthController::class, 'login']);

// Clinic Custom Domains Management
Route::prefix('clinic/domains')->group(function () {
    Route::get('/', [CustomDomainManagerController::class, 'index']);
    Route::post('/', [CustomDomainManagerController::class, 'store']);
    Route::post('/{id}/verify-dns', [CustomDomainManagerController::class, 'verifyDns']);
    Route::post('/{id}/issue-ssl', [CustomDomainManagerController::class, 'issueSsl']);
    Route::post('/{id}/set-primary', [CustomDomainManagerController::class, 'setPrimary']);
    Route::delete('/{id}', [CustomDomainManagerController::class, 'destroy']);
});

// SuperAdmin SaaS-Wide Custom Domains Management
Route::prefix('superadmin/domains')->group(function () {
    Route::get('/', [SuperAdminDomainController::class, 'index']);
    Route::post('/{id}/force-renew', [SuperAdminDomainController::class, 'forceRenew']);
    Route::delete('/{id}', [SuperAdminDomainController::class, 'destroy']);
});

// المسارات المحمية بواسطة Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});
