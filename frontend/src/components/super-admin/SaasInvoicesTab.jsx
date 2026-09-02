import React from 'react';
import { FileText, Download, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export default function SaasInvoicesTab({ invoices = [], loading = false, onRefresh }) {
  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-black">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">فواتير اشتراكات المنصة (SaaS B2B Invoices)</h2>
            <p className="text-xs text-slate-400">سجل الفواتير الصادرة للعيادات والمراكز الطبية المشتركة</p>
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

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="p-4">رقم الفاتورة</th>
                <th className="p-4">العيادة والمشترك</th>
                <th className="p-4">تاريخ الإصدار</th>
                <th className="p-4">المبلغ الإجمالي</th>
                <th className="p-4">حالة الدفع</th>
                <th className="p-4 text-center">تحميل الفاتورة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا توجد فواتير صادرة بعد.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono font-bold text-white">
                      #{inv.invoice_number || `INV-${inv.id}`}
                    </td>
                    <td className="p-4 font-bold text-slate-200">
                      {inv.tenant?.name || inv.clinic_name || 'عيادة خاصة'}
                    </td>
                    <td className="p-4 text-slate-400 font-mono">
                      {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString('ar-DZ') : new Date().toLocaleDateString('ar-DZ')}
                    </td>
                    <td className="p-4 font-mono font-black text-emerald-400">
                      {Number(inv.total_amount_dzd || inv.total_amount || 0).toLocaleString()} دج
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {inv.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => alert(`تحميل الفاتورة #${inv.invoice_number || inv.id}`)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 transition mx-auto"
                        title="تحميل PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
