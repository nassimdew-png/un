<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::get('/', function () {
    return response()->json([
        'status'   => 'online',
        'service'  => 'PsyPro Laravel Backend API',
        'version'  => '1.0.0',
        'database' => 'Connected'
    ]);
});

Route::get('/health', function () {
    return response()->json(['status' => 'healthy']);
});

Route::get('/login', fn() => response()->json(['status' => 'error', 'message' => 'Unauthenticated.'], 401))->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/api/login', [AuthController::class, 'login']);
