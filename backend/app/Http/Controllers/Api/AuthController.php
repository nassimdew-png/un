<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $subdomain = $request->input('subdomain') 
            ?: $request->header('X-Tenant-Subdomain')
            ?: $this->extractSubdomain($request);

        $currentSubdomainClean = $subdomain ? strtolower(trim($subdomain)) : null;
        $isRootOrLocal = empty($currentSubdomainClean) 
            || in_array($currentSubdomainClean, ['psypro', 'psypro.tech', 'www', 'localhost', '127.0.0.1', 'admin', 'app']);

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

        // Strict Tenant Subdomain Isolation Check
        if (!$isRootOrLocal && $currentSubdomainClean) {
            $targetClinic = Tenant::where('subdomain', $currentSubdomainClean)
                ->orWhere('custom_domain', $request->getHost())
                ->first();

            if ($targetClinic) {
                // If user is not global superadmin and does not belong to this clinic
                if ($user->role !== 'superadmin' && (string)$user->tenant_id !== (string)$targetClinic->id) {
                    return response()->json([
                        'message' => 'هذا الحساب غير مسجل في هذه العيادة. يرجى الدخول من النطاق المخصص لعيادتك.',
                        'target_clinic' => $targetClinic->name,
                        'user_clinic_id' => $user->tenant_id,
                    ], 403);
                }
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
        ]);
    }

    /**
     * Helper to extract subdomain from incoming request hostname.
     */
    protected function extractSubdomain(Request $request): ?string
    {
        $host = $request->getHost();
        if ($host === 'psypro.tech' || $host === 'www.psypro.tech' || $host === 'localhost' || $host === '127.0.0.1') {
            return null;
        }

        if (str_ends_with($host, '.psypro.tech')) {
            return str_replace('.psypro.tech', '', $host);
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
}
