import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Building2,
  Users,
  Coins,
  Activity,
  Calendar,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  CreditCard,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Brain,
  FileCheck
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function SuperAdminOverviewTab({ onNavigateTab }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getDashboardOverview();
      setData(res);
    } catch (err) {
      console.error('Error fetching dashboard overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading && !data) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
        <div className="text-sm font-semibold text-slate-400">جاري تحميل المؤشرات والتحليلات الشاملة...</div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const wilayas = data?.wilaya_distribution || {};
  const revenueTrend = data?.revenue_trend || [];
  const aiStats = data?.ai_stats || {};

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Notification Alert for Pending Payments */}
      {kpis.pending_payments_count > 0 && (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-slate-900 border border-amber-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>يوجد {kpis.pending_payments_count} طلب سداد وتجديد جديد بحاجة إلى التحقق والمراجعة!</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                  {Number(kpis.pending_payments_dzd).toLocaleString()} DZD
                </span>
              </div>
              <div className="text-xs text-amber-200/80 mt-0.5">
                قام أصحاب العيادات بإرفاق وصولات تحويل BaridiMob / CCP في انتظار الاعتماد وإصدار الفاتورة.
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('requests')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow flex items-center gap-1.5"
          >
            <span>مراجعة الطلبات والوصولات</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main KPI Revenue & Volume Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">الإيراد الشهري المتكرر (MRR)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
            {Number(kpis.mrr_dzd || 0).toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">DZD/شهر</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
            <span>السنوي (ARR):</span>
            <span className="text-slate-200 font-bold">{Number(kpis.arr_dzd || 0).toLocaleString()} DZD</span>
          </div>
        </div>

        {/* Active Clinics Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 relative overflow-hidden group hover:border-brand-500/50 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">العيادات المشتركة</span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {kpis.active_clinics ?? 0}{' '}
            <span className="text-xs font-normal text-slate-400">من أصل {kpis.total_clinics}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
            <span>معدل التحويل (Conversion):</span>
            <span className="text-teal-400 font-bold">{kpis.conversion_rate_percent}%</span>
          </div>
        </div>

        {/* Platform Patient Population */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 relative overflow-hidden group hover:border-indigo-500/50 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">إجمالي المرضى المتابعين</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-300 font-mono">
            {Number(kpis.total_patients || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
            <span>المستخدمين والأطباء:</span>
            <span className="text-slate-200 font-bold">{kpis.total_users} أخصائي</span>
          </div>
        </div>

        {/* Clinical Operations Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 relative overflow-hidden group hover:border-purple-500/50 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">التقييمات والجلسات المنجزة</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">
            {Number(kpis.total_assessments || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
            <span>جلسات العلاج:</span>
            <span className="text-slate-200 font-bold">{Number(kpis.total_sessions || 0).toLocaleString()} جلسة</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Wilayas Distribution & Revenue Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Algerian Wilayas Geographic Distribution */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-bold text-white">
                توزيع العيادات والمراكز عبر الولايات الجزائرية (Wilayas Distribution)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              تغطية جغرافية عبر الجزائر
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
            {Object.entries(wilayas).map(([wilayaName, count]) => (
              <div
                key={wilayaName}
                className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-3 flex flex-col justify-between hover:border-teal-500/40 transition group"
              >
                <span className="text-xs font-semibold text-slate-300 group-hover:text-teal-300 transition truncate">
                  {wilayaName}
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-lg font-black text-white font-mono">{count}</span>
                  <span className="text-[10px] text-slate-500 font-medium">مركز طبي</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick AI & Conversion Summary */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300">
                استهلاك الذكاء الاصطناعي هذا الشهر:{' '}
                <strong className="text-indigo-300 font-mono">
                  {Number(aiStats.total_tokens_month || 0).toLocaleString()} توكن
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>معدل النشاط السحابي: 99.98% Uptime</span>
            </div>
          </div>
        </div>

        {/* 6-Month Revenue Trend & Health */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">حجم الإيرادات (آخر 6 أشهر)</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">DZD</span>
            </div>

            <div className="space-y-3 pt-3">
              {revenueTrend.map((item, idx) => {
                const maxRev = Math.max(...revenueTrend.map((r) => r.revenue_dzd), 1);
                const percent = Math.min(100, Math.round((item.revenue_dzd / maxRev) * 100));

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">{item.month}</span>
                      <span className="text-white font-bold">
                        {Number(item.revenue_dzd).toLocaleString()} DZD
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Jump Action */}
          <button
            onClick={() => onNavigateTab && onNavigateTab('invoices')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <FileCheck className="w-4 h-4 text-teal-400" />
            <span>عرض كافة فواتير B2B وإيصالات السداد</span>
          </button>
        </div>
      </div>
    </div>
  );
}
