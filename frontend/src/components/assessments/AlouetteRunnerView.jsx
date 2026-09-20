import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Award, 
  FileText, 
  Printer, 
  Save, 
  AlertTriangle, 
  Clock, 
  User, 
  Activity, 
  X, 
  Volume2,
  Check,
  AlertOctagon,
  Timer,
  MousePointerClick,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

// Standard 265-word text passage of L'Alouette (P. Lefavrais)
const ALOUETTE_WORDS = `Sur la colline, une alouette s'envole vivement dans l'air frais du matin. Elle chante gaiement en montant toujours plus haut vers les nuages dorés. Au loin, le ruisseau serpente paisiblement à travers la verte prairie. Les petits bergers surveillent attentivement leur troupeau qui broute l'herbe tendre et fleurie. Soudain, un lièvre craintif traverse le sentier et disparaît dans les buissons épais. Le vent souffle doucement dans les grands chênes centenaires, faisant frémir leurs larges branches feuillues. Les enfants ramassent avec joie des fruits mûrs tombés sur la mousse humide. La lumière du soleil éclaire les sentiers pierreux qui mènent au vieux moulin abandonné. Les oiseaux construisent leurs nids confortables avec de la paille et des brindilles sèches. Tout est calme et serein dans cette jolie campagne baignée de douce clarté, où la nature s'éveille paisiblement au rythme des saisons bienfaisantes et généreuses. Les cloches du village sonnent l'heure du midi, invitant chacun à partager le repas familial dans la paix et la concorde. Des champs de blé doré ondulent sous la brise tiède pendant que les papillons multicolores voltigent de fleur en fleur avec légèreté.`.split(/\s+/);

export default function AlouetteRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  // Timer State (Stopwatch 0 to 180s)
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  // Passage Tracking State
  const [lastWordIndex, setLastWordIndex] = useState(110); // index of last word read (0-based)
  const [errorWordIndices, setErrorWordIndices] = useState(new Set([5, 14, 27, 49, 82])); // set of error word indices
  const [chronoAgeMonths, setChronoAgeMonths] = useState(108); // 9.0 years default

  // Results & Calculation State
  const [alouetteResult, setAlouetteResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  // Stopwatch interval handler
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 179) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            soundEngine.playSuccessSound();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Recompute calculation whenever parameters change
  useEffect(() => {
    recomputeAlouette();
  }, [seconds, lastWordIndex, errorWordIndices, chronoAgeMonths]);

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

  const recomputeAlouette = async () => {
    const timeToUse = Math.max(1, seconds);
    const totalWords = lastWordIndex + 1;
    const errorsCount = Array.from(errorWordIndices).filter((idx) => idx <= lastWordIndex).length;

    try {
      const resp = await clinicalTestApi.runAlouette({
        time_seconds: timeToUse,
        words_read: totalWords,
        errors_count: errorsCount,
        chronological_age_months: chronoAgeMonths,
      });
      setAlouetteResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('Alouette calculation error:', e);
    }
  };

  // Left click on word toggles error
  const handleWordClick = (index) => {
    setErrorWordIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        soundEngine.playTone(320, 0.05);
      }
      return next;
    });

    if (index > lastWordIndex) {
      setLastWordIndex(index);
    }
  };

  // Right-click or button sets last word read
  const handleSetLastWord = (index, e) => {
    if (e) e.preventDefault();
    setLastWordIndex(index);
    soundEngine.playTone(680, 0.08);
  };

  const handleStartStop = () => {
    soundEngine.unlockAudio();
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط نتائج الفحص بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const totalWords = lastWordIndex + 1;
      const errorsCount = Array.from(errorWordIndices).filter((idx) => idx <= lastWordIndex).length;

      const payload = {
        test_code: 'ALOUETTE_R',
        calculated_total_score: alouetteResult?.speed_index_v || 0,
        subscale_scores: {
          speed_index_v: { name: 'مؤشر السرعة (V)', raw: alouetteResult?.speed_index_v || 0, standard: alouetteResult?.speed_index_v || 0 },
          precision_index_p: { name: 'مؤشر الدقة (P %)', raw: alouetteResult?.precision_index_p || 0, standard: alouetteResult?.precision_index_p + '%' },
          cpm: { name: 'كلمة صحيحة / دقيقة (CTL/min)', raw: alouetteResult?.correct_words_per_minute || 0 },
          reading_age: { name: 'العمر القرائي (Âge Lexique)', raw: alouetteResult?.leximetric_age_years + ' ans' },
          age_gap: { name: 'الفارق القرائي', raw: alouetteResult?.age_gap_months + ' mois' },
        },
        raw_responses: {
          time_seconds: Math.max(1, seconds),
          total_words: totalWords,
          errors: errorsCount,
          chronological_age_months: chronoAgeMonths,
        },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم Alouette-R');
    } finally {
      setSaving(false);
    }
  };

  const totalWordsAttempted = lastWordIndex + 1;
  const errorsCount = Array.from(errorWordIndices).filter((idx) => idx <= lastWordIndex).length;
  const correctWords = Math.max(0, totalWordsAttempted - errorsCount);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-black shadow-lg shadow-amber-600/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                اختبار سرعة ودقة القراءة المعياري (L'Alouette-R)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                P. Lefavrais DZ
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              مقياس القراءة المقنن (3 دقائق)، حساب العمر القرائي (Âge Lexique)، مؤشري السرعة والدقة، وتشخيص عسر القراءة.
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
          {/* Top Control Bar: Patient & Chronological Age Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            {!patientId ? (
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300">
                <User className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="shrink-0">المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- اختر مريضاً --</option>
                  {patientsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.phone || '--'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-300">
                <User className="w-4 h-4 text-amber-400" />
                <span className="font-bold">المريض المحدد:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Chronological Age Input (in months / years) */}
            <div className="flex items-center justify-between sm:justify-end space-x-3 space-x-reverse text-xs">
              <span className="text-slate-400 font-bold">العمر الزمني للطفل:</span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="number"
                  min="60"
                  max="200"
                  value={chronoAgeMonths}
                  onChange={(e) => setChronoAgeMonths(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-center text-xs focus:outline-none focus:border-amber-500"
                />
                <span className="text-slate-400 text-[11px]">
                  شهراً ({roundTo(chronoAgeMonths / 12, 1)} سنة)
                </span>
              </div>
            </div>
          </div>

          {/* HIGH-CONTRAST DIGITAL STOPWATCH & QUICK CONTROLS */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border border-amber-500/30 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Digital Stopwatch Display */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`px-5 py-2.5 rounded-2xl bg-slate-900 border text-amber-300 font-mono font-black text-3xl flex items-center space-x-2.5 space-x-reverse shadow-inner ${
                  isRunning ? 'border-amber-500 shadow-amber-500/20 animate-pulse' : 'border-amber-500/40'
                }`}>
                  <Timer className={`w-7 h-7 ${isRunning ? 'text-amber-400 animate-spin' : 'text-amber-500'}`} />
                  <span>{formatTimer(seconds)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleStartStop}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-2 space-x-reverse transition-all shadow-lg active:scale-95 ${
                    isRunning
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isRunning ? 'إيقاف مؤقت' : '▶️ بدء القراءة (3 دقائق)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title="إعادة ضبط العداد"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Real-time Reading Diagnostic Badge */}
              {alouetteResult && (
                <div>
                  <span className={`px-4 py-2.5 rounded-2xl font-black text-xs border flex items-center space-x-2 space-x-reverse shadow-md ${
                    alouetteResult.risk_level === 'normal'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                      : alouetteResult.risk_level === 'moderate_delay'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-amber-500/10'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-rose-500/10'
                  }`}>
                    <Activity className="w-4 h-4" />
                    <span>{alouetteResult.risk_label_ar}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Instruction Guide Bar */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 space-x-reverse">
                <MousePointerClick className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>تعليمات الاستخدام:</strong> انقر بالزر الأيسر على أي كلمة لتسجيل <strong>خطأ (Error ❌)</strong>. انقر بالزر الأيمن أو انقر مرتين لتحديد <strong>نقطة التوقف (Dernier mot lu 📍)</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* INTERACTIVE READING PASSAGE (Word Token Grid) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white flex items-center space-x-1.5 space-x-reverse">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>نص القراءة الإكلينيكي المعتمد (265 كلمة):</span>
              </h4>
              <div className="flex items-center space-x-3 space-x-reverse text-xs">
                <span className="flex items-center space-x-1 space-x-reverse text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span>خطأ</span>
                </span>
                <span className="flex items-center space-x-1 space-x-reverse text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>توقف</span>
                </span>
              </div>
            </div>

            <div 
              className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-left font-serif leading-loose text-slate-200 text-base max-h-[360px] overflow-y-auto custom-scrollbar select-none"
              dir="ltr"
            >
              {ALOUETTE_WORDS.map((word, idx) => {
                const isError = errorWordIndices.has(idx);
                const isBeyondLastWord = idx > lastWordIndex;
                const isLastWord = idx === lastWordIndex;

                return (
                  <span
                    key={idx}
                    onClick={() => handleWordClick(idx)}
                    onContextMenu={(e) => handleSetLastWord(idx, e)}
                    onDoubleClick={(e) => handleSetLastWord(idx, e)}
                    className={`inline-block mr-1.5 mb-1.5 px-2 py-0.5 rounded-xl cursor-pointer transition-all ${
                      isError
                        ? 'bg-rose-600 text-white font-bold line-through shadow-md shadow-rose-600/30'
                        : isLastWord
                        ? 'bg-amber-500/25 text-amber-300 font-black border-2 border-amber-400 shadow-md shadow-amber-500/20'
                        : isBeyondLastWord
                        ? 'text-slate-600 opacity-40 hover:text-slate-300'
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                    title={`كلمة #${idx + 1} - نقرة: خطأ | نقرتين/زر أيمن: نقطة التوقف`}
                  >
                    {word}
                    {isLastWord && (
                      <span className="ml-1.5 text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-md">
                        توقف #{idx + 1} 📍
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* REAL-TIME METRICS BOTTOM DOCK */}
          <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
            <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-bold">الزمن المسجل:</span>
              <strong className="text-sm font-black font-mono text-white">{Math.max(1, seconds)} ثانية</strong>
            </div>

            <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-bold">الكلمات المقروءة:</span>
              <strong className="text-sm font-black font-mono text-amber-300">{totalWordsAttempted} / 265</strong>
            </div>

            <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-bold">الأخطاء (E):</span>
              <strong className="text-sm font-black font-mono text-rose-400">{errorsCount}</strong>
            </div>

            <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-bold">مؤشر الدقة (P):</span>
              <strong className="text-sm font-black font-mono text-cyan-300">{alouetteResult?.precision_index_p || 0}%</strong>
            </div>

            <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-bold">العمر القرائي (Âge Lexique):</span>
              <strong className="text-sm font-black font-mono text-emerald-300">
                {alouetteResult?.leximetric_age_years || 0} سنة
              </strong>
            </div>

            <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-bold">الفارق القرائي:</span>
              <strong className={`text-sm font-black font-mono ${
                (alouetteResult?.age_gap_months || 0) > 18 ? 'text-rose-400' : 'text-slate-200'
              }`}>
                {alouetteResult?.age_gap_months || 0} شهر
              </strong>
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتشخيص الأرطوفوني (Synthèse Alouette-R):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setErrorWordIndices(new Set());
                setLastWordIndex(60);
                setSeconds(0);
                setIsRunning(false);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين الفحص</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs shadow-xl shadow-amber-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج القراءة...' : 'اعتماد فحص القراءة Alouette-R 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم اعتماد وحفظ نتائج فحص القراءة Alouette-R بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم حساب العمر القرائي (Âge Lexique) ومؤشرات السرعة والدقة وربط التقرير بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">العمر القرائي:</span>
              <strong className="text-amber-400 text-base font-black font-mono">
                {alouetteResult?.leximetric_age_years} سنة
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">مؤشر الدقة:</span>
              <span className="text-white font-bold">{alouetteResult?.precision_index_p}%</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التصنيف السريري:</span>
              <span className="text-emerald-400 font-bold">{alouetteResult?.risk_label_ar}</span>
            </div>
          </div>

          {/* 1-Click Printable Bilan PDF A4 Export Button */}
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

function roundTo(val, digits = 1) {
  const factor = Math.pow(10, digits);
  return Math.round(val * factor) / factor;
}
