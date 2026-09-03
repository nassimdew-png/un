import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2, Loader2 } from 'lucide-react';

export default function DataExportModal({ isOpen, onClose, patient = null, tenant = null }) {
  const [format, setFormat] = useState('excel');
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
            <Download className="w-5 h-5 text-teal-400" />
            <span>تصدير السجل السريري والبيانات (Export Data)</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        <div className="space-y-3 text-xs">
          <label className="block text-slate-400 font-bold">اختر صيغة التصدير:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat('excel')}
              className={`p-3.5 rounded-2xl border text-center space-y-1.5 transition-all ${
                format === 'excel'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <FileSpreadsheet className="w-6 h-6 mx-auto text-emerald-400" />
              <span className="block">جدول Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`p-3.5 rounded-2xl border text-center space-y-1.5 transition-all ${
                format === 'pdf'
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <FileText className="w-6 h-6 mx-auto text-indigo-400" />
              <span className="block">ملف PDF (.pdf)</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">إلغاء</button>
          <button
            type="button"
            disabled={downloading}
            onClick={handleExport}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 space-x-reverse shadow-lg"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{downloading ? 'جاري التجهيز...' : 'تصدير وتحميل'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
