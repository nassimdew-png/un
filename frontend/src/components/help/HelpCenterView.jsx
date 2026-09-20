import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HelpCircle,
  Search,
  BookOpen,
  Sparkles,
  Users,
  Brain,
  FileText,
  CreditCard,
  Send,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Play,
  Printer,
  Smartphone,
  ShieldCheck,
  Zap,
  Mic,
  Monitor,
  Building,
  Target,
  QrCode,
  Download,
  WifiOff,
  Copy,
  Check,
  Award,
  Video,
  DoorOpen,
  RefreshCw,
  Clock,
  Phone
} from 'lucide-react';
import { helpCenterApi } from '../../api';

export default function HelpCenterView() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('quickstart');
  const [expandedArticles, setExpandedArticles] = useState(new Set(['qs_1', 'fd_1', 'cs_1', 'psy_1', 'staff_1']));
  const [expandedFaq, setExpandedFaq] = useState(new Set([0, 1]));
  const [copiedStepIndex, setCopiedStepIndex] = useState(null);

  const [helpData, setHelpData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Dynamic Help Content from Server with local offline fallback
  useEffect(() => {
    let isMounted = true;

    const loadHelpContent = async () => {
      try {
        setLoading(true);
        const res = await helpCenterApi.getContent();
        if (isMounted && res && res.data) {
          setHelpData(res.data);
          if (res.data.categories && res.data.categories.length > 0) {
            setActiveCategory(res.data.categories[0].id);
          }
        }
      } catch (err) {
        console.warn('Using offline help content fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHelpContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleArticle = (id) => {
    setExpandedArticles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFaq = (idx) => {
    setExpandedFaq((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleCopySteps = (article) => {
    if (!article || !article.steps) return;
    const text = `📖 ${article.title}\n\n${article.summary || ''}\n\n📌 الخطوات التنفيذية:\n` +
      article.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') +
      (article.tip ? `\n\n💡 نصيحة: ${article.tip}` : '');
    
    navigator.clipboard.writeText(text);
    setCopiedStepIndex(article.id);
    setTimeout(() => setCopiedStepIndex(null), 2500);
  };

  const handleOpenWhatsAppSupport = () => {
    const phone = helpData?.supportContact?.whatsapp || '+213550000000';
    const text = encodeURIComponent('السلام عليكم، أحتاج مساعدة أو استفسار بخصوص استخدام منصة PsyPro العيادية.');
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const categories = helpData?.categories || [
    { id: 'quickstart', label: 'البداية السريعة وإعداد العيادة', icon: '🚀' },
    { id: 'front_desk', label: 'قمرة الاستقبال وقاعة الانتظار', icon: '🛋️' },
    { id: 'clinical_session', label: 'قمرة الجلسة المباشرة وSOAP', icon: '🩺' },
    { id: 'psychometrics', label: 'المقاييس الـ 18 والحصائل A4', icon: '📊' },
    { id: 'specialties', label: 'القمرات التخصصية السريرية', icon: '🏆' },
    { id: 'teletherapy_portal', label: 'التطبيب عن بعد وبوابة الأولياء', icon: '📹' },
    { id: 'staff_rbac', label: 'إدارة الكوادر وتخصيص الصلاحيات', icon: '👥' },
    { id: 'billing_subs', label: 'الفوترة واشتراكات BaridiMob', icon: '💳' },
    { id: 'faq_security', label: 'الأسئلة الشائعة والنسخ الاحتياطي', icon: '❓' },
  ];

  const articles = helpData?.articles || [];
  const faqs = helpData?.faqs || [];
  const supportContact = helpData?.supportContact || {
    whatsapp: '+213550000000',
    whatsappDisplay: '0550 00 00 00',
    phone: '+213550000000',
    email: 'support@psypro.tech',
    telegram: 'https://t.me/psypro_support',
    workHours: 'السبت - الخميس: 08:00 إلى 18:00',
    helpDeskNotice: 'فريق الدعم الفني السريري متاح لمساعدتكم في أي وقت عبر WhatsApp أو الهاتف.',
  };

  const quickActionCards = helpData?.quickActionCards || [
    {
      id: 'card_quickstart',
      title: 'دليل البدء السريع (5 دقائق)',
      desc: 'خطوات تهيئة العيادة وضبط الشعار والختم الطبي والأسعار.',
      icon: '🚀',
      targetCategory: 'quickstart',
    },
    {
      id: 'card_session',
      title: 'قمرة الجلسة وSOAP',
      desc: 'دليل تشغيل المسار السريري الـ 4 خطوات والمساعد الصوتي.',
      icon: '🩺',
      targetCategory: 'clinical_session',
    },
    {
      id: 'card_bilan',
      title: 'المقاييس والحصائل A4',
      desc: 'دليل تمرير الروائز وتوليد الحصيلة السريرية الرسمية Master Bilan.',
      icon: '📊',
      targetCategory: 'psychometrics',
    },
    {
      id: 'card_rbac',
      title: 'الصلاحيات وفريق العمل',
      desc: 'دليل مصفوفة الصلاحيات الـ 24 وقوالب الأدوار والقاعات والأتعاب.',
      icon: '👥',
      targetCategory: 'staff_rbac',
    },
  ];

  // Search filtering
  const q = searchQuery.toLowerCase().trim();
  const filteredArticles = articles.filter((art) => {
    if (q) {
      return (
        art.title?.toLowerCase().includes(q) ||
        art.summary?.toLowerCase().includes(q) ||
        art.badge?.toLowerCase().includes(q) ||
        (Array.isArray(art.steps) && art.steps.some((s) => s.toLowerCase().includes(q))) ||
        art.tip?.toLowerCase().includes(q)
      );
    }
    return art.categoryId === activeCategory;
  });

  const filteredFaqs = faqs.filter((faq) => {
    if (q) {
      return faq.question?.toLowerCase().includes(q) || faq.answer?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans text-right max-w-7xl mx-auto p-4 sm:p-6 lg:p-8" dir="rtl">
      {/* ========================================================================= */}
      {/* HEADER HERO BANNER                                                        */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-1">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>{helpData?.header?.badge || 'CLINICAL USER MANUAL & HELP CENTER'}</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {articles.length} شروحات ومقالات سريرية معتمدة 📚
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {helpData?.header?.title || 'مركز المساعدة والدليل السريري الشامل'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {helpData?.header?.subtitle || 'دليلك المفصل لاحتراف كافة ميزات وقمرات منصة PsyPro الطبية والعيادية وإدارة المرضى والمقاييس وتوليد الحصائل.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleOpenWhatsAppSupport}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-600/10"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>مساعدة فورية عبر WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
              title="طباعة الدليل السريري"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={helpData?.header?.searchPlaceholder || 'ابحث في مقالات الدليل، خطوات الجلسات، المقاييس، أو الأسئلة الشائعة...'}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-12 pl-4 py-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-2 py-0.5 rounded-lg"
            >
              مسح البحث ✕
            </button>
          )}
        </div>

        {/* Quick Action Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          {quickActionCards.map((card) => (
            <div
              key={card.id}
              onClick={() => {
                setSearchQuery('');
                setActiveCategory(card.targetCategory);
              }}
              className="p-3.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl cursor-pointer transition flex items-start gap-3 select-none"
            >
              <span className="text-xl shrink-0 pt-0.5">{card.icon}</span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-white">{card.title}</h4>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORY TABS BAR                                                         */}
      {/* ========================================================================= */}
      {!searchQuery && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = articles.filter((a) => a.categoryId === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl font-bold transition-all flex items-center gap-2 shrink-0 select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Search Filter Header */}
      {searchQuery && (
        <div className="p-3 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs text-indigo-300 font-bold">
          <span>نتائج البحث عن: "{searchQuery}" ({filteredArticles.length} مقال)</span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-slate-400 hover:text-white"
          >
            عرض الأقسام ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT: ARTICLES LIST                                               */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="text-xs font-bold">جاري تحميل الدليل والمقالات السريرية...</span>
        </div>
      ) : filteredArticles.length === 0 && !searchQuery ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">لا توجد مقالات في هذا القسم حالياً</h3>
          <p className="text-xs text-slate-400">يمكنك استكشاف الأقسام الأخرى في الشريط العلوي.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => {
            const isExpanded = expandedArticles.has(article.id);
            const isCopied = copiedStepIndex === article.id;
            const categoryObj = categories.find((c) => c.id === article.categoryId);

            return (
              <div
                key={article.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl transition-all hover:border-slate-700"
              >
                {/* Article Header & Toggle */}
                <div
                  onClick={() => toggleArticle(article.id)}
                  className="p-5 sm:p-6 cursor-pointer flex items-start justify-between gap-4 select-none bg-slate-900 hover:bg-slate-850 transition"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                        <span>{categoryObj?.icon || '📖'}</span>
                        <span>{categoryObj?.label || article.categoryId}</span>
                      </span>

                      {article.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {article.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-white">{article.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{article.summary}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySteps(article);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1"
                      title="نسخ خطوات الدليل"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>

                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Article Expandable Body */}
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-800/80 space-y-4 bg-slate-950/40">
                    {/* Numbered Steps */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-black text-indigo-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>خطوات التنفيذ والإجراءات السريرية:</span>
                      </h4>

                      <div className="space-y-2">
                        {article.steps?.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
                            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-xs">
                              {sIdx + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pro Tip Box */}
                    {article.tip && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">نصيحة سريرية ذهبية: </span>
                          <span>{article.tip}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: FREQUENTLY ASKED QUESTIONS (FAQ)                                 */}
      {/* ========================================================================= */}
      <div className="pt-6 border-t border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <span>الأسئلة الشائعة والأمان والخصوصية (FAQ)</span>
            </h2>
            <p className="text-xs text-slate-400">إجابات مباشرة عن التشفير، الصلاحيات، وضع عدم الاتصال، والاشتراكات.</p>
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isFaqExpanded = expandedFaq.has(idx);

            return (
              <div
                key={idx}
                onClick={() => toggleFaq(idx)}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 cursor-pointer shadow-md hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-3 select-none">
                  <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <span className="text-indigo-400">❓</span>
                    <span>{faq.question}</span>
                  </h4>
                  <span className="text-slate-400">
                    {isFaqExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>

                {isFaqExpanded && (
                  <p className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FOOTER: SUPPORT CONTACT BOX                                               */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-right">
          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>الدعم الفني والعيادي متاح الآن</span>
          </span>
          <h3 className="text-lg sm:text-xl font-black text-white">هل لديك استفسار أو تحتاج لمرافقة في الإعداد؟</h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            {supportContact.helpDeskNotice || 'فريق الدعم الفني السريري متاح لمساعدتكم في أي وقت عبر WhatsApp أو الهاتف.'}
            <br />
            <span className="text-slate-400 text-[11px]">⏰ {supportContact.workHours}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center shrink-0">
          <button
            type="button"
            onClick={handleOpenWhatsAppSupport}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center gap-2 shadow-xl shadow-emerald-600/30"
          >
            <MessageCircle className="w-4 h-4" />
            <span>تواصل عبر WhatsApp ({supportContact.whatsappDisplay})</span>
          </button>

          {supportContact.telegram && (
            <a
              href={supportContact.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-2xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Send className="w-4 h-4 text-sky-400" />
              <span>Telegram</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
