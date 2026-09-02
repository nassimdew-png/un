import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MapPin, 
  BookOpen, 
  Sparkles, 
  Award, 
  Check, 
  FileText, 
  TrendingUp, 
  Heart, 
  UserCheck, 
  AlertCircle, 
  MessageSquare, 
  Download, 
  ChevronRight,
  Stethoscope,
  Activity,
  Send
} from 'lucide-react';
import { parentPortalApi } from '../../api';

export default function PatientPortalView() {
  const { token } = useParams();
  const { t } = useTranslation();

  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'homework' | 'progress'

  // Action states
  const [confirmingApptId, setConfirmingApptId] = useState(null);
  const [completingHwId, setCompletingHwId] = useState(null);
  const [hwFeedback, setHwFeedback] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const fetchPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await parentPortalApi.getAccess(token);
      if (res.success && res.patient) {
        setPortalData(res);
      } else {
        setError(res.message || 'تعذر تحميل بيانات البوابة.');
      }
    } catch (err) {
      console.error('Portal load error:', err);
      setError(err.message || 'رابط البوابة غير صالح أو انتهت صلاحيته.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortal();
    }
  }, [token]);

  const handleConfirmAppointment = async (apptId) => {
    setConfirmingApptId(apptId);
    try {
      const res = await parentPortalApi.confirmAppointment(token, apptId);
      if (res.success) {
        showToast('تم تأكيد حضور الموعد بنجاح! شكراً لتعاونكم.');
        // Update local state
        setPortalData((prev) => ({
          ...prev,
          appointments: prev.appointments.map((a) => 
            a.id === apptId ? { ...a, confirmed_by_patient: true, status: 'confirmed' } : a
          ),
        }));
      }
    } catch (err) {
      showToast(err.message || 'فشل تأكيد الموعد', 'error');
    } finally {
      setConfirmingApptId(null);
    }
  };

  const handleCompleteHomework = async (hwId) => {
    setCompletingHwId(hwId);
    const feedback = hwFeedback[hwId] || '';
    try {
      const res = await parentPortalApi.completeHomework(token, hwId, feedback);
      if (res.success) {
        showToast('رائع! تم تسجيل إنجاز التمرين بنجاح.');
        setPortalData((prev) => ({
          ...prev,
          homework: prev.homework.map((h) => 
            h.id === hwId ? { ...h, is_completed: true, parent_feedback: feedback, completed_at: 'الآن' } : h
          ),
          stats: {
            ...prev.stats,
            completed_homework: (prev.stats.completed_homework || 0) + 1,
            homework_completion_rate: Math.min(100, Math.round((((prev.stats.completed_homework || 0) + 1) / Math.max(1, prev.stats.total_homework || 1)) * 100)),
          },
        }));
      }
    } catch (err) {
      showToast(err.message || 'فشل تسجيل الإنجاز', 'error');
    } finally {
      setCompletingHwId(null);
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center" dir="rtl">
        <div className="w-12 h-12 rounded-2xl border-4 border-teal-500/20 border-t-teal-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-bold animate-pulse">جارٍ تحميل بوابة المتابعة المنزلية...</p>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-3xl mb-4 shadow-xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-black text-white mb-2">رابط غير متوفر</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error || 'عذراً، هذا الرابط غير صالح أو انتهت مدة صلاحيته.'}</p>
        <p className="text-xs text-slate-500">يرجى التواصل مع العيادة لتزويدكم برابط جديد.</p>
      </div>
    );
  }

  const { patient, clinic, appointments = [], homework = [], stats = {} } = portalData;
  const accentColor = clinic?.report_accent_color || '#0d9488';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 font-sans selection:bg-teal-500 selection:text-slate-950" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-black flex items-center gap-2 animate-fade-in ${
          toastMessage.type === 'error' ? 'bg-red-950/90 text-red-200 border-red-500/50' : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Clinic Branding Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            {clinic.logo_url ? (
              <img src={clinic.logo_url} alt={clinic.name} className="w-10 h-10 rounded-xl object-contain bg-slate-950 p-1 border border-slate-800 shrink-0" />
            ) : (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black text-base shrink-0 shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                {clinic.name?.charAt(0) || '🏥'}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-white truncate">{clinic.name}</h1>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                <span>بوابة المتابعة السريرية للأولياء</span>
              </p>
            </div>
          </div>

          {clinic.phone && (
            <a
              href={`tel:${clinic.phone}`}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>اتصال بالعيادة</span>
            </a>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        {/* Child Welcome Hero Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: accentColor }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ملف المتابعة والتأهيل السريري</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                مرحباً بولي أمر البطل: <span className="text-teal-400">{patient.full_name}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-medium">
                {patient.age_formatted && <span>العمر: <strong>{patient.age_formatted}</strong></span>}
                {patient.phone && <span>رقم الهاتف: <strong>{patient.phone}</strong></span>}
              </div>
            </div>

            {/* Attendance & Completion Mini Badges */}
            <div className="flex items-center gap-2">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center min-w-[90px]">
                <div className="text-base font-black text-teal-400 font-mono">{stats.attendance_rate || 100}%</div>
                <div className="text-[10px] text-slate-400 font-bold">نسبة الحضور</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center min-w-[90px]">
                <div className="text-base font-black text-emerald-400 font-mono">{stats.completed_homework || 0}/{stats.total_homework || 0}</div>
                <div className="text-[10px] text-slate-400 font-bold">تمارين منجزة</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-extrabold shadow-lg">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'appointments' ? 'bg-teal-600 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>المواعيد ({appointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('homework')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'homework' ? 'bg-teal-600 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>التمارين المنزلية ({homework.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'progress' ? 'bg-teal-600 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>نسبة التقدم</span>
          </button>
        </div>

        {/* Tab 1: Appointments List & Confirmation */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-300 flex items-center justify-between">
              <span>📅 جدول الجلسات والمواعيد:</span>
              <span className="text-xs text-slate-500 font-normal">يرجى تأكيد الحضور قبل الموعد بـ 24 ساعة</span>
            </h3>

            {appointments.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-bold">لا توجد مواعيد مجدولة حالياً.</p>
              </div>
            ) : (
              appointments.map((app) => {
                const isConfirmed = app.confirmed_by_patient || app.status === 'confirmed';
                return (
                  <div
                    key={app.id}
                    className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {app.type === 'therapy_session' ? 'جلسة تأهيل وعلاج' : 'استشارة / تقييم'}
                        </span>
                        {isConfirmed && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>مؤكد الحضور</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-black text-white flex items-center gap-2">
                        <span>{app.date_formatted || app.date}</span>
                        {app.time && <span className="font-mono text-teal-400 font-bold text-sm">({app.time})</span>}
                      </h4>

                      <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                        <span>مع: {app.specialist_name}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfirmed ? (
                        <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>تم تأكيد الحضور بنجاح</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfirmAppointment(app.id)}
                          disabled={confirmingApptId === app.id}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>{confirmingApptId === app.id ? 'جارٍ التأكيد...' : '✅ تأكيد الحضور'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Homework Exercises & Worksheets */}
        {activeTab === 'homework' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-300 flex items-center justify-between">
              <span>📚 التمارين والأنشطة المنزلية المعتمدة:</span>
              <span className="text-xs text-slate-500 font-normal">تمارين موصى بها من قبل الأخصائي</span>
            </h3>

            {homework.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-500">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-bold">لا توجد تمارين منزلية جديدة حالياً.</p>
              </div>
            ) : (
              homework.map((hw) => {
                const isCompleted = hw.is_completed;
                return (
                  <div
                    key={hw.id}
                    className={`p-5 rounded-3xl border shadow-xl space-y-3 transition ${
                      isCompleted ? 'bg-slate-950/80 border-emerald-500/30' : 'bg-slate-900/90 border-slate-800 hover:border-teal-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-teal-500/10 text-teal-300 border border-teal-500/20">
                            {hw.category === 'articulation' ? 'نطق ومخارج حروف' : hw.category === 'langage_expressif' ? 'لغة وتعبير' : 'تركيز وانتباه'}
                          </span>
                          {hw.due_date_formatted && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              تاريخ الإنجاز المقترح: {hw.due_date_formatted}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-white">{hw.title}</h4>
                      </div>

                      {isCompleted ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم الإنجاز</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          قيد المتابعة
                        </span>
                      )}
                    </div>

                    {hw.instructions && (
                      <p className="text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 leading-relaxed">
                        📝 <strong>توجيهات للأولياء:</strong> {hw.instructions}
                      </p>
                    )}

                    {/* Completion Action & Feedback */}
                    {!isCompleted ? (
                      <div className="pt-2 border-t border-slate-800 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="ملاحظاتكم للأخصائي بعد تطبيق التمرين (اختياري)..."
                            value={hwFeedback[hw.id] || ''}
                            onChange={(e) => setHwFeedback({ ...hwFeedback, [hw.id]: e.target.value })}
                            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                          />
                          <button
                            onClick={() => handleCompleteHomework(hw.id)}
                            disabled={completingHwId === hw.id}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{completingHwId === hw.id ? 'جارٍ الحفظ...' : 'تم الإنجاز ✔️'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      hw.parent_feedback && (
                        <p className="text-xs text-emerald-300/80 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/20">
                          💬 <strong>ملاحظتكم المسجلة:</strong> {hw.parent_feedback}
                        </p>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: Progression & Attendance Card */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                <span>مؤشرات الالتزام والتطور السريري</span>
              </h3>

              {/* Progress Bar 1: Attendance */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">نسبة حضور الجلسات المجدولة في العيادة</span>
                  <span className="text-teal-400 font-mono font-black">{stats.attendance_rate || 100}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-500"
                    style={{ width: `${stats.attendance_rate || 100}%` }}
                  />
                </div>
              </div>

              {/* Progress Bar 2: Homework */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">نسبة إنجاز الأنشطة والتمارين المنزلية</span>
                  <span className="text-emerald-400 font-mono font-black">{stats.homework_completion_rate || 0}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                    style={{ width: `${stats.homework_completion_rate || 0}%` }}
                  />
                </div>
              </div>

              {/* Motivational Advice Banner */}
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200 leading-relaxed flex items-start gap-3">
                <Award className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-black text-white mb-1">أثر التدريب المنزلي:</strong>
                  إن مواظبتكم على إنجاز الأنشطة المنزلية الموصوفة بانتظام يضاعف من سرعة استجابة الطفل وتثبيت المهارات المكتسبة خلال الجلسات السريرية.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
