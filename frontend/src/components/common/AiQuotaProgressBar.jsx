import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowUpRight, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { clinicQuotaApi } from '../../api';

export default function AiQuotaProgressBar({ onOpenUpgradeModal }) {
  const [quotaData, setQuotaData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQuota = async () => {
    try {
      const res = await clinicQuotaApi.getMyQuota();
      if (res.success && res.quota) {
        setQuotaData(res.quota);
      }
    } catch (err) {
      console.warn('Failed to fetch clinic quota:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  if (loading || !quotaData) return null;

  const getProgressColor = (pct) => {
    if (pct >= 100) return 'bg-rose-500 text-rose-300 border-rose-500/40';
    if (pct >= 80) return 'bg-amber-500 text-amber-300 border-amber-500/40';
    return 'bg-emerald-500 text-emerald-300 border-emerald-500/40';
  };

  const reports = quotaData.reports || { used: 0, limit: 50, percentage: 0 };
  const transcribe = quotaData.transcribe || { used: 0, limit: 60, percentage: 0 };
  const podcasts = quotaData.podcasts || { used: 0, limit: 5, percentage: 0 };

  const isNearLimit = reports.percentage >= 80 || transcribe.percentage >= 80 || podcasts.percentage >= 80;

  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-right" dir="rtl">
      
      {/* Plan Tag */}
      <div className="flex items-center space-x-1.5 space-x-reverse px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] font-black text-purple-300">
        <Sparkles className="w-3 h-3 text-purple-400" />
        <span>باقة {quotaData.plan_name?.toUpperCase()}</span>
      </div>

      {/* Reports Quota Bar */}
      <div className="flex items-center space-x-2 space-x-reverse px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
        <span className="text-slate-400 font-bold">الحصائل:</span>
        <span className="font-mono font-black text-white">{reports.used}/{reports.limit}</span>
        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            style={{ width: `${Math.min(reports.percentage, 100)}%` }}
            className={`h-full rounded-full transition-all ${
              reports.percentage >= 100 ? 'bg-rose-500' : reports.percentage >= 80 ? 'bg-amber-400' : 'bg-teal-400'
            }`}
          />
        </div>
      </div>

      {/* Transcribe Mins Quota Bar */}
      <div className="flex items-center space-x-2 space-x-reverse px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
        <span className="text-slate-400 font-bold">التفريغ:</span>
        <span className="font-mono font-black text-white">{transcribe.used}/{transcribe.limit} د</span>
        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            style={{ width: `${Math.min(transcribe.percentage, 100)}%` }}
            className={`h-full rounded-full transition-all ${
              transcribe.percentage >= 100 ? 'bg-rose-500' : transcribe.percentage >= 80 ? 'bg-amber-400' : 'bg-cyan-400'
            }`}
          />
        </div>
      </div>

      {/* Upgrade CTA */}
      <button
        type="button"
        onClick={onOpenUpgradeModal}
        className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition flex items-center space-x-1 space-x-reverse shadow-md ${
          isNearLimit
            ? 'bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-90 text-white animate-pulse'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
        }`}
      >
        <Zap className="w-3 h-3 text-amber-300" />
        <span>{isNearLimit ? 'شارفت الحصة على النفاد! ترقية' : 'ترقية الحصة'}</span>
        <ArrowUpRight className="w-3 h-3" />
      </button>

    </div>
  );
}
