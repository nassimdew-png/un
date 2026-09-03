import React from 'react';
import { ClipboardList, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function HomeworkPlanCard({ plan, onToggleItem }) {
  if (!plan) return null;

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold text-white flex items-center space-x-2 space-x-reverse">
          <ClipboardList className="w-4 h-4 text-emerald-400" />
          <span>{plan.title || 'خطة التمارين المنزلية للأسبوع'}</span>
        </h5>
        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          {plan.status || 'نشط'}
        </span>
      </div>
      <p className="text-xs text-slate-300">{plan.instructions || 'ممارسة تمارين التنفس والنطق يومياً لمدة 10 دقائق.'}</p>
    </div>
  );
}
