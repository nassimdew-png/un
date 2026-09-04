import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle2,
  User,
  Sparkles,
  FileText,
  Activity,
  Star,
  Plus,
  X,
  Languages,
  Brain,
  MessageSquare,
  AlertCircle,
  Save,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Music,
  Calculator,
  Trophy,
  Send,
  Printer,
  ChevronRight,
  ChevronLeft,
  Receipt,
  History,
  Target,
  Palette,
  Eye,
  CheckSquare,
  Smile,
  Frown,
  Meh,
  Scale,
  ShieldAlert,
  Zap,
  BookOpen,
  HeartPulse,
} from 'lucide-react';
import { appointmentApi, sessionApi } from '../api';
import {
  OrthophonyWorkspaceSection,
  PsychologyWorkspaceSection,
  PsychomotricityWorkspaceSection,
} from './clinical/SpecialtyWorkspaces';

// --- SOUND NOTIFIER (Web Audio API) ---
function playBeep(frequency = 600, duration = 0.08, type = 'sine') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // ignore audio errors
  }
}

function playStarCelebration() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.09);
      osc.stop(ctx.currentTime + idx * 0.09 + 0.25);
    });
  } catch (e) {
    // ignore
  }
}

// --- DATA: CLINICAL FLASHCARDS ---
const CLINICAL_FLASHCARDS = [
  // Articulation (Sounds)
  { id: 'art_r', title: 'صوت الراء (ر)', ar: 'رمان', phonetic: '[r]', icon: '🍎', category: 'articulation', sentence: 'أكلتُ رماناً لذيذاً' },
  { id: 'art_s', title: 'صوت السين (س)', ar: 'سيارة', phonetic: '[s]', icon: '🚗', category: 'articulation', sentence: 'ركبتُ سيارةً سريعة' },
  { id: 'art_sh', title: 'صوت الشين (ش)', ar: 'شمس', phonetic: '[ʃ]', icon: '☀️', category: 'articulation', sentence: 'الشمسُ مشرقة ودافئة' },
  { id: 'art_k', title: 'صوت الكاف (ك)', ar: 'كلب', phonetic: '[k]', icon: '🐕', category: 'articulation', sentence: 'الكلبُ يركض في الحديقة' },
  { id: 'art_l', title: 'صوت اللام (ل)', ar: 'ليمون', phonetic: '[l]', icon: '🍋', category: 'articulation', sentence: 'عصير الليمون منعش' },
  { id: 'art_m', title: 'صوت الميم (م)', ar: 'موز', phonetic: '[m]', icon: '🍌', category: 'articulation', sentence: 'أحبُّ أكلَ الموز' },

  // Daily Actions (Verbs)
  { id: 'act_eat', title: 'أفعال يومية', ar: 'يأكل', phonetic: 'Manger', icon: '🍽️', category: 'verbs', sentence: 'الطفلُ يأكلُ التفاحة' },
  { id: 'act_drink', title: 'أفعال يومية', ar: 'يشرب', phonetic: 'Boire', icon: '🥛', category: 'verbs', sentence: 'الطفلُ يشربُ الحليب' },
  { id: 'act_sleep', title: 'أفعال يومية', ar: 'ينام', phonetic: 'Dormir', icon: '🛏️', category: 'verbs', sentence: 'الطفلُ ينامُ باكراً' },
  { id: 'act_play', title: 'أفعال يومية', ar: 'يلعب', phonetic: 'Jouer', icon: '⚽', category: 'verbs', sentence: 'أنا ألعبُ بالكرة' },
  { id: 'act_wash', title: 'أفعال يومية', ar: 'يغسل', phonetic: 'Se laver', icon: '🧼', category: 'verbs', sentence: 'أغسلُ يديَّ بالصابون' },

  // Emotions & Pragmatics
  { id: 'emo_happy', title: 'المشاعر والتواصل', ar: 'سعيد / فرحان', phonetic: 'Heureux', icon: '😊', category: 'emotions', sentence: 'أنا سعيدٌ بنجاحي' },
  { id: 'emo_sad', title: 'المشاعر والتواصل', ar: 'حزين', phonetic: 'Triste', icon: '😢', category: 'emotions', sentence: 'لا تحزن يا صديقي' },
  { id: 'emo_angry', title: 'المشاعر والتواصل', ar: 'غضبان', phonetic: 'En colère', icon: '😡', category: 'emotions', sentence: 'أتنفسُ بهدوء عندما أغضب' },
  { id: 'emo_scared', title: 'المشاعر والتواصل', ar: 'خائف', phonetic: 'Peur', icon: '😨', category: 'emotions', sentence: 'أنا شجاع ولا أخاف' },
];

// --- DATA: CLINICAL SUGGESTIONS BY SPECIALTY ---
const SPECIALTY_EXERCISES = {
  orthophony: [
    'مخارج الحروف ونطق الأصوات (Articulation)',
    'الفحص العضوي الوظيفي لأعضاء النطق (Bucco-Phonatoire)',
    'التمييز السمعي الفونولوجي (Discrimination Auditive)',
    'تمارين عضلات الفم والبراكسيز (Praxies Bucco-Faciales)',
    'اضطرابات الصوت والبحة (Dysphonie & Voix)',
    'الطلاقة والتنفس والتأتأة (Bégaiement & Souffle)',
    'إثراء الرصيد اللغوي والتركيبي (Vocabulaire & Syntaxe)',
    'الفهم الشفهي واللغة الاستقبالية (Compréhension Orale)',
    'اللغة المكتوبة وصعوبات القراءة (Dyslexie & Orthographe)',
    'التواصل الوظيفي ونظام بيكس (PECS & Pragmatique)',
  ],
  psychology: [
    'المقابلة العيادية والتشخيص الأولي (Entretien Clinique)',
    'المسح الانفعالي والمزاجي (Mood & Affect)',
    'تطبيق المقاييس والاختبارات النفسية (Tests Psychométriques)',
    'تقنيات العلاج المعرفي السلوكي (Restructuration CBT)',
    'تعديل السلوك والتعزيز الإيجابي (Gestion ABA)',
    'تمارين الاسترخاء وإدارة القلق (Relaxation & Stress)',
    'مهارات التواصل والذكاء الاجتماعي (Habiletés Sociales)',
    'تنظيم الانفعالات وإدارة الغضب (Régulation Émotionnelle)',
    'التفريغ النفسي والعلاج باللعب (Thérapie par le Jeu)',
    'الإرشاد الأسري والتوجيه الوالدي (Guidance Parentale)',
  ],
  psychomotricite: [
    'المخطط الجسمي والوعي الجسدي (Schéma Corporel)',
    'التنسيق الحركي الدقيق والتآزر البصري (Motricité Fine)',
    'التنسيق الحركي العام والتوازن (Équilibre & Motricité)',
    'التنظيم والتوجه المكاني والزماني (Orientation Spatio-Temporelle)',
    'الجانبية والسيطرة الحركية (Latéralité & Dominance)',
    'التحكم في فرط النشاط والاندفاعية (Inhibition Motrice)',
  ],
};

const FAST_SOAP_TEMPLATES = [
  // --- Orthophony Templates ---
  {
    title: 'تأهيل نطقي ومخارج حروف',
    specialty: 'orthophony',
    subjective: 'الولي يشير إلى تحسن طفيف في وضوح الكلام داخل المنزل مع استمرار صعوبة نطق بعض الأصوات.',
    objective: 'تمارين براكسيز للفم واللسان، تطبيق بطاقات مخارج الحروف، نسبة الاستجابة الصحيحة بلغت 75% مع التكرار الموجه.',
    assessment: 'تحسن ملحوظ في التمييز السمعي للصوت المستهدف، بحاجة لتثبيت الصوت في الكلمات ثلاثية المقاطع.',
    plan: 'متابعة التمرين على الصوت في سياق جمل بسيطة، وتكليف الولي بتدريب منزلي 10 دقائق يومياً.',
    exercises: ['مخارج الحروف ونطق الأصوات (Articulation)', 'تمارين عضلات الفم والبراكسيز (Praxies Bucco-Faciales)', 'التمييز السمعي الفونولوجي (Discrimination Auditive)'],
  },
  {
    title: 'تأخر لغوي وإثراء تعبيري',
    specialty: 'orthophony',
    subjective: 'الطفل يتواصل بالإشارة والمقاطع المفردة، الولي يرغب في زيادة الرصيد اللغوي وبناء الجمل.',
    objective: 'أنشطة اللعب الرمزي، تسمية الحيوانات والأفعال اليومية، تحفيز إنتاج جملة من كلمتين (فعل + اسم).',
    assessment: 'استجابة جيدة للتحفيز اللعبي، زيادة في محاولات التقليد الصوتي مع انتباه مشترك إيجابي.',
    plan: 'تعزيز الأفعال اليومية، تقليل الشاشات في البيت وتكثيف الحوار التفاعلي اليومي.',
    exercises: ['إثراء الرصيد اللغوي والتركيبي (Vocabulaire & Syntaxe)', 'التواصل الوظيفي ونظام بيكس (PECS & Pragmatique)'],
  },
  {
    title: 'جلسة طلاقة وتأتأة',
    specialty: 'orthophony',
    subjective: 'الطفل يعاني من تكرار في المقاطع الأولى عند الحماس أو التوتر مع بعض التشنجات الخفيفة.',
    objective: 'تمارين التنفس البطني والاسترخاء، تقنية البداية السلسة (Easy Onset) والتبطيء الإيقاعي في القراءة والحديث بالميترونوم.',
    assessment: 'انخفاض في نسبة التكرارات أثناء القراءة الموجهة بنسبة 40% عند تطبيق تقنيات التنفس.',
    plan: 'تعميم تقنية البدء السلس في الحديث العفوي، إرشاد أسري بعدم مقاطعة الطفل أثناء الكلام.',
    exercises: ['الطلاقة والتنفس والتأتأة (Bégaiement & Souffle)', 'اضطرابات الصوت والبحة (Dysphonie & Voix)'],
  },
  {
    title: 'فحص أعضاء النطق وبراكسيز',
    specialty: 'orthophony',
    subjective: 'ملاحظة صعوبة في تحريك اللسان وسيلان لعاب طفيف أثناء الأكل والكلام.',
    objective: 'فحص حركية اللسان والشفتين، تبيّن ضعف في الرفع اللساني مع لجام لسان مشدود نسبياً.',
    assessment: 'عسر نطق ناتج عن عجز وظيفي حركي فموي (Dyspraxie bucco-linguale).',
    plan: 'تمارين تقوية عضلة اللسان والشفاه 3 مرات أسبوعياً ومراجعة طبيب الأطفال لفحص اللجام.',
    exercises: ['الفحص العضوي الوظيفي لأعضاء النطق (Bucco-Phonatoire)', 'تمارين عضلات الفم والبراكسيز (Praxies Bucco-Faciales)'],
  },

  // --- Psychology Templates ---
  {
    title: 'مقابلة عيادية وتشخيص أولي',
    specialty: 'psychology',
    subjective: 'شكوى من تقلبات مزاجية شديدة، نوبات قلق وتوتر مستمر، وتراجع ملحوظ في الأداء الدراسي والاجتماعي.',
    objective: 'إجراء المقابلة العيادية الأولى، تقييم لغة الجسد والحالة المزاجية، المريض أظهر تحالفاً علاجياً متوسطاً مع تحفظ دفاعي.',
    assessment: 'مؤشرات قلق عام متصاعد مع تدني تقدير الذات وأفكار اجترارية سلبية دون هلاوس أو ضلالات.',
    plan: 'استكمال المقابلة العيادية المعمقة، تطبيق مقياس القلق المعتمد، وجدولة جلسات أسبوعية للدعم المعرفي.',
    exercises: ['المقابلة العيادية والتشخيص الأولي (Entretien Clinique)', 'المسح الانفعالي والمزاجي (Mood & Affect)'],
  },
  {
    title: 'تعديل سلوك وفرط حركة (TDAH)',
    specialty: 'psychology',
    subjective: 'الولي يشتكي من الاندفاعية، صعوبة الجلوس لأكثر من 5 دقائق، ونوبات عناد متكررة في البيت والمدرسة.',
    objective: 'تطبيق لوحة التعزيز الرمزي (Token Economy)، تدريب على إكمال مهمة محددة من خطوتين مع مؤقت بصري.',
    assessment: 'استجابة جيدة لنظام المكافآت الفورية، انخفاض الاندفاعية بنسبة 35% عند تجزئة المهام.',
    plan: 'تطبيق جدول التعزيز الإيجابي في المنزل، تدريب الوالدين على تقنية الوقت المستقطع الموجه (Time-out).',
    exercises: ['تعديل السلوك والتعزيز الإيجابي (Gestion ABA)', 'تطبيق المقاييس والاختبارات النفسية (Tests Psychométriques)', 'الإرشاد الأسري والتوجيه الوالدي (Guidance Parentale)'],
  },
  {
    title: 'دعم نفسي وقلق امتحاني',
    specialty: 'psychology',
    subjective: 'العميل يعبر عن خوف شديد من الفشل، أعراض جسدية كخفقان القلب وصعوبة النوم قبيل المواعيد الهامة.',
    objective: 'تحديد الأفكار التلقائية المشوهة (التفكير الكارثي)، تدريب على التنفس الاسترخائي التدريجي وتقنية التشتيت الذهني.',
    assessment: 'وعي جيد بالأسباب النفسية واستبصار متطور، استجابة سريعة لتمارين الاسترخاء العضلي.',
    plan: 'تكليف العميل بكتابة سجل الأفكار التلقائية اليومي (Thought Journal)، والتدريب على الاسترخاء قبل النوم.',
    exercises: ['تقنيات العلاج المعرفي السلوكي (Restructuration CBT)', 'تمارين الاسترخاء وإدارة القلق (Relaxation & Stress)'],
  },
  {
    title: 'تنمية المهارات الاجتماعية والاندماج',
    specialty: 'psychology',
    subjective: 'صعوبة في الاندماج مع الأقران، العزلة، وتجنب المشاركة في الأنشطة الجماعية.',
    objective: 'لعب أدوار سلوكي (Role-playing) لسيناريوهات التعارف وبدء المحادثة، تدريب على لغة العيون وتفسير تعابير الوجه.',
    assessment: 'تحسن في المبادأة الاجتماعية داخل الغرفة العيادية، انخفاض مستويات التوتر التواصلي.',
    plan: 'تشجيع الولي على تسجيل الطفل في نشاط رياضي أو كشفي جماعي للممارسة الواقعية.',
    exercises: ['مهارات التواصل والذكاء الاجتماعي (Habiletés Sociales)', 'تنظيم الانفعالات وإدارة الغضب (Régulation Émotionnelle)'],
  },

  // --- Psychomotricity Templates ---
  {
    title: 'تأهيل التنسيق الحركي والتوازن',
    specialty: 'psychomotricite',
    subjective: 'ملاحظة تعثر مستمر، عدم ثبات أثناء الجري، وصعوبة في صعود ونزول الدرج بدون تثبيت اليدين.',
    objective: 'مسار حركي يتضمن المشي على خط متعرج، القفز بقدم واحدة، وتمارين التوازن الديناميكي والاستاتيكي.',
    assessment: 'ضعف في التحكم الوضعي والتوازن مع اضطراب خفيف في التناسق الحركي المزدوج.',
    plan: 'متابعة مسارات التوازن مع إدخال عناصر الكرات الطبية والتكرار المنزلي اليومي.',
    exercises: ['التنسيق الحركي العام والتوازن (Équilibre & Motricité)', 'المخطط الجسمي والوعي الجسدي (Schéma Corporel)'],
  },
];

export default function ActiveConsultationWorkspace({
  appointmentId,
  patient: initialPatient = null,
  onClose,
  onSuccess,
  onCompleted,
  onFinish,
}) {
  const [patient, setPatient] = useState(initialPatient);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active Tool Drawer Tab: null, 'counter', 'flashcards', 'metronome', 'goals', 'previous'
  const [activeTool, setActiveTool] = useState(null);

  // Live Timer State
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef(null);

  // Clinical Session Form
  const [specialty, setSpecialty] = useState('orthophony'); // 'orthophony', 'psychology', 'psychomotricite'
  const [engagementScore, setEngagementScore] = useState(5); // 1-5 stars
  const [selectedExercises, setSelectedExercises] = useState(SPECIALTY_EXERCISES.orthophony.slice(0, 3));
  const [customExercise, setCustomExercise] = useState('');

  // Structured SOAP Notes
  const [soapNotes, setSoapNotes] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  // --- SPECIALTY 1: ORTHOPHONY CLINICAL EVALUATION STATE ---
  const [orthoBucco, setOrthoBucco] = useState({
    lips: 'normal',
    tongue: 'normal',
    palate: 'normal',
    bite: 'normal',
    respiration: 'abdominal',
  });
  const [orthoTargetSound, setOrthoTargetSound] = useState('/ر/');
  const [orthoSoundPosition, setOrthoSoundPosition] = useState('initial');
  const [orthoErrorType, setOrthoErrorType] = useState('distortion');
  const [orthoFluencyType, setOrthoFluencyType] = useState('none');
  const [orthoSecondaryBehaviors, setOrthoSecondaryBehaviors] = useState(false);

  // --- SPECIALTY 2: PSYCHOLOGY CLINICAL EVALUATION STATE ---
  const [psychAffect, setPsychAffect] = useState({
    mood: 'euthymic',
    emotionalRegulation: 'controlled',
    eyeContact: 'good',
    alliance: 'cooperative',
  });
  const [psychInterview, setPsychInterview] = useState({
    insight: 'full',
    chiefComplaint: '',
    defenseMechanisms: ['rationalization'],
  });
  const [psychTest, setPsychTest] = useState({
    testName: 'Conners (فرط الحركة وتشتت الانتباه TDAH)',
    score: '',
    interpretation: 'moderate',
  });
  const [psychTechnique, setPsychTechnique] = useState('cbt_restructuring');

  // --- SPECIALTY 3: PSYCHOMOTRICITY CLINICAL EVALUATION STATE ---
  const [motorState, setMotorState] = useState({
    bodySchema: 'good',
    lateralization: 'right_handed',
    balance: 'stable',
    fineMotor: 'good',
    spatialTemporal: 'oriented',
  });

  // --- TOOL 1: TRIAL & ACCURACY COUNTER ---
  const [trialSound, setTrialSound] = useState('صوت الراء (ر)');
  const [correctTrials, setCorrectTrials] = useState(0);
  const [incorrectTrials, setIncorrectTrials] = useState(0);
  const totalTrials = correctTrials + incorrectTrials;
  const accuracyPercent = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 0;

  // --- TOOL 2: INTERACTIVE FLASHCARDS ---
  const [flashcardCategory, setFlashcardCategory] = useState('all');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const filteredFlashcards = CLINICAL_FLASHCARDS.filter(
    (c) => flashcardCategory === 'all' || c.category === flashcardCategory
  );
  const currentCard = filteredFlashcards[currentCardIndex % (filteredFlashcards.length || 1)];

  // --- TOOL 3: FLUENCY METRONOME ---
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [metronomeBpm, setMetronomeBpm] = useState(60);
  const [metronomeBeat, setMetronomeBeat] = useState(false);
  const metronomeIntervalRef = useRef(null);

  // --- TOOL 4: GAMIFIED TOKEN ECONOMY (STARS) ---
  const [starCount, setStarCount] = useState(0);

  // --- TOOL 5: VOICE SCRIBE & DICTATION ---
  const [isListening, setIsListening] = useState(false);
  const [dictationLang, setDictationLang] = useState('ar-DZ'); // ar-DZ, fr-FR
  const [activeSoapField, setActiveSoapField] = useState('objective');
  const recognitionRef = useRef(null);

  // --- TOOL 6: PEI CLINICAL GOALS ---
  const [clinicalGoals, setClinicalGoals] = useState([
    { id: 1, text: 'نطق صوت الراء /r/ في بداية الكلمة بدقة 80%', status: 'in_progress' },
    { id: 2, text: 'إنتاج جملة اسمية من 3 عناصر (فاعل + فعل + مفعول)', status: 'in_progress' },
    { id: 3, text: 'الحفاظ على التواصل البصري أثناء الإجابة لمدة 10 ثوانٍ', status: 'achieved' },
    { id: 4, text: 'تقليل التكرارات التأتاتية باستخدام التنفس البطني', status: 'needs_work' },
  ]);

  // --- TOOL 7: PREVIOUS SESSION DATA (Mock/Fetched) ---
  const [pastSessionsList, setPastSessionsList] = useState([]);
  const [selectedPastSessionId, setSelectedPastSessionId] = useState(null);
  const [previousSession, setPreviousSession] = useState({
    date: 'الجلسة السابقة',
    summary: 'تمارين تأهيل وتدريب نطقي',
    homeworkAssigned: 'متابعة التمارين المنزلية.',
  });

  // Fetch real past sessions for this patient
  useEffect(() => {
    if (patient?.id) {
      sessionApi
        .list(patient.id)
        .then((res) => {
          const list = res.data || (Array.isArray(res) ? res : []);
          if (list && list.length > 0) {
            setPastSessionsList(list);
            const last = list[0];
            setSelectedPastSessionId(last.id);
            setPreviousSession({
              id: last.id,
              date: last.session_date
                ? new Date(last.session_date).toLocaleDateString('ar-DZ')
                : 'الجلسة السابقة',
              duration: last.duration_minutes || 45,
              specialty: last.specialty,
              exercises: last.exercises_targeted || [],
              summary: last.progress_notes || 'تمارين تأهيل وتدريب نطقي',
              raw: last,
            });
          }
        })
        .catch((e) => console.warn('Could not load past sessions:', e));
    }
  }, [patient?.id]);

  const copyFromPreviousSession = () => {
    const targetSession =
      pastSessionsList.find((s) => s.id === Number(selectedPastSessionId)) ||
      pastSessionsList[0] ||
      previousSession;
    if (!targetSession) return;

    if (Array.isArray(targetSession.exercises_targeted) && targetSession.exercises_targeted.length > 0) {
      setSelectedExercises(targetSession.exercises_targeted);
    }
    const rawNotes = targetSession.progress_notes || targetSession.summary || '';
    const lines = rawNotes.split('\n');
    let plan = '';
    lines.forEach((l) => {
      if (l.trim().startsWith('• Plan:')) plan = l.replace('• Plan:', '').trim();
    });

    if (plan) {
      setSoapNotes((prev) => ({
        ...prev,
        subjective: prev.subjective
          ? `${prev.subjective}\n[متابعة خطة الجلسة السابقة]: ${plan}`
          : `[متابعة خطة الجلسة السابقة]: ${plan}`,
      }));
    }
    playBeep(900, 0.1);
    alert('تم نسخ تمارين وخطة الجلسة السابقة إلى جلسة اليوم بنجاح!');
  };

  // --- TOOL 8: INSTANT RECEIPT & BILLING ---
  const [generateReceipt, setGenerateReceipt] = useState(true);
  const [sessionFee, setSessionFee] = useState(2000); // 2000 DZD

  // Fetch appointment & patient if not supplied
  useEffect(() => {
    if (appointmentId && !patient) {
      setLoading(true);
      appointmentApi
        .get(appointmentId)
        .then((res) => {
          const app = res.appointment || res.data || res;
          if (app && app.patient) {
            setPatient(app.patient);
          }
          if (app && app.notes && !soapNotes.subjective) {
            setSoapNotes((prev) => ({ ...prev, subjective: app.notes }));
          }
        })
        .catch((err) => console.error('Failed to load active appointment:', err))
        .finally(() => setLoading(false));
    }
  }, [appointmentId, patient]);

  // Stopwatch Interval
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Metronome Sound & Visual Beat
  useEffect(() => {
    if (isMetronomePlaying) {
      const intervalMs = (60 / metronomeBpm) * 1000;
      metronomeIntervalRef.current = setInterval(() => {
        playBeep(880, 0.04, 'triangle');
        setMetronomeBeat(true);
        setTimeout(() => setMetronomeBeat(false), 120);
      }, intervalMs);
    } else if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
    }
    return () => {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    };
  }, [isMetronomePlaying, metronomeBpm]);

  // Web Speech API Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = false;
      recog.lang = dictationLang;

      recog.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join(' ');
        if (transcript) {
          setSoapNotes((prev) => {
            const existing = prev[activeSoapField] || '';
            const updated = existing ? `${existing} ${transcript}` : transcript;
            return { ...prev, [activeSoapField]: updated };
          });
        }
      };

      recog.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }
  }, [dictationLang, activeSoapField]);

  const toggleVoiceListening = () => {
    if (!recognitionRef.current) {
      alert('ميزة التعرف الصوتي غير مدعومة في هذا المتصفح. يُرجى استخدام Google Chrome أو Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = dictationLang;
        recognitionRef.current.start();
        setIsListening(true);
        playBeep(700, 0.1);
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  // Text-to-Speech Pronouncer for Flashcards
  const pronounceCardWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Format Elapsed Time
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      const remMins = mins % 60;
      return `${String(hrs).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Toggle Predefined Exercise
  const toggleExercise = (ex) => {
    if (selectedExercises.includes(ex)) {
      setSelectedExercises(selectedExercises.filter((e) => e !== ex));
    } else {
      setSelectedExercises([...selectedExercises, ex]);
    }
  };

  // Add Custom Exercise
  const handleAddCustomExercise = (e) => {
    if (e) e.preventDefault();
    const clean = customExercise.trim();
    if (clean && !selectedExercises.includes(clean)) {
      setSelectedExercises([...selectedExercises, clean]);
      setCustomExercise('');
    }
  };

  // Switch Active Specialty dynamically
  const handleSwitchSpecialty = (newSpecialty) => {
    setSpecialty(newSpecialty);
    if (SPECIALTY_EXERCISES[newSpecialty]) {
      setSelectedExercises(SPECIALTY_EXERCISES[newSpecialty].slice(0, 3));
    }
    playBeep(800, 0.06);
  };

  // Apply Fast Clinical Template
  const applyTemplate = (tpl) => {
    setSpecialty(tpl.specialty);
    setSoapNotes({
      subjective: tpl.subjective,
      objective: tpl.objective,
      assessment: tpl.assessment,
      plan: tpl.plan,
    });
    if (tpl.exercises && tpl.exercises.length > 0) {
      setSelectedExercises(tpl.exercises);
    }
    playBeep(750, 0.08);
  };

  // Insert Orthophony Evaluation summary into SOAP Objective
  const insertOrthoBuccoResultsIntoSoap = () => {
    const lipsMap = { normal: 'شفتين بحركية طبيعية', hypotonia: 'ارتخاء في عضلة الشفتين', hypertonia: 'شد وانقباض في الشفتين' };
    const tongueMap = { normal: 'لسان بحركة حرة ومرنة', short_frenulum: 'لجام لسان قصير (Frein court)', apraxia: 'عسر حركي في الرفع اللساني' };
    const palateMap = { normal: 'حنك رخو سليم مع إغلاق تام', cleft_or_insufficiency: 'قصور في الصمام اللهائي الحنكي (خنف)' };
    const respMap = { abdominal: 'تنفس بطني حجابي سليم', thoracic: 'تنفس صدري سطحي', mouth: 'تنفس فموي مستمر' };
    const posMap = { initial: 'بداية الكلمة', medial: 'وسط الكلمة', final: 'نهاية الكلمة' };
    const errMap = { distortion: 'تشويه (Distorsion)', omission: 'حذف (Omission)', substitution: 'إبدال (Substitution)' };

    const buccoSnippet = `\n[فحص أعضاء النطق والوظائف الفموية (Bucco-Phonatoire)]:
• ${lipsMap[orthoBucco.lips] || ''} | ${tongueMap[orthoBucco.tongue] || ''}
• ${palateMap[orthoBucco.palate] || ''} | نمط التنفس: ${respMap[orthoBucco.respiration] || ''}
• الفونيم المستهدف: ${orthoTargetSound} في (${posMap[orthoSoundPosition]}) - نوع الخطأ: ${errMap[orthoErrorType]}`;

    const fluencySnippet =
      orthoFluencyType !== 'none'
        ? `\n• اضطراب الطلاقة: ${
            orthoFluencyType === 'repetition'
              ? 'تكرار مقاطع'
              : orthoFluencyType === 'prolongation'
              ? 'إطالة أصوات'
              : 'احتباس وقفل حنجري'
          } ${orthoSecondaryBehaviors ? '(مع سلوكيات حركية مصاحبة)' : '(بدون سلوكيات مصاحبة)'}`
        : '';

    setSoapNotes((prev) => ({
      ...prev,
      objective: (prev.objective || '') + buccoSnippet + fluencySnippet,
    }));
    playBeep(900, 0.1);
    alert('تم إدراج نتائج فحص الأرطوفونيا في خانة الملاحظات الموضوعية (Objective) بنجاح!');
  };

  // Insert Psychology Evaluation summary into SOAP Objective
  const insertPsychResultsIntoSoap = () => {
    const moodMap = {
      euthymic: 'مستقر ومتزن (Euthymique)',
      anxious: 'قلق ومتوتر',
      depressed: 'حزين ومكتئب',
      euphoric: 'منشرح بصورة مفرطة',
      irritable: 'متهيج وسريع الغضب',
    };
    const allianceMap = {
      cooperative: 'تحالف علاجي ممتاز ومتعاون',
      guarded: 'متحفظ وخائف',
      resistant: 'مقاوم ورافض للإفصاح',
      passive: 'سلبي ومتردد',
    };
    const contactMap = {
      good: 'تواصل بصري طبيعي ومستمر',
      fleeting: 'تواصل بصري متقطع',
      avoidant: 'تجنب كلي للتواصل البصري',
    };
    const insightMap = {
      full: 'استبصار كامل ووعي بالمشكلة',
      partial: 'استبصار جزئي متردد',
      denial: 'إنكار تام للصعوبة وتبرير',
    };
    const interpMap = {
      normal: 'معدل طبيعي',
      mild: 'درجة خفيفة',
      moderate: 'درجة متوسطة',
      severe: 'درجة حادة دالة إكلينيكياً',
    };
    const techMap = {
      cbt_restructuring: 'إعادة الهيكلة المعرفية (CBT)',
      aba_reinforcement: 'التعزيز السلوكي الإيجابي (ABA)',
      exposure: 'التعريض التدريجي وإزالة الحساسية',
      play_therapy: 'العلاج باللعب الإسقاطي والتفريغ',
      relaxation: 'الاسترخاء والتفريغ الانفعالي',
    };

    const psychSnippet = `\n[التقييم النفسي العيادي والحالة الانفعالية]:
• المزاج السائد: ${moodMap[psychAffect.mood] || psychAffect.mood}
• التحالف العلاجي: ${allianceMap[psychAffect.alliance] || psychAffect.alliance} | التواصل البصري: ${contactMap[psychAffect.eyeContact] || psychAffect.eyeContact}
• الاستبصار بالمرض/المشكلة: ${insightMap[psychInterview.insight] || psychInterview.insight}
• آليات الدفاع الملاحظة: ${(psychInterview.defenseMechanisms || []).join('، ') || 'طبيعية'}
• التقنية العلاجية المطبقة: ${techMap[psychTechnique] || psychTechnique}`;

    const testSnippet = psychTest.score
      ? `\n• المقياس النفسي المطبق: ${psychTest.testName} (الدرجة: ${psychTest.score} - الدلالة: ${
          interpMap[psychTest.interpretation] || psychTest.interpretation
        })`
      : '';

    setSoapNotes((prev) => ({
      ...prev,
      objective: (prev.objective || '') + psychSnippet + testSnippet,
    }));
    playBeep(900, 0.1);
    alert('تم إدراج نتائج التقييم النفسي في خانة الملاحظات الموضوعية (Objective) بنجاح!');
  };

  // Insert Psychomotor Evaluation summary into SOAP Objective
  const insertPsychomotorResultsIntoSoap = () => {
    const schemaMap = {
      good: 'مخطط جسمي سليم ووعي متكامل',
      in_progress: 'مخطط جسمي قيد التكوين',
      deficit: 'اضطراب وصعوبة في إدراك أجزاء الجسم',
    };
    const latMap = {
      right_handed: 'جانبية يمينية متجانسة',
      left_handed: 'جانبية يسارية متجانسة',
      cross_lateral: 'جانبية متصالبة (Croisée)',
      undefined: 'جانبية غير مستقرة',
    };
    const balMap = {
      stable: 'توازن وتحكم وضعي ممتاز',
      unsteady: 'ترنح وضعف في التوازن الحركي',
      clumsy: 'خرق حركي ملحوظ (Maladresse)',
    };
    const fineMap = {
      good: 'حركية دقيقة وقبض سليم',
      dyspraxic: 'عسر حركي دقيق (Dyspraxie fine)',
      tremorous: 'رعشة وشد عضلي عند المسك',
    };

    const motorSnippet = `\n[فحص التأهيل النفسي الحركي (Bilan Psychomoteur)]:
• المخطط الجسمي: ${schemaMap[motorState.bodySchema]} | الجانبية: ${latMap[motorState.lateralization]}
• التوازن والحركية العامة: ${balMap[motorState.balance]}
• الحركية الدقيقة والتآزر: ${fineMap[motorState.fineMotor]}
• التوجه المكاني والزماني: ${
      motorState.spatialTemporal === 'oriented' ? 'منظم ومتوجه جيداً' : 'اضطراب في التوجه المكاني/الزماني'
    }`;

    setSoapNotes((prev) => ({
      ...prev,
      objective: (prev.objective || '') + motorSnippet,
    }));
    playBeep(900, 0.1);
    alert('تم إدراج نتائج الفحص الحركي في خانة الملاحظات الموضوعية (Objective) بنجاح!');
  };

  // Insert Trial Accuracy into SOAP Objective
  const insertTrialResultsIntoSoap = () => {
    if (totalTrials === 0) return;
    const textSnippet = `\n[مقياس الدقة: ${trialSound} - المحاولات: ${correctTrials}/${totalTrials} (${accuracyPercent}% دقة الاستجابة)]`;
    setSoapNotes((prev) => ({
      ...prev,
      objective: (prev.objective || '') + textSnippet,
    }));
    playBeep(900, 0.1);
    alert('تم إدراج نتائج دقة المحاولات في خانة الملاحظات الموضوعية (Objective) بنجاح!');
  };

  // Insert PEI Goals into SOAP Plan
  const insertGoalsIntoSoapPlan = () => {
    const goalSummary = clinicalGoals
      .map(
        (g) =>
          `• ${g.text}: ${
            g.status === 'achieved' ? 'مكتسب ✅' : g.status === 'in_progress' ? 'قيد التدريب ⏳' : 'بحاجة لتعزيز ⚠️'
          }`
      )
      .join('\n');
    const snippet = `\n[متابعة الأهداف السريرية PEI]:\n${goalSummary}`;
    setSoapNotes((prev) => ({
      ...prev,
      plan: (prev.plan || '') + snippet,
    }));
    playBeep(900, 0.1);
    alert('تم إدراج تقييم الأهداف في خانة الخطة القادمة (Plan) بنجاح!');
  };

  // Add a Token/Star for the Child
  const handleAddStar = () => {
    if (starCount < 5) {
      setStarCount((prev) => prev + 1);
      playStarCelebration();
    } else {
      setStarCount(0); // reset
    }
  };

  // Open WhatsApp Homework Sheet
  const handleSendWhatsAppHomework = () => {
    const phone = (patient?.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? `213${phone.substring(1)}` : phone;

    const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'الطفل';
    const exercisesText = selectedExercises.slice(0, 3).join('، ') || 'تمارين تأهيلية متخصصة';
    const homeworkText =
      soapNotes.plan || 'الرجاء الالتزام بالتوجيهات والتمارين المنزلية المحددة في الجلسة لدعم وتثبيت التطور الإيجابي.';

    const clinicTitle =
      specialty === 'psychology'
        ? 'عيادة الاستشارات والدعم النفسي 🧠'
        : specialty === 'psychomotricite'
        ? 'عيادة التأهيل النفسي الحركي 🏃'
        : 'عيادة الأرطوفونيا والتخاطب 🗣️';

    const message = `السلام عليكم ورحمة الله وبركاته،
تحية طيبة من ${clinicTitle}

نحيطكم علماً بأن جلسة اليوم للبطل(ة) *${patientName}* سارت بشكل إيجابي ومثمر 🌟
• *الأنشطة والتمارين المنجزة:* ${exercisesText}
• *الواجبات والتوجيهات المنزلية:*
${homeworkText}

نثمن تعاونكم المستمر لدعم وتطوير قدرات طفلكم، ونلقاكم في الموعد القادم بحول الله 🌸`;

    const encoded = encodeURIComponent(message);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Complete & Save Session
  const handleCompleteSession = async () => {
    setSaving(true);
    try {
      const durationMinutes = Math.max(15, Math.round(secondsElapsed / 60) || 45);

      const trialSnippet =
        totalTrials > 0 ? `\n• Trial Accuracy: ${trialSound} -> ${correctTrials}/${totalTrials} (${accuracyPercent}%)` : '';

      const specialtyLabel =
        specialty === 'psychology'
          ? 'علم النفس العيادي (Psychologie)'
          : specialty === 'psychomotricite'
          ? 'التأهيل النفسي الحركي (Psychomotricité)'
          : 'الأرطوفونيا والتخاطب (Orthophonie)';

      const fullProgressReport = `[SOAP CLINICAL NOTES - ${specialtyLabel}]
• Subjective: ${soapNotes.subjective || 'لا توجد ملاحظات إضافية'}
• Objective: ${soapNotes.objective || 'تم إنجاز التمارين المحددة'}${trialSnippet}
• Assessment: ${soapNotes.assessment || 'استجابة إيجابية'}
• Plan: ${soapNotes.plan || 'متابعة البرنامج السريري'}
• Behavioral Engagement: ${engagementScore}/5 (${starCount} نجوم تشجيعية)
• Targeted Exercises: ${selectedExercises.join(' | ')}
• Session Fee: ${generateReceipt ? `${sessionFee} DZD (وصل مؤكد)` : 'مدرج في الاشتراك'}`;

      const payload = {
        notes: fullProgressReport,
        duration_minutes: durationMinutes,
        specialty,
        exercises_targeted: selectedExercises,
        save_therapy_session: true,
        progress_notes: fullProgressReport,
      };

      let result = null;
      if (appointmentId) {
        result = await appointmentApi.completeSession(appointmentId, payload);
      } else if (patient?.id) {
        result = await sessionApi.create({
          patient_id: patient.id,
          session_date: new Date().toISOString().split('T')[0],
          duration_minutes: durationMinutes,
          specialty,
          attendance_status: 'present',
          exercises_targeted: selectedExercises,
          progress_notes: fullProgressReport,
        });
      }

      setSaveSuccess(true);
      playStarCelebration();

      setTimeout(() => {
        if (onCompleted) onCompleted(result);
        if (onSuccess) onSuccess(result);
        if (onFinish) onFinish(soapNotes);
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      console.error('Error completing session:', err);
      alert(err.message || 'حدث خطأ أثناء حفظ الجلسة');
    } finally {
      setSaving(false);
    }
  };

  // Approximate Age
  const patientAge = (() => {
    if (!patient?.birth_date) return null;
    const diff = Date.now() - new Date(patient.birth_date).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  })();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* TOP CLINICAL HEADER */}
        <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/40 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Patient Info */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/10">
              <Stethoscope className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h3 className="text-base font-black text-white">جلسة علاجية سريرية مباشرة</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
                  جارية الآن
                </span>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse text-xs text-slate-300 mt-1">
                <span className="font-bold text-teal-300">
                  {patient ? `${patient.first_name} ${patient.last_name}` : 'المريض'}
                </span>
                {patientAge !== null && <span className="text-slate-400 font-mono">({patientAge} سنة)</span>}
                {patient?.phone && <span className="text-slate-400 font-mono">{patient.phone}</span>}
              </div>
            </div>
          </div>

          {/* Stopwatch & Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Stopwatch */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-2.5 space-x-reverse shadow-inner">
              <Clock className="w-4 h-4 text-amber-400" />
              <div className="text-center">
                <span className="text-[9px] text-slate-400 block leading-none">مدة الجلسة</span>
                <span className="text-sm font-mono font-black text-amber-300">{formatTimer(secondsElapsed)}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                title={isTimerRunning ? 'إيقاف مؤقت' : 'استئناف'}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={() => setSecondsElapsed(0)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs"
                title="تصفير"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Token Economy Star Collector */}
            <button
              type="button"
              onClick={handleAddStar}
              className="px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 flex items-center space-x-1.5 space-x-reverse text-amber-300 font-black text-xs transition-all shadow-sm"
              title="انقر لمنح الطفل نجمة تعزيزية"
            >
              <Star className="w-4 h-4 fill-current text-amber-400" />
              <span>{starCount}/5 نجوم</span>
              {starCount === 5 && <span className="animate-bounce">🏆</span>}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs"
              title="إغلاق"
            >
              ✕
            </button>
          </div>
        </div>

        {/* CLINICAL TOOLKIT SHORTCUTS RIBBON */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between overflow-x-auto gap-2 text-xs font-bold">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[11px] text-slate-500 ml-2">أدوات الجلسة التفاعلية:</span>

            {/* Tool: Trial / Behavior Counter (Contextual) */}
            <button
              type="button"
              onClick={() => setActiveTool(activeTool === 'counter' ? null : 'counter')}
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 space-x-reverse transition-all ${
                activeTool === 'counter'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {specialty === 'psychology'
                  ? `🔢 راصد السلوك والامتثال (${correctTrials})`
                  : specialty === 'psychomotricite'
                  ? `🔢 عداد التآزر والتكرار (${correctTrials})`
                  : `🔢 عداد المحاولات (${accuracyPercent}%)`}
              </span>
            </button>

            {/* Orthophony Specific Tools */}
            {specialty === 'orthophony' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTool(activeTool === 'flashcards' ? null : 'flashcards')}
                  className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 space-x-reverse transition-all ${
                    activeTool === 'flashcards'
                      ? 'bg-pink-600 text-white border-pink-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-pink-400" />
                  <span>🎴 بطاقات التخاطب (Flashcards)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool(activeTool === 'metronome' ? null : 'metronome')}
                  className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 space-x-reverse transition-all ${
                    activeTool === 'metronome'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Music className="w-3.5 h-3.5 text-amber-400" />
                  <span>🎵 ميترونوم الطلاقة ({metronomeBpm} BPM)</span>
                </button>
              </>
            )}

            {/* Psychology Specific Quick Badge */}
            {specialty === 'psychology' && (
              <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-bold flex items-center space-x-1 space-x-reverse">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span>لوحة علم النفس مفعّلة بالأسفل</span>
              </span>
            )}

            {/* Psychomotricity Specific Quick Badge */}
            {specialty === 'psychomotricite' && (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center space-x-1 space-x-reverse">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>لوحة التأهيل الحركي مفعّلة بالأسفل</span>
              </span>
            )}

            {/* Common Tool: PEI Goals */}
            <button
              type="button"
              onClick={() => setActiveTool(activeTool === 'goals' ? null : 'goals')}
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 space-x-reverse transition-all ${
                activeTool === 'goals'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>🎯 أهداف الخطة ({clinicalGoals.length})</span>
            </button>

            {/* Common Tool: Previous Session */}
            <button
              type="button"
              onClick={() => setActiveTool(activeTool === 'previous' ? null : 'previous')}
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 space-x-reverse transition-all ${
                activeTool === 'previous'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>⏮️ الجلسة السابقة</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendWhatsAppHomework}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold flex items-center space-x-1.5 space-x-reverse transition-all"
              title="إرسال واجبات وتوصيات اليوم للولي عبر WhatsApp"
            >
              <Send className="w-3 h-3" />
              <span>📲 واجبات الولي (WhatsApp)</span>
            </button>
          </div>
        </div>

        {/* TOOL DRAWER EXPANSION PANEL (WHEN ANY TOOL IS ACTIVE) */}
        {activeTool && (
          <div className="p-4 bg-slate-950/95 border-b border-slate-800 animate-in slide-in-from-top-2 duration-150">
            {/* 1. Trial Counter Drawer */}
            {activeTool === 'counter' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Calculator className="w-4 h-4 text-blue-400" />
                    <span className="font-black text-white text-sm">عداد المحاولات ونسبة الدقة اللحظية</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">الصوت أو الهدف المستهدف:</span>
                    <input
                      type="text"
                      value={trialSound}
                      onChange={(e) => setTrialSound(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-bold text-xs"
                    />
                  </div>
                </div>

                {/* Score Big Display */}
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">الدقة</span>
                    <span className="text-2xl font-mono font-black text-blue-400">{accuracyPercent}%</span>
                  </div>
                  <div className="text-center px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="text-emerald-400 font-bold font-mono">{correctTrials} صح</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-slate-300 font-mono">{totalTrials} كلي</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCorrectTrials((c) => c + 1);
                      playBeep(880, 0.05);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20"
                  >
                    + استجابة صحيحة ✅
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIncorrectTrials((i) => i + 1);
                      playBeep(350, 0.08, 'sawtooth');
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 font-bold text-xs"
                  >
                    + محاولة غير موفقة ❌
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCorrectTrials(0);
                      setIncorrectTrials(0);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                    title="تصفير"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={insertTrialResultsIntoSoap}
                    className="px-3 py-2 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold hover:bg-blue-600/50"
                  >
                    إدراج في التقرير 📝
                  </button>
                </div>
              </div>
            )}

            {/* 2. Interactive Flashcards Drawer */}
            {activeTool === 'flashcards' && (
              <div className="p-4 rounded-2xl bg-pink-950/20 border border-pink-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Palette className="w-4 h-4 text-pink-400" />
                    <span className="font-black text-white text-sm">مستعرض بطاقات التخاطب السريرية</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {['all', 'articulation', 'verbs', 'emotions'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setFlashcardCategory(cat);
                          setCurrentCardIndex(0);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold ${
                          flashcardCategory === cat
                            ? 'bg-pink-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat === 'all'
                          ? 'الكل'
                          : cat === 'articulation'
                          ? 'مخارج الأصوات'
                          : cat === 'verbs'
                          ? 'أفعال'
                          : 'مشاعر'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Flashcard Display Card */}
                {currentCard && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : filteredFlashcards.length - 1))
                      }
                      className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="text-center space-y-1">
                      <div className="text-6xl select-none animate-in zoom-in-50 duration-150">{currentCard.icon}</div>
                      <div className="text-lg font-black text-white">{currentCard.ar}</div>
                      <div className="text-xs text-pink-400 font-mono font-bold">
                        {currentCard.phonetic} &bull; {currentCard.title}
                      </div>
                      <p className="text-xs text-slate-400 italic mt-1">"{currentCard.sentence}"</p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => pronounceCardWord(currentCard.ar)}
                        className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center space-x-1.5 space-x-reverse shadow-md"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>استماع للنطق 🔊</span>
                      </button>
                      <span className="text-[10px] text-slate-500">
                        {currentCardIndex + 1} من {filteredFlashcards.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentCardIndex((prev) => (prev + 1) % filteredFlashcards.length)}
                      className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. Fluency Metronome Drawer */}
            {activeTool === 'metronome' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Music className="w-4 h-4 text-amber-400" />
                    <span className="font-black text-white text-sm">مسرّع الإيقاع لعلاج التأتأة والطلاقة الكلامية</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    يساعد المريض على التحدث بإيقاع هادئ ومنتظم وضبط سرعة الكلام والتنفس
                  </p>
                </div>

                {/* Visual Pulsing Circle & BPM */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold font-mono transition-all ${
                      metronomeBeat
                        ? 'bg-amber-500 text-slate-950 border-amber-400 scale-110 shadow-lg shadow-amber-500/50'
                        : 'bg-slate-900 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {metronomeBpm}
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-white block">نبضة في الدقيقة (BPM)</span>
                    <input
                      type="range"
                      min="40"
                      max="120"
                      value={metronomeBpm}
                      onChange={(e) => setMetronomeBpm(Number(e.target.value))}
                      className="w-32 accent-amber-500"
                    />
                  </div>
                </div>

                {/* Metronome Control Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMetronomePlaying(!isMetronomePlaying)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-md ${
                      isMetronomePlaying
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                    }`}
                  >
                    {isMetronomePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isMetronomePlaying ? 'إيقاف الميترونوم' : 'تشغيل الميترونوم 🎵'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetronomeBpm(60)}
                    className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white"
                  >
                    60 BPM
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetronomeBpm(75)}
                    className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white"
                  >
                    75 BPM
                  </button>
                </div>
              </div>
            )}

            {/* 4. PEI Goals Drawer */}
            {activeTool === 'goals' && (
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="font-black text-white text-sm">أهداف الخطة الفردية للمريض (PEI Checklist)</span>
                  </div>
                  <button
                    type="button"
                    onClick={insertGoalsIntoSoapPlan}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 space-x-reverse"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>إدراج في خطة الجلسة (Plan)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {clinicalGoals.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white max-w-[280px]">{g.text}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setClinicalGoals(
                              clinicalGoals.map((x) => (x.id === g.id ? { ...x, status: 'achieved' } : x))
                            )
                          }
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            g.status === 'achieved'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🟢 مكتسب
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setClinicalGoals(
                              clinicalGoals.map((x) => (x.id === g.id ? { ...x, status: 'in_progress' } : x))
                            )
                          }
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            g.status === 'in_progress'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🟡 قيد التدريب
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setClinicalGoals(
                              clinicalGoals.map((x) => (x.id === g.id ? { ...x, status: 'needs_work' } : x))
                            )
                          }
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            g.status === 'needs_work'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🔴 تعزيز
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Previous Session Glance Drawer */}
            {activeTool === 'previous' && (
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <History className="w-4 h-4 text-purple-400" />
                    <span className="font-black text-white text-sm">
                      ملخص الجلسة السابقة للمريض
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {pastSessionsList.length > 1 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400">اختر الجلسة:</span>
                        <select
                          value={selectedPastSessionId || ''}
                          onChange={(e) => setSelectedPastSessionId(Number(e.target.value))}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white font-bold text-xs"
                        >
                          {pastSessionsList.map((s, idx) => (
                            <option key={s.id} value={s.id}>
                              الجلسة #{pastSessionsList.length - idx} ({new Date(s.session_date).toLocaleDateString('fr-FR')})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={copyFromPreviousSession}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-md"
                    >
                      <span>📥 نسخ تمارين وتوصيات هذه الجلسة إلى جلسة اليوم</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-purple-400 font-bold">ما تم إنجازه والتمارين:</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {previousSession.duration || 45} دقيقة &bull; {previousSession.specialty === 'orthophony' ? 'أرطوفونيا' : 'علم النفس'}
                      </span>
                    </div>
                    <p className="text-slate-300 line-clamp-3 leading-relaxed">{previousSession.summary}</p>
                    {Array.isArray(previousSession.exercises) && previousSession.exercises.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {previousSession.exercises.map((ex, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 text-[9px] font-bold">
                            ✓ {ex}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-amber-400 font-bold block">التوصيات والواجبات الموصى بها سابقاً:</span>
                    <p className="text-slate-300 leading-relaxed">{previousSession.homeworkAssigned || 'متابعة البرنامج السريري'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WORKSPACE BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Specialty Selector & Fast Clinical Templates */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-slate-400 font-bold">التخصص السريري:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSwitchSpecialty('orthophony')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    specialty === 'orthophony' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🗣️ أرطوفونيا (Orthophonie)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSpecialty('psychology')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    specialty === 'psychology'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🧠 علم النفس (Psychologie)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSpecialty('psychomotricite')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    specialty === 'psychomotricite'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏃 نفسي-حركي (Psychomotricité)
                </button>
              </div>
            </div>

            {/* Engagement 5-Star Rating */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-slate-400 font-bold">تفاعل المريض:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEngagementScore(star)}
                    className="p-0.5 text-amber-400 transition-transform hover:scale-125"
                  >
                    <Star className={`w-4 h-4 ${star <= engagementScore ? 'fill-current' : 'text-slate-700'}`} />
                  </button>
                ))}
                <span className="text-[11px] font-bold text-amber-300 mr-1.5">
                  {engagementScore === 5 && 'ممتاز 🌟'}
                  {engagementScore === 4 && 'جيد جداً 👍'}
                  {engagementScore === 3 && 'متوسط 😐'}
                  {engagementScore === 2 && 'مقاوم ⚡'}
                  {engagementScore === 1 && 'صعوبة شديدة ⚠️'}
                </span>
              </div>
            </div>
          </div>

          {/* DYNAMIC SPECIALIZED CLINICAL EVALUATION WORKSPACE */}
          {specialty === 'orthophony' && (
            <OrthophonyWorkspaceSection
              orthoBucco={orthoBucco}
              setOrthoBucco={setOrthoBucco}
              orthoTargetSound={orthoTargetSound}
              setOrthoTargetSound={setOrthoTargetSound}
              orthoSoundPosition={orthoSoundPosition}
              setOrthoSoundPosition={setOrthoSoundPosition}
              orthoErrorType={orthoErrorType}
              setOrthoErrorType={setOrthoErrorType}
              orthoFluencyType={orthoFluencyType}
              setOrthoFluencyType={setOrthoFluencyType}
              orthoSecondaryBehaviors={orthoSecondaryBehaviors}
              setOrthoSecondaryBehaviors={setOrthoSecondaryBehaviors}
              onInsertIntoSoap={insertOrthoBuccoResultsIntoSoap}
            />
          )}

          {specialty === 'psychology' && (
            <PsychologyWorkspaceSection
              psychAffect={psychAffect}
              setPsychAffect={setPsychAffect}
              psychInterview={psychInterview}
              setPsychInterview={setPsychInterview}
              psychTest={psychTest}
              setPsychTest={setPsychTest}
              psychTechnique={psychTechnique}
              setPsychTechnique={setPsychTechnique}
              onInsertIntoSoap={insertPsychResultsIntoSoap}
            />
          )}

          {specialty === 'psychomotricite' && (
            <PsychomotricityWorkspaceSection
              motorState={motorState}
              setMotorState={setMotorState}
              onInsertIntoSoap={insertPsychomotorResultsIntoSoap}
            />
          )}

          {/* Fast Clinical SOAP Templates Carousel (Specialty Filtered) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  نماذج سريرية سريعة بنقرة واحدة (Modèles SOAP Rapides -{' '}
                  {specialty === 'psychology' ? 'علم النفس' : specialty === 'psychomotricite' ? 'نفسي حركي' : 'أرطوفونيا'}
                  ):
                </span>
              </span>
              <span className="text-[10px] text-slate-500">اختر نموذجاً لتعبئة الحقول وتعديلها</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {FAST_SOAP_TEMPLATES.filter((tpl) => tpl.specialty === specialty).map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 text-start space-y-1 group transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white group-hover:text-teal-300 transition-colors">
                      {tpl.title}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {tpl.specialty === 'orthophony'
                        ? 'Orthophonie'
                        : tpl.specialty === 'psychology'
                        ? 'Psychologie'
                        : 'Psychomotricité'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2">{tpl.objective}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Targeted Clinical Exercises Chips (Specialty Filtered) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-300">
              التمارين والأنشطة المستهدفة في هذه الجلسة (Exercices Ciblés):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(SPECIALTY_EXERCISES[specialty] || SPECIALTY_EXERCISES.orthophony).map((ex) => {
                const selected = selectedExercises.includes(ex);
                return (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => toggleExercise(ex)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selected
                        ? specialty === 'psychology'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                          : specialty === 'psychomotricite'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                          : 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '} {ex}
                  </button>
                );
              })}
            </div>

            {/* Add custom exercise */}
            <form onSubmit={handleAddCustomExercise} className="flex gap-2 max-w-md pt-1">
              <input
                type="text"
                value={customExercise}
                onChange={(e) => setCustomExercise(e.target.value)}
                placeholder="إضافة تمرين أو هدف سريري آخر..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
              <button
                type="button"
                onClick={handleAddCustomExercise}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs flex items-center space-x-1 space-x-reverse"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </form>
          </div>

          {/* VOICE DICTATION SCRIBE BAR */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 space-x-reverse">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-500/20 text-indigo-400'
                }`}
              >
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">التفريغ والإملاء الصوتي الذكي (AI Voice Scribe):</span>
                <span className="text-[10px] text-slate-400">
                  {isListening ? '🔴 جارٍ الاستماع وتسجيل الملاحظات مباشرة...' : 'تكلم وسيقوم النظام بتفريغ الملاحظات'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={activeSoapField}
                onChange={(e) => setActiveSoapField(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value="subjective">إلى خانة: Subjective (الشكوى)</option>
                <option value="objective">إلى خانة: Objective (الملاحظات)</option>
                <option value="assessment">إلى خانة: Assessment (التقييم)</option>
                <option value="plan">إلى خانة: Plan (الخطة المنزلية)</option>
              </select>

              <select
                value={dictationLang}
                onChange={(e) => setDictationLang(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value="ar-DZ">العربية (الجزائر / الدارجة)</option>
                <option value="ar-SA">العربية الفصحى</option>
                <option value="fr-FR">الفرنسية (Français)</option>
              </select>

              <button
                type="button"
                onClick={toggleVoiceListening}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isListening ? 'إيقاف التسجيل' : 'بدء الإملاء الصوتي 🎙️'}</span>
              </button>
            </div>
          </div>

          {/* STRUCTURED SOAP NOTES */}
          <div className="space-y-4 pt-1 border-t border-slate-800">
            <h4 className="text-xs font-black text-cyan-300 flex items-center space-x-2 space-x-reverse">
              <FileText className="w-4 h-4" />
              <span>
                التوثيق السريري المنهجي للجلسة (Format SOAP -{' '}
                {specialty === 'psychology'
                  ? 'علم النفس العيادي'
                  : specialty === 'psychomotricite'
                  ? 'التأهيل النفسي الحركي'
                  : 'الأرطوفونيا والتخاطب'}
                ):
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* S: Subjective */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-teal-300 flex items-center space-x-1.5 space-x-reverse">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-[10px] font-mono font-black">
                      S
                    </span>
                    <span>الشكوى وملاحظات البداية (Subjective):</span>
                  </label>
                  <span className="text-[10px] text-slate-500">انطباع الولي / شكوى الطفل</span>
                </div>
                <textarea
                  rows={3}
                  value={soapNotes.subjective}
                  onChange={(e) => setSoapNotes({ ...soapNotes, subjective: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                  placeholder={
                    specialty === 'psychology'
                      ? 'الشكوى الحالية المصرّح بها، المزاج العام، الأحداث الأسرية والضغوطات النفسية في الأسبوع الماضي...'
                      : specialty === 'psychomotricite'
                      ? 'ملاحظات الولي حول التوازن، السقوط المتكرر، صعوبة مسك القلم أو التناسق الحركي...'
                      : 'ما صرّح به الولي أو الطفل حول وضوح النطق، استخدام الكلمات، التأتأة في البيت...'
                  }
                />
              </div>

              {/* O: Objective */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-blue-300 flex items-center space-x-1.5 space-x-reverse">
                    <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-mono font-black">
                      O
                    </span>
                    <span>الملاحظات السريرية المقاسة (Objective):</span>
                  </label>
                  <span className="text-[10px] text-slate-500">الأداء الفعلي والتقييم المقاس</span>
                </div>
                <textarea
                  rows={3}
                  value={soapNotes.objective}
                  onChange={(e) => setSoapNotes({ ...soapNotes, objective: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                  placeholder={
                    specialty === 'psychology'
                      ? 'الملاحظة السلوكية المباشرة، لغة الجسد، درجات المقاييس النفسية المطبقة (Conners/CARS/Beck)، التحالف العلاجي...'
                      : specialty === 'psychomotricite'
                      ? 'أداء المسار الحركي، التوازن، التناسق اليدوي البصري، التوجه المكاني والزماني...'
                      : 'نتائج فحص أعضاء النطق، دقة الفونيمات ونسبة المحاولات، الأداء في بطاقات التخاطب والميترونوم...'
                  }
                />
              </div>

              {/* A: Assessment */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-purple-300 flex items-center space-x-1.5 space-x-reverse">
                    <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-mono font-black">
                      A
                    </span>
                    <span>التقييم والتحليل السريري (Assessment):</span>
                  </label>
                  <span className="text-[10px] text-slate-500">التقدم مقارنة بالسابق</span>
                </div>
                <textarea
                  rows={3}
                  value={soapNotes.assessment}
                  onChange={(e) => setSoapNotes({ ...soapNotes, assessment: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed"
                  placeholder={
                    specialty === 'psychology'
                      ? 'التشخيص النفسي الأولي، درجة الاستبصار، وفاعلية آليات التكيف والتعديل السلوكي المعرفي...'
                      : specialty === 'psychomotricite'
                      ? 'النضج الحركي، التطور في المخطط الجسمي والتآزر مقارنة بالجلسة السابقة...'
                      : 'نسبة الدقة في نطق الحروف، التطور اللغوي مقارنة بالتقييم اللغوي السابق...'
                  }
                />
              </div>

              {/* P: Plan */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-300 flex items-center space-x-1.5 space-x-reverse">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-mono font-black">
                      P
                    </span>
                    <span>الخطة القادمة والواجبات المنزلية (Plan):</span>
                  </label>
                  <span className="text-[10px] text-slate-500">الأهداف والتوصيات للأولياء</span>
                </div>
                <textarea
                  rows={3}
                  value={soapNotes.plan}
                  onChange={(e) => setSoapNotes({ ...soapNotes, plan: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                  placeholder={
                    specialty === 'psychology'
                      ? 'الواجبات والتكليفات السلوكية المعرفية المنزلية (CBT)، جدول التعزيز، إرشادات الأسرة...'
                      : specialty === 'psychomotricite'
                      ? 'مسارات التوازن الحركي في البيت، أنشطة التآزر الحركي الموصى بها للأولياء...'
                      : 'أهداف الجلسة القادمة، التمارين الصوتية والتوجيهات للأولياء لمنع التأتأة...'
                  }
                />
              </div>
            </div>
          </div>

          {/* INSTANT BILLING & RECEIPT BOX */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 space-x-reverse">
              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateReceipt}
                  onChange={(e) => setGenerateReceipt(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0 w-4 h-4"
                />
                <span className="text-white font-bold text-xs flex items-center space-x-1 space-x-reverse">
                  <Receipt className="w-3.5 h-3.5 text-teal-400" />
                  <span>إصدار وصل قبض / فاتورة تلقائية للجلسة (Reçu de Paiement)</span>
                </span>
              </label>
            </div>

            {generateReceipt && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">مبلغ الجلسة:</span>
                <input
                  type="number"
                  step="500"
                  value={sessionFee}
                  onChange={(e) => setSessionFee(Number(e.target.value))}
                  className="w-24 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-teal-300 font-mono font-bold"
                />
                <span className="text-xs text-slate-400 font-bold">دج (DZD)</span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-slate-400 text-[11px] flex flex-wrap items-center gap-2">
            <span className="font-mono text-white font-bold">{selectedExercises.length} تمارين</span>
            <span>&bull;</span>
            <span className="font-mono text-amber-300 font-bold">
              {Math.max(1, Math.round(secondsElapsed / 60))} دقيقة مسجلة
            </span>
            {totalTrials > 0 && (
              <>
                <span>&bull;</span>
                <span className="font-mono text-blue-400 font-bold">{accuracyPercent}% دقة محاولات</span>
              </>
            )}
            {starCount > 0 && (
              <>
                <span>&bull;</span>
                <span className="font-bold text-amber-300">⭐ {starCount}/5 نجوم للطفل</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp Button */}
            <button
              type="button"
              onClick={handleSendWhatsAppHomework}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال للولي عبر WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              إلغاء والعودة
            </button>

            {/* Complete & Save Button */}
            <button
              type="button"
              disabled={saving}
              onClick={handleCompleteSession}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs shadow-lg shadow-teal-600/25 flex items-center space-x-2 space-x-reverse transition-all disabled:opacity-50"
            >
              {saving ? (
                <span>جارٍ التوثيق والحفظ...</span>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>تم التوثيق بنجاح ✓</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إنهاء وتوثيق الجلسة وحفظ التقرير ✅</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
