import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Target,
  CheckCircle2,
  Clock,
  Plus,
  Printer,
  Edit3,
  Check,
  RefreshCw,
  AlertCircle,
  FileText,
  Layers,
  ChevronRight,
  BookOpen,
  Send,
  Flag,
  Calendar
} from 'lucide-react';
import { rehabPlanApi } from '../../api';
import AlgerianContentGeneratorModal from '../therapy/AlgerianContentGeneratorModal';

export default function TreatmentPlanView({ patient, onRefresh = null }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [activePlan, setActivePlan] = useState(null);
  const [planHistory, setPlanHistory] = useState([]);
  
  // Modal State
  const [showAlgerianGenModal, setShowAlgerianGenModal] = useState(false);
  const [selectedGoalForContent, setSelectedGoalForContent] = useState(null);

  // Editable Plan Form State
  const [isEditing, setIsEditing] = useState(false);
  const [specialty, setSpecialty] = useState('orthophonie');
  const [planTitle, setPlanTitle] = useState('مشروع العلاج والتأهيل الفردي الموجه (PEP / IEP)');
  const [shortTermGoals, setShortTermGoals] = useState([]);
  const [mediumTermGoals, setMediumTermGoals] = useState([]);
  const [longTermVision, setLongTermVision] = useState('');

  const fetchPlan = async () => {
    if (!patient?.id) return;
    setLoading(true);
    try {
      const res = await rehabPlanApi.getPatientPep(patient.id);
      if (res.success) {
        setActivePlan(res.active_plan);
        setPlanHistory(res.plans || []);
        if (res.active_plan) {
          setPlanTitle(res.active_plan.title || 'مشروع العلاج والتأهيل الفردي الموجه (PEP / IEP)');
          setSpecialty(res.active_plan.specialty || 'orthophonie');
          setShortTermGoals(res.active_plan.short_term_goals || []);
          setMediumTermGoals(res.active_plan.medium_term_goals || []);
          setLongTermVision(res.active_plan.long_term_vision || '');
        }
      }
    } catch (err) {
      console.error('Failed to load treatment plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [patient?.id]);

  // AI-Generate dynamic PEP plan
  const handleGenerateWithAi = async () => {
    setGeneratingAi(true);
    setFeedback(null);
    try {
      const res = await rehabPlanApi.aiGeneratePep(patient.id, {
        specialty,
        language: 'ar',
      });

      if (res.success && res.data) {
        setPlanTitle(res.data.title || 'مشروع العلاج والتأهيل الفردي الموجه (PEP / IEP)');
        setShortTermGoals(res.data.short_term_goals || []);
        setMediumTermGoals(res.data.medium_term_goals || []);
        setLongTermVision(res.data.long_term_vision || '');
        setIsEditing(true);
        setFeedback({ type: 'success', text: 'تم توليد المشروع العلاجي (PEP) بنجاح عبر خوارزميات الذكاء الاصطناعي السريري.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل توليد المشروع العلاجي.' });
    } finally {
      setGeneratingAi(false);
    }
  };

  // Save finalized PEP plan
  const handleSavePlan = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await rehabPlanApi.savePep(patient.id, {
        id: activePlan?.id,
        title: planTitle,
        specialty,
        short_term_goals: shortTermGoals,
        medium_term_goals: mediumTermGoals,
        long_term_vision: longTermVision,
        status: 'active',
      });

      if (res.success) {
        setActivePlan(res.plan);
        setIsEditing(false);
        setFeedback({ type: 'success', text: res.message || 'تم حفظ الخطة العلاجية بنجاح.' });
        fetchPlan();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الخطة العلاجية.' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle goal achievement status
  const handleToggleGoalStatus = async (goalId, currentStatus) => {
    if (!activePlan?.id) return;
    const newStatus = currentStatus === 'achieved' ? 'in_progress' : 'achieved';

    try {
      const res = await rehabPlanApi.updateGoalStatus(activePlan.id, goalId, newStatus);
      if (res.success) {
        setShortTermGoals((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, status: newStatus } : g))
        );
      }
    } catch (err) {
      console.error('Failed to update goal status:', err);
    }
  };

  const handleOpenContentGeneratorForGoal = (goal) => {
    setSelectedGoalForContent(goal);
    setShowAlgerianGenModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner & Control Actions */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-teal-500/20">
            🎯
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-lg font-black text-white">المشروع العلاجي الفردي والتأهيل الموجه (PEP / IEP)</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Plan Thérapeutique
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تحديد ومتابعة الأهداف السريرية الذكية (SMART) المصممة وفق نتائج التقييم السريري للمريض
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleGenerateWithAi}
            disabled={generatingAi}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition flex items-center space-x-1.5 space-x-reverse disabled:opacity-50"
          >
            {generatingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 fill-current" />}
            <span>{generatingAi ? 'جاري التوليد بالذكاء الاصطناعي...' : '✨ توليد مشروع علاجي (PEP) ذكي'}</span>
          </button>

          {activePlan && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
            >
              <Edit3 className="w-3.5 h-3.5 text-teal-400" />
              <span>{isEditing ? 'معاينة الخطة' : 'تعديل الأهداف'}</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="طباعة الخطة العلاجية A4"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
          feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-teal-400" />
          <p className="text-xs font-bold">جاري تحميل الخطة العلاجية للمريض...</p>
        </div>
      ) : !activePlan && !isEditing ? (
        <div className="py-16 px-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <Target className="w-12 h-12 mx-auto text-slate-600" />
          <div className="space-y-1">
            <h4 className="text-base font-black text-white">لا يوجد مشروع علاجي فردي (PEP) نشط لهذا المريض حالياً</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              يمكنك توليد خطة علاجية مخصصة ومبنية على نتائج التقييم الإكلينيكي وحصيلة الاختبارات بنقرة واحدة عبر الذكاء الاصطناعي.
            </p>
          </div>
          <button
            onClick={handleGenerateWithAi}
            disabled={generatingAi}
            className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-xl shadow-teal-500/20 transition inline-flex items-center space-x-2 space-x-reverse"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>توليد المشروع العلاجي الفردي الآن</span>
          </button>
        </div>
      ) : (
        /* Goals Board & Strategy Display */
        <div className="space-y-6">
          {/* Plan Header Info */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">عنوان المشروع العلاجي:</label>
                  <input
                    type="text"
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">التخصص العلاجي:</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  >
                    <option value="orthophonie">أرطوفونيا وتأهيل لغوي (Orthophonie)</option>
                    <option value="psychologie">علم النفس العيادي والنمائي (Psychologie)</option>
                    <option value="psychomotricite">علاج نفسي-حركي (Psychomotricité)</option>
                    <option value="neuropsychiatrie">طب نفسي للأطفال (Neuropsychiatrie)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-white">{planTitle}</h4>
                  <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-400 mt-0.5">
                    <span className="capitalize text-teal-400 font-bold">{specialty}</span>
                    <span>&bull;</span>
                    <span>تاريخ المراجعة: {activePlan?.review_date || 'كل 3 أشهر'}</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  خطة نشطة 🟢
                </span>
              </div>
            )}
          </div>

          {/* Tier 1: Short-Term Targets (1 - 3 Months) */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                  🎯
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">المرحلة الأولى: أهداف قريبة المدى (1 - 3 أشهر)</h4>
                  <p className="text-xs text-slate-400">أهداف إجرائية محددة تخضع للمتابعة في كل جلسة سريرية</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-teal-400">
                {shortTermGoals.filter((g) => g.status === 'achieved').length} / {shortTermGoals.length} أهداف محققة
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {shortTermGoals.map((goal, idx) => {
                const isAchieved = goal.status === 'achieved';

                return (
                  <div
                    key={goal.id || idx}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isAchieved 
                        ? 'bg-emerald-950/30 border-emerald-500/30 opacity-90' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                          {goal.domain || 'مجال التأهيل'}
                        </span>
                        <h5 className={`text-xs font-black ${isAchieved ? 'text-emerald-300 line-through' : 'text-white'}`}>
                          {goal.title}
                        </h5>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2 space-x-reverse">
                        <span>📊 مؤشر النجاح: <strong>{goal.indicator}</strong></span>
                        {goal.target_sessions && (
                          <span className="text-slate-500 font-mono">({goal.target_sessions} جلسات مستهدفة)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse shrink-0">
                      {/* Algerian Context Exercise Generator Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenContentGeneratorForGoal(goal)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center space-x-1 space-x-reverse shadow-sm"
                        title="توليد قصة أو بطاقات تدريب لهذا الهدف في السياق الجزائري"
                      >
                        <span>🇩🇿</span>
                        <span>توليد تمرين جزائري</span>
                      </button>

                      {/* Status Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleGoalStatus(goal.id, goal.status)}
                        className={`p-2 rounded-xl border text-xs font-bold transition flex items-center space-x-1 space-x-reverse ${
                          isAchieved
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                        title={isAchieved ? 'تم تحقيق الهدف بنجاح' : 'انقر لتأكيد تحقيق الهدف'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isAchieved ? 'مكتمل ✅' : 'قيد الإنجاز'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier 2: Medium-Term Targets (3 - 6 Months) */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                🚀
              </div>
              <div>
                <h4 className="text-sm font-black text-white">المرحلة الثانية: أهداف متوسطة المدى (3 - 6 أشهر)</h4>
                <p className="text-xs text-slate-400">تطوير المهارات التراكمية وتعميم المكتسبات في البيت والمدرسة</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {mediumTermGoals.map((goal, idx) => (
                <div
                  key={goal.id || idx}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {goal.domain || 'التطوير النمائي'}
                    </span>
                    <h5 className="text-xs font-black text-white">{goal.title}</h5>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    معيار التعميم والتقييم: {goal.indicator}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tier 3: Long-Term Vision */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                🌟
              </div>
              <div>
                <h4 className="text-sm font-black text-white">الرؤية الاستراتيجية بعيدة المدى والاستقلالية</h4>
                <p className="text-xs text-slate-400">الغاية الكلية للمشروع العلاجي والاندماج المدرسي والاجتماعي</p>
              </div>
            </div>

            {isEditing ? (
              <textarea
                rows={3}
                value={longTermVision}
                onChange={(e) => setLongTermVision(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
              />
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed p-4 rounded-2xl bg-slate-950 border border-slate-800">
                {longTermVision || 'تعزيز الاستقلالية التواصلية والمعرفية للطفل، وتيسير تكيفه المدرسي والاجتماعي.'}
              </p>
            )}
          </div>

          {/* Save Button when in edit mode */}
          {isEditing && (
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إلغاء التعديل
              </button>

              <button
                type="button"
                onClick={handleSavePlan}
                disabled={saving}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-lg transition flex items-center space-x-1.5 space-x-reverse disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : '💾 حفظ وتثبيت الخطة العلاجية'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Algerian Content Generator Modal */}
      {showAlgerianGenModal && (
        <AlgerianContentGeneratorModal
          isOpen={showAlgerianGenModal}
          onClose={() => setShowAlgerianGenModal(false)}
          patient={patient}
          initialGoal={selectedGoalForContent}
          onDispatched={() => {
            setFeedback({ type: 'success', text: 'تم إرسال التمرين العلاجي إلى بوابة المريض والولي بنجاح! 📲' });
          }}
        />
      )}
    </div>
  );
}
