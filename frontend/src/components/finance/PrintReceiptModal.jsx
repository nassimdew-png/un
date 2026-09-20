import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Building,
  User,
  Calendar,
  CreditCard,
  ShieldCheck,
  UploadCloud,
  FileText,
  Check,
  AlertCircle,
} from 'lucide-react';
import { invoiceApi } from '../../api';

export default function PrintReceiptModal({
  isOpen,
  onClose,
  invoice,
  tenant,
  onOpenReconciliation,
  onSuccess,
}) {
  if (!isOpen || !invoice) return null;

  const totalAmount = Number(invoice.total_amount) || 0;
  const paidAmount = Number(invoice.paid_amount) || 0;
  const remainingDebt = Math.max(0, totalAmount - paidAmount);

  const [showReconcilePanel, setShowReconcilePanel] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [slipNumber, setSlipNumber] = useState('');
  const [reconcileAmount, setReconcileAmount] = useState(remainingDebt > 0 ? remainingDebt : totalAmount);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileSuccess, setReconcileSuccess] = useState(false);
  const [reconcileError, setReconcileError] = useState('');

  const patient = invoice.patient || {};
  const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'المريض';

  const items = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [{ description: 'جلسة فحص / استشارة علاجية متخصصة', quantity: 1, unit_price: totalAmount }];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      await invoiceApi.downloadPdf(invoice.id, `Recu_${invoice.invoice_number}.pdf`);
    } catch (err) {
      alert(err.message || 'فشل تحميل ملف PDF');
    }
  };

  const handleConfirmReconciliation = async (e) => {
    if (e) e.preventDefault();
    setIsReconciling(true);
    setReconcileError('');

    try {
      const formData = new FormData();
      formData.append('amount', Number(reconcileAmount));
      formData.append('slip_number', slipNumber.trim() || `CCP-${invoice.invoice_number}`);
      formData.append('confirm_reconcile', '1');
      formData.append('notes', 'تمت المطابقة والاعتماد من نافذة معاينة السند');
      if (slipFile) {
        formData.append('slip_file', slipFile);
      }

      await invoiceApi.reconcileCcp(invoice.id, formData);
      setReconcileSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error in PrintReceiptModal reconciliation:', err);
      setReconcileError(err.response?.data?.message || err.message || 'فشل اعتماد المطابقة');
    } finally {
      setIsReconciling(false);
    }
  };

  const methodLabel = {
    cash: 'نقداً (Espèces)',
    baridimob: 'بريدي موب (BaridiMob)',
    bank_transfer: 'تحويل بنكي (Virement)',
    check: 'صك (Chèque)',
  }[invoice.payment_method] || invoice.payment_method || 'نقداً';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl my-8">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="print:hidden flex items-center justify-between mb-3 bg-slate-900/90 border border-slate-800 rounded-2xl px-5 py-3 shadow-xl">
          <div className="flex items-center space-x-2 space-x-reverse text-sm font-bold text-white">
            <Printer className="w-4 h-4 text-teal-400" />
            <span>معاينة وطباعة سند القبض السريري</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-500/20 flex items-center space-x-1.5 space-x-reverse transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة فورية (Imprimer)</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center space-x-1.5 space-x-reverse transition-all"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>تنزيل PDF</span>
            </button>
            <button
              onClick={() => {
                if (onOpenReconciliation) {
                  onClose();
                  onOpenReconciliation(invoice);
                } else {
                  setShowReconcilePanel(!showReconcilePanel);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs border border-emerald-500/30 flex items-center space-x-1.5 space-x-reverse transition-all"
              title="إرفاق ومراجعة وصل CCP ومطابقة السند الخزيني"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مطابقة ومراجعة وصل CCP</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dedicated CCP Slip Review & Reconciliation Panel */}
        {showReconcilePanel && (
          <div className="print:hidden mb-4 bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>مراجعة واعتماد وصل CCP لسند القبض #{invoice.invoice_number}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReconcilePanel(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                إغلاق اللوحة
              </button>
            </div>

            {reconcileSuccess ? (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 space-x-reverse">
                <CheckCircle2 className="w-4 h-4" />
                <span>تمت مطابقة السند واعتماده في سجلات الخزينة بنجاح!</span>
              </div>
            ) : (
              <form onSubmit={handleConfirmReconciliation} className="space-y-3">
                {reconcileError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 space-x-reverse">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reconcileError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      إرفاق صورة أو وثيقة وصل CCP (Bordereau)
                    </label>
                    <input
                      type="file"
                      id="receipt-print-ccp-slip-input"
                      data-testid="receipt-print-ccp-slip-input"
                      name="slip_file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-400 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600/20 file:text-emerald-300 hover:file:bg-emerald-600/30 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-1.5 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      رقم وصل CCP / المرجع (Référence)
                    </label>
                    <input
                      type="text"
                      value={slipNumber}
                      onChange={(e) => setSlipNumber(e.target.value)}
                      placeholder={`مثال: CCP-${invoice.invoice_number}`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-400">
                    المبلغ المعتمد: <span className="text-emerald-400 font-mono font-bold">{Number(reconcileAmount).toLocaleString()} دج</span>
                  </div>
                  <button
                    type="submit"
                    id="print-modal-confirm-reconciliation-btn"
                    data-testid="print-modal-confirm-reconciliation-btn"
                    disabled={isReconciling}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center space-x-1.5 space-x-reverse"
                  >
                    {isReconciling ? (
                      <span>جارٍ الاعتماد...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>تأكيد ومطابقة السند في الخزينة (Confirmer la réconciliation)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* The Printable Paper Container */}
        <div
          id="printable-receipt-card"
          className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 print:border-none print:shadow-none print:p-4 print:m-0 print:rounded-none print:w-full"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex flex-row justify-between items-start border-b-2 border-teal-700 pb-5 mb-5">
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-xl font-black tracking-tight text-teal-900">
                  {tenant?.name || 'العيادة التخصصية للطب النفسي والأرطوفونيا'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                سجل الفوترة والتعويضات الطبية • Système Clinique PsyPro
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {tenant?.phone ? `الهاتف: ${tenant.phone}` : ''} {tenant?.address ? `• العنوان: ${tenant.address}` : ''}
              </p>
            </div>

            <div className="text-left" dir="ltr">
              <div className="inline-block bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl text-teal-900 font-mono font-black text-sm">
                N° {invoice.invoice_number}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Date: {invoice.issued_date || new Date().toISOString().split('T')[0]}
              </div>
            </div>
          </div>

          {/* Title Badge */}
          <div className="text-center my-4">
            <div className="inline-block px-5 py-1 rounded-full bg-slate-100 text-slate-800 font-extrabold text-sm border border-slate-300">
              {invoice.invoice_type === 'b2b_subscription' || invoice.company_name
                ? 'فاتورة تجارية وضريبية لاشتراك عيادي / FACTURE COMMERCIALE & FISCALE (B2B)'
                : "سند قبض وتبرئة ذمة مالية / REÇU D'HONORAIRES"}
            </div>
          </div>

          {/* Patient or B2B Company Details Box */}
          {invoice.invoice_type === 'b2b_subscription' || invoice.company_name ? (
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 mb-5 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-teal-900 font-bold block text-[11px]">المؤسسة أو العيادة المستفيدة (Client B2B) :</span>
                  <span className="font-extrabold text-slate-900 text-base">{invoice.company_name || patientName}</span>
                </div>
                <div className="text-left" dir="ltr">
                  <span className="text-slate-500 font-bold block text-[11px]">Mode de Paiement :</span>
                  <span className="font-bold text-teal-800 text-xs bg-teal-100 px-2.5 py-0.5 rounded-md inline-block mt-0.5">
                    {methodLabel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-teal-200/80 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 font-bold block text-[10px]">الرقم الجبائي (NIF) :</span>
                  <span className="text-slate-900 font-bold">{invoice.tax_id || '002116000000000'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px]">السجل التجاري (RC) :</span>
                  <span className="text-slate-900">{invoice.trade_register || '16/00-1234567B21'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block text-[10px]">التعريف الإحصائي (NIS) :</span>
                  <span className="text-slate-900">{invoice.nis_number || '00123456789'}</span>
                </div>
              </div>

              {(invoice.subscription_plan || invoice.billing_period) && (
                <div className="pt-2 border-t border-teal-200/80 flex flex-wrap items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-500 font-bold">باقة الاشتراك : </span>
                    <span className="font-bold text-teal-900">{invoice.subscription_plan || 'Pro / SaaS'}</span>
                    <span className="text-slate-400 mr-2">({invoice.billing_period || 'سنوي'})</span>
                  </div>
                  {invoice.period_start && invoice.period_end && (
                    <div className="font-mono text-slate-600">
                      الفترة المفوترة: من {invoice.period_start} إلى {invoice.period_end}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5 text-xs">
              <div>
                <span className="text-slate-500 font-bold block text-[11px]">المستفيد / المريض :</span>
                <span className="font-extrabold text-slate-900 text-sm">{patientName}</span>
                {patient.phone && (
                  <span className="block text-slate-600 font-mono mt-0.5" dir="ltr">
                    Tel: {patient.phone}
                  </span>
                )}
              </div>
              <div className="text-left" dir="ltr">
                <span className="text-slate-500 font-bold block text-[11px]">Mode de Paiement :</span>
                <span className="font-bold text-teal-800 text-xs bg-teal-100 px-2.5 py-0.5 rounded-md inline-block mt-0.5">
                  {methodLabel}
                </span>
              </div>
            </div>
          )}

          {/* Table of Acts */}
          <table className="w-full text-xs text-slate-800 border-collapse mb-5">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-black">
                <th className="py-2.5 px-3 text-right">
                  {invoice.invoice_type === 'b2b_subscription' || invoice.company_name ? 'طبيعة الخدمة أو الباقة المفوترة' : 'البيان / Actes & Prestations'}
                </th>
                <th className="py-2.5 px-3 text-center">الكمية</th>
                <th className="py-2.5 px-3 text-left" dir="ltr">Prix Unit.</th>
                <th className="py-2.5 px-3 text-left" dir="ltr">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((it, idx) => {
                const qty = Number(it.quantity) || 1;
                const price = Number(it.unit_price) || 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{it.description}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{qty}</td>
                    <td className="py-2.5 px-3 text-left font-mono" dir="ltr">
                      {price.toLocaleString()} DZD
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-900" dir="ltr">
                      {(qty * price).toLocaleString()} DZD
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals Breakdown */}
          <div className="flex justify-end mb-6">
            <div className="w-72 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              {(invoice.invoice_type === 'b2b_subscription' || invoice.company_name) && (
                <>
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>المبلغ الصافي (Montant HT) :</span>
                    <span className="font-mono font-bold text-slate-900" dir="ltr">
                      {(Number(invoice.subtotal_ht) || totalAmount).toLocaleString()} DZD
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>الضريبة (TVA {invoice.tax_rate ?? 19}%) :</span>
                    <span className="font-mono font-bold text-teal-700" dir="ltr">
                      {(Number(invoice.tax_amount) || 0).toLocaleString()} DZD
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>المبلغ الإجمالي (Total {invoice.invoice_type === 'b2b_subscription' || invoice.company_name ? 'TTC' : ''}) :</span>
                <span className="font-mono font-black" dir="ltr">
                  {totalAmount.toLocaleString()} DZD
                </span>
              </div>
              <div className="flex justify-between font-bold text-teal-800 border-t border-slate-200 pt-2">
                <span>المبلغ المسدد (Versé) :</span>
                <span className="font-mono font-black" dir="ltr">
                  {paidAmount.toLocaleString()} DZD
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-700 border-t border-slate-200 pt-2">
                <span>المتبقي في الذمة (Reste) :</span>
                <span
                  className={`font-mono font-black ${
                    remainingDebt > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                  dir="ltr"
                >
                  {remainingDebt.toLocaleString()} DZD
                </span>
              </div>
            </div>
          </div>

          {/* Official Stamp & Sign Area */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
            <div className="text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">
                {invoice.invoice_type === 'b2b_subscription' || invoice.company_name ? 'ملاحظة الفوترة الضريبية والتجارية :' : 'ملاحظة تنظيمية للتعويض :'}
              </p>
              <p className="text-[10px] leading-relaxed text-slate-500">
                {invoice.invoice_type === 'b2b_subscription' || invoice.company_name
                  ? 'تُعتمد هذه الفاتورة كوثيقة تجارية وضريبية رسمية تثبت الاشتراك السحابي B2B، وهي صالحة للأغراض الجبائية والمحاسبية لخصم أعباء البرمجيات كخدمة (SaaS) وفق التنظيم الجزائري المعمول به.'
                  : 'يُعتمد هذا الوصل كإثبات رسمي لتسديد أتعاب الاستشارة الطبية / التأهيلية، وهو صالح لتقديمه لصناديق الضمان الاجتماعي (CNAS / CASNOS) والتعاضديات التكميلية.'}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-2xl min-h-[100px] text-center">
              <span className="text-[11px] font-bold text-slate-400 mb-6">ختم وتوقيع الإدارة / العيادة</span>
              <div className="w-24 border-b border-slate-400"></div>
            </div>
          </div>

          <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
            تم استخراج هذا السند آلياً عبر منصة PsyPro الطبية • {new Date().toLocaleDateString('ar-DZ')}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt-card, #printable-receipt-card * {
            visibility: visible;
          }
          #printable-receipt-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none;
            border: none;
          }
        }
      `}} />
    </div>
  );
}
