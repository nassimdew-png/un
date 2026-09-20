import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Volume2, 
  VolumeX, 
  Clock, 
  Users, 
  Building, 
  Sparkles, 
  CheckCircle2, 
  Radio, 
  Activity,
  Maximize2
} from 'lucide-react';
import { queueApi } from '../api';
import { playArrivalChime } from '../utils/soundNotifier';

export default function WaitingRoomTvScreen() {
  const { tenantSlug } = useParams();

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [liveCallOverride, setLiveCallOverride] = useState(() => {
    try {
      const saved = localStorage.getItem('psypro_last_called');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [incomingAlert, setIncomingAlert] = useState(null);
  
  const lastCalledIdRef = useRef(null);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Text-To-Speech SpeechSynthesis Caller
  const speakAnnouncement = (textAr, textFr) => {
    if (!('speechSynthesis' in window)) return;

    try {
      playArrivalChime(); // Play chime first
    } catch (e) {}

    setTimeout(() => {
      window.speechSynthesis.cancel();

      const utteranceAr = new SpeechSynthesisUtterance(textAr);
      utteranceAr.lang = 'ar-SA';
      utteranceAr.rate = 0.9;
      utteranceAr.pitch = 1.0;

      // Find Arabic voice if available
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arVoice) utteranceAr.voice = arVoice;

      window.speechSynthesis.speak(utteranceAr);
    }, 800);
  };

  const fetchQueue = async () => {
    try {
      const targetSlug = tenantSlug || localStorage.getItem('kiosk_subdomain') || '';
      const res = await queueApi.getTvQueue(targetSlug);
      setQueueData(res);

      // Check if new call arrived
      const call = res.current_call || res.current_calling;
      if (call && call.id !== lastCalledIdRef.current) {
        lastCalledIdRef.current = call.id;
        setLiveCallOverride(call);
        
        if (audioEnabled) {
          const textAr = `الرجاء من المريض ${call.patient_name}، رقم ${call.token_number || call.token}، التوجه إلى ${call.room_name || call.room || 'قاعة الاستشارة 1'}`;
          speakAnnouncement(textAr);
        }
      }
    } catch (err) {
      console.error('Error fetching TV queue:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll queue every 4 seconds
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 4000);
    return () => clearInterval(interval);
  }, [tenantSlug, audioEnabled]);

  // Real-time BroadcastChannel and cross-window sync listener
  useEffect(() => {
    const handleTvQueueSync = (eventData) => {
      if (!eventData) return;

      if (eventData.type === 'KIOSK_CHECKIN_CONFIRMED' || eventData.type === 'PATIENT_ARRIVED') {
        try {
          playArrivalChime();
        } catch (e) {}

        const pName = eventData.patient?.name || (eventData.patient?.first_name ? `${eventData.patient.first_name} ${eventData.patient.last_name || ''}` : 'مريض جديد');
        const token = eventData.token || 'T-001';

        setIncomingAlert({
          patient_name: pName,
          token: token,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        });

        fetchQueue();

        setTimeout(() => {
          setIncomingAlert((current) => current?.token === token ? null : current);
        }, 9000);
      } else if (eventData.type === 'PATIENT_CALLED') {
        const callObj = {
          id: eventData.id || Date.now(),
          token: eventData.token || eventData.token_number || 'T-001',
          token_number: eventData.token_number || eventData.token || 'T-001',
          patient_name: eventData.patient_name || 'المريض',
          room_name: eventData.room_name || eventData.room || 'قاعة الاستشارة والتشخيص 1',
          room: eventData.room || eventData.room_name || 'قاعة الاستشارة والتشخيص 1',
        };
        setLiveCallOverride(callObj);
        lastCalledIdRef.current = callObj.id;

        if (audioEnabled) {
          const textAr = `الرجاء من المريض ${callObj.patient_name}، رقم ${callObj.token_number}، التوجه إلى ${callObj.room_name}`;
          speakAnnouncement(textAr);
        } else {
          try {
            playArrivalChime();
          } catch (e) {}
        }

        fetchQueue();
      }
    };

    let channel = null;
    try {
      channel = new BroadcastChannel('psypro_clinic_queue');
      channel.onmessage = (e) => handleTvQueueSync(e.data);
    } catch (e) {}

    const onStorage = (e) => {
      if (e.key === 'psypro_queue_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleTvQueueSync(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', onStorage);

    const onCustom = (e) => {
      if (e.detail) handleTvQueueSync(e.detail);
    };
    window.addEventListener('psypro_queue_event', onCustom);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('psypro_queue_event', onCustom);
    };
  }, [audioEnabled]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const currentCall = liveCallOverride 
    || queueData?.current_call 
    || queueData?.current_calling 
    || (recentCalls.length > 0 ? recentCalls[0] : null) 
    || (waitingList.length > 0 && waitingList[0]?.status === 'in_progress' ? waitingList[0] : null);
  const waitingList = queueData?.waiting_list || [];
  const recentCalls = queueData?.recent_calls || queueData?.recent_called || [];
  const ticker = queueData?.ticker_messages || ['مرحباً بكم في العيادة', 'يرجى متابعة شاشة النداء الآلي'];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans selection:bg-brand-500 overflow-hidden" dir="rtl">
      {/* Header Bar */}
      <header className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-brand-500/25 text-xl">
            <Radio className="w-6 h-6 animate-pulse text-emerald-300" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {queueData?.tenant?.name || 'عيادة الاستشارات المتخصصة'}
            </h1>
            <div className="text-xs text-brand-300 font-bold flex items-center space-x-2 space-x-reverse mt-0.5">
              <span>شاشة النداء الآلي وقاعة الانتظار</span>
              <span>&bull;</span>
              <span className="text-slate-400">{dateStr}</span>
            </div>
          </div>
        </div>

        {/* Live Clock & Audio Enable Toggle */}
        <div className="flex items-center space-x-3 space-x-reverse">
          {/* Test Voice Button */}
          <button
            type="button"
            onClick={() => {
              setAudioEnabled(true);
              speakAnnouncement(
                'الرجاء من المريض أمين بن علي، رقم A-07، التوجه إلى قاعة التخاطب 1',
                'Patient Amine Benali est appelé en Salle 1'
              );
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center space-x-1.5 space-x-reverse transition-all shadow-md shadow-indigo-600/25"
            title="اختبار نطق النداء الآلي باللغة العربية"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            <span>اختبار الصوت (Tester la voix)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled) {
                speakAnnouncement('تم تفعيل نظام النداء الصوتي الآلي بنجاح.');
              }
            }}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center space-x-2 space-x-reverse transition-all shadow-lg ${
              audioEnabled
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-rose-600 text-white animate-pulse shadow-rose-600/30'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{audioEnabled ? 'الصوت مفعل 🔊' : 'انقر لتفعيل الصوت 🔇'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullScreen}
            className="p-2.5 rounded-2xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            title="ملء الشاشة"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <div className="px-5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono">
            <div className="text-2xl font-black text-teal-300 tracking-wider">
              {timeStr || '00:00:00'}
            </div>
          </div>
        </div>
      </header>

      {/* Incoming Kiosk Arrival / Call Signal Alert Banner */}
      {incomingAlert && (
        <div 
          data-testid="tv-incoming-call-signal" 
          id="tv-incoming-call-signal"
          className="bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 text-slate-950 px-6 py-3 font-black text-sm text-center flex items-center justify-center gap-3 animate-pulse shadow-xl"
        >
          <span className="text-xl">🔔</span>
          <span>إشارة نداء وتنبيه وصول جديد: تم تسجيل وصول المريض <strong>{incomingAlert.patient_name}</strong> (تذكرة <strong>{incomingAlert.token}</strong>) إلى قاعة الانتظار!</span>
          <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">{incomingAlert.time}</span>
        </div>
      )}

      {/* Main Waiting TV Layout Grid */}
      <main className="p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Glowing Main Call Card (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col justify-center">
          {currentCall ? (
            <div data-testid="tv-active-call-card" id="tv-active-call-card" className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-brand-500 shadow-2xl shadow-brand-500/20 text-center space-y-6 animate-in zoom-in-95 relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-brand-500 via-emerald-400 to-indigo-500 animate-pulse" />

              <div data-testid="tv-call-badge" className="inline-flex items-center space-x-2 space-x-reverse px-6 py-2 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 text-sm font-black animate-bounce">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>النداء الحالي المباشر &bull; APPEL EN COURS</span>
              </div>

              {/* Big Glowing Token */}
              <div className="py-2">
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">رقم المريض</div>
                <div data-testid="tv-called-token" id="tv-called-token" className="text-7xl sm:text-9xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-brand-300 drop-shadow-2xl">
                  {currentCall.token_number || currentCall.token}
                </div>
              </div>

              {/* Patient Name & Destination Room */}
              <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3 max-w-xl mx-auto">
                <div data-testid="tv-called-patient-name" id="tv-called-patient-name" className="text-2xl sm:text-4xl font-extrabold text-white">
                  {currentCall.patient_name}
                </div>

                <div className="inline-block px-8 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-lg sm:text-2xl">
                  👉 يُرجى التوجه إلى: <strong data-testid="tv-called-room" id="tv-called-room" className="text-white">{currentCall.room_name || currentCall.room || 'قاعة الاستشارة والتشخيص 1'}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 my-auto">
              <div className="w-20 h-20 rounded-3xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                <Clock className="w-10 h-10 animate-spin-slow text-brand-400" />
              </div>
              <h3 className="text-2xl font-black text-white">في انتظار النداء التالي...</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                نرجو من المرضى الكرام أخذ مقاعدهم ومتابعة الشاشة عند صدور التنبيه الصوتي
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Upcoming Queue & Recent Calls (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex-1 flex flex-col shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center space-x-2 space-x-reverse">
                <Users className="w-4 h-4 text-brand-400" />
                <span>قائمة الانتظار القادمة (File d'Attente)</span>
              </h3>
              <span className="px-2 py-0.5 rounded-lg bg-brand-500/20 text-brand-300 font-mono text-xs font-bold">
                {waitingList.length + (incomingAlert && !waitingList.some(w => w.token === incomingAlert.token) ? 1 : 0)} مرضى
              </span>
            </div>

            <div className="space-y-2 flex-1 overflow-hidden">
              {/* Fresh Incoming Alert injected at top of queue */}
              {incomingAlert && (
                <div data-testid="tv-new-queue-entry" className="p-3.5 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500/60 flex items-center justify-between animate-pulse">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <span className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-black text-sm flex items-center justify-center border border-emerald-500/40">
                      {incomingAlert.token}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-white">{incomingAlert.patient_name}</h4>
                      <span className="text-[10px] text-emerald-400 font-bold">وصل حديثاً &bull; {incomingAlert.time}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] animate-bounce">
                    🔔 في الانتظار
                  </span>
                </div>
              )}

              {waitingList.length === 0 && !incomingAlert ? (
                <div data-testid="tv-empty-queue" className="p-6 text-center text-xs text-slate-500 my-auto">
                  لا يوجد مرضى مسجلين في الانتظار حالياً
                </div>
              ) : (
                waitingList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <span className="w-10 h-10 rounded-xl bg-slate-800 text-teal-300 font-mono font-black text-sm flex items-center justify-center border border-slate-700">
                        {item.token}
                      </span>
                      <div>
                        <div className="text-xs font-black text-white">{item.patient_name || item.patient_initials}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          الموعد: {item.time} {item.patient_initials && item.patient_initials !== '—' ? `• (${item.patient_initials})` : ''}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold">
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Healthcare & Clinic Ticker Marquee */}
      <footer className="p-3 bg-slate-900 border-t border-slate-800 text-xs font-bold text-slate-300 flex items-center shadow-2xl">
        <div className="px-3 py-1 rounded-xl bg-brand-600 text-white font-black shrink-0 ml-3">
          📢 إعلانات العيادة
        </div>

        <div className="overflow-hidden whitespace-nowrap flex-1">
          <div className="inline-block animate-marquee">
            {ticker.join('  &bull;&bull;&bull;  ')}
          </div>
        </div>
      </footer>
    </div>
  );
}
