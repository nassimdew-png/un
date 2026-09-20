<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\ClinicalTestAssignment;
use App\Models\HomeworkAssignment;
use App\Models\Invoice;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ClinicOnboardingFunnelController extends Controller
{
    protected function authorizeSuperAdmin(): ?User
    {
        $user = Auth::guard('sanctum')->user() ?: Auth::user() ?: request()->user();

        if (!$user) {
            $token = request()->bearerToken();
            if ($token) {
                $pat = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                if ($pat && $pat->tokenable) {
                    $user = $pat->tokenable;
                }
            }
        }

        if ($user) {
            $isSuper = (bool)$user->is_super_admin 
                || in_array($user->role, ['superadmin', 'super_admin', 'super_owner'])
                || in_array($user->admin_role ?? '', ['super_owner', 'support_agent'])
                || (method_exists($user, 'isSuperadmin') && $user->isSuperadmin());

            if (!$isSuper) {
                abort(403, 'غير مصرح لك بالوصول لمسار تهيئة العيادات وقمع التحويل.');
            }
            return $user;
        }

        return null;
    }

    /**
     * Get Onboarding Conversion Funnel Overview & Telemetry.
     * GET /api/super-admin/onboarding-funnel/overview
     */
    public function getFunnelOverview(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $tenants = Tenant::with(['plan'])->orderBy('created_at', 'desc')->get();
        $totalTenants = $tenants->count();

        // Stages definition
        $stages = [
            1 => [
                'id' => 1,
                'key' => 'signups',
                'title_ar' => '1. التسجيل والحساب التجريبي',
                'description_ar' => 'إنشاء العيادة وبدء الفترة التجريبية',
                'icon' => 'UserPlus',
                'count' => 0,
                'dropoff_count' => 0,
                'dropoff_pct' => 0,
                'conversion_pct' => 100,
                'stuck_clinics' => [],
            ],
            2 => [
                'id' => 2,
                'key' => 'identity',
                'title_ar' => '2. الهوية السريرية والختم الطبي',
                'description_ar' => 'ضبط العنوان، التخصص، والختم الرقمي',
                'icon' => 'Building',
                'count' => 0,
                'dropoff_count' => 0,
                'dropoff_pct' => 0,
                'conversion_pct' => 0,
                'stuck_clinics' => [],
            ],
            3 => [
                'id' => 3,
                'key' => 'first_patient',
                'title_ar' => '3. إضافة أول ملف مريض',
                'description_ar' => 'تسجيل مريض أو طفل وتدشين الملف الطبي',
                'icon' => 'Users',
                'count' => 0,
                'dropoff_count' => 0,
                'dropoff_pct' => 0,
                'conversion_pct' => 0,
                'stuck_clinics' => [],
            ],
            4 => [
                'id' => 4,
                'key' => 'first_session',
                'title_ar' => '4. عقد أول جلسة سريرية',
                'description_ar' => 'إطلاق الجلسة بالميقاتية وتوثيق SOAP',
                'icon' => 'Clock',
                'count' => 0,
                'dropoff_count' => 0,
                'dropoff_pct' => 0,
                'conversion_pct' => 0,
                'stuck_clinics' => [],
            ],
            5 => [
                'id' => 5,
                'key' => 'clinical_tools',
                'title_ar' => '5. أدوات الفحص والكراسات',
                'description_ar' => 'تمرير رائز مقنن أو تكليف كراس تمارين منزلي',
                'icon' => 'FileCheck',
                'count' => 0,
                'dropoff_count' => 0,
                'dropoff_pct' => 0,
                'conversion_pct' => 0,
                'stuck_clinics' => [],
            ],
            6 => [
                'id' => 6,
                'key' => 'paid_conversion',
                'title_ar' => '6. التحويل لاشتراك سنوي مدفوع',
                'description_ar' => 'تأكيد الدفع ببريدي موب وتفعيل الحساب الدائم',
                'icon' => 'Sparkles',
                'count' => 0,
                'dropoff_count' => 0,
                'dropoff_pct' => 0,
                'conversion_pct' => 0,
                'stuck_clinics' => [],
            ],
        ];

        $enrichedClinics = [];
        $totalScoreSum = 0;
        $fullyOnboardedCount = 0;
        $needsAttentionCount = 0;

        foreach ($tenants as $t) {
            $owner = User::where('tenant_id', $t->id)->first();
            $patientCount = Patient::where('tenant_id', $t->id)->count();
            $appointmentCount = Appointment::where('tenant_id', $t->id)->count();
            $testCount = ClinicalTestAssignment::where('tenant_id', $t->id)->count();
            $exerciseCount = HomeworkAssignment::where('clinic_id', $t->id)->count();
            $invoiceCount = Invoice::where('tenant_id', $t->id)->count();

            // Check milestone criteria
            $hasIdentity = !empty($t->wilaya) && (!empty($t->address) || !empty($t->phone) || !empty($t->digital_stamp_path));
            $hasPatient = $patientCount > 0;
            $hasSession = $appointmentCount > 0;
            $hasTools = ($testCount + $exerciseCount) > 0;
            $isPaid = $t->status === 'active' && ($t->plan_id !== 'trial' || $t->is_custom_plan || (float)($t->custom_price_dzd ?? 0) > 0 || (int)$t->bypass_expiration === 1);

            // Compute current step
            $completedSteps = 1; // Stage 1 is always completed (they registered)
            $currentStep = 2;

            if ($hasIdentity) {
                $completedSteps++;
                $currentStep = 3;
            }
            if ($hasPatient) {
                $completedSteps++;
                $currentStep = 4;
            }
            if ($hasSession) {
                $completedSteps++;
                $currentStep = 5;
            }
            if ($hasTools) {
                $completedSteps++;
                $currentStep = 6;
            }
            if ($isPaid) {
                $completedSteps++;
                $currentStep = 6;
            }

            // Stage counts
            $stages[1]['count']++;
            if ($hasIdentity) $stages[2]['count']++;
            if ($hasPatient) $stages[3]['count']++;
            if ($hasSession) $stages[4]['count']++;
            if ($hasTools) $stages[5]['count']++;
            if ($isPaid) $stages[6]['count']++;

            $score = round(($completedSteps / 6) * 100);
            $totalScoreSum += $score;

            if ($completedSteps >= 5) {
                $fullyOnboardedCount++;
            }

            $daysSinceSignup = $t->created_at ? (int) $t->created_at->diffInDays(Carbon::now()) : 0;
            $isStuck = !$isPaid && $currentStep < 6 && $daysSinceSignup >= 2;

            if ($isStuck && $currentStep <= 3) {
                $needsAttentionCount++;
            }

            $clinicItem = [
                'id' => $t->id,
                'name' => $t->name,
                'subdomain' => $t->subdomain,
                'type' => $t->type ?: 'multidisciplinary',
                'wilaya' => $t->wilaya ?: 'الجزائر',
                'commune' => $t->commune ?: 'المركز',
                'phone' => $t->phone ?: ($owner?->phone ?: '--'),
                'doctor_name' => $owner?->name ?: 'طبيب العيادة',
                'doctor_email' => $owner?->email ?: '--',
                'status' => $t->status ?: 'trial',
                'days_since_signup' => $daysSinceSignup,
                'completed_steps' => $completedSteps,
                'current_step' => $currentStep,
                'score' => $score,
                'is_stuck' => $isStuck,
                'metrics' => [
                    'patients' => $patientCount,
                    'appointments' => $appointmentCount,
                    'tests_and_exercises' => $testCount + $exerciseCount,
                    'invoices' => $invoiceCount,
                ],
                'last_nudge_at' => $t->last_onboarding_nudge_at ? $t->last_onboarding_nudge_at->format('Y-m-d H:i') : null,
                'last_nudge_template' => $t->last_onboarding_nudge_template,
                'tour_enabled' => (bool) $t->onboarding_tour_enabled,
                'created_at' => $t->created_at ? $t->created_at->format('Y-m-d') : null,
            ];

            // If stuck at a specific stage, append to that stage's stuck list
            if ($isStuck && isset($stages[$currentStep])) {
                $stages[$currentStep]['stuck_clinics'][] = $clinicItem;
            }

            $enrichedClinics[] = $clinicItem;
        }

        // Compute drop-off and conversion rates across stages
        $prevCount = $totalTenants > 0 ? $stages[1]['count'] : 0;

        for ($i = 1; $i <= 6; $i++) {
            $curCount = $stages[$i]['count'];
            $stages[$i]['conversion_pct'] = $totalTenants > 0 ? round(($curCount / $totalTenants) * 100, 1) : 0;

            if ($i > 1) {
                $drop = $prevCount - $curCount;
                $stages[$i - 1]['dropoff_count'] = max(0, $drop);
                $stages[$i - 1]['dropoff_pct'] = $prevCount > 0 ? round(($drop / $prevCount) * 100, 1) : 0;
            }
            $prevCount = $curCount;
        }

        $overallConversionRate = $totalTenants > 0 ? round(($stages[6]['count'] / $totalTenants) * 100, 1) : 0;
        $avgScore = $totalTenants > 0 ? round($totalScoreSum / $totalTenants) : 0;

        return response()->json([
            'success' => true,
            'kpis' => [
                'total_clinics' => $totalTenants,
                'fully_onboarded_count' => $fullyOnboardedCount,
                'needs_attention_count' => $needsAttentionCount,
                'overall_conversion_rate' => $overallConversionRate,
                'average_score' => $avgScore,
                'paid_active_count' => $stages[6]['count'],
                'trial_count' => $totalTenants - $stages[6]['count'],
            ],
            'stages' => array_values($stages),
            'clinics' => $enrichedClinics,
        ]);
    }

    /**
     * Send tailored onboarding nudge via WhatsApp to stuck clinic.
     * POST /api/super-admin/onboarding-funnel/clinics/{id}/nudge
     */
    public function sendOnboardingNudge(Request $request, string $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $tenant = Tenant::findOrFail($id);
        $owner = User::where('tenant_id', $tenant->id)->first();
        $phone = $tenant->phone ?: ($owner?->phone ?: '');

        $validated = $request->validate([
            'stage' => 'required|integer|between:1,6',
            'custom_message' => 'nullable|string',
        ]);

        $stage = (int) $validated['stage'];
        $doctorName = $owner?->name ?: 'دكتورنا الفاضل';

        // Pre-defined tailored clinical templates per stage
        $templates = [
            1 => [
                'template_key' => 'welcome_identity',
                'title_ar' => 'ترحيب وإكمال الهوية السريرية',
                'message' => "السلام عليكم دكتور {$doctorName}،\n\nنرحب بكم بحرارة في منصة PsyPro الطبية. نلاحظ أن حساب عيادتكم \"{$tenant->name}\" جاهز، لكن لم تكتمل إضافة الختم الطبي وتفاصيل العنوان.\n\nإكمال الهوية يسمح بظهور ترويستكم الرسمية على كافة التقارير والحصائل السريرية وفق المعايير الطبية.\n\nهل تحتاجون مساعدة فريقنا الفني لضبطها مجاناً؟ نحن في خدمتكم دائماً.",
            ],
            2 => [
                'template_key' => 'first_patient_guidance',
                'title_ar' => 'المساعدة في إضافة أول ملف مريض',
                'message' => "تحية طيبة دكتور {$doctorName}،\n\nنأمل أنكم بخير! لتستفيدوا بالكامل من ميزات عيادة \"{$tenant->name}\" الرقمية، ندعوكم لتسجيل أول ملف مريض أو طفل بنقرة واحدة عبر لوحة التحكم.\n\nيمكنكم أيضاً إرسال رابط الاستمارة المسبقة لولي الأمر لملء بيانات الحالة عن بعد دون تضييع وقت المقابلة.\n\nرابط تسجيل الدخول: https://{$tenant->subdomain}.psypro.tech",
            ],
            3 => [
                'template_key' => 'first_session_whisper',
                'title_ar' => 'تجربة الكاتب الذكي AI Whisper في الجلسة',
                'message' => "مرحباً دكتور {$doctorName}،\n\nهل لديكم جلسة سريرية قادمة اليوم في عيادة \"{$tenant->name}\"؟\n\nندعوكم لتجربة الكاتب الطبي الذكي (Ambient AI Whisper) الذي يستمع للحوار السريري ويحوله فورياً لملاحظات SOAP منهجية ليوفر عليكم 80% من وقت التوثيق اليدوي.\n\nلإطلاق أول جلسة: https://{$tenant->subdomain}.psypro.tech/sessions",
            ],
            4 => [
                'template_key' => 'assessments_and_workbooks',
                'title_ar' => 'استكشاف بنك الروائز الـ 18 والكراسات',
                'message' => "أهلاً دكتور {$doctorName}،\n\nنود تذكيركم بأن حسابكم في منصة PsyPro يتضمن بنك الروائز الـ 18 المقننة (BDI, BAI, Vineland, CARS...) مع التصحيح الآلي الفوري، وبنك كراسات التمارين القابلة للطباعة A4 باسم المريض وتوجيهاتكم الخاصة.\n\nاستفيدوا منها مع مرضاكم الآن: https://{$tenant->subdomain}.psypro.tech/therapy/tests",
            ],
            5 => [
                'template_key' => 'bilan_generator',
                'title_ar' => 'إصدار أول حصيلة رسمية معتمدة',
                'message' => "السلام عليكم دكتور {$doctorName}،\n\nيمكنكم الآن توليد الحصيلة السريرية الرسمية الشاملة (Master Bilan) متضمنة التقييمات والأهداف العلاجية PEI وختم QR Code المعتمد بنقرة واحدة.\n\nجرّبوا مولّد الحصائل في عيادتكم: https://{$tenant->subdomain}.psypro.tech/assessments",
            ],
            6 => [
                'template_key' => 'paid_upgrade_offer',
                'title_ar' => 'عرض الترقية والاشتراك السنوي المستقر',
                'message' => "تحية تقدير دكتور {$doctorName}،\n\nنشكركم على ثقتكم في منصة PsyPro لإدارة عيادة \"{$tenant->name}\". لضمان استمرار ملفات مرضاكم والنسخ الاحتياطي السحابي الدائم، يسعدنا تفعيل اشتراككم السنوي عبر تطبيق بريدي موب BaridiMob مع الاستفادة من الدعم التقني VIP.\n\nللتجديد الفوري أو رفع الوصل: https://psypro.tech/pricing",
            ],
        ];

        $chosen = $templates[$stage] ?? $templates[1];
        $finalMessage = !empty($validated['custom_message']) ? $validated['custom_message'] : $chosen['message'];

        // Clean phone number for WhatsApp
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '213' . substr($cleanPhone, 1);
        } elseif (!str_starts_with($cleanPhone, '213') && strlen($cleanPhone) === 9) {
            $cleanPhone = '213' . $cleanPhone;
        }

        $whatsappUrl = 'https://wa.me/' . $cleanPhone . '?text=' . rawurlencode($finalMessage);

        $tenant->update([
            'last_onboarding_nudge_at' => now(),
            'last_onboarding_nudge_template' => $chosen['template_key'],
        ]);

        AuditLogger::log(
            'clinic.onboarding_nudged',
            "قام المشرف العام بإرسال تنبيه تحفيزي لمسار التهيئة لعيادة: \"{$tenant->name}\" (المرحلة {$stage})",
            'info',
            'Tenant',
            $tenant->id,
            [
                'stage' => $stage,
                'template' => $chosen['template_key'],
                'phone' => $cleanPhone,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تجهيز رسالة التحفيز وتسجيل التنبيه بنجاح!',
            'whatsapp_url' => $whatsappUrl,
            'final_message' => $finalMessage,
            'clean_phone' => $cleanPhone,
        ]);
    }

    /**
     * Toggle or reset onboarding tour for a clinic.
     * POST /api/super-admin/onboarding-funnel/clinics/{id}/toggle-tour
     */
    public function toggleOnboardingTour(Request $request, string $id): JsonResponse
    {
        $this->authorizeSuperAdmin();

        $tenant = Tenant::findOrFail($id);
        $newVal = !$tenant->onboarding_tour_enabled;
        $tenant->update(['onboarding_tour_enabled' => $newVal]);

        AuditLogger::log(
            'clinic.tour_toggled',
            "قام المشرف العام بتعديل حالة الجولة الإرشادية لعيادة: \"{$tenant->name}\" إلى: " . ($newVal ? 'مفعلة' : 'معطلة'),
            'info',
            'Tenant',
            $tenant->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تعديل حالة الجولة الإرشادية بنجاح!',
            'tour_enabled' => $newVal,
        ]);
    }
}
