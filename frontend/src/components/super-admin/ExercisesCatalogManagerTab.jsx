import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Clock,
  User,
  Sparkles,
  Volume2,
  Brain,
  Activity,
  Smile,
  Target,
  Compass,
  FileText,
  X,
  Check,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { superAdminApi } from '../../api';
import { EXERCISE_CATEGORIES } from '../therapy/ExercisesCatalogData';

export default function ExercisesCatalogManagerTab() {
  const [exercises, setExercises] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    orthophony: 0,
    psychology: 0,
    psychomotricite: 0,
    active: 0,
    disabled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('basic'); // 'basic' | 'steps' | 'worksheet'
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Preview & Delete Confirmation
  const [previewExercise, setPreviewExercise] = useState(null);
  const [deleteConfirmExercise, setDeleteConfirmExercise] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const initialFormState = {
    exercise_code: '',
    specialty: 'orthophony',
    specialty_label: 'الأرطوفونيا والتخاطب',
    title_ar: '',
    title_fr: '',
    category: 'articulation',
    category_label: 'مخارج الحروف والاضطرابات النطقية',
    target_group: 'الأطفال (4-12 سنة) والبالغين',
    difficulty: 'متوسط',
    estimated_duration: '10 - 15 دقيقة يومياً',
    badge: 'مخارج الحروف 🗣️',
    summary: '',
    instructions: [
      '1. الجلوس في وضعية مريحة أمام المرآة.',
      '2. اتباع إرشادات المعالج بتركيز وهدوء.',
      '3. تكرار الحركة أو الصوت 5 مرات متتالية.',
    ],
    worksheet_content_json: '{\n  "single_items": ["بند 1", "بند 2", "بند 3"],\n  "sentences": ["جملة تدريبية نموذجية."]\n}',
    homework_tips: 'يُفضل التدريب يومياً لمدة 10 دقائق بعد الوجبات بمرافقة الولي.',
    is_globally_enabled: true,
    minimum_plan_required: 'starter',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch exercises from API
  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await superAdminApi.getGlobalExercises({
        specialty: specialtyFilter !== 'all' ? specialtyFilter : '',
        category: categoryFilter !== 'all' ? categoryFilter : '',
        status: statusFilter !== 'all' ? statusFilter : '',
        search: searchQuery,
      });

      if (res && res.exercises) {
        setExercises(res.exercises);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load global exercises:', err);
      setError('تعذر تحميل بنك التمارين والكراسات من الخادم الرئيسي.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [specialtyFilter, categoryFilter, statusFilter]);

  // Handle Search Debounce / Trigger
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    fetchExercises();
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingExercise(null);
    setFormData(initialFormState);
    setActiveFormTab('basic');
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (ex) => {
    setEditingExercise(ex);
    
    // Format worksheet content to pretty JSON string
    let wsJson = '';
    try {
      wsJson = JSON.stringify(ex.worksheet_content || {}, null, 2);
    } catch {
      wsJson = '{}';
    }

    setFormData({
      exercise_code: ex.exercise_code || '',
      specialty: ex.specialty || 'orthophony',
      specialty_label: ex.specialty_label || '',
      title_ar: ex.title_ar || '',
      title_fr: ex.title_fr || '',
      category: ex.category || 'articulation',
      category_label: ex.category_label || '',
      target_group: ex.target_group || '',
      difficulty: ex.difficulty || 'متوسط',
      estimated_duration: ex.estimated_duration || '10 - 15 دقيقة',
      badge: ex.badge || '',
      summary: ex.summary || '',
      instructions: Array.isArray(ex.instructions) && ex.instructions.length > 0
        ? [...ex.instructions]
        : ['1. بدء التمرين بالاسترخاء والتركيز.'],
      worksheet_content_json: wsJson,
      homework_tips: ex.homework_tips || '',
      is_globally_enabled: ex.is_globally_enabled ?? true,
      minimum_plan_required: ex.minimum_plan_required || 'starter',
    });
    setActiveFormTab('basic');
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Update Specialty with default labels
  const handleSpecialtyChange = (spec) => {
    let specLabel = 'الأرطوفونيا والتخاطب';
    let defaultCat = 'articulation';
    let defaultCatLabel = 'مخارج الحروف والاضطرابات النطقية';

    if (spec === 'psychology') {
      specLabel = 'علم النفس العيادي المعرفي';
      defaultCat = 'cbt';
      defaultCatLabel = 'العلاج المعرفي السلوكي (CBT)';
    } else if (spec === 'psychomotricite') {
      specLabel = 'التأهيل النفسي الحركي';
      defaultCat = 'spatial';
      defaultCatLabel = 'الفضاء والزمان والجانبية';
    }

    setFormData((prev) => ({
      ...prev,
      specialty: spec,
      specialty_label: specLabel,
      category: defaultCat,
      category_label: defaultCatLabel,
    }));
  };

  // Form Submission (Add or Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.exercise_code.trim()) {
      setFormError('يرجى تحديد رمز فريد للتمرين السريري.');
      return;
    }
    if (!formData.title_ar.trim()) {
      setFormError('يرجى كتابة عنوان التمرين باللغة العربية.');
      return;
    }

    // Parse worksheet JSON
    let parsedWorksheet = {};
    if (formData.worksheet_content_json.trim()) {
      try {
        parsedWorksheet = JSON.parse(formData.worksheet_content_json);
      } catch (err) {
        setFormError('صيغة محتوى ورقة العمل غير صالحة (JSON Syntax Error). يرجى التأكد من كتابة JSON صحيح أو تفريغ الحقل.');
        setActiveFormTab('worksheet');
        return;
      }
    }

    const payload = {
      exercise_code: formData.exercise_code.trim().toUpperCase(),
      specialty: formData.specialty,
      specialty_label: formData.specialty_label,
      title_ar: formData.title_ar.trim(),
      title_fr: formData.title_fr?.trim() || null,
      category: formData.category,
      category_label: formData.category_label,
      target_group: formData.target_group?.trim() || null,
      difficulty: formData.difficulty,
      estimated_duration: formData.estimated_duration,
      badge: formData.badge,
      summary: formData.summary,
      instructions: formData.instructions.filter((s) => s.trim().length > 0),
      worksheet_content: parsedWorksheet,
      homework_tips: formData.homework_tips,
      is_globally_enabled: Boolean(formData.is_globally_enabled),
      minimum_plan_required: formData.minimum_plan_required,
    };

    try {
      setFormSubmitting(true);
      if (editingExercise) {
        await superAdminApi.updateExercise(editingExercise.id || editingExercise.exercise_code, payload);
        setSuccessMessage(`تم تحديث بيانات التمرين [${payload.title_ar}] بنجاح.`);
      } else {
        await superAdminApi.createExercise(payload);
        setSuccessMessage(`تمت إضافة التمرين الجديد [${payload.title_ar}] بنجاح إلى البنك المركزي.`);
      }

      setIsFormModalOpen(false);
      fetchExercises();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error saving exercise:', err);
      const msg = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء حفظ بيانات التمرين.';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Exercise Status
  const handleToggleStatus = async (exercise) => {
    try {
      const res = await superAdminApi.toggleExerciseStatus(exercise.id || exercise.exercise_code);
      if (res && res.success) {
        setExercises((prev) =>
          prev.map((item) =>
            item.id === exercise.id ? { ...item, is_globally_enabled: res.is_globally_enabled } : item
          )
        );
        setStats((prev) => ({
          ...prev,
          active: res.is_globally_enabled ? prev.active + 1 : Math.max(0, prev.active - 1),
          disabled: !res.is_globally_enabled ? prev.disabled + 1 : Math.max(0, prev.disabled - 1),
        }));
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('تعذر تغيير حالة التمرين.');
    }
  };

  // Delete Exercise
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmExercise) return;
    try {
      setIsDeleting(true);
      await superAdminApi.deleteExercise(deleteConfirmExercise.id || deleteConfirmExercise.exercise_code);
      setSuccessMessage(`تم حذف التمرين [${deleteConfirmExercise.title_ar}] بنجاح.`);
      setDeleteConfirmExercise(null);
      fetchExercises();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to delete exercise:', err);
      alert('تعذر حذف التمرين من البنك المركزي.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Dynamic Instructions step handlers
  const handleAddInstructionStep = () => {
    setFormData((prev) => ({
      ...prev,
      instructions: [...prev.instructions, `${prev.instructions.length + 1}. خطوة جديدة...`],
    }));
  };

  const handleUpdateInstructionStep = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.instructions];
      updated[index] = value;
      return { ...prev, instructions: updated };
    });
  };

  const handleRemoveInstructionStep = (index) => {
    setFormData((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }));
  };

  // Specialty aesthetic helpers
  const getSpecialtyBadgeColor = (spec) => {
    switch (spec) {
      case 'orthophony':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/30';
      case 'psychology':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'psychomotricite':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getSpecialtyIcon = (spec) => {
    switch (spec) {
      case 'orthophony':
        return <Volume2 className="w-4 h-4 text-teal-400" />;
      case 'psychology':
        return <Brain className="w-4 h-4 text-indigo-400" />;
      case 'psychomotricite':
        return <Compass className="w-4 h-4 text-amber-400" />;
      default:
        return <Activity className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-600/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 space-x-reverse border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span className="text-xs font-black">{successMessage}</span>
        </div>
      )}

      {/* Hero Header & Statistics */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-950 border border-teal-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                📚 بنك التمارين والكراسات السريرية المركزي
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Global EHR Catalog 🇩🇿
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              إدارة بنك التمارين، أوراق العمل والكراسات العلاجية
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              إضافة، تحرير وتخصيص التمارين المركزية لجميع العيادات المشتركة عبر التخصصات الثلاثة: الأرطوفونيا والتخاطب، العلاج النفسي (CBT)، والتأهيل النفسي الحركي.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={fetchExercises}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-2 space-x-reverse border border-slate-700 shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-teal-500/25 transition flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة تمرين / كراس جديد</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 font-bold">إجمالي التمارين</p>
            <p className="text-xl font-black text-white mt-0.5">{stats.total}</p>
          </div>
          <div className="p-3 rounded-2xl bg-teal-950/30 border border-teal-800/40 text-center">
            <p className="text-[11px] text-teal-300 font-bold">الأرطوفونيا</p>
            <p className="text-xl font-black text-teal-400 mt-0.5">{stats.orthophony}</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-center">
            <p className="text-[11px] text-indigo-300 font-bold">علم النفس (CBT)</p>
            <p className="text-xl font-black text-indigo-400 mt-0.5">{stats.psychology}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-center">
            <p className="text-[11px] text-amber-300 font-bold">النفسي حركي</p>
            <p className="text-xl font-black text-amber-400 mt-0.5">{stats.psychomotricite}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-center">
            <p className="text-[11px] text-emerald-300 font-bold">التمارين المفعلة</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{stats.active}</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-center">
            <p className="text-[11px] text-rose-300 font-bold">المعطلة / قيد المراجعة</p>
            <p className="text-xl font-black text-rose-400 mt-0.5">{stats.disabled}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالعنوان، رمز التمرين، التصنيف، أو الكلمات المفتاحية..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 transition"
            />
          </form>

          {/* Specialty Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'كافة التخصصات' },
              { id: 'orthophony', label: '🗣️ أرطوفونيا' },
              { id: 'psychology', label: '🧠 علم النفس' },
              { id: 'psychomotricite', label: '🏃 نفسي حركي' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSpecialtyFilter(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  specialtyFilter === tab.id
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <span className="text-slate-400 font-bold">التصنيف:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500/50"
              >
                {EXERCISE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <span className="text-slate-400 font-bold">الحالة:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500/50"
              >
                <option value="all">الكل</option>
                <option value="active">مفعل فقط</option>
                <option value="inactive">معطل فقط</option>
              </select>
            </div>
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            عرض <span className="text-teal-400 font-bold">{exercises.length}</span> تمرين وكراس سريري
          </div>
        </div>
      </div>

      {/* Exercises List / Grid */}
      {loading ? (
        <div className="p-16 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold">جاري تحميل وتحديث بنك التمارين السريرية...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-rose-950/30 border border-rose-800/40 text-center space-y-2 text-rose-300">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      ) : exercises.length === 0 ? (
        <div className="p-16 rounded-3xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">لا توجد تمارين مطابقة لمعايير البحث الحالية</h3>
          <p className="text-xs text-slate-500">جرب تغيير عوامل التصفية أو أضف تمريناً جديداً إلى البنك المركزي.</p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition inline-flex items-center space-x-1.5 space-x-reverse"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تمرين جديد</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => {
            const isEnabled = ex.is_globally_enabled;
            const stepsCount = Array.isArray(ex.instructions) ? ex.instructions.length : 0;
            return (
              <div
                key={ex.id || ex.exercise_code}
                className={`p-5 rounded-3xl bg-slate-900/90 border transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-xl hover:border-slate-700 ${
                  isEnabled ? 'border-slate-800' : 'border-rose-950/60 opacity-75'
                }`}
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 space-x-reverse ${getSpecialtyBadgeColor(
                          ex.specialty
                        )}`}
                      >
                        {getSpecialtyIcon(ex.specialty)}
                        <span>{ex.specialty_label || ex.specialty}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {ex.exercise_code}
                      </span>
                    </div>

                    {/* Status Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(ex)}
                      title={isEnabled ? 'انقر للتعطيل' : 'انقر للتفعيل'}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition flex items-center space-x-1 space-x-reverse ${
                        isEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                    >
                      {isEnabled ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>مفعل</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-400" />
                          <span>معطل</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-white leading-snug">{ex.title_ar}</h3>
                    {ex.title_fr && (
                      <p className="text-[11px] text-slate-400 font-sans italic mt-0.5">{ex.title_fr}</p>
                    )}
                  </div>

                  {ex.summary && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                      {ex.summary}
                    </p>
                  )}
                </div>

                {/* Card Meta Info */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1.5 space-x-reverse truncate">
                      <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate">{ex.estimated_duration || '15 دقيقة'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 space-x-reverse truncate">
                      <Target className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{ex.difficulty || 'متوسط'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 space-x-reverse truncate col-span-2">
                      <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{ex.target_group || 'جميع الفئات السريرية'}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-800/50">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewExercise(ex)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-teal-300 text-xs transition"
                        title="معاينة محتوى الكراس والتمرين"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(ex)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 text-xs transition"
                        title="تعديل بيانات التمرين"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmExercise(ex)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 text-xs transition"
                        title="حذف من البنك المركزي"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 font-mono">
                      {stepsCount} خطوة تعليمية
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT EXERCISE                                                */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-teal-950/30 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {editingExercise ? 'تعديل تمرين / كراس سريري' : 'إضافة تمرين جديد للبنك المركزي'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingExercise
                      ? `رمز التمرين: ${editingExercise.exercise_code}`
                      : 'أدخل المواصفات السريرية، التعليمات، ومحتويات الكراس'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
              <button
                type="button"
                onClick={() => setActiveFormTab('basic')}
                className={`pb-3 px-4 text-xs font-bold transition border-b-2 ${
                  activeFormTab === 'basic'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                1. البيانات الأساسية والتصنيف
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('steps')}
                className={`pb-3 px-4 text-xs font-bold transition border-b-2 ${
                  activeFormTab === 'steps'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                2. الأهداف والخطوات الإرشادية ({formData.instructions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('worksheet')}
                className={`pb-3 px-4 text-xs font-bold transition border-b-2 ${
                  activeFormTab === 'worksheet'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                3. محتوى الكراس والتمارين (JSON)
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-bold flex items-center space-x-2 space-x-reverse">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* TAB 1: BASIC INFO */}
              {activeFormTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Exercise Code */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>رمز التمرين (Unique Code) *</span>
                        <span className="text-[10px] text-slate-500 font-mono">مثل: EX_ORTHO_R</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.exercise_code}
                        onChange={(e) => setFormData({ ...formData, exercise_code: e.target.value.toUpperCase() })}
                        placeholder="EX_ORTHO_..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    {/* Specialty */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">التخصص السريري *</label>
                      <select
                        value={formData.specialty}
                        onChange={(e) => handleSpecialtyChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="orthophony">الأرطوفونيا والتخاطب (Orthophonie)</option>
                        <option value="psychology">علم النفس العيادي (CBT Psychology)</option>
                        <option value="psychomotricite">التأهيل النفسي الحركي (Psychomotricité)</option>
                      </select>
                    </div>
                  </div>

                  {/* Titles */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">عنوان التمرين / الكراس بالعربية *</label>
                    <input
                      type="text"
                      required
                      value={formData.title_ar}
                      onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                      placeholder="مثال: بروتوكول تصحيح وتثبيت مخرج صوت الراء /r/"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">العنوان باللغة الفرنسية (اختياري)</label>
                    <input
                      type="text"
                      value={formData.title_fr}
                      onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
                      placeholder="Protocole de Correction & Stabilisation..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">المجال السريري / التصنيف *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          const catId = e.target.value;
                          const found = EXERCISE_CATEGORIES.find((c) => c.id === catId);
                          setFormData({
                            ...formData,
                            category: catId,
                            category_label: found ? found.label : catId,
                          });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        {EXERCISE_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Badge */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">شارة مميزة (Badge Icon)</label>
                      <input
                        type="text"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        placeholder="مخارج الحروف 🗣️"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Target Group */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">الفئة المستهدفة</label>
                      <input
                        type="text"
                        value={formData.target_group}
                        onChange={(e) => setFormData({ ...formData, target_group: e.target.value })}
                        placeholder="الأطفال (4-12 سنة)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">درجة الصعوبة</label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="تأسيسي">تأسيسي / مبتدئ</option>
                        <option value="متوسط">متوسط</option>
                        <option value="متقدم">متقدم</option>
                      </select>
                    </div>

                    {/* Duration */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">المدة المقدرة</label>
                      <input
                        type="text"
                        value={formData.estimated_duration}
                        onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                        placeholder="10 - 15 دقيقة يومياً"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Plan & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">أدنى باقة اشتراك مطلوبة</label>
                      <select
                        value={formData.minimum_plan_required}
                        onChange={(e) => setFormData({ ...formData, minimum_plan_required: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="starter">الباقة الأساسية (Starter)</option>
                        <option value="pro">الباقة الاحترافية (Pro)</option>
                        <option value="enterprise">باقة المراكز (Enterprise)</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-3 space-x-reverse pt-6">
                      <input
                        type="checkbox"
                        id="is_globally_enabled"
                        checked={formData.is_globally_enabled}
                        onChange={(e) => setFormData({ ...formData, is_globally_enabled: e.target.checked })}
                        className="w-4 h-4 rounded text-teal-600 bg-slate-950 border-slate-800 focus:ring-teal-500"
                      />
                      <label htmlFor="is_globally_enabled" className="text-xs font-bold text-slate-200 cursor-pointer">
                        تفعيل التمرين وإتاحته فوراً لجميع عيادات المنصة
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STEPS & SUMMARY */}
              {activeFormTab === 'steps' && (
                <div className="space-y-5">
                  {/* Summary */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">ملخص الأهداف السريرية والمنهجية</label>
                    <textarea
                      rows={2}
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="برنامج منهجي لتعديل مخرج صوت الراء وتدريب ارتكاز ذروة اللسان..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Step by Step Instructions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        الخطوات الإرشادية للمريض أو الولي (خطوة بخطوة)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddInstructionStep}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة خطوة</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formData.instructions.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 text-center text-xs font-mono text-slate-500 font-bold">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={step}
                            onChange={(e) => handleUpdateInstructionStep(idx, e.target.value)}
                            placeholder={`نص الخطوة ${idx + 1}...`}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                          />
                          {formData.instructions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveInstructionStep(idx)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition"
                              title="حذف هذه الخطوة"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Homework Tips */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      إرشادات وتوجيهات المرافقة المنزلية (للأولياء والمعالج)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.homework_tips}
                      onChange={(e) => setFormData({ ...formData, homework_tips: e.target.value })}
                      placeholder="يُفضل ممارسة التمرين مرتين يومياً لمدة 10 دقائق بعد الوجبات وتجنب لوم الطفل..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: WORKSHEET CONTENT JSON */}
              {activeFormTab === 'worksheet' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-300">
                        محتوى الكراس وقوائم التمارين (Structured JSON Payload)
                      </label>
                      <p className="text-[11px] text-slate-400">
                        يمكنك إضافة قوائم الكلمات، الجمل، حركات البراكسيز، جداول CBT، أو شبكات التوجه المكاني.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const obj = JSON.parse(formData.worksheet_content_json);
                          setFormData({ ...formData, worksheet_content_json: JSON.stringify(obj, null, 2) });
                          alert('تم التحقق من صحة JSON وتنسيقه بنجاح! ✅');
                        } catch (err) {
                          alert('خطأ في تركيب JSON: ' + err.message);
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                    >
                      فحص وتنسيق JSON 🛠️
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    value={formData.worksheet_content_json}
                    onChange={(e) => setFormData({ ...formData, worksheet_content_json: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-teal-300 focus:outline-none focus:border-teal-500 leading-relaxed scrollbar-thin"
                    dir="ltr"
                  />
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {editingExercise ? 'تعديل سجل قائم' : 'إضافة سجل جديد بالكامل'}
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-teal-500/25 transition flex items-center space-x-2 space-x-reverse disabled:opacity-50"
                  >
                    {formSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري الحفظ...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{editingExercise ? 'حفظ التعديلات' : 'إضافة التمرين الآن'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXERCISE FULL CLINICAL PREVIEW                                     */}
      {/* ========================================================================= */}
      {previewExercise && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 space-x-reverse ${getSpecialtyBadgeColor(
                    previewExercise.specialty
                  )}`}
                >
                  {getSpecialtyIcon(previewExercise.specialty)}
                  <span>{previewExercise.specialty_label || previewExercise.specialty}</span>
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">{previewExercise.title_ar}</h3>
                {previewExercise.title_fr && (
                  <p className="text-xs text-slate-400 font-sans italic">{previewExercise.title_fr}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setPreviewExercise(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
              {/* Badges Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block">الرمز:</span>
                  <span className="font-mono font-bold text-teal-400">{previewExercise.exercise_code}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الفئة:</span>
                  <span className="font-bold text-slate-300">{previewExercise.target_group || 'عام'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">المدة:</span>
                  <span className="font-bold text-slate-300">{previewExercise.estimated_duration || '15 دقيقة'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الصعوبة:</span>
                  <span className="font-bold text-slate-300">{previewExercise.difficulty || 'متوسط'}</span>
                </div>
              </div>

              {/* Summary */}
              {previewExercise.summary && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-400 text-[11px]">🎯 الأهداف السريرية:</h4>
                  <p className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 leading-relaxed text-slate-300">
                    {previewExercise.summary}
                  </p>
                </div>
              )}

              {/* Instructions */}
              {Array.isArray(previewExercise.instructions) && previewExercise.instructions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-400 text-[11px]">📋 الخطوات الإرشادية للمريض:</h4>
                  <div className="space-y-1.5">
                    {previewExercise.instructions.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-start space-x-2 space-x-reverse"
                      >
                        <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Worksheet Raw Content */}
              {previewExercise.worksheet_content && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-400 text-[11px]">📝 محتوى ورقة العمل والكراس:</h4>
                  <pre
                    dir="ltr"
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-teal-300 overflow-x-auto max-h-56 scrollbar-thin"
                  >
                    {JSON.stringify(previewExercise.worksheet_content, null, 2)}
                  </pre>
                </div>
              )}

              {/* Homework Tips */}
              {previewExercise.homework_tips && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 leading-relaxed">
                  <p className="font-bold mb-1 flex items-center space-x-1.5 space-x-reverse">
                    <span>💡 إرشادات الأولياء والواجب المنزلي:</span>
                  </p>
                  <p>{previewExercise.homework_tips}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewExercise(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION                                                */}
      {/* ========================================================================= */}
      {deleteConfirmExercise && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-white">تأكيد حذف التمرين من البنك المركزي</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف التمرين:
                <br />
                <span className="font-bold text-rose-300">
                  [{deleteConfirmExercise.exercise_code}] {deleteConfirmExercise.title_ar}
                </span>
                ؟
                <br />
                لن يتمكن المعالجون من اختياره أو إسناده لمرضاهم بعد الآن.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 space-x-reverse pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmExercise(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition flex items-center space-x-1.5 space-x-reverse"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تأكيد الحذف النهائي</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
