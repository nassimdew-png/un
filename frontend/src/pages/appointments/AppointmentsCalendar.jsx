import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, User, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function AppointmentsCalendar() {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [appointments, setAppointments] = useState([
    {
      id: 'app_01',
      patientName: 'ياسين بن علي (7 سنوات)',
      specialistName: 'د. نادية مرابط',
      date: '2026-08-19',
      time: '09:00 - 09:45',
      type: 'حصيلة أرطوفونية أولية (Bilan)',
      status: 'completed',
      fee: '3500 دج'
    },
    {
      id: 'app_02',
      patientName: 'سارة قدور (10 سنوات)',
      specialistName: 'د. نادية مرابط',
      date: '2026-08-19',
      time: '10:30 - 11:15',
      type: 'إعادة تأهيل طلاقة كلامية (تأتأة)',
      status: 'in_progress',
      fee: '2500 دج'
    },
    {
      id: 'app_03',
      patientName: 'أمين بلحاج (30 سنة)',
      specialistName: 'أ. كريم سعيدي',
      date: '2026-08-19',
      time: '14:00 - 15:00',
      type: 'استشارة نفسية وعلاج CBT',
      status: 'scheduled',
      fee: '4000 دج'
    }
  ]);

  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    time: '11:30 - 12:15',
    type: 'جلسة متابعة أرطوفونية'
  });

  const handleBook = (e) => {
    e.preventDefault();
    if (!newAppointment.patientName) return;

    setAppointments([
      ...appointments,
      {
        id: 'app_' + Date.now(),
        patientName: newAppointment.patientName,
        specialistName: 'د. نادية مرابط',
        date: '2026-08-19',
        time: newAppointment.time,
        type: newAppointment.type,
        status: 'scheduled',
        fee: '2500 دج'
      }
    ]);
    setIsBookModalOpen(false);
    setNewAppointment({ patientName: '', time: '11:30 - 12:15', type: 'جلسة متابعة أرطوفونية' });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="title-xl">رزنامة المواعيد والجلسات اليومية</h1>
          <p className="subtitle">إدارة جدول الأخصائيين، الحصائل والمتابعات الإكلينيكية</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsBookModalOpen(true)}>
          <Plus size={18} />
          <span>حجز موعد جديد</span>
        </button>
      </div>

      {/* Today Quick Banner */}
      <div className="card" style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, var(--primary-50), var(--accent-50))',
        border: '1px solid var(--primary-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'white', color: 'var(--primary-600)', boxShadow: 'var(--shadow-sm)' }}>
            <CalendarIcon size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--slate-900)' }}>
              جدول اليوم: الأربعاء، 19 أوت 2026
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              لديك 3 جلسات مجدولة (1 حصيلة أولية، 1 إعادة تأهيل، 1 استشارة نفسية)
            </div>
          </div>
        </div>
        <span className="badge badge-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
          3 مواعيد متبقية
        </span>
      </div>

      {/* Appointments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {appointments.map((app) => (
          <div key={app.id} className="card" style={{
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRight: `4px solid ${app.status === 'completed' ? 'var(--success-500)' : (app.status === 'in_progress' ? 'var(--warning-500)' : 'var(--primary-500)')}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {/* Time Column */}
              <div style={{
                textAlign: 'center',
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--slate-100)',
                minWidth: '120px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                  <Clock size={14} />
                  <span>التوقيت</span>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--slate-800)', fontSize: '0.95rem' }}>{app.time}</div>
              </div>

              {/* Details Column */}
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                  {app.patientName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                  <span>{app.type}</span>
                  <span>•</span>
                  <span>الأخصائي: {app.specialistName}</span>
                </div>
              </div>
            </div>

            {/* Status & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className={`badge badge-${app.status === 'completed' ? 'success' : (app.status === 'in_progress' ? 'warning' : 'primary')}`}>
                {app.status === 'completed' ? 'مكتملة' : (app.status === 'in_progress' ? 'جارية الآن' : 'مجدولة')}
              </span>
              <div style={{ fontWeight: 700, color: 'var(--slate-700)', fontSize: '0.9rem' }}>{app.fee}</div>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                فتح الملف
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Book Modal */}
      <Modal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} title="حجز جلسة أو موعد جديد">
        <form onSubmit={handleBook}>
          <div className="form-group">
            <label className="form-label">اسم المريض</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="مثال: يوسف حمدي" 
              value={newAppointment.patientName}
              onChange={(e) => setNewAppointment({ ...newAppointment, patientName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">نوع الجلسة</label>
            <select 
              className="form-select"
              value={newAppointment.type}
              onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
            >
              <option value="حصيلة أرطوفونية أولية (Bilan)">حصيلة أرطوفونية أولية (Bilan)</option>
              <option value="جلسة متابعة وإعادة تأهيل لغوي">جلسة متابعة وإعادة تأهيل لغوي</option>
              <option value="استشارة نفسية أولية">استشارة نفسية أولية</option>
              <option value="تطبيق مقياس نفسي على التابلت">تطبيق مقياس نفسي على التابلت</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">التوقيت</label>
            <input 
              type="text" 
              className="form-input" 
              value={newAppointment.time}
              onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
              dir="ltr"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsBookModalOpen(false)}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-primary">
              تأكيد الحجز
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
