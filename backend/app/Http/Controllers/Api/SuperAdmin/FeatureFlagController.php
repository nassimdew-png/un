<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformFeatureFlag;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class FeatureFlagController extends Controller
{
    /**
     * Get Public Feature Flags map for frontend rendering.
     * GET /api/public/feature-flags
     */
    public function getPublicFlags(): JsonResponse
    {
        $flags = Cache::rememberForever('platform_all_feature_flags', function () {
            PlatformFeatureFlag::seedDefaults();
            return PlatformFeatureFlag::all()->pluck('is_enabled', 'feature_key');
        });

        return response()->json([
            'success' => true,
            'features' => $flags,
        ]);
    }

    /**
     * Get All Feature Flags with details for Super Admin.
     * GET /api/superadmin/feature-flags
     */
    public function getAdminFlags(): JsonResponse
    {
        PlatformFeatureFlag::seedDefaults();
        $flags = PlatformFeatureFlag::all();

        return response()->json([
            'success' => true,
            'flags' => $flags,
        ]);
    }

    /**
     * Toggle Feature Flag State.
     * POST /api/superadmin/feature-flags/toggle
     */
    public function toggleFlag(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'feature_key' => 'required|string',
            'is_enabled' => 'required|boolean',
            'maintenance_message' => 'nullable|string|max:255',
        ]);

        $user = Auth::user();
        $flag = PlatformFeatureFlag::setFeature(
            $validated['feature_key'],
            (bool)$validated['is_enabled'],
            $validated['maintenance_message'] ?? null,
            $user?->id
        );

        $actionWord = $flag->is_enabled ? 'تفعيل' : 'تعطيل';
        AuditLogger::log(
            'feature_flag.toggled',
            "قام المشرف العام ب{$actionWord} ميزة المنصة: ({$flag->feature_name}) [{$flag->feature_key}]",
            $flag->is_enabled ? 'info' : 'warning',
            'PlatformFeatureFlag',
            (string) $flag->id,
            [
                'feature_key' => $flag->feature_key,
                'feature_name' => $flag->feature_name,
                'is_enabled' => $flag->is_enabled,
                'maintenance_message' => $flag->maintenance_message,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "تم " . ($flag->is_enabled ? 'تفعيل' : 'تعطيل') . " ميزة ({$flag->feature_name}) بنجاح!",
            'flag' => $flag,
        ]);
    }
}
