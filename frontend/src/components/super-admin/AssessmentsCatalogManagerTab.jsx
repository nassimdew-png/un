import React, { useState } from 'react';
import { Database, Plus, Search, BookOpen, CheckCircle2, Stethoscope, Brain, Layers } from 'lucide-react';

export default function AssessmentsCatalogManagerTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  const catalog = [
    { id: 'wisc5', name: 'مقياس وكسلر لذكاء الأطفال (WISC-V)', category: 'psychology', age_range: '6 - 16 سنة', subtests_count: 10, lang: 'العربية / الفرنسية' },
    { id: 'cars2', name: 'مقياس تقدير التوحد الطفولي (CARS-2)', category: 'psychology', age_range: '2+ سنوات', subtests_count: 15, lang: 'العربية' },
    { id: 'pep3', name: 'الملف النفسي التربوي (PEP-3)', category: 'orthophonie', age_range: '2 - 7 سنوات', subtests_count: 13, lang: 'العربية' },
    { id: 'ecosse', name: 'اختبار فهم التراكيب اللغوية (ÉCOSSE)', category: 'orthophonie', age_range: '4 - 11 سنة', subtests_count: 80, lang: 'الفرنسية / الجزائرية' },
    { id: 'eda', name: 'بطارية الفحص السريري لتعلم القراءة (EDA)', category: 'orthophonie', age_range: '6 - 12 سنة', subtests_count: 8, lang: 'الفرنسية' },
    { id: 'vineland2', name: 'مقياس السلوك التكيفي (Vineland-II)', category: 'psychology', age_range: 'كافة الأعمار', subtests_count: 5, lang: 'العربية' },
    { id: 'conners3', name: 'مقياس فرط الحركة وتشتت الانتباه (Conners-3)', category: 'psychology', age_range: '6 - 18 سنة', subtests_count: 6, lang: 'العربية' },
    { id: 'brunet_lezine', name: 'مقياس التطور النفسي الحركي (Brunet-Lézine-R)', category: 'psychomotricite', age_range: '0 - 30 شهر', subtests_count: 4, lang: 'الفرنسية' },
  ];

  const filtered = catalog.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCat ? t.category === selectedCat : true;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">بنك المقاييس والاختبارات السريرية المعيارية</h2>
            <p className="text-xs text-slate-400">قوالب المقاييس النفسية والأرطوفونية المعيارية المتاحة لكافة العيادات</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert('إضافة مقياس معياري جديد')}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-purple-600/25 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مقياس جديد</span>
        </button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم المقياس أو الروائز..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">كافة التخصصات (الكل)</option>
          <option value="orthophonie">الأرطوفونيا واضطرابات الكلام</option>
          <option value="psychology">علم النفس والنمو الإدراكي</option>
          <option value="psychomotricite">العلاج النفسي الحركي</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {item.category}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{item.age_range}</span>
              </div>
              <h4 className="text-sm font-black text-white">{item.name}</h4>
              <p className="text-xs text-slate-400">اللغات المعتمدة: {item.lang}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">{item.subtests_count} بنود / اختبارات فرعية</span>
              <span className="text-emerald-400 font-bold">🟢 نشط بالمنصة</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
