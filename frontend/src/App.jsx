import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FeatureFlagsProvider } from './context/FeatureFlagsContext';
import { patientApi } from './api';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Assessments from './components/Assessments';
import TherapySessions from './components/TherapySessions';
import Appointments from './components/Appointments';
import Billing from './components/Billing';
import Kiosk from './components/Kiosk';
import PatientModal from './components/PatientModal';
import AssessmentModal from './components/AssessmentModal';
import SessionModal from './components/SessionModal';
import AppointmentModal from './components/AppointmentModal';
import InvoiceModal from './components/InvoiceModal';
import SuperadminDashboard from './components/Superadmin/SuperadminDashboard';
import SuperAdminDashboardView from './components/super-admin/SuperAdminDashboardView';
import AiTherapyHubView from './components/ai-therapy/AiTherapyHubView';
import TenantManagement from './components/Superadmin/TenantManagement';
import CreateTenantModal from './components/Superadmin/CreateTenantModal';
import DatabaseBackups from './components/Superadmin/DatabaseBackups';
import { OrthophonyModule, PsychologyModule } from './components/SpecialtyModules';
import Login from './components/Login';
import AiSupportChatWidget from './components/common/AiSupportChatWidget';
import AiReceptionistSettingsView from './components/settings/AiReceptionistSettingsView';
import AiDataAnalystView from './components/analytics/AiDataAnalystView';
import DocumentProcessorView from './components/finance/DocumentProcessorView';
import TestsBankView from './components/therapy/TestsBankView';
import HelpCenterView from './components/help/HelpCenterView';
import StaffManagementView from './components/settings/StaffManagementView';
import AuditLogsView from './components/settings/AuditLogsView';
import ClinicSettingsView from './components/settings/ClinicSettingsView';
import CustomDomainSettingsView from './components/settings/CustomDomainSettingsView';

function ClinicApp() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);

  // Modals state
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCreateTenantModalOpen, setIsCreateTenantModalOpen] = useState(false);
  const [selectedAppointmentForInvoice, setSelectedAppointmentForInvoice] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchPatients = async () => {
    try {
      const response = await patientApi.list({ per_page: 50 });
      setPatients(response.data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      fetchPatients();
    }
  }, [user]);

  const handleOpenInvoiceForAppointment = (app) => {
    setSelectedAppointmentForInvoice(app);
    setIsInvoiceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans" dir="rtl">
      {/* Top Navbar */}
      <Navbar 
        user={user} 
        tenant={tenant} 
        onLogout={logout} 
        onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)} 
      />

      {/* Main Container */}
      <div className="flex-1 flex w-full relative">
        <Sidebar 
          tenant={tenant} 
          user={user} 
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:mr-72 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                user?.role === 'superadmin' ? (
                  <Navigate to="/superadmin" replace />
                ) : (
                  <Dashboard
                    tenant={tenant}
                    user={user}
                    patients={patients}
                    onOpenAddPatient={() => setIsPatientModalOpen(true)}
                    onOpenAddAssessment={() => setIsAssessmentModalOpen(true)}
                    onOpenAddSession={() => setIsSessionModalOpen(true)}
                    onOpenAddAppointment={() => setIsAppointmentModalOpen(true)}
                    onOpenAddInvoice={() => {
                      setSelectedAppointmentForInvoice(null);
                      setIsInvoiceModalOpen(true);
                    }}
                    onEnterKiosk={() => navigate('/kiosk')}
                    setActiveTab={(tab) => navigate(tab === 'dashboard' ? '/' : `/${tab}`)}
                  />
                )
              }
            />

            <Route
              path="/dashboard"
              element={<Navigate to="/" replace />}
            />

            {/* Superadmin Full Suite Routes */}
            <Route
              path="/superadmin"
              element={<SuperAdminDashboardView />}
            />
            <Route
              path="/superadmin/*"
              element={<SuperAdminDashboardView />}
            />
            <Route
              path="/admin-super/*"
              element={<SuperAdminDashboardView />}
            />
            <Route
              path="/ai-therapy"
              element={<AiTherapyHubView />}
            />

            {/* Clinical App Routes */}
            <Route
              path="/patients"
              element={
                <Patients
                  patients={patients}
                  loading={false}
                  onRefresh={fetchPatients}
                  onOpenAddPatient={() => setIsPatientModalOpen(true)}
                  onOpenAddAssessment={() => setIsAssessmentModalOpen(true)}
                  onOpenAddSession={() => setIsSessionModalOpen(true)}
                  tenant={tenant}
                />
              }
            />

            <Route
              path="/appointments"
              element={
                <Appointments
                  tenant={tenant}
                  patients={patients}
                  onOpenAddAppointment={() => setIsAppointmentModalOpen(true)}
                  onOpenAddInvoiceForAppointment={handleOpenInvoiceForAppointment}
                />
              }
            />

            <Route
              path="/assessments"
              element={
                <Assessments
                  tenant={tenant}
                  patients={patients}
                  onOpenAddAssessment={() => setIsAssessmentModalOpen(true)}
                />
              }
            />

            <Route
              path="/sessions"
              element={
                <TherapySessions
                  tenant={tenant}
                  patients={patients}
                  onOpenAddSession={() => setIsSessionModalOpen(true)}
                />
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
              path="/orthophony"
              element={<OrthophonyModule patients={patients} />}
            />

            <Route
              path="/psychology"
              element={<PsychologyModule patients={patients} />}
            />

            <Route
              path="/settings/ai-receptionist"
              element={<AiReceptionistSettingsView />}
            />

            <Route
              path="/analytics/ai-analyst"
              element={<AiDataAnalystView />}
            />

            <Route
              path="/finance/document-processor"
              element={<DocumentProcessorView />}
            />

            {/* Tests & Exercises Bank Routes */}
            <Route
              path="/clinical-tests"
              element={<TestsBankView patients={patients} tenant={tenant} />}
            />
            <Route
              path="/tests-bank"
              element={<TestsBankView patients={patients} tenant={tenant} />}
            />
            <Route
              path="/therapy"
              element={<TestsBankView patients={patients} tenant={tenant} />}
            />
            <Route
              path="/exercises"
              element={<TestsBankView patients={patients} tenant={tenant} />}
            />
            <Route
              path="/exercises-bank"
              element={<TestsBankView patients={patients} tenant={tenant} />}
            />

            {/* Staff & Team Management */}
            <Route
              path="/staff"
              element={<StaffManagementView tenant={tenant} user={user} />}
            />
            <Route
              path="/settings/users"
              element={<StaffManagementView tenant={tenant} user={user} />}
            />

            {/* Audit Logs & Security */}
            <Route
              path="/audit-logs"
              element={<AuditLogsView tenant={tenant} user={user} />}
            />
            <Route
              path="/settings/logs"
              element={<AuditLogsView tenant={tenant} user={user} />}
            />

            {/* Clinic Settings & Branding */}
            <Route
              path="/settings"
              element={<ClinicSettingsView tenant={tenant} user={user} />}
            />
            <Route
              path="/settings/clinic"
              element={<ClinicSettingsView tenant={tenant} user={user} />}
            />
            <Route
              path="/settings/branding"
              element={<ClinicSettingsView tenant={tenant} user={user} />}
            />
            <Route
              path="/settings/visual-identity"
              element={<ClinicSettingsView tenant={tenant} user={user} />}
            />
            <Route
              path="/settings/domains"
              element={<CustomDomainSettingsView tenant={tenant} user={user} />}
            />
            <Route
              path="/settings/custom-domain"
              element={<CustomDomainSettingsView tenant={tenant} user={user} />}
            />

            {/* Waiting Room Route */}
            <Route
              path="/waiting-room"
              element={
                <Dashboard
                  tenant={tenant}
                  user={user}
                  patients={patients}
                  onOpenAddPatient={() => setIsPatientModalOpen(true)}
                  onOpenAddAssessment={() => setIsAssessmentModalOpen(true)}
                  onOpenAddSession={() => setIsSessionModalOpen(true)}
                  onOpenAddAppointment={() => setIsAppointmentModalOpen(true)}
                  onOpenAddInvoice={() => {
                    setSelectedAppointmentForInvoice(null);
                    setIsInvoiceModalOpen(true);
                  }}
                  onEnterKiosk={() => navigate('/kiosk')}
                  setActiveTab={(tab) => navigate(tab === 'dashboard' ? '/' : `/${tab}`)}
                />
              }
            />

            {/* Kiosk Screen Route */}
            <Route
              path="/kiosk"
              element={<Kiosk tenant={tenant} />}
            />

            {/* Help & Documentation Routes */}
            <Route
              path="/help"
              element={<HelpCenterView />}
            />
            <Route
              path="/help-guide"
              element={<HelpCenterView />}
            />

            {/* Analytics Route Alias */}
            <Route
              path="/analytics"
              element={<AiDataAnalystView />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Patient Creation Modal */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={fetchPatients}
        tenant={tenant}
      />

      {/* Assessment Creation Modal */}
      <AssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        onSuccess={fetchPatients}
        patients={patients}
        tenant={tenant}
      />

      {/* Therapy Session Modal */}
      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onSuccess={fetchPatients}
        patients={patients}
        tenant={tenant}
      />

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSuccess={fetchPatients}
        patients={patients}
        user={user}
        tenant={tenant}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedAppointmentForInvoice(null);
        }}
        onSuccess={fetchPatients}
        patients={patients}
        tenant={tenant}
        preselectedAppointment={selectedAppointmentForInvoice}
      />

      {/* Superadmin Create Tenant Modal */}
      <CreateTenantModal
        isOpen={isCreateTenantModalOpen}
        onClose={() => setIsCreateTenantModalOpen(false)}
        onSuccess={() => {
          // If on superadmin page, refresh will happen via subcomponent
        }}
      />

      {/* Real-time Conversational AI Support Assistant (RAG) */}
      <AiSupportChatWidget />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FeatureFlagsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Kiosk Route */}
            <Route path="/kiosk" element={<Kiosk />} />

            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
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
      </FeatureFlagsProvider>
    </AuthProvider>
  );
}
