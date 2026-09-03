import React, { useState } from 'react';
import { ClipboardList, Plus, Save, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PatientHomeworkBuilderModal({ isOpen, onClose, patient, onSaved }) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (onSaved) {
      onSaved({
        id: Date.now(),
        title: title.trim(),
        instructions: instructions.trim(),
        status: 'active',
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            <span>إعداد خطة واجبات وتمارين منزلية</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">عنوان الخطة الأسبوعية:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تمارين التحكم بالنفس ونطق الفونيمات"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-bold mb-1">إرشادات الولي وتفاصيل التمرين:</label>
            <textarea
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="خطوات التكرار اليومي، مدة الحصة المنزلية، وملاحظات المشرف..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">إلغاء</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold">حفظ وإرسال للولي ✅</button>
          </div>
        </form>
      </div>
    </div>
  );
}
