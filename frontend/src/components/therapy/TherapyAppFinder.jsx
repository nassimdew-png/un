import React, { useState } from 'react';
import { Gamepad2, Brain, Sparkles, Star, Award, Play } from 'lucide-react';

export default function TherapyAppFinder({ patientId, patientName }) {
  const games = [
    { id: 1, title: 'لعبة تمييز الأصوات ومخارج الحروف', type: 'Orthophonie', icon: '🗣️', level: 'المستوى 1', desc: 'تمييز الفونيمات السمعية عبر صور تفاعلية' },
    { id: 2, title: 'مطابقة الأشكال والذاكرة البصرية', type: 'Cognitive', icon: '🧠', level: 'المستوى 2', desc: 'تنشيط الذاكرة العاملة وسرعة المعالجة' },
    { id: 3, title: 'التنظيم الحركي الدقيق والتوافق البصري', type: 'Psychomotricité', icon: '✋', level: 'المستوى 1', desc: 'تمارين تتبع المسارات الدقيقة والتآزر الحركي' },
  ];

  return (
    <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
            <Gamepad2 className="w-5 h-5 text-indigo-400" />
            <span>التطبيقات والألعاب العلاجية الرقمية (Digital Therapy Modules)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            أنشطة تفاعلية مدعمة بالذكاء الاصطناعي موجهة للمريض {patientName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {games.map((g) => (
          <div key={g.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-indigo-500/40 transition-all">
            <div className="text-3xl">{g.icon}</div>
            <div>
              <div className="text-xs font-black text-white">{g.title}</div>
              <div className="text-[10px] text-slate-400 mt-1">{g.desc}</div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-indigo-400">{g.level}</span>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1 space-x-reverse"
              >
                <Play className="w-3.5 h-3.5" />
                <span>تشغيل النشاط</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
