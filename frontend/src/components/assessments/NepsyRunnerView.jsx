import React, { useState, useEffect } from 'react';
import { 
  Brain, 
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
  Radar as RadarIcon, 
  Layers, 
  TrendingUp, 
  Check,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

const NEPSY_DOMAINS = [
  { key: 'attention_executive', nameAr: 'الانتباه والوظائف التنفيذية', nameFr: 'Attention & Exécutif', desc: 'الكف التثبيطي، المرونة المعرفية، والانتباه المستمر' },
  { key: 'language', nameAr: 'اللغة والمعالجة الفونولوجية', nameFr: 'Langage & Phonologie', desc: 'التسمية السريعة، الوعي الفونولوجي وفهم الأوامر' },
  { key: 'memory_learning', nameAr: 'الذاكرة والتعلم', nameFr: 'Mémoire & Apprentissage', desc: 'ذاكرة الوجوه، الذاكرة السردية، وتعلم القوائم اللفظية' },
  { key: 'sensorimotor', nameAr: 'الوظائف الحسية الحركية', nameFr: 'Sensorimoteur', desc: 'النقر بالأصابع، تقليد وضعيات اليد والتنسيق البصري الحركي' },
  { key: 'visuospatial', nameAr: 'المعالجة البصرية المكانية', nameFr: 'Visuospatial', desc: 'نسخ التصاميم، الأسهم، وإدراك العلاقات المكانية' },
  { key: 'social_perception', nameAr: 'الإدراك الاجتماعي ونظرية العقل', nameFr: 'Perception Sociale', desc: 'التعرف على انفعالات الوجوه وفهم النوايا والمنظور الذهني' },
];

export default function NepsyRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [domainScores, setDomainScores] = useState({
    attention_executive: 8,
    language: 11,
    memory_learning: 10,
    sensorimotor: 7,
    visuospatial: 13,
    social_perception: 9,
  });

  const [nepsyResult, setNepsyResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeNepsy();
  }, [domainScores]);

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

  const recomputeNepsy = async () => {
    try {
      const resp = await clinicalTestApi.runNepsy({ domains: domainScores });
      setNepsyResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('NEPSY calculation error:', e);
    }
  };

  const handleScoreChange = (key, val) => {
    const num = Math.max(1, Math.min(19, Number(val)));
    setDomainScores((prev) => ({ ...prev, [key]: num }));
  };

  const setPreset = (type) => {
    if (type === 'normal') {
      setDomainScores({ attention_executive: 10, language: 10, memory_learning: 10, sensorimotor: 10, visuospatial: 10, social_perception: 10 });
    } else if (type === 'adhd_profile') {
      setDomainScores({ attention_executive: 4, language: 11, memory_learning: 8, sensorimotor: 6, visuospatial: 12, social_perception: 9 });
    } else if (type === 'superior') {
      setDomainScores({ attention_executive: 14, language: 15, memory_learning: 14, sensorimotor: 13, visuospatial: 16, social_perception: 14 });
    }
    soundEngine.playTone(550, 0.05);
  };

  // SVG Radar Polygon Calculation (6 Axes, Center = 100,100, Radius = 80)
  const renderRadarPolygon = () => {
    const center = 100;
    const radius = 75;
    const maxVal = 19;
    const points = NEPSY_DOMAINS.map((dom, i) => {
      const score = domainScores[dom.key] || 10;
      const angle = (Math.PI * 2 / NEPSY_DOMAINS.length) * i - Math.PI / 2;
      const dist = (score / maxVal) * radius;
      const x = center + dist * Math.cos(angle);
      const y = center + dist * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    return points;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط تقييم NEPSY-II بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'NEPSY_II',
        calculated_total_score: nepsyResult?.mean_scaled_score || 10,
        subscale_scores: {
          mean_scaled: { name: 'المتوسط المعياري العام', raw: `${nepsyResult?.mean_scaled_score} / 19`, standard: `P=${nepsyResult?.mean_percentile}%` },
          strengths: { name: 'نقاط القوة المعرفية', raw: (nepsyResult?.strengths || []).join(', ') || 'لا توجد' },
          deficits: { name: 'مجالات العجز والقصور', raw: (nepsyResult?.deficits || []).join(', ') || 'لا توجد' },
          ...domainScores,
        },
        raw_responses: domainScores,
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم NEPSY-II');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-teal-600/30">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                بطارية التقييم النيوروبسيكولوجي للطفل (NEPSY-II DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Korkman, Kirk, Kemp
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              الملف النيوروبسيكولوجي لـ 6 مجالات وظيفية: الانتباه، اللغة، الذاكرة، الحركية، البصري المكاني، والإدراك الاجتماعي.
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
          {/* Patient Selector & Preset Quick Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            {!patientId ? (
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300 w-full sm:w-1/2">
                <User className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="shrink-0">المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
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
                <User className="w-4 h-4 text-teal-400" />
                <span className="font-bold">المريض:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Demo Profiles */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setPreset('normal')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
              >
                توزع متجانس (10)
              </button>
              <button
                type="button"
                onClick={() => setPreset('adhd_profile')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors"
              >
                بروفايل عجز تنفيذي
              </button>
              <button
                type="button"
                onClick={() => setPreset('superior')}
                className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-xs font-bold border border-teal-500/30 transition-colors"
              >
                تفوق نمائي
              </button>
            </div>
          </div>

          {/* REAL-TIME RADAR VISUALIZER & PERFORMANCE HERO BANNER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* SVG Radar Spider Chart */}
            <div className="lg:col-span-5 p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-2 shadow-xl">
              <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5 space-x-reverse">
                <RadarIcon className="w-4 h-4 text-teal-400" />
                <span>مخطط الرادار النيوروبسيكولوجي (6 مجالات):</span>
              </span>

              <div className="relative w-52 h-52 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Concentric Reference Circles (Scores 5, 10, 15, 19) */}
                  <circle cx="100" cy="100" r="19.7" fill="none" stroke="#334155" strokeDasharray="2,2" />
                  <circle cx="100" cy="100" r="39.4" fill="none" stroke="#475569" />
                  <circle cx="100" cy="100" r="59.2" fill="none" stroke="#334155" strokeDasharray="2,2" />
                  <circle cx="100" cy="100" r="75" fill="none" stroke="#64748b" />

                  {/* 6 Axis lines */}
                  {NEPSY_DOMAINS.map((_, i) => {
                    const angle = (Math.PI * 2 / NEPSY_DOMAINS.length) * i - Math.PI / 2;
                    const x = 100 + 75 * Math.cos(angle);
                    const y = 100 + 75 * Math.sin(angle);
                    return <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="#1e293b" strokeWidth="1.5" />;
                  })}

                  {/* Patient Data Polygon */}
                  <polygon
                    points={renderRadarPolygon()}
                    fill="rgba(20, 184, 166, 0.35)"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                    className="transition-all duration-300"
                  />
                </svg>
              </div>

              <div className="flex justify-between w-full text-[10px] text-slate-500 font-mono px-2">
                <span>الحد الأدنى: 1</span>
                <span>المتوسط المعياري: 10</span>
                <span>الحد الأقصى: 19</span>
              </div>
            </div>

            {/* Performance KPI & Strengths/Deficits */}
            <div className="lg:col-span-7 space-y-4">
              {nepsyResult && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950/30 to-slate-950 border border-teal-500/30 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="px-5 py-2.5 rounded-2xl bg-teal-600 text-white font-mono font-black text-2xl shadow-lg shadow-teal-600/30">
                      {nepsyResult.mean_scaled_score} / 19
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-bold block">المتوسط المعياري العام:</span>
                      <strong className="text-sm font-black text-teal-300 block">
                        الرتبة المئينية المقابلة: {nepsyResult.mean_percentile}%
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-emerald-400 font-bold block flex items-center space-x-1 space-x-reverse">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>نقاط القوة (Points Forts &ge; 13):</span>
                      </span>
                      <span className="text-xs text-white font-medium block">
                        {(nepsyResult.strengths || []).join('، ') || 'توزع متجانس للقدرات'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-rose-400 font-bold block flex items-center space-x-1 space-x-reverse">
                        <Flame className="w-3.5 h-3.5" />
                        <span>مجالات العجز (Déficits &le; 5):</span>
                      </span>
                      <span className="text-xs text-white font-medium block">
                        {(nepsyResult.deficits || []).join('، ') || 'لا يوجد عجز دال'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 6 DOMAIN SCALED SCORE SLIDERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NEPSY_DOMAINS.map((dom) => {
              const currentVal = domainScores[dom.key] || 10;
              const isDeficit = currentVal <= 5;
              const isStrength = currentVal >= 13;

              return (
                <div
                  key={dom.key}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDeficit
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isStrength
                      ? 'bg-teal-950/20 border-teal-500/40'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-bold text-white block">{dom.nameAr}</span>
                      <span className="text-[10px] text-slate-400 block">{dom.desc}</span>
                    </div>
                    <span className={`font-mono font-black text-sm px-2.5 py-1 rounded-xl border shrink-0 ${
                      isDeficit
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        : isStrength
                        ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                        : 'bg-slate-900 border-slate-700 text-white'
                    }`}>
                      {currentVal} / 19
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="19"
                    value={currentVal}
                    onChange={(e) => handleScoreChange(dom.key, e.target.value)}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />

                  <div className="flex justify-between text-[9px] text-slate-500 font-medium px-1 mt-1">
                    <span>1: عجز حاد</span>
                    <span>10: متوسط</span>
                    <span>19: تفوق فائق</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير النيوروبسيكولوجي (Synthèse NEPSY-II):</span>
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
              onClick={() => setPreset('normal')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للمتوسط (10)</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-indigo-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-xs shadow-xl shadow-teal-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج البطارية...' : 'اعتماد تقرير NEPSY-II النيوروبسيكولوجي 💾'}</span>
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
              تم توثيق نتائج بطارية NEPSY-II بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم حفظ بروفايل المجالات الستة ومخطط الرادار وتحديد نقاط القوة والضعف المعرفية.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">المتوسط المعياري:</span>
              <strong className="text-teal-400 text-base font-black font-mono">
                {nepsyResult?.mean_scaled_score} / 19
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الرتبة المئينية:</span>
              <strong className="text-white font-bold">{nepsyResult?.mean_percentile}%</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التاريخ:</span>
              <span className="text-white font-mono">{new Date().toLocaleDateString('ar-DZ')}</span>
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
