import React from 'react';
import { Activity, Award, Star, Zap, CheckCircle2 } from 'lucide-react';

export default function BehaviorProgressionView({ patientId }) {
  return (
    <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
            <Activity className="w-5 h-5 text-purple-400" />
            <span>تتبع السلوك ونظام التعزيز الإيجابي (Behavior & Token Economy)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            مراقبة وتيرة السلوكيات المستهدفة، نوبات الغضب، ونقاط التعزيز والتحفيز
          </p>
        </div>
        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          ⭐ 45 نقطة تعزيز
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-400">التواصل البصري المباشر</div>
          <div className="text-xl font-black text-purple-300">85% تحسن</div>
          <div className="text-[10px] text-emerald-400">🟢 زيادة 20% مقارنة بالشهر السابق</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-400">الاستجابة للتعليمات اللفظية</div>
          <div className="text-xl font-black text-teal-300">90% نجاح</div>
          <div className="text-[10px] text-teal-400">🟢 استقرار السلوك التكيفي</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-400">نوبات التململ الحركي</div>
          <div className="text-xl font-black text-amber-300">انخفاض 60%</div>
          <div className="text-[10px] text-emerald-400">🟢 انخفاض ملحوظ أثناء الجلسات</div>
        </div>
      </div>
    </div>
  );
}
