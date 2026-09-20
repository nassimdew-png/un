import React, { useState, useMemo } from 'react';
import {
  Brain,
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
  Eye,
  Layers,
  Award
} from 'lucide-react';
import { assessmentApi } from '../../../api';

export const REY_UNITS = [
  { id: 1, name: 'الصليب العلوي الأيسر', desc: 'Croix supérieure gauche' },
  { id: 2, name: 'المستطيل المركزي الأساسي', desc: 'Grand rectangle central (Armature)' },
  { id: 3, name: 'الصليب المائل (قطرا المستطيل)', desc: 'Croix de Saint-André (Diagonales)' },
  { id: 4, name: 'الضلع الأفقي المنصف للمستطيل', desc: 'Médiane horizontale' },
  { id: 5, name: 'الضلع العمودي المنصف للمستطيل', desc: 'Médiane verticale' },
  { id: 6, name: 'المستطيل الصغير الملحق باليسار', desc: 'Petit rectangle attaché à gauche' },
  { id: 7, name: 'القطعة المائلة فوق المستطيل الصغير', desc: 'Segment au-dessus du petit rectangle' },
  { id: 8, name: 'الخطوط الأربعة المتوازية في المستطيل الصغير', desc: 'Quatre lignes parallèles dans le petit rectangle' },
  { id: 9, name: 'المثلث القائم العلوي فوق المستطيل', desc: 'Triangle supérieur' },
  { id: 10, name: 'الخط العمودي الصغير داخل المثلث العلوي', desc: 'Petite verticale dans le triangle' },
  { id: 11, name: 'الدائرة المحتوية على 3 نقاط', desc: 'Cercle avec 3 points' },
  { id: 12, name: 'الخطوط الخمسة المتوازية في الأسفل الأيمن', desc: 'Cinq lignes parallèles traversant la médiane' },
  { id: 13, name: 'الضلعان المائلان في المثلث الأيمن', desc: 'Deux côtés du triangle latéral droit' },
  { id: 14, name: 'امتداد الزاوية اليمنى (رأس المعين)', desc: 'Pointe du losange' },
  { id: 15, name: 'الخط العمودي المنصف للمثلث الأيمن', desc: 'Verticale dans le triangle droit' },
  { id: 16, name: 'الخط الأفقي الممتد خارج المثلث الأيمن', desc: 'Prolongement horizontal de la médiane' },
  { id: 17, name: 'الصليب المستقل في الأسفل الأيمن', desc: 'Croix inférieure' },
  { id: 18, name: 'المربع الصغير والقطر في الأسفل الأيسر', desc: 'Carré et diagonale attachés en bas' },
];

export const REY_STRATEGY_TYPES = [
  { id: 'I', name: 'النوع الأول (Type I): البدء بالهيكل المستطيل الأساسي المنظم', desc: 'استراتيجية راشدة ناضجة وتخطيط بنائي ممتاز (Armature centrale puis détails).' },
  { id: 'II', name: 'النوع الثاني (Type II): البدء بتفصيل ملحق ثم استكمال المستطيل', desc: 'البدء بتفصيل جانبي ثم إدراك الهيكل المركزي وإكماله.' },
  { id: 'III', name: 'النوع الثالث (Type III): رسم الإطار الخارجي الكلي ثم ملء الداخل', desc: 'رسم حدود الشكل أولاً ككتلة واحدة ثم إسقاط التفاصيل في الداخل.' },
  { id: 'IV', name: 'النوع الرابع (Type IV): تجاور التفاصيل كقطع الفسيفساء', desc: 'رسم تفصيل يليه تفصيل بدون خطة توجيهية مركزية (Juxtaposition).' },
  { id: 'V', name: 'النوع الخامس (Type V): رسم تفاصيل متفرقة على خلفية مبهمة', desc: 'تفاصيل معزولة تفتقر للتناسق والتجميع البصري.' },
  { id: 'VI', name: 'النوع السادس (Type VI): إرجاع الشكل إلى رسم مألوف (بيت، سيارة...)', desc: 'تمثيل رمزي بدائي محوَّل لنمط تصويري معروف.' },
  { id: 'VII', name: 'النوع السابع (Type VII): خربشة وتشتت عشوائي غير متعرف عليه', desc: 'عجز تخطيطي وتشتت حركي إدراكي حاد.' },
];

export default function ReyFigureScorerModal({
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
  const [activeTab, setActiveTab] = useState('copy'); // 'copy' | 'memory' | 'strategy' | 'report'
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);

  // Time & Strategy
  const [copyTimeMin, setCopyTimeMin] = useState(3);
  const [copyTimeSec, setCopyTimeSec] = useState(15);
  const [memoryTimeMin, setMemoryTimeMin] = useState(2);
  const [memoryTimeSec, setMemoryTimeSec] = useState(45);
  const [selectedStrategy, setSelectedStrategy] = useState('I');

  // Unit Scores (0, 0.5, 1, 2)
  const [copyScores, setCopyScores] = useState(() => {
    const init = {};
    REY_UNITS.forEach(u => { init[u.id] = 2; });
    return init;
  });

  const [memoryScores, setMemoryScores] = useState(() => {
    const init = {};
    REY_UNITS.forEach(u => { init[u.id] = 1; });
    return init;
  });

  const handleScoreChange = (phase, unitId, score) => {
    if (phase === 'copy') {
      setCopyScores(prev => ({ ...prev, [unitId]: score }));
    } else {
      setMemoryScores(prev => ({ ...prev, [unitId]: score }));
    }
  };

  // Calculations
  const computedMetrics = useMemo(() => {
    const totalCopy = Object.values(copyScores).reduce((a, b) => a + Number(b), 0);
    const totalMemory = Object.values(memoryScores).reduce((a, b) => a + Number(b), 0);
    const retentionRate = totalCopy > 0 ? Math.round((totalMemory / totalCopy) * 100) : 0;

    // Normative classification for Copy (Adult/Adolescent normative threshold)
    let copyClass = { label: 'تخطيط فضائي وبنائي سليم (Normal)', color: 'emerald', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    if (totalCopy < 18) {
      copyClass = { label: 'عجز دال في التخطيط / دسبراكسيا بنائية (Dyspraxie visuo-constructive)', color: 'red', badge: 'bg-red-500/20 text-red-300 border-red-500/30' };
    } else if (totalCopy < 27) {
      copyClass = { label: 'أداء بنائي متوسط منخفض وهشاشة في التنظيم (Mild-Moderate Weakness)', color: 'amber', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }

    // Normative classification for Memory
    let memoryClass = { label: 'ذاكرة بصرية تخطيطية ممتازة (Good Visual Memory)', color: 'emerald', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    if (totalMemory < 12) {
      memoryClass = { label: 'ضعف ملحوظ في الاسترجاع والذاكرة البصرية التخطيطية (Visual Memory Deficit)', color: 'red', badge: 'bg-red-500/20 text-red-300 border-red-500/30' };
    } else if (totalMemory < 18) {
      memoryClass = { label: 'استرجاع ذاكراتي متوسط (Moderate Memory Recall)', color: 'amber', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }

    return {
      totalCopy,
      totalMemory,
      retentionRate,
      copyClass,
      memoryClass,
      strategyInfo: REY_STRATEGY_TYPES.find(s => s.id === selectedStrategy) || REY_STRATEGY_TYPES[0],
    };
  }, [copyScores, memoryScores, selectedStrategy]);

  // Automated Report Text
  const generatedReport = useMemo(() => {
    let txt = `📐 تقرير اختبار الشكل المعقد لراي (Figure de Rey - Test A)\n`;
    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `• تاريخ الفحص: ${assessmentDate}\n`;
    txt += `• استراتيجية البناء ونمط الرسم: ${computedMetrics.strategyInfo.name}\n`;
    txt += `  التفسير الإدراكي: ${computedMetrics.strategyInfo.desc}\n\n`;

    txt += `✏️ مرحلة النقل المباشر (Copie):\n`;
    txt += `  - المجموع الكلي: ${computedMetrics.totalCopy} / 36 نقطة\n`;
    txt += `  - زمن الإنجاز: ${copyTimeMin} دقيقة و ${copyTimeSec} ثانية\n`;
    txt += `  - التصنيف السريري: ${computedMetrics.copyClass.label}\n\n`;

    txt += `🧠 مرحلة إعادة الإنتاج بالذاكرة (Mémoire بعد 3 دقائق):\n`;
    txt += `  - المجموع الكلي: ${computedMetrics.totalMemory} / 36 نقطة\n`;
    txt += `  - زمن الإنجاز: ${memoryTimeMin} دقيقة و ${memoryTimeSec} ثانية\n`;
    txt += `  - نسبة الاحتفاظ بالذاكرة: ${computedMetrics.retentionRate}%\n`;
    txt += `  - التصنيف السريري: ${computedMetrics.memoryClass.label}\n`;

    if (clinicalNotes.trim()) {
      txt += `\n📝 ملاحظات الفاحص والتحليل الحركي البصري:\n${clinicalNotes}\n`;
    }

    return txt;
  }, [assessmentDate, computedMetrics, copyTimeMin, copyTimeSec, memoryTimeMin, memoryTimeSec, clinicalNotes]);

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
        title: `[REY-FCR] اختبار الشكل المعقد لراي (النقل والذاكرة)`,
        assessment_date: assessmentDate,
        results_data: {
          test_code: 'REY-FCR',
          test_title: 'اختبار الشكل المعقد لراي (Figure de Rey)',
          copy_score: computedMetrics.totalCopy,
          memory_score: computedMetrics.totalMemory,
          retention_rate: computedMetrics.retentionRate,
          strategy_type: selectedStrategy,
          copy_time: `${copyTimeMin}m ${copyTimeSec}s`,
          memory_time: `${memoryTimeMin}m ${memoryTimeSec}s`,
          notes: clinicalNotes,
          raw_score: computedMetrics.totalCopy,
        },
        diagnostic_conclusion: `Rey Copy: ${computedMetrics.totalCopy}/36 | Memory: ${computedMetrics.totalMemory}/36 (${computedMetrics.copyClass.label})`,
        recommendations: generatedReport,
      };

      await assessmentApi.create(assessmentData);
      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save Rey assessment:', err);
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
      <div className="bg-slate-900 border border-purple-500/40 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-purple-950/80 to-slate-900 border-b border-purple-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
              <Brain className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  FIGURE DE REY SCORER
                </span>
                <span className="text-xs font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  18 Units Copie & Mémoire
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                مصحح وشبكة تنقيط الشكل المعقد لراي (Figure de Rey)
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
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500"
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
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
            <button
              onClick={() => setActiveTab('copy')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'copy' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>مرحلة النقل (Copie: {computedMetrics.totalCopy}/36)</span>
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'memory' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>مرحلة الذاكرة ({computedMetrics.totalMemory}/36)</span>
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'strategy' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>نمط واستراتيجية الرسم</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'report' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>التقرير والتحليل</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TABS 1 & 2: UNIT SCORING (COPY OR MEMORY) */}
          {(activeTab === 'copy' || activeTab === 'memory') && (
            <div className="space-y-6">
              
              {/* Phase Banner */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>
                      تنقيط الوحدات الـ 18 لمرحلة {activeTab === 'copy' ? 'النقل المباشر (Copie)' : 'إعادة الإنتاج من الذاكرة (Mémoire)'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    2: صحيح ومتموضع جيداً | 1: صحيح في غير مكانه أو مشوه في مكانه | 0.5: مشوه وفي غير مكانه | 0: غائب
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-300">زمن الإنجاز:</span>
                  <div className="flex items-center gap-1 font-mono text-xs text-white">
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={activeTab === 'copy' ? copyTimeMin : memoryTimeMin}
                      onChange={(e) => activeTab === 'copy' ? setCopyTimeMin(Number(e.target.value)) : setMemoryTimeMin(Number(e.target.value))}
                      className="w-12 bg-slate-900 border border-slate-700 rounded-lg py-1 text-center"
                    />
                    <span>د</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={activeTab === 'copy' ? copyTimeSec : memoryTimeSec}
                      onChange={(e) => activeTab === 'copy' ? setCopyTimeSec(Number(e.target.value)) : setMemoryTimeSec(Number(e.target.value))}
                      className="w-12 bg-slate-900 border border-slate-700 rounded-lg py-1 text-center"
                    />
                    <span>ث</span>
                  </div>
                </div>
              </div>

              {/* Units Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {REY_UNITS.map((u) => {
                  const currentScore = activeTab === 'copy' ? copyScores[u.id] : memoryScores[u.id];

                  return (
                    <div key={u.id} className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-700 text-[10px] font-bold text-slate-300 flex items-center justify-center font-mono">
                            {u.id}
                          </span>
                          <span className="text-xs font-bold text-white">{u.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{u.desc}</span>
                      </div>

                      {/* Score Selector */}
                      <div className="flex items-center gap-1 shrink-0">
                        {[0, 0.5, 1, 2].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleScoreChange(activeTab, u.id, s)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black transition ${
                              currentScore === s
                                ? 'bg-purple-600 text-white shadow'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 3: CONSTRUCTION STRATEGY TYPE */}
          {activeTab === 'strategy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs text-slate-300 leading-relaxed">
                حدد استراتيجية البناء التي اعتمدها المفحوص أثناء نقل الشكل (أنماط أوستيريث Osterrieth Types):
              </div>

              <div className="space-y-3">
                {REY_STRATEGY_TYPES.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStrategy(st.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                      selectedStrategy === st.id
                        ? 'bg-purple-950/30 border-purple-500 shadow-md'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      checked={selectedStrategy === st.id}
                      onChange={() => setSelectedStrategy(st.id)}
                      className="mt-1 accent-purple-500"
                    />
                    <div>
                      <h4 className="text-xs font-black text-white">{st.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1">{st.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: REPORT & NARRATIVE */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>التقرير والتحليل السريري لشكل راي المعقد</span>
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
                <label className="text-xs font-bold text-slate-300">ملاحظات الفاحص الإضافية (الدسبراكسيا البنائية والتآزر الحركي):</label>
                <textarea
                  rows="3"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="سجل أي تدوير للشكل، مسك غير طبيعي للقلم، رعاش، محاولات تصحيح متكررة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
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
                تم توثيق نتيجة رائز راي في ملف المريض بنجاح!
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
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
