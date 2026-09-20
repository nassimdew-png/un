import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { kioskApi } from '../api';
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Delete, 
  Globe, 
  Lock, 
  Unlock, 
  Clock, 
  Sparkles, 
  ArrowLeft,
  X,
  Volume2
} from 'lucide-react';

export default function KioskCheckIn() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentLang = i18n.language || 'fr';

  const [clinic, setClinic] = useState(null);
  const [loadingClinic, setLoadingClinic] = useState(true);
  const [unlocked, setUnlocked] = useState(true);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  // Check-In Input
  const [inputValue, setInputValue] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [result, setResult] = useState(null);
  const [lastConfirmedCheckIn, setLastConfirmedCheckIn] = useState(() => {
    try {
      const saved = sessionStorage.getItem('kiosk_last_checkin');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(6);

  const countdownTimerRef = useRef(null);

  // Play pleasant chime on success
  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.15); // G5
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.8);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  useEffect(() => {
    const fetchClinicInfo = async () => {
      try {
        const savedSubdomain = localStorage.getItem('kiosk_subdomain') || '';
        const data = await kioskApi.getInfo(savedSubdomain);
        setClinic(data);
        // Auto-unlock if session exists
        const token = sessionStorage.getItem('kiosk_session_token');
        if (token) {
          setUnlocked(true);
        }
      } catch (err) {
        console.error('Kiosk clinic load error:', err);
      } finally {
        setLoadingClinic(false);
      }
    };
    fetchClinicInfo();
  }, []);

  // Auto-reset timer when result is shown
  useEffect(() => {
    if (result) {
      setCountdown(6);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            handleReset();
            return 6;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [result]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setAdminPinError('');
    try {
      const res = await kioskApi.verifyAccess(adminPin, clinic?.subdomain);
      if (res.success) {
        sessionStorage.setItem('kiosk_session_token', res.kiosk_token);
        setUnlocked(true);
        setAdminPin('');
      }
    } catch (err) {
      setAdminPinError(err.message || 'Code PIN Kiosk incorrect (Défaut : 1234)');
    }
  };

  const handleKeyPress = (num) => {
    if (inputValue.length < 12) {
      setInputValue((prev) => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setInputValue((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleReset = () => {
    setInputValue('');
    setError('');
    setResult(null);
  };

  const handleCheckInSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    setCheckingIn(true);
    setError('');
    try {
      const res = await kioskApi.checkIn(inputValue.trim(), clinic?.subdomain);
      setResult(res);
      setLastConfirmedCheckIn(res);
      
      const payload = {
        type: 'KIOSK_CHECKIN_CONFIRMED',
        patient: res.patient,
        appointment: res.appointment || { id: res.appointment_id },
        token: res.token || (res.appointment_id ? `T-${String(res.appointment_id).padStart(3, '0')}` : 'T-001'),
        timestamp: Date.now(),
      };

      try {
        sessionStorage.setItem('kiosk_last_checkin', JSON.stringify(res));
        localStorage.setItem('psypro_queue_event', JSON.stringify(payload));
        localStorage.setItem('psypro_last_checkin', JSON.stringify(payload));
      } catch (e) {}

      try {
        const channel = new BroadcastChannel('psypro_clinic_queue');
        channel.postMessage(payload);
        channel.close();
      } catch (e) {}

      try {
        window.dispatchEvent(new CustomEvent('psypro_queue_event', { detail: payload }));
      } catch (e) {}

      playSuccessChime();
    } catch (err) {
      setError(
        currentLang.startsWith('ar')
          ? (err.message_ar || 'لم يتم العثور على موعد أو ملف بهذا الرقم. يرجى التوجه إلى مكتب الاستقبال.')
          : (err.message_fr || "Aucun dossier trouvé. Veuillez vous adresser au secrétariat.")
      );
    } finally {
      setCheckingIn(false);
    }
  };

  const toggleLang = (lng) => {
    i18n.changeLanguage(lng);
  };

  const formatPhoneNumberDisplay = (val) => {
    if (!val) return '';
    // Format 0550 12 34 56
    const clean = val.replace(/[^0-9]/g, '');
    let formatted = '';
    for (let i = 0; i < clean.length; i++) {
      if (i === 4 || i === 6 || i === 8 || i === 10) formatted += ' ';
      formatted += clean[i];
    }
    return formatted;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 relative select-none font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-teal-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <header className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-2xl shadow-lg shadow-teal-500/20 font-bold">
            🏥
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
              {clinic ? clinic.name : 'PsyPro Clinic'}
            </h1>
            <p className="text-xs text-teal-400 font-semibold flex items-center space-x-1 space-x-reverse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentLang.startsWith('ar') ? 'الكشك الذكي لتسجيل الحضور' : 'Borne Interactive d\'Accueil'}</span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3 space-x-reverse">
          {/* Language Switch */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs shadow-md">
            <button
              onClick={() => toggleLang('ar')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                currentLang.startsWith('ar') ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇩🇿 العربية
            </button>
            <button
              onClick={() => toggleLang('fr')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                currentLang.startsWith('fr') ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇫🇷 Français
            </button>
          </div>

          <button
            onClick={() => navigate('/')}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            title="Quitter la borne"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Kiosk Body */}
      <main className="max-w-md w-full mx-auto my-auto z-10 py-4">
        {!unlocked ? (
          /* Locked State - PIN unlock */
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Activation de la Borne d'Accueil</h2>
              <p className="text-xs text-slate-400 mt-1">
                Veuillez saisir le code PIN Kiosk du cabinet pour démarrer l'écran tactile (Par défaut : 1234).
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Code PIN (ex: 1234)"
                className="w-full text-center tracking-widest text-2xl py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />

              {adminPinError && (
                <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  {adminPinError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-500/25 transition-all"
              >
                Démarrer la Borne
              </button>
            </form>
          </div>
        ) : result ? (
          /* Check-In Success State */
          <div className="glass-card p-8 rounded-3xl border border-emerald-500/40 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-3xl animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                {currentLang.startsWith('ar') ? 'تم تأكيد الحضور' : 'Présence Validée'}
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                {result.patient?.first_name} {result.patient?.last_name}
              </h2>
              {result.appointment?.time && (
                <div className="text-sm font-mono text-emerald-400 font-bold mt-1">
                  ⏰ {currentLang.startsWith('ar') ? `موعدك : ${result.appointment.time}` : `RDV prévu à : ${result.appointment.time}`}
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-semibold">
              {currentLang.startsWith('ar') ? result.message_ar : result.message_fr}
            </div>

            {/* Countdown Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{currentLang.startsWith('ar') ? 'العودة التلقائية للشاشة الرئيسية' : 'Retour automatique'}</span>
                <span className="font-mono font-bold text-teal-400">{countdown}s</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / 6) * 100}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
            >
              {currentLang.startsWith('ar') ? 'إنهاء والمتابعة' : 'Terminer'}
            </button>
          </div>
        ) : (
          /* Check-In Input & Keypad */
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {currentLang.startsWith('ar') ? 'مرحباً بك! سجل حضورك' : 'Bienvenue ! Enregistrez votre arrivée'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {currentLang.startsWith('ar') 
                  ? 'أدخل رقم هاتفك أو رمز المريض الخاص بك لتأكيد حضورك'
                  : 'Saisissez votre numéro de téléphone ou code patient pour valider votre arrivée'}
              </p>
            </div>

            {/* Display Input */}
            <div className="relative">
              <div className="w-full min-h-[58px] px-4 py-3 rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center text-center font-mono text-xl sm:text-2xl font-black text-teal-300 tracking-wider">
                {inputValue ? formatPhoneNumberDisplay(inputValue) : (
                  <span className="text-slate-600 text-base font-normal">
                    {currentLang.startsWith('ar') ? '05XX XX XX XX أو رمز PIN' : '05XX XX XX XX ou Code'}
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center flex items-center justify-center space-x-2 space-x-reverse animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Numerical Touch Keypad */}
            <div className="grid grid-cols-3 gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num.toString())}
                  className="h-14 sm:h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-800 text-xl font-extrabold text-white shadow-md transition-all flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleReset}
                className="h-14 sm:h-16 rounded-2xl bg-slate-900/50 hover:bg-slate-900 active:scale-95 border border-slate-800 text-xs font-bold text-slate-400 uppercase transition-all flex items-center justify-center"
              >
                {currentLang.startsWith('ar') ? 'مسح' : 'Effacer'}
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-14 sm:h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-800 text-xl font-extrabold text-white shadow-md transition-all flex items-center justify-center"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="h-14 sm:h-16 rounded-2xl bg-slate-900/50 hover:bg-slate-900 active:scale-95 border border-slate-800 text-slate-400 hover:text-red-400 transition-all flex items-center justify-center"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={!inputValue || checkingIn}
              onClick={handleCheckInSubmit}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 active:scale-98 text-white font-extrabold text-sm shadow-xl shadow-teal-500/25 flex items-center justify-center space-x-2 space-x-reverse transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {checkingIn 
                  ? (currentLang.startsWith('ar') ? 'جاري التحقق...' : 'Vérification...')
                  : (currentLang.startsWith('ar') ? 'تأكيد الحضور (Check-In)' : 'Valider mon arrivée')}
              </span>
            </button>

            {/* Persistent Check-In Confirmation Banner (Visible after reset) */}
            {lastConfirmedCheckIn && (
              <div 
                data-testid="kiosk-persistent-checkin-badge"
                className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300 shadow-lg animate-in fade-in duration-300"
              >
                <div className="flex items-center space-x-2.5 space-x-reverse min-w-0">
                  <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-white text-xs truncate">
                      {lastConfirmedCheckIn.patient?.first_name || lastConfirmedCheckIn.patient?.name || 'Patient'} {lastConfirmedCheckIn.patient?.last_name || ''}
                    </div>
                    <div className="text-[11px] text-emerald-400/90 font-medium truncate">
                      {currentLang.startsWith('ar') ? '✅ تم تسجيل الوصول وتأكيد الحضور' : '✅ Présence validée en salle d\'attente'}
                      {lastConfirmedCheckIn.patient?.appointment_time && (
                        <span className="font-mono ml-1">({lastConfirmedCheckIn.patient.appointment_time})</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] shrink-0">
                  En attente
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 z-10 flex items-center justify-center space-x-2 space-x-reverse font-mono">
        <span>PsyPro Cloud Kiosk</span>
        <span>&bull;</span>
        <span>{clinic ? clinic.name : 'Alger'}</span>
      </footer>
    </div>
  );
}
