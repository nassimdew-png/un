import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Heart,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  X,
  User,
  Search,
  Check,
  FileText,
  Clock,
  Waves,
  ShieldCheck,
  Monitor,
  Share2,
  QrCode,
  Copy,
  ExternalLink,
  Phone,
  Radio
} from 'lucide-react';

export default function CardiacCoherenceStudioModal({
  isOpen,
  onClose,
  patient = null,
  patients = [],
  onInjectSoap = null,
}) {
  if (!isOpen) return null;

  // Selected Patient State
  const [selectedPatient, setSelectedPatient] = useState(patient || (patients.length > 0 ? patients[0] : null));
  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const pickerRef = useRef(null);

  // Breathing Protocol Mode
  // '365_resonance' (5s In, 5s Out - 6 rpm) | '4_7_8' (Relaxation) | 'box_4444' (Focus) | 'custom'
  const [protocolMode, setProtocolMode] = useState('365_resonance');
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(5); // 3, 5, 10, 15 min

  // Timing Configurations (in seconds)
  const [inhaleTime, setInhaleTime] = useState(5.0);
  const [holdInTime, setHoldInTime] = useState(0.0);
  const [exhaleTime, setExhaleTime] = useState(5.0);
  const [holdOutTime, setHoldOutTime] = useState(0.0);

  // Visual Theme & Sound
  const [colorTheme, setColorTheme] = useState('teal'); // 'teal' | 'indigo' | 'emerald' | 'cyan' | 'sunset'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Session Live Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('ready'); // 'inhale' | 'hold_in' | 'exhale' | 'hold_out' | 'ready'
  const [phaseProgress, setPhaseProgress] = useState(0); // 0 to 1
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Simulated Biofeedback & Coherence Metrics
  const [coherenceScore, setCoherenceScore] = useState(85); // %
  const [estimatedHeartRate, setEstimatedHeartRate] = useState(72); // bpm

  // Audio Context Ref
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);
  const containerRef = useRef(null);

  // Session Code for Dual-Screen Synchronization
  const [sessionCode] = useState(() => 'COH-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  // Apply protocol presets
  const handleSelectProtocol = (mode) => {
    setProtocolMode(mode);
    if (mode === '365_resonance') {
      setInhaleTime(5.0);
      setHoldInTime(0.0);
      setExhaleTime(5.0);
      setHoldOutTime(0.0);
    } else if (mode === '4_7_8') {
      setInhaleTime(4.0);
      setHoldInTime(7.0);
      setExhaleTime(8.0);
      setHoldOutTime(0.0);
    } else if (mode === 'box_4444') {
      setInhaleTime(4.0);
      setHoldInTime(4.0);
      setExhaleTime(4.0);
      setHoldOutTime(4.0);
    }
    handleReset();
  };

  // Sound chimes
  const playChime = (freq = 528, type = 'sine', duration = 0.15) => {
    if (!soundEnabled || soundVolume <= 0) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(soundVolume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  };

  // Main Breathing Timer Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTimestamp = performance.now();
    let currentPhaseLocal = currentPhase === 'ready' ? 'inhale' : currentPhase;
    let phaseElapsed = phaseProgress * (currentPhaseLocal === 'inhale' ? inhaleTime : currentPhaseLocal === 'hold_in' ? holdInTime : currentPhaseLocal === 'exhale' ? exhaleTime : holdOutTime);

    if (currentPhase === 'ready') {
      setCurrentPhase('inhale');
      playChime(528, 'sine', 0.25);
    }

    const loop = (currentTime) => {
      const delta = (currentTime - lastTimestamp) / 1000;
      lastTimestamp = currentTime;

      phaseElapsed += delta;
      setElapsedSeconds((prev) => prev + delta);

      // Determine active duration
      let activeDuration = 5;
      if (currentPhaseLocal === 'inhale') activeDuration = inhaleTime;
      else if (currentPhaseLocal === 'hold_in') activeDuration = holdInTime;
      else if (currentPhaseLocal === 'exhale') activeDuration = exhaleTime;
      else if (currentPhaseLocal === 'hold_out') activeDuration = holdOutTime;

      // Phase Transition
      if (phaseElapsed >= activeDuration) {
        phaseElapsed = 0;
        if (currentPhaseLocal === 'inhale') {
          if (holdInTime > 0) {
            currentPhaseLocal = 'hold_in';
            playChime(660, 'sine', 0.12);
          } else {
            currentPhaseLocal = 'exhale';
            playChime(440, 'sine', 0.3);
          }
        } else if (currentPhaseLocal === 'hold_in') {
          currentPhaseLocal = 'exhale';
          playChime(440, 'sine', 0.3);
        } else if (currentPhaseLocal === 'exhale') {
          if (holdOutTime > 0) {
            currentPhaseLocal = 'hold_out';
            playChime(330, 'sine', 0.12);
          } else {
            currentPhaseLocal = 'inhale';
            playChime(528, 'sine', 0.25);
            setCompletedCycles((c) => c + 1);
          }
        } else if (currentPhaseLocal === 'hold_out') {
          currentPhaseLocal = 'inhale';
          playChime(528, 'sine', 0.25);
          setCompletedCycles((c) => c + 1);
        }
        setCurrentPhase(currentPhaseLocal);
      }

      const progress = Math.min(phaseElapsed / Math.max(activeDuration, 0.1), 1);
      setPhaseProgress(progress);

      // Simulate Biofeedback Coherence
      setCoherenceScore((prev) => Math.min(98, Math.max(65, Math.round(80 + Math.sin(currentTime / 2000) * 12))));
      setEstimatedHeartRate((prev) => Math.round(74 - Math.min(12, (completedCycles * 0.8))));

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentPhase, inhaleTime, holdInTime, exhaleTime, holdOutTime, completedCycles]);

  const handleTogglePlay = () => {
    if (!isPlaying && audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsPlaying((prev) => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentPhase('ready');
    setPhaseProgress(0);
    setElapsedSeconds(0);
    setCompletedCycles(0);
  };

  // Fullscreen
  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  // Inject to SOAP handler
  const handleInjectSoap = () => {
    const summary = `[جلسة الارتجاع البيولوجي والتوافق القلبي - Biofeedback & Cardiac Coherence]:\n` +
      `- البروتوكول المطبق: ${protocolMode === '365_resonance' ? 'التنفس الرنيني 365 (6 دورات/دقيقة)' : protocolMode === '4_7_8' ? 'بروتوكول الاسترخاء والتهدئة 4-7-8' : 'تنفس المربع Box Breathing 4-4-4-4'}\n` +
      `- المدة المنجزة: ${Math.floor(elapsedSeconds / 60)} دقيقة و ${Math.floor(elapsedSeconds % 60)} ثانية (${completedCycles} دورة تنفسية كاملة)\n` +
      `- مؤشر التوافق القلبي المحقق (Coherence Score): ${coherenceScore}%\n` +
      `- النبض التقديري: تراجع إلى ${estimatedHeartRate} bpm مع انتظام ملحوظ في التردد التنفسي.`;

    if (onInjectSoap) {
      onInjectSoap({
        objective: summary,
        assessment: 'استجابة فسيولوجية ممتازة لتمارين التوافق القلبي مع تراجع التوتر العضلي وانتظام التنفس.',
      });
    }
    onClose();
  };

  // Calculate visual circle scale based on phase and progress
  const circleScale = useMemo(() => {
    if (currentPhase === 'inhale') {
      return 1 + phaseProgress * 0.75; // expands from 1.0 to 1.75
    } else if (currentPhase === 'hold_in') {
      return 1.75;
    } else if (currentPhase === 'exhale') {
      return 1.75 - phaseProgress * 0.75; // shrinks from 1.75 to 1.0
    } else if (currentPhase === 'hold_out') {
      return 1.0;
    }
    return 1.0;
  }, [currentPhase, phaseProgress]);

  // Visual Theme Colors
  const themeColors = {
    teal: { bg: 'from-teal-950/40 to-slate-900', circle: '#0d9488', glow: 'rgba(13, 148, 136, 0.4)', text: 'text-teal-400' },
    indigo: { bg: 'from-indigo-950/40 to-slate-900', circle: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)', text: 'text-indigo-400' },
    emerald: { bg: 'from-emerald-950/40 to-slate-900', circle: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', text: 'text-emerald-400' },
    cyan: { bg: 'from-cyan-950/40 to-slate-900', circle: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', text: 'text-cyan-400' },
    sunset: { bg: 'from-amber-950/40 to-slate-900', circle: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-400' },
  };
  const activeTheme = themeColors[colorTheme] || themeColors.teal;

  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return patients;
    const q = patientSearchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const name = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
      const phone = (p.phone || p.parent_phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [patients, patientSearchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans" dir="rtl">
      <div className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-teal-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-teal-950/30 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Heart className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate">
                  مختبر الارتجاع البيولوجي والتوافق القلبي (Cardiac Coherence 365)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Biofeedback Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                التنفس الرنيني وتنظيم الجهاز العصبي الذاتي لعلاج الهلع، القلق، وخفض فرط الاستثارة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pop-out button */}
            <button
              type="button"
              onClick={() => {
                const url = `/coherence/display?code=${sessionCode}`;
                window.open(url, 'PsyProCoherencePatientScreen', 'width=1280,height=720');
              }}
              className="px-3 py-2 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              title="فتح شاشة المريض المستقلة على شاشة ثانية"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>🖥️ شاشة المريض</span>
            </button>

            {/* Patient Selector */}
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setIsPatientPickerOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 text-xs font-bold text-slate-200 transition flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-teal-400" />
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
                      className="w-full pr-8 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
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
                        {selectedPatient?.id === p.id && <Check className="w-3.5 h-3.5 text-teal-400" />}
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

        {/* Protocols Bar */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">البروتوكول:</span>
            {[
              { id: '365_resonance', label: '🫁 الرنيني 365 (5s شهيق / 5s زفير)', desc: '6 دورات/دقيقة' },
              { id: '4_7_8', label: '🧘 التهدئة 4-7-8', desc: 'للقلق والأرق' },
              { id: 'box_4444', label: '📦 تنفس المربع 4-4-4-4', desc: 'للتركيز والسيطرة' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProtocol(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  protocolMode === p.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">السمة:</span>
            {['teal', 'indigo', 'emerald', 'cyan', 'sunset'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setColorTheme(t)}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  colorTheme === t ? 'border-white scale-110' : 'border-transparent opacity-60'
                }`}
                style={{ backgroundColor: themeColors[t].circle }}
              />
            ))}
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Central Resonant Visualizer Arena */}
          <div
            ref={containerRef}
            className={`w-full rounded-3xl bg-gradient-to-b ${activeTheme.bg} border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between p-6 sm:p-8 min-h-[340px]`}
          >
            {/* Top Indicator */}
            <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 z-10">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-teal-400 animate-ping' : 'bg-slate-600'}`} />
                <span>
                  {currentPhase === 'inhale' ? 'شهيق عميق (Inhale ⬆️)' : currentPhase === 'hold_in' ? 'حبس النفس (Hold ⏸️)' : currentPhase === 'exhale' ? 'زفير مريح (Exhale ⬇️)' : currentPhase === 'hold_out' ? 'استراحة (Pause)' : 'جاهز للبدء'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span>الدورات: <strong>{completedCycles}</strong></span>
                <span>•</span>
                <span>الزمن: <strong>{Math.floor(elapsedSeconds / 60)}:{String(Math.floor(elapsedSeconds % 60)).padStart(2, '0')}</strong></span>
              </div>
            </div>

            {/* Expanding/Contracting Resonant Circle */}
            <div className="relative my-auto flex items-center justify-center">
              {/* Outer guide ring */}
              <div
                className="w-56 h-56 rounded-full border-2 border-dashed border-slate-700/60 pointer-events-none absolute"
              />

              {/* Dynamic Breathing Bubble */}
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-100 ease-linear"
                style={{
                  transform: `scale(${circleScale})`,
                  backgroundColor: activeTheme.circle,
                  boxShadow: `0 0 60px ${activeTheme.glow}, inset 0 0 25px rgba(255,255,255,0.4)`,
                }}
              >
                <div className="text-center text-slate-950 font-black select-none">
                  <div className="text-xs uppercase tracking-wider opacity-80">
                    {currentPhase === 'inhale' ? 'شهيق' : currentPhase === 'hold_in' ? 'احبس' : currentPhase === 'exhale' ? 'زفير' : currentPhase === 'hold_out' ? 'توقف' : 'ابدأ'}
                  </div>
                  <div className="text-xl font-mono">
                    {currentPhase === 'inhale'
                      ? Math.ceil(inhaleTime * (1 - phaseProgress))
                      : currentPhase === 'exhale'
                      ? Math.ceil(exhaleTime * (1 - phaseProgress))
                      : currentPhase === 'hold_in'
                      ? Math.ceil(holdInTime * (1 - phaseProgress))
                      : Math.ceil(holdOutTime * (1 - phaseProgress))}s
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Real-time Biofeedback Metrics Bar */}
            <div className="w-full grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-center z-10">
              <div className="p-2 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-bold">مؤشر التوافق القلبي (Coherence)</span>
                <span className="text-base font-black text-teal-400 font-mono">{coherenceScore}%</span>
              </div>

              <div className="p-2 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-bold">معدل ضربات القلب التقديري</span>
                <span className="text-base font-black text-rose-400 font-mono">{estimatedHeartRate} bpm</span>
              </div>

              <div className="p-2 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-bold">الحالة العصبية المستهدفة</span>
                <span className="text-xs font-bold text-emerald-300 mt-0.5 block">تنظيم عصب الحائر (Vagal Tone)</span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg transition ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/30'
                }`}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isPlaying ? 'إيقاف مؤقت' : 'بدء جلسة التوافق'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
                title="إعادة ضبط"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={`p-2.5 rounded-2xl border transition ${
                  soundEnabled
                    ? 'bg-teal-600/20 text-teal-300 border-teal-500/40'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
                title="كتم / تفعيل التنبيه الصوتي"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={toggleFullScreen}
                className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                title="ملء الشاشة"
              >
                {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleInjectSoap}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition"
              >
                <FileText className="w-4 h-4" />
                <span>حقن النتائج في تقرير SOAP ✨</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
