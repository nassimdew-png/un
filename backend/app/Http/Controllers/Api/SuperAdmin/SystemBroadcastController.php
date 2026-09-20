<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemAnnouncement;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SystemBroadcastController extends Controller
{
    protected function authorizeSuperAdmin(): ?User
    {
        $user = Auth::guard('sanctum')->user() ?: Auth::user() ?: request()->user();

        if (!$user) {
            $token = request()->bearerToken();
            if ($token) {
                $pat = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                if ($pat && $pat->tokenable) {
                    $user = $pat->tokenable;
                }
            }
        }

        if ($user) {
            $isSuper = (bool)$user->is_super_admin 
                || in_array($user->role, ['superadmin', 'super_admin', 'super_owner'])
                || in_array($user->admin_role ?? '', ['super_owner', 'support_agent'])
                || (method_exists($user, 'isSuperadmin') && $user->isSuperadmin());

            if (!$isSuper) {
                abort(403, 'غير مصرح لك بالوصول لمركز البث والإعلانات.');
            }
            return $user;
        }

        return null;
    }

    /**
     * List all announcements (Super Admin).
     * GET /api/super-admin/broadcasts
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $broadcasts = SystemAnnouncement::with('creator')
            ->orderBy('is_active', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $activeCount = SystemAnnouncement::active()->count();

        return response()->json([
            'success' => true,
            'broadcasts' => $broadcasts,
            'active_count' => $activeCount,
            'total_count' => $broadcasts->count(),
        ]);
    }

    /**
     * Store new broadcast announcement.
     * POST /api/super-admin/broadcasts
     */
    public function store(Request $request): JsonResponse
    {
        $user = $this->authorizeSuperAdmin();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'required|string|in:info,warning,emergency,feature,maintenance,success',
            'display_mode' => 'required|string|in:banner,modal,toast,maintenance',
            'target_specialty' => 'nullable|string|in:all,orthophony,psychology,psychomotricite',
            'target_tier' => 'nullable|string',
            'priority' => 'required|string|in:normal,high,urgent',
            'action_label' => 'nullable|string|max:100',
            'action_url' => 'nullable|string|max:500',
            'dismissible' => 'boolean',
            'is_active' => 'boolean',
            'starts_at' => 'nullable',
            'expires_at' => 'nullable',
        ]);

        $startsAt = null;
        if (!empty($validated['starts_at'])) {
            try {
                $startsAt = Carbon::parse($validated['starts_at']);
            } catch (\Throwable $e) {}
        }

        $expiresAt = null;
        if (!empty($validated['expires_at'])) {
            try {
                $expiresAt = Carbon::parse($validated['expires_at']);
            } catch (\Throwable $e) {}
        }

        $broadcast = SystemAnnouncement::create([
            'title' => $validated['title'],
            'message' => $validated['message'],
            'type' => $validated['type'],
            'display_mode' => $validated['display_mode'],
            'target_specialty' => $validated['target_specialty'] ?? 'all',
            'target_tier' => $validated['target_tier'] ?? 'all',
            'priority' => $validated['priority'],
            'action_label' => !empty($validated['action_label']) ? $validated['action_label'] : null,
            'action_url' => !empty($validated['action_url']) ? $validated['action_url'] : null,
            'dismissible' => $validated['dismissible'] ?? true,
            'is_active' => $validated['is_active'] ?? true,
            'starts_at' => $startsAt,
            'expires_at' => $expiresAt,
            'created_by' => $user?->id,
        ]);

        AuditLogger::log(
            'broadcast.created',
            "قام المشرف العام بإنشاء بث إعلاني جديد بعنوان: \"{$broadcast->title}\" (نوع: {$broadcast->type})",
            $broadcast->priority === 'urgent' ? 'critical' : 'info',
            'SystemAnnouncement',
            (string) $broadcast->id,
            [
                'type' => $broadcast->type,
                'display_mode' => $broadcast->display_mode,
                'target_specialty' => $broadcast->target_specialty,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'تم نشر الإعلان والبث العام بنجاح!',
            'broadcast' => $broadcast,
        ]);
    }

    /**
     * Update broadcast.
     * PUT /api/super-admin/broadcasts/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $broadcast = SystemAnnouncement::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'message' => 'sometimes|string',
            'type' => 'sometimes|string|in:info,warning,emergency,feature,maintenance,success',
            'display_mode' => 'sometimes|string|in:banner,modal,toast,maintenance',
            'target_specialty' => 'nullable|string|in:all,orthophony,psychology,psychomotricite',
            'target_tier' => 'nullable|string',
            'priority' => 'sometimes|string|in:normal,high,urgent',
            'action_label' => 'nullable|string|max:100',
            'action_url' => 'nullable|string|max:500',
            'dismissible' => 'boolean',
            'is_active' => 'boolean',
            'starts_at' => 'nullable',
            'expires_at' => 'nullable',
        ]);

        if (array_key_exists('starts_at', $validated)) {
            $validated['starts_at'] = !empty($validated['starts_at']) ? Carbon::parse($validated['starts_at']) : null;
        }
        if (array_key_exists('expires_at', $validated)) {
            $validated['expires_at'] = !empty($validated['expires_at']) ? Carbon::parse($validated['expires_at']) : null;
        }

        $broadcast->update($validated);

        AuditLogger::log(
            'broadcast.updated',
            "تم تحديث بيانات البث الإعلاني رقم #{$broadcast->id}: \"{$broadcast->title}\"",
            'info',
            'SystemAnnouncement',
            (string) $broadcast->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ تعديلات الإعلان بنجاح.',
            'broadcast' => $broadcast,
        ]);
    }

    /**
     * Toggle status.
     * POST /api/super-admin/broadcasts/{id}/toggle-status
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $broadcast = SystemAnnouncement::findOrFail($id);
        $broadcast->is_active = !$broadcast->is_active;
        $broadcast->save();

        AuditLogger::log(
            'broadcast.status_toggled',
            "تم " . ($broadcast->is_active ? 'تفعيل 🟢' : 'تعطيل 🔴') . " البث الإعلاني: \"{$broadcast->title}\"",
            'info',
            'SystemAnnouncement',
            (string) $broadcast->id,
            ['is_active' => $broadcast->is_active]
        );

        return response()->json([
            'success' => true,
            'message' => "تم " . ($broadcast->is_active ? 'تفعيل' : 'إيقاف') . " الإعلان بنجاح.",
            'is_active' => $broadcast->is_active,
        ]);
    }

    /**
     * Delete broadcast.
     * DELETE /api/super-admin/broadcasts/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $broadcast = SystemAnnouncement::findOrFail($id);
        $title = $broadcast->title;
        $broadcast->delete();

        AuditLogger::log(
            'broadcast.deleted',
            "قام المشرف العام بحذف البث الإعلاني: \"{$title}\"",
            'warning',
            'SystemAnnouncement',
            (string) $id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الإعلان بنجاح.',
        ]);
    }

    /**
     * Get active broadcasts for the authenticated clinic tenant.
     * GET /api/tenant/broadcasts/active
     */
    public function getActiveBroadcastsForClinic(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenant = $user ? $user->tenant : null;

        $broadcasts = SystemAnnouncement::active()
            ->forTenant($tenant)
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'normal')")
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'broadcasts' => $broadcasts,
        ]);
    }
}
