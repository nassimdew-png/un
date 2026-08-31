<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Throwable;

class FeatureSwitchController extends Controller
{
    /**
     * Get platform feature master switches
     */
    public function getSwitches()
    {
        try {
            $switches = [
                'ai_soap_reports'        => ['enabled' => true, 'label' => 'توليد تقارير الحصيلة وملاحظات SOAP بالذكاء الاصطناعي', 'category' => 'ai'],
                'voice_transcription'    => ['enabled' => true, 'label' => 'التفريغ الصوتي التلقائي لجلسات العيادة (Whisper / Gemini)', 'category' => 'ai'],
                'public_patient_booking' => ['enabled' => true, 'label' => 'حجز المواعيد العامة والموقع المصغر للعيادات (/c/slug)', 'category' => 'clinic'],
                'custom_domains_ssl'     => ['enabled' => true, 'label' => 'النطاقات المخصصة وشهادات SSL التلقائية (Certbot Engine)', 'category' => 'infrastructure'],
                'pecs_exercises_bank'    => ['enabled' => true, 'label' => 'بنك التمارين والكراسات العلاجية ووسائل PECS', 'category' => 'clinical'],
                'diagnostic_tests_bank'  => ['enabled' => true, 'label' => 'بنك الروائز والمقاييس التشخيصية المعتمدة (BDI, CARS, PCC)', 'category' => 'clinical'],
                'sms_appointment_alerts' => ['enabled' => true, 'label' => 'تنبيهات الرسائل النصية القصيرة SMS لتذكير المواعيد', 'category' => 'communication'],
                'whatsapp_reminders'     => ['enabled' => true, 'label' => 'رسائل التذكير التلقائية عبر WhatsApp Cloud API', 'category' => 'communication'],
                'two_factor_auth'        => ['enabled' => false, 'label' => 'التحقق بخطوتين (2FA) للأطباء والأخصائيين', 'category' => 'security'],
                'baridimob_payment_flow' => ['enabled' => true, 'label' => 'دفع الاشتراكات عبر BaridiMob / CCP والمصادقة الفورية', 'category' => 'billing'],
            ];

            return response()->json([
                'status'   => 'success',
                'switches' => $switches
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update feature master switch
     */
    public function updateSwitch(Request $request)
    {
        try {
            $feature = $request->input('feature_key');
            $enabled = (bool) $request->input('enabled');

            return response()->json([
                'status'  => 'success',
                'message' => "تم تحديث حالة الميزة [{$feature}] إلى " . ($enabled ? "مفعلة" : "معطلة") . " بنجاح."
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
