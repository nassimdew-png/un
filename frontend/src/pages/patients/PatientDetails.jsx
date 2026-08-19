import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Phone, 
  FileText, 
  BrainCircuit, 
  Sparkles, 
  Tablet, 
  ArrowRight,
  Shield,
  Activity
} from 'lucide-react';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock patient profile data matching scaffold.md specifications
  const patient = {
    _id: id || 'pat_01',
    full_name: 'ياسين بن علي',
    birth_date: '2018-05-12',
    gender: 'male',
    guardian_name: 'محمد بن علي (الأب)',
    phone: '0661000000',
    clinical_tags: ['تأخر لغوي', 'اضطراب نطق'],
    anamnese_generale: {
      pregnancy_notes: 'ولادة طبيعية دون مضاعفات، مدة الحمل كاملة 9 أشهر',
      motor_development: 'الجلوس في عمر 6 أشهر، المشي المستقل في عمر 13 شهراً',
      school_grade: 'السنة الأولى ابتدائي - مدرسة النور',
      language_background: 'ثنائي اللغة (عربية دارجة مع بعض العبارات الفرنسية)'
    },
    history: [
      { date: '2026-08-19', type: 'حصيلة أرطوفونية أولية', status: 'مكتملة ومولدة بالـ AI' },
      { date: '2026-08-10', type: 'استشارة أولية وفتح الملف', status: 'مكتملة' }
    ]
  };

  return (
    <div>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/patients')} 
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          <ArrowRight size={16} />
          <span>العودة لقائمة المرضى</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link 
            to={`/orthophonie/bilan?patient_id=${patient._id}`} 
            className="btn btn-ai"
            style={{ fontSize: '0.85rem' }}
          >
            <Sparkles size={16} />
            <span>صياغة حصيلة أرطوفونية بالـ AI</span>
          </Link>
          <Link 
            to={`/tablet/kiosk?patient_id=${patient._id}`} 
            className="btn btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <Tablet size={16} />
            <span>بدء تقييم تابلت</span>
          </Link>
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #ffffff, #f0fdfa)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--primary-600), var(--accent-600))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.5rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            {patient.full_name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
              <h1 className="title-xl">{patient.full_name}</h1>
              <span className="badge badge-primary">ذكر (7 سنوات)</span>
              <span className="badge badge-success">الملف نشط</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--slate-600)' }}>
              <span><strong>الولي:</strong> {patient.guardian_name}</span>
              <span><strong>الهاتف:</strong> <span dir="ltr">{patient.phone}</span></span>
              <span><strong>تاريخ الميلاد:</strong> {patient.birth_date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Anamnesis & History Two-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
        {/* Anamnese Generale Dossier */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h2 className="title-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <FileText size={20} color="var(--primary-600)" />
            <span>السوابق النمائية والإكلينيكية (Anamnèse Générale)</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-700)', marginBottom: '0.35rem' }}>
                ظروف الحمل والولادة (Période Pénatale et Néonatale):
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--slate-800)' }}>
                {patient.anamnese_generale.pregnancy_notes}
              </div>
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-700)', marginBottom: '0.35rem' }}>
                المعالم النمائية الحركية (Développement Psychomoteur):
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--slate-800)' }}>
                {patient.anamnese_generale.motor_development}
              </div>
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-700)', marginBottom: '0.35rem' }}>
                المسار الدراسي والتوافق الأكاديمي:
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--slate-800)' }}>
                {patient.anamnese_generale.school_grade}
              </div>
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-700)', marginBottom: '0.35rem' }}>
                البيئة اللغوية والتواصلية في المنزل:
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--slate-800)' }}>
                {patient.anamnese_generale.language_background}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical History & Bilans Timeline */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h2 className="title-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Activity size={20} color="var(--accent-600)" />
            <span>سجل الجلسات والحصائل السابقة</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {patient.history.map((item, idx) => (
              <div key={idx} style={{
                padding: '1rem',
                border: '1px solid var(--slate-200)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-900)' }}>
                    {item.type}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                    بتاريخ: {item.date}
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--indigo-50)', border: '1px solid #c7d2fe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--indigo-600)', marginBottom: '0.4rem' }}>
              <Shield size={16} />
              <span>خصوصية وسرية البيانات الطبية</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
              بيانات المريض مشفرة ومحمية وفق معايير السرية الإكلينيكية، ويتم حجب الهوية آلياً أثناء توليد التقارير عبر الذكاء الاصطناعي.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
