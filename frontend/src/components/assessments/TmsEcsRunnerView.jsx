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
  GraduationCap, 
  Layers, 
  TrendingUp, 
  Check, 
  Sliders, 
  BookOpen, 
  Calculator, 
  Eye, 
  PenTool, 
  Compass, 
  Volume2
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

export default function TmsEcsRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [activeTab, setActiveTab] = useState('tms'); // 'tms' | 'ecs'

  // TMS Subtests (0-15, 0-15, 0-10, 0-10)
  const [tmsVisual, setTmsVisual] = useState(13);
  const [tmsMotor, setTmsMotor] = useState(12);
  const [tmsSpatial, setTmsSpatial] = useState(8);
  const [tmsOral, setTmsOral] = useState(9);

  // ECS Subtests (0-20, 0-20, 0-20)
  const [ecsReading, setEcsReading] = useState(16);
  const [ecsSpelling, setEcsSpelling] = useState(15);
  const [ecsMath, setEcsMath] = useState(14);

  const [tmsEcsResult, setTmsEcsResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeTmsEcs();
  }, [tmsVisual, tmsMotor, tmsSpatial, tmsOral, ecsReading, ecsSpelling, ecsMath]);

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

  const recomputeTmsEcs = async () => {
    try {
      const resp = await clinicalTestApi.runTmsEcs({
        tms_visual_discrimination: tmsVisual,
        tms_motor_coordination: tmsMotor,
        tms_spatial_concepts: tmsSpatial,
        tms_oral_comprehension: tmsOral,
        ecs_reading: ecsReading,
        ecs_spelling: ecsSpelling,
        ecs_math: ecsMath,
      });
      setTmsEcsResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('TMS/ECS calculation error:', e);
    }
  };

  const setTmsPreset = (type) => {
    if (type === 'ready') {
      setTmsVisual(14); setTmsMotor(13); setTmsSpatial(9); setTmsOral(9);
    } else if (type === 'fragile') {
      setTmsVisual(10); setTmsMotor(8); setTmsSpatial(6); setTmsOral(7);
    } else if (type === 'not_ready') {
      setTmsVisual(6); setTmsMotor(5); setTmsSpatial(4); setTmsOral(4);
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار تلميذ لربط تقييم النضج والكفاءات المدرسية بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: activeTab === 'tms' ? 'TMS' : 'ECS_II_III',
        calculated_total_score: activeTab === 'tms' ? (tmsEcsResult?.tms?.smq_quotient || 0) : (tmsEcsResult?.ecs?.overall_academic_percentile || 0),
        subscale_scores: {
          tms_total: { name: 'مجموع النضج المدرسي (TMS)', raw: `${tmsEcsResult?.tms?.total_score} / 50`, standard: `SMQ=${tmsEcsResult?.tms?.smq_quotient}%`, interpretation: tmsEcsResult?.tms?.verdict_label_ar },
          tms_visual: { name: 'التمييز البصري', raw: `${tmsVisual} / 15` },
          tms_motor: { name: 'التآزر الحركي البصري', raw: `${tmsMotor} / 15` },
          tms_spatial: { name: 'المفاهيم الفضائية', raw: `${tmsSpatial} / 10` },
          tms_oral: { name: 'الفهم الشفهي للتعليمات', raw: `${tmsOral} / 10` },
          ecs_reading: { name: 'كفاءة القراءة (ECS)', raw: `${ecsReading} / 20`, standard: `P=${tmsEcsResult?.ecs?.reading_percentile}%` },
          ecs_spelling: { name: 'كفاءة الإملاء (ECS)', raw: `${ecsSpelling} / 20`, standard: `P=${tmsEcsResult?.ecs?.spelling_percentile}%` },
          ecs_math: { name: 'كفاءة الحساب والاستدلال (ECS)', raw: `${ecsMath} / 20`, standard: `P=${tmsEcsResult?.ecs?.math_percentile}%` },
        },
        raw_responses: { tmsVisual, tmsMotor, tmsSpatial, tmsOral, ecsReading, ecsSpelling, ecsMath },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم TMS/ECS');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                بطارية النضج والجاهزية والكفاءات المدرسية (TMS / ECS DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                School Readiness & Competencies
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              فحص الاستعداد والجاهزية للالتحاق بالتمدرس الإلزامي (TMS) وتقييم الكفاءات الأساسية في القراءة والإملاء والحساب (ECS).
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
                <User className="w-4 h-4 text-indigo-400" />
                <span>التلميذ المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- اختر طفلاً/تلميذاً من العيادة --</option>
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
                <span className="font-bold">التلميذ:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Demo Presets */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setTmsPreset('ready')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
              >
                جاهز للتمدرس
              </button>
              <button
                type="button"
                onClick={() => setTmsPreset('fragile')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30"
              >
                نضج هش
              </button>
              <button
                type="button"
                onClick={() => setTmsPreset('not_ready')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/30"
              >
                تأخر نضجي
              </button>
            </div>
          </div>

          {/* DUAL DOMAIN TABS: TMS vs ECS */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('tms')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse ${
                  activeTab === 'tms'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>1. اختبار النضج والجاهزية المدرسية (TMS - 5 إلى 7 سنوات)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ecs')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse ${
                  activeTab === 'ecs'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>2. بطارية الكفاءات المدرسية للابتدائي (ECS-II / III)</span>
              </button>
            </div>

            {/* TAB 1: TMS SCHOOL READINESS */}
            {activeTab === 'tms' && (
              <div className="space-y-4 animate-in fade-in">
                {/* REAL-TIME TMS READINESS HERO BANNER */}
                {tmsEcsResult && (
                  <div className={`p-5 rounded-3xl border space-y-4 shadow-xl transition-all ${
                    tmsEcsResult.tms?.verdict === 'ready'
                      ? 'bg-gradient-to-r from-slate-950 via-emerald-950/30 to-slate-950 border-emerald-500/40'
                      : tmsEcsResult.tms?.verdict === 'fragile'
                      ? 'bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border-amber-500/40'
                      : 'bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950 border-rose-500/50'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className={`px-5 py-2.5 rounded-2xl font-mono font-black text-2xl shadow-lg ${
                          tmsEcsResult.tms?.verdict === 'ready'
                            ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                            : tmsEcsResult.tms?.verdict === 'fragile'
                            ? 'bg-amber-600 text-white shadow-amber-600/30'
                            : 'bg-rose-600 text-white shadow-rose-600/30'
                        }`}>
                          SMQ = {tmsEcsResult.tms?.smq_quotient}%
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 font-bold block">قرار الجاهزية للتمدرس الإلزامي:</span>
                          <strong className="text-base font-black text-white block">
                            {tmsEcsResult.tms?.verdict_label_ar}
                          </strong>
                          <span className="text-xs text-slate-400">
                            المجموع الخام: <strong className="text-indigo-300 font-mono font-bold">{tmsEcsResult.tms?.total_score} / 50</strong>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">البصري:</span>
                          <strong className="text-sky-400 font-mono font-bold text-xs">{tmsVisual}/15</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">الحركي:</span>
                          <strong className="text-teal-400 font-mono font-bold text-xs">{tmsMotor}/15</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">الفضائي:</span>
                          <strong className="text-amber-400 font-mono font-bold text-xs">{tmsSpatial}/10</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">الشفهي:</span>
                          <strong className="text-indigo-400 font-mono font-bold text-xs">{tmsOral}/10</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4 TMS SUBTEST CONTROLS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sky-400 font-bold flex items-center space-x-1 space-x-reverse">
                        <Eye className="w-3.5 h-3.5" />
                        <span>1. التمييز البصري للشكل والأرضية:</span>
                      </span>
                      <span className="font-mono text-sky-300 font-bold">{tmsVisual} / 15</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={tmsVisual}
                      onChange={(e) => setTmsVisual(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-teal-400 font-bold flex items-center space-x-1 space-x-reverse">
                        <PenTool className="w-3.5 h-3.5" />
                        <span>2. التآزر الحركي البصري الدقيق:</span>
                      </span>
                      <span className="font-mono text-teal-300 font-bold">{tmsMotor} / 15</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={tmsMotor}
                      onChange={(e) => setTmsMotor(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-bold flex items-center space-x-1 space-x-reverse">
                        <Compass className="w-3.5 h-3.5" />
                        <span>3. المفاهيم الفضائية والاتجاهات:</span>
                      </span>
                      <span className="font-mono text-amber-300 font-bold">{tmsSpatial} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={tmsSpatial}
                      onChange={(e) => setTmsSpatial(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-indigo-400 font-bold flex items-center space-x-1 space-x-reverse">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>4. الفهم الشفهي للتعليمات المدرسية:</span>
                      </span>
                      <span className="font-mono text-indigo-300 font-bold">{tmsOral} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={tmsOral}
                      onChange={(e) => setTmsOral(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ECS SCHOOL COMPETENCIES */}
            {activeTab === 'ecs' && (
              <div className="space-y-4 animate-in fade-in">
                {/* REAL-TIME ECS HERO BANNER */}
                {tmsEcsResult && (
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-emerald-950/30 to-slate-950 border border-emerald-500/30 space-y-4 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-mono font-black text-2xl shadow-lg shadow-emerald-600/30">
                          {tmsEcsResult.ecs?.overall_academic_percentile}%
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 font-bold block">الرتبة المئينية العامة للكفاءات المدرسية:</span>
                          <strong className="text-base font-black text-white block">
                            مستوى تحصيلي عام متوافق مع الفئة العمرية
                          </strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">القراءة:</span>
                          <strong className="text-emerald-400 font-mono font-bold text-xs">{ecsReading}/20 (P={tmsEcsResult.ecs?.reading_percentile}%)</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">الإملاء:</span>
                          <strong className="text-teal-400 font-mono font-bold text-xs">{ecsSpelling}/20 (P={tmsEcsResult.ecs?.spelling_percentile}%)</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">الحساب:</span>
                          <strong className="text-sky-400 font-mono font-bold text-xs">{ecsMath}/20 (P={tmsEcsResult.ecs?.math_percentile}%)</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 ECS SUBTEST CONTROLS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-bold flex items-center space-x-1 space-x-reverse">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>القراءة وفك الشفرة:</span>
                      </span>
                      <span className="font-mono text-emerald-300 font-bold">{ecsReading} / 20</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={ecsReading}
                      onChange={(e) => setEcsReading(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-teal-400 font-bold flex items-center space-x-1 space-x-reverse">
                        <PenTool className="w-3.5 h-3.5" />
                        <span>الإملاء والتحليل الإملائي:</span>
                      </span>
                      <span className="font-mono text-teal-300 font-bold">{ecsSpelling} / 20</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={ecsSpelling}
                      onChange={(e) => setEcsSpelling(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-sky-400 font-bold flex items-center space-x-1 space-x-reverse">
                        <Calculator className="w-3.5 h-3.5" />
                        <span>الحساب والاستدلال الرياضي:</span>
                      </span>
                      <span className="font-mono text-sky-300 font-bold">{ecsMath} / 20</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={ecsMath}
                      onChange={(e) => setEcsMath(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير التربوي المدرسي (Synthèse TMS/ECS):</span>
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
              onClick={() => setTmsPreset('ready')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للمستوى السليم</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 hover:from-indigo-500 hover:to-sky-500 text-white font-black text-xs shadow-xl shadow-indigo-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ التقييم المدرسي...' : 'اعتماد تقرير فحص النضج المدرسي TMS/ECS 💾'}</span>
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
              تم توثيق نتائج تقييم النضج والكفاءات المدرسية بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم حساب حاصل النضج المدرسي SMQ ودرجات الكفاءات في القراءة والإملاء والحساب.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">حاصل النضج SMQ:</span>
              <strong className="text-indigo-400 text-base font-black font-mono">
                {tmsEcsResult?.tms?.smq_quotient}%
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">القرار المدرسي:</span>
              <strong className="text-white font-bold">{tmsEcsResult?.tms?.verdict_label_ar}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الكفاءة الأكاديمية:</span>
              <span className="text-emerald-400 font-mono font-bold">{tmsEcsResult?.ecs?.overall_academic_percentile}%</span>
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
