import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Heart,
  Sliders,
  FileText,
  X,
  Zap,
  Info,
  Award,
  Layers,
  ShieldCheck
} from 'lucide-react';

const PMR_MUSCLE_GROUPS = [
  { id: 'right_hand', name_ar: 'اليد والساعد الأيمن', area: 'الأطراف العلوية', instruction: 'اقبض يدك اليمنى بشدة واثنِ معصمك للأعلى، اشعر بالتوتر في الأصابع والساعد.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'left_hand', name_ar: 'اليد والساعد الأيسر', area: 'الأطراف العلوية', instruction: 'اقبض يدك اليسرى بشدة واثنِ معصمك للأعلى، لاحظ التوتر العضلي المركز.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'biceps', name_ar: 'عضلات العضدين (ثني المرفقين)', area: 'الأطراف العلوية', instruction: 'اثنِ مرفقيك واضغط ذراعيك للأعلى باتجاه الكتفين لإبراز العضلة ذات الرأسين.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'forehead', name_ar: 'الجبهة والحواجب وفروة الرأس', area: 'الرأس والوجه', instruction: 'ارفع حاجبيك لأعلى قدر الإمكان كما لو كنت متفاجئاً، اشعر بالانقباض عبر الجبهة.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'eyes_nose', name_ar: 'العينين والأنف وأعلى الوجه', area: 'الرأس والوجه', instruction: 'أغمض عينيك بقوة شديدة واجعد أنفك كأنك تتذوق شيئاً حامضاً جداً.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'jaw_mouth', name_ar: 'الفك والأسنان واللسان', area: 'الرأس والوجه', instruction: 'أطبق فكك واضغط أسنانك معاً بلطف مع سحب زوايا فمك للخلف واضغط لسانك بسقف الحلق.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'neck', name_ar: 'عضلات الرقبة والحنجرة', area: 'العنق والكتفين', instruction: 'اسحب ذقنك بلطف نحو صدرك دون ملامسته لمقاومة الانحناء، اشعر بالتوتر خلف العنق.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'shoulders', name_ar: 'الكتفين وأعلى الظهر', area: 'العنق والكتفين', instruction: 'ارفع كتفيك للأعلى باتجاه أذنيك بأقصى استطاعة، استشعر الشد الممتد لأعلى الظهر.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'chest', name_ar: 'عضلات الصدر والرئتين', area: 'الجذع والبطن', instruction: 'خذ شهيقاً عميقاً جداً واحبس الهواء في صدرك مع شد عضلات القفص الصدري.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'stomach', name_ar: 'جدار البطن والمعدة', area: 'الجذع والبطن', instruction: 'اشدد عضلات بطنك بقوة كأنك تستعد لتلقي ضربة خفيفة، اجعل بطنك صلباً كالدرع.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'lower_back', name_ar: 'أسفل الظهر والعمود الفقري', area: 'الجذع والبطن', instruction: 'قوّس أسفل ظهرك للأمام برفق دون ألم، مع الحفاظ على بقية الجسم مسترخياً.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'buttocks', name_ar: 'عضلات الحوض والأرداف', area: 'الحوض والأطراف السفلية', instruction: 'اضغط عضلات المقعدة والأرداف معاً بقوة للداخل وثبت الانقباض.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'right_thigh', name_ar: 'الفخذ الأيمن', area: 'الحوض والأطراف السفلية', instruction: 'اشدد العضلة الرباعية لفخذك الأيمن واضغط الساق لأسفل باتجاه السرير أو الكرسي.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'right_calf', name_ar: 'ربلة الساق والقدم اليمنى', area: 'الحوض والأطراف السفلية', instruction: 'اثنِ أصابع قدمك اليمنى للأعلى باتجاه وجهك (Dorsiflexion)، اشعر بالشد في الساق.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'left_thigh', name_ar: 'الفخذ الأيسر', area: 'الحوض والأطراف السفلية', instruction: 'اشدد عضلات الفخذ الأيسر واجعلها متصلبة مع تثبيت الركبة.', tensionDuration: 7, relaxDuration: 15 },
  { id: 'left_calf', name_ar: 'ربلة الساق والقدم اليسرى', area: 'الحوض والأطراف السفلية', instruction: 'اثنِ أصابع قدمك اليسرى للأعلى باتجاه الركبة، لاحظ انقباض ربلة الساق.', tensionDuration: 7, relaxDuration: 15 },
];

export default function PmrRelaxationStudioModal({ isOpen, onClose, patientName = 'المريض', onInjectSoap }) {
  if (!isOpen) return null;

  // Session State
  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'ready' | 'tension' | 'release' | 'completed'
  const [timeLeft, setTimeLeft] = useState(7);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // Group Status Map (0: not started, 1: done)
  const [completedGroups, setCompletedGroups] = useState({});

  // SUDS before and after PMR (0 to 10)
  const [sudsBefore, setSudsBefore] = useState(7);
  const [sudsAfter, setSudsAfter] = useState(2);

  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);

  const currentGroup = PMR_MUSCLE_GROUPS[currentGroupIdx];

  // Web Audio Context
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playChime = useCallback((freq = 528, duration = 1.2, type = 'sine') => {
    if (isSoundMuted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('PMR Audio error:', e);
    }
  }, [getAudioContext, isSoundMuted]);

  // Handle phase countdown
  useEffect(() => {
    if (!isAutoPlay || phase === 'idle' || phase === 'completed') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Transition logic
        if (phase === 'tension') {
          // Switch to release phase
          setPhase('release');
          playChime(396, 1.5, 'triangle'); // Warm low release sound
          return currentGroup.relaxDuration;
        } else if (phase === 'release') {
          // Mark current group complete
          setCompletedGroups((prevMap) => ({ ...prevMap, [currentGroup.id]: true }));
          playChime(528, 2.0, 'sine'); // Calming harmonic tone

          // Advance to next group or finish
          if (currentGroupIdx < PMR_MUSCLE_GROUPS.length - 1) {
            setCurrentGroupIdx((g) => g + 1);
            setPhase('tension');
            return PMR_MUSCLE_GROUPS[currentGroupIdx + 1].tensionDuration;
          } else {
            setPhase('completed');
            setIsAutoPlay(false);
            return 0;
          }
        }
        return 0;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoPlay, phase, currentGroupIdx, currentGroup, playChime]);

  const handleStartGroup = () => {
    setPhase('tension');
    setTimeLeft(currentGroup.tensionDuration);
    setIsAutoPlay(true);
    playChime(639, 1.0, 'sine');
  };

  const handlePause = () => {
    setIsAutoPlay(false);
  };

  const handleResume = () => {
    setIsAutoPlay(true);
  };

  const handleResetSession = () => {
    setIsAutoPlay(false);
    setPhase('idle');
    setCurrentGroupIdx(0);
    setTimeLeft(7);
    setCompletedGroups({});
  };

  const handleSelectGroup = (idx) => {
    setIsAutoPlay(false);
    setCurrentGroupIdx(idx);
    setPhase('idle');
    setTimeLeft(PMR_MUSCLE_GROUPS[idx].tensionDuration);
  };

  const completedCount = Object.keys(completedGroups).length;
  const progressPct = Math.round((completedCount / PMR_MUSCLE_GROUPS.length) * 100);

  const handleInjectSoap = () => {
    const text = `
🧘 **جلسة الاسترخاء العضلي التدريجي لجاكوبسون (Jacobson PMR Protocol):**
- **المجموعات العضلية المنجزة:** ${completedCount} من أصل 16 مجموعة عضلية (${progressPct}%)
- **مقياس الضيق والتوتر العضلي (SUDS):** قبل الجلسة (${sudsBefore}/10) ⬅️ بعد الجلسة (${sudsAfter}/10) — [تحسن بمقدار ${sudsBefore - sudsAfter} درجات]
- **المناطق المستهدفة الرئيسية:** الأطراف العلوية، الوجه والفك، حزام الكتفين والرقبة، وجدار البطن والأطراف السفلية.
- **الاستجابة الفسيولوجية:** هدوء في وتيرة التنفس، ارتخاء حركي ملحوظ في عضلات الفك وعضلات حزام الكتف، وتقرير المريض بالشعور بالدفء والارتياح الجسدي العميق.
`.trim();

    if (onInjectSoap) {
      onInjectSoap(text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">استوديو الاسترخاء العضلي التدريجي (Jacobson PMR)</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  16 Muscle Groups Protocol
                </span>
              </div>
              <p className="text-xs text-slate-400">
                بروتوكول جاكوبسون الطبي لخفض التوتر العصبي وتعديل فرط الاستثارة الحركية للمريض ({patientName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className={`p-2 rounded-xl border transition-all ${
                isSoundMuted
                  ? 'bg-slate-800 text-slate-500 border-slate-700'
                  : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60 hover:bg-indigo-900/50'
              }`}
              title={isSoundMuted ? 'تفعيل الرنين' : 'كتم الرنين'}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Progress Strip */}
        <div className="px-6 py-2.5 bg-slate-950/30 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">إنجاز البروتوكول:</span>
            <span className="font-bold text-indigo-300">{completedCount} / 16 مجموعة</span>
          </div>
          <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center gap-2 font-mono text-indigo-400 font-bold">
            {progressPct}%
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Active Muscle Stage & Guided Visualizer */}
          <div className={`relative rounded-3xl p-6 border transition-all duration-500 overflow-hidden flex flex-col items-center justify-center text-center ${
            phase === 'tension'
              ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/50 shadow-2xl shadow-rose-950/30'
              : phase === 'release'
              ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/50 shadow-2xl shadow-emerald-950/30'
              : phase === 'completed'
              ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border-indigo-500/50'
              : 'bg-slate-950/60 border-slate-800'
          }`}>
            
            {/* Phase Badge & Counter */}
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                المجموعة {currentGroupIdx + 1} من 16: {currentGroup.area}
              </span>

              {phase === 'tension' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                  ⚡ مرحلة الشد والانقباض (Tension)
                </span>
              )}

              {phase === 'release' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 font-black animate-pulse">
                  🌿 مرحلة الإرخاء واستشعار الدفء (Release)
                </span>
              )}

              {phase === 'completed' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500 text-white">
                  🎉 اكتمل بروتوكول الاسترخاء الكامل
                </span>
              )}
            </div>

            {/* Muscle Name */}
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 mb-2">
              {currentGroup.name_ar}
            </h3>

            {/* Guidance Text */}
            <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed min-h-[44px]">
              {phase === 'tension'
                ? currentGroup.instruction
                : phase === 'release'
                ? 'اترك العضلات تسترخي تماماً... تنفس بعمق واستشعر تدفق الدم والدفء وزوال كل توتر متراكم.'
                : currentGroup.instruction}
            </p>

            {/* Circular Timer Display */}
            <div className="relative my-6 flex items-center justify-center">
              <div className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-300 ${
                phase === 'tension'
                  ? 'border-rose-500 bg-rose-950/30 text-rose-300 scale-105 shadow-xl shadow-rose-500/20'
                  : phase === 'release'
                  ? 'border-emerald-400 bg-emerald-950/30 text-emerald-300 scale-105 shadow-xl shadow-emerald-500/20'
                  : 'border-slate-700 bg-slate-900 text-slate-400'
              }`}>
                <span className="text-4xl font-black font-mono tracking-tight">
                  {phase === 'idle' ? currentGroup.tensionDuration : timeLeft}
                </span>
                <span className="text-[11px] font-medium mt-0.5 opacity-80">
                  {phase === 'tension' ? 'ثواني شد' : phase === 'release' ? 'ثواني إرخاء' : 'ثانية'}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {phase === 'idle' || phase === 'completed' ? (
                <button
                  onClick={handleStartGroup}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  بدء شد المجموعة الحالية
                </button>
              ) : isAutoPlay ? (
                <button
                  onClick={handlePause}
                  className="px-6 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  إيقاف مؤقت
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  متابعة التمرين
                </button>
              )}

              <button
                onClick={() => {
                  if (currentGroupIdx > 0) handleSelectGroup(currentGroupIdx - 1);
                }}
                disabled={currentGroupIdx === 0}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="المجموعة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (currentGroupIdx < PMR_MUSCLE_GROUPS.length - 1) handleSelectGroup(currentGroupIdx + 1);
                }}
                disabled={currentGroupIdx === PMR_MUSCLE_GROUPS.length - 1}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="المجموعة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleResetSession}
                className="px-3 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إعادة ضبط
              </button>
            </div>
          </div>

          {/* 16 Muscle Groups Matrix Grid */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">خريطة مجموعات العضلات الـ 16 (Jacobson Matrix)</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">انقر على أي مجموعة للانتقال المباشر إليها</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PMR_MUSCLE_GROUPS.map((group, idx) => {
                const isSelected = currentGroupIdx === idx;
                const isDone = completedGroups[group.id];

                return (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(idx)}
                    className={`p-3 rounded-2xl text-right transition-all border text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : isDone
                        ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] text-slate-500">#{idx + 1}</span>
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-700" />
                      )}
                    </div>
                    <div className="font-bold truncate">{group.name_ar}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{group.area}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUDS Tension Scale Evaluation (Before vs After) */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Before */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">مستوى الشد العضلي والتوتر قبل الجلسة (SUDS):</span>
                <span className="font-mono font-bold text-rose-400">{sudsBefore} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={sudsBefore}
                onChange={(e) => setSudsBefore(parseInt(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0: استرخاء تام</span>
                <span>5: توتر معتدل</span>
                <span>10: تشنج وتوتر حاد</span>
              </div>
            </div>

            {/* After */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">مستوى الشد العضلي بعد الجلسة:</span>
                <span className="font-mono font-bold text-emerald-400">{sudsAfter} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={sudsAfter}
                onChange={(e) => setSudsAfter(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0: استرخاء عميق</span>
                <span>5: هدوء نسبي</span>
                <span>10: بقاء التوتر</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>بروتوكول PMR معتمد لمرضى التوتر، اضطرابات النوم، والاضطرابات النفسوجسدية</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={() => {
                handleInjectSoap();
                onClose();
              }}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4" />
              حقن النتائج في الـ SOAP
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
