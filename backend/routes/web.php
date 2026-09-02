<?php

use App\Http\Controllers\Api\AiSupportAssistantController;
use Illuminate\Support\Facades\Route;

Route::get('/embed/support-widget.js', [AiSupportAssistantController::class, 'serveEmbedScript'])->name('public.embed_widget_js');

Route::get('/', function () {
    return view('welcome');
});
