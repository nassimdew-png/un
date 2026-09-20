// =========================================================================
// PSYCHOMOTOR & SENSORY CLINICAL DATA BANK (PsychomotorData.js)
// PsyPro / ClinicSaaS Standardized Clinical Motor Assessment Protocol
// =========================================================================

export const TONUS_STATES = {
  eutonie: {
    id: 'eutonie',
    labelAr: 'نغمة سوية (Eutonie)',
    labelFr: 'Eutonie (Tonus normal)',
    description: 'مرونة طبيعية ومقاومة ملائمة للحركة المنفعلة مع ارتخاء كافٍ عند الراحة',
    color: '#64748b',
    fillColor: '#334155',
    activeGlow: 'rgba(100, 116, 139, 0.5)',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
  hypertonie: {
    id: 'hypertonie',
    labelAr: 'فرط توتر عضلي (Hypertonie)',
    labelFr: 'Hypertonie / Spasticité',
    description: 'تصلب وزيادة في المقاومة الحركية، صعوبة في الانبساط، وتوتر عضلي مستمر',
    color: '#f59e0b',
    fillColor: '#d97706',
    activeGlow: 'rgba(245, 158, 11, 0.7)',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  hypotonie: {
    id: 'hypotonie',
    labelAr: 'رخاوة عضلية (Hypotonie)',
    labelFr: 'Hypotonie / Flaccidité',
    description: 'تدني المقاومة العضلية، زيادة في سعة الحركة والمفاصل، رخاوة عند الثبات',
    color: '#06b6d4',
    fillColor: '#0891b2',
    activeGlow: 'rgba(6, 182, 212, 0.7)',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  paratonie: {
    id: 'paratonie',
    labelAr: 'باراتونيا / صعوبة استرخاء (Paratonie)',
    labelFr: 'Paratonie (Opposition / Gel)',
    description: 'مقاومة لاإرادية متغيرة تزداد مع محاولات الفاحص، وصعوبة استرخاء إرادي',
    color: '#8b5cf6',
    fillColor: '#7c3aed',
    activeGlow: 'rgba(139, 92, 246, 0.7)',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  syncinesie: {
    id: 'syncinesie',
    labelAr: 'حركات مرافقة لاإرادية (Syncinésie)',
    labelFr: 'Syncinésie (Mouvements associés)',
    description: 'حركات غير مقصودة في الطرف المقابل أو الوجه عند أداء حركة إرادية',
    color: '#ec4899',
    fillColor: '#db2777',
    activeGlow: 'rgba(236, 72, 153, 0.7)',
    badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
};

export const SENSORY_STATES = {
  normosensible: {
    id: 'normosensible',
    labelAr: 'تحسس لمسي سوي (Normosensible)',
    labelFr: 'Normosensible',
    description: 'استجابة متزنة وتكامل لمسي سليم مع المحيط',
    color: '#64748b',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
  hypersensible: {
    id: 'hypersensible',
    labelAr: 'فرط تحسس / تجنب دفاعي (Défense tactile)',
    labelFr: 'Hypersensibilité / Défense tactile',
    description: 'رد فعل مبالغ فيه وانزعاج أو انسحاب دفاعي عند لمس المنطقة أو الملابس',
    color: '#f43f5e',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  hyposensible: {
    id: 'hyposensible',
    labelAr: 'نقص تحسس / بحث حسي (Recherche sensorielle)',
    labelFr: 'Hyposensibilité / Recherche tactile',
    description: 'تدني استشعار المنبهات اللمسية أو بحث مستمر عن ضغط واحتكاك حركي عميق',
    color: '#10b981',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  astereognosie: {
    id: 'astereognosie',
    labelAr: 'ضعف تمييز الملامس (Astéréognosie)',
    labelFr: 'Discrimination tactile déficitaire',
    description: 'صعوبة التعرف على الأشياء أو الملامس بمجرد اللمس دون الرؤية',
    color: '#eab308',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
};

// ANATOMICAL REGIONS FOR BODY MAP
export const ANATOMICAL_ZONES = [
  // --- ANTERIOR ZONES ---
  {
    id: 'head_anterior',
    view: 'anterior',
    labelAr: 'الرأس والوجه',
    labelFr: 'Tête & Visage',
    category: 'axial',
    bilateral: false,
  },
  {
    id: 'neck_anterior',
    view: 'anterior',
    labelAr: 'العنق والحنجرة',
    labelFr: 'Cou antérieur',
    category: 'axial',
    bilateral: false,
  },
  {
    id: 'shoulder_right',
    view: 'anterior',
    labelAr: 'الكتف الأيمن',
    labelFr: 'Épaule droite',
    category: 'upper_limb',
    side: 'right',
  },
  {
    id: 'shoulder_left',
    view: 'anterior',
    labelAr: 'الكتف الأيسر',
    labelFr: 'Épaule gauche',
    category: 'upper_limb',
    side: 'left',
  },
  {
    id: 'chest',
    view: 'anterior',
    labelAr: 'الصدر والقفص الصدري',
    labelFr: 'Thorax & Poitrine',
    category: 'trunk',
    bilateral: false,
  },
  {
    id: 'abdomen',
    view: 'anterior',
    labelAr: 'البطن والمركز (Core)',
    labelFr: 'Abdomen & Tronc',
    category: 'trunk',
    bilateral: false,
  },
  {
    id: 'pelvis_anterior',
    view: 'anterior',
    labelAr: 'الحوض والمنطقة الإربية',
    labelFr: 'Bassin antérieur',
    category: 'pelvis',
    bilateral: false,
  },
  {
    id: 'arm_right',
    view: 'anterior',
    labelAr: 'العضد الأيمن',
    labelFr: 'Bras droit',
    category: 'upper_limb',
    side: 'right',
  },
  {
    id: 'arm_left',
    view: 'anterior',
    labelAr: 'العضد الأيسر',
    labelFr: 'Bras gauche',
    category: 'upper_limb',
    side: 'left',
  },
  {
    id: 'forearm_right',
    view: 'anterior',
    labelAr: 'الساعد الأيمن',
    labelFr: 'Avant-bras droit',
    category: 'upper_limb',
    side: 'right',
  },
  {
    id: 'forearm_left',
    view: 'anterior',
    labelAr: 'الساعد الأيسر',
    labelFr: 'Avant-bras gauche',
    category: 'upper_limb',
    side: 'left',
  },
  {
    id: 'hand_right',
    view: 'anterior',
    labelAr: 'اليد والمعصم الأيمن',
    labelFr: 'Main & Poignet droit',
    category: 'extremity',
    side: 'right',
  },
  {
    id: 'hand_left',
    view: 'anterior',
    labelAr: 'اليد والمعصم الأيسر',
    labelFr: 'Main & Poignet gauche',
    category: 'extremity',
    side: 'left',
  },
  {
    id: 'thigh_right',
    view: 'anterior',
    labelAr: 'الفخذ الأيمن (رباعية الرؤوس)',
    labelFr: 'Cuisse droite (Quadriceps)',
    category: 'lower_limb',
    side: 'right',
  },
  {
    id: 'thigh_left',
    view: 'anterior',
    labelAr: 'الفخذ الأيسر (رباعية الرؤوس)',
    labelFr: 'Cuisse gauche (Quadriceps)',
    category: 'lower_limb',
    side: 'left',
  },
  {
    id: 'knee_right',
    view: 'anterior',
    labelAr: 'الركبة اليمنى والرضفة',
    labelFr: 'Genou droit & Rotule',
    category: 'joint',
    side: 'right',
  },
  {
    id: 'knee_left',
    view: 'anterior',
    labelAr: 'الركبة اليسرى والرضفة',
    labelFr: 'Genou gauche & Rotule',
    category: 'joint',
    side: 'left',
  },
  {
    id: 'leg_right',
    view: 'anterior',
    labelAr: 'الساق والقصبة اليمنى',
    labelFr: 'Jambe & Tibia droit',
    category: 'lower_limb',
    side: 'right',
  },
  {
    id: 'leg_left',
    view: 'anterior',
    labelAr: 'الساق والقصبة اليسرى',
    labelFr: 'Jambe & Tibia gauche',
    category: 'lower_limb',
    side: 'left',
  },
  {
    id: 'foot_right',
    view: 'anterior',
    labelAr: 'القدم ومشط القدم الأيمن',
    labelFr: 'Pied & Cheville droite',
    category: 'extremity',
    side: 'right',
  },
  {
    id: 'foot_left',
    view: 'anterior',
    labelAr: 'القدم ومشط القدم الأيسر',
    labelFr: 'Pied & Cheville gauche',
    category: 'extremity',
    side: 'left',
  },

  // --- POSTERIOR ZONES ---
  {
    id: 'head_posterior',
    view: 'posterior',
    labelAr: 'مؤخرة الرأس والقمحدوة',
    labelFr: 'Occiput & Tête postérieure',
    category: 'axial',
    bilateral: false,
  },
  {
    id: 'neck_posterior',
    view: 'posterior',
    labelAr: 'مؤخرة العنق والفقرات الرقبية',
    labelFr: 'Nuque & Rachis cervical',
    category: 'axial',
    bilateral: false,
  },
  {
    id: 'upper_back',
    view: 'posterior',
    labelAr: 'أعلى الظهر واللوحان (Scapula)',
    labelFr: 'Haut du dos & Omoplates',
    category: 'trunk',
    bilateral: false,
  },
  {
    id: 'lower_back',
    view: 'posterior',
    labelAr: 'أسفل الظهر والفقرات القطنية',
    labelFr: 'Bas du dos & Rachis lombaire',
    category: 'trunk',
    bilateral: false,
  },
  {
    id: 'gluteal',
    view: 'posterior',
    labelAr: 'المقعدة والحوض الخلفي',
    labelFr: 'Fessiers & Bassin postérieur',
    category: 'pelvis',
    bilateral: false,
  },
  {
    id: 'arm_right_post',
    view: 'posterior',
    labelAr: 'خلف العضد الأيمن (ثلاثية الرؤوس)',
    labelFr: 'Bras postérieur droit (Triceps)',
    category: 'upper_limb',
    side: 'right',
  },
  {
    id: 'arm_left_post',
    view: 'posterior',
    labelAr: 'خلف العضد الأيسر (ثلاثية الرؤوس)',
    labelFr: 'Bras postérieur gauche (Triceps)',
    category: 'upper_limb',
    side: 'left',
  },
  {
    id: 'elbow_right',
    view: 'posterior',
    labelAr: 'المرفق الأيمن (الزج)',
    labelFr: 'Coude droit',
    category: 'joint',
    side: 'right',
  },
  {
    id: 'elbow_left',
    view: 'posterior',
    labelAr: 'المرفق الأيسر (الزج)',
    labelFr: 'Coude gauche',
    category: 'joint',
    side: 'left',
  },
  {
    id: 'forearm_right_post',
    view: 'posterior',
    labelAr: 'خلف الساعد الأيمن',
    labelFr: 'Avant-bras postérieur droit',
    category: 'upper_limb',
    side: 'right',
  },
  {
    id: 'forearm_left_post',
    view: 'posterior',
    labelAr: 'خلف الساعد الأيسر',
    labelFr: 'Avant-bras postérieur gauche',
    category: 'upper_limb',
    side: 'left',
  },
  {
    id: 'hand_right_post',
    view: 'posterior',
    labelAr: 'ظهر اليد اليمنى',
    labelFr: 'Dos de la main droite',
    category: 'extremity',
    side: 'right',
  },
  {
    id: 'hand_left_post',
    view: 'posterior',
    labelAr: 'ظهر اليد اليسرى',
    labelFr: 'Dos de la main gauche',
    category: 'extremity',
    side: 'left',
  },
  {
    id: 'thigh_right_post',
    view: 'posterior',
    labelAr: 'خلف الفخذ الأيمن (الأوتار المأبضية)',
    labelFr: 'Cuisse postérieure droite (Ischio-jambiers)',
    category: 'lower_limb',
    side: 'right',
  },
  {
    id: 'thigh_left_post',
    view: 'posterior',
    labelAr: 'خلف الفخذ الأيسر (الأوتار المأبضية)',
    labelFr: 'Cuisse postérieure gauche (Ischio-jambiers)',
    category: 'lower_limb',
    side: 'left',
  },
  {
    id: 'knee_right_post',
    view: 'posterior',
    labelAr: 'الحفرة المأبضية اليمنى',
    labelFr: 'Creux poplité droit',
    category: 'joint',
    side: 'right',
  },
  {
    id: 'knee_left_post',
    view: 'posterior',
    labelAr: 'الحفرة المأبضية اليسرى',
    labelFr: 'Creux poplité gauche',
    category: 'joint',
    side: 'left',
  },
  {
    id: 'calf_right',
    view: 'posterior',
    labelAr: 'بطة الساق اليمنى (ربلة الساق)',
    labelFr: 'Mollet droit (Gastrocnémien)',
    category: 'lower_limb',
    side: 'right',
  },
  {
    id: 'calf_left',
    view: 'posterior',
    labelAr: 'بطة الساق اليسرى (ربلة الساق)',
    labelFr: 'Mollet gauche (Gastrocnémien)',
    category: 'lower_limb',
    side: 'left',
  },
  {
    id: 'foot_right_post',
    view: 'posterior',
    labelAr: 'العقب وكعب القدم الأيمن',
    labelFr: 'Talon & Tendon d\'Achille droit',
    category: 'extremity',
    side: 'right',
  },
  {
    id: 'foot_left_post',
    view: 'posterior',
    labelAr: 'العقب وكعب القدم الأيسر',
    labelFr: 'Talon & Tendon d\'Achille gauche',
    category: 'extremity',
    side: 'left',
  },
];

// ==========================================
// 2. STANDARDIZED CLINICAL BALANCE BATTERY
// ==========================================

export const STATIC_BALANCE_TESTS = [
  {
    id: 'romberg_eyes_open',
    titleAr: 'اختبار رومبرغ (عيون مفتوحة - 30 ثانية)',
    titleFr: 'Test de Romberg (Yeux ouverts - 30s)',
    instructions: 'الوقوف منتصباً مع إلصاق القدمين تماماً واليدين بمحاذاة الجسم لمدة 30 ثانية مع تثبيت البصر',
    options: [
      { id: 'stable', labelAr: 'ثبات تام وممتاز', score: 3, flag: 'normal' },
      { id: 'mild_sway', labelAr: 'تمايل خفيف وتعديل مستمر', score: 2, flag: 'borderline' },
      { id: 'unstable', labelAr: 'فقدان توازن وتحريك القدمين', score: 1, flag: 'deficit' },
      { id: 'fall_risk', labelAr: 'سقوط وشيك / عجز عن الثبات', score: 0, flag: 'severe' },
    ],
  },
  {
    id: 'romberg_eyes_closed',
    titleAr: 'اختبار رومبرغ (عيون مغلقة - 30 ثانية)',
    titleFr: 'Test de Romberg (Yeux fermés - Signe de Romberg)',
    instructions: 'نفس الوضعية السابقة مع إغلاق العينين بالكامل لتقييم الاعتماد على الحس العميق والتيهي',
    options: [
      { id: 'negative', labelAr: 'سلبي: ثبات طبيعي بدون ترنح', score: 3, flag: 'normal' },
      { id: 'proprioceptive_sway', labelAr: 'ترنح يزداد بغلق العينين (خلل حس عميق)', score: 1, flag: 'deficit' },
      { id: 'vestibular_deviation', labelAr: 'انحراف نحو جهة معينة (علامة دهليزية)', score: 1, flag: 'deficit' },
      { id: 'immediate_loss', labelAr: 'فقدان فوري للتوازن وسقوط', score: 0, flag: 'severe' },
    ],
  },
  {
    id: 'flamingo_stance',
    titleAr: 'الوقوف على قدم واحدة (Flamant Rose)',
    titleFr: 'Appui monopodal (Flamant Rose chronométré)',
    instructions: 'رفع ساق واحدة وثني الركبة بزاوية 90 درجة والثبات لأطول فترة ممكنة (بالثواني)',
    hasStopwatch: true,
    ageNorms: {
      under_5: 'المعيار: > 5 ثوانٍ',
      age_6_8: 'المعيار: > 15 ثانية',
      age_9_plus: 'المعيار: > 30 ثانية',
    },
  },
];

export const DYNAMIC_BALANCE_TESTS = [
  {
    id: 'tandem_gait',
    titleAr: 'المشي على خط مستقيم (كعب-مشط / Marche en tandem)',
    titleFr: 'Marche talon-pointe en ligne droite (10 pas)',
    instructions: 'المشي 10 خطوات متتالية بحيث يلامس كعب القدم المتقدمة أصابع القدم الخلفية بدقة',
    options: [
      { id: 'perfect', labelAr: 'مشية سلسة ومتوازنة على الخط', score: 3 },
      { id: 'deviations', labelAr: 'خروج متكرر عن الخط مع فتح الذراعين', score: 2 },
      { id: 'frequent_stops', labelAr: 'توقفات متكررة وتعثر وتعديل غير فعال', score: 1 },
      { id: 'unable', labelAr: 'عجز كامل عن التنسيق والمشي الترادفي', score: 0 },
    ],
  },
  {
    id: 'unipedal_hopping',
    titleAr: 'القفز على ساق واحدة (Saut unipodal)',
    titleFr: 'Saut à cloche-pied (5 sauts consécutifs par jambe)',
    instructions: 'القفز 5 قفزات متتالية للأمام على الساق اليمنى ثم اليسرى دون وضع القدم الأخرى',
    options: [
      { id: 'bilateral_good', labelAr: 'إتقان متناظر وسلس على الساقين', score: 3 },
      { id: 'asymmetric', labelAr: 'تفاوت واضح بين الساقين (ضعف جهة)', score: 2 },
      { id: 'poor_landing', labelAr: 'هبوط غير متزن وفقدان للاتزان', score: 1 },
      { id: 'cannot_hop', labelAr: 'عجز عن القفز برجل واحدة', score: 0 },
    ],
  },
  {
    id: 'obstacle_stepping',
    titleAr: 'تخطي العوائق وتعديل الخطوة (Franchissement)',
    titleFr: 'Franchissement d\'obstacles & régulation de foulée',
    instructions: 'تخطي عوارض أرضية بارتفاعات متفاوتة مع الحفاظ على سرعة المشي وتناسق الجذع',
    options: [
      { id: 'adapted', labelAr: 'تعديل حركي ممتاز وتقدير دقيق للمسافة', score: 3 },
      { id: 'hesitant', labelAr: 'تردد وتصلب حركي ملحوظ', score: 2 },
      { id: 'tripping', labelAr: 'اصطدام متكرر وضعف التخطيط الحركي', score: 1 },
    ],
  },
];

// ==========================================
// 3. LATERALIZATION BATTERY (Harris & Zazzo)
// ==========================================

export const LATERALIZATION_ITEMS = [
  {
    id: 'hand_writing',
    domain: 'hand',
    titleAr: 'اليد: الكتابة والرسم',
    titleFr: 'Main : Écriture et dessin',
    options: [
      { id: 'right', labelAr: 'يمنى قطعية (D)' },
      { id: 'left', labelAr: 'يسرى قطعية (G)' },
      { id: 'mixed', labelAr: 'تبادل / غير محددة (Ambi)' },
    ],
  },
  {
    id: 'hand_scissors',
    domain: 'hand',
    titleAr: 'اليد: استخدام المقص',
    titleFr: 'Main : Utilisation des ciseaux',
    options: [
      { id: 'right', labelAr: 'يمنى (D)' },
      { id: 'left', labelAr: 'يسرى (G)' },
      { id: 'mixed', labelAr: 'تبادل (Ambi)' },
    ],
  },
  {
    id: 'hand_throw',
    domain: 'hand',
    titleAr: 'اليد: رمي الكرة',
    titleFr: 'Main : Lancer de balle',
    options: [
      { id: 'right', labelAr: 'يمنى (D)' },
      { id: 'left', labelAr: 'يسرى (G)' },
      { id: 'mixed', labelAr: 'تبادل (Ambi)' },
    ],
  },
  {
    id: 'eye_monocular',
    domain: 'eye',
    titleAr: 'العين: النظر عبر منظار أو أنبوب',
    titleFr: 'Œil : Regarder à travers un monoculaire',
    options: [
      { id: 'right', labelAr: 'يمنى (D)' },
      { id: 'left', labelAr: 'يسرى (G)' },
      { id: 'mixed', labelAr: 'مترددة' },
    ],
  },
  {
    id: 'eye_peep_hole',
    domain: 'eye',
    titleAr: 'العين: التصويب عبر ثقب في ورقة',
    titleFr: 'Œil : Viser à travers un trou',
    options: [
      { id: 'right', labelAr: 'يمنى (D)' },
      { id: 'left', labelAr: 'يسرى (G)' },
      { id: 'mixed', labelAr: 'مترددة' },
    ],
  },
  {
    id: 'foot_kick',
    domain: 'foot',
    titleAr: 'القدم: ركل الكرة بقوة',
    titleFr: 'Pied : Frapper dans un ballon',
    options: [
      { id: 'right', labelAr: 'يمنى (D)' },
      { id: 'left', labelAr: 'يسرى (G)' },
      { id: 'mixed', labelAr: 'تبادل' },
    ],
  },
  {
    id: 'foot_stairs',
    domain: 'foot',
    titleAr: 'القدم: صعود الدرجة الأولى',
    titleFr: 'Pied : Première marche d\'escalier',
    options: [
      { id: 'right', labelAr: 'يمنى (D)' },
      { id: 'left', labelAr: 'يسرى (G)' },
      { id: 'mixed', labelAr: 'تبادل' },
    ],
  },
];

// ====================================================
// 4. VISUO-MOTOR COORDINATION & FINE MOTOR BATTERY
// ====================================================

export const VISUO_MOTOR_TESTS = [
  {
    id: 'diadochokinesia',
    titleAr: 'اختبار حركات الدمية السريعة (Épreuve des marionnettes)',
    titleFr: 'Diadochokinésie & Praxies gestuelles',
    description: 'دوران اليدين التبادلي السريع (Pronation / Supination) لفحص السلاسة والسينكينيزيا',
    options: [
      { id: 'fluid', labelAr: 'سلسة، متزامنة، وبدون حركات مرافقة', score: 3 },
      { id: 'syncinesie_present', labelAr: 'حركات مرافقة فموية أو في الطرف المقابل', score: 2 },
      { id: 'arrhythmic', labelAr: 'بطء ملحوظ وتقطع في الإيقاع', score: 1 },
      { id: 'dyspraxic', labelAr: 'عسر حركي وفقدان التسلسل الحركي (Dyspraxie)', score: 0 },
    ],
  },
  {
    id: 'finger_nose',
    titleAr: 'اختبار إصبع-أنف (Épreuve Doigt-Nez)',
    titleFr: 'Coordination segmentaire Doigt-Nez (Dysmétrie)',
    description: 'لمس طرف الأنف بسبابة اليد الممدودة مفتوح العينين ثم مغمضهما لتقييم الرنح والديسميتريا',
    options: [
      { id: 'precise', labelAr: 'إصابة دقيقة للهدف بحركة مباشرة', score: 3 },
      { id: 'mild_tremor', labelAr: 'رعشة نهائية طفيفة (Tremblement d\'intention)', score: 2 },
      { id: 'dysmetria', labelAr: 'خلل قياس المسافة وتجاوز الأنف (Dysmétrie)', score: 1 },
      { id: 'severe_ataxia', labelAr: 'رنح حركي وعدم استقرار حاد', score: 0 },
    ],
  },
  {
    id: 'pencil_grasp',
    titleAr: 'نمط قبضة القلم والكتابة (Prise du crayon)',
    titleFr: 'Préhension graphique du crayon',
    description: 'فحص تموضع الأصابع والضغط على الورقة أثناء التخطيط والكتابة',
    options: [
      { id: 'dynamic_tripod', labelAr: 'قبضة ثلاثية ديناميكية ناضجة (Tripode dynamique)', score: 3 },
      { id: 'static_tripod', labelAr: 'قبضة ثلاثية صلبة بدون حركة مستقلة للأصابع', score: 2 },
      { id: 'palmar_immature', labelAr: 'قبضة راحية بدائية بكف اليد (Prise palmaire)', score: 1 },
      { id: 'hyper_pressure', labelAr: 'فرط ضغط وتشنج مع تمزق الورق أو إجهاد سريع', score: 1 },
    ],
  },
];

// ==========================================
// 5. SPATIAL-TEMPORAL ORGANIZATION BATTERY
// ==========================================

export const SPATIAL_TEMPORAL_TESTS = [
  {
    id: 'piaget_head_self',
    titleAr: 'اختبار بياجيه-هيد: تمييز اليمين/اليسار على الذات',
    titleFr: 'Test de Piaget-Head (Sur soi-même)',
    description: 'أرني يدك اليمنى، أذنك اليسرى، ضع يدك اليمنى على عينك اليسرى (أوامر متصالبة)',
    options: [
      { id: 'mastered', labelAr: 'متقن تماماً (معرفة مباشرة ومتصالبة)', score: 3 },
      { id: 'simple_only', labelAr: 'يعرف اليمين واليسار البسيط دون المتصالب', score: 2 },
      { id: 'confused', labelAr: 'خلط وتردد مستمر', score: 1 },
      { id: 'unknown', labelAr: 'عجز كامل عن التمييز', score: 0 },
    ],
  },
  {
    id: 'piaget_head_examiner',
    titleAr: 'اختبار بياجيه-هيد: تمييز اليمين/اليسار على الفاحص المواجه',
    titleFr: 'Test de Piaget-Head (Sur autrui en miroir)',
    description: 'أشر إلى اليد اليمنى للفاحص، وأذنه اليسرى مع إسقاط التناظر المرآوي',
    options: [
      { id: 'decentered', labelAr: 'إدراك متقن للا لامتمركزية المكانية (Décentration)', score: 3 },
      { id: 'mirror_error', labelAr: 'خطأ المرآة (يعتقد أن يمينه هو يمين الفاحص)', score: 1 },
      { id: 'failed', labelAr: 'عجز عن التصور الفضائي للمواجه', score: 0 },
    ],
  },
  {
    id: 'stambak_rhythms',
    titleAr: 'إعادة إنتاج التراكيب الإيقاعية لستانباك',
    titleFr: 'Reproduction de structures rythmiques de Stambak',
    description: 'قرع إيقاعات متتابعة (oo o, o oo, oo oo) ومطالبة المفحوص بتقليدها فوراً',
    options: [
      { id: 'perfect_tempo', labelAr: 'إعادة إنتاج إيقاعية مطابقة وسلسة', score: 3 },
      { id: 'slow_pause', labelAr: 'صعوبة في الفواصل الزمنية والتسارع', score: 2 },
      { id: 'structural_error', labelAr: 'أخطاء في عدد الضربات وبنيتها', score: 1 },
      { id: 'disorganized', labelAr: 'تشتت زماني وعجز عن ضبط الإيقاع', score: 0 },
    ],
  },
];

// ==========================================
// 6. CLINICAL HELPER & SYNTHESIS FUNCTIONS
// ==========================================

export function calculateBodyMapStats(bodyMapState = {}) {
  const zones = Object.values(bodyMapState);
  let hypertonieCount = 0;
  let hypotonieCount = 0;
  let paratonieCount = 0;
  let syncinesieCount = 0;
  let hypersensibleCount = 0;
  let hyposensibleCount = 0;

  zones.forEach((z) => {
    if (z.tonus === 'hypertonie') hypertonieCount++;
    if (z.tonus === 'hypotonie') hypotonieCount++;
    if (z.tonus === 'paratonie') paratonieCount++;
    if (z.tonus === 'syncinesie') syncinesieCount++;

    if (z.sensory === 'hypersensible') hypersensibleCount++;
    if (z.sensory === 'hyposensible') hyposensibleCount++;
  });

  const totalEvaluated = zones.length;
  const abnormalTonusCount = hypertonieCount + hypotonieCount + paratonieCount + syncinesieCount;

  return {
    totalEvaluated,
    hypertonieCount,
    hypotonieCount,
    paratonieCount,
    syncinesieCount,
    hypersensibleCount,
    hyposensibleCount,
    abnormalTonusCount,
    hasHypertonie: hypertonieCount > 0,
    hasHypotonie: hypotonieCount > 0,
    hasSensoryDefense: hypersensibleCount > 0,
    isSymmetrical: true,
  };
}

export function determineLateralizationProfile(lateralizationState = {}) {
  const handAnswers = [
    lateralizationState.hand_writing,
    lateralizationState.hand_scissors,
    lateralizationState.hand_throw,
  ].filter(Boolean);

  const eyeAnswers = [
    lateralizationState.eye_monocular,
    lateralizationState.eye_peep_hole,
  ].filter(Boolean);

  const footAnswers = [
    lateralizationState.foot_kick,
    lateralizationState.foot_stairs,
  ].filter(Boolean);

  const countRight = (arr) => arr.filter((x) => x === 'right').length;
  const countLeft = (arr) => arr.filter((x) => x === 'left').length;

  const handRight = countRight(handAnswers);
  const handLeft = countLeft(handAnswers);
  const eyeRight = countRight(eyeAnswers);
  const eyeLeft = countLeft(eyeAnswers);
  const footRight = countRight(footAnswers);
  const footLeft = countLeft(footAnswers);

  const dominantHand = handRight > handLeft ? 'right' : (handLeft > handRight ? 'left' : 'mixed');
  const dominantEye = eyeRight > eyeLeft ? 'right' : (eyeLeft > eyeRight ? 'left' : 'mixed');
  const dominantFoot = footRight > footLeft ? 'right' : (footLeft > footRight ? 'left' : 'mixed');

  let profileType = 'undefined';
  let profileLabelAr = 'جانبية قيد التمايز وغير مستقرة';
  let profileLabelFr = 'Latéralité mal affirmée';

  if (dominantHand === 'right' && dominantEye === 'right' && dominantFoot === 'right') {
    profileType = 'homogeneous_right';
    profileLabelAr = 'يمينية متجانسة كاملة (Droitier homogène)';
    profileLabelFr = 'Latéralité homogène droite';
  } else if (dominantHand === 'left' && dominantEye === 'left' && dominantFoot === 'left') {
    profileType = 'homogeneous_left';
    profileLabelAr = 'يسارية متجانسة كاملة (Gaucher homogène)';
    profileLabelFr = 'Latéralité homogène gauche';
  } else if (dominantHand !== 'mixed' && dominantEye !== 'mixed' && dominantHand !== dominantEye) {
    profileType = 'crossed';
    profileLabelAr = `جانبية متصالبة: يد ${dominantHand === 'right' ? 'يمنى' : 'يسرى'} مع عين ${dominantEye === 'right' ? 'يمنى' : 'يسرى'} (Latéralité croisée)`;
    profileLabelFr = 'Latéralité croisée main-œil';
  }

  return {
    dominantHand,
    dominantEye,
    dominantFoot,
    profileType,
    profileLabelAr,
    profileLabelFr,
  };
}

export function generatePsychomotorSoapSummary({
  bodyMapStats,
  lateralProfile,
  balanceSummary,
  visuoMotorSummary,
  spatialSummary,
  patientName = '',
}) {
  const objectiveLines = [];
  const assessmentLines = [];
  const planLines = [];

  // Objective section
  objectiveLines.push('🏃 [فحص التأهيل الحركي النفسي وخريطة الجسد - Bilan Psychomoteur]:');
  
  if (bodyMapStats.abnormalTonusCount > 0) {
    objectiveLines.push(`- النغمة العضلية (Tonus): رصد اضطراب في ${bodyMapStats.abnormalTonusCount} منطقة تشريحية (فرط توتر: ${bodyMapStats.hypertonieCount}، رخاوة: ${bodyMapStats.hypotonieCount}، باراتونيا: ${bodyMapStats.paratonieCount}).`);
  } else {
    objectiveLines.push('- النغمة العضلية (Tonus): نغمة محورية وطرفية سوية (Eutonie globale) دون علامات تشنج أو رخاوة مرضية.');
  }

  if (bodyMapStats.hypersensibleCount > 0 || bodyMapStats.hyposensibleCount > 0) {
    objectiveLines.push(`- التكامل الحسي اللمسي: فرط تحسس ودفاع لمسي في ${bodyMapStats.hypersensibleCount} منطقة، ونقص تحسس/بحث حسي في ${bodyMapStats.hyposensibleCount} منطقة.`);
  }

  if (lateralProfile) {
    objectiveLines.push(`- الجانبية والهيمنة الوظيفية: ${lateralProfile.profileLabelAr} (اليد: ${lateralProfile.dominantHand === 'right' ? 'يمنى' : 'يسرى'}، العين: ${lateralProfile.dominantEye === 'right' ? 'يمنى' : 'يسرى'}).`);
  }

  if (balanceSummary) {
    objectiveLines.push(`- التوازن والثبات: ${balanceSummary}`);
  }

  // Assessment section
  assessmentLines.push('🧠 [التقييم والتحليل الحركي النفسي]:');
  if (lateralProfile && lateralProfile.profileType === 'crossed') {
    assessmentLines.push('- ملاحظة جانبية متصالبة تؤثر على التآزر البصري الحركي والتنظيم الفراغي والاتجاه الخطي أثناء الكتابة.');
  }
  if (bodyMapStats.hasHypertonie) {
    assessmentLines.push('- مؤشرات فرط توتر عضلي محيطي يعيق السلاسة الحركية ويستدعي تدريبات الاسترخاء والتفريغ الانفعالي.');
  }
  if (bodyMapStats.hasHypotonie) {
    assessmentLines.push('- نقص في النغمة المحورية (Hypotonie axiale) يفسر صعوبات الثبات الوضعي والإجهاد السريع أثناء الجلوس المطول.');
  }

  // Plan section
  planLines.push('📋 [خطة التأهيل والبروتوكول المقترح (Plan)]:');
  planLines.push('1. تدريبات التوازن الدهليزي والحس العميق (Vestibulaire & Proprioceptif).');
  planLines.push('2. ترسيخ المخطط الجسمي وتأكيد الجانبية الوظيفية.');
  planLines.push('3. تمارين الضبط التوتري والتآزر الحركي الدقيق لليد والقبضة.');

  return {
    objective: objectiveLines.join('\n'),
    assessment: assessmentLines.join('\n'),
    plan: planLines.join('\n'),
  };
}
