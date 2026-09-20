import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  Layers,
  PhoneOff,
  AlertCircle,
  HelpCircle,
  Volume2,
  Camera,
  Layout,
  RotateCcw
} from 'lucide-react';
import WebRtcVideoGrid from './WebRtcVideoGrid';
import ClinicalInteractiveCanvas from './ClinicalInteractiveCanvas';

export default function PublicPatientTeletherapyRoom() {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Green room & credentials
  const [patientName, setPatientName] = useState('المراجع الكريم');
  const [enteredPin, setEnteredPin] = useState(searchParams.get('pin') || '');
  const [inCall, setInCall] = useState(false);
  const [activeTab, setActiveTab] = useState('video'); // Default to live video call! 'video' | 'combined' | 'canvas'

  // Pre-call test stream
  const [previewStream, setPreviewStream] = useState(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isRequestingMedia, setIsRequestingMedia] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const previewVideoRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);

  // Independent Video & Audio acquisition with device enumeration
  const startPreview = useCallback(async (targetCamId = null) => {
    setIsRequestingMedia(true);
    setMediaError(null);
    setVideoError(null);

    // Stop existing preview stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك لا يدعم الوصول إلى الكاميرا. يرجى استخدام Google Chrome أو Edge.');
      }

      // 1. Enumerate devices to discover all connected webcams
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const vDevs = devs.filter((d) => d.kind === 'videoinput');
        setCameraDevices(vDevs);
        if (!targetCamId && vDevs.length > 0 && !selectedCameraId) {
          setSelectedCameraId(vDevs[0].deviceId);
        }
      } catch (enumErr) {
        console.warn('Enumerate devices warning:', enumErr);
      }

      const activeCamId = targetCamId || selectedCameraId;

      // 2. Independent Video Acquisition
      let vStream = null;
      let vErr = null;
      try {
        const vConstraints = activeCamId
          ? { deviceId: { exact: activeCamId } }
          : true;
        vStream = await navigator.mediaDevices.getUserMedia({ video: vConstraints });
      } catch (err1) {
        console.warn('Specific video constraint failed, attempting generic video: true', err1);
        try {
          vStream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (err2) {
          console.warn('All video acquisition attempts failed:', err2);
          vErr = err2;
        }
      }

      // 3. Independent Audio Acquisition
      let aStream = null;
      try {
        aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (aErr) {
        console.warn('Audio acquisition error:', aErr);
      }

      // 4. Combine Video and Audio tracks
      const combined = new MediaStream();
      let hasV = false;

      if (vStream && vStream.getVideoTracks().length > 0) {
        vStream.getVideoTracks().forEach((t) => combined.addTrack(t));
        hasV = true;
      }
      if (aStream && aStream.getAudioTracks().length > 0) {
        aStream.getAudioTracks().forEach((t) => combined.addTrack(t));
      }

      setHasVideo(hasV);

      if (!hasV && vErr) {
        let msg = 'تعذر تشغيل الكاميرا.';
        if (vErr.name === 'NotAllowedError' || vErr.name === 'PermissionDeniedError') {
          msg = 'تم حظر إذن الكاميرا من المتصفح 🚫. يرجى النقر على أيقونة القفل أو الكاميرا بجانب شريط العنوان واختيار "سماح / Allow".';
        } else if (vErr.name === 'NotReadableError' || vErr.name === 'TrackStartError') {
          msg = 'الكاميرا قيد الاستخدام حالياً من برنامج آخر ⚠️ (مثل Zoom أو Teams أو Skype أو نافذة أخرى). يرجى إغلاقها ثم النقر على إعادة المحاولة.';
        } else if (vErr.name === 'NotFoundError' || vErr.name === 'DevicesNotFoundError') {
          msg = 'لم يتم العثور على أي كاميرا موصولة بالجهاز 🔌.';
        } else if (vErr.name === 'OverconstrainedError') {
          msg = 'دقة الكاميرا المطلوبة غير مدعومة من هذا الجهاز.';
        }
        setVideoError(msg);
      }

      streamRef.current = combined;
      setPreviewStream(combined);

      // 5. Audio meter setup
      if (combined.getAudioTracks().length > 0) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          try {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128;
            const src = ctx.createMediaStreamSource(combined);
            src.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVol = () => {
              if (!audioContextRef.current) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              setAudioLevel(Math.min(100, Math.round((sum / dataArray.length) * 1.5)));
              requestAnimationFrame(checkVol);
            };
            checkVol();
          } catch (err) {
            console.warn('Audio analyzer error:', err);
          }
        }
      }
    } catch (generalErr) {
      console.warn('General media error:', generalErr);
      setMediaError(generalErr.message);
    } finally {
      setIsRequestingMedia(false);
    }
  }, [selectedCameraId]);

  // Setup Green Room Preview on mount
  useEffect(() => {
    if (!inCall) {
      startPreview();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [inCall, startPreview]);

  // Ensure preview video element attaches stream reliably
  useEffect(() => {
    if (previewVideoRef.current) {
      if (previewStream && hasVideo) {
        previewVideoRef.current.srcObject = previewStream;
        previewVideoRef.current.muted = true;
        previewVideoRef.current.playsInline = true;
        previewVideoRef.current.play().catch((e) => {
          console.warn('Preview video play promise error:', e);
        });
      } else {
        previewVideoRef.current.srcObject = null;
      }
    }
  }, [previewStream, hasVideo]);

  const handleJoinCall = (e) => {
    e.preventDefault();
    // Stop preview stream before entering full call component so WebRtcVideoGrid gets clean device access
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setPreviewStream(null);
    setInCall(true);
  };

  // IF IN CALL: Full interactive experience
  if (inCall) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden" dir="rtl">
        {/* Top Header */}
        <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              📹
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <span>جلسة التطبيب عن بعد التفاعلية</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="text-[10px] text-slate-400">
                مرحباً {patientName} • اتصال مشفر E2EE
              </div>
            </div>
          </div>

          {/* Switcher Tab between Video & Board */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'video'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>الكاميرا المباشرة 📹</span>
            </button>
            <button
              onClick={() => setActiveTab('combined')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'combined'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>عرض مدمج 🖼️</span>
            </button>
            <button
              onClick={() => setActiveTab('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'canvas'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>السبورة 🎨</span>
            </button>
          </div>

          {/* Leave Button */}
          <button
            onClick={() => {
              if (window.confirm('هل تود مغادرة الجلسة الآن؟')) {
                setInCall(false);
              }
            }}
            className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl border border-rose-500/30 transition-all text-xs flex items-center gap-1.5"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">مغادرة</span>
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden p-2 flex">
          {activeTab === 'video' && (
            <div className="w-full h-full relative rounded-2xl overflow-hidden">
              <WebRtcVideoGrid
                roomCode={roomCode}
                patientName={patientName}
                isPractitioner={false}
                onCanvasShareToggle={() => setActiveTab('canvas')}
                isCanvasActive={false}
                onEndCall={() => setInCall(false)}
              />
            </div>
          )}

          {activeTab === 'combined' && (
            <div className="w-full h-full relative rounded-2xl overflow-hidden flex gap-2">
              <div className="flex-1 h-full relative rounded-2xl overflow-hidden">
                <ClinicalInteractiveCanvas isPractitioner={false} />
              </div>
              <div className="w-80 h-full border-r border-slate-800 bg-slate-900 rounded-2xl overflow-hidden">
                <WebRtcVideoGrid
                  roomCode={roomCode}
                  patientName={patientName}
                  isPractitioner={false}
                  isCanvasActive={true}
                  onEndCall={() => setInCall(false)}
                />
              </div>
            </div>
          )}

          {activeTab === 'canvas' && (
            <div className="w-full h-full relative rounded-2xl overflow-hidden">
              <ClinicalInteractiveCanvas isPractitioner={false} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // GREEN ROOM PREVIEW & JOIN FORM
  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 select-none font-sans" dir="rtl">
      <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8">
        {/* Clinic Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-3 text-2xl">
            🏥
          </div>
          <h2 className="text-xl font-black text-slate-100 mb-1">
            قاعة الاستشارة المرئية عن بعد
          </h2>
          <p className="text-xs text-slate-400">
            منصة PsyPro للرعاية السريرية • جلسة مباشرة مشفرة بدون برامج خارجية
          </p>
        </div>

        {/* Camera & Mic Test Box */}
        <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 mb-6 shadow-inner flex items-center justify-center group">
          <video
            ref={previewVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover -scale-x-100 ${!hasVideo ? 'hidden' : 'block'}`}
          />

          {/* When Video is not active (blocked, busy, or no webcam) */}
          {!hasVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 text-center p-5 bg-slate-950/95 z-10">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-2.5 text-rose-400">
                <VideoOff className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-100 mb-1">
                {videoError ? 'تعذر تشغيل صورة الكاميرا' : 'الكاميرا غير مفعلة حالياً'}
              </p>
              <p className="text-[11px] text-amber-300/90 max-w-sm mb-3 leading-relaxed bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-right font-sans">
                {videoError || 'الميكروفون يعمل، ولكن لم يتم استلام تيار الصورة من الكاميرا. يرجى التأكد من عدم استخدام الكاميرا في برنامج آخر (مثل Zoom أو Teams) والتأكد من إعطاء المتصفح إذن الكاميرا.'}
              </p>

              {/* Camera device selection dropdown */}
              {cameraDevices.length > 1 && (
                <div className="mb-3 w-full max-w-xs text-right">
                  <label className="text-[10px] text-slate-400 block mb-1">اختيار كاميرا أخرى:</label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startPreview(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    {cameraDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `كاميرا ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startPreview()}
                  disabled={isRequestingMedia}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRequestingMedia ? 'animate-spin' : ''}`} />
                  <span>{isRequestingMedia ? 'جاري الفحص...' : 'إعادة محاولة تشغيل الكاميرا 🔄'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Test Badges */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/60 text-xs z-20">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasVideo ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              <span className="text-slate-300 font-medium">
                {hasVideo ? 'الكاميرا نشطة ✅' : 'الكاميرا متوقفة ⚠️'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-emerald-300 font-mono">الصوت يعمل</span>
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-75"
                  style={{ width: `${audioLevel}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoinCall} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسم المريض / الولي:
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="مثال: أحمد أمين بن علي"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              رمز الدخول السريع (PIN):
            </label>
            <input
              type="text"
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              placeholder="أدخل الرمز المرفق في رسالة الدعوة"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 font-mono tracking-widest text-center focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>انضمام فوري للجلسة السريرية</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>تشفير سريري آمن (E2EE)</span>
          </div>
          <span>غرفة: {roomCode}</span>
        </div>
      </div>
    </div>
  );
}
