import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Brain,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Calendar,
  CreditCard,
  Layers,
  ArrowLeft,
  Activity,
  FileCode,
  Users,
  Building2,
  Zap,
  Lock,
  DownloadCloud,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  PhoneCall,
  Check,
  ChevronLeft,
  Clock,
  HeartHandshake,
  Stethoscope,
  Smile,
  Volume2,
  Play,
  Monitor,
  BarChart3,
  TrendingUp,
  MapPin,
  FileText,
  MessageCircle,
  Sliders,
  ExternalLink,
  Award,
  Radio,
  BookOpen
} from 'lucide-react';
import { subscriptionPlansApi, landingPageStudioApi, authApi } from '../../api';
import SpecialtyAssessmentFinderModal from './SpecialtyAssessmentFinderModal';
import FloatingClinicalAdvisor from './FloatingClinicalAdvisor';
import SpeechArticulationMatrixModal from '../orthophony/SpeechArticulationMatrixModal';
import AmbientClinicalScribeModal from '../sessions/AmbientClinicalScribeModal';

// Smart fallback plans in case API is offline or loading
const FALLBACK_PRICING_PLANS = [
  {
    id: 1,
    slug: 'starter',
    name_ar: 'الانطلاقة (Débutant / Starter)',
    badge: 'للأخصائي حديث التخرج والتأسيس 🚀',
    description: 'باقة اقتصادية خفيفة مصممة لإزالة أي عائق مالي في بداية ممارستك السريرية.',
    price_dzd_monthly: 2500,
    price_dzd_yearly: 25000,
    max_clinicians: 1,
    max_patients: 60,
    ai_reports_limit: 0,
    is_featured: false,
    features: {
      clinical_consultation_workspace: true,
      clinical_soap_notes: true,
      assessments_standardized_18: true,
      agenda_conflict_detection: true,
      ai_copilot_assistant: false,
      teletherapy_video_rooms: false,
      kiosk_self_checkin: false,
      parent_portal_access: false,
      security_custom_domain: false,
    },
  },
  {
    id: 2,
    slug: 'solo_starter',
    name_ar: 'الأخصائي الفردي (Cabinet Solo)',
    badge: 'الأكثر انتشاراً للعيادات ⚡',
    description: 'الحل المثالي للأخصائي المستقل الذي يدير عيادته الخاصة ويرغب في رقمنة شاملة.',
    price_dzd_monthly: 4500,
    price_dzd_yearly: 42000,
    max_clinicians: 1,
    max_patients: 250,
    ai_reports_limit: 50,
    is_featured: true,
    features: {
      clinical_consultation_workspace: true,
      clinical_soap_notes: true,
      assessments_standardized_18: true,
      agenda_conflict_detection: true,
      ai_copilot_assistant: true,
      teletherapy_video_rooms: true,
      kiosk_self_checkin: true,
      parent_portal_access: true,
      security_custom_domain: false,
    },
  },
  {
    id: 3,
    slug: 'duo',
    name_ar: 'العيادة المشتركة (Duo Partagé)',
    badge: 'قيمة استثنائية لأخصائيين 🤝',
    description: 'مصممة لأخصائيين يتقاسمان نفس المقر والاستقبال (أرطوفونيا + نفساني أو حركي).',
    price_dzd_monthly: 7500,
    price_dzd_yearly: 72000,
    max_clinicians: 2,
    max_patients: 1000,
    ai_reports_limit: 100,
    is_featured: false,
    features: {
      clinical_consultation_workspace: true,
      clinical_soap_notes: true,
      assessments_standardized_18: true,
      agenda_conflict_detection: true,
      ai_copilot_assistant: true,
      teletherapy_video_rooms: true,
      kiosk_self_checkin: true,
      parent_portal_access: true,
      security_custom_domain: false,
    },
  },
  {
    id: 4,
    slug: 'multi_pro',
    name_ar: 'المركز المتكامل (Centre Multi-Pro)',
    badge: 'الموصى به للمراكز والعيادات 🔥',
    description: 'المنظومة الاحترافية الأقوى للمراكز الطبية النفسية ومراكز التأهيل متعددة التخصصات.',
    price_dzd_monthly: 12500,
    price_dzd_yearly: 120000,
    max_clinicians: 8,
    max_patients: 1500,
    ai_reports_limit: 250,
    is_featured: true,
    features: {
      clinical_consultation_workspace: true,
      clinical_soap_notes: true,
      assessments_standardized_18: true,
      agenda_conflict_detection: true,
      ai_copilot_assistant: true,
      teletherapy_video_rooms: true,
      kiosk_self_checkin: true,
      parent_portal_access: true,
      security_custom_domain: true,
    },
  },
  {
    id: 5,
    slug: 'enterprise_dz',
    name_ar: 'المؤسسات والشبكات (Enterprise DZ)',
    badge: 'للمجمعات والجمعيات الكبرى 🏢',
    description: 'للمجمعات الكبرى، جمعيات التوحد الولائية والوطنية، والمراكز متعددة الفروع.',
    price_dzd_monthly: 22000,
    price_dzd_yearly: 210000,
    max_clinicians: 20,
    max_patients: 10000,
    ai_reports_limit: 500,
    is_featured: false,
    features: {
      clinical_consultation_workspace: true,
      clinical_soap_notes: true,
      assessments_standardized_18: true,
      agenda_conflict_detection: true,
      ai_copilot_assistant: true,
      teletherapy_video_rooms: true,
      kiosk_self_checkin: true,
      parent_portal_access: true,
      security_custom_domain: true,
    },
  },
];

// Default configuration for the landing page in case offline or initial render
const DEFAULT_LANDING_CONFIG = {
  appearance: {
    themeAccent: 'emerald',
    darkModeStyle: 'slate',
    ambientGlow: true,
    brandName: 'PsySnap',
    brandSuffix: '',
    countryBadge: 'DZ 🇩🇿',
    brandTagline: 'المنظومة الإكلينيكية والطبية السحابية',
    showFloatingAdvisor: true,
  },
  announcement: {
    enabled: false,
    badge: 'إعلان جديد 🚀',
    text: 'فترة تجريبية مجانية كاملة 14 يوماً لكافة عيادات ومراكز الأرطوفونيا والصحة النفسية في الجزائر!',
    link: '/register',
    linkText: 'سجّل عيادتك الآن',
  },
  hero: {
    badge: 'المنظومة السريرية الوطنية الأولى في الجزائر 🇩🇿',
    headline: 'المنصة السحابية المتكاملة لإدارة عيادات الأرطوفونيا والصحة النفسية',
    subtitle: 'رقمنة شاملة للملف الطبي، أكثر من 30 مقياساً مقنناً، مساعد سريري ذكي، وشاشة قاعة الانتظار في منصة واحدة آمنة.',
    primaryCtaText: 'ابدأ مجاناً (14 يوماً)',
    primaryCtaLink: '/register',
    secondaryCtaText: 'استكشف بنك المقاييس السريرية (30+)',
    secondaryCtaAction: 'open_finder',
    trustBullet1: 'بدون بطاقة بنكية',
    trustBullet2: '14 يوماً تجربة كاملة',
    trustBullet3: 'تشفير طبي AES-256',
    defaultHeroTab: 'assessments',
  },
  stats: {
    stat1: { value: '+120', label: 'عيادة ومركز معتمد' },
    stat2: { value: '+45 000', label: 'ملف مريض ومفحوص' },
    stat3: { value: '18', label: 'رائزاً ومقياساً مقنناً' },
    stat4: { value: '58', label: 'ولاية مغطاة وطنياً' },
  },
  sections: {
    features: true,
    assessments: true,
    specialties: true,
    ai_copilot: true,
    roi_calculator: true,
    pricing: true,
    payment_assurances: true,
    directory_cta: true,
    testimonials: true,
    faq: true,
    final_cta: true,
  },
  faqs: [
    {
      q: 'هل أحتاج لإدخال بطاقة بنكية أو دفع مسبق لبدء التجربة المجانية؟',
      a: 'لا، على الإطلاق! يمكنك التسجيل وإنشاء حساب عيادتك السحابية فوراً والبدء في استخدام كافة المقاييس والميزات لمدة 14 يوماً مجاناً بدون أي دفع مسبق وبدون بطاقة بنكية.',
    },
    {
      q: 'كيف تتم عملية تسديد الاشتراك بالدينار الجزائري بعد التجربة؟',
      a: 'نوفر طرق سداد محلية آمنة وميسرة تناسب الأخصائي الجزائري، تشمل تطبيق بريدي موب (BaridiMob) فورياً عبر مسح رمز QR أو تحويل RIP، الحساب البريدي الجاري (CCP)، أو التحويل البنكي المباشر مع استلام فاتورة تجارية B2B ووصل رسمي.',
    },
    {
      q: 'هل المقاييس المتوفرة في المنصة مقننة ومناسبة للبيئة الجزائرية؟',
      a: 'نعم! تضم المنصة أكثر من 30 مقياساً واختباراً مقنناً (مثل CARS-2, BDI-II, Conners-3, Dyslexia Suite, ELO-DZ, Alouette-R, WISC-V) مع جداول معايرة دقيقة ونقاط قطع (Cut-Offs) متوافقة مع البيئة المغاربية واللغتين العربية والفرنسية.',
    },
    {
      q: 'هل تعمل المنصة على الهواتف الذكية والأجهزة اللوحية (iPad/Tablets)؟',
      a: 'نعم بالكامل! المنصة مبنية بأحدث تقنيات الويب التقدمي (PWA) ومتجاوبة 100% مع أجهزة الحاسوب، الآيباد، التابلت، وهواتف الأندرويد والآيفون، مع إمكانية تثبيت أيقونة التطبيق على شاشة جهازك كبرنامج أصلي.',
    },
    {
      q: 'ما مدى سرية وأمان بيانات المرضى والملفات السريرية؟',
      a: 'نولي السرية الطبية الأولوية المطلقة: تخضع جميع البيانات لتشفير طبي بمستوى البنوك (AES-256) مع عزل تام لكل عيادة (Multi-Tenant Isolation) ونسخ احتياطي سحابي يومي آلي مشفر وفق قانون السر المهني وأخلاقيات الممارسة الطبية.',
    },
    {
      q: 'هل يمكنني تصدير الحصائل والتقارير الطبية بصيغة PDF قابلة للطباعة؟',
      a: 'نعم، المنصة تتيح توليد تقارير الحصيلة الأولية (Bilan Initial)، الحصيلة المرحلية، والتقارير الموجهة للأولياء أو الأطباء الموجهين بصيغة PDF مصممة باحترافية وتضم ترويسة عيادتك وخاتمك الرسمي ورسوماً بيانية توضيحية.',
    },
  ],
  testimonials: [
    {
      name: 'د. سارة بلقاسم',
      role: 'أخصائية أرطوفونيا وعلاج اضطرابات النطق',
      wilaya: 'الجزائر العاصمة',
      quote: 'منصة PsySnap اختصرت عليّ أكثر من 60% من وقت كتابة الحصائل الأرطوفونية والتقارير الطبية. المقاييس المقننة مثل ELO و Alouette أصبحت سهلة التمرير والنتائج فورية ومتقنة.',
      rating: 5,
    },
    {
      name: 'أ. كريم منصوري',
      role: 'أخصائي نفسي عيادي ومدير مركز تأهيل',
      wilaya: 'وهران',
      quote: 'إدارة ملفات المرضى وجدول المواعيد بالعيادة أصبحت رقمية 100%. أولياء الأمور معجبون جداً ببورن الانتظار وشاشة التلفاز الذكية وبوابة متابعة التمارين المنزلية.',
      rating: 5,
    },
    {
      name: 'د. فريال حداد',
      role: 'أخصائية في إعادة التأهيل الحركي والنفسي',
      wilaya: 'قسنطينة',
      quote: 'تتبع خطة التأهيل الحركي وقياس التطور والرسوم البيانية للحصائل أعطى عيادتنا طابعاً احترافياً فائقاً. الدعم الفني الجزائري متواجد وممتاز وطرق الدفع بـ BaridiMob مريحة جداً.',
      rating: 5,
    },
  ],
  footer: {
    supportPhone: '+213 550 12 34 56',
    supportEmail: 'contact@psypro.tech',
    whatsapp: '+213550123456',
    address: 'الجزائر العاصمة، الجزائر',
    copyright: 'جميع الحقوق محفوظة لمنصة PsySnap الطبية © 2026',
    socialFacebook: 'https://facebook.com/psypro.tech',
    socialLinkedIn: 'https://linkedin.com/company/psypro-tech',
    socialInstagram: 'https://instagram.com/psypro.tech',
    socialYoutube: '',
  },
};

function getThemeClasses(themeAccent) {
  switch (themeAccent) {
    case 'teal':
      return {
        brandGradient: 'from-teal-600 via-cyan-600 to-emerald-500',
        brandHoverGradient: 'hover:from-teal-500 hover:to-cyan-400',
        brandColor: 'text-teal-400',
        brandBg: 'bg-teal-500',
        brandBorder: 'border-teal-500',
        brandShadow: 'shadow-teal-500/25',
        brandBadge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        selectionBg: 'selection:bg-teal-500',
      };
    case 'indigo':
      return {
        brandGradient: 'from-indigo-600 via-blue-600 to-teal-500',
        brandHoverGradient: 'hover:from-indigo-500 hover:to-teal-400',
        brandColor: 'text-indigo-400',
        brandBg: 'bg-indigo-600',
        brandBorder: 'border-indigo-500',
        brandShadow: 'shadow-indigo-500/25',
        brandBadge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        selectionBg: 'selection:bg-indigo-500',
      };
    case 'violet':
      return {
        brandGradient: 'from-purple-600 via-indigo-600 to-pink-500',
        brandHoverGradient: 'hover:from-purple-500 hover:to-pink-400',
        brandColor: 'text-purple-400',
        brandBg: 'bg-purple-600',
        brandBorder: 'border-purple-500',
        brandShadow: 'shadow-purple-500/25',
        brandBadge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        selectionBg: 'selection:bg-purple-500',
      };
    case 'cyan':
      return {
        brandGradient: 'from-cyan-600 via-sky-600 to-blue-500',
        brandHoverGradient: 'hover:from-cyan-500 hover:to-sky-400',
        brandColor: 'text-cyan-400',
        brandBg: 'bg-cyan-500',
        brandBorder: 'border-cyan-500',
        brandShadow: 'shadow-cyan-500/25',
        brandBadge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        selectionBg: 'selection:bg-cyan-500',
      };
    case 'amber':
      return {
        brandGradient: 'from-amber-600 via-orange-600 to-rose-500',
        brandHoverGradient: 'hover:from-amber-500 hover:to-orange-400',
        brandColor: 'text-amber-400',
        brandBg: 'bg-amber-500',
        brandBorder: 'border-amber-500',
        brandShadow: 'shadow-amber-500/25',
        brandBadge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        selectionBg: 'selection:bg-amber-500',
      };
    case 'emerald':
    default:
      return {
        brandGradient: 'from-brand-600 via-indigo-600 to-teal-500',
        brandHoverGradient: 'hover:from-brand-500 hover:to-teal-400',
        brandColor: 'text-brand-400',
        brandBg: 'bg-brand-500',
        brandBorder: 'border-brand-500',
        brandShadow: 'shadow-brand-500/25',
        brandBadge: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
        selectionBg: 'selection:bg-brand-500',
      };
  }
}

// Curated prominent features displayed on the pricing cards
const PROMINENT_CARD_FEATURES = [
  { key: 'clinical_consultation_workspace', label: 'قمرة الجلسة الموجهة (مسار الخطوات الـ 4)' },
  { key: 'clinical_soap_notes', label: 'التوثيق الطبي المنهجي الذكي (SOAP Notes)' },
  { key: 'assessments_standardized_18', label: 'بنك الروائز المقننة الـ 18 وحصائل PDF' },
  { key: 'agenda_conflict_detection', label: 'إدارة المواعيد وتنبيهات WhatsApp' },
  { key: 'ai_copilot_assistant', label: 'المساعد السريري بالذكاء الاصطناعي' },
  { key: 'teletherapy_video_rooms', label: 'الاستشارات المرئية والتطبيب عن بعد' },
  { key: 'kiosk_self_checkin', label: 'شاشة قاعة الانتظار والتلفاز الذكي (TV)' },
  { key: 'parent_portal_access', label: 'بوابة أولياء الأمور والمتابعة المنزلية' },
  { key: 'security_custom_domain', label: 'نطاق خاص مشفر للعيادة (Custom Domain)' },
];

function formatDzd(val) {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const num = Math.round(Number(val));
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function getPlanPricingMeta(plan) {
  const isSolo = plan.slug === 'solo' || plan.slug === 'solo_starter' || plan.id === 'solo';
  const isMultiPro = plan.slug === 'multi_pro' || plan.id === 'multi_pro';
  const isEnterprise = plan.slug === 'enterprise' || plan.slug === 'enterprise_dz' || plan.id === 'enterprise';
  const isStarter = plan.slug === 'starter' || plan.id === 'starter';
  const isDuo = plan.slug === 'duo' || plan.id === 'duo';

  const badge = plan.badge || (
    isStarter ? 'حديث التخرج والتأسيس 🚀' :
    isSolo ? 'الأكثر طلباً للعيادات ⚡' :
    isDuo ? 'قيمة استثنائية لأخصائيين 🤝' :
    isMultiPro ? 'الموصى به للمراكز 🔥' :
    'للمجمعات الكبرى والشبكات 🏢'
  );

  const isPopular = Boolean(plan.is_featured) || isSolo || isMultiPro;
  const popularTag = isSolo ? 'الأكثر طلباً للعيادات ⚡' : isMultiPro ? 'الموصى به للمراكز 🔥' : 'ميزة استثنائية ✨';
  const ctaText = isEnterprise ? 'تواصل لحجز باقة المؤسسات' : 'ابدأ مجاناً (14 يوماً)';

  const clinCount = plan.max_clinicians || 1;
  const clinLabel = clinCount === 1 ? 'أخصائي سريري واحد' : clinCount >= 20 ? 'أخصائيين غير محدودين' : `${clinCount} أخصائيين`;

  const patCount = plan.max_patients || 60;
  const patLabel = patCount >= 9999 ? 'ملفات مرضى غير محدودة' : `حتى ${formatDzd(patCount)} مريض`;

  const aiLimit = plan.ai_reports_limit !== undefined ? plan.ai_reports_limit : 50;
  const aiLabel = aiLimit > 0 ? `${aiLimit} تقرير ذكاء/شهر` : 'بدون حصة ذكاء';

  return {
    badge,
    isPopular,
    popularTag,
    ctaText,
    clinLabel,
    patLabel,
    aiLabel,
    isEnterprise,
  };
}

// Standalone Plan Pricing Card
function PlanPricingCard({ plan, billingCycle, onSelectPlan }) {
  const meta = getPlanPricingMeta(plan);

  const monthlyPriceNum = parseFloat(plan.price_dzd_monthly || plan.price_monthly) || 0;
  const yearlyPriceNum = parseFloat(plan.price_dzd_yearly || plan.price_yearly) || (monthlyPriceNum * 10);

  const hasDiscount = Boolean(plan.is_discount_active && Number(plan.discount_percentage) > 0);
  const discountPercent = Number(plan.discount_percentage) || 0;
  const discountedMonthlyNum = Math.round(monthlyPriceNum * (1 - discountPercent / 100));
  const discountedYearlyNum = Math.round(yearlyPriceNum * (1 - discountPercent / 100));

  const effectiveMonthly = hasDiscount ? discountedMonthlyNum : monthlyPriceNum;
  const effectiveYearly = hasDiscount ? discountedYearlyNum : yearlyPriceNum;

  const monthlyDisplay = formatDzd(monthlyPriceNum) + ' DZD';
  const yearlyDisplay = formatDzd(yearlyPriceNum) + ' DZD';
  const discountedMonthlyDisplay = formatDzd(discountedMonthlyNum) + ' DZD';
  const discountedYearlyDisplay = formatDzd(discountedYearlyNum) + ' DZD';

  const yearlyEquivDisplay = formatDzd(Math.round(effectiveYearly / 12)) + ' DZD/شهر';

  const annualSavings = (effectiveMonthly * 12) - effectiveYearly;
  const savingsDisplay = annualSavings > 0 ? `وفر ${formatDzd(annualSavings)} دج سنوياً` : 'خصم سنوي خاص';

  const monthlySavingsAmount = monthlyPriceNum - discountedMonthlyNum;
  const yearlySavingsAmount = yearlyPriceNum - discountedYearlyNum;

  const planFeatures = plan.features || {};
  const activeFeaturesCount = Object.values(planFeatures).filter(Boolean).length;

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-5 transition-all duration-300 relative ${
        meta.isPopular
          ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/40 border-2 border-brand-500 shadow-2xl shadow-brand-500/15 lg:-translate-y-2'
          : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
      }`}
    >
      {meta.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-brand-500 to-teal-400 text-slate-950 font-black text-[9px] shadow-lg whitespace-nowrap">
          {meta.popularTag}
        </div>
      )}

      <div className="space-y-3.5">
        {hasDiscount && (
          <div className="p-2 rounded-2xl bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-amber-500/20 border border-rose-500/40 text-rose-300 text-xs font-black flex items-center justify-between shadow-sm animate-pulse">
            <span className="flex items-center gap-1.5 truncate">
              <span>🔥</span>
              <span className="truncate">{plan.discount_badge || 'تخفيض حصري لفترة محدودة'}</span>
            </span>
            <span className="bg-rose-500 text-white text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 font-black">
              -{discountPercent}%
            </span>
          </div>
        )}

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-brand-400 block">{meta.badge}</span>
          <h3 className="text-base font-black text-white">{plan.name_ar || plan.name}</h3>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed min-h-[34px]">
          {plan.description || 'حل سريري سحابي متكامل ومخصص لممارستك العيادية.'}
        </p>

        {/* Price Display */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          {hasDiscount ? (
            <>
              <div className="flex items-center gap-2">
                <span className="line-through text-slate-500 text-xs font-mono">
                  {billingCycle === 'yearly' ? yearlyDisplay : monthlyDisplay}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono font-bold">
                  تخفيض {discountPercent}%
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono tracking-tight">
                  {billingCycle === 'yearly' ? discountedYearlyDisplay : discountedMonthlyDisplay}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {billingCycle === 'yearly' ? ' / سنوياً' : ' / شهرياً'}
                </span>
              </div>
              {billingCycle === 'yearly' ? (
                <div className="text-[10px] text-emerald-400 font-mono mt-1 font-bold">
                  {yearlyEquivDisplay} • وفرت {formatDzd(yearlySavingsAmount + annualSavings)} دج سنوياً 🎁
                </div>
              ) : (
                <div className="text-[10px] text-teal-300 font-mono mt-1 font-bold">
                  وفرت {formatDzd(monthlySavingsAmount)} دج شهرياً ✨
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-mono tracking-tight">
                  {billingCycle === 'yearly' ? yearlyDisplay : monthlyDisplay}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {billingCycle === 'yearly' ? ' / سنوياً' : ' / شهرياً'}
                </span>
              </div>
              {billingCycle === 'yearly' && (
                <div className="text-[10px] text-emerald-400 font-mono mt-1 font-bold">
                  {yearlyEquivDisplay} • {savingsDisplay}
                </div>
              )}
            </>
          )}
        </div>

        {/* Quotas Specs Pills */}
        <div className="grid grid-cols-2 gap-1.5 py-1">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[10px] text-slate-300 font-bold flex items-center gap-1.5">
            <span className="text-brand-400">👨‍⚕️</span>
            <span className="truncate">{meta.clinLabel}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[10px] text-slate-300 font-bold flex items-center gap-1.5">
            <span className="text-teal-400">📁</span>
            <span className="truncate">{meta.patLabel}</span>
          </div>
        </div>

        {/* Active Features Count Badge */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-[10px] font-bold text-brand-300">
          <span>الميزات النشطة:</span>
          <span className="font-mono font-black">{activeFeaturesCount > 0 ? activeFeaturesCount : 35} / 40 ميزة ✨</span>
        </div>

        {/* Features List with live Enabled / Disabled status */}
        <ul className="space-y-2 text-xs text-slate-300 pt-1">
          {PROMINENT_CARD_FEATURES.map((feat) => {
            const isKiosk = feat.key === 'kiosk_self_checkin';
            const isEnabled = isKiosk ? true : (planFeatures[feat.key] !== false && (planFeatures[feat.key] === true || !plan.features));
            return (
              <li
                key={feat.key}
                className={`flex items-start justify-between gap-2 leading-relaxed transition-opacity ${
                  isEnabled ? 'text-slate-200' : 'text-slate-500/80 line-through decoration-slate-600/70'
                }`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  {isEnabled ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500/60 shrink-0 mt-0.5" />
                  )}
                  <span className="text-[11px] truncate">
                    {feat.label}
                    {!isEnabled && <span className="text-[9px] text-rose-400/80 mr-1 no-underline font-mono">(معطل)</span>}
                  </span>
                </div>
                {isKiosk && (
                  <a
                    href="/tv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[10px] text-cyan-300 hover:text-white font-bold bg-cyan-950/80 hover:bg-cyan-800 border border-cyan-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all"
                    onClick={(e) => e.stopPropagation()}
                    title="فتح شاشة قاعة الانتظار والتلفاز الحية"
                  >
                    <span>معاينة حية 📺</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Card Action CTA */}
      <div className="pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => onSelectPlan(plan)}
          className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${
            meta.isPopular
              ? 'bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white shadow-brand-500/25 hover:scale-[1.02]'
              : 'bg-slate-800 hover:bg-slate-700 text-white hover:border-slate-600 border border-slate-700'
          }`}
        >
          <span>{meta.ctaText}</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Standalone Master Feature Matrix Comparison Table
function FeatureMatrixComparisonTable({ plans, domainsCatalog }) {
  return (
    <div className="mt-12 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Table Header Intro */}
      <div className="p-6 sm:p-8 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-bold">
            مصفوفة المقارنة المباشرة الحية ⚡
          </span>
          <h3 className="text-lg sm:text-2xl font-black text-white mt-2">
            جدول المقارنة الشامل لكافة ميزات المنصة الـ 40 بين جميع الباقات
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            يتم تحديث هذه المصفوفة مباشرة من خوادم النظام لتعكس بدقة الميزات المفعلة والمعطلة لكل ترخيص سريري.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> متاح
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <XCircle className="w-3.5 h-3.5 text-rose-500/70" /> غير متاح
          </span>
        </div>
      </div>

      {/* Responsive Matrix Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse min-w-[850px]">
          {/* Sticky Plans Header */}
          <thead>
            <tr className="bg-slate-950/90 border-b border-slate-800 text-xs">
              <th className="p-4 sm:p-5 font-black text-white w-2/6 min-w-[240px] sticky right-0 bg-slate-950/95 z-10">
                النطاق السريري والميزة
              </th>
              {plans.map((p) => {
                const isPop = p.is_featured || p.slug === 'solo' || p.slug === 'solo_starter' || p.slug === 'multi_pro';
                const hasDisc = Boolean(p.is_discount_active && Number(p.discount_percentage) > 0);
                const discPct = Number(p.discount_percentage) || 0;
                const origMonthly = parseFloat(p.price_dzd_monthly || p.price_monthly) || 0;
                const discMonthly = Math.round(origMonthly * (1 - discPct / 100));

                return (
                  <th key={p.id || p.slug} className="p-4 sm:p-5 text-center font-bold text-white w-1/6 min-w-[120px]">
                    <div className="space-y-1">
                      <div className="text-sm font-black text-white">{p.name_ar || p.name}</div>
                      {isPop && (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[9px] font-bold">
                          شائع ⚡
                        </span>
                      )}
                      {hasDisc ? (
                        <div className="space-y-0.5">
                          <span className="line-through text-slate-500 text-[10px] font-mono block">
                            {formatDzd(origMonthly)} DZD
                          </span>
                          <div className="text-[11px] font-mono text-emerald-400 font-black flex items-center justify-center gap-1">
                            <span>{formatDzd(discMonthly)} DZD</span>
                            <span className="text-[9px] bg-rose-500/20 border border-rose-500/30 text-rose-300 px-1 rounded font-bold">
                              -{discPct}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-emerald-400 font-bold">
                          {formatDzd(p.price_dzd_monthly || p.price_monthly)} DZD
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Grouped by 10 Clinical & Technical Domains */}
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {domainsCatalog.map((domain) => {
              const DomainIcon = domain.icon;
              return (
                <React.Fragment key={domain.id}>
                  {/* Domain Category Banner */}
                  <tr className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-t-2 border-b border-slate-800/80">
                    <td
                      colSpan={plans.length + 1}
                      className="p-3 sm:p-4 font-black text-sm text-brand-300 sticky right-0 z-10"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 shrink-0">
                          {DomainIcon ? <DomainIcon className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="text-white font-bold">{domain.name_ar}</span>
                          <span className="text-[10px] text-slate-400 mr-2 font-mono">({domain.features.length} ميزات)</span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Domain Features Rows */}
                  {domain.features.map((feat) => (
                    <tr key={feat.key} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 sm:p-4 text-right sticky right-0 bg-slate-900/90 z-10 border-l border-slate-800/40">
                        <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                          <span>{feat.name_ar}</span>
                          {feat.isCritical && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-bold">
                              أساسي
                            </span>
                          )}
                        </div>
                        {feat.desc_ar && (
                          <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-normal">
                            {feat.desc_ar}
                          </div>
                        )}
                      </td>

                      {plans.map((p) => {
                        const isEnabled = (p.features && p.features[feat.key] !== false) || (!p.features);
                        return (
                          <td key={p.id || p.slug} className="p-3 sm:p-4 text-center">
                            {isEnabled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>متاح</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950/60 text-slate-500 text-[10px] font-medium border border-slate-800">
                                <XCircle className="w-3 h-3 text-rose-500/60 shrink-0" />
                                <span>غير متاح</span>
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function LandingPageView() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' or 'yearly'
  const [openFaq, setOpenFaq] = useState(null);
  const [activeHeroTab, setActiveHeroTab] = useState('assessments'); // 'assessments' | 'ai_copilot' | 'speech_studio' | 'kiosk'
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [isArticulationMatrixOpen, setIsArticulationMatrixOpen] = useState(false);
  const [isScribeModalOpen, setIsScribeModalOpen] = useState(false);

  // Time & ROI Calculator states
  const [weeklyDocHours, setWeeklyDocHours] = useState(10);
  const [sessionPriceDzd, setSessionPriceDzd] = useState(2500);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  // Calculations for ROI Calculator
  const savedHoursPerWeek = Math.round(weeklyDocHours * 0.7); // 70% time reduction in clinical paperwork
  const extraSessionsPerMonth = Math.round((savedHoursPerWeek * 4) * 0.6); // 60% of saved time can be clinical sessions
  const extraRevenueDzd = extraSessionsPerMonth * sessionPriceDzd;

  // Dynamic landing page configuration & CMS state loaded live from database
  const [landingConfig, setLandingConfig] = useState(DEFAULT_LANDING_CONFIG);

  // Dynamic subscription plans loaded live from the platform database
  const [plans, setPlans] = useState(FALLBACK_PRICING_PLANS);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showComparisonMatrix, setShowComparisonMatrix] = useState(false);
  const [isRegistrationDisabled, setIsRegistrationDisabled] = useState(false);
  const [regDisabledMsg, setRegDisabledMsg] = useState('');

  useEffect(() => {
    let isMounted = true;

    // Fetch dynamic public plans
    const fetchPublicPlans = async () => {
      try {
        setLoadingPlans(true);
        const res = await subscriptionPlansApi.getPublicPlans();
        if (isMounted && res && res.plans && Array.isArray(res.plans) && res.plans.length > 0) {
          const sorted = [...res.plans].sort((a, b) => {
            const pA = parseFloat(a.price_dzd_monthly || a.price_monthly) || 0;
            const pB = parseFloat(b.price_dzd_monthly || b.price_monthly) || 0;
            return pA - pB;
          });
          setPlans(sorted);
        }
      } catch (err) {
        console.warn('Unable to load live public plans, keeping fallback catalog:', err);
      } finally {
        if (isMounted) setLoadingPlans(false);
      }
    };

    // Fetch dynamic landing page CMS & appearance configuration
    const fetchLandingConfig = async () => {
      try {
        const res = await landingPageStudioApi.getPublicConfig();
        if (isMounted && res && res.config) {
          setLandingConfig(res.config);
          if (res.config.hero?.defaultHeroTab) {
            setActiveHeroTab(res.config.hero.defaultHeroTab);
          }
        }
      } catch (err) {
        console.warn('Using default landing CMS configuration:', err);
      }
    };

    // Fetch registration status
    const fetchRegStatus = async () => {
      try {
        const res = await authApi.getRegistrationStatus();
        if (isMounted && res?.is_disabled) {
          setIsRegistrationDisabled(true);
          if (res.message) setRegDisabledMsg(res.message);
        }
      } catch (err) {
        // Fallback: registration allowed
      }
    };

    fetchPublicPlans();
    fetchLandingConfig();
    fetchRegStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const theme = getThemeClasses(landingConfig.appearance?.themeAccent);
  const currentFaqs = (landingConfig.faqs && landingConfig.faqs.length > 0) ? landingConfig.faqs : DEFAULT_LANDING_CONFIG.faqs;
  const currentTestimonials = (landingConfig.testimonials && landingConfig.testimonials.length > 0) ? landingConfig.testimonials : DEFAULT_LANDING_CONFIG.testimonials;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans ${theme.selectionBg} selection:text-white text-right`} dir="rtl">
      
      {/* 1. TOP FLOATING NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
        {/* Top Announcement Bar */}
        {isRegistrationDisabled ? (
          <div className="bg-rose-600/90 text-white py-2 px-4 text-xs font-black text-center flex items-center justify-center gap-2 shadow-sm border-b border-rose-700">
            <span className="px-2 py-0.5 rounded-full bg-black/30 text-[10px] font-black">
              🔒 إشعار
            </span>
            <span>{regDisabledMsg || 'التسجيل لعيادات جديدة مغلق مؤقتاً لأعمال الصيانة والتحديثات السريرية.'}</span>
          </div>
        ) : landingConfig.announcement?.enabled && (
          <div className={`bg-gradient-to-r ${theme.brandGradient} text-white py-1.5 px-4 text-[11px] font-bold text-center flex items-center justify-center gap-2 shadow-sm`}>
            <span className="px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-black">
              {landingConfig.announcement.badge || 'إعلان'}
            </span>
            <span>{landingConfig.announcement.text}</span>
            {landingConfig.announcement.link && (
              <Link to={landingConfig.announcement.link} className="underline hover:opacity-90 font-black mr-2">
                {landingConfig.announcement.linkText || 'اضغط هنا'}
              </Link>
            )}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-300 border border-slate-800 bg-slate-950 p-0.5 shrink-0">
              <img src="/psysnap-logo.png" alt="PsySnap" className="w-full h-full object-cover rounded-xl" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 font-mono">
                <span>{landingConfig.appearance?.brandName || 'PsySnap'}</span>
                {landingConfig.appearance?.brandSuffix && (
                  <span className={theme.brandColor}>{landingConfig.appearance.brandSuffix}</span>
                )}
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {landingConfig.appearance?.countryBadge || 'DZ 🇩🇿'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold">{landingConfig.appearance?.brandTagline || 'المنظومة الإكلينيكية والطبية السحابية'}</div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="التنقل الرئيسي" className="hidden lg:flex items-center gap-5 text-xs font-bold text-slate-300">
            <a href="#features" className="hover:text-brand-400 transition">الركائز السريرية</a>
            <a href="#assessments" className="hover:text-brand-400 transition">بنك المقاييس (30+)</a>
            <a href="#pricing" className="hover:text-brand-400 transition">الأسعار (DZD)</a>
            <Link to="/directory" className="hover:text-brand-400 transition flex items-center gap-1 text-emerald-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>دليل العيادات</span>
            </Link>
            <Link to="/help" className="hover:text-indigo-400 transition flex items-center gap-1 text-indigo-300 font-bold" title="مركز المساعدة والدليل السريري الشامل">
              <BookOpen className="w-3.5 h-3.5" />
              <span>الدليل السريري والمساعدة</span>
            </Link>
            <a
              href="/tv"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30 font-bold"
              title="عرض شاشة قاعة الانتظار والتلفاز الذكي الحية"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>شاشة قاعة الانتظار (TV)</span>
            </a>
            <a
              href="/kiosk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-300 hover:text-teal-200 transition flex items-center gap-1 bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-500/30 font-bold"
              title="فتح كشك تسجيل الحضور الذاتي"
            >
              <span>كشك الاستقبال (Kiosk)</span>
            </a>
            <a href="#faq" className="hover:text-brand-400 transition">الأسئلة الشائعة</a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsFinderOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>مكتشف المقاييس</span>
            </button>

            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
            >
              تسجيل الدخول
            </Link>

            <Link
              to="/register"
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r ${theme.brandGradient} text-white shadow-lg ${theme.brandShadow} hover:scale-[1.02] transition-all flex items-center gap-1.5`}
            >
              <span>ابدأ مجاناً 14 يوماً</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className={`relative ${landingConfig.announcement?.enabled ? 'pt-40' : 'pt-32'} pb-20 overflow-hidden`}>
        {/* Ambient Glows */}
        {landingConfig.appearance?.ambientGlow !== false && (
          <>
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-brand-600/20 via-purple-600/15 to-teal-500/20 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute top-40 right-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
          </>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Main Hero Copy */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Live National Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-300">
                {landingConfig.hero?.badge || '🇩🇿 المنصة السحابية الطبية المقننة الأولى في الجزائر • تغطية شاملة لـ 58 ولاية'}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.2]">
              {landingConfig.hero?.headline ? (
                <span>{landingConfig.hero.headline}</span>
              ) : (
                <>
                  رقمنة متكاملة للعيادات{' '}
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.brandGradient}`}>
                    النفسية والأرطوفونية والطبية
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl mx-auto">
              {landingConfig.hero?.subtitle || 'منظومة سريرية ذكية تجمع كل ما يحتاجه الأخصائي الجزائري: ملف المريض الموحد، بنك يضم أكثر من 30 مقياساً مقنناً (CARS-2, BDI, WISC...)، مساعد التشخيص الفارق بالذكاء الاصطناعي، أستوديو التخاطب الصوتي، وبوابة الأولياء التفاعلية مع دعم كامل للدفع بـ BaridiMob.'}
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                to={landingConfig.hero?.primaryCtaLink || '/register'}
                className={`w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r ${theme.brandGradient} text-white font-black text-sm shadow-xl ${theme.brandShadow} hover:scale-[1.02] transition-all flex items-center justify-center gap-2`}
              >
                <span>{landingConfig.hero?.primaryCtaText || 'أنشئ عيادتك السحابية وابدأ 14 يوماً مجاناً'}</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (landingConfig.hero?.secondaryCtaAction === 'open_finder' || !landingConfig.hero?.secondaryCtaAction) {
                    setIsFinderOpen(true);
                  } else {
                    navigate(landingConfig.hero.secondaryCtaAction);
                  }
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
              >
                <Sparkles className={`w-4 h-4 ${theme.brandColor}`} />
                <span>{landingConfig.hero?.secondaryCtaText || 'جرّب مكتشف المقاييس السريرية (30+)'}</span>
              </button>
            </div>

            {/* Trust Micro-Pills */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400 font-bold">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{landingConfig.hero?.trustBullet1 || 'بدون أي بطاقة بنكية مسبقة'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{landingConfig.hero?.trustBullet2 || 'تفعيل فوري خلال أقل من 60 ثانية'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{landingConfig.hero?.trustBullet3 || 'تسديد آمن عبر بريدي موب BaridiMob و CCP'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تشفير طبي عالي السرية (AES-256)</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Hero Dashboard Mockup */}
          <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl overflow-hidden relative">
            
            {/* Window Top Controls */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] text-slate-400 font-mono pr-2">
                  https://cabinet-alger.psypro.tech/dashboard
                </span>
              </div>

              {/* Showcase Tab Switchers */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveHeroTab('assessments')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    activeHeroTab === 'assessments'
                      ? 'bg-brand-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>المقاييس و Bilan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveHeroTab('ai_copilot')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    activeHeroTab === 'ai_copilot'
                      ? 'bg-brand-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>المساعد الذكي (Copilot)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveHeroTab('speech_studio')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    activeHeroTab === 'speech_studio'
                      ? 'bg-brand-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>أستوديو التخاطب الصوتي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveHeroTab('kiosk')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    activeHeroTab === 'kiosk'
                      ? 'bg-brand-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>الاستقبال وقاعة الانتظار</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Diagnostic Assessment & Bilan Preview */}
            {activeHeroTab === 'assessments' && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        مقياس مقنن مكتمل ✅
                      </span>
                      <h3 className="text-base font-black text-white">
                        مقياس كارز-2 لتقييم التوحد (CARS-2 Childhood Autism Rating Scale)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      المريض: أنيس بن عيسى (5 سنوات و 3 أشهر) • الطبيب الفاحص: د. أمينة بن علي (أخصائي أرطوفونيا)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-left font-mono">
                      <span className="text-xs text-slate-400 block">الدرجة التائية (T-Score):</span>
                      <span className="text-xl font-black text-emerald-400">62.5 (شديد دال)</span>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Mockup Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 block">العلاقة بالناس والتواصل:</span>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
                    </div>
                    <span className="font-mono text-[11px] text-emerald-300 font-bold block">3.5 / 4.0 (غير ملائم بشدة)</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 block">التواصل اللفظي وتكرار الكلمات:</span>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '70%' }} />
                    </div>
                    <span className="font-mono text-[11px] text-amber-300 font-bold block">3.0 / 4.0 (إيكولاليا واضحة)</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 block">الاستجابة للمثيرات البصرية والسمعية:</span>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: '60%' }} />
                    </div>
                    <span className="font-mono text-[11px] text-teal-300 font-bold block">2.5 / 4.0 (فرط استجابة حسية)</span>
                  </div>
                </div>

                {/* Auto Generated Summary Box */}
                <div className="p-4 rounded-2xl bg-brand-950/30 border border-brand-500/20 text-xs text-brand-200 leading-relaxed flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">الخلاصة الإكلينيكية المولدة آلياً (Clinical Decision Synthesis):</span>
                    تشير النتائج الإجمالية (درجة خام 38.5) إلى وجود مؤشرات واضحة لاضطراب طيف التوحد (درجة متوسطة إلى شديدة). يُوصى بتكثيف جلسات التأهيل الأرطوفوني للغة التواصلية، تدريب الوالدين على نظام التواصل بالصور (PECS)، ومتابعة حسية موازية.
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Clinical AI Copilot Preview */}
            {activeHeroTab === 'ai_copilot' && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-brand-400" />
                      <span className="font-bold text-white">تفريغ صوتي ذكي للملاحظات السريرية (AI Medical Scribe):</span>
                    </div>
                    <button
                      type="button"
                      id="ambient-scribe-btn"
                      data-testid="ambient-scribe-btn"
                      data-cy="ambient-scribe-btn"
                      onClick={() => setIsScribeModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>تفريغ صوتي ذكي للملاحظات السريرية</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 font-mono italic">
                    "الطفل يبلغ 4 سنوات ونصف، لا ينظر في عيني أمه عند المناداة، يكرر الكلمات التي يسمعها في التلفاز دون قصد تواصلي (Echolalie)، ويغضب بشدة عند تغيير مسار الذهاب إلى الروضة..."
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-950 border border-purple-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white">اقتراحات المساعد السريري الذكي (Clinical AI Copilot DDSS)</h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      دقة مطابقة 94% لمعايير DSM-5
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-purple-300 font-bold block">1. فرضية تشخيصية أولية:</span>
                      <p className="text-slate-300 text-[11px]">اشتباه اضطراب طيف التوحد (TSA - F84.0) مصحوب بتأخر لغوي تواصلي براغماتي.</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-brand-300 font-bold block">2. المقاييس الموصى بتطبيقها:</span>
                      <p className="text-slate-300 text-[11px]">مقياس CARS-2 للتوحد + فحص السلوك التكيفي Vineland-II + اختبار ELO للغة الشفهية.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Speech Sound Cards Preview */}
            {activeHeroTab === 'speech_studio' && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs">
                  <div>
                    <h4 className="font-bold text-white text-sm">بطاقات التخاطب الصوتي والنطق (PECS & Speech Cards DZ)</h4>
                    <span className="text-slate-400 text-[11px]">مفردات مصورة مع نماذج صوتية مسجلة ونطق صحيح بالأصوات والمخارج</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold text-[10px]">
                    أكثر من 500 بطاقة سريرية
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { wordAr: 'تُفَّاحَة', phoneme: '/ت/ - صوت التاء', img: '🍎', audio: 'نطق سليم' },
                    { wordAr: 'سَيَّارَة', phoneme: '/س/ - الصفير', img: '🚗', audio: 'نطق سليم' },
                    { wordAr: 'حَلِيب', phoneme: '/ح/ - صوت الحلق', img: '🥛', audio: 'نطق سليم' },
                    { wordAr: 'كُرَة', phoneme: '/ك/ - صوت الكاف', img: '⚽', audio: 'نطق سليم' },
                  ].map((card, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2 hover:border-brand-500/50 transition group">
                      <div className="text-4xl py-2 group-hover:scale-110 transition-transform">{card.img}</div>
                      <div className="font-bold text-white text-sm">{card.wordAr}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{card.phoneme}</div>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-brand-600 text-slate-300 hover:text-white transition text-[10px] font-bold flex items-center justify-center gap-1"
                      >
                        <Volume2 className="w-3 h-3 text-brand-400" />
                        <span>تشغيل الصوت</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Direct Scribe CTA in Speech Studio Tab */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-950 to-indigo-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-white">تفريغ صوتي ذكي للملاحظات السريرية (AI Speech Scribe)</div>
                      <div className="text-[11px] text-slate-400">تحويل مباشر للتسجيل الصوتي وجلسات التخاطب إلى تقارير سريرية دقيقة ومقننة</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="ambient-scribe-btn"
                    data-testid="ambient-scribe-btn"
                    data-cy="ambient-scribe-btn"
                    onClick={() => setIsScribeModalOpen(true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    <span>تفريغ صوتي ذكي للملاحظات السريرية 🎙️</span>
                  </button>
                </div>

                {/* Direct Articulation Matrix CTA in Hero Tab */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-950 to-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-white">مصفوفة تصحيح مخارج الحروف الفونولوجية (Articulatory Matrix)</div>
                      <div className="text-[11px] text-slate-400">تقييم عضوي وظيفي، شجرة مخارج الحروف العربية والفرنسية، وحساب PCC</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsArticulationMatrixOpen(true)}
                    data-testid="hero-open-articulation-matrix-btn"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <span>فتح وتجربة مصفوفة النطق 🗣️</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Kiosk & Waiting TV Screen Preview */}
            {activeHeroTab === 'kiosk' && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs">
                  <div>
                    <h4 className="font-bold text-white text-sm">نظام الاستقبال الذاتي وتلفزيون قاعة الانتظار (Smart Kiosk & TV)</h4>
                    <span className="text-slate-400 text-[11px]">تسجيل دخول فوري للمريض عبر شاشة اللمس مع جرس تنبيه متناغم للطبيب</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono font-bold text-[10px]">
                    🔔 إشعار لحظي بدون تأخير
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 block font-bold">1. خطوة المريض (Kiosk):</span>
                    <p className="text-slate-300 text-[11px]">المريض يدخل رقم هاتفه عند باب العيادة لتأكيد الوصول بنقرة واحدة.</p>
                    <span className="text-emerald-400 text-[10px] font-bold block">✓ تم تسجيل الحضور: 10:14</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 block font-bold">2. شاشة التلفزيون (Waiting TV):</span>
                    <p className="text-slate-300 text-[11px]">تحديث آلي لقائمة الانتظار على شاشة القاعة وعرض مقاطع إرشادية صحية.</p>
                    <span className="text-cyan-400 text-[10px] font-bold block">📺 الدور القادم: رقم #14</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-slate-400 block font-bold">3. مكتب الطبيب:</span>
                    <p className="text-slate-300 text-[11px]">نغمة رنين لطيفة (Chime) تنبه الطبيب في مكتبه بوصول المريض وتفتح ملفه.</p>
                    <span className="text-purple-400 text-[10px] font-bold block">🔔 رنين فوري متزامن</span>
                  </div>
                </div>

                {/* Direct Live Preview Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800/80">
                  <a
                    href="/tv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all"
                  >
                    <Radio className="w-4 h-4 animate-pulse text-cyan-200" />
                    <span>📺 تشغيل شاشة قاعة الانتظار والتلفاز المباشرة (Live Waiting TV)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="/kiosk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-black text-xs border border-teal-500/30 flex items-center gap-2 transition-all"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>📱 تجربة كشك الاستقبال والتسجيل الذاتي (Interactive Kiosk)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. NATIONAL METRICS & TRUST PULSE */}
      <section className="py-12 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                {landingConfig.stats?.stat1?.value || '58'}
              </div>
              <div className="text-xs text-slate-400 font-bold">
                {landingConfig.stats?.stat1?.label || 'ولاية جزائرية مغطاة'}
              </div>
              <span className="text-[10px] text-emerald-400">تغطية وطنية شاملة 🇩🇿</span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                {landingConfig.stats?.stat2?.value || '30+'}
              </div>
              <div className="text-xs text-slate-400 font-bold">
                {landingConfig.stats?.stat2?.label || 'مقياساً مقنناً ومعايراً'}
              </div>
              <span className={`text-[10px] ${theme.brandColor}`}>مطابقة سريرية لـ DSM-5</span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                {landingConfig.stats?.stat3?.value || '7 500+'}
              </div>
              <div className="text-xs text-slate-400 font-bold">
                {landingConfig.stats?.stat3?.label || 'موعد سريري مُدار'}
              </div>
              <span className="text-[10px] text-cyan-400">أداء فائق واستقرار سحابي</span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                {landingConfig.stats?.stat4?.value || '100%'}
              </div>
              <div className="text-xs text-slate-400 font-bold">
                {landingConfig.stats?.stat4?.label || 'دفع محلي وتشفير طبي'}
              </div>
              <span className="text-[10px] text-purple-400">بريدي موب • CCP • AES-256</span>
            </div>

          </div>
        </div>
      </section>

      {/* 4. SIX CLINICAL PILLARS (DEEP FEATURES) */}
      {landingConfig.sections?.features !== false && (
        <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className={`px-3.5 py-1 rounded-full text-xs font-black ${theme.brandBadge}`}>
              منظومة متكاملة لا تحتاج لأي برنامج إضافي
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              ست ركائز ثورية أُنشئت خصيصاً للأخصائي الجزائري
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              تم تصميم كل ميزة بالتعاون مع نخبة من أخصائيي الأرطوفونيا، النفسانيين العياديين، وأطباء الأعصاب لتلائم متطلبات الممارسة اليومية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/40 transition space-y-4 group">
              <div className={`w-12 h-12 rounded-2xl ${theme.brandBadge} flex items-center justify-center font-bold group-hover:scale-110 transition`}>
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">1. بنك المقاييس السريرية المقننة والحصائل الآلية</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                تطبيق مباشر للاختبارات (CARS-2, BDI-II, Conners-3, Dyslexia, WISC-V, Vineland...) مع حساب آلي للدرجات التائية (T-Scores) وتوليد تقارير الحصيلة الأولية والنهائية (Bilan) بنقرة واحدة.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2"><Check className={`w-3.5 h-3.5 ${theme.brandColor}`} /> معايرة لغوية ثنائية (عربي / فرنسي)</li>
                <li className="flex items-center gap-2"><Check className={`w-3.5 h-3.5 ${theme.brandColor}`} /> تصدير تقارير PDF رسمية للملف الطبي</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">2. المساعد السريري والتشخيص الفارق بالذكاء الاصطناعي</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                نظام دعم القرار الطبي (DDSS) يقترح الفرضيات التشخيصية وفق معايير DSM-5، ويفرّغ الملاحظات الصوتية بالدارجة والفرنسية، ويصيغ التوصيات العلاجية تلقائياً للأخصائي.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400" /> تفريغ صوتي ذكي للملاحظات السريرية</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400" /> توليد رسائل توجيهية للأطباء والأولياء</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">3. أستوديو النطق وبنك بطاقات التخاطب الصوتي</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                أكثر من 500 بطاقة علاجية مصورة مع تسجيلات صوتية لنطق الحروف والكلمات بالدارجة والفصحى، توليد راديو وبودكاست إرشادي للأولياء، وتدريب حركي بالفيديو.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>بطاقات PECS تفاعلية وقابلة للطباعة</span>
                </li>
                <li
                  onClick={() => setIsArticulationMatrixOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsArticulationMatrixOpen(true);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  data-testid="open-articulation-matrix-btn"
                  className="flex items-center justify-between gap-2 p-2 -mx-2 rounded-xl bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-500/30 cursor-pointer text-indigo-200 hover:text-white transition-all group/item shadow-sm"
                  title="انقر لفتح وتجربة مصفوفة تصحيح مخارج الحروف الفونولوجية"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-400 group-hover/item:scale-110 transition-transform shrink-0" />
                    <span className="font-black text-white">مصفوفة تصحيح مخارج الحروف الفونولوجية</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-all font-mono font-bold">
                    تجربة تفاعلية ⚡
                  </span>
                </li>
              </ul>

              {/* Direct Open Button inside Feature Card */}
              <button
                type="button"
                onClick={() => setIsArticulationMatrixOpen(true)}
                data-testid="speech-studio-open-matrix"
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>فتح مصفوفة تصحيح مخارج الحروف 🗣️</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 transition space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">4. بوابة الأولياء الذكية بدون كلمات مرور</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                رابط سحري آمن (Magic Link) يُرسل للولي عبر WhatsApp يتيح له متابعة تطور طفله، إنجاز الواجبات والتمارين المنزلية، وتأكيد المواعيد دون نسيان كلمات المرور.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400" /> استبيان قبلي آلي (Pre-Intake Anamnesis)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400" /> تقليل غياب المرضى وإلغاء المواعيد</li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">5. شاشة الاستقبال الذاتي وتلفزيون قاعة الانتظار</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                شاشة ترحيب تفاعلية تسجل حضور المريض ذاتياً، مع تلفزيون يعرض أدوار الانتظار وإرشادات طبية، ورنين تنبيه فوري متناغم يبلغ الطبيب في مكتبه.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> تنظيم عصري راقٍ لقاعة الانتظار</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> إشعار وصول المريض بنقرة واحدة</li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">6. محلل البيانات السريرية واستخبارات الأعمال</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                اطرح أي سؤال باللغة العربية أو الفرنسية ("ما هي المداخيل الشهرية؟"، "توزيع حالات المواعيد") لتتحول تلقائياً إلى استعلامات ومخططات بيانية فورية.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> تحويل النص إلى رسوم بيانية (Conversational BI)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-cyan-400" /> فواتير إلكترونية ومتابعة المدفوعات بالدينار</li>
              </ul>
            </div>

          </div>

          {/* CTA Banner Inside Features */}
          <div className={`p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border ${theme.brandBorder}/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl`}>
            <div className="space-y-1 text-center md:text-right">
              <h3 className="text-lg font-black text-white">هل تود تجربة مقياس محدد في تخصصك الآن؟</h3>
              <p className="text-xs text-slate-300">استكشف بنك المقاييس والأدوات السريرية المتاحة لعيادتك فوراً</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFinderOpen(true)}
              className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${theme.brandGradient} text-white font-bold text-xs shadow-lg ${theme.brandShadow} transition flex items-center gap-2 shrink-0`}
            >
              <Sparkles className="w-4 h-4" />
              <span>فتح مكتشف المقاييس السريرية</span>
            </button>
          </div>

        </section>
      )}

      {/* 5. INTERACTIVE SPECIALIST ROI & TIME CALCULATOR */}
      {landingConfig.sections?.roi_calculator !== false && (
        <section className="py-20 bg-slate-900/40 border-t border-slate-800/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                حاسبة توفير الوقت والأرباح السريرية
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                كم من الوقت والمال ستوفر لعيادتك شهرياً؟
              </h2>
              <p className="text-xs text-slate-400">
                حرك المؤشرات لترى أثر أتمتة التقارير الطبية والمقاييس وتذكيرات الواتساب على إنتاجية عيادتك.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              
              {/* Sliders Area (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Slider 1 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">ساعات كتابة التقارير والتوثيق الورقي أسبوعياً:</span>
                    <span className={`font-black ${theme.brandColor} font-mono text-sm`}>{weeklyDocHours} ساعات / أسبوع</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="25"
                    value={weeklyDocHours}
                    onChange={(e) => setWeeklyDocHours(Number(e.target.value))}
                    className={`w-full ${theme.selectionBg} bg-slate-800 h-2 rounded-lg cursor-pointer`}
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>ساعتان</span>
                    <span>10 ساعات</span>
                    <span>25 ساعة</span>
                  </div>
                </div>

                {/* Slider 2 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">متوسط سعر الجلسة أو الحصيلة في عيادتك:</span>
                    <span className="font-black text-emerald-400 font-mono text-sm">{sessionPriceDzd.toLocaleString()} دج</span>
                  </div>
                  <input
                    type="range"
                    min="1500"
                    max="6000"
                    step="250"
                    value={sessionPriceDzd}
                    onChange={(e) => setSessionPriceDzd(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1 500 دج</span>
                    <span>3 500 دج</span>
                    <span>6 000 دج</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                  💡 <span className="font-bold text-slate-200">الأثر السريري:</span> بفضل الحساب الآلي للدرجات التائية وتوليد التقارير بالذكاء الاصطناعي، تقلل المنصة وقت كتابة الـ Bilan بنسبة <span className={`font-bold ${theme.brandColor} font-mono`}>70%</span>، مما يتيح لك التفرغ لمتابعة حالات إضافية وقضاء وقت أطول مع مرضاك.
                </div>
              </div>

              {/* Results Area (5 Cols) */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 text-center space-y-4 shadow-xl">
                <span className="text-[11px] font-bold text-slate-400 block">العائد الإضافي المتوقع لعيادتك</span>
                
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                    +{extraRevenueDzd.toLocaleString()} <span className="text-sm font-sans font-bold text-slate-400">دج / شهر</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (بإمكانية إضافة قرابة {extraSessionsPerMonth} جلسات أو حصائل جديدة شهرياً)
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">الوقت الموفر أسبوعياً:</span>
                    <span className="font-black text-white font-mono text-sm">{savedHoursPerWeek} ساعات ⏳</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">تقليل غياب المواعيد:</span>
                    <span className="font-black text-emerald-400 font-mono text-sm">-45% 📉</span>
                  </div>
                </div>

                <Link
                  to="/register"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition block"
                >
                  تفعيل حساب العيادة والبدء فوراً
                </Link>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* 6. TRANSPARENT DZD PRICING PLANS */}
      {landingConfig.sections?.pricing !== false && (
        <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className={`px-3.5 py-1 rounded-full text-xs font-black ${theme.brandBadge}`}>
              خطط اشتراك شفافة بالدينار الجزائري (DZD)
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              استثمار سريري بسيط يغير طريقة إدارة عيادتك بالكامل
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              جميع الخطط تشمل فترة تجريبية مجانية لمدة 14 يوماً بدون أي التزام، مع دعم السداد عبر تطبيق بريدي موب و CCP.
            </p>

            {/* Billing Cycle Switcher */}
            <div className="inline-flex items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs mt-4">
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? `bg-gradient-to-r ${theme.brandGradient} text-white shadow-lg ${theme.brandShadow}`
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>اشتراك سنوي (خصم شهرين مجاناً 🎁)</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl font-bold transition ${
                  billingCycle === 'monthly'
                    ? `bg-gradient-to-r ${theme.brandGradient} text-white shadow-lg ${theme.brandShadow}`
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>اشتراك شهري</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid (Dynamic Tiers synchronized with SuperAdmin Studio) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-stretch">
            {plans.map((plan) => (
              <PlanPricingCard
                key={plan.id || plan.slug}
                plan={plan}
                billingCycle={billingCycle}
                onSelectPlan={(selectedPlan) => {
                  navigate('/register', { state: { plan: selectedPlan.slug || selectedPlan.id } });
                }}
              />
            ))}
          </div>

          {/* Toggle Master 40 Features Comparison Matrix */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setShowComparisonMatrix(!showComparisonMatrix)}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 hover:from-slate-800 hover:to-slate-800 border border-slate-700 hover:border-brand-500/50 text-white font-black text-xs transition-all shadow-xl hover:shadow-brand-500/10 group cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${theme.brandColor} group-hover:rotate-12 transition-transform`} />
              <span>
                {showComparisonMatrix
                  ? 'إخفاء جدول المقارنة التفصيلي لكافة الميزات الـ 40'
                  : 'عرض جدول المقارنة التفصيلي لكافة ميزات المنصة الـ 40 بين الباقات'}
              </span>
              {showComparisonMatrix ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>

          {/* Master Comparison Matrix Table */}
          {showComparisonMatrix && (
            <FeatureMatrixComparisonTable
              plans={plans}
              domainsCatalog={PLATFORM_DOMAINS_CATALOG}
            />
          )}

          {/* Algerian Payment Support Assurance */}
          {landingConfig.sections?.payment_assurances !== false && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">طرق سداد محلية معتمدة وفواتير رسمية للعيادات</h4>
                  <p className="text-xs text-slate-400">
                    إمكانية الدفع عبر تطبيق بريدي موب (BaridiMob)، حساب البريد CCP، أو تحويل بنكي B2B مع إصدار فواتير رسمية مخصومة من الضرائب.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 font-mono">
                  📱 BaridiMob Pay
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 font-mono">
                  📮 CCP Algérie Poste
                </span>
              </div>
            </div>
          )}

        </section>
      )}

      {/* 7. VERIFIED NATIONAL DIRECTORY (58 WILAYAS) CTA */}
      {landingConfig.sections?.directory_cta !== false && (
        <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900/60 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-2xl text-center lg:text-right">
                <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block">
                  الدليل الوطني المعتمد للعيادات والمراكز
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  تصفح عيادات الأرطوفونيا والصحة النفسية المعتمدة عبر 58 ولاية
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  بانضمامك لمنصة PsyPro، يتم إدراج عيادتك تلقائياً في الدليل الوطني الرسمي مع إمكانية استقبال طلبات حجز المواعيد المباشرة من المرضى والأولياء في ولايتك.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
                <Link
                  to="/directory"
                  className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>تصفح دليل العيادات الوطني</span>
                </Link>

                <Link
                  to="/register"
                  className={`px-6 py-3.5 rounded-2xl bg-gradient-to-r ${theme.brandGradient} text-white font-bold text-xs shadow-lg ${theme.brandShadow} transition flex items-center justify-center gap-2`}
                >
                  <span>سجّل عيادتك واظهر في الدليل</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 8. TESTIMONIALS FROM ALGERIAN PRACTITIONERS */}
      {landingConfig.sections?.testimonials !== false && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className={`text-xs font-bold ${theme.brandColor}`}>آراء زملائنا الأخصائيين</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              ماذا يقول الأخصائيون الممارسون عن PsyPro؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentTestimonials.map((t, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4 hover:border-slate-700 transition">
                <div className="flex items-center gap-1 text-amber-400 text-xs">
                  {'★'.repeat(Math.min(5, Math.max(1, t.rating || 5)))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${theme.brandBadge} font-black flex items-center justify-center text-xs font-mono`}>
                    {t.name ? t.name.slice(0, 2) : 'أخ'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.name}</h4>
                    <span className="text-[10px] text-slate-400">{t.role} {t.wilaya ? `• ${t.wilaya}` : ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      {landingConfig.sections?.faq !== false && (
        <section id="faq" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            
            <div className="text-center space-y-2">
              <span className={`text-xs font-bold ${theme.brandColor}`}>إجابات واضحة ومباشرة</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                الأسئلة الشائعة للأخصائيين
              </h2>
            </div>

            <div className="space-y-3">
              {currentFaqs.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-right flex items-center justify-between gap-4 hover:bg-slate-850 transition"
                  >
                    <span className="text-xs sm:text-sm font-black text-white">{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        openFaq === idx ? `rotate-180 ${theme.brandColor}` : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 10. FINAL BOTTOM CTA BANNER */}
      {landingConfig.sections?.final_cta !== false && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border ${theme.brandBorder}/40 shadow-2xl text-center space-y-6 relative overflow-hidden`}>
            
            <div className="max-w-2xl mx-auto space-y-3 relative z-10">
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                جاهز لنقل عيادتك الطبية إلى المستقبل الرقمي؟
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                انضم إلى مئات الأخصائيين الممارسين في 58 ولاية جزائرية واستمتع بفترة تجريبية مجانية كاملة لمدة 14 يوماً بدون أي التزام أو دفع مسبق.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black text-sm shadow-xl hover:scale-105 transition flex items-center justify-center gap-2"
              >
                <span>إنشاء حساب العيادة مجاناً (14 يوماً)</span>
                <ArrowLeft className={`w-4 h-4 ${theme.brandColor}`} />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-950/60 hover:bg-slate-950 text-white font-bold text-sm border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <span>تسجيل الدخول للعيادات المشتركة</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 11. FOOTER */}
      <footer className="py-12 bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-slate-900 border border-slate-700/80 p-0.5 shrink-0">
                <img src="/psysnap-logo.png" alt="PsySnap" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div>
                <span className="text-lg font-black text-white font-mono">
                  {landingConfig.appearance?.brandName || 'PsySnap'}<span className={theme.brandColor}>{landingConfig.appearance?.brandSuffix || ''}</span>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {landingConfig.appearance?.brandTagline || 'نظام المقاييس المقننة وإدارة العيادات السريرية'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-bold">
              <a href="#features" className="hover:text-white transition">الميزات السريرية</a>
              <a href="#assessments" className="hover:text-white transition">المقاييس المقننة</a>
              <a href="#pricing" className="hover:text-white transition">الأسعار بالدينار (DZD)</a>
              <Link to="/directory" className="hover:text-white transition">دليل العيادات (58 ولاية)</Link>
              <Link to="/help" className="hover:text-indigo-300 transition text-indigo-400 font-bold flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>مركز المساعدة والدليل السريري</span>
              </Link>
              <a href="/tv" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition text-cyan-300">شاشة قاعة الانتظار (TV)</a>
              <a href="/kiosk" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition text-teal-300">كشك الاستقبال (Kiosk)</a>
              <Link to="/login" className="hover:text-white transition">دخول العيادات</Link>
              <Link to="/register" className={`hover:text-white transition ${theme.brandColor}`}>تسجيل عيادة جديدة</Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              {landingConfig.footer?.copyright || 'جميع الحقوق محفوظة © 2026 منصة PsyPro Clinical SaaS • الجمهورية الجزائرية الديمقراطية الشعبية'}
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono">
              {landingConfig.footer?.supportPhone && (
                <a href={`tel:${landingConfig.footer.supportPhone}`} className="hover:text-slate-300">
                  📞 {landingConfig.footer.supportPhone}
                </a>
              )}
              {landingConfig.footer?.whatsapp && (
                <a href={`https://wa.me/${landingConfig.footer.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400">
                  💬 واتساب
                </a>
              )}
              {landingConfig.footer?.supportEmail && (
                <a href={`mailto:${landingConfig.footer.supportEmail}`} className="hover:text-slate-300">
                  ✉️ {landingConfig.footer.supportEmail}
                </a>
              )}
              <span>•</span>
              <span>تشفير طبي AES-256</span>
              <span>•</span>
              <span>حماية السر المهني</span>
              <span>•</span>
              <span>متوافق مع بريدي موب BaridiMob</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Specialty Assessment Finder Modal */}
      <SpecialtyAssessmentFinderModal
        isOpen={isFinderOpen}
        onClose={() => setIsFinderOpen(false)}
      />

      {/* Speech Articulation Matrix Modal */}
      <SpeechArticulationMatrixModal
        isOpen={isArticulationMatrixOpen}
        onClose={() => setIsArticulationMatrixOpen(false)}
      />

      {/* Ambient Clinical Scribe Modal */}
      <AmbientClinicalScribeModal
        isOpen={isScribeModalOpen}
        onClose={() => setIsScribeModalOpen(false)}
      />

      {/* Floating Clinical Advisor & WhatsApp Support Widget */}
      {landingConfig.appearance?.showFloatingAdvisor !== false && (
        <FloatingClinicalAdvisor />
      )}

    </div>
  );
}
