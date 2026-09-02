import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  ShieldCheck, 
  ArrowLeftRight, 
  Volume2, 
  VolumeX, 
  Users, 
  Bell,
  Sparkles,
  Wifi,
  WifiOff,
  Download,
  RefreshCw
} from 'lucide-react';
import { isSoundEnabled, toggleSound } from '../utils/soundNotifier';
import { offlineSyncService } from '../services/offlineSync';

export default function Navbar({ tenant, user, onLogout, waitingCount = 0, onOpenWaitingModal, onToggleMobileMenu }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentLang = i18n.language || 'ar';
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  // Offline Sync State
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // PWA Install Prompt State
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);

  useEffect(() => {
    // 1. Connectivity Listeners
    const handleConnectivity = (e) => {
      setIsOnline(e.detail?.isOnline ?? navigator.onLine);
    };

    const handleQueueChange = (e) => {
      setPendingSyncCount(e.detail?.count || 0);
    };

    window.addEventListener('clinic:connectivity-changed', handleConnectivity);
    window.addEventListener('clinic:sync-queue-updated', handleQueueChange);

    offlineSyncService.getPendingSyncCount().then(setPendingSyncCount);

    // 2. PWA Install Prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('clinic:connectivity-changed', handleConnectivity);
      window.removeEventListener('clinic:sync-queue-updated', handleQueueChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      await offlineSyncService.syncAllOfflineData();
      const count = await offlineSyncService.getPendingSyncCount();
      setPendingSyncCount(count);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  let isImpersonating = false;
  try {
    isImpersonating = localStorage.getItem('is_impersonating') === 'true' || 
                      !!sessionStorage.getItem('superadmin_backup_token') || 
                      !!localStorage.getItem('backup_superadmin_token') || 
                      !!localStorage.getItem('superadmin_backup_token');
  } catch (e) {
    isImpersonating = false;
  }

  const toggleLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleToggleSound = () => {
    const nextState = toggleSound();
    setSoundOn(nextState);
  };

  const handleExitImpersonation = () => {
    try {
      const backupToken = localStorage.getItem('backup_superadmin_token') || 
                          localStorage.getItem('superadmin_backup_token') || 
                          sessionStorage.getItem('superadmin_backup_token');
      if (backupToken) {
        localStorage.setItem('token', backupToken);
        localStorage.setItem('clinic_token', backupToken);
        localStorage.setItem('auth_token', backupToken);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('clinic_token');
        localStorage.removeItem('auth_token');
      }
      localStorage.removeItem('backup_superadmin_token');
      localStorage.removeItem('superadmin_backup_token');
      sessionStorage.removeItem('superadmin_backup_token');
      sessionStorage.removeItem('superadmin_impersonating_tenant');
      localStorage.removeItem('is_impersonating');
      localStorage.removeItem('impersonating_clinic_name');

      const targetUrl = window.location.hostname.includes('psypro.tech') ? 'https://psypro.tech/superadmin' : '/superadmin';
      window.location.href = targetUrl;
    } catch (e) {
      window.location.href = '/superadmin';
    }
  };

  return (
    <>
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg sticky top-0 z-50 border-b border-amber-500">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-base">⚠️</span>
            <span>
              أنت تتصفح الآن بصلاحية أدمن العيادة: <strong className="font-black text-slate-900">{tenant?.name || localStorage.getItem('impersonating_clinic_name') || 'العيادة'}</strong> {tenant?.subdomain ? `(${tenant.subdomain}.psypro.tech)` : ''}
            </span>
          </div>

          <button
            onClick={handleExitImpersonation}
            className="px-3.5 py-1.5 rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 border border-slate-800 text-xs font-black flex items-center space-x-1.5 space-x-reverse shadow-md transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>إنهاء وضع المعاينة والعودة للوحة الإدارة العامة</span>
          </button>
        </div>
      )}

      <header className="h-16 glass-nav px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 border-b border-slate-800/80">
        <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
          {/* Hamburger Menu on Mobile */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-brand-500/25">
              🩺
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2 space-x-reverse">
                <span>{tenant ? tenant.name : 'ClinicSaaS DZ'}</span>
                {tenant?.subdomain && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono hidden md:inline">
                    {tenant.subdomain}.psypro.tech
                  </span>
                )}
              </h1>
              <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-400">
                <span className="capitalize">{tenant?.type || 'Plateforme Médicale'}</span>
                {user?.role === 'superadmin' && (
                  <span className="inline-flex items-center space-x-1 space-x-reverse text-[11px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{t('auth.superadmin_role') || 'Superadmin'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 space-x-reverse">
          {/* PWA Install Button */}
          {deferredInstallPrompt && (
            <button
              onClick={handleInstallPWA}
              className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-black flex items-center space-x-1.5 space-x-reverse shadow-md transition animate-pulse"
              title="تثبيت التطبيق على جهاز الكمبيوتر أو الهاتف"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">📲 تثبيت التطبيق</span>
            </button>
          )}

          {/* Connectivity Status & Offline Sync Badge */}
          <div className="flex items-center">
            {isOnline ? (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center space-x-1.5 space-x-reverse transition hover:bg-emerald-500/20"
                title={pendingSyncCount > 0 ? `يوجد ${pendingSyncCount} تعديل محفوظ محلياً، انقر للمزامنة` : 'الاتصال متوفر ومستقر'}
              >
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">متصل</span>
                {pendingSyncCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                    {pendingSyncCount}
                  </span>
                )}
              </button>
            ) : (
              <div 
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black flex items-center space-x-1.5 space-x-reverse animate-pulse"
                title="أنت تعمل حالياً بدون اتصال - كافة العمليات يتم حفظها في IndexedDB تلقائياً"
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>بدون اتصال {pendingSyncCount > 0 ? `(${pendingSyncCount})` : ''}</span>
              </div>
            )}
          </div>

          {/* Live Waiting Room Badge */}
          {user?.role !== 'superadmin' && (
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all shadow-sm ${
                waitingCount > 0
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
              title={t('kiosk.waiting_room') || 'Salle d\'Attente'}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-extrabold">{waitingCount}</span>
              <span className="hidden lg:inline">{t('kiosk.in_waiting_room') || 'en attente'}</span>
            </button>
          )}

          {/* Sound Toggle (Chime Notifier) */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border transition-all text-xs ${
              soundOn
                ? 'bg-teal-500/10 text-teal-300 border-teal-500/30 hover:bg-teal-500/20'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
            }`}
            title={soundOn ? (t('kiosk.sound_enabled') || 'Alerte sonore activée') : (t('kiosk.sound_disabled') || 'Alerte sonore coupée')}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <button
              onClick={() => toggleLanguage('ar')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center space-x-1 space-x-reverse ${
                currentLang.startsWith('ar')
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇩🇿</span>
            </button>
            <button
              onClick={() => toggleLanguage('fr')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center space-x-1 space-x-reverse ${
                currentLang.startsWith('fr')
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇫🇷</span>
            </button>
          </div>

          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">
              {user?.role === 'clinic_admin' ? (t('auth.clinic_admin_role') || 'Admin') : user?.role === 'superadmin' ? 'Superadmin' : (user?.role || '')}
            </p>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-slate-800 text-xs font-bold transition-all"
            title={t('auth.logout') || 'Déconnexion'}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
    </>
  );
}
