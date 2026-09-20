import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  Save, 
  Send, 
  AlertCircle, 
  HelpCircle,
  Building,
  User,
  Clock,
  ArrowRight,
  RotateCcw,
  Check
} from 'lucide-react';
import { remoteAssessmentApi } from '../api';

const MCHAT_QUESTIONS = [
  { id: 1, text: 'إذا أشرت بيدك إلى شيء في الغرفة، هل ينظر طفلك إليه؟ (مثال: أشرت إلى لعبة أو قطة)', reverse: false },
  { id: 2, text: 'هل سبق أن تساءلت إن كان طفلك أصماً أو يعاني من ضعف سمع؟', reverse: true },
  { id: 3, text: 'هل يلعب طفلك ألعاب التظاهر والتمثيل؟ (مثال: يتظاهر بالشرب من كوب فارغ، يطعم دميته)', reverse: false },
  { id: 4, text: 'هل يحب طفلك التسلق على الأشياء؟ (مثل الأثاث، السلالم، أو ألعاب الحديقة)', reverse: false },
  { id: 5, text: 'هل يقوم طفلك بحركات غير عادية بأصابعه بالقرب من عينيه؟ (مثال: يرفرف بأصابعه قرب عينه)', reverse: true },
  { id: 6, text: 'هل يشير طفلك بإصبعه ليطلب شيئاً أو للحصول على مساعدة؟ (مثال: يشير إلى حلوى بعيدة)', reverse: false },
  { id: 7, text: 'هل يشير طفلك بإصبعه ليلفت انتباهك إلى شيء ممتع؟ (مثال: يشير لطائرة في السماء ليراك تنظر إليها)', reverse: false },
  { id: 8, text: 'هل يهتم طفلك بالأطفال الآخرين؟ (هل ينظر إليهم، يبتسم لهم، أو يقترب منهم؟)', reverse: false },
  { id: 9, text: 'هل يريك طفلك أشياءً بحملها إليك أو مدها نحوك؟ (ليس طلباً للمساعدة، بل لمجرد مشاركتك)', reverse: false },
  { id: 10, text: 'هل يستجيب طفلك عندما تناديه باسمه؟ (هل يلتفت نحوك، ينظر إليك، أو يترك ما يفعله؟)', reverse: false },
  { id: 11, text: 'عندما تبتسم لطفلك، هل يبتسم لك في المقابل؟', reverse: false },
  { id: 12, text: 'هل ينزعج طفلك بشدة من الأصوات اليومية العادية؟ (مثل المكنسة، الخلاط، مجفف الشعر؟)', reverse: true },
  { id: 13, text: 'هل يمشي طفلك بمفرده؟', reverse: false },
  { id: 14, text: 'هل ينظر طفلك في عينيك عندما تتحدث إليه أو تلعب معه أو تلبسه؟', reverse: false },
  { id: 15, text: 'هل يحاول طفلك تقليد ما تفعله؟ (مثال: التلويح بيده، التصفيق، إصدار صوت مرح)', reverse: false },
  { id: 16, text: 'إذا أدرت رأسك لتنظر إلى شيء ما، هل يلتفت طفلك ليرى ما تنظر إليه؟', reverse: false },
  { id: 17, text: 'هل يحاول طفلك لفت انتباهك ليجعلك تنظر إليه؟ (مثال: يقول "انظر" أو يبحث عن إشادتك)', reverse: false },
  { id: 18, text: 'هل يفهم طفلك عندما تطلب منه القيام بأمر بسيط بدون إشارات؟ (مثال: "ضع الحذاء على الكرسي")', reverse: false },
  { id: 19, text: 'إذا حدث أمر جديد أو غير مألوف، هل ينظر طفلك إلى وجهك ليرى ردة فعلك؟', reverse: false },
  { id: 20, text: 'هل يحب طفلك الأنشطة الحركية الشيقة؟ (مثال: التأرجح، القفز على ركبتيك)', reverse: false },
];

const ADHD_QUESTIONS = [
  { id: 1, text: 'لا ينتبه للتفاصيل الدقيقة أو يرتكب أخطاء نتيجة السهو والإهمال في واجباته أو أنشطته' },
  { id: 2, text: 'يجد صعوبة مستمرة في الحفاظ على تركيزه أثناء أداء المهام أو أثناء اللعب' },
  { id: 3, text: 'يبدو كأنه لا يستمع عندما يتحدث إليه أحد بشكل مباشر' },
  { id: 4, text: 'لا يتبع التعليمات حتى النهاية ويفشل في إتمام الواجبات المدرسية أو الأعمال المنزلية' },
  { id: 5, text: 'يواجه صعوبة في تنظيم مهامه، أدواته، وأنشطته اليومية' },
  { id: 6, text: 'يتجنب أو يكره بشدة المهام التي تتطلب جهداً ذهنياً مستمراً ومتواصلاً' },
  { id: 7, text: 'يضيع أغراضه وأدواته المدرسية أو ألعابه بشكل متكرر' },
  { id: 8, text: 'يتشتت انتباهه بسهولة بالغة عند وجود أي مثير خارجي بسيط' },
  { id: 9, text: 'كثير النسيان في الأنشطة والواجبات اليومية المعتادة' },
  { id: 10, text: 'يفرك يديه أو قدميه أو يتململ ويتحرك بعصبية أثناء جلوسه في المقعد' },
  { id: 11, text: 'يغادر مقعده في القسم أو في مواقف يُتوقع منه فيها البقاء جالساً' },
  { id: 12, text: 'يركض أو يتسلق الأثاث والجدران بشكل مفرط في أوقات ومواقف غير مناسبة' },
  { id: 13, text: 'يجد صعوبة كبيرة في اللعب أو الاندماج بالأنشطة الترفيهية بهدوء وسكينة' },
  { id: 14, text: 'دائم الحركة والنشاط وكأنه مدفوع بمحرك ميكانيكي لا يهدأ' },
  { id: 15, text: 'يتحدث بشكل مفرط ومستمر دون توقف' },
  { id: 16, text: 'يتسرع في الإجابة على الأسئلة قبل اكتمال طرحها عليه' },
  { id: 17, text: 'يجد صعوبة شديدة في انتظار دوره في الطابور أو الألعاب الجماعية' },
  { id: 18, text: 'يقاطع الآخرين أو يقتحم محادثاتهم أو ألعابهم دون استئذان' },
];

const PHQ9_QUESTIONS = [
  { id: 1, text: 'قلة الاهتمام أو انعدام المتعة في ممارسة الأنشطة اليومية والهوايات' },
  { id: 2, text: 'الشعور بالإحباط أو الحزن الشديد أو اليأس والاكتئاب' },
  { id: 3, text: 'صعوبة في النوم أو الاستيقاظ المتكرر، أو الإفراط في النوم لساعات طويلة' },
  { id: 4, text: 'الشعور بالإرهاق والتعب المستمر أو قلة الطاقة البدنية والذهنية' },
  { id: 5, text: 'ضعف وفقدان الشهية أو العكس الإفراط غير المعتاد في تناول الطعام' },
  { id: 6, text: 'الشعور بالسوء تجاه الذات، أو الإحساس بالفشل وخيبة أمل النفس والأسرة' },
  { id: 7, text: 'صعوبة في التركيز على الأشياء، مثل قراءة الكتب أو مشاهدة التلفاز' },
  { id: 8, text: 'بطء شديد في الحركة أو الكلام لدرجة يلاحظها الآخرون، أو العكس تململ مفرط' },
  { id: 9, text: 'أفكار حول إيذاء النفس أو تمني زوال الحياة والغياب عن العالم' },
];

const GAD7_QUESTIONS = [
  { id: 1, text: 'الشعور بالعصبية الزائدة أو القلق والتوتر الشديد' },
  { id: 2, text: 'عدم القدرة على إيقاف القلق أو السيطرة على الأفكار المقلقة' },
  { id: 3, text: 'القلق المفرط والمستمر بشأن أمور ومواقف حياتية متنوعة' },
  { id: 4, text: 'صعوبة الاسترخاء والشعور بالهدوء والراحة' },
  { id: 5, text: 'الشعور بالتململ وعدم الاستقرار لدرجة يصعب معها الجلوس ساكناً' },
  { id: 6, text: 'سرعة الانزعاج وسهولة الاستثارة والغضب لأبسط الأسباب' },
  { id: 7, text: 'الشعور بالخوف والهلع وكأن أمراً سيئاً أو كارثة على وشك الحدوث' },
];

export default function PublicRemoteAssessmentPortal({ token }) {
  // Authentication PIN Gate State
  const [pin, setPin] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [authError, setAuthError] = useState('');

  // Assessment Portal Context
  const [assessmentContext, setAssessmentContext] = useState(null);
  const [responses, setResponses] = useState({});
  const [parentNotes, setParentNotes] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedMessage, setDraftSavedMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setAuthError('الرجاء إدخال رمز PIN المكون من 4 أرقام على الأقل.');
      return;
    }

    setVerifyingPin(true);
    setAuthError('');
    try {
      const res = await remoteAssessmentApi.verifyPin(token, pin);
      setAssessmentContext(res);
      if (res.draft_responses && typeof res.draft_responses === 'object') {
        setResponses(res.draft_responses);
      }
      setPinVerified(true);
    } catch (err) {
      setAuthError(err.message || 'رمز PIN غير صحيح أو تم حظر الرابط لكثرة المحاولات الخاطئة.');
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!pin || !token) return;
    setSavingDraft(true);
    setDraftSavedMessage('');
    try {
      const res = await remoteAssessmentApi.saveDraft(token, pin, responses);
      setDraftSavedMessage('✅ تم حفظ المسودة بنجاح!');
      setTimeout(() => setDraftSavedMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Erreur lors de la sauvegarde du brouillon');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm('هل أنت متأكد من مراجعة كافة الإجابات وتأكيد إرسال الاستبيان النهائي للعيادة؟')) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await remoteAssessmentApi.submit(token, pin, responses, parentNotes);
      setSubmissionResult(res);
      setSubmittedSuccess(true);
    } catch (err) {
      alert(err.message || 'Erreur lors de la soumission de l\'évaluation');
    } finally {
      setSubmitting(false);
    }
  };

  // Select questions array based on test_code
  const getQuestionsList = () => {
    const code = (assessmentContext?.test_code || 'MCHAT_R').toUpperCase();
    if (code === 'ADHD_RATING') return ADHD_QUESTIONS;
    if (code === 'PHQ9') return PHQ9_QUESTIONS;
    if (code === 'GAD7') return GAD7_QUESTIONS;
    return MCHAT_QUESTIONS;
  };

  const questions = getQuestionsList();
  const testCode = (assessmentContext?.test_code || 'MCHAT_R').toUpperCase();

  const answeredCount = Object.keys(responses).filter((k) => responses[k] !== undefined && responses[k] !== '').length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 flex flex-col justify-between font-sans selection:bg-brand-500 selection:text-white" dir="rtl">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Step 1: Security PIN Gate */}
        {!pinVerified ? (
          <div className="p-6 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-center animate-in fade-in max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-500/25">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-black">
                🇩🇿 البوابة السحابية المؤمنة للتقييم السريري
              </span>
              <h2 className="text-xl font-extrabold text-white mt-2">
                إدخال رمز الدخول السري (Code PIN)
              </h2>
              <p className="text-xs text-slate-400">
                لحماية خصوصية البيانات الصحية، يُرجى إدخال الرمز المرفق في رسالة العيادة
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4 pt-2">
              <div className="space-y-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  autoFocus
                  required
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono font-black text-2xl tracking-widest text-center focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-700 shadow-inner"
                />

                {authError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center space-x-1.5 space-x-reverse text-right">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={verifyingPin || pin.length < 4}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-brand-500/25 flex items-center justify-center space-x-2 space-x-reverse transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{verifyingPin ? 'جارٍ التحقق المشفر...' : 'فتح الاستبيان ومتابعة الإجابة'}</span>
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-center space-x-1.5 space-x-reverse">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>مشفر بنظام 256-bit ومعتمد لسرية السجلات الطبية</span>
            </div>
          </div>
        ) : submittedSuccess ? (
          /* Submission Completed Thank You Screen */
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-emerald-500/40 text-center space-y-6 shadow-2xl max-w-lg mx-auto my-12 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center shadow-xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">
                تم استلام إجاباتكم بنجاح! 🎯
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                شكراً لتعاونكم. تم إرسال وتصحيح التقييم وربطه مباشرة بالملف الطبي للمريض لدى العيادة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div>المريض: <strong className="text-white">{assessmentContext?.patient?.first_name} {assessmentContext?.patient?.last_name}</strong></div>
              <div>العيادة: <strong className="text-brand-300">{assessmentContext?.clinic?.name}</strong></div>
              <div>وقت الإرسال: <span className="font-mono text-slate-300">{new Date().toLocaleString('fr-FR')}</span></div>
            </div>

            <p className="text-xs text-slate-500">
              يمكنك الآن إغلاق هذه الصفحة بأمان.
            </p>
          </div>
        ) : (
          /* Step 2: Interactive Questionnaire Screen */
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-brand-400 mb-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>عيادة: {assessmentContext?.clinic?.name}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  استبيان المريض: {assessmentContext?.patient?.first_name} {assessmentContext?.patient?.last_name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  يرجى الإجابة بدقة وشفافية على كافة البنود أدناه وفقاً لسلوكيات الطفل/المريض
                </p>
              </div>

              {/* Save Draft Action */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-extrabold flex items-center space-x-1.5 space-x-reverse transition-all shadow-md"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>{savingDraft ? 'جارٍ الحفظ...' : 'حفظ كمسودة ومتابعة لاحقاً'}</span>
                </button>
              </div>
            </div>

            {/* Saved Draft Floating Toast */}
            {draftSavedMessage && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black text-center animate-in fade-in">
                {draftSavedMessage}
              </div>
            )}

            {/* Progress Bar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">نسبة اكتمال الإجابات:</span>
                <span className="font-mono text-brand-400">{answeredCount} من {questions.length} أسئلة ({progressPct}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Questions Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Question Items */}
              <div className="space-y-3">
                {questions.map((q, idx) => {
                  const currentAnswer = responses[`q${q.id}`];

                  return (
                    <div 
                      key={q.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        currentAnswer !== undefined && currentAnswer !== ''
                          ? 'bg-slate-900/90 border-slate-800'
                          : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <span className="w-7 h-7 rounded-xl bg-slate-800 text-brand-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {q.id}
                        </span>
                        <div className="flex-1 space-y-3">
                          <p className="text-sm font-bold text-white leading-relaxed">
                            {q.text}
                          </p>

                          {/* Response Buttons */}
                          {testCode === 'MCHAT_R' ? (
                            <div className="grid grid-cols-2 gap-3 max-w-xs">
                              <button
                                type="button"
                                onClick={() => setResponses((prev) => ({ ...prev, [`q${q.id}`]: 'yes' }))}
                                className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
                                  currentAnswer === 'yes'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                                }`}
                              >
                                <span>نعم (Oui)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setResponses((prev) => ({ ...prev, [`q${q.id}`]: 'no' }))}
                                className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
                                  currentAnswer === 'no'
                                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400'
                                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                                }`}
                              >
                                <span>لا (Non)</span>
                              </button>
                            </div>
                          ) : (
                            /* 0 - 1 - 2 - 3 4-point scale */
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { val: 0, label: '0: أبداً / لا ينطبق' },
                                { val: 1, label: '1: أحياناً / خفيف' },
                                { val: 2, label: '2: كثيراً / متوسط' },
                                { val: 3, label: '3: دائماً / شديد' },
                              ].map((opt) => (
                                <button
                                  key={opt.val}
                                  type="button"
                                  onClick={() => setResponses((prev) => ({ ...prev, [`q${q.id}`]: opt.val }))}
                                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                                    currentAnswer === opt.val
                                      ? 'bg-brand-600 text-white shadow-lg ring-2 ring-brand-400'
                                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Parent Additional Comments */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  ملاحظات أو تفاصيل إضافية تود إبلاغ الأخصائي/الطبيب بها (اختياري) :
                </label>
                <textarea
                  rows={3}
                  value={parentNotes}
                  onChange={(e) => setParentNotes(e.target.value)}
                  placeholder="مثال: يظهر هذا السلوك خاصة عند التواجد مع غرباء..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs leading-relaxed focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-600"
                />
              </div>

              {/* Footer Final Actions */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  {savingDraft ? 'جارٍ حفظ المسودة...' : '💾 حفظ مؤقت للعودة لاحقاً'}
                </button>

                <button
                  type="submit"
                  disabled={submitting || answeredCount < Math.min(5, questions.length)}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-black text-sm shadow-xl shadow-brand-500/25 flex items-center space-x-2 space-x-reverse transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  <span>{submitting ? 'جارٍ إرسال الاستبيان...' : '🚀 إرسال الاستبيان النهائي للعيادة'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <footer className="text-center text-xs text-slate-600 py-6 border-t border-slate-900 mt-8">
        &copy; {new Date().getFullYear()} {assessmentContext?.clinic?.name || 'ClinicSaaS DZ'} &bull; بوابة المريض المؤمنة للتقييم السريري
      </footer>
    </div>
  );
}
