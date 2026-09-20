import React, { useState } from 'react';
import { BookOpen, X, Play, Pause, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DyslexiaForm({ patients = [], isOpen, onClose, onSave, saving }) {
  const [patientId, setPatientId] = useState('');
  
  // Reading timer / speed
  const [wpm, setWpm] = useState(55);
  const [regularWordsPct, setRegularWordsPct] = useState(75);
  const [irregularWordsPct, setIrregularWordsPct] = useState(60);
  const [pseudowordsPct, setPseudowordsPct] = useState(50);
  const [phonologyScore, setPhonologyScore] = useState(12);

  // Spelling error types
  const [errorTypes, setErrorTypes] = useState({
    confusions: true, // b/d, p/q, ف/ق
    inversions: true, // arbre -> arber
    omissions: false,
    additions: false,
  });

  const getSubtype = () => {
    if (pseudowordsPct < 70 && irregularWordsPct >= 75) {
      return { title: "Dyslexie Phonologique (عسر قراءة فونولوجي)", desc: "Déficit prédominant de la voie d'assemblage / conversion graphème-phonème." };
    } else if (irregularWordsPct < 70 && pseudowordsPct >= 75) {
      return { title: "Dyslexie de Surface (عسر قراءة بصري)", desc: "Déficit de la voie d'adressage / lexique orthographique visuel." };
    } else if (pseudowordsPct < 70 && irregularWordsPct < 70) {
      return { title: "Dyslexie Mixte (عسر قراءة مختلط)", desc: "Atteinte conjointe des voies d'assemblage et d'adressage." };
    }
    return { title: "Difficultés de Fluence / Décodage Modéré", desc: "Automatisation de la lecture fragile nécessitant entraînement." };
  };

  if (!isOpen) return null;

  const profile = getSubtype();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-fuchsia-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                تقييم عسر القراءة والكتابة (Dyslexie / Dysorthographie)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                فحص سرعة القراءة (Fluence)، دقة فك التشفير الصوتي والكلمات الشاذة، وتحديد النمط
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-bold text-fuchsia-300">
              Vitesse : <span className="text-lg font-black text-white">{wpm}</span> M/Min
            </div>
          </div>
        </div>

        {/* Patient Select */}
        <div className="shrink-0 space-y-1">
          <label className="text-xs font-bold text-slate-300">Sélectionner le Patient :</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:ring-2 focus:ring-fuchsia-500"
          >
            <option value="">-- Choisir un patient --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} ({p.phone || 'Sans tél'})
              </option>
            ))}
          </select>
        </div>

        {/* Metrics Form Body */}
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {/* Subtype Banner */}
          <div className="p-3.5 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 space-y-1">
            <div className="text-xs font-extrabold text-fuchsia-300 flex items-center space-x-1.5 space-x-reverse">
              <AlertTriangle className="w-4 h-4" />
              <span>Profil Diagnostique Déduit : {profile.title}</span>
            </div>
            <p className="text-[11px] text-slate-300">{profile.desc}</p>
          </div>

          {/* Reading Speed Slider */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-white">سرعة القراءة بالكلمات في الدقيقة (Mots / Minute) :</span>
              <span className="text-fuchsia-400 font-mono text-sm">{wpm} M/Min</span>
            </div>
            <input
              type="range"
              min="20"
              max="160"
              value={wpm}
              onChange={(e) => setWpm(parseInt(e.target.value, 10))}
              className="w-full accent-fuchsia-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>بطيء جداً (20)</span>
              <span>متوسط للأطفال (80)</span>
              <span>طلاقة طبيعية (140+)</span>
            </div>
          </div>

          {/* Decoding Percentages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-300">الكلمات المنتظمة (%)</div>
              <input
                type="number"
                min="0"
                max="100"
                value={regularWordsPct}
                onChange={(e) => setRegularWordsPct(parseInt(e.target.value || 0, 10))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono font-bold"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-300">الكلمات الشاذة (%)</div>
              <input
                type="number"
                min="0"
                max="100"
                value={irregularWordsPct}
                onChange={(e) => setIrregularWordsPct(parseInt(e.target.value || 0, 10))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono font-bold"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-300">أشباه الكلمات (Pseudo-mots)</div>
              <input
                type="number"
                min="0"
                max="100"
                value={pseudowordsPct}
                onChange={(e) => setPseudowordsPct(parseInt(e.target.value || 0, 10))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono font-bold"
              />
            </div>
          </div>

          {/* Spelling Errors Checklist */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300">أنماط الأخطاء الإملائية والكتابية الملاحظة :</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { k: 'confusions', lbl: 'خلط الحروف المتشابهة (ب/ت/ث، ف/ق)' },
                { k: 'inversions', lbl: 'قلب الحروف والمقاطع (عكس الترتيب)' },
                { k: 'omissions', lbl: 'حذف الحروف والمدود' },
                { k: 'additions', lbl: 'إضافة أحرف ومقاطع زائدة' },
              ].map((err) => (
                <label key={err.k} className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={errorTypes[err.k]}
                    onChange={(e) => setErrorTypes({ ...errorTypes, [err.k]: e.target.checked })}
                    className="rounded border-slate-700 text-fuchsia-600 focus:ring-fuchsia-500 w-4 h-4"
                  />
                  <span className="text-slate-300">{err.lbl}</span>
                </label>
              ))}
            </div>
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
            onClick={() => onSave(patientId, {
              wpm,
              regular_words_pct: regularWordsPct,
              irregular_words_pct: irregularWordsPct,
              pseudowords_pct: pseudowordsPct,
              phonology_score: phonologyScore,
              error_types: errorTypes,
            })}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-fuchsia-500/25 transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Valider & Enregistrer le Bilan Dyslexie'}
          </button>
        </div>
      </div>
    </div>
  );
}
