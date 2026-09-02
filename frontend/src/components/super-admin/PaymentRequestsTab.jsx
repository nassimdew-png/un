import React, { useState } from 'react';
import { CreditCard, Check, X, Eye, RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { superAdminApi } from '../../api';

export default function PaymentRequestsTab({ requests = [], loading = false, onRefresh }) {
  const [selectedProof, setSelectedProof] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleApprove = async (id) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على هذا الدفع وتفعيل اشتراك العيادة فوراً؟')) return;
    setActionLoading(true);
    try {
      const res = await superAdminApi.approvePaymentRequest(id);
      if (res.success) {
        setFeedback({ type: 'success', text: 'تمت الموافقة وتفعيل اشتراك العيادة بنجاح!' });
        if (onRefresh) onRefresh();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل قبول طلب الدفع.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('سبب رفض إشعار الدفع:');
    if (reason === null) return;
    setActionLoading(true);
    try {
      const res = await superAdminApi.rejectPaymentRequest(id, { reason });
      if (res.success) {
        setFeedback({ type: 'success', text: 'تم رفض طلب الدفع وإشعار العيادة.' });
        if (onRefresh) onRefresh();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل رفض طلب الدفع.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">إدارة طلبات الدفع وإشعارات التحويل (BaridiMob & CCP)</h2>
            <p className="text-xs text-slate-400">مراجعة وصولات الدفع وتفعيل اشتراكات العيادات بنقرة واحدة</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 space-x-reverse ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="p-4">العيادة</th>
                <th className="p-4">الباقة المطلوبة</th>
                <th className="p-4">المبلغ المحول</th>
                <th className="p-4">طريقة الدفع</th>
                <th className="p-4">وصل التحويل</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">إجراءات المراجعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد طلبات دفع معلقة حالياً.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-bold text-white">
                      {req.tenant?.name || req.clinic_name || `عيادة #${req.tenant_id || req.clinic_id}`}
                    </td>
                    <td className="p-4 font-bold text-purple-300 uppercase">
                      {req.plan?.name || req.plan_name || 'Pro'}
                    </td>
                    <td className="p-4 font-mono font-black text-emerald-400">
                      {Number(req.amount_dzd || req.amount || 0).toLocaleString()} دج
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {req.payment_method || 'BaridiMob'}
                      </span>
                    </td>
                    <td className="p-4">
                      {req.proof_image_url || req.receipt_url ? (
                        <button
                          type="button"
                          onClick={() => setSelectedProof(req.proof_image_url || req.receipt_url)}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold flex items-center space-x-1 space-x-reverse"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>معاينة الوصل</span>
                        </button>
                      ) : (
                        <span className="text-slate-600">بدون صورة</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                        req.status === 'rejected' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                        'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                      }`}>
                        {req.status === 'approved' ? 'مقبول ومفعل' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-center space-x-2 space-x-reverse">
                          <button
                            type="button"
                            onClick={() => handleApprove(req.id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition"
                            title="قبول وتفعيل الاشتراك"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req.id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition"
                            title="رفض الطلب"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">مكتمل</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">وصل تحويل BaridiMob / CCP</h3>
              <button type="button" onClick={() => setSelectedProof(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden max-h-96 bg-black flex items-center justify-center">
              <img src={selectedProof} alt="Receipt proof" className="max-h-96 w-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
