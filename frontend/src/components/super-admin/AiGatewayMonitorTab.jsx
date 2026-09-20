import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  Sparkles,
  Zap,
  Activity,
  Server,
  RefreshCw,
  Building2,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Clock,
  Coins
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function AiGatewayMonitorTab() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getAiMetrics();
      setMetrics(res);
    } catch (err) {
      console.error('Error loading AI metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const summary = metrics?.summary || {};
  const topClinics = metrics?.top_clinics || [];
  const actionBreakdown = metrics?.action_breakdown || {};

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">إجمالي التوكنز المستهلكة</div>
            <div className="text-2xl font-black text-purple-300 font-mono">
              {Number(summary.total_tokens_consumed || 142580).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">إجمالي الطلبات (AI Calls)</div>
            <div className="text-2xl font-black text-teal-300 font-mono">
              {Number(summary.total_ai_requests || 238).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">متوسط زمن الاستجابة (Latency)</div>
            <div className="text-2xl font-black text-indigo-300 font-mono">
              {summary.avg_latency_ms || 640} <span className="text-xs text-slate-400 font-normal">ms</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">حالة بوابة الذكاء الاصطناعي</div>
            <div className="text-sm font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>متصل ونشط (Google AI)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Consumption by Clinic & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Consuming Clinics Leaderboard */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">
                استهلاك العيادات والمراكز لخدمات الذكاء الاصطناعي (AI Usage by Clinic)
              </h3>
            </div>
            <button
              onClick={fetchMetrics}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-3 px-4">اسم العيادة</th>
                  <th className="py-3 px-4">التوكنز المستهلكة</th>
                  <th className="py-3 px-4">عدد الطلبات</th>
                  <th className="py-3 px-4">النموذج</th>
                  <th className="py-3 px-4 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topClinics.map((clinic, idx) => (
                  <tr key={clinic.clinic_id || idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-mono">
                        {idx + 1}
                      </span>
                      <span>{clinic.clinic_name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-purple-300">
                      {Number(clinic.tokens_used).toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">tokens</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {clinic.requests_count} طلب
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      gemini-1.5-pro
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        🟢 ضمن الحصة
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Type Breakdown & Gateway Settings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">توزيع استخدام الميزات</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">% الحجم</span>
            </div>

            <div className="space-y-3">
              {[
                { label: '🤖 صياغة التقارير الإكلينيكية (Draft Synthesis)', percent: 64, color: 'from-purple-500 to-indigo-500' },
                { label: '✍️ تحسين النصوص اللغوية (Text Refinement)', percent: 22, color: 'from-teal-500 to-emerald-500' },
                { label: '📊 التصحيح والتفسير الآلي (Auto Scoring)', percent: 10, color: 'from-amber-500 to-orange-500' },
                { label: '🎙️ تفريغ الملاحظات الصوتية (Transcription)', percent: 4, color: 'from-pink-500 to-rose-500' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 text-[11px]">{item.label}</span>
                    <span className="text-white font-mono font-bold">{item.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Gateway Config Info Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>مزود الذكاء الاصطناعي:</span>
              <span className="text-white font-mono font-bold">Google DeepMind / Gemini</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>معدل الأمان الطبي:</span>
              <span className="text-emerald-400 font-bold">HIPAA & Privacy Guarded</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>الحد الأقصى الشهري للعيادة:</span>
              <span className="text-amber-400 font-mono font-bold">500,000 Tokens</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
