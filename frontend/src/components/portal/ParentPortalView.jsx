import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Heart, Sparkles, CheckCircle2, AlertCircle, ArrowLeft, 
  ArrowRight, Send, Lock, BookOpen, Clock, Calendar, 
  Check, Phone, MapPin, Printer, HelpCircle 
} from 'lucide-react';
import { portalMagicLinkApi, therapyHubApi } from '../../api';
import ParentMediaUploadBox from './ParentMediaUploadBox';

export default function ParentPortalView() {
  const { token } = useParams();
  const [lang, setLang] = useState('ar'); // 'ar' or 'fr'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portalData, setPortalData] = useState(null);
  const [pin, setPin] = useState('');
  const [pinRequired, setPinRequired] = useState(false);
  const [pinError, setPinError] = useState('');

  // Form State
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [parentNotes, setParentNotes] = useState('');

  // Anamnèse State
  const [anamneseData, setAnamneseData] = useState({
    pregnancy_term: '9_months',
    delivery_type: 'normal',
    birth_cry: 'immediate',
    birth_weight_kg: '',
    walking_age_months: '',
    first_words_age_months: '',
    sentence_age_months: '',
    eye_contact: 'good',
    hearing_reaction: 'normal',
    sphincter_control: 'acquired',
    sleep_quality: 'good',
    screen_time_hours_daily: '1',
    family_history_speech_delay: 'no',
    family_history_autism: 'no',
    medical_surgeries: '',
    current_concerns: '',
  });

  // M-CHAT-R 20 Items State
  const [mchatAnswers, setMchatAnswers] = useState({});

  // Conners ADHD State
  const [connersAnswers, setConnersAnswers] = useState({});

  useEffect(() => {
    loadPortal(pin);
  }, [token]);

  const loadPortal = async (enteredPin = null) => {
    setLoading(true);
    setError(null);
    setPinError('');
    try {
      const res = await portalMagicLinkApi.validateAccess(token || 'preview', enteredPin || null);
      if (res && res.status === 'pin_required') {
        setPinRequired(true);
        setPortalData(res);
      } else if (res && (res.status === 'valid' || res.success)) {
        setPinRequired(false);
        setPortalData(res);
        if (res.is_completed) {
          setSubmitted(true);
        }
      } else {
        // Render fallback preview data
        setPinRequired(false);
        setPortalData({
          status: 'valid',
          form_type: 'anamnese_full',
          patient: { first_name: 'أحمد', last_name: 'الجزائري', age_formatted: '5 سنوات' },
          clinic: { name: 'عيادة الأمل للتأهيل السريري والاستشارات', phone: '0550123456', address: 'الجزائر' },
          practitioner: { name: 'الأخصائي المعالج' },
        });
      }
    } catch (err) {
      console.warn('Portal validation error, loading preview layout:', err);
      // If token is invalid or preview mode, render full interactive layout
      setPinRequired(false);
      setPortalData({
        status: 'valid',
        form_type: 'anamnese_full',
        patient: { first_name: 'أحمد', last_name: 'الجزائري', age_formatted: '5 سنوات' },
        clinic: { name: 'عيادة الأمل للتأهيل السريري والاستشارات', phone: '0550123456', address: 'الجزائر العاصمة' },
        practitioner: { name: 'د. بن علي (أخصائي أرطوفونيا وتخاطب)' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (!pin) {
      setPinError('يرجى إدخال رمز PIN');
      return;
    }
    loadPortal(pin);
  };

  const handleAnamneseChange = (field, value) => {
    setAnamneseData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMchatAnswer = (itemNum, value) => {
    setMchatAnswers((prev) => ({ ...prev, [itemNum]: value }));
  };

  const handleConnersAnswer = (idx, value) => {
    setConnersAnswers((prev) => ({ ...prev, [idx]: value }));
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      let answersPayload = {};
      if (portalData.form_type === 'anamnese_full') {
        answersPayload = {
          pregnancy_details: {
            term: anamneseData.pregnancy_term,
            delivery: anamneseData.delivery_type,
            cry: anamneseData.birth_cry,
            weight: anamneseData.birth_weight_kg,
          },
          psychomotor_development: {
            walking_age: anamneseData.walking_age_months,
            sphincter_control: anamneseData.sphincter_control,
          },
          speech_development: {
            first_words: anamneseData.first_words_age_months,
            sentences: anamneseData.sentence_age_months,
            eye_contact: anamneseData.eye_contact,
            hearing: anamneseData.hearing_reaction,
          },
          sensory_profile: {
            sleep: anamneseData.sleep_quality,
            screens_daily_hours: anamneseData.screen_time_hours_daily,
          },
          medical_history: `سوابق عائلية تأخر نطق: ${anamneseData.family_history_speech_delay}, سوابق توحد: ${anamneseData.family_history_autism}. أمراض وجراحات: ${anamneseData.medical_surgeries || 'لا يوجد'}`,
          current_concerns: anamneseData.current_concerns,
        };
      } else if (portalData.form_type === 'mchat_screening') {
        answersPayload = mchatAnswers;
      } else if (portalData.form_type === 'conners_adhd') {
        answersPayload = connersAnswers;
      }

      await portalMagicLinkApi.submitForm(token, {
        answers: answersPayload,
        parent_notes: parentNotes,
      });

      setSubmitted(true);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء إرسال الاستمارة');
    } finally {
      setSubmitting(false);
    }
  };

  // M-CHAT-R 20 Items Definition (Standardized Arabic & French)
  const mchatQuestions = [
    { num: 1, ar: 'إذا أشرت بيدك إلى شيء ما عبر الغرفة، هل ينظر طفلك إليه؟ (مثال: الإشارة إلى لعبة أو قطة)', fr: 'Si vous montrez quelque chose du doigt à l\'autre bout de la pièce, votre enfant le regarde-t-il ?' },
    { num: 2, ar: 'هل تساءلت يوماً عما إذا كان طفلك أصماً أو يعاني من ضعف سمعي؟', fr: 'Vous êtes-vous déjà demandé si votre enfant était sourd ?', inverted: true },
    { num: 3, ar: 'هل يلعب طفلك ألعاب التخيل والتظاهر؟ (مثال: التظاهر بالشرب من كوب فارغ أو إطعام دمية)', fr: 'Votre enfant joue-t-il à faire semblant ? (ex: faire semblant de boire)' },
    { num: 4, ar: 'هل يحب طفلك التسلق على الأشياء؟ (مثل الأثاث، ألعاب الحديقة، الدرج)', fr: 'Votre enfant aime-t-il grimper sur les choses ?' },
    { num: 5, ar: 'هل يقوم طفلك بحركات غير عادية بأصابعه بالقرب من عينيه؟', fr: 'Votre enfant fait-il des mouvements inhabituels avec ses doigts près de ses yeux ?', inverted: true },
    { num: 6, ar: 'هل يشير طفلك بإصبعه ليطلب شيئاً أو للحصول على المساعدة؟ (مثال: الإشارة إلى حلوى بعيدة)', fr: 'Votre enfant pointe-t-il du doigt pour demander quelque chose ?' },
    { num: 7, ar: 'هل يشير طفلك بإصبعه ليلفت انتباهك لشيء مثير للاهتمام؟ (مثال: الإشارة إلى طائرة في السماء)', fr: 'Votre enfant pointe-t-il du doigt pour vous montrer quelque chose d\'intéressant ?' },
    { num: 8, ar: 'هل يهتم طفلك بالأطفال الآخرين؟ (مثال: مراقبتهم، الابتسام لهم، أو الاقتراب منهم)', fr: 'Votre enfant s\'intéresse-t-il aux autres enfants ?' },
    { num: 9, ar: 'هل يُريك طفلك أشياء يحملها إليك أو يرفعها لتراها أنت فقط (وليس لطلب المساعدة)؟', fr: 'Votre enfant vous montre-t-il des objets en vous les apportant ?' },
    { num: 10, ar: 'هل يستجيب طفلك عندما تناديه باسمه؟ (مثال: ينظر إليك، يتكلم أو يتوقف عما يفعله)', fr: 'Votre enfant répond-il à son prénom quand vous l\'appelez ?' },
    { num: 11, ar: 'عندما تبتسم لطفلك، هل يبتسم لك في المقابل؟', fr: 'Quand vous souriez à votre enfant, vous sourit-il en retour ?' },
    { num: 12, ar: 'هل ينزعج طفلك بشدة من الضوضاء والأصوات اليومية؟ (مثال: مكنسة كهربائية، خلاط)', fr: 'Votre enfant est-il très dérangé par les bruits du quotidien ?', inverted: true },
    { num: 13, ar: 'هل يمشي طفلك بمفرده؟', fr: 'Votre enfant marche-t-il seul ?' },
    { num: 14, ar: 'هل ينظر طفلك في عينيك مباشرة عندما تتحدث معه أو تلعب معه أو تلبسه ملابسه؟', fr: 'Votre enfant vous regarde-t-il dans les yeux lorsque vous lui parlez ?' },
    { num: 15, ar: 'هل يحاول طفلك تقليد ما تفعله؟ (مثال: التلويح بيده للوداع، التصفيق)', fr: 'Votre enfant essaie-t-il d\'imiter ce que vous faites ?' },
    { num: 16, ar: 'إذا أدرت رأسك لتنظر إلى شيء ما، هل يلتفت طفلك ليرى إلى ماذا تنظر؟', fr: 'Si vous tournez la tête pour regarder quelque chose, votre enfant regarde-t-il aussi ?' },
    { num: 17, ar: 'هل يحاول طفلك لفت انتباهك لمشاهدته؟ (مثال: أن يقول لك "انظر إلي" أو يبتسم لينال مدحك)', fr: 'Votre enfant essaie-t-il de vous faire regarder ce qu\'il fait ?' },
    { num: 18, ar: 'هل يفهم طفلك عندما تطلب منه القيام بأمر بدون إشارة؟ (مثال: "ضع الحذاء هناك")', fr: 'Votre enfant comprend-il quand vous lui dites de faire quelque chose sans gestes ?' },
    { num: 19, ar: 'إذا حدث شيء جديد، هل ينظر طفلك إلى وجهك ليرى كيف تتفاعل معه؟', fr: 'Si quelque chose d\'inhabituel arrive, votre enfant regarde-t-il votre visage ?' },
    { num: 20, ar: 'هل يحب طفلك الأنشطة الحركية التفاعلية؟ (مثل الهز على الركبة أو المداعبة)', fr: 'Votre enfant aime-t-il les jeux de mouvement et de chatouilles ?' },
  ];

  // Conners ADHD 18 Items Definition
  const connersQuestions = [
    'كثير الحركة والتململ ولا يثبت في مكانه',
    'يترك مقعده في أوقات يُتوقع منه البقاء جالساً',
    'يركض أو يتسلق في مواقف غير مناسبة',
    'يواجه صعوبة في اللعب بهدوء',
    'مندفع كأنه "مدار بمحرك"',
    'يتحدث بشكل مفرط دون توقف',
    'يجيب بتسرع قبل اكتمال طرح السؤال',
    'يواجه صعوبة كبيرة في انتظار دوره',
    'يقاطع الآخرين أو يتدخل في شؤونهم',
    'يفشل في الانتباه الدقيق للتفاصيل ويرتكب أخطاء تافهة',
    'يواجه صعوبة في الاستمرار في التركيز على المهام أو اللعب',
    'يبدو كأنه لا يستمع عندما يُتحدث إليه مباشرة',
    'لا يتبع التعليمات حتى النهاية ويفشل في إتمام المهام',
    'يواجه صعوبة في تنظيم المهام والأنشطة',
    'يتجنب أو يكره المهام التي تتطلب مجهوداً ذهنياً متواصلاً',
    'يفقد أو ينسى أدواته وأغراضه المدرسية باستمرار',
    'يتشتت بسهولة بالمثيرات الخارجية العابرة',
    'كثير النسيان في الأنشطة والروتين اليومي',
  ];

  const isRtl = lang === 'ar';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold">جاري تحميل البوابة السريرية المخصصة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white text-center" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black mb-2">تعذر الوصول إلى البوابة</h3>
        <p className="text-xs text-slate-400 max-w-sm">{error}</p>
      </div>
    );
  }

  if (pinRequired) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white" dir="rtl">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-black">رمز الحماية السري (PIN)</h3>
            <p className="text-xs text-slate-400 mt-1">
              يرجى إدخال رمز المرور السري المرسل من العيادة للوصول إلى استمارة الطفل ({portalData?.patient_first_name || 'المريض'}).
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full text-center tracking-widest text-2xl font-mono bg-slate-950 border border-slate-800 rounded-2xl py-3 text-white focus:outline-none focus:border-emerald-500"
            />

            {pinError && <p className="text-xs text-rose-400 font-bold">{pinError}</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition-all"
            >
              دخول البوابة
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white text-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-3xl animate-bounce">
            🎉
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-white">
              {isRtl ? 'شكراً جزيلاً لتعاونكم!' : 'Merci beaucoup pour votre collaboration !'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isRtl
                ? `تم استلام إجاباتكم بنجاح وتوثيقها ومزامنتها مباشرة مع الملف الطبي للطفل (${portalData?.patient?.first_name || 'البطل'}) لدى الأخصائي المشرف (${portalData?.practitioner?.name || 'العيادة'}).`
                : `Vos réponses ont été transmises avec succès au dossier médical de l'enfant (${portalData?.patient?.first_name || ''}).`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="font-bold text-white flex items-center justify-center space-x-1.5 space-x-reverse">
              <span>🏥 {portalData?.clinic?.name}</span>
            </div>
            {portalData?.clinic?.phone && (
              <div className="flex items-center justify-center space-x-1 space-x-reverse text-emerald-400 font-mono">
                <Phone className="w-3.5 h-3.5" />
                <span>{portalData.clinic.phone}</span>
              </div>
            )}
            {portalData?.clinic?.address && (
              <p className="text-[11px] text-slate-500">{portalData.clinic.address}</p>
            )}
          </div>

          {/* Parent Audio & Media Upload Control after submission */}
          <div className="text-right">
            <ParentMediaUploadBox
              token={token || portalData?.token || 'preview'}
              lang={lang}
              patientName={portalData?.patient?.first_name || ''}
              showHistory={true}
            />
          </div>
        </div>
      </div>
    );
  }

  const patient = portalData?.patient || {};
  const clinic = portalData?.clinic || {};
  const formType = portalData?.form_type || 'anamnese_full';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sticky Mobile Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-lg font-bold shadow-md shadow-emerald-500/20">
              🩺
            </div>
            <div>
              <h2 className="text-xs font-black text-white truncate max-w-[180px]">
                {clinic.name || 'العيادة التخصصية'}
              </h2>
              <p className="text-[10px] text-emerald-400 flex items-center space-x-1 space-x-reverse">
                <span>البطل: <strong>{patient.first_name || 'الطفل'}</strong></span>
                {patient.age_formatted && <span>({patient.age_formatted})</span>}
              </p>
            </div>
          </div>

          <button
            onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
            className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold font-mono border border-slate-700 hover:text-white"
          >
            {lang === 'ar' ? 'Français 🇫🇷' : 'العربية 🇩🇿'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Banner Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {formType === 'anamnese_full' ? '📝 استمارة السوابق النمائية' : formType === 'mchat_screening' ? '🧩 استبيان الفحص النمائي للتوحد' : formType === 'conners_adhd' ? '⚡ مقياس الانتباه والنشاط' : '📚 كراس التمارين والواجبات'}
          </span>
          <h3 className="text-base font-black text-white">
            {isRtl ? `مرحباً بكم في استمارة المتابعة الخاصة بالبطل ${patient.first_name || ''}` : `Bienvenue sur le portail de suivi de ${patient.first_name || ''}`}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isRtl 
              ? 'إجاباتكم الدقيقة تساعد الفريق الطبي والأخصائي في وضع خطة تقييم وتأهيل دقيقة ومخصصة لطفلكم.'
              : 'Vos réponses précises aident l\'équipe médicale à élaborer un plan personnalisé pour votre enfant.'}
          </p>
        </div>

        {/* 1. ANAMNÈSE FULL FORM */}
        {formType === 'anamnese_full' && (
          <div className="space-y-5">
            {/* Step 0: Pregnancy & Delivery */}
            {currentStep === 0 && (
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
                <h4 className="text-xs font-black text-emerald-400 flex items-center space-x-1.5 space-x-reverse">
                  <span>1. معلومات فترة الحمل والولادة (Grossesse & Accouchement)</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">مدة الحمل:</label>
                    <select
                      value={anamneseData.pregnancy_term}
                      onChange={(e) => handleAnamneseChange('pregnancy_term', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="9_months">مكتمل (9 أشهر كاملة)</option>
                      <option value="premature_8">ولادة مبكرة (8 أشهر)</option>
                      <option value="premature_7">ولادة مبكرة جداً (7 أشهر أو أقل)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">نوع الولادة:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'normal', label: 'ولادة طبيعية' },
                        { id: 'cesarean', label: 'عملية قيصرية' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleAnamneseChange('delivery_type', opt.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                            anamneseData.delivery_type === opt.id
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">صرخة الميلاد الأولى:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'immediate', label: 'صرخة فورية طبيعية' },
                        { id: 'delayed_incubator', label: 'تأخرت / احتاج الحضانة (Couveuse)' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleAnamneseChange('birth_cry', opt.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                            anamneseData.birth_cry === opt.id
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">الوزن عند الولادة (كغ - تقريبي):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={anamneseData.birth_weight_kg}
                      onChange={(e) => handleAnamneseChange('birth_weight_kg', e.target.value)}
                      placeholder="مثال: 3.2 كغ"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Psychomotor & Language */}
            {currentStep === 1 && (
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
                <h4 className="text-xs font-black text-emerald-400 flex items-center space-x-1.5 space-x-reverse">
                  <span>2. التطور الحركي واللغوي (Développement)</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">عمر المشي المستقل (أشهر):</label>
                      <input
                        type="number"
                        value={anamneseData.walking_age_months}
                        onChange={(e) => handleAnamneseChange('walking_age_months', e.target.value)}
                        placeholder="مثال: 12 أو 15 شهر"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">عمر أول كلمة واضحة (أشهر):</label>
                      <input
                        type="number"
                        value={anamneseData.first_words_age_months}
                        onChange={(e) => handleAnamneseChange('first_words_age_months', e.target.value)}
                        placeholder="مثال: بابا، ماما (12 شهر)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">التواصل البصري عند التحدث معه:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'good', label: 'ممتاز ومباشر' },
                        { id: 'medium', label: 'متوسط / متقطع' },
                        { id: 'poor', label: 'ضعيف ويتجنب النظر' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleAnamneseChange('eye_contact', opt.id)}
                          className={`p-2 rounded-xl border text-[11px] font-bold transition-all ${
                            anamneseData.eye_contact === opt.id
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">التحكم في النظافة وقضاء الحاجة:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'acquired', label: 'مكتسب نهاراً وليلاً' },
                        { id: 'not_acquired', label: 'غير مكتسب بعد / صعوبات' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleAnamneseChange('sphincter_control', opt.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                            anamneseData.sphincter_control === opt.id
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: History & Current Concerns */}
            {currentStep === 2 && (
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
                <h4 className="text-xs font-black text-emerald-400 flex items-center space-x-1.5 space-x-reverse">
                  <span>3. السوابق العائلية والشكوى الرئيسية (Antécédents & Motifs)</span>
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      كم ساعة يقضيها الطفل أمام الشاشات (تلفاز / هاتف) يومياً؟
                    </label>
                    <select
                      value={anamneseData.screen_time_hours_daily}
                      onChange={(e) => handleAnamneseChange('screen_time_hours_daily', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="0">أقل من ساعة / ممنوع من الشاشات</option>
                      <option value="1-2">من ساعة إلى ساعتين</option>
                      <option value="3-5">من 3 إلى 5 ساعات</option>
                      <option value="6+">أكثر من 6 ساعات يومياً</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      الشكوى والملاحظة الرئيسية التي تقلقكم كأولياء:
                    </label>
                    <textarea
                      rows={3}
                      value={anamneseData.current_concerns}
                      onChange={(e) => handleAnamneseChange('current_concerns', e.target.value)}
                      placeholder="صف الصعوبات التي يواجهها طفلك في النطق، التعلم، أو السلوك..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                    />
                  </div>

                  {/* Parent Voice Sample / Media Upload Control */}
                  <div className="pt-2">
                    <ParentMediaUploadBox
                      token={token || portalData?.token || 'preview'}
                      lang={lang}
                      patientName={patient.first_name || ''}
                      showHistory={true}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between pt-2">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:text-white"
                >
                  السابق
                </button>
              ) : <div />}

              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-500/25 flex items-center space-x-1.5 space-x-reverse"
                >
                  <span>التالي</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black shadow-xl shadow-emerald-500/30 flex items-center space-x-2 space-x-reverse"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'جارٍ الإرسال...' : 'إرسال الاستمارة للعيادة'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. M-CHAT-R AUTISM SCREENING */}
        {formType === 'mchat_screening' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>السؤال {currentStep + 1} من {mchatQuestions.length}</span>
              <span className="font-mono text-emerald-400">
                {Math.round(((currentStep + 1) / mchatQuestions.length) * 100)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / mchatQuestions.length) * 100}%` }}
              />
            </div>

            {/* Current Question Card */}
            {mchatQuestions[currentStep] && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 animate-in zoom-in-95">
                <div className="text-center space-y-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center mx-auto">
                    {currentStep + 1}
                  </span>
                  <p className="text-sm font-black text-white leading-relaxed">
                    {isRtl ? mchatQuestions[currentStep].ar : mchatQuestions[currentStep].fr}
                  </p>
                </div>

                {/* Big Touch Yes / No Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleMchatAnswer(mchatQuestions[currentStep].num, true);
                      if (currentStep < mchatQuestions.length - 1) {
                        setCurrentStep(currentStep + 1);
                      }
                    }}
                    className={`p-4 rounded-2xl border text-sm font-black transition-all flex flex-col items-center justify-center space-y-1 ${
                      mchatAnswers[mchatQuestions[currentStep].num] === true
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-emerald-500/40'
                    }`}
                  >
                    <span className="text-xl">👍</span>
                    <span>{isRtl ? 'نعم (Oui)' : 'Oui'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleMchatAnswer(mchatQuestions[currentStep].num, false);
                      if (currentStep < mchatQuestions.length - 1) {
                        setCurrentStep(currentStep + 1);
                      }
                    }}
                    className={`p-4 rounded-2xl border text-sm font-black transition-all flex flex-col items-center justify-center space-y-1 ${
                      mchatAnswers[mchatQuestions[currentStep].num] === false
                        ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/30'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-rose-500/40'
                    }`}
                  >
                    <span className="text-xl">👎</span>
                    <span>{isRtl ? 'لا (Non)' : 'Non'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                disabled={currentStep === 0}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold disabled:opacity-30"
              >
                السابق
              </button>

              {currentStep === mchatQuestions.length - 1 && (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting || Object.keys(mchatAnswers).length < mchatQuestions.length}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center space-x-1.5 space-x-reverse"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'جارٍ الإرسال...' : 'تأكيد وإرسال الاستبيان'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. CONNERS ADHD SCREENING */}
        {formType === 'conners_adhd' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 text-center">
              يرجى تقييم مدى تكرار كل سلوك من السلوكيات التالية لدى طفلكم:
            </p>

            <div className="space-y-3">
              {connersQuestions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-white leading-relaxed">
                    {idx + 1}. {q}
                  </p>

                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { score: 0, label: 'أبداً' },
                      { score: 1, label: 'قليلاً' },
                      { score: 2, label: 'كثيراً' },
                      { score: 3, label: 'دائماً' },
                    ].map((opt) => (
                      <button
                        key={opt.score}
                        type="button"
                        onClick={() => handleConnersAnswer(idx, opt.score)}
                        className={`py-2 px-1 rounded-xl text-[10.5px] font-bold transition-all ${
                          connersAnswers[idx] === opt.score
                            ? 'bg-emerald-600 text-white border border-emerald-500 shadow-md'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={submitting || Object.keys(connersAnswers).length < connersQuestions.length}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs shadow-xl shadow-emerald-500/30 flex items-center justify-center space-x-2 space-x-reverse"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'جارٍ الإرسال...' : 'إرسال تقييم كونرز للعيادة'}</span>
            </button>
          </div>
        )}

        {/* 4. HOMEWORK HUB / GENERAL PORTAL */}
        {(formType === 'homework_hub' || formType === 'general_portal') && (
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white flex items-center space-x-2 space-x-reverse">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>كراسات التمارين والواجبات المنزلية المقررة</span>
            </h4>

            {portalData?.homework_plans?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/60 rounded-3xl border border-slate-800">
                لا توجد كراسات تمارين معتمدة حالياً. يرجى مراجعة الأخصائي المعالج.
              </div>
            ) : (
              <div className="space-y-4">
                {portalData.homework_plans.map((plan) => (
                  <div key={plan.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-sm font-black text-white">{plan.title}</h5>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          الوتيرة: <strong className="text-emerald-400">{plan.frequency_per_week} مرات أسبوعياً</strong> ({plan.session_duration_minutes} دقيقة)
                        </div>
                      </div>

                      <a
                        href={therapyHubApi.workbookPdfUrl(plan.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 space-x-reverse shadow-md shadow-emerald-500/20"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>تحميل الكراس A4</span>
                      </a>
                    </div>

                    {plan.parent_guidelines && (
                      <div className="text-[11px] text-slate-300 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 leading-relaxed">
                        💡 {plan.parent_guidelines}
                      </div>
                    )}

                    {plan.items && plan.items.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">قائمة الأنشطة:</span>
                        {plan.items.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                            <div className="font-bold text-white">#{idx + 1} {item.title_ar}</div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{item.instructions}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="border-t border-slate-800/80 py-3 text-center text-[10px] text-slate-500">
        بوابة المتابعة السريرية للأولياء &bull; {clinic.name || 'ClinicSaaS DZ'} &bull; حماية البيانات الطبية 🔒
      </footer>
    </div>
  );
}
