import React, { useState } from 'react';
import { Palette, Sparkles, Image, Printer, Download, Eye, Plus } from 'lucide-react';

export default function ClinicalFlashcardsBank({ patient, tenant, practitioner }) {
  const [category, setCategory] = useState('articulation'); // articulation, vocabulary, emotions, social_stories

  const cards = [
    { id: 1, title: 'صوت الراء (ر)', ar: 'رمان', phonetic: '[r]', image: '🍎', category: 'articulation' },
    { id: 2, title: 'صوت السين (س)', ar: 'سيارة', phonetic: '[s]', image: '🚗', category: 'articulation' },
    { id: 3, title: 'صوت الشين (ش)', ar: 'شجرة', phonetic: '[ʃ]', image: '🌳', category: 'articulation' },
    { id: 4, title: 'المشاعر - الفرح', ar: 'فرحان / سعيد', phonetic: 'Heureux', image: '😊', category: 'emotions' },
    { id: 5, title: 'المشاعر - الغضب', ar: 'غضبان', phonetic: 'En colère', image: '😡', category: 'emotions' },
    { id: 6, title: 'المحيط المدرسي', ar: 'محفظة', phonetic: 'Cartable', image: '🎒', category: 'vocabulary' },
  ];

  const filtered = cards.filter(c => category === 'all' || c.category === category);

  return (
    <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
            <Palette className="w-5 h-5 text-pink-400" />
            <span>بنك البطاقات البصرية ووسائل PECS والتخاطب (Flashcards Bank)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            بطاقات بصرية، تمارين نطقية، وقصص اجتماعية مصورة قابلة للطباعة والتخصيص
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center space-x-1.5 space-x-reverse"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة البطاقات 🖨️</span>
        </button>
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        {['articulation', 'emotions', 'vocabulary'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              category === cat ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-300'
            }`}
          >
            {cat === 'articulation' ? '🗣️ مخارج الأصوات' : cat === 'emotions' ? '🎭 المشاعر والتواصل' : '📚 المفردات'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((card) => (
          <div key={card.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 hover:border-pink-500/40 transition-all">
            <div className="text-4xl py-2">{card.image}</div>
            <div className="text-xs font-black text-white">{card.ar}</div>
            <div className="text-[10px] text-pink-400 font-mono">{card.phonetic}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
