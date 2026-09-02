<?php

namespace App\Http\Middleware;

use App\Models\PlatformFeatureFlag;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureFeatureIsEnabled
{
    /**
     * Handle an incoming request and check if the platform feature is active.
     */
    public function handle(Request $request, Closure $next, string $featureKey): Response
    {
        $user = Auth::user();

        // Super Admins can access disabled features for testing
        if ($user && ($user->is_super_admin || $user->role === 'super_admin' || $user->email === 'admin@psypro.tech')) {
            return $next($request);
        }

        try {
            if (!PlatformFeatureFlag::isEnabled($featureKey)) {
                $flag = PlatformFeatureFlag::where('feature_key', $featureKey)->first();
                $msg = $flag?->maintenance_message ?: 'هذه الميزة معطلة حالياً من قبل الإدارة لأعمال التحديث والصيانة.';

                return response()->json([
                    'error' => 'feature_disabled',
                    'feature' => $featureKey,
                    'message' => $msg,
                ], 503);
            }

            return $next($request);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('EnsureFeatureIsEnabled bypassed due to error: ' . $e->getMessage());
            return $next($request);
        }
    }
}
