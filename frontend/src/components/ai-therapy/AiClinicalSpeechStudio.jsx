import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  Sparkles,
  FileText,
  Copy,
  Printer,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Play,
  Square,
  Users,
  Brain,
  Stethoscope,
  Activity,
  Check,
  Zap,
  Volume2
} from 'lucide-react';
import { clinicalSpeechStudioApi } from '../../api';
import ClinicalReportPrintLetterhead from './ClinicalReportPrintLetterhead';

export default function AiClinicalSpeechStudio({ selectedPatient, onSaveToPatient }) {
  const [activeMode, setActiveMode] = useState('live'); // 'live' | 'upload'
  
  // Live Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioStream, setAudioStream] = useState(null);
  const [language, setLanguage] = useState('ar-DZ'); // 'ar-DZ' | 'ar-SA' | 'fr-FR'
  
  // Audio File Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Results & Transcript
  const [transcript, setTranscript] = useState('');
  const [speakerData, setSpeakerData] = useState([]);
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [keyFindings, setKeyFindings] = useState([]);
  
  // SOAP Conversion
  const [soapData, setSoapData] = useState(null);
  const [isConvertingSoap, setIsConvertingSoap] = useState(false);
  
  const [error, setError] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Start Live Dictation
  const startLiveRecording = async () => {
    setError(null);
    setRecordingTime(0);
    audioChunksRef.current = [];

    // 1. Initialize Web Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript.trim());
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition warning:', e.error);
      };

      recognition.onend = () => {
        if (isRecording) {
          try { recognition.start(); } catch (err) {}
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }

    // 2. Initialize MediaRecorder for Deep Audio Capture
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      setError('تعذر الوصول إلى الميكروفون. يرجى التحقق من صلاحيات المتصفح.');
      setIsRecording(false);
    }
  };

  // Stop Live Recording & Trigger Gemini Multimodal Enhancement
  const stopLiveRecording = async () => {
    setIsRecording(false);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }

    // If we have recorded audio chunks and transcript is short, send to Gemini
    setTimeout(async () => {
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 5000) {
          handleTranscribeBlob(audioBlob);
        }
      }
    }, 500);
  };

  // Transcribe Blob via Gemini Multimodal Audio
  const handleTranscribeBlob = async (blob) => {
    setIsTranscribing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      if (selectedPatient?.id) formData.append('patient_id', selectedPatient.id);

      const res = await clinicalSpeechStudioApi.transcribeFile(formData);
      if (res.data) {
        setTranscript(res.data.transcript || transcript);
        setSpeakerData(res.data.speakers || []);
        setClinicalSummary(res.data.summary || '');
        setKeyFindings(res.data.key_clinical_findings || []);
      }
    } catch (err) {
      console.warn('Audio cloud transcribe error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  // File Upload Transcription
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsTranscribing(true);
    setError(null);
    setSoapData(null);

    const formData = new FormData();
    formData.append('audio', file);
    if (selectedPatient?.id) formData.append('patient_id', selectedPatient.id);

    try {
      const res = await clinicalSpeechStudioApi.transcribeFile(formData);
      if (res.data) {
        setTranscript(res.data.transcript || '');
        setSpeakerData(res.data.speakers || []);
        setClinicalSummary(res.data.summary || '');
        setKeyFindings(res.data.key_clinical_findings || []);
      } else {
        throw new Error(res.message || 'فشل تفريغ الملف الصوتي.');
      }
    } catch (err) {
      console.error('File transcribe error:', err);
      setError(err.message || 'تعذر تفريغ المقطع الصوتي.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Convert Transcript to SOAP Note
  const handleConvertToSoap = async () => {
    if (!transcript.trim()) {
      setError('يرجى تسجيل أو تفريغ نص الجلسة أولاً.');
      return;
    }

    setIsConvertingSoap(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await clinicalSpeechStudioApi.convertToSoap({
        transcript: transcript.trim(),
        patient_id: selectedPatient?.id || null,
        specialty: 'أرطوفونيا وعلم النفس العيادي',
      });

      if (res.data?.soap) {
        setSoapData(res.data.soap);
      } else {
        throw new Error(res.message || 'فشل إنشاء تقرير SOAP.');
      }
    } catch (err) {
      console.error('SOAP conversion error:', err);
      setError(err.message || 'تعذر صياغة تقرير SOAP.');
    } finally {
      setIsConvertingSoap(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToPatientRecord = () => {
    if (!soapData || !selectedPatient) return;
    if (onSaveToPatient) {
      onSaveToPatient(soapData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans text-right" dir="rtl">
      
      {/* 1. LEFT: Audio Recording & Upload Controls (5 cols) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl print:hidden">
        
        {/* Header Title */}
        <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white font-black shadow-lg shadow-amber-500/20 text-lg">
            🎙️
          </div>
          <div>
            <h3 className="text-sm font-black text-white">المساعد الصوتي والتفريغ السريري</h3>
            <p className="text-xs text-slate-400">إملاء صوتي مباشر وتفريغ جلسات عبر Google Gemini 3.6</p>
          </div>
        </div>

        {/* Selected Patient Demographics */}
        {selectedPatient && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-200 font-bold">الحالة: {selectedPatient.first_name} {selectedPatient.last_name}</span>
            </div>
            <span className="text-[10px] text-amber-300 font-mono">العمر: {selectedPatient.age || 6} سنوات</span>
          </div>
        )}

        {/* Mode Switcher Pills */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode('live')}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 space-x-reverse ${
              activeMode === 'live'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>إملاء صوتي حي</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 space-x-reverse ${
              activeMode === 'upload'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>رفع ملف تسجيل</span>
          </button>
        </div>

        {/* Language Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">لهجة / لغة الحديث:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isRecording}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ar-DZ">🇩🇿 دارجة جزائرية وعربية (Algerian Arabic)</option>
            <option value="ar-SA">🇸🇦 لغة عربية فصحى طبية (Standard Arabic)</option>
            <option value="fr-FR">🇫🇷 Français Médical (Clinical French)</option>
          </select>
        </div>

        {/* Mode 1: Live Recording Card */}
        {activeMode === 'live' && (
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-5 shadow-inner">
            <div className="space-y-1">
              <div className="text-2xl font-black font-mono tracking-wider text-white">
                {formatTime(recordingTime)}
              </div>
              <p className="text-[11px] text-slate-400">
                {isRecording ? 'الميكروفون نشط.. تحدث بحرية لتفريغ الملاحظات' : 'اضغط على زر التسجيل لبدء الإملاء السريري'}
              </p>
            </div>

            {/* Live Audio Visualizer Animation */}
            {isRecording && (
              <div className="flex items-center justify-center space-x-1 space-x-reverse h-8">
                {[40, 70, 90, 60, 100, 50, 80, 65, 95, 45, 75, 85].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1.5 bg-gradient-to-t from-amber-600 to-rose-500 rounded-full animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Record Action Button */}
            <div className="flex items-center justify-center">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startLiveRecording}
                  className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-amber-500/25 transition"
                >
                  <Mic className="w-9 h-9" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopLiveRecording}
                  className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition animate-pulse"
                >
                  <Square className="w-8 h-8 fill-current" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mode 2: File Upload Dropzone */}
        {activeMode === 'upload' && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-slate-800 hover:border-amber-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/60 group">
              <Upload className="w-10 h-10 text-slate-500 group-hover:text-amber-400 transition mb-3" />
              <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                {selectedFile ? selectedFile.name : 'انقر لرفع ملف التسجيل الصوتي للجلسة'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 font-mono">
                يدعم صيغ MP3, M4A, WAV, WebM (بحد أقصى 30MB)
              </span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Convert to SOAP Action Button */}
        <button
          type="button"
          onClick={handleConvertToSoap}
          disabled={isConvertingSoap || !transcript.trim()}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:opacity-90 text-white font-black text-xs transition flex items-center justify-center space-x-2 space-x-reverse shadow-lg shadow-amber-600/25 disabled:opacity-50"
        >
          {isConvertingSoap ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>جارٍ معالجة وصياغة تقرير SOAP السريري...</span>
            </>
          ) : (
            <>
              <Stethoscope className="w-4 h-4" />
              <span>🩺 تحويل فوري إلى تقرير SOAP طبي معتمد</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

      </div>

      {/* 2. RIGHT: Transcript Canvas & Structured SOAP Report (7 cols) */}
      <div 
        id="printable-report-area"
        className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl min-h-[520px] flex flex-col justify-between print:col-span-12 print:bg-white print:border-none print:shadow-none print:p-0"
      >
        <div className="space-y-6">
          
          {/* Printable Letterhead Header */}
          <ClinicalReportPrintLetterhead
            selectedPatient={selectedPatient}
            reportTitle={soapData?.clinical_title || 'تفريغ وتقرير جلسة سريرية (SOAP Note)'}
            specialty="التقييم النفسي، الأرطوفونيا والتوثيق الإكلينيكي"
          />

          {/* Transcript Textbox */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>النص المفرغ من الجلسة (Transcript):</span>
              </label>

              {transcript && (
                <div className="flex items-center space-x-2 space-x-reverse print:hidden">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
                  </button>
                </div>
              )}
            </div>

            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="سيظهر النص المفرغ تلقائياً أثناء التسجيل أو بعد رفع الملف الصوتي..."
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed font-sans resize-none"
            />
          </div>

          {/* Structured Clinical Findings / Speakers */}
          {speakerData.length > 0 && (
            <div className="space-y-2 print:hidden">
              <h4 className="text-xs font-bold text-slate-300">حوار الجلسة وتمييز المتحدثين (Diarization):</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {speakerData.map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start space-x-2 space-x-reverse">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0">
                      {s.speaker}
                    </span>
                    <span className="text-slate-300 leading-relaxed">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Findings Badges */}
          {keyFindings.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 print:hidden">
              <span className="text-[11px] font-bold text-slate-400 block">الملاحظات السريرية الجوهرية المستخلصة:</span>
              <div className="flex flex-wrap gap-1.5">
                {keyFindings.map((f, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Render Structured SOAP Note */}
          {soapData ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                  <span>التقرير الطبي المهيكل (SOAP Clinical Note)</span>
                </h4>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Google Gemini 3.6 Verified
                </span>
              </div>

              {/* SOAP 4 Sections Grid */}
              <div className="grid grid-cols-1 gap-3.5 text-xs">
                
                {/* S - Subjective */}
                <div className="p-4 rounded-2xl bg-slate-950 border-r-4 border-r-blue-500 border border-slate-800 space-y-1 print:bg-slate-50 print:text-slate-900">
                  <span className="font-black text-blue-400 print:text-blue-700 block">S - الشكوى الذاتية وأقوال المريض/الولي (Subjective):</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">{soapData.subjective}</p>
                </div>

                {/* O - Objective */}
                <div className="p-4 rounded-2xl bg-slate-950 border-r-4 border-r-teal-500 border border-slate-800 space-y-1 print:bg-slate-50 print:text-slate-900">
                  <span className="font-black text-teal-400 print:text-teal-700 block">O - الملاحظات الموضوعية والنتائج العيادية (Objective):</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">{soapData.objective}</p>
                </div>

                {/* A - Assessment */}
                <div className="p-4 rounded-2xl bg-slate-950 border-r-4 border-r-purple-500 border border-slate-800 space-y-1 print:bg-slate-50 print:text-slate-900">
                  <span className="font-black text-purple-400 print:text-purple-700 block">A - التقييم والتشخيص السريري (Assessment):</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">{soapData.assessment}</p>
                </div>

                {/* P - Plan */}
                <div className="p-4 rounded-2xl bg-slate-950 border-r-4 border-r-emerald-500 border border-slate-800 space-y-1 print:bg-slate-50 print:text-slate-900">
                  <span className="font-black text-emerald-400 print:text-emerald-700 block">P - الخطة العلاجية والتوصيات (Plan):</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">{soapData.plan}</p>
                </div>

              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>طباعة تقرير SOAP</span>
                </button>

                {selectedPatient && (
                  <button
                    type="button"
                    onClick={handleSaveToPatientRecord}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse shadow-md"
                  >
                    {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>{savedSuccess ? 'تم الحفظ في ملف المريض' : 'حفظ في سجل جلسات المريض'}</span>
                  </button>
                )}
              </div>

            </div>
          ) : !transcript ? (
            <div className="h-60 flex flex-col items-center justify-center text-center space-y-3 border-2 border-dashed border-slate-800 rounded-3xl p-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 text-xl">
                🎙️
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">فضاء التفريغ السريري فارغ حالياً</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  سجل صوتك مباشرة أو ارفع ملف صوتي للجلسة ليقوم Gemini 3.6 بتفريغه حرفياً وتحويله لتقرير SOAP مهيكل.
                </p>
              </div>
            </div>
          ) : null}

        </div>
      </div>

    </div>
  );
}
