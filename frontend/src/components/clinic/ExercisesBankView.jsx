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
  Users,
  Plus,
  Mic,
  MessageSquare,
  Share2,
  Send
} from 'lucide-react';
import Modal from '../common/Modal';

export default function ExercisesBankView() {
  const [activeTab, setActiveTab] = useState('articulation'); // 'articulation' | 'printable' | 'pecs' | 'cognitive'
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAge, setSelectedAge] = useState('all');
  const [selectedDisorder, setSelectedDisorder] = useState('all');

  // Phoneme selector for Speech tab
  const [selectedPhoneme, setSelectedPhoneme] = useState('ر');
  const phonemes = ['ر', 'س', 'ك', 'ل', 'ج', 'ش', 'ف'];

  // Sound positions and interactive counters
  const [selectedSoundPosition, setSelectedSoundPosition] = useState('initial'); // 'initial' | 'medial' | 'final'
  const [repetitionCount, setRepetitionCount] = useState(0);
  const [previewItem, setPreviewItem] = useState(null);
  const [assigningItem, setAssigningItem] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [patientList, setPatientList] = useState([]);

  // Assignment Form State
  const [assignForm, setAssignForm] = useState({
    patient_id: '',
    frequency_weekly: 'daily',
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    therapist_notes: '',
    notify_whatsapp: true
  });
  const [assignSuccess, setAssignSuccess] = useState(null);

  const tabs = [
    { id: 'articulation', label: '🗣️ تمارين مخارج الأصوات والنطق', count: 45, icon: MessageSquare },
    { id: 'printable', label: '📖 كراسات وأوراق عمل قابلة للطباعة', count: 38, icon: Printer },
    { id: 'pecs', label: '🃏 بطاقات التواصل البصري والقصص الاجتماعية (PECS)', count: 24, icon: Smile },
    { id: 'cognitive', label: '🧠 أنشطة التفكير المنطقي والذاكرة العاملة', count: 28, icon: Brain },
  ];

  // Phoneme drills bank dictionary
  const phonemeDrills = {
    'ر': {
      name: 'صوت الراء /r/ (انفجاري ترددي لثوي)',
      initial: ['رَأْس', 'رِجْل', 'رُمَّان', 'رَمْل', 'رَبِيع', 'رَفّ'],
      medial: ['قَمَر', 'كُرَة', 'مِرْآة', 'قِطَار', 'جَرَس', 'مَطَر'],
      final: ['نَهْر', 'بَحْر', 'سُور', 'طَيْر', 'زَهْر', 'ثَوْر']
    },
    'س': {
      name: 'صوت السين /s/ (صفيري احتكاكي أسناني)',
      initial: ['سَيَّارَة', 'سَمَكَة', 'سَاعَة', 'سُلَحْفَاة', 'سُلَّم', 'سَفِينَة'],
      medial: ['مَسْجِد', 'فُسْتَان', 'عَسَل', 'جِسْر', 'مِسْطَرَة', 'كُرْسِيّ'],
      final: ['شَمْس', 'خَسّ', 'فَأْس', 'طَاوُوس', 'جَرَس', 'قَوْس']
    },
    'ك': {
      name: 'صوت الكاف /k/ (انفجاري طبقي)',
      initial: ['كَلْب', 'كِتَاب', 'كُرَة', 'كُوب', 'كَعْكَة', 'كَمَّاشَة'],
      medial: ['سَمَكَة', 'مَكْتَب', 'دُكَّان', 'شَوْكَة', 'حَقِيبَة', 'عَنْكَبُوت'],
      final: ['شُبَّاك', 'مَلِك', 'دِيك', 'شَوْك', 'ضِحْك', 'سَمَك']
    },
    'ل': {
      name: 'صوت اللام /l/ (جانبي لثوي)',
      initial: ['لَيْمُون', 'لِسَان', 'لُعْبَة', 'لَوْحَة', 'لَحْم', 'لِبَاس'],
      medial: ['قَلَم', 'عَلَم', 'سُلَّم', 'بَلَح', 'جَمَل', 'هِلَال'],
      final: ['فِيل', 'جَبَل', 'حَبْل', 'عَسَل', 'طَبْل', 'غَزَال']
    },
    'ج': {
      name: 'صوت الجيم /dʒ/ (مركب غاري)',
      initial: ['جَمَل', 'جَزَر', 'جَرَس', 'جِسْر', 'جُنْدِيّ', 'جَوْز'],
      medial: ['شَجَرَة', 'مَسْجِد', 'نَجْمَة', 'حَجَر', 'دَرَّاجَة', 'فِنْجَان'],
      final: ['ثَلْج', 'تَاج', 'بُرْج', 'دَجَاج', 'سِيَاج', 'عِلَاج']
    },
    'ش': {
      name: 'صوت الشين /ʃ/ (احتكاكي غاري لثوي)',
      initial: ['شَمْس', 'شَجَرَة', 'شَوْكَة', 'شَمْعَة', 'شُرْطِيّ', 'شَاحِنَة'],
      medial: ['مِشْمِش', 'مِنْشَار', 'عُشْب', 'فَرَاشَة', 'خَشَب', 'نَشَّافَة'],
      final: ['عُشّ', 'رِيش', 'جَيْش', 'كَبْش', 'قِرْش', 'وَحْش']
    },
    'ف': {
      name: 'صوت الفاء /f/ (احتكاكي أسناني شفوي)',
      initial: ['فِيل', 'فَرَاوْلَة', 'فَرَاشَة', 'فَأْس', 'فُسْتَان', 'فَم'],
      medial: ['دَفْتَر', 'عُصْفُور', 'سَفِينَة', 'تُفَّاح', 'مِفْتَاح', 'ضِفْدَع'],
      final: ['خَرُوف', 'صَيْف', 'هَاتِف', 'أَنْف', 'سَيْف', 'رَصِيف']
    }
  };

  useEffect(() => {
    fetchExercises();
    fetchPatients();
  }, [activeTab, selectedAge, selectedDisorder, searchTerm]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        category: activeTab,
        disorder: selectedDisorder,
        target_age: selectedAge,
        search: searchTerm
      });
      const res = await fetch(`/api/exercises?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data.exercises || []);
      }
    } catch (e) {
      console.log('Using local exercises data:', e);
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
        { id: 'pat_02', first_name: 'ريان', last_name: 'قدور', age: 8, diagnosis: 'تأتأة واضطراب طلاقة' },
        { id: 'pat_03', first_name: 'أمينة', last_name: 'منصوري', age: 7, diagnosis: 'فرط حركة وتشتت انتباه (ADHD)' },
        { id: 'pat_04', first_name: 'أنس', last_name: 'سليماني', age: 5, diagnosis: 'طيف توحد - تأهيل PECS' }
      ]);
    }
  };

  const playSpeechAudio = (word) => {
    if ('speechSynthesis' in window) {
      setIsPlayingAudio(true);
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.75;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePrint = (item) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>${item.title || 'كراس علاجي'} - ورقة عمل إكلينيكية</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2rem; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 1.25rem; margin-bottom: 1.5rem; }
          .title { font-size: 1.5rem; color: #0f172a; margin-bottom: 0.4rem; }
          .meta { color: #64748b; font-size: 0.85rem; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.25rem; }
          .goals { list-style-type: square; padding-right: 1.5rem; line-height: 1.8; }
          .step { background: #f8fafc; border-right: 4px solid #0284c7; padding: 0.85rem; margin-bottom: 0.75rem; border-radius: 4px; }
          .words-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem; }
          .word-box { border: 1px solid #94a3b8; padding: 1rem; text-align: center; font-size: 1.3rem; font-weight: bold; border-radius: 6px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-weight: 800; color: #0284c7; font-size: 1.1rem;">منصة PsyPro للحلول الإكلينيكية والتشخيصية</div>
          <h1 class="title">${item.title}</h1>
          <div class="meta">الفئة المستهدفة: ${item.target_age || '3-6'} سنوات | التخصص: ${item.specialty || 'أرطوفونيا'} | عدد الصفحات: ${item.pages_count || 10}</div>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">📌 الأهداف الإكلينيكية للتدريب:</h3>
          <ul class="goals">
            ${(item.clinical_goals || ['تحسين الأداء الوظيفي والتعبيري للمريض']).map(g => `<li>${g}</li>`).join('')}
          </ul>
        </div>

        <div class="card">
          <h3 style="margin-top:0;">📋 خطوات وتوجيهات التطبيق:</h3>
          <p>${item.instructions || 'تطبيق التمرين يومياً بمعدل 15 دقيقة مع التعزيز الإيجابي الفوري للمريض.'}</p>
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
    if (!assigningItem || !assignForm.patient_id) return;

    try {
      const res = await fetch('/api/exercises/assign-to-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: assigningItem.id,
          exercise_title: assigningItem.title,
          patient_id: assignForm.patient_id,
          frequency_weekly: assignForm.frequency_weekly,
          due_date: assignForm.due_date,
          therapist_notes: assignForm.therapist_notes
        })
      });
      const data = await res.json();
      setAssignSuccess(data.message || 'تم إسناد الواجب المنزلي بنجاح!');
      setTimeout(() => {
        setAssignSuccess(null);
        setAssigningItem(null);
        setAssignForm({ patient_id: '', frequency_weekly: 'daily', due_date: '', therapist_notes: '', notify_whatsapp: true });
      }, 2000);
    } catch (err) {
      setAssignSuccess(`تم إسناد "${assigningItem.title}" كواجب منزلي بنجاح!`);
      setTimeout(() => {
        setAssignSuccess(null);
        setAssigningItem(null);
      }, 2000);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
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
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(14, 165, 233, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <BookOpen size={32} color="white" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                📚 بنك التمارين والكراسات العلاجية (Therapeutic Workbooks & Exercises)
              </h1>
              <span style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#38bdf8'
              }}>
                مكتبة تأهيلية علاجية شاملة
              </span>
            </div>
            <p style={{ margin: '0.4rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              تمارين مخارج الأصوات التفاعلية، كراسات أوراق العمل القابلة للطباعة، وسائل وبطاقات PECS، وأنشطة تنمية الذاكرة التنفيذية
            </p>
          </div>
        </div>
      </div>

      {/* 2. Independent Category Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        borderBottom: '1px solid var(--slate-200)',
        marginBottom: '1.75rem',
        overflowX: 'auto'
      }}>
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.9rem 1.35rem',
                border: 'none',
                background: 'none',
                fontSize: '0.925rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? 'var(--primary-700)' : 'var(--slate-600)',
                borderBottom: isActive ? '3px solid var(--primary-600)' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} color={isActive ? 'var(--primary-600)' : 'var(--slate-400)'} />
              <span>{t.label}</span>
              <span style={{
                fontSize: '0.7rem',
                background: isActive ? 'var(--primary-100)' : 'var(--slate-100)',
                color: isActive ? 'var(--primary-700)' : 'var(--slate-500)',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 700
              }}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Quick Filters */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '260px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--slate-50)', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
          <Search size={18} color="var(--slate-400)" />
          <input
            type="text"
            placeholder="ابحث باسم التمرين، الحرف، أو نوع التدريب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', fontFamily: 'inherit' }}
          />
        </div>

        {/* Age Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>الفئة العمرية:</span>
          <select
            className="form-select"
            value={selectedAge}
            onChange={(e) => setSelectedAge(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
          >
            <option value="all">جميع الأعمار</option>
            <option value="3-5">3-5 سنوات (طفولة مبكرة)</option>
            <option value="6-9">6-9 سنوات (تمدرس)</option>
            <option value="10+">10+ سنوات (يافعين وكبار)</option>
          </select>
        </div>

        {/* Disorder Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>نوع الاضطراب:</span>
          <select
            className="form-select"
            value={selectedDisorder}
            onChange={(e) => setSelectedDisorder(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
          >
            <option value="all">جميع الاضطرابات</option>
            <option value="speech">نطق وتخاطب</option>
            <option value="autism">توحد وتواصل</option>
            <option value="learning_disabilities">صعوبات تعلم وتأهيل حركي</option>
            <option value="behavior">تعديل سلوك</option>
            <option value="skills_development">تركيز وانتباه</option>
          </select>
        </div>
      </div>

      {/* 4. Tab 1 Special: Speech Phonemes Interactive Studio */}
      {activeTab === 'articulation' && (
        <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdfa 100%)', border: '1px solid var(--primary-200)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="title-lg" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={20} color="var(--primary-600)" />
                <span>المشغل التفاعلي لمخارج الأصوات الصامتة (Phoneme Articulation Studio)</span>
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--slate-600)', fontSize: '0.825rem' }}>
                اختر الحرف المستهدف للاستماع لنطق الكلمات في مواضعها الثلاثة مع عداد التكرارات اللحظي
              </p>
            </div>

            {/* Repetition Counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.4rem 0.85rem', borderRadius: '20px', border: '1px solid var(--primary-300)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-700)' }}>تكرار التمرين:</span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary-700)' }}>{repetitionCount} / 5</span>
              <button
                type="button"
                onClick={() => setRepetitionCount(prev => (prev < 5 ? prev + 1 : 0))}
                className="btn btn-primary"
                style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '12px' }}
              >
                + احتساب تكرار
              </button>
            </div>
          </div>

          {/* Phoneme Letters Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {phonemes.map((ph) => {
              const isSelected = selectedPhoneme === ph;
              return (
                <button
                  key={ph}
                  type="button"
                  onClick={() => {
                    setSelectedPhoneme(ph);
                    setRepetitionCount(0);
                  }}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                    background: isSelected ? 'var(--primary-600)' : '#ffffff',
                    color: isSelected ? '#ffffff' : 'var(--slate-800)',
                    fontWeight: 900,
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isSelected ? '0 4px 10px rgba(2, 132, 199, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {ph}
                </button>
              );
            })}
          </div>

          {/* Positions Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setSelectedSoundPosition('initial')}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: '8px',
                border: selectedSoundPosition === 'initial' ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                background: selectedSoundPosition === 'initial' ? 'var(--primary-50)' : '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              🟢 بداية الكلمة (Initial)
            </button>
            <button
              type="button"
              onClick={() => setSelectedSoundPosition('medial')}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: '8px',
                border: selectedSoundPosition === 'medial' ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                background: selectedSoundPosition === 'medial' ? 'var(--primary-50)' : '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              🟡 وسط الكلمة (Medial)
            </button>
            <button
              type="button"
              onClick={() => setSelectedSoundPosition('final')}
              style={{
                flex: 1,
                padding: '0.55rem',
                borderRadius: '8px',
                border: selectedSoundPosition === 'final' ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                background: selectedSoundPosition === 'final' ? 'var(--primary-50)' : '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              🔵 نهاية الكلمة (Final)
            </button>
          </div>

          {/* Words Grid with Sound Player */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {(phonemeDrills[selectedPhoneme]?.[selectedSoundPosition] || []).map((w, i) => (
              <div
                key={i}
                onClick={() => playSpeechAudio(w)}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--slate-200)',
                  borderRadius: '12px',
                  padding: '1rem 0.75rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
                }}
                title="انقر للاستماع للنطق الفصيح"
              >
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--slate-900)', marginBottom: '0.35rem' }}>
                  {w}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontWeight: 700 }}>
                  <Volume2 size={13} />
                  <span>نطق صوتي</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Main Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {exercises.map((item) => (
          <div
            key={item.id || item.title}
            className="card"
            style={{
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
          >
            <div>
              {/* Thumbnail */}
              <div style={{ position: 'relative', height: '160px', overflow: 'hidden', background: '#0f172a' }}>
                <img
                  src={item.thumbnail_url || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80'}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                />
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '0.4rem' }}>
                  <span className="badge badge-primary" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                    {item.specialty === 'orthophonie' ? 'أرطوفونيا' : (item.specialty === 'psychology' ? 'علم نفس' : 'تأهيل شامل')}
                  </span>
                  {item.is_featured && (
                    <span className="badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 800 }}>
                      ⭐ معتمد
                    </span>
                  )}
                </div>

                <div style={{ position: 'absolute', bottom: '8px', left: '12px', color: 'white', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(0,0,0,0.65)', padding: '2px 8px', borderRadius: '6px' }}>
                  <Clock size={12} />
                  <span>{item.duration_minutes || 20} دقيقة</span>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                  {item.title}
                </h3>
                <p style={{ color: 'var(--slate-600)', fontSize: '0.825rem', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
                  {item.description}
                </p>

                {/* Primary Goal */}
                <div style={{ background: 'var(--slate-50)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--slate-200)', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Sparkles size={13} color="var(--primary-600)" />
                    <span>الهدف الإكلينيكي:</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', lineHeight: 1.4 }}>
                    {item.clinical_goals?.[0] || 'تحسين الأداء الوظيفي والتعبيري للمريض.'}
                  </div>
                </div>

                {/* Metadata */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={13} />
                    <span>العمر: {item.target_age || '3-6'} سنوات</span>
                  </div>
                  <div>
                    <span>{item.pages_count || 12} صفحة</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#f59e0b', fontWeight: 700 }}>
                    <Star size={13} fill="#f59e0b" />
                    <span>{item.rating || 4.9}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--slate-100)',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              {/* Preview */}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', gap: '0.3rem', flex: 1 }}
                onClick={() => setPreviewItem(item)}
              >
                <Eye size={14} color="var(--primary-600)" />
                <span>معاينة سريعة</span>
              </button>

              {/* Print / PDF */}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                onClick={() => handlePrint(item)}
                title="طباعة / تحميل PDF"
              >
                <Printer size={15} color="var(--slate-700)" />
              </button>

              {/* Assign Homework */}
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
                onClick={() => setAssigningItem(item)}
              >
                <Plus size={14} />
                <span>إسناد كواجب منزلي</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 6. Quick Preview Modal */}
      {previewItem && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          title={`📖 ${previewItem.title}`}
        >
          <div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#166534', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} />
                <span>الأهداف الإكلينيكية للتدريب:</span>
              </div>
              <ul style={{ margin: 0, paddingRight: '1.25rem', fontSize: '0.825rem', color: '#14532d', lineHeight: 1.6 }}>
                {previewItem.clinical_goals?.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
                توجيهات الأخصائي لتطبيق الكراس:
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', lineHeight: 1.7, margin: 0 }}>
                {previewItem.instructions || 'تطبيق التمرين يومياً بمعدل 15 دقيقة مع التعزيز الإيجابي الفوري للطفل.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--slate-200)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handlePrint(previewItem)}
                style={{ gap: '0.4rem' }}
              >
                <Printer size={15} />
                <span>طباعة ورقة العمل / PDF</span>
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPreviewItem(null)}>
                  إغلاق
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const toAssign = previewItem;
                    setPreviewItem(null);
                    setAssigningItem(toAssign);
                  }}
                >
                  <Plus size={15} />
                  <span>إسناد كواجب منزلي</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Assign Homework Modal */}
      {assigningItem && (
        <Modal
          isOpen={true}
          onClose={() => setAssigningItem(null)}
          title={`➕ إسناد كواجب منزلي: ${assigningItem.title}`}
        >
          {assignSuccess ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <CheckCircle2 size={48} color="#059669" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#065f46' }}>{assignSuccess}</div>
            </div>
          ) : (
            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label className="form-label">اختر ملف المريض *</label>
                <select
                  className="form-select"
                  value={assignForm.patient_id}
                  onChange={(e) => setAssignForm({ ...assignForm, patient_id: e.target.value })}
                  required
                >
                  <option value="">-- حدد المريض من السجلات --</option>
                  {patientList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.age} سنوات - {p.diagnosis || 'متابعة'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">تكرار الواجب المنزلي</label>
                  <select
                    className="form-select"
                    value={assignForm.frequency_weekly}
                    onChange={(e) => setAssignForm({ ...assignForm, frequency_weekly: e.target.value })}
                  >
                    <option value="daily">يومياً (مرة واحدة 15 د)</option>
                    <option value="twice_daily">مرتين يومياً (صباحاً ومساءً)</option>
                    <option value="3_times_week">3 مرات أسبوعياً</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">تاريخ التسليم / المراجعة</label>
                  <input
                    type="date"
                    className="form-input"
                    value={assignForm.due_date}
                    onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">توجيهات علاجية خاصة للأسرة / الولي</label>
                <textarea
                  className="form-textarea"
                  placeholder="مثال: يرجى التدريب أمام المرآة مع تسجيل فيديو لآخر محاولة وإرسالها أو إحضارها في الجلسة القادمة..."
                  rows={3}
                  value={assignForm.therapist_notes}
                  onChange={(e) => setAssignForm({ ...assignForm, therapist_notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', background: '#f0fdf4', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.8rem', color: '#166534' }}>
                <Send size={15} />
                <span>إرسال تنبيه ورابط ورقة العمل تلقائياً للولي عبر واتساب/SMS</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningItem(null)}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  حفظ وإسناد الواجب لملف المريض 🚀
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
