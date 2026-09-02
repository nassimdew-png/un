import React, { useState, useEffect } from 'react';
import {
  PieChart,
  RefreshCw,
  Edit2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Save,
  X,
  Sparkles,
  Zap
} from 'lucide-react';
import { clinicQuotaApi } from '../../api';

export default function ClinicQuotasManagerTab() {
  const [quotas, setQuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Edit Clinic Quota Modal
  const [selectedQuota, setSelectedQuota] = useState(null);
  const [editForm, setEditForm] = useState({
    plan_name: 'pro',
    monthly_reports_limit: 50,
    monthly_transcribe_mins_limit: 60,
    monthly_images_limit: 30,
    monthly_podcasts_limit: 5,
    monthly_videos_limit: 3,
    monthly_documents_limit: 20,
  });
  const [saving, setSaving] = useState(false);

  const loadQuotas = async () => {
    setLoading(true);
    try {
      const res = await clinicQuotaApi.getSuperAdminQuotas();
      if (res.success && res.quotas) {
        setQuotas(res.quotas);
      }
    } catch (err) {
      console.error('Failed to load clinic quotas:', err);
      setFeedback({ type: 'error', text: 'فشل تحميل حصص العيادات.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotas();
  }, []);

  const openEditModal = (q) => {
    setSelectedQuota(q);
    setEditForm({
      plan_name: q.plan_name || 'pro',
      monthly_reports_limit: q.monthly_reports_limit || 50,
      monthly_transcribe_mins_limit: q.monthly_transcribe_mins_limit || 60,
      monthly_images_limit: q.monthly_images_limit || 30,
      monthly_podcasts_limit: q.monthly_podcasts_limit || 5,
      monthly_videos_limit: q.monthly_videos_limit || 3,
      monthly_documents_limit: q.monthly_documents_limit || 20,
    });
  };

  const handleSaveQuota = async (resetUsage = false) => {
    if (!selectedQuota) return;
    setSaving(true);
    try {
      const res = await clinicQuotaApi.updateClinicQuota(selectedQuota.clinic_id, {
        ...editForm,
        reset_usage: resetUsage,
      });

      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setSelectedQuota(null);
        loadQuotas();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحديث حصة العيادة.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/25">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">إدارة حصص واستهلاك الذكاء الاصطناعي للعيادات</h2>
            <p className="text-xs text-slate-400">تتبع استهلاك الحصائل الشهرية، دقائق التفريغ الصوتي، توليد الفيديو، وتعديل الحدود لكل عيادة</p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadQuotas}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-2 space-x-reverse text-xs font-bold self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث الحصص</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 space-x-reverse ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="font-bold">{feedback.text}</span>
        </div>
      )}

      {/* 2. Quotas Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="p-4">العيادة والمشترك</th>
                <th className="p-4">الباقة الحالية</th>
                <th className="p-4">الحصائل والتقارير</th>
                <th className="p-4">دقائق التفريغ</th>
                <th className="p-4">البطاقات و PECS</th>
                <th className="p-4">البودكاست</th>
                <th className="p-4">الفيديو (Veo)</th>
                <th className="p-4 text-center">إجراءات التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {quotas.map((q) => (
                <tr key={q.clinic_id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-bold text-white flex items-center space-x-2 space-x-reverse">
                    <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{q.clinic_name}</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-black text-[10px] uppercase">
                      {q.plan_name}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold">
                    <span className={q.reports_used >= q.monthly_reports_limit ? 'text-rose-400' : 'text-emerald-400'}>
                      {q.reports_used}
                    </span>
                    <span className="text-slate-500"> / {q.monthly_reports_limit}</span>
                  </td>
                  <td className="p-4 font-mono font-bold">
                    <span className={q.transcribe_mins_used >= q.monthly_transcribe_mins_limit ? 'text-rose-400' : 'text-cyan-400'}>
                      {q.transcribe_mins_used}
                    </span>
                    <span className="text-slate-500"> / {q.monthly_transcribe_mins_limit} د</span>
                  </td>
                  <td className="p-4 font-mono font-bold">
                    <span>{q.images_used}</span>
                    <span className="text-slate-500"> / {q.monthly_images_limit}</span>
                  </td>
                  <td className="p-4 font-mono font-bold">
                    <span>{q.podcasts_used}</span>
                    <span className="text-slate-500"> / {q.monthly_podcasts_limit}</span>
                  </td>
                  <td className="p-4 font-mono font-bold">
                    <span>{q.videos_used}</span>
                    <span className="text-slate-500"> / {q.monthly_videos_limit}</span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => openEditModal(q)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-bold transition flex items-center space-x-1.5 space-x-reverse mx-auto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل الحصة</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Quota Modal */}
      {selectedQuota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-black text-white">تعديل حصة: {selectedQuota.clinic_name}</h3>
                <p className="text-[11px] text-slate-400">تخصيص الحدود الشهرية أو تصفير العداد فورياً</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuota(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">نوع الباقة:</label>
                <select
                  value={editForm.plan_name}
                  onChange={(e) => setEditForm({ ...editForm, plan_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="basic">Basic (أساسية)</option>
                  <option value="pro">Pro (احترافية)</option>
                  <option value="enterprise">Enterprise (مراكز كبرى)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">حد الحصائل الشهرية:</label>
                <input
                  type="number"
                  value={editForm.monthly_reports_limit}
                  onChange={(e) => setEditForm({ ...editForm, monthly_reports_limit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">دقائق التفريغ الصوتي:</label>
                <input
                  type="number"
                  value={editForm.monthly_transcribe_mins_limit}
                  onChange={(e) => setEditForm({ ...editForm, monthly_transcribe_mins_limit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">حد بطاقات PECS:</label>
                <input
                  type="number"
                  value={editForm.monthly_images_limit}
                  onChange={(e) => setEditForm({ ...editForm, monthly_images_limit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">حد حلقات البودكاست:</label>
                <input
                  type="number"
                  value={editForm.monthly_podcasts_limit}
                  onChange={(e) => setEditForm({ ...editForm, monthly_podcasts_limit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">حد مقاطع الفيديو (Veo):</label>
                <input
                  type="number"
                  value={editForm.monthly_videos_limit}
                  onChange={(e) => setEditForm({ ...editForm, monthly_videos_limit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSaveQuota(true)}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تصفير الاستهلاك الشهري</span>
              </button>

              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setSelectedQuota(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuota(false)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
