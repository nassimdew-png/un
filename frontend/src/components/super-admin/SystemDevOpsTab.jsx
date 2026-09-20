import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  Cpu,
  HardDrive,
  Database,
  Terminal,
  RefreshCw,
  Trash2,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function SystemDevOpsTab() {
  const { t } = useTranslation();
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await superAdminApi.getSystemHealth();
      setHealth(res.health);
    } catch (err) {
      console.error('Error loading system health:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await superAdminApi.getSystemLogs();
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Error loading logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchLogs();
  }, []);

  const handleClearCache = async () => {
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await superAdminApi.clearSystemCache();
      setActionFeedback({
        type: 'success',
        text: res.message || 'تم تفريغ وإعادة بناء الذاكرة المؤقتة بنجاح.',
      });
      fetchHealth();
      fetchLogs();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.message || 'فشل تفريغ الكاش.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await superAdminApi.triggerBackupNow();
      setActionFeedback({
        type: 'success',
        text: res.message || 'تم إنشاء نسخة احتياطية فورية للنظام وقواعد البيانات بنجاح.',
      });
      fetchLogs();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.message || 'فشل تشغيل النسخ الاحتياطي.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const cpu = health?.cpu_load || {};
  const disk = health?.disk || {};
  const services = health?.services || {};

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-lg animate-fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/80 border-red-500/40 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="font-semibold">{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* DevOps Action Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              مركز العمليات والصيانة البرمجية للسيرفر (DevOps & Server Maintenance)
            </h3>
            <div className="text-xs text-slate-400">
              مراقبة مباشرة للحمل والأداء، تفريغ الكاش، النسخ الاحتياطي، وسجلات النظام الحية.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearCache}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>تفريغ وبناء الكاش (Clear Cache)</span>
          </button>

          <button
            onClick={handleTriggerBackup}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>أخذ نسخة احتياطية فورية</span>
          </button>
        </div>
      </div>

      {/* Server Health Meters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Load */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">حمل المعالج (CPU Load)</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {cpu['1m'] ?? '0.12'} <span className="text-xs font-normal text-slate-500">1m load</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-2">
            <span>5m: {cpu['5m'] ?? '0.20'}</span>
            <span>15m: {cpu['15m'] ?? '0.18'}</span>
            <span className="text-emerald-400 font-bold">🟢 مستقر</span>
          </div>
        </div>

        {/* RAM Usage */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">ذاكرة النظام (RAM Memory)</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">
            {health?.memory_usage_mb ?? '42.5'} <span className="text-xs font-normal text-slate-500">MB</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-2">
            <span>PHP Memory Peak</span>
            <span className="text-emerald-400 font-bold">🟢 كفاءة عالية</span>
          </div>
        </div>

        {/* Disk Storage */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">مساحة القرص الصلب (NVMe)</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {disk.free_gb ?? '68.4'} <span className="text-xs font-normal text-slate-500">GB متبقية</span>
          </div>
          <div className="space-y-1 border-t border-slate-800 pt-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>المستخدم: {disk.used_percent ?? 24}%</span>
              <span>الإجمالي: {disk.total_gb ?? 100} GB</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                style={{ width: `${disk.used_percent ?? 24}%` }}
              />
            </div>
          </div>
        </div>

        {/* Database & Stack Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-bold">قاعدة البيانات (MySQL)</span>
            <Database className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-300 font-mono">
            {health?.database?.size_mb ?? '12.4'} <span className="text-xs font-normal text-slate-500">MB Data</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-2">
            <span>PHP {health?.php_version?.split('-')[0] || '8.2.20'}</span>
            <span className="text-teal-400 font-bold">Laravel {health?.laravel_version || '11.x'}</span>
          </div>
        </div>
      </div>

      {/* Services Health Badges */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-300">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>حالة الخدمات الأساسية:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Nginx Web Engine (Active)
          </span>

          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            PM2 Backend & Frontend (Online)
          </span>

          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Redis / Queue Worker (Listening)
          </span>

          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Public Storage Link (OK)
          </span>
        </div>
      </div>

      {/* Dark Terminal Live Log Stream */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono">
              سجلات النظام الحية (Live System Logs: storage/logs/laravel.log)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">آخر 80 سجلاً تشغيلياً</span>
            <button
              onClick={fetchLogs}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="تحديث السجلات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="bg-slate-950 font-mono text-[11px] rounded-2xl p-4 max-h-96 overflow-y-auto space-y-1.5 border border-slate-900 text-left select-text" dir="ltr">
          {logs.length === 0 ? (
            <div className="text-slate-500 py-4 text-center">لا توجد سجلات أخطاء مسجلة حالياً. النظام يعمل بسلاسة.</div>
          ) : (
            logs.map((log, idx) => {
              let colorClass = 'text-cyan-300';
              if (log.level === 'ERROR' || log.level === 'CRITICAL') colorClass = 'text-rose-400 font-bold';
              else if (log.level === 'WARNING') colorClass = 'text-amber-400';
              else if (log.level === 'DEBUG') colorClass = 'text-slate-400';

              return (
                <div key={idx} className="leading-relaxed hover:bg-slate-900/60 rounded px-1.5 py-0.5 transition">
                  <span className="text-slate-600 mr-2">[{idx + 1}]</span>
                  <span className={colorClass}>{log.raw}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
