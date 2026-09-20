import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  X,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Send,
  MessageSquare,
  ShieldAlert,
  Zap,
  RotateCw,
  ZoomIn,
  Copy,
  ExternalLink,
  Building2,
  User,
  Phone,
  Filter,
  Search,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function SubscriptionChaserManagerTab() {
  const [subView, setSubView] = useState('lifecycle'); // 'lifecycle' | 'proofs' | 'settings'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    counts: {
      total: 0,
      active: 0,
      expiring_soon: 0,
      in_grace_period: 0,
      suspended: 0,
      trial: 0,
      bypassed: 0,
      pending_proofs: 0,
      pending_proofs_amount: 0,
    },
    clinics: [],
    coordinates: {
      rip: '00799999002233445566',
      ccp: '20045678',
      cle: '45',
      titulaire: 'SaaS PsyPro Algérie',
      phone: '+213 555 12 34 56',
    }
  });

  // Proofs Inbox state
  const [proofs, setProofs] = useState([]);
  const [proofsLoading, setProofsLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedClinicForChaser, setSelectedClinicForChaser] = useState(null);
  const [chaserTemplate, setChaserTemplate] = useState('early_7d');
  const [customChaserText, setCustomChaserText] = useState('');
  const [chaserLoading, setChaserLoading] = useState(false);
  const [chaserResult, setChaserResult] = useState(null);

  const [selectedClinicForGrace, setSelectedClinicForGrace] = useState(null);
  const [graceDays, setGraceDays] = useState(5);
  const [graceLoading, setGraceLoading] = useState(false);

  // Fallback Plans
  // Canonical Algerian Subscription Plans Catalog with aliases
  const CANONICAL_PLANS = [
    { id: 1, slug: 'solo_starter', aliases: ['solo', 'pro', 'solo_starter', '1', 'cabinet solo'], name_ar: 'باقة الأخصائي الفردي (Cabinet Solo)', price_monthly: 4500, price_yearly: 45000 },
    { id: 2, slug: 'multi_pro', aliases: ['multi_pro', 'multipro', 'multi', '2', 'centre multi-pro'], name_ar: 'باقة المركز المتكامل (Centre Multi-Pro)', price_monthly: 9500, price_yearly: 95000 },
    { id: 3, slug: 'enterprise_dz', aliases: ['enterprise', 'enterprise_dz', 'reseau', '3', 'enterprise dz'], name_ar: 'باقة المؤسسات والشبكات (Enterprise DZ)', price_monthly: 18000, price_yearly: 180000 },
    { id: 4, slug: 'starter', aliases: ['starter', 'debutant', '4'], name_ar: 'باقة الانطلاقة (Débutant / Starter)', price_monthly: 2500, price_yearly: 25000 },
    { id: 5, slug: 'duo', aliases: ['duo', 'duo_partage', '5'], name_ar: 'باقة العيادة المشتركة (Duo Partagé)', price_monthly: 7500, price_yearly: 72000 },
  ];

  const resolvePlan = (planIdOrSlug, planList = CANONICAL_PLANS) => {
    if (!planIdOrSlug) return CANONICAL_PLANS[0];
    const str = String(planIdOrSlug).toLowerCase().trim();
    const found = CANONICAL_PLANS.find(p => String(p.id) === str || p.slug === str || p.aliases.includes(str));
    if (found && Array.isArray(planList) && planList.length > 0) {
      const backendMatch = planList.find(bp => String(bp.id) === String(found.id) || bp.slug === found.slug || found.aliases.includes(String(bp.slug || '').toLowerCase()));
      if (backendMatch) {
        return {
          ...found,
          id: found.id,
          price_yearly: Number(backendMatch.price_yearly) > 0 ? Number(backendMatch.price_yearly) : found.price_yearly,
          price_monthly: Number(backendMatch.price_monthly) > 0 ? Number(backendMatch.price_monthly) : found.price_monthly,
          name_ar: backendMatch.name_ar || found.name_ar,
        };
      }
    }
    return found || CANONICAL_PLANS[0];
  };

  const [plans, setPlans] = useState(CANONICAL_PLANS);
  const [selectedClinicForRenew, setSelectedClinicForRenew] = useState(null);
  const [selectedRenewPlanId, setSelectedRenewPlanId] = useState(1);
  const [renewMonths, setRenewMonths] = useState(12);
  const [renewAmount, setRenewAmount] = useState(45000);
  const [renewMethod, setRenewMethod] = useState('baridimob');
  const [renewRef, setRenewRef] = useState('');
  const [renewLoading, setRenewLoading] = useState(false);

  // Proof Lightbox
  const [activeProofLightbox, setActiveProofLightbox] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);

  // Action status notification
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenRenewModal = (clinic) => {
    setSelectedClinicForRenew(clinic);
    const matched = resolvePlan(clinic.plan_id || clinic.subscription?.plan_id || clinic.subscription?.subscription_plan_id, plans);
    setSelectedRenewPlanId(matched.id);
    setRenewMonths(12);
    setRenewMethod('baridimob');
    setRenewRef('');
    setRenewAmount(matched.price_yearly || 45000);
  };

  const handleRenewPlanChange = (newPlanId) => {
    const matched = resolvePlan(newPlanId, plans);
    setSelectedRenewPlanId(matched.id);
    const m = parseInt(renewMonths, 10);
    if (m === 12) setRenewAmount(matched.price_yearly);
    else if (m === 24) setRenewAmount(matched.price_yearly * 2);
    else setRenewAmount((matched.price_monthly || 4500) * m);
  };

  const handleRenewMonthsChange = (newMonths) => {
    const m = parseInt(newMonths, 10);
    setRenewMonths(m);
    const matched = resolvePlan(selectedRenewPlanId, plans);
    if (m === 12) setRenewAmount(matched.price_yearly);
    else if (m === 24) setRenewAmount(matched.price_yearly * 2);
    else setRenewAmount((matched.price_monthly || 4500) * m);
  };

  const fetchLifecycleData = async () => {
    setLoading(true);
    try {
      superAdminApi.getPlans().then(pRes => {
        if (pRes?.plans?.length) setPlans(pRes.plans);
      }).catch(() => {});

      const res = await superAdminApi.getLifecycleOverview({
        status: statusFilter,
        search: searchTerm,
      });
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load lifecycle overview:', err);
      showFeedback('error', err.message || 'فشل جلب بيانات دورة حياة الاشتراكات.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProofs = async () => {
    setProofsLoading(true);
    try {
      const res = await superAdminApi.getPaymentProofInbox();
      if (res.success) {
        setProofs(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load payment proofs:', err);
    } finally {
      setProofsLoading(false);
    }
  };

  useEffect(() => {
    fetchLifecycleData();
  }, [statusFilter]);

  useEffect(() => {
    if (subView === 'proofs') {
      fetchProofs();
    }
  }, [subView]);

  // Launch Chaser WhatsApp
  const handleLaunchChaser = async () => {
    if (!selectedClinicForChaser) return;
    setChaserLoading(true);
    setChaserResult(null);
    try {
      const res = await superAdminApi.sendRenewalChaser(selectedClinicForChaser.id, {
        template: chaserTemplate,
        custom_message: chaserTemplate === 'custom' ? customChaserText : undefined,
      });
      if (res.success) {
        setChaserResult(res);
        showFeedback('success', res.message || 'تم تجهيز رسالة التذكير بنجاح.');
        fetchLifecycleData();
      }
    } catch (err) {
      showFeedback('error', err.message || 'فشل تجهيز رسالة التذكير.');
    } finally {
      setChaserLoading(false);
    }
  };

  // Grant Grace Period
  const handleGrantGrace = async () => {
    if (!selectedClinicForGrace) return;
    setGraceLoading(true);
    try {
      const res = await superAdminApi.grantGracePeriod(selectedClinicForGrace.id, {
        days: graceDays,
      });
      if (res.success) {
        showFeedback('success', res.message || 'تم منح فترة السماح الطبية بنجاح.');
        setSelectedClinicForGrace(null);
        fetchLifecycleData();
      }
    } catch (err) {
      showFeedback('error', err.message || 'فشل منح فترة السماح.');
    } finally {
      setGraceLoading(false);
    }
  };

  // Manual Renew
  const handleManualRenew = async () => {
    if (!selectedClinicForRenew) return;
    setRenewLoading(true);
    try {
      const res = await superAdminApi.manualRenewClinic(selectedClinicForRenew.id, {
        plan_id: selectedRenewPlanId,
        duration_months: parseInt(renewMonths, 10),
        amount_dzd: parseFloat(renewAmount) || 0,
        payment_method: renewMethod,
        reference: renewRef,
      });
      if (res.success) {
        showFeedback('success', res.message || 'تم تجديد الاشتراك بنجاح.');
        setSelectedClinicForRenew(null);
        fetchLifecycleData();
      }
    } catch (err) {
      showFeedback('error', err.message || 'فشل تجديد الاشتراك.');
    } finally {
      setRenewLoading(false);
    }
  };

  // Approve Proof
  const handleApproveProof = async (id) => {
    if (!window.confirm('هل أنت متأكد من مطابقة هذا الوصل وتفعيل اشتراك العيادة فورياً؟')) return;
    try {
      const res = await superAdminApi.approvePaymentProof(id);
      if (res.success) {
        showFeedback('success', res.message || 'تم اعتماد الوصل وتفعيل الاشتراك.');
        fetchProofs();
        fetchLifecycleData();
        setActiveProofLightbox(null);
      }
    } catch (err) {
      showFeedback('error', err.message || 'فشل اعتماد وصل الدفع.');
    }
  };

  // Reject Proof
  const handleRejectProof = async (id) => {
    const reason = window.prompt('يرجى كتابة سبب رفض وصل الدفع (سيتم توثيقه):');
    if (reason === null || !reason.trim()) return;
    try {
      const res = await superAdminApi.rejectPaymentProof(id, { reason });
      if (res.success) {
        showFeedback('success', 'تم رفض الوصل وتوثيق السبب.');
        fetchProofs();
        setActiveProofLightbox(null);
      }
    } catch (err) {
      showFeedback('error', err.message || 'فشل رفض الوصل.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('تم نسخ النص بنجاح!');
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 1. Header & Navigation */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black shadow-inner">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>محرك إدارة دورة حياة الاشتراكات والتجديد الذكي</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                BaridiMob Auto-Chaser 🚀
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              تتبع استحقاقات العيادات، ملاحقة التجديد عبر WhatsApp، إدارة فترات السماح الطبية، ومطابقة وصولات بريدي موب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setSubView('lifecycle')}
              className={`px-3 py-1.5 rounded-xl transition ${subView === 'lifecycle' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              🔄 دورة الحياة والملاحقة ({data.clinics.length})
            </button>
            <button
              onClick={() => setSubView('proofs')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${subView === 'proofs' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <span>💳 وصولات بريدي موب</span>
              {data.counts.pending_proofs > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white animate-pulse">
                  {data.counts.pending_proofs}
                </span>
              )}
            </button>
            <button
              onClick={() => setSubView('settings')}
              className={`px-3 py-1.5 rounded-xl transition ${subView === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              ⚙️ إعدادات الحسابات
            </button>
          </div>

          <button
            type="button"
            onClick={fetchLifecycleData}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 space-x-reverse transition-all ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 2. Hero Security & Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <button
          onClick={() => setStatusFilter('active')}
          className={`p-4 rounded-3xl border transition text-right ${statusFilter === 'active' ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-bold">نشطة ومستقرة</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white">{data.counts.active}</div>
          <div className="text-[10px] text-slate-400">اشتراك ساري (&gt; 7 أيام)</div>
        </button>

        <button
          onClick={() => setStatusFilter('expiring_soon')}
          className={`p-4 rounded-3xl border transition text-right ${statusFilter === 'expiring_soon' ? 'bg-amber-950/40 border-amber-500/50 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[11px] font-bold">تنتهي قريباً</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-300">{data.counts.expiring_soon}</div>
          <div className="text-[10px] text-slate-400">تنتهي خلال 7 أيام (تتطلب تذكير)</div>
        </button>

        <button
          onClick={() => setStatusFilter('in_grace_period')}
          className={`p-4 rounded-3xl border transition text-right ${statusFilter === 'in_grace_period' ? 'bg-orange-950/40 border-orange-500/50 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="flex items-center justify-between text-orange-400 mb-1">
            <span className="text-[11px] font-bold">في فترة السماح</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-orange-300">{data.counts.in_grace_period}</div>
          <div className="text-[10px] text-slate-400">حماية الجلسات السريرية</div>
        </button>

        <button
          onClick={() => setStatusFilter('suspended')}
          className={`p-4 rounded-3xl border transition text-right ${statusFilter === 'suspended' ? 'bg-rose-950/40 border-rose-500/50 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[11px] font-bold">معلقة / منتهية</span>
            <X className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-400">{data.counts.suspended}</div>
          <div className="text-[10px] text-slate-400">الحساب مجمد بانتظار السداد</div>
        </button>

        <button
          onClick={() => setSubView('proofs')}
          className="p-4 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 hover:border-amber-500/60 transition text-right"
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[11px] font-bold">وصولات بانتظار الفحص</span>
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-white flex items-center gap-1.5">
            <span>{data.counts.pending_proofs}</span>
            <span className="text-xs font-normal text-amber-400">وصل</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">
            {Number(data.counts.pending_proofs_amount || 0).toLocaleString()} د.ج بانتظار التحصيل
          </div>
        </button>
      </div>

      {/* SUB-VIEW 1: LIFECYCLE & CHASER TABLE */}
      {subView === 'lifecycle' && (
        <div className="space-y-4">
          {/* Filters and search */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLifecycleData()}
                placeholder="بحث باسم العيادة، الطبيب، رقم الهاتف، أو النطاق..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">الحالة:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">كافة الحالات ({data.counts.total})</option>
                <option value="expiring_soon">تنتهي قريباً (≤ 7 أيام)</option>
                <option value="in_grace_period">في فترة السماح الطبي</option>
                <option value="suspended">معلقة / منتهية الصلاحية</option>
                <option value="active">نشطة ومستقرة</option>
                <option value="trial">الفترة التجريبية</option>
              </select>
            </div>
          </div>

          {/* Clinics Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-4">العيادة والطبيب المسؤول</th>
                    <th className="p-4">الباقة السنوية</th>
                    <th className="p-4">تاريخ الانتهاء</th>
                    <th className="p-4">العد التنازلي</th>
                    <th className="p-4">الحالة والامتيازات</th>
                    <th className="p-4">سجل التذكير</th>
                    <th className="p-4 text-center">إجراءات الملاحقة والتجديد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                        جاري تحليل وفحص دورة حياة الاشتراكات...
                      </td>
                    </tr>
                  ) : data.clinics.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        لا توجد عيادات مطابقة لمعايير الفلترة المحددة.
                      </td>
                    </tr>
                  ) : (
                    data.clinics.map((clinic) => (
                      <tr key={clinic.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>{clinic.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-500" /> {clinic.doctor_name}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-slate-500" /> {clinic.phone}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-slate-200">{clinic.plan_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {clinic.billing_cycle === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'}
                          </div>
                        </td>

                        <td className="p-4 font-mono text-slate-300">
                          {clinic.subscription_ends_at || clinic.trial_ends_at || 'غير محدد'}
                        </td>

                        <td className="p-4">
                          {clinic.bypass_expiration || clinic.days_remaining === null || clinic.days_remaining === undefined ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {clinic.bypass_expiration ? 'غير مقيد بوقت 💎' : 'بلا حد زمني 🟢'}
                            </span>
                          ) : clinic.days_remaining > 7 ? (
                            <span className="text-emerald-400 font-bold font-mono">
                              متبقي {clinic.days_remaining} يوم 🟢
                            </span>
                          ) : clinic.days_remaining > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse font-mono">
                              متبقي {clinic.days_remaining} أيام 🟡
                            </span>
                          ) : clinic.days_remaining === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse font-mono">
                              ينتهي اليوم! ⚠️
                            </span>
                          ) : clinic.in_grace_period ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/40 font-mono">
                              فترة سماح طبي 🟠
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold font-mono">
                              منتهي منذ {Math.abs(clinic.days_remaining)} {Math.abs(clinic.days_remaining) > 10 ? 'يوماً' : 'أيام'} 🔴
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            clinic.lifecycle_status === 'active' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                            clinic.lifecycle_status === 'expiring_soon' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                            clinic.lifecycle_status === 'in_grace_period' ? 'bg-orange-500/10 text-orange-300 border-orange-500/30' :
                            clinic.lifecycle_status === 'trial' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' :
                            'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}>
                            {clinic.status_label_ar}
                          </span>
                          {clinic.has_pending_proof && (
                            <div className="text-[10px] text-amber-400 font-bold mt-1 animate-pulse">
                              📩 يوجد وصل دفع مرفوع
                            </div>
                          )}
                        </td>

                        <td className="p-4 text-[11px]">
                          {clinic.last_chased_at ? (
                            <div>
                              <div className="font-bold text-slate-300">آخر تذكير: {clinic.last_chased_at}</div>
                              <div className="text-slate-500 text-[10px]">عدد التذكيرات: {clinic.chase_count} مرات</div>
                            </div>
                          ) : (
                            <span className="text-slate-500">لم يُرسل تذكير بعد</span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* WhatsApp Chaser */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClinicForChaser(clinic);
                                setChaserResult(null);
                                setChaserTemplate(clinic.days_remaining <= 1 ? 'urgent_24h' : (clinic.in_grace_period ? 'grace_period' : 'early_7d'));
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-[11px] transition flex items-center gap-1"
                              title="إرسال تذكير التجديد عبر WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>ملاحقة واتساب</span>
                            </button>

                            {/* Grace Period */}
                            <button
                              type="button"
                              onClick={() => setSelectedClinicForGrace(clinic)}
                              className="p-1.5 rounded-xl bg-orange-600/20 hover:bg-orange-600 text-orange-300 hover:text-white border border-orange-500/30 transition"
                              title="منح فترة سماح طبية"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>

                            {/* Manual Renew */}
                            <button
                              type="button"
                              onClick={() => handleOpenRenewModal(clinic)}
                              className="p-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition"
                              title="تجديد يدوي مباشر"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: BARIDIMOB PROOFS INBOX */}
      {subView === 'proofs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <h3 className="font-bold text-white text-sm">صندوق مطابقة وصولات بريدي موب والـ CCP</h3>
            </div>
            <button
              onClick={fetchProofs}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${proofsLoading ? 'animate-spin' : ''}`} />
              <span>تحديث الصندوق</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-4">العيادة</th>
                  <th className="p-4">الباقة والدورة</th>
                  <th className="p-4">المبلغ المحول</th>
                  <th className="p-4">طريقة الدفع</th>
                  <th className="p-4">رقم العملية / المرجع</th>
                  <th className="p-4">وصل التحويل</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">إجراءات المطابقة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {proofsLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      جاري تحميل وصولات الدفع...
                    </td>
                  </tr>
                ) : proofs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      لا توجد إشعارات دفع معلقة بانتظار المطابقة حالياً 🌿
                    </td>
                  </tr>
                ) : (
                  proofs.map((proof) => (
                    <tr key={proof.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-white">
                        <div>{proof.clinic ? proof.clinic.name : 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{proof.clinic ? proof.clinic.subdomain : ''}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold">{proof.plan ? proof.plan.name_ar : 'باقة مخصصة'}</div>
                        <div className="text-[10px] text-slate-400">{proof.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}</div>
                      </td>

                      <td className="p-4 font-mono font-bold text-emerald-400">
                        {Number(proof.amount_dzd || 0).toLocaleString()} د.ج
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {proof.payment_method_label_ar || proof.payment_method}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-300">
                        {proof.transaction_reference || 'بدون مرجع'}
                      </td>

                      <td className="p-4">
                        {proof.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveProofLightbox(proof);
                              setLightboxZoom(1);
                              setLightboxRotation(0);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/30 font-bold transition flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة وتكبير</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[10px]">لا يوجد صورة</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          proof.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                          proof.status === 'rejected' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                          'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                        }`}>
                          {proof.status_label_ar || proof.status}
                        </span>
                      </td>

                      <td className="p-4">
                        {proof.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleApproveProof(proof.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shadow-md"
                              title="اعتماد الوصل وتمديد الاشتراك فورياً"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>اعتماد وتفعيل</span>
                            </button>
                            <button
                              onClick={() => handleRejectProof(proof.id)}
                              className="p-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition"
                              title="رفض الوصل مع إشعار بالسبب"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] text-center block">
                            تمت المراجعة في {proof.reviewed_at ? new Date(proof.reviewed_at).toLocaleDateString('ar-DZ') : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: SETTINGS */}
      {subView === 'settings' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">بيانات الدفع الرسمية للمنصة (BaridiMob & CCP Coordinates)</h3>
              <p className="text-xs text-slate-400">تُحقن هذه البيانات تلقائياً في قوالب رسائل تذكير الواتساب الموجهة للأطباء</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold">رقم الحساب البريدي الجاري (RIP BaridiMob):</label>
              <input
                type="text"
                readOnly
                value={data.coordinates.rip}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 font-mono text-amber-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold">رقم الحساب والمفتاح (CCP & Clé):</label>
              <input
                type="text"
                readOnly
                value={`${data.coordinates.ccp} Clé ${data.coordinates.cle}`}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 font-mono text-slate-200"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-400 font-bold">اسم صاحب الحساب المستفيد (Titulaire du Compte):</label>
              <input
                type="text"
                readOnly
                value={data.coordinates.titulaire}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-slate-200 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold">رقم هاتف الدعم المالي والتحصيل:</label>
              <input
                type="text"
                readOnly
                value={data.coordinates.phone}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 font-mono text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold">فترة السماح الطبية الافتراضية:</label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-emerald-400 font-bold">
                5 أيام بعد انتهاء الاشتراك
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHASER WHATSAPP LAUNCHER */}
      {selectedClinicForChaser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-6 text-right animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">
                  إطلاق تذكير تجديد الاشتراك عبر WhatsApp
                </h3>
              </div>
              <button
                onClick={() => setSelectedClinicForChaser(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Clinic Details */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white text-sm">{selectedClinicForChaser.name}</div>
                <div className="text-slate-400">د. {selectedClinicForChaser.doctor_name} • هاتف: {selectedClinicForChaser.phone}</div>
              </div>
              <div className="text-left font-mono">
                <div className="text-amber-400 font-bold">{selectedClinicForChaser.plan_name}</div>
                <div className="text-slate-500">انتهاء: {selectedClinicForChaser.subscription_ends_at || 'قريباً'}</div>
              </div>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">اختر قالب التذكير الذكي:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setChaserTemplate('early_7d')}
                  className={`p-2.5 rounded-2xl border text-center font-bold transition ${chaserTemplate === 'early_7d' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'}`}
                >
                  قبل 7 أيام 🌿
                </button>
                <button
                  type="button"
                  onClick={() => setChaserTemplate('urgent_24h')}
                  className={`p-2.5 rounded-2xl border text-center font-bold transition ${chaserTemplate === 'urgent_24h' ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'}`}
                >
                  عاجل (24 ساعة) 🚨
                </button>
                <button
                  type="button"
                  onClick={() => setChaserTemplate('grace_period')}
                  className={`p-2.5 rounded-2xl border text-center font-bold transition ${chaserTemplate === 'grace_period' ? 'bg-orange-600 text-white border-orange-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'}`}
                >
                  فترة السماح ⚠️
                </button>
                <button
                  type="button"
                  onClick={() => setChaserTemplate('suspension')}
                  className={`p-2.5 rounded-2xl border text-center font-bold transition ${chaserTemplate === 'suspension' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'}`}
                >
                  إشعار التعليق ⛔
                </button>
              </div>
            </div>

            {/* Chaser Result / WhatsApp Launch Button */}
            {chaserResult ? (
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                  <span>تم تجهيز نص التذكير ورابط الواتساب بنجاح:</span>
                  <button
                    onClick={() => copyToClipboard(chaserResult.message_text)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ النص</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl text-slate-200 text-xs whitespace-pre-wrap font-sans max-h-36 overflow-y-auto">
                  {chaserResult.message_text}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  {chaserResult.whatsapp_url ? (
                    <a
                      href={chaserResult.whatsapp_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                    >
                      <Send className="w-4 h-4" />
                      <span>فتح وإرسال عبر WhatsApp مباشرة 💬</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <div className="text-xs text-rose-400">
                      رقم الهاتف غير مسجل بصيغة صالحة. يمكنك نسخ النص وإرساله يدوياً.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLaunchChaser}
                  disabled={chaserLoading}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {chaserLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>توليد وتجهيز رسالة التذكير الرسمية</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: GRANT GRACE PERIOD */}
      {selectedClinicForGrace && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 text-right animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-orange-400 font-bold">
                <ShieldAlert className="w-5 h-5" />
                <span>منح فترة سماح طبية (Medical Grace Period)</span>
              </div>
              <button
                onClick={() => setSelectedClinicForGrace(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              تتيح فترة السماح للمعالج مواصلة توثيق جلسات المرضى ورعايتهم الطبية دون حجب النظام ريثما يتم تحويل وتأكيد رسوم الاشتراك.
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">عدد أيام فترة السماح:</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[3, 5, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setGraceDays(d)}
                    className={`py-2 rounded-xl font-bold border transition ${graceDays === d ? 'bg-orange-600 text-white border-orange-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                  >
                    {d} أيام
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGrantGrace}
              disabled={graceLoading}
              className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {graceLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>تأكيد ومنح فترة السماح الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL QUICK RENEW / UPGRADE */}
      {selectedClinicForRenew && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-right animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Zap className="w-5 h-5" />
                <span>تجديد / ترقية اشتراك العيادة فورياً</span>
              </div>
              <button
                onClick={() => setSelectedClinicForRenew(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clinic Mini Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">العيادة المستهدفة:</span>
                <span className="font-bold text-white text-sm">{selectedClinicForRenew.name}</span>
              </div>
              <div className="text-left font-mono">
                <span className="text-slate-400 block text-[10px]">الباقة الحالية:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {selectedClinicForRenew.subscription?.plan?.name_ar || selectedClinicForRenew.plan_name || 'Pro'}
                </span>
              </div>
            </div>

            {/* Live Price Highlight Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-emerald-950/80 border border-indigo-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">الباقة المحددة للتجديد / الترقية:</span>
                  <span className="font-bold text-white text-xs">
                    {resolvePlan(selectedRenewPlanId, plans).name_ar}
                  </span>
                  <span className="text-[10px] text-indigo-300 block font-mono">
                    المدة: {renewMonths === 12 ? 'سنة كاملة (12 شهر)' : renewMonths === 24 ? 'سنتين (24 شهر)' : `${renewMonths} أشهر`} • وسيلة الدفع: {renewMethod === 'baridimob' ? 'بريدي موب BaridiMob' : renewMethod === 'ccp' ? 'حوالة بريدية CCP' : renewMethod === 'bank_transfer' ? 'تحويل بنكي' : renewMethod === 'cash' ? 'نقداً' : 'منحة مجانية'}
                  </span>
                </div>
              </div>
              <div className="text-left font-mono">
                <span className="text-slate-400 block text-[10px] font-bold">المبلغ المستحق للدفع:</span>
                <span className="text-xl font-black text-emerald-400">
                  {Number(renewAmount || 0).toLocaleString()} <span className="text-xs text-emerald-300 font-sans">د.ج</span>
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Plan Selection */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">نوع الاشتراك / الباقة المستهدفة:</label>
                <select
                  value={selectedRenewPlanId}
                  onChange={(e) => handleRenewPlanChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2.5 text-white font-bold text-xs focus:border-indigo-500 focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_ar || p.name_fr || p.name} — ({Number(p.price_yearly || 0).toLocaleString()} د.ج / سنة — {Number(p.price_monthly || 0).toLocaleString()} د.ج / شهر)
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">مدة التجديد / الترقية:</label>
                <select
                  value={renewMonths}
                  onChange={(e) => handleRenewMonthsChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value={1}>شهر واحد (+1 Month)</option>
                  <option value={3}>3 أشهر (+3 Months)</option>
                  <option value={6}>6 أشهر (+6 Months)</option>
                  <option value={12}>سنة كاملة (+1 Year - 12 شهر)</option>
                  <option value={24}>سنتين (+2 Years - 24 شهر)</option>
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">المبلغ المحصل (د.ج):</label>
                  <span className="text-[10px] text-amber-400 font-mono">محسوب آلياً حسب الباقة والمدة وقابل للتعديل</span>
                </div>
                <input
                  type="number"
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2.5 font-mono text-emerald-400 font-bold text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">طريقة الدفع:</label>
                <select
                  value={renewMethod}
                  onChange={(e) => setRenewMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="baridimob">بريدي موب (BaridiMob)</option>
                  <option value="ccp">حوالة بريدية (CCP)</option>
                  <option value="bank_transfer">تحويل بنكي رسمي</option>
                  <option value="cash">دفع نقدي مباشر (Espèces)</option>
                  <option value="free_grant">منحة مجانية / شراكة</option>
                </select>
              </div>

              {/* Reference */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">رقم العملية أو الملاحظات:</label>
                <input
                  type="text"
                  value={renewRef}
                  onChange={(e) => setRenewRef(e.target.value)}
                  placeholder="مثال: حوالة بريدية رقم 45872 أو وصل بريدي موب..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2.5 text-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualRenew}
              disabled={renewLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50"
            >
              {renewLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>تأكيد التجديد / الترقية وتوليد الفاتورة فوراً</span>
            </button>
          </div>
        </div>
      )}

      {/* LIGHTBOX: PROOF IMAGE ZOOM & ROTATE */}
      {activeProofLightbox && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white text-sm">
                معاينة وصل سداد: {activeProofLightbox.clinic?.name} ({activeProofLightbox.amount_dzd} د.ج)
              </span>
              <span className="text-slate-400 font-mono">مرجع: {activeProofLightbox.transaction_reference || 'بدون'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLightboxZoom(prev => Math.min(prev + 0.25, 3))}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1"
                title="تكبير"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>{(lightboxZoom * 100).toFixed(0)}%</span>
              </button>

              <button
                onClick={() => setLightboxRotation(prev => (prev + 90) % 360)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                title="تدوير"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {activeProofLightbox.status === 'pending' && (
                <button
                  onClick={() => handleApproveProof(activeProofLightbox.id)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>اعتماد الوصل وتفعيل</span>
                </button>
              )}

              <button
                onClick={() => setActiveProofLightbox(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <img
              src={activeProofLightbox.receipt_url}
              alt="Receipt"
              style={{
                transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                transition: 'transform 0.2s ease-out',
                maxWidth: '90%',
                maxHeight: '80vh',
              }}
              className="rounded-xl shadow-2xl object-contain border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}
