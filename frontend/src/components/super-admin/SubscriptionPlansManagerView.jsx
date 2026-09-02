import React, { useState, useEffect } from 'react';
import {
  Coins,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Users,
  Building2,
  Star,
  Layers,
  Clock,
  Shield,
  Globe,
  Radio,
  FileText,
  Mic,
  Image as ImageIcon,
  Video,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  DollarSign
} from 'lucide-react';
import { subscriptionPlansApi } from '../../api';

export default function SubscriptionPlansManagerView() {
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialFormState = {
    name_ar: '',
    name_fr: '',
    slug: '',
    description: '',
    price_monthly: 4900,
    price_yearly: 49000,
    currency: 'DZD',
    trial_days: 14,
    max_patients: 250,
    max_staff: 3,
    ai_reports_limit: 60,
    ai_transcribe_mins: 90,
    ai_images_limit: 50,
    ai_podcasts_limit: 5,
    ai_videos_limit: 2,
    has_custom_domain: false,
    has_priority_support: false,
    is_featured: false,
    is_active: true,
    sort_order: 1,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formSection, setFormSection] = useState('general'); // 'general' | 'quotas' | 'ai'

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await subscriptionPlansApi.getPlans();
      if (res && res.plans) {
        setPlans(res.plans);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load subscription plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      ...initialFormState,
      sort_order: plans.length + 1,
    });
    setFormSection('general');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name_ar: plan.name_ar || '',
      name_fr: plan.name_fr || '',
      slug: plan.slug || '',
      description: plan.description || '',
      price_monthly: plan.price_monthly ?? 0,
      price_yearly: plan.price_yearly ?? 0,
      currency: plan.currency || 'DZD',
      trial_days: plan.trial_days ?? 14,
      max_patients: plan.max_patients ?? 500,
      max_staff: plan.max_staff ?? 5,
      ai_reports_limit: plan.ai_reports_limit ?? 100,
      ai_transcribe_mins: plan.ai_transcribe_mins ?? 120,
      ai_images_limit: plan.ai_images_limit ?? 50,
      ai_podcasts_limit: plan.ai_podcasts_limit ?? 5,
      ai_videos_limit: plan.ai_videos_limit ?? 0,
      has_custom_domain: plan.has_custom_domain ?? false,
      has_priority_support: plan.has_priority_support ?? false,
      is_featured: plan.is_featured ?? false,
      is_active: plan.is_active ?? true,
      sort_order: plan.sort_order ?? 0,
    });
    setFormSection('general');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      if (editingPlan) {
        const res = await subscriptionPlansApi.updatePlan(editingPlan.id, formData);
        setFeedback({ type: 'success', text: res.message || 'تم تحديث الباقة بنجاح!' });
      } else {
        const res = await subscriptionPlansApi.createPlan(formData);
        setFeedback({ type: 'success', text: res.message || 'تم إنشاء باقة الاشتراك بنجاح!' });
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      console.error('Plan save error:', err);
      setFeedback({ type: 'error', text: err.response?.data?.message || err.message || 'تعذر حفظ الباقة.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      const res = await subscriptionPlansApi.togglePlanStatus(plan.id);
      setFeedback({ type: 'success', text: res.message || 'تم تعديل حالة الباقة.' });
      fetchPlans();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تغيير الحالة.' });
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف باقة "${plan.name_ar}"؟`)) {
      return;
    }
    try {
      const res = await subscriptionPlansApi.deletePlan(plan.id);
      setFeedback({ type: 'success', text: res.message || 'تم حذف الباقة بنجاح.' });
      fetchPlans();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || err.message || 'تعذر حذف الباقة.' });
    }
  };

  const formatQuota = (val, unit = '') => {
    if (val === -1 || val === '-1') return 'غير محدود ∞';
    return `${Number(val).toLocaleString()} ${unit}`;
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-950 border border-purple-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-purple-400" />
                <span>DYNAMIC PRICING & SUBSCRIPTION TIERS</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {plans.length} باقات مهيأة 🪙
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              إدارة باقات وخطط الاشتراك والأسعار (Pricing Studio)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              تخصيص باقات الاشتراك للعيادات (شهرياً وسنوياً بالدينار DZD)، تحديد الحصص، سعة المرضى، طاقم العمل، وميزات الذكاء الاصطناعي المتاحة لكل فئة.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={fetchPlans}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-xl shadow-purple-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء باقة اشتراك جديدة</span>
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {feedback.text}
          </span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">إجمالي الباقات</div>
            <div className="text-2xl font-black text-white font-mono">{stats?.total_plans ?? plans.length}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">باقات نشطة للاشتراك</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {stats?.active_plans ?? plans.filter(p => p.is_active).length}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">عيادات مشتركة بالباقات</div>
            <div className="text-2xl font-black text-indigo-300 font-mono">
              {stats?.total_subscribed_clinics ?? '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Plans Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {plans.map((plan) => {
          const isFeatured = plan.is_featured;
          const isActive = plan.is_active;
          const clinicsCount = plan.clinics_count ?? 0;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 flex flex-col justify-between space-y-5 transition shadow-2xl relative ${
                isFeatured
                  ? 'bg-gradient-to-b from-indigo-950/80 via-slate-900 to-slate-950 border-2 border-indigo-500 ring-4 ring-indigo-500/20'
                  : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Badges Top Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isFeatured && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex items-center gap-1 shadow">
                      <Star className="w-3 h-3 fill-current" />
                      الأكثر طلباً
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {isActive ? 'نشطة 🟢' : 'معطلة 🔴'}
                  </span>
                </div>

                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                  #{plan.sort_order}
                </span>
              </div>

              {/* Title & Pricing */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-black text-white">{plan.name_ar}</h3>
                  {plan.name_fr && (
                    <span className="text-[11px] font-mono text-indigo-400 block">{plan.name_fr}</span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed min-h-[36px] line-clamp-2">
                  {plan.description || 'باقة متكاملة لإدارة العيادات السريرية والفحوصات التأهيلية.'}
                </p>

                {/* Price Display */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <div className="flex items-baseline space-x-1 space-x-reverse">
                    <span className="text-2xl font-black text-white font-mono">
                      {Number(plan.price_monthly).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">دج / شهر</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono font-bold">
                    {Number(plan.price_yearly).toLocaleString()} دج / سنوياً
                  </div>
                  {plan.trial_days > 0 && (
                    <div className="text-[10px] text-amber-300/90 font-bold flex items-center gap-1 pt-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{plan.trial_days} يوم تجربة مجانية</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quotas & Features Checklist */}
              <div className="space-y-2 text-xs border-t border-slate-800/80 pt-4 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>سعة المرضى:</span>
                  </span>
                  <strong className="font-mono text-white">{formatQuota(plan.max_patients, 'مريض')}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>طاقم العمل:</span>
                  </span>
                  <strong className="font-mono text-white">{formatQuota(plan.max_staff, 'ممارسين')}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    <span>تقارير SOAP (AI):</span>
                  </span>
                  <strong className="font-mono text-purple-300">{formatQuota(plan.ai_reports_limit, 'تقرير')}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-purple-400" />
                    <span>تفريغ صوتي (AI):</span>
                  </span>
                  <strong className="font-mono text-purple-300">{formatQuota(plan.ai_transcribe_mins, 'دقيقة')}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>استوديو PECS:</span>
                  </span>
                  <strong className="font-mono text-purple-300">{formatQuota(plan.ai_images_limit, 'بطاقة')}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span>نطاق مخصص SSL:</span>
                  </span>
                  <span className={plan.has_custom_domain ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                    {plan.has_custom_domain ? 'متاح ✓' : 'غير متوفر ✕'}
                  </span>
                </div>
              </div>

              {/* Subscriber Clinics Counter Badge */}
              <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">العيادات المشتركة:</span>
                <span className="font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                  {clinicsCount} عيادة 🏥
                </span>
              </div>

              {/* Card Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(plan)}
                  className="flex-1 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1 border border-indigo-500/30"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(plan)}
                  className={`p-2 rounded-xl border text-xs font-bold transition ${
                    isActive
                      ? 'bg-amber-500/10 hover:bg-amber-600 text-amber-300 hover:text-white border-amber-500/30'
                      : 'bg-emerald-500/10 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30'
                  }`}
                  title={isActive ? 'تعطيل الباقة' : 'تفعيل الباقة'}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(plan)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white transition border border-rose-500/30"
                  title="حذف الباقة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPlan ? `تعديل باقة: ${editingPlan.name_ar}` : 'إنشاء باقة اشتراك جديدة'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Dynamic Subscription Plan Studio</span>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section Tabs inside modal */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              {[
                { id: 'general', label: '1. المعلومات والأسعار' },
                { id: 'quotas', label: '2. سعة المرضى والموارد' },
                { id: 'ai', label: '3. حصص وميزات الـ AI' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormSection(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    formSection === tab.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* SECTION 1: General & Pricing */}
              {formSection === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">اسم الباقة (بالعربية):</label>
                      <input
                        type="text"
                        required
                        value={formData.name_ar}
                        onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                        placeholder="الباقة الاحترافية Pro AI"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">اسم الباقة (بالفرنسية):</label>
                      <input
                        type="text"
                        value={formData.name_fr}
                        onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                        placeholder="Pack Clinique Pro AI"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">المعرف الفريد (Slug):</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="pro-ai"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">السعر الشهري (دج):</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.price_monthly}
                        onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">السعر السنوي (دج):</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.price_yearly}
                        onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">مدة الفترة التجريبية (بالأيام):</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.trial_days}
                        onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">ترتيب العرض (Sort Order):</label>
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">الوصف التعريفي للباقة:</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="وصف تسويقي يوضح الفئة المستهدفة وميزات الباقة..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-purple-500 leading-relaxed"
                    />
                  </div>

                  {/* Badges Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <span className="text-slate-200 font-bold">⭐ تمييز كـ "الأكثر طلباً" (Featured)</span>
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-slate-700"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <span className="text-slate-200 font-bold">🟢 تفعيل الباقة للاشتراك المباشر</span>
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-slate-700"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* SECTION 2: Quotas & Capacity */}
              {formSection === 'quotas' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
                    💡 <strong>ملاحظة:</strong> أدخل القيمة <code>-1</code> لجعل الحد <strong>غير محدود (Unlimited)</strong>.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">الحد الأقصى لملفات المرضى والأطفال:</label>
                      <input
                        type="number"
                        value={formData.max_patients}
                        onChange={(e) => setFormData({ ...formData, max_patients: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">الحد الأقصى لطاقم العمل والممارسين:</label>
                      <input
                        type="number"
                        value={formData.max_staff}
                        onChange={(e) => setFormData({ ...formData, max_staff: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <span className="text-slate-200 font-bold">🌐 إتاحة ربط الدومين المخصص (Custom Domain & SSL)</span>
                      <input
                        type="checkbox"
                        checked={formData.has_custom_domain}
                        onChange={(e) => setFormData({ ...formData, has_custom_domain: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-slate-700"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <span className="text-slate-200 font-bold">🛡️ دعم فني ذو أولوية 24/7 (VIP Priority Support)</span>
                      <input
                        type="checkbox"
                        checked={formData.has_priority_support}
                        onChange={(e) => setFormData({ ...formData, has_priority_support: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-slate-700"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* SECTION 3: AI Quotas */}
              {formSection === 'ai' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">تقارير وحصائل SOAP السريرية (شهرياً):</label>
                      <input
                        type="number"
                        value={formData.ai_reports_limit}
                        onChange={(e) => setFormData({ ...formData, ai_reports_limit: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">دقائق التفريغ الصوتي والاستشارة الذكية:</label>
                      <input
                        type="number"
                        value={formData.ai_transcribe_mins}
                        onChange={(e) => setFormData({ ...formData, ai_transcribe_mins: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">بطاقات استوديو PECS والصور (شهرياً):</label>
                      <input
                        type="number"
                        value={formData.ai_images_limit}
                        onChange={(e) => setFormData({ ...formData, ai_images_limit: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">حلقات استوديو البودكاست الطبي:</label>
                      <input
                        type="number"
                        value={formData.ai_podcasts_limit}
                        onChange={(e) => setFormData({ ...formData, ai_podcasts_limit: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-slate-300 font-bold">فيديوهات النمذجة البصرية والسلوكية (Veo Video Studio):</label>
                      <input
                        type="number"
                        value={formData.ai_videos_limit}
                        onChange={(e) => setFormData({ ...formData, ai_videos_limit: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black transition flex items-center justify-center gap-1.5 shadow-xl shadow-purple-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>{submitting ? 'جاري الحفظ...' : editingPlan ? 'حفظ التعديلات' : 'إنشاء الباقة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
