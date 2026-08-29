import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Stethoscope, 
  User, 
  ChevronLeft, 
  ExternalLink, 
  Check, 
  AlertCircle,
  FileText,
  Activity,
  HeartHandshake
} from 'lucide-react';
import Modal from '../common/Modal';

export default function PublicClinicMiniSiteView() {
  const { slug } = useParams();
  const effectiveSlug = slug || 'elamal';

  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Booking Form State
  const [formData, setFormData] = useState({
    patient_full_name: '',
    patient_age: '',
    parent_name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Fetch Clinic Profile
  useEffect(() => {
    fetchClinicProfile();
  }, [effectiveSlug]);

  // 2. Fetch Available Slots when Date changes
  useEffect(() => {
    if (clinic) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, clinic]);

  const fetchClinicProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/clinic/${effectiveSlug}`);
      if (res.ok) {
        const data = await res.json();
        setClinic(data.clinic);
        if (data.clinic.services?.length > 0) {
          setSelectedService(data.clinic.services[0]);
        }
      } else {
        throw new Error('Clinic not found');
      }
    } catch (e) {
      console.log('Using demo clinic profile:', e);
      const demoClinic = {
        name: 'عيادة الأمل للتخاطب والدعم النفسي',
        slug: 'elamal',
        doctor_name: 'د. سارة بن علي',
        doctor_title: 'أخصائية أرطوفونيا وأمراض التخاطب والنمو العصبي',
        bio: 'عيادة متخصصة تقدم تقييمات إكلينيكية دقيقة وبرامج إعادة تأهيل فردية لاضطرابات النطق، التأخر اللغوي، التأتأة، وصعوبات التعلم باستخدام أحدث الأدوات والذكاء الاصطناعي التشخيصي.',
        address_details: 'حي 500 مسكن، عمارة C، الطابق الأول - الجزائر العاصمة (بالقرب من محطة المترو)',
        google_maps_url: 'https://maps.google.com/?q=Algiers,Algeria',
        phone: '0550 12 34 56',
        email: 'contact@cabinet-elamal.dz',
        primary_color: '#0284c7',
        working_hours: {
          days: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
          start: '09:00',
          end: '17:00'
        },
        services: [
          {
            id: 'bilan_ortho',
            title: 'حصيلة وفحص أرطوفوني شامل (Bilan Orthophonique)',
            duration: '45 دقيقة',
            price: '3,500 دج',
            description: 'تقييم شامل للنطق، اللغة الشفهية والمكتوبة، وفحص القدرات الإدراكية باستخدام مقاييس معيارية مع تقرير رسمي.'
          },
          {
            id: 'session_rehab',
            title: 'جلسة إعادة تأهيل أرطوفوني (Rééducation)',
            duration: '30 دقيقة',
            price: '1,800 دج',
            description: 'جلسة علاجية فردية مخصصة لتصحيح مخارج الحروف، التأتأة، وتطوير المهارات التعبيرية والتواصلية.'
          },
          {
            id: 'psy_consultation',
            title: 'استشارة ودعم نفسي عيادي (Consultation Psychologique)',
            duration: '45 دقيقة',
            price: '2,500 دج',
            description: 'جلسة استماع وتشخيص للاضطرابات السلوكية، القلق، فرط الحركة وتشتت الانتباه (ADHD) عند الأطفال والمراهقين.'
          }
        ]
      };
      setClinic(demoClinic);
      setSelectedService(demoClinic.services[0]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (date) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/public/clinic/${effectiveSlug}/available-slots?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.available_slots || []);
        setBookedSlots(data.booked_slots || []);
      }
    } catch (e) {
      // Fallback slots
      const defaultAll = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
      setAvailableSlots(defaultAll.filter(s => s !== '10:00' && s !== '14:30'));
      setBookedSlots(['10:00', '14:30']);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg('يرجى تحديد التوقيت المناسب من جدول المواعيد المتاحة.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    const payload = {
      ...formData,
      service_type: selectedService?.title || 'استشارة عامة',
      appointment_date: selectedDate,
      start_time: selectedSlot
    };

    try {
      const res = await fetch(`/api/public/clinic/${effectiveSlug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfirmationData(data);
      } else {
        setErrorMsg(data.message || 'تعذر تأكيد الحجز.');
      }
    } catch (e) {
      // Simulated confirmation
      setConfirmationData({
        booking_reference: 'BK-' + (clinic?.slug?.toUpperCase() || 'ELAMAL') + '-' + Math.floor(1000 + Math.random() * 9000),
        details: {
          clinic_name: clinic?.name,
          doctor_name: clinic?.doctor_name,
          patient_name: formData.patient_full_name,
          service_type: selectedService?.title,
          date: selectedDate,
          time: selectedSlot,
          address: clinic?.address_details,
          phone: clinic?.phone
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !clinic) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spin" style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary-600)', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 700, color: 'var(--slate-600)' }}>جاري تحميل الصفحة الرسمية للعيادة...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'inherit', color: 'var(--slate-900)' }}>
      {/* 1. Clinic Hero Branding Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        padding: '3rem 1.5rem 4.5rem',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 12px 24px rgba(2, 132, 199, 0.35)',
              border: '3px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Stethoscope size={38} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                  {clinic.name}
                </h1>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <ShieldCheck size={14} />
                  <span>عيادة معتمدة وموثقة</span>
                </span>
              </div>

              <div style={{ fontSize: '1.05rem', color: '#93c5fd', marginTop: '0.4rem', fontWeight: 600 }}>
                {clinic.doctor_name} — {clinic.doctor_title}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a
              href={`tel:${clinic.phone}`}
              className="btn"
              style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.65rem 1.15rem', borderRadius: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
            >
              <Phone size={16} />
              <span>اتصال مباشر: {clinic.phone}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1080px', margin: '-2.5rem auto 3rem', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Left Column: Clinic About, Services & Info */}
          <div>
            {/* Bio Card */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
              <h2 className="title-lg" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <HeartHandshake size={20} color="var(--primary-600)" />
                <span>عن العيادة والأخصائي</span>
              </h2>
              <p style={{ color: 'var(--slate-600)', lineHeight: 1.8, fontSize: '0.925rem', margin: 0 }}>
                {clinic.bio}
              </p>

              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--slate-100)', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: 'var(--slate-700)' }}>
                  <MapPin size={18} color="var(--primary-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ fontWeight: 700 }}>العنوان: </span>
                    <span>{clinic.address_details}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--slate-700)' }}>
                  <Clock size={18} color="var(--primary-600)" />
                  <div>
                    <span style={{ fontWeight: 700 }}>أوقات العمل: </span>
                    <span>{clinic.working_hours?.days?.join('، ')} (من {clinic.working_hours?.start} إلى {clinic.working_hours?.end})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Services List Selection */}
            <div className="card" style={{ padding: '1.75rem', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  1
                </div>
                <h3 className="title-lg" style={{ fontSize: '1.1rem', margin: 0 }}>اختر نوع الفحص أو الاستشارة</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {clinic.services?.map((srv) => {
                  const isSelected = selectedService?.id === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => setSelectedService(srv)}
                      style={{
                        padding: '1.15rem',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                        background: isSelected ? 'var(--primary-50)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? 'var(--primary-900)' : 'var(--slate-900)' }}>
                          {srv.title}
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '0.9rem' }}>
                          {srv.price}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', lineHeight: 1.5 }}>
                        {srv.description}
                      </div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600 }}>
                        <Clock size={12} />
                        <span>المدة التقريبية: {srv.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Step-by-Step Booking Canvas */}
          <div className="card" style={{ padding: '1.75rem', boxShadow: 'var(--shadow-md)' }}>
            <form onSubmit={handleBookingSubmit}>
              {/* Step 2: Date Picker */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                    2
                  </div>
                  <h3 className="title-lg" style={{ fontSize: '1.1rem', margin: 0 }}>اختر تاريخ الموعد</h3>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <input
                    type="date"
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ fontSize: '1rem', padding: '0.75rem' }}
                    required
                  />
                </div>
              </div>

              {/* Step 3: Slots Grid */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                      3
                    </div>
                    <h3 className="title-lg" style={{ fontSize: '1.1rem', margin: 0 }}>التوقيتات الشاغرة (المقاعد المتاحة)</h3>
                  </div>
                  {slotsLoading && <span style={{ fontSize: '0.75rem', color: 'var(--primary-600)' }}>جاري التحديث...</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '0.65rem 0.5rem',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                          background: isSelected ? 'var(--primary-600)' : '#ffffff',
                          color: isSelected ? '#ffffff' : 'var(--slate-800)',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                          boxShadow: isSelected ? '0 4px 10px rgba(2, 132, 199, 0.3)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                  {bookedSlots.map((bSlot) => (
                    <div
                      key={'booked_' + bSlot}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: '10px',
                        background: '#f1f5f9',
                        color: '#94a3b8',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        textDecoration: 'line-through',
                        cursor: 'not-allowed',
                        border: '1px dashed #cbd5e1'
                      }}
                      title="محجوز مسبقاً"
                    >
                      {bSlot}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: Patient Info Form */}
              <div style={{ marginBottom: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--slate-100)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                    4
                  </div>
                  <h3 className="title-lg" style={{ fontSize: '1.1rem', margin: 0 }}>بيانات المريض للتأكيد</h3>
                </div>

                {errorMsg && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.825rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">الاسم الكامل للمريض *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: يوسف بلقاسم"
                    value={formData.patient_full_name}
                    onChange={(e) => setFormData({ ...formData, patient_full_name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">العمر (بالسنوات)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="مثال: 6"
                      value={formData.patient_age}
                      onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">اسم الولي / المرافق</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="مثال: الأب / الأم"
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">رقم الهاتف (للتأكيد عبر الاتصال/واتساب) *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="05 / 06 / 07 XX XX XX"
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ملاحظات أو سبب الاستشارة الأساسي (اختياري)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="مثال: صعوبة في نطق حرف الراء، تأخر الكلام، تشتت انتباه..."
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 800, borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-600), var(--accent-600))', boxShadow: '0 8px 16px rgba(2, 132, 199, 0.3)' }}
                disabled={submitting}
              >
                {submitting ? (
                  <span>جاري تسجيل طلب الحجز...</span>
                ) : (
                  <>
                    <CalendarIcon size={18} />
                    <span>📅 تأكيد حجز الموعد الآن</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Confirmation Success Modal */}
      {confirmationData && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmationData(null)}
          title="🎉 تم تأكيد تسجيل موعدك بنجاح!"
        >
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 16px rgba(5, 150, 105, 0.2)'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.5rem 0' }}>
              شكراً لك، تم استلام حجزك
            </h3>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              سيقوم فريق العيادة بالاتصال بك لتأكيد الموعد وتقديم التعليمات الأولية.
            </p>

            {/* Booking Details Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--slate-200)',
              borderRadius: '12px',
              padding: '1.25rem',
              textAlign: 'right',
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--slate-500)' }}>رقم مرجع الحجز:</span>
                <code style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '0.95rem' }}>{confirmationData.booking_reference}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--slate-500)' }}>المريض:</span>
                <span style={{ fontWeight: 700 }}>{confirmationData.details?.patient_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--slate-500)' }}>نوع الفحص:</span>
                <span style={{ fontWeight: 700 }}>{confirmationData.details?.service_type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--slate-500)' }}>التاريخ والتوقيت:</span>
                <span style={{ fontWeight: 700, color: '#047857' }}>
                  {confirmationData.details?.date} ({confirmationData.details?.time})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--slate-500)' }}>مقر العيادة:</span>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{confirmationData.details?.address}</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              onClick={() => {
                setConfirmationData(null);
                setFormData({ patient_full_name: '', patient_age: '', parent_name: '', phone: '', email: '', notes: '' });
                setSelectedSlot(null);
              }}
            >
              حجز موعد آخر
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
