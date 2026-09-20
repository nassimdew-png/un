import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Save, Sparkles, Loader2, Volume2, CheckCircle2 } from 'lucide-react';
import { patientApi } from '../api';
import VoiceScribeRecorderModal from './sessions/VoiceScribeRecorderModal';

export default function ClinicalAudioRecorder({ patientId, onRecorded = null }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [showScribeModal, setShowScribeModal] = useState(false);

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);
      setFeedback(null);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setFeedback({ type: 'error', text: 'تعذر الوصول إلى الميكروفون: ' + err.message });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const handleSave = async () => {
    if (!audioBlob || !patientId) return;
    setSaving(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('title', title || `تسجيل سريري - ${new Date().toLocaleDateString('fr-FR')}`);
      formData.append('duration_seconds', duration);

      await patientApi.uploadAudioRecord(patientId, formData);
      setFeedback({ type: 'success', text: 'تم حفظ التسجيل الصوتي بنجاح في أرشيف المريض!' });
      setAudioBlob(null);
      setAudioUrl(null);
      setTitle('');
      if (onRecorded) onRecorded();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ التسجيل.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
            <Mic className="w-5 h-5 text-indigo-400" />
            <span>تفريغ صوتي ذكي للملاحظات السريرية (AI Medical Scribe)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            سجل عينات النطق، الإملاء السريري، وتفريغ ملاحظات SOAP للمريض بدقة
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center space-x-2 space-x-reverse px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-mono font-bold animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>جاري التسجيل: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
          <button
            type="button"
            id="ambient-scribe-btn"
            data-testid="ambient-scribe-btn"
            data-cy="ambient-scribe-btn"
            onClick={() => setShowScribeModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>تفريغ صوتي ذكي للملاحظات السريرية</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs font-bold ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Recording controls */}
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-all hover:scale-105 active:scale-95"
          >
            <Mic className="w-8 h-8" />
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40 transition-all hover:scale-105 active:scale-95 animate-pulse"
          >
            <Square className="w-8 h-8 fill-current" />
          </button>
        )}

        <div className="text-center">
          <p className="text-sm font-bold text-slate-200">
            {isRecording ? 'جاري تسجيل الصوت والملاحظات...' : 'انقر على الميكروفون لبدء التسجيل السريري'}
          </p>
          <span className="text-xs text-slate-500">
            {isRecording ? 'انقر على المربع الأصفر لإيقاف التسجيل' : 'أو افتح نافذة تفريغ صوتي ذكي للملاحظات السريرية أعلاه'}
          </span>
        </div>
      </div>

      {/* Audio player & save action */}
      {audioUrl && !isRecording && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <audio src={audioUrl} controls className="w-full" />

          <div className="flex items-center space-x-2 space-x-reverse pt-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان التسجيل (مثال: نطق حرف الراء / فحص حبسة كلامية)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 space-x-reverse"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>حفظ في الأرشيف</span>
            </button>
          </div>
        </div>
      )}

      {/* Voice Scribe Modal */}
      {showScribeModal && (
        <VoiceScribeRecorderModal
          isOpen={showScribeModal}
          onClose={() => setShowScribeModal(false)}
          patient={{ id: patientId }}
        />
      )}
    </div>
  );
}
