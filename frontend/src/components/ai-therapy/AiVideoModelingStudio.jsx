import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  Share2,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Film,
  Layers,
  Clock,
  Eye,
  Check,
  Zap,
  Repeat,
  Radio,
  Tv,
  Smartphone,
  Square
} from 'lucide-react';
import { aiVideoStudioApi } from '../../api';

export default function AiVideoModelingStudio({ selectedPatient, onSaveToPatient }) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState('social_story');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [pollingStatus, setPollingStatus] = useState(null); // 'queued', 'processing', 'completed', 'failed'
  const [activeVideo, setActiveVideo] = useState(null);
  const [error, setError] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [videosList, setVideosList] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Video Player Ref
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);

  const presets = [
    {
      title: 'انتظار الدور واحترام الطابور في المدرسة',
      category: 'social_story',
      prompt: 'قصة اجتماعية بصرية لنمذجة السلوك: طفل يقف بهدوء في الصف مع زملائه في المدرسة، ينتظر دوره بابتسامة وصبر، ثم يستلم وجبته بسعادة وفخر.',
    },
    {
      title: 'التعامل مع الأصوات العالية والضجيج',
      category: 'social_story',
      prompt: 'قصة نمذجة بصرية: طفل يسمع صوتاً عالياً في الشارع، يأخذ نفساً عميقاً ويضع يديه بلطف على أذنيه بهدوء حتى ينتهي الصوت ويبتسم مطمئناً.',
    },
    {
      title: 'تمرين التنفس الهادئ: فقاعات الصابون',
      category: 'breathing_visual',
      prompt: 'تمرين تنفس بصري مهدئ للأطفال: طفل ينفخ فقاعات صابون ملونة وكبيرة تسبح في الهواء برقة مع أنغام هادئة للاسترخاء وتنظيم ضربات القلب.',
    },
    {
      title: 'ريلز توعوي: نصائح للحد من شاشات الهواتف',
      category: 'clinic_reel',
      prompt: 'مقطع ريلز توعوي قصير للأولياء: مقارنة بين طفل يقضي وقته على الشاشة بمفرده وطفل يشارك أسرته ألعاباً تركيبية حركية تفاعلية ممتعة.',
    },
  ];

  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      const res = await aiVideoStudioApi.getVideos();
      if (res.success) {
        setVideosList(res.videos || []);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // Prefill when patient is selected
  useEffect(() => {
    if (selectedPatient && !title) {
      setTitle(`قصة اجتماعية ونمذجة بصرية: ${selectedPatient.first_name}`);
      setPrompt(`نمذجة سلوكية تفاعلية للطفل ${selectedPatient.first_name}: مهارة التعبير عن المشاعر والمشاركة مع الأصدقاء برفق وهدوء.`);
    }
  }, [selectedPatient]);

  // Polling Loop for Async Video Generation
  useEffect(() => {
    let interval;
    if (activeJobId && (pollingStatus === 'queued' || pollingStatus === 'processing')) {
      interval = setInterval(async () => {
        try {
          const res = await aiVideoStudioApi.getVideoStatus(activeJobId);
          if (res.success && res.video) {
            setPollingStatus(res.video.status);
            if (res.video.status === 'completed') {
              setActiveVideo(res.video);
              setActiveJobId(null);
              setIsSubmitting(false);
              loadVideos();
            } else if (res.video.status === 'failed') {
              setError(res.video.error_message || 'فشل توليد الفيديو.');
              setActiveJobId(null);
              setIsSubmitting(false);
            }
          }
        } catch (err) {
          console.warn('Polling error:', err);
        }
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [activeJobId, pollingStatus]);

  const handleSelectPreset = (p) => {
    setTitle(p.title);
    setCategory(p.category);
    setPrompt(p.prompt);
    if (p.category === 'clinic_reel') {
      setAspectRatio('9:16');
    } else {
      setAspectRatio('16:9');
    }
  };

  const handleGenerate = async () => {
    if (!title.trim() || !prompt.trim()) {
      setError('يرجى كتابة عنوان ووصف الفيديو أو اختيار نموذج جاهز أولاً.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await aiVideoStudioApi.generateVideo({
        title: title.trim(),
        prompt: prompt.trim(),
        category,
        aspect_ratio: aspectRatio,
        patient_id: selectedPatient?.id || null,
      });

      if (res.video_id) {
        setActiveJobId(res.video_id);
        setPollingStatus(res.video.status || 'queued');
      } else {
        throw new Error(res.message || 'فشل إدراج الفيديو في المعالجة.');
      }
    } catch (err) {
      console.error('Video request error:', err);
      setError(err.message || 'تعذر بدء توليد الفيديو. يرجى المحاولة ثانية.');
      setIsSubmitting(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleShareWhatsApp = () => {
    if (!activeVideo?.video_url) return;
    const text = `🎬 شاهد فيديو النمذجة البصرية والتثقيف السريري: *${activeVideo.title}*\n\n🔗 الرابط: ${activeVideo.video_url}\n\n🌐 صادر عن منصة PsyPro السريرية.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSaveToPatient = () => {
    if (!activeVideo || !selectedPatient) return;
    if (onSaveToPatient) {
      onSaveToPatient(activeVideo);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans text-right" dir="rtl">
      
      {/* 1. LEFT: Video Generator Settings Form (5 cols) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20 text-lg">
            🎬
          </div>
          <div>
            <h3 className="text-sm font-black text-white">استوديو النمذجة البصرية والفيديو</h3>
            <p className="text-xs text-slate-400">توليد مقاطع قصص اجتماعية وتمارين متحركة بالذكاء الاصطناعي</p>
          </div>
        </div>

        {/* Selected Patient Demographics */}
        {selectedPatient && (
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-200 font-bold">الحالة المستهدفة: {selectedPatient.first_name} {selectedPatient.last_name}</span>
            </div>
            <span className="text-[10px] text-cyan-300 font-mono">العمر: {selectedPatient.age || 6} سنوات</span>
          </div>
        )}

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">✨ نماذج سيناريوهات سريرية جاهزة:</label>
          <div className="grid grid-cols-1 gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-right border border-slate-800 hover:border-cyan-500/40 transition group flex items-start space-x-2 space-x-reverse"
              >
                <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 text-xs mt-0.5">
                  ▶
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition">{p.title}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">عنوان المقطع أو القصة المتحركة:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: قصة اجتماعية لانتظار الدور في الروضة"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Category & Aspect Ratio */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">فئة الفيديو:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="social_story">📖 قصة اجتماعية متحركة</option>
              <option value="breathing_visual">🫁 تمرين تنفس واسترخاء</option>
              <option value="therapy_exercise">🎯 نمذجة تمرين سريري</option>
              <option value="clinic_reel">📱 ريلز توعوي للعيادة</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">أبعاد العرض:</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="16:9">🎬 16:9 شاشة عريضة</option>
              <option value="9:16">📱 9:16 تيك توك وريلز</option>
              <option value="1:1">⏹️ 1:1 مربع</option>
            </select>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">تفاصيل السيناريو البصري والسلوكي:</label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="صف المشهد وحركة الشخصية، التعبير الانفعالي، والنتيجة السلوكية المرجوة..."
            className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition resize-none leading-relaxed"
          />
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isSubmitting || !title.trim() || !prompt.trim()}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs transition flex items-center justify-center space-x-2 space-x-reverse shadow-lg shadow-cyan-600/25 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>جارٍ إنتاج الفيديو في قائمة المعالجة...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>🚀 توليد الفيديو المتحرك والتعليق الصوتي الآن</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 2. RIGHT: Active Video Player Canvas & Video Gallery (7 cols) */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl min-h-[520px] flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* Active Generation Progress Tracker */}
          {isSubmitting && activeJobId && (
            <div className="p-6 rounded-3xl bg-slate-950 border border-cyan-500/30 space-y-4 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-400 flex items-center space-x-2 space-x-reverse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>خط المعالجة غير المتزامن (Background Pipeline)</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
                  الحالة: {pollingStatus === 'processing' ? 'قيد المعالجة والرسم' : 'في قائمة الانتظار'}
                </span>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 text-center">
                  1. إخراج المشاهد 📝
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 text-center">
                  2. رسم الإطارات 🎨
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 text-center">
                  3. التعليق الصوتي 🎙️
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 text-center">
                  4. تصدير MP4 🎬
                </div>
              </div>
            </div>
          )}

          {/* Active Video Player */}
          {activeVideo ? (
            <div className="space-y-4">
              <div className="rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl relative aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={activeVideo.video_url}
                  poster={activeVideo.thumbnail_url}
                  controls
                  loop={isLooping}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Video Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">{activeVideo.title}</h4>
                  <div className="flex items-center space-x-3 space-x-reverse text-[11px] text-slate-400 font-mono">
                    <span>الفئة: <strong className="text-cyan-300">{activeVideo.category}</strong></span>
                    <span>•</span>
                    <span>الأبعاد: <strong className="text-white">{activeVideo.aspect_ratio || '16:9'}</strong></span>
                    <span>•</span>
                    <span>المدة: <strong className="text-emerald-400">{activeVideo.duration_seconds || 8}s</strong></span>
                  </div>
                </div>

                {/* Player Controls & Actions */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <a
                    href={activeVideo.video_url}
                    download={`${activeVideo.title}.mp4`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل MP4</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition"
                    title="مشاركة عبر واتساب"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {selectedPatient && (
                    <button
                      type="button"
                      onClick={handleSaveToPatient}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse shadow-md"
                    >
                      {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{savedSuccess ? 'تم الإرفاق' : 'إرفاق بالمريض'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : !isSubmitting ? (
            <div className="h-72 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-800 rounded-3xl p-8">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-2xl">
                🎬
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">مشغل الفيديو والنمذجة البصرية جاهز</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  اختر سيناريو سريري أو قصة اجتماعية واضغط على زر التوليد لمعالجة وتصدير فيديو MP4 متحرك بالصوت والصورة.
                </p>
              </div>
            </div>
          ) : null}

          {/* 3. Generated Clinical Videos Gallery */}
          {videosList.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-2 space-x-reverse">
                  <Film className="w-4 h-4 text-cyan-400" />
                  <span>معرض الفيديوهات المولدة في العيادة ({videosList.length}):</span>
                </h4>

                <button
                  type="button"
                  onClick={loadVideos}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                  title="تحديث المعرض"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingVideos ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {videosList.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => { setActiveVideo(v); setIsPlaying(false); }}
                    className="group rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-cyan-500 cursor-pointer transition space-y-2 p-2"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                      {v.thumbnail_url ? (
                        <img
                          src={v.thumbnail_url}
                          alt={v.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <Film className="w-6 h-6 text-slate-600" />
                      )}
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs shadow-lg">
                          ▶
                        </div>
                      </div>
                    </div>
                    <div className="space-y-0.5 px-1">
                      <div className="text-xs font-bold text-slate-200 truncate">{v.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{v.created_at ? new Date(v.created_at).toLocaleDateString('ar-DZ') : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
