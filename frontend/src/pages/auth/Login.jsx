import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useTenantStore } from '../../store/useTenantStore';
import { Stethoscope, Lock, Mail, Building2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('sara@elamal.dz');
  const [password, setPassword] = useState('password123');
  const [selectedSubdomain, setSelectedSubdomain] = useState('elamal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuthStore();
  const { availableTenants, selectTenantBySubdomain } = useTenantStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Try to login via live backend API
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        selectTenantBySubdomain(selectedSubdomain);
        login(data.user, data.token);
        setLoading(false);
        navigate(data.user.role === 'superadmin' ? '/superadmin' : '/appointments');
        return;
      }
    } catch (err) {
      console.log('Live API login fallback to client session:', err);
    }

    // Client fallback session for instant testing
    setTimeout(() => {
      selectTenantBySubdomain(selectedSubdomain);
      const isSuper = email.includes('admin');

      login({
        id: isSuper ? 'superadmin_01' : 'user_sara_01',
        name: isSuper ? 'مدير المنصة العام' : 'د. سارة (أخصائية أرطوفونيا)',
        email,
        role: isSuper ? 'superadmin' : 'orthophoniste',
        specialty: isSuper ? 'Platform Admin' : 'Orthophonie'
      }, 'token_elamal_' + Date.now());

      setLoading(false);
      navigate(isSuper ? '/superadmin' : '/appointments');
    }, 400);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
      padding: '1.5rem'
    }}>
      <div className="card-glass animate-fade" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(255, 255, 255, 0.9)'
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary-600), var(--accent-600))',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Stethoscope size={30} />
          </div>
          <h1 className="title-xl" style={{ fontSize: '1.6rem' }}>منصة PsyPro السحابية</h1>
          <p className="subtitle">المنظومة الإكلينيكية الذكية للعيادات النفسية والأرطوفونية</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Clinic Subdomain Selector */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building2 size={15} color="var(--primary-600)" />
              <span>نطاق العيادة (Subdomain)</span>
            </label>
            <select
              className="form-select"
              value={selectedSubdomain}
              onChange={(e) => setSelectedSubdomain(e.target.value)}
            >
              {availableTenants.map((t) => (
                <option key={t.id} value={t.subdomain}>
                  {t.name} ({t.subdomain}.psypro.local)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={15} color="var(--primary-600)" />
              <span>البريد الإلكتروني المهني</span>
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="sara@elamal.dz"
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={15} color="var(--primary-600)" />
              <span>كلمة المرور</span>
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'جاري التحقق...' : 'دخول المنصة'}
            <ArrowLeft size={16} />
          </button>
        </form>

        {/* Quick Demo Credentials Shortcut */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--slate-200)',
          fontSize: '0.78rem',
          color: 'var(--slate-600)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>عيادة الأمل (د. سارة):</strong></span>
            <code style={{ direction: 'ltr', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>sara@elamal.dz</code>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>كلمة المرور:</strong></span>
            <code style={{ direction: 'ltr', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>password123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
