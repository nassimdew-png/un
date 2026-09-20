import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auditLogApi } from '../api';
import { 
  History, 
  Search, 
  Filter, 
  Eye, 
  X, 
  User, 
  Clock, 
  Globe, 
  ShieldCheck, 
  PlusCircle, 
  Edit, 
  Trash2, 
  FileText,
  Calendar
} from 'lucide-react';

export default function AuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Modal Diff
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.auditable_type = entityFilter;
      if (dateFilter) {
        params.start_date = dateFilter;
        params.date = dateFilter;
      }
      try {
        params.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (e) {}

      const res = await auditLogApi.list(params);
      setLogs(res.data || []);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter, dateFilter]);

  // Debounced search to auto-refresh when search is typed or cleared
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'create':
        return {
          label: t('audit.action_create', 'إضافة / إنشاء'),
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: PlusCircle,
        };
      case 'update':
        return {
          label: t('audit.action_update', 'تعديل'),
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: Edit,
        };
      case 'delete':
        return {
          label: t('audit.action_delete', 'حذف'),
          color: 'bg-red-500/20 text-red-300 border-red-500/30',
          icon: Trash2,
        };
      case 'export_pdf':
        return {
          label: t('audit.action_export', 'تصدير'),
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: FileText,
        };
      case 'auth.impersonation_start':
      case 'impersonation':
      case 'impersonate':
        return {
          label: t('audit.action_impersonation', 'جلسة دعم فني (انتحال صفة)'),
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: ShieldCheck,
        };
      case 'auth.impersonation_end':
        return {
          label: t('audit.action_impersonation_end', 'إنهاء جلسة الدعم'),
          color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          icon: ShieldCheck,
        };
      default:
        return {
          label: action,
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: History,
        };
    }
  };

  const getEntityLabel = (type) => {
    switch (type) {
      case 'Tenant':
      case 'Clinic':
        return t('audit.entity_clinic', 'العيادة (Tenant)');
      case 'Patient':
        return t('audit.entity_patient', 'المريض');
      case 'ClinicalAssessment':
      case 'Assessment':
        return t('audit.entity_assessment', 'الحصيلة / التقييم');
      case 'Invoice':
        return t('audit.entity_invoice', 'الفاتورة');
      case 'TherapySession':
      case 'Session':
        return t('audit.entity_session', 'الجلسة');
      case 'Appointment':
        return t('audit.entity_appointment', 'الموعد');
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2 space-x-reverse">
            <History className="w-6 h-6 text-brand-400" />
            <span>{t('audit.title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('audit.subtitle')}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder={t('audit.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">{t('audit.all_actions', 'كافة العمليات')}</option>
            <option value="create">{t('audit.action_create', 'إضافة / إنشاء')}</option>
            <option value="update">{t('audit.action_update', 'تعديل')}</option>
            <option value="delete">{t('audit.action_delete', 'حذف')}</option>
            <option value="export_pdf">{t('audit.action_export', 'تصدير')}</option>
            <option value="auth.impersonation_start">{t('audit.action_impersonation', 'جلسة دعم فني (انتحال صفة)')}</option>
            <option value="auth.impersonation_end">{t('audit.action_impersonation_end', 'إنهاء جلسة الدعم')}</option>
          </select>
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">{t('audit.all_entities', 'كافة السجلات')}</option>
            <option value="Patient">{t('audit.entity_patient', 'المريض')}</option>
            <option value="ClinicalAssessment">{t('audit.entity_assessment', 'الحصيلة / التقييم')}</option>
            <option value="TherapySession">{t('audit.entity_session', 'الجلسة')}</option>
            <option value="Invoice">{t('audit.entity_invoice', 'الفاتورة')}</option>
            <option value="Tenant">{t('audit.entity_clinic', 'العيادة (Tenant)')}</option>
          </select>
        </div>

        <div className="relative flex items-center">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              title={t('common.clear', 'مسح التاريخ')}
              className="absolute left-2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">{t('audit.col_timestamp', 'التاريخ والتوقيت')}</th>
                <th className="px-5 py-3.5">{t('audit.col_user', 'المستخدم والبريد')}</th>
                <th className="px-5 py-3.5">{t('audit.col_action', 'العملية')}</th>
                <th className="px-5 py-3.5">{t('audit.col_target', 'الهدف')}</th>
                <th className="px-5 py-3.5">{t('audit.col_ip', 'عنوان IP')}</th>
                <th className="px-5 py-3.5 text-left">{t('common.actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    {t('common.loading', 'جاري التحميل...')}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    {t('audit.no_logs', 'لا توجد سجلات تدقيق مطابقة')}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono text-slate-200">
                        <div className="font-bold flex items-center space-x-1.5 space-x-reverse text-brand-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--'}</span>
                        </div>
                        <div className="text-slate-400 mt-0.5">
                          {log.created_at ? new Date(log.created_at).toLocaleDateString('fr-FR') : '--'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-white flex items-center space-x-2 space-x-reverse">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 text-xs">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold">{log.user_name || log.user?.name || 'Système'}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{log.user?.email || log.user_email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <span className={`inline-flex items-center space-x-1.5 space-x-reverse px-2.5 py-1 rounded-xl text-[11px] font-bold border ${badge.color}`}>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <div className="font-semibold text-slate-200">
                          {getEntityLabel(log.auditable_type)}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: #{log.auditable_id || '---'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs font-mono text-slate-400">
                        <div className="flex items-center space-x-1.5 space-x-reverse">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span>{log.ip_address || '127.0.0.1'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-left">
                        {(log.old_values || log.new_values) && (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 border border-brand-500/30 text-xs font-semibold flex items-center space-x-1.5 space-x-reverse transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('audit.view_diff')}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {t('audit.diff_title')} - {getEntityLabel(selectedLog.auditable_type)} #{selectedLog.auditable_id}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedLog.user_name} &bull; {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Old Values */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1 space-x-reverse">
                    <span>{t('audit.old_values')}</span>
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-red-500/20 text-xs text-slate-300 font-mono overflow-x-auto max-h-64 whitespace-pre-wrap">
                    {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : t('audit.no_old_values')}
                  </div>
                </div>

                {/* New Values */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1 space-x-reverse">
                    <span>{t('audit.new_values')}</span>
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/20 text-xs text-slate-300 font-mono overflow-x-auto max-h-64 whitespace-pre-wrap">
                    {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : t('audit.no_new_values')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
