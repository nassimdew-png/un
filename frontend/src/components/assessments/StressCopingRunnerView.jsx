import React, { useState, useEffect } from 'react';
import { 
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
  Zap, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  Check, 
  Sliders, 
  Flame, 
  Smile, 
  Target, 
  Heart, 
  Footprints
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

export default function StressCopingRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [activeTab, setActiveTab] = useState('stress'); // 'stress' | 'ciss'

  // STR Perceived Stress (0-40)
  const [strScore, setStrScore] = useState(24);

  // CISS Coping Scales (16-80 each)
  const [taskCoping, setTaskCoping] = useState(58);
  const [emotionCoping, setEmotionCoping] = useState(42);
  const [avoidanceCoping, setAvoidanceCoping] = useState(36);

  const [stressResult, setStressResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeStressCiss();
  }, [strScore, taskCoping, emotionCoping, avoidanceCoping]);

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

  const recomputeStressCiss = async () => {
    try {
      const resp = await clinicalTestApi.runStrCiss({
        perceived_stress_score: strScore,
        task_coping_score: taskCoping,
        emotion_coping_score: emotionCoping,
        avoidance_coping_score: avoidanceCoping,
      });
      setStressResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('STR/CISS calculation error:', e);
    }
  };

  const setPreset = (type) => {
    if (type === 'burnout') {
      setStrScore(32); setTaskCoping(35); setEmotionCoping(68); setAvoidanceCoping(52);
    } else if (type === 'adaptive') {
      setStrScore(18); setTaskCoping(66); setEmotionCoping(32); setAvoidanceCoping(28);
    } else if (type === 'avoidant') {
      setStrScore(25); setTaskCoping(38); setEmotionCoping(45); setAvoidanceCoping(65);
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط تقييم الضغط واستراتيجيات المواجهة بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'STR_CISS',
        calculated_total_score: strScore,
        subscale_scores: {
          str_stress: { name: 'مقياس الضغط النفسي المدرك (STR)', raw: `${strScore} / 40`, interpretation: stressResult?.stress_scale?.label_ar },
          task_coping: { name: 'المواجهة الموجهة للمشكلة (Task)', raw: `${taskCoping} / 80` },
          emotion_coping: { name: 'المواجهة الموجهة للانفعال (Emotion)', raw: `${emotionCoping} / 80` },
          avoidance_coping: { name: 'المواجهة بالتجنب (Avoidance)', raw: `${avoidanceCoping} / 80` },
          dominant_style: { name: 'أسلوب التكيف السائد', raw: stressResult?.ciss_coping?.dominant_label_ar },
        },
        raw_responses: { strScore, taskCoping, emotionCoping, avoidanceCoping },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم STR/CISS');
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
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                مقياس الضغط النفسي واستراتيجيات المواجهة (STR & CISS DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-300 border border-orange-500/20">
                Endler & Parker / Perceived Stress
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              قياس مستوى الضغط النفسي المدرك (STR) واستكشاف أساليب واستراتيجيات التكيف والمواجهة (CISS) الموجهة للمشكلة، الانفعال، والتجنب.
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
          {/* Patient Selector & Presets */}
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
                  <option value="">-- اختر راشداً/مراهقاً من العيادة --</option>
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
                onClick={() => setPreset('adaptive')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
              >
                مواجهة تكيفية
              </button>
              <button
                type="button"
                onClick={() => setPreset('burnout')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40"
              >
                ضغط حاد / احتراق
              </button>
              <button
                type="button"
                onClick={() => setPreset('avoidant')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30"
              >
                مواجهة بالتجنب
              </button>
            </div>
          </div>

          {/* DUAL DOMAIN TABS: STR vs CISS */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('stress')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse ${
                  activeTab === 'stress'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>1. مقياس الضغط النفسي المدرك (STR)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ciss')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse ${
                  activeTab === 'ciss'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>2. جرد استراتيجيات المواجهة (CISS - Endler & Parker)</span>
              </button>
            </div>

            {/* TAB 1: STR PERCEIVED STRESS */}
            {activeTab === 'stress' && (
              <div className="space-y-4 animate-in fade-in">
                {/* REAL-TIME STRESS THERMOMETER HERO BANNER */}
                {stressResult && (
                  <div className={`p-5 rounded-3xl border space-y-4 shadow-xl transition-all ${
                    stressResult.stress_scale?.level === 'high_burnout'
                      ? 'bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950 border-rose-500/50'
                      : stressResult.stress_scale?.level === 'moderate'
                      ? 'bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border-amber-500/40'
                      : 'bg-gradient-to-r from-slate-950 via-emerald-950/30 to-slate-950 border-emerald-500/40'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className={`px-5 py-2.5 rounded-2xl font-mono font-black text-2xl shadow-lg ${
                          stressResult.stress_scale?.level === 'high_burnout'
                            ? 'bg-rose-600 text-white shadow-rose-600/30 animate-pulse'
                            : stressResult.stress_scale?.level === 'moderate'
                            ? 'bg-amber-600 text-white shadow-amber-600/30'
                            : 'bg-emerald-600 text-white shadow-emerald-600/30'
                        }`}>
                          {strScore} / 40
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 font-bold block">مستوى الضغط النفسي المدرك (STR):</span>
                          <strong className="text-base font-black text-white block">
                            {stressResult.stress_scale?.label_ar}
                          </strong>
                          <span className="text-xs text-slate-400">
                            العتبة المرتفعة المنذرة بالاحتراق: 27 فما فوق
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STRESS SLIDER */}
                <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-orange-400 font-bold flex items-center space-x-1 space-x-reverse">
                      <Flame className="w-3.5 h-3.5" />
                      <span>مجموع درجات الضغط المدرك (0 إلى 40):</span>
                    </span>
                    <span className="font-mono text-orange-300 font-bold text-base">{strScore} / 40</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={strScore}
                    onChange={(e) => setStrScore(Number(e.target.value))}
                    className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>منخفض (0-13)</span>
                    <span>معتدل (14-26)</span>
                    <span>مرتفع جداً / إنذار احتراق (27-40)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CISS COPING STYLES */}
            {activeTab === 'ciss' && (
              <div className="space-y-4 animate-in fade-in">
                {/* REAL-TIME CISS COPING PROFILE HERO BANNER */}
                {stressResult && (
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/30 to-slate-950 border border-indigo-500/30 space-y-4 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-mono font-black text-xl shadow-lg shadow-indigo-600/30">
                          CISS
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 font-bold block">الأسلوب التكيفي السائد لمواجهة الضغوط:</span>
                          <strong className="text-base font-black text-white block">
                            {stressResult.ciss_coping?.dominant_label_ar}
                          </strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">المشكلة (T):</span>
                          <strong className="text-emerald-400 font-mono font-bold text-xs">{taskCoping}/80</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">الانفعال (E):</span>
                          <strong className="text-rose-400 font-mono font-bold text-xs">{emotionCoping}/80</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">التجنب (A):</span>
                          <strong className="text-amber-400 font-mono font-bold text-xs">{avoidanceCoping}/80</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 CISS COPING SCALE CONTROLS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-bold flex items-center space-x-1 space-x-reverse">
                        <Target className="w-3.5 h-3.5" />
                        <span>المواجهة الموجهة للمشكلة (Task):</span>
                      </span>
                      <span className="font-mono text-emerald-300 font-bold">{taskCoping} / 80</span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="80"
                      value={taskCoping}
                      onChange={(e) => setTaskCoping(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 block">حل المشكلات، التخطيط، والتركيز على الهدف</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-rose-400 font-bold flex items-center space-x-1 space-x-reverse">
                        <Heart className="w-3.5 h-3.5" />
                        <span>المواجهة الموجهة للانفعال (Emotion):</span>
                      </span>
                      <span className="font-mono text-rose-300 font-bold">{emotionCoping} / 80</span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="80"
                      value={emotionCoping}
                      onChange={(e) => setEmotionCoping(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                    <span className="text-[10px] text-slate-500 block">لوم الذات، القلق، والغضب والانفعال الزائد</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-bold flex items-center space-x-1 space-x-reverse">
                        <Footprints className="w-3.5 h-3.5" />
                        <span>المواجهة بالتجنب (Avoidance):</span>
                      </span>
                      <span className="font-mono text-amber-300 font-bold">{avoidanceCoping} / 80</span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="80"
                      value={avoidanceCoping}
                      onChange={(e) => setAvoidanceCoping(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 block">التشتيت، التسوق، والهروب الاجتماعي من الموقف</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير السريري للضغط والمواجهة (Synthèse STR/CISS):</span>
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
              onClick={() => setPreset('adaptive')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للمستوى التكيفي</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-indigo-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-xl shadow-orange-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ تقييم الضغط...' : 'اعتماد تقرير فحص الضغط والمواجهة STR/CISS 💾'}</span>
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
              تم توثيق نتائج تقييم الضغط النفسي وأساليب المواجهة بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل مستوى الضغط المدرك STR وأبعاد المواجهة CISS بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">مستوى الضغط:</span>
              <strong className="text-orange-400 text-base font-black font-mono">
                {strScore} / 40
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الأسلوب السائد:</span>
              <strong className="text-white font-bold">{stressResult?.ciss_coping?.dominant_label_ar}</strong>
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
