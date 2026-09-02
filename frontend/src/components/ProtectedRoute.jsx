import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingPageView from './public/LandingPageView';
import TenantLoginView from './auth/TenantLoginView';
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
    // If guest visitor on a clinic subdomain, ALWAYS render the branded TenantLoginView
    if (onSubdomain) {
      return <TenantLoginView />;
    }

    // If guest visitor at root '/' on main platform, render Landing Page
    if (location.pathname === '/') {
      return <LandingPageView />;
    }
    
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
