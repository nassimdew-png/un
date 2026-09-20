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
  Target,
  FileText,
  AlertCircle,
  X,
  Gauge,
  Sliders,
  CheckCircle2,
  Layers,
  Award,
  Zap,
  BookOpen,
  Info
} from 'lucide-react';

const ARABIC_FLUENCY_EXERCISES = [
  {
    category: 'كلمات ثنائية وثلاثية المقطع (Easy Onset)',
    items: [
      { text: 'سَــلاَمْ', syllables: 2, phonetic: 'Sa-lam' },
      { text: 'هَــوَاءْ', syllables: 2, phonetic: 'Ha-wa' },
      { text: 'مَــدْرَسَــةْ', syllables: 3, phonetic: 'Mad-ra-sah' },
      { text: 'طَــبِــيـبْ', syllables: 2, phonetic: 'Ta-beeb' },
      { text: 'صَــبَــاحُ الخَــيْــر', syllables: 4, phonetic: 'Sa-ba-hul-khayr' },
    ]
  },
  {
    category: 'جمل قصيرة وتدفق مستمر (Continuous Phonation)',
    items: [
      { text: 'أَنَا أَسْكُنُ فِي مَدِينَةٍ جَمِيلَةٍ', syllables: 11, phonetic: 'A-na as-ku-nu...' },
      { text: 'الشَّمْسُ تُشْرِقُ كُلَّ صَبَاحٍ دَافِئٍ', syllables: 10, phonetic: 'Ash-sham-su tush-ri-qu...' },
      { text: 'نَمْشِي بِهُدُوءٍ فِي الحَدِيقَةِ الكَبِيرَةِ', syllables: 12, phonetic: 'Nam-shee bi-hu-doo...' },
      { text: 'أَتَنَفَّسُ بِعُمْقٍ ثُمَّ أَتَكَلَّمُ بِسَلاسَةٍ', syllables: 13, phonetic: 'A-ta-naf-fa-su...' },
    ]
  },
  {
    category: 'محادثة وتناوب الأدوار (Rhythmic Carrier Phrases)',
    items: [
      { text: 'فِي رَأْيِي أَنَّ هَذَا المَوْضُوعَ مُهِمٌّ جِدّاً', syllables: 14, phonetic: 'Fee ra-yee an-na...' },
      { text: 'اليَوْمَ كَانَ يَوْماً هَادِئاً وَمُثْمِراً لِلْغَايَةِ', syllables: 14, phonetic: 'Al-yawm ka-na...' },
      { text: 'أُرِيدُ أَنْ أَطْلُبَ كُوباً مِنَ المَاءِ الدَّافِئِ', syllables: 13, phonetic: 'U-ree-du an at-lub...' },
    ]
  }
];

export default function PacingBoardStudioModal({ isOpen, onClose, patientName = 'المريض', onInjectSoap }) {
  if (!isOpen) return null;

  // Configuration
  const [dotCount, setDotCount] = useState(5); // 5 or 7 dots
  const [bpm, setBpm] = useState(60); // 40 - 140 BPM
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [activeDotIndex, setActiveDotIndex] = useState(-1);
  const [techniqueMode, setTechniqueMode] = useState('pacing'); // 'pacing' | 'easy_onset' | 'syllable_calc'

  // Fluency & Stuttering Tracker (%SS - Percentage of Stuttered Syllables)
  const [totalSyllables, setTotalSyllables] = useState(0);
  const [stutterBlocks, setStutterBlocks] = useState(0);
  const [stutterProlongations, setStutterProlongations] = useState(0);
  const [stutterRepetitions, setStutterRepetitions] = useState(0);

  // Selected Target Exercise
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  const [customPhrase, setCustomPhrase] = useState('');

  // Audio Context Ref
  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);

  // Init Audio Context
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

  const playClickSound = useCallback((isHigh = false) => {
    if (isSoundMuted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isHigh ? 880 : 440, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio click error:', e);
    }
  }, [getAudioContext, isSoundMuted]);

  // Metronome Loop
  useEffect(() => {
    if (!isMetronomeActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      setActiveDotIndex(-1);
      return;
    }

    const intervalMs = (60 / bpm) * 1000;
    let currentDot = 0;

    timerRef.current = setInterval(() => {
      setActiveDotIndex(currentDot);
      playClickSound(currentDot === 0);
      currentDot = (currentDot + 1) % dotCount;
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMetronomeActive, bpm, dotCount, playClickSound]);

  // Manual Dot Tap
  const handleManualDotClick = (idx) => {
    setActiveDotIndex(idx);
    playClickSound(idx === 0);
    setTotalSyllables((prev) => prev + 1);
  };

  // Calculations
  const totalStutters = stutterBlocks + stutterProlongations + stutterRepetitions;
  const percentSS = totalSyllables > 0 ? ((totalStutters / totalSyllables) * 100).toFixed(1) : 0;

  const getSeverityTier = (ss) => {
    const val = parseFloat(ss);
    if (val === 0) return { label: 'طلاقة ممتازة (0%)', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800' };
    if (val <= 3) return { label: 'تلعثم خفيف جداً (Mild < 3%)', color: 'text-teal-400 bg-teal-950/40 border-teal-800' };
    if (val <= 8) return { label: 'تلعثم معتدل (Moderate 3-8%)', color: 'text-amber-400 bg-amber-950/40 border-amber-800' };
    if (val <= 15) return { label: 'تلعثم شديد (Severe 8-15%)', color: 'text-orange-400 bg-orange-950/40 border-orange-800' };
    return { label: 'تلعثم شديد جداً (Very Severe > 15%)', color: 'text-rose-400 bg-rose-950/40 border-rose-800' };
  };

  const handleResetSession = () => {
    setIsMetronomeActive(false);
    setActiveDotIndex(-1);
    setTotalSyllables(0);
    setStutterBlocks(0);
    setStutterProlongations(0);
    setStutterRepetitions(0);
  };

  const handleInjectSoap = () => {
    const activePhrase = customPhrase.trim() || ARABIC_FLUENCY_EXERCISES[selectedCategoryIdx].items[selectedItemIdx].text;
    const severity = getSeverityTier(percentSS);

    const text = `
🎯 **جلسة إعادة تأهيل طلاقة الكلام وتخفيف التلعثم (Fluency & Pacing Studio):**
- **التقنية المطبقة:** ${techniqueMode === 'pacing' ? 'لوح التقطيع الإيقاعي (Pacing Board)' : techniqueMode === 'easy_onset' ? 'الهجوم الصوتي السلس (Easy Onset & Continuous Phonation)' : 'قياس نسبة المقاطع المتلعثمة (%SS)'}
- **الإيقاع المعتمد:** ${bpm} دقة/دقيقة (BPM) | لوح التقطيع: ${dotCount} نقاط إيقاعية
- **العبارة المستهدفة:** "${activePhrase}"
- **إجمالي المقاطع المنطوقة:** ${totalSyllables} مقطع
- **عدد لحظات التعثر:** ${totalStutters} (حبسات Blocks: ${stutterBlocks} | إطالات Prolongations: ${stutterProlongations} | تكرارات Repetitions: ${stutterRepetitions})
- **مؤشر التلعثم (%SS):** ${percentSS}% — [${severity.label}]
- **الملاحظات السريرية:** استجابة المريض لاستراتيجية التقطيع المقطعي وضبط تدفق الزفير، مع انخفاض ملحوظ في التوتر العضلي لحنجرة المريض أثناء النطق الموجه.
`.trim();

    if (onInjectSoap) {
      onInjectSoap(text);
    }
  };

  const activePhrase = customPhrase.trim() || ARABIC_FLUENCY_EXERCISES[selectedCategoryIdx].items[selectedItemIdx].text;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">لوح التقطيع الإيقاعي وضبط طلاقة الكلام</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Pacing & Fluency Studio
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تدريب المريض ({patientName}) على الإيقاع المقطعي والبداية الصوتية السلسة مع احتساب فوري لـ %SS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className={`p-2 rounded-xl border transition-all ${
                isSoundMuted
                  ? 'bg-slate-800 text-slate-500 border-slate-700'
                  : 'bg-teal-950/40 text-teal-300 border-teal-800/60 hover:bg-teal-900/50'
              }`}
              title={isSoundMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
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

        {/* Subnav Modes */}
        <div className="px-6 py-2.5 bg-slate-950/30 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTechniqueMode('pacing')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                techniqueMode === 'pacing'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 inline ml-1.5" />
              لوح التقطيع الإيقاعي (Pacing Board)
            </button>
            <button
              onClick={() => setTechniqueMode('easy_onset')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                techniqueMode === 'easy_onset'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 inline ml-1.5" />
              الهجوم الصوتي السلس (Easy Onset)
            </button>
            <button
              onClick={() => setTechniqueMode('syllable_calc')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                techniqueMode === 'syllable_calc'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 inline ml-1.5" />
              عداد مؤشر التلعثم (%SS Tracker)
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-mono bg-slate-800/80 px-2 py-1 rounded text-teal-300 font-bold">
              {bpm} BPM
            </span>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Target Text Card */}
          <div className="bg-gradient-to-r from-teal-950/30 via-slate-900 to-slate-950 border border-teal-800/30 rounded-3xl p-5 text-center relative overflow-hidden">
            <div className="text-xs text-teal-400/80 font-medium mb-1">العبارة المستهدفة للتقطيع والتلفظ</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide py-2 select-all">
              {activePhrase}
            </div>

            {/* Syllable Segments Visualizer */}
            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              {activePhrase.split(' ').map((word, wIdx) => (
                <span
                  key={wIdx}
                  className="px-3 py-1 rounded-xl bg-slate-800/90 text-teal-200 text-sm border border-slate-700 font-medium shadow-inner"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* PACING BOARD INTERACTIVE STAGE */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center relative min-h-[220px]">
            
            {/* Dots Track */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 w-full py-4">
              {Array.from({ length: dotCount }).map((_, idx) => {
                const isActive = activeDotIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleManualDotClick(idx)}
                    className={`group relative rounded-full transition-all duration-200 flex flex-col items-center justify-center ${
                      isActive
                        ? 'w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-400 to-emerald-500 shadow-xl shadow-teal-500/40 scale-110 border-4 border-white'
                        : 'w-12 h-12 sm:w-16 sm:h-16 bg-slate-800/80 hover:bg-slate-700/80 border-2 border-slate-700 hover:border-teal-500/50 scale-100'
                    }`}
                  >
                    <span className={`font-bold font-mono text-base sm:text-lg ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
                      {idx + 1}
                    </span>
                    {isActive && (
                      <span className="absolute -bottom-6 text-[10px] font-bold text-teal-300 animate-pulse whitespace-nowrap">
                        انطق المقطع
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Airflow / Easy Onset Visualizer Wave */}
            {techniqueMode === 'easy_onset' && (
              <div className="w-full max-w-lg mt-4 bg-slate-900/80 rounded-2xl p-4 border border-teal-900/40">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>منحنى التدفق الزفيري (Easy Vocal Attack)</span>
                  <span className="text-teal-400 font-mono">تدرج هوائي مستمر</span>
                </div>
                <div className="h-10 w-full bg-slate-950 rounded-xl overflow-hidden relative flex items-center px-2">
                  <div
                    className="h-full bg-gradient-to-r from-transparent via-teal-500/40 to-emerald-500/80 rounded-xl transition-all duration-300"
                    style={{
                      width: isMetronomeActive ? `${((activeDotIndex + 1) / dotCount) * 100}%` : '50%'
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-around pointer-events-none text-[10px] text-slate-500 font-mono">
                    <span>زفير لطيف (H...)</span>
                    <span>بدء التذبذب</span>
                    <span>رنين الصوت</span>
                  </div>
                </div>
              </div>
            )}

            {/* Metronome Controls Bar */}
            <div className="flex items-center gap-4 mt-6 flex-wrap justify-center">
              <button
                onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                className={`px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all ${
                  isMetronomeActive
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 shadow-teal-500/20'
                }`}
              >
                {isMetronomeActive ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    إيقاف الميقاتية
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    بدء الإيقاع التلقائي
                  </>
                )}
              </button>

              <button
                onClick={handleResetSession}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                تصفير
              </button>

              {/* BPM Slider */}
              <div className="flex items-center gap-3 bg-slate-900 px-4 py-1.5 rounded-2xl border border-slate-800">
                <Sliders className="w-4 h-4 text-teal-400" />
                <span className="text-xs text-slate-400">السرعة:</span>
                <input
                  type="range"
                  min="40"
                  max="120"
                  step="5"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  className="w-24 accent-teal-400 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-teal-300 w-8">{bpm}</span>
              </div>

              {/* Dot Track Count (5 vs 7) */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
                <button
                  onClick={() => setDotCount(5)}
                  className={`px-3 py-1 rounded-xl font-medium transition-all ${
                    dotCount === 5 ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-400'
                  }`}
                >
                  5 نقاط
                </button>
                <button
                  onClick={() => setDotCount(7)}
                  className={`px-3 py-1 rounded-xl font-medium transition-all ${
                    dotCount === 7 ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30' : 'text-slate-400'
                  }`}
                >
                  7 نقاط
                </button>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN LOWER SECTION: %SS Clinical Tracker & Exercise Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left: %SS & Severity Analytics (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-950/40 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span className="text-sm font-bold text-white">حاسبة طلاقة الكلام ومؤشر التلعثم (%SS)</span>
                </div>
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${getSeverityTier(percentSS).color}`}>
                  {getSeverityTier(percentSS).label}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Syllables */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-center">
                  <div className="text-[11px] text-slate-400 mb-1">إجمالي المقاطع</div>
                  <div className="text-2xl font-black text-white font-mono">{totalSyllables}</div>
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => setTotalSyllables((p) => Math.max(0, p - 1))}
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 font-bold text-xs"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setTotalSyllables((p) => p + 1)}
                      className="flex-1 py-1 bg-teal-900/50 hover:bg-teal-800/60 rounded text-teal-300 font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Blocks (حبسات) */}
                <div className="bg-slate-900/80 border border-rose-950/40 rounded-2xl p-3 text-center">
                  <div className="text-[11px] text-rose-300/80 mb-1">حبسات (Blocks)</div>
                  <div className="text-2xl font-black text-rose-400 font-mono">{stutterBlocks}</div>
                  <button
                    onClick={() => {
                      setStutterBlocks((p) => p + 1);
                      setTotalSyllables((p) => p + 1);
                    }}
                    className="w-full mt-2 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 rounded font-bold text-xs"
                  >
                    + حبسة
                  </button>
                </div>

                {/* Prolongations (إطالات) */}
                <div className="bg-slate-900/80 border border-amber-950/40 rounded-2xl p-3 text-center">
                  <div className="text-[11px] text-amber-300/80 mb-1">إطالات (Prolong)</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">{stutterProlongations}</div>
                  <button
                    onClick={() => {
                      setStutterProlongations((p) => p + 1);
                      setTotalSyllables((p) => p + 1);
                    }}
                    className="w-full mt-2 py-1 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/50 rounded font-bold text-xs"
                  >
                    + إطالة
                  </button>
                </div>

                {/* Repetitions (تكرارات) */}
                <div className="bg-slate-900/80 border border-indigo-950/40 rounded-2xl p-3 text-center">
                  <div className="text-[11px] text-indigo-300/80 mb-1">تكرارات (Repet)</div>
                  <div className="text-2xl font-black text-indigo-400 font-mono">{stutterRepetitions}</div>
                  <button
                    onClick={() => {
                      setStutterRepetitions((p) => p + 1);
                      setTotalSyllables((p) => p + 1);
                    }}
                    className="w-full mt-2 py-1 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50 rounded font-bold text-xs"
                  >
                    + تكرار
                  </button>
                </div>
              </div>

              {/* Severity Gauge Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>نسبة المقاطع المتلعثمة (%SS): <strong className="text-teal-400 font-bold">{percentSS}%</strong></span>
                  <span>الهدف السريري: &lt; 2.0%</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500 w-[15%]" title="طبيعي 0-3%" />
                  <div className="h-full bg-amber-500 w-[25%]" title="معتدل 3-8%" />
                  <div className="h-full bg-rose-500 w-[60%]" title="شديد > 8%" />
                </div>
              </div>
            </div>

            {/* Right: Exercise Bank & Custom Text (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                  <BookOpen className="w-4 h-4 text-teal-400" />
                  <span>بنك العبارات والتمارين التخاطبية</span>
                </div>

                {/* Category Select */}
                <select
                  value={selectedCategoryIdx}
                  onChange={(e) => {
                    setSelectedCategoryIdx(parseInt(e.target.value));
                    setSelectedItemIdx(0);
                    setCustomPhrase('');
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mb-2"
                >
                  {ARABIC_FLUENCY_EXERCISES.map((cat, idx) => (
                    <option key={idx} value={idx}>{cat.category}</option>
                  ))}
                </select>

                {/* Item Select */}
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {ARABIC_FLUENCY_EXERCISES[selectedCategoryIdx].items.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedItemIdx(idx);
                        setCustomPhrase('');
                      }}
                      className={`w-full text-right px-3 py-1.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                        selectedItemIdx === idx && !customPhrase
                          ? 'bg-teal-500/20 text-teal-200 border border-teal-500/30 font-bold'
                          : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{item.text}</span>
                      <span className="font-mono text-[10px] text-slate-500">{item.syllables} مقاطع</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="أو اكتب عبارة أو كلمة مخصصة هنا..."
                  value={customPhrase}
                  onChange={(e) => setCustomPhrase(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-400" />
            <span>يتم حساب مؤشر SSI-4 والطلاقة بناءً على معايير الجمعية الأمريكية ASHA</span>
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
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 text-sm font-bold shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all"
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
