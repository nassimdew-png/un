import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  Building2,
  Users,
  Search,
  Activity,
  ShieldCheck,
  Coins,
  Calendar,
  Sparkles,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  Layers,
  MapPin,
  TrendingUp,
  UserCheck,
  Ban,
  ArrowRight,
  Phone,
  Mail,
  SlidersHorizontal,
  Database,
  FileText,
  Terminal,
  FileCode,
  Tag,
  PieChart,
  BarChart3,
  CreditCard,
  Globe,
  Headphones,
  MessageSquare,
  MessageCircle,
  BookOpen,
  Video,
  Plus,
  Megaphone,
  Brain,
  ShieldAlert,
  Crown,
  LayoutTemplate,
  GraduationCap
} from 'lucide-react';
import { superAdminApi } from '../../api';
import ErrorBoundary from '../common/ErrorBoundary';
import ClinicManageModal from './ClinicManageModal';
import CreateTenantModal from '../Superadmin/CreateTenantModal';
import PlansManagerTab from './PlansManagerTab';
import SubscriptionPlansManagerView from './SubscriptionPlansManagerView';
import PaymentRequestsTab from './PaymentRequestsTab';
import SaasInvoicesTab from './SaasInvoicesTab';
import AssessmentsCatalogManagerTab from './AssessmentsCatalogManagerTab';
import ExercisesCatalogManagerTab from './ExercisesCatalogManagerTab';
import PromosAndReferralsHubTab from './PromosAndReferralsHubTab';
import AiGovernanceView from './AiGovernanceView';
import AiManagementTab from './AiManagementTab';
import RepoMaintainerStudio from './RepoMaintainerStudio';
import ApiGatewaySettingsView from './ApiGatewaySettingsView';
import FeatureFlagsManagerView from './FeatureFlagsManagerView';
import ClinicQuotasManagerTab from './ClinicQuotasManagerTab';
import CustomDomainsTab from './CustomDomainsTab';
import SupportTicketsTab from './SupportTicketsTab';
import AdminTeamTab from './AdminTeamTab';
import DisasterRecoveryTab from './DisasterRecoveryTab';
import CommunicationGatewaysView from './CommunicationGatewaysView';
import TeletherapyManagerTab from './TeletherapyManagerTab';
import ServerTelemetryTab from './ServerTelemetryTab';
import AuditLogsManagerTab from './AuditLogsManagerTab';
import SubscriptionChaserManagerTab from './SubscriptionChaserManagerTab';
import AnnouncementsBroadcastTab from './AnnouncementsBroadcastTab';
import AiRoutingStudioTab from './AiRoutingStudioTab';
import GeoClinicMapTab from './GeoClinicMapTab';
import ClinicOnboardingFunnelTab from './ClinicOnboardingFunnelTab';
import AiDataAnalystView from '../analytics/AiDataAnalystView';
import SovereignControlTowerTab from './SovereignControlTowerTab';
import LandingPageStudioTab from './LandingPageStudioTab';
import HelpCenterStudioTab from './HelpCenterStudioTab';
import StudentOfferManagerTab from './StudentOfferManagerTab';
import ThemeToggle from '../common/ThemeToggle';

export default function SuperAdminDashboardView() {
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language || i18n.language.startsWith('ar');
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'sovereign_tower');

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };
  const [stats, setStats] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [plans, setPlans] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [saasInvoices, setSaasInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [isCreateClinicModalOpen, setIsCreateClinicModalOpen] = useState(false);

  const toggleLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Check if currently impersonating
  const hasBackupToken = Boolean(
    localStorage.getItem('backup_superadmin_token') || 
    localStorage.getItem('superadmin_backup_token') || 
    sessionStorage.getItem('superadmin_backup_token')
  );
  const isImpersonating = localStorage.getItem('is_impersonating') === 'true' && hasBackupToken;
  const impersonatingClinic = isImpersonating ? localStorage.getItem('impersonating_clinic_name') : null;
  const backupToken = localStorage.getItem('superadmin_backup_token') || localStorage.getItem('backup_superadmin_token');

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await superAdminApi.getStats().catch(() => null);
      if (statsRes?.stats) {
        setStats(statsRes.stats);
      }

      const [clinicsRes, plansRes, reqsRes, invsRes] = await Promise.all([
        superAdminApi.getClinics({
          search: searchTerm,
          status: statusFilter,
          wilaya: wilayaFilter,
          plan_id: planFilter,
        }).catch(() => ({ clinics: [] })),
        superAdminApi.getPlans().catch(() => ({ plans: [] })),
        superAdminApi.getPaymentRequests().catch(() => ({ requests: [] })),
        superAdminApi.getInvoices().catch(() => ({ invoices: [] })),
      ]);

      const cList = clinicsRes?.clinics || clinicsRes?.data || (Array.isArray(clinicsRes) ? clinicsRes : []);
      setClinics(cList);
      setPlans(plansRes?.plans || plansRes?.data || []);
      setPaymentRequests(reqsRes?.requests || reqsRes?.data || []);
      setPendingRequestsCount(reqsRes?.pending_count || 0);
      setSaasInvoices(invsRes?.invoices || invsRes?.data || []);
    } catch (err) {
      console.error('Failed to load Super Admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchData();
  }, [searchTerm, statusFilter, wilayaFilter, planFilter]);

  const handleStopImpersonation = () => {
    const bToken = localStorage.getItem('backup_superadmin_token') || localStorage.getItem('superadmin_backup_token') || sessionStorage.getItem('superadmin_backup_token');
    if (bToken) {
      localStorage.setItem('auth_token', bToken);
      localStorage.setItem('token', bToken);
      localStorage.setItem('clinic_token', bToken);
      localStorage.removeItem('backup_superadmin_token');
      localStorage.removeItem('superadmin_backup_token');
      sessionStorage.removeItem('superadmin_backup_token');
      sessionStorage.removeItem('superadmin_impersonating_tenant');
      localStorage.removeItem('is_impersonating');
      localStorage.removeItem('impersonating_clinic_name');
      const baseDomain = window.location.hostname.includes('psysnap.com') ? 'psysnap.com' : 'psypro.tech';
      window.location.href = (window.location.hostname.includes('psysnap.com') || window.location.hostname.includes('psypro.tech')) ? `https://${baseDomain}/superadmin` : '/superadmin';
    } else {
      window.location.href = '/superadmin';
    }
  };

  const handleImpersonate = async (clinic) => {
    if (!window.confirm(isRtl ? `هل تريد الدخول إلى مساحة عمل عيادة "${clinic.name}" لتقديم الدعم الفني؟` : `Voulez-vous accéder à l'espace de "${clinic.name}" en mode support technique ?`)) {
      return;
    }
    try {
      const res = await superAdminApi.impersonateClinic(clinic.id);
      const newToken = res.token || res.access_token || res.data?.token || res.data?.access_token;
      const redirectUrl = res.redirect_url || res.data?.redirect_url;

      const currentToken = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('clinic_token') || localStorage.getItem('superadmin_token');
      if (currentToken) {
        localStorage.setItem('backup_superadmin_token', currentToken);
        localStorage.setItem('superadmin_backup_token', currentToken);
        sessionStorage.setItem('superadmin_backup_token', currentToken);
      }

      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      if (newToken) {
        localStorage.setItem('token', newToken);
        localStorage.setItem('clinic_token', newToken);
        localStorage.setItem('auth_token', newToken);
        if (res.user || res.data?.user) {
          localStorage.setItem('user', JSON.stringify(res.user || res.data?.user));
        }
        if (res.clinic || res.tenant || clinic) {
          localStorage.setItem('tenant', JSON.stringify(res.clinic || res.tenant || clinic));
          localStorage.setItem('current_clinic', JSON.stringify(res.clinic || res.tenant || clinic));
        }
        localStorage.setItem('is_impersonating', 'true');
        localStorage.setItem('impersonating_clinic_name', clinic.name);
        window.location.href = '/dashboard';
      } else {
        alert(res.message || (isRtl ? 'تعذر الحصول على رمز جلسة الدخول من الخادم.' : 'Impossible d\'obtenir le token de session.'));
      }
    } catch (err) {
      console.error('Impersonation failed:', err);
      alert(err.response?.data?.message || err.message || (isRtl ? 'حدث خطأ أثناء محاولة الدخول لحساب العيادة.' : 'Erreur lors de la tentative de connexion.'));
    }
  };

  const totalClinics = clinics.length;
  const totalPages = Math.max(1, Math.ceil(totalClinics / pageSize));
  const paginatedClinics = clinics.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const navTabs = [
    { id: 'sovereign_tower', label: t('superadmin.tabs.sovereign_tower', '👑 قمرة القيادة والسيطرة السيادية'), icon: Crown, color: 'from-amber-500 via-rose-600 to-indigo-700' },
    { id: 'clinics', label: t('superadmin.tabs.clinics', '🏢 إدارة العيادات والاشتراكات'), icon: Building2 },
    { id: 'telemetry', label: t('superadmin.tabs.telemetry', '🖥️ صحة السيرفر وخدمات PM2'), icon: Activity, color: 'from-emerald-500 to-teal-700' },
    { id: 'audit_logs', label: t('superadmin.tabs.audit_logs', '🛡️ سجل التدقيق الجنائي والأمني'), icon: ShieldCheck, color: 'from-rose-600 to-amber-700' },
    { id: 'teletherapy', label: t('superadmin.tabs.teletherapy', '📹 التطبيب عن بعد والعيادات الافتراضية'), icon: Video, color: 'from-purple-600 to-indigo-600' },
    { id: 'communication', label: t('superadmin.tabs.communication', '📲 بوابات التواصل والرسائل'), icon: MessageSquare, color: 'from-emerald-500 to-teal-600' },
    { id: 'domains', label: t('superadmin.tabs.domains', '🌐 النطاقات المخصصة وSSL'), icon: Globe, color: 'from-sky-500 to-blue-600' },
    { id: 'backups', label: t('superadmin.tabs.backups', '💾 النسخ الاحتياطي واستعادة البيانات'), icon: Database, color: 'from-emerald-500 to-teal-600' },
    { id: 'support', label: t('superadmin.tabs.support', '🎧 مركز الدعم الفني والتذاكر'), icon: Headphones, color: 'from-rose-500 to-pink-600' },
    { id: 'admin_team', label: t('superadmin.tabs.admin_team', '👥 إدارة المشرفين والأذونات'), icon: Users, color: 'from-purple-500 to-indigo-600' },
    { id: 'api_gateway', label: t('superadmin.tabs.api_gateway', '🔑 مركز مفاتيح الـ API ومزودي AI'), icon: Key, color: 'from-amber-500 to-indigo-600' },
    { id: 'feature_flags', label: t('superadmin.tabs.feature_flags', '🎛️ مفاتيح تشغيل الميزات'), icon: SlidersHorizontal, color: 'from-indigo-600 to-purple-600' },
    { id: 'clinic_quotas', label: t('superadmin.tabs.clinic_quotas', '📊 إدارة حصص واستهلاك العيادات'), icon: PieChart, color: 'from-purple-600 to-pink-600' },
    { id: 'repo_maintainer', label: t('superadmin.tabs.repo_maintainer', '🛠️ صيانة الكود وسجلات الأخطاء'), icon: Terminal, color: 'from-blue-600 to-indigo-600' },
    { id: 'analytics', label: t('superadmin.tabs.analytics', '📈 محلل البيانات وإحصائيات BI'), icon: BarChart3, color: 'from-emerald-600 to-teal-600' },
    { id: 'lifecycle', label: t('superadmin.tabs.lifecycle', '🔄 دورة الاشتراكات ومطابقة BaridiMob'), icon: CreditCard, color: 'from-amber-500 to-emerald-600', count: pendingRequestsCount },
    { id: 'broadcasts', label: t('superadmin.tabs.broadcasts', '📢 مركز البث والإعلانات العامة'), icon: Megaphone, color: 'from-indigo-500 to-purple-600' },
    { id: 'ai_routing', label: t('superadmin.tabs.ai_routing', '⚡ أستوديو توجيه الذكاء وتتبع التكلفة'), icon: Brain, color: 'from-purple-600 to-indigo-700' },
    { id: 'geo_map', label: t('superadmin.tabs.geo_map', '🗺️ خريطة انتشار العيادات الوطنية'), icon: MapPin, color: 'from-emerald-600 to-teal-700' },
    { id: 'onboarding_funnel', label: t('superadmin.tabs.onboarding_funnel', '🎯 مسار تهيئة العيادات وقمع التحويل'), icon: Sparkles, color: 'from-indigo-600 to-purple-600' },
    { id: 'invoices', label: t('superadmin.tabs.invoices', '🧾 فواتير B2B'), icon: FileText },
    { id: 'tests', label: t('superadmin.tabs.tests', '📑 بنك المقاييس والمعايير'), icon: FileCode },
    { id: 'exercises', label: t('superadmin.tabs.exercises', '📚 بنك التمارين والكراسات'), icon: BookOpen, color: 'from-teal-600 to-emerald-600' },
    { id: 'coupons', label: t('superadmin.tabs.coupons', '🏷️ محرك الكوبونات والإحالات'), icon: Tag, color: 'from-rose-500 to-amber-600' },
    { id: 'ai_governance', label: t('superadmin.tabs.ai_governance', '🤖 حوكمة الذكاء الاصطناعي'), icon: Sparkles },
    { id: 'plans', label: t('superadmin.tabs.plans', '💳 باقات وخطط الاشتراك والأسعار'), icon: Coins, color: 'from-purple-500 to-indigo-600' },
    { id: 'landing_cms', label: t('superadmin.tabs.landing_cms', '🎨 تصميم وتخصيص الصفحة الرئيسية'), icon: LayoutTemplate, color: 'from-pink-500 via-purple-600 to-indigo-600' },
    { id: 'help_cms', label: t('superadmin.tabs.help_cms', '📚 إدارة وتخصيص دليل الاستخدام'), icon: HelpCircle, color: 'from-amber-500 via-teal-600 to-indigo-600' },
    { id: 'student_offer', label: t('superadmin.tabs.student_offer', '🎓 منحة وعرض الطلبة (9 أشهر مجاناً)'), icon: GraduationCap, color: 'from-amber-500 via-teal-600 to-indigo-600' },
  ];

  return (
    <div className={`space-y-6 font-sans ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Impersonation Banner */}
      {impersonatingClinic && (
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg">
          <div className={`flex items-center space-x-3 ${isRtl ? 'space-x-reverse' : ''} font-bold text-xs`}>
            <ShieldCheck className="w-5 h-5" />
            <span>{isRtl ? `أنت تسجل الدخول حالياً كمسؤول عيادة: ${impersonatingClinic}` : `Vous êtes actuellement connecté en tant que : ${impersonatingClinic}`}</span>
          </div>
          <button
            onClick={handleStopImpersonation}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-xl text-xs font-black transition"
          >
            {t('sidebar.stop_impersonation', isRtl ? 'إنهاء الجلسة والعودة للوحة الإدارة العامة' : 'Quitter le mode délégué')}
          </button>
        </div>
      )}

      {/* Hero Header & Tabs */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className={`flex items-center space-x-2 ${isRtl ? 'space-x-reverse' : ''}`}>
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                🛡️ SUPER ADMIN PRO SUITE
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Platform Uptime: 99.98% 🟢
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {t('superadmin.tower_title', isRtl ? 'لوحة التحكم والإشراف الشامل على المنصة' : 'Tour de Commandement Souveraine')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {t('superadmin.tower_subtitle', isRtl ? 'إدارة العيادات، الباقات، مفاتيح الـ API، الحصص الشهرية، وفحص أخطاء النظام والصيانة' : 'Gestion des cabinets, abonnements, clés API, quotas mensuels et supervision')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            {/* Language Switcher */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => toggleLanguage('ar')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                  isRtl ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇩🇿 العربية</span>
              </button>
              <button
                type="button"
                onClick={() => toggleLanguage('fr')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                  !isRtl ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇫🇷 Français</span>
              </button>
            </div>

            <ThemeToggle showLabel={true} className="px-3.5 py-2.5 rounded-2xl" />
            <button
              type="button"
              onClick={fetchData}
              className={`px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-2 ${isRtl ? 'space-x-reverse' : ''} shadow-md`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('superadmin.filters.refresh', isRtl ? 'تحديث البيانات' : 'Actualiser')}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent text-xs font-bold border-t border-slate-800 pt-4 scroll-smooth">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2.5 rounded-2xl transition whitespace-nowrap flex items-center space-x-2 ${isRtl ? 'space-x-reverse' : ''} shrink-0 ${
                  isActive
                    ? tab.color ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-indigo-500/20 font-black` : 'bg-indigo-600 text-white shadow-lg font-black'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">{t('superadmin.kpis.total_clinics', isRtl ? 'إجمالي العيادات' : 'Total Cabinets')}</div>
            <div className="text-2xl font-black text-white font-mono">{stats?.total_clinics ?? '--'}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">{t('superadmin.kpis.active_subscriptions', isRtl ? 'مشتركون نشطون' : 'Abonnés Actifs')}</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {stats?.active_subscriptions ?? '--'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">{t('superadmin.kpis.trial_clinics', isRtl ? 'فترة تجريبية (Trial)' : 'Essai Gratuit')}</div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {stats?.trialing_clinics ?? '--'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">{t('superadmin.kpis.total_patients', isRtl ? 'إجمالي المرضى بالمنصة' : 'Total Patients')}</div>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              {stats?.total_patients ?? '--'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">{t('superadmin.kpis.mrr', isRtl ? 'الإيراد الشهري المتكرر (MRR)' : 'Revenu Récurrent Mensuel (MRR)')}</div>
            <div className="text-xl font-black text-purple-300 font-mono">
              {stats?.mrr ? `${Number(stats.mrr).toLocaleString()} دج` : '0 دج'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area Protected by Error Boundary */}
      <div className="space-y-6">
        {activeTab === 'sovereign_tower' && (
          <ErrorBoundary>
            <SovereignControlTowerTab onNavigateTab={handleTabChange} />
          </ErrorBoundary>
        )}

        {activeTab === 'telemetry' && (
          <ErrorBoundary>
            <ServerTelemetryTab />
          </ErrorBoundary>
        )}

        {activeTab === 'audit_logs' && (
          <ErrorBoundary>
            <AuditLogsManagerTab />
          </ErrorBoundary>
        )}

        {activeTab === 'teletherapy' && (
          <ErrorBoundary>
            <TeletherapyManagerTab />
          </ErrorBoundary>
        )}

        {activeTab === 'communication' && (
          <ErrorBoundary>
            <CommunicationGatewaysView />
          </ErrorBoundary>
        )}

        {activeTab === 'domains' && (
          <ErrorBoundary>
            <CustomDomainsTab />
          </ErrorBoundary>
        )}

        {activeTab === 'backups' && (
          <ErrorBoundary>
            <DisasterRecoveryTab />
          </ErrorBoundary>
        )}

        {activeTab === 'support' && (
          <ErrorBoundary>
            <SupportTicketsTab />
          </ErrorBoundary>
        )}

        {activeTab === 'admin_team' && (
          <ErrorBoundary>
            <AdminTeamTab />
          </ErrorBoundary>
        )}

        {activeTab === 'api_gateway' && (
          <ErrorBoundary>
            <ApiGatewaySettingsView />
          </ErrorBoundary>
        )}

        {activeTab === 'feature_flags' && (
          <ErrorBoundary>
            <FeatureFlagsManagerView />
          </ErrorBoundary>
        )}

        {(activeTab === 'clinic_quotas' || activeTab === 'quotas') && (
          <ErrorBoundary>
            <ClinicQuotasManagerTab />
          </ErrorBoundary>
        )}

        {activeTab === 'repo_maintainer' && (
          <ErrorBoundary>
            <RepoMaintainerStudio />
          </ErrorBoundary>
        )}

        {activeTab === 'analytics' && (
          <ErrorBoundary>
            <AiDataAnalystView scope="superadmin" />
          </ErrorBoundary>
        )}

        {activeTab === 'ai_governance' && (
          <ErrorBoundary>
            <AiManagementTab />
          </ErrorBoundary>
        )}

        {(activeTab === 'lifecycle' || activeTab === 'requests') && (
          <ErrorBoundary>
            <SubscriptionChaserManagerTab />
          </ErrorBoundary>
        )}

        {activeTab === 'broadcasts' && (
          <ErrorBoundary>
            <AnnouncementsBroadcastTab />
          </ErrorBoundary>
        )}

        {activeTab === 'ai_routing' && (
          <ErrorBoundary>
            <AiRoutingStudioTab />
          </ErrorBoundary>
        )}

        {activeTab === 'geo_map' && (
          <ErrorBoundary>
            <GeoClinicMapTab />
          </ErrorBoundary>
        )}

        {activeTab === 'onboarding_funnel' && (
          <ErrorBoundary>
            <ClinicOnboardingFunnelTab />
          </ErrorBoundary>
        )}

        {activeTab === 'invoices' && (
          <ErrorBoundary>
            <SaasInvoicesTab
              invoices={saasInvoices}
              loading={loading}
              onRefresh={fetchData}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'tests' && (
          <ErrorBoundary>
            <AssessmentsCatalogManagerTab />
          </ErrorBoundary>
        )}

        {activeTab === 'exercises' && (
          <ErrorBoundary>
            <ExercisesCatalogManagerTab />
          </ErrorBoundary>
        )}

        {activeTab === 'coupons' && (
          <ErrorBoundary>
            <PromosAndReferralsHubTab />
          </ErrorBoundary>
        )}

        {activeTab === 'plans' && (
          <ErrorBoundary>
            <SubscriptionPlansManagerView />
          </ErrorBoundary>
        )}

        {activeTab === 'landing_cms' && (
          <ErrorBoundary>
            <LandingPageStudioTab />
          </ErrorBoundary>
        )}

        {activeTab === 'help_cms' && (
          <ErrorBoundary>
            <HelpCenterStudioTab />
          </ErrorBoundary>
        )}

        {activeTab === 'student_offer' && (
          <ErrorBoundary>
            <StudentOfferManagerTab />
          </ErrorBoundary>
        )}

        {activeTab === 'clinics' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center gap-3 shadow-xl">
              <div className="relative flex-1 min-w-[240px]">
                <Search className={`w-4 h-4 absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-slate-500`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('superadmin.filters.search_placeholder', isRtl ? 'بحث باسم العيادة، الطبيب، الهاتف، أو النطاق...' : 'Recherche par nom, médecin, téléphone...')}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-2xl ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500`}
                />
              </div>

              <div className="w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">{t('superadmin.filters.all_statuses', isRtl ? 'كافة الحالات (الكل)' : 'Tous les statuts')}</option>
                  <option value="active">{t('superadmin.filters.status_active', isRtl ? '🟢 مشترك نشط (Active)' : '🟢 Actif (Active)')}</option>
                  <option value="trialing">{t('superadmin.filters.status_trial', isRtl ? '⏳ فترة تجريبية (Trial)' : '⏳ Essai (Trial)')}</option>
                  <option value="suspended">{t('superadmin.filters.status_suspended', isRtl ? '⛔ حساب مجمد (Suspended)' : '⛔ Suspendu')}</option>
                  <option value="expired">{isRtl ? '🔴 منتهي الصلاحية (Expired)' : '🔴 Expiré'}</option>
                </select>
              </div>

              <div className="w-44">
                <select
                  value={wilayaFilter}
                  onChange={(e) => setWilayaFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">{t('superadmin.filters.all_wilayas', isRtl ? 'كافة الولايات (58 ولاية)' : 'Toutes les Wilayas (58)')}</option>
                  <option value="16">16 - Alger / الجزائر</option>
                  <option value="31">31 - Oran / وهران</option>
                  <option value="25">25 - Constantine / قسنطينة</option>
                  <option value="09">09 - Blida / البليدة</option>
                  <option value="06">06 - Béjaïa / بجاية</option>
                  <option value="15">15 - Tizi Ouzou / تيزي وزو</option>
                  <option value="19">19 - Sétif / سطيف</option>
                  <option value="13">13 - Tlemcen / تلمسان</option>
                  <option value="23">23 - Annaba / عنابة</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateClinicModalOpen(true)}
                className={`px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black transition flex items-center space-x-2 ${isRtl ? 'space-x-reverse mr-auto' : 'ml-auto'} shadow-lg shadow-emerald-500/25 shrink-0`}
              >
                <Plus className="w-4 h-4" />
                <span>{t('superadmin.filters.create_clinic', isRtl ? '+ إنشاء عيادة جديدة' : '+ Nouveau Cabinet')}</span>
              </button>
            </div>

            {/* Clinics Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} text-xs`}>
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold">
                    <tr>
                      <th className="p-4">{isRtl ? 'معلومات العيادة والنطاق' : 'Cabinet & Domaine'}</th>
                      <th className="p-4">{isRtl ? 'المسؤول الطبي' : 'Praticien / Responsable'}</th>
                      <th className="p-4">{isRtl ? 'الولاية والموقع' : 'Wilaya & Lieu'}</th>
                      <th className="p-4">{isRtl ? 'حالة الاشتراك' : 'Statut'}</th>
                      <th className="p-4">{isRtl ? 'الباقة الحالية' : 'Abonnement'}</th>
                      <th className="p-4">{isRtl ? 'المرضى' : 'Patients'}</th>
                      <th className="p-4">{isRtl ? 'تاريخ الانتهاء' : 'Date d\'expiration'}</th>
                      <th className="p-4 text-center">{isRtl ? 'إجراءات الإدارة' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {clinics.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          {loading ? (
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                              <span>{isRtl ? 'جارٍ تحميل العيادات...' : 'Chargement des cabinets...'}</span>
                            </div>
                          ) : (
                            isRtl ? 'لا توجد عيادات مطابقة لشروط البحث.' : 'Aucun cabinet ne correspond à votre recherche.'
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedClinics.map((c) => {
                        const rawStatus = c.subscription?.status || c.status || 'active';
                        const statusBadge =
                          rawStatus === 'active'
                            ? { label: isRtl ? 'نشط' : 'Actif', class: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' }
                            : rawStatus === 'trialing' || rawStatus === 'trial'
                            ? { label: isRtl ? 'تجريبي' : 'Essai', class: 'bg-amber-500/10 text-amber-300 border-amber-500/30' }
                            : rawStatus === 'suspended'
                            ? { label: isRtl ? 'مجمد' : 'Suspendu', class: 'bg-rose-500/10 text-rose-300 border-rose-500/30' }
                            : { label: isRtl ? 'منتهي' : 'Expiré', class: 'bg-slate-800 text-slate-400 border-slate-700' };

                        const ownerName = c.owner?.name || c.owner_name || (isRtl ? 'الدكتور المسؤول' : 'Dr. Responsable');
                        const ownerContact = c.owner?.email || c.owner_email || c.phone || c.email || '--';
                        const wilayaText = c.address || c.wilaya_name || c.wilaya || (isRtl ? 'الجزائر' : 'Alger');
                        const planText = c.subscription?.plan?.name_ar || c.plan_name || c.plan?.name || 'Pro';
                        const patientsCount = c.metrics?.patients_count ?? c.patients_count ?? 0;
                        const endsAt = c.subscription?.ends_at
                          ? new Date(c.subscription.ends_at).toLocaleDateString(isRtl ? 'ar-DZ' : 'fr-FR')
                          : c.subscription_ends_at
                          ? new Date(c.subscription_ends_at).toLocaleDateString(isRtl ? 'ar-DZ' : 'fr-FR')
                          : (isRtl ? 'مفتوح' : 'Illimité');

                        return (
                          <tr key={c.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-4">
                              <div className="font-bold text-white text-xs">{c.name}</div>
                              <div className="text-[11px] font-mono text-indigo-400 mt-0.5">
                                {c.subdomain ? `${c.subdomain}.psypro.tech` : c.custom_domain || 'clinic.psypro.tech'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-white font-bold">{ownerName}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-cyan-300 font-mono select-all">
                                  {c.owner?.email || c.owner_email || c.email || `admin@${c.subdomain}.psypro.tech`}
                                </span>
                              </div>
                              {(c.owner?.phone || c.phone) && (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  📞 {c.owner?.phone || c.phone}
                                </div>
                              )}
                            </td>
                            <td className="p-4 font-bold text-slate-300">
                              {wilayaText}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${statusBadge.class}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-purple-300 font-mono text-xs">
                              {planText}
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-200">
                              {patientsCount}
                            </td>
                            <td className="p-4 text-slate-400 font-mono text-[11px]">
                              {endsAt}
                            </td>
                            <td className="p-4 text-center">
                              <div className={`flex items-center justify-center space-x-2 ${isRtl ? 'space-x-reverse' : ''}`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedClinic(c);
                                    setShowManageModal(true);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1 ${isRtl ? 'space-x-reverse' : ''}`}
                                  title={isRtl ? 'فتح إعدادات وتحكم العيادة' : 'Gérer le cabinet'}
                                >
                                  <span>{isRtl ? 'تحكم' : 'Gérer'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleImpersonate(c)}
                                  className={`px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold transition flex items-center space-x-1 ${isRtl ? 'space-x-reverse' : ''}`}
                                  title={isRtl ? 'الدخول إلى مساحة عمل العيادة كمسؤول' : 'Accéder en mode délégué'}
                                >
                                  <span>{isRtl ? 'دخول ⚡' : 'Entrer ⚡'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {totalClinics > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-950/70 gap-4 text-xs">
                  <div className={`flex items-center space-x-2 ${isRtl ? 'space-x-reverse' : ''} text-slate-400`}>
                    <span>{isRtl ? 'عرض' : 'Affichage'}</span>
                    <span className="font-bold text-white font-mono">
                      {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalClinics)}
                    </span>
                    <span>{isRtl ? 'من أصل' : 'sur'}</span>
                    <span className="font-bold text-indigo-400 font-mono">{totalClinics}</span>
                    <span>{isRtl ? 'عيادة' : 'cabinets'}</span>
                  </div>

                  <div className={`flex items-center space-x-2 ${isRtl ? 'space-x-reverse' : ''}`}>
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-bold transition"
                    >
                      {isRtl ? 'السابق' : 'Précédent'}
                    </button>

                    <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-indigo-300 font-mono font-bold">
                      {currentPage} / {totalPages}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-bold transition"
                    >
                      {isRtl ? 'التالي' : 'Suivant'}
                    </button>

                    <div className={`flex items-center space-x-1.5 ${isRtl ? 'space-x-reverse mr-3' : 'ml-3'} text-slate-400`}>
                      <span>{isRtl ? 'لكل صفحة:' : 'Par page:'}</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold focus:outline-none"
                      >
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Clinic Manage Modal */}
      {showManageModal && selectedClinic && (
        <ClinicManageModal
          clinic={selectedClinic}
          plans={plans}
          isOpen={showManageModal}
          onClose={() => {
            setShowManageModal(false);
            setSelectedClinic(null);
          }}
          onRefresh={fetchData}
        />
      )}

      {/* Superadmin Create Clinic Modal */}
      {isCreateClinicModalOpen && (
        <CreateTenantModal
          isOpen={isCreateClinicModalOpen}
          onClose={() => setIsCreateClinicModalOpen(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
