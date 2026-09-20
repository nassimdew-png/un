import React, { useState, useEffect } from 'react';
import {
  Tag,
  Gift,
  Share2,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Sparkles,
  Search,
  Filter,
  Users,
  Award,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  ExternalLink,
  PhoneCall,
  Send,
  Sliders,
  ShieldCheck,
  Building2,
  Stethoscope
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function PromosAndReferralsHubTab() {
  const [activeSubTab, setActiveSubTab] = useState('coupons'); // 'coupons' | 'referrals'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Filters
  const [couponSearch, setCouponSearch] = useState('');
  const [couponTypeFilter, setCouponTypeFilter] = useState('all');
  const [partnerSearch, setPartnerSearch] = useState('');

  // Modals
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPartnerForPayout, setSelectedPartnerForPayout] = useState(null);
  const [showRedemptionsModal, setShowRedemptionsModal] = useState(false);
  const [selectedCouponRedemptions, setSelectedCouponRedemptions] = useState(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappShareData, setWhatsappShareData] = useState(null);

  // Copied indicator
  const [copiedKey, setCopiedKey] = useState(null);

  // Form states
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 15,
    max_uses: 50,
    starts_at: new Date().toISOString().split('T')[0],
    expires_at: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    description: '',
    campaign_name: '',
    applicable_plan_id: '',
    applicable_cycle: 'yearly',
    min_order_dzd: 0,
    is_active: true,
  });

  const [partnerForm, setPartnerForm] = useState({
    affiliate_name: '',
    referral_code: '',
    partner_type: 'partner_association',
    clinic_id: '',
    reward_type: 'commission_dzd',
    commission_rate: 15,
    reward_months_per_referral: 1,
    referee_discount_percent: 15,
    payout_phone: '',
    payout_ccp_rip: '',
    is_active: true,
  });

  const [payoutForm, setPayoutForm] = useState({
    payout_type: 'commission_payment',
    amount_paid_dzd: '',
    months_granted: 1,
    payment_method: 'baridimob',
    transaction_reference: '',
    notes: '',
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await superAdminApi.getPromosAndReferralsOverview();
      if (res && res.success) {
        setData(res);
      } else {
        setError(res?.message || 'تعذر تحميل بيانات الكوبونات والإحالات.');
      }
    } catch (err) {
      console.error('Failed to load promo & referral data:', err);
      setError(err?.response?.data?.message || err?.message || 'فشل الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateRandomCode = (prefix = 'DZ') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponForm((prev) => ({ ...prev, code: `${prefix}-${rand}` }));
  };

  const [couponCodeError, setCouponCodeError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.code.trim()) {
      setCouponCodeError('رمز الكوبون مطلوب. يرجى إدخال رمز أو استخدام زر التوليد التلقائي.');
      return;
    }
    setCouponCodeError(null);

    try {
      setActionLoading(true);
      const payload = {
        ...couponForm,
        code: couponForm.code.trim().toUpperCase(),
        applicable_plan_id: couponForm.applicable_plan_id || null,
        discount_value: parseFloat(couponForm.discount_value),
        max_uses: parseInt(couponForm.max_uses, 10),
        min_order_dzd: parseFloat(couponForm.min_order_dzd || 0),
      };

      if (editingCoupon) {
        await superAdminApi.updatePromoCoupon(editingCoupon.id, payload);
        setToastMessage(`تم تحديث الكوبون (${payload.code}) بنجاح! ✅`);
      } else {
        await superAdminApi.createPromoCoupon(payload);
        setToastMessage(`تم إنشاء الكوبون (${payload.code}) بنجاح! ✅`);
      }

      setShowCouponModal(false);
      setEditingCoupon(null);
      fetchData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'فشل حفظ الكوبون.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCoupon = async (id) => {
    try {
      await superAdminApi.togglePromoCoupon(id);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'فشل تغيير حالة الكوبون.');
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`هل أنت متأكد من حذف الكوبون (${coupon.code}) نهائياً؟`)) return;
    try {
      await superAdminApi.deletePromoCoupon(coupon.id);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'تعذر حذف الكوبون.');
    }
  };

  const handleSavePartner = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = {
        ...partnerForm,
        clinic_id: partnerForm.clinic_id || null,
        commission_rate: parseFloat(partnerForm.commission_rate),
        reward_months_per_referral: parseInt(partnerForm.reward_months_per_referral || 1, 10),
        referee_discount_percent: parseFloat(partnerForm.referee_discount_percent),
      };

      if (editingPartner) {
        await superAdminApi.updateReferralPartner(editingPartner.id, payload);
      } else {
        await superAdminApi.createReferralPartner(payload);
      }

      setShowPartnerModal(false);
      setEditingPartner(null);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'فشل حفظ شريك الإحالة.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePartner = async (id) => {
    try {
      await superAdminApi.toggleReferralPartner(id);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'فشل تغيير حالة الشريك.');
    }
  };

  const handleDeletePartner = async (partner) => {
    if (!window.confirm(`هل أنت متأكد من حذف شريك الإحالة (${partner.affiliate_name})؟`)) return;
    try {
      await superAdminApi.deleteReferralPartner(partner.id);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'تعذر حذف الشريك.');
    }
  };

  const handleSavePayout = async (e) => {
    e.preventDefault();
    if (!selectedPartnerForPayout) return;
    try {
      setActionLoading(true);
      await superAdminApi.recordPartnerPayout(selectedPartnerForPayout.id, payoutForm);
      setShowPayoutModal(false);
      setSelectedPartnerForPayout(null);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'فشل توثيق صرف المكافأة.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenWhatsAppShare = async (type, item) => {
    try {
      const res = await superAdminApi.getWhatsAppShareText(type, item.id);
      if (res && res.success) {
        setWhatsappShareData(res);
        setShowWhatsAppModal(true);
      }
    } catch (err) {
      alert('تعذر توليد رابط المراسلة.');
    }
  };

  // Filtered lists
  const filteredCoupons = (data?.coupons || []).filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
      (c.campaign_name && c.campaign_name.toLowerCase().includes(couponSearch.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(couponSearch.toLowerCase()));

    const matchesType =
      couponTypeFilter === 'all' ||
      c.discount_type === couponTypeFilter;

    return matchesSearch && matchesType;
  });

  const filteredPartners = (data?.partners || []).filter((p) => {
    return (
      p.affiliate_name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      p.referral_code.toLowerCase().includes(partnerSearch.toLowerCase())
    );
  });

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-slate-400 font-sans space-y-4" dir="rtl">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
        <p className="text-sm font-bold">جاري تحميل قمرة الكوبونات وبرنامج الإحالة المتقدم...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Success / Action Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-fade-in">
          <div className="flex items-center space-x-2 space-x-reverse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-4 space-x-reverse relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black shadow-inner">
            <Tag className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h2 className="text-xl font-black text-white">محرك الكوبونات وبرنامج إحالة الأطباء والشركاء</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                PROMO & REFERRAL ENGINE 🚀
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              إدارة حملات الخصم الترويجية للمؤتمرات والجمعيات، ونظام الإحالة الفيروسي لمكافأة الأطباء الداعين لزملائهم
            </p>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 relative z-10 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('coupons')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 space-x-reverse ${
              activeSubTab === 'coupons'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>🏷️ كوبونات الخصم ({data?.coupons?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('referrals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 space-x-reverse ${
              activeSubTab === 'referrals'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>🤝 برنامج الإحالة والسفراء ({data?.partners?.length || 0})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center space-x-2 space-x-reverse">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: PROMO DISCOUNT COUPONS */}
      {/* ========================================================================= */}
      {activeSubTab === 'coupons' && (
        <div className="space-y-6">
          {/* Top 4 Hero KPIs for Coupons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>الكوبونات الفعالة</span>
                <Tag className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline space-x-2 space-x-reverse">
                <span className="text-2xl font-black text-white font-mono">{kpis.active_coupons || 0}</span>
                <span className="text-xs text-slate-500 font-bold">من أصل {kpis.total_coupons || 0}</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-bold">🟢 جاهزة للتفعيل عند الدفع</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>مرات الاستخدام الفعلي</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline space-x-2 space-x-reverse">
                <span className="text-2xl font-black text-white font-mono">{kpis.total_redemptions || 0}</span>
                <span className="text-xs text-slate-500 font-bold">عملية استرداد</span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold">عبر البوابات والاشتراكات</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>إجمالي الخصومات الممنوحة</span>
                <Percent className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline space-x-2 space-x-reverse">
                <span className="text-2xl font-black text-amber-300 font-mono">
                  {(kpis.total_discount_given_dzd || 0).toLocaleString()}
                </span>
                <span className="text-xs text-amber-400/70 font-bold">د.ج</span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold">تخفيضات محفزة للاشتراك</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>الإيراد الناتج عن الكوبونات</span>
                <TrendingUp className="w-4 h-4 text-teal-400" />
              </div>
              <div className="flex items-baseline space-x-2 space-x-reverse">
                <span className="text-2xl font-black text-teal-300 font-mono">
                  {(kpis.total_revenue_generated_dzd || 0).toLocaleString()}
                </span>
                <span className="text-xs text-teal-400/70 font-bold">د.ج</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-bold">صافي مدفوع بالدينار الجزائري</p>
            </div>
          </div>

          {/* Controls toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="ابحث برمز الكوبون أو الحملة..."
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  className="pr-9 pl-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 w-64"
                />
              </div>

              {/* Type filter */}
              <select
                value={couponTypeFilter}
                onChange={(e) => setCouponTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-rose-500/50"
              >
                <option value="all">كافة أنواع الخصم</option>
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed_dzd">مبلغ مقطوع (د.ج)</option>
              </select>

              <button
                type="button"
                onClick={fetchData}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
                title="تحديث البيانات"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingCoupon(null);
                setCouponForm({
                  code: '',
                  discount_type: 'percentage',
                  discount_value: 20,
                  max_uses: 100,
                  starts_at: new Date().toISOString().split('T')[0],
                  expires_at: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
                  description: '',
                  campaign_name: '',
                  applicable_plan_id: '',
                  applicable_cycle: 'yearly',
                  min_order_dzd: 0,
                  is_active: true,
                });
                setShowCouponModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-95 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-rose-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>+ إنشاء كوبون ترويجي جديد</span>
            </button>
          </div>

          {/* Coupons Voucher Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCoupons.map((coupon) => {
              const percentUsed = coupon.max_uses > 0 ? Math.min(100, Math.round((coupon.used_count / coupon.max_uses) * 100)) : 0;
              const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();

              return (
                <div
                  key={coupon.id}
                  className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-rose-500/30 transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between group relative"
                >
                  {/* Top Bar Header */}
                  <div className="p-5 pb-3 border-b border-slate-800/80 bg-slate-950/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        {coupon.discount_type === 'percentage'
                          ? `خصم ${coupon.discount_value}%`
                          : `خصم ${Number(coupon.discount_value).toLocaleString()} د.ج`}
                      </span>

                      <div className="flex items-center space-x-1.5 space-x-reverse">
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            منتهي ⏳
                          </span>
                        ) : coupon.is_active ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            نشط 🟢
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            معطل 🔴
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Voucher Ticket Box */}
                    <div className="p-3 rounded-2xl bg-slate-950 border border-dashed border-slate-700 flex items-center justify-between group-hover:border-rose-500/40 transition">
                      <div className="space-y-0.5">
                        <span className="text-base font-black text-white font-mono tracking-wider">{coupon.code}</span>
                        {coupon.campaign_name && (
                          <p className="text-[10px] text-slate-400 font-bold line-clamp-1">{coupon.campaign_name}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(coupon.code, `coupon-${coupon.id}`)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1 space-x-reverse text-[10px]"
                        title="نسخ الرمز"
                      >
                        {copiedKey === `coupon-${coupon.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">تم!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 space-y-3.5 flex-1">
                    {coupon.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{coupon.description}</p>
                    )}

                    {/* Usage Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">مرات الاستخدام:</span>
                        <span className="font-mono text-white font-bold">
                          {coupon.used_count} / {coupon.max_uses} ({percentUsed}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta tags & Dates */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                      <div>
                        <span className="block text-slate-500">نطاق الفوترة:</span>
                        <span className="font-bold text-slate-200">
                          {coupon.applicable_cycle === 'yearly'
                            ? 'السنوي فقط 📅'
                            : coupon.applicable_cycle === 'monthly'
                            ? 'الشهري فقط 🗓️'
                            : 'كافة الباقات'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-500">تاريخ الانتهاء:</span>
                        <span className="font-mono text-slate-200">
                          {coupon.expires_at ? coupon.expires_at.split('T')[0] : 'غير محدد'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="p-3.5 px-5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      {/* WhatsApp Share */}
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppShare('coupon', coupon)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
                        title="مشاركة العرض عبر WhatsApp للأطباء"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Redemptions modal trigger */}
                      {coupon.used_count > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCouponRedemptions(coupon);
                            setShowRedemptionsModal(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[10px] font-bold"
                          title="عرض العيادات المستفيدة"
                        >
                          السجل ({coupon.used_count})
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(coupon.id)}
                        className={`text-[11px] font-bold transition ${
                          coupon.is_active ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                      >
                        {coupon.is_active ? 'تعطيل' : 'تفعيل'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingCoupon(coupon);
                          setCouponForm({
                            code: coupon.code,
                            discount_type: coupon.discount_type,
                            discount_value: coupon.discount_value,
                            max_uses: coupon.max_uses,
                            starts_at: coupon.starts_at ? coupon.starts_at.split('T')[0] : '',
                            expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
                            description: coupon.description || '',
                            campaign_name: coupon.campaign_name || '',
                            applicable_plan_id: coupon.applicable_plan_id || '',
                            applicable_cycle: coupon.applicable_cycle || 'yearly',
                            min_order_dzd: coupon.min_order_dzd || 0,
                            is_active: coupon.is_active,
                          });
                          setShowCouponModal(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white transition"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {coupon.used_count === 0 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(coupon)}
                          className="p-1 rounded text-rose-500 hover:text-rose-400 transition"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCoupons.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <Tag className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-300">لم يتم العثور على أي كوبونات خصم مطابقة للبحث.</p>
              <p className="text-xs text-slate-500">يمكنك إنشاء أول كوبون خصم للحملات الترويجية الآن.</p>
            </div>
          )}

          {/* Recent Redemptions Live Ledger */}
          {(data?.recent_redemptions || []).length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-black text-white">آخر عمليات استخدام واسترداد الكوبونات في العيادات</h3>
                </div>
                <span className="text-xs text-slate-400">آخر 15 عملية استرداد</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="py-2.5 px-3">العيادة الطبية</th>
                      <th className="py-2.5 px-3">رمز الكوبون</th>
                      <th className="py-2.5 px-3">المبلغ الأصلي</th>
                      <th className="py-2.5 px-3">قيمة الخصم</th>
                      <th className="py-2.5 px-3">الصافي المدفوع</th>
                      <th className="py-2.5 px-3">رقم الفاتورة</th>
                      <th className="py-2.5 px-3">تاريخ الاسترداد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.recent_redemptions.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-bold text-white flex items-center space-x-2 space-x-reverse">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span>{r.clinic_name}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-300">{r.coupon_code}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {r.original_amount_dzd.toLocaleString()} دج
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                          -{r.discount_applied_dzd.toLocaleString()} دج
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                          {r.final_amount_dzd.toLocaleString()} دج
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{r.invoice_number || '--'}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{r.redeemed_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: DOCTOR & PARTNER REFERRALS */}
      {/* ========================================================================= */}
      {activeSubTab === 'referrals' && (
        <div className="space-y-6">
          {/* Top 4 Hero KPIs for Referrals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>الشركاء والأطباء السفراء</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline space-x-2 space-x-reverse">
                <span className="text-2xl font-black text-white font-mono">{kpis.total_partners || 0}</span>
                <span className="text-xs text-slate-500 font-bold">شريك معتمد</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-bold">جمعيات، مؤثرين، وأطباء سفراء</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>العيادات المسجلة عبر الإحالة</span>
                <Building2 className="w-4 h-4 text-teal-400" />
              </div>
              <div className="flex items-baseline space-x-2 space-x-reverse">
                <span className="text-2xl font-black text-white font-mono">{kpis.total_referred_clinics || 0}</span>
                <span className="text-xs text-slate-500 font-bold">عيادة جديدة</span>
              </div>
              <p className="text-[11px] text-teal-400 font-bold">عبر روابط وأكواد التوصية</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>معدل التحويل لاشتراك مدفوع</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline space-x-2 space-x-reverse">
                <span className="text-2xl font-black text-indigo-300 font-mono">
                  {kpis.conversion_rate_percent || 0}%
                </span>
                <span className="text-xs text-slate-500 font-bold">({kpis.converted_paid_clinics || 0} عيادة)</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-bold">نمو عضوي عالي الثقة</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>العمولات والمكافآت الممنوحة</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline space-x-2 space-x-reverse">
                <span className="text-2xl font-black text-amber-300 font-mono">
                  {(kpis.total_commissions_earned_dzd || 0).toLocaleString()}
                </span>
                <span className="text-xs text-amber-400/70 font-bold">د.ج</span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold">مستحقات نقدية وأشهر تمديد</p>
            </div>
          </div>

          {/* Referral Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="ابحث باسم الشريك أو كود الإحالة..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                  className="pr-9 pl-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-72"
                />
              </div>

              <button
                type="button"
                onClick={fetchData}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingPartner(null);
                setPartnerForm({
                  affiliate_name: '',
                  referral_code: '',
                  partner_type: 'partner_association',
                  clinic_id: '',
                  reward_type: 'commission_dzd',
                  commission_rate: 15,
                  reward_months_per_referral: 1,
                  referee_discount_percent: 15,
                  payout_phone: '',
                  payout_ccp_rip: '',
                  is_active: true,
                });
                setShowPartnerModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة شريك أو سفير إحالة جديد</span>
            </button>
          </div>

          {/* Referral Partners Table */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">سجل الشركاء والجمعيات والأطباء السفراء</h3>
              </div>
              <span className="text-xs text-slate-400">{filteredPartners.length} شريك معتمد</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-3 px-3">اسم الشريك / السفير</th>
                    <th className="py-3 px-3">التصنيف</th>
                    <th className="py-3 px-3">كود ورابط الإحالة</th>
                    <th className="py-3 px-3">خصم العيادة المحالة</th>
                    <th className="py-3 px-3">مكافأة الشريك</th>
                    <th className="py-3 px-3">العيادات المحالة</th>
                    <th className="py-3 px-3">إجمالي المستحقات</th>
                    <th className="py-3 px-3">بيانات الدفع (CCP)</th>
                    <th className="py-3 px-3">الحالة والإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPartners.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white text-xs">{p.affiliate_name}</div>
                        {p.clinic_name && (
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1 space-x-reverse">
                            <Stethoscope className="w-3 h-3 text-emerald-400" />
                            <span>عيادة: {p.clinic_name}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {p.partner_type_label_ar}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="font-mono font-black text-emerald-400 text-xs">{p.referral_code}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.referral_url, `ref-${p.id}`)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="نسخ رابط الإحالة المباشر"
                          >
                            {copiedKey === `ref-${p.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[140px]">
                          {p.referral_url}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-teal-300">
                        {p.referee_discount_percent}% خصم
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {p.reward_type === 'free_subscription_months'
                            ? `+${p.reward_months_per_referral} شهر مجاني`
                            : `${p.commission_rate}% عمولة`}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-white">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {p.total_referred_clinics} عيادة
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                        {p.total_earned_dzd.toLocaleString()} دج
                      </td>

                      <td className="py-3.5 px-3 text-[11px] text-slate-400 space-y-0.5">
                        <div className="font-mono">{p.payout_phone}</div>
                        <div className="font-mono text-[10px] text-slate-500">{p.payout_ccp_rip}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {/* WhatsApp Invite Share */}
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsAppShare('referral', p)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
                            title="إرسال رابط الدعوة عبر WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Record Payout Modal */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPartnerForPayout(p);
                              setPayoutForm({
                                payout_type: p.partner_type === 'doctor_peer' ? 'grant_free_months' : 'commission_payment',
                                amount_paid_dzd: '',
                                months_granted: 1,
                                payment_method: 'baridimob',
                                transaction_reference: '',
                                notes: '',
                              });
                              setShowPayoutModal(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition text-[10px] font-bold"
                            title="توثيق صرف مكافأة أو تمديد اشتراك"
                          >
                            صرف المكافأة
                          </button>

                          {/* Toggle */}
                          <button
                            type="button"
                            onClick={() => handleTogglePartner(p.id)}
                            className={`text-[11px] font-bold transition ${
                              p.is_active ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                            }`}
                          >
                            {p.is_active ? 'تعطيل' : 'تفعيل'}
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPartner(p);
                              setPartnerForm({
                                affiliate_name: p.affiliate_name,
                                referral_code: p.referral_code,
                                partner_type: p.partner_type,
                                clinic_id: p.clinic_id || '',
                                reward_type: p.reward_type,
                                commission_rate: p.commission_rate,
                                reward_months_per_referral: p.reward_months_per_referral || 1,
                                referee_discount_percent: p.referee_discount_percent,
                                payout_phone: p.payout_phone !== '--' ? p.payout_phone : '',
                                payout_ccp_rip: p.payout_ccp_rip !== '--' ? p.payout_ccp_rip : '',
                                is_active: p.is_active,
                              });
                              setShowPartnerModal(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-white transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeletePartner(p)}
                            className="p-1 rounded text-rose-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Peer Clinic Ambassadors Grid (All Clinics Registered with Referral Codes) */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">شبكة سفراء المنصة من العيادات القائمة (Doctor-to-Doctor)</h3>
              </div>
              <span className="text-xs text-slate-400">
                {data?.ambassador_clinics?.length || 0} عيادة مفعلة بكود دعوة خاص
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(data?.ambassador_clinics || []).map((clinic) => (
                <div
                  key={clinic.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 hover:border-emerald-500/40 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs line-clamp-1">{clinic.name}</h4>
                      <p className="text-[10px] text-slate-400">{clinic.wilaya} • {clinic.type}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {clinic.referred_clinics_count} دعوة
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-300">{clinic.referral_code}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(clinic.referral_url, `clinic-ref-${clinic.id}`)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      title="نسخ الرابط"
                    >
                      {copiedKey === `clinic-ref-${clinic.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>أيام مجانية مكتسبة:</span>
                    <span className="font-mono text-emerald-400 font-bold">+{clinic.referral_free_days_earned} يوم</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT PROMO COUPON */}
      {/* ========================================================================= */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 text-right font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingCoupon ? `تعديل الكوبون (${editingCoupon.code})` : 'إنشاء كوبون خصم ترويجي جديد'}
                  </h3>
                  <p className="text-xs text-slate-400">تحديد شروط الخصم والمدة والباقات المشمولة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              {/* Code with Generator button */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-300">رمز الكوبون (Coupon Code) *</label>
                  <button
                    type="button"
                    onClick={() => handleGenerateRandomCode('DZ')}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 space-x-reverse"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>توليد كود مميز 🎲</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="مثال: ORTHO-DZ-2026 أو RAMADAN26"
                  value={couponForm.code}
                  onChange={(e) => {
                    setCouponCodeError(null);
                    setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() });
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border ${
                    couponCodeError ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                  } text-white font-mono font-black tracking-wider focus:outline-none focus:border-rose-500/50`}
                />
                {couponCodeError && (
                  <p className="text-[11px] text-rose-400 font-bold animate-fade-in flex items-center gap-1 mt-1">
                    <span>⚠️</span>
                    <span>{couponCodeError}</span>
                  </p>
                )}
              </div>

              {/* Campaign name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">اسم الحملة / المناسبة الترويجية</label>
                <input
                  type="text"
                  placeholder="مثال: مؤتمر الأرطوفونيا وهران 2026 أو عروض افتتاح المنصة"
                  value={couponForm.campaign_name}
                  onChange={(e) => setCouponForm({ ...couponForm, campaign_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500/50"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">نوع الخصم *</label>
                  <select
                    value={couponForm.discount_type}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500/50"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed_dzd">مبلغ ثابت بالدينار (د.ج)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">
                    قيمة الخصم {couponForm.discount_type === 'percentage' ? '(%)' : '(د.ج)'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={couponForm.discount_value}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              </div>

              {/* Max uses & Min order */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">الحد الأقصى لمرات الاستخدام *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={couponForm.max_uses}
                    onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-rose-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">الحد الأدنى لقيمة الاشتراك (د.ج)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = بدون حد أدنى"
                    value={couponForm.min_order_dzd}
                    onChange={(e) => setCouponForm({ ...couponForm, min_order_dzd: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              </div>

              {/* Billing Cycle & Applicable Plan */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">نطاق الفوترة المشمول</label>
                  <select
                    value={couponForm.applicable_cycle}
                    onChange={(e) => setCouponForm({ ...couponForm, applicable_cycle: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500/50"
                  >
                    <option value="all">كافة الفترات (سنوي وشهري)</option>
                    <option value="yearly">الاشتراك السنوي فقط</option>
                    <option value="monthly">الاشتراك الشهري فقط</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">تخصيص لباقة معينة</label>
                  <select
                    value={couponForm.applicable_plan_id}
                    onChange={(e) => setCouponForm({ ...couponForm, applicable_plan_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500/50"
                  >
                    <option value="">كافة باقات الاشتراك</option>
                    {(data?.plans || []).map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">تاريخ بدء السريان</label>
                  <input
                    type="date"
                    value={couponForm.starts_at}
                    onChange={(e) => setCouponForm({ ...couponForm, starts_at: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-rose-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">تاريخ نهاية الصلاحية</label>
                  <input
                    type="date"
                    value={couponForm.expires_at}
                    onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">الوصف أو الشروط</label>
                <textarea
                  rows="2"
                  placeholder="ملاحظات سريرية أو شروط خاصة بالكوبون..."
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500/50 resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse pt-2">
                <input
                  type="checkbox"
                  id="coupon_active"
                  checked={couponForm.is_active}
                  onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-rose-600 focus:ring-0"
                />
                <label htmlFor="coupon_active" className="text-slate-300 font-bold">
                  تفعيل الكوبون فوراً للاستخدام
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black hover:opacity-90 transition disabled:opacity-50"
                >
                  {actionLoading ? 'جاري الحفظ...' : editingCoupon ? 'حفظ التعديلات' : 'إنشاء الكوبون الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE / EDIT REFERRAL PARTNER */}
      {/* ========================================================================= */}
      {showPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 text-right font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingPartner ? `تعديل شريك الإحالة (${editingPartner.affiliate_name})` : 'تسجيل شريك أو سفير إحالة جديد'}
                  </h3>
                  <p className="text-xs text-slate-400">تحديد نسبة الخصم للعيادات المحالة ومكافآت السفير</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPartnerModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">اسم الشريك أو الجمعية أو الطبيب السفير *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الجمعية الوطنية للأرطوفونيين الجزائريين أو د. محمد وهران"
                  value={partnerForm.affiliate_name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, affiliate_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">كود الإحالة المخصص *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ANOP-DZ أو DR-AMINE"
                    value={partnerForm.referral_code}
                    onChange={(e) => setPartnerForm({ ...partnerForm, referral_code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold tracking-wider focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">تصنيف الشريك *</label>
                  <select
                    value={partnerForm.partner_type}
                    onChange={(e) => setPartnerForm({ ...partnerForm, partner_type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="partner_association">جمعية طبية / شريك مهني</option>
                    <option value="doctor_peer">طبيب سفير (Doctor-to-Doctor)</option>
                    <option value="influencer">مؤثر / مدرب إكلينيكي</option>
                  </select>
                </div>
              </div>

              {/* Linking to existing clinic if doctor peer */}
              {partnerForm.partner_type === 'doctor_peer' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">ربط بحساب عيادة الطبيب في المنصة</label>
                  <select
                    value={partnerForm.clinic_id}
                    onChange={(e) => setPartnerForm({ ...partnerForm, clinic_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">اختر عيادة الطبيب السفير...</option>
                    {(data?.ambassador_clinics || []).map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name} ({clinic.wilaya})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reward Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">نوع مكافأة الشريك</label>
                  <select
                    value={partnerForm.reward_type}
                    onChange={(e) => setPartnerForm({ ...partnerForm, reward_type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="commission_dzd">عمولة مالية (%) تدفع عبر CCP</option>
                    <option value="free_subscription_months">أشهر اشتراك مجانية تضاف لعيادته</option>
                    <option value="both">عمولة نقدية + أشهر مجانية</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">خصم العيادة الجديدة المحالة (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={partnerForm.referee_discount_percent}
                    onChange={(e) => setPartnerForm({ ...partnerForm, referee_discount_percent: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Commission rate & months per referral */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">نسبة العمولة المالية (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={partnerForm.commission_rate}
                    onChange={(e) => setPartnerForm({ ...partnerForm, commission_rate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">أشهر مجانية لكل عيادة تشترك</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={partnerForm.reward_months_per_referral}
                    onChange={(e) => setPartnerForm({ ...partnerForm, reward_months_per_referral: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">رقم الهاتف / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="0550112233"
                    value={partnerForm.payout_phone}
                    onChange={(e) => setPartnerForm({ ...partnerForm, payout_phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">حساب CCP أو RIP البريدي</label>
                  <input
                    type="text"
                    placeholder="0079999900..."
                    value={partnerForm.payout_ccp_rip}
                    onChange={(e) => setPartnerForm({ ...partnerForm, payout_ccp_rip: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse pt-2">
                <input
                  type="checkbox"
                  id="partner_active"
                  checked={partnerForm.is_active}
                  onChange={(e) => setPartnerForm({ ...partnerForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="partner_active" className="text-slate-300 font-bold">
                  تفعيل الشريك ورابط الإحالة فوراً
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPartnerModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black hover:opacity-90 transition disabled:opacity-50"
                >
                  {actionLoading ? 'جاري الحفظ...' : editingPartner ? 'حفظ التعديلات' : 'تسجيل الشريك الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD PAYOUT / REWARD EXTENSION */}
      {/* ========================================================================= */}
      {showPayoutModal && selectedPartnerForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-right font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  توثيق صرف مكافأة لشريك الإحالة
                </h3>
                <p className="text-xs text-amber-400 font-bold mt-0.5">{selectedPartnerForPayout.affiliate_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayout} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">نوع المكافأة المنفذة *</label>
                <select
                  value={payoutForm.payout_type}
                  onChange={(e) => setPayoutForm({ ...payoutForm, payout_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="commission_payment">تحويل عمولة نقدية (CCP / BaridiMob)</option>
                  <option value="grant_free_months">تمديد اشتراك عيادة الطبيب بأشهر مجانية</option>
                  <option value="both">تحويل نقدي + تمديد اشتراك</option>
                </select>
              </div>

              {['commission_payment', 'both'].includes(payoutForm.payout_type) && (
                <>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">المبلغ المحول (د.ج) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="مثال: 14000"
                      value={payoutForm.amount_paid_dzd}
                      onChange={(e) => setPayoutForm({ ...payoutForm, amount_paid_dzd: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">طريقة التحويل</label>
                      <select
                        value={payoutForm.payment_method}
                        onChange={(e) => setPayoutForm({ ...payoutForm, payment_method: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      >
                        <option value="baridimob">بريدي موب (BaridiMob)</option>
                        <option value="ccp">حوالة بريدية (CCP)</option>
                        <option value="bank_transfer">تحويل بنكي</option>
                        <option value="cash">نقداً</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-300">رقم مرجع الحوالة</label>
                      <input
                        type="text"
                        placeholder="REF_987654"
                        value={payoutForm.transaction_reference}
                        onChange={(e) => setPayoutForm({ ...payoutForm, transaction_reference: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {['grant_free_months', 'both'].includes(payoutForm.payout_type) && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">عدد الأشهر المجانية الممنوحة *</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={payoutForm.months_granted}
                    onChange={(e) => setPayoutForm({ ...payoutForm, months_granted: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold"
                  />
                  <p className="text-[10px] text-emerald-400">
                    سيتم تمديد تاريخ انتهاء اشتراك عيادة الطبيب تلقائياً وتوثيقها في سجل التدقيق الجنائي.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">ملاحظات إدارية</label>
                <input
                  type="text"
                  placeholder="ملاحظات حول سداد العمولة..."
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black transition disabled:opacity-50"
                >
                  {actionLoading ? 'جاري التوثيق...' : 'توثيق الصرف والمكافأة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: WHATSAPP SHARE PREVIEW */}
      {/* ========================================================================= */}
      {showWhatsAppModal && whatsappShareData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-right font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">نص رسالة الدعوة والمشاركة عبر WhatsApp</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line select-all">
              {whatsappShareData.text}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(whatsappShareData.text, 'wa-text')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-1.5 space-x-reverse"
              >
                {copiedKey === 'wa-text' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">تم نسخ النص!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ النص فقط</span>
                  </>
                )}
              </button>

              <a
                href={whatsappShareData.whatsapp_url}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-emerald-950/40"
              >
                <Send className="w-4 h-4" />
                <span>إرسال ومشاركة عبر WhatsApp الآن</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
