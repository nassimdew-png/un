import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Save,
  Printer,
  X,
  User,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  Activity,
  Sliders,
  FileText,
  Copy,
  Check,
  Zap,
  Info,
  Layers,
  BarChart2,
  PieChart,
  Smartphone,
  Tablet,
  Search
} from 'lucide-react';
import { assessmentApi, patientApi } from '../../api';
import SearchablePatientSelect, { 
  getPatientDisplayName, 
  getPatientDisplayAge,
  DEFAULT_DEMO_PATIENT,
  DEFAULT_DEMO_PATIENT_2
} from '../common/SearchablePatientSelect';
import SendTestAssignmentModal from './SendTestAssignmentModal';
import { getTestQuestionsDefinition } from './PsychologicalQuestionsData';
import Mmpi2ScorerModal from './scorers/Mmpi2ScorerModal';
import WiscWaisScorerModal from './scorers/WiscWaisScorerModal';
import StroopTestInteractiveModal from './scorers/StroopTestInteractiveModal';
import ReyFigureScorerModal from './scorers/ReyFigureScorerModal';
import ZarekiScorerModal from './scorers/ZarekiScorerModal';
import ProjectiveTestsScorerModal from './scorers/ProjectiveTestsScorerModal';

// =========================================================================
// PRESET CLINICAL BATTERIES & ITEM DESCRIPTORS
// =========================================================================

const CARS2_ITEMS = [
  { id: 1, title_ar: '1. العلاقات مع الناس', title_fr: 'Relations avec les personnes', desc: 'ملاحظة التفاعل مع الفاحص، طلب المساعدة، وتجنب أو قبول التواصل البشري.' },
  { id: 2, title_ar: '2. التقليد (اللفظي والحركي)', title_fr: 'Imitation', desc: 'القدرة على محاكاة الأصوات، الإيماءات، وحركات اليدين والأشياء.' },
  { id: 3, title_ar: '3. الاستجابة الانفعالية والعاطفية', title_fr: 'Réponses émotionnelles', desc: 'مدى ملاءمة التعبير العاطفي للموقف (ضحك أو بكاء بدون سبب، تبلد انفعالي).' },
  { id: 4, title_ar: '4. استخدام الجسد والحركات النمطية', title_fr: 'Utilisation du corps', desc: 'رصد الحركات التكرارية، الرفرفة بالأيدي، الاهتزاز، أو المشي على أطراف الأصابع.' },
  { id: 5, title_ar: '5. استخدام الأشياء واللعب الرمزي', title_fr: 'Utilisation des objets', desc: 'اللعب بالألعاب بشكل وظيفي مناسب مقابل التدوير، الترتيب بالصفوف، والتعلق بأشياء غير عادية.' },
  { id: 6, title_ar: '6. التكيف مع التغيير والروتين', title_fr: 'Adaptation aux changements', desc: 'رد الفعل عند تغيير المسار، تبديل الأنشطة، أو الانتقال بين الغرف.' },
  { id: 7, title_ar: '7. الاستجابة البصرية والتواصل بالعين', title_fr: 'Réponses visuelles', desc: 'تحديق غير عادي، تجنب النظر في العينين، أو التدقيق في الأضواء والمرايا.' },
  { id: 8, title_ar: '8. الاستجابة السمعية للأصوات', title_fr: 'Réponses auditives', desc: 'تجاهل النداء بالاسم كأنه أصم، مقابل فرط الحساسية وتغطية الأذنين لأصوات عادية.' },
  { id: 9, title_ar: '9. استجابات التذوق، الشم واللمس', title_fr: 'Goût, odorat et toucher', desc: 'شم أو لعق الأشياء غير القابلة للأكل، أو الانزعاج الشديد من ملامس معينة للملابس.' },
  { id: 10, title_ar: '10. الخوف والقلق غير المبرر', title_fr: 'Peur et anxiété', desc: 'خوف شديد من أشياء غير مخيفة، أو غياب تام للخوف من الأخطار الحقيقية كالنار والسيارات.' },
  { id: 11, title_ar: '11. التواصل اللفظي والكلام', title_fr: 'Communication verbale', desc: 'غياب الكلام، الصدى اللفظي (Echolalia)، النبرة الرتيبة، أو تكرار عبارات غير سياقية.' },
  { id: 12, title_ar: '12. التواصل غير اللفظي والإشارات', title_fr: 'Communication non-verbale', desc: 'استخدام الإشارة بالسبابة، الإيماء بالرأس، واستخدام يد الفاحص كأداة لتحقيق الرغبات.' },
  { id: 13, title_ar: '13. مستوى النشاط الحركي والتململ', title_fr: 'Niveau d\'activité', desc: 'فرط نشاط حركي شديد وصعوبة الاستقرار، أو خمول وبطء مفرط.' },
  { id: 14, title_ar: '14. مستوى وثبات الأداء الفكري', title_fr: 'Fonctionnement intellectuel', desc: 'تفاوت غير متجانس في القدرات (مثلاً ذاكرة بصرية خارقة مع عجز لغوي حاد).' },
  { id: 15, title_ar: '15. الانطباعات السريرية العامة', title_fr: 'Impressions générales', desc: 'التقدير الكلي الشامل لدرجة سمات التوحد من واقع المعايشة طوال المقابلة.' },
];

const MCHAT_ITEMS = [
  { id: 1, text: 'إذا أشرت إلى شيء ما عبر الغرفة، هل ينظر طفلك إليه؟', critical: false },
  { id: 2, text: 'هل تساءلت يوماً عما إذا كان طفلك أصماً أو يعاني ضعف السمع؟', critical: true },
  { id: 3, text: 'هل يلعب طفلك ألعاب التظاهر والتمثيل (مثل التظاهر بالشرب من كوب فارغ أو إطعام دمية)؟', critical: false },
  { id: 4, text: 'هل يحب طفلك التسلق على الأشياء (مثل الدرج أو الأثاث)؟', critical: false },
  { id: 5, text: 'هل يقوم طفلك بحركات أصابع غير عادية بالقرب من عينيه؟', critical: true },
  { id: 6, text: 'هل يشير طفلك بإصبعه ليطلب شيئاً أو للحصول على مساعدة؟', critical: false },
  { id: 7, text: 'هل يشير طفلك بإصبعه ليلفت انتباهك إلى شيء مثير للاهتمام؟', critical: true },
  { id: 8, text: 'هل يهتم طفلك بالأطفال الآخرين ويحاول التفاعل معهم؟', critical: false },
  { id: 9, text: 'هل يُريك طفلك أشياءً بحملها إليك أو إظهارها لك لمجرد مشاركتها معك؟', critical: true },
  { id: 10, text: 'هل يستجيب طفلك عند مناداته باسمه بالنظر إليك أو التبسم؟', critical: true },
  { id: 11, text: 'عندما تبتسم لطفلك، هل يبتسم لك في المقابل؟', critical: false },
  { id: 12, text: 'هل ينزعج طفلك بشدة من الضوضاء اليومية المعتادة (مثل المكنسة الكهربائية)؟', critical: false },
  { id: 13, text: 'هل يستطيع طفلك المشي بشكل مستقل؟', critical: false },
  { id: 14, text: 'هل ينظر طفلك في عينيك مباشرة عندما تتحدث معه أو تلعب معه؟', critical: true },
  { id: 15, text: 'هل يحاول طفلك تقليد ما تفعله (مثل التلويح بيده للوداع أو التصفيق)؟', critical: false },
  { id: 16, text: 'إذا أدرت رأسك لتنظر إلى شيء ما، فهل يلتفت طفلك ليرى ما تنظر إليه؟', critical: false },
  { id: 17, text: 'هل يحاول طفلك لفت انتباهك ليجعلك تنظر إليه (مثلاً يقول "انظر إلي")؟', critical: false },
  { id: 18, text: 'هل يفهم طفلك عندما تطلب منه القيام بأمر بسيط بدون إيماءات؟', critical: false },
  { id: 19, text: 'إذا حدث شيء جديد، هل ينظر طفلك إلى وجهك ليرى رد فعلك؟', critical: false },
  { id: 20, text: 'هل يحب طفلك الأنشطة الحركية التفاعلية (مثل التأرجح على ركبتيك)؟', critical: false },
];

const BDIII_ITEMS = [
  { id: 1, title: '1. الحزن والمزاج الاكتئابي', options: ['0: لا أشعر بالحزن.', '1: أشعر بالحزن معظم الوقت.', '2: أنا حزين طوال الوقت ولا أستطيع الخروج من ذلك.', '3: أنا حزين وبائس لدرجة لا يمكنني تحملها.'] },
  { id: 2, title: '2. التشاؤم واليأس من المستقبل', options: ['0: لست متشائماً بشأن مستقبلي.', '1: أشعر بالإحباط حيال مستقبلي أكثر من المعتاد.', '2: لا أتوقع أن تسير الأمور على ما يرام بالنسبة لي.', '3: أشعر أن مستقبلي ميؤوس منه وسوف يزداد سوءاً.'] },
  { id: 3, title: '3. الإحساس بالفشل', options: ['0: لا أشعر بأنني فاشل.', '1: لقد فشلت أكثر مما ينبغي.', '2: عندما أنظر إلى الوراء أرى الكثير من الإخفاقات.', '3: أشعر أنني فاشل تماماً كشخص.'] },
  { id: 4, title: '4. فقدان المتعة (Anhedonia)', options: ['0: أستمتع بالأشياء كما اعتدت دائماً.', '1: لا أستمتع بالأشياء كما كنت أستمتع بها سابقاً.', '2: أحصل على القليل جداً من المتعة من الأشياء التي كانت تسعدني.', '3: لا يمكنني الحصول على أي متعة على الإطلاق.'] },
  { id: 5, title: '5. مشاعر الذنب', options: ['0: لا أشعر بالذنب بشكل خاص.', '1: أشعر بالذنب حيال العديد من الأشياء التي فعلتها.', '2: أشعر بالذنب الشديد معظم الوقت.', '3: أشعر بالذنب باستمرار.'] },
  { id: 6, title: '6. الشعور بالعقاب', options: ['0: لا أشعر بأنني أتعرض للعقاب.', '1: أشعر أنني ربما أتعرض للعقاب.', '2: أتوقع أن أعاقب.', '3: أشعر بأنني أتعرض للعقاب بالفعل.'] },
  { id: 7, title: '7. عدم الرضا عن النفس ولوم الذات', options: ['0: أشعر بنفس الشعور تجاه نفسي كالمعتاد.', '1: لقد فقدت الثقة في نفسي.', '2: أشعر بخيبة أمل في نفسي.', '3: أكره نفسي تماماً.'] },
  { id: 8, title: '8. الانتقاد الذاتي والتأنيب', options: ['0: لا أنتقد نفسي أو ألوم نفسي أكثر من المعتاد.', '1: أنتقد نفسي أكثر من ذي قبل على أخطائي.', '2: ألوم نفسي طوال الوقت على عيوبي.', '3: ألوم نفسي على كل شيء سيء يحدث.'] },
  { id: 9, title: '9. الأفكار أو الرغبات الانتحارية ⚠️', critical: true, options: ['0: ليس لدي أي أفكار لقتل نفسي.', '1: لدي أفكار لقتل نفسي لكنني لن أنفذها.', '2: أرغب في قتل نفسي.', '3: سأقتل نفسي إذا سنحت لي الفرصة.'] },
  { id: 10, title: '10. البكاء ونوبات الحزن', options: ['0: لا أبكي أكثر من المعتاد.', '1: أبكي الآن أكثر مما اعتدت عليه.', '2: أبكي على كل شيء صغير.', '3: أشعر بالرغبة في البكاء ولكن لا أستطيع إخراج الدموع.'] },
];

const CONNERS_ITEMS = [
  { id: 1, dim: 'Inattention', text: 'صعوبة في الحفاظ على الانتباه في الواجبات المدرسية أو أثناء اللعب.' },
  { id: 2, dim: 'Hyperactivity', text: 'يتململ بيديه أو قدميه أو يتلوى في مقعده بشكل مستمر.' },
  { id: 3, dim: 'Inattention', text: 'يتجنب أو يكره المهام التي تتطلب مجهوداً ذهنياً متواصلاً.' },
  { id: 4, dim: 'Hyperactivity', text: 'يغادر مقعده في الفصل في مواقف يُتوقع منه فيها البقاء جالساً.' },
  { id: 5, dim: 'Impulsivity', text: 'يتسرع بالإجابات قبل اكتمال طرح الأسئلة.' },
  { id: 6, dim: 'Inattention', text: 'يفقد الأشياء الضرورية للمهام والأنشطة (أقلام، دفاتر، كتب).' },
  { id: 7, dim: 'Hyperactivity', text: 'يركض أو يتسلق في أماكن ومواقف غير ملائمة.' },
  { id: 8, dim: 'Impulsivity', text: 'يجد صعوبة بالغة في انتظار دوره في الطابور أو الألعاب الجماعية.' },
  { id: 9, dim: 'Executive', text: 'يجد صعوبة في تنظيم مهامه اليومية والتخطيط المسبق للوقت.' },
  { id: 10, dim: 'Social', text: 'يواجه خلافات متكررة مع الأقران والزملاء في المدرسة.' },
];

// =========================================================================
// SVG RADAR / SPIDER CHART COMPONENT
// =========================================================================

function ClinicalRadarChart({ data, maxVal = 4, size = 280 }) {
  if (!data || data.length < 3) return null;

  const center = size / 2;
  const radius = center - 40;
  const total = data.length;
  const angleSlice = (Math.PI * 2) / total;

  // Compute polygon points
  const points = data.map((d, i) => {
    const val = Math.min(d.value, maxVal);
    const r = (val / maxVal) * radius;
    const x = center + r * Math.sin(i * angleSlice);
    const y = center - r * Math.cos(i * angleSlice);
    return `${x},${y}`;
  }).join(' ');

  // Levels rings
  const levels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background web rings */}
        {levels.map((lvl, idx) => (
          <circle
            key={idx}
            cx={center}
            cy={center}
            r={radius * lvl}
            fill="none"
            stroke="rgba(99, 102, 241, 0.15)"
            strokeDasharray={idx < 3 ? '3 3' : undefined}
          />
        ))}

        {/* Axes rays */}
        {data.map((_, i) => {
          const x = center + radius * Math.sin(i * angleSlice);
          const y = center - radius * Math.cos(i * angleSlice);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(99, 102, 241, 0.2)"
            />
          );
        })}

        {/* Data polygon filled */}
        <polygon
          points={points}
          fill="rgba(99, 102, 241, 0.35)"
          stroke="#818cf8"
          strokeWidth="2.5"
          className="transition-all duration-300 drop-shadow-md"
        />

        {/* Value nodes */}
        {data.map((d, i) => {
          const val = Math.min(d.value, maxVal);
          const r = (val / maxVal) * radius;
          const x = center + r * Math.sin(i * angleSlice);
          const y = center - r * Math.cos(i * angleSlice);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#c084fc"
              stroke="#fff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels */}
        {data.map((d, i) => {
          const labelRadius = radius + 22;
          const x = center + labelRadius * Math.sin(i * angleSlice);
          const y = center - labelRadius * Math.cos(i * angleSlice);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[9px] font-bold fill-slate-300 select-none"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
      <div className="text-[10px] text-indigo-300 font-mono mt-2 font-bold">
        مخطط الرادار السريري لتوزيع درجات الأبعاد (Clinical Radar)
      </div>
    </div>
  );
}

// =========================================================================
// MAIN INTERACTIVE PASSATION MODAL COMPONENT
// =========================================================================

export default function InteractiveTestPassationModal({
  test,
  patients = [],
  patientId = null,
  initialPatientId = null,
  tenant = null,
  onClose,
  onSaved
}) {
  const [fetchedPatients, setFetchedPatients] = useState([]);

  useEffect(() => {
    if (!patients || patients.length === 0) {
      patientApi.list({ per_page: 100 })
        .then(res => {
          const list = res.patients?.data || res.patients || res.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setFetchedPatients(list);
          }
        })
        .catch(err => console.warn('Could not auto-fetch patients in InteractiveTestPassationModal:', err));
    }
  }, []);

  const effectivePatients = useMemo(() => {
    if (patients && patients.length > 0) return patients;
    if (fetchedPatients.length > 0) return fetchedPatients;
    return [DEFAULT_DEMO_PATIENT, DEFAULT_DEMO_PATIENT_2];
  }, [patients, fetchedPatients]);

  const targetInitialId = initialPatientId || patientId;
  const [selectedPatientId, setSelectedPatientId] = useState(
    targetInitialId || effectivePatients[0]?.id || DEFAULT_DEMO_PATIENT.id
  );

  useEffect(() => {
    if (targetInitialId) {
      setSelectedPatientId(targetInitialId);
    } else if (!selectedPatientId && effectivePatients.length > 0) {
      setSelectedPatientId(effectivePatients[0].id);
    }
  }, [targetInitialId, effectivePatients, selectedPatientId]);

  const [showPatientPicker, setShowPatientPicker] = useState(false);

  const selectedPatient = useMemo(() => {
    return effectivePatients.find(p => String(p.id) === String(selectedPatientId)) || effectivePatients[0] || null;
  }, [effectivePatients, selectedPatientId]);
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('sheet'); // 'sheet' | 'radar' | 'ai_summary'
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [copiedAi, setCopiedAi] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Test Code normalized
  const testCode = (test?.code || test?.test_code || 'TEST').toUpperCase();

  // 1. CARS-2 State: dictionary { itemId: score } (scores 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0)
  const [carsScores, setCarsScores] = useState(() => {
    const init = {};
    CARS2_ITEMS.forEach(it => { init[it.id] = 1.0; });
    return init;
  });

  // 2. M-CHAT State: dictionary { itemId: bool (true = at risk) }
  const [mchatScores, setMchatScores] = useState(() => {
    const init = {};
    MCHAT_ITEMS.forEach(it => { init[it.id] = false; });
    return init;
  });

  // 3. BDI-II State: dictionary { itemId: 0..3 }
  const [bdiScores, setBdiScores] = useState(() => {
    const init = {};
    BDIII_ITEMS.forEach(it => { init[it.id] = 0; });
    return init;
  });

  // 4. CONNERS State: dictionary { itemId: 0..3 }
  const [connersScores, setConnersScores] = useState(() => {
    const init = {};
    CONNERS_ITEMS.forEach(it => { init[it.id] = 0; });
    return init;
  });

  // 5. Dynamic Standardized Preset Questionnaires (PHQ-9, GAD-7, HAM-A, PCL-5, Y-BOCS, SNAP-IV)
  const testDef = useMemo(() => {
    return getTestQuestionsDefinition({
      code: testCode,
      title_ar: test?.title_ar || test?.name_ar || test?.title || '',
      dimensions: test?.dimensions,
      norms_payload: test?.norms_payload || test?.normsPayload,
      questions: test?.questions
    });
  }, [testCode, test]);

  const isPresetQuestionnaire = useMemo(() => {
    if (testCode.includes('CARS') || testCode.includes('M-CHAT') || testCode.includes('CONNERS') || testCode.includes('BDI')) {
      return false;
    }
    return (
      testCode.includes('PHQ') || testCode.includes('GAD') || testCode.includes('HAM') ||
      testCode.includes('PCL') || testCode.includes('YBOCS') || testCode.includes('Y-BOCS') ||
      testCode.includes('SNAP') || testCode.includes('DASS') || testCode.includes('SPIN') ||
      testCode.includes('PDSS') || testCode.includes('ISI') || testCode.includes('ASRS') ||
      testCode.includes('AQ') || testCode.includes('PSS') || testCode.includes('RSES') ||
      Boolean(testDef?.items && testDef.items.length > 0)
    );
  }, [testCode, testDef]);

  const [questionnaireAnswers, setQuestionnaireAnswers] = useState(() => {
    const init = {};
    return init;
  });

  const questionnaireTotal = useMemo(() => {
    return Object.values(questionnaireAnswers).reduce((acc, v) => acc + (Number(v) || 0), 0);
  }, [questionnaireAnswers]);

  const questionnaireSeverity = useMemo(() => {
    if (testDef?.calculateSeverity) {
      return testDef.calculateSeverity(questionnaireTotal, questionnaireAnswers);
    }
    return { label: `الدرجة: ${questionnaireTotal}`, color: 'indigo', advice: '' };
  }, [testDef, questionnaireTotal, questionnaireAnswers]);

  const isRedAlertTriggered = useMemo(() => {
    if (testCode.includes('PHQ') && questionnaireAnswers[9] > 0) return true;
    if (testCode.includes('BDI') && bdiScores[9] > 0) return true;
    if (testCode.includes('HAM-D') && questionnaireAnswers[3] > 0) return true;
    return false;
  }, [testCode, questionnaireAnswers, bdiScores]);

  // 6. Generic Battery State for any other test: dictionary { dimensionName: score }
  const genericDimensions = useMemo(() => {
    if (test?.dimensions && Array.isArray(test.dimensions) && test.dimensions.length > 0) {
      return test.dimensions;
    }
    return ['الأداء المعرفي العام', 'السرعة والدقة', 'التكيف السلوكي', 'الاستجابة الانفعالية'];
  }, [test]);

  const [genericScores, setGenericScores] = useState(() => {
    const init = {};
    genericDimensions.forEach(dim => { init[dim] = 50; });
    return init;
  });

  // Selected Patient Object
  const currentPatient = useMemo(() => {
    return patients.find(p => String(p.id) === String(selectedPatientId)) || patients[0];
  }, [patients, selectedPatientId]);

  // =========================================================================
  // SCORING COMPUTATIONS & RADAR DATA
  // =========================================================================

  // CARS-2 Calculation
  const carsTotal = useMemo(() => {
    return Object.values(carsScores).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
  }, [carsScores]);

  const carsInterpretation = useMemo(() => {
    if (carsTotal < 30) {
      return { label: 'سليم / خارج طيف التوحد (Non-Autistic)', color: 'emerald', advice: 'الأداء السلوكي والانفعالي ضمن الحدود الطبيعية المقارنة للأقران.' };
    } else if (carsTotal <= 36.5) {
      return { label: 'طيف توحد خفيف إلى متوسط (Mild-Moderate ASD)', color: 'orange', advice: 'توصية: إعداد برنامج تدخل سلوكي نمائي مبكر (PECS / TEACCH) وتأهيل لغوي حسي.' };
    } else {
      return { label: 'طيف توحد شديد وحاد (Severe ASD)', color: 'red', advice: 'توصية: رعاية فردية مكثفة، تعديل السلوك ABA، وتكييف البيئة الحسية والتواصلية.' };
    }
  }, [carsTotal]);

  const carsRadarData = useMemo(() => {
    return CARS2_ITEMS.map(it => ({
      label: it.title_ar.split(' ')[1] || it.title_ar.slice(0, 10),
      value: carsScores[it.id] || 1.0,
    }));
  }, [carsScores]);

  // M-CHAT Calculation
  const mchatRiskCount = useMemo(() => {
    return Object.values(mchatScores).filter(Boolean).length;
  }, [mchatScores]);

  const mchatInterpretation = useMemo(() => {
    if (mchatRiskCount <= 2) {
      return { label: 'خطورة منخفضة (Low Risk)', color: 'emerald', advice: 'لا توجد مؤشرات توحد مقلقة في الفرز المبكر.' };
    } else if (mchatRiskCount <= 7) {
      return { label: 'خطورة متوسطة (Medium Risk)', color: 'amber', advice: 'يُوصى بإجراء مقابلة المتابعة المقننة (M-CHAT Follow-up) لتدقيق الاستجابات.' };
    } else {
      return { label: 'خطورة مرتفعة (High Risk)', color: 'red', advice: 'تستدعي فوراً تحويلاً لإجراء فحص تشخيصي شامل (ADOS-2 / CARS-2).' };
    }
  }, [mchatRiskCount]);

  // BDI-II Calculation
  const bdiTotal = useMemo(() => {
    return Object.values(bdiScores).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0);
  }, [bdiScores]);

  const bdiInterpretation = useMemo(() => {
    if (bdiTotal <= 13) return { label: 'اكتئاب في حده الأدنى (Minimal)', color: 'emerald', advice: 'حالة مزاجية مستقرة ضمن الطبيعي.' };
    if (bdiTotal <= 19) return { label: 'اكتئاب خفيف (Mild Depression)', color: 'blue', advice: 'دعم نفسي معرفي وتفعيل السلوك.' };
    if (bdiTotal <= 28) return { label: 'اكتئاب متوسط (Moderate Depression)', color: 'orange', advice: 'جلسات علاج معرفي سلوكي CBT وإعادة هيكلة الأفكار.' };
    return { label: 'اكتئاب شديد حاد (Severe Depression)', color: 'red', advice: 'تدخل نفسي وطبي متخصص فوراً ومتابعة الخطورة.' };
  }, [bdiTotal]);

  // CONNERS-3 Calculation
  const connersTotal = useMemo(() => {
    return Object.values(connersScores).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0);
  }, [connersScores]);

  const connersRadarData = useMemo(() => {
    const dims = { Inattention: 0, Hyperactivity: 0, Impulsivity: 0, Executive: 0, Social: 0 };
    CONNERS_ITEMS.forEach(it => {
      dims[it.dim] = (dims[it.dim] || 0) + (connersScores[it.id] || 0);
    });
    return [
      { label: 'قصور الانتباه', value: dims.Inattention },
      { label: 'فرط الحركة', value: dims.Hyperactivity },
      { label: 'الاندفاعية', value: dims.Impulsivity },
      { label: 'الوظائف التنفيذية', value: dims.Executive },
      { label: 'التفاعل الاجتماعي', value: dims.Social },
    ];
  }, [connersScores]);

  // Generic Radar Data
  const genericRadarData = useMemo(() => {
    return genericDimensions.map(dim => ({
      label: dim.slice(0, 14),
      value: genericScores[dim] || 50,
    }));
  }, [genericDimensions, genericScores]);

  // =========================================================================
  // AI CLINICAL SUMMARY DRAFT GENERATOR
  // =========================================================================

  const aiClinicalSummary = useMemo(() => {
    const pName = currentPatient ? getPatientDisplayName(currentPatient) : 'المريض';
    const pAge = currentPatient ? getPatientDisplayAge(currentPatient) : null;
    const patientHeader = `${pName}${pAge ? ` (${pAge})` : ''}`;

    if (testCode.includes('CARS')) {
      return `تقرير الفحص السريري بمقياس تقدير التوحد الطفولي (CARS-2):
تم تطبيق الرائز على الطفل(ة) ${patientHeader} بتاريخ ${assessmentDate} في إطار التقييم النمائي الشامل.
أظهرت النتائج المحصل عليها مجموع درجات خام يعادل (${carsTotal.toFixed(1)} من 60)، مما يضع الأداء السلوكي والتواصلي للطفل ضمن فئة: [${carsInterpretation.label}].
أظهر المخطط السريري أبرز مظاهر التباين في أبعاد: ${CARS2_ITEMS.filter(it => carsScores[it.id] >= 2.5).map(it => it.title_ar).join('، ') || 'كافة الأبعاد متوازنة'}.
التوصية السريرية: ${carsInterpretation.advice} مع استمرار المتابعة والتأهيل الفردي.`;
    }

    if (testCode.includes('M-CHAT')) {
      return `تقرير الفرز المبكر لطيف التوحد (M-CHAT-R/F):
تم تمرير استبيان الفرز للطفل(ة) ${patientHeader} بمشاركة الوالدين.
النتيجة: تم رصد (${mchatRiskCount} مؤشرات خطورة من أصل 20 بنداً)، مما يضع الحالة ضمن فئة: [${mchatInterpretation.label}].
التوصية الإكلينيكية: ${mchatInterpretation.advice}`;
    }

    if (testCode.includes('BDI')) {
      return `تقرير تقييم الاكتئاب السريري بمقياس بيك (BDI-II):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
الدرجة الكلية المحصل عليها: (${bdiTotal} من 63) - التصنيف: [${bdiInterpretation.label}].
${bdiScores[9] > 0 ? '⚠️ تنبيه سريري عالي الأهمية: تم تسجيل أفكار تشاؤمية/انتحارية في البند التاسع تستوجب تأمين المريض فوراً.' : 'لم تُسجل أي مؤشرات انتحارية نشطة.'}
الخلاصة: ${bdiInterpretation.advice}`;
    }

    if (testCode.includes('PHQ')) {
      return `تقرير تقييم الاكتئاب السريري بالمعيار الذهبي العالمي (PHQ-9):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
الدرجة الكلية المحصل عليها: (${questionnaireTotal} من 27) - التصنيف: [${questionnaireSeverity.label}].
الإجراء العيادي التلقائي المقترح: ${questionnaireSeverity.action || questionnaireSeverity.advice}.
${questionnaireAnswers[9] > 0 ? '🚨 تنبيه أمان سريري فوري (Red Alert): تم تسجيل درجة إيجابية في البند رقم 9 (أفكار تفضيل الموت أو إيذاء النفس). يجب على الأخصائي تفعيل بروتوكول الأمان وتأمين المريض فوراً.' : 'لم يتم تسجيل أي أفكار إيذاء نفس في البند التاسع.'}
الخلاصة والتوصيات: ${clinicalNotes || questionnaireSeverity.advice}`;
    }

    if (testCode.includes('GAD')) {
      return `تقرير تقييم اضطراب القلق العام بالمعيار الذهبي العالمي (GAD-7):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
الدرجة الكلية المحصل عليها: (${questionnaireTotal} من 21) - التصنيف السريري: [${questionnaireSeverity.label}].
التفسير السريري المعتمد: ${questionnaireSeverity.advice}.
الملاحظات السريرية: ${clinicalNotes || 'استجابة متسقة مع عتبة التقييم السريري المعتمدة.'}`;
    }

    if (testCode.includes('PCL')) {
      return `تقرير تقييم اضطراب ما بعد الصدمة وفق DSM-5 بمقياس (PCL-5):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
الدرجة الكلية المحصل عليها: (${questionnaireTotal} من 80) - التصنيف: [${questionnaireSeverity.label}].
التقييم التشخيصي: ${questionnaireTotal >= 33 ? 'عتبة دالة سريرياً على احتمال كرب ما بعد الصدمة (>= 33) تستدعي بروتوكول TF-CBT أو تقنية EMDR.' : 'الدرجة دون العتبة التشخيصية الدالة على PTSD.'}
التوصية: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('HAM-D') || testCode.includes('HAMD')) {
      return `تقرير تقييم الاكتئاب السريري بمقياس هاملتون (HAM-D-17 Clinician-rated):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate} | الفاحص: الأخصائي السريري المعالج.
الدرجة المقدرة سريرياً: (${questionnaireTotal} من 52) - التصنيف: [${questionnaireSeverity.label}].
${questionnaireAnswers[3] > 0 ? '🚨 تنبيه أمان سريري عاجل (Red Alert): رصد استجابة إيجابية على بند أفكار الموت أو الانتحار (البند 3). يستلزم تفعيل خطة السلامة العيادية فوراً.' : 'لم تُسجل أي أفكار انتحارية في البند الثالث.'}
الخلاصة والتوجيه السريري: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('HAM-A') || testCode.includes('HAMA') || testCode.includes('HAM')) {
      return `تقرير فحص وتقييم القلق السريري بمقياس هاملتون (HAM-A Clinician-rated):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate} | الفاحص: الأخصائي السريري المعالج.
الدرجة الكلية المقدرة سريرياً: (${questionnaireTotal} من 56) - التصنيف: [${questionnaireSeverity.label}].
الخلاصة السريرية: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('DASS')) {
      return `تقرير التقييم الثلاثي للأعراض الوجدانية بمقياس (DASS-21):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
النتيجة التفصيلية: [${questionnaireSeverity.label}].
مجموع الدرجات الخام الكلي: (${questionnaireTotal} من 63).
التوجيه العيادي: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('SPIN')) {
      return `تقرير تقييم الرهاب والقلق الاجتماعي بمقياس (SPIN):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
الدرجة الكلية: (${questionnaireTotal} من 68) - التصنيف: [${questionnaireSeverity.label}].
التقييم التشخيصي: ${questionnaireTotal >= 19 ? 'تجاوز المفحوص العتبة التشخيصية الدالة سريرياً (>= 19) مما يؤكد وجود قلق اجتماعي ملحوظ يستدعي تدخلاً معرفياً سلوكياً.' : 'الدرجة دون العتبة التشخيصية للرهاب الاجتماعي.'}
التوصية الإكلينيكية: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('PDSS')) {
      return `تقرير تقييم شدة اضطراب الهلع ومخاوف الساح (PDSS-SR):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
الدرجة الكلية: (${questionnaireTotal} من 28) - التصنيف: [${questionnaireSeverity.label}].
الخلاصة السريرية: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('ISI') || testCode.includes('INSOMNIA')) {
      return `تقرير تقييم شدة الأرق واضطرابات النوم (ISI):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
الدرجة الكلية: (${questionnaireTotal} من 28) - التصنيف: [${questionnaireSeverity.label}].
التوصية السريرية: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('ASRS')) {
      return `تقرير الفرز السريري لاضطراب TDAH لدى البالغين (WHO ASRS-v1.1):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
النتيجة الإجمالية: (${questionnaireTotal} من 72) - النتيجة: [${questionnaireSeverity.label}].
التوجيه العيادي: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('AQ-10') || testCode.includes('AQ10') || testCode.includes('AQ')) {
      return `تقرير الفرز الأولي لسمات طيف التوحد للبالغين (AQ-10 - معايير NICE):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
الدرجة الكلية: (${questionnaireTotal} من 10) - التصنيف: [${questionnaireSeverity.label}].
التوصية المعتمدة: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('PSS')) {
      return `تقرير مقياس إدراك الضغوط النفسية (PSS-10):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
الدرجة الكلية المحسوبة: (${questionnaireTotal} من 40) - التصنيف: [${questionnaireSeverity.label}].
الخلاصة العيادية: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('RSES') || testCode.includes('ROSENBERG')) {
      return `تقرير مقياس روزنبرغ لتقدير الذات (RSES):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
الدرجة الكلية: (${questionnaireTotal} من 30) - التصنيف: [${questionnaireSeverity.label}].
التوجيه الإرشادي: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('SNAP')) {
      return `تقرير مقياس سناب-4 لفرط الحركة وتشتت الانتباه (SNAP-IV):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
الدرجة الكلية: (${questionnaireTotal} من 54) - متوسط البنود: ${(questionnaireTotal / 18).toFixed(2)}.
التصنيف: [${questionnaireSeverity.label}].
التوصية: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('Y-BOCS') || testCode.includes('YBOCS')) {
      return `تقرير تقييم الوسواس القهري بمقياس ييل-براون (Y-BOCS):
المفحوص: ${patientHeader} | التاريخ: ${assessmentDate}.
الدرجة الكلية: (${questionnaireTotal} من 40) - التصنيف: [${questionnaireSeverity.label}].
الخطة العلاجية: ${questionnaireSeverity.advice}`;
    }

    if (testCode.includes('CONNERS')) {
      return `تقرير تقييم اضطراب فرط الحركة وتشتت الانتباه (Conners-3):
المفحوص: ${patientHeader} | المجموع الخام: ${connersTotal}.
أظهر التحليل متعدد المحاور ارتفاعاً ملحوظاً في درجات قصور الانتباه والاندفاعية مقارنة بالأقران في نفس الفئة العمرية.
التوصية: وضع استراتيجيات لتنظيم البيئة المدرسية، تدريب الذاكرة العاملة، وبرنامج تعديل السلوك.`;
    }

    // Generic
    return `تقرير الفحص السريري لمقياس [${test?.title_ar || test?.name_ar || testCode}]:
تم تمرير وتقييم الرائز للمريض(ة) ${patientHeader} بتاريخ ${assessmentDate}.
أظهر التحليل السريري للأبعاد توزيع الدرجات عبر المحاور المستهدفة مع توافق النتائج مع الدليل المعياري.
الملاحظات السريرية: ${clinicalNotes || 'أبدى المريض تعاوناً جيداً أثناء جلسة التقييم.'}`;
  }, [testCode, currentPatient, assessmentDate, carsTotal, carsInterpretation, carsScores, mchatRiskCount, mchatInterpretation, bdiTotal, bdiInterpretation, bdiScores, connersTotal, questionnaireTotal, questionnaireSeverity, questionnaireAnswers, test, clinicalNotes]);

  // =========================================================================
  // SAVE ASSESSMENT TO BACKEND API
  // =========================================================================

  const handleSaveToPatient = async () => {
    if (!selectedPatientId) {
      alert('يرجى اختيار ملف المريض أولاً.');
      return;
    }

    try {
      setSaving(true);
      let payloadResults = {};
      let totalCalculated = 0;
      let diagConclusion = '';

      if (testCode.includes('CARS')) {
        payloadResults = { items: carsScores, total: carsTotal, radar: carsRadarData };
        totalCalculated = carsTotal;
        diagConclusion = carsInterpretation.label;
      } else if (testCode.includes('M-CHAT')) {
        payloadResults = { items: mchatScores, risk_count: mchatRiskCount };
        totalCalculated = mchatRiskCount;
        diagConclusion = mchatInterpretation.label;
      } else if (testCode.includes('BDI')) {
        payloadResults = { items: bdiScores, total: bdiTotal, critical_alert: isRedAlertTriggered };
        totalCalculated = bdiTotal;
        diagConclusion = bdiInterpretation.label;
      } else if (testCode.includes('CONNERS')) {
        payloadResults = { items: connersScores, total: connersTotal, radar: connersRadarData };
        totalCalculated = connersTotal;
        diagConclusion = `Conners Score: ${connersTotal}`;
      } else if (isPresetQuestionnaire) {
        payloadResults = {
          items: questionnaireAnswers,
          total: questionnaireTotal,
          critical_alert: isRedAlertTriggered,
          test_code: testCode,
        };
        totalCalculated = questionnaireTotal;
        diagConclusion = `${questionnaireSeverity.label} (${questionnaireTotal})`;
      } else {
        payloadResults = { items: genericScores, radar: genericRadarData };
        totalCalculated = 50;
        diagConclusion = 'تقييم سريري معياري مكتمل';
      }

      const isOrtho = test?.category === 'orthophony' || test?.category === 'fluency' || testCode.includes('SSI') || testCode.includes('ELO');
      const assessmentType = isOrtho ? 'orthophony_bilan' : 'psychometric_eval';

      const assessmentData = {
        patient_id: selectedPatientId,
        type: assessmentType,
        title: `[${testCode}] ${test?.title_ar || test?.name_ar || testCode}`,
        assessment_date: assessmentDate,
        results_data: {
          test_code: testCode,
          test_title: test?.title_ar || test?.name_ar || testCode,
          category: test?.category,
          cutoff: test?.cutoff,
          raw_score: totalCalculated,
          ...payloadResults,
        },
        diagnostic_conclusion: diagConclusion,
        recommendations: aiClinicalSummary,
      };

      await assessmentApi.create(assessmentData);
      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to save clinical assessment:', err);
      alert('فشل حفظ نتيجة التقييم: ' + (err.message || 'خطأ في الاتصال بالخادم'));
    } finally {
      setSaving(false);
    }
  };

  const handleCopyAiSummary = () => {
    navigator.clipboard.writeText(aiClinicalSummary);
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 2000);
  };

  // =========================================================================
  // SPECIALIZED INTERACTIVE SCORERS DELEGATION
  // =========================================================================

  // 1. MMPI-2 Scorer
  if (testCode.includes('MMPI')) {
    return (
      <Mmpi2ScorerModal
        isOpen={true}
        onClose={onClose}
        patient={effectivePatients.find(p => String(p.id) === String(selectedPatientId)) || effectivePatients[0]}
        patients={effectivePatients}
        initialPatientId={selectedPatientId}
        onSaved={onSaved}
      />
    );
  }

  // 2. Wechsler Scales (WISC-V, WAIS-IV, WPPSI-III, NEMI, EDEI, Columbia)
  if (
    testCode.includes('WISC') || testCode.includes('WAIS') || testCode.includes('WPPSI') ||
    testCode.includes('NEMI') || testCode.includes('EDEI') || testCode.includes('COLUMB')
  ) {
    const defaultBattery = testCode.includes('WAIS')
      ? 'WAIS-IV'
      : (testCode.includes('WPPSI') ? 'WPPSI-III' : 'WISC-V');

    return (
      <WiscWaisScorerModal
        isOpen={true}
        onClose={onClose}
        patient={effectivePatients.find(p => String(p.id) === String(selectedPatientId)) || effectivePatients[0]}
        patients={effectivePatients}
        initialPatientId={selectedPatientId}
        initialBattery={defaultBattery}
        onSaved={onSaved}
      />
    );
  }

  // 3. Stroop Attention & Inhibition Test
  if (testCode.includes('STROOP')) {
    return (
      <StroopTestInteractiveModal
        isOpen={true}
        onClose={onClose}
        patient={effectivePatients.find(p => String(p.id) === String(selectedPatientId)) || effectivePatients[0]}
        patients={effectivePatients}
        initialPatientId={selectedPatientId}
        onSaved={onSaved}
      />
    );
  }

  // 4. Rey Complex Figure (Copy & Memory)
  if (testCode.includes('REY')) {
    return (
      <ReyFigureScorerModal
        isOpen={true}
        onClose={onClose}
        patient={effectivePatients.find(p => String(p.id) === String(selectedPatientId)) || effectivePatients[0]}
        patients={effectivePatients}
        initialPatientId={selectedPatientId}
        onSaved={onSaved}
      />
    );
  }

  // 5. ZAREKI-R Dyscalculia Battery
  if (testCode.includes('ZAREKI') || testCode.includes('CALCUL') || testCode.includes('DYSCALCUL')) {
    return (
      <ZarekiScorerModal
        isOpen={true}
        onClose={onClose}
        patient={effectivePatients.find(p => String(p.id) === String(selectedPatientId)) || effectivePatients[0]}
        patients={effectivePatients}
        initialPatientId={selectedPatientId}
        onSaved={onSaved}
      />
    );
  }

  // 6. Projective Scales (Rorschach, TAT, FAT)
  if (
    testCode.includes('RORSCHACH') || testCode.includes('TAT') ||
    testCode.includes('FAT') || testCode.includes('PROJECTIVE')
  ) {
    return (
      <ProjectiveTestsScorerModal
        isOpen={true}
        onClose={onClose}
        patient={effectivePatients.find(p => String(p.id) === String(selectedPatientId)) || effectivePatients[0]}
        patients={effectivePatients}
        initialPatientId={selectedPatientId}
        initialTest={testCode.includes('TAT') || testCode.includes('FAT') ? 'TAT' : 'RORSCHACH'}
        onSaved={onSaved}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto font-sans text-right" dir="rtl">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-4xl w-full p-5 sm:p-7 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto my-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {testCode}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {test?.title_fr || test?.name_fr || 'Évaluation Standardisée'}
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                ورقة التمرير والتنقيط الرقمية: {test?.title_ar || test?.name_ar || testCode}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition self-end sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Selection & Metadata Strip */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 font-bold flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>ملف المريض / الطفل:</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPatientPicker(true)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 transition"
              >
                <Search className="w-2.5 h-2.5" />
                <span>بحث في المرضى</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowPatientPicker(true)}
              className="w-full bg-slate-900 hover:bg-slate-800/80 border border-slate-700 hover:border-indigo-500/50 rounded-xl px-3 py-2 text-white font-bold text-xs flex items-center justify-between transition text-right group"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-black shrink-0 group-hover:bg-indigo-500/30">
                  {selectedPatient ? (getPatientDisplayName(selectedPatient)[0] || 'م') : '؟'}
                </div>
                <span className="truncate">
                  {selectedPatient ? getPatientDisplayName(selectedPatient) : 'اختر ملف المريض...'}
                </span>
                {selectedPatient && getPatientDisplayAge(selectedPatient) && (
                  <span className="text-[10px] text-slate-400 font-normal font-mono">
                    ({getPatientDisplayAge(selectedPatient)})
                  </span>
                )}
              </div>
              <span className="text-[10px] text-indigo-400 font-normal shrink-0 mr-1">تغيير ▾</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>تاريخ إجراء الفحص:</span>
            </label>
            <input
              type="date"
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Realtime Cutoff Live Badge */}
          <div className="flex flex-col justify-center items-center bg-slate-900 border border-indigo-500/20 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 font-bold">النتيجة المعيارية اللحظية</span>
            {testCode.includes('CARS') && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black font-mono text-white" dir="ltr">{carsTotal.toFixed(1)}</span>
                {Object.values(carsScores).some(v => v > 1) ? (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    carsInterpretation.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                    carsInterpretation.color === 'orange' ? 'bg-orange-500/20 text-orange-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {carsInterpretation.label.split(' ')[0]}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400">
                    في انتظار التقييم
                  </span>
                )}
              </div>
            )}
            {testCode.includes('M-CHAT') && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black font-mono text-white" dir="ltr">{mchatRiskCount} / 20</span>
                {Object.keys(mchatScores).length > 0 ? (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    mchatInterpretation.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                    mchatInterpretation.color === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {mchatInterpretation.label}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400">
                    في انتظار الإجابة
                  </span>
                )}
              </div>
            )}
            {testCode.includes('BDI') && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black font-mono text-white" dir="ltr">{bdiTotal} / 63</span>
                {Object.values(bdiScores).some(v => v > 0) ? (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    bdiInterpretation.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                    bdiInterpretation.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                    bdiInterpretation.color === 'orange' ? 'bg-orange-500/20 text-orange-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {bdiInterpretation.label}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400">
                    في انتظار الإجابة
                  </span>
                )}
              </div>
            )}
            {testCode.includes('PHQ') && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black font-mono text-white" dir="ltr">{questionnaireTotal} / 27</span>
                {Object.keys(questionnaireAnswers).length > 0 ? (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    questionnaireSeverity.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                    questionnaireSeverity.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                    questionnaireSeverity.color === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                    questionnaireSeverity.color === 'orange' ? 'bg-orange-500/20 text-orange-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {questionnaireSeverity.label}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400">
                    في انتظار الإجابة
                  </span>
                )}
              </div>
            )}
            {testCode.includes('GAD') && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black font-mono text-white" dir="ltr">{questionnaireTotal} / 21</span>
                {Object.keys(questionnaireAnswers).length > 0 ? (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    questionnaireSeverity.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                    questionnaireSeverity.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                    questionnaireSeverity.color === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {questionnaireSeverity.label}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400">
                    في انتظار الإجابة
                  </span>
                )}
              </div>
            )}
            {testCode.includes('PCL') && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black font-mono text-white" dir="ltr">{questionnaireTotal} / 80</span>
                {Object.keys(questionnaireAnswers).length > 0 ? (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    questionnaireTotal >= 33 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {questionnaireTotal >= 33 ? 'عتبة PTSD دالة (>= 33)' : 'دون العتبة'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400">
                    في انتظار الإجابة
                  </span>
                )}
              </div>
            )}
            {testCode.includes('HAM') && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black font-mono text-white" dir="ltr">{questionnaireTotal} / {testCode.includes('HAM-D') ? 52 : 56}</span>
                {Object.keys(questionnaireAnswers).length > 0 ? (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/20 text-purple-300">
                    {questionnaireSeverity.label}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400">
                    في انتظار الإجابة
                  </span>
                )}
              </div>
            )}
            {isPresetQuestionnaire && !testCode.includes('PHQ') && !testCode.includes('GAD') && !testCode.includes('PCL') && !testCode.includes('HAM') && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black font-mono text-white" dir="ltr">{questionnaireTotal} / {testDef?.maxScore || 100}</span>
                {Object.keys(questionnaireAnswers).length > 0 ? (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    questionnaireSeverity.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                    questionnaireSeverity.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                    questionnaireSeverity.color === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                    questionnaireSeverity.color === 'orange' ? 'bg-orange-500/20 text-orange-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {questionnaireSeverity.label?.split('|')[0] || questionnaireSeverity.label}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400">
                    في انتظار الإجابة
                  </span>
                )}
              </div>
            )}
            {!testCode.includes('CARS') && !testCode.includes('M-CHAT') && !testCode.includes('BDI') && !isPresetQuestionnaire && (
              <div className="text-xs font-bold text-indigo-300 mt-1">
                تمرير إكلينيكي مباشر
              </div>
            )}
          </div>
        </div>

        {/* View Switch Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'sheet'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>بنود التمرير والتقييم</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'radar'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>الرادار السريري (Spider Web)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_summary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ai_summary'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>مسودة التقرير الذكي (AI Report)</span>
          </button>
        </div>

        {/* TAB 1: PASSATION SHEET ITEMS */}
        {activeTab === 'sheet' && (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {/* Red Alert / Safety Flag Callout */}
            {isRedAlertTriggered && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-white flex items-start gap-3 shadow-xl shadow-rose-950/60 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider">
                      FLAG / RED ALERT
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-rose-200">
                      تنبيه أمان سريري عاجل: رصد أفكار انتحارية / إيذاء للنفس (البند رقم 9)
                    </h4>
                  </div>
                  <p className="text-[11px] sm:text-xs text-rose-300 leading-relaxed">
                    سجل المفحوص استجابة إيجابية على بند أفكار الموت أو الرغبة في إيذاء النفس. يجب على الأخصائي تفعيل بروتوكول الأمان العيادي فوراً وتأمين سلامة المريض والتواصل مع المرافقين عند الضرورة.
                  </p>
                </div>
              </div>
            )}

            {/* CARS-2 Specific Form */}
            {testCode.includes('CARS') && (
              <div className="space-y-3">
                {CARS2_ITEMS.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h4 className="text-xs font-black text-white">{item.title_ar}</h4>
                        <div className="text-[10px] text-slate-500 font-mono">{item.title_fr}</div>
                      </div>
                      <span className="text-xs font-mono font-black text-indigo-400 self-start sm:self-auto bg-indigo-500/10 px-2 py-0.5 rounded">
                        الدرجة: {carsScores[item.id]}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      💡 {item.desc}
                    </p>

                    {/* 7-point scale buttons */}
                    <div className="grid grid-cols-7 gap-1 pt-1">
                      {[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCarsScores(prev => ({ ...prev, [item.id]: val }))}
                          className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                            carsScores[item.id] === val
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          {val.toFixed(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* M-CHAT Specific Form */}
            {testCode.includes('M-CHAT') && (
              <div className="space-y-2.5">
                {MCHAT_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      mchatScores[item.id]
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono font-bold flex items-center justify-center">
                          {item.id}
                        </span>
                        {item.critical && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            بند حرج ⚠️
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{item.text}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setMchatScores(prev => ({ ...prev, [item.id]: false }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          !mchatScores[item.id]
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        نعم (سليم)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMchatScores(prev => ({ ...prev, [item.id]: true }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          mchatScores[item.id]
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        لا (خطر)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* BDI-II Specific Form */}
            {testCode.includes('BDI') && (
              <div className="space-y-3">
                {BDIII_ITEMS.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-black ${item.critical ? 'text-rose-400 font-bold' : 'text-white'}`}>
                        {item.title}
                      </h4>
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        الدرجة: {bdiScores[item.id]}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      {item.options.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBdiScores(prev => ({ ...prev, [item.id]: idx }))}
                          className={`w-full text-right p-2.5 rounded-xl text-xs transition border flex items-center justify-between ${
                            bdiScores[item.id] === idx
                              ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold'
                              : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{opt}</span>
                          {bdiScores[item.id] === idx && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Standardized Preset Questionnaires (PHQ-9, GAD-7, HAM-A, PCL-5, Y-BOCS, SNAP-IV) */}
            {isPresetQuestionnaire && testDef?.items && (
              <div className="space-y-3">
                {testDef.items.map((item) => {
                  const isCritical = Boolean(item.critical || ((testCode.includes('PHQ') || testCode.includes('BDI')) && item.id === 9) || (testCode.includes('HAM-D') && item.id === 3));
                  const opts = item.options || testDef.standardOptions || [];
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                        isCritical && questionnaireAnswers[item.id] > 0
                          ? 'bg-rose-950/30 border-rose-500/80 ring-1 ring-rose-500/50'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono font-bold flex items-center justify-center">
                            {item.id}
                          </span>
                          <h4 className={`text-xs font-black ${isCritical ? 'text-rose-400' : 'text-white'}`}>
                            {item.title}
                          </h4>
                        </div>
                        {isCritical && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            بند أمان حرج ⚠️
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                        {opts.map((opt, oIdx) => {
                          const scoreVal = opt.score !== undefined ? opt.score : oIdx;
                          const isSelected = questionnaireAnswers[item.id] === scoreVal;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => setQuestionnaireAnswers(prev => ({ ...prev, [item.id]: scoreVal }))}
                              className={`p-2.5 rounded-xl text-right text-xs transition border flex items-center justify-between gap-2 ${
                                isSelected
                                  ? isCritical && scoreVal > 0
                                    ? 'bg-rose-600 text-white border-rose-400 font-bold shadow-md shadow-rose-600/30'
                                    : 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-md shadow-indigo-600/30'
                                  : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                            >
                              <span className="leading-snug">{opt.text || opt}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Generic Battery Form for all other 90+ tests */}
            {!testCode.includes('CARS') && !testCode.includes('M-CHAT') && !testCode.includes('BDI') && !isPresetQuestionnaire && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400 leading-relaxed">
                  💡 قم برصد درجة كل محور أو بعد سريري من أبعاد الرائز (من 0 إلى 100) ليتم رسم مخطط الرادار السريري وحساب النتيجة الإجمالية تلقائياً.
                </div>
                {genericDimensions.map((dim, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{dim}</span>
                      <span className="text-xs font-mono font-bold text-indigo-400">{genericScores[dim] || 50}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={genericScores[dim] || 50}
                      onChange={(e) => setGenericScores(prev => ({ ...prev, [dim]: parseInt(e.target.value, 10) }))}
                      className="w-full accent-indigo-500 bg-slate-900 h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SPIDER / RADAR VISUALIZER */}
        {activeTab === 'radar' && (
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-4">
            {testCode.includes('CARS') && <ClinicalRadarChart data={carsRadarData} maxVal={4} size={300} />}
            {testCode.includes('CONNERS') && <ClinicalRadarChart data={connersRadarData} maxVal={9} size={300} />}
            {!testCode.includes('CARS') && !testCode.includes('CONNERS') && (
              <ClinicalRadarChart data={genericRadarData} maxVal={100} size={300} />
            )}
          </div>
        )}

        {/* TAB 3: AI CLINICAL REPORT DRAFT */}
        {activeTab === 'ai_summary' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>المسودة التلقائية للتقرير الإكلينيكي الموجه للأطباء والأولياء:</span>
              </span>
              <button
                type="button"
                onClick={handleCopyAiSummary}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1"
              >
                {copiedAi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAi ? 'تم النسخ!' : 'نسخ التقرير'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-sans text-xs text-slate-200 leading-relaxed whitespace-pre-line shadow-inner">
              {aiClinicalSummary}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">ملاحظات الفاحص الإضافية:</label>
              <textarea
                rows={2}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="أضف أي ملاحظة خاصة حول سلوك الطفل أو التجاوب أثناء الجلسة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveToPatient}
              disabled={saving}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'جاري الحفظ...' : saveSuccess ? 'تم الحفظ في ملف المريض!' : 'حفظ الفحص في سجل المريض'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700"
              title="طباعة بطاقة التقييم"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSendModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
              title="إرسال رابط الاختبار أو فتح وضع التابلت المباشر للمريض"
            >
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>إرسال للمريض / وضع التابلت 📲</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            إغلاق
          </button>
        </div>

        {/* Send Remote / QR / Tablet Assignment Modal */}
        {showSendModal && (
          <SendTestAssignmentModal
            test={test}
            patients={effectivePatients}
            initialPatientId={selectedPatientId || effectivePatients[0]?.id}
            tenant={tenant}
            onClose={() => setShowSendModal(false)}
          />
        )}

        {/* Searchable Patient Picker Modal */}
        {showPatientPicker && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" dir="rtl">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative text-right">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>تحديد ملف المريض / الطفل لجلسة الفحص</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowPatientPicker(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SearchablePatientSelect
                patients={effectivePatients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={(pId) => {
                  setSelectedPatientId(pId);
                  setShowPatientPicker(false);
                }}
                accentColor="indigo"
                maxHeight="max-h-60"
                autoFocus
                allowDemoFallback={true}
              />
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPatientPicker(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
