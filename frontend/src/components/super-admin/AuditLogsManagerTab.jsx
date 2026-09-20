import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Search,
  RefreshCw,
  Filter,
  Download,
  Eye,
  Ban,
  Clock,
  User,
  Building2,
  Globe,
  Terminal,
  X,
  CheckCircle2,
  Trash2,
  Calendar,
  Lock,
  Radio,
  FileText,
  HelpCircle,
  Plus
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function AuditLogsManagerTab() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, total: 0, last_page: 1 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals & Active Items
  const [selectedLog, setSelectedLog] = useState(null);
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const [showBlockedIpsModal, setShowBlockedIpsModal] = useState(false);
  const [blockedIps, setBlockedIps] = useState([]);
  const [blockedIpsLoading, setBlockedIpsLoading] = useState(false);

  // New Block IP Form
  const [newBlockIp, setNewBlockIp] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [newBlockHours, setNewBlockHours] = useState('');
  const [blockActionLoading, setBlockActionLoading] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Overview Stats
  const fetchStats = async () => {
    try {
      const res = await superAdminApi.getAuditOverview();
      if (res && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load audit overview stats:', err);
    }
  };

  // Fetch Audit Logs
  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        search: searchTerm,
        severity: severityFilter !== 'ALL' ? severityFilter : '',
        event_type: eventTypeFilter !== 'ALL' ? eventTypeFilter : '',
        date_from: dateFrom,
        date_to: dateTo,
      };

      const res = await superAdminApi.getAuditLogs(params);
      if (res && res.data) {
        setLogs(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      showToast('فشل تحميل سجلات التدقيق', true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Blocked IPs
  const fetchBlockedIps = async () => {
    setBlockedIpsLoading(true);
    try {
      const res = await superAdminApi.getBlockedIps();
      if (res && res.blocked_ips) {
        setBlockedIps(res.blocked_ips);
      }
    } catch (err) {
      console.error('Failed to load blocked IPs:', err);
    } finally {
      setBlockedIpsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLogs(1);
  }, [severityFilter, eventTypeFilter, dateFrom, dateTo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  // Quick Block IP
  const handleQuickBlockIp = async (ip) => {
    const reason = window.prompt(`أدخل سبب حظر عنوان الـ IP [${ip}]:`, 'سلوك مشبوه أو محاولات دخول متكررة');
    if (!reason) return;

    try {
      const res = await superAdminApi.blockIp({ ip_address: ip, reason });
      showToast(res.message || `تم حظر ${ip} بنجاح!`);
      fetchStats();
      fetchLogs(pagination.current_page);
    } catch (err) {
      console.error('Block IP failed:', err);
      showToast(err.response?.data?.message || err.message || 'فشل حظر العنوان', true);
    }
  };

  // Manual Block from Modal
  const handleManualBlockSubmit = async (e) => {
    e.preventDefault();
    if (!newBlockIp.trim()) return;

    setBlockActionLoading(true);
    try {
      const res = await superAdminApi.blockIp({
        ip_address: newBlockIp.trim(),
        reason: newBlockReason.trim() || 'حظر يدوي من لوحة الأمان',
        expires_in_hours: newBlockHours ? Number(newBlockHours) : null,
      });
      showToast(res.message || 'تم حظر العنوان بنجاح!');
      setNewBlockIp('');
      setNewBlockReason('');
      setNewBlockHours('');
      fetchBlockedIps();
      fetchStats();
    } catch (err) {
      console.error('Block IP failed:', err);
      showToast(err.response?.data?.message || err.message || 'فشل حظر العنوان', true);
    } finally {
      setBlockActionLoading(false);
    }
  };

  // Unblock IP
  const handleUnblockIp = async (id, ip) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء حظر عنوان الـ IP [${ip}]؟`)) return;

    try {
      const res = await superAdminApi.unblockIp(id);
      showToast(res.message || 'تم إلغاء الحظر بنجاح!');
      fetchBlockedIps();
      fetchStats();
    } catch (err) {
      console.error('Unblock failed:', err);
      showToast(err.response?.data?.message || err.message || 'فشل إلغاء الحظر', true);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const params = {
      search: searchTerm,
      severity: severityFilter !== 'ALL' ? severityFilter : '',
      event_type: eventTypeFilter !== 'ALL' ? eventTypeFilter : '',
    };
    const url = superAdminApi.exportAuditLogsUrl(params);
    window.open(url, '_blank');
  };

  // Format Severity Badge
  const getSeverityBadge = (sev) => {
    const s = (sev || 'info').toLowerCase();
    switch (s) {
      case 'critical':
      case 'emergency':
        return {
          label: 'حرج 🔴',
          classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-black',
        };
      case 'warning':
        return {
          label: 'تحذير 🟡',
          classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold',
        };
      case 'info':
      default:
        return {
          label: 'معلومات 🔵',
          classes: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-medium',
        };
    }
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-black transition-all animate-bounce ${
            toastMessage.isError
              ? 'bg-rose-600 text-white border border-rose-400'
              : 'bg-emerald-600 text-white border border-emerald-400'
          }`}
        >
          {toastMessage.isError ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Overview Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>SECURITY & AUDIT TRAIL ENGINE</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
              Algerian Law 18-07 Compliant 🔒
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>🛡️ سجل التدقيق الجنائي والأمني الموحد</span>
          </h2>
          <p className="text-xs text-slate-400">
            توثيق كامل للعمليات الحساسة: انتحال الصفة (Impersonation)، محاولات الدخول، تعديل العيادات، وجدار حماية الـ IP
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              setShowBlockedIpsModal(true);
              fetchBlockedIps();
            }}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold transition flex items-center gap-2 border border-slate-700 shadow"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>جدار الحماية والعناوين المحظورة ({stats?.blocked_ips_count ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchLogs(pagination.current_page);
            }}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition shadow"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Today */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">حركات اليوم المسجلة</div>
            <div className="text-2xl font-black text-white font-mono">{stats?.total_today ?? '--'}</div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">إنذارات أمنية حرجة</div>
            <div className="text-2xl font-black text-rose-400 font-mono">{stats?.critical_count ?? 0}</div>
          </div>
        </div>

        {/* Impersonation Sessions */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">جلسات انتحال الصفة (Impersonation)</div>
            <div className="text-2xl font-black text-amber-300 font-mono">{stats?.impersonations_count ?? 0}</div>
          </div>
        </div>

        {/* Blocked IPs */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">العناوين المحظورة (IPs)</div>
            <div className="text-2xl font-black text-white font-mono">{stats?.blocked_ips_count ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Multi-Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالـ IP، اسم المستخدم، البريد، أو تفاصيل الحدث..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">كافة درجات الخطورة</option>
              <option value="critical">🔴 حرج وطوارئ (Critical / Red)</option>
              <option value="warning">🟡 تحذير (Warning)</option>
              <option value="info">🔵 معلوماتي وعادي (Info)</option>
            </select>
          </div>

          {/* Event Type Filter */}
          <div>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">كافة أنواع الأحداث</option>
              <option value="auth.impersonation_start">انتحال صفة (Impersonation)</option>
              <option value="security.ip_blocked">حظر أمني (IP Blocked)</option>
              <option value="system.pm2_restart">إعادة تشغيل خدمات PM2</option>
              <option value="system.cache_cleared">تفريغ الكاش الشامل</option>
            </select>
          </div>

          {/* Filter Submit Button */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="w-full py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>تطبيق الفلترة</span>
            </button>
            {(searchTerm || severityFilter !== 'ALL' || eventTypeFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSeverityFilter('ALL');
                  setEventTypeFilter('ALL');
                }}
                className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                title="إعادة تعيين الفلاتر"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Forensic Audit Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="p-4">التوقيت والتاريخ</th>
                <th className="p-4">درجة الخطورة</th>
                <th className="p-4">نوع الحدث</th>
                <th className="p-4">الوصف والبيان الجنائي</th>
                <th className="p-4">المستخدم الفاعل</th>
                <th className="p-4">العيادة المستهدفة</th>
                <th className="p-4">عنوان IP والمصدر</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                        <span>جارٍ تحميل سجلات التدقيق الجنائي...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto opacity-40 mb-2" />
                        <div className="text-sm font-bold text-slate-400">لا توجد سجلات تدقيق مطابقة لشروط الفلترة.</div>
                        <div className="text-xs text-slate-500">النظام آمن ومستقر ولا توجد حركات مشبوهة.</div>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getSeverityBadge(log.severity);
                  const isImpersonation = log.event_type?.includes('impersonation');

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isImpersonation ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-mono text-slate-300 text-xs">
                          {new Date(log.created_at).toLocaleTimeString('ar-DZ')}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(log.created_at).toLocaleDateString('ar-DZ')}
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] border ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Event Type */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
                          {log.event_type || log.action || 'system.activity'}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="p-4 max-w-xs sm:max-w-sm">
                        <div className="font-bold text-white text-xs leading-relaxed line-clamp-2">
                          {log.action_description || (log.action ? `${log.action} على ${log.auditable_type || 'السجل'} #${log.auditable_id || ''}` : 'إجراء نظام مسجل')}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-white text-xs">{log.user_name || 'غير معروف'}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {log.user_email || log.user_role || '--'}
                        </div>
                      </td>

                      {/* Target Tenant */}
                      <td className="p-4 whitespace-nowrap font-mono text-xs">
                        {log.tenant_id ? (
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ID: {log.tenant_id}
                          </span>
                        ) : (
                          <span className="text-slate-500">عام (النظام)</span>
                        )}
                      </td>

                      {/* IP Address */}
                      <td className="p-4 whitespace-nowrap font-mono text-xs">
                        <div className="text-slate-300 font-bold">{log.ip_address || '127.0.0.1'}</div>
                        {log.ip_address && log.ip_address !== '127.0.0.1' && (
                          <button
                            type="button"
                            onClick={() => handleQuickBlockIp(log.ip_address)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-0.5 mt-0.5"
                          >
                            <Ban className="w-2.5 h-2.5" />
                            <span>حظر الـ IP</span>
                          </button>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowPayloadModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 mx-auto"
                          title="عرض تفاصيل الحدث ومعطيات الـ Payload"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>تفاصيل</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.last_page > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              إجمالي السجلات: <strong className="text-white">{pagination.total}</strong> (صفحة {pagination.current_page} من {pagination.last_page})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fetchLogs(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold transition"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={() => fetchLogs(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.last_page}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold transition"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Event Details & Metadata Payload */}
      {showPayloadModal && selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">تفاصيل الحدث الجنائي ومعطيات الـ Payload</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPayloadModal(false);
                  setSelectedLog(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="text-slate-400 text-[11px]">بيان الحدث:</div>
                <div className="text-white font-bold text-sm">{selectedLog.action_description}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500">نوع الحدث:</span>{' '}
                  <strong className="text-indigo-300 font-mono">{selectedLog.event_type}</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500">المستوى:</span>{' '}
                  <strong className="text-white font-mono">{selectedLog.severity}</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500">عنوان IP:</span>{' '}
                  <strong className="text-white font-mono">{selectedLog.ip_address}</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500">التاريخ:</span>{' '}
                  <strong className="text-white font-mono">{new Date(selectedLog.created_at).toLocaleString('ar-DZ')}</strong>
                </div>
              </div>

              {selectedLog.user_agent && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[10.5px] text-slate-400 break-all text-left" dir="ltr">
                  <span className="text-slate-500 text-[10px] block">User Agent:</span>
                  {selectedLog.user_agent}
                </div>
              )}

              {/* Metadata JSON Viewer */}
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] font-bold">البيانات الإضافية (Metadata JSON):</span>
                <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto text-left max-h-56 custom-scrollbar" dir="ltr">
                  {selectedLog.metadata
                    ? JSON.stringify(selectedLog.metadata, null, 2)
                    : '// No extra metadata recorded for this action.'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPayloadModal(false);
                  setSelectedLog(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Blocked IPs Firewall Management */}
      {showBlockedIpsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-5 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-black text-white">إدارة جدار الحماية والعناوين المحظورة (IP Blacklist)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBlockedIpsModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Block Form */}
            <form onSubmit={handleManualBlockSubmit} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة عنوان IP جديد للحظر الفوري:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  value={newBlockIp}
                  onChange={(e) => setNewBlockIp(e.target.value)}
                  placeholder="مثال: 197.200.14.22"
                  required
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <input
                  type="text"
                  value={newBlockReason}
                  onChange={(e) => setNewBlockReason(e.target.value)}
                  placeholder="سبب الحظر (اختياري)"
                  className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={blockActionLoading}
                  className="py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>حظر الآن</span>
                </button>
              </div>
            </form>

            {/* Blocked IPs Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-3">عنوان IP</th>
                    <th className="p-3">سبب الحظر</th>
                    <th className="p-3">المشرف المسؤول</th>
                    <th className="p-3">تاريخ الحظر</th>
                    <th className="p-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {blockedIps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        {blockedIpsLoading ? 'جارٍ تحميل العناوين...' : 'لا توجد أي عناوين محظورة حالياً. جدار الحماية نظيف 🟢'}
                      </td>
                    </tr>
                  ) : (
                    blockedIps.map((ip) => (
                      <tr key={ip.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono text-rose-300 font-bold">{ip.ip_address}</td>
                        <td className="p-3 text-slate-300 max-w-xs truncate">{ip.reason || '--'}</td>
                        <td className="p-3 text-slate-400">{ip.blocked_by_name || 'Super Admin'}</td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">
                          {new Date(ip.created_at).toLocaleDateString('ar-DZ')}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleUnblockIp(ip.id, ip.ip_address)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[11px] font-bold transition flex items-center gap-1 mx-auto"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>فك الحظر</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowBlockedIpsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
