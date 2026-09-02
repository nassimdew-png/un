<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ClinicAiQuota;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClinicQuotaManagerController extends Controller
{
    /**
     * Get All Clinics with their AI Quota Usage.
     * GET /api/superadmin/clinics/quotas
     */
    public function getQuotas(): JsonResponse
    {
        $tenants = Tenant::all();
        $quotas = ClinicAiQuota::all()->keyBy('clinic_id');

        $result = $tenants->map(function ($t) use ($quotas) {
            $q = $quotas->get($t->id) ?: ClinicAiQuota::getForClinic($t->id);
            return [
                'clinic_id' => $t->id,
                'clinic_name' => $t->name,
                'plan_name' => $q->plan_name,
                'monthly_reports_limit' => $q->monthly_reports_limit,
                'reports_used' => $q->reports_used,
                'monthly_transcribe_mins_limit' => $q->monthly_transcribe_mins_limit,
                'transcribe_mins_used' => $q->transcribe_mins_used,
                'monthly_images_limit' => $q->monthly_images_limit,
                'images_used' => $q->images_used,
                'monthly_podcasts_limit' => $q->monthly_podcasts_limit,
                'podcasts_used' => $q->podcasts_used,
                'monthly_videos_limit' => $q->monthly_videos_limit,
                'videos_used' => $q->videos_used,
                'monthly_documents_limit' => $q->monthly_documents_limit,
                'documents_used' => $q->documents_used,
                'resets_at' => $q->resets_at ? $q->resets_at->toIso8601String() : null,
            ];
        });

        return response()->json([
            'success' => true,
            'quotas' => $result,
        ]);
    }

    /**
     * Update or Reset Quotas for a specific clinic.
     * POST /api/superadmin/clinics/{id}/update-quota
     */
    public function updateQuota(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_name' => 'nullable|string|in:basic,pro,enterprise',
            'monthly_reports_limit' => 'nullable|integer|min:0',
            'monthly_transcribe_mins_limit' => 'nullable|integer|min:0',
            'monthly_images_limit' => 'nullable|integer|min:0',
            'monthly_podcasts_limit' => 'nullable|integer|min:0',
            'monthly_videos_limit' => 'nullable|integer|min:0',
            'monthly_documents_limit' => 'nullable|integer|min:0',
            'reset_usage' => 'nullable|boolean',
        ]);

        $quota = ClinicAiQuota::getForClinic($id);

        if (!empty($validated['reset_usage'])) {
            $quota->update([
                'reports_used' => 0,
                'transcribe_mins_used' => 0,
                'images_used' => 0,
                'podcasts_used' => 0,
                'videos_used' => 0,
                'documents_used' => 0,
            ]);
        }

        $quota->update(array_filter([
            'plan_name' => $validated['plan_name'] ?? $quota->plan_name,
            'monthly_reports_limit' => $validated['monthly_reports_limit'] ?? $quota->monthly_reports_limit,
            'monthly_transcribe_mins_limit' => $validated['monthly_transcribe_mins_limit'] ?? $quota->monthly_transcribe_mins_limit,
            'monthly_images_limit' => $validated['monthly_images_limit'] ?? $quota->monthly_images_limit,
            'monthly_podcasts_limit' => $validated['monthly_podcasts_limit'] ?? $quota->monthly_podcasts_limit,
            'monthly_videos_limit' => $validated['monthly_videos_limit'] ?? $quota->monthly_videos_limit,
            'monthly_documents_limit' => $validated['monthly_documents_limit'] ?? $quota->monthly_documents_limit,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حصص العيادة بنجاح!',
            'quota' => $quota,
        ]);
    }

    /**
     * Get Current Clinic's Quota and Usage Progress.
     * GET /api/clinic/my-quota
     */
    public function getMyQuota(): JsonResponse
    {
        $user = Auth::user();
        $clinicId = $user?->tenant_id ?: 1;
        $quota = ClinicAiQuota::getForClinic($clinicId);

        return response()->json([
            'success' => true,
            'quota' => [
                'plan_name' => $quota->plan_name,
                'reports' => [
                    'used' => $quota->reports_used,
                    'limit' => $quota->monthly_reports_limit,
                    'percentage' => $quota->monthly_reports_limit > 0 ? round(($quota->reports_used / $quota->monthly_reports_limit) * 100) : 0,
                ],
                'transcribe' => [
                    'used' => round($quota->transcribe_mins_used, 1),
                    'limit' => $quota->monthly_transcribe_mins_limit,
                    'percentage' => $quota->monthly_transcribe_mins_limit > 0 ? round(($quota->transcribe_mins_used / $quota->monthly_transcribe_mins_limit) * 100) : 0,
                ],
                'images' => [
                    'used' => $quota->images_used,
                    'limit' => $quota->monthly_images_limit,
                    'percentage' => $quota->monthly_images_limit > 0 ? round(($quota->images_used / $quota->monthly_images_limit) * 100) : 0,
                ],
                'podcasts' => [
                    'used' => $quota->podcasts_used,
                    'limit' => $quota->monthly_podcasts_limit,
                    'percentage' => $quota->monthly_podcasts_limit > 0 ? round(($quota->podcasts_used / $quota->monthly_podcasts_limit) * 100) : 0,
                ],
                'videos' => [
                    'used' => $quota->videos_used,
                    'limit' => $quota->monthly_videos_limit,
                    'percentage' => $quota->monthly_videos_limit > 0 ? round(($quota->videos_used / $quota->monthly_videos_limit) * 100) : 0,
                ],
                'documents' => [
                    'used' => $quota->documents_used,
                    'limit' => $quota->monthly_documents_limit,
                    'percentage' => $quota->monthly_documents_limit > 0 ? round(($quota->documents_used / $quota->monthly_documents_limit) * 100) : 0,
                ],
                'resets_at' => $quota->resets_at ? $quota->resets_at->toIso8601String() : null,
            ]
        ]);
    }
}
