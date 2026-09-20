/**
 * PsyPro Orthophonie Clinical Suite - Speech & Articulation Matrix
 * بنك البيانات الفونولوجية والفحص العضوي الوظيفي لأخصائيي الأرطوفونيا
 * Reference: International Phonetic Association (IPA) & Arabic Clinical Orthophony Standards
 */

// 1. الفحص العضوي الوظيفي لأعضاء النطق والكلام (Bilan Bucco-Phonatoire)
export const BUCCO_FACIAL_CATEGORIES = [
  {
    id: 'lips',
    title: 'الشفاه (Lèvres)',
    icon: '👄',
    description: 'تقييم الحركية، الإطباق، والتوتر العضلي الشفوي',
    fields: [
      {
        id: 'occlusion',
        label: 'إطباق الشفاه أثناء الراحة',
        options: [
          { value: 'normal', label: 'إطباق سليم ومحكم (Normal)', status: 'success' },
          { value: 'incompetent', label: 'إطباق غير محكم / فم مفتوح جزئياً (Incompétence labiale)', status: 'warning' },
          { value: 'short_upper', label: 'شفة علوية قصيرة شادة (Brièveté labiale)', status: 'danger' },
        ],
      },
      {
        id: 'mobility',
        label: 'حركية الشفاه (ضم وابتسام)',
        options: [
          { value: 'normal', label: 'حركية متناظرة وسلسة (Symétrique)', status: 'success' },
          { value: 'restricted_spread', label: 'صعوبة الابتسام وبسط الشفاه (Rétraction limitée)', status: 'warning' },
          { value: 'restricted_pucker', label: 'صعوبة ضم الشفاه /O/ و /U/ (Projection limitée)', status: 'warning' },
          { value: 'asymmetry', label: 'عدم تناظر حركي / شلل جزئي (Asymétrie faciale)', status: 'danger' },
        ],
      },
      {
        id: 'tonicity',
        label: 'التوتر العضلي (Tonicité)',
        options: [
          { value: 'eutonie', label: 'توتر طبيعي متزن (Eutonie)', status: 'success' },
          { value: 'hypotonie', label: 'رخاوة عضلية شفوية (Hypotonie labiale)', status: 'warning' },
          { value: 'hypertonie', label: 'تشنج وفرط توتر (Hypertonie labiale)', status: 'warning' },
        ],
      },
      {
        id: 'diadochokinesis',
        label: 'الحركية المتناوبة السريعة (Diadococinésie /p-t-k/)',
        options: [
          { value: 'rhythmic', label: 'إيقاع سريع ومنتظم ومستمر', status: 'success' },
          { value: 'slow', label: 'إيقاع بطيء مع إجهاد عضلي', status: 'warning' },
          { value: 'dysrhythmic', label: 'اضطراب الإيقاع والتسلسل الحركي (Dysdiadococinésie)', status: 'danger' },
        ],
      },
    ],
  },
  {
    id: 'tongue',
    title: 'اللسان (Langue)',
    icon: '👅',
    description: 'تقييم الحركية في المحاور الثلاثة، اللجام، والتوتر العضلي',
    fields: [
      {
        id: 'elevation',
        label: 'رفع رأس اللسان نحو قبة الحنك (Élévation)',
        options: [
          { value: 'normal', label: 'رفع كامل يصل إلى الحليمات القاطعة (Normal)', status: 'success' },
          { value: 'partial', label: 'رفع جزئي مع ميلان اللسان للداخل', status: 'warning' },
          { value: 'restricted', label: 'عجز عن رفع رأس اللسان للأعلى (Impossibilité)', status: 'danger' },
        ],
      },
      {
        id: 'lateralization',
        label: 'الحركات الجانبية (Latéralité droite/gauche)',
        options: [
          { value: 'normal', label: 'حركة سريعة متناظرة للزاويتين اليمنى واليسرى', status: 'success' },
          { value: 'slow', label: 'حركة بطيئة أو مجهدة', status: 'warning' },
          { value: 'restricted', label: 'انحراف اللسان لجهة واحدة عند الحركة', status: 'danger' },
        ],
      },
      {
        id: 'lingual_frenum',
        label: 'لجام اللسان (Frein lingual / Ankyloglossie)',
        options: [
          { value: 'normal', label: 'لجام طبيعي مرن يسمح بحرية الحركة الكاملة', status: 'success' },
          { value: 'mild_short', label: 'لجام قصير خفيف لا يمنع النطق كلياً', status: 'warning' },
          { value: 'severe_short', label: 'لجام ملتصق وشديد القصر يعيق أصوات الراء واللام (Ankyloglossie sévère) 🚨', status: 'danger' },
        ],
      },
      {
        id: 'resting_posture',
        label: 'وضعية اللسان في وضع الراحة',
        options: [
          { value: 'palatal', label: 'مستقر على الحنك العلوي خلف الثنايا (Normal)', status: 'success' },
          { value: 'floor', label: 'مستقر في قاع الفم (Position basse)', status: 'warning' },
          { value: 'interdental', label: 'مندفع بين الأسنان الأمامية (Interposition linguale)', status: 'danger' },
        ],
      },
    ],
  },
  {
    id: 'palate',
    title: 'شراع الحنك واللهاة (Voile du palais & Voix)',
    icon: '👄',
    description: 'سلامة الصمام الشراعي الحلقي والحركية أثناء التصويت',
    fields: [
      {
        id: 'velar_mobility',
        label: 'حركية شراع الحنك عند التصويت /آ/ (Mobilité au phonème /a/)',
        options: [
          { value: 'normal', label: 'ارتفاع متناظر وسريع يغلق البلعوم الأنفي', status: 'success' },
          { value: 'unilateral_lag', label: 'خمول أو ضعف حركة في أحد الجانبين', status: 'warning' },
          { value: 'bilateral_paresis', label: 'قصور شراعي حلقي ثنائي (Insuffisance vélaire) 🚨', status: 'danger' },
        ],
      },
      {
        id: 'uvula',
        label: 'شكل وتمركز اللهاة (Luette)',
        options: [
          { value: 'normal', label: 'لهاة مفردة مركزية ومتناظرة', status: 'success' },
          { value: 'bifid', label: 'لهاة مشقوقة جزئياً (Luette bifide) ⚠️', status: 'warning' },
          { value: 'deviated', label: 'انحراف اللهاة عند التصويت', status: 'warning' },
        ],
      },
      {
        id: 'resonance',
        label: 'الرنين الصوتي ورنين الأنف (Rhinolalie)',
        options: [
          { value: 'normal', label: 'رنين فموي متزن دون تسرب هوائي', status: 'success' },
          { value: 'open_rhinolalia', label: 'خنف مفتوح - تسرب الهواء من الأنف (Rhinolalie ouverte)', status: 'danger' },
          { value: 'closed_rhinolalia', label: 'خنف مغلق - انسداد المجرى الأنفي (Rhinolalie fermée)', status: 'warning' },
        ],
      },
    ],
  },
  {
    id: 'dentition',
    title: 'الإطباق السني والفك (Articulé Dentaire)',
    icon: '🦷',
    description: 'أصناف زاوية (Angle)، شكل العضة، وتأثيرها على أصوات الصفير',
    fields: [
      {
        id: 'angle_class',
        label: 'صنف الإطباق السني (Classification d\'Angle)',
        options: [
          { value: 'class_1', label: 'الصنف الأول: إطباق سليم متناسق (Classe I)', status: 'success' },
          { value: 'class_2', label: 'الصنف الثاني: تراجع الفك السفلي (Classe II / Rétrognathie)', status: 'warning' },
          { value: 'class_3', label: 'الصنف الثالث: تقدم وبروز الفك السفلي (Classe III / Prognathie)', status: 'danger' },
        ],
      },
      {
        id: 'bite_type',
        label: 'شكل العضة والاصطفاف (Type d\'occlusion)',
        options: [
          { value: 'normal', label: 'عضة متراكبة طبيعية (Normocclusion)', status: 'success' },
          { value: 'open_bite', label: 'عضة مفتوحة أمامية (Béance antérieure) تسبب لثغة بين-أسنانية', status: 'danger' },
          { value: 'cross_bite', label: 'عضة متصالبة جانبية (Articulé croisé)', status: 'warning' },
          { value: 'deep_bite', label: 'عضة عميقة مغطية (Supraclusion)', status: 'warning' },
        ],
      },
      {
        id: 'swallowing_pattern',
        label: 'نمط البلع (Déglutition)',
        options: [
          { value: 'adult', label: 'بلع وظيفي راشد بالأسنان مطبقة (Déglutition fonctionnelle)', status: 'success' },
          { value: 'atypical', label: 'بلع طفلي غير ناضج مع دفع لساني (Déglutition atypique / infantile)', status: 'danger' },
        ],
      },
    ],
  },
  {
    id: 'respiration',
    title: 'التنفس والصوت (Respiration & Souffle)',
    icon: '🫁',
    description: 'نمط التنفس، سعة الزفير، وزمن التصويت الأقصى TMF',
    fields: [
      {
        id: 'pattern',
        label: 'نمط التنفس (Type respiratoire)',
        options: [
          { value: 'abdominal', label: 'تنفس بطني ضلعي متزن سليم (Abdomino-diaphragmatique)', status: 'success' },
          { value: 'clavicular', label: 'تنفس صدري علوي سطحي سريع (Costal supérieur)', status: 'warning' },
          { value: 'mouth_breather', label: 'تنفس فموي مزمن مستمر (Respirateur buccal)', status: 'danger' },
        ],
      },
      {
        id: 'air_control',
        label: 'التحكم في تدفق هواء الزفير (Contrôle expiratoire)',
        options: [
          { value: 'stable', label: 'زفير مستقر هادئ ومستمر لأكثر من 10 ثوان', status: 'success' },
          { value: 'interrupted', label: 'زفير متقطع أو قصير مع اضطراب التزامن', status: 'warning' },
          { value: 'weak', label: 'زفير ضعيف جداً غير كافٍ لدعم الجمل الطويلة', status: 'danger' },
        ],
      },
      {
        id: 'tmf_category',
        label: 'زمن التصويت الأقصى المقدر (TMF - صوت /آ/)',
        options: [
          { value: 'good', label: 'أكثر من 12 ثانية (كفاية هوائية ممتازة)', status: 'success' },
          { value: 'moderate', label: 'من 7 إلى 11 ثانية (كفاية متوسطة مقبولة)', status: 'warning' },
          { value: 'short', label: 'أقل من 6 ثوانٍ (تسرب هوائي أو ضعف رئوي)', status: 'danger' },
        ],
      },
    ],
  },
];

// 2. بنك الفونيمات والأصوات العربية (28 صوتاً) مع الكلمات في المواضع الثلاثة
export const ARABIC_PHONEMES = [
  // أ. الأصوات الشفوية والشفاهية-الأسنانية
  {
    id: 'b',
    symbol: '/ب/',
    letter: 'ب',
    name: 'الباء',
    ipa: 'b',
    category: 'شفوية (Bilabiale)',
    manner: 'انفجاري مجهور',
    ageRange: '2 - 3 سنوات',
    words: {
      initial: { text: 'بَاب', icon: '🚪', ipa: 'ba:b' },
      medial: { text: 'خُبْز', icon: '🍞', ipa: 'xubz' },
      final: { text: 'كَلْب', icon: '🐕', ipa: 'kalb' },
    },
  },
  {
    id: 'm',
    symbol: '/م/',
    letter: 'م',
    name: 'الميم',
    ipa: 'm',
    category: 'شفوية أنفية (Bilabiale Nasale)',
    manner: 'أنفي مجهور',
    ageRange: '2 - 3 سنوات',
    words: {
      initial: { text: 'مَوْز', icon: '🍌', ipa: 'mawz' },
      medial: { text: 'شَمْس', icon: '☀️', ipa: 'ʃams' },
      final: { text: 'قَلَم', icon: '✏️', ipa: 'qalam' },
    },
  },
  {
    id: 'w',
    symbol: '/و/',
    letter: 'و',
    name: 'الواو الساكنة',
    ipa: 'w',
    category: 'شفوية طبقية (Labio-vélaire)',
    manner: 'شبه صامت مجهور',
    ageRange: '2 - 3 سنوات',
    words: {
      initial: { text: 'وَرْدَة', icon: '🌹', ipa: 'warda' },
      medial: { text: 'دَوْرَق', icon: '🏺', ipa: 'dawraq' },
      final: { text: 'دَلْو', icon: '🪣', ipa: 'dalw' },
    },
  },
  {
    id: 'f',
    symbol: '/ف/',
    letter: 'ف',
    name: 'الفاء',
    ipa: 'f',
    category: 'شفاهية أسنانية (Labio-dentale)',
    manner: 'احتكاكي مهموس',
    ageRange: '3 - 4 سنوات',
    words: {
      initial: { text: 'فَرَاوِلَة', icon: '🍓', ipa: 'farawila' },
      medial: { text: 'تُفَّاحَة', icon: '🍎', ipa: 'tuffa:ħa' },
      final: { text: 'خَرُوف', icon: '🐑', ipa: 'xaru:f' },
    },
  },

  // ب. الأصوات البين-أسنانية (Interdentales)
  {
    id: 'th',
    symbol: '/ث/',
    letter: 'ث',
    name: 'الثاء',
    ipa: 'θ',
    category: 'بين أسنانية (Interdentale)',
    manner: 'احتكاكي مهموس',
    ageRange: '4 - 5 سنوات',
    words: {
      initial: { text: 'ثَعْلَب', icon: '🦊', ipa: 'θaʕlab' },
      medial: { text: 'مُثَلَّث', icon: '📐', ipa: 'muθallaθ' },
      final: { text: 'أَثَاث', icon: '🛋️', ipa: 'ʔaθa:θ' },
    },
  },
  {
    id: 'dh',
    symbol: '/ذ/',
    letter: 'ذ',
    name: 'الذال',
    ipa: 'ð',
    category: 'بين أسنانية (Interdentale)',
    manner: 'احتكاكي مجهور',
    ageRange: '4 - 5 سنوات',
    words: {
      initial: { text: 'ذُبَابَة', icon: '🪰', ipa: 'ðuba:ba' },
      medial: { text: 'حِذَاء', icon: '👞', ipa: 'ħiða:ʔ' },
      final: { text: 'قُنْفُذ', icon: '🦔', ipa: 'qunfuð' },
    },
  },
  {
    id: 'z_emph',
    symbol: '/ظ/',
    letter: 'ظ',
    name: 'الظاء (المفخمة)',
    ipa: 'ðˤ',
    category: 'بين أسنانية مفخمة (Interdentale vélarisée)',
    manner: 'احتكاكي مجهور مفخم',
    ageRange: '5 - 6 سنوات',
    words: {
      initial: { text: 'ظَرْف', icon: '✉️', ipa: 'ðˤarf' },
      medial: { text: 'نَظَّارَة', icon: '👓', ipa: 'naðˤðˤa:ra' },
      final: { text: 'مُسْتَيْقِظ', icon: '⏰', ipa: 'mustajqiðˤ' },
    },
  },

  // ج. الأصوات اللثوية والأسنانية-اللثوية (Alvéolaires)
  {
    id: 't',
    symbol: '/ت/',
    letter: 'ت',
    name: 'التاء',
    ipa: 't',
    category: 'أسنانية لثوية (Dento-alvéolaire)',
    manner: 'انفجاري مهموس',
    ageRange: '2 - 3 سنوات',
    words: {
      initial: { text: 'تِمْسَاح', icon: '🐊', ipa: 'timsa:ħ' },
      medial: { text: 'كِتَاب', icon: '📖', ipa: 'kita:b' },
      final: { text: 'بِنْت', icon: '👧', ipa: 'bint' },
    },
  },
  {
    id: 'd',
    symbol: '/د/',
    letter: 'د',
    name: 'الدال',
    ipa: 'd',
    category: 'أسنانية لثوية (Dento-alvéolaire)',
    manner: 'انفجاري مجهور',
    ageRange: '2 - 3 سنوات',
    words: {
      initial: { text: 'دَرَاجَة', icon: '🚲', ipa: 'darra:d͡ʒa' },
      medial: { text: 'حَدِيقَة', icon: '🌳', ipa: 'ħadi:qa' },
      final: { text: 'وَلَد', icon: '👦', ipa: 'walad' },
    },
  },
  {
    id: 't_emph',
    symbol: '/ط/',
    letter: 'ط',
    name: 'الطاء (المفخمة)',
    ipa: 'tˤ',
    category: 'أسنانية لثوية مفخمة (Dento-alvéolaire vélarisée)',
    manner: 'انفجاري مهموس مفخم',
    ageRange: '4 - 5 سنوات',
    words: {
      initial: { text: 'طَيَّارَة', icon: '✈️', ipa: 'tˤajja:ra' },
      medial: { text: 'قِطَار', icon: '🚆', ipa: 'qitˤa:r' },
      final: { text: 'بَطّ', icon: '🦆', ipa: 'batˤtˤ' },
    },
  },
  {
    id: 'd_emph',
    symbol: '/ض/',
    letter: 'ض',
    name: 'الضاد (المفخمة)',
    ipa: 'dˤ',
    category: 'أسنانية لثوية مفخمة (Dento-alvéolaire vélarisée)',
    manner: 'انفجاري مجهور مفخم',
    ageRange: '5 - 6 سنوات',
    words: {
      initial: { text: 'ضِفْدَع', icon: '🐸', ipa: 'dˤifdaʕ' },
      medial: { text: 'خُضَار', icon: '🥕', ipa: 'xudˤa:r' },
      final: { text: 'بَيْض', icon: '🥚', ipa: 'bajdˤ' },
    },
  },
  {
    id: 'n',
    symbol: '/ن/',
    letter: 'ن',
    name: 'النون',
    ipa: 'n',
    category: 'لثوية أنفية (Alvéolaire Nasale)',
    manner: 'أنفي مجهور',
    ageRange: '2 - 3 سنوات',
    words: {
      initial: { text: 'نَجْمَة', icon: '⭐', ipa: 'nad͡ʒma' },
      medial: { text: 'عِنَب', icon: '🍇', ipa: 'ʕinab' },
      final: { text: 'حِصَان', icon: '🐎', ipa: 'ħisˤa:n' },
    },
  },
  {
    id: 'l',
    symbol: '/ل/',
    letter: 'ل',
    name: 'اللام',
    ipa: 'l',
    category: 'لثوية جانبية (Alvéolaire Latérale)',
    manner: 'جانبي مجهور',
    ageRange: '3 - 4 سنوات',
    words: {
      initial: { text: 'لَيْمُون', icon: '🍋', ipa: 'laymu:n' },
      medial: { text: 'سُلَّم', icon: '🪜', ipa: 'sullam' },
      final: { text: 'عَسَل', icon: '🍯', ipa: 'ʕasal' },
    },
  },
  {
    id: 'r',
    symbol: '/ر/',
    letter: 'ر',
    name: 'الراء (التكرارية)',
    ipa: 'r',
    category: 'لثوية تكرارية (Alvéolaire Vibrante/Rhotique)',
    manner: 'تكراري مجهور (Vibrante)',
    ageRange: '4 - 5 سنوات',
    words: {
      initial: { text: 'رُمَّان', icon: '🍎', ipa: 'rumma:n' },
      medial: { text: 'كُرْسِيّ', icon: '🪑', ipa: 'kursijj' },
      final: { text: 'قَمَر', icon: '🌙', ipa: 'qamar' },
    },
  },

  // د. الأصوات الصفيرية (Sifflantes / Sibilantes)
  {
    id: 's',
    symbol: '/س/',
    letter: 'س',
    name: 'السين',
    ipa: 's',
    category: 'صفيرية لثوية (Sifflante Alvéolaire)',
    manner: 'احتكاكي صفيري مهموس',
    ageRange: '3 - 4 سنوات',
    words: {
      initial: { text: 'سَيَّارَة', icon: '🚗', ipa: 'sayya:ra' },
      medial: { text: 'مَسْبَح', icon: '🏊‍♂️', ipa: 'masbaħ' },
      final: { text: 'شَمْس', icon: '☀️', ipa: 'ʃams' },
    },
  },
  {
    id: 'z',
    symbol: '/ز/',
    letter: 'ز',
    name: 'الزاي',
    ipa: 'z',
    category: 'صفيرية لثوية (Sifflante Alvéolaire)',
    manner: 'احتكاكي صفيري مجهور',
    ageRange: '3 - 4 سنوات',
    words: {
      initial: { text: 'زَرَافَة', icon: '🦒', ipa: 'zara:fa' },
      medial: { text: 'جَزَر', icon: '🥕', ipa: 'd͡ʒazar' },
      final: { text: 'مَوْز', icon: '🍌', ipa: 'mawz' },
    },
  },
  {
    id: 's_emph',
    symbol: '/ص/',
    letter: 'ص',
    name: 'الصاد (المفخمة)',
    ipa: 'sˤ',
    category: 'صفيرية لثوية مفخمة (Sifflante vélarisée)',
    manner: 'احتكاكي صفيري مهموس مفخم',
    ageRange: '4 - 5 سنوات',
    words: {
      initial: { text: 'صَابُون', icon: '🧼', ipa: 'sˤa:bu:n' },
      medial: { text: 'بَصَل', icon: '🧅', ipa: 'basˤal' },
      final: { text: 'مِقَصّ', icon: '✂️', ipa: 'miqasˤsˤ' },
    },
  },

  // هـ. الأصوات الغارية الحنكية ومابعد اللثوية (Palatales / Post-alvéolaires)
  {
    id: 'sh',
    symbol: '/ش/',
    letter: 'ش',
    name: 'الشين',
    ipa: 'ʃ',
    category: 'بعد لثوية غارية (Chuintante Post-alvéolaire)',
    manner: 'احتكاكي مهموس',
    ageRange: '4 - 5 سنوات',
    words: {
      initial: { text: 'شَجَرَة', icon: '🌳', ipa: 'ʃad͡ʒara' },
      medial: { text: 'مِشْط', icon: '🪮', ipa: 'miʃtˤ' },
      final: { text: 'فِرَاش', icon: '🛏️', ipa: 'fira:ʃ' },
    },
  },
  {
    id: 'j',
    symbol: '/ج/',
    letter: 'ج',
    name: 'الجيم',
    ipa: 'd͡ʒ / ʒ',
    category: 'غارية حنكية (Palato-alvéolaire)',
    manner: 'مزدوج / احتكاكي مجهور',
    ageRange: '3 - 4 سنوات',
    words: {
      initial: { text: 'جَمَل', icon: '🐫', ipa: 'd͡ʒamal' },
      medial: { text: 'دَجَاجَة', icon: '🐔', ipa: 'dad͡ʒa:d͡ʒa' },
      final: { text: 'ثَلْج', icon: '❄️', ipa: 'θald͡ʒ' },
    },
  },
  {
    id: 'y',
    symbol: '/ي/',
    letter: 'ي',
    name: 'الياء الساكنة',
    ipa: 'j',
    category: 'غارية حنكية (Palatale)',
    manner: 'شبه صامت مجهور',
    ageRange: '2 - 3 سنوات',
    words: {
      initial: { text: 'يَد', icon: '✋', ipa: 'jad' },
      medial: { text: 'بَيْت', icon: '🏠', ipa: 'bayt' },
      final: { text: 'شَاي', icon: '🍵', ipa: 'ʃa:j' },
    },
  },

  // و. الأصوات الطبقية الحنكية (Vélaires)
  {
    id: 'k',
    symbol: '/ك/',
    letter: 'ك',
    name: 'الكاف',
    ipa: 'k',
    category: 'طبقية حنكية (Vélaire)',
    manner: 'انفجاري مهموس',
    ageRange: '3 - 4 سنوات',
    words: {
      initial: { text: 'كَلْب', icon: '🐕', ipa: 'kalb' },
      medial: { text: 'سَمَكَة', icon: '🐟', ipa: 'samaka' },
      final: { text: 'شُبَّاك', icon: '🪟', ipa: 'ʃubba:k' },
    },
  },
  {
    id: 'kh',
    symbol: '/خ/',
    letter: 'خ',
    name: 'الخاء',
    ipa: 'x',
    category: 'طبقية حنكية رخوة (Vélaire / Uvulaire)',
    manner: 'احتكاكي مهموس',
    ageRange: '4 - 5 سنوات',
    words: {
      initial: { text: 'خَاتَم', icon: '💍', ipa: 'xa:tam' },
      medial: { text: 'نَخْلَة', icon: '🌴', ipa: 'naxla' },
      final: { text: 'بِطِّيخ', icon: '🍉', ipa: 'bitˤtˤi:x' },
    },
  },
  {
    id: 'gh',
    symbol: '/غ/',
    letter: 'غ',
    name: 'الغين',
    ipa: 'ɣ',
    category: 'طبقية حنكية رخوة (Vélaire / Uvulaire)',
    manner: 'احتكاكي مجهور',
    ageRange: '4 - 5 سنوات',
    words: {
      initial: { text: 'غَزَال', icon: '🦌', ipa: 'ɣaza:l' },
      medial: { text: 'بَبَّغَاء', icon: '🦜', ipa: 'babbaɣa:ʔ' },
      final: { text: 'صَمْغ', icon: '🧴', ipa: 'sˤamɣ' },
    },
  },

  // ز. الأصوات اللهوية والحلقية والحنجرية (Uvulaires, Pharyngales, Laryngales)
  {
    id: 'q',
    symbol: '/ق/',
    letter: 'ق',
    name: 'القاف',
    ipa: 'q',
    category: 'لهوية حنكية (Uvulaire)',
    manner: 'انفجاري لهوي',
    ageRange: '4 - 5 سنوات',
    words: {
      initial: { text: 'قِطّ', icon: '🐱', ipa: 'qitˤtˤ' },
      medial: { text: 'بَقَرَة', icon: '🐄', ipa: 'baqara' },
      final: { text: 'إِبْرِيق', icon: '🫖', ipa: 'ʔibri:q' },
    },
  },
  {
    id: 'h_pharyngeal',
    symbol: '/ح/',
    letter: 'ح',
    name: 'الحاء',
    ipa: 'ħ',
    category: 'حلقية (Pharyngale)',
    manner: 'احتكاكي حلقي مهموس',
    ageRange: '4 - 5 سنوات',
    words: {
      initial: { text: 'حِصَان', icon: '🐎', ipa: 'ħisˤa:n' },
      medial: { text: 'لَحْم', icon: '🥩', ipa: 'laħm' },
      final: { text: 'تُفَّاح', icon: '🍎', ipa: 'tuffa:ħ' },
    },
  },
  {
    id: 'ain',
    symbol: '/ع/',
    letter: 'ع',
    name: 'العين',
    ipa: 'ʕ',
    category: 'حلقية (Pharyngale)',
    manner: 'احتكاكي حلقي مجهور',
    ageRange: '4 - 5 سنوات',
    words: {
      initial: { text: 'عَيْن', icon: '👁️', ipa: 'ʕayn' },
      medial: { text: 'ثَعْلَب', icon: '🦊', ipa: 'θaʕlab' },
      final: { text: 'شَمْعَة', icon: '🕯️', ipa: 'ʃamʕa' },
    },
  },
  {
    id: 'hamza',
    symbol: '/ء/',
    letter: 'ء',
    name: 'الهمزة',
    ipa: 'ʔ',
    category: 'حنجرية (Laryngale / Glottale)',
    manner: 'انفجاري حنجري',
    ageRange: '2 - 3 سنوات',
    words: {
      initial: { text: 'أَرْنَب', icon: '🐇', ipa: 'ʔarnab' },
      medial: { text: 'فَأْر', icon: '🐁', ipa: 'faʔr' },
      final: { text: 'مَاء', icon: '💧', ipa: 'ma:ʔ' },
    },
  },
  {
    id: 'ha',
    symbol: '/هـ/',
    letter: 'هـ',
    name: 'الهاء',
    ipa: 'h',
    category: 'حنجرية (Laryngale / Glottale)',
    manner: 'احتكاكي حنجري مهموس',
    ageRange: '3 - 4 سنوات',
    words: {
      initial: { text: 'هِلاَل', icon: '🌙', ipa: 'hila:l' },
      medial: { text: 'زَهْرَة', icon: '🌸', ipa: 'zahra' },
      final: { text: 'وَجْه', icon: '😀', ipa: 'wad͡ʒh' },
    },
  },
];

// 3. الفونيمات الفرنسية (Évaluation Bilingue Arabe/Français en Algérie)
export const FRENCH_PHONEMES = [
  {
    id: 'fr_p',
    symbol: '/p/',
    letter: 'P',
    name: 'P (Français)',
    ipa: 'p',
    category: 'Bilabiale sourde',
    manner: 'Occlusive sourde',
    words: {
      initial: { text: 'Papillon', icon: '🦋', ipa: 'papijɔ̃' },
      medial: { text: 'Sapin', icon: '🌲', ipa: 'sapɛ̃' },
      final: { text: 'Tulipe', icon: '🌷', ipa: 'tylip' },
    },
  },
  {
    id: 'fr_v',
    symbol: '/v/',
    letter: 'V',
    name: 'V (Français)',
    ipa: 'v',
    category: 'Labio-dentale sonore',
    manner: 'Fricative sonore',
    words: {
      initial: { text: 'Vélo', icon: '🚲', ipa: 'velo' },
      medial: { text: 'Avion', icon: '✈️', ipa: 'avjɔ̃' },
      final: { text: 'Livre', icon: '📚', ipa: 'livʁ' },
    },
  },
  {
    id: 'fr_g',
    symbol: '/g/',
    letter: 'G',
    name: 'G (dur)',
    ipa: 'g',
    category: 'Vélaire sonore',
    manner: 'Occlusive sonore',
    words: {
      initial: { text: 'Gâteau', icon: '🎂', ipa: 'gato' },
      medial: { text: 'Bague', icon: '💍', ipa: 'bag' },
      final: { text: 'Toboggan', icon: '🛝', ipa: 'tɔbɔgɑ̃' },
    },
  },
  {
    id: 'fr_ch',
    symbol: '/ʃ/',
    letter: 'CH',
    name: 'CH (Français)',
    ipa: 'ʃ',
    category: 'Post-alvéolaire sourde',
    manner: 'Chuintante sourde',
    words: {
      initial: { text: 'Chapeau', icon: '🎩', ipa: 'ʃapo' },
      medial: { text: 'Cochon', icon: '🐷', ipa: 'kɔʃɔ̃' },
      final: { text: 'Poche', icon: '🧥', ipa: 'pɔʃ' },
    },
  },
  {
    id: 'fr_j',
    symbol: '/ʒ/',
    letter: 'J',
    name: 'J (Français)',
    ipa: 'ʒ',
    category: 'Post-alvéolaire sonore',
    manner: 'Chuintante sonore',
    words: {
      initial: { text: 'Jupe', icon: '👗', ipa: 'ʒyp' },
      medial: { text: 'Bougie', icon: '🕯️', ipa: 'buʒi' },
      final: { text: 'Plage', icon: '🏖️', ipa: 'plaʒ' },
    },
  },
];

// 4. مصفوفة التمييز السمعي الإدراكي للأزواج الصغرى (Discrimination Auditive - Paires Minimales)
export const AUDITORY_DISCRIMINATION_PAIRS = [
  {
    id: 's_vs_sh',
    soundA: 'س',
    soundB: 'ش',
    label: 'سين / س مقابل شين / ش',
    feature: 'المخرج (صفيرية لثوية مقابل تفشّي غاري بعد لثوي)',
    contrastWords: [
      { wordA: 'سَمَكَة', wordB: 'شَمْعَة', iconA: '🐟', iconB: '🕯️' },
      { wordA: 'سَيْف', wordB: 'شَيْخ', iconA: '⚔️', iconB: '👴' },
      { wordA: 'صَفّارَة', wordB: 'شَفّارَة', iconA: '📣', iconB: '✂️' },
    ],
    rehabGoal: 'التمييز السمعي الحركي بين الصفير /s/ والتفشي /ʃ/ وتصحيح موضع طرف اللسان',
  },
  {
    id: 'r_vs_l',
    soundA: 'ر',
    soundB: 'ل',
    label: 'راء / ر مقابل لام / ل',
    feature: 'النمط الحركي (تكراري ذبذبي مقابل جانبي مستمر)',
    contrastWords: [
      { wordA: 'رَمْل', wordB: 'لَمْن', iconA: '🏖️', iconB: '🍋' },
      { wordA: 'قَمَر', wordB: 'قَمَل', iconA: '🌙', iconB: '🪲' },
      { wordA: 'رَاس', wordB: 'لاَس', iconA: '👤', iconB: '🃏' },
    ],
    rehabGoal: 'إدراك ذبذبة رأس اللسان ومنع تحويل الراء إلى لام أو شبه صامت (Lallation)',
  },
  {
    id: 't_vs_t_emph',
    soundA: 'ت',
    soundB: 'ط',
    label: 'تاء / ت مقابل طاء / ط',
    feature: 'الإطباق والتفخيم (مرقق مقابل مفخم مستعلٍ)',
    contrastWords: [
      { wordA: 'تِين', wordB: 'طِين', iconA: '🫐', iconB: '🏺' },
      { wordA: 'تَاب', wordB: 'طَاب', iconA: '🤲', iconB: '🍲' },
      { wordA: 'بَات', wordB: 'بَاط', iconA: '🛌', iconB: '🦆' },
    ],
    rehabGoal: 'ضبط استعلاء أقصى اللسان وتفخيم الصامت دون ترقيقه',
  },
  {
    id: 'd_vs_d_emph',
    soundA: 'د',
    soundB: 'ض',
    label: 'دال / د مقابل ضاد / ض',
    feature: 'الإطباق والتفخيم (انفجاري مرقق مقابل استطالة مفخمة)',
    contrastWords: [
      { wordA: 'دَلّ', wordB: 'ضَلّ', iconA: '👉', iconB: '🧭' },
      { wordA: 'دَبّ', wordB: 'ضَبّ', iconA: '🐻', iconB: '🦎' },
      { wordA: 'دَار', wordB: 'ضَار', iconA: '🏡', iconB: '⚠️' },
    ],
    rehabGoal: 'التمييز السمعي الصوتي بين الدال والضاد وإدراك الفروق النغمية',
  },
  {
    id: 'k_vs_q',
    soundA: 'ك',
    soundB: 'ق',
    label: 'كاف / ك مقابل قاف / ق',
    feature: 'المخرج (طبقي حنكي أمامي مقابل لهوي حنجري خلفي)',
    contrastWords: [
      { wordA: 'كَلْب', wordB: 'قَلْب', iconA: '🐕', iconB: '❤️' },
      { wordA: 'كَمَر', wordB: 'قَمَر', iconA: '🥋', iconB: '🌙' },
      { wordA: 'كِير', wordB: 'قِير', iconA: '🔥', iconB: '🛣️' },
    ],
    rehabGoal: 'إرجاع مخرج القاف إلى المنطقة اللهوية وتفادي تحويلها إلى كاف أمامية',
  },
  {
    id: 'f_vs_b',
    soundA: 'ف',
    soundB: 'ب',
    label: 'فاء / ف مقابل باء / ب',
    feature: 'الجهر والنمط (احتكاكي مهموس شفاهي-أسناني مقابل انفجاري مجهور شفتين)',
    contrastWords: [
      { wordA: 'فِيل', wordB: 'بِيل', iconA: '🐘', iconB: '🔋' },
      { wordA: 'فَرّ', wordB: 'بَرّ', iconA: '🏃', iconB: '🏜️' },
      { wordA: 'فَرَح', wordB: 'بَرَح', iconA: '🎉', iconB: '⛺' },
    ],
    rehabGoal: 'التمييز بين الاحتكاكي الأسنان الشفوية والانفجار الشفوي التام',
  },
  {
    id: 'dh_vs_z',
    soundA: 'ذ',
    soundB: 'ز',
    label: 'ذال / ذ مقابل زاي / ز',
    feature: 'المخرج (بين أسنانية مقابل صفيرية لثوية خلف الأسنان)',
    contrastWords: [
      { wordA: 'ذَيْل', wordB: 'زَيْت', iconA: '🐈', iconB: '🫒' },
      { wordA: 'ذَاق', wordB: 'زَاق', iconA: '👅', iconB: '🐦' },
      { wordA: 'نَذْر', wordB: 'نَزْر', iconA: '🕯️', iconB: '💧' },
    ],
    rehabGoal: 'منع إدخال اللسان للخلف وتصحيح موضع طرف اللسان بين الأسنان',
  },
  {
    id: 's_vs_s_emph',
    soundA: 'س',
    soundB: 'ص',
    label: 'سين / س مقابل صاد / ص',
    feature: 'التفخيم والاستعلاء (مرقق مقابل مفخم مستعلٍ)',
    contrastWords: [
      { wordA: 'سَيْف', wordB: 'صَيْف', iconA: '⚔️', iconB: '☀️' },
      { wordA: 'سَبْر', wordB: 'صَبْر', iconA: '🔍', iconB: '⏳' },
      { wordA: 'سَاد', wordB: 'صَاد', iconA: '👑', iconB: '🎣' },
    ],
    rehabGoal: 'إدراك التفخيم الصوتي واستعلاء مؤخرة اللسان عند نطق الصاد',
  },
  {
    id: 'h_vs_kh',
    soundA: 'ح',
    soundB: 'خ',
    label: 'حاء / ح مقابل خاء / خ',
    feature: 'المخرج (حلقي أوسط مقابل رخاوة طبقية عليا)',
    contrastWords: [
      { wordA: 'حَال', wordB: 'خَال', iconA: '😊', iconB: '👨' },
      { wordA: 'حَوْض', wordB: 'خَوْض', iconA: '🛁', iconB: '🌊' },
      { wordA: 'حَرّ', wordB: 'خَرّ', iconA: '🔥', iconB: '🍂' },
    ],
    rehabGoal: 'التمييز بين الاحتكاك الحلقي الناعم والاحتكاك الطبقي الخشن',
  },
  {
    id: 'j_vs_sh',
    soundA: 'ج',
    soundB: 'ش',
    label: 'جيم / ج مقابل شين / ش',
    feature: 'الجهر (مجهور بانفجار خفيف مقابل احتكاكي مهموس)',
    contrastWords: [
      { wordA: 'جَمَل', wordB: 'شَمَل', iconA: '🐫', iconB: '🧥' },
      { wordA: 'جَرّ', wordB: 'شَرّ', iconA: '🚜', iconB: '💥' },
      { wordA: 'جَوْخ', wordB: 'شَوْخ', iconA: '🧣', iconB: '🪵' },
    ],
    rehabGoal: 'تشغيل الأوتار الصوتية (الجهر) مع الجيم والتمييز السمعي',
  },
];

// 5. أنواع الأخطاء النطقية والفونولوجية المعيارية
export const PHONETIC_ERROR_TYPES = [
  {
    id: 'correct',
    label: 'سليم (Correct)',
    shortLabel: '🟢 سليم',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    color: '#10b981',
    description: 'النطق صحيح تماماً بمخرجه وصفته السليمة',
  },
  {
    id: 'distortion',
    label: 'تشويه (Distortion)',
    shortLabel: '🟡 تشويه',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    color: '#f59e0b',
    subtypes: [
      { id: 'sigmatisme_interdental', label: 'لدغة بين-أسنانية (Interdental)' },
      { id: 'sigmatisme_lateral', label: 'لدغة جانبية مع تسرب اللعاب (Latéral)' },
      { id: 'chuintement', label: 'تحويل الصفير لتفشي رخو (Chuintement)' },
      { id: 'rhotacisme_guttural', label: 'رثأة راء حنجرية فرنسية (Gutturale)' },
      { id: 'nasalization', label: 'تسرب هوائي أنفي غير مرغوب (Nasalisation)' },
    ],
    description: 'المخرج مقارب لكن المجرى الهوائي مشوه أو غير متزن',
  },
  {
    id: 'omission',
    label: 'حذف (Omission)',
    shortLabel: '🔴 حذف',
    badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    color: '#f43f5e',
    description: 'إسقاط الصوت بالكامل من الكلمة (مثال: "بَاب" تنطق "ـَاب")',
  },
  {
    id: 'substitution',
    label: 'إبدال (Substitution)',
    shortLabel: '🔵 إبدال',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    color: '#3b82f6',
    description: 'استبدال الصوت بصوت آخر (مثال: إبدال الراء باللام أو الياء)',
  },
];

// 6. دوال حساب مقياس النسبة المئوية لدقة الحروف الساكنة (PCC Formula)
/**
 * PCC = (Correct Consonants / Total Consonants Evaluated) * 100
 * Normative Cutoffs (Shriberg & Kwiatkowski):
 * > 85%: Mild (خفيف)
 * 65% - 85%: Mild-to-Moderate (خفيف إلى متوسط)
 * 50% - 65%: Moderate-to-Severe (متوسط إلى شديد)
 * < 50%: Severe (شديد جداً)
 */
export function calculatePCC(phoneticInventory) {
  if (!phoneticInventory || typeof phoneticInventory !== 'object') {
    return {
      totalEvaluated: 0,
      correctCount: 0,
      distortedCount: 0,
      omittedCount: 0,
      substitutedCount: 0,
      pccPercentage: 100,
      severity: 'mild',
      severityLabelAr: 'تطور سليم / اضطراب خفيف جداً',
      severityColor: '#10b981',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
  }

  let total = 0;
  let correct = 0;
  let distorted = 0;
  let omitted = 0;
  let substituted = 0;

  // Inventory structure: { [phonemeId]: { initial: 'correct', medial: 'distortion', final: 'correct', ... } }
  Object.values(phoneticInventory).forEach((positions) => {
    if (!positions || typeof positions !== 'object') return;
    ['initial', 'medial', 'final'].forEach((pos) => {
      const state = positions[pos]?.status || positions[pos];
      if (state) {
        total++;
        if (state === 'correct') correct++;
        else if (state === 'distortion') distorted++;
        else if (state === 'omission') omitted++;
        else if (state === 'substitution') substituted++;
      }
    });
  });

  if (total === 0) {
    return {
      totalEvaluated: 0,
      correctCount: 0,
      distortedCount: 0,
      omittedCount: 0,
      substitutedCount: 0,
      pccPercentage: 100,
      severity: 'mild',
      severityLabelAr: 'لم يتم تسجيل أصوات بعد',
      severityColor: '#94a3b8',
      badgeClass: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
  }

  const percentage = Math.round((correct / total) * 100);

  let severity = 'mild';
  let severityLabelAr = 'اضطراب خفيف (Mild)';
  let severityColor = '#10b981';
  let badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

  if (percentage < 50) {
    severity = 'severe';
    severityLabelAr = 'اضطراب نطقي وفونولوجي شديد جداً (Severe)';
    severityColor = '#f43f5e';
    badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  } else if (percentage < 65) {
    severity = 'moderate_severe';
    severityLabelAr = 'اضطراب متوسط إلى شديد (Moderate-to-Severe)';
    severityColor = '#f97316';
    badgeClass = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  } else if (percentage < 85) {
    severity = 'mild_moderate';
    severityLabelAr = 'اضطراب خفيف إلى متوسط (Mild-to-Moderate)';
    severityColor = '#f59e0b';
    badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  } else {
    severity = 'mild';
    severityLabelAr = 'نطق سليم إلى خفيف جداً (Normal / Mild)';
    severityColor = '#10b981';
    badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  }

  return {
    totalEvaluated: total,
    correctCount: correct,
    distortedCount: distorted,
    omittedCount: omitted,
    substitutedCount: substituted,
    pccPercentage: percentage,
    severity,
    severityLabelAr,
    severityColor,
    badgeClass,
  };
}
