import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Smartphone, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  Download, 
  Building, 
  Sparkles, 
  LogOut, 
  ShieldCheck,
  Check,
  Clock,
  Heart,
  ChevronLeft,
  AlertCircle,
  Languages
} from 'lucide-react';
import { parentPortalApi } from '../api';
import ParentMediaUploadBox from './portal/ParentMediaUploadBox';

export default function ParentMobilePortal() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('portal_lang') || 'ar';
  });

  const toggleLanguage = (selectedLang) => {
    const newLang = selectedLang || (lang === 'ar' ? 'fr' : 'ar');
    setLang(newLang);
    localStorage.setItem('portal_lang', newLang);
  };

  const isRtl = lang === 'ar';

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [portalData, setPortalData] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' or 'homework'
  const [togglingHwId, setTogglingHwId] = useState(null);

  // Bilingual Dictionary
  const dict = {
    ar: {
      badge: '🇩🇿 فضاء أولياء ومرافقي المرضى',
      loginTitle: 'تسجيل الدخول لبوابة المريض',
      loginDesc: 'أدخل رقم الهاتف المسجل لدى العيادة مع رمز PIN السري',
      phoneLabel: 'رقم الهاتف *',
      phonePlaceholder: '0550123456',
      pinLabel: 'رمز الدخول السري (Code PIN) *',
      pinPlaceholder: '••••',
      pinHint: '💡 الرمز الافتراضي هو آخر 4 أرقام من رقم الهاتف',
      loginBtn: 'دخول إلى فضاء المريض',
      verifying: 'جارٍ التحقق...',
      invalidLogin: 'بيانات الدخول غير صحيحة. يرجى التأكد من رقم الهاتف والرمز السري.',
      logoutTitle: 'تسجيل الخروج',
      tabAppointments: 'المواعيد القادمة',
      tabHomework: 'الواجبات والتمارين',
      tabMedia: 'التسجيلات والصوتيات',
      appointmentsHeading: 'جدول الزيارات والمتابعة السريرية:',
      noAppointments: 'لا توجد مواعيد مبرمجة حالياً',
      confirmedStatus: 'مؤكد',
      sessionType: 'جلسة استشارة ومتابعة سريرية',
      homeworkHeading: 'بطاقات التمارين المنزلية المخصصة:',
      noHomework: 'لم يتم تعيين بطاقات تمارين منزلية جديدة بعد',
      targetLetter: '🎯 الحرف المستهدف: ',
      frequency: 'التكرار: ',
      duration: 'المدة: ',
      perDay: 'مرتين يومياً',
      days: 'أيام',
      downloadPdf: 'تحميل PDF',
      parentInstructions: 'تعليمات للأولياء:',
      markCompleted: 'تأكيد إنجاز التمرين بالمنزل',
      alreadyCompleted: '✅ تم إنجاز التمرين في المنزل بنجاح 🌟'
    },
    fr: {
      badge: '🇩🇿 Espace Famille & Accompagnants',
      loginTitle: 'Connexion au Portail Patient',
      loginDesc: 'Saisissez votre numéro de téléphone et le code confidentiel PIN',
      phoneLabel: 'Numéro de téléphone *',
      phonePlaceholder: '0550123456',
      pinLabel: 'Code confidentiel (Code PIN) *',
      pinPlaceholder: '••••',
      pinHint: '💡 Le code par défaut correspond aux 4 derniers chiffres du téléphone',
      loginBtn: 'Accéder à l\'espace patient',
      verifying: 'Vérification...',
      invalidLogin: 'Identifiants invalides. Vérifiez le numéro de téléphone et le code PIN.',
      logoutTitle: 'Déconnexion',
      tabAppointments: 'Prochains Rendez-vous',
      tabHomework: 'Exercices & Devoirs',
      tabMedia: 'Vocal & Médias',
      appointmentsHeading: 'Planning des séances et suivi clinique :',
      noAppointments: 'Aucun rendez-vous programmé actuellement',
      confirmedStatus: 'Confirmé',
      sessionType: 'Séance de consultation et rééducation',
      homeworkHeading: 'Fiches d\'exercices à domicile personnalisées :',
      noHomework: 'Aucune fiche d\'exercice assignée pour le moment',
      targetLetter: '🎯 Son / Phonème ciblé : ',
      frequency: 'Fréquence : ',
      duration: 'Durée : ',
      perDay: '2 fois par jour',
      days: 'jours',
      downloadPdf: 'Télécharger PDF',
      parentInstructions: 'Instructions pour les parents :',
      markCompleted: 'Marquer l\'exercice comme réalisé',
      alreadyCompleted: '✅ Exercice validé à domicile 🌟'
    }
  };

  const t = dict[lang] || dict.ar;

  // Restore session from localStorage if present
  useEffect(() => {
    const savedPatient = localStorage.getItem('parent_portal_patient');
    if (savedPatient) {
      try {
        const parsed = JSON.parse(savedPatient);
        loadDashboard(parsed.id);
        setIsLoggedIn(true);
      } catch (e) {}
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await parentPortalApi.login(phone, pin);
      localStorage.setItem('parent_portal_patient', JSON.stringify(res.patient));
      setIsLoggedIn(true);
      loadDashboard(res.patient.id);
    } catch (err) {
      setLoginError(err.message || t.invalidLogin);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e) => {
    if (e) e.preventDefault();
    if (!phone) {
      setLoginError(lang === 'ar' ? 'يرجى إدخال رقم الهاتف أولاً للدخول بدون كلمة مرور' : 'Veuillez saisir votre numéro de téléphone d\'abord');
      return;
    }
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await parentPortalApi.login(phone.trim(), null);
      if (res && res.patient) {
        localStorage.setItem('parent_portal_patient', JSON.stringify(res.patient));
        if (res.token) {
          localStorage.setItem('parent_portal_token', res.token);
        }
        setIsLoggedIn(true);
        loadDashboard(res.patient.id);
      } else {
        throw new Error(res?.message || t.invalidLogin);
      }
    } catch (err) {
      setLoginError(err.message || t.invalidLogin);
    } finally {
      setLoginLoading(false);
    }
  };

  const loadDashboard = async (patientId) => {
    try {
      const res = await parentPortalApi.getDashboard(patientId);
      setPortalData(res);
    } catch (err) {
      console.error('Error loading parent portal data:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('parent_portal_patient');
    setIsLoggedIn(false);
    setPortalData(null);
    setPhone('');
    setPin('');
  };

  const handleToggleHomework = async (hwId) => {
    setTogglingHwId(hwId);
    try {
      const res = await parentPortalApi.toggleHomework(hwId);
      setPortalData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          homeworks: prev.homeworks.map((hw) =>
            hw.id === hwId ? { ...hw, status: res.status } : hw
          ),
        };
      });
    } catch (err) {
      alert(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setTogglingHwId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Top Floating Language Selector */}
      <div className="max-w-md mx-auto w-full px-4 pt-3 flex justify-end">
        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => toggleLanguage('ar')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              lang === 'ar' ? 'bg-brand-600 text-white font-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            عربي
          </button>
          <button
            type="button"
            onClick={() => toggleLanguage('fr')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              lang === 'fr' ? 'bg-brand-600 text-white font-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            FR
          </button>
        </div>
      </div>

      {!isLoggedIn ? (
        /* Login Screen */
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-500/25">
                <Heart className="w-8 h-8 fill-current text-rose-300" />
              </div>
              <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-black">
                {t.badge}
              </span>
              <h2 className="text-xl font-extrabold text-white">{t.loginTitle}</h2>
              <p className="text-xs text-slate-400">
                {t.loginDesc}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">{t.phoneLabel}</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    required
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <Smartphone className={`w-4 h-4 text-slate-500 absolute ${isRtl ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2`} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">{t.pinLabel}</label>
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder={t.pinPlaceholder}
                    required
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono font-black text-xl tracking-widest text-center focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <Lock className={`w-4 h-4 text-slate-500 absolute ${isRtl ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2`} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 text-center font-medium">
                  {t.pinHint}
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading || !phone || pin.length < 4}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{loginLoading ? t.verifying : t.loginBtn}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-500 uppercase">
                  {lang === 'ar' ? 'أو عبر الرابط المباشر' : 'Ou accès direct'}
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Passwordless / Magic Link Family Access */}
              <button
                type="button"
                id="family-magic-link-action"
                data-testid="magic-link-login-btn"
                data-cy="magic-link-login-btn"
                onClick={handleMagicLinkLogin}
                disabled={loginLoading || !phone}
                className="w-full py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-brand-500/40 hover:border-brand-500 text-brand-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
                <span>
                  {lang === 'ar' 
                    ? '✨ الدخول بدون كلمة مرور (رابط سحري / Send magic link / Access without password)' 
                    : '✨ Connexion sans mot de passe (Lien magique / Send magic link)'}
                </span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Inside Portal Dashboard */
        <div className="flex-1 max-w-lg mx-auto w-full flex flex-col p-4 space-y-4">
          {/* Header Bar */}
          <header className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-teal-400 flex items-center justify-center font-black text-slate-950 shadow-md">
                {portalData?.patient?.first_name?.[0] || 'P'}
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  {portalData?.patient?.first_name} {portalData?.patient?.last_name}
                </h3>
                <div className="text-[10px] text-slate-400 font-medium">
                  {portalData?.clinic?.name || 'PsyPro Clinical SaaS'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-300 transition-all text-xs flex items-center gap-1"
              title={t.logoutTitle}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </header>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('appointments')}
              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                activeTab === 'appointments'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="truncate">{t.tabAppointments}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('homework')}
              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                activeTab === 'homework'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="truncate">{t.tabHomework}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                activeTab === 'media'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="truncate">{t.tabMedia}</span>
            </button>
          </div>

          {/* Tab 1: Appointments */}
          {activeTab === 'appointments' && (
            <div className="space-y-3 flex-1 animate-in fade-in">
              <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5 px-1">
                <Clock className="w-4 h-4 text-brand-400" />
                <span>{t.appointmentsHeading}</span>
              </h4>

              {portalData?.upcoming_appointments?.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">{t.noAppointments}</p>
                </div>
              ) : (
                portalData?.upcoming_appointments?.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {appt.status_label || t.confirmedStatus}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {appt.date} &bull; {appt.time}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white">
                      {t.sessionType}
                    </div>

                    {appt.notes && (
                      <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                        {appt.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Homework & Take-Home Sheets */}
          {activeTab === 'homework' && (
            <div className="space-y-3 flex-1 animate-in fade-in">
              <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5 px-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{t.homeworkHeading}</span>
              </h4>

              {portalData?.homeworks?.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">{t.noHomework}</p>
                </div>
              ) : (
                portalData?.homeworks?.map((hw) => {
                  const isCompleted = hw.status === 'completed';

                  return (
                    <div
                      key={hw.id}
                      className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3 shadow-lg ${
                        isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          {hw.target_phoneme && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-brand-500/20 text-brand-300 text-[10px] font-black">
                              {t.targetLetter}[{hw.target_phoneme}]
                            </span>
                          )}
                          <h5 className="text-sm font-extrabold text-white">{hw.title}</h5>
                          <div className="text-[10px] text-slate-400">
                            {t.frequency}{hw.frequency_per_day || t.perDay} &bull; {t.duration}{hw.duration_days || 7} {t.days}
                          </div>
                        </div>

                        {/* PDF Download Button */}
                        <a
                          href={hw.download_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-all shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t.downloadPdf}</span>
                        </a>
                      </div>

                      {/* Parent Instructions */}
                      {hw.parent_instructions_ar && (
                        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                          <strong className="block text-[10px] text-brand-400 mb-0.5">{t.parentInstructions}</strong>
                          {hw.parent_instructions_ar}
                        </div>
                      )}

                      {/* Completion Checkbox Toggle */}
                      <button
                        type="button"
                        disabled={togglingHwId === hw.id}
                        onClick={() => handleToggleHomework(hw.id)}
                        className={`w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md ${
                          isCompleted
                            ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/25'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isCompleted ? t.alreadyCompleted : t.markCompleted}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 3: Media & Voice Uploads */}
          {activeTab === 'media' && (
            <div className="space-y-3 flex-1 animate-in fade-in">
              <ParentMediaUploadBox
                token={portalData?.portal_token || portalData?.patient?.portal_access_token || 'portal_preview'}
                lang={lang}
                patientName={portalData?.patient?.first_name || ''}
                showHistory={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
