import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Sparkles,
  Search,
  Mic,
  RefreshCw,
  Copy,
  Check,
  Code2,
  Table as TableIcon,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Zap,
  DollarSign,
  Users,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { aiAnalyticsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import PrintableClinicalReport from '../common/PrintableClinicalReport';

export default function AiDataAnalystView() {
  const { user, tenant } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin' || user?.is_super_admin === true;

  const [prompt, setPrompt] = useState('');
  const [scope, setScope] = useState(isSuperAdmin ? 'superadmin' : 'clinic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // UI View States
  const [showSql, setShowSql] = useState(false);
  const [viewMode, setViewMode] = useState('chart'); // 'chart', 'table'
  const [printableModal, setPrintableModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Clinic Presets vs SuperAdmin Presets
  const clinicPresets = [
    { label: '👥 توزيع المرضى حسب الجنس', query: 'أعطني عدد وتوزيع المرضى المسجلين في العيادة حسب الجنس' },
    { label: '💰 المداخيل الشهرية لعام 2026', query: 'أعطني إجمالي المداخيل المالية الشهرية المحصلة من الفواتير المدفوعة' },
    { label: '⏱️ نسبة الالتزام بالمواعيد والحضور', query: 'ما هي نسبة توزيع حالات المواعيد وحضور الجلسات في العيادة؟' },
    { label: '🧠 أكثر التقييمات والحصائل إنجازاً', query: 'أكثر أنواع المقاييس السريرية والحصائل التشخيصية استخداماً في العيادة' },
    { label: '🤖 استهلاك توكنز الـ AI', query: 'توزيع استهلاك توكنز الذكاء الاصطناعي حسب الميزات المستخدمة في العيادة' },
  ];

  const superAdminPresets = [
    { label: '👑 توزيع العيادات حسب النشاط', query: 'أعطني توزيع العيادات المشتركة في المنصة حسب الولاية والنوع' },
    { label: '📈 أكثر العيادات استهلاكاً للـ AI', query: 'أكثر 10 عيادات استهلاكاً لتوكنز الذكاء الاصطناعي هذا الشهر' },
    { label: '💵 إجمالي إيرادات الفواتير بالمنصة', query: 'مقارنة إجمالي الفواتير المحصلة عبر المنصة شهرياً' },
    { label: '📊 توزيع حالات الاشتراكات', query: 'ما هو توزيع اشتراكات العيادات حسب الخطة والحالة الحالية؟' },
  ];

  const presets = scope === 'superadmin' ? superAdminPresets : clinicPresets;

  const handleRunQuery = async (customQuery = null) => {
    const q = (customQuery || prompt).trim();
    if (!q || loading) return;

    if (customQuery) setPrompt(customQuery);
    setLoading(true);
    setError(null);

    try {
      const res = await aiAnalyticsApi.query({
        prompt: q,
        scope,
      });

      if (res.success) {
        setResult(res);
      } else {
        throw new Error(res.message || 'فشل استخراج البيانات');
      }
    } catch (err) {
      console.error('Data Analyst Query Error:', err);
      setError(err.message || 'تعذر استخراج البيانات. يرجى إعادة صياغة السؤال.');
    } finally {
      setLoading(false);
    }
  };

  // Initial Query on Mount
  useEffect(() => {
    handleRunQuery(presets[0].query);
  }, [scope]);

  const handleExportCsv = () => {
    if (!result?.data || result.data.length === 0) return;
    const headers = Object.keys(result.data[0]);
    const csvRows = [
      headers.join(','),
      ...result.data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleCopySummary = () => {
    if (!result?.summary) return;
    navigator.clipboard.writeText(result.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom Responsive SVG Bar/Line/Pie Chart Renderers
  const renderDynamicChart = () => {
    if (!result?.data || result.data.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
          <BarChart3 className="w-10 h-10 text-slate-700" />
          <span className="text-xs">لا توجد بيانات كافية لرسم المخطط البياني.</span>
        </div>
      );
    }

    const { chart_type, x_key, y_key } = result.chartConfig || {};
    const data = result.data;

    const labels = data.map(d => String(d[x_key] ?? Object.values(d)[0] ?? ''));
    const values = data.map(d => {
      const val = d[y_key] ?? Object.values(d)[1] ?? 0;
      return typeof val === 'number' ? val : parseFloat(val) || 0;
    });

    const maxValue = Math.max(...values, 1);
    const colors = [
      '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1', '#14b8a6', '#f43f5e'
    ];

    // 1. PIE / DOUGHNUT CHART
    if (chart_type === 'pie' || chart_type === 'doughnut') {
      const totalSum = values.reduce((acc, v) => acc + v, 0) || 1;
      let cumulativeAngle = 0;

      return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-6">
          {/* SVG Donut */}
          <div className="relative w-56 h-56 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {values.map((v, i) => {
                const percentage = v / totalSum;
                const strokeDasharray = `${percentage * 282.7} 282.7`;
                const strokeDashoffset = -cumulativeAngle * 282.7;
                cumulativeAngle += percentage;
                const color = colors[i % colors.length];

                return (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke={color}
                    strokeWidth="12"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 hover:opacity-80"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-400 font-bold">الإجمالي</span>
              <span className="text-lg font-black text-white font-mono">{totalSum.toLocaleString()}</span>
            </div>
          </div>

          {/* Legends */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-2 w-full max-w-xs text-xs">
            {labels.map((l, i) => {
              const val = values[i];
              const pct = ((val / totalSum) * 100).toFixed(1);
              const color = colors[i % colors.length];

              return (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-2 space-x-reverse truncate">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-bold text-slate-200 truncate">{l || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse font-mono text-[11px] shrink-0">
                    <span className="text-white font-bold">{val.toLocaleString()}</span>
                    <span className="text-slate-400">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 2. LINE / SPLINE AREA CHART
    if (chart_type === 'line') {
      const height = 200;
      const width = 500;
      const stepX = width / Math.max(values.length - 1, 1);

      const points = values.map((v, i) => {
        const x = i * stepX;
        const y = height - (v / maxValue) * (height - 30) - 15;
        return `${x},${y}`;
      }).join(' ');

      return (
        <div className="space-y-4 py-4">
          <div className="w-full h-56 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <polygon
                points={`0,${height} ${points} ${(values.length - 1) * stepX},${height}`}
                fill="url(#lineAreaGrad)"
              />

              {/* Spline Path */}
              <polyline
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Point Markers */}
              {values.map((v, i) => {
                const x = i * stepX;
                const y = height - (v / maxValue) * (height - 30) - 15;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="5" fill="#8b5cf6" className="ring-4 ring-purple-500/20" />
                    <text x={x} y={y - 10} textAnchor="middle" fill="#c4b5fd" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      {v.toLocaleString()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-2">
            {labels.map((l, i) => (
              <span key={i} className="truncate max-w-[80px] text-center">{l}</span>
            ))}
          </div>
        </div>
      );
    }

    // 3. BAR CHART (DEFAULT)
    return (
      <div className="space-y-4 py-4">
        <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6">
          {values.map((v, i) => {
            const pct = Math.max((v / maxValue) * 100, 4);
            const color = colors[i % colors.length];

            return (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-white transition mb-1.5 opacity-0 group-hover:opacity-100">
                  {v.toLocaleString()}
                </span>

                <div
                  className="w-full rounded-t-xl transition-all duration-500 group-hover:brightness-125 relative shadow-lg"
                  style={{
                    height: `${pct}%`,
                    background: `linear-gradient(to top, ${color}dd, ${color})`
                  }}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 rounded-t-xl transition" />
                </div>

                <span className="text-[10px] font-bold text-slate-400 mt-2 truncate w-full text-center group-hover:text-purple-300 transition">
                  {labels[i] || '---'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans text-right max-w-7xl mx-auto" dir="rtl">
      
      {/* 1. Hero Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-950 border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1.5 space-x-reverse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CONVERSATIONAL BI & TEXT-TO-SQL 📊</span>
              </span>
              {isSuperAdmin && (
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setScope('clinic')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      scope === 'clinic' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    بيانات العيادة
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('superadmin')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      scope === 'superadmin' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    إجمالي المنصة (Super Admin)
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              محلل البيانات الذكي ورؤى الأعمال (AI Data Analyst)
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              اطرح أي سؤال باللغة الطبيعية حول المواعيد، الإيرادات، توزيع الحالات، أو استهلاك الميزات لتحصل فوراً على استعلام SQL مؤمّن ومخططات بيانية ديناميكية مع ملخص تنفيذي.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4 shrink-0 flex items-center space-x-3.5 space-x-reverse">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">محرك الاستعلامات:</span>
              <span className="text-xs font-black text-white font-mono">Secure Read-Only SQL</span>
              <span className="text-[10px] text-emerald-400 block font-mono font-bold">⚡ استخراج مباشر في أجزاء من الثانية</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Natural Language Query Input & Quick Presets */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        
        {/* Quick Presets Carousel */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 block">✨ أسئلة تحليلية مقترحة:</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleRunQuery(p.query)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-purple-950/40 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 transition whitespace-nowrap shrink-0 flex items-center space-x-1.5 space-x-reverse"
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleRunQuery(); }} className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="اكتب سؤالك التحليلي هنا (مثال: ما هو توزيع المرضى حسب الجنس؟ أو قارن إيرادات الشهور الماضية)..."
              required
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500 transition shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/25 flex items-center justify-center space-x-2 space-x-reverse transition disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جارٍ الاستعلام والتحليل...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>⚡ تحليل وتوليد المخطط</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 3. Analytical Results Canvas */}
      {result && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Top Metric Highlight Cards (KPIs) */}
          {result.chartConfig?.metrics && result.chartConfig.metrics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {result.chartConfig.metrics.map((m, i) => (
                <div key={i} className="p-5 rounded-3xl bg-slate-900 border border-purple-500/20 shadow-lg space-y-1">
                  <span className="text-xs text-slate-400 font-bold block">{m.label}</span>
                  <div className="text-2xl font-black text-white font-mono">{m.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Main Visual Workspace Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
            
            {/* Canvas Header & View Switchers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center space-x-2 space-x-reverse">
                  <span>{result.chartConfig?.title || 'نتائج التحليل الإحصائي'}</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                    {result.row_count} نتائج
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{result.chartConfig?.subtitle}</p>
              </div>

              {/* View Modes & Export Buttons */}
              <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setViewMode('chart')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 space-x-reverse ${
                      viewMode === 'chart' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>المخطط</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 space-x-reverse ${
                      viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>جدول البيانات</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold transition border border-slate-800 flex items-center space-x-1 space-x-reverse"
                  title="تصدير ملف CSV"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintableModal(true)}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold transition border border-slate-800 flex items-center space-x-1 space-x-reverse"
                  title="طباعة التقرير"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>طباعة</span>
                </button>
              </div>
            </div>

            {/* Dynamic Visual Content */}
            {viewMode === 'chart' ? (
              renderDynamicChart()
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      {Object.keys(result.data[0] || {}).map((col, idx) => (
                        <th key={idx} className="p-3.5 font-mono">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {result.data.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-950/60 transition">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="p-3.5 font-mono text-slate-200">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '---')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* AI Executive Summary Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-950 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-300 flex items-center space-x-2 space-x-reverse">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>الملخص التنفيذي والتوصيات السريرية (Executive Insights)</span>
                </span>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="text-slate-400 hover:text-white text-xs flex items-center space-x-1 space-x-reverse"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {result.summary}
              </div>
            </div>

            {/* Collapsible SQL Query Inspector */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowSql(!showSql)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1.5 space-x-reverse transition"
              >
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                <span>كود الاستعلام البرمجي SQL المعتمد</span>
                {showSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showSql && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-purple-300 font-mono text-xs overflow-x-auto animate-in fade-in">
                  <pre>{result.sql}</pre>
                </div>
              )}
            </div>

          </div>

          {/* Printable Report Modal */}
          {printableModal && (
            <PrintableClinicalReport
              title={`تقرير تحليلي: ${result.chartConfig?.title || 'مؤشرات الأداء السريري والمالي'}`}
              content={`### السؤال والهدف التحليلي:\n${result.prompt}\n\n### الملخص التنفيذي:\n${result.summary}\n\n### كود الاستعلام:\n\`\`\`sql\n${result.sql}\n\`\`\``}
              date={new Date().toLocaleDateString('ar-DZ')}
              documentRef={`ANALYTICS-${Date.now()}`}
              onClose={() => setPrintableModal(false)}
            />
          )}

        </div>
      )}

    </div>
  );
}
