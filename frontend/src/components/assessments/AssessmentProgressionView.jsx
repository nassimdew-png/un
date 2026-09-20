import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  Sparkles, 
  Download, 
  FileSpreadsheet, 
  Award, 
  Activity, 
  Brain, 
  Layers, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Printer
} from 'lucide-react';
import { assessmentApi } from '../../api';

export default function AssessmentProgressionView({ patientId, patientName, onClose }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTestCode, setSelectedTestCode] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const fetchProgression = async (code) => {
    setLoading(true);
    try {
      const res = await assessmentApi.getProgressionAnalytics(patientId, code);
      setData(res);
      if (!selectedTestCode && res.available_tests && res.available_tests.length > 0) {
        setSelectedTestCode(res.available_tests[0].test_code);
      }
    } catch (err) {
      console.error('Error fetching progression analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchProgression(selectedTestCode);
    }
  }, [patientId, selectedTestCode]);

  const handleExportPdf = () => {
    const url = assessmentApi.exportProgressionPdfUrl(patientId, selectedTestCode);
    window.open(url, '_blank');
  };

  const timeline = data?.timeline || [];
  const metrics = data?.metrics;
  const availableTests = data?.available_tests || [];
  const itemComparison = data?.item_comparison || [];

  // ==================== SVG CHART CALCULATIONS ====================
  const chartWidth = 600;
  const chartHeight = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  let points = [];
  if (timeline.length > 0) {
    const scores = timeline.map(t => parseFloat(t.exact_score ?? t.total_score ?? 0));
    const minScore = Math.max(0, Math.min(...scores) - 2);
    const maxScore = Math.max(10, Math.max(...scores) + 4);

    points = timeline.map((item, idx) => {
      const score = parseFloat(item.exact_score ?? item.total_score ?? 0);
      const x = padding.left + (timeline.length === 1 ? innerWidth / 2 : (idx / (timeline.length - 1)) * innerWidth);
      const y = padding.top + innerHeight - ((score - minScore) / (maxScore - minScore || 1)) * innerHeight;
      return { ...item, score, x, y };
    });
  }

  const svgPath = points.length > 1 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}` 
    : '';

  const svgArea = points.length > 1
    ? `M ${points[0].x},${padding.top + innerHeight} L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${padding.top + innerHeight} Z`
    : '';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base sm:text-lg flex items-center space-x-2 space-x-reverse">
              <span>منحنى التطور السريري والمقارنة التراكمية</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                {patientName || (data?.patient ? `${data.patient.first_name} ${data.patient.last_name}` : 'Patient')}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة تطور درجات التقييمات عبر الجلسات وحساب نسب التحسن والمقارنة التفصيلية
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Test Selector Dropdown */}
          <select
            value={selectedTestCode}
            onChange={(e) => setSelectedTestCode(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-teal-500"
          >
            <option value="">-- كل الاختبارات المتاحة --</option>
            {availableTests.map((t) => (
              <option key={t.test_code} value={t.test_code}>
                {t.title} ({t.count} جلسات)
              </option>
            ))}
          </select>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={timeline.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-teal-500/25 flex items-center space-x-1.5 space-x-reverse transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>تصدير تقرير التطور (PDF)</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          جاري تحميل بيانات المنحنى والمؤشرات التطورية...
        </div>
      ) : timeline.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-2">
          <Activity className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">لا توجد تقييمات مسجلة لهذا المريض بعد</p>
          <p className="text-xs text-slate-500">قم بإجراء تقييمين أو أكثر لمشاهدة المنحنى وحساب نسبة التحسن السريري.</p>
        </div>
      ) : (
        <>
          {/* 1. Key Metrics Cards */}
          {metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Baseline */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">التقييم الأولي (Baseline)</span>
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {metrics.baseline.score} <span className="text-xs font-normal text-slate-400">pts</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  بتاريخ : {metrics.baseline.date} ({metrics.baseline.severity || 'Initial'})
                </div>
              </div>

              {/* Latest */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">آخر تقييم (Current)</span>
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <div className="text-2xl font-black text-teal-300 font-mono">
                  {metrics.latest.score} <span className="text-xs font-normal text-slate-400">pts</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  بتاريخ : {metrics.latest.date} ({metrics.latest.severity || 'Current'})
                </div>
              </div>

              {/* Improvement Rate */}
              <div className={`p-4 rounded-3xl border space-y-1 shadow-lg ${
                metrics.is_recovery 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : (metrics.direction === 'stable' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30')
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">نسبة التطور السريري</span>
                  {metrics.is_recovery ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : metrics.direction === 'stable' ? (
                    <Minus className="w-4 h-4 text-amber-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className={`text-2xl font-black font-mono ${
                  metrics.is_recovery ? 'text-emerald-400' : (metrics.direction === 'stable' ? 'text-amber-400' : 'text-rose-400')
                }`}>
                  {metrics.percentage_change}%
                </div>
                <div className="text-[11px] font-bold text-slate-300">
                  {metrics.clinical_trajectory_ar}
                </div>
              </div>

              {/* Sessions Count */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">عدد الجلسات التقييمية</span>
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-indigo-300 font-mono">
                  {metrics.sessions_count} <span className="text-xs font-normal text-slate-400">Séances</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  تغطية كاملة من الجلسة 1 إلى الجلسة {metrics.sessions_count}
                </div>
              </div>
            </div>
          )}

          {/* 2. Interactive SVG Evolution Line Chart */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center space-x-2 space-x-reverse">
                <Activity className="w-4 h-4 text-teal-400" />
                <span>الرسم البياني لتطور الدرجات عبر الزمن (Progression Chart)</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {timeline.length} نقاط مسجلة
              </span>
            </div>

            <div className="w-full overflow-x-auto">
              <div className="min-w-[550px] relative">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                  <defs>
                    <linearGradient id="progGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Horizontal Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = padding.top + innerHeight * ratio;
                    return (
                      <line
                        key={i}
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="#334155"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Shaded Area */}
                  {svgArea && <path d={svgArea} fill="url(#progGradient)" />}

                  {/* Main Line */}
                  {svgPath && (
                    <path
                      d={svgPath}
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points */}
                  {points.map((p, idx) => (
                    <g key={p.id} className="cursor-pointer">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="6"
                        className="fill-teal-400 stroke-slate-900 stroke-2 hover:r-8 transition-all"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      <text
                        x={p.x}
                        y={p.y - 12}
                        textAnchor="middle"
                        className="fill-teal-200 text-[11px] font-mono font-bold"
                      >
                        {p.score}
                      </text>
                      <text
                        x={p.x}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        className="fill-slate-400 text-[9px] font-mono"
                      >
                        {p.date}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Hover Tooltip Card */}
                {hoveredPoint && (
                  <div
                    className="absolute z-20 p-3 rounded-2xl bg-slate-950 border border-teal-500/50 shadow-2xl text-xs space-y-1 pointer-events-none"
                    style={{
                      left: `${Math.min(Math.max(hoveredPoint.x - 70, 10), chartWidth - 160)}px`,
                      top: `${Math.max(hoveredPoint.y - 85, 10)}px`,
                    }}
                  >
                    <div className="font-bold text-white flex justify-between gap-2">
                      <span>جلسة #{hoveredPoint.session_index}</span>
                      <span className="text-teal-400 font-mono">{hoveredPoint.score} pts</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{hoveredPoint.date}</div>
                    <div className="text-[10px] text-slate-300">{hoveredPoint.clinical_interpretation}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Detailed Side-by-Side Item Comparison Table */}
          {itemComparison.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white flex items-center space-x-2 space-x-reverse">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                  <span>جدول المقارنة التفصيلي للبنود (Séance Initiale vs Dernière Séance)</span>
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] uppercase text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">المحور / البند المفحوص</th>
                      <th className="px-4 py-3 text-center">التقييم الأولي</th>
                      <th className="px-4 py-3 text-center">آخر تقييم</th>
                      <th className="px-4 py-3 text-center">الفارق والتطور (&Delta;)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {itemComparison.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-200">{item.label}</td>
                        <td className="px-4 py-3 text-center font-mono text-slate-400 font-bold">
                          {typeof item.baseline_value === 'object' ? JSON.stringify(item.baseline_value) : item.baseline_value}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-white font-bold">
                          {typeof item.latest_value === 'object' ? JSON.stringify(item.latest_value) : item.latest_value}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold">
                          {item.difference !== null ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                              item.difference < 0
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : (item.difference > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400')
                            }`}>
                              {item.difference > 0 ? `+${item.difference}` : item.difference}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
