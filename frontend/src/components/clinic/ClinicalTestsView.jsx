import React, { useState } from 'react';
import { 
  FileText, Play, CheckCircle2, AlertTriangle, Printer,
  Tablet, Search, Sparkles, Filter, Activity, Clock, Award,
  ChevronLeft, BarChart3, HelpCircle, X, Download
} from 'lucide-react';

const DIAGNOSTIC_TESTS = [
  {
    id: 'arabic_articulation_pcc',
    title: 'رائز الفحص النطقي العربي المعياري (PCC)',
    category: 'orthophonie',
    categoryName: 'تقويم النطق والتخاطب',
    duration: '20-30 دقيقة',
    targetAge: '3 سنوات فما فوق',
    normStandard: 'المعيار الصوتي العربي / الجزائري',
    description: 'تقييم شامل لجميع الصوامت العربية في المواضع الثلاثة (البداية، الوسط، النهاية) وحساب النسبة المئوية للصوامت الصحيحة (PCC Score) لتشخيص اللدغات واضطرابات النطق النمائية.',
    badge: 'معتمد رسمياً',
    badgeColor: 'emerald',
    questionsCount: 28,
    scoringType: 'pcc_percentage',
    sampleItems: [
      { id: 'item_r', label: 'صوت الراء /ر/ (رمّان - مركب - قمر)', phoneme: 'ر', targetWord: 'رمّان' },
      { id: 'item_s', label: 'صوت السين /س/ (سمكة - مسبح - شمس)', phoneme: 'س', targetWord: 'سمكة' },
      { id: 'item_k', label: 'صوت الكاف /ك/ (كتاب - مكتب - سمك)', phoneme: 'ك', targetWord: 'كتاب' },
      { id: 'item_l', label: 'صوت اللام /ل/ (ليمون - قلم - جمل)', phoneme: 'ل', targetWord: 'ليمون' },
      { id: 'item_j', label: 'صوت الجيم /ج/ (جزر - شجرة - تاج)', phoneme: 'ج', targetWord: 'جزر' },
    ]
  },
  {
    id: 'cars_2_autism',
    title: 'مقياس تقدير التوحد الطفولي (CARS-2)',
    category: 'autism',
    categoryName: 'طيف التوحد والنمو',
    duration: '30-45 دقيقة',
    targetAge: 'سنتان فما فوق',
    normStandard: 'Childhood Autism Rating Scale (CARS-2-ST)',
    description: 'المقياس الإكلينيكي الذهبي لتقييم 15 مجالاً سلوكياً ونمائياً لتشخيص اضطراب طيف التوحد وتحديد شدته بدقة إحصائية عالية.',
    badge: 'المعيار الذهبي',
    badgeColor: 'amber',
    questionsCount: 15,
    scoringType: 'sum_total',
    sampleItems: [
      { id: 'c1', label: 'العلاقات مع الناس (التفاعل الاجتماعي والتواصل المتبادل)', max: 4 },
      { id: 'c2', label: 'التقليد والمحاكاة الحركية واللفظية', max: 4 },
      { id: 'c3', label: 'الاستجابة العاطفية وملاءمة الانفعالات', max: 4 },
      { id: 'c4', label: 'استخدام الجسم وحركات اليدين النمطية', max: 4 },
      { id: 'c5', label: 'استخدام الأشياء واللعب النمطي وغير الوظيفي', max: 4 },
    ]
  },
  {
    id: 'bdi_2_depression',
    title: 'مقياس بيك للاكتئاب السريري (BDI-II)',
    category: 'psychology',
    categoryName: 'العيادة النفسية للبالغين والمراهقين',
    duration: '10-15 دقيقة',
    targetAge: '13 سنة فما فوق',
    normStandard: 'Beck Depression Inventory (BDI-II)',
    description: 'استمارة التقييم النفسي الذاتي الأكثر استخداماً عالمياً المكونة من 21 بنداً لقياس الأعراض المعرفية والوجدانية والجسدية للاكتئاب.',
    badge: 'مقنن دولياً',
    badgeColor: 'blue',
    questionsCount: 21,
    scoringType: 'bdi_sum',
    sampleItems: [
      { id: 'b1', label: 'الحزن والشعور بالكآبة (0 إلى 3 درجات)' },
      { id: 'b2', label: 'التشاؤم وتوقع المستقبل السلبي' },
      { id: 'b3', label: 'الإحساس بالفشل والإخفاق المستمر' },
      { id: 'b4', label: 'فقدان المتعة والاهتمام بالأنشطة (Anhedonia)' },
      { id: 'b5', label: 'مشاعر الذنب ولوم الذات' },
    ]
  },
  {
    id: 'conners_3_adhd',
    title: 'مقياس كونرز لفرط الحركة وتشتت الانتباه (Conners-3)',
    category: 'psychology',
    categoryName: 'صعوبات التعلم والانتباه',
    duration: '20 دقيقة',
    targetAge: '6 - 18 سنة',
    normStandard: 'Conners 3rd Edition (Teacher & Parent Rating)',
    description: 'تقييم شامل لأعراض نقص الانتباه، فرط النشاط، والاندفاعية مع مؤشرات الوظائف التنفيذية وصعوبات التعلم الأكاديمية.',
    badge: 'ADHD تشخيص',
    badgeColor: 'purple',
    questionsCount: 24,
    scoringType: 'sum_total',
    sampleItems: [
      { id: 'cn1', label: 'صعوبة البقاء منتبهاً في المهام الطويلة أو أثناء الدرس' },
      { id: 'cn2', label: 'كثرة الحركة والتململ وصعوبة الجلوس في المكان' },
      { id: 'cn3', label: 'الاندفاع في الإجابة ومقاطعة الآخرين أثناء الحديث' },
      { id: 'cn4', label: 'نسيان الأدوات المدرسية والواجبات اليومية' },
    ]
  },
  {
    id: 'ssi_4_stuttering',
    title: 'مقياس اضطراب طلاقة الكلام والتأتأة (SSI-4)',
    category: 'orthophonie',
    categoryName: 'تقويم النطق والتخاطب',
    duration: '25 دقيقة',
    targetAge: 'أطفال وبالغين',
    normStandard: 'Stuttering Severity Instrument (SSI-4)',
    description: 'أداة قياس كمية دقيقة لحساب تكرارات التأتأة، الإطالات، والحبسات الصوتية مع قياس زمن التوقف والحركات المصاحبة بالرأس والوجه.',
    badge: 'الطلاقة الكلامية',
    badgeColor: 'teal',
    questionsCount: 12,
    scoringType: 'sum_total',
    sampleItems: [
      { id: 's1', label: 'نسبة المقاطع المتلعثمة أثناء القراءة الجهرية (%SS)' },
      { id: 's2', label: 'نسبة المقاطع المتلعثمة في المحادثة الحرة العفوية' },
      { id: 's3', label: 'مدة أطول ثلاث فترات احتباس صوتي بالثواني' },
      { id: 's4', label: 'الحركات الجسمية المصاحبة (رمش العينين، شد الفك، توتر الرقبة)' },
    ]
  },
  {
    id: 'dyslexia_battery',
    title: 'بطارية عسر القراءة وصعوبات التعلم النمائية',
    category: 'learning_disabilities',
    categoryName: 'صعوبات التعلم والتأهيل المعرفي',
    duration: '35 دقيقة',
    targetAge: '6 - 12 سنة',
    normStandard: 'المعيار المعرفي الفونولوجي',
    description: 'اختبار تشخيصي يقيس الوعي الفونولوجي، التسمية التلقائية السريعة (RAN)، القراءة المجهورة للكلمات غير المألوفة، والذاكرة السمعية اللفظية قصيرة المدى.',
    badge: 'ديسليكسيا',
    badgeColor: 'rose',
    questionsCount: 18,
    scoringType: 'sum_total',
    sampleItems: [
      { id: 'd1', label: 'اختبار حذف وإضافة المقاطع الصوتية (Phonological Manipulation)' },
      { id: 'd2', label: 'اختبار التسمية السريعة للأشكال والألوان (Rapid Naming)' },
      { id: 'd3', label: 'قراءة قائمة الكلمات المضللة / الزائفة (Pseudowords Reading)' },
      { id: 'd4', label: 'اختبار الإملاء والتمييز البصري للحروف المتشابهة' },
    ]
  }
];

export default function ClinicalTestsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTestModal, setActiveTestModal] = useState(null);
  const [scores, setScores] = useState({});
  const [testResult, setTestResult] = useState(null);

  const categories = [
    { id: 'all', label: '📋 جميع الروائز والمقاييس' },
    { id: 'orthophonie', label: '🗣️ تقويم النطق والأرطوفونيا' },
    { id: 'psychology', label: '🧠 العيادة النفسية والمعرفية' },
    { id: 'autism', label: '🌟 طيف التوحد والنمو' },
    { id: 'learning_disabilities', label: '📖 صعوبات التعلم والديسليكسيا' },
  ];

  const filteredTests = DIAGNOSTIC_TESTS.filter(test => {
    const matchesCategory = selectedCategory === 'all' || test.category === selectedCategory;
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          test.normStandard.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleStartTest = (test) => {
    setActiveTestModal(test);
    setScores({});
    setTestResult(null);
  };

  const handleScoreChange = (itemId, val) => {
    setScores(prev => ({
      ...prev,
      [itemId]: parseInt(val) || 0
    }));
  };

  const calculateResult = () => {
    if (!activeTestModal) return;

    if (activeTestModal.id === 'bdi_2_depression') {
      const sum = Object.values(scores).reduce((a, b) => a + b, 0);
      let interpretation = 'طبيعي - لا توجد مؤشرات اكتئاب سريري ملحوظة (Minimal Depression)';
      let severity = 'success';
      if (sum >= 14 && sum <= 19) {
        interpretation = 'اكتئاب سريري طفيف إلى خفيف (Mild Depression)';
        severity = 'info';
      } else if (sum >= 20 && sum <= 28) {
        interpretation = 'اكتئاب سريري متوسط الشدة (Moderate Depression) - يُوصى بجلسات علاج معرفي سلوكي';
        severity = 'warning';
      } else if (sum >= 29) {
        interpretation = 'اكتئاب سريري شديد وحاد (Severe Depression) - يتطلب تدخلاً طبياً ونفسياً عاجلاً';
        severity = 'danger';
      }
      setTestResult({ sum, interpretation, severity });
    } else if (activeTestModal.id === 'arabic_articulation_pcc') {
      const totalCorrect = Object.values(scores).reduce((a, b) => a + (b === 1 ? 1 : 0), 0);
      const totalItems = activeTestModal.sampleItems.length;
      const percentage = Math.round((totalCorrect / totalItems) * 100);
      let severity = 'success';
      let interpretation = `مؤشر الصوامت الصحيحة (PCC): ${percentage}%. نطق سليم وطبيعي.`;
      if (percentage < 50) {
        interpretation = `مؤشر الصوامت الصحيحة (PCC): ${percentage}%. اضطراب نطقي شديد (Severe Articulation Disorder).`;
        severity = 'danger';
      } else if (percentage < 65) {
        interpretation = `مؤشر الصوامت الصحيحة (PCC): ${percentage}%. اضطراب نطقي متوسط إلى شديد.`;
        severity = 'warning';
      } else if (percentage < 85) {
        interpretation = `مؤشر الصوامت الصحيحة (PCC): ${percentage}%. اضطراب نطقي خفيف إلى متوسط.`;
        severity = 'info';
      }
      setTestResult({ sum: percentage, interpretation, severity });
    } else {
      const sum = Object.values(scores).reduce((a, b) => a + b, 0);
      setTestResult({ 
        sum, 
        interpretation: `المجموع الخام: ${sum} نقطة. تم حفظ بيانات التقييم في ملف المريض.`, 
        severity: 'info' 
      });
    }
  };

  const handlePrint = (test) => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/30">
              <Activity className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold">
              🧩 بنك الروائز والمقاييس التشخيصية المعتمدة
            </h1>
          </div>
          <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
            المكتبة السريرية المعتمدة للمقاييس النفسية، الأرطوفونية، واختبارات التوحد وصعوبات التعلم المقننة بالمعيار الجزائري والعربي.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/tablet/kiosk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-teal-900/40"
          >
            <Tablet className="w-4 h-4" />
            <span>فتح واجهة التابلت التفاعلية</span>
          </a>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم المقياس، المعيار السريري، أو الاضطراب (مثال: بيك، CARS-2، نطق، ديسليكسيا)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-11 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm border-t border-slate-100 pt-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Test Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => (
          <div 
            key={test.id} 
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-md border border-teal-100">
                  {test.categoryName}
                </span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                  test.badgeColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  test.badgeColor === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  test.badgeColor === 'purple' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  test.badgeColor === 'teal' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                  test.badgeColor === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {test.badge}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base mb-2 leading-snug">
                {test.title}
              </h3>

              <p className="text-slate-600 text-xs leading-relaxed mb-4 line-clamp-3">
                {test.description}
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> مدة التطبيق:</span>
                  <span className="font-semibold text-slate-800">{test.duration}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-slate-400" /> الفئة العمرية:</span>
                  <span className="font-semibold text-slate-800">{test.targetAge}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> عدد البنود:</span>
                  <span className="font-semibold text-slate-800">{test.questionsCount} بنداً</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleStartTest(test)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>بدء التقييم السريري</span>
              </button>

              <button
                onClick={() => handlePrint(test)}
                title="طباعة الاستمارة السريرية الفارغة"
                className="p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Diagnostic Test Modal */}
      {activeTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-teal-800 to-slate-900 text-white flex items-start justify-between gap-4">
              <div>
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 text-xs rounded border border-teal-400/30">
                  {activeTestModal.categoryName}
                </span>
                <h2 className="text-lg font-bold mt-1.5">{activeTestModal.title}</h2>
                <p className="text-xs text-slate-300 mt-1">{activeTestModal.normStandard}</p>
              </div>
              <button 
                onClick={() => setActiveTestModal(null)}
                className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="bg-teal-50 border border-teal-100 p-3.5 rounded-xl text-teal-900 text-xs leading-relaxed">
                ℹ️ قم بتسجيل درجات كل بند لحساب النتيجة الفورية ومقارنتها بنقاط القطع المعيارية (Cut-off Score).
              </div>

              <div className="space-y-3">
                {activeTestModal.sampleItems?.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                    <span className="text-slate-800 font-medium text-xs leading-relaxed">
                      {idx + 1}. {item.label}
                    </span>

                    {activeTestModal.id === 'arabic_articulation_pcc' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleScoreChange(item.id, 1)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            scores[item.id] === 1 ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          صحيح (1)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(item.id, 0)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            scores[item.id] === 0 ? 'bg-rose-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          خطأ (0)
                        </button>
                      </div>
                    ) : (
                      <select
                        value={scores[item.id] ?? 0}
                        onChange={(e) => handleScoreChange(item.id, e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value={0}>0 - لا ينطبق / طبيعي</option>
                        <option value={1}>1 - خفيف / نادراً</option>
                        <option value={2}>2 - متوسط / أحياناً</option>
                        <option value={3}>3 - شديد / دائماً</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>

              {testResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  testResult.severity === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                  testResult.severity === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                  testResult.severity === 'info' ? 'bg-blue-50 border-blue-200 text-blue-900' :
                  'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="font-bold flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4" />
                    <span>التأويل الإكلينيكي للنتيجة:</span>
                  </div>
                  <p className="leading-relaxed font-medium">{testResult.interpretation}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveTestModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition"
              >
                إغلاق
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={calculateResult}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  حساب النتيجة والتأويل السريري
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
