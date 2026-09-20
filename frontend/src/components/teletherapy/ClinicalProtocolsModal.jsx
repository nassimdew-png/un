import React, { useState } from 'react';
import {
  Brain,
  Activity,
  Zap,
  Gauge,
  CheckCircle2,
  FileText,
  X,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { PECS_CARDS_CATALOG, MATCHING_PAIRS_CATALOG } from './PecsAndMatchingActivityModal';

export default function ClinicalProtocolsModal({
  isOpen,
  onClose,
  patientName = 'المريض',
  onInjectIntoSoap
}) {
  const [activeTab, setActiveTab] = useState('suds'); // 'suds' | 'dtr' | 'erp' | 'pecs'

  // 1. SUDS STATE (Subjective Units of Distress Scale 0-100)
  const [sudsValue, setSudsValue] = useState(45);
  const [sudsPhase, setSudsPhase] = useState('baseline'); // 'baseline' | 'mid' | 'post'
  const [sudsHistory, setSudsHistory] = useState([
    { phase: 'بداية الجلسة (Baseline)', score: 65, time: '10:05' }
  ]);
  const [sudsNote, setSudsNote] = useState('');

  // 2. DTR STATE (Dysfunctional Thought Record / إعادة الهيكلة المعرفية)
  const [dtrData, setDtrData] = useState({
    situation: '',
    automaticThought: '',
    distortion: 'catastrophizing',
    rationalResponse: '',
    initialBelief: 85,
    finalBelief: 30
  });

  // 3. ERP STATE (Exposure & Response Prevention / سلم التعرض)
  const [erpStep, setErpStep] = useState({
    stimulus: '',
    expectedSuds: 75,
    actualPeakSuds: 70,
    durationMinutes: 10,
    responsePrevention: 'الامتناع التام عن التحقق أو الطقس القهري',
    habituationAchieved: true
  });

  if (!isOpen) return null;

  // SUDS Interpretation helper
  const getSudsDescriptor = (val) => {
    if (val <= 20) return { label: 'استرخاء وهدوء تام (Normal / Relaxed)', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30' };
    if (val <= 40) return { label: 'قلق طفيف وتيقظ خفيف (Mild Alertness)', color: 'text-teal-400', badge: 'bg-teal-500/20 border-teal-500/30' };
    if (val <= 60) return { label: 'توتر معتدل ومشاعر غير مريحة (Moderate Distress)', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/30' };
    if (val <= 80) return { label: 'ضيق شديد وتسارع ضربات القلب (High Distress)', color: 'text-orange-400', badge: 'bg-orange-500/20 border-orange-500/30' };
    return { label: 'ذروة الضيق ونوبة هلع محتملة (Extreme Panic / Peak)', color: 'text-rose-400', badge: 'bg-rose-500/20 border-rose-500/30' };
  };

  const sudsDesc = getSudsDescriptor(sudsValue);

  // Record SUDS point
  const handleRecordSuds = () => {
    const phaseLabels = {
      baseline: 'بداية الجلسة (Baseline)',
      mid: 'أثناء التدخل السريري (Mid-Session)',
      post: 'نهاية الجلسة (Post-Intervention)'
    };
    const now = new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
    const newEntry = {
      phase: phaseLabels[sudsPhase],
      score: sudsValue,
      note: sudsNote,
      time: now
    };
    setSudsHistory((prev) => [...prev, newEntry]);
    setSudsNote('');
  };

  // Inject SUDS into SOAP Notes
  const handleInjectSudsToSoap = () => {
    const lines = sudsHistory.map(
      (h) => `• [SUDS ${h.phase}]: ${h.score}/100 ${h.note ? `(${h.note})` : ''} في توقيت: ${h.time}`
    );
    const summary = `\n[مقياس الضيق الذاتي SUDS]:\n${lines.join('\n')}\n`;
    onInjectIntoSoap({ field: 'assessment', text: summary });
    alert('✅ تم حقن نتائج مقياس SUDS في خانة التقييم السريري (Assessment - A) في SOAP');
  };

  // Inject DTR into SOAP Plan
  const handleInjectDtrToSoap = () => {
    const summary = `\n[سجل إعادة الهيكلة المعرفية - DTR]:
• الموقف المثير: ${dtrData.situation || 'غير محدد'}
• الفكرة التلقائية: "${dtrData.automaticThought || '...'}"
• التشوه المعرفي: ${dtrData.distortion} (قوة التصديق البدائية: ${dtrData.initialBelief}%)
• الفكرة العقلانية البديلة: "${dtrData.rationalResponse || '...'}" (قوة التصديق النهائية: ${dtrData.finalBelief}%)\n`;
    onInjectIntoSoap({ field: 'plan', text: summary });
    alert('✅ تم إدراج سجل إعادة الهيكلة المعرفية في خطة الجلسة (Plan - P) في SOAP');
  };

  // Inject ERP to SOAP
  const handleInjectErpToSoap = () => {
    const summary = `\n[بروتوكول التعرض ومنع الاستجابة ERP]:
• المثير المعرّض له: ${erpStep.stimulus || 'غير محدد'}
• الضيق المتوقع (SUDS): ${erpStep.expectedSuds}/100 | ذروة الضيق الفعلي: ${erpStep.actualPeakSuds}/100
• مدة التعرض المستمر: ${erpStep.durationMinutes} دقائق
• منع الاستجابة: ${erpStep.responsePrevention}
• نتيجة التعود: ${erpStep.habituationAchieved ? 'تحقق التعود وانخفاض القلق بنجاح ✅' : 'يحتاج تكرار في الجلسة القادمة'}\n`;
    onInjectIntoSoap({ field: 'plan', text: summary });
    alert('✅ تم إدراج بروتوكول التعرض ومنع الاستجابة في خطة الجلسة (Plan - P)');
  };

  // 4. PECS & MATCHING STATE
  const [pecsPrefix, setPecsPrefix] = useState('أنا أريد');
  const [selectedPecsCard, setSelectedPecsCard] = useState(PECS_CARDS_CATALOG[0]);
  const [pecsCount, setPecsCount] = useState(0);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [matchingScore, setMatchingScore] = useState(0);

  const handleSelectLeftMatching = (item) => {
    setSelectedLeft(item);
  };

  const handleSelectRightMatching = (item) => {
    if (!selectedLeft) return;
    if (selectedLeft.id === item.id) {
      if (!matchedPairs.includes(item.id)) {
        setMatchedPairs((prev) => [...prev, item.id]);
        setMatchingScore((prev) => prev + 10);
      }
      setSelectedLeft(null);
    } else {
      setSelectedLeft(null);
    }
  };

  const handleInjectPecsToSoap = () => {
    const summary = `\n[أنشطة PECS ومطابقة الصور والتواصل البديل]:
• شريط الجملة PECS: تم إنجاز ${pecsCount} تبادلات تواصلية بتركيب الجملة (${pecsPrefix} + بطاقة الهدف: ${selectedPecsCard?.titleAr || ''}).
• نشاط مطابقة الصور والتصنيف البصري: تم إنجاز مطابقة ${matchedPairs.length}/${MATCHING_PAIRS_CATALOG.length} أزواج بنجاح (النقاط: ${matchingScore}).
• الاستجابة السريرية: تركيز وتفاعل بصري وتواصلي ممتاز.\n`;
    onInjectIntoSoap({ field: 'objective', text: summary });
    alert('✅ تم إدراج نتائج نشاط PECS ومطابقة الصور في تقرير SOAP (الملاحظات الموضوعية)');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none font-sans" dir="rtl">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              🧠
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  البروتوكولات السريرية المعيارية المباشرة (CBT & SUDS)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  معايير طبية 🩺
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                المريض: <span className="text-slate-200 font-semibold">{patientName}</span> • قياس لحظي وإعادة هيكلة وتوثيق فوري في SOAP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-950/40 border-b border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('suds')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'suds'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>مقياس الضيق اللحظي (SUDS 0-100)</span>
          </button>

          <button
            onClick={() => setActiveTab('dtr')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dtr'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>سجل إعادة الهيكلة المعرفية (DTR)</span>
          </button>

          <button
            onClick={() => setActiveTab('erp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'erp'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>التعرض ومنع الاستجابة (ERP)</span>
          </button>

          <button
            type="button"
            data-testid="pecs-cards-activity-btn"
            onClick={() => setActiveTab('pecs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pecs'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>بطاقات PECS ومطابقة الصور</span>
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. SUDS TAB */}
          {activeTab === 'suds' && (
            <div className="space-y-5">
              {/* Gauge Display Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 text-center relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-medium">
                  <span>مستوى الضيق النفسي الحالي للمريض:</span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${sudsDesc.badge} ${sudsDesc.color}`}>
                    {sudsDesc.label}
                  </span>
                </div>

                <div className="my-4">
                  <div className="text-5xl font-black font-mono tracking-tight text-slate-100 mb-2">
                    {sudsValue} <span className="text-xl text-slate-500 font-normal">/ 100</span>
                  </div>

                  {/* Range Slider */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sudsValue}
                    onChange={(e) => setSudsValue(Number(e.target.value))}
                    className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
                    <span>0 (استرخاء)</span>
                    <span>25 (طفيف)</span>
                    <span>50 (معتدل)</span>
                    <span>75 (شديد)</span>
                    <span>100 (ذروة الهلع)</span>
                  </div>
                </div>

                {/* Phase Selection & Note */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setSudsPhase('baseline')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      sudsPhase === 'baseline'
                        ? 'bg-teal-600/30 border-teal-500 text-teal-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    1️⃣ بداية الجلسة (Baseline)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSudsPhase('mid')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      sudsPhase === 'mid'
                        ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    2️⃣ أثناء التدخل (Mid)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSudsPhase('post')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      sudsPhase === 'post'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    3️⃣ نهاية الجلسة (Post)
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={sudsNote}
                    onChange={(e) => setSudsNote(e.target.value)}
                    placeholder="ملاحظة سياقية (مثال: أثناء تذكر الموقف، بعد تمرين التنفس البطني...)"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleRecordSuds}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0"
                  >
                    + تسجيل النقطة
                  </button>
                </div>
              </div>

              {/* History Timeline */}
              {sudsHistory.length > 0 && (
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      سجل منحنى الضيق في هذه الجلسة ({sudsHistory.length} نقاط):
                    </span>
                    <button
                      onClick={handleInjectSudsToSoap}
                      className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      حقن في SOAP (Assessment) 📥
                    </button>
                  </div>

                  <div className="space-y-2">
                    {sudsHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-200">{item.phase}</span>
                          {item.note && <span className="text-slate-400 text-[11px]">— {item.note}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-400 text-[11px]">{item.time}</span>
                          <span className="font-mono font-black text-sm text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-500/30">
                            {item.score}/100
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. DTR TAB (Dysfunctional Thought Record) */}
          {activeTab === 'dtr' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-200 leading-relaxed">
                💡 <strong>إعادة الهيكلة المعرفية (CBT DTR)</strong>: مساعدة المريض على فحص الأدلة، رصد التشوهات المعرفية (Cognitive Distortions)، واستبدال الفكرة التلقائية غير المتكيفة باستجابة عقلانية متزنة.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    1. الموقف المثير (Situation / Trigger):
                  </label>
                  <textarea
                    rows={2}
                    value={dtrData.situation}
                    onChange={(e) => setDtrData({ ...dtrData, situation: e.target.value })}
                    placeholder="أين كنت؟ مع من؟ ما الذي حدث مباشرة قبل ظهور المشاعر السلبية؟"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    2. الفكرة التلقائية السلبية (Automatic Thought):
                  </label>
                  <textarea
                    rows={2}
                    value={dtrData.automaticThought}
                    onChange={(e) => setDtrData({ ...dtrData, automaticThought: e.target.value })}
                    placeholder="ما الذي خطر في بالك في تلك اللحظة بالضبط؟ ('سوف أفشل تماماً', 'الجميع يحكمون علي')..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    3. التشوه المعرفي (Cognitive Distortion):
                  </label>
                  <select
                    value={dtrData.distortion}
                    onChange={(e) => setDtrData({ ...dtrData, distortion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="الكل أو لا شيء (All-or-Nothing)">التفكير القطبي: الكل أو لا شيء (All-or-Nothing)</option>
                    <option value="التفكير الكارثي والتهويل (Catastrophizing)">التفكير الكارثي والتهويل (Catastrophizing)</option>
                    <option value="قراءة الأفكار (Mind Reading)">قراءة أفكار الآخرين بدون دليل (Mind Reading)</option>
                    <option value="التنبؤ بالمستقبل السلبي (Fortune Telling)">التنبؤ بالمستقبل السلبي (Fortune Telling)</option>
                    <option value="التجريد الانتقائي / التصفية السلبية (Mental Filter)">التصفية السلبية للأحداث (Mental Filter)</option>
                    <option value="الشخصنة (Personalization)">الشخصنة ولوم الذات (Personalization)</option>
                    <option value="عبارات الإلزام 'يجب وينبغي' (Should Statements)">عبارات الإلزام والضرورة (Should Statements)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    درجة التصديق المبدئية بالفكرة: {dtrData.initialBelief}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={dtrData.initialBelief}
                    onChange={(e) => setDtrData({ ...dtrData, initialBelief: Number(e.target.value) })}
                    className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  4. الاستجابة العقلانية البديلة (Alternative Rational Response):
                </label>
                <textarea
                  rows={3}
                  value={dtrData.rationalResponse}
                  onChange={(e) => setDtrData({ ...dtrData, rationalResponse: e.target.value })}
                  placeholder="ما هي الأدلة المعاكسة؟ ما الذي أقوله لصديق في نفس الموقف؟ ما النظرة الأكثر توازناً وواقعية؟"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  إعادة تقييم قوة الفكرة السلبية بعد التدخل: {dtrData.finalBelief}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={dtrData.finalBelief}
                  onChange={(e) => setDtrData({ ...dtrData, finalBelief: Number(e.target.value) })}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleInjectDtrToSoap}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>حقن السجل في خطة العلاج (SOAP Plan)</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. ERP TAB */}
          {activeTab === 'erp' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200 leading-relaxed">
                🎯 <strong>التعرض ومنع الاستجابة (ERP)</strong>: بروتوكول الخط الأول لعلاج الوسواس القهري (OCD) والرهاب النوعي. يقوم المريض بمواجهة المثير القلقي مع الامتناع الصارم عن ممارسة الطقوس التحييدية حتى يتحقق التعود (Habituation).
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  المثير المعرّض له (Exposure Target):
                </label>
                <input
                  type="text"
                  value={erpStep.stimulus}
                  onChange={(e) => setErpStep({ ...erpStep, stimulus: e.target.value })}
                  placeholder="مثال: لمس مقبض الباب دون غسل اليدين، النظر إلى صورة حيوان أليف..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الضيق المتوقع قبل التعرض: {erpStep.expectedSuds}/100
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={erpStep.expectedSuds}
                    onChange={(e) => setErpStep({ ...erpStep, expectedSuds: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ذروة الضيق الفعلي أثناء التمرين: {erpStep.actualPeakSuds}/100
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={erpStep.actualPeakSuds}
                    onChange={(e) => setErpStep({ ...erpStep, actualPeakSuds: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    مدة التعرض الفعلي المستمر (بالدقائق):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={erpStep.durationMinutes}
                    onChange={(e) => setErpStep({ ...erpStep, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الاستجابة القهرية الممنوعة:
                  </label>
                  <input
                    type="text"
                    value={erpStep.responsePrevention}
                    onChange={(e) => setErpStep({ ...erpStep, responsePrevention: e.target.value })}
                    placeholder="الامتناع عن غسل اليدين، الامتناع عن طلب التطمين..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">هل تحقق منحنى التعود السريري (Habituation)؟</div>
                  <div className="text-[10px] text-slate-400">انخفاض مستوى الضيق بنسبة لا تقل عن 50% من الذروة دون ممارسة أي طقس</div>
                </div>
                <input
                  type="checkbox"
                  checked={erpStep.habituationAchieved}
                  onChange={(e) => setErpStep({ ...erpStep, habituationAchieved: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 bg-slate-900 border-slate-700 rounded focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleInjectErpToSoap}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>حقن بروتوكول ERP في SOAP Plan</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. PECS & MATCHING TAB */}
          {activeTab === 'pecs' && (
            <div className="space-y-4">
              {/* PECS Sentence Strip */}
              <div className="p-4 bg-slate-950/80 border border-purple-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>شريط الجملة التواصلي (PECS Sentence Strip):</span>
                  </span>
                  <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
                    {pecsCount} تبادلات تواصلية
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={pecsPrefix}
                    onChange={(e) => setPecsPrefix(e.target.value)}
                    className="bg-purple-950/60 border border-purple-500/40 text-purple-200 font-bold text-xs rounded-xl px-2.5 py-2 focus:outline-none"
                  >
                    <option value="أنا أريد">أنا أريد (Je veux)</option>
                    <option value="أنا أرى">أنا أرى (Je vois)</option>
                    <option value="أنا أسمع">أنا أسمع (J'entends)</option>
                    <option value="أعطني">أعطني (Donne-moi)</option>
                  </select>

                  <span className="text-lg text-slate-600 font-bold">+</span>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-purple-500/40 rounded-xl">
                    <span className="text-2xl">{selectedPecsCard?.symbol}</span>
                    <span className="text-xs font-bold text-white">{selectedPecsCard?.titleAr}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPecsCount((c) => c + 1)}
                    className="mr-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    تأكيد التبادل والتكرار ⭐
                  </button>
                </div>

                {/* PECS Card Selector */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {PECS_CARDS_CATALOG.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedPecsCard(card)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        selectedPecsCard?.id === card.id
                          ? 'bg-purple-950/50 border-purple-500 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-2xl">{card.symbol}</div>
                      <div className="text-[11px] font-bold text-white mt-1">{card.titleAr}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Matching Activity Game */}
              <div className="p-4 bg-slate-950/80 border border-teal-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-teal-400" />
                    <span>نشاط مطابقة الصور والتصنيف البصري:</span>
                  </span>
                  <span className="text-[11px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/30">
                    النقاط: {matchingScore} pts
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400">1. بطاقات العرض:</span>
                    {MATCHING_PAIRS_CATALOG.map((item) => {
                      const isMatched = matchedPairs.includes(item.id);
                      const isSelected = selectedLeft?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={isMatched}
                          onClick={() => handleSelectLeftMatching(item)}
                          className={`w-full p-2.5 rounded-xl border text-right flex items-center justify-between text-xs transition-all ${
                            isMatched
                              ? 'bg-emerald-950/20 border-emerald-500/30 opacity-50'
                              : isSelected
                              ? 'bg-teal-950/60 border-teal-400 font-bold'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{item.leftSymbol}</span>
                            <span className="text-white">{item.leftLabel}</span>
                          </div>
                          {isMatched && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400">2. بطاقات المطابقة:</span>
                    {MATCHING_PAIRS_CATALOG.slice().reverse().map((item) => {
                      const isMatched = matchedPairs.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={isMatched}
                          onClick={() => handleSelectRightMatching(item)}
                          className={`w-full p-2.5 rounded-xl border text-right flex items-center justify-between text-xs transition-all ${
                            isMatched
                              ? 'bg-emerald-950/20 border-emerald-500/30 opacity-50'
                              : 'bg-slate-900 border-slate-800 hover:border-teal-500/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{item.rightSymbol}</span>
                            <span className="text-white">{item.rightLabel}</span>
                          </div>
                          {isMatched && <span className="text-[10px] text-emerald-400 font-bold font-mono">مطابق ✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action: Inject to SOAP */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleInjectPecsToSoap}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>حقن نتائج PECS والمطابقة في تقرير SOAP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
