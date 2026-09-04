import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Plus,
  Search,
  BookOpen,
  CheckCircle2,
  Stethoscope,
  Brain,
  Layers,
  Edit2,
  Trash2,
  RefreshCw,
  Power,
  Sliders,
  Filter,
  AlertTriangle,
  X,
  Check,
  Award,
  Clock,
  User,
  Zap,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Info
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function AssessmentsCatalogManagerTab() {
  const [tests, setTests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'enabled' | 'disabled'

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Delete Confirm Modal State
  const [deleteConfirmTest, setDeleteConfirmTest] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    test_code: '',
    name_ar: '',
    name_fr: '',
    category: 'orthophonie',
    minimum_plan_required: 'solo_starter',
    is_globally_enabled: true,
    age_range: '',
    duration: '',
    source: 'CREAPSY 🇩🇿',
    cutoff: '',
    dimensions: '',
    description: '',
  });

  const categories = [
    { id: 'all', label: '🌟 كافة التخصصات والروائز' },
    { id: 'orthophonie', label: '🗣️ النطق والأرطوفونيا' },
    { id: 'psychologie', label: '🧠 علم النفس والشخصية' },
    { id: 'autisme', label: '🧩 طيف التوحد (TSA)' },
    { id: 'intelligence', label: '💡 الذكاء والقدرات العقلية (IQ)' },
    { id: 'tdah_apprentissage', label: '⚡ فرط الحركة وصعوبات التعلم' },
    { id: 'psychomotricite', label: '🏃 النفسي-حركي والتوازن' },
  ];

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await superAdminApi.getGlobalTests({
        category: selectedCategory !== 'all' ? selectedCategory : '',
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
      });
      if (res && res.tests) {
        setTests(res.tests);
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load global tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [selectedCategory, statusFilter]);

  // Handle Search on Enter or debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTests();
  };

  const handleOpenAddModal = () => {
    setEditingTest(null);
    setFormData({
      test_code: '',
      name_ar: '',
      name_fr: '',
      category: 'orthophonie',
      minimum_plan_required: 'solo_starter',
      is_globally_enabled: true,
      age_range: '',
      duration: '',
      source: 'CREAPSY 🇩🇿',
      cutoff: '',
      dimensions: '',
      description: '',
    });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (test) => {
    setEditingTest(test);
    const np = test.norms_payload || {};
    setFormData({
      test_code: test.test_code || '',
      name_ar: test.name_ar || '',
      name_fr: test.name_fr || '',
      category: test.category || 'orthophonie',
      minimum_plan_required: test.minimum_plan_required || 'solo_starter',
      is_globally_enabled: test.is_globally_enabled ?? true,
      age_range: np.age_range || '',
      duration: np.duration || '',
      source: np.source || 'CREAPSY 🇩🇿',
      cutoff: np.cutoff || '',
      dimensions: Array.isArray(np.dimensions) ? np.dimensions.join(', ') : (np.dimensions || ''),
      description: test.description || '',
    });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.test_code.trim() || !formData.name_ar.trim()) {
      setFormError('يرجى ملء رمز المقياس والاسم بالعربية على الأقل.');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = {
        test_code: formData.test_code.trim().toUpperCase(),
        name_ar: formData.name_ar.trim(),
        name_fr: formData.name_fr.trim(),
        category: formData.category,
        minimum_plan_required: formData.minimum_plan_required,
        is_globally_enabled: formData.is_globally_enabled,
        description: formData.description.trim(),
        norms_payload: {
          age_range: formData.age_range.trim(),
          duration: formData.duration.trim(),
          source: formData.source.trim(),
          cutoff: formData.cutoff.trim(),
          dimensions: formData.dimensions.split(',').map(d => d.trim()).filter(Boolean),
        }
      };

      if (editingTest) {
        await superAdminApi.updateTestConfig(editingTest.test_code, payload);
        setFormSuccess('تم تحديث وتصحيح بيانات المقياس بنجاح!');
      } else {
        await superAdminApi.createTestConfig(payload);
        setFormSuccess('تمت إضافة المقياس المعياري الجديد بنجاح!');
      }

      setTimeout(() => {
        setModalOpen(false);
        fetchTests();
      }, 1000);
    } catch (err) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (test) => {
    try {
      const res = await superAdminApi.toggleTestStatus(test.test_code);
      if (res && res.success) {
        setTests(prev => prev.map(t => t.id === test.id ? { ...t, is_globally_enabled: res.is_globally_enabled } : t));
        if (stats) {
          setStats(prev => ({
            ...prev,
            enabled_tests: res.is_globally_enabled ? prev.enabled_tests + 1 : prev.enabled_tests - 1,
            disabled_tests: res.is_globally_enabled ? prev.disabled_tests - 1 : prev.disabled_tests + 1,
          }));
        }
      }
    } catch (err) {
      alert(err.message || 'فشل تغيير حالة تفعيل المقياس.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmTest) return;
    try {
      setDeleteLoading(true);
      await superAdminApi.deleteTestConfig(deleteConfirmTest.test_code);
      setDeleteConfirmTest(null);
      fetchTests();
    } catch (err) {
      alert(err.message || 'فشل حذف المقياس.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSyncDefaults = async () => {
    if (!window.confirm('هل تريد مزامنة وتحديث كافة الروائز والمقاييس من الكتالوج المركزي المعتمد (CREAPSY)؟ لن يتم حذف أي روائز إضافية أضفتها يدوياً.')) {
      return;
    }
    try {
      setSyncing(true);
      setSyncMessage('');
      const res = await superAdminApi.syncDefaultTestsCatalog();
      if (res && res.success) {
        setSyncMessage(res.message);
        fetchTests();
        setTimeout(() => setSyncMessage(''), 5000);
      }
    } catch (err) {
      alert(err.message || 'فشل مزامنة الروائز.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>SUPER ADMIN CLINICAL ENGINE</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                +98 رائز ومقياس مقنن في قاعدة البيانات 🌟
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              إدارة بنك الروائز، المقاييس والبروتوكولات السريرية
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              تحكم كامل ومباشر في المكتبة السريرية لكافة العيادات: إضافة روائز جديدة، تصحيح وتعديل المعايير، تفعيل أو تعطيل المقاييس، وإدارة أبعاد التقييم ومعايير القطع (Cutoffs).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleSyncDefaults}
              disabled={syncing}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse border border-slate-700 shadow disabled:opacity-50"
              title="مزامنة وتحديث كافة الروائز المعيارية من ملف الكتالوج المركزي"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-400 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'جاري المزامنة...' : 'مزامنة CREAPSY'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مقياس جديد +</span>
            </button>
          </div>
        </div>

        {/* Sync Success Alert */}
        {syncMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Quick KPI Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-800/80">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
              <div className="text-[11px] text-slate-400 font-bold">إجمالي الروائز</div>
              <div className="text-xl font-black text-white font-mono">{stats.total_tests}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
              <div className="text-[11px] text-emerald-400 font-bold">المقاييس المفعلة</div>
              <div className="text-xl font-black text-emerald-400 font-mono">{stats.enabled_tests}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
              <div className="text-[11px] text-teal-400 font-bold">الأرطوفونيا واللغة</div>
              <div className="text-xl font-black text-teal-400 font-mono">{stats.orthophonie_tests || 0}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
              <div className="text-[11px] text-purple-400 font-bold">علم النفس والشخصية</div>
              <div className="text-xl font-black text-purple-400 font-mono">{stats.psychologie_tests || 0}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
              <div className="text-[11px] text-indigo-400 font-bold">الذكاء والقدرات (IQ)</div>
              <div className="text-xl font-black text-indigo-400 font-mono">{stats.intelligence_tests || 0}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
              <div className="text-[11px] text-pink-400 font-bold">طيف التوحد (TSA)</div>
              <div className="text-xl font-black text-pink-400 font-mono">{stats.autisme_tests || 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالرمز (WISC, CARS, DO80...)، الاسم بالعربية أو الفرنسية، أو الوصف..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة الحالات (مفعل ومعطل)</option>
              <option value="enabled">🟢 المقاييس المفعلة فقط</option>
              <option value="disabled">🔴 المقاييس المعطلة فقط</option>
            </select>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1.5 space-x-reverse"
          >
            <span>بحث</span>
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid / List */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-slate-900/60 border border-slate-800 rounded-3xl">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <div className="text-xs text-slate-400 font-bold">جاري تحميل الروائز والمقاييس السريرية...</div>
        </div>
      ) : tests.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
          <Database className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-slate-300">لم يتم العثور على أي مقاييس تطابق معايير البحث.</div>
          <p className="text-xs text-slate-500">يمكنك إضافة مقياس جديد أو الضغط على "مزامنة CREAPSY" لإعادة تحميل الكتالوج المعتمد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tests.map((test) => {
            const np = test.norms_payload || {};
            return (
              <div
                key={test.id}
                className={`bg-slate-900 border rounded-3xl p-5 space-y-4 shadow-xl transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden ${
                  test.is_globally_enabled ? 'border-slate-800 hover:border-indigo-500/50' : 'border-red-500/20 bg-slate-950/90 opacity-75'
                }`}
              >
                {/* Accent Top Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  test.is_globally_enabled ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-red-500'
                }`} />

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-black bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {test.test_code}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{test.category}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(test)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center gap-1 ${
                          test.is_globally_enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                        }`}
                        title="انقر لتفعيل أو تعطيل المقياس لكافة العيادات"
                      >
                        <Power className="w-3 h-3" />
                        <span>{test.is_globally_enabled ? 'مفعل' : 'معطل'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-white leading-snug group-hover:text-indigo-300 transition line-clamp-2">
                      {test.name_ar}
                    </h3>
                    {test.name_fr && (
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5 line-clamp-1">
                        {test.name_fr}
                      </div>
                    )}
                  </div>

                  {test.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                    {np.age_range && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><User className="w-3 h-3 text-indigo-400" /> الفئة:</span>
                        <strong className="text-slate-200">{np.age_range}</strong>
                      </div>
                    )}
                    {np.source && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Award className="w-3 h-3 text-amber-400" /> المصدر:</span>
                        <strong className="text-amber-300">{np.source}</strong>
                      </div>
                    )}
                    {np.cutoff && (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-[10px] text-slate-300 line-clamp-1">
                        <strong className="text-indigo-400">معيار القطع:</strong> {np.cutoff}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(test)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1.5 space-x-reverse"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>تعديل وتصحيح</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmTest(test)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                    title="حذف المقياس"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  {editingTest ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingTest ? `تعديل المقياس السريري [${editingTest.test_code}]` : 'إضافة مقياس معياري جديد'}
                  </h3>
                  <p className="text-xs text-slate-400">تحديث المعايير وأبعاد التقييم والبيانات المتاحة للعيادات</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">رمز المقياس السريري (Code) *:</label>
                  <input
                    type="text"
                    value={formData.test_code}
                    onChange={(e) => setFormData({ ...formData, test_code: e.target.value })}
                    placeholder="مثال: CARS-2, WISC-V, ALOU-R"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">التخصص العيادي *:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="orthophonie">🗣️ النطق والأرطوفونيا (Orthophonie)</option>
                    <option value="psychologie">🧠 علم النفس العيادي (Psychologie)</option>
                    <option value="autisme">🧩 طيف التوحد (Autisme & TSA)</option>
                    <option value="intelligence">💡 الذكاء والقدرات العقلية (Intelligence IQ)</option>
                    <option value="tdah_apprentissage">⚡ فرط الحركة وصعوبات التعلم (TDAH)</option>
                    <option value="psychomotricite">🏃 النفسي-حركي والتوازن (Psychomotricité)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">الاسم والتعريب السريري بالعربية *:</label>
                <input
                  type="text"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="مثال: مقياس تقدير التوحد الطفولي (نسخة المعيار الجزائري)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">الاسم الأصلي بالفرنسية / الإنجليزية:</label>
                <input
                  type="text"
                  value={formData.name_fr}
                  onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                  placeholder="مثال: Childhood Autism Rating Scale - 2nd Edition"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">الفئة العمرية المستهدفة:</label>
                  <input
                    type="text"
                    value={formData.age_range}
                    onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                    placeholder="مثال: 6 - 16 سنة"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">مدة التطبيق التقديرية:</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="مثال: 30 - 45 دقيقة"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">جهة التقنين والاعتماد:</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="مثال: CREAPSY 🇩🇿 أو جامعة الجزائر"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">معايير القطع والتفسير السريري (Cutoffs):</label>
                <input
                  type="text"
                  value={formData.cutoff}
                  onChange={(e) => setFormData({ ...formData, cutoff: e.target.value })}
                  placeholder="مثال: طبيعي < 10 | خفيف: 11-17 | متوسط: 18-24 | شديد: > 25"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">محاور وأبعاد التقييم (مفصولة بفواصل):</label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  placeholder="مثال: الفهم اللفظي, الذاكرة العاملة, سرعة المعالجة, الاستدلال المكاني"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">الوصف السريري والإكلينيكي:</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للهدف السريري من الرائز وطريقة تطبيقه..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse pt-2">
                <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_globally_enabled}
                    onChange={(e) => setFormData({ ...formData, is_globally_enabled: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-300">
                    تفعيل المقياس وإتاحته فوراً لكافة العيادات في المنصة
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{formSubmitting ? 'جاري الحفظ...' : (editingTest ? 'تحديث وتصحيح المقياس' : 'حفظ وإضافة المقياس')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-right">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">تأكيد حذف المقياس</h3>
                <p className="text-xs text-rose-300 font-mono">{deleteConfirmTest.test_code}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف المقياس <strong className="text-white">[{deleteConfirmTest.name_ar}]</strong> نهائياً من البنك المركزي؟ لن تتمكن العيادات من استخدامه بعد الحذف.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteLoading ? 'جاري الحذف...' : 'تأكيد الحذف النهائي'}</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmTest(null)}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
