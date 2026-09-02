import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cpu,
  Zap,
  Activity,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Search,
  Check,
  Edit2,
  Key,
  Flame,
  ArrowRightLeft
} from 'lucide-react';
import { superAdminApi, apiRequest } from '../../api';

export default function AiGovernanceView() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingProvider, setTestingProvider] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Overview Data
  const [stats, setStats] = useState({
    total_tokens_month: 0,
    total_cost_usd: 0,
    total_cost_dzd: 0,
    total_calls: 0,
    fallback_calls: 0,
    success_rate: 100,
    primary_provider: 'openai',
    secondary_provider: 'claude',
    fallback_enabled: true,
  });

  const [apiKeysStatus, setApiKeysStatus] = useState({
    openai: false,
    claude: false,
    gemini: false,
  });

  const [clinics, setClinics] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  // Form Settings State
  const [primaryProvider, setPrimaryProvider] = useState('openai');
  const [secondaryProvider, setSecondaryProvider] = useState('claude');
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  // Quota Adjustment Modal State
  const [selectedClinicForQuota, setSelectedClinicForQuota] = useState(null);
  const [newMonthlyLimit, setNewMonthlyLimit] = useState(100000);
  const [bonusTokens, setBonusTokens] = useState(25000);
  const [updatingQuota, setUpdatingQuota] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/super-admin/ai/overview');
      if (res.success) {
        setStats(res.stats);
        setPrimaryProvider(res.stats.primary_provider || 'openai');
        setSecondaryProvider(res.stats.secondary_provider || 'claude');
        setFallbackEnabled(res.stats.fallback_enabled ?? true);
        setApiKeysStatus(res.api_keys_status || {});
        setClinics(res.clinics || []);
        setRecentLogs(res.recent_logs || []);
      }
    } catch (err) {
      console.error('Failed to load AI overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setFeedback(null);
    try {
      const payload = {
        primary_provider: primaryProvider,
        secondary_provider: secondaryProvider,
        fallback_enabled: fallbackEnabled,
      };
      if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();
      if (claudeKey.trim()) payload.claude_api_key = claudeKey.trim();
      if (geminiKey.trim()) payload.gemini_api_key = geminiKey.trim();

      const res = await apiRequest('/super-admin/ai/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'تم تحديث إعدادات مزودي الذكاء الاصطناعي بنجاح.' });
        fetchOverview();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحديث الإعدادات.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestConnection = async (provider, customKey = null) => {
    setTestingProvider(provider);
    try {
      const res = await apiRequest('/super-admin/ai/test-connection', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          api_key: customKey || undefined,
        }),
      });

      setTestResults((prev) => ({ ...prev, [provider]: res }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, message: err.message || 'فشل الاتصال.' },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleUpdateClinicQuota = async (clinicId, updates) => {
    setUpdatingQuota(true);
    try {
      const res = await apiRequest(`/super-admin/clinics/${clinicId}/ai-quota`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setSelectedClinicForQuota(null);
        fetchOverview();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تعديل الحصة.' });
    } finally {
      setUpdatingQuota(false);
    }
  };

  const handleResetAllMonthlyCounters = async () => {
    if (!window.confirm('هل أنت متأكد من تصفير عداد الاستهلاك الشهري لكافة العيادات وتجديد الرصيد؟')) return;
    try {
      const res = await apiRequest('/super-admin/ai/reset-monthly-usage', { method: 'POST' });
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        fetchOverview();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const filteredClinics = clinics.filter((c) =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.subdomain || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/20">
            🤖
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-lg font-black text-white">إدارة وحوكمة الذكاء الاصطناعي والحصص (AI Governance Suite)</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Multi-Gateway
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              مراقبة التوكنز المستهلكة، ضبط المزودات البديلة (Failover)، وإدارة حصص العيادات المخصصة
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleResetAllMonthlyCounters}
            className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تصفير الاستهلاك الشهري للكل</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
          feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tokens */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>التوكنز المستهلكة (هذا الشهر)</span>
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400">⚡</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats.total_tokens_month.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            إجمالي {stats.total_calls} طلبات سريرية
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>التكلفة التشغيلية التقديرية</span>
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">💵</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ${stats.total_cost_usd.toFixed(4)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            ≈ {stats.total_cost_dzd.toLocaleString()} دج (DZD)
          </div>
        </div>

        {/* Primary Active Provider */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>المزود الأساسي النشط</span>
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">🧠</span>
          </div>
          <div className="text-xl font-black text-indigo-300 uppercase tracking-wide">
            {stats.primary_provider}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center space-x-1 space-x-reverse font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>بوابة التشغيل الرئيسية 🟢</span>
          </div>
        </div>

        {/* Success & Fallback Rate */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>معدل النجاح واستقرار الخدمة</span>
            <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400">🎯</span>
          </div>
          <div className="text-2xl font-black text-teal-300 font-mono">
            {stats.success_rate}%
          </div>
          <div className="text-[11px] text-slate-400">
            {stats.fallback_calls > 0 ? `⚠️ ${stats.fallback_calls} تبديلات طارئة` : '✅ انعدام الانقطاعات'}
          </div>
        </div>
      </div>

      {/* Provider Switcher & Failover Settings Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <Server className="w-5 h-5 text-indigo-400" />
            <h4 className="text-base font-black text-white">إعدادات المزودات والتبديل التلقائي (Multi-Provider Failover)</h4>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse text-xs">
            <label className="text-slate-300 font-bold flex items-center space-x-1.5 space-x-reverse cursor-pointer">
              <input
                type="checkbox"
                checked={fallbackEnabled}
                onChange={(e) => setFallbackEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
              />
              <span>تفعيل التبديل التلقائي عند انقطاع المزود (Auto-Failover)</span>
            </label>
          </div>
        </div>

        {/* Providers Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <label className="text-slate-300 font-bold block">المزود الرئيسي للطلبات السريرية (Primary Provider):</label>
            <div className="grid grid-cols-3 gap-2">
              {['openai', 'claude', 'gemini'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrimaryProvider(p)}
                  className={`p-3 rounded-2xl border font-black uppercase transition ${
                    primaryProvider === p
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 font-bold block">المزود الثانوي الاحتياطي (Secondary Failover):</label>
            <div className="grid grid-cols-3 gap-2">
              {['claude', 'gemini', 'openai'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSecondaryProvider(p)}
                  className={`p-3 rounded-2xl border font-black uppercase transition ${
                    secondaryProvider === p
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* API Keys Configuration & Latency Test Grid */}
        <div className="space-y-3 pt-2">
          <h5 className="text-xs font-black text-slate-300">مفاتيح الربط واختبار سرعة الاستجابة (API Keys & Latency Probes):</h5>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
            {/* OpenAI */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse font-black text-white">
                  <span>OpenAI GPT-4o</span>
                  {apiKeysStatus.openai && <span className="text-[10px] text-emerald-400">🟢 مفعل</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleTestConnection('openai', openaiKey)}
                  disabled={testingProvider === 'openai'}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition disabled:opacity-50"
                >
                  {testingProvider === 'openai' ? 'فحص...' : '🔍 فحص الاتصال'}
                </button>
              </div>

              <input
                type="password"
                placeholder={apiKeysStatus.openai ? '•••••••••••••••• (مضبوط)' : 'sk-proj-...'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px]"
              />

              {testResults.openai && (
                <div className={`p-2 rounded-xl text-[10px] font-bold ${
                  testResults.openai.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                }`}>
                  {testResults.openai.message}
                </div>
              )}
            </div>

            {/* Claude */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse font-black text-white">
                  <span>Claude 3.5 Sonnet</span>
                  {apiKeysStatus.claude && <span className="text-[10px] text-emerald-400">🟢 مفعل</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleTestConnection('claude', claudeKey)}
                  disabled={testingProvider === 'claude'}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition disabled:opacity-50"
                >
                  {testingProvider === 'claude' ? 'فحص...' : '🔍 فحص الاتصال'}
                </button>
              </div>

              <input
                type="password"
                placeholder={apiKeysStatus.claude ? '•••••••••••••••• (مضبوط)' : 'sk-ant-...'}
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px]"
              />

              {testResults.claude && (
                <div className={`p-2 rounded-xl text-[10px] font-bold ${
                  testResults.claude.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                }`}>
                  {testResults.claude.message}
                </div>
              )}
            </div>

            {/* Gemini */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse font-black text-white">
                  <span>Google Gemini 1.5</span>
                  {apiKeysStatus.gemini && <span className="text-[10px] text-emerald-400">🟢 مفعل</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleTestConnection('gemini', geminiKey)}
                  disabled={testingProvider === 'gemini'}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition disabled:opacity-50"
                >
                  {testingProvider === 'gemini' ? 'فحص...' : '🔍 فحص الاتصال'}
                </button>
              </div>

              <input
                type="password"
                placeholder={apiKeysStatus.gemini ? '•••••••••••••••• (مضبوط)' : 'AIzaSy...'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px]"
              />

              {testResults.gemini && (
                <div className={`p-2 rounded-xl text-[10px] font-bold ${
                  testResults.gemini.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                }`}>
                  {testResults.gemini.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-500/20 transition flex items-center space-x-1.5 space-x-reverse disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{savingSettings ? 'جاري الحفظ...' : '💾 حفظ وتثبيت إعدادات المزودات'}</span>
          </button>
        </div>
      </div>

      {/* Clinic AI Quota Management Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-black text-white">إدارة حصص العيادات واستهلاك التوكنز (Clinics AI Quota Metering)</h4>
            <p className="text-xs text-slate-400">متابعة الحصة الشهرية، إضافة أرصدة إضافية، وتصفير العدادات</p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث باسم العيادة أو النطاق..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold">
                <th className="py-3 px-4">العيادة</th>
                <th className="py-3 px-4">النطاق الفرعي</th>
                <th className="py-3 px-4">الاستهلاك / الحد الشهري</th>
                <th className="py-3 px-4">مؤشر الاستهلاك</th>
                <th className="py-3 px-4">الرصيد المتبقي</th>
                <th className="py-3 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClinics.map((clinic) => {
                const percent = clinic.usage_percentage;
                const progressColor =
                  percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-500' : 'bg-emerald-500';

                return (
                  <tr key={clinic.id} className="hover:bg-slate-950/40 transition">
                    <td className="py-3 px-4 font-bold text-white">{clinic.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{clinic.subdomain}.psypro.tech</td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-white">{clinic.used_this_month.toLocaleString()}</span>
                      <span className="text-slate-500"> / {clinic.monthly_limit.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4 w-44">
                      <div className="space-y-1">
                        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                          <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{percent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-400">
                      {clinic.balance ? clinic.balance.toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 space-x-reverse">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClinicForQuota(clinic);
                            setNewMonthlyLimit(clinic.monthly_limit);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition"
                        >
                          تعديل الحصة ⚙️
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateClinicQuota(clinic.id, { reset_usage: true })}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] transition"
                          title="تصفير الاستهلاك وتجديد الرصيد"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quota Modal */}
      {selectedClinicForQuota && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-black text-white">تعديل حصة الذكاء الاصطناعي: {selectedClinicForQuota.name}</h4>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">السقف الشهري للتوكنز (Monthly Token Limit):</label>
                <input
                  type="number"
                  value={newMonthlyLimit}
                  onChange={(e) => setNewMonthlyLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">إضافة توكنز إضافية رصيد بونص (Bonus Tokens):</label>
                <input
                  type="number"
                  value={bonusTokens}
                  onChange={(e) => setBonusTokens(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedClinicForQuota(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() =>
                  handleUpdateClinicQuota(selectedClinicForQuota.id, {
                    monthly_limit: newMonthlyLimit,
                    bonus_tokens: bonusTokens > 0 ? bonusTokens : undefined,
                  })
                }
                disabled={updatingQuota}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition disabled:opacity-50"
              >
                {updatingQuota ? 'جاري الحفظ...' : 'حفظ التعديل'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
