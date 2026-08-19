import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useTenantStore } from '../../store/useTenantStore';
import { Stethoscope, Lock, Mail, Building2, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('specialist@elamal.local');
  const [password, setPassword] = useState('password123');
  const [selectedSubdomain, setSelectedSubdomain] = useState('elamal');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const { availableTenants, selectTenantBySubdomain } = useTenantStore();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      selectTenantBySubdomain(selectedSubdomain);
      const isSuper = email.includes('admin');

      login({
        id: isSuper ? 'superadmin_01' : 'user_specialist_01',
        name: isSuper ? 'مدير المنصة العام' : 'د. نادية مرابط',
        email,
        role: isSuper ? 'superadmin' : 'orthophoniste',
        specialty: isSuper ? 'Platform Admin' : 'Orthophonie'
      }, 'mock_token_' + Date.now());

      setLoading(false);
      navigate(isSuper ? '/superadmin' : '/appointments');
    }, 600);
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
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary-600), var(--accent-600))',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Stethoscope size={28} />
          </div>
          <h1 className="title-xl" style={{ fontSize: '1.6rem' }}>منصة PsyPro السحابية</h1>
          <p className="subtitle">تسجيل الدخول إلى العيادة المتخصصة</p>
        </div>

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
              placeholder="specialist@clinic.com"
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
          fontSize: '0.75rem',
          color: 'var(--slate-500)',
          textAlign: 'center'
        }}>
          <div><strong>حساب تجريبي (أخصائي):</strong> specialist@elamal.local</div>
          <div><strong>حساب تجريبي (SuperAdmin):</strong> admin@psypro.local</div>
        </div>
      </div>
    </div>
  );
}
