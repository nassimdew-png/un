import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  FileText, 
  Printer, 
  ArrowRight, 
  RotateCcw, 
  Save, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Sliders, 
  SlidersHorizontal, 
  User, 
  Check, 
  X,
  Volume2,
  AlertOctagon,
  TrendingUp,
  Activity,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';
import InteractiveTestPassationModal from '../therapy/InteractiveTestPassationModal';
import { DEFAULT_DEMO_PATIENT, DEFAULT_DEMO_PATIENT_2 } from '../common/SearchablePatientSelect';
import WiscRunnerView from './WiscRunnerView';
import AlouetteRunnerView from './AlouetteRunnerView';
import MchatRunnerView from './MchatRunnerView';
import VinelandRunnerView from './VinelandRunnerView';
import ProjectiveGridRunnerView from './ProjectiveGridRunnerView';
import Do80RunnerView from './Do80RunnerView';
import D2StroopRunnerView from './D2StroopRunnerView';
import StaiRunnerView from './StaiRunnerView';
import ZarekiRunnerView from './ZarekiRunnerView';
import RavenRunnerView from './RavenRunnerView';
import ReyFigureRunnerView from './ReyFigureRunnerView';
import DrawingAssessmentRunnerView from './DrawingAssessmentRunnerView';
import NepsyRunnerView from './NepsyRunnerView';
import Ados2RunnerView from './Ados2RunnerView';
import AdirRunnerView from './AdirRunnerView';
import L2maRunnerView from './L2maRunnerView';
import NeelRunnerView from './NeelRunnerView';
import CmsMemoryRunnerView from './CmsMemoryRunnerView';
import Mem4RunnerView from './Mem4RunnerView';
import BecsRunnerView from './BecsRunnerView';
import CsbsRunnerView from './CsbsRunnerView';
import EchaEcaaRunnerView from './EchaEcaaRunnerView';
import PatteNoireRunnerView from './PatteNoireRunnerView';
import ScenoRunnerView from './ScenoRunnerView';
import TatRunnerView from './TatRunnerView';
import TmsEcsRunnerView from './TmsEcsRunnerView';
import TraumaqRunnerView from './TraumaqRunnerView';
import StressCopingRunnerView from './StressCopingRunnerView';
import WaisRunnerView from './WaisRunnerView';
import WppsiRunnerView from './WppsiRunnerView';
import O52RunnerView from './O52RunnerView';
import VocimRunnerView from './VocimRunnerView';

// Standard 21 Items for BDI-II with Arabic & French options
const BDI_21_ITEMS = [
  {
    id: 1,
    title_ar: '1. الحزن والشعور بالكآبة (Tristesse)',
    title_fr: 'Tristesse',
    options: [
      { score: 0, text: 'لا أشعر بالحزن على الإطلاق.' },
      { score: 1, text: 'أشعر بالحزن أغلب الأوقات.' },
      { score: 2, text: 'أنا حزين طوال الوقت ولا أستطيع التخلص من هذا الشعور.' },
      { score: 3, text: 'أنا حزين جداً أو غير سعيد لدرجة لا تُطاق.' },
    ],
  },
  {
    id: 2,
    title_ar: '2. التشاؤم ونظرة المستقبل (Pessimisme)',
    title_fr: 'Pessimisme',
    options: [
      { score: 0, text: 'لست يائساً أو متشائماً بشأن مستقبلي.' },
      { score: 1, text: 'أشعر بالإحباط والتشاؤم بشأن مستقبلي أكثر من المعتاد.' },
      { score: 2, text: 'لا أتوقع أن تتحسن أموري بأي شكل.' },
      { score: 3, text: 'أشعر أن مستقبلي ميؤوس منه وأن الأمور ستزداد سوءاً.' },
    ],
  },
  {
    id: 3,
    title_ar: '3. الفشل والنجاح السابق (Échec passé)',
    title_fr: 'Échec passé',
    options: [
      { score: 0, text: 'لا أشعر أنني شخص فاشل.' },
      { score: 1, text: 'لقد فشلت أكثر مما ينبغي في حياتي.' },
      { score: 2, text: 'عندما أنظر إلى ماضيّ، أرى الكثير من الإخفاقات.' },
      { score: 3, text: 'أشعر بأنني إنسان فاشل تماماً وبشكل كلي.' },
    ],
  },
  {
    id: 4,
    title_ar: '4. فقدان المتعة والشغف (Perte de plaisir)',
    title_fr: 'Perte de plaisir',
    options: [
      { score: 0, text: 'أستمتع بالأشياء التي أحبها كما كنت دائماً.' },
      { score: 1, text: 'لا أستمتع بالأشياء كما كنت أستمتع بها سابقاً.' },
      { score: 2, text: 'أحصل على القليل جداً من المتعة من الأشياء التي كانت تسعدني.' },
      { score: 3, text: 'لا أستطيع الحصول على أي متعة من أي شيء على الإطلاق.' },
    ],
  },
  {
    id: 5,
    title_ar: '5. مشاعر الذنب وتأنيب الضمير (Culpabilité)',
    title_fr: 'Culpabilité',
    options: [
      { score: 0, text: 'لا أشعر بالذنب بشكل خاص.' },
      { score: 1, text: 'أشعر بالذنب تجاه أشياء كثيرة فعلتها أو كان يجب أن أفعلها.' },
      { score: 2, text: 'أشعر بالذنب الشديد طوال الوقت تقريباً.' },
      { score: 3, text: 'أشعر بأنني مذنب ومسؤول عن كل شيء سيء طوال الوقت.' },
    ],
  },
  {
    id: 6,
    title_ar: '6. الشعور بالعقاب (Sentiment de punition)',
    title_fr: 'Sentiment de punition',
    options: [
      { score: 0, text: 'لا أشعر بأنني أتعرض للعقاب.' },
      { score: 1, text: 'أشعر أنني قد أُعاقب قريباً.' },
      { score: 2, text: 'أتوقع أن أتعرض للعقاب على أخطائي.' },
      { score: 3, text: 'أشعر بأنني أُعاقب حالياً بالفعل.' },
    ],
  },
  {
    id: 7,
    title_ar: '7. كره الذات وعدم الرضا (Dépréciation de soi)',
    title_fr: 'Dépréciation de soi',
    options: [
      { score: 0, text: 'مشاعري تجاه نفسي جيدة كالمعتاد.' },
      { score: 1, text: 'فقدت الثقة في نفسي ورضاي عنها.' },
      { score: 2, text: 'أشعر بخيبة أمل عميقة في نفسي.' },
      { score: 3, text: 'أنا أكره نفسي تماماً.' },
    ],
  },
  {
    id: 8,
    title_ar: '8. لوم الذات وانتقاد النفس (Auto-critique)',
    title_fr: 'Auto-critique',
    options: [
      { score: 0, text: 'لا أنتقد نفسي أو ألومها أكثر من المعتاد.' },
      { score: 1, text: 'أنا أنتقد نفسي أكثر من السابق على أخطائي.' },
      { score: 2, text: 'ألوم نفسي على كل أخطائي وعيوبي.' },
      { score: 3, text: 'ألوم نفسي على كل شيء سيء يحدث من حولي.' },
    ],
  },
  {
    id: 9,
    title_ar: '9. الأفكار والرغبات الانتحارية (Idées suicidaires) ⚠️',
    title_fr: 'Idées suicidaires',
    isCritical: true,
    options: [
      { score: 0, text: 'ليس لدي أي أفكار حول إيذاء نفسي أو الانتحار.' },
      { score: 1, text: 'تراودني أفكار عن الانتحار، لكنني لن أنفذها مطلقاً.' },
      { score: 2, text: 'أرغب وأتمنى لو أستطيع إنهاء حياتي والموت.' },
      { score: 3, text: 'سأقوم بالانتحار لو سنحت لي أي فرصة.' },
    ],
  },
  {
    id: 10,
    title_ar: '10. نوبات البكاء (Pleurs)',
    title_fr: 'Pleurs',
    options: [
      { score: 0, text: 'لا أبكي أكثر مما كنت أبكي في العادة.' },
      { score: 1, text: 'أبكي الآن أكثر مما كنت في السابق.' },
      { score: 2, text: 'أبكي طوال الوقت على أبسط الأشياء.' },
      { score: 3, text: 'أرغب في البكاء بشدة، لكنني عاجز حتى عن ذرف الدموع.' },
    ],
  },
  {
    id: 11,
    title_ar: '11. التهيج والقلق الحركي (Agitation)',
    title_fr: 'Agitation',
    options: [
      { score: 0, text: 'لست متهيجاً أو قلقاً أكثر من المعتاد.' },
      { score: 1, text: 'أشعر بالتوتر والتململ أكثر من المعتاد.' },
      { score: 2, text: 'أنا متهيج وقلق لدرجة تجعل من الصعب علي البقاء ساكناً.' },
      { score: 3, text: 'أنا في حالة حركة وتململ مستمر لا أستطيع إيقافها.' },
    ],
  },
  {
    id: 12,
    title_ar: '12. فقدان الاهتمام بالآخرين والنشاطات (Perte d\'intérêt)',
    title_fr: 'Perte d\'intérêt',
    options: [
      { score: 0, text: 'لم أفقد اهتمامي بالناس أو النشاطات الأخرى.' },
      { score: 1, text: 'أصبحت أقل اهتماماً بالآخرين وبالأشياء من ذي قبل.' },
      { score: 2, text: 'فقدت معظم اهتمامي بالناس والأنشطة المحيطة بي.' },
      { score: 3, text: 'من الصعب جداً أن أهتم بأي شيء أو أي شخص على الإطلاق.' },
    ],
  },
  {
    id: 13,
    title_ar: '13. التردد وصعوبة اتخاذ القرارات (Indécision)',
    title_fr: 'Indécision',
    options: [
      { score: 0, text: 'أتخذ قراراتي بشكل جيد كالمعتاد.' },
      { score: 1, text: 'أجد صعوبة في اتخاذ القرارات أكثر من المعتاد.' },
      { score: 2, text: 'أواجه صعوبة بالغة في اتخاذ أبسط القرارات اليومية.' },
      { score: 3, text: 'أعجز تماماً عن اتخاذ أي قرار مهما كان بسيطاً.' },
    ],
  },
  {
    id: 14,
    title_ar: '14. تدني تقدير الذات (Dévalorisation)',
    title_fr: 'Dévalorisation',
    options: [
      { score: 0, text: 'لا أشعر بأنني عديم الفائدة أو القيمة.' },
      { score: 1, text: 'لا أعتبر نفسي نافعاً أو مفيداً كما كنت في السابق.' },
      { score: 2, text: 'أشعر بأنني أقل قيمة وفائدة بكثير مقارنة بالآخرين.' },
      { score: 3, text: 'أشعر بأنني إنسان عديم الفائدة والقيمة تماماً.' },
    ],
  },
  {
    id: 15,
    title_ar: '15. فقدان الطاقة والنشاط (Perte d\'énergie)',
    title_fr: 'Perte d\'énergie',
    options: [
      { score: 0, text: 'طاقتي ونشاطي بمستواهما المعتاد.' },
      { score: 1, text: 'طاقتي ونشاطي أقل مما كانت عليه في السابق.' },
      { score: 2, text: 'طاقتي غير كافية للقيام بالكثير من الأعمال.' },
      { score: 3, text: 'ليس لدي أي طاقة للقيام بأي شيء على الإطلاق.' },
    ],
  },
  {
    id: 16,
    title_ar: '16. اضطرابات النوم (Sommeil)',
    title_fr: 'Sommeil',
    options: [
      { score: 0, text: 'لم يطرأ أي تغيير على نمط نومي المعتاد.' },
      { score: 1, text: 'أنام أكثر أو أقل قليلاً من المعتاد.' },
      { score: 2, text: 'أنام أكثر بكثير أو أقل بكثير من المعتاد، أو أستيقظ مبكراً جداً.' },
      { score: 3, text: 'أستيقظ قبل الموعد بساعات ولا أستطيع العودة للنوم، أو أنام طوال اليوم.' },
    ],
  },
  {
    id: 17,
    title_ar: '17. سرعة الغضب والاستثارة (Irritabilité)',
    title_fr: 'Irritabilité',
    options: [
      { score: 0, text: 'لست سريع الغضب أكثر من المعتاد.' },
      { score: 1, text: 'أنا أكثر غضباً وسرعة انفعال من المعتاد.' },
      { score: 2, text: 'أنا سريع الانفعال والغضب طوال الوقت تقريباً.' },
      { score: 3, text: 'أشعر بالغضب المستمر تجاه كل شيء وأي شخص.' },
    ],
  },
  {
    id: 18,
    title_ar: '18. تغير الشهية والوزن (Appétit)',
    title_fr: 'Appétit',
    options: [
      { score: 0, text: 'لم يطرأ أي تغيير على شهيتي المعتادة.' },
      { score: 1, text: 'شهيتي أقل أو أكثر قليلاً من المعتاد.' },
      { score: 2, text: 'شهيتي للطعام أقل بكثير أو أكثر بكثير من المعتاد.' },
      { score: 3, text: 'ليس لدي أي شهية للطعام على الإطلاق، أو أتناول الطعام باستمرار دون توقف.' },
    ],
  },
  {
    id: 19,
    title_ar: '19. صعوبات التركيز (Concentration)',
    title_fr: 'Concentration',
    options: [
      { score: 0, text: 'أستطيع التركيز بشكل جيد كالمعتاد.' },
      { score: 1, text: 'لا أستطيع التركيز بنفس جودة السابق.' },
      { score: 2, text: 'من الصعب جداً علي التركيز على أي شيء لفترة طويلة.' },
      { score: 3, text: 'أعجز تماماً عن التركيز على أي نشاط أو حديث.' },
    ],
  },
  {
    id: 20,
    title_ar: '20. التعب والإرهاق الجسدي (Fatigue)',
    title_fr: 'Fatigue',
    options: [
      { score: 0, text: 'لست متعباً أو منهكاً أكثر من المعتاد.' },
      { score: 1, text: 'أتعب بسهولة أكبر من السابق.' },
      { score: 2, text: 'أنا متعب جداً ومرهق لدرجة تعيقني عن القيام بأنشطتي.' },
      { score: 3, text: 'أنا متعب ومرهق للغاية لدرجة العجز عن القيام بأي عمل.' },
    ],
  },
  {
    id: 21,
    title_ar: '21. فقدان الرغبة والاهتمام الحميمي (Libido / Intérêt)',
    title_fr: 'Libido / Intérêt',
    options: [
      { score: 0, text: 'لم يطرأ أي تغيير على اهتمامي المعتاد.' },
      { score: 1, text: 'أنا أقل اهتماماً بالجانب الحميمي من السابق.' },
      { score: 2, text: 'اهتمامي قل بشكل ملحوظ وشديد.' },
      { score: 3, text: 'فقدت كل اهتمامي ورغبتي تماماً وبشكل كلي.' },
    ],
  },
];

export default function InteractiveAssessmentRunner({ 
  testCode = 'WISC_V', 
  patientId = null, 
  initialPatientId = null,
  patientName = null, 
  patients = [],
  tenant = null,
  onClose = null, 
  onSaved = null 
}) {
  const [internalPatients, setInternalPatients] = useState([]);

  useEffect(() => {
    if (!patients || patients.length === 0) {
      patientApi.list({ per_page: 100 })
        .then(res => {
          const list = res.patients?.data || res.patients || res.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setInternalPatients(list);
          }
        })
        .catch(err => console.warn('Could not load patients in InteractiveAssessmentRunner:', err));
    }
  }, []);

  const effectivePatients = useMemo(() => {
    if (patients && patients.length > 0) return patients;
    if (internalPatients.length > 0) return internalPatients;
    return [DEFAULT_DEMO_PATIENT, DEFAULT_DEMO_PATIENT_2];
  }, [patients, internalPatients]);

  const targetPatientId = patientId || initialPatientId || (effectivePatients.length > 0 ? effectivePatients[0].id : DEFAULT_DEMO_PATIENT.id);
  const cleanCode = (testCode || '').toUpperCase().replace(/[\-_]/g, '');

  if (['PHQ9', 'PHQ', 'GAD7', 'GAD', 'CARS2', 'CARS', 'HAMA', 'HAMD', 'PCL5', 'YBOCS', 'SNAPIV', 'SNAP4', 'DASS21', 'SPIN', 'PDSSSR', 'ISI', 'ASRS', 'AQ10', 'PSS10', 'RSES', 'SSI4', 'SSI', 'MMPI2', 'MMPI'].includes(cleanCode)) {
    return (
      <InteractiveTestPassationModal
        test={{ code: testCode, title_ar: testCode, title_fr: testCode }}
        patients={effectivePatients}
        initialPatientId={targetPatientId}
        patientId={targetPatientId}
        patientName={patientName}
        tenant={tenant}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['WISCV', 'WISC'].includes(cleanCode)) {
    return (
      <WiscRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['ALOUETTER', 'ALOUETTE', 'ALOUR', 'ALOU'].includes(cleanCode)) {
    return (
      <AlouetteRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['MCHAT', 'MCHATR'].includes(cleanCode)) {
    return (
      <MchatRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['VINELANDII', 'VINELAND'].includes(cleanCode)) {
    return (
      <VinelandRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['CAT', 'FAT', 'RORSCHACH', 'PROJECTIVE_GRID'].includes((testCode || '').toUpperCase())) {
    return (
      <ProjectiveGridRunnerView
        testCode={(testCode || 'CAT').toUpperCase()}
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['DO80', 'DO_80', 'MT86', 'MT_86'].includes((testCode || '').toUpperCase())) {
    return (
      <Do80RunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['D2', 'STROOP', 'D2_STROOP', 'ATTENTION'].includes((testCode || '').toUpperCase())) {
    return (
      <D2StroopRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['STAI_Y', 'STAI', 'R_CMAS', 'RCMAS', 'ANXIETY'].includes((testCode || '').toUpperCase())) {
    return (
      <StaiRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['ZAREKI_R', 'ZAREKI', 'DYSCALCULIA'].includes((testCode || '').toUpperCase())) {
    return (
      <ZarekiRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['RAVEN_CPM', 'RAVEN_SPM', 'RAVEN', 'MATRICES'].includes((testCode || '').toUpperCase())) {
    return (
      <RavenRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['REY_FCR', 'REY', 'REY_FIGURE'].includes((testCode || '').toUpperCase())) {
    return (
      <ReyFigureRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['DESSIN_BONHOMME', 'DESSIN_FAMILLE', 'BONHOMME', 'DRAWING', 'PROJECTIVE_DRAWING'].includes((testCode || '').toUpperCase())) {
    return (
      <DrawingAssessmentRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['NEPSY_II', 'NEPSY', 'NEPSY2', 'NEUROPSYCH'].includes((testCode || '').toUpperCase())) {
    return (
      <NepsyRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['ADOS_2', 'ADOS', 'ADOS2'].includes((testCode || '').toUpperCase())) {
    return (
      <Ados2RunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['ADI_R', 'ADIR', 'ADI'].includes((testCode || '').toUpperCase())) {
    return (
      <AdirRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['L2MA', 'L2MA_R', 'DYSLEXIA_BATTERY'].includes((testCode || '').toUpperCase())) {
    return (
      <L2maRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['N_EEL', 'NEEL', 'EEL'].includes((testCode || '').toUpperCase())) {
    return (
      <NeelRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['CMS', 'CMS_MEMORY', 'CHILD_MEMORY'].includes((testCode || '').toUpperCase())) {
    return (
      <CmsMemoryRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['MEM_IV', 'MEM4', 'WMS_IV', 'WMS4', 'ADULT_MEMORY'].includes((testCode || '').toUpperCase())) {
    return (
      <Mem4RunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['BECS', 'BECS_R', 'EARLY_COGNITIVE'].includes((testCode || '').toUpperCase())) {
    return (
      <BecsRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['CSBS', 'CSBS_DP', 'COMMUNICATION_SYMBOLIC'].includes((testCode || '').toUpperCase())) {
    return (
      <CsbsRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['ECHA', 'ECAA', 'ECHA_ECAA', 'BEHAVIOR', 'AGGRESSION'].includes((testCode || '').toUpperCase())) {
    return (
      <EchaEcaaRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['PATTE_NOIRE', 'PATTENOIRE', 'PN'].includes((testCode || '').toUpperCase())) {
    return (
      <PatteNoireRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['SCENO_TEST', 'SCENOTEST', 'SCENO'].includes((testCode || '').toUpperCase())) {
    return (
      <ScenoRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['TAT', 'TAT_SHENTOUB', 'THEMATIC_APPERCEPTION'].includes((testCode || '').toUpperCase())) {
    return (
      <TatRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['TMS', 'ECS', 'ECS_II_III', 'MATURITE_SCOLAIRE', 'SCHOOL_READINESS'].includes((testCode || '').toUpperCase())) {
    return (
      <TmsEcsRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['TRAUMAQ', 'TRAUMA_Q', 'TRAUMA', 'PTSD_SCALE'].includes((testCode || '').toUpperCase())) {
    return (
      <TraumaqRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['STR', 'CISS', 'STR_CISS', 'STRESS', 'COPING'].includes((testCode || '').toUpperCase())) {
    return (
      <StressCopingRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['WAIS', 'WAIS4', 'WAIS_IV', 'WECHSLER_ADULT'].includes((testCode || '').toUpperCase())) {
    return (
      <WaisRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['WPPSI', 'WPPSI4', 'WPPSI_IV', 'WECHSLER_PRESCHOOL'].includes((testCode || '').toUpperCase())) {
    return (
      <WppsiRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['O52', 'O_52', 'KHOMSI_O52', 'MORPHOSYNTAX'].includes((testCode || '').toUpperCase())) {
    return (
      <O52RunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  if (['VOCIM', 'PICTURE_VOCABULARY', 'VOCABULAIRE_IMAGE'].includes((testCode || '').toUpperCase())) {
    return (
      <VocimRunnerView
        patientId={patientId}
        patientName={patientName}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  const [testSchema, setTestSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  // ELO Specific State (Subtests 0-20, 0-20, 0-15, 0-10)
  const [eloScores, setEloScores] = useState({
    receptive_vocab: 16,
    expressive_vocab: 14,
    syntax_comprehension: 11,
    sentence_repetition: 8,
  });
  const [eloCalculation, setEloCalculation] = useState(null);

  // BDI-II Specific State (21 items, 0-3)
  const [bdiResponses, setBdiResponses] = useState(() => {
    const init = {};
    for (let i = 1; i <= 21; i++) init[i] = 0;
    return init;
  });
  const [bdiCalculation, setBdiCalculation] = useState(null);

  // Generic Subscale & Projective State
  const [subscaleScores, setSubscaleScores] = useState({});
  const [projectiveObservations, setProjectiveObservations] = useState({});
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  const isElo = (testCode || '').toUpperCase() === 'ELO';
  const isBdi = (testCode || '').toUpperCase() === 'BDI_II' || (testCode || '').toUpperCase() === 'BDI';

  useEffect(() => {
    fetchSchema();
    if (!patientId) fetchPatients();
  }, [testCode, patientId]);

  useEffect(() => {
    if (isElo) recomputeElo();
  }, [eloScores, isElo]);

  useEffect(() => {
    if (isBdi) recomputeBdi();
  }, [bdiResponses, isBdi]);

  const fetchPatients = async () => {
    try {
      const resp = await patientApi.list({ per_page: 100 });
      const pts = resp.patients?.data || resp.patients || resp.data || [];
      const list = pts.length > 0 ? pts : effectivePatients;
      setPatientsList(list);
      if (list.length > 0 && !selectedPatientId) {
        setSelectedPatientId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to load patients:', e);
      setPatientsList(effectivePatients);
      if (effectivePatients.length > 0 && !selectedPatientId) {
        setSelectedPatientId(effectivePatients[0].id);
      }
    }
  };

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const resp = await clinicalTestApi.getSchema(testCode);
      if (resp && resp.test) {
        setTestSchema(resp.test);
        initializeState(resp.test);
      }
    } catch (e) {
      console.error('Failed to load test schema:', e);
    } finally {
      setLoading(false);
    }
  };

  const initializeState = (schema) => {
    if (isElo) {
      recomputeElo();
      return;
    }
    if (isBdi) {
      recomputeBdi();
      return;
    }

    const payload = schema.items_payload || {};
    const initialScores = {};

    if (payload.subtests) {
      payload.subtests.forEach((st) => {
        initialScores[st.id] = {
          name: st.name_ar,
          raw: Math.round((st.max_score || 20) * 0.75),
          max: st.max_score || 20,
        };
      });
    } else if (payload.indices) {
      payload.indices.forEach((idx) => {
        initialScores[idx.code] = {
          name: idx.name_ar,
          raw: 100,
          max: 160,
        };
      });
    } else if (payload.subscales) {
      payload.subscales.forEach((sc) => {
        initialScores[sc.id] = {
          name: sc.name_ar,
          raw: Math.round((sc.max_score || 27) * 0.3),
          max: sc.max_score || 27,
        };
      });
    }

    setSubscaleScores(initialScores);
    setClinicalNotes(
      `أظهرت نتائج تطبيق مقياس (${schema.name_ar}) أداءً سريرياً متوافقاً مع المرحلة النمائية مع تسجيل مؤشرات تقتضي المتابعة.`
    );
  };

  const recomputeElo = async () => {
    try {
      const resp = await clinicalTestApi.runElo({
        receptive_vocab_score: eloScores.receptive_vocab,
        expressive_vocab_score: eloScores.expressive_vocab,
        syntax_comprehension_score: eloScores.syntax_comprehension,
        sentence_repetition_score: eloScores.sentence_repetition,
      });
      setEloCalculation(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('ELO calculation error:', e);
    }
  };

  const recomputeBdi = async () => {
    try {
      const resp = await clinicalTestApi.runBdi({
        responses: bdiResponses,
      });
      setBdiCalculation(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('BDI calculation error:', e);
    }
  };

  const handleEloChange = (subtestKey, value) => {
    setEloScores((prev) => ({
      ...prev,
      [subtestKey]: Number(value),
    }));
  };

  const handleBdiOptionSelect = (itemIndex, score) => {
    setBdiResponses((prev) => ({
      ...prev,
      [itemIndex]: score,
    }));
    soundEngine.playTone(440 + score * 80, 0.08);
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط تقييم الفحص بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      let payload = {};

      if (isElo) {
        payload = {
          test_code: 'ELO',
          calculated_total_score: eloCalculation?.total_score || 49,
          subscale_scores: {
            receptive_vocab: { name: 'المفردات الاستقبالية', raw: eloScores.receptive_vocab, max: 20 },
            expressive_vocab: { name: 'التسمية والإنتاج اللفظي', raw: eloScores.expressive_vocab, max: 20 },
            syntax_comprehension: { name: 'الفهم التركيبي للجمل', raw: eloScores.syntax_comprehension, max: 15 },
            sentence_repetition: { name: 'إعادة إنتاج الجمل', raw: eloScores.sentence_repetition, max: 10 },
          },
          raw_responses: eloScores,
          notes: clinicalNotes,
        };
      } else if (isBdi) {
        payload = {
          test_code: 'BDI_II',
          calculated_total_score: bdiCalculation?.total_score || 0,
          subscale_scores: {
            total_bdi: { name: 'مجموع بيك للاكتئاب', raw: bdiCalculation?.total_score || 0, max: 63 },
            suicide_item: { name: 'بند الأفكار الانتحارية (9)', raw: bdiResponses[9] || 0, max: 3 },
          },
          raw_responses: bdiResponses,
          notes: clinicalNotes,
        };
      } else {
        payload = {
          test_code: testCode,
          calculated_total_score: Object.values(subscaleScores).reduce((acc, v) => acc + (Number(v.raw) || 0), 0),
          subscale_scores: subscaleScores,
          projective_observations: projectiveObservations,
          raw_responses: subscaleScores,
          notes: clinicalNotes,
        };
      }

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم الاختبار');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold">جاري تحميل بروتوكول الاختبار السريري والمعايير المقننة...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                {isElo ? 'اختبار تقييم اللغة الشفهية (ELO - خومسي)' : isBdi ? 'مقياس بيك للاكتئاب (BDI-II - 21 بنود)' : testSchema?.name_ar}
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {testCode}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isElo
                ? 'المرجع القياسي لتقييم الرصيد اللغوي والفهم والإنتاج التركيبي للأطفال (3 إلى 8 سنوات).'
                : isBdi
                ? 'المقياس المعتمد عالمياً لتقييم حدة الاكتئاب مع رصد فوري للخطورة الانتحارية.'
                : testSchema?.short_desc_ar}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!savedAssessment ? (
        <form onSubmit={handleSaveSession} className="space-y-6">
          {/* Patient Selection Bar */}
          {!patientId && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300">
                <User className="w-4 h-4 text-indigo-400" />
                <span>ربط الفحص بملف المريض:</span>
              </div>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- اختر مريضاً من العيادة --</option>
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.phone || '--'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ==================================================== */}
          {/* DEDICATED RUNNER 1: ELO (Langage Oral - A. Khomsi)   */}
          {/* ==================================================== */}
          {isElo && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Receptive Vocab */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-300 flex items-center space-x-1.5 space-x-reverse">
                      <span>1. المفردات الاستقبالية (Désignation)</span>
                      <button
                        type="button"
                        onClick={() => soundEngine.speak('أشر إلى صورة التفاحة والسيارة', 'ar')}
                        className="text-slate-400 hover:text-teal-300 p-1"
                        title="استماع للتعليمة"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                    <span className="font-mono text-teal-400 font-black text-sm">
                      {eloScores.receptive_vocab} / 20
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={eloScores.receptive_vocab}
                    onChange={(e) => handleEloChange('receptive_vocab', e.target.value)}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0: عجز تام</span>
                    <span>10: متوسط</span>
                    <span>20: إتقان تام</span>
                  </div>
                </div>

                {/* 2. Expressive Vocab */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 flex items-center space-x-1.5 space-x-reverse">
                      <span>2. التسمية والإنتاج اللفظي (Dénomination)</span>
                      <button
                        type="button"
                        onClick={() => soundEngine.speak('ما اسم هذا الشيء الذي تراه في الصورة؟', 'ar')}
                        className="text-slate-400 hover:text-sky-300 p-1"
                        title="استماع للتعليمة"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                    <span className="font-mono text-sky-400 font-black text-sm">
                      {eloScores.expressive_vocab} / 20
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={eloScores.expressive_vocab}
                    onChange={(e) => handleEloChange('expressive_vocab', e.target.value)}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0: عجز تسمية</span>
                    <span>10: متوسط</span>
                    <span>20: طلاقة معجمية</span>
                  </div>
                </div>

                {/* 3. Syntax Comprehension */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5 space-x-reverse">
                      <span>3. الفهم التركيبي للجمل (Syntaxe)</span>
                      <button
                        type="button"
                        onClick={() => soundEngine.speak('الولد الذي يركض يتبعه الكلب الصغير', 'ar')}
                        className="text-slate-400 hover:text-indigo-300 p-1"
                        title="استماع للتعليمة"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                    <span className="font-mono text-indigo-400 font-black text-sm">
                      {eloScores.syntax_comprehension} / 15
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={eloScores.syntax_comprehension}
                    onChange={(e) => handleEloChange('syntax_comprehension', e.target.value)}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0: التباس تركيبي</span>
                    <span>7: متوسط</span>
                    <span>15: فهم تام للتراكيب</span>
                  </div>
                </div>

                {/* 4. Sentence Repetition */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center space-x-1.5 space-x-reverse">
                      <span>4. إعادة إنتاج الجمل (Répétition)</span>
                      <button
                        type="button"
                        onClick={() => soundEngine.speak('أعد نفس الجملة بدقة وبنفس الترتيب', 'ar')}
                        className="text-slate-400 hover:text-purple-300 p-1"
                        title="استماع للتعليمة"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                    <span className="font-mono text-purple-400 font-black text-sm">
                      {eloScores.sentence_repetition} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={eloScores.sentence_repetition}
                    onChange={(e) => handleEloChange('sentence_repetition', e.target.value)}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0: حذف وتشويش</span>
                    <span>5: متوسط</span>
                    <span>10: تكرار دقيق وسليم</span>
                  </div>
                </div>
              </div>

              {/* Real-time ELO Developmental Indices Banner */}
              {eloCalculation && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-indigo-950/40 border border-teal-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">الدرجة الإجمالية:</span>
                    <strong className="text-base font-black font-mono text-teal-300">
                      {eloCalculation.total_score} / 65
                    </strong>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">الرتبة المئينية (Percentile):</span>
                    <strong className="text-base font-black font-mono text-sky-300">
                      {eloCalculation.percentile}%
                    </strong>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">العمر اللغوي النمائي:</span>
                    <strong className="text-base font-black font-mono text-indigo-300">
                      {eloCalculation.developmental_age_years} سنة
                    </strong>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">التصنيف السريري:</span>
                    <strong className={`text-xs font-bold ${
                      eloCalculation.severity === 'normal' ? 'text-emerald-400' : eloCalculation.severity === 'moderate' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {eloCalculation.severity === 'normal' ? 'سليم' : eloCalculation.severity === 'moderate' ? 'هشاشة نمائية' : 'تأخر حاد'}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* DEDICATED RUNNER 2: BDI-II (Beck Depression 21 Items) */}
          {/* ==================================================== */}
          {isBdi && (
            <div className="space-y-4">
              {/* Sticky Summary Bar with Critical Suicide Item 9 Alert */}
              <div className="sticky top-2 z-30 p-4 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-black text-sm">
                    {bdiCalculation?.total_score || 0} / 63
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">مجموع الاكتئاب الحالي (BDI-II):</span>
                    <strong className={`text-xs font-black ${
                      (bdiCalculation?.total_score || 0) >= 29
                        ? 'text-rose-400'
                        : (bdiCalculation?.total_score || 0) >= 20
                        ? 'text-amber-400'
                        : (bdiCalculation?.total_score || 0) >= 14
                        ? 'text-yellow-300'
                        : 'text-emerald-400'
                    }`}>
                      {bdiCalculation?.severity_label_ar || 'طبيعي / حد أدنى'}
                    </strong>
                  </div>
                </div>

                {/* Suicide Risk Alert Banner */}
                {bdiCalculation?.suicide_risk && (
                  <div className="px-3.5 py-2 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center space-x-2 space-x-reverse animate-pulse">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <span>⚠️ تنبيه: إيجابية بند الأفكار الانتحارية ({bdiCalculation.item_9_suicide_score}/3) - يلزم تفعيل بروتوكول الحماية!</span>
                  </div>
                )}
              </div>

              {/* 21 Interactive Clinical Items */}
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {BDI_21_ITEMS.map((item) => {
                  const currentScore = bdiResponses[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.isCritical && currentScore > 0
                          ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-500/5'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-white mb-2.5 flex items-center justify-between">
                        <span>{item.title_ar}</span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md">
                          الدرجة: {currentScore}
                        </span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.options.map((opt) => (
                          <button
                            key={opt.score}
                            type="button"
                            onClick={() => handleBdiOptionSelect(item.id, opt.score)}
                            className={`p-2.5 rounded-xl text-right text-xs font-medium transition-all flex items-start space-x-2 space-x-reverse ${
                              currentScore === opt.score
                                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white border border-slate-800/80'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-[10px] ${
                              currentScore === opt.score
                                ? 'bg-white text-indigo-600 border-white'
                                : 'border-slate-600'
                            }`}>
                              {opt.score}
                            </span>
                            <span className="flex-1 leading-snug">{opt.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* GENERIC TEST FALLBACK (Sliders & Projective)          */}
          {/* ==================================================== */}
          {!isElo && !isBdi && Object.keys(subscaleScores).length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-indigo-300 flex items-center space-x-1.5 space-x-reverse">
                <Sliders className="w-4 h-4" />
                <span>تسجيل الدرجات في الاختبارات الفرعية والأبعاد:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {Object.entries(subscaleScores).map(([key, val]) => (
                  <div key={key} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{val.name}</span>
                      <span className="font-mono text-indigo-400 font-black text-sm">{val.raw}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={val.max || 100}
                      value={val.raw}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSubscaleScores((prev) => ({ ...prev, [key]: { ...prev[key], raw: Number(v) } }));
                      }}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Synthesis Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتشخيص السيكومتري (Synthèse & Bilan Clinique):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => initializeState(testSchema || {})}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs shadow-xl shadow-indigo-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ التقييم السريري...' : 'اعتماد التقييم وحفظ الجلسة 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* SUCCESS CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORTER */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم اعتماد وحفظ نتائج التقييم السريري بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم توثيق النتائج وحساب المؤشرات المعيارية وربط التقرير بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">الدرجة المحققة:</span>
              <strong className="text-white text-sm font-mono">
                {savedAssessment.total_score ?? (savedAssessment.score ?? 0)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التصنيف السريري:</span>
              <span className="text-emerald-400 font-bold">
                {savedAssessment.severity_level || 'طبيعي'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">تاريخ الاعتماد:</span>
              <span className="text-white font-mono">{new Date().toLocaleDateString('ar-DZ')}</span>
            </div>
          </div>

          {/* 1-Click Printable Bilan PDF A4 Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={clinicalTestApi.bilanPdfUrl(savedAssessment.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 space-x-reverse transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>📄 طباعة الحصيلة السريرية Bilan A4 (Télécharger PDF) 🖨️</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setSavedAssessment(null);
                initializeState(testSchema || {});
              }}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center space-x-1.5 space-x-reverse transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تطبيق فحص جديد</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
