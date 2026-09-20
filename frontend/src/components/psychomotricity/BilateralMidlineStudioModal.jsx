import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  FileText,
  X,
  Target,
  Layers,
  Award,
  Zap,
  Info,
  Sliders,
  Scissors,
  Eye,
  PenTool,
  MoveHorizontal
} from 'lucide-react';

const BILATERAL_ASSESSMENT_TASKS = [
  {
    id: 'visual_tracking',
    title: '1. التتبع البصري عبر خط الوسط (Visual Midline Tracking)',
    desc: 'متابعة حركة هدف بصري أفقياً من أقصى اليمين إلى أقصى اليسار دون تحريك الرأس أو فقدان التثبيت البصري عند نقطة المنتصف.',
    targetSkill: 'تآزر بصري حركي واجتياز خط الوسط البصري'
  },
  {
    id: 'hand_to_opposite',
    title: '2. لمس الأذن والكتف المعاكس (Cross-body Upper Extremities)',
    desc: 'لمس اليد اليمنى لشحمة الأذن اليسرى، واليد اليسرى للركبة اليمنى بشكل متقاطع وسلس دون تردد.',
    targetSkill: 'تكامل حركي للأطراف العلوية وعبور الخط الوهمي للجسم'
  },
  {
    id: 'bilateral_symmetrical',
    title: '3. التنسيق الثنائي المتناظر (Symmetrical Coordination)',
    desc: 'الرسم باليدين معاً في نفس الوقت (دوائر متناظرة، حركات تصفيق إيقاعي متناظر).',
    targetSkill: 'التآزر الحركي المتطابق بين نصفي الدماغ'
  },
  {
    id: 'bilateral_reciprocal',
    title: '4. التنسيق الحركي التبادلي المتقاطع (Reciprocal Bilateral Integration)',
    desc: 'حركات تبادلية متناوبة (يد تفتح والأخرى تقبض، أو رفع الركبة اليمنى مع الذراع اليسرى بالتناوب).',
    targetSkill: 'تثبيط الحركات المصاحبة (Synkinesias) والتنظيم العصبي العضلي'
  },
  {
    id: 'spatial_laterality',
    title: '5. الوعي بالجانبية واليمين واليسار (Spatial Laterality & Directionality)',
    desc: 'التمييز السريع بين اليمين واليسار على جسم المريض ثم على جسم الفاحص المواجه له.',
    targetSkill: 'المخطط الجسدي والإدراك الفراغي (Body Schema)'
  }
];

export default function BilateralMidlineStudioModal({ isOpen, onClose, patientName = 'المريض', onInjectSoap }) {
  if (!isOpen) return null;

  // Task Scoring: 'intact' (متقن 2) | 'emerging' (في طور الاكتساب 1) | 'impaired' (صعوبة/عجز 0)
  const [taskScores, setTaskScores] = useState({
    visual_tracking: 'intact',
    hand_to_opposite: 'intact',
    bilateral_symmetrical: 'intact',
    bilateral_reciprocal: 'emerging',
    spatial_laterality: 'intact'
  });

  // Dominance Laterality
  const [handDominance, setHandDominance] = useState('right'); // 'right' | 'left' | 'cross' | 'mixed'
  const [footDominance, setFootDominance] = useState('right');
  const [eyeDominance, setEyeDominance] = useState('right');

  // Interactive Mirror Drawing Canvas
  const [isMirrorMode, setIsMirrorMode] = useState(true);
  const [brushColor, setBrushColor] = useState('#06b6d4'); // Cyan
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Set up canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Fill background with dark slate
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw central midline dashed guide
    drawMidlineGuide(ctx, canvas.width, canvas.height);
  }, []);

  const drawMidlineGuide = (ctx, w, h) => {
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.restore();
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawMidlineGuide(ctx, canvas.width, canvas.height);
  };

  // Canvas Drawing Handlers
  const startDrawing = (e) => {
    isDrawingRef.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
    }
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw main stroke
    ctx.strokeStyle = brushColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // If Mirror Mode enabled, draw mirrored stroke across central midline
    if (isMirrorMode) {
      const mirrorX = canvas.width - x;
      ctx.save();
      ctx.strokeStyle = '#ec4899'; // Pink mirror stroke
      ctx.beginPath();
      ctx.arc(mirrorX, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ec4899';
      ctx.fill();
      ctx.restore();
    }
  };

  // Calculate score index
  const calculateTotalScore = () => {
    let total = 0;
    Object.values(taskScores).forEach((val) => {
      if (val === 'intact') total += 2;
      else if (val === 'emerging') total += 1;
    });
    return total; // Max 10
  };

  const totalScore = calculateTotalScore();

  const getScoreSummary = (score) => {
    if (score >= 9) return { label: 'تكامل ثنائي ممتاز وعبور سلس لخط الوسط (9-10/10)', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800' };
    if (score >= 6) return { label: 'تكامل ثنائي معتدل مع صعوبات جزئية في التناوب (6-8/10)', color: 'text-amber-400 bg-amber-950/40 border-amber-800' };
    return { label: 'صعوبة ملحوظة في اجتياز خط الوسط الحركي (< 6/10)', color: 'text-rose-400 bg-rose-950/40 border-rose-800' };
  };

  const getDominanceLabel = (d) => {
    switch (d) {
      case 'right': return 'أيمن متجانس (Right)';
      case 'left': return 'أيسر متجانس (Left)';
      case 'cross': return 'جانبية متقاطعة (Crossed Laterality)';
      case 'mixed': return 'جانبية غير مكتملة التمايز (Mixed/Ambidextrous)';
      default: return d;
    }
  };

  const handleInjectSoap = () => {
    const summary = getScoreSummary(totalScore);

    const text = `
⚖️ **جلسة التكامل الثنائي واجتياز خط الوسط الحركي (Bilateral Integration & Midline Crossing):**
- **مؤشر التناسق الثنائي الإجمالي:** ${totalScore} / 10 درجات — [${summary.label}]
- **الجانبية والسيطرة النصفية:** اليد (${getDominanceLabel(handDominance)}) | القدم (${getDominanceLabel(footDominance)}) | العين (${getDominanceLabel(eyeDominance)})
- **نتائج المهام السريرية المفصلة:**
${BILATERAL_ASSESSMENT_TASKS.map((t) => {
  const status = taskScores[t.id] === 'intact' ? 'متقن (Intact)' : taskScores[t.id] === 'emerging' ? 'في طور الاكتساب (Emerging)' : 'صعوبة واضحة (Impaired)';
  return `  • ${t.title}: ${status}`;
}).join('\n')}
- **تطبيق تمرين المرآة والرسم الثنائي:** تم إنجاز تمرين التتبع المتناظر عبر لوحة خط الوسط (Mirror Drawing Canvas) مع ملاحظة ثبات الجذع واستقلالية حركة الأطراف.
- **التوصيات العلاجية:** تعزيز التمارين المتقاطعة (Cross-Crawl)، أنشطة دمج خط الوسط البصري والحركي، وتثبيط الحركات المصاحبة (Synkinesias).
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <MoveHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">مصفوفة التكامل الثنائي واجتياز خط الوسط الحركي</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Bilateral & Midline Matrix
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تقييم وإعادة تأهيل التناسق بين شقي الجسم والجانبية للمريض ({patientName})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Score Strip */}
        <div className="px-6 py-2.5 bg-slate-950/30 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">مؤشر التكامل الثنائي:</span>
            <span className="font-mono font-bold text-cyan-300 text-sm">{totalScore} / 10</span>
          </div>
          <div className={`px-3 py-1 rounded-xl text-xs font-bold border ${getScoreSummary(totalScore).color}`}>
            {getScoreSummary(totalScore).label}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TOP SECTION: Laterality Profile & Dominance Selector */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>الملف الجانبي والسيطرة النصفية (Laterality Profile)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Hand Dominance */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
                <label className="block text-xs text-slate-400 mb-1 font-medium">اليد المسيطرة (Hand):</label>
                <select
                  value={handDominance}
                  onChange={(e) => setHandDominance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-medium"
                >
                  <option value="right">يمينية واضحة (Right)</option>
                  <option value="left">يسارية واضحة (Left)</option>
                  <option value="cross">متقاطعة / تبادلية</option>
                  <option value="mixed">غير محددة (Ambidextrous)</option>
                </select>
              </div>

              {/* Foot Dominance */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
                <label className="block text-xs text-slate-400 mb-1 font-medium">القدم المسيطرة (Foot):</label>
                <select
                  value={footDominance}
                  onChange={(e) => setFootDominance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-medium"
                >
                  <option value="right">القدم اليمنى (Right)</option>
                  <option value="left">القدم اليسرى (Left)</option>
                  <option value="cross">متقاطعة مع اليد</option>
                </select>
              </div>

              {/* Eye Dominance */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
                <label className="block text-xs text-slate-400 mb-1 font-medium">العين الموجهة (Eye):</label>
                <select
                  value={eyeDominance}
                  onChange={(e) => setEyeDominance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-medium"
                >
                  <option value="right">العين اليمنى (Right)</option>
                  <option value="left">العين اليسرى (Left)</option>
                  <option value="cross">متقاطعة (Cross-Dominance)</option>
                </select>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN LOWER SECTION: 5 Clinical Assessment Tasks & Mirror Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left: 5 Tasks Evaluation Grid (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-950/40 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">بطارية تقييم عبور خط الوسط (Ayres / Harris Tasks)</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {BILATERAL_ASSESSMENT_TASKS.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white">{task.title}</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{task.desc}</p>
                      </div>
                    </div>

                    {/* 3 State Radios */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 text-xs">
                      {[
                        { val: 'intact', label: 'متقن وسلس (2)', color: 'text-emerald-400 bg-emerald-950/30 border-emerald-800' },
                        { val: 'emerging', label: 'في طور الاكتساب (1)', color: 'text-amber-400 bg-amber-950/30 border-amber-800' },
                        { val: 'impaired', label: 'صعوبة / تعثر (0)', color: 'text-rose-400 bg-rose-950/30 border-rose-800' }
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() => setTaskScores((prev) => ({ ...prev, [task.id]: opt.val }))}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-medium border transition-all ${
                            taskScores[task.id] === opt.val
                              ? `${opt.color} font-bold shadow-sm`
                              : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Mirror Drawing Canvas & Cross-Track Workspace (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">لوحة الرسم المتناظر والمرآتي (Mirror Canvas)</span>
                  </div>
                  <button
                    onClick={() => setIsMirrorMode(!isMirrorMode)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                      isMirrorMode
                        ? 'bg-pink-950/60 text-pink-300 border-pink-700'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isMirrorMode ? 'المرآة مفعلة 🪞' : 'رسم عادي'}
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 mb-2">
                  تمرين المريض على الرسم عبر خط الوسط الفاصل لتنشيط التنسيق بين نصفي المخ:
                </div>

                {/* Canvas Container */}
                <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative flex items-center justify-center touch-none">
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={260}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    className="cursor-crosshair w-full max-w-[380px] h-[220px]"
                  />
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-600 pointer-events-none">
                    شمال (Left)
                  </div>
                  <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-600 pointer-events-none">
                    يمين (Right)
                  </div>
                </div>
              </div>

              {/* Canvas Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  {['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ffffff'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        brushColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <button
                  onClick={handleClearCanvas}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  مسح اللوحة
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>يعد اجتياز خط الوسط ركيزة أساسية لاكتساب مهارات الكتابة، القراءة، والتنظيم المكاني الحركي</span>
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
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-sm font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
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
