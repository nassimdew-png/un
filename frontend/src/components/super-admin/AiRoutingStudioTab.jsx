import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  Activity,
  DollarSign,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Key,
  Shield,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Layers,
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function AiRoutingStudioTab() {
  const [data, setData] = useState({
    providers: [],
    task_routes: [],
    stats: {
      total_tokens: 0,
      total_cost_usd: 0,
      total_cost_dzd: 0,
      failover_count: 0,
      active_providers_count: 0,
    },
    provider_distribution: [],
    recent_logs: [],
  });

  const [loading, setLoading] = useState(true);
  const [pingingId, setPingingId] = useState(null);
  const [editingProvider, setEditingProvider] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchStudioData = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getAiRoutingOverview();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load AI Routing Studio:', err);
      showFeedback('error', err.message || 'فشل تحميل بيانات استوديو توجيه الذكاء الاصطناعي.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudioData();
  }, []);

  const handlePing = async (id) => {
    setPingingId(id);
    try {
      const res = await superAdminApi.pingAiProvider(id);
      if (res.success) {
        showFeedback('success', `استجابة المزود: ${res.latency_ms} ms (${res.status_label_ar})`);
        fetchStudioData();
      }
    } catch (err) {
      showFeedback('error', 'فشل فحص كمون المزود.');
    } finally {
      setPingingId(null);
    }
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();
    if (!editingProvider) return;
    try {
      const res = await superAdminApi.updateAiProvider(editingProvider.id, editingProvider);
      if (res.success) {
        showFeedback('success', res.message || 'تم حفظ إعدادات المزود بنجاح.');
        setEditingProvider(null);
        fetchStudioData();
      }
    } catch (err) {
      showFeedback('error', err.message || 'فشل حفظ المزود.');
    }
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    if (!editingRoute) return;
    try {
      const res = await superAdminApi.updateAiTaskRoute(editingRoute.id, editingRoute);
      if (res.success) {
        showFeedback('success', res.message || 'تم تحديث مسار المهمة السريرية بنجاح.');
        setEditingRoute(null);
        fetchStudioData();
      }
    } catch (err) {
      showFeedback('error', err.message || 'فشل تحديث المسار.');
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 1. Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black shadow-inner">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>التبديل الذكي بين مزودي الذكاء الاصطناعي وتتبع التكلفة</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20">
                AI Routing & Cost Studio ⚡
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              إدارة المزودين المتعددين (Gemini, OpenAI, Claude, DeepSeek, Groq)، التبديل التلقائي للطوارئ (Failover Cascade)، وحساب التكلفة اللحظية
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStudioData}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition self-start md:self-auto"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 space-x-reverse ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 2. Hero Telemetry Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-slate-400 text-[11px] font-bold flex items-center justify-between mb-1">
            <span>التكلفة التقديرية (هذا الشهر)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${data.stats.total_cost_usd}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
            ≈ {Number(data.stats.total_cost_dzd || 0).toLocaleString()} د.ج
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-slate-400 text-[11px] font-bold flex items-center justify-between mb-1">
            <span>إجمالي استهلاك التوكنات</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {Number(data.stats.total_tokens || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">Tokens هذا الشهر</div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-slate-400 text-[11px] font-bold flex items-center justify-between mb-1">
            <span>تحويلات الطوارئ التلقائية</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {data.stats.failover_count}
          </div>
          <div className="text-[10px] text-slate-400">Failover Cascades نشطة</div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-slate-400 text-[11px] font-bold flex items-center justify-between mb-1">
            <span>المزودون النشطون في البوابة</span>
            <Server className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {data.stats.active_providers_count} / {data.providers.length}
          </div>
          <div className="text-[10px] text-emerald-400">
            {data.stats.active_providers_count > 0 ? `${data.stats.active_providers_count} مزود نشط وجاهز 🟢` : 'تحتاج لضبط مفاتيح الـ API 🟡'}
          </div>
        </div>
      </div>

      {/* 3. Multi-Provider Gateway Cards */}
      <div className="space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          <span>بوابة مزودي الذكاء الاصطناعي ومؤشرات الأداء اللحظية</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.providers.map((provider) => (
            <div
              key={provider.id}
              className={`p-5 rounded-3xl border transition flex flex-col justify-between shadow-xl ${
                provider.is_active ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-950/60 border-slate-800/60 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                  <div>
                    <div className="font-bold text-white text-sm">{provider.name}</div>
                    <div className="text-[10px] font-mono text-indigo-400 font-bold">{provider.default_model}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    !provider.has_key || provider.status === 'unconfigured'
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : provider.status === 'healthy'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : provider.status === 'degraded'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}>
                    {!provider.has_key || provider.status === 'unconfigured'
                      ? 'غير مهيأ ⚪'
                      : provider.status === 'healthy'
                      ? 'مستقر 🟢'
                      : provider.status === 'degraded'
                      ? 'بطيء 🟡'
                      : 'معطل 🔴'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>مفتاح الـ API:</span>
                    <span className="font-mono text-slate-300 text-[11px]">{provider.masked_key}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>زمن الاستجابة (Latency):</span>
                    <span className="font-mono text-emerald-400 font-bold">{provider.latency_ms} ms</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>سعر التوكنات (1M In/Out):</span>
                    <span className="font-mono text-slate-300">${provider.pricing_input_1m} / ${provider.pricing_output_1m}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handlePing(provider.id)}
                  disabled={pingingId === provider.id}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-400 ${pingingId === provider.id ? 'animate-spin' : ''}`} />
                  <span>فحص الكمون (Ping)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingProvider(provider)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition"
                >
                  تعديل الإعدادات
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Intelligent Task Routing Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-sm flex items-center gap-2 pb-2 border-b border-slate-800">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>مصفوفة التوجيه الذكي للمهام السريرية (Task Routing & Failover Cascade)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="p-4">المهمة السريرية</th>
                <th className="p-4">المزود والموديل الأساسي (Primary)</th>
                <th className="p-4">مسار الطوارئ التلقائي (Fallback Cascade)</th>
                <th className="p-4">درجة الإبداع (Temp)</th>
                <th className="p-4">الحد الأقصى (Max Tokens)</th>
                <th className="p-4 text-center">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {data.task_routes.map((route) => (
                <tr key={route.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-bold text-white">
                    <div>{route.task_label_ar}</div>
                    <div className="text-[10px] font-mono text-slate-500">{route.task_type}</div>
                  </td>

                  <td className="p-4">
                    <div className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>{route.primary_provider}: {route.primary_model}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-mono text-amber-400 font-bold flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span>{route.fallback_provider}: {route.fallback_model}</span>
                    </div>
                  </td>

                  <td className="p-4 font-mono text-slate-300">
                    {route.temperature}
                  </td>

                  <td className="p-4 font-mono text-slate-300">
                    {route.max_tokens}
                  </td>

                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => setEditingRoute(route)}
                      className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition"
                    >
                      تغيير المسار
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Recent Cost & Performance Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>سجل استهلاك التوكنات وتكلفة العمليات اللحظية</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">آخر 15 استدعاء</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="p-3">العيادة المستفيدة</th>
                <th className="p-3">نوع المهمة</th>
                <th className="p-3">المزود والموديل</th>
                <th className="p-3">التوكنات</th>
                <th className="p-3">التكلفة ($)</th>
                <th className="p-3">التكلفة (د.ج)</th>
                <th className="p-3">الكمون (Latency)</th>
                <th className="p-3">مسار الطوارئ</th>
                <th className="p-3">التوقيت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
              {data.recent_logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500 font-sans text-xs">
                    لم تُسجل أي استدعاءات ذكاء اصطناعي بعد.
                  </td>
                </tr>
              ) : (
                data.recent_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-sans font-bold text-white">{log.clinic_name}</td>
                    <td className="p-3 text-slate-300 font-sans">{log.task_type}</td>
                    <td className="p-3 text-indigo-400">{log.provider_slug} ({log.model_name})</td>
                    <td className="p-3 text-white font-bold">{Number(log.tokens || 0).toLocaleString()}</td>
                    <td className="p-3 text-emerald-400">{log.cost_usd}</td>
                    <td className="p-3 text-slate-300">{log.cost_dzd}</td>
                    <td className="p-3 text-amber-400">{log.latency_ms} ms</td>
                    <td className="p-3 font-sans">
                      {log.was_fallback ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-bold">
                          تم تفعيل البديل ⚠️
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">أساسي ✓</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400 text-[10px]">{log.created_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDIT PROVIDER CONFIG */}
      {editingProvider && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-right animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">تعديل مزود: {editingProvider.name}</h3>
              <button onClick={() => setEditingProvider(null)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">مفتاح الـ API (API Key):</label>
                <input
                  type="password"
                  value={editingProvider.api_key || ''}
                  onChange={(e) => setEditingProvider({ ...editingProvider, api_key: e.target.value })}
                  placeholder="ألصق مفتاح API الجديد هنا..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">الموديل الافتراضي:</label>
                <input
                  type="text"
                  value={editingProvider.default_model || ''}
                  onChange={(e) => setEditingProvider({ ...editingProvider, default_model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold">سعر الإدخال لكل 1M ($):</label>
                  <input
                    type="number"
                    step="0.001"
                    value={editingProvider.pricing_input_1m || 0}
                    onChange={(e) => setEditingProvider({ ...editingProvider, pricing_input_1m: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold">سعر الإخراج لكل 1M ($):</label>
                  <input
                    type="number"
                    step="0.001"
                    value={editingProvider.pricing_output_1m || 0}
                    onChange={(e) => setEditingProvider({ ...editingProvider, pricing_output_1m: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingProvider.is_active}
                    onChange={(e) => setEditingProvider({ ...editingProvider, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800"
                  />
                  <span>المزود مفعّل وجاهز للاستدعاء</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg mt-2"
              >
                حفظ التغييرات
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ROUTE */}
      {editingRoute && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-right animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">تعديل مسار: {editingRoute.task_label_ar}</h3>
              <button onClick={() => setEditingRoute(null)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">المزود الأساسي (Primary):</label>
                <select
                  value={editingRoute.primary_provider}
                  onChange={(e) => setEditingRoute({ ...editingRoute, primary_provider: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                >
                  <option value="gemini">Google Gemini AI</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="deepseek">DeepSeek AI</option>
                  <option value="groq">Groq LPU</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">الموديل الأساسي:</label>
                <input
                  type="text"
                  value={editingRoute.primary_model}
                  onChange={(e) => setEditingRoute({ ...editingRoute, primary_model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">مزود الطوارئ البديل (Fallback Cascade):</label>
                <select
                  value={editingRoute.fallback_provider}
                  onChange={(e) => setEditingRoute({ ...editingRoute, fallback_provider: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                >
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                  <option value="gemini">Google Gemini AI</option>
                  <option value="groq">Groq LPU (Ultra Fast)</option>
                  <option value="deepseek">DeepSeek AI</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">موديل الطوارئ البديل:</label>
                <input
                  type="text"
                  value={editingRoute.fallback_model}
                  onChange={(e) => setEditingRoute({ ...editingRoute, fallback_model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold">Temperature:</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={editingRoute.temperature}
                    onChange={(e) => setEditingRoute({ ...editingRoute, temperature: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-bold">Max Tokens:</label>
                  <input
                    type="number"
                    value={editingRoute.max_tokens}
                    onChange={(e) => setEditingRoute({ ...editingRoute, max_tokens: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-lg mt-2"
              >
                تحديث مسار المهمة
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
