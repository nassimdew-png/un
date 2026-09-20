import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

export default function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans">
        <div className="space-y-3 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto" />
          <div className="text-xs font-mono text-slate-500">جاري التحقق من صلاحيات المدير العام...</div>
        </div>
      </div>
    );
  }

  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  const isSuperAdmin = user?.is_super_admin === true || user?.role === 'superadmin' || user?.role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-right font-sans" dir="rtl">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">صلاحيات المدير العام مطلوبة</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            هذه الصفحة مخصصة حصرياً لمديري المنصة السحابية (Super Administrators). حسابك الحالي لا يمتلك صلاحيات الوصول لهذه الوحدة المركزية.
          </p>
          <div className="pt-2">
            <a
              href="/dashboard"
              className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition"
            >
              العودة إلى لوحة العيادة
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
