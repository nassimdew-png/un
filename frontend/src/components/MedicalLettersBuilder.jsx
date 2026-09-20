import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Printer,
  Sparkles,
  Download,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Edit3,
  Building2,
  Lock,
  Copy,
  Check,
  User,
  Phone,
  MapPin,
  Calendar,
  Stethoscope,
  Languages,
  Globe,
  Scale,
  GraduationCap,
  School,
  Briefcase,
  Layers,
  Save,
  Trash2,
  Eye,
  RefreshCw,
  Clock,
  ExternalLink,
  Send,
  Search,
  CheckSquare,
  AlertCircle,
  X,
  Share2
} from 'lucide-react';
import { patientApi, whatsappApi } from '../api';
import DigitalSignaturePadModal from './common/DigitalSignaturePadModal';

export default function MedicalLettersBuilder({ 
  patient, 
  tenant, 
  practitioner, 
  isModal = false, 
  onClose = null, 
  onDocumentSaved = null 
}) {
  const [letterLang, setLetterLang] = useState('ar'); // 'ar' | 'fr'
  const [activeCategory, setActiveCategory] = useState('certificates'); // 'certificates' | 'institutional' | 'medical' | 'custom'
  const [letterType, setLetterType] = useState('work_cessation');
  const [content, setContent] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');

  // Archive & Saving State
  const [archive, setArchive] = useState([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customToken, setCustomToken] = useState(null);
  const [loadedRecordId, setLoadedRecordId] = useState(null);
  const [sendingWa, setSendingWa] = useState(false);
  const [waSentSuccess, setWaSentSuccess] = useState(false);

  // Digital Signature & Stamp from localStorage or state
  const [signatureData, setSignatureData] = useState(() => localStorage.getItem('clinic_practitioner_signature') || null);
  const [stampData, setStampData] = useState(() => localStorage.getItem('clinic_practitioner_stamp') || null);
  const [licenseNumber, setLicenseNumber] = useState(() => localStorage.getItem('clinic_practitioner_license') || 'DZ-MSP-77492-MED');

  const patientName = `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || (letterLang === 'ar' ? 'المريض(ة)' : 'Le/La Patient(e)');
  const dateStr = new Date().toLocaleDateString('fr-FR');
  
  // Format Birth Date to clean DD/MM/YYYY
  const formatBirthDate = (rawDate) => {
    if (!rawDate) return '---';
    try {
      const clean = String(rawDate).split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return clean;
    } catch {
      return String(rawDate).split('T')[0];
    }
  };
  const formattedBirthDate = formatBirthDate(patient?.birth_date);

  // Calculate Patient Age in Arabic and French
  const calculateAgeAr = (birthDate) => {
    if (!birthDate) return '';
    try {
      const diff = Date.now() - new Date(birthDate).getTime();
      const ageDate = new Date(diff);
      const years = Math.abs(ageDate.getUTCFullYear() - 1970);
      return years > 0 ? `${years} سنة` : 'أقل من سنة';
    } catch {
      return '';
    }
  };

  const calculateAgeFr = (birthDate) => {
    if (!birthDate) return '';
    try {
      const diff = Date.now() - new Date(birthDate).getTime();
      const ageDate = new Date(diff);
      const years = Math.abs(ageDate.getUTCFullYear() - 1970);
      return years > 0 ? `${years} ans` : 'Moins d\'un an';
    } catch {
      return '';
    }
  };

  const patientAge = letterLang === 'ar' ? calculateAgeAr(patient?.birth_date) : calculateAgeFr(patient?.birth_date);
  const patientGender = letterLang === 'ar' 
    ? (patient?.gender === 'female' ? 'أنثى' : 'ذكر')
    : (patient?.gender === 'female' ? 'Féminin' : 'Masculin');
    
  const fileNumber = patient?.file_number || patient?.id || 'P-' + Math.floor(1000 + Math.random() * 9000);
  const guardianName = patient?.guardian_name || patient?.parent_name || (letterLang === 'ar' ? 'الولي الشرعي' : 'Représentant Légal');

  // Unique Verification Token for this document
  const verificationToken = useMemo(() => {
    if (customToken) return customToken;
    const pId = patient?.id || '88';
    return `DOC-CERT-${pId}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }, [patient?.id, letterType, letterLang, customToken]);

  const verificationUrl = `https://psypro.tech/verify/doc/${verificationToken}`;

  // Complete Standardized Algerian & Arab Clinical Templates Bank
  const templates = useMemo(() => ({
    ar: {
      // 1. CLINICAL MEDICAL CERTIFICATES & ATTESTATIONS
      work_cessation: `الجمهورية الجزائرية الديمقراطية الشعبية
شهادة توقف عن العمل وراحة مرضية (Certificat d'Arrêt de Travail & Repos Médical)

يشهد الأخصائي(ة): ${practitioner?.name || 'الأخصائي المعالج'}
المعتمد(ة) بعيادة: ${tenant?.name || 'العيادة التخصصية في الطب النفسي والتأهيل'} (رقم القيد: ${licenseNumber})

أن المريض(ة): ${patientName}
المولود(ة) بتاريخ: ${formattedBirthDate} | السن: ${patientAge || '--'} | رقم الملف: ${fileNumber}
والذي قمنا بفحصه(ا) عيادياً ونفسياً اليوم بالعيادة،

تستوجب حالته(ا) الصحية والنفسية الراهنة الاستفادة من راحة مرضية وتوقف تام عن العمل لمدة: [ 07 سبعة أيام ]
ابتداءً من تاريخ: ${dateStr}
إلى غاية تاريخ: [تاريخ نهاية العطلة المرضية] (شاملة لليوم الأخير).

مع الالتزام بالبرنامج العلاجي والمتابعة السريرية المقررة بالعيادة لتثبيت التحسن.

سلمت هذه الشهادة للمعني(ة) بالأمر للإدلاء بها لدى هيئات الضمان الاجتماعي والمشغل في حدود ما يقره القانون.`,

      clinical_constat: `شهادة معاينة وفحص سريري أولي (Certificat Médical Initial / Constat Clinique)

يشهد الأخصائي(ة): ${practitioner?.name || 'الأخصائي المعالج'}
المعتمد(ة) بعيادة: ${tenant?.name || 'العيادة التخصصية'} (رقم القيد: ${licenseNumber})

أنه بعد الفحص والمقابلة العيادية المباشرة للمعني(ة) بالأمر:
• الاسم واللقب: ${patientName}
• تاريخ الميلاد: ${formattedBirthDate} (السن: ${patientAge || '--'}) | ملف رقم: ${fileNumber}

تمت معاينة المؤشرات والأعراض السريرية التالية:
1. الحالة الانفعالية والوجدانية: تسجيل توتر وقلق تفاعلي حاد مع أعراض إنهاك عصبي واضطراب في النوم.
2. الكفاءة المعرفية والوظيفية: وعي تام بالزمان والمكان والأشخاص، مع تراجع في التركيز والقدرة على مواجهة الضغوط اليومية.
3. التوجيه والمتابعة: تستدعي الحالة التكفل النفسي والعيادي المنتظم مع تطبيق تقنيات الدعم المتخصصة وإعادة التقييم.

سلمت هذه الشهادة بطلب من المعني(ة) / وليه الشرعي لإثبات المعاينة السريرية في حدود القوانين الطبية الجاري العمل بها.`,

      presence: `شهادة متابعة وتكفل عيادي منتظم (Attestation de Suivi & Présence)

يشهد الأخصائي(ة): ${practitioner?.name || 'الأخصائي المعالج'}
المعتمد(ة) بعيادة: ${tenant?.name || 'العيادة التخصصية'} (رقم القيد: ${licenseNumber})

أن المريض(ة): ${patientName}
تاريخ الميلاد: ${formattedBirthDate} | ملف رقم: ${fileNumber}

يتابع لدينا جلسات فحص وتأهيل نفسي / أرطوفوني / حركي بانتظام، بمعدل [حصتين أسبوعياً]، منذ تاريخ [بداية المتابعة] وحتى تاريخ اليوم ${dateStr}.

وتتطلب حالته الاستمرار في المتابعة العلاجية والتأهيلية لضمان استقرار التحسن وتحقيق أهداف الخطة العلاجية المسطرة (PEI).

سلمت هذه الشهادة للمعني(ة) بالأمر / وليه الشرعي للإدلاء بها لدى صناديق الضمان الاجتماعي والمؤسسات المعنية.`,

      companion_permit: `رخصة مرافقة طبية عائلية (Autorisation d'Accompagnement Médical)

يشهد الأخصائي(ة): ${practitioner?.name || 'الأخصائي المعالج'}
المعتمد(ة) بعيادة: ${tenant?.name || 'العيادة التخصصية'}

أن الطفل(ة) / المريض(ة): ${patientName}
المولود(ة) بتاريخ: ${formattedBirthDate} | ملف رقم: ${fileNumber}

يستفيد من حصص تكفل وتأهيل عيادي مكثف في عيادتنا. ونظراً لخصوصية الحالة وسنه، فإن حضوره للجلسات يستلزم وجوباً مرافقة أحد الوالدين: السيد(ة) ${guardianName}.

نلتمس من الهيئة المشغلة للولي التكرم بتسهيل حضوره ومرافقته للمريض في المواعيد المحددة أسبوعياً (أيام [تحديد الأيام والساعات]).

سلمت هذه الشهادة بطلب من الولي لتبرير فترات المرافقة الطبية النظامية.`,

      care_completion: `شهادة انتهاء التكفل واستقرار الحالة (Certificat de Fin de Prise en Charge / Consolidation)

يشهد الأخصائي(ة): ${practitioner?.name || 'الأخصائي المعالج'}
المعتمد(ة) بعيادة: ${tenant?.name || 'العيادة التخصصية'}

أن المريض(ة): ${patientName} (ملف رقم: ${fileNumber})
الذي خضع لمتابعة وتأهيل عيادي متخصص منذ [تاريخ البدء] إلى [تاريخ الانتهاء]،

قد استكمل بنجاح أهداف مشروعه العلاجي الفردي المسطر (PEI) وأظهر استقراراً ونضجاً سريرياً ممتازاً في:
1. الوظائف التواصلية والنفسية والانفعالية المستهدفة.
2. التكيف التام مع متطلبات الحياة اليومية والبيئة الأسرية والمدرسية.

وبناءً عليه، تقرر إنهاء التكفل النظامي بالعيادة مع إمكانية المراجعة التقييمية بعد [6 أشهر] عند الضرورة.

سلمت هذه الشهادة للإدلاء بها واستخدامها فيما يسمح به القانون.`,

      home_prescription: `وصفة وبروتوكول التأهيل والتمارين المنزلية (Prescription Thérapeutique à Domicile)

المريض(ة): ${patientName} | ملف رقم: ${fileNumber} | التاريخ: ${dateStr}
الأخصائي المشرف: ${practitioner?.name || 'الأخصائي المعالج'}

المحاور والتمارين العلاجية الموصى بها للأسرة والمريض:
1. تمارين التنفس والاسترخاء:
   • تطبيق تمرين التنفس البطني الهادئ (4 ثوانٍ شهيق - 4 ثوانٍ زفير) مرتين يومياً صباحاً ومساءً لمدة 5 دقائق.
2. الأنشطة التعبيرية والفونولوجية:
   • ممارسة التسمية والوصف القصصي التفاعلي بدون شاشات لمدة 15 دقيقة يومياً.
   • استخدام أسلوب التكرار الإيجابي والتعزيز الفوري عند كل إنجاز.
3. التوجيهات السلوكية والبيئية:
   • تثبيت روتين النوم والاستيقاظ والتقليل الصارم من الشاشات الرقمية والألعاب الإلكترونية.
   • توفير بيئة هادئة ومحفزة على الاستقلالية والتعبير عن المشاعر بأمان.

الموعد القادم للمتابعة وتقييم النتائج: [تاريخ الموعد القادم].`,

      // 2. INSTITUTIONAL & SCHOOL REPORTS (PAI)
      school_adaptation: `المؤسسة التعليمية / الطاقم التربوي المحترم
إلى السيد(ة) مدير(ة) المؤسسة ومستشار(ة) التوجيه والإرشاد المدرسي

الموضوع: مذكرة التكييف البيداغوجي وتكييف القسم (Projet d'Accueil Individualisé - PAI)
• بخصوص التلميذ(ة): ${patientName}
• المستوى الدراسي: [المستوى] | تاريخ الميلاد: ${formattedBirthDate}

بناءً على نتائج التقييم العيادي والنفسي العصبي للتلميذ(ة)، نوصي الفريق التربوي باتخاذ التدابير والمواءمات البيداغوجية التالية داخل القسم:
1. التموضع داخل القسم: الجلوس في الصف الأول في موضع قريب من المعلم وبعيد عن المشتتات البصرية كالنوافذ والأبواب.
2. إدارة الامتحانات والفروض: منح وقت إضافي (ثلث الوقت Tiers-temps) أثناء الاختبارات الكتابية لتخفيف التوتر الانفعالي.
3. التقييم الشفهي: تشجيع التلميذ وتفادي إلزامه بالقراءة الجهرية المفاجئة أمام زملائه دون تحضير مسبق لتعزيز ثقته بنفسه.
4. تجزئة التعليمات: صياغة الأسئلة والتعليمات المركبة في خطوات بسيطة وواضحة والتأكد من استيعابه للمطلوب.
5. التحفيز الإيجابي: اعتماد التعزيز المستمر والسماح بفترات راحة وجيزة عند ملاحظة الإجهاد العصبي.

التعاون المشترك بين الطاقم التربوي والأسرة والأخصائي هو الركيزة الأساسية لنجاح التلميذ.`,

      court_justice: `إلى السيد(ة) المحترم(ة):
قاضي شؤون الأسرة / قاضي الأحداث / رئيس محكمة [اسم المحكمة] الموقر

الموضوع: تقرير تقييم وملاحظة نفسية عيادية رسمي (Rapport d'Évaluation Psychologique Médico-Légale)
• الإطار القضائي: [ملف رقم / دعوى شؤون الأسرة والحضانة / تقييم الأثر النفسي والمصلحة الفضلى للأبناء]

سيدي القاضي الموقر / سيدتي القاضية المحترمة،

بصفتنا أخصائيين في علم النفس العيادي، نرفع إلى عدالتكم الموقرة هذا التقرير النفسي المفصل بعد إجراء الفحوصات والمقابلات العيادية وتطبيق المقاييس السريرية المعتمدة لتقييم الحالة النفسية العامة للمعني(ة) بالأمر:

1. ظروف الفحص والمظهر العام (Cadre de l'Examen):
- تمت مقابلة المعني(ة) في جلسات فحص عيادية هادئة ومحايدة بالعيادة.
- المظهر العام: هندام لائق، تواصل لفظي وغير لفظي متزن ومنسجم، تحالف علاجي متعاون، ووعي تام بالزمان والمكان والأشخاص.

2. التاريخ النفسي والاجتماعي وسياق النزاع (Anamnèse & Contexte):
- تم استعراض المسار النمائي والبيئة الأسرية؛ تبيّن وجود ضغوطات نفسية وانفعالية ناجمة عن [نزاع أسري / خلاف حول الحضانة / واقعة صادمة].
- غياب أي سوابق اضطراب ذهاني أو سلوك عدواني غير منضبط، مع استقرار في التوازن الشخصي.

3. الفحص النفسي ونتائج الاختبارات المعيارية (Bilan Psychométrique & Clinique):
- تم تطبيق بطارية من المقاييس المعتمدة (مقياس الاتزان الانفعالي / مقياس الاكتئاب والقلق / المقابلة الإكلينيكية المعمقة):
  • السلامة العقلية: القدرات المعرفية والإدراكية سليمة، والقدرة على التمييز والتقدير كاملة (Capacité de discernement intacte).
  • الحالة الوجدانية: تسجيل توتر وقلق تفاعلي ظرفي دون وجود هلاوس أو ضلالات أو اضطراب في المزاج يفقده الأهلية.
  • بخصوص الحضانة ورعاية الأبناء: أظهر الفحص قدرة والدية عالية على التكفل الانفعالي وتوفير بيئة نفسية آمنة ومستقرة للأبناء.

4. الخلاصة السريرية وتوصيات الأخصائي (Conclusions & Recommandations):
- المعني(ة) يتمتع بكامل قواه العقلية واستقراره النفسي، ولا تظهر عليه أي علامات لقصور في الرعاية أو خطر نفسي على المحيطين به.
- نوصي بما يخدم المصلحة الفضلى وتجنيب المحيطين أي ضغوطات نزاعية حادة، مع الاستعداد لتقديم أي توضيحات تطلبها عدالتكم الموقرة.

حرر هذا التقرير عن حسن نية وبكامل التجرد والموضوعية العلمية وأخلاقيات المهنة ليُقدم إلى الجهات القضائية المختصة للإدلاء به في حدود ما يقتضيه القانون والعدالة.`,

      school_report: `إلى السيد(ة) مدير(ة) المؤسسة التعليمية: [اسم المدرسة / المتوسطة / الثانوية]
إلى السيد(ة) مستشار(ة) التوجيه والإرشاد المدرسي والطاقم التربوي المحترم

الموضوع: تقرير فحص نفسي ومعرفي وتوصيات الدعم والتكييف المدرسي (Bilan Psychologique Scolaire)
• بخصوص التلميذ(ة): ${patientName}
• المستوى / القسم الدراسي: [المستوى الدراسي]

تحية تربوية ومهنية خالصة وبعد،

بناءً على طلب ولي أمر التلميذ(ة) المذكور(ة) أعلاه، ومتابعةً للملاحظات المرفوعة حول تمدرسه، قمنا بإجراء فحص نفسي ومعرفي شامل بهدف تشخيص أسباب الصعوبات المدرسية وتحديد التيسيرات التربوية الملائمة.

1. دواعي التقييم والشكوى المدرسية:
- تراجع ملحوظ في التحصيل الدراسي مع صعوبة في الحفظ والتركيز ومتابعة الدروس المكتوبة داخل الصف.
- نوبات قلق وتوتر عند الامتحانات مع سرعة التشتت والشعور بالإحباط والانسحاب من المشاركة.

2. نتائج التقييم النفسي المعرفي (Bilan Cognitif):
- تم تطبيق اختبارات الذكاء المعرفي ومقاييس الانتباه والوظائف التنفيذية:
  • القدرات الفكرية العامة: تقع ضمن المعدل الطبيعي مع تباين في سرعة المعالجة والذاكرة العاملة.
  • أظهر الفحص وجود مؤشرات دالة على: [عسر قراءة/كتابة Dyslexie / اضطراب نقص الانتباه وفرط الحركة TDAH / قلق الأداء المدرسي].
  • لا توجد أي إعاقة ذهنية، والصعوبات الملاحظة قابلة للتجاوز بنجاح عبر المرافقة البيداغوجية المتفهمة.

3. التوصيات والتدابير البيداغوجية الموصى بها داخل القسم:
  أ) التموضع: الجلوس في المقاعد الأولى بالقرب من المعلم وبعيداً عن النوافذ والمشتتات البصرية.
  ب) إعطاء وقت إضافي (ثلث الوقت الإضافي Tiers-temps) في الفروض والامتحانات الكتابية لتقليل الضغط العصبي.
  ج) تفادي القراءة الجهرية الإلزامية المفاجئة أمام القسم لتجنب الإحراج وتعزيز الثقة بالنفس.
  د) تجزئة المهام المعقدة وتقديم تعليمات واضحة خطوة بخطوة مع تشجيع التحفيز الإيجابي المستمر.

شاكرين لسيادتكم وللطاقم التربوي حسن التعاون وحرصكم الدائم على المصلحة الفضلى للتلميذ.`,

      university_report: `إلى السيد(ة) عميد(ة) كلية: [اسم الكلية]
إلى السيد(ة) رئيس(ة) قسم: [القسم] / مصلحة الطب الوقائي الجامعي ولجنة الامتحانات المحترمين

الموضوع: تقرير تقييم نفسي وتوصيات التكييف الأكاديمي للامتحانات الجامعية (Aménagement Universitaire)
• بخصوص الطالب(ة): ${patientName}
• الكلية / التخصص: [التخصص الجامعي] | رقم التسجيل الجامعي: [رقم التسجيل]

تحية طيبة ومسؤولة وبعد،

نحيط سيادتكم علماً بأن الطالب(ة) المذكور(ة) أعلاه يتابع لدينا جلسات علاج ودعم نفسي عيادي منتظم، ونرفع إليكم هذا التقرير لتيسير متابعته للدراسة والامتحانات بما يتوافق مع حالته الصحية.

1. الحالة السريرية الحالية (État Clinique Actuel):
- يعاني الطالب(ة) من اضطراب نفسي تفاعلي حاد [اضطراب الهلع والقلق المعمم في الأماكن المغلقة / نوبات قلق حادة / متلازمة إجهاد واكتئاب].
- تؤدي هذه الأعراض إلى تدهور مفاجئ في التركيز وحدوث نوبات خفقان وضيق تنفس أثناء التواجد في مدرجات وقاعات الامتحانات المكتظة.

2. التدابير الأكاديمية والتيسيرات الموصى بها في الامتحانات:
- نلتمس من سيادتكم الكريمة التكرم بالموافقة على التدابير الاستثنائية التالية:
  أ) السماح بإجراء الامتحانات في قاعة هادئة أو شبه فردية لتقليل حدة المثيرات المسببة لنوبات الهلع.
  ب) منح وقت إضافي (ثلث الوقت الإضافي Tiers-temps) أثناء الامتحانات الكتابية.
  ج) السماح بأخذ فترات استراحة وجيزة (5 إلى 10 دقائق) والخروج لشرب الماء واستعادة الهدوء التنفسي عند الحاجة.
  د) تبرير الغيابات في الفترات الحادة من العلاج مع إتاحة فرصة إجراء امتحانات الاستدراك.

نؤكد لكم التزام الطالب التام ببرنامجه العلاجي وحرصه الشديد على مواصلة مساره الجامعي بنجاح، ونشكر لكم دعمكم الإنساني والتربوي.`,

      work_report: `إلى السيد(ة) طبيب العمل المحترم / اللجنة الطبية لتقييم العجز والتضامن الاجتماعي
إلى مصلحة تسيير الموارد البشرية بشركة: [اسم المؤسسة المشغلة]

الموضوع: تقرير تقييم نفسي وسريري لبيان اللياقة المهنية وملاءمة منصب العمل (Aptitude au Travail)
• بخصوص الموظف(ة): ${patientName}
• المنصب المهني الحالي: [المنصب / الوظيفة]

تحية مهنية وطبية خالصة وبعد،

نرفع إلى عنايتكم الطبية الموقرة هذا التقرير النفسي العيادي بخصوص الموظف(ة) المذكور(ة) أعلاه، وذلك بعد تقييم حالته السريرية وتأثيرها على ممارسته لمهامه المهنية اليومية:

1. التشخيص العيادي والأعراض الحالية:
- يعاني الموظف(ة) من حالة إنهاك نفسي ومهني حاد (Burnout Sévère) مصحوبة بأعراض اكتئابية واضطرابات في التركيز والذاكرة واضطراب في النوم.
- استمرار الضغوطات في بيئة العمل الحالية يعيق استجابته للعلاج النفسي ويهدد بانتكاسات صحية حادة.

2. التوصيات الطبية والمهنية:
- نلتمس من سيادتكم:
  أ) التوصية بفترة راحة وعطلة مرضية طويلة الأمد لتمكينه من استعادة توازنه النفسي والجسدي.
  ب) أو دراسة إمكانية تكييف شروط منصب العمل (تخفيف ساعات المناوبة، تقليل عبء العمل المباشر).
  ج) إعادة التموضع المهني (Reclassement) نحو منصب يتلاءم مع إمكانياته السريرية الراهنة.

شاكرين لسيادتكم حرصكم الدائم على صحة وسلامة العمال.`,

      // 3. SPECIALIZED MEDICAL REFERRALS
      pedopsychiatry: `إلى الزميل(ة) الدكتور(ة) المحترم(ة):
طبيب مختص في الأمراض العقلية للأطفال والمراهقين (Pédopsychiatre)

الموضوع: رسالة توجيه واستشارة سريرية متخصصة (Lettre d'Orientation Pédopsychiatrique)
• الحالة: الطفل(ة) ${patientName} | تاريخ الميلاد: ${formattedBirthDate}

زميلي العزيز / زميلتي العزيزة (Cher(e) Confrère)،

أوجه إليكم الطفل(ة) المذكور(ة) أعلاه، والذي يتابع لدينا جلسات فحص ومرافقة عيادية متخصصة، وذلك قصد طلب استشارتكم الطبية المتخصصة وتقييمكم السريري المعمق للحالة.

1. سبب التوجيه والشكوى السريرية (Motif d'Orientation):
- يشكو الولي والمدرسة من صعوبات سلوكية وانفعالية ملحوظة تؤثر بشكل مباشر على تمدرس الطفل وتوافقه الاجتماعي (تشتت انتباه، فرط نشاط، اندفاعية، نوبات غضب وقلق حاد).

2. الفحص العيادي والروائز المطبقة:
- أظهرت نتائج المقاييس مؤشرات دالة تتوافق مع شبهة [اضطراب قصور الانتباه وفرط الحركة TDAH / طيف التوحد TSA / قلق مدرسي حاد].

3. الاستشارة الطبية والتدخل المطلوب:
- نلتمس من سيادتكم التكرم بـ: تأكيد التشخيص الفارق، والنظر في مدى ملائمة إقرار علاج دوائي منظم بالتوازي مع استمرار التكفل النفسي والأرطوفوني لدينا.

تقبلوا منا فائق عبارات التقدير والاحترام والمودة الزميلية.`,

      adult_psychiatry: `إلى الزميل(ة) الدكتور(ة) المحترم(ة):
طبيب مختص في الأمراض العقلية والنفسية للراشدين (Psychiatre d'Adultes)

الموضوع: رسالة توجيه واستشارة سريرية متخصصة (Lettre d'Orientation Psychiatrique)
• المريض(ة): ${patientName} | تاريخ الميلاد: ${formattedBirthDate}

زميلي العزيز / زميلتي العزيزة (Cher(e) Confrère)،

أوجه إليكم المريض(ة) المذكور(ة) أعلاه، والذي يتابع لدينا حصص استشارة ودعم نفسي عيادي، وذلك قصد الاستئناس برأيكم الطبي التخصصي وإجراء فحص نفسي معمق.

1. سبب التوجيه والأعراض الحالية:
- تدهور تدريجي في الحالة المزاجية، نوبات هلع وقلق حاد (Attaques de Panique)، وأعراض اكتئابية واضطراب شديد في النوم أثرت على أدائه المهني والاجتماعي.
2. الفحص النفسي:
- مقياس بيك للاكتئاب BDI-II ومقياس القلق HAM-A أظهرا شدة متوسطة إلى مرتفعة، مع استبصار جيد ودافعية للعلاج وغياب أفكار إيذاء النفس النشطة.
3. الطلب السريري:
- نلتمس تقييمكم لضبط الخطة العلاجية الدوائية الملائمة بالتنسيق مع مواصلة جلسات العلاج المعرفي السلوكي (CBT) لدينا.

شاكرين لكم تعاونكم الطبي المستمر وتقبلوا أسمى عبارات التقدير.`,

      neuro_eeg: `إلى الزميل(ة) الدكتور(ة) المحترم(ة):
طبيب مختص في أمراض الأعصاب (Neurologue)

الموضوع: طلب استشارة عصبية وفحص تخطيط الدماغ (Demande d'Avis Neurologique & EEG)
• الحالة: ${patientName} | تاريخ الميلاد: ${formattedBirthDate}

زميلي العزيز (Cher Confrère)،

أوجه إليكم الحالة المذكورة أعلاه لإجراء فحص عصبي سريري شامل مع إجراء تخطيط كهربية الدماغ (EEG)، وذلك لـ:
1. استبعاد أي نشاط صرعي بؤري كامن (Épilepsie infra-clinique) مصاحب لتراجع المكتسبات اللغوية والتركيز.
2. تقييم نوبات الغياب الذهني المفاجئة والتوافق العصبي الحركي العام.

نلتمس منكم إفادتنا بنتائج الفحص وتقرير الـ EEG لتوجيه البرنامج التأهيلي بدقة.

تقبلوا خالص التقدير والمودة الزميلية.`,

      orl_audio: `إلى السيد(ة) الدكتور(ة) المحترم(ة):
طبيب مختص في أمراض الأنف والأذن والحنجرة (ORL)

الموضوع: طلب فحص أنف وأذن وحنجرة وتخطيط سمعي (Bilan ORL & Audiométrie)
• الحالة: ${patientName} | تاريخ الميلاد: ${formattedBirthDate}

حضرة الزميل المحترم،

نحيطكم علماً بأن الحالة تتابع لدينا حصص تقييم وتأهيل أرطوفوني بسبب [تأخر في النمو اللغوي / اضطراب في النطق ومخارج الحروف].
نلتمس من سيادتكم الكريمة:
1. فحص أعضاء النطق والجهاز الصوتي وسلامة طبلة الأذن وفحص لجام اللسان.
2. إجراء قياس السمع النغمي واللفظي وفحص ضغط الأذن الوسطى (Tympanométrie) لنفي أي نقص سمعي توصيلي أو إدراكي يعيق الاكتساب اللغوي.

شاكرين لكم حسن التعاون الطبي المستمر.`,

      psychomotricite: `إلى الزميل(ة) الأخصائي(ة) في التأهيل الحركي / العلاج الوظيفي (Psychomotricien / Ergothérapeute)

الموضوع: رسالة توجيه واستشارة للتأهيل النفسي الحركي والوظيفي
• الحالة: ${patientName} | تاريخ الميلاد: ${formattedBirthDate}

زميلي العزيز / زميلتي العزيزة،

أوجه إليكم الحالة المذكورة أعلاه قصد إجراء فحص نفسي حركي معمق والتكفل بالتأهيل الحركي، وذلك للاشتباه في:
1. صعوبات في التنسيق الحركي الدقيق والتآزر البصري الحركي (Motricité Fine) مع ضعف في مسكة القلم.
2. عدم استقرار المخطط الجسمي وتشتت التوجه المكاني والزماني والجانبية الحركية.
3. فرط نشاط مع صعوبة في التثبيط وضبط التوتر العضلي (Régulation Tonique).

نلتمس منكم إفادتنا بنتائج الفحص وتنسيق البرنامج العلاجي المشترك.

تقبلوا فائق التقدير والمودة المهنية.`,

      // 4. CUSTOM FREESTYLE DOCUMENT
      custom: `وثيقة وسجل سريري رسمي مخصص (Document Clinique Personnalisé)

يشهد الأخصائي(ة): ${practitioner?.name || 'الأخصائي المعالج'}
المعتمد(ة) بعيادة: ${tenant?.name || 'العيادة التخصصية'} (رقم القيد: ${licenseNumber})

بخصوص المعني(ة) بالأمر: ${patientName}
المولود(ة) بتاريخ: ${formattedBirthDate} | السن: ${patientAge || '--'} | ملف رقم: ${fileNumber}

[اكتب هنا نص الشهادة أو التقرير أو الوثيقة المخصصة وفقاً لاحتياجات المريض والجهة الطالبة...]

سلمت هذه الوثيقة بطلب من المعني(ة) بالأمر / وليه الشرعي للإدلاء بها واستخدامها في حدود ما يقره القانون.`
    },

    fr: {
      // 1. CLINICAL MEDICAL CERTIFICATES & ATTESTATIONS
      work_cessation: `RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
CERTIFICAT MÉDICAL D'ARRÊT DE TRAVAIL ET REPOS

Je soussigné(e), ${practitioner?.name || 'Le Praticien'},
Praticien au sein de : ${tenant?.name || 'Cabinet Médical Spécialisé'} (N° Agrément : ${licenseNumber}),

Certifie avoir examiné ce jour le/la nommé(e) : ${patientName}
Né(e) le : ${formattedBirthDate} | Dossier N° : ${fileNumber}

Et atteste que son état de santé actuel nécessite un arrêt de travail et un repos médical strict de : [ 07 sept jours ]
À compter du : ${dateStr}
Jusqu'au : [Date de reprise] inclus.

Avec obligation de suivi thérapeutique régulier et repos au domicile.

Certificat délivré à l'intéressé(e) pour servir et valoir ce que de droit auprès des organismes de sécurité sociale (CNAS/CASNOS) et de l'employeur.`,

      clinical_constat: `CERTIFICAT MÉDICAL INITIAL ET DE CONSTAT CLINIQUE

Je soussigné(e), ${practitioner?.name || 'Le Praticien'},
Praticien au sein de l'établissement : ${tenant?.name || 'Cabinet Médical Spécialisé'} (N° Agrément : ${licenseNumber}),

Certifie avoir procédé à l'examen clinique et psychologique approfondi de :
• Nom & Prénom : ${patientName}
• Né(e) le : ${formattedBirthDate} (Âge : ${patientAge || '--'}) | Dossier N° : ${fileNumber}

Constats cliniques et sémiologie observée :
1. Sphère affective : Réaction anxieuse aiguë avec épuisement psychique et perturbations du rythme veille-sommeil.
2. Fonctions cognitives et contact : Orientation temporo-spatiale intacte, avec fatigabilité attentionnelle marquée.
3. Prise en charge : L'état clinique justifie un accompagnement thérapeutique régulier et personnalisé.

Certificat remis en main propre à la demande de l'intéressé(e) / représentant légal pour valoir ce que de droit.`,

      presence: `ATTESTATION OFFICIELLE DE SUIVI MÉDICAL ET DE PRÉSENCE

Je soussigné(e), ${practitioner?.name || 'Le Praticien'},
Praticien au sein de l'établissement : ${tenant?.name || 'Cabinet Médical Spécialisé'} (N° Agrément : ${licenseNumber}),

Certifie que le/la patient(e) : ${patientName}
Né(e) le : ${formattedBirthDate} | Dossier N° : ${fileNumber}

Bénéficie d'une prise en charge et d'un suivi thérapeutique régulier (séances de psychologie / orthophonie / psychomotricité) à raison de [2 séances par semaine], depuis le [Date de début] jusqu'à ce jour ${dateStr}.

La poursuite assidue de ce protocole thérapeutique demeure indispensable pour consolider les progrès cliniques acquis.

Attestation délivrée à l'intéressé(e) ou à son représentant légal pour servir et valoir ce que de droit auprès des organismes compétents.`,

      companion_permit: `AUTORISATION ET JUSTIFICATIF D'ACCOMPAGNEMENT MÉDICAL

Je soussigné(e), ${practitioner?.name || 'Le Praticien'},
Praticien au sein de : ${tenant?.name || 'Cabinet Médical Spécialisé'},

Certifie que l'enfant / patient(e) : ${patientName}
Né(e) le : ${formattedBirthDate} | Dossier N° : ${fileNumber}

Bénéficie d'un suivi thérapeutique et rééducatif au sein de notre cabinet nécessitant, compte tenu de son jeune âge et de son profil clinique, la présence indispensable d'un accompagnateur parental : Monsieur/Madame ${guardianName}.

Nous prions son employeur de bien vouloir lui accorder les facilités nécessaires pour assurer cet accompagnement lors des créneaux programmés ([Jours et horaires des séances]).

Délivré à la demande du représentant légal pour servir et valoir ce que de droit.`,

      care_completion: `CERTIFICAT DE FIN DE PRISE EN CHARGE ET DE CONSOLIDATION

Je soussigné(e), ${practitioner?.name || 'Le Praticien'},
Praticien au sein de l'établissement : ${tenant?.name || 'Cabinet Médical Spécialisé'},

Certifie que le/la nommé(e) : ${patientName} (Dossier N° : ${fileNumber}),
Ayant bénéficié d'un suivi thérapeutique régulier du [Date de début] au [Date de fin],

A atteint avec succès les objectifs définis dans son Projet Thérapeutique Individualisé (PEI), avec une consolidation clinique probante :
1. Restauration optimale des fonctions psycho-affectives, langagières et comportementales ciblées.
2. Excellente adaptation sociocognitive et autonomie dans son environnement habituel.

En conséquence, la prise en charge clinique directe est clôturée ce jour avec préconisation d'un contrôle de suivi à [6 mois] si nécessaire.

Certificat délivré pour servir et valoir ce que de droit.`,

      home_prescription: `PRESCRIPTION ET PROTOCOLE D'EXERCICES THÉRAPEUTIQUES À DOMICILE

Patient(e) : ${patientName} | Dossier N° : ${fileNumber} | Date : ${dateStr}
Praticien : ${practitioner?.name || 'Le Praticien'}

Protocole d'exercices recommandés au patient et à la famille :
1. Exercices respiratoires et de relaxation :
   • Pratique de la cohérence cardiaque / respiration abdominale (5 minutes matin et soir).
2. Exercices langagiers et cognitifs :
   • Lecture interactive partagée sans exposition aux écrans (15 minutes quotidiennes).
   • Valorisation des efforts et renforcement positif systématique.
3. Hygiène de vie et cadre environnemental :
   • Régulation des rythmes de sommeil et limitation stricte des écrans.
   • Encouragement de l'autonomie et de la verbalisation des émotions.

Prochaine consultation de contrôle : [Date de la prochaine séance].`,

      // 2. INSTITUTIONAL & SCHOOL REPORTS (PAI)
      school_adaptation: `À l'attention de la Direction de l'Établissement et de l'Équipe Pédagogique
Concernant l'élève : ${patientName} | Né(e) le : ${formattedBirthDate}

Objet : Préconisations d'aménagements pédagogiques (Projet d'Accueil Individualisé - PAI)

Faisant suite au bilan clinique et neuropsychologique réalisé au sein de notre cabinet, nous préconisons la mise en œuvre des aménagements pédagogiques bienveillants suivants :
1. Placement en classe : Positionner l'élève au premier rang, en face de l'enseignant et à distance des distracteurs visuels (fenêtres, portes).
2. Évaluations écrites : Accorder une majoration d'un tiers-temps supplémentaire (Tiers-Temps) lors des devoirs sur table et examens pour alléger la tension cognitive.
3. Évaluations orales : Encourager l'expression spontanée sans imposer de lecture à voix haute imprévue devant le groupe-classe.
4. Consignes : Privilégier des consignes courtes, segmentées étape par étape, avec reformulation de la compréhension.
5. Valorisation : Encourager les efforts et autoriser de brèves pauses de recentrage attentionnel si nécessaire.

La synergie entre l'école, la famille et les thérapeutes constitue la clé de voûte de l'épanouissement scolaire de l'enfant.`,

      court_justice: `À l'attention de Monsieur / Madame le Juge aux Affaires Familiales / Juge des Enfants / Président du Tribunal

Objet : Rapport d'évaluation psychologique clinique médico-légale
• Cadre : [Procédure de garde d'enfants / Évaluation de l'intérêt supérieur / Mesure de tutelle / Préjudice psychologique]

Monsieur / Madame le Magistrat,

En notre qualité de psychologue clinicien(ne), nous avons l'honneur de soumettre à votre juridiction ce rapport d'évaluation psychologique circonstancié, établi à la suite d'entretiens cliniques approfondis et de passations psychométriques standardisées.

1. Cadre de l'évaluation et observation clinique :
- La personne examinée s'est présentée aux entretiens d'évaluation au sein de notre cabinet.
- Présentation générale soignée, contact aisé et coopérant, orientation temporo-spatiale parfaite, discours cohérent et structuré sans dissociation idéique ni éléments délirants.

2. Anamnèse et contexte psychosocial :
- L'exploration biographique met en évidence un contexte de tensions et de vulnérabilités réactionnelles liées à [conflit intrafamilial / procédure de garde / événement traumatique récent].
- Absence totale d'antécédents de dangerosité psychiatrique, de conduite addictive compromettante ou de pathologie mentale invalidante.

3. Résultats du bilan psychologique et psychométrie :
- L'administration des épreuves standardisées indique :
  • Sphère cognitive : Capacités intellectuelles efficientes, sens critique et discernement pleinement conservés (Capacité de discernement intacte).
  • Sphère émotionnelle : Réactivité anxieuse réactionnelle au contexte contentieux sans décompensation thymique majeure.
  • Compétences relationnelles et parentales : Capacités d'écoute, de bienveillance et d'étayage affectif adaptées.

4. Conclusions et avis de l'expert clinicien :
- La personne examinée présente un équilibre psychologique suffisant et les aptitudes requises pour assumer ses responsabilités personnelles et familiales.

Le présent rapport est établi en toute impartialité et conscience professionnelle pour valoir ce que de droit devant la justice.`,

      school_report: `À l'attention de Monsieur / Madame le Directeur de l'Établissement
À l'attention du Conseiller d'Orientation et de l'Équipe Pédagogique

Objet : Rapport de bilan psychologique et préconisations d'aménagements pédagogiques (Projet P.A.I.)
• Concernant l'élève : ${patientName} | Classe : [Classe]

Madame, Monsieur,

À la demande des représentants légaux et suite aux difficultés scolaires constatées, nous avons procédé à un bilan psychologique et cognitif complet de l'élève susnommé(e), en vue d'objectiver ses besoins éducatifs particuliers.

1. Synthèse du profil psychologique et cognitif :
- Efficience intellectuelle globale située dans la norme attendue pour l'âge.
- Fragilité des fonctions exécutives compatible avec : [Trouble des apprentissages Dys / Trouble du Déficit de l'Attention TDAH / Anxiété scolaire].

2. Aménagements pédagogiques bienveillants recommandés en classe :
  a) Installation : Positionner l'élève au premier rang, proche de l'enseignant.
  b) Évaluations : Accorder une majoration de temps (tiers-temps supplémentaire) lors des devoirs sur table.
  c) Consignes : Segmenter les consignes complexes en sous-étapes claires.

Nous vous remercions pour l'attention bienveillante que vous porterez à ces recommandations.`,

      university_report: `À l'attention de Monsieur / Madame le Doyen de la Faculté
À l'attention du Service de Médecine Préventive Universitaire et du Comité des Examens

Objet : Rapport d'évaluation psychologique et préconisations d'aménagements universitaires
• Concernant l'étudiant(e) : ${patientName} | Matricule : [Matricule]

Madame, Monsieur les Responsables Académiques,

Nous certifions par la présente que l'étudiant(e) susnommé(e) bénéficie d'un suivi psychologique clinique régulier au sein de notre cabinet, motivant la formulation de préconisations d'aménagements spécifiques de son cursus et de ses épreuves d'évaluation.

1. Données cliniques et retentissement :
- L'étudiant(e) présente une symptomatologie anxieuse sévère invalidante (attaques de panique situationnelles en milieu clos).

2. Aménagements académiques sollicités pour les examens :
  a) Passation des examens dans une salle à effectif réduit ou isolée au calme.
  b) Octroi d'une majoration de temps (tiers-temps supplémentaire) lors des épreuves écrites.
  c) Autorisation de pauses de courte durée (5 à 10 minutes) en cas de paroxysme anxieux.

Nous vous remercions chaleureusement pour votre précieux concours.`,

      work_report: `À l'attention de Monsieur / Madame le Médecin du Travail
À l'attention de la Direction des Ressources Humaines / Commission d'Invalidité

Objet : Rapport d'évaluation psychologique clinique et d'aptitude au poste de travail
• Concernant : ${patientName} | Poste : [Poste occupé]

Cher Confrère,

Nous soumettons à votre appréciation médicale ce rapport d'évaluation psychologique clinique concernant la personne susnommée :
1. Diagnostic et retentissement : Épuisement professionnel aigu (Burnout Sévère) avec retentissement thymique et cognitif.
2. Préconisations médicales : Période de repos médical prolongé et étude d'un aménagement ou reclassement de poste adapté.

Avec nos salutations confraternelles les plus dévouées.`,

      // 3. SPECIALIZED MEDICAL REFERRALS
      pedopsychiatry: `À l'attention de notre confrère / consœur :
Docteur Spécialiste en Psychiatrie de l'Enfant et de l'Adolescent (Pédopsychiatre)

Objet : Lettre d'orientation et de liaison médicale spécialisée
• Enfant : ${patientName} | Né(e) le : ${formattedBirthDate}

Cher(e) Confrère,

Nous vous référons ce jour l'enfant susnommé(e), suivi(e) au sein de notre cabinet, pour un avis diagnostique nosographique (suspicion TDAH / TSA / Troubles Anxieux) et l'évaluation d'une prise en charge conjointe.

Nous restons à votre entière disposition pour poursuivre la prise en charge thérapeutique en étroite synergie avec votre suivi.`,

      adult_psychiatry: `À l'attention de notre confrère / consœur :
Docteur Spécialiste en Psychiatrie de l'Adulte

Objet : Lettre d'orientation et de liaison médicale spécialisée
• Patient(e) : ${patientName} | Né(e) le : ${formattedBirthDate}

Cher(e) Confrère,

Nous vous adressons ce jour ${patientName}, qui consulte au sein de notre cabinet, afin de recueillir votre avis diagnostique spécialisé et d'évaluer l'opportunité d'une thérapeutique médicamenteuse ciblée en complément du suivi psychothérapeutique TCC.

Avec nos salutations confraternelles les plus distinguées.`,

      neuro_eeg: `À l'attention de notre confrère / consœur :
Docteur Spécialiste en Neurologie

Objet : Demande d'avis neurologique et tracé électro-encéphalographique (EEG)
• Patient(e) : ${patientName} | Né(e) le : ${formattedBirthDate}

Cher Confrère,

Nous vous adressons ce jour la personne susnommée pour exploration neurologique et réalisation d'un enregistrement EEG (recherche d'absences comitiales et exploration des fonctions neuromotrices).

En vous remerciant pour votre accueil confraternel.`,

      orl_audio: `À l'attention du Docteur :
Spécialiste en Oto-Rhino-Laryngologie (ORL)

Objet : Demande d'exploration ORL et bilan audiométrique complet
• Patient(e) : ${patientName} | Né(e) le : ${formattedBirthDate}

Cher Confrère,

Nous sollicitons un bilan ORL complet et une audiométrie tonale et vocale avec tympanométrie pour explorer toute hypoacousie sous-jacente dans le cadre d'un retard de langage oral.

Avec nos sincères remerciements confraternels.`,

      psychomotricite: `À l'attention de notre confrère / consœur :
Praticien en Psychomotricité / Kinésithérapie / Ergothérapie

Objet : Lettre d'orientation pour bilan psychomoteur et prise en charge
• Patient(e) : ${patientName} | Né(e) le : ${formattedBirthDate}

Cher(e) Confrère,

Nous vous adressons ce jour la personne susnommée afin de réaliser un bilan psychomoteur complet (coordination motrice fine, intégration du schéma corporel et régulation tonique).

En vous remerciant pour votre précieuse collaboration.`,

      // 4. CUSTOM FREESTYLE DOCUMENT
      custom: `DOCUMENT ET CERTIFICAT MÉDICAL PERSONNALISÉ

Je soussigné(e), ${practitioner?.name || 'Le Praticien'},
Praticien au sein de : ${tenant?.name || 'Cabinet Médical Spécialisé'} (N° Agrément : ${licenseNumber}),

Concernant : ${patientName}
Né(e) le : ${formattedBirthDate} | Dossier N° : ${fileNumber}

[Rédigez ici le contenu spécifique du certificat ou document selon le besoin du patient et de l'organisme destinataire...]

Certificat délivré à la demande de l'intéressé(e) pour servir et valoir ce que de droit.`
    }
  }), [patientName, dateStr, formattedBirthDate, patientAge, fileNumber, guardianName, licenseNumber, practitioner?.name, tenant?.name]);

  // Helper for official document titles
  const getDocumentTypeTitle = (type, lang = 'ar') => {
    const titles = {
      ar: {
        work_cessation: '🛑 شهادة توقف عن العمل وراحة مرضية',
        clinical_constat: '🩺 شهادة فحص ومعاينة سريرية أولية',
        presence: '📜 شهادة متابعة علاجية وحضور منتظم',
        companion_permit: '🤝 رخصة مرافقة طبية عائلية',
        care_completion: '🏆 شهادة استئناف النشاط وانتهاء التكفل',
        home_prescription: '💊 وصفة وبروتوكول التأهيل المنزلي',
        school_adaptation: '🎒 مذكرة التكييف البيداغوجي PAI',
        court_justice: '⚖️ تقرير التقييم للمحكمة والعدالة',
        school_report: '🏫 تقرير التقييم للمدرسة والتربية',
        university_report: '🎓 تقرير التقييم للجامعة والامتحانات',
        work_report: '💼 تقرير لطب العمل ولجنة العجز',
        pedopsychiatry: '👶 توجيه لأمراض عقلية أطفال',
        adult_psychiatry: '🧑 توجيه لأمراض عقلية راشدين',
        neuro_eeg: '🧠 توجيه لأعصاب وتخطيط EEG',
        orl_audio: '👂 توجيه لأنف وأذن وسمع',
        psychomotricite: '🤸 توجيه لتأهيل حركي ووظيفي',
        custom: '📄 وثيقة / شهادة سريرية مخصصة',
      },
      fr: {
        work_cessation: '🛑 Certificat d\'Arrêt de Travail & Repos',
        clinical_constat: '🩺 Certificat Médical Initial / Constat',
        presence: '📜 Attestation de Suivi Médical & Présence',
        companion_permit: '🤝 Autorisation d\'Accompagnement',
        care_completion: '🏆 Certificat de Fin de Prise en Charge',
        home_prescription: '💊 Prescription d\'Exercices à Domicile',
        school_adaptation: '🎒 Projet d\'Accueil Individualisé (PAI)',
        court_justice: '⚖️ Rapport Médico-Légal (Tribunal)',
        school_report: '🏫 Rapport Psychologique Scolaire',
        university_report: '🎓 Aménagement Universitaire',
        work_report: '💼 Médecine du Travail (Aptitude)',
        pedopsychiatry: '👶 Orientation Pédopsychiatrie',
        adult_psychiatry: '🧑 Orientation Psychiatrie Adulte',
        neuro_eeg: '🧠 Orientation Neurologie & EEG',
        orl_audio: '👂 Bilan Auditif ORL',
        psychomotricite: '🤸 Bilan Psychomoteur & Rééducation',
        custom: '📄 Document Médical Personnalisé',
      }
    };
    return titles[lang]?.[type] || titles['ar']?.[type] || (lang === 'ar' ? '📄 وثيقة / شهادة سريرية' : '📄 Document / Certificat Médical');
  };

  // Fetch Patient's Saved Documents Archive
  const fetchArchive = async () => {
    if (!patient?.id) return;
    setLoadingArchive(true);
    try {
      const res = await patientApi.getAiRecords(patient.id);
      const allRecords = res?.records || [];
      const docs = allRecords.filter(r => 
        r.tool_type === 'medical_document' || 
        r.tool_type === 'medical_certificate' || 
        r.tool_type === 'medical_letter' ||
        r.payload?.verificationToken
      );
      setArchive(docs);
    } catch (err) {
      console.error('Error loading documents archive:', err);
    } finally {
      setLoadingArchive(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, [patient?.id]);

  // Initial Content Load on mount or when template changes
  useEffect(() => {
    if (!content) {
      setContent(templates[letterLang]?.[letterType] || '');
    }
  }, []);

  const handleSelectType = (type, category) => {
    setCustomToken(null);
    setLoadedRecordId(null);
    if (category) setActiveCategory(category);
    setLetterType(type);
    setContent(templates[letterLang]?.[type] || '');
  };

  const handleToggleLang = (lang) => {
    setLetterLang(lang);
    if (!loadedRecordId) {
      setContent(templates[lang]?.[letterType] || '');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Save Document to Patient Archive
  const handleSaveToArchive = async (isAutoSave = false) => {
    if (!patient?.id) {
      if (!isAutoSave) alert(letterLang === 'ar' ? 'يرجى اختيار مريض أولاً لحفظ الوثيقة في ملفه الطبي.' : 'Veuillez sélectionner un patient valide.');
      return;
    }
    if (!content || !content.trim()) {
      if (!isAutoSave) alert(letterLang === 'ar' ? 'محتوى الوثيقة فارغ!' : 'Le contenu est vide !');
      return;
    }

    setSaving(true);
    try {
      const docTitle = customTitle.trim() || getDocumentTypeTitle(letterType, letterLang);
      const res = await patientApi.attachAiRecord(patient.id, {
        tool_type: 'medical_document',
        title: docTitle,
        summary: content.trim().substring(0, 200) + (content.length > 200 ? '...' : ''),
        payload: {
          content,
          letterType,
          letterLang,
          activeCategory,
          verificationToken,
          practitionerName: practitioner?.name || '',
          licenseNumber,
          savedAt: new Date().toISOString(),
        },
        notes: `وثيقة/شهادة رسمية صادرة برمز: ${verificationToken}`
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchArchive();
      if (onDocumentSaved) onDocumentSaved(res);
      return res;
    } catch (err) {
      console.error('Failed to save medical document:', err);
      if (!isAutoSave) {
        alert(letterLang === 'ar' ? 'فشل حفظ الوثيقة: ' + (err.message || 'خطأ غير متوقع') : 'Échec de sauvegarde : ' + (err.message || ''));
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    // Automatically archive a certified copy to patient records upon printing
    handleSaveToArchive(true);
    window.print();
  };

  const handleShareWhatsApp = async () => {
    const phone = patient?.phone;
    if (!phone) {
      alert(letterLang === 'ar' ? 'رقم هاتف المريض أو الولي غير مسجل في الملف.' : 'Numéro de téléphone introuvable.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const docTitle = customTitle.trim() || getDocumentTypeTitle(letterType, letterLang);
    const clinicName = tenant?.name || 'العيادة التخصصية';
    
    // Auto-save certified copy first
    await handleSaveToArchive(true);

    const messageText = letterLang === 'ar'
      ? `السلام عليكم ورحمة الله وبركاته،\n` +
        `تحية طيبة من ${clinicName}.\n` +
        `نحيطكم علماً بأنه قد تم إصدار وتوثيق وثيقة طبية رسمية للمريض(ة): ${patientName}.\n\n` +
        `• الوثيقة: ${docTitle}\n` +
        `• التاريخ: ${dateStr}\n` +
        `• رمز المصادقة الإلكترونية: ${verificationToken}\n` +
        `• رابط التحقق الرقمي: ${verificationUrl}\n\n` +
        `يمكنكم استلام النسخة الورقية الرسمية المختومة من مقر العيادة.`
      : `Bonjour,\n` +
        `De la part du ${clinicName}.\n` +
        `Nous vous informons qu'un document médical officiel a été émis pour : ${patientName}.\n\n` +
        `• Document : ${docTitle}\n` +
        `• Date : ${dateStr}\n` +
        `• Réf de certification : ${verificationToken}\n` +
        `• Vérification numérique : ${verificationUrl}\n\n` +
        `Vous pouvez récupérer votre exemplaire officiel au sein de notre cabinet.`;

    setSendingWa(true);
    try {
      if (whatsappApi?.sendMessage) {
        await whatsappApi.sendMessage({
          phone: cleanPhone,
          message: messageText,
          patient_id: patient?.id,
          service_type: 'medical_document_notification'
        });
      } else {
        window.open(`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(messageText)}`, '_blank');
      }
      setWaSentSuccess(true);
      setTimeout(() => setWaSentSuccess(false), 3500);
    } catch (err) {
      window.open(`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(messageText)}`, '_blank');
    } finally {
      setSendingWa(false);
    }
  };

  const handleLoadFromArchive = (doc) => {
    const payload = doc.payload || {};
    if (payload.letterLang) setLetterLang(payload.letterLang);
    if (payload.activeCategory) setActiveCategory(payload.activeCategory);
    if (payload.letterType) setLetterType(payload.letterType);
    if (payload.verificationToken) setCustomToken(payload.verificationToken);
    if (payload.content) setContent(payload.content);
    if (doc.title) setCustomTitle(doc.title);
    setLoadedRecordId(doc.id);
  };

  const handleDeleteFromArchive = async (recordId) => {
    const isAr = letterLang === 'ar';
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذه الوثيقة من أرشيف المريض؟' : 'Confirmer la suppression de ce document archivé ?')) {
      return;
    }
    try {
      await patientApi.deleteAiRecord(patient.id, recordId);
      setArchive(prev => prev.filter(item => item.id !== recordId));
      if (loadedRecordId === recordId) {
        setLoadedRecordId(null);
      }
      if (onDocumentSaved) onDocumentSaved();
    } catch (err) {
      alert(isAr ? 'تعذر حذف الوثيقة: ' + (err.message || '') : 'Erreur de suppression');
    }
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${letterType}_${letterLang}_${patientName.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSignatureSaved = (data) => {
    if (data.signatureDataUrl) setSignatureData(data.signatureDataUrl);
    if (data.stampImage) setStampData(data.stampImage);
    if (data.licenseNumber) setLicenseNumber(data.licenseNumber);
  };

  const isAr = letterLang === 'ar';

  const filteredArchive = archive.filter(doc => {
    if (!archiveSearch.trim()) return true;
    const s = archiveSearch.toLowerCase();
    const titleMatch = (doc.title || '').toLowerCase().includes(s);
    const summaryMatch = (doc.summary || '').toLowerCase().includes(s);
    const tokenMatch = (doc.payload?.verificationToken || '').toLowerCase().includes(s);
    return titleMatch || summaryMatch || tokenMatch;
  });

  const renderArchiveCard = (doc) => {
    const isLoaded = loadedRecordId === doc.id;
    const formattedDate = doc.created_at ? new Date(doc.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '---';

    return (
      <div
        key={doc.id}
        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
          isLoaded 
            ? 'bg-emerald-950/25 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
            : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>{doc.title}</span>
              </span>
              {doc.payload?.letterLang && (
                <span className="px-2 py-0.5 text-[10px] rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold">
                  {doc.payload.letterLang === 'fr' ? '🇫🇷 FR' : '🇩🇿 AR'}
                </span>
              )}
              {isLoaded && (
                <span className="px-2 py-0.5 text-[10px] rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold animate-pulse">
                  {isAr ? 'مفتوح في المحرر' : 'Actif'}
                </span>
              )}
            </div>
          </div>

          {doc.payload?.verificationToken && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Réf: {doc.payload.verificationToken}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60 font-sans">
            {doc.summary || (typeof doc.payload?.content === 'string' ? doc.payload.content.substring(0, 140) + '...' : '---')}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-1 font-mono">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleLoadFromArchive(doc)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 font-bold transition-all flex items-center gap-1"
              title={isAr ? 'فتح في المحرر للتعديل والمراجعة' : 'Ouvrir dans l\'éditeur'}
            >
              <Eye className="w-3 h-3" />
              <span>{isAr ? 'استعراض' : 'Ouvrir'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleLoadFromArchive(doc);
                setTimeout(() => {
                  window.print();
                }, 300);
              }}
              className="px-2.5 py-1 rounded-lg bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 border border-teal-500/30 font-bold transition-all flex items-center gap-1"
              title={isAr ? 'طباعة مباشرة' : 'Imprimer'}
            >
              <Printer className="w-3 h-3" />
              <span>{isAr ? 'طباعة' : 'Imprimer'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeleteFromArchive(doc.id)}
              className="p-1 rounded-lg bg-red-600/10 hover:bg-red-600/30 text-red-400 border border-red-500/20 transition-all"
              title={isAr ? 'حذف من الأرشيف' : 'Supprimer'}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const mainUiContent = (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. INTERACTIVE SCREEN UI (COMPLETELY HIDDEN DURING PRINT VIA print:hidden) */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6 medical-letters-interactive-ui print:hidden">
        {/* Header Actions & Bilingual Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>
                {isAr 
                  ? 'محرر الشهادات والوثائق والتقارير الطبية الرسمية (Certificats & Rapports Médicaux)' 
                  : 'Éditeur de Certificats, Bilans & Rapports Médicaux Officiels'}
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? `المريض: ${patientName} • شهادات التوقف عن العمل، المعاينة السريرية، المتابعة، ورسائل التوجيه والتقارير المعتمدة`
                : `Patient : ${patientName} • Certificats de travail, suivi, constat clinique, PAI et orientations`}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Language Selector: Arabic / French */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleToggleLang('ar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isAr
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇩🇿</span>
                <span>العربية</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleLang('fr')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  !isAr
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🇫🇷</span>
                <span>Français</span>
              </button>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title={isAr ? 'نسخ النص للحافظة' : 'Copier le texte'}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (isAr ? 'تم النسخ!' : 'Copié !') : (isAr ? 'نسخ' : 'Copier')}</span>
            </button>

            {/* Download TXT Button */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="تصدير ملف نصي TXT"
            >
              <Download className="w-4 h-4" />
              <span>TXT</span>
            </button>

            {/* WhatsApp Share Button */}
            {patient?.phone && (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                disabled={sendingWa}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="إرسال إشعار رسمي برمز التحقق عبر واتساب للولي"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingWa ? '...' : waSentSuccess ? 'تم الإرسال ✅' : 'WhatsApp'}</span>
              </button>
            )}

            {/* Signature & Stamp Button */}
            <button
              type="button"
              onClick={() => setShowSignatureModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>
                {signatureData || stampData 
                  ? (isAr ? 'الختم والتوقيع ✍️' : 'Signature & Cachet') 
                  : (isAr ? 'إعداد التوقيع والختم' : 'Configurer Signature')}
              </span>
            </button>

            {/* Save to Patient Archive Button */}
            <button
              type="button"
              onClick={() => handleSaveToArchive(false)}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center space-x-1.5 space-x-reverse shadow-md transition-all active:scale-95 ${
                saveSuccess
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-emerald-700 hover:bg-emerald-600 shadow-emerald-700/20'
              }`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isAr ? 'جاري الحفظ...' : 'Enregistrement...'}</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>{isAr ? 'تم الحفظ في ملف المريض! ✅' : 'Enregistré dans le dossier ! ✅'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isAr ? '💾 حفظ في ملف المريض' : '💾 Sauvegarder dans Dossier'}</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 space-x-reverse shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة الوثيقة A4 🖨️' : 'Imprimer Document A4 🖨️'}</span>
            </button>
          </div>
        </div>

        {/* Category Tabs (Certificates vs Institutional vs Medical vs Custom) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('certificates');
              handleSelectType('work_cessation', 'certificates');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeCategory === 'certificates'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isAr ? '📜 الشهادات الطبية السريرية (توقف عن العمل، متابعة، معاينة)' : '📜 Certificats Médicaux (Arrêt, Suivi, Constat)'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('institutional');
              handleSelectType('court_justice', 'institutional');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeCategory === 'institutional'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{isAr ? '🏛️ تقارير المؤسسات الرسمية (المحكمة، PAI المدرسة، الجامعة، العمل)' : '🏛️ Bilans Institutionnels (Tribunal, École, PAI)'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('medical');
              handleSelectType('pedopsychiatry', 'medical');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeCategory === 'medical'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>{isAr ? '🩺 خطابات التوجيه الطبي المتخصص (Pédopsychiatre, Adulte, EEG, ORL)' : '🩺 Lettres d\'Orientation Médicale'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('custom');
              handleSelectType('custom', 'custom');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeCategory === 'custom'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? '✨ وثيقة / شهادة مخصصة (نص حر)' : '✨ Document Personnalisé (Texte Libre)'}</span>
          </button>
        </div>

        {/* Templates Selector Grid based on Category */}
        {activeCategory === 'certificates' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <button
              type="button"
              onClick={() => handleSelectType('work_cessation', 'certificates')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'work_cessation'
                  ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-400 shadow-md shadow-teal-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">🛑</span>
              <span className="font-bold block">{isAr ? 'توقف عن العمل وراحة' : 'Arrêt de Travail'}</span>
              <span className="text-[10px] opacity-75 font-mono">{isAr ? 'عطلة مرضية للضمان' : 'Repos & Sécurité Sociale'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('clinical_constat', 'certificates')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'clinical_constat'
                  ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-400 shadow-md shadow-teal-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">🩺</span>
              <span className="font-bold block">{isAr ? 'معاينة وفحص أولي' : 'Constat Clinique'}</span>
              <span className="text-[10px] opacity-75 font-mono">{isAr ? 'إثبات الحالة السريرية' : 'Certificat initial'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('presence', 'certificates')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'presence'
                  ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-400 shadow-md shadow-teal-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">📜</span>
              <span className="font-bold block">{isAr ? 'متابعة وحضور منتظم' : 'Attestation de Suivi'}</span>
              <span className="text-[10px] opacity-75 font-mono">{isAr ? 'إثبات الحضور للمؤسسات' : 'Présence aux séances'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('companion_permit', 'certificates')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'companion_permit'
                  ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-400 shadow-md shadow-teal-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">🤝</span>
              <span className="font-bold block">{isAr ? 'رخصة مرافقة طفل' : 'Accompagnement'}</span>
              <span className="text-[10px] opacity-75 font-mono">{isAr ? 'تسهيل حضور الولي' : 'Pour l\'employeur du tuteur'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('care_completion', 'certificates')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'care_completion'
                  ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-400 shadow-md shadow-teal-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">🏆</span>
              <span className="font-bold block">{isAr ? 'انتهاء التكفل والشفاء' : 'Fin de Prise en Charge'}</span>
              <span className="text-[10px] opacity-75 font-mono">{isAr ? 'استقرار الحالة واستئناف النشاط' : 'Consolidation clinique'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('home_prescription', 'certificates')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'home_prescription'
                  ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white border-teal-400 shadow-md shadow-teal-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">💊</span>
              <span className="font-bold block">{isAr ? 'وصفة تمارين منزلية' : 'Prescription Exercices'}</span>
              <span className="text-[10px] opacity-75 font-mono">{isAr ? 'بروتوكول موجه للأسرة' : 'Protocole à domicile'}</span>
            </button>
          </div>
        )}

        {activeCategory === 'institutional' && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => handleSelectType('school_adaptation', 'institutional')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'school_adaptation'
                  ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white border-amber-400 shadow-md shadow-amber-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">🎒</span>
              <span className="font-bold block">{isAr ? 'مذكرة التكييف البيداغوجي PAI' : 'Projet P.A.I. Scolaire'}</span>
              <span className="text-[10px] opacity-75 font-mono">{isAr ? 'تكييف القسم والامتحانات' : 'Aménagements pédagogiques'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('court_justice', 'institutional')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'court_justice'
                  ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white border-amber-400 shadow-md shadow-amber-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">⚖️</span>
              <span className="font-bold block">{isAr ? 'تقرير المحكمة والعدالة' : 'Tribunal & Justice'}</span>
              <span className="text-[10px] opacity-75 font-mono">{isAr ? 'الحضانة والأهلية والخبرة' : 'Affaires familiales & Tutelle'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('school_report', 'institutional')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'school_report'
                  ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white border-amber-400 shadow-md shadow-amber-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">🏫</span>
              <span className="font-bold block">{isAr ? 'تقرير المدرسة والتربية' : 'École & Scolarité'}</span>
              <span className="text-[10px] opacity-75 font-mono">{isAr ? 'صعوبات التعلم والتوجيه' : 'Troubles Dys, TDAH'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('university_report', 'institutional')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'university_report'
                  ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white border-amber-400 shadow-md shadow-amber-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">🎓</span>
              <span className="font-bold block">{isAr ? 'تقرير الجامعة والامتحانات' : 'Université & Examens'}</span>
              <span className="text-[10px] opacity-75 font-mono">{isAr ? 'قاعة هادئة وثلث الوقت' : 'Tiers-temps & Aménagement'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('work_report', 'institutional')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'work_report'
                  ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white border-amber-400 shadow-md shadow-amber-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">💼</span>
              <span className="font-bold block">{isAr ? 'تقرير طب العمل والعجز' : 'Médecine du Travail'}</span>
              <span className="text-[10px] opacity-75 font-mono">{isAr ? 'الإنهاك المهني واللياقة' : 'Burnout & Reclassement'}</span>
            </button>
          </div>
        )}

        {activeCategory === 'medical' && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => handleSelectType('pedopsychiatry', 'medical')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'pedopsychiatry'
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">👶</span>
              <span className="font-bold block">{isAr ? 'أمراض عقلية أطفال' : 'Pédopsychiatrie'}</span>
              <span className="text-[10px] opacity-75 font-mono">Pédopsychiatre</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('adult_psychiatry', 'medical')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'adult_psychiatry'
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">🧑</span>
              <span className="font-bold block">{isAr ? 'أمراض عقلية راشدين' : 'Psychiatrie Adulte'}</span>
              <span className="text-[10px] opacity-75 font-mono">Psychiatre d'Adulte</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('neuro_eeg', 'medical')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'neuro_eeg'
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">🧠</span>
              <span className="font-bold block">{isAr ? 'أعصاب وتخطيط EEG' : 'Neurologie & EEG'}</span>
              <span className="text-[10px] opacity-75 font-mono">Avis Neurologique</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('orl_audio', 'medical')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'orl_audio'
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">👂</span>
              <span className="font-bold block">{isAr ? 'أنف وأذن وسمع' : 'ORL & Audiométrie'}</span>
              <span className="text-[10px] opacity-75 font-mono">Bilan Auditif ORL</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('psychomotricite', 'medical')}
              className={`p-3 rounded-2xl text-xs font-bold ${isAr ? 'text-right' : 'text-left'} transition-all flex flex-col justify-between border ${
                letterType === 'psychomotricite'
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="text-xl mb-1">🤸</span>
              <span className="font-bold block">{isAr ? 'تأهيل حركي ووظيفي' : 'Psychomotricité'}</span>
              <span className="text-[10px] opacity-75 font-mono">Bilan Psychomoteur</span>
            </button>
          </div>
        )}

        {activeCategory === 'custom' && (
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
            <label className="text-xs font-bold text-purple-300 block">
              {isAr ? 'عنوان الوثيقة أو الشهادة المخصصة:' : 'Titre du document personnalisé :'}
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={isAr ? 'مثال: شهادة إعفاء من التربية البدنية / شهادة تأهيل نطق خاص...' : 'Ex: Certificat de dispense / Attestation spécifique...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-bold"
            />
          </div>
        )}

        {/* Document Preview & Live Textarea */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>
                {isAr 
                  ? 'نص الشهادة أو الوثيقة الرسمية الصادرة (قابل للتعديل المباشر والتخصيص):' 
                  : 'Texte officiel du document ou certificat (modifiable directement) :'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setContent(templates[letterLang]?.[letterType] || '')}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold transition-colors"
            >
              {isAr ? 'إعادة ضبط إلى القالب الافتراضي ↺' : 'Réinitialiser au modèle par défaut ↺'}
            </button>
          </div>

          <textarea
            rows={15}
            dir={isAr ? 'rtl' : 'ltr'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-amber-500 shadow-inner font-sans"
          />

          {/* Interactive Screen Preview Strip */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 w-full sm:w-auto">
              <div className="w-16 h-16 bg-white p-1 rounded-xl shrink-0 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verificationUrl)}`}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-[11px] space-y-0.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isAr ? 'رمز المصادقة والتحقق الإلكتروني الرسمي' : 'Certification Numérique Officielle'}</span>
                </span>
                <p className="text-[10px] text-slate-400 font-mono font-bold">
                  {verificationToken}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isAr ? 'يتم حفظ هذا الرمز في السجل الطبي ويُمكّن المؤسسات من التحقق المباشر' : 'Enregistré dans le dossier médical pour vérification officielle'}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 ${isAr ? 'text-right' : 'text-left'} min-w-[260px] w-full sm:w-auto`}>
              {stampData ? (
                <div className="w-16 h-16 bg-white/5 rounded-xl p-1 flex items-center justify-center border border-slate-800 shrink-0">
                  <img src={stampData} alt="ختم العيادة" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 text-[9px] text-center shrink-0">
                  <span>{isAr ? 'ختم العيادة' : 'Cachet'}</span>
                </div>
              )}

              <div className="flex-1 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">
                  {isAr ? 'توقيع وخاتم الأخصائي:' : 'Signature & Cachet du Praticien :'}
                </span>
                {signatureData ? (
                  <img src={signatureData} alt="التوقيع الرقمي" className="h-9 object-contain filter invert opacity-90" />
                ) : (
                  <span className="text-xs font-serif italic text-indigo-300 block">
                    {practitioner?.name || (isAr ? 'الأخصائي المعالج' : 'Praticien Traitant')}
                  </span>
                )}
                <span className="text-[9px] text-slate-500 block font-mono">
                  {isAr ? 'رقم القيد:' : 'N° Agrément :'} {licenseNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. OFFICIAL ARCHIVE OF ISSUED DOCUMENTS FOR THIS PATIENT */}
        <div className="mt-8 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>{isAr ? '📂 أرشيف الشهادات والوثائق المحفوظة في ملف المريض' : '📂 Registre des Documents & Certificats Enregistrés'}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {archive.length} {isAr ? 'وثيقة محفوظة' : 'docs archivés'}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  {isAr 
                    ? 'سجل طبي رقمي يضم كافة الشهادات، التقارير والخطابات الصادرة للمريض مع رموز التحقق وتاريخ الحفظ'
                    : 'Historique des attestations et bilans certifiés avec jetons de vérification dans le dossier'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder={isAr ? 'بحث في الأرشيف...' : 'Filtrer l\'archive...'}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={fetchArchive}
                disabled={loadingArchive}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${loadingArchive ? 'animate-spin' : ''}`} />
                <span>{isAr ? 'تحديث' : 'Actualiser'}</span>
              </button>
            </div>
          </div>

          {loadingArchive ? (
            <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span>{isAr ? 'جاري تحميل الأرشيف الطبي...' : 'Chargement de l\'archive...'}</span>
            </div>
          ) : filteredArchive.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-800 rounded-2xl p-6 bg-slate-950/40">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-60" />
              <p className="text-xs text-slate-300 font-bold">
                {archiveSearch 
                  ? (isAr ? 'لا توجد نتائج مطابقة لبحثك في الأرشيف.' : 'Aucun document correspondant.')
                  : (isAr ? 'لا توجد شهادات أو وثائق محفوظة لهذا المريض بعد.' : 'Aucun document ou certificat archivé pour ce patient.')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {isAr 
                  ? 'انقر على "💾 حفظ في ملف المريض" أو "طباعة الوثيقة" لأرشفة النسخة الصادرة تلقائياً في السجل الطبي.'
                  : 'Cliquez sur "Sauvegarder" ou "Imprimer" pour archiver automatiquement une copie officielle.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredArchive.map(renderArchiveCard)}
            </div>
          )}
        </div>
      </div>

      {/* 2. OFFICIAL PRINTABLE A4 CONTAINER (VISIBLE ONLY DURING PRINT, RELATIVE POSITIONING) */}
      <div 
        id="printable-medical-letter" 
        className="hidden print:block w-full bg-white text-slate-900 font-sans"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Official Clinic Letterhead */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-bold tracking-wide">
              {isAr ? 'الجمهورية الجزائرية الديمقراطية الشعبية — قطاع الصحة والتأهيل' : 'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE'}
            </p>
            <h1 className="text-xl font-black text-slate-900">
              {tenant?.name || (isAr ? 'العيادة التخصصية في الطب النفسي والتأهيل' : 'Cabinet Médical Spécialisé en Psychiatrie et Réhabilitation')}
            </h1>
            <p className="text-xs font-bold text-slate-700">
              {isAr ? 'الأخصائي(ة) المشرف(ة):' : 'Praticien(ne) Référent(e) :'} {practitioner?.name || (isAr ? 'الأخصائي المعالج' : 'Praticien')}
            </p>
            <p className="text-[11px] text-slate-600 font-mono">
              {isAr ? 'رقم الاعتماد والقيد المهني:' : 'N° d\'Agrément / Inscription :'} {licenseNumber}
            </p>
            <p className="text-[11px] text-slate-600">
              {tenant?.address || (isAr ? 'الجزائر' : 'Alger, Algérie')} {tenant?.phone ? `• ${isAr ? 'هاتف:' : 'Tél :'} ${tenant.phone}` : ''}
            </p>
          </div>

          <div className={isAr ? 'text-left space-y-1.5' : 'text-right space-y-1.5'}>
            <span className="text-xs font-bold text-slate-800 block">
              {isAr ? `الجزائر في: ${dateStr}` : `Alger, le ${dateStr}`}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-500 block">
              Réf : {verificationToken}
            </span>
            <span className="text-[10px] font-mono text-slate-600 block">
              {isAr ? `ملف رقم: ${fileNumber}` : `Dossier N° : ${fileNumber}`}
            </span>
          </div>
        </div>

        {/* Patient Metadata Banner */}
        <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-300 mb-6 grid grid-cols-4 gap-3 text-xs font-bold">
          <div>
            <span className="text-slate-500 block text-[10px]">{isAr ? 'المعني(ة) بالأمر:' : 'Personne examinée :'}</span>
            <span className="text-slate-900">{patientName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">{isAr ? 'السن / الجنس:' : 'Âge / Sexe :'}</span>
            <span className="text-slate-900">{patientAge || '---'} / {patientGender}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">{isAr ? 'تاريخ الميلاد:' : 'Date de naissance :'}</span>
            <span className="text-slate-900 font-mono">{formattedBirthDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">{isAr ? 'الولي / المرافق:' : 'Tuteur / Représentant :'}</span>
            <span className="text-slate-900">{guardianName}</span>
          </div>
        </div>

        {/* Letter / Report Body Text (Continuous natural flow across pages) */}
        <div className={`text-[11pt] leading-[1.8] whitespace-pre-wrap font-sans text-slate-900 mb-8 min-h-[350px] ${isAr ? 'text-right' : 'text-left'}`}>
          {content}
        </div>

        {/* Footer: Official Seal, Signature & Security QR Code (Preventing break across pages) */}
        <div className="border-t-2 border-slate-300 pt-6 mt-8 flex items-end justify-between print-avoid-break">
          {/* QR Verification Badge */}
          <div className="flex items-center gap-3">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verificationUrl)}`}
              alt="QR Code"
              className="w-16 h-16 border border-slate-300 p-0.5 rounded"
            />
            <div className="text-[9px] text-slate-600 space-y-0.5 font-mono">
              <p className="font-bold text-slate-800">
                {isAr ? 'وثيقة رسمية صادرة عن منظومة PsyPro' : 'Document officiel certifié par PsyPro'}
              </p>
              <p>{verificationToken}</p>
              <p>{isAr ? 'امسح الرمز للتأكد من صحة الوثيقة' : 'Scannez pour vérifier l\'authenticité'}</p>
            </div>
          </div>

          {/* Practitioner Signature & Official Stamp */}
          <div className="flex items-center gap-6 text-center">
            {stampData && (
              <div>
                <img src={stampData} alt="ختم العيادة" className="w-20 h-20 object-contain mx-auto" />
                <span className="text-[9px] text-slate-500 block mt-1 font-bold">
                  {isAr ? 'ختم العيادة المعتمد' : 'Cachet Officiel'}
                </span>
              </div>
            )}
            <div>
              {signatureData ? (
                <img src={signatureData} alt="التوقيع" className="h-12 object-contain mx-auto" />
              ) : (
                <div className="h-12 flex items-center justify-center font-serif italic text-sm">
                  {practitioner?.name || ''}
                </div>
              )}
              <span className="text-[10px] font-bold text-slate-800 block border-t border-slate-400 mt-1 pt-1">
                {isAr ? 'توقيع وخاتم الأخصائي' : 'Signature du Praticien'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SIGNATURE PAD MODAL */}
      {showSignatureModal && (
        <DigitalSignaturePadModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSaveSignature={handleSignatureSaved}
          initialLicense={licenseNumber}
          initialName={practitioner?.name || ''}
        />
      )}
    </div>
  );

  // If rendered as standalone modal
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 space-x-reverse">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  {isAr ? 'إصدار وأرشفة الشهادات والوثائق الطبية' : 'Émission et Archivage des Documents Médicaux'}
                </h3>
                <p className="text-xs text-slate-400">
                  {patientName} ({fileNumber})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-xs font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {mainUiContent}
          </div>
        </div>
      </div>
    );
  }

  return mainUiContent;
}
