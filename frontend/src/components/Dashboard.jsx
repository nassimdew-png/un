import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign, 
  AlertTriangle,
  Clock,
  Activity,
  ChevronRight,
  Play,
  Trophy,
  Zap,
  Coffee,
  ListOrdered,
  FileCheck2,
  Receipt,
  ArrowUpRight
} from 'lucide-react';
import { assessmentApi, appointmentApi, clinicApi } from '../api';
import DailyClinicalPulse from './dashboard/DailyClinicalPulse';
import SmartWaitingListDrawer from './dashboard/SmartWaitingListDrawer';
import ActiveConsultationWorkspace from './ActiveConsultationWorkspace';
import QuickStartSessionModal from './QuickStartSessionModal';

export default function Dashboard({ 
  tenant, 
  user, 
  patients = [], 
  onOpenAddPatient, 
  onOpenAddAppointment, 
  onOpenAddInvoice, 
  onOpenAddAssessment,
  onEnterKiosk,
  setActiveTab
}) {
  const { t } = useTranslation();
  const [dueReassessments, setDueReassessments] = useState([]);
  const [loadingDue, setLoadingDue] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [todaySummary, setTodaySummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Modals & Drawers
  const [activeConsultationId, setActiveConsultationId] = useState(null);
  const [showQuickStartModal, setShowQuickStartModal] = useState(false);
  const [showWaitlistDrawer, setShowWaitlistDrawer] = useState(false);

  const fetchDashboardData = async () => {
    setLoadingDue(true);
    setLoadingAppts(true);
    setLoadingSummary(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [dueRes, apptRes, summaryRes] = await Promise.allSettled([
        assessmentApi.getDueReassessments(),
        appointmentApi.list({ date: todayStr }),
        clinicApi.getTodaySummary(),
      ]);

      if (dueRes.status === 'fulfilled') setDueReassessments(dueRes.value.data || []);
      if (apptRes.status === 'fulfilled') setTodayAppointments(apptRes.value.data || []);
      if (summaryRes.status === 'fulfilled' && summaryRes.value.success) {
        setTodaySummary(summaryRes.value);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingDue(false);
      setLoadingAppts(false);
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const patientList = Array.isArray(patients) 
    ? patients 
    : (patients && Array.isArray(patients.data) ? patients.data : []);

  return (
    <div className="space-y-8">
      {/* 1. Daily Clinical Pulse & Live Waiting Room Queue */}
      <DailyClinicalPulse
        todaySummary={todaySummary}
        loadingSummary={loadingSummary}
        onRefreshSummary={fetchDashboardData}
        onOpenAddPatient={onOpenAddPatient}
        onOpenAddAppointment={onOpenAddAppointment}
        onOpenAddInvoice={onOpenAddInvoice}
        onOpenAddAssessment={onOpenAddAssessment}
        onEnterKiosk={onEnterKiosk}
        onToggleWaitlist={() => setShowWaitlistDrawer(true)}
        onStartConsultation={(appointmentId) => setActiveConsultationId(appointmentId)}
        onQuickStartSession={() => setShowQuickStartModal(true)}
        setActiveTab={setActiveTab}
      />

      {/* 2. Smart Waiting List Drawer */}
      <SmartWaitingListDrawer
        isOpen={showWaitlistDrawer}
        onClose={() => setShowWaitlistDrawer(false)}
        onAppointmentConverted={fetchDashboardData}
      />

      {/* 3. Quick Start Consultation Modal */}
      {showQuickStartModal && (
        <QuickStartSessionModal
          isOpen={showQuickStartModal}
          onClose={() => setShowQuickStartModal(false)}
          patients={patientList}
          onSessionStarted={(appointment) => {
            setShowQuickStartModal(false);
            fetchDashboardData();
            if (appointment && appointment.id) {
              setActiveConsultationId(appointment.id);
            }
          }}
        />
      )}

      {/* 4. Active Consultation Fullscreen Workspace */}
      {activeConsultationId && (
        <ActiveConsultationWorkspace
          appointmentId={activeConsultationId}
          onClose={() => {
            setActiveConsultationId(null);
            fetchDashboardData();
          }}
          onCompleted={(appointment) => {
            setActiveConsultationId(null);
            fetchDashboardData();
            if (onOpenAddInvoice && appointment && appointment.patient) {
              onOpenAddInvoice({
                id: appointment.patient.id,
                name: `${appointment.patient.first_name} ${appointment.patient.last_name}`,
                phone: appointment.patient.phone,
                appointment_id: appointment.id,
              });
            }
          }}
        />
      )}

      {/* 5. Key Clinic KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div 
          onClick={() => setActiveTab && setActiveTab('patients')}
          className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-brand-500/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-0.5">
              <span>نشط</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            {patientList.length}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {t('dashboard.total_patients') || 'إجمالي المرضى المسجلين'}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('appointments')}
          className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-indigo-400 font-bold">اليوم</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            {todayAppointments.length}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {t('dashboard.today_appointments') || 'مواعيد وجلسات اليوم'}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('assessments')}
          className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-fuchsia-500/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-fuchsia-400 font-bold">سريري</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            {dueReassessments.length}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {t('dashboard.due_reassessments') || 'إعادة تقييم مستحقة'}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab && setActiveTab('billing')}
          className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">DZD</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            {todaySummary?.unbilled_sessions_count ? `${todaySummary.unbilled_sessions_count} غير مفوترة` : 'مكتملة'}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {t('dashboard.financial_health') || 'الفوترة ومتابعة السداد'}
          </div>
        </div>
      </div>

      {/* 6. Due Reassessments Alert Section */}
      {dueReassessments.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border border-amber-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5 space-x-reverse text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-black text-white">
                تنبيهات إعادة التقييم السريري الدوري (Re-bilan Clinique)
              </h3>
            </div>
            <button
              onClick={() => setActiveTab && setActiveTab('assessments')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>عرض جميع التقييمات</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dueReassessments.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-extrabold text-sm text-white">
                    {item.first_name} {item.last_name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    آخر تقييم: {item.last_assessment_date || '--'}
                  </p>
                </div>
                <button
                  onClick={() => onOpenAddAssessment && onOpenAddAssessment(item)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition"
                >
                  إجراء تقييم
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
