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
  Info,
  Eye,
  Download,
  ListChecks,
  FileText,
  Activity,
  Tag,
  HelpCircle,
  Flame,
  CheckSquare,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  ListPlus,
  PlusCircle,
  Copy,
  LayoutGrid
} from 'lucide-react';
import { superAdminApi } from '../../api';
import { getTestQuestionsDefinition, PSYCHOLOGICAL_QUESTIONS_BANK } from '../therapy/PsychologicalQuestionsData';
import InteractiveTestPassationModal from '../therapy/InteractiveTestPassationModal';

export default function AssessmentsCatalogManagerTab() {
  const [tests, setTests] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeScorerTest, setActiveScorerTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'enabled' | 'disabled'
  const [featureFilter, setFeatureFilter] = useState('all'); // 'all' | 'gold' | 'red_alert' | 'clinician' | 'self'
  const [planFilter, setPlanFilter] = useState('all'); // 'all' | 'solo_starter' | 'pro_clinic' | 'enterprise_hospital'

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('basic'); // 'basic' | 'questions' | 'scoring' | 'access'
  const [editingTest, setEditingTest] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Preview Modal State (Questions & Passation Sheet Preview)
  const [previewModalTest, setPreviewModalTest] = useState(null);

  // Delete Confirm Modal State
  const [deleteConfirmTest, setDeleteConfirmTest] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Default Standard Options
  const DEFAULT_OPTIONS_LIKERT4 = [
    { score: 0, text: 'إطلاقاً (0)' },
    { score: 1, text: 'لعدة أيام (1)' },
    { score: 2, text: 'أكثر من نصف الأيام (2)' },
    { score: 3, text: 'كل يوم تقريباً (3)' },
  ];

  const DEFAULT_SEVERITY_RULES = [
    { min: 0, max: 4, label: 'طبيعي / في حده الأدنى (Minimal/Normal)', level: 'normal', color: 'emerald', advice: 'المؤشرات مستقرة ضمن الحدود الطبيعية.' },
    { min: 5, max: 9, label: 'درجة خفيفة (Mild)', level: 'mild', color: 'blue', advice: 'يوصى بالدعم الإرشادي والتثقيف النفسي ومتابعة التطور.' },
    { min: 10, max: 14, label: 'درجة متوسطة (Moderate)', level: 'moderate', color: 'amber', advice: 'يستدعي تدخلاً عيادياً مخصصاً وجلسات علاجية مستهدفة.' },
    { min: 15, max: 30, label: 'درجة حادة وشديدة (Severe)', level: 'critical', color: 'red', advice: 'تدخل سريري فوري ومكثف مع تقييم المخاطر والمتابعة الحثيثة.' },
  ];

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
    source: 'معيار جامعي وعيادي مقنن 🇩🇿',
    cutoff: '',
    dimensions: '',
    description: '',
    instruction: '',
    is_gold_standard: false,
    has_red_alert: false,
    clinician_only: false,
    self_administered: true,
    standard_options: DEFAULT_OPTIONS_LIKERT4,
    questions: [],
    severity_rules: DEFAULT_SEVERITY_RULES,
  });

  const categories = [
    { id: 'all', label: '🌟 كافة التخصصات والروائز' },
    { id: 'orthophonie', label: '🗣️ النطق والأرطوفونيا' },
    { id: 'psychologie', label: '🧠 علم النفس والشخصية' },
    { id: 'psychiatry', label: '🩺 الطب النفسي والصحة العقلية' },
    { id: 'neuropsychology', label: '🔬 النيوروبسيكولوجيا والانتباه' },
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

  // Client-side feature & plan filtering
  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      const np = test.norms_payload || {};
      const code = (test.test_code || '').toUpperCase();
      const isGold = np.is_gold_standard || ['PHQ-9', 'GAD-7', 'WISC-V', 'CARS-2', 'BDI-II', 'HAM-D', 'HAM-A', 'DASS-21', 'M-CHAT'].includes(code);
      const hasRed = np.has_red_alert || ['PHQ-9', 'BDI-II', 'HAM-D'].includes(code);
      const isClinician = np.clinician_only || ['HAM-D', 'HAM-A', 'CARS-2', 'Y-BOCS', 'M-CHAT', 'WISC-V', 'DO80'].includes(code);

      const hasSmartScorer = /MMPI|WISC|WAIS|WPPSI|STROOP|REY|ZAREKI|RORSCHACH|TAT|NEMI|EDEI|COLUMB/i.test(code);

      if (featureFilter === 'smart_scorer' && !hasSmartScorer) return false;
      if (featureFilter === 'gold' && !isGold) return false;
      if (featureFilter === 'red_alert' && !hasRed) return false;
      if (featureFilter === 'clinician' && !isClinician) return false;
      if (featureFilter === 'self' && isClinician) return false;

      if (planFilter !== 'all') {
        const requiredPlan = test.minimum_plan_required || 'solo_starter';
        if (planFilter !== requiredPlan) return false;
      }

      return true;
    });
  }, [tests, featureFilter, planFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTests();
  };

  const handleOpenAddModal = () => {
    setEditingTest(null);
    setActiveModalTab('basic');
    setFormData({
      test_code: '',
      name_ar: '',
      name_fr: '',
      category: 'orthophonie',
      minimum_plan_required: 'solo_starter',
      is_globally_enabled: true,
      age_range: '',
      duration: '',
      source: 'معيار جامعي وعيادي مقنن 🇩🇿',
      cutoff: '',
      dimensions: '',
      description: '',
      instruction: 'يرجى قراءة كل بند واختيار الدرجة أو الاستجابة الأنسب وفق ما شعرت به مؤخراً:',
      is_gold_standard: false,
      has_red_alert: false,
      clinician_only: false,
      self_administered: true,
      standard_options: DEFAULT_OPTIONS_LIKERT4,
      questions: [
        { id: 1, text: '', isRedAlert: false },
        { id: 2, text: '', isRedAlert: false },
        { id: 3, text: '', isRedAlert: false },
      ],
      severity_rules: DEFAULT_SEVERITY_RULES,
    });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (test) => {
    setEditingTest(test);
    setActiveModalTab('basic');
    const np = test.norms_payload || {};
    const code = (test.test_code || '').toUpperCase();
    
    // Check if test has questions in DB, or fallback to predefined definition
    let loadedQuestions = np.questions || [];
    let loadedOptions = np.standard_options || DEFAULT_OPTIONS_LIKERT4;
    let loadedSeverity = np.severity_rules || DEFAULT_SEVERITY_RULES;
    let loadedInstruction = np.instruction || test.description || '';

    if (loadedQuestions.length === 0) {
      const def = getTestQuestionsDefinition(test);
      if (def && def.items && def.items.length > 0) {
        loadedQuestions = def.items.map(it => ({
          id: it.id,
          text: it.title || it.text || it.textAr || '',
          isRedAlert: def.criticalItems?.includes(it.id) || Boolean(it.isRedAlert),
          options: it.options || null,
        }));
        if (def.standardOptions) loadedOptions = def.standardOptions;
        if (def.instruction) loadedInstruction = def.instruction;
      }
    }

    setFormData({
      test_code: test.test_code || '',
      name_ar: test.name_ar || '',
      name_fr: test.name_fr || '',
      category: test.category || 'orthophonie',
      minimum_plan_required: test.minimum_plan_required || 'solo_starter',
      is_globally_enabled: test.is_globally_enabled ?? true,
      age_range: np.age_range || '',
      duration: np.duration || '',
      source: np.source || 'معيار جامعي وعيادي مقنن 🇩🇿',
      cutoff: np.cutoff || '',
      dimensions: Array.isArray(np.dimensions) ? np.dimensions.join(', ') : (np.dimensions || ''),
      description: test.description || '',
      instruction: loadedInstruction,
      is_gold_standard: np.is_gold_standard ?? ['PHQ-9', 'GAD-7', 'WISC-V', 'CARS-2', 'BDI-II', 'HAM-D', 'HAM-A', 'DASS-21'].includes(code),
      has_red_alert: np.has_red_alert ?? loadedQuestions.some(q => q.isRedAlert),
      clinician_only: np.clinician_only ?? ['HAM-D', 'HAM-A', 'CARS-2', 'Y-BOCS', 'M-CHAT'].includes(code),
      self_administered: np.self_administered ?? true,
      standard_options: loadedOptions,
      questions: loadedQuestions,
      severity_rules: loadedSeverity,
    });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  // Question Management Helpers
  const handleAddQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        { id: prev.questions.length + 1, text: '', isRedAlert: false }
      ]
    }));
  };

  const handleRemoveQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index).map((q, idx) => ({ ...q, id: idx + 1 }))
    }));
  };

  const handleUpdateQuestion = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  // Scale Options Template Helpers
  const handleApplyScaleTemplate = (templateType) => {
    let opts = DEFAULT_OPTIONS_LIKERT4;
    if (templateType === 'likert5') {
      opts = [
        { score: 0, text: 'أبداً (0)' },
        { score: 1, text: 'نادراً (1)' },
        { score: 2, text: 'أحياناً (2)' },
        { score: 3, text: 'غالباً (3)' },
        { score: 4, text: 'دائماً (4)' },
      ];
    } else if (templateType === 'yesno') {
      opts = [
        { score: 0, text: 'لا (0)' },
        { score: 1, text: 'نعم (1)' },
      ];
    } else if (templateType === 'yesno_reverse') {
      opts = [
        { score: 1, text: 'لا (1)' },
        { score: 0, text: 'نعم (0)' },
      ];
    } else if (templateType === 'frequency3') {
      opts = [
        { score: 0, text: 'لا ينطبق إطلاقاً (0)' },
        { score: 1, text: 'ينطبق جزئياً (1)' },
        { score: 2, text: 'ينطبق تماماً (2)' },
      ];
    }
    setFormData(prev => ({ ...prev, standard_options: opts }));
  };

  // Severity Rules Management Helpers
  const handleAddSeverityRule = () => {
    const lastRule = formData.severity_rules[formData.severity_rules.length - 1];
    const newMin = lastRule ? Number(lastRule.max) + 1 : 0;
    setFormData(prev => ({
      ...prev,
      severity_rules: [
        ...prev.severity_rules,
        { min: newMin, max: newMin + 5, label: 'مستوى سريري إضافي', level: 'moderate', color: 'amber', advice: 'متابعة عيادية' }
      ]
    }));
  };

  const handleRemoveSeverityRule = (index) => {
    setFormData(prev => ({
      ...prev,
      severity_rules: prev.severity_rules.filter((_, idx) => idx !== index)
    }));
  };

  const handleUpdateSeverityRule = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.severity_rules];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, severity_rules: updated };
    });
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
      
      const cleanQuestions = formData.questions
        .filter(q => q.text && q.text.trim())
        .map((q, idx) => ({
          id: idx + 1,
          text: q.text.trim(),
          isRedAlert: Boolean(q.isRedAlert),
          options: q.options || undefined
        }));

      const hasRedAlertFlag = Boolean(formData.has_red_alert || cleanQuestions.some(q => q.isRedAlert));

      // Calculate max score
      const maxScorePerItem = Math.max(...formData.standard_options.map(o => Number(o.score) || 0));
      const computedMaxScore = cleanQuestions.length > 0 ? cleanQuestions.length * maxScorePerItem : 30;

      // Format cutoff text automatically if left blank
      let computedCutoff = formData.cutoff.trim();
      if (!computedCutoff && formData.severity_rules.length > 0) {
        computedCutoff = formData.severity_rules
          .map(r => `${r.label}: ${r.min}-${r.max}`)
          .join(' | ');
      }

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
          cutoff: computedCutoff,
          instruction: formData.instruction.trim(),
          dimensions: formData.dimensions.split(',').map(d => d.trim()).filter(Boolean),
          is_gold_standard: Boolean(formData.is_gold_standard),
          has_red_alert: hasRedAlertFlag,
          clinician_only: Boolean(formData.clinician_only),
          self_administered: Boolean(formData.self_administered),
          questions: cleanQuestions,
          standard_options: formData.standard_options,
          severity_rules: formData.severity_rules,
          max_score: computedMaxScore,
        }
      };

      if (editingTest) {
        await superAdminApi.updateTestConfig(editingTest.test_code, payload);
        setFormSuccess('تم تحديث بيانات المقياس وبنك الأسئلة بنجاح!');
      } else {
        await superAdminApi.createTestConfig(payload);
        setFormSuccess('تمت إضافة المقياس المعياري وبنك أسئلته بنجاح!');
      }

      setTimeout(() => {
        setModalOpen(false);
        fetchTests();
      }, 900);
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
    if (!window.confirm('هل تريد مزامنة وتحديث كافة الروائز والمقاييس من الكتالوج المركزي المعتمد؟ سيتم تحديث وتثبيت كافة المقاييس الـ 125+ المعيارية دون التأثير على أي مقاييس مخصصة أضفتها.')) {
      return;
    }
    try {
      setSyncing(true);
      setSyncMessage('');
      const res = await superAdminApi.syncDefaultTestsCatalog();
      if (res && res.success) {
        setSyncMessage(res.message);
        fetchTests();
        setTimeout(() => setSyncMessage(''), 6000);
      }
    } catch (err) {
      alert(err.message || 'فشل مزامنة الروائز.');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportCatalog = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tests, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `clinical_tests_catalog_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Helper for Category Label
  const getCategoryBadgeLabel = (cat) => {
    const c = String(cat || '').toLowerCase();
    if (c.includes('ortho') || c.includes('speech')) return '🗣️ أرطوفونيا ولغة';
    if (c.includes('psychiatry') || c.includes('psychiatrie') || c.includes('mental')) return '🩺 طب نفسي';
    if (c.includes('neuro') || c.includes('cogni')) return '🔬 نيوروبسيكولوجي';
    if (c.includes('psychol')) return '🧠 علم نفس وسلوك';
    if (c.includes('autis') || c.includes('tsa')) return '🧩 طيف التوحد';
    if (c.includes('intell') || c.includes('wisc')) return '💡 ذكاء وقدرات';
    if (c.includes('tdah') || c.includes('adhd') || c.includes('learn')) return '⚡ فرط حركة وتعلم';
    if (c.includes('motric')) return '🏃 نفسي-حركي';
    return cat || 'عام';
  };

  const getPlanBadge = (plan) => {
    if (plan === 'enterprise_hospital') {
      return { text: '🏥 باقة المستشفيات والمراكز', bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
    }
    if (plan === 'pro_clinic') {
      return { text: '💼 باقة العيادة الاحترافية', bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' };
    }
    return { text: '🌟 الباقة الأساسية', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>SUPER ADMIN CLINICAL ENGINE</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                +125 مقياساً ورائزاً سريرياً معتمداً 🌟
              </span>
              <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>محرر الأسئلة وسلالم التصحيح الفوري</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              إدارة بنك المقاييس، الروائز والبروتوكولات السريرية
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              تحكم مركزي شامل: إضافة وتعديل أسئلة المقاييس، تحديد خيارات الإجابة وسلم الدرجات، برمجة عتبات التصنيف والشدة السريرية، وتعيين باقات الوصول للعيادات.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleExportCatalog}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse border border-slate-700 shadow"
              title="تصدير نسخة احتياطية لكافة المقاييس بصيغة JSON"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>تصدير JSON</span>
            </button>

            <button
              type="button"
              onClick={handleSyncDefaults}
              disabled={syncing}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse border border-slate-700 shadow disabled:opacity-50"
              title="مزامنة وتحديث كافة الروائز المعيارية من الكتالوج المركزي"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-400 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'جاري المزامنة...' : 'مزامنة الكتالوج المركزي'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة وبناء مقياس جديد +</span>
            </button>
          </div>
        </div>

        {/* Sync Success Alert */}
        {syncMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Quick KPI Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2 border-t border-slate-800/80">
            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-2xl text-center space-y-0.5">
              <div className="text-[10px] text-slate-400 font-bold">إجمالي الروائز</div>
              <div className="text-lg font-black text-white font-mono">{stats.total_tests}</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-2xl text-center space-y-0.5">
              <div className="text-[10px] text-emerald-400 font-bold">المقاييس المفعلة</div>
              <div className="text-lg font-black text-emerald-400 font-mono">{stats.enabled_tests}</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-2xl text-center space-y-0.5">
              <div className="text-[10px] text-rose-400 font-bold">الطب النفسي</div>
              <div className="text-lg font-black text-rose-400 font-mono">{stats.psychiatry_tests || 0}</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-2xl text-center space-y-0.5">
              <div className="text-[10px] text-cyan-400 font-bold">النيوروبسيكولوجي</div>
              <div className="text-lg font-black text-cyan-400 font-mono">{stats.neuropsychology_tests || 0}</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-2xl text-center space-y-0.5">
              <div className="text-[10px] text-teal-400 font-bold">النطق والأرطوفونيا</div>
              <div className="text-lg font-black text-teal-400 font-mono">{stats.orthophonie_tests || 0}</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-2xl text-center space-y-0.5">
              <div className="text-[10px] text-purple-400 font-bold">علم النفس والشخصية</div>
              <div className="text-lg font-black text-purple-400 font-mono">{stats.psychologie_tests || 0}</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-2xl text-center space-y-0.5">
              <div className="text-[10px] text-pink-400 font-bold">طيف التوحد TSA</div>
              <div className="text-lg font-black text-pink-400 font-mono">{stats.autisme_tests || 0}</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-2xl text-center space-y-0.5">
              <div className="text-[10px] text-indigo-400 font-bold">الذكاء والقدرات IQ</div>
              <div className="text-lg font-black text-indigo-400 font-mono">{stats.intelligence_tests || 0}</div>
            </div>
            <div className="bg-slate-950/70 border border-emerald-500/30 p-2.5 rounded-2xl text-center space-y-0.5">
              <div className="text-[10px] text-emerald-400 font-bold">مصححات ذكية 🎯</div>
              <div className="text-lg font-black text-emerald-400 font-mono">
                {tests.filter(t => /MMPI|WISC|WAIS|WPPSI|STROOP|REY|ZAREKI|RORSCHACH|TAT|NEMI|EDEI|COLUMB/i.test(t.test_code || '')).length || 8}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-6">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برمز المقياس (PHQ-9, HAM-D, GAD-7...)، الاسم بالعربية أو الفرنسية، أو التشخيص..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة الحالات (مفعل ومعطل)</option>
              <option value="enabled">🟢 المقاييس المفعلة فقط</option>
              <option value="disabled">🔴 المقاييس المعطلة فقط</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={featureFilter}
              onChange={(e) => setFeatureFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة الخصائص السريرية</option>
              <option value="smart_scorer">🎯 المصححات الرقمية (Smart Scorers)</option>
              <option value="gold">⭐ المعايير الذهبية (Gold)</option>
              <option value="red_alert">🚨 تنبيهات أمان (Red Alert)</option>
              <option value="clinician">🩺 فحص إكلينيكي (أخصائي)</option>
              <option value="self">📱 تقرير ذاتي (مريض)</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة الباقات</option>
              <option value="solo_starter">🌟 الباقة الأساسية</option>
              <option value="pro_clinic">💼 الباقة الاحترافية</option>
              <option value="enterprise_hospital">🏥 باقة المستشفيات</option>
            </select>
          </div>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
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
      ) : filteredTests.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
          <Database className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-slate-300">لم يتم العثور على أي مقاييس تطابق معايير البحث.</div>
          <p className="text-xs text-slate-500">يمكنك تعديل خيارات الفلترة أو الضغط على "مزامنة الكتالوج المركزي" لتحميل الكتالوج المعتمد كاملاً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map((test) => {
            const np = test.norms_payload || {};
            const code = (test.test_code || '').toUpperCase();
            const isGold = np.is_gold_standard || ['PHQ-9', 'GAD-7', 'WISC-V', 'CARS-2', 'BDI-II', 'HAM-D', 'HAM-A', 'DASS-21', 'M-CHAT'].includes(code);
            const hasRed = np.has_red_alert || ['PHQ-9', 'BDI-II', 'HAM-D'].includes(code);
            const isClinician = np.clinician_only || ['HAM-D', 'HAM-A', 'CARS-2', 'Y-BOCS', 'M-CHAT', 'WISC-V', 'DO80'].includes(code);
            const planBadge = getPlanBadge(test.minimum_plan_required);

            return (
              <div
                key={test.id}
                className={`bg-slate-900 border rounded-3xl p-5 space-y-4 shadow-xl transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden ${
                  test.is_globally_enabled ? 'border-slate-800 hover:border-indigo-500/50' : 'border-red-500/20 bg-slate-950/90 opacity-75'
                }`}
              >
                {/* Accent Top Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  test.is_globally_enabled ? (hasRed ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600') : 'bg-red-500'
                }`} />

                <div className="space-y-3">
                  {/* Top Badges and Code */}
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-black bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            {test.test_code}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
                            {getCategoryBadgeLabel(test.category)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
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

                  {/* Title & Foreign Name */}
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

                  {/* Clinical Characteristics Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {hasRed && (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-400" />
                        <span>إنذار أمان فوري</span>
                      </span>
                    )}
                    {isGold && (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        <span>معيار ذهبي عالمي</span>
                      </span>
                    )}
                    {isClinician ? (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-purple-400" />
                        <span>تقييم أخصائي</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                        <User className="w-3 h-3 text-sky-400" />
                        <span>تطبيق ذاتي</span>
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${planBadge.bg}`}>
                      {planBadge.text}
                    </span>
                  </div>

                  {test.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>
                  )}

                  {/* Norms & Info Snippets */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                    {np.age_range && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><User className="w-3 h-3 text-indigo-400" /> الفئة:</span>
                        <strong className="text-slate-200">{np.age_range}</strong>
                      </div>
                    )}
                    {np.duration && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-emerald-400" /> المدة:</span>
                        <strong className="text-slate-200">{np.duration}</strong>
                      </div>
                    )}
                    {np.source && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Award className="w-3 h-3 text-amber-400" /> المصدر:</span>
                        <strong className="text-amber-300 line-clamp-1">{np.source}</strong>
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
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  {/MMPI|WISC|WAIS|WPPSI|STROOP|REY|ZAREKI|RORSCHACH|TAT|NEMI|EDEI|COLUMB/i.test(code) && (
                    <button
                      type="button"
                      onClick={() => setActiveScorerTest(test)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-[0.99]"
                      title="تشغيل ومعاينة المصحح الرقمي التفاعلي مباشرة"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>تشغيل المصحح الرقمي التفاعلي 🎯</span>
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewModalTest(test)}
                      className="flex-1 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center justify-center space-x-1.5 space-x-reverse"
                      title="معاينة بنود الاختبار، خيارات الإجابة، وسلالم الدرجات"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>معاينة البنود</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(test)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center"
                      title="تعديل وتصحيح المعايير والأسئلة"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmTest(test)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                      title="حذف المقياس نهائياً"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. INTERACTIVE QUESTIONS & PASSATION PREVIEW MODAL                         */}
      {/* ========================================================================= */}
      {previewModalTest && (() => {
        const testCode = (previewModalTest.test_code || '').toUpperCase();
        const np = previewModalTest.norms_payload || {};
        const testDef = getTestQuestionsDefinition(previewModalTest);
        const hasQuestions = Boolean(testDef && testDef.items && testDef.items.length > 0);
        const hasRedAlert = Boolean(
          testDef?.criticalItems?.length > 0 ||
          testDef?.hasRedAlert ||
          np.has_red_alert ||
          ['PHQ-9', 'BDI-II', 'HAM-D'].includes(testCode)
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative text-right max-h-[92vh] overflow-y-auto my-6">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4 gap-3">
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shrink-0 mt-0.5">
                    <ListChecks className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {testCode}
                      </span>
                      <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
                        {getCategoryBadgeLabel(previewModalTest.category)}
                      </span>
                      {hasRedAlert && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                          <span>بند أمان حرج (Red Alert)</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white">
                      {previewModalTest.name_ar}
                    </h3>
                    {previewModalTest.name_fr && (
                      <p className="text-xs font-mono text-slate-400">{previewModalTest.name_fr}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewModalTest(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Red Alert Banner if applicable */}
              {hasRedAlert && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs font-bold space-y-1">
                  <div className="flex items-center gap-2 text-rose-300 font-black">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>تنبيه أمان وسرية إكلينيكية عاجلة (Safety Red Alert):</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-rose-300/90 pr-6">
                    يتضمن هذا المقياس بنداً فرزياً للأفكار الانتحارية أو إيذاء النفس (مثل البند 9 في PHQ-9 و BDI-II أو البند 3 في HAM-D). عند تسجيل درجة إيجابية من المريض، تصدر المنصة إشعاراً أحمر عاجلاً للأخصائي المشرف لاتخاذ البروتوكول الحمائي فوراً.
                  </p>
                </div>
              )}

              {/* General Test Specs Pill Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">الفئة العمرية:</span>
                  <strong className="text-slate-200">{np.age_range || 'كافة الفئات'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">مدة التطبيق:</span>
                  <strong className="text-slate-200">{np.duration || '10 - 20 دقيقة'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">طريقة التطبيق:</span>
                  <strong className="text-indigo-300">
                    {np.clinician_only ? '🩺 مقابلة سريرية (أخصائي)' : '📱 تطبيق ذاتي (مريض/تابلت)'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">الحد الأدنى للباقة:</span>
                  <strong className="text-emerald-400">{getPlanBadge(previewModalTest.minimum_plan_required).text}</strong>
                </div>
              </div>

              {/* Instructions */}
              {testDef?.instruction && (
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs leading-relaxed">
                  <strong className="text-indigo-300 block mb-1">تعليمات وتوجيهات التمرير:</strong>
                  {testDef.instruction}
                </div>
              )}

              {/* Items / Questions List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-indigo-400" />
                    <span>بنود المقياس وسلم الدرجات ({testDef?.items?.length || 0} بنود):</span>
                  </h4>
                  {testDef?.maxScore && (
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-xl">
                      الدرجة القصوى: {testDef.maxScore} نقطة
                    </span>
                  )}
                </div>

                {hasQuestions ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1 pl-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {testDef.items.map((item, idx) => {
                      const isCritical = testDef?.criticalItems?.includes(item.id) || (testCode === 'PHQ-9' && item.id === 9) || (testCode === 'BDI-II' && item.id === 9) || (testCode === 'HAM-D' && item.id === 3);
                      const options = item.options || testDef.standardOptions || [];

                      return (
                        <div
                          key={item.id || idx}
                          className={`p-3.5 rounded-2xl border transition ${
                            isCritical
                              ? 'bg-rose-500/10 border-rose-500/40 text-rose-100'
                              : 'bg-slate-950/80 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="font-bold text-xs text-white leading-relaxed">
                              {item.title || item.textAr || item.text}
                            </div>
                            {isCritical && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                                🚨 بند أمان حرج
                              </span>
                            )}
                          </div>

                          {/* Response Options */}
                          {options.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                              {options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between"
                                >
                                  <span className="line-clamp-1">{opt.text}</span>
                                  <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                    +{opt.score}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <p>
                      هذا الرائز عبارة عن بطارية فحص أو أداة ملاحظة سريرية مباشرة (مثل رائز تفريش الصور، فحص مخارج الأصوات، أو بطاريات الويسك).
                    </p>
                    {np.dimensions && np.dimensions.length > 0 && (
                      <div>
                        <strong className="text-indigo-400 block mb-1">أبعاد ومحاور التقييم المقننة:</strong>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(np.dimensions) ? np.dimensions : np.dimensions.split(',')).map((d, dIdx) => (
                            <span key={dIdx} className="px-2.5 py-1 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 text-[11px]">
                              {d.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cutoffs & Interpretation Section */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-indigo-300">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>معايير القطع وتصنيف الشدة السريرية (Cutoffs & Severity):</span>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  {np.cutoff || 'تصنيف معياري مقنن: طبيعي | خفيف | متوسط | شديد'}
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const t = previewModalTest;
                    setPreviewModalTest(null);
                    handleOpenEditModal(t);
                  }}
                  className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>تعديل معايير وأسئلة المقياس</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewModalTest(null)}
                  className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition"
                >
                  إغلاق المعاينة
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 2. ADVANCED ADD / EDIT TEST & QUESTIONS BUILDER MODAL                      */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative text-right max-h-[94vh] overflow-y-auto my-4">
            
            {/* Modal Top Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  {editingTest ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingTest ? `تعديل وبناء المقياس السريري [${editingTest.test_code}]` : 'إنشاء وبناء مقياس سريري جديد'}
                  </h3>
                  <p className="text-xs text-slate-400">كتابة الأسئلة، تحديد خيارات الإجابة، وبرمجة قواعد الشدة والتصحيح</p>
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

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveModalTab('basic')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeModalTab === 'basic' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. البيانات العامة</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('questions')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeModalTab === 'questions' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>2. بنك الأسئلة والخيارات ({formData.questions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('scoring')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeModalTab === 'scoring' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>3. سلالم الشدة والتصحيح ({formData.severity_rules.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('access')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  activeModalTab === 'access' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>4. الباقات والأمان</span>
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
              
              {/* TAB 1: BASIC INFO */}
              {activeModalTab === 'basic' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">رمز المقياس السريري (Code) *:</label>
                      <input
                        type="text"
                        value={formData.test_code}
                        onChange={(e) => setFormData({ ...formData, test_code: e.target.value })}
                        placeholder="مثال: PHQ-9, BAI, CARS-2"
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
                        <option value="psychiatry">🩺 الطب النفسي والصحة العقلية (Psychiatrie)</option>
                        <option value="neuropsychology">🔬 النيوروبسيكولوجيا والانتباه (Neuropsychology)</option>
                        <option value="autisme">🧩 طيف التوحد (Autisme TSA)</option>
                        <option value="intelligence">💡 الذكاء والقدرات (Intelligence IQ)</option>
                        <option value="tdah_apprentissage">⚡ فرط الحركة وصعوبات التعلم (TDAH)</option>
                        <option value="psychomotricite">🏃 النفسي-حركي والتوازن (Psychomotricité)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">الحد الأدنى للباقة المؤهلة *:</label>
                      <select
                        value={formData.minimum_plan_required}
                        onChange={(e) => setFormData({ ...formData, minimum_plan_required: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="solo_starter">🌟 الباقة الأساسية (متاح للجميع)</option>
                        <option value="pro_clinic">💼 باقة العيادة الاحترافية (Pro)</option>
                        <option value="enterprise_hospital">🏥 باقة المراكز والمستشفيات (Enterprise)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">الاسم والتعريب السريري بالعربية *:</label>
                    <input
                      type="text"
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      placeholder="مثال: مقياس بيك للقلق الشامل (BAI)"
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
                      placeholder="مثال: Beck Anxiety Inventory (BAI)"
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
                        placeholder="مثال: 12 سنة فما فوق"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">مدة التطبيق التقديرية:</label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="مثال: 5 - 10 دقائق"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">جهة التقنين والاعتماد:</label>
                      <input
                        type="text"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        placeholder="مثال: معيار جامعي مقنن أو المعيار العالمي WHO"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">تعليمات وتوجيهات التمرير للمريض / الأخصائي:</label>
                    <textarea
                      rows={2}
                      value={formData.instruction}
                      onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                      placeholder="نص التوجيهات الذي يظهر في بداية الاختبار للمريض..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">الوصف السريري والإكلينيكي:</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="وصف مختصر للهدف السريري من الرائز وطريقة تطبيقه..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: QUESTIONS & ITEMS BUILDER */}
              {activeModalTab === 'questions' && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Quick Scale Presets Bar */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>قوالب سلم الإجابات والدرجات الموحد:</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplyScaleTemplate('likert4')}
                          className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 transition"
                        >
                          ليكرت 4 (0-3)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyScaleTemplate('likert5')}
                          className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 transition"
                        >
                          ليكرت 5 (0-4)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyScaleTemplate('yesno')}
                          className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 transition"
                        >
                          نعم / لا (0-1)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyScaleTemplate('frequency3')}
                          className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 transition"
                        >
                          ثلاثي (0-2)
                        </button>
                      </div>
                    </div>

                    {/* Display current standard options */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
                      {formData.standard_options.map((opt, oIdx) => (
                        <div key={oIdx} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between">
                          <span className="text-slate-300 font-bold truncate">{opt.text}</span>
                          <span className="font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">+{opt.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions List Header */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-black text-white">قائمة بنود وأسئلة الاختبار ({formData.questions.length}):</h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>إضافة بند جديد +</span>
                    </button>
                  </div>

                  {/* Questions Cards List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1 pl-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {formData.questions.map((q, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border transition space-y-3 ${
                          q.isRedAlert
                            ? 'bg-rose-500/10 border-rose-500/40'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-black text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={q.text}
                              onChange={(e) => handleUpdateQuestion(idx, 'text', e.target.value)}
                              placeholder={`نص البند ${idx + 1} بالعربية (مثال: الشعور بالحزن واليأس أو ضعف التركيز)...`}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition shrink-0"
                            title="حذف هذا البند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Safety Red Alert Checkbox */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                          <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.isRedAlert}
                              onChange={(e) => handleUpdateQuestion(idx, 'isRedAlert', e.target.checked)}
                              className="rounded bg-slate-800 border-slate-700 text-rose-600 focus:ring-0 w-3.5 h-3.5"
                            />
                            <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-rose-400" />
                              <span>بند أمان حرج (إيذاء النفس / أفكار انتحارية) - يطلق إنذاراً أحمر فورياً للأخصائي</span>
                            </span>
                          </label>

                          <span className="text-[10px] text-slate-500 font-mono">
                            سلم درجات: 0 إلى {Math.max(...formData.standard_options.map(o => o.score))}
                          </span>
                        </div>
                      </div>
                    ))}

                    {formData.questions.length === 0 && (
                      <div className="p-8 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                        <ListPlus className="w-8 h-8 mx-auto text-slate-600" />
                        <p className="text-xs">لم يتم إضافة أي أسئلة بعد. انقر على "إضافة بند جديد" للبدء في كتابة الأسئلة.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SCORING & SEVERITY RULES BUILDER */}
              {activeModalTab === 'scoring' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs space-y-1">
                    <strong className="text-indigo-300 block">طريقة التصحيح الآلي واحتساب النتائج:</strong>
                    <p className="text-[11px] leading-relaxed text-indigo-200/90">
                      يقوم النظام تلقائياً بجمع نقاط إجابات المريض في كل بند، ومقارنة المجموع الكلي مع جدول العتبات أدناه لتحديد مستوى الشدة، اللون البياني، والتوصية السريرية الفورية في تقرير الاختبار.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      <span>جدول عتبات القطع وتصنيف الشدة السريرية ({formData.severity_rules.length} مستويات):</span>
                    </h4>

                    <button
                      type="button"
                      onClick={handleAddSeverityRule}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة مستوى جديد +</span>
                    </button>
                  </div>

                  {/* Severity Rules Editor Table */}
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 pl-1 scrollbar-thin scrollbar-thumb-slate-700">
                    {formData.severity_rules.map((rule, rIdx) => (
                      <div
                        key={rIdx}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                          <div className="sm:col-span-2 flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold shrink-0">من:</span>
                            <input
                              type="number"
                              value={rule.min}
                              onChange={(e) => handleUpdateSeverityRule(rIdx, 'min', e.target.value)}
                              className="w-16 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-center font-mono text-white text-xs focus:outline-none focus:border-indigo-500"
                            />
                            <span className="text-[10px] text-slate-400 font-bold shrink-0">إلى:</span>
                            <input
                              type="number"
                              value={rule.max}
                              onChange={(e) => handleUpdateSeverityRule(rIdx, 'max', e.target.value)}
                              className="w-16 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-center font-mono text-white text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="sm:col-span-5">
                            <input
                              type="text"
                              value={rule.label}
                              onChange={(e) => handleUpdateSeverityRule(rIdx, 'label', e.target.value)}
                              placeholder="المسمى بالعربية (مثال: اكتئاب متوسط / Moderate Depression)"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <select
                              value={rule.color}
                              onChange={(e) => handleUpdateSeverityRule(rIdx, 'color', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="emerald">🟢 طبيعي (أخضر)</option>
                              <option value="blue">🔵 خفيف (أزرق)</option>
                              <option value="amber">🟠 متوسط (برتقالي)</option>
                              <option value="red">🔴 شديد / حرج (أحمر)</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveSeverityRule(rIdx)}
                              className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                              title="حذف هذا المستوى"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Advice Field */}
                        <div className="pt-1">
                          <input
                            type="text"
                            value={rule.advice}
                            onChange={(e) => handleUpdateSeverityRule(rIdx, 'advice', e.target.value)}
                            placeholder="التوجيه والتوصية العلاجية للأخصائي (مثال: جلسات علاج معرفي سلوكي CBT)..."
                            className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 pt-2">
                    <label className="text-xs font-bold text-slate-300">نص معيار القطع السريع (Cutoff String):</label>
                    <input
                      type="text"
                      value={formData.cutoff}
                      onChange={(e) => setFormData({ ...formData, cutoff: e.target.value })}
                      placeholder="اتركه فارغاً ليتم توليده تلقائياً من المستويات أعلاه، أو اكتب صيغة مخصصة..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: ACCESS & SAFETY */}
              {activeModalTab === 'access' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">محاور وأبعاد التقييم (مفصولة بفواصل لرسم المخطط البياني):</label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      placeholder="مثال: المزاج الانفعالي, اضطراب النوم, الطاقة والنشاط, التركيز"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Special Clinical Flags */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_gold_standard}
                        onChange={(e) => setFormData({ ...formData, is_gold_standard: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-amber-300">
                        ⭐ معيار ذهبي عالمي (Gold Standard)
                      </span>
                    </label>

                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_red_alert}
                        onChange={(e) => setFormData({ ...formData, has_red_alert: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-rose-600 focus:ring-0 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-rose-400">
                        🚨 يتضمن بند أمان حرج (Red Alert Safety)
                      </span>
                    </label>

                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.clinician_only}
                        onChange={(e) => setFormData({ ...formData, clinician_only: e.target.checked, self_administered: !e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-0 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-purple-300">
                        🩺 فحص إكلينيكي مخصص للأخصائي حصراً
                      </span>
                    </label>

                    <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_globally_enabled}
                        onChange={(e) => setFormData({ ...formData, is_globally_enabled: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-emerald-400">
                        🟢 تفعيل المقياس وإتاحته فوراً لكافة العيادات
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Modal Bottom Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{formSubmitting ? 'جاري الحفظ...' : (editingTest ? 'تحديث وتثبيت المقياس والأسئلة' : 'حفظ وتثبيت المقياس الجديد')}</span>
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

      {/* ========================================================================= */}
      {/* 3. DELETE CONFIRMATION MODAL                                             */}
      {/* ========================================================================= */}
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
              هل أنت متأكد من رغبتك في حذف المقياس <strong className="text-white">[{deleteConfirmTest.name_ar}]</strong> نهائياً من البنك المركزي؟ لن تتمكن العيادات من تعيينه لمرضى جدد بعد الحذف.
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

      {/* ========================================================================= */}
      {/* 4. SUPER ADMIN LIVE TEST SCORER LAUNCHER MODAL                             */}
      {/* ========================================================================= */}
      {activeScorerTest && (
        <InteractiveTestPassationModal
          test={activeScorerTest}
          onClose={() => setActiveScorerTest(null)}
          onSaved={() => {
            setActiveScorerTest(null);
            fetchTests();
          }}
        />
      )}
    </div>
  );
}
