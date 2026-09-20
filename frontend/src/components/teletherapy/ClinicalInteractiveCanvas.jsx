import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  PenTool,
  Highlighter,
  Zap,
  Stamp,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  Image as ImageIcon,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  CheckCircle2,
  Award,
} from 'lucide-react';
import {
  CANVAS_TOOLS,
  COLOR_PALETTE,
  STAMP_SYMBOLS,
  CLINICAL_DECKS,
} from './ClinicalCanvasData';

export default function ClinicalInteractiveCanvas({
  isPractitioner = true,
  onSendCanvasEvent = null,
  externalCanvasEvent = null,
  onSaveSnapshot = null,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Drawing tools state
  const [activeTool, setActiveTool] = useState(CANVAS_TOOLS.PEN);
  const [activeColor, setActiveColor] = useState('#ef4444'); // Default red
  const [brushSize, setBrushSize] = useState(4);
  const [activeStamp, setActiveStamp] = useState('star');
  const [laserPos, setLaserPos] = useState(null);

  // Clinical Deck State
  const [selectedDeckId, setSelectedDeckId] = useState(CLINICAL_DECKS[0].id);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState(null);

  // Undo / Redo history with synchronous historyRef tracking
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const historyRef = useRef([]);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]);
  const lastActionTimeRef = useRef(0);

  // Synchronize historyRef with state history
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const currentDeck = CLINICAL_DECKS.find((d) => d.id === selectedDeckId) || CLINICAL_DECKS[0];
  const currentCard = currentDeck.items[currentCardIndex] || currentDeck.items[0];

  // Draw stroke on context
  const drawStroke = (ctx, points, tool, color, size) => {
    if (!points || points.length === 0) return;
    ctx.save();

    if (points.length === 1) {
      // Single dot tap
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, (tool === CANVAS_TOOLS.ERASER ? size * 2 : size) / 2, 0, Math.PI * 2);
      if (tool === CANVAS_TOOLS.ERASER) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fill();
      } else if (tool === CANVAS_TOOLS.HIGHLIGHTER) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.fill();
      } else {
        ctx.fillStyle = color;
        ctx.globalAlpha = 1.0;
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    if (tool === CANVAS_TOOLS.HIGHLIGHTER) {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = size * 3;
      ctx.lineCap = 'square';
    } else if (tool === CANVAS_TOOLS.ERASER) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = size * 4;
      ctx.lineCap = 'round';
    } else {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.stroke();
    ctx.restore();
  };

  const drawStamp = (ctx, x, y, symbol) => {
    ctx.save();
    ctx.font = '36px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, x, y);
    ctx.restore();
  };

  // Redraw all saved history actions on the canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Reset transform to identity then clear
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Redraw all actions using historyRef to avoid closure staleness
    const actions = historyRef.current || [];
    actions.forEach((action) => {
      if (action.type === 'path') {
        drawStroke(ctx, action.points, action.tool, action.color, action.size);
      } else if (action.type === 'stamp') {
        drawStamp(ctx, action.x, action.y, action.symbol);
      }
    });
  }, []);

  // Commit a completed stroke or action into history and sync to peers
  const commitStroke = (points, tool = activeTool, color = activeColor, size = brushSize) => {
    if (!points || points.length === 0) return;
    const strokePoints = points.length === 1 ? [points[0], { x: points[0].x + 0.5, y: points[0].y + 0.5 }] : points;
    
    const newAction = {
      type: 'path',
      points: strokePoints,
      tool,
      color,
      size,
    };

    const updated = [...(historyRef.current || []), newAction];
    historyRef.current = updated;
    setHistory(updated);
    setRedoStack([]);
    lastActionTimeRef.current = Date.now();

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      drawStroke(ctx, strokePoints, tool, color, size);
    }

    if (onSendCanvasEvent) {
      onSendCanvasEvent({
        type: 'draw_path',
        path: strokePoints,
        tool,
        color,
        size,
      });
    }
  };

  const drawStampAt = (x, y, symbol) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawStamp(ctx, x, y, symbol);
    const newAction = { type: 'stamp', x, y, symbol };
    const updated = [...(historyRef.current || []), newAction];
    historyRef.current = updated;
    setHistory(updated);
    setRedoStack([]);
    lastActionTimeRef.current = Date.now();
  };

  const drawRemotePath = (points, tool, color, size) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawStroke(ctx, points, tool, color, size);
    const newAction = { type: 'path', points, tool, color, size };
    const updated = [...(historyRef.current || []), newAction];
    historyRef.current = updated;
    setHistory(updated);
  };

  // Resize canvas to match container width/height with devicePixelRatio
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width || container.clientWidth || 0, 320);
    const height = Math.max(rect.height || container.clientHeight || 0, 480);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    redrawCanvas();
  }, [redrawCanvas]);

  // Robust auto-resize observer for container
  useEffect(() => {
    resizeCanvas();
    let ro = null;
    if (typeof window !== 'undefined' && 'ResizeObserver' in window && containerRef.current) {
      ro = new ResizeObserver(() => {
        window.requestAnimationFrame(() => {
          resizeCanvas();
        });
      });
      ro.observe(containerRef.current);
    }
    window.addEventListener('resize', resizeCanvas);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  // Handle incoming remote drawings from peer
  useEffect(() => {
    if (externalCanvasEvent) {
      handleRemoteEvent(externalCanvasEvent);
    }
  }, [externalCanvasEvent]);

  const handleRemoteEvent = (event) => {
    if (event.type === 'draw_path') {
      drawRemotePath(event.path, event.tool, event.color, event.size);
    } else if (event.type === 'stamp') {
      drawStampAt(event.x, event.y, event.symbol);
    } else if (event.type === 'clear') {
      clearCanvasInternal(false);
    } else if (event.type === 'change_card') {
      setSelectedDeckId(event.deckId);
      setCurrentCardIndex(event.cardIndex);
    } else if (event.type === 'laser') {
      setLaserPos({ x: event.x, y: event.y });
    }
  };

  // Get coordinates relative to canvas bounding box (standardized for pointer, mouse, touch)
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 100, y: 100 };
    const rect = canvas.getBoundingClientRect();

    let clientX = e.clientX;
    let clientY = e.clientY;

    if (clientX === undefined && e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (clientX === undefined && e.changedTouches && e.changedTouches[0]) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    }

    if (clientX === undefined || clientY === undefined) {
      return { x: rect.width / 2 || 100, y: rect.height / 2 || 100 };
    }

    return {
      x: Math.max(0, Math.min(rect.width, clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, clientY - rect.top)),
    };
  };

  // Start Drawing (Unified Pointer / Mouse / Touch)
  const startDrawing = (e) => {
    if (e && e.preventDefault) {
      try { e.preventDefault(); } catch (err) {}
    }
    try {
      if (e && e.pointerId !== undefined && e.currentTarget && e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    } catch (err) {}

    const pos = getCoordinates(e);

    if (activeTool === CANVAS_TOOLS.LASER) {
      setLaserPos(pos);
      if (onSendCanvasEvent) {
        onSendCanvasEvent({ type: 'laser', x: pos.x, y: pos.y });
      }
      return;
    }

    if (activeTool === CANVAS_TOOLS.STAMP) {
      const stampObj = STAMP_SYMBOLS.find((s) => s.id === activeStamp) || STAMP_SYMBOLS[0];
      drawStampAt(pos.x, pos.y, stampObj.symbol);
      if (onSendCanvasEvent) {
        onSendCanvasEvent({ type: 'stamp', x: pos.x, y: pos.y, symbol: stampObj.symbol });
      }
      return;
    }

    isDrawingRef.current = true;
    currentPathRef.current = [pos];

    // Render single tap dot immediately
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, (activeTool === CANVAS_TOOLS.ERASER ? brushSize * 2 : brushSize) / 2, 0, Math.PI * 2);
      if (activeTool === CANVAS_TOOLS.ERASER) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fill();
      } else if (activeTool === CANVAS_TOOLS.HIGHLIGHTER) {
        ctx.fillStyle = activeColor;
        ctx.globalAlpha = 0.35;
        ctx.fill();
      } else {
        ctx.fillStyle = activeColor;
        ctx.globalAlpha = 1.0;
        ctx.fill();
      }
      ctx.restore();
    }
  };

  // Continue Drawing
  const continueDrawing = (e) => {
    const pos = getCoordinates(e);

    if (activeTool === CANVAS_TOOLS.LASER) {
      setLaserPos(pos);
      if (onSendCanvasEvent) {
        onSendCanvasEvent({ type: 'laser', x: pos.x, y: pos.y });
      }
      return;
    }

    if (!isDrawingRef.current) return;
    currentPathRef.current.push(pos);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pts = currentPathRef.current;

    // Draw last segment smoothly
    if (pts.length >= 2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);

      if (activeTool === CANVAS_TOOLS.HIGHLIGHTER) {
        ctx.strokeStyle = activeColor;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = brushSize * 3;
        ctx.lineCap = 'square';
      } else if (activeTool === CANVAS_TOOLS.ERASER) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = brushSize * 4;
        ctx.lineCap = 'round';
      } else {
        ctx.strokeStyle = activeColor;
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      ctx.stroke();
      ctx.restore();
    }
  };

  // Stop Drawing & Commit
  const stopDrawing = (e) => {
    try {
      if (e && e.pointerId !== undefined && e.currentTarget && e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    if (activeTool === CANVAS_TOOLS.LASER) {
      setLaserPos(null);
      return;
    }

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPathRef.current.length > 0) {
      commitStroke([...currentPathRef.current], activeTool, activeColor, brushSize);
    }
    currentPathRef.current = [];
  };

  // Direct Click Fallback Handler (Guarantees stroke registration on direct click/tap)
  const handleClick = (e) => {
    const timeSinceLastAction = Date.now() - lastActionTimeRef.current;
    // If an action was just committed by pointerup within 80ms, avoid duplicate
    if (timeSinceLastAction < 80) return;

    const pos = getCoordinates(e);

    if (activeTool === CANVAS_TOOLS.STAMP) {
      const stampObj = STAMP_SYMBOLS.find((s) => s.id === activeStamp) || STAMP_SYMBOLS[0];
      drawStampAt(pos.x, pos.y, stampObj.symbol);
      if (onSendCanvasEvent) {
        onSendCanvasEvent({ type: 'stamp', x: pos.x, y: pos.y, symbol: stampObj.symbol });
      }
      return;
    }

    if (activeTool === CANVAS_TOOLS.LASER) {
      return;
    }

    // Register single click dot / stroke
    commitStroke([pos, { x: pos.x + 1, y: pos.y + 1 }], activeTool, activeColor, brushSize);
  };

  // Direct native event listener binding to canvas to intercept any external/synthetic dispatches
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onNativePointerDown = (e) => startDrawing(e);
    const onNativePointerMove = (e) => continueDrawing(e);
    const onNativePointerUp = (e) => stopDrawing(e);
    const onNativeClick = (e) => handleClick(e);

    canvas.addEventListener('pointerdown', onNativePointerDown, { passive: false });
    canvas.addEventListener('pointermove', onNativePointerMove, { passive: false });
    canvas.addEventListener('pointerup', onNativePointerUp, { passive: false });
    canvas.addEventListener('pointercancel', onNativePointerUp, { passive: false });
    canvas.addEventListener('mousedown', onNativePointerDown, { passive: false });
    canvas.addEventListener('mousemove', onNativePointerMove, { passive: false });
    canvas.addEventListener('mouseup', onNativePointerUp, { passive: false });
    canvas.addEventListener('click', onNativeClick, { passive: false });
    canvas.addEventListener('touchstart', onNativePointerDown, { passive: false });
    canvas.addEventListener('touchmove', onNativePointerMove, { passive: false });
    canvas.addEventListener('touchend', onNativePointerUp, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', onNativePointerDown);
      canvas.removeEventListener('pointermove', onNativePointerMove);
      canvas.removeEventListener('pointerup', onNativePointerUp);
      canvas.removeEventListener('pointercancel', onNativePointerUp);
      canvas.removeEventListener('mousedown', onNativePointerDown);
      canvas.removeEventListener('mousemove', onNativePointerMove);
      canvas.removeEventListener('mouseup', onNativePointerUp);
      canvas.removeEventListener('click', onNativeClick);
      canvas.removeEventListener('touchstart', onNativePointerDown);
      canvas.removeEventListener('touchmove', onNativePointerMove);
      canvas.removeEventListener('touchend', onNativePointerUp);
    };
  }, [activeTool, activeColor, brushSize, activeStamp]);

  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const last = historyRef.current[historyRef.current.length - 1];
    const updated = historyRef.current.slice(0, -1);
    historyRef.current = updated;
    setHistory(updated);
    setRedoStack((prev) => [...prev, last]);
    setTimeout(redrawCanvas, 0);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    const updated = [...historyRef.current, next];
    historyRef.current = updated;
    setHistory(updated);
    setTimeout(redrawCanvas, 0);
  };

  const clearCanvasInternal = (emit = true) => {
    historyRef.current = [];
    setHistory([]);
    setRedoStack([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    if (emit && onSendCanvasEvent) {
      onSendCanvasEvent({ type: 'clear' });
    }
  };

  const handleSelectCard = (index) => {
    setCurrentCardIndex(index);
    clearCanvasInternal(false);
    if (onSendCanvasEvent) {
      onSendCanvasEvent({
        type: 'change_card',
        deckId: selectedDeckId,
        cardIndex: index,
      });
    }
  };

  const handleCustomImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target.result);
      clearCanvasInternal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSnapshotDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSaveSnapshot) {
      onSaveSnapshot(dataUrl);
    } else {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `clinical-canvas-${Date.now()}.png`;
      a.click();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* 1. TOP CLINICAL DECK & FLASHCARDS TRAY                                    */}
      {/* ========================================================================= */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Deck Category Selector */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <select
              value={selectedDeckId}
              onChange={(e) => {
                setSelectedDeckId(e.target.value);
                setCurrentCardIndex(0);
                setBackgroundImage(null);
                clearCanvasInternal(true);
                if (onSendCanvasEvent) {
                  onSendCanvasEvent({ type: 'change_card', deckId: e.target.value, cardIndex: 0 });
                }
              }}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:border-purple-500"
            >
              {CLINICAL_DECKS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.titleAr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Card Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentCardIndex === 0}
            onClick={() => handleSelectCard(Math.max(0, currentCardIndex - 1))}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition"
            title="البطاقة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-white font-mono px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800">
            {currentCardIndex + 1} / {currentDeck.items.length}
          </span>

          <button
            type="button"
            disabled={currentCardIndex === currentDeck.items.length - 1}
            onClick={() => handleSelectCard(Math.min(currentDeck.items.length - 1, currentCardIndex + 1))}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition"
            title="البطاقة التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Upload Custom Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-1 space-x-reverse transition"
            title="رفع صورة مخصصة من جهازك كخلفية للسبورة"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">صورة مخصصة</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomImageUpload}
          />

          <button
            type="button"
            onClick={handleSnapshotDownload}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 transition"
            title="حفظ لقطة من السبورة"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE CANVAS & BACKGROUND MEDIA DISPLAY                          */}
      {/* ========================================================================= */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden touch-none"
      >
        {/* Background Card Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none select-none z-0">
          {backgroundImage ? (
            <img
              src={backgroundImage}
              alt="Custom Canvas Media"
              className="max-h-full max-w-full object-contain rounded-2xl opacity-90 shadow-2xl"
            />
          ) : (
            <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm space-y-4">
              {/* Symbol / Emoji Header */}
              {currentCard.symbol && (
                <div className="text-6xl sm:text-7xl animate-bounce duration-1000">
                  {currentCard.symbol}
                </div>
              )}

              {/* Title & Phoneme Prompt */}
              {currentCard.title && (
                <div>
                  <h3 className="text-2xl font-black text-white">{currentCard.title}</h3>
                  {currentCard.sub && (
                    <span className="text-xs text-purple-400 font-mono font-bold block mt-0.5">
                      {currentCard.sub} {currentCard.phoneme && `• الصوت: ${currentCard.phoneme}`}
                    </span>
                  )}
                </div>
              )}

              {/* Reading Phonics Syllables */}
              {currentCard.syllables && (
                <div className="flex items-center justify-center gap-3 py-3">
                  {currentCard.syllables.map((syl, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 rounded-2xl bg-purple-600/20 text-purple-300 border border-purple-500/40 text-2xl font-black font-mono shadow-md"
                    >
                      {syl}
                    </span>
                  ))}
                </div>
              )}

              {/* Options for Discrimination */}
              {currentCard.options && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {currentCard.options.map((opt, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold text-sm"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {/* Emotions Faces */}
              {currentCard.faces && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2">
                  {currentCard.faces.map((f, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1"
                    >
                      <span className="text-3xl">{f.symbol}</span>
                      <span className="text-[10px] text-slate-300 font-bold">{f.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* SUDS Thermometer Scale */}
              {currentCard.scale && (
                <div className="flex items-center justify-between gap-1 p-2 rounded-2xl bg-slate-950 border border-slate-800">
                  {currentCard.scale.map((num) => (
                    <div
                      key={num}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black font-mono ${
                        num <= 3
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : num <= 6
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              )}

              {/* Clinical Prompt Instruction */}
              {currentCard.prompt && (
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-purple-500/20 text-xs text-purple-200 font-bold leading-relaxed">
                  💡 {currentCard.prompt}
                </div>
              )}
            </div>
          )}
        </div>

        {/* HTML5 Drawing Canvas Overlay with Universal Event Listeners */}
        <canvas
          ref={canvasRef}
          id="clinical-whiteboard-canvas"
          data-testid="interactive-whiteboard-canvas"
          data-testid-alt="whiteboard-canvas"
          tabIndex={0}
          role="application"
          aria-label="السبورة السريرية التفاعلية للرسم (Interactive Whiteboard Canvas)"
          onPointerDown={startDrawing}
          onPointerMove={continueDrawing}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onMouseDown={startDrawing}
          onMouseMove={continueDrawing}
          onMouseUp={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={continueDrawing}
          onTouchEnd={stopDrawing}
          onClick={handleClick}
          style={{ touchAction: 'none', pointerEvents: 'auto', zIndex: 10 }}
          className="absolute inset-0 z-10 cursor-crosshair w-full h-full pointer-events-auto touch-none focus:outline-none"
        />

        {/* Laser Pointer Spot */}
        {laserPos && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-rose-500/80 shadow-[0_0_25px_8px_rgba(244,63,94,0.9)] animate-pulse"
            style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM CLINICAL DRAWING TOOLBAR                                        */}
      {/* ========================================================================= */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 z-20">
        {/* Tool Mode Selectors */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            data-testid="whiteboard-pen-tool"
            onClick={() => setActiveTool(CANVAS_TOOLS.PEN)}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 space-x-reverse ${
              activeTool === CANVAS_TOOLS.PEN
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="قلم حر"
          >
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">قلم</span>
          </button>

          <button
            type="button"
            data-testid="whiteboard-highlighter-tool"
            onClick={() => setActiveTool(CANVAS_TOOLS.HIGHLIGHTER)}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 space-x-reverse ${
              activeTool === CANVAS_TOOLS.HIGHLIGHTER
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="قلم تمييز شفاف"
          >
            <Highlighter className="w-4 h-4" />
            <span className="hidden sm:inline">تمييز</span>
          </button>

          <button
            type="button"
            data-testid="whiteboard-laser-tool"
            onClick={() => setActiveTool(CANVAS_TOOLS.LASER)}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 space-x-reverse ${
              activeTool === CANVAS_TOOLS.LASER
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="مؤشر ليزر لجذب الانتباه"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">ليزر</span>
          </button>

          <button
            type="button"
            data-testid="whiteboard-stamp-tool"
            onClick={() => setActiveTool(CANVAS_TOOLS.STAMP)}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 space-x-reverse ${
              activeTool === CANVAS_TOOLS.STAMP
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="أختام تعزيز إيجابي"
          >
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">أختام</span>
          </button>

          <button
            type="button"
            data-testid="whiteboard-eraser-tool"
            onClick={() => setActiveTool(CANVAS_TOOLS.ERASER)}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 space-x-reverse ${
              activeTool === CANVAS_TOOLS.ERASER
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="ممحاة"
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">ممحاة</span>
          </button>
        </div>

        {/* Color Palette or Stamp Selector */}
        {activeTool === CANVAS_TOOLS.STAMP ? (
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            {STAMP_SYMBOLS.map((st) => (
              <button
                key={st.id}
                type="button"
                data-testid={`stamp-${st.id}`}
                onClick={() => setActiveStamp(st.id)}
                className={`w-8 h-8 rounded-xl text-lg flex items-center justify-center transition ${
                  activeStamp === st.id
                    ? 'bg-purple-600/40 border-2 border-purple-400 scale-110'
                    : 'hover:bg-slate-800'
                }`}
                title={st.label}
              >
                {st.symbol}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            {COLOR_PALETTE.map((col) => (
              <button
                key={col.id}
                type="button"
                data-testid={`color-picker-${col.id}`}
                onClick={() => setActiveColor(col.hex)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  activeColor === col.hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-950' : 'opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: col.hex }}
                title={col.labelAr}
              />
            ))}
          </div>
        )}

        {/* Brush Size & Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            {[2, 4, 8].map((sz) => (
              <button
                key={sz}
                type="button"
                data-testid={`brush-size-${sz}`}
                onClick={() => setBrushSize(sz)}
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold font-mono transition ${
                  brushSize === sz ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                {sz === 2 ? '•' : sz === 4 ? '••' : '•••'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              data-testid="whiteboard-undo-btn"
              disabled={history.length === 0}
              onClick={handleUndo}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
              title="تراجع"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              data-testid="whiteboard-redo-btn"
              disabled={redoStack.length === 0}
              onClick={handleRedo}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
              title="إعادة"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              data-testid="whiteboard-clear-btn"
              onClick={() => clearCanvasInternal(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
              title="مسح السبورة بالكامل"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
