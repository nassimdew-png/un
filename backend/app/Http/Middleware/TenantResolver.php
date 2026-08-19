<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;

class TenantResolver
{
    /**
     * Handle an incoming request by identifying tenant from subdomain or X-Tenant-ID header.
     */
    public function handle(Request $request, Closure $next)
    {
        $tenant = null;

        // 1. Try resolving via custom header
        $headerTenantId = $request->header('X-Tenant-ID') ?: $request->header('X-Tenant-Subdomain');
        if ($headerTenantId) {
            $tenant = Tenant::where('_id', $headerTenantId)
                ->orWhere('subdomain', $headerTenantId)
                ->first();
        }

        // 2. Try resolving via host / subdomain
        if (!$tenant) {
            $host = $request->getHost();
            $parts = explode('.', $host);
            if (count($parts) >= 3) {
                $subdomain = $parts[0];
                if (!in_array($subdomain, ['api', 'admin', 'www', 'mail'])) {
                    $tenant = Tenant::where('subdomain', $subdomain)->first();
                }
            }
        }

        // 3. Attach tenant to request attributes if found
        if ($tenant) {
            $request->attributes->set('tenant', $tenant);
            $request->attributes->set('tenant_id', $tenant->_id);
        }

        return $next($request);
    }
}
