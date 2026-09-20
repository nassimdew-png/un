import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Brain,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Save,
  Printer,
  X,
  User,
  Clock,
  Sparkles,
  Sliders,
  Copy,
  Check,
  FileText,
  Play,
  RotateCcw,
  Target,
  BarChart2,
  Award
} from 'lucide-react';
import { assessmentApi } from '../../../api';

// Stimuli Colors
const STROOP_COLORS = [
  { name: 'أحمر', colorClass: 'text-red-500', hex: '#ef4444', bgClass: 'bg-red-500' },
  { name: 'أزرق', colorClass: 'text-blue-500', hex: '#3b82f6', bgClass: 'bg-blue-500' },
  { name: 'أخضر', colorClass: 'text-emerald-500', hex: '#10b981', bgClass: 'bg-emerald-500' },
  { name: 'أصفر', colorClass: 'text-amber-400', hex: '#f59e0b', bgClass: 'bg-amber-400' },
];

export default function StroopTestInteractiveModal({
  isOpen,
  onClose,
  patient,
  patients = [],
  initialPatientId = null,
  onSaved
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || patient?.id || patients[0]?.id || ''
  );
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'calculator' | 'report'
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);

  // -------------------------------------------------------------
  // 1. LIVE INTERACTIVE TRIAL STATE
  // -------------------------------------------------------------
  const [trialPhase, setTrialPhase] = useState('idle'); // 'idle' | 'word' | 'color' | 'interference' | 'complete'
  const [currentTrialIdx, setCurrentTrialIdx] = useState(0);
  const [trialResults, setTrialResults] = useState({
    word: { times: [], errors: 0 },
    color: { times: [], errors: 0 },
    interference: { times: [], errors: 0 },
  });

  const [currentStimulus, setCurrentStimulus] = useState(null);
  const stimulusStartTimeRef = useRef(null);
  const TRIALS_PER_PHASE = 8; // Number of items per phase for rapid in-session clinical assessment

  // Generate next stimulus
  const generateStimulus = (phase) => {
    const textItem = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
    let fontColorItem = textItem;

    if (phase === 'interference') {
      // Pick a font color different from text
      const otherColors = STROOP_COLORS.filter(c => c.name !== textItem.name);
      fontColorItem = otherColors[Math.floor(Math.random() * otherColors.length)];
    } else if (phase === 'word') {
      // Neutral black/white text
      fontColorItem = { name: textItem.name, hex: '#ffffff', colorClass: 'text-white' };
    }

    return {
      text: textItem.name,
      targetColorName: phase === 'word' ? textItem.name : fontColorItem.name,
      fontColorClass: fontColorItem.colorClass,
      fontHex: fontColorItem.hex,
    };
  };

  const startPhase = (phase) => {
    setTrialPhase(phase);
    setCurrentTrialIdx(0);
    const stim = generateStimulus(phase);
    setCurrentStimulus(stim);
    stimulusStartTimeRef.current = performance.now();
  };

  const handleStimulusAnswer = (selectedColorName) => {
    if (!stimulusStartTimeRef.current || !currentStimulus) return;
    const latency = Math.round(performance.now() - stimulusStartTimeRef.current);
    const isCorrect = selectedColorName === currentStimulus.targetColorName;

    setTrialResults(prev => {
      const p = prev[trialPhase];
      return {
        ...prev,
        [trialPhase]: {
          times: [...p.times, latency],
          errors: isCorrect ? p.errors : p.errors + 1,
        }
      };
    });

    if (currentTrialIdx + 1 < TRIALS_PER_PHASE) {
      setCurrentTrialIdx(prev => prev + 1);
      const stim = generateStimulus(trialPhase);
      setCurrentStimulus(stim);
      stimulusStartTimeRef.current = performance.now();
    } else {
      // Transition to next phase
      if (trialPhase === 'word') {
        startPhase('color');
      } else if (trialPhase === 'color') {
        startPhase('interference');
      } else {
        setTrialPhase('complete');
      }
    }
  };

  // -------------------------------------------------------------
  // 2. CLINICIAN QUICK CALCULATOR STATE (Paper card entry)
  // -------------------------------------------------------------
  const [calcInputs, setCalcInputs] = useState({
    w_time: 25, // seconds for 100 words
    w_errors: 0,
    c_time: 35, // seconds for 100 colors
    c_errors: 1,
    cw_time: 55, // seconds for 100 incongruent color-words
    cw_errors: 4,
  });

  const handleCalcChange = (field, val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setCalcInputs(prev => ({ ...prev, [field]: num }));
  };

  // Compute Stroop interference metrics
  const computedMetrics = useMemo(() => {
    // Check if using live results or calculator
    let w_time = calcInputs.w_time;
    let c_time = calcInputs.c_time;
    let cw_time = calcInputs.cw_time;
    let cw_errors = calcInputs.cw_errors;

    if (trialPhase === 'complete' && trialResults.interference.times.length > 0) {
      const avgW = trialResults.word.times.reduce((a, b) => a + b, 0) / (trialResults.word.times.length || 1);
      const avgC = trialResults.color.times.reduce((a, b) => a + b, 0) / (trialResults.color.times.length || 1);
      const avgCW = trialResults.interference.times.reduce((a, b) => a + b, 0) / (trialResults.interference.times.length || 1);
      w_time = Math.round(avgW / 10) / 100;
      c_time = Math.round(avgC / 10) / 100;
      cw_time = Math.round(avgCW / 10) / 100;
      cw_errors = trialResults.interference.errors;
    }

    // Classic Stroop formulas:
    // Predicted CW = (W * C) / (W + C)
    const predCw = (w_time + c_time) > 0 ? (w_time * c_time) / (w_time + c_time) : 0;
    // Interference cost in seconds
    const interferenceCost = Math.round((cw_time - c_time) * 10) / 10;
    // Golden Interference index
    const interferenceScore = Math.round((cw_time - predCw) * 10) / 10;

    // Approximate Z-Score
    const zScore = Math.round(((cw_time - (c_time * 1.45)) / 7) * 10) / 10;

    let interpretation = {
      label: 'كف استجابة طبيعي ومرونة معرفية سليمة (Normal Executive Control)',
      color: 'emerald',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      advice: 'القدرة على كف الاستجابة التلقائية وتثبيط المشتتات ضمن المعدل الطبيعي.',
    };

    if (interferenceCost > 25 || cw_errors >= 5) {
      interpretation = {
        label: 'عجز دال في كف الاستجابة وتداخل عالٍ (Severe Inhibition Deficit)',
        color: 'red',
        badge: 'bg-red-500/20 text-red-300 border-red-500/30',
        advice: 'صعوبة ملحوظة في تثبيط الاستجابات التلقائية وتشتت انتباهي مرتفع، يستدعي تدريب الوظائف التنفيذية.',
      };
    } else if (interferenceCost > 15 || cw_errors >= 3) {
      interpretation = {
        label: 'حساسية معتدلة للتداخل التلقائي (Mild-Moderate Interference)',
        color: 'amber',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        advice: 'بطء ملحوظ عند تعارض المثيرات وتكلفة زمنية في الكف، يوصى بتمارين التركيز الانتقائي.',
      };
    }

    return {
      w_time,
      c_time,
      cw_time,
      cw_errors,
      interferenceCost,
      interferenceScore,
      zScore,
      interpretation,
    };
  }, [calcInputs, trialPhase, trialResults]);

  // Automated Report
  const generatedReport = useMemo(() => {
    let txt = `⏱️ تقرير اختبار ستروب للانتباه وكف الاستجابة الذهنية (Stroop Test)\n`;
    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `• تاريخ الفحص: ${assessmentDate}\n`;
    txt += `• النمط المستخدم: ${trialPhase === 'complete' ? 'تمرير تفاعلي حي عبر الشاشة' : 'حاسبة إكلينيكية للبطاقات المعيارية'}\n\n`;

    txt += `📊 أزمنة الإنجاز ومعدلات الأداء:\n`;
    txt += `  - زمن قراءة الكلمات المحايدة (W): ${computedMetrics.w_time} ثانية\n`;
    txt += `  - زمن تسمية الألوان (C): ${computedMetrics.c_time} ثانية\n`;
    txt += `  - زمن حالة التداخل المتعارض (CW): ${computedMetrics.cw_time} ثانية (الأخطاء: ${computedMetrics.cw_errors})\n\n`;

    txt += `🎯 مؤشرات الكف والمرونة الذهنية (Inhibition & Interference):\n`;
    txt += `  - تكلفة كف الاستجابة (Inhibition Cost): +${computedMetrics.interferenceCost} ثانية إضافية\n`;
    txt += `  - مؤشر تأثير ستروب (Stroop Effect): ${computedMetrics.interferenceScore}\n`;
    txt += `  - الخلاصة السريرية: ${computedMetrics.interpretation.label}\n`;
    txt += `  - التوجيه الإكلينيكي: ${computedMetrics.interpretation.advice}\n`;

    if (clinicalNotes.trim()) {
      txt += `\n📝 ملاحظات الفاحص السريرية:\n${clinicalNotes}\n`;
    }

    return txt;
  }, [assessmentDate, trialPhase, computedMetrics, clinicalNotes]);

  // Save to Backend API
  const handleSaveAssessment = async () => {
    if (!selectedPatientId) {
      alert('يرجى اختيار ملف المريض أولاً.');
      return;
    }

    setSaving(true);
    try {
      const assessmentData = {
        patient_id: selectedPatientId,
        type: 'psychometric_eval',
        title: `[STROOP] اختبار الانتباه وكف الاستجابة المعرفية`,
        assessment_date: assessmentDate,
        results_data: {
          test_code: 'STROOP',
          test_title: 'اختبار ستروب (Stroop Color-Word)',
          w_time: computedMetrics.w_time,
          c_time: computedMetrics.c_time,
          cw_time: computedMetrics.cw_time,
          cw_errors: computedMetrics.cw_errors,
          interference_cost: computedMetrics.interferenceCost,
          interpretation: computedMetrics.interpretation.label,
          notes: clinicalNotes,
          raw_score: computedMetrics.interferenceCost,
        },
        diagnostic_conclusion: `Stroop Interference: +${computedMetrics.interferenceCost}s (${computedMetrics.interpretation.label})`,
        recommendations: generatedReport,
      };

      await assessmentApi.create(assessmentData);
      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save Stroop assessment:', err);
      alert('حدث خطأ أثناء حفظ التقييم: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setSaving(false);
    }
  };

  const copyReportToClipboard = () => {
    navigator.clipboard.writeText(generatedReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto font-sans" dir="rtl">
      <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 border-b border-emerald-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Zap className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  STROOP TEST ENGINE
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Inhibition & Attention
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                رائز ستروب التفاعلي للانتباه وكف الاستجابة (Stroop Color & Word)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name || `${p.first_name} ${p.last_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'live' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>التمرير الحي المباشر</span>
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'calculator' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>الحاسبة العيادية (البطاقات)</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'report' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>التقرير والتفسير</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: LIVE INTERACTIVE TRIAL */}
          {activeTab === 'live' && (
            <div className="space-y-6">
              
              {trialPhase === 'idle' && (
                <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-5 max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-white">بدء رائز ستروب التفاعلي المباشر</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      سيمر المفحوص بـ 3 مراحل متتالية سريعة (8 بنود لكل مرحلة):
                      <br />
                      <strong>1. قراءة الكلمات</strong> ← <strong>2. تسمية الألوان</strong> ← <strong>3. حالة التداخل (اختر لون الخط وتجاهل الكلمة)</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => startPhase('word')}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition shadow-xl shadow-emerald-600/30 flex items-center gap-2 mx-auto"
                  >
                    <Play className="w-4 h-4" />
                    <span>انطلاق المرحلة 1: قراءة الكلمات (Word)</span>
                  </button>
                </div>
              )}

              {/* Active Stimulus Screen */}
              {(trialPhase === 'word' || trialPhase === 'color' || trialPhase === 'interference') && currentStimulus && (
                <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-8 max-w-xl mx-auto">
                  
                  {/* Phase Status Banner */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400">
                      المرحلة: {trialPhase === 'word' ? '1. قراءة الكلمات' : trialPhase === 'color' ? '2. تسمية الألوان' : '3. حالة التداخل (اختر لون الخط!)'}
                    </span>
                    <span className="font-mono text-slate-400">
                      البند: {currentTrialIdx + 1} / {TRIALS_PER_PHASE}
                    </span>
                  </div>

                  {/* Stimulus Word / Box */}
                  <div className="py-12 px-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-inner flex items-center justify-center min-h-[160px]">
                    {trialPhase === 'color' ? (
                      <div
                        className="w-24 h-24 rounded-3xl shadow-2xl transition-transform animate-scaleUp"
                        style={{ backgroundColor: currentStimulus.fontHex }}
                      />
                    ) : (
                      <span
                        className="text-4xl sm:text-5xl font-black select-none tracking-wide"
                        style={{ color: currentStimulus.fontHex }}
                      >
                        {currentStimulus.text}
                      </span>
                    )}
                  </div>

                  {/* Response Buttons */}
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-medium">
                      {trialPhase === 'interference'
                        ? '⚠️ تنبيه: اضغط على لون الخط الذي كتبت به الكلمة (تجاهل المعنى المقروء):'
                        : 'اختر الإجابة الصحيحة بأسرع ما يمكن:'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {STROOP_COLORS.map(c => (
                        <button
                          key={c.name}
                          onClick={() => handleStimulusAnswer(c.name)}
                          className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2 active:scale-95 shadow"
                        >
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Complete State */}
              {trialPhase === 'complete' && (
                <div className="p-6 rounded-3xl bg-slate-950 border border-emerald-500/40 text-center space-y-6 max-w-xl mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white">اكتمل التمرير التفاعلي بنجاح!</h3>
                    <p className="text-xs text-slate-300">
                      تم احتساب أزمنة الاستجابة ومعدلات التداخل بدقة.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400">الكلمات (W)</span>
                      <h4 className="text-sm font-black text-white font-mono mt-1">{computedMetrics.w_time}s</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400">الألوان (C)</span>
                      <h4 className="text-sm font-black text-white font-mono mt-1">{computedMetrics.c_time}s</h4>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40">
                      <span className="text-[10px] text-emerald-300">التداخل (CW)</span>
                      <h4 className="text-sm font-black text-emerald-400 font-mono mt-1">{computedMetrics.cw_time}s</h4>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${computedMetrics.interpretation.badge}`}>
                    <span className="text-xs font-bold">{computedMetrics.interpretation.label}</span>
                    <p className="text-[11px] mt-1">{computedMetrics.interpretation.advice}</p>
                  </div>

                  <button
                    onClick={() => setTrialPhase('idle')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 mx-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة الاختبار</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: CLINICIAN QUICK CALCULATOR */}
          {activeTab === 'calculator' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-300 leading-relaxed">
                💡 أدخل أزمنة الإنجاز بالثواني وعدد الأخطاء للبطاقات الثلاث الكلاسيكية المقننة (100 عنصر لكل بطاقة) لحساب مؤشرات ستروب الفورية.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card W */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">بطاقة الكلمات (W)</span>
                    <span className="text-[10px] text-slate-400">قراءة محايدة</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">الزمن بالثواني:</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={calcInputs.w_time}
                        onChange={(e) => handleCalcChange('w_time', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">عدد الأخطاء:</label>
                      <input
                        type="number"
                        min="0"
                        value={calcInputs.w_errors}
                        onChange={(e) => handleCalcChange('w_errors', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Card C */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">بطاقة الألوان (C)</span>
                    <span className="text-[10px] text-slate-400">تسمية ألوان المربعات</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">الزمن بالثواني:</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={calcInputs.c_time}
                        onChange={(e) => handleCalcChange('c_time', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">عدد الأخطاء:</label>
                      <input
                        type="number"
                        min="0"
                        value={calcInputs.c_errors}
                        onChange={(e) => handleCalcChange('c_errors', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Card CW */}
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">بطاقة التداخل (CW)</span>
                    <span className="text-[10px] text-emerald-400">اللون المتعارض</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">الزمن بالثواني:</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={calcInputs.cw_time}
                        onChange={(e) => handleCalcChange('cw_time', e.target.value)}
                        className="w-full bg-slate-900 border border-emerald-500/60 rounded-xl p-2 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">عدد الأخطاء:</label>
                      <input
                        type="number"
                        min="0"
                        value={calcInputs.cw_errors}
                        onChange={(e) => handleCalcChange('cw_errors', e.target.value)}
                        className="w-full bg-slate-900 border border-emerald-500/60 rounded-xl p-2 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Metric Display */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400">تكلفة كف الاستجابة المعرفية (Inhibition Cost):</span>
                  <h4 className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    +{computedMetrics.interferenceCost} ثانية إضافية
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1">{computedMetrics.interpretation.label}</p>
                </div>

                <div className={`p-3.5 rounded-2xl border text-xs max-w-sm ${computedMetrics.interpretation.badge}`}>
                  {computedMetrics.interpretation.advice}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: REPORT & CLINICAL NARRATIVE */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>التقرير السريري لحصيلة اختبار ستروب</span>
                </h3>
                <button
                  onClick={copyReportToClipboard}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReport ? 'تم النسخ!' : 'نسخ التقرير'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {generatedReport}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">ملاحظات الفاحص الإضافية (الانتباه وسرعة المعالجة):</label>
                <textarea
                  rows="3"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="سجل أي ملاحظات حول التردد، الإحباط أثناء تداخل الألوان، استراتيجيات التجاوز..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {saveSuccess && (
              <span className="text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                تم توثيق نتيجة رائز ستروب في ملف المريض بنجاح!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveAssessment}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جارٍ الحفظ...' : 'حفظ في ملف المريض والحصيلة ⚡'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
