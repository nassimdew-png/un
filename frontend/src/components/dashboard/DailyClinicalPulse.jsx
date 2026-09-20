import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign, 
  Monitor, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Play, 
  Zap, 
  Coffee, 
  ListOrdered, 
  FileCheck2, 
  Receipt, 
  MessageSquare, 
  ChevronRight, 
  ArrowUpRight, 
  UserCheck, 
  Check, 
  Tv,
  Stethoscope,
  Volume2,
  Phone
} from 'lucide-react';
import { clinicApi } from '../../api';
import { offlineSyncService } from '../../services/offlineSync';

export default function DailyClinicalPulse({
  todaySummary,
  loadingSummary,
  onRefreshSummary,
  onOpenAddPatient,
  onOpenAddAppointment,
  onOpenAddInvoice,
  onOpenAddAssessment,
  onOpenWalkInArrival,
  onEnterKiosk,
  onToggleWaitlist,
  onStartConsultation,
  onQuickStartSession,
  setActiveTab,
  user = null,
  tenant = null,
}) {
  const { t } = useTranslation();
  const isSecretary = user?.role === 'secretary' || user?.role === 'receptionist';
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [queueTab, setQueueTab] = useState('all'); // 'all' | 'waiting' | 'in_progress'

  const waitingRoomList = todaySummary?.waiting_room || [];
  const inProgressList = todaySummary?.in_progress || [];
  const unbilledCount = todaySummary?.unbilled_sessions_count || 0;
  const draftBilansCount = todaySummary?.draft_bilans_count || 0;
  const waitingListCount = todaySummary?.waiting_list_count || 0;
  const stats = todaySummary?.stats || {};

  const totalActiveCount = waitingRoomList.length + inProgressList.length;

  const displayList = queueTab === 'waiting' 
    ? waitingRoomList 
    : queueTab === 'in_progress' 
    ? inProgressList 
    : [...inProgressList, ...waitingRoomList];

  const showToast = (message) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 4000);
  };

  const playCallingChime = (patientName) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
        });
      }
      if ('speechSynthesis' in window && patientName) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(`المريض ${patientName}، يرجى التوجه إلى قاعة الفحص`);
        utter.lang = 'ar-SA';
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      }
      showToast(`جاري نداء المريض: ${patientName} بالمكبر 📢`);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  // 1-Click Action: Move from Waiting Room to Consultation (Offline Resilient)
  const handleEnterConsultation = async (appointment) => {
    const apptId = appointment.id || appointment.appointment_id;
    setUpdatingId(apptId);
    try {
      if (!navigator.onLine) {
        await offlineSyncService.queueStatusUpdate({
          appointment_id: apptId,
          status: 'in_consultation',
        });
        showToast('تم بدء الجلسة محلياً (وضع عدم الاتصال). ستتم المزامنة تلقائياً.');
        if (onStartConsultation) onStartConsultation(apptId);
        return;
      }

      await clinicApi.updateAppointmentStatus(apptId, {
        status: 'in_consultation',
      });
      if (onStartConsultation && !isSecretary) onStartConsultation(apptId);
      if (isSecretary) {
        showToast('تم تحويل المريض إلى قاعة الفحص لدى الأخصائي بنجاح 🩺');
      }
      if (onRefreshSummary) onRefreshSummary();
    } catch (err) {
      console.warn('Network error, saving offline:', err);
      await offlineSyncService.queueStatusUpdate({
        appointment_id: apptId,
        status: 'in_consultation',
      });
      showToast('تم حفظ التغيير محلياً بنجاح وسيتزامن فور عودة الاتصال.');
      if (onStartConsultation && !isSecretary) onStartConsultation(apptId);
    } finally {
      setUpdatingId(null);
    }
  };

  // 1-Click Action: Complete Consultation and Launch Invoicing (Offline Resilient)
  const handleCompleteAndBill = async (appointment) => {
    const apptId = appointment.id || appointment.appointment_id;
    setUpdatingId(apptId);
    try {
      if (!navigator.onLine) {
        await offlineSyncService.queueStatusUpdate({
          appointment_id: apptId,
          status: 'completed',
        });
        showToast('تم إنهاء الجلسة محلياً (وضع عدم الاتصال).');
        if (onOpenAddInvoice) onOpenAddInvoice(appointment);
        return;
      }

      await clinicApi.updateAppointmentStatus(apptId, {
        status: 'completed',
      });
      if (onOpenAddInvoice) onOpenAddInvoice(appointment);
      if (onRefreshSummary) onRefreshSummary();
    } catch (err) {
      console.warn('Network error, saving offline:', err);
      await offlineSyncService.queueStatusUpdate({
        appointment_id: apptId,
        status: 'completed',
      });
      showToast('تم حفظ التغيير محلياً وسيتزامن فور عودة الاتصال.');
      if (onOpenAddInvoice) onOpenAddInvoice(appointment);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold animate-fade-in flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-teal-400 font-black">✕</button>
        </div>
      )}

      {/* Hero Pulse Header & Quick Action Launcher */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                النبض العيادي اليومي &bull; Daily Clinical Pulse
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              مرحباً بكم في فضاء العمل السريري المتكامل
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              إدارة قاعة الانتظار والجلسات الجارية، بروتوكولات الفوترة السريعة، وتتبع جاهزية المذكرات والتقارير الطبية.
            </p>
          </div>

          {/* Action Launchers */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={onOpenWalkInArrival ? onOpenWalkInArrival : () => setActiveTab && setActiveTab('front-desk')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 space-x-reverse transition-all active:scale-95"
              title="تسجيل حضور مريض حضر الآن إلى العيادة"
            >
              <UserCheck className="w-4 h-4" />
              <span>تسجيل حضور (Walk-in) 🚪</span>
            </button>

            {isSecretary ? (
              <button
                onClick={onOpenAddInvoice}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 space-x-reverse transition-all active:scale-95"
              >
                <DollarSign className="w-4 h-4" />
                <span>قبض أتعاب / وصل جديد</span>
              </button>
            ) : (
              <button
                onClick={onQuickStartSession}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 flex items-center space-x-1.5 space-x-reverse transition-all active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>جلسة فورية سريعة</span>
              </button>
            )}

            <button
              onClick={onOpenAddPatient}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center space-x-1.5 space-x-reverse transition-all"
            >
              <Plus className="w-4 h-4 text-teal-400" />
              <span>ملف مريض جديد</span>
            </button>

            <button
              onClick={onOpenAddAppointment}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center space-x-1.5 space-x-reverse transition-all"
            >
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>حجز موعد جديد</span>
            </button>

            <button
              onClick={onEnterKiosk}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs border border-purple-900/40 flex items-center space-x-1.5 space-x-reverse transition-all"
              title="تفعيل وضع الشاشة التفاعلية لاستقبال المرضى وتسجيل الحضور الذاتي"
            >
              <Monitor className="w-4 h-4 text-purple-400" />
              <span>شاشة الاستقبال (Kiosk)</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold">مواعيد اليوم</div>
              <div className="text-lg font-mono font-black text-white">{stats.total_today || 0}</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold">في الانتظار & الفحص</div>
              <div className="text-lg font-mono font-black text-emerald-400">
                {(stats.waiting_room || 0) + (stats.in_progress || 0)}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold">مكتملة اليوم</div>
              <div className="text-lg font-mono font-black text-blue-400">{stats.completed || 0}</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-bold">المداخيل اليومية</div>
              <div className="text-base font-mono font-black text-amber-300">
                {stats.today_collected ? `${stats.today_collected.toLocaleString('fr-DZ')} DZD` : '0 DZD'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Attention & Pending Tasks Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Unbilled Sessions Alert Card */}
        <div 
          onClick={() => setActiveTab && setActiveTab('billing')}
          className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/60 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">جلسات غير مفوترة</div>
              <div className="text-[11px] text-slate-400">تحصيل الأتعاب وإصدار الوصولات</div>
            </div>
          </div>
          <span className="text-sm font-black font-mono px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {unbilledCount}
          </span>
        </div>

        {/* Draft Assessments / Bilans Alert Card */}
        <div 
          onClick={() => setActiveTab && setActiveTab('assessments')}
          className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 hover:border-indigo-500/60 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">حصائل ومقاييس قيد الصياغة</div>
              <div className="text-[11px] text-slate-400">توليد تقارير PDF وإرسالها للأولياء</div>
            </div>
          </div>
          <span className="text-sm font-black font-mono px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {draftBilansCount}
          </span>
        </div>

        {/* Waiting List Requests */}
        <div 
          onClick={onToggleWaitlist}
          className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/30 hover:border-teal-500/60 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs">طلبات الحجز وقائمة الانتظار</div>
              <div className="text-[11px] text-slate-400">مطابقة الفراغات الزمنية المتاحة</div>
            </div>
          </div>
          <span className="text-sm font-black font-mono px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            {waitingListCount}
          </span>
        </div>
      </div>

      {/* Real-time Salle d'Attente & Active Consultations Queue */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-lg shadow-md">
              🛋️
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
                <span>قاعة الانتظار والجلسات الجارية (Salle d'Attente & Séances)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {waitingRoomList.length} في الانتظار
                </span>
                {inProgressList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
                    {inProgressList.length} داخل الفحص
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديث لحظي للمرضى المنتظرين والجلسات الجارية داخل غرف الفحص
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse self-end sm:self-auto">
            {/* View Sub-Tabs Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setQueueTab('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  queueTab === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل ({totalActiveCount})
              </button>
              <button
                type="button"
                onClick={() => setQueueTab('waiting')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  queueTab === 'waiting'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🛋️ في الانتظار ({waitingRoomList.length})
              </button>
              <button
                type="button"
                onClick={() => setQueueTab('in_progress')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  queueTab === 'in_progress'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🩺 داخل الفحص ({inProgressList.length})
              </button>
            </div>

            <button
              onClick={() => window.open('/tv', '_blank')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
              title="عرض قاعة الانتظار على شاشة التلفاز الذكية (Smart TV Mode)"
            >
              <Tv className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">شاشة TV</span>
            </button>

            <button
              onClick={onRefreshSummary}
              disabled={loadingSummary}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition disabled:opacity-50"
              title="تحديث القائمة"
            >
              🔄
            </button>
          </div>
        </div>

        {displayList.length === 0 ? (
          <div className="py-8 px-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-center text-slate-500 space-y-2">
            <Coffee className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-bold">
              {queueTab === 'in_progress'
                ? 'لا توجد جلسات جارية حالياً داخل غرف الفحص.'
                : queueTab === 'waiting'
                ? 'قاعة الانتظار فارغة حالياً.'
                : 'لا يوجد مرضى في قاعة الانتظار أو غرف الفحص حالياً.'}
            </p>
            <p className="text-[11px] text-slate-600">يمكن للمرضى تسجيل الحضور عبر شاشة الاستقبال Kiosk أو تفعيل الحضور يدوياً من الأجندة.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayList.map((item) => {
              const isUpdating = updatingId === (item.id || item.appointment_id);
              const apptId = item.id || item.appointment_id;
              const isInConsultation = item.status === 'in_progress' || item.status === 'in_consultation';
              const patientName = item.patient_name || (item.patient ? `${item.patient.first_name} ${item.patient.last_name}` : 'مريض غير محدد');

              return (
                <div
                  key={apptId}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isInConsultation
                      ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
                      <span className="font-extrabold text-white text-xs truncate">
                        {patientName}
                      </span>
                      
                      {isInConsultation ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span>الجلسة جارية (قيد الفحص)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>حاضر في قاعة الانتظار</span>
                        </span>
                      )}

                      {item.specialty && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700 font-bold">
                          {item.specialty}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400 font-mono">
                      {item.specialist?.name && (
                        <span className="text-slate-300">
                          👨‍⚕️ {item.specialist.name}
                        </span>
                      )}

                      <span>
                        ⏰ {item.start_time || item.time || item.arrival_time || '--:--'}
                      </span>

                      {item.wait_duration_minutes && !isInConsultation && (
                        <span className="text-amber-400 font-bold">
                          (ينتظر منذ {item.wait_duration_minutes} دقيقة)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center space-x-1.5 space-x-reverse shrink-0 self-end sm:self-center">
                    {isInConsultation ? (
                      <>
                        {!isSecretary ? (
                          <button
                            onClick={() => onStartConsultation && onStartConsultation(apptId)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-cyan-600/30 flex items-center space-x-1 space-x-reverse transition active:scale-95"
                            title="فتح قمرة الجلسة والميقاتية والملف الطبي"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>فتح الجلسة</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenAddInvoice && onOpenAddInvoice(item)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-md flex items-center space-x-1 space-x-reverse transition active:scale-95"
                            title="تحصيل الرسوم وإصدار وصل دفع"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>قبض أتعاب</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleCompleteAndBill(item)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold flex items-center space-x-1 space-x-reverse border border-slate-700 transition"
                          title="إنهاء الجلسة وإصدار الفاتورة"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>إنهاء</span>
                        </button>

                        <button
                          onClick={() => onOpenAddInvoice && onOpenAddInvoice(item)}
                          className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition"
                          title="تحصيل الرسوم وإصدار وصل"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => playCallingChime(patientName)}
                          className="p-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition"
                          title="نداء صوتي بالمكبر وجرس المناداة"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleEnterConsultation(item)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-md shadow-teal-500/20 flex items-center space-x-1 space-x-reverse transition disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isUpdating ? '...' : (isSecretary ? '🚪 إدخال للفحص' : '🚪 دخول الجلسة')}</span>
                        </button>

                        <button
                          onClick={() => handleCompleteAndBill(item)}
                          disabled={isUpdating}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1 space-x-reverse transition disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>إنهاء</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
