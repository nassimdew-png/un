import React, { useState, useEffect } from 'react';
import {
  HelpCircle,

  Sparkles,
  Brain,
  Key,
  SlidersHorizontal,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Server,
  Building2,
  Shield,
  Eye,
  EyeOff,
  Clock,
  ChevronRight,
  TrendingUp,
  Search

} from 'lucide-react';
import { superAdminAiApi, supportApi } from '../../api';

export default function AiManagementTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resettingAll, setResettingAll] = useState(false);

  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({
    gemini_api_key: '',
    gemini_model: 'gemini-3.6-flash',
    gemini_temperature: 0.7,
    free_ai_credits_per_tenant: 3,
    primary_provider: 'gemini',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [clinicSearch, setClinicSearch] = useState('');

  // Selected Clinic for Quota Adjustment
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [bonusTokens, setBonusTokens] = useState(50000);
  const [newMonthlyLimit, setNewMonthlyLimit] = useState(100000);
  const [savingClinic, setSavingClinic] = useState(false);

  // Knowledge Base Crawler & Support State
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [crawlUrlInput, setCrawlUrlInput] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [deletingArticleId, setDeletingArticleId] = useState(null);
  const [crawlerFeedback, setCrawlerFeedback] = useState(null);

  const fetchKnowledgeArticles = async () => {
    setArticlesLoading(true);
    try {
      const res = await supportApi.getArticles();
      if (res.success) {
        setArticles(res.articles || []);
      }
    } catch (err) {
      console.error('Failed to load knowledge articles:', err);
    } finally {
      setArticlesLoading(false);
    }
  };

  const handleCrawlUrl = async (e) => {
    e?.preventDefault();
    if (!crawlUrlInput.trim()) return;
    setIsCrawling(true);
    setCrawlerFeedback(null);
    try {
      const res = await supportApi.crawlUrl({ url: crawlUrlInput.trim() });
      if (res.success) {
        setCrawlerFeedback({ type: 'success', text: res.message || 'تمت فهرسة الصفحة بنجاح!' });
        setCrawlUrlInput('');
        fetchKnowledgeArticles();
      }
    } catch (err) {
      setCrawlerFeedback({ type: 'error', text: err.message || 'فشل مسح وفهرسة الرابط.' });
    } finally {
      setIsCrawling(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصفحة من قاعدة المعرفة؟')) return;
    setDeletingArticleId(id);
    try {
      await supportApi.deleteArticle(id);
      setArticles(prev => prev.filter(a => a.id !== id));
      setCrawlerFeedback({ type: 'success', text: 'تم حذف الصفحة من قاعدة المعرفة بنجاح.' });
    } catch (err) {
      setCrawlerFeedback({ type: 'error', text: err.message || 'فشل حذف الصفحة.' });
    } finally {
      setDeletingArticleId(null);
    }
  };

  // Status message
  const [feedback, setFeedback] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await superAdminAiApi.getSettings();
      if (res.success) {
        setStats(res.stats);
        setSettings({
          gemini_api_key: res.settings?.gemini_api_key || '',
          gemini_model: res.settings?.gemini_model || 'gemini-3.6-flash',
          gemini_temperature: res.settings?.gemini_temperature ?? 0.7,
          free_ai_credits_per_tenant: res.settings?.free_ai_credits_per_tenant ?? 3,
          primary_provider: res.settings?.primary_provider || 'gemini',
        });
        setClinics(res.clinics || []);
        setRecentLogs(res.recent_logs || []);
      }
    } catch (err) {
      console.error('Failed to load AI settings:', err);
      setFeedback({ type: 'error', text: 'فشل تحميل بيانات إعدادات الذكاء الاصطناعي.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await superAdminAiApi.updateSettings(settings);
      setFeedback({ type: 'success', text: res.message || 'تم حفظ وتطبيق الإعدادات بنجاح!' });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الإعدادات.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await superAdminAiApi.testConnection({
        provider: 'gemini',
        api_key: settings.gemini_api_key,
      });
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'فشل الاتصال بالـ API.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleToggleClinicAi = async (clinic) => {
    try {
      const newStatus = !clinic.has_ai_access;
      await superAdminAiApi.updateClinicAiAccess(clinic.id, {
        has_ai_access: newStatus,
      });
      setClinics((prev) =>
        prev.map((c) => (c.id === clinic.id ? { ...c, has_ai_access: newStatus } : c))
      );
      setFeedback({
        type: 'success',
        text: `تم ${newStatus ? 'تفعيل 🟢' : 'تعطيل 🔴'} الذكاء الاصطناعي لعيادة (${clinic.name}).`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تعديل حالة العيادة.' });
    }
  };

  const handleSaveClinicQuota = async () => {
    if (!selectedClinic) return;
    setSavingClinic(true);
    try {
      await superAdminAiApi.updateClinicAiAccess(selectedClinic.id, {
        monthly_limit: parseInt(newMonthlyLimit, 10),
        bonus_tokens: parseInt(bonusTokens, 10),
      });
      setFeedback({
        type: 'success',
        text: `تم تحديث حصة وتزويد رصيد (${selectedClinic.name}) بنجاح!`,
      });
      setSelectedClinic(null);
      loadData();
    } catch (err) {
      alert(err.message || 'فشل تحديث الحصة.');
    } finally {
      setSavingClinic(false);
    }
  };

  const handleResetMonthlyUsage = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في تصفير عداد الاستهلاك الشهري لكافة العيادات وتجديد الرصيد؟')) {
      return;
    }
    setResettingAll(true);
    try {
      const res = await superAdminAiApi.resetMonthlyUsage();
      setFeedback({ type: 'success', text: res.message || 'تم تصفير العدادات بنجاح.' });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تصفير الاستهلاك.' });
    } finally {
      setResettingAll(false);
    }
  };

  const filteredClinics = clinics.filter((c) => {
    const q = clinicSearch.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.subdomain || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 text-right font-sans max-w-7xl mx-auto" dir="rtl">
      {/* 1. Header & Quick Summary */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 space-x-reverse mb-1">
            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1.5 space-x-reverse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI HUB & API GOVERNANCE</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-white">إدارة وحوكمة الذكاء الاصطناعي (Super Admin AI Hub)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            التحكم المركزي في مفاتيح API، النماذج النشطة، مراقبة التوكنز، وحصص العيادات الفردية.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-2 space-x-reverse border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
          <button
            type="button"
            onClick={handleResetMonthlyUsage}
            disabled={resettingAll}
            className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center space-x-2 space-x-reverse"
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span>تصفير العداد الشهري العام</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-red-500/20 text-red-300 border-red-500/40'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white font-black">
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">إجمالي التوكنز المستهلكة (هذا الشهر)</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats ? stats.total_tokens_month?.toLocaleString() : '---'}
          </div>
          <span className="text-[11px] text-slate-400 block font-mono">
            عبر {stats?.total_calls || 0} عملية معالجة سريرية
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">التكلفة التقديرية السحابية</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ${stats ? stats.total_cost_usd?.toFixed(4) : '0.0000'}
          </div>
          <span className="text-[11px] text-slate-400 block font-mono">
            ≈ {stats ? stats.total_cost_dzd?.toLocaleString() : 0} دج (سعر السوق الموازي)
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">العيادات المفعلة للـ AI</span>
            <Building2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats?.active_ai_clinics_count || 0} / {clinics.length}
          </div>
          <span className="text-[11px] text-teal-400 block font-bold">
            🟢 وصول كامل إلى أدوات التوليد
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold">معدل الاستجابة والنجاح</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats?.success_rate || 100}%
          </div>
          <span className="text-[11px] text-indigo-300 block font-bold">
            ⚡ مزود أساسي: {settings.primary_provider.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 3. API Configuration & Live Probe Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-3">
          <Key className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-sm font-black text-white">إعدادات محرك Google Gemini API الفوري</h3>
            <p className="text-[11px] text-slate-400">تحديث مفاتيح الربط وتغيير النموذج النشط ودرجة الإبداعية دون إعادة نشر الكود.</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gemini API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>مفتاح Google Gemini API Key:</span>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center space-x-1 space-x-reverse"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showApiKey ? 'إخفاء' : 'إظهار'}</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.gemini_api_key}
                  onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                  placeholder="AQ.Ab8RN6ISIn67UGwLiNqz..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-purple-500"
                />
              </div>
            </div>

            {/* Gemini Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">النموذج النشط (Active Gemini Model):</label>
              <select
                value={settings.gemini_model}
                onChange={(e) => setSettings({ ...settings, gemini_model: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-purple-500"
              >
                <option value="gemini-3.6-flash">gemini-3.6-flash (الموصى به 🟢 - فائق السرعة وأقل تكلفة)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash (الجيل السابق)</option>
                <option value="gemini-flash-latest">gemini-flash-latest (أحدث إصدار Flash)</option>
                <option value="gemini-3.7-flash">gemini-3.7-flash (إصدار معاينة 3.7)</option>
                <option value="gemini-pro-latest">gemini-pro-latest (نموذج Pro للأبحاث الثقيلة)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Temperature Slider */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>درجة الإبداعية والصرامة السريرية (Temperature):</span>
                <span className="font-mono text-purple-400 font-black">{settings.gemini_temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={settings.gemini_temperature}
                onChange={(e) => setSettings({ ...settings, gemini_temperature: parseFloat(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.0 (دقيق وصارم طبياً)</span>
                <span>1.0 (إبداعي ومطول)</span>
              </div>
            </div>

            {/* Trial Credits */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <label className="text-xs font-bold text-slate-300 block">الرصيد التجريبي الافتراضي لكل عيادة جديدة:</label>
              <input
                type="number"
                min="0"
                value={settings.free_ai_credits_per_tenant}
                onChange={(e) => setSettings({ ...settings, free_ai_credits_per_tenant: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold font-mono focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-400 block">عدد الحصائل المجانية الممنوحة عند فتح العيادة.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-black transition flex items-center space-x-2 space-x-reverse"
            >
              <Zap className={`w-4 h-4 ${testing ? 'animate-bounce' : 'text-indigo-400'}`} />
              <span>{testing ? 'جاري فحص استجابة الـ API...' : '⚡ فحص الاتصال بالـ API (Ping Test)'}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition shadow-lg shadow-purple-500/25 flex items-center space-x-2 space-x-reverse"
            >
              <Sparkles className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات الفورية'}</span>
            </button>
          </div>
        </form>

        {/* Ping Test Result Box */}
        {testResult && (
          <div
            className={`p-4 rounded-2xl border text-xs animate-in fade-in flex items-start space-x-3 space-x-reverse ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {testResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />}
            <div className="flex-1 space-y-1">
              <span className="font-black block">{testResult.message}</span>
              {testResult.latency_ms && (
                <span className="text-[11px] font-mono block text-slate-300">
                  ⏱️ زمن الاستجابة: <strong>{testResult.latency_ms} ms</strong> • النموذج: <strong>{testResult.model}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Tenant Usage & Quota Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-black text-white">جدول استهلاك وحصص العيادات (Tenant AI Quotas)</h3>
            <p className="text-[11px] text-slate-400">تفعيل أو تعطيل الـ AI وضبط الحصص الشهرية لكل عيادة على حدة.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={clinicSearch}
              onChange={(e) => setClinicSearch(e.target.value)}
              placeholder="بحث بالعيادة أو النطاق..."
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold">
                <th className="py-3 px-3">العيادة</th>
                <th className="py-3 px-3">النطاق</th>
                <th className="py-3 px-3">صلاحية AI</th>
                <th className="py-3 px-3">الاستهلاك الشهري</th>
                <th className="py-3 px-3">الحصة والنسبة</th>
                <th className="py-3 px-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredClinics.map((c) => (
                <tr key={c.id} className="hover:bg-slate-850/50 transition">
                  <td className="py-3.5 px-3 font-sans font-black text-white">{c.name}</td>
                  <td className="py-3.5 px-3 text-slate-400">{c.subdomain}.psypro.tech</td>
                  <td className="py-3.5 px-3">
                    <button
                      type="button"
                      onClick={() => handleToggleClinicAi(c)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black font-sans transition ${
                        c.has_ai_access
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {c.has_ai_access ? '🟢 مفعّل' : '🔴 معطّل'}
                    </button>
                  </td>
                  <td className="py-3.5 px-3 text-white font-bold">
                    {c.used_this_month?.toLocaleString() || 0} توكن
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{c.usage_percentage}%</span>
                        <span>{c.monthly_limit?.toLocaleString()} حد شهري</span>
                      </div>
                      <div className="w-32 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            c.usage_percentage > 85 ? 'bg-red-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${c.usage_percentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClinic(c);
                        setNewMonthlyLimit(c.monthly_limit || 100000);
                        setBonusTokens(50000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-bold border border-slate-700 transition"
                    >
                      ⚙️ ضبط الحصة
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* 4. Knowledge Base Crawler & AI Customer Support (RAG) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                <span>قاعدة المعرفة والزاحف الذكي (Knowledge Base Crawler & Support RAG)</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  {articles.length} صفحات مفهرسة
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                مسح وفهرسة روابط التوثيق، الأسئلة الشائعة وشروط الخدمة لتغذية المساعد الذكي للدعم الفني (RAG Assistant).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchKnowledgeArticles}
            disabled={articlesLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse border border-slate-800 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${articlesLoading ? 'animate-spin' : ''}`} />
            <span>تحديث الفهرس</span>
          </button>
        </div>

        {/* Crawler Feedback */}
        {crawlerFeedback && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
              crawlerFeedback.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
          >
            <span>{crawlerFeedback.text}</span>
            <button onClick={() => setCrawlerFeedback(null)} className="text-slate-400 hover:text-white font-black">
              ✕
            </button>
          </div>
        )}

        {/* Crawler Input Bar */}
        <form onSubmit={handleCrawlUrl} className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <input
              type="url"
              value={crawlUrlInput}
              onChange={(e) => setCrawlUrlInput(e.target.value)}
              placeholder="أدخل رابط صفحة التوثيق أو الأسئلة الشائعة (مثال: https://psypro.tech/docs/faq)..."
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isCrawling || !crawlUrlInput.trim()}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 space-x-reverse transition disabled:opacity-50 shrink-0"
          >
            {isCrawling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جارٍ الزحف واستخراج المحتوى...</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                <span>🕷️ مسح وفهرسة المحتوى</span>
              </>
            )}
          </button>
        </form>

        {/* Indexed Articles Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">عنوان الوثيقة والصفحة</th>
                <th className="p-3.5">رابط المصدر (Source URL)</th>
                <th className="p-3.5 text-center">عدد التوكنز</th>
                <th className="p-3.5 text-center">آخر مزامنة</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {articlesLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                    جارٍ تحميل قائمة الصفحات المفهرسة...
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                    لا توجد صفحات ويب مفهرسة حالياً. يمكنك مسح روابط التوثيق أعلاه لتغذية المساعد الذكي.
                  </td>
                </tr>
              ) : (
                articles.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-950/60 transition">
                    <td className="p-3.5 font-bold text-white max-w-xs truncate">
                      {art.title || 'وثيقة معرفية بدون عنوان'}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px] max-w-sm truncate">
                      <a
                        href={art.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:underline flex items-center space-x-1 space-x-reverse"
                      >
                        <span className="truncate">{art.source_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-purple-300">
                      {art.tokens_count?.toLocaleString() || 0} tokens
                    </td>
                    <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                      {art.last_crawled_at ? new Date(art.last_crawled_at).toLocaleDateString('ar-DZ') : '---'}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteArticle(art.id)}
                        disabled={deletingArticleId === art.id}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 transition"
                        title="حذف من الفهرس"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quota Modal */}
      {selectedClinic && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-black text-white">ضبط حصة الـ AI: {selectedClinic.name}</h4>
              <button onClick={() => setSelectedClinic(null)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">الحد الشهري للتوكنز (Monthly Limit):</label>
                <input
                  type="number"
                  value={newMonthlyLimit}
                  onChange={(e) => setNewMonthlyLimit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">إضافة رصيد إضافي فوري (Bonus Tokens):</label>
                <input
                  type="number"
                  value={bonusTokens}
                  onChange={(e) => setBonusTokens(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedClinic(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveClinicQuota}
                disabled={savingClinic}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg"
              >
                {savingClinic ? 'جاري الحفظ...' : 'حفظ وتطبيق'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
