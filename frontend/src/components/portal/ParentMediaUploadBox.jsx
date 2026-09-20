import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Upload, 
  Trash2, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Music, 
  Clock, 
  FileAudio, 
  Volume2, 
  Sparkles,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { portalMagicLinkApi } from '../../api';

export default function ParentMediaUploadBox({
  token,
  lang = 'ar',
  onUploadSuccess,
  showHistory = true,
  patientName = '',
  className = '',
}) {
  const isRtl = lang === 'ar';

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [audioSamples, setAudioSamples] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Refs for media recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Bilingual Dictionary
  const dict = {
    ar: {
      title: 'تسجيل ورفع عينة صوتية أو وسائط للطفل',
      subtitle: 'يمكنكم تسجيل مقطع صوتي مباشر للطفل (أثناء نطق الكلمات، التأتأة، أو التعبير) أو رفع ملف صوتي/فيديو مسجل مسبقاً لمساعدة الأخصائي في التقييم السريري.',
      chooseFile: 'اختيار ملف صوتي / فيديو',
      chooseFileHint: 'صيغ مدعومة: MP3, WAV, WEBM, M4A, OGG, MP4',
      startRecord: 'بدء تسجيل صوتي حي 🎙️',
      stopRecord: 'إيقاف وإنهاء التسجيل ⏹️',
      recordingInProgress: 'جاري التسجيل الصوتي المباشر...',
      recordingTime: 'مدة التسجيل:',
      previewTitle: 'معاينة المقطع الصوتي قبل الإرسال:',
      notesLabel: 'ملاحظة توضيحية حول التسجيل (اختياري):',
      notesPlaceholder: 'مثال: نطق حرف الراء، صعوبة عند بداية الجمل، تسجيل أثناء المحادثة المنزلية...',
      confirmUpload: 'تأكيد إرسال المقطع الصوتي للعيادة 🚀',
      uploading: 'جاري رفع وتوثيق العينة الصوتية...',
      cancel: 'إلغاء',
      successMessage: '✅ تم رفع العينة الصوتية بنجاح ومزامنتها مع الملف السريري للطفل!',
      historyTitle: '🎧 التسجيلات والعينات الصوتية المرفوعة للعيادة:',
      noHistory: 'لم يتم رفع عينات صوتية بعد.',
      deleteBtn: 'حذف',
      deleting: 'جاري الحذف...',
      permissionDenied: 'تعذر الوصول إلى الميكروفون. يرجى منح إذن الميكروفون في المتصفح أو رفع ملف مسجل.',
      selectPrompt: 'يرجى تسجيل مقطع صوتي أو اختيار ملف أولاً.',
    },
    fr: {
      title: 'Enregistrement & téléversement audio / média de l\'enfant',
      subtitle: 'Enregistrez la voix de l\'enfant en direct (prononciation, bégaiement, langage) ou importez un fichier audio/vidéo pré-enregistré pour le bilan orthophonique.',
      chooseFile: 'Choisir un fichier audio / média',
      chooseFileHint: 'Formats acceptés : MP3, WAV, WEBM, M4A, OGG, MP4',
      startRecord: 'Enregistrer un vocal en direct 🎙️',
      stopRecord: 'Arrêter l\'enregistrement ⏹️',
      recordingInProgress: 'Enregistrement audio en direct...',
      recordingTime: 'Durée :',
      previewTitle: 'Aperçu avant envoi :',
      notesLabel: 'Note explicative sur l\'audio (optionnelle) :',
      notesPlaceholder: 'Ex : Prononciation du son R, hésitation en début de phrase, dialogue à la maison...',
      confirmUpload: 'Confirmer l\'envoi de l\'audio au cabinet 🚀',
      uploading: 'Téléversement en cours...',
      cancel: 'Annuler',
      successMessage: '✅ Enregistrement audio transmis avec succès au dossier médical !',
      historyTitle: '🎧 Échantillons audio transmis au praticien :',
      noHistory: 'Aucun enregistrement audio pour le moment.',
      deleteBtn: 'Supprimer',
      deleting: 'Suppression...',
      permissionDenied: 'Accès au micro refusé. Veuillez autoriser le micro ou importer un fichier.',
      selectPrompt: 'Veuillez enregistrer un vocal ou sélectionner un fichier audio d\'abord.',
    }
  };

  const t = dict[lang] || dict.ar;

  // Fetch existing samples on mount or token change
  useEffect(() => {
    if (token) {
      loadHistory();
    }
    return () => {
      cleanupRecorder();
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [token]);

  const cleanupRecorder = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        // ignore
      }
    }
  };

  const loadHistory = async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      const res = await portalMagicLinkApi.getAudioSamples(token);
      if (res && res.samples) {
        setAudioSamples(res.samples);
      }
    } catch (err) {
      console.warn('Could not load portal audio samples:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Format seconds to mm:ss
  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 1. Live Recording Handlers
  const startRecording = async () => {
    setUploadError('');
    setUploadSuccess('');
    clearActiveSelection();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mime = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      setUploadError(t.permissionDenied);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // 2. File Selection Handler
  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');
    clearActiveSelection();

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const clearActiveSelection = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setRecordedBlob(null);
    setPreviewUrl(null);
    setRecordingDuration(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 3. Upload Action
  const handleUpload = async () => {
    const fileToUpload = selectedFile || recordedBlob;
    if (!fileToUpload) {
      setUploadError(t.selectPrompt);
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const fileName = selectedFile 
        ? selectedFile.name 
        : `تسجيل_صوتي_${patientName ? patientName + '_' : ''}${new Date().toISOString().slice(0, 10)}.webm`;

      const formData = new FormData();
      formData.append('audio', fileToUpload, fileName);
      formData.append('notes', notes);
      formData.append('file_name', fileName);

      const res = await portalMagicLinkApi.uploadAudio(token, formData);

      if (res && res.success) {
        setUploadSuccess(t.successMessage);
        const newSample = res.sample || {
          id: Date.now(),
          file_name: fileName,
          url: previewUrl,
          notes: notes,
          uploaded_at_human: isRtl ? 'الآن' : 'À l\'instant',
        };

        setAudioSamples((prev) => [newSample, ...prev]);
        clearActiveSelection();
        setNotes('');

        if (onUploadSuccess) {
          onUploadSuccess(newSample);
        }
      } else {
        throw new Error(res?.message || 'Erreur lors du téléversement');
      }
    } catch (err) {
      console.error('Audio upload error:', err);
      setUploadError(err.message || (isRtl ? 'حدث خطأ أثناء رفع الملف الصوتي.' : 'Erreur lors du téléversement audio.'));
    } finally {
      setUploading(false);
    }
  };

  // 4. Delete Sample Handler
  const handleDeleteSample = async (sampleId) => {
    if (!token || !sampleId) return;
    setDeletingId(sampleId);
    try {
      await portalMagicLinkApi.deleteAudioSample(token, sampleId);
      setAudioSamples((prev) => prev.filter((s) => s.id !== sampleId));
    } catch (err) {
      console.warn('Could not delete audio sample:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl ${className}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="flex items-start space-x-3 space-x-reverse">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
          <Mic className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black text-white flex items-center gap-1.5">
            <span>{t.title}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-normal border border-emerald-500/30">
              HD Audio
            </span>
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Action Buttons: Choose File OR Live Record */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. File Upload Trigger */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            id="parent-audio-upload-input"
            data-testid="parent-audio-upload-input"
            accept="audio/*,video/*,.mp3,.wav,.ogg,.m4a,.webm,.aac,.mp4"
            onChange={handleFileSelect}
            className="sr-only"
          />
          <label
            htmlFor="parent-audio-upload-input"
            data-testid="parent-audio-upload-btn"
            className="w-full flex items-center justify-center space-x-2 space-x-reverse p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm group text-center"
          >
            <FolderOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>{t.chooseFile}</span>
          </label>
          <span className="block text-[9px] text-slate-500 text-center mt-1">
            {t.chooseFileHint}
          </span>
        </div>

        {/* 2. Live Mic Recorder Trigger */}
        <div>
          <button
            type="button"
            data-testid="parent-audio-record-btn"
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-full flex items-center justify-center space-x-2 space-x-reverse p-3 rounded-2xl border text-xs font-black transition-all shadow-sm ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 animate-pulse shadow-rose-500/30'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 text-white" />
                <span>{t.stopRecord} ({formatSeconds(recordingDuration)})</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>{t.startRecord}</span>
              </>
            )}
          </button>
          <span className="block text-[9px] text-slate-500 text-center mt-1">
            {isRecording ? `${t.recordingTime} ${formatSeconds(recordingDuration)}` : (isRtl ? 'تسجيل مباشر من ميكروفون الهاتف أو الحاسوب' : 'Enregistrement direct via le micro')}
          </span>
        </div>
      </div>

      {/* Active Recording Waveform Indicator */}
      {isRecording && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold text-rose-300">{t.recordingInProgress}</span>
          </div>
          <span className="font-mono text-xs font-black text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-800">
            ⏱️ {formatSeconds(recordingDuration)}
          </span>
        </div>
      )}

      {/* Audio Preview & Confirmation Section */}
      {previewUrl && !isRecording && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-700 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <FileAudio className="w-4 h-4" />
              <span>{t.previewTitle}</span>
              {selectedFile && <span className="text-slate-400 font-normal">({selectedFile.name})</span>}
            </span>
            <button
              type="button"
              onClick={clearActiveSelection}
              className="text-[11px] text-slate-400 hover:text-rose-400 underline font-bold"
            >
              {t.cancel}
            </button>
          </div>

          <audio
            controls
            src={previewUrl}
            className="w-full h-9 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
            data-testid="parent-audio-player"
          />

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              {t.notesLabel}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="button"
            data-testid="parent-audio-submit-btn"
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 space-x-reverse transition-all"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.uploading}</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>{t.confirmUpload}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {uploadSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-2 space-x-reverse animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center space-x-2 space-x-reverse animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Uploaded Samples History List */}
      {showHistory && (
        <div data-testid="parent-audio-history" className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-[11px] font-black text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.historyTitle}</span>
              <span className="font-mono text-emerald-400 font-normal">({audioSamples.length})</span>
            </h5>
            {loadingHistory && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>

          {audioSamples.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-500 text-[11px]">
              {t.noHistory}
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {audioSamples.map((sample) => (
                <div
                  key={sample.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 space-x-reverse min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Music className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-white text-[11px] truncate max-w-[200px]">
                        {sample.file_name || 'تسجيل صوتي'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {sample.uploaded_at_human || ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSample(sample.id)}
                        disabled={deletingId === sample.id}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title={t.deleteBtn}
                      >
                        {deletingId === sample.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {sample.notes && (
                    <p className="text-[10px] text-slate-400 italic bg-slate-900/60 p-1.5 rounded-lg">
                      💬 {sample.notes}
                    </p>
                  )}

                  {sample.url && (
                    <audio
                      controls
                      src={sample.url}
                      className="w-full h-7 rounded-lg"
                      data-testid="parent-audio-player"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
