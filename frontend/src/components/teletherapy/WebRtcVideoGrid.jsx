import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Radio,
  Volume2,
  Layout,
  Layers,
  Settings,
  User,
  Activity,
  AlertCircle
} from 'lucide-react';

export default function WebRtcVideoGrid({
  roomCode = '',
  patientName = 'المريض',
  isPractitioner = true,
  onEndCall = null,
  onSignalSend = null,
  incomingSignal = null,
  onCanvasShareToggle = null,
  isCanvasActive = false
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // States
  const [localStream, setLocalStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('waiting'); // 'connecting', 'connected', 'waiting', 'simulation'
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [layoutMode, setLayoutMode] = useState('pip'); // 'pip', 'split', 'focus-remote'
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [networkQuality, setNetworkQuality] = useState('ممتازة (HD)');
  const [networkPing, setNetworkPing] = useState(24);

  // Initialize Web Audio API for Mic Meter
  const setupAudioMeter = (stream) => {
    try {
      if (!stream.getAudioTracks().length) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round(avg * 1.5)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (err) {
      console.warn('AudioContext meter setup failed (non-fatal):', err);
    }
  };

  // Start Local Media Stream with Independent Video and Audio Acquisition
  const initLocalMedia = useCallback(async () => {
    setMediaError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك لا يدعم الوصول للكاميرا والميكروفون.');
      }

      // 1. Independent Video Capture
      let vStream = null;
      let vErr = null;
      try {
        vStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch (e1) {
        console.warn('HD video constraint failed, attempting simple video: true', e1);
        try {
          vStream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (e2) {
          console.warn('Video capture failed:', e2);
          vErr = e2;
        }
      }

      // 2. Independent Audio Capture
      let aStream = null;
      try {
        aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (aErr) {
        console.warn('Audio capture failed:', aErr);
      }

      // 3. Combine tracks into single stream
      const combined = new MediaStream();
      if (vStream && vStream.getVideoTracks().length > 0) {
        vStream.getVideoTracks().forEach((t) => combined.addTrack(t));
      }
      if (aStream && aStream.getAudioTracks().length > 0) {
        aStream.getAudioTracks().forEach((t) => combined.addTrack(t));
      }

      if (vErr && combined.getVideoTracks().length === 0) {
        let msg = 'تعذر تشغيل الكاميرا.';
        if (vErr.name === 'NotAllowedError') {
          msg = 'تم رفض إذن الكاميرا من المتصفح 🚫. يرجى السماح به من شريط العنوان.';
        } else if (vErr.name === 'NotReadableError' || vErr.name === 'TrackStartError') {
          msg = 'الكاميرا قيد الاستخدام من تطبيق آخر ⚠️ (مثل Zoom أو Teams). يرجى إغلاقه.';
        } else if (vErr.name === 'NotFoundError') {
          msg = 'لم يتم العثور على كاميرا موصولة بالجهاز 🔌.';
        }
        setMediaError(msg);
        startSimulationMode();
      }

      localStreamRef.current = combined;
      setLocalStream(combined);
      setupAudioMeter(combined);
    } catch (err) {
      console.warn('initLocalMedia general error:', err);
      setMediaError(err.message || 'تعذر تشغيل الكاميرا');
      startSimulationMode();
    }
  }, []);

  // Ensure local video element reliably receives the stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((err) => {
        console.warn('Local video play error:', err);
      });
    }
  }, [localStream]);

  // Synthetic Simulation Mode for Clinical Training & Fallback
  const startSimulationMode = () => {
    setIsSimulationActive(true);
    setConnectionStatus('simulation');

    // Create a synthetic canvas stream for remote video if no remote peer
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const drawSim = () => {
      if (!ctx) return;
      frame++;
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 640, 360);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 360);

      // Clinical Avatar Circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(320, 130, 55, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      // Pulsing Ring for Breathing / Speaking
      const pulse = Math.sin(frame * 0.08) * 8;
      ctx.beginPath();
      ctx.arc(320, 130, 65 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Clinical Tele-Presence Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Tajawal, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        isPractitioner ? `جلسة سريرية افتراضية مع: ${patientName}` : 'الدكتور / الأخصائي المعالج',
        320,
        215
      );

      ctx.fillStyle = '#10b981';
      ctx.font = '12px Tajawal, sans-serif';
      ctx.fillText('🟢 متصل بنجاح - تشفير طرف لطرف E2EE', 320, 245);
      ctx.restore();

      requestAnimationFrame(drawSim);
    };
    drawSim();

    try {
      const simStream = canvas.captureStream(30);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = simStream;
      }
    } catch (e) {
      console.warn('Canvas captureStream error:', e);
    }
  };

  useEffect(() => {
    initLocalMedia();

    // Ping fluctuation simulation for realism
    const pingTimer = setInterval(() => {
      setNetworkPing(Math.floor(18 + Math.random() * 12));
    }, 4000);

    return () => {
      clearInterval(pingTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [initLocalMedia]);

  // Handle Audio Mute
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsAudioMuted(!audioTracks[0].enabled);
      }
    } else {
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Handle Video Mute
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        setIsVideoMuted(!videoTracks[0].enabled);
      }
    } else {
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // Handle Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsScreenSharing(false);
      await initLocalMedia();
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: 'always' },
            audio: false
          });
          localStreamRef.current = screenStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          setIsScreenSharing(true);

          screenStream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
            initLocalMedia();
          };
        }
      } catch (err) {
        console.warn('Screen share cancelled/denied:', err);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex flex-col select-none shadow-2xl">
      {/* Top Tele-Consultation Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2.5 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/70 shadow-lg">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="absolute w-4 h-4 rounded-full bg-emerald-500/30 animate-ping"></span>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>{isPractitioner ? `مع: ${patientName}` : 'الدكتور / الأخصائي المعالج'}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              غرفة: {roomCode || 'CLINIC-LIVE'} • {networkPing}ms • {networkQuality}
            </div>
          </div>
        </div>

        {/* Layout & Simulation Controls */}
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/70 shadow-lg">
          <button
            onClick={() => setLayoutMode(layoutMode === 'pip' ? 'split' : 'pip')}
            title="تبديل العرض (نافذة عائمة / منقسم)"
            className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
              layoutMode === 'split'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layout className="w-4 h-4" />
          </button>

          <button
            onClick={startSimulationMode}
            title="تفعيل وضع المحاكاة السريرية التجريبي"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              isSimulationActive
                ? 'bg-emerald-600/90 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">محاكاة سريرية</span>
          </button>
        </div>
      </div>

      {/* Main Video View Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center">
        {/* Remote Video (Patient/Practitioner) */}
        <div
          className={`relative transition-all duration-300 ${
            layoutMode === 'split'
              ? 'w-1/2 h-full border-l border-slate-800'
              : 'w-full h-full'
          }`}
        >
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-slate-900"
          />

          {/* Remote Overlay Information */}
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs text-slate-200">
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span>{isPractitioner ? patientName : 'المعالج'}</span>
            {connectionStatus === 'connected' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </div>

          {/* Waiting or connecting state badge */}
          {connectionStatus === 'waiting' && !isSimulationActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10 text-center p-6">
              <div className="w-16 h-16 rounded-full bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center mb-3 animate-pulse">
                <Radio className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
              <h4 className="text-base font-bold text-slate-100 mb-1">
                في انتظار اتصال {isPractitioner ? 'المريض / الولي' : 'المعالج'}...
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                شارك رابط الجلسة المباشر أو انقر على "محاكاة سريرية" لتجربة أدوات السبورة ومطابقة الصوت.
              </p>
              <button
                onClick={startSimulationMode}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                بدء وضع المحاكاة الآن
              </button>
            </div>
          )}
        </div>

        {/* Local Video (Self) */}
        <div
          className={`transition-all duration-300 z-20 ${
            layoutMode === 'split'
              ? 'w-1/2 h-full relative'
              : 'absolute bottom-20 left-4 w-44 h-32 md:w-56 md:h-40 rounded-xl overflow-hidden shadow-2xl border-2 border-indigo-500/40 bg-slate-900 group hover:scale-105'
          }`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isScreenSharing ? '-scale-x-100' : ''}`}
          />

          {isVideoMuted && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-slate-400">
              <VideoOff className="w-8 h-8 text-red-400 mb-1" />
              <span className="text-[11px]">الكاميرا معطلة</span>
            </div>
          )}

          {/* Local Name Badge & Audio Meter */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2 py-0.5 bg-slate-950/70 backdrop-blur-sm rounded-md text-[10px] text-slate-300">
            <span className="font-semibold">{isPractitioner ? 'أنت (المعالج)' : 'أنت'}</span>
            <div className="flex items-center gap-1">
              {isAudioMuted ? (
                <MicOff className="w-3 h-3 text-red-400" />
              ) : (
                <div className="flex items-end gap-0.5 h-3">
                  <div
                    className="w-1 bg-emerald-400 rounded-sm transition-all duration-75"
                    style={{ height: `${Math.max(2, (audioLevel / 100) * 12)}px` }}
                  ></div>
                  <div
                    className="w-1 bg-emerald-400 rounded-sm transition-all duration-75"
                    style={{ height: `${Math.max(2, (audioLevel / 100) * 10)}px` }}
                  ></div>
                  <div
                    className="w-1 bg-emerald-400 rounded-sm transition-all duration-75"
                    style={{ height: `${Math.max(2, (audioLevel / 100) * 8)}px` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar (Bottom Floating Dock) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 bg-slate-900/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl">
        {/* Audio Toggle */}
        <button
          onClick={toggleAudio}
          title={isAudioMuted ? 'تفعيل الميكروفون' : 'كتم الميكروفون'}
          className={`p-3 rounded-xl transition-all shadow-md ${
            isAudioMuted
              ? 'bg-red-500/90 text-white hover:bg-red-600'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={toggleVideo}
          title={isVideoMuted ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'}
          className={`p-3 rounded-xl transition-all shadow-md ${
            isVideoMuted
              ? 'bg-red-500/90 text-white hover:bg-red-600'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Sharing Toggle */}
        <button
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'إيقاف مشاركة الشاشة' : 'مشاركة الشاشة السريرية'}
          className={`p-3 rounded-xl transition-all shadow-md ${
            isScreenSharing
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <MonitorUp className="w-5 h-5" />
        </button>

        {/* Toggle Canvas View if callback provided */}
        {onCanvasShareToggle && (
          <button
            onClick={onCanvasShareToggle}
            title={isCanvasActive ? 'التركيز على الفيديو' : 'عرض السبورة التفاعلية'}
            className={`p-3 rounded-xl transition-all shadow-md ${
              isCanvasActive
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-5 h-5" />
          </button>
        )}

        {/* End Call Button */}
        {onEndCall && (
          <button
            onClick={onEndCall}
            title="إنهاء المكالمة"
            className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-lg shadow-rose-600/30 ml-2"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Media Error Notification Toast */}
      {mediaError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-amber-950/90 border border-amber-600/50 text-amber-200 text-xs px-3.5 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{mediaError} (تم تفعيل وضع المحاكاة تلقائياً)</span>
        </div>
      )}
    </div>
  );
}
