import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Building2,
  Phone,
  MessageCircle,
  Calendar,
  Users,
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function ClinicHealthTab() {
  const { t } = useTranslation();
  const [clinics, setClinics] = useState([]);
  const [stats, setStats] = useState({ total: 0, high_activity: 0, moderate_activity: 0, churn_risk: 0, average_score: 0 });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHealthScores = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getClinicHealthScores();
      if (res.success) {
        setClinics(res.clinics || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load clinic health scores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthScores();
  }, []);

  const filteredClinics = clinics.filter((c) => {
    const matchesCategory = !categoryFilter || c.health_category === categoryFilter;
    const matchesSearch = !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  const getScoreColor = (score) => {
    if (score >= 65) return 'from-emerald-500 to-teal-400 text-emerald-400';
    if (score >= 30) return 'from-amber-500 to-yellow-400 text-amber-400';
    return 'from-rose-600 to-red-400 text-rose-400';
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'high':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>نشاط فائق وممتاز</span>
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>نشاط متوسط ومستقر</span>
          </span>
        );
      case 'churn_risk':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>خطر الانقطاع (Churn Risk)</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner & Strategy Info */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">مؤشر تفاعل وصحة العيادات (Clinic Health & Churn Risk Engine)</h2>
          </div>
          <p className="text-xs text-slate-400">
            خوارزمية ذكية لاحتساب نشاط العيادات بناءً على المرضى الجدد، عدد الجلسات، التقييمات المنجزة، ومعدل الاستخدام لتقليل معدل الإلغاء.
          </p>
        </div>

        <button
          onClick={fetchHealthScores}
          className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 self-start lg:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث التقييمات اللحظية</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">متوسط صحة المنصة</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-400 font-mono">
            {stats.average_score} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">المعدل العام لنشاط وتفاعل العيادات</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">العيادات فائقة النشاط</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {stats.high_activity}{' '}
            <span className="text-xs font-normal text-slate-400">من أصل {stats.total}</span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">تفاعل يومي وجلسات مستمرة</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">نشاط متوسط ومستقر</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {stats.moderate_activity}{' '}
            <span className="text-xs font-normal text-slate-400">عيادة</span>
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">استخدام دوري منتظم</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-rose-500/30 bg-rose-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-400">خطر الانقطاع (Churn Risk)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {stats.churn_risk}{' '}
            <span className="text-xs font-normal text-rose-300/60">عيادات مهددة</span>
          </div>
          <div className="text-[11px] text-rose-300/80 mt-1">بحاجة إلى تواصل ومتابعة فورية</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              categoryFilter === '' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({clinics.length})
          </button>
          <button
            onClick={() => setCategoryFilter('churn_risk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              categoryFilter === 'churn_risk'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <span>🔴 في دائرة الخطر ({stats.churn_risk})</span>
          </button>
          <button
            onClick={() => setCategoryFilter('moderate')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              categoryFilter === 'moderate'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            🟡 متوسط ({stats.moderate_activity})
          </button>
          <button
            onClick={() => setCategoryFilter('high')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              categoryFilter === 'high'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            🟢 نشاط مرتفع ({stats.high_activity})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="البحث بالاسم، النطاق أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Health Cards Grid */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-rose-400" />
          <div className="text-xs">جاري احتساب مؤشرات النشاط وصحة العيادات...</div>
        </div>
      ) : filteredClinics.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center text-slate-500">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
          <div className="text-sm font-bold text-slate-300">لا توجد عيادات مطابقة لمعايير البحث الحالية</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClinics.map((c) => {
            const isAtRisk = c.health_category === 'churn_risk';
            return (
              <div
                key={c.id}
                className={`p-5 rounded-3xl border transition space-y-4 ${
                  isAtRisk
                    ? 'bg-gradient-to-b from-rose-950/20 via-slate-900 to-slate-900 border-rose-500/40 shadow-xl shadow-rose-950/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Clinic Name & Category */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{c.name}</span>
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {c.subdomain}.psypro.tech
                    </div>
                  </div>
                  {getCategoryBadge(c.health_category)}
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">درجة التفاعل (Health Score)</span>
                    <span className={`font-mono ${getScoreColor(c.health_score)}`}>
                      {c.health_score} / 100
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(c.health_score)}`}
                      style={{ width: `${c.health_score}%` }}
                    />
                  </div>
                </div>

                {/* Operational Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>مرضى جدد (30 يوم)</span>
                    </div>
                    <div className="font-mono font-bold text-white mt-0.5">
                      +{c.recent_patients} <span className="text-[10px] text-slate-500">({c.total_patients} إجمالي)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>المواعيد (30 يوم)</span>
                    </div>
                    <div className="font-mono font-bold text-white mt-0.5">{c.recent_appointments} موعد</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-slate-400" />
                      <span>جلسات وتقييمات</span>
                    </div>
                    <div className="font-mono font-bold text-white mt-0.5">{c.recent_clinical_work} جلسة</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>آخر نشاط مسجل</span>
                    </div>
                    <div className="font-mono font-bold text-slate-300 mt-0.5">
                      {c.days_since_last_activity === 0 ? 'اليوم' : `منذ ${c.days_since_last_activity} يوم`}
                    </div>
                  </div>
                </div>

                {/* Footer Action: WhatsApp Contact Button */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    <span>الطبيب: </span>
                    <span className="text-slate-200 font-bold">{c.owner_name}</span>
                  </div>

                  <a
                    href={c.whatsapp_url}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isAtRisk
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 animate-bounce'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{isAtRisk ? 'تواصل عبر واتساب فوراً' : 'واتساب'}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
