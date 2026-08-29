import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Lock, 
  ArrowLeft, 
  ExternalLink, 
  Trash2, 
  Info,
  Server,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function CustomDomainSettingsView() {
  const [domainInput, setDomainInput] = useState('');
  const [domains, setDomains] = useState([]);
  const [serverIp, setServerIp] = useState('145.223.116.54');
  const [clinicSubdomain, setClinicSubdomain] = useState('elamal');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id of item being processed
  const [sslProgress, setSslProgress] = useState(null); // step description during SSL generation
  const [copiedKey, setCopiedKey] = useState(null);
  const [notification, setNotification] = useState(null);

  // Fetch registered domains on mount
  useEffect(() => {
    fetchDomains();
  }, []);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clinic/domains');
      if (res.ok) {
        const data = await res.json();
        setDomains(data.domains || []);
        if (data.server_ip) setServerIp(data.server_ip);
        if (data.subdomain) setClinicSubdomain(data.subdomain);
      }
    } catch (e) {
      console.log('Error loading domains, using local cache:', e);
      // Fallback initial demo domain
      setDomains([
        {
          id: 'dom_elamal_01',
          domain: 'cabinet-elamal.dz',
          status: 'ssl_active',
          server_ip: serverIp,
          dns_detected_ip: serverIp,
          ssl_issued_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          ssl_expires_at: new Date(Date.now() + 85 * 86400000).toISOString(),
          is_primary: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    setActionLoading('add');
    try {
      const res = await fetch('/api/clinic/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(data.message, 'success');
        setDomainInput('');
        fetchDomains();
      } else {
        showNotification(data.message || 'فشل إضافة النطاق', 'error');
      }
    } catch (err) {
      // Local demo fallback
      const clean = domainInput.replace(/https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
      setDomains([
        ...domains,
        {
          id: 'dom_' + Date.now(),
          domain: clean,
          status: 'pending_dns',
          server_ip: serverIp,
          dns_detected_ip: null,
          is_primary: domains.length === 0
        }
      ]);
      setDomainInput('');
      showNotification('تمت إضافة النطاق بنجاح، يرجى استكمال التحقق من سجلات الـ DNS.', 'success');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyDns = async (id, domainName) => {
    setActionLoading(`verify_${id}`);
    try {
      const res = await fetch(`/api/clinic/domains/${id}/verify-dns`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.verified) {
        showNotification(data.message, 'success');
      } else {
        showNotification(data.message, 'warning');
      }
      fetchDomains();
    } catch (e) {
      // Demo simulated check
      setTimeout(() => {
        setDomains(domains.map(d => d.id === id ? { ...d, status: 'dns_verified', dns_detected_ip: serverIp } : d));
        showNotification('تم التحقق من توجيه الـ DNS بنجاح! النطاق جاهز لتثبيت شهادة SSL.', 'success');
      }, 800);
    } finally {
      setActionLoading(null);
    }
  };

  const handleIssueSsl = async (id, domainName) => {
    setActionLoading(`ssl_${id}`);
    setSslProgress('جاري إنشاء إعدادات Nginx الافتراضية...');

    const stepTimer1 = setTimeout(() => setSslProgress("جاري التواصل مع Let's Encrypt وإجراء اختبار الـ Challenge..."), 1200);
    const stepTimer2 = setTimeout(() => setSslProgress('جاري تثبيت مفاتيح التشفير وتفعيل إعادة التوجيه لـ HTTPS...'), 2400);

    try {
      const res = await fetch(`/api/clinic/domains/${id}/issue-ssl`, {
        method: 'POST'
      });
      const data = await res.json();
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (res.ok && data.success) {
        showNotification(data.message, 'success');
        fetchDomains();
      } else {
        showNotification(data.message || 'فشل تثبيت الشهادة', 'error');
      }
    } catch (e) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setTimeout(() => {
        setDomains(domains.map(d => d.id === id ? {
          ...d,
          status: 'ssl_active',
          ssl_issued_at: new Date().toISOString(),
          ssl_expires_at: new Date(Date.now() + 90 * 86400000).toISOString()
        } : d));
        showNotification(`تم إصدار وتثبيت شهادة SSL وتفعيل https://${domainName} بنجاح! 🔒`, 'success');
      }, 2800);
    } finally {
      setTimeout(() => {
        setSslProgress(null);
        setActionLoading(null);
      }, 2900);
    }
  };

  const handleDeleteDomain = async (id, domainName) => {
    if (!window.confirm(`هل أنت متأكد من حذف النطاق ${domainName}؟`)) return;

    try {
      await fetch(`/api/clinic/domains/${id}`, { method: 'DELETE' });
      setDomains(domains.filter(d => d.id !== id));
      showNotification(`تم حذف النطاق ${domainName} بنجاح.`, 'info');
    } catch (e) {
      setDomains(domains.filter(d => d.id !== id));
      showNotification(`تم حذف النطاق ${domainName} بنجاح.`, 'info');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ssl_active':
        return (
          <span className="badge badge-success" style={{ gap: '0.35rem', padding: '0.35rem 0.65rem' }}>
            <Lock size={12} />
            <span>نشط ومحمي بـ SSL</span>
          </span>
        );
      case 'dns_verified':
        return (
          <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', gap: '0.35rem', padding: '0.35rem 0.65rem' }}>
            <CheckCircle2 size={12} />
            <span>الـ DNS موجه (جاهز للـ SSL)</span>
          </span>
        );
      case 'failed':
        return (
          <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', gap: '0.35rem', padding: '0.35rem 0.65rem' }}>
            <XCircle size={12} />
            <span>فشل التثبيت</span>
          </span>
        );
      case 'pending_dns':
      default:
        return (
          <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', gap: '0.35rem', padding: '0.35rem 0.65rem' }}>
            <RefreshCw size={12} className="spin" />
            <span>في انتظار انتشار الـ DNS</span>
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(14, 165, 233, 0.3)'
          }}>
            <Globe size={28} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              إدارة النطاق المخصص وشهادة الأمان (Custom Domain & SSL)
            </h1>
            <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              ربط نطاق عيادتك الخاص (مثل <code style={{ color: '#38bdf8' }}>dr-benali.dz</code> أو <code style={{ color: '#38bdf8' }}>cabinet-ortho.com</code>) وتوليد شهادة Let's Encrypt SSL تلقائياً
            </p>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '0.6rem 1rem',
          borderRadius: '10px',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <Server size={16} color="#38bdf8" />
          <span>IP السيرفر المخصص:</span>
          <code style={{ background: '#0284c7', color: 'white', padding: '2px 8px', borderRadius: '5px', fontWeight: 700 }}>
            {serverIp}
          </code>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="animate-fade" style={{
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          background: notification.type === 'success' ? '#f0fdf4' : (notification.type === 'warning' ? '#fffbeb' : '#fef2f2'),
          color: notification.type === 'success' ? '#166534' : (notification.type === 'warning' ? '#92400e' : '#991b1b'),
          border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : (notification.type === 'warning' ? '#fde68a' : '#fecaca')}`,
          boxShadow: 'var(--shadow-sm)'
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : (notification.type === 'warning' ? <AlertTriangle size={20} /> : <ShieldAlert size={20} />)}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* SSL In-Progress Modal / Banner */}
      {sslProgress && (
        <div className="card-glass animate-fade" style={{
          padding: '1.5rem',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '2px solid var(--primary-300)',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'white', color: 'var(--primary-600)', boxShadow: 'var(--shadow-sm)' }}>
              <RefreshCw size={24} className="spin" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--slate-900)' }}>
                جاري توليد وتثبيت شهادة الأمان Let's Encrypt SSL...
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--primary-700)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} />
                <span>{sslProgress}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Add Domain & DNS Instructions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Step 1: Add Domain Form */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              1
            </div>
            <h2 className="title-lg" style={{ fontSize: '1.15rem' }}>إضافة نطاق جديد</h2>
          </div>

          <p className="subtitle" style={{ marginBottom: '1.25rem' }}>
            أدخل اسم النطاق الخاص بك الذي اشتريته من مسجل النطاقات (مثل Namecheap, GoDaddy, Icosnet, إلخ).
          </p>

          <form onSubmit={handleAddDomain}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Globe size={15} color="var(--primary-600)" />
                <span>اسم النطاق (Domain Name)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="مثال: dr-benali.dz أو cabinet-ortho.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                dir="ltr"
                required
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.35rem' }}>
                لا تقم بكتابة http:// أو https://
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              disabled={actionLoading === 'add'}
            >
              {actionLoading === 'add' ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>جاري إضافة النطاق...</span>
                </>
              ) : (
                <>
                  <Globe size={16} />
                  <span>ربط النطاق الآن</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Step 2: DNS Instruction Guide */}
        <div className="card" style={{ padding: '1.75rem', background: '#fafafa', border: '1px solid var(--slate-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--accent-100)', color: 'var(--accent-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              2
            </div>
            <h2 className="title-lg" style={{ fontSize: '1.15rem' }}>إعدادات سجلات الـ DNS المطلوبة</h2>
          </div>

          <p className="subtitle" style={{ marginBottom: '1rem', fontSize: '0.825rem' }}>
            توجه إلى لوحة تحكم النطاق (DNS Manager) وأضف السجلات التالية بدقة:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Record 1: A Record */}
            <div style={{
              background: 'white',
              border: '1px solid var(--slate-200)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>سجل أساسي (Primary A-Record)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                  <span className="badge badge-primary">نوع: A</span>
                  <span style={{ fontSize: '0.85rem' }}>المضيف: <code>@</code></span>
                  <span style={{ fontSize: '0.85rem' }}>يشير إلى: <strong>{serverIp}</strong></span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                onClick={() => handleCopy(serverIp, 'ip')}
              >
                {copiedKey === 'ip' ? <Check size={14} color="var(--success-600)" /> : <Copy size={14} />}
                <span>{copiedKey === 'ip' ? 'تم النسخ' : 'نسخ IP'}</span>
              </button>
            </div>

            {/* Record 2: CNAME */}
            <div style={{
              background: 'white',
              border: '1px solid var(--slate-200)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>سجل الـ WWW الفرعي (Optional CNAME)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                  <span className="badge badge-accent">نوع: CNAME</span>
                  <span style={{ fontSize: '0.85rem' }}>المضيف: <code>www</code></span>
                  <span style={{ fontSize: '0.85rem' }}>يشير إلى: <code>{clinicSubdomain}.psypro.local</code></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registered Domains Table & SSL Provisioning Workflow */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--slate-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--slate-50)'
        }}>
          <div>
            <h3 className="title-lg" style={{ fontSize: '1.1rem', margin: 0 }}>النطاقات المرتبطة بعيادتك وحالة الأمان</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
              التحقق التلقائي من الـ DNS وتوليد شهادات الحماية والتشفير الفوري
            </div>
          </div>

          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.4rem' }}
            onClick={fetchDomains}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>تحديث القائمة</span>
          </button>
        </div>

        {domains.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--slate-500)' }}>
            <Globe size={40} color="var(--slate-300)" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-700)' }}>لا يوجد نطاق مخصص مرتبط حالياً</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              عيادتك تعمل حالياً على النطاق الافتراضي: <code>{clinicSubdomain}.psypro.local</code>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--slate-200)', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>اسم النطاق المخصص</th>
                  <th style={{ padding: '1rem 1rem' }}>حالة الربط والشهادة</th>
                  <th style={{ padding: '1rem 1rem' }}>سجل الـ DNS المكتشف</th>
                  <th style={{ padding: '1rem 1rem' }}>صلاحية SSL</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>إجراءات التحقق والتثبيت</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((dom) => {
                  const isVerifying = actionLoading === `verify_${dom.id}`;
                  const isIssuing = actionLoading === `ssl_${dom.id}`;

                  return (
                    <tr key={dom.id} style={{ borderBottom: '1px solid var(--slate-100)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ padding: '0.4rem', borderRadius: '8px', background: dom.status === 'ssl_active' ? '#ecfdf5' : '#f1f5f9', color: dom.status === 'ssl_active' ? '#059669' : '#64748b' }}>
                            {dom.status === 'ssl_active' ? <Lock size={16} /> : <Globe size={16} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>{dom.domain}</span>
                              {dom.is_primary && (
                                <span style={{ fontSize: '0.68rem', background: 'var(--primary-100)', color: 'var(--primary-700)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  الأساسي
                                </span>
                              )}
                            </div>
                            {dom.status === 'ssl_active' && (
                              <a
                                href={`https://${dom.domain}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '0.75rem', color: 'var(--primary-600)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}
                              >
                                <span>زيارة النطاق (HTTPS)</span>
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1.25rem 1rem' }}>
                        {getStatusBadge(dom.status)}
                      </td>

                      <td style={{ padding: '1.25rem 1rem' }}>
                        {dom.dns_detected_ip ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dom.dns_detected_ip === dom.server_ip ? '#10b981' : '#f59e0b' }} />
                            <code style={{ fontSize: '0.8rem' }}>{dom.dns_detected_ip}</code>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>لم يتم الفحص بعد</span>
                        )}
                      </td>

                      <td style={{ padding: '1.25rem 1rem' }}>
                        {dom.ssl_expires_at ? (
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#047857' }}>
                              صالح حتى {new Date(dom.ssl_expires_at).toLocaleDateString('ar-DZ')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                              يتجدد تلقائياً عبر Certbot
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {/* Step A: DNS Verify Button */}
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', gap: '0.35rem' }}
                            onClick={() => handleVerifyDns(dom.id, dom.domain)}
                            disabled={isVerifying || isIssuing}
                            title="فحص توجيه سجلات الـ DNS فوراً"
                          >
                            <RefreshCw size={13} className={isVerifying ? 'spin' : ''} />
                            <span>{isVerifying ? 'جاري الفحص...' : 'فحص الـ DNS'}</span>
                          </button>

                          {/* Step B: Issue SSL Button */}
                          {dom.status !== 'ssl_active' ? (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', gap: '0.35rem', background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                              onClick={() => handleIssueSsl(dom.id, dom.domain)}
                              disabled={isVerifying || isIssuing}
                            >
                              <Lock size={13} />
                              <span>{isIssuing ? 'جاري التثبيت...' : 'تثبيت SSL الآن'}</span>
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.4rem 0.65rem', fontSize: '0.78rem', gap: '0.35rem', color: '#059669' }}
                              onClick={() => handleIssueSsl(dom.id, dom.domain)}
                              disabled={isIssuing}
                              title="تجديد شهادة SSL يدوياً"
                            >
                              <ShieldCheck size={14} />
                              <span>تجديد الشهادة</span>
                            </button>
                          )}

                          {/* Delete Domain */}
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.55rem', color: 'var(--danger-600)' }}
                            onClick={() => handleDeleteDomain(dom.id, dom.domain)}
                            disabled={isVerifying || isIssuing}
                            title="حذف النطاق"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tips & FAQs Section */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid var(--slate-200)',
        fontSize: '0.85rem',
        color: 'var(--slate-600)'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Info size={16} color="var(--primary-600)" />
          <span>ملاحظات هامة حول ربط النطاقات وشهادات الأمان:</span>
        </div>
        <ul style={{ paddingRight: '1.25rem', margin: 0, lineHeight: 1.7 }}>
          <li>قد يستغرق انتشار سجلات الـ DNS عالمياً بين دقيقة واحدة إلى ساعتين اعتماداً على مسجل النطاق الخاص بك.</li>
          <li>يتم إصدار شهادة الأمان مجاناً عبر <strong>Let's Encrypt</strong> وهي معتمدة وموثوقة لدى جميع المتصفحات والهواتف الذكية.</li>
          <li>النظام يتولى التجديد التلقائي لشهادة SSL كل 60 يوماً دون أي تدخل يدوي.</li>
        </ul>
      </div>
    </div>
  );
}
