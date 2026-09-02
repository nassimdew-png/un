import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RefreshCw, Upload, X, Volume2, CheckCircle2, AlertCircle } from 'lucide-react';
import { attachmentApi } from '../../api';

export default function AudioRecorderModal({ isOpen, onClose, onSuccess, patient, relatedType = 'general', relatedId = null }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  if (!isOpen) return null;

  const startRecording = async () => {
    setError('');
    audioChunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);

    try {
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
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError("Accès au microphone refusé ou non supporté par votre navigateur.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    const fileName = `Audio_${patient?.last_name || 'Patient'}_${new Date().toISOString().slice(0, 10)}.webm`;
    formData.append('file', audioBlob, fileName);
    formData.append('category', 'audio_recording');
    formData.append('related_type', relatedType);
    if (relatedId) formData.append('related_id', relatedId);
    if (notes) formData.append('notes', notes);

    try {
      await attachmentApi.upload(patient.id, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement de l'audio");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-600/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 font-bold">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Enregistreur Vocal Clinique</h3>
              <p className="text-xs text-slate-400">Patient : {patient?.first_name} {patient?.last_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Recorder Controls */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center space-y-4 text-center">
          {/* Timer Display */}
          <div className="font-mono text-3xl font-bold tracking-wider text-white">
            {formatTime(recordingTime)}
          </div>

          {/* Record Button */}
          {!audioBlob && (
            <div>
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-fuchsia-600 hover:from-red-500 hover:to-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Mic className="w-7 h-7" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/40 animate-pulse"
                >
                  <Square className="w-6 h-6" />
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-slate-400">
            {isRecording
              ? 'Enregistrement en cours... Cliquez sur le carré rouge pour stopper.'
              : !audioBlob
              ? 'Cliquez sur le microphone pour démarrer la capture audio'
              : 'Enregistrement terminé. Écoutez et validez pour attacher au dossier.'}
          </p>

          {/* Audio Playback Preview */}
          {audioBlob && audioUrl && (
            <div className="w-full space-y-3 pt-2">
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-10 rounded-lg"
                controls
              />

              <div className="flex items-center justify-center space-x-2">
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Recommencer</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clinical Notes for Audio */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Notes / Contexte de l'enregistrement (Optionnel)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ex: Épreuve de phonologie /s/ et /ch/, avant rééducation..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!audioBlob || uploading}
            onClick={handleUpload}
            className="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-semibold shadow-lg shadow-fuchsia-500/20 disabled:opacity-40 flex items-center space-x-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Envoi en cours...' : 'Joindre au Dossier'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
