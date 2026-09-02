<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicVerification;
use App\Models\ClinicSubscription;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
        'جامعة باجي مختار - عنابة',
        'جامعة سطيف 2 - محمد لمين دباغين',
        'جامعة باتنة 1 - الحاج لخضر',
        'جامعة تلمسان - أبو بكر بلقايد',
        'جامعة البليدة 2 - علي لونيسي',
        'جامعة تيزي وزو - مولود معمري',
        'جامعة بجاية - عبد الرحمان ميرة',
        'جامعة ورقلة - قاصدي مرباح',
        'جامعة مستغانم - عبد الحميد بن باديس',
        'جامعة سيدي بلعباس - جيلالي اليابس',
        'معهد تكوين المساعدين الطبيين وإعادة التأهيل',
    ];

    /**
     * Submit student verification application and activate instant 6-month free academic tier.
     */
    public function apply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_name' => 'required|string|max:120',
            'email' => 'required|email|max:120',
            'phone' => 'required|string|max:30',
            'university_name' => 'required|string|max:200',
            'faculty' => 'required|string|max:200',
            'degree_level' => 'required|string|in:licence_l3,master_m1,master_m2,intern_resident',
            'student_card_doc' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'specialty' => 'nullable|string|in:orthophonie,psychologie,neuro_psychiatrie,pluridisciplinaire',
        ]);

        $studentDocPath = null;
        if ($request->hasFile('student_card_doc')) {
            $file = $request->file('student_card_doc');
            $filename = 'student_' . Str::random(16) . '.' . $file->getClientOriginalExtension();
            $studentDocPath = $file->storeAs('academic_cards', $filename, 'public');
        }

        // Generate unique Student 70% Discount Promo Code
        $discountCode = 'STUDENT70-' . strtoupper(Str::random(6));
        $now = Carbon::now();
        $expiresAt = $now->copy()->addMonths(6);

        // Auto-provision 6-Month Free Academic Sandbox Clinic
        $subdomain = 'acad-' . Str::slug(Str::limit($validated['student_name'], 15, '')) . '-' . Str::lower(Str::random(4));
        $specialty = $validated['specialty'] ?? 'orthophonie';

        // Retrieve valid Plan ID from plans table
        $dbPlan = DB::table('plans')->first();
        $planId = $dbPlan ? $dbPlan->id : null;

        $tenant = Tenant::create([
            'name' => "فضاء التدريب الأكاديمي - {$validated['student_name']}",
            'subdomain' => $subdomain,
            'type' => in_array($specialty, ['psychologie', 'psychology']) ? 'psychology' : 'orthophony',
            'status' => 'active',
            'phone' => $validated['phone'],
            'address' => "{$validated['university_name']}, Algérie",
            'wilaya' => 'الجزائر العاصمة',
            'trial_ends_at' => $expiresAt,
            'subscription_ends_at' => $expiresAt,
            'plan_id' => $planId,
            'billing_cycle' => 'yearly',
            'public_bio' => "فضاء تدريبي معتمد لطلبة السنة التخرج والماستر والتربص الميداني - {$validated['university_name']}.",
        ]);

        // Create Student User
        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => $validated['student_name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'],
            'password' => Hash::make('student123'),
            'role' => 'admin_owner',
            'specialty' => $specialty,
            'is_active' => true,
        ]);

        // Attach Subscription
        $plan = SubscriptionPlan::where('slug', 'multi_pro')->first() ?? SubscriptionPlan::first();
        ClinicSubscription::create([
            'clinic_id' => $tenant->id,
            'subscription_plan_id' => $plan ? $plan->id : null,
            'billing_cycle' => 'academic_tier',
            'starts_at' => $now,
            'ends_at' => $expiresAt,
            'status' => 'active',
            'payment_reference' => 'ACADEMIC_FREE_6_MONTHS',
            'notes' => "حساب أكاديمي مجاني لمدة 6 أشهر - طالب: {$validated['student_name']} ({$validated['university_name']})",
        ]);

        // Save Verification Record
        $verification = AcademicVerification::create([
            'user_id' => $user->id,
            'student_name' => $validated['student_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'university_name' => $validated['university_name'],
            'faculty' => $validated['faculty'],
            'degree_level' => $validated['degree_level'],
            'student_card_doc_path' => $studentDocPath,
            'status' => 'verified',
            'discount_code' => $discountCode,
            'sandbox_tenant_id' => $tenant->id,
            'expires_at' => $expiresAt,
        ]);

        $token = $user->createToken('academic_auth')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'تهانينا! تم التحقق وتفعيل حساب التدريب الأكاديمي المجاني لمدة 6 أشهر بنجاح.',
            'discount_code' => $discountCode,
            'discount_percentage' => 70,
            'academic_token' => $token,
            'sandbox_url' => "https://{$subdomain}.psypro.tech",
            'login_credentials' => [
                'email' => $validated['email'],
                'temporary_password' => 'student123',
            ],
            'verification' => $verification,
        ], 201);
    }

    /**
     * Get universities list and academic tiers info.
     */
    public function getAcademicTiers(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'universities' => self::UNIVERSITIES,
            'tiers' => [
                [
                    'name' => 'عرض الطلبة والمتربصين (Free Student Tier)',
                    'price' => 'مجاناً 100% (0 دج)',
                    'duration' => '6 أشهر كاملة',
                    'features' => [
                        'الوصول الكامل لكافة الاختبارات السريرية المقننة (ELO, WISC, BDI)',
                        'تطبيق خطط العلاج والمذكرات التخرج',
                        'أرشيف الحالات والتقارير السريرية الشاملة',
                        'تصدير التقارير Master Bilan بصيغة PDF',
                    ],
                ],
                [
                    'name' => 'تخفيض بدء النشاط المهني (Graduation Launch)',
                    'price' => 'تخفيض 70% على الاشتراكات السنوية',
                    'features' => [
                        'نطاق مخصص للعيادة (subdomain.psypro.tech)',
                        'بوابة الأولياء وتطبيق التمارين المنزلية',
                        'ملفات مرضى غير محدودة',
                        'دعم تقني وتدريبي مخصص',
                    ],
                ],
            ],
        ]);
    }
}
