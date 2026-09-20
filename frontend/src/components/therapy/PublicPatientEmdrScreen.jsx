import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Brain,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Sparkles,
  Activity,
  CheckCircle2,
  Radio,
  Eye,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { apiRequest } from '../../api';

export default function PublicPatientEmdrScreen() {
  const { sessionCode: routeSessionCode } = useParams();
  const [searchParams] = useSearchParams();
  const sessionCode = routeSessionCode || searchParams.get('code') || 'EMDR-LIVE';

  // Remote Sync State
  const [isConnected, setIsConnected] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Synchronized BLS State
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5); // 1-10
  const [movementPattern, setMovementPattern] = useState('horizontal'); // 'horizontal' | 'infinity'
  const [dotColor, setDotColor] = useState('#0d9488');
  const [dotSize, setDotSize] = useState(38);
  const [passesPerSet, setPassesPerSet] = useState(24);
  const [currentPass, setCurrentPass] = useState(0);
  const [completedSetsCount, setCompletedSetsCount] = useState(0);

  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundTone, setSoundTone] = useState('sine_440');
  const [soundVolume, setSoundVolume] = useState(0.5);

  // Therapist Guidance text
  const [therapistGuidance, setTherapistGuidance] = useState('جلسة EMDR مباشرة - ركز نظرك على النقطة وتنفس بهدوء...');

  // Animation & Audio Refs
  const animFrameRef = useRef(null);
  const lightbarContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const dotPosRef = useRef({ x: 0, y: 0.5, dir: 1, angle: 0 });
  const [dotCoords, setDotCoords] = useState({ x: 0, y: 50 });

  // Broadcast Channel Ref
  const broadcastChannelRef = useRef(null);

  // =========================================================================
  // 1. INITIALIZE BROADCAST CHANNEL & STORAGE LISTENER
  // =========================================================================
  useEffect(() => {
    // 1. Setup BroadcastChannel for 0-latency dual-monitor sync
    try {
      const channelName = `psypro_emdr_channel_${sessionCode}`;
      const channel = new BroadcastChannel(channelName);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (!event.data) return;
        handleIncomingState(event.data);
      };

      // Announce presence
      channel.postMessage({ type: 'PATIENT_SCREEN_JOINED', timestamp: Date.now() });
    } catch (e) {
      console.warn('BroadcastChannel not supported in this browser environment', e);
    }

    // 2. Storage event listener fallback
    const handleStorage = (e) => {
      if (e.key === `psypro_emdr_state_${sessionCode}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleIncomingState(parsed);
        } catch (err) {
          // ignore json parse err
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Fallback Initial Remote State Fetch & Polling (every 2s for remote teletherapy)
    fetchRemoteState();
    const pollInterval = setInterval(fetchRemoteState, 2000);

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
    };
  }, [sessionCode]);

  const handleIncomingState = (data) => {
    if (!data) return;
    setIsConnected(true);

    if (data.is_playing !== undefined) setIsPlaying(Boolean(data.is_playing));
    if (data.speed !== undefined) setSpeed(Number(data.speed));
    if (data.movement_pattern !== undefined) setMovementPattern(data.movement_pattern);
    if (data.dot_color !== undefined) setDotColor(data.dot_color);
    if (data.dot_size !== undefined) setDotSize(Number(data.dot_size));
    if (data.passes_per_set !== undefined) setPassesPerSet(Number(data.passes_per_set));
    if (data.current_pass !== undefined) setCurrentPass(Number(data.current_pass));
    if (data.completed_sets !== undefined) setCompletedSetsCount(Number(data.completed_sets));
    if (data.sound_enabled !== undefined) setSoundEnabled(Boolean(data.sound_enabled));
    if (data.sound_tone !== undefined) setSoundTone(data.sound_tone);
    if (data.sound_volume !== undefined) setSoundVolume(Number(data.sound_volume));
    if (data.therapist_guidance !== undefined) setTherapistGuidance(data.therapist_guidance);
  };

  const fetchRemoteState = async () => {
    try {
      const res = await apiRequest(`/public/emdr/${sessionCode}/sync`, { method: 'GET' });
      if (res && res.state) {
        handleIncomingState(res.state);
      }
    } catch (e) {
      // ignore network errors for local setups
    }
  };

  // =========================================================================
  // 2. WEB AUDIO API SOUND ENGINE (True Left-Right Binaural Panner)
  // =========================================================================
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setAudioUnlocked(true);
  };

  const playBinauralTone = (panValue = 0) => {
    if (!soundEnabled || soundVolume <= 0) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const duration = 0.09;

      let pannerNode;
      if (ctx.createStereoPanner) {
        pannerNode = ctx.createStereoPanner();
        pannerNode.pan.setValueAtTime(panValue, now);
      }

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(soundVolume * 0.22, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      if (soundTone === 'soft_click') {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        if (pannerNode) {
          noise.connect(pannerNode);
          pannerNode.connect(gainNode);
        } else {
          noise.connect(gainNode);
        }
        gainNode.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + duration);
      } else {
        const osc = ctx.createOscillator();
        if (soundTone === 'solfeggio_528') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(528, now);
        } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
        }

        if (pannerNode) {
          osc.connect(pannerNode);
          pannerNode.connect(gainNode);
        } else {
          osc.connect(gainNode);
        }
        gainNode.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      }
    } catch (e) {
      // audio error safely caught
    }
  };

  // =========================================================================
  // 3. ANIMATION TICK LOOP
  // =========================================================================
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();

    const animate = (currentTime) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const baseSpeed = 0.35 + (speed - 1) * 0.18; // speed multiplier

      if (movementPattern === 'horizontal') {
        let { x, dir } = dotPosRef.current;
        x += dir * baseSpeed * delta;

        if (x >= 1) {
          x = 1;
          dir = -1;
          playBinauralTone(1); // Right ear
        } else if (x <= 0) {
          x = 0;
          dir = 1;
          playBinauralTone(-1); // Left ear
        }

        dotPosRef.current = { x, y: 0.5, dir, angle: 0 };
        setDotCoords({ x: x * 100, y: 50 });
      } else if (movementPattern === 'infinity') {
        let { angle } = dotPosRef.current;
        angle += baseSpeed * 2.8 * delta;

        const xNorm = (Math.sin(angle) + 1) / 2;
        const yNorm = (Math.sin(2 * angle) + 1) / 2;

        if (Math.sin(angle) >= 0.98 && dotPosRef.current.dir !== 1) {
          playBinauralTone(1);
          dotPosRef.current.dir = 1;
        } else if (Math.sin(angle) <= -0.98 && dotPosRef.current.dir !== -1) {
          playBinauralTone(-1);
          dotPosRef.current.dir = -1;
        }

        dotPosRef.current = { x: xNorm, y: yNorm, dir: dotPosRef.current.dir, angle };
        setDotCoords({ x: xNorm * 100, y: yNorm * 100 });
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speed, movementPattern, soundEnabled, soundTone, soundVolume]);

  // Fullscreen helper
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullScreen(false)).catch(() => {});
      }
    }
  };

  return (
    <div
      onClick={initAudioContext}
      className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none overflow-hidden font-sans relative"
      dir="rtl"
    >
      {/* Top Subtle Zen Navigation Bar */}
      <header className="p-4 flex items-center justify-between z-20 bg-slate-950/40 backdrop-blur-sm border-b border-slate-900/60">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white tracking-wide">
                شاشة التحفيز الثنائي EMDR & BLS
              </span>
              <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                <Radio className={`w-2.5 h-2.5 ${isPlaying ? 'text-teal-400 animate-pulse' : 'text-slate-500'}`} />
                <span>جلسة: {sessionCode}</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500">متزامنة لحظياً وبشكل مباشر مع قمرة الأخصائي المعالج</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Enable / Status Indicator */}
          {!audioUnlocked ? (
            <button
              type="button"
              onClick={initAudioContext}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-600/30 animate-pulse"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>تفعيل الصوت في السماعات 🎧</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-teal-400 font-bold">
              <Volume2 className="w-3 h-3 text-teal-400" />
              <span>السماعات نشطة</span>
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullScreen}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition shadow-sm"
            title="ملء الشاشة"
          >
            {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Center Immersive Bilateral Visual Arena */}
      <main
        ref={lightbarContainerRef}
        className="flex-1 relative w-full h-full flex items-center justify-center p-6 sm:p-12 overflow-hidden"
      >
        {/* Visual Focus Background Guide Track */}
        <div className="absolute inset-x-8 sm:inset-x-16 h-1 bg-slate-900/80 rounded-full border border-slate-800/60 pointer-events-none" />

        {/* Moving Dynamic BLS Dot */}
        <div
          className="absolute transition-transform will-change-transform pointer-events-none"
          style={{
            left: `${dotCoords.x}%`,
            top: `${dotCoords.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="rounded-full shadow-2xl transition-all duration-75"
            style={{
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              backgroundColor: dotColor,
              boxShadow: `0 0 ${dotSize * 1.2}px ${dotColor}, 0 0 ${dotSize * 2}px ${dotColor}80`,
            }}
          />
        </div>

        {/* Calm Central Focus Aid (subtle dot) */}
        {!isPlaying && (
          <div className="text-center space-y-3 z-10 animate-in fade-in duration-300 max-w-md bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">الاستعداد لجولة التحفيز الثنائي</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ضع سماعات الأذن، تنفس بعمق وهدوء. ستبدأ النقطة الضوئية بالحركة تلقائياً بمجرد إطلاق الأخصائي للجولة.
            </p>
            {!audioUnlocked && (
              <button
                type="button"
                onClick={initAudioContext}
                className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition"
              >
                انقر هنا لاختبار وتفعيل نغمات الأذن (Binaural Audio)
              </button>
            )}
          </div>
        )}
      </main>

      {/* Bottom Gentle Guidance Bar */}
      <footer className="p-4 z-20 bg-slate-950/50 backdrop-blur-sm border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-right">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          <span className="font-bold text-slate-300">{therapistGuidance}</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
            <span className="text-emerald-400 font-bold">بث حي متزامن</span>
          </span>
          <span>•</span>
          <span>السرعة: {speed}/10</span>
          <span>•</span>
          <span>الدورات: {completedSetsCount}</span>
        </div>
      </footer>
    </div>
  );
}
