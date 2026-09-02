import React, { useState, useEffect } from 'react';
import {
  Globe,
  ShieldCheck,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Lock,
  Search,
  Server,
  Trash2,
  Zap,
  Check,
  Copy
} from 'lucide-react';
import { customDomainsApi, superAdminApi } from '../../api';

export default function CustomDomainsTab() {
  const [domains, setDomains] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [serverIp, setServerIp] = useState('145.223.116.54');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState({ clinic_id: '', domain: '' });
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const [res, clinicsRes] = await Promise.all([
        customDomainsApi.getGlobalDomains({ search, status: statusFilter }),
        superAdminApi.getClinics(),
      ]);

      if (res.success) {
        setDomains(res.domains || res.data || []);
        if (res.server_ip) setServerIp(res.server_ip);
        if (res.stats) setStats(res.stats);
      }
      setClinics(clinicsRes.clinics || clinicsRes.data || []);
    } catch (err) {
      console.error('Failed to load custom domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, [search, statusFilter]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleForceRenew = async (domainObj) => {
    setActionLoadingId(domainObj.id);
    setFeedback(null);
    try {
      const res = await customDomainsApi.forceRenewDomain(domainObj.id);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'تم تجديد شهادة SSL وتحديث الإعدادات بنجاح!' });
        fetchDomains();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تجديد شهادة SSL.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (domainObj) => {
    if (!window.confirm(`هل أنت متأكد من حذف النطاق (${domainObj.domain}) وإلغاء إعدادات التوجيه؟`)) {
      return;
    }

    setActionLoadingId(domainObj.id);
    setFeedback(null);
    try {
      const res = await customDomainsApi.deleteGlobalDomain(domainObj.id);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'تم حذف النطاق بنجاح.' });
        fetchDomains();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حذف النطاق.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newDomain.clinic_id || !newDomain.domain) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await customDomainsApi.addClinicDomain(newDomain.domain);
      if (res.success) {
        setFeedback({ type: 'success', text: 'تم تسجيل النطاق بنجاح!' });
        setShowAddModal(false);
        setNewDomain({ clinic_id: '', domain: '' });
        fetchDomains();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل إضافة النطاق.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">إدارة النطاقات المخصصة وشهادات الأمان (Custom Domains & SSL Engine)</h2>
            <p className="text-xs text-slate-400">
              مراقبة النطاقات المستقلة للعيادات، التحقق من توجيه الـ DNS، وإصدار شهادات Let's Encrypt تلقائياً
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchDomains}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Feedback Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center space-x-3 space-x-reverse transition ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 2. Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">إجمالي النطاقات</div>
            <div className="text-xl font-black text-white font-mono">{stats?.total ?? domains.length}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">شهادات SSL نشطة</div>
            <div className="text-xl font-black text-emerald-400 font-mono">
              {stats?.ssl_active ?? domains.filter((d) => d.status === 'ssl_active').length}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">في انتظار توجيه DNS</div>
            <div className="text-xl font-black text-amber-400 font-mono">
              {stats?.pending_dns ?? domains.filter((d) => d.status === 'pending_dns').length}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">IP السيرفر المطلوب</div>
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-indigo-300">
              <span>{serverIp}</span>
              <button
                type="button"
                onClick={() => handleCopy(serverIp, 'super-ip')}
                className="text-slate-500 hover:text-white transition"
                title="نسخ IP"
              >
                {copiedKey === 'super-ip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث باسم النطاق أو العيادة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold focus:outline-none focus:border-cyan-500"
        >
          <option value="">جميع الحالات</option>
          <option value="ssl_active">نشط ومشفر (SSL Active)</option>
          <option value="dns_verified">DNS موجه (جاهز للـ SSL)</option>
          <option value="pending_dns">في انتظار انتشار الـ DNS</option>
          <option value="failed">فشل الإصدار</option>
        </select>
      </div>

      {/* 4. Global Domains Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
            <span className="text-xs">جاري تحميل النطاقات...</span>
          </div>
        ) : domains.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Globe className="w-10 h-10 text-slate-700 mx-auto" />
            <div className="text-sm font-bold text-slate-300">لا توجد نطاقات مخصصة مسجلة حالياً</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              يمكن لأصحاب العيادات ربط نطاقاتهم الخاصة عبر لوحة إعدادات العيادة أو يمكنك إضافتها يدوياً.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-4">النطاق والعيادة</th>
                  <th className="py-3 px-4">حالة الـ DNS</th>
                  <th className="py-3 px-4">حالة شهادة SSL</th>
                  <th className="py-3 px-4">تاريخ الانتهاء</th>
                  <th className="py-3 px-4 text-center">إجراءات السوبر أدمن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {domains.map((dom) => {
                  const isVerified = dom.status === 'dns_verified' || dom.status === 'ssl_active';
                  const isSslActive = dom.status === 'ssl_active';
                  const isPending = dom.status === 'pending_dns';

                  return (
                    <tr key={dom.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="font-mono font-black text-sm text-white">{dom.domain}</span>
                          {isSslActive && (
                            <a
                              href={`https://${dom.domain}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          العيادة: <span className="text-slate-200 font-bold">{dom.tenant?.name || dom.clinic?.name || dom.clinic_id}</span>
                          {dom.tenant?.subdomain && (
                            <span className="text-slate-500 font-mono text-[10px] mr-1">({dom.tenant.subdomain}.psypro.tech)</span>
                          )}
                        </div>
                        {dom.error_message && (
                          <div className="text-[11px] text-rose-400 truncate max-w-sm mt-0.5" title={dom.error_message}>
                            خطأ: {dom.error_message}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>موجه بنجاح</span>
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>في انتظار DNS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>غير مطابق</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {isSslActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[11px]">
                            <Lock className="w-3.5 h-3.5" />
                            <span>نشط ومشفر (HTTPS)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>غير مفعل</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-300 text-[11px]">
                        {dom.ssl_expires_at ? new Date(dom.ssl_expires_at).toLocaleDateString('ar-DZ') : '--'}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleForceRenew(dom)}
                            disabled={actionLoadingId === dom.id}
                            className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white font-bold text-[11px] transition border border-cyan-500/30 disabled:opacity-50"
                            title="إعادة إصدار / تجديد SSL إجبارياً"
                          >
                            <RefreshCw className={`w-3 h-3 ${actionLoadingId === dom.id ? 'animate-spin' : ''}`} />
                            <span>تجديد إجباري</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(dom)}
                            disabled={actionLoadingId === dom.id}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white transition border border-rose-500/20"
                            title="حذف النطاق من المنصة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
