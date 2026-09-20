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
  Smartphone,
  Maximize2,
  Minimize2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Award,
  TrendingUp,
  Compass,
  Edit3,
  ClipboardList,
  Share2,
  Layers,
  AlertTriangle,
  Video,
  Tv,
  Loader2,
  ExternalLink,
  MoveHorizontal,
} from 'lucide-react';
import { appointmentApi, sessionApi, waitingRoomTvApi, parentHomeCareApi, parentPortalApi, whatsappApi, clinicalAiCopilotApi } from '../api';

import {
  OrthophonyWorkspaceSection,
  PsychologyWorkspaceSection,
  PsychomotricityWorkspaceSection,
} from './clinical/SpecialtyWorkspaces';
import InteractiveTestPassationModal from './therapy/InteractiveTestPassationModal';
import SendTestAssignmentModal from './therapy/SendTestAssignmentModal';
import MasterBilanBuilderModal from './assessments/MasterBilanBuilderModal';
import GeneratePortalLinkModal from './portal/GeneratePortalLinkModal';
import SpeechArticulationMatrixModal from './orthophony/SpeechArticulationMatrixModal';
import PsychomotorBodyMapModal from './psychomotricity/PsychomotorBodyMapModal';
import EmdrTraumaStudioModal from './therapy/EmdrTraumaStudioModal';
import TeletherapyRoomView from './teletherapy/TeletherapyRoomView';
import AmbientClinicalScribeModal from './sessions/AmbientClinicalScribeModal';
import DsmDiagnosticAssistantModal from './clinical/DsmDiagnosticAssistantModal';
import SmartPeiBuilderModal from './clinical/SmartPeiBuilderModal';
import CardiacCoherenceStudioModal from './therapy/CardiacCoherenceStudioModal';
import ExposureHierarchyStudioModal from './therapy/ExposureHierarchyStudioModal';
import ActMatrixStudioModal from './therapy/ActMatrixStudioModal';
import ImageryRescriptingStudioModal from './therapy/ImageryRescriptingStudioModal';
import VoiceAcousticStudioModal from './orthophony/VoiceAcousticStudioModal';
import MelodicIntonationStudioModal from './orthophony/MelodicIntonationStudioModal';
import PacingBoardStudioModal from './orthophony/PacingBoardStudioModal';
import PmrRelaxationStudioModal from './psychomotricity/PmrRelaxationStudioModal';
import SnoezelenCalmStudioModal from './psychomotricity/SnoezelenCalmStudioModal';
import BilateralMidlineStudioModal from './psychomotricity/BilateralMidlineStudioModal';
import PecsAndMatchingActivityModal from './teletherapy/PecsAndMatchingActivityModal';
import MedicalLettersBuilder from './MedicalLettersBuilder';
import FastHomeCareAssignModal from './therapy/FastHomeCareAssignModal';
import { getPatientProfileInfo } from '../utils/patientHelper';

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

function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.2);
    });
  } catch (e) {
    // ignore
  }
}

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
    'التفريغ النفسي والإرشاد الأسري (Guidance Parentale)',
    'إدارة التشوهات المعرفية وسجل الأفكار (Thought Journal)',
  ],
  psychomotricite: [
    'المخطط الجسمي والوعي الجسدي (Schéma Corporel)',
    'التنسيق الحركي الدقيق والتآزر البصري (Motricité Fine)',
    'التنسيق الحركي العام والتوازن (Équilibre & Motricité)',
    'التنظيم والتوجه المكاني والزماني (Orientation Spatio-Temporelle)',
    'الجانبية والسيطرة الحركية (Latéralité & Dominance)',
    'التحكم في فرط النشاط والاندفاعية (Inhibition Motrice)',
    'الاسترخاء العضلي والضبط النغمي (Tonus Musculaire)',
  ],
};

// --- DEFAULT PEI CLINICAL GOALS BY SPECIALTY ---
const DEFAULT_PEI_GOALS_BY_SPECIALTY = {
  orthophony: [
    { id: 'ortho_1', text: 'نطق صوت الراء /r/ في بداية الكلمة بدقة 80%', status: 'in_progress' },
    { id: 'ortho_2', text: 'إنتاج جملة اسمية من 3 عناصر (فاعل + فعل + مفعول)', status: 'in_progress' },
    { id: 'ortho_3', text: 'الحفاظ على التواصل البصري أثناء الإجابة لمدة 10 ثوانٍ', status: 'achieved' },
    { id: 'ortho_4', text: 'تقليل التكرارات التأتاتية باستخدام التنفس البطني والبدء السلس', status: 'needs_work' },
    { id: 'ortho_5', text: 'التمييز السمعي الفونولوجي بين الأصوات المتقاربة مخرجياً', status: 'in_progress' },
  ],
  psychology: [
    { id: 'psych_1', text: 'التعرف على الأفكار التلقائية السلبية والتشوهات المعرفية وتدوينها (CBT)', status: 'in_progress' },
    { id: 'psych_2', text: 'خفض شدة نوبات القلق والهلع باستخدام التنفس الاسترخائي (SUDS < 40)', status: 'in_progress' },
    { id: 'psych_3', text: 'تطوير مهارات توكيد الذات والتواصل الإيجابي مع المحيط الاجتماعي', status: 'achieved' },
    { id: 'psych_4', text: 'تنظيم الانفعالات وإدارة الغضب والاندفاعية في المواقف الضاغطة', status: 'needs_work' },
    { id: 'psych_5', text: 'استبدال الأفكار الكارثية ببدائل عقلانية متزنة ومتابعة سجل الأفكار', status: 'in_progress' },
  ],
  psychomotricite: [
    { id: 'motor_1', text: 'التحكم في التوازن الحركي الديناميكي وصعود السلالم باستقلالية', status: 'in_progress' },
    { id: 'motor_2', text: 'تطوير التآزر البصري الحركي وقبضة القلم الوظيفية (Motricité Fine)', status: 'in_progress' },
    { id: 'motor_3', text: 'إدراك المخطط الجسمي وتحديد الاتجاهات المكانية والزمانية بدقة', status: 'achieved' },
    { id: 'motor_4', text: 'تثبيت الجانبية والسيطرة اليدوية والحركية المتجانسة', status: 'needs_work' },
    { id: 'motor_5', text: 'الاسترخاء وضبط التوتر العضلي والانضباط الحركي في المهام الموجهة', status: 'in_progress' },
  ],
};

const FAST_SOAP_TEMPLATES = [
  // --- Orthophony Templates ---
  {
    title: 'تأهيل نطقي ومخارج حروف',
    specialty: 'orthophony',
    subjective: 'الولي يشير إلى تحسن طفيف في وضوح الكلام داخل المنزل مع استمرار صعوبة نطق بعض الأصوات.',
    objective: 'تمارين براكسيز للفم واللسان، تطبيق مصفوفة الأصوات، نسبة الاستجابة الصحيحة بلغت 75% مع التكرار الموجه.',
    assessment: 'تحسن ملحوظ في التمييز السمعي للصوت المستهدف، بحاجة لتثبيت الصوت في الكلمات ثلاثية المقاطع.',
    plan: 'متابعة التمرين على الصوت في سياق جمل بسيطة، وتكليف الولي بتدريب منزلي 10 دقائق يومياً.',
    exercises: ['مخارج الحروف ونطق الأصوات (Articulation)', 'تمارين عضلات الفم والبراكسيز (Praxies Bucco-Faciales)', 'التمييز السمعي الفونولوجي (Discrimination Auditive)'],
  },
  {
    title: 'تأخر لغوي وإثراء تعبيري',
    specialty: 'orthophony',
    subjective: 'الطفل يتواصل بالإشارة والمقاطع المفردة، الولي يرغب في زيادة الرصيد اللغوي وبناء الجمل.',
    objective: 'أنشطة تسمية الفئات والأفعال اليومية، تحفيز إنتاج جملة من كلمتين (فعل + اسم).',
    assessment: 'استجابة جيدة للتحفيز، زيادة في محاولات التقليد الصوتي مع انتباه مشترك إيجابي.',
    plan: 'تعزيز الأفعال اليومية، تقليل الشاشات في البيت وتكثيف الحوار التفاعلي اليومي.',
    exercises: ['إثراء الرصيد اللغوي والتركيبي (Vocabulaire & Syntaxe)', 'التواصل الوظيفي ونظام بيكس (PECS & Pragmatique)'],
  },
  {
    title: 'جلسة طلاقة وتأتأة',
    specialty: 'orthophony',
    subjective: 'الطفل يعاني من تكرار في المقاطع الأولى عند الحماس أو التوتر مع بعض التشنجات الخفيفة.',
    objective: 'تمارين التنفس البطني والاسترخاء، تقنية البداية السلسة (Easy Onset) والتبطيء الإيقاعي بالميترونوم.',
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
    objective: 'تطبيق لوحة التعزيز السلوكي، تدريب على إكمال مهمة محددة من خطوتين مع مؤقت بصري.',
    assessment: 'استجابة جيدة لنظام المكافآت الفورية، انخفاض الاندفاعية بنسبة 35% عند تجزئة المهام.',
    plan: 'تطبيق جدول التعزيز الإيجابي في المنزل، تدريب الوالدين على تقنية الوقت المستقطع الموجه (Time-out).',
    exercises: ['تعديل السلوك والتعزيز الإيجابي (Gestion ABA)', 'تطبيق المقاييس والاختبارات النفسية (Tests Psychométriques)', 'الإرشاد الأسري والتوجيه الوالدي (Guidance Parentale)'],
  },
  {
    title: 'دعم نفسي وإدارة القلق (CBT)',
    specialty: 'psychology',
    subjective: 'العميل يعبر عن خوف شديد من الفشل، أعراض جسدية كخفقان القلب وصعوبة النوم قبيل المواعيد الهامة.',
    objective: 'تحديد الأفكار التلقائية المشوهة (التفكير الكارثي)، تدريب على التنفس الاسترخائي التدريجي ومقياس SUDS.',
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

// --- 18 STANDARDIZED DIGITAL SCALES FOR IN-SESSION DIRECT PASSATION ---
const CLINICAL_SCALES_OPTIONS = [
  { code: 'CARS-2', title: 'CARS-2 (مقياس تقدير التوحد الطفولي 2)', specialty: 'orthophony' },
  { code: 'M-CHAT', title: 'M-CHAT-R/F (الكشف المبكر عن التوحد)', specialty: 'orthophony' },
  { code: 'SNAP-IV', title: 'SNAP-IV (فرط الحركة وتشتت الانتباه TDAH)', specialty: 'psychology' },
  { code: 'PHQ-9', title: 'PHQ-9 (استبيان صحة المريض - الاكتئاب)', specialty: 'psychology' },
  { code: 'GAD-7', title: 'GAD-7 (مقياس اضطراب القلق العام)', specialty: 'psychology' },
  { code: 'BDI-II', title: 'BDI-II (مقياس بيك للاكتئاب 2)', specialty: 'psychology' },
  { code: 'HAM-A', title: 'HAM-A (مقياس هاملتون للقلق)', specialty: 'psychology' },
  { code: 'HAM-D', title: 'HAM-D (مقياس هاملتون للاكتئاب)', specialty: 'psychology' },
  { code: 'PCL-5', title: 'PCL-5 (اضطراب ما بعد الصدمة PTSD)', specialty: 'psychology' },
  { code: 'DASS-21', title: 'DASS-21 (مقياس الاكتئاب والقلق والضغط النفسي)', specialty: 'psychology' },
  { code: 'Y-BOCS', title: 'Y-BOCS (مقياس الوسواس القهري ييل-براون)', specialty: 'psychology' },
  { code: 'SPIN', title: 'SPIN (مقياس الرهاب والقلق الاجتماعي)', specialty: 'psychology' },
  { code: 'PDSS-SR', title: 'PDSS-SR (مقياس شدة نوبات الهلع)', specialty: 'psychology' },
  { code: 'ISI', title: 'ISI (مؤشر شدة الأرق واضطراب النوم)', specialty: 'psychology' },
  { code: 'ASRS', title: 'ASRS (أعراض تشتت الانتباه للبالغين)', specialty: 'psychology' },
  { code: 'AQ-10', title: 'AQ-10 (طيف التوحد الموجز للبالغين)', specialty: 'psychology' },
  { code: 'PSS-10', title: 'PSS-10 (مقياس الضغط النفسي المدرك)', specialty: 'psychology' },
  { code: 'RSES', title: 'RSES (مقياس روزنبرغ لتقدير الذات)', specialty: 'psychology' },
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- 4-STEP GUIDED CLINICAL WORKFLOW STATE ---
  // Step 1: الاستقبال والتاريخ والمزاج (Accueil & Baseline)
  // Step 2: قمرة التدخل والأدوات السريرية (Clinical Intervention & Protocols)
  // Step 3: التوثيق السريري الذكي (SOAP Notes & AI Scribe)
  // Step 4: الإنهاء والإحالات والواجبات والفوترة (Closure, Referrals & Billing)
  const [currentStep, setCurrentStep] = useState(1);

  // Active sub-tab inside Step 2: 'protocols' | 'scales' | 'trials' | 'metronome' | 'scratchpad' | 'referrals'
  const [interventionTab, setInterventionTab] = useState('protocols');

  // Direct In-Session Clinical Test Passation Modal State
  const [activePassationTest, setActivePassationTest] = useState(null);
  const [selectedScaleCode, setSelectedScaleCode] = useState('CARS-2');
  const [showSendTestModal, setShowSendTestModal] = useState(false);
  const [showMasterBilanModal, setShowMasterBilanModal] = useState(false);
  const [showPortalLinkModal, setShowPortalLinkModal] = useState(false);
  const [showDsmModal, setShowDsmModal] = useState(false);
  const [showSmartPeiModal, setShowSmartPeiModal] = useState(false);
  const [showPecsModal, setShowPecsModal] = useState(false);
  const [showMedicalLettersModal, setShowMedicalLettersModal] = useState(false);
  const [showFastHomeCareModal, setShowFastHomeCareModal] = useState(false);

  // Live Persistent Timer State
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef(null);

  // Clinical Session Form State
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

  // --- CLINICAL TOOL 1: SUDS SCALE (Subjective Units of Distress Scale 0-100) ---
  const [sudsPre, setSudsPre] = useState(60);
  const [sudsPost, setSudsPost] = useState(25);

  // --- CLINICAL TOOL 2: COGNITIVE DISTORTIONS & THOUGHT RECORD (CBT) ---
  const [selectedDistortions, setSelectedDistortions] = useState([]);
  const [automaticThought, setAutomaticThought] = useState('');
  const [rationalAlternative, setRationalAlternative] = useState('');

  const commonDistortionsList = [
    { id: 'catastrophizing', label: 'التفكير الكارثي (Catastrophisation)' },
    { id: 'overgeneralization', label: 'التعميم المفرط (Généralisation)' },
    { id: 'all_or_nothing', label: 'الكل أو لا شيء (Tout ou Rien)' },
    { id: 'mind_reading', label: 'قراءة الأفكار (Lecture de Pensée)' },
    { id: 'personalization', label: 'اللوم والشخصنة (Personnalisation)' },
    { id: 'discounting_positives', label: 'التهوين من الإيجابيات (Dévalorisation)' },
  ];

  const toggleDistortion = (id) => {
    if (selectedDistortions.includes(id)) {
      setSelectedDistortions(selectedDistortions.filter((x) => x !== id));
    } else {
      setSelectedDistortions([...selectedDistortions, id]);
    }
  };

  // --- CLINICAL TOOL 3: PHONETIC ARTICULATION MATRIX (Orthophony) ---
  const [phoneticTargetSound, setPhoneticTargetSound] = useState('/ر/');
  const [phoneticPosition, setPhoneticPosition] = useState('initial'); // initial, medial, final
  const [phoneticError, setPhoneticError] = useState('distortion'); // distortion, omission, substitution
  const [isSpeechMatrixModalOpen, setIsSpeechMatrixModalOpen] = useState(false);

  // --- CLINICAL TOOL 4: TONUS & MOTOR EXAMINATION (Psychomotricity) ---
  const [tonusState, setTonusState] = useState('eutonie'); // eutonie, hypertonie, hypotonie
  const [balanceState, setBalanceState] = useState('stable'); // stable, unsteady, clumsy
  const [isBodyMapModalOpen, setIsBodyMapModalOpen] = useState(false);
  const [showEmdrModal, setShowEmdrModal] = useState(false);
  const [showCardiacModal, setShowCardiacModal] = useState(false);
  const [showExposureModal, setShowExposureModal] = useState(false);
  const [showActMatrixModal, setShowActMatrixModal] = useState(false);
  const [showImageryModal, setShowImageryModal] = useState(false);
  const [showVoiceAcousticModal, setShowVoiceAcousticModal] = useState(false);
  const [showMelodicIntonationModal, setShowMelodicIntonationModal] = useState(false);
  const [showPacingBoardModal, setShowPacingBoardModal] = useState(false);
  const [showPmrModal, setShowPmrModal] = useState(false);
  const [showSnoezelenModal, setShowSnoezelenModal] = useState(false);
  const [showBilateralMidlineModal, setShowBilateralMidlineModal] = useState(false);
  const [isTeletherapyModalOpen, setIsTeletherapyModalOpen] = useState(false);
  const [showAmbientScribeModal, setShowAmbientScribeModal] = useState(false);

  // Handle injection of Ambient Scribe SOAP notes directly into live consultation
  const handleInjectAmbientSoap = (data) => {
    setSoapNotes((prev) => ({
      ...prev,
      subjective: data.subjective ? (prev.subjective ? `${prev.subjective}\n\n${data.subjective}` : data.subjective) : prev.subjective,
      objective: data.objective ? (prev.objective ? `${prev.objective}\n\n${data.objective}` : data.objective) : prev.objective,
      assessment: data.assessment ? (prev.assessment ? `${prev.assessment}\n\n${data.assessment}` : data.assessment) : prev.assessment,
      plan: data.plan ? (prev.plan ? `${prev.plan}\n\n${data.plan}` : data.plan) : prev.plan,
    }));
    if (data.recommended_homework && !homeworkPrescription) {
      setHomeworkPrescription(data.recommended_homework);
    }
  };

  // --- CLINICAL TOOL 5: TRIAL & ACCURACY COUNTER ---
  const [trialSound, setTrialSound] = useState('صوت الراء (ر)');
  const [correctTrials, setCorrectTrials] = useState(0);
  const [incorrectTrials, setIncorrectTrials] = useState(0);
  const totalTrials = correctTrials + incorrectTrials;
  const accuracyPercent = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 0;

  // --- CLINICAL TOOL 6: FLUENCY METRONOME ---
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [metronomeBpm, setMetronomeBpm] = useState(60);
  const [metronomeBeat, setMetronomeBeat] = useState(false);
  const metronomeIntervalRef = useRef(null);

  // --- CLINICAL TOOL 7: LIVE SCRATCHPAD / QUICK NOTES ---
  const [scratchNotes, setScratchNotes] = useState('');

  // --- CLINICAL TOOL 8: MEDICAL REFERRALS & PRESCRIPTIONS ---
  const [referralType, setReferralType] = useState('orl'); // orl, eeg, audio, neuro, psych, ped
  const [referralNotes, setReferralNotes] = useState('');

  // --- CLINICAL EVALUATION STATES FOR ADVANCED SECTIONS ---
  const [orthoBucco, setOrthoBucco] = useState({
    lips: 'normal',
    tongue: 'normal',
    palate: 'normal',
    bite: 'normal',
    respiration: 'abdominal',
  });
  const [orthoFluencyType, setOrthoFluencyType] = useState('none');
  const [orthoSecondaryBehaviors, setOrthoSecondaryBehaviors] = useState(false);

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

  const [motorState, setMotorState] = useState({
    bodySchema: 'good',
    lateralization: 'right_handed',
    balance: 'stable',
    fineMotor: 'good',
    spatialTemporal: 'oriented',
  });

  // --- VOICE SCRIBE & DICTATION ---
  const [isListening, setIsListening] = useState(false);
  const [dictationLang, setDictationLang] = useState('ar-DZ');
  const [activeSoapField, setActiveSoapField] = useState('objective');
  const recognitionRef = useRef(null);

  // --- PEI CLINICAL GOALS (SPECIALTY DYNAMIC) ---
  const [clinicalGoals, setClinicalGoals] = useState(
    DEFAULT_PEI_GOALS_BY_SPECIALTY.orthophony
  );
  const [newCustomGoalText, setNewCustomGoalText] = useState('');

  // --- AI CLINICAL COPILOT & SMART GOALS SUITE ---
  const [loadingAiGoals, setLoadingAiGoals] = useState(false);
  const [aiSuggestedGoals, setAiSuggestedGoals] = useState([]);
  const [showAiGoalsDrawer, setShowAiGoalsDrawer] = useState(false);
  const [aiGoalsFeedback, setAiGoalsFeedback] = useState(null);
  const [aiRedAlert, setAiRedAlert] = useState(false);
  const [aiSafetyNotice, setAiSafetyNotice] = useState(null);

  // --- AI NEXT SESSION BLUEPRINT & HOME PROTOCOL ---
  const [loadingNextSessionAi, setLoadingNextSessionAi] = useState(false);
  const [aiNextSessionBlueprint, setAiNextSessionBlueprint] = useState(null);
  const [aiNextSessionFeedback, setAiNextSessionFeedback] = useState(null);

  // --- PREVIOUS SESSIONS ARCHIVE ---
  const [pastSessionsList, setPastSessionsList] = useState([]);
  const [selectedPastSessionId, setSelectedPastSessionId] = useState(null);
  const [isPreviousSessionExpanded, setIsPreviousSessionExpanded] = useState(false);
  const [showPastSessionsArchiveModal, setShowPastSessionsArchiveModal] = useState(false);
  const [pastSessionSearchQuery, setPastSessionSearchQuery] = useState('');
  const [previousSessionViewMode, setPreviousSessionViewMode] = useState('summary'); // 'summary' or 'soap'
  const [previousSession, setPreviousSession] = useState({
    date: 'الجلسة السابقة',
    summary: 'تمارين تأهيل وتدريب نطقي ومتابعة البرنامج السريري',
    homeworkAssigned: 'متابعة التمارين المنزلية المحددة.',
    soap: { subjective: '', objective: '', assessment: '', plan: '', compliance: '', fee: '', raw: '', clinicalPayloads: {} },
  });

  const parseStructuredSoap = (rawNotes) => {
    if (!rawNotes) return { subjective: '', objective: '', assessment: '', plan: '', compliance: '', fee: '', raw: '', clinicalPayloads: {} };
    
    const result = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      compliance: '',
      fee: '',
      raw: rawNotes,
      clinicalPayloads: {
        suds: null,
        cbt: null,
        phonetic: null,
        protocols: [],
        scales: [],
      },
    };

    const lines = rawNotes.split('\n');
    let currentKey = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('• Subjective:')) {
        currentKey = 'subjective';
        result.subjective = trimmed.replace('• Subjective:', '').trim();
      } else if (trimmed.startsWith('• Objective:')) {
        currentKey = 'objective';
        result.objective = trimmed.replace('• Objective:', '').trim();
      } else if (trimmed.startsWith('• Assessment:')) {
        currentKey = 'assessment';
        result.assessment = trimmed.replace('• Assessment:', '').trim();
      } else if (trimmed.startsWith('• Plan:')) {
        currentKey = 'plan';
        result.plan = trimmed.replace('• Plan:', '').trim();
      } else if (trimmed.startsWith('• Clinical Compliance:')) {
        currentKey = 'compliance';
        result.compliance = trimmed.replace('• Clinical Compliance:', '').trim();
      } else if (trimmed.startsWith('• Session Fee:')) {
        currentKey = 'fee';
        result.fee = trimmed.replace('• Session Fee:', '').trim();
      } else if (currentKey && trimmed && !trimmed.startsWith('• Targeted Exercises:')) {
        result[currentKey] += '\n' + trimmed;
      }
    }

    // 1. SUDS Extraction (Subjective Units of Distress Scale 0-100)
    const sudsPreMatch = rawNotes.match(/قبل التدخل(?: العلاجي)?:\s*(\d+)\/100/i) ||
                         rawNotes.match(/Baseline SUDS\)?:\s*(\d+)\/100/i);
    const sudsPostMatch = rawNotes.match(/بعد التدخل(?: العلاجي)?:\s*(\d+)\/100/i) ||
                          rawNotes.match(/انتهاء التعريض:\s*(\d+)\/100/i) ||
                          rawNotes.match(/تراجع الضيق الانفعالي بعد الجلسة إلى:\s*(\d+)\/10/i);
    const sudsDiffMatch = rawNotes.match(/معدل انخفاض التوتر:\s*([^\n]+)/i);

    if (sudsPreMatch || sudsPostMatch) {
      result.clinicalPayloads.suds = {
        pre: sudsPreMatch ? sudsPreMatch[1] : null,
        post: sudsPostMatch ? sudsPostMatch[1] : null,
        diff: sudsDiffMatch ? sudsDiffMatch[1].trim() : null,
      };
    }

    // 2. CBT Restructuring Extraction
    const cbtDistortionsMatch = rawNotes.match(/التشوهات المعرفية المحددة:\s*([^\n]+)/i);
    const cbtAutoThoughtMatch = rawNotes.match(/الفكرة التلقائية(?: السلبية)?:\s*"([^"]+)"/i) ||
                                rawNotes.match(/الفكرة التلقائية(?: السلبية)?:\s*([^\n]+)/i);
    const cbtAltThoughtMatch = rawNotes.match(/الفكرة البديلة(?: العقلانية)?:\s*"([^"]+)"/i) ||
                               rawNotes.match(/الفكرة البديلة(?: العقلانية)?:\s*([^\n]+)/i);

    if (cbtDistortionsMatch || cbtAutoThoughtMatch || cbtAltThoughtMatch) {
      result.clinicalPayloads.cbt = {
        distortions: cbtDistortionsMatch ? cbtDistortionsMatch[1].trim() : null,
        automaticThought: cbtAutoThoughtMatch ? cbtAutoThoughtMatch[1].trim() : null,
        rationalAlternative: cbtAltThoughtMatch ? cbtAltThoughtMatch[1].trim() : null,
      };
    }

    // 3. Phonetic Articulation Matrix & Trials Extraction
    const phonTargetMatch = rawNotes.match(/الصوت المستهدف:\s*([^\n]+)/i);
    const phonErrMatch = rawNotes.match(/نوع الاضطراب:\s*([^\n]+)/i);
    const trialAccMatch = rawNotes.match(/Trial Accuracy:\s*([^\n]+)/i);

    if (phonTargetMatch || phonErrMatch || trialAccMatch) {
      result.clinicalPayloads.phonetic = {
        target: phonTargetMatch ? phonTargetMatch[1].trim() : null,
        error: phonErrMatch ? phonErrMatch[1].trim() : null,
        accuracy: trialAccMatch ? trialAccMatch[1].trim() : null,
      };
    }

    // 4. Clinical Protocols Suite Detection
    const detectedProtocols = [];
    if (/EMDR|BLS|ثنائي الجانب/i.test(rawNotes)) detectedProtocols.push({ name: 'EMDR ومعالجة الصدمات', icon: '⚡' });
    if (/الاتساق القلبي|HRV|Coherence|التنفس 365/i.test(rawNotes)) detectedProtocols.push({ name: 'الاتساق القلبي HRV', icon: '🫁' });
    if (/سلم التعريض|منع الاستجابة|ERP|Habituation/i.test(rawNotes)) detectedProtocols.push({ name: 'تعريض ERP', icon: '🪜' });
    if (/مصفوفة القبول|ACT Matrix|فك الاندماج/i.test(rawNotes)) detectedProtocols.push({ name: 'مصفوفة ACT', icon: '🧭' });
    if (/إعادة صياغة الصور|Imagery Rescripting|مخططات الذات/i.test(rawNotes)) detectedProtocols.push({ name: 'صياغة الصور Schema', icon: '🎭' });
    if (/التحليل الصوتي|Voice Acoustic|Pitch|MPT/i.test(rawNotes)) detectedProtocols.push({ name: 'التحليل الصوتي Voice', icon: '🎙️' });
    if (/التنغيم الموسيقي|MIT|Melodic Intonation/i.test(rawNotes)) detectedProtocols.push({ name: 'التنغيم الموسيقي MIT', icon: '🎵' });
    if (/لوح التقطيع|Pacing Board|طلاقة الكلام|%SS/i.test(rawNotes)) detectedProtocols.push({ name: 'لوح التقطيع Pacing', icon: '🎯' });
    if (/استرخاء جاكوبسون|PMR|Progressive Muscle/i.test(rawNotes)) detectedProtocols.push({ name: 'استرخاء PMR', icon: '🧘' });
    if (/سنوزلين|Snoezelen|حسي/i.test(rawNotes)) detectedProtocols.push({ name: 'غرفة سنوزلين', icon: '✨' });
    if (/PECS|بيكس|مطابقة صور/i.test(rawNotes)) detectedProtocols.push({ name: 'PECS والمطابقة', icon: '🃏' });
    result.clinicalPayloads.protocols = detectedProtocols;

    // 5. Standardized Clinical Scales Detection
    const detectedScales = [];
    const scaleMatches = [
      { code: 'BDI-II', regex: /BDI(?:-II)?/i, label: 'مقياس بيك للاكتئاب (BDI-II)' },
      { code: 'PHQ-9', regex: /PHQ-?9/i, label: 'صحة المريض (PHQ-9)' },
      { code: 'GAD-7', regex: /GAD-?7/i, label: 'القلق العام (GAD-7)' },
      { code: 'STAI', regex: /STAI/i, label: 'قلق الحالة والسمة (STAI)' },
      { code: 'PCL-5', regex: /PCL-?5/i, label: 'كرب ما بعد الصدمة (PCL-5)' },
      { code: 'M-CHAT-R', regex: /M-?CHAT/i, label: 'كشف التوحد (M-CHAT-R)' },
      { code: 'VINELAND', regex: /VINELAND/i, label: 'السلوك التكيفي (Vineland)' },
      { code: 'ADOS-2', regex: /ADOS/i, label: 'تشخيص التوحد (ADOS-2)' },
      { code: 'ALOUETTE', regex: /Alouette|ألوويت/i, label: 'القراءة السريعة (Alouette)' },
      { code: 'DO80', regex: /DO-?80/i, label: 'تسمية الصور (DO80)' },
      { code: 'NEEL', regex: /NEEL|نيل/i, label: 'اللغة الشفهية (N-EEL)' },
      { code: 'L2MA', regex: /L2MA/i, label: 'بطارية المطالعة (L2MA)' },
      { code: 'WAIS', regex: /WAIS/i, label: 'ذكاء البالغين (WAIS)' },
      { code: 'WISC', regex: /WISC/i, label: 'ذكاء الأطفال (WISC)' },
      { code: 'RAVEN', regex: /Raven|ريفن/i, label: 'المصفوفات المتتابعة (Raven)' },
    ];
    for (const sc of scaleMatches) {
      if (sc.regex.test(rawNotes)) {
        detectedScales.push(sc);
      }
    }
    result.clinicalPayloads.scales = detectedScales;

    return result;
  };

  const parseSessionData = (rawSession) => {
    if (!rawSession) {
      return {
        id: null,
        date: 'الجلسة السابقة',
        duration: 45,
        specialty: specialty,
        specialistName: 'الأخصائي المعالج',
        exercises: [],
        summary: 'لا توجد ملاحظات سابقة مسجلة.',
        homeworkAssigned: 'متابعة البرنامج السريري والتمارين المعتمدة.',
        soap: { subjective: '', objective: '', assessment: '', plan: '', compliance: '', fee: '', raw: '' },
        raw: null,
      };
    }

    const rawNotes = rawSession.progress_notes || rawSession.notes || '';
    const dateStr = rawSession.session_date
      ? new Date(rawSession.session_date).toLocaleDateString('ar-DZ', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'الجلسة السابقة';

    const soap = parseStructuredSoap(rawNotes);

    // Parse homework / plan from SOAP notes if available
    let homework = rawSession.homework || soap.plan || '';
    if (!homework && rawNotes) {
      const lines = rawNotes.split('\n');
      for (const l of lines) {
        if (l.trim().startsWith('• Plan:')) {
          homework = l.replace('• Plan:', '').trim();
          break;
        }
        if (l.trim().includes('الواجبات:') || l.trim().includes('التمارين المنزلية:')) {
          homework = l.replace(/.*(الواجبات:|التمارين المنزلية:)/, '').trim();
          break;
        }
      }
    }
    if (!homework) {
      homework = 'متابعة البرنامج السريري والتمارين المنزلية المعتمدة.';
    }

    return {
      id: rawSession.id,
      date: dateStr,
      duration: rawSession.duration_minutes || 45,
      specialty: rawSession.specialty || specialty,
      specialistName: rawSession.specialist?.name || 'الأخصائي المعالج',
      exercises: Array.isArray(rawSession.exercises_targeted) ? rawSession.exercises_targeted : [],
      summary: rawNotes || 'تمارين تأهيل ومتابعة سريرية منتظمة.',
      homeworkAssigned: homework,
      soap,
      raw: rawSession,
    };
  };

  const handleSelectPastSession = (id) => {
    const numId = Number(id);
    setSelectedPastSessionId(numId);
    const target = pastSessionsList.find((s) => s.id === numId);
    if (target) {
      setPreviousSession(parseSessionData(target));
    }
  };

  // --- BILLING & RECEIPT ---
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
            let cleanNotes = app.notes.trim();
            if (cleanNotes.includes('استقبال فوري عبر مكتب السكرتارية • السبب:')) {
              cleanNotes = cleanNotes.replace('استقبال فوري عبر مكتب السكرتارية • السبب:', '').trim();
              if (cleanNotes === 'فحص عام' || cleanNotes === 'استشارة أولية' || cleanNotes === 'فحص أولي') {
                cleanNotes = '';
              }
            } else if (cleanNotes.startsWith('استقبال فوري')) {
              cleanNotes = '';
            }
            if (cleanNotes) {
              setSoapNotes((prev) => ({ ...prev, subjective: cleanNotes }));
            }
          }
        })
        .catch((err) => console.error('Failed to load active appointment:', err))
        .finally(() => setLoading(false));
    }
  }, [appointmentId, patient]);

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
            setPreviousSession(parseSessionData(last));
          }
        })
        .catch((e) => console.warn('Could not load past sessions:', e));
    }
  }, [patient?.id]);

  // --- TV WAITING ROOM CALLING STATE ---
  const [isCallingOnTv, setIsCallingOnTv] = useState(false);
  const [calledOnTvFeedback, setCalledOnTvFeedback] = useState(null);

  const handleCallPatientOnTv = async () => {
    if (!appointmentId || isCallingOnTv) return;
    setIsCallingOnTv(true);
    try {
      const res = await waitingRoomTvApi.callPatient(appointmentId);
      if (res && res.success) {
        setCalledOnTvFeedback(`تم نداء ${patient?.first_name || 'المريض'} على الشاشة (تذكرة ${res.token || ''}) 📢`);
        playNotificationChime();
        setTimeout(() => setCalledOnTvFeedback(null), 5000);
      }
    } catch (err) {
      console.warn('TV call error:', err);
    } finally {
      setIsCallingOnTv(false);
    }
  };

  // --- DIGITAL PARENT HOME-CARE NOTES STATE ---
  const [parentNotes, setParentNotes] = useState([]);
  const [loadingParentNotes, setLoadingParentNotes] = useState(false);

  useEffect(() => {
    if (patient?.id) {
      setLoadingParentNotes(true);
      parentHomeCareApi
        .getPatientNotes(patient.id)
        .then((res) => {
          if (res && res.success) {
            setParentNotes(res.notes || []);
          }
        })
        .catch((e) => console.warn('Could not load parent notes:', e))
        .finally(() => setLoadingParentNotes(false));
    }
  }, [patient?.id]);

  const handleAcknowledgeParentNote = async (noteId) => {
    if (!patient?.id) return;
    try {
      const res = await parentHomeCareApi.acknowledgeNote(patient.id, noteId);
      if (res && res.success) {
        setParentNotes(res.notes || []);
        playNotificationChime();
      }
    } catch (e) {
      console.warn('Acknowledge note error:', e);
    }
  };

  const handleInsertParentNoteIntoSoap = (note) => {
    const snippet = `\n[ملاحظة منزلية من ولي الأمر]: "${note.note}" (${note.category || 'سلوك'} • المزاج: ${note.mood || 'مستقر'})`;
    setSoapNotes((prev) => ({
      ...prev,
      subjective: (prev.subjective ? `${prev.subjective}\n` : '') + snippet,
    }));
    playNotificationChime();
    alert('تم دمج ملاحظة ولي الأمر في خانة الملاحظات الذاتية (Subjective) بنجاح!');
  };

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
    if (DEFAULT_PEI_GOALS_BY_SPECIALTY[newSpecialty]) {
      setClinicalGoals(DEFAULT_PEI_GOALS_BY_SPECIALTY[newSpecialty]);
    }
    playBeep(800, 0.06);
  };

  // Apply Fast Clinical Template
  const applyTemplate = (tpl) => {
    setSpecialty(tpl.specialty);
    if (DEFAULT_PEI_GOALS_BY_SPECIALTY[tpl.specialty]) {
      setClinicalGoals(DEFAULT_PEI_GOALS_BY_SPECIALTY[tpl.specialty]);
    }
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

  // --- SOAP INSERTERS ---

  // 1. Insert SUDS Distress scale into SOAP
  const insertSudsIntoSoap = () => {
    const reliefDiff = sudsPre - sudsPost;
    const sudsSnippet = `\n[مقياس شدة الضيق اللحظي SUDS (0-100)]:
• قبل التدخل العلاجي: ${sudsPre}/100
• بعد التدخل العلاجي: ${sudsPost}/100
• معدل انخفاض التوتر: ${reliefDiff > 0 ? `تحسن بمقدار -${reliefDiff} نقطة (${Math.round((reliefDiff / sudsPre) * 100)}%) ✅` : 'استقرار'}`;

    setSoapNotes((prev) => ({
      ...prev,
      objective: (prev.objective || '') + sudsSnippet,
    }));
    playNotificationChime();
    alert('تم إدراج مؤشرات مقياس الضيق (SUDS) في خانة Objective بنجاح!');
  };

  // 2. Insert Cognitive Distortions Log into SOAP
  const insertDistortionsIntoSoap = () => {
    const distNames = selectedDistortions
      .map((d) => commonDistortionsList.find((x) => x.id === d)?.label || d)
      .join('، ');

    const snippet = `\n[سجل إعادة الهيكلة المعرفية CBT]:
• التشوهات المعرفية المحددة: ${distNames || 'لا توجد تشوهات محددة'}
${automaticThought ? `• الفكرة التلقائية السلبية: "${automaticThought}"\n` : ''}${
      rationalAlternative ? `• الفكرة البديلة العقلانية: "${rationalAlternative}"\n` : ''
    }`;

    setSoapNotes((prev) => ({
      ...prev,
      objective: (prev.objective || '') + snippet,
    }));
    playNotificationChime();
    alert('تم إدراج سجل التشوهات المعرفية في خانة Objective بنجاح!');
  };

  // 3. Insert Phonetic Matrix into SOAP
  const insertPhoneticMatrixIntoSoap = () => {
    const posMap = { initial: 'بداية الكلمة', medial: 'وسط الكلمة', final: 'نهاية الكلمة' };
    const errMap = { distortion: 'تشويه (Distorsion)', omission: 'حذف (Omission)', substitution: 'إبدال (Substitution)' };

    const snippet = `\n[مصفوفة فحص النطق الصوتي]:
• الصوت المستهدف: ${phoneticTargetSound} في (${posMap[phoneticPosition]})
• نوع الاضطراب: ${errMap[phoneticError]}`;

    setSoapNotes((prev) => ({
      ...prev,
      objective: (prev.objective || '') + snippet,
    }));
    playNotificationChime();
    alert('تم إدراج نتائج فحص النطق في خانة Objective بنجاح!');
  };

  // 4. Insert Scratchpad into SOAP Field
  const insertScratchpadIntoField = (fieldName) => {
    if (!scratchNotes.trim()) return;
    setSoapNotes((prev) => ({
      ...prev,
      [fieldName]: (prev[fieldName] ? `${prev[fieldName]}\n` : '') + `[ملاحظات سريعة]: ${scratchNotes.trim()}`,
    }));
    playNotificationChime();
    alert(`تم دمج الملاحظات في خانة (${fieldName.toUpperCase()}) بنجاح!`);
  };

  // 5. Insert Referral into SOAP Plan
  const insertReferralIntoSoapPlan = () => {
    const typeMap = {
      pedopsych: 'طبيب أمراض عقلية أطفال ومراهقين (Pédopsychiatre)',
      adult_psych: 'طبيب أمراض عقلية راشدين (Psychiatre d\'Adultes)',
      neuro: 'استشارة طبيب أعصاب (Neurologue)',
      eeg: 'تخطيط كهربية الدماغ (EEG)',
      orl: 'فحص أنف وأذن وحنجرة (ORL)',
      audio: 'فحص قياس السمع (Audiométrie)',
      ped: 'استشارة طبيب أطفال عام (Pédiatre)',
    };

    const snippet = `\n[توجيه وإحالة طبية متخصصة]:
• الجهة المحال إليها: ${typeMap[referralType] || referralType}
• سبب الإحالة والملاحظات: ${referralNotes || 'استكمال الفحوصات التشخيصية الشاملة'}`;

    setSoapNotes((prev) => ({
      ...prev,
      plan: (prev.plan || '') + snippet,
    }));
    playNotificationChime();
    alert('تم إدراج الإحالة الطبية في خطة الجلسة (Plan) بنجاح!');
  };

  // 6. Insert Trial Accuracy into SOAP Objective
  const insertTrialResultsIntoSoap = () => {
    if (totalTrials === 0) return;
    const textSnippet = `\n[مقياس الدقة اللحظية: ${trialSound} - المحاولات: ${correctTrials}/${totalTrials} (${accuracyPercent}% دقة الاستجابة)]`;
    setSoapNotes((prev) => ({
      ...prev,
      objective: (prev.objective || '') + textSnippet,
    }));
    playNotificationChime();
    alert('تم إدراج نتائج دقة المحاولات في خانة الملاحظات الموضوعية (Objective) بنجاح!');
  };

  // 7. Insert PEI Goals into SOAP Plan
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
    playNotificationChime();
    alert('تم إدراج تقييم الأهداف في خانة الخطة القادمة (Plan) بنجاح!');
  };

  // --- AI HANDLERS: SMART PEI GOALS & NEXT SESSION BLUEPRINT ---

  // Suggest Evidence-Based SMART Goals using Clinical AI
  const handleAiSuggestPeiGoals = async () => {
    if (!patient?.id || loadingAiGoals) return;
    setLoadingAiGoals(true);
    setAiGoalsFeedback(null);
    try {
      const res = await clinicalAiCopilotApi.suggestPeiGoals({
        patient_id: patient.id,
        specialty,
        notes: `${soapNotes.subjective || ''} ${soapNotes.assessment || ''}`.trim(),
        current_goals: clinicalGoals.map((g) => g.text),
        language: 'ar',
      });
      if (res && res.goals) {
        setAiSuggestedGoals(res.goals);
        setShowAiGoalsDrawer(true);
        if (res.red_alert) {
          setAiRedAlert(true);
          setAiSafetyNotice(res.safety_notice);
        }
        playNotificationChime();
      }
    } catch (err) {
      console.error('Error suggesting PEI goals:', err);
      setAiGoalsFeedback(err.message || 'تعذر استدعاء مساعد الأهداف العلاجية الذكي.');
    } finally {
      setLoadingAiGoals(false);
    }
  };

  const handleApplySuggestedGoal = (goal) => {
    const goalText = goal.text || goal.title;
    if (!goalText) return;
    if (!clinicalGoals.some((g) => g.text === goalText)) {
      setClinicalGoals((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          text: goalText,
          status: 'in_progress',
          smart_domain: goal.domain,
          mastery_threshold: goal.mastery_threshold,
        },
      ]);
    }
    if (goal.suggested_exercises && Array.isArray(goal.suggested_exercises)) {
      setSelectedExercises((prev) => Array.from(new Set([...prev, ...goal.suggested_exercises])));
    }
    playBeep(880, 0.05);
  };

  // Generate Next Session Blueprint and Family Home Guidance Protocol
  const handleAiSuggestNextSession = async () => {
    if (!patient?.id || loadingNextSessionAi) return;
    setLoadingNextSessionAi(true);
    setAiNextSessionFeedback(null);
    try {
      const res = await clinicalAiCopilotApi.suggestNextSession({
        patient_id: patient.id,
        specialty,
        soap: soapNotes,
        suds_pre: sudsPre,
        suds_post: sudsPost,
        accuracy: totalTrials > 0 ? accuracyPercent : null,
        exercises: selectedExercises,
        session_duration: Math.round(secondsElapsed / 60),
        language: 'ar',
      });
      if (res) {
        setAiNextSessionBlueprint(res);
        if (res.red_alert) {
          setAiRedAlert(true);
          setAiSafetyNotice(res.home_protocol || 'تنبيه أمان سريري عاجل');
        }
        playNotificationChime();
      }
    } catch (err) {
      console.error('Error generating next session blueprint:', err);
      setAiNextSessionFeedback(err.message || 'تعذر توليد خطة الجلسة القادمة.');
    } finally {
      setLoadingNextSessionAi(false);
    }
  };

  const handleApplyNextSessionToSoapPlan = () => {
    if (!aiNextSessionBlueprint) return;
    const planAddition = aiNextSessionBlueprint.soap_plan_text || aiNextSessionBlueprint.next_session_focus;
    if (planAddition) {
      setSoapNotes((prev) => ({
        ...prev,
        plan: prev.plan ? `${prev.plan}\n\n${planAddition}` : planAddition,
      }));
      setAiNextSessionFeedback('تم إدراج التوصيات والخطة في حقل Plan لتقرير SOAP بنجاح ✅');
      playNotificationChime();
      setTimeout(() => setAiNextSessionFeedback(null), 4000);
    }
  };

  // 8. Copy past session exercises and plan into today's session
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
    playNotificationChime();
    alert('تم نسخ تمارين وخطة الجلسة السابقة إلى جلسة اليوم بنجاح!');
  };

  // 9. Handle direct scale test completion & auto-insertion
  const handleTestPassed = (savedResult) => {
    setActivePassationTest(null);
    playNotificationChime();
    if (savedResult) {
      const scaleName = savedResult.test_name || savedResult.test_code || activePassationTest?.title || 'مقياس إكلينيكي معتمد';
      const scoreValue = savedResult.score ?? savedResult.total_score ?? 'تم الرصد';
      const severityLabel = savedResult.interpretation || savedResult.severity_label || 'استجابة مكتملة';

      const scaleSnippet = `\n[مقياس رقمي معتمد: ${scaleName}]
• الدرجة الخام / السكور: ${scoreValue}
• الدلالة الإكلينيكية: ${severityLabel}`;

      setSoapNotes((prev) => ({
        ...prev,
        objective: (prev.objective || '') + scaleSnippet,
      }));
      alert(`تم تمرير مقياس (${scaleName}) بنجاح وإدراج نتيجته ودلالته في خانة الملاحظات الموضوعية (Objective)!`);
    }
  };

  const [sendingWaHomework, setSendingWaHomework] = useState(false);
  const [waHomeworkSentSuccess, setWaHomeworkSentSuccess] = useState(false);
  const [customWaPhone, setCustomWaPhone] = useState('');

  useEffect(() => {
    if (patient?.phone || patient?.emergency_contact) {
      setCustomWaPhone(patient.phone || patient.emergency_contact || '');
    }
  }, [patient?.phone, patient?.emergency_contact]);

  // Open WhatsApp Homework Sheet (Cloud API + wa.me manual fallback)
  const handleSendWhatsAppHomework = async (forceManual = false) => {
    const rawTarget = customWaPhone || patient?.phone || '';
    const phone = rawTarget.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? `213${phone.substring(1)}` : phone;

    const profile = getPatientProfileInfo(patient, specialty);
    const exercisesText = selectedExercises.slice(0, 3).join('، ') || (profile.isChild ? 'تمارين تأهيلية متخصصة' : 'تكليفات وتمارين علاجية سلوكية');
    const homeworkText =
      soapNotes.plan || (profile.isChild ? 'الرجاء الالتزام بالتوجيهات والتمارين المنزلية المحددة لدعم وتثبيت التطور الإيجابي.' : 'يرجى متابعة التوجيهات والتطبيقات المتفق عليها لتعزيز التحسن السريري المستمر.');

    const clinicTitle =
      specialty === 'psychology'
        ? 'عيادة الاستشارات والدعم النفسي 🧠'
        : specialty === 'psychomotricite'
        ? 'عيادة التأهيل النفسي الحركي 🏃'
        : 'عيادة الأرطوفونيا والتخاطب 🗣️';

    const targetGreeting = profile.isChild
      ? `نحيطكم علماً بأن جلسة اليوم لـ *${profile.displayName}* سارت بشكل إيجابي ومثمر 🌟`
      : `نحيطكم علماً بأن جلسة الاستشارة والمتابعة للأستاذ(ة) *${profile.fullName}* سارت بخطى إيجابية موفقة 🌟`;

    const message = `السلام عليكم ورحمة الله وبركاته،
تحية طيبة من ${clinicTitle}

${targetGreeting}
• *الأنشطة والتدخلات المنجزة:* ${exercisesText}
• *الواجبات والتوصيات السريرية:*
${homeworkText}

نثمن التزامكم وتعاونكم المستمر، ونلقاكم في الموعد القادم بحول الله 🌸`;

    if (forceManual) {
      const encoded = encodeURIComponent(message);
      const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
      window.open(url, '_blank');
      return;
    }

    if (!cleanPhone) {
      alert('رقم هاتف المستلم غير مسجل.');
      return;
    }

    setSendingWaHomework(true);
    try {
      await whatsappApi.sendMessage({
        phone: cleanPhone,
        message,
        patient_id: patient?.id,
        service_type: 'homework_summary',
      });
      setWaHomeworkSentSuccess(true);
      alert(profile.isChild 
        ? '✅ تم إرسال ملخص الجلسة والواجبات إلى واتساب ولي الأمر بنجاح!'
        : '✅ تم إرسال ملخص الجلسة والتوصيات إلى واتساب الأستاذ(ة) بنجاح!');
    } catch (err) {
      console.warn('Cloud API failed, falling back to manual wa.me:', err);
      const encoded = encodeURIComponent(message);
      const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
      window.open(url, '_blank');
    } finally {
      setSendingWaHomework(false);
    }
  };

  const [sendingPortalWa, setSendingPortalWa] = useState(false);
  const [portalWaSentSuccess, setPortalWaSentSuccess] = useState(false);

  // Send Patient Companion Portal Magic Link via WhatsApp Cloud API / fallback
  const handleDirectSendPortalLink = async (forceManual = false) => {
    if (!patient?.id) {
      alert('لا يوجد ملف مريض محدد.');
      return;
    }

    const rawTarget = customWaPhone || patient?.phone || '';
    const phone = rawTarget.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? `213${phone.substring(1)}` : phone;
    const profile = getPatientProfileInfo(patient, specialty);

    setSendingPortalWa(true);
    try {
      const res = await parentPortalApi.generatePortalLink(patient.id);
      if (!res?.success || !res?.portal_token) {
        throw new Error(res?.message || 'تعذر توليد رابط البوابة');
      }

      const portalUrl = `${window.location.origin}/portal/${res.portal_token}`;
      const introGreeting = profile.isChild
        ? `يسرنا تزويدكم برابط تطبيق المرافق المنزلي وبوابة المتابعة السريرية لولي أمر ${profile.displayName}:`
        : `تحية طيبة للأستاذ(ة) (*${profile.fullName}*)، يسرنا تزويدكم برابط بوابة المتابعة السريرية الشخصية والتكليفات:`;

      const customMessage = `السلام عليكم ورحمة الله وبركاته،\nتحية طيبة من العيادة السريرية 🌸\n\n${introGreeting}\n\n🔗 ${portalUrl}\n\n📲 يمكنكم تثبيت التطبيق على شاشة الهاتف مباشرة (PWA) للوصول اليومي السريع بنقرة واحدة.\n\nالمميزات المتوفرة:\n📅 تأكيد المواعيد السريرية ومزامنتها مع الهاتف.\n📚 ممارسة التمارين والتكليفات العلاجية والتسجيل.\n📓 تدوين الملاحظات اليومية ومشاركتها مع المعالج.\n🌬️ تمارين التنفس والاسترخاء الموجه.\n📄 تحميل الحصائل والتقارير الطبية الرسمية (PDF).\n\nدمتم بصحة وعافية ✨`;

      if (forceManual) {
        const encoded = encodeURIComponent(customMessage);
        const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
        window.open(url, '_blank');
        return;
      }

      if (!cleanPhone) {
        setShowPortalLinkModal(true);
        return;
      }

      const sendRes = await whatsappApi.sendMessage({
        phone: cleanPhone,
        message: customMessage,
        patient_id: patient.id,
        service_type: 'patient_portal',
        template_name: 'patient_portal_magic_link',
        template_parameters: [profile.fullName || profile.displayName || 'العميل', patient?.clinic_name || 'العيادة السريرية', portalUrl],
      });

      if (sendRes?.success) {
        setPortalWaSentSuccess(true);
        playNotificationChime();
        alert(profile.isChild 
          ? '✅ تم إرسال رابط بوابة المرافق المنزلي إلى واتساب ولي الأمر بنجاح!'
          : '✅ تم إرسال رابط بوابة المتابعة السريرية إلى واتساب الأستاذ(ة) بنجاح!');
      } else {
        throw new Error(sendRes?.message || 'فشل الإرسال السحابي');
      }
    } catch (err) {
      console.warn('Portal WhatsApp Cloud API failed, opening manual options:', err);
      setShowPortalLinkModal(true);
    } finally {
      setSendingPortalWa(false);
    }
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
• Assessment: ${soapNotes.assessment || 'استجابة إيجابية ومتابعة مستمرة'}
• Plan: ${soapNotes.plan || 'متابعة البرنامج السريري'}
• Clinical Compliance: ${engagementScore}/5
• Targeted Exercises: ${selectedExercises.join(' | ')}
• Session Fee: ${generateReceipt ? `${sessionFee} DZD (وصل مؤكد)` : 'مدرج في الاشتراك'}`;

      const payload = {
        notes: fullProgressReport,
        duration_minutes: durationMinutes,
        specialty,
        exercises_targeted: selectedExercises,
        save_therapy_session: true,
        progress_notes: fullProgressReport,
        generate_receipt: generateReceipt,
        session_fee: sessionFee,
      };

      let result = null;
      const cleanPatientId = (typeof patient === 'object' && patient !== null) ? patient.id : patient;
      if (appointmentId) {
        result = await appointmentApi.completeSession(appointmentId, payload);
      } else if (cleanPatientId) {
        result = await sessionApi.create({
          patient_id: cleanPatientId,
          session_date: new Date().toISOString().split('T')[0],
          duration_minutes: durationMinutes,
          progress_notes: fullProgressReport,
          notes: fullProgressReport,
          specialty,
          exercises_targeted: selectedExercises,
        });
      }

      setSaveSuccess(true);
      playNotificationChime();

      setTimeout(() => {
        if (onSuccess) onSuccess(result);
        if (onCompleted) onCompleted(result);
        if (onFinish) onFinish(result);
        if (onClose) onClose();
      }, 900);
    } catch (error) {
      console.error('Failed to complete session:', error);
      alert('حدث خطأ أثناء حفظ الجلسة: ' + (error.response?.data?.message || error.message || 'خطأ غير معروف'));
    } finally {
      setSaving(false);
    }
  };

  const patientAge = patient?.dob
    ? Math.floor((new Date() - new Date(patient.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  // Step definitions
  const steps = [
    { id: 1, number: '1', title: 'الاستقبال والمزاج', subtitle: 'Accueil & Baseline', icon: Smile },
    { id: 2, number: '2', title: 'التدخل السريري والمقاييس', subtitle: 'Interventions & Tools', icon: Compass },
    { id: 3, number: '3', title: 'التوثيق السريري SOAP', subtitle: 'SOAP Notes & Scribe', icon: FileText },
    { id: 4, number: '4', title: 'الإنهاء والإحالات والفوترة', subtitle: 'Closure & Referrals', icon: CheckCircle2 },
  ];

  // Render structured clinical payloads (SUDS, CBT, Phonetic, Protocols, Scales)
  const renderClinicalPayloadsStrip = (payloads) => {
    if (!payloads) return null;
    const hasAny =
      payloads.suds ||
      payloads.cbt ||
      payloads.phonetic ||
      (payloads.protocols && payloads.protocols.length > 0) ||
      (payloads.scales && payloads.scales.length > 0);
    if (!hasAny) return null;

    return (
      <div className="p-3 rounded-2xl bg-slate-950/90 border border-teal-500/30 space-y-2 text-right">
        <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>المؤشرات والأدوات السريرية المسجلة في هذه الجلسة:</span>
        </span>

        {/* SUDS */}
        {payloads.suds && (
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-900 border border-amber-500/30 text-xs">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span>⚡ مقياس الضيق اللحظي (SUDS):</span>
            </span>
            <span className="text-slate-300 font-mono">
              قبل التدخل: <strong className="text-rose-400">{payloads.suds.pre ? `${payloads.suds.pre}/100` : '—'}</strong>
              {' ➔ '}
              بعد التدخل: <strong className="text-emerald-400">{payloads.suds.post ? `${payloads.suds.post}/100` : '—'}</strong>
            </span>
            {payloads.suds.diff && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {payloads.suds.diff}
              </span>
            )}
          </div>
        )}

        {/* CBT Restructuring */}
        {payloads.cbt && (
          <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-purple-300 font-bold flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span>إعادة الهيكلة المعرفية (CBT Restructuring):</span>
              </span>
              {payloads.cbt.distortions && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/50 text-purple-200 border border-purple-700/40 font-mono">
                  التشوهات: {payloads.cbt.distortions}
                </span>
              )}
            </div>
            {payloads.cbt.automaticThought && (
              <p className="text-slate-400 text-[11px]">
                <span className="text-rose-400/90 font-semibold">الفكرة التلقائية:</span> "{payloads.cbt.automaticThought}"
              </p>
            )}
            {payloads.cbt.rationalAlternative && (
              <p className="text-teal-300 text-[11px]">
                <span className="text-teal-400 font-semibold">الفكرة البديلة المتزنة:</span> "{payloads.cbt.rationalAlternative}"
              </p>
            )}
          </div>
        )}

        {/* Phonetic Matrix & Trials */}
        {payloads.phonetic && (
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-fuchsia-950/30 border border-fuchsia-800/40 text-xs">
            <span className="text-fuchsia-300 font-bold flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>فحص النطق والمخارج الصوتية:</span>
            </span>
            {payloads.phonetic.target && (
              <span className="text-slate-300 text-[11px]">الصوت: <strong className="text-fuchsia-300">{payloads.phonetic.target}</strong></span>
            )}
            {payloads.phonetic.error && (
              <span className="text-slate-400 text-[11px]">({payloads.phonetic.error})</span>
            )}
            {payloads.phonetic.accuracy && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 font-mono">
                {payloads.phonetic.accuracy}
              </span>
            )}
          </div>
        )}

        {/* Protocols Chips */}
        {payloads.protocols && payloads.protocols.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-400 font-bold">البروتوكولات المنفذة:</span>
            {payloads.protocols.map((proto, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-lg bg-teal-950/60 text-teal-300 border border-teal-800/50 flex items-center gap-1 font-medium">
                <span>{proto.icon}</span>
                <span>{proto.name}</span>
              </span>
            ))}
          </div>
        )}

        {/* Standardized Scales Chips */}
        {payloads.scales && payloads.scales.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-400 font-bold">المقاييس المعيارية:</span>
            {payloads.scales.map((sc, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 flex items-center gap-1 font-mono font-bold">
                <span>📊</span>
                <span>{sc.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full ${
          isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-6xl max-h-[94vh] rounded-3xl'
        } bg-slate-950 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100 transition-all`}
      >
        {/* ========================================================================= */}
        {/* 1. PERSISTENT GLOBAL HEADER & CLINICAL COCKPIT STATUS BAR                 */}
        {/* ========================================================================= */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 select-none">
          {/* Left: Patient Badge & Specialty */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              {patient ? (
                <span className="text-sm font-black">{patient.first_name?.[0] || 'P'}</span>
              ) : (
                <Stethoscope className="w-5 h-5 text-teal-400" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="font-black text-white text-sm sm:text-base">
                  {patient ? `${patient.first_name} ${patient.last_name}` : 'المريض في الجلسة'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  {specialty === 'psychology'
                    ? 'علم النفس العيادي'
                    : specialty === 'psychomotricite'
                    ? 'نفسي-حركي'
                    : 'أرطوفونيا وتخاطب'}
                </span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse text-[11px] text-slate-400">
                {patientAge !== null && <span>العمر: {patientAge} سنة</span>}
                {patient?.phone && (
                  <>
                    <span>&bull;</span>
                    <span className="font-mono">{patient.phone}</span>
                  </>
                )}
                <span>&bull;</span>
                <span className="text-slate-500 font-mono">
                  {new Date().toLocaleDateString('ar-DZ', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Live Persistent Stopwatch & Window Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* TV Waiting Room Calling Bell */}
            <button
              type="button"
              onClick={handleCallPatientOnTv}
              disabled={isCallingOnTv}
              className="px-3 py-1.5 rounded-2xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 flex items-center space-x-1.5 space-x-reverse text-xs font-bold transition-all shadow-md active:scale-95"
              title="نداء المريض فوراً على شاشة قاعة الانتظار الذكية"
            >
              <Tv className={`w-3.5 h-3.5 text-teal-400 ${isCallingOnTv ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">
                {isCallingOnTv ? 'جارٍ النداء...' : '📢 نداء على الشاشة'}
              </span>
            </button>

            {/* Teletherapy Live Room Launcher */}
            <button
              type="button"
              onClick={() => setIsTeletherapyModalOpen(true)}
              className="px-3 py-1.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 flex items-center space-x-1.5 space-x-reverse text-xs font-bold transition-all shadow-md"
              title="إطلاق قمرة التطبيب عن بعد والسبورة التفاعلية"
            >
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">💻 تطبيب عن بعد وسبورة</span>
            </button>

            {/* All Past Sessions History Drawer Launcher */}
            <button
              type="button"
              onClick={() => setShowPastSessionsArchiveModal(true)}
              className="px-3 py-1.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 flex items-center space-x-1.5 space-x-reverse text-xs font-bold transition-all shadow-md active:scale-95"
              title="استعراض الأرشيف السريري الكامل لجميع الجلسات السابقة لهذا المريض"
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">أرشيف الجلسات ({pastSessionsList.length})</span>
            </button>

            {/* Live Persistent Stopwatch */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center space-x-2.5 space-x-reverse shadow-inner">
              <Clock className="w-4 h-4 text-amber-400" />
              <div className="text-center">
                <span className="text-[9px] text-slate-400 block leading-none">مدة الجلسة</span>
                <span className="text-sm font-mono font-black text-amber-300">{formatTimer(secondsElapsed)}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title={isTimerRunning ? 'إيقاف مؤقت' : 'استئناف'}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={() => setSecondsElapsed(0)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="تصفير العداد"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة الكاملة (Zen Mode)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-rose-500/20 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors"
              title="إغلاق والعودة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TV Calling Feedback Toast Banner */}
        {calledOnTvFeedback && (
          <div className="px-6 py-2 bg-teal-500/20 border-b border-teal-500/30 text-teal-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-teal-400 animate-pulse" />
              <span>{calledOnTvFeedback}</span>
            </div>
            <button onClick={() => setCalledOnTvFeedback(null)} className="text-teal-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. GUIDED CLINICAL STEPPER NAVIGATOR                                      */}
        {/* ========================================================================= */}
        <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between overflow-x-auto gap-2 select-none">
          <div className="flex items-center gap-1 sm:gap-2 w-full max-w-4xl mx-auto">
            {steps.map((st, idx) => {
              const StepIcon = st.icon;
              const isActive = currentStep === st.id;
              const isPassed = currentStep > st.id;

              return (
                <React.Fragment key={st.id}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(st.id)}
                    className={`flex-1 py-2 px-2.5 sm:px-3 rounded-2xl border transition-all flex items-center space-x-2 space-x-reverse ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white border-teal-500 shadow-md shadow-teal-700/20'
                        : isPassed
                        ? 'bg-slate-900/90 text-teal-300 border-teal-500/30 hover:bg-slate-900'
                        : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isPassed
                          ? 'bg-teal-500/20 text-teal-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : st.number}
                    </div>
                    <div className="text-start truncate">
                      <span className="text-xs font-black block truncate">{st.title}</span>
                      <span className="text-[10px] text-slate-400/90 hidden md:block">{st.subtitle}</span>
                    </div>
                  </button>

                  {idx < steps.length - 1 && (
                    <ChevronLeft className="w-4 h-4 text-slate-700 shrink-0 hidden sm:block" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. STEP CONTENT BODY                                                      */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs space-y-5">
          {/* ----------------------------------------------------------------------- */}
          {/* STEP 1: الاستقبال والتاريخ والمزاج (Accueil & Baseline Comparison)        */}
          {/* ----------------------------------------------------------------------- */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150 max-w-5xl mx-auto">
              {/* Specialty Selector Banner */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                    <Stethoscope className="w-4 h-4 text-teal-400" />
                    <span>تحديد التخصص والمسار الإكلينيكي للجلسة:</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    اختر التخصص لمواءمة البروتوكولات والأدوات السريرية تلقائياً
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleSwitchSpecialty('orthophony')}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 space-x-reverse ${
                      specialty === 'orthophony'
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🗣️</span>
                    <span>أرطوفونيا وتخاطب</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchSpecialty('psychology')}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 space-x-reverse ${
                      specialty === 'psychology'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🧠</span>
                    <span>علم النفس العيادي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchSpecialty('psychomotricite')}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center space-x-1.5 space-x-reverse ${
                      specialty === 'psychomotricite'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🏃</span>
                    <span>نفسي-حركي</span>
                  </button>
                </div>
              </div>

              {/* 3 Clinical Cards: Cumulative Progress Comparison + Previous Session + Mood */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card A: Cumulative Baseline Comparison (المقارنة التطورية التراكمية) */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white text-xs">التطور السريري التراكمي</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {pastSessionsList.length} جلسات سابقة
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">أهداف PEI المحققة:</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        {clinicalGoals.filter((g) => g.status === 'achieved').length} / {clinicalGoals.length} مكتسبة
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">معدل الالتزام والتجاوب:</span>
                      <span className="font-bold text-teal-300 text-xs">منتظم ومستمر 📈</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                      💡 يتيح هذا السجل مقارنة وضع المريض في جلسة اليوم مع أول جلسة تقييمية (Baseline).
                    </div>
                  </div>
                </div>

                {/* Card B: Previous Session Comprehensive Glance */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-2.5 gap-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <History className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white text-xs">سجل الجلسة السابقة</span>
                      {pastSessionsList.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/50">
                          {pastSessionsList.length} جلسات في الملف
                        </span>
                      )}
                    </div>

                    {pastSessionsList.length > 1 ? (
                      <select
                        value={selectedPastSessionId || ''}
                        onChange={(e) => handleSelectPastSession(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-purple-300 font-medium focus:outline-none focus:border-purple-500"
                        title="اختر الجلسة السابقة المراد استعراضها"
                      >
                        {pastSessionsList.map((s, idx) => (
                          <option key={s.id} value={s.id}>
                            {idx === 0 ? '⭐ الأخيرة: ' : `جلسة #${pastSessionsList.length - idx}: `}
                            {s.session_date ? new Date(s.session_date).toLocaleDateString('ar-DZ') : `جلسة #${s.id}`}
                          </option>
                        ))}
                      </select>
                    ) : pastSessionsList.length === 1 ? (
                      <span className="text-[10px] text-purple-300 font-mono bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/40">
                        {previousSession.date} • {previousSession.duration} د
                      </span>
                    ) : null}
                  </div>

                  {/* Mode Selector: Free Text / Full SOAP Breakdown */}
                  {previousSession.soap?.subjective && (
                    <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-medium">
                      <button
                        type="button"
                        onClick={() => setPreviousSessionViewMode('summary')}
                        className={`flex-1 py-1 px-2 rounded-lg transition ${
                          previousSessionViewMode === 'summary'
                            ? 'bg-purple-600 text-white font-bold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        الملاحظات المكتوبة 📝
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviousSessionViewMode('soap')}
                        className={`flex-1 py-1 px-2 rounded-lg transition ${
                          previousSessionViewMode === 'soap'
                            ? 'bg-purple-600 text-white font-bold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        تفصيل SOAP الكامل (S-O-A-P) 📑
                      </button>
                    </div>
                  )}

                  {/* Body: Either SOAP cards or Full Text Container */}
                  {previousSessionViewMode === 'soap' && previousSession.soap?.subjective ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {previousSession.soap.subjective && (
                        <div className="p-2.5 rounded-xl bg-teal-950/20 border border-teal-800/40 text-xs space-y-1">
                          <span className="font-bold text-teal-300 text-[11px] block">S • الشكوى وملاحظات البداية:</span>
                          <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">{previousSession.soap.subjective}</p>
                        </div>
                      )}
                      {previousSession.soap.objective && (
                        <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-800/40 text-xs space-y-1">
                          <span className="font-bold text-blue-300 text-[11px] block">O • الملاحظات المقاسة والنتائج:</span>
                          <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">{previousSession.soap.objective}</p>
                        </div>
                      )}
                      {previousSession.soap.assessment && (
                        <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs space-y-1">
                          <span className="font-bold text-purple-300 text-[11px] block">A • التحليل والتقييم السريري:</span>
                          <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">{previousSession.soap.assessment}</p>
                        </div>
                      )}
                      {previousSession.soap.plan && (
                        <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs space-y-1">
                          <span className="font-bold text-amber-300 text-[11px] block">P • الخطة القادمة والتكليفات:</span>
                          <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">{previousSession.soap.plan}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Summary Box with Full/Expandable View */
                    <div className="space-y-1.5">
                      <div
                        className={`text-slate-200 text-xs leading-relaxed bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 transition-all font-sans whitespace-pre-wrap ${
                          isPreviousSessionExpanded ? 'max-h-72 overflow-y-auto shadow-inner' : 'max-h-28 overflow-y-auto'
                        }`}
                      >
                        {previousSession.summary || 'لا توجد ملاحظات سابقة مسجلة.'}
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <button
                          type="button"
                          onClick={() => setIsPreviousSessionExpanded(!isPreviousSessionExpanded)}
                          className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition"
                        >
                          {isPreviousSessionExpanded ? 'طي الملخص 🔼' : 'عرض كامل الملاحظات 🔽'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowPastSessionsArchiveModal(true)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-lg transition"
                        >
                          <Eye className="w-3 h-3 text-purple-400" />
                          <span>فحص السجل كاملاً 🔍</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Clinical Tools & Payloads Detected in Previous Session (SUDS, CBT, Phonetic, Protocols, Scales) */}
                  {renderClinicalPayloadsStrip(previousSession.soap?.clinicalPayloads)}

                  {/* Targeted Exercises from previous session if any */}
                  {previousSession.exercises && previousSession.exercises.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">التمارين المطبقة سابقاً:</span>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {previousSession.exercises.map((ex, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/50 text-purple-300 border border-purple-800/40">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Homework / Plan Box */}
                  <div className="pt-0.5">
                    <span className="text-[10px] text-amber-400 font-bold block mb-1">الواجبات والتوصيات المنزلية:</span>
                    <div className="text-slate-300 text-[11px] bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 max-h-24 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                      {previousSession.homeworkAssigned || 'متابعة البرنامج السريري.'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={copyFromPreviousSession}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center justify-center space-x-1 space-x-reverse transition-all active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>📥 نسخ خطة هذه الجلسة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPastSessionsArchiveModal(true)}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 space-x-reverse transition-all active:scale-98"
                    >
                      <History className="w-3.5 h-3.5 text-purple-400" />
                      <span>📚 كل الجلسات ({pastSessionsList.length})</span>
                    </button>
                  </div>
                </div>

                {/* Card C: Initial Affect & Mood Check */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Smile className="w-4 h-4 text-teal-400" />
                      <span className="font-bold text-white text-xs">المسح الانفعالي والمزاج (Affect)</span>
                    </div>
                    <span className="text-[10px] text-slate-500">انطباع البداية</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">المزاج السائد اليوم:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'euthymic', label: 'مستقر ومتزن' },
                        { id: 'anxious', label: 'قلق ومتوتر' },
                        { id: 'irritable', label: 'متهيج وغاضب' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPsychAffect({ ...psychAffect, mood: m.id })}
                          className={`py-1.5 px-1 rounded-xl text-center font-bold text-[10px] border transition-all ${
                            psychAffect.mood === m.id
                              ? 'bg-teal-600 text-white border-teal-500'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">التحالف العلاجي (Alliance):</span>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { id: 'cooperative', label: 'تعاون ممتاز 🌟' },
                        { id: 'guarded', label: 'متحفظ 🛡️' },
                        { id: 'resistant', label: 'مقاوم ⚡' },
                        { id: 'passive', label: 'سلبي 😶' },
                      ].map((al) => (
                        <button
                          key={al.id}
                          type="button"
                          onClick={() => setPsychAffect({ ...psychAffect, alliance: al.id })}
                          className={`py-1.5 px-1.5 rounded-xl text-center font-bold text-[10px] border transition-all ${
                            psychAffect.alliance === al.id
                              ? 'bg-purple-600 text-white border-purple-500'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {al.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card D: Digital Parent Home-Care Daily Log & Session Sync */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">
                      سجل الملاحظات المنزلية اليومية لولي الأمر (Parent Daily Log)
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {parentNotes.length} ملاحظة مسجلة
                  </span>
                </div>

                {parentNotes.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {parentNotes.slice(0, 4).map((note, idx) => (
                      <div 
                        key={note.id || idx}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                              {note.category === 'behavior' ? 'سلوك وانفعالات' : note.category === 'speech' ? 'تخاطب ولغة' : 'ملاحظة عامة'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {note.created_date || 'مؤخراً'}
                            </span>
                            {note.acknowledged_by_specialist && (
                              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                تمت المعاينة
                              </span>
                            )}
                          </div>
                          <p className="text-slate-200 text-xs leading-relaxed font-medium">
                            "{note.note}"
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!note.acknowledged_by_specialist && (
                            <button
                              type="button"
                              onClick={() => handleAcknowledgeParentNote(note.id)}
                              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all"
                              title="تأكيد معاينة الملاحظة"
                            >
                              ✓ اعتماد
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleInsertParentNoteIntoSoap(note)}
                            className="px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-all flex items-center gap-1"
                            title="دمج الملاحظة في خانة الملاحظات الذاتية SOAP"
                          >
                            <FileText className="w-3 h-3" />
                            <span>دمج في SOAP</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400">
                      لا توجد ملاحظات يومية مسجلة من ولي الأمر بعد لهذه الجلسة.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPortalLinkModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>مشاركة رابط البوابة التفاعلية مع الولي عبر WhatsApp</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Chief Complaint Input Box */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-white block">شكوى البداية المصرّح بها (الملاحظات الافتتاحية للمقابلة):</span>
                <textarea
                  rows={2}
                  value={soapNotes.subjective}
                  onChange={(e) => setSoapNotes({ ...soapNotes, subjective: e.target.value })}
                  placeholder="ما صرح به المريض أو الولي في بداية الجلسة حول التطورات في الأسبوع الماضي، الشكوى الحالية، أو الأحداث الطارئة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Step 1 Footer */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(2);
                    playBeep(750, 0.05);
                  }}
                  className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center space-x-2 space-x-reverse shadow-lg shadow-teal-600/30 transition-all"
                >
                  <span>الانتقال إلى قمرة التدخل والأدوات السريرية</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* STEP 2: قمرة التدخل والأدوات السريرية (Clinical Intervention & Tools)      */}
          {/* ----------------------------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150 max-w-5xl mx-auto">
              {/* Tool Navigation Pill Bar */}
              <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 overflow-x-auto w-full">
                  <button
                    type="button"
                    onClick={() => setShowEmdrModal(true)}
                    className="px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white shadow-md hover:scale-105 shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-200" />
                    <span>⚡ قمرة EMDR التفاعلية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInterventionTab('protocols')}
                    className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all ${
                      interventionTab === 'protocols'
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5 text-teal-300" />
                    <span>🔬 سجل التقنيات والبروتوكولات (CBT/SUDS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInterventionTab('scales')}
                    className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all ${
                      interventionTab === 'scales'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-purple-300" />
                    <span>📊 المقاييس المعيارية (+18 رائز)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInterventionTab('trials')}
                    className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all ${
                      interventionTab === 'trials'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5 text-blue-300" />
                    <span>🔢 راصد المحاولات ودقة النطق ({accuracyPercent}%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInterventionTab('metronome')}
                    className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all ${
                      interventionTab === 'metronome'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5 text-amber-300" />
                    <span>🎵 ميترونوم الطلاقة ({metronomeBpm} BPM)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInterventionTab('scratchpad')}
                    className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all ${
                      interventionTab === 'scratchpad'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-300" />
                    <span>📝 مسودة الرصد العفوي السريع</span>
                  </button>

                  <button
                    type="button"
                    data-testid="pecs-cards-activity-btn"
                    onClick={() => setShowPecsModal(true)}
                    className="px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white shadow-md hover:scale-105 shrink-0"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-200" />
                    <span>🎴 بطاقات PECS ومطابقة الصور</span>
                  </button>
                </div>
              </div>

              {/* SUB-TAB 1: CLINICAL PROTOCOLS MATRIX (SUDS + CBT + PHONETIC + TONUS) */}
              {interventionTab === 'protocols' && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Tool A: SUDS Scale (Subjective Units of Distress Scale) */}
                  <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                          <Activity className="w-4 h-4 text-teal-400" />
                          <span>مقياس شدة الضيق والتوتر اللحظي (SUDS Scale 0-100)</span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          قياس استجابة العميل للتوتر قبل التدخل العلاجي (Pre) وبعد تمرين الاسترخاء/التعريض (Post)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={insertSudsIntoSoap}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-1 space-x-reverse shadow-md transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>إدراج SUDS في تقرير SOAP</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pre-Intervention Slider */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300 font-bold">بداية الجلسة / قبل التدخل (Pre):</span>
                          <span className={`text-base font-mono font-black ${sudsPre > 70 ? 'text-rose-400' : sudsPre > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {sudsPre} / 100
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={sudsPre}
                          onChange={(e) => setSudsPre(Number(e.target.value))}
                          className="w-full accent-rose-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>0 (هدوء تام)</span>
                          <span>50 (توتر متوسط)</span>
                          <span>100 (ذعر أقصى)</span>
                        </div>
                      </div>

                      {/* Post-Intervention Slider */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300 font-bold">نهاية الجلسة / بعد التدخل (Post):</span>
                          <span className={`text-base font-mono font-black ${sudsPost < 40 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {sudsPost} / 100
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={sudsPost}
                          onChange={(e) => setSudsPost(Number(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span className="text-emerald-400 font-bold">
                            {sudsPre - sudsPost > 0 ? `✓ تحسن بمقدار -${sudsPre - sudsPost} نقطة` : 'لا تغير'}
                          </span>
                          <span>المستوى المحقق</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tool B: CBT Thought Record & Cognitive Distortions Tracker */}
                  <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                          <Brain className="w-4 h-4 text-purple-400" />
                          <span>سجل الأفكار التلقائية والتشوهات المعرفية (CBT Restructuring)</span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          رصد التشوه المعرفي وصياغة الفكرة البديلة المتزنة أثناء المحادثة العيادية
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={insertDistortionsIntoSoap}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1 space-x-reverse shadow-md transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>إدراج في تقرير SOAP</span>
                      </button>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1.5 font-bold">
                        التشوهات المعرفية الملاحظة في حوار اليوم:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {commonDistortionsList.map((dist) => {
                          const active = selectedDistortions.includes(dist.id);
                          return (
                            <button
                              key={dist.id}
                              type="button"
                              onClick={() => toggleDistortion(dist.id)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                                active
                                  ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {active ? '✓ ' : '+ '} {dist.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">الفكرة التلقائية السلبية (Pensée automatique):</span>
                        <input
                          type="text"
                          value={automaticThought}
                          onChange={(e) => setAutomaticThought(e.target.value)}
                          placeholder="مثال: سأفشل في العرض التقديمي والجميع سيسخر مني..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block mb-1">الفكرة البديلة العقلانية (Pensée alternative):</span>
                        <input
                          type="text"
                          value={rationalAlternative}
                          onChange={(e) => setRationalAlternative(e.target.value)}
                          placeholder="مثال: لقد تدربت جيداً، والشعور بالقلق طبيعي ولا يعني الفشل..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-teal-300 text-xs focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* MASTER CLINICAL THERAPY & PROTOCOLS COCKPIT */}
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-teal-500/30 space-y-4 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2.5 space-x-reverse">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-white">
                              قمرة البروتوكولات والتقنيات العلاجية المباشرة (Clinical Protocols Suite)
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                              10 بروتوكولات معيارية
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            أدوات علاجية تفاعلية مباشرة مع المريض مع حقن فوري للنتائج والمؤشرات في SOAP
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 3 Discipline Sections Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      
                      {/* Section 1: Psychology & CBT */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/20 space-y-2.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                          <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                            <span>🧠</span>
                            <span>علم النفس والـ CBT</span>
                          </span>
                          <span className="text-[10px] font-mono text-purple-400/80">5 أدوات</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setShowEmdrModal(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-500/40 text-slate-200 hover:text-teal-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-teal-400" />
                              <span>قمرة EMDR ومعالجة الصدمات</span>
                            </span>
                            <span className="text-[10px] text-teal-400 font-mono group-hover:translate-x-[-2px] transition-transform">BLS ⚡</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setShowCardiacModal(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/40 text-slate-200 hover:text-sky-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-sky-400" />
                              <span>الاتساق القلبي والتنفس 365</span>
                            </span>
                            <span className="text-[10px] text-sky-400 font-mono group-hover:translate-x-[-2px] transition-transform">HRV 🫁</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowExposureModal(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-amber-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                              <span>سلم التعريض ومنع الاستجابة ERP</span>
                            </span>
                            <span className="text-[10px] text-amber-400 font-mono group-hover:translate-x-[-2px] transition-transform">SUDS 🪜</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowActMatrixModal(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-slate-200 hover:text-indigo-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5 text-indigo-400" />
                              <span>مصفوفة القبول وفك الاندماج ACT</span>
                            </span>
                            <span className="text-[10px] text-indigo-400 font-mono group-hover:translate-x-[-2px] transition-transform">Values 🧭</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowImageryModal(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-200 hover:text-rose-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                              <span>إعادة صياغة الصور ومخططات الذات</span>
                            </span>
                            <span className="text-[10px] text-rose-400 font-mono group-hover:translate-x-[-2px] transition-transform">Schema 🎭</span>
                          </button>
                        </div>
                      </div>

                      {/* Section 2: Orthophony & Speech */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-teal-500/20 space-y-2.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                          <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                            <span>🗣️</span>
                            <span>الأرطوفونيا والتخاطب</span>
                          </span>
                          <span className="text-[10px] font-mono text-teal-400/80">4 أدوات</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setShowVoiceAcousticModal(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-500/40 text-slate-200 hover:text-teal-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <Mic className="w-3.5 h-3.5 text-teal-400" />
                              <span>التحليل الصوتي الحي والبايوفيدباك</span>
                            </span>
                            <span className="text-[10px] text-teal-400 font-mono group-hover:translate-x-[-2px] transition-transform">Pitch/MPT 🎙️</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowMelodicIntonationModal(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-slate-200 hover:text-indigo-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <Music className="w-3.5 h-3.5 text-indigo-400" />
                              <span>العلاج بالتنغيم الموسيقي MIT</span>
                            </span>
                            <span className="text-[10px] text-indigo-400 font-mono group-hover:translate-x-[-2px] transition-transform">Melodic 🎵</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowPacingBoardModal(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-emerald-400" />
                              <span>لوح التقطيع الإيقاعي وطلاقة الكلام</span>
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono group-hover:translate-x-[-2px] transition-transform">%SS 🎯</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsSpeechMatrixModalOpen(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-fuchsia-950/40 border border-slate-800 hover:border-fuchsia-500/40 text-slate-200 hover:text-fuchsia-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <Languages className="w-3.5 h-3.5 text-fuchsia-400" />
                              <span>مصفوفة فحص النطق والمخارج</span>
                            </span>
                            <span className="text-[10px] text-fuchsia-400 font-mono group-hover:translate-x-[-2px] transition-transform">Phonetic 👅</span>
                          </button>
                        </div>
                      </div>

                      {/* Section 3: Psychomotricity & Sensory */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/20 space-y-2.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                          <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                            <span>🏃</span>
                            <span>التأهيل النفس-حركي والحسي</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400/80">4 أدوات</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setShowPmrModal(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 text-slate-200 hover:text-indigo-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                              <span>استرخاء جاكوبسون (16 مجموعة)</span>
                            </span>
                            <span className="text-[10px] text-indigo-400 font-mono group-hover:translate-x-[-2px] transition-transform">PMR 🧘</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowSnoezelenModal(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-slate-200 hover:text-purple-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              <span>استوديو سنوزلين والحمية الحسية</span>
                            </span>
                            <span className="text-[10px] text-purple-400 font-mono group-hover:translate-x-[-2px] transition-transform">Diet 🌈</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowBilateralMidlineModal(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <MoveHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                              <span>مصفوفة خط الوسط والرسم المرآتي</span>
                            </span>
                            <span className="text-[10px] text-cyan-400 font-mono group-hover:translate-x-[-2px] transition-transform">Bilateral ⚖️</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsBodyMapModalOpen(true)}
                            className="w-full text-right p-2 rounded-xl bg-slate-900/90 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-200 transition-all flex items-center justify-between group"
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-emerald-400" />
                              <span>خريطة الجسد والفحص الحركي</span>
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono group-hover:translate-x-[-2px] transition-transform">Tonus 🏃‍♂️</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Tool D: Phonetic Matrix (for Orthophony) & Tonus (for Psychomotricity) */}
                  {specialty === 'orthophony' && (
                    <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Languages className="w-4 h-4 text-teal-400" />
                          <span className="font-black text-white text-sm">مصفوفة فحص النطق الصوتي (Phonetic Articulation Matrix)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsSpeechMatrixModalOpen(true)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-md shadow-fuchsia-600/30 transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-fuchsia-200" />
                            <span>👅 المصفوفة التفاعلية الشاملة</span>
                          </button>
                          <button
                            type="button"
                            onClick={insertPhoneticMatrixIntoSoap}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-1 space-x-reverse shadow-md"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>إدراج في SOAP</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1">الفونيم المستهدف:</span>
                          <select
                            value={phoneticTargetSound}
                            onChange={(e) => setPhoneticTargetSound(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs"
                          >
                            {['/ر/', '/س/', '/ش/', '/ك/', '/ل/', '/ج/', '/ص/', '/ط/', '/ق/'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1">موضع الصوت في الكلمة:</span>
                          <select
                            value={phoneticPosition}
                            onChange={(e) => setPhoneticPosition(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                          >
                            <option value="initial">بداية الكلمة (Initial)</option>
                            <option value="medial">وسط الكلمة (Médian)</option>
                            <option value="final">نهاية الكلمة (Final)</option>
                          </select>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1">نوع الاضطراب الصوتي:</span>
                          <select
                            value={phoneticError}
                            onChange={(e) => setPhoneticError(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-bold text-xs"
                          >
                            <option value="distortion">تشويه (Distorsion)</option>
                            <option value="omission">حذف (Omission)</option>
                            <option value="substitution">إبدال (Substitution)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {specialty === 'psychomotricite' && (
                    <div className="p-5 rounded-3xl bg-slate-900/60 border border-emerald-500/30 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <span className="font-black text-white text-sm">خريطة الجسد والفحص الحركي الحسي (Sensory & Tonus Body Map)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsBodyMapModalOpen(true)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-md shadow-emerald-600/30 transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                            <span>🏃‍♂️ خريطة الجسد وبطارية التوازن التفاعلية</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const summary = `🏃 فحص النغمة والتوازن السريري:\n- النغمة العضلية: ${tonusState}\n- التوازن العام: ${balanceState}`;
                              setSoapNotes((prev) => ({
                                ...prev,
                                objective: (prev.objective ? prev.objective + '\n\n' : '') + summary,
                              }));
                              playNotificationChime();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 space-x-reverse shadow-md"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>إدراج في SOAP</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1">النغمة العضلية العامة (Tonus Global):</span>
                          <select
                            value={tonusState}
                            onChange={(e) => setTonusState(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs"
                          >
                            <option value="eutonie">نغمة سوية متزنة (Eutonie)</option>
                            <option value="hypertonie">فرط توتر عضلي / تشنج (Hypertonie)</option>
                            <option value="hypotonie">رخاوة عضلية محورية (Hypotonie)</option>
                            <option value="paratonie">باراتونيا وصعوبة استرخاء (Paratonie)</option>
                          </select>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1">حالة التوازن والثبات (Équilibre):</span>
                          <select
                            value={balanceState}
                            onChange={(e) => setBalanceState(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                          >
                            <option value="stable">ثابت ومستقر (Stable)</option>
                            <option value="unsteady">ترنح وتمايل خفيف (Instable)</option>
                            <option value="clumsy">خرق حركي ملحوظ (Maladroit)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: 18 STANDARDIZED DIGITAL SCALES & DIRECT PASSATION */}
              {interventionTab === 'scales' && (
                <div className="p-6 rounded-3xl bg-slate-900/60 border border-purple-500/30 space-y-5 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
                    <div className="flex items-center space-x-2.5 space-x-reverse">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">
                          المقاييس والاختبارات النفسية واللغوية المعيارية (+18 رائز معتمد)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          مرر المقياس مباشرة مع المريض داخل نفس الجلسة، وسيقوم النظام بحساب السكور وإدراجه تلقائياً في SOAP
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSendTestModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center space-x-1.5 space-x-reverse"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>إرسال الرابط للمريض / وضع التابلت</span>
                    </button>
                  </div>

                  {/* Scale Selector Box */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="w-full sm:w-2/3 space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        اختر المقياس المعياري المطلوب تطبيقه في الجلسة:
                      </label>
                      <select
                        value={selectedScaleCode}
                        onChange={(e) => setSelectedScaleCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs focus:border-purple-500"
                      >
                        {CLINICAL_SCALES_OPTIONS.map((scale) => (
                          <option key={scale.code} value={scale.code}>
                            {scale.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-1/3 flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const testObj = CLINICAL_SCALES_OPTIONS.find((s) => s.code === selectedScaleCode) || {
                            code: selectedScaleCode,
                            title: selectedScaleCode,
                          };
                          setActivePassationTest(testObj);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-1.5 space-x-reverse"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>🚀 تمرير المقياس مباشرة في الجلسة</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-teal-400 font-bold block">ميزة التمرير المباشر:</span>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        تفتح استمارة الأسئلة الرقمية لبنود المقياس مع رصد إجابات المريض وحساب الدرجة اللحظية.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-purple-400 font-bold block">الدمج التلقائي في SOAP:</span>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        عند إنهاء المقياس، تُدرج الدرجة الخام والتفسير الإكلينيكي فوراً داخل خانة Objective.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-amber-400 font-bold block">إرسال الرابط أو التابلت:</span>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        يمكن أيضاً عرض رمز QR للمريض لملء المقياس بنفسه على هاتفه أو التابلت الخاص بالعيادة.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: TRIAL ACCURACY COUNTER */}
              {interventionTab === 'trials' && (
                <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                        <Calculator className="w-4 h-4 text-blue-400" />
                        <span>راصد المحاولات ودقة النطق والاستجابة السلوكية</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        اضغط على الأزرار مع كل محاولة لحساب نسبة الدقة الرياضية اللحظية تلقائياً
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">الهدف / الصوت:</span>
                      <input
                        type="text"
                        value={trialSound}
                        onChange={(e) => setTrialSound(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-xs"
                      />
                    </div>
                  </div>

                  {/* Big Live Metrics Dashboard */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold">نسبة الدقة اللحظية</span>
                      <div className="text-4xl font-mono font-black text-blue-400">{accuracyPercent}%</div>
                      <span className="text-[10px] text-slate-500">
                        {accuracyPercent >= 80 ? 'إتقان ممتاز 🌟' : accuracyPercent >= 60 ? 'تحسن ملحوظ 👍' : 'قيد التدريب ⏳'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/20 text-center space-y-1">
                      <span className="text-[10px] text-emerald-400 font-bold">استجابات صحيحة (نجاح)</span>
                      <div className="text-4xl font-mono font-black text-emerald-400">{correctTrials}</div>
                      <span className="text-[10px] text-slate-500">من إجمالي {totalTrials} محاولة</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/20 text-center space-y-1">
                      <span className="text-[10px] text-rose-400 font-bold">محاولات غير موفقة (صعوبة)</span>
                      <div className="text-4xl font-mono font-black text-rose-400">{incorrectTrials}</div>
                      <span className="text-[10px] text-slate-500">بحاجة لتوجيه وتكرار</span>
                    </div>
                  </div>

                  {/* Touch Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCorrectTrials((c) => c + 1);
                        playBeep(880, 0.05);
                      }}
                      className="flex-1 min-w-[180px] py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 space-x-reverse transition-all active:scale-95"
                    >
                      <span>+ استجابة صحيحة ✅</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIncorrectTrials((i) => i + 1);
                        playBeep(350, 0.08, 'sawtooth');
                      }}
                      className="flex-1 min-w-[180px] py-3.5 px-5 rounded-2xl bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 font-bold text-sm flex items-center justify-center space-x-2 space-x-reverse transition-all active:scale-95"
                    >
                      <span>+ محاولة غير موفقة ❌</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCorrectTrials(0);
                        setIncorrectTrials(0);
                      }}
                      className="p-3.5 rounded-2xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="تصفير العداد"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={insertTrialResultsIntoSoap}
                      className="py-3.5 px-5 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>إدراج في تقرير SOAP</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: FLUENCY METRONOME */}
              {interventionTab === 'metronome' && (
                <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6 animate-in fade-in">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                      <Music className="w-4 h-4 text-amber-400" />
                      <span>ميترونوم الطلاقة والتنفس الإيقاعي لعلاج التأتأة وضبط سرعة الكلام</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      إيقاع صوتي وبصري منظم لتدريب العميل على تقنية البدء السلس (Easy Onset) وضبط التنفس الحجابي
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-950 border border-amber-500/30 text-center space-y-4">
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-100 ${
                        metronomeBeat
                          ? 'bg-amber-400 text-slate-950 scale-125 shadow-xl shadow-amber-400/50'
                          : 'bg-slate-900 text-amber-400 border border-amber-500/30 scale-100'
                      }`}
                    >
                      <Music className="w-10 h-10" />
                    </div>

                    <div className="text-3xl font-mono font-black text-amber-300">{metronomeBpm} BPM</div>
                    <span className="text-xs text-slate-400">نبضة في الدقيقة (Beats Per Minute)</span>

                    {/* Controls Slider */}
                    <div className="w-full max-w-sm space-y-2">
                      <input
                        type="range"
                        min="40"
                        max="120"
                        step="5"
                        value={metronomeBpm}
                        onChange={(e) => setMetronomeBpm(Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>40 (بطيء جداً)</span>
                        <span>60 (إيقاع تنفسي)</span>
                        <span>120 (سريع)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsMetronomePlaying(!isMetronomePlaying)}
                        className={`px-6 py-3 rounded-2xl font-black text-xs flex items-center space-x-2 space-x-reverse transition-all shadow-lg ${
                          isMetronomePlaying
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                        }`}
                      >
                        {isMetronomePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isMetronomePlaying ? 'إيقاف الميترونوم' : 'تشغيل الميترونوم 🎵'}</span>
                      </button>

                      {[50, 60, 75].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setMetronomeBpm(preset)}
                          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono text-xs"
                        >
                          {preset} BPM
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: LIVE CLINICAL SCRATCHPAD */}
              {interventionTab === 'scratchpad' && (
                <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                        <Edit3 className="w-4 h-4 text-indigo-400" />
                        <span>مسودة الملاحظات العفوية السريعة (Live Clinical Scratchpad)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        دوّن هنا كلمات مفتاحية وسلوكيات عفوية تلاحظها أثناء الحديث دون تشتيت انتباه المريض
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => insertScratchpadIntoField('subjective')}
                        className="px-3 py-1.5 rounded-xl bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/30 text-xs font-bold"
                      >
                        + دمج في Subjective
                      </button>
                      <button
                        type="button"
                        onClick={() => insertScratchpadIntoField('objective')}
                        className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-xs font-bold"
                      >
                        + دمج في Objective
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={7}
                    value={scratchNotes}
                    onChange={(e) => setScratchNotes(e.target.value)}
                    placeholder="اكتب ملاحظاتك العفوية الحية هنا... (مثال: نبرة صوت متقطعة، فرك اليدين عند الحديث عن العمل، استخدام كلمة 'دائماً' بتكرار...)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                  />
                </div>
              )}

              {/* Step 2 Navigation Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    playBeep(700, 0.05);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق: الاستقبال والمزاج</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(3);
                    playBeep(750, 0.05);
                  }}
                  className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center space-x-2 space-x-reverse shadow-lg shadow-teal-600/30 transition-all"
                >
                  <span>الانتقال إلى التوثيق السريري SOAP</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* STEP 3: التوثيق السريري الذكي SOAP (SOAP Notes & AI Scribe)              */}
          {/* ----------------------------------------------------------------------- */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150 max-w-5xl mx-auto">
              {/* Voice Scribe Bar */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5 space-x-reverse">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                      isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-500/20 text-indigo-400'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-white text-xs block">
                      تفريغ صوتي ذكي للملاحظات السريرية (AI Voice Scribe):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isListening ? '🔴 جارٍ الاستماع وتدوين الملاحظات مباشرة...' : 'تكلم وسيقوم النظام بتفريغ الملاحظات في الحقل المحدد'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isListening ? 'إيقاف التسجيل' : 'إملاء سريع 🎙️'}</span>
                  </button>

                  <button
                    type="button"
                    id="ambient-scribe-btn"
                    data-testid="ambient-scribe-btn"
                    data-cy="ambient-scribe-btn"
                    onClick={() => setShowAmbientScribeModal(true)}
                    className="px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white shadow-md shadow-teal-600/30 transition-all active:scale-95"
                  >
                    <Brain className="w-3.5 h-3.5 text-teal-200" />
                    <span>🎙️ تفريغ صوتي ذكي للملاحظات السريرية (Ambient Scribe)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDsmModal(true)}
                    className="px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-600/30 transition-all active:scale-95"
                    title="تحليل الأعراض ومطابقة معايير DSM-5-TR و ICD-11"
                  >
                    <Brain className="w-3.5 h-3.5 text-purple-200" />
                    <span>🧠 تحليل DSM-5 Co-Pilot</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Fast Clinical SOAP Templates Carousel */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>نماذج سريرية سريعة بنقرة واحدة (Modèles SOAP Rapides):</span>
                  </span>
                  <span className="text-[10px] text-slate-500">اختر نموذجاً لتعبئة الحقول الأربعة فوراً</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {FAST_SOAP_TEMPLATES.filter((tpl) => tpl.specialty === specialty).map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/50 text-start space-y-1 group transition-all"
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

              {/* Targeted Clinical Exercises Chips */}
              <div className="space-y-2 p-4 rounded-3xl bg-slate-900/40 border border-slate-800">
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

              {/* PEI Goals Checklist Quick Drawer */}
              <div className="p-4 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-black text-white text-xs block">
                        أهداف الخطة العلاجية الفردية (PEI Goals -{' '}
                        {specialty === 'psychology'
                          ? 'علم النفس العيادي'
                          : specialty === 'psychomotricite'
                          ? 'التأهيل النفسي-حركي'
                          : 'الأرطوفونيا والتخاطب'}
                        ):
                      </span>
                      <span className="text-[10px] text-slate-400">
                        أهداف سريرية مخصصة بحسب تخصص الجلسة والمعايير المعتمدة
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAiSuggestPeiGoals}
                      disabled={loadingAiGoals}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 space-x-reverse shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loadingAiGoals ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                      <span>{loadingAiGoals ? 'جارٍ توليد الأهداف...' : '✨ اقتراح أهداف SMART ذكية'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={insertGoalsIntoSoapPlan}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 space-x-reverse shadow-md"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>إدراج في الخطة القادمة (Plan)</span>
                    </button>
                  </div>
                </div>

                {/* AI Red Alert Banner if detected */}
                {aiRedAlert && (
                  <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs flex items-center space-x-2 space-x-reverse">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span className="font-bold">{aiSafetyNotice || '🚨 تنبيه أمان سريري عاجل: تم رصد مؤشرات خطورة تستدعي تفعيل بروتوكول الأمان والتدخل الفوري.'}</span>
                  </div>
                )}

                {/* AI Suggested SMART Goals Drawer */}
                {showAiGoalsDrawer && aiSuggestedGoals.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-teal-500/40 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-teal-300 flex items-center space-x-1.5 space-x-reverse">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>أهداف SMART المقترحة بالذكاء السريري وفق الإرشادات المعتمدة:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAiGoalsDrawer(false)}
                        className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                      >
                        إغلاق المقترحات ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {aiSuggestedGoals.map((sg, idx) => (
                        <div
                          key={sg.id || idx}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 transition-all space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800/40">
                              {sg.type === 'short_term' ? '⏱️ قصير المدى (3-6 حصص)' : '🎯 متوسط المدى (10-15 حصة)'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">{sg.domain || 'مجال علاجي'}</span>
                          </div>
                          <p className="text-xs font-bold text-white leading-snug">{sg.text || sg.title}</p>
                          {sg.mastery_threshold && (
                            <p className="text-[10px] text-slate-400">معيار الإتقان: <span className="text-teal-300 font-bold">{sg.mastery_threshold}</span></p>
                          )}
                          <div className="pt-1 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleApplySuggestedGoal(sg)}
                              className="px-2.5 py-1 rounded-lg bg-teal-600/30 hover:bg-teal-600/60 text-teal-200 text-[10px] font-bold border border-teal-500/30 flex items-center space-x-1 space-x-reverse transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ إضافة للأهداف المعتمدة</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {clinicalGoals.map((g) => (
                    <div
                      key={g.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white truncate max-w-[240px]">{g.text}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setClinicalGoals(
                              clinicalGoals.map((x) => (x.id === g.id ? { ...x, status: 'achieved' } : x))
                            )
                          }
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
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
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
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
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
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

                {/* Inline Form to add a custom clinical goal */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const clean = newCustomGoalText.trim();
                    if (clean) {
                      setClinicalGoals((prev) => [
                        ...prev,
                        { id: Date.now(), text: clean, status: 'in_progress' },
                      ]);
                      setNewCustomGoalText('');
                    }
                  }}
                  className="flex gap-2 pt-2 border-t border-emerald-500/20"
                >
                  <input
                    type="text"
                    value={newCustomGoalText}
                    onChange={(e) => setNewCustomGoalText(e.target.value)}
                    placeholder="إضافة هدف سريري مخصص لهذا المريض في خطة (PEI)..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center space-x-1 space-x-reverse"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة هدف</span>
                  </button>
                </form>
              </div>

              {/* 4 MODERN SOAP CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* S: Subjective */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-teal-300 flex items-center space-x-1.5 space-x-reverse">
                      <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-[10px] font-mono font-black">
                        S
                      </span>
                      <span>الشكوى وملاحظات البداية (Subjective):</span>
                    </label>
                    <span className="text-[10px] text-slate-500">شكوى المريض / الولي</span>
                  </div>
                  <textarea
                    rows={4}
                    value={soapNotes.subjective}
                    onChange={(e) => setSoapNotes({ ...soapNotes, subjective: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                    placeholder="الشكوى الحالية المصرّح بها، المزاج العام، أو ملاحظات الأسبوع..."
                  />
                </div>

                {/* O: Objective */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-blue-300 flex items-center space-x-1.5 space-x-reverse">
                      <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-mono font-black">
                        O
                      </span>
                      <span>الملاحظات السريرية المقاسة (Objective):</span>
                    </label>
                    <span className="text-[10px] text-slate-500">القياسات ودرجات المقاييس وSUDS</span>
                  </div>
                  <textarea
                    rows={4}
                    value={soapNotes.objective}
                    onChange={(e) => setSoapNotes({ ...soapNotes, objective: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                    placeholder="نتائج فحص أعضاء النطق، دقة المحاولات المقاسة، درجات المقاييس المطبقة، ومؤشر SUDS..."
                  />
                </div>

                {/* A: Assessment */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-purple-300 flex items-center space-x-1.5 space-x-reverse">
                      <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-mono font-black">
                        A
                      </span>
                      <span>التقييم والتحليل السريري (Assessment):</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDsmModal(true)}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/60 flex items-center gap-1 transition"
                        title="فتح المساعد التشخيصي والمعياري ومطابقة DSM-5-TR & ICD-11"
                      >
                        <Brain className="w-3 h-3 text-purple-400" />
                        <span>🧠 تحليل DDSS</span>
                      </button>
                      <span className="text-[10px] text-slate-500">التشخيص ومعدل التطور</span>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={soapNotes.assessment}
                    onChange={(e) => setSoapNotes({ ...soapNotes, assessment: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed"
                    placeholder="التحليل السريري لمدى الاستجابة، المقارنة بالتقييم السابق، درجة الاستبصار وآليات الدفاع..."
                  />
                </div>

                {/* P: Plan */}
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-amber-300 flex items-center space-x-1.5 space-x-reverse">
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-mono font-black">
                        P
                      </span>
                      <span>الخطة القادمة والتوصيات والإحالات (Plan):</span>
                    </label>
                    <span className="text-[10px] text-slate-500">الأهداف والواجبات والإحالات</span>
                  </div>
                  <textarea
                    rows={4}
                    value={soapNotes.plan}
                    onChange={(e) => setSoapNotes({ ...soapNotes, plan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                    placeholder="أهداف الجلسة القادمة، التكليفات المنزلية، التوجيهات الطبية والإحالات..."
                  />
                </div>
              </div>

              {/* Step 3 Navigation Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(2);
                    playBeep(700, 0.05);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق: التدخل السريري</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(4);
                    playBeep(750, 0.05);
                  }}
                  className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center space-x-2 space-x-reverse shadow-lg shadow-teal-600/30 transition-all"
                >
                  <span>الانتقال إلى الإنهاء والإحالات والفوترة</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* STEP 4: الإنهاء والإحالات والواجبات والفوترة (Closure & Referrals)         */}
          {/* ----------------------------------------------------------------------- */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150 max-w-5xl mx-auto">
              {/* Session Overview Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                  <Clock className="w-5 h-5 text-amber-400 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block">المدة المسجلة</span>
                  <div className="text-xl font-mono font-black text-amber-300">
                    {Math.max(1, Math.round(secondsElapsed / 60))} دقيقة
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                  <Activity className="w-5 h-5 text-teal-400 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block">التمارين المنجزة</span>
                  <div className="text-xl font-mono font-black text-teal-300">
                    {selectedExercises.length} تمارين
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                  <Calculator className="w-5 h-5 text-blue-400 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block">دقة المحاولات</span>
                  <div className="text-xl font-mono font-black text-blue-400">
                    {totalTrials > 0 ? `${accuracyPercent}%` : 'غير مطبق'}
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                  <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto" />
                  <span className="text-[10px] text-slate-400 font-bold block">تراجع الضيق (SUDS)</span>
                  <div className="text-xl font-mono font-black text-emerald-300">
                    {sudsPre - sudsPost > 0 ? `-${sudsPre - sudsPost} pts` : 'مستقر'}
                  </div>
                </div>
              </div>

              {/* Tool: Smart Individualized Treatment Plan (PEI) & Exercise Bank */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 space-x-reverse">
                    <Target className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-black text-white">
                        مشروع التكفل العلاجي الفردي الذكي (Smart PEI / IEP Suite):
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        صياغة أهداف SMART مقسمة زمنياً مع ربط مباشر ببنك الكراسات والتمارين A4 وطباعتها للأسرة
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSmartPeiModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center space-x-1.5 space-x-reverse shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>فتح قمرة PEI والتمارين A4 📋</span>
                  </button>
                </div>
              </div>

              {/* Tool: Medical Letters & Official Certificates Generator */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 space-x-reverse">
                    <FileText className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="text-xs font-black text-white">
                        إصدار الشهادات والوثائق والتقارير الطبية الرسمية (Certificats & Attestations):
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        إصدار شهادات التوقف عن العمل، رخص المرافقة، شهادات الحضور، ومذكرات PAI مع الحفظ الفوري المعتمد في ملف المريض
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMedicalLettersModal(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs flex items-center space-x-1.5 space-x-reverse shadow-md shadow-amber-600/30 transition-all active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>📜 إصدار شهادة / وثيقة رسمية</span>
                  </button>
                </div>
              </div>

              {/* Tool: Fast Home Practice & Parent Engagement WhatsApp Dispatcher */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 space-x-reverse">
                    <HeartPulse className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-black text-white">
                        التكليفات والتمارين المنزلية وتفاعل الأولياء (Parent Practice & Tele-Care):
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        تكليف تمرين علاجي منزلي للأهل، تحديد المدة، وإرسال رسالة WhatsApp جاهزة مع رابط البوابة المباشر
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFastHomeCareModal(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center space-x-1.5 space-x-reverse shadow-md shadow-emerald-600/30 transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>🏡 تكليف تمرين منزلي (WhatsApp)</span>
                  </button>
                </div>
              </div>

              {/* Tool: Medical Referrals & Prescriptions Generator */}
              <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2.5 space-x-reverse">
                    <ClipboardList className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="text-xs font-black text-white">
                        الإحالات والتوجيهات الطبية المتخصصة (Medical Referrals):
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        توجيه المريض لفحوصات مكملة أو استشارة أطباء مختصين مع إدراج التوصية في الخطة العلاجية
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={insertReferralIntoSoapPlan}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إدراج الإحالة في خطة SOAP (Plan)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">نوع الفحص / التخصص المطلوب:</span>
                    <select
                      value={referralType}
                      onChange={(e) => setReferralType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xs"
                    >
                      <option value="pedopsych">طبيب أمراض عقلية أطفال ومراهقين (Pédopsychiatre)</option>
                      <option value="adult_psych">طبيب أمراض عقلية راشدين (Psychiatre d'Adultes)</option>
                      <option value="neuro">استشارة طبيب أعصاب (Neurologue)</option>
                      <option value="eeg">تخطيط كهربية الدماغ (EEG)</option>
                      <option value="orl">فحص أنف وأذن وحنجرة (ORL)</option>
                      <option value="audio">فحص قياس السمع (Audiométrie)</option>
                      <option value="ped">استشارة طبيب أطفال عام (Pédiatre)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-[11px] text-slate-400 block mb-1">ملاحظات وسبب الإحالة:</span>
                    <input
                      type="text"
                      value={referralNotes}
                      onChange={(e) => setReferralNotes(e.target.value)}
                      placeholder="مثال: يوصى بإجراء فحص سمعي لنفي أي نقص سمعي توصيلي مصاحب للتأخر اللغوي..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Engagement & Compliance Rating */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white text-xs block">تقييم تفاعل واستجابة المريض في الجلسة:</span>
                  <span className="text-[10px] text-slate-400">درجة الامتثال والتحالف العلاجي</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEngagementScore(star)}
                      className="p-1 text-amber-400 transition-transform hover:scale-125"
                    >
                      <Star className={`w-5 h-5 ${star <= engagementScore ? 'fill-current' : 'text-slate-700'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-300 mr-2">
                    {engagementScore === 5 && 'ممتاز وتفاعل عالي 🌟'}
                    {engagementScore === 4 && 'جيد جداً ومتعاون 👍'}
                    {engagementScore === 3 && 'متوسط 😐'}
                    {engagementScore === 2 && 'مقاوم ومشتت ⚡'}
                    {engagementScore === 1 && 'صعوبة شديدة ⚠️'}
                  </span>
                </div>
              </div>

              {/* Next Session Blueprint & Family Home Protocol Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2.5 space-x-reverse">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">
                        خطة الجلسة القادمة والتكفل المنزلي بالذكاء الاصطناعي (Next Session Blueprint & Home Care):
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        تحليل مخرجات جلسة اليوم وصياغة خطة العمل القادمة وبروتوكول إرشادي موجه للأسرة
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAiSuggestNextSession}
                    disabled={loadingNextSessionAi}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-lg shadow-indigo-600/25 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loadingNextSessionAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5 text-teal-200" />}
                    <span>{loadingNextSessionAi ? 'جاري التحليل وتوليد الخطة...' : '✨ صياغة خطة الجلسة القادمة والواجب المنزلي'}</span>
                  </button>
                </div>

                {aiNextSessionFeedback && (
                  <div className="p-3 rounded-xl bg-teal-950/50 border border-teal-500/40 text-teal-200 text-xs font-bold">
                    {aiNextSessionFeedback}
                  </div>
                )}

                {aiNextSessionBlueprint && (
                  <div className="space-y-4 animate-in fade-in">
                    {aiNextSessionBlueprint.red_alert && (
                      <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs font-bold flex items-center space-x-2 space-x-reverse">
                        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span>🚨 تنبيه أمان سريري عاجل: تم تفعيل خطة مواجهة الأزمات (Safety Protocol) وتوجيه الأسرة للمرافقة المستمرة.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Blueprint Next Session Focus */}
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                        <span className="text-xs font-black text-indigo-300 flex items-center space-x-1.5 space-x-reverse">
                          <Target className="w-3.5 h-3.5 text-indigo-400" />
                          <span>محاور وتركيز الجلسة القادمة (Next Session Focus):</span>
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {aiNextSessionBlueprint.next_session_focus}
                        </p>
                        {aiNextSessionBlueprint.target_metrics && (
                          <div className="pt-1 text-[11px] text-slate-400">
                            مؤشر النجاح المستهدف: <span className="text-indigo-300 font-bold">{aiNextSessionBlueprint.target_metrics}</span>
                          </div>
                        )}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleApplyNextSessionToSoapPlan}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            <span>إدراج في تقرير SOAP (حقل Plan) 📥</span>
                          </button>
                        </div>
                      </div>

                      {/* Home Protocol for Parents */}
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                        <span className="text-xs font-black text-emerald-300 flex items-center space-x-1.5 space-x-reverse">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>بروتوكول التكفل والتوجيه المنزلي الموجه للأسرة:</span>
                        </span>
                        <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                          {aiNextSessionBlueprint.home_protocol}
                        </p>
                        <div className="pt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(aiNextSessionBlueprint.home_protocol);
                              setAiNextSessionFeedback('تم نسخ البروتوكول المنزلي إلى الحافظة للإرسال عبر WhatsApp بنجاح 📋');
                              setTimeout(() => setAiNextSessionFeedback(null), 4000);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-colors"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>نسخ التوجيه المنزلي للأولياء 📋</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* WhatsApp Homework Dispatcher Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5 space-x-reverse">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">إرسال الواجبات والتوصيات المنزلية عبر WhatsApp:</h4>
                      <p className="text-[10px] text-slate-400">
                        رسالة تشجيعية وتوجيهية جاهزة بنقرة واحدة تتضمن التمارين المنجزة والتكليفات
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={sendingWaHomework}
                      onClick={() => handleSendWhatsAppHomework(false)}
                      className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center space-x-2 space-x-reverse shadow-lg transition-all ${
                        waHomeworkSentSuccess
                          ? 'bg-emerald-700 text-emerald-100 shadow-emerald-700/25'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                      }`}
                    >
                      {sendingWaHomework ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{sendingWaHomework ? 'جارٍ الإرسال...' : (waHomeworkSentSuccess ? '✓ تم الإرسال للعميل' : 'إرسال فوري للعميل (WhatsApp Cloud)')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppHomework(true)}
                      title="فتح تطبيق واتساب يدوياً"
                      className="px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1 transition border border-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>يدوي</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-sans space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-500 text-[10px] font-bold">معاينة الرسالة:</span>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">📲 المستلم:</span>
                      <input
                        type="tel"
                        value={customWaPhone}
                        onChange={(e) => setCustomWaPhone(e.target.value)}
                        placeholder="0555..."
                        className="w-28 bg-transparent text-teal-300 font-mono text-[11px] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    السلام عليكم ورحمة الله وبركاته، تحية طيبة من العيادة... نحيطكم علماً بأن جلسة اليوم لـ{' '}
                    <strong className="text-teal-300">{patient?.first_name || 'العميل'}</strong> سارت بشكل إيجابي ومثمر 🌟
                    <br />
                    • <strong>الأنشطة والتدخلات المنجزة:</strong> {selectedExercises.slice(0, 3).join('، ') || 'تمارين تأهيلية'}
                    <br />
                    • <strong>التوجيهات والواجبات المنزلية:</strong> {soapNotes.plan || 'متابعة البرنامج السريري المنزلي'}
                  </div>
                </div>
              </div>

              {/* Parent Companion Portal & Magic Link Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950/25 to-slate-950 border border-teal-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-teal-950/20">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center space-x-2 space-x-reverse">
                      <span>بوابة الولي والتمارين المنزلية التفاعلية (Parent Companion Hub)</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">Magic Link + صوت</span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      مشاركة رابط المتابعة المنزلية المباشر، تأكيد المواعيد، وتسجيل استجابات الطفل الصوتية
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={sendingPortalWa}
                    onClick={() => handleDirectSendPortalLink(false)}
                    className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center space-x-2 space-x-reverse shadow-lg transition-all ${
                      portalWaSentSuccess
                        ? 'bg-teal-700 text-teal-100 shadow-teal-700/25'
                        : 'bg-teal-600 hover:bg-teal-500 text-slate-950 shadow-teal-500/25'
                    }`}
                  >
                    {sendingPortalWa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>
                      {sendingPortalWa
                        ? 'جارٍ الإرسال...'
                        : portalWaSentSuccess
                        ? '✓ تم إرسال الرابط للولي'
                        : 'إرسال رابط البوابة فوري (Cloud API) ⚡'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPortalLinkModal(true)}
                    className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs flex items-center space-x-1.5 space-x-reverse border border-slate-700 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>توليد ومعاينة / QR</span>
                  </button>
                </div>
              </div>

              {/* Instant Billing & Receipt Box */}
              <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center space-x-2.5 space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateReceipt}
                    onChange={(e) => setGenerateReceipt(e.target.checked)}
                    className="rounded-lg bg-slate-950 border-slate-700 text-teal-500 focus:ring-0 w-4 h-4"
                  />
                  <span className="text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse">
                    <Receipt className="w-4 h-4 text-teal-400" />
                    <span>إصدار وصل قبض / فاتورة للجلسة الحالية (Reçu de Paiement)</span>
                  </span>
                </label>

                {generateReceipt && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">المبلغ المستحق:</span>
                    <input
                      type="number"
                      step="500"
                      value={sessionFee}
                      onChange={(e) => setSessionFee(Number(e.target.value))}
                      className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-teal-300 font-mono font-bold"
                    />
                    <span className="text-xs text-slate-400 font-bold">دج (DZD)</span>
                  </div>
                )}
              </div>

              {/* Executive Clinical Bilan & Official Report Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/25 to-slate-950 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-indigo-950/20">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center space-x-2 space-x-reverse">
                      <span>محرك الحصائل والتقارير الطبية الرسمية (Clinical Bilan & PDF Engine)</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">A4 PDF + الختم</span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      توليد وتوثيق الحصيلة الشاملة متضمنة المقاييس الرقمية الـ 18 وأهداف PEI وملاحظات SOAP
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMasterBilanModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-black text-xs flex items-center space-x-2 space-x-reverse shadow-lg shadow-teal-500/20 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>📄 فتح محرر الحصيلة وتوليد PDF (Bilan)</span>
                </button>
              </div>

              {/* Bottom Complete & Save Session Box */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(3);
                    playBeep(700, 0.05);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة لملاحظات SOAP</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                  >
                    إلغاء والعودة
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleCompleteSession}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm shadow-xl shadow-teal-600/30 flex items-center space-x-2 space-x-reverse transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <span>جارٍ التوثيق والحفظ في الملف السريري...</span>
                    ) : saveSuccess ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                        <span>تم حفظ وتوثيق الجلسة بنجاح ✓</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>إنهاء وتوثيق الجلسة وحفظ التقرير السريري ✅</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 4. DIRECT IN-SESSION TEST PASSATION MODAL                                 */}
        {/* ========================================================================= */}
        {activePassationTest && (
          <InteractiveTestPassationModal
            test={activePassationTest}
            initialPatientId={patient?.id}
            patients={patient ? [patient] : []}
            onClose={() => setActivePassationTest(null)}
            onSaved={handleTestPassed}
          />
        )}

        {/* ========================================================================= */}
        {/* 5. SEND REMOTE / TABLET TEST ASSIGNMENT MODAL                             */}
        {/* ========================================================================= */}
        {showSendTestModal && (
          <SendTestAssignmentModal
            test={
              CLINICAL_SCALES_OPTIONS.find((s) => s.code === selectedScaleCode) || {
                code: selectedScaleCode,
                title: selectedScaleCode,
              }
            }
            initialPatientId={patient?.id}
            appointmentId={appointmentId}
            patients={patient ? [patient] : []}
            onClose={() => setShowSendTestModal(false)}
            onSuccess={() => {
              setShowSendTestModal(false);
              alert('تم إرسال الرابط وتوليد رمز الاستجابة بنجاح!');
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 6. MASTER CLINICAL BILAN BUILDER MODAL                                     */}
        {/* ========================================================================= */}
        {showMasterBilanModal && patient && (
          <MasterBilanBuilderModal
            isOpen={showMasterBilanModal}
            onClose={() => setShowMasterBilanModal(false)}
            patient={patient}
            initialSoapNotes={soapNotes}
            initialPeiGoals={clinicalGoals}
            initialSpecialty={specialty}
            onBilanCreated={() => {
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 7. PARENT COMPANION PORTAL LINK MODAL                                    */}
        {/* ========================================================================= */}
        {showPortalLinkModal && patient && (
          <GeneratePortalLinkModal
            isOpen={showPortalLinkModal}
            onClose={() => setShowPortalLinkModal(false)}
            patient={patient}
          />
        )}

        {/* ========================================================================= */}
        {/* 8. INTERACTIVE SPEECH & ARTICULATION MATRIX MODAL                         */}
        {/* ========================================================================= */}
        {isSpeechMatrixModalOpen && patient && (
          <SpeechArticulationMatrixModal
            isOpen={isSpeechMatrixModalOpen}
            onClose={() => setIsSpeechMatrixModalOpen(false)}
            patient={patient}
            appointmentId={appointmentId}
            onInjectSoap={(soapText) => {
              setSoapNotes((prev) => ({
                ...prev,
                objective: (prev.objective ? prev.objective + '\n\n' : '') + soapText,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 9. INTERACTIVE PSYCHOMOTOR & SENSORY BODY MAP MODAL                       */}
        {/* ========================================================================= */}
        {isBodyMapModalOpen && patient && (
          <PsychomotorBodyMapModal
            isOpen={isBodyMapModalOpen}
            onClose={() => setIsBodyMapModalOpen(false)}
            patient={patient}
            appointmentId={appointmentId}
            onInjectSoap={(soapData) => {
              if (typeof soapData === 'string') {
                setSoapNotes((prev) => ({
                  ...prev,
                  objective: (prev.objective ? prev.objective + '\n\n' : '') + soapData,
                }));
              } else if (soapData && typeof soapData === 'object') {
                setSoapNotes((prev) => ({
                  ...prev,
                  objective: soapData.objective
                    ? (prev.objective ? prev.objective + '\n\n' : '') + soapData.objective
                    : prev.objective,
                  assessment: soapData.assessment
                    ? (prev.assessment ? prev.assessment + '\n\n' : '') + soapData.assessment
                    : prev.assessment,
                  plan: soapData.plan
                    ? (prev.plan ? prev.plan + '\n\n' : '') + soapData.plan
                    : prev.plan,
                }));
              }
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 10. TELETHERAPY & INTERACTIVE CLINICAL CANVAS COCKPIT                     */}
        {/* ========================================================================= */}
        {isTeletherapyModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
            <TeletherapyRoomView
              initialPatient={patient}
              initialRoomCode={'ROOM-' + (appointmentId || 'LIVE-' + Math.random().toString(36).substring(2, 6).toUpperCase())}
              onClose={() => setIsTeletherapyModalOpen(false)}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 11. AMBIENT CLINICAL AI SCRIBE MODAL                                      */}
        {/* ========================================================================= */}
        {showAmbientScribeModal && (
          <AmbientClinicalScribeModal
            isOpen={showAmbientScribeModal}
            onClose={() => setShowAmbientScribeModal(false)}
            patient={patient}
            appointment={appointmentId ? { id: appointmentId } : null}
            onInjectIntoSoap={handleInjectAmbientSoap}
          />
        )}

        {/* ========================================================================= */}
        {/* 12. DSM-5-TR & ICD-11 DIAGNOSTIC DECISION SUPPORT SYSTEM (DDSS)           */}
        {/* ========================================================================= */}
        {showDsmModal && patient && (
          <DsmDiagnosticAssistantModal
            isOpen={showDsmModal}
            onClose={() => setShowDsmModal(false)}
            patient={patient}
            sessionId={null}
            appointmentId={appointmentId}
            initialSpecialty={specialty}
            initialSoapText={(soapNotes.subjective || '') + ' ' + (soapNotes.objective || '')}
            onInjectSoap={(injectedText) => {
              setSoapNotes((prev) => ({
                ...prev,
                assessment: (prev.assessment ? prev.assessment + '\n\n' : '') + injectedText,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* MODAL: ALL PAST SESSIONS COMPREHENSIVE TIMELINE & CLINICAL ARCHIVE        */}
        {/* ========================================================================= */}
        {showPastSessionsArchiveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto" dir="rtl">
            <div className="relative w-full max-w-4xl my-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">الأرشيف السريري الكامل لجلسات المريض</h3>
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                        {pastSessionsList.length} جلسات مسجلة
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      المريض: <span className="text-slate-200 font-medium">{patient?.first_name} {patient?.last_name}</span>
                      {patientAge !== null && ` (${patientAge} سنة)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={pastSessionSearchQuery}
                      onChange={(e) => setPastSessionSearchQuery(e.target.value)}
                      placeholder="بحث في الملاحظات والتمارين..."
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-48 sm:w-60"
                    />
                    {pastSessionSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setPastSessionSearchQuery('')}
                        className="absolute left-2.5 top-2 text-xs text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPastSessionsArchiveModal(false)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body: Timeline of sessions */}
              <div className="p-6 overflow-y-auto space-y-4">
                {pastSessionsList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <History className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
                    <p className="text-sm font-semibold text-slate-300">لا توجد جلسات سابقة مسجلة لهذا المريض بعد.</p>
                    <p className="text-xs text-slate-500">هذه هي أول جلسة علاجية (Baseline) يتم افتتاحها في ملف المريض.</p>
                  </div>
                ) : (
                  pastSessionsList
                    .filter((s) => {
                      if (!pastSessionSearchQuery) return true;
                      const q = pastSessionSearchQuery.toLowerCase();
                      const notes = (s.progress_notes || s.notes || '').toLowerCase();
                      const ex = Array.isArray(s.exercises_targeted) ? s.exercises_targeted.join(' ').toLowerCase() : '';
                      return notes.includes(q) || ex.includes(q);
                    })
                    .map((s, idx) => {
                      const parsed = parseSessionData(s);
                      const isLatest = idx === 0;

                      return (
                        <div
                          key={s.id || idx}
                          className={`p-5 rounded-2xl border transition-all ${
                            isLatest
                              ? 'bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border-purple-500/40 shadow-lg'
                              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/70 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 font-mono font-black text-xs flex items-center justify-center border border-purple-500/30">
                                #{pastSessionsList.length - idx}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-white">
                                    جلسة {parsed.date}
                                  </h4>
                                  {isLatest && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                                      ⭐ الجلسة الأخيرة المنجزة
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
                                  <span>المدة: <strong className="text-slate-200">{parsed.duration} دقيقة</strong></span>
                                  <span>•</span>
                                  <span>التخصص: <strong className="text-purple-300">{parsed.specialty}</strong></span>
                                  {parsed.specialistName && (
                                    <>
                                      <span>•</span>
                                      <span>المعالج: <strong className="text-slate-300">{parsed.specialistName}</strong></span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                handleSelectPastSession(s.id);
                                copyFromPreviousSession();
                                setShowPastSessionsArchiveModal(false);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 font-bold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>📥 نسخ خطة هذه الحصة لليوم</span>
                            </button>
                          </div>

                          {/* Targeted Exercises */}
                          {parsed.exercises && parsed.exercises.length > 0 && (
                            <div className="pt-3 pb-1">
                              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">التمارين والأنشطة المطبقة:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {parsed.exercises.map((ex, i) => (
                                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 text-purple-300 border border-purple-900/50 font-medium">
                                    {ex}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* SOAP Breakdown if structured, else pre-wrap text */}
                          <div className="pt-3 space-y-2">
                            {/* Clinical Payloads & Tools Detected */}
                            {renderClinicalPayloadsStrip(parsed.soap?.clinicalPayloads)}

                            {parsed.soap?.subjective ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                <div className="p-3 rounded-xl bg-teal-950/20 border border-teal-800/40 space-y-1">
                                  <span className="font-bold text-teal-300 text-[11px] flex items-center gap-1">
                                    <span className="w-4 h-4 rounded bg-teal-500/20 text-teal-300 flex items-center justify-center text-[9px] font-mono">S</span>
                                    <span>الشكوى والملاحظات الذاتية:</span>
                                  </span>
                                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{parsed.soap.subjective}</p>
                                </div>

                                <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/40 space-y-1">
                                  <span className="font-bold text-blue-300 text-[11px] flex items-center gap-1">
                                    <span className="w-4 h-4 rounded bg-blue-500/20 text-blue-300 flex items-center justify-center text-[9px] font-mono">O</span>
                                    <span>الملاحظات المقاسة والنتائج:</span>
                                  </span>
                                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{parsed.soap.objective}</p>
                                </div>

                                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-1">
                                  <span className="font-bold text-purple-300 text-[11px] flex items-center gap-1">
                                    <span className="w-4 h-4 rounded bg-purple-500/20 text-purple-300 flex items-center justify-center text-[9px] font-mono">A</span>
                                    <span>التقييم والتحليل السريري:</span>
                                  </span>
                                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{parsed.soap.assessment}</p>
                                </div>

                                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1">
                                  <span className="font-bold text-amber-300 text-[11px] flex items-center gap-1">
                                    <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center text-[9px] font-mono">P</span>
                                    <span>الخطة القادمة والتكليفات:</span>
                                  </span>
                                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{parsed.soap.plan}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                                {parsed.summary}
                              </div>
                            )}

                            {/* Homework Box */}
                            {parsed.homeworkAssigned && (
                              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/20 text-xs space-y-1">
                                <span className="text-[11px] font-bold text-amber-400">الواجبات والتوصيات المنزلية المحددة في هذه الجلسة:</span>
                                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{parsed.homeworkAssigned}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/95 sticky bottom-0">
                <span className="text-xs text-slate-400">
                  💡 يمكنك نسخ تمارين وخطة أي جلسة سابقة إلى جلسة اليوم فوراً عبر زر "نسخ الخطة".
                </span>
                <button
                  type="button"
                  onClick={() => setShowPastSessionsArchiveModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
                >
                  إغلاق الأرشيف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 13. SMART INDIVIDUALIZED REHABILITATION PLAN (PEI) & EXERCISES BANK       */}
        {/* ========================================================================= */}
        {showSmartPeiModal && patient && (
          <SmartPeiBuilderModal
            isOpen={showSmartPeiModal}
            onClose={() => setShowSmartPeiModal(false)}
            patient={patient}
            specialty={specialty}
            onPlanSaved={() => {
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 14. EMDR & BILATERAL STIMULATION (BLS) TRAUMA THERAPY STUDIO MODAL        */}
        {/* ========================================================================= */}
        {showEmdrModal && (
          <EmdrTraumaStudioModal
            isOpen={showEmdrModal}
            onClose={() => setShowEmdrModal(false)}
            patient={patient}
            patients={patient ? [patient] : []}
            onInjectSoap={(soapData) => {
              if (typeof soapData === 'string') {
                setSoapNotes((prev) => ({
                  ...prev,
                  objective: (prev.objective ? prev.objective + '\n\n' : '') + soapData,
                }));
              } else if (soapData && typeof soapData === 'object') {
                setSoapNotes((prev) => ({
                  ...prev,
                  objective: soapData.objective
                    ? (prev.objective ? prev.objective + '\n\n' : '') + soapData.objective
                    : prev.objective,
                  assessment: soapData.assessment
                    ? (prev.assessment ? prev.assessment + '\n\n' : '') + soapData.assessment
                    : prev.assessment,
                  plan: soapData.plan
                    ? (prev.plan ? prev.plan + '\n\n' : '') + soapData.plan
                    : prev.plan,
                }));
                if (soapData.sudsPost !== undefined && soapData.sudsPost !== null) {
                  setSudsPost(Number(soapData.sudsPost));
                }
              }
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 15. CARDIAC COHERENCE 365 & HRV BIOFEEDBACK MODAL                         */}
        {/* ========================================================================= */}
        {showCardiacModal && (
          <CardiacCoherenceStudioModal
            isOpen={showCardiacModal}
            onClose={() => setShowCardiacModal(false)}
            patientName={patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'المريض'}
            onInjectSoap={(soapText) => {
              setSoapNotes((prev) => ({
                ...prev,
                objective: (prev.objective ? prev.objective + '\n\n' : '') + soapText,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 16. GRADED EXPOSURE HIERARCHY & ERP EXTINCTION CURVE MODAL                */}
        {/* ========================================================================= */}
        {showExposureModal && (
          <ExposureHierarchyStudioModal
            isOpen={showExposureModal}
            onClose={() => setShowExposureModal(false)}
            patientName={patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'المريض'}
            onInjectSoap={(soapText) => {
              setSoapNotes((prev) => ({
                ...prev,
                objective: (prev.objective ? prev.objective + '\n\n' : '') + soapText,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 17. ACT MATRIX & COGNITIVE DEFUSION VALUES COMPASS MODAL                  */}
        {/* ========================================================================= */}
        {showActMatrixModal && (
          <ActMatrixStudioModal
            isOpen={showActMatrixModal}
            onClose={() => setShowActMatrixModal(false)}
            patientName={patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'المريض'}
            onInjectSoap={(soapText) => {
              setSoapNotes((prev) => ({
                ...prev,
                assessment: (prev.assessment ? prev.assessment + '\n\n' : '') + soapText,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 18. IMAGERY RESCRIPTING & SCHEMA MODES STUDIO MODAL                       */}
        {/* ========================================================================= */}
        {showImageryModal && (
          <ImageryRescriptingStudioModal
            isOpen={showImageryModal}
            onClose={() => setShowImageryModal(false)}
            patientName={patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'المريض'}
            onInjectSoap={(soapText) => {
              setSoapNotes((prev) => ({
                ...prev,
                plan: (prev.plan ? prev.plan + '\n\n' : '') + soapText,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 19. REAL-TIME ACOUSTIC SPECTRUM & VOICE BIOFEEDBACK MODAL                 */}
        {/* ========================================================================= */}
        {showVoiceAcousticModal && (
          <VoiceAcousticStudioModal
            isOpen={showVoiceAcousticModal}
            onClose={() => setShowVoiceAcousticModal(false)}
            patientName={patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'المريض'}
            onInjectSoap={(soapText) => {
              setSoapNotes((prev) => ({
                ...prev,
                objective: (prev.objective ? prev.objective + '\n\n' : '') + soapText,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 20. MELODIC INTONATION THERAPY (MIT) FOR APHASIA MODAL                    */}
        {/* ========================================================================= */}
        {showMelodicIntonationModal && (
          <MelodicIntonationStudioModal
            isOpen={showMelodicIntonationModal}
            onClose={() => setShowMelodicIntonationModal(false)}
            patientName={patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'المريض'}
            onInjectSoap={(soapText) => {
              setSoapNotes((prev) => ({
                ...prev,
                objective: (prev.objective ? prev.objective + '\n\n' : '') + soapText,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 21. PACING BOARD & SYLLABLE FLUENCY STUTTERING TRACKER MODAL              */}
        {/* ========================================================================= */}
        {showPacingBoardModal && (
          <PacingBoardStudioModal
            isOpen={showPacingBoardModal}
            onClose={() => setShowPacingBoardModal(false)}
            patientName={patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'المريض'}
            onInjectSoap={(soapText) => {
              setSoapNotes((prev) => ({
                ...prev,
                objective: (prev.objective ? prev.objective + '\n\n' : '') + soapText,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 22. JACOBSON PROGRESSIVE MUSCLE RELAXATION (PMR) MODAL                    */}
        {/* ========================================================================= */}
        {showPmrModal && (
          <PmrRelaxationStudioModal
            isOpen={showPmrModal}
            onClose={() => setShowPmrModal(false)}
            patientName={patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'المريض'}
            onInjectSoap={(soapText) => {
              setSoapNotes((prev) => ({
                ...prev,
                objective: (prev.objective ? prev.objective + '\n\n' : '') + soapText,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 23. SNOEZELEN MULTI-SENSORY & SENSORY DIET STUDIO MODAL                   */}
        {/* ========================================================================= */}
        {showSnoezelenModal && (
          <SnoezelenCalmStudioModal
            isOpen={showSnoezelenModal}
            onClose={() => setShowSnoezelenModal(false)}
            patientName={patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'المريض'}
            onInjectSoap={(soapText) => {
              setSoapNotes((prev) => ({
                ...prev,
                plan: (prev.plan ? prev.plan + '\n\n' : '') + soapText,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 24. BILATERAL INTEGRATION & MIDLINE CROSSING MATRIX MODAL                 */}
        {/* ========================================================================= */}
        {showBilateralMidlineModal && (
          <BilateralMidlineStudioModal
            isOpen={showBilateralMidlineModal}
            onClose={() => setShowBilateralMidlineModal(false)}
            patientName={patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'المريض'}
            onInjectSoap={(soapText) => {
              setSoapNotes((prev) => ({
                ...prev,
                objective: (prev.objective ? prev.objective + '\n\n' : '') + soapText,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 25. PECS & MATCHING CLINICAL ACTIVITY MODAL                               */}
        {/* ========================================================================= */}
        {showPecsModal && (
          <PecsAndMatchingActivityModal
            isOpen={showPecsModal}
            onClose={() => setShowPecsModal(false)}
            patientName={patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'المريض'}
            onInjectIntoSoap={({ field, text }) => {
              setSoapNotes((prev) => ({
                ...prev,
                [field]: (prev[field] ? prev[field] + '\n\n' : '') + text,
              }));
              playNotificationChime();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 26. MEDICAL LETTERS & OFFICIAL CERTIFICATES MODAL                         */}
        {/* ========================================================================= */}
        {showMedicalLettersModal && (
          <MedicalLettersBuilder
            patient={patient}
            tenant={patient?.tenant || null}
            practitioner={null}
            isModal={true}
            onClose={() => setShowMedicalLettersModal(false)}
          />
        )}

        {/* ========================================================================= */}
        {/* 27. FAST HOME CARE ASSIGNMENT MODAL (PARENT ENGAGEMENT & TELE-CARE)       */}
        {/* ========================================================================= */}
        {showFastHomeCareModal && (
          <FastHomeCareAssignModal
            isOpen={showFastHomeCareModal}
            onClose={() => setShowFastHomeCareModal(false)}
            patient={patient}
            onAssigned={(res) => {
              playNotificationChime();
            }}
          />
        )}
      </div>
    </div>
  );
}
