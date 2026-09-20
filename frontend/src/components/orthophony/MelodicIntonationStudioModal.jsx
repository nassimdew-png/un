import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Music,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  FileText,
  User,
  Search,
  Check,
  X,
  Layers,
  ArrowRight,
  Volume2,
  Trophy,
  Activity
} from 'lucide-react';

export default function MelodicIntonationStudioModal({
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

  // MIT Level (1 to 4)
  const [activeLevel, setActiveLevel] = useState(1);

  // Target Phrase Library
  const targetPhrases = [
    {
      id: 1,
      phrase: 'صَباحُ الخَيْر',
      syllables: [
        { text: 'صَـ', pitch: 'low', freq: 330 },
        { text: 'ـبَا', pitch: 'high', freq: 440 },
        { text: 'حُ', pitch: 'low', freq: 330 },
        { text: 'الْـ', pitch: 'low', freq: 330 },
        { text: 'ـخَيْر', pitch: 'high', freq: 440 },
      ],
      level: 1,
    },
    {
      id: 2,
      phrase: 'أُرِيدُ مَاء',
      syllables: [
        { text: 'أُ', pitch: 'low', freq: 330 },
        { text: 'رِيـ', pitch: 'high', freq: 440 },
        { text: 'ـدُ', pitch: 'low', freq: 330 },
        { text: 'مَاء', pitch: 'high', freq: 440 },
      ],
      level: 1,
    },
    {
      id: 3,
      phrase: 'أَنَا أُحِبُّ عَائِلَتِي',
      syllables: [
        { text: 'أَ', pitch: 'low', freq: 330 },
        { text: 'نَا', pitch: 'high', freq: 440 },
        { text: 'أُ', pitch: 'low', freq: 330 },
        { text: 'حِبْـ', pitch: 'high', freq: 440 },
        { text: 'ـبُ', pitch: 'low', freq: 330 },
        { text: 'عَا', pitch: 'high', freq: 440 },
        { text: 'ئِـ', pitch: 'low', freq: 330 },
        { text: 'ـلَـ', pitch: 'low', freq: 330 },
        { text: 'ـتِي', pitch: 'high', freq: 440 },
      ],
      level: 2,
    },
  ];

  const [selectedPhrase, setSelectedPhrase] = useState(targetPhrases[0]);
  const [activeSyllableIdx, setActiveSyllableIdx] = useState(-1);
  const [isPlayingMelody, setIsPlayingMelody] = useState(false);
  const [bpmSpeed, setBpmSpeed] = useState(70);

  // Scoring State
  const [scoreTrials, setScoreTrials] = useState({ correct: 5, total: 6 });
  const accuracyPercent = scoreTrials.total > 0 ? Math.round((scoreTrials.correct / scoreTrials.total) * 100) : 0;

  // Web Audio Context Ref
  const audioContextRef = useRef(null);

  // Play Harmonic Tone for Syllable
  const playTone = (frequency, duration = 0.4) => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Warm harmonic sound
      osc.frequency.setValueAtTime(frequency, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  };

  // Play Entire Phrase Sequence
  const playMelodicSequence = () => {
    if (isPlayingMelody) return;
    setIsPlayingMelody(true);
    setActiveSyllableIdx(0);

    const intervalMs = (60 / bpmSpeed) * 1000;
    let idx = 0;

    const playNext = () => {
      if (idx < selectedPhrase.syllables.length) {
        setActiveSyllableIdx(idx);
        const syl = selectedPhrase.syllables[idx];
        playTone(syl.freq, (intervalMs / 1000) * 0.85);
        idx++;
        setTimeout(playNext, intervalMs);
      } else {
        setIsPlayingMelody(false);
        setActiveSyllableIdx(-1);
      }
    };

    playNext();
  };

  // SOAP Injection Handler
  const handleInjectSoap = () => {
    const summary = `[العلاج بالنبر والترنيم الموسيقي لحبسة بروكا - Melodic Intonation Therapy]:\n` +
      `- المستوى المطبق: المستوى ${activeLevel} (${activeLevel === 1 ? 'الترنيم المتزامن مع النقر الإيقاعي Choral' : activeLevel === 2 ? 'الترنيم مع التلاشي التدريجي Fade' : activeLevel === 3 ? 'الترديد المؤجل Delayed' : 'الانتقال للنطق الطبيعي Sprechgesang'})\n` +
      `- العبارة المستهدفة: "${selectedPhrase.phrase}"\n` +
      `- دقة الإنتاج النغمي واللفظي: ${accuracyPercent}% (${scoreTrials.correct}/${scoreTrials.total} محاولات ناجحة)\n` +
      `- سرعة الإيقاع: ${bpmSpeed} BPM مع تنشيط النصف الأيمن من الدماغ عبر النقر باليد اليسرى.`;

    if (onInjectSoap) {
      onInjectSoap({
        objective: summary,
        assessment: `تحسن في الطلاقة التعبيرية والانسياب الكلامي لمرضى الحبسة الحركية (Broca's Aphasia) عبر مسار MIT.`,
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
      <div className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Music className="w-6 h-6 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate">
                  العلاج بالنبر والترنيم الموسيقي (Melodic Intonation Therapy - MIT)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Aphasia Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                استعادة الكلام لمرضى الحبسة الحركية (Broca) وعسر النطق عبر تحفيز النصف الأيمن من الدماغ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Patient Selector */}
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setIsPatientPickerOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-xs font-bold text-slate-200 transition flex items-center gap-2 shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
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
                      className="w-full pr-8 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
                        {selectedPatient?.id === p.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
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

        {/* 4 Levels Bar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          {[
            { lvl: 1, label: 'المستوى 1: التنغيم المشترك (Choral Singing)' },
            { lvl: 2, label: 'المستوى 2: التنغيم مع الانسحاب (Choral with Fade)' },
            { lvl: 3, label: 'المستوى 3: الترديد المؤجل (Delayed Repetition)' },
            { lvl: 4, label: 'المستوى 4: الانتقال للكلام الطبيعي (Sprechgesang)' },
          ].map((l) => (
            <button
              key={l.lvl}
              type="button"
              onClick={() => setActiveLevel(l.lvl)}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeLevel === l.lvl
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Visual Melodic Contour Canvas */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase">العبارة المستهدفة للترنيم:</span>
                <h3 className="text-2xl font-black text-white mt-0.5 tracking-wide">{selectedPhrase.phrase}</h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">السرعة:</span>
                  <span className="text-xs font-mono font-bold text-amber-300">{bpmSpeed} BPM</span>
                  <input
                    type="range"
                    min="40"
                    max="120"
                    value={bpmSpeed}
                    onChange={(e) => setBpmSpeed(Number(e.target.value))}
                    className="w-20 accent-amber-500 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={playMelodicSequence}
                  disabled={isPlayingMelody}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isPlayingMelody ? 'جاري الترنيم...' : 'تشغيل النمط النغمي 🎵'}</span>
                </button>
              </div>
            </div>

            {/* Syllable Contour Blocks */}
            <div className="flex items-end justify-center gap-4 py-8 overflow-x-auto">
              {selectedPhrase.syllables.map((syl, idx) => {
                const isActive = activeSyllableIdx === idx;
                const isHigh = syl.pitch === 'high';

                return (
                  <div
                    key={idx}
                    onClick={() => playTone(syl.freq, 0.4)}
                    className={`flex flex-col items-center justify-between p-4 rounded-3xl border-2 transition-all cursor-pointer select-none ${
                      isHigh ? 'h-40 bg-amber-500/10' : 'h-28 bg-slate-900'
                    } ${
                      isActive
                        ? 'border-amber-400 bg-amber-500/30 scale-110 shadow-2xl shadow-amber-500/40'
                        : isHigh
                        ? 'border-amber-500/40'
                        : 'border-slate-800'
                    }`}
                    style={{ width: '80px' }}
                  >
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {isHigh ? 'نبر مرتفع ⬆️' : 'نبر منخفض ⬇️'}
                    </span>

                    <span className={`text-xl font-black ${isActive ? 'text-amber-300' : 'text-white'}`}>
                      {syl.text}
                    </span>

                    <span className="text-[10px] font-mono text-slate-500">{syl.freq}Hz</span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>إشارة النقر باليد اليسرى (Left Hand Tapping): تحفز مسار اللغة البديل في الفص الصدغي الأيمن.</span>
              </span>
            </div>
          </div>

          {/* Scoring & Trials Counter */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">دقة النطق والترنيم</span>
                <span className="text-xl font-mono font-black text-amber-400">{accuracyPercent}%</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-300 font-bold block">رصد استجابة المريض:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setScoreTrials((p) => ({ ...p, correct: p.correct + 1, total: p.total + 1 }))}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    ✓ استجابة صحيحة (+1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoreTrials((p) => ({ ...p, total: p.total + 1 }))}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
                  >
                    ✗ تعثر أو توقف (+0)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScoreTrials({ correct: 0, total: 0 })}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400"
                title="تصفير العداد"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>بروتوكول العلاج بالنبر والترنيم الموسيقي المعتمد (MIT Speech Recovery)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInjectSoap}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>حقن تقرير MIT في SOAP ✨</span>
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
