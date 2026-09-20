import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import { patientApi, appointmentApi, subscriptionApi } from './api';
import { playArrivalChime } from './utils/soundNotifier';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import SubscriptionStatusBanner from './components/subscription/SubscriptionStatusBanner';
import RenewSubscriptionModal from './components/subscription/RenewSubscriptionModal';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Appointments from './components/Appointments';
import Assessments from './components/Assessments';
import TherapySessions from './components/TherapySessions';
import Billing from './components/Billing';
import Settings from './components/Settings';
import StaffManagement from './components/StaffManagement';
import AuditLogs from './components/AuditLogs';
import { OrthophonyModule, PsychologyModule, PsychomotricityModule } from './components/SpecialtyModules';
import ExercisesBankView from './components/therapy/ExercisesBankView';
import FrontDeskReceptionCockpit from './components/reception/FrontDeskReceptionCockpit';
import TeletherapyModule from './components/teletherapy/TeletherapyModule';
import TeletherapyRoomView from './components/teletherapy/TeletherapyRoomView';
import PublicPatientTeletherapyRoom from './components/teletherapy/PublicPatientTeletherapyRoom';
import ClinicalInteractiveCanvas from './components/teletherapy/ClinicalInteractiveCanvas';
import AiTherapyHubView from './components/ai-therapy/AiTherapyHubView';
import AiDataAnalystView from './components/analytics/AiDataAnalystView';
import HelpCenterView from './components/help/HelpCenterView';
import AiReceptionistSettingsView from './components/settings/AiReceptionistSettingsView';
import AiSupportChatWidget from './components/common/AiSupportChatWidget';
import SubscriptionManagerTab from './components/subscription/SubscriptionManagerTab';
import SuperAdminDashboardView from './components/super-admin/SuperAdminDashboardView';
import MasterAdminDashboard from './components/super-admin/MasterAdminDashboard';
import SuperadminDashboard from './components/Superadmin/SuperadminDashboard';
import TenantManagement from './components/Superadmin/TenantManagement';
import Login from './components/Login';
import LandingPageView from './components/public/LandingPageView';
import RegisterView from './components/public/RegisterView';
import KioskCheckIn from './components/KioskCheckIn';
import PublicRemoteAssessmentPortal from './components/PublicRemoteAssessmentPortal';
import WaitingRoomTvScreen from './components/WaitingRoomTvScreen';
import ParentMobilePortal from './components/ParentMobilePortal';
import PublicRemoteTherapyPortal from './components/therapy/PublicRemoteTherapyPortal';
import NamingTherapyModule from './components/therapy/modules/NamingTherapyModule';
import SpacedRetrievalModule from './components/therapy/modules/SpacedRetrievalModule';
import ApraxiaVideoModule from './components/therapy/modules/ApraxiaVideoModule';
import AlphaTopicsAAC from './components/therapy/modules/AlphaTopicsAAC';
import VisualAttentionModule from './components/therapy/modules/VisualAttentionModule';
import DysphagiaProtocolGuide from './components/therapy/modules/DysphagiaProtocolGuide';
import TherapyAppFinder from './components/therapy/TherapyAppFinder';
import ClinicalTestsCatalogHub from './components/assessments/ClinicalTestsCatalogHub';
import InteractiveAssessmentRunner from './components/assessments/InteractiveAssessmentRunner';
import TherapyLibraryView from './components/therapy-hub/TherapyLibraryView';
import ParentPortalView from './components/portal/ParentPortalView';
import ParentPreIntakePortalView from './components/portal/ParentPreIntakePortalView';
import PublicClinicBookingLandingView from './components/portal/PublicClinicBookingLandingView';
import PublicSpeechMatrixView from './components/public/PublicSpeechMatrixView';
import StudentOfferLandingView from './components/academic/StudentOfferLandingView';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';

// Modals
import PatientModal from './components/PatientModal';
import AssessmentModal from './components/AssessmentModal';
import SessionModal from './components/SessionModal';
import AppointmentModal from './components/AppointmentModal';
import InvoiceModal from './components/InvoiceModal';
import CreateTenantModal from './components/Superadmin/CreateTenantModal';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center text-2xl mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold mb-2">Une erreur inattendue est survenue</h2>
          <p className="text-xs text-slate-400 max-w-md mb-6 font-mono">
            {this.state.error?.message || 'Erreur inconnue'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = '/';
            }}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg transition-all"
          >
            Recharger l'application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function ClinicApp() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language || i18n.language.startsWith('ar');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [patients, setPatients] = useState([]);

  // Real-time waiting room & toast state
  const [waitingCount, setWaitingCount] = useState(0);
  const [arrivedToast, setArrivedToast] = useState(null);
  const prevWaitingIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Modals state
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCreateTenantModalOpen, setIsCreateTenantModalOpen] = useState(false);
  const [selectedAppointmentForInvoice, setSelectedAppointmentForInvoice] = useState(null);

  // Subscription state
  const [clinicSubData, setClinicSubData] = useState(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  const fetchSubData = async () => {
    if (!user || user.role === 'superadmin') return;
    try {
      const res = await subscriptionApi.getCurrent();
      setClinicSubData(res);
    } catch (err) {
      console.error('Error loading subscription info:', err);
    }
  };

  const fetchPatients = async () => {
    if (!user || user.role === 'superadmin') return;
    try {
      const res = await patientApi.list();
      setPatients(res.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Error loading patients:', err);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      fetchPatients();
      fetchSubData();
    }
  }, [user]);

  // Live waiting room polling and instant cross-tab queue sync
  useEffect(() => {
    if (!user || user.role === 'superadmin') return;

    const pollWaiting = async () => {
      try {
        const res = await appointmentApi.getLiveWaiting();
        const list = res.data || [];
        setWaitingCount(res.count || list.length);

        const currentIds = new Set(list.map((item) => item.id));

        if (!isFirstLoadRef.current) {
          list.forEach((app) => {
            if (!prevWaitingIdsRef.current.has(app.id)) {
              playArrivalChime();
              const patientName = app.patient ? `${app.patient.first_name} ${app.patient.last_name}` : 'Patient';
              setArrivedToast({
                id: app.id,
                name: patientName,
                token: app.token || (app.id ? `T-${String(app.id).padStart(3, '0')}` : ''),
                time: app.appointment_date ? new Date(app.appointment_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                doctor: app.specialist?.name || user?.name || '',
              });

              setTimeout(() => {
                setArrivedToast((current) => current?.id === app.id ? null : current);
              }, 8000);
            }
          });
        }

        prevWaitingIdsRef.current = currentIds;
        isFirstLoadRef.current = false;
      } catch (err) {
        // Silently handle background polling error
      }
    };

    pollWaiting();
    const interval = setInterval(pollWaiting, 15000);

    // Instant cross-window / cross-tab broadcast handler
    const handleInstantQueueEvent = (eventData) => {
      if (!eventData) return;
      if (eventData.type === 'KIOSK_CHECKIN_CONFIRMED' || eventData.type === 'PATIENT_ARRIVED') {
        playArrivalChime();
        const patientName = eventData.patient?.name || (eventData.patient?.first_name ? `${eventData.patient.first_name} ${eventData.patient.last_name || ''}` : 'مريض قاعة الانتظار');
        setArrivedToast({
          id: eventData.appointment?.id || Date.now(),
          name: patientName,
          token: eventData.token || '',
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          doctor: user?.name || 'الأخصائي',
        });
        pollWaiting();
        setTimeout(() => {
          setArrivedToast(null);
        }, 8000);
      }
    };

    let channel = null;
    try {
      channel = new BroadcastChannel('psypro_clinic_queue');
      channel.onmessage = (e) => handleInstantQueueEvent(e.data);
    } catch (e) {}

    const onStorage = (e) => {
      if (e.key === 'psypro_queue_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleInstantQueueEvent(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', onStorage);

    const onCustomEvent = (e) => {
      if (e.detail) handleInstantQueueEvent(e.detail);
    };
    window.addEventListener('psypro_queue_event', onCustomEvent);

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('psypro_queue_event', onCustomEvent);
    };
  }, [user]);

  const handleOpenAddInvoiceForAppointment = (app) => {
    setSelectedAppointmentForInvoice(app);
    setIsInvoiceModalOpen(true);
  };

  const isSecretary = user?.role === 'secretary' || user?.role === 'receptionist';

  // If superadmin logs in and lands on root, redirect to /superadmin
  if (user?.role === 'superadmin' && window.location.pathname === '/') {
    return <Navigate to="/superadmin" replace />;
  }
  // If secretary logs in and lands on root, redirect to /front-desk
  if (isSecretary && window.location.pathname === '/') {
    return <Navigate to="/front-desk" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      <Sidebar 
        tenant={tenant} 
        user={user} 
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isRtl ? 'lg:mr-72' : 'lg:ml-72'}`}>
        <SubscriptionStatusBanner
          subscription={clinicSubData?.subscription}
          hasPendingRequest={clinicSubData?.has_pending_request}
          onOpenRenew={() => setIsRenewModalOpen(true)}
        />
        <Navbar 
          tenant={tenant} 
          user={user} 
          onLogout={logout} 
          waitingCount={waitingCount} 
          onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-900/40">
          <Routes>
            <Route
              path="/"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <Dashboard
                    tenant={tenant}
                    user={user}
                    patients={patients}
                    onOpenAddPatient={() => setIsPatientModalOpen(true)}
                    onOpenAddAppointment={() => setIsAppointmentModalOpen(true)}
                    onOpenAddInvoice={() => {
                      setSelectedAppointmentForInvoice(null);
                      setIsInvoiceModalOpen(true);
                    }}
                    onOpenAddAssessment={() => setIsAssessmentModalOpen(true)}
                    onEnterKiosk={() => navigate('/kiosk')}
                    setActiveTab={(tab) => navigate(`/${tab}`)}
                  />
                )
              }
            />
            <Route
              path="/patients"
              element={
                <Patients
                  patients={patients}
                  user={user}
                  tenant={tenant}
                  onRefresh={fetchPatients}
                  onOpenAddPatient={() => setIsPatientModalOpen(true)}
                  onOpenAddAssessment={() => setIsAssessmentModalOpen(true)}
                  onOpenAddSession={() => setIsSessionModalOpen(true)}
                />
              }
            />
            <Route
              path="/appointments"
              element={
                <Appointments
                  tenant={tenant}
                  user={user}
                  patients={patients}
                  onOpenAddAppointment={() => setIsAppointmentModalOpen(true)}
                  onOpenAddInvoiceForAppointment={handleOpenAddInvoiceForAppointment}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  tenant={tenant}
                  user={user}
                  patients={patients}
                  onOpenAddPatient={() => setIsPatientModalOpen(true)}
                  onOpenAddAppointment={() => setIsAppointmentModalOpen(true)}
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                  onOpenAddAssessment={() => setIsAssessmentModalOpen(true)}
                  onEnterKiosk={() => navigate('/kiosk')}
                  setActiveTab={(tab) => navigate(`/${tab}`)}
                />
              }
            />
            <Route
              path="/clinic/dashboard"
              element={
                <Dashboard
                  tenant={tenant}
                  user={user}
                  patients={patients}
                  onOpenAddPatient={() => setIsPatientModalOpen(true)}
                  onOpenAddAppointment={() => setIsAppointmentModalOpen(true)}
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                  onOpenAddAssessment={() => setIsAssessmentModalOpen(true)}
                  onEnterKiosk={() => navigate('/kiosk')}
                  setActiveTab={(tab) => navigate(`/${tab}`)}
                />
              }
            />
            <Route
              path="/clinic"
              element={
                <Dashboard
                  tenant={tenant}
                  user={user}
                  patients={patients}
                  onOpenAddPatient={() => setIsPatientModalOpen(true)}
                  onOpenAddAppointment={() => setIsAppointmentModalOpen(true)}
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                  onOpenAddAssessment={() => setIsAssessmentModalOpen(true)}
                  onEnterKiosk={() => navigate('/kiosk')}
                  setActiveTab={(tab) => navigate(`/${tab}`)}
                />
              }
            />
            <Route
              path="/front-desk"
              element={
                <FrontDeskReceptionCockpit
                  tenant={tenant}
                  user={user}
                  patients={patients}
                />
              }
            />
            <Route
              path="/waiting-room"
              element={
                <FrontDeskReceptionCockpit
                  tenant={tenant}
                  user={user}
                  patients={patients}
                />
              }
            />
            <Route
              path="/clinical-tests"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <ClinicalTestsCatalogHub
                    patients={patients}
                    tenant={tenant}
                    user={user}
                  />
                )
              }
            />
            <Route
              path="/exercises-bank"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <ExercisesBankView
                    patients={patients}
                    tenant={tenant}
                    user={user}
                  />
                )
              }
            />
            <Route
              path="/exercises"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <ExercisesBankView
                    patients={patients}
                    tenant={tenant}
                    user={user}
                  />
                )
              }
            />
            <Route
              path="/assessments"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <Assessments
                    patients={patients}
                    user={user}
                    tenant={tenant}
                    onOpenAddAssessment={() => setIsAssessmentModalOpen(true)}
                  />
                )
              }
            />
            <Route
              path="/therapy-hub"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <TherapyLibraryView
                    tenant={tenant}
                    user={user}
                    patients={patients}
                  />
                )
              }
            />
            <Route
              path="/therapy-suite"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <TherapyAppFinder />
                )
              }
            />
            <Route
              path="/sessions"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <TherapySessions
                    patients={patients}
                    user={user}
                    tenant={tenant}
                    onOpenAddSession={() => setIsSessionModalOpen(true)}
                  />
                )
              }
            />
            <Route
              path="/billing"
              element={
                <Billing
                  tenant={tenant}
                  patients={patients}
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/treasury"
              element={
                <Billing
                  tenant={tenant}
                  patients={patients}
                  initialTab="analytics"
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/treasury/daily"
              element={
                <Billing
                  tenant={tenant}
                  patients={patients}
                  initialTab="analytics"
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/cash-register"
              element={
                <Billing
                  tenant={tenant}
                  patients={patients}
                  initialTab="analytics"
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/daily-cash"
              element={
                <Billing
                  tenant={tenant}
                  patients={patients}
                  initialTab="analytics"
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/caisse"
              element={
                <Billing
                  tenant={tenant}
                  patients={patients}
                  initialTab="analytics"
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/receipts"
              element={
                <Billing
                  tenant={tenant}
                  patients={patients}
                  initialTab="invoices"
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/invoices"
              element={
                <Billing
                  tenant={tenant}
                  patients={patients}
                  initialTab="invoices"
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/cashier"
              element={
                <FrontDeskReceptionCockpit
                  tenant={tenant}
                  user={user}
                  patients={patients}
                  initialTab="cashier"
                />
              }
            />
            <Route
              path="/finance"
              element={
                <Billing
                  tenant={tenant}
                  patients={patients}
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/staff"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <StaffManagement />
                )
              }
            />
            <Route
              path="/settings"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <Settings />
                )
              }
            />
            <Route
              path="/settings/services"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <Settings />
                )
              }
            />
            <Route
              path="/settings/pricing"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <Settings />
                )
              }
            />
            <Route
              path="/audit-logs"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <AuditLogs />
                )
              }
            />
            <Route
              path="/orthophony"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <OrthophonyModule patients={patients} />
                )
              }
            />
            <Route
              path="/psychology"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <PsychologyModule patients={patients} />
                )
              }
            />
            <Route
              path="/psychomotricity"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <PsychomotricityModule patients={patients} />
                )
              }
            />
            <Route
              path="/teletherapy"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <TeletherapyModule />
                )
              }
            />
            <Route
              path="/teletherapy/room/:roomCode"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <TeletherapyRoomView />
                )
              }
            />
            <Route
              path="/teletherapy/studio"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <div className="h-full p-4 flex flex-col">
                    <ClinicalInteractiveCanvas isPractitioner={true} />
                  </div>
                )
              }
            />
            <Route
              path="/ai-therapy"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <AiTherapyHubView patients={patients} />
                )
              }
            />
            <Route
              path="/analytics/ai-analyst"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <AiDataAnalystView />
                )
              }
            />
            <Route
              path="/analytics"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <AiDataAnalystView />
                )
              }
            />
            <Route
              path="/finance/document-processor"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <Billing
                    tenant={tenant}
                    patients={patients}
                    onOpenAddInvoice={() => {
                      setSelectedAppointmentForInvoice(null);
                      setIsInvoiceModalOpen(true);
                    }}
                  />
                )
              }
            />
            <Route
              path="/settings/ai-receptionist"
              element={
                isSecretary ? (
                  <Navigate to="/front-desk" replace />
                ) : (
                  <AiReceptionistSettingsView />
                )
              }
            />
            <Route
              path="/help"
              element={<HelpCenterView />}
            />
            <Route
              path="/help-center"
              element={<HelpCenterView />}
            />
            <Route
              path="/student-offer"
              element={<StudentOfferLandingView />}
            />
            <Route
              path="/students"
              element={<StudentOfferLandingView />}
            />
            <Route
              path="/academic"
              element={<StudentOfferLandingView />}
            />
            <Route
              path="/subscription"
              element={<SubscriptionManagerTab />}
            />
            <Route
              path="/admin-super"
              element={
                <SuperAdminRoute>
                  <SuperAdminDashboardView />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin-super/*"
              element={
                <SuperAdminRoute>
                  <SuperAdminDashboardView />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/super-admin"
              element={
                <SuperAdminRoute>
                  <SuperAdminDashboardView />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin"
              element={
                <SuperAdminRoute>
                  <SuperAdminDashboardView />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/*"
              element={
                <SuperAdminRoute>
                  <SuperAdminDashboardView />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/dashboard"
              element={
                <SuperAdminRoute>
                  <SuperAdminDashboardView />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/tenants"
              element={
                <SuperAdminRoute>
                  <SuperAdminDashboardView />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/superadmin/backups"
              element={
                <SuperAdminRoute>
                  <SuperAdminDashboardView />
                </SuperAdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Real-time Patient Arrival Toast Banner */}
      {arrivedToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="glass-card p-4 rounded-2xl border-2 border-emerald-500/60 bg-slate-950/95 shadow-2xl shadow-emerald-500/20 max-w-sm flex items-start space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 text-xl animate-bounce">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                {t('kiosk.new_arrival_badge') || "Arrivée en Salle d'Attente"}
              </div>
              <h4 className="text-sm font-extrabold text-white truncate mt-0.5">
                {arrivedToast.name}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {arrivedToast.time && <span>RDV : <strong>{arrivedToast.time}</strong></span>}
                {arrivedToast.doctor && <span> &bull; Dr. {arrivedToast.doctor}</span>}
              </p>
            </div>
            <button
              onClick={() => setArrivedToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Global Modals */}
      {isPatientModalOpen && (
        <PatientModal
          isOpen={isPatientModalOpen}
          onClose={() => setIsPatientModalOpen(false)}
          onSuccess={fetchPatients}
        />
      )}
      {isAssessmentModalOpen && (
        <AssessmentModal
          isOpen={isAssessmentModalOpen}
          onClose={() => setIsAssessmentModalOpen(false)}
          patients={patients}
          onSuccess={() => {}}
        />
      )}
      {isSessionModalOpen && (
        <SessionModal
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          patients={patients}
          onSuccess={() => {}}
        />
      )}
      {isAppointmentModalOpen && (
        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          patients={patients}
          user={user}
          tenant={tenant}
          onSuccess={() => {
            if (typeof fetchPatients === 'function') fetchPatients();
          }}
        />
      )}
      {isInvoiceModalOpen && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          patients={patients}
          initialAppointment={selectedAppointmentForInvoice}
          onSuccess={() => {}}
        />
      )}
      {isCreateTenantModalOpen && (
        <CreateTenantModal
          isOpen={isCreateTenantModalOpen}
          onClose={() => setIsCreateTenantModalOpen(false)}
          onSuccess={() => {}}
        />
      )}
      {isRenewModalOpen && (
        <RenewSubscriptionModal
          isOpen={isRenewModalOpen}
          onClose={() => setIsRenewModalOpen(false)}
          currentSubscription={clinicSubData?.subscription}
          plans={clinicSubData?.plans || []}
          paymentDetails={clinicSubData?.payment_details}
          onSuccess={fetchSubData}
        />
      )}
      {/* Clinician In-Office Arrival Toast & Chime Signal */}
      {arrivedToast && (
        <div
          data-testid="clinician-arrival-toast"
          id="clinician-arrival-toast"
          className="fixed bottom-6 left-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/30 flex items-center gap-4 animate-in slide-in-from-bottom-5 max-w-md"
        >
          <div data-testid="doctor-chime-indicator" className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xl shrink-0 animate-bounce">
            🔔
          </div>
          <div className="flex-1 min-w-0 text-right" dir="rtl">
            <div className="flex items-center justify-between gap-2">
              <span data-testid="in-office-call-signal" className="text-xs font-black text-emerald-300">
                إشارة وصول المريض لقاعة الانتظار
              </span>
              <span className="text-[10px] font-mono text-slate-400">{arrivedToast.time}</span>
            </div>
            <h4 className="text-sm font-extrabold text-white truncate mt-0.5">
              {arrivedToast.name} {arrivedToast.token ? `(${arrivedToast.token})` : ''}
            </h4>
            <p className="text-[11px] text-slate-400">
              تسجيل حضور عبر الكيوسك الذكي &bull; جاهز للدخول للجلسة
            </p>
          </div>
          <button
            type="button"
            onClick={() => setArrivedToast(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating AI Support & Knowledge Base Chat Widget */}
      <AiSupportChatWidget />
    </div>
  );
}

function PublicPortalWrapper() {
  const { token } = useParams();
  return <PublicRemoteAssessmentPortal token={token} />;
}

function TeletherapyRoomDispatcher() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const hasPin = searchParams.has('pin');

  // If user is an authenticated clinician and did not follow an external patient PIN invite
  if (user && !hasPin) {
    return <TeletherapyRoomView />;
  }

  // Otherwise, render the public patient/guest teletherapy room
  return <PublicPatientTeletherapyRoom />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/landing" element={<LandingPageView />} />
            <Route path="/help" element={<HelpCenterView />} />
            <Route path="/help-center" element={<HelpCenterView />} />
            <Route path="/guide" element={<HelpCenterView />} />
            <Route path="/register" element={<RegisterView />} />
            <Route path="/login" element={<Login />} />
            <Route path="/student-offer" element={<StudentOfferLandingView />} />
            <Route path="/students" element={<StudentOfferLandingView />} />
            <Route path="/academic" element={<StudentOfferLandingView />} />
            <Route path="/c/:clinicSlug" element={<PublicClinicBookingLandingView />} />
            <Route path="/clinic/:clinicSlug" element={<PublicClinicBookingLandingView />} />
            <Route path="/booking/:clinicSlug" element={<PublicClinicBookingLandingView />} />
            <Route path="/kiosk" element={<KioskCheckIn />} />
            <Route path="/kiosk/:tenantSlug" element={<KioskCheckIn />} />
            <Route path="/public/kiosk" element={<KioskCheckIn />} />
            <Route path="/portal" element={<ParentMobilePortal />} />
            <Route path="/family" element={<ParentMobilePortal />} />
            <Route path="/espace-famille" element={<ParentMobilePortal />} />
            <Route path="/patient-portal" element={<ParentMobilePortal />} />
            <Route path="/portal/parent" element={<ParentMobilePortal />} />
            <Route path="/portal/:token" element={<ParentPortalView />} />
            <Route path="/p/:token" element={<ParentPortalView />} />
            <Route path="/portal/assessment/:token" element={<PublicPortalWrapper />} />
            <Route path="/portal/therapy/:token" element={<PublicRemoteTherapyPortal />} />
            <Route path="/portal/teletherapy/:roomCode" element={<PublicPatientTeletherapyRoom />} />
            <Route path="/pre-intake/:token" element={<ParentPreIntakePortalView />} />
            <Route path="/pre-intake" element={<ParentPreIntakePortalView />} />
            <Route path="/portal/pre-intake/:token" element={<ParentPreIntakePortalView />} />
            <Route path="/portal/pre-intake" element={<ParentPreIntakePortalView />} />
            <Route path="/teletherapy/room/:roomCode" element={<TeletherapyRoomDispatcher />} />
            <Route path="/tv" element={<WaitingRoomTvScreen />} />
            <Route path="/tv/:tenantSlug" element={<WaitingRoomTvScreen />} />
            <Route path="/public/tv-queue" element={<WaitingRoomTvScreen />} />
            <Route path="/public/tv-queue/:tenantSlug" element={<WaitingRoomTvScreen />} />
            <Route path="/tv-queue" element={<WaitingRoomTvScreen />} />
            <Route path="/waiting-room/tv" element={<WaitingRoomTvScreen />} />
            <Route path="/waiting-room-tv" element={<WaitingRoomTvScreen />} />
            <Route path="/speech-matrix" element={<PublicSpeechMatrixView />} />
            <Route path="/orthophony/matrix" element={<PublicSpeechMatrixView />} />
            <Route path="/demo/articulation-matrix" element={<PublicSpeechMatrixView />} />
            <Route path="/demo/speech-matrix" element={<PublicSpeechMatrixView />} />
            <Route
              path="/therapy/demo/naming"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-3xl">
                    <NamingTherapyModule />
                  </div>
                </div>
              }
            />
            <Route
              path="/therapy/demo/spaced-retrieval"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-3xl">
                    <SpacedRetrievalModule />
                  </div>
                </div>
              }
            />
            <Route
              path="/therapy/demo/apraxia"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <ApraxiaVideoModule />
                  </div>
                </div>
              }
            />
            <Route
              path="/therapy/demo/aac"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <AlphaTopicsAAC />
                  </div>
                </div>
              }
            />
            <Route
              path="/therapy/demo/visual-attention"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <VisualAttentionModule />
                  </div>
                </div>
              }
            />
            <Route
              path="/therapy/demo/dysphagia"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <DysphagiaProtocolGuide />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/elo"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <InteractiveAssessmentRunner testCode="ELO" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/bdi"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <InteractiveAssessmentRunner testCode="BDI_II" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/wisc"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="WISC_V" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/alouette"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <InteractiveAssessmentRunner testCode="ALOUETTE_R" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/mchat"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <InteractiveAssessmentRunner testCode="M_CHAT" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/vineland"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <InteractiveAssessmentRunner testCode="VINELAND_II" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/projective"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="CAT" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/do80"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <InteractiveAssessmentRunner testCode="DO80" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/attention"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="D2_STROOP" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/anxiety"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <InteractiveAssessmentRunner testCode="STAI_Y" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/zareki"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <InteractiveAssessmentRunner testCode="ZAREKI_R" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/raven"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <InteractiveAssessmentRunner testCode="RAVEN_CPM" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/rey"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="REY_FCR" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/drawing"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-4xl">
                    <InteractiveAssessmentRunner testCode="DESSIN_BONHOMME" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/nepsy"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="NEPSY_II" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/ados2"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="ADOS_2" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/adir"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="ADI_R" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/l2ma"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="L2MA" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/neel"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="N_EEL" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/cms"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="CMS" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/mem4"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="MEM_IV" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/becs"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="BECS" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/csbs"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="CSBS" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/behavior"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="ECHA_ECAA" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/pattenoire"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="PATTE_NOIRE" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/sceno"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="SCENO_TEST" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/tat"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="TAT" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/school-readiness"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="TMS" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/traumaq"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="TRAUMAQ" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/stress-coping"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="STR_CISS" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/wais"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="WAIS_IV" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/wppsi"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="WPPSI_IV" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/o52"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="O52" />
                  </div>
                </div>
              }
            />
            <Route
              path="/assessments/run/vocim"
              element={
                <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
                  <div className="w-full max-w-5xl">
                    <InteractiveAssessmentRunner testCode="VOCIM" />
                  </div>
                </div>
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <ClinicApp />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
