import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TrendingDown,
  Activity,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  FileText,
  User,
  Search,
  Check,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Flame,
  ArrowDown
} from 'lucide-react';

export default function ExposureHierarchyStudioModal({
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

  // Active Tab: 'hierarchy_builder' | 'live_exposure' | 'habituation_chart'
  const [activeTab, setActiveTab] = useState('live_exposure');

  // Fear Ladder Items (0 to 100 SUDS)
  const [hierarchyItems, setHierarchyItems] = useState([
    { id: 1, title: 'التفكير في ركوب المصعد بمفرده', suds: 30, completed: true },
    { id: 2, title: 'الوقوف أمام باب المصعد المفتوح دون الدخول', suds: 50, completed: true },
    { id: 3, title: 'الدخول إلى المصعد مع شخص مقرب لطابق واحد', suds: 70, completed: false },
    { id: 4, title: 'ركوب المصعد بمفرده لطابق واحد', suds: 85, completed: false },
    { id: 5, title: 'ركوب المصعد بمفرده لـ 5 طوابق متتالية', suds: 100, completed: false },
  ]);

  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemSuds, setNewItemSuds] = useState(60);

  // Live In-Session Exposure Trial State
  const [selectedTrigger, setSelectedTrigger] = useState(hierarchyItems[2]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [currentSuds, setCurrentSuds] = useState(70);
  const [initialSuds, setInitialSuds] = useState(70);

  // Minute-by-minute SUDS log (Habituation curve data points)
  const [sudsLog, setSudsLog] = useState([
    { minute: 0, suds: 70, note: 'بداية التعريض - تسارع خفقان القلب' },
    { minute: 2, suds: 85, note: 'ذروة التوتر والخوف من الاختناق' },
    { minute: 5, suds: 60, note: 'استقرار التنفس وبداية التعود' },
    { minute: 8, suds: 35, note: 'انخفاض ملحوظ وتراجع الهلع' },
  ]);

  const [logNoteInput, setLogNoteInput] = useState('');

  // Timer loop
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleAddHierarchyItem = () => {
    if (!newItemTitle.trim()) return;
    const newItem = {
      id: Date.now(),
      title: newItemTitle.trim(),
      suds: Number(newItemSuds),
      completed: false,
    };
    setHierarchyItems((prev) => [...prev, newItem].sort((a, b) => a.suds - b.suds));
    setNewItemTitle('');
    setNewItemSuds(50);
  };

  const handleDeleteItem = (id) => {
    setHierarchyItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLogSudsPoint = () => {
    const currentMin = Math.round(timerSeconds / 60);
    const newPoint = {
      minute: currentMin,
      suds: Number(currentSuds),
      note: logNoteInput.trim() || `تسجيل الدقيقة ${currentMin}`,
    };
    setSudsLog((prev) => [...prev, newPoint]);
    setLogNoteInput('');
  };

  // Habituation Achieved Threshold (50% reduction from peak)
  const peakSuds = useMemo(() => Math.max(...sudsLog.map((p) => p.suds), initialSuds), [sudsLog, initialSuds]);
  const latestSuds = useMemo(() => (sudsLog.length > 0 ? sudsLog[sudsLog.length - 1].suds : currentSuds), [sudsLog, currentSuds]);
  const isHabituated = latestSuds <= Math.round(peakSuds / 2);

  // Inject into SOAP notes
  const handleInjectSoap = () => {
    const summary = `[جلسة التعريض المتدرج ومنع الاستجابة - Graded Exposure & Habituation]:\n` +
      `- المثير المستهدف: ${selectedTrigger?.title || 'تعريض سريري متدرج'}\n` +
      `- شدة الضيق الأولية (Baseline SUDS): ${initialSuds}/100 | الذروة المسجلة: ${peakSuds}/100\n` +
      `- شدة الضيق عند انتهاء التعريض: ${latestSuds}/100 (${isHabituated ? '✓ تحقق التكيف العصبي والانطفاء بنسبة > 50%' : 'تراجع تدريجي مستمر'})\n` +
      `- مدة التعريض: ${Math.floor(timerSeconds / 60)} دقيقة و ${timerSeconds % 60} ثانية عبر ${sudsLog.length} نقاط رصد دقيقة.`;

    if (onInjectSoap) {
      onInjectSoap({
        objective: summary,
        assessment: `تحسن ملحوظ في تحمل المثيرات القلقية وانخفاض منحنى SUDS من ${peakSuds} إلى ${latestSuds}.`,
        sudsPost: latestSuds,
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
      <div className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-teal-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-rose-950/30 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-600 text-white font-black flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate">
                  مختبر التعريض المتدرج ومنحنى التكيف العصبي (Graded Exposure Studio)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  CBT / ERP Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                بناء سلم المخاوف، ميقاتية التعريض اللحظي، وتوثيق انطفاء التوتر (Habituation Curve) للرهاب والوسواس OCD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Patient Selector */}
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setIsPatientPickerOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-xs font-bold text-slate-200 transition flex items-center gap-2 shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-rose-400" />
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
                      className="w-full pr-8 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
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
                        {selectedPatient?.id === p.id && <Check className="w-3.5 h-3.5 text-rose-400" />}
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
            onClick={() => setActiveTab('live_exposure')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'live_exposure'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>جلسة التعريض اللحظية والميقاتية ⏱️</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hierarchy_builder')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'hierarchy_builder'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>سلم المخاوف المتدرج (0-100 SUDS) 🪜</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: LIVE EXPOSURE SESSION & HABITUATION CURVE */}
          {activeTab === 'live_exposure' && (
            <div className="space-y-6">
              
              {/* Target Exposure Context Box */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1 text-center md:text-right">
                  <span className="text-xs font-bold text-rose-400 uppercase">المثير القلقي قيد التعريض:</span>
                  <div className="text-base font-black text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                    <span>{selectedTrigger ? selectedTrigger.title : 'اختر خطوة من سلم المخاوف'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">الزمن المنقضي</span>
                    <span className="text-lg font-mono font-black text-amber-400">
                      {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="text-center px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">الذروة (Peak)</span>
                    <span className="text-lg font-mono font-black text-rose-400">{peakSuds}/100</span>
                  </div>

                  <div className="text-center px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">الحالي (Current)</span>
                    <span className="text-lg font-mono font-black text-emerald-400">{latestSuds}/100</span>
                  </div>
                </div>
              </div>

              {/* Interactive Habituation SVG Chart */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-200 uppercase flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-400" />
                    <span>منحنى التكيف العصبي والانطفاء التدريجي (Extinction Curve):</span>
                  </h3>
                  {isHabituated ? (
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تحقق التكيف (انخفاض {'>'} 50%) 🎉</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">
                      العتبة المستهدفة: ≤ {Math.round(peakSuds / 2)} SUDS
                    </span>
                  )}
                </div>

                {/* SVG Line Chart */}
                <div className="w-full h-48 bg-slate-900/60 rounded-2xl border border-slate-800 p-4 relative flex items-end">
                  <svg className="w-full h-full overflow-visible">
                    {/* 50% Threshold Guide Line */}
                    <line
                      x1="0"
                      y1={`${100 - Math.round(peakSuds / 2)}%`}
                      x2="100%"
                      y2={`${100 - Math.round(peakSuds / 2)}%`}
                      stroke="rgba(16, 185, 129, 0.4)"
                      strokeDasharray="4,4"
                      strokeWidth="2"
                    />

                    {/* Polyline Path */}
                    {sudsLog.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={sudsLog
                          .map((p, idx) => {
                            const x = (idx / (sudsLog.length - 1)) * 100;
                            const y = 100 - p.suds;
                            return `${x}%,${y}%`;
                          })
                          .join(' ')}
                      />
                    )}

                    {/* Data Points */}
                    {sudsLog.map((p, idx) => {
                      const x = sudsLog.length > 1 ? (idx / (sudsLog.length - 1)) * 100 : 50;
                      const y = 100 - p.suds;
                      return (
                        <g key={idx}>
                          <circle cx={`${x}%`} cy={`${y}%`} r="6" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
                          <text x={`${x}%`} y={`${y - 8}%`} fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
                            {p.suds}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>الدقيقة 0 (البداية)</span>
                  <span>منحنى انخفاض التوتر مع البقاء في الموقف دون تجنب</span>
                  <span>الدقيقة {Math.floor(timerSeconds / 60)} (الحالي)</span>
                </div>
              </div>

              {/* In-Session SUDS Logging Box */}
              <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block font-bold">مقياس SUDS اللحظي:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={currentSuds}
                      onChange={(e) => setCurrentSuds(Number(e.target.value))}
                      className="w-36 accent-rose-500 cursor-pointer"
                    />
                  </div>
                  <span className="text-base font-black text-rose-400 font-mono">{currentSuds} / 100</span>

                  <input
                    type="text"
                    placeholder="ملاحظة أو استجابة جسدية..."
                    value={logNoteInput}
                    onChange={(e) => setLogNoteInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLogSudsPoint}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition"
                  >
                    تسجيل نقطة رصد 📍
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTimerRunning((prev) => !prev)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 ${
                      isTimerRunning ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isTimerRunning ? 'إيقاف مؤقت' : 'تشغيل الميقاتية'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsTimerRunning(false);
                      setTimerSeconds(0);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="تصفير الميقاتية"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HIERARCHY BUILDER */}
          {activeTab === 'hierarchy_builder' && (
            <div className="space-y-5">
              {/* Add New Trigger Box */}
              <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-black text-slate-300 uppercase">إضافة موقف أو مثير إلى سلم المخاوف:</h4>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    placeholder="مثال: النظر من شرفة الطابق الثالث، لمس مقبض الباب دون تعقيم..."
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    className="flex-1 w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-slate-400 font-bold">SUDS:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={newItemSuds}
                      onChange={(e) => setNewItemSuds(e.target.value)}
                      className="w-20 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-rose-300 font-mono text-center"
                    />
                    <button
                      type="button"
                      onClick={handleAddHierarchyItem}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة للسلم</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Fear Ladder List */}
              <div className="space-y-2">
                {hierarchyItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedTrigger(item);
                      setInitialSuds(item.suds);
                      setCurrentSuds(item.suds);
                      setActiveTab('live_exposure');
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedTrigger?.id === item.id
                        ? 'bg-rose-950/40 border-rose-500/60 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">{item.title}</span>
                        <span className="text-[11px] text-slate-500">انقر لبدء جلسة تعريض لهذا المثير فوراً</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-xl font-mono font-black text-xs border ${
                        item.suds >= 80
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : item.suds >= 50
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                      }`}>
                        {item.suds} SUDS
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>بروتوكول التعريض ومنع الاستجابة (Exposure and Response Prevention - ERP)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInjectSoap}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>حقن تقرير التعريض في SOAP ✨</span>
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
