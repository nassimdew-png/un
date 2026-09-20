import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Award,
  ShieldCheck,
  Upload,
  ArrowRight,
  FileText,
  School,
  ExternalLink,
  Lock,
  Mail,
  Phone,
  User,
  Brain,
  MessageSquare,
  Activity,
  Calendar,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { studentOfferApi } from '../../api';

export default function StudentOfferLandingView() {
  const [offerConfig, setOfferConfig] = useState(null);
  const [universitiesList, setUniversitiesList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [universityName, setUniversityName] = useState('');
  const [customUniversity, setCustomUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [specialty, setSpecialty] = useState('orthophonie'); // 'orthophonie' | 'psychologie'
  const [degreeLevel, setDegreeLevel] = useState('master_m2'); // 'licence_l3' | 'master_m2'
  const [clinicName, setClinicName] = useState('');
  const [honorPledge, setHonorPledge] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Success Result
  const [resultData, setResultData] = useState(null);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState(new Set([0]));

  useEffect(() => {
    const fetchOfferData = async () => {
      try {
        setLoading(true);
        const res = await studentOfferApi.getPublicOffer();
        if (res.success) {
          setOfferConfig(res.config);
          setUniversitiesList(res.universities || []);
          setStats(res.stats || {});
          if (res.universities && res.universities.length > 0) {
            setUniversityName(res.universities[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load student offer:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferData();
  }, []);

  // Detect Algerian Phone Operator
  const getPhoneOperatorBadge = () => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('05') || clean.startsWith('2135') || clean.startsWith('+2135')) {
      return { label: 'Ooredoo 🟡', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    if (clean.startsWith('06') || clean.startsWith('2136') || clean.startsWith('+2136')) {
      return { label: 'Mobilis 🟢', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
    if (clean.startsWith('07') || clean.startsWith('2137') || clean.startsWith('+2137')) {
      return { label: 'Djezzy 🔴', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!honorPledge) {
      setError('يرجى تأكيد التصريح الشرفي للأمانة الأكاديمية وحماية البيانات لإتمام التسجيل.');
      return;
    }
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('student_name', studentName.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      if (password) formData.append('password', password);
      
      const selectedUni = universityName === 'أخرى (اكتب اسم الجامعة يدوياً)' 
        ? (customUniversity || 'جامعة جزائرية') 
        : universityName;
      formData.append('university_name', selectedUni);
      formData.append('faculty', faculty || 'كلية العلوم الإنسانية والاجتماعية');
      formData.append('specialty', specialty);
      formData.append('degree_level', degreeLevel);
      if (clinicName) formData.append('clinic_name', clinicName);
      formData.append('honor_pledge', honorPledge ? '1' : '0');

      const res = await studentOfferApi.submitApplication(formData);
      if (res.success) {
        setResultData(res);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res.message || 'فشل تسجيل الطلب الأكاديمي. يرجى التحقق من البيانات.');
      }
    } catch (err) {
      setError(err.message || 'تعذر معالجة الطلب الأكاديمي حالياً.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (idx) => {
    setExpandedFaq((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const operatorBadge = getPhoneOperatorBadge();
  const durationMonths = offerConfig?.duration_months || 9;

  const faqs = [
    {
      q: 'هل العرض مجاني تماماً وبدون أي رسوم خفية؟',
      a: `نعم، 100% مجاناً لمدة ${durationMonths} أشهر كاملة لجميع طلبة علم النفس والأرطوفونيا (L3 و M2) في الجامعات الجزائرية، دون الحاجة لأي بطاقة دفع أو التزام مالي.`
    },
    {
      q: 'هل يُطلب مني رفع بطاقة الطالب أو وثائق هوية شخصية؟',
      a: 'لا، حفاظاً على خصوصيتكم وامتثالاً لقوانين حماية البيانات الشخصية، لا نطلب رفع أي بطاقة هوية أو شهادة تسجيل. يكفي ملء بيانات تخصصكم الجامعي والمصادقة على التصريح الشرفي للأمانة الأكاديمية.'
    },
    {
      q: 'هل يمكنني استخدام المنصة في التربص الميداني ومذكرة التخرج؟',
      a: 'نعم بالتأكيد! صُممت هذه المنحة خصيصاً لدعمكم في متابعة حالات التربص الاستشفائي، تمرير الروائز الـ 18 المقننة (مثل WISC و ELO و BDI)، وتوليد التقارير السريرية الرسمية Master Bilan بصيغة PDF لدعم المذكرة.'
    },
    {
      q: 'ما هي ميزة قسيمة تخفيض التخرج (70%)؟',
      a: 'كل طالب يستفيد من المنحة يحصل تلقائياً على رمز تخفيض حصري بنسبة 70% صالح للسنة الأولى من اشتراكه، لدعمكم ومرافقتكم عند افتتاح عيادتكم المستقلة وبدء نشاطكم المهني بعد التخرج.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-slate-950" dir="rtl">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-teal-600 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white">منحة PsyPro الأكاديمية 2026</h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {durationMonths} أشهر مجاناً 🇩🇿
                </span>
              </div>
              <p className="text-[11px] text-slate-400">لطلبة علم النفس والأرطوفونيا (سنة ثالثة ليسانس L3 وماستر 2)</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <a
              href="/help"
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800/80 transition"
            >
              دليل الاستخدام
            </a>
            <a
              href="/login"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition"
            >
              تسجيل الدخول
            </a>
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="py-12 sm:py-18 px-4 bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 border-b border-slate-800 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{offerConfig?.marketing_badge || `🎓 عرض ومنحة الطلبة 2026 - ${durationMonths} أشهر مجاناً 🇩🇿`}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {offerConfig?.marketing_title || `منحة التميز السريري: ${durationMonths} أشهر مجاناً لطلبة علم النفس والأرطوفونيا`}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {offerConfig?.marketing_subtitle || `فضاء عيادي تدريبي متكامل مخصص لطلبة السنة الثالثة ليسانس (L3) وسنة ثانية ماستر (M2) للتدريب الميداني وإنجاز مذكرات التخرج على بيئة طبية احترافية 100%.`}
          </p>

          {/* Quick Counter Banner */}
          {stats?.spots_remaining !== undefined && (
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs shadow-lg">
              <span className="flex items-center gap-1.5 text-emerald-400 font-black font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>{stats.total_registered || 0} طالب مسجل</span>
              </span>
              <span className="w-1 h-3 bg-slate-700 rounded-full" />
              <span className="text-amber-300 font-bold">
                متبقي {stats.spots_remaining} مقعداً متاحاً لهذه الدفعة ⏳
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Target Audience Cards */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Orthophonie */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-teal-500/30 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center justify-center text-2xl shrink-0">
                🗣️
              </div>
              <div>
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider">التخصص الأول</span>
                <h3 className="text-base font-black text-white">طلبة الأرطوفونيا وعلاج اضطرابات النطق</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              مخصص لطلبة **السنة الثالثة ليسانس (L3)** و**السنة الثانية ماستر (M2)**:
            </p>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400 shrink-0" />
                <span>مصفوفة الفحص الفونولوجي ومخارج الحروف الأكوستيكية</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400 shrink-0" />
                <span>تمرير رائز ELO، رائز Alouette، ومقاييس الطلاقة اللفظية</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400 shrink-0" />
                <span>بروتوكولات علاج التأتأة واضطرابات البلع والتنفس الصوتي</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-400 shrink-0" />
                <span>توليد الحصيلة الأرطوفونية الشاملة Bilan Orthophonique A4</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Psychology */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0">
                🧠
              </div>
              <div>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">التخصص الثاني</span>
                <h3 className="text-base font-black text-white">طلبة علم النفس العيادي والصحة النفسية</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              مخصص لطلبة **السنة الثالثة ليسانس (L3)** و**السنة الثانية ماستر (M2)**:
            </p>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>بنك المقاييس الـ 18 المقننة (WISC-V, BDI-II, STAI, BECS, CARS)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>سجلات التوثيق السريري المنهجي SOAP وسجلات إعادة الهيكلة CBT</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>إدارة حالات التربص الميداني الاستشفائي وملفات المرضى</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>تصدير الحصيلة النفسية المعيارية الرسمية Master Bilan A4</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Main Container: Form or Success */}
      <main className="max-w-3xl mx-auto px-4 pb-16 space-y-10">
        {resultData ? (
          /* SUCCESS SCREEN */
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-6 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-4xl shadow-xl animate-bounce">
              🎓
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">
                {resultData.is_auto_approved ? 'تهانينا! تم تفعيل حسابك الأكاديمي بنجاح 🎉' : 'تم استلام ملف تسجيلك بنجاح 📋'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                {resultData.is_auto_approved
                  ? `تم منحك فضاء سريري تدريبي مجاني بالكامل لمدة ${durationMonths} أشهر مع وصول شامل لكافة المقاييس والحصائل، بالإضافة لقسيمة تخفيض 70% للسنة الأولى عند افتتاح عيادتك المستقلة.`
                  : 'جاري مراجعة طلبك الأكاديمي من فريق الإشراف وسيتم تفعيل حسابك وإشعارك بالبريد الإلكتروني.'}
              </p>
            </div>

            {resultData.is_auto_approved && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 max-w-md mx-auto text-right text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400 font-bold">رابط الفضاء الأكاديمي:</span>
                  <a href={resultData.sandbox_url} target="_blank" rel="noopener noreferrer" className="text-teal-400 font-mono hover:underline flex items-center gap-1 font-bold">
                    <span>{resultData.sandbox_url}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">البريد الإلكتروني:</span>
                  <span className="font-mono text-white font-bold">{resultData.login_credentials?.email}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">مدة الصلاحية:</span>
                  <span className="text-emerald-400 font-bold">{durationMonths} أشهر كاملة (حتى {resultData.expires_at})</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-400">قسيمة تخفيض التخرج (70% للسنة الأولى):</span>
                  <span className="font-mono text-amber-400 font-black bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {resultData.discount_code}
                  </span>
                </div>
              </div>
            )}

            {resultData.is_auto_approved && (
              <div className="pt-2">
                <a
                  href={resultData.sandbox_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/20 transition hover:scale-105"
                >
                  <span>الدخول المباشر إلى فضاء التدريب الأكاديمي</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        ) : (
          /* REGISTRATION FORM */
          <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-1">
                <School className="w-4 h-4" />
                <span>استمارة الاستفادة من منحة الطلبة (L3 & M2)</span>
              </div>
              <h3 className="text-xl font-black text-white">سجّل الآن واحصل على 9 أشهر مجاناً 🎓</h3>
              <p className="text-xs text-slate-400 mt-1">
                املأ البيانات الجامعية التالية لتأكيد صفتك كطالب واستلام فضاء العمل السريري التدريبي.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Specialty Selector Cards */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">التخصص الجامعي:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSpecialty('orthophonie')}
                    className={`p-3.5 rounded-2xl border text-right transition flex items-center gap-3 ${
                      specialty === 'orthophonie'
                        ? 'bg-teal-500/20 border-teal-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">🗣️</span>
                    <div>
                      <div className="font-bold text-xs">أرطوفونيا وتخاطب</div>
                      <div className="text-[10px] text-slate-400">علاج اضطرابات اللغة والنطق والبلع</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpecialty('psychologie')}
                    className={`p-3.5 rounded-2xl border text-right transition flex items-center gap-3 ${
                      specialty === 'psychologie'
                        ? 'bg-purple-500/20 border-purple-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">🧠</span>
                    <div>
                      <div className="font-bold text-xs">علم النفس العيادي</div>
                      <div className="text-[10px] text-slate-400">الصحة النفسية، CBT، والقياس النفسي</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Academic Level Selector Cards */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">السنة والمستوى الدراسي المؤهل للمنحة:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDegreeLevel('licence_l3')}
                    className={`p-3.5 rounded-2xl border text-right transition flex items-center gap-3 ${
                      degreeLevel === 'licence_l3'
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">🎓</span>
                    <div>
                      <div className="font-bold text-xs">سنة ثالثة ليسانس (Licence 3)</div>
                      <div className="text-[10px] text-slate-400">سنة التخرج والتربص الميداني الأولي</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDegreeLevel('master_m2')}
                    className={`p-3.5 rounded-2xl border text-right transition flex items-center gap-3 ${
                      degreeLevel === 'master_m2'
                        ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">🏆</span>
                    <div>
                      <div className="font-bold text-xs">سنة ثانية ماستر (Master 2)</div>
                      <div className="text-[10px] text-slate-400">إنجاز مذكرة التخرج والتربص الاستشفائي</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Student Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>الاسم واللقب:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="مثال: أمينة بوعلام"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>البريد الإلكتروني:</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amina.etudiant@univ-alger.dz"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Phone & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>رقم الهاتف (الجزائر):</span>
                    </label>
                    {operatorBadge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${operatorBadge.color}`}>
                        {operatorBadge.label}
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0550 12 34 56"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>كلمة المرور الخاصة بك:</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="اختر كلمة سر لا تقل عن 6 أحرف"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500 pr-3 pl-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? 'إخفاء' : 'إظهار'}
                    </button>
                  </div>
                </div>
              </div>

              {/* University Selection */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-400" />
                  <span>الجامعة أو المعهد الجزائري:</span>
                </label>
                <select
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500"
                >
                  {universitiesList.map((uni, idx) => (
                    <option key={idx} value={uni}>
                      {uni}
                    </option>
                  ))}
                  <option value="أخرى (اكتب اسم الجامعة يدوياً)">🏛️ جامعة أو معهد آخر...</option>
                </select>

                {universityName === 'أخرى (اكتب اسم الجامعة يدوياً)' && (
                  <input
                    type="text"
                    required
                    value={customUniversity}
                    onChange={(e) => setCustomUniversity(e.target.value)}
                    placeholder="اكتب اسم جامعتك أو كليتك هنا..."
                    className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>

              {/* Academic Honor Pledge & Privacy Protection Declaration */}
              <div className="pt-2 border-t border-slate-800">
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={honorPledge}
                      onChange={(e) => setHonorPledge(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>تصريح شرفي بالأمانة الأكاديمية وحماية الخصوصية:</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        أصرح بشرفي أنني طالب مقيد بانتظام في السنة المحددة (سنة 3 ليسانس أو سنة 2 ماستر) بتخصص علم النفس أو الأرطوفونيا، وأتعهد باستعمال المنصة حصراً لأغراض التدريب والبحث العلمي وإنجاز مذكرة التخرج وفق أخلاقيات المهنة السريرية، دون الحاجة لرفع وثائق الهوية الشخصية طبقاً للضوابط القانونية لحماية المعطيات ذات الطابع الشخصي.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-teal-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-sm shadow-xl shadow-indigo-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <GraduationCap className="w-5 h-5 text-slate-950" />
                  <span>
                    {submitting
                      ? 'جاري التحقق وإنشاء فضاء التدريب السريري...'
                      : `تأكيد التسجيل وتفعيل الـ ${durationMonths} أشهر مجاناً 🚀`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FAQs Accordion Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="text-center space-y-1 pb-2">
            <h3 className="text-base font-black text-white">الأسئلة الشائعة حول منحة وعرض الطلبة</h3>
            <p className="text-xs text-slate-400">إجابات واضحة لكافة استفساراتكم الأكاديمية والسريرية</p>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq.has(idx);
              return (
                <div key={idx} className="border border-slate-800/80 rounded-2xl bg-slate-950/70 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-4 py-3 text-right flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-3.5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/50 pt-2 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
