import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Brain, 
  Stethoscope, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Lock,
  Mail,
  Building,
  CheckCircle2
} from 'lucide-react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  {
    title: 'Cabinet Orthophonie Alger',
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
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('admin@elbiar-ortho.dz');
  const [password, setPassword] = useState('password123');
  const [subdomain, setSubdomain] = useState('elbiar-ortho');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({
        email,
        password,
        subdomain: subdomain || undefined,
      });

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
      setError(err.message || t('common.error') || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (account) => {
    setEmail(account.email);
    setPassword('password123');
    setSubdomain(account.subdomain);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden" dir={currentLang.startsWith('ar') ? 'rtl' : 'ltr'}>
      {/* Language selector */}
      <div className="absolute top-6 right-6 z-20 flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs shadow-lg">
        <button
          onClick={() => toggleLanguage('ar')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            currentLang.startsWith('ar') ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🇩🇿 العربية
        </button>
        <button
          onClick={() => toggleLanguage('fr')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            currentLang.startsWith('fr') ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🇫🇷 Français
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-cyan-500 text-white shadow-2xl shadow-brand-500/30 mb-4 border border-white/10">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          {t('app_name') || 'منصة إدارة العيادات السريرية'}
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          {t('auth.login_subtitle') || 'سجل الدخول لإدارة الملفات السريرية، المواعيد والتقارير الطبية'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4">
        <div className="glass-modal py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-800">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center space-x-3 space-x-reverse">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                {t('auth.email_label') || 'البريد الإلكتروني'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  placeholder="nom@clinique.dz"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                {t('auth.password_label') || 'كلمة المرور'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
            >
              <span>{loading ? (t('auth.logging_in') || 'جارٍ تسجيل الدخول...') : (t('auth.login_btn') || 'تسجيل الدخول')}</span>
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {t('auth.demo_accounts') || 'حسابات تجريبية سريعة بنقرة واحدة:'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-start space-x-3 space-x-reverse ${
                      isSelected
                        ? 'bg-brand-500/15 border-brand-500/40 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0 text-brand-400 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{acc.title}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{acc.email}</p>
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
