import React, { useState } from 'react';
import { Play, Stethoscope, Clock, CheckCircle2, User } from 'lucide-react';

export default function QuickStartSessionModal({ isOpen, onClose, patients = [], onStartSession }) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [sessionType, setSessionType] = useState('reeducation'); // assessment, reeducation, follow_up

  if (!isOpen) return null;

  const handleStart = () => {
    const p = patients.find(pt => pt.id === selectedPatientId) || patients[0];
    if (onStartSession && p) {
      onStartSession(p, sessionType);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
            <Play className="w-5 h-5 text-teal-400" />
            <span>بدء جلسة سريرية فورية (Démarrer Consultation)</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">اختر المريض:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.file_number || 'ملف رقمي'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">نوع الجلسة:</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            >
              <option value="reeducation">جلسة إعادة تأهيل ونطق (Rééducation)</option>
              <option value="assessment">جلسة تقييم واختبار تشخيصي (Bilan)</option>
              <option value="guidance">إرشاد ومتابعة أسرية (Guidance Parentale)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">إلغاء</button>
          <button
            type="button"
            onClick={handleStart}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center space-x-1.5 space-x-reverse shadow-lg"
          >
            <Play className="w-3.5 h-3.5" />
            <span>انطلاق الجلسة 🩺</span>
          </button>
        </div>
      </div>
    </div>
  );
}
