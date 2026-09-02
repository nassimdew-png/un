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
  Check
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function ClinicManageModal({ clinic, plans = [], isOpen, onClose, onRefresh }) {
  const { t } = useTranslation();
  const [loadingAction, setLoadingAction] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Custom Plan Assignment Form State
  const [showCustomPlanForm, setShowCustomPlanForm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(clinic?.subscription?.plan_id || (plans[0]?.id || ''));
  const [billingCycle, setBillingCycle] = useState(clinic?.subscription?.billing_cycle || 'yearly');
  const [startsAt, setStartsAt] = useState(clinic?.subscription?.starts_at || new Date().toISOString().split('T')[0]);
  const [endsAt, setEndsAt] = useState(clinic?.subscription?.ends_at || '');
  const [paymentRef, setPaymentRef] = useState(clinic?.subscription?.payment_reference || '');
  const [notes, setNotes] = useState(clinic?.subscription?.notes || '');

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
        starts_at: startsAt,
        ends_at: endsAt,
        payment_reference: paymentRef,
        notes: notes,
      });
      setFeedback({ type: 'success', text: res.message || 'تم ربط الباقة بنجاح.' });
      setShowCustomPlanForm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error assigning plan:', err);
      setFeedback({ type: 'error', text: err.message || 'حدث خطأ أثناء ربط الباقة.' });
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

  const sub = clinic.subscription;
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
            <div className="text-sm font-bold text-white">{clinic.owner?.name || 'غير محدد'}</div>
            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono">{clinic.owner?.email || '--'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono">{clinic.owner?.phone || '--'}</span>
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
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              ربط باقة مخصصة
            </button>

            <button
              type="button"
              onClick={() => {
                setShowOverridesForm(!showOverridesForm);
                setShowCustomPlanForm(false);
              }}
              className="py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              تخصيص استثناءات (Overrides)
            </button>
          </div>
        </div>

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
            <h4 className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
              <FileBadge className="w-4 h-4 text-teal-400" />
              تخصيص وربط باقة اشتراك جديدة:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">اختر الباقة:</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.yearly_price_dzd} DZD/سنة)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">دورة الفوترة:</label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="monthly">شهري</option>
                  <option value="yearly">سنوي</option>
                  <option value="lifetime">مدى الحياة</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">تاريخ البدء:</label>
                <input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">تاريخ الانتهاء:</label>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {loadingAction ? 'جاري الربط...' : 'تثبيت الباقة'}
              </button>
            </div>
          </form>
        )}

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
