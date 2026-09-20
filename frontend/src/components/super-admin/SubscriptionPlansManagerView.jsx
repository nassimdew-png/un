import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Users,
  Building2,
  Star,
  Layers,
  Clock,
  Shield,
  Globe,
  Radio,
  FileText,
  Mic,
  Image as ImageIcon,
  Video,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  DollarSign,
  Activity,
  Brain,
  Tv,
  Smartphone,
  Shapes,
  Receipt,
  Calendar,
  ShieldCheck,
  Search,
  Eye,
  Filter,
  CheckSquare,
  Square,
  Zap,
  HelpCircle,
  Tag,
  Percent,
  Flame,
} from 'lucide-react';
import { subscriptionPlansApi } from '../../api';

// 10 Comprehensive Platform Feature Domains (40 features total)
export const PLATFORM_DOMAINS_CATALOG = [
  {
    id: 'cockpit',
    name_ar: 'قمرة الجلسة المباشرة والسجل السريري (EHR)',
    name_fr: 'Dossier Clinique & Cockpit Live',
    icon: Activity,
    color: 'from-emerald-600 to-teal-700',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    features: [
      {
        key: 'clinical_consultation_workspace',
        name_ar: 'قمرة الجلسة المباشرة (مسار الخطوات الـ 4 الموجه)',
        desc_ar: 'واجهة الاستقبال، التدخل، التوثيق، والإنهاء بملء الشاشة',
        isCritical: true,
      },
      {
        key: 'clinical_live_timer',
        name_ar: 'الميقاتية الإكلينيكية الحية مع التنبيه الزمني',
        desc_ar: 'عداد مستمر لزمن الجلسة عبر كافة مراحل الحصة دون انقطاع',
      },
      {
        key: 'clinical_soap_notes',
        name_ar: 'التوثيق الطبي المنهجي الذكي (SOAP Notes)',
        desc_ar: 'سجل منظم للأعراض الذاتية، الفحص، التقييم، والخطة العلاجية',
        isCritical: true,
      },
      {
        key: 'clinical_cbt_thought_records',
        name_ar: 'سجلات إعادة الهيكلة المعرفية والسلوكية (CBT)',
        desc_ar: 'تحليل الأفكار التلقائية والتشوهات المعرفية والأفكار البديلة',
      },
      {
        key: 'clinical_suds_scale',
        name_ar: 'مقياس وحدات الضيق والانزعاج الذاتي (SUDS 0-10)',
        desc_ar: 'تتبع شدة القلق والتوتر قبل وأثناء وبعد الجلسة',
      },
      {
        key: 'clinical_pei_goals',
        name_ar: 'محرك الخطة الفردية والأهداف السريرية (PEI Goals)',
        desc_ar: 'أهداف إكلينيكية مخصصة حسب التخصص مع مؤشرات التقدم',
      },
    ],
  },
  {
    id: 'psychometrics',
    name_ar: 'بنك المقاييس والروائز السيكومترية المقننة الـ 18',
    name_fr: 'Batterie Psychométrique (18 Tests)',
    icon: Brain,
    color: 'from-purple-600 to-indigo-700',
    badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    features: [
      {
        key: 'assessments_standardized_18',
        name_ar: 'بنك الروائز المقننة الـ 18 (BDI-II, WAIS, WISC, ELO, ADOS-2...)',
        desc_ar: 'الوصول الكامل إلى الروائز الـ 18 للتشخيص النفسي واللغوي والنمائي',
        isCritical: true,
      },
      {
        key: 'assessments_scoring_engine',
        name_ar: 'محرك الحساب الآلي للنقاط الموزونة والمئينات (Auto-Scoring)',
        desc_ar: 'تحويل الدرجات الخام إلى رتب مئينية ومعايير إحصائية دقيقة',
      },
      {
        key: 'assessments_master_bilan',
        name_ar: 'محرر ومولد الحصيلة السريرية الشاملة PDF (Master Bilan)',
        desc_ar: 'توليد تقارير رسمية فاخرة مجهزة للطباعة بهوية العيادة والختم الطبي',
        isCritical: true,
      },
      {
        key: 'assessments_red_alerts',
        name_ar: 'نظام الإنذار السريري للأفكار الانتحارية وإيذاء النفس (Red Alerts)',
        desc_ar: 'كشف فوري وتنبيه أحمر للمعالج عند رصد استجابات عالية الخطورة',
        isCritical: true,
      },
      {
        key: 'assessments_remote_assignment',
        name_ar: 'تكليف المرضى والأولياء بالمقاييس عن بعد بروابط مشفرة',
        desc_ar: 'إرسال الاختبارات للإجابة الذاتية من الهاتف مع المزامنة اللحظية',
      },
    ],
  },
  {
    id: 'teletherapy',
    name_ar: 'التطبيب عن بعد والسبورة السريرية التفاعلية',
    name_fr: 'Télé-Thérapie & Tableau Blanc',
    icon: Video,
    color: 'from-sky-600 to-blue-700',
    badgeColor: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    features: [
      {
        key: 'teletherapy_video_rooms',
        name_ar: 'غرف الاستشارات المرئية المشفرة (WebRTC Video Rooms)',
        desc_ar: 'جلسات فيديو عالية الدقة بدون برامج، متوافقة مع كافة الأجهزة',
      },
      {
        key: 'interactive_whiteboard',
        name_ar: 'السبورة السريرية التفاعلية متعددة الطبقات (Canvas)',
        desc_ar: 'مساحة رسم تفاعلية مشتركة مع قوالب جاهزة للفحص والألعاب',
      },
      {
        key: 'teletherapy_screen_share',
        name_ar: 'مشاركة الشاشة وبث التمارين التفاعلية للمريض',
        desc_ar: 'عرض بطاقات التخاطب والوسائط مباشرة للطفل أثناء المكالمة',
      },
    ],
  },
  {
    id: 'kiosk_tv',
    name_ar: 'شاشة الاستقبال وبورن قاعة الانتظار',
    name_fr: 'Borne d\'Accueil & TV Salle d\'Attente',
    icon: Tv,
    color: 'from-amber-600 to-orange-700',
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    features: [
      {
        key: 'kiosk_self_checkin',
        name_ar: 'شاشة الاستقبال والتحضير الذاتي للمرضى (Self-Check-in)',
        desc_ar: 'تسجيل الحضور بالـ PIN أو رقم الهاتف ذاتياً عند وصول العيادة',
      },
      {
        key: 'waiting_room_tv_queue',
        name_ar: 'شاشة التلفاز الذكية لنداء وتسيير طابور الانتظار (TV Queue)',
        desc_ar: 'عرض ديناميكي فوري لأرقام وأسماء المرضى المدعوين للدخول',
      },
      {
        key: 'tv_audio_chime',
        name_ar: 'التنبيه الصوتي والنغمات الموسيقية عند نداء المريض',
        desc_ar: 'رنة صوتية تنبيهية متناسقة لجذب انتباه المرضى بقاعة الانتظار',
      },
      {
        key: 'tv_custom_ticker',
        name_ar: 'شريط التنبيهات والنصائح الصحية المتحرك على الشاشة',
        desc_ar: 'نص إخباري وتثقيفي مخصص أسفل الشاشة يتم برمجته من لوحة التحكم',
      },
    ],
  },
  {
    id: 'portal',
    name_ar: 'بوابة المرضى والأولياء الرقمية',
    name_fr: 'Portail Parents & Patients',
    icon: Smartphone,
    color: 'from-teal-600 to-emerald-700',
    badgeColor: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
    features: [
      {
        key: 'parent_portal_access',
        name_ar: 'بوابة الأولياء الرقمية بروابط الدخول السحرية (Magic Link)',
        desc_ar: 'دخول آمن لأولياء الأمور بضغطة زر لمتابعة خطة تأهيل طفلهم',
      },
      {
        key: 'portal_homework_tracking',
        name_ar: 'متابعة التمارين المنزلية والكراسات العلاجية للطفل',
        desc_ar: 'تتبع إنجاز الأنشطة المنزلية وتقييم تفاعل الطفل مع الكراس',
      },
      {
        key: 'portal_self_anamnesis',
        name_ar: 'استمارة السوابق النمائية والتاريخ المرضي الذاتي عن بعد',
        desc_ar: 'تعبئة استمارة السوابق من الولي قبل أول حصة لتوفير وقت الفحص',
      },
      {
        key: 'portal_whatsapp_dispatch',
        name_ar: 'إرسال روابط المقاييس والنتائج مباشرة عبر WhatsApp',
        desc_ar: 'توجيه آلي للاختبارات والمواعيد عبر واتساب بضغطة زر واحدة',
      },
    ],
  },
  {
    id: 'specialties',
    name_ar: 'التأهيل الحركي والتخاطب المتخصص',
    name_fr: 'Orthophonie & Psychomotricité',
    icon: Shapes,
    color: 'from-pink-600 to-rose-700',
    badgeColor: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
    features: [
      {
        key: 'orthophony_matrix',
        name_ar: 'مصفوفة مخارج الحروف وفحص الفونولوجيا للأرطوفونيا',
        desc_ar: 'فحص الاضطرابات النطقية، الحذف، الإبدال، والتشويه الصوتي',
      },
      {
        key: 'stuttering_fluency_analyzer',
        name_ar: 'فاحص التأتأة ومعدل الطلاقة الكلامية الذكي (%SS)',
        desc_ar: 'حساب نسبة التأتأة والوقفات التشنجية وتكرار المقاطع بدقة',
      },
      {
        key: 'psychomotor_bodymap',
        name_ar: 'خريطة الجسد الحسية وفحص التناسق والتوازن الحركي',
        desc_ar: 'تقييم المخطط الجسدي، الجانبية، والتآزر البصري الحركي',
      },
      {
        key: 'therapy_homework_hub',
        name_ar: 'بنك التمارين والأنشطة العلاجية والكتيبات القابلة للطباعة',
        desc_ar: 'مئات الأنشطة المصنفة حسب الأهداف العلاجية القابلة للتحميل',
      },
    ],
  },
  {
    id: 'billing_vault',
    name_ar: 'الفوترة الطبية والخزينة والأرشيف السريري',
    name_fr: 'Facturation Médicale & Coffre-Fort',
    icon: Receipt,
    color: 'from-amber-600 to-yellow-700',
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    features: [
      {
        key: 'billing_medical_invoices',
        name_ar: 'إدارة الفواتير ووصولات الأتعاب الطبية الرسمية',
        desc_ar: 'إصدار وصولات الاستشارات والعلاجات الفردية والجماعية مع رمز QR',
      },
      {
        key: 'billing_insurance_slips',
        name_ar: 'استمارات التعويض للضمان الاجتماعي وشركات التأمين',
        desc_ar: 'قوالب مطابقة للتعويضات التأمينية واسترداد مصاريف العلاج',
      },
      {
        key: 'voice_recordings_vault',
        name_ar: 'خزانة الأرشيف الصوتي وعينات تسجيل نطق المريض',
        desc_ar: 'تسجيل وحفظ آمن لعينات النطق لمقارنة التطور الصوتي قبل وبعد',
      },
      {
        key: 'clinical_documents_export',
        name_ar: 'تصدير السجلات الطبية والتقارير بصيغة PDF و Excel',
        desc_ar: 'تصدير كامل ومؤمن لبيانات المريض والحصائل بضغطة زر واحدة',
      },
    ],
  },
  {
    id: 'ai_studio',
    name_ar: 'الذكاء الاصطناعي السريري والإنتاج المتطور',
    name_fr: 'Studio IA Clinique & Copilot',
    icon: Sparkles,
    color: 'from-violet-600 to-purple-800',
    badgeColor: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
    features: [
      {
        key: 'ai_copilot_assistant',
        name_ar: 'المساعد السريري الذكي ومحلل السلوكيات والأنماط',
        desc_ar: 'اقتراحات إكلينيكية متقدمة مدعومة بنماذج الذكاء الاصطناعي',
      },
      {
        key: 'ai_voice_scribe',
        name_ar: 'المفرغ الصوتي الذكي وتحويل الحديث المباشر إلى SOAP',
        desc_ar: 'تسجيل الجلسة وتحويل الكلام المسموع إلى ملاحظات مصنفة فوراً',
      },
      {
        key: 'ai_pecs_image_studio',
        name_ar: 'استوديو توليد بطاقات PECS والوسائل البصرية العلاجية',
        desc_ar: 'توليد بطاقات تواصل بديل مخصصة بالذكاء الاصطناعي التوليدي',
      },
      {
        key: 'ai_podcast_studio',
        name_ar: 'استوديو البودكاست والإذاعة التثقيفية متعددة الأصوات',
        desc_ar: 'إنتاج حلقات صوتية تثقيفية موجهة لأولياء الأمور والمجتمع',
      },
      {
        key: 'ai_video_modeling',
        name_ar: 'استوديو فيديوهات النمذجة البصرية والقصص الاجتماعية',
        desc_ar: 'صناعة مقاطع فيديو لتدريب أطفال طيف التوحد على المهارات الاجتماعية',
      },
      {
        key: 'ai_receptionist_bot',
        name_ar: 'موظف الاستقبال الذكي والمحادثة الآلية على مدار الساعة',
        desc_ar: 'الرد التلقائي على استفسارات الزوار وحجز المواعيد المبدئية',
      },
    ],
  },
  {
    id: 'agenda',
    name_ar: 'إدارة الأجندة والمواعيد المتقدمة',
    name_fr: 'Agenda Intelligent & Rendez-vous',
    icon: Calendar,
    color: 'from-indigo-600 to-blue-700',
    badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    features: [
      {
        key: 'agenda_multi_views',
        name_ar: 'زوايا العرض الأربع (بالساعة، شبكة الأسبوع، التقويم، القائمة)',
        desc_ar: 'تنظيم مرن لأوقات الحصص ومتابعة جدول دوام كافة المعالجين بالعيادة',
      },
      {
        key: 'agenda_conflict_detection',
        name_ar: 'الكشف التلقائي عن تضارب المواعيد والقاعات الإكلينيكية',
        desc_ar: 'منع الحجز المزدوج لنفس المعالج أو القاعة وتنبيه فوري',
      },
      {
        key: 'agenda_recurring_sessions',
        name_ar: 'جدولة الحصص المتكررة أسبوعياً تلقائياً',
        desc_ar: 'تثبيت مواعيد الجلسات الدورية لعدة أشهر بضغطة زر واحدة',
      },
      {
        key: 'agenda_whatsapp_reminders',
        name_ar: 'التذكير التلقائي بالمواعيد عبر رسائل WhatsApp الرسمية',
        desc_ar: 'إرسال إشعار تذكيري مسبق لتقليل نسب التغيب عن الحصص',
      },
    ],
  },
  {
    id: 'enterprise',
    name_ar: 'الأمان والنطاقات المخصصة والسيادة',
    name_fr: 'Sécurité Entreprise & Domaine Dédié',
    icon: ShieldCheck,
    color: 'from-slate-700 to-slate-900',
    badgeColor: 'bg-slate-700/30 text-slate-300 border-slate-600',
    features: [
      {
        key: 'custom_domain_ssl',
        name_ar: 'ربط الدومين الخاص بالعيادة مع شهادة SSL تلقائية',
        desc_ar: 'استخدام نطاق ويب مستقل (مثال: clinic-name.com) باسم العيادة',
      },
      {
        key: 'audit_logs_tracking',
        name_ar: 'سجل التدقيق الجنائي لتتبع حركة الموظفين والعمليات',
        desc_ar: 'أرشفة موثقة لكافة عمليات الدخول وتعديل السجلات لحماية البيانات',
      },
      {
        key: 'vip_priority_support',
        name_ar: 'الدعم الفني المباشر ذو الأولوية القصوى على مدار 24/7',
        desc_ar: 'قناة اتصال مخصصة وسريعة مع فريق الدعم الهندسي للمنصة',
      },
      {
        key: 'automated_backups',
        name_ar: 'النسخ الاحتياطي التلقائي والمشفر لقاعدة بيانات العيادة',
        desc_ar: 'توليد نسخ احتياطية دورية لضمان عدم ضياع أي ملف طبي تحت أي ظرف',
      },
    ],
  },
];

// Presets Definition
export const ALL_FEATURE_KEYS = PLATFORM_DOMAINS_CATALOG.flatMap((d) => d.features.map((f) => f.key));

export const DEFAULT_FEATURES_ALL_TRUE = ALL_FEATURE_KEYS.reduce((acc, k) => {
  acc[k] = true;
  return acc;
}, {});

export const DEFAULT_FEATURES_ALL_FALSE = ALL_FEATURE_KEYS.reduce((acc, k) => {
  acc[k] = false;
  return acc;
}, {});

export const DEFAULT_FEATURES_PRO = {
  ...DEFAULT_FEATURES_ALL_TRUE,
  ai_video_modeling: false,
  custom_domain_ssl: true,
  vip_priority_support: true,
};

export const DEFAULT_FEATURES_STARTER = {
  ...DEFAULT_FEATURES_ALL_TRUE,
  teletherapy_video_rooms: false,
  interactive_whiteboard: false,
  kiosk_self_checkin: false,
  waiting_room_tv_queue: false,
  ai_podcast_studio: false,
  ai_video_modeling: false,
  custom_domain_ssl: false,
  vip_priority_support: false,
};

/**
 * Isolated child component for Plan Showcase Card
 */
function PlanShowcaseCard({ plan, onEdit, onToggleStatus, onDelete, onPreviewFeatures }) {
  const isFeatured = plan.is_featured;
  const isActive = plan.is_active;
  const clinicsCount = plan.clinics_count ?? 0;
  const planFeatures = plan.features || {};
  const enabledCount = ALL_FEATURE_KEYS.filter((k) => planFeatures[k]).length;
  const enabledPercent = Math.round((enabledCount / ALL_FEATURE_KEYS.length) * 100);

  const hasDiscount = Boolean(plan.is_discount_active && Number(plan.discount_percentage) > 0);
  const discountPercent = Number(plan.discount_percentage) || 0;
  const originalMonthly = Number(plan.price_monthly) || 0;
  const originalYearly = Number(plan.price_yearly) || 0;
  const discountedMonthly = Number(plan.discounted_price_monthly) || Math.round(originalMonthly * (1 - discountPercent / 100));
  const discountedYearly = Number(plan.discounted_price_yearly) || Math.round(originalYearly * (1 - discountPercent / 100));
  const monthlySavings = originalMonthly - discountedMonthly;

  const formatQuota = (val, unit = '') => {
    if (val === -1 || val === '-1') return 'غير محدود ∞';
    return `${Number(val).toLocaleString()} ${unit}`;
  };

  return (
    <div
      className={`rounded-3xl p-6 flex flex-col justify-between space-y-5 transition shadow-2xl relative ${
        isFeatured
          ? 'bg-gradient-to-b from-indigo-950/80 via-slate-900 to-slate-950 border-2 border-indigo-500 ring-4 ring-indigo-500/20'
          : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Badges Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isFeatured && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex items-center gap-1 shadow">
              <Star className="w-3 h-3 fill-current" />
              الأكثر طلباً
            </span>
          )}
          {hasDiscount && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white flex items-center gap-1 shadow-md animate-pulse">
              <Flame className="w-3 h-3" />
              <span>{plan.discount_badge || `تخفيض -${discountPercent}%`}</span>
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
          >
            {isActive ? 'نشطة 🟢' : 'معطلة 🔴'}
          </span>
        </div>

        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
          #{plan.sort_order}
        </span>
      </div>

      {/* Title & Pricing */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-black text-white">{plan.name_ar}</h3>
          {plan.name_fr && (
            <span className="text-[11px] font-mono text-indigo-400 block">{plan.name_fr}</span>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed min-h-[36px] line-clamp-2">
          {plan.description || 'باقة متكاملة لإدارة العيادات السريرية والفحوصات التأهيلية.'}
        </p>

        {/* Price Display */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
          {hasDiscount ? (
            <>
              <div className="flex items-center gap-2">
                <span className="line-through text-slate-500 text-xs font-mono">
                  {originalMonthly.toLocaleString()} دج
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono text-[10px] font-bold">
                  -{discountPercent}%
                </span>
              </div>
              <div className="flex items-baseline space-x-1 space-x-reverse">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {discountedMonthly.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-bold">دج / شهر</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono font-medium flex items-center justify-between pt-0.5 border-t border-slate-800/60">
                <span className="text-slate-400">سنوياً:</span>
                <div>
                  <span className="line-through text-slate-600 ml-1.5">{originalYearly.toLocaleString()}</span>
                  <span className="text-emerald-400 font-bold">{discountedYearly.toLocaleString()} دج</span>
                </div>
              </div>
              {monthlySavings > 0 && (
                <div className="text-[10px] text-teal-300 font-mono font-bold bg-teal-950/40 border border-teal-500/20 px-2 py-0.5 rounded-lg text-center">
                  وفرت {monthlySavings.toLocaleString()} دج شهرياً ✨
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-baseline space-x-1 space-x-reverse">
                <span className="text-2xl font-black text-white font-mono">
                  {originalMonthly.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-bold">دج / شهر</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-mono font-bold">
                {originalYearly.toLocaleString()} دج / سنوياً
              </div>
            </>
          )}

          {plan.trial_days > 0 && (
            <div className="text-[10px] text-amber-300/90 font-bold flex items-center gap-1 pt-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{plan.trial_days} يوم تجربة مجانية</span>
            </div>
          )}
        </div>
      </div>

      {/* Features Matrix Summary Widget */}
      <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>مصفوفة الميزات:</span>
          </span>
          <span className="font-mono font-bold text-indigo-300 text-[11px]">
            {enabledCount} / {ALL_FEATURE_KEYS.length} ({enabledPercent}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full transition-all duration-500"
            style={{ width: `${enabledPercent}%` }}
          />
        </div>

        <button
          type="button"
          onClick={() => onPreviewFeatures(plan)}
          className="w-full mt-1 py-1 px-2 text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition flex items-center justify-center gap-1"
        >
          <Eye className="w-3 h-3 text-indigo-400" />
          <span>معاينة تفاصيل الميزات الـ 40</span>
        </button>
      </div>

      {/* Quotas & Capacity Checklist */}
      <div className="space-y-2 text-xs border-t border-slate-800/80 pt-4 text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>سعة المرضى:</span>
          </span>
          <strong className="font-mono text-white">{formatQuota(plan.max_patients, 'مريض')}</strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>طاقم العمل:</span>
          </span>
          <strong className="font-mono text-white">{formatQuota(plan.max_staff, 'ممارسين')}</strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>تقارير SOAP (AI):</span>
          </span>
          <strong className="font-mono text-purple-300">{formatQuota(plan.ai_reports_limit, 'تقرير')}</strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-purple-400" />
            <span>تفريغ صوتي (AI):</span>
          </span>
          <strong className="font-mono text-purple-300">{formatQuota(plan.ai_transcribe_mins, 'دقيقة')}</strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>استوديو PECS:</span>
          </span>
          <strong className="font-mono text-purple-300">{formatQuota(plan.ai_images_limit, 'بطاقة')}</strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>نطاق مخصص SSL:</span>
          </span>
          <span className={plan.has_custom_domain ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
            {plan.has_custom_domain ? 'متاح ✓' : 'غير متوفر ✕'}
          </span>
        </div>
      </div>

      {/* Subscriber Clinics Counter Badge */}
      <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">العيادات المشتركة:</span>
        <span className="font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
          {clinicsCount} عيادة 🏥
        </span>
      </div>

      {/* Card Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="flex-1 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1 border border-indigo-500/30"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>تعديل وتحكم بالميزات</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleStatus(plan)}
          className={`p-2 rounded-xl border text-xs font-bold transition ${
            isActive
              ? 'bg-amber-500/10 hover:bg-amber-600 text-amber-300 hover:text-white border-amber-500/30'
              : 'bg-emerald-500/10 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30'
          }`}
          title={isActive ? 'تعطيل الباقة' : 'تفعيل الباقة'}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(plan)}
          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white transition border border-rose-500/30"
          title="حذف الباقة"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Isolated child component for each Feature Group inside Modal
 */
function DomainFeaturesBlock({ domain, featuresMap, onToggleFeature, onToggleDomainAll }) {
  const DomainIcon = domain.icon;
  const activeInDomainCount = domain.features.filter((f) => featuresMap?.[f.key]).length;
  const allInDomainEnabled = activeInDomainCount === domain.features.length;

  return (
    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3 shadow-md hover:border-slate-700 transition">
      {/* Domain Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <DomainIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">{domain.name_ar}</h4>
            <span className="text-[10px] text-slate-400 font-mono">{domain.name_fr}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-slate-400">
            {activeInDomainCount}/{domain.features.length} مفعل
          </span>
          <button
            type="button"
            onClick={() => onToggleDomainAll(domain.features, !allInDomainEnabled)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
              allInDomainEnabled
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            {allInDomainEnabled ? 'تعطيل القطاع' : 'تفعيل القطاع بالكامل'}
          </button>
        </div>
      </div>

      {/* Features List in this Domain */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {domain.features.map((feature) => (
          <div
            key={feature.key}
            onClick={() => onToggleFeature(feature.key)}
            className={`p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 select-none ${
              featuresMap?.[feature.key]
                ? 'bg-slate-900/90 border-purple-500/40 hover:border-purple-400 shadow-sm'
                : 'bg-slate-950 border-slate-800/80 opacity-60 hover:opacity-100 hover:border-slate-700'
            }`}
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-xs font-bold ${featuresMap?.[feature.key] ? 'text-white' : 'text-slate-400'}`}>
                  {feature.name_ar}
                </span>
                {feature.isCritical && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    رئيسي
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {feature.desc_ar}
              </p>
              <span className="text-[9px] font-mono text-slate-600 block">
                key: {feature.key}
              </span>
            </div>

            {/* Switch toggle control */}
            <div className="pt-0.5">
              <div
                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  featuresMap?.[feature.key] ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    featuresMap?.[feature.key] ? '-translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Isolated child component for Preview Modal Domain Row
 */
function PreviewDomainBlock({ domain, featuresMap }) {
  const DomainIcon = domain.icon;

  return (
    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5">
      <div className="flex items-center space-x-2 space-x-reverse text-slate-300 font-bold border-b border-slate-900 pb-1.5">
        <DomainIcon className="w-4 h-4 text-purple-400" />
        <span>{domain.name_ar}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {domain.features.map((f) => (
          <div
            key={f.key}
            className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
              featuresMap[f.key]
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                : 'bg-slate-900/50 border-slate-800/50 text-slate-500'
            }`}
          >
            <span className="font-medium text-[11px] truncate">{f.name_ar}</span>
            <span className="shrink-0 text-xs font-bold">
              {featuresMap[f.key] ? '✓ مفعلة' : '✕ معطلة'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SubscriptionPlansManagerView() {
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Feature Matrix Filters inside Modal
  const [featureSearchQuery, setFeatureSearchQuery] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState('all');

  // Preview Features Modal for Plan Card
  const [previewPlan, setPreviewPlan] = useState(null);

  const initialFormState = {
    name_ar: '',
    name_fr: '',
    slug: '',
    description: '',
    price_monthly: 4900,
    price_yearly: 49000,
    currency: 'DZD',
    discount_percentage: 0,
    discount_badge: '',
    is_discount_active: false,
    discount_ends_at: '',
    trial_days: 14,
    max_patients: 250,
    max_staff: 3,
    ai_reports_limit: 60,
    ai_transcribe_mins: 90,
    ai_images_limit: 50,
    ai_podcasts_limit: 5,
    ai_videos_limit: 2,
    has_custom_domain: false,
    has_priority_support: false,
    is_featured: false,
    is_active: true,
    sort_order: 1,
    features: { ...DEFAULT_FEATURES_PRO },
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formSection, setFormSection] = useState('general'); // 'general' | 'quotas' | 'features' | 'ai'

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await subscriptionPlansApi.getPlans();
      if (res && res.plans) {
        setPlans(res.plans);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load subscription plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      ...initialFormState,
      features: { ...DEFAULT_FEATURES_PRO },
      sort_order: plans.length + 1,
    });
    setFormSection('general');
    setFeatureSearchQuery('');
    setSelectedDomainFilter('all');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    const planFeatures = plan.features && typeof plan.features === 'object'
      ? { ...DEFAULT_FEATURES_PRO, ...plan.features }
      : { ...DEFAULT_FEATURES_PRO };

    setFormData({
      name_ar: plan.name_ar || '',
      name_fr: plan.name_fr || '',
      slug: plan.slug || '',
      description: plan.description || '',
      price_monthly: plan.price_monthly ?? 0,
      price_yearly: plan.price_yearly ?? 0,
      currency: plan.currency || 'DZD',
      discount_percentage: plan.discount_percentage ?? 0,
      discount_badge: plan.discount_badge || '',
      is_discount_active: plan.is_discount_active ?? false,
      discount_ends_at: plan.discount_ends_at ? String(plan.discount_ends_at).substring(0, 10) : '',
      trial_days: plan.trial_days ?? 14,
      max_patients: plan.max_patients ?? 500,
      max_staff: plan.max_staff ?? 5,
      ai_reports_limit: plan.ai_reports_limit ?? 100,
      ai_transcribe_mins: plan.ai_transcribe_mins ?? 120,
      ai_images_limit: plan.ai_images_limit ?? 50,
      ai_podcasts_limit: plan.ai_podcasts_limit ?? 5,
      ai_videos_limit: plan.ai_videos_limit ?? 0,
      has_custom_domain: plan.has_custom_domain ?? false,
      has_priority_support: plan.has_priority_support ?? false,
      is_featured: plan.is_featured ?? false,
      is_active: plan.is_active ?? true,
      sort_order: plan.sort_order ?? 0,
      features: planFeatures,
    });
    setFormSection('general');
    setFeatureSearchQuery('');
    setSelectedDomainFilter('all');
    setIsModalOpen(true);
  };

  const handleToggleFeature = (featureKey) => {
    setFormData((prev) => {
      const currentFeatures = prev.features || {};
      return {
        ...prev,
        features: {
          ...currentFeatures,
          [featureKey]: !currentFeatures[featureKey],
        },
      };
    });
  };

  const handleToggleDomainAll = (domainFeatures, shouldEnable) => {
    setFormData((prev) => {
      const updated = { ...(prev.features || {}) };
      domainFeatures.forEach((f) => {
        updated[f.key] = shouldEnable;
      });
      return { ...prev, features: updated };
    });
  };

  const handleApplyPreset = (presetKey) => {
    if (presetKey === 'all_true') {
      setFormData((prev) => ({ ...prev, features: { ...DEFAULT_FEATURES_ALL_TRUE } }));
    } else if (presetKey === 'all_false') {
      setFormData((prev) => ({ ...prev, features: { ...DEFAULT_FEATURES_ALL_FALSE } }));
    } else if (presetKey === 'starter') {
      setFormData((prev) => ({ ...prev, features: { ...DEFAULT_FEATURES_STARTER } }));
    } else if (presetKey === 'pro') {
      setFormData((prev) => ({ ...prev, features: { ...DEFAULT_FEATURES_PRO } }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      if (editingPlan) {
        const res = await subscriptionPlansApi.updatePlan(editingPlan.id, formData);
        setFeedback({ type: 'success', text: res.message || 'تم تحديث الباقة بنجاح!' });
      } else {
        const res = await subscriptionPlansApi.createPlan(formData);
        setFeedback({ type: 'success', text: res.message || 'تم إنشاء باقة الاشتراك بنجاح!' });
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      console.error('Plan save error:', err);
      setFeedback({ type: 'error', text: err.response?.data?.message || err.message || 'تعذر حفظ الباقة.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      const res = await subscriptionPlansApi.togglePlanStatus(plan.id);
      setFeedback({ type: 'success', text: res.message || 'تم تعديل حالة الباقة.' });
      fetchPlans();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تغيير الحالة.' });
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف باقة "${plan.name_ar}"؟`)) {
      return;
    }
    try {
      const res = await subscriptionPlansApi.deletePlan(plan.id);
      setFeedback({ type: 'success', text: res.message || 'تم حذف الباقة بنجاح.' });
      fetchPlans();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || err.message || 'تعذر حذف الباقة.' });
    }
  };

  // Helper calculation for active features inside modal
  const activeFeaturesInFormCount = ALL_FEATURE_KEYS.filter((k) => formData.features?.[k]).length;
  const featuresPercentageInForm = Math.round((activeFeaturesInFormCount / ALL_FEATURE_KEYS.length) * 100);

  // Filtered domains inside Feature Matrix tab computed outside JSX
  const lowerSearch = featureSearchQuery.trim().toLowerCase();
  const visibleDomains = PLATFORM_DOMAINS_CATALOG.filter((domain) => {
    if (selectedDomainFilter !== 'all' && domain.id !== selectedDomainFilter) {
      return false;
    }
    if (!lowerSearch) return true;
    const matchesDomain = domain.name_ar.toLowerCase().includes(lowerSearch) || domain.name_fr.toLowerCase().includes(lowerSearch);
    const matchesAnyFeature = domain.features.some(
      (f) => f.name_ar.toLowerCase().includes(lowerSearch) || f.desc_ar.toLowerCase().includes(lowerSearch) || f.key.toLowerCase().includes(lowerSearch)
    );
    return matchesDomain || matchesAnyFeature;
  }).map((domain) => {
    if (!lowerSearch) return domain;
    const filteredFeatures = domain.features.filter(
      (f) => f.name_ar.toLowerCase().includes(lowerSearch) || f.desc_ar.toLowerCase().includes(lowerSearch) || f.key.toLowerCase().includes(lowerSearch)
    );
    return { ...domain, features: filteredFeatures };
  });

  // Discount calculations for the modal form preview
  const formDiscountPercent = Number(formData.discount_percentage) || 0;
  const formHasDiscount = Boolean(formData.is_discount_active && formDiscountPercent > 0);
  const formBaseMonthly = Number(formData.price_monthly) || 0;
  const formBaseYearly = Number(formData.price_yearly) || 0;
  const formDiscountedMonthly = Math.round(formBaseMonthly * (1 - formDiscountPercent / 100));
  const formDiscountedYearly = Math.round(formBaseYearly * (1 - formDiscountPercent / 100));
  const formMonthlySavings = formBaseMonthly - formDiscountedMonthly;
  const formYearlySavings = formBaseYearly - formDiscountedYearly;

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-950 border border-purple-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-purple-400" />
                <span>DYNAMIC PRICING & SUBSCRIPTION TIERS STUDIO</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {plans.length} باقات مهيأة 🪙
              </span>
              <span className="text-xs font-mono text-indigo-300 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-400" />
                <span>40 ميزة إكلينيكية وتقنية قابلة للتحكم الكامل</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              إدارة باقات وخطط الاشتراك والأسعار (Pricing Studio)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
              التحكم الشامل في أسعار الباقات بالدينار الجزائري (DZD)، حصص المرضى والممارسين، وتفعيل أو تعطيل أي ميزة من ميزات المنصة الإكلينيكية الـ 40 (قمرة الجلسة، الروائز الـ 18، التطبيب عن بعد، بورن الانتظار، البوابة، التخاطب، الحصائل، والذكاء الاصطناعي).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={fetchPlans}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-xl shadow-purple-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء باقة اشتراك جديدة</span>
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {feedback.text}
          </span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">إجمالي الباقات</div>
            <div className="text-2xl font-black text-white font-mono">{stats?.total_plans ?? plans.length}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">باقات نشطة للاشتراك</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {stats?.active_plans ?? plans.filter((p) => p.is_active).length}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">عيادات مشتركة بالباقات</div>
            <div className="text-2xl font-black text-indigo-300 font-mono">
              {stats?.total_subscribed_clinics ?? '--'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">مصفوفة ميزات المنصة</div>
            <div className="text-2xl font-black text-amber-300 font-mono">40 ميزة</div>
          </div>
        </div>
      </div>

      {/* Plans Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {plans.map((plan) => (
          <PlanShowcaseCard
            key={plan.id}
            plan={plan}
            onEdit={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onPreviewFeatures={setPreviewPlan}
          />
        ))}
      </div>

      {/* Plan Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative text-right max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPlan ? `تعديل باقة: ${editingPlan.name_ar}` : 'إنشاء باقة اشتراك جديدة'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Dynamic Subscription & Features Studio</span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section Tabs inside modal */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              {[
                { id: 'general', label: '1. المعلومات والأسعار' },
                { id: 'quotas', label: '2. سعة المرضى والموارد' },
                { id: 'features', label: '3. مصفوفة ميزات المنصة (40 ميزة) ⭐' },
                { id: 'ai', label: '4. حصص واستوديو الـ AI' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormSection(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                    formSection === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'features' && (
                    <span className="px-1.5 py-0.2 rounded-md bg-purple-950/80 border border-purple-400/40 text-[10px] text-purple-200">
                      {activeFeaturesInFormCount}/{ALL_FEATURE_KEYS.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs flex-1 overflow-y-auto pr-1 pl-1">
              {/* SECTION 1: General & Pricing */}
              {formSection === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">اسم الباقة (بالعربية):</label>
                      <input
                        type="text"
                        required
                        value={formData.name_ar}
                        onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                        placeholder="الباقة الاحترافية Pro AI"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">اسم الباقة (بالفرنسية):</label>
                      <input
                        type="text"
                        value={formData.name_fr}
                        onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                        placeholder="Pack Clinique Pro AI"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">المعرف الفريد (Slug):</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="pro-ai"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">السعر الشهري (دج):</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.price_monthly}
                        onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">السعر السنوي (دج):</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.price_yearly}
                        onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">مدة الفترة التجريبية (بالأيام):</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.trial_days}
                        onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">ترتيب العرض (Sort Order):</label>
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">الوصف التعريفي للباقة:</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="وصف تسويقي يوضح الفئة المستهدفة وميزات الباقة..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-purple-500 leading-relaxed"
                    />
                  </div>

                  {/* Badges Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <span className="text-slate-200 font-bold">⭐ تمييز كـ "الأكثر طلباً" (Featured)</span>
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-slate-700"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <span className="text-slate-200 font-bold">🟢 تفعيل الباقة للاشتراك المباشر</span>
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-slate-700"
                      />
                    </label>
                  </div>

                  {/* Dedicated Percentage Discount & Promotion Box */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/30 border border-indigo-500/30 shadow-xl space-y-4">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
                          <Percent className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <span>محرك التخفيضات والعروض الترويجية المئوية</span>
                            {formHasDiscount && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white font-mono animate-pulse">
                                -{formDiscountPercent}% نشط
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            تطبيق تخفيض بنسبة مئوية يظهر تلقائياً في الصفحة الرئيسية مع شطب السعر الأصلي.
                          </p>
                        </div>
                      </div>

                      {/* Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_discount_active}
                          onChange={(e) => setFormData({ ...formData, is_discount_active: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-rose-500 peer-checked:to-amber-500"></div>
                        <span className="mr-2 text-xs font-bold text-slate-300">
                          {formData.is_discount_active ? 'التخفيض مفعل 🟢' : 'التخفيض معطل ⚪'}
                        </span>
                      </label>
                    </div>

                    {formData.is_discount_active && (
                      <div className="space-y-4 pt-1">
                        {/* Percentage Input and Quick Presets */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-amber-400" />
                              <span>نسبة التخفيض المئوية (%):</span>
                            </label>
                            <span className="text-[11px] font-mono text-amber-400 font-bold">
                              خصم {formDiscountPercent}% على الباقة
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                min="1"
                                max="99"
                                value={formData.discount_percentage}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  discount_percentage: Math.min(99, Math.max(0, parseFloat(e.target.value) || 0))
                                })}
                                placeholder="مثلاً: 25"
                                className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-2.5 px-4 text-white font-mono text-lg font-black focus:outline-none focus:border-amber-500"
                              />
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">
                                %
                              </span>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {[10, 20, 25, 30, 50, 70].map((pct) => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, discount_percentage: pct })}
                                  className={`px-2.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                                    Number(formData.discount_percentage) === pct
                                      ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md'
                                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Promo Badge Input and Suggestions */}
                        <div className="space-y-2">
                          <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-rose-400" />
                            <span>شارة العرض الترويجي (Badge Text):</span>
                          </label>
                          <input
                            type="text"
                            value={formData.discount_badge}
                            onChange={(e) => setFormData({ ...formData, discount_badge: e.target.value })}
                            placeholder="مثال: 🔥 تخفيض حصري لفترة محدودة -25%"
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-[10px] text-slate-400 font-bold">اقتراحات سريعة:</span>
                            {[
                              `🔥 تخفيض حصري -${formData.discount_percentage || 20}%`,
                              '⚡ عرض محدود لفترة قصيرة',
                              '🎉 تخفيض الإطلاق والافتتاح',
                              '⭐ خصم العودة للموسم العيادي'
                            ].map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => setFormData({ ...formData, discount_badge: sug })}
                                className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:text-white transition"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Expiration Date Input (Optional) */}
                        <div className="space-y-1">
                          <label className="text-xs text-slate-300 font-bold">
                            تاريخ انتهاء سريان التخفيض (اختياري):
                          </label>
                          <input
                            type="date"
                            value={formData.discount_ends_at}
                            onChange={(e) => setFormData({ ...formData, discount_ends_at: e.target.value })}
                            className="w-full sm:w-1/2 bg-slate-950 border border-slate-700 rounded-2xl p-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Live Price Calculation Comparison Widget */}
                        <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-2">
                          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>معاينة الأسعار الحية للعيادة في الصفحة الرئيسية بعد الخصم:</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Monthly */}
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                              <div className="text-[11px] text-slate-400 font-bold">الاشتراك الشهري:</div>
                              <div className="flex items-center gap-2">
                                <span className="line-through text-slate-500 font-mono text-xs">
                                  {formBaseMonthly.toLocaleString()} دج
                                </span>
                                <span className="text-emerald-400 font-black font-mono text-lg">
                                  {formDiscountedMonthly.toLocaleString()} دج / شهر
                                </span>
                              </div>
                              <div className="text-[10px] text-teal-300 font-mono">
                                توفير للعيادة: {formMonthlySavings.toLocaleString()} دج شهرياً
                              </div>
                            </div>

                            {/* Yearly */}
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                              <div className="text-[11px] text-slate-400 font-bold">الاشتراك السنوي:</div>
                              <div className="flex items-center gap-2">
                                <span className="line-through text-slate-500 font-mono text-xs">
                                  {formBaseYearly.toLocaleString()} دج
                                </span>
                                <span className="text-emerald-400 font-black font-mono text-lg">
                                  {formDiscountedYearly.toLocaleString()} دج / سنة
                                </span>
                              </div>
                              <div className="text-[10px] text-teal-300 font-mono">
                                توفير للعيادة: {formYearlySavings.toLocaleString()} دج سنوياً
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 2: Quotas & Capacity */}
              {formSection === 'quotas' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
                    💡 <strong>ملاحظة:</strong> أدخل القيمة <code>-1</code> لجعل الحد <strong>غير محدود (Unlimited)</strong>.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">الحد الأقصى لملفات المرضى والأطفال:</label>
                      <input
                        type="number"
                        value={formData.max_patients}
                        onChange={(e) => setFormData({ ...formData, max_patients: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">الحد الأقصى لطاقم العمل والممارسين:</label>
                      <input
                        type="number"
                        value={formData.max_staff}
                        onChange={(e) => setFormData({ ...formData, max_staff: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <span className="text-slate-200 font-bold">🌐 إتاحة ربط الدومين المخصص (Custom Domain & SSL)</span>
                      <input
                        type="checkbox"
                        checked={formData.has_custom_domain}
                        onChange={(e) => setFormData({ ...formData, has_custom_domain: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-slate-700"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <span className="text-slate-200 font-bold">🛡️ دعم فني ذو أولوية 24/7 (VIP Priority Support)</span>
                      <input
                        type="checkbox"
                        checked={formData.has_priority_support}
                        onChange={(e) => setFormData({ ...formData, has_priority_support: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-slate-700"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* SECTION 3: PLATFORM FEATURES MATRIX */}
              {formSection === 'features' && (
                <div className="space-y-5">
                  {/* Top Bar: Counter & Quick Presets */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">حالة تفعيل ميزات المنصة للباقة:</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {activeFeaturesInFormCount} من أصل {ALL_FEATURE_KEYS.length} ميزة مفعلة ({featuresPercentageInForm}%)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          يمكنك النقر على أي ميزة لتشغيلها أو تعطيلها، أو استخدام الإعدادات المسبقة الجاهزة.
                        </p>
                      </div>

                      {/* Presets buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('all_true')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>تفعيل الكل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('all_false')}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <Square className="w-3 h-3" />
                          <span>تعطيل الكل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('starter')}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition"
                        >
                          باقة Starter
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('pro')}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold transition"
                        >
                          باقة Pro الذكية
                        </button>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 h-full transition-all duration-300"
                        style={{ width: `${featuresPercentageInForm}%` }}
                      />
                    </div>

                    {/* Search & Domain Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <div className="relative flex-1 w-full">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
                        <input
                          type="text"
                          value={featureSearchQuery}
                          onChange={(e) => setFeatureSearchQuery(e.target.value)}
                          placeholder="ابحث عن أي ميزة (مثال: SOAP, الروائز, التطبيب عن بعد, التلفاز, الواتساب...)"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <select
                        value={selectedDomainFilter}
                        onChange={(e) => setSelectedDomainFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 w-full sm:w-auto"
                      >
                        <option value="all">كافة القطاعات (10 قطاعات)</option>
                        {PLATFORM_DOMAINS_CATALOG.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name_ar}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Domains and Features Grid */}
                  <div className="space-y-4">
                    {visibleDomains.map((domain) => (
                      <DomainFeaturesBlock
                        key={domain.id}
                        domain={domain}
                        featuresMap={formData.features || {}}
                        onToggleFeature={handleToggleFeature}
                        onToggleDomainAll={handleToggleDomainAll}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: AI Quotas */}
              {formSection === 'ai' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">تقارير وحصائل SOAP السريرية (شهرياً):</label>
                      <input
                        type="number"
                        value={formData.ai_reports_limit}
                        onChange={(e) => setFormData({ ...formData, ai_reports_limit: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">دقائق التفريغ الصوتي والاستشارة الذكية:</label>
                      <input
                        type="number"
                        value={formData.ai_transcribe_mins}
                        onChange={(e) => setFormData({ ...formData, ai_transcribe_mins: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">بطاقات استوديو PECS والصور (شهرياً):</label>
                      <input
                        type="number"
                        value={formData.ai_images_limit}
                        onChange={(e) => setFormData({ ...formData, ai_images_limit: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">حلقات استوديو البودكاست الطبي:</label>
                      <input
                        type="number"
                        value={formData.ai_podcasts_limit}
                        onChange={(e) => setFormData({ ...formData, ai_podcasts_limit: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-slate-300 font-bold">فيديوهات النمذجة البصرية والسلوكية (Veo Video Studio):</label>
                      <input
                        type="number"
                        value={formData.ai_videos_limit}
                        onChange={(e) => setFormData({ ...formData, ai_videos_limit: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800 sticky bottom-0 bg-slate-900 pb-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black transition flex items-center justify-center gap-1.5 shadow-xl shadow-purple-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>{submitting ? 'جاري الحفظ...' : editingPlan ? 'حفظ وتثبيت تعديلات الباقة' : 'إنشاء الباقة وحفظ الميزات'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature Preview Modal for any Plan Card */}
      {previewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl relative text-right max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    مصفوفة ميزات: {previewPlan.name_ar}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {previewPlan.slug} • {previewPlan.price_monthly} دج/شهر
                  </span>
                </div>
              </div>

              <button
                onClick={() => setPreviewPlan(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1 text-xs">
              {PLATFORM_DOMAINS_CATALOG.map((domain) => (
                <PreviewDomainBlock
                  key={domain.id}
                  domain={domain}
                  featuresMap={previewPlan.features || {}}
                />
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => {
                  handleOpenEditModal(previewPlan);
                  setPreviewPlan(null);
                }}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>فتح محرر الميزات لهذه الباقة</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewPlan(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
