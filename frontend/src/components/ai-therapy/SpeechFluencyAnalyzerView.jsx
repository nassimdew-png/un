import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Mic,
  MicOff,
  Upload,
  Sparkles,
  FileText,
  Clock,
  Printer,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Square,
  BarChart2,
  Layers,
  Award,
  BookOpen,
  Volume2,
  Stethoscope,
  Heart,
  Eye,
  Check
} from 'lucide-react';
import { speechFluencyApi } from '../../api';
import ClinicalReportPrintLetterhead from './ClinicalReportPrintLetterhead';

export default function SpeechFluencyAnalyzerView({ selectedPatient, onSaveToPatient }) {
  const [activeInputMode, setActiveInputMode] = useState('live'); // 'live' | 'upload'
  const [speechTask, setSpeechTask] = useState('spontaneous_dialogue'); // 'spontaneous_dialogue' | 'reading_passage' | 'picture_naming'
  const [language, setLanguage] = useState('ar-DZ');

  // Live Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioStream, setAudioStream] = useState(null);
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Assessment Results
  const [result, setResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // History List
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const sampleReadingTexts = {
    'ar-DZ': 'في نهار مشمس، خرج أنيس مع باباه للحديقة العامة باش يلعب بالأرجوحة ويتفرج على الحيوانات والطيور الجميلة.',
    'ar-SA': 'في يوم من الأيام، قرر الأرنب والسلحفاة أن يخوضا سباقاً في الغابة، فانطلق الأرنب سريعاً بينما تابعت السلحفاة سيرها بصبر وهدوء.',
    'fr-FR': 'Le petit garçon marche tranquillement vers son école. Il rencontre son ami près du grand parc fleuri et ils parlent joyeusement.',
  };

  // Timer Effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await speechFluencyApi.getAssessments(selectedPatient?.id);
      if (res.success) {
        setHistoryList(res.assessments || []);
      }
    } catch (err) {
      console.warn('Failed to load fluency history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedPatient]);

  // Start Live Recording
  const startRecording = async () => {
    setError(null);
    setRecordingTime(0);
    audioChunksRef.current = [];

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
      console.error('Microphone error:', err);
      setError('تعذر تشغيل الميكروفون. يرجى التحقق من الصلاحيات.');
    }
  };

  // Stop Recording & Trigger Analysis
  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
      setAudioStream(null);
    }

    setTimeout(() => {
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        submitAudioPayload(audioBlob, 'live_speech.webm');
      }
    }, 500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    submitAudioPayload(file, file.name);
  };

  const submitAudioPayload = async (audioPayload, filename) => {
    setIsAnalyzing(true);
    setError(null);
    setSavedSuccess(false);

    const formData = new FormData();
    formData.append('audio', audioPayload, filename);
    formData.append('language', language);
    formData.append('speech_task', speechTask);
    if (selectedPatient?.id) formData.append('patient_id', selectedPatient.id);

    try {
      const res = await speechFluencyApi.analyzeFluency(formData);
      if (res.data?.assessment) {
        setResult(res.data);
        loadHistory();
      } else {
        throw new Error(res.message || 'فشل تحليل المقطع الصوتي.');
      }
    } catch (err) {
      console.error('Fluency analysis error:', err);
      setError(err.message || 'تعذر إتمام التحليل الأرطوفوني.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToPatient = () => {
    if (!result || !selectedPatient) return;
    if (onSaveToPatient) {
      onSaveToPatient(result);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Helper Severity Badge
  const getSeverityBadge = (level) => {
    switch (level) {
      case 'mild':
        return { label: 'تأتأة خفيفة (Mild)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'moderate':
        return { label: 'تأتأة متوسطة (Moderate)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'severe':
        return { label: 'تأتأة شديدة (Severe)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'very_severe':
        return { label: 'تأتأة شديدة جداً (Very Severe)', color: 'bg-red-600/30 text-red-300 border-red-500/50' };
      default:
        return { label: 'تأتأة متوسطة', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    }
  };

  const assessment = result?.assessment;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans text-right" dir="rtl">
      
      {/* 1. LEFT: Audio Recording & Task Configuration (5 cols) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl print:hidden">
        
        {/* Header Title */}
        <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-teal-500/20 text-lg">
            🗣️
          </div>
          <div>
            <h3 className="text-sm font-black text-white">محلل طلاقة النطق والتأتأة السريري</h3>
            <p className="text-xs text-slate-400">حساب نسبة العثرات %SS، الحبسات، والسرعة الكلامية</p>
          </div>
        </div>

        {/* Selected Patient Demographics */}
        {selectedPatient && (
          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-teal-200 font-bold">الحالة: {selectedPatient.first_name} {selectedPatient.last_name}</span>
            </div>
            <span className="text-[10px] text-teal-300 font-mono">العمر: {selectedPatient.age || 6} سنوات</span>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveInputMode('live')}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 space-x-reverse ${
              activeInputMode === 'live'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>تسجيل مباشر للطفل</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInputMode('upload')}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 space-x-reverse ${
              activeInputMode === 'upload'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>رفع مقطع صوتي</span>
          </button>
        </div>

        {/* Speech Task & Language Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">المهمة السريرية المستهدفة:</label>
            <select
              value={speechTask}
              onChange={(e) => setSpeechTask(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500"
            >
              <option value="spontaneous_dialogue">💬 حوار عفوي وتعبير حر</option>
              <option value="reading_passage">📖 قراءة نص معياري</option>
              <option value="picture_naming">🖼️ تسمية صور وتعبير موجه</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">لغة / لهجة النطق:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-teal-500"
            >
              <option value="ar-DZ">🇩🇿 دارجة جزائرية</option>
              <option value="ar-SA">🇸🇦 لغة عربية فصحى</option>
              <option value="fr-FR">🇫🇷 Français Médical</option>
            </select>
          </div>
        </div>

        {/* Task Stimulus Sample Card */}
        {speechTask === 'reading_passage' && (
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="text-[11px] font-bold text-teal-400 flex items-center space-x-1.5 space-x-reverse">
              <BookOpen className="w-3.5 h-3.5" />
              <span>النص المعياري المقترح للقراءة:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-serif">
              "{sampleReadingTexts[language] || sampleReadingTexts['ar-DZ']}"
            </p>
          </div>
        )}

        {/* Mode 1: Live Recorder */}
        {activeInputMode === 'live' && (
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-5 shadow-inner">
            <div className="space-y-1">
              <div className="text-2xl font-black font-mono tracking-wider text-white">
                {formatTime(recordingTime)}
              </div>
              <p className="text-[11px] text-slate-400">
                {isRecording ? 'جارٍ تسجيل عينة النطق السريرية..' : 'اضغط على زر الميكروفون لبدء التسجيل'}
              </p>
            </div>

            {/* Audio Visualizer */}
            {isRecording && (
              <div className="flex items-center justify-center space-x-1 space-x-reverse h-8">
                {[45, 80, 60, 100, 75, 90, 50, 85, 65, 95, 40, 70].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1.5 bg-gradient-to-t from-teal-500 to-indigo-500 rounded-full animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Trigger Button */}
            <div className="flex items-center justify-center">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isAnalyzing}
                  className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-teal-500/25 transition disabled:opacity-50"
                >
                  <Mic className="w-9 h-9" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition animate-pulse"
                >
                  <Square className="w-8 h-8 fill-current" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mode 2: File Upload */}
        {activeInputMode === 'upload' && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-slate-800 hover:border-teal-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/60 group">
              <Upload className="w-10 h-10 text-slate-500 group-hover:text-teal-400 transition mb-3" />
              <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                {selectedFile ? selectedFile.name : 'انقر لرفع تسجيل عينة نطق المريض'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 font-mono">
                يدعم صيغ MP3, WAV, M4A, WebM (بحد أقصى 30MB)
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

        {isAnalyzing && (
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center space-x-3 space-x-reverse animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
            <div className="space-y-0.5">
              <div className="font-bold">جارٍ الفحص الفونيتيكي وتحليل العثرات...</div>
              <div className="text-[10px] text-teal-400">حساب %SS، أزمنة الحبسات، وسرعة النطق عبر Gemini 3.6</div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

      </div>

      {/* 2. RIGHT: Clinical Diagnostic Report & KPI Canvas (7 cols) */}
      <div 
        id="printable-report-area"
        className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl min-h-[520px] flex flex-col justify-between print:col-span-12 print:bg-white print:border-none print:shadow-none print:p-0"
      >
        <div className="space-y-6">
          
          {/* Printable Letterhead */}
          <ClinicalReportPrintLetterhead
            selectedPatient={selectedPatient}
            reportTitle="تقرير فحص طلاقة النطق والتأتأة (Speech Fluency Assessment)"
            specialty="الأرطوفونيا، علم الصوتيات العيادي واضطرابات طلاقة الكلام"
          />

          {assessment ? (
            <div className="space-y-6">
              
              {/* 1. KPI Summary Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Metric 1: %SS */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 font-bold block">نسبة التأتأة (%SS)</span>
                  <div className="text-2xl font-black text-rose-400 font-mono">
                    {assessment.stuttered_syllables_percentage}%
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-block ${getSeverityBadge(assessment.severity_level).color}`}>
                    {getSeverityBadge(assessment.severity_level).label}
                  </span>
                </div>

                {/* Metric 2: Speech Rate */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 font-bold block">سرعة النطق (WPM)</span>
                  <div className="text-2xl font-black text-teal-400 font-mono">
                    {assessment.speech_rate_wpm}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">كلمة / دقيقة</span>
                </div>

                {/* Metric 3: Blocks Count & Avg */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 font-bold block">الحبسات (Blocks)</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {assessment.block_count || 0}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    متوسط: {assessment.avg_block_duration_sec || 0}s
                  </span>
                </div>

                {/* Metric 4: Repetitions & Prolongations */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 font-bold block">تكرارات / إطالات</span>
                  <div className="text-xl font-black text-indigo-400 font-mono pt-1">
                    {assessment.repetition_count || 0} <span className="text-xs text-slate-500">تكرار</span> • {assessment.prolongation_count || 0} <span className="text-xs text-slate-500">مد</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{assessment.total_words || 0} كلمة مفحوصة</span>
                </div>

              </div>

              {/* 2. Highlighted Transcript with Disfluency Badges */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 print:border-slate-300 print:bg-slate-50">
                <span className="text-xs font-bold text-slate-300 print:text-slate-900 block">
                  النص المفحوص مع رصد مواضع العثرات:
                </span>
                <p className="text-xs text-slate-200 print:text-slate-800 leading-relaxed font-sans">
                  {assessment.transcript}
                </p>
              </div>

              {/* 3. Disfluency Breakdown Events */}
              {assessment.disfluency_events?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300">تفاصيل العثرات والحبسات المرصودة ({assessment.disfluency_events.length}):</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {assessment.disfluency_events.map((ev, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 print:border-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">الكلمة: "{ev.word}"</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.type === 'block' ? 'bg-rose-500/20 text-rose-300' :
                            ev.type === 'repetition' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-indigo-500/20 text-indigo-300'
                          }`}>
                            {ev.type === 'block' ? 'حبسة صوتية' : ev.type === 'repetition' ? 'تكرار مقطعي' : 'إطالة'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>التوقيت: {ev.timestamp_sec}s</span>
                          <span>المدة: {ev.duration_sec}s</span>
                        </div>
                        {ev.secondary_behaviors && (
                          <div className="text-[10px] text-slate-400">
                            مظاهر مصاحبة: {ev.secondary_behaviors}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Actionable Clinical Therapy Plan */}
              {assessment.targeted_therapy_techniques?.length > 0 && (
                <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 space-y-2 print:bg-slate-50 print:border-slate-300">
                  <h4 className="text-xs font-bold text-teal-300 print:text-teal-800 flex items-center space-x-1.5 space-x-reverse">
                    <Stethoscope className="w-4 h-4" />
                    <span>التقنيات والأهداف الأرطوفونية المقترحة:</span>
                  </h4>
                  <div className="space-y-2">
                    {assessment.targeted_therapy_techniques.map((tech, i) => (
                      <div key={i} className="text-xs space-y-0.5">
                        <span className="font-bold text-white print:text-slate-900">• {tech.name}: </span>
                        <span className="text-slate-300 print:text-slate-700">{tech.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Parent Home Guidelines */}
              {assessment.home_guidelines_for_parents?.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 print:border-slate-300">
                  <span className="text-xs font-bold text-slate-300 print:text-slate-900 block">
                    إرشادات للأسرة في المنزل:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300 print:text-slate-700 list-disc list-inside">
                    {assessment.home_guidelines_for_parents.map((g, idx) => (
                      <li key={idx} className="leading-relaxed">{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>طباعة تقرير الفحص الأرطوفوني</span>
                </button>

                {selectedPatient && (
                  <button
                    type="button"
                    onClick={handleSaveToPatient}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse shadow-md"
                  >
                    {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>{savedSuccess ? 'تم الحفظ في ملف المريض' : 'حفظ في سجل المريض الأرطوفوني'}</span>
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 border-2 border-dashed border-slate-800 rounded-3xl p-6">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 text-xl">
                🗣️
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">فضاء الفحص الأرطوفوني فارغ حالياً</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  سجل عينة كلامية للطفل أو ارفع تسجيلاً للجلسة لحساب نسبة التأتأة %SS، عدد الحبسات، وتوليد خطة العلاج الأرطوفوني.
                </p>
              </div>
            </div>
          )}

          {/* Past Assessments History */}
          {historyList.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-slate-800/80 print:hidden">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-2 space-x-reverse">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>الفحوصات السابقة لطلاقة النطق ({historyList.length}):</span>
                </h4>
                <button
                  type="button"
                  onClick={loadHistory}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {historyList.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => setResult({ assessment: h.detailed_disfluencies_json || {} })}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500 cursor-pointer transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">%SS: {h.stuttered_syllables_percentage}%</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getSeverityBadge(h.severity_level).color}`}>
                        {getSeverityBadge(h.severity_level).label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>السرعة: {h.speech_rate_wpm} WPM</span>
                      <span>{h.created_at ? new Date(h.created_at).toLocaleDateString('ar-DZ') : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
