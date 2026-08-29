<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\ClinicCustomDomain;
use Throwable;

class TenantResolver
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $host = strtolower($request->getHost());
            $tenant = null;

            // 1. Check if the request comes via Custom Domain (e.g. dr-benali.dz)
            $customDomainHeader = $request->header('X-Custom-Domain');
            $targetDomain = $customDomainHeader ?? $host;

            // Strip port if present
            $targetDomain = explode(':', $targetDomain)[0];
            $cleanDomain = preg_replace('/^www\./i', '', $targetDomain);

            $customDomainRecord = ClinicCustomDomain::where('domain', $cleanDomain)
                ->orWhere('domain', $targetDomain)
                ->first();

            if ($customDomainRecord && $customDomainRecord->clinic_id) {
                $tenant = Tenant::find($customDomainRecord->clinic_id);
            }

            // 2. If not a custom domain, resolve via Subdomain
            if (!$tenant) {
                $parts = explode('.', $host);
                $subdomain = $parts[0] ?? 'elamal';

                // إذا كان الدخول عبر الـ IP مباشرة أو nip.io أو localhost أو api
                if (is_numeric($subdomain) || in_array($subdomain, ['api', 'localhost', '127', 'frontend', 'backend', 'app', 'psypro'])) {
                    $headerSub = $request->header('X-Tenant-Subdomain') ?? $request->get('subdomain');
                    if ($headerSub) {
                        $subdomain = $headerSub;
                    } else {
                        $subdomain = 'elamal'; // العيادة الافتراضية
                    }
                }

                $tenant = Tenant::where('subdomain', $subdomain)->first();
            }

            // 3. Fallback to default demo tenant if needed
            if (!$tenant) {
                $tenant = Tenant::firstOrCreate(
                    ['subdomain' => 'elamal'],
                    [
                        'name' => 'عيادة الأمل التجريبية',
                        'specialty_type' => 'multidisciplinary',
                        'subscription' => ['status' => 'active', 'plan' => 'trial']
                    ]
                );
            }

            if ($tenant) {
                $request->merge(['current_tenant' => $tenant]);
            }
        } catch (Throwable $e) {
            // Graceful fallback
        }

        return $next($request);
    }
}
