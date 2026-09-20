import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Activity, 
  CheckCircle2, 
  Sparkles, 
  Repeat, 
  Zap, 
  Award, 
  Camera, 
  CameraOff, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  XCircle, 
  Eye
} from 'lucide-react';
import { digitalTherapyApi } from '../../../api';
import { soundEngine } from '../../../utils/soundEngine';

export default function ApraxiaVideoModule({ patientId = null, onComplete = null }) {
  const defaultExercises = [
    {
      id: 'target_b',
      target_word_ar: 'صوت /ب/ (B)',
      target_word_fr: 'Son [B]',
      phoneme_type: 'شفوي انفجاري (Bilabial Plosive)',
      instructions_ar: 'إطباق الشفتين بإحكام لمنع تيار الهواء، ثم فتحهما فجأة لإطلاق صوت /ب/.',
      instructions_fr: 'Fermeture bilabiale complète puis ouverture explosive.',
      target_repetitions: 10,
      bpm_pacing: 60,
      mouth_shape: '👄 إطباق الشفتين ➔ فتح مفاجئ',
      sample_text: 'بَـ ... بَـ ... بَـابْ',
    },
    {
      id: 'target_m',
      target_word_ar: 'صوت /م/ (M)',
      target_word_fr: 'Son [M]',
      phoneme_type: 'شفوي أنفي (Bilabial Nasal)',
      instructions_ar: 'إطباق الشفتين مع إنزال شراع الحنك والسماح للهواء بالخروج عبر الأنف بإصدار رنين [مـ...].',
      instructions_fr: 'Fermeture des lèvres avec résonance nasale continue.',
      target_repetitions: 10,
      bpm_pacing: 60,
      mouth_shape: '👄 إطباق الشفتين مع رنين أنفي',
      sample_text: 'مَـ ... مَـ ... مَـامَـا',
    },
    {
      id: 'target_t',
      target_word_ar: 'صوت /ت/ (T)',
      target_word_fr: 'Son [T]',
      phoneme_type: 'لساني سنخي (Alveolar Stop)',
      instructions_ar: 'رفع طرف اللسان وملامسة الحنك السنخي خلف الأسنان العلوية ثم إطلاق تيار الهواء.',
      instructions_fr: 'Pointe de la langue contre les alvéoles supérieures puis détente.',
      target_repetitions: 10,
      bpm_pacing: 50,
      mouth_shape: '👅 طرف اللسان خلف الأسنان العلوية',
      sample_text: 'تَـ ... تَـ ... تُـفَّـاحْ',
    },
    {
      id: 'target_words',
      target_word_ar: 'مَـامَـا / بَـابَـا / مَـاء',
      target_word_fr: 'MAMA / PAPA / EAU',
      phoneme_type: 'كلمات حركية وظيفية (Early Motor Words)',
      instructions_ar: 'التنقل الحركي المتسلسل بين إطباق الشفتين والفتح المتسع لإصدار الحركة الطويلة [آ].',
      instructions_fr: 'Transition motrice fluide entre fermeture labiale et voyelle ouverte.',
      target_repetitions: 10,
      bpm_pacing: 50,
      mouth_shape: '👄 تنقل متسلسل للشفتين مع الحركات',
      sample_text: 'مَـامَـا ... بَـابَـا ... مَـاء',
    },
  ];

  const [exercises, setExercises] = useState(defaultExercises);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentReps, setCurrentReps] = useState(0);
  const [speedRate, setSpeedRate] = useState(0.5); // 0.25x, 0.5x, 0.75x, 1.0x
  const [isLooping, setIsLooping] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [saving, setSaving] = useState(false);

  // WebCam Mirror State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const currentEx = exercises[currentIndex] || exercises[0];

  // Fetch remote modules if available
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const resp = await digitalTherapyApi.listModules({ sub_tool: 'apraxia_video' });
        if (resp && resp.modules && resp.modules.length > 0) {
          const mod = resp.modules.find((m) => m.sub_tool === 'apraxia_video');
          if (mod && mod.content_payload && mod.content_payload.exercises) {
            setExercises(mod.content_payload.exercises);
          }
        }
      } catch (err) {
        // Fallback to default
      }
    };
    loadExercises();
  }, []);

  // WebCam management
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      setCameraError(null);
    } else {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (err) {
        console.error('Camera access error:', err);
        setCameraError('تعذر الوصول إلى الكاميرا (يرجى التحقق من الأذونات)');
        setIsCameraActive(false);
      }
    }
  };

  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Pronunciation & Animation
  const speakTarget = () => {
    soundEngine.speak(currentEx.target_word_ar.split(' ')[0], 'ar-SA', { rate: speedRate });
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 1400);
  };

  // Loop mode timer
  useEffect(() => {
    let loopTimer = null;
    if (isLooping && !isFinished) {
      speakTarget();
      loopTimer = setInterval(() => {
        speakTarget();
      }, 3000 / speedRate);
    }
    return () => clearInterval(loopTimer);
  }, [isLooping, currentIndex, speedRate, isFinished]);

  const handleScoreRepetition = (quality) => {
    const nextReps = currentReps + 1;
    setCurrentReps(nextReps);

    if (quality === 'accurate') {
      soundEngine.playSuccessSound();
    } else if (quality === 'partial') {
      soundEngine.playTone(440, 0.15, 'triangle');
    } else {
      soundEngine.playErrorSound();
    }

    const record = {
      exercise_id: currentEx.id,
      target: currentEx.target_word_ar,
      repetition_number: nextReps,
      quality: quality, // 'accurate', 'partial', 'error'
    };

    const nextHistory = [...scoreHistory, record];
    setScoreHistory(nextHistory);

    if (nextReps >= (currentEx.target_repetitions || 10)) {
      setTimeout(() => {
        if (currentIndex + 1 < exercises.length) {
          setCurrentIndex(currentIndex + 1);
          setCurrentReps(0);
        } else {
          setIsFinished(true);
          setIsLooping(false);
          submitResults(nextHistory);
        }
      }, 700);
    }
  };

  const submitResults = async (finalHistory) => {
    if (!patientId) return;
    setSaving(true);
    try {
      const accurateCount = finalHistory.filter((h) => h.quality === 'accurate').length;
      const accuracy = Math.round((accurateCount / finalHistory.length) * 100);

      await digitalTherapyApi.logResults(patientId, {
        category: 'motor_speech_apraxia',
        sub_tool: 'apraxia_video',
        accuracy_percentage: accuracy,
        cues_needed_count: finalHistory.filter((h) => h.quality === 'error').length,
        reaction_time_avg_ms: 1000,
        session_log: {
          total_reps: finalHistory.length,
          accurate_reps: accurateCount,
          history: finalHistory,
        },
      });
    } catch (e) {
      console.error('Failed to log apraxia results:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setCurrentReps(0);
    setScoreHistory([]);
    setIsFinished(false);
    setIsLooping(false);
  };

  const targetGoalReps = currentEx.target_repetitions || 10;
  const accurateRepsCount = scoreHistory.filter((h) => h.quality === 'accurate').length;
  const accuracyPercent = scoreHistory.length > 0 ? Math.round((accurateRepsCount / scoreHistory.length) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 max-w-4xl mx-auto shadow-2xl animate-in fade-in" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-fuchsia-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-fuchsia-500/25">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              برمجة النطق وعمه الكلام (Apraxia Video Modeling)
            </h3>
            <p className="text-xs text-slate-400">
              نمذجة حركية مرئية مع تحكم في السرعة البطيئة ومرآة الكاميرا الحية (Biofeedback)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            type="button"
            onClick={toggleCamera}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse border transition-all ${
              isCameraActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md ring-1 ring-rose-400/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            <span>{isCameraActive ? 'إيقاف مرآة الكاميرا' : '📷 تشغيل مرآة الكاميرا'}</span>
          </button>

          <div className="font-mono text-xs font-bold text-fuchsia-300 bg-fuchsia-500/10 px-3.5 py-1.5 rounded-xl border border-fuchsia-500/30">
            تمرين {currentIndex + 1} / {exercises.length}
          </div>
        </div>
      </div>

      {!isFinished ? (
        <div className="space-y-6">
          {/* Dual Screen Stage (Model Visualizer + Live Mirror WebCam) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Panel: Articulation Guide Model */}
            <div className="p-6 rounded-3xl bg-slate-950 border-2 border-fuchsia-500/40 text-center space-y-4 shadow-inner relative flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="flex items-center space-x-1 space-x-reverse text-fuchsia-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>النموذج الحركي المرجعي (Reference Model)</span>
                </span>
                <span className="font-mono text-[11px] text-slate-500">{currentEx.phoneme_type}</span>
              </div>

              {/* Animated Articulation Graphic & Metronome Ring */}
              <div className="py-2">
                <div
                  className={`w-36 h-36 rounded-full border-4 border-fuchsia-500/40 flex items-center justify-center mx-auto transition-all duration-500 ${
                    isPulsing
                      ? 'scale-110 border-fuchsia-400 shadow-2xl shadow-fuchsia-500/60 bg-fuchsia-500/10'
                      : 'scale-100 bg-slate-900/80'
                  }`}
                >
                  <div className="text-5xl sm:text-6xl select-none animate-bounce">
                    {currentEx.mouth_shape ? currentEx.mouth_shape.split(' ')[0] : '👄'}
                  </div>
                </div>
              </div>

              {/* Target Words & Instructions */}
              <div className="space-y-2">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-pink-200 to-indigo-300 font-mono tracking-wide">
                  {currentEx.target_word_ar}
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed text-right">
                  <strong className="text-fuchsia-400 block text-[11px] mb-0.5">تعليمات التموضع النطقي:</strong>
                  {currentEx.instructions_ar}
                </div>
              </div>
            </div>

            {/* Right Panel: WebCam Mirror Biofeedback / Pacing Guide */}
            <div className="p-6 rounded-3xl bg-slate-950 border-2 border-slate-800 text-center space-y-4 shadow-inner relative flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="flex items-center space-x-1 space-x-reverse text-indigo-300">
                  <Eye className="w-3.5 h-3.5" />
                  <span>مرآة المريض البصرية (Visual Biofeedback)</span>
                </span>
                {isCameraActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
              </div>

              {/* Video Element or Placeholder */}
              <div className="flex-1 min-h-[190px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1] rounded-2xl"
                  />
                ) : (
                  <div className="space-y-3 p-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                      {cameraError ? (
                        <span className="text-rose-400">{cameraError}</span>
                      ) : (
                        'انقر على «تشغيل مرآة الكاميرا» لمشاهدة حركة الشفتين أثناء النطق'
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-right font-medium">
                👁️ تساعد المرآة في تصحيح التموضع الحركي للشفتين واللسان ذاتياً.
              </div>
            </div>
          </div>

          {/* Speed Controls & Sound Bar */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                type="button"
                onClick={speakTarget}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-black text-xs flex items-center space-x-1.5 space-x-reverse shadow-md transition-all active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                <span>نطق النموذج الصوتي 🔊</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLooping(!isLooping)}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 space-x-reverse border transition-all ${
                  isLooping
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 shadow-md ring-1 ring-fuchsia-400/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Repeat className={`w-3.5 h-3.5 ${isLooping ? 'animate-spin-slow' : ''}`} />
                <span>{isLooping ? 'إيقاف التكرار التلقائي' : 'تكرار تلقائي مستمر'}</span>
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold">
              <span className="text-slate-400">السرعة البطيئة:</span>
              {[0.25, 0.5, 0.75, 1.0].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeedRate(rate)}
                  className={`px-2.5 py-1 rounded-lg font-mono transition-all ${
                    speedRate === rate
                      ? 'bg-fuchsia-600 text-white shadow-md font-black'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Phoneme Drawer & Target Repetition Ladder */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            {/* Repetition Counter Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-300 px-1">
                <span>عداد التكرارات الحركية (Motor Repetition Ladder):</span>
                <span className="font-mono text-fuchsia-300 text-sm">
                  {currentReps} / {targetGoalReps} تكرار
                </span>
              </div>

              {/* Progress Bar with 10 steps */}
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: targetGoalReps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 rounded-full transition-all duration-300 ${
                      i < currentReps
                        ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 shadow-md shadow-fuchsia-500/30'
                        : 'bg-slate-900 border border-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* SLP Accuracy Scoring Actions */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-400 mb-2">تقييم جودة النطق لكل تكرار (+1 Repetition):</div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleScoreRepetition('accurate')}
                  className="py-3.5 px-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✅ حركة دقيقة (Précis)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScoreRepetition('partial')}
                  className="py-3.5 px-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>⚠️ محاولة جزئية (Approximatif)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScoreRepetition('error')}
                  className="py-3.5 px-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <XCircle className="w-4 h-4" />
                  <span>❌ خطأ حركي (Erreur)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-fuchsia-400 to-indigo-400 flex items-center justify-center text-slate-950 mx-auto shadow-xl shadow-fuchsia-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-xl font-black text-white">اكتمل برنامج برمجة النطق الحركي 🌟</h4>
            <p className="text-xs text-slate-400">
              تم إنجاز كامل التكرارات المستهدفة وتوثيق دقة التموضع في ملف المريض
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">نسبة الدقة الحركية</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{accuracyPercent}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">التكرارات الدقيقة</span>
              <span className="text-2xl font-black font-mono text-fuchsia-300">{accurateRepsCount} / {scoreHistory.length}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">التمارين المنجزة</span>
              <span className="text-2xl font-black font-mono text-indigo-300">{exercises.length}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse justify-center pt-2">
            <button
              type="button"
              onClick={handleRestart}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة التدريب</span>
            </button>

            {onComplete && (
              <button
                type="button"
                onClick={onComplete}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs transition-all shadow-md"
              >
                العودة للكتالوج
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
