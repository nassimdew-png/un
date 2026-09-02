import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mic,
  Square,
  Sparkles,
  X,
  Play,
  Pause,
  RotateCcw,
  Check,
  Send,
  Printer,
  FileText,
  Clock,
  AlertCircle,
  RefreshCw,
  Edit3,
  CheckCircle2,
  Brain,
  Layers,
  Activity
} from 'lucide-react';
import { voiceSoapApi, rehabPlanApi } from '../../api';

export default function VoiceScribeRecorderModal({
  isOpen,
  onClose,
  patient = null,
  appointment = null,
  onSaved = null,
}) {
  const { t } = useTranslation();
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [textDictation, setTextDictation] = useState('');
  const [activeMode, setActiveMode] = useState('voice'); // voice, text
  const [language, setLanguage] = useState('fr'); // fr, ar

  // Processing & SOAP State
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dispatchingHomework, setDispatchingHomework] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [soapData, setSoapData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    recommended_homework: '',
    raw_transcript: '',
  });

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      setFeedback(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setFeedback({
        type: 'error',
        text: 'تعذر الوصول إلى الميكروفون. يرجى التحقق من صلاحيات المتصفح أو استخدام خيار الكتابة/الإملاء المباشر.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const resetRecording = () => {
    setIsRecording(false);
    setRecordingDuration(0);
    setAudioBlob(null);
    setAudioUrl(null);
  };

  const handleProcessSoap = async () => {
    setProcessing(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      if (patient?.id) formData.append('patient_id', patient.id);
      if (appointment?.id) formData.append('appointment_id', appointment.id);
      formData.append('language', language);

      if (activeMode === 'voice' && audioBlob) {
        formData.append('audio', audioBlob, 'scribe_session.webm');
        formData.append('duration', recordingDuration);
      } else {
        formData.append('transcript', textDictation);
      }

      const res = await voiceSoapApi.processVoiceSoap(formData);
      if (res.success && res.data) {
        setSoapData({
          subjective: res.data.subjective || '',
          objective: res.data.objective || '',
          assessment: res.data.assessment || '',
          plan: res.data.plan || '',
          recommended_homework: res.data.recommended_homework || '',
          raw_transcript: res.data.raw_transcript || '',
        });
        setFeedback({ type: 'success', text: 'تم تفريغ الصوت وصياغة تقرير SOAP السريري بنجاح!' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل معالجة الصوت وصياغة التقرير.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveSoap = async () => {
    if (!patient?.id) {
      setFeedback({ type: 'error', text: 'يرجى تحديد ملف المريض لحفظ التقرير.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await voiceSoapApi.saveSoapNote({
        patient_id: patient.id,
        appointment_id: appointment?.id,
        session_date: new Date().toISOString().split('T')[0],
        audio_duration_seconds: recordingDuration,
        raw_transcript: soapData.raw_transcript,
        subjective: soapData.subjective,
        objective: soapData.objective,
        assessment: soapData.assessment,
        plan: soapData.plan,
      });

      if (res.success) {
        setFeedback({ type: 'success', text: 'تم حفظ تقرير SOAP في السجل السريري للمريض بنجاح! 💾' });
        if (onSaved) onSaved(res.note);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ تقرير SOAP.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDispatchPlanToPortal = async () => {
    if (!patient?.id || !soapData.plan) return;

    setDispatchingHomework(true);
    try {
      const instructions = soapData.recommended_homework || soapData.plan;
      const res = await rehabPlanApi.dispatchToPortal({
        patient_id: patient.id,
        exercise_title: `تمرين منزلي - جلسة ${new Date().toLocaleDateString('fr-FR')}`,
        instructions: instructions,
        category: 'soap_homework',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });

      if (res.success) {
        setFeedback({ type: 'success', text: 'تم إرسال تمرين الخطة العلاجية بنجاح إلى بوابة الولي! 📲' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل إرسال الواجب للبوابة.' });
    } finally {
      setDispatchingHomework(false);
    }
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">
              🎙️
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2 space-x-reverse">
                <span>المساعد الصوتي وتدوين الملاحظات السريرية (Voice SOAP Scribe)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Clinical AI Scribe
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                المريض: <strong className="text-white">{patient?.first_name ? `${patient.first_name} ${patient.last_name}` : 'غير محدد'}</strong> &bull; تحويل التسجيل الصوتي أو الإملاء المباشر إلى تقرير SOAP مقنن
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`px-6 py-3 text-xs font-bold flex items-center justify-between border-b ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
          }`}>
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Recorder Controls Bar */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Mode Switcher */}
              <div className="flex items-center space-x-2 space-x-reverse text-xs">
                <button
                  type="button"
                  onClick={() => setActiveMode('voice')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                    activeMode === 'voice' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  🎙️ تسجيل صوتي مباشر
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('text')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
                    activeMode === 'text' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  ⌨️ إملاء نصي سريع
                </button>
              </div>

              {/* Language Selector */}
              <div className="flex items-center space-x-2 space-x-reverse text-xs">
                <span className="text-slate-400 font-bold">لغة التقرير:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                >
                  <option value="fr">🇫🇷 Français Médical</option>
                  <option value="ar">🇩🇿 العربية السريرية</option>
                </select>
              </div>
            </div>

            {/* Voice Mode Controls */}
            {activeMode === 'voice' ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center space-x-4 space-x-reverse">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition flex items-center space-x-2 space-x-reverse"
                    >
                      <Mic className="w-4 h-4 animate-pulse" />
                      <span>ابدأ التسجيل الصوتي</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition flex items-center space-x-2 space-x-reverse animate-bounce"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>إيقاف التسجيل ({formatTimer(recordingDuration)})</span>
                    </button>
                  )}

                  {audioUrl && !isRecording && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <audio src={audioUrl} controls className="h-9 w-52 rounded-xl bg-slate-900" />
                      <button
                        type="button"
                        onClick={resetRecording}
                        className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                        title="إعادة التسجيل"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleProcessSoap}
                  disabled={processing || (!audioBlob && !textDictation)}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-500/20 transition flex items-center space-x-2 space-x-reverse disabled:opacity-50"
                >
                  {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-current" />}
                  <span>{processing ? 'جاري التحليل السريري واستخراج SOAP...' : '✨ تحويل الملاحظات إلى تقرير SOAP'}</span>
                </button>
              </div>
            ) : (
              /* Text Dictation Mode */
              <div className="space-y-3 pt-2">
                <textarea
                  rows={3}
                  value={textDictation}
                  onChange={(e) => setTextDictation(e.target.value)}
                  placeholder="اكتب أو ألصق ملاحظات الجلسة الشفهية (مزيج دراجة/فرنسية/مصطلحات طبية)..."
                  className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleProcessSoap}
                    disabled={processing || !textDictation.trim()}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs shadow-lg transition flex items-center space-x-2 space-x-reverse disabled:opacity-50"
                  >
                    {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-current" />}
                    <span>{processing ? 'جاري التحليل السريري...' : '✨ هيكلة النص إلى تقرير SOAP'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive 4-Card SOAP Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* S: Subjective */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs">
                  S
                </span>
                <h4 className="text-xs font-black text-white">الذاتي (Subjective) - شكوى المريض وملاحظات الولي</h4>
              </div>
              <textarea
                rows={4}
                value={soapData.subjective}
                onChange={(e) => setSoapData({ ...soapData, subjective: e.target.value })}
                placeholder="ملاحظات وسلوك الطفل المبلغ عنه من الوالدين..."
                className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            {/* O: Objective */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                  O
                </span>
                <h4 className="text-xs font-black text-white">الموضوعي (Objective) - الأداء الفعلي والتمارين المنجزة</h4>
              </div>
              <textarea
                rows={4}
                value={soapData.objective}
                onChange={(e) => setSoapData({ ...soapData, objective: e.target.value })}
                placeholder="التمارين والأرقام ونسب النجاح المحققة خلال الجلسة..."
                className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            {/* A: Assessment */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                  A
                </span>
                <h4 className="text-xs font-black text-white">التقييم (Assessment) - التحليل السريري ومستوى التطور</h4>
              </div>
              <textarea
                rows={4}
                value={soapData.assessment}
                onChange={(e) => setSoapData({ ...soapData, assessment: e.target.value })}
                placeholder="القراءة السريرية لمدى استجابة الطفل وتطور قدراته..."
                className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            {/* P: Plan */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs">
                  P
                </span>
                <h4 className="text-xs font-black text-white">الخطة (Plan) - برنامج الجلسة القادمة والتوجيه المنزلي</h4>
              </div>
              <textarea
                rows={4}
                value={soapData.plan}
                onChange={(e) => setSoapData({ ...soapData, plan: e.target.value })}
                placeholder="خطوات الجلسة المقبلة والواجبات المنزلية المسندة للأولياء..."
                className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={handleDispatchPlanToPortal}
              disabled={dispatchingHomework || !soapData.plan}
              className="px-4 py-2.5 rounded-2xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 font-bold text-xs transition flex items-center space-x-1.5 space-x-reverse disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{dispatchingHomework ? 'جاري الإرسال...' : '📲 إرسال بند الخطة كواجب لبوابة الولي'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSaveSoap}
              disabled={saving || (!soapData.subjective && !soapData.objective)}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition flex items-center space-x-1.5 space-x-reverse disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : '💾 حفظ تقرير SOAP في ملف المريض'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
