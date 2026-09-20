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
  ShieldAlert
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

export default function CsbsRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  // Social Composite components (max 26)
  const [emotionEyeGaze, setEmotionEyeGaze] = useState(7); // 0-8
  const [communication, setCommunication] = useState(6);   // 0-8
  const [gestures, setGestures] = useState(8);             // 0-10

  // Speech Composite components (max 14)
  const [sounds, setSounds] = useState(6);                 // 0-8
  const [words, setWords] = useState(4);                   // 0-6

  // Symbolic Composite components (max 17)
  const [understanding, setUnderstanding] = useState(6);   // 0-8
  const [objectUse, setObjectUse] = useState(7);           // 0-9

  const [csbsResult, setCsbsResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeCsbs();
  }, [emotionEyeGaze, communication, gestures, sounds, words, understanding, objectUse]);

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

  const recomputeCsbs = async () => {
    try {
      const resp = await clinicalTestApi.runCsbs({
        emotion_eye_gaze: emotionEyeGaze,
        communication: communication,
        gestures: gestures,
        sounds: sounds,
        words: words,
        understanding: understanding,
        object_use: objectUse,
      });
      setCsbsResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('CSBS calculation error:', e);
    }
  };

  const setPreset = (type) => {
    if (type === 'normal') {
      setEmotionEyeGaze(7); setCommunication(7); setGestures(9);
      setSounds(7); setWords(5);
      setUnderstanding(7); setObjectUse(8);
    } else if (type === 'concern') {
      setEmotionEyeGaze(2); setCommunication(1); setGestures(2);
      setSounds(2); setWords(0);
      setUnderstanding(2); setObjectUse(3);
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار طفل لربط مقياس CSBS بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'CSBS',
        calculated_total_score: csbsResult?.total_raw_score || 0,
        subscale_scores: {
          total_raw: { name: 'المجموع الخام الكلي', raw: `${csbsResult?.total_raw_score} / 57`, standard: `P=${csbsResult?.overall_percentile}%`, interpretation: csbsResult?.risk_label_ar },
          social: { name: 'المجال الاجتماعي والتواصلي', raw: `${csbsResult?.social_composite?.raw} / 26`, standard: `NS=${csbsResult?.social_composite?.standard}/19` },
          speech: { name: 'المجال الصوتي والكلامي', raw: `${csbsResult?.speech_composite?.raw} / 14`, standard: `NS=${csbsResult?.speech_composite?.standard}/19` },
          symbolic: { name: 'المجال الرمزي وفهم الأدوات', raw: `${csbsResult?.symbolic_composite?.raw} / 17`, standard: `NS=${csbsResult?.symbolic_composite?.standard}/19` },
        },
        raw_responses: { emotionEyeGaze, communication, gestures, sounds, words, understanding, objectUse },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم CSBS');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-teal-600/30">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                مقاييس السلوك التواصلي والرمزي المبكر (CSBS DP DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Wetherby & Prizant
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              الكشف النمائي المبكر عن مهارات التواصل والتفاعل واللعب الرمزي ومؤشرات طيف التوحد (6 إلى 24 شهراً).
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
                onClick={() => setPreset('normal')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
              >
                تواصل طبيعي متقدم
              </button>
              <button
                type="button"
                onClick={() => setPreset('concern')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/30"
              >
                مستوى إنذار وخطر (Concern)
              </button>
            </div>
          </div>

          {/* REAL-TIME CSBS 3 COMPOSITES HERO BANNER */}
          {csbsResult && (
            <div className={`p-5 rounded-3xl border space-y-4 shadow-xl transition-all ${
              csbsResult.risk_status === 'concern'
                ? 'bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950 border-rose-500/50'
                : csbsResult.risk_status === 'average'
                ? 'bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-950 border-amber-500/40'
                : 'bg-gradient-to-r from-slate-950 via-cyan-950/30 to-slate-950 border-cyan-500/30'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className={`px-5 py-2.5 rounded-2xl font-mono font-black text-2xl shadow-lg ${
                    csbsResult.risk_status === 'concern'
                      ? 'bg-rose-600 text-white shadow-rose-600/30'
                      : csbsResult.risk_status === 'average'
                      ? 'bg-amber-600 text-white shadow-amber-600/30'
                      : 'bg-cyan-600 text-white shadow-cyan-600/30'
                  }`}>
                    {csbsResult.total_raw_score} / 57
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">مستوى الخطر والتصنيف الإكلينيكي:</span>
                    <strong className="text-base font-black text-white block">
                      {csbsResult.risk_label_ar}
                    </strong>
                    <span className="text-xs text-slate-400">
                      الرتبة المئينية العامة: <strong className="text-amber-400 font-mono font-bold">{csbsResult.overall_percentile}%</strong>
                    </span>
                  </div>
                </div>

                {/* 3 Composite Cards */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الاجتماعي:</span>
                    <strong className="text-cyan-400 font-mono font-bold text-xs">{csbsResult.social_composite?.raw}/26 (NS={csbsResult.social_composite?.standard})</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الصوتي/الكلامي:</span>
                    <strong className="text-teal-400 font-mono font-bold text-xs">{csbsResult.speech_composite?.raw}/14 (NS={csbsResult.speech_composite?.standard})</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الرمزي:</span>
                    <strong className="text-emerald-400 font-mono font-bold text-xs">{csbsResult.symbolic_composite?.raw}/17 (NS={csbsResult.symbolic_composite?.standard})</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3 COMPOSITE CLUSTERS & ITEM SLIDERS */}
          <div className="space-y-4">
            {/* 1. SOCIAL COMPOSITE */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-cyan-400 border-b border-slate-800/80 pb-2">
                1. المجال الاجتماعي والتواصلي (Social Composite - Max 26):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold">الانفعال ونظرة العين:</span>
                    <span className="font-mono text-cyan-400 font-bold">{emotionEyeGaze} / 8</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    value={emotionEyeGaze}
                    onChange={(e) => setEmotionEyeGaze(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold">المبادرة بالتواصل:</span>
                    <span className="font-mono text-cyan-400 font-bold">{communication} / 8</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    value={communication}
                    onChange={(e) => setCommunication(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold">الإيماءات والإشارات:</span>
                    <span className="font-mono text-cyan-400 font-bold">{gestures} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={gestures}
                    onChange={(e) => setGestures(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. SPEECH COMPOSITE */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-teal-400 border-b border-slate-800/80 pb-2">
                2. المجال الصوتي والكلامي (Speech Composite - Max 14):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold">تنوع الأصوات والمناغاة:</span>
                    <span className="font-mono text-teal-400 font-bold">{sounds} / 8</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    value={sounds}
                    onChange={(e) => setSounds(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold">الكلمات والمفردات المستعملة:</span>
                    <span className="font-mono text-teal-400 font-bold">{words} / 6</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    value={words}
                    onChange={(e) => setWords(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. SYMBOLIC COMPOSITE */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-emerald-400 border-b border-slate-800/80 pb-2">
                3. المجال الرمزي واللعب (Symbolic Composite - Max 17):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold">الفهم والاستيعاب للغة الموجهة:</span>
                    <span className="font-mono text-emerald-400 font-bold">{understanding} / 8</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    value={understanding}
                    onChange={(e) => setUnderstanding(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold">استخدام الأشياء واللعب الإيهامي:</span>
                    <span className="font-mono text-emerald-400 font-bold">{objectUse} / 9</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="9"
                    value={objectUse}
                    onChange={(e) => setObjectUse(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير التواصلي لمقياس CSBS DP:</span>
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
              onClick={() => setPreset('normal')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للمستوى السليم</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-xs shadow-xl shadow-teal-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج CSBS...' : 'اعتماد تقرير فحص CSBS DP 💾'}</span>
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
              تم توثيق نتائج مقياس CSBS DP بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم استخراج المجالات الثلاثة (الاجتماعي، الكلامي، والرمزي) وتوثيق تصنيف الخطر.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">المجموع الخام:</span>
              <strong className="text-cyan-400 text-base font-black font-mono">
                {csbsResult?.total_raw_score} / 57
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الرتبة المئينية:</span>
              <strong className="text-white font-bold">{csbsResult?.overall_percentile}%</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التصنيف:</span>
              <span className="text-teal-400 font-bold">{csbsResult?.risk_label_ar}</span>
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
