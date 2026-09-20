import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Key,
  Layers,
  RefreshCw,
  Coins,
  FileBadge,
  Ban,
  Activity,
  Users,
  SlidersHorizontal,
  Zap,
  Check,
  Lock,
  Unlock,
  CopyPlus,
  Download,
  KeyRound,
  Eye,
  EyeOff,
  CreditCard
} from 'lucide-react';
import { superAdminApi, sovereignTowerApi } from '../../api';

export default function ClinicManageModal({ clinic, plans = [], isOpen, onClose, onRefresh }) {
  const { t } = useTranslation();
  const [loadingAction, setLoadingAction] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Password Reset State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

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

  // Custom Plan Assignment Form State
  const [showCustomPlanForm, setShowCustomPlanForm] = useState(false);
  const [availablePlans, setAvailablePlans] = useState(CANONICAL_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState(1);
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [planAmount, setPlanAmount] = useState(45000);
  const [paymentMethod, setPaymentMethod] = useState('baridimob');
  const [startsAt, setStartsAt] = useState(new Date().toISOString().split('T')[0]);
  const [endsAt, setEndsAt] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('');

  // Synchronize available plans with backend if available
  React.useEffect(() => {
    if (plans && plans.length > 0) {
      const merged = CANONICAL_PLANS.map(cp => {
        const bp = plans.find(p => String(p.id) === String(cp.id) || p.slug === cp.slug || cp.aliases.includes(String(p.slug || '').toLowerCase()));
        return bp ? { ...cp, price_yearly: Number(bp.price_yearly) > 0 ? Number(bp.price_yearly) : cp.price_yearly, price_monthly: Number(bp.price_monthly) > 0 ? Number(bp.price_monthly) : cp.price_monthly, name_ar: bp.name_ar || cp.name_ar } : cp;
      });
      setAvailablePlans(merged);
    } else if (isOpen) {
      superAdminApi.getPlans().then(res => {
        if (res?.plans?.length) {
          const merged = CANONICAL_PLANS.map(cp => {
            const bp = res.plans.find(p => String(p.id) === String(cp.id) || p.slug === cp.slug || cp.aliases.includes(String(p.slug || '').toLowerCase()));
            return bp ? { ...cp, price_yearly: Number(bp.price_yearly) > 0 ? Number(bp.price_yearly) : cp.price_yearly, price_monthly: Number(bp.price_monthly) > 0 ? Number(bp.price_monthly) : cp.price_monthly, name_ar: bp.name_ar || cp.name_ar } : cp;
          });
          setAvailablePlans(merged);
        }
      }).catch(() => {});
    }
  }, [plans, isOpen]);

  // Synchronize clinic subscription details on open or clinic change
  React.useEffect(() => {
    if (clinic) {
      const plan = resolvePlan(clinic.subscription?.plan_id || clinic.plan_id || clinic.subscription?.subscription_plan_id, availablePlans);
      const cycle = clinic.subscription?.billing_cycle || clinic.billing_cycle || 'yearly';
      setSelectedPlanId(plan.id);
      setBillingCycle(cycle);
      const price = cycle === 'monthly' ? plan.price_monthly : (cycle === 'lifetime' ? plan.price_yearly * 3 : (cycle === 'trial' ? 0 : plan.price_yearly));
      setPlanAmount(price || 45000);
      setPaymentMethod('baridimob');
      setStartsAt(clinic.subscription?.starts_at ? new Date(clinic.subscription.starts_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setEndsAt(clinic.subscription?.ends_at ? new Date(clinic.subscription.ends_at).toISOString().split('T')[0] : '');
      setNotes('');
    }
  }, [clinic, isOpen, showCustomPlanForm]);

  const handleSelectPlan = (planId, cycle = billingCycle) => {
    const matched = resolvePlan(planId, availablePlans);
    setSelectedPlanId(matched.id);
    let amount = matched.price_yearly;
    if (cycle === 'monthly') amount = matched.price_monthly;
    else if (cycle === 'lifetime') amount = matched.price_yearly * 3;
    else if (cycle === 'trial') amount = 0;
    setPlanAmount(amount);
  };

  const handleCycleChange = (newCycle) => {
    setBillingCycle(newCycle);
    handleSelectPlan(selectedPlanId, newCycle);
  };

  // AI Quota State
  const [showAiQuotaForm, setShowAiQuotaForm] = useState(false);
  const [aiMonthlyQuota, setAiMonthlyQuota] = useState(clinic?.ai_monthly_token_quota || clinic?.monthly_ai_token_limit || 100000);
  const [savingAiQuota, setSavingAiQuota] = useState(false);

  // Custom Tenant Overrides State
  const [showOverridesForm, setShowOverridesForm] = useState(false);
  const [maxPatientsOverride, setMaxPatientsOverride] = useState(
    clinic?.custom_overrides?.max_patients_override || ''
  );
  const [maxCliniciansOverride, setMaxCliniciansOverride] = useState(
    clinic?.custom_overrides?.max_clinicians_override || ''
  );
  const [enabledFeaturesOverride, setEnabledFeaturesOverride] = useState(
    clinic?.custom_overrides?.enabled_features_override || []
  );
  const [overrideNotes, setOverrideNotes] = useState(
    clinic?.custom_overrides?.notes || ''
  );

  const toggleFeatureOverride = (featKey) => {
    setEnabledFeaturesOverride((prev) =>
      prev.includes(featKey) ? prev.filter((f) => f !== featKey) : [...prev, featKey]
    );
  };

  const handleSaveAiQuota = async (resetUsage = false) => {
    setSavingAiQuota(true);
    setFeedback(null);
    try {
      const res = await superAdminApi.updateClinicQuotas(clinic.id, {
        ai_monthly_token_quota: parseInt(aiMonthlyQuota, 10),
        monthly_ai_token_limit: parseInt(aiMonthlyQuota, 10),
        reset_ai_usage: resetUsage,
      });
      setFeedback({ type: 'success', text: res.message || 'تم تحديث سقف استهلاك الذكاء الاصطناعي بنجاح.' });
      setShowAiQuotaForm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحديث سقف الذكاء الاصطناعي.' });
    } finally {
      setSavingAiQuota(false);
    }
  };

  const handleSaveOverrides = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    setFeedback(null);
    try {
      const res = await superAdminApi.applyOverride(clinic.id, {
        max_patients_override: maxPatientsOverride ? parseInt(maxPatientsOverride, 10) : null,
        max_clinicians_override: maxCliniciansOverride ? parseInt(maxCliniciansOverride, 10) : null,
        enabled_features_override: enabledFeaturesOverride,
        notes: overrideNotes,
      });
      setFeedback({ type: 'success', text: res.message || 'تم حفظ الاستثناءات المخصصة للعيادة بنجاح.' });
      setShowOverridesForm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error saving overrides:', err);
      setFeedback({ type: 'error', text: err.message || 'حدث خطأ أثناء حفظ الاستثناءات.' });
    } finally {
      setLoadingAction(false);
    }
  };

  if (!isOpen || !clinic) return null;

  const handleQuickStatusAction = async (action, extraParams = {}) => {
    setLoadingAction(true);
    setFeedback(null);
    try {
      const res = await superAdminApi.updateClinicStatus(clinic.id, {
        action,
        duration_months: 12,
        ...extraParams,
      });
      setFeedback({ type: 'success', text: res.message || 'تم تحديث حالة العيادة بنجاح.' });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error updating clinic status:', err);
      setFeedback({ type: 'error', text: err.message || 'حدث خطأ أثناء تعديل حالة العيادة.' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAssignCustomPlan = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    setFeedback(null);
    try {
      const res = await superAdminApi.assignPlan(clinic.id, {
        plan_id: selectedPlanId,
        billing_cycle: billingCycle,
        amount_dzd: parseFloat(planAmount) || 0,
        payment_method: paymentMethod,
        starts_at: startsAt,
        ends_at: endsAt,
        payment_reference: paymentRef,
        notes: notes,
      });
      setFeedback({ type: 'success', text: res.message || 'تم تجديد وترقية الباقة بنجاح.' });
      setShowCustomPlanForm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error assigning plan:', err);
      setFeedback({ type: 'error', text: err.message || 'حدث خطأ أثناء ربط الباقة.' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setShowPasswordText(true);
    setPasswordError(null);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.');
      return;
    }
    setPasswordError(null);
    setLoadingAction(true);
    setFeedback(null);
    try {
      const res = await superAdminApi.resetClinicPassword(clinic.id, newPassword);
      setFeedback({
        type: 'success',
        text: res.message || `تم تحديث كلمة سر العيادة بنجاح! كلمة السر الجديدة: ${newPassword}`,
      });
      setShowPasswordForm(false);
      setNewPassword('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Password reset failed:', err);
      setPasswordError(err.response?.data?.message || err.message || 'فشل تغيير كلمة المرور.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleQuarantine = async () => {
    const isQuar = clinic.is_quarantined;
    if (isQuar) {
      if (!window.confirm(`هل تريد رفع الحجر السيادي عن عيادة "${clinic.name}"؟`)) return;
      setLoadingAction(true);
      try {
        const res = await sovereignTowerApi.liftQuarantine(clinic.id);
        setFeedback({ type: 'success', text: res.message });
        if (onRefresh) onRefresh();
      } catch (err) {
        setFeedback({ type: 'error', text: err.message || 'فشل رفع الحجر.' });
      } finally {
        setLoadingAction(false);
      }
    } else {
      const reason = window.prompt('يرجى كتابة سبب الحجر والعزل السيادي لهذه العيادة:');
      if (!reason) return;
      setLoadingAction(true);
      try {
        const res = await sovereignTowerApi.quarantineClinic(clinic.id, { reason });
        setFeedback({ type: 'success', text: res.message });
        if (onRefresh) onRefresh();
      } catch (err) {
        setFeedback({ type: 'error', text: err.message || 'فشل تطبيق الحجر.' });
      } finally {
        setLoadingAction(false);
      }
    }
  };

  const handleQuickBumpQuota = async () => {
    if (!window.confirm(`هل تريد شحن 100,000 توكن AI فوري لعيادة "${clinic.name}"؟`)) return;
    setLoadingAction(true);
    try {
      const res = await sovereignTowerApi.instantQuotaBump(clinic.id, {
        ai_tokens_add: 100000,
        reason: 'شحن سريع من نافذة التحكم بالعيادة',
      });
      setFeedback({ type: 'success', text: res.message });
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل شحن الكوتا.' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleQuickCloneSandbox = async () => {
    if (!window.confirm(`هل تريد استنساخ هذه العيادة في بيئة Sandbox تدريبية معزولة؟`)) return;
    setLoadingAction(true);
    try {
      const res = await sovereignTowerApi.cloneTenantSandbox(clinic.id);
      setFeedback({ type: 'success', text: `${res.message} (النطاق: ${res.sandbox?.subdomain}.psypro.tech)` });
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل استنساخ Sandbox.' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleQuickSnapshot = async () => {
    setLoadingAction(true);
    try {
      const res = await sovereignTowerApi.createTenantSnapshot(clinic.id);
      setFeedback({ type: 'success', text: res.message });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل توليد Snapshot.' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleImpersonate = async () => {
    if (!window.confirm(`هل تريد الدخول إلى مساحة عمل عيادة "${clinic.name}" لتقديم الدعم الفني؟`)) {
      return;
    }
    setLoadingAction(true);
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
        setFeedback({ type: 'error', text: res.message || 'لم يتم استلام مفتاح جلسة الدخول من الخادم.' });
      }
    } catch (err) {
      console.error('Impersonation failed:', err);
      setFeedback({ type: 'error', text: err.response?.data?.message || err.message || 'فشل بدء جلسة الدعم الفني.' });
    } finally {
      setLoadingAction(false);
    }
  };

  const rawStatus = clinic.subscription?.status || clinic.status || 'active';
  const planNameMap = {
    pro: 'باقة المركز المتكامل (Pro)',
    starter: 'باقة الانطلاقة (Starter)',
    duo: 'باقة العيادة المشتركة (Duo)',
    enterprise: 'باقة المؤسسات والشبكات (Enterprise)',
  };

  const endsAtRaw = clinic.subscription?.ends_at || clinic.subscription_ends_at;
  const daysRemaining = endsAtRaw
    ? Math.max(0, Math.ceil((new Date(endsAtRaw) - new Date()) / (1000 * 60 * 60 * 24)))
    : clinic.subscription?.days_remaining;

  const sub = clinic.subscription || {
    status: rawStatus,
    status_label_ar: rawStatus === 'active' ? 'نشط' : (rawStatus === 'trial' || rawStatus === 'trialing' ? 'فترة تجريبية' : (rawStatus === 'suspended' ? 'مجمد' : 'غير محدد')),
    plan_name_ar: clinic.subscription?.plan_name_ar || clinic.plan_name || planNameMap[clinic.plan_id] || (clinic.plan_id ? `باقة ${clinic.plan_id.toUpperCase()}` : 'باقة مخصصة'),
    ends_at: endsAtRaw ? new Date(endsAtRaw).toLocaleDateString('ar-DZ') : 'مفتوح',
    days_remaining: daysRemaining,
  };
  const metrics = clinic.metrics || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative text-right my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{clinic.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-teal-300 border border-teal-500/30">
                  {clinic.subdomain}.psypro.tech
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تاريخ التسجيل: {clinic.created_at_human} &bull; المعرف: <span className="font-mono text-slate-500 text-[10px]">{clinic.id}</span>
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

        {/* Clinic Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Owner Info Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-400" />
              الطبيب / الأخصائي المسؤول
            </h4>
            <div className="text-sm font-bold text-white">{clinic.owner?.name || clinic.owner_name || 'غير محدد'}</div>
            <div className="space-y-1.5 text-xs text-slate-300 pt-1">
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-mono text-xs text-white select-all">
                    {clinic.owner?.email || clinic.owner_email || clinic.email || `admin@${clinic.subdomain}.psypro.tech`}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const emailToCopy = clinic.owner?.email || clinic.owner_email || clinic.email || `admin@${clinic.subdomain}.psypro.tech`;
                      navigator.clipboard.writeText(emailToCopy);
                      setFeedback({ type: 'success', text: `تم نسخ البريد الإلكتروني بنجاح: ${emailToCopy} 📋` });
                    }}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white transition"
                    title="نسخ الإيميل"
                  >
                    <CopyPlus className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={`mailto:${clinic.owner?.email || clinic.owner_email || clinic.email || `admin@${clinic.subdomain}.psypro.tech`}`}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white transition"
                    title="مراسلة عبر الإيميل"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 truncate">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-mono text-xs text-white">
                    {clinic.owner?.phone || clinic.phone || '--'}
                  </span>
                </div>
                {(clinic.owner?.phone || clinic.phone) && (
                  <a
                    href={`tel:${clinic.owner?.phone || clinic.phone}`}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white transition shrink-0"
                    title="اتصال هاتفي"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Activity Metrics */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              حجم النشاط السريري
            </h4>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-center">
                <div className="text-lg font-black text-white font-mono">{metrics.patients_count || 0}</div>
                <div className="text-[10px] text-slate-400">المرضى</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-center">
                <div className="text-lg font-black text-teal-300 font-mono">{metrics.appointments_count || 0}</div>
                <div className="text-[10px] text-slate-400">المواعيد</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-center">
                <div className="text-lg font-black text-indigo-300 font-mono">{metrics.staff_count || 1}</div>
                <div className="text-[10px] text-slate-400">الطاقم</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Tokens Metering & Quota Card */}
        <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-white">رصيد وحصة الذكاء الاصطناعي (AI Tokens Metering)</span>
            </div>
            <button
              onClick={() => setShowAiQuotaForm(!showAiQuotaForm)}
              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>تعديل الحصة</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">الرصيد المتبقي:</span>
              <span className="font-mono font-black text-teal-300">
                {(clinic.ai_tokens_balance ?? 100000).toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">المستهلك هذا الشهر:</span>
              <span className="font-mono font-black text-amber-400">
                {(clinic.ai_tokens_used ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">السقف الشهري:</span>
              <span className="font-mono font-black text-white">
                {(clinic.ai_monthly_token_quota ?? clinic.monthly_ai_token_limit ?? 100000).toLocaleString()}
              </span>
            </div>
          </div>

          {showAiQuotaForm && (
            <div className="pt-2 border-t border-slate-800 space-y-3 animate-fade-in">
              <div>
                <label className="text-[11px] text-slate-300 font-bold block mb-1">
                  السقف الشهري لرموز الذكاء الاصطناعي (AI Monthly Quota):
                </label>
                <input
                  type="number"
                  step={10000}
                  value={aiMonthlyQuota}
                  onChange={(e) => setAiMonthlyQuota(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAiQuota(true)}
                  disabled={savingAiQuota}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>تصفير الاستهلاك وتجديد الرصيد</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAiQuota(false)}
                  disabled={savingAiQuota}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 text-xs font-black transition flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>حفظ الحصة</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Subscription Status Badge & Details */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/30 border border-teal-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <span className="text-sm font-bold text-white">حالة الاشتراك والباقة الحالية</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                sub?.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : sub?.status === 'trialing'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : sub?.status === 'suspended'
                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {sub?.status_label_ar || 'غير محدد'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">الباقة:</span>
              <span className="font-bold text-teal-300">{sub?.plan_name_ar || 'باقة مخصصة'}</span>
            </div>
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">تاريخ الانتهاء:</span>
              <span className="font-bold text-white font-mono">{sub?.ends_at || 'مفتوح'}</span>
            </div>
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">الأيام المتبقية:</span>
              <span className="font-bold text-amber-400 font-mono">{sub?.days_remaining ?? '--'} يوم</span>
            </div>
          </div>
        </div>

        {/* Quick Subscription Control Actions */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            إجراءات التحكم السريع في الاشتراك:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleQuickStatusAction('activate', { billing_cycle: 'yearly' })}
              disabled={loadingAction}
              className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              تفعيل سنة كاملة
            </button>

            <button
              onClick={() => handleQuickStatusAction('extend_trial', { days: 14 })}
              disabled={loadingAction}
              className="py-2.5 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5" />
              تمديد 14 يوماً
            </button>

            <button
              onClick={() => handleQuickStatusAction('suspend')}
              disabled={loadingAction}
              className="py-2.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              تجميد الحساب ⛔
            </button>

            <button
              onClick={() => {
                setShowCustomPlanForm(!showCustomPlanForm);
                setShowOverridesForm(false);
                setShowPasswordForm(false);
              }}
              className="py-2.5 px-3 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              title="تجديد أو ترقية اشتراك العيادة عبر BaridiMob أو CCP"
            >
              <CreditCard className="w-3.5 h-3.5 text-teal-400" />
              <span>تجديد الاشتراك الآن (BaridiMob / CCP)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowOverridesForm(!showOverridesForm);
                setShowCustomPlanForm(false);
                setShowPasswordForm(false);
              }}
              className="py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              تخصيص استثناءات (Overrides)
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setShowCustomPlanForm(false);
                setShowOverridesForm(false);
              }}
              className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-rose-400" />
              تغيير كلمة سر العيادة 🔑
            </button>
          </div>
        </div>

        {/* Password Reset Accordion */}
        {showPasswordForm && (
          <form onSubmit={handleResetPassword} className="bg-slate-950 border border-rose-500/40 rounded-2xl p-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-rose-400" />
                تعيين كلمة سر جديدة لمسؤول عيادة ({clinic.name})
              </h4>
              <button
                type="button"
                onClick={handleGenerateRandomPassword}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <Sparkles className="w-3 h-3" />
                <span>توليد كلمة سر عشوائية قوية 🎲</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              سيتم تغيير كلمة المرور فوراً لحساب مسؤول العيادة (<span className="text-white font-mono">{clinic.owner?.email || `admin@${clinic.subdomain}.psypro.tech`}</span>). سيتمكن الطبيب من الدخول بها مباشرة إلى حسابه.
            </p>

            <div className="relative">
              <label className="text-[11px] text-slate-400 block mb-1">كلمة المرور الجديدة (6 أحرف على الأقل):</label>
              <div className="relative">
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="أدخل كلمة المرور الجديدة..."
                  className={`w-full bg-slate-900 border ${
                    passwordError ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-700'
                  } rounded-xl px-3 py-2 text-xs text-white font-mono tracking-wider focus:outline-none focus:border-rose-500 pl-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-rose-400 font-bold mt-1 animate-fade-in flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setNewPassword('');
                  setPasswordError(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loadingAction || !newPassword}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black transition disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{loadingAction ? 'جاري التعيين...' : 'تثبيت كلمة السر الآن'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tenant Custom Overrides Accordion */}
        {showOverridesForm && (
          <form onSubmit={handleSaveOverrides} className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                تخصيص الصلاحيات والحدود الاستثنائية للعيادة (Custom Tenant Overrides)
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">تتجاوز قيود الباقة الأصلية</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">الحد الأقصى للمرضى (Custom Patient Cap):</label>
                <input
                  type="number"
                  value={maxPatientsOverride}
                  onChange={(e) => setMaxPatientsOverride(e.target.value)}
                  placeholder="اتركه فارغاً لاستخدام حد الباقة الافتراضي"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">الحد الأقصى للأطباء (Custom Clinicians Cap):</label>
                <input
                  type="number"
                  value={maxCliniciansOverride}
                  onChange={(e) => setMaxCliniciansOverride(e.target.value)}
                  placeholder="اتركه فارغاً لاستخدام حد الباقة الافتراضي"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Features Override Checkboxes */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 block">تفعيل وحدات وميزات خاصة بشكل منفرد:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'ai_copilot', label: 'مساعد الذكاء الاصطناعي (AI Copilot)' },
                  { key: 'teleconsultation', label: 'الاستشارات المرئية (Teleconsult)' },
                  { key: 'kiosk_checkin', label: 'شاشة الاستقبال الذاتية (Kiosk)' },
                  { key: 'custom_domain', label: 'دعم النطاق الخاص (Custom Domain)' },
                ].map((feat) => {
                  const isChecked = enabledFeaturesOverride.includes(feat.key);
                  return (
                    <button
                      type="button"
                      key={feat.key}
                      onClick={() => toggleFeatureOverride(feat.key)}
                      className={`p-2.5 rounded-xl border text-right font-bold transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>{feat.label}</span>
                      <span className="text-xs">{isChecked ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOverridesForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loadingAction}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {loadingAction ? 'جاري الحفظ...' : 'حفظ الاستثناءات'}
              </button>
            </div>
          </form>
        )}

        {/* Custom Plan Assignment Modal Form */}
        {showCustomPlanForm && (
          <form onSubmit={handleAssignCustomPlan} className="bg-slate-950 border border-teal-500/40 rounded-2xl p-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                <FileBadge className="w-4 h-4 text-teal-400" />
                تجديد / ترقية اشتراك العيادة وتحديد الباقة (BaridiMob / CCP):
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">توليد الفاتورة وتحديث الصلاحيات فوراً</span>
            </div>

            {/* Live Price Highlight Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-950/80 via-slate-900 to-indigo-950/80 border border-teal-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-black">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold">الباقة المحددة للتجديد / الترقية:</div>
                  <div className="text-xs font-black text-white">{resolvePlan(selectedPlanId, availablePlans).name_ar}</div>
                  <div className="text-[10px] text-teal-400 font-mono">
                    الدورة: {billingCycle === 'yearly' ? 'اشتراك سنوي (12 شهر)' : billingCycle === 'monthly' ? 'اشتراك شهري (1 شهر)' : billingCycle === 'lifetime' ? 'مدى الحياة (Lifetime VIP)' : 'فترة تجريبية'} • وسيلة الدفع: {paymentMethod === 'baridimob' ? 'بريدي موب BaridiMob' : paymentMethod === 'ccp' ? 'حوالة بريدية CCP' : paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : paymentMethod === 'cash' ? 'نقداً' : 'منحة شراكة'}
                  </div>
                </div>
              </div>
              <div className="text-left font-mono">
                <div className="text-[10px] text-slate-400 font-bold">المبلغ المحسوب للدفع:</div>
                <div className="text-xl font-black text-emerald-400">
                  {Number(planAmount || 0).toLocaleString()} <span className="text-xs text-emerald-300 font-sans">د.ج</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-bold">نوع الاشتراك / الباقة:</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handleSelectPlan(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                >
                  {availablePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_ar || p.name_fr || p.name} — ({Number(p.price_yearly || 0).toLocaleString()} د.ج/سنة)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-bold">دورة الفوترة:</label>
                <select
                  value={billingCycle}
                  onChange={(e) => handleCycleChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="yearly">سنوي (Yearly - سنة كاملة)</option>
                  <option value="monthly">شهري (Monthly)</option>
                  <option value="lifetime">مدى الحياة (Lifetime VIP)</option>
                  <option value="trial">تجريبي (Trial)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-bold">المبلغ المحصل (د.ج):</label>
                <input
                  type="number"
                  value={planAmount}
                  onChange={(e) => setPlanAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-bold">طريقة الدفع:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="baridimob">بريدي موب (BaridiMob)</option>
                  <option value="ccp">حوالة بريدية (CCP)</option>
                  <option value="bank_transfer">تحويل بنكي رسمي</option>
                  <option value="cash">دفع نقدي مباشر (Espèces)</option>
                  <option value="free_grant">منحة مجانية / شراكة</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-bold">تاريخ البدء:</label>
                <input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-bold">تاريخ الانتهاء:</label>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1 font-bold">رقم العملية أو المرجع / ملاحظات الفاتورة:</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="مثال: حوالة بريدية رقم 45872 أو وصل بريدي موب..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCustomPlanForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loadingAction}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black transition disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-teal-600/20"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{loadingAction ? 'جاري التثبيت...' : 'تأكيد التجديد / الترقية وتوليد الفاتورة'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Sovereign Tower Rapid Actions */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-indigo-950/40 border border-amber-500/30 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-black text-amber-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              التحكم والسيطرة السيادية (Sovereign Controls):
            </span>
            {clinic.is_quarantined && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                🚨 العيادة تحت الحجر
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={handleToggleQuarantine}
              disabled={loadingAction}
              className={`py-2 px-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1 border ${
                clinic.is_quarantined
                  ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30'
                  : 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-500/30'
              }`}
            >
              {clinic.is_quarantined ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{clinic.is_quarantined ? 'رفع الحجر' : 'عزل وحجر 🚨'}</span>
            </button>

            <button
              type="button"
              onClick={handleQuickBumpQuota}
              disabled={loadingAction}
              className="py-2 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/30 font-bold transition flex items-center justify-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>شحن +100k توكن</span>
            </button>

            <button
              type="button"
              onClick={handleQuickCloneSandbox}
              disabled={loadingAction}
              className="py-2 px-2.5 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 font-bold transition flex items-center justify-center gap-1"
            >
              <CopyPlus className="w-3.5 h-3.5" />
              <span>استنساخ Sandbox</span>
            </button>

            <button
              type="button"
              onClick={handleQuickSnapshot}
              disabled={loadingAction}
              className="py-2 px-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-bold transition flex items-center justify-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Snapshot</span>
            </button>
          </div>
        </div>

        {/* Footer Support Impersonation Action */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleImpersonate}
            disabled={loadingAction}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Key className="w-3.5 h-3.5" />
            <span>الدخول كأدمن العيادة (Impersonate)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
