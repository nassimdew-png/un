import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Brain,
  Eye,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Phone,
  User,
  HeartHandshake,
  Heart,
  Save,
  FileText,
  Clock,
  Layers,
  Check,
  ArrowRight,
  Printer,
  Sparkle,
  Monitor,
  Tv,
  Share2,
  ExternalLink,
  QrCode,
  Copy,
  Radio,
  MessageSquare
} from 'lucide-react';
import { apiRequest } from '../../api';

export default function EmdrTraumaStudioModal({
  isOpen,
  onClose,
  patient = null,
  patients = [],
  onInjectSoap = null,
}) {
  if (!isOpen) return null;

  // Selected Patient State (can be passed or picked live)
  const [selectedPatient, setSelectedPatient] = useState(patient || (patients.length > 0 ? patients[0] : null));
  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const pickerRef = useRef(null);

  // Active Studio Mode: 'lightbar' | 'protocol' | 'safe_place' | 'summary'
  const [activeTab, setActiveTab] = useState('lightbar');

  // ==========================================
  // BLS LIGHTBAR ENGINE STATE
  // ==========================================
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5); // 1 to 10
  const [movementPattern, setMovementPattern] = useState('horizontal'); // 'horizontal' | 'infinity' | 'diagonal'
  const [dotColor, setDotColor] = useState('#0d9488'); // Teal
  const [dotSize, setDotSize] = useState(36); // px
  const [passesPerSet, setPassesPerSet] = useState(24); // passes per set
  const [currentPass, setCurrentPass] = useState(0);
  const [completedSetsCount, setCompletedSetsCount] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Sound BLS State (Web Audio API)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundTone, setSoundTone] = useState('sine_440'); // 'sine_440' | 'solfeggio_528' | 'soft_click'
  const [soundVolume, setSoundVolume] = useState(0.5);

  // Animation & Audio Refs
  const animFrameRef = useRef(null);
  const lightbarContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const dotPosRef = useRef({ x: 0, y: 0.5, dir: 1, angle: 0 });
  const [dotCoords, setDotCoords] = useState({ x: 0, y: 50 }); // in %

  // ==========================================
  // PATIENT DUAL SCREEN & REMOTE SYNC STATE
  // ==========================================
  const [sessionCode] = useState(() => 'EMDR-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [isPatientScreenConnected, setIsPatientScreenConnected] = useState(false);
  const [therapistGuidance, setTherapistGuidance] = useState('جلسة EMDR مباشرة - ركز نظرك على النقطة وتنفس بهدوء...');
  const syncChannelRef = useRef(null);

  // ==========================================
  // 8-PHASE EMDR PROTOCOL STATE
  // ==========================================
  const [protocolData, setProtocolData] = useState({
    // Phase 1 & 2: Target & Safe Place
    safePlaceTitle: 'شاطئ البحر وقت الغروب مع صوت الأمواج الهادئ',
    safePlaceSensoryAnchor: 'رائحة نسيم البحر والشعور بالدفء والسكينة',
    targetMemoryDescription: 'حادث سير وقع سنة 2024 مصحوب بصوت الفرامل المفاجئ',
    worstMomentImage: 'لحظة رؤية الزجاج يتطاير وتوقف السيارة',

    // Phase 3: Assessment
    negativeCognition: 'أنا في خطر دائم ولا أستطيع حماية نفسي',
    positiveCognition: 'أنا بأمان الآن وفي الحاضر ويمكنني التصرف بحكمة',
    vocScore: 2, // Validity of Cognition: 1 (Completely false) to 7 (Completely true)
    primaryEmotion: 'خوف شديد، ارتعاش، هلع مفاجئ',
    sudsScore: 8, // SUDS: 0 (No disturbance) to 10 (Highest disturbance)
    bodyLocation: 'انقباض شديد في الصدر وتسارع دقات القلب',

    // Phase 4: Processing sets history
    setsHistory: [
      { setNum: 1, passCount: 24, observation: 'تلاشي تدريجي لصوت الفرامل مع استمرار صورة الزجاج', suds: 7 },
      { setNum: 2, passCount: 24, observation: 'الشعور بأن الحادث انتهى وأصبح في الماضي، خفت ضربات القلب', suds: 5 },
    ],

    // Phase 5 & 6: Installation & Body Scan
    finalVocScore: 6,
    bodyScanResult: 'اختفاء انقباض الصدر، شعور بالاسترخاء والانفراج العضلي التام',

    // Phase 7 & 8: Closure & Clinical Notes
    clinicalNotes: 'استجابة ممتازة لجلسة التحفيز الثنائي، تراجع مقياس SUDS من 8 إلى 2، وارتفاع VoC من 2 إلى 6.',
  });

  const [currentSetNote, setCurrentSetNote] = useState('');
  const [currentSetSuds, setCurrentSetSuds] = useState(protocolData.sudsScore);

  // Common Negative Cognitions Presets
  const negativeCognitionPresets = [
    'أنا في خطر دائم / لست في أمان',
    'أنا عاجز ولا أستطيع السيطرة',
    'أنا عديم القيمة / لست جيداً بما فيه الكفاية',
    'كان ذلك خطأي / أنا المسؤول عما حدث',
    'لا يمكنني الوثوق بأي شخص',
    'أنا محطم ولا يمكن شفائي',
  ];

  // Common Positive Cognitions Presets
  const positiveCognitionPresets = [
    'أنا بأمان الآن في الوقت الحاضر',
    'يمكنني السيطرة وإدارة حياتي بحكمة',
    'أنا شخص ذو قيمة وأستحق التقدير',
    'لقد فعلت أفضل ما بوسعي في ذلك الوقت',
    'يمكنني الوثوق بمن يستحق الثقة',
    'أنا قادر على التعافي والمضي قدماً',
  ];

  // ==========================================
  // WEB AUDIO API ENGINE FOR BINAURAL BLS
  // ==========================================
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const playBilateralBeep = (panDirection) => {
    if (!soundEnabled) return;
    try {
      initAudio();
      const ctx = audioContextRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      // Pitch selection
      if (soundTone === 'solfeggio_528') {
        osc.frequency.setValueAtTime(528, ctx.currentTime); // 528Hz Solfeggio
      } else if (soundTone === 'soft_click') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // Standard 440Hz
      }

      // Duration and envelope
      const now = ctx.currentTime;
      const duration = soundTone === 'soft_click' ? 0.04 : 0.08;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(soundVolume * 0.4, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      if (panner) {
        // panDirection: -1 (Left) to +1 (Right)
        panner.pan.setValueAtTime(panDirection, now);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Web Audio BLS Error:', e);
    }
  };

  // ==========================================
  // BLS ANIMATION LOOP
  // ==========================================
  useEffect(() => {
    let lastTime = performance.now();
    let prevSide = 0; // -1 for Left, 1 for Right

    const updateLoop = (now) => {
      if (!isPlaying) return;

      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Speed calculation: speed 1 = 0.5Hz, speed 10 = 2.0Hz
      const frequency = 0.4 + (speed * 0.16); 
      const step = frequency * delta * 2; // Full left-right cycle

      let { x, y, dir, angle } = dotPosRef.current;

      if (movementPattern === 'horizontal') {
        x += dir * step * 100;
        if (x >= 95) {
          x = 95;
          dir = -1;
          if (prevSide !== 1) {
            playBilateralBeep(1); // Right
            prevSide = 1;
            setCurrentPass((p) => {
              const next = p + 1;
              if (next >= passesPerSet) {
                setIsPlaying(false);
                setCompletedSetsCount((c) => c + 1);
                return 0;
              }
              return next;
            });
          }
        } else if (x <= 5) {
          x = 5;
          dir = 1;
          if (prevSide !== -1) {
            playBilateralBeep(-1); // Left
            prevSide = -1;
            setCurrentPass((p) => {
              const next = p + 1;
              if (next >= passesPerSet) {
                setIsPlaying(false);
                setCompletedSetsCount((c) => c + 1);
                return 0;
              }
              return next;
            });
          }
        }
        y = 50;
      } else if (movementPattern === 'infinity') {
        // Lissajous figure-8
        angle += step * Math.PI;
        x = 50 + 42 * Math.sin(angle);
        y = 50 + 25 * Math.sin(2 * angle);

        // Edge detection for sound
        if (x > 85 && prevSide !== 1) {
          playBilateralBeep(1);
          prevSide = 1;
        } else if (x < 15 && prevSide !== -1) {
          playBilateralBeep(-1);
          prevSide = -1;
        }
      }

      dotPosRef.current = { x, y, dir, angle };
      setDotCoords({ x, y });

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    if (isPlaying) {
      initAudio();
      animFrameRef.current = requestAnimationFrame(updateLoop);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speed, movementPattern, passesPerSet, soundEnabled, soundTone, soundVolume]);

  const handleTogglePlay = () => {
    initAudio();
    setIsPlaying((prev) => !prev);
  };

  const handleResetSet = () => {
    setIsPlaying(false);
    setCurrentPass(0);
    dotPosRef.current = { x: 5, y: 50, dir: 1, angle: 0 };
    setDotCoords({ x: 5, y: 50 });
  };

  const handleAddProcessingSetNote = () => {
    if (!currentSetNote.trim()) return;

    const newSet = {
      setNum: protocolData.setsHistory.length + 1,
      passCount: passesPerSet,
      observation: currentSetNote.trim(),
      suds: currentSetSuds,
    };

    setProtocolData((prev) => ({
      ...prev,
      sudsScore: currentSetSuds,
      setsHistory: [...prev.setsHistory, newSet],
    }));

    setCurrentSetNote('');
    handleResetSet();
  };

  // Setup BroadcastChannel for 0-latency dual screen sync
  useEffect(() => {
    try {
      const ch = new BroadcastChannel(`psypro_emdr_channel_${sessionCode}`);
      syncChannelRef.current = ch;
      ch.onmessage = (e) => {
        if (e.data?.type === 'PATIENT_SCREEN_JOINED') {
          setIsPatientScreenConnected(true);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }
    return () => {
      if (syncChannelRef.current) syncChannelRef.current.close();
    };
  }, [sessionCode]);

  // Sync state broadcast whenever any parameter changes
  useEffect(() => {
    const payload = {
      is_playing: isPlaying,
      speed,
      movement_pattern: movementPattern,
      dot_color: dotColor,
      dot_size: dotSize,
      passes_per_set: passesPerSet,
      current_pass: currentPass,
      completed_sets: completedSetsCount,
      sound_enabled: soundEnabled,
      sound_tone: soundTone,
      sound_volume: soundVolume,
      therapist_guidance: therapistGuidance,
      session_code: sessionCode,
    };

    if (syncChannelRef.current) {
      syncChannelRef.current.postMessage(payload);
    }

    try {
      localStorage.setItem(`psypro_emdr_state_${sessionCode}`, JSON.stringify(payload));
    } catch (err) {}

    const timer = setTimeout(() => {
      apiRequest(`/public/emdr/${sessionCode}/sync`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }).catch(() => {});
    }, 200);

    return () => clearTimeout(timer);
  }, [
    isPlaying,
    speed,
    movementPattern,
    dotColor,
    dotSize,
    passesPerSet,
    currentPass,
    completedSetsCount,
    soundEnabled,
    soundTone,
    soundVolume,
    therapistGuidance,
    sessionCode,
  ]);

  const openPatientPopout = () => {
    const url = `/emdr-screen/${sessionCode}`;
    const w = 1280;
    const h = 720;
    const left = window.screen.width ? (window.screen.width - w) / 2 : 100;
    const top = window.screen.height ? (window.screen.height - h) / 2 : 100;
    window.open(url, 'PsyProEmdrPatientScreen', `width=${w},height=${h},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=no,resizable=yes`);
    setIsPatientScreenConnected(true);
  };

  // Fullscreen toggle for immersion
  const toggleFullScreen = () => {
    if (!lightbarContainerRef.current) return;
    if (!document.fullscreenElement) {
      lightbarContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  // Patient live search filtering
  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return patients;
    const q = patientSearchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const name = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
      const phone = (p.phone || p.parent_phone || '').toLowerCase();
      const folder = (p.folder_number || p.file_number || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || folder.includes(q);
    });
  }, [patients, patientSearchQuery]);

  // Inject to SOAP handler
  const handleInjectToSoap = () => {
    const summaryText = `[بروتوكول EMDR لإزالة التحسس وإعادة المعالجة]:\n` +
      `- الهدف الصادم: ${protocolData.targetMemoryDescription}\n` +
      `- المعتقد السلبي (NC): ${protocolData.negativeCognition}\n` +
      `- المعتقد الإيجابي (PC): ${protocolData.positiveCognition} (صلاحية VoC: ارتفعت من ${protocolData.vocScore}/7 إلى ${protocolData.finalVocScore}/7)\n` +
      `- مقياس الضيق (SUDS): انخفض من ${protocolData.sudsScore}/10 إلى ${protocolData.setsHistory.slice(-1)[0]?.suds ?? 2}/10 بعد ${protocolData.setsHistory.length} مجموعات BLS.\n` +
      `- نتيجة المسح الجسدي: ${protocolData.bodyScanResult}\n` +
      `- تقنية المكان الآمن المستخدمة: ${protocolData.safePlaceTitle}`;

    if (onInjectSoap) {
      onInjectSoap({
        objective: summaryText,
        assessment: `تحسن سريري ملحوظ في معالجة الشحنة الصدمية وتثبيت المعتقد الإيجابي (${protocolData.positiveCognition}).`,
        suds: protocolData.setsHistory.slice(-1)[0]?.suds ?? 2,
        voc: protocolData.finalVocScore,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans" dir="rtl">
      <div className="w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-teal-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* ========================================================================= */}
        {/* TOP HEADER: CLINICAL PATIENT CONTEXT & STUDIO SWITCHER                     */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-teal-950/30 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Eye className="w-6 h-6 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate">
                  مختبر وبروتوكول التحفيز الثنائي EMDR & Trauma Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Medical Grade
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                إزالة التحسس وإعادة المعالجة بحركات العينين (Eye Movement Desensitization & Reprocessing)
              </p>
            </div>
          </div>

          {/* Dual-Screen & Remote Synchronization Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pop-out Dual Monitor Button */}
            <button
              type="button"
              onClick={openPatientPopout}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition hover:scale-105"
              title="فتح شاشة مستقلة للمريض على شاشة ثانية أو جهاز عرض"
            >
              <Monitor className="w-3.5 h-3.5 text-teal-200" />
              <span>🖥️ فتح شاشة المريض (Dual-Screen)</span>
            </button>

            {/* Remote Share / QR Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 shadow-sm"
              title="مشاركة رابط الجلسة أو باركود QR مع هاتف أو تابلت المريض"
            >
              <Share2 className="w-3.5 h-3.5 text-teal-400" />
              <span>📱 رابط المريض / QR</span>
            </button>

            {/* Connection Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${isPatientScreenConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className={isPatientScreenConnected ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                {isPatientScreenConnected ? 'شاشة المريض متصلة 🟢' : 'شاشة المريض منفصلة ⚪'}
              </span>
            </div>

            {/* Patient Quick Selector Combobox */}
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setIsPatientPickerOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 text-xs font-bold text-slate-200 transition flex items-center gap-2 shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  {selectedPatient
                    ? `${selectedPatient.first_name || ''} ${selectedPatient.last_name || selectedPatient.name}`
                    : 'اختر مريضاً للجلسة...'}
                </span>
              </button>

              {isPatientPickerOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-2 animate-fade-in">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      placeholder="ابحث بالاسم أو رقم الهاتف..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="w-full pr-8 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredPatients.map((p) => {
                      const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name;
                      const isSelected = selectedPatient?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setIsPatientPickerOpen(false);
                          }}
                          className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                            isSelected
                              ? 'bg-teal-500/20 text-teal-300 font-bold'
                              : 'hover:bg-slate-900 text-slate-300'
                          }`}
                        >
                          <span>{name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="إغلاق النافذة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NAVIGATION TAB BAR                                                       */}
        {/* ========================================================================= */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveTab('lightbar')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'lightbar'
                ? 'bg-teal-600 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>محرك حركة العين (BLS Lightbar) ⚡</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('protocol')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'protocol'
                ? 'bg-teal-600 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>بروتوكول الـ 8 مراحل القياسي 📋</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('safe_place')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'safe_place'
                ? 'bg-teal-600 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>المكان الآمن والتثبيت (Safe Place) 🛡️</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-teal-600 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>التقرير السريري وتوثيق SOAP 📑</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MAIN BODY AREA                                                           */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: INTERACTIVE BLS LIGHTBAR & SOUND ENGINE */}
          {activeTab === 'lightbar' && (
            <div className="space-y-6">
              
              {/* Lightbar Screen Container */}
              <div
                ref={lightbarContainerRef}
                className={`w-full rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all ${
                  isFullScreen ? 'fixed inset-0 z-50 p-6 rounded-none' : 'h-64 sm:h-80 p-5'
                }`}
              >
                {/* Visual Guide Top Line */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span>مجموعة التحفيز #{completedSetsCount + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{currentPass}</span>
                    <span>/ {passesPerSet} حركة</span>
                  </div>
                </div>

                {/* Light Track Canvas Area */}
                <div className="relative w-full h-24 sm:h-32 flex items-center justify-center my-auto">
                  {/* Guide Horizontal Track Bar */}
                  <div className="absolute w-[92%] h-1 bg-slate-900 rounded-full border-t border-slate-800/80" />

                  {/* Animated Moving Light Dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-transform duration-75 flex items-center justify-center shadow-lg pointer-events-none"
                    style={{
                      left: `${dotCoords.x}%`,
                      top: `${dotCoords.y}%`,
                      width: `${dotSize}px`,
                      height: `${dotSize}px`,
                      backgroundColor: dotColor,
                      boxShadow: `0 0 25px ${dotColor}, 0 0 50px ${dotColor}40`,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-white opacity-80" />
                  </div>
                </div>

                {/* Bottom Overlay Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">النمط: <strong>{movementPattern === 'horizontal' ? 'أفقي ↔' : 'لانهائي 8 🔄'}</strong></span>
                    <span className="text-slate-400">السرعة: <strong>{speed}/10</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleFullScreen}
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title={isFullScreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة لانغماس المريض'}
                  >
                    {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Therapist Live Guidance Prompt to Patient */}
              <div className="p-4 rounded-3xl bg-slate-900/90 border border-teal-500/30 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                    <span>توجيه المعالج المباشر (يظهر لحظياً في أسفل شاشة المريض 📺):</span>
                  </span>
                  <span className="text-[10px] text-teal-400 font-mono">بث حي متزامن (Live Sync)</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={therapistGuidance}
                    onChange={(e) => setTherapistGuidance(e.target.value)}
                    placeholder="اكتب توجيهاً أو تعليمة تظهر للمريض على شاشته..."
                    className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Quick Guidance Chips */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="text-slate-500 text-[10px]">توجيهات سريعة:</span>
                  {[
                    'جلسة EMDR مباشرة - ركز نظرك على النقطة وتنفس بهدوء...',
                    'دَع المشهد يتلاشى تلقائياً ولا تقاوم...',
                    'لاحظ ما يظهر الآن في ذهنك وتنفس بعمق 🌿',
                    'أين تشعر بهذا التوتر في جسدك الآن؟ 🧘',
                    'أنت بأمان الآن وفي الحاضر 🛡️',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setTherapistGuidance(chip)}
                      className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-teal-300 text-[10px] font-bold transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Playback & BLS Parameter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Playback Actions Box (4 Cols) */}
                <div className="md:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-300 uppercase mb-3 flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-teal-400" />
                      <span>التحكم في مجموعة التحفيز (BLS Set)</span>
                    </h3>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTogglePlay}
                        className={`flex-1 py-3.5 rounded-2xl font-black text-xs shadow-lg transition flex items-center justify-center gap-2 ${
                          isPlaying
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-teal-600 hover:bg-teal-500 text-slate-950 shadow-teal-600/25'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isPlaying ? 'إيقاف مؤقت للتحفيز' : 'بدء تشغيل المجموعة'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetSet}
                        className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="إعادة ضبط العداد"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Post-Set Observation Form */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>ملاحظة المريض بعد المجموعة:</span>
                      <span className="text-[10px] text-teal-400">"ماذا تلاحظ الآن؟"</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: خفت الصورة، تلاشى صوت الصدمة، شعور بارتياح..."
                      value={currentSetNote}
                      onChange={(e) => setCurrentSetNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                    />

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>SUDS:</span>
                        <select
                          value={currentSetSuds}
                          onChange={(e) => setCurrentSetSuds(parseInt(e.target.value))}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-teal-300 font-bold"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>{num} / 10</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddProcessingSetNote}
                        disabled={!currentSetNote.trim()}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition disabled:opacity-40"
                      >
                        حفظ المجموعة ➕
                      </button>
                    </div>
                  </div>
                </div>

                {/* Visual Parameters Configuration (4 Cols) */}
                <div className="md:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                  <h3 className="text-xs font-black text-slate-300 uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
                    <span>المعايير البصرية (Visual BLS)</span>
                  </h3>

                  {/* Speed Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">سرعة الحركة:</span>
                      <span className="font-bold text-teal-300 font-mono">{speed} ({speed <= 3 ? 'بطيء للتثبيت' : speed >= 8 ? 'سريع لإزالة التحسس' : 'متوسط'})</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={speed}
                      onChange={(e) => setSpeed(parseInt(e.target.value))}
                      className="w-full accent-teal-500 bg-slate-950 rounded-lg h-2"
                    />
                  </div>

                  {/* Number of passes */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">حركات المجموعة (Passes):</span>
                      <span className="font-bold text-teal-300 font-mono">{passesPerSet} حركة</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[16, 24, 32, 40].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setPassesPerSet(cnt)}
                          className={`py-1.5 rounded-xl text-xs font-bold transition border ${
                            passesPerSet === cnt
                              ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dot Color Picker */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400 block">لون الضوء المنبه:</span>
                    <div className="flex items-center gap-2">
                      {[
                        { color: '#0d9488', name: 'Teal' },
                        { color: '#4f46e5', name: 'Indigo' },
                        { color: '#059669', name: 'Emerald' },
                        { color: '#0284c7', name: 'Sky' },
                        { color: '#e11d48', name: 'Rose' },
                        { color: '#d97706', name: 'Amber' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => setDotColor(c.color)}
                          className={`w-7 h-7 rounded-xl transition-transform ${
                            dotColor === c.color ? 'scale-110 ring-2 ring-white shadow-lg' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Auditory Binaural Sound Configuration (4 Cols) */}
                <div className="md:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-black text-slate-300 uppercase flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>التحفيز السمعي (Binaural Audio)</span>
                    </h3>

                    <button
                      type="button"
                      onClick={() => setSoundEnabled((prev) => !prev)}
                      className={`p-1.5 rounded-xl border transition ${
                        soundEnabled ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                      title="تفعيل/كتم الصوت المتناوب"
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Sound Tone Selection */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-slate-400 block">نبرة الصوت المتناوب:</span>
                    <div className="space-y-1">
                      {[
                        { id: 'sine_440', label: 'نغمة هادئة (440Hz Pure Sine)' },
                        { id: 'solfeggio_528', label: 'تردد الشفاء السريري (528Hz Solfeggio)' },
                        { id: 'soft_click', label: 'نقرة خافتة (Soft Click / Metronome)' },
                      ].map((tone) => (
                        <div
                          key={tone.id}
                          onClick={() => setSoundTone(tone.id)}
                          className={`p-2 rounded-xl border cursor-pointer text-[11px] font-bold transition flex items-center justify-between ${
                            soundTone === tone.id
                              ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{tone.label}</span>
                          {soundTone === tone.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>مستوى الصوت:</span>
                      <span className="font-mono text-indigo-300">{Math.round(soundVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 bg-slate-950 rounded-lg h-2"
                    />
                  </div>
                </div>

              </div>

              {/* History of Completed Sets in this session */}
              {protocolData.setsHistory.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                  <h4 className="text-xs font-black text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <span>سجل مجموعات المعالجة التراكمي في هذه الجلسة ({protocolData.setsHistory.length} مجموعات):</span>
                  </h4>

                  <div className="space-y-2">
                    {protocolData.setsHistory.map((set) => (
                      <div key={set.setNum} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 font-bold font-mono">
                            Set #{set.setNum}
                          </span>
                          <span className="text-slate-300">{set.observation}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 font-bold text-[11px]">
                            SUDS: {set.suds}/10
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STANDARD 8-PHASE PROTOCOL WORKFLOW */}
          {activeTab === 'protocol' && (
            <div className="space-y-6">
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
                
                {/* Phase 3: Target Assessment Inputs */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <span className="w-6 h-6 rounded-xl bg-teal-500/20 text-teal-400 font-black text-xs flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-sm font-black text-white">المرحلة الثالثة: تقييم الصدمة والذاكرة المستهدفة (Assessment)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Target Memory */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold">الصورة / اللحظة الصادمة الأكثر إزعاجاً (Target Memory):</label>
                      <input
                        type="text"
                        value={protocolData.worstMomentImage}
                        onChange={(e) => setProtocolData({ ...protocolData, worstMomentImage: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
                        placeholder="ما هي الصورة أو اللحظة التي تسبب لك أعلى قدر من الضيق؟"
                      />
                    </div>

                    {/* Body Location */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold">الموقع الجسدي للإحساس والانفعال (Body Location):</label>
                      <input
                        type="text"
                        value={protocolData.bodyLocation}
                        onChange={(e) => setProtocolData({ ...protocolData, bodyLocation: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
                        placeholder="أين تشعر بالضيق في جسدك الآن؟ (الصدر، المعدة، الحلق...)"
                      />
                    </div>
                  </div>

                  {/* Negative Cognition NC */}
                  <div className="space-y-2 text-xs pt-2">
                    <label className="text-rose-300 font-bold flex items-center justify-between">
                      <span>المعتقد السلبي المرتبط بالصدمة (Negative Cognition - NC):</span>
                      <span className="text-[10px] text-slate-500">ما هي الفكرة السلبية التي تشعر بها عن نفسك عند تذكر الصدمة؟</span>
                    </label>
                    <input
                      type="text"
                      value={protocolData.negativeCognition}
                      onChange={(e) => setProtocolData({ ...protocolData, negativeCognition: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-200 focus:outline-none focus:border-rose-500 font-bold"
                    />

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {negativeCognitionPresets.map((nc) => (
                        <button
                          key={nc}
                          type="button"
                          onClick={() => setProtocolData({ ...protocolData, negativeCognition: nc })}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[10px] transition"
                        >
                          {nc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Positive Cognition PC */}
                  <div className="space-y-2 text-xs pt-2">
                    <label className="text-emerald-300 font-bold flex items-center justify-between">
                      <span>المعتقد الإيجابي المرغوب (Positive Cognition - PC):</span>
                      <span className="text-[10px] text-slate-500">ما الذي تود أن تؤمن به عن نفسك بدلاً من ذلك؟</span>
                    </label>
                    <input
                      type="text"
                      value={protocolData.positiveCognition}
                      onChange={(e) => setProtocolData({ ...protocolData, positiveCognition: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-200 focus:outline-none focus:border-emerald-500 font-bold"
                    />

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {positiveCognitionPresets.map((pc) => (
                        <button
                          key={pc}
                          type="button"
                          onClick={() => setProtocolData({ ...protocolData, positiveCognition: pc })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[10px] transition"
                        >
                          {pc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* VoC and SUDS Scales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                    
                    {/* VoC Scale */}
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">صلاحية الإدراك الإيجابي (VoC):</span>
                        <span className="font-mono text-emerald-400 font-black text-sm">{protocolData.vocScore} / 7</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="7"
                        value={protocolData.vocScore}
                        onChange={(e) => setProtocolData({ ...protocolData, vocScore: parseInt(e.target.value) })}
                        className="w-full accent-emerald-500 bg-slate-950 rounded-lg h-2"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>1: غير صحيح إطلاقاً</span>
                        <span>7: صحيح تماماً</span>
                      </div>
                    </div>

                    {/* SUDS Scale */}
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">مقياس شدة الضيق (SUDS):</span>
                        <span className="font-mono text-rose-400 font-black text-sm">{protocolData.sudsScore} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={protocolData.sudsScore}
                        onChange={(e) => setProtocolData({ ...protocolData, sudsScore: parseInt(e.target.value) })}
                        className="w-full accent-rose-500 bg-slate-950 rounded-lg h-2"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0: هدوء تام وبدون ضيق</span>
                        <span>10: أقصى درجات الضيق والهلع</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Phase 5 & 6: Installation & Body Scan */}
                <div className="space-y-4 pt-4 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <span className="w-6 h-6 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center">
                      5-6
                    </span>
                    <h3 className="text-sm font-black text-white">المرحلتان 5 و6: التثبيت والمسح الجسدي (Installation & Body Scan)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold">صلاحية المعتقد الإيجابي بعد المعالجة (Final VoC 1-7):</label>
                      <select
                        value={protocolData.finalVocScore}
                        onChange={(e) => setProtocolData({ ...protocolData, finalVocScore: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs"
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <option key={num} value={num}>VoC = {num} / 7 {num === 7 ? '(تثبيت تام بنجاح)' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold">نتيجة المسح الجسدي (Body Scan):</label>
                      <input
                        type="text"
                        value={protocolData.bodyScanResult}
                        onChange={(e) => setProtocolData({ ...protocolData, bodyScanResult: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        placeholder="هل يشعر المريض بأي شد أو توتر متبقي في أي عضو؟"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: SAFE PLACE & GROUNDING RESOURCING */}
          {activeTab === 'safe_place' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950/20 to-slate-950 border border-teal-500/20 space-y-5">
                <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">تثبيت وتفعيل تقنية المكان الآمن (Safe Place Protocol)</h3>
                    <p className="text-xs text-slate-400">بناء وتدعيم الملاذ الشعوري الآمن قبل بدء إزالة التحسس أو للتهدئة الفورية</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">وصف وتفاصيل المكان الآمن للعميل:</label>
                    <input
                      type="text"
                      value={protocolData.safePlaceTitle}
                      onChange={(e) => setProtocolData({ ...protocolData, safePlaceTitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
                      placeholder="مثال: شاطئ بحري هادئ، حديقة المنزل في الصباح، غرفة هادئة مع ضوء خافت..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold">المراسي الحسية (الروائح، الأصوات، الإحساس الجسدي):</label>
                    <textarea
                      rows={2}
                      value={protocolData.safePlaceSensoryAnchor}
                      onChange={(e) => setProtocolData({ ...protocolData, safePlaceSensoryAnchor: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                      placeholder="الأصوات المرافقة، درجات الحرارة المريحة، والكلمة المفتاحية للرسو..."
                    />
                  </div>

                  {/* Clinical Instructions Card */}
                  <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 text-teal-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <Sparkles className="w-4 h-4 text-teal-400" />
                      <span>خطوات المعالج لتثبيت المكان الآمن (Installation Instructions):</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 leading-relaxed">
                      <li>اطلب من العميل إغماض عينيه وتخيل تفاصيل المكان الآمن مع استشعار الهدوء الجسدي.</li>
                      <li>قم بتشغيل مجموعة تحفيز ثنائي **بطيئة (Speed 2-3)** لمدة **4 إلى 6 حركات فقط** لترسيخ الإحساس.</li>
                      <li>اسأل العميل: «ماذا تشعر الآن؟» مع تعزيز الكلمة الإرشادية (Cue Word).</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLINICAL SUMMARY & SOAP INJECTION */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-slate-950 font-black flex items-center justify-center shadow-md">
                      <FileText className="w-5 h-5 text-slate-950" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">التقرير السريري الرسمي لجلسة الـ EMDR</h3>
                      <p className="text-[11px] text-slate-400">ملخص معتمد جاهز للحقن في ملف المريض وتوثيق SOAP</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/20 font-bold font-mono">
                    EMDR Session Log
                  </span>
                </div>

                {/* Printable Form Summary */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 leading-relaxed text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 font-bold">
                    <span>المريض: <strong className="text-white">{selectedPatient ? `${selectedPatient.first_name || ''} ${selectedPatient.last_name || selectedPatient.name}` : 'غير محدد'}</strong></span>
                    <span>التاريخ: <strong className="font-mono text-teal-300">{new Date().toLocaleDateString('ar-DZ')}</strong></span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    <div>🎯 <strong>الذاكرة المستهدفة:</strong> {protocolData.worstMomentImage}</div>
                    <div>⚡ <strong>الموقع الجسدي:</strong> {protocolData.bodyLocation}</div>
                    <div className="text-rose-300">❌ <strong>المعتقد السلبي (NC):</strong> {protocolData.negativeCognition}</div>
                    <div className="text-emerald-300">✅ <strong>المعتقد الإيجابي (PC):</strong> {protocolData.positiveCognition}</div>
                    <div>📊 <strong>صلاحية الإدراك VoC:</strong> ارتفعت من {protocolData.vocScore}/7 إلى <strong className="text-emerald-400">{protocolData.finalVocScore}/7</strong></div>
                    <div>📉 <strong>مقياس الضيق SUDS:</strong> انخفض من {protocolData.sudsScore}/10 إلى <strong className="text-emerald-400">{protocolData.setsHistory.slice(-1)[0]?.suds ?? 2}/10</strong></div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[11px]">
                    <strong>سجل المسح الجسدي (Body Scan):</strong> {protocolData.bodyScanResult}
                  </div>
                </div>

                {/* Clinical Notes Editor */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">ملاحظات الطبيب السريرية والخطة الموالية:</label>
                  <textarea
                    rows={3}
                    value={protocolData.clinicalNotes}
                    onChange={(e) => setProtocolData({ ...protocolData, clinicalNotes: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة التقرير</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInjectToSoap}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-teal-600/30 transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حقن التقرير في الجلسة وسجلات SOAP ✨</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                             */}
        {/* ========================================================================= */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>محرك التحفيز الثنائي جاهز (Visual & Binaural Stereo 440/528Hz Active)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openPatientPopout}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/40 text-xs font-bold transition flex items-center gap-1"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>شاشة المريض المستقلة</span>
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

      {/* ========================================================================= */}
      {/* PATIENT SCREEN SHARE & QR MODAL                                          */}
      {/* ========================================================================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-teal-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">رابط ورمز QR لشاشة المريض</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                امسح الرمز بواسطة كاميرا هاتف المريض أو التابلت، أو انسخ الرابط لفتحه في متصفح خارجي أو إرساله عبر WhatsApp:
              </p>

              {/* QR Code Container */}
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border-2 border-teal-500">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `${window.location.origin}/emdr-screen/${sessionCode}`
                  )}`}
                  alt="EMDR Session QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono">
                <span className="truncate text-teal-300 select-all font-bold">
                  {`${window.location.origin}/emdr-screen/${sessionCode}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/emdr-screen/${sessionCode}`);
                    setHasCopiedLink(true);
                    setTimeout(() => setHasCopiedLink(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-sans font-bold flex items-center gap-1 shrink-0"
                >
                  {hasCopiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{hasCopiedLink ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={openPatientPopout}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح في نافذة مستقلة فوراً</span>
              </button>

              {selectedPatient?.phone && (
                <a
                  href={`https://wa.me/${selectedPatient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `مرحباً، إليك رابط جلسة التحفيز الثنائي EMDR الخاصة بك:\n${window.location.origin}/emdr-screen/${sessionCode}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
