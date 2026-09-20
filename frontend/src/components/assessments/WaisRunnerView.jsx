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
  Brain, 
  Layers, 
  TrendingUp, 
  Check, 
  Sliders, 
  Zap, 
  Eye, 
  Puzzle, 
  Grid, 
  Clock
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

export default function WaisRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  // 10 Core Subtests (1-19)
  const [sim, setSim] = useState(12);
  const [voc, setVoc] = useState(13);
  const [inf, setInf] = useState(11);

  const [cub, setCub] = useState(11);
  const [mat, setMat] = useState(12);
  const [puz, setPuz] = useState(10);

  const [mch, setMch] = useState(10);
  const [ari, setAri] = useState(11);

  const [sym, setSym] = useState(9);
  const [cod, setCod] = useState(10);

  const [waisResult, setWaisResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeWais();
  }, [sim, voc, inf, cub, mat, puz, mch, ari, sym, cod]);

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

  const recomputeWais = async () => {
    try {
      const resp = await clinicalTestApi.runWais4({
        similitudes: sim,
        vocabulaire: voc,
        information: inf,
        cubes: cub,
        matrices: mat,
        puzzles_visuels: puz,
        memoire_chiffres: mch,
        arithmetique: ari,
        symboles: sym,
        code: cod,
      });
      setWaisResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('WAIS-IV calculation error:', e);
    }
  };

  const setPreset = (type) => {
    if (type === 'superior') {
      setSim(15); setVoc(16); setInf(14); setCub(14); setMat(15); setPuz(13); setMch(13); setAri(14); setSym(12); setCod(13);
    } else if (type === 'average') {
      setSim(10); setVoc(10); setInf(10); setCub(10); setMat(10); setPuz(10); setMch(10); setAri(10); setSym(10); setCod(10);
    } else if (type === 'heterogeneous') {
      setSim(16); setVoc(17); setInf(15); setCub(7); setMat(8); setPuz(6); setMch(14); setAri(15); setSym(7); setCod(8);
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار راشد/مراهق لربط تقييم WAIS-IV بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'WAIS_IV',
        calculated_total_score: waisResult?.fsiq || 100,
        subscale_scores: {
          fsiq: { name: 'حاصل الذكاء الكلي (FSIQ / QIT)', raw: `${waisResult?.fsiq}`, standard: `P=${waisResult?.fsiq_percentile}%`, interpretation: waisResult?.profile_status_ar },
          gai: { name: 'مؤشر القدرة العامة (GAI / IAG)', raw: `${waisResult?.gai}`, standard: `P=${waisResult?.gai_percentile}%` },
          vci: { name: 'مؤشر الفهم اللفظي (VCI / ICV)', raw: `${waisResult?.indices?.vci?.score}`, standard: `P=${waisResult?.indices?.vci?.percentile}%` },
          pri: { name: 'مؤشر الاستدلال الإدراكي (PRI / IRP)', raw: `${waisResult?.indices?.pri?.score}`, standard: `P=${waisResult?.indices?.pri?.percentile}%` },
          wmi: { name: 'مؤشر الذاكرة العاملة (WMI / IMT)', raw: `${waisResult?.indices?.wmi?.score}`, standard: `P=${waisResult?.indices?.wmi?.percentile}%` },
          psi: { name: 'مؤشر سرعة المعالجة (PSI / IVT)', raw: `${waisResult?.indices?.psi?.score}`, standard: `P=${waisResult?.indices?.psi?.percentile}%` },
        },
        raw_responses: { sim, voc, inf, cub, mat, puz, mch, ari, sym, cod },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم WAIS-IV');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                مقياس وكسلر لذكاء الراشدين (WAIS-IV DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                David Wechsler / 16-90 ans
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              المعيار الذهبي لتقييم الذكاء المعرفي للراشدين عبر المؤشرات الأربعة: الفهم اللفظي، الاستدلال الإدراكي، الذاكرة العاملة، وسرعة المعالجة.
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
                <span>المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
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
                <User className="w-4 h-4 text-indigo-400" />
                <span className="font-bold">المريض:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Demo Presets */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setPreset('superior')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold border border-slate-700"
              >
                ذكاء متفوق
              </button>
              <button
                type="button"
                onClick={() => setPreset('average')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
              >
                ذكاء متوسط
              </button>
              <button
                type="button"
                onClick={() => setPreset('heterogeneous')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30"
              >
                ملف غير متجانس (GAI)
              </button>
            </div>
          </div>

          {/* REAL-TIME WAIS-IV COMPOSITE HERO BANNER */}
          {waisResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/30 to-slate-950 border border-indigo-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-mono font-black text-2xl shadow-lg shadow-indigo-600/30">
                    FSIQ = {waisResult.fsiq}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">حاصل الذكاء الكلي ومؤشر القدرة العامة:</span>
                    <strong className="text-base font-black text-white block">
                      FSIQ: {waisResult.fsiq} (P={waisResult.fsiq_percentile}%) | GAI: {waisResult.gai} (P={waisResult.gai_percentile}%)
                    </strong>
                    <span className={`text-xs font-bold block mt-0.5 ${waisResult.is_heterogeneous ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {waisResult.is_heterogeneous ? `⚠️ تباين دال (${waisResult.discrepancy_points} نقطة): يُفضل اعتماد GAI` : '✅ ملف معرفي متجانس وموثوق إحصائياً'}
                    </span>
                  </div>
                </div>

                {/* 4 Index Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الفهم اللفظي (VCI):</span>
                    <strong className="text-blue-400 font-mono font-bold text-xs">{waisResult.indices?.vci?.score} (P={waisResult.indices?.vci?.percentile}%)</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الاستدلال (PRI):</span>
                    <strong className="text-teal-400 font-mono font-bold text-xs">{waisResult.indices?.pri?.score} (P={waisResult.indices?.pri?.percentile}%)</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الذاكرة (WMI):</span>
                    <strong className="text-amber-400 font-mono font-bold text-xs">{waisResult.indices?.wmi?.score} (P={waisResult.indices?.wmi?.percentile}%)</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">السرعة (PSI):</span>
                    <strong className="text-purple-400 font-mono font-bold text-xs">{waisResult.indices?.psi?.score} (P={waisResult.indices?.psi?.percentile}%)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10 CORE SUBTEST CONTROLS GROUPED BY INDEX */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* VCI Subtests */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-blue-400 flex items-center space-x-1 space-x-reverse">
                <FileText className="w-3.5 h-3.5" />
                <span>مؤشر الفهم اللفظي (VCI / ICV):</span>
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">التشابهات (Similitudes):</span>
                  <span className="font-mono text-blue-400 font-bold">{sim} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={sim} onChange={(e) => setSim(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">المفردات (Vocabulaire):</span>
                  <span className="font-mono text-blue-400 font-bold">{voc} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={voc} onChange={(e) => setVoc(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">المعلومات العامة (Information):</span>
                  <span className="font-mono text-blue-400 font-bold">{inf} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={inf} onChange={(e) => setInf(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
            </div>

            {/* PRI Subtests */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-teal-400 flex items-center space-x-1 space-x-reverse">
                <Grid className="w-3.5 h-3.5" />
                <span>مؤشر الاستدلال الإدراكي (PRI / IRP):</span>
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">تصميم المكعبات (Cubes):</span>
                  <span className="font-mono text-teal-400 font-bold">{cub} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={cub} onChange={(e) => setCub(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500" />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">المصفوفات (Matrices):</span>
                  <span className="font-mono text-teal-400 font-bold">{mat} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={mat} onChange={(e) => setMat(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500" />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">الألغاز البصرية (Puzzles visuels):</span>
                  <span className="font-mono text-teal-400 font-bold">{puz} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={puz} onChange={(e) => setPuz(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500" />
              </div>
            </div>

            {/* WMI Subtests */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-amber-400 flex items-center space-x-1 space-x-reverse">
                <Zap className="w-3.5 h-3.5" />
                <span>مؤشر الذاكرة العاملة (WMI / IMT):</span>
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">ذاكرة الأرقام (Mémoire des chiffres):</span>
                  <span className="font-mono text-amber-400 font-bold">{mch} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={mch} onChange={(e) => setMch(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">الاستدلال الحسابي (Arithmétique):</span>
                  <span className="font-mono text-amber-400 font-bold">{ari} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={ari} onChange={(e) => setAri(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
              </div>
            </div>

            {/* PSI Subtests */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-purple-400 flex items-center space-x-1 space-x-reverse">
                <Clock className="w-3.5 h-3.5" />
                <span>مؤشر سرعة المعالجة (PSI / IVT):</span>
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">البحث في الرموز (Symboles):</span>
                  <span className="font-mono text-purple-400 font-bold">{sym} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={sym} onChange={(e) => setSym(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">الترميز (Code):</span>
                  <span className="font-mono text-purple-400 font-bold">{cod} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={cod} onChange={(e) => setCod(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />
              </div>
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير النفسي العصبي لـ WAIS-IV:</span>
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
              onClick={() => setPreset('superior')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للمستوى المتفوق</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-indigo-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج WAIS-IV...' : 'اعتماد تقرير فحص ذكاء الراشدين WAIS-IV 💾'}</span>
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
              تم توثيق نتائج مقياس وكسلر للراشدين WAIS-IV بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل حاصل الذكاء الكلي FSIQ ومؤشر القدرة العامة GAI والمؤشرات الأربعة بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">FSIQ (حاصل الذكاء):</span>
              <strong className="text-indigo-400 text-base font-black font-mono">
                {waisResult?.fsiq}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">GAI (القدرة العامة):</span>
              <strong className="text-teal-400 text-base font-black font-mono">
                {waisResult?.gai}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الرتبة المئينية:</span>
              <span className="text-white font-mono font-bold">P = {waisResult?.fsiq_percentile}%</span>
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
