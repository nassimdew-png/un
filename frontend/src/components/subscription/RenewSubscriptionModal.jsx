import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileText,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Clock,
  Coins,
  QrCode,
  Layers,
  RefreshCw,
  Zap,
  Tag
} from 'lucide-react';
import { subscriptionApi } from '../../api';

// Canonical Algerian Healthcare SaaS Plans
export const CANONICAL_PLANS = [
  {
    id: 1,
    name_ar: 'باقة الأخصائي الفردي (Cabinet Solo)',
    name_fr: 'Pack Praticien Solo',
    slug: 'solo_starter',
    price_yearly: 45000,
    price_monthly: 4500,
    price_dzd_yearly: 45000,
    price_dzd_monthly: 4500,
    max_patients: 250,
    max_staff: 3,
    badge: 'الأكثر ملاءمة للأفراد',
  },
  {
    id: 2,
    name_ar: 'باقة المركز المتكامل (Centre Multi-Pro)',
    name_fr: 'Pack Clinique Multi-Praticiens',
    slug: 'multi_pro',
    price_yearly: 95000,
    price_monthly: 9500,
    price_dzd_yearly: 95000,
    price_dzd_monthly: 9500,
    max_patients: 1500,
    max_staff: 15,
    badge: 'الأكثر طلباً ⭐',
    is_featured: true,
  },
  {
    id: 3,
    name_ar: 'باقة المؤسسات والشبكات (Enterprise DZ)',
    name_fr: 'Pack Institution & Grands Centres',
    slug: 'enterprise_dz',
    price_yearly: 180000,
    price_monthly: 18000,
    price_dzd_yearly: 180000,
    price_dzd_monthly: 18000,
    max_patients: 10000,
    max_staff: 50,
    badge: 'للمراكز والمستشفيات',
  },
  {
    id: 4,
    name_ar: 'باقة الانطلاقة (Débutant / Starter)',
    name_fr: 'Pack Débutant',
    slug: 'starter',
    price_yearly: 25000,
    price_monthly: 2500,
    price_dzd_yearly: 25000,
    price_dzd_monthly: 2500,
    max_patients: 60,
    max_staff: 5,
    badge: 'اقتصادية للبداية',
  },
  {
    id: 5,
    name_ar: 'باقة العيادة المشتركة (Duo Partagé)',
    name_fr: 'Pack Duo Partagé',
    slug: 'duo',
    price_yearly: 72000,
    price_monthly: 7500,
    price_dzd_yearly: 72000,
    price_dzd_monthly: 7500,
    max_patients: 1000,
    max_staff: 5,
    badge: 'للعيادات الثنائية',
  },
];

export const getPlanPrice = (p, cycle) => {
  if (!p) return 0;
  const hasDisc = Boolean(p.is_discount_active && Number(p.discount_percentage) > 0);
  const discPct = Number(p.discount_percentage) || 0;
  if (cycle === 'yearly') {
    const orig = Number(p.price_yearly ?? p.price_dzd_yearly ?? 45000);
    return hasDisc ? Math.round(orig * (1 - discPct / 100)) : orig;
  }
  const orig = Number(p.price_monthly ?? p.price_dzd_monthly ?? 4500);
  return hasDisc ? Math.round(orig * (1 - discPct / 100)) : orig;
};

export default function RenewSubscriptionModal({
  isOpen,
  onClose,
  currentSubscription,
  plans = [],
  paymentDetails,
  onSuccess,
}) {
  const { t } = useTranslation();

  // Ensure plans list is always populated
  const displayPlans = plans && plans.length > 0 ? plans : CANONICAL_PLANS;

  const [selectedPlanId, setSelectedPlanId] = useState(
    currentSubscription?.plan_id || (displayPlans[1]?.id || displayPlans[0]?.id || 1)
  );
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [paymentMethod, setPaymentMethod] = useState('baridimob');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [copiedField, setCopiedField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Promo Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState(null);

  // Sync selectedPlanId when plans update or when modal opens
  useEffect(() => {
    if (displayPlans.length > 0) {
      const match = displayPlans.some((p) => String(p.id) === String(selectedPlanId));
      if (!match) {
        setSelectedPlanId(currentSubscription?.plan_id || displayPlans[0].id);
      }
    }
  }, [plans, currentSubscription]);

  if (!isOpen) return null;

  const selectedPlan =
    displayPlans.find((p) => String(p.id) === String(selectedPlanId)) || displayPlans[0];

  const baseAmount = getPlanPrice(selectedPlan, billingCycle);
  const discountDzd = appliedCoupon
    ? Number(appliedCoupon.discount_amount_dzd ?? appliedCoupon.discount_dzd ?? 0)
    : 0;
  const calculatedAmount = Math.max(0, baseAmount - discountDzd);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponFeedback(null);
    try {
      const res = await subscriptionApi.validateCoupon({
        code: couponCode.trim(),
        plan_id: selectedPlan?.id || selectedPlanId,
        billing_cycle: billingCycle,
        amount_dzd: baseAmount,
      });

      if (res.valid) {
        setAppliedCoupon(res);
        setCouponFeedback({
          type: 'success',
          text: res.message || `تم تفعيل كود الخصم (${res.code}) بنجاح! تم خصم ${Number(res.discount_amount_dzd).toLocaleString()} DZD`,
        });
      } else {
        setAppliedCoupon(null);
        setCouponFeedback({
          type: 'error',
          text: res.message || 'كود الخصم غير صالح أو منتهي الصلاحية.',
        });
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponFeedback({
        type: 'error',
        text: err.message || 'كود الخصم غير صالح أو منتهي الصلاحية.',
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponFeedback(null);
  };

  const handleCopy = (text, fieldName) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم الملف كبير جداً! الحد الأقصى المسموح به هو 10 ميغابايت.');
        return;
      }
      setReceiptFile(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receiptFile) {
      alert('يرجى إرفاق صورة أو ملف وصل السداد (BaridiMob / CCP).');
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('plan_id', selectedPlan?.id || selectedPlanId);
    formData.append('billing_cycle', billingCycle);
    formData.append('amount_dzd', calculatedAmount);
    formData.append('payment_method', paymentMethod);
    if (appliedCoupon) {
      formData.append('coupon_code', appliedCoupon.code || appliedCoupon.coupon?.code || couponCode);
    }
    if (transactionRef) {
      formData.append('transaction_reference', transactionRef);
    }
    formData.append('receipt_file', receiptFile);

    try {
      const res = await subscriptionApi.submitRenewal(formData);
      setFeedback({
        type: 'success',
        text: res.message || 'تم إرسال وصل السداد بنجاح! سيتم التحقق منه وتفعيل الاشتراك وتحديث الحساب فوراً.',
      });
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2500);
    } catch (err) {
      console.error('Renewal submission failed:', err);
      setFeedback({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء إرسال الوصل. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const rip = paymentDetails?.baridimob_rip || '00799999002233445566';
  const ccp = paymentDetails?.ccp_number || '0022334455';
  const ccpKey = paymentDetails?.ccp_key || '66';
  const holder = paymentDetails?.account_holder || 'SARL PsyPro SaaS Tech DZ';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative text-right my-8 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">تجديد / ترقية اشتراك العيادة</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                سداد الاشتراك عبر تطبيق بريدي موب أو الحوالة البريدية CCP وتأكيد التفعيل الفوري.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Plan Indicator Banner */}
        {currentSubscription && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span className="text-slate-400">الاشتراك الحالي للعيادة:</span>
              <strong className="text-white font-bold">{currentSubscription.plan_name_ar || currentSubscription.plan || 'باقة العيادة'}</strong>
            </div>
            {currentSubscription.expires_at && (
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>ينتهي في: <strong className="text-amber-300">{currentSubscription.expires_at}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/70 border border-red-500/40 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Plan & Cycle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                1. اختيار الباقة ودورة الفوترة:
              </label>

              {/* Cycle Switcher */}
              <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    billingCycle === 'yearly'
                      ? 'bg-teal-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📅 اشتراك سنوي (سنة كاملة)</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black">
                    توفير 20%
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    billingCycle === 'monthly'
                      ? 'bg-teal-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🗓️ اشتراك شهري (30 يوم)
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayPlans.map((p) => {
                const isSelected = String(p.id) === String(selectedPlan?.id);
                const price = getPlanPrice(p, billingCycle);
                const hasDisc = Boolean(p.is_discount_active && Number(p.discount_percentage) > 0);
                const discPct = Number(p.discount_percentage) || 0;
                const origPrice = billingCycle === 'yearly'
                  ? Number(p.price_yearly ?? p.price_dzd_yearly ?? 45000)
                  : Number(p.price_monthly ?? p.price_dzd_monthly ?? 4500);

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`cursor-pointer rounded-2xl p-4 border transition relative text-right flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-950/50 border-teal-500 ring-2 ring-teal-500/40 shadow-lg shadow-teal-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              isSelected ? 'bg-teal-400 shadow shadow-teal-400' : 'bg-slate-700'
                            }`}
                          />
                          <span>{p.name_ar}</span>
                        </div>
                        {hasDisc ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                            {p.discount_badge || `تخفيض -${discPct}% 🔥`}
                          </span>
                        ) : (p.badge || p.is_featured) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                            {p.badge || 'الأكثر طلباً ⭐'}
                          </span>
                        )}
                      </div>

                      {hasDisc && (
                        <div className="flex items-center gap-1.5 mt-1 font-mono">
                          <span className="line-through text-slate-500 text-[11px]">
                            {Number(origPrice).toLocaleString()} DZD
                          </span>
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] px-1 rounded font-bold">
                            -{discPct}%
                          </span>
                        </div>
                      )}

                      <div className="flex items-baseline gap-1.5 mt-1 font-mono">
                        <span className="text-xl font-black text-teal-400">
                          {Number(price).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-300 font-semibold">DZD</span>
                        <span className="text-[11px] text-slate-400 mr-1">
                          {billingCycle === 'yearly' ? '/ سنة' : '/ شهر'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-2.5 flex flex-wrap items-center gap-1.5">
                        {p.max_patients && (
                          <span className="bg-slate-800/80 px-2 py-0.5 rounded-md text-[10px] text-slate-300 border border-slate-700/50">
                            👥 {Number(p.max_patients).toLocaleString()} مريض
                          </span>
                        )}
                        {p.max_staff && (
                          <span className="bg-slate-800/80 px-2 py-0.5 rounded-md text-[10px] text-slate-300 border border-slate-700/50">
                            🩺 {p.max_staff} معالج
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className={isSelected ? 'text-teal-300 font-bold' : 'text-slate-500'}>
                        {isSelected ? '✓ الباقة المحددة' : 'انقر للاختيار'}
                      </span>
                      {billingCycle === 'yearly' && (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          توفير سنوي 20%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promo Code Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-teal-400" />
                  🎟️ هل لديك كود خصم ترويجي (Code Promo)؟
                </span>
                {appliedCoupon && (
                  <span className="text-emerald-400 font-bold text-[10px]">
                    ✓ تم تطبيق خصم {Number(discountDzd).toLocaleString()} DZD
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="أدخل الرمز، مثل: ORTO2026 أو WELCOME_DZ"
                  disabled={!!appliedCoupon}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-teal-500 disabled:opacity-60"
                />

                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition"
                  >
                    إلغاء الكود
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                  >
                    {validatingCoupon ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>تطبيق الخصم</span>
                  </button>
                )}
              </div>

              {couponFeedback && (
                <div
                  className={`text-[11px] p-2 rounded-xl flex items-center gap-1.5 ${
                    couponFeedback.type === 'success'
                      ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-950/50 text-red-300 border border-red-500/30'
                  }`}
                >
                  {couponFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  )}
                  <span>{couponFeedback.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Payment Coordinates Card */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-400" />
                2. معلومات الحساب البريدي / البنكي للتحويل:
              </span>
              <div className="text-left font-mono">
                {appliedCoupon && discountDzd > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 line-through">
                      {Number(baseAmount).toLocaleString()} DZD
                    </span>
                    <span className="text-base font-black text-emerald-400">
                      المبلغ المطلوب: {Number(calculatedAmount).toLocaleString()} DZD
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-mono font-black text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-500/30">
                    المبلغ المطلوب: {Number(calculatedAmount).toLocaleString()} DZD
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* BaridiMob RIP */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[10px] text-slate-400 block">📱 رقم RIP بريدي موب (BaridiMob):</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-xs tracking-wider">{rip}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(rip, 'rip')}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="نسخ الرقم"
                  >
                    {copiedField === 'rip' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* CCP Account */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[10px] text-slate-400 block">📮 الحساب البريدي الجاري (CCP):</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-xs">
                    {ccp} <span className="text-amber-400 font-normal">Clé {ccpKey}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${ccp} ${ccpKey}`, 'ccp')}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="نسخ الرقم"
                  >
                    {copiedField === 'ccp' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
              <span>اسم المستفيد: <strong className="text-slate-200">{holder}</strong></span>
              <span className="text-slate-500">الدفع آمن ومحمي &bull; الجزائر 🇩🇿</span>
            </div>
          </div>

          {/* Step 3: Transaction Details & File Upload */}
          <div className="space-y-3 text-xs">
            <label className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
              3. إدخال بيانات التحويل وإرفاق الوصل:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">طريقة السداد المستخدمة:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="baridimob">📱 تطبيق بريدي موب (BaridiMob)</option>
                  <option value="ccp">📮 حوالة بريدية عبر مكتب البريد (CCP)</option>
                  <option value="bank_transfer">🏦 تحويل بنكي (Virement BNA / Banque)</option>
                  <option value="cash">💵 دفع مباشر نقدي</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">رقم المعاملة / مرجع الإشعار (اختياري):</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="مثال: N° Transaction 0982348"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                >
                </input>
              </div>
            </div>

            {/* File Upload Dropzone */}
            <div className="space-y-1">
              <label className="text-slate-400 block">صورة أو ملف وصل السداد (JPG, PNG, PDF - حتى 10MB):</label>
              <label className="border-2 border-dashed border-slate-700 hover:border-teal-500 bg-slate-950/60 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition">
                <UploadCloud className="w-8 h-8 text-teal-400 mb-2" />
                <span className="text-slate-300 font-bold text-xs">
                  {receiptFile ? receiptFile.name : 'انقر لاختيار ملف الوصل أو اسحبه هنا'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  لقطة شاشة لتطبيق بريدي موب أو وصل الحوالة البريدية
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {filePreview && (
                <div className="mt-2 text-center">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-h-36 rounded-xl mx-auto border border-slate-700 object-contain shadow"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-teal-600/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>إرسال الوصل وطلب التفعيل</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
