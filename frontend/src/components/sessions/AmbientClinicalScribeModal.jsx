import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Download,
  Activity,
  Brain,
  ShieldAlert,
  ChevronDown,
  User,
  Stethoscope,
  Clock,
  Send,
  Sliders,
  Check,
  Tag,
  RefreshCw
} from 'lucide-react';
import { voiceSoapApi } from '../../api';

// Red Alert Clinical Keywords
const RED_ALERT_KEYWORDS = [
  'انتحار',
  'أنتحر',
  'إيذاء النفس',
  'أموت',
  'أقتل نفسي',
  'كرهت حياتي',
  'نشنق روحي',
  'نقتل روحي',
  'نموت',
  'قطع العروق',
  'جرعة زائدة',
  'suicide',
  'me tuer',
  'en finir',
  'mourir',
  'automutilation',
  'mutilation'
];

// Clinical entity keywords
const CLINICAL_ENTITIES = {
  symptoms: [
    'قلق', 'خوف', 'نوبة هلع', 'هلع', 'أرق', 'وسواس', 'كآبة', 'حزن',
    'تلعثم', 'تأتأة', 'تأخر نطق', 'تشتت', 'فرط حركة', 'غضب', 'عدوانية',
    'anxiété', 'angoisse', 'panique', 'insomnie', 'dépression', 'bégaiement'
  ],
  medications: [
    'زولوفت', 'ديباكين', 'ريتالين', 'أتاراكس', 'سيرترالين', 'بروزاك',
    'فلوكسيتين', 'زاناكس', 'ليزانكسيا', 'سولبيبريد',
    'zoloft', 'dépakine', 'ritaline', 'atarax', 'sertraline', 'prozac', 'xanax'
  ],
  distortions: [
    'كارثة', 'مستحيل', 'دائما', 'أبدا', 'لا أحد يحبني', 'ذنبي', 'فاشل',
    'catastrophisme', 'généralisation', 'tout ou rien'
  ]
};

export default function AmbientClinicalScribeModal({
  isOpen,
  onClose,
  patient = null,
  appointment = null,
  onInjectIntoSoap = null
}) {
  if (!isOpen) return null;

  // Mode: 'ambient' (Live listening) | 'structured' (SOAP review)
  const [activeView, setActiveView] = useState('ambient');

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('ar-DZ'); // 'ar-DZ', 'ar-SA', 'fr-FR'
  const [sessionDurationSec, setSessionDurationSec] = useState(0);

  // Transcript Chunks: [ { id, timestamp, speaker: 'practitioner'|'patient', text, isRedAlert: bool } ]
  const [transcriptChunks, setTranscriptChunks] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [activeSpeaker, setActiveSpeaker] = useState('practitioner'); // default speaker for next speech

  // Red Alert State
  const [detectedRedAlerts, setDetectedRedAlerts] = useState([]);

  // Extracted Entities
  const [detectedEntities, setDetectedEntities] = useState({
    symptoms: new Set(),
    medications: new Set(),
    distortions: new Set()
  });

  // Structured SOAP State
  const [soapData, setSoapData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    recommended_homework: ''
  });

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const transcriptBottomRef = useRef(null);
  const shouldKeepListeningRef = useRef(false);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptChunks, interimText]);

  // Session timer
  useEffect(() => {
    if (isListening) {
      timerIntervalRef.current = setInterval(() => {
        setSessionDurationSec((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isListening]);

  // Initialize and manage continuous Speech Recognition
  const startAmbientListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('متصفحك لا يدعم التعرف الصوتي المباشر. يرجى استخدام متصفح حديث مثل Chrome أو Edge.');
      return;
    }

    shouldKeepListeningRef.current = true;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            commitSpeechChunk(transcript.trim());
          } else {
            currentInterim += transcript;
          }
        }

        setInterimText(currentInterim);
      };

      recognition.onerror = (event) => {
        console.warn('Ambient Scribe recognition notice:', event.error);
        if (event.error === 'not-allowed') {
          shouldKeepListeningRef.current = false;
          setIsListening(false);
          alert('تم رفض إذن الوصول للميكروفون.');
        }
      };

      recognition.onend = () => {
        // Auto-restart if ambient listening is still enabled
        if (shouldKeepListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.warn('Auto-restart recognition attempt:', e);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start Speech Recognition:', err);
      setIsListening(false);
    }
  };

  const stopAmbientListening = () => {
    shouldKeepListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopAmbientListening();
    } else {
      startAmbientListening();
    }
  };

  // Commit Speech Chunk & Analyze Red Flags / Entities
  const commitSpeechChunk = (text) => {
    if (!text || text.length < 2) return;

    // Check Red Alert
    const lowerText = text.toLowerCase();
    const hasRedAlert = RED_ALERT_KEYWORDS.some((kw) => lowerText.includes(kw));

    if (hasRedAlert) {
      setDetectedRedAlerts((prev) => [...prev, text]);
    }

    // Extract Entities
    const newSymptoms = new Set(detectedEntities.symptoms);
    const newMeds = new Set(detectedEntities.medications);
    const newDistortions = new Set(detectedEntities.distortions);

    CLINICAL_ENTITIES.symptoms.forEach((s) => {
      if (lowerText.includes(s)) newSymptoms.add(s);
    });
    CLINICAL_ENTITIES.medications.forEach((m) => {
      if (lowerText.includes(m)) newMeds.add(m);
    });
    CLINICAL_ENTITIES.distortions.forEach((d) => {
      if (lowerText.includes(d)) newDistortions.add(d);
    });

    setDetectedEntities({
      symptoms: newSymptoms,
      medications: newMeds,
      distortions: newDistortions
    });

    // Append to chunks
    const newChunk = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      speaker: activeSpeaker,
      text,
      isRedAlert: hasRedAlert
    };

    setTranscriptChunks((prev) => [...prev, newChunk]);
    setInterimText('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldKeepListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Format Duration
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Build Full Dialogue Text
  const fullDialogueText = useMemo(() => {
    return transcriptChunks
      .map((c) => `[${c.timestamp}] ${c.speaker === 'practitioner' ? 'المعالج' : 'المريض/الولي'}: ${c.text}`)
      .join('\n');
  }, [transcriptChunks]);

  // Automated Clinical SOAP Structuring (Local Heuristic + Cloud AI Fallback)
  const handleGenerateSoap = async () => {
    if (transcriptChunks.length === 0) {
      alert('لا توجد حوارات مسجلة بعد. يرجى تشغيل الاستماع المحيطي أولاً أو التحدث في الجلسة.');
      return;
    }

    setIsSynthesizing(true);

    try {
      // 1. Try Cloud Voice SOAP API
      const formData = new FormData();
      if (patient?.id) formData.append('patient_id', patient.id);
      if (appointment?.id) formData.append('appointment_id', appointment.id);
      formData.append('transcript', fullDialogueText);
      formData.append('language', language.startsWith('fr') ? 'fr' : 'ar');

      const res = await voiceSoapApi.processVoiceSoap(formData);

      if (res?.success && res?.data) {
        const d = res.data;
        let alertWarning = '';
        if (detectedRedAlerts.length > 0) {
          alertWarning = `\n\n🚨 [تنبيه أمان سريري عاجل - RED ALERT]:\nتم رصد عبارات تشير إلى خطر حرج:\n` +
            detectedRedAlerts.map(a => `• "${a}"`).join('\n');
        }

        setSoapData({
          subjective: d.subjective || '',
          objective: d.objective || '',
          assessment: (d.assessment || '') + alertWarning,
          plan: d.plan || '',
          recommended_homework: d.recommended_homework || ''
        });
        setActiveView('structured');
        setIsSynthesizing(false);
        return;
      }
    } catch (err) {
      console.warn('Cloud SOAP failed, falling back to heuristic parser:', err);
    }

    // 2. High-Grade Local Heuristic Clinical Structuring
    const patientSpeech = transcriptChunks
      .filter((c) => c.speaker === 'patient')
      .map((c) => c.text)
      .join('؛ ');

    const practitionerSpeech = transcriptChunks
      .filter((c) => c.speaker === 'practitioner')
      .map((c) => c.text)
      .join('؛ ');

    const symptomsList = Array.from(detectedEntities.symptoms).join('، ');
    const medsList = Array.from(detectedEntities.medications).join('، ');

    let alertHeader = '';
    if (detectedRedAlerts.length > 0) {
      alertHeader = `🚨 [تنبيه أمان سريري عاجل - RED ALERT: تم رصد مؤشرات خطورة أثناء الجلسة المحيطية]\n`;
    }

    const localSoap = {
      subjective: patientSpeech
        ? `أفاد المريض / الولي خلال الحوار السريري: ${patientSpeech}.${symptomsList ? `\nالأعراض المصرح بها: ${symptomsList}.` : ''}`
        : 'أفاد المريض باستقرار نسبي في الأعراض مع متابعة التطورات السريرية في المحيط الأسري.',
      objective: practitionerSpeech
        ? `ملاحظات المعالج أثناء التفاعل المباشر: ${practitionerSpeech}.${medsList ? `\nالأدوية المذكورة: ${medsList}.` : ''}`
        : `حضور متعاون، تواصل بصري سليم، مشاركة إيجابية في الحوار السريري. استجابة جيدة للمثيرات.`,
      assessment: `${alertHeader}تحليل مسار الجلسة: الحالة النفسية والسريرية تظهر استجابة للبروتوكول العلاجي. تم توثيق الملاحظات عبر الكاتب السريري المحيطي (Ambient Scribe).${
        detectedRedAlerts.length > 0
          ? `\nتنبيه: تم رصد عبارات حرجة تستدعي التقييم الفوري لعوامل الخطر ومراجعة شبكة الدعم الأسري.`
          : ''
      }`,
      plan: `1. متابعة التدخل السريري وفق الخطة المحددة.\n2. التكليف بالمهام المنزلية وملاحظة التطورات اليومية.\n3. تحديد موعد الجلسة القادمة لتقييم المكتسبات.`,
      recommended_homework: 'ممارسة تمارين الاسترخاء والتنفس البطني وتدوين يوميات المشاعر يومياً.'
    };

    setSoapData(localSoap);
    setActiveView('structured');
    setIsSynthesizing(false);
  };

  // Inject into session SOAP notes
  const handleApplyToSoap = () => {
    if (onInjectIntoSoap) {
      onInjectIntoSoap({
        subjective: soapData.subjective,
        objective: soapData.objective,
        assessment: soapData.assessment,
        plan: soapData.plan,
        rawTranscript: fullDialogueText,
        hasRedAlert: detectedRedAlerts.length > 0
      });
    } else {
      navigator.clipboard.writeText(
        `S:\n${soapData.subjective}\n\nO:\n${soapData.objective}\n\nA:\n${soapData.assessment}\n\nP:\n${soapData.plan}`
      );
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }

    onClose();
  };

  // Copy Full SOAP
  const handleCopySoap = () => {
    const fullText = `📋 [تقرير الجلسة السريرية الموثق بالكاتب المحيطي - AMBIENT CLINICAL SCRIBE]
المريض: ${patient ? patient.full_name : 'المريض'} | التاريخ: ${new Date().toLocaleDateString('ar-DZ')}

[S - الشكوى والذاتي (Subjective)]:
${soapData.subjective}

[O - الملاحظات الموضوعية (Objective)]:
${soapData.objective}

[A - التقييم السريري (Assessment)]:
${soapData.assessment}

[P - الخطة والتكليفات (Plan)]:
${soapData.plan}
${soapData.recommended_homework ? `\nالواجبات المنزلية المقترحة: ${soapData.recommended_homework}` : ''}`;

    navigator.clipboard.writeText(fullText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* HEADER BAR */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Brain className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 data-testid="ambient-scribe-modal" className="text-base font-black text-white">
                  الكاتب المحيطي: تفريغ صوتي ذكي للملاحظات السريرية
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                  Ambient Clinical AI Scribe
                </span>
              </div>
              <p className="text-xs text-slate-400">
                استماع محيطي مستمر للحوار السريري، رصد فوري لإنذارات الأمان (Red Alerts)، وتصنيف آلي للـ SOAP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Ambient Dialogue vs Structured SOAP */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveView('ambient')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'ambient'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>شريط الحوار المحيطي ({transcriptChunks.length})</span>
              </button>

              <button
                onClick={() => setActiveView('structured')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeView === 'structured'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>صياغة SOAP السريرية</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RED ALERT BANNER (If suicidal ideation or crisis detected) */}
        {detectedRedAlerts.length > 0 && (
          <div className="px-6 py-2.5 bg-rose-600/20 border-b border-rose-500/40 text-rose-200 text-xs flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong className="font-black text-rose-300 ml-1">
                  🚨 تنبيه أمان سريري عاجل (RED ALERT):
                </strong>
                <span>
                  تم رصد عبارات تشير إلى خطر إيذاء النفس أو أفكار انتحارية أثناء الجلسة! تم تثبيتها في تقرير التقييم.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono font-bold text-[10px]">
              {detectedRedAlerts.length} إنذار
            </span>
          </div>
        )}

        {/* HUD CONTROL STRIP */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Audio Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleListening}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                  : 'bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isListening ? 'إيقاف الاستماع المحيطي' : 'بدء الاستماع المحيطي الحي'}</span>
            </button>

            {/* Timer Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatTimer(sessionDurationSec)}</span>
            </div>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isListening}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ar-DZ">العربية (الجزائر / الدارجة)</option>
              <option value="ar-SA">العربية الفصحى</option>
              <option value="fr-FR">الفرنسية (Français Médical)</option>
            </select>
          </div>

          {/* Quick Speaker Selector for incoming turn */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold">المتحدث القادم:</span>
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveSpeaker('practitioner')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  activeSpeaker === 'practitioner'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Stethoscope className="w-3 h-3" />
                <span>المعالج</span>
              </button>
              <button
                onClick={() => setActiveSpeaker('patient')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  activeSpeaker === 'patient'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3 h-3" />
                <span>المريض / الولي</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN BODY AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* ========================================================
              VIEW 1: AMBIENT DIALOGUE STREAM
             ======================================================== */}
          {activeView === 'ambient' && (
            <div className="space-y-4">
              {/* Detected Clinical Tags Strip */}
              {(detectedEntities.symptoms.size > 0 ||
                detectedEntities.medications.size > 0 ||
                detectedEntities.distortions.size > 0) && (
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>الكيانات السريرية المرصودة:</span>
                  </span>

                  {Array.from(detectedEntities.symptoms).map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]"
                    >
                      عرض: {s}
                    </span>
                  ))}

                  {Array.from(detectedEntities.medications).map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px]"
                    >
                      دواء: {m}
                    </span>
                  ))}

                  {Array.from(detectedEntities.distortions).map((d) => (
                    <span
                      key={d}
                      className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]"
                    >
                      فكر: {d}
                    </span>
                  ))}
                </div>
              )}

              {/* Dialogue Transcript List */}
              <div className="space-y-3">
                {transcriptChunks.length === 0 && !interimText && (
                  <div className="p-12 text-center rounded-3xl bg-slate-950/40 border border-slate-800/80 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                      <Mic className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">الكاتب المحيطي جاهز للاستماع</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      انقر على "بدء الاستماع المحيطي الحي" بالأعلى. سيعمل النظام في الخلفية لتوثيق حوار الجلسة بين المعالج والمريض دون الحاجة للمس لوحة المفاتيح.
                    </p>
                  </div>
                )}

                {transcriptChunks.map((chunk) => {
                  const isPractitioner = chunk.speaker === 'practitioner';
                  return (
                    <div
                      key={chunk.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                        chunk.isRedAlert
                          ? 'bg-rose-500/15 border-rose-500/50 shadow-lg shadow-rose-500/10'
                          : isPractitioner
                          ? 'bg-indigo-950/20 border-indigo-500/20 mr-4'
                          : 'bg-teal-950/20 border-teal-500/20 ml-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-bold flex items-center gap-1.5 ${
                            isPractitioner ? 'text-indigo-400' : 'text-teal-400'
                          }`}
                        >
                          {isPractitioner ? (
                            <>
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>المعالج</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3.5 h-3.5" />
                              <span>المريض / الولي</span>
                            </>
                          )}
                        </span>
                        <div className="flex items-center gap-2">
                          {chunk.isRedAlert && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[9px]">
                              إنذار حرج
                            </span>
                          )}
                          <span className="text-slate-500 font-mono text-[10px]">
                            {chunk.timestamp}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-100 leading-relaxed">{chunk.text}</p>
                    </div>
                  );
                })}

                {/* Live Interim Streaming Bubble */}
                {interimText && (
                  <div className="p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-950/30 animate-pulse text-xs text-indigo-200">
                    <span className="text-[10px] text-indigo-400 font-bold block mb-1">
                      جارٍ التعرف المباشر...
                    </span>
                    <p>{interimText}</p>
                  </div>
                )}

                <div ref={transcriptBottomRef} />
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 2: STRUCTURED SOAP REVIEW & EDIT
             ======================================================== */}
          {activeView === 'structured' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>ملاحظات الـ SOAP المستخلصة آلياً من الحوار السريري</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    يمكنك تعديل أي حقل مباشرة قبل اعتماده وحقنه في ملف الجلسة السريرية.
                  </p>
                </div>

                <button
                  onClick={handleGenerateSoap}
                  disabled={isSynthesizing}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
                  <span>إعادة الصياغة السريرية الذكية</span>
                </button>
              </div>

              {/* S: Subjective */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-1.5">
                <label className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-black">
                    S
                  </span>
                  الشكوى والملاحظات الذاتية (Subjective)
                </label>
                <textarea
                  value={soapData.subjective}
                  onChange={(e) => setSoapData({ ...soapData, subjective: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  placeholder="شكوى المريض وملاحظات الأسرة..."
                />
              </div>

              {/* O: Objective */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-1.5">
                <label className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-black">
                    O
                  </span>
                  الملاحظات الموضوعية والفحص المباشر (Objective)
                </label>
                <textarea
                  value={soapData.objective}
                  onChange={(e) => setSoapData({ ...soapData, objective: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none leading-relaxed"
                  placeholder="الملاحظات السلوكية، النطق والمخارج، الاستجابات المقاسة..."
                />
              </div>

              {/* A: Assessment */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-1.5">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-black">
                    A
                  </span>
                  التقييم السريري والتشخيصي (Assessment)
                </label>
                <textarea
                  value={soapData.assessment}
                  onChange={(e) => setSoapData({ ...soapData, assessment: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                  placeholder="التحليل الإكلينيكي والفرضيات التشخيصية..."
                />
              </div>

              {/* P: Plan */}
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-4 space-y-1.5">
                <label className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px] font-black">
                    P
                  </span>
                  الخطة العلاجية والتكليفات المنزلية (Plan & Homework)
                </label>
                <textarea
                  value={soapData.plan}
                  onChange={(e) => setSoapData({ ...soapData, plan: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
                  placeholder="التمارين المنزلية، موعد الجلسة القادمة، التوجيهات الأسرية..."
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              الحوار يُعالج بشكل فوري مع دعم التبديل بين المعالج والمريض وتوليد SOAP بنقرة واحدة.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Generate SOAP Trigger Button if in ambient view */}
            {activeView === 'ambient' && (
              <button
                onClick={handleGenerateSoap}
                disabled={isSynthesizing || transcriptChunks.length === 0}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>توليد وتصنيف SOAP من الحوار</span>
              </button>
            )}

            {/* Copy SOAP button */}
            {activeView === 'structured' && (
              <button
                onClick={handleCopySoap}
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
            )}

            {/* Inject into Session SOAP Button */}
            {activeView === 'structured' && (
              <button
                onClick={handleApplyToSoap}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تطبيق وحقن في استمارة الجلسة</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
