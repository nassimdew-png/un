import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Globe,
  BookOpen,
  Code2,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ExternalLink,
  Plus,
  Send,
  SlidersHorizontal,
  MessageSquare,
  Shield,
  Clock,
  Calendar,
  Layers,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { tenantKnowledgeBaseApi, publicSupportApi } from '../../api';

export default function AiReceptionistSettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicData, setClinicData] = useState(null);
  const [articles, setArticles] = useState([]);
  const [totalTokens, setTotalTokens] = useState(0);

  // Crawler State
  const [crawlUrl, setCrawlUrl] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);

  // Manual Text Ingestion State
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Settings State
  const [enabled, setEnabled] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [instructions, setInstructions] = useState('');

  // UI State
  const [activeTab, setActiveTab] = useState('knowledge'); // 'knowledge', 'persona', 'embed', 'test'
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Interactive Live Test Chat State
  const [testMessages, setTestMessages] = useState([]);
  const [testInput, setTestInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const loadClinicKnowledge = async () => {
    setLoading(true);
    try {
      const res = await tenantKnowledgeBaseApi.get();
      if (res.success) {
        setClinicData(res.clinic);
        setArticles(res.articles || []);
        setTotalTokens(res.total_tokens || 0);
        setEnabled(res.clinic.ai_receptionist_enabled);
        setGreeting(res.clinic.ai_receptionist_greeting);
        setInstructions(res.clinic.ai_receptionist_instructions);

        // Reset live test chat with greeting
        setTestMessages([
          {
            role: 'assistant',
            text: res.clinic.ai_receptionist_greeting,
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load clinic AI receptionist data:', err);
      setFeedback({ type: 'error', text: 'فشل تحميل بيانات موظف الاستقبال الذكي.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClinicKnowledge();
  }, []);

  const handleCrawl = async (e) => {
    e?.preventDefault();
    if (!crawlUrl.trim()) return;
    setIsCrawling(true);
    setFeedback(null);
    try {
      const res = await tenantKnowledgeBaseApi.crawl({ url: crawlUrl.trim() });
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'تمت فهرسة الصفحة بنجاح في قاعدة معرفة العيادة!' });
        setCrawlUrl('');
        loadClinicKnowledge();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل مسح وفهرسة الرابط.' });
    } finally {
      setIsCrawling(false);
    }
  };

  const handleSaveManualText = async (e) => {
    e?.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) return;
    setIsSavingManual(true);
    setFeedback(null);
    try {
      const res = await tenantKnowledgeBaseApi.saveText({
        title: manualTitle.trim(),
        content: manualContent.trim(),
      });
      if (res.success) {
        setFeedback({ type: 'success', text: 'تمت إضافة الوثيقة إلى قاعدة المعرفة بنجاح!' });
        setManualTitle('');
        setManualContent('');
        loadClinicKnowledge();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الوثيقة.' });
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await tenantKnowledgeBaseApi.updateSettings({
        ai_receptionist_enabled: enabled,
        ai_receptionist_greeting: greeting,
        ai_receptionist_instructions: instructions,
      });
      if (res.success) {
        setFeedback({ type: 'success', text: 'تم حفظ وتطبيق إعدادات موظف الاستقبال الذكي بنجاح!' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الإعدادات.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الوثيقة من قاعدة المعرفة؟')) return;
    try {
      await tenantKnowledgeBaseApi.deleteArticle(id);
      setArticles(prev => prev.filter(a => a.id !== id));
      setFeedback({ type: 'success', text: 'تم حذف الوثيقة بنجاح.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حذف الوثيقة.' });
    }
  };

  const handleCopyEmbedCode = () => {
    if (!clinicData?.embed_code) return;
    navigator.clipboard.writeText(clinicData.embed_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendTestMessage = async (e) => {
    e?.preventDefault();
    if (!testInput.trim() || isTesting) return;

    const userText = testInput.trim();
    setTestMessages(prev => [...prev, { role: 'user', text: userText }]);
    setTestInput('');
    setIsTesting(true);

    try {
      const res = await publicSupportApi.chat({
        question: userText,
        clinic_slug_or_id: clinicData?.subdomain || clinicData?.id,
      });

      if (res.answer) {
        setTestMessages(prev => [...prev, { role: 'assistant', text: res.answer }]);
      }
    } catch (err) {
      setTestMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'عذراً، حدث خطأ أثناء المعالجة.' }
      ]);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-right max-w-6xl mx-auto" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1.5 space-x-reverse">
                <Bot className="w-3.5 h-3.5" />
                <span>AI CLINIC RECEPTIONIST & RAG ENGINE 🤖</span>
              </span>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                enabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {enabled ? 'نشط ويعمل 🟢' : 'معطل مؤقتاً ⚪'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              موظف الاستقبال الذكي وقاعدة معرفة العيادة
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              قم بتدريب مساعد الرد الآلي الذكي لعيادتك عبر مسح موقعك أو إضافة أوقات العمل والخدمات، وضمّنه بسهولة على موقعك الخارجي أو صفحة الحجز.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 shrink-0 flex items-center space-x-4 space-x-reverse">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xl">
              📚
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">قاعدة معرفة العيادة:</span>
              <span className="text-sm font-black text-white font-mono">{articles.length} وثائق مفهرسة</span>
              <span className="text-[10px] text-indigo-300 block font-mono">≈ {totalTokens.toLocaleString()} توكنز معرفي</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white font-black">✕</button>
        </div>
      )}

      {/* 2. Sub-Tabs Navigation */}
      <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('knowledge')}
          className={`px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap flex items-center space-x-1.5 space-x-reverse ${
            activeTab === 'knowledge' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>قاعدة المعرفة والزاحف ({articles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('persona')}
          className={`px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap flex items-center space-x-1.5 space-x-reverse ${
            activeTab === 'persona' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>شخصية ورسالة الاستقبال</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('embed')}
          className={`px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap flex items-center space-x-1.5 space-x-reverse ${
            activeTab === 'embed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>كود التضمين للموقع الخارجي</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2.5 rounded-2xl transition-all whitespace-nowrap flex items-center space-x-1.5 space-x-reverse ${
            activeTab === 'test' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 font-black' : 'text-purple-400 hover:text-white hover:bg-purple-950/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>معاينة حية للموظف الذكي</span>
        </button>
      </div>

      {/* 3. TAB 1: Knowledge Base & Crawler */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Crawl URL Tool */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Globe className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-black text-white">زاحف المواقع وصفحات الأسئلة الشائعة (Web Crawler)</h3>
                <p className="text-xs text-slate-400">أدخل رابط موقع العيادة أو صفحة الفيسبوك لاستخراج وفهرسة النصوص تلقائياً.</p>
              </div>
            </div>

            <form onSubmit={handleCrawl} className="flex flex-col sm:flex-row items-stretch gap-3">
              <input
                type="url"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                placeholder="https://myclinic.dz/about-us أو رابط صفحة الشروط..."
                required
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={isCrawling || !crawlUrl.trim()}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition flex items-center justify-center space-x-2 space-x-reverse shadow-md disabled:opacity-50 shrink-0"
              >
                {isCrawling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ المسح والفهرسة...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>مسح وفهرسة الرابط</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Manual Text Ingestion Tool */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 space-x-reverse">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-black text-white">إضافة نصوص وقوانين العيادة يدوياً (Manual Ingestion)</h3>
                <p className="text-xs text-slate-400">اكتب أوقات العمل، الخدمات المتوفرة، الأسعار، أو إرشادات المواعيد مباشرة.</p>
              </div>
            </div>

            <form onSubmit={handleSaveManualText} className="space-y-3">
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="عنوان الوثيقة (مثال: أوقات العمل والتخصصات المتاحة)..."
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 transition"
              />
              <textarea
                rows={4}
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="تفاصيل الوثيقة: مثلاً مواعيد العمل من الأحد إلى الخميس من 8:30 صباحاً إلى 16:30 مساءً. خدمات التقييم الأرطوفوني واختبارات الذكاء WISC-V..."
                required
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500 transition resize-none leading-relaxed"
              />
              <button
                type="submit"
                disabled={isSavingManual || !manualTitle.trim() || !manualContent.trim()}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition flex items-center space-x-2 space-x-reverse shadow-md disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة إلى قاعدة المعرفة</span>
              </button>
            </form>
          </div>

          {/* Indexed Articles Table */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-white">الوثائق والمعلومات المفهرسة للعيادة ({articles.length})</h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">عنوان الوثيقة</th>
                    <th className="p-3.5">المصدر</th>
                    <th className="p-3.5 text-center">التوكنز</th>
                    <th className="p-3.5 text-center">تاريخ الإضافة</th>
                    <th className="p-3.5 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {articles.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">
                        لا توجد وثائق مفهرسة بعد. أضف موقع العيادة أو نصوص السياسات أعلاه.
                      </td>
                    </tr>
                  ) : (
                    articles.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-950/60 transition">
                        <td className="p-3.5 font-bold text-white max-w-xs truncate">{art.title}</td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px] max-w-xs truncate">{art.source_url}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-indigo-300">{art.tokens_count?.toLocaleString()} tokens</td>
                        <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {art.last_crawled_at ? new Date(art.last_crawled_at).toLocaleDateString('ar-DZ') : '---'}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(art.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 transition"
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

        </div>
      )}

      {/* 4. TAB 2: Persona & Greeting Settings */}
      {activeTab === 'persona' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl animate-in fade-in">
          <form onSubmit={handleSaveSettings} className="space-y-5">
            
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">حالة تفعيل موظف الاستقبال الذكي:</span>
                <span className="text-[11px] text-slate-400">إظهار شات الرد الآلي للزوار على صفحة الحجز والموقع الخارجي</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {/* Greeting Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">رسالة الترحيب الأولى للزائر:</label>
              <textarea
                rows={3}
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="مرحباً بك في عيادتنا! كيف يمكننا مساعدتك اليوم؟..."
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition resize-none leading-relaxed"
              />
            </div>

            {/* Custom Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">تعليمات خاصة للموظف الذكي (Prompt Tuning):</label>
              <textarea
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="مثلاً: ركز على تشجيع الزوار على حجز موعد تقييم أولي، وضح أن الاستشارات تتم بالحجز المسبق فقط، واذكر رقم هاتف الطوارئ..."
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 transition resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition shadow-lg shadow-indigo-600/25 disabled:opacity-50"
            >
              {saving ? 'جارٍ الحفظ...' : '💾 حفظ وتطبيق الإعدادات'}
            </button>
          </form>
        </div>
      )}

      {/* 5. TAB 3: Embed Code Generator */}
      {activeTab === 'embed' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl animate-in fade-in">
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <span>كود التضمين للموقع الإلكتروني الخارجي (Embed Code)</span>
            </h3>
            <p className="text-xs text-slate-400">
              انسخ هذا السطر البرمجي وضعه قبل وسم <code className="bg-slate-950 px-2 py-0.5 rounded text-indigo-300">&lt;/body&gt;</code> في موقعك الإلكتروني (WordPress, Wix, Webflow، أو أي موقع مخصص).
            </p>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
              {clinicData?.embed_code || 'جارٍ توليد الكود...'}
            </pre>
            <button
              type="button"
              onClick={handleCopyEmbedCode}
              className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1 space-x-reverse shadow-md"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 space-y-2">
            <span className="font-black text-indigo-300 block">✨ مميزات ودجت الاستقبال الخارجي:</span>
            <ul className="space-y-1 list-disc pr-4 text-slate-400">
              <li>يعمل بشكل خفيف وفوري دون التأثير على سرعة موقعك (Zero Dependency Vanilla JS).</li>
              <li>يرد آلياً على أسئلة الزوار استناداً إلى قاعدة معرفة عيادتك حصراً.</li>
              <li>يوفر أزرار توجيه فورية لحجز موعد في عيادتك بنقرة واحدة.</li>
            </ul>
          </div>
        </div>
      )}

      {/* 6. TAB 4: Live Simulation Preview */}
      {activeTab === 'test' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl animate-in fade-in">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white">المعاينة والتجربة الحية لموظف الاستقبال</h3>
            <p className="text-xs text-slate-400">اطرح أسئلة كتجربة لاختبار جودة الردود ودقة المعلومات من قاعدة المعرفة.</p>
          </div>

          {/* Chat Mock Window */}
          <div className="border border-slate-800 rounded-3xl bg-slate-950 overflow-hidden flex flex-col h-[440px]">
            <div className="p-3 bg-gradient-to-r from-indigo-950 to-slate-900 border-b border-slate-800 flex items-center space-x-2 space-x-reverse">
              <span className="text-base">🤖</span>
              <span className="text-xs font-black text-white">موظف الاستقبال الذكي لـ {clinicData?.name}</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {testMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTesting && (
                <div className="flex justify-end">
                  <div className="p-2.5 rounded-2xl bg-slate-900 text-slate-400 flex items-center space-x-1 space-x-reverse">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendTestMessage} className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center space-x-2 space-x-reverse">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="اسأل موظف الاستقبال (مثال: ما هي أوقات العمل؟ كيف أحجز موعداً؟)..."
                className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!testInput.trim() || isTesting}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
