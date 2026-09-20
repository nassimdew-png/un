import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Eye,
  RefreshCw,
  Save,
  Power,
  UserCheck,
  XCircle,
  Plus,
  Trash2,
  X,
  FileText,
  School,
  Building2,
  Calendar,
  Layers,
  Award,
  Phone,
  Mail,
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { studentOfferApi } from '../../api';

export default function StudentOfferManagerTab() {
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Config State
  const [config, setConfig] = useState({
    is_active: true,
    duration_months: 9,
    auto_approve: true,
    max_quota: 500,
    marketing_title: 'منحة التميز السريري: 9 أشهر مجاناً لطلبة علم النفس والأرطوفونيا',
    marketing_subtitle: 'عرض وطني حصري مخصص لطلبة السنة الثالثة ليسانس (L3) وسنة ثانية ماستر (M2) للتدريب الميداني وإنجاز مذكرات التخرج على بيئة سريرية احترافية 100%.',
    marketing_badge: '🎓 عرض ومنحة الطلبة 2026 - 9 أشهر مجاناً 🇩🇿',
    offer_slug: 'student-offer',
    discount_percentage: 70,
  });

  const [stats, setStats] = useState({
    total_applications: 0,
    active_students: 0,
    pending_verifications: 0,
    rejected_applications: 0,
    total_universities: 0,
  });

  // Applications Table State
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [degreeFilter, setDegreeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAppsCount, setTotalAppsCount] = useState(0);

  // Modals
  const [selectedCardDoc, setSelectedCardDoc] = useState(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [rejectingAppId, setRejectingAppId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [extendingAppId, setExtendingAppId] = useState(null);
  const [extendMonths, setExtendMonths] = useState(3);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);

  const showNotification = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Fetch Offer Config & Summary
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await studentOfferApi.getSuperAdminConfig();
      if (res.success && res.config) {
        setConfig(res.config);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load student offer config:', err);
      showNotification('error', 'تعذر تحميل إعدادات عرض الطلبة.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Applications List
  const fetchApplications = async () => {
    try {
      setAppsLoading(true);
      const params = {
        page,
        per_page: 15,
        search: searchQuery,
        status: statusFilter,
        specialty: specialtyFilter,
        degree_level: degreeFilter,
      };
      const res = await studentOfferApi.getApplications(params);
      if (res.success) {
        setApplications(res.applications || []);
        setTotalPages(res.last_page || 1);
        setTotalAppsCount(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [page, statusFilter, specialtyFilter, degreeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  // Save Settings to Backend
  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      const res = await studentOfferApi.updateSuperAdminConfig(config);
      if (res.success) {
        showNotification('success', res.message || 'تم حفظ إعدادات منحة الطلبة بنجاح! 🎓✨');
        fetchConfig();
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل حفظ الإعدادات.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Copy Special Marketing Link
  const publicOfferUrl = `${window.location.origin}/student-offer`;

  const copyOfferLink = () => {
    navigator.clipboard.writeText(publicOfferUrl);
    setCopiedLink(true);
    showNotification('success', 'تم نسخ الرابط التسويقي المخصص للطلبة إلى الحافظة! 📋');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Approve Application
  const handleApprove = async (id) => {
    if (!window.confirm('هل أنت متأكد من قبول وتفعيل حساب الطالب لمدة 9 أشهر مجاناً؟')) return;
    try {
      const res = await studentOfferApi.approveApplication(id);
      if (res.success) {
        showNotification('success', res.message || 'تم تفعيل حساب الطالب بنجاح! 🎓');
        fetchApplications();
        fetchConfig();
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل تفعيل الحساب.');
    }
  };

  // Open Reject Modal
  const handleOpenReject = (id) => {
    setRejectingAppId(id);
    setRejectionReason('البيانات الأكاديمية المدخلة غير مطابقة لشروط منحة طلبة علم النفس والأرطوفونيا (L3/M2).');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingAppId) return;
    try {
      const res = await studentOfferApi.rejectApplication(rejectingAppId, rejectionReason);
      if (res.success) {
        showNotification('success', 'تم رفض الطلب بنجاح.');
        setIsRejectModalOpen(false);
        fetchApplications();
        fetchConfig();
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل تنفيذ الرفض.');
    }
  };

  // Open Extend Modal
  const handleOpenExtend = (id) => {
    setExtendingAppId(id);
    setExtendMonths(3);
    setIsExtendModalOpen(true);
  };

  const handleConfirmExtend = async (e) => {
    e.preventDefault();
    if (!extendingAppId) return;
    try {
      const res = await studentOfferApi.extendApplication(extendingAppId, extendMonths);
      if (res.success) {
        showNotification('success', res.message || 'تم تمديد اشتراك الطالب بنجاح! ⏳');
        setIsExtendModalOpen(false);
        fetchApplications();
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل تمديد الاشتراك.');
    }
  };

  // Delete Application
  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف طلب الطالب (${name}) نهائياً؟`)) return;
    try {
      const res = await studentOfferApi.deleteApplication(id, true);
      if (res.success) {
        showNotification('success', 'تم حذف السجل بنجاح.');
        fetchApplications();
        fetchConfig();
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل حذف السجل.');
    }
  };

  // Impersonate Student
  const handleImpersonate = async (id) => {
    try {
      const res = await studentOfferApi.impersonateStudent(id);
      if (res.success && res.token) {
        const backupToken = localStorage.getItem('auth_token');
        if (backupToken) {
          localStorage.setItem('superadmin_backup_token', backupToken);
        }
        localStorage.setItem('auth_token', res.token);
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));
        if (res.tenant) {
          localStorage.setItem('tenant', JSON.stringify(res.tenant));
          localStorage.setItem('current_clinic', JSON.stringify(res.tenant));
        }
        localStorage.setItem('is_impersonating', 'true');
        localStorage.setItem('impersonating_clinic_name', res.tenant?.name || res.user?.name);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      showNotification('error', err.message || 'تعذر الدخول لحساب الطالب.');
    }
  };

  // Degree Level Translation
  const getDegreeLabel = (level) => {
    switch (level) {
      case 'licence_l3': return 'سنة 3 ليسانس (L3)';
      case 'master_m2': return 'سنة 2 ماستر (M2)';
      case 'master_m1': return 'سنة 1 ماستر (M1)';
      case 'intern_resident': return 'طبيب متربص / مقيم';
      default: return level || 'غير محدد';
    }
  };

  const getSpecialtyLabel = (spec) => {
    switch (spec) {
      case 'orthophonie': return '🗣️ أرطوفونيا وتخاطب';
      case 'psychologie': return '🧠 علم النفس العيادي';
      default: return spec || 'أرطوفونيا / علم نفس';
    }
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Top Banner Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-3xl flex items-center justify-between text-xs font-bold border shadow-xl animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Hero Master Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-950 border border-amber-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                ACADEMIC STUDENT SCHOLARSHIP & OFFER STUDIO
              </span>
              <span className={`px-3 py-1 rounded-full text-[11px] font-black border flex items-center gap-1.5 ${
                config.is_active
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${config.is_active ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                {config.is_active ? `العرض التسويقي نشط (${config.duration_months} أشهر مجاناً) 🟢` : 'العرض متوقف مؤقتاً ⏸️'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              إدارة عرض ومنحة الطلبة (9 أشهر مجاناً) 🎓
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              تحكم مركزي شامل في عرض طلبة علم النفس والأرطوفونيا (L3 و M2)، فحص ومراجعة بطاقات الطلبة، تفعيل مساحات العمل التدريبية المجانية، ومشاركة الروابط التسويقية المباشرة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={copyOfferLink}
              className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
              <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ الرابط التسويقي 📋'}</span>
            </button>

            <a
              href="/student-offer"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-teal-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-md"
            >
              <ExternalLink className="w-4 h-4 text-teal-400" />
              <span>معاينة صفحة العرض 🔗</span>
            </a>

            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center gap-2 shadow-xl shadow-emerald-600/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingConfig ? 'جاري الحفظ...' : 'حفظ التعديلات 💾'}</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold">إجمالي طلبات الطلبة</div>
              <div className="text-xl font-black text-white font-mono">{stats.total_applications || 0}</div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold">الحسابات المفعلة (9 أشهر)</div>
              <div className="text-xl font-black text-emerald-400 font-mono">{stats.active_students || 0}</div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold">بانتظار التحقق والمراجعة</div>
              <div className="text-xl font-black text-amber-400 font-mono">{stats.pending_verifications || 0}</div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold">الجامعات الممثلة</div>
              <div className="text-xl font-black text-teal-300 font-mono">{stats.total_universities || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: OFFER CONFIGURATION & CONTROLS                                 */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">إعدادات الحملة التسويقية وشروط الاستحقاق</h2>
              <p className="text-xs text-slate-400">تخصيص مدة المنحة، نمط الموافقة الفورية، والحد الأقصى للطلبة</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            OFFER ENGINE 2026 ⚙️
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Switch: Activate Offer */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">حالة العرض التسويقي:</span>
              <span className="text-[11px] text-slate-400">فتح أو إغلاق التسجيل لطلبة الجامعات</span>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, is_active: !config.is_active })}
              className={`px-4 py-2 rounded-xl font-black text-xs transition flex items-center gap-1.5 ${
                config.is_active
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{config.is_active ? 'نشط ومتاح' : 'مغلق مؤقتاً'}</span>
            </button>
          </div>

          {/* Duration in Months */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <label className="font-bold text-white block">مدة المنحة المجانية (بالأشهر):</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="24"
                value={config.duration_months}
                onChange={(e) => setConfig({ ...config, duration_months: parseInt(e.target.value) || 9 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-indigo-500 text-center"
              />
              <span className="text-xs font-bold text-slate-400 shrink-0">أشهر مجانية</span>
            </div>
          </div>

          {/* Auto-Approve Switch */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">نمط الموافقة الفورية:</span>
              <span className="text-[11px] text-slate-400">تفعيل الحساب مباشرة أو المراجعة اليدوية</span>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, auto_approve: !config.auto_approve })}
              className={`px-4 py-2 rounded-xl font-black text-xs transition flex items-center gap-1.5 ${
                config.auto_approve
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{config.auto_approve ? 'تفعيل تلقائي فوري ⚡' : 'مراجعة يدوية للطلبات 🛡️'}</span>
            </button>
          </div>
        </div>

        {/* Marketing Link Strip */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-950 to-teal-950/70 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black text-sm">
              🔗
            </div>
            <div>
              <div className="text-xs font-black text-white">الرابط المباشر لصفحة العرض والتسجيل:</div>
              <div className="text-[11px] font-mono text-teal-300 select-all" dir="ltr">
                {publicOfferUrl}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={copyOfferLink}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>

            <a
              href="/student-offer"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
              <span>فتح الصفحة</span>
            </a>
          </div>
        </div>

        {/* Marketing Copy Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold">عنوان العرض التسويقي (Hero Title):</label>
            <input
              type="text"
              value={config.marketing_title}
              onChange={(e) => setConfig({ ...config, marketing_title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold">شارة العرض (Badge):</label>
            <input
              type="text"
              value={config.marketing_badge}
              onChange={(e) => setConfig({ ...config, marketing_badge: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-slate-300 font-bold">الوصف التسويقي والفوائد لطلبة علم النفس والأرطوفونيا:</label>
            <textarea
              rows={2}
              value={config.marketing_subtitle}
              onChange={(e) => setConfig({ ...config, marketing_subtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: STUDENT APPLICANTS TABLE & VERIFICATION                        */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">سجلات طلبات الطلبة والمتربصين ({totalAppsCount})</h2>
              <p className="text-xs text-slate-400">مراجعة ملفات التسجيل، معاينة بطاقات الطلبة، وتفعيل الاشتراكات</p>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم، الجامعة، الهاتف..."
                className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
            >
              بحث
            </button>
          </form>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold">
          <span className="text-slate-500 text-[11px] shrink-0">الحالة:</span>
          {['all', 'pending', 'verified', 'rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white font-black'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' ? 'كافة الحالات' : st === 'pending' ? '🟡 قيد المراجعة' : st === 'verified' ? '🟢 مفعل 9 أشهر' : '🔴 مرفوض'}
            </button>
          ))}

          <div className="w-px h-4 bg-slate-800 mx-1 shrink-0" />

          <span className="text-slate-500 text-[11px] shrink-0">التخصص:</span>
          {['all', 'orthophonie', 'psychologie'].map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => { setSpecialtyFilter(sp); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                specialtyFilter === sp
                  ? 'bg-teal-600 text-white font-black'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sp === 'all' ? 'كافة التخصصات' : sp === 'orthophonie' ? '🗣️ أرطوفونيا' : '🧠 علم النفس'}
            </button>
          ))}

          <div className="w-px h-4 bg-slate-800 mx-1 shrink-0" />

          <span className="text-slate-500 text-[11px] shrink-0">المستوى:</span>
          {['all', 'licence_l3', 'master_m2'].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => { setDegreeFilter(deg); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                degreeFilter === deg
                  ? 'bg-amber-600 text-white font-black'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {deg === 'all' ? 'كافة المستويات' : deg === 'licence_l3' ? 'سنة 3 ليسانس (L3)' : 'سنة 2 ماستر (M2)'}
            </button>
          ))}
        </div>

        {/* Applications Table */}
        {appsLoading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <div className="text-xs font-bold">جاري تحميل سجلات طلبات الطلبة...</div>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
            <GraduationCap className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">لا توجد طلبات تطابق الفلاتر المحددة</h3>
            <p className="text-xs text-slate-400">شارك الرابط التسويقي مع طلبة الجامعات لبدء استقبال الطلبات.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">الطالب والاتصال</th>
                  <th className="py-3 px-4">الجامعة والتخصص</th>
                  <th className="py-3 px-4">المستوى الأكاديمي</th>
                  <th className="py-3 px-4 text-center">التصريح الأكاديمي</th>
                  <th className="py-3 px-4 text-center">الحالة والصلاحية</th>
                  <th className="py-3 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {applications.map((app) => {
                  const isVerified = app.status === 'verified';
                  const isPending = app.status === 'pending';
                  const isRejected = app.status === 'rejected';

                  return (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition">
                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {app.student_name?.[0] || 'ط'}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{app.student_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{app.email}</div>
                            <div className="text-[11px] text-slate-500 font-mono" dir="ltr">{app.phone}</div>
                          </div>
                        </div>
                      </td>

                      {/* University & Specialty */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="text-slate-300 text-[11px] max-w-xs truncate" title={app.university_name}>
                            🏛️ {app.university_name}
                          </div>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            app.specialty === 'orthophonie'
                              ? 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          }`}>
                            {getSpecialtyLabel(app.specialty)}
                          </span>
                        </div>
                      </td>

                      {/* Degree Level */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                          {getDegreeLabel(app.degree_level)}
                        </span>
                      </td>

                      {/* Academic Honor Pledge */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                          <Shield className="w-3 h-3 text-emerald-400" />
                          <span>إقرار شرفي مصادق ✅</span>
                        </span>
                      </td>

                      {/* Status & Expiry */}
                      <td className="py-3 px-4 text-center">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            isVerified
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          }`}>
                            {isVerified ? 'مفعل 9 أشهر 🟢' : isPending ? 'قيد المراجعة 🟡' : 'مرفوض 🔴'}
                          </span>

                          {app.expires_at && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              ينتهي: {app.expires_at}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleApprove(app.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center gap-1"
                              title="قبول وتفعيل 9 أشهر"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>قبول</span>
                            </button>
                          )}

                          {isVerified && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleImpersonate(app.id)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center gap-1"
                                title="تسجيل الدخول كطالب"
                              >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>دخول</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenExtend(app.id)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold transition flex items-center gap-1"
                                title="تمديد الاشتراك"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>تمديد</span>
                              </button>
                            </>
                          )}

                          {!isRejected && (
                            <button
                              type="button"
                              onClick={() => handleOpenReject(app.id)}
                              className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition border border-rose-500/20"
                              title="رفض الطلب"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(app.id, app.student_name)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs transition"
                            title="حذف السجل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400 font-bold">
              صفحة {page} من {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: STUDENT CARD PREVIEW                                               */}
      {/* ========================================================================= */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black text-white">معاينة بطاقة الطالب أو شهادة التسجيل</h3>
              </div>
              <button onClick={() => setIsCardModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-slate-950 rounded-2xl border border-slate-800">
              {selectedCardDoc?.endsWith('.pdf') ? (
                <div className="text-center space-y-3 py-8">
                  <FileText className="w-16 h-16 text-indigo-400 mx-auto" />
                  <div className="text-xs text-slate-300">مستند بصيغة PDF</div>
                  <a
                    href={`/storage/${selectedCardDoc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                  >
                    <span>فتح الملف في نافذة جديدة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <img
                  src={`/storage/${selectedCardDoc}`}
                  alt="Student Card"
                  className="max-h-[60vh] max-w-full rounded-xl object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<div class="text-xs text-rose-400 p-4">تعذر تحميل معاينة الصورة. يمكنك فتح الملف مباشرة.</div>';
                  }}
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
              <a
                href={`/storage/${selectedCardDoc}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 flex items-center gap-1"
              >
                <span>فتح الملف الأصلي</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setIsCardModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECT REASON                                                      */}
      {/* ========================================================================= */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>رفض طلب منحة الطالب</span>
              </h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">سبب الرفض:</label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  تأكيد الرفض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXTEND SUBSCRIPTION                                                */}
      {/* ========================================================================= */}
      {isExtendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>تمديد اشتراك الطالب الأكاديمي</span>
              </h3>
              <button onClick={() => setIsExtendModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmExtend} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">عدد الأشهر الإضافية الممنوحة:</label>
                <select
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>شهر واحد إضافي (1 شهر)</option>
                  <option value={2}>شهران إضافيان (2 شهر)</option>
                  <option value={3}>ثلاثة أشهر إضافية (3 أشهر)</option>
                  <option value={6}>ستة أشهر إضافية (6 أشهر)</option>
                  <option value={9}>تسعة أشهر إضافية (9 أشهر)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExtendModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  تأكيد التمديد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
