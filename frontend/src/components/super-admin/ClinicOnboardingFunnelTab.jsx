import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  MessageCircle,
  ExternalLink,
  RotateCcw,
  ArrowRight,
  Send,
  X,
  FileCheck,
  ChevronDown,
  HelpCircle,
  Zap
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function ClinicOnboardingFunnelTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activeStageFilter, setActiveStageFilter] = useState('all'); // 'all' or stage ID 1..6
  const [onlyStuckFilter, setOnlyStuckFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Nudge Modal
  const [nudgingClinic, setNudgingClinic] = useState(null);
  const [nudgeStage, setNudgeStage] = useState(2);
  const [customMessage, setCustomMessage] = useState('');
  const [sendingNudge, setSendingNudge] = useState(false);

  // Tour Resetting State
  const [togglingTourId, setTogglingTourId] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await superAdminApi.getOnboardingFunnelOverview();
      if (res && res.success) {
        setData(res);
      } else {
        setError(res.message || 'فشل تحميل بيانات قمع تهيئة العيادات.');
      }
    } catch (err) {
      console.error('Fetch onboarding funnel error:', err);
      setError(err.response?.data?.message || err.message || 'تعذر الاتصال بخادم تحليلات التهيئة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Filtered clinics list
  const filteredClinics = useMemo(() => {
    if (!data?.clinics) return [];

    return data.clinics.filter(clinic => {
      if (activeStageFilter !== 'all') {
        if (clinic.current_step !== Number(activeStageFilter)) return false;
      }

      if (onlyStuckFilter && !clinic.is_stuck) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = clinic.name?.toLowerCase().includes(q);
        const matchDoctor = clinic.doctor_name?.toLowerCase().includes(q);
        const matchWilaya = clinic.wilaya?.toLowerCase().includes(q);
        if (!matchName && !matchDoctor && !matchWilaya) return false;
      }

      return true;
    });
  }, [data, activeStageFilter, onlyStuckFilter, searchTerm]);

  // Open Nudge Modal
  const handleOpenNudge = (clinic) => {
    setNudgingClinic(clinic);
    setNudgeStage(clinic.current_step || 2);
    setCustomMessage('');
  };

  // Submit WhatsApp Nudge
  const handleSendNudge = async () => {
    if (!nudgingClinic) return;

    try {
      setSendingNudge(true);
      const res = await superAdminApi.sendOnboardingNudge(nudgingClinic.id, {
        stage: nudgeStage,
        custom_message: customMessage.trim() || undefined,
      });

      if (res && res.success) {
        // Open WhatsApp Web/App in new tab
        if (res.whatsapp_url) {
          window.open(res.whatsapp_url, '_blank');
        }
        setNudgingClinic(null);
        fetchOverview();
      } else {
        alert(res.message || 'تعذر تسجيل التنبيه.');
      }
    } catch (err) {
      console.error('Send nudge error:', err);
      alert(err.response?.data?.message || err.message || 'حدث خطأ أثناء إرسال التنبيه.');
    } finally {
      setSendingNudge(false);
    }
  };

  // Toggle Onboarding Tour
  const handleToggleTour = async (clinic) => {
    try {
      setTogglingTourId(clinic.id);
      const res = await superAdminApi.toggleOnboardingTour(clinic.id);
      if (res && res.success) {
        fetchOverview();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'تعذر تعديل حالة الجولة الإرشادية.');
    } finally {
      setTogglingTourId(null);
    }
  };

  // Impersonate Clinic
  const handleImpersonate = async (clinic) => {
    try {
      const res = await superAdminApi.impersonateClinic(clinic.id);
      if (res.token) {
        localStorage.setItem('token', res.token);
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('tenant', JSON.stringify(clinic));
        localStorage.setItem('is_impersonating', 'true');
        localStorage.setItem('impersonating_clinic_name', clinic.name);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      alert(err.response?.data?.message || 'فشل تسجيل الدخول لحساب العيادة.');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 text-center">
        <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
        <p className="text-slate-300 text-sm font-bold">جاري تحليل مراحل قمع التحويل وتفعيل العيادات...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-3xl bg-rose-950/30 border border-rose-800 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-black text-rose-200">تعذر تحميل بيانات قمع التهيئة</h3>
        <p className="text-xs text-rose-300/80">{error}</p>
        <button
          onClick={fetchOverview}
          className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const stages = data?.stages || [];

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>مسار التهيئة وقمع التحويل السريري (Onboarding Funnel)</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Conversion: {kpis.overall_conversion_rate}% 🚀
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              محرك تفعيل العيادات السريرية وتحفيز التحويل للاشتراك
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              تتبع رحلة الطبيب من التسجيل التجريبي وحتى الاشتراك الدائم، كشف نقاط التعثر، والتدخل الاستباقي عبر WhatsApp
            </p>
          </div>

          <button
            onClick={fetchOverview}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center gap-2 self-start md:self-auto shadow-lg shadow-indigo-600/30"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث التحليلات</span>
          </button>
        </div>

        {/* 4 Hero KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>نسبة التحويل للاشتراك المدفوع</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300">{kpis.overall_conversion_rate}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                style={{ width: `${kpis.overall_conversion_rate}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {kpis.paid_active_count} من {kpis.total_clinics} عيادة أصبحت مشتركة
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>متوسط نقاط تفعيل العيادات</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">{kpis.average_score}%</div>
            <div className="text-[10px] text-slate-400 mt-2">
              {kpis.fully_onboarded_count} عيادة أكملت 80%+ من الخطوات
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>عيادات متعثرة تتطلب تدخلاً</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-300">{kpis.needs_attention_count}</div>
            <div className="text-[10px] text-slate-400 mt-2">
              توقفت في المراحل الأولى (تحتاج دعم)
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>قيد التجربة حالياً</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-300">{kpis.trial_count}</div>
            <div className="text-[10px] text-slate-400 mt-2">
              فرص تحويل نشطة خلال 14 يوماً
            </div>
          </div>
        </div>
      </div>

      {/* Visual Conversion Funnel Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-black text-white">
              مخطط قمع التحويل السريري (Interactive Funnel Stages)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              انقر على أي مرحلة لفلترة العيادات المتواجدة عندها وإرسال الدعم المناسب
            </p>
          </div>

          {activeStageFilter !== 'all' && (
            <button
              onClick={() => setActiveStageFilter('all')}
              className="text-xs text-indigo-400 hover:text-white font-bold underline self-start"
            >
              عرض كافة المراحل (إلغاء التصفية)
            </button>
          )}
        </div>

        {/* Funnel Stages Stack */}
        <div className="space-y-3">
          {stages.map((stage, idx) => {
            const isSelected = activeStageFilter === String(stage.id);
            const widthPct = Math.max(15, stage.conversion_pct);

            return (
              <div key={stage.id} className="space-y-1.5">
                <div
                  onClick={() => setActiveStageFilter(isSelected ? 'all' : String(stage.id))}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {stage.id}
                    </span>
                    <div>
                      <div className="text-sm font-black text-white">{stage.title_ar}</div>
                      <div className="text-[11px] text-slate-400">{stage.description_ar}</div>
                    </div>
                  </div>

                  {/* Funnel Visual Bar */}
                  <div className="flex-1 max-w-md mx-4 hidden sm:block">
                    <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          stage.id === 6
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stage Metrics */}
                  <div className="flex items-center gap-4 text-xs shrink-0 justify-between sm:justify-end">
                    <div>
                      <span className="text-slate-400 text-[10px]">العيادات: </span>
                      <strong className="text-white font-black text-sm">{stage.count}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px]">نسبة الوصول: </span>
                      <strong className="text-indigo-300 font-black text-sm">{stage.conversion_pct}%</strong>
                    </div>

                    {stage.stuck_clinics?.length > 0 && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {stage.stuck_clinics.length} متعثرة ⚠️
                      </span>
                    )}
                  </div>
                </div>

                {/* Drop-off notice between stages */}
                {idx < stages.length - 1 && stage.dropoff_count > 0 && (
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 py-0.5">
                    <span className="text-rose-400 font-bold">تسرب: {stage.dropoff_count} عيادة ({stage.dropoff_pct}%)</span>
                    <span>🔻 بين المرحلتين {stage.id} و {stage.id + 1}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filterable Clinics Registry */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-black text-white">
              قمرة متابعة وتنشيط العيادات ({filteredClinics.length} عيادة)
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              {activeStageFilter !== 'all' && (
                <span className="text-indigo-400 font-bold">
                  مصفى للمرحلة {activeStageFilter} •{' '}
                </span>
              )}
              {onlyStuckFilter && (
                <span className="text-rose-400 font-bold">
                  إظهار المتعثرة فقط •{' '}
                </span>
              )}
              <span>إرسال تنبيهات WhatsApp المخصصة وإعادة ضبط الجولة التوجيهية</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالعيادة، الطبيب، الولاية..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Stuck Only Toggle */}
            <button
              type="button"
              onClick={() => setOnlyStuckFilter(!onlyStuckFilter)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                onlyStuckFilter
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>المتعثرة فقط ⚠️</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-bold">
                <th className="pb-3 px-3">العيادة والمشرف</th>
                <th className="pb-3 px-3">الولاية</th>
                <th className="pb-3 px-3">المرحلة الحالية</th>
                <th className="pb-3 px-3">نقاط التفعيل</th>
                <th className="pb-3 px-3">منذ التسجيل</th>
                <th className="pb-3 px-3">الحالة السريرية</th>
                <th className="pb-3 px-3 text-center">الإجراءات والتحفيز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClinics.length > 0 ? (
                filteredClinics.map(clinic => {
                  const stageObj = stages.find(s => s.id === clinic.current_step);

                  return (
                    <tr key={clinic.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-3">
                        <div className="font-black text-white text-sm">{clinic.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>د. {clinic.doctor_name}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-500" dir="ltr">{clinic.phone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-300 font-bold">
                        {clinic.wilaya}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-black text-xs flex items-center justify-center">
                            {clinic.current_step}
                          </span>
                          <span className="font-bold text-slate-200 truncate max-w-[180px]">
                            {stageObj?.title_ar?.split('. ')[1] || 'قيد التهيئة'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                clinic.score >= 80 ? 'bg-emerald-400' : (clinic.score >= 50 ? 'bg-amber-400' : 'bg-rose-400')
                              }`}
                              style={{ width: `${clinic.score}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-white text-xs">{clinic.score}%</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-400 text-xs">
                        {clinic.days_since_signup} يوم
                      </td>

                      <td className="py-3.5 px-3">
                        {clinic.is_stuck ? (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            متعثرة ({clinic.days_since_signup} يوم) ⚠️
                          </span>
                        ) : clinic.status === 'active' ? (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            نشطة ومستقرة 🟢
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            سلسلة سليمة ⏳
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* WhatsApp Nudge Button */}
                          <button
                            onClick={() => handleOpenNudge(clinic)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                            title="إرسال رسالة تحفيز مخصصة عبر WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>تحفيز WhatsApp</span>
                          </button>

                          {/* Reset Tour Button */}
                          <button
                            onClick={() => handleToggleTour(clinic)}
                            disabled={togglingTourId === clinic.id}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                            title={clinic.tour_enabled ? 'إعادة ضبط الجولة الإرشادية' : 'تفعيل الجولة الإرشادية'}
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${togglingTourId === clinic.id ? 'animate-spin' : ''}`} />
                          </button>

                          {/* Impersonate Button */}
                          <button
                            onClick={() => handleImpersonate(clinic)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 transition"
                            title="تسجيل الدخول للعيادة ومساعدتها (Impersonate)"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    لا توجد عيادات تطابق شروط التصفية المحددة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Nudge Dispatch Modal */}
      {nudgingClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">إرسال تنبيه تحفيزي لمسار التهيئة</h3>
              </div>
              <button
                onClick={() => setNudgingClinic(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-1">
              <div className="font-bold text-white text-sm">{nudgingClinic.name}</div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>المشرف: د. {nudgingClinic.doctor_name}</span>
                <span>•</span>
                <span className="font-mono text-emerald-400" dir="ltr">{nudgingClinic.phone}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Choose Stage Template */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">مرحلة التعثر المستهدفة:</label>
                <select
                  value={nudgeStage}
                  onChange={e => setNudgeStage(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={1}>المرحلة 1: ترحيب وإكمال الهوية السريرية</option>
                  <option value={2}>المرحلة 2: المساعدة في إضافة أول مريض</option>
                  <option value={3}>المرحلة 3: تجربة الكاتب الذكي AI Whisper في أول جلسة</option>
                  <option value={4}>المرحلة 4: استكشاف بنك الروائز الـ 18 والكراسات</option>
                  <option value={5}>المرحلة 5: إصدار الحصيلة الرسمية الشاملة</option>
                  <option value={6}>المرحلة 6: عرض الترقية والاشتراك السنوي</option>
                </select>
              </div>

              {/* Custom Message input (optional) */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  تعديل نص الرسالة (اختياري - يترك فارغاً لاعتماد النموذج الذكي):
                </label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  placeholder="اكتب رسالة مخصصة إضافية للطبيب إذا رغبت في ذلك..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setNudgingClinic(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSendNudge}
                disabled={sendingNudge}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                {sendingNudge ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>إرسال وفتح WhatsApp الآن 🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
