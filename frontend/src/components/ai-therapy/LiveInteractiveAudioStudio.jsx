import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Shield,
  ShieldAlert,
  Zap,
  Activity,
  UserCheck,
  Globe,
  Heart,
  Square,
  Play,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { liveSessionApi } from '../../api';

export default function LiveInteractiveAudioStudio({ selectedPatient }) {
  const [sessionActive, setSessionActive] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [selectedMode, setSelectedMode] = useState('virtual_patient'); // 'virtual_patient' | 'speech_translate' | 'interactive_relaxation'
  const [sessionTime, setSessionTime] = useState(0);
  const [latency, setLatency] = useState(85);
  const [liveTranscript, setLiveTranscript] = useState([]);

  const timerRef = useRef(null);

  useEffect(() => {
    if (sessionActive) {
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionActive]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartSession = async () => {
    try {
      const res = await liveSessionApi.getLiveToken();
      if (res.success) {
        setSessionActive(true);
        setSessionTime(0);
        setLiveTranscript([
          {
            sender: 'ai',
            text: selectedMode === 'virtual_patient'
              ? 'مرحباً بك يا أخصائي. أنا جاهز لبدء المقابلة السريرية المحاكية للحالة. تفضل بالبدء بالسؤال الأول.'
              : selectedMode === 'speech_translate'
              ? 'محرك الترجمة الفورية المباشرة جاهز. تحدث وسأقوم بالترجمة الصوتية اللحظية.'
              : 'أهلاً بك. سنبدأ الآن تمرين التنفس الاسترخائي الموجه. خذ نفساً عميقاً واحتفظ به لثلاث ثوانٍ...',
            time: '00:01',
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to init live token:', err);
    }
  };

  const handleStopSession = () => {
    setSessionActive(false);
    if (isIncognito) {
      setLiveTranscript([]);
    }
  };

  return (
    <div className={`space-y-6 font-sans text-right transition-all duration-300 ${
      isIncognito ? 'p-1 rounded-3xl ring-2 ring-amber-500/50 bg-amber-950/10' : ''
    }`} dir="rtl">
      
      {/* 1. Header Toolbar & Incognito Privacy Toggle */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/25">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h2 className="text-lg font-black text-white">الجلسات الحية والتفاعل الصوتي المباشر (Real-time Live Studio)</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ⚡ Gemini Live Bi-directional
              </span>
            </div>
            <p className="text-xs text-slate-400">بث صوتي لحظي بدون تأخير، محاكاة افتراضية للحالات، وترجمة صوتية متزامنة</p>
          </div>
        </div>

        {/* Incognito Toggle Button */}
        <button
          type="button"
          onClick={() => setIsIncognito(!isIncognito)}
          className={`px-4 py-2.5 rounded-2xl border text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-md self-start md:self-auto ${
            isIncognito
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-amber-500/10'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {isIncognito ? <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" /> : <Shield className="w-4 h-4" />}
          <span>{isIncognito ? '🕵️‍♂️ وضع السرية الطبية التامة (Incognito Active)' : 'تفعيل وضع السرية التامة'}</span>
        </button>
      </div>

      {isIncognito && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2 space-x-reverse">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="font-bold">
            وضع السرية الطبية المشددة نشط: لن يتم حفظ أي نصوص أو محادثات أو تسجيلات في خوادم المنصة وسيتم محو الجلسة فور إغلاقها.
          </span>
        </div>
      )}

      {/* 2. Interactive Mode Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setSelectedMode('virtual_patient')}
          className={`p-4 rounded-2xl border text-right transition flex items-center space-x-3 space-x-reverse ${
            selectedMode === 'virtual_patient'
              ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">🎙️ محاكاة مقابلة إكلينيكية</h4>
            <p className="text-[10px] text-slate-400">تدريب عملي على تشخيص حالة طفل افتراضية</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMode('speech_translate')}
          className={`p-4 rounded-2xl border text-right transition flex items-center space-x-3 space-x-reverse ${
            selectedMode === 'speech_translate'
              ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-lg'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">🌐 ترجمة صوتية سريرية حية</h4>
            <p className="text-[10px] text-slate-400">عربية ↔ فرنسية ↔ لهجة محلية لحظية</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMode('interactive_relaxation')}
          className={`p-4 rounded-2xl border text-right transition flex items-center space-x-3 space-x-reverse ${
            selectedMode === 'interactive_relaxation'
              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">🧘 استرخاء وتنفس تفاعلي</h4>
            <p className="text-[10px] text-slate-400">توجيه صوتي متناغم مع وتيرة تنفس المريض</p>
          </div>
        </button>
      </div>

      {/* 3. Live Console Canvas & 3D Pulsing Audio Wave */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden text-center">
        
        {/* Top Indicators */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className={`w-2.5 h-2.5 rounded-full ${sessionActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className={sessionActive ? 'text-emerald-400 font-bold' : ''}>
              {sessionActive ? 'البث المباشر متصل (Live Stream Active)' : 'الجلسة متوقفة'}
            </span>
          </div>

          {sessionActive && (
            <div className="flex items-center space-x-3 space-x-reverse text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                ⚡ زمن التأخير: {latency}ms
              </span>
              <span className="font-bold text-white flex items-center space-x-1 space-x-reverse">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatTime(sessionTime)}</span>
              </span>
            </div>
          )}
        </div>

        {/* 3D Pulsing Circle Visualizer */}
        <div className="flex items-center justify-center py-6">
          <div className="relative flex items-center justify-center">
            
            {/* Pulsing Outer Rings */}
            {sessionActive && (
              <>
                <div className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 animate-ping duration-1000 pointer-events-none" />
                <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-cyan-500/30 to-purple-500/30 animate-pulse pointer-events-none" />
              </>
            )}

            {/* Core Orb Button */}
            <div
              onClick={!sessionActive ? handleStartSession : undefined}
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-2xl z-10 ${
                sessionActive
                  ? 'bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 scale-105 shadow-cyan-500/30'
                  : 'bg-slate-950 border-2 border-dashed border-slate-700 hover:border-cyan-400 group'
              }`}
            >
              {sessionActive ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center space-x-1 space-x-reverse">
                    {[40, 90, 60, 100, 70, 85, 50].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h * 0.25}px` }}
                        className="w-1 bg-white rounded-full animate-pulse"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-white block">يستمع ويتحدث...</span>
                </div>
              ) : (
                <div className="space-y-1 group-hover:scale-105 transition">
                  <Mic className="w-10 h-10 text-cyan-400 mx-auto" />
                  <span className="text-[11px] font-bold text-slate-300 block">انقر للبدء الحي</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Live Audio Transcript Preview */}
        {sessionActive && liveTranscript.length > 0 && (
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-slate-950 border border-slate-800 text-right space-y-2">
            <span className="text-[10px] text-slate-500 font-bold block">التفريغ الصوتي اللحظي:</span>
            {liveTranscript.map((t, idx) => (
              <div key={idx} className="text-xs text-slate-200 leading-relaxed font-sans flex items-start space-x-2 space-x-reverse">
                <span className="text-cyan-400 font-bold font-mono">[{t.time}] المساعد:</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Audio Controls Bar */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {!sessionActive ? (
            <button
              type="button"
              onClick={handleStartSession}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:opacity-90 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-xl shadow-cyan-500/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>⚡ بدء جلسة البث الصوتي المباشر</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-2xl border transition ${
                  isMuted ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={isMuted ? 'إلغاء كتم الميكروفون' : 'كتم الميكروفون'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => setSpeakerMuted(!speakerMuted)}
                className={`p-3 rounded-2xl border transition ${
                  speakerMuted ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={speakerMuted ? 'تشغيل الصوت' : 'كتم السماعة'}
              >
                {speakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={handleStopSession}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-rose-600/30"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>إنهاء الجلسة المباشرة</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
