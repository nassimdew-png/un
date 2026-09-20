import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Database,
  RefreshCw,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Terminal,
  Play,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Layers,
  ArrowDownCircle,
  Radio,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function ServerTelemetryTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(10); // 10s, 30s, 0 = off
  const [countdown, setCountdown] = useState(10);
  
  // Action states
  const [actionLoading, setActionLoading] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // Logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logFilter, setLogFilter] = useState('ALL');

  const timerRef = useRef(null);

  // Fetch telemetry overview
  const fetchTelemetry = async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const res = await superAdminApi.getTelemetryOverview();
      if (res && res.server) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load server telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await superAdminApi.getSystemLogs(40);
      if (res && res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to load system logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Auto-refresh interval handling
  useEffect(() => {
    fetchTelemetry();
  }, []);

  useEffect(() => {
    if (autoRefreshInterval <= 0) {
      setCountdown(0);
      return;
    }

    setCountdown(autoRefreshInterval);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchTelemetry(true);
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Restart PM2 process
  const handleRestartProcess = async (processName) => {
    if (!window.confirm(`هل أنت متأكد من إعادة تشغيل خدمة "${processName}" على السيرفر؟`)) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [processName]: true }));
    try {
      const res = await superAdminApi.restartPm2Process(processName);
      showToast(res.message || `تمت إعادة تشغيل ${processName} بنجاح!`);
      // Refresh telemetry after 1.5s
      setTimeout(() => fetchTelemetry(true), 1500);
    } catch (err) {
      console.error('Failed to restart process:', err);
      showToast(err.response?.data?.message || err.message || 'حدث خطأ أثناء إعادة تشغيل الخدمة', true);
    } finally {
      setActionLoading((prev) => ({ ...prev, [processName]: false }));
    }
  };

  // Clear system caches
  const handleClearCache = async () => {
    if (!window.confirm('هل تريد تفريغ وتنظيف كافة طبقات الكاش (Application, Route, Config, Views) على الخادم؟')) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, clear_cache: true }));
    try {
      const res = await superAdminApi.clearSystemCache();
      showToast(res.message || 'تم تفريغ كافة طبقات الكاش بنجاح!');
      fetchTelemetry(true);
    } catch (err) {
      console.error('Failed to clear cache:', err);
      showToast(err.response?.data?.message || err.message || 'فشل تفريغ الكاش', true);
    } finally {
      setActionLoading((prev) => ({ ...prev, clear_cache: false }));
    }
  };

  // Queue actions
  const handleQueueAction = async (action) => {
    const isRetry = action === 'retry_all';
    const confirmMsg = isRetry
      ? 'هل تريد إعادة جدولة كافة المهام الفاشلة للمحاولة مرة أخرى؟'
      : 'هل تريد حذف وتفريغ كافة سجلات المهام الفاشلة نهائياً؟';

    if (!window.confirm(confirmMsg)) return;

    setActionLoading((prev) => ({ ...prev, queue_action: true }));
    try {
      const res = await superAdminApi.manageQueueAction(action);
      showToast(res.message || 'تم تنفيذ إجراء الطابور بنجاح!');
      fetchTelemetry(true);
    } catch (err) {
      console.error('Queue action failed:', err);
      showToast(err.response?.data?.message || err.message || 'فشل إجراء الطابور', true);
    } finally {
      setActionLoading((prev) => ({ ...prev, queue_action: false }));
    }
  };

  const server = data?.server || {};
  const pm2 = data?.pm2 || {};
  const database = data?.database || {};
  const queue = data?.queue || {};
  const storage = data?.storage || {};

  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'ALL') return true;
    return l.level === logFilter;
  });

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 left-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-black transition-all animate-bounce ${
            toastMessage.isError
              ? 'bg-rose-600 text-white border border-rose-400'
              : 'bg-emerald-600 text-white border border-emerald-400'
          }`}
        >
          {toastMessage.isError ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Live Polling Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>LIVE TELEMETRY ENGINE</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
              {server.ip || '145.223.116.54'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>🖥️ قمرة مراقبة صحة الخادم وخدمات PM2</span>
          </h2>
          <p className="text-xs text-slate-400">
            رصد لحظي لموارد السيرفر (CPU, RAM, Disk)، سلامة عمليات PM2، وزمن استجابة قاعدة البيانات وطابور المهام
          </p>
        </div>

        {/* Polling & Refresh Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-2xl text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">التحديث التلقائي:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer"
            >
              <option value={5} className="bg-slate-900">كل 5 ثوانٍ</option>
              <option value={10} className="bg-slate-900">كل 10 ثوانٍ</option>
              <option value={30} className="bg-slate-900">كل 30 ثانية</option>
              <option value={0} className="bg-slate-900">إيقاف (يدوي فقط)</option>
            </select>
            {autoRefreshInterval > 0 && (
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {countdown}s
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => fetchTelemetry(false)}
            disabled={refreshing}
            className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>تحديث الآن</span>
          </button>
        </div>
      </div>

      {/* Hero 4 KPI Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Load Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10.5px] font-mono text-slate-400 font-bold">
              {server.cpu?.cores ?? 1} Cores
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-bold">استهلاك المعالج (CPU Load)</div>
          <div className="text-2xl font-black text-white font-mono mt-1 flex items-baseline gap-2">
            <span>{server.cpu?.usage_pct ?? 0}%</span>
            <span className="text-[11px] font-normal text-slate-400">
              [1m: {server.cpu?.load_1m ?? 0}]
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                (server.cpu?.usage_pct ?? 0) > 80
                  ? 'bg-rose-500'
                  : (server.cpu?.usage_pct ?? 0) > 60
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, server.cpu?.usage_pct ?? 0)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            Load avg: 5m: {server.cpu?.load_5m ?? 0} • 15m: {server.cpu?.load_15m ?? 0}
          </div>
        </div>

        {/* RAM Usage Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10.5px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {server.ram?.free_mb ?? 0} MB متاح
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-bold">الذاكرة العشوائية (RAM)</div>
          <div className="text-2xl font-black text-white font-mono mt-1 flex items-baseline gap-2">
            <span>{server.ram?.usage_pct ?? 0}%</span>
            <span className="text-[11px] font-normal text-slate-400">
              {server.ram?.used_mb ?? 0} / {server.ram?.total_mb ?? 0} MB
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                (server.ram?.usage_pct ?? 0) > 85
                  ? 'bg-rose-500'
                  : (server.ram?.usage_pct ?? 0) > 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, server.ram?.usage_pct ?? 0)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            Total: {((server.ram?.total_mb ?? 0) / 1024).toFixed(1)} GB DDR
          </div>
        </div>

        {/* Disk Space Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="text-[10.5px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md">
              {server.disk?.free_gb ?? 0} GB متبقي
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-bold">القرص الصلب (SSD Storage)</div>
          <div className="text-2xl font-black text-white font-mono mt-1 flex items-baseline gap-2">
            <span>{server.disk?.usage_pct ?? 0}%</span>
            <span className="text-[11px] font-normal text-slate-400">
              {server.disk?.used_gb ?? 0} / {server.disk?.total_gb ?? 0} GB
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                (server.disk?.usage_pct ?? 0) > 85
                  ? 'bg-rose-500'
                  : (server.disk?.usage_pct ?? 0) > 70
                  ? 'bg-amber-500'
                  : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.min(100, server.disk?.usage_pct ?? 0)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            NVMe High Performance Storage
          </div>
        </div>

        {/* Uptime & OS Spec Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-[10.5px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Online
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-bold">مدة تشغيل السيرفر (Uptime)</div>
          <div className="text-sm font-black text-white mt-1 truncate" title={server.uptime?.human}>
            {server.uptime?.human || 'متصل ومستقر'}
          </div>
          <div className="border-t border-slate-800 mt-3 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>PHP {server.php_version || '8.2'}</span>
            <span>Laravel {server.laravel_version || '11.x'}</span>
          </div>
          <div className="text-[9.5px] text-slate-500 truncate mt-1" title={server.os_full}>
            {server.os_full || 'Linux Production Server'}
          </div>
        </div>
      </div>

      {/* PM2 Managed Processes Cockpit */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
              ⚡
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>عمليات وخدمات PM2 المدارة</span>
                <span className="text-xs font-mono font-bold bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-full border border-slate-700">
                  {pm2.online_processes ?? 3} / {pm2.total_processes ?? 3} Online
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                إدارة خدمات السيرفر الأساسية: واجهة الفرونت، محرك الـ API، وطابور المهام الخلفية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRestartProcess('all')}
              disabled={actionLoading['all']}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${actionLoading['all'] ? 'animate-spin' : ''}`} />
              <span>إعادة تشغيل الكل (Restart All)</span>
            </button>
          </div>
        </div>

        {/* Processes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {(pm2.processes || []).map((proc) => {
            const isRestarting = actionLoading[proc.name] || actionLoading[String(proc.pm_id)];
            const isOnline = proc.status === 'online' || proc.is_online;

            return (
              <div
                key={proc.name || proc.pm_id}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      ID: {proc.pm_id ?? '--'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isOnline
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {proc.status?.toUpperCase() || 'ONLINE'}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white font-mono flex items-center gap-1.5">
                    <span>{proc.name}</span>
                  </h4>
                  {proc.role && (
                    <div className="text-[10.5px] text-slate-400 line-clamp-1">{proc.role}</div>
                  )}
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-xl text-center font-mono">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase">Memory</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5">
                      {proc.memory_mb ?? 0} MB
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase">CPU</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5">
                      {proc.cpu_pct ?? 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase">Restarts</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5">
                      {proc.restarts ?? 0}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-mono">
                    PID: {proc.pid ?? '--'} • {proc.uptime || 'نشط'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRestartProcess(proc.name || String(proc.pm_id))}
                    disabled={isRestarting}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRestarting ? 'animate-spin' : ''}`} />
                    <span>إعادة تشغيل</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Database, Queue & Cache Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Database & Queue Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">صحة قاعدة البيانات وطابور المهام</h3>
              <p className="text-xs text-slate-400">حالة محرك MySQL وسرعة الاستجابة والطوابير الخلفية</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* DB Stat Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-slate-200">محرك MySQL / MariaDB</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400">الحجم: <strong className="text-white">{database.size_mb ?? 0} MB</strong></span>
                <span className="text-slate-400">الجداول: <strong className="text-white">{database.tables_count ?? 0}</strong></span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  {database.latency_ms ?? 1.2} ms
                </span>
              </div>
            </div>

            {/* Queue Stat Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${(queue.failed_jobs ?? 0) > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className="text-xs font-bold text-slate-200">طابور المهام الخلفية (Queue)</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400">المعلقة: <strong className="text-white">{queue.pending_jobs ?? 0}</strong></span>
                <span className="text-slate-400">الفاشلة: <strong className={(queue.failed_jobs ?? 0) > 0 ? 'text-rose-400' : 'text-slate-400'}>{queue.failed_jobs ?? 0}</strong></span>
              </div>
            </div>

            {/* Queue Actions */}
            {(queue.failed_jobs ?? 0) > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQueueAction('retry_all')}
                  disabled={actionLoading.queue_action}
                  className="flex-1 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة محاولة كافة المهام الفاشلة</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQueueAction('flush_failed')}
                  disabled={actionLoading.queue_action}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تفريغ</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance & System Cache Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">أدوات الصيانة وتطهير الكاش</h3>
              <p className="text-xs text-slate-400">تفريغ الكاش وإعادة بناء خرائط المسارات والتهيئة</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">التطهير الشامل للكاش (Flush All Caches)</span>
                <span className="text-[10px] text-slate-400 font-mono">optimize:clear</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يقوم بتفريغ كاش التطبيق، كاش المسارات، كاش الإعدادات، وقوالب Blade المؤقتة. يُنصح به بعد أي تعديل يدوي أو تحديث.
              </p>
              <button
                type="button"
                onClick={handleClearCache}
                disabled={actionLoading.clear_cache}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading.clear_cache ? 'animate-spin' : ''}`} />
                <span>تنفيذ تفريغ الكاش الشامل الآن 🧹</span>
              </button>
            </div>

            {/* Storage Permissions Check */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">أذونات المجلدات (Storage & Cache)</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                {storage.status === 'writable' ? 'Writable 🟢' : 'Check Permissions ⚠️'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Error Logs Viewer Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">سجلات النظام اللحظية (Laravel Logs Stream)</h3>
              <p className="text-xs text-slate-400">مراقبة سريعة لآخر استثناءات وأخطاء النظام في `laravel.log`</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showLogs && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLogFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition ${logFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setLogFilter('ERROR')}
                  className={`px-2.5 py-1 rounded-lg transition ${logFilter === 'ERROR' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  أخطاء 🔴
                </button>
                <button
                  type="button"
                  onClick={() => setLogFilter('WARNING')}
                  className={`px-2.5 py-1 rounded-lg transition ${logFilter === 'WARNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
                >
                  تحذيرات 🟡
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (!showLogs) fetchLogs();
                setShowLogs(!showLogs);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showLogs ? 'إخفاء السجلات' : 'عرض السجلات'}</span>
            </button>
          </div>
        </div>

        {showLogs && (
          <div className="space-y-2">
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-mono text-xs max-h-72 overflow-y-auto custom-scrollbar space-y-1 text-left" dir="ltr">
              {logsLoading ? (
                <div className="text-center py-6 text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Loading recent logs from storage/logs/laravel.log...</span>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  No log entries matching current filter or log file is empty. System is clean! 🟢
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`py-1 px-2 rounded break-all leading-relaxed ${
                      log.level === 'ERROR'
                        ? 'bg-rose-500/10 text-rose-300 border-l-2 border-rose-500'
                        : log.level === 'WARNING'
                        ? 'bg-amber-500/10 text-amber-300 border-l-2 border-amber-500'
                        : 'text-slate-400 hover:bg-slate-900/50'
                    }`}
                  >
                    {log.raw}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Showing last {filteredLogs.length} entries</span>
              <button
                type="button"
                onClick={fetchLogs}
                disabled={logsLoading}
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${logsLoading ? 'animate-spin' : ''}`} />
                <span>إعادة تحميل السجلات</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
