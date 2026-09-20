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
  ShieldAlert, 
  HeartCrack, 
  Layers, 
  TrendingUp, 
  Check, 
  Sliders, 
  Brain, 
  EyeOff, 
  Zap, 
  HeartHandshake
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

export default function TraumaqRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [intrusions, setIntrusions] = useState(11);
  const [avoidance, setAvoidance] = useState(9);
  const [hyperarousal, setHyperarousal] = useState(10);
  const [numbing, setNumbing] = useState(7);

  const [traumaResult, setTraumaResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeTrauma();
  }, [intrusions, avoidance, hyperarousal, numbing]);

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

  const recomputeTrauma = async () => {
    try {
      const resp = await clinicalTestApi.runTraumaq({
        intrusions_score: intrusions,
        avoidance_score: avoidance,
        hyperarousal_score: hyperarousal,
        numbing_score: numbing,
      });
      setTraumaResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('TRAUMA-Q calculation error:', e);
    }
  };

  const setPreset = (type) => {
    if (type === 'severe_ptsd') {
      setIntrusions(14); setAvoidance(11); setHyperarousal(13); setNumbing(10);
    } else if (type === 'subclinical') {
      setIntrusions(6); setAvoidance(5); setHyperarousal(6); setNumbing(4);
    } else if (type === 'normal') {
      setIntrusions(2); setAvoidance(1); setHyperarousal(2); setNumbing(1);
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط تقييم الصدمة النفسية بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'TRAUMAQ',
        calculated_total_score: traumaResult?.total_ptsd_score || 0,
        subscale_scores: {
          total_ptsd: { name: 'المجموع الكلي لأعراض الصدمة', raw: `${traumaResult?.total_ptsd_score} / 54 (العتبة: 26)`, interpretation: traumaResult?.diagnosis_label_ar },
          intrusions: { name: 'الذكريات الاقتحامية والكوابيس', raw: `${intrusions} / 15` },
          avoidance: { name: 'التجنب السلوكي والمكاني', raw: `${avoidance} / 12` },
          hyperarousal: { name: 'فرط الاستثارة والتوتر العصبي', raw: `${hyperarousal} / 15` },
          numbing: { name: 'التبلد الانفعالي والأفكار السلبية', raw: `${numbing} / 12` },
          recommendations: { name: 'البروتوكول العلاجي المقترح', raw: traumaResult?.recommendation_ar },
        },
        raw_responses: { intrusions, avoidance, hyperarousal, numbing },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم TRAUMA-Q');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-600 flex items-center justify-center text-white font-black shadow-lg shadow-rose-600/30">
            <HeartCrack className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                استبيان الصدمة النفسية واضطراب كرب ما بعد الصدمة (TRAUMA-Q / PTSD DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20">
                DSM-5 & CIM-11 Criteria
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              التقييم التشخيصي لأعراض الصدمة النفسية عبر المحاور الأربعة: الذكريات الاقتحامية، التجنب، فرط الاستثارة، والتبلد الانفعالي.
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
                <User className="w-4 h-4 text-rose-400" />
                <span>المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-rose-500"
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
                <User className="w-4 h-4 text-rose-400" />
                <span className="font-bold">المريض:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Demo Presets */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setPreset('severe_ptsd')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40"
              >
                صدمة حادة (PTSD)
              </button>
              <button
                type="button"
                onClick={() => setPreset('subclinical')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30"
              >
                أعراض تحت عتبية
              </button>
              <button
                type="button"
                onClick={() => setPreset('normal')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
              >
                مستوى طبيعي
              </button>
            </div>
          </div>

          {/* REAL-TIME PTSD CLINICAL SEVERITY HERO BANNER */}
          {traumaResult && (
            <div className={`p-5 rounded-3xl border space-y-4 shadow-xl transition-all ${
              traumaResult.is_ptsd_confirmed
                ? 'bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950 border-rose-500/50'
                : traumaResult.severity_tier === 'subclinical'
                ? 'bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border-amber-500/40'
                : 'bg-gradient-to-r from-slate-950 via-emerald-950/30 to-slate-950 border-emerald-500/40'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className={`px-5 py-2.5 rounded-2xl font-mono font-black text-2xl shadow-lg ${
                    traumaResult.is_ptsd_confirmed
                      ? 'bg-rose-600 text-white shadow-rose-600/30 animate-pulse'
                      : traumaResult.severity_tier === 'subclinical'
                      ? 'bg-amber-600 text-white shadow-amber-600/30'
                      : 'bg-emerald-600 text-white shadow-emerald-600/30'
                  }`}>
                    {traumaResult.total_ptsd_score} / 54
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">التشخيص الإكلينيكي للصدمة النفسية:</span>
                    <strong className="text-base font-black text-white block">
                      {traumaResult.diagnosis_label_ar}
                    </strong>
                    <span className="text-xs text-rose-300 font-medium block mt-0.5">
                      العتبة الإكلينيكية المؤكدة: 26 درجة
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الاقتحامية:</span>
                    <strong className="text-rose-400 font-mono font-bold text-xs">{intrusions}/15</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">التجنب:</span>
                    <strong className="text-amber-400 font-mono font-bold text-xs">{avoidance}/12</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">فرط الاستثارة:</span>
                    <strong className="text-orange-400 font-mono font-bold text-xs">{hyperarousal}/15</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">التبلد:</span>
                    <strong className="text-purple-400 font-mono font-bold text-xs">{numbing}/12</strong>
                  </div>
                </div>
              </div>

              {/* Trauma-Informed Psychotherapy Recommendation */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center space-x-2 space-x-reverse text-xs text-slate-300">
                <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">التوصية العلاجية:</span>
                <span className="text-white">{traumaResult.recommendation_ar}</span>
              </div>
            </div>
          )}

          {/* 4 PTSD CLUSTER CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-400 font-bold flex items-center space-x-1 space-x-reverse">
                  <Zap className="w-3.5 h-3.5" />
                  <span>1. الذكريات الاقتحامية والكوابيس (Intrusions):</span>
                </span>
                <span className="font-mono text-rose-300 font-bold">{intrusions} / 15</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={intrusions}
                onChange={(e) => setIntrusions(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400 font-bold flex items-center space-x-1 space-x-reverse">
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>2. التجنب السلوكي والمكاني (Évitement):</span>
                </span>
                <span className="font-mono text-amber-300 font-bold">{avoidance} / 12</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={avoidance}
                onChange={(e) => setAvoidance(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-400 font-bold flex items-center space-x-1 space-x-reverse">
                  <Activity className="w-3.5 h-3.5" />
                  <span>3. فرط الاستثارة والتوتر العصبي (Hyperéveil):</span>
                </span>
                <span className="font-mono text-orange-300 font-bold">{hyperarousal} / 15</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={hyperarousal}
                onChange={(e) => setHyperarousal(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-400 font-bold flex items-center space-x-1 space-x-reverse">
                  <Brain className="w-3.5 h-3.5" />
                  <span>4. التبلد الانفعالي والأفكار السلبية (Émoussement):</span>
                </span>
                <span className="font-mono text-purple-300 font-bold">{numbing} / 12</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={numbing}
                onChange={(e) => setNumbing(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير التشخيصي لـ TRAUMA-Q (PTSD):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-rose-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPreset('severe_ptsd')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط العتبة الصدمية</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-xl shadow-rose-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ تقييم الصدمة...' : 'اعتماد تقرير فحص الصدمة النفسية TRAUMA-Q 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 mx-auto flex items-center justify-center text-rose-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق نتائج استبيان الصدمة النفسية بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل مجموع الأعراض الصدمية والمحاور الأربعة والتوصية العلاجية بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">مجموع PTSD:</span>
              <strong className="text-rose-400 text-base font-black font-mono">
                {traumaResult?.total_ptsd_score} / 54
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التشخيص:</span>
              <strong className="text-white font-bold">{traumaResult?.severity_tier === 'clinical_ptsd' ? 'SSPT / PTSD مؤكد' : 'غير مؤكد'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">العلاج المقترح:</span>
              <span className="text-emerald-400 font-bold">EMDR / TCC-Trauma</span>
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
