import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Code2,
  Cpu,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Layers,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  Activity,
  GitPullRequest,
  CheckCheck,
  FileText,
  HelpCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Bug,
  Flame,
  FileDiff,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { repoMaintainerApi } from '../../api';

export default function RepoMaintainerStudio() {
  const [activeStudioTab, setActiveStudioTab] = useState('console'); // 'console', 'live_errors'
  const [loadingScan, setLoadingScan] = useState(false);
  const [stats, setStats] = useState(null);
  const [controllers, setControllers] = useState([]);
  const [models, setModels] = useState([]);
  const [components, setComponents] = useState([]);

  // Query & Analysis State (Console)
  const [query, setQuery] = useState('');
  const [targetFile, setTargetFile] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeDiffView, setActiveDiffView] = useState('diff'); // 'diff', 'full'

  // Live Error 500 Diagnostics State
  const [diagnostics, setDiagnostics] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [applyingDiagId, setApplyingDiagId] = useState(null);

  // Patch Application State
  const [isApplying, setIsApplying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  const presets = [
    { label: '🔗 فحص تناسق مسارات الـ API', text: 'تحقق من تناسق مسارات API المسجلة في backend/routes/api.php مع دوال frontend/src/api.js واكتشف أي مسار مفقود.' },
    { label: '⚠️ تحليل آخر أخطاء laravel.log', text: 'افحص آخر الأخطاء المسجلة في laravel.log واقترح الإصلاح المباشر لها.' },
    { label: '🛡️ تدقيق أمان الاستعلامات والصلاحيات', text: 'راجع شروط التحقق من الصلاحيات auth:sanctum ومطابقة المستأجرين لمنع تسرب البيانات.' },
    { label: '⚡ فحص أداء الاستجابة والـ Caching', text: 'اقترح تحسينات لأداء الـ Caching وتفادي N+1 Query في دوال الـ Controllers.' },
  ];

  const handleScanRepo = async () => {
    setLoadingScan(true);
    setToast(null);
    try {
      const res = await repoMaintainerApi.scan();
      if (res.success) {
        setStats(res.stats);
        setControllers(res.controllers || []);
        setModels(res.models || []);
        setComponents(res.components || []);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setToast({ type: 'error', text: 'فشل فحص بنية المستودع البرمجي.' });
    } finally {
      setLoadingScan(false);
    }
  };

  const loadDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const res = await repoMaintainerApi.getDiagnostics();
      if (res.success) {
        setDiagnostics(res.diagnostics || []);
        setPendingCount(res.pending_count || 0);
      }
    } catch (err) {
      console.error('Failed to load diagnostics:', err);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  useEffect(() => {
    handleScanRepo();
    loadDiagnostics();
  }, []);

  const handleAnalyze = async (customQuery = null) => {
    const q = (customQuery || query).trim();
    if (!q || isAnalyzing) return;
    if (customQuery) setQuery(customQuery);

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setToast(null);

    try {
      const res = await repoMaintainerApi.analyzeIssue({
        question_or_error: q,
        target_file: targetFile.trim() || undefined,
      });

      if (res.success) {
        setAnalysisResult(res);
      } else {
        throw new Error(res.message || 'فشل تشخيص الكود');
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'تعذر تشخيص المشكلة البرمجية.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyPatch = async () => {
    if (!analysisResult?.target_file || !analysisResult?.modified_content || isApplying) return;

    if (!window.confirm(`هل أنت متأكد من رغبتك في تطبيق الترقيع على الملف [${analysisResult.target_file}]؟ سيتم إنشاء نسخة احتياطية .bak تلقائياً.`)) {
      return;
    }

    setIsApplying(true);
    setToast(null);

    try {
      const res = await repoMaintainerApi.applyPatch({
        target_file: analysisResult.target_file,
        modified_content: analysisResult.modified_content,
      });

      if (res.success) {
        setToast({
          type: 'success',
          text: `تم تطبيق الإصلاح البرمجي بنجاح على [${res.target_file}] وإنشاء نسخة احتياطية [${res.backup_file}]!`,
        });
      } else {
        throw new Error(res.message || 'فشل تطبيق الترقيع');
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'فشل تطبيق الترقيع البرمجي.' });
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplyDiagnosticPatch = async (diagId) => {
    if (!diagId || applyingDiagId) return;
    setApplyingDiagId(diagId);
    try {
      const res = await repoMaintainerApi.applyDiagnosticPatch(diagId);
      if (res.success) {
        setToast({
          type: 'success',
          text: `تم تطبيق الترقيع التلقائي بنجاح وإنشاء نسخة احتياطية [${res.backup_file}]!`,
        });
        loadDiagnostics();
        if (selectedError?.id === diagId) {
          setSelectedError(null);
        }
      } else {
        throw new Error(res.message || 'فشل تطبيق الترقيع');
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'فشل تطبيق الترقيع التلقائي.' });
    } finally {
      setApplyingDiagId(null);
    }
  };

  const handleDismissDiagnostic = async (diagId) => {
    try {
      await repoMaintainerApi.dismissDiagnostic(diagId);
      setToast({ type: 'success', text: 'تم تجاهل التنبيه.' });
      loadDiagnostics();
      if (selectedError?.id === diagId) {
        setSelectedError(null);
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'فشل تجاهل التنبيه.' });
    }
  };

  const handleCopyDiff = (diffText) => {
    if (!diffText) return;
    navigator.clipboard.writeText(diffText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render Formatted Unified Diff
  const renderFormattedDiff = (diffText) => {
    if (!diffText) return <span className="text-slate-500 text-xs">لا يوجد ترقيع diff متوفر.</span>;

    const lines = diffText.split('\n');
    return (
      <div className="font-mono text-xs overflow-x-auto select-text leading-relaxed">
        {lines.map((line, idx) => {
          let bgClass = 'bg-transparent text-slate-300';
          if (line.startsWith('+') && !line.startsWith('+++')) {
            bgClass = 'bg-emerald-950/50 text-emerald-300 font-bold border-r-2 border-emerald-500 pr-2';
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            bgClass = 'bg-rose-950/50 text-rose-300 font-bold border-r-2 border-rose-500 pr-2';
          } else if (line.startsWith('@@')) {
            bgClass = 'bg-indigo-950/60 text-indigo-300 font-bold px-2 py-0.5 my-0.5 rounded';
          } else if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff')) {
            bgClass = 'text-slate-400 font-bold';
          }

          return (
            <div key={idx} className={`py-0.5 px-2 flex items-center ${bgClass}`}>
              <span className="w-8 text-[10px] text-slate-600 select-none text-left pl-2 font-mono shrink-0">
                {idx + 1}
              </span>
              <pre className="font-mono whitespace-pre flex-1 overflow-x-auto">{line}</pre>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans text-right max-w-7xl mx-auto" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1.5 space-x-reverse">
                <Terminal className="w-3.5 h-3.5" />
                <span>AI REPO MAINTAINER & ERROR 500 INTERCEPTOR 🛠️🔴</span>
              </span>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  {pendingCount} أخطاء تحتاج مراجعة
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              فاحص وصيانة الشيفرة والتشخيص التلقائي للأخطاء
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              افحص بنية المشروع، تتبع أخطاء الخادم (Error 500) المعترضة تلقائياً مع تشخيص فوري وترقيعات جاهزة للتطبيق بضغطة زر.
            </p>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse shrink-0">
            <button
              type="button"
              onClick={handleScanRepo}
              disabled={loadingScan}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition flex items-center space-x-2 space-x-reverse shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-400 ${loadingScan ? 'animate-spin' : ''}`} />
              <span>فحص المستودع</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
          toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        }`}>
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white font-black">✕</button>
        </div>
      )}

      {/* 2. Sub-Tabs Switcher */}
      <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveStudioTab('console')}
          className={`px-4 py-2.5 rounded-2xl transition flex items-center space-x-2 space-x-reverse ${
            activeStudioTab === 'console' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>منصة تشخيص الكود (Diagnostic Console)</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveStudioTab('live_errors'); loadDiagnostics(); }}
          className={`px-4 py-2.5 rounded-2xl transition flex items-center space-x-2 space-x-reverse relative ${
            activeStudioTab === 'live_errors' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 font-black' : 'text-rose-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-400" />
          <span>🔴 تنبيهات الأخطاء الحية والتصحيح التلقائي ({diagnostics.length})</span>
          {pendingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping absolute -top-0.5 -right-0.5" />
          )}
        </button>
      </div>

      {/* 3. TAB 1: Console & Interactive Diagnostic */}
      {activeStudioTab === 'console' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Repository Health & Metrics Grid */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold block">إجمالي الملفات المفهرسة</span>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">{stats.total_scanned_files} ملف</div>
              </div>
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] text-indigo-400 font-bold block">متحكمات الباك إند (Controllers)</span>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">{stats.controllers_count} controller</div>
              </div>
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] text-purple-400 font-bold block">مكونات الفرونت إند (React)</span>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">{stats.components_count} component</div>
              </div>
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] text-emerald-400 font-bold block">النماذج والخدمات (Models & Services)</span>
                <div className="text-xl sm:text-2xl font-black text-white font-mono">{stats.models_count + stats.services_count} class</div>
              </div>
            </div>
          )}

          {/* Interactive Diagnostic Console */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            
            {/* Quick Diagnostic Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block">✨ مهام فحص وتشخيص سريعة:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAnalyze(p.text)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 transition whitespace-nowrap shrink-0 flex items-center space-x-1.5 space-x-reverse"
                  >
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Query & Target File */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">سؤال المسؤول أو الخطأ المطلوب تحليله:</label>
                <textarea
                  rows={3}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="اكتب رسالة الخطأ، المشكلة البرمجية، أو طلب التحسين بالتفصيل..."
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={targetFile}
                    onChange={(e) => setTargetFile(e.target.value)}
                    placeholder="الملف المستهدف (اختياري، مثلاً: backend/app/Http/Controllers/Api/PatientController.php)..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing || !query.trim()}
                  className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition flex items-center justify-center space-x-2 space-x-reverse shadow-lg shadow-indigo-600/25 disabled:opacity-50 shrink-0"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جارٍ الفحص والتشخيص العميق...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>🔍 فحص وتشخيص المشكلة</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Diagnostic & Diff Patch Output Canvas */}
          {analysisResult && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Root Cause Card */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-indigo-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>تقرير التشخيص وسبب المشكلة (Root Cause Analysis)</span>
                  </h3>

                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                    {analysisResult.target_file}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {analysisResult.root_cause}
                </p>

                {analysisResult.summary && (
                  <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
                    <strong>💡 ملخص التعديل:</strong> {analysisResult.summary}
                  </div>
                )}
              </div>

              {/* Unified Diff & Patch Viewer */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <GitPullRequest className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-black text-white">ترقيع التعديلات المقترحة (Git Diff Patch)</h3>
                      <p className="text-[11px] text-slate-400">راجع الأسطر المحذوفة والمضافة بدقة قبل التطبيق المباشر.</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setActiveDiffView('diff')}
                        className={`px-3 py-1 rounded-lg transition ${
                          activeDiffView === 'diff' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Diff
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDiffView('full')}
                        className={`px-3 py-1 rounded-lg transition ${
                          activeDiffView === 'full' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        الكود الكامل
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyDiff(analysisResult.diff_patch)}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold transition border border-slate-800 flex items-center space-x-1 space-x-reverse"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'تم النسخ' : 'نسخ الترقيع'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyPatch}
                      disabled={isApplying || !analysisResult.modified_content}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center space-x-1.5 space-x-reverse shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {isApplying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>جارٍ التطبيق...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>⚡ تطبيق الترقيع التلقائي (.bak)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Diff Container */}
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 max-h-[500px] overflow-y-auto">
                  {activeDiffView === 'diff' ? (
                    renderFormattedDiff(analysisResult.diff_patch)
                  ) : (
                    <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap">
                      {analysisResult.modified_content}
                    </pre>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* 4. TAB 2: Live Error 500 Interceptor & Auto-Patches */}
      {activeStudioTab === 'live_errors' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                  <Flame className="w-5 h-5 text-rose-400" />
                  <span>سجل أخطاء الخادم والتشخيص التلقائي المباشر (Intercepted Runtime Errors)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  يقوم النظام باعتراض أي استثناء 500 غير معالج، واستخراج مقتطف الكود، وتوليد ترقيع مصحح تلقائياً عبر الذكاء الاصطناعي.
                </p>
              </div>

              <button
                type="button"
                onClick={loadDiagnostics}
                disabled={loadingDiagnostics}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition"
              >
                <RefreshCw className={`w-4 h-4 ${loadingDiagnostics ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Errors List */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">نوع الاستثناء</th>
                    <th className="p-3.5">الملف والسطر</th>
                    <th className="p-3.5">الرسالة</th>
                    <th className="p-3.5 text-center">التكرار</th>
                    <th className="p-3.5 text-center">الحالة</th>
                    <th className="p-3.5 text-center">التاريخ</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {diagnostics.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        🎉 ممتاز! لا توجد أخطاء استثناءات 500 مسجلة في النظام.
                      </td>
                    </tr>
                  ) : (
                    diagnostics.map((diag) => (
                      <tr key={diag.id} className="hover:bg-slate-950/60 transition">
                        <td className="p-3.5 font-bold text-rose-300 font-mono text-[11px] max-w-xs truncate">
                          {diag.exception_class.split('\\').pop()}
                        </td>
                        <td className="p-3.5 text-slate-300 font-mono text-[11px] max-w-xs truncate" title={diag.file}>
                          {diag.file.split(/[/\\]/).slice(-2).join('/')}:{diag.line}
                        </td>
                        <td className="p-3.5 text-slate-400 max-w-xs truncate" title={diag.message}>
                          {diag.message}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-amber-300">
                          {diag.occurrences_count}x
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            diag.status === 'applied'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : diag.status === 'dismissed'
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}>
                            {diag.status === 'applied' ? 'تم الإصلاح ✅' : diag.status === 'dismissed' ? 'تجاهل' : 'معلق 🔴'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-500 text-[10px]">
                          {diag.last_seen_at ? new Date(diag.last_seen_at).toLocaleTimeString('ar-DZ') : '---'}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedError(diag)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition text-xs font-bold"
                          >
                            معاينة وحل
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Selected Error Detail & Auto-Patch Drawer / Modal */}
          {selectedError && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl space-y-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    🔴 استثناء خطأ 500 معترض
                  </span>
                  <h3 className="text-base font-black text-white">{selectedError.exception_class}</h3>
                  <p className="text-xs text-rose-400 font-mono">{selectedError.file}:{selectedError.line}</p>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => handleDismissDiagnostic(selectedError.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition border border-slate-800"
                  >
                    تجاهل الخطأ
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedError(null)}
                    className="p-1.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* AI Diagnosis */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <span className="text-xs font-black text-indigo-300 flex items-center space-x-2 space-x-reverse">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>السبب الجذري واستنتاج الذكاء الاصطناعي (AI Root Cause):</span>
                </span>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedError.ai_diagnosis}
                </p>
              </div>

              {/* Code Context around Error */}
              {selectedError.code_context && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-400">مقتطف الكود المحيط بسطر الخطأ:</span>
                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto">
                    {selectedError.code_context}
                  </pre>
                </div>
              )}

              {/* Proposed Patch Diff */}
              {selectedError.proposed_patch && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 space-x-reverse">
                      <GitPullRequest className="w-4 h-4" />
                      <span>ترقيع الإصلاح المقترح تلقائياً (Proposed Git Diff):</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyDiff(selectedError.proposed_patch)}
                      className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الترقيع</span>
                    </button>
                  </div>

                  <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 max-h-60 overflow-y-auto">
                    {renderFormattedDiff(selectedError.proposed_patch)}
                  </div>
                </div>
              )}

              {/* Direct 1-Click Apply */}
              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleApplyDiagnosticPatch(selectedError.id)}
                  disabled={applyingDiagId === selectedError.id || selectedError.status === 'applied'}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-emerald-600/25 disabled:opacity-50"
                >
                  {applyingDiagId === selectedError.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جارٍ التطبيق التلقائي...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>{selectedError.status === 'applied' ? 'تم تطبيق الإصلاح مسبقاً ✅' : '⚡ تطبيق الترقيع التلقائي فوراً (.bak)'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
