import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  Download,
  Printer,
  Save,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Image as ImageIcon,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Share2,
  BookOpen,
  HeartHandshake,
  Tag
} from 'lucide-react';
import { aiTherapyApi } from '../../api';
import ClinicalReportPrintLetterhead from './ClinicalReportPrintLetterhead';

export default function AiImageStudioView({ selectedPatient, onSaveToPatient }) {
  const [prompt, setPrompt] = useState('');
  const [cardLabel, setCardLabel] = useState('');
  const [style, setStyle] = useState('cartoon_pecs');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [generatedAsset, setGeneratedAsset] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const styleOptions = [
    { id: 'cartoon_pecs', label: '🎴 بطاقة PECS للتواصل البديل', desc: 'رموز تواصل بصرية واضحة وخلفية بيضاء نقية' },
    { id: 'coloring_book', label: '🖍️ رسم تلوين للأطفال', desc: 'خطوط سوداء عريضة ومفرغة مجهزة للطباعة والتلوين' },
    { id: 'social_story', label: '📖 مشهد قصة اجتماعية', desc: 'رسم قصصي دافئ يعبر عن المشاعر والمواقف السلوكية' },
    { id: 'social_post', label: '📱 منشور سوشيال ميديا وتوعية', desc: 'تصميم جرافيكي أنيق وتوعوي لنشره بصفحة العيادة' },
    { id: 'realistic_clinical', label: '🔬 توضيح سريري واقعي', desc: 'صورة توضيحية سريرية ذات إضاءة متوازنة' },
  ];

  const presets = [
    { label: '🧼 غسل اليدين', text: 'طفل يغسل يديه بالماء والصابون عند المغسلة بابتسامة', card_label: 'أنا أغسل يدي بالصابون' },
    { label: '👟 ارتداء الحذاء', text: 'طفل يرتدي حذاءه الرياضي بنفسه برباط واضح', card_label: 'أنا ألبس حذائي' },
    { label: '🥛 شرب الماء', text: 'كأس زجاجي مليء بالماء النقي الصافي مع قطرات ماء منعشة', card_label: 'أريد أن أشرب ماء' },
    { label: '🍎 أكل تفاحة', text: 'طفل يأكل تفاحة حمراء لذيذة بأسلوب كرتوني لطيف', card_label: 'أنا آكل تفاحة' },
    { label: '🤝 مشاركة اللعب', text: 'طفلان يلعبان معاً بالمكعبات الخشبية في سعادة وتفاهم', card_label: 'نحن نلعب معاً' },
    { label: '🦁 تلوين حيوانات', text: 'رسم تلوين لأسد وفيل وزرافة في الغابة بخطوط عريضة مفرغة', card_label: 'صفحة تلوين الحيوانات' },
  ];

  const loadGallery = async () => {
    setLoadingGallery(true);
    try {
      const res = await aiTherapyApi.getGeneratedImages();
      if (res.success) {
        setGallery(res.assets || []);
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
    } finally {
      setLoadingGallery(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  // Prefill when patient is selected
  useEffect(() => {
    if (selectedPatient && !prompt) {
      setPrompt(`بطاقة تواصل بصرية للطفل ${selectedPatient.first_name}: التعبير عن طلب المساعدة بهدوء`);
      setCardLabel('أنا أطلب المساعدة');
    }
  }, [selectedPatient]);

  const handleSelectPreset = (p) => {
    setPrompt(p.text);
    setCardLabel(p.card_label);
    if (p.label.includes('تلوين')) {
      setStyle('coloring_book');
    } else {
      setStyle('cartoon_pecs');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('يرجى كتابة وصف الصورة أو اختيار أحد النماذج الجاهزة.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const res = await aiTherapyApi.generateImage({
        prompt: prompt.trim(),
        style,
        aspect_ratio: aspectRatio,
        card_label_ar: cardLabel.trim() || undefined,
        patient_id: selectedPatient?.id || null,
      });

      if (res.data) {
        setGeneratedAsset(res.data);
        loadGallery();
      } else {
        throw new Error(res.message || 'فشل استلام بيانات الصورة.');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError(err.message || 'تعذر توليد الوسيلة البصرية. يرجى المحاولة ثانية.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToPatient = async () => {
    if (!generatedAsset || !selectedPatient) return;
    if (onSaveToPatient) {
      onSaveToPatient(generatedAsset);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans text-right" dir="rtl">
      
      {/* 1. Left / Top: Configuration Panel (5 cols) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl print:hidden">
        <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-pink-500/20 text-lg">
            🎨
          </div>
          <div>
            <h3 className="text-sm font-black text-white">استوديو البطاقات والوسائل البصرية</h3>
            <p className="text-xs text-slate-400">توليد بطاقات PECS للتواصل، رسوم تلوين، ومشاهد قصصية</p>
          </div>
        </div>

        {/* Selected Patient Demographics */}
        {selectedPatient && (
          <div className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
              <span className="text-pink-200 font-bold">الحالة المستهدفة: {selectedPatient.first_name} {selectedPatient.last_name}</span>
            </div>
            <span className="text-[10px] text-pink-300 font-mono">العمر: {selectedPatient.age || 6} سنوات</span>
          </div>
        )}

        {/* Style Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">النمط البصري للوسيلة (Style):</label>
          <div className="grid grid-cols-1 gap-2">
            {styleOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStyle(opt.id)}
                className={`p-3 rounded-2xl border text-right transition flex items-start space-x-3 space-x-reverse ${
                  style === opt.id
                    ? 'bg-gradient-to-r from-pink-600/20 to-indigo-600/20 border-pink-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[10px] text-slate-400">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">✨ نماذج سريعة شائعة في التأهيل:</label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 hover:border-pink-500/40 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">وصف المشهد أو العنصر البصري المطلوب:</label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثلاً: طفل يشير بيده إلى طبق الفواكه، خطوط كرتونية واضحة..."
            className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition resize-none leading-relaxed"
          />
        </div>

        {/* Card Title / Label */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">النص أو التسمية المكتوبة على البطاقة (اختياري):</label>
          <input
            type="text"
            value={cardLabel}
            onChange={(e) => setCardLabel(e.target.value)}
            placeholder="مثلاً: أنا أريد أن أشرب ماء"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition"
          />
        </div>

        {/* Aspect Ratio Pills */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">أبعاد الصورة (Aspect Ratio):</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '1:1', label: '1:1 (مربع PECS)' },
              { id: '4:3', label: '4:3 (بطاقة A4)' },
              { id: '16:9', label: '16:9 (عريض)' },
            ].map((ar) => (
              <button
                key={ar.id}
                type="button"
                onClick={() => setAspectRatio(ar.id)}
                className={`py-2 rounded-xl text-xs font-bold border transition text-center ${
                  aspectRatio === ar.id
                    ? 'bg-pink-600 text-white border-pink-500 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs transition flex items-center justify-center space-x-2 space-x-reverse shadow-lg shadow-pink-600/25 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>جارٍ رسم وتوليد الوسيلة البصرية بالذكاء الاصطناعي...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>✨ توليد وتصميم الوسيلة البصرية الآن</span>
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

      {/* 2. Right / Main: Generated Canvas & Gallery Area (7 cols) */}
      <div 
        id="printable-report-area"
        className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl min-h-[520px] flex flex-col justify-between print:col-span-12 print:bg-white print:border-none print:shadow-none print:p-0"
      >
        <div className="space-y-6">
          
          {/* Printable Letterhead Header */}
          <ClinicalReportPrintLetterhead
            selectedPatient={selectedPatient}
            reportTitle={cardLabel || 'بطاقة تواصل بصرية PECS'}
            specialty="التربية الخاصة، الأرطوفونيا والتواصل المعزز والبديل (AAC)"
          />

          {generatedAsset ? (
            <div className="space-y-6">
              
              {/* PECS / Therapy Flashcard Container */}
              <div className="max-w-md mx-auto rounded-3xl bg-slate-950 border-4 border-indigo-500/40 p-4 shadow-2xl space-y-3 print:border-2 print:border-slate-900 print:bg-white print:shadow-none print:max-w-xl">
                
                {/* Card Title Label (if present) */}
                {generatedAsset.card_label_ar && (
                  <div className="text-center py-2 px-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-white font-black text-sm sm:text-base print:bg-slate-100 print:text-slate-900 print:border-slate-300">
                    {generatedAsset.card_label_ar}
                  </div>
                )}

                {/* High Resolution Image Container */}
                <div className="rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-slate-800 shadow-inner">
                  <img
                    src={generatedAsset.image_url}
                    alt={generatedAsset.card_label_ar || 'Therapy Card'}
                    className="w-full h-auto object-contain max-h-[420px] hover:scale-105 transition duration-300 select-none"
                    loading="lazy"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 font-mono print:hidden">
                  <span>النمط: <strong>{generatedAsset.style}</strong></span>
                  <span>الأبعاد: <strong>{generatedAsset.aspect_ratio}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 print:hidden pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>طباعة بطاقة A4</span>
                </button>

                <a
                  href={generatedAsset.image_url}
                  download="therapy_card.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الصورة عالية الدقة</span>
                </a>

                {selectedPatient && (
                  <button
                    type="button"
                    onClick={handleSaveToPatient}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse shadow-md"
                  >
                    {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>{savedSuccess ? 'تم الحفظ في ملف المريض' : 'حفظ في بنك وسائل المريض'}</span>
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-800 rounded-3xl p-8">
              <div className="w-16 h-16 rounded-3xl bg-pink-500/10 flex items-center justify-center text-pink-400 text-2xl">
                🎨
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">منصة التصميم وتوليد البطاقات فارغة حالياً</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  اختر نمط البطاقة، اكتب الوصف واضغط على زر التوليد لتصميم بطاقات PECS ورسوم تلوين قابلة للطباعة فوراً.
                </p>
              </div>
            </div>
          )}

          {/* 3. Generated Assets Gallery Grid */}
          {gallery.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-slate-800/80 print:hidden">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-2 space-x-reverse">
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                  <span>معرض الوسائل البصرية المولدة مؤخراً ({gallery.length}):</span>
                </h4>

                <button
                  type="button"
                  onClick={loadGallery}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                  title="تحديث المعرض"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingGallery ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {gallery.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setGeneratedAsset({ image_url: item.image_url, card_label_ar: item.file_name.replace(/\.[^/.]+$/, "") })}
                    className="group relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-pink-500 cursor-pointer transition aspect-square"
                  >
                    <img
                      src={item.image_url}
                      alt="Thumbnail"
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
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
