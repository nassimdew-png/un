<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $table = 'subscription_plans';

    protected $fillable = [
        'name_ar',
        'name_fr',
        'slug',
        'description',
        'features',
        'price_monthly',
        'price_yearly',
        'currency',
        'discount_percentage',
        'discount_badge',
        'is_discount_active',
        'discount_ends_at',
        'trial_days',
        'max_patients',
        'max_staff',
        'ai_reports_limit',
        'ai_transcribe_mins',
        'ai_images_limit',
        'ai_podcasts_limit',
        'ai_videos_limit',
        'has_custom_domain',
        'has_priority_support',
        'is_featured',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'features' => 'array',
        'price_monthly' => 'float',
        'price_yearly' => 'float',
        'discount_percentage' => 'float',
        'is_discount_active' => 'boolean',
        'discount_ends_at' => 'datetime',
        'trial_days' => 'integer',
        'max_patients' => 'integer',
        'max_staff' => 'integer',
        'ai_reports_limit' => 'integer',
        'ai_transcribe_mins' => 'integer',
        'ai_images_limit' => 'integer',
        'ai_podcasts_limit' => 'integer',
        'ai_videos_limit' => 'integer',
        'has_custom_domain' => 'boolean',
        'has_priority_support' => 'boolean',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = [
        'discounted_price_monthly',
        'discounted_price_yearly',
        'has_active_discount',
    ];

    /**
     * Master catalog of all platform features grouped by clinical & operational domain.
     */
    public static function getFeaturesCatalog(): array
    {
        return [
            'cockpit' => [
                'name_ar' => 'قمرة الجلسة المباشرة والسجل السريري (EHR & Clinical Cockpit)',
                'icon' => 'Activity',
                'features' => [
                    'clinical_consultation_workspace' => [
                        'label_ar' => 'قمرة الجلسة المباشرة (مسار الخطوات الـ 4 الموجه)',
                        'desc_ar' => 'واجهة الاستقبال، التدخل، التوثيق، وإنهاء الحصة الإكلينيكية بملء الشاشة',
                        'default' => true,
                    ],
                    'clinical_live_timer' => [
                        'label_ar' => 'الميقاتية الإكلينيكية الحية مع التنبيه الزمني',
                        'desc_ar' => 'عداد دقيق لزمن الجلسة يعمل عبر كافة شاشات المنصة دون انقطاع',
                        'default' => true,
                    ],
                    'clinical_soap_notes' => [
                        'label_ar' => 'التوثيق الطبي المنهجي الذكي (SOAP Notes)',
                        'desc_ar' => 'سجل منظم للأعراض الذاتية، الفحص الموضوعي، التقييم، والخطة العلاجية',
                        'default' => true,
                    ],
                    'clinical_cbt_thought_records' => [
                        'label_ar' => 'سجلات إعادة الهيكلة المعرفية والسلوكية (CBT Records)',
                        'desc_ar' => 'تحليل الأفكار التلقائية، التشوهات المعرفية، والأفكار البديلة المتوازنة',
                        'default' => true,
                    ],
                    'clinical_suds_scale' => [
                        'label_ar' => 'مقياس وحدات الضيق والانزعاج الذاتي (SUDS Scale 0-10)',
                        'desc_ar' => 'تتبع مستوى القلق والتوتر قبل وأثناء وبعد التدخل العلاجي',
                        'default' => true,
                    ],
                    'clinical_pei_goals' => [
                        'label_ar' => 'محرك الخطة العلاجية الفردية والأهداف السريرية (PEI Goals)',
                        'desc_ar' => 'أهداف ديناميكية مخصصة حسب تخصص المعالج مع مؤشرات الإنجاز',
                        'default' => true,
                    ],
                ],
            ],
            'psychometrics' => [
                'name_ar' => 'بنك المقاييس والروائز السيكومترية المقننة الـ 18 (Psychometrics Suite)',
                'icon' => 'Brain',
                'features' => [
                    'assessments_standardized_18' => [
                        'label_ar' => 'بنك الروائز المقننة الـ 18 (BDI-II, WAIS, WISC, ELO, ADOS-2...)',
                        'desc_ar' => 'الوصول الكامل إلى الروائز الـ 18 للتشخيص النفسي، اللغوي، والنمائي',
                        'default' => true,
                    ],
                    'assessments_scoring_engine' => [
                        'label_ar' => 'محرك الحساب الآلي للنقاط الموزونة والمئينات (Auto-Scoring Engine)',
                        'desc_ar' => 'تحويل الدرجات الخام إلى رتب مئينية ودرجات معيارية وفق المعايير الإحصائية',
                        'default' => true,
                    ],
                    'assessments_master_bilan' => [
                        'label_ar' => 'محرر ومولد الحصيلة السريرية الشاملة PDF (Master Bilan Builder)',
                        'desc_ar' => 'توليد التقارير الرسمية المصممة بطباعة فاخرة وهوية العيادة وختمها',
                        'default' => true,
                    ],
                    'assessments_red_alerts' => [
                        'label_ar' => 'نظام الإنذار السريري الذكي للأفكار الانتحارية وإيذاء النفس (Red Alerts)',
                        'desc_ar' => 'كشف فوري وتنبيه أحمر للمعالج عند رصد استجابات عالية الخطورة في المقاييس',
                        'default' => true,
                    ],
                    'assessments_remote_assignment' => [
                        'label_ar' => 'تكليف المرضى والأولياء بالمقاييس عن بعد عبر روابط مشفرة',
                        'desc_ar' => 'إرسال الاختبارات للمريض للإجابة عليها ذاتياً من هاتفه مع المزامنة الفورية',
                        'default' => true,
                    ],
                ],
            ],
            'teletherapy' => [
                'name_ar' => 'التطبيب عن بعد والسبورة السريرية (Teletherapy & Interactive Canvas)',
                'icon' => 'Video',
                'features' => [
                    'teletherapy_video_rooms' => [
                        'label_ar' => 'غرف الاستشارات المرئية المشفرة والمحمية (WebRTC Video Rooms)',
                        'desc_ar' => 'جلسات فيديو عالية الدقة بدون تثبيت برامج، متوافقة مع الحواسيب والهواتف',
                        'default' => true,
                    ],
                    'interactive_whiteboard' => [
                        'label_ar' => 'السبورة السريرية التفاعلية متعددة الطبقات (Clinical Whiteboard)',
                        'desc_ar' => 'مساحة رسم تفاعلية مشتركة مع قوالب جاهزة للفحص والألعاب التأهيلية',
                        'default' => true,
                    ],
                    'teletherapy_screen_share' => [
                        'label_ar' => 'مشاركة الشاشة وبث التمارين التفاعلية للمريض',
                        'desc_ar' => 'عرض بطاقات التخاطب والوسائط مباشرة للطفل أثناء الجلسة المرئية',
                        'default' => true,
                    ],
                ],
            ],
            'kiosk_tv' => [
                'name_ar' => 'شاشة الاستقبال وبورن قاعة الانتظار (Kiosk & Waiting Room TV)',
                'icon' => 'Tv',
                'features' => [
                    'kiosk_self_checkin' => [
                        'label_ar' => 'شاشة الاستقبال والتحضير الذاتي للمرضى (Self-Check-in Kiosk)',
                        'desc_ar' => 'تسجيل حضور المريض ذاتياً برقم الهاتف أو رمز PIN دون الحاجة لموظف الاستقبال',
                        'default' => true,
                    ],
                    'waiting_room_tv_queue' => [
                        'label_ar' => 'شاشة التلفاز الذكية لنداء وتسيير طابور الانتظار (TV Queue Feed)',
                        'desc_ar' => 'عرض ديناميكي فوري لأرقام وأسماء المرضى المدعوين لدخول العيادة',
                        'default' => true,
                    ],
                    'tv_audio_chime' => [
                        'label_ar' => 'التنبيه الصوتي والنغمات الموسيقية عند نداء المريض',
                        'desc_ar' => 'رنة صوتية تنبيهية متناسقة لجذب انتباه الجالسين في قاعة الانتظار',
                        'default' => true,
                    ],
                    'tv_custom_ticker' => [
                        'label_ar' => 'شريط التنبيهات والنصائح الصحية المتحرك على شاشة الانتظار',
                        'desc_ar' => 'نص إخباري وتثقيفي مخصص أسفل الشاشة يتم برمجته من لوحة التحكم',
                        'default' => true,
                    ],
                ],
            ],
            'portal' => [
                'name_ar' => 'بوابة المرضى والأولياء الرقمية (Parent & Patient Portal)',
                'icon' => 'Smartphone',
                'features' => [
                    'parent_portal_access' => [
                        'label_ar' => 'بوابة الأولياء الرقمية بروابط الدخول السحرية المشفرة (Magic Link)',
                        'desc_ar' => 'دخول آمن لأولياء الأمور بضغطة زر دون الحاجة لكلمة مرور معقدة',
                        'default' => true,
                    ],
                    'portal_homework_tracking' => [
                        'label_ar' => 'متابعة التمارين المنزلية والكراسات العلاجية الموكلة للطفل',
                        'desc_ar' => 'تتبع إنجاز الأنشطة المنزلية وتقييم الولي لمستوى تفاعل الطفل',
                        'default' => true,
                    ],
                    'portal_self_anamnesis' => [
                        'label_ar' => 'استمارة السوابق النمائية والتاريخ المرضي الذاتي عن بعد',
                        'desc_ar' => 'تعبئة استمارة السوابق من قبل الولي قبل الجلسة الأولى لتوفير وقت المعالج',
                        'default' => true,
                    ],
                    'portal_whatsapp_dispatch' => [
                        'label_ar' => 'إرسال روابط المقاييس والنتائج مباشرة للمريض عبر WhatsApp',
                        'desc_ar' => 'توجيه آلي للاختبارات والمواعيد عبر تطبيق واتساب بنقرة زر واحدة',
                        'default' => true,
                    ],
                ],
            ],
            'specialties' => [
                'name_ar' => 'التأهيل الحركي والتخاطب المتخصص (Specialized Therapy Suites)',
                'icon' => 'Shapes',
                'features' => [
                    'orthophony_matrix' => [
                        'label_ar' => 'مصفوفة مخارج الحروف وفحص الفونولوجيا للأرطوفونيا',
                        'desc_ar' => 'فحص دقيق للاضطرابات النطقية، الحذف، الإبدال، والتشويه الصوتي',
                        'default' => true,
                    ],
                    'stuttering_fluency_analyzer' => [
                        'label_ar' => 'فاحص التأتأة ومعدل الطلاقة الكلامية الذكي (%SS)',
                        'desc_ar' => 'حساب نسبة التأتأة والوقفات التشنجية وتكرار المقاطع بدقة إكلينيكية',
                        'default' => true,
                    ],
                    'psychomotor_bodymap' => [
                        'label_ar' => 'خريطة الجسد الحسية وفحص التناسق والتوازن الحركي',
                        'desc_ar' => 'تقييم المخطط الجسدي، الجانبية، التآزر البصري الحركي، والتوازن الحركي',
                        'default' => true,
                    ],
                    'therapy_homework_hub' => [
                        'label_ar' => 'بنك التمارين والأنشطة العلاجية والكتيبات القابلة للطباعة',
                        'desc_ar' => 'مئات التمارين المصنفة حسب الأهداف العلاجية للأطفال والمراهقين والراشدين',
                        'default' => true,
                    ],
                ],
            ],
            'billing_vault' => [
                'name_ar' => 'الفوترة الطبية والخزينة والأرشيف السريري (Billing & Clinical Vault)',
                'icon' => 'Receipt',
                'features' => [
                    'billing_medical_invoices' => [
                        'label_ar' => 'إدارة الفواتير ووصولات الأتعاب الطبية الرسمية',
                        'desc_ar' => 'إصدار وصولات الاستشارات والعلاجات الفردية والجماعية مع رمز QR للتحقق',
                        'default' => true,
                    ],
                    'billing_insurance_slips' => [
                        'label_ar' => 'استمارات التعويض للضمان الاجتماعي وشركات التأمين',
                        'desc_ar' => 'قوالب مطابقة للتعويضات التأمينية واسترداد مصاريف العلاج',
                        'default' => true,
                    ],
                    'voice_recordings_vault' => [
                        'label_ar' => 'خزانة الأرشيف الصوتي وعينات تسجيل نطق المريض',
                        'desc_ar' => 'تسجيل وحفظ آمن لعينات الكلام لمقارنة التطور الصوتي قبل وبعد التأهيل',
                        'default' => true,
                    ],
                    'clinical_documents_export' => [
                        'label_ar' => 'تصدير السجلات الطبية والتقارير بصيغة PDF و Excel',
                        'desc_ar' => 'تصدير كامل ومؤمن لبيانات المريض والحصائل بضغطة زر واحدة',
                        'default' => true,
                    ],
                ],
            ],
            'ai_studio' => [
                'name_ar' => 'الذكاء الاصطناعي السريري والإنتاج المتطور (Clinical AI Studio & Copilot)',
                'icon' => 'Sparkles',
                'features' => [
                    'ai_copilot_assistant' => [
                        'label_ar' => 'المساعد السريري الذكي ومحلل السلوكيات والأنماط',
                        'desc_ar' => 'اقتراحات إكلينيكية متقدمة مدعومة بنماذج الذكاء الاصطناعي السريرية',
                        'default' => true,
                    ],
                    'ai_voice_scribe' => [
                        'label_ar' => 'المفرغ الصوتي الذكي وتحويل الحديث المباشر إلى ملاحظات SOAP',
                        'desc_ar' => 'تسجيل الجلسة وتحويل الكلام المسموع إلى ملاحظات سريرية مصنفة فوراً',
                        'default' => true,
                    ],
                    'ai_pecs_image_studio' => [
                        'label_ar' => 'استوديو توليد بطاقات PECS والوسائل البصرية العلاجية',
                        'desc_ar' => 'توليد بطاقات تواصل بديل مخصصة فورياً بنظام الذكاء الاصطناعي التوليدي',
                        'default' => true,
                    ],
                    'ai_podcast_studio' => [
                        'label_ar' => 'استوديو البودكاست والإذاعة التثقيفية متعددة الأصوات',
                        'desc_ar' => 'إنتاج حلقات صوتية تثقيفية موجهة لأولياء الأمور والمجتمع بصوت احترافي',
                        'default' => true,
                    ],
                    'ai_video_modeling' => [
                        'label_ar' => 'استوديو فيديوهات النمذجة البصرية والقصص الاجتماعية المتحركة',
                        'desc_ar' => 'صناعة مقاطع فيديو لتدريب أطفال طيف التوحد على المهارات الاجتماعية',
                        'default' => false,
                    ],
                    'ai_receptionist_bot' => [
                        'label_ar' => 'موظف الاستقبال الذكي والمحادثة الآلية على مدار الساعة',
                        'desc_ar' => 'الرد التلقائي على استفسارات الزوار وحجز المواعيد المبدئية للعيادة',
                        'default' => true,
                    ],
                ],
            ],
            'agenda' => [
                'name_ar' => 'إدارة الأجندة والمواعيد المتقدمة (Smart Agenda & Scheduling)',
                'icon' => 'Calendar',
                'features' => [
                    'agenda_multi_views' => [
                        'label_ar' => 'زوايا العرض الأربع (الجدول بالساعة، شبكة الأسبوع، التقويم، القائمة)',
                        'desc_ar' => 'تنظيم مرن لأوقات الحصص ومتابعة جدول دوام كافة المعالجين بالعيادة',
                        'default' => true,
                    ],
                    'agenda_conflict_detection' => [
                        'label_ar' => 'الكشف التلقائي عن تضارب المواعيد والقاعات الإكلينيكية',
                        'desc_ar' => 'منع الحجز المزدوج لنفس المعالج أو القاعة وتنبيه فوري عند التعارض',
                        'default' => true,
                    ],
                    'agenda_recurring_sessions' => [
                        'label_ar' => 'جدولة الحصص المتكررة أسبوعياً تلقائياً',
                        'desc_ar' => 'تثبيت مواعيد الجلسات التأهيلية الدورية لعدة أشهر بضغطة زر واحدة',
                        'default' => true,
                    ],
                    'agenda_whatsapp_reminders' => [
                        'label_ar' => 'التذكير التلقائي بالمواعيد عبر رسائل WhatsApp الرسمية',
                        'desc_ar' => 'إرسال إشعار تذكيري مسبق لتقليل نسب التغيب عن الحصص العلاجية',
                        'default' => true,
                    ],
                ],
            ],
            'enterprise' => [
                'name_ar' => 'الأمان والنطاقات المخصصة والسيادة (Enterprise Security & Custom Domains)',
                'icon' => 'ShieldCheck',
                'features' => [
                    'custom_domain_ssl' => [
                        'label_ar' => 'ربط الدومين الخاص بالعيادة مع شهادة SSL تلقائية',
                        'desc_ar' => 'استخدام نطاق ويب مستقل (مثال: clinic-name.com) باسم العيادة',
                        'default' => false,
                    ],
                    'audit_logs_tracking' => [
                        'label_ar' => 'سجل التدقيق الجنائي لتتبع حركة الموظفين والعمليات',
                        'desc_ar' => 'أرشفة موثقة لكافة عمليات الدخول وتعديل السجلات الطبية لحماية البيانات',
                        'default' => true,
                    ],
                    'vip_priority_support' => [
                        'label_ar' => 'الدعم الفني المباشر ذو الأولوية القصوى على مدار 24/7',
                        'desc_ar' => 'قناة اتصال مخصصة وسريعة مع فريق الدعم الهندسي للمنصة',
                        'default' => false,
                    ],
                    'automated_backups' => [
                        'label_ar' => 'النسخ الاحتياطي التلقائي والمشفر لقاعدة بيانات العيادة',
                        'desc_ar' => 'توليد نسخ احتياطية دورية لضمان عدم ضياع أي ملف طبي تحت أي ظرف',
                        'default' => true,
                    ],
                ],
            ],
        ];
    }

    /**
     * Flat key-value array of default features for a given plan tier.
     */
    public static function getDefaultFeatureMap(string $tier = 'pro'): array
    {
        $catalog = self::getFeaturesCatalog();
        $map = [];
        foreach ($catalog as $group) {
            foreach ($group['features'] as $key => $meta) {
                $map[$key] = (bool)$meta['default'];
            }
        }

        if ($tier === 'starter' || $tier === 'solo') {
            $map['teletherapy_video_rooms'] = false;
            $map['interactive_whiteboard'] = false;
            $map['kiosk_self_checkin'] = false;
            $map['waiting_room_tv_queue'] = false;
            $map['ai_podcast_studio'] = false;
            $map['ai_video_modeling'] = false;
            $map['custom_domain_ssl'] = false;
            $map['vip_priority_support'] = false;
        } elseif ($tier === 'enterprise' || $tier === 'vip') {
            foreach ($map as $k => $v) {
                $map[$k] = true;
            }
        }

        return $map;
    }

    /**
     * Check whether a specific feature is enabled on this plan.
     */
    public function hasFeature(string $featureKey): bool
    {
        $features = $this->features;
        if (is_array($features) && array_key_exists($featureKey, $features)) {
            return (bool)$features[$featureKey];
        }

        // Fallback to defaults
        $slug = strtolower($this->slug ?? '');
        $tier = (str_contains($slug, 'enterprise') || str_contains($slug, 'vip')) ? 'enterprise' : ((str_contains($slug, 'starter') || str_contains($slug, 'solo')) ? 'starter' : 'pro');
        $defaults = self::getDefaultFeatureMap($tier);
        return $defaults[$featureKey] ?? true;
    }

    /**
     * Accessor for features attribute: always ensure a full array with boolean states.
     */
    public function getFeaturesAttribute($value)
    {
        $stored = [];
        if (!empty($value)) {
            if (is_string($value)) {
                $decoded = json_decode($value, true);
                if (is_array($decoded)) {
                    $stored = $decoded;
                }
            } elseif (is_array($value)) {
                $stored = $value;
            }
        }

        $slug = strtolower($this->slug ?? '');
        $tier = (str_contains($slug, 'enterprise') || str_contains($slug, 'vip')) ? 'enterprise' : ((str_contains($slug, 'starter') || str_contains($slug, 'solo')) ? 'starter' : 'pro');
        $defaults = self::getDefaultFeatureMap($tier);

        return array_merge($defaults, $stored);
    }

    public function clinics()
    {
        return $this->hasMany(Tenant::class, 'plan_id');
    }

    public function tenants()
    {
        return $this->hasMany(Tenant::class, 'plan_id');
    }

    /**
     * Determine if this plan has an active discount.
     */
    public function getHasActiveDiscountAttribute(): bool
    {
        if (!$this->is_discount_active || (float)$this->discount_percentage <= 0) {
            return false;
        }
        if ($this->discount_ends_at && $this->discount_ends_at->isPast()) {
            return false;
        }
        return true;
    }

    /**
     * Compute monthly price after discount.
     */
    public function getDiscountedPriceMonthlyAttribute(): float
    {
        $base = (float)($this->price_monthly ?? 0);
        if ($this->has_active_discount) {
            $pct = (float)$this->discount_percentage;
            return round($base * (1 - ($pct / 100)));
        }
        return $base;
    }

    /**
     * Compute yearly price after discount.
     */
    public function getDiscountedPriceYearlyAttribute(): float
    {
        $base = (float)($this->price_yearly ?? 0);
        if ($this->has_active_discount) {
            $pct = (float)$this->discount_percentage;
            return round($base * (1 - ($pct / 100)));
        }
        return $base;
    }
}

