import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
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
  Check, 
  AlertOctagon,
  HelpCircle,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

// M-CHAT-R 20 Standard Items (Pass/Fail Mapping)
// For most questions: Yes = Pass (0), No = Fail (1)
// For reverse questions (Q2, Q5, Q12): Yes = Fail (1), No = Pass (0)
const MCHAT_ITEMS = [
  {
    id: 1,
    text_ar: '1. إذا أشرت إلى شيء في الغرفة، هل ينظر طفلك إليه؟',
    text_fr: 'Si vous pointez quelque chose dans la pièce, votre enfant le regarde-t-il ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 2,
    text_ar: '2. هل تساءلت يوماً عما إذا كان طفلك أصماً أو يعاني من صعوبة في السمع؟',
    text_fr: 'Vous êtes-vous déjà demandé si votre enfant était sourd ?',
    reverse: true, // Yes = Fail
    isCritical: true,
  },
  {
    id: 3,
    text_ar: '3. هل يلعب طفلك ألعاب التظاهر والتمثيل (مثل شرب الشاي من فنجان فارغ، إطعام دمية)؟',
    text_fr: 'Votre enfant joue-t-il à faire semblant (ex: faire semblant de boire, nourrir une poupée) ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 4,
    text_ar: '4. هل يحب طفلك التسلق على الأشياء (مثل الأثاث أو ألعاب الحديقة)؟',
    text_fr: 'Votre enfant aime-t-il grimper sur les choses (ex: meubles, jeux de parc) ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 5,
    text_ar: '5. هل يقوم طفلك بحركات غير عادية بأصابعه بالقرب من عينيه؟',
    text_fr: 'Votre enfant fait-il des mouvements inhabituels avec ses doigts près de ses yeux ?',
    reverse: true, // Yes = Fail
    isCritical: true,
  },
  {
    id: 6,
    text_ar: '6. هل يُشير طفلك بإصبعه ليطلب شيئاً أو يحصل على مساعدة (مثل لعبة بعيدة)؟',
    text_fr: 'Votre enfant pointe-t-il du doigt pour demander quelque chose ou obtenir de l\'aide ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 7,
    text_ar: '7. هل يُشير طفلك بإصبعه ليُريك شيئاً مثيراً للاهتمام (مثل طائرة في السماء أو شاحنة)؟',
    text_fr: 'Votre enfant pointe-t-il du doigt pour vous montrer quelque chose d\'intéressant ?',
    reverse: false,
    isCritical: true, // Critical Item
  },
  {
    id: 8,
    text_ar: '8. هل يهتم طفلك بالأطفال الآخرين ويحاول التفاعل معهم أو مراقبتهم؟',
    text_fr: 'Votre enfant s\'intéresse-t-il aux autres enfants ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 9,
    text_ar: '9. هل يُريك طفلك أشياءً بحملها إليك أو مدها نحوك (للمشاركة وليس لطلب مساعدة)؟',
    text_fr: 'Votre enfant vous montre-t-il des choses en vous les apportant pour partager ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 10,
    text_ar: '10. هل يستجيب طفلك عند مناداته باسمه (ينظر إليك، يتكلم أو يتوقف عما يفعله)؟',
    text_fr: 'Votre enfant répond-il à son prénom quand vous l\'appelez ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 11,
    text_ar: '11. عندما تبتسم لطفلك، هل يبتسم لك في المقابل؟',
    text_fr: 'Quand vous souriez à votre enfant, vous sourit-il en retour ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 12,
    text_ar: '12. هل ينزعج طفلك بشدة ويبكي من الأصوات اليومية العادية (مثل المكنسة أو الخلاط)؟',
    text_fr: 'Votre enfant est-il perturbé par les bruits du quotidien (ex: aspirateur) ?',
    reverse: true, // Yes = Fail
    isCritical: true,
  },
  {
    id: 13,
    text_ar: '13. هل يستطيع طفلك المشي بمفرده؟',
    text_fr: 'Votre enfant marche-t-il ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 14,
    text_ar: '14. هل ينظر طفلك في عينيك عندما تتحدث إليه أو تلعب معه أو تلبسه؟',
    text_fr: 'Votre enfant vous regarde-t-il dans les yeux quand vous lui parlez ?',
    reverse: false,
    isCritical: true, // Critical Item
  },
  {
    id: 15,
    text_ar: '15. هل يحاول طفلك تقليد ما تفعله (مثل التلويح بيده، التصفيق، إصدار صوت مضحك)؟',
    text_fr: 'Votre enfant essaie-t-il d\'imiter ce que vous faites (ex: coucou, applaudir) ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 16,
    text_ar: '16. إذا درت برأسك لتنظر إلى شيء ما، هل يلتفت طفلك ليرى إلى ماذا تنظر؟',
    text_fr: 'Si vous tournez la tête pour regarder quelque chose, votre enfant regarde-t-il aussi ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 17,
    text_ar: '17. هل يحاول طفلك لفت انتباهك لمشاهدته (مثل القول "انظر إلي" أو البحث عن نظرتك)؟',
    text_fr: 'Votre enfant essaie-t-il de capter votre attention pour que vous le regardiez ?',
    reverse: false,
    isCritical: true, // Critical Item
  },
  {
    id: 18,
    text_ar: '18. هل يفهم طفلك عندما تطلب منه أمراً بسيطاً (مثل "ضع الحذاء هناك") دون إشارات باليد؟',
    text_fr: 'Votre enfant comprend-il des consignes simples sans gestes d\'accompagnement ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 19,
    text_ar: '19. إذا حدث أمر غير مألوف، هل ينظر طفلك إلى وجهك ليرى ردة فعلك؟',
    text_fr: 'S\'il se passe quelque chose de nouveau, votre enfant regarde-t-il votre visage ?',
    reverse: false,
    isCritical: false,
  },
  {
    id: 20,
    text_ar: '20. هل يحب طفلك الأنشطة الحركية التفاعلية (مثل التأرجح أو القفز على ركبتيك)؟',
    text_fr: 'Votre enfant aime-t-il les jeux de mouvement partagés (ex: sur vos genoux) ?',
    reverse: false,
    isCritical: false,
  },
];

export default function MchatRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  // Raw boolean answers: { [itemId]: boolean } where true means parent answered 'Yes'
  const [answers, setAnswers] = useState(() => {
    const init = {};
    MCHAT_ITEMS.forEach((it) => {
      // Default normal/pass answers
      init[it.id] = !it.reverse; // default 'Yes' for normal, 'No' for reverse
    });
    return init;
  });

  const [mchatResult, setMchatResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeMchat();
  }, [answers]);

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

  const recomputeMchat = async () => {
    // Map answers into fail dictionary: 1 if failed, 0 if passed
    const failedMap = {};
    MCHAT_ITEMS.forEach((it) => {
      const parentAnsYes = answers[it.id] === true;
      const isFailed = it.reverse ? parentAnsYes : !parentAnsYes;
      failedMap[it.id] = isFailed ? 1 : 0;
    });

    try {
      const resp = await clinicalTestApi.runMchat({ responses: failedMap });
      setMchatResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('M-CHAT calculation error:', e);
    }
  };

  const setAnswer = (itemId, val) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: val,
    }));
    soundEngine.playTone(val ? 600 : 400, 0.04);
  };

  const setAllPass = () => {
    const fresh = {};
    MCHAT_ITEMS.forEach((it) => {
      fresh[it.id] = !it.reverse;
    });
    setAnswers(fresh);
    soundEngine.playTone(650, 0.08);
  };

  const setDemoHighRisk = () => {
    const demo = {};
    MCHAT_ITEMS.forEach((it) => {
      // Fail critical items Q2, Q5, Q7, Q12, Q14, Q17 plus Q8, Q9, Q10, Q19
      const failThis = [2, 5, 7, 8, 9, 10, 12, 14, 17, 19].includes(it.id);
      demo[it.id] = it.reverse ? failThis : !failThis;
    });
    setAnswers(demo);
    soundEngine.playTone(300, 0.1);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط فحص التوحد M-CHAT-R بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'M_CHAT',
        calculated_total_score: mchatResult?.failed_count || 0,
        subscale_scores: {
          failed_items: { name: 'إجمالي بنود الإخفاق', raw: `${mchatResult?.failed_count} / 20`, interpretation: mchatResult?.risk_label_ar },
          critical_fails: { name: 'البنود الحرجة المخفوقة', raw: `${mchatResult?.critical_fails} / 6` },
          risk_tier: { name: 'مستوى الخطورة السريرية', raw: mchatResult?.risk_label_ar },
        },
        raw_responses: answers,
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم M-CHAT');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center text-white font-black shadow-lg shadow-teal-600/30">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                استبيان الكشف المبكر عن التوحد (M-CHAT-R/F DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Robins et al.
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              فحص نمائي مقنن للأطفال من 16 إلى 30 شهراً للكشف عن مؤشرات اضطراب طيف التوحد (TSA).
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
                <User className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="shrink-0">المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
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
                <span className="font-bold">الطفل المفحوص:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Demo Controls */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={setAllPass}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-slate-700 flex items-center space-x-1 space-x-reverse transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>اجتياز طبيعي (Pass All)</span>
              </button>
              <button
                type="button"
                onClick={setDemoHighRisk}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center space-x-1 space-x-reverse transition-colors"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>حالة نموذجية عالية الخطورة</span>
              </button>
            </div>
          </div>

          {/* REAL-TIME M-CHAT RISK DASHBOARD BANNER */}
          {mchatResult && (
            <div className={`p-5 rounded-3xl border shadow-xl transition-all ${
              mchatResult.risk_level === 'low'
                ? 'bg-gradient-to-r from-slate-950 via-emerald-950/30 to-slate-950 border-emerald-500/40'
                : mchatResult.risk_level === 'medium'
                ? 'bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border-amber-500/40'
                : 'bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950 border-rose-500/50 shadow-rose-500/10 animate-pulse'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className={`px-5 py-2.5 rounded-2xl font-mono font-black text-3xl shadow-lg ${
                    mchatResult.risk_level === 'low'
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : mchatResult.risk_level === 'medium'
                      ? 'bg-amber-600 text-white shadow-amber-600/30'
                      : 'bg-rose-600 text-white shadow-rose-600/40'
                  }`}>
                    {mchatResult.failed_count} / 20
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">إجمالي بنود الإخفاق (Fails):</span>
                    <strong className="text-base font-black text-white block">
                      {mchatResult.risk_label_ar}
                    </strong>
                    <span className="text-xs text-slate-400 font-medium">
                      البنود الحرجة المخفوقة: <strong className="text-rose-400 font-mono font-bold">{mchatResult.critical_fails} / 6</strong>
                    </span>
                  </div>
                </div>

                <div className="max-w-md p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed text-right">
                  <span className="font-bold block text-teal-300 mb-0.5">التوجيه الإكلينيكي المباشر:</span>
                  {mchatResult.recommendation_ar}
                </div>
              </div>
            </div>
          )}

          {/* 20 QUESTIONS LIST */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-300 flex items-center space-x-1.5 space-x-reverse">
              <Activity className="w-4 h-4 text-teal-400" />
              <span>بنود الاستبيان الـ 20 (أجب بنعم أو لا بناءً على ملاحظات الوالدين):</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {MCHAT_ITEMS.map((item) => {
                const parentAnsYes = answers[item.id] === true;
                const isFailed = item.reverse ? parentAnsYes : !parentAnsYes;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isFailed
                        ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white leading-snug">{item.text_ar}</p>
                        <p className="text-[11px] text-slate-400 italic" dir="ltr">{item.text_fr}</p>
                      </div>

                      {item.isCritical && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-300 text-[10px] font-black border border-rose-500/30 shrink-0">
                          بند حرج ⚠️
                        </span>
                      )}
                    </div>

                    {/* 1-Click Yes/No Pill Buttons */}
                    <div className="flex items-center space-x-2 space-x-reverse pt-1">
                      <button
                        type="button"
                        onClick={() => setAnswer(item.id, true)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
                          answers[item.id] === true
                            ? item.reverse
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                              : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                        }`}
                      >
                        <span>نعم (Oui)</span>
                        {answers[item.id] === true && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setAnswer(item.id, false)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
                          answers[item.id] === false
                            ? !item.reverse
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                              : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                        }`}
                      >
                        <span>لا (Non)</span>
                        {answers[item.id] === false && <Check className="w-3.5 h-3.5" />}
                      </button>
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
              <span>الخلاصة الإكلينيكية والتوصية التشخيصية (Synthèse M-CHAT-R):</span>
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
              onClick={setAllPass}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط الاستبيان</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs shadow-xl shadow-teal-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج الفحص...' : 'اعتماد فحص التوحد M-CHAT-R 💾'}</span>
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
              تم توثيق نتائج فحص M-CHAT-R بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل عدد بنود الإخفاق وتحديد مستوى الخطورة وحفظ التوصية السريرية بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">بنود الإخفاق:</span>
              <strong className="text-teal-400 text-base font-black font-mono">
                {mchatResult?.failed_count} / 20
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">مستوى الخطورة:</span>
              <span className={`font-bold ${
                mchatResult?.risk_level === 'high' ? 'text-rose-400' : mchatResult?.risk_level === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {mchatResult?.risk_label_ar}
              </span>
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
