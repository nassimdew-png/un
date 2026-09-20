import React, { useState, useEffect } from 'react';
import { 
  Shapes, 
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
  Layers, 
  Eye, 
  Timer, 
  TrendingUp,
  Sliders,
  Check
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

const REY_18_ELEMENTS = [
  { id: 1, nameAr: '1. الصليب الخارجي الأيسر', nameFr: 'Croix extérieure' },
  { id: 2, nameAr: '2. المستطيل المركزي الكبير (الهيكل الأساسي)', nameFr: 'Grand rectangle d\'armature' },
  { id: 3, nameAr: '3. القطران المتقاطعان (صليب سانت أندري)', nameFr: 'Croix de Saint-André' },
  { id: 4, nameAr: '4. الخط الأفقي المتوسط للمستطيل', nameFr: 'Médiane horizontale' },
  { id: 5, nameAr: '5. الخط العمودي المتوسط للمستطيل', nameFr: 'Médiane verticale' },
  { id: 6, nameAr: '6. المستطيل الداخلي الصغير', nameFr: 'Petit rectangle intérieur' },
  { id: 7, nameAr: '7. القطعة الأفقية الصغيرة فوق المستطيل الداخلي', nameFr: 'Petit segment horizontal' },
  { id: 8, nameAr: '8. الخطوط الأربعة المتوازية في الزاوية العلوية', nameFr: 'Quatre lignes parallèles' },
  { id: 9, nameAr: '9. المثلث القائم العلوي الأيمن', nameFr: 'Triangle rectangle supérieur' },
  { id: 10, nameAr: '10. القطعة العمودية الصغيرة داخل المثلث', nameFr: 'Petite perpendiculaire' },
  { id: 11, nameAr: '11. الدائرة بالنقاط الثلاث في الزاوية السفلية', nameFr: 'Cercle avec trois points' },
  { id: 12, nameAr: '12. الخطوط الخمسة المتوازية في الزاوية السفلية', nameFr: 'Cinq traits parallèles' },
  { id: 13, nameAr: '13. المثلث الجانبي الملتصق بالجهة اليمنى', nameFr: 'Triangle côté droit' },
  { id: 14, nameAr: '14. المعين في الطرف الأيمن للمثلث', nameFr: 'Losange d\'extrémité' },
  { id: 15, nameAr: '15. القطعة الأفقية داخل المثلث الجانبي', nameFr: 'Segment dans triangle' },
  { id: 16, nameAr: '16. الامتداد العمودي السفلي للمستطيل', nameFr: 'Prolongement vertical' },
  { id: 17, nameAr: '17. الصليب السفلي الأيسر', nameFr: 'Croix inférieure gauche' },
  { id: 18, nameAr: '18. المربع السفلي الأيسر بالقطر الداخلي', nameFr: 'Carré inférieur gauche' },
];

const REY_DRAWING_TYPES = [
  { id: 1, labelAr: 'النوع I: بناء منظم على الهيكل المركزي (Armature principale)', desc: 'رسم المستطيل المركزي أولاً ثم إدراج التفاصيل داخله وخارجه (النمط الأكثر نضجاً)' },
  { id: 2, labelAr: 'النوع II: تفاصيل مدمجة في الهيكل (Détails englobés)', desc: 'البدء بتفصيل ملتصق بالهيكل ثم رسم المستطيل وإكمال الباقي' },
  { id: 3, labelAr: 'النوع III: رسم المحيط الخارجي العام أولاً (Contour général)', desc: 'رسم الإطار العام للشكل دون إدراك الهيكل المركزي' },
  { id: 4, labelAr: 'النوع IV: تجاور وتجميع متفرق للتفاصيل (Juxtaposition)', desc: 'رسم عنصر بجوار عنصر كقطع البازل دون تنظيم مسبق' },
  { id: 5, labelAr: 'النوع V: تفاصيل مبعثرة على خلفية غير واضحة (Fond confus)', desc: 'رسم خطوط وتفاصيل غير مترابطة على نموذج مشوه' },
  { id: 6, labelAr: 'النوع VI: اختزال إلى مخطط مألوف كمنزل (Schéma familier)', desc: 'تحويل الشكل المعقد إلى رسم بيت أو سفينة' },
  { id: 7, labelAr: 'النوع VII: خربشة عشوائية غير مترابطة (Gribouillage)', desc: 'خربشة بدائية تفتقر لأي تمثيل مكاني' },
];

export default function ReyFigureRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [activePhase, setActivePhase] = useState('copy'); // 'copy' | 'recall'
  
  // Element Scores: array of 18 items (0, 0.5, 1, 2)
  const [copyScores, setCopyScores] = useState(() => Array(18).fill(2));
  const [recallScores, setRecallScores] = useState(() => Array(18).fill(1.5));
  const [copyTime, setCopyTime] = useState(150);
  const [recallTime, setRecallTime] = useState(120);
  const [drawingType, setDrawingType] = useState(1);

  const [reyResult, setReyResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeRey();
  }, [copyScores, recallScores, copyTime, recallTime, drawingType]);

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

  const recomputeRey = async () => {
    try {
      const resp = await clinicalTestApi.runReyFigure({
        copy_elements: copyScores,
        recall_elements: recallScores,
        copy_time_seconds: copyTime,
        recall_time_seconds: recallTime,
        drawing_type: drawingType,
      });
      setReyResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('Rey figure calculation error:', e);
    }
  };

  const setScore = (index, val) => {
    if (activePhase === 'copy') {
      setCopyScores((prev) => {
        const next = [...prev];
        next[index] = val;
        return next;
      });
    } else {
      setRecallScores((prev) => {
        const next = [...prev];
        next[index] = val;
        return next;
      });
    }
    soundEngine.playTone(450 + val * 100, 0.04);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط فحص شكل ري المعقد بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'REY_FCR',
        calculated_total_score: reyResult?.copy_score || 0,
        subscale_scores: {
          copy_score: { name: 'درجة النقل (Copie)', raw: `${reyResult?.copy_score} / 36`, standard: `P=${reyResult?.copy_percentile}%`, interpretation: reyResult?.drawing_type_label_ar },
          recall_score: { name: 'درجة التذكر (Mémoire)', raw: `${reyResult?.recall_score} / 36`, standard: `P=${reyResult?.recall_percentile}%` },
          retention_rate: { name: 'نسبة الاحتفاظ البصري المكاني', raw: `${reyResult?.retention_rate_pct}%` },
          drawing_type: { name: 'نمط التخطيط والتشييد', raw: `Type ${drawingType}` },
        },
        raw_responses: { copy_scores: copyScores, recall_scores: recallScores, copy_time: copyTime, recall_time: recallTime, drawing_type: drawingType },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم شكل ري');
    } finally {
      setSaving(false);
    }
  };

  const currentScores = activePhase === 'copy' ? copyScores : recallScores;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-teal-600/30">
            <Shapes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                اختبار الشكل المعقد لـ ري (Figure de Rey - Type A DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Osterrieth & Rey
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              فحص التنظيم البصري المكاني، التخطيط والبراكسيا البنائية في مرحلتي النقل (Copie) والتذكر (Mémoire).
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
          {/* Patient Selector */}
          {!patientId ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300">
                <User className="w-4 h-4 text-teal-400" />
                <span>المفحوص (Patient):</span>
              </div>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="">-- اختر مريضاً من العيادة --</option>
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.phone || '--'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-2 space-x-reverse text-xs text-slate-300">
              <User className="w-4 h-4 text-teal-400" />
              <span className="font-bold">المريض:</span>
              <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
            </div>
          )}

          {/* REAL-TIME REY FIGURE PERFORMANCE COMPARISON BANNER */}
          {reyResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950/30 to-slate-950 border border-teal-500/30 space-y-4 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                {/* Copy Score */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">مرحلة النقل (Copie):</span>
                  <div className="text-2xl font-black font-mono text-teal-400">{reyResult.copy_score} / 36</div>
                  <span className="text-[10px] text-slate-400 block">رتبة {reyResult.copy_percentile}% ({copyTime}s)</span>
                </div>

                {/* Recall Score */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">مرحلة التذكر (Mémoire):</span>
                  <div className="text-2xl font-black font-mono text-indigo-400">{reyResult.recall_score} / 36</div>
                  <span className="text-[10px] text-slate-400 block">رتبة {reyResult.recall_percentile}% ({recallTime}s)</span>
                </div>

                {/* Retention % */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">نسبة الاحتفاظ البصري:</span>
                  <div className="text-2xl font-black font-mono text-emerald-400">{reyResult.retention_rate_pct}%</div>
                  <span className="text-[10px] text-slate-400 block">{reyResult.drawing_type_label_ar}</span>
                </div>
              </div>
            </div>
          )}

          {/* PHASE SELECTOR & DRAWING TYPE */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setActivePhase('copy')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                    activePhase === 'copy'
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  1. تنقيط مرحلة النقل المباشر (Copie - Max 36)
                </button>

                <button
                  type="button"
                  onClick={() => setActivePhase('recall')}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                    activePhase === 'recall'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  2. تنقيط مرحلة التذكر بعد كمون (Mémoire - Max 36)
                </button>
              </div>

              {/* Rey Drawing Type Dropdown */}
              <div className="flex items-center space-x-2 space-x-reverse text-xs">
                <span className="text-slate-400 font-bold">نمط الرسم (Type):</span>
                <select
                  value={drawingType}
                  onChange={(e) => setDrawingType(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
                >
                  {REY_DRAWING_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.labelAr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 18-ELEMENT INTERACTIVE SCORING GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REY_18_ELEMENTS.map((el, idx) => {
                const currentScore = currentScores[idx] !== undefined ? currentScores[idx] : 2;
                return (
                  <div
                    key={el.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-white block">{el.nameAr}</span>
                        <span className="text-[10px] text-slate-400 block italic font-serif" dir="ltr">{el.nameFr}</span>
                      </div>
                      <span className="font-mono text-teal-400 font-black text-xs px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/20 shrink-0">
                        {currentScore} نقطة
                      </span>
                    </div>

                    {/* 4 Score Options Pill Buttons */}
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      {[
                        { score: 0, label: '0: غائب' },
                        { score: 0.5, label: '0.5: مشوه ومزاح' },
                        { score: 1, label: '1: مشوه / مزاح' },
                        { score: 2, label: '2: سليم وموضع' },
                      ].map((btn) => (
                        <button
                          key={btn.score}
                          type="button"
                          onClick={() => setScore(idx, btn.score)}
                          className={`py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                            currentScore === btn.score
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتشخيص النيوروبسيكولوجي (Synthèse Figure de Rey):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-teal-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setCopyScores(Array(18).fill(2));
                setRecallScores(Array(18).fill(1.5));
                setDrawingType(1);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للشكل السليم</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-indigo-600 to-cyan-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-teal-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج شكل ري...' : 'اعتماد تقييم شكل ري Figure de Rey 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-teal-500/20 border border-teal-500/30 mx-auto flex items-center justify-center text-teal-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق نتائج شكل ري المعقد بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل درجات النقل والتذكر ومعدل الاستبقاء البصري ونمط الرسم المعتمد.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">درجة النقل:</span>
              <strong className="text-teal-400 text-base font-black font-mono">
                {reyResult?.copy_score} / 36
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">درجة التذكر:</span>
              <strong className="text-indigo-400 text-base font-black font-mono">
                {reyResult?.recall_score} / 36
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">نسبة الاحتفاظ:</span>
              <span className="text-emerald-400 font-mono font-bold">{reyResult?.retention_rate_pct}%</span>
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
