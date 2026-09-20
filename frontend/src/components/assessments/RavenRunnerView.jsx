import React, { useState, useEffect, useRef } from 'react';
import { 
  Grid, 
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
  Timer, 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft,
  Layers,
  Zap,
  Check
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

export default function RavenRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [matrixType, setMatrixType] = useState('CPM'); // 'CPM' (36) | 'SPM' (60)
  const maxItems = matrixType === 'SPM' ? 60 : 36;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const init = {};
    for (let i = 1; i <= 60; i++) init[i] = i % 6 + 1; // Default answers
    return init;
  });

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const [ravenResult, setRavenResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds((prev) => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  useEffect(() => {
    recomputeRaven();
  }, [answers, matrixType]);

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

  // Correct key simulation for CPM (e.g. mock correct key pattern)
  const calculateRawScore = () => {
    let score = 0;
    for (let i = 1; i <= maxItems; i++) {
      // Simulate correct answers matching expected option pattern
      const expected = ((i * 2 + 1) % 6) + 1;
      if (answers[i] === expected || i <= 24) score++;
    }
    return Math.min(maxItems, Math.max(0, score));
  };

  const recomputeRaven = async () => {
    const raw = calculateRawScore();
    try {
      const resp = await clinicalTestApi.runRaven({
        matrix_type: matrixType,
        raw_score: raw,
        chronological_age_years: 8,
      });
      setRavenResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('Raven calculation error:', e);
    }
  };

  const handleSelectOption = (opt) => {
    const itemId = currentIndex + 1;
    setAnswers((prev) => ({ ...prev, [itemId]: opt }));
    soundEngine.playTone(550 + opt * 30, 0.04);

    if (currentIndex < maxItems - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مفحوص لربط اختبار رافن للمصفوفات بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: matrixType === 'SPM' ? 'RAVEN_SPM' : 'RAVEN_CPM',
        calculated_total_score: ravenResult?.raw_score || 0,
        subscale_scores: {
          raw_score: { name: 'الدرجة الخام للمصفوفات', raw: `${ravenResult?.raw_score} / ${ravenResult?.max_score}`, standard: `IQ=${ravenResult?.iq_equivalent}`, interpretation: ravenResult?.grade_label_ar },
          percentile: { name: 'الرتبة المئينية', raw: `${ravenResult?.percentile}%` },
          cognitive_grade: { name: 'الرتبة المعرفية (Grade)', raw: ravenResult?.grade },
          completion_time: { name: 'زمن الإنجاز', raw: `${timerSeconds} ثانية` },
        },
        raw_responses: { answers, type: matrixType, time_seconds: timerSeconds },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم مصفوفات رافن');
    } finally {
      setSaving(false);
    }
  };

  const currentItemNumber = currentIndex + 1;
  const currentSet = matrixType === 'CPM' 
    ? (currentItemNumber <= 12 ? 'Set A' : currentItemNumber <= 24 ? 'Set Ab' : 'Set B')
    : (currentItemNumber <= 12 ? 'Set A' : currentItemNumber <= 24 ? 'Set B' : currentItemNumber <= 36 ? 'Set C' : currentItemNumber <= 48 ? 'Set D' : 'Set E');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                مصفوفات رافن المتتابعة للذكاء غير اللفظي (Raven Matrices DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Raven Progressive
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              قياس الاستدلال المنطقي المجرد والذكاء السائل (Fluid Intelligence - Gf) عبر المصفوفات المتتابعة.
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
          {/* Top Bar: Matrix Type & Stopwatch & Patient Selector */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {/* Version Switcher */}
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <button
                type="button"
                onClick={() => { setMatrixType('CPM'); setCurrentIndex(0); }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  matrixType === 'CPM'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                النسخة الملونة للأطفال (CPM - 36 بند)
              </button>
              <button
                type="button"
                onClick={() => { setMatrixType('SPM'); setCurrentIndex(0); }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  matrixType === 'SPM'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                النسخة القياسية للبالغين (SPM - 60 بند)
              </button>
            </div>

            {/* Stopwatch */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-indigo-300 font-mono font-bold text-xs border border-slate-700 flex items-center space-x-1 space-x-reverse">
                <Timer className="w-3.5 h-3.5" />
                <span>{timerSeconds}s</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isTimerRunning ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isTimerRunning ? 'إيقاف' : 'توقيت'}
              </button>
            </div>

            {/* Patient Selector */}
            {!patientId && (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- اختر مفحوصاً --</option>
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.phone || '--'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* REAL-TIME RAVEN COGNITIVE HERO DASHBOARD */}
          {ravenResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/30 to-slate-950 border border-indigo-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-mono font-black text-3xl shadow-lg shadow-indigo-600/30">
                    IQ {ravenResult.iq_equivalent}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">التصنيف المعرفي والاستدلال السائل:</span>
                    <strong className="text-base font-black text-indigo-300 block">
                      {ravenResult.grade} ({ravenResult.grade_label_ar})
                    </strong>
                    <span className="text-xs text-slate-400">
                      الدرجة الخام: <strong className="text-white font-mono">{ravenResult.raw_score} / {ravenResult.max_score}</strong> | الرتبة المئينية: <strong className="text-emerald-400 font-mono">{ravenResult.percentile}%</strong>
                    </span>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 text-center">
                  <span className="text-slate-500 block text-[10px]">النسخة المفعلة:</span>
                  <span className="text-white font-bold">{matrixType === 'SPM' ? 'Raven SPM (60 Items)' : 'Raven CPM (36 Items)'}</span>
                </div>
              </div>
            </div>
          )}

          {/* INTERACTIVE MATRIX SLIDE SELECTOR */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-5 shadow-xl text-center">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-mono font-black text-xs">
                مصفوفة {currentItemNumber} / {maxItems} ({currentSet})
              </span>

              <div className="flex items-center space-x-1 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(maxItems - 1, prev + 1))}
                  disabled={currentIndex === maxItems - 1}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Matrix Visual Presentation Box */}
            <div className="py-8 px-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center space-y-3">
              <div className="w-32 h-24 rounded-2xl bg-gradient-to-tr from-indigo-900/40 to-slate-900 border-2 border-dashed border-indigo-500/40 flex items-center justify-center text-indigo-400 font-mono text-sm font-bold shadow-inner">
                <span>نمط المصفوفة {currentSet}-{((currentIndex % 12) + 1)} 🧩</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">اختر النمط المكمل الصحيح من الخيارات أدناه:</span>
            </div>

            {/* 6 OPTION TILES */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2">
              {[1, 2, 3, 4, 5, 6].map((opt) => {
                const isSelected = answers[currentItemNumber] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`py-4 rounded-2xl font-mono font-black text-sm transition-all border flex flex-col items-center justify-center space-y-1 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-105'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>خيار {opt}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتشخيص النفسي المعرفي (Synthèse Raven Matrices):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const fresh = {};
                for (let i = 1; i <= 60; i++) fresh[i] = 1;
                setAnswers(fresh);
                setCurrentIndex(0);
                setTimerSeconds(0);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط الاختبار</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs shadow-xl shadow-indigo-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج المصفوفات...' : 'اعتماد تقييم مصفوفات رافن 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border border-indigo-500/30 mx-auto flex items-center justify-center text-indigo-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق نتائج مصفوفات رافن بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل حاصل الذكاء التقريبي والمعادل المئيني ورتبة الاستدلال السائل.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">الذكاء المعادل:</span>
              <strong className="text-indigo-400 text-base font-black font-mono">
                IQ {ravenResult?.iq_equivalent}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الرتبة المعرفية:</span>
              <span className="text-white font-bold">{ravenResult?.grade}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الرتبة المئينية:</span>
              <span className="text-emerald-400 font-mono font-bold">{ravenResult?.percentile}%</span>
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
