import React, { useState } from 'react';
import { Smartphone, CheckCircle2, Copy, ShieldCheck } from 'lucide-react';

export default function GeneratePortalLinkModal({ isOpen, onClose, patient }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const portalUrl = `https://psypro.tech/portal/patient/${patient?.id || 'demo'}?token=secure_portal_access`;

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
            <Smartphone className="w-5 h-5 text-teal-400" />
            <span>بوابة متابعة الولي الذكية (Espace Parents)</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          يمكن للولي الاطلاع على التقارير المعتمدة، مواعيد الجلسات، والتمارين المنزلية المخصصة عبر هذا الرابط الآمن.
        </p>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <span className="text-slate-400 text-[11px] block">رابط البوابة المباشر:</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={portalUrl}
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

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">إغلاق</button>
        </div>
      </div>
    </div>
  );
}
