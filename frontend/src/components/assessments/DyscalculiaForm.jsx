import React, { useState } from 'react';
import { Calculator, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DyscalculiaForm({ patients = [], isOpen, onClose, onSave, saving }) {
  const [patientId, setPatientId] = useState('');
  
  // 4 standard subscales (0 to 10 each)
  const [subitizing, setSubitizing] = useState(6);
  const [numberLine, setNumberLine] = useState(5);
  const [arithmetic, setArithmetic] = useState(5);
  const [problemSolving, setProblemSolving] = useState(4);

  const totalScore = subitizing + numberLine + arithmetic + problemSolving;

  const getSeverity = (score) => {
    if (score >= 32) return { text: "Normale (32-40) / مهارات طبيعية", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
    if (score >= 24) return { text: "Difficultés Légères (24-31) / صعوبات طفيفة", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
    if (score >= 16) return { text: "Dyscalculie Modérée (16-23) / عسر حساب متوسط", color: "bg-orange-500/20 text-orange-300 border-orange-500/40" };
    return { text: "Dyscalculie Sévère (0-15) / عسر حساب شديد", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
  };

  if (!isOpen) return null;

  const severity = getSeverity(totalScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                كشف عسر الحساب والمنطق الرياضي (Dyscalculie)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تقييم الإدراك العددي الفوري (Subitizing)، خط الأعداد، العمليات الحسابية وحل المشكلات
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-bold text-emerald-300">
              Score Total : <span className="text-lg font-black text-white">{totalScore}</span> / 40
            </div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${severity.color}`}>
              {severity.text}
            </span>
          </div>
        </div>

        {/* Patient Select */}
        <div className="shrink-0 space-y-1">
          <label className="text-xs font-bold text-slate-300">Sélectionner le Patient :</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- Choisir un patient --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} ({p.phone || 'Sans tél'})
              </option>
            ))}
          </select>
        </div>

        {/* 4 Sliders Form */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {[
            {
              id: 'subitizing',
              label: '1. الإدراك العددي الفوري والتقدير الكمي (Subitizing & Énumération)',
              val: subitizing,
              setter: setSubitizing,
              desc: 'القدرة على إدراك كميات المجموعات الصغيرة بصرياً دون عد مباشر.',
            },
            {
              id: 'numberLine',
              label: '2. خط الأعداد والتمثيل المكاني للأرقام (Ligne Numérique Mentale)',
              val: numberLine,
              setter: setNumberLine,
              desc: 'تحديد موقع الأعداد على الخط، الترتيب التصاعدي والتنازلي، والمقارنة.',
            },
            {
              id: 'arithmetic',
              label: '3. العمليات الحسابية واسترجاع الحقائق العددية (Faits Arithmétiques)',
              val: arithmetic,
              setter: setArithmetic,
              desc: 'الجمع، الطرح، استرجاع جدول الضرب، والحساب الذهني السريع.',
            },
            {
              id: 'problemSolving',
              label: '4. حل المسائل اللفظية والتفكير المنطقي (Résolution de Problèmes)',
              val: problemSolving,
              setter: setProblemSolving,
              desc: 'فهم صياغة المسألة، استخراج المعطيات الرياضية، وتطبيق الخطوات المنطقية.',
            },
          ].map((item) => (
            <div key={item.id} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-white">{item.label}</span>
                <span className="text-emerald-400 font-mono text-sm">{item.val} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={item.val}
                onChange={(e) => item.setter(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold"
          >
            Annuler
          </button>

          <button
            type="button"
            disabled={!patientId || saving}
            onClick={() => onSave(patientId, {
              subitizing_score: subitizing,
              number_line_score: numberLine,
              arithmetic_score: arithmetic,
              problem_solving_score: problemSolving,
            })}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Valider & Enregistrer le Bilan Dyscalculie'}
          </button>
        </div>
      </div>
    </div>
  );
}
