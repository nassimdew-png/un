import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function TabletLayout() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none'
    }}>
      {/* Tablet Top Bar */}
      <header style={{
        height: '64px',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--primary-500)',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: 'white'
          }}>
            P
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>PsyPro Tablet Kiosk</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>وضع التقييم التفاعلي الآمن للمريض</div>
          </div>
        </div>

        {/* Exit / Return to Staff Dashboard */}
        <Link 
          to="/appointments" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255,255,255,0.08)',
            color: '#cbd5e1',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: 600
          }}
        >
          <Lock size={14} />
          <span>خروج الأخصائي (PIN)</span>
        </Link>
      </header>

      {/* Main Kiosk Area */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '840px' }} className="animate-fade">
          <Outlet />
        </div>
      </main>

      <footer style={{
        padding: '0.75rem',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: '#64748b',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        جلسة تقييم مشفرة ومرتبطة بسجل المريض مباشرة
      </footer>
    </div>
  );
}
