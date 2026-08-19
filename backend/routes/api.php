<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\OrthoBilanController;
use App\Http\Controllers\TabletSessionController;

/*
|--------------------------------------------------------------------------
| PsyPro API Routes (Laravel 11 Multi-tenant API)
|--------------------------------------------------------------------------
*/

// Public Authentication & Tenant Resolution
Route::group(['prefix' => 'auth'], function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});

Route::get('/tenant/resolve/{subdomain}', [TenantController::class, 'resolve']);

// SuperAdmin Only Routes
Route::group(['prefix' => 'superadmin', 'middleware' => ['tenant.resolver', 'role:superadmin']], function () {
    Route::get('/tenants', [TenantController::class, 'index']);
    Route::post('/tenants', [TenantController::class, 'store']);
});

// Clinic Operations (Tenant Scoped & Role Guarded)
Route::group(['middleware' => ['tenant.resolver']], function () {
    // Patients Management
    Route::get('/patients', [PatientController::class, 'index']);
    Route::post('/patients', [PatientController::class, 'store']);
    Route::get('/patients/{id}', [PatientController::class, 'show']);

    // Appointments & Schedule
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);

    // Orthophonie Clinical Bilans & AI Generation
    Route::get('/bilans', [OrthoBilanController::class, 'index']);
    Route::post('/bilans/generate', [OrthoBilanController::class, 'store']);

    // Tablet Kiosk Interactive Sessions
    Route::post('/tablet/session/create', [TabletSessionController::class, 'createSession']);
});

// Tablet Kiosk Endpoints (PIN-authenticated)
Route::group(['prefix' => 'kiosk'], function () {
    Route::post('/unlock', [TabletSessionController::class, 'unlockByPin']);
    Route::post('/sessions/{id}/submit', [TabletSessionController::class, 'submitAnswers']);
});
