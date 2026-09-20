// =========================================================================
// CLINICAL CANVAS & TELE-THERAPY DATA BANK (ClinicalCanvasData.js)
// PsyPro Standardized Tele-Therapy & Interactive Canvas Media Catalog
// =========================================================================

export const CANVAS_TOOLS = {
  PEN: 'pen',
  HIGHLIGHTER: 'highlighter',
  LASER: 'laser',
  STAMP: 'stamp',
  ERASER: 'eraser',
};

export const COLOR_PALETTE = [
  { id: 'red', hex: '#ef4444', labelAr: 'أحمر' },
  { id: 'emerald', hex: '#10b981', labelAr: 'أخضر' },
  { id: 'blue', hex: '#3b82f6', labelAr: 'أزرق' },
  { id: 'purple', hex: '#8b5cf6', labelAr: 'بنفسجي' },
  { id: 'amber', hex: '#f59e0b', labelAr: 'عنبري' },
  { id: 'cyan', hex: '#06b6d4', labelAr: 'سماوي' },
  { id: 'white', hex: '#f8fafc', labelAr: 'أبيض' },
  { id: 'black', hex: '#0f172a', labelAr: 'داكن' },
];

export const STAMP_SYMBOLS = [
  { id: 'star', symbol: '⭐', label: 'نجمة ذهبية' },
  { id: 'check', symbol: '✅', label: 'صحيح' },
  { id: 'trophy', symbol: '🏆', label: 'كأس تميز' },
  { id: 'sparkles', symbol: '🌟', label: 'رائع' },
  { id: 'heart', symbol: '❤️', label: 'تشجيع' },
  { id: 'fire', symbol: '🔥', label: 'حماس' },
];

export const CLINICAL_DECKS = [
  // ==========================================
  // DECK 1: NAMING & VOCABULARY (التسمية والمفردات)
  // ==========================================
  {
    id: 'naming_animals',
    category: 'naming',
    titleAr: 'بطاقات تسمية الحيوانات المألوفة',
    titleFr: 'Images de Dénomination : Animaux',
    description: 'تسمية سريعة، تحديد الفونيم المبدئي، وتركيب جمل وصفية',
    items: [
      { id: 'a1', title: 'أسد', sub: 'Lion', symbol: '🦁', prompt: 'ماذا ترى في الصورة؟ ما هو صوته؟', phoneme: '/أ/' },
      { id: 'a2', title: 'فيل', sub: 'Éléphant', symbol: '🐘', prompt: 'حيوان ضخم لديه خرطوم طويل...', phoneme: '/ف/' },
      { id: 'a3', title: 'زرافة', sub: 'Girafe', symbol: '🦒', prompt: 'تأمل رقبتها الطويلة، ما اسمها؟', phoneme: '/ز/' },
      { id: 'a4', title: 'قطة', sub: 'Chat', symbol: '🐱', prompt: 'حيوان أليف يحب المواء...', phoneme: '/ق/' },
      { id: 'a5', title: 'حصان', sub: 'Cheval', symbol: '🐴', prompt: 'حيوان سريع يركض في المضمار...', phoneme: '/ح/' },
      { id: 'a6', title: 'عصفور', sub: 'Oiseau', symbol: '🐦', prompt: 'يطير في السماء ويغرد...', phoneme: '/ع/' },
    ],
  },
  {
    id: 'naming_fruits',
    category: 'naming',
    titleAr: 'بطاقات التسمية: الخضر والفواكه',
    titleFr: 'Dénomination : Fruits & Légumes',
    description: 'إثراء الرصيد اللغوي والتصنيف الدلالي وتنمية الوصف الشفهي',
    items: [
      { id: 'f1', title: 'تفاحة حمراء', sub: 'Pomme', symbol: '🍎', prompt: 'ما لونها؟ وما طعمها؟', phoneme: '/ت/' },
      { id: 'f2', title: 'موزة صفراء', sub: 'Banane', symbol: '🍌', prompt: 'فاكهة لذيذة يحبها القرد...', phoneme: '/م/' },
      { id: 'f3', title: 'برتقالة', sub: 'Orange', symbol: '🍊', prompt: 'غنية بفيتامين سي، نعصرها عصيراً...', phoneme: '/ب/' },
      { id: 'f4', title: 'فراولة', sub: 'Fraise', symbol: '🍓', prompt: 'حلوة المذاق ولونها قرمزي...', phoneme: '/ف/' },
      { id: 'f5', title: 'جزرة', sub: 'Carotte', symbol: '🥕', prompt: 'خضار مفيد للنظر ولونه برتقالي...', phoneme: '/ج/' },
    ],
  },

  // ==========================================
  // DECK 2: VISUAL DISCRIMINATION (التمييز البصري)
  // ==========================================
  {
    id: 'visual_discrimination',
    category: 'discrimination',
    titleAr: 'لوحات التمييز البصري والمقارنة',
    titleFr: 'Discrimination Visuelle & Appariement',
    description: 'أشر بالقلم أو المؤشر على العنصر المختلف أو المطابق',
    items: [
      {
        id: 'vd1',
        title: 'أوجد العنصر المختلف (L\'intrus)',
        prompt: 'ضع دائرة بالقلم حول الشيء الذي لا ينتمي لهذه المجموعة:',
        options: ['🚗 سيارة', '✈️ طائرة', '🚢 باخرة', '🍎 تفاحة'],
        correctIndex: 3,
      },
      {
        id: 'vd2',
        title: 'مطابقة الأحجام والأشكال',
        prompt: 'صل بخط بين كل حيوان ومسكنه المناسب:',
        pairs: [
          { left: '🐦 عصفور', right: '🪹 عش' },
          { left: '🐝 نحلة', right: '🍯 خلية' },
          { left: '🐟 سمكة', right: '🌊 بحر' },
        ],
      },
      {
        id: 'vd3',
        title: 'لغز المتاهة البصرية',
        prompt: 'استخدم القلم الأخضر لمساعدة الأرنب في الوصول للجزرة دون لمس الجدران:',
        type: 'maze',
      },
    ],
  },

  // ==========================================
  // DECK 3: READING & PHONICS (القراءة والتهجئة)
  // ==========================================
  {
    id: 'phonics_reading',
    category: 'reading',
    titleAr: 'شرائط الوعي الفونولوجي والقراءة',
    titleFr: 'Conscience Phonologique & Lecture',
    description: 'تقطيع المقاطع الصوتية والتركيب والتهجئة الموجهة',
    items: [
      {
        id: 'ph1',
        word: 'كِـ ـتَـ ـا بٌ',
        syllables: ['كِـ', 'تَا', 'بٌ'],
        prompt: 'اقرأ كل مقطع بوضوح، ثم ارسم خطاً تحته عند النطق الصحيح',
        symbol: '📖',
      },
      {
        id: 'ph2',
        word: 'مَـ ـدْ رَ سَـ ـةٌ',
        syllables: ['مَدْ', 'رَ', 'سَـ', 'ةٌ'],
        prompt: 'كم مقطعاً صوتياً تسمع في هذه الكلمة؟ ضع نجوماً بعددها',
        symbol: '🏫',
      },
      {
        id: 'ph3',
        word: 'طَـ ـبِـ ـيـ ـبٌ',
        syllables: ['طَ', 'بِيـ', 'بٌ'],
        prompt: 'أين حرف الطاء في الكلمة؟ لونه بالقلم الأصفر',
        symbol: '🩺',
      },
    ],
  },

  // ==========================================
  // DECK 4: EMOTIONS & CBT (المشاعر والعلاج المعرفي)
  // ==========================================
  {
    id: 'cbt_emotions',
    category: 'emotions',
    titleAr: 'لوحات استكشاف المشاعر والـ CBT',
    titleFr: 'Régulation Émotionnelle & TCC',
    description: 'تحديد المشاعر اللحظية، مؤشر الضيق SUDS، وسجل الأفكار التفاعلي',
    items: [
      {
        id: 'em1',
        title: 'عجلة المشاعر الأساسية',
        prompt: 'ضع ختماً ⭐ على الوجه الذي يعبر عن شعورك الآن:',
        faces: [
          { label: 'سعيد وفرحان', symbol: '😄' },
          { label: 'قلق ومتوتر', symbol: '😰' },
          { label: 'حزين ومحبط', symbol: '😢' },
          { label: 'غاضب ومنزعج', symbol: '😡' },
          { label: 'هادئ ومطمئن', symbol: '😌' },
        ],
      },
      {
        id: 'em2',
        title: 'ميزان الضيق والقلق (Thermomètre SUDS 0-10)',
        prompt: 'حدد بالقلم مستوى التوتر أو القلق من 0 (راحة تامة) إلى 10 (أقصى توتر):',
        scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
      {
        id: 'em3',
        title: 'فقاعة الفكرة التلقائية والبديل العقلاني',
        prompt: 'اكتب أو ارسم في الفقاعة الأولى الفكرة المزعجة، وفي الثانية الفكرة المشجعة:',
        bubbles: ['فكرة سلبية تلقائية 💭', 'فكرة عقلانية بديلة 💡'],
      },
    ],
  },
  // ==========================================
  // DECK 4: SPEECH & PHONOLOGY (الفحص الفونولوجي ومخارج الأصوات)
  // ==========================================
  {
    id: 'speech_phonology',
    category: 'speech',
    titleAr: 'مصفوفة الفحص الفونولوجي ومخارج الحروف',
    titleFr: 'Bilan Phonologique & Articulation',
    description: 'فحص الحروف الصفيرية، الانفجارية، والمائعة في بداية ووسط ونهاية الكلمة',
    items: [
      { id: 'ph1', title: 'صوت /س/ الصفيري', sub: 'Phonème /s/', symbol: '🚗', prompt: 'انطق بوضوح: سَـيارة - مِسْمار - شَمْـس', phoneme: '/س/' },
      { id: 'ph2', title: 'صوت /ر/ التكراري', sub: 'Phonème /r/', symbol: '🪶', prompt: 'انطق بوضوح: ريشة - كُـرَة - نَهْـر', phoneme: '/ر/' },
      { id: 'ph3', title: 'صوت /ش/ الاحتكاكي', sub: 'Phonème /ch/', symbol: '☀️', prompt: 'انطق بوضوح: شَمْس - عُـشْب - قِرْش', phoneme: '/ش/' },
      { id: 'ph4', title: 'صوت /ك/ اللهوي الانفجاري', sub: 'Phonème /k/', symbol: '📚', prompt: 'انطق بوضوح: كِتاب - مَكْتَب - سَمَـك', phoneme: '/ك/' },
      { id: 'ph5', title: 'صوت /ل/ اللثوي', sub: 'Phonème /l/', symbol: '🍋', prompt: 'انطق بوضوح: لَيْمُون - قَـلَم - عَسَـل', phoneme: '/ل/' },
    ],
  },
  // ==========================================
  // DECK 5: COGNITIVE & EXECUTIVE FUNCTIONS (الوظائف التنفيذية والتثبيط)
  // ==========================================
  {
    id: 'executive_attention',
    category: 'executive',
    titleAr: 'لوحات الانتباه والمرونة المعرفية (تثبيط Stroop)',
    titleFr: 'Fonctions Exécutives & Inhibition',
    description: 'تمارين مطابقة اللون والكلمة، التثبيط الإدراكي، والبحث البصري السريع',
    items: [
      { id: 'ex1', title: 'مهمة ستروب: سمِّ لون الحبر لا الكلمة', sub: 'Tâche de Stroop', symbol: '🎨', prompt: 'انطق لون الحبر المكتوب به دون قراءة الكلمة (مثال: كلمة "أحمر" بلون أخضر -> قل "أخضر")' },
      { id: 'ex2', title: 'تتبع النمط والتسلسل المنطقي', sub: 'Séquence Logique', symbol: '🧩', prompt: 'اكتشف العنصر الناقص في المتتالية وأشر إليه بالقلم أو الختم' },
      { id: 'ex3', title: 'متاهة التخطيط البصري المكاني', sub: 'Planification Spatiale', symbol: '🗺️', prompt: 'ارسم المسار الصحيح للوصول إلى الهدف دون الاصطدام بالحواجز' },
    ],
  },
];

// FAST TELETHERAPY SOAP TEMPLATES
export const TELETHERAPY_SOAP_PRESETS = [
  {
    title: 'استشارة مرئية: أرطوفونيا وتأهيل لغوي',
    specialty: 'orthophony',
    subjective: 'حصة عن بعد عبر السبورة التفاعلية؛ المريض والولي متواجدان بجاهزية تقنية كاملة مع تواصل بصري ممتاز.',
    objective: 'تطبيق بطاقات التسمية والتمييز السمعي عبر السبورة؛ إنجاز 15 محاولة تسمية بدقة 85% مع تفاعل حركي ممتاز بالقلم الافتراضي.',
    assessment: 'استجابة سريعة للتعزيزات البصرية؛ تحسن ملحوظ في الحفاظ على الانتباه المشترك عن بعد.',
    plan: 'متابعة شريط الكلمات ثلاثية المقاطع؛ إرسال كراسة التدريب المنزلي الرقمية وتثبيت موعد الأسبوع القادم.',
  },
  {
    title: 'استشارة مرئية: دعم نفسي وسلوكي (TCC)',
    specialty: 'psychology',
    subjective: 'جلسة دعم نفسي وتفريغ انفعالي عن بعد؛ مناقشة مستويات التوتر الأسبوعي وسجل الأفكار التلقائية.',
    objective: 'مقياس SUDS عند البداية: 7/10، تراجع إلى 3/10 بعد تمارين الاسترخاء والتنفس الموجه المشترك.',
    assessment: 'استبصار إيجابي وقدرة على تحديد التشوهات المعرفية؛ استجابة ممتازة لتقنية إعادة الهيكلة.',
    plan: 'تسجيل الأفكار البديلة على التطبيق يومياً وممارسة التنفس البطني 5 دقائق مرتين باليوم.',
  },
  {
    title: 'استشارة مرئية: إرشاد والدي ومتابعة',
    specialty: 'parent_guidance',
    subjective: 'جلسة إرشاد ومرافقة مع الولي لمناقشة التطورات السلوكية في البيت والمدرسة.',
    objective: 'مراجعة تطبيق جدول التعزيز الإيجابي المنزلي ونسب الالتزام بالروتين اليومي.',
    assessment: 'تحسن في آليات احتواء نوبات الغضب والتعامل مع صعوبات التركيز.',
    plan: 'الاستمرار في لوحة النجوم التشجيعية، وتحديد موعد الجلسة المباشرة في العيادة.',
  },
];
