import React, { useState, useMemo } from 'react';
import {
  Brain,
  Award,
  CheckCircle2,
  AlertTriangle,
  Save,
  Printer,
  X,
  User,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Activity,
  Sliders,
  Copy,
  Check,
  FileText,
  HelpCircle,
  TrendingUp,
  Info
} from 'lucide-react';
import { assessmentApi } from '../../../api';

// =========================================================================
// MMPI-2 NORMATIVE CONSTANTS & CLINICAL SCALE DEFINITIONS
// =========================================================================

export const MMPI2_SCALES = [
  // Validity Scales
  { id: 'L', name_ar: 'مقياس الكذب (L)', name_fr: 'Échelle L (Mensonge)', isValidity: true, maxRaw: 15, mean: 4.2, sd: 2.5, kFactor: 0, desc: 'يكشف محاولة الظهور بمظهر مثالي غير واقعي وتجنب الاعتراف بنقائص بشرية شائعة.' },
  { id: 'F', name_ar: 'مقياس الشك/عدم النمطية (F)', name_fr: 'Échelle F (Infréquence)', isValidity: true, maxRaw: 60, mean: 5.1, sd: 3.8, kFactor: 0, desc: 'يكشف المبالغة في الأعراض، الصراخ طلباً للمساعدة، أو الإجابات العشوائية.' },
  { id: 'K', name_ar: 'مقياس التصحيح/الدفاعية (K)', name_fr: 'Échelle K (Correction)', isValidity: true, maxRaw: 30, mean: 15.0, sd: 5.2, kFactor: 0, desc: 'يقيس التكتم والدفاعية أو الانفتاح الشديد أثناء التقييم، ويُستخدم لتعديل 5 مقاييس إكلينيكية.' },

  // Clinical Scales
  { id: 'Hs', num: 1, name_ar: '1. توهم المرض (Hs)', name_fr: '1. Hypochondrie', maxRaw: 32, mean: 12.5, sd: 4.3, kFactor: 0.5, desc: 'الانشغال المفرط بصحة الجسد، الشكاوى الجسدية غير العضوية، والقلق الصحي.' },
  { id: 'D', num: 2, name_ar: '2. الاكتئاب (D)', name_fr: '2. Dépression', maxRaw: 57, mean: 20.1, sd: 5.4, kFactor: 0, desc: 'الحزن، اليأس، تدني الروح المعنوية، التشاؤم، وبطء النشاط النفسي الحركي.' },
  { id: 'Hy', num: 3, name_ar: '3. الهستيريا التحويلية (Hy)', name_fr: '3. Hystérie', maxRaw: 60, mean: 21.0, sd: 5.8, kFactor: 0, desc: 'ردود فعل جسدية عند مواجهة الضغوط النفسية مع تجنب المسؤولية وإنكار المشكلات.' },
  { id: 'Pd', num: 4, name_ar: '4. الانحراف السيكوباتي (Pd)', name_fr: '4. Déviation Psychopathique', maxRaw: 50, mean: 16.2, sd: 4.6, kFactor: 0.4, desc: 'الصراع مع السلطة والقوانين، الاندفاع، التمرد الاجتماعي، وصعوبة تعلم العواقب.' },
  { id: 'Mf', num: 5, name_ar: '5. الذكورة / الأنوثة (Mf)', name_fr: '5. Masculinité-Féminité', maxRaw: 56, mean: 27.5, sd: 5.0, kFactor: 0, desc: 'الاهتمامات الجندرية، الحساسية الجمالية، والأنماط السلوكية التقليدية.' },
  { id: 'Pa', num: 6, name_ar: '6. البارانويا والارتياب (Pa)', name_fr: '6. Paranoïa', maxRaw: 40, mean: 11.8, sd: 3.5, kFactor: 0, desc: 'الحساسية المفرطة، الشك في نوايا الآخرين، أفكار الاضطهاد والعظمة.' },
  { id: 'Pt', num: 7, name_ar: '7. السيكاستينيا / الوسواس (Pt)', name_fr: '7. Psychasthénie', maxRaw: 48, mean: 15.3, sd: 5.2, kFactor: 1.0, desc: 'القلق، الشك، الوساوس والأفعال القهرية، لوم الذات، والمخاوف غير المبررة.' },
  { id: 'Sc', num: 8, name_ar: '8. الفصام وتفكك التفكير (Sc)', name_fr: '8. Schizophrénie', maxRaw: 78, mean: 14.2, sd: 6.5, kFactor: 1.0, desc: 'الانسحاب الاجتماعي، أفكار غير اعتيادية، اضطراب الإدراك والواقع، والغرابة.' },
  { id: 'Ma', num: 9, name_ar: '9. الهوس الخفيف (Ma)', name_fr: '9. Hypomanie', maxRaw: 46, mean: 17.5, sd: 4.8, kFactor: 0.2, desc: 'فرط النشاط، تطاير الأفكار، الاندفاع، عدم الاستقرار، وارتفاع المزاج غير الواقعي.' },
  { id: 'Si', num: 0, name_ar: '0. الانطواء الاجتماعي (Si)', name_fr: '0. Introversion Sociale', maxRaw: 69, mean: 27.0, sd: 7.2, kFactor: 0, desc: 'تجنب المواقف الاجتماعية، الخجل، التحفظ، وتفضيل العزلة على التفاعل.' },
];

export const TWO_POINT_CODES = {
  '1-2': { title: 'كود 1-2 / 2-1 (عصاب جسدي اكتئابي)', desc: 'شكاوى بدنية متعددة مصحوبة بحزن وتثبيط نفسي حركي، مع صعوبة في التعبير المباشر عن الانفعالات.' },
  '1-3': { title: 'كود 1-3 / 3-1 (الثالوث العصابي / التحويل)', desc: 'تحويل الصراعات النفسية إلى أعراض جسدية (Conversion)، حاجة قوية للتعاطف، وإنكار العوامل النفسية وراء التعب.' },
  '2-3': { title: 'كود 2-3 / 3-2 (الاكتئاب الهستيري / الوهن)', desc: 'فقدان النشاط والمبادرة، لامبالاة، وتناوب بين الرغبة في الاهتمام والشعور بالإحباط واليأس.' },
  '2-7': { title: 'كود 2-7 / 7-2 (الاكتئاب والقلق الوسواسي)', desc: 'قلق متواصل وتأنيب ذاتي حاد، وساوس تشكيكية، خمول واكتئاب سريري دال مع توقع الكوارث.' },
  '2-8': { title: 'كود 2-8 / 8-2 (الاكتئاب الفصامي والانسحاب)', desc: 'انسحاب وجداني واجتماعي حاد، مشاعر غربة وتبدد، وتثبيط حركي ذهني عميق.' },
  '3-4': { title: 'كود 3-4 / 4-3 (الصراع مع التعبير عن الغضب)', desc: 'تراكم الغضب والعداء المكتوم خلف مظهر ودود، مع نوبات غضب انفجارية متقطعة ولوم الآخرين.' },
  '4-6': { title: 'كود 4-6 / 6-4 (السيكوباثية الارتيابية)', desc: 'عدائية وتشكيك في المحيط، لوم الآخرين على المشاكل الشخصية، والاستياء الشديد من التوجيه أو النصح.' },
  '4-9': { title: 'كود 4-9 / 9-4 (السلوك المضاد للمجتمع والاندفاعية)', desc: 'نزعة قوية للبحث عن الإثارة، ضعف كف الاستجابة والتعاطف، صراع مع القواعد، وسلوكيات اندفاعية.' },
  '6-8': { title: 'كود 6-8 / 8-6 (البارانويا الفصامية)', desc: 'أفكار اضطهادية وارتيابية مع تفكك أو غرابة في التفكير، حذر مفرط وانسحاب اجتماعي دفاعي.' },
  '7-8': { title: 'كود 7-8 / 8-7 (العصاب الفصامي والاضطراب المعرفي)', desc: 'صعوبة شديدة في التركيز واتخاذ القرار، قلق وجودي جارف، مشاعر تشوه في الذات وشلل في الفاعلية.' },
  '8-9': { title: 'كود 8-9 / 9-8 (الذهان الهوسي الحاد)', desc: 'أفكار عظمة غير واقعية، طاقة عالية وتشتت حاد، سلوكيات غريبة وغير متوقعة تتطلب حماية وتدخلاً طبياً فورياً.' },
};

export default function Mmpi2ScorerModal({
  isOpen,
  onClose,
  patient,
  patients = [],
  initialPatientId = null,
  onSaved
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || patient?.id || patients[0]?.id || ''
  );
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('entry'); // 'entry' | 'profile' | 'report'
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);

  // Raw scores state for the 13 scales
  const [rawScores, setRawScores] = useState({
    L: 4, F: 5, K: 15,
    Hs: 12, D: 20, Hy: 21, Pd: 16, Mf: 27,
    Pa: 12, Pt: 15, Sc: 14, Ma: 17, Si: 27
  });

  const handleRawChange = (scaleId, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setRawScores(prev => ({ ...prev, [scaleId]: num }));
  };

  // K Value
  const kVal = rawScores.K || 0;

  // Compute K-corrected raw scores and T-scores
  const computedData = useMemo(() => {
    const scales = {};
    const tScores = {};

    MMPI2_SCALES.forEach(sc => {
      const raw = rawScores[sc.id] ?? 0;
      let kCorrected = raw;
      if (sc.kFactor > 0) {
        kCorrected = raw + Math.round(sc.kFactor * kVal);
      }

      // Calculate T-Score: T = 50 + 10 * ((Score - Mean) / SD)
      let t = Math.round(50 + 10 * ((kCorrected - sc.mean) / sc.sd));
      t = Math.max(30, Math.min(120, t)); // Clamp standard T bounds

      scales[sc.id] = {
        ...sc,
        raw,
        kCorrected,
        tScore: t,
        isElevated: t >= 65,
        isVeryElevated: t >= 75,
        isLow: t < 40,
      };
      tScores[sc.id] = t;
    });

    // Validity Profile Check
    const lT = tScores.L;
    const fT = tScores.F;
    const kT = tScores.K;
    let validityStatus = 'صالح وموثوق (Valid Profile)';
    let validityColor = 'emerald';
    let validityNotes = 'مؤشرات الصدق تشير إلى تعاون المفحوص واستجابات صادقة وممثلة لحالته.';

    if (fT >= 80) {
      validityStatus = 'ملف مشكوك في صدقه / مبالغة بالأعراض (Fake Bad / Cry for Help)';
      validityColor = 'red';
      validityNotes = 'ارتفاع حاد في مقياس F (T>=80) يعكس إما مبالغة متعمدة بالأعراض أو نداء استغاثة حرج أو عشوائية الإجابات.';
    } else if (lT >= 70 && kT >= 65) {
      validityStatus = 'ملف دفاعي مفرط (Defensive / Fake Good)';
      validityColor = 'amber';
      validityNotes = 'ارتفاع مقياسي L و K يعكس إنكاراً مفرطاً للمشكلات ورغبة قوية في الظهور بصورة مثالية متكلفة.';
    }

    // Determine Top 2 Clinical Scales (excluding Mf and Si for code type)
    const clinicalIds = ['Hs', 'D', 'Hy', 'Pd', 'Pa', 'Pt', 'Sc', 'Ma'];
    const sortedClinical = [...clinicalIds].sort((a, b) => (tScores[b] || 0) - (tScores[a] || 0));
    const top1 = sortedClinical[0];
    const top2 = sortedClinical[1];

    const num1 = scales[top1]?.num;
    const num2 = scales[top2]?.num;
    const codeA = `${num1}-${num2}`;
    const codeB = `${num2}-${num1}`;
    const codeInfo = TWO_POINT_CODES[codeA] || TWO_POINT_CODES[codeB] || null;

    return {
      scales,
      tScores,
      validityStatus,
      validityColor,
      validityNotes,
      top1: scales[top1],
      top2: scales[top2],
      twoPointCode: `${num1}-${num2}`,
      codeInfo
    };
  }, [rawScores, kVal]);

  // Generate automated clinical report text
  const generatedReport = useMemo(() => {
    const elevatedScales = Object.values(computedData.scales)
      .filter(s => !s.isValidity && s.tScore >= 65)
      .map(s => `${s.name_ar} (T=${s.tScore})`);

    let txt = `📋 تقرير التقييم الإكلينيكي لاستبيان مينيسوتا للشخصية (MMPI-2)\n`;
    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `• تاريخ الفحص: ${assessmentDate}\n`;
    txt += `• حالة صلاحية البروتوكول: ${computedData.validityStatus}\n`;
    txt += `  ملاحظة الصدق: ${computedData.validityNotes}\n\n`;

    txt += `📊 الدرجات التائية لمقاييس الصدق:\n`;
    txt += `  - الكذب (L): T=${computedData.tScores.L} (خام: ${rawScores.L})\n`;
    txt += `  - عدم النمطية (F): T=${computedData.tScores.F} (خام: ${rawScores.F})\n`;
    txt += `  - الدفاعية (K): T=${computedData.tScores.K} (خام: ${rawScores.K})\n\n`;

    txt += `🎯 أهم الارتفاعات الإكلينيكية (T >= 65):\n`;
    if (elevatedScales.length > 0) {
      elevatedScales.forEach(s => {
        txt += `  - ${s}\n`;
      });
    } else {
      txt += `  - لا توجد مقاييس متجاوزة للعتبة الإكلينيكية الحرجة (T < 65)، الملف ضمن الحدود السوية.\n`;
    }

    if (computedData.codeInfo) {
      txt += `\n🔑 النمط التشخيصي الثنائي (Two-Point Code: ${computedData.twoPointCode}):\n`;
      txt += `  • ${computedData.codeInfo.title}\n`;
      txt += `  • التفسير العيادي: ${computedData.codeInfo.desc}\n`;
    }

    if (clinicalNotes.trim()) {
      txt += `\n📝 ملاحظات ومسارات الفاحص السريرية:\n${clinicalNotes}\n`;
    }

    return txt;
  }, [computedData, rawScores, assessmentDate, clinicalNotes]);

  // Save to Backend API
  const handleSaveAssessment = async () => {
    if (!selectedPatientId) {
      alert('يرجى اختيار ملف المريض أولاً.');
      return;
    }

    setSaving(true);
    try {
      const assessmentData = {
        patient_id: selectedPatientId,
        type: 'psychometric_eval',
        title: `[MMPI-2] استبيان مينيسوتا المتعدد الأوجه للشخصية`,
        assessment_date: assessmentDate,
        results_data: {
          test_code: 'MMPI-2',
          test_title: 'استبيان مينيسوتا للشخصية (MMPI-2)',
          raw_scores: rawScores,
          t_scores: computedData.tScores,
          two_point_code: computedData.twoPointCode,
          validity_status: computedData.validityStatus,
          notes: clinicalNotes,
          raw_score: computedData.tScores.D || 50,
        },
        diagnostic_conclusion: `MMPI-2 Code ${computedData.twoPointCode} - ${computedData.validityStatus}`,
        recommendations: generatedReport,
      };

      await assessmentApi.create(assessmentData);
      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save MMPI-2 assessment:', err);
      alert('حدث خطأ أثناء حفظ التقييم: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setSaving(false);
    }
  };

  const copyReportToClipboard = () => {
    navigator.clipboard.writeText(generatedReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto font-sans" dir="rtl">
      <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-indigo-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Award className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  MMPI-2 CLINICAL SCORER
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  K-Correction Auto
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                مصحح استبيان مينيسوتا متعدد الأوجه للشخصية (MMPI-2)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Control Bar (Patient & Mode) */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300 font-medium">المريض:</span>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name || `${p.first_name} ${p.last_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
            <button
              onClick={() => setActiveTab('entry')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'entry'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>إدخال الدرجات الخام</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>المنحنى التائي (T-Profile)</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'report'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>التقرير والتحليل العيادي</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: RAW SCORES ENTRY */}
          {activeTab === 'entry' && (
            <div className="space-y-6">
              
              {/* Validity Scales Section */}
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span>مقاييس الصدق والتحقق (Validity Scales)</span>
                  </h3>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    computedData.validityColor === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : computedData.validityColor === 'amber'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {computedData.validityStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MMPI2_SCALES.filter(s => s.isValidity).map(s => {
                    const tVal = computedData.tScores[s.id];
                    return (
                      <div key={s.id} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{s.name_ar}</span>
                          <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                            tVal >= 65 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            T = {tVal}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">الدرجة الخام (0-{s.maxRaw}):</span>
                          <input
                            type="number"
                            min="0"
                            max={s.maxRaw}
                            value={rawScores[s.id]}
                            onChange={(e) => handleRawChange(s.id, e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-center font-bold text-white text-xs focus:border-indigo-500 focus:outline-none font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">{s.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 10 Clinical Scales */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>المقاييس الإكلينيكية العشرة (Clinical Scales 1 - 0)</span>
                  </h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> طبيعي (T &lt; 65)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> دال إكلينيكياً (T &ge; 65)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MMPI2_SCALES.filter(s => !s.isValidity).map(s => {
                    const tVal = computedData.tScores[s.id];
                    const kBonus = s.kFactor > 0 ? Math.round(s.kFactor * kVal) : 0;
                    const finalRaw = (rawScores[s.id] || 0) + kBonus;

                    return (
                      <div
                        key={s.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          tVal >= 65
                            ? 'bg-red-950/20 border-red-500/40 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">{s.name_ar}</span>
                          <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg ${
                            tVal >= 65
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            T = {tVal}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">الدرجة الخام:</span>
                            <input
                              type="number"
                              min="0"
                              max={s.maxRaw}
                              value={rawScores[s.id]}
                              onChange={(e) => handleRawChange(s.id, e.target.value)}
                              className="w-14 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-center font-bold text-white text-xs focus:border-indigo-500 focus:outline-none font-mono"
                            />
                          </div>

                          {s.kFactor > 0 && (
                            <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              + {s.kFactor}K ({kBonus}) = {finalRaw}
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{s.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE GRAPH (T-SCORE CHART) */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>الملف النفسي التائي الكلاسيكي (MMPI-2 Clinical Profile)</span>
                  </h3>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-red-400 font-bold">خط القطع الإكلينيكي: T = 65</span>
                    <span className="text-slate-400">المتوسط المعياري: T = 50</span>
                  </div>
                </div>

                {/* SVG PROFILE CHART */}
                <div className="w-full overflow-x-auto py-2">
                  <div className="min-w-[650px] h-72 relative">
                    <svg className="w-full h-full" viewBox="0 0 700 240">
                      {/* Grid Lines */}
                      {[30, 40, 50, 60, 65, 70, 80, 90, 100].map((level) => {
                        const y = 220 - ((level - 30) / (100 - 30)) * 190;
                        const isCutoff = level === 65;
                        const isMean = level === 50;

                        return (
                          <g key={level}>
                            <line
                              x1="40"
                              y1={y}
                              x2="680"
                              y2={y}
                              stroke={isCutoff ? '#ef4444' : isMean ? '#6366f1' : '#334155'}
                              strokeWidth={isCutoff ? '2' : isMean ? '1.5' : '1'}
                              strokeDasharray={isCutoff ? '4 2' : undefined}
                              opacity={isCutoff || isMean ? '0.8' : '0.4'}
                            />
                            <text
                              x="32"
                              y={y + 3}
                              textAnchor="end"
                              className={`text-[9px] font-mono font-bold ${
                                isCutoff ? 'fill-red-400' : isMean ? 'fill-indigo-300' : 'fill-slate-500'
                              }`}
                            >
                              {level}
                            </text>
                          </g>
                        );
                      })}

                      {/* Line separating Validity from Clinical */}
                      <line x1="180" y1="20" x2="180" y2="215" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />

                      {/* Plot Validity Points & Polyline */}
                      {(() => {
                        const valScales = MMPI2_SCALES.filter(s => s.isValidity);
                        const points = valScales.map((s, idx) => {
                          const x = 65 + idx * 45;
                          const t = computedData.tScores[s.id] || 50;
                          const y = 220 - ((Math.min(100, Math.max(30, t)) - 30) / 70) * 190;
                          return `${x},${y}`;
                        }).join(' ');

                        return (
                          <>
                            <polyline fill="none" stroke="#38bdf8" strokeWidth="2.5" points={points} />
                            {valScales.map((s, idx) => {
                              const x = 65 + idx * 45;
                              const t = computedData.tScores[s.id] || 50;
                              const y = 220 - ((Math.min(100, Math.max(30, t)) - 30) / 70) * 190;
                              return (
                                <g key={s.id}>
                                  <circle cx={x} cy={y} r="5" fill="#0284c7" stroke="#fff" strokeWidth="1.5" />
                                  <text x={x} y={y - 8} textAnchor="middle" className="text-[10px] font-bold font-mono fill-sky-300">
                                    {t}
                                  </text>
                                  <text x={x} y="235" textAnchor="middle" className="text-[10px] font-bold fill-slate-300">
                                    {s.id}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}

                      {/* Plot Clinical Points & Polyline */}
                      {(() => {
                        const clinScales = MMPI2_SCALES.filter(s => !s.isValidity);
                        const points = clinScales.map((s, idx) => {
                          const x = 215 + idx * 47;
                          const t = computedData.tScores[s.id] || 50;
                          const y = 220 - ((Math.min(100, Math.max(30, t)) - 30) / 70) * 190;
                          return `${x},${y}`;
                        }).join(' ');

                        return (
                          <>
                            <polyline fill="none" stroke="#818cf8" strokeWidth="2.5" points={points} />
                            {clinScales.map((s, idx) => {
                              const x = 215 + idx * 47;
                              const t = computedData.tScores[s.id] || 50;
                              const y = 220 - ((Math.min(100, Math.max(30, t)) - 30) / 70) * 190;
                              const isHigh = t >= 65;

                              return (
                                <g key={s.id}>
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="5.5"
                                    fill={isHigh ? '#ef4444' : '#6366f1'}
                                    stroke="#fff"
                                    strokeWidth="1.5"
                                  />
                                  <text
                                    x={x}
                                    y={y - 8}
                                    textAnchor="middle"
                                    className={`text-[10px] font-bold font-mono ${
                                      isHigh ? 'fill-red-400' : 'fill-indigo-300'
                                    }`}
                                  >
                                    {t}
                                  </text>
                                  <text x={x} y="235" textAnchor="middle" className="text-[10px] font-bold fill-slate-300">
                                    {s.num ?? s.id}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                {/* Two-Point Code Banner */}
                {computedData.codeInfo ? (
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black text-amber-300">
                        النمط التشخيصي البارز (Two-Point Code: {computedData.twoPointCode})
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{computedData.codeInfo.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{computedData.codeInfo.desc}</p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs text-center">
                    البروفيل الإكلينيكي لا يتضمن ارتفاعاً متزامناً يتجاوز عتبة T=65 لنَمط ثنائي معروف، والأداء الإجمالي ضمن الحدود المقبولة.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REPORT & NARRATIVE */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>التقرير والتحليل السريري الجاهز للتضمين بالحسابات والحصيلة</span>
                </h3>
                <button
                  onClick={copyReportToClipboard}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReport ? 'تم النسخ!' : 'نسخ التقرير'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {generatedReport}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">ملاحظات الطبيب / الأخصائي السريري الإضافية:</label>
                <textarea
                  rows="3"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="أضف أي انطباعات سلوكية أثناء المقابلة أو مؤشرات مساعدة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {saveSuccess && (
              <span className="text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                تم توثيق نتيجة MMPI-2 في ملف المريض بنجاح!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveAssessment}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جارٍ الحفظ...' : 'حفظ في ملف المريض والحصيلة ⚡'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
