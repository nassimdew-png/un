import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Calendar, 
  Users, 
  FileText, 
  BrainCircuit, 
  Activity, 
  Tablet, 
  ShieldCheck, 
  Settings, 
  Stethoscope,
  Sparkles,
  Globe
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';

  const navItems = isSuperAdmin ? [
    { label: 'لوحة التحكم العامة', path: '/superadmin', icon: ShieldCheck },
    { label: 'إدارة النطاقات وSSL', path: '/superadmin', icon: Globe },
    { label: 'العيادات والمشتركون', path: '/superadmin', icon: Users },
  ] : [
    { label: 'رزنامة المواعيد', path: '/appointments', icon: Calendar },
    { label: 'ملفات المرضى', path: '/patients', icon: Users },
    { label: 'الحصيلة الأرطوفونية (AI)', path: '/orthophonie/bilan', icon: FileText },
    { label: 'ملاحظات الجلسة (SOAP)', path: '/psychology/session-notes', icon: Activity },
    { label: 'المقاييس النفسية', path: '/psychology/scales', icon: BrainCircuit },
    { label: 'النطاق المخصص وSSL', path: '/settings/domains', icon: Globe },
    { label: 'وضع التابلت التفاعلي', path: '/tablet/kiosk', icon: Tablet },
  ];

  return (
    <aside style={{
      width: '260px',
      background: '#ffffff',
      borderLeft: '1px solid var(--slate-200)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderBottom: '1px solid var(--slate-100)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--primary-600), var(--accent-600))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Stethoscope size={22} />
        </div>
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--slate-900)', letterSpacing: '-0.03em' }}>
            Psy<span style={{ color: 'var(--primary-600)' }}>Pro</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600 }}>Clinical SaaS Platform</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate-400)', padding: '0.5rem 0.75rem' }}>
          {isSuperAdmin ? 'إدارة المنصة السحابية' : 'الوحدات الإكلينيكية'}
        </div>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path + index}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary-700)' : 'var(--slate-600)',
                background: isActive ? 'var(--primary-50)' : 'transparent',
                border: isActive ? '1px solid var(--primary-200)' : '1px solid transparent',
                transition: 'all 0.15s ease'
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--slate-100)',
        background: 'var(--slate-50)',
        fontSize: '0.75rem',
        color: 'var(--slate-500)',
        textAlign: 'center'
      }}>
        <div style={{ fontWeight: 600 }}>PsyPro v1.0 (Clinical AI)</div>
        <div>نظام عزل متعدد المستأجرين</div>
      </div>
    </aside>
  );
}
