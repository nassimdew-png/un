import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
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
  TrendingUp, 
  Binary, 
  Layers,
  HelpCircle,
  Check
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

const ZAREKI_SUBSCALES = [
  { key: 'counting', nameAr: 'العد والإحصاء (Dénombrement)', desc: 'العد التصاعدي والتنازلي والعد بالخطوات (2، 5، 10)', icon: Binary },
  { key: 'number_line', nameAr: 'المستقيم العددي (Ligne Numérique)', desc: 'تقدير موضع الأعداد على مستقيم عددي مدرج وغير مدرج', icon: Layers },
  { key: 'mental_calc', nameAr: 'الحساب الذهني (Calcul Mental)', desc: 'عمليات الجمع والطرح والضرب البسيطة ذهنياً وبسرعة', icon: Calculator },
  { key: 'problem_solving', nameAr: 'المسائل الحسابية (Problèmes)', desc: 'فهم النصوص الرياضية وتجريد العمليات المنطقية اللازمة', icon: TrendingUp },
  { key: 'comparison', nameAr: 'مقارنة الكميات (Comparaison)', desc: 'التمييز بين الأعداد الكبيرة والصغيرة والكميات البصرية', icon: Activity },
  { key: 'dictation', nameAr: 'إملاء الأعداد (Dictée de Nombres)', desc: 'كتابة الأرقام بالأرقام والحروف والترميز المكاني للقيمة', icon: FileText },
];

export default function ZarekiRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [subscales, setSubscales] = useState({
    counting: 18,
    number_line: 15,
    mental_calc: 14,
    problem_solving: 16,
    comparison: 18,
    dictation: 17,
  });

  const [zarekiResult, setZarekiResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeZareki();
  }, [subscales]);

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

  const recomputeZareki = async () => {
    try {
      const resp = await clinicalTestApi.runZareki({ subscales });
      setZarekiResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('ZAREKI calculation error:', e);
    }
  };

  const handleScoreChange = (key, val) => {
    const num = Math.max(0, Math.min(20, Number(val)));
    setSubscales((prev) => ({ ...prev, [key]: num }));
  };

  const setPreset = (type) => {
    if (type === 'normal') {
      setSubscales({ counting: 18, number_line: 16, mental_calc: 15, problem_solving: 16, comparison: 18, dictation: 17 });
    } else if (type === 'mild') {
      setSubscales({ counting: 12, number_line: 10, mental_calc: 9, problem_solving: 11, comparison: 13, dictation: 11 });
    } else if (type === 'dyscalculia') {
      setSubscales({ counting: 6, number_line: 4, mental_calc: 3, problem_solving: 4, comparison: 7, dictation: 5 });
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط فحص الحساب ZAREKI-R بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'ZAREKI_R',
        calculated_total_score: zarekiResult?.total_score || 0,
        subscale_scores: {
          total_score: { name: 'المجموع الكلي لمعالجة الحساب', raw: `${zarekiResult?.total_score} / 120`, interpretation: zarekiResult?.risk_label_ar },
          percentile: { name: 'الرتبة المئينية', raw: `${zarekiResult?.percentile}%` },
          counting: { name: 'العد والإحصاء', raw: subscales.counting },
          mental_calc: { name: 'الحساب الذهني', raw: subscales.mental_calc },
          problem_solving: { name: 'المسائل الحسابية', raw: subscales.problem_solving },
        },
        raw_responses: subscales,
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم ZAREKI-R');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/30">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                بطارية تقييم الحساب وعسر الحساب (ZAREKI-R DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-300 border border-orange-500/20">
                von Aster & Dellatolas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تقييم معالجة الأعداد، الحقائق الحسابية، التموضع العددي والكشف عن عسر الحساب النمائي (Dyscalculie).
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
                <User className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="shrink-0">المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
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
                <User className="w-4 h-4 text-orange-400" />
                <span className="font-bold">المريض:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Demo Controls */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setPreset('normal')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
              >
                أداء سليم
              </button>
              <button
                type="button"
                onClick={() => setPreset('mild')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors"
              >
                صعوبات طفيفة
              </button>
              <button
                type="button"
                onClick={() => setPreset('dyscalculia')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 transition-colors"
              >
                عسر حساب
              </button>
            </div>
          </div>

          {/* REAL-TIME ZAREKI PERFORMANCE HERO BANNER */}
          {zarekiResult && (
            <div className={`p-5 rounded-3xl border space-y-4 shadow-xl transition-all ${
              zarekiResult.risk_level === 'normal'
                ? 'bg-gradient-to-r from-slate-950 via-emerald-950/30 to-slate-950 border-emerald-500/30'
                : zarekiResult.risk_level === 'mild_difficulties'
                ? 'bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border-amber-500/30'
                : 'bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950 border-rose-500/50 shadow-rose-500/10'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className={`px-5 py-2.5 rounded-2xl font-mono font-black text-3xl shadow-lg ${
                    zarekiResult.risk_level === 'normal'
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : zarekiResult.risk_level === 'mild_difficulties'
                      ? 'bg-amber-600 text-white shadow-amber-600/30'
                      : 'bg-rose-600 text-white shadow-rose-600/40'
                  }`}>
                    {zarekiResult.total_score} / 120
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">التصنيف الإكلينيكي لعسر الحساب:</span>
                    <strong className="text-base font-black text-white block">
                      {zarekiResult.risk_label_ar}
                    </strong>
                    <span className="text-xs text-slate-400">
                      الرتبة المئينية: <strong className="text-orange-400 font-mono font-bold">{zarekiResult.percentile}%</strong>
                    </span>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <span className="text-slate-500 block text-[10px]">العتبة التشخيصية:</span>
                  <span>الرتبة &lt; 10% تشير لعسر حساب نمائي</span>
                </div>
              </div>
            </div>
          )}

          {/* 6 MATH PROCESSING SUBSCALE SLIDERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ZAREKI_SUBSCALES.map((sub) => {
              const Icon = sub.icon;
              return (
                <div key={sub.key} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Icon className="w-4 h-4 text-orange-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">{sub.nameAr}</span>
                        <span className="text-[10px] text-slate-400 block">{sub.desc}</span>
                      </div>
                    </div>
                    <span className="font-mono text-orange-400 font-black text-sm px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 shrink-0">
                      {subscales[sub.key]} / 20
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={subscales[sub.key]}
                    onChange={(e) => handleScoreChange(sub.key, e.target.value)}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />

                  <div className="flex justify-between text-[9px] text-slate-500 font-medium px-1">
                    <span>0: عجز تام</span>
                    <span>10: أداء متوسط</span>
                    <span>20: إتقان وحساب متقدم</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتشخيص الأرطوفوني للحساب (Synthèse ZAREKI-R):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-orange-500 leading-relaxed"
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
              <span>إعادة ضبط للمتوسط</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-xl shadow-orange-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج الحساب...' : 'اعتماد تقييم الحساب ZAREKI-R 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-orange-500/20 border border-orange-500/30 mx-auto flex items-center justify-center text-orange-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق نتائج تقييم ZAREKI-R بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل درجات المهارات الحسابية والرتبة المئينية وربط التقرير بملف المفحوص.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">المجموع الكلي:</span>
              <strong className="text-orange-400 text-base font-black font-mono">
                {zarekiResult?.total_score} / 120
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التصنيف:</span>
              <span className="text-white font-bold">{zarekiResult?.risk_label_ar}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الرتبة المئينية:</span>
              <span className="text-emerald-400 font-mono font-bold">{zarekiResult?.percentile}%</span>
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
