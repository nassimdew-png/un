import React, { useState, useEffect } from 'react';
import { 
  Languages, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  FileText, 
  Printer, 
  RotateCcw, 
  Save, 
  AlertTriangle, 
  User, 
  Activity, 
  X, 
  ShieldAlert, 
  Volume2, 
  Layers, 
  Check, 
  Sliders
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

const NEEL_SUBTESTS = [
  { key: 'phonology', nameAr: '1. الفونولوجيا والنطق (Phonologie)', nameFr: 'Phonologie & Articulation', maxRaw: 20, desc: 'التمييز السمعي والنطق السليم للأصوات والمقاطع' },
  { key: 'lexical_comp', nameAr: '2. الفهم المعجمي والمفردات (Vocabulaire en réception)', nameFr: 'Compréhension lexicale', maxRaw: 20, desc: 'تحديد الصور والمدلولات الدلالية المناسبة' },
  { key: 'syntactic_comp', nameAr: '3. الفهم التركيبي للجمل (Compréhension syntaxique)', nameFr: 'Compréhension syntaxique', maxRaw: 15, desc: 'فهم التراكيب النحوية المعقدة والمبني للمجهول' },
  { key: 'naming', nameAr: '4. التسمية الشفهية للصور (Dénomination)', nameFr: 'Dénomination d\'images', maxRaw: 20, desc: 'استرجاع المفردات والتسمية المعجمية التعبيرية الفورية' },
  { key: 'sentence_rep', nameAr: '5. إعادة إنتاج الجمل (Répétition de phrases)', nameFr: 'Répétition de phrases', maxRaw: 10, desc: 'الذاكرة العاملة اللفظية وتكامل القواعد التركيبية' },
];

export default function NeelRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [rawScores, setRawScores] = useState({
    phonology: 16,
    lexical_comp: 17,
    syntactic_comp: 12,
    naming: 15,
    sentence_rep: 8,
  });

  const [neelResult, setNeelResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeNeel();
  }, [rawScores]);

  const fetchPatients = async () => {
    try {
      const resp = await patientApi.list({ per_page: 100 });
      const pts = resp.patients?.data || resp.patients || resp.data || [];
      setPatientsList(pts);
      if (pts.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pts[0].id);
      }
    } catch (e) {
      console.error('Failed to load patients:', e);
    }
  };

  const recomputeNeel = async () => {
    try {
      const resp = await clinicalTestApi.runNeel(rawScores);
      setNeelResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('N-EEL calculation error:', e);
    }
  };

  const handleScoreChange = (key, val, maxRaw) => {
    const num = Math.max(0, Math.min(maxRaw, Number(val)));
    setRawScores((prev) => ({ ...prev, [key]: num }));
  };

  const setPreset = (type) => {
    if (type === 'normal') {
      setRawScores({ phonology: 18, lexical_comp: 18, syntactic_comp: 13, naming: 17, sentence_rep: 9 });
    } else if (type === 'dld_dysphasia') {
      setRawScores({ phonology: 6, lexical_comp: 8, syntactic_comp: 4, naming: 6, sentence_rep: 2 });
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط فحص N-EEL بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'N_EEL',
        calculated_total_score: neelResult?.mean_standard_score || 10,
        subscale_scores: {
          mean_standard: { name: 'المتوسط المعياري العام', raw: `${neelResult?.mean_standard_score} / 19`, standard: `P=${neelResult?.mean_percentile}%`, interpretation: neelResult?.diagnosis_label_ar },
          phonology: { name: 'الفونولوجيا والنطق', raw: `${rawScores.phonology} / 20`, standard: `NS=${neelResult?.subtests?.phonology?.standard}/19` },
          lexical_comp: { name: 'الفهم المعجمي', raw: `${rawScores.lexical_comp} / 20`, standard: `NS=${neelResult?.subtests?.lexical_comp?.standard}/19` },
          syntactic_comp: { name: 'الفهم التركيبي', raw: `${rawScores.syntactic_comp} / 15`, standard: `NS=${neelResult?.subtests?.syntactic_comp?.standard}/19` },
          naming: { name: 'التسمية الشفهية', raw: `${rawScores.naming} / 20`, standard: `NS=${neelResult?.subtests?.naming?.standard}/19` },
          sentence_rep: { name: 'إعادة الجمل', raw: `${rawScores.sentence_rep} / 10`, standard: `NS=${neelResult?.subtests?.sentence_rep?.standard}/19` },
          dld_flag: { name: 'مؤشر اضطراب اللغة النمائي (TDL)', raw: neelResult?.dld_suspected ? 'إيجابي ⚠️' : 'سلبي ✅' },
        },
        raw_responses: rawScores,
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم N-EEL');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-orange-600/30">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                بطارية ن-إيل لتقييم اللغة الشفهية (N-EEL DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-300 border border-orange-500/20">
                Chevrie-Muller & Plaza
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              الفحص الأرطوفوني المعياري للغة الشفهية (3 إلى 8 سنوات): الفونولوجيا، الفهم، التسمية، وإعادة الجمل بالدرجات المعيارية (1-19).
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!savedAssessment ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Patient Selector & Preset Demos */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {!patientId ? (
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300">
                <User className="w-4 h-4 text-orange-400" />
                <span>المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- اختر طفلاً من العيادة --</option>
                  {patientsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.phone || '--'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-300">
                <User className="w-4 h-4 text-orange-400" />
                <span className="font-bold">المريض:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Demo Presets */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setPreset('normal')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
              >
                نمو لغوي طبيعي
              </button>
              <button
                type="button"
                onClick={() => setPreset('dld_dysphasia')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/30"
              >
                اشتباه ديسفازيا / TDL
              </button>
            </div>
          </div>

          {/* REAL-TIME N-EEL LANGUAGE PROFILE HERO BANNER */}
          {neelResult && (
            <div className={`p-5 rounded-3xl border space-y-4 shadow-xl transition-all ${
              neelResult.dld_suspected
                ? 'bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950 border-rose-500/50'
                : 'bg-gradient-to-r from-slate-950 via-orange-950/30 to-slate-950 border-orange-500/30'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className={`px-5 py-2.5 rounded-2xl font-mono font-black text-2xl shadow-lg ${
                    neelResult.dld_suspected
                      ? 'bg-rose-600 text-white shadow-rose-600/30'
                      : 'bg-orange-600 text-white shadow-orange-600/30'
                  }`}>
                    {neelResult.mean_standard_score} / 19
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">التشخيص الأرطوفوني المعتمد:</span>
                    <strong className="text-base font-black text-white block">
                      {neelResult.diagnosis_label_ar}
                    </strong>
                    <span className="text-xs text-slate-400">
                      الرتبة المئينية العامة: <strong className="text-amber-400 font-mono font-bold">{neelResult.mean_percentile}%</strong> | مجالات الهشاشة: <strong className="text-rose-400 font-mono font-bold">{neelResult.deficits_count} أبعاد</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5 SUBTEST RAW SCORE SLIDERS & LIVE STANDARD NOTE DISPLAY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NEEL_SUBTESTS.map((sub) => {
              const currentRaw = rawScores[sub.key] || 0;
              const subMeta = neelResult?.subtests?.[sub.key];
              const stdNote = subMeta?.standard || 10;
              const isDeficit = stdNote <= 6;

              return (
                <div
                  key={sub.key}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDeficit ? 'bg-rose-950/20 border-rose-500/40' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-bold text-white block">{sub.nameAr}</span>
                      <span className="text-[10px] text-slate-400 block">{sub.desc}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-mono font-black text-xs px-2.5 py-1 rounded-xl border block ${
                        isDeficit
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-orange-500/10 text-orange-300 border-orange-500/20'
                      }`}>
                        الدرجة المعيارية: {stdNote} / 19
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                        الخام: {currentRaw} / {sub.maxRaw}
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={sub.maxRaw}
                    value={currentRaw}
                    onChange={(e) => handleScoreChange(sub.key, e.target.value, sub.maxRaw)}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />

                  <div className="flex justify-between text-[9px] text-slate-500 font-medium px-1 mt-1">
                    <span>0: أدنى درجة</span>
                    <span>{Math.round(sub.maxRaw / 2)}: متوسط</span>
                    <span>{sub.maxRaw}: الدرجة التامة</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير الأرطوفوني (Synthèse N-EEL):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-orange-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPreset('normal')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للأداء الطبيعي</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-indigo-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-xl shadow-orange-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج N-EEL...' : 'اعتماد تقرير فحص N-EEL 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-orange-500/20 border border-orange-500/30 mx-auto flex items-center justify-center text-orange-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق نتائج بطارية N-EEL بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تحويل الدرجات الخام إلى درجات معيارية وتسجيل البروفايل اللغوي الأرطوفوني.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">المتوسط المعياري:</span>
              <strong className="text-orange-400 text-base font-black font-mono">
                {neelResult?.mean_standard_score} / 19
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التشخيص:</span>
              <strong className="text-white font-bold">{neelResult?.diagnosis_label_ar}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الرتبة المئينية:</span>
              <span className="text-amber-400 font-mono font-bold">{neelResult?.mean_percentile}%</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={clinicalTestApi.bilanPdfUrl(savedAssessment.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 space-x-reverse transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>📄 إدراج النتيجة في تقرير الحصيلة السريرية (Bilan PDF A4) 🖨️</span>
            </a>

            <button
              type="button"
              onClick={() => setSavedAssessment(null)}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center space-x-1.5 space-x-reverse transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تطبيق فحص جديد</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
