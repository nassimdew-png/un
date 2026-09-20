import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HelpCircle,
  LayoutDashboard, 
  Users, 
  FileText, 
  Clock, 
  Calendar, 
  DollarSign, 
  Monitor, 
  Stethoscope, 
  Brain, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  Database,
  UserCheck,
  History,
  Settings as SettingsIcon,
  X,
  BookOpen,
  Bot,
  BarChart3,
  Receipt,
  Languages,
  Activity,
  Video,
  Crown,
  Key,
  CreditCard,
  Headphones,
  Megaphone,
  MapPin,
  Tag,
  Coins,
  Terminal,
  Globe,
  SlidersHorizontal,
  PieChart,
  MessageSquare,
  ShieldAlert,
  LogOut,
  ArrowRightLeft,
  LayoutTemplate,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import ThemeToggle from './common/ThemeToggle';

export default function Sidebar({ tenant, user, isMobileOpen, onCloseMobile }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isRtl = !i18n.language || i18n.language.startsWith('ar');

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin' || user?.is_super_admin === true || user?.email === 'superadmin@clinic-saas.dz' || user?.email === 'admin@psypro.tech';
  const isSecretary = user?.role === 'secretary' || user?.role === 'receptionist';
  const isClinicAdmin = (user?.role === 'admin' || user?.role === 'owner' || user?.role === 'admin_owner' || user?.role === 'clinic_admin' || user?.role === 'doctor') && !isSecretary;

  // Check if superadmin is legitimately impersonating a clinic
  const hasBackupToken = Boolean(
    localStorage.getItem('backup_superadmin_token') || 
    localStorage.getItem('superadmin_backup_token') || 
    sessionStorage.getItem('superadmin_backup_token')
  );
  const isExplicitlyImpersonating = localStorage.getItem('is_impersonating') === 'true';
  const isImpersonating = isExplicitlyImpersonating && hasBackupToken && !isSuperAdmin;
  const impersonatingClinicName = isImpersonating ? (localStorage.getItem('impersonating_clinic_name') || tenant?.name) : null;

  const handleStopImpersonation = () => {
    const bToken = localStorage.getItem('backup_superadmin_token') || localStorage.getItem('superadmin_backup_token') || sessionStorage.getItem('superadmin_backup_token');
    localStorage.removeItem('backup_superadmin_token');
    localStorage.removeItem('superadmin_backup_token');
    sessionStorage.removeItem('superadmin_backup_token');
    sessionStorage.removeItem('superadmin_impersonating_tenant');
    localStorage.removeItem('is_impersonating');
    localStorage.removeItem('impersonating_clinic_name');
    
    if (bToken) {
      localStorage.setItem('auth_token', bToken);
      localStorage.setItem('token', bToken);
      const baseDomain = window.location.hostname.includes('psysnap.com') ? 'psysnap.com' : 'psypro.tech';
      const target = (window.location.hostname.includes('psysnap.com') || window.location.hostname.includes('psypro.tech')) 
        ? `https://${baseDomain}/superadmin` 
        : '/superadmin';
      window.location.href = target;
    } else {
      window.location.href = '/superadmin';
    }
  };

  // Clinical / Front-Desk menu (customized by role)
  const menuItems = [
    { label: t('nav.front_desk', '🏢 قمرة الاستقبال والسكرتارية'), path: '/front-desk', icon: Building2, badge: 'DESK ⚡', badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/30', show: true },
    { label: isSecretary ? t('nav.dashboard_reception', 'لوحة الاستقبال والنبض') : t('nav.dashboard', 'لوحة التحكم السريرية'), path: '/dashboard', icon: LayoutDashboard, show: true },
    { label: t('nav.appointments', 'المواعيد والأجندة الطبية'), path: '/appointments', icon: Calendar, show: true },
    { label: isSecretary ? t('nav.patients_admin', 'سجلات ودليل المرضى') : t('nav.patients', 'ملفات المرضى والأطفال'), path: '/patients', icon: Users, show: true },
    { label: t('nav.waiting_room', 'قاعة الانتظار الذكية'), path: '/waiting-room', icon: Clock, show: true },
    { label: t('nav.kiosk', 'شاشة الاستقبال (Kiosk)'), path: '/kiosk', icon: Monitor, show: true },
    { label: t('nav.billing', 'الفوترة وسندات القبض والوصولات'), path: '/billing', icon: DollarSign, show: true },
    
    // Clinical & Diagnostic Modules (Hidden for Secretary & Receptionist)
    { label: t('nav.clinical_tests', 'بنك الروائز والاختبارات'), path: '/clinical-tests', icon: Brain, badge: 'PRO ✨', badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30', show: !isSecretary },
    { label: t('nav.exercises_bank', 'بنك التمارين والكراسات'), path: '/exercises-bank', icon: BookOpen, badge: 'NEW ✨', badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', show: !isSecretary },
    { label: t('nav.assessments', 'التقييمات والتقارير الطبية'), path: '/assessments', icon: FileText, show: !isSecretary },
    { label: t('nav.orthophony', '👅 فحص النطق والأرطوفونيا'), path: '/orthophony', icon: Languages, badge: 'SPEECH 🗣️', badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30', show: !isSecretary },
    { label: t('nav.psychomotricity', '🏃 التأهيل الحركي وخريطة الجسد'), path: '/psychomotricity', icon: Activity, badge: 'BODY 🧠', badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', show: !isSecretary },
    { label: t('nav.teletherapy', '💻 عيادة التطبيب عن بعد والسبورة'), path: '/teletherapy', icon: Video, badge: 'LIVE 📹', badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30', show: !isSecretary },
    { label: t('nav.sessions', 'الجلسات والتأهيل السريري'), path: '/sessions', icon: Stethoscope, show: !isSecretary },
    { label: t('nav.ai_therapy', 'جناح العلاج بالذكاء الاصطناعي'), path: '/ai-therapy', icon: Sparkles, badge: 'AI PRO ✨', badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30', show: !isSecretary },
    { label: t('nav.analytics', 'محلل البيانات والـ BI'), path: '/analytics/ai-analyst', icon: BarChart3, badge: 'AI ⚡', badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30', show: isClinicAdmin && !isSecretary },
    { label: t('nav.document_processor', 'معالج الفواتير والوثائق'), path: '/finance/document-processor', icon: Receipt, badge: 'OCR ✨', badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30', show: isClinicAdmin && !isSecretary },
    { label: t('nav.help', 'دليل الاستخدام والمساعدة'), path: '/help', icon: HelpCircle, iconColor: 'text-amber-400', show: true },
  ];

  // Clinic Admin menu (for clinic owners/admins, hidden from secretary)
  const adminItems = [
    { label: t('nav.staff', 'فريق العمل والموظفين'), path: '/staff', icon: UserCheck, show: isClinicAdmin && !isSecretary },
    { label: t('nav.audit_logs', 'سجل العمليات والنشاطات'), path: '/audit-logs', icon: History, show: isClinicAdmin && !isSecretary },
    { label: t('nav.settings', 'إعدادات العيادة والتهيئة'), path: '/settings', icon: Building2, show: isClinicAdmin && !isSecretary },
    { label: t('nav.ai_receptionist', '🤖 موظف الاستقبال الذكي (AI Bot)'), path: '/settings/ai-receptionist', icon: Bot, badge: 'NEW', badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30', show: isClinicAdmin && !isSecretary },
  ];

  // Super Admin Navigation Groups (Dedicated SaaS Platform Cockpit)
  const superAdminGroups = [
    {
      title: t('sidebar.groups.sovereign_clinics', '👑 القيادة والعيادات (Sovereign & Clinics)'),
      items: [
        { label: t('superadmin.tabs.sovereign_tower', '👑 قمرة القيادة والسيطرة السيادية'), path: '/superadmin?tab=sovereign_tower', tabId: 'sovereign_tower', icon: Crown, badge: 'TOWER ⚡', badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
        { label: t('superadmin.tabs.clinics', '🏢 إدارة العيادات والاشتراكات'), path: '/superadmin?tab=clinics', tabId: 'clinics', icon: Building2 },
        { label: t('superadmin.tabs.lifecycle', '🔄 دورة الاشتراكات ومطابقة BaridiMob'), path: '/superadmin?tab=lifecycle', tabId: 'lifecycle', icon: CreditCard, badge: 'DZD 💳', badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
        { label: t('superadmin.tabs.geo_map', '🗺️ خريطة انتشار العيادات الوطنية'), path: '/superadmin?tab=geo_map', tabId: 'geo_map', icon: MapPin },
        { label: t('superadmin.tabs.clinic_quotas', '📊 إدارة حصص واستهلاك العيادات'), path: '/superadmin?tab=clinic_quotas', tabId: 'clinic_quotas', icon: PieChart },
        { label: t('superadmin.tabs.plans', '💳 باقات وخطط الاشتراك والأسعار'), path: '/superadmin?tab=plans', tabId: 'plans', icon: Coins },
        { label: t('superadmin.tabs.invoices', '🧾 فواتير B2B والتحصيل'), path: '/superadmin?tab=invoices', tabId: 'invoices', icon: FileText },
        { label: t('superadmin.tabs.coupons', '🏷️ محرك الكوبونات والإحالات'), path: '/superadmin?tab=coupons', tabId: 'coupons', icon: Tag },
        { label: t('superadmin.tabs.onboarding_funnel', '🎯 مسار تهيئة العيادات والتحويل'), path: '/superadmin?tab=onboarding_funnel', tabId: 'onboarding_funnel', icon: Sparkles },
      ]
    },
    {
      title: t('sidebar.groups.ai_core', '🤖 المحتوى الذكي والمعايير (AI & Core)'),
      items: [
        { label: t('superadmin.tabs.api_gateway', '🔑 مركز مفاتيح AI و API Gateway'), path: '/superadmin?tab=api_gateway', tabId: 'api_gateway', icon: Key, badge: 'AI ⚡', badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
        { label: t('superadmin.tabs.ai_governance', '🤖 حوكمة نماذج الذكاء الاصطناعي'), path: '/superadmin?tab=ai_governance', tabId: 'ai_governance', icon: Bot },
        { label: t('superadmin.tabs.ai_routing', '⚡ توجيه الذكاء وتتبع التكلفة'), path: '/superadmin?tab=ai_routing', tabId: 'ai_routing', icon: Sparkles },
        { label: t('superadmin.tabs.tests', '📑 بنك المقاييس والرادارات المركزي'), path: '/superadmin?tab=tests', tabId: 'tests', icon: Brain, badge: '18', badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' },
        { label: t('superadmin.tabs.exercises', '📚 بنك التمارين والكراسات العام'), path: '/superadmin?tab=exercises', tabId: 'exercises', icon: BookOpen },
        { label: t('superadmin.tabs.analytics', '📈 تحليلات المنصة وإحصائيات BI'), path: '/superadmin?tab=analytics', tabId: 'analytics', icon: BarChart3 },
      ]
    },
    {
      title: t('sidebar.groups.system_sec', '🛡️ البنية التحتية والأمان (System & Sec)'),
      items: [
        { label: t('superadmin.tabs.telemetry', '🖥️ صحة السيرفر وخدمات PM2'), path: '/superadmin?tab=telemetry', tabId: 'telemetry', icon: Activity, badge: 'LIVE 🟢', badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
        { label: t('superadmin.tabs.audit_logs', '🛡️ سجل التدقيق الجنائي والأمني'), path: '/superadmin?tab=audit_logs', tabId: 'audit_logs', icon: ShieldCheck },
        { label: t('superadmin.tabs.backups', '💾 النسخ الاحتياطي واستعادة البيانات'), path: '/superadmin?tab=backups', tabId: 'backups', icon: Database },
        { label: t('superadmin.tabs.support', '🎧 مركز الدعم الفني والتذاكر'), path: '/superadmin?tab=support', tabId: 'support', icon: Headphones },
        { label: t('superadmin.tabs.broadcasts', '📢 مركز البث والإعلانات العامة'), path: '/superadmin?tab=broadcasts', tabId: 'broadcasts', icon: Megaphone },
        { label: t('superadmin.tabs.feature_flags', '🎛️ مفاتيح الميزات (Feature Flags)'), path: '/superadmin?tab=feature_flags', tabId: 'feature_flags', icon: SlidersHorizontal },
        { label: t('superadmin.tabs.domains', '🌐 النطاقات المخصصة وSSL'), path: '/superadmin?tab=domains', tabId: 'domains', icon: Globe },
        { label: t('superadmin.tabs.communication', '📲 بوابات التواصل والـ SMS/WhatsApp'), path: '/superadmin?tab=communication', tabId: 'communication', icon: MessageSquare },
        { label: t('superadmin.tabs.teletherapy', '📹 التطبيب عن بعد وغرف الفيديو'), path: '/superadmin?tab=teletherapy', tabId: 'teletherapy', icon: Video },
        { label: t('superadmin.tabs.admin_team', '👥 فريق المشرفين والأذونات'), path: '/superadmin?tab=admin_team', tabId: 'admin_team', icon: Users },
        { label: t('superadmin.tabs.repo_maintainer', '🛠️ صيانة الكود وسجلات الأخطاء'), path: '/superadmin?tab=repo_maintainer', tabId: 'repo_maintainer', icon: Terminal },
      ]
    },
    {
      title: t('sidebar.groups.cms_content', '📚 إدارة المحتوى والأدلة (CMS & Guides)'),
      items: [
        { label: t('superadmin.tabs.help_cms', '📚 محرر وتخصيص دليل الاستخدام'), path: '/superadmin?tab=help_cms', tabId: 'help_cms', icon: HelpCircle, badge: 'CMS ✍️', badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
        { label: t('superadmin.tabs.student_offer', '🎓 منحة وعرض الطلبة (9 أشهر)'), path: '/superadmin?tab=student_offer', tabId: 'student_offer', icon: GraduationCap, badge: '9M 🎓', badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
        { label: t('superadmin.tabs.landing_cms', '🎨 تخصيص الصفحة الرئيسية (Landing)'), path: '/superadmin?tab=landing_cms', tabId: 'landing_cms', icon: LayoutTemplate, badge: 'WEB 🎨', badgeColor: 'bg-pink-500/20 text-pink-300 border border-pink-500/30' },
        { label: t('sidebar.live_student_offer', '🚀 رابط العرض التسويقي للطلبة'), path: '/student-offer', tabId: 'live_student_offer', icon: ExternalLink },
        { label: t('sidebar.live_help_preview', '👁️ معاينة الدليل السريري المباشر'), path: '/help', tabId: 'live_help', icon: ExternalLink },
      ]
    }
  ];

  const handleNav = (path) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const currentTabFromUrl = new URLSearchParams(location.search).get('tab') || 'sovereign_tower';

  const isSuperAdminMode = isSuperAdmin && !isImpersonating;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} z-50 w-72 bg-slate-900 border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out font-sans
        ${isMobileOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}
      `} dir={isRtl ? 'rtl' : 'ltr'}>
        
        {/* Top Header & Branding */}
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div 
              className={`flex items-center space-x-3 ${isRtl ? 'space-x-reverse' : ''} cursor-pointer group`} 
              onClick={() => handleNav(isSuperAdminMode ? '/superadmin?tab=sovereign_tower' : '/dashboard')}
            >
              <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/20 border border-slate-700/80 bg-slate-950 p-0.5 flex items-center justify-center transition transform group-hover:scale-105 shrink-0">
                <img src="/psysnap-logo.png" alt="PsySnap" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div className="leading-tight">
                <span className="text-base font-black text-white block tracking-tight">PsySnap</span>
                <span className={`text-[10px] font-mono font-bold block truncate max-w-[140px] ${
                  isSuperAdminMode ? 'text-amber-400' : 'text-cyan-400'
                }`}>
                  {isSuperAdminMode ? t('sidebar.superadmin_title', 'إدارة المنصة السيادية') : (tenant?.name || 'المنصة السريرية')}
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Impersonation Floating Banner if active */}
          {isImpersonating && (
            <div className="mx-3 mt-3 p-2.5 rounded-2xl bg-gradient-to-r from-amber-600/90 to-rose-600/90 text-white text-xs font-bold flex flex-col gap-2 shadow-lg border border-amber-400/30">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-200" />
                <span className="truncate text-[11px]">معاينة: {impersonatingClinicName || 'عيادة المشترك'}</span>
              </div>
              <button
                type="button"
                onClick={handleStopImpersonation}
                className="w-full py-1.5 bg-slate-950/70 hover:bg-slate-950 text-amber-300 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1.5 shadow"
              >
                <LogOut className="w-3.5 h-3.5 rotate-180" />
                <span>العودة للوحة السوبر أدمن</span>
              </button>
            </div>
          )}

          {/* Navigation Links Scrollable */}
          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-160px)] scrollbar-thin scrollbar-thumb-slate-800">
            
            {/* CASE 1: SUPER ADMIN NAVIGATION (CLEAN PLATFORM SUITE) */}
            {isSuperAdminMode ? (
              <div className="space-y-6">
                {superAdminGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <span className="px-3 text-[10px] font-black text-amber-400/90 tracking-wider block mb-2 font-mono">
                      {group.title}
                    </span>
                    {group.items.map((item, idx) => {
                      const Icon = item.icon;
                      const isTabActive = location.pathname.startsWith('/superadmin') && currentTabFromUrl === item.tabId;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleNav(item.path)}
                          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                            isTabActive
                              ? 'bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-600 text-white shadow-lg shadow-amber-500/20 font-black'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                          }`}
                        >
                          <div className={`flex items-center space-x-3 ${isRtl ? 'space-x-reverse' : ''} truncate`}>
                            <Icon className={`w-4 h-4 shrink-0 ${isTabActive ? 'text-white' : 'text-amber-400/80'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${item.badgeColor || 'bg-white/20 text-white'}`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              /* CASE 2: CLINICAL / CLINIC ADMIN NAVIGATION */
              <>
                {/* Clinical Main Menu */}
                <div className="space-y-1">
                  <span className="px-3 text-[10px] font-black text-slate-400 tracking-wider block mb-2 font-mono">
                    {isSecretary
                      ? (isRtl ? '🏢 الاستقبال والعمليات الإدارية' : 'Accueil & Réception')
                      : t('sidebar.sections.clinical', isRtl ? '🩺 العمليات السريرية' : 'Opérations Cliniques')}
                  </span>
                  {menuItems.filter(i => i.show).map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleNav(item.path)}
                        data-testid={`sidebar-nav-${item.path.replace('/', '')}`}
                        id={`sidebar-nav-${item.path.replace('/', '')}`}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                        }`}
                      >
                        <div className={`flex items-center space-x-3 ${isRtl ? 'space-x-reverse' : ''}`}>
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.iconColor || 'text-purple-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-white/20 text-white'}`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Clinic Admin Menu */}
                {adminItems.some(i => i.show) && (
                  <div className="space-y-1 pt-4 border-t border-slate-800/80">
                    <span className="px-3 text-[10px] font-black text-slate-400 tracking-wider block mb-2 font-mono">
                      {t('sidebar.sections.management', isRtl ? 'إدارة العيادة' : 'Gestion du Cabinet')}
                    </span>
                    {adminItems.filter(i => i.show).map((item, idx) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleNav(item.path)}
                          data-testid={`sidebar-nav-${item.path.replace('/', '')}`}
                          id={`sidebar-nav-${item.path.replace('/', '')}`}
                          className={`w-full flex items-center space-x-3 ${isRtl ? 'space-x-reverse' : ''} px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom User Card / Version */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between text-xs">
            <div className={`flex items-center space-x-2.5 ${isRtl ? 'space-x-reverse' : ''} truncate`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 ${
                isSuperAdminMode ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'
              }`}>
                {isSuperAdminMode ? '👑' : (user?.name?.[0] || 'U')}
              </div>
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block truncate font-bold">
                  {isSuperAdminMode
                    ? (t('auth.superadmin_role') || 'المشرف العام للمنصة')
                    : user?.role === 'clinic_admin' || user?.role === 'admin' || user?.role === 'admin_owner'
                    ? (t('auth.clinic_admin_role') || 'مدير العيادة')
                    : user?.role === 'orthophonist'
                    ? (t('auth.orthophonist_role') || 'أخصائي أرطوفونيا')
                    : user?.role === 'psychologist'
                    ? (t('auth.psychologist_role') || 'أخصائي نفسي')
                    : user?.role === 'psychomotor'
                    ? (t('auth.psychomotor_role') || 'أخصائي تأهيل حركي')
                    : user?.role === 'secretary' || user?.role === 'receptionist'
                    ? (t('auth.secretary_role') || 'استقبال')
                    : (user?.role || 'أخصائي')}
                </span>
                <span className="text-[9px] text-slate-500 block truncate">
                  {user?.email || 'admin@psypro.tech'}
                </span>
              </div>
            </div>
            <div className={`flex items-center space-x-2 ${isRtl ? 'space-x-reverse' : ''} shrink-0`}>
              <ThemeToggle className="p-1.5" />
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                isSuperAdminMode 
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              }`}>
                {isSuperAdminMode ? 'Sovereign' : 'v2.5 Pro'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

