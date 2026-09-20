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
  Eye, 
  ShieldCheck, 
  Compass
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

const TAT_PLATES = [
  { id: '1', title: 'Planche 1', desc: 'فتى صغير ينظر إلى كمان موضوع أمامه (العلاقة مع الواجب، الطموح، والإحباط الأوديبي)' },
  { id: '2', title: 'Planche 2', desc: 'مشهد ريفي: فتاة تحمل كتباً، رجل يحرث، وامرأة تستند إلى شجرة (التثليث العائلي والصراع الأوديبي)' },
  { id: '3BM', title: 'Planche 3BM', desc: 'شخص منحنٍ على سرير أو أريكة وإلى جانبه مسدس (الحزن، الاكتئاب، والعدوانية نحو الذات)' },
  { id: '4', title: 'Planche 4', desc: 'امرأة تمسك رجلاً يحاول الابتعاد عنها (العلاقة الثنائية، الغيرة، والعدوانية الجنسية)' },
  { id: '13MF', title: 'Planche 13MF', desc: 'شاب يقف واضعاً ذراعه على وجهه وامرأة مستلقية على السرير (الجنس، الذنب، والعدوانية)' },
];

export default function TatRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [selectedPlate, setSelectedPlate] = useState('1');
  const [plateVerbatims, setPlateVerbatims] = useState({
    '1': 'طفل يريد أن يعزف على الكمان لكنه يشعر بصعوبة المهمة، وفي النهاية يتدرب وينجح.',
    '2': 'الفتاة تستعد للذهاب إلى المدرسة بينما والداها يعملان في المزرعة، تشعر بالمسؤولية تجاههما.',
    '3BM': 'شخص متعب جداً بعد يوم شاق، يستريح قليلاً وسينهض لمواصلة عمله.',
    '4': 'زوجان في نقاش حاد حول موضوع عائلي، الزوجة تحاول تهدئة زوجها بحنان.',
    '13MF': 'رجل حزين على مرض زوجته، يقف مصدوماً لكنه يستجمع قواه لطلب الطبيب.',
  });

  // Shentoub Grid Series Counts
  const [seriesA, setSeriesA] = useState(8); // Rigidité / Contrôle
  const [seriesB, setSeriesB] = useState(4); // Labilité affective
  const [seriesC, setSeriesC] = useState(3); // Évitement du conflit
  const [seriesE, setSeriesE] = useState(1); // Processus primaires

  const [tatResult, setTatResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeTat();
  }, [seriesA, seriesB, seriesC, seriesE, plateVerbatims]);

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

  const recomputeTat = async () => {
    try {
      const resp = await clinicalTestApi.runTat({
        series_a_count: seriesA,
        series_b_count: seriesB,
        series_c_count: seriesC,
        series_e_count: seriesE,
      });
      setTatResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('TAT calculation error:', e);
    }
  };

  const setPreset = (type) => {
    if (type === 'neurotic') {
      setSeriesA(9); setSeriesB(4); setSeriesC(2); setSeriesE(0);
    } else if (type === 'borderline') {
      setSeriesA(3); setSeriesB(8); setSeriesC(5); setSeriesE(1);
    } else if (type === 'psychotic') {
      setSeriesA(2); setSeriesB(2); setSeriesC(3); setSeriesE(6);
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط تقييم TAT بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'TAT',
        calculated_total_score: tatResult?.series_proportions?.series_a_rigidity?.percentage || 50,
        subscale_scores: {
          organization_type: { name: 'الفرضية التشخيصية للتنظيم النفسي', raw: tatResult?.psychic_organization_label_ar },
          series_a: { name: 'سلسلة A: الصلابة والتحكم (Rigidité)', raw: `${seriesA} آليات (${tatResult?.series_proportions?.series_a_rigidity?.percentage}%)` },
          series_b: { name: 'سلسلة B: الهشاشة الانفعالية (Labilité)', raw: `${seriesB} آليات (${tatResult?.series_proportions?.series_b_lability?.percentage}%)` },
          series_c: { name: 'سلسلة C: تجنب الصراع (Évitement)', raw: `${seriesC} آليات (${tatResult?.series_proportions?.series_c_avoidance?.percentage}%)` },
          series_e: { name: 'سلسلة E: العمليات الأولية (Processus primaires)', raw: `${seriesE} آليات (${tatResult?.series_proportions?.series_e_primary?.percentage}%)` },
        },
        raw_responses: { seriesA, seriesB, seriesC, seriesE, plateVerbatims },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم TAT');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                اختبار تفهم الموضوع الإسقاطي للراشدين (TAT - شبكة شنتوب DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                H. Murray & Vica Shentoub
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تفريغ وتحليل القصص الإسقاطية وفق شبكة شنتوب (السلاسل A، B، C، E) لتحديد الفرضية التشخيصية للبنية النفسية.
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
                onClick={() => setPreset('neurotic')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
              >
                بنية عصابية
              </button>
              <button
                type="button"
                onClick={() => setPreset('borderline')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30"
              >
                تنظيم حدي
              </button>
              <button
                type="button"
                onClick={() => setPreset('psychotic')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/30"
              >
                انبثاق عمليات أولية
              </button>
            </div>
          </div>

          {/* REAL-TIME SHENTOUB PSYCHIC STRUCTURE HERO BANNER */}
          {tatResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/30 to-slate-950 border border-indigo-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-mono font-black text-xl shadow-lg shadow-indigo-600/30">
                    TAT GRID
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">الفرضية التشخيصية للتنظيم النفسي (Shentoub):</span>
                    <strong className="text-base font-black text-white block">
                      {tatResult.psychic_organization_label_ar}
                    </strong>
                  </div>
                </div>

                {/* 4 Series Breakdown Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الصلابة (A):</span>
                    <strong className="text-indigo-400 font-mono font-bold text-xs">{tatResult.series_proportions?.series_a_rigidity?.percentage}%</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الهشاشة (B):</span>
                    <strong className="text-pink-400 font-mono font-bold text-xs">{tatResult.series_proportions?.series_b_lability?.percentage}%</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">التجنب (C):</span>
                    <strong className="text-amber-400 font-mono font-bold text-xs">{tatResult.series_proportions?.series_c_avoidance?.percentage}%</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الأولية (E):</span>
                    <strong className="text-rose-400 font-mono font-bold text-xs">{tatResult.series_proportions?.series_e_primary?.percentage}%</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SHENTOUB SERIES MECHANISM SLIDERS */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-indigo-400 border-b border-slate-800/80 pb-2">
              تعداد إجراءات الخطاب الدفاعي وفق شبكة شنتوب (Séries Shentoub):
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-300 font-bold">سلسلة A: الصلابة والتحكم (Rigidité / Contrôle):</span>
                  <span className="font-mono text-indigo-400 font-bold">{seriesA}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={seriesA}
                  onChange={(e) => setSeriesA(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-pink-300 font-bold">سلسلة B: الهشاشة الانفعالية (Labilité affective):</span>
                  <span className="font-mono text-pink-400 font-bold">{seriesB}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={seriesB}
                  onChange={(e) => setSeriesB(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-300 font-bold">سلسلة C: تجنب الصراع والتثبيط (Évitement du conflit):</span>
                  <span className="font-mono text-amber-400 font-bold">{seriesC}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={seriesC}
                  onChange={(e) => setSeriesC(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-300 font-bold">سلسلة E: انبثاق العمليات الأولية (Processus primaires):</span>
                  <span className="font-mono text-rose-400 font-bold">{seriesE}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={seriesE}
                  onChange={(e) => setSeriesE(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            </div>
          </div>

          {/* PLATE-BY-PLATE VERBATIM EXPLORER */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-purple-400">سرد واستجابات المفحوص على لوحات TAT (Verbatim):</h4>

            <div className="flex flex-wrap gap-2">
              {TAT_PLATES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedPlate(p.id); soundEngine.playTone(500, 0.03); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedPlate === p.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>

            {/* Selected Plate Details & Text Area */}
            {TAT_PLATES.find((p) => p.id === selectedPlate) && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] text-slate-400">
                  {TAT_PLATES.find((p) => p.id === selectedPlate).desc}
                </p>
                <textarea
                  rows="3"
                  value={plateVerbatims[selectedPlate] || ''}
                  onChange={(e) => setPlateVerbatims({ ...plateVerbatims, [selectedPlate]: e.target.value })}
                  placeholder="سجل القصة التي رواها المفحوص حرفياً..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير الإسقاطي لـ TAT:</span>
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
              onClick={() => setPreset('neurotic')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للبنية العصابية</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs shadow-xl shadow-indigo-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج TAT...' : 'اعتماد تقرير فحص TAT 💾'}</span>
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
              تم توثيق نتائج اختبار تفهم الموضوع TAT بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل سلاسل شبكة شنتوب واستخراج الفرضية التشخيصية للبنية النفسية.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">الصلابة (A):</span>
              <strong className="text-indigo-400 text-base font-black font-mono">
                {tatResult?.series_proportions?.series_a_rigidity?.percentage}%
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الهشاشة (B):</span>
              <strong className="text-pink-400 text-base font-black font-mono">
                {tatResult?.series_proportions?.series_b_lability?.percentage}%
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">البنية النفسية:</span>
              <span className="text-white font-bold">{tatResult?.psychic_organization_label_ar}</span>
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
