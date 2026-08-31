import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Search, 
  Sparkles, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Tablet, 
  Printer, 
  ExternalLink, 
  Clock, 
  Users, 
  Layers, 
  FileText, 
  Eye, 
  Play, 
  ChevronLeft,
  Activity,
  HeartPulse,
  Scale
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../common/Modal';

export default function ClinicalTestsView() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAge, setSelectedAge] = useState('all');

  // Test Runner State
  const [activeTest, setActiveTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [patientName, setPatientName] = useState('يوسف بلقاسم');
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'all', name: 'جميع الاختبارات والروائز', count: 32 },
    { id: 'orthophonie', name: '🗣️ روائز النطق واللغة (Speech & Language)', count: 12 },
    { id: 'psychology', name: '🧠 المقاييس النفسية والشخصية (Psychology)', count: 9 },
    { id: 'autism', name: '🌟 التوحد والنمو العصبي (Autism & CARS)', count: 6 },
    { id: 'adhd', name: '🧩 الانتباه وصعوبات التعلم (ADHD & Learning)', count: 5 },
  ];

  const testsList = [
    {
      id: 'test_bdi',
      title: 'مقياس بيك للاكتئاب السريري (BDI-II - Beck Depression Inventory)',
      category: 'psychology',
      specialty: 'psychology',
      target_age: 'teens_adults',
      duration_minutes: 15,
      items_count: 21,
      standard_cutoff: '14+ (مؤشر اكتئاب خفيف)، 20+ (متوسط)، 29+ (شديد)',
      description: 'المعيار الذهبي لتقييم حدة الأعراض الاكتئابية، التشاؤم، فقدان المتعة، والميول الانتحارية لدى المراهقين والبالغين.',
      items: [
        { id: 1, title: '1. الحزن والكآبة', options: ['لا أشعر بالحزن (0)', 'أشعر بالحزن أغلب الوقت (1)', 'أنا حزين طوال الوقت ولا أستطيع الخروج من ذلك (2)', 'أنا حزين لدرجة لا تُطاق (3)'] },
        { id: 2, title: '2. التشاؤم والمستقبل', options: ['لست محبطاً بشأن مستقبلي (0)', 'أشعر بالإحباط بشأن المستقبل أكثر من المعتاد (1)', 'لا أتوقع أن تتحسن الأمور (2)', 'أشعر أنه لا يوجد أمل وأن الأمور ستزداد سوءاً (3)'] },
        { id: 3, title: '3. الإحساس بالفشل', options: ['لا أشعر أنني فاشل (0)', 'لقد فشلت أكثر مما ينبغي (1)', 'عندما أنظر إلى ماضي أرى الكثير من الإخفاقات (2)', 'أشعر أنني فاشل تماماً كشخص (3)'] },
        { id: 4, title: '4. فقدان المتعة والاهتمام', options: ['أحصل على نفس المتعة كالمعتاد (0)', 'لا أستمتع بالأشياء كما كنت في السابق (1)', 'أحصل على متعة قليلة جداً من الأشياء (2)', 'لا أستطيع الحصول على أي متعة إطلاقاً (3)'] },
        { id: 5, title: '5. الشعور بالذنب', options: ['لا أشعر بالذنب بشكل خاص (0)', 'أشعر بالذنب بشأن أشياء كثيرة فعلتها (1)', 'أشعر بالذنب أغلب الوقت (2)', 'أشعر بالذنب باستمرار وبشكل مؤلم (3)'] }
      ]
    },
    {
      id: 'test_cars',
      title: 'مقياس تقدير التوحد الطفولي (CARS-2 - Childhood Autism Rating Scale)',
      category: 'autism',
      specialty: 'multidisciplinary',
      target_age: '3-6',
      duration_minutes: 25,
      items_count: 15,
      standard_cutoff: '30-36.5 (توحد خفيف إلى متوسط)، 37+ (توحد شديد)',
      description: 'رائز إكلينيكي رائد لتقييم السلوكيات النمطية، التواصل اللفظي وغير اللفظي، الاستجابة السمعية، والتفاعل مع البيئة لدى الأطفال.',
      items: [
        { id: 1, title: '1. التفاعل والعلاقات مع الناس', options: ['علاقات طبيعية مناسبة للعمر (1)', 'تجنب طفيف للتواصل البصري أو مبالغة في التعلق (2)', 'انعزال ملحوظ وتجاهل للأشخاص (3)', 'انفصال تام وصعوبة بالغة في جذب الانتباه (4)'] },
        { id: 2, title: '2. التقليد الحركي والصوتي', options: ['تقليد فوري وتلقائي سليم (1)', 'تقليد بسيط بعد التكرار والمساعدة (2)', 'تقليد متأخر أو جزئي فقط (3)', 'غياب تام لمهارة التقليد (4)'] },
        { id: 3, title: '3. الاستجابة الانفعالية والعاطفية', options: ['استجابات ملائمة للمواقف (1)', 'ردود فعل انفعالية مبالغ فيها أو متبلدة قليلاً (2)', 'نوبات غضب غير مبررة أو ضحك دون سبب (3)', 'تقلبات حادة وانفعالات غير متوقعة إطلاقاً (4)'] }
      ]
    },
    {
      id: 'test_speech_arabic',
      title: 'رائز الفحص النطقي العربي المعياري (Standard Arabic Articulation Test)',
      category: 'orthophonie',
      specialty: 'orthophonie',
      target_age: '3-6',
      duration_minutes: 20,
      items_count: 28,
      standard_cutoff: 'مؤشر النطق الصوتي الصحيح (PCC: Percentage of Consonants Correct)',
      description: 'تقييم شامل لجميع الصوامت العربية في مواضع الكلمة الثلاثة (البداية، الوسط، النهاية) وتحديد نوع الاضطراب (حذف، إبدال، تشويه، إضافة).',
      items: [
        { id: 1, title: 'صوت الراء /r/ في (رَأْس، قَمَر، نَهْر)', options: ['سليم وخالٍ من العيوب (0)', 'إبدال إلى ياء أو لام (1)', 'تشويه ولدغة رائية (2)', 'حذف تام للصوت (3)'] },
        { id: 2, title: 'صوت السين /s/ في (سَيَّارَة، مَسْجِد، شَمْس)', options: ['صفير نقي وسليم (0)', 'لدغة بين سنية أمامية (1)', 'لدغة جانبية (2)', 'تشويه أو إبدال إلى ثاء (3)'] },
        { id: 3, title: 'صوت الكاف /k/ في (كَلْب، سَمَكَة، شُبَّاك)', options: ['انفجاري طبقي سليم (0)', 'إبدال أمامي إلى تاء (Fronting) (1)', 'تشويه رخو (2)', 'حذف (3)'] }
      ]
    },
    {
      id: 'test_conners',
      title: 'مقياس كونرز لفرط الحركة وتشتت الانتباه (Conners-3 Rating Scale)',
      category: 'adhd',
      specialty: 'psychology',
      target_age: '7-12',
      duration_minutes: 20,
      items_count: 20,
      standard_cutoff: 'T-Score > 65 (دلالة إكلينيكية مرتفعة لـ ADHD)',
      description: 'استمارة تقييم شاملة معيارية للمعلمين والآباء لتحديد مؤشرات فرط النشاط، الاندفاعية، وتشتت الانتباه الأكاديمي.',
      items: [
        { id: 1, title: '1. صعوبة في الحفاظ على الانتباه في الواجبات المدرسية', options: ['أبداً / نادراً (0)', 'أحياناً (1)', 'غالباً (2)', 'دائماً تقريباً (3)'] },
        { id: 2, title: '2. التململ في المقعد أو تحريك اليدين والقدمين بكثرة', options: ['أبداً / نادراً (0)', 'أحياناً (1)', 'غالباً (2)', 'دائماً تقريباً (3)'] },
        { id: 3, title: '3. الاندفاع في الإجابة قبل انتهاء السؤال', options: ['أبداً / نادراً (0)', 'أحياناً (1)', 'غالباً (2)', 'دائماً تقريباً (3)'] }
      ]
    }
  ];

  const handleStartTest = (test) => {
    setActiveTest(test);
    const initial = {};
    test.items.forEach((item, idx) => {
      initial[idx] = 0;
    });
    setAnswers(initial);
    setTestResult(null);
  };

  const handleAnswerSelect = (itemIdx, scoreValue) => {
    setAnswers({
      ...answers,
      [itemIdx]: scoreValue
    });
  };

  const calculateScore = () => {
    setLoading(true);
    setTimeout(() => {
      let total = 0;
      Object.values(answers).forEach(val => {
        total += Number(val);
      });

      let severity = 'طبيعي / ضمن الحدود السوية';
      let badgeColor = 'badge-success';
      let interpretation = 'الدرجة المحصلة لا تشير إلى وجود مؤشرات إكلينيكية دالة على اضطراب حاد.';

      if (activeTest.id === 'test_bdi') {
        if (total >= 10) {
          severity = 'اكتئاب متوسط إلى شديد';
          badgeColor = 'badge-danger';
          interpretation = 'الدرجة تشير إلى وجود أعراض اكتئابية واضحة تتطلب تدخلاً علاجياً معرفياً سلوكياً (CBT) ومتابعة دورية.';
        } else if (total >= 5) {
          severity = 'أعراض اكتئابية خفيفة';
          badgeColor = 'badge-warning';
          interpretation = 'توجد مؤشرات طفيفة لتقلب المزاج يوصى بدعم نفسي واستكشاف مصادر الضغط.';
        }
      } else if (activeTest.id === 'test_cars') {
        if (total >= 8) {
          severity = 'مؤشرات دالة على طيف التوحد (متوسط إلى شديد)';
          badgeColor = 'badge-danger';
          interpretation = 'الاستجابات تظهر صعوبات واضحة في التفاعل الاجتماعي، التقليد، والتواصل البصري. يوصى ببرنامج تدخل مبكر (PECS / TEACCH).';
        } else if (total >= 5) {
          severity = 'سمات توحد خفيفة / اضطراب تواصل اجتماعي';
          badgeColor = 'badge-warning';
          interpretation = 'توجد سمات تواصلية تحتاج لتأهيل أرطوفوني وبرنامج تنمية مهارات تفاعلية.';
        }
      } else if (activeTest.id === 'test_conners') {
        if (total >= 6) {
          severity = 'مؤشر إيجابي دال على ADHD (تشتت وفرط حركة)';
          badgeColor = 'badge-danger';
          interpretation = 'الدرجة تشير إلى اندفاعية حركية ملحوظة وتشتت انتباه يؤثر على الأداء الأكاديمي، يوصى ببرنامج تدريب الوظائف التنفيذية وتعديل السلوك.';
        }
      }

      setTestResult({
        total_score: total,
        severity,
        badgeColor,
        interpretation,
        test_title: activeTest.title,
        patient_name: patientName,
        date: new Date().toLocaleDateString('ar-DZ')
      });
      setLoading(false);
    }, 600);
  };

  const filteredTests = testsList.filter(t => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (selectedAge !== 'all' && t.target_age !== selectedAge) return false;
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase()) && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
      {/* 1. Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
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
            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Scale size={32} color="white" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                🧩 بنك الروائز والاختبارات الإكلينيكية (Clinical Tests & Diagnostic Scales)
              </h1>
              <span style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#c7d2fe'
              }}>
                روائز تشخيصية معيارية مع حساب فوري
              </span>
            </div>
            <p style={{ margin: '0.4rem 0 0 0', color: '#c7d2fe', fontSize: '0.9rem' }}>
              مكتبة الروائز التشخيصية النفسية والأرطوفونية المعيارية، استمارات التصحيح الآلي، منحنيات الدرجات التئينية، ووضع التابلت التفاعلي
            </p>
          </div>
        </div>

        <Link
          to="/tablet/kiosk"
          className="btn"
          style={{ background: 'rgba(255, 255, 255, 0.12)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.25)', padding: '0.65rem 1.15rem', borderRadius: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
        >
          <Tablet size={16} />
          <span>فتح الاختبار على التابلت (Kiosk)</span>
        </Link>
      </div>

      {/* 2. Category Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: '1px solid var(--slate-200)',
        marginBottom: '1.75rem',
        overflowX: 'auto'
      }}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.85rem 1.25rem',
                border: 'none',
                background: 'none',
                fontSize: '0.9rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#4f46e5' : 'var(--slate-600)',
                borderBottom: isActive ? '3px solid #4f46e5' : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{cat.name}</span>
              <span style={{
                fontSize: '0.7rem',
                background: isActive ? '#e0e7ff' : 'var(--slate-100)',
                color: isActive ? '#3730a3' : 'var(--slate-500)',
                padding: '2px 7px',
                borderRadius: '10px',
                fontWeight: 700
              }}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Age Filter */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--slate-50)', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
          <Search size={18} color="var(--slate-400)" />
          <input
            type="text"
            placeholder="ابحث باسم الرائز أو المقياس (مثال: بيك، كارز، كونرز، النطق العربي...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>الفئة المستهدفة:</span>
          <select
            className="form-select"
            value={selectedAge}
            onChange={(e) => setSelectedAge(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
          >
            <option value="all">جميع الفئات</option>
            <option value="3-6">طفولة مبكرة (3-6 سنوات)</option>
            <option value="7-12">أطفال متمدرسين (7-12 سنة)</option>
            <option value="teens_adults">مراهقين وبالغين</option>
          </select>
        </div>
      </div>

      {/* 4. Tests Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {filteredTests.map((test) => (
          <div
            key={test.id}
            className="card"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--slate-200)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: 800 }}>
                  {test.specialty === 'orthophonie' ? 'رائز أرطوفوني' : (test.specialty === 'psychology' ? 'مقياس نفسي عيادي' : 'تقييم مشترك')}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={13} />
                  <span>{test.duration_minutes} دقيقة</span>
                </span>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                {test.title}
              </h3>
              <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 1rem 0' }}>
                {test.description}
              </p>

              {/* Cutoff Standard Box */}
              <div style={{ background: 'var(--slate-50)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--slate-200)', marginBottom: '1.25rem', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--slate-700)', marginBottom: '0.2rem' }}>
                  📊 معايير ونقاط القطع (Norms & Cutoffs):
                </div>
                <div style={{ color: 'var(--slate-600)' }}>{test.standard_cutoff}</div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--slate-100)' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.55rem', fontSize: '0.85rem', background: 'linear-gradient(135deg, #4f46e5, #4338ca)', gap: '0.4rem' }}
                onClick={() => handleStartTest(test)}
              >
                <Calculator size={15} />
                <span>بدء التطبيق والتصحيح الآلي</span>
              </button>

              <Link
                to="/tablet/kiosk"
                className="btn btn-secondary"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                title="إرسال للتابلت التفاعلي"
              >
                <Tablet size={16} color="var(--primary-600)" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Interactive Test Assessment & Auto-Scoring Modal */}
      {activeTest && (
        <Modal
          isOpen={true}
          onClose={() => setActiveTest(null)}
          title={`🧪 تطبيق وتصحيح: ${activeTest.title}`}
        >
          <div>
            {/* Patient Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--slate-50)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--slate-200)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Users size={16} color="#4f46e5" />
                <span>ملف المريض: <strong>{patientName}</strong></span>
              </div>
              <span className="badge badge-primary">{activeTest.items.length} بنود إكلينيكية</span>
            </div>

            {/* Test Items Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '55vh', overflowY: 'auto', paddingLeft: '0.5rem', marginBottom: '1.25rem' }}>
              {activeTest.items.map((item, idx) => (
                <div key={item.id} style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--slate-900)', marginBottom: '0.6rem' }}>
                    {item.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {item.options.map((opt, optIdx) => (
                      <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer', padding: '0.35rem 0.5rem', borderRadius: '6px', background: answers[idx] === optIdx ? '#e0e7ff' : 'transparent', color: answers[idx] === optIdx ? '#3730a3' : 'var(--slate-700)', fontWeight: answers[idx] === optIdx ? 700 : 500 }}>
                        <input
                          type="radio"
                          name={`item_${item.id}`}
                          value={optIdx}
                          checked={answers[idx] === optIdx}
                          onChange={() => handleAnswerSelect(idx, optIdx)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculated Result Box */}
            {testResult && (
              <div style={{
                background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)',
                border: '1px solid #c7d2fe',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-700)' }}>مجموع الدرجات الخام:</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#3730a3' }}>
                    {testResult.total_score}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <span className={`badge ${testResult.badgeColor}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                    {testResult.severity}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--slate-800)', lineHeight: 1.6 }}>
                  {testResult.interpretation}
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--slate-200)' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #4f46e5, #4338ca)', fontWeight: 800 }}
                onClick={calculateScore}
                disabled={loading}
              >
                {loading ? 'جاري حساب الدرجات...' : 'حساب الدرجة واستخراج النتيجة التشخيصية 📊'}
              </button>

              <button type="button" className="btn btn-secondary" onClick={() => setActiveTest(null)}>
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
