import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HardDrive,
  Brain,
  Sliders,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Save,
  X,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function QuotasAndLimitsTab() {
  const { t } = useTranslation();
  const [clinics, setClinics] = useState([]);
  const [summary, setSummary] = useState({ total_storage_used_mb: 0, total_ai_tokens_used: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [editStorageMb, setEditStorageMb] = useState(2048);
  const [editAiTokens, setEditAiTokens] = useState(100000);
  const [savingQuota, setSavingQuota] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchQuotas = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getClinicQuotas();
      if (res.success) {
        setClinics(res.clinics || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load clinic quotas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotas();
  }, []);

  const openEditModal = (clinic) => {
    setSelectedClinic(clinic);
    setEditStorageMb(clinic.max_storage_mb || 2048);
    setEditAiTokens(clinic.max_ai_tokens_monthly || 100000);
    setFeedback(null);
  };

  const handleSaveQuotas = async (e) => {
    e?.preventDefault();
    if (!selectedClinic) return;
    setSavingQuota(true);
    setFeedback(null);
    try {
      const res = await superAdminApi.updateClinicQuotas(selectedClinic.id, {
        max_storage_mb: parseInt(editStorageMb, 10),
        monthly_ai_token_limit: parseInt(editAiTokens, 10),
      });
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'تم تحديث سقف الحصص بنجاح.' });
        fetchQuotas();
        setTimeout(() => {
          setSelectedClinic(null);
        }, 1200);
      } else {
        setFeedback({ type: 'error', text: res.message || 'فشل التحديث.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'خطأ أثناء التحديث.' });
    } finally {
      setSavingQuota(false);
    }
  };

  const filteredClinics = clinics.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">إدارة الحصص التخزينية ومعدل الذكاء الاصطناعي (Storage & AI Quotas)</h2>
          </div>
          <p className="text-xs text-slate-400">
            مراقبة وتحديد السعة التخزينية المخصصة لكل عيادة (وثائق، تسجيلات صوتية) وسقف استهلاك رموز الذكاء الاصطناعي الشهري.
          </p>
        </div>

        <button
          onClick={fetchQuotas}
          className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 self-start lg:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث القياسات</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي التخزين المستهلك عبر المنصة</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {summary.total_storage_used_mb} <span className="text-xs font-normal text-slate-400">MB</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ~ {((summary.total_storage_used_mb || 0) / 1024).toFixed(2)} GB من السعة الكلية
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">استهلاك رموز الذكاء الاصطناعي هذا الشهر</span>
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">
            {Number(summary.total_ai_tokens_used || 0).toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">رمز / Tokens</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">توليد تقارير إكلينيكية، تلخيص وتوصيات</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">العيادات الخاضعة للمراقبة</span>
            <Building2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-300 font-mono">
            {clinics.length} <span className="text-xs font-normal text-slate-400">عيادة ومستأجر</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">حماية الخادم ضد استنزاف الموارد</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="البحث باسم العيادة أو النطاق..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-9 pl-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Clinics Quotas Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold">
                <th className="py-4 px-6">العيادة</th>
                <th className="py-4 px-6">الخطة الحالية</th>
                <th className="py-4 px-6">سعة التخزين (Storage Quota)</th>
                <th className="py-4 px-6">حصة الذكاء الاصطناعي (AI Tokens / شهر)</th>
                <th className="py-4 px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                    <span>جاري تحميل حصص العيادات...</span>
                  </td>
                </tr>
              ) : filteredClinics.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    لا توجد عيادات مطابقة
                  </td>
                </tr>
              ) : (
                filteredClinics.map((c) => {
                  const storageHigh = c.storage_used_percent >= 80;
                  const aiHigh = c.ai_tokens_used_percent >= 80;
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span>{c.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{c.subdomain}.psypro.tech</div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {c.plan_name}
                        </span>
                      </td>

                      {/* Storage Bar */}
                      <td className="py-4 px-6 min-w-[200px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300 font-bold">{c.used_storage_mb} MB</span>
                            <span className="text-slate-500">من أصل {c.max_storage_mb} MB</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                storageHigh
                                  ? 'bg-rose-500'
                                  : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                              }`}
                              style={{ width: `${Math.min(100, c.storage_used_percent)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono text-left">
                            {c.storage_used_percent}% مستخدم
                          </div>
                        </div>
                      </td>

                      {/* AI Tokens Bar */}
                      <td className="py-4 px-6 min-w-[200px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-purple-300 font-bold">
                              {Number(c.tokens_used_this_month).toLocaleString()}
                            </span>
                            <span className="text-slate-500">/ {Number(c.max_ai_tokens_monthly).toLocaleString()}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                aiHigh ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-indigo-400'
                              }`}
                              style={{ width: `${Math.min(100, c.ai_tokens_used_percent)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-purple-400 font-mono text-left">
                            {c.ai_tokens_used_percent}% مستهلك
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => openEditModal(c)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold transition flex items-center gap-1.5 mx-auto border border-slate-700 text-xs"
                        >
                          <Sliders className="w-3.5 h-3.5 text-amber-400" />
                          <span>تعديل الحصص</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Quotas Modal */}
      {selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">تعديل سقف الحصص والموارد</h3>
                <div className="text-xs text-slate-400 mt-0.5">{selectedClinic.name} ({selectedClinic.subdomain})</div>
              </div>
              <button
                onClick={() => setSelectedClinic(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedback && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuotas} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">الحد الأقصى للتخزين (Max Storage in MB):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="100"
                    max="500000"
                    step="100"
                    value={editStorageMb}
                    onChange={(e) => setEditStorageMb(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                  <span className="text-slate-400 font-mono">MB (~ {(editStorageMb / 1024).toFixed(1)} GB)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">سقف رموز الذكاء الاصطناعي الشهري (Monthly AI Tokens):</label>
                <input
                  type="number"
                  min="1000"
                  max="10000000"
                  step="10000"
                  value={editAiTokens}
                  onChange={(e) => setEditAiTokens(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClinic(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingQuota}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingQuota ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
