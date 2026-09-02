<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\ClinicalAssessment;
use App\Models\ClinicSubscription;
use App\Models\Patient;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PublicAuthController extends Controller
{
    /**
     * Get public clinic information for subdomain branded login page.
     */
    public function getTenantInfo(Request $request): JsonResponse
    {
        $subdomain = $request->query('subdomain')
            ?: $request->header('X-Tenant-Subdomain')
            ?: $this->extractSubdomain($request);

        $host = $request->getHost();

        $tenant = null;
        if ($subdomain && !in_array(strtolower($subdomain), ['psypro', 'psypro.tech', 'www', 'localhost', '127.0.0.1'])) {
            $sub = strtolower(trim($subdomain));
            $tenant = Tenant::where('subdomain', $sub)
                ->orWhere('id', $sub)
                ->orWhere('name', $sub)
                ->first();
        }

        if (!$tenant && $host && !in_array($host, ['psypro.tech', 'www.psypro.tech', 'localhost', '127.0.0.1'])) {
            $tenant = Tenant::where('custom_domain', $host)
                ->orWhere('subdomain', str_replace('.psypro.tech', '', $host))
                ->first();
        }

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'العيادة غير موجودة أو الرابط غير صحيح.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'clinic' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'logo_url' => $tenant->logo_url ?: $tenant->logo_path,
                'header_title_ar' => $tenant->header_title_ar ?: $tenant->name,
                'header_title_fr' => $tenant->header_title_fr,
                'sub_header' => $tenant->sub_header,
                'type' => $tenant->type,
                'specialty' => $tenant->type,
                'wilaya' => $tenant->wilaya ?: ($tenant->settings['city'] ?? 'الجزائر'),
                'phone' => $tenant->phone,
                'email' => $tenant->email,
                'address' => $tenant->address,
                'report_accent_color' => $tenant->report_accent_color ?: '#0d9488',
                'status' => $tenant->status,
                'is_active' => in_array($tenant->status, ['active', 'trial']),
            ],
        ]);
    }

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
     * Self-Registration for Clinics (14-Day Free Trial Onboarding).
     */
    public function registerClinic(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'clinic_name' => 'required|string|max:120',
            'owner_name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:30',
            'password' => 'required|string|min:6',
            'specialty' => 'required|string|in:orthophonie,psychologie,neuro_psychiatrie,pluridisciplinaire,psychology,multidisciplinary',
            'wilaya' => 'required|string|max:60',
            'subdomain' => 'nullable|string|max:60',
            'promo_code' => 'nullable|string|max:30',
            'seed_sample_data' => 'nullable|boolean',
        ]);

        $specialty = $validated['specialty'];
        $wilaya = $validated['wilaya'];
        $seedSampleData = $request->boolean('seed_sample_data', true);

        // Generate clean unique subdomain
        $baseSubdomain = !empty($validated['subdomain'])
            ? Str::slug($validated['subdomain'])
            : Str::slug($validated['clinic_name']);

        if (empty($baseSubdomain) || strlen($baseSubdomain) < 3) {
            $baseSubdomain = 'clinique-' . Str::lower(Str::random(5));
        }

        $subdomain = $baseSubdomain;
        $counter = 1;
        while (Tenant::where('subdomain', $subdomain)->exists()) {
            $subdomain = $baseSubdomain . '-' . $counter;
            $counter++;
        }

        $now = Carbon::now();
        $trialEndsAt = $now->copy()->addDays(14);

        // Fetch default Multi-Pro plan or fallback
        $plan = SubscriptionPlan::where('slug', 'multi_pro')->first() ?? SubscriptionPlan::first();

        $mappedType = 'orthophony';
        if (in_array($specialty, ['psychologie', 'psychology'])) {
            $mappedType = 'psychology';
        } elseif (in_array($specialty, ['neuro_psychiatrie', 'pluridisciplinaire', 'multidisciplinary'])) {
            $mappedType = 'multidisciplinary';
        }

        // 1. Create Tenant
        $tenant = Tenant::create([
            'name' => $validated['clinic_name'],
            'subdomain' => $subdomain,
            'type' => $mappedType,
            'status' => 'trial',
            'phone' => $validated['phone'],
            'address' => "{$wilaya}, Algérie",
            'trial_ends_at' => $trialEndsAt,
            'subscription_ends_at' => $trialEndsAt,
            'plan_id' => 'pro',
            'billing_cycle' => 'monthly',
        ]);

        // 2. Create Owner User
        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => $validated['owner_name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin_owner',
            'specialty' => $specialty,
            'is_active' => true,
        ]);

        // 3. Attach 14-Day Free Trial Subscription
        $subscription = ClinicSubscription::create([
            'clinic_id' => $tenant->id,
            'subscription_plan_id' => $plan ? $plan->id : null,
            'billing_cycle' => 'trial',
            'starts_at' => $now,
            'ends_at' => $trialEndsAt,
            'status' => 'trialing',
            'payment_reference' => 'FREE_TRIAL_14_DAYS',
            'notes' => !empty($validated['promo_code'])
                ? "Compte d'essai créé avec le code promo: " . $validated['promo_code']
                : "Compte d'essai gratuit 14 jours créé en libre-service.",
        ]);

        // 4. Seed realistic clinic sample data if requested
        if ($seedSampleData) {
            $this->seedClinicSampleData($tenant->id, $user->id, $specialty, $wilaya);
        }

        // 5. Generate Sanctum Auth Token
        $token = $user->createToken('clinic_auth')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'مرحباً بك في منصة PsyPro! تم إنشاء حساب عيادتك بنجاح وتفعيل الفترة التجريبية المجانية لمدة 14 يوماً.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'specialty' => $user->specialty,
                'tenant_id' => $user->tenant_id,
            ],
            'clinic' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'status' => $tenant->status,
                'trial_ends_at' => $trialEndsAt->format('d/m/Y'),
                'days_remaining' => 14,
            ],
            'redirect_url' => '/dashboard',
        ], 201);
    }

    /**
     * Seeds realistic Algerian sample patients, assessments, and appointments.
     */
    private function seedClinicSampleData(string $tenantId, int $ownerId, string $specialty, string $wilaya): void
    {
        $now = Carbon::now();

        // Sample Patient 1: Child (Speech/Developmental assessment)
        $p1 = Patient::create([
            'tenant_id' => $tenantId,
            'first_name' => 'يوسف',
            'last_name' => 'بلقاسم',
            'gender' => 'male',
            'birth_date' => '2018-05-14',
            'phone' => '0550123456',
            'guardian_name' => 'السيد أحمد بلقاسم (الأب)',
            'address' => "حي النخيل، {$wilaya}",
            'wilaya_code' => substr($wilaya, 0, 2),
            'anamnesis_data' => [
                'medical_history' => 'تأخر في النمو اللغوي وصعوبة في النطق ومخارج الحروف.',
                'school_grade' => 'التحضيري / الابتدائي',
            ],
        ]);

        // Sample Patient 2: Teenager (Psychometric / Learning Assessment)
        $p2 = Patient::create([
            'tenant_id' => $tenantId,
            'first_name' => 'إيناس',
            'last_name' => 'عماري',
            'gender' => 'female',
            'birth_date' => '2014-11-20',
            'phone' => '0661987654',
            'guardian_name' => 'السيدة فاطمة عماري (الأم)',
            'address' => "وسط المدينة، {$wilaya}",
            'wilaya_code' => substr($wilaya, 0, 2),
            'anamnesis_data' => [
                'medical_history' => 'تقييم شامل للقدرات العقلية وصعوبات التعلم والانتباه.',
                'school_grade' => 'المتوسط',
            ],
        ]);

        // Sample Patient 3: Active Therapy Follow-up
        $p3 = Patient::create([
            'tenant_id' => $tenantId,
            'first_name' => 'ريان',
            'last_name' => 'بوجلال',
            'gender' => 'male',
            'birth_date' => '2019-02-10',
            'phone' => '0770334455',
            'guardian_name' => 'السيد سمير بوجلال',
            'address' => "حي السلام، {$wilaya}",
            'wilaya_code' => substr($wilaya, 0, 2),
            'anamnesis_data' => [
                'medical_history' => 'متابعة أسبوعية لجلسات التأهيل الأرطوفوني والطلاقة اللغوية.',
            ],
        ]);

        // Seed Sample Completed Assessment for Patient 1 (ELO / WISC)
        ClinicalAssessment::create([
            'tenant_id' => $tenantId,
            'patient_id' => $p1->id,
            'specialist_id' => $ownerId,
            'category' => 'orthophony',
            'test_code' => 'ELO',
            'title' => 'تقييم اللغة الشفهية المقنن (ELO-DZ)',
            'assessment_date' => $now->copy()->subDays(3)->format('Y-m-d'),
            'total_score' => 61,
            'severity_level' => 'mild_deficit',
            'results_data' => [
                'lexique_score' => 28,
                'syntaxe_score' => 19,
                'phonologie_score' => 14,
                'total_score' => 61,
                'percentile' => 45,
                'standard_deviation' => -0.8,
            ],
            'clinical_interpretation' => 'استجابة جيدة للمثيرات البصرية مع ملاحظة بطء في الاستدعاء اللفظي السريع.',
            'therapeutic_plan' => 'خطة علاجية تركز على الإدراك الصوتي والوعي الفونولوجي والطلاقة التعبيرية.',
        ]);

        // Seed Sample Appointments
        Appointment::create([
            'tenant_id' => $tenantId,
            'patient_id' => $p1->id,
            'specialist_id' => $ownerId,
            'appointment_date' => $now->copy()->addDays(2)->setHour(10)->setMinute(0),
            'session_duration_minutes' => 45,
            'type' => 'therapy_session',
            'status' => 'scheduled',
            'notes' => 'جلسة تدريب على مخارج الحروف الصوتية.',
        ]);

        Appointment::create([
            'tenant_id' => $tenantId,
            'patient_id' => $p3->id,
            'specialist_id' => $ownerId,
            'appointment_date' => $now->copy()->addDays(1)->setHour(14)->setMinute(30),
            'session_duration_minutes' => 45,
            'type' => 'therapy_session',
            'status' => 'confirmed',
            'notes' => 'جلسة تعزيز الطلاقة اللفظية.',
        ]);
    }
}
