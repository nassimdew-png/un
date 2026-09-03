import React, { useState } from 'react';
import { Stethoscope, CheckCircle2, Clock, Sparkles, FileText, Mic } from 'lucide-react';

export default function ActiveConsultationWorkspace({ patient, onClose, onFinish }) {
  const [soapNotes, setSoapNotes] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">جلسة استشارة سريرية مباشرة</h3>
              <p className="text-xs text-slate-400">{patient?.first_name} {patient?.last_name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕ إغلاق</button>
        </div>

        {/* SOAP Note Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">الملاحظات الذاتية والشكوى (Subjective):</label>
            <textarea
              rows={2}
              value={soapNotes.subjective}
              onChange={(e) => setSoapNotes({ ...soapNotes, subjective: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              placeholder="انطباع الولي والمريض عن الحالة..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">الملاحظات السريرية الموضوعية (Objective):</label>
            <textarea
              rows={2}
              value={soapNotes.objective}
              onChange={(e) => setSoapNotes({ ...soapNotes, objective: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              placeholder="السلوك الملاحظ، التمارين المنجزة، الاستجابة..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">التقييم والتحليل (Assessment):</label>
            <textarea
              rows={2}
              value={soapNotes.assessment}
              onChange={(e) => setSoapNotes({ ...soapNotes, assessment: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              placeholder="التحسن الملحوظ والتشخيص الإجرائي..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">الخطة القادمة والواجبات (Plan):</label>
            <textarea
              rows={2}
              value={soapNotes.plan}
              onChange={(e) => setSoapNotes({ ...soapNotes, plan: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              placeholder="أهداف الجلسة القادمة والتمارين المنزلية..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">إلغاء</button>
          <button type="button" onClick={() => onFinish ? onFinish(soapNotes) : onClose()} className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg">حفظ وتوثيق الجلسة ✅</button>
        </div>
      </div>
    </div>
  );
}
