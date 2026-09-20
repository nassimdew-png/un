<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsActive
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $isSuperAdmin = $user && ($user->is_super_admin || ($user->role ?? '') === 'superadmin' || ($user->role ?? '') === 'super_admin');

        // 1. Check Global Platform Emergency Maintenance Mode (Kill-Switch)
        if (!$isSuperAdmin) {
            $isMaintenance = Cache::remember('platform_global_maintenance_mode', 30, function () {
                return SystemSetting::get('global_maintenance_mode', '0') === '1';
            });

            if ($isMaintenance) {
                $bypassToken = $request->header('X-Maintenance-Bypass');
                $validBypass = Cache::remember('platform_maintenance_bypass_token', 30, function () {
                    return SystemSetting::get('maintenance_bypass_token', '');
                });

                if (empty($validBypass) || $bypassToken !== $validBypass) {
                    $maintMsg = Cache::remember('platform_maintenance_message', 30, function () {
                        return SystemSetting::get('maintenance_message', 'المنصة قيد الصيانة التحديثية المجدولة حالياً لتعزيز استقرار النظام... سنعود قريباً.');
                    });

                    return response()->json([
                        'message' => $maintMsg,
                        'is_maintenance' => true,
                        'platform_status' => 'maintenance',
                    ], 503);
                }
            }
        }

        // 2. Check Tenant Status & Sovereign Quarantine
        if ($user && !$isSuperAdmin && $user->tenant_id) {
            $tenant = $user->tenant;

            if (!$tenant) {
                return response()->json([
                    'message' => 'لم يتم العثور على حساب العيادة المرتبط بهذا المستخدم.',
                    'tenant_status' => 'unknown',
                ], 403);
            }

            // Check Sovereign Quarantine Lockdown
            if ($tenant->is_quarantined) {
                return response()->json([
                    'message' => 'تم تعليق حساب العيادة مؤقتاً بأمر أمني أو إداري من الإدارة العامة للمنصة.',
                    'quarantine_reason' => $tenant->quarantine_reason ?: 'مراجعة أمنية أو تدقيق إداري واشتراكات.',
                    'is_quarantined' => true,
                    'support_email' => 'support@psypro.tech',
                    'support_phone' => '+213 555 000 111',
                ], 423); // 423 Locked
            }

            // Check Normal Subscription Status
            if (!in_array($tenant->status, ['active', 'trial'])) {
                return response()->json([
                    'message' => 'حساب العيادة غير نشط أو معلق. يرجى تجديد الاشتراك أو التواصل مع الدعم الفني.',
                    'tenant_status' => $tenant->status,
                ], 403);
            }

            // Update last activity timestamp quietly (throttled to avoid heavy write load)
            if (!$tenant->last_activity_at || $tenant->last_activity_at->diffInMinutes(now()) >= 30) {
                try {
                    $tenant->timestamps = false;
                    $tenant->update(['last_activity_at' => now()]);
                    $tenant->timestamps = true;
                } catch (\Throwable $e) {
                    // Non-blocking
                }
            }
        }

        return $next($request);
    }
}
