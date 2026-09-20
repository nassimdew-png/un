import React, { useState } from 'react';
import { Grid, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function PhonologyMatrix({ patients = [], isOpen, onClose, onSave, saving }) {
  const [patientId, setPatientId] = useState('');
  
  const arabicPhonemes = [
    { code: 'ب', name: 'الباء (b)', group: 'شفتاني' },
    { code: 'ت', name: 'التاء (t)', group: 'أسناني لثوي' },
    { code: 'ث', name: 'الثاء (θ)', group: 'بين أسناني' },
    { code: 'ج', name: 'الجيم (dʒ)', group: 'غاري' },
    { code: 'ح', name: 'الحاء (ħ)', group: 'حلقي' },
    { code: 'خ', name: 'الخاء (x)', group: 'طبقي خلفي' },
    { code: 'د', name: 'الدال (d)', group: 'أسناني لثوي' },
    { code: 'ذ', name: 'الذال (ð)', group: 'بين أسناني' },
    { code: 'ر', name: 'الراء (r)', group: 'لثوي تكراري' },
    { code: 'ز', name: 'الزاي (z)', group: 'لثوي صفيري' },
    { code: 'س', name: 'السين (s)', group: 'لثوي صفيري' },
    { code: 'ش', name: 'الشين (ʃ)', group: 'غاري صفيري' },
    { code: 'ص', name: 'الصاد (sˁ)', group: 'مفخم صفيري' },
    { code: 'ض', name: 'الضاد (dˁ)', group: 'مفخم أسناني' },
    { code: 'ط', name: 'الطاء (tˁ)', group: 'مفخم أسناني' },
    { code: 'ظ', name: 'الظاء (ðˁ)', group: 'مفخم بين أسناني' },
    { code: 'ع', name: 'العين (ʕ)', group: 'حلقي' },
    { code: 'غ', name: 'الغين (ɣ)', group: 'لهوي' },
    { code: 'ف', name: 'الفاء (f)', group: 'شفهي أسناني' },
    { code: 'ق', name: 'القاف (q)', group: 'لهوي' },
    { code: 'ك', name: 'الكاف (k)', group: 'طبقي' },
    { code: 'ل', name: 'اللام (l)', group: 'لثوي جانبي' },
    { code: 'م', name: 'الميم (m)', group: 'شفتاني أنفي' },
    { code: 'ن', name: 'النون (n)', group: 'لثوي أنفي' },
    { code: 'هـ', name: 'الهاء (h)', group: 'حنجري' },
    { code: 'و', name: 'الواو (w)', group: 'شفتاني' },
    { code: 'ي', name: 'الياء (j)', group: 'غاري' },
  ];

  // Structure: { 'ب': { initial: 'normal', medial: 'normal', final: 'normal' } }
  const [phonemesData, setPhonemesData] = useState(() => {
    const init = {};
    arabicPhonemes.forEach(p => {
      init[p.code] = { initial: 'normal', medial: 'normal', final: 'normal' };
    });
    return init;
  });

  const handleSetPositionStatus = (phonemeCode, position, status) => {
    setPhonemesData(prev => ({
      ...prev,
      [phonemeCode]: {
        ...(prev[phonemeCode] || { initial: 'normal', medial: 'normal', final: 'normal' }),
        [position]: status
      }
    }));
  };

  const calculateSummary = () => {
    let substitutions = 0;
    let omissions = 0;
    let distortions = 0;
    let totalErrors = 0;

    Object.values(phonemesData).forEach(posData => {
      ['initial', 'medial', 'final'].forEach(pos => {
        const st = posData[pos] || 'normal';
        if (st === 'substitution') { substitutions++; totalErrors++; }
        else if (st === 'omission') { omissions++; totalErrors++; }
        else if (st === 'distortion') { distortions++; totalErrors++; }
      });
    });

    return { substitutions, omissions, distortions, totalErrors };
  };

  if (!isOpen) return null;

  const { substitutions, omissions, distortions, totalErrors } = calculateSummary();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-teal-500/30 rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Grid className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                شبكة الفحص النطقي والفونولوجي (Grille d'Articulation)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تقييم مخارج 27 صوتاً لغوياً في المواقع الثلاثة: بداية (I) / وسط (M) / نهاية الكلمة (F)
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-bold text-teal-300">
              إجمالي الأخطاء : <span className="text-lg font-black text-white">{totalErrors}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              إبدال: <strong className="text-amber-400">{substitutions}</strong> &bull; 
              حذف: <strong className="text-rose-400">{omissions}</strong> &bull; 
              تشويه: <strong className="text-purple-400">{distortions}</strong>
            </div>
          </div>
        </div>

        {/* Patient Select */}
        <div className="shrink-0 space-y-1">
          <label className="text-xs font-bold text-slate-300">Sélectionner le Patient :</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-teal-500"
          >
            <option value="">-- Choisir un patient --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} ({p.phone || 'Sans tél'})
              </option>
            ))}
          </select>
        </div>

        {/* Grid List */}
        <div className="overflow-y-auto flex-1 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {arabicPhonemes.map((p) => {
              const posData = phonemesData[p.code] || { initial: 'normal', medial: 'normal', final: 'normal' };
              const hasError = posData.initial !== 'normal' || posData.medial !== 'normal' || posData.final !== 'normal';

              return (
                <div
                  key={p.code}
                  className={`p-3 rounded-2xl border transition-all space-y-2 ${
                    hasError ? 'bg-rose-500/10 border-rose-500/40' : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-white font-mono">{p.code}</span>
                    <span className="text-[10px] text-slate-400">{p.name}</span>
                  </div>

                  {/* 3 Positions */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                    {[
                      { key: 'initial', label: 'بداية (Initiale)' },
                      { key: 'medial', label: 'وسط (Médiale)' },
                      { key: 'final', label: 'نهاية (Finale)' },
                    ].map((pos) => {
                      const currentStatus = posData[pos.key] || 'normal';
                      return (
                        <div key={pos.key} className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">{pos.label}</span>
                          <div className="flex items-center space-x-1 space-x-reverse">
                            {[
                              { k: 'normal', lbl: 'سليم', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500' },
                              { k: 'substitution', lbl: 'إبدال', cls: 'bg-amber-500/20 text-amber-300 border-amber-500' },
                              { k: 'omission', lbl: 'حذف', cls: 'bg-rose-500/20 text-rose-300 border-rose-500' },
                              { k: 'distortion', lbl: 'تشويه', cls: 'bg-purple-500/20 text-purple-300 border-purple-500' },
                            ].map((btn) => (
                              <button
                                key={btn.k}
                                type="button"
                                onClick={() => handleSetPositionStatus(p.code, pos.key, btn.k)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
                                  currentStatus === btn.k
                                    ? `${btn.cls} shadow-sm`
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-200'
                                }`}
                              >
                                {btn.lbl}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
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
            onClick={() => onSave(patientId, { phonemes: phonemesData })}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Valider & Enregistrer la Grille'}
          </button>
        </div>
      </div>
    </div>
  );
}
