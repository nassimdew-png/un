import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Volume2, VolumeX, Maximize, Minimize, Clock, Users, CheckCircle2, 
  Sparkles, Radio, Activity, AlertCircle, Building2, ChevronRight
} from 'lucide-react';
import { waitingRoomTvApi } from '../../api';

export default function SmartWaitingRoomTvView() {
  const { clinicSlug } = useParams();
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCallingPulse, setIsCallingPulse] = useState(false);

  const lastCalledIdRef = useRef(null);
  const lastCallCounterRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Digital Clock live update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Dual-tone Chime Generator (No external audio file needed)
  const playDualToneChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Tone 1: High crisp ding (659.25 Hz - E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: Warm melodic dong (523.25 Hz - C5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.2);
      gain2.gain.setValueAtTime(0.35, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }, []);

  // Voice Announcement using Web Speech API
  const speakTokenAnnouncement = useCallback((tokenNumber, patientName, room) => {
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const text = `التذكرة رقم ${tokenNumber}. ${patientName ? patientName + '.' : ''} يرجى التوجه إلى ${room || 'قاعة الاستشارة'}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Try selecting Arabic voice if available
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang.startsWith('ar') || v.lang.includes('ar'));
      if (arVoice) {
        utterance.voice = arVoice;
      }

      // Small delay after chime
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 500);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }, []);

  // Unlock Audio on user gesture (browser autoplay policy)
  const enableAudio = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass && !audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setAudioUnlocked(true);
      playDualToneChime();
    } catch (e) {
      console.warn('Unlock error:', e);
    }
  };

  // Fetch TV Queue Data
  const fetchQueue = useCallback(async () => {
    try {
      const res = await waitingRoomTvApi.getTvQueue(clinicSlug);
      if (res && res.success) {
        setQueueData(res);
        setLastError(null);

        const current = res.current_calling;
        if (current) {
          const isNewCall = current.id !== lastCalledIdRef.current || 
                            current.call_counter !== lastCallCounterRef.current;

          if (isNewCall) {
            lastCalledIdRef.current = current.id;
            lastCallCounterRef.current = current.call_counter;

            // Trigger visual pulse
            setIsCallingPulse(true);
            setTimeout(() => setIsCallingPulse(false), 8000);

            // Trigger chime & speech if enabled
            if (res.clinic?.audio_chime_enabled !== false) {
              playDualToneChime();
              speakTokenAnnouncement(current.token, current.patient_initials, current.room);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load TV queue:', err);
      setLastError('تعذر الاتصال بمركز النداء الآلي');
    } finally {
      setLoading(false);
    }
  }, [clinicSlug, playDualToneChime, speakTokenAnnouncement]);

  // Polling interval (every 4 seconds)
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 4000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const clinic = queueData?.clinic;
  const currentCalling = queueData?.current_calling;
  const waitingList = queueData?.waiting_list || [];
  const recentCalled = queueData?.recent_called || [];
  const stats = queueData?.stats || { total_today: 0, waiting_count: 0, completed_count: 0 };

  const formattedDate = currentTime.toLocaleDateString('ar-DZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('ar-DZ', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden" 
      dir="rtl"
    >
      {/* 1. Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-8 py-4 flex items-center justify-between shadow-2xl">
        {/* Clinic Identity */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden">
              {clinic?.logo_url ? (
                <img src={clinic.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-7 h-7 text-emerald-400" />
              )}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {clinic?.name || 'العيادة الطبية النفسية والتأهيلية'}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-3 h-3 mr-1 animate-pulse" />
                شاشة النداء المباشرة
              </span>
            </h1>
            <p className="text-xs font-medium text-slate-400">
              نظام الفرز وقاعة الانتظار السينمائية الذكية • Smart Clinical Display
            </p>
          </div>
        </div>

        {/* Live Clock & Actions */}
        <div className="flex items-center gap-6">
          {/* Audio Unlock Button if not yet unlocked */}
          {!audioUnlocked && (
            <button
              onClick={enableAudio}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-sm font-bold transition-all animate-bounce"
            >
              <VolumeX className="w-4 h-4" />
              تفعيل الرنين الصوتي للنداء
            </button>
          )}

          {audioUnlocked && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              النداء الصوتي مفعّل
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          {/* Date & Big Time */}
          <div className="text-left pl-2 border-r border-slate-800 pr-6">
            <div className="text-3xl font-black font-mono tracking-wider text-emerald-400">
              {formattedTime}
            </div>
            <div className="text-xs font-medium text-slate-400">
              {formattedDate}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Display Area */}
      <main className="flex-1 p-8 grid grid-cols-12 gap-8 items-stretch overflow-hidden">
        
        {/* Left Column: Hero Calling Card (7 Columns) */}
        <section className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          {/* Giant Active Call Card */}
          <div className={`relative flex-1 rounded-3xl p-8 flex flex-col justify-between overflow-hidden transition-all duration-700 border shadow-2xl ${
            isCallingPulse 
              ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-500 ring-4 ring-emerald-500/30 shadow-emerald-500/20 scale-[1.01]' 
              : 'bg-slate-900/80 backdrop-blur-xl border-slate-800'
          }`}>
            {/* Background Glow */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Calling Header Badge */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-wider ${
                  currentCalling 
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 animate-pulse' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  <Activity className="w-4 h-4" />
                  {currentCalling ? 'النداء الحالي المباشر • NOW CALLING' : 'في انتظار نداء المريض'}
                </span>
                {currentCalling?.called_at && (
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    استُدعي في: {currentCalling.called_at}
                  </span>
                )}
              </div>

              {currentCalling && (
                <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono text-emerald-400">
                  نداء #{currentCalling.call_counter}
                </div>
              )}
            </div>

            {/* Giant Center Content */}
            <div className="my-auto py-8 text-center relative z-10">
              {currentCalling ? (
                <div className="space-y-6">
                  <div className="inline-block">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block mb-2">
                      رقم التذكرة • TICKET NUMBER
                    </span>
                    <div className="text-8xl lg:text-9xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 drop-shadow-sm">
                      {currentCalling.token}
                    </div>
                  </div>

                  {/* Patient Name / Initial */}
                  <div className="pt-2">
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white">
                      {currentCalling.patient_name}
                    </h2>
                    <p className="text-lg text-emerald-400/90 font-medium mt-1">
                      {currentCalling.specialist}
                    </p>
                  </div>

                  {/* Consultation Room Banner */}
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-lg shadow-inner">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <span>{currentCalling.room || 'قاعة الاستشارة والفحص'}</span>
                  </div>
                </div>
              ) : (
                <div className="py-16 space-y-4 text-slate-400">
                  <Clock className="w-16 h-16 mx-auto text-slate-600 animate-spin-slow" />
                  <h3 className="text-2xl font-bold text-slate-300">
                    قاعة الانتظار هادئة حالياً
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    يرجى من المرضى الكرام الانتظار حتى ظهور رقم التذكرة وسماع الإشعار الصوتي.
                  </p>
                </div>
              )}
            </div>

            {/* Recently Called Strip (Bottom of Hero) */}
            <div className="pt-4 border-t border-slate-800/80 relative z-10">
              <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                النداءات الأخيرة (تمت المناداة عليهم مؤخراً):
              </div>
              <div className="grid grid-cols-4 gap-3">
                {recentCalled.slice(0, 4).map((rec, idx) => (
                  <div 
                    key={rec.id || idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-black text-sm text-emerald-400">{rec.token}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[100px]">{rec.patient_initials}</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{rec.called_at}</span>
                  </div>
                ))}
                {recentCalled.length === 0 && (
                  <div className="col-span-4 text-center py-2 text-xs text-slate-600">
                    لا توجد نداءات سابقة مسجلة اليوم
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Upcoming Queue List & KPIs (5 Columns) */}
        <section className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          
          {/* Waiting List Card */}
          <div className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl overflow-hidden">
            {/* Header with KPI badge */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" />
                <h3 className="text-lg font-bold text-white">قائمة الانتظار القادمة</h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold">
                {waitingList.length} في الانتظار
              </span>
            </div>

            {/* Scrollable / Card list of upcoming patients */}
            <div className="my-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
              {waitingList.slice(0, 6).map((item, index) => (
                <div 
                  key={item.id || index}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/40 border border-slate-800/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold font-mono">
                      #{item.position || index + 1}
                    </span>
                    <div>
                      <div className="font-mono font-black text-lg text-white">
                        {item.token}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.patient_initials} • {item.specialist}
                      </div>
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="text-xs font-mono font-semibold text-emerald-400">
                      {item.time}
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                      بانتظار النداء
                    </span>
                  </div>
                </div>
              ))}

              {waitingList.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mb-3" />
                  <p className="font-bold text-slate-300">قائمة الانتظار فارغة حالياً</p>
                  <p className="text-xs text-slate-500 mt-1">تمت معاينة جميع المواعيد المجدولة أو بانتظار وصول المرضى</p>
                </div>
              )}
            </div>

            {/* Today Summary Stats Bar */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800">
              <div className="p-3 rounded-xl bg-slate-950/40 text-center">
                <div className="text-xs text-slate-400">إجمالي اليوم</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">{stats.total_today}</div>
              </div>
              <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/10 text-center">
                <div className="text-xs text-teal-400">في الانتظار</div>
                <div className="text-xl font-bold font-mono text-teal-300 mt-0.5">{stats.waiting_count}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                <div className="text-xs text-emerald-400">تم فحصهم</div>
                <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">{stats.completed_count}</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 3. Bottom Scrolling News Ticker */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex items-center gap-4 text-sm shadow-2xl relative z-20">
        <div className="flex items-center gap-2 text-emerald-400 font-extrabold whitespace-nowrap bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <Sparkles className="w-4 h-4" />
          <span>إرشادات وتنبيهات العيادة:</span>
        </div>
        
        <div className="flex-1 overflow-hidden whitespace-nowrap relative">
          <div className="inline-block animate-marquee text-slate-300 font-medium">
            {clinic?.ticker_text || 'مرحباً بكم في العيادة. يرجى تجهيز الملف الطبي والانتظار بهدوء حتى ظهور رقم تذكرتكم وسماع النداء الصوتي. نتمنى لكم دوام الصحة والعافية والشفاء العاجل.'}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono hidden md:block whitespace-nowrap pl-2">
          PsyPro SmartTV v2.4
        </div>
      </footer>

      {/* CSS for custom marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
      `}</style>
    </div>
  );
}
