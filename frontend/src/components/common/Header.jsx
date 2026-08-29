import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTenantStore } from '../../store/useTenantStore';
import { Bell, Tablet, User, ShieldCheck, Sparkles, Building2, Globe, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import BaridiMobPaymentModal from '../clinic/BaridiMobPaymentModal';

export default function Header() {
  const { user, switchRole } = useAuthStore();
  const { tenant, availableTenants, selectTenantBySubdomain } = useTenantStore();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  return (
    <>
      <header style={{
        height: '70px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--slate-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        {/* Clinic & Subdomain Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--primary-50)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--primary-200)'
          }}>
            <Building2 size={18} color="var(--primary-600)" />
            <select 
              value={tenant.subdomain}
              onChange={(e) => selectTenantBySubdomain(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--primary-700)',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              {availableTenants.map(t => (
                <option key={t.id} value={t.subdomain}>
                  {t.name} ({t.subdomain}.psypro.local)
                </option>
              ))}
            </select>
          </div>

          {/* Public Mini-Site Link */}
          <Link
            to={`/c/${tenant.subdomain || 'elamal'}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', gap: '0.35rem', color: 'var(--primary-700)' }}
            title="معاينة الصفحة العامة وموقع حجز المواعيد للعيادة"
          >
            <Globe size={14} />
            <span>موقع العيادة والحجز</span>
          </Link>

          <div className="badge badge-primary">
            <Sparkles size={12} />
            <span>AI Active (Gemini)</span>
          </div>
        </div>

        {/* Action Controls & Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* BaridiMob Subscription Renewal */}
          {user.role !== 'superadmin' && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', gap: '0.35rem', color: '#047857', border: '1px solid #a7f3d0', background: '#ecfdf5' }}
              onClick={() => setIsPaymentModalOpen(true)}
              title="تجديد الاشتراك عبر بريدي موب / CCP"
            >
              <CreditCard size={14} />
              <span>تجديد الاشتراك (بريدي موب)</span>
            </button>
          )}

          {/* Tablet Kiosk Quick Launcher */}
          <Link 
            to="/tablet/kiosk"
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', color: 'var(--primary-700)' }}
            title="تشغيل وضع التابلت التفاعلي للمريض"
          >
            <Tablet size={15} />
            <span>وضع التابلت</span>
          </Link>

          {/* Role Demo Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--slate-100)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>الدور:</span>
            <select 
              value={user.role} 
              onChange={(e) => switchRole(e.target.value)}
              style={{
                background: 'white',
                border: '1px solid var(--slate-300)',
                borderRadius: '4px',
                padding: '0.2rem 0.4rem',
                fontSize: '0.75rem',
                fontFamily: 'inherit',
                cursor: 'pointer'
              }}
            >
              <option value="orthophoniste">أخصائي أرطوفونيا</option>
              <option value="psychologue">أخصائي نفساني</option>
              <option value="superadmin">مالك المنصة (SuperAdmin)</option>
            </select>
          </div>

          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-600))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              {user.name.charAt(0)}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{user.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* BaridiMob Payment Modal */}
      <BaridiMobPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={() => {
          setIsPaymentModalOpen(false);
        }}
      />
    </>
  );
}
