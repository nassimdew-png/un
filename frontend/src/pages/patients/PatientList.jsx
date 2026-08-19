import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Users, Search, Plus, FileText, Phone, UserCheck, Calendar } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  const [newPatient, setNewPatient] = useState({
    full_name: '',
    birth_date: '2018-05-12',
    gender: 'male',
    guardian_name: '',
    phone: '',
    clinical_tags: 'تأخر لغوي, اضطراب نطق'
  });

  useEffect(() => {
    apiService.getPatients().then(data => setPatients(data));
  }, []);

  const handleAddPatient = (e) => {
    e.preventDefault();
    if (!newPatient.full_name) return;

    const patientObj = {
      _id: 'pat_' + Date.now(),
      full_name: newPatient.full_name,
      birth_date: newPatient.birth_date,
      gender: newPatient.gender,
      guardian_name: newPatient.guardian_name,
      phone: newPatient.phone,
      clinical_tags: newPatient.clinical_tags.split(',').map(t => t.trim()),
      anamnese_generale: {
        pregnancy_notes: 'طبيعي',
        motor_development: 'طبيعي',
        school_grade: 'تمهيدي'
      }
    };

    setPatients([patientObj, ...patients]);
    setIsAddModalOpen(false);
    setNewPatient({ full_name: '', birth_date: '2018-05-12', gender: 'male', guardian_name: '', phone: '', clinical_tags: 'تأخر لغوي' });
  };

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="title-xl">سجلات وملفات المرضى</h1>
          <p className="subtitle">الملفات الإكلينيكية، السوابق النمائية، والحصائل التشخيصية</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>فتح ملف مريض جديد</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, background: 'var(--slate-50)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
          <Search size={18} color="var(--slate-400)" />
          <input 
            type="text" 
            placeholder="بحث بالاسم، رقم الهاتف، أو الولي..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', fontFamily: 'inherit' }}
          />
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>
          {filteredPatients.length} ملفات مسجلة
        </span>
      </div>

      {/* Patient Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredPatients.map((patient) => (
          <div 
            key={patient._id} 
            className="card" 
            style={{ 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              cursor: 'pointer' 
            }}
            onClick={() => navigate(`/patients/${patient._id}`)}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: patient.gender === 'female' ? '#fdf2f8' : 'var(--accent-50)',
                    color: patient.gender === 'female' ? '#db2777' : 'var(--accent-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem'
                  }}>
                    {patient.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                      {patient.full_name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      تاريخ الميلاد: {patient.birth_date}
                    </div>
                  </div>
                </div>
                <span className="badge badge-primary">
                  {patient.gender === 'female' ? 'أنثى' : 'ذكر'}
                </span>
              </div>

              {/* Anamnesis / Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                {patient.clinical_tags?.map((tag, i) => (
                  <span key={i} className="badge badge-accent" style={{ fontSize: '0.75rem' }}>
                    {tag}
                  </span>
                ))}
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserCheck size={14} color="var(--slate-400)" />
                  <span>الولي: {patient.guardian_name || 'ذاتي'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} color="var(--slate-400)" />
                  <span dir="ltr">{patient.phone || 'غير مسجل'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary-600)', fontWeight: 700 }}>
                عرض الحصائل والسوابق ←
              </span>
              <FileText size={16} color="var(--primary-600)" />
            </div>
          </div>
        ))}
      </div>

      {/* Add Patient Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="تسجيل ملف مريض جديد وفتح السوابق">
        <form onSubmit={handleAddPatient}>
          <div className="form-group">
            <label className="form-label">الاسم واللقب الكامل</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="مثال: ياسمين بلقاسم" 
              value={newPatient.full_name}
              onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">تاريخ الميلاد</label>
              <input 
                type="date" 
                className="form-input" 
                value={newPatient.birth_date}
                onChange={(e) => setNewPatient({ ...newPatient, birth_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">الجنس</label>
              <select 
                className="form-select"
                value={newPatient.gender}
                onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">اسم الولي أو المرافق</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="مثال: فاطمة بلقاسم (الأم)" 
              value={newPatient.guardian_name}
              onChange={(e) => setNewPatient({ ...newPatient, guardian_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">رقم الهاتف للتواصل</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="0661 00 00 00" 
              value={newPatient.phone}
              onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label className="form-label">الوسوم والتشخيص الأولي (مفصولة بفواصل)</label>
            <input 
              type="text" 
              className="form-input" 
              value={newPatient.clinical_tags}
              onChange={(e) => setNewPatient({ ...newPatient, clinical_tags: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-primary">
              حفظ وفتح الملف الإكلينيكي
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
