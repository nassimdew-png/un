import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import TabletLayout from './layouts/TabletLayout';

// Pages & Components
import Login from './pages/auth/Login';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import AppointmentsCalendar from './pages/appointments/AppointmentsCalendar';
import PatientList from './pages/patients/PatientList';
import PatientDetails from './pages/patients/PatientDetails';
import BilanGenerator from './pages/orthophonie/BilanGenerator';
import SessionNotes from './pages/psychology/SessionNotes';
import ScaleScorer from './pages/psychology/ScaleScorer';
import KioskSession from './pages/tablet/KioskSession';
import CustomDomainSettingsView from './components/settings/CustomDomainSettingsView';
import PublicClinicMiniSiteView from './components/public/PublicClinicMiniSiteView';
import ClinicalTestsView from './components/clinic/ClinicalTestsView';
import ExercisesBankView from './components/clinic/ExercisesBankView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Clinic Mini-Site & Direct Booking Routes */}
        <Route path="/c/:slug" element={<PublicClinicMiniSiteView />} />
        <Route path="/c" element={<PublicClinicMiniSiteView />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />

        {/* Tablet Kiosk Layout & Routes */}
        <Route element={<TabletLayout />}>
          <Route path="/tablet/kiosk" element={<KioskSession />} />
        </Route>

        {/* Main Specialist / Admin Layout */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Navigate to="/appointments" replace />} />
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/*" element={<SuperAdminDashboard />} />
          <Route path="/appointments" element={<AppointmentsCalendar />} />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/patients/:id" element={<PatientDetails />} />
          <Route path="/orthophonie/bilan" element={<BilanGenerator />} />
          <Route path="/psychology/session-notes" element={<SessionNotes />} />
          <Route path="/psychology/scales" element={<ScaleScorer />} />
          
          {/* 1. Clinical Tests & Scales Bank */}
          <Route path="/clinical-tests" element={<ClinicalTestsView />} />
          <Route path="/tests-bank" element={<Navigate to="/clinical-tests" replace />} />

          {/* 2. Exercises & Workbooks Bank */}
          <Route path="/exercises-bank" element={<ExercisesBankView />} />
          <Route path="/exercises" element={<Navigate to="/exercises-bank" replace />} />
          
          <Route path="/settings/domains" element={<CustomDomainSettingsView />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/appointments" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
