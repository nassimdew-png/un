import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
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
  HeartPulse,
  Smile,
  Frown,
  Check
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

// Representative STAI-Y items (State Y1 & Trait Y2)
const STAI_STATE_ITEMS = [
  { id: 1, text_ar: '1. أشعر بالهدوء والسكينة', reverse: true },
  { id: 2, text_ar: '2. أشعر بالأمان والاطمئنان', reverse: true },
  { id: 3, text_ar: '3. أشعر بالتوتر والشد العصبي', reverse: false },
  { id: 4, text_ar: '4. أشعر بالندم أو الضيق', reverse: false },
  { id: 5, text_ar: '5. أشعر بالراحة والاسترخاء', reverse: true },
  { id: 6, text_ar: '6. أشعر بالانزعاج والاضطراب', reverse: false },
  { id: 7, text_ar: '7. ينتابني قلق بشأن مصائب محتملة', reverse: false },
  { id: 8, text_ar: '8. أشعر بالرضا والارتياح الداخلي', reverse: true },
  { id: 9, text_ar: '9. أشعر بالخوف والرهبة', reverse: false },
  { id: 10, text_ar: '10. أشعر بالثقة بالنفس والاطمئنان', reverse: true },
];

const STAI_TRAIT_ITEMS = [
  { id: 1, text_ar: '1. أشعر بالبهجة والسرور عموماً', reverse: true },
  { id: 2, text_ar: '2. أتعب وأفقد طاقتي بسرعة', reverse: false },
  { id: 3, text_ar: '3. أرغب في البكاء بسهولة', reverse: false },
  { id: 4, text_ar: '4. أتمنى لو كنت سعيداً كغيري من الناس', reverse: false },
  { id: 5, text_ar: '5. أفقد الفرص بسبب ترددي وبطء اتخاذ القرارات', reverse: false },
  { id: 6, text_ar: '6. أشعر بالنشاط والراحة الدائمة', reverse: true },
  { id: 7, text_ar: '7. أتحلى بالهدوء والاتزان في مواجهة الصعوبات', reverse: true },
  { id: 8, text_ar: '8. تتراكم الصعوبات لدرجة أعجز عن التغلب عليها', reverse: false },
  { id: 9, text_ar: '9. أقلق كثيراً بشأن أمور لا تستحق', reverse: false },
  { id: 10, text_ar: '10. أنا سعيد وراضٍ عن حياتي عموماً', reverse: true },
];

export default function StaiRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [activeForm, setActiveForm] = useState('state'); // 'state' (Y1) | 'trait' (Y2)

  // State answers: { [id]: 1..4 }
  const [stateAnswers, setStateAnswers] = useState(() => {
    const init = {};
    for (let i = 1; i <= 10; i++) init[i] = 2;
    return init;
  });

  // Trait answers: { [id]: 1..4 }
  const [traitAnswers, setTraitAnswers] = useState(() => {
    const init = {};
    for (let i = 1; i <= 10; i++) init[i] = 2;
    return init;
  });

  const [staiResult, setStaiResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeStai();
  }, [stateAnswers, traitAnswers]);

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

  const calculateSum = (items, answers) => {
    let sum = 0;
    items.forEach((it) => {
      const ans = answers[it.id] || 2;
      const score = it.reverse ? 5 - ans : ans;
      sum += score;
    });
    // Scale 10 items to standard 20 items (x 2)
    return sum * 2;
  };

  const recomputeStai = async () => {
    const stateRaw = calculateSum(STAI_STATE_ITEMS, stateAnswers);
    const traitRaw = calculateSum(STAI_TRAIT_ITEMS, traitAnswers);

    try {
      const resp = await clinicalTestApi.runStaiRcmas({
        state_anxiety_score: stateRaw,
        trait_anxiety_score: traitRaw,
      });
      setStaiResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('STAI calculation error:', e);
    }
  };

  const handleStateChange = (id, val) => {
    setStateAnswers((prev) => ({ ...prev, [id]: Number(val) }));
    soundEngine.playTone(480 + val * 40, 0.04);
  };

  const handleTraitChange = (id, val) => {
    setTraitAnswers((prev) => ({ ...prev, [id]: Number(val) }));
    soundEngine.playTone(480 + val * 40, 0.04);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط مقياس القلق STAI-Y بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const stateRaw = calculateSum(STAI_STATE_ITEMS, stateAnswers);
      const traitRaw = calculateSum(STAI_TRAIT_ITEMS, traitAnswers);

      const payload = {
        test_code: 'STAI_Y',
        calculated_total_score: stateRaw,
        subscale_scores: {
          state_anxiety: { name: 'القلق كحالة (STAI-Y1)', raw: `${stateRaw} / 80`, standard: `T=${staiResult?.state_anxiety?.t_score}`, interpretation: staiResult?.state_anxiety?.classification_ar },
          trait_anxiety: { name: 'القلق كسمة (STAI-Y2)', raw: `${traitRaw} / 80`, standard: `T=${staiResult?.trait_anxiety?.t_score}`, interpretation: staiResult?.trait_anxiety?.classification_ar },
        },
        raw_responses: { state: stateAnswers, trait: traitAnswers },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم STAI');
    } finally {
      setSaving(false);
    }
  };

  const currentItems = activeForm === 'state' ? STAI_STATE_ITEMS : STAI_TRAIT_ITEMS;
  const currentAnswers = activeForm === 'state' ? stateAnswers : traitAnswers;
  const currentHandler = activeForm === 'state' ? handleStateChange : handleTraitChange;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-rose-600 to-pink-600 flex items-center justify-center text-white font-black shadow-lg shadow-rose-600/30">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                مقياس سبيلبرجر للقلق كحالة وسمة (STAI-Y & R-CMAS DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20">
                Spielberger State-Trait
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              قياس القلق الظرفي الراهن (State Y1) والقلق كسمة شخصية مستمرة (Trait Y2) مع حساب الدرجات التائية المعيارية (T-Score).
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
          {/* Patient Selector */}
          {!patientId ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300">
                <User className="w-4 h-4 text-rose-400" />
                <span>المفحوص (Patient):</span>
              </div>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-rose-500"
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
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-2 space-x-reverse text-xs text-slate-300">
              <User className="w-4 h-4 text-rose-400" />
              <span className="font-bold">المريض:</span>
              <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
            </div>
          )}

          {/* REAL-TIME STAI T-SCORE HERO DASHBOARD */}
          {staiResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-rose-950/30 to-slate-950 border border-rose-500/30 space-y-4 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* State Y1 Card */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center space-x-4 space-x-reverse">
                  <div className="px-4 py-2 rounded-xl bg-rose-600 text-white font-mono font-black text-2xl shadow-lg shadow-rose-600/30">
                    T {staiResult.state_anxiety?.t_score}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">القلق كحالة ظرفية (STAI-Y1):</span>
                    <strong className="text-sm font-black text-rose-300 block">
                      {staiResult.state_anxiety?.classification_ar}
                    </strong>
                    <span className="text-xs text-slate-400">الدرجة الخام: {staiResult.state_anxiety?.raw_score} / 80</span>
                  </div>
                </div>

                {/* Trait Y2 Card */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center space-x-4 space-x-reverse">
                  <div className="px-4 py-2 rounded-xl bg-amber-600 text-white font-mono font-black text-2xl shadow-lg shadow-amber-600/30">
                    T {staiResult.trait_anxiety?.t_score}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">القلق كسمة شخصية (STAI-Y2):</span>
                    <strong className="text-sm font-black text-amber-300 block">
                      {staiResult.trait_anxiety?.classification_ar}
                    </strong>
                    <span className="text-xs text-slate-400">الدرجة الخام: {staiResult.trait_anxiety?.raw_score} / 80</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORM SELECTOR TABS (STATE VS TRAIT) */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveForm('state')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  activeForm === 'state'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                1. استمارة القلق كحالة راهنة (STAI-Y1)
              </button>

              <button
                type="button"
                onClick={() => setActiveForm('trait')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  activeForm === 'trait'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                2. استمارة القلق كسمة مستمرة (STAI-Y2)
              </button>
            </div>

            {/* 4-POINT RATING CARDS */}
            <div className="space-y-3">
              {currentItems.map((item) => {
                const currentVal = currentAnswers[item.id] || 2;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <span className="text-xs font-bold text-white">{item.text_ar}</span>

                    <div className="flex items-center space-x-1.5 space-x-reverse w-full sm:w-auto">
                      {[
                        { val: 1, label: 'إطلاقاً (1)' },
                        { val: 2, label: 'قليلاً (2)' },
                        { val: 3, label: 'بدرجة معتدلة (3)' },
                        { val: 4, label: 'كثيراً (4)' },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => currentHandler(item.id, opt.val)}
                          className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            currentVal === opt.val
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتشخيص النفسي للقلق (Synthèse STAI-Y):</span>
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
              onClick={() => {
                const fresh = {};
                for (let i = 1; i <= 10; i++) fresh[i] = 2;
                setStateAnswers(fresh);
                setTraitAnswers(fresh);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين للمتوسط</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs shadow-xl shadow-rose-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج القلق...' : 'اعتماد تقييم القلق STAI-Y 💾'}</span>
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
              تم توثيق نتائج مقياس القلق STAI-Y بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم حساب الدرجات التائية المعيارية وتحديد مستوى القلق كحالة وسمة وربط التقرير بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">القلق كحالة (Y1):</span>
              <strong className="text-rose-400 text-base font-black font-mono">
                T {staiResult?.state_anxiety?.t_score}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">القلق كسمة (Y2):</span>
              <strong className="text-amber-400 text-base font-black font-mono">
                T {staiResult?.trait_anxiety?.t_score}
              </strong>
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
