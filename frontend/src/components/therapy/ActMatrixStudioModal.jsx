import React, { useState, useMemo, useRef } from 'react';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  User,
  Search,
  Check,
  X,
  Layers,
  ArrowRight,
  Heart,
  Wind,
  Smile,
  Shield,
  Send
} from 'lucide-react';

export default function ActMatrixStudioModal({
  isOpen,
  onClose,
  patient = null,
  patients = [],
  onInjectSoap = null,
}) {
  if (!isOpen) return null;

  const [selectedPatient, setSelectedPatient] = useState(patient || (patients.length > 0 ? patients[0] : null));
  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const pickerRef = useRef(null);

  // Active Tab: 'matrix_grid' | 'defusion_lab' | 'committed_action'
  const [activeTab, setActiveTab] = useState('matrix_grid');

  // Matrix 4 Quadrants State
  const [matrixData, setMatrixData] = useState({
    // Top-Right (Inner / Towards): Values & Important People
    values: [
      'أن أكون أباً حاضراً ومتفهماً لأطفالي',
      'الصدق والشفافية في علاقاتي الاجتماعية',
      'التطور المهني وتقديم رعاية طبية ذات معنى',
    ],
    // Bottom-Right (Outer / Towards): Actions Towards Values
    towardsActions: [
      'تخصيص 30 دقيقة يومياً للعب مع الطفل دون هاتف',
      'التعبير عن مشاعري بوضوح عند حدوث سوء تفاهم',
      'ممارسة الرياضة الصباحية 3 مرات أسبوعياً',
    ],
    // Top-Left (Inner / Away): Difficult Inner Experiences (Hooks)
    innerObstacles: [
      'فكرة: أنا لست والداً جيداً ولن أنجح',
      'شعور بالذنب المفرط وثقل في الصدر',
      'الخوف من الرفض والانتقاد عند إبداء الرأي',
    ],
    // Bottom-Left (Outer / Away): Avoidance & Away Behaviors
    awayBehaviors: [
      'الانعزال في الغرفة وتصفح الهاتف لساعات طويلة',
      'تأجيل النقاشات المهمة والانسحاب الصامت',
      'الإفراط في تناول السكريات عند الشعور بالضغط',
    ],
  });

  // Inputs for adding items
  const [newValueInput, setNewValueInput] = useState('');
  const [newTowardsInput, setNewTowardsInput] = useState('');
  const [newObstacleInput, setNewObstacleInput] = useState('');
  const [newAwayInput, setNewAwayInput] = useState('');

  // Cognitive Defusion Lab State
  const [hookThought, setHookThought] = useState('أنا فاشل ولن أستطيع تغيير حياتي');
  const [defusedThoughtStep1, setDefusedThoughtStep1] = useState('');
  const [defusedThoughtStep2, setDefusedThoughtStep2] = useState('');
  const [storyName, setStoryName] = useState('قصة الفشل القديمة');

  // Committed Action State
  const [smartGoal, setSmartGoal] = useState('التحدث مع زوجتي بهدوء حول الميزانية يوم السبت القادم');
  const [potentialHook, setPotentialHook] = useState('الخوف من الغضب أو تصاعد الخلاف');
  const [willingnessScore, setWillingnessScore] = useState(8); // 1 to 10

  const handleAddItem = (quadrant, value, setter) => {
    if (!value.trim()) return;
    setMatrixData((prev) => ({
      ...prev,
      [quadrant]: [...prev[quadrant], value.trim()],
    }));
    setter('');
  };

  const handleRemoveItem = (quadrant, index) => {
    setMatrixData((prev) => ({
      ...prev,
      [quadrant]: prev[quadrant].filter((_, i) => i !== index),
    }));
  };

  // Generate defused thoughts
  const handleGenerateDefusion = (thought) => {
    setHookThought(thought);
    setDefusedThoughtStep1(`لدي فكرة بأن: "${thought}"`);
    setDefusedThoughtStep2(`ألاحظ أن عقلي يقدم لي الآن فكرة مفادها: "${thought}"`);
  };

  // Inject into SOAP notes
  const handleInjectSoap = () => {
    const summary = `[جلسة العلاج بالقبول والالتزام - ACT Matrix & Cognitive Defusion]:\n` +
      `- القيم الحياتية المحددة: ${matrixData.values.join(' • ')}\n` +
      `- السلوكيات التقاربية (Towards): ${matrixData.towardsActions.join(' • ')}\n` +
      `- الأفكار المعيقة (Hooks): ${matrixData.innerObstacles.join(' • ')}\n` +
      `- سلوكيات التجنب المرصودة (Away): ${matrixData.awayBehaviors.join(' • ')}\n` +
      `- تمرين فك الاندماج المعرفي: تم تفكيك فكرة ("${hookThought}") إلى صياغة الملاحظة الواعية.\n` +
      `- خطة العمل الملتزم: ${smartGoal} (درجة الاستعداد والتقبل Willingness: ${willingnessScore}/10).`;

    if (onInjectSoap) {
      onInjectSoap({
        objective: summary,
        assessment: `تعزيز المرونة النفسية وتحديد بوصلة القيم مع التزام سلوكي بدرجة تقبل ${willingnessScore}/10.`,
      });
    }
    onClose();
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return patients;
    const q = patientSearchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const name = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [patients, patientSearchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans" dir="rtl">
      <div className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-indigo-950/30 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate">
                  مختبر العلاج بالقبول والالتزام (ACT Matrix & Defusion Lab)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Third-Wave CBT
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                مصفوفة الأرباع الأربعة، فك الاندماج المعرفي (Defusion)، وتحديد بوصلة القيم والعمل الملتزم
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Patient Selector */}
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setIsPatientPickerOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-xs font-bold text-slate-200 transition flex items-center gap-2 shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {selectedPatient ? `${selectedPatient.first_name || ''} ${selectedPatient.last_name || selectedPatient.name}` : 'اختر مريضاً...'}
                </span>
              </button>

              {isPatientPickerOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      placeholder="ابحث بالاسم..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="w-full pr-8 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setIsPatientPickerOpen(false);
                        }}
                        className="p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:bg-slate-900 text-slate-300"
                      >
                        <span>{p.first_name} {p.last_name}</span>
                        {selectedPatient?.id === p.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('matrix_grid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'matrix_grid'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>مصفوفة الـ ACT الرباعية 🧭</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('defusion_lab')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'defusion_lab'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>مختبر فك الاندماج المعرفي (Defusion) 🍃</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('committed_action')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'committed_action'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>العمل الملتزم (Committed Action) 🎯</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: 4-QUADRANT ACT MATRIX */}
          {activeTab === 'matrix_grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* TOP-RIGHT: VALUES & IMPORTANT PEOPLE (INNER / TOWARDS) */}
              <div className="p-5 rounded-3xl bg-indigo-950/20 border border-indigo-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
                  <h4 className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-indigo-400" />
                    <span>1. من وما يهمك في الحياة؟ (القيم الحياتية - Values)</span>
                  </h4>
                  <span className="text-[10px] text-indigo-400/80 font-mono font-bold">داخلي / تقاربي</span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {matrixData.values.map((item, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-950/80 border border-indigo-500/20 text-xs flex items-center justify-between group">
                      <span className="text-indigo-200">{item}</span>
                      <button type="button" onClick={() => handleRemoveItem('values', idx)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="أضف قيمة أو شخصاً مهماً..."
                    value={newValueInput}
                    onChange={(e) => setNewValueInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem('values', newValueInput, setNewValueInput)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('values', newValueInput, setNewValueInput)}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* TOP-LEFT: DIFFICULT INNER HOOKS (INNER / AWAY) */}
              <div className="p-5 rounded-3xl bg-rose-950/20 border border-rose-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
                  <h4 className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-rose-400" />
                    <span>2. ما هي الأفكار والمشاعر الصعبة التي تعيقك؟ (الأشواك - Hooks)</span>
                  </h4>
                  <span className="text-[10px] text-rose-400/80 font-mono font-bold">داخلي / تباعدي</span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {matrixData.innerObstacles.map((item, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-950/80 border border-rose-500/20 text-xs flex items-center justify-between group">
                      <span className="text-rose-200">{item}</span>
                      <button type="button" onClick={() => handleRemoveItem('innerObstacles', idx)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="أضف فكرة أو مشاعر صعبة تعيقك..."
                    value={newObstacleInput}
                    onChange={(e) => setNewObstacleInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem('innerObstacles', newObstacleInput, setNewObstacleInput)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('innerObstacles', newObstacleInput, setNewObstacleInput)}
                    className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* BOTTOM-RIGHT: TOWARDS ACTIONS (OUTER / TOWARDS) */}
              <div className="p-5 rounded-3xl bg-teal-950/20 border border-teal-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-teal-500/30 pb-2">
                  <h4 className="text-xs font-black text-teal-300 flex items-center gap-1.5">
                    <Smile className="w-4 h-4 text-teal-400" />
                    <span>3. ما هي الأفعال التي تقربك من قيمك؟ (نحو القيم - Towards)</span>
                  </h4>
                  <span className="text-[10px] text-teal-400/80 font-mono font-bold">خارجي / تقاربي</span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {matrixData.towardsActions.map((item, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-950/80 border border-teal-500/20 text-xs flex items-center justify-between group">
                      <span className="text-teal-200">{item}</span>
                      <button type="button" onClick={() => handleRemoveItem('towardsActions', idx)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="أضف تصرفاً يتماشى مع قيمك..."
                    value={newTowardsInput}
                    onChange={(e) => setNewTowardsInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem('towardsActions', newTowardsInput, setNewTowardsInput)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('towardsActions', newTowardsInput, setNewTowardsInput)}
                    className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* BOTTOM-LEFT: AWAY / AVOIDANCE BEHAVIORS (OUTER / AWAY) */}
              <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                  <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-amber-400" />
                    <span>4. ماذا تفعل للهروب والتجنب المؤقت؟ (الابتعاد - Away)</span>
                  </h4>
                  <span className="text-[10px] text-amber-400/80 font-mono font-bold">خارجي / تباعدي</span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {matrixData.awayBehaviors.map((item, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-950/80 border border-amber-500/20 text-xs flex items-center justify-between group">
                      <span className="text-amber-200">{item}</span>
                      <button type="button" onClick={() => handleRemoveItem('awayBehaviors', idx)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="أضف سلوك هروب أو تجنب..."
                    value={newAwayInput}
                    onChange={(e) => setNewAwayInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem('awayBehaviors', newAwayInput, setNewAwayInput)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('awayBehaviors', newAwayInput, setNewAwayInput)}
                    className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COGNITIVE DEFUSION LAB */}
          {activeTab === 'defusion_lab' && (
            <div className="space-y-6">
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-xs font-black text-indigo-300 uppercase flex items-center gap-2">
                  <Wind className="w-4 h-4 text-indigo-400" />
                  <span>تمرين فك الاندماج المعرفي المتدرج (Cognitive Defusion Steps):</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">1. الفكرة الملتصقة بالذهن (الاندماج التام):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={hookThought}
                        onChange={(e) => setHookThought(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-rose-300 font-bold focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleGenerateDefusion(hookThought)}
                        className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
                      >
                        تطبيق خطوات الفك 🪄
                      </button>
                    </div>
                  </div>

                  {defusedThoughtStep1 && (
                    <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1">
                      <span className="text-[11px] text-indigo-300 font-bold block">2. خطوة التراجع الأولى (الوعي بالفكرة كفكرة وليست حقيقة مطلقة):</span>
                      <p className="text-sm font-bold text-white font-mono">{defusedThoughtStep1}</p>
                    </div>
                  )}

                  {defusedThoughtStep2 && (
                    <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/30 space-y-1">
                      <span className="text-[11px] text-teal-300 font-bold block">3. خطوة الذات الملاحظة (التحرر الواعي والمسافة النفسية):</span>
                      <p className="text-sm font-bold text-teal-200 font-mono">{defusedThoughtStep2}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMMITTED ACTION */}
          {activeTab === 'committed_action' && (
            <div className="space-y-6">
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-xs font-black text-teal-300 uppercase flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>صياغة العمل الملتزم نحو القيم (Committed Action Plan):</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">الهدف السلوكي المحدد والقابل للتحقيق:</label>
                    <input
                      type="text"
                      value={smartGoal}
                      onChange={(e) => setSmartGoal(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">ما هي الأفكار/المشاعر الصعبة التي قد تظهر وتعيقك أثناء التنفيذ؟</label>
                    <input
                      type="text"
                      value={potentialHook}
                      onChange={(e) => setPotentialHook(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-rose-300 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-bold">مقياس التقبل والاستعداد الداخلي (Willingness Scale):</span>
                      <span className="text-base font-black text-teal-400 font-mono">{willingnessScore} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={willingnessScore}
                      onChange={(e) => setWillingnessScore(Number(e.target.value))}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>1 (غير مستعد للمخاطرة)</span>
                      <span>5 (استعداد متوسط)</span>
                      <span>10 (مستعد لتقبل الألم من أجل قيمي)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>مصفوفة العلاج بالقبول والالتزام (Acceptance & Commitment Therapy - ACT)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInjectSoap}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>حقن تقرير ACT في SOAP ✨</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
