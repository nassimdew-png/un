import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  FileText, 
  Printer, 
  RotateCcw, 
  Save, 
  AlertTriangle, 
  User, 
  X, 
  Brain, 
  Layers, 
  TrendingUp, 
  Check, 
  Percent, 
  Sliders, 
  ShieldAlert
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

export default function Mem4RunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  // Raw subtest scores
  const [logMem1, setLogMem1] = useState(34);     // 0-50
  const [logMem2, setLogMem2] = useState(30);     // 0-50
  const [vPair1, setVPair1] = useState(22);       // 0-32
  const [vPair2, setVPair2] = useState(20);       // 0-32
  const [des1, setDes1] = useState(36);           // 0-48
  const [des2, setDes2] = useState(32);           // 0-48
  const [visRep1, setVisRep1] = useState(32);     // 0-43
  const [visRep2, setVisRep2] = useState(28);     // 0-43
  const [spatialAdd, setSpatialAdd] = useState(18); // 0-25

  const [memResult, setMemResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeMem4();
  }, [logMem1, logMem2, vPair1, vPair2, des1, des2, visRep1, visRep2, spatialAdd]);

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

  const recomputeMem4 = async () => {
    try {
      const resp = await clinicalTestApi.runMem4({
        logical_memory_1: logMem1,
        logical_memory_2: logMem2,
        verbal_paired_1: vPair1,
        verbal_paired_2: vPair2,
        designs_1: des1,
        designs_2: des2,
        visual_reproduction_1: visRep1,
        visual_reproduction_2: visRep2,
        spatial_addition: spatialAdd,
      });
      setMemResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('MEM-IV calculation error:', e);
    }
  };

  const setPreset = (type) => {
    if (type === 'normal') {
      setLogMem1(34); setLogMem2(30); setVPair1(22); setVPair2(20); setDes1(36); setDes2(32); setVisRep1(32); setVisRep2(28); setSpatialAdd(18);
    } else if (type === 'amnestic') {
      setLogMem1(24); setLogMem2(6); setVPair1(14); setVPair2(2); setDes1(20); setDes2(5); setVisRep1(18); setVisRep2(4); setSpatialAdd(10);
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط فحص MEM-IV بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'MEM_IV',
        calculated_total_score: memResult?.delayed_memory_index_dmi || 100,
        subscale_scores: {
          ami: { name: 'مؤشر الذاكرة السمعية (AMI)', raw: `${memResult?.auditory_memory_index_ami}` },
          vmi: { name: 'مؤشر الذاكرة البصرية (VMI)', raw: `${memResult?.visual_memory_index_vmi}` },
          vwmi: { name: 'مؤشر الذاكرة العاملة البصرية (VWMI)', raw: `${memResult?.visual_working_memory_vwmi}` },
          imi: { name: 'مؤشر الذاكرة الفورية (IMI)', raw: `${memResult?.immediate_memory_index_imi}` },
          dmi: { name: 'مؤشر الذاكرة المؤجلة (DMI)', raw: `${memResult?.delayed_memory_index_dmi}` },
          retention_rate: { name: 'معدل الاستبقاء بعد الكمون', raw: `${memResult?.retention_rate_pct}%`, interpretation: memResult?.retention_label_ar },
        },
        raw_responses: { logMem1, logMem2, vPair1, vPair2, des1, des2, visRep1, visRep2, spatialAdd },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم MEM-IV');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-600/30">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                مقياس وكسلر لذاكرة الراشدين (MEM-IV / WMS-IV DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                David Wechsler
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              المقياس الإكلينيكي الشامل لذاكرة الراشدين: المؤشرات الخمسة (AMI, VMI, VWMI, IMI, DMI) ونسبة الاستبقاء والتدهور المعرفي.
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
                <User className="w-4 h-4 text-purple-400" />
                <span>المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
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
                <User className="w-4 h-4 text-purple-400" />
                <span className="font-bold">المريض:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Demo Presets */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setPreset('normal')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
              >
                أداء ذاكري طبيعي
              </button>
              <button
                type="button"
                onClick={() => setPreset('amnestic')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/30"
              >
                بروفايل فقدان ذاكرة / تلاشي
              </button>
            </div>
          </div>

          {/* REAL-TIME 5-INDEX WMS-IV HERO & RETENTION GAUGE */}
          {memResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950/30 to-slate-950 border border-purple-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-purple-600 text-white font-mono font-black text-2xl shadow-lg shadow-purple-600/30">
                    {memResult.retention_rate_pct}%
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">معدل الاستبقاء والتوطيد (Taux de Rétention):</span>
                    <strong className="text-base font-black text-purple-300 block">
                      {memResult.retention_label_ar}
                    </strong>
                    <span className="text-xs text-slate-400">
                      الفورية IMI: <strong className="text-cyan-400 font-mono font-bold">{memResult.immediate_memory_index_imi}</strong> | المؤجلة DMI: <strong className="text-emerald-400 font-mono font-bold">{memResult.delayed_memory_index_dmi}</strong>
                    </span>
                  </div>
                </div>

                {/* 5 Index Scores Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center w-full sm:w-auto">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">السمعية (AMI):</span>
                    <strong className="text-purple-400 font-mono font-bold text-xs">{memResult.auditory_memory_index_ami}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">البصرية (VMI):</span>
                    <strong className="text-indigo-400 font-mono font-bold text-xs">{memResult.visual_memory_index_vmi}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">العاملة (VWMI):</span>
                    <strong className="text-pink-400 font-mono font-bold text-xs">{memResult.visual_working_memory_vwmi}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الفورية (IMI):</span>
                    <strong className="text-cyan-400 font-mono font-bold text-xs">{memResult.immediate_memory_index_imi}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">المؤجلة (DMI):</span>
                    <strong className="text-emerald-400 font-mono font-bold text-xs">{memResult.delayed_memory_index_dmi}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTEST SCORING GRIDS (AUDITORY & VISUAL PAIRINGS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Auditory Subtests */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-purple-400">1. الاختبارات السمعية اللفظية (Auditory / Verbal):</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">الذاكرة المنطقية 1 - فوري (Mémoire Logique I):</span>
                  <span className="font-mono text-purple-400 font-bold">{logMem1} / 50</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={logMem1}
                  onChange={(e) => setLogMem1(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">الذاكرة المنطقية 2 - مؤجل (Mémoire Logique II):</span>
                  <span className="font-mono text-purple-400 font-bold">{logMem2} / 50</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={logMem2}
                  onChange={(e) => setLogMem2(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">أزواج الكلمات 1 - فوري (Couples de mots I):</span>
                  <span className="font-mono text-purple-400 font-bold">{vPair1} / 32</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={vPair1}
                  onChange={(e) => setVPair1(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">أزواج الكلمات 2 - مؤجل (Couples de mots II):</span>
                  <span className="font-mono text-purple-400 font-bold">{vPair2} / 32</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={vPair2}
                  onChange={(e) => setVPair2(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            {/* Visual Subtests */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-indigo-400">2. الاختبارات البصرية المكانية (Visual / Spatial):</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">التصاميم 1 - فوري (Dessins I):</span>
                  <span className="font-mono text-indigo-400 font-bold">{des1} / 48</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={des1}
                  onChange={(e) => setDes1(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">التصاميم 2 - مؤجل (Dessins II):</span>
                  <span className="font-mono text-indigo-400 font-bold">{des2} / 48</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={des2}
                  onChange={(e) => setDes2(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">إعادة الإنتاج البصري 1 - فوري (Reproduction Visuelle I):</span>
                  <span className="font-mono text-indigo-400 font-bold">{visRep1} / 43</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="43"
                  value={visRep1}
                  onChange={(e) => setVisRep1(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">إعادة الإنتاج البصري 2 - مؤجل (Reproduction Visuelle II):</span>
                  <span className="font-mono text-indigo-400 font-bold">{visRep2} / 43</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="43"
                  value={visRep2}
                  onChange={(e) => setVisRep2(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Working Memory: Spatial Addition */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-pink-400 font-bold">الذاكرة العاملة البصرية - الجمع المكاني (Addition Spatiale):</span>
              <span className="font-mono text-pink-300 font-bold">{spatialAdd} / 25</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              value={spatialAdd}
              onChange={(e) => setSpatialAdd(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير العصبي لذاكرة الراشدين (Synthèse MEM-IV):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-purple-500 leading-relaxed"
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
              <span>إعادة ضبط للمستوى السليم</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-purple-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج MEM-IV...' : 'اعتماد تقرير فحص ذاكرة الراشدين MEM-IV 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border border-purple-500/30 mx-auto flex items-center justify-center text-purple-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق نتائج مقياس ذاكرة الراشدين MEM-IV بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم استخراج المؤشرات الخمسة وحساب معدل الاستبقاء بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">معدل الاستبقاء:</span>
              <strong className="text-purple-400 text-base font-black font-mono">
                {memResult?.retention_rate_pct}%
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الذاكرة المؤجلة DMI:</span>
              <strong className="text-emerald-400 text-base font-black font-mono">
                {memResult?.delayed_memory_index_dmi}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التقييم السريري:</span>
              <span className="text-white font-bold">{memResult?.retention_label_ar}</span>
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
