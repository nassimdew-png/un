import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Save,
  Printer,
  Copy,
  Users,
  Mic,
  Headphones,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FastForward,
  Rewind,
  MessageSquare,
  Flame,
  Check
} from 'lucide-react';
import { aiTherapyApi, patientApi } from '../../api';
import StudioActionBar from './StudioActionBar';
import ClinicalReportPrintLetterhead, { ClinicalReportPrintStamp } from './ClinicalReportPrintLetterhead';

export default function AiRadioStudio({ selectedPatient, onSaveToPatient }) {
  const [topicText, setTopicText] = useState('');
  const [tone, setTone] = useState('parent_education');
  const [language, setLanguage] = useState('darja');
  const [duration, setDuration] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [podcastData, setPodcastData] = useState(null);

  // Audio Player State
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [activeDialogueIndex, setActiveDialogueIndex] = useState(0);
  const [speechActive, setSpeechActive] = useState(false);

  // Preset Topics
  const presets = [
    {
      title: '⚡ فرط الحركة وتشتت الانتباه (ADHD) في البيت',
      text: 'إرشادات عملية للأولياء للتعامل مع فرط النشاط، تنظيم جدول الروتين اليومي، وتقليل الاندفاعية بدون توبيخ أو صراخ.',
    },
    {
      title: '🦁 العناد ونوبات الغضب عند الأطفال',
      text: 'استراتيجيات التربية الإيجابية، فن إعطاء الخيارات المحددة، وكيفية احتواء نوبة الغضب بملامسة هادئة وجمل قصيرة.',
    },
    {
      title: '🗣️ التأتأة وصعوبة طلاقة النطق',
      text: 'توجيهات للأولياء لعدم إكمال الكلمات عن الطفل، إعطائه وقتاً كافياً للحديث، وتخفيف الضغط التواصلي داخل الأسرة والمدرسة.',
    },
    {
      title: '📱 الإدمان على الشاشات وبدائل التواصل',
      text: 'خطة تدريجية لتقليل ساعات الشاشات والهواتف، واستبدالها بأنشطة حسية حركية تفاعلية تعزز الذكاء اللغوي والاجتماعي.',
    },
  ];

  // Prefill when patient is selected
  useEffect(() => {
    if (selectedPatient && !topicText) {
      const diag = selectedPatient.diagnosis_primary || 'تأخر لغوي نمائي وتعديل سلوك';
      setTopicText(`توجيهات أسرية وتوعية إذاعية مخصصة لحالة الطفل ${selectedPatient.first_name} (${selectedPatient.age || 6} سنوات) الذي يعاني من: ${diag}.`);
    }
  }, [selectedPatient]);

  // Auto-reload audio element whenever new podcast audio is generated
  useEffect(() => {
    if (podcastData?.audio_url && audioRef.current) {
      audioRef.current.load();
    }
  }, [podcastData?.audio_url]);

  const handleGenerate = async () => {
    if (!topicText.trim()) {
      setError('يرجى كتابة موضوع الحلقة أو اختيار أحد النماذج الجاهزة أولاً.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);

    try {
      const res = await aiTherapyApi.generatePodcast({
        topic_text: topicText,
        tone,
        language,
        duration,
        patient_id: selectedPatient?.id || null,
      });

      if (res.data) {
        setPodcastData(res.data);
      } else {
        throw new Error('لم يتم استلام بيانات الحلقة الإذاعية');
      }
    } catch (err) {
      console.error('Podcast generation error:', err);
      setError(err.message || 'فشل توليد الحلقة الإذاعية. يرجى المحاولة مجدداً.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Audio Playback Controls
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      window.speechSynthesis?.cancel();
      setSpeechActive(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Audio play error, using speech synthesis:', err);
        playSpeechDialogue();
      });
    }
  };

  const playSpeechDialogue = () => {
    if (!podcastData?.dialogue || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeechActive(true);
    setIsPlaying(true);

    let currentIdx = 0;
    const playNextTurn = () => {
      if (currentIdx >= podcastData.dialogue.length) {
        setIsPlaying(false);
        setSpeechActive(false);
        return;
      }
      setActiveDialogueIndex(currentIdx);
      const turn = podcastData.dialogue[currentIdx];
      const utter = new SpeechSynthesisUtterance(turn.text);
      utter.rate = playbackRate;
      utter.lang = language === 'fr' ? 'fr-FR' : 'ar-SA';
      utter.pitch = turn.voice_gender === 'female' ? 1.2 : 0.9;
      utter.onend = () => {
        currentIdx++;
        playNextTurn();
      };
      utter.onerror = () => {
        currentIdx++;
        playNextTurn();
      };
      window.speechSynthesis.speak(utter);
    };
    playNextTurn();
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    setCurrentTime(cur);

    // Sync dialogue highlighting based on estimated time intervals
    if (podcastData?.dialogue?.length && totalDuration > 0) {
      const stepDuration = totalDuration / podcastData.dialogue.length;
      const idx = Math.min(Math.floor(cur / stepDuration), podcastData.dialogue.length - 1);
      setActiveDialogueIndex(idx);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setTotalDuration(audioRef.current.duration || podcastData?.duration_seconds || 60);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleShareWhatsApp = () => {
    if (!podcastData) return;
    const text = `🎙️ استمع إلى حلقة بودكاست العيادة: *${podcastData.episode_title}*\n\n📝 ${podcastData.show_notes}\n\n💡 أهم الإرشادات للأولياء:\n${(podcastData.key_takeaways || []).map(t => `• ${t}`).join('\n')}\n\n🌐 صادر عن منصة PsyPro السريرية.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans" dir="rtl">
      
      {/* LEFT / TOP: Configuration Panel (5 cols) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl print:hidden">
        <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 text-lg">
            🎙️
          </div>
          <div>
            <h3 className="text-sm font-black text-white">استوديو البودكاست الإذاعي</h3>
            <p className="text-xs text-slate-400">تحويل التوجيهات السريرية إلى حوار إذاعي واقعي متعدد الأصوات</p>
          </div>
        </div>

        {/* Selected Patient Demographics */}
        {selectedPatient && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-200 font-bold">الحالة المستهدفة: {selectedPatient.first_name} {selectedPatient.last_name}</span>
            </div>
            <span className="text-[10px] text-amber-300 font-mono">العمر: {selectedPatient.age || 6} سنوات</span>
          </div>
        )}

        {/* Preset Templates */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">✨ نماذج توعوية جاهزة:</label>
          <div className="grid grid-cols-1 gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTopicText(p.text)}
                className="text-right p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-xs text-slate-300 hover:text-white transition flex items-center justify-between group"
              >
                <span className="font-bold line-clamp-1">{p.title}</span>
                <span className="text-[10px] text-slate-500 group-hover:text-amber-400 font-mono">استخدام ↵</span>
              </button>
            ))}
          </div>
        </div>

        {/* Topic Input Textarea */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">
            📝 نص المقال أو التوجيه السريري المراد معالجته إذاعياً:
          </label>
          <textarea
            rows={4}
            value={topicText}
            onChange={(e) => setTopicText(e.target.value)}
            placeholder="اكتب التوجيهات السريرية أو اختر أحد النماذج أعلاه لتحويلها إلى حوار إذاعي إذاعي شيق..."
            className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition resize-none leading-relaxed"
          />
        </div>

        {/* Studio Options Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Tone */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 block">النمط الإذاعي:</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="parent_education">حوار توعوي تفاعلي للأولياء</option>
              <option value="caller_qa">استشارة هاتفية مباشرة مع متصل</option>
              <option value="clinical_discussion">مناقشة سريرية وتدريب مهارات</option>
            </select>
          </div>

          {/* Language */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 block">اللغة والنبرة:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="darja">دارجة جزائرية فصيحة (حوار واقعي)</option>
              <option value="ar">لغة عربية فصحى مبسطة</option>
              <option value="fr">Français Professionnel</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 space-x-reverse transition disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>جارٍ إنتاج الحلقة الإذاعية والمؤثرات الصوتية...</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-slate-950" />
              <span>🎙️ إنتاج الحلقة الإذاعية والبودكاست الآن</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* RIGHT / MAIN: Broadcast Player & Synchronized Script (7 cols) */}
      <div 
        id="printable-report-area"
        className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl min-h-[520px] flex flex-col justify-between print:col-span-12 print:bg-white print:border-none print:shadow-none print:p-0"
      >
        <div className="space-y-6">
          
          {/* Printable Letterhead Header */}
          <ClinicalReportPrintLetterhead
            selectedPatient={selectedPatient}
            reportTitle={podcastData?.episode_title || 'حلقة إذاعية وتثقيف نفسي'}
            specialty="التربية النفسية، الأرطوفونيا والتوعية الأسرية"
          />

          {podcastData ? (
            <div className="space-y-6">
              
              {/* 1. BROADCAST MASTER PLAYER CARD */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 border border-amber-500/30 shadow-2xl space-y-4 print:hidden">
                
                {/* Header & Waveform Animation */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-amber-400 font-mono uppercase tracking-wider block">
                      🔴 BROADCAST LIVE • حلقة بودكاست إذاعية
                    </span>
                    <h3 className="text-base font-black text-white">
                      {podcastData.episode_title}
                    </h3>
                  </div>

                  {/* Visual Sound Equalizer Bar */}
                  <div className="flex items-end space-x-1 space-x-reverse h-8">
                    {[40, 80, 60, 100, 75, 45, 90, 60, 85].map((h, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full bg-amber-400 transition-all duration-300 ${
                          isPlaying ? 'animate-pulse' : 'opacity-30'
                        }`}
                        style={{ height: isPlaying ? `${h}%` : '20%' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Hidden Audio Element */}
                <audio
                  ref={audioRef}
                  src={podcastData.audio_url}
                  preload="auto"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }}
                  onError={(e) => {
                    console.error("Audio Load Error:", e);
                  }}
                  className="hidden"
                />

                {/* Progress Bar Slider */}
                <div className="space-y-1.5">
                  <input
                    type="range"
                    min="0"
                    max={totalDuration || podcastData.duration_seconds || 100}
                    step="0.5"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(totalDuration || podcastData.duration_seconds || 120)}</span>
                  </div>
                </div>

                {/* Playback Controls & Speed */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      type="button"
                      onClick={() => {
                        if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                      title="ترجيع 10 ثوانٍ"
                    >
                      <Rewind className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 transition transform hover:scale-105"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (audioRef.current) audioRef.current.currentTime = Math.min(totalDuration, currentTime + 10);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                      title="تقديم 10 ثوانٍ"
                    >
                      <FastForward className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Playback Speed Toggles */}
                  <div className="flex items-center space-x-1 space-x-reverse bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-mono font-bold">
                    {[1.0, 1.25, 1.5].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handleSpeedChange(rate)}
                        className={`px-2 py-1 rounded-lg transition ${
                          playbackRate === rate ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extra Sharing Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <a
                      href={podcastData.audio_url}
                      download={`podcast_${podcastData.episode_title || 'episode'}.mp3`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition flex items-center space-x-1.5 space-x-reverse"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>تحميل MP3</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs transition flex items-center space-x-1.5 space-x-reverse border border-emerald-500/30"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>إرسال عبر WhatsApp للأولياء</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. SHOW NOTES & KEY TAKEAWAYS */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 print:bg-slate-50 print:border-slate-300">
                <span className="text-xs font-black text-amber-300 print:text-slate-900 block">
                  💡 ملخص الحلقة والنقاط الجوهرية (Show Notes):
                </span>
                <p className="text-xs text-slate-200 print:text-slate-800 leading-relaxed">
                  {podcastData.show_notes}
                </p>

                {podcastData.key_takeaways && (
                  <div className="pt-2 border-t border-amber-500/20 space-y-1">
                    <span className="text-[11px] font-bold text-amber-400 print:text-slate-800 block">أهم التوصيات العملية:</span>
                    <ul className="space-y-1 text-xs text-slate-300 print:text-slate-800 list-disc pr-4">
                      {podcastData.key_takeaways.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 3. SYNCHRONIZED DIALOGUE SCRIPT */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-300 print:text-slate-900 border-b border-slate-800 pb-2">
                  🎙️ سيناريو الحوار الإذاعي الكامل (Radio Script):
                </h4>

                <div className="space-y-3">
                  {podcastData.dialogue.map((turn, idx) => {
                    const isCurrent = activeDialogueIndex === idx;
                    const isHost = turn.speaker_role === 'host';
                    const isCaller = turn.speaker_role === 'caller';

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500/50 print:bg-white print:border-slate-300'
                            : 'bg-slate-950 border-slate-800/80 print:bg-white print:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-base">
                              {isHost ? '🎙️' : isCaller ? '📞' : '👩‍⚕️'}
                            </span>
                            <span className={`text-xs font-black ${
                              isHost ? 'text-amber-400' : isCaller ? 'text-rose-400' : 'text-teal-400'
                            } print:text-slate-900`}>
                              {turn.speaker_name}
                            </span>
                          </div>

                          {turn.emotion && (
                            <span className="text-[10px] bg-slate-900 print:bg-slate-100 text-slate-400 print:text-slate-600 px-2 py-0.5 rounded-full font-mono">
                              نبرة: {turn.emotion}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-200 print:text-slate-800 leading-relaxed font-sans">
                          {turn.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Specialist Stamp in Print Mode */}
              <ClinicalReportPrintStamp practitionerName="فريق التثقيف النفسي والإذاعي" />
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2 print:hidden">
              <Headphones className="w-12 h-12 text-slate-600" />
              <h4 className="text-xs font-bold text-slate-400">في انتظار إنتاج الحلقة الإذاعية</h4>
              <p className="text-[11px] text-slate-500 max-w-xs">
                حدد الموضوع أو اختر نموذجاً من القائمة الجانبية واضغط على زر الإنتاج لإنشاء البرنامج الإذاعي الكامل.
              </p>
            </div>
          )}
        </div>

        {/* Action Bar */}
        {podcastData && (
          <StudioActionBar
            selectedPatient={selectedPatient}
            toolType="social_story"
            title={`حلقة إذاعية: ${podcastData.episode_title}`}
            summary={podcastData.show_notes}
            payload={podcastData}
            onSaved={onSaveToPatient}
          />
        )}

      </div>
    </div>
  );
}
