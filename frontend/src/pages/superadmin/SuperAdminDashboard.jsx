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
  Search
} from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function SuperAdminDashboard() {
  const { availableTenants } = useTenantStore();
  const [tenants, setTenants] = useState(availableTenants);
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
    <div>
      {/* Top Title & Quick Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="title-xl">لوحة إدارة المنصة العامة (SuperAdmin)</h1>
          <p className="subtitle">إدارة عيادات ومراكز علم النفس والأرطوفونيا المشتركة بالسحابة</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={18} />
          <span>إضافة عيادة جديدة</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="subtitle">إجمالي العيادات النشطة</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{tenants.length} عيادات</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'var(--accent-50)', color: 'var(--accent-600)' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="subtitle">سجلات المرضى النشطة</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>109 مريض</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'var(--indigo-50)', color: 'var(--indigo-600)' }}>
            <Sparkles size={24} />
          </div>
          <div>
            <div className="subtitle">حصائل مولدة بالذكاء الاصطناعي</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>342 تقرير</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'var(--success-50)', color: 'var(--success-700)' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div className="subtitle">نسبة تجديد الاشتراكات</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>98.4%</div>
          </div>
        </div>
      </div>

      {/* Clinics Multi-Tenant Management Table */}
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
                    {t.subdomain}.psypro.local
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
              <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>.psypro.local</span>
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
