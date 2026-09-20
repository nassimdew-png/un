import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Save,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Layers,
  Phone,
  MessageCircle,
  Mail,
  Send,
  ExternalLink,
  Shield,
  Activity,
  X,
  Copy,
  Check,
  Tag,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  RefreshCw,
  Zap
} from 'lucide-react';
import { helpCenterStudioApi } from '../../api';

export default function HelpCenterStudioTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [activeSubTab, setActiveSubTab] = useState('articles'); // 'articles' | 'categories' | 'faqs' | 'contacts' | 'preview'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Complete CMS Configuration State
  const [config, setConfig] = useState({
    header: {
      title: '',
      subtitle: '',
      badge: '',
      searchPlaceholder: '',
    },
    supportContact: {
      whatsapp: '',
      whatsappDisplay: '',
      phone: '',
      email: '',
      telegram: '',
      workHours: '',
      helpDeskNotice: '',
    },
    categories: [],
    articles: [],
    faqs: [],
    quickActionCards: [],
  });

  const [defaultConfig, setDefaultConfig] = useState(null);
  const [isCustom, setIsCustom] = useState(false);

  // Article Modal State
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticleIndex, setEditingArticleIndex] = useState(null);
  const [articleForm, setArticleForm] = useState({
    id: '',
    categoryId: '',
    title: '',
    summary: '',
    badge: 'سريري',
    steps: [''],
    tip: '',
  });

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    label: '',
    icon: '📚',
    description: '',
  });

  // FAQ Modal State
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaqIndex, setEditingFaqIndex] = useState(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'general',
  });

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await helpCenterStudioApi.getConfig();
      if (res.success && res.config) {
        setConfig(res.config);
        setDefaultConfig(res.default_config);
        setIsCustom(res.is_custom);
      }
    } catch (err) {
      console.error('Failed to load help center config:', err);
      setFeedback({ type: 'error', text: 'تعذر تحميل بيانات دليل الاستخدام من الخادم.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Save Config to Server
  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      const res = await helpCenterStudioApi.updateConfig(config);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'تم حفظ ونشر دليل الاستخدام بنجاح! 📚✨' });
        setIsCustom(true);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ التعديلات.' });
    } finally {
      setSaving(false);
    }
  };

  // Reset to Clinical Defaults
  const handleResetToDefault = async () => {
    if (!window.confirm('هل أنت متأكد من استعادة المحتوى السريري الافتراضي لمركز المساعدة والدليل؟ سيتم استبدال التعديلات الحالية.')) {
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const res = await helpCenterStudioApi.resetConfig();
      if (res.success && res.config) {
        setConfig(res.config);
        setIsCustom(false);
        setFeedback({ type: 'success', text: res.message || 'تمت استعادة الدليل السريري الافتراضي بنجاح! 🔄' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'تعذر استعادة المحتوى الافتراضي.' });
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // ARTICLE CRUD HANDLERS
  // ==========================================
  const handleOpenAddArticle = () => {
    setEditingArticleIndex(null);
    setArticleForm({
      id: `art_${Date.now()}`,
      categoryId: config.categories[0]?.id || 'quickstart',
      title: '',
      summary: '',
      badge: 'سريري',
      steps: [''],
      tip: '',
    });
    setIsArticleModalOpen(true);
  };

  const handleOpenEditArticle = (index) => {
    setEditingArticleIndex(index);
    const item = config.articles[index];
    setArticleForm({
      id: item.id || `art_${Date.now()}`,
      categoryId: item.categoryId || config.categories[0]?.id || 'quickstart',
      title: item.title || '',
      summary: item.summary || '',
      badge: item.badge || 'سريري',
      steps: Array.isArray(item.steps) && item.steps.length > 0 ? [...item.steps] : [''],
      tip: item.tip || '',
    });
    setIsArticleModalOpen(true);
  };

  const handleSaveArticle = (e) => {
    e.preventDefault();
    const updatedArticles = [...(config.articles || [])];
    const cleanedSteps = articleForm.steps.filter((s) => s && s.trim().length > 0);

    const newArticle = {
      ...articleForm,
      steps: cleanedSteps.length > 0 ? cleanedSteps : ['انقر هنا للبدء...'],
    };

    if (editingArticleIndex !== null) {
      updatedArticles[editingArticleIndex] = newArticle;
    } else {
      updatedArticles.unshift(newArticle);
    }

    setConfig({ ...config, articles: updatedArticles });
    setIsArticleModalOpen(false);
    setFeedback({ type: 'success', text: 'تم تحديث المقال محلياً. لا تنس الضغط على زر "حفظ ونشر التعديلات" لتثبيتها.' });
  };

  const handleDeleteArticle = (index) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المقال من الدليل؟')) return;
    const updated = config.articles.filter((_, i) => i !== index);
    setConfig({ ...config, articles: updated });
  };

  // ==========================================
  // CATEGORY CRUD HANDLERS
  // ==========================================
  const handleOpenAddCategory = () => {
    setEditingCategoryIndex(null);
    setCategoryForm({
      id: `cat_${Date.now()}`,
      label: '',
      icon: '📁',
      description: '',
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (index) => {
    setEditingCategoryIndex(index);
    const cat = config.categories[index];
    setCategoryForm({ ...cat });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    const updatedCats = [...(config.categories || [])];
    if (editingCategoryIndex !== null) {
      updatedCats[editingCategoryIndex] = { ...categoryForm };
    } else {
      updatedCats.push({ ...categoryForm });
    }
    setConfig({ ...config, categories: updatedCats });
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (index) => {
    const cat = config.categories[index];
    if (!window.confirm(`هل أنت متأكد من حذف تصنيف (${cat.label})؟`)) return;
    const updatedCats = config.categories.filter((_, i) => i !== index);
    setConfig({ ...config, categories: updatedCats });
  };

  // ==========================================
  // FAQ CRUD HANDLERS
  // ==========================================
  const handleOpenAddFaq = () => {
    setEditingFaqIndex(null);
    setFaqForm({
      question: '',
      answer: '',
      category: 'general',
    });
    setIsFaqModalOpen(true);
  };

  const handleOpenEditFaq = (index) => {
    setEditingFaqIndex(index);
    setFaqForm({ ...config.faqs[index] });
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = (e) => {
    e.preventDefault();
    const updatedFaqs = [...(config.faqs || [])];
    if (editingFaqIndex !== null) {
      updatedFaqs[editingFaqIndex] = { ...faqForm };
    } else {
      updatedFaqs.push({ ...faqForm });
    }
    setConfig({ ...config, faqs: updatedFaqs });
    setIsFaqModalOpen(false);
  };

  const handleDeleteFaq = (index) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    const updatedFaqs = config.faqs.filter((_, i) => i !== index);
    setConfig({ ...config, faqs: updatedFaqs });
  };

  // Reordering handlers
  const [expandedCardSteps, setExpandedCardSteps] = useState(new Set());

  const toggleCardSteps = (articleId) => {
    setExpandedCardSteps((prev) => {
      const next = new Set(prev);
      if (next.has(articleId)) next.delete(articleId);
      else next.add(articleId);
      return next;
    });
  };

  const handleMoveArticle = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= (config.articles || []).length) return;
    const items = [...(config.articles || [])];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    setConfig({ ...config, articles: items });
  };

  const handleMoveCategory = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= (config.categories || []).length) return;
    const items = [...(config.categories || [])];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    setConfig({ ...config, categories: items });
  };

  // Filtered Articles
  const filteredArticles = (config.articles || []).filter((art) => {
    const matchesCat = selectedCategoryFilter === 'all' || art.categoryId === selectedCategoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      art.title?.toLowerCase().includes(q) ||
      art.summary?.toLowerCase().includes(q) ||
      art.badge?.toLowerCase().includes(q) ||
      (Array.isArray(art.steps) && art.steps.some((s) => s.toLowerCase().includes(q)));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* ========================================================================= */}
      {/* HERO HEADER & STATS                                                       */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-1">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>CLINICAL HELP CENTER & DOCUMENTATION CMS STUDIO</span>
              </span>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                isCustom
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              }`}>
                {isCustom ? 'مخصص من لوحة السوبر أدمن 🎨' : 'الدليل المعياري الافتراضي 2026 🏛️'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة وتخصيص دليل الاستخدام ومركز المساعدة</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              تحكم كامل في محتوى الشروحات، خطوات الجلسات السريرية، بنك المقاييس، الأسئلة الشائعة، وقنوات الدعم الفني المباشر لكافة عيادات المنصة.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
            <a
              href="/help"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-teal-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-md"
            >
              <ExternalLink className="w-4 h-4 text-teal-400" />
              <span>معاينة الدليل الحي 👁️</span>
            </a>

            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={saving}
              className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>استعادة الافتراضي</span>
            </button>

            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center gap-2 shadow-xl shadow-emerald-600/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري النشر...' : 'حفظ ونشر التعديلات 🚀'}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold">المقالات والشروحات السريرية</div>
                <div className="text-xs text-slate-500">مقسمة حسب التخصص والقمرات</div>
              </div>
            </div>
            <span className="text-lg font-black text-indigo-300 font-mono">{config.articles?.length || 0}</span>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold">التصنيفات والأقسام</div>
                <div className="text-xs text-slate-500">الجلسات، المقاييس، الفوترة، RBAC</div>
              </div>
            </div>
            <span className="text-lg font-black text-teal-300 font-mono">{config.categories?.length || 0}</span>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold">الأسئلة الشائعة والأمان</div>
                <div className="text-xs text-slate-500">إجابات فورية لأطباء العيادات</div>
              </div>
            </div>
            <span className="text-lg font-black text-amber-300 font-mono">{config.faqs?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            {feedback.text}
          </span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STUDIO NAVIGATION SUB-TABS                                                */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('articles')}
          className={`px-4 py-2 rounded-2xl font-bold transition flex items-center gap-2 shrink-0 ${
            activeSubTab === 'articles'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>مقالات وشروحات الدليل ({config.articles?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 rounded-2xl font-bold transition flex items-center gap-2 shrink-0 ${
            activeSubTab === 'categories'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>التصنيفات والأقسام ({config.categories?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('faqs')}
          className={`px-4 py-2 rounded-2xl font-bold transition flex items-center gap-2 shrink-0 ${
            activeSubTab === 'faqs'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>الأسئلة الشائعة FAQ ({config.faqs?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('contacts')}
          className={`px-4 py-2 rounded-2xl font-bold transition flex items-center gap-2 shrink-0 ${
            activeSubTab === 'contacts'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>قنوات الدعم والترويسة</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: ARTICLES MANAGEMENT                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'articles' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xl">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في عناوين المقالات أو الخطوات..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">كافة الأقسام والتصنيفات</option>
                {config.categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleOpenAddArticle}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مقال جديد</span>
              </button>
            </div>
          </div>

          {/* Articles List */}
          {loading ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <span className="text-xs font-bold">جاري تحميل بيانات الدليل...</span>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">لا توجد مقالات تطابق البحث</h3>
              <p className="text-xs text-slate-400">يمكنك إضافة مقال جديد أو تغيير خيارات التصفية.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((article, idx) => {
                const categoryObj = config.categories?.find((c) => c.id === article.categoryId);
                const originalIndex = config.articles?.findIndex((a) => a.id === article.id || a.title === article.title);
                const articleIndex = originalIndex !== -1 ? originalIndex : idx;
                const isStepsExpanded = expandedCardSteps.has(article.id || `art_${idx}`);

                return (
                  <div
                    key={article.id || idx}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl hover:border-indigo-500/40 transition flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                          <span>{categoryObj?.icon || '📚'}</span>
                          <span>{categoryObj?.label || article.categoryId}</span>
                        </span>

                        {article.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {article.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-black text-white">{article.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{article.summary}</p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => toggleCardSteps(article.id || `art_${idx}`)}
                          className="font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/20 flex items-center gap-1 transition"
                        >
                          <span>{article.steps?.length || 0} خطوات</span>
                          {isStepsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {article.tip && (
                          <span className="truncate max-w-[200px] text-amber-400/80">💡 {article.tip}</span>
                        )}
                      </div>

                      {/* Quick Expanded Steps Preview */}
                      {isStepsExpanded && (
                        <div className="mt-2 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1.5 text-xs text-slate-300 animate-fade-in">
                          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1">الخطوات التنفيذية المباشرة:</div>
                          {article.steps?.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveArticle(articleIndex, articleIndex - 1)}
                          disabled={articleIndex === 0}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-800 transition"
                          title="رفع الترتيب للأعلى"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveArticle(articleIndex, articleIndex + 1)}
                          disabled={articleIndex === (config.articles?.length || 0) - 1}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-800 transition"
                          title="خفض الترتيب للأسفل"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditArticle(articleIndex)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1"
                          title="تعديل المقال"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(articleIndex)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition flex items-center gap-1 border border-rose-500/20"
                          title="حذف المقال"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: CATEGORIES MANAGEMENT                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-4">
            <div>
              <h3 className="text-sm font-black text-white">تصنيفات وأقسام الدليل السريري</h3>
              <p className="text-xs text-slate-400">إدارة الأقسام الرئيسية، الأيقونات، والعناوين التوضيحية.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddCategory}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تصنيف جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {config.categories?.map((cat, idx) => {
              const count = config.articles?.filter((a) => a.categoryId === cat.id).length || 0;

              return (
                <div key={cat.id || idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{cat.icon || '📁'}</span>
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                      {count} مقالات
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white">{cat.label}</h4>
                    <p className="text-xs text-slate-400 mt-1">{cat.description || 'بدون وصف'}</p>
                    <span className="font-mono text-[10px] text-slate-500 block mt-1">ID: {cat.id}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveCategory(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition"
                        title="رفع التصنيف"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveCategory(idx, idx + 1)}
                        disabled={idx === (config.categories?.length || 0) - 1}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition"
                        title="خفض التصنيف"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCategory(idx)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(idx)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: FAQS MANAGEMENT                                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'faqs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-4">
            <div>
              <h3 className="text-sm font-black text-white">الأسئلة الشائعة والأمان (FAQ)</h3>
              <p className="text-xs text-slate-400">إجابات استباقية عن التشفير، الصلاحيات، وضع عدم الاتصال، والاشتراكات.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddFaq}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة سؤال شائع</span>
            </button>
          </div>

          <div className="space-y-3">
            {config.faqs?.map((faq, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {faq.category || 'عام'}
                    </span>
                    <h4 className="text-sm font-black text-white mt-1">❓ {faq.question}</h4>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditFaq(idx)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(idx)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: CONTACTS & HEADER SETTINGS                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'contacts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div>
            <h3 className="text-base font-black text-white">إعدادات الترويسة وقنوات الدعم الفني</h3>
            <p className="text-xs text-slate-400">تخصيص أرقام واتساب الدعم، التلغرام، ساعات العمل، والعناوين البارزة.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold">عنوان الصفحة البارز (H1)</label>
              <input
                type="text"
                value={config.header?.title || ''}
                onChange={(e) => setConfig({ ...config, header: { ...config.header, title: e.target.value } })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold">الشارة العلوية (Badge)</label>
              <input
                type="text"
                value={config.header?.badge || ''}
                onChange={(e) => setConfig({ ...config, header: { ...config.header, badge: e.target.value } })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-300 font-bold">الوصف التعريفي المساعد</label>
              <textarea
                rows={2}
                value={config.header?.subtitle || ''}
                onChange={(e) => setConfig({ ...config, header: { ...config.header, subtitle: e.target.value } })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>رقم WhatsApp للدعم المباشر (الدولي)</span>
              </label>
              <input
                type="text"
                value={config.supportContact?.whatsapp || ''}
                onChange={(e) => setConfig({ ...config, supportContact: { ...config.supportContact, whatsapp: e.target.value } })}
                placeholder="+213550000000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-left focus:outline-none focus:border-indigo-500"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold">رقم الهاتف المعروض في الواجهة</label>
              <input
                type="text"
                value={config.supportContact?.whatsappDisplay || ''}
                onChange={(e) => setConfig({ ...config, supportContact: { ...config.supportContact, whatsappDisplay: e.target.value } })}
                placeholder="0550 00 00 00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-left focus:outline-none focus:border-indigo-500"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span>رابط قناة أو حساب Telegram</span>
              </label>
              <input
                type="text"
                value={config.supportContact?.telegram || ''}
                onChange={(e) => setConfig({ ...config, supportContact: { ...config.supportContact, telegram: e.target.value } })}
                placeholder="https://t.me/psypro_support"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-left focus:outline-none focus:border-indigo-500"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>البريد الإلكتروني للدعم الفني</span>
              </label>
              <input
                type="email"
                value={config.supportContact?.email || ''}
                onChange={(e) => setConfig({ ...config, supportContact: { ...config.supportContact, email: e.target.value } })}
                placeholder="support@psypro.tech"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-left focus:outline-none focus:border-indigo-500"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-300 font-bold">أوقات العمل واستقبال الاستفسارات</label>
              <input
                type="text"
                value={config.supportContact?.workHours || ''}
                onChange={(e) => setConfig({ ...config, supportContact: { ...config.supportContact, workHours: e.target.value } })}
                placeholder="السبت - الخميس: 08:00 إلى 18:00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT ARTICLE                                                 */}
      {/* ========================================================================= */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl p-6 sm:p-8 space-y-5 font-sans text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">
                    {editingArticleIndex !== null ? 'تعديل مقال في الدليل السريري' : 'إضافة مقال وشرح سريري جديد'}
                  </h2>
                  <p className="text-xs text-slate-400">صياغة خطوات التنفيذ، الملاحظات الإرشادية، وتحديد القسم</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsArticleModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">القسم والتصنيف</label>
                  <select
                    value={articleForm.categoryId}
                    onChange={(e) => setArticleForm({ ...articleForm, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                  >
                    {config.categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">الشارة (Badge)</label>
                  <input
                    type="text"
                    value={articleForm.badge}
                    onChange={(e) => setArticleForm({ ...articleForm, badge: e.target.value })}
                    placeholder="مثال: سريري، أساسي، A4 PDF، روائز 18"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">عنوان المقال والشرح</label>
                <input
                  type="text"
                  required
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  placeholder="مثال: كيفية توليد الحصيلة السريرية الشاملة Master Bilan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">الملخص والهدف السريري</label>
                <textarea
                  rows={2}
                  required
                  value={articleForm.summary}
                  onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                  placeholder="شرح موجز لأهمية الميزة وكيفية استفادة الطبيب منها..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                />
              </div>

              {/* Numbered Steps Array */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">الخطوات التنفيذية المتسلسلة</label>
                  <button
                    type="button"
                    onClick={() => setArticleForm({ ...articleForm, steps: [...articleForm.steps, ''] })}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة خطوة</span>
                  </button>
                </div>

                {articleForm.steps.map((step, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {sIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const newSteps = [...articleForm.steps];
                        newSteps[sIdx] = e.target.value;
                        setArticleForm({ ...articleForm, steps: newSteps });
                      }}
                      placeholder={`الخطوة ${sIdx + 1}...`}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs font-medium focus:outline-none"
                    />
                    {articleForm.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newSteps = articleForm.steps.filter((_, i) => i !== sIdx);
                          setArticleForm({ ...articleForm, steps: newSteps });
                        }}
                        className="p-2 text-rose-400 hover:text-rose-300 shrink-0"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Clinical Tip */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>نصيحة سريرية ذهبية (Pro Tip)</span>
                </label>
                <input
                  type="text"
                  value={articleForm.tip}
                  onChange={(e) => setArticleForm({ ...articleForm, tip: e.target.value })}
                  placeholder="مثال: الحصيلة تدعم التشكيل العربي الكامل والختم الرقمي..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingArticleIndex !== null ? 'تحديث المقال' : 'إضافة المقال للدليل'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT CATEGORY                                                */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 font-sans text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">
                {editingCategoryIndex !== null ? 'تعديل تصنيف' : 'إضافة تصنيف جديد'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">اسم التصنيف (Label)</label>
                <input
                  type="text"
                  required
                  value={categoryForm.label}
                  onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
                  placeholder="مثال: قمرة الأرطوفونيا"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">الأيقونة (Emoji)</label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    placeholder="🗣️"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-center text-base"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">رمز المعرف (ID)</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.id}
                    onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value })}
                    placeholder="orthophony_cockpit"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-left focus:outline-none focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">الوصف التعريفي</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="وصف مختصر لمحتويات القسم..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black"
                >
                  حفظ التصنيف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT FAQ                                                     */}
      {/* ========================================================================= */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 font-sans text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">
                {editingFaqIndex !== null ? 'تعديل سؤال شائع' : 'إضافة سؤال شائع جديد'}
              </h3>
              <button onClick={() => setIsFaqModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">نص السؤال</label>
                <input
                  type="text"
                  required
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  placeholder="مثال: هل تعمل المنصة دون اتصال بالإنترنت؟"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">التصنيف</label>
                <input
                  type="text"
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  placeholder="مثال: أمان، فوترة، سريري"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">الإجابة التفصيلية</label>
                <textarea
                  rows={4}
                  required
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  placeholder="اكتب الإجابة الطبية والتقنية الواضحة..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black"
                >
                  حفظ السؤال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
