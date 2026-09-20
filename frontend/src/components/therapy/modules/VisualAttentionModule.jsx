import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  CheckCircle2, 
  RotateCcw, 
  Award, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  Sliders, 
  SlidersHorizontal, 
  Activity, 
  Zap, 
  Layers, 
  Volume2,
  Check
} from 'lucide-react';
import { digitalTherapyApi } from '../../../api';
import { soundEngine } from '../../../utils/soundEngine';

export default function VisualAttentionModule({ patientId = null, onComplete = null }) {
  const presets = [
    {
      id: 'shapes',
      name_ar: '⭐ أشكال هندسية',
      target: '⭐',
      foils: ['⭕', '⬛', '🔺', '🔷', '🔶', '🟢', '🔹', '🔸'],
    },
    {
      id: 'letters',
      name_ar: '🔤 حروف متشابهة (ب)',
      target: 'ب',
      foils: ['ت', 'ث', 'ن', 'ي', 'ف', 'ق', 'ل', 'ك'],
    },
    {
      id: 'objects',
      name_ar: '🔑 أدوات يومية',
      target: '🔑',
      foils: ['☕', '🍎', '📱', '🥄', '👓', '⌚', '🖊️', '🪑'],
    },
  ];

  const gridSizes = [
    { id: '3x5', label: '3 × 5 (15 خلية - سهل)', rows: 3, cols: 5, targetRatio: 0.3 },
    { id: '5x8', label: '5 × 8 (40 خلية - قياسي)', rows: 5, cols: 8, targetRatio: 0.25 },
    { id: '8x12', label: '8 × 12 (96 خلية - مكثف)', rows: 8, cols: 12, targetRatio: 0.2 },
  ];

  const [selectedPresetId, setSelectedPresetId] = useState('shapes');
  const [selectedGridSizeId, setSelectedGridSizeId] = useState('5x8');
  const [anchorLine, setAnchorLine] = useState('left'); // 'left', 'right', 'none'
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [grid, setGrid] = useState([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const activePreset = presets.find((p) => p.id === selectedPresetId) || presets[0];
  const activeGridConfig = gridSizes.find((g) => g.id === selectedGridSizeId) || gridSizes[1];

  // Sound effects via soundEngine
  const playBeep = (freq = 600, duration = 0.1) => {
    if (!soundEnabled) return;
    soundEngine.playTone(freq, duration, 'sine');
  };

  const generateGrid = (preset = activePreset, config = activeGridConfig) => {
    const totalCells = config.rows * config.cols;
    const targetCount = Math.max(4, Math.round(totalCells * config.targetRatio));
    const targetIndices = new Set();

    while (targetIndices.size < targetCount) {
      targetIndices.add(Math.floor(Math.random() * totalCells));
    }

    const items = [];
    const midCol = config.cols / 2;

    for (let i = 0; i < totalCells; i++) {
      const isTarget = targetIndices.has(i);
      const row = Math.floor(i / config.cols);
      const col = i % config.cols;
      const hemisphere = col < midCol ? 'left' : 'right';

      items.push({
        id: i,
        row,
        col,
        symbol: isTarget ? preset.target : preset.foils[Math.floor(Math.random() * preset.foils.length)],
        isTarget: isTarget,
        hemisphere: hemisphere,
        selected: false,
      });
    }
    return items;
  };

  // Initialize and reset on config change
  useEffect(() => {
    setGrid(generateGrid(activePreset, activeGridConfig));
    setTimerSeconds(0);
    setIsActive(true);
    setIsFinished(false);
  }, [selectedPresetId, selectedGridSizeId]);

  // Timer
  useEffect(() => {
    let interval = null;
    if (isActive && !isFinished) {
      interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isFinished]);

  const handleCellClick = (cell) => {
    if (isFinished || cell.selected) return;

    if (cell.isTarget) {
      playBeep(880, 0.15); // High pitch on target
    } else {
      playBeep(220, 0.2); // Low pitch on foil
    }

    setGrid((prev) =>
      prev.map((c) => (c.id === cell.id ? { ...c, selected: true } : c))
    );
  };

  const handleFinish = async () => {
    setIsFinished(true);
    setIsActive(false);

    const totalTargets = grid.filter((c) => c.isTarget).length;
    const correctFound = grid.filter((c) => c.isTarget && c.selected).length;
    const falseAlarms = grid.filter((c) => !c.isTarget && c.selected).length;

    // Hemispatial balance metrics
    const leftTargets = grid.filter((c) => c.isTarget && c.hemisphere === 'left').length;
    const leftFound = grid.filter((c) => c.isTarget && c.hemisphere === 'left' && c.selected).length;
    const leftOmissions = leftTargets - leftFound;

    const rightTargets = grid.filter((c) => c.isTarget && c.hemisphere === 'right').length;
    const rightFound = grid.filter((c) => c.isTarget && c.hemisphere === 'right' && c.selected).length;
    const rightOmissions = rightTargets - rightFound;

    const accuracy = totalTargets > 0 ? Math.round((correctFound / totalTargets) * 100) : 100;

    if (patientId) {
      setSaving(true);
      try {
        await digitalTherapyApi.logResults(patientId, {
          category: 'cognition_memory',
          sub_tool: 'visual_attention',
          accuracy_percentage: accuracy,
          cues_needed_count: falseAlarms,
          reaction_time_avg_ms: timerSeconds * 1000,
          session_log: {
            grid_size: activeGridConfig.id,
            preset: activePreset.id,
            anchor_line: anchorLine,
            total_targets: totalTargets,
            correct_found: correctFound,
            false_alarms: falseAlarms,
            left_omissions: leftOmissions,
            right_omissions: rightOmissions,
            left_accuracy: leftTargets > 0 ? Math.round((leftFound / leftTargets) * 100) : 100,
            right_accuracy: rightTargets > 0 ? Math.round((rightFound / rightTargets) * 100) : 100,
            elapsed_seconds: timerSeconds,
          },
        });
      } catch (e) {
        console.error('Failed to log visual attention results:', e);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleRestart = () => {
    setGrid(generateGrid(activePreset, activeGridConfig));
    setTimerSeconds(0);
    setIsActive(true);
    setIsFinished(false);
  };

  // Live Metrics
  const totalTargets = grid.filter((c) => c.isTarget).length;
  const correctFound = grid.filter((c) => c.isTarget && c.selected).length;
  const falseAlarms = grid.filter((c) => !c.isTarget && c.selected).length;

  const leftTargets = grid.filter((c) => c.isTarget && c.hemisphere === 'left').length;
  const leftFound = grid.filter((c) => c.isTarget && c.hemisphere === 'left' && c.selected).length;
  const leftOmissions = leftTargets - leftFound;
  const leftPercent = leftTargets > 0 ? Math.round((leftFound / leftTargets) * 100) : 100;

  const rightTargets = grid.filter((c) => c.isTarget && c.hemisphere === 'right').length;
  const rightFound = grid.filter((c) => c.isTarget && c.hemisphere === 'right' && c.selected).length;
  const rightOmissions = rightTargets - rightFound;
  const rightPercent = rightTargets > 0 ? Math.round((rightFound / rightTargets) * 100) : 100;

  const accuracy = totalTargets > 0 ? Math.round((correctFound / totalTargets) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 max-w-4xl mx-auto shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/25">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              الانتباه البصري والمسح الفراغي (Visual Scanning & Neglect)
            </h3>
            <p className="text-xs text-slate-400">
              شطب وتحديد الرموز المستهدفة مع خط التثبيت الأحمر وتحليل إغفالات المجال البصري النصفي
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse font-mono text-xs font-bold text-purple-300 bg-purple-500/10 px-3.5 py-1.5 rounded-xl border border-purple-500/30">
          <Clock className="w-4 h-4" />
          <span>{timerSeconds} ثانية</span>
        </div>
      </div>

      {!isFinished ? (
        <div className="space-y-5">
          {/* Config Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Target Presets */}
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <span className="font-bold text-slate-400">المثير المستهدف:</span>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPresetId(p.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      selectedPresetId === p.id
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.name_ar}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Size Selector */}
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <span className="font-bold text-slate-400">حجم الشبكة:</span>
              <select
                value={selectedGridSizeId}
                onChange={(e) => setSelectedGridSizeId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-purple-500"
              >
                {gridSizes.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Anchor Line Toggle */}
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <span className="font-bold text-slate-400">خط التثبيت:</span>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                {[
                  { id: 'left', label: '🔴 يسار' },
                  { id: 'right', label: '🔴 يمين' },
                  { id: 'none', label: 'بدون' },
                ].map((anc) => (
                  <button
                    key={anc.id}
                    type="button"
                    onClick={() => setAnchorLine(anc.id)}
                    className={`px-2 py-1 rounded-lg font-bold transition-all ${
                      anchorLine === anc.id
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {anc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Hemispatial Balance Meter */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">النصف الأيسر (Left)</span>
              <span className="text-sm font-black text-indigo-300">
                {leftFound} / {leftTargets} ({leftPercent}%)
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">المكتشف الكلي</span>
              <span className="text-sm font-black text-emerald-400">
                {correctFound} / {totalTargets}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">النصف الأيمن (Right)</span>
              <span className="text-sm font-black text-pink-300">
                {rightFound} / {rightTargets} ({rightPercent}%)
              </span>
            </div>
          </div>

          {/* Interactive Scanning Board with Optional Anchor Line */}
          <div className="relative rounded-3xl bg-slate-950 border-2 border-slate-800 p-4 shadow-inner overflow-hidden flex">
            {/* Left Red Anchor Line */}
            {anchorLine === 'left' && (
              <div
                className="w-2.5 bg-rose-600 rounded-full my-1 ml-3 shrink-0 shadow-lg shadow-rose-600/50 animate-pulse"
                title="خط التثبيت البصري الأيسر"
              />
            )}

            {/* Grid Container */}
            <div
              className="flex-1 grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${activeGridConfig.cols}, minmax(0, 1fr))`,
              }}
            >
              {grid.map((cell) => {
                let cellStyle = 'bg-slate-900/90 border-slate-800 hover:border-purple-500 hover:bg-slate-850';
                if (cell.selected) {
                  if (cell.isTarget) {
                    cellStyle = 'bg-emerald-500/25 border-emerald-500 ring-2 ring-emerald-400 text-emerald-200 scale-95 shadow-md shadow-emerald-500/20';
                  } else {
                    cellStyle = 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-400 text-rose-200 scale-95';
                  }
                }

                return (
                  <button
                    key={cell.id}
                    type="button"
                    onClick={() => handleCellClick(cell)}
                    className={`aspect-square rounded-2xl border-2 flex items-center justify-center font-bold text-xl sm:text-2xl transition-all select-none active:scale-90 ${cellStyle}`}
                  >
                    {cell.symbol}
                  </button>
                );
              })}
            </div>

            {/* Right Red Anchor Line */}
            {anchorLine === 'right' && (
              <div
                className="w-2.5 bg-rose-600 rounded-full my-1 mr-3 shrink-0 shadow-lg shadow-rose-600/50 animate-pulse"
                title="خط التثبيت البصري الأيمن"
              />
            )}
          </div>

          {/* Complete Button */}
          <button
            type="button"
            onClick={handleFinish}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-purple-600/25 flex items-center justify-center space-x-2 space-x-reverse transition-all active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>إنهاء وحساب مؤشرات المسح الفراغي</span>
          </button>
        </div>
      ) : (
        /* Results & Hemispatial Analytics Card */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-400 to-indigo-400 flex items-center justify-center text-slate-950 mx-auto shadow-xl shadow-purple-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-xl font-black text-white">تقرير المسح البصري والتوازن النصفي 🌟</h4>
            <p className="text-xs text-slate-400">
              تحليل دقة المسح الفراغي ومعدل الإغفالات بين النصفين البصريين الأيسر والأيمن
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">الدقة الكلية</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{accuracy}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">دقة النصف الأيسر</span>
              <span className={`text-2xl font-black font-mono ${leftPercent < 70 ? 'text-rose-400' : 'text-indigo-300'}`}>
                {leftPercent}%
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">دقة النصف الأيمن</span>
              <span className="text-2xl font-black font-mono text-pink-300">{rightPercent}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">زمن الإنجاز</span>
              <span className="text-2xl font-black font-mono text-purple-300">{timerSeconds}s</span>
            </div>
          </div>

          {leftOmissions > 1 && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-200 text-xs flex items-center space-x-2 space-x-reverse text-right leading-relaxed">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <div>
                <strong className="block font-black text-rose-300 mb-0.5">مؤشر سريري للإهمال النصفي الأيسر (Left Neglect):</strong>
                وجود {leftOmissions} إغفال في المجال البصري الأيسر مقابل {rightOmissions} في الأيمن يستدعي تعزيز التدريب باستخدام خط التثبيت الأحمر وتوجيه حركة الرأس يساراً.
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 space-x-reverse justify-center pt-2">
            <button
              type="button"
              onClick={handleRestart}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة الاختبار</span>
            </button>

            {onComplete && (
              <button
                type="button"
                onClick={onComplete}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs transition-all shadow-md"
              >
                العودة للكتالوج
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
