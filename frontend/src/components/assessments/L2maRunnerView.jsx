import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
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
  TrendingUp, 
  Layers, 
  Check, 
  Play, 
  Pause,
  AlertCircle
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

export default function L2maRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [activeTab, setActiveTab] = useState('reading'); // 'reading' | 'spelling' | 'phonology' | 'memory'
  
  // Reading state
  const [readingWordsCount, setReadingWordsCount] = useState(50);
  const [readingTime, setReadingTime] = useState(45);
  const [readingErrors, setReadingErrors] = useState(2);
  const [timerRunning, setTimerRunning] = useState(false);

  // Other subtests
  const [spellingScore, setSpellingScore] = useState(18);     // max 20
  const [phonologyScore, setPhonologyScore] = useState(17);   // max 20
  const [memoryScore, setMemoryScore] = useState(11);         // max 14

  const [l2maResult, setL2maResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  // Integrated Stopwatch
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setReadingTime((prev) => prev + 1);
      }, 1000);
    } else if (!timerRunning && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    recomputeL2ma();
  }, [readingWordsCount, readingTime, readingErrors, spellingScore, phonologyScore, memoryScore]);

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

  const recomputeL2ma = async () => {
    try {
      const resp = await clinicalTestApi.runL2ma({
        reading_words_count: readingWordsCount,
        reading_time_seconds: readingTime,
        reading_errors: readingErrors,
        spelling_score: spellingScore,
        phonology_score: phonologyScore,
        verbal_memory_score: memoryScore,
      });
      setL2maResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('L2MA calculation error:', e);
    }
  };

  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
    soundEngine.playTone(600, 0.05);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setReadingTime(0);
    soundEngine.playTone(350, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط فحص L2MA بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'L2MA',
        calculated_total_score: l2maResult?.overall_percentile || 0,
        subscale_scores: {
          reading_speed: { name: 'سرعة القراءة (WPM)', raw: `${l2maResult?.speed_wpm} wpm (دقة: ${l2maResult?.precision_pct}%)`, standard: `P=${l2maResult?.reading_percentile}%`, interpretation: l2maResult?.classification_ar },
          spelling: { name: 'الإملاء والتحليل الإملائي', raw: `${spellingScore} / 20`, standard: `P=${l2maResult?.spelling_percentile}%` },
          phonology: { name: 'الوعي الفونولوجي والكلمات غير المألوفة', raw: `${phonologyScore} / 20`, standard: `P=${l2maResult?.phonology_percentile}%` },
          verbal_memory: { name: 'الذاكرة اللفظية قصيرة المدى', raw: `${memoryScore} / 14`, standard: `P=${l2maResult?.memory_percentile}%` },
          overall_rank: { name: 'الرتبة المئينية العامة المجمعة', raw: `${l2maResult?.overall_percentile}%` },
        },
        raw_responses: { readingWordsCount, readingTime, readingErrors, spellingScore, phonologyScore, memoryScore },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم L2MA');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                بطارية فحص اللغة الشفهية والمكتوبة (L2MA DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20">
                Chevrie-Muller et al.
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              فحص سرعة ودقة القراءة، الإملاء، الوعي الفونولوجي، والذاكرة اللفظية قصيرة المدى لكشف عسر القراءة/الكتابة.
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
                <User className="w-4 h-4 text-sky-400" />
                <span>المفحوص:</span>
              </div>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-sky-500"
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
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-2 space-x-reverse text-xs text-slate-300">
              <User className="w-4 h-4 text-sky-400" />
              <span className="font-bold">المريض:</span>
              <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
            </div>
          )}

          {/* REAL-TIME L2MA PERFORMANCE BANNER */}
          {l2maResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-sky-950/30 to-slate-950 border border-sky-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-sky-600 text-white font-mono font-black text-2xl shadow-lg shadow-sky-600/30">
                    {l2maResult.speed_wpm} WPM
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">معدل القراءة والتصنيف الإكلينيكي:</span>
                    <strong className="text-sm font-black text-sky-300 block">
                      {l2maResult.classification_ar}
                    </strong>
                    <span className="text-xs text-slate-400">
                      دقة القراءة: <strong className="text-emerald-400 font-mono font-bold">{l2maResult.precision_pct}%</strong> | الرتبة العامة: <strong className="text-amber-400 font-mono font-bold">{l2maResult.overall_percentile}%</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">الإملاء:</span>
                    <span className="text-sky-400 font-mono font-bold text-xs">{spellingScore}/20 (P={l2maResult.spelling_percentile}%)</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">الفونولوجيا:</span>
                    <span className="text-teal-400 font-mono font-bold text-xs">{phonologyScore}/20 (P={l2maResult.phonology_percentile}%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTEST NAVIGATION TABS */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
              {[
                { key: 'reading', label: '1. سرعة ودقة القراءة (Lecture)' },
                { key: 'spelling', label: '2. الإملاء (Orthographe)' },
                { key: 'phonology', label: '3. الوعي الفونولوجي (Phonologie)' },
                { key: 'memory', label: '4. الذاكرة اللفظية (Mémoire)' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                    activeTab === t.key
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: READING & INTEGRATED STOPWATCH */}
            {activeTab === 'reading' && (
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Timer className="w-8 h-8 text-sky-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">الميقاتي المدمج لاختبار القراءة:</span>
                      <div className="text-2xl font-black font-mono text-white">
                        {readingTime} ثانية
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      type="button"
                      onClick={toggleTimer}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 space-x-reverse transition-all ${
                        timerRunning
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      }`}
                    >
                      {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{timerRunning ? 'إيقاف مؤقت' : 'تشغيل الميقاتي'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={resetTimer}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
                    >
                      تصفير
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">إجمالي الكلمات المقروءة:</label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={readingWordsCount}
                      onChange={(e) => setReadingWordsCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-center"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">عدد الأخطاء / التعثرات (Erreurs):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={readingErrors}
                      onChange={(e) => setReadingErrors(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-rose-400 font-mono font-bold text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SPELLING */}
            {activeTab === 'spelling' && (
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-sky-400">الإملاء والتحليل الإملائي (Dictée de mots):</h4>
                  <span className="font-mono font-black text-sky-300 text-sm px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20">
                    {spellingScore} / 20
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={spellingScore}
                  onChange={(e) => setSpellingScore(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0: صعوبة حادة</span>
                  <span>10: متوسط</span>
                  <span>20: إملاء سليم تام</span>
                </div>
              </div>
            )}

            {/* TAB 3: PHONOLOGY */}
            {activeTab === 'phonology' && (
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-teal-400">الوعي الفونولوجي وقراءة الكلمات غير المألوفة (Pseudo-mots):</h4>
                  <span className="font-mono font-black text-teal-300 text-sm px-3 py-1 rounded-xl bg-teal-500/10 border border-teal-500/20">
                    {phonologyScore} / 20
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={phonologyScore}
                  onChange={(e) => setPhonologyScore(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0: عجز فونولوجي</span>
                  <span>10: متوسط</span>
                  <span>20: وعي فونولوجي متفوق</span>
                </div>
              </div>
            )}

            {/* TAB 4: VERBAL MEMORY */}
            {activeTab === 'memory' && (
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-indigo-400">الذاكرة اللفظية قصيرة المدى (Empan de mots/chiffres):</h4>
                  <span className="font-mono font-black text-indigo-300 text-sm px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    {memoryScore} / 14
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="14"
                  value={memoryScore}
                  onChange={(e) => setMemoryScore(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0: سعة ضعيفة جداً</span>
                  <span>7: سعة متوسطة</span>
                  <span>14: سعة ممتازة</span>
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير الأرطوفوني (Synthèse L2MA):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-sky-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setReadingWordsCount(50);
                setReadingTime(45);
                setReadingErrors(2);
                setSpellingScore(18);
                setPhonologyScore(17);
                setMemoryScore(11);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للمستوى السليم</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs shadow-xl shadow-blue-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج L2MA...' : 'اعتماد تقرير فحص L2MA 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-sky-500/20 border border-sky-500/30 mx-auto flex items-center justify-center text-sky-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق نتائج بطارية L2MA بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل سرعة ودقة القراءة ودرجات الإملاء والوعي الفونولوجي والذاكرة اللفظية.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">سرعة القراءة:</span>
              <strong className="text-sky-400 text-base font-black font-mono">
                {l2maResult?.speed_wpm} WPM
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">دقة القراءة:</span>
              <strong className="text-emerald-400 text-base font-black font-mono">
                {l2maResult?.precision_pct}%
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الرتبة المئينية:</span>
              <span className="text-amber-400 font-mono font-bold">{l2maResult?.overall_percentile}%</span>
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
