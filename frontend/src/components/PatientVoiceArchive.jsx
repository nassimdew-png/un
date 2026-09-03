import React, { useState, useEffect } from 'react';
import { Mic, Play, Pause, Volume2, Calendar, Trash2, ArrowRightLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { patientApi } from '../api';

export default function PatientVoiceArchive({ patient }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [audioElem, setAudioElem] = useState(null);

  // Dual track comparison
  const [trackA, setTrackA] = useState(null);
  const [trackB, setTrackB] = useState(null);

  const loadAudio = async () => {
    if (!patient?.id) return;
    setLoading(true);
    try {
      const res = await patientApi.getAudioRecords(patient.id);
      if (res.success && res.records) {
        setRecords(res.records);
        if (res.records.length > 0) {
          setTrackA(res.records[0]);
          if (res.records.length > 1) {
            setTrackB(res.records[res.records.length - 1]);
          }
        }
      }
    } catch (e) {
      console.warn('Voice archive load:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudio();
    return () => {
      if (audioElem) audioElem.pause();
    };
  }, [patient?.id]);

  const togglePlay = (record) => {
    if (playingId === record.id) {
      if (audioElem) audioElem.pause();
      setPlayingId(null);
    } else {
      if (audioElem) audioElem.pause();
      const a = new Audio(record.file_url || record.url || record.audio_path);
      a.onended = () => setPlayingId(null);
      a.play().catch(() => {});
      setAudioElem(a);
      setPlayingId(record.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Dual Track Comparison */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
              <Mic className="w-5 h-5 text-amber-400" />
              <span>أرشيف التسجيلات الصوتية والمقارنة القبلية/البعدية (Voice Archive)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              متابعة تطور النطق، مخارج الحروف، ونبرة الصوت عبر الجلسات السريرية
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {records.length} تسجيل مسجل
          </span>
        </div>

        {/* Before / After Comparison Widget */}
        {records.length >= 2 && trackA && trackB && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="text-amber-300 font-black">المسار القبلي (Départ / Avant):</span>
                <span>{trackA.created_at ? new Date(trackA.created_at).toLocaleDateString('fr-FR') : 'الجلسة الأولى'}</span>
              </div>
              <div className="text-xs text-white font-bold">{trackA.title || 'تسجيل التقييم الأولي'}</div>
              <button
                type="button"
                onClick={() => togglePlay(trackA)}
                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center space-x-2 space-x-reverse transition-all"
              >
                {playingId === trackA.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{playingId === trackA.id ? 'إيقاف' : 'استماع للمسار القبلي'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="text-teal-300 font-black">المسار البعدي (Évolution / Actuel):</span>
                <span>{trackB.created_at ? new Date(trackB.created_at).toLocaleDateString('fr-FR') : 'الجلسة الحالية'}</span>
              </div>
              <div className="text-xs text-white font-bold">{trackB.title || 'تسجيل المتابعة الأخير'}</div>
              <button
                type="button"
                onClick={() => togglePlay(trackB)}
                className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center space-x-2 space-x-reverse transition-all"
              >
                {playingId === trackB.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{playingId === trackB.id ? 'إيقاف' : 'استماع للمسار البعدي'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {records.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 space-y-2">
            <Volume2 className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">لا توجد تسجيلات صوتية محفوظة لهذا المريض حالياً.</p>
          </div>
        ) : (
          records.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <button
                  type="button"
                  onClick={() => togglePlay(rec)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    playingId === rec.id
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-slate-900 text-amber-400 hover:bg-slate-800'
                  }`}
                >
                  {playingId === rec.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <div>
                  <h5 className="text-xs font-bold text-white">{rec.title || 'تسجيل صوتي'}</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {rec.created_at ? new Date(rec.created_at).toLocaleString('fr-FR') : ''} &bull; المدة: {rec.duration_seconds ? `${rec.duration_seconds} ثانية` : '--'}
                  </p>
                </div>
              </div>

              {rec.ai_fluency_score && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  {rec.ai_fluency_score}% طلاقة
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
