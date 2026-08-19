<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Tenant;
use Throwable;

class TenantResolver
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $host = $request->getHost();
            $parts = explode('.', $host);
            $subdomain = $parts[0] ?? 'elamal';

            // إذا كان الدخول عبر الـ IP مباشرة أو nip.io أو localhost أو api
            if (is_numeric($subdomain) || in_array($subdomain, ['api', 'localhost', '127', 'frontend', 'backend'])) {
                // محاولة جلب النطاق الفرعي من الـ Headers أو Request إن وُجد
                $headerSub = $request->header('X-Tenant-Subdomain') ?? $request->get('subdomain');
                if ($headerSub) {
                    $subdomain = $headerSub;
                } else {
                    $subdomain = 'elamal'; // العيادة الافتراضية
                }
            }

            // البحث عن العيادة
            $tenant = Tenant::where('subdomain', $subdomain)->first();

            if (!$tenant) {
                // إنشاء العيادة التجريبية تلقائياً إن لم تكن موجودة
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
            // الاستمرار في حالة فشل الاتصال الأولي بقاعدة البيانات
        }

        return $next($request);
    }
}
