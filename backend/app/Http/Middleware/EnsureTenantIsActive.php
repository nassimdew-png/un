<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsActive
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->role !== 'superadmin' && $user->tenant_id) {
            $tenant = $user->tenant;
            if (!$tenant || !in_array($tenant->status, ['active', 'trial'])) {
                return response()->json([
                    'message' => 'Tenant account is inactive or suspended. Please contact support.',
                    'tenant_status' => $tenant ? $tenant->status : 'unknown',
                ], 403);
            }
        }

        return $next($request);
    }
}
