import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Volume2, Printer, CheckCircle, Search, 
  Sparkles, Filter, ChevronLeft, ArrowRight, Share2, 
  FileDown, Layers, Play, Check, Send, AlertCircle, X
} from 'lucide-react';

const ARTICULATION_DRILLS = [
  {
    id: 'drill_r',
    letter: 'ر',
    name: 'صوت الراء /ر/',
    category: 'articulation',
    positions: [
      { position: 'initial', posLabel: 'أول الكلمة', word: 'رمّان', hint: 'رَ - مَّا - ن' },
      { position: 'medial', posLabel: 'وسط الكلمة', word: 'مَرْكَب', hint: 'مَرْ - كَب' },
      { position: 'final', posLabel: 'آخر الكلمة', word: 'قَمَر', hint: 'قَ - مَر' },
    ],
    tactileCue: 'اهتزاز طرف اللسان خلف الثنايا العليا',
    targetAge: '3-6 سنوات'
  },
  {
    id: 'drill_s',
    letter: 'س',
    name: 'صوت السين /س/',
    category: 'articulation',
    positions: [
      { position: 'initial', posLabel: 'أول الكلمة', word: 'سَمَكَة', hint: 'سَ - مَ - كَة' },
      { position: 'medial', posLabel: 'وسط الكلمة', word: 'مَسْبَح', hint: 'مَسْ - بَح' },
      { position: 'final', posLabel: 'آخر الكلمة', word: 'شَمْس', hint: 'شَمْ - س' },
    ],
    tactileCue: 'هواء بارد متدفق ومتقارب بين الأسنان',
    targetAge: '3-6 سنوات'
  },
  {
    id: 'drill_k',
    letter: 'ك',
    name: 'صوت الكاف /ك/',
    category: 'articulation',
    positions: [
      { position: 'initial', posLabel: 'أول الكلمة', word: 'كِتَاب', hint: 'كِ - تَا - ب' },
      { position: 'medial', posLabel: 'وسط الكلمة', word: 'مَكْتَب', hint: 'مَكْ - تَب' },
      { position: 'final', posLabel: 'آخر الكلمة', word: 'سَمَك', hint: 'سَ - مَك' },
    ],
    tactileCue: 'انفجار هوائي خلفي عند الحنك الرخو',
    targetAge: '4-7 سنوات'
  },
  {
    id: 'drill_l',
    letter: 'ل',
    name: 'صوت اللام /ل/',
    category: 'articulation',
    positions: [
      { position: 'initial', posLabel: 'أول الكلمة', word: 'لَيْمُون', hint: 'لَيْ - مُون' },
      { position: 'medial', posLabel: 'وسط الكلمة', word: 'قَلَم', hint: 'قَ - لَم' },
      { position: 'final', posLabel: 'آخر الكلمة', word: 'جَمَل', hint: 'جَ - مَل' },
    ],
    tactileCue: 'ارتفاع حافتي اللسان مع التصاق القمة باللثة العليا',
    targetAge: '3-5 سنوات'
  },
  {
    id: 'drill_j',
    letter: 'ج',
    name: 'صوت الجيم /ج/',
    category: 'articulation',
    positions: [
      { position: 'initial', posLabel: 'أول الكلمة', word: 'جَزَر', hint: 'جَ - زَر' },
      { position: 'medial', posLabel: 'وسط الكلمة', word: 'شَجَرَة', hint: 'شَ - جَ - رَة' },
      { position: 'final', posLabel: 'آخر الكلمة', word: 'تَاج', hint: 'تَا - ج' },
    ],
    tactileCue: 'الاحتكاك الانفجاري لوسط اللسان مع الحنك الصلب',
    targetAge: '4-8 سنوات'
  },
  {
    id: 'drill_sh',
    letter: 'ش',
    name: 'صوت الشين /ش/',
    category: 'articulation',
    positions: [
      { position: 'initial', posLabel: 'أول الكلمة', word: 'شَمْعَة', hint: 'شَمْ - عَة' },
      { position: 'medial', posLabel: 'وسط الكلمة', word: 'مِشْمِش', hint: 'مِشْ - مِش' },
      { position: 'final', posLabel: 'آخر الكلمة', word: 'عُشّ', hint: 'عُ - شّ' },
    ],
    tactileCue: 'استدارة الشفتين مع تدفق هواء دافئ',
    targetAge: '4-7 سنوات'
  },
  {
    id: 'drill_f',
    letter: 'ف',
    name: 'صوت الفاء /ف/',
    category: 'articulation',
    positions: [
      { position: 'initial', posLabel: 'أول الكلمة', word: 'فَرَاوْلَة', hint: 'فَ - رَاوْ - لَة' },
      { position: 'medial', posLabel: 'وسط الكلمة', word: 'طِفْل', hint: 'طِفْ - ل' },
      { position: 'final', posLabel: 'آخر الكلمة', word: 'خَرُوف', hint: 'خَ - رُوف' },
    ],
    tactileCue: 'ملامسة الثنايا العليا للشفة السفلى وخروج الهواء',
    targetAge: '3-5 سنوات'
  }
];

const PRINTABLE_WORKSHEETS = [
  {
    id: 'ws_maze_01',
    title: 'كراسة متاهات التتبع البصري الحركي والتآزر',
    targetAge: '4-8 سنوات',
    pagesCount: 12,
    difficulty: 'مبتدئ إلى متوسط',
    category: 'worksheets',
    description: 'تمارين متاهات تدرجية لتحفيز الانتباه البصري، تخطيط الحركة، والتحكم بالقلم لدى الأطفال ذوي صعوبات الكتابة والتركيز.',
    icon: '🌀'
  },
  {
    id: 'ws_dots_02',
    title: 'كراسة ربط النقاط والأشكال الهندسية المتناظرة',
    targetAge: '3-6 سنوات',
    pagesCount: 16,
    difficulty: 'مبتدئ',
    category: 'worksheets',
    description: 'أنشطة تتبع الأرقام والخطوط المنقطة لتطوير القبضة الثلاثية للأصابع والإدراك المكاني للاتجاهات.',
    icon: '✏️'
  },
  {
    id: 'ws_phonology_03',
    title: 'كراسة الوعي الفونولوجي والتقطيع الصوتي الملون',
    targetAge: '5-9 سنوات',
    pagesCount: 20,
    difficulty: 'متوسط',
    category: 'worksheets',
    description: 'أوراق عمل لتقسيم الكلمات إلى فونيمات ومقاطع صوتية، التمييز السمعي، وتحديد القافية لتأهيل عسر القراءة (Dyslexia).',
    icon: '🔤'
  },
  {
    id: 'ws_coloring_fine_motor',
    title: 'كراسة التلوين الإرشادي والتأهيل الحركي الدقيق',
    targetAge: '3-7 سنوات',
    pagesCount: 14,
    difficulty: 'مبتدئ',
    category: 'worksheets',
    description: 'تمارين تلوين مقيدة بحدود فراغية ضيقة لتقوية عضلات اليد الدقيقة وزيادة فترة التركيز المستمر.',
    icon: '🎨'
  }
];

const PECS_CARDS = [
  {
    id: 'pecs_needs',
    categoryName: 'الاحتياجات اليومية',
    cards: [
      { id: 'p1', title: 'أريد ماء', imageText: '🥛', color: 'bg-blue-50 text-blue-900 border-blue-200' },
      { id: 'p2', title: 'أريد أكل / جائع', imageText: '🍎', color: 'bg-amber-50 text-amber-900 border-amber-200' },
      { id: 'p3', title: 'دخول الحمام', imageText: '🚽', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
      { id: 'p4', title: 'النوم والراحة', imageText: '🛏️', color: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
    ]
  },
  {
    id: 'pecs_emotions',
    categoryName: 'التعبير عن المشاعر والحالة المزاجية',
    cards: [
      { id: 'p5', title: 'أنا سعيد ومسرور', imageText: '😊', color: 'bg-yellow-50 text-yellow-900 border-yellow-200' },
      { id: 'p6', title: 'أنا حزين أو متألم', imageText: '😢', color: 'bg-blue-50 text-blue-900 border-blue-200' },
      { id: 'p7', title: 'أنا غاضب وأحتاج هدوء', imageText: '😡', color: 'bg-rose-50 text-rose-900 border-rose-200' },
      { id: 'p8', title: 'أنا خائف / متوتر', imageText: '😨', color: 'bg-purple-50 text-purple-900 border-purple-200' },
    ]
  },
  {
    id: 'pecs_school',
    categoryName: 'الروتين المدرسي والأنشطة',
    cards: [
      { id: 'p9', title: 'وقت الاستماع للدرس', imageText: '👂', color: 'bg-teal-50 text-teal-900 border-teal-200' },
      { id: 'p10', title: 'رفع اليد للمشاركة', imageText: '🙋‍♂️', color: 'bg-sky-50 text-sky-900 border-sky-200' },
      { id: 'p11', title: 'وقت اللعب المشترك', imageText: '🧩', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
      { id: 'p12', title: 'تنظيف وترتيب الطاولة', imageText: '🧹', color: 'bg-amber-50 text-amber-900 border-amber-200' },
    ]
  }
];

const COGNITIVE_TASKS = [
  {
    id: 'cog_reverse_memory',
    title: 'تمرين الذاكرة العاملة اللفظية (الاسترجاع العكسي للأرقام)',
    difficulty: 'متوسط إلى متقدم',
    targetAge: '6 سنوات فما فوق',
    instructions: 'يقرأ الأخصائي متتالية أرقام (مثال: 4 - 8 - 2)، وعلى الطفل إعادتها بالترتيب المعكوس (2 - 8 - 4).',
    stimuli: ['3 - 7', '5 - 1 - 9', '2 - 6 - 4 - 8', '7 - 3 - 9 - 1 - 5']
  },
  {
    id: 'cog_go_no_go',
    title: 'مصفوفة كبح الاستجابة الحركية (Go / No-Go Task)',
    difficulty: 'متوسط',
    targetAge: '5-12 سنة',
    instructions: 'التصفيق مرة واحدة عند سماع اسم حيوان (Go)، والامتناع التام عن الحركة عند سماع اسم فاكهة (No-Go).',
    stimuli: ['أسد (صفق)', 'تفاحة (توقف)', 'حصان (صفق)', 'موز (توقف)', 'فيل (صفق)']
  },
  {
    id: 'cog_sorting',
    title: 'نشاط الفرز والتصنيف الدلالي المزدوج',
    difficulty: 'مبتدئ',
    targetAge: '4-8 سنوات',
    instructions: 'فرز البطاقات حسب معيارين متعاقبين: الفئة الوظيفية أولاً (أدوات مطبخ مقابل ملابس)، ثم حسب اللون.',
    stimuli: ['ملعقة حمراء', 'قميص أزرق', 'شوكة زرقاء', 'فستان أحمر']
  }
];

export default function ExercisesBankView() {
  const [activeTab, setActiveTab] = useState('articulation');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoneme, setSelectedPhoneme] = useState('all');
  const [repetitionCounters, setRepetitionCounters] = useState({});
  const [assignModalData, setAssignModalData] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('28');
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleIncrementRepetition = (drillId, pos) => {
    const key = `${drillId}_${pos}`;
    setRepetitionCounters(prev => ({
      ...prev,
      [key]: ((prev[key] || 0) % 5) + 1
    }));
  };

  const handleAssignHomework = (item, type) => {
    setAssignModalData({
      title: item.name || item.title,
      type: type,
      id: item.id
    });
    setAssignmentSuccess(false);
  };

  const handleConfirmAssignment = () => {
    setAssignmentSuccess(true);
    setTimeout(() => {
      setAssignModalData(null);
      setAssignmentSuccess(false);
    }, 1600);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-teal-800 to-emerald-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 bg-white/10 text-teal-200 rounded-xl border border-white/15">
              <BookOpen className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold">
              📚 بنك التمارين والكراسات العلاجية
            </h1>
          </div>
          <p className="text-teal-100 text-sm max-w-3xl leading-relaxed">
            كراسات التأهيل الأرطوفوني، تمارين مخارج الحروف، وسائل PECS للتواصل البديل، وأوراق العمل والواجبات المنزلية للعيادة.
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('articulation')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'articulation'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🗣️ تمارين مخارج الأصوات والنطق</span>
        </button>

        <button
          onClick={() => setActiveTab('worksheets')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'worksheets'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📖 كراسات وأوراق عمل قابلة للطباعة</span>
        </button>

        <button
          onClick={() => setActiveTab('pecs')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'pecs'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🃏 بطاقات PECS والقصص الاجتماعية</span>
        </button>

        <button
          onClick={() => setActiveTab('cognitive')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition whitespace-nowrap ${
            activeTab === 'cognitive'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🧠 أنشطة التركيز والذاكرة التنفيذية</span>
        </button>
      </div>

      {/* TAB 1: Articulation Drills Studio */}
      {activeTab === 'articulation' && (
        <div className="space-y-6">
          {/* Phoneme selector badges */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap ml-2">تصفية حسب الصوت:</span>
            <button
              onClick={() => setSelectedPhoneme('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedPhoneme === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الكل
            </button>
            {ARTICULATION_DRILLS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedPhoneme(d.letter)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition flex items-center justify-center ${
                  selectedPhoneme === d.letter
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                /{d.letter}/
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ARTICULATION_DRILLS.filter(d => selectedPhoneme === 'all' || d.letter === selectedPhoneme).map((drill) => (
              <div key={drill.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-lg border border-teal-200">
                      /{drill.letter}/
                    </span>
                    <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                      {drill.targetAge}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">{drill.name}</h3>
                  <p className="text-xs text-slate-500 mb-4 bg-teal-50/50 p-2.5 rounded-lg border border-teal-100">
                    💡 <span className="font-semibold text-teal-900">الموجّه الحركي:</span> {drill.tactileCue}
                  </p>

                  <div className="space-y-2.5 mb-5">
                    {drill.positions.map((pos) => {
                      const repKey = `${drill.id}_${pos.position}`;
                      const count = repetitionCounters[repKey] || 0;
                      return (
                        <div key={pos.position} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold block">{pos.posLabel}</span>
                            <span className="text-sm font-bold text-slate-900">{pos.word}</span>
                            <span className="text-[11px] text-teal-700 font-medium mr-2">({pos.hint})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => speakText(pos.word)}
                              title="استماع للنطق الفصيح"
                              className="p-2 bg-white hover:bg-teal-50 text-teal-700 border border-slate-200 hover:border-teal-300 rounded-lg transition"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleIncrementRepetition(drill.id, pos.position)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                count >= 5 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                              }`}
                            >
                              <span>{count}/5</span>
                              {count >= 5 && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleAssignHomework(drill, 'articulation')}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <span>➕ إسناد كواجب منزلي للمريض</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Printable PDF Worksheets */}
      {activeTab === 'worksheets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRINTABLE_WORKSHEETS.map((ws) => (
            <div key={ws.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-3xl p-3 bg-slate-100 rounded-2xl border border-slate-200">
                    {ws.icon}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">{ws.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>الفئة: {ws.targetAge}</span>
                      <span>•</span>
                      <span>{ws.pagesCount} صفحة قابلة للطباعة</span>
                      <span>•</span>
                      <span className="text-teal-700 font-semibold">{ws.difficulty}</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {ws.description}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ طباعة ورقة العمل (PDF)</span>
                </button>

                <button
                  onClick={() => handleAssignHomework(ws, 'worksheet')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
                >
                  ➕ إسناد لمريض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PECS Cards */}
      {activeTab === 'pecs' && (
        <div className="space-y-8">
          {PECS_CARDS.map((cat) => (
            <div key={cat.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>🃏</span>
                <span>{cat.categoryName}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {cat.cards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => speakText(card.title)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center text-center gap-2 ${card.color} shadow-sm`}
                  >
                    <span className="text-4xl">{card.imageText}</span>
                    <span className="font-bold text-sm leading-snug">{card.title}</span>
                    <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> انقر للنطق
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Cognitive Tasks */}
      {activeTab === 'cognitive' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COGNITIVE_TASKS.map((task) => (
            <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-md border border-purple-200">
                    {task.targetAge}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {task.difficulty}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-2">{task.title}</h3>
                <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  📌 {task.instructions}
                </p>

                <div className="space-y-1.5 mb-5">
                  <span className="text-[11px] font-bold text-slate-700 block">المثيرات الإكلينيكية:</span>
                  {task.stimuli.map((s, i) => (
                    <div key={i} className="p-2 bg-purple-50/40 rounded-lg text-xs text-purple-950 font-medium border border-purple-100 flex items-center justify-between">
                      <span>{s}</span>
                      <button onClick={() => speakText(s)} className="text-purple-600 hover:text-purple-800">
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleAssignHomework(task, 'cognitive')}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition"
              >
                ➕ إسناد للمريض في الخطة
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Homework Assignment Modal */}
      {assignModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-right space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                ➕ إسناد تمرين كواجب منزلي
              </h3>
              <button onClick={() => setAssignModalData(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-teal-50 p-3.5 rounded-xl text-xs text-teal-900 border border-teal-100 space-y-1">
              <span className="font-bold block">{assignModalData.title}</span>
              <span className="text-teal-700">سيتم ربطه بملف المريض ومشاركته مع ولي الأمر عبر بوابة المريض.</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اختر المريض:</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-teal-500"
                >
                  <option value="28">يوسف حمدي (تأخر لغوي ونطقي)</option>
                  <option value="1">ياسين بن علي (اضطراب نطق)</option>
                  <option value="2">سارة قدور (تأتأة نمائية)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">تكرار التمرين أسبوعياً:</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-teal-500">
                  <option value="daily">يومياً (10 دقائق)</option>
                  <option value="3_days">3 مرات في الأسبوع</option>
                  <option value="weekly">مرة واحدة في الأسبوع</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="whatsapp_notify" defaultChecked className="rounded text-teal-600 focus:ring-teal-500" />
                <label htmlFor="whatsapp_notify" className="text-slate-700 font-medium">
                  إرسال إشعار فوري لولي الأمر عبر WhatsApp / SMS
                </label>
              </div>
            </div>

            {assignmentSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>تم إسناد الواجب وإرسال الرابط لولي الأمر بنجاح!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignModalData(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                تأكيد الإسناد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
