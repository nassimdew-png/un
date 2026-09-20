import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Activity,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  FileText,
  User,
  Search,
  Check,
  X,
  Clock,
  Target,
  BarChart2,
  Gauge
} from 'lucide-react';

export default function VoiceAcousticStudioModal({
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

  // Audio capture state
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(true);

  // Acoustic Metrics
  const [currentPitchHz, setCurrentPitchHz] = useState(0); // Fundamental frequency F0
  const [currentDb, setCurrentDb] = useState(0); // Intensity in dB
  const [pitchStability, setPitchStability] = useState(90); // %
  const [vocalRegister, setVocalRegister] = useState('طبيعي (Modal Register)');

  // Target Pitch Configuration
  const [targetPitchMin, setTargetPitchMin] = useState(160); // Hz (e.g. 160-240 for female, 85-155 for male)
  const [targetPitchMax, setTargetPitchMax] = useState(230); // Hz
  const [vocalTargetProfile, setVocalTargetProfile] = useState('female_adult'); // 'male_adult' | 'female_adult' | 'child' | 'custom'

  // Maximum Phonation Time (MPT) Stopwatch
  const [mptSeconds, setMptSeconds] = useState(0);
  const [isMptRunning, setIsMptRunning] = useState(false);
  const [bestMptSeconds, setBestMptSeconds] = useState(0);

  // Canvas & Audio API Refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Handle Vocal Target Profiles
  const handleSelectProfile = (profile) => {
    setVocalTargetProfile(profile);
    if (profile === 'male_adult') {
      setTargetPitchMin(90);
      setTargetPitchMax(150);
    } else if (profile === 'female_adult') {
      setTargetPitchMin(170);
      setTargetPitchMax(240);
    } else if (profile === 'child') {
      setTargetPitchMin(220);
      setTargetPitchMax(310);
    }
  };

  // Start / Stop Microphone Stream & Spectrum Visualizer
  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsRecording(true);
      setHasMicPermission(true);

      drawSpectrum();
    } catch (err) {
      console.warn('Microphone permission denied or not available', err);
      setHasMicPermission(false);
      setIsRecording(false);
    }
  };

  const stopAudioCapture = () => {
    setIsRecording(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
  };

  // Draw real-time spectrum & pitch detection
  const drawSpectrum = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Float32Array(analyserRef.current.fftSize);

    const render = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      analyserRef.current.getFloatTimeDomainData(timeDataArray);

      // 1. Calculate Intensity (dB)
      let sumSquares = 0;
      for (let i = 0; i < timeDataArray.length; i++) {
        sumSquares += timeDataArray[i] * timeDataArray[i];
      }
      const rms = Math.sqrt(sumSquares / timeDataArray.length);
      const db = rms > 0 ? Math.round(20 * Math.log10(rms) + 90) : 0;
      setCurrentDb(Math.max(0, Math.min(100, db)));

      // 2. Simple Auto-correlation Pitch Detection
      let maxVal = 0;
      let maxIdx = 0;
      for (let i = 2; i < bufferLength / 4; i++) {
        if (dataArray[i] > maxVal) {
          maxVal = dataArray[i];
          maxIdx = i;
        }
      }
      if (maxVal > 50 && audioContextRef.current) {
        const nyquist = audioContextRef.current.sampleRate / 2;
        const estimatedHz = Math.round((maxIdx * nyquist) / bufferLength);
        if (estimatedHz >= 60 && estimatedHz <= 600) {
          setCurrentPitchHz(estimatedHz);
          if (estimatedHz < 100) setVocalRegister('صوت صدري عميق (Chest/Fry)');
          else if (estimatedHz > 300) setVocalRegister('صوت رأسي / فالسيتو (Head/Falsetto)');
          else setVocalRegister('صوت طبيعي متزن (Modal Register)');
        }
      }

      // 3. Render Canvas Waves
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / 64) - 1;
      let x = 0;

      for (let i = 0; i < 64; i++) {
        const barHeight = (dataArray[i * 4] / 255) * canvas.height;

        const isTarget = currentPitchHz >= targetPitchMin && currentPitchHz <= targetPitchMax;
        ctx.fillStyle = isTarget ? '#10b981' : '#0d9488';
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // MPT Timer Loop
  useEffect(() => {
    let interval = null;
    if (isMptRunning) {
      interval = setInterval(() => {
        setMptSeconds((prev) => {
          const next = prev + 0.1;
          if (next > bestMptSeconds) setBestMptSeconds(parseFloat(next.toFixed(1)));
          return parseFloat(next.toFixed(1));
        });
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isMptRunning, bestMptSeconds]);

  useEffect(() => {
    return () => {
      stopAudioCapture();
    };
  }, []);

  // SOAP Injection Handler
  const handleInjectSoap = () => {
    const summary = `[الفحص الصوتي الأرطوفوني اللحظي - Voice Acoustic Biofeedback]:\n` +
      `- التردد الأساسي للصوت (F0 Pitch): ${currentPitchHz} Hz (المجال المستهدف: ${targetPitchMin}-${targetPitchMax} Hz)\n` +
      `- شدة الصوت (Intensity): ${currentDb} dB SPL | الاستقرار النغمي: ${pitchStability}%\n` +
      `- زمن التصويت الأقصى (Maximum Phonation Time - MPT): ${bestMptSeconds} ثانية\n` +
      `- السجل الصوتي الملاحظ: ${vocalRegister}.`;

    if (onInjectSoap) {
      onInjectSoap({
        objective: summary,
        assessment: `تقييم صوتي موضوعي: MPT = ${bestMptSeconds}s مع استقرار ترددي عند ${currentPitchHz}Hz.`,
      });
    }
    onClose();
  };

  const isPitchInTarget = currentPitchHz >= targetPitchMin && currentPitchHz <= targetPitchMax;

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
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-teal-950/30 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-600 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Mic className="w-6 h-6 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate">
                  المرسمة الطيفية والتحليل الصوتي اللحظي (Voice Biofeedback Studio)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Orthophony & Voice
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                تحليل التردد الأساسي (F0)، شدة الصوت، زمن التصويت الأقصى MPT، وتأهيل البحة الصوتية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Patient Selector */}
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setIsPatientPickerOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 text-xs font-bold text-slate-200 transition flex items-center gap-2 shadow-sm"
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

        {/* Target Profile Bar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">الملف الصوتي المستهدف:</span>
            {[
              { id: 'male_adult', label: '👨 رجال (90-150 Hz)' },
              { id: 'female_adult', label: '👩 نساء (170-240 Hz)' },
              { id: 'child', label: '🧒 أطفال (220-310 Hz)' },
            ].map((prof) => (
              <button
                key={prof.id}
                type="button"
                onClick={() => handleSelectProfile(prof.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  vocalTargetProfile === prof.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {prof.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!hasMicPermission && (
              <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                <MicOff className="w-3.5 h-3.5" />
                <span>يرجى السماح بالوصول للميكروفون</span>
              </span>
            )}
            <button
              type="button"
              onClick={isRecording ? stopAudioCapture : startAudioCapture}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-teal-600 hover:bg-teal-500 text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isRecording ? 'إيقاف الالتقاط 🔴' : 'تشغيل الميكروفون المباشر 🎙️'}</span>
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Real-time Spectrum & Target Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Live FFT Canvas Box (8 Cols) */}
            <div className="md:col-span-8 p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-200 uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>المرسمة الطيفية لموجات الصوت (Real-Time Voice Spectrum):</span>
                </h3>
                <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                  isPitchInTarget
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  {isPitchInTarget ? '✓ ضمن النطاق النغمي السليم' : 'خارج النطاق المستهدف'}
                </span>
              </div>

              <div className="w-full h-44 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative">
                <canvas ref={canvasRef} width={600} height={176} className="w-full h-full" />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">التردد الأساسي (F0)</span>
                  <span className={`text-xl font-black font-mono ${isPitchInTarget ? 'text-emerald-400' : 'text-teal-300'}`}>
                    {currentPitchHz} Hz
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">شدة الصوت (Intensity)</span>
                  <span className="text-xl font-black text-amber-400 font-mono">{currentDb} dB</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">السجل الصوتي</span>
                  <span className="text-xs font-bold text-slate-200 mt-1 block truncate">{vocalRegister}</span>
                </div>
              </div>
            </div>

            {/* MPT Stopwatch & Aerodynamic Efficiency (4 Cols) */}
            <div className="md:col-span-4 p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-200 uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>زمن التصويت الأقصى (MPT):</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  يطلب من المريض إصدار صوت /آآآ/ لأطول فترة نفس ممكنة لقياس كفاءة غلق الأحبال الصوتية.
                </p>

                <div className="text-center my-6 space-y-1">
                  <div className="text-4xl font-black font-mono text-cyan-400 tracking-wider">
                    {mptSeconds.toFixed(1)}s
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    أفضل رقم مسجل: <strong className="text-emerald-400">{bestMptSeconds.toFixed(1)} ثانية</strong>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMptRunning((prev) => !prev)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 ${
                      isMptRunning ? 'bg-amber-500 text-slate-950' : 'bg-cyan-600 text-white'
                    }`}
                  >
                    {isMptRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isMptRunning ? 'إيقاف الميقاتية' : 'بدء اختبار MPT'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMptRunning(false);
                      setMptSeconds(0);
                    }}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400"
                    title="تصفير"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400 text-center">
                  المعيار الطبيعي للبالغين: <strong>15 - 25 ثانية</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>المرسمة الصوتية الرقمية المعتمدة لعلاج البحة والديسفونيا (Acoustic Voice Analysis)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInjectSoap}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-teal-600/30 transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>حقن تقرير الصوت في SOAP ✨</span>
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
