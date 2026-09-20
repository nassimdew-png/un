import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Calendar, FileText, Check, AlertCircle, UploadCloud, CheckCircle2 } from 'lucide-react';
import { invoiceApi } from '../../api';

export default function RecordPaymentModal({ isOpen, onClose, onSuccess, invoice }) {
  if (!isOpen || !invoice) return null;

  const totalAmount = Number(invoice.total_amount) || 0;
  const currentPaid = Number(invoice.paid_amount) || 0;
  const remainingDebt = Math.max(0, totalAmount - currentPaid);

  const [amount, setAmount] = useState(remainingDebt > 0 ? remainingDebt : totalAmount);
  const [paymentMethod, setPaymentMethod] = useState(invoice.payment_method || 'cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [reconcileNow, setReconcileNow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const newBalance = Math.max(0, remainingDebt - (Number(amount) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(amount) <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (slipFile) {
        const formData = new FormData();
        formData.append('amount', Number(amount));
        formData.append('payment_method', paymentMethod);
        formData.append('payment_date', paymentDate);
        if (reference.trim()) formData.append('reference', reference.trim());
        if (notes.trim()) formData.append('notes', notes.trim());
        formData.append('slip_file', slipFile);
        formData.append('reconcile_now', reconcileNow ? '1' : '0');

        await invoiceApi.recordPayment(invoice.id, formData);
      } else {
        await invoiceApi.recordPayment(invoice.id, {
          amount: Number(amount),
          payment_method: paymentMethod,
          payment_date: paymentDate,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
          reconcile_now: reconcileNow,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err.response?.data?.message || err.message || 'فشل في تسجيل الدفعة');
    } finally {
      setLoading(false);
    }
  };

  const patientName = invoice.patient
    ? `${invoice.patient.first_name} ${invoice.patient.last_name}`
    : 'المريض';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150" dir="rtl">
      <div className="glass-modal rounded-3xl w-full max-w-lg bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">تسديد دفعة / سند تحصيل</h3>
              <p className="text-xs text-slate-400">
                السند رقم: <span className="text-emerald-400 font-mono font-bold">{invoice.invoice_number}</span> • {patientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invoice Summary Card */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">المبلغ الكلي</span>
            <div className="mt-1 text-sm font-black font-mono text-white">
              {totalAmount.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">دج</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] text-emerald-400/90 font-medium">المسدد سابقاً</span>
            <div className="mt-1 text-sm font-black font-mono text-emerald-400">
              {currentPaid.toLocaleString()} <span className="text-[10px] text-emerald-500/80 font-sans">دج</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] text-amber-400/90 font-medium">المتبقي المطلوب</span>
            <div className="mt-1 text-sm font-black font-mono text-amber-400">
              {remainingDebt.toLocaleString()} <span className="text-[10px] text-amber-500/80 font-sans">دج</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                مبلغ الدفعة الحالية (Montant de l'encaissement) *
              </label>
              {remainingDebt > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(remainingDebt)}
                  className="text-[11px] text-teal-400 hover:text-teal-300 underline"
                >
                  تسديد كامل المتبقي ({remainingDebt.toLocaleString()} دج)
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                required
                min="100"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-emerald-300 font-mono font-black text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="2000"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                دج (DZD)
              </span>
            </div>
            {newBalance > 0 ? (
              <p className="mt-1 text-[11px] text-amber-400">
                ⏳ سيبقى رصيد غير مسدد بذمة المريض: <span className="font-mono font-bold">{newBalance.toLocaleString()} دج</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-emerald-400 flex items-center space-x-1 space-x-reverse">
                <Check className="w-3.5 h-3.5" />
                <span>سيتم تسديد السند بالكامل وتحديث الحالة إلى مدفوع (Payé).</span>
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              طريقة الدفع (Mode de Règlement) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'cash', label: '💵 نقداً', sub: 'Espèces' },
                { id: 'baridimob', label: '📱 بريدي موب', sub: 'BaridiMob' },
                { id: 'bank_transfer', label: '🏦 تحويل بنكي', sub: 'Virement' },
                { id: 'check', label: '📜 صك', sub: 'Chèque' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    paymentMethod === m.id
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{m.label}</div>
                  <div className="text-[10px] text-slate-500">{m.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                تاريخ الدفع (Date)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رقم المعاملة / المرجع (Référence)
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="رقم تحويل بريدي موب أو الصك..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              ملاحظات التحصيل (Remarques)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: دفعة الحصة الثانية، استلام وصل يدوي..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* CCP / Payment Slip Upload & Treasury Reconciliation */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>إرفاق وصل CCP أو إشعار التحويل (Bordereau / Reçu)</span>
              </label>
              {slipFile && (
                <button
                  type="button"
                  onClick={() => setSlipFile(null)}
                  className="text-[11px] text-rose-400 hover:text-rose-300"
                >
                  إلغاء المرفق
                </button>
              )}
            </div>

            <div>
              <input
                type="file"
                id="record-payment-slip-upload"
                name="slip_file"
                data-testid="record-payment-slip-upload"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSlipFile(file);
                }}
                className="w-full text-xs text-slate-400 file:mr-0 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600/20 file:text-emerald-300 hover:file:bg-emerald-600/30 cursor-pointer bg-slate-900 border border-slate-800 rounded-xl p-1.5 focus:outline-none"
              />
            </div>

            {slipFile && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs text-slate-300">
                <div className="flex items-center space-x-2 space-x-reverse truncate">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate font-mono">{slipFile.name}</span>
                  <span className="text-[10px] text-slate-500">({(slipFile.size / 1024).toFixed(0)} KB)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                  جاهز للإرفاق والمطابقة
                </span>
              </div>
            )}

            <label className="flex items-center space-x-2 space-x-reverse cursor-pointer pt-1">
              <input
                type="checkbox"
                id="record-payment-reconcile-checkbox"
                checked={reconcileNow}
                onChange={(e) => setReconcileNow(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-300 font-bold">
                تأكيد مطابقة الوصل واعتماده في الخزينة فوراً (Confirmer la réconciliation en trésorerie)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 flex items-center space-x-2 space-x-reverse"
            >
              {loading ? (
                <span>جارٍ تسجيل الدفعة...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>تأكيد وتسجيل الدفعة الآن</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
