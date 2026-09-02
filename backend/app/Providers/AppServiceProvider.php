<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // High throughput rate limiter for API requests (1000 req/min for authenticated users, 300 for guests)
        RateLimiter::for('api', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(1000)->by($request->user()->id)
                : Limit::perMinute(300)->by($request->ip());
        });

        // Flexible rate limiter for login attempts (60 attempts per minute)
        RateLimiter::for('login', function (Request $request) {
            $email = (string) $request->input('email', 'guest');
            return Limit::perMinute(60)->by($email . '|' . $request->ip());
        });

        // Relaxed rate limiter for high-frequency polling endpoints (video status, queue, maintainer logs)
        RateLimiter::for('polling', function (Request $request) {
            return Limit::none();
        });
    }
}
