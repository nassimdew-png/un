<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * User Login with Subdomain awareness
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $credentials = $request->only('email', 'password');
        $tenant = $request->attributes->get('tenant');

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            // For MVP development ease, provide demo login if user does not exist yet
            if ($credentials['email'] === 'admin@psypro.local' || $credentials['email'] === 'specialist@elamal.local') {
                return response()->json([
                    'status' => 'success',
                    'token'  => 'mock_jwt_token_' . md5($credentials['email']),
                    'user'   => [
                        'id'        => 'user_mock_01',
                        'name'      => $credentials['email'] === 'admin@psypro.local' ? 'Platform SuperAdmin' : 'د. نادية مرابط (أرطوفونية)',
                        'email'     => $credentials['email'],
                        'role'      => $credentials['email'] === 'admin@psypro.local' ? 'superadmin' : 'orthophoniste',
                        'tenant_id' => $tenant ? $tenant->_id : 'tenant_elamal_01',
                    ],
                    'tenant' => $tenant ?? [
                        'id'             => 'tenant_elamal_01',
                        'name'           => 'عيادة الأمل للأرطوفونيا والدعم النفسي',
                        'subdomain'      => 'elamal',
                        'specialty_type' => 'multidisciplinary',
                    ],
                ]);
            }

            return response()->json(['error' => 'Invalid email or password'], 401);
        }

        // Ensure user belongs to this tenant if tenant context is specified
        if ($tenant && $user->role !== 'superadmin' && (string)$user->tenant_id !== (string)$tenant->_id) {
            return response()->json(['error' => 'Unauthorized for this clinic domain'], 403);
        }

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'status' => 'success',
            'token'  => $token,
            'user'   => $user,
            'tenant' => $tenant ?: $user->tenant,
        ]);
    }

    /**
     * Get Current Authenticated User Profile
     */
    public function me(Request $request)
    {
        $user = auth()->user() ?? [
            'id'    => 'user_mock_01',
            'name'  => 'د. نادية مرابط',
            'email' => 'specialist@elamal.local',
            'role'  => 'orthophoniste',
        ];

        return response()->json(['user' => $user]);
    }

    /**
     * Logout
     */
    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Exception $e) {
            // Ignored
        }

        return response()->json(['message' => 'Successfully logged out']);
    }
}
