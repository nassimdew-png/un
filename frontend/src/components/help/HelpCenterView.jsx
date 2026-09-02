import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HelpCircle,
  Search,
  BookOpen,
  Sparkles,
  Users,
  Brain,
  FileText,
  CreditCard,
  Send,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Play,
  Printer,
  Smartphone,
  ShieldCheck,
  Zap,
  Mic,
  Monitor,
  Building,
  Target,
  QrCode,
  Download,
  WifiOff
} from 'lucide-react';

export default function HelpCenterView() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('quickstart');
  const [expandedArticles, setExpandedArticles] = useState(new Set(['qs_1', 'psy_1', 'ai_1']));
  const [expandedFaq, setExpandedFaq] = useState(new Set([0, 1]));

  const toggleArticle = (id) => {
    setExpandedArticles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFaq = (idx) => {
    setExpandedFaq((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const categories = [
    { id: 'quickstart', label: 'البداية السريعة وإعداد العيادة', icon: '🚀' },
    { id: 'patients_queue', label: 'إدارة المرضى وقاعة الانتظار', icon: '👥' },
    { id: 'psychometrics', label: 'بنك المقاييس الـ 30+ والحصائل', icon: '📊' },
    { id: 'ai_suite', label: 'المساعد الذكي وصياغة PEP و SOAP', icon: '🤖' },
    { id: 'portal_homework', label: 'بوابة الأولياء والواجبات المنزلية', icon: '🔗' },
    { id: 'billing_sub', label: 'الفوترة واشتراكات BaridiMob', icon: '💳' },
    { id: 'faq', label: 'الأسئلة الشائعة والأمان', icon: '❓' },
  ];

  const guideContent = {
    quickstart: [
      {
        id: 'qs_1',
        title: 'كيفية ضبط الهوية البصرية للعيادة والختم الرقمي (Branding & Letterhead)',
        summary: 'تخصيص الشعار، الترويسة الرسمية، معلومات الاتصال، والختم الطبي لتظهر تلقائياً في كافة وثائق PDF وحصائل التقييم.',
        steps: [
          'توجه إلى القائمة الجانبية واختر [الإعدادات ⚙️] ثم اضغط على تبويب [الهوية البصرية والترويسة].',
          'قم برفع شعار العيادة (Logo) بصيغة PNG أو JPG بدقة واضحة.',
          'أدخل اسم العيادة باللغتين العربية والفرنسية، التخصص، العنوان الكامل، الولاية، ورقم الهاتف.',
          'قم برفع صورة الختم الطبي والرمز التوقيعي للطبيب ليتم إدراجه في التقارير الطبية.',
          'اضغط على [حفظ التعديلات والمعاينة الحية] لمشاهدة الترويسة المطبوعة على ورقة A4.',
        ],
        tip: 'الترويسة والختم تظهر تلقائياً في جميع ملفات PDF (الحصائل السريرية، الوصفات، وصولات الدفع، وأوراق التمارين).',
      },
      {
        id: 'qs_2',
        title: 'إدارة الطاقم الطبي والأدوار (Staff Management & Permissions)',
        summary: 'إنشاء حسابات للأطباء المساعدين، الأرطوفونيين، السكرتارية، مع تحديد صلاحيات دقيقة لكل دور.',
        steps: [
          'توجه إلى [إدارة الطاقم] في لوحة التحكم.',
          'انقر على زر [➕ إضافة عضو جديد].',
          'حدد الدور: (أخصائي أرطوفونيا / أخصائي نفسي / سكرتارية واستقبال / أدمن العيادة).',
          'أدخل البريد الإلكتروني وكلمة المرور المؤقتة.',
          'يمكن للأدمن تقييد وصول السكرتارية إلى المواعيد والفوترة فقط دون الاطلاع على التفاصيل النفسية الدقيقة.',
        ],
        tip: 'حساب السكرتارية يتيح إدارة قاعة الانتظار وتسجيل وصول المرضى دون كشف الملاحظات السريرية السرية.',
      },
    ],

    patients_queue: [
      {
        id: 'pat_1',
        title: 'فتح ملف مريض جديد وشجرة العائلة الجينية (Clinical Genogram)',
        summary: 'تسجيل السوابق النمائية الكاملة، دراسة التاريخ العائلي والوراثي، وتوثيق السوابق التوليدية والحسية.',
        steps: [
          'من قسم [المرضى 👥]، انقر على زر [➕ ملف مريض جديد].',
          'املأ المعلومات الأساسية (الاسم، اللقب، تاريخ الميلاد، رقم الهاتف الجزائري مع المشغل، والعنوان).',
          'في تبويب السوابق النمائية، حدد سن المشي المستقل، سن ظهور الكلمة الأولى، والتعرض للشاشات.',
          'استخدم [شجرة العائلة السريرية (Genogram)] لتحديد صلة القرابة بين الوالدين، السوابق الوراثية لدى الإخوة والأعمام.',
          'حدد الملف الحسي (فرط الحساسية السمعية، البصرية، والانتقائية الغذائية).',
          'اضغط [حفظ الملف السريري].',
        ],
        tip: 'يمكنك استخدام ميزة [💡 Anamnesis Copilot] لاقتراح أسئلة سريرية استكشافية أثناء المقابلة الأولية.',
      },
      {
        id: 'pat_2',
        title: 'تشغيل قاعة الانتظار الذكية وشاشة العرض (Smart Waiting Room & TV Screen)',
        summary: 'تنظيم تدفق المرضى، الاستدعاء الصوتي الآلي، وعرض قائمة الأدوار على شاشة التلفاز في قاعة الاستقبال.',
        steps: [
          'لتشغيل شاشة قاعة الانتظار، افتح الرابط العام: /public/tv-queue على جهاز التلفاز أو الشاشة الخارجية.',
          'عند وصول المريض، تقوم السكرتارية أو المريض بتسجيل الوصول عبر [كشك الاستقبال Kiosk] برقم الهاتف.',
          'يظهر المريض فوراً في قائمة [Daily Clinical Pulse] مع توقيت الوصول.',
          'عند جاهزية الطبيب، ينقر على زر [📢 استدعاء المريض] ليصدر تنبيه صوتي وشارة بصرية بالاسم ورقم العيادة.',
          'ينقر الطبيب على [🚪 دخول الجلسة] لبدء التوثيق السريري وتوقيت مدة الجلسة.',
        ],
        tip: 'يدعم النظام العمل في وضع عدم الاتصال (Offline-First) ويحفظ تغييرات قاعة الانتظار محلياً في حال انقطاع الإنترنت.',
      },
    ],

    psychometrics: [
      {
        id: 'psy_1',
        title: 'تمرير وتفريغ الاختبارات والمقاييس المقننة الـ 30+',
        summary: 'دليل إجراء وتصحيح المقاييس الأرطوفونية والنفسية (WISC-V, ELO, ADOS-2, CARS, Vineland-II, NEPSY-II, BDI, إلخ).',
        steps: [
          'من ملف المريض، اختر تبويب [🧠 المقاييس والاختبارات] أو توجه إلى [بنك المقاييس السريرية].',
          'اختر المقياس المطلوب (مثال: ELO للغة الشفهية، أو CARS لتقييم التوحد).',
          'انقر على [بدء تمرير المقياس (Interactive Test Runner)].',
          'أدخل استجابات وبنود الفحص، ويقوم النظام آلياً بحساب الدرجات الخام والدرجات المعيارية (Notes Standard / Percentiles) ومقارنتها بالعينات المعيارية.',
          'يظهر منحنى التحليل النفسي-المتري فورياً مع مقارنة الأداء حسب الفئة العمرية.',
        ],
        tip: 'يمكنك تصدير تقرير كل مقياس كملف PDF مستقل يحتوي على الجداول والرسوم البيانية التوضيحية.',
      },
      {
        id: 'psy_2',
        title: 'توليد الحصيلة السريرية الشاملة المعتمدة (Master Bilan A4 PDF)',
        summary: 'دمج نتائج كافة المقاييس المنجزة في وثيقة طبية رسمية مقسمة ومعدة للطباعة والتوقيع الرقمي.',
        steps: [
          'من ملف المريض، اضغط على زر [📄 توليد الحصيلة السريرية الشاملة (Master Bilan)].',
          'حدد الاختبارات المنجزة المراد تضمينها في الحصيلة.',
          'اختر لغة الصياغة: [🇫🇷 Français Médical] أو [🇩🇿 العربية الأكاديمية].',
          'انقر على زر [✨ صياغة الحصيلة بالذكاء الاصطناعي] لإنشاء المحاور الخمسة تلقائياً.',
          'قم بمراجعة وتعديل محاور الحصيلة في المحرر المنقسم (Split Editor).',
          'اضغط على [تصدير وثيقة A4 الرسمية PDF] للطباعة المباشرة مع الترويسة والختم.',
        ],
        tip: 'الحصيلة تتضمن تلقائياً: السوابق، التحليل النفسي-المتري، نقاط القوة والضعف، التوجيه التشخيصي، والمشروع العلاجي.',
      },
    ],

    ai_suite: [
      {
        id: 'ai_1',
        title: 'مولد المشروع العلاجي الفردي في السياق الجزائري (PEP / IEP Engine)',
        summary: 'تحويل نتائج التقييم إلى أهداف علاجية إجرائية (SMART) مقسمة على 3 مراحل زمنية مع توليد أنشطة محلية.',
        steps: [
          'افتح ملف المريض واختر تبويب [🎯 خطة التكفل والأهداف (PEI / PEP)].',
          'انقر على [✨ توليد مشروع علاجي (PEP) ذكي].',
          'يقوم الذكاء الاصطناعي بإنشاء أهداف قريبة المدى (1-3 أشهر)، متوسطة المدى (3-6 أشهر)، ورؤية بعيدة المدى.',
          'بجانب كل هدف، اضغط على زر [🇩🇿 توليد تمرين جزائري] لإنشاء قصة اجتماعية أو بطاقات تدريب بأمثلة من البيئة الجزائرية (المدرسة، الساحة، حانوت الحومة).',
          'انقر على [📲 إرسال فوري لبوابة الولي] ليصل التمرين كواجب منزلي تفاعلي للأولياء.',
        ],
        tip: 'كافة القصص والبطاقات تستخدم أسماء مألوفة (أنيس، مريم، يوسف) ومواقف من الحياة اليومية الجزائرية.',
      },
      {
        id: 'ai_2',
        title: 'المساعد الصوتي للتدوين السريع SOAP أثناء الجلسة (Voice SOAP Scribe)',
        summary: 'تسجيل الملاحظات الشفهية بالمايكروفون (مزيج دراجة/فرنسية/مصطلحات طبية) وتحويلها إلى تقرير SOAP منظم.',
        steps: [
          'أثناء الجلسة السريرية، اضغط على زر [🎙️ تدوين صوتي SOAP] من أعلى ملف المريض أو من لوحة التحكم.',
          'اضغط على [ابدأ التسجيل الصوتي] وتحدث بحرية عن مجريات الجلسة وأداء الطفل.',
          'انقر على [إيقاف التسجيل] ثم [✨ تحويل الملاحظات إلى تقرير SOAP].',
          'يقوم النظام بتفريغ الصوت واستخراج الأقسام الأربعة: Subjective (الذاتي)، Objective (الموضوعي)، Assessment (التقييم)، و Plan (الخطة).',
          'راجع التقرير واضغط [💾 حفظ في الملف السريري] مع خيار إرسال تمرين الخطة كواجب لبوابة الولي.',
        ],
        tip: 'يدعم المساعد الصوتي تفريغ الكلام الطبي والمصطلحات الأرطوفونية والنفسية بدقة عالية.',
      },
    ],

    portal_homework: [
      {
        id: 'por_1',
        title: 'تفعيل بوابة الأولياء وإرسال رابط الوصول السحري (Magic Token Portal)',
        summary: 'تمكين الأولياء من متابعة تطور أطفالهم، تأكيد المواعيد، وتحميل التمارين المنزلية دون الحاجة لكلمة سر معقدة.',
        steps: [
          'من ملف المريض، اضغط على [🔗 توليد رابط بوابة الولي].',
          'ينشئ النظام رابطاً آمناً مشفراً برمز سحري (Magic Token) ورقم PIN بسيط مكون من 4 أرقام.',
          'انقر على [📲 إرسال عبر واتساب / SMS] لإرسال الرابط مباشرة لهاتف الولي.',
          'عند فتح الرابط، يدخل الولي رقم الهاتف ورمز PIN ليدخل إلى لوحته الخاصة.',
          'يمكن للولي تأكيد المواعيد القادمة، فتح التمارين والقصص الاجتماعية، وتعليم خانة [تم الإنجاز في البيت ✅].',
        ],
        tip: 'كل تحديث يجريه الولي في التمارين المنزلية ينعكس فورياً في لوحة تحكم الأخصائي بالعيادة.',
      },
    ],

    billing_sub: [
      {
        id: 'bil_1',
        title: 'إصدار وصولات الدفع وتجديد الاشتراك عبر BaridiMob',
        summary: 'إدارة الفواتير والاشتراكات السحابية، ورفع وصولات التحويل البنكي أو البريدي مباشرة من لوحة التحكم.',
        steps: [
          'لإصدار وصل دفع لمريض: من صفحة [الفوترة 💳]، اضغط على [➕ وصل دفع جديد] وحدد المريض ونوع الجلسة.',
          'لتجديد اشتراك العيادة: اضغط على شريط الاشتراك أعلى الشاشة أو توجه إلى [إدارة الاشتراك].',
          'اختر الباقة المناسبة وفترة الاشتراك (شهرية / سنوية).',
          'قم بالتحويل عبر BaridiMob أو CCP إلى الحساب الموضح في الاستمارة.',
          'ارفع صورة وصل التحويل واضغط [إرسال طلب التجديد].',
          'يقوم فريق الدعم بمراجعة الوصل وتفعيل الباقة فورياً مع إصدار الفاتورة الرسمية PDF.',
        ],
        tip: 'يمكنك إدخال كود الخصم الترويجي (Coupon) في استمارة التجديد للاستفادة من التخفيضات الخاصة.',
      },
    ],

    faq: [
      {
        q: 'هل تعمل المنصة في حال انقطاع شبكة الإنترنت (Offline Mode)؟',
        a: 'نعم! المنصة مبنية بتقنية PWA وتتضمن قاعدة بيانات محلية (IndexedDB). يمكنك تسجيل ملاحظات الجلسات وتحديث حالة قاعة الانتظار بدون إنترنت، وعند عودة الاتصال يقوم النظام بمزامنة كافة البيانات تلقائياً مع السحابة دون فقدان أي معلومة.',
      },
      {
        q: 'كيف يتم حماية وسرية البيانات الطبية للمرضى؟',
        a: 'كافة البيانات مشفرة ببروتوكول HTTPS/TLS، وتخضع لسياسة عزل صارمة بين العيادات (Multi-Tenant Isolation). كما يتم عمل نسخ احتياطي سحابي يومي مؤتمت ومحمي في سيرفرات معزولة مع إمكانية التدوير لـ 30 يوماً.',
      },
      {
        q: 'كيف يتم احتساب وتجديد رصيد الذكاء الاصطناعي السريري؟',
        a: 'تحصل كل عيادة على حصة شهرية مجانية من التوكنز (تبدأ من 100,000 رمز شهرياً). يتم استهلاك الرموز عند صياغة الحصائل أو التدوين الصوتي، ويتم تجديد الرصيد تلقائياً بداية كل شهر ميلادي أو عبر طلب زيادة الحصة من لوحة التحكم.',
      },
      {
        q: 'هل يمكن تثبيت المنصة كتطبيق مستقل على الهاتف أو الحاسوب؟',
        a: 'بالتأكيد! يمكنك النقر على زر [📲 تثبيت التطبيق] الموجود في الشريط العلوي للمتصفح، لتثبيت المنصة كتطبيق مكتبي أو هاتف خفيف وسريع مع أيقونة مستقلة على سطح المكتب.',
      },
    ],
  };

  return (
    <div className="space-y-6 text-right font-sans max-w-7xl mx-auto" dir="rtl">
      {/* Hero Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 space-x-reverse">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-teal-500/20">
              📚
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h2 className="text-xl font-black text-white">مركز المساعدة ودليل الاستخدام الشامل للمنصة</h2>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  PsyPro Guide v3.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                دليلك الإرشادي خطوة بخطوة للتحكم الكامل في كافة وظائف المنصة السريرية والأدوات الذكية
              </p>
            </div>
          </div>

          {/* Quick WhatsApp Support Button */}
          <a
            href="https://wa.me/213550000000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%A9%20%D9%81%D9%8A%20%D9%85%D9%86%D8%B5%D8%A9%20PsyPro"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center space-x-2 space-x-reverse self-start md:self-auto"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>💬 تواصل مع الدعم الفني عبر واتساب</span>
          </a>
        </div>

        {/* Live Search Bar */}
        <div className="relative pt-2">
          <input
            type="text"
            placeholder="ابحث عن ميزة، مقياس، أو سؤال (مثال: صياغة الحصيلة، ELO، ترويسة، قاعة الانتظار، BaridiMob)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3.5 pr-12 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-teal-500 shadow-inner"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-5.5" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto pb-2 text-xs font-bold">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setActiveCategory(cat.id);
              setSearchQuery('');
            }}
            className={`px-4 py-2.5 rounded-2xl border transition-all whitespace-nowrap flex items-center space-x-1.5 space-x-reverse ${
              activeCategory === cat.id && !searchQuery
                ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-slate-950 border-teal-400 font-black shadow-lg shadow-teal-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Guides Grid / Content View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Guides */}
        <div className="lg:col-span-2 space-y-4">
          {activeCategory !== 'faq' &&
            guideContent[activeCategory]?.map((article) => {
              const isExpanded = expandedArticles.has(article.id);

              return (
                <div
                  key={article.id}
                  className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 transition-all"
                >
                  <div
                    onClick={() => toggleArticle(article.id)}
                    className="flex items-start justify-between cursor-pointer group"
                  >
                    <div className="space-y-1 pr-1">
                      <h3 className="text-base font-black text-white group-hover:text-teal-300 transition">
                        {article.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{article.summary}</p>
                    </div>

                    <button className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-white shrink-0 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 pt-3 border-t border-slate-800/80 animate-in fade-in">
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-teal-400 flex items-center space-x-1.5 space-x-reverse">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>خطوات التطبيق العملية:</span>
                        </h4>
                        <ol className="space-y-2 text-xs text-slate-300 pr-4 list-decimal marker:text-teal-400 marker:font-bold">
                          {article.steps.map((step, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {article.tip && (
                        <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-start space-x-2 space-x-reverse">
                          <span className="text-base shrink-0">💡</span>
                          <span className="leading-relaxed">{article.tip}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {/* FAQ Accordions when FAQ Tab is active */}
          {activeCategory === 'faq' && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-base font-black text-white flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-3">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span>الأسئلة الشائعة والأمان والنسخ الاحتياطي</span>
              </h3>

              <div className="space-y-3">
                {guideContent.faq.map((faq, idx) => {
                  const isOpen = expandedFaq.has(idx);

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div
                        onClick={() => toggleFaq(idx)}
                        className="flex items-center justify-between cursor-pointer font-bold text-xs text-white hover:text-amber-300 transition"
                      >
                        <span className="leading-relaxed">{faq.q}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                      </div>

                      {isOpen && (
                        <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-900">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Feature Cards & Shortcuts */}
        <div className="space-y-4">
          {/* Card: Offline PWA Guide */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 space-x-reverse text-emerald-400 font-black text-xs">
              <WifiOff className="w-4 h-4" />
              <span>العمل بدون إنترنت (PWA Offline)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              يمكنك تشغيل المنصة في حال انقطاع الشبكة بدون أي توقف. كافة الملاحظات والتقييمات يتم تخزينها بأمان محلياً في جهازك وتتم المزامنة تلقائياً بمجرد عودة الاتصال.
            </p>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-bold flex items-center space-x-2 space-x-reverse">
              <span>📲 تثبيت التطبيق:</span>
              <span className="text-emerald-400">انقر على زر الشريط العلوي</span>
            </div>
          </div>

          {/* Card: Cloud Backup & Security */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 space-x-reverse text-indigo-400 font-black text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>النسخ الاحتياطي السحابي اليومي (S3/R2)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              يتم حفظ نسخة احتياطية مشفرة يومياً عند الساعة 02:00 صباحاً في سحابة Cloudflare R2 المعزولة، مع الاحتفاظ بالأرشيف لمدة 30 يوماً متتالياً.
            </p>
          </div>

          {/* Card: Video Simulation & Tips */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 space-x-reverse text-indigo-300 font-black text-xs">
              <Sparkles className="w-4 h-4" />
              <span>نصيحة سريرية متقدمة</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              استخدم زر <strong>[🎙️ تدوين صوتي SOAP]</strong> فور انتهاء الجلسة مباشرة؛ فالتسجيل الصوتي لمدة 45 ثانية يفرغ لك تقريراً طبياً منسقاً يوفر عليك أكثر من 15 دقيقة من الكتابة اليدوية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
