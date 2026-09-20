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
  Baby, 
  Layers, 
  TrendingUp, 
  Check, 
  Sliders, 
  Zap, 
  Eye, 
  Grid, 
  Puzzle, 
  Clock
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

export default function WppsiRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [ageBand, setAgeBand] = useState('4:0 - 7:7'); // '2:6 - 3:11' | '4:0 - 7:7'

  // Subtests for 2:6 - 3:11
  const [cubes2, setCubes2] = useState(11);
  const [info2, setInfo2] = useState(12);
  const [vocRec2, setVocRec2] = useState(13);

  // Subtests for 4:0 - 7:7
  const [cubes4, setCubes4] = useState(11);
  const [info4, setInfo4] = useState(12);
  const [matrices4, setMatrices4] = useState(10);
  const [voc4, setVoc4] = useState(13);
  const [puzzles4, setPuzzles4] = useState(11);
  const [barrage4, setBarrage4] = useState(9);

  const [wppsiResult, setWppsiResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeWppsi();
  }, [ageBand, cubes2, info2, vocRec2, cubes4, info4, matrices4, voc4, puzzles4, barrage4]);

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

  const recomputeWppsi = async () => {
    try {
      const payload = ageBand === '2:6 - 3:11' ? {
        age_band: '2:6 - 3:11',
        cubes: cubes2,
        information: info2,
        vocabulaire_receptif: vocRec2,
      } : {
        age_band: '4:0 - 7:7',
        cubes: cubes4,
        information: info4,
        matrices: matrices4,
        vocabulaire: voc4,
        puzzles_visuels: puzzles4,
        barrage: barrage4,
      };

      const resp = await clinicalTestApi.runWppsi4(payload);
      setWppsiResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('WPPSI-IV calculation error:', e);
    }
  };

  const setPreset = (type) => {
    if (type === 'superior') {
      setCubes2(15); setInfo2(14); setVocRec2(16);
      setCubes4(14); setInfo4(15); setMatrices4(14); setVoc4(16); setPuzzles4(13); setBarrage4(12);
    } else if (type === 'average') {
      setCubes2(10); setInfo2(10); setVocRec2(10);
      setCubes4(10); setInfo4(10); setMatrices4(10); setVoc4(10); setPuzzles4(10); setBarrage4(10);
    } else if (type === 'fragile') {
      setCubes2(6); setInfo2(7); setVocRec2(6);
      setCubes4(6); setInfo4(7); setMatrices4(6); setVoc4(7); setPuzzles4(6); setBarrage4(5);
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار طفل لربط تقييم WPPSI-IV بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'WPPSI_IV',
        calculated_total_score: wppsiResult?.fsiq || 100,
        subscale_scores: {
          age_band: { name: 'الفئة العمرية المفحوصة', raw: ageBand },
          fsiq: { name: 'حاصل الذكاء الكلي النمائي (FSIQ / QIT)', raw: `${wppsiResult?.fsiq}`, standard: `P=${wppsiResult?.fsiq_percentile}%` },
          vci: { name: 'مؤشر الفهم اللفظي (VCI)', raw: `${wppsiResult?.indices?.vci?.score}`, standard: `P=${wppsiResult?.indices?.vci?.percentile}%` },
          vsi: { name: 'مؤشر البصري الفضائي (VSI)', raw: `${wppsiResult?.indices?.vsi?.score}`, standard: `P=${wppsiResult?.indices?.vsi?.percentile}%` },
        },
        raw_responses: { ageBand, cubes2, info2, vocRec2, cubes4, info4, matrices4, voc4, puzzles4, barrage4 },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم WPPSI-IV');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-teal-600/30">
            <Baby className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                مقياس وكسلر لذكاء الطفولة المبكرة وما قبل التمدرس (WPPSI-IV DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                David Wechsler / 2:6 - 7:7 ans
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تقييم الذكاء المعرفي النمائي للأطفال الصغار بفئتين عمريتين مع مؤشرات الفهم اللفظي، البصري الفضائي، والاستدلال السائل.
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
          {/* Patient Selector & Age Bands */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {!patientId ? (
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300">
                <User className="w-4 h-4 text-teal-400" />
                <span>الطفل المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
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

            {/* Age Band Selector */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setAgeBand('2:6 - 3:11')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  ageBand === '2:6 - 3:11'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                الفئة الصغرى (2:6 إلى 3:11 سنة)
              </button>
              <button
                type="button"
                onClick={() => setAgeBand('4:0 - 7:7')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  ageBand === '4:0 - 7:7'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                الفئة الكبرى (4:0 إلى 7:7 سنوات)
              </button>
            </div>
          </div>

          {/* REAL-TIME WPPSI-IV HERO BANNER */}
          {wppsiResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950/30 to-slate-950 border border-teal-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-teal-600 text-white font-mono font-black text-2xl shadow-lg shadow-teal-600/30">
                    FSIQ = {wppsiResult.fsiq}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">حاصل الذكاء الكلي النمائي:</span>
                    <strong className="text-base font-black text-white block">
                      WPPSI-IV ({ageBand}): FSIQ {wppsiResult.fsiq} (الرتبة المئينية: P={wppsiResult.fsiq_percentile}%)
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الفهم اللفظي (VCI):</span>
                    <strong className="text-teal-400 font-mono font-bold text-xs">{wppsiResult.indices?.vci?.score}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">البصري الفضائي (VSI):</span>
                    <strong className="text-emerald-400 font-mono font-bold text-xs">{wppsiResult.indices?.vsi?.score}</strong>
                  </div>
                  {wppsiResult.indices?.fri && (
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">الاستدلال السائل (FRI):</span>
                      <strong className="text-sky-400 font-mono font-bold text-xs">{wppsiResult.indices?.fri?.score}</strong>
                    </div>
                  )}
                  {wppsiResult.indices?.psi && (
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">سرعة المعالجة (PSI):</span>
                      <strong className="text-purple-400 font-mono font-bold text-xs">{wppsiResult.indices?.psi?.score}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC SUBTEST MATRIX BASED ON AGE BAND */}
          {ageBand === '2:6 - 3:11' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-teal-400 font-bold">تصميم المكعبات:</span>
                  <span className="font-mono text-teal-300 font-bold">{cubes2} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={cubes2} onChange={(e) => setCubes2(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold">المعلومات العامة:</span>
                  <span className="font-mono text-emerald-300 font-bold">{info2} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={info2} onChange={(e) => setInfo2(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-400 font-bold">المفردات الاستقبالية:</span>
                  <span className="font-mono text-sky-300 font-bold">{vocRec2} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={vocRec2} onChange={(e) => setVocRec2(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-teal-400 font-bold">تصميم المكعبات:</span>
                  <span className="font-mono text-teal-300 font-bold">{cubes4} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={cubes4} onChange={(e) => setCubes4(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold">المعلومات العامة:</span>
                  <span className="font-mono text-emerald-300 font-bold">{info4} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={info4} onChange={(e) => setInfo4(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-400 font-bold">المصفوفات:</span>
                  <span className="font-mono text-sky-300 font-bold">{matrices4} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={matrices4} onChange={(e) => setMatrices4(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-400 font-bold">المفردات اللفظية:</span>
                  <span className="font-mono text-indigo-300 font-bold">{voc4} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={voc4} onChange={(e) => setVoc4(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-400 font-bold">الألغاز البصرية:</span>
                  <span className="font-mono text-purple-300 font-bold">{puzzles4} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={puzzles4} onChange={(e) => setPuzzles4(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-bold">الشطب والسرعة:</span>
                  <span className="font-mono text-amber-300 font-bold">{barrage4} / 19</span>
                </div>
                <input type="range" min="1" max="19" value={barrage4} onChange={(e) => setBarrage4(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
              </div>
            </div>
          )}

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير النمائي لـ WPPSI-IV:</span>
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
              onClick={() => setPreset('superior')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للمستوى المتفوق</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs shadow-xl shadow-teal-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج WPPSI-IV...' : 'اعتماد تقرير فحص ذكاء الطفولة WPPSI-IV 💾'}</span>
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
              تم توثيق نتائج مقياس وكسلر للطفولة المبكرة WPPSI-IV بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل حاصل الذكاء النمائي FSIQ والمؤشرات المعرفية بملف الطفل.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">حاصل الذكاء FSIQ:</span>
              <strong className="text-teal-400 text-base font-black font-mono">
                {wppsiResult?.fsiq}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الفئة العمرية:</span>
              <strong className="text-white font-bold">{ageBand}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الرتبة المئينية:</span>
              <span className="text-emerald-400 font-mono font-bold">P = {wppsiResult?.fsiq_percentile}%</span>
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
