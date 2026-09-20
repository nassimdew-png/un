import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  FileText, 
  Printer, 
  ArrowRight, 
  RotateCcw, 
  Save, 
  AlertTriangle, 
  Sliders, 
  User, 
  Activity,
  BarChart3,
  TrendingUp,
  AlertOctagon,
  Layers,
  X,
  Target,
  Info
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

// Subtest Definitions mapped to WISC-V Primary Indices
const SUBTEST_GROUPS = [
  {
    indexKey: 'ICV',
    nameAr: 'الفهم اللفظي (Compréhension Verbale)',
    nameFr: 'Compréhension Verbale (VCI)',
    color: 'from-blue-600 to-indigo-600',
    borderColor: 'border-blue-500/30',
    badgeColor: 'text-blue-300 bg-blue-500/10',
    dotColor: '#3b82f6',
    items: [
      { key: 'similitudes', label: 'المتشابهات (Similitudes - SI)' },
      { key: 'vocabulaire', label: 'المفردات (Vocabulaire - VO)' },
    ],
  },
  {
    indexKey: 'IVS',
    nameAr: 'البصري المكاني (Visuospatial)',
    nameFr: 'Visuospatial (VSI)',
    color: 'from-cyan-600 to-teal-600',
    borderColor: 'border-cyan-500/30',
    badgeColor: 'text-cyan-300 bg-cyan-500/10',
    dotColor: '#06b6d4',
    items: [
      { key: 'cubes', label: 'المكعبات (Cubes - CD)' },
      { key: 'puzzles', label: 'الألغاز البصرية (Puzzles - VP)' },
    ],
  },
  {
    indexKey: 'IRF',
    nameAr: 'الاستدلال السائل (Raisonnement Fluide)',
    nameFr: 'Raisonnement Fluide (FRI)',
    color: 'from-emerald-600 to-teal-600',
    borderColor: 'border-emerald-500/30',
    badgeColor: 'text-emerald-300 bg-emerald-500/10',
    dotColor: '#10b981',
    items: [
      { key: 'matrices', label: 'المصفوفات (Matrices - MR)' },
      { key: 'balances', label: 'الموازين (Balances - FW)' },
    ],
  },
  {
    indexKey: 'IMT',
    nameAr: 'الذاكرة العاملة (Mémoire de Travail)',
    nameFr: 'Mémoire de Travail (WMI)',
    color: 'from-amber-600 to-orange-600',
    borderColor: 'border-amber-500/30',
    badgeColor: 'text-amber-300 bg-amber-500/10',
    dotColor: '#f59e0b',
    items: [
      { key: 'chiffres', label: 'ذاكرة الأرقام (Chiffres - DS)' },
      { key: 'images', label: 'ذاكرة الصور (Images - PS)' },
    ],
  },
  {
    indexKey: 'IVT',
    nameAr: 'سرعة المعالجة (Vitesse de Traitement)',
    nameFr: 'Vitesse de Traitement (PSI)',
    color: 'from-purple-600 to-pink-600',
    borderColor: 'border-purple-500/30',
    badgeColor: 'text-purple-300 bg-purple-500/10',
    dotColor: '#a855f7',
    items: [
      { key: 'code', label: 'الترميز (Code - CDG)' },
      { key: 'symboles', label: 'البحث عن الرموز (Symboles - SS)' },
    ],
  },
];

export default function WiscRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [subtests, setSubtests] = useState({
    similitudes: 11,
    vocabulaire: 10,
    cubes: 13,
    puzzles: 12,
    matrices: 9,
    balances: 10,
    chiffres: 7,
    images: 8,
    code: 6,
    symboles: 7,
  });

  const [wiscResult, setWiscResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeWisc();
  }, [subtests]);

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

  const recomputeWisc = async () => {
    try {
      const resp = await clinicalTestApi.runWisc({ subtests });
      setWiscResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('WISC calculation error:', e);
    }
  };

  const handleSubtestChange = (key, value) => {
    const val = Math.max(1, Math.min(19, Number(value)));
    setSubtests((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const setPreset = (type) => {
    if (type === 'average') {
      setSubtests({
        similitudes: 10, vocabulaire: 10, cubes: 10, puzzles: 10, matrices: 10,
        balances: 10, chiffres: 10, images: 10, code: 10, symboles: 10
      });
    } else if (type === 'gifted') {
      setSubtests({
        similitudes: 16, vocabulaire: 15, cubes: 14, puzzles: 15, matrices: 16,
        balances: 15, chiffres: 13, images: 14, code: 13, symboles: 14
      });
    } else if (type === 'dyslexia') {
      // High reasoning, lower verbal/working memory
      setSubtests({
        similitudes: 13, vocabulaire: 8, cubes: 14, puzzles: 13, matrices: 14,
        balances: 13, chiffres: 6, images: 11, code: 7, symboles: 8
      });
    }
    soundEngine.playTone(520, 0.06);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط تقييم الذكاء WISC-V بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'WISC_V',
        calculated_total_score: wiscResult?.fsiq || 100,
        subscale_scores: {
          ICV: { name: 'الفهم اللفظي (ICV)', raw: wiscResult?.indices?.ICV?.score || 100, standard: wiscResult?.indices?.ICV?.score || 100, interpretation: wiscResult?.indices?.ICV?.percentile + '%' },
          IVS: { name: 'البصري المكاني (IVS)', raw: wiscResult?.indices?.IVS?.score || 100, standard: wiscResult?.indices?.IVS?.score || 100, interpretation: wiscResult?.indices?.IVS?.percentile + '%' },
          IRF: { name: 'الاستدلال السائل (IRF)', raw: wiscResult?.indices?.IRF?.score || 100, standard: wiscResult?.indices?.IRF?.score || 100, interpretation: wiscResult?.indices?.IRF?.percentile + '%' },
          IMT: { name: 'الذاكرة العاملة (IMT)', raw: wiscResult?.indices?.IMT?.score || 100, standard: wiscResult?.indices?.IMT?.score || 100, interpretation: wiscResult?.indices?.IMT?.percentile + '%' },
          IVT: { name: 'سرعة المعالجة (IVT)', raw: wiscResult?.indices?.IVT?.score || 100, standard: wiscResult?.indices?.IVT?.score || 100, interpretation: wiscResult?.indices?.IVT?.percentile + '%' },
        },
        raw_responses: {
          subtests,
          fsiq: wiscResult?.fsiq,
          fsiq_ci_95: wiscResult?.fsiq_ci_95,
          discrepancy: wiscResult?.discrepancy,
          is_heterogeneous: wiscResult?.is_heterogeneous,
        },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم WISC-V');
    } finally {
      setSaving(false);
    }
  };

  // SVG 5-Index Radar Chart Generator
  const renderRadarChart = () => {
    if (!wiscResult?.indices) return null;

    const size = 260;
    const center = size / 2;
    const maxRadius = 95;
    const minScore = 45;
    const maxScore = 155;

    // 5 vertices angle in radians (starting from top - ICV)
    const angles = [
      -Math.PI / 2,                  // ICV (Top)
      -Math.PI / 2 + (2 * Math.PI) / 5,  // IVS (Top Right)
      -Math.PI / 2 + (4 * Math.PI) / 5,  // IRF (Bottom Right)
      -Math.PI / 2 + (6 * Math.PI) / 5,  // IMT (Bottom Left)
      -Math.PI / 2 + (8 * Math.PI) / 5,  // IVT (Top Left)
    ];

    const keys = ['ICV', 'IVS', 'IRF', 'IMT', 'IVT'];

    // Convert standard score (45-155) to radius
    const scoreToRadius = (score) => {
      const clamped = Math.max(minScore, Math.min(maxScore, score));
      return ((clamped - minScore) / (maxScore - minScore)) * maxRadius;
    };

    // Calculate (x, y) coordinates
    const getCoordinates = (radius, angle) => ({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });

    // Background Reference Concentric Rings (Score: 70, 85, 100, 115, 130)
    const rings = [70, 85, 100, 115, 130];

    // Normal Zone Polygon (90 to 109)
    const normalMinRadius = scoreToRadius(90);
    const normalMaxRadius = scoreToRadius(109);
    const normalZonePoints = angles.map((a) => getCoordinates(normalMaxRadius, a));
    const normalZonePath = normalZonePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    // Actual Data Polygon
    const dataPoints = keys.map((k, i) => {
      const score = wiscResult.indices[k]?.score || 100;
      return getCoordinates(scoreToRadius(score), angles[i]);
    });
    const dataPolygonPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    return (
      <div className="relative flex flex-col items-center justify-center p-3 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-inner">
        <svg width={size} height={size} className="overflow-visible select-none">
          {/* Concentric Reference Grid */}
          {rings.map((ringScore) => {
            const r = scoreToRadius(ringScore);
            const pts = angles.map((a) => getCoordinates(r, a));
            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
            return (
              <g key={ringScore}>
                <path
                  d={path}
                  fill={ringScore === 100 ? 'rgba(99, 102, 241, 0.05)' : 'none'}
                  stroke={ringScore === 100 ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.08)'}
                  strokeDasharray={ringScore === 100 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={center + 4}
                  y={center - r + 3}
                  fill="rgba(148, 163, 184, 0.5)"
                  fontSize="8"
                  fontWeight="bold"
                >
                  {ringScore}
                </text>
              </g>
            );
          })}

          {/* Normal Cognitive Range Band (90-109) */}
          <path
            d={normalZonePath}
            fill="rgba(16, 185, 129, 0.08)"
            stroke="rgba(16, 185, 129, 0.25)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* 5 Axis Radial Lines */}
          {angles.map((angle, i) => {
            const end = getCoordinates(maxRadius + 8, angle);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
              />
            );
          })}

          {/* Child's Data Area Polygon */}
          <path
            d={dataPolygonPath}
            fill="rgba(99, 102, 241, 0.35)"
            stroke="#818cf8"
            strokeWidth="2.5"
            className="transition-all duration-300 ease-out"
          />

          {/* Vertex Points & Labels */}
          {dataPoints.map((pt, i) => {
            const key = keys[i];
            const score = wiscResult.indices[key]?.score || 100;
            const labelPos = getCoordinates(maxRadius + 22, angles[i]);

            return (
              <g key={key}>
                {/* Glowing Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="#6366f1"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-lg"
                />

                {/* Vertex Label */}
                <text
                  x={labelPos.x}
                  y={labelPos.y + 3}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  {key} ({score})
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center space-x-3 space-x-reverse text-[10px] text-slate-400 mt-2">
          <span className="flex items-center space-x-1 space-x-reverse">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            <span>بروفايل المفحوص</span>
          </span>
          <span className="flex items-center space-x-1 space-x-reverse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-500 inline-block" />
            <span>النطاق المتوسط (90–109)</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                مقياس وكسلر لذكاء الأطفال (WISC-V DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Wechsler 5th Ed.
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              حساب مؤشرات الذكاء الخمسة (ICV, IVS, IRF, IMT, IVT)، معامل الذكاء الكلي (FSIQ/QIT)، الرادار المعرفي، وتحليل التباين.
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
          {/* Patient Selector & Quick Presets */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            {!patientId ? (
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300 w-full sm:w-1/2">
                <User className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="shrink-0">المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
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
              <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-300">
                <User className="w-4 h-4 text-indigo-400" />
                <span className="font-bold">المريض:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Presets */}
            <div className="flex items-center space-x-1.5 space-x-reverse text-xs">
              <span className="text-slate-400 text-[11px] font-bold">نماذج سريعة:</span>
              <button
                type="button"
                onClick={() => setPreset('average')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition-colors"
              >
                متوسط (10)
              </button>
              <button
                type="button"
                onClick={() => setPreset('gifted')}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-bold border border-indigo-500/30 transition-colors"
              >
                تفوق (HPI)
              </button>
              <button
                type="button"
                onClick={() => setPreset('dyslexia')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-colors"
              >
                صعوبات تعلم
              </button>
            </div>
          </div>

          {/* MAIN 2-PANEL LAYOUT (LEFT INPUTS / RIGHT LIVE DASHBOARD) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT PANEL: 10 SUBTEST INPUTS (5 DOMAINS) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>الدرجات المعيارية للاختبارات الفرعية الـ 10 (Notes Standard 1 à 19):</span>
                </h4>
                <span className="text-[11px] text-slate-400 font-mono font-bold">
                  المتوسط = 10 (±3)
                </span>
              </div>

              <div className="space-y-3.5">
                {SUBTEST_GROUPS.map((grp) => {
                  const idxScore = wiscResult?.indices?.[grp.indexKey]?.score || 100;
                  return (
                    <div
                      key={grp.indexKey}
                      className={`p-4 rounded-3xl bg-slate-950 border ${grp.borderColor} space-y-3 shadow-lg`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-black text-white">{grp.nameAr}</span>
                        <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-xl ${grp.badgeColor}`}>
                          {grp.indexKey}: {idxScore} (رتبة {wiscResult?.indices?.[grp.indexKey]?.percentile || 50}%)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {grp.items.map((st) => (
                          <div key={st.key} className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-300 font-medium text-[11px]">{st.label}</span>
                              <span className="font-mono text-indigo-400 font-black text-xs">
                                {subtests[st.key]} / 19
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="19"
                              value={subtests[st.key]}
                              onChange={(e) => handleSubtestChange(st.key, e.target.value)}
                              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="flex justify-between text-[9px] text-slate-500 font-mono px-0.5">
                              <span>1</span>
                              <span>7</span>
                              <span className="text-indigo-400 font-bold">10</span>
                              <span>13</span>
                              <span>19</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT PANEL: LIVE PSYCHOMETRIC RADAR & COGNITIVE DASHBOARD */}
            <div className="lg:col-span-5 space-y-4">
              <h4 className="text-xs font-black text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                <Target className="w-4 h-4 text-purple-400" />
                <span>المخطط السيكومتري والرادار المعرفي (Radar 5 Indices):</span>
              </h4>

              {/* RADAR CHART */}
              {renderRadarChart()}

              {/* FSIQ / QIT HERO BANNER */}
              {wiscResult && (
                <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/40 space-y-3 shadow-xl text-center">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-bold">معامل الذكاء الكلي (QIT):</span>
                    <span className="text-[11px] font-mono text-indigo-300 font-bold">
                      مجال الثقة 95%: [{wiscResult.fsiq_ci_95?.[0]} – {wiscResult.fsiq_ci_95?.[1]}]
                    </span>
                  </div>

                  <div className="flex items-center justify-center space-x-4 space-x-reverse">
                    <div className="px-5 py-2 rounded-2xl bg-indigo-600 text-white font-mono font-black text-3xl shadow-lg shadow-indigo-600/40">
                      QIT {wiscResult.fsiq}
                    </div>
                    <div className="text-right">
                      <strong className="text-sm font-black text-white block">
                        {wiscResult.fsiq_classification_ar}
                      </strong>
                      <span className="text-xs text-indigo-300 font-bold font-mono">
                        الرتبة المئينية: {wiscResult.fsiq_percentile}%
                      </span>
                    </div>
                  </div>

                  {/* Homogeneity Badge */}
                  <div className="pt-1">
                    {wiscResult.is_heterogeneous ? (
                      <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center space-x-2 space-x-reverse text-right">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          <strong>بروفايل غير متجانس:</strong> تباين دال ({wiscResult.discrepancy} نقطة) - فسر المؤشرات بشكل نوعي منفصل.
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-2 space-x-reverse text-right">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong>بروفايل متجانس:</strong> أداء متناسق ومتوازن (تباين {wiscResult.discrepancy} نقطة).
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتشخيص المعرفي (Synthèse Psychologique WISC-V):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPreset('average')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين للمتوسط (10)</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-xl shadow-indigo-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ التقييم المعرفي...' : 'اعتماد تقييم الذكاء WISC-V 💾'}</span>
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
              تم اعتماد وحفظ بطارية WISC-V السيكومترية بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم توثيق المؤشرات الخمسة وحساب معامل الذكاء الكلي وتوليد تقرير الحصيلة السريرية.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">معامل الذكاء الكلي:</span>
              <strong className="text-indigo-400 text-base font-black font-mono">QIT {wiscResult?.fsiq}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التصنيف:</span>
              <span className="text-white font-bold">{wiscResult?.fsiq_classification_ar}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">البروفايل:</span>
              <span className={`font-bold ${wiscResult?.is_heterogeneous ? 'text-amber-400' : 'text-emerald-400'}`}>
                {wiscResult?.profile_label_ar}
              </span>
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
              <span>📄 إدراج نتائج WISC-V في الحصيلة السريرية (Bilan Psychologique PDF A4) 🖨️</span>
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
