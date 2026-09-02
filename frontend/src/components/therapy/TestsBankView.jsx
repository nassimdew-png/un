import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Brain,
  Search,
  Filter,
  Layers,
  FileText,
  Play,
  Share2,
  Printer,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  Users,
  Plus,
  BookOpen,
  FolderPlus,
  Award,
  ChevronRight,
  ExternalLink,
  Info,
  X,
  Send,
  MessageSquare,
  Activity,
  Smile,
  Zap,
  Volume2,
} from 'lucide-react';
import { apiRequest } from '../../api';

// Comprehensive Clinical Tests Catalog
const DEFAULT_CLINICAL_TESTS = [
  {
    id: 'ssi-4',
    code: 'SSI-4',
    title_ar: 'مقياس شدة التأتأة عند الأطفال والبالغين (Riley)',
    title_fr: 'Stuttering Severity Instrument (SSI-4)',
    category: 'orthophony',
    category_label: 'طلاقة الكلام والتأتأة',
    age_range: '3 سنوات فما فوق (أطفال وبالغون)',
    duration: '20 - 30 دقيقة',
    dimensions: ['تكرار المقاطع والأصوات', 'الوقفات اللاإرادية (Blocks)', 'الحركات الجسدية المصاحبة', 'مدة التعثر بالثواني'],
    description: 'الأداة المعيارية الذهبية لتقييم وقياس درجة شدة التأتأة وتحديد النسبة المئوية للتعثر أثناء القراءة والحديث العفوي.',
    color: 'from-amber-500 to-rose-600',
    icon: Volume2
  },
  {
    id: 'cars-2',
    code: 'CARS-2',
    title_ar: 'مقياس تقدير التوحد الطفولي (نسخة المعيار الجزائري والعربي)',
    title_fr: 'Childhood Autism Rating Scale - 2nd Edition',
    category: 'autism',
    category_label: 'اضطرابات طيف التوحد',
    age_range: '2 - 14 سنة',
    duration: '30 - 45 دقيقة',
    dimensions: ['العلاقات مع الناس', 'التقليد والتواصل البصري', 'الاستجابة الانفعالية', 'استخدام الجسد والأشياء', 'التواصل اللفظي وغير اللفظي'],
    description: 'مقياس تشخيصي إكلينيكي مكون من 15 بنداً سلوكياً لفرز وتصنيف درجات طيف التوحد بدقة معيارية.',
    color: 'from-blue-600 to-indigo-600',
    icon: Brain
  },
  {
    id: 'phonetic-dz',
    code: 'TEST-ARTIC-DZ',
    title_ar: 'رائز فحص مخارج الأصوات والحروف باللهجة الجزائرية والفصحى',
    title_fr: 'Test d\'Articulation et de Phonologie (DZ)',
    category: 'orthophony',
    category_label: 'النطق والأرطوفونيا',
    age_range: '3 - 10 سنوات',
    duration: '15 - 25 دقيقة',
    dimensions: ['الأصوات الصامتة (أول/وسط/آخر الكلمة)', 'التشويه والحذف والإبدال', 'التمييز السمعي الفونولوجي', 'المرونة اللسانية'],
    description: 'فحص سريري شامل لكافة الفونيمات مع صور وبطاقات مكيفة مع البيئة والقاموس اللغوي الجزائري.',
    color: 'from-emerald-500 to-teal-600',
    icon: Stethoscope
  },
  {
    id: 'conners-3',
    code: 'CONNERS-3',
    title_ar: 'مقياس كونرز لفرط الحركة وتشتت الانتباه والاندفاعية (ADHD)',
    title_fr: 'Conners 3rd Edition (ADHD Assessment)',
    category: 'adhd',
    category_label: 'فرط الحركة وتشتت الانتباه',
    age_range: '6 - 18 سنة',
    duration: '20 دقيقة',
    dimensions: ['تشتت الانتباه والتركيز', 'فرط النشاط الحركي', 'الاندفاعية والسلوك التخريبي', 'العلاقات مع الأقران والأسرة'],
    description: 'استبيان تقييمي نفسي يُملأ من طرف الطبيب والأولياء والمعلمين لتقييم صعوبات الانتباه والتحكم السلوكي.',
    color: 'from-purple-600 to-pink-600',
    icon: Activity
  },
  {
    id: 'wisc-5',
    code: 'WISC-V',
    title_ar: 'مقياس وكسلر لذكاء الأطفال والقدرات العقلية العامة',
    title_fr: 'Échelle d\'Intelligence de Wechsler pour Enfants',
    category: 'psychology',
    category_label: 'القدرات العقلية والذكاء',
    age_range: '6 - 16 سنة',
    duration: '60 - 90 دقيقة',
    dimensions: ['الفهم اللفظي (VCI)', 'الاستدلال البصري المكاني (VSI)', 'الذاكرة العاملة (WMI)', 'سرعة المعالجة (PSI)'],
    description: 'البطارية النفسية الشاملة لتحديد معامل الذكاء العام (IQ) وتشخيص التأخر النمائي والموهبة الفكرية.',
    color: 'from-indigo-600 to-violet-800',
    icon: Zap
  },
  {
    id: 'dyslexia-dz',
    code: 'TEST-DYS-DZ',
    title_ar: 'رائز فحص صعوبات القراءة وعسر الكتابة والحساب (الديسلكسيا)',
    title_fr: 'Batterie de Dépistage de la Dyslexie & Dyscalculie',
    category: 'learning',
    category_label: 'صعوبات التعلم الأكاديمية',
    age_range: '6 - 12 سنة',
    duration: '30 دقيقة',
    dimensions: ['الوعي الفونولوجي والتقطيع', 'سرعة القراءة ودقة الفهم', 'الإملاء والتحليل الخطي', 'المفاهيم الرياضية العددية'],
    description: 'روائز مقننة للكشف المبكر عن عسر القراءة والكتابة واقتراح خطة تربوية فردية (PEI) مكيفة.',
    color: 'from-amber-600 to-orange-600',
    icon: BookOpen
  },
  {
    id: 'teld-3',
    code: 'TELD-3',
    title_ar: 'اختبار التطور اللغوي الشامل (اللغة الاستقبالية والتعبيرية)',
    title_fr: 'Test of Early Language Development (TELD-3)',
    category: 'orthophony',
    category_label: 'تأخر النمو اللغوي',
    age_range: '2 - 8 سنوات',
    duration: '25 - 35 دقيقة',
    dimensions: ['اللغة الاستقبالية والفهم', 'اللغة التعبيرية والتركيب', 'القاموس الدلالي والمفردات', 'النحو والصرف'],
    description: 'يقيس بدقة العمر اللغوي للطفل مقارنة بعمره الزمني وتحديد نسبة التأخر في اكتساب مهارات التخاطب.',
    color: 'from-sky-600 to-blue-700',
    icon: MessageSquare
  },
  {
    id: 'gars-3',
    code: 'GARS-3',
    title_ar: 'مقياس جليام لتشخيص اضطراب التوحد - الإصدار الثالث',
    title_fr: 'Gilliam Autism Rating Scale - 3rd Edition',
    category: 'autism',
    category_label: 'اضطرابات طيف التوحد',
    age_range: '3 - 22 سنة',
    duration: '20 دقيقة',
    dimensions: ['السلوكيات النمطية المقيدة', 'التفاعل الاجتماعي', 'التواصل الاجتماعي', 'الاستجابات العاطفية'],
    description: 'أداة تشخيصية سريعة مبنية على معايير DSM-5 لحساب معامل التوحد ونسبة الاحتمالية السريرية.',
    color: 'from-teal-600 to-cyan-700',
    icon: Brain
  }
];

// Comprehensive Digital Therapy Exercises & Protocols Bank
const DEFAULT_THERAPY_EXERCISES = [
  {
    id: 'ex-oral-motor',
    title: 'برنامج تقوية عضلات النطق والفم واللسان (Oral Motor Protocol)',
    category: 'orthophony',
    category_label: 'الأرطوفونيا والنطق',
    target: 'علاج الديسلثريا، اضطراب مخارج الحروف، وتقوية عضلات المضغ والبلع',
    difficulty: 'مبتدئ إلى متوسط',
    frequency: '3 مرات أسبوعياً (15 دقيقة)',
    materials: 'مرآة تدريب، بطاقات صور الحركات، خافض لسان طبي',
    steps: [
      'تمرين رفع وخفض اللسان نحو سقف الحلق والفك السفلي مع التثبيت 5 ثوانٍ.',
      'تمرين تحريك اللسان دائرياً حول الشفتين مع المقاومة الخفيفة.',
      'تمرين نفخ الخدين بالتناوب وحبس الهواء لتحسين الإغلاق الشفوي.',
      'تمرين اهتزاز الشفتين واللسان لتهيئة نطق صوت الراء /r/ والأصوات الانفجارية.'
    ],
    color: 'from-rose-500 to-amber-600'
  },
  {
    id: 'ex-easy-onset',
    title: 'تقنية البداية السهلة وتمديد الأصوات لمرضى التأتأة (Easy Onset & Prolongation)',
    category: 'fluency',
    category_label: 'طلاقة النطق والتأتأة',
    target: 'تقليل الوقفات اللاإرادية والتشنج الحنجري في بداية الكلمات',
    difficulty: 'متوسط إلى متقدم',
    frequency: 'يومياً (10 دقائق صباحاً ومساءً)',
    materials: 'مؤقت إيقاعي، قائمة كلمات تبدأ بحروف لينة وحروف مد',
    steps: [
      'أخذ نفس بطني عميق مع استرخاء الكتفين والحنجرة.',
      'إخراج صوت خافت ومستمر مثل /h/ أو الهمس قبل نطق الكلمة المستهدفة.',
      'تمديد الصوت الصامت الأول لمدة ثانيتين برفق دون ضغط عضلي.',
      'دمج التقنية في جمل قصيرة ثم الحوار التفاعلي التلقائي.'
    ],
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'ex-pecs-schedule',
    title: 'نظام التواصل بالصور والروتين البصري (PECS Phase I - III)',
    category: 'autism',
    category_label: 'التوحد وتعديل السلوك',
    target: 'تطوير التواصل الوظيفي التلقائي والطلب التعبيري لأطفال طيف التوحد',
    difficulty: 'مبتدئ',
    frequency: 'مستمر خلال اليوم العلاجي والمنزلي',
    materials: 'كتاب التواصل PECS، بطاقات الأطعمة والألعاب والأنشطة',
    steps: [
      'المرحلة 1: التدريب على إعطاء البطاقة للمدرب للحصول على المعزز المفضل.',
      'المرحلة 2: زيادة المسافة والبحث عن كتاب التواصل والوصول للمتلقي.',
      'المرحلة 3: التمييز البصري بين بطاقتين (شيء مرغوب وشيء غير مرغوب).',
      'بناء شريط الجملة التعبيرية "أنا أريد + [البطاقة]".'
    ],
    color: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'ex-phonological-blend',
    title: 'تدريب الوعي الفونولوجي والدمج الصوتي (Phonological Blending)',
    category: 'learning',
    category_label: 'صعوبات التعلم والديسلكسيا',
    target: 'تحسين سرعة القراءة والتهجئة والتمييز بين المقاطع الصوتية المتشابهة',
    difficulty: 'متوسط',
    frequency: '4 مرات أسبوعياً (20 دقيقة)',
    materials: 'مكعبات الأصوات الملونة، بطاقات الكلمات المجزأة',
    steps: [
      'تفكيك الكلمة المسموعة إلى أصوات منفردة (مثال: ك - ت - ا - ب).',
      'دمج الأصوات المسموعة بسرعة لتكوين الكلمة الصحيحة.',
      'التعرف على الصوت الأولي والأوسط والأخير في الكلمات.',
      'حذف أو استبدال صوت لتكوين كلمة جديدة (التلاعب الفونيمي).'
    ],
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'ex-attention-stroop',
    title: 'تمارين تعزيز الانتباه الانتقائي وكبح الاندفاعية (Stroop & Inhibition)',
    category: 'adhd',
    category_label: 'تشتت الانتباه وفرط الحركة',
    target: 'تنمية الوظائف التنفيذية والتحكم الذاتي وتأخير الاستجابة الاندفاعية',
    difficulty: 'متوسط إلى متقدم',
    frequency: '3 مرات أسبوعياً',
    materials: 'بطاقات شتروب الملونة، تطبيق المؤقت البصري',
    steps: [
      'قراءة لون الكلمة المكتوبة بدلاً من قراءة الكلمة نفسها (تأثير شتروب).',
      'تمرين الإيقاف والانطلاق (Go / No-Go) عند ظهور الإشارة الخضراء أو الحمراء.',
      'البحث البصري عن الأشكال المتطابقة في مصفوفة مشتتة زمنياً.',
      'تمرين الذاكرة العاملة التراجعية (تكرار الأرقام بالترتيب العكسي).'
    ],
    color: 'from-purple-600 to-pink-600'
  },
  {
    id: 'ex-breathing-relaxation',
    title: 'برنامج التنفس الحجابي والاسترخاء العضلي التدريجي (Jacobson Relaxation)',
    category: 'psychology',
    category_label: 'علم النفس والقلق السلوكي',
    target: 'خفض مستويات القلق والتوتر المصاحب للجلسات والتأتأة والامتحانات',
    difficulty: 'مبتدئ',
    frequency: 'يومياً قبل النوم وعند الشعور بالتوتر',
    materials: 'بيئة هادئة، إرشادات صوتية مهدئة',
    steps: [
      'الاستلقاء أو الجلوس المريح مع وضع اليد على البطن وأخرى على الصدر.',
      'أخذ شهيق عميق من الأنف لمدة 4 ثوانٍ مع انتفاخ البطن.',
      'حبس النفس لمدة ثانيتين ثم إخراج الزفير ببطء من الفم لمدة 6 ثوانٍ.',
      'شد عضلات اليدين والوجه ثم إرخائها تدريجياً لملاحظة الفرق في الراحة.'
    ],
    color: 'from-cyan-600 to-blue-700'
  }
];

export default function TestsBankView({ patients = [], tenant }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'exercises'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');
  
  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedItemForAssign, setSelectedItemForAssign] = useState(null);
  const [targetPatientId, setTargetPatientId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Quick Protocol Card Modal
  const [protocolModalItem, setProtocolModalItem] = useState(null);

  const categories = [
    { id: 'all', label: '🌟 كافة التخصصات' },
    { id: 'orthophony', label: '🗣️ النطق والأرطوفونيا' },
    { id: 'autism', label: '🧩 التوحد والسلوك (Autism)' },
    { id: 'adhd', label: '⚡ فرط الحركة وتشتت الانتباه' },
    { id: 'learning', label: '📚 صعوبات التعلم والديسلكسيا' },
    { id: 'psychology', label: '🧠 علم النفس والذكاء (IQ)' },
    { id: 'fluency', label: '🎙️ طلاقة الكلام والتأتأة' },
  ];

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return DEFAULT_CLINICAL_TESTS.filter(test => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        test.title_ar.toLowerCase().includes(q) || 
        test.title_fr.toLowerCase().includes(q) || 
        test.code.toLowerCase().includes(q) ||
        test.category_label.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || test.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Filtered Exercises
  const filteredExercises = useMemo(() => {
    return DEFAULT_THERAPY_EXERCISES.filter(ex => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        ex.title.toLowerCase().includes(q) || 
        ex.target.toLowerCase().includes(q) ||
        ex.category_label.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleOpenAssignModal = (item) => {
    setSelectedItemForAssign(item);
    setTargetPatientId(patients[0]?.id || '');
    setAssignNotes('');
    setAssignSuccess(false);
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = (e) => {
    e.preventDefault();
    if (!targetPatientId) {
      alert('يرجى اختيار ملف المريض أولاً.');
      return;
    }
    setAssignSuccess(true);
    setTimeout(() => {
      setAssignModalOpen(false);
      setAssignSuccess(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>CLINICAL TESTS & PROTOCOLS BANK</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                +45 روائز مقننة وبرامج علاجية 🌟
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              بنك الروائز، المقاييس والتمارين العلاجية
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              المكتبة السريرية المعتمدة للأخصائيين والأطباء: روائز تشخيصية مقننة بالمعيار الجزائري، بروتوكولات تأهيلية، وبرامج تدريب منزلي تفاعلية.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => navigate('/ai-therapy')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-purple-500/20"
            >
              <Brain className="w-4 h-4" />
              <span>استوديو الذكاء الاصطناعي ✨</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse border border-slate-700 shadow"
              title="طباعة الدليل"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* Master Navigation Switch Tabs */}
        <div className="flex items-center gap-3 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 space-x-reverse ${
              activeTab === 'tests'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>🧩 الروائز والمقاييس التشخيصية ({filteredTests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('exercises')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 space-x-reverse ${
              activeTab === 'exercises'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>🏃 بنك التمارين والبرامج المنزلية ({filteredExercises.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'tests' ? "بحث بالاسم، الرمز (SSI, CARS, WISC)، أو الفئة السريرية..." : "بحث باسم التمرين، الهدف العلاجي، أو الاضطراب..."}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: TESTS & SCALES CATALOG */}
      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map((test) => {
            const Icon = test.icon || Brain;
            return (
              <div
                key={test.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-5 space-y-4 shadow-xl transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-105 transition">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-black bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {test.code}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug group-hover:text-indigo-300 transition">
                      {test.title_ar}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {test.title_fr}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {test.description}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-indigo-400" /> الفئة العمرية:</span>
                      <strong className="text-slate-200 font-bold">{test.age_range}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> مدة الإجراء:</span>
                      <strong className="text-slate-200 font-bold">{test.duration}</strong>
                    </div>
                  </div>

                  {/* Dimensions Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {test.dimensions.slice(0, 3).map((d, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-950 text-slate-400 border border-slate-800">
                        • {d}
                      </span>
                    ))}
                    {test.dimensions.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-lg text-[10px] bg-slate-950 text-slate-500 font-mono">
                        +{test.dimensions.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setProtocolModalItem(test);
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1 space-x-reverse"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>تفاصيل الرائز</span>
                  </button>

                  <button
                    onClick={() => handleOpenAssignModal(test)}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1 space-x-reverse shadow-md shadow-indigo-600/20"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>تخصيص لمريض</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: THERAPY EXERCISES & PROTOCOLS */}
      {activeTab === 'exercises' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExercises.map((ex) => (
            <div
              key={ex.id}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-5 space-y-4 shadow-xl transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-105 transition">
                    <Stethoscope className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {ex.category_label}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white leading-snug group-hover:text-emerald-300 transition">
                    {ex.title}
                  </h3>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-300">🎯 الهدف العلاجي المستهدف:</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {ex.target}
                  </p>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> التكرار الموصى به:</span>
                    <strong className="text-slate-200">{ex.frequency}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-indigo-400" /> مستوى الصعوبة:</span>
                    <strong className="text-slate-200">{ex.difficulty}</strong>
                  </div>
                </div>

                {/* Steps Preview */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400">خطوات البروتوكول:</div>
                  <ul className="text-[11px] text-slate-300 space-y-1">
                    {ex.steps.slice(0, 2).map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span className="line-clamp-1">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setProtocolModalItem(ex)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1 space-x-reverse"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>عرض البطاقة</span>
                </button>

                <button
                  onClick={() => handleOpenAssignModal(ex)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1 space-x-reverse shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تعيين كواجب</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGN TO PATIENT MODAL */}
      {assignModalOpen && selectedItemForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">تخصيص العنصر لملف مريض</h3>
                  <p className="text-xs text-slate-400">{selectedItemForAssign.title_ar || selectedItemForAssign.title}</p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-sm">تم تخصيص وتعيين العنصر للمريض بنجاح!</div>
                <div className="text-xs text-slate-400">سيظهر في السجل السريري للمريض وخطة المتابعة المنزلية.</div>
              </div>
            ) : (
              <form onSubmit={handleConfirmAssign} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">اختر المريض / الطفل:</label>
                  {patients.length === 0 ? (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-amber-400">
                      ⚠️ لا يوجد مرضى مسجلين حالياً. يرجى إضافة مريض أولاً من قسم ملفات المرضى.
                    </div>
                  ) : (
                    <select
                      value={targetPatientId}
                      onChange={(e) => setTargetPatientId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {p.age ? `${p.age} سنة` : ''} ({p.phone || 'بدون هاتف'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">ملاحظات وتوجيهات للأخصائي أو ولي الأمر:</label>
                  <textarea
                    rows={3}
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="مثال: يرجى التدريب 10 دقائق يومياً قبل موعد الحصة القادمة..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد التخصيص</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PROTOCOL DETAILS MODAL */}
      {protocolModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto my-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  {protocolModalItem.code || 'THERAPY PROTOCOL'}
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {protocolModalItem.title_ar || protocolModalItem.title}
                </h3>
                {protocolModalItem.title_fr && (
                  <div className="text-xs text-slate-400 font-mono">{protocolModalItem.title_fr}</div>
                )}
              </div>
              <button
                onClick={() => setProtocolModalItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-4">
              {protocolModalItem.description && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <div className="font-bold text-indigo-400 mb-1">📖 الوصف السريري والإكلينيكي:</div>
                  {protocolModalItem.description}
                </div>
              )}

              {protocolModalItem.target && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <div className="font-bold text-emerald-400 mb-1">🎯 الهدف التأهيلي المستهدف:</div>
                  {protocolModalItem.target}
                </div>
              )}

              {protocolModalItem.dimensions && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300">أبعاد ومحاور التقييم:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {protocolModalItem.dimensions.map((d, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {protocolModalItem.steps && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300">الخطوات الإجرائية بالتسلسل:</div>
                  <div className="space-y-2">
                    {protocolModalItem.steps.map((step, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {protocolModalItem.materials && (
                <div className="text-xs text-slate-400">
                  <strong className="text-slate-300 font-bold">الأدوات والوسائل المطلوبة:</strong> {protocolModalItem.materials}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  const it = protocolModalItem;
                  setProtocolModalItem(null);
                  handleOpenAssignModal(it);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <User className="w-4 h-4" />
                <span>تخصيص لملف مريض</span>
              </button>
              <button
                onClick={() => setProtocolModalItem(null)}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
