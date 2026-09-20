<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserProfileController extends Controller
{
    /**
     * Get authenticated user profile.
     */
    public function getProfile(?Request $request = null): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 401);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'specialty' => $user->specialty,
                'specialty_license_number' => $user->specialty_license_number,
                'tenant_id' => $user->tenant_id,
                'created_at' => $user->created_at ? $user->created_at->toISOString() : null,
            ],
        ]);
    }

    /**
     * Update practitioner profile (Name, Email, Phone, Specialty).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 401);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => 'nullable|string|max:50',
            'specialty' => 'nullable|string|max:150',
            'specialty_license_number' => 'nullable|string|max:100',
        ]);

        $user->name = trim($validated['name']);
        $user->email = strtolower(trim($validated['email']));
        $user->phone = $validated['phone'] ?? null;
        if (array_key_exists('specialty', $validated)) {
            $user->specialty = $validated['specialty'];
        }
        if (array_key_exists('specialty_license_number', $validated)) {
            $user->specialty_license_number = $validated['specialty_license_number'];
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات الملف الشخصي بنجاح.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'specialty' => $user->specialty,
                'specialty_license_number' => $user->specialty_license_number,
                'tenant_id' => $user->tenant_id,
            ],
        ]);
    }

    /**
     * Update practitioner password securely.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 401);
        }

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['كلمة المرور الحالية غير صحيحة.'],
            ]);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تغيير كلمة المرور بنجاح وحماية الحساب.',
        ]);
    }
}
