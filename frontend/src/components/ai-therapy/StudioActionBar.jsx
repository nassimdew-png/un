import React, { useState } from 'react';
import {
  Save,
  Printer,
  Copy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Share2
} from 'lucide-react';
import { patientApi } from '../../api';

export default function StudioActionBar({
  selectedPatient,
  toolType,
  title,
  payload,
  summary,
  onSaved,
}) {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveToPatient = async () => {
    if (!selectedPatient?.id) {
      showToast('error', 'يرجى اختيار مريض من القائمة العلوية أولاً لربط هذا التقرير بملفه الطبي.');
      return;
    }

    setSaving(true);
    try {
      const res = await patientApi.attachAiRecord(selectedPatient.id, {
        tool_type: toolType,
        title: title || 'تقرير سريري مدعوم بالذكاء الاصطناعي',
        summary: summary || '',
        payload: typeof payload === 'string' ? JSON.parse(payload) : payload,
      });

      showToast('success', res.message || `تم إرفاق التقرير في السجل الطبي لـ ${selectedPatient.first_name} بنجاح!`);
      onSaved?.(res.record);
    } catch (err) {
      showToast('error', err.message || 'فشل حفظ التقرير في سجل المريض.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (!payload) return;
    const textToCopy = typeof payload === 'object' ? JSON.stringify(payload, null, 2) : String(payload);
    navigator.clipboard.writeText(textToCopy);
    showToast('success', 'تم نسخ النص الكامل إلى الحافظة بنجاح!');
  };

  return (
    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-sans print:hidden">
      {/* Status indicator / toast */}
      <div className="flex items-center space-x-2 space-x-reverse text-xs">
        {toast ? (
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 space-x-reverse font-bold animate-in fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border-red-500/30'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{toast.message}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 font-mono">
            {selectedPatient
              ? `جاهز للإرفاق في ملف: ${selectedPatient.first_name} ${selectedPatient.last_name}`
              : 'جاهز للحفظ أو الطباعة الرسمية'}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 1. Copy full text */}
        <button
          type="button"
          onClick={handleCopy}
          className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
          title="نسخ النص الكامل إلى الحافظة"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>نسخ النص الكامل</span>
        </button>

        {/* 2. Print Official PDF */}
        <button
          type="button"
          onClick={handlePrint}
          className="px-3.5 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-black transition flex items-center space-x-1.5 space-x-reverse shadow-md shadow-indigo-600/20"
          title="طباعة التقرير بترويسة العيادة والختم الطبي"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>🖨️ طباعة تقرير PDF</span>
        </button>

        {/* 3. Save to Patient Record */}
        <button
          type="button"
          onClick={handleSaveToPatient}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 text-xs font-black transition flex items-center space-x-1.5 space-x-reverse shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          title="إرفاق وحفظ التقرير في السجل الطبي للمريض"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" /> : <Save className="w-3.5 h-3.5 text-slate-950" />}
          <span>{saving ? 'جاري الحفظ في الملف...' : '💾 حفظ في سجل المريض'}</span>
        </button>
      </div>
    </div>
  );
}
