<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * تسجيل الدخول المخصص لكل مستأجر/عيادة
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $tenant = $request->get('current_tenant');

        // استعلام المستخدم المقترن بالمستأجر الحالي
        $query = User::where('email', $request->email);
        if ($tenant) {
            $query->where('tenant_id', $tenant->_id);
        }

        $user = $query->first();

        // التحقق من صحة المستخدم وكلمة المرور وحالة الحساب
        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['البيانات المدخلة غير صحيحة.'],
            ]);
        }

        if (isset($user->is_active) && !$user->is_active) {
            return response()->json(['message' => 'هذا الحساب معطل حالياً.'], 403);
        }

        // إنشاء Token بصلاحيات الدور الخاص بالمستخدم
        $token = $user->createToken('clinic-token', [$user->role])->plainTextToken;

        return response()->json([
            'message' => 'تم تسجيل الدخول بنجاح',
            'token'   => $token,
            'user'    => [
                'id'        => $user->_id,
                'name'      => $user->name,
                'email'     => $user->email,
                'role'      => $user->role,
                'specialty' => $user->specialty ?? null,
                'tenant_id' => $user->tenant_id ?? null,
            ]
        ]);
    }

    /**
     * تسجيل الخروج وإلغاء الـ Token الحالي
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

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
