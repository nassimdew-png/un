import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Lock, 
  Mail, 
  MapPin, 
  Phone, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Activity,
  ArrowRight,
  Stethoscope,
  Brain,
  Globe
} from 'lucide-react';
import { authApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { getTenantSubdomain } from '../../utils/subdomain';

export default function TenantLoginView() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'ar';
  const navigate = useNavigate();
  const { login } = useAuth();

  const subdomain = getTenantSubdomain();

  const [clinic, setClinic] = useState(null);
  const [loadingClinic, setLoadingClinic] = useState(true);
  const [clinicError, setClinicError] = useState(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const toggleLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  useEffect(() => {
    const fetchClinicInfo = async () => {
      setLoadingClinic(true);
      setClinicError(null);
      try {
        const res = await authApi.getPublicTenantInfo(subdomain);
        if (res.success && res.clinic) {
          setClinic(res.clinic);
        } else {
          setClinicError('تعذر العثور على بيانات العيادة على هذا النطاق.');
        }
      } catch (err) {
        console.error('Error fetching tenant info:', err);
        setClinicError(err.message || 'العيادة غير موجودة أو تم حذفها.');
      } finally {
        setLoadingClinic(false);
      }
    };

    if (subdomain) {
      fetchClinicInfo();
    } else {
      setLoadingClinic(false);
    }
  }, [subdomain]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);

    try {
      const res = await authApi.login({
        email,
        password,
        subdomain: subdomain || undefined,
      });

      login(res.user, res.tenant, res.access_token || res.token);

      if (res.user?.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setAuthError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.');
    } finally {
      setSubmitting(false);
    }
  };

  const accentColor = clinic?.report_accent_color || '#0d9488';

  if (loadingClinic) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-teal-500/20 border-t-teal-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-bold animate-pulse">جارٍ تحميل فضاء العيادة...</p>
      </div>
    );
  }

  if (clinicError && !clinic) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-3xl mb-4 shadow-xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-black text-white mb-2">النطاق غير مسجل</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{clinicError}</p>
        <a
          href="https://psypro.tech"
          className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-lg transition"
        >
          العودة للمنصة الرئيسية (PsyPro)
        </a>
      </div>
    );
  }

  const clinicName = clinic?.header_title_ar || clinic?.name || 'فضاء العيادة السريرية';
  const clinicNameFr = clinic?.header_title_fr || '';
  const specialtyLabel = clinic?.type === 'orthophony' 
    ? 'عيادة متخصصة في الأرطوفونيا وإعادة التأهيل'
    : clinic?.type === 'psychology'
    ? 'عيادة متخصصة في علم النفس والعيادي'
    : 'مركز واستشارات طبية ونفسية متعددة التخصصات';

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      dir={currentLang.startsWith('ar') ? 'rtl' : 'ltr'}
    >
      {/* Background Glow Effect */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header Language & Domain Indicator */}
      <div className="absolute top-6 right-6 left-6 z-20 flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
          <Globe className="w-3.5 h-3.5 text-teal-400" />
          <span>{subdomain}.psypro.tech</span>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs shadow-lg backdrop-blur-md">
          <button
            onClick={() => toggleLanguage('ar')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              currentLang.startsWith('ar') ? 'bg-teal-600 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🇩🇿 العربية
          </button>
          <button
            onClick={() => toggleLanguage('fr')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              currentLang.startsWith('fr') ? 'bg-teal-600 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🇫🇷 Français
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="text-center mb-6">
          {/* Clinic Logo or Monogram */}
          {clinic?.logo_url ? (
            <div className="inline-flex p-3 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl mb-4 backdrop-blur-md">
              <img 
                src={clinic.logo_url} 
                alt={clinicName} 
                className="w-16 h-16 object-contain rounded-2xl"
              />
            </div>
          ) : (
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-3xl text-slate-950 font-black shadow-2xl mb-4 text-2xl border border-white/20"
              style={{ backgroundColor: accentColor }}
            >
              {clinicName.charAt(0) || '🏥'}
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {clinicName}
          </h1>
          {clinicNameFr && (
            <p className="text-xs text-slate-400 font-medium mt-0.5">{clinicNameFr}</p>
          )}

          {/* Specialty & Location Pill */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>{specialtyLabel}</span>
            </span>
            {clinic?.wilaya && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{clinic.wilaya}</span>
              </span>
            )}
          </div>
        </div>

        {/* Login Box */}
        <div className="glass-modal p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl">
          <div className="mb-5 pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white">تسجيل الدخول إلى فضاء العيادة</h3>
              <p className="text-xs text-slate-400">بوابة آمنة مخصصة للفريق الطبي والإداري</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-800 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {authError && (
            <div className="mb-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                البريد الإلكتروني (Email):
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@clinique.dz"
                  className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور (Mot de passe):
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 py-3.5 px-4 rounded-xl text-slate-950 font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              <span>{submitting ? 'جارٍ التحقق والمصادقة...' : 'الدخول إلى فضاء العمل'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
            <span>نظام سريري مشفر ومحمي بمعايير أمان البيانات الطبية &bull; PsyPro Clinical OS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
