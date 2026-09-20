import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Activity, 
  Brain, 
  Stethoscope, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Building, 
  CheckCircle2,
  Globe
} from 'lucide-react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { getTenantSubdomain } from '../utils/subdomain';

const DEMO_ACCOUNTS = [
  {
    title: 'Cabinet Orthophonie Alger',
    titleAr: 'عيادة الأرطوفونيا والتخاطب بالجزائر',
    subdomain: 'elbiar-ortho',
    type: 'orthophony',
    email: 'admin@elbiar-ortho.dz',
    role: 'Clinic Admin (Orthophonie)',
    badge: 'Orthophonie',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    icon: Stethoscope,
  },
  {
    title: 'Clinique Psychologie Oran',
    titleAr: 'عيادة الصحة النفسية بوهران',
    subdomain: 'oran-psy',
    type: 'psychology',
    email: 'admin@oran-psy.dz',
    role: 'Clinic Admin (Psychologie)',
    badge: 'Psychologie',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: Brain,
  },
  {
    title: 'Centre Pluridisciplinaire Constantine',
    titleAr: 'المركز متعدد التخصصات بقسنطينة',
    subdomain: 'constantine-sante',
    type: 'multidisciplinary',
    email: 'admin@constantine-sante.dz',
    role: 'Clinic Admin (Pluridisciplinaire)',
    badge: 'Pluridisciplinaire',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: Sparkles,
  },
  {
    title: 'Super Administrateur',
    titleAr: 'المشرف العام (Superadmin)',
    subdomain: '',
    type: 'superadmin',
    email: 'superadmin@clinic-saas.dz',
    role: 'Superadmin (Global)',
    badge: 'Superadmin',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: ShieldCheck,
  }
];

export default function Login() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'ar';
  const isAr = currentLang.startsWith('ar');
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const hostSubdomain = getTenantSubdomain();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState(hostSubdomain || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleLanguage = (lng) => {
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem('app_language', lng);
      localStorage.setItem('i18nextLng', lng);
      localStorage.setItem('locale', lng);
      if (typeof document !== 'undefined') {
        document.cookie = `app_language=${lng};path=/;max-age=31536000;SameSite=Lax`;
        document.cookie = `locale=${lng};path=/;max-age=31536000;SameSite=Lax`;
        document.cookie = `i18nextLng=${lng};path=/;max-age=31536000;SameSite=Lax`;
      }
    } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const activeSubdomain = hostSubdomain || subdomain || undefined;
      const res = await authApi.login({
        email: email.trim(),
        password,
        subdomain: activeSubdomain,
      });

      localStorage.removeItem('is_impersonating');
      localStorage.removeItem('impersonating_clinic_name');
      localStorage.removeItem('backup_superadmin_token');
      localStorage.removeItem('superadmin_backup_token');
      sessionStorage.removeItem('superadmin_backup_token');
      sessionStorage.removeItem('superadmin_impersonating_tenant');

      login(res.user, res.tenant, res.access_token || res.token);

      // Handle cross-subdomain redirect if needed
      if (res.redirect_url && window.location.hostname !== `${res.tenant?.subdomain}.psypro.tech` && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        localStorage.setItem('token', res.access_token || res.token);
        localStorage.setItem('auth_token', res.access_token || res.token);
      }

      if (res.user.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || t('common.error', 'فشل تسجيل الدخول'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (account) => {
    setEmail(account.email);
    setPassword('password123');
    setSubdomain(account.subdomain || '');
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans" 
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Background Decorative Blur Orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language selector in top bar */}
      <div className={`absolute top-6 ${isAr ? 'left-6' : 'right-6'} z-20 flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs shadow-xl backdrop-blur-md`}>
        <button
          type="button"
          onClick={() => toggleLanguage('ar')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
            isAr ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🇩🇿</span>
          <span>العربية</span>
        </button>
        <button
          type="button"
          onClick={() => toggleLanguage('fr')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
            !isAr ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🇫🇷</span>
          <span>Français</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/30 mb-4 border border-slate-700/80 bg-slate-950 p-1">
          <img src="/psysnap-logo.png" alt="PsySnap" className="w-full h-full object-cover rounded-2xl" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {t('app_name', isAr ? 'PsySnap — المنظومة الإكلينيكية والطبية' : 'PsySnap — Clinical Medical Cockpit')}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          {t('auth.login_subtitle', isAr ? 'سجل الدخول لإدارة الملفات السريرية، المواعيد والتقارير الطبية' : 'Connectez-vous pour gérer les dossiers cliniques, rendez-vous et bilans')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10 px-0 sm:px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-800">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 text-start">
                {t('auth.email_label', isAr ? 'البريد الإلكتروني' : 'Adresse Email')}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (!hostSubdomain) {
                      setSubdomain('');
                    }
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-mono"
                  placeholder="nom@clinique.dz"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 text-start">
                {t('auth.password_label', isAr ? 'كلمة المرور' : 'Mot de passe')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (!hostSubdomain) {
                      setSubdomain('');
                    }
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-mono"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-black text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>
                {loading 
                  ? t('auth.logging_in', isAr ? 'جارٍ تسجيل الدخول...' : 'Connexion en cours...') 
                  : t('auth.login_btn', isAr ? 'تسجيل الدخول' : 'Se connecter')}
              </span>
            </button>

            {/* Link to Registration with language preservation */}
            <div className="pt-2 text-center">
              <span className="text-xs text-slate-400">
                {isAr ? 'ليس لديك عيادة مسجلة بعد؟' : "Vous n'avez pas encore de compte ?"}
              </span>{' '}
              <Link
                to={isAr ? "/register" : "/register?lang=fr"}
                className="text-xs font-bold text-brand-400 hover:text-brand-300 underline underline-offset-4 transition"
              >
                {isAr ? 'تسجيل عيادة جديدة (14 يوماً مجاناً)' : 'Créer un cabinet (14 jours gratuits)'}
              </Link>
            </div>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3.5">
              <p className="text-xs font-bold text-amber-400 tracking-wide text-start">
                {t('auth.demo_accounts', isAr ? '⚡ حسابات تجريبية سريعة بنقرة واحدة:' : '⚡ Comptes de démonstration rapides :')}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">1-Click Fill</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`p-3.5 rounded-2xl border text-start transition-all flex items-start gap-3 w-full overflow-hidden ${
                      isSelected
                        ? 'bg-brand-500/20 border-brand-500/50 shadow-md ring-1 ring-brand-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 text-brand-400 mt-0.5 shadow-sm">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-xs font-black text-white truncate">
                          {isAr ? acc.titleAr : acc.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate" dir="ltr">
                        {acc.email}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${acc.badgeColor}`}>
                        {acc.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
