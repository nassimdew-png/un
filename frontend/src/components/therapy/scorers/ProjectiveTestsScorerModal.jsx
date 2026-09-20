import React, { useState, useMemo } from 'react';
import {
  Brain,
  Eye,
  BookOpen,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Save,
  Printer,
  X,
  User,
  Clock,
  Sparkles,
  Copy,
  Check,
  FileText,
  HelpCircle,
  Award
} from 'lucide-react';
import { assessmentApi } from '../../../api';

// 10 Standard Rorschach Inkblot Cards
export const RORSCHACH_PLANCHES = [
  { id: 1, name: 'لوحة I (أسود ورمادي)', desc: 'كتلة مركزية - الخفاش أو الفراشة - قياس الاستجابة للموقف الجديد وغير المألوف.' },
  { id: 2, name: 'لوحة II (أسود وأحمر)', desc: 'بقعتان داكنتان ونقاط حمراء - قياس إدارة الانفعال والاندفاعات العاطفية والعدوانية.' },
  { id: 3, name: 'لوحة III (أسود وأحمر - أشكال بشرية)', desc: 'شخصيتان بشريتان متفاعلتان - قياس التفاعل الاجتماعي وتحديد الهوية والعلاقات بالموضوع.' },
  { id: 4, name: 'لوحة IV (رمادية داكنة ضخمة)', desc: 'لوحة الأب والرمز الذكوري والوحش - إدراك السلطة والقلق والقوة.' },
  { id: 5, name: 'لوحة V (سوداء منسجمة)', desc: 'الفراشة السهلة - فحص التماسك واستبصار الواقع المشترك والاستجابة البسيطة (Ban).' },
  { id: 6, name: 'لوحة VI (داكنة مركبة)', desc: 'اللوحة الجنسية والرمزية - فحص التمايز الجندري والعلاقات الحميمة.' },
  { id: 7, name: 'لوحة VII (رمادية فاتحة مفتوحة)', desc: 'لوحة الأمومة والاحتواء والأنوثة - فحص علاقة التعلق الأولية والأمن الداخلي.' },
  { id: 8, name: 'لوحة VIII (ألوان باستيل كاملة)', desc: 'حيوانان متسلقان وألوان رقيقة - التكيف مع المثيرات الانفعالية والمشاعر المتنوعة.' },
  { id: 9, name: 'لوحة IX (ألوان مائية مجردة ومبهمة)', desc: 'بنية غير منتظمة وألوان ممتزجة - قياس تحمل الإحباط وتنظيم القلق الغامض.' },
  { id: 10, name: 'لوحة X (تعدد ألوان متفرقة مبهجة)', desc: 'بقع متعددة ومبهجة - القدرة على التجميع والتحليل والتكامل النفسي الختامي.' },
];

// Key TAT Cards
export const TAT_PLANCHES = [
  { id: '1', title: 'لوحة 1 (الصبي والكمان)', theme: 'الطموح، التوقعات الأبوية، تحمل المسؤولية أو العجز والاستسلام أمام المهمة.' },
  { id: '2', title: 'لوحة 2 (المشهد العائلي والريفي)', theme: 'الصراع بين الاستقلالية والتقاليد، الانفصال عن الأسرة والمستقبل المهني.' },
  { id: '3BM', title: 'لوحة 3BM (الشخص المنحني على الأريكة)', theme: 'اليأس، الذنب، الاكتئاب، أو تفريغ الحزن وطلب المساعدة.' },
  { id: '4', title: 'لوحة 4 (الرجل والمتحفظة)', theme: 'العلاقات العاطفية، الصراع بين الغضب والتعقل، الإغراء والمواجهة.' },
  { id: '6BM', title: 'لوحة 6BM (الابن وأمه المسنة)', theme: 'علاقة الأم بالابن، الاستقلال، الشعور بالذنب حيال الهجر أو التمرد.' },
  { id: '7BM', title: 'لوحة 7BM (الرجل الأكبر والناشئ)', theme: 'السلطة الأبوية، التوجيه، التوافق مع النموذج الذكوري الناصح.' },
  { id: '8BM', title: 'لوحة 8BM (مشهد الجراحة والبندقية)', theme: 'العدوان، الخوف من الأذى الجسدي (خصاء)، والطموح التسامي (أن يصبح جراحاً).' },
  { id: '13MF', title: 'لوحة 13MF (المرأة في السرير والرجل)', theme: 'الصراع الجنسي، الذنب، الفقدان، وديناميات العلاقة الزوجية.' },
  { id: '16', title: 'لوحة 16 (اللوحة البيضاء الخالية)', theme: 'إسقاط حر محض بدون أي مثير - صورة الذات والعالم الوجداني الداخلي.' },
];

export default function ProjectiveTestsScorerModal({
  isOpen,
  onClose,
  patient,
  patients = [],
  initialPatientId = null,
  initialTest = 'RORSCHACH',
  onSaved
}) {
  const [selectedTestKey, setSelectedTestKey] = useState(initialTest || 'RORSCHACH');
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || patient?.id || patients[0]?.id || ''
  );
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'report'
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);

  // Rorschach State per planche
  const [rorschachData, setRorschachData] = useState(() => {
    const init = {};
    RORSCHACH_PLANCHES.forEach(p => {
      init[p.id] = {
        latencySec: 15,
        responsesCount: 2,
        mode: 'G', // G, D, Dd, Dbl
        determinant: 'F+', // F+, F-, K, C, FC, M
        content: 'A', // A, H, Anat, Sang, Obj
        isBan: true,
        notes: '',
      };
    });
    return init;
  });

  // TAT State per planche
  const [tatData, setTatData] = useState(() => {
    const init = {};
    TAT_PLANCHES.forEach(p => {
      init[p.id] = {
        hero: 'بطل متعاون يسعى لتحقيق ذاته',
        needs: 'حاجة للإنجاز والاستقلال',
        pressures: 'توقعات أسرية وقيود بيئية',
        defenses: 'العقلنة والتسامي الإيجابي',
        outcome: 'نهاية إيجابية متفائلة مع بذل جهد',
      };
    });
    return init;
  });

  const handleRorschachChange = (pId, field, val) => {
    setRorschachData(prev => ({
      ...prev,
      [pId]: { ...prev[pId], [field]: val }
    }));
  };

  const handleTatChange = (pId, field, val) => {
    setTatData(prev => ({
      ...prev,
      [pId]: { ...prev[pId], [field]: val }
    }));
  };

  // Compute Rorschach Psychogram summary
  const rorschachSummary = useMemo(() => {
    let totalR = 0;
    let fPlusCount = 0;
    let fMinusCount = 0;
    let aCount = 0;
    let hCount = 0;
    let mCount = 0;
    let cCount = 0;

    Object.values(rorschachData).forEach(item => {
      const count = Number(item.responsesCount) || 1;
      totalR += count;
      if (item.determinant === 'F+') fPlusCount += count;
      if (item.determinant === 'F-') fMinusCount += count;
      if (item.determinant === 'M' || item.determinant === 'K') mCount += count;
      if (item.determinant === 'C' || item.determinant === 'FC') cCount += count;
      if (item.content === 'A') aCount += count;
      if (item.content === 'H') hCount += count;
    });

    const totalF = fPlusCount + fMinusCount;
    const fPlusPercent = totalF > 0 ? Math.round((fPlusCount / totalF) * 100) : 80;
    const animalPercent = totalR > 0 ? Math.round((aCount / totalR) * 100) : 45;

    let realityIndex = {
      label: 'استبصار واقعي متماسك (F+ > 70%)',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    };
    if (fPlusPercent < 55) {
      realityIndex = {
        label: 'اضطراب في استبصار الواقع وهشاشة منطقية (F+ < 55%)',
        badge: 'bg-red-500/20 text-red-300 border-red-500/30'
      };
    }

    return {
      totalR,
      fPlusPercent,
      animalPercent,
      mCount,
      cCount,
      tri: `${mCount} : ${cCount}`,
      realityIndex
    };
  }, [rorschachData]);

  // Automated Report Text
  const generatedReport = useMemo(() => {
    if (selectedTestKey === 'RORSCHACH') {
      let txt = `🪞 تقرير الفحص الإسقاطي المعمق - رائز رورشاخ لبقع الحبر (Rorschach)\n`;
      txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      txt += `• تاريخ الفحص: ${assessmentDate}\n`;
      txt += `• مجموع الاستجابات الكلي (R): ${rorschachSummary.totalR} استجابة\n`;
      txt += `• نسبة التماسك واستبصار الواقع (F+%): ${rorschachSummary.fPlusPercent}%\n`;
      txt += `  التشخيص: ${rorschachSummary.realityIndex.label}\n`;
      txt += `• نسبة المحتوى الحيواني (A%): ${rorschachSummary.animalPercent}%\n`;
      txt += `• نمط الرنين الوجداني (TRI: M / C): ${rorschachSummary.tri}\n\n`;

      txt += `📑 ملخص استجابات البطاقات الـ 10:\n`;
      RORSCHACH_PLANCHES.forEach(p => {
        const item = rorschachData[p.id];
        txt += `  • ${p.name}: زمن رجع ${item.latencySec}ث | إدراك: ${item.mode} | محدد: ${item.determinant} | محتوى: ${item.content}\n`;
      });

      if (clinicalNotes.trim()) {
        txt += `\n📝 الفرضيات السيكودينامية وديناميات الشخصية:\n${clinicalNotes}\n`;
      }
      return txt;
    } else {
      let txt = `🎭 تقرير الفحص الإسقاطي لتفهم الموضوع (TAT - Murray)\n`;
      txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      txt += `• تاريخ الفحص: ${assessmentDate}\n`;
      txt += `• اللوحات المفحوصة: ${TAT_PLANCHES.length} لوحة أساسية\n\n`;

      txt += `🔍 التحليل الدينامي لكل لوحة:\n`;
      TAT_PLANCHES.forEach(p => {
        const item = tatData[p.id];
        txt += `  • [${p.title}]:\n`;
        txt += `    - البطل والتماهي: ${item.hero}\n`;
        txt += `    - الحاجات والدوافع: ${item.needs}\n`;
        txt += `    - الضغوط البيئية: ${item.pressures}\n`;
        txt += `    - المخرج والنهاية: ${item.outcome}\n`;
      });

      if (clinicalNotes.trim()) {
        txt += `\n📝 التركيب العيادي والفرضيات السيكودينامية:\n${clinicalNotes}\n`;
      }
      return txt;
    }
  }, [selectedTestKey, assessmentDate, rorschachData, rorschachSummary, tatData, clinicalNotes]);

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
        title: `[${selectedTestKey}] تقييم الفحص الإسقاطي للشخصية`,
        assessment_date: assessmentDate,
        results_data: {
          test_code: selectedTestKey,
          test_title: selectedTestKey === 'RORSCHACH' ? 'اختبار الرورشاخ لبقع الحبر' : 'اختبار تفهم الموضوع (TAT)',
          rorschach_summary: selectedTestKey === 'RORSCHACH' ? rorschachSummary : null,
          rorschach_data: selectedTestKey === 'RORSCHACH' ? rorschachData : null,
          tat_data: selectedTestKey === 'TAT' ? tatData : null,
          notes: clinicalNotes,
          raw_score: selectedTestKey === 'RORSCHACH' ? rorschachSummary.fPlusPercent : 50,
        },
        diagnostic_conclusion: selectedTestKey === 'RORSCHACH'
          ? `Rorschach R: ${rorschachSummary.totalR} | F+: ${rorschachSummary.fPlusPercent}%`
          : `TAT Dynamics (${TAT_PLANCHES.length} Planches)`,
        recommendations: generatedReport,
      };

      await assessmentApi.create(assessmentData);
      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save projective assessment:', err);
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
              <Eye className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PROJECTIVE PROTOCOL GRID
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {selectedTestKey === 'RORSCHACH' ? '10 Taches / Psychogramme' : 'Thematic Apperception'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                شبكة الفحص والتدوين الإسقاطي ({selectedTestKey === 'RORSCHACH' ? 'اختبار الرورشاخ' : 'اختبار تفهم الموضوع TAT'})
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Switch Test */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-2xl border border-slate-700">
              <button
                onClick={() => setSelectedTestKey('RORSCHACH')}
                className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                  selectedTestKey === 'RORSCHACH'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                رورشاخ (Rorschach)
              </button>
              <button
                onClick={() => setSelectedTestKey('TAT')}
                className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                  selectedTestKey === 'TAT'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                تَفَهُّم الموضوع (TAT)
              </button>
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
              onClick={() => setActiveTab('grid')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>شبكة تدوين البطاقات</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'report' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>التحليل والتقرير السيكودينامي</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* RORSCHACH GRID */}
          {activeTab === 'grid' && selectedTestKey === 'RORSCHACH' && (
            <div className="space-y-6">
              
              {/* Psychogram KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400">إجمالي الاستجابات (R)</span>
                  <h4 className="text-lg font-black text-white font-mono mt-0.5">{rorschachSummary.totalR}</h4>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400">التماسك واستبصار الواقع (F+%)</span>
                  <h4 className="text-lg font-black text-indigo-300 font-mono mt-0.5">{rorschachSummary.fPlusPercent}%</h4>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400">النمطية (A%)</span>
                  <h4 className="text-lg font-black text-white font-mono mt-0.5">{rorschachSummary.animalPercent}%</h4>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400">الرنين الوجداني (TRI: M / C)</span>
                  <h4 className="text-lg font-black text-emerald-400 font-mono mt-0.5">{rorschachSummary.tri}</h4>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-3">
                {RORSCHACH_PLANCHES.map(p => {
                  const it = rorschachData[p.id];
                  return (
                    <div key={p.id} className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-black text-white">{p.name}</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">الزمن:</span>
                            <input
                              type="number"
                              min="1"
                              value={it.latencySec}
                              onChange={(e) => handleRorschachChange(p.id, 'latencySec', Number(e.target.value))}
                              className="w-12 bg-slate-900 border border-slate-700 rounded-lg py-0.5 text-center text-xs text-white font-mono"
                            />
                            <span className="text-[10px] text-slate-400">ث</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">الإدراك:</span>
                            <select
                              value={it.mode}
                              onChange={(e) => handleRorschachChange(p.id, 'mode', e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-lg py-0.5 px-2 text-xs text-white"
                            >
                              <option value="G">G (كلي)</option>
                              <option value="D">D (تفصيل كبير)</option>
                              <option value="Dd">Dd (تفصيل دقيق)</option>
                              <option value="Dbl">Dbl (فضاء أبيض)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">المحدد:</span>
                            <select
                              value={it.determinant}
                              onChange={(e) => handleRorschachChange(p.id, 'determinant', e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-lg py-0.5 px-2 text-xs text-white"
                            >
                              <option value="F+">F+ (شكل دقيق)</option>
                              <option value="F-">F- (شكل مشوه)</option>
                              <option value="M">M (حركة إنسانية)</option>
                              <option value="K">K (حركة حيوانية)</option>
                              <option value="C">C (لون محض)</option>
                              <option value="FC">FC (شكل ولون)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">المحتوى:</span>
                            <select
                              value={it.content}
                              onChange={(e) => handleRorschachChange(p.id, 'content', e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-lg py-0.5 px-2 text-xs text-white"
                            >
                              <option value="A">حيواني (A)</option>
                              <option value="H">بشري (H)</option>
                              <option value="Anat">تشريحي (Anat)</option>
                              <option value="Sang">دم / انفعالي (Sang)</option>
                              <option value="Obj">جماد (Obj)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAT GRID */}
          {activeTab === 'grid' && selectedTestKey === 'TAT' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 leading-relaxed">
                تدوين الدلالات السيكودينامية لكل لوحة من لوحات اختبار تفهم الموضوع (TAT - Murray):
              </div>

              <div className="space-y-3.5">
                {TAT_PLANCHES.map(p => {
                  const it = tatData[p.id];
                  return (
                    <div key={p.id} className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{p.title}</span>
                        <span className="text-[10px] text-slate-400">{p.theme}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">البطل والتماهي:</label>
                          <input
                            type="text"
                            value={it.hero}
                            onChange={(e) => handleTatChange(p.id, 'hero', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">الحاجات والدوافع:</label>
                          <input
                            type="text"
                            value={it.needs}
                            onChange={(e) => handleTatChange(p.id, 'needs', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">الضغوط البيئية:</label>
                          <input
                            type="text"
                            value={it.pressures}
                            onChange={(e) => handleTatChange(p.id, 'pressures', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">المخرج وحل الصراع:</label>
                          <input
                            type="text"
                            value={it.outcome}
                            onChange={(e) => handleTatChange(p.id, 'outcome', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* REPORT TAB */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>التقرير والتحليل السيكودينامي لحصيلة الفحص الإسقاطي</span>
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
                <label className="text-xs font-bold text-slate-300">الفرضيات العيادية حول بنية الشخصية (عصاب / ذهان / اضطراب حدّي):</label>
                <textarea
                  rows="3"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="سجل القلق المسيطر، طبيعة الميكانيزمات الدفاعية، العلاقة بالموضوع..."
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
                تم توثيق نتيجة الفحص الإسقاطي بنجاح!
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
