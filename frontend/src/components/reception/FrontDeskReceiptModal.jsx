import React, { useState } from 'react';
import {
  X,
  DollarSign,
  Printer,
  Send,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  CreditCard,
  Building2,
  Calendar,
  User,
  Check,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { invoiceApi } from '../../api';

// Helper to format Algerian Dinar in Arabic words
function formatNumberToArabicWords(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n === 0) return 'صفر دينار جزائري';
  if (n === 1000) return 'ألف دينار جزائري';
  if (n === 1500) return 'ألف وخمسمائة دينار جزائري';
  if (n === 2000) return 'ألفان دينار جزائري';
  if (n === 2500) return 'ألفان وخمسمائة دينار جزائري';
  if (n === 3000) return 'ثلاثة آلاف دينار جزائري';
  if (n === 3500) return 'ثلاثة آلاف وخمسمائة دينار جزائري';
  if (n === 4000) return 'أربعة آلاف دينار جزائري';
  if (n === 4500) return 'أربعة آلاف وخمسمائة دينار جزائري';
  if (n === 5000) return 'خمسة آلاف دينار جزائري';
  if (n === 6000) return 'ستة آلاف دينار جزائري';
  if (n === 8000) return 'ثمانية آلاف دينار جزائري';
  if (n === 10000) return 'عشرة آلاف دينار جزائري';
  return `${n.toLocaleString('ar-DZ')} دينار جزائري`;
}

export default function FrontDeskReceiptModal({
  isOpen,
  onClose,
  onSuccess,
  tenant,
  initialPatient = null,
  initialAppointment = null,
  patients = [],
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatient?.id || initialAppointment?.patient_id || ''
  );
  const [amount, setAmount] = useState(2500);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, baridimob, cheque, bank_transfer
  const [serviceType, setServiceType] = useState('حصة تأهيل سريري واستشارة');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdInvoice, setCreatedInvoice] = useState(null);

  if (!isOpen) return null;

  const currentPatient =
    patients.find((p) => String(p.id) === String(selectedPatientId)) ||
    initialPatient ||
    initialAppointment?.patient;

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedPatientId && !currentPatient?.id) {
      setError('يرجى تحديد المريض أولاً.');
      return;
    }
    if (!amount || amount <= 0) {
      setError('يرجى تحديد مبلغ صالح.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        patient_id: selectedPatientId || currentPatient.id,
        appointment_id: initialAppointment?.id || null,
        total_amount: Number(amount),
        paid_amount: Number(amount),
        payment_status: 'paid',
        payment_method: paymentMethod,
        notes: `مكتب الاستقبال • ${serviceType} ${notes ? '• ' + notes : ''}`,
      };

      const res = await invoiceApi.create(payload);
      const invoice = res.invoice || res.data || res;
      setCreatedInvoice(invoice);

      if (onSuccess) {
        onSuccess(invoice);
      }
    } catch (err) {
      console.error('Failed to create receipt:', err);
      setError(err.message || 'حدث خطأ أثناء إصدار السند.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const [sendingWa, setSendingWa] = useState(false);
  const [waSentSuccess, setWaSentSuccess] = useState(false);

  const handleWhatsAppSend = async (forceManual = false) => {
    if (!createdInvoice?.id) return;
    try {
      if (forceManual) {
        const res = await invoiceApi.getWhatsAppReminder(createdInvoice.id);
        if (res?.whatsapp_url) {
          window.open(res.whatsapp_url, '_blank');
        }
        return;
      }

      setSendingWa(true);
      try {
        const cloudRes = await invoiceApi.sendWhatsAppReminder(createdInvoice.id);
        setWaSentSuccess(true);
        alert('✅ ' + (cloudRes.message || 'تم إرسال إشعار السند إلى واتساب المريض بنجاح!'));
      } catch (cErr) {
        console.warn('Cloud dispatch failed, falling back to manual wa.me:', cErr);
        const res = await invoiceApi.getWhatsAppReminder(createdInvoice.id);
        if (res?.whatsapp_url) {
          window.open(res.whatsapp_url, '_blank');
        }
      }
    } catch (err) {
      console.error('Failed to get whatsapp link:', err);
    } finally {
      setSendingWa(false);
    }
  };

  const clinicTitle = tenant?.header_title_ar || tenant?.name || 'العيادة التخصصية للتشخيص والتأهيل';
  const clinicPhone = tenant?.phone || '0550 00 00 00';
  const clinicWilaya = tenant?.wilaya || 'الجزائر';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shadow-lg shadow-amber-500/10">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>صندوق القبض وإصدار الوصل الفوري</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-bold">
                  FAST CASHIER 💵
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تحصيل أتعاب الجلسات وطباعة وصل استلام رسمي معتمد أو إرساله عبر WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {createdInvoice ? (
            /* PRINTABLE RECEIPT CARD */
            <div className="space-y-4 animate-in zoom-in-95">
              
              {/* Receipt Visual Sheet */}
              <div 
                id="printable-frontdesk-receipt"
                className="p-6 rounded-2xl bg-white text-slate-900 border-2 border-slate-300 shadow-xl space-y-4 font-sans print:m-0 print:p-8"
              >
                {/* Receipt Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900">{clinicTitle}</h2>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {clinicWilaya} • هاتف: {clinicPhone}
                    </p>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white block">
                      وصل استلام أتعاب
                    </span>
                    <span className="text-[11px] text-slate-700 font-bold block mt-1">
                      N°: {createdInvoice.invoice_number || `REC-${createdInvoice.id}`}
                    </span>
                  </div>
                </div>

                {/* Details Table */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block text-[11px]">المستفيد / المريض:</span>
                    <span className="font-extrabold text-sm text-slate-900">
                      {currentPatient ? `${currentPatient.first_name} ${currentPatient.last_name}` : 'مريض العيادة'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[11px]">التاريخ والوقت:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date().toLocaleDateString('ar-DZ')} • {new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[11px]">البيان / الخدمة:</span>
                    <span className="font-semibold text-slate-800">{serviceType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[11px]">طريقة الدفع:</span>
                    <span className="font-bold text-slate-800">
                      {paymentMethod === 'cash' ? 'نقداً (Espèces)' : paymentMethod === 'baridimob' ? 'بريدي موب (BaridiMob)' : 'صك بنكي / بريدي'}
                    </span>
                  </div>
                </div>

                {/* Amount Highlight */}
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block">المبلغ المقبوض كتابة:</span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {formatNumberToArabicWords(amount)}
                    </span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-lg font-black text-emerald-700">
                      {Number(amount).toLocaleString('fr-FR')} DZD
                    </span>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                  <div className="text-center">
                    <span className="block font-bold">توقيع موظف الاستقبال</span>
                    <span className="text-[10px] text-slate-400 mt-4 block">تم التحصيل بنجاح</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-bold">ختم العيادة المعتمد</span>
                    <div className="w-16 h-10 border border-dashed border-slate-400 rounded-lg mx-auto mt-1 flex items-center justify-center text-[9px] text-slate-400">
                      ختم العيادة
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handlePrint}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>طباعة الوصل الفوري (A5 / A4)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    disabled={sendingWa}
                    onClick={() => handleWhatsAppSend(false)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                      waSentSuccess
                        ? 'bg-emerald-700 text-emerald-100 shadow-emerald-700/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    }`}
                  >
                    {sendingWa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{sendingWa ? 'جارٍ الإرسال السحابي...' : (waSentSuccess ? '✓ تم إرسال السند' : 'إرسال إشعار السند (WhatsApp Cloud)')}</span>
                  </button>
                  <button
                    onClick={() => handleWhatsAppSend(true)}
                    title="فتح تطبيق واتساب يدوياً"
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition border border-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>يدوي</span>
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all"
                >
                  إغلاق ومتابعة
                </button>
              </div>

            </div>
          ) : (
            /* PAYMENT FORM */
            <form onSubmit={handleRecordPayment} className="space-y-4">
              
              {/* Patient Display or Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  المريض المستفيد:
                </label>
                {currentPatient ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-white text-sm">
                      {currentPatient.first_name} {currentPatient.last_name}
                    </span>
                    <span className="text-teal-400 font-mono">
                      📞 {currentPatient.phone || 'بدون هاتف'}
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- اختر المريض --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} (الهاتف: {p.phone || 'غير مسجل'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    المبلغ المقبوض (دج) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 pl-12 rounded-xl bg-slate-950 border border-slate-800 text-white text-base font-black font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute left-3 top-3 text-xs font-bold text-amber-400 pointer-events-none">
                      DZD
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {formatNumberToArabicWords(amount)}
                  </p>
                </div>

                {/* Quick Pre-set Amounts */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    تعريفات شائعة سريعة:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1500, 2000, 2500, 3000, 3500, 4000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                          Number(amount) === val
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {val} دج
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  طريقة التحصيل في الصندوق:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'cash'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs">نقداً (Espèces)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('baridimob')}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'baridimob'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    <span className="text-xs">BaridiMob 📱</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cheque')}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'cheque'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileCheck className="w-5 h-5 text-teal-400" />
                    <span className="text-xs">صك بنكي / بريدي</span>
                  </button>
                </div>
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  بيان ونوع الخدمة السريرية:
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="حصة تأهيل سريري واستشارة">حصة تأهيل سريري واستشارة (Séance de Thérapie)</option>
                  <option value="كشف وفحص سريري أولي">كشف وفحص سريري أولي (Consultation Initiale)</option>
                  <option value="تقييم رائز ومقياس نفسي معياري">تقييم رائز ومقياس نفسي معياري (Passation de Test)</option>
                  <option value="جلسة أرطوفونيا وتأهيل نطق">جلسة أرطوفونيا وتأهيل نطق (Séance d'Orthophonie)</option>
                  <option value="جلسة تأهيل نفسي حركي">جلسة تأهيل نفسي حركي (Séance Psychomotricité)</option>
                  <option value="إعداد تقرير وحصيلة سريرية رسمية">إعداد تقرير وحصيلة سريرية رسمية (Bilan Clinique)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ملاحظات إضافية على السند:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: دفعة الحصة رقم 3..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>جاري تسجيل القبض...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>تأكيد القبض وطباعة الوصل ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
