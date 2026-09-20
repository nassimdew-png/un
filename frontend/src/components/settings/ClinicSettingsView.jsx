import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Globe,
  Save,
  Palette,
  Phone,
  MapPin,
  FileText,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Monitor,
  Upload,
  Image as ImageIcon,
  Stamp,
  PenTool,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  Layout,
  SlidersHorizontal,
  Check,
  RefreshCw,
  Printer,
  Shield,
  Award,
  User,
  Mail,
  UserCheck,
  Lock,
  Clock,
  Calendar,
  DollarSign,
  CreditCard,
  MessageSquare,
  Bell,
  Share2,
  Users,
  Download,
  Database,
  HardDrive,
  Brain,
  Volume2,
  HelpCircle,
  CheckSquare,
  Smartphone,
  Send,
  Zap,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  QrCode,
  Stethoscope,
  Activity,
  Video
} from 'lucide-react';
import { clinicBrandingApi, clinicConfigApi, userProfileApi } from '../../api';

export default function ClinicSettingsView({ tenant, user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('branding'); 
  // 'branding' | 'landing_page' | 'working_hours' | 'tarification' | 'whatsapp_rules' | 'parent_portal' | 'ai_preferences' | 'backup_export' | 'profile'

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // ==========================================
  // LANDING PAGE & ONLINE BOOKING STATE
  // ==========================================
  const [landingPage, setLandingPage] = useState({
    enabled: true,
    hero_headline: 'بوابة حجز المواعيد والاستشارات السريرية المعتمدة',
    public_bio: tenant?.public_bio || 'عيادة متخصصة ومعتمدة مجهزة بأحدث أدوات التقييم السريري والتأهيل العصبي واللغوي.',
    primary_cta_text: 'احجز موعدك الآن أونلاين',
    announcement_bar: '',
    show_pricing: true,
    show_working_hours: true,
    show_practitioners: true,
    show_whatsapp_button: true,
    require_parent_name: false,
    services: {
      bilan: true,
      reeducation: true,
      consultation: true,
      teletherapy: true,
    },
  });

  const handleCopyLink = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // ==========================================
  // 1. BRANDING & A4 EN-TÊTE STATE
  // ==========================================
  const [brandingData, setBrandingData] = useState({
    name: tenant?.name || 'عيادة الأمل للأرطوفونيا وعلم النفس',
    license_number: 'DZ-MSPRH-2026/884',
    official_title_ar: 'عيادة ومخبر الفحوصات والتشخيص السريري والتأهيلي',
    official_title_fr: 'Cabinet Médical Spécialisé en Orthophonie et Psychologie',
    phone: tenant?.phone || '0559 22 33 44',
    address: tenant?.address || 'حي 500 مسكن - عمارة B، بئر مراد رايس',
    wilaya: tenant?.wilaya || '16 - الجزائر العاصمة',
    primary_color: '#2563eb',
    secondary_color: '#06b6d4',
    header_layout: 'modern_split', // 'modern_split' | 'centered_minimal' | 'classic_boxed'
    show_watermark: true,
    show_stamp_on_bilans: true,
    kiosk_pin: '1234',
    kiosk_enabled: true,
    reassessment_days_threshold: 90,
    footer_text: 'وثيقة طبية وسريرية رسمية صادرة عن منظومة السجلات الرقمية PsySnap • صالحة للإجراءات الإدارية والمدرسية',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [stampFile, setStampFile] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  const logoInputRef = useRef(null);
  const stampInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  // ==========================================
  // 2. WORKING HOURS & APPOINTMENTS STATE
  // ==========================================
  const [workingHours, setWorkingHours] = useState({
    days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'saturday'],
    open_time: '08:30',
    close_time: '17:00',
    slot_duration: 45,
    buffer_time: 10,
    max_daily_patients: 12,
  });

  // ==========================================
  // 3. TARIFICATION & BILLING STATE
  // ==========================================
  const [tarification, setTarification] = useState({
    currency: 'DZD',
    bilan_initial_fee: 3500,
    therapy_session_fee: 2000,
    teletherapy_fee: 2500,
    group_session_fee: 1500,
    accepted_payment_methods: ['cash', 'baridimob', 'ccp', 'cheque'],
    baridimob_rip: '00799999000000000000',
    invoice_prefix: 'FAC-2026-',
    receipt_prefix: 'REC-',
  });

  // ==========================================
  // 4. WHATSAPP AUTOMATION STATE
  // ==========================================
  const [whatsappAutomation, setWhatsappAutomation] = useState({
    auto_appointment_reminders: true,
    reminder_timing_hours: 24, // 24 or 0 (morning)
    auto_send_homework_summary: true,
    send_on_session_complete: true,
    auto_absence_chaser: true,
  });

  // ==========================================
  // 5. PARENT PORTAL POLICIES STATE
  // ==========================================
  const [parentPortal, setParentPortal] = useState({
    enabled: true,
    allow_download_bilans_pdf: true,
    allow_view_homework: true,
    allow_parent_audio_uploads: true,
    magic_link_expiry_days: 30,
  });

  // ==========================================
  // 6. AI CLINICAL PREFERENCES STATE
  // ==========================================
  const [aiPreferences, setAiPreferences] = useState({
    default_language: 'darja', // 'darja' | 'arabic' | 'french'
    bilan_tone: 'clinical_detailed', // 'clinical_detailed' | 'pedagogical' | 'parent_friendly'
    red_alert_audio_enabled: true,
  });

  // ==========================================
  // 7. PRACTITIONER PROFILE & SECURITY STATE
  // ==========================================
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialty: user?.specialty || 'أخصائي أرطوفونيا وتخاطب (Orthophoniste)',
    specialty_license_number: user?.specialty_license_number || '',
    role: user?.role || 'clinic_admin',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [exportStats, setExportStats] = useState({
    patients_count: 0,
    appointments_count: 0,
    invoices_count: 0,
    bilans_count: 0,
  });

  const specialtyPresets = [
    'أخصائي أرطوفونيا وتخاطب (Orthophoniste)',
    'طبيب / أخصائي نفساني عيادي (Psychologue Clinicien)',
    'أخصائي نفسي حركي (Psychomotricien)',
    'طبيب نفسي / أعصاب (Neuro-Psychiatre)',
    'أخصائي علاج وظيفي (Ergothérapeute)',
    'مربي ومعالج سلوكي (Éducateur Spécialisé / ABA)',
    'طبيب عام واستشارات طبية (Médecin Généraliste)',
  ];

  const colorPresets = [
    { name: 'أزرق ملكي', primary: '#2563eb', secondary: '#06b6d4' },
    { name: 'فيروزي سريري', primary: '#0d9488', secondary: '#14b8a6' },
    { name: 'نيلي طبي', primary: '#4f46e5', secondary: '#818cf8' },
    { name: 'زمردي صحي', primary: '#059669', secondary: '#34d399' },
    { name: 'بنفسجي راقٍ', primary: '#7c3aed', secondary: '#c084fc' },
    { name: 'كحلي داكن', primary: '#0f172a', secondary: '#475569' },
  ];

  const weekDays = [
    { key: 'saturday', label: 'السبت' },
    { key: 'sunday', label: 'الأحد' },
    { key: 'monday', label: 'الإثنين' },
    { key: 'tuesday', label: 'الثلاثاء' },
    { key: 'wednesday', label: 'الأربعاء' },
    { key: 'thursday', label: 'الخميس' },
    { key: 'friday', label: 'الجمعة' },
  ];

  // Fetch all Clinic Configurations on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [brandingRes, configRes, profileRes] = await Promise.allSettled([
          clinicBrandingApi.getBranding(),
          clinicConfigApi.getConfig(),
          userProfileApi.getProfile(),
        ]);

        if (brandingRes.status === 'fulfilled' && brandingRes.value?.settings) {
          const res = brandingRes.value;
          setBrandingData((prev) => ({
            ...prev,
            ...res.settings,
            name: res.tenant?.name || prev.name,
          }));
          if (res.settings.logo_url) setLogoPreview(res.settings.logo_url);
          if (res.settings.stamp_url) setStampPreview(res.settings.stamp_url);
          if (res.settings.signature_url) setSignaturePreview(res.settings.signature_url);
        }

        if (configRes.status === 'fulfilled' && configRes.value?.config) {
          const cfg = configRes.value.config;
          if (cfg.landing_page) setLandingPage((prev) => ({ ...prev, ...cfg.landing_page }));
          if (cfg.working_hours) setWorkingHours((prev) => ({ ...prev, ...cfg.working_hours }));
          if (cfg.tarification) setTarification((prev) => ({ ...prev, ...cfg.tarification }));
          if (cfg.whatsapp_automation) setWhatsappAutomation((prev) => ({ ...prev, ...cfg.whatsapp_automation }));
          if (cfg.parent_portal) setParentPortal((prev) => ({ ...prev, ...cfg.parent_portal }));
          if (cfg.ai_preferences) setAiPreferences((prev) => ({ ...prev, ...cfg.ai_preferences }));
        }

        if (profileRes.status === 'fulfilled' && profileRes.value?.user) {
          const u = profileRes.value.user;
          setProfileData({
            name: u.name || '',
            email: u.email || '',
            phone: u.phone || '',
            specialty: u.specialty || 'أخصائي أرطوفونيا وتخاطب (Orthophoniste)',
            specialty_license_number: u.specialty_license_number || '',
            role: u.role || 'clinic_admin',
          });
        }
      } catch (err) {
        console.error('Failed to load clinic settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handlers for Branding Uploads
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleStampChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStampFile(file);
      setStampPreview(URL.createObjectURL(file));
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setBrandingData((prev) => ({ ...prev, logo_url: 'DELETE' }));
  };

  const handleRemoveStamp = () => {
    setStampFile(null);
    setStampPreview(null);
    setBrandingData((prev) => ({ ...prev, stamp_url: 'DELETE' }));
  };

  const handleRemoveSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
    setBrandingData((prev) => ({ ...prev, signature_url: 'DELETE' }));
  };

  // Submit Branding Tab
  const handleBrandingSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const data = new FormData();
      Object.keys(brandingData).forEach((key) => {
        data.append(key, brandingData[key]);
      });

      if (logoFile) data.append('logo', logoFile);
      if (stampFile) data.append('stamp', stampFile);
      if (signatureFile) data.append('signature', signatureFile);

      const res = await clinicBrandingApi.updateBranding(data);
      setFeedback({ type: 'success', text: res.message || 'تم حفظ وتطبيق الهوية البصرية بنجاح!' });

      if (res.settings) {
        if (res.settings.logo_url) setLogoPreview(res.settings.logo_url);
        if (res.settings.stamp_url) setStampPreview(res.settings.stamp_url);
        if (res.settings.signature_url) setSignaturePreview(res.settings.signature_url);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ إعدادات الهوية البصرية.' });
    } finally {
      setSaving(false);
    }
  };

  // Submit Configuration Tabs (Landing Page, Working Hours, Tarification, WhatsApp, Parent Portal, AI)
  const handleConfigSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        landing_page: landingPage,
        working_hours: workingHours,
        tarification: tarification,
        whatsapp_automation: whatsappAutomation,
        parent_portal: parentPortal,
        ai_preferences: aiPreferences,
      };

      const res = await clinicConfigApi.updateConfig(payload);
      setFeedback({ type: 'success', text: res.message || 'تم حفظ وتطبيق إعدادات العيادة بنجاح! ✨' });
    } catch (err) {
      console.error('Save config failed:', err);
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الإعدادات.' });
    } finally {
      setSaving(false);
    }
  };

  // Submit Profile & Password
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await userProfileApi.updateProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        specialty: profileData.specialty,
        specialty_license_number: profileData.specialty_license_number,
      });

      setFeedback({ type: 'success', text: res.message || 'تم تحديث بيانات الملف الشخصي بنجاح!' });
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          localStorage.setItem('user', JSON.stringify({ ...parsed, ...res.user }));
        } catch {}
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      setFeedback({ type: 'error', text: err.message || 'فشل تحديث الملف الشخصي.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (passwordData.new_password.length < 6) {
      setFeedback({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تتكون من 6 أحرف على الأقل.' });
      return;
    }

    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setFeedback({ type: 'error', text: 'تأكيد كلمة المرور الجديدة غير متطابق.' });
      return;
    }

    setSaving(true);

    try {
      const res = await userProfileApi.updatePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.new_password_confirmation,
      });

      setFeedback({ type: 'success', text: res.message || 'تم تغيير كلمة المرور وتأمين الحساب بنجاح!' });
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (err) {
      console.error('Password update failed:', err);
      setFeedback({ type: 'error', text: err.message || 'فشل تغيير كلمة المرور. تأكد من صحة كلمة المرور الحالية.' });
    } finally {
      setSaving(false);
    }
  };

  // Helper toggle for working days
  const toggleWorkingDay = (dayKey) => {
    setWorkingHours((prev) => {
      const exists = prev.days.includes(dayKey);
      const newDays = exists ? prev.days.filter((d) => d !== dayKey) : [...prev.days, dayKey];
      return { ...prev, days: newDays };
    });
  };

  // Helper toggle for payment methods
  const togglePaymentMethod = (methodKey) => {
    setTarification((prev) => {
      const exists = prev.accepted_payment_methods.includes(methodKey);
      const newMethods = exists
        ? prev.accepted_payment_methods.filter((m) => m !== methodKey)
        : [...prev.accepted_payment_methods, methodKey];
      return { ...prev, accepted_payment_methods: newMethods };
    });
  };

  // Trigger JSON Export Download
  const handleExportJson = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
    const url = `/api/clinic/export-data?format=json`;
    
    // Create anchor link to trigger browser download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `clinic_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* ========================================================================= */}
      {/* HEADER BANNER & ACTION BAR                                               */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>CLINIC OPERATIONAL SETTINGS & CONTROL SUITE</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {activeTab === 'branding' ? 'A4 Live Preview 📄' : 'Active Module ⚡'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {activeTab === 'branding' && 'الهوية البصرية وترويسة التقارير الطبية (A4)'}
              {activeTab === 'landing_page' && 'إعدادات صفحة الهبوط وحجز المواعيد أونلاين'}
              {activeTab === 'working_hours' && 'أوقات العمل وجدولة حصص المواعيد'}
              {activeTab === 'tarification' && 'التسعير السريري والفوترة وطرق الدفع'}
              {activeTab === 'whatsapp_rules' && 'أتمتة رسائل واتساب والتذكيرات الذكية'}
              {activeTab === 'parent_portal' && 'سياسات وتصاريح بوابة الأولياء والمتابعة المنزلية'}
              {activeTab === 'ai_preferences' && 'تفضيلات الذكاء الاصطناعي السريري والإنذارات'}
              {activeTab === 'backup_export' && 'النسخ الاحتياطي وتصدير السجلات السريرية'}
              {activeTab === 'profile' && 'الملف المهني للمختص وأمان كلمة المرور'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              تخصيص شامل لجميع العمليات السريرية، تسعير الجلسات، قواعد التواصل عبر WhatsApp، إدارة السجلات، وأمان حساب المختص.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/settings/domains')}
              className="px-4 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center space-x-2 space-x-reverse"
            >
              <Globe className="w-4 h-4" />
              <span>🌐 النطاق وSSL</span>
            </button>

            {activeTab === 'branding' && (
              <button
                type="button"
                onClick={handleBrandingSubmit}
                disabled={saving}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-xl shadow-indigo-600/30 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : '💾 حفظ الهوية البصرية'}</span>
              </button>
            )}

            {['landing_page', 'working_hours', 'tarification', 'whatsapp_rules', 'parent_portal', 'ai_preferences'].includes(activeTab) && (
              <button
                type="button"
                onClick={handleConfigSubmit}
                disabled={saving}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-xl shadow-emerald-600/30 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : '💾 تطبيق التغييرات'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 9-TAB NAVIGATION BAR                                                     */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => { setActiveTab('branding'); setFeedback(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'branding'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Palette className="w-4 h-4 text-indigo-300" />
            <span>الهوية وترويسة A4</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('landing_page'); setFeedback(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'landing_page'
                ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-lg shadow-teal-600/30 border border-teal-400'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-teal-300" />
            <span>صفحة الهبوط والمواعيد 🌐</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('working_hours'); setFeedback(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'working_hours'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-300" />
            <span>أوقات العمل والمواعيد</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('tarification'); setFeedback(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'tarification'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-300" />
            <span>التسعير والمدفوعات</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('whatsapp_rules'); setFeedback(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'whatsapp_rules'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>أتمتة WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('parent_portal'); setFeedback(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'parent_portal'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-amber-300" />
            <span>بوابة الأولياء</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('ai_preferences'); setFeedback(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'ai_preferences'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-300" />
            <span>الذكاء الاصطناعي</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('backup_export'); setFeedback(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'backup_export'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-blue-300" />
            <span>النسخ وتصدير البيانات</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setFeedback(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-yellow-300" />
            <span>الملف المهني والأمان</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 bg-indigo-950/70 text-indigo-300 hover:text-white border border-indigo-500/30 hover:bg-indigo-900/50"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>الأدوار والصلاحيات (فريق العمل) 👥</span>
          </button>

        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            {feedback.text}
          </span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: BRANDING & A4 LIVE STUDIO                                         */}
      {/* ========================================================================= */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* RIGHT PANEL: Controls & Uploads (7 Cols on XL) */}
          <div className="xl:col-span-7 space-y-6">
            <form onSubmit={handleBrandingSubmit} className="space-y-6">
              {/* 1. Upload Assets Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>1. الأصول البصرية (الشعار، الختم الطبي، التوقيع)</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Logo Upload */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col justify-between items-center text-center space-y-3">
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-indigo-400" />
                      <span>شعار العيادة (Logo)</span>
                    </div>

                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 flex items-center justify-center overflow-hidden relative bg-slate-900 group">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">لا يوجد شعار</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition"
                      >
                        رفع شعار
                      </button>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition"
                          title="حذف الشعار"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stamp Upload */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col justify-between items-center text-center space-y-3">
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Stamp className="w-4 h-4 text-indigo-400" />
                      <span>الختم الدائري (Cachet)</span>
                    </div>

                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-700 hover:border-indigo-500 flex items-center justify-center overflow-hidden relative bg-slate-900 group">
                      {stampPreview ? (
                        <img src={stampPreview} alt="Stamp" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">لا يوجد ختم</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="file"
                        ref={stampInputRef}
                        onChange={handleStampChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => stampInputRef.current?.click()}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition"
                      >
                        رفع الختم
                      </button>
                      {stampPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveStamp}
                          className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition"
                          title="حذف الختم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Signature Upload */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col justify-between items-center text-center space-y-3">
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-indigo-400" />
                      <span>توقيع الطبيب المشرف</span>
                    </div>

                    <div className="w-24 h-16 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 flex items-center justify-center overflow-hidden relative bg-slate-900 group">
                      {signaturePreview ? (
                        <img src={signaturePreview} alt="Signature" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">لا يوجد توقيع</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="file"
                        ref={signatureInputRef}
                        onChange={handleSignatureChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition"
                      >
                        رفع التوقيع
                      </button>
                      {signaturePreview && (
                        <button
                          type="button"
                          onClick={handleRemoveSignature}
                          className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition"
                          title="حذف التوقيع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Official Clinical Information */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>2. البيانات الرسمية للعيادة والترخيص</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">اسم العيادة / المركز الطبي الرسمي</label>
                    <input
                      type="text"
                      value={brandingData.name}
                      onChange={(e) => setBrandingData({ ...brandingData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">رقم الاعتماد / رخصة الممارسة (MSPRH)</label>
                    <input
                      type="text"
                      value={brandingData.license_number}
                      onChange={(e) => setBrandingData({ ...brandingData, license_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">الصفة واللقب الرسمي (بالعربية)</label>
                    <input
                      type="text"
                      value={brandingData.official_title_ar}
                      onChange={(e) => setBrandingData({ ...brandingData, official_title_ar: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">الصفة واللقب الرسمي (بالفرنسية)</label>
                    <input
                      type="text"
                      value={brandingData.official_title_fr}
                      onChange={(e) => setBrandingData({ ...brandingData, official_title_fr: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">هاتف العيادة المباشر</label>
                    <input
                      type="text"
                      value={brandingData.phone}
                      onChange={(e) => setBrandingData({ ...brandingData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">الولاية والموقع</label>
                    <input
                      type="text"
                      value={brandingData.wilaya}
                      onChange={(e) => setBrandingData({ ...brandingData, wilaya: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-slate-300 font-bold">العنوان التفصيلي للعيادة</label>
                    <input
                      type="text"
                      value={brandingData.address}
                      onChange={(e) => setBrandingData({ ...brandingData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-slate-300 font-bold">نص التذييل القانوني في أسفل التقارير (Footer Note)</label>
                    <textarea
                      rows={2}
                      value={brandingData.footer_text}
                      onChange={(e) => setBrandingData({ ...brandingData, footer_text: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Color Palette & Layout Styles */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <span>3. لوحة الألوان والنسق البصري للترويسة</span>
                </h2>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 font-bold block mb-2">نماذج الألوان المعتمدة:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setBrandingData({ ...brandingData, primary_color: preset.primary, secondary_color: preset.secondary })}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                            brandingData.primary_color === preset.primary
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-200">{preset.name}</span>
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.secondary }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 font-bold block mb-2">نمط تصميم الترويسة (Header Layout):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setBrandingData({ ...brandingData, header_layout: 'modern_split' })}
                        className={`p-3 rounded-2xl border text-right transition ${
                          brandingData.header_layout === 'modern_split'
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs mb-1">عصري منقسم (Modern Split)</div>
                        <div className="text-[10px] text-slate-400">شعار على الطرفين مع خط تدرج لوني طبي</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBrandingData({ ...brandingData, header_layout: 'centered_minimal' })}
                        className={`p-3 rounded-2xl border text-right transition ${
                          brandingData.header_layout === 'centered_minimal'
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs mb-1">مركزي ناعم (Centered Minimal)</div>
                        <div className="text-[10px] text-slate-400">شعار في الوسط وعناوين رأسية أنيقة</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBrandingData({ ...brandingData, header_layout: 'classic_boxed' })}
                        className={`p-3 rounded-2xl border text-right transition ${
                          brandingData.header_layout === 'classic_boxed'
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs mb-1">كلاسيكي مؤطر (Classic Boxed)</div>
                        <div className="text-[10px] text-slate-400">إطار كلاسيكي مزدوج مناسب للمستشفيات</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* LEFT PANEL: Live A4 Document Canvas Preview (5 Cols on XL) */}
          <div className="xl:col-span-5 sticky top-6 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>معاينة حية للترويسة في الحصائل (A4 Real-time)</span>
              </span>
              <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Format A4 Standard
              </span>
            </div>

            {/* A4 Paper Mockup */}
            <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-300 relative overflow-hidden font-sans min-h-[620px] flex flex-col justify-between">
              {/* Watermark Logo */}
              {brandingData.show_watermark && logoPreview && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                  <img src={logoPreview} alt="Watermark" className="w-72 h-72 object-contain" />
                </div>
              )}

              {/* Header Preview */}
              <div>
                {brandingData.header_layout === 'modern_split' && (
                  <div className="border-b-2 pb-4 space-y-2" style={{ borderColor: brandingData.primary_color }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5 text-right">
                        <h2 className="text-sm font-black tracking-tight" style={{ color: brandingData.primary_color }}>
                          {brandingData.name}
                        </h2>
                        <div className="text-[10px] font-bold text-slate-700">{brandingData.official_title_ar}</div>
                        <div className="text-[9px] font-mono text-slate-500">رقم الاعتماد: {brandingData.license_number}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        {logoPreview && (
                          <img src={logoPreview} alt="Logo" className="w-14 h-14 object-contain" />
                        )}
                      </div>

                      <div className="space-y-0.5 text-left font-sans" dir="ltr">
                        <div className="text-[11px] font-black text-slate-800">RÉPUBLIQUE ALGÉRIENNE</div>
                        <div className="text-[9px] font-semibold text-slate-600">{brandingData.official_title_fr}</div>
                        <div className="text-[8px] text-slate-500">Tél: {brandingData.phone}</div>
                      </div>
                    </div>

                    <div
                      className="h-1 rounded-full w-full"
                      style={{
                        background: `linear-gradient(to right, ${brandingData.primary_color}, ${brandingData.secondary_color})`,
                      }}
                    />
                  </div>
                )}

                {brandingData.header_layout === 'centered_minimal' && (
                  <div className="text-center pb-4 border-b space-y-2 border-slate-300">
                    {logoPreview && (
                      <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain mx-auto" />
                    )}
                    <h2 className="text-base font-black" style={{ color: brandingData.primary_color }}>
                      {brandingData.name}
                    </h2>
                    <div className="text-[10px] font-bold text-slate-700">
                      {brandingData.official_title_ar} &bull; {brandingData.official_title_fr}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500">
                      الجمهورية الجزائرية الديمقراطية الشعبية &bull; رخصة رقم: {brandingData.license_number}
                    </div>
                  </div>
                )}

                {brandingData.header_layout === 'classic_boxed' && (
                  <div className="border-2 p-3 rounded-xl mb-4 border-slate-800 space-y-1 text-center">
                    <div className="flex items-center justify-between">
                      {logoPreview && <img src={logoPreview} alt="Logo" className="w-12 h-12 object-contain" />}
                      <div>
                        <h2 className="text-sm font-black text-slate-900">{brandingData.name}</h2>
                        <div className="text-[10px] font-bold">{brandingData.official_title_ar}</div>
                      </div>
                      <div className="w-12" />
                    </div>
                    <div className="text-[8px] text-slate-600 border-t pt-1 mt-1 border-slate-300">
                      رخصة الاعتماد: {brandingData.license_number} &bull; {brandingData.address}
                    </div>
                  </div>
                )}

                {/* Dummy Report Preview */}
                <div className="py-4 space-y-3 text-[10px] text-slate-800 leading-relaxed">
                  <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg font-bold border border-slate-200">
                    <span>اسم المريض: يانيس بن علي (6 سنوات)</span>
                    <span>تاريخ الحصيلة: {new Date().toLocaleDateString('ar-DZ')}</span>
                  </div>

                  <div className="font-bold flex items-center gap-1" style={{ color: brandingData.primary_color }}>
                    <span>📋 التقييم والتشخيص السريري (Bilan Orthophonique):</span>
                  </div>
                  <p className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    أظهرت نتائج الاختبارات المقننة (SSI-4 و رائز الفونولوجيا) وجود اضطراب في طلاقة الكلام بمستوى متوسط، مصحوب بوقفات لاإرادية أثناء القراءة الجهرية مع مرونة لسانية ممتازة.
                  </p>

                  <div className="font-bold flex items-center gap-1 pt-1" style={{ color: brandingData.primary_color }}>
                    <span>🎯 التوصيات والخطة العلاجية المقترحة:</span>
                  </div>
                  <p className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    يوصى ببدء برنامج التأهيل الصوتي (Easy Onset) بمعدل حصتين أسبوعياً مع متابعة تمارين التنفس الحجابي المنزلية بالتنسيق مع الأولياء.
                  </p>
                </div>
              </div>

              {/* Document Footer */}
              <div className="relative z-10 pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-end justify-between px-2">
                  <div className="text-center space-y-1">
                    <div className="text-[9px] font-bold text-slate-700">توقيع وختم الطبيب المشرف</div>
                    <div className="w-20 h-12 rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 relative">
                      {signaturePreview ? (
                        <img src={signaturePreview} alt="Signature" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[7px] text-slate-400">توقيع الطبيب</span>
                      )}
                    </div>
                  </div>

                  {brandingData.show_stamp_on_bilans && (
                    <div className="text-center space-y-1">
                      <div className="text-[9px] font-bold text-slate-700">الختم الطبي الرسمي</div>
                      <div className="w-16 h-16 rounded-full border border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 relative">
                        {stampPreview ? (
                          <img src={stampPreview} alt="Stamp" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[7px] text-slate-400">الختم الدائري</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center pt-2 border-t border-slate-100 text-[8px] text-slate-500 leading-tight">
                  <div>{brandingData.address} • {brandingData.wilaya} • هاتف: {brandingData.phone}</div>
                  <div className="text-[7px] text-slate-400 mt-0.5">{brandingData.footer_text}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: LANDING PAGE & ONLINE APPOINTMENTS SUITE                             */}
      {/* ========================================================================= */}
      {activeTab === 'landing_page' && (
        <div className="space-y-6 animate-fade-in font-sans">
          
          {/* Top Live Link & Quick Actions Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {landingPage.enabled ? '🟢 صفحة الهبوط واستقبال الحجوزات نشطة' : '🔴 صفحة الهبوط معطلة مؤقتاً'}
                </span>
                <span className="text-xs text-slate-400 font-mono">DZ-CLINIC-ONLINE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>بوابة العيادة وحجز المواعيد المباشرة</span>
              </h2>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-xs text-slate-400">رابط العيادة المباشر للمرضى:</span>
                <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-teal-300 select-all" dir="ltr">
                  {`https://${tenant?.subdomain || 'clinic'}.psypro.tech`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleCopyLink(`https://${tenant?.subdomain || 'clinic'}.psypro.tech`)}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-md"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ الرابط'}</span>
              </button>

              <a
                href={`https://${tenant?.subdomain || 'clinic'}.psypro.tech`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-teal-600/20"
              >
                <ExternalLink className="w-4 h-4" />
                <span>معاينة صفحة الهبوط ↗</span>
              </a>

              <button
                type="button"
                onClick={() => navigate('/settings/domains')}
                className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Globe className="w-4 h-4" />
                <span>ربط نطاق خاص (.dz)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* RIGHT COLUMN: Settings Form (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Card 1: Core Landing Page & Welcome Headings */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">النصوص الترويجية وواجهة الاستقبال</h3>
                      <p className="text-xs text-slate-400">تخصيص العناوين والنبذة التعريفية التي يشاهدها المرضى والزوار</p>
                    </div>
                  </div>

                  {/* Master Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-slate-300">استقبال الحجوزات:</span>
                    <input
                      type="checkbox"
                      checked={landingPage.enabled}
                      onChange={(e) => setLandingPage({ ...landingPage, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500 relative" />
                  </label>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Hero Headline */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center justify-between">
                      <span>عنوان الترحيب الرئيسي (Hero Headline):</span>
                      <span className="text-[10px] text-slate-500">يظهر في الشارة العلوية لصفحة الهبوط</span>
                    </label>
                    <input
                      type="text"
                      value={landingPage.hero_headline}
                      onChange={(e) => setLandingPage({ ...landingPage, hero_headline: e.target.value })}
                      placeholder="مثال: بوابة حجز المواعيد والاستشارات السريرية المعتمدة"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white font-medium focus:outline-none"
                    />
                  </div>

                  {/* Public Bio */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center justify-between">
                      <span>النبذة السريرية التعريفية بالعيادة (Clinic Bio):</span>
                      <span className="text-[10px] text-slate-500">تظهر للجمهور وفي الدليل الوطني ومحركات البحث SEO</span>
                    </label>
                    <textarea
                      rows={3}
                      value={landingPage.public_bio}
                      onChange={(e) => setLandingPage({ ...landingPage, public_bio: e.target.value })}
                      placeholder="صفحة تعريفية موجزة تبرز تخصصات المركز، الكفاءات الطبية، وأحدث الأجهزة التأهيلية المعتمدة..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white font-medium focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Announcement Bar */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center justify-between">
                      <span>شريط التنبيهات والإعلانات العلوي (اختياري):</span>
                      <span className="text-[10px] text-amber-400">يظهر كشريط تنبيه ذهبي في أعلى الصفحة</span>
                    </label>
                    <input
                      type="text"
                      value={landingPage.announcement_bar || ''}
                      onChange={(e) => setLandingPage({ ...landingPage, announcement_bar: e.target.value })}
                      placeholder="مثال: 📢 تتوفر الآن حصص الفحص المبكر لصعوبات التعلم والنطق لأطفال التحضيري."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white font-medium focus:outline-none"
                    />
                  </div>

                  {/* CTA Text */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">نص زر إطلاق الحجز (CTA Text):</label>
                    <input
                      type="text"
                      value={landingPage.primary_cta_text || 'احجز موعدك الآن أونلاين'}
                      onChange={(e) => setLandingPage({ ...landingPage, primary_cta_text: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-teal-500 text-white font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Services Offered in Booking Wizard */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
                <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">الخدمات السريرية المعروضة للحجز أونلاين</h3>
                    <p className="text-xs text-slate-400">حدد أنواع الاستشارات التي ترغب في تمكين المرضى من حجزها مباشرة</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      id: 'bilan',
                      title: 'فحص وحصيلة تقييمية شاملة (Bilan)',
                      desc: 'تقييم تشخيصي أولي للنطق، التخاطب، النمو، أو القدرات النفسية.',
                      icon: Stethoscope,
                      color: 'text-teal-400',
                    },
                    {
                      id: 'reeducation',
                      title: 'جلسات تأهيل وعلاج منتظمة (Rééducation)',
                      desc: 'متابعة البرنامج التأهيلي لجلسات النطق، تعديل السلوك، أو التأهيل الحركي.',
                      icon: Activity,
                      color: 'text-indigo-400',
                    },
                    {
                      id: 'consultation',
                      title: 'استشارة نفسية ودعم معرفي سلوكي (CBT)',
                      desc: 'جلسات استشارة سرية لعلاج القلق، الضغوط النفسية، أو الإرشاد الوالدي.',
                      icon: Brain,
                      color: 'text-cyan-400',
                    },
                    {
                      id: 'teletherapy',
                      title: 'استشارة طبية عن بعد بالفيديو (Télé-consultation)',
                      desc: 'جلسة مرئية مشفرة ومباشرة عبر المتصفح دون الحاجة للتنقل لمقر العيادة.',
                      icon: Video,
                      color: 'text-emerald-400',
                    },
                  ].map((srv) => {
                    const Icon = srv.icon;
                    const isChecked = landingPage.services?.[srv.id] !== false;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => {
                          const currentServices = landingPage.services || {};
                          setLandingPage({
                            ...landingPage,
                            services: {
                              ...currentServices,
                              [srv.id]: !isChecked,
                            },
                          });
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                          isChecked
                            ? 'bg-slate-950/90 border-teal-500/40 text-white shadow-md'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${isChecked ? srv.color : 'text-slate-600'}`} />
                            <span className="text-xs font-black">{srv.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{srv.desc}</p>
                        </div>

                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 mt-1 ${
                          isChecked ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 3: Display & Public Transparency Options */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
                <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">خيارات العرض والخصوصية العامة</h3>
                    <p className="text-xs text-slate-400">التحكم في العناصر والبيانات المرئية لزوار صفحة الهبوط</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: 'show_pricing',
                      label: 'إظهار تسعيرة الفحص والاستشارات للعموم على الصفحة',
                      desc: 'عرض رسوم الفحص وجلسات التأهيل بشفافية للمرضى قبل تقديم الطلب.',
                      icon: Award,
                    },
                    {
                      key: 'show_working_hours',
                      label: 'إظهار أيام وساعات العمل الرسمية للعيادة',
                      desc: 'عرض جدول الدوام من السبت إلى الخميس وأوقات الاستقبال.',
                      icon: Clock,
                    },
                    {
                      key: 'show_whatsapp_button',
                      label: 'إظهار زر التواصل السريع عبر WhatsApp في الترويسة',
                      desc: 'تمكين المرضى من فتح محادثة WhatsApp مباشرة مع سكرتارية العيادة.',
                      icon: MessageSquare,
                    },
                    {
                      key: 'show_practitioners',
                      label: 'إظهار قائمة الأخصائيين المعتمدين بالعيادة',
                      desc: 'عرض أسماء ورتب الأخصائيين والأطباء العاملين بالمركز.',
                      icon: Users,
                    },
                    {
                      key: 'require_parent_name',
                      label: 'طلب اسم ولي الأمر إجبارياً عند تسجيل المريض',
                      desc: 'مفيد لعيادات الأطفال والأرطوفونيا لربط الطفل مباشرة ببيانات الولي.',
                      icon: ShieldCheck,
                    },
                  ].map((opt) => {
                    const isChecked = landingPage[opt.key] !== false;
                    const Icon = opt.icon;
                    return (
                      <div
                        key={opt.key}
                        onClick={() => setLandingPage({ ...landingPage, [opt.key]: !isChecked })}
                        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between cursor-pointer hover:border-slate-700 transition"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white">{opt.label}</div>
                            <div className="text-[11px] text-slate-400 truncate">{opt.desc}</div>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 mr-3 ${
                          isChecked ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LEFT COLUMN: QR Code Desk Stand & Live Visual Preview (4 Cols) */}
            <div className="lg:col-span-4 space-y-6 sticky top-6">
              
              {/* QR Code Stand Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-center">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-teal-400" />
                    <span>رمز QR لمكتب الاستقبال (Desk Stand)</span>
                  </span>
                  <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    Scan & Book
                  </span>
                </div>

                {/* Printable Mockup */}
                <div className="p-5 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-200 space-y-3 flex flex-col items-center">
                  <div className="text-xs font-black text-slate-900">
                    {tenant?.header_title_ar || tenant?.name || 'عيادة التشخيص والتأهيل'}
                  </div>
                  <div className="text-[10px] text-slate-600 font-bold">
                    امسح الرمز بهاتفك لحجز موعدك أونلاين
                  </div>

                  {/* QR Image */}
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://${tenant?.subdomain || 'clinic'}.psypro.tech`)}&color=0f172a`}
                      alt="Clinic Booking QR"
                      className="w-36 h-36 object-contain"
                    />
                  </div>

                  <div className="text-[9px] text-teal-700 font-mono font-bold" dir="ltr">
                    {`https://${tenant?.subdomain || 'clinic'}.psypro.tech`}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة ستاند الاستقبال</span>
                  </button>
                </div>
              </div>

              {/* Quick Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-3xl p-5 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-black text-indigo-300">
                  <Globe className="w-4 h-4" />
                  <span>مزايا صفحة الهبوط المعتمدة</span>
                </div>
                <ul className="space-y-2 text-slate-300 text-[11px] leading-relaxed list-disc list-inside">
                  <li>استقبال طلبات الحجز مباشرة 24/7 دون انقطاع.</li>
                  <li>ظهور فوري للطلبات داخل قمرة القيادة الرئيسية للعيادة.</li>
                  <li>تحويل تلقائي لملف مريض وموعد في الأجندة بضغطة زر.</li>
                  <li>إرسال رسائل WhatsApp مباشرة لتأكيد الحضور.</li>
                </ul>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WORKING HOURS & APPOINTMENTS SLOTS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'working_hours' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">إعدادات أوقات العمل وحصص المواعيد</h2>
                  <p className="text-xs text-slate-400">تحديد أيام الاستقبال، ساعات العمل، مدة الحصة، والفواصل الزمنية</p>
                </div>
              </div>

              {/* Active Days Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>أيام العمل والاستقبال في العيادة</span>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    {workingHours.days.length} أيام مفعلة
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {weekDays.map((day) => {
                    const isActive = workingHours.days.includes(day.key);
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => toggleWorkingDay(day.key)}
                        className={`p-3 rounded-2xl border text-center font-bold text-xs transition flex flex-col items-center gap-1.5 ${
                          isActive
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/10'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <span>{day.label}</span>
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Working Hours Time Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">وقت بدء العمل والاستقبال (صباحاً)</label>
                  <input
                    type="time"
                    value={workingHours.open_time}
                    onChange={(e) => setWorkingHours({ ...workingHours, open_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white font-mono text-center focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">وقت إغلاق العيادة (مساءً)</label>
                  <input
                    type="time"
                    value={workingHours.close_time}
                    onChange={(e) => setWorkingHours({ ...workingHours, close_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white font-mono text-center focus:outline-none"
                  />
                </div>
              </div>

              {/* Slot Duration & Buffer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">مدة الحصة السريرية (Slot)</label>
                  <select
                    value={workingHours.slot_duration}
                    onChange={(e) => setWorkingHours({ ...workingHours, slot_duration: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white font-medium focus:outline-none text-xs"
                  >
                    <option value={30}>30 دقيقة (حصص مكثفة)</option>
                    <option value={45}>45 دقيقة (المعيار السريري)</option>
                    <option value={60}>60 دقيقة (ساعة كاملة / فحوصات)</option>
                    <option value={90}>90 دقيقة (جلسات مطولة)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">الفاصل الزمني بين الحصص (Buffer)</label>
                  <select
                    value={workingHours.buffer_time}
                    onChange={(e) => setWorkingHours({ ...workingHours, buffer_time: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white font-medium focus:outline-none text-xs"
                  >
                    <option value={0}>0 دقيقة (متتابعة فوراً)</option>
                    <option value={5}>5 دقائق (تعقيم وتجهيز)</option>
                    <option value={10}>10 دقائق (توثيق SOAP وملاحظات)</option>
                    <option value={15}>15 دقيقة (راحة واستقبال مريح)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">الحد الأقصى للمرضى يومياً</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={workingHours.max_daily_patients}
                    onChange={(e) => setWorkingHours({ ...workingHours, max_daily_patients: parseInt(e.target.value) || 12 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white font-mono text-center focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleConfigSubmit}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-cyan-600/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ مواعيد العمل'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Simulator Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>محاكي الحصص اليومية المقترحة</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">إجمالي وقت العمل اليومي:</span>
                  <span className="font-bold text-white font-mono">
                    {workingHours.open_time} ➔ {workingHours.close_time}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">مدة الحصة + الفاصل:</span>
                  <span className="font-bold text-cyan-400 font-mono">
                    {workingHours.slot_duration + workingHours.buffer_time} دقيقة
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">الاستيعاب الأقصى المبرمج:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {workingHours.max_daily_patients} مريض / اليوم
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-slate-300 leading-relaxed space-y-1">
                <span className="font-bold text-cyan-300 block">💡 التوافق مع الأجندة وقاعة الانتظار:</span>
                <p>
                  تستخدم قمرة الأجندة وقاعة الانتظار الذكية هذه الإعدادات تلقائياً لمنع تداخل المواعيد وحساب أوقات الانتظار بدقة متناهية.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TARIFICATION & BILLING                                             */}
      {/* ========================================================================= */}
      {activeTab === 'tarification' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">التسعير السريري وطرق الدفع والفوترة</h2>
                  <p className="text-xs text-slate-400">تحديد أسعار الحصائل والجلسات، حساب BaridiMob، وبوادئ الفواتير</p>
                </div>
              </div>

              {/* Tarification Fields */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>1. جدول أسعار الخدمات السريرية (بالدينار الجزائري DZD)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">فحص وحصيلة أولية (Bilan Initial)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step={100}
                        value={tarification.bilan_initial_fee}
                        onChange={(e) => setTarification({ ...tarification, bilan_initial_fee: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white font-mono text-left focus:outline-none pl-12"
                        dir="ltr"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500">DZD</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">حصة إعادة تأهيل فردية (Séance Individuelle)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step={100}
                        value={tarification.therapy_session_fee}
                        onChange={(e) => setTarification({ ...tarification, therapy_session_fee: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white font-mono text-left focus:outline-none pl-12"
                        dir="ltr"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500">DZD</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">حصة تأهيل عن بعد (Télé-Orthophonie)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step={100}
                        value={tarification.teletherapy_fee}
                        onChange={(e) => setTarification({ ...tarification, teletherapy_fee: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white font-mono text-left focus:outline-none pl-12"
                        dir="ltr"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500">DZD</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">حصة جماعية أو ورشة تدريبية (Groupe)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step={100}
                        value={tarification.group_session_fee}
                        onChange={(e) => setTarification({ ...tarification, group_session_fee: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white font-mono text-left focus:outline-none pl-12"
                        dir="ltr"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500">DZD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>2. طرق الدفع المقبولة في العيادة</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'cash', label: '💵 الدفع نقداً (Espèces)' },
                    { key: 'baridimob', label: '💳 بريدي موب (BaridiMob)' },
                    { key: 'ccp', label: '🏦 صك بريدي (CCP)' },
                    { key: 'cheque', label: '📑 شيك بنكي (Chèque)' },
                  ].map((m) => {
                    const isChecked = tarification.accepted_payment_methods.includes(m.key);
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => togglePaymentMethod(m.key)}
                        className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/10'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <span>{m.label}</span>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {tarification.accepted_payment_methods.includes('baridimob') && (
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-500/30 space-y-2 text-xs">
                    <label className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <span>رقم الحساب البريدي الجاري RIP (لإرسال وصل BaridiMob)</span>
                    </label>
                    <input
                      type="text"
                      value={tarification.baridimob_rip}
                      onChange={(e) => setTarification({ ...tarification, baridimob_rip: e.target.value })}
                      placeholder="00799999000000000000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white font-mono text-left focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                )}
              </div>

              {/* Invoices Prefix */}
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>3. الترقيم التسلسلي للفواتير والإيصالات</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">بادئة الفواتير الرسمية (Invoice Prefix)</label>
                    <input
                      type="text"
                      value={tarification.invoice_prefix}
                      onChange={(e) => setTarification({ ...tarification, invoice_prefix: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white font-mono text-left focus:outline-none"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">بادئة إيصالات القبض (Receipt Prefix)</label>
                    <input
                      type="text"
                      value={tarification.receipt_prefix}
                      onChange={(e) => setTarification({ ...tarification, receipt_prefix: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white font-mono text-left focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleConfigSubmit}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات التسعير والفوترة'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>نموذج الفاتورة السريعة</span>
              </h3>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>رقم الفاتورة التالي:</span>
                  <span className="font-mono text-white font-bold">{tarification.invoice_prefix}001</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>تسعيرة الحصة العادية:</span>
                  <span className="font-mono text-emerald-400 font-bold">{tarification.therapy_session_fee} DZD</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>تسعيرة الحصيلة الأولية:</span>
                  <span className="font-mono text-cyan-400 font-bold">{tarification.bilan_initial_fee} DZD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WHATSAPP AUTOMATION                                                */}
      {/* ========================================================================= */}
      {activeTab === 'whatsapp_rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">قواعد أتمتة رسائل WhatsApp السريرية</h2>
                  <p className="text-xs text-slate-400">إرسال التذكيرات، روابط التمارين المنزلية، ومتابعة الغيابات تلقائياً</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Rule 1: Appointment Reminders */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block">1. التذكير التلقائي بالمواعيد القادمة</span>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      إرسال رسالة رسمية للأولياء عبر WhatsApp لتأكيد موعد الحصة وتفاصيل الجلسة.
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      <label className="text-slate-300 font-bold">توقيت الإرسال:</label>
                      <select
                        value={whatsappAutomation.reminder_timing_hours}
                        onChange={(e) => setWhatsappAutomation({ ...whatsappAutomation, reminder_timing_hours: parseInt(e.target.value) })}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none"
                      >
                        <option value={24}>قبل 24 ساعة من الموعد (الموصى به)</option>
                        <option value={48}>قبل 48 ساعة من الموعد</option>
                        <option value={0}>صباح يوم الموعد (08:00 صباحاً)</option>
                      </select>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={whatsappAutomation.auto_appointment_reminders}
                    onChange={(e) => setWhatsappAutomation({ ...whatsappAutomation, auto_appointment_reminders: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900 cursor-pointer mt-1"
                  />
                </div>

                {/* Rule 2: Send Homework Summary */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block">2. إرسال ملخص الجلسة والتمارين المنزلية فوراً</span>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      عند ضغط المعالج على "إنهاء الجلسة وحفظ SOAP"، يتم إرسال رسالة ملخص إنجاز الحصة ورابط التمارين المنزلية للولي تلقائياً.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={whatsappAutomation.auto_send_homework_summary}
                    onChange={(e) => setWhatsappAutomation({ ...whatsappAutomation, auto_send_homework_summary: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900 cursor-pointer mt-1"
                  />
                </div>

                {/* Rule 3: Absence Chaser */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block">3. متابعة الغيابات وإعادة الجدولة (Absence Radar)</span>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      إرسال رسالة استفسار دافئة لولي المريض في حال عدم الحضور مع رابط لاختيار موعد تعويضي جديد.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={whatsappAutomation.auto_absence_chaser}
                    onChange={(e) => setWhatsappAutomation({ ...whatsappAutomation, auto_absence_chaser: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900 cursor-pointer mt-1"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleConfigSubmit}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات WhatsApp'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* WhatsApp Message Preview Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>معاينة رسالة التذكير على هاتف الولي</span>
              </h3>

              <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 text-xs space-y-2 text-slate-200">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  <span>تذكير موعد سريري 🩺</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  مرحباً وليّ أمر البطل <strong>يانيس</strong> 🌸،<br />
                  نذكركم بموعد حصة إعادة التأهيل القادمة لدى <strong>{brandingData.name}</strong> يوم غد على الساعة <strong>10:30 صباحاً</strong>.<br />
                  يرجى الحضور 5 دقائق قبل الموعد.
                </p>
                <div className="text-[10px] text-emerald-400/80 pt-1 border-t border-emerald-500/20">
                  PsySnap • Clinic Automated Dispatcher
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PARENT PORTAL POLICIES                                             */}
      {/* ========================================================================= */}
      {activeTab === 'parent_portal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">سياسات وتصاريح بوابة الأولياء</h2>
                  <p className="text-xs text-slate-400">التحكم في ما يمكن للأولياء رؤيته وتحميله عبر رابط المتابعة الرقمي</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Master Switch */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block">1. تفعيل بوابة الأولياء الرقمية للعيادة</span>
                    <p className="text-slate-400 text-xs">
                      تمكين روابط الدخول المباشر والرمز السري (PIN) لأولياء المرضى.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={parentPortal.enabled}
                    onChange={(e) => setParentPortal({ ...parentPortal, enabled: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900 cursor-pointer mt-1"
                  />
                </div>

                {/* PDF Download Policy */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block">2. السماح بتحميل الحصائل والتقارير بصيغة PDF</span>
                    <p className="text-slate-400 text-xs">
                      تمكين الأولياء من تحميل الحصيلة الرسمية بتوقيع وختم العيادة مباشرة من البوابة.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={parentPortal.allow_download_bilans_pdf}
                    onChange={(e) => setParentPortal({ ...parentPortal, allow_download_bilans_pdf: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900 cursor-pointer mt-1"
                  />
                </div>

                {/* Homework View Policy */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block">3. عرض التمارين المنزلية والأهداف المحققة (PEI)</span>
                    <p className="text-slate-400 text-xs">
                      إتاحة التمارين التفاعلية والقصص الاجتماعية للتدريب المنزلي اليومي.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={parentPortal.allow_view_homework}
                    onChange={(e) => setParentPortal({ ...parentPortal, allow_view_homework: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900 cursor-pointer mt-1"
                  />
                </div>

                {/* Parent Audio Uploads Policy */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block">4. السماح للأولياء برفع تسجيلات الملاحظات المنزلية</span>
                    <p className="text-slate-400 text-xs">
                      تمكين تسجيل مقاطع صوتية أو فيديو قصيرة لملاحظة نطق وسلوك الطفل في المنزل.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={parentPortal.allow_parent_audio_uploads}
                    onChange={(e) => setParentPortal({ ...parentPortal, allow_parent_audio_uploads: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900 cursor-pointer mt-1"
                  />
                </div>

                {/* Magic Link Expiry */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block">5. مدة صلاحية رابط الدخول السريع (Magic Link)</span>
                    <p className="text-slate-400 text-xs">
                      إعادة طلب الرمز السري PIN بعد انقضاء هذه المدة لحماية خصوصية الطفل.
                    </p>
                  </div>
                  <select
                    value={parentPortal.magic_link_expiry_days}
                    onChange={(e) => setParentPortal({ ...parentPortal, magic_link_expiry_days: parseInt(e.target.value) })}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none"
                  >
                    <option value={7}>7 أيام</option>
                    <option value={15}>15 يوماً</option>
                    <option value={30}>30 يوماً (شهر كامل)</option>
                    <option value={90}>90 يوماً</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleConfigSubmit}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-amber-600/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ سياسات البوابة'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>أمان وخصوصية الأولياء</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                جميع روابط الدخول محمية برمز تشفير فردي لكل مريض (Token Hash) يضمن عدم إمكانية وصول أي وليّ إلى ملفات مريض آخر.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: AI CLINICAL PREFERENCES                                            */}
      {/* ========================================================================= */}
      {activeTab === 'ai_preferences' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">تفضيلات الذكاء الاصطناعي السريري والإنذارات</h2>
                  <p className="text-xs text-slate-400">تخصيص لغة الصياغة، نبرة الحصائل، وإنذار Red Alert الصوتي</p>
                </div>
              </div>

              <div className="space-y-5 text-xs">
                {/* AI Default Language */}
                <div className="space-y-2">
                  <label className="text-slate-300 font-bold block">1. لغة التوليد الأساسية للمساعد السريري</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'darja', label: '🇩🇿 الدارجة الجزائرية', desc: 'مناسبة لجلسات التخاطب والقصص المحلية' },
                      { key: 'arabic', label: '🌍 العربية الفصحى', desc: 'مناسبة للتقارير والحصائل الرسمية' },
                      { key: 'french', label: '🇫🇷 الفرنسية الطبية', desc: 'المصطلحات الطبية المتخصصة' },
                    ].map((lang) => (
                      <button
                        key={lang.key}
                        type="button"
                        onClick={() => setAiPreferences({ ...aiPreferences, default_language: lang.key })}
                        className={`p-3 rounded-2xl border text-right transition ${
                          aiPreferences.default_language === lang.key
                            ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 font-bold shadow-md shadow-purple-500/10'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1">{lang.label}</div>
                        <div className="text-[10px] text-slate-500">{lang.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bilan Writing Tone */}
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <label className="text-slate-300 font-bold block">2. نبرة صياغة الحصائل والتقارير (Bilan Tone)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'clinical_detailed', label: '🔬 سريري تفصيلي', desc: 'موجه للأطباء والملف الطبي (DSM-5 & ICD-11)' },
                      { key: 'pedagogical', label: '🎓 بيداغوجي مدرسي', desc: 'موجه لأساتذة ومدراء المدارس للتنسيق' },
                      { key: 'parent_friendly', label: '❤️ مبسط للأولياء', desc: 'عبارات تشجيعية وتوصيات منزلية سهلة الفهم' },
                    ].map((tone) => (
                      <button
                        key={tone.key}
                        type="button"
                        onClick={() => setAiPreferences({ ...aiPreferences, bilan_tone: tone.key })}
                        className={`p-3 rounded-2xl border text-right transition ${
                          aiPreferences.bilan_tone === tone.key
                            ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 font-bold shadow-md shadow-purple-500/10'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1">{tone.label}</div>
                        <div className="text-[10px] text-slate-500">{tone.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Red Alert Sound Alarm */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-between gap-4 pt-3 border-t border-slate-800">
                  <div className="space-y-1">
                    <span className="font-bold text-rose-300 text-sm flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-rose-400" />
                      <span>3. إنذار صوتي فوري عند اكتشاف حالة خطورة (Red Alert)</span>
                    </span>
                    <p className="text-slate-400 text-xs">
                      تشغيل نغمة تحذيرية للمعالج عند تسجيل بنود إيذاء النفس أو مؤشرات الخطر في المقاييس الرقمية الـ 18.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiPreferences.red_alert_audio_enabled}
                    onChange={(e) => setAiPreferences({ ...aiPreferences, red_alert_audio_enabled: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900 cursor-pointer mt-1"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleConfigSubmit}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ تفضيلات الذكاء الاصطناعي'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>الامتثال الطبي للذكاء الاصطناعي</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                الذكاء الاصطناعي في المنظومة يعمل كمساعد توثيقي وسريري داعم فقط، وتظل المسؤولية التشخيصية والعلاجية الكاملة على عاتق الطبيب / الأخصائي المشرف.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: DATA SOVEREIGNTY & BACKUP EXPORT                                  */}
      {/* ========================================================================= */}
      {activeTab === 'backup_export' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">النسخ الاحتياطي والسيادة على البيانات</h2>
                  <p className="text-xs text-slate-400">تصدير شامل لسجلات المرضى، المواعيد، الفواتير، والحصائل بنقرة واحدة</p>
                </div>
              </div>

              {/* Export Action Card */}
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-black text-white text-sm block">تصدير قاعدة بيانات العيادة الكاملة (JSON Export)</span>
                    <p className="text-xs text-slate-400">
                      ملف آمن يحتوي على كافة بيانات مرضاك، الجلسات، المقاييس، والفواتير بصيغة معيارية قابلة للاسترجاع.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-blue-600/30 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير الآن (JSON)</span>
                  </button>
                </div>
              </div>

              {/* Data Sovereignty Notice */}
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs text-slate-300 space-y-2 leading-relaxed">
                <span className="font-bold text-blue-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>الامتثال للقانون 18-07 لحماية المعطيات الشخصية</span>
                </span>
                <p>
                  بيانات عيادتكم ومرضاكم ملك حصري لكم. تضمن المنظومة تشفيراً تاماً (AES-256) مع نسخ احتياطي سحابي يومي تلقائي، وإمكانية سحب أو مسح بياناتكم في أي وقت دون أي قيود.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span>حالة النسخ الاحتياطي التلقائي</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">النسخ السحابي اليومي:</span>
                  <span className="text-emerald-400 font-bold">نشط يومياً 03:00 ص</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">موقع الخادم السحابي:</span>
                  <span className="text-white font-mono font-bold">Hostinger VPS DZ/FR</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">مدة الاحتفاظ بالنسخ:</span>
                  <span className="text-indigo-400 font-bold">30 يوماً متتالية</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: PRACTITIONER PROFILE & SECURITY                                    */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Details */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">البيانات الشخصية والمهنية للمختص</h2>
                  <p className="text-xs text-slate-400">تعديل الاسم، البريد الإلكتروني، رقم الهاتف، والتخصص الطبي</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>الاسم واللقب الكامل</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="د. أمينة بن علي"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span>البريد الإلكتروني (لتسجيل الدخول)</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="doctor@clinic.dz"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none text-xs text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>رقم الهاتف المباشر</span>
                    </label>
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="0550 12 34 56"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none text-xs text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-400" />
                      <span>رقم الاعتماد / الرخصة المهنية للمختص</span>
                    </label>
                    <input
                      type="text"
                      value={profileData.specialty_license_number}
                      onChange={(e) => setProfileData({ ...profileData, specialty_license_number: e.target.value })}
                      placeholder="DZ-ORD-2026-908"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none text-xs text-left"
                      dir="ltr"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center justify-between">
                      <span>التخصص السريري والمهني</span>
                      <span className="text-[10px] text-slate-500 font-normal">يظهر في تقارير وتوقيعات الحصائل</span>
                    </label>
                    <select
                      value={specialtyPresets.includes(profileData.specialty) ? profileData.specialty : 'custom'}
                      onChange={(e) => {
                        if (e.target.value !== 'custom') {
                          setProfileData({ ...profileData, specialty: e.target.value });
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none text-xs"
                    >
                      {specialtyPresets.map((sp) => (
                        <option key={sp} value={sp} className="bg-slate-900 text-slate-200">{sp}</option>
                      ))}
                      <option value="custom" className="bg-slate-900 text-slate-200">✍️ تخصص آخر مخصص...</option>
                    </select>

                    {(!specialtyPresets.includes(profileData.specialty) || profileData.specialty === '') && (
                      <input
                        type="text"
                        value={profileData.specialty}
                        onChange={(e) => setProfileData({ ...profileData, specialty: e.target.value })}
                        placeholder="اكتب مسمى تخصصك السريري بالتفصيل..."
                        className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-indigo-500/50 text-white font-medium focus:outline-none text-xs"
                      />
                    )}
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ البيانات المهنية'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Password Management */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">تغيير كلمة المرور وأمان الحساب</h2>
                  <p className="text-xs text-slate-400">تحديث كلمة السر بآلية مشفرة لحماية السجلات الطبية والسريرية</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">كلمة المرور الحالية</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white font-medium focus:outline-none text-xs pr-3.5 pl-9 text-left font-mono"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white font-medium focus:outline-none text-xs pr-3.5 pl-9 text-left font-mono"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">تأكيد كلمة المرور</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={passwordData.new_password_confirmation}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-white font-medium focus:outline-none text-xs pr-3.5 pl-9 text-left font-mono"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>💡 يوصى بكلمة مرور تحتوي على 8 أحرف على الأقل، تتضمن أرقاماً ورموزاً لضمان حماية بيانات المرضى.</span>
                  {passwordData.new_password && (
                    <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                      passwordData.new_password.length >= 8 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                    }`}>
                      {passwordData.new_password.length >= 8 ? 'قوية 🛡️' : 'مقبولة ⚠️'}
                    </span>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-amber-600/20 disabled:opacity-50"
                  >
                    <Key className="w-4 h-4" />
                    <span>{saving ? 'جاري التحديث...' : 'تحديث كلمة المرور'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20">
                  {profileData.name ? profileData.name.charAt(0) : 'Ψ'}
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">{profileData.name || 'حساب المختص'}</h3>
                  <p className="text-[11px] text-indigo-400 font-mono font-bold truncate max-w-[180px]">
                    {profileData.email}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">الرتبة في المنظومة</span>
                  <span className="font-bold text-white px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {profileData.role === 'clinic_admin' || profileData.role === 'admin'
                      ? 'مدير العيادة (Clinic Admin)'
                      : 'أخصائي معالج (Specialist)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">العيادة المرتبطة</span>
                  <span className="font-bold text-emerald-400 truncate max-w-[160px]">
                    {tenant?.name || 'ClinicSaaS DZ'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">حالة التشفير والحماية</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>256-bit AES</span>
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>بروتوكول الأمان السريري</span>
                </div>
                <p>
                  يتم تشفير كلمات المرور وسجلات الجلسات وفق معايير الحماية الطبية العالمية. لا يتم مشاركة بيانات الدخول مع أي طرف خارجي.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
