import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TenantLoginView from './auth/TenantLoginView';
import PublicClinicBookingLandingView from './portal/PublicClinicBookingLandingView';
import LandingPageView from './public/LandingPageView';
import HelpCenterView from './help/HelpCenterView';
import { isSubdomain } from '../utils/subdomain';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
  const onSubdomain = isSubdomain();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans">
        <div className="space-y-3 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto" />
          <div className="text-xs font-mono text-slate-500">جاري التحقق من الجلسة السحابية...</div>
        </div>
      </div>
    );
  }

  if (!user && !token) {
    // If visitor is on a clinic subdomain:
    if (onSubdomain) {
      // If staff explicitly visits /login, /admin, or any protected clinical route -> show staff login screen
      if (
        location.pathname === '/login' || 
        location.pathname === '/admin' || 
        location.pathname === '/auth' ||
        location.pathname.startsWith('/dashboard') ||
        location.pathname.startsWith('/clinic') ||
        location.pathname.startsWith('/billing') ||
        location.pathname.startsWith('/treasury') ||
        location.pathname.startsWith('/cash') ||
        location.pathname.startsWith('/receipts') ||
        location.pathname.startsWith('/appointments') ||
        location.pathname.startsWith('/patients') ||
        location.pathname.startsWith('/sessions') ||
        location.pathname.startsWith('/settings') ||
        location.pathname.startsWith('/staff') ||
        location.pathname.startsWith('/clinical-tests')
      ) {
        return <TenantLoginView />;
      }
      // Otherwise (visiting root / or any public booking page) -> show the Clinic Landing Page & Online Booking directly!
      return <PublicClinicBookingLandingView />;
    }

    // On root platform domain (psypro.tech / psysnap.com)
    // Allow public access to Landing, Help Center & Clinical Guide
    if (
      location.pathname === '/' ||
      location.pathname === '/landing' ||
      location.pathname === '/help' ||
      location.pathname === '/help-center' ||
      location.pathname === '/guide'
    ) {
      if (
        location.pathname === '/help' ||
        location.pathname === '/help-center' ||
        location.pathname === '/guide'
      ) {
        return <HelpCenterView />;
      }
      return <LandingPageView />;
    }

    // Otherwise attempting to access protected dashboard/clinical routes -> navigate to login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
