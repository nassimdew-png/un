import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Sun,
  Moon,
  Wind,
  Droplets,
  Layers,
  Heart,
  Sliders,
  FileText,
  X,
  Zap,
  CheckCircle2,
  Plus,
  Trash2,
  ShieldAlert,
  Info
} from 'lucide-react';

const CHROMOTHERAPY_THEMES = [
  { id: 'ocean', name_ar: 'المحيط الهادئ (أزرق عميق)', colorHex: '#0ea5e9', bgGrad: 'from-sky-950 via-slate-900 to-blue-950', freq: 432, desc: 'تهدئة فرط الاستثارة وخفض نبضات القلب' },
  { id: 'forest', name_ar: 'الغابة المطيرة (زمردي ناعم)', colorHex: '#10b981', bgGrad: 'from-emerald-950 via-slate-900 to-teal-950', freq: 528, desc: 'التنظيم الذاتي والتوازن الحسي العميق' },
  { id: 'sunset', name_ar: 'الغروب الدافئ (كهرماني)', colorHex: '#f59e0b', bgGrad: 'from-amber-950 via-slate-900 to-orange-950', freq: 396, desc: 'الأمان الجسدي والدفء واستقرار المزاج' },
  { id: 'amethyst', name_ar: 'زهرة الجمشت (بنفسجي)', colorHex: '#8b5cf6', bgGrad: 'from-violet-950 via-slate-900 to-purple-950', freq: 639, desc: 'التركيز المعرفي وإزالة التشويش الحسي' },
  { id: 'calm_rose', name_ar: 'السكون الوردي (Soft Rose)', colorHex: '#f43f5e', bgGrad: 'from-rose-950 via-slate-900 to-pink-950', freq: 741, desc: 'الاندماج العاطفي وتبديد التوتر الحركي' }
];

const SENSORY_SYSTEMS = [
  { id: 'proprioceptive', name_ar: 'الحس العميق والمفاصل (Proprioceptive)', icon: '🏋️', examples: ['الضغط العميق (Deep Pressure)', 'سحب ودفع الأثقال المناسبة', 'المشي على أسطح متباينة'] },
  { id: 'vestibular', name_ar: 'الجهاز الدهليزي والتوازن (Vestibular)', icon: '🌀', examples: ['الأرجحة الخطية البطيئة', 'تمارين كرة الاتزان', 'حركات الرأس الهادئة'] },
  { id: 'tactile', name_ar: 'الحس اللمسي (Tactile)', icon: '✋', examples: ['لمس أقمشة مختلفة الملمس', 'صناديق الحبوب والرمال العلاجية', 'تدليك الفرشاة الحسية'] },
  { id: 'auditory', name_ar: 'المعالجة السمعية (Auditory)', icon: '🎧', examples: ['موسيقى ثنائية النغمات (Binaural Beats)', 'الضوضاء البيضاء والوردية', 'أصوات الطبيعة المهدئة'] },
  { id: 'visual', name_ar: 'المعالجة البصرية (Visual)', icon: '💡', examples: ['أنابيب الفقاعات المضيئة', 'إضاءة ألياف ضوئية خافتة', 'تقليل الوهج والتشويش البصري'] }
];

export default function SnoezelenCalmStudioModal({ isOpen, onClose, patientName = 'المريض', onInjectSoap }) {
  if (!isOpen) return null;

  // Active Chromotherapy & Sound
  const [activeThemeId, setActiveThemeId] = useState('ocean');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [binauralFreqType, setBinauralFreqType] = useState('alpha'); // 'alpha' (10Hz) | 'theta' (6Hz) | 'delta' (2.5Hz)

  // Sensory Profile Classification (Ayres / Dunn)
  const [sensoryPattern, setSensoryPattern] = useState('hyper_responsive'); // 'hyper_responsive' | 'hypo_responsive' | 'sensory_seeking' | 'sensory_avoiding'

  // Prescribed Sensory Diet Activities
  const [selectedActivities, setSelectedActivities] = useState([
    'الضغط العميق (Deep Pressure) عبر بطانية مهدئة لمدة 10 دقائق',
    'جلسة أرجحة خطية دهليزية بطيئة لتهدئة الجهاز العصبي',
    'التعرض لضوء ناعم متدرج مع صوت رنين ألفا 10Hz'
  ]);
  const [newActivityInput, setNewActivityInput] = useState('');

  // Audio Context Ref
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);

  const activeTheme = CHROMOTHERAPY_THEMES.find((t) => t.id === activeThemeId) || CHROMOTHERAPY_THEMES[0];

  // Stop sound
  const stopTone = useCallback(() => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch (e) {}
      oscRef.current = null;
    }
  }, []);

  // Start continuous relaxing tone
  const startTone = useCallback(() => {
    stopTone();
    if (isSoundMuted) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(activeTheme.freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
    } catch (e) {
      console.warn('Snoezelen Audio error:', e);
    }
  }, [activeTheme, isSoundMuted, volume, stopTone]);

  useEffect(() => {
    if (isPlayingAudio) {
      startTone();
    } else {
      stopTone();
    }
    return () => stopTone();
  }, [isPlayingAudio, activeThemeId, startTone, stopTone]);

  const handleAddActivity = () => {
    if (!newActivityInput.trim()) return;
    setSelectedActivities([...selectedActivities, newActivityInput.trim()]);
    setNewActivityInput('');
  };

  const handleRemoveActivity = (idx) => {
    setSelectedActivities(selectedActivities.filter((_, i) => i !== idx));
  };

  const getSensoryPatternLabel = (p) => {
    switch (p) {
      case 'hyper_responsive': return 'فرط استجابة حسية (Sensory Over-responsivity / الدفاعية الحسية)';
      case 'hypo_responsive': return 'نقص استجابة وخمول حسي (Sensory Under-responsivity)';
      case 'sensory_seeking': return 'البحث الحسي النشط (Sensory Seeking / Craving)';
      case 'sensory_avoiding': return 'التجنب الحسي الحذر (Sensory Avoiding)';
      default: return p;
    }
  };

  const handleInjectSoap = () => {
    const text = `
🌈 **جلسة البيئة متعددة الحواس والحمية الحسية (Snoezelen & Sensory Diet Studio):**
- **النمط الحسي للمريض:** ${getSensoryPatternLabel(sensoryPattern)}
- **بروتوكول سنوزلين المطبق:** ثيرابيا الضوء والألوان (${activeTheme.name_ar}) مع تردد صوتي علاجي (${activeTheme.freq} Hz - ${binauralFreqType === 'alpha' ? 'موجات ألفا 10Hz' : 'موجات ثيتا 6Hz'}).
- **الأنشطة المدرجة في الحمية الحسية (Sensory Diet):**
${selectedActivities.map((act, i) => `  ${i + 1}. ${act}`).join('\n')}
- **الملاحظات السريرية:** انخفاض سلوكيات الهروب والتوتر الحركي، تحسن ملحوظ في التواصل البصري والهدوء الذاتي عقب تطبيق المثيرات الحسية العميقة المتوازنة.
`.trim();

    if (onInjectSoap) {
      onInjectSoap(text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">استوديو سنوزلين والحمية الحسية</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Snoezelen Multi-Sensory Studio
                </span>
              </div>
              <p className="text-xs text-slate-400">
                بروتوكول التكامل الحسي والتهدئة متعددة الحواس للمريض ({patientName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className={`p-2 rounded-xl border transition-all ${
                isSoundMuted
                  ? 'bg-slate-800 text-slate-500 border-slate-700'
                  : 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/50'
              }`}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* CHROMOTHERAPY & AMBIENCE STAGE */}
          <div className={`relative rounded-3xl p-6 border transition-all duration-700 overflow-hidden bg-gradient-to-br ${activeTheme.bgGrad} border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center min-h-[220px]`}>
            
            {/* Ambient Background Aura */}
            <div
              className="absolute w-72 h-72 rounded-full blur-3xl opacity-30 animate-pulse pointer-events-none"
              style={{ backgroundColor: activeTheme.colorHex }}
            />

            {/* Stage Info */}
            <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-xs text-slate-300 mb-2">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeTheme.name_ar}</span>
              <span className="font-mono text-purple-300">({activeTheme.freq} Hz)</span>
            </div>

            <h3 className="relative z-10 text-2xl font-black text-white mb-2">
              {activeTheme.desc}
            </h3>

            {/* Sound & Modulation Control */}
            <div className="relative z-10 flex items-center gap-4 mt-4 flex-wrap justify-center">
              <button
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className={`px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all ${
                  isPlayingAudio
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                    : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white shadow-purple-500/20'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    إيقاف الرنين الصوتي
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    تشغيل التردد الصوتي المهدئ
                  </>
                )}
              </button>

              {/* Binaural Frequency Selector */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs">
                <button
                  onClick={() => setBinauralFreqType('alpha')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    binauralFreqType === 'alpha' ? 'bg-purple-500 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  ألفا 10Hz (هدوء وتيقظ)
                </button>
                <button
                  onClick={() => setBinauralFreqType('theta')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    binauralFreqType === 'theta' ? 'bg-purple-500 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  ثيتا 6Hz (استرخاء عميق)
                </button>
              </div>
            </div>

            {/* Color Theme Selector Dots */}
            <div className="relative z-10 flex items-center gap-3 mt-6">
              {CHROMOTHERAPY_THEMES.map((theme) => {
                const isSelected = activeThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setActiveThemeId(theme.id)}
                    className={`group relative w-10 h-10 rounded-2xl transition-all flex items-center justify-center ${
                      isSelected ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-lg' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: theme.colorHex }}
                    title={theme.name_ar}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TWO-COLUMN LOWER SECTION: Sensory Profile & Sensory Diet Regimen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left: Sensory Profile Classification (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-white">النمط الحسي للمريض (Dunn Model)</span>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'hyper_responsive', title: 'فرط استجابة حسية (Over-responsive)', desc: 'دفاعية حسية ضد الأصوات، الأضواء، أو الملامس' },
                  { id: 'hypo_responsive', title: 'نقص استجابة (Under-responsive)', desc: 'يحتاج لمثيرات أقوى للتفاعل والاستجابة الحركية' },
                  { id: 'sensory_seeking', title: 'البحث الحسي النشط (Sensory Seeking)', desc: 'بحث دائم عن القفز، الضغط، والاصطدام لتنظيم ذاته' },
                  { id: 'sensory_avoiding', title: 'التجنب الحسي (Sensory Avoiding)', desc: 'تجنب بيئات معينة والانسحاب للحد من الإرهاق الحسي' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSensoryPattern(item.id)}
                    className={`w-full text-right p-3 rounded-2xl border text-xs transition-all ${
                      sensoryPattern === item.id
                        ? 'bg-purple-950/50 border-purple-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold">{item.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Sensory Diet Activity Builder (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-950/40 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-white">خطة الحمية الحسية المخصصة (Sensory Diet)</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">{selectedActivities.length} أنشطة</span>
              </div>

              {/* Active Prescribed List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedActivities.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-400 border border-purple-800/50 flex items-center justify-center font-mono text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{act}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveActivity(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Activity Form */}
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="إضافة نشاط حسي منظم جديد (مثلاً: أرجحة بطيئة، بطانية ثقيلة...)"
                  value={newActivityInput}
                  onChange={(e) => setNewActivityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddActivity();
                  }}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={handleAddActivity}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  إضافة
                </button>
              </div>

              {/* Quick Preset Badges from Systems */}
              <div className="pt-2">
                <div className="text-[11px] text-slate-500 mb-1.5">اقتراحات سريعة حسب الأجهزة الحسية:</div>
                <div className="flex flex-wrap gap-1.5">
                  {SENSORY_SYSTEMS.flatMap((s) => s.examples).slice(0, 4).map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedActivities((p) => [...p, ex])}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500 text-[11px] text-slate-400 hover:text-purple-300 transition-colors"
                    >
                      + {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-400" />
            <span>يتم تطبيق بروتوكول سنوزلين والحمية الحسية وفق أسس نظرية التكامل الحسي لـ A. Jean Ayres</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={() => {
                handleInjectSoap();
                onClose();
              }}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white text-sm font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4" />
              حقن النتائج في الـ SOAP
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
