<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;

class TenantResolver
{
    public function handle(Request $request, Closure $next)
    {
        // استخراج النطاق الفرعي من الـ Host
        $host = $request->getHost();
        $subdomain = explode('.', $host)[0];

        // البحث عن العيادة
        $tenant = Tenant::where('subdomain', $subdomain)->first();

        if (!$tenant && $subdomain !== 'api' && $subdomain !== 'localhost') {
            return response()->json(['message' => 'Clinic not found.'], 404);
        }

        // تخزين كائن المستأجر في الطلب لسهولة الوصول إليه
        if ($tenant) {
            $request->merge(['current_tenant' => $tenant]);
        }

        return $next($request);
    }
}
