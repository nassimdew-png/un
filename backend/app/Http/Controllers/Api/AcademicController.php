<?php

namespace App\Http\Controllers\Api;

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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AcademicController extends Controller
{
    /**
     * Algerian Partner Universities & Faculties reference.
     */
    public const UNIVERSITIES = [
        'جامعة الجزائر 2 - بوزريعة (كلية العلوم الاجتماعية والعلوم الإنسانية / أرطوفونيا وعلم النفس)',
        'جامعة وهران 2 - محمد بن أحمد (قسم علم النفس والأرطوفونيا)',
        'جامعة قسنطينة 2 - عبد الحميد مهري (كلية العلوم الإنسانية والاجتماعية)',
        'جامعة باجي مختار - عنابة (قسم الأرطوفونيا والعلوم المعرفية)',
        'جامعة سطيف 2 - محمد لمين دباغين (قسم علم النفس وعلوم التربية)',
        'جامعة باتنة 1 - الحاج لخضر (معهد علم النفس وعلوم التأهيل)',
        'جامعة تلمسان - أبو بكر بلقايد (كلية العلوم الإنسانية والاجتماعية)',
        'جامعة البليدة 2 - علي لونيسي (كلية العلوم الاجتماعية)',
        'جامعة تيزي وزو - مولود معمري (قسم الأرطوفونيا وعلم النفس)',
        'جامعة بجاية - عبد الرحمان ميرة (كلية العلوم الإنسانية)',
        'جامعة ورقلة - قاصدي مرباح (قسم العلوم الاجتماعية)',
        'جامعة مستغانم - عبد الحميد بن باديس',
        'جامعة سيدي بلعباس - جيلالي اليابس',
        'جامعة بسكرة - محمد خيضر (قسم العلوم الاجتماعية)',
        'جامعة المسيلة - محمد بوضياف',
        'معهد تكوين المساعدين الطبيين وإعادة التأهيل (INPFP)',
    ];

    /**
     * Get public student offer configuration for the special landing page.
     */
    public function getOfferConfig(): JsonResponse
    {
        $raw = SystemSetting::get('student_offer_config');
        $custom = $raw ? json_decode($raw, true) : null;

        $default = [
            'is_active' => true,
            'duration_months' => 9, // 9 Months Free
            'target_levels' => ['licence_l3', 'master_m2'],
            'target_specialties' => ['orthophonie', 'psychologie'],
            'auto_approve' => true,
            'max_quota' => 500,
            'marketing_title' => 'منحة التميز السريري: 9 أشهر مجاناً لطلبة علم النفس والأرطوفونيا',
            'marketing_subtitle' => 'عرض وطني حصري مخصص لطلبة السنة الثالثة ليسانس (L3) وسنة ثانية ماستر (M2) للتدريب الميداني وإنجاز مذكرات التخرج على بيئة سريرية احترافية 100%.',
            'marketing_badge' => '🎓 عرض ومنحة الطلبة 2026 - 9 أشهر مجاناً 🇩🇿',
            'offer_slug' => 'student-offer',
            'discount_percentage' => 70,
            'universities' => self::UNIVERSITIES,
        ];

        $config = is_array($custom) ? array_merge($default, $custom) : $default;

        $totalRegistered = AcademicVerification::count();
        $spotsRemaining = max(0, ($config['max_quota'] ?? 500) - $totalRegistered);

        return response()->json([
            'success' => true,
            'config' => $config,
            'universities' => self::UNIVERSITIES,
            'stats' => [
                'total_registered' => $totalRegistered,
                'spots_remaining' => $spotsRemaining,
                'duration_months' => (int) ($config['duration_months'] ?? 9),
                'is_open' => (bool) ($config['is_active'] ?? true) && $spotsRemaining > 0,
            ],
        ]);
    }

    /**
     * Submit student verification application and activate 9-month free academic workspace.
     */
    public function apply(Request $request): JsonResponse
    {
        // 1. Check if offer is active and quota available
        $rawConfig = SystemSetting::get('student_offer_config');
        $config = $rawConfig ? json_decode($rawConfig, true) : null;
        $isActive = $config['is_active'] ?? true;
        $maxQuota = (int) ($config['max_quota'] ?? 500);
        $durationMonths = (int) ($config['duration_months'] ?? 9);
        $autoApprove = $config['auto_approve'] ?? true;

        if (!$isActive) {
            return response()->json([
                'success' => false,
                'message' => 'عذراً، عرض ومنحة الطلبة مغلق مؤقتاً في الوقت الحالي.',
            ], 403);
        }

        $currentCount = AcademicVerification::count();
        if ($currentCount >= $maxQuota) {
            return response()->json([
                'success' => false,
                'message' => 'عذراً، تم الوصول إلى الحد الأقصى للمقاعد المتاحة لهذه الدفعة.',
            ], 422);
        }

        // 2. Validate Student Application
        $validated = $request->validate([
            'student_name' => 'required|string|max:120',
            'email' => 'required|email|max:120|unique:users,email',
            'phone' => 'required|string|max:30',
            'password' => 'nullable|string|min:6',
            'university_name' => 'required|string|max:200',
            'faculty' => 'nullable|string|max:200',
            'degree_level' => 'required|string|in:licence_l3,master_m2,master_m1,intern_resident',
            'specialty' => 'required|string|in:orthophonie,psychologie,neuro_psychiatrie,pluridisciplinaire',
            'student_card_doc' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'clinic_name' => 'nullable|string|max:150',
            'honor_pledge' => 'nullable',
        ]);

        // Upload Student Document (Card or Certificate)
        $studentDocPath = null;
        if ($request->hasFile('student_card_doc')) {
            $file = $request->file('student_card_doc');
            $filename = 'student_' . Str::random(16) . '.' . $file->getClientOriginalExtension();
            $studentDocPath = $file->storeAs('academic_cards', $filename, 'public');
        }

        $now = Carbon::now();
        $expiresAt = $now->copy()->addMonths($durationMonths);
        $discountCode = 'STUDENT70-' . strtoupper(Str::random(6));
        $specialty = $validated['specialty'];
        $userPassword = !empty($validated['password']) ? $validated['password'] : 'student123';

        // 3. If Auto-Approve is ON: Provision Tenant & User & Subscription immediately
        if ($autoApprove) {
            $subdomain = 'etud-' . Str::slug(Str::limit($validated['student_name'], 12, '')) . '-' . Str::lower(Str::random(4));
            $isPsy = in_array($specialty, ['psychologie', 'psychology']);
            $clinicType = $isPsy ? 'psychology' : 'orthophony';

            // Resolve valid SubscriptionPlan safely
            $plan = SubscriptionPlan::where('slug', 'multi_pro')->first() 
                ?? SubscriptionPlan::where('is_active', true)->first();

            $clinicName = !empty($validated['clinic_name'])
                ? $validated['clinic_name']
                : ("فضاء التدريب الأكاديمي - " . $validated['student_name']);

            $tenant = Tenant::create([
                'name' => $clinicName,
                'subdomain' => $subdomain,
                'type' => $clinicType,
                'status' => 'active',
                'phone' => $validated['phone'],
                'address' => "{$validated['university_name']}, Algérie",
                'wilaya' => 'الجزائر العاصمة',
                'trial_ends_at' => $expiresAt,
                'subscription_ends_at' => $expiresAt,
                'plan_id' => $plan?->id,
                'billing_cycle' => 'yearly',
                'public_bio' => "فضاء تدريبي معتمد لطلبة السنة التخرج والماستر - {$validated['university_name']}.",
            ]);

            $user = User::create([
                'tenant_id' => $tenant->id,
                'name' => $validated['student_name'],
                'email' => strtolower($validated['email']),
                'phone' => $validated['phone'],
                'password' => Hash::make($userPassword),
                'role' => 'admin_owner',
                'specialty' => $specialty,
                'is_active' => true,
            ]);

            ClinicSubscription::create([
                'clinic_id' => $tenant->id,
                'subscription_plan_id' => $plan?->id,
                'billing_cycle' => "student_{$durationMonths}months",
                'starts_at' => $now,
                'ends_at' => $expiresAt,
                'status' => 'active',
                'payment_reference' => "STUDENT_OFFER_{$durationMonths}_MONTHS",
                'notes' => "منحة الطلبة المجانية لمدة {$durationMonths} أشهر - طالب: {$validated['student_name']} ({$validated['university_name']})",
            ]);

            $verification = AcademicVerification::create([
                'user_id' => $user->id,
                'student_name' => $validated['student_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'university_name' => $validated['university_name'],
                'faculty' => $validated['faculty'] ?? '',
                'degree_level' => $validated['degree_level'],
                'specialty' => $specialty,
                'academic_year' => $validated['degree_level'],
                'clinic_name' => $clinicName,
                'student_card_doc_path' => $studentDocPath,
                'status' => 'verified',
                'discount_code' => $discountCode,
                'sandbox_tenant_id' => $tenant->id,
                'expires_at' => $expiresAt,
                'approved_at' => $now,
            ]);

            $token = $user->createToken('academic_auth')->plainTextToken;

            // Log Audit
            try {
                AuditLog::create([
                    'tenant_id' => $tenant->id,
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_role' => 'student',
                    'action' => 'STUDENT_OFFER_AUTO_ACTIVATED',
                    'description' => "تم تفعيل منحة الطالب تلقائياً لمدة {$durationMonths} أشهر ({$user->name} - {$validated['university_name']}).",
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            } catch (\Throwable $e) {
                Log::warning('Audit failed: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'is_auto_approved' => true,
                'message' => "تهانينا! تم التحقق وتفعيل حسابك الأكاديمي المجاني لمدة {$durationMonths} أشهر بنجاح! 🎓🎉",
                'duration_months' => $durationMonths,
                'expires_at' => $expiresAt->toDateString(),
                'discount_code' => $discountCode,
                'discount_percentage' => 70,
                'academic_token' => $token,
                'sandbox_url' => "https://{$subdomain}.psypro.tech",
                'subdomain' => $subdomain,
                'login_credentials' => [
                    'email' => $validated['email'],
                    'password' => $userPassword,
                ],
                'verification' => $verification,
            ], 201);
        }

        // 4. If Auto-Approve is OFF: Save application as pending review
        $verification = AcademicVerification::create([
            'student_name' => $validated['student_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'university_name' => $validated['university_name'],
            'faculty' => $validated['faculty'] ?? '',
            'degree_level' => $validated['degree_level'],
            'specialty' => $specialty,
            'academic_year' => $validated['degree_level'],
            'clinic_name' => $validated['clinic_name'] ?? '',
            'student_card_doc_path' => $studentDocPath,
            'status' => 'pending',
            'discount_code' => $discountCode,
            'expires_at' => $expiresAt,
            'admin_notes' => 'في انتظار مراجعة بطاقة الطالب من الإدارة.',
        ]);

        return response()->json([
            'success' => true,
            'is_auto_approved' => false,
            'message' => 'تم استلام طلبك بنجاح! جاري مراجعة بطاقة الطالب وسيتم إشعارك فور تفعيل الـ 9 أشهر المجانية.',
            'duration_months' => $durationMonths,
            'verification_id' => $verification->id,
        ], 201);
    }

    /**
     * Backward compatibility endpoint for tiers.
     */
    public function getAcademicTiers(): JsonResponse
    {
        return $this->getOfferConfig();
    }
}
