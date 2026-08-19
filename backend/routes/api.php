<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'backend' => 'Laravel 11',
        'database' => 'MongoDB'
    ]);
});

// المسارات العامة (Public Routes)
Route::post('/login', [AuthController::class, 'login']);

// المسارات المحمية (Protected Routes)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});
