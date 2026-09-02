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
            'super_admin' => \App\Http\Middleware\CheckRole::class,
            'superadmin' => \App\Http\Middleware\CheckRole::class,
            'quota' => \App\Http\Middleware\CheckClinicAiQuota::class,
            'feature' => \App\Http\Middleware\EnsureFeatureIsEnabled::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->reportable(function (\Throwable $e) {
            // Filter out non-fatal / expected user errors
            if ($e instanceof \Illuminate\Validation\ValidationException ||
                $e instanceof \Illuminate\Auth\AuthenticationException ||
                $e instanceof \Illuminate\Auth\Access\AuthorizationException ||
                $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException ||
                $e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException ||
                $e instanceof \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException
            ) {
                return;
            }

            try {
                \App\Jobs\AnalyzeSystemExceptionJob::dispatch(
                    get_class($e),
                    $e->getMessage(),
                    $e->getFile(),
                    $e->getLine(),
                    $e->getTraceAsString()
                );
            } catch (\Throwable $dispatchError) {
                \Illuminate\Support\Facades\Log::warning('AnalyzeSystemExceptionJob dispatch failed: ' . $dispatchError->getMessage());
            }
        });
    })->create();
