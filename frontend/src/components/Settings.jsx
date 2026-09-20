import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tenantSettingsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import ClinicServicesManager from './settings/ClinicServicesManager';
import StaffManagementView from './settings/StaffManagementView';
import BackupManagerTab from './settings/BackupManagerTab';
import ClinicBrandingTab from './settings/ClinicBrandingTab';
import SubscriptionManagerTab from './subscription/SubscriptionManagerTab';
import DataExportModal from './common/DataExportModal';
import { 
  Building2, 
  Upload, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  MapPin, 
  FileBadge, 
  Globe, 
  Sparkles,
  Image as ImageIcon,
  ShieldCheck,
  BellRing,
  Clock,
  Layers,
  Activity,
  Coins,
  Sliders,
  Users,
  Database,
  FileSpreadsheet,
  CreditCard,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Share2,
  Smartphone,
  Tv,
  Printer
} from 'lucide-react';

export default function Settings() {
  const { t } = useTranslation();
  const { tenant, user } = useAuth();

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [clinicName, setClinicName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Link & QR Code State
  const [copiedKey, setCopiedKey] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalData, setQrModalData] = useState({ title: '', url: '' });

  // Clinical Re-assessment Threshold Settings
  const [reassessmentAlertEnabled, setReassessmentAlertEnabled] = useState(true);
  const [reassessmentSessionThreshold, setReassessmentSessionThreshold] = useState(10);
  const [reassessmentDaysThreshold, setReassessmentDaysThreshold] = useState(90);

  // Data Export Modal State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportModalDomain, setExportModalDomain] = useState('patients');

  const effectiveSubdomain = subdomain || tenant?.subdomain || user?.tenant?.subdomain || 'cabinet';
  const primaryClinicUrl = `https://${effectiveSubdomain}.psypro.tech`;
  const universalClinicUrl = `https://psypro.tech/c/${effectiveSubdomain}`;

  const copyToClipboard = (text, key = 'primary') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleShareWhatsApp = (url, title = 'بوابة حجز المواعيد والاستشارات') => {
    const text = `السلام عليكم ورحمة الله وبركاته،\nيسر ${clinicName || 'العيادة السريرية'} تزويدكم بـ ${title}:\n🔗 ${url}\n\nيمكنكم حجز المواعيد والاستشارات الطبية أونلاين مباشرة.`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const openQrModal = (title, url) => {
    setQrModalData({ title, url });
    setShowQrModal(true);
  };

  const clinicPortals = [
    {
      id: 'booking',
      title: 'بوابة حجز المواعيد واستقبال المرضى (Booking Portal)',
      desc: 'رابط صفحة الهبوط العامة لمرضاكم لاختيار التخصص وحجز المواعيد أونلاين.',
      url: primaryClinicUrl,
      altUrl: universalClinicUrl,
      badge: 'الرابط الرئيسي للعيادة',
      color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-300',
      icon: Globe,
    },
    {
      id: 'tv',
      title: 'شاشة تلفاز قاعة الانتظار الذكية (Waiting Room TV Queue)',
      desc: 'للعرض المباشر على شاشة التلفاز بالقاعة مع الترقيم والنداء الصوتي الآلي.',
      url: `${primaryClinicUrl}/tv`,
      altUrl: 'https://psypro.tech/tv',
      badge: 'قاعة الانتظار',
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300',
      icon: Tv,
    },
    {
      id: 'kiosk',
      title: 'كشك الحضور الذاتي بالاستقبال (Kiosk Check-in)',
      desc: 'شاشة التابلت أو البورن في مدخل العيادة لتسجيل وتأكيد حضور المرضى برقم الهاتف.',
      url: `${primaryClinicUrl}/kiosk`,
      altUrl: 'https://psypro.tech/kiosk',
      badge: 'تسجيل الحضور',
      color: 'from-indigo-500/20 to-violet-500/10 border-indigo-500/30 text-indigo-300',
      icon: Smartphone,
    },
    {
      id: 'portal',
      title: 'بوابة الأولياء والمتابعة المنزلية (Parent & Patient Portal)',
      desc: 'البوابة الرقمية للأولياء والمرضى لإنجاز الواجبات وتتبع الخطة العلاجية والتقارير.',
      url: 'https://psypro.tech/portal',
      altUrl: 'https://psypro.tech/pre-intake',
      badge: 'متابعة الأولياء',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300',
      icon: Users,
    },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tenantSettingsApi.getSettings();
      const tData = res.tenant || {};
      setClinicName(tData.name || '');
      setSubdomain(tData.subdomain || '');
      setPhone(tData.phone || '');
      setAddress(tData.address || '');
      setLicenseNumber(tData.license_number || '');
      setLogoUrl(tData.logo_url || '');

      setReassessmentAlertEnabled(tData.reassessment_alert_enabled ?? true);
      setReassessmentSessionThreshold(tData.reassessment_session_threshold ?? 10);
      setReassessmentDaysThreshold(tData.reassessment_days_threshold ?? 90);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('name', clinicName);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('license_number', licenseNumber);
      formData.append('reassessment_alert_enabled', reassessmentAlertEnabled ? '1' : '0');
      formData.append('reassessment_session_threshold', reassessmentSessionThreshold);
      formData.append('reassessment_days_threshold', reassessmentDaysThreshold);

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const res = await tenantSettingsApi.updateSettings(formData);
      setSuccessMsg(t('settings.saved_success') || 'Paramètres mis à jour avec succès.');
      if (res.tenant?.logo_url) {
        setLogoUrl(res.tenant.logo_url);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center space-x-2 space-x-reverse">
            <Building2 className="w-6 h-6 text-brand-400" />
            <span>{t('settings.title') || 'إعدادات وبيانات العيادة (Paramètres)'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('settings.subtitle') || 'الهوية البصرية، دليل الخدمات والتسعيرات، بيانات الاعتماد، وبروتوكولات التنبيه'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
              activeTab === 'general'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>هوية العيادة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('public_links')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
              activeTab === 'public_links'
                ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-md font-black ring-1 ring-teal-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-teal-300" />
            <span>🌐 روابط وبوابات العيادة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
              activeTab === 'services'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>دليل الخدمات والتسعيرات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
              activeTab === 'staff'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 طاقم العيادة والأذونات (RBAC)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reassessment')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
              activeTab === 'reassessment'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>بروتوكول إعادة التقييم</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
              activeTab === 'branding'
                ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>🎨 الهوية وترويسة PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backups')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
              activeTab === 'backups'
                ? 'bg-teal-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>💾 النسخ الاحتياطي (Backups)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 space-x-reverse ${
              activeTab === 'subscription'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-300" />
            <span>💳 ترخيص المنصة والاشتراك</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 CLINIC ACCESS HUB: Ravit al-3iyada wa al-tahiya (Direct Links & Public Portals) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden font-sans">
        {/* Top Glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                🟢 بوابة العيادة نشطة وتستقبل المرضى أونلاين
              </span>
              <span className="text-xs text-slate-400 font-mono">DZ-CLINIC-HUB</span>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-400" />
                <span>رابط العيادة الرسمي وبوابة حجز المواعيد للمرضى</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                شارك هذا الرابط مع مرضاك، ضعه في صفحتك على فيسبوك/إنستغرام، أو اطبعه كرمز QR على بطاقات العمل والاستقبال.
              </p>
            </div>

            {/* Live Link Box */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950 border border-slate-700/80 font-mono text-xs sm:text-sm font-black text-teal-300 flex items-center gap-1.5 select-all shadow-inner" dir="ltr">
                <span className="text-slate-500 text-xs">https://</span>
                <span className="text-white font-bold">{effectiveSubdomain}</span>
                <span className="text-teal-400">.psypro.tech</span>
              </div>
              <span className="text-[11px] text-slate-400 font-sans">أو الرابط المباشر:</span>
              <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-400 select-all" dir="ltr">
                {universalClinicUrl}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => copyToClipboard(primaryClinicUrl, 'hero_primary')}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black transition flex items-center gap-1.5 border border-slate-700 shadow-md active:scale-95"
            >
              {copiedKey === 'hero_primary' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">تم نسخ الرابط!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-teal-400" />
                  <span>نسخ الرابط</span>
                </>
              )}
            </button>

            <a
              href={primaryClinicUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-teal-600/30 active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>معاينة الرابط ↗</span>
            </a>

            <button
              type="button"
              onClick={() => handleShareWhatsApp(primaryClinicUrl, 'بوابة حجز المواعيد والاستشارات')}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95"
              title="مشاركة عبر واتساب"
            >
              <Share2 className="w-4 h-4" />
              <span>واتساب</span>
            </button>

            <button
              type="button"
              onClick={() => openQrModal(`رابط عيادة ${clinicName || 'العيادة'}`, primaryClinicUrl)}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-md active:scale-95"
              title="عرض رمز QR"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>رمز QR</span>
            </button>
          </div>
        </div>

        {/* 4 Clinic Portals Quick Drawer */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>جميع بوابات وشاشات العيادة المتاحة للتهيئة والاستخدام:</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">4 Public Clinical Portals</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {clinicPortals.map((portal) => {
              const Icon = portal.icon;
              return (
                <div
                  key={portal.id}
                  className={`p-3.5 rounded-2xl bg-gradient-to-br ${portal.color} border space-y-2.5 transition-all hover:border-teal-500/50 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-slate-300">
                        {portal.badge}
                      </span>
                      <Icon className="w-4 h-4 text-teal-400 shrink-0" />
                    </div>
                    <h4 className="text-xs font-black text-white line-clamp-1">{portal.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 mt-1">{portal.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(portal.url, portal.id)}
                      className="text-[10px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition"
                    >
                      {copiedKey === portal.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                      <span>{copiedKey === portal.id ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>

                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition underline"
                    >
                      <span>فتح</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TAB: PUBLIC LINKS & ONBOARDING (DEDICATED FULL VIEW) */}
      {activeTab === 'public_links' && (
        <div className="space-y-6 animate-fade-in font-sans">
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-teal-400" />
                  <span>دليل مشاركة وتهيئة روابط العيادة السريرية</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  كيف تنشر روابط عيادتك على الإنترنت وتسهّل وصول المرضى إلى خدماتك
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                جاهز للنشر 🚀
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">1</span>
                  <h4 className="text-xs font-bold text-white">صفحة فيسبوك / إنستغرام (Social Media Bio)</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ضع الرابط المباشر في خانة "الموقع الإلكتروني" في صفحتك المهنية لتمكين المتابعين من حجز المواعيد بنقرة واحدة:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={primaryClinicUrl}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-teal-300 text-xs font-mono select-all"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(primaryClinicUrl, 'bio_link')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white shrink-0"
                  >
                    {copiedKey === 'bio_link' ? 'تم النسخ' : 'نسخ'}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">2</span>
                  <h4 className="text-xs font-bold text-white">رمز الاستجابة السريعة لمكتب الاستقبال (QR Code)</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  اطبع رمز QR المخصص وضعه على مكتب السكرتارية أو قاعة الانتظار ليتيح للزوار مسحه بهواتفهم وحجز مواعيدهم القادمة:
                </p>
                <button
                  type="button"
                  onClick={() => openQrModal(`رمز QR لعيادة ${clinicName || 'العيادة'}`, primaryClinicUrl)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center gap-2 shadow"
                >
                  <QrCode className="w-4 h-4" />
                  <span>عرض وطباعة كود QR الآن</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Clinic Branding & Letterhead Customizer */}
      {activeTab === 'branding' && (
        <ClinicBrandingTab />
      )}

      {/* TAB 2: Dynamic Services & Rates Manager */}
      {activeTab === 'services' && (
        <ClinicServicesManager tenant={tenant} />
      )}

      {/* TAB 3: Clinic Staff & RBAC Permissions Manager */}
      {activeTab === 'staff' && (
        <StaffManagementView user={user} tenant={tenant} />
      )}

      {/* TAB 4: Automated Backups & Archive Management */}
      {activeTab === 'backups' && (
        <BackupManagerTab
          onOpenExportModal={(domain = 'patients') => {
            setExportModalDomain(domain);
            setExportModalOpen(true);
          }}
        />
      )}

      {/* TAB 6: Platform Subscription & Payment Management */}
      {activeTab === 'subscription' && (
        <SubscriptionManagerTab />
      )}

      {/* TAB 1 & 5: General Settings & Reassessment Protocol */}
      {activeTab !== 'branding' && activeTab !== 'services' && activeTab !== 'staff' && activeTab !== 'backups' && activeTab !== 'subscription' && activeTab !== 'public_links' && (
        <>
          {/* Alerts */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 space-x-reverse animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2 space-x-reverse animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              {t('common.loading') || 'Chargement...'}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {activeTab === 'general' && (
                <>
                  {/* 1. Logo & Visual Identity */}
                  <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2 space-x-reverse">
                      <ImageIcon className="w-4 h-4 text-brand-400" />
                      <span>{t('settings.branding_title') || 'Identité Visuelle & Logo'}</span>
                    </h3>

                    <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                      <div className="w-28 h-28 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
                        {previewUrl || logoUrl ? (
                          <img
                            src={previewUrl || logoUrl}
                            alt="Logo Cabinet"
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <div className="text-center p-2">
                            <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                            <span className="text-[10px] text-slate-500 block">{t('settings.no_logo') || 'Aucun logo'}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 flex-1 text-right sm:text-right">
                        <label className="block text-xs font-semibold text-slate-300">
                          {t('settings.upload_logo_label') || 'Téléverser le logo officiel du cabinet'}
                        </label>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          onChange={handleLogoChange}
                          className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-600/20 file:text-brand-300 hover:file:bg-brand-600/30 file:cursor-pointer cursor-pointer"
                        />
                        <p className="text-[11px] text-slate-500">
                          {t('settings.logo_hint') || 'Formats acceptés : PNG, JPG, WebP, SVG. Taille max : 2 Mo. Apparaîtra sur vos bilans et ordonnances PDF.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Clinic Details */}
                  <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2 space-x-reverse">
                      <Building2 className="w-4 h-4 text-brand-400" />
                      <span>{t('settings.clinic_info_title') || 'Informations Officielles du Cabinet'}</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {t('settings.clinic_name_label') || 'Nom du cabinet / Centre'} *
                        </label>
                        <input
                          type="text"
                          required
                          value={clinicName}
                          onChange={(e) => setClinicName(e.target.value)}
                          placeholder="Cabinet d'Orthophonie & Psychologie"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                          <span>{t('settings.subdomain_label') || 'رابط ونطاق العيادة (Subdomain)'}</span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('public_links')}
                            className="text-[10px] text-teal-400 hover:text-teal-300 underline font-normal"
                          >
                            عرض كافة البوابات والروابط ➔
                          </button>
                        </label>
                        <div className="flex items-center space-x-1.5 space-x-reverse">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              disabled
                              value={primaryClinicUrl}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-teal-500/30 text-teal-300 text-xs cursor-text font-mono select-all font-semibold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(primaryClinicUrl, 'subdomain_input')}
                            title="نسخ الرابط المباشر"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center shrink-0"
                          >
                            {copiedKey === 'subdomain_input' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={primaryClinicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="فتح بوابة العيادة للمرضى"
                            className="p-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 transition-colors flex items-center justify-center shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          المعرف الفريد: <span className="text-slate-300 font-mono font-bold">{effectiveSubdomain}</span> (رابط العيادة الرسمي لحجز المواعيد واستقبال المرضى).
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {t('settings.phone_label') || 'Téléphone de contact'}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="023 12 34 56 / 0555 12 34 56"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {t('settings.license_label') || 'Numéro d\'agrément DSP'}
                        </label>
                        <input
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="DSP/16/2023/104"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {t('settings.address_label') || 'Adresse complète du cabinet'}
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="14 Rue Didouche Mourad, Alger Centre"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'reassessment' && (
                /* 3. Clinical Re-assessment Thresholds & Protocols */
                <div className="glass-card rounded-3xl p-6 border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 space-x-reverse">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        <BellRing className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-white">
                          {t('reassessment.reassessment_settings_title') || 'بروتوكول وإعدادات إعادة التقييم الدوري (Re-assessment Protocols)'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          تخصيص شروط إصدار التنبيهات السريرية الآلية في لوحة التحكم وجدول المواعيد
                        </p>
                      </div>
                    </div>

                    {/* Master Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reassessmentAlertEnabled}
                        onChange={(e) => setReassessmentAlertEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {reassessmentAlertEnabled ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                      {/* Session Threshold */}
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5 space-x-reverse">
                            <Layers className="w-4 h-4 text-amber-400" />
                            <span>تنبيه بعد إتمام عدد جلسات (Sessions) :</span>
                          </label>
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {reassessmentSessionThreshold} جلسات
                          </span>
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={reassessmentSessionThreshold}
                          onChange={(e) => setReassessmentSessionThreshold(parseInt(e.target.value || 1, 10))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500"
                        />
                        <p className="text-[10px] text-slate-400">
                          {t('reassessment.reassessment_sessions_hint') || 'إظهار شارة تنبيه عندما يكمل المريض هذا العدد من الجلسات العلاجية منذ آخر تقييم سريري (الافتراضي: 10).'}
                        </p>
                      </div>

                      {/* Days Threshold */}
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5 space-x-reverse">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span>تنبيه بعد انقضاء مدة بالأيام (Jours) :</span>
                          </label>
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {reassessmentDaysThreshold} يوماً (~{Math.round(reassessmentDaysThreshold / 30)} أشهر)
                          </span>
                        </div>
                        <input
                          type="number"
                          min="7"
                          max="365"
                          value={reassessmentDaysThreshold}
                          onChange={(e) => setReassessmentDaysThreshold(parseInt(e.target.value || 7, 10))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500"
                        />
                        <p className="text-[10px] text-slate-400">
                          {t('reassessment.reassessment_days_hint') || 'إظهار تنبيه عندما تمضي هذه المدة على آخر تقييم لمريض نشط في العيادة (الافتراضي: 90 يوماً / 3 أشهر).'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                      ⚠️ {t('reassessment.reassessment_disabled_notice') || 'تم تعطيل تنبيهات إعادة التقييم الآلية لهذا الحساب.'}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 flex items-center space-x-2 space-x-reverse transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? (t('settings.saving') || 'Enregistrement...') : (t('settings.save_button') || 'Enregistrer les Modifications')}</span>
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* Global Data Export Modal */}
      <DataExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        initialDomain={exportModalDomain}
      />

      {/* QR Code Modal for In-Clinic Desk & Print */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                <QrCode className="w-4 h-4 text-teal-400" />
                <span>رمز الاستجابة السريعة (QR Code)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              {qrModalData.title}
            </p>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrModalData.url)}&color=0f172a&bgcolor=ffffff`}
                alt="QR Code"
                className="w-48 h-48 block mx-auto"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="text-[10px] text-slate-400 break-all font-mono select-all">
                {qrModalData.url}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(qrModalData.url, 'modal_qr')}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 space-x-reverse border border-slate-700"
              >
                {copiedKey === 'modal_qr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'modal_qr' ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 space-x-reverse shadow-lg shadow-teal-500/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الرمز</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
