import React, { useState, useEffect, useRef } from 'react';
import { 
  Target, 
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
  Play, 
  Pause, 
  Timer, 
  Layers, 
  Zap,
  Sliders,
  Check
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

export default function D2StroopRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [activeTab, setActiveTab] = useState('d2'); // 'd2' | 'stroop'

  // D2 State
  const [d2Tn, setD2Tn] = useState(490);
  const [d2E1, setD2E1] = useState(10);
  const [d2E2, setD2E2] = useState(3);

  // Stroop State
  const [stroopTw, setStroopTw] = useState(42);
  const [stroopTc, setStroopTc] = useState(56);
  const [stroopTcw, setStroopTcw] = useState(88);
  const [stroopEcw, setStroopEcw] = useState(2);

  // Stopwatch Timer for in-session Stroop condition timing
  const [timerCondition, setTimerCondition] = useState('interference'); // 'word' | 'color' | 'interference'
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const [attentionResult, setAttentionResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  // Stopwatch interval
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  useEffect(() => {
    recomputeAttention();
  }, [d2Tn, d2E1, d2E2, stroopTw, stroopTc, stroopTcw, stroopEcw]);

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

  const recomputeAttention = async () => {
    try {
      const resp = await clinicalTestApi.runD2Stroop({
        d2_items_processed: d2Tn,
        d2_errors_omission: d2E1,
        d2_errors_commission: d2E2,
        stroop_word_time: stroopTw,
        stroop_color_time: stroopTc,
        stroop_interference_time: stroopTcw,
        stroop_interference_errors: stroopEcw,
      });
      setAttentionResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('Attention calculation error:', e);
    }
  };

  const handleApplyTimer = () => {
    if (timerCondition === 'word') setStroopTw(timerSeconds);
    else if (timerCondition === 'color') setStroopTc(timerSeconds);
    else if (timerCondition === 'interference') setStroopTcw(timerSeconds);

    setIsTimerRunning(false);
    setTimerSeconds(0);
    soundEngine.playSuccessSound();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط فحص الانتباه والوظائف التنفيذية بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'D2_STROOP',
        calculated_total_score: attentionResult?.d2?.concentration_index_kl || 0,
        subscale_scores: {
          d2_concentration_kl: { name: 'مؤشر التركيز D2 (KL)', raw: attentionResult?.d2?.concentration_index_kl, standard: attentionResult?.d2?.concentration_index_kl },
          d2_error_rate: { name: 'معدل أخطاء D2 (F%)', raw: `${attentionResult?.d2?.error_rate_pct}%` },
          stroop_interference: { name: 'زمن التداخل ستروب (Delta IG)', raw: `${attentionResult?.stroop?.interference_delta}s`, interpretation: attentionResult?.stroop?.inhibition_label_ar },
        },
        raw_responses: {
          d2: { tn: d2Tn, e1: d2E1, e2: d2E2 },
          stroop: { tw: stroopTw, tc: stroopTc, tcw: stroopTcw, ecw: stroopEcw },
        },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم الانتباه');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white font-black shadow-lg shadow-teal-600/30">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                بطارية الانتباه والوظائف التنفيذية (D2 & Stroop Test DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Brickenkamp & Golden
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              فحص الانتباه الانتقائي، قدرة التركيز (مؤشر KL)، ومقاومة التداخل والكف الانتباهي (Stroop Interference).
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

          {/* REAL-TIME ATTENTION PERFORMANCE DASHBOARD */}
          {attentionResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950/30 to-slate-950 border border-teal-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-teal-600 text-white font-mono font-black text-3xl shadow-lg shadow-teal-600/30">
                    KL {attentionResult.d2?.concentration_index_kl}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">مؤشر التركيز والانتباه (D2 KL):</span>
                    <strong className="text-base font-black text-teal-300 block">
                      {attentionResult.stroop?.inhibition_label_ar}
                    </strong>
                    <span className="text-xs text-slate-400">
                      معدل الخطأ D2: <strong className="text-white font-mono">{attentionResult.d2?.error_rate_pct}%</strong> | تداخل ستروب: <strong className="text-cyan-300 font-mono">Delta {attentionResult.stroop?.interference_delta}s</strong>
                    </span>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 text-center">
                  <span className="text-slate-500 block text-[10px]">كفاءة الكف:</span>
                  <span className="text-white font-bold">{attentionResult.stroop?.inhibition_status === 'deficit' ? '⚠️ عجز كف (TDAH)' : '✅ كف طبيعي'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB SELECTOR: D2 VS STROOP */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('d2')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  activeTab === 'd2'
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                1. مقياس التركيز والانتباه D2 (Brickenkamp)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stroop')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  activeTab === 'stroop'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                2. اختبار التداخل والكف الانتباهي ستروب (Stroop)
              </button>
            </div>

            {/* TAB 1: D2 ATTENTION */}
            {activeTab === 'd2' && (
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-lg animate-in fade-in">
                <h4 className="text-xs font-black text-teal-400">مدخلات فحص D2 (14 سطراً - 20 ثانية لكل سطر):</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">إجمالي الرموز المعالجة (TN):</label>
                    <input
                      type="number"
                      min="100"
                      max="700"
                      value={d2Tn}
                      onChange={(e) => setD2Tn(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-teal-300 font-mono font-bold text-center text-sm"
                    />
                    <span className="text-[10px] text-slate-500 block">المتوسط الطبيعي: 450 - 550</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">أخطاء الإغفال والسهو (E1):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={d2E1}
                      onChange={(e) => setD2E1(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-center text-sm"
                    />
                    <span className="text-[10px] text-slate-500 block">حرف d بنقطتين تم تجاوزه</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">أخطاء الخلط والتسرع (E2):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={d2E2}
                      onChange={(e) => setD2E2(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-rose-400 font-mono font-bold text-center text-sm"
                    />
                    <span className="text-[10px] text-slate-500 block">شطب حرف p أو d بنقاط خاطئة</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STROOP TEST */}
            {activeTab === 'stroop' && (
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-5 shadow-lg animate-in fade-in">
                {/* Built-in Stopwatch */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="px-4 py-2 rounded-xl bg-slate-950 text-cyan-300 font-mono font-black text-xl border border-cyan-500/30 flex items-center space-x-2 space-x-reverse">
                      <Timer className="w-5 h-5 text-cyan-400" />
                      <span>{timerSeconds} ثانية</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 space-x-reverse transition-all ${
                        isTimerRunning ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isTimerRunning ? 'إيقاف' : 'بدء التوقيت'}</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <select
                      value={timerCondition}
                      onChange={(e) => setTimerCondition(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      <option value="word">لوحة 1: قراءة الكلمات (W)</option>
                      <option value="color">لوحة 2: تسمية الألوان (C)</option>
                      <option value="interference">لوحة 3: التداخل لون-كلمة (CW)</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleApplyTimer}
                      className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md"
                    >
                      تطبيق الزمن ⏱️
                    </button>
                  </div>
                </div>

                {/* 3 Conditions Input Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-bold">1. قراءة الكلمات (Tw):</span>
                    <input
                      type="number"
                      value={stroopTw}
                      onChange={(e) => setStroopTw(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-center text-sm"
                    />
                    <span className="text-[9px] text-slate-500">ثواني</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-bold">2. تسمية الألوان (Tc):</span>
                    <input
                      type="number"
                      value={stroopTc}
                      onChange={(e) => setStroopTc(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-center text-sm"
                    />
                    <span className="text-[9px] text-slate-500">ثواني</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-bold">3. التداخل (Tcw):</span>
                    <input
                      type="number"
                      value={stroopTcw}
                      onChange={(e) => setStroopTcw(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold text-center text-sm"
                    />
                    <span className="text-[9px] text-slate-500">ثواني</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-bold">أخطاء التداخل (Ecw):</span>
                    <input
                      type="number"
                      value={stroopEcw}
                      onChange={(e) => setStroopEcw(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-rose-400 font-mono font-bold text-center text-sm"
                    />
                    <span className="text-[9px] text-slate-500">عدد الأخطاء غير المصححة</span>
                  </div>
                </div>

                {/* Stimulus Demo Box */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                  <span className="text-slate-400 text-[11px] font-bold">نموذج محفز التداخل (Stroop Stimulus):</span>
                  <div className="flex items-center justify-center space-x-6 space-x-reverse text-lg font-black select-none">
                    <span className="text-emerald-500">أحمر</span>
                    <span className="text-amber-400">أزرق</span>
                    <span className="text-rose-500">أخضر</span>
                    <span className="text-blue-500">أصفر</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">المطلوب: نطق لون الحبر وتجاهل قراءة الكلمة</span>
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية للانتباه والكف التنفيذي (Synthèse D2 & Stroop):</span>
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
                setD2Tn(480);
                setD2E1(12);
                setD2E2(4);
                setStroopTw(42);
                setStroopTc(56);
                setStroopTcw(88);
                setStroopEcw(2);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين للمتوسط</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-xs shadow-xl shadow-teal-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج الانتباه...' : 'اعتماد تقييم الانتباه D2 & Stroop 💾'}</span>
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
              تم توثيق نتائج فحص الانتباه والكف التنفيذي بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم حساب مؤشر التركيز D2 وزمن تداخل ستروب وربط التقرير بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">مؤشر التركيز D2:</span>
              <strong className="text-teal-400 text-base font-black font-mono">
                KL {attentionResult?.d2?.concentration_index_kl}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">تداخل ستروب:</span>
              <strong className="text-cyan-400 font-mono font-bold">
                Delta {attentionResult?.stroop?.interference_delta}s
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">كفاءة الكف:</span>
              <span className="text-emerald-400 font-bold">{attentionResult?.stroop?.inhibition_label_ar}</span>
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
