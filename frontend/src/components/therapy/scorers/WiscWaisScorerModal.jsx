import React, { useState, useMemo } from 'react';
import {
  Brain,
  Zap,
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
  BarChart2,
  TrendingUp,
  Target,
  HelpCircle
} from 'lucide-react';
import { assessmentApi } from '../../../api';

// =========================================================================
// WECHSLER BATTERIES CONFIGURATION & CONVERSION FORMULAS
// =========================================================================

export const WECHSLER_BATTERIES = {
  'WISC-V': {
    code: 'WISC-V',
    title_ar: 'مقياس وكسلر لذكاء الأطفال (WISC-V)',
    title_fr: 'Échelle d\'Intelligence de Wechsler pour Enfants - 5ème Édition',
    age_range: 'من 6 سنوات إلى 16 سنة و 11 شهراً',
    indices: [
      { id: 'VCI', name_ar: 'الفهم اللفظي (VCI)', subtests: ['SI', 'VC'], color: 'from-blue-500 to-indigo-600' },
      { id: 'VSI', name_ar: 'البصري المكاني (VSI)', subtests: ['BD', 'VP'], color: 'from-indigo-500 to-purple-600' },
      { id: 'FRI', name_ar: 'الاستدلال المائع (FRI)', subtests: ['MR', 'FW'], color: 'from-purple-500 to-pink-600' },
      { id: 'WMI', name_ar: 'الذاكرة العاملة (WMI)', subtests: ['DS', 'PS'], color: 'from-amber-500 to-orange-600' },
      { id: 'PSI', name_ar: 'سرعة المعالجة (PSI)', subtests: ['CD', 'SS'], color: 'from-emerald-500 to-teal-600' },
    ],
    subtests: [
      { id: 'BD', name_ar: 'تصميم المكعبات (Cubes)', index: 'VSI', desc: 'التحليل والتركيب الفضائي البصري الحركي' },
      { id: 'SI', name_ar: 'المتشابهات (Similitudes)', index: 'VCI', desc: 'الاستدلال اللفظي والتفكير المفاهيمي المجرد' },
      { id: 'MR', name_ar: 'المصفوفات (Matrices)', index: 'FRI', desc: 'التفكير المنطقي غير اللفظي والاستدلال الاستقرائي' },
      { id: 'DS', name_ar: 'متتالية الأرقام (Mémoire des chiffres)', index: 'WMI', desc: 'الذاكرة السمعية الفورية والتحويل الذهني' },
      { id: 'CD', name_ar: 'الترميز (Code)', index: 'PSI', desc: 'السرعة النفسية الحركية والذاكرة قصيرة المدى' },
      { id: 'VC', name_ar: 'المفردات (Vocabulaire)', index: 'VCI', desc: 'الحصيلة اللغوية والنمو المعرفي العام' },
      { id: 'FW', name_ar: 'أوزان الأشكال (Balances)', index: 'FRI', desc: 'الاستدلال الكمي والتعادل المنطقي' },
      { id: 'VP', name_ar: 'الألغاز البصرية (Puzzles visuels)', index: 'VSI', desc: 'التكامل البصري الإدراكي بدون أداء حركي' },
      { id: 'PS', name_ar: 'سعة الصور (Mémoire des images)', index: 'WMI', desc: 'الذاكرة البصرية العاملة والتعرف' },
      { id: 'SS', name_ar: 'شطب الرموز (Symboles)', index: 'PSI', desc: 'التمييز البصري والسرعة الانتقائية' },
    ],
    fsiqCoreSubtests: ['BD', 'SI', 'MR', 'DS', 'CD', 'VC', 'FW'],
  },
  'WAIS-IV': {
    code: 'WAIS-IV',
    title_ar: 'مقياس وكسلر لذكاء الراشدين والبالغين (WAIS-IV)',
    title_fr: 'Échelle d\'Intelligence de Wechsler pour Adultes - 4ème Édition',
    age_range: 'من 16 سنة إلى 79 سنة و 11 شهراً',
    indices: [
      { id: 'VCI', name_ar: 'الفهم اللفظي (ICV)', subtests: ['SI', 'VC', 'IN'], color: 'from-blue-600 to-indigo-700' },
      { id: 'PRI', name_ar: 'التنظيم الإدراكي (IRP)', subtests: ['BD', 'MR', 'VP'], color: 'from-indigo-600 to-purple-700' },
      { id: 'WMI', name_ar: 'الذاكرة العاملة (IMT)', subtests: ['DS', 'AR'], color: 'from-amber-600 to-orange-700' },
      { id: 'PSI', name_ar: 'سرعة المعالجة (IVT)', subtests: ['CD', 'SS'], color: 'from-emerald-600 to-teal-700' },
    ],
    subtests: [
      { id: 'BD', name_ar: 'تصميم المكعبات (Cubes)', index: 'PRI', desc: 'التنظيم الإدراكي البصري المكاني' },
      { id: 'SI', name_ar: 'المتشابهات (Similitudes)', index: 'VCI', desc: 'التجريد اللفظي والمفاهيم المشتركة' },
      { id: 'DS', name_ar: 'الأرقام (Mémoire des chiffres)', index: 'WMI', desc: 'الانتباه السمعي والذاكرة العاملة' },
      { id: 'MR', name_ar: 'المصفوفات (Matrices)', index: 'PRI', desc: 'الاستدلال السائل والتفكير المنطقي' },
      { id: 'VC', name_ar: 'المفردات (Vocabulaire)', index: 'VCI', desc: 'القدرة التعبيرية والمخزون الدلالي' },
      { id: 'AR', name_ar: 'الحساب الذهني (Arithmétique)', index: 'WMI', desc: 'حل المشكلات الرياضية والتركيز' },
      { id: 'SS', name_ar: 'البحث في الرموز (Symboles)', index: 'PSI', desc: 'المسح البصري وسرعة القرار' },
      { id: 'VP', name_ar: 'الألغاز البصرية (Puzzles)', index: 'PRI', desc: 'الاستدلال الفضائي والمكاني' },
      { id: 'IN', name_ar: 'المعلومات العامة (Information)', index: 'VCI', desc: 'المعارف المكتسبة من البيئة' },
      { id: 'CD', name_ar: 'الترميز (Code)', index: 'PSI', desc: 'التنسيق البصري الحركي وسرعة الأداء' },
    ],
    fsiqCoreSubtests: ['BD', 'SI', 'DS', 'MR', 'VC', 'AR', 'SS', 'VP', 'IN', 'CD'],
  },
  'WPPSI-III': {
    code: 'WPPSI-III',
    title_ar: 'مقياس وكسلر لذكاء أطفال الروضة (WPPSI-III)',
    title_fr: 'Échelle d\'Intelligence de Wechsler pour la Période Préscolaire',
    age_range: 'من 2.5 إلى 7 سنوات و 3 أشهر',
    indices: [
      { id: 'VIQ', name_ar: 'معامل الذكاء اللفظي (QIV)', subtests: ['INFO', 'VOC', 'REAS'], color: 'from-blue-500 to-indigo-600' },
      { id: 'PIQ', name_ar: 'معامل الذكاء العملي/الأدائي (QIP)', subtests: ['CUBES', 'MAT', 'PICT'], color: 'from-purple-500 to-pink-600' },
      { id: 'PSQ', name_ar: 'السرعة الإجرائية المعرفية (QVT)', subtests: ['SYM', 'COD'], color: 'from-emerald-500 to-teal-600' },
    ],
    subtests: [
      { id: 'INFO', name_ar: 'المعلومات والصور', index: 'VIQ', desc: 'الفهم اللفظي الأولي والمعلومات العامة' },
      { id: 'VOC', name_ar: 'المفردات المصورة واللفظية', index: 'VIQ', desc: 'التسمية الشفهية وتحديد معاني الكلمات' },
      { id: 'REAS', name_ar: 'الاستدلال والتصنيف', index: 'VIQ', desc: 'إدراك العلاقات والمفاهيم البسيطة' },
      { id: 'CUBES', name_ar: 'تركيب المكعبات', index: 'PIQ', desc: 'التآزر البصري الحركي والتنظيم الفضائي' },
      { id: 'MAT', name_ar: 'المصفوفات المصورة', index: 'PIQ', desc: 'التفكير الإدراكي المجرد' },
      { id: 'PICT', name_ar: 'مفاهيم الصور', index: 'PIQ', desc: 'التصنيف البصري الممنهج' },
      { id: 'SYM', name_ar: 'البحث عن الرموز', index: 'PSQ', desc: 'سرعة المسح البصري والانتباه' },
      { id: 'COD', name_ar: 'ترميز الحيوانات والأشكال', index: 'PSQ', desc: 'سرعة المعالجة الحركية والذاكرة السريعة' },
    ],
    fsiqCoreSubtests: ['INFO', 'VOC', 'CUBES', 'MAT', 'PICT', 'SYM'],
  }
};

// Qualitative descriptor helper
export function getWechslerClassification(score) {
  if (score >= 130) return { label: 'موهبة فكرية عالية جداً (Extremely High / Gifted)', color: 'purple', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  if (score >= 120) return { label: 'متفوق ذهنياً (Very High / Superior)', color: 'indigo', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
  if (score >= 110) return { label: 'فوق المتوسط (High Average)', color: 'blue', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  if (score >= 90)  return { label: 'متوسط طبيعي (Average)', color: 'emerald', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  if (score >= 80)  return { label: 'متوسط منخفض (Low Average)', color: 'amber', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  if (score >= 70)  return { label: 'الفئة الحدية / بطء تعلم (Borderline)', color: 'orange', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
  return { label: 'قصور ذهني دال (Extremely Low / ID)', color: 'red', badge: 'bg-red-500/20 text-red-300 border-red-500/30' };
}

// Approximate Percentile lookup from standard score (mean 100, SD 15)
export function getPercentileFromStandard(standard) {
  const z = (standard - 100) / 15;
  // Error function approximation
  const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1.0 - p;
  const pct = Math.round(p * 100);
  return Math.min(99.9, Math.max(0.1, pct));
}

export default function WiscWaisScorerModal({
  isOpen,
  onClose,
  patient,
  patients = [],
  initialPatientId = null,
  initialBattery = 'WISC-V',
  onSaved
}) {
  const [selectedBatteryKey, setSelectedBatteryKey] = useState(initialBattery || 'WISC-V');
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || patient?.id || patients[0]?.id || ''
  );
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('subtests'); // 'subtests' | 'indices' | 'report'
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);

  const battery = WECHSLER_BATTERIES[selectedBatteryKey] || WECHSLER_BATTERIES['WISC-V'];

  // Scaled scores (1 - 19) for subtests (default 10 = average)
  const [subtestScores, setSubtestScores] = useState(() => {
    const init = {};
    battery.subtests.forEach(st => { init[st.id] = 10; });
    return init;
  });

  // Handle battery switch
  const handleBatteryChange = (key) => {
    setSelectedBatteryKey(key);
    const newBattery = WECHSLER_BATTERIES[key];
    const init = {};
    newBattery.subtests.forEach(st => { init[st.id] = 10; });
    setSubtestScores(init);
  };

  const handleSubtestScoreChange = (id, val) => {
    const num = Math.min(19, Math.max(1, parseInt(val, 10) || 1));
    setSubtestScores(prev => ({ ...prev, [id]: num }));
  };

  // Comprehensive computation of indices and FSIQ
  const computedResults = useMemo(() => {
    // 1. Calculate each Index
    const indexResults = battery.indices.map(idx => {
      const subScores = idx.subtests.map(sId => subtestScores[sId] ?? 10);
      const sum = subScores.reduce((a, b) => a + b, 0);
      const count = subScores.length || 1;
      const avg = sum / count;

      // Standard conversion: scaled score average (mean 10, SD 3) converted to standard index (mean 100, SD 15)
      // Index = 100 + ((avg - 10) / 3) * 15 = 100 + (avg - 10) * 5
      let standardScore = Math.round(100 + (avg - 10) * 5);
      standardScore = Math.max(40, Math.min(160, standardScore));

      const percentile = getPercentileFromStandard(standardScore);
      const classification = getWechslerClassification(standardScore);

      return {
        id: idx.id,
        name: idx.name_ar,
        color: idx.color,
        subtests: idx.subtests,
        sumScaled: sum,
        standardScore,
        percentile,
        confidenceInterval: `${standardScore - 4} - ${standardScore + 4}`,
        classification,
      };
    });

    // 2. Calculate Full Scale IQ (FSIQ / QI Total)
    const coreSubtestIds = battery.fsiqCoreSubtests || battery.subtests.map(s => s.id);
    const coreScores = coreSubtestIds.map(id => subtestScores[id] ?? 10);
    const coreSum = coreScores.reduce((a, b) => a + b, 0);
    const coreAvg = coreSum / (coreScores.length || 1);

    let fsiq = Math.round(100 + (coreAvg - 10) * 5);
    fsiq = Math.max(40, Math.min(160, fsiq));

    const fsiqPercentile = getPercentileFromStandard(fsiq);
    const fsiqClassification = getWechslerClassification(fsiq);
    const fsiqCi = `${fsiq - 5} - ${fsiq + 5}`;

    // 3. Discrepancy analysis (Cognitive Strengths & Weaknesses)
    const allIndexScores = indexResults.map(i => i.standardScore);
    const maxIdx = Math.max(...allIndexScores);
    const minIdx = Math.min(...allIndexScores);
    const hasSignificantDiscrepancy = (maxIdx - minIdx) >= 15;

    const strengths = indexResults.filter(i => i.standardScore >= (coreAvg * 5 + 50) + 10 || i.standardScore >= 115);
    const weaknesses = indexResults.filter(i => i.standardScore <= (coreAvg * 5 + 50) - 10 || i.standardScore <= 85);

    return {
      indexResults,
      fsiq,
      fsiqPercentile,
      fsiqClassification,
      fsiqCi,
      hasSignificantDiscrepancy,
      discrepancyDiff: maxIdx - minIdx,
      strengths,
      weaknesses
    };
  }, [battery, subtestScores]);

  // Automated Clinical Report
  const generatedReport = useMemo(() => {
    let txt = `🧠 تقرير تقييم القدرات المعرفية والذكاء الشامل (${battery.code})\n`;
    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `• البطارية المعتمدة: ${battery.title_ar}\n`;
    txt += `• الفئة العمرية المعيارية: ${battery.age_range}\n`;
    txt += `• تاريخ الفحص والتقييم: ${assessmentDate}\n\n`;

    txt += `⭐ النتيجة الإجمالية الكبرى (Full Scale IQ):\n`;
    txt += `  - معامل الذكاء العام الكلي (FSIQ): ${computedResults.fsiq} نقطة\n`;
    txt += `  - الرتبة المئينية (Percentile Rank): المئين ${computedResults.fsiqPercentile}%\n`;
    txt += `  - فترة الثقة 95%: [${computedResults.fsiqCi}]\n`;
    txt += `  - التصنيف السريري المقنن: ${computedResults.fsiqClassification.label}\n\n`;

    txt += `📊 المؤشرات المعرفية الأساسية (Primary Indices):\n`;
    computedResults.indexResults.forEach(idx => {
      txt += `  • ${idx.name}: ${idx.standardScore} نقطة (المئين ${idx.percentile}% | ${idx.classification.label})\n`;
    });

    txt += `\n🔍 تحليل التباين ونقاط القوة والضعف (Cognitive Discrepancy):\n`;
    if (computedResults.hasSignificantDiscrepancy) {
      txt += `  ⚠️ يوجد تباين دال إحصائياً بين المؤشرات (${computedResults.discrepancyDiff} نقطة فرق)، مما يشير إلى أداء غير متجانس.\n`;
    } else {
      txt += `  ✓ الأداء الإدراكي متجانس ومتقارب بين مختلف المجالات المعرفية (فارق ${computedResults.discrepancyDiff} نقطة).\n`;
    }

    if (computedResults.strengths.length > 0) {
      txt += `  + نقاط القوة النسبية: ${computedResults.strengths.map(s => s.name).join('، ')}\n`;
    }
    if (computedResults.weaknesses.length > 0) {
      txt += `  - نقاط الدعم والتأهيل: ${computedResults.weaknesses.map(w => w.name).join('، ')}\n`;
    }

    if (clinicalNotes.trim()) {
      txt += `\n📝 ملاحظات الفاحص والتوصيات السريرية:\n${clinicalNotes}\n`;
    }

    return txt;
  }, [battery, assessmentDate, computedResults, clinicalNotes]);

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
        title: `[${battery.code}] فحص الذكاء والقدرات العامة`,
        assessment_date: assessmentDate,
        results_data: {
          test_code: battery.code,
          test_title: battery.title_ar,
          fsiq: computedResults.fsiq,
          fsiq_percentile: computedResults.fsiqPercentile,
          fsiq_classification: computedResults.fsiqClassification.label,
          indices: computedResults.indexResults,
          subtest_scores: subtestScores,
          notes: clinicalNotes,
          raw_score: computedResults.fsiq,
        },
        diagnostic_conclusion: `${battery.code} FSIQ: ${computedResults.fsiq} (${computedResults.fsiqClassification.label})`,
        recommendations: generatedReport,
      };

      await assessmentApi.create(assessmentData);
      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save Wechsler assessment:', err);
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
              <Brain className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  WECHSLER SCORER & FSIQ CALCULATOR
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  FSIQ + 5 Indices
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                حاسبة ومصحح سلالم وكسلر المعيارية للذكاء ({battery.code})
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

        {/* Battery & Patient Control Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Battery Switch */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-2xl border border-slate-700">
              {Object.keys(WECHSLER_BATTERIES).map((k) => (
                <button
                  key={k}
                  onClick={() => handleBatteryChange(k)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                    selectedBatteryKey === k
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
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
              onClick={() => setActiveTab('subtests')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'subtests' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>الدرجات الموزونة (Subtests)</span>
            </button>
            <button
              onClick={() => setActiveTab('indices')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'indices' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>المؤشرات و FSIQ</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'report' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>التقرير والتحليل السريري</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: SUBTESTS ENTRY */}
          {activeTab === 'subtests' && (
            <div className="space-y-6">
              
              {/* Info Banner */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">إدخال الدرجات الموزونة المعيارية (Scaled Scores: 1 - 19)</h3>
                    <p className="text-[11px] text-slate-300">
                      المتوسط المعياري = 10 نقاط | الانحراف المعياري = 3 نقاط (النطاق السوي الطبيعي: 8 - 12 نقطة).
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
                  {battery.age_range}
                </span>
              </div>

              {/* Subtests Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {battery.subtests.map((st) => {
                  const val = subtestScores[st.id] ?? 10;
                  const isHigh = val >= 13;
                  const isLow = val <= 7;

                  return (
                    <div
                      key={st.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isHigh
                          ? 'bg-indigo-950/20 border-indigo-500/40'
                          : isLow
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-black text-white">{st.name_ar}</span>
                          <span className="text-[10px] text-slate-400 font-mono mr-2">({st.id})</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 font-mono">
                          محور: {st.index}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2.5">
                        <span className="text-[11px] text-slate-400">{st.desc}</span>

                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="19"
                            value={val}
                            onChange={(e) => handleSubtestScoreChange(st.id, e.target.value)}
                            className="w-24 accent-indigo-500 hidden sm:block"
                          />
                          <input
                            type="number"
                            min="1"
                            max="19"
                            value={val}
                            onChange={(e) => handleSubtestScoreChange(st.id, e.target.value)}
                            className={`w-14 bg-slate-900 border rounded-xl py-1 text-center font-bold text-xs focus:outline-none font-mono ${
                              isHigh
                                ? 'border-indigo-500 text-indigo-300'
                                : isLow
                                ? 'border-amber-500 text-amber-300'
                                : 'border-slate-600 text-white'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 2: INDICES & FSIQ PROFILE */}
          {activeTab === 'indices' && (
            <div className="space-y-6">
              
              {/* Grand FSIQ Master Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                      FULL SCALE IQ (QI TOTAL)
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${computedResults.fsiqClassification.badge}`}>
                      {computedResults.fsiqClassification.label}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    معامل الذكاء العام الكلي (FSIQ): {computedResults.fsiq} نقطة
                  </h3>
                  <p className="text-xs text-slate-300">
                    الرتبة المئينية: أعلى من <strong>{computedResults.fsiqPercentile}%</strong> من الأقران في نفس الفئة العمرية | فترة الثقة 95%: [{computedResults.fsiqCi}]
                  </p>
                </div>

                <div className="flex items-center justify-center shrink-0">
                  <div className="w-24 h-24 rounded-3xl bg-indigo-600/20 border-2 border-indigo-500/50 flex flex-col items-center justify-center text-center shadow-inner">
                    <span className="text-3xl font-black text-white font-mono">{computedResults.fsiq}</span>
                    <span className="text-[10px] text-indigo-300 font-bold">FSIQ</span>
                  </div>
                </div>
              </div>

              {/* Indices Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>المؤشرات المعرفية الأساسية (Primary Index Scales)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {computedResults.indexResults.map((idx) => {
                    return (
                      <div key={idx.id} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{idx.name}</span>
                          <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                            {idx.standardScore} نقطة
                          </span>
                        </div>

                        {/* Progress Bar Representation */}
                        <div className="space-y-1">
                          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(10, ((idx.standardScore - 40) / 120) * 100))}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>40</span>
                            <span className="text-slate-300 font-bold">100 (المتوسط)</span>
                            <span>160</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">المئين: <strong className="text-white font-mono">{idx.percentile}%</strong></span>
                          <span className="text-indigo-300 text-[10px] font-bold">{idx.classification.label.split('(')[0]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cognitive Discrepancy Alert */}
              <div className={`p-4 rounded-2xl border ${
                computedResults.hasSignificantDiscrepancy
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-emerald-950/20 border-emerald-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    computedResults.hasSignificantDiscrepancy ? 'text-amber-400' : 'text-emerald-400'
                  }`} />
                  <span className="text-xs font-bold text-white">
                    {computedResults.hasSignificantDiscrepancy
                      ? `تحليل التباين: أداء معرفي غير متجانس (فارق ${computedResults.discrepancyDiff} نقطة بين المؤشرات)`
                      : `تحليل التباين: أداء معرفي متوازن ومتجانس (فارق ${computedResults.discrepancyDiff} نقطة)`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                  {computedResults.hasSignificantDiscrepancy
                    ? 'التباين الواسع بين المؤشرات يقتضي تفسير معامل الذكاء العام FSIQ بحذر، والتركيز على نقاط القوة المستقلة والتدخل في المؤشرات الضعيفة.'
                    : 'تقارب نتائج المؤشرات يؤكد مصداقية معامل الذكاء العام الكلي كمؤشر دقيق وموحد للقدرات العقلية العامة.'}
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: REPORT & NARRATIVE */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>التقرير النفسي-المتري لحصيلة وكسلر ({battery.code})</span>
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
                <label className="text-xs font-bold text-slate-300">ملاحظات الأخصائي السريري الإضافية وتوجيهات PEI:</label>
                <textarea
                  rows="3"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="سجل أي تكييفات مدرسية مطلوبة، استراتيجيات دعم الانتباه أو الذاكرة العاملة..."
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
                تم توثيق نتيجة {battery.code} في ملف المريض بنجاح!
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
