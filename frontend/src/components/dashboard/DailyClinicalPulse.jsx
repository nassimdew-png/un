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
  Check
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
  onEnterKiosk,
  onToggleWaitlist,
  onStartConsultation,
  onQuickStartSession,
  setActiveTab,
}) {
  const { t } = useTranslation();
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const waitingRoomList = todaySummary?.waiting_room || [];
  const unbilledCount = todaySummary?.unbilled_sessions_count || 0;
  const draftBilansCount = todaySummary?.draft_bilans_count || 0;
  const waitingListCount = todaySummary?.waiting_list_count || 0;
  const stats = todaySummary?.stats || {};

  const showToast = (message) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 4000);
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
      if (onStartConsultation) onStartConsultation(apptId);
      if (onRefreshSummary) onRefreshSummary();
    } catch (err) {
      console.warn('Network error, saving offline:', err);
      await offlineSyncService.queueStatusUpdate({
        appointment_id: apptId,
        status: 'in_consultation',
      });
      showToast('تم حفظ التغيير محلياً بنجاح وسيتزامن فور عودة الاتصال.');
      if (onStartConsultation) onStartConsultation(apptId);
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
              إدارة Salle d'Attente اللحظية، بروتوكولات الفوترة السريعة، وتتبع جاهزية المذكرات والتقارير الطبية.
            </p>
          </div>

          {/* Action Launchers */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={onQuickStartSession}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 space-x-reverse transition-all"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>⚡ بدء جلسة فورية</span>
            </button>

            <button
              onClick={onToggleWaitlist}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all relative"
            >
              <ListOrdered className="w-4 h-4 text-teal-400" />
              <span>قائمة الانتظار</span>
              {waitingListCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-teal-500 text-slate-950 font-black">
                  {waitingListCount}
                </span>
              )}
            </button>

            <button
              onClick={onEnterKiosk}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all"
            >
              <Monitor className="w-4 h-4 text-indigo-400" />
              <span>شاشة الاستقبال / Kiosk</span>
            </button>
          </div>
        </div>

        {/* Clinical Alerts / Action Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          {/* Action Alert 1: Unbilled Sessions */}
          <div 
            onClick={() => setActiveTab && setActiveTab('billing')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              unbilledCount > 0 
                ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50' 
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2.5 space-x-reverse">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white">جلسات بحاجة للفوترة</div>
                <div className="text-[11px] text-slate-400">تحصيل المستحقات وإصدار الفواتير</div>
              </div>
            </div>
            <span className={`text-sm font-black font-mono px-2 py-0.5 rounded-lg ${
              unbilledCount > 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {unbilledCount}
            </span>
          </div>

          {/* Action Alert 2: Draft Master Bilans */}
          <div 
            onClick={() => setActiveTab && setActiveTab('assessments')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              draftBilansCount > 0 
                ? 'bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500/50' 
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2.5 space-x-reverse">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white">تقارير وحصائل مسودة</div>
                <div className="text-[11px] text-slate-400">Master Bilans بحاجة للاعتماد</div>
              </div>
            </div>
            <span className={`text-sm font-black font-mono px-2 py-0.5 rounded-lg ${
              draftBilansCount > 0 ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {draftBilansCount}
            </span>
          </div>

          {/* Action Alert 3: Smart Waiting List */}
          <div 
            onClick={onToggleWaitlist}
            className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-teal-500/30 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-2.5 space-x-reverse">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
                <ListOrdered className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white">طلبات الانتظار الذكية</div>
                <div className="text-[11px] text-slate-400">مطابقة الفراغات الزمنية المتاحة</div>
              </div>
            </div>
            <span className="text-sm font-black font-mono px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {waitingListCount}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Salle d'Attente Interactive Queue */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              🛋️
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center space-x-2 space-x-reverse">
                <span>قاعة الانتظار الآن (Salle d'Attente en Direct)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {waitingRoomList.length} مريض حاضر
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديث تلقائي للمرضى الحاضرين عبر شاشة Kiosk أو المسجلين من قبل الاستقبال
              </p>
            </div>
          </div>

          <button
            onClick={onRefreshSummary}
            disabled={loadingSummary}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition disabled:opacity-50"
            title="تحديث القائمة"
          >
            🔄
          </button>
        </div>

        {waitingRoomList.length === 0 ? (
          <div className="py-8 px-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-center text-slate-500 space-y-2">
            <Coffee className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-bold">قاعة الانتظار فارغة حالياً.</p>
            <p className="text-[11px] text-slate-600">يمكن للمرضى تسجيل الحضور عبر شاشة الاستقبال Kiosk أو تفعيل الحضور يدوياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {waitingRoomList.map((item) => {
              const isUpdating = updatingId === (item.id || item.appointment_id);

              return (
                <div
                  key={item.id || item.appointment_id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="font-extrabold text-white text-xs truncate">
                        {item.patient_name || `${item.patient?.first_name} ${item.patient?.last_name}`}
                      </span>
                      {item.specialty && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 border border-slate-700">
                          {item.specialty}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-[11px] text-slate-400 font-mono">
                      <span>وقت الحضور: {item.arrival_time || item.time || '--:--'}</span>
                      {item.wait_duration_minutes && (
                        <span className="text-amber-400 font-bold">
                          (ينتظر منذ {item.wait_duration_minutes} دقيقة)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center space-x-1.5 space-x-reverse shrink-0">
                    <button
                      onClick={() => handleEnterConsultation(item)}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-md shadow-teal-500/20 flex items-center space-x-1 space-x-reverse transition disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isUpdating ? '...' : '🚪 دخول الجلسة'}</span>
                    </button>

                    <button
                      onClick={() => handleCompleteAndBill(item)}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1 space-x-reverse transition disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>إنهاء وفوترة</span>
                    </button>
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
