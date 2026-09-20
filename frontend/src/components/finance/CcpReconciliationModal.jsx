import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  CreditCard,
  Building,
  User,
  Eye,
  Check,
  Sparkles,
} from 'lucide-react';
import { invoiceApi, financeDocumentApi } from '../../api';

export default function CcpReconciliationModal({
  isOpen,
  onClose,
  onSuccess,
  invoice,
  tenant,
}) {
  if (!isOpen) return null;

  const totalAmount = invoice ? Number(invoice.total_amount) || 0 : 0;
  const paidAmount = invoice ? Number(invoice.paid_amount) || 0 : 0;
  const remainingDebt = Math.max(0, totalAmount - paidAmount);

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [slipNumber, setSlipNumber] = useState('');
  const [ccpAccount, setCcpAccount] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(remainingDebt > 0 ? remainingDebt : totalAmount);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);

  useEffect(() => {
    if (invoice) {
      const rem = Math.max(0, Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0));
      setAmount(rem > 0 ? rem : Number(invoice.total_amount || 0));
    }
  }, [invoice]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError('');

    if (file.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }

    // Auto-fill a placeholder reference if not yet filled
    if (!slipNumber) {
      setSlipNumber('CCP-' + Math.floor(100000 + Math.random() * 900000));
    }
  };

  const handleQuickOcr = async () => {
    if (!selectedFile) {
      setError('يرجى اختيار ملف الوصل أولاً');
      return;
    }
    setIsOcrProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document_file', selectedFile);
      formData.append('type', 'ccp_slip');

      const res = await financeDocumentApi.processDocument(formData);
      if (res.success && res.raw_data) {
        if (res.raw_data.invoice_number) setSlipNumber(res.raw_data.invoice_number);
        if (res.raw_data.total_amount) setAmount(res.raw_data.total_amount);
        if (res.raw_data.invoice_date) setTransactionDate(res.raw_data.invoice_date);
        if (res.raw_data.vendor_name) setCcpAccount(res.raw_data.vendor_name);
        setOcrSuccess(true);
      }
    } catch (err) {
      console.warn('OCR extraction non-blocking error:', err);
      // Soft fallback: retain manual entry
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleSubmitReconciliation = async (e) => {
    e.preventDefault();
    if (Number(amount) <= 0) {
      setError('يرجى تحديد مبلغ صحيح أكبر من الصفر');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (invoice?.id) {
        // Direct Invoice CCP Reconciliation
        const formData = new FormData();
        formData.append('amount', Number(amount));
        formData.append('slip_number', slipNumber.trim());
        formData.append('ccp_account', ccpAccount.trim());
        formData.append('transaction_date', transactionDate);
        formData.append('notes', notes.trim());
        formData.append('confirm_reconcile', '1');
        if (selectedFile) {
          formData.append('slip_file', selectedFile);
        }

        await invoiceApi.reconcileCcp(invoice.id, formData);
      } else {
        // Standalone Financial Document Reconciliation
        const formData = new FormData();
        formData.append('document_file', selectedFile);
        formData.append('type', 'ccp_slip');

        const procRes = await financeDocumentApi.processDocument(formData);
        const docId = procRes.document?.id;
        if (docId) {
          await financeDocumentApi.reconcileDocument(docId, {
            invoice_number: slipNumber,
            total_amount: Number(amount),
            invoice_date: transactionDate,
            vendor_name: ccpAccount || 'حساب بريدي CCP',
            notes: notes.trim(),
          });
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error confirming reconciliation:', err);
      setError(err.response?.data?.message || err.message || 'فشل في تأكيد مطابقة الوصل');
    } finally {
      setLoading(false);
    }
  };

  const patientName = invoice?.patient
    ? `${invoice.patient.first_name} ${invoice.patient.last_name}`
    : 'المريض';

  const isAmountMatched = invoice ? Math.abs(Number(amount) - remainingDebt) < 1 : true;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150" dir="rtl">
      <div className="glass-modal rounded-3xl w-full max-w-xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 my-8 overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">مطابقة وصل CCP واعتماد السند في الخزينة</h3>
              <p className="text-xs text-slate-400">
                {invoice ? (
                  <>
                    سند القبض: <span className="text-emerald-400 font-mono font-bold">{invoice.invoice_number}</span> • {patientName}
                  </>
                ) : (
                  'تسجيل ومطابقة وصل تحويل بريدي أو إشعار BaridiMob في سجل الخزينة'
                )}
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

        {/* Invoice Summary Pill (if available) */}
        {invoice && (
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">مبلغ السند الإجمالي</span>
              <div className="mt-1 text-sm font-black font-mono text-white">
                {totalAmount.toLocaleString()} <span className="text-[10px] text-slate-500">دج</span>
              </div>
            </div>
            <div>
              <span className="text-[11px] text-emerald-400 font-medium">المسدد سابقاً</span>
              <div className="mt-1 text-sm font-black font-mono text-emerald-400">
                {paidAmount.toLocaleString()} <span className="text-[10px] text-emerald-500/80">دج</span>
              </div>
            </div>
            <div>
              <span className="text-[11px] text-amber-400 font-medium">المتبقي للمطابقة</span>
              <div className="mt-1 text-sm font-black font-mono text-amber-400">
                {remainingDebt.toLocaleString()} <span className="text-[10px] text-amber-500/80">دج</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 space-x-reverse">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {ocrSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 space-x-reverse">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>تم استخراج بيانات وصل CCP بنجاح وتعبئة الحقول آلياً!</span>
          </div>
        )}

        <form onSubmit={handleSubmitReconciliation} className="space-y-4">
          {/* File Upload Dropzone */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              إرفاق صورة أو وثيقة وصل CCP (Bordereau / Reçu) *
            </label>
            <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 text-center bg-slate-950/60 transition-colors">
              <input
                type="file"
                id="ccp-slip-file-input"
                data-testid="ccp-slip-file-input"
                name="slip_file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="ccp-slip-file-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <UploadCloud className="w-8 h-8 text-emerald-400" />
                <span className="text-xs text-slate-300 font-bold">
                  {selectedFile ? selectedFile.name : 'انقر لاختيار وصل CCP أو صورة إشعار BaridiMob'}
                </span>
                <span className="text-[10px] text-slate-500">
                  يدعم صيغ JPG, PNG, WEBP أو PDF (الحد الأقصى 15 ميغابايت)
                </span>
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2 space-x-reverse truncate">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate text-slate-300 font-mono font-medium">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse shrink-0">
                  <button
                    type="button"
                    onClick={handleQuickOcr}
                    disabled={isOcrProcessing}
                    className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/30 text-[11px] font-bold flex items-center space-x-1 space-x-reverse"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isOcrProcessing ? 'جارٍ التحليل...' : 'قراءة ذكية'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                    className="text-slate-500 hover:text-rose-400 text-xs"
                  >
                    حذف
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Amount & Slip Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                المبلغ المسدد في الوصل (Montant DZD) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="50"
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-emerald-400 font-mono font-black text-base focus:outline-none focus:border-emerald-500"
                  placeholder="2500"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  دج
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رقم الوصل / المرجع (Référence CCP) *
              </label>
              <input
                type="text"
                required
                value={slipNumber}
                onChange={(e) => setSlipNumber(e.target.value)}
                placeholder="مثال: CCP-892104"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* CCP Account Holder & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الحساب البريدي / اسم المودع (Titulaire CCP)
              </label>
              <input
                type="text"
                value={ccpAccount}
                onChange={(e) => setCcpAccount(e.target.value)}
                placeholder="رقم الحساب البريدي الجاري أو اسم المودع..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                تاريخ المعاملة في الوصل (Date de transaction)
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              ملاحظات المطابقة والخزينة (Observations de rapprochement)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم التأكد من رصيد الحساب البريدي وإرفاق الوصل..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Status & Verification Check Pill */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 space-x-reverse">
              <CheckCircle2 className={`w-4 h-4 ${isAmountMatched ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-slate-300 font-medium">
                {isAmountMatched
                  ? 'المبلغ مطابق لقيمة السند المطلوب بنسبة 100%'
                  : 'تنبيه: المبلغ المدخل يختلف عن المتبقي المطلوب للسند'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              سند الخزينة
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              id="confirm-reconciliation-btn"
              data-testid="confirm-reconciliation-btn"
              disabled={loading}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 flex items-center space-x-2 space-x-reverse"
            >
              {loading ? (
                <span>جارٍ اعتماد المطابقة...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>تأكيد واعتماد المطابقة في الخزينة (Confirmer la réconciliation)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
