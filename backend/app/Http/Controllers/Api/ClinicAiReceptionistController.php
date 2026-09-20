<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClinicAiReceptionistController extends Controller
{
    /**
     * Get Clinic AI Receptionist configuration and settings.
     */
    public function getSettings(Request $request): JsonResponse
    {
        $tenantId = $request->user()?->tenant_id ?? $request->header('X-Tenant-Id');
        $tenant = Tenant::find($tenantId) ?? Tenant::first();

        $clinicName = $tenant?->name ?? 'العيادة الطبية النفسية والتأهيلية';
        $whatsappPhone = $tenant?->whatsapp_phone ?? $tenant?->phone ?? '0555000000';
        $autoReplyEnabled = (bool) ($tenant?->whatsapp_auto_reply_enabled ?? true);

        return response()->json([
            'success' => true,
            'settings' => [
                'clinic_name' => $clinicName,
                'clinic_slug' => $tenant?->slug ?? 'clinic-demo',
                'whatsapp_phone' => $whatsappPhone,
                'auto_reply_enabled' => $autoReplyEnabled,
                'working_hours' => 'السبت - الخميس: 08:30 - 17:00 (الجمعة: مغلق)',
                'address' => $tenant?->address ?? 'الجزائر العاصمة',
                'specialties' => [
                    'علم النفس العيادي والاستشارات النفسية (Psychologie Clinique / TCC)',
                    'الأرطوفونيا، التخاطب واضطرابات النطق والكلام (Orthophonie)',
                    'إعادة التأهيل النفسي الحركي والنمائي (Psychomotricité)',
                    'التقييمات والمقاييس السريرية المعيارية (Psychometrics & Assessments)',
                ],
            ],
        ]);
    }

    /**
     * Update AI Receptionist configuration.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $tenantId = $request->user()?->tenant_id ?? $request->header('X-Tenant-Id');
        $tenant = Tenant::find($tenantId) ?? Tenant::first();

        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'العيادة غير موجودة'], 404);
        }

        $validated = $request->validate([
            'whatsapp_phone' => 'nullable|string|max:30',
            'whatsapp_auto_reply_enabled' => 'nullable|boolean',
        ]);

        $tenant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ إعدادات موظف الاستقبال الذكي بنجاح.',
            'settings' => [
                'whatsapp_phone' => $tenant->whatsapp_phone,
                'whatsapp_auto_reply_enabled' => (bool)$tenant->whatsapp_auto_reply_enabled,
            ],
        ]);
    }

    /**
     * Simulate incoming WhatsApp patient inquiry and generate AI triage + auto-reply.
     */
    public function simulateMessage(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $tenantId = $request->user()?->tenant_id ?? $request->header('X-Tenant-Id');
        $tenant = Tenant::find($tenantId) ?? Tenant::first();

        $clinicName = $tenant?->name ?? 'العيادة الطبية التخصصية';
        $clinicSlug = $tenant?->slug ?? 'clinic-demo';
        $phone = $tenant?->whatsapp_phone ?? $tenant?->phone ?? '0555000000';

        $rawMessage = trim($request->message);
        $lower = mb_strtolower($rawMessage);

        // Clinical Triage Rules
        $triageSpecialty = 'الاستشارة والتقييم السريري العام';
        $specialtyCode = 'general';
        $urgencyLevel = 'routine';
        $recommendation = 'حجز موعد أولي للتقييم والتشخيص السريري';
        $quickReplies = [];

        if (
            str_contains($lower, 'نطق') || str_contains($lower, 'كلام') ||
            str_contains($lower, 'تأتأة') || str_contains($lower, 'حرف') ||
            str_contains($lower, 'مخارج') || str_contains($lower, 'صوت') ||
            str_contains($lower, 'أرطوفونيا') || str_contains($lower, 'تأخر لغوي')
        ) {
            $triageSpecialty = 'الأرطوفونيا وعلاج اضطرابات النطق والكلام (Orthophonie)';
            $specialtyCode = 'orthophonie';
            $recommendation = 'إجراء فحص فونولوجي وحصيلة لغوية أولية مع الأخصائي الأرطوفوني';
            $quickReplies = [
                'حجز حصيلة لغوية أولية',
                'تعبئة استمارة التطور اللغوي للطفل',
                'أوقات دوام عيادة التخاطب',
            ];
        } elseif (
            str_contains($lower, 'حركة') || str_contains($lower, 'فرط') ||
            str_contains($lower, 'تركيز') || str_contains($lower, 'توازن') ||
            str_contains($lower, 'انتباه') || str_contains($lower, 'حركي') ||
            str_contains($lower, 'إمساك القلم') || str_contains($lower, 'تأهيل حركي')
        ) {
            $triageSpecialty = 'التأهيل النفسي الحركي والنمائي (Psychomotricité)';
            $specialtyCode = 'psychomotricite';
            $recommendation = 'حجز جلسة تقييم حركي حسي نمائي شامل';
            $quickReplies = [
                'حجز تقييم حركي نمائي',
                'استمارة الملاحظة المنزلية للحركة',
                'أسعار الحصص والمواعيد المتاحة',
            ];
        } elseif (
            str_contains($lower, 'قلق') || str_contains($lower, 'اكتئاب') ||
            str_contains($lower, 'خوف') || str_contains($lower, 'هلع') ||
            str_contains($lower, 'وسواس') || str_contains($lower, 'صدمة') ||
            str_contains($lower, 'حزن') || str_contains($lower, 'نفسي') ||
            str_contains($lower, 'نوم') || str_contains($lower, 'توتر')
        ) {
            $triageSpecialty = 'علم النفس العيادي والعلاج السلوكي المعرفي (Psychologie / TCC)';
            $specialtyCode = 'psychologie';
            $recommendation = 'جلسة استشارة نفسية عيادية واستكشاف الأعراض وتطبيق المقاييس';
            $quickReplies = [
                'حجز استشارة نفسية حضورية',
                'استبيان الفرز النفسي المسبق',
                'خيارات الاستشارة عن بعد',
            ];

            if (str_contains($lower, 'انتحار') || str_contains($lower, 'إيذاء') || str_contains($lower, 'أنهي حياتي')) {
                $urgencyLevel = 'urgent';
                $recommendation = '🚨 حالة تتطلب تدخلاً عاجلاً وفحص أمان سريري فوري أو التوجه لأقرب مصلحة استعجالات';
            }
        } elseif (str_contains($lower, 'سعر') || str_contains($lower, 'تكلفة') || str_contains($lower, 'بكم') || str_contains($lower, 'تسعير')) {
            $recommendation = 'إعلام المريض بجدول التسعيرات المعتمدة للجلسات والحصائل';
            $quickReplies = ['تفاصيل تسعيرة الجلسات', 'حجز الموعد الأنسب'];
        } else {
            $quickReplies = ['حجز موعد استشارة', 'موقع العيادة وساعات العمل', 'التحدث مع الاستقبال'];
        }

        // Generate Empathetic WhatsApp Response
        $greeting = "أهلاً وسهلاً بكم في {$clinicName} 🏥✨\nنشكر تواصلكم وثقتكم بنا.";

        if ($urgencyLevel === 'urgent') {
            $responseText = "{$greeting}\n\n" .
                "⚠️ نرجو منكم الانتباه: سلامتكم وراحتكم هي أولويتنا القصوى.\n" .
                "نوصي بالتواصل الفوري معنا هاتفياً على الرقم ({$phone}) أو التوجه فوراً إلى أقرب مصلحة طوارئ طبية.\n" .
                "فريقنا السريري متاح لتقديم الدعم الفوري ومرافقتكم.";
        } else {
            $responseText = "{$greeting}\n\n" .
                "بناءً على رسالتكم الكريمة، يفيدكم نظام الفرز الذكي بأن التخصص الأنسب لحالتكم هو:\n" .
                "📌 {$triageSpecialty}\n\n" .
                "💡 التوصية السريرية المبدئية:\n{$recommendation}.\n\n" .
                "🗓️ لتسهيل حجز موعدكم وتسريع إجراءات الاستقبال، يمكنكم إما:\n" .
                "1️⃣ الرد بتأكيد اليوم والوقت المفضل لحجز موعدكم.\n" .
                "2️⃣ ملء استمارة الفرز الرقمي السريع قبل القدوم لتجهيز ملفكم الطبي مسبقاً.\n\n" .
                "📍 أوقات العمل: السبت إلى الخميس من 08:30 إلى 17:00\n" .
                "دمتم بصحة وعافية، ويسعدنا دائماً مرافقتكم نحو التعافي 🌿";
        }

        $cleanPhone = preg_replace('/[^0-9]/', '', (string)$phone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '213' . substr($cleanPhone, 1);
        }

        $whatsappDirectUrl = "https://api.whatsapp.com/send?phone={$cleanPhone}&text=" . urlencode($rawMessage);

        return response()->json([
            'success' => true,
            'inquiry' => $rawMessage,
            'triage' => [
                'specialty' => $triageSpecialty,
                'specialty_code' => $specialtyCode,
                'urgency_level' => $urgencyLevel,
                'recommendation' => $recommendation,
            ],
            'response_text' => $responseText,
            'quick_replies' => $quickReplies,
            'whatsapp_url' => $whatsappDirectUrl,
            'timestamp' => now()->format('H:i'),
        ]);
    }
}
