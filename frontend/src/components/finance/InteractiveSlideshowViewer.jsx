import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  X,
  Printer,
  Sparkles,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  Download,
  RefreshCw,
  FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InteractiveSlideshowViewer({ report, onClose }) {
  const slides = report?.slides_json || [];
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const currentSlide = slides[currentSlideIndex] || slides[0] || {};
  const totalSlides = slides.length;

  const nextSlide = () => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        prevSlide();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, totalSlides, isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Client-Side Multi-Page Landscape PDF Export
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Target printable clone slides
      const slideElements = document.querySelectorAll('.printable-single-slide');
      
      for (let i = 0; i < slideElements.length; i++) {
        if (i > 0) {
          doc.addPage('a4', 'landscape');
        }

        const canvas = await html2canvas(slideElements[i], {
          scale: 2, // High resolution (300 DPI equivalent)
          useCORS: true,
          logging: false,
          backgroundColor: '#090d16',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      }

      const fileName = `تقرير_مالي_${(report?.title || 'عرض_شرائح').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('حدث خطأ أثناء تصدير ملف PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderSlideContent = (slide) => {
    switch (slide.type) {
      case 'cover':
        return (
          <div className="flex flex-col items-center justify-center text-center h-full space-y-6 max-w-3xl mx-auto animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-2xl shadow-indigo-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-3xl">
                🏛️
              </div>
            </div>

            <div className="space-y-3">
              <span className="px-4 py-1.5 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {slide.highlight || 'عرض مالي استراتيجي وإداري ✨'}
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {slide.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
                {slide.subtitle}
              </p>
            </div>

            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-center space-x-6 space-x-reverse text-xs text-slate-400 font-mono">
              <span>الفترة: <strong className="text-white">{report.period}</strong></span>
              <span>•</span>
              <span>تاريخ التوليد: <strong className="text-white">{new Date(report.created_at || Date.now()).toLocaleDateString('ar-DZ')}</strong></span>
            </div>
          </div>
        );

      case 'kpis':
        return (
          <div className="flex flex-col justify-center h-full space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
            <div className="space-y-2 text-right">
              <span className="text-xs font-black text-indigo-400 font-mono">0{slide.slide_number} / 0{totalSlides}</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{slide.title}</h2>
              <p className="text-xs text-slate-400">{slide.subtitle}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(slide.metrics || []).map((m, idx) => (
                <div key={idx} className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/20 shadow-xl space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
                  <span className="text-xs text-slate-400 font-bold block">{m.label}</span>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Bullets */}
            {slide.bullets && slide.bullets.length > 0 && (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-slate-400 block">✨ خلاصات المؤشرات:</span>
                {slide.bullets.map((b, i) => (
                  <div key={i} className="flex items-start space-x-2 space-x-reverse text-xs text-slate-300 font-medium leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex flex-col justify-center h-full space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
            <div className="space-y-2 text-right">
              <span className="text-xs font-black text-purple-400 font-mono">0{slide.slide_number} / 0{totalSlides}</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{slide.title}</h2>
              <p className="text-xs text-slate-400">{slide.subtitle}</p>
            </div>

            {/* Bullets & Insights Checklist */}
            <div className="space-y-3">
              {(slide.bullets || []).map((bullet, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-lg flex items-start space-x-3 space-x-reverse hover:border-purple-500/40 transition group"
                >
                  <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 font-mono font-black text-xs flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                    {idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-1">
                    {bullet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col font-sans select-none ${isFullscreen ? 'p-4' : 'p-4 sm:p-8 bg-slate-950/95 backdrop-blur-xl'}`} dir="rtl">
      
      {/* 1. Presentation Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 no-print">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
            📊
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-white truncate max-w-sm sm:max-w-md">{report?.title || 'العرض التقديمي المالي'}</h2>
            <span className="text-[10px] text-slate-400 font-mono">شريحة {currentSlideIndex + 1} من {totalSlides}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          {/* Direct Multi-Page PDF Download Trigger */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse shadow-md disabled:opacity-50"
            title="تحميل عرض الشرائح بصيغة PDF A4 Landscape"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>جارٍ التصدير بدقة عالية...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>تحميل PDF مباشر</span>
              </>
            )}
          </button>

          {/* Native Browser Print Trigger */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
            title="طباعة المتصفح (A4 Landscape)"
          >
            <Printer className="w-4 h-4 text-amber-400" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
            title="ملء الشاشة"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition"
              title="إغلاق العرض"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Interactive Slide Canvas */}
      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden no-print">
        {/* Navigation Arrow Left (Next Slide) */}
        <button
          type="button"
          onClick={nextSlide}
          disabled={currentSlideIndex >= totalSlides - 1}
          className="absolute left-4 z-20 w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition disabled:opacity-20 shadow-xl"
          title="الشريحة التالية"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Navigation Arrow Right (Prev Slide) */}
        <button
          type="button"
          onClick={prevSlide}
          disabled={currentSlideIndex <= 0}
          className="absolute right-4 z-20 w-12 h-12 rounded-2xl bg-slate-900/80 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition disabled:opacity-20 shadow-xl"
          title="الشريحة السابقة"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Stage Container */}
        <div className="w-full h-full max-w-5xl rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-indigo-950/20 border border-slate-800/80 p-8 sm:p-12 shadow-2xl relative flex flex-col justify-center overflow-y-auto">
          {renderSlideContent(currentSlide)}
        </div>
      </div>

      {/* 3. Slide Thumbnails & Progress Bar */}
      <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between gap-4 no-print">
        {/* Thumbnails */}
        <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto py-1">
          {slides.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlideIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap flex items-center space-x-1 space-x-reverse ${
                idx === currentSlideIndex
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{idx + 1}.</span>
              <span className="truncate max-w-[100px]">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Shortcut Tip */}
        <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
          استخدم الأسهم ⬅️ ➡️ للتنقل بين الشرائح
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 4. Dedicated Print / High-DPI Capture Container for ALL Sequential Slides */}
      {/* ========================================================================= */}
      <div id="slide-print-container" className="hidden print:block">
        {slides.map((slide, idx) => (
          <div key={idx} className="printable-single-slide">
            {renderSlideContent(slide)}
          </div>
        ))}
      </div>

    </div>
  );
}
