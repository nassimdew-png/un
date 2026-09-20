import React, { useState, useEffect } from 'react';
import {
  Palette,
  Megaphone,
  Sparkles,
  LayoutTemplate,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  MessageSquare,
  PhoneCall,
  Save,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  Sliders,
  Layers,
  Brain,
  ShieldCheck,
  Check,
  Star
} from 'lucide-react';
import { landingPageStudioApi } from '../../api';

// Accent theme presets
const ACCENT_THEMES = [
  {
    id: 'emerald',
    name: 'الأخضر الزمردي السريري (Emerald Medical)',
    desc: 'الهوية الطبية السريرية الهادئة والموثوقة (الافتراضي)',
    colorClass: 'bg-emerald-500',
    gradient: 'from-emerald-600 to-teal-700',
    ring: 'ring-emerald-500',
  },
  {
    id: 'teal',
    name: 'الأزرق التيل الهادئ (Teal Zen)',
    desc: 'مظهر زن ناعم مريح لعين المعالج',
    colorClass: 'bg-teal-500',
    gradient: 'from-teal-600 to-cyan-700',
    ring: 'ring-teal-500',
  },
  {
    id: 'indigo',
    name: 'الأزرق النيلي الاحترافي (Indigo Modern)',
    desc: 'مظهر مؤسسي رقمي متطور فائق الحداثة',
    colorClass: 'bg-indigo-600',
    gradient: 'from-indigo-600 to-blue-800',
    ring: 'ring-indigo-500',
  },
  {
    id: 'violet',
    name: 'البنفسجي الملكي (Violet Royal)',
    desc: 'طابع سيكولوجي عميق ومميز للأبحاث والذكاء',
    colorClass: 'bg-purple-600',
    gradient: 'from-purple-600 to-indigo-700',
    ring: 'ring-purple-500',
  },
  {
    id: 'cyan',
    name: 'الأزرق السماوي التقني (Cyan Tech)',
    desc: 'مظهر رقمي تكنولوجي متلألئ عالي التباين',
    colorClass: 'bg-cyan-500',
    gradient: 'from-cyan-600 to-sky-700',
    ring: 'ring-cyan-500',
  },
  {
    id: 'amber',
    name: 'الكهرماني الذهبي (Amber Warm)',
    desc: 'ألوان دافئة مفعمة بالحيوية والاهتمام الأسري',
    colorClass: 'bg-amber-500',
    gradient: 'from-amber-600 to-orange-700',
    ring: 'ring-amber-500',
  },
];

const STUDIO_TABS = [
  { id: 'appearance', label: '🎨 الهوية والألوان', icon: Palette },
  { id: 'announcement', label: '📢 شريط الإعلانات والترويسة', icon: Megaphone },
  { id: 'hero', label: '🚀 القسم الترحيبي (Hero)', icon: Sparkles },
  { id: 'stats', label: '📊 شريط الإحصائيات', icon: BarChart3 },
  { id: 'sections', label: '🎛️ ظهور الأقسام', icon: LayoutTemplate },
  { id: 'faqs', label: '❓ الأسئلة الشائعة (FAQ)', icon: HelpCircle },
  { id: 'testimonials', label: '⭐ آراء الممارسين', icon: MessageSquare },
  { id: 'footer', label: '📞 التذييل والاتصال', icon: PhoneCall },
];

export default function LandingPageStudioTab() {
  const [activeTab, setActiveTab] = useState('appearance');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isCustomized, setIsCustomized] = useState(false);

  // Studio configuration form state
  const [config, setConfig] = useState({
    appearance: {
      themeAccent: 'emerald',
      darkModeStyle: 'slate',
      ambientGlow: true,
      brandName: 'PsyPro',
      brandSuffix: '.tech',
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
    faqs: [],
    testimonials: [],
    footer: {
      supportPhone: '+213 550 12 34 56',
      supportEmail: 'contact@psypro.tech',
      whatsapp: '+213550123456',
      address: 'الجزائر العاصمة، الجزائر',
      copyright: 'جميع الحقوق محفوظة لمنصة PsyPro الطبية © 2026',
      socialFacebook: 'https://facebook.com/psypro.tech',
      socialLinkedIn: 'https://linkedin.com/company/psypro-tech',
      socialInstagram: 'https://instagram.com/psypro.tech',
      socialYoutube: '',
    },
  });

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await landingPageStudioApi.getConfig();
      if (res && res.config) {
        setConfig(res.config);
        setIsCustomized(Boolean(res.is_customized));
      }
    } catch (err) {
      console.error('Failed to load landing page configuration:', err);
      setError('تعذر تحميل إعدادات الصفحة الرئيسية من الخادم.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      const res = await landingPageStudioApi.updateConfig(config);
      if (res && res.success) {
        setSaveSuccess(true);
        setIsCustomized(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save landing page configuration:', err);
      setError(err?.response?.data?.message || err?.message || 'حدث خطأ أثناء حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في استعادة الإعدادات الأصلية الافتراضية للصفحة الرئيسية؟ ستفقد أي تخصيصات غير محفوظة.')) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await landingPageStudioApi.resetConfig();
      if (res && res.config) {
        setConfig(res.config);
        setIsCustomized(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to reset landing page configuration:', err);
      setError('تعذر استعادة الإعدادات الافتراضية.');
    } finally {
      setSaving(false);
    }
  };

  // Helper updaters
  const updateField = (category, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const updateSectionToggle = (sectionKey) => {
    setConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: !prev.sections?.[sectionKey],
      },
    }));
  };

  const updateStatField = (statKey, field, val) => {
    setConfig((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [statKey]: {
          ...prev.stats?.[statKey],
          [field]: val,
        },
      },
    }));
  };

  // FAQ helpers
  const handleFaqChange = (index, field, value) => {
    const updated = [...(config.faqs || [])];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      setConfig((prev) => ({ ...prev, faqs: updated }));
    }
  };

  const handleAddFaq = () => {
    setConfig((prev) => ({
      ...prev,
      faqs: [
        ...(prev.faqs || []),
        { q: 'سؤال سريري جديد؟', a: 'تفاصيل الإجابة التوضيحية للأخصائي...' },
      ],
    }));
  };

  const handleDeleteFaq = (index) => {
    const updated = (config.faqs || []).filter((_, idx) => idx !== index);
    setConfig((prev) => ({ ...prev, faqs: updated }));
  };

  // Testimonial helpers
  const handleTestimonialChange = (index, field, value) => {
    const updated = [...(config.testimonials || [])];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      setConfig((prev) => ({ ...prev, testimonials: updated }));
    }
  };

  const handleAddTestimonial = () => {
    setConfig((prev) => ({
      ...prev,
      testimonials: [
        ...(prev.testimonials || []),
        {
          name: 'د. زميل سريري جديد',
          role: 'طبيب نفساني / أخصائي أرطوفونيا',
          wilaya: 'الجزائر العاصمة',
          quote: 'رأيي وتجربتي مع منصة PsyPro...',
          rating: 5,
        },
      ],
    }));
  };

  const handleDeleteTestimonial = (index) => {
    const updated = (config.testimonials || []).filter((_, idx) => idx !== index);
    setConfig((prev) => ({ ...prev, testimonials: updated }));
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900/50 rounded-3xl border border-slate-800">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs font-mono">جاري تحميل استوديو تخصيص الصفحة الرئيسية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Header & Global Actions Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/20 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-purple-500/10 text-purple-300 border border-purple-500/30">
              🎨 LANDING PAGE CMS STUDIO
            </span>
            {isCustomized ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                تخصيص مباشر نشط ✨
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                الإعدادات الافتراضية المعتمدة
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-white">
            استوديو تخصيص وتصميم الصفحة الرئيسية (Landing Page CMS)
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            تحكم كامل في مظهر وألوان، نصوص الترويسة، أزرار الدعوة للإجراء، شريط الإحصائيات الوطنية، إظهار أو إخفاء الأقسام، وبنك الأسئلة الشائعة والشهادات.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4 text-purple-400" />
            <span>معاينة الموقع المباشر</span>
          </a>

          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-bold border border-slate-800 hover:border-rose-800/50 transition flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>استعادة الأصل</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-brand-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white text-xs font-black shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'جاري الحفظ والتطبيق...' : 'حفظ وتطبيق التعديلات الآن'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>تم حفظ الإعدادات وتطبيقها بنجاح على زوار الصفحة الرئيسية! ستظهر التعديلات مباشرة.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Studio Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {STUDIO_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 border border-purple-400'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <TabIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-purple-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: APPEARANCE & THEME STYLING */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              <span>لوحة الألوان الأساسية للمنصة (Primary Accent Color Theme)</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              اختر النمط اللوني الأساسي الذي يحكم أزرار الدعوة للإجراء، الإشعارات، التوهجات، والبطاقات المميزة في الموقع:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ACCENT_THEMES.map((th) => {
                const isCurrent = config.appearance?.themeAccent === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => updateField('appearance', 'themeAccent', th.id)}
                    className={`p-4 rounded-2xl border text-right transition-all flex items-start justify-between cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-800/90 border-brand-500 shadow-xl shadow-brand-500/10 ring-2 ring-brand-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5 pr-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${th.colorClass}`} />
                        <span className="text-xs font-black text-white">{th.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{th.desc}</p>
                    </div>
                    {isCurrent && (
                      <div className="w-6 h-6 rounded-full bg-brand-500 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branding Details */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-brand-400" />
                <span>شعار المنصة واسم الموقع</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">اسم المنصة الأساسي:</label>
                  <input
                    type="text"
                    value={config.appearance?.brandName || 'PsyPro'}
                    onChange={(e) => updateField('appearance', 'brandName', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">اللاحقة الرقمية (Suffix):</label>
                  <input
                    type="text"
                    value={config.appearance?.brandSuffix || '.tech'}
                    onChange={(e) => updateField('appearance', 'brandSuffix', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">بادج الدولة:</label>
                  <input
                    type="text"
                    value={config.appearance?.countryBadge || 'DZ 🇩🇿'}
                    onChange={(e) => updateField('appearance', 'countryBadge', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">النص التوضيحي للعلامة:</label>
                  <input
                    type="text"
                    value={config.appearance?.brandTagline || 'المنظومة الإكلينيكية والطبية السحابية'}
                    onChange={(e) => updateField('appearance', 'brandTagline', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Special Visual Toggles */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>ميزات العرض والتأثيرات الخاصة</span>
              </h3>

              <div className="space-y-4 pt-2">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-black text-white block">تأثيرات الإضاءة المحيطة والتوهج الخلفي (Ambient Glow)</span>
                    <span className="text-[11px] text-slate-400 block">إضافة هالات ضوئية سريرية ناعمة في خلفية الصفحة تعزز العمق البصري</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(config.appearance?.ambientGlow)}
                    onChange={(e) => updateField('appearance', 'ambientGlow', e.target.checked)}
                    className="w-5 h-5 rounded accent-brand-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-black text-white block">المساعد السريري العائم (Floating Clinical Advisor)</span>
                    <span className="text-[11px] text-slate-400 block">عرض أيقونة المساعد الذكي العائمة في زاوية الشاشة لتوجيه الزوار</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(config.appearance?.showFloatingAdvisor)}
                    onChange={(e) => updateField('appearance', 'showFloatingAdvisor', e.target.checked)}
                    className="w-5 h-5 rounded accent-brand-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANNOUNCEMENT BAR & HEADER */}
      {activeTab === 'announcement' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <span>شريط الإعلانات العلوي المتحرك (Top Announcement Ticker)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                شريط يظهر في أعلى الموقع للإعلان عن تخفيضات، أو فعاليات، أو إطلاق ميزات سريرية جديدة.
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-xs font-bold text-slate-300">
                {config.announcement?.enabled ? 'مفعل ويظهر للزوار 🟢' : 'معطل ومخفي 🔴'}
              </span>
              <input
                type="checkbox"
                checked={Boolean(config.announcement?.enabled)}
                onChange={(e) => updateField('announcement', 'enabled', e.target.checked)}
                className="w-6 h-6 rounded accent-brand-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">نص البادج التنبيهي:</label>
              <input
                type="text"
                value={config.announcement?.badge || ''}
                onChange={(e) => updateField('announcement', 'badge', e.target.value)}
                placeholder="تحديث هام 🚀"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">رابط الإعلان (اختياري):</label>
              <input
                type="text"
                value={config.announcement?.link || ''}
                onChange={(e) => updateField('announcement', 'link', e.target.value)}
                placeholder="/register أو رابط صفحة مخصصة"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-brand-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 font-bold mb-1">نص الإعلان الكامل:</label>
              <textarea
                rows={2}
                value={config.announcement?.text || ''}
                onChange={(e) => updateField('announcement', 'text', e.target.value)}
                placeholder="أدخل نص الإعلان الذي سيظهر للزوار في أعلى الصفحة..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-brand-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HERO SECTION & CTAS */}
      {activeTab === 'hero' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <span>نصوص وعناصر القسم الترحيبي الأول (Hero Section)</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">بادج الترحيب العلوي:</label>
              <input
                type="text"
                value={config.hero?.badge || ''}
                onChange={(e) => updateField('hero', 'badge', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">العنوان الرئيسي الكبير (H1 Headline):</label>
              <input
                type="text"
                value={config.hero?.headline || ''}
                onChange={(e) => updateField('hero', 'headline', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-black text-sm focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">الوصف الإكلينيكي التوضيحي (Subtitle):</label>
              <textarea
                rows={3}
                value={config.hero?.subtitle || ''}
                onChange={(e) => updateField('hero', 'subtitle', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white leading-relaxed focus:border-brand-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-slate-400 font-bold mb-1">نص زر الإجراء الأساسي (Primary CTA):</label>
                <input
                  type="text"
                  value={config.hero?.primaryCtaText || ''}
                  onChange={(e) => updateField('hero', 'primaryCtaText', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">نص زر الإجراء الثانوي (Secondary CTA):</label>
                <input
                  type="text"
                  value={config.hero?.secondaryCtaText || ''}
                  onChange={(e) => updateField('hero', 'secondaryCtaText', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-slate-400 font-bold mb-1">الضمانة الأولى (Bullet 1):</label>
                <input
                  type="text"
                  value={config.hero?.trustBullet1 || ''}
                  onChange={(e) => updateField('hero', 'trustBullet1', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">الضمانة الثانية (Bullet 2):</label>
                <input
                  type="text"
                  value={config.hero?.trustBullet2 || ''}
                  onChange={(e) => updateField('hero', 'trustBullet2', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">الضمانة الثالثة (Bullet 3):</label>
                <input
                  type="text"
                  value={config.hero?.trustBullet3 || ''}
                  onChange={(e) => updateField('hero', 'trustBullet3', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NATIONAL STATS BAR */}
      {activeTab === 'stats' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>شريط الأرقام والإحصائيات السريرية الوطنية (Stats Bar)</span>
          </h3>
          <p className="text-xs text-slate-400">
            يمكنك تحديث هذه الأرقام الدالة على انتشار المنصة لتعكس الإنجازات والنمو الحقيقي:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {['stat1', 'stat2', 'stat3', 'stat4'].map((sKey, idx) => {
              const stat = config.stats?.[sKey] || {};
              return (
                <div key={sKey} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-[11px] font-bold text-brand-400">المؤشر السريري #{idx + 1}</div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">الرقم / القيمة:</label>
                    <input
                      type="text"
                      value={stat.value || ''}
                      onChange={(e) => updateStatField(sKey, 'value', e.target.value)}
                      placeholder="+120"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-black focus:border-brand-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">النص / التسمية:</label>
                    <input
                      type="text"
                      value={stat.label || ''}
                      onChange={(e) => updateStatField(sKey, 'label', e.target.value)}
                      placeholder="عيادة ومركز معتمد"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SECTION VISIBILITY TOGGLES */}
      {activeTab === 'sections' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-indigo-400" />
            <span>التحكم في إظهار وإخفاء أقسام الصفحة الرئيسية</span>
          </h3>
          <p className="text-xs text-slate-400">
            يمكنك تعطيل أو تفعيل ظهور أي قسم بالكامل بضغطة زر واحدة دون حذف محتواه:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'features', label: 'قسم الركائز السريرية الـ 4', desc: 'SOAP، المقاييس، التطبيب عن بعد، والكشك' },
              { key: 'assessments', label: 'قسم بنك الروائز المقننة الـ 18', desc: 'كتالوج الاختبارات ومولد الحصائل PDF' },
              { key: 'specialties', label: 'قسم التخصصات العيادية الثلاثة', desc: 'أرطوفونيا، نفساني، وتأهيل حركي' },
              { key: 'ai_copilot', label: 'قسم الذكاء الاصطناعي والمفرغ الصوتي', desc: 'المساعد السريري وصياغة SOAP' },
              { key: 'roi_calculator', label: 'حاسبة العائد والوقت المسترجع', desc: 'حساب توفير الساعات وزيادة المداخيل' },
              { key: 'pricing', label: 'قسم خطط الأسعار والاشتراكات DZD', desc: 'بطاقات الأسعار وجدول المقارنة الـ 40' },
              { key: 'payment_assurances', label: 'شريط طرق السداد BaridiMob و CCP', desc: 'خيارات الدفع والفواتير الرسمية' },
              { key: 'directory_cta', label: 'شريط الدليل الوطني 58 ولاية', desc: 'دعوة الانضمام والظهور في الدليل' },
              { key: 'testimonials', label: 'قسم آراء وتقييمات الممارسين', desc: 'تجارب الزملاء الأطباء والأخصائيين' },
              { key: 'faq', label: 'قسم الأسئلة الشائعة (FAQ)', desc: 'أجوبة الاستفسارات الأكثر تكراراً' },
              { key: 'final_cta', label: 'شريط الدعوة الختامي للتسجيل', desc: 'زر فتح الحساب المجاني قبل التذييل' },
            ].map((sec) => {
              const isEnabled = config.sections?.[sec.key] !== false;
              return (
                <div
                  key={sec.key}
                  onClick={() => updateSectionToggle(sec.key)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isEnabled
                      ? 'bg-slate-950 border-brand-500/40 shadow-lg'
                      : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-black text-white block">{sec.label}</span>
                    <span className="text-[10px] text-slate-400 block">{sec.desc}</span>
                  </div>
                  <div className={`text-xl ${isEnabled ? 'text-brand-400' : 'text-slate-600'}`}>
                    {isEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: FAQS MANAGER */}
      {activeTab === 'faqs' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span>إدارة وتخصيص الأسئلة الشائعة (FAQ)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                أضف أو عدّل الأسئلة والأجوبة التي تظهر للزوار في قسم الأسئلة الشائعة.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddFaq}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة سؤال جديد</span>
            </button>
          </div>

          <div className="space-y-4">
            {(config.faqs || []).map((faq, idx) => (
              <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-400 font-mono">السؤال #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(idx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">نص السؤال:</label>
                  <input
                    type="text"
                    value={faq.q || ''}
                    onChange={(e) => handleFaqChange(idx, 'q', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">نص الإجابة المفصلة:</label>
                  <textarea
                    rows={3}
                    value={faq.a || ''}
                    onChange={(e) => handleFaqChange(idx, 'a', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs leading-relaxed focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: TESTIMONIALS MANAGER */}
      {activeTab === 'testimonials' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <span>إدارة آراء وتجارب الممارسين (Testimonials)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                عرض تقييمات وشهادات الأطباء والأخصائيين الممارسين لبناء الثقة والاعتمادية.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTestimonial}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة شهادة جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(config.testimonials || []).map((testim, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(testim.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTestimonial(idx)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">الاسم واللقب:</label>
                    <input
                      type="text"
                      value={testim.name || ''}
                      onChange={(e) => handleTestimonialChange(idx, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:border-brand-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">التخصص والصفة:</label>
                    <input
                      type="text"
                      value={testim.role || ''}
                      onChange={(e) => handleTestimonialChange(idx, 'role', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-brand-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">الولاية:</label>
                    <input
                      type="text"
                      value={testim.wilaya || ''}
                      onChange={(e) => handleTestimonialChange(idx, 'wilaya', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-brand-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">نص الرأي والشهادة:</label>
                    <textarea
                      rows={3}
                      value={testim.quote || ''}
                      onChange={(e) => handleTestimonialChange(idx, 'quote', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed focus:border-brand-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: FOOTER & CONTACT */}
      {activeTab === 'footer' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-emerald-400" />
            <span>معلومات التذييل ووسائل الاتصال وشبكات التواصل</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">رقم الهاتف للدعم السريري:</label>
              <input
                type="text"
                value={config.footer?.supportPhone || ''}
                onChange={(e) => updateField('footer', 'supportPhone', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">رقم الواتساب المباشر:</label>
              <input
                type="text"
                value={config.footer?.whatsapp || ''}
                onChange={(e) => updateField('footer', 'whatsapp', e.target.value)}
                placeholder="+213550000000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">البريد الإلكتروني الرسمي:</label>
              <input
                type="email"
                value={config.footer?.supportEmail || ''}
                onChange={(e) => updateField('footer', 'supportEmail', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">المقر والعنوان العيادي:</label>
              <input
                type="text"
                value={config.footer?.address || ''}
                onChange={(e) => updateField('footer', 'address', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 font-bold mb-1">نص حقوق النشر والملكية:</label>
              <input
                type="text"
                value={config.footer?.copyright || ''}
                onChange={(e) => updateField('footer', 'copyright', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">رابط صفحة فيسبوك:</label>
              <input
                type="text"
                value={config.footer?.socialFacebook || ''}
                onChange={(e) => updateField('footer', 'socialFacebook', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">رابط لينكد إن (LinkedIn):</label>
              <input
                type="text"
                value={config.footer?.socialLinkedIn || ''}
                onChange={(e) => updateField('footer', 'socialLinkedIn', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-brand-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
