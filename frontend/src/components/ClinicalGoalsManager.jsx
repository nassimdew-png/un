import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Trash2 } from 'lucide-react';

export default function ClinicalGoalsManager({ patientId }) {
  const [goals, setGoals] = useState([
    { id: 1, title: 'إنتاج الفونيم /r/ في بداية الكلمة بدقة 80%', domain: 'Orthophonie', status: 'in_progress', progress: 70 },
    { id: 2, title: 'الحفاظ على الانتباه المشترك لمدة 5 دقائق متواصلة', domain: 'Psychomotricité', status: 'achieved', progress: 100 },
    { id: 3, title: 'تركيب جملة من 3 عناصر (فاعل + فعل + مفعول)', domain: 'Langage', status: 'in_progress', progress: 50 },
  ]);

  const [newGoal, setNewGoal] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    setGoals(prev => [...prev, {
      id: Date.now(),
      title: newGoal.trim(),
      domain: 'Clinique',
      status: 'in_progress',
      progress: 0,
    }]);
    setNewGoal('');
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          placeholder="أضف هدفاً إجرائياً جديداً للمريض (مثال: نطق صوت السين، التفاعل البصري...)"
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center space-x-1 space-x-reverse"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة هدف</span>
        </button>
      </form>

      <div className="space-y-2.5">
        {goals.map((g) => (
          <div key={g.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1 flex-1 ml-4">
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-white">
                <span className={`w-2 h-2 rounded-full ${g.progress === 100 ? 'bg-emerald-400' : 'bg-teal-400'}`} />
                <span>{g.title}</span>
              </div>
              <div className="text-[10px] text-slate-400">{g.domain} &bull; {g.progress}% منجز</div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
              g.progress === 100 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-teal-500/20 text-teal-300'
            }`}>
              {g.progress === 100 ? '✅ محقق بالكامل' : '⏳ قيد التدريب'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
