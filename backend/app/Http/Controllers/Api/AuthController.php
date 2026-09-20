<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user and issue Sanctum token with tenant context & metadata.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'subdomain' => 'nullable|string',
        ]);


        // 1. Authenticate user credentials
        $user = User::withoutGlobalScopes()->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'تم تعطيل هذا الحساب. يرجى التواصل مع إدارة العيادة.',
            ], 403);
        }

        // 2. Identify the host context of the incoming request
        $host = strtolower($request->getHost());
        $hostSubdomain = $this->extractSubdomain($request);
        $isHostRootOrPortal = in_array($host, [
            'psypro.tech',
            'www.psypro.tech',
            'localhost',
            '127.0.0.1',
            'admin.psypro.tech',
            'app.psypro.tech',
            'api.psypro.tech',
        ]) || preg_match('/^\d+\.\d+\.\d+\.\d+$/', $host);

        // 3. Check if accessing via a dedicated clinic subdomain or custom domain
        $targetClinic = null;
        if (!$isHostRootOrPortal) {
            if ($hostSubdomain) {
                $targetClinic = Tenant::where('subdomain', $hostSubdomain)->first();
            }
            if (!$targetClinic) {
                $targetClinic = Tenant::where('custom_domain', $host)->first();
            }
            if (!$targetClinic) {
                $customRecord = \App\Models\ClinicCustomDomain::where('domain', $host)->first();
                if ($customRecord) {
                    $targetClinic = Tenant::find($customRecord->clinic_id);
                }
            }
        }

        // 4. If accessing via a dedicated clinic host/domain, enforce strict tenant isolation
        if ($targetClinic) {
            if ($user->role !== 'superadmin' && (string)$user->tenant_id !== (string)$targetClinic->id) {
                $userClinic = $user->tenant_id ? Tenant::find($user->tenant_id) : null;
                return response()->json([
                    'message' => 'هذا الحساب غير مسجل في هذه العيادة. يرجى الدخول من النطاق المخصص لعيادتك.',
                    'target_clinic' => $targetClinic->name,
                    'user_clinic_id' => $user->tenant_id,
                    'clinic_subdomain' => $userClinic?->subdomain,
                    'redirect_url' => $userClinic ? "https://{$userClinic->subdomain}.psypro.tech" : null,
                ], 403);
            }
        }

        $tenant = null;
        if ($user->role !== 'superadmin' && $user->tenant_id) {
            $tenant = Tenant::find($user->tenant_id);

            if (!$tenant) {
                return response()->json([
                    'message' => 'العيادة المرتبطة بهذا الحساب غير موجودة.',
                ], 404);
            }

            if (!in_array($tenant->status, ['active', 'trial'])) {
                if (!in_array($user->role, ['superadmin', 'clinic_admin', 'admin_owner'])) {
                    return response()->json([
                        'message' => 'اشتراك العيادة موقوف أو منتهي الصلاحية.',
                        'tenant_status' => $tenant->status,
                    ], 403);
                }
            }
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'access_token' => $token,
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'specialty_license_number' => $user->specialty_license_number,
                'is_active' => $user->is_active,
                'tenant_id' => $user->tenant_id,
            ],
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'custom_domain' => $tenant->custom_domain,
                'type' => $tenant->type,
                'status' => $tenant->status,
                'enabled_modules' => $tenant->enabled_modules,
                'is_orthophony' => $tenant->isOrthophony(),
                'is_psychology' => $tenant->isPsychology(),
                'settings' => $tenant->settings,
                'subscription_meta' => $tenant->subscription_meta,
            ] : null,
            'redirect_url' => $tenant ? "https://{$tenant->subdomain}.psypro.tech" : null,
        ]);
    }

    /**
     * Helper to extract subdomain from incoming request hostname.
     */
    protected function extractSubdomain(Request $request): ?string
    {
        $host = strtolower($request->getHost());
        if (
            in_array($host, ['psypro.tech', 'www.psypro.tech', 'localhost', '127.0.0.1', 'admin.psypro.tech', 'app.psypro.tech', 'api.psypro.tech']) ||
            preg_match('/^\d+\.\d+\.\d+\.\d+$/', $host)
        ) {
            return null;
        }

        if (str_ends_with($host, '.psypro.tech')) {
            $sub = str_replace('.psypro.tech', '', $host);
            if (!in_array($sub, ['www', 'admin', 'app', 'api'])) {
                return $sub;
            }
            return null;
        }

        return null;
    }

    /**
     * Revoke current Sanctum token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Return authenticated user profile and tenant metadata.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = $user->tenant_id ? Tenant::find($user->tenant_id) : null;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'specialty_license_number' => $user->specialty_license_number,
                'is_active' => $user->is_active,
                'tenant_id' => $user->tenant_id,
            ],
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'custom_domain' => $tenant->custom_domain,
                'type' => $tenant->type,
                'status' => $tenant->status,
                'enabled_modules' => $tenant->enabled_modules,
                'is_orthophony' => $tenant->isOrthophony(),
                'is_psychology' => $tenant->isPsychology(),
                'settings' => $tenant->settings,
                'subscription_meta' => $tenant->subscription_meta,
            ] : null,
        ]);
    }

    /**
     * Mark onboarding tour as completed for current user and tenant.
     */
    public function completeTour(Request $request): JsonResponse
    {
        $user = Auth::user();
        if ($user) {
            $user->update(['has_completed_tour' => true]);

            if ($user->tenant && in_array($user->role, ['admin_owner', 'admin', 'clinic_admin', 'owner'])) {
                $user->tenant->update([
                    'onboarding_tour_enabled' => false,
                    'onboarding_completed_at' => $user->tenant->onboarding_completed_at ?? Carbon::now(),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ إتمام الجولة التعريفية بنجاح.',
            'has_completed_tour' => true,
        ]);
    }
}

