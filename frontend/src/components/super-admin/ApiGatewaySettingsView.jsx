import React, { useState, useEffect } from 'react';
import {
  Key,
  Cpu,
  ShieldCheck,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  Server,
  Activity,
  SlidersHorizontal,
  Check,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Radio,
  Video,
  FileText,
  PieChart,
  Mic,
  Palette
} from 'lucide-react';
import { apiGatewayAdminApi } from '../../api';

export default function ApiGatewaySettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Gemini Settings Form
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiSecondaryKey, setGeminiSecondaryKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showSecondaryKey, setShowSecondaryKey] = useState(false);
  const [textModel, setTextModel] = useState('gemini-3.6-flash');
  const [visionModel, setVisionModel] = useState('gemini-3.6-flash');
  const [audioModel, setAudioModel] = useState('gemini-3.6-flash');
  const [rateLimit, setRateLimit] = useState(60);
  const [healthStatus, setHealthStatus] = useState('untested');
  const [lastTestedAt, setLastTestedAt] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);

  // Testing Key State
  const [isTesting, setIsTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState(null);

  // Global Feature Toggles
  const [featureFlags, setFeatureFlags] = useState({
    ai_clinical_hub: true,
    ai_radio_studio: true,
    ai_image_studio: true,
    ai_video_studio: true,
    ai_speech_studio: true,
    ai_fluency_analyzer: true,
    ai_data_analyst: true,
    ai_document_processor: true,
  });

  const featureMetadata = [
    { key: 'ai_clinical_hub', label: 'المساعد السريري وصياغة الحصائل ومشاريع PEP', icon: FileText, color: 'text-blue-400' },
    { key: 'ai_speech_studio', label: 'المساعد الصوتي والإملاء وتفريغ SOAP المباشر', icon: Mic, color: 'text-amber-400' },
    { key: 'ai_fluency_analyzer', label: 'فحص التأتأة وطلاقة النطق للأرطوفونيا (%SS)', icon: Activity, color: 'text-teal-400' },
    { key: 'ai_image_studio', label: 'استوديو البطاقات البصرية ووسائل PECS والتلوين', icon: Palette, color: 'text-pink-400' },
    { key: 'ai_video_studio', label: 'استوديو النمذجة البصرية والقصص المتحركة (MP4)', icon: Video, color: 'text-cyan-400' },
    { key: 'ai_radio_studio', label: 'استوديو البودكاست والإذاعة التثقيفية متعددة الأصوات', icon: Radio, color: 'text-rose-400' },
    { key: 'ai_data_analyst', label: 'محلل البيانات التفاعلي والتقارير الذكية (BI)', icon: PieChart, color: 'text-purple-400' },
    { key: 'ai_document_processor', label: 'معالج الفواتير ومطابقة المصاريف وعروض الشرائح', icon: Sparkles, color: 'text-emerald-400' },
  ];

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const res = await apiGatewayAdminApi.getConfigs();
      if (res.success && res.configs) {
        setConfigs(res.configs);
        const g = res.configs.find((c) => c.provider === 'gemini');
        if (g) {
          setGeminiKey(g.masked_key || '');
          setGeminiSecondaryKey(g.masked_secondary_key || '');
          setTextModel(g.default_text_model || 'gemini-3.6-flash');
          setVisionModel(g.default_vision_model || 'gemini-3.6-flash');
          setAudioModel(g.default_audio_model || 'gemini-3.6-flash');
          setRateLimit(g.rate_limit_per_minute || 60);
          setHealthStatus(g.health_status || 'untested');
          setLastTestedAt(g.last_tested_at);
          if (g.feature_flags && Object.keys(g.feature_flags).length > 0) {
            setFeatureFlags((prev) => ({ ...prev, ...g.feature_flags }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load API configs:', err);
      setFeedback({ type: 'error', text: 'فشل تحميل إعدادات مزودي الذكاء الاصطناعي.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestFeedback(null);
    try {
      const res = await apiGatewayAdminApi.testConnection({
        provider: 'gemini',
        api_key: geminiKey.includes('****') ? undefined : geminiKey,
      });

      setLatencyMs(res.latency_ms);
      setHealthStatus(res.health_status || 'healthy');
      setTestFeedback({
        type: 'success',
        text: `${res.message} (زمن الاستجابة: ${res.latency_ms}ms)`,
      });
    } catch (err) {
      setHealthStatus('invalid_key');
      setTestFeedback({
        type: 'error',
        text: err.message || 'فشل الاتصال بمزود الذكاء الاصطناعي.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleFeature = async (featureKey) => {
    const nextVal = !featureFlags[featureKey];
    setFeatureFlags((prev) => ({ ...prev, [featureKey]: nextVal }));

    try {
      await apiGatewayAdminApi.toggleFeature({
        feature: featureKey,
        is_enabled: nextVal,
      });
    } catch (err) {
      console.error('Failed to toggle feature:', err);
    }
  };

  const handleSaveConfigs = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await apiGatewayAdminApi.updateConfigs({
        provider: 'gemini',
        api_key: geminiKey,
        secondary_api_key: geminiSecondaryKey,
        default_text_model: textModel,
        default_vision_model: visionModel,
        default_audio_model: audioModel,
        rate_limit_per_minute: rateLimit,
        is_active: true,
        feature_flags: featureFlags,
      });

      if (res.success) {
        setFeedback({ type: 'success', text: 'تم حفظ وتشفير إعدادات مفاتيح الـ API بنجاح!' });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'تعذر حفظ الإعدادات.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* 1. Header Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/25">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">مركز إدارة مفاتيح الـ API ومزودي الذكاء الاصطناعي</h2>
            <p className="text-xs text-slate-400">تشفير وتخزين المفاتيح، اختبار الاتصال اللحظي، والتحكم بميزات النظام</p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center space-x-2 space-x-reverse self-start md:self-auto">
          <div className={`px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center space-x-2 space-x-reverse shadow-inner ${
            healthStatus === 'healthy'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : healthStatus === 'quota_exceeded'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              healthStatus === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }`} />
            <span>
              {healthStatus === 'healthy' ? `مزود Gemini متصل ${latencyMs ? `(${latencyMs}ms)` : ''}` : 'الحالة: يتطلب الفحص'}
            </span>
          </div>

          <button
            type="button"
            onClick={loadConfigs}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 space-x-reverse ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="font-bold">{feedback.text}</span>
        </div>
      )}

      {/* 2. Main Grid: API Configs & Feature Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Google Gemini & Vertex AI Config Card */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5 space-x-reverse">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-black text-white">إعدادات Google Gemini & Multimodal AI</h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              AES-256 Encrypted 🔒
            </span>
          </div>

          {/* Primary API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">مفتاح API الأساسي (Primary Gemini Key):</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Secondary / Fallback API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">مفتاح API الاحتياطي للتبديل التلقائي (Fallback Key):</label>
            <div className="relative">
              <input
                type={showSecondaryKey ? 'text' : 'password'}
                value={geminiSecondaryKey}
                onChange={(e) => setGeminiSecondaryKey(e.target.value)}
                placeholder="مفتاح إضافي للتبديل عند نفاد الرصيد أو الكوتا..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowSecondaryKey(!showSecondaryKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showSecondaryKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Model Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">نموذج النصوص (Text):</label>
              <select
                value={textModel}
                onChange={(e) => setTextModel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-indigo-500"
              >
                <option value="gemini-3.6-flash">gemini-3.6-flash (موصى به)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite</option>
                <option value="gemini-3.1-pro">gemini-3.1-pro</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">نموذج الرؤية (Vision):</label>
              <select
                value={visionModel}
                onChange={(e) => setVisionModel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-indigo-500"
              >
                <option value="gemini-3.6-flash">gemini-3.6-flash (Vision)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash (Vision)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">محرك الصوتيات (Audio):</label>
              <select
                value={audioModel}
                onChange={(e) => setAudioModel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:border-indigo-500"
              >
                <option value="gemini-3.6-flash">gemini-3.6-flash (Audio)</option>
                <option value="edge_tts_neural">Edge TTS Neural (Algerian/AR)</option>
              </select>
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500 text-indigo-200 text-xs font-bold transition flex items-center space-x-2 space-x-reverse disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جارٍ فحص استجابة المفتاح والكوتا...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>⚡ فحص اتصال وصلاحية المفتاح (Ping Test)</span>
                </>
              )}
            </button>

            {testFeedback && (
              <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 space-x-reverse ${
                testFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {testFeedback.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testFeedback.text}</span>
              </div>
            )}
          </div>

        </div>

        {/* Right 5 Cols: Global Feature Toggles Card */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5 space-x-reverse">
              <SlidersHorizontal className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-white">التحكم في تفعيل الميزات (Feature Toggles)</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Platform-wide</span>
          </div>

          <div className="space-y-3">
            {featureMetadata.map((f) => {
              const isEnabled = featureFlags[f.key] ?? true;
              const Icon = f.icon;
              return (
                <div
                  key={f.key}
                  onClick={() => handleToggleFeature(f.key)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isEnabled
                      ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/30 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 space-x-reverse">
                    <div className={`w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center ${f.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-bold ${isEnabled ? 'text-slate-200' : 'text-slate-500'}`}>
                      {f.label}
                    </span>
                  </div>

                  <div>
                    {isEnabled ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. Bottom Action Toolbar */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
        <div className="text-xs text-slate-400 flex items-center space-x-2 space-x-reverse">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>تخزن المفاتيح مشفرة بمعيار التشفير العسكري ولا يتم إرسالها للعميل في أي طلب.</span>
        </div>

        <button
          type="button"
          onClick={handleSaveConfigs}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-emerald-600/25 disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>جارٍ حفظ الإعدادات...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>💾 حفظ الإعدادات وتطبيق التغييرات فوراً</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
