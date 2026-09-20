import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Mic,
  MicOff,
  Activity,
  Volume2,
  Gauge,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  FileText,
  Copy,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  BarChart2,
  Info,
  ShieldAlert,
  Sliders,
  Search,
  User,
  Users,
  Check,
  ChevronDown
} from 'lucide-react';
import {
  SpeechAcousticEngine,
  ARABIC_ACOUSTIC_PHONEMES
} from '../../services/speechAcousticEngine';

export default function SpeechAcousticBiomarkersModal({
  isOpen,
  onClose,
  patient: initialPatient = null,
  patients = [],
  onInjectIntoSoap = null
}) {
  if (!isOpen) return null;

  // Active Patient & Switcher State
  const [currentPatient, setCurrentPatient] = useState(initialPatient || (patients.length > 0 ? patients[0] : null));
  const [isPatientSwitcherOpen, setIsPatientSwitcherOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const patientSwitcherRef = useRef(null);

  useEffect(() => {
    if (initialPatient) setCurrentPatient(initialPatient);
  }, [initialPatient]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (patientSwitcherRef.current && !patientSwitcherRef.current.contains(event.target)) {
        setIsPatientSwitcherOpen(false);
      }
    }
    if (isPatientSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPatientSwitcherOpen]);

  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return patients;
    const q = patientSearchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const name = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
      const phone = (p.phone || p.parent_phone || '').toLowerCase();
      const folder = (p.folder_number || p.file_number || '').toLowerCase();
      const idStr = String(p.id);
      return name.includes(q) || phone.includes(q) || folder.includes(q) || idStr.includes(q);
    });
  }, [patients, patientSearchQuery]);

  // Active Tab: 'articulation' | 'voice' | 'fluency'
  const [activeTab, setActiveTab] = useState('articulation');

  // Engine state
  const engineRef = useRef(null);
  const canvasRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioError, setAudioError] = useState(null);

  // Live Metric State
  const [liveMetrics, setLiveMetrics] = useState({
    dbLevel: -90,
    pitch: null,
    isVoiced: false,
    centroid: 0,
    jitterPercent: 0,
    shimmerPercent: 0,
    hnrDb: 18
  });

  // 1. Tab 1: Articulation State
  const [selectedPhonemeId, setSelectedPhonemeId] = useState('seen');
  const [phonemeObservations, setPhonemeObservations] = useState([]);

  // 2. Tab 2: Voice Biomarkers & TMF State
  const [targetGender, setTargetGender] = useState('child'); // 'male' | 'female' | 'child'
  const [tmfState, setTmfState] = useState({
    status: 'idle', // 'idle' | 'listening' | 'recording' | 'completed'
    duration: 0,
    bestDuration: 0,
    history: []
  });
  const tmfTimerRef = useRef(null);
  const tmfDurationRef = useRef(0);
  const tmfSilenceCountRef = useRef(0);

  // 3. Tab 3: Speech Fluency & Stuttering Tracker
  const [fluencyState, setFluencyState] = useState({
    totalSyllables: 100,
    stutteredSyllables: 0,
    blocksCount: 0,
    prolongationsCount: 0,
    repetitionsCount: 0,
    speakingDurationSec: 0,
    isTracking: false
  });
  const fluencyTimerRef = useRef(null);

  // Summary & Feedback
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Selected Phoneme config
  const currentPhoneme = useMemo(() => {
    return ARABIC_ACOUSTIC_PHONEMES[selectedPhonemeId] || ARABIC_ACOUSTIC_PHONEMES.seen;
  }, [selectedPhonemeId]);

  // Start / Stop Engine
  const toggleListening = async () => {
    if (isRecording) {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
      setIsRecording(false);
    } else {
      setAudioError(null);
      try {
        const engine = new SpeechAcousticEngine();
        await engine.start();

        engine.subscribe((frame) => {
          setLiveMetrics({
            dbLevel: frame.dbLevel,
            pitch: frame.pitch,
            isVoiced: frame.isVoiced,
            centroid: frame.centroid,
            jitterPercent: frame.jitterPercent,
            shimmerPercent: frame.shimmerPercent,
            hnrDb: frame.hnrDb
          });

          // Draw Canvas Visualizer
          drawVisualizer(frame);

          // Handle Automated TMF Test
          handleTmfFrame(frame);
        });

        engineRef.current = engine;
        setIsRecording(true);
      } catch (err) {
        console.error('Microphone access failed:', err);
        let msg = 'تعذر الوصول إلى الميكروفون. يرجى التأكد من توصيل المايك ومنح الإذن للمتصفح.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'تم رفض إذن الميكروفون من المتصفح 🚫. يرجى السماح به من إعدادات الموقع / شريط العنوان وإعادة المحاولة.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'لم يتم العثور على أي ميكروفون موصول بالجهاز 🔌.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          msg = 'الميكروفون قيد الاستخدام حالياً بواسطة برنامج آخر ⚠️.';
        }
        setAudioError(msg);
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
      if (tmfTimerRef.current) clearInterval(tmfTimerRef.current);
      if (fluencyTimerRef.current) clearInterval(fluencyTimerRef.current);
    };
  }, []);

  // Visualizer Rendering (Multi-band Waterfall FFT & Oscilloscope)
  const drawVisualizer = (frame) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark slate background with trail fade
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw FFT Frequency Bars
    const freqData = frame.freqData;
    if (freqData) {
      const barCount = 64;
      const barWidth = width / barCount;
      const step = Math.floor(freqData.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = freqData[i * step] / 255;
        const barHeight = value * (height * 0.75);
        const x = i * barWidth;
        const y = height - barHeight;

        // Gradient coloring: Indigo -> Teal -> Emerald based on energy
        const hue = 190 + value * 60; // 190 (cyan/teal) to 250 (indigo)
        ctx.fillStyle = `hsla(${hue}, 85%, 55%, 0.7)`;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }
    }

    // 2. Draw Spectral Centroid Indicator Line
    if (frame.centroid > 0) {
      const sampleRate = frame.sampleRate || 44100;
      const nyquist = sampleRate / 2;
      const centroidX = Math.min(width, (frame.centroid / (nyquist * 0.5)) * width);

      ctx.strokeStyle = '#f43f5e'; // Rose 500
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(centroidX, 0);
      ctx.lineTo(centroidX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label Centroid
      ctx.fillStyle = '#fda4af';
      ctx.font = '10px monospace';
      ctx.fillText(`${frame.centroid} Hz (Fc)`, Math.min(centroidX + 4, width - 85), 14);
    }

    // 3. Draw Oscilloscope Waveform overlay
    const timeData = frame.timeData;
    if (timeData) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)'; // Sky 400
      ctx.beginPath();

      const sliceWidth = width / timeData.length;
      let x = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i];
        const y = (height * 0.4) + (v * height * 0.35);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
    }
  };

  // Automated TMF Logic
  const handleTmfFrame = (frame) => {
    if (tmfState.status !== 'listening' && tmfState.status !== 'recording') return;

    const isSustainedVoice = frame.isVoiced && frame.dbLevel > -40;

    if (tmfState.status === 'listening') {
      // Waiting for onset
      if (isSustainedVoice) {
        setTmfState((prev) => ({ ...prev, status: 'recording', duration: 0 }));
        tmfDurationRef.current = 0;
        tmfSilenceCountRef.current = 0;

        if (tmfTimerRef.current) clearInterval(tmfTimerRef.current);
        tmfTimerRef.current = setInterval(() => {
          tmfDurationRef.current += 0.1;
          setTmfState((prev) => ({
            ...prev,
            duration: Math.round(tmfDurationRef.current * 10) / 10
          }));
        }, 100);
      }
    } else if (tmfState.status === 'recording') {
      // Voice is rolling, check for termination
      if (!isSustainedVoice) {
        tmfSilenceCountRef.current += 1;
        // If silence persists for 400ms (approx 4 frames)
        if (tmfSilenceCountRef.current > 4) {
          clearInterval(tmfTimerRef.current);
          const finalDuration = Math.round(tmfDurationRef.current * 10) / 10;
          setTmfState((prev) => ({
            ...prev,
            status: 'completed',
            bestDuration: Math.max(prev.bestDuration, finalDuration),
            history: [...prev.history, finalDuration]
          }));
        }
      } else {
        tmfSilenceCountRef.current = 0;
      }
    }
  };

  const startTmfTest = () => {
    setTmfState((prev) => ({ ...prev, status: 'listening', duration: 0 }));
    if (!isRecording) {
      toggleListening();
    }
  };

  const resetTmfTest = () => {
    if (tmfTimerRef.current) clearInterval(tmfTimerRef.current);
    setTmfState({
      status: 'idle',
      duration: 0,
      bestDuration: 0,
      history: []
    });
  };

  // Phoneme Match Score calculation
  const phonemeMatch = useMemo(() => {
    if (!liveMetrics.centroid || liveMetrics.dbLevel < -45) {
      return { score: 0, diagnosis: 'بانتظار نطق الفونيم في الميكروفون...', status: 'waiting' };
    }

    const { targetCentroidMin, targetCentroidMax, optimalCentroid, id } = currentPhoneme;
    const c = liveMetrics.centroid;

    // Is within target range?
    if (c >= targetCentroidMin && c <= targetCentroidMax) {
      const dist = Math.abs(c - optimalCentroid);
      const span = (targetCentroidMax - targetCentroidMin) / 2;
      const score = Math.max(60, Math.round(100 - (dist / span) * 30));
      return {
        score,
        diagnosis: currentPhoneme.clinicalDiagnostics.normal,
        status: 'good'
      };
    }

    // Diagnostics if below or above
    if (id === 'seen') {
      if (c < 4500) {
        return {
          score: Math.round((c / 5000) * 50),
          diagnosis: currentPhoneme.clinicalDiagnostics.lisp_interdental,
          status: 'warning'
        };
      }
    } else if (id === 'sheen') {
      if (c > 5000) {
        return {
          score: 45,
          diagnosis: currentPhoneme.clinicalDiagnostics.confusion_seen,
          status: 'warning'
        };
      }
    }

    return {
      score: Math.max(20, Math.min(65, Math.round(100 - (Math.abs(c - optimalCentroid) / 4000) * 50))),
      diagnosis: 'طاقة طيفية غير مطابقة للتردد النموذجي لهذا الفونيم (يرجى توجيه المريض)',
      status: 'deviant'
    };
  }, [liveMetrics.centroid, liveMetrics.dbLevel, currentPhoneme]);

  // Record observation for the current phoneme
  const savePhonemeObservation = () => {
    const obs = {
      id: Date.now(),
      phoneme: currentPhoneme.symbol,
      phonemeName: currentPhoneme.name,
      centroid: liveMetrics.centroid,
      score: phonemeMatch.score,
      diagnosis: phonemeMatch.diagnosis,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setPhonemeObservations((prev) => [obs, ...prev]);
  };

  // Fluency Stuttering calculations
  const totalDysfluencies =
    fluencyState.blocksCount + fluencyState.prolongationsCount + fluencyState.repetitionsCount;
  const percentStuttered =
    fluencyState.totalSyllables > 0
      ? Math.round((totalDysfluencies / fluencyState.totalSyllables) * 1000) / 10
      : 0;

  const stutteringSeverity = useMemo(() => {
    if (percentStuttered < 3.0) return { label: 'طلاقة طبيعية ضمن المعيار السليم', color: 'text-emerald-400', level: 'طبيعي' };
    if (percentStuttered <= 8.0) return { label: 'تلعثم خفيف (Bégaiement léger)', color: 'text-amber-400', level: 'خفيف' };
    if (percentStuttered <= 15.0) return { label: 'تلعثم متوسط (Bégaiement modéré)', color: 'text-orange-400', level: 'متوسط' };
    return { label: 'تلعثم حاد وشديد (Bégaiement sévère)', color: 'text-rose-400', level: 'شديد' };
  }, [percentStuttered]);

  // Build Comprehensive SOAP Clinical Text
  const buildClinicalSoapReport = () => {
    const patientName = patient ? patient.full_name : 'المريض';
    const dateStr = new Date().toLocaleDateString('ar-DZ');

    return `🎙️ [الحصيلة الصوتية والفونولوجية السريرية المتقدمة - SPEECH ACOUSTIC BIOMARKERS]
---------------------------------------------------------------------
المريض: ${patientName} | التاريخ: ${dateStr}

1. المؤشرات الصوتية ونوعية الصوت (Voice Biomarkers & Dysphonia):
- التردد الأساسي للصوت (Pitch F0): ${liveMetrics.pitch ? `${liveMetrics.pitch} Hz` : 'غير محدد بدقة'}
- اضطراب التردد الدوري (Local Jitter): ${liveMetrics.jitterPercent}% (المعيار السليم: < 1.04%)
- اضطراب السعة الدورية (Local Shimmer): ${liveMetrics.shimmerPercent}% (المعيار السليم: < 3.81%)
- نسبة التوافقيات إلى الضجيج (HNR): ${liveMetrics.hnrDb} dB (المعيار السليم: > 12 dB)
- زمن التصويت الأقصى (TMF /a/): ${tmfState.bestDuration > 0 ? `${tmfState.bestDuration} ثانية` : 'لم يُختبر'} ${
      tmfState.bestDuration >= 10 ? '✅ كفاءة إغلاق مزماري وتنفسي ممتازة' : '⚠️ قصور تنفسي أو تسريب هوائي مزماري'
    }

2. الفحص الطيفي للمخارج وتمايز الفونيمات (Phonetic Centroid Analysis):
${
  phonemeObservations.length > 0
    ? phonemeObservations
        .map(
          (o) =>
            `- [${o.phoneme}] ${o.phonemeName}: مركز الثقل الطيفي = ${o.centroid} Hz (نسبة التطابق: ${o.score}%) -> ${o.diagnosis}`
        )
        .join('\n')
    : `- الفونيم المفحوص (${currentPhoneme.symbol}): مركز الثقل ${liveMetrics.centroid} Hz -> ${phonemeMatch.diagnosis}`
}

3. مقياس طلاقة الكلام والتأتأة (Speech Fluency & Stuttering Tracker):
- إجمالي المقاطع المفحوصة: ${fluencyState.totalSyllables} مقطع
- تعثرات النطق المرصودة: ${totalDysfluencies} (انحباس: ${fluencyState.blocksCount}، إطالة: ${fluencyState.prolongationsCount}، تكرار: ${fluencyState.repetitionsCount})
- نسبة المقاطع المتعثرة (%SS): ${percentStuttered}%
- التقييم السريري لشدة التأتأة: ${stutteringSeverity.level} (${stutteringSeverity.label})`;
  };

  const handleInjectSoap = () => {
    const report = buildClinicalSoapReport();
    if (onInjectIntoSoap) {
      onInjectIntoSoap({
        objectiveText: report,
        assessmentText: `تقرير الفحص الصوتي الأرطوفوني: %SS = ${percentStuttered}% (${stutteringSeverity.level})، TMF = ${tmfState.bestDuration}s، Jitter = ${liveMetrics.jitterPercent}%.`
      });
    } else {
      navigator.clipboard.writeText(report);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    }
    onClose();
  };

  const handleCopyClipboard = () => {
    const report = buildClinicalSoapReport();
    navigator.clipboard.writeText(report);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* HEADER BAR */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  محرك التحليل الصوتي والفونولوجي المتقدم
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] font-bold">
                  Speech AI & Biomarkers
                </span>
              </div>
              
              {/* Patient Badge with Searchable Switcher */}
              <div className="relative mt-1" ref={patientSwitcherRef}>
                <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                  <div
                    onClick={() => patients.length > 0 && setIsPatientSwitcherOpen(prev => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl border text-xs font-bold transition-all ${
                      patients.length > 0
                        ? 'bg-slate-950/80 hover:bg-slate-800 border-slate-700/80 cursor-pointer text-slate-200 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-teal-400" />
                    <span>المريض: <strong className="text-teal-300">{currentPatient ? `${currentPatient.first_name} ${currentPatient.last_name}` : 'فحص صوتي مباشر'}</strong></span>
                    {currentPatient?.folder_number && (
                      <span className="text-[10px] text-slate-400 font-mono font-normal">({currentPatient.folder_number})</span>
                    )}
                    {patients.length > 0 && (
                      <span className="text-[10px] text-indigo-400 font-normal mr-1 flex items-center gap-0.5">
                        <Search className="w-2.5 h-2.5" />
                        <span>(تغيير)</span>
                      </span>
                    )}
                  </div>
                  {currentPatient?.age && <span>• {currentPatient.age} سنة</span>}
                </div>

                {/* Patient Switcher Dropdown */}
                {isPatientSwitcherOpen && patients.length > 0 && (
                  <div className="absolute z-50 mt-1 right-0 w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2.5 space-y-2 backdrop-blur-xl animate-in fade-in">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-teal-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={patientSearchQuery}
                        onChange={(e) => setPatientSearchQuery(e.target.value)}
                        placeholder="ابحث بالاسم، رقم الملف، الهاتف..."
                        className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-teal-500 focus:outline-none transition-all shadow-inner"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      {patientSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setPatientSearchQuery('')}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                      {filteredPatients.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-xs">
                          لا يوجد مريض مطابق لـ "{patientSearchQuery}"
                        </div>
                      ) : (
                        filteredPatients.map((p) => {
                          const isSelected = currentPatient?.id === p.id;
                          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || `مريض #${p.id}`;
                          const folder = p.folder_number || p.file_number || `#${p.id}`;
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setCurrentPatient(p);
                                setIsPatientSwitcherOpen(false);
                                setPatientSearchQuery('');
                              }}
                              className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs border ${
                                isSelected
                                  ? 'bg-teal-600/20 border-teal-500/50 text-white font-bold'
                                  : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/80 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {(name[0] || 'م')}
                                </div>
                                <div className="truncate">
                                  <div className="truncate">{name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">ملف: {folder}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-teal-400 stroke-[3]" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mic Toggle Button */}
            <button
              onClick={toggleListening}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? 'إيقاف اللاقط' : 'تشغيل الميكروفون الحساس'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {audioError && (
          <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{audioError}</span>
          </div>
        )}

        {/* REAL-TIME VISUALIZER STRIP (Fixed At Top) */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800 flex flex-col sm:flex-row items-center gap-4">
          {/* Canvas Spectrum Display */}
          <div className="w-full sm:w-80 h-20 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-inner shrink-0">
            <canvas
              ref={canvasRef}
              width={320}
              height={80}
              className="w-full h-full block"
            />
            <div className="absolute top-1 right-2 text-[9px] font-mono text-slate-400">
              طيف الترددات (FFT 2048)
            </div>
            <div className="absolute bottom-1 left-2 text-[9px] font-mono text-teal-400">
              {isRecording ? `${liveMetrics.dbLevel} dB` : 'مكتوم'}
            </div>
          </div>

          {/* Quick HUD Biomarker Badges */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            {/* Pitch F0 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-medium">التردد الأساسي (F0)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-indigo-400 font-mono">
                  {liveMetrics.pitch ? liveMetrics.pitch : '—'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Hz</span>
              </div>
            </div>

            {/* Spectral Centroid */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-medium">مركز الثقل (Centroid)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-rose-400 font-mono">
                  {liveMetrics.centroid ? liveMetrics.centroid : '—'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Hz</span>
              </div>
            </div>

            {/* Jitter */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-medium">الاضطراب (Jitter)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-lg font-black font-mono ${
                    liveMetrics.jitterPercent > 1.04 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {liveMetrics.jitterPercent ? liveMetrics.jitterPercent : '0.00'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">%</span>
              </div>
            </div>

            {/* Shimmer */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-medium">التذبذب (Shimmer)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-lg font-black font-mono ${
                    liveMetrics.shimmerPercent > 3.81 ? 'text-amber-400' : 'text-teal-400'
                  }`}
                >
                  {liveMetrics.shimmerPercent ? liveMetrics.shimmerPercent : '0.00'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-6 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('articulation')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'articulation'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1️⃣ فحص النطق وتمايز الفونيمات (Sigmatism & Centroid)</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'voice'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>2️⃣ المؤشرات الصوتية ونوعية الصوت (Voice Biomarkers & TMF)</span>
          </button>

          <button
            onClick={() => setActiveTab('fluency')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'fluency'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>3️⃣ محلل طلاقة الكلام والتأتأة (%SS & Stuttering Tracker)</span>
          </button>
        </div>

        {/* TAB BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================
              TAB 1: PHONETIC ARTICULATION & CENTROID MATCHER
             ======================================================== */}
          {activeTab === 'articulation' && (
            <div className="space-y-6">
              {/* Phoneme Selection Cards */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  اختر الفونيم المستهدف للتحليل الطيفي الحي:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                  {Object.values(ARABIC_ACOUSTIC_PHONEMES).map((ph) => {
                    const isSelected = selectedPhonemeId === ph.id;
                    return (
                      <button
                        key={ph.id}
                        onClick={() => setSelectedPhonemeId(ph.id)}
                        className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-600/10'
                            : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-black text-white">{ph.symbol}</span>
                          <span className="text-[10px] font-mono text-slate-400">{ph.ipa}</span>
                        </div>
                        <div className="mt-2 text-[11px] font-semibold text-slate-300 truncate">
                          {ph.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target vs Live Spectral Gauge */}
              <div className="bg-slate-950/60 rounded-3xl border border-slate-800 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>
                        المطابقة الطيفية للفونيم: {currentPhoneme.name} ({currentPhoneme.ipa})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{currentPhoneme.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">نسبة تطابق المخرج</span>
                      <span
                        className={`text-xl font-black font-mono ${
                          phonemeMatch.status === 'good'
                            ? 'text-emerald-400'
                            : phonemeMatch.status === 'warning'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {phonemeMatch.score}%
                      </span>
                    </div>

                    <button
                      onClick={savePhonemeObservation}
                      disabled={!isRecording || liveMetrics.centroid === 0}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تثبيت الملاحظة</span>
                    </button>
                  </div>
                </div>

                {/* Progress Visualizer of Centroid Band */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>0 Hz</span>
                    <span className="text-indigo-300">
                      النطاق الطبيعي المستهدف: {currentPhoneme.targetCentroidMin} - {currentPhoneme.targetCentroidMax} Hz
                    </span>
                    <span>10,000 Hz</span>
                  </div>

                  <div className="w-full h-5 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800">
                    {/* Optimal Target Zone Marker */}
                    <div
                      className="absolute top-0 bottom-0 bg-indigo-500/20 border-x border-indigo-500/40"
                      style={{
                        left: `${(currentPhoneme.targetCentroidMin / 10000) * 100}%`,
                        width: `${((currentPhoneme.targetCentroidMax - currentPhoneme.targetCentroidMin) / 10000) * 100}%`
                      }}
                    />

                    {/* Live Centroid Pointer */}
                    {liveMetrics.centroid > 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-2.5 bg-rose-500 shadow-lg shadow-rose-500/50 rounded-full transition-all duration-75"
                        style={{
                          left: `${Math.min(98, (liveMetrics.centroid / 10000) * 100)}%`
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Live Diagnostic Box */}
                <div
                  className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                    phonemeMatch.status === 'good'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : phonemeMatch.status === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">التشخيص الصوتي المباشر:</span>
                    <span>{phonemeMatch.diagnosis}</span>
                  </div>
                </div>
              </div>

              {/* Saved Observations List */}
              {phonemeObservations.length > 0 && (
                <div className="bg-slate-950/40 rounded-2xl border border-slate-800 p-4">
                  <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
                    <span>الملاحظات الفونولوجية المثبتة لهذه الجلسة ({phonemeObservations.length}):</span>
                    <button
                      onClick={() => setPhonemeObservations([])}
                      className="text-[11px] text-slate-500 hover:text-rose-400 transition-all"
                    >
                      تفريغ السجل
                    </button>
                  </h4>
                  <div className="space-y-2">
                    {phonemeObservations.map((obs) => (
                      <div
                        key={obs.id}
                        className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-sm">
                            {obs.phoneme}
                          </span>
                          <div>
                            <span className="font-bold text-white ml-2">{obs.phonemeName}</span>
                            <span className="text-slate-400 font-mono">
                              (Fc: {obs.centroid} Hz - {obs.score}%)
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">{obs.diagnosis}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{obs.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 2: VOICE BIOMARKERS & TMF TEST
             ======================================================== */}
          {activeTab === 'voice' && (
            <div className="space-y-6">
              {/* Target Norm Filter */}
              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">
                  فئة المريض لتحديد المعايير السريرية:
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setTargetGender('child')}
                    className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                      targetGender === 'child'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    طفل (250 - 400 Hz)
                  </button>
                  <button
                    onClick={() => setTargetGender('female')}
                    className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                      targetGender === 'female'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    أنثى (165 - 255 Hz)
                  </button>
                  <button
                    onClick={() => setTargetGender('male')}
                    className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                      targetGender === 'male'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ذكر (85 - 155 Hz)
                  </button>
                </div>
              </div>

              {/* TMF (Temps Maximal de Phonation) Interactive Station */}
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-3xl border border-teal-500/20 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        اختبار زمن التصويت الأقصى (TMF - Temps Maximal de Phonation)
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                        حرف المصوت /a/
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      اطلب من المريض أخذ نفس عميق ثم إصدار صوت /آآآ/ لأطول فترة ممكنة. سيبدأ الميقاتي تلقائياً عند استشعار الصوت.
                    </p>
                  </div>

                  {/* TMF Controls */}
                  <div className="flex items-center gap-2">
                    {tmfState.status === 'idle' || tmfState.status === 'completed' ? (
                      <button
                        onClick={startTmfTest}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/30 flex items-center gap-1.5 active:scale-95"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>بدء فحص TMF</span>
                      </button>
                    ) : (
                      <button
                        onClick={resetTmfTest}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 animate-pulse"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        <span>إلغاء الفحص</span>
                      </button>
                    )}

                    <button
                      onClick={resetTmfTest}
                      title="إعادة تصفير الاختبار"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* TMF Digital Stopwatch Display */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">
                    {tmfState.status === 'listening' && '⏳ بانتظار نطق صوت /آآآ/ من المريض...'}
                    {tmfState.status === 'recording' && '🔴 جاري التسجيل واستشعار التصويت الحي...'}
                    {tmfState.status === 'completed' && '✅ اكتمل الاختبار وحُفظت أفضل نتيجة'}
                    {tmfState.status === 'idle' && 'اضغط "بدء فحص TMF" لبدء الاختبار التلقائي'}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-teal-400 font-mono tracking-wider">
                      {tmfState.duration.toFixed(1)}
                    </span>
                    <span className="text-sm font-bold text-slate-500 font-mono">ثانية</span>
                  </div>

                  {/* Best Duration & Norm comparison */}
                  {tmfState.bestDuration > 0 && (
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      <span className="text-slate-300">
                        أفضل زمن محقق:{' '}
                        <strong className="text-teal-300 font-mono">{tmfState.bestDuration} ثانية</strong>
                      </span>
                      <span
                        className={`font-bold ${
                          tmfState.bestDuration >= 12 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {tmfState.bestDuration >= 12
                          ? '✅ كفاءة تنفسية ومزمارية طبيعية'
                          : '⚠️ زمن قصير: اشتباه تسريب هوائي مزماري أو ضعف دعم تنفسي'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Vocal Health Table (Jitter / Shimmer / HNR) */}
              <div className="bg-slate-950/60 rounded-3xl border border-slate-800 p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>مصفوفة الاستقرار الصوتي واكتشاف البحة (Acoustic Perturbation Matrix)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Jitter Card */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white">اضطراب التردد (Jitter)</span>
                      <span className="text-[10px] text-slate-400 font-mono">&lt; 1.04%</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-indigo-400">
                      {liveMetrics.jitterPercent}%
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      يقيس عدم انتظام اهتزاز الحبال الصوتية دورة بعد دورة. القيم المرتفعة تشير إلى بحة أو إجهاد حنجري.
                    </p>
                  </div>

                  {/* Shimmer Card */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white">اضطراب السعة (Shimmer)</span>
                      <span className="text-[10px] text-slate-400 font-mono">&lt; 3.81%</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-teal-400">
                      {liveMetrics.shimmerPercent}%
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      يقيس التذبذب في شدة الصوت بين الدورات. يشير الارتفاع إلى خلل في الإطباق التام للثنايا الصوتية.
                    </p>
                  </div>

                  {/* HNR Card */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white">التوافقيات إلى الضجيج (HNR)</span>
                      <span className="text-[10px] text-slate-400 font-mono">&gt; 12 dB</span>
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-400">
                      {liveMetrics.hnrDb} dB
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      يقارن الطاقة الصوتية النقية بالضجيج الحنجري والخشونة الهوائية (Dysphonie).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: SPEECH FLUENCY & STUTTERING TRACKER
             ======================================================== */}
          {activeTab === 'fluency' && (
            <div className="space-y-6">
              {/* Tracker HUD */}
              <div className="bg-slate-950/60 rounded-3xl border border-slate-800 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>عداد ومقياس التأتأة السريري (%SS - Percentage of Stuttered Syllables)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      اضغط على الأزرار أثناء كلام المريض لتسجيل كل عثرة كلامية وحساب معدل الطلاقة تلقائياً.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setFluencyState({
                          totalSyllables: 100,
                          stutteredSyllables: 0,
                          blocksCount: 0,
                          prolongationsCount: 0,
                          repetitionsCount: 0,
                          speakingDurationSec: 0,
                          isTracking: false
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>تصفير العداد</span>
                    </button>
                  </div>
                </div>

                {/* KPI Cards: %SS, Total Syllables, Severity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
                    <span className="text-[11px] font-semibold text-slate-400">
                      نسبة المقاطع المتعثرة (%SS)
                    </span>
                    <div className="text-3xl font-black font-mono text-amber-400 mt-1">
                      {percentStuttered}%
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
                    <span className="text-[11px] font-semibold text-slate-400">
                      إجمالي المقاطع المرجعية
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="20"
                        max="500"
                        step="10"
                        value={fluencyState.totalSyllables}
                        onChange={(e) =>
                          setFluencyState((prev) => ({
                            ...prev,
                            totalSyllables: parseInt(e.target.value) || 100
                          }))
                        }
                        className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-base font-bold font-mono text-white text-center focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-xs text-slate-500">مقطع كلامي</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
                    <span className="text-[11px] font-semibold text-slate-400">
                      التقييم السريري للشدة
                    </span>
                    <div className={`text-base font-black mt-1 ${stutteringSeverity.color}`}>
                      {stutteringSeverity.label}
                    </div>
                  </div>
                </div>

                {/* Real-time Dysfluency Event Clickers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Block Clicker */}
                  <button
                    onClick={() =>
                      setFluencyState((prev) => ({
                        ...prev,
                        blocksCount: prev.blocksCount + 1
                      }))
                    }
                    className="p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                  >
                    <span className="text-xs font-bold group-hover:text-white">
                      انحباس صامت / قفل (Block)
                    </span>
                    <span className="text-2xl font-black font-mono text-white">
                      {fluencyState.blocksCount}
                    </span>
                    <span className="text-[10px] text-rose-400/80">انقطاع مفاجئ في تيار الهواء</span>
                  </button>

                  {/* Prolongation Clicker */}
                  <button
                    onClick={() =>
                      setFluencyState((prev) => ({
                        ...prev,
                        prolongationsCount: prev.prolongationsCount + 1
                      }))
                    }
                    className="p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                  >
                    <span className="text-xs font-bold group-hover:text-white">
                      إطالة صوت (Prolongation)
                    </span>
                    <span className="text-2xl font-black font-mono text-white">
                      {fluencyState.prolongationsCount}
                    </span>
                    <span className="text-[10px] text-amber-400/80">سحب الصوت اللاإرادي</span>
                  </button>

                  {/* Repetition Clicker */}
                  <button
                    onClick={() =>
                      setFluencyState((prev) => ({
                        ...prev,
                        repetitionsCount: prev.repetitionsCount + 1
                      }))
                    }
                    className="p-4 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                  >
                    <span className="text-xs font-bold group-hover:text-white">
                      تكرار مقطع (Repetition)
                    </span>
                    <span className="text-2xl font-black font-mono text-white">
                      {fluencyState.repetitionsCount}
                    </span>
                    <span className="text-[10px] text-indigo-400/80">تكرار الحرف أو المقطع</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              جميع الحسابات الطيفية والصوتية تتم محلياً في المتصفح مع الحفاظ الكامل على سرية صوت المريض.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Copy Clipboard Button */}
            <button
              onClick={handleCopyClipboard}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              {copiedSummary ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>تم النسخ بنجاح!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ التقرير</span>
                </>
              )}
            </button>

            {/* SOAP Inject Button */}
            <button
              onClick={handleInjectSoap}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>حقن الحصيلة الصوتية في الـ SOAP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
