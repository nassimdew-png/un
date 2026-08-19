<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/', function () {
    return response()->json([
        'status' => 'online',
        'service' => 'PsyPro Laravel Backend API',
        'version' => '1.0.0',
        'database' => 'MongoDB 6.0'
    ]);
});

Route::get('/health', function () {
    return response()->json(['status' => 'healthy']);
});

Route::post('/login', [AuthController::class, 'login']);
Route::post('/api/login', [AuthController::class, 'login']);
