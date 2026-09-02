import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Plus
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
import CouponsManagerTab from './CouponsManagerTab';
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
import AiDataAnalystView from '../analytics/AiDataAnalystView';

export default function SuperAdminDashboardView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('clinics');
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

  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [isCreateClinicModalOpen, setIsCreateClinicModalOpen] = useState(false);

  // Check if currently impersonating
  const impersonatingClinic = localStorage.getItem('impersonating_clinic_name');
  const backupToken = localStorage.getItem('superadmin_backup_token');

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
      window.location.href = window.location.hostname.includes('psypro.tech') ? 'https://psypro.tech/superadmin' : '/superadmin';
    } else {
      window.location.href = '/superadmin';
    }
  };

  const handleImpersonate = async (clinic) => {
    if (!window.confirm(`هل تريد الدخول إلى مساحة عمل عيادة "${clinic.name}" لتقديم الدعم الفني؟`)) {
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
        alert(res.message || 'تعذر الحصول على رمز جلسة الدخول من الخادم.');
      }
    } catch (err) {
      console.error('Impersonation failed:', err);
      alert(err.response?.data?.message || err.message || 'حدث خطأ أثناء محاولة الدخول لحساب العيادة.');
    }
  };

  const navTabs = [
    { id: 'clinics', label: '🏢 إدارة العيادات والاشتراكات', icon: Building2 },
    { id: 'communication', label: '📲 بوابات التواصل والرسائل', icon: MessageSquare, color: 'from-emerald-500 to-teal-600' },
    { id: 'domains', label: '🌐 النطاقات المخصصة وSSL', icon: Globe, color: 'from-sky-500 to-blue-600' },
    { id: 'backups', label: '💾 النسخ الاحتياطي واستعادة البيانات', icon: Database, color: 'from-emerald-500 to-teal-600' },
    { id: 'support', label: '🎧 مركز الدعم الفني والتذاكر', icon: Headphones, color: 'from-rose-500 to-pink-600' },
    { id: 'admin_team', label: '👥 إدارة المشرفين والأذونات', icon: Users, color: 'from-purple-500 to-indigo-600' },
    { id: 'api_gateway', label: '🔑 مركز مفاتيح الـ API ومزودي AI', icon: Key, color: 'from-amber-500 to-indigo-600' },
    { id: 'feature_flags', label: '🎛️ مفاتيح تشغيل الميزات', icon: SlidersHorizontal, color: 'from-indigo-600 to-purple-600' },
    { id: 'clinic_quotas', label: '📊 إدارة حصص واستهلاك العيادات', icon: PieChart, color: 'from-purple-600 to-pink-600' },
    { id: 'repo_maintainer', label: '🛠️ صيانة الكود وسجلات الأخطاء', icon: Terminal, color: 'from-blue-600 to-indigo-600' },
    { id: 'analytics', label: '📈 محلل البيانات وإحصائيات BI', icon: BarChart3, color: 'from-emerald-600 to-teal-600' },
    { id: 'requests', label: '💳 طلبات الدفع BaridiMob', icon: CreditCard, count: pendingRequestsCount },
    { id: 'invoices', label: '🧾 فواتير B2B', icon: FileText },
    { id: 'tests', label: '📑 بنك المقاييس والمعايير', icon: FileCode },
    { id: 'coupons', label: '🏷️ كوبونات الخصم', icon: Tag },
    { id: 'ai_governance', label: '🤖 حوكمة الذكاء الاصطناعي', icon: Sparkles },
    { id: 'plans', label: '💳 باقات وخطط الاشتراك والأسعار', icon: Coins, color: 'from-purple-500 to-indigo-600' },
  ];

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Impersonation Banner */}
      {impersonatingClinic && (
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3 space-x-reverse font-bold text-xs">
            <ShieldCheck className="w-5 h-5" />
            <span>أنت تسجل الدخول حالياً كمسؤول عيادة: {impersonatingClinic}</span>
          </div>
          <button
            onClick={handleStopImpersonation}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-xl text-xs font-black transition"
          >
            إنهاء الجلسة والعودة للوحة الإدارة العامة
          </button>
        </div>
      )}

      {/* Hero Header & Tabs */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                🛡️ SUPER ADMIN PRO SUITE
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Platform Uptime: 99.98% 🟢
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              لوحة التحكم والإشراف الشامل على المنصة
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              إدارة العيادات، الباقات، مفاتيح الـ API، الحصص الشهرية، وفحص أخطاء النظام والصيانة
            </p>
          </div>

          <button
            type="button"
            onClick={fetchData}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-2 space-x-reverse self-start md:self-auto shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>

        {/* Scrollable Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent text-xs font-bold border-t border-slate-800 pt-4 scroll-smooth">
          {navTabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 rounded-2xl transition whitespace-nowrap flex items-center space-x-2 space-x-reverse shrink-0 ${
                  isActive
                    ? t.color ? `bg-gradient-to-r ${t.color} text-white shadow-lg shadow-indigo-500/20 font-black` : 'bg-indigo-600 text-white shadow-lg font-black'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                    {t.count}
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
            <div className="text-[11px] text-slate-400 font-bold">إجمالي العيادات</div>
            <div className="text-2xl font-black text-white font-mono">{stats?.total_clinics ?? '--'}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">مشتركون نشطون</div>
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
            <div className="text-[11px] text-slate-400 font-bold">فترة تجريبية (Trial)</div>
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
            <div className="text-[11px] text-slate-400 font-bold">إجمالي المرضى بالمنصة</div>
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
            <div className="text-[11px] text-slate-400 font-bold">الإيراد التراكمي (DZD)</div>
            <div className="text-xl font-black text-purple-300 font-mono">
              {stats?.mrr ? `${Number(stats.mrr).toLocaleString()} دج` : '0 دج'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area Protected by Error Boundary */}
      <div className="space-y-6">
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

        {activeTab === 'requests' && (
          <ErrorBoundary>
            <PaymentRequestsTab
              requests={paymentRequests}
              loading={loading}
              onRefresh={fetchData}
            />
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

        {activeTab === 'coupons' && (
          <ErrorBoundary>
            <CouponsManagerTab />
          </ErrorBoundary>
        )}

        {activeTab === 'plans' && (
          <ErrorBoundary>
            <SubscriptionPlansManagerView />
          </ErrorBoundary>
        )}

        {activeTab === 'clinics' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center gap-3 shadow-xl">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث باسم العيادة، الطبيب، الهاتف، أو النطاق..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">كافة الحالات (الكل)</option>
                  <option value="active">🟢 مشترك نشط (Active)</option>
                  <option value="trialing">⏳ فترة تجريبية (Trial)</option>
                  <option value="suspended">⛔ حساب مجمد (Suspended)</option>
                  <option value="expired">🔴 منتهي الصلاحية (Expired)</option>
                </select>
              </div>

              <div className="w-44">
                <select
                  value={wilayaFilter}
                  onChange={(e) => setWilayaFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">كافة الولايات (58 ولاية)</option>
                  <option value="16">16 - الجزائر العاصمة</option>
                  <option value="31">31 - وهران</option>
                  <option value="25">25 - قسنطينة</option>
                  <option value="09">09 - البليدة</option>
                  <option value="06">06 - بجاية</option>
                  <option value="15">15 - تيزي وزو</option>
                  <option value="19">19 - سطيف</option>
                  <option value="13">13 - تلمسان</option>
                  <option value="23">23 - عنابة</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateClinicModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-emerald-500/25 shrink-0 mr-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ إنشاء عيادة جديدة</span>
              </button>
            </div>

            {/* Clinics Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold">
                    <tr>
                      <th className="p-4">معلومات العيادة والنطاق</th>
                      <th className="p-4">المسؤول الطبي</th>
                      <th className="p-4">الولاية والموقع</th>
                      <th className="p-4">حالة الاشتراك</th>
                      <th className="p-4">الباقة الحالية</th>
                      <th className="p-4">المرضى</th>
                      <th className="p-4">تاريخ الانتهاء</th>
                      <th className="p-4 text-center">إجراءات الإدارة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {clinics.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          {loading ? (
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                              <span>جارٍ تحميل العيادات...</span>
                            </div>
                          ) : (
                            'لا توجد عيادات مطابقة لشروط البحث.'
                          )}
                        </td>
                      </tr>
                    ) : (
                      clinics.map((c) => {
                        const rawStatus = c.subscription?.status || c.status || 'active';
                        const statusBadge =
                          rawStatus === 'active'
                            ? { label: 'نشط', class: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' }
                            : rawStatus === 'trialing' || rawStatus === 'trial'
                            ? { label: 'تجريبي', class: 'bg-amber-500/10 text-amber-300 border-amber-500/30' }
                            : rawStatus === 'suspended'
                            ? { label: 'مجمد', class: 'bg-rose-500/10 text-rose-300 border-rose-500/30' }
                            : { label: 'منتهي', class: 'bg-slate-800 text-slate-400 border-slate-700' };

                        const ownerName = c.owner?.name || c.owner_name || 'الدكتور المسؤول';
                        const ownerContact = c.owner?.email || c.owner_email || c.phone || c.email || '--';
                        const wilayaText = c.address || c.wilaya_name || c.wilaya || 'الجزائر';
                        const planText = c.subscription?.plan?.name_ar || c.plan_name || c.plan?.name || 'باقة Pro';
                        const patientsCount = c.metrics?.patients_count ?? c.patients_count ?? 0;
                        const endsAt = c.subscription?.ends_at
                          ? new Date(c.subscription.ends_at).toLocaleDateString('ar-DZ')
                          : c.subscription_ends_at
                          ? new Date(c.subscription_ends_at).toLocaleDateString('ar-DZ')
                          : 'مفتوح';

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
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{ownerContact}</div>
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
                              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedClinic(c);
                                    setShowManageModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1 space-x-reverse"
                                  title="فتح إعدادات وتحكم العيادة"
                                >
                                  <span>تحكم</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleImpersonate(c)}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold transition flex items-center space-x-1 space-x-reverse"
                                  title="الدخول إلى مساحة عمل العيادة كمسؤول"
                                >
                                  <span>دخول ⚡</span>
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
