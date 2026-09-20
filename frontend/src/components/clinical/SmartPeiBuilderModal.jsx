import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  Share2,
  Plus,
  Trash2,
  Save,
  BookOpen,
  Send,
  AlertCircle,
  X,
  Target,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { smartPeiApi } from '../../api';

export default function SmartPeiBuilderModal({
  isOpen,
  onClose,
  patient,
  specialty = 'orthophonie',
  diagnosticRecordId = null,
  diagnosticTitle = '',
  onPlanSaved = null,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dispatching, setDispatching] = useState(null);
  const [planTitle, setPlanTitle] = useState('المشروع العلاجي والتأهيلي الفردي (PEI / IEP)');
  const [shortTermGoals, setShortTermGoals] = useState([]);
  const [mediumTermGoals, setMediumTermGoals] = useState([]);
  const [longTermVision, setLongTermVision] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(specialty || 'orthophonie');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('short_term'); // short_term | medium_term | vision

  useEffect(() => {
    if (isOpen && patient?.id) {
      handleGeneratePlan();
    }
  }, [isOpen, patient?.id]);

  const handleGeneratePlan = async () => {
    if (!patient?.id) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await smartPeiApi.generate(patient.id, {
        specialty: selectedSpecialty,
        diagnostic_record_id: diagnosticRecordId,
      });

      if (res?.success && res.plan) {
        setPlanTitle(res.plan.title || 'المشروع العلاجي الفردي');
        setShortTermGoals(res.plan.short_term_goals || []);
        setMediumTermGoals(res.plan.medium_term_goals || []);
        setLongTermVision(res.plan.long_term_vision || '');
        setReviewDate(res.plan.review_date || '');
      } else {
        setError(res?.message || 'تعذر توليد خطة PEI الذكية.');
      }
    } catch (err) {
      console.error('Smart PEI generate error:', err);
      setError(err.message || 'حدث خطأ أثناء الاتصال بمحرك الخطط الفردية.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!patient?.id) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Gather all linked exercise IDs
      const linkedExerciseIds = [];
      shortTermGoals.forEach(g => {
        (g.linked_exercises || []).forEach(ex => {
          if (ex.id) linkedExerciseIds.push(ex.id);
        });
      });

      const payload = {
        title: planTitle,
        specialty: selectedSpecialty,
        diagnostic_record_id: diagnosticRecordId,
        short_term_goals: shortTermGoals,
        medium_term_goals: mediumTermGoals,
        long_term_vision: longTermVision,
        linked_exercise_ids: Array.from(new Set(linkedExerciseIds)),
        review_date: reviewDate,
        status: 'active',
      };

      const res = await smartPeiApi.savePlan(patient.id, payload);
      if (res?.success) {
        setSuccessMsg('تم حفظ وتثبيت المشروع العلاجي الفردي بنجاح في سجل المريض.');
        if (onPlanSaved) onPlanSaved(res.plan);
      } else {
        setError(res?.message || 'فشل حفظ الخطة العلاجية.');
      }
    } catch (err) {
      console.error('Save PEI plan error:', err);
      setError(err.message || 'تعذر حفظ الخطة.');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatchExercise = async (goal, exercise) => {
    if (!patient?.id || !exercise) return;
    setDispatching(exercise.id);

    try {
      const res = await smartPeiApi.dispatchToPortal({
        patient_id: patient.id,
        exercise_title: exercise.title || goal.title,
        instructions: (exercise.instructions || []).join('\n') || exercise.summary || 'تطبيق التمرين العلاجي المرفق في المنزل.',
        category: exercise.category || 'rehabilitation',
        due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      });

      if (res?.success) {
        alert(`✅ تم إرسال تمرين «${exercise.title}» إلى بوابة الولي الرقمية بنجاح.`);
      } else {
        alert(res?.message || 'تعذر إرسال التمرين.');
      }
    } catch (err) {
      alert('خطأ أثناء إرسال التمرين: ' + err.message);
    } finally {
      setDispatching(null);
    }
  };

  const handlePrintWorksheet = (exercise, goal) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const contentHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>كراسة نشاط تأهيلي - ${exercise.title}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; color: #1e293b; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #0f172a; }
          .badge { display: inline-block; padding: 4px 10px; background: #e0e7ff; color: #3730a3; border-radius: 6px; font-size: 12px; font-weight: 600; }
          .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #f8fafc; }
          .target-goal { font-size: 14px; font-weight: 600; color: #4338ca; }
          .instructions { margin-top: 12px; }
          .instructions li { margin-bottom: 8px; font-size: 14px; }
          .work-area { min-height: 250px; border: 2px dashed #94a3b8; border-radius: 8px; margin-top: 20px; padding: 20px; display: flex; align-items: center; justify-content: center; color: #64748b; }
          .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">منصة PsyPro - كراسة النشاط والتمارين التأهيلية المنزلية</div>
            <div style="font-size: 13px; color: #64748b;">المريض: ${patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`} | التاريخ: ${new Date().toLocaleDateString('ar-DZ')}</div>
          </div>
          <div class="badge">${exercise.category || 'تأهيل سريري'}</div>
        </div>

        <div class="box">
          <div class="target-goal">الهدف السريري المستهدف: ${goal?.title || ''}</div>
          <div style="font-size: 16px; font-weight: bold; margin-top: 8px;">${exercise.title}</div>
          <p style="font-size: 13px; color: #475569; margin-top: 4px;">${exercise.summary || ''}</p>
        </div>

        <div class="instructions">
          <h4 style="margin: 0 0 8px 0; font-size: 15px;">تعليمات تنفيذ النشاط للولي والمعالج:</h4>
          <ol>
            ${(exercise.instructions || ['تطبيق النشاط اليومي لمدة 10 دقائق', 'تعزيز الطفل عند كل محاولة صحيحة']).map(inst => `<li>${inst}</li>`).join('')}
          </ol>
        </div>

        <div class="work-area">
          <div>
            <p style="text-align: center; font-weight: bold;">مساحة إنجاز التمارين وكتابة الملاحظات اليومية</p>
            <p style="text-align: center; font-size: 12px;">(تسجيل عدد التكرارات ونسبة النجاح المحققة في كل محاولة)</p>
          </div>
        </div>

        <div class="footer">
          وثيقة رسمية مطبوعة من قمرة التأهيل السريري PsyPro ClinicSaaS • كود المرجع: ${exercise.exercise_code || 'EX-PEI'}
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(contentHtml);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-5xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">مشروع التكفل العلاجي الفردي (PEI / IEP)</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                  SMART Goals & Worksheets
                </span>
              </div>
              <p className="text-xs text-slate-400">
                المريض: <span className="text-slate-200 font-medium">{patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`}</span>
                {diagnosticTitle && ` • التشخيص: ${diagnosticTitle}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGeneratePlan}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
              <span>إعادة توليد ذكي</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/80 bg-slate-900/50">
          {[
            { id: 'short_term', label: `🎯 أهداف قريبة المدى (${shortTermGoals.length})`, count: shortTermGoals.length },
            { id: 'medium_term', label: `🌱 أهداف متوسطة المدى (${mediumTermGoals.length})`, count: mediumTermGoals.length },
            { id: 'vision', label: '🔭 الرؤية والتعميم الاستراتيجي' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3 text-xs font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Plan Settings Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-800/40 border border-slate-800 rounded-xl p-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">مسمى الخطة / المشروع:</label>
              <input
                type="text"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">التخصص السريري:</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="orthophonie">أرطوفونيا وتخاطب (Orthophonie)</option>
                <option value="psychology">علم النفس والعيادي (Psychology)</option>
                <option value="psychomotricite">تأهيل حركي ونفس حركي (Psychomotricité)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">تاريخ المراجعة والتقييم الدوري:</label>
              <input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* TAB 1: Short Term Goals & Linked Exercises */}
          {activeTab === 'short_term' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">الأهداف قصيرة المدى (1 - 3 أشهر)</h3>
                  <p className="text-xs text-slate-400">أهداف SMART محددة وقابلة للقياس مع ربط تلقائي ببنك التمارين والكراسات A4</p>
                </div>
                <button
                  onClick={() => {
                    const newGoal = {
                      id: Date.now(),
                      domain: 'مهارات نوعية',
                      title: 'هدف علاجي جديد',
                      indicator: 'تحقيق الاستجابة الصحيحة بنسبة 80%',
                      target_sessions: 10,
                      mastery_threshold: '80% نجاح',
                      status: 'in_progress',
                      linked_exercises: [],
                    };
                    setShortTermGoals([...shortTermGoals, newGoal]);
                  }}
                  className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة هدف SMART</span>
                </button>
              </div>

              <div className="space-y-4">
                {shortTermGoals.map((goal, gIdx) => (
                  <div key={goal.id || gIdx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                            {goal.domain || 'مجال التأهيل'}
                          </span>
                          <span className="text-[11px] text-slate-400">الهدف {gIdx + 1}</span>
                        </div>
                        <input
                          type="text"
                          value={goal.title}
                          onChange={(e) => {
                            const updated = [...shortTermGoals];
                            updated[gIdx].title = e.target.value;
                            setShortTermGoals(updated);
                          }}
                          className="w-full font-bold text-sm text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition py-0.5"
                        />
                      </div>

                      <button
                        onClick={() => {
                          const updated = shortTermGoals.filter((_, i) => i !== gIdx);
                          setShortTermGoals(updated);
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition"
                        title="حذف الهدف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Indicators & Sessions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">مؤشر النجاح ومحك الإتقان:</span>
                        <input
                          type="text"
                          value={goal.indicator || goal.mastery_threshold || ''}
                          onChange={(e) => {
                            const updated = [...shortTermGoals];
                            updated[gIdx].indicator = e.target.value;
                            setShortTermGoals(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 mt-1 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <span className="text-slate-400 block text-[11px]">عدد الجلسات التقديرية:</span>
                          <input
                            type="number"
                            value={goal.target_sessions || 10}
                            onChange={(e) => {
                              const updated = [...shortTermGoals];
                              updated[gIdx].target_sessions = parseInt(e.target.value) || 1;
                              setShortTermGoals(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 mt-1 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="flex-1">
                          <span className="text-slate-400 block text-[11px]">حالة الإنجاز:</span>
                          <select
                            value={goal.status || 'in_progress'}
                            onChange={(e) => {
                              const updated = [...shortTermGoals];
                              updated[gIdx].status = e.target.value;
                              setShortTermGoals(updated);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 mt-1 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="in_progress">قيد العمل (In Progress)</option>
                            <option value="achieved">تم الإتقان (Achieved)</option>
                            <option value="pending">مؤجل (Pending)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Linked Exercises Cards from Bank */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                          <span>التمارين والكراسات المرتبطة بهذا الهدف ({goal.linked_exercises?.length || 0}):</span>
                        </span>
                      </div>

                      {(!goal.linked_exercises || goal.linked_exercises.length === 0) ? (
                        <div className="p-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500 text-center">
                          لا توجد تمارين مرتبطة حالياً بهذا الهدف.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {goal.linked_exercises.map((ex, exIdx) => (
                            <div key={ex.id || exIdx} className="bg-slate-950 border border-slate-800/90 rounded-lg p-3 space-y-2 flex flex-col justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded">
                                    {ex.category || 'كراسة تأهيل'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{ex.estimated_duration || '15 دقيقة'}</span>
                                </div>
                                <h5 className="font-bold text-xs text-white">{ex.title}</h5>
                                {ex.summary && <p className="text-[11px] text-slate-400 line-clamp-2">{ex.summary}</p>}
                              </div>

                              {/* Quick Actions for Worksheet */}
                              <div className="flex items-center gap-2 pt-1 border-t border-slate-850">
                                <button
                                  onClick={() => handlePrintWorksheet(ex, goal)}
                                  className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded border border-slate-700 transition flex items-center justify-center gap-1"
                                >
                                  <Printer className="w-3 h-3 text-indigo-400" />
                                  <span>طباعة كراسة A4</span>
                                </button>

                                <button
                                  onClick={() => handleDispatchExercise(goal, ex)}
                                  disabled={dispatching === ex.id}
                                  className="flex-1 py-1 px-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 text-[11px] font-semibold rounded border border-teal-500/30 transition flex items-center justify-center gap-1"
                                >
                                  {dispatching === ex.id ? <Clock className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                  <span>إرسال للولي 📲</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Medium Term Goals */}
          {activeTab === 'medium_term' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">الأهداف متوسطة المدى (3 - 6 أشهر)</h3>
                  <p className="text-xs text-slate-400">أهداف التعميم في السياق الأسري والمدرسي والحياة اليومية</p>
                </div>
              </div>

              <div className="space-y-3">
                {mediumTermGoals.map((mGoal, mIdx) => (
                  <div key={mGoal.id || mIdx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                          {mGoal.domain || 'تعميم المهارة'}
                        </span>
                        <input
                          type="text"
                          value={mGoal.title}
                          onChange={(e) => {
                            const updated = [...mediumTermGoals];
                            updated[mIdx].title = e.target.value;
                            setMediumTermGoals(updated);
                          }}
                          className="w-full font-bold text-sm text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition py-0.5"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-950/60 rounded-lg text-xs space-y-1">
                      <span className="text-slate-400 block text-[11px]">مؤشر التعميم والتطبيق البيئي:</span>
                      <input
                        type="text"
                        value={mGoal.indicator || mGoal.generalization_context || ''}
                        onChange={(e) => {
                          const updated = [...mediumTermGoals];
                          updated[mIdx].indicator = e.target.value;
                          setMediumTermGoals(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 mt-1 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Long Term Strategic Vision */}
          {activeTab === 'vision' && (
            <div className="space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div>
                <h3 className="text-sm font-bold text-white">الرؤية الاستراتيجية بعيدة المدى (Long-term Clinical Vision)</h3>
                <p className="text-xs text-slate-400">الأفق الوظيفي والاستقلالية الذاتية والاندماج الأكاديمي والاجتماعي المستهدف على المدى السنوي</p>
              </div>

              <textarea
                value={longTermVision}
                onChange={(e) => setLongTermVision(e.target.value)}
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
                placeholder="اكتب الرؤية الاستراتيجية للتكفل السريري والتأهيلي الشامل..."
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSavePlan}
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-md"
            >
              {saving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>حفظ واعتماد المشروع العلاجي (PEI) 💾</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
