import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  FileCode,
  Tag,
  Brain,
  Megaphone,
  Server,
  Coins,
  Search,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MapPin,
  Sparkles,
  ShieldCheck,
  LifeBuoy,
  Database,
  HeartPulse,
  HardDrive,
  Share2
} from 'lucide-react';
import { superAdminApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import SuperAdminOverviewTab from './SuperAdminOverviewTab';
import ClinicManageModal from './ClinicManageModal';
import PlansManagerTab from './PlansManagerTab';
import PaymentRequestsTab from './PaymentRequestsTab';
import SaasInvoicesTab from './SaasInvoicesTab';
import AssessmentsCatalogManagerTab from './AssessmentsCatalogManagerTab';
import CouponsManagerTab from './CouponsManagerTab';
import AiGatewayMonitorTab from './AiGatewayMonitorTab';
import AnnouncementsManagerTab from './AnnouncementsManagerTab';
import SystemDevOpsTab from './SystemDevOpsTab';
import SupportTicketsTab from './SupportTicketsTab';
import DisasterRecoveryTab from './DisasterRecoveryTab';
import ClinicHealthTab from './ClinicHealthTab';
import SystemSettingsTab from './SystemSettingsTab';
import QuotasAndLimitsTab from './QuotasAndLimitsTab';
import AffiliatesTab from './AffiliatesTab';

export default function MasterAdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentSubTab, setPaymentSubTab] = useState('requests'); // 'requests' or 'invoices'

  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState([]);
  const [plans, setPlans] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [saasInvoices, setSaasInvoices] = useState([]);

  // Search and filters for clinics table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  // Manage Clinic Modal
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);

  const isSuperAdmin = user?.is_super_admin === true || user?.role === 'superadmin' || user?.role === 'super_admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clinicsRes, plansRes, requestsRes, invoicesRes] = await Promise.allSettled([
        superAdminApi.getClinics({ search: searchTerm, status: statusFilter, plan_id: planFilter }),
        superAdminApi.getPlans(),
        superAdminApi.getPaymentRequests(),
        superAdminApi.getInvoices(),
      ]);

      if (clinicsRes.status === 'fulfilled' && clinicsRes.value) {
        setClinics(clinicsRes.value.clinics || []);
      }
      if (plansRes.status === 'fulfilled' && plansRes.value) {
        setPlans(plansRes.value.plans || []);
      }
      if (requestsRes.status === 'fulfilled' && requestsRes.value) {
        setPaymentRequests(requestsRes.value.requests || []);
      }
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value) {
        setSaasInvoices(invoicesRes.value.invoices || []);
      }
    } catch (err) {
      console.error('Error loading super admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, statusFilter, planFilter]);

  const pendingRequestsCount = paymentRequests.filter((r) => r.status === 'pending').length;

  const navTabs = [
    { id: 'overview', label: 'المؤشرات العامة', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'clinics', label: 'إدارة العيادات والتراخيص', icon: <Building2 className="w-4 h-4" /> },
    { id: 'health', label: 'تفاعل وصحة العيادات', icon: <HeartPulse className="w-4 h-4" /> },
    {
      id: 'payments',
      label: 'المدفوعات والفواتير',
      icon: <CreditCard className="w-4 h-4" />,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
    },
    { id: 'tickets', label: 'تذاكر الدعم والمساعدة', icon: <LifeBuoy className="w-4 h-4" /> },
    { id: 'quotas', label: 'الحصص والموارد والتخزين', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'affiliates', label: 'شركاء التسويق والإحالة', icon: <Share2 className="w-4 h-4" /> },
    { id: 'tests', label: 'كتالوج المقاييس والترخيص', icon: <FileCode className="w-4 h-4" /> },
    { id: 'coupons', label: 'التسويق والكوبونات', icon: <Tag className="w-4 h-4" /> },
    { id: 'ai', label: 'الذكاء الاصطناعي (AI Gateway)', icon: <Brain className="w-4 h-4" /> },
    { id: 'announcements', label: 'الإعلانات والتنبيهات', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'disaster_recovery', label: 'النسخ الاحتياطي الشامل', icon: <Database className="w-4 h-4" /> },
    { id: 'settings', label: 'إعدادات النظام والربط', icon: <Sliders className="w-4 h-4" /> },
    { id: 'devops', label: 'صيانة الخادم والسجلات', icon: <Server className="w-4 h-4" /> },
    { id: 'plans', label: 'خطط الاشتراك', icon: <Coins className="w-4 h-4" /> },
  ];

  if (user && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-right font-sans" dir="rtl">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">صلاحيات المدير العام مطلوبة</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            هذه الصفحة مخصصة حصرياً لمديري المنصة السحابية (Super Administrators). حسابك الحالي لا يمتلك صلاحيات الوصول لهذه الوحدة المركزية.
          </p>
          <div className="pt-2">
            <a
              href="/dashboard"
              className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition"
            >
              العودة إلى لوحة العيادة
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 text-right font-sans" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                SaaS Super-Admin Console v3.2
              </span>
              <span className="text-slate-500 text-xs">|</span>
              <span className="text-slate-400 text-xs font-mono">psypro.tech Multi-Tenant Core</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>لوحة الإدارة المركزية والتحكم الشامل</span>
              <ShieldCheck className="w-7 h-7 text-teal-400 inline" />
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              إدارة التراخيص، العيادات، الفواتير، المقاييس المقننة، الكوبونات، محرك الذكاء الاصطناعي، وصيانة الخادم السحابي.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition flex items-center gap-2 self-start lg:self-auto border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>

        {/* Integrated Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/30 border border-brand-400/40'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Render Views */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <SuperAdminOverviewTab onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'clinics' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث باسم العيادة، الطبيب، الهاتف، أو النطاق..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="w-44">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
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
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">كافة الباقات</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_ar}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clinics Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {loading ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-400 mb-3" />
                  جاري استرجاع سجلات العيادات...
                </div>
              ) : clinics.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Building2 className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-base font-semibold text-slate-300">لا توجد عيادات مطابقة لمعايير البحث</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold">
                        <th className="py-3.5 px-4">العيادة (Clinic)</th>
                        <th className="py-3.5 px-4">الطبيب المسؤول (Owner)</th>
                        <th className="py-3.5 px-4">الموقع والهاتف</th>
                        <th className="py-3.5 px-4">النشاط والمرضى</th>
                        <th className="py-3.5 px-4">الباقة والاشتراك</th>
                        <th className="py-3.5 px-4">الحالة (Status)</th>
                        <th className="py-3.5 px-4 text-center">الإجراءات والترخيص</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {clinics.map((c) => {
                        const sub = c.subscription;
                        const metrics = c.metrics || {};

                        return (
                          <tr key={c.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white text-sm">{c.name}</div>
                              <span className="font-mono text-teal-300 text-[11px]">
                                {c.subdomain}.psypro.tech
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-200">{c.owner?.name || '--'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{c.owner?.email || '--'}</div>
                            </td>

                            <td className="py-3.5 px-4 text-slate-300">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                <span>{c.address ? c.address.slice(0, 25) : '--'}</span>
                              </div>
                              <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                                {c.owner?.phone || c.phone || '--'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-bold">
                                  {metrics.patients_count || 0} مريض
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                                  {metrics.assessments_count || 0} حصيلة
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-teal-300">
                                {sub?.plan_name_ar || 'باقة مخصصة'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                ينتهي: <span className="font-mono text-slate-300">{sub?.ends_at || '--'}</span>
                                {sub && (
                                  <span className="font-mono text-amber-400 mr-1.5">
                                    ({sub.days_remaining} يوم متبقي)
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                                  c.computed_status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : c.computed_status === 'trialing'
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                    : c.computed_status === 'suspended'
                                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {sub?.status_label_ar || 'غير محدد'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedClinic(c);
                                  setShowManageModal(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow transition flex items-center gap-1.5 mx-auto"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>إدارة والترخيص</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start text-xs font-bold max-w-md">
              <button
                onClick={() => setPaymentSubTab('requests')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  paymentSubTab === 'requests'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>طلبات السداد والتحقق ({paymentRequests.length})</span>
              </button>

              <button
                onClick={() => setPaymentSubTab('invoices')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  paymentSubTab === 'invoices'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>فواتير B2B الصادرة ({saasInvoices.length})</span>
              </button>
            </div>

            {paymentSubTab === 'requests' ? (
              <PaymentRequestsTab
                requests={paymentRequests}
                loading={loading}
                onRefresh={fetchData}
              />
            ) : (
              <SaasInvoicesTab
                invoices={saasInvoices}
                loading={loading}
                onRefresh={fetchData}
              />
            )}
          </div>
        )}

        {activeTab === 'health' && <ClinicHealthTab />}

        {activeTab === 'tickets' && <SupportTicketsTab />}

        {activeTab === 'quotas' && <QuotasAndLimitsTab />}

        {activeTab === 'affiliates' && <AffiliatesTab />}

        {activeTab === 'tests' && <AssessmentsCatalogManagerTab />}

        {activeTab === 'coupons' && <CouponsManagerTab />}

        {activeTab === 'ai' && <AiGatewayMonitorTab />}

        {activeTab === 'announcements' && <AnnouncementsManagerTab />}

        {activeTab === 'disaster_recovery' && <DisasterRecoveryTab />}

        {activeTab === 'settings' && <SystemSettingsTab />}

        {activeTab === 'devops' && <SystemDevOpsTab />}

        {activeTab === 'plans' && <PlansManagerTab plans={plans} onRefresh={fetchData} />}
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
    </div>
  );
}
