<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Api\AcademicController;
use App\Http\Controllers\Controller;
use App\Models\AcademicVerification;
use App\Models\AuditLog;
use App\Models\ClinicSubscription;
use App\Models\SubscriptionPlan;
use App\Models\SystemSetting;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class StudentOfferController extends Controller
{
    const SETTING_KEY = 'student_offer_config';
    const SETTING_GROUP = 'student_offer';

    /**
     * Default Student Offer Configuration.
     */
    public static function getDefaultConfig(): array
    {
        return [
            'is_active' => true,
            'duration_months' => 9, // 9 Months Free as specifically requested
            'target_levels' => ['licence_l3', 'master_m2'],
            'target_specialties' => ['orthophonie', 'psychologie'],
            'auto_approve' => true, // Auto-activate or require SuperAdmin manual review
            'max_quota' => 500,
            'marketing_title' => 'منحة التميز السريري: 9 أشهر مجاناً لطلبة علم النفس والأرطوفونيا',
            'marketing_subtitle' => 'عرض وطني حصري مخصص لطلبة السنة الثالثة ليسانس (L3) وسنة ثانية ماستر (M2) للتدريب الميداني وإنجاز مذكرات التخرج على بيئة سريرية احترافية 100%.',
            'marketing_badge' => '🎓 عرض ومنحة الطلبة 2026 - 9 أشهر مجاناً 🇩🇿',
            'offer_slug' => 'student-offer',
            'discount_code_prefix' => 'STUDENT70-',
            'discount_percentage' => 70,
            'universities' => AcademicController::UNIVERSITIES,
        ];
    }

    /**
     * Get active Student Offer configuration and summary stats.
     */
    public function getConfig(): JsonResponse
    {
        $raw = SystemSetting::get(self::SETTING_KEY);
        $custom = $raw ? json_decode($raw, true) : null;
        $default = self::getDefaultConfig();

        $config = is_array($custom) ? array_merge($default, $custom) : $default;

        // Compute Live Application Stats
        $stats = [
            'total_applications' => AcademicVerification::count(),
            'active_students' => AcademicVerification::where('status', 'verified')->count(),
            'pending_verifications' => AcademicVerification::where('status', 'pending')->count(),
            'rejected_applications' => AcademicVerification::where('status', 'rejected')->count(),
            'total_universities' => AcademicVerification::distinct('university_name')->count('university_name'),
            'orthophonie_count' => AcademicVerification::where('specialty', 'orthophonie')->count(),
            'psychologie_count' => AcademicVerification::where('specialty', 'psychologie')->count(),
            'licence_l3_count' => AcademicVerification::where('degree_level', 'licence_l3')->count(),
            'master_m2_count' => AcademicVerification::where('degree_level', 'master_m2')->count(),
        ];

        return response()->json([
            'success' => true,
            'config' => $config,
            'default_config' => $default,
            'stats' => $stats,
        ]);
    }

    /**
     * Update Student Offer settings.
     */
    public function updateConfig(Request $request): JsonResponse
    {
        $rawConfig = $request->has('config') && is_array($request->input('config'))
            ? $request->input('config')
            : $request->all();

        $default = self::getDefaultConfig();
        $merged = array_merge($default, $rawConfig);

        SystemSetting::set(self::SETTING_KEY, json_encode($merged, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), self::SETTING_GROUP);

        // Audit Log
        try {
            AuditLog::create([
                'tenant_id' => Auth::user()?->tenant_id,
                'user_id' => Auth::id(),
                'user_name' => Auth::user()?->name ?? 'SuperAdmin',
                'user_role' => 'superadmin',
                'action' => 'STUDENT_OFFER_CONFIG_UPDATED',
                'description' => 'تم تحديث وضبط إعدادات عرض ومنحة الطلبة (9 أشهر مجاناً).',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'details' => [
                    'is_active' => $merged['is_active'] ?? true,
                    'duration_months' => $merged['duration_months'] ?? 9,
                    'auto_approve' => $merged['auto_approve'] ?? true,
                    'max_quota' => $merged['max_quota'] ?? 500,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to log audit for student offer update: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث وحفظ إعدادات عرض ومنحة الطلبة بنجاح! 🎓✨',
            'config' => $merged,
        ]);
    }

    /**
     * Get list of student applications with search and filters.
     */
    public function getApplications(Request $request): JsonResponse
    {
        $query = AcademicVerification::with(['user', 'sandboxTenant', 'approver'])
            ->orderBy('created_at', 'desc');

        // Search Filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('student_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('university_name', 'like', "%{$search}%")
                  ->orWhere('discount_code', 'like', "%{$search}%");
            });
        }

        // Status Filter
        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        // Specialty Filter
        if ($specialty = $request->input('specialty')) {
            if ($specialty !== 'all') {
                $query->where('specialty', $specialty);
            }
        }

        // Degree Level Filter
        if ($degree = $request->input('degree_level')) {
            if ($degree !== 'all') {
                $query->where('degree_level', $degree);
            }
        }

        $perPage = max(5, min(100, (int) $request->input('per_page', 20)));
        $paginated = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'applications' => $paginated->items(),
            'total' => $paginated->total(),
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
        ]);
    }

    /**
     * Approve and activate a student's 9-month free academic workspace.
     */
    public function approveApplication(Request $request, $id): JsonResponse
    {
        $verification = AcademicVerification::findOrFail($id);

        $rawConfig = SystemSetting::get(self::SETTING_KEY);
        $config = $rawConfig ? json_decode($rawConfig, true) : self::getDefaultConfig();
        $durationMonths = (int) ($config['duration_months'] ?? 9);

        $now = Carbon::now();
        $expiresAt = $now->copy()->addMonths($durationMonths);

        // If no sandbox tenant exists yet, provision one now
        if (!$verification->sandbox_tenant_id) {
            $subdomain = 'etud-' . Str::slug(Str::limit($verification->student_name, 12, '')) . '-' . Str::lower(Str::random(4));
            $isPsy = in_array($verification->specialty, ['psychologie', 'psychology']);
            $clinicType = $isPsy ? 'psychology' : 'orthophony';

            // Resolve valid subscription plan
            $plan = SubscriptionPlan::where('slug', 'multi_pro')->first() 
                ?? SubscriptionPlan::where('is_active', true)->first();

            $clinicName = $verification->clinic_name 
                ?: ("فضاء التدريب الأكاديمي - " . $verification->student_name);

            $tenant = Tenant::create([
                'name' => $clinicName,
                'subdomain' => $subdomain,
                'type' => $clinicType,
                'status' => 'active',
                'phone' => $verification->phone,
                'address' => "{$verification->university_name}, Algérie",
                'wilaya' => 'الجزائر العاصمة',
                'trial_ends_at' => $expiresAt,
                'subscription_ends_at' => $expiresAt,
                'plan_id' => $plan?->id,
                'billing_cycle' => 'yearly',
                'public_bio' => "فضاء تدريبي معتمد لطلبة السنة التخرج والماستر - {$verification->university_name}.",
            ]);

            // If user already exists or create new
            $user = User::where('email', $verification->email)->first();
            if (!$user) {
                $user = User::create([
                    'tenant_id' => $tenant->id,
                    'name' => $verification->student_name,
                    'email' => strtolower($verification->email),
                    'phone' => $verification->phone,
                    'password' => Hash::make('student123'),
                    'role' => 'admin_owner',
                    'specialty' => $verification->specialty ?? 'orthophonie',
                    'is_active' => true,
                ]);
            } else {
                $user->update(['tenant_id' => $tenant->id, 'is_active' => true]);
            }

            ClinicSubscription::create([
                'clinic_id' => $tenant->id,
                'subscription_plan_id' => $plan?->id,
                'billing_cycle' => "student_{$durationMonths}months",
                'starts_at' => $now,
                'ends_at' => $expiresAt,
                'status' => 'active',
                'payment_reference' => "STUDENT_OFFER_{$durationMonths}_MONTHS",
                'notes' => "منحة الطلبة المجانية لمدة {$durationMonths} أشهر - معتمدة من السوبر أدمن",
            ]);

            $verification->sandbox_tenant_id = $tenant->id;
            $verification->user_id = $user->id;
        } else {
            // Extend existing tenant
            $tenant = Tenant::find($verification->sandbox_tenant_id);
            if ($tenant) {
                $tenant->update([
                    'status' => 'active',
                    'subscription_ends_at' => $expiresAt,
                    'trial_ends_at' => $expiresAt,
                ]);
            }
        }

        $verification->update([
            'status' => 'verified',
            'expires_at' => $expiresAt,
            'approved_at' => $now,
            'approved_by' => Auth::id(),
            'admin_notes' => $request->input('notes', 'تمت مراجعة الوثائق وتفعيل العرض بنجاح.'),
        ]);

        // Forensic Audit Log
        try {
            AuditLog::create([
                'tenant_id' => Auth::user()?->tenant_id,
                'user_id' => Auth::id(),
                'user_name' => Auth::user()?->name ?? 'SuperAdmin',
                'user_role' => 'superadmin',
                'action' => 'STUDENT_OFFER_APPROVED',
                'description' => "تم قبول وتفعيل منحة الطالب ({$verification->student_name}) لمدة {$durationMonths} أشهر.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'details' => [
                    'student_id' => $verification->id,
                    'student_name' => $verification->student_name,
                    'university' => $verification->university_name,
                    'specialty' => $verification->specialty,
                    'degree_level' => $verification->degree_level,
                    'expires_at' => $expiresAt->toDateString(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed audit log: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => "تم تفعيل حساب الطالب بنجاح لمدة {$durationMonths} أشهر مجاناً! 🎓🎉",
            'application' => $verification->fresh(['user', 'sandboxTenant']),
        ]);
    }

    /**
     * Reject a student application.
     */
    public function rejectApplication(Request $request, $id): JsonResponse
    {
        $verification = AcademicVerification::findOrFail($id);
        $reason = $request->input('reason', 'البيانات الأكاديمية المدخلة غير مطابقة لشروط منحة طلبة علم النفس والأرطوفونيا (L3/M2).');

        $verification->update([
            'status' => 'rejected',
            'admin_notes' => $reason,
        ]);

        // If a tenant was created, suspend it
        if ($verification->sandbox_tenant_id) {
            Tenant::where('id', $verification->sandbox_tenant_id)->update(['status' => 'suspended']);
        }

        // Audit Log
        try {
            AuditLog::create([
                'tenant_id' => Auth::user()?->tenant_id,
                'user_id' => Auth::id(),
                'user_name' => Auth::user()?->name ?? 'SuperAdmin',
                'user_role' => 'superadmin',
                'action' => 'STUDENT_OFFER_REJECTED',
                'description' => "تم رفض طلب منحة الطالب ({$verification->student_name}): {$reason}",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'details' => [
                    'student_id' => $verification->id,
                    'student_name' => $verification->student_name,
                    'reason' => $reason,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed audit log: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'تم رفض الطلب وتحديث الحالة بنجاح.',
            'application' => $verification->fresh(),
        ]);
    }

    /**
     * Extend a student's active subscription by extra months.
     */
    public function extendApplication(Request $request, $id): JsonResponse
    {
        $verification = AcademicVerification::findOrFail($id);
        $months = max(1, min(12, (int) $request->input('months', 3)));

        $currentExpiry = $verification->expires_at 
            ? Carbon::parse($verification->expires_at) 
            : Carbon::now();
        
        $newExpiry = $currentExpiry->isPast() 
            ? Carbon::now()->addMonths($months) 
            : $currentExpiry->copy()->addMonths($months);

        $verification->update([
            'expires_at' => $newExpiry,
            'status' => 'verified',
        ]);

        if ($verification->sandbox_tenant_id) {
            Tenant::where('id', $verification->sandbox_tenant_id)->update([
                'status' => 'active',
                'subscription_ends_at' => $newExpiry,
                'trial_ends_at' => $newExpiry,
            ]);
        }

        // Audit Log
        try {
            AuditLog::create([
                'tenant_id' => Auth::user()?->tenant_id,
                'user_id' => Auth::id(),
                'user_name' => Auth::user()?->name ?? 'SuperAdmin',
                'user_role' => 'superadmin',
                'action' => 'STUDENT_OFFER_EXTENDED',
                'description' => "تم تمديد منحة الطالب ({$verification->student_name}) بمقدار {$months} أشهر إضافية حتى {$newExpiry->toDateString()}.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed audit log: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => "تم تمديد اشتراك الطالب بمقدار {$months} أشهر إضافية بنجاح! ⏳✨",
            'application' => $verification->fresh(['sandboxTenant']),
        ]);
    }

    /**
     * Delete a student application.
     */
    public function deleteApplication(Request $request, $id): JsonResponse
    {
        $verification = AcademicVerification::findOrFail($id);
        $name = $verification->student_name;

        // If cleanup tenant requested
        if ($request->boolean('delete_tenant') && $verification->sandbox_tenant_id) {
            User::where('tenant_id', $verification->sandbox_tenant_id)->delete();
            Tenant::where('id', $verification->sandbox_tenant_id)->delete();
        }

        $verification->delete();

        return response()->json([
            'success' => true,
            'message' => "تم حذف سجل الطالب ({$name}) بنجاح.",
        ]);
    }

    /**
     * SuperAdmin direct login into student workspace.
     */
    public function impersonateStudent(Request $request, $id): JsonResponse
    {
        $verification = AcademicVerification::findOrFail($id);
        $user = $verification->user;
        $tenant = $verification->sandboxTenant;

        if (!$user || !$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'لا يوجد حساب مستخدم أو فضاء سريري مفعل لهذا الطالب بعد.',
            ], 404);
        }

        $token = $user->createToken('superadmin_student_impersonate')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $user,
            'tenant' => $tenant,
            'message' => "تم إنشاء جلسة الدخول لحساب الطالب: {$verification->student_name}",
        ]);
    }
}
