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
  BookOpen
} from 'lucide-react';

export default function Sidebar({ tenant, user, isMobileOpen, onCloseMobile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isClinicAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'admin_owner' || user?.role === 'clinic_admin' || user?.role === 'doctor';

  const menuItems = [
    { label: t('nav.dashboard', 'لوحة التحكم السريرية'), path: '/dashboard', icon: LayoutDashboard, show: true },
    { label: t('nav.appointments', 'المواعيد والأجندة الطبية'), path: '/appointments', icon: Calendar, show: true },
    { label: t('nav.patients', 'ملفات المرضى والأطفال'), path: '/patients', icon: Users, show: true },
    { label: t('nav.clinical_tests', 'بنك الروائز والاختبارات'), path: '/clinical-tests', icon: Brain, badge: 'PRO ✨', badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30', show: true },
    { label: t('nav.exercises_bank', 'بنك التمارين والكراسات'), path: '/exercises-bank', icon: BookOpen, badge: 'NEW ✨', badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', show: true },
    { label: t('nav.assessments', 'التقييمات والتقارير الطبية'), path: '/assessments', icon: FileText, show: true },
    { label: t('nav.sessions', 'الجلسات والتأهيل السريري'), path: '/sessions', icon: Stethoscope, show: true },
    { label: t('nav.billing', 'الفوترة وسندات القبض والوصولات'), path: '/billing', icon: DollarSign, show: true },
    { label: t('nav.ai_therapy', 'جناح العلاج بالذكاء الاصطناعي'), path: '/ai-therapy', icon: Sparkles, badge: 'AI PRO ✨', badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30', show: true },
    { label: t('nav.waiting_room', 'قاعة الانتظار الذكية'), path: '/waiting-room', icon: Clock, show: true },
    { label: t('nav.kiosk', 'شاشة الاستقبال (Kiosk)'), path: '/kiosk', icon: Monitor, show: true },
    { label: t('nav.help', 'دليل الاستخدام والمساعدة'), path: '/help', icon: HelpCircle, iconColor: 'text-amber-400', show: true },
  ];

  const adminItems = [
    { label: t('nav.staff', 'فريق العمل والموظفين'), path: '/staff', icon: UserCheck, show: isClinicAdmin || isSuperAdmin },
    { label: t('nav.audit_logs', 'سجل العمليات والنشاطات'), path: '/audit-logs', icon: History, show: isClinicAdmin || isSuperAdmin },
    { label: t('nav.settings', 'إعدادات العيادة والتهيئة'), path: '/settings', icon: Building2, show: isClinicAdmin || isSuperAdmin },
  ];

  const superAdminItems = [
    { label: '👑 إدارة العيادات والمشتركين', path: '/admin-super/clinics', icon: ShieldCheck, show: isSuperAdmin },
    { label: '🤖 حوكمة ومفاتيح الـ AI', path: '/admin-super/ai-controls', icon: Sparkles, show: isSuperAdmin },
    { label: '🌐 بنك المقاييس المركزي', path: '/admin-super/templates', icon: Database, show: isSuperAdmin },
    { label: '💳 الاشتراكات وتدقيق BaridiMob', path: '/admin-super/subscriptions', icon: DollarSign, show: isSuperAdmin },
  ];

  const handleNav = (path) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

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
        fixed top-0 bottom-0 right-0 z-50 w-72 bg-slate-900 border-l border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out font-sans
        ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `} dir="rtl">
        
        {/* Top Header & Branding */}
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse cursor-pointer" onClick={() => handleNav('/dashboard')}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 font-black text-xl">
                Ψ
              </div>
              <div className="leading-tight">
                <span className="text-base font-black text-white block tracking-tight">PsyPro Tech</span>
                <span className="text-[10px] text-purple-400 font-mono font-bold block truncate max-w-[140px]">
                  {tenant?.name || 'المنصة السريرية'}
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

          {/* Navigation Links Scrollable */}
          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-160px)]">
            {/* Main Menu */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-black text-slate-400 tracking-wider block mb-2 font-mono">
                {t('sidebar.sections.clinical', 'العمليات السريرية')}
              </span>
              {menuItems.filter(i => i.show).map((item, idx) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
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
                  {t('sidebar.sections.management', 'إدارة العيادة')}
                </span>
                {adminItems.filter(i => i.show).map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleNav(item.path)}
                      className={`w-full flex items-center space-x-3 space-x-reverse px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
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

            {/* Super Admin Menu */}
            {isSuperAdmin && (
              <div className="space-y-1 pt-4 border-t border-slate-800/80">
                <span className="px-3 text-[10px] font-black text-amber-400 tracking-wider block mb-2 font-mono flex items-center space-x-1.5 space-x-reverse">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>لوحة السوبر أدمن (Super Admin)</span>
                </span>
                {superAdminItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleNav(item.path)}
                      className={`w-full flex items-center space-x-3 space-x-reverse px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom User Card / Version */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5 space-x-reverse truncate">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-black shrink-0">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="truncate">
                <span className="font-bold text-white block truncate">{user?.name || 'مستخدم العيادة'}</span>
                <span className="text-[10px] text-slate-400 block truncate font-mono">{user?.role || 'أخصائي'}</span>
              </div>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              v2.5 Pro
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
