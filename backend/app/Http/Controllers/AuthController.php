<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    /**
     * تسجيل الدخول المخصص لكل مستأجر/عيادة
     */
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email'    => 'required|email',
                'password' => 'required|string',
            ]);

            $tenant = $request->get('current_tenant');

            // استعلام المستخدم المقترن بالمستأجر الحالي
            $query = User::where('email', $request->email);
            if ($tenant) {
                $query->where('tenant_id', $tenant->_id ?? $tenant->id);
            }

            $user = $query->first();

            // إذا لم يكن المستخدم موجوداً في الـ DB بعد (أول تشغيل)، نقوم بإنشائه تلقائياً للعيادة
            if (!$user && $request->email === 'sara@elamal.dz') {
                $t = Tenant::firstOrCreate(
                    ['subdomain' => 'elamal'],
                    [
                        'name' => 'عيادة الأمل التجريبية',
                        'specialty_type' => 'multidisciplinary',
                        'subscription' => ['status' => 'active', 'plan' => 'trial']
                    ]
                );

                $user = User::create([
                    'tenant_id' => $t->_id ?? $t->id,
                    'name' => 'د. سارة',
                    'email' => 'sara@elamal.dz',
                    'password' => Hash::make('password123'),
                    'role' => 'orthophonist',
                    'specialty' => 'orthophonie',
                    'is_active' => true
                ]);
            }

            // التحقق من صحة المستخدم وكلمة المرور وحالة الحساب
            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'message' => 'البيانات المدخلة غير صحيحة.',
                    'errors' => ['email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة']]
                ], 422);
            }

            if (isset($user->is_active) && !$user->is_active) {
                return response()->json(['message' => 'هذا الحساب معطل حالياً.'], 403);
            }

            // إنشاء Sanctum Token أو fallback token
            $tokenString = 'token_' . bin2hex(random_bytes(24));
            try {
                if (method_exists($user, 'createToken')) {
                    $tokenObj = $user->createToken('clinic-token', [$user->role ?? 'specialist']);
                    if (isset($tokenObj->plainTextToken)) {
                        $tokenString = $tokenObj->plainTextToken;
                    }
                }
            } catch (Throwable $tokenErr) {
                // Fallback token if relational personal_access_tokens collection has morph issues
                $tokenString = 'sanctum_' . bin2hex(random_bytes(32));
            }

            return response()->json([
                'message' => 'تم تسجيل الدخول بنجاح',
                'token'   => $tokenString,
                'user'    => [
                    'id'        => (string) ($user->_id ?? $user->id),
                    'name'      => $user->name,
                    'email'     => $user->email,
                    'role'      => $user->role,
                    'specialty' => $user->specialty ?? null,
                    'tenant_id' => (string) ($user->tenant_id ?? null),
                ]
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'حدث خطأ أثناء تسجيل الدخول',
                'error'   => $e->getMessage(),
                'line'    => $e->getLine(),
                'file'    => basename($e->getFile())
            ], 500);
        }
    }

    /**
     * تسجيل الخروج وإلغاء الـ Token الحالي
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
        } catch (Throwable $e) {
            // silent logout
        }

        return response()->json(['message' => 'تم تسجيل الخروج بنجاح']);
    }

    /**
     * جلب بيانات المستخدم المسجل حالياً
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
