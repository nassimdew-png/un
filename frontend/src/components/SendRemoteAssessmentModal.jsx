import React, { useState } from 'react';
import { Send, Smartphone, Sparkles, CheckCircle2, Copy } from 'lucide-react';

export default function SendRemoteAssessmentModal({ isOpen, onClose, patient }) {
  const [copied, setCopied] = useState(false);
  const [assessmentType, setAssessmentType] = useState('cars_autism');

  if (!isOpen) return null;

  const link = `https://psypro.tech/remote-assessment/${patient?.id || 'demo'}?type=${assessmentType}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
            <Smartphone className="w-5 h-5 text-teal-400" />
            <span>إرسال استبيان تقييم عن بعد للولي (Remote Assessment)</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">نوع المقياس المطلوب تعبئته من الولي:</label>
            <select
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            >
              <option value="cars_autism">مقياس تقييم التوحد في الطفولة (CARS-2)</option>
              <option value="conners_adhd">مقياس فرط الحركة وتشتت الانتباه (Conners)</option>
              <option value="sensory_profile">استبيان الملف الحسي النمائي (Sensory Profile)</option>
              <option value="developmental_anamnesis">استمارة السوابق النمائية الشاملة للأسرة</option>
            </select>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-slate-400 text-[11px] block">رابط التقييم المباشر والآمن:</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={link}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-teal-300 font-mono"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center space-x-1 space-x-reverse"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">إغلاق</button>
        </div>
      </div>
    </div>
  );
}
