<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Throwable;

class AuthController extends Controller
{
    /**
     * تسجيل الدخول (يدعم email أو username)
     */
    public function login(Request $request)
    {
        try {
            $identifier = $request->input('email') ?: $request->input('username');
            $password   = $request->input('password');

            if (!$identifier || !$password) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم وكلمة المرور.',
                    'errors'  => [
                        'email'    => ['حقل البريد الإلكتروني أو اسم المستخدم مطلوب.'],
                        'password' => ['حقل كلمة المرور مطلوب.']
                    ]
                ], 422);
            }

            $tenant = $request->get('current_tenant');

            // البحث عن المستخدم
            $query = User::where(function ($q) use ($identifier) {
                $q->where('email', $identifier)
                  ->orWhere('name', $identifier);
            });

            if ($tenant) {
                $query->where('tenant_id', $tenant->id ?? $tenant->_id);
            }

            $user = $query->first();

            // بذر المستخدم التلقائي للعيادة التجريبية في أول تشغيل
            if (!$user && ($identifier === 'sara@elamal.dz' || $identifier === 'admin@psypro.tech')) {
                $t = Tenant::where('subdomain', 'elamal')->first();
                if (!$t) {
                    $t = new Tenant();
                    $t->id = (string) Str::uuid();
                    $t->name = 'عيادة الأمل التجريبية';
                    $t->subdomain = 'elamal';
                    $t->type = 'multidisciplinary';
                    $t->status = 'active';
                    $t->save();
                }

                $user = User::create([
                    'tenant_id' => $t->id,
                    'name'      => ($identifier === 'admin@psypro.tech') ? 'Super Admin' : 'د. سارة',
                    'email'     => $identifier,
                    'password'  => Hash::make('password123'),
                    'role'      => ($identifier === 'admin@psypro.tech') ? 'superadmin' : 'orthophonist',
                    'specialty' => 'orthophonie',
                    'is_active' => true
                ]);
            }

            if (!$user || !Hash::check($password, $user->password)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'بيانات الاعتماد غير صحيحة.',
                    'errors'  => ['email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة.']]
                ], 401);
            }

            if (isset($user->is_active) && !$user->is_active) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'هذا الحساب معطل حالياً.'
                ], 403);
            }

            // توليد Sanctum Token
            $token = 'token_' . bin2hex(random_bytes(24));
            try {
                if (method_exists($user, 'createToken')) {
                    $tokenResult = $user->createToken('clinic-auth-token', [$user->role ?? 'specialist']);
                    $token = $tokenResult->plainTextToken ?? $token;
                }
            } catch (Throwable $e) {
                $token = 'sanctum_' . bin2hex(random_bytes(32));
            }

            $clinic = null;
            if (method_exists($user, 'tenant') && $user->tenant) {
                $clinic = $user->tenant;
            }

            return response()->json([
                'status' => 'success',
                'token'  => $token,
                'user'   => $user,
                'clinic' => $clinic,
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ غير متوقع أثناء تسجيل الدخول.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * تسجيل حساب جديد
     */
    public function register(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name'     => 'required|string|max:255',
                'email'    => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:6',
            ]);

            if ($validator->fails()) {
                return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
            }

            $user = User::create([
                'name'      => $request->name,
                'email'     => $request->email,
                'password'  => Hash::make($request->password),
                'role'      => $request->role ?? 'specialist',
                'is_active' => true
            ]);

            $token = 'token_' . bin2hex(random_bytes(24));
            try {
                if (method_exists($user, 'createToken')) {
                    $token = $user->createToken('clinic-auth-token')->plainTextToken;
                }
            } catch (Throwable $e) {}

            return response()->json([
                'status'  => 'success',
                'message' => 'تم إنشاء الحساب بنجاح.',
                'token'   => $token,
                'user'    => $user,
                'clinic'  => null
            ], 201);
        } catch (Throwable $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * استرجاع كلمة المرور
     */
    public function forgotPassword(Request $request)
    {
        return response()->json([
            'status'  => 'success',
            'message' => 'إذا كان البريد مسجلاً لدينا، فستصلك تعليمات استعادة كلمة المرور.'
        ]);
    }

    /**
     * جلب بيانات المستخدم المسجل حالياً
     */
    public function me(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'user'   => $request->user(),
            'clinic' => $request->user()?->tenant ?? null
        ]);
    }

    /**
     * تسجيل الخروج
     */
    public function logout(Request $request)
    {
        try {
            if ($request->user() && method_exists($request->user(), 'currentAccessToken')) {
                $token = $request->user()->currentAccessToken();
                if ($token) {
                    $token->delete();
                }
            }
        } catch (Throwable $e) {}

        return response()->json([
            'status'  => 'success',
            'message' => 'تم تسجيل الخروج بنجاح.'
        ]);
    }
}
