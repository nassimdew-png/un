<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LandingPageStudioController extends Controller
{
    const SETTING_KEY = 'landing_page_config';
    const SETTING_GROUP = 'landing';

    /**
     * Get default complete configuration for the public landing page.
     */
    public static function getDefaultConfig(): array
    {
        return [
            'appearance' => [
                'themeAccent' => 'emerald', // 'emerald', 'teal', 'indigo', 'violet', 'cyan', 'amber'
                'darkModeStyle' => 'slate', // 'slate' or 'black'
                'ambientGlow' => true,
                'brandName' => 'PsyPro',
                'brandSuffix' => '.tech',
                'countryBadge' => 'DZ 🇩🇿',
                'brandTagline' => 'المنظومة الإكلينيكية والطبية السحابية',
                'showFloatingAdvisor' => true,
            ],
            'announcement' => [
                'enabled' => false,
                'badge' => 'إعلان جديد 🚀',
                'text' => 'فترة تجريبية مجانية كاملة 14 يوماً لكافة عيادات ومراكز الأرطوفونيا والصحة النفسية في الجزائر!',
                'link' => '/register',
                'linkText' => 'سجّل عيادتك الآن',
            ],
            'hero' => [
                'badge' => 'المنظومة السريرية الوطنية الأولى في الجزائر 🇩🇿',
                'headline' => 'المنصة السحابية المتكاملة لإدارة عيادات الأرطوفونيا والصحة النفسية',
                'subtitle' => 'رقمنة شاملة للملف الطبي، أكثر من 30 مقياساً مقنناً، مساعد سريري ذكي، وشاشة قاعة الانتظار في منصة واحدة آمنة.',
                'primaryCtaText' => 'ابدأ مجاناً (14 يوماً)',
                'primaryCtaLink' => '/register',
                'secondaryCtaText' => 'استكشف بنك المقاييس السريرية (30+)',
                'secondaryCtaAction' => 'open_finder', // 'open_finder' | 'scroll_pricing' | 'scroll_features'
                'trustBullet1' => 'بدون بطاقة بنكية',
                'trustBullet2' => '14 يوماً تجربة كاملة',
                'trustBullet3' => 'تشفير طبي AES-256',
                'defaultHeroTab' => 'assessments', // 'assessments' | 'ai_copilot' | 'speech_studio' | 'kiosk'
            ],
            'stats' => [
                'stat1' => ['value' => '+120', 'label' => 'عيادة ومركز معتمد'],
                'stat2' => ['value' => '+45 000', 'label' => 'ملف مريض ومفحوص'],
                'stat3' => ['value' => '18', 'label' => 'رائزاً ومقياساً مقنناً'],
                'stat4' => ['value' => '58', 'label' => 'ولاية مغطاة وطنياً'],
            ],
            'sections' => [
                'features' => true,
                'assessments' => true,
                'specialties' => true,
                'ai_copilot' => true,
                'roi_calculator' => true,
                'pricing' => true,
                'payment_assurances' => true,
                'directory_cta' => true,
                'testimonials' => true,
                'faq' => true,
                'final_cta' => true,
            ],
            'faqs' => [
                [
                    'q' => 'هل أحتاج لإدخال بطاقة بنكية أو دفع مسبق لبدء التجربة المجانية؟',
                    'a' => 'لا، على الإطلاق! يمكنك التسجيل وإنشاء حساب عيادتك السحابية فوراً والبدء في استخدام كافة المقاييس والميزات لمدة 14 يوماً مجاناً بدون أي دفع مسبق وبدون بطاقة بنكية.',
                ],
                [
                    'q' => 'كيف تتم عملية تسديد الاشتراك بالدينار الجزائري بعد التجربة؟',
                    'a' => 'نوفر طرق سداد محلية آمنة وميسرة تناسب الأخصائي الجزائري، تشمل تطبيق بريدي موب (BaridiMob) فورياً عبر مسح رمز QR أو تحويل RIP، الحساب البريدي الجاري (CCP)، أو التحويل البنكي المباشر مع استلام فاتورة تجارية B2B ووصل رسمي.',
                ],
                [
                    'q' => 'هل المقاييس المتوفرة في المنصة مقننة ومناسبة للبيئة الجزائرية؟',
                    'a' => 'نعم! تضم المنصة أكثر من 30 مقياساً واختباراً مقنناً (مثل CARS-2, BDI-II, Conners-3, Dyslexia Suite, ELO-DZ, Alouette-R, WISC-V) مع جداول معايرة دقيقة ونقاط قطع (Cut-Offs) متوافقة مع البيئة المغاربية واللغتين العربية والفرنسية.',
                ],
                [
                    'q' => 'هل تعمل المنصة على الهواتف الذكية والأجهزة اللوحية (iPad/Tablets)؟',
                    'a' => 'نعم بالكامل! المنصة مبنية بأحدث تقنيات الويب التقدمي (PWA) ومتجاوبة 100% مع أجهزة الحاسوب، الآيباد، التابلت، وهواتف الأندرويد والآيفون، مع إمكانية تثبيت أيقونة التطبيق على شاشة جهازك كبرنامج أصلي.',
                ],
                [
                    'q' => 'ما مدى سرية وأمان بيانات المرضى والملفات السريرية؟',
                    'a' => 'نولي السرية الطبية الأولوية المطلقة: تخضع جميع البيانات لتشفير طبي بمستوى البنوك (AES-256) مع عزل تام لكل عيادة (Multi-Tenant Isolation) ونسخ احتياطي سحابي يومي آلي مشفر وفق قانون السر المهني وأخلاقيات الممارسة الطبية.',
                ],
                [
                    'q' => 'هل يمكنني تصدير الحصائل والتقارير الطبية بصيغة PDF قابلة للطباعة؟',
                    'a' => 'نعم، المنصة تتيح توليد تقارير الحصيلة الأولية (Bilan Initial)، الحصيلة المرحلية، والتقارير الموجهة للأولياء أو الأطباء الموجهين بصيغة PDF مصممة باحترافية وتضم ترويسة عيادتك وخاتمك الرسمي ورسوماً بيانية توضيحية.',
                ],
            ],
            'testimonials' => [
                [
                    'name' => 'د. سارة بلقاسم',
                    'role' => 'أخصائية أرطوفونيا وعلاج اضطرابات النطق',
                    'wilaya' => 'الجزائر العاصمة',
                    'quote' => 'منصة PsyPro اختصرت عليّ أكثر من 60% من وقت كتابة الحصائل الأرطوفونية والتقارير الطبية. المقاييس المقننة مثل ELO و Alouette أصبحت سهلة التمرير والنتائج فورية ومتقنة.',
                    'rating' => 5,
                ],
                [
                    'name' => 'أ. كريم منصوري',
                    'role' => 'أخصائي نفسي عيادي ومدير مركز تأهيل',
                    'wilaya' => 'وهران',
                    'quote' => 'إدارة ملفات المرضى وجدول المواعيد بالعيادة أصبحت رقمية 100%. أولياء الأمور معجبون جداً ببورن الانتظار وشاشة التلفاز الذكية وبوابة متابعة التمارين المنزلية.',
                    'rating' => 5,
                ],
                [
                    'name' => 'د. فريال حداد',
                    'role' => 'أخصائية في إعادة التأهيل الحركي والنفسي',
                    'wilaya' => 'قسنطينة',
                    'quote' => 'تتبع خطة التأهيل الحركي وقياس التطور والرسوم البيانية للحصائل أعطى عيادتنا طابعاً احترافياً فائقاً. الدعم الفني الجزائري متواجد وممتاز وطرق الدفع بـ BaridiMob مريحة جداً.',
                    'rating' => 5,
                ],
            ],
            'footer' => [
                'supportPhone' => '+213 550 12 34 56',
                'supportEmail' => 'contact@psypro.tech',
                'whatsapp' => '+213550123456',
                'address' => 'الجزائر العاصمة، الجزائر',
                'copyright' => 'جميع الحقوق محفوظة لمنصة PsyPro الطبية © 2026',
                'socialFacebook' => 'https://facebook.com/psypro.tech',
                'socialLinkedIn' => 'https://linkedin.com/company/psypro-tech',
                'socialInstagram' => 'https://instagram.com/psypro.tech',
                'socialYoutube' => '',
            ],
        ];
    }

    /**
     * Get the active landing page configuration (defaults merged with saved overrides).
     */
    public function getConfig(): JsonResponse
    {
        $defaults = self::getDefaultConfig();
        $savedRaw = SystemSetting::get(self::SETTING_KEY);

        if (!empty($savedRaw)) {
            $saved = json_decode($savedRaw, true);
            if (is_array($saved)) {
                $merged = array_replace_recursive($defaults, $saved);
                // For arrays that should be completely replaced rather than merged by index (e.g. faqs, testimonials)
                if (isset($saved['faqs']) && is_array($saved['faqs'])) {
                    $merged['faqs'] = $saved['faqs'];
                }
                if (isset($saved['testimonials']) && is_array($saved['testimonials'])) {
                    $merged['testimonials'] = $saved['testimonials'];
                }
                return response()->json([
                    'success' => true,
                    'config' => $merged,
                    'is_customized' => true,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'config' => $defaults,
            'is_customized' => false,
        ]);
    }

    /**
     * Public endpoint to get landing page config without authentication.
     */
    public function getPublicConfig(): JsonResponse
    {
        return $this->getConfig();
    }

    /**
     * Update landing page configuration.
     */
    public function updateConfig(Request $request): JsonResponse
    {
        $data = $request->validate([
            'appearance' => 'nullable|array',
            'announcement' => 'nullable|array',
            'hero' => 'nullable|array',
            'stats' => 'nullable|array',
            'sections' => 'nullable|array',
            'faqs' => 'nullable|array',
            'testimonials' => 'nullable|array',
            'footer' => 'nullable|array',
        ]);

        $defaults = self::getDefaultConfig();
        $merged = array_replace_recursive($defaults, $data);

        // Preserve exact arrays for faqs and testimonials if passed
        if (isset($data['faqs']) && is_array($data['faqs'])) {
            $merged['faqs'] = $data['faqs'];
        }
        if (isset($data['testimonials']) && is_array($data['testimonials'])) {
            $merged['testimonials'] = $data['testimonials'];
        }

        SystemSetting::set(self::SETTING_KEY, json_encode($merged, JSON_UNESCAPED_UNICODE), self::SETTING_GROUP);

        // Audit log
        try {
            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'landing_page_config_updated',
                'entity_type' => 'landing_page',
                'entity_id' => 1,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'details' => [
                    'themeAccent' => $merged['appearance']['themeAccent'] ?? 'emerald',
                    'updated_at' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::warning('Could not write audit log for landing page update: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ وتطبيق إعدادات الصفحة الرئيسية بنجاح.',
            'config' => $merged,
        ]);
    }

    /**
     * Reset landing page configuration to original defaults.
     */
    public function resetConfig(Request $request): JsonResponse
    {
        SystemSetting::set(self::SETTING_KEY, json_encode(self::getDefaultConfig(), JSON_UNESCAPED_UNICODE), self::SETTING_GROUP);

        try {
            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'landing_page_config_reset',
                'entity_type' => 'landing_page',
                'entity_id' => 1,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'details' => ['reset_to_defaults' => true],
            ]);
        } catch (\Throwable $e) {
            Log::warning('Could not write audit log for landing page reset: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'تمت استعادة الإعدادات الأصلية الافتراضية للصفحة الرئيسية بنجاح.',
            'config' => self::getDefaultConfig(),
        ]);
    }
}
