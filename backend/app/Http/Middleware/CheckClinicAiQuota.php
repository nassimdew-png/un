<?php

namespace App\Http\Middleware;

use App\Models\ClinicAiQuota;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckClinicAiQuota
{
    /**
     * Handle an incoming request and enforce clinic AI quotas.
     */
    public function handle(Request $request, Closure $next, string $feature = 'reports'): Response
    {
        $user = Auth::user();
        if (!$user) {
            return $next($request);
        }

        // Super Admins bypass quotas for maintenance and testing
        if ($user->is_super_admin || $user->role === 'super_admin' || $user->email === 'admin@psypro.tech') {
            return $next($request);
        }

        try {
            $clinicId = $user->tenant_id ?: 1;
            $quota = ClinicAiQuota::getForClinic($clinicId);

            // Check if feature is within allowed limits
            if (!$quota->canUseFeature($feature)) {
                $featureLabels = [
                    'reports' => 'الحصائل والتقارير السريرية',
                    'transcribe' => 'دقائق التفريغ الصوتي',
                    'images' => 'البطاقات البصرية و PECS',
                    'podcasts' => 'حلقات البودكاست الإذاعية',
                    'videos' => 'مقاطع الفيديو والقصص المتحركة',
                    'documents' => 'معالجة المستندات والفواتير',
                ];
                $featureName = $featureLabels[$feature] ?? $feature;

                return response()->json([
                    'error' => 'quota_exceeded',
                    'feature' => $feature,
                    'feature_name' => $featureName,
                    'message' => "لقد استنفدت الحصة الشهرية المخصصة لـ ({$featureName}). يرجى ترقية باقة العيادة للمتابعة دون انقطاع.",
                    'quota' => [
                        'plan' => $quota->plan_name,
                        'resets_at' => $quota->resets_at ? $quota->resets_at->toIso8601String() : null,
                    ]
                ], 403);
            }

            // Execute downstream request
            $response = $next($request);

            // Increment usage if request was successful
            if ($response->isSuccessful()) {
                $quota->incrementUsage($feature);
            }

            return $response;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('CheckClinicAiQuota bypassed due to error: ' . $e->getMessage());
            return $next($request);
        }
    }
}
