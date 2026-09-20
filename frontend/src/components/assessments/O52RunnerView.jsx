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
  MessageSquare, 
  Layers, 
  TrendingUp, 
  Check, 
  Sliders, 
  Volume2, 
  GitBranch, 
  Sparkle
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

export default function O52RunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [correct, setCorrect] = useState(42);
  const [syntactic, setSyntactic] = useState(5);
  const [semantic, setSemantic] = useState(3);
  const [spatial, setSpatial] = useState(2);
  const [chronoMonths, setChronoMonths] = useState(72); // 6 years

  const [o52Result, setO52Result] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeO52();
  }, [correct, syntactic, semantic, spatial, chronoMonths]);

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

  const recomputeO52 = async () => {
    try {
      const resp = await clinicalTestApi.runO52({
        correct_count: correct,
        syntactic_errors: syntactic,
        semantic_errors: semantic,
        spatial_errors: spatial,
        chronological_age_months: chronoMonths,
      });
      setO52Result(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('O-52 calculation error:', e);
    }
  };

  const setPreset = (type) => {
    if (type === 'advanced') {
      setCorrect(48); setSyntactic(2); setSemantic(1); setSpatial(1);
    } else if (type === 'average') {
      setCorrect(40); setSyntactic(6); setSemantic(4); setSpatial(2);
    } else if (type === 'delayed') {
      setCorrect(24); setSyntactic(16); setSemantic(8); setSpatial(4);
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار طفل لربط تقييم الفهم المورفوسنتاكسي بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'O52',
        calculated_total_score: o52Result?.correct_count || 0,
        subscale_scores: {
          total_correct: { name: 'الإجابات الصحيحة', raw: `${correct} / 52`, standard: `P=${o52Result?.percentile}%` },
          morphosyntactic_age: { name: 'العمر المورفوسنتاكسي المكافئ', raw: `${o52Result?.morphosyntactic_age_years} سنة (${o52Result?.morphosyntactic_age_months} شهراً)`, interpretation: o52Result?.gap_label_ar },
          syntactic_errors: { name: 'أخطاء تركيبية نحوية', raw: `${syntactic}` },
          semantic_errors: { name: 'أخطاء دلالية معجمية', raw: `${semantic}` },
          spatial_errors: { name: 'أخطاء مكانية وفضائية', raw: `${spatial}` },
        },
        raw_responses: { correct, syntactic, semantic, spatial, chronoMonths },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم O-52');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-600/30">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                اختبار الفهم المورفوسنتاكسي والتركيبي الشفهي (O-52 - Khomsi DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Amor Khomsi / 3-9 ans
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              فحص الفهم النحوي والتركيبي للجمل (52 بنداً) مع تتبع وتصنيف الأخطاء التركيبية، الدلالية، والفضائية واستخراج العمر النحوي.
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
                <User className="w-4 h-4 text-cyan-400" />
                <span>المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-500"
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
                <User className="w-4 h-4 text-cyan-400" />
                <span className="font-bold">المريض:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Demo Presets */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setPreset('advanced')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700"
              >
                فهم متقدم
              </button>
              <button
                type="button"
                onClick={() => setPreset('average')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
              >
                فهم متوسط
              </button>
              <button
                type="button"
                onClick={() => setPreset('delayed')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/30"
              >
                عجز تركيبي (Dysphasie)
              </button>
            </div>
          </div>

          {/* REAL-TIME O-52 HERO BANNER */}
          {o52Result && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-cyan-950/30 to-slate-950 border border-cyan-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-cyan-600 text-white font-mono font-black text-2xl shadow-lg shadow-cyan-600/30">
                    {correct} / 52
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">العمر المورفوسنتاكسي المكافئ:</span>
                    <strong className="text-base font-black text-white block">
                      {o52Result.morphosyntactic_age_years} سنة ({o52Result.morphosyntactic_age_months} شهراً - P={o52Result.percentile}%)
                    </strong>
                    <span className={`text-xs font-bold block mt-0.5 ${o52Result.gap_months >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {o52Result.gap_label_ar}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">أخطاء نحوية:</span>
                    <strong className="text-rose-400 font-mono font-bold text-xs">{syntactic}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">أخطاء دلالية:</span>
                    <strong className="text-amber-400 font-mono font-bold text-xs">{semantic}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">أخطاء فضائية:</span>
                    <strong className="text-purple-400 font-mono font-bold text-xs">{spatial}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHRONOLOGICAL AGE & ERROR TAXONOMY CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-400 font-bold">العمر الزمني للطفل (بالأشهر):</span>
                <span className="font-mono text-cyan-300 font-bold">{chronoMonths} شهر ({(chronoMonths/12).toFixed(1)} سنة)</span>
              </div>
              <input
                type="range"
                min="36"
                max="120"
                value={chronoMonths}
                onChange={(e) => setChronoMonths(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold">الإجابات الصحيحة (Correct Items):</span>
                <span className="font-mono text-emerald-300 font-bold">{correct} / 52</span>
              </div>
              <input
                type="range"
                min="0"
                max="52"
                value={correct}
                onChange={(e) => setCorrect(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* 3 DISTRACTOR SLIDERS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-400 font-bold">أخطاء تركيبية نحوية:</span>
                <span className="font-mono text-rose-300 font-bold">{syntactic}</span>
              </div>
              <input
                type="range"
                min="0"
                max="52"
                value={syntactic}
                onChange={(e) => setSyntactic(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400 font-bold">أخطاء دلالية معجمية:</span>
                <span className="font-mono text-amber-300 font-bold">{semantic}</span>
              </div>
              <input
                type="range"
                min="0"
                max="52"
                value={semantic}
                onChange={(e) => setSemantic(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-400 font-bold">أخطاء مكانية وفضائية:</span>
                <span className="font-mono text-purple-300 font-bold">{spatial}</span>
              </div>
              <input
                type="range"
                min="0"
                max="52"
                value={spatial}
                onChange={(e) => setSpatial(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير الأرطوفوني لـ O-52:</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPreset('average')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للمستوى المتوسط</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-xl shadow-cyan-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج O-52...' : 'اعتماد تقرير فحص الفهم التركيبي O-52 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-500/30 mx-auto flex items-center justify-center text-cyan-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق نتائج اختبار الفهم المورفوسنتاكسي O-52 بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل العمر النحوي المكافئ ومصفوفة الأخطاء التركيبية والدلالية بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">الدرجة الإجمالية:</span>
              <strong className="text-cyan-400 text-base font-black font-mono">
                {o52Result?.correct_count} / 52
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">العمر النحوي:</span>
              <strong className="text-white font-bold">{o52Result?.morphosyntactic_age_years} سنة</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الفارق النمائي:</span>
              <span className={`font-mono font-bold ${o52Result?.gap_months >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {o52Result?.gap_months >= 0 ? `+${o52Result?.gap_months}m` : `${o52Result?.gap_months}m`}
              </span>
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
