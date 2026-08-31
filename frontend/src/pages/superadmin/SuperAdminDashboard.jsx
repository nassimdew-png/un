import React, { useState } from 'react';
import { useTenantStore } from '../../store/useTenantStore';
import { 
  Building2, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Plus, 
  CheckCircle2, 
  CreditCard, 
  Search, 
  Globe, 
  Receipt,
  FileCheck,
  RefreshCw,
  LayoutDashboard 
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import SuperAdminDashboardView from '../../components/super-admin/SuperAdminDashboardView';
import SuperAdminCustomDomainsView from '../../components/super-admin/SuperAdminCustomDomainsView';
import BaridiMobApprovalInbox from '../../components/super-admin/BaridiMobApprovalInbox';

export default function SuperAdminDashboard() {
  const { availableTenants } = useTenantStore();
  const [tenants, setTenants] = useState(availableTenants);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'payments' | 'domains' | 'clinics'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClinic, setNewClinic] = useState({
    name: '',
    subdomain: '',
    specialty_type: 'multidisciplinary',
    plan: 'annual_pro'
  });

  const handleAddClinic = (e) => {
    e.preventDefault();
    if (!newClinic.name || !newClinic.subdomain) return;

    setTenants([
      ...tenants,
      {
        id: 'tenant_' + Date.now(),
        name: newClinic.name,
        subdomain: newClinic.subdomain.toLowerCase(),
        specialty_type: newClinic.specialty_type,
        patientsCount: 0,
      }
    ]);
    setIsAddModalOpen(false);
    setNewClinic({ name: '', subdomain: '', specialty_type: 'multidisciplinary', plan: 'annual_pro' });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Title & Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="title-xl">لوحة إدارة المنصة العامة (SuperAdmin)</h1>
          <p className="subtitle">إدارة اشتراكات بريدي موب، النطاقات المخصصة بالسحابة، وعيادات علم النفس والأرطوفونيا</p>
        </div>
        {activeTab === 'clinics' && (
          <button 
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} />
            <span>إضافة عيادة جديدة</span>
          </button>
        )}
      </div>

      {/* Top Live Stats Bar */}
      <SuperAdminDashboardView />

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: '1px solid var(--slate-200)',
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.925rem',
            fontWeight: activeTab === 'overview' ? 800 : 500,
            color: activeTab === 'overview' ? 'var(--primary-700)' : 'var(--slate-600)',
            borderBottom: activeTab === 'overview' ? '3px solid var(--primary-600)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <LayoutDashboard size={18} color={activeTab === 'overview' ? 'var(--primary-600)' : 'var(--slate-400)'} />
          <span>🏢 العيادات والمستأجرون (Clinics & Tenants)</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.925rem',
            fontWeight: activeTab === 'payments' ? 800 : 500,
            color: activeTab === 'payments' ? 'var(--primary-700)' : 'var(--slate-600)',
            borderBottom: activeTab === 'payments' ? '3px solid var(--primary-600)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Receipt size={18} color={activeTab === 'payments' ? 'var(--primary-600)' : 'var(--slate-400)'} />
          <span>📑 المعاملات ووصولات الدفع (BaridiMob & CCP)</span>
        </button>

        <button
          onClick={() => setActiveTab('domains')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.925rem',
            fontWeight: activeTab === 'domains' ? 800 : 500,
            color: activeTab === 'domains' ? 'var(--primary-700)' : 'var(--slate-600)',
            borderBottom: activeTab === 'domains' ? '3px solid var(--primary-600)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Globe size={18} color={activeTab === 'domains' ? 'var(--primary-600)' : 'var(--slate-400)'} />
          <span>🌐 النطاقات المخصصة وSSL</span>
        </button>
      </div>

      {/* Tab 1: Overview & Clinics List */}
      {activeTab === 'overview' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="title-lg" style={{ fontSize: '1.1rem' }}>قائمة العيادات والمراكز المشتركة</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--slate-50)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <Search size={15} color="var(--slate-400)" />
              <input 
                type="text" 
                placeholder="بحث عن عيادة أو نطاق..." 
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                <th style={{ padding: '0.85rem 1.5rem' }}>اسم العيادة</th>
                <th style={{ padding: '0.85rem 1rem' }}>النطاق الفرعي (Subdomain)</th>
                <th style={{ padding: '0.85rem 1rem' }}>التخصص الإكلينيكي</th>
                <th style={{ padding: '0.85rem 1rem' }}>حالة الاشتراك</th>
                <th style={{ padding: '0.85rem 1rem' }}>سجلات المرضى</th>
                <th style={{ padding: '0.85rem 1.5rem', textAlign: 'left' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--slate-100)', fontSize: '0.875rem' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={16} color="var(--primary-600)" />
                      {t.name}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <code style={{ background: 'var(--slate-100)', padding: '0.2rem 0.4rem', borderRadius: '4px', color: 'var(--accent-700)', fontSize: '0.8rem' }}>
                      {t.subdomain}.psypro.tech
                    </code>
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <span className="badge badge-accent">
                      {t.specialty_type === 'orthophonie' ? 'أرطوفونيا' : (t.specialty_type === 'psychology' ? 'علم نفس' : 'متعدد التخصصات')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1rem' }}>
                    <span className="badge badge-success">
                      <CheckCircle2 size={12} />
                      نشط (ساري)
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1rem', fontWeight: 600 }}>
                    {t.patientsCount || 48} ملف
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                      إدارة الحساب
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Payments & BaridiMob Receipts */}
      {activeTab === 'payments' && (
        <BaridiMobApprovalInbox />
      )}

      {/* Tab 3: Custom Domains & SSL */}
      {activeTab === 'domains' && (
        <SuperAdminCustomDomainsView />
      )}

      {/* Add Clinic Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إنشاء عيادة جديدة وتفعيل النطاق">
        <form onSubmit={handleAddClinic}>
          <div className="form-group">
            <label className="form-label">اسم العيادة أو المركز</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="مثال: مركز الشفاء للتخاطب والدعم النفسي" 
              value={newClinic.name}
              onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">النطاق الفرعي المخصص (Subdomain)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="al-shifa" 
                value={newClinic.subdomain}
                onChange={(e) => setNewClinic({ ...newClinic, subdomain: e.target.value })}
                required
                dir="ltr"
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>.psypro.tech</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">التخصص الأساسي</label>
            <select 
              className="form-select"
              value={newClinic.specialty_type}
              onChange={(e) => setNewClinic({ ...newClinic, specialty_type: e.target.value })}
            >
              <option value="multidisciplinary">متعدد التخصصات (أرطوفونيا وعلم نفس)</option>
              <option value="orthophonie">أرطوفونيا وتخاطب فقط</option>
              <option value="psychology">استشارات وعلاج نفسي فقط</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-primary">
              إنشاء وتفعيل النطاق
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
