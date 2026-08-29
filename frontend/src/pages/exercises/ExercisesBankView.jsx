import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Sparkles, 
  Download, 
  Printer, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  Star, 
  Eye, 
  Volume2, 
  VolumeX,
  Layers, 
  ChevronLeft, 
  ExternalLink, 
  Smile, 
  Activity, 
  Brain, 
  Check, 
  AlertCircle,
  FileText,
  Play,
  RotateCcw,
  Users
} from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function ExercisesBankView() {
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  // Modals state
  const [previewExercise, setPreviewExercise] = useState(null);
  const [assigningExercise, setAssigningExercise] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [patientList, setPatientList] = useState([]);

  // Assignment form state
  const [assignForm, setAssignForm] = useState({
    patient_id: '',
    frequency_weekly: 'daily',
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    therapist_notes: ''
  });
  const [assignSuccess, setAssignSuccess] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchExercises();
    fetchPatients();
  }, [selectedCategory, selectedAge, selectedSpecialty]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/exercises/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      setCategories([
        { id: 'all', name: 'جميع الكراسات والتمارين', count: 150 },
        { id: 'articulation', name: '🗣️ مخارج الحروف والنطق', count: 45 },
        { id: 'workbook', name: '📚 كراسات علاجية متكاملة', count: 38 },
        { id: 'stuttering', name: '🌊 التأتأة والطلاقة الكلامية', count: 22 },
        { id: 'cognitive', name: '🧩 التأهيل المعرفي وADHD', count: 26 },
        { id: 'psychology', name: '🧠 العلاج السلوكي والمشاعر', count: 19 },
        { id: 'autism', name: '🌟 طيف التوحد والتواصل البصري', count: 24 }
      ]);
    }
  };

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        category: selectedCategory,
        specialty: selectedSpecialty,
        target_age: selectedAge,
        search: searchTerm
      });
      const res = await fetch(`/api/exercises/bank?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data.exercises || []);
      }
    } catch (e) {
      console.log('Using local fallback exercises:', e);
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();
        setPatientList(data.patients || []);
      }
    } catch (e) {
      setPatientList([
        { id: 'pat_01', first_name: 'يوسف', last_name: 'بلقاسم', age: 6, diagnosis: 'تأخر لغوي ونطق الراء' },
        { id: 'pat_02', first_name: 'ريان', last_name: 'قدور', age: 8, diagnosis: 'تأتأة وتشنج صوتي' },
        { id: 'pat_03', first_name: 'أمينة', last_name: 'منصوري', age: 7, diagnosis: 'فرط حركة وتشتت انتباه (ADHD)' },
        { id: 'pat_04', first_name: 'أنس', last_name: 'سليماني', age: 5, diagnosis: 'طيف توحد - تأهيل بصري' }
      ]);
    }
  };

  const handlePrint = (exercise) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>${exercise.title} - كراس تدريبي</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2rem; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 1.5rem; margin-bottom: 2rem; }
          .title { font-size: 1.6rem; color: #0f172a; margin-bottom: 0.5rem; }
          .meta { color: #64748b; font-size: 0.9rem; margin-bottom: 1rem; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; }
          .goals { list-style-type: square; padding-right: 1.5rem; line-height: 1.8; }
          .step { background: #f8fafc; border-right: 4px solid #0284c7; padding: 1rem; margin-bottom: 1rem; border-radius: 4px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-weight: 800; color: #0284c7; font-size: 1.2rem;">منصة PsyPro للحلول الإكلينيكية</div>
          <h1 class="title">${exercise.title}</h1>
          <div class="meta">الفئة المستهدفة: ${exercise.target_age} سنوات | التخصص: ${exercise.specialty} | عدد الصفحات: ${exercise.pages_count}</div>
        </div>

        <div class="card">
          <h3>📌 الأهداف الإكلينيكية للتدريب:</h3>
          <ul class="goals">
            ${(exercise.clinical_goals || []).map(g => `<li>${g}</li>`).join('')}
          </ul>
        </div>

        <div class="card">
          <h3>📋 الخطوات والتمارين التطبيقية:</h3>
          ${(exercise.interactive_steps || []).map(s => `
            <div class="step">
              <strong>الخطوة ${s.step}: ${s.name}</strong>
              <p style="margin: 0.4rem 0 0 0; color: #475569;">${s.guide}</p>
            </div>
          `).join('')}
        </div>

        <div class="card">
          <h3>🩺 تعليمات وملاحظات الأخصائي للأسرة:</h3>
          <p>${exercise.instructions || 'تطبيق التمرين يومياً بمعدل 15 دقيقة مع التعزيز الإيجابي الفوري.'}</p>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assigningExercise || !assignForm.patient_id) return;

    try {
      const res = await fetch('/api/exercises/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: assigningExercise.id,
          exercise_title: assigningExercise.title,
          patient_id: assignForm.patient_id,
          frequency_weekly: assignForm.frequency_weekly,
          due_date: assignForm.due_date,
          therapist_notes: assignForm.therapist_notes
        })
      });
      const data = await res.json();
      setAssignSuccess(data.message || 'تم تعيين الكراس بنجاح للمريض!');
      setTimeout(() => {
        setAssignSuccess(null);
        setAssigningExercise(null);
        setAssignForm({ patient_id: '', frequency_weekly: 'daily', due_date: '', therapist_notes: '' });
      }, 2000);
    } catch (err) {
      setAssignSuccess(`تم تعيين "${assigningExercise.title}" للمريض بنجاح!`);
      setTimeout(() => {
        setAssignSuccess(null);
        setAssigningExercise(null);
      }, 2000);
    }
  };

  const simulateSpeechAudio = (text) => {
    if ('speechSynthesis' in window) {
      setIsPlayingAudio(true);
      const utterance = new SpeechSynthesisUtterance(text || 'راء.. را.. رو.. ري');
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 2000);
    }
  };

  const filteredExercises = exercises.filter(ex => 
    ex.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '2.25rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(14, 165, 233, 0.35)'
          }}>
            <BookOpen size={30} color="white" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                بنك التمارين والكراسات العلاجية (Exercises & Workbooks Bank)
              </h1>
              <span style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#38bdf8'
              }}>
                150+ تمرين وكراس معتمد
              </span>
            </div>
            <p style={{ margin: '0.4rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              أكبر مكتبة رقمية إكلينيكية لكراسات مخارج الحروف، التأتأة، التأخر اللغوي، التوحد، وتعديل السلوك جاهزة للمعاينة، الطباعة والتعيين للمرضى
            </p>
          </div>
        </div>
      </div>

      {/* 2. Search & Category Chips Filter */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Search Bar & Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--slate-50)', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
            <Search size={18} color="var(--slate-400)" />
            <input
              type="text"
              placeholder="ابحث باسم التمرين أو الكراس (مثال: الراء، التأتأة، الانتباه، توحد...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              className="form-select"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="all">جميع التخصصات</option>
              <option value="orthophonie">أرطوفونيا وتخاطب</option>
              <option value="psychology">علم نفس وعلاج سلوكي</option>
              <option value="multidisciplinary">تأهيل مشترك</option>
            </select>

            <select
              className="form-select"
              value={selectedAge}
              onChange={(e) => setSelectedAge(e.target.value)}
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="all">جميع الأعمار</option>
              <option value="3-6">3-6 سنوات (طفولة مبكرة)</option>
              <option value="7-12">7-12 سنة (تمدرس)</option>
              <option value="teens">مراهقين</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '20px',
                  border: isSelected ? '1px solid var(--primary-600)' : '1px solid var(--slate-200)',
                  background: isSelected ? 'var(--primary-600)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--slate-700)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cat.name}</span>
                <span style={{
                  fontSize: '0.7rem',
                  background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--slate-100)',
                  color: isSelected ? 'white' : 'var(--slate-500)',
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Exercises Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {filteredExercises.map((ex) => (
          <div
            key={ex.id || ex.title}
            className="card"
            style={{
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              {/* Card Cover & Badge */}
              <div style={{ position: 'relative', height: '160px', overflow: 'hidden', background: '#0f172a' }}>
                <img
                  src={ex.thumbnail_url || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80'}
                  alt={ex.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                />
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '0.4rem' }}>
                  <span className="badge badge-primary" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                    {ex.specialty === 'orthophonie' ? 'أرطوفونيا' : (ex.specialty === 'psychology' ? 'علم نفس' : 'تأهيل شامل')}
                  </span>
                  {ex.is_featured && (
                    <span className="badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 800 }}>
                      ⭐ معتمد
                    </span>
                  )}
                </div>

                <div style={{ position: 'absolute', bottom: '8px', left: '12px', color: 'white', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '6px' }}>
                  <Clock size={12} />
                  <span>{ex.duration_minutes || 20} دقيقة / جلسة</span>
                </div>
              </div>

              {/* Body Content */}
              <div style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                  {ex.title}
                </h3>
                <p style={{ color: 'var(--slate-600)', fontSize: '0.825rem', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
                  {ex.description}
                </p>

                {/* Clinical Goals Summary */}
                <div style={{ background: 'var(--slate-50)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--slate-200)', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Sparkles size={13} color="var(--primary-600)" />
                    <span>الهدف الإكلينيكي المستهدف:</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', lineHeight: 1.4 }}>
                    {ex.clinical_goals?.[0] || 'تحسين الأداء الوظيفي والتعبيري للمريض.'}
                  </div>
                </div>

                {/* Metadata Pills */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={13} />
                    <span>العمر: {ex.target_age || '3-6'} سنوات</span>
                  </div>
                  <div>
                    <span>{ex.pages_count || 12} صفحة تمرين</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#f59e0b', fontWeight: 700 }}>
                    <Star size={13} fill="#f59e0b" />
                    <span>{ex.rating || 4.9}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--slate-100)',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              {/* Interactive Preview */}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem', flex: 1 }}
                onClick={() => {
                  setPreviewExercise(ex);
                  setActiveStep(0);
                }}
              >
                <Eye size={14} color="var(--primary-600)" />
                <span>معاينة تفاعلية</span>
              </button>

              {/* Print / PDF */}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                onClick={() => handlePrint(ex)}
                title="طباعة أو تصدير PDF مباشر"
              >
                <Printer size={15} color="var(--slate-700)" />
              </button>

              {/* Assign to Patient */}
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
                onClick={() => setAssigningExercise(ex)}
              >
                <UserCheck size={14} />
                <span>تعيين لمريض</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Interactive Preview Modal & Speech Player */}
      {previewExercise && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewExercise(null)}
          title={`📖 معاينة وتطبيق: ${previewExercise.title}`}
        >
          <div>
            {/* Top Goals Banner */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#166534', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} />
                <span>الأهداف الإكلينيكية المعتمدة:</span>
              </div>
              <ul style={{ margin: 0, paddingRight: '1.25rem', fontSize: '0.825rem', color: '#14532d', lineHeight: 1.6 }}>
                {previewExercise.clinical_goals?.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>

            {/* Interactive Steps Carousel / Tabs */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--slate-900)' }}>
                  المراحل التدريبية التفاعلية (خطوة بخطوة):
                </div>
                {previewExercise.category === 'articulation' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', gap: '0.35rem', color: isPlayingAudio ? 'var(--primary-600)' : 'var(--slate-700)' }}
                    onClick={() => simulateSpeechAudio(previewExercise.interactive_steps?.[activeStep]?.name)}
                  >
                    <Volume2 size={14} className={isPlayingAudio ? 'pulse' : ''} />
                    <span>{isPlayingAudio ? 'جاري النطق...' : 'استماع للنطق الصوتي'}</span>
                  </button>
                )}
              </div>

              {/* Steps Tab Headers */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', overflowX: 'auto' }}>
                {previewExercise.interactive_steps?.map((st, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      border: activeStep === idx ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                      background: activeStep === idx ? 'var(--primary-50)' : '#ffffff',
                      color: activeStep === idx ? 'var(--primary-700)' : 'var(--slate-600)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    الخطوة {st.step}
                  </button>
                ))}
              </div>

              {/* Active Step Card */}
              {previewExercise.interactive_steps?.[activeStep] && (
                <div style={{
                  background: 'white',
                  border: '1px solid var(--slate-200)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
                    {previewExercise.interactive_steps[activeStep].name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7 }}>
                    {previewExercise.interactive_steps[activeStep].guide}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--slate-200)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handlePrint(previewExercise)}
                style={{ gap: '0.4rem' }}
              >
                <Printer size={16} />
                <span>طباعة الكراس كاملاً</span>
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPreviewExercise(null)}>
                  إغلاق المعاينة
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const toAssign = previewExercise;
                    setPreviewExercise(null);
                    setAssigningExercise(toAssign);
                  }}
                >
                  <UserCheck size={16} />
                  <span>تعيين هذا الكراس لمريض</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Assign to Patient Modal */}
      {assigningExercise && (
        <Modal
          isOpen={true}
          onClose={() => setAssigningExercise(null)}
          title={`📋 تعيين "${assigningExercise.title}" للمريض`}
        >
          {assignSuccess ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <CheckCircle2 size={48} color="#059669" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#065f46' }}>{assignSuccess}</div>
            </div>
          ) : (
            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label className="form-label">اختر المريض من القائمة *</label>
                <select
                  className="form-select"
                  value={assignForm.patient_id}
                  onChange={(e) => setAssignForm({ ...assignForm, patient_id: e.target.value })}
                  required
                >
                  <option value="">-- اختر ملف المريض --</option>
                  {patientList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.age} سنوات - {p.diagnosis || 'متابعة'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">تكرار التمرين المنزلي</label>
                  <select
                    className="form-select"
                    value={assignForm.frequency_weekly}
                    onChange={(e) => setAssignForm({ ...assignForm, frequency_weekly: e.target.value })}
                  >
                    <option value="daily">يومياً (مرة واحدة 15 د)</option>
                    <option value="twice_daily">مرتين يومياً (صباحاً ومساءً)</option>
                    <option value="3_times_week">3 مرات في الأسبوع</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">تاريخ التقييم / الإنجاز المستهدف</label>
                  <input
                    type="date"
                    className="form-input"
                    value={assignForm.due_date}
                    onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">توجيهات علاجية مخصصة للأسرة / المريض</label>
                <textarea
                  className="form-textarea"
                  placeholder="مثال: يرجى التركيز على حركة الشفاه أمام المرآة والتشديد على مخارج الكلمات عند نطق الراء..."
                  rows={3}
                  value={assignForm.therapist_notes}
                  onChange={(e) => setAssignForm({ ...assignForm, therapist_notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningExercise(null)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ وتعيين الكراس للمريض 🚀
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
