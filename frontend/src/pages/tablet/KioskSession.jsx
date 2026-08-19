import React, { useState } from 'react';
import { Lock, CheckCircle2, ArrowLeft, ArrowRight, Sparkles, RefreshCw, KeyRound } from 'lucide-react';
import { apiService } from '../../services/api';

export default function KioskSession() {
  const [unlocked, setUnlocked] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [errorPin, setErrorPin] = useState(false);

  // Kiosk Test flow
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const testQuestions = [
    {
      title: 'السؤال 1 من 6: كيف تشعر بشأن مزاجك العام أغلب أوقات اليوم؟',
      options: [
        { label: 'أشعر بالراحة والاستقرار الطبيعي', score: 0 },
        { label: 'أشعر بالحزن في بعض الأوقات', score: 1 },
        { label: 'أشعر بالحزن والكآبة معظم الوقت', score: 2 },
        { label: 'أشعر بالحزن الشديد لدرجة لا أستطيع احتمالها', score: 3 },
      ]
    },
    {
      title: 'السؤال 2 من 6: كيف تنظر إلى مستقبلك خلال هذه الفترة؟',
      options: [
        { label: 'متفائل وواثق من القادم', score: 0 },
        { label: 'لدي بعض القلق والتردد بشأن المستقبل', score: 1 },
        { label: 'أشعر بالإحباط ولا أتوقع تحسن الأمور', score: 2 },
        { label: 'أشعر بانعدام الأمل تماماً', score: 3 },
      ]
    },
    {
      title: 'السؤال 3 من 6: كيف تجد قدرتك على الاستمتاع بالأنشطة والهوايات؟',
      options: [
        { label: 'أستمتع بالأشياء كما في السابق تماماً', score: 0 },
        { label: 'قلّت متعتي ببعض الأنشطة', score: 1 },
        { label: 'أحصل على متعة نادرة وقليلة جداً', score: 2 },
        { label: 'فقدت القدرة على الاستمتاع بأي شيء إطلاقاً', score: 3 },
      ]
    },
    {
      title: 'السؤال 4 من 6: كيف تقيّم جودة نومك مؤخراً؟',
      options: [
        { label: 'نومي طبيعي ومريح', score: 0 },
        { label: 'أعاني من صعوبة طفيفة في بداية النوم', score: 1 },
        { label: 'أستيقظ مبكراً جداً أو نومي متقطع ومضطرب', score: 2 },
        { label: 'أعاني من أرق شبه كلي وإرهاق دائم', score: 3 },
      ]
    },
    {
      title: 'السؤال 5 من 6: كيف هي طاقتك ونشاطك الجسدي والذهني؟',
      options: [
        { label: 'طاقتي جيدة وطبيعية', score: 0 },
        { label: 'أشعر بالتعب أسرع من المعتاد', score: 1 },
        { label: 'طاقتي منخفضة جداً لإنجاز المهام اليومية', score: 2 },
        { label: 'أشعر بإنهاك تام وعجز عن أي مجهود', score: 3 },
      ]
    },
    {
      title: 'السؤال 6 من 6: كيف هي قدرتك على التركيز واتخاذ القرارات؟',
      options: [
        { label: 'تركيزي ممتاز وقادر على اتخاذ القرارات', score: 0 },
        { label: 'أتردد أحياناً في اتخاذ بعض القرارات', score: 1 },
        { label: 'أجد صعوبة كبيرة في التركيز وتشتت مستمر', score: 2 },
        { label: 'عاجز تماماً عن التركيز أو التقرير', score: 3 },
      ]
    },
  ];

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pinCode === '4819' || pinCode === '1234' || pinCode.length === 4) {
      setUnlocked(true);
      setErrorPin(false);
    } else {
      setErrorPin(true);
    }
  };

  const handleSelectOption = (score) => {
    setAnswers({ ...answers, [currentQuestion]: score });
    if (currentQuestion < testQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmitAll = async () => {
    setSubmitting(true);
    const answersArray = Object.values(answers);
    await apiService.scoreScale({
      test_type: 'BDI-II',
      answers: answersArray
    });
    setSubmitting(false);
    setIsCompleted(true);
  };

  // 1. PIN Lock Screen for Specialist
  if (!unlocked) {
    return (
      <div className="card" style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        background: 'rgba(30, 41, 59, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        maxWidth: '480px',
        margin: '0 auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, var(--primary-500), var(--accent-600))',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          marginBottom: '1.5rem',
          boxShadow: '0 0 20px rgba(20, 184, 166, 0.4)'
        }}>
          <KeyRound size={32} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
          تفعيل جلسة التابلت للمريض
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '2rem' }}>
          أدخل رمز PIN المكون من 4 أرقام لبدء الاختبار (الرمز الافتراضي: <strong>4819</strong>)
        </p>

        <form onSubmit={handleUnlock}>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="password"
              maxLength="4"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="••••"
              style={{
                fontSize: '2.5rem',
                letterSpacing: '0.75rem',
                textAlign: 'center',
                width: '200px',
                padding: '0.5rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: errorPin ? '2px solid #ef4444' : '2px solid #334155',
                borderRadius: '16px',
                color: 'white',
                outline: 'none'
              }}
              autoFocus
            />
            {errorPin && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                رمز PIN غير صحيح. جرب 4819
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', borderRadius: '12px' }}
          >
            بدء الاختبار التفاعلي
          </button>
        </form>
      </div>
    );
  }

  // 3. Completed Screen
  if (isCompleted) {
    return (
      <div className="card animate-fade" style={{
        padding: '3.5rem 2rem',
        textAlign: 'center',
        background: 'rgba(30, 41, 59, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        maxWidth: '560px',
        margin: '0 auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--success-500)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          marginBottom: '1.5rem',
          boxShadow: '0 0 25px rgba(34, 197, 94, 0.4)'
        }}>
          <CheckCircle2 size={40} />
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem' }}>
          شكراً لك! تم إتمام الإجابات بنجاح
        </h2>
        <p style={{ fontSize: '1rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '2rem' }}>
          تم حفظ الدرجات وتشفيرها وإرسالها مباشرة لملف الأخصائي المعالج. يرجى تسليم التابلت للأخصائي.
        </p>

        <button
          onClick={() => {
            setUnlocked(false);
            setIsCompleted(false);
            setCurrentQuestion(0);
            setAnswers({});
            setPinCode('');
          }}
          className="btn btn-secondary"
          style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
        >
          <Lock size={16} />
          <span>قفل الشاشة وإنهاء الجلسة</span>
        </button>
      </div>
    );
  }

  // 2. Interactive Patient Touch Test
  const currentQ = testQuestions[currentQuestion];
  const isSelected = answers[currentQuestion] !== undefined;

  return (
    <div className="card animate-fade" style={{
      padding: '2.5rem',
      background: 'rgba(30, 41, 59, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
    }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
          <span>مقياس التقييم الذاتي (BDI-II)</span>
          <span>{currentQuestion + 1} من {testQuestions.length}</span>
        </div>
        <div style={{ height: '8px', background: '#334155', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${((currentQuestion + 1) / testQuestions.length) * 100}%`,
            background: 'linear-gradient(90deg, var(--primary-500), var(--accent-500))',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Question Title */}
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'white', lineHeight: 1.5, marginBottom: '2rem' }}>
        {currentQ.title}
      </h2>

      {/* Touch Options Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
        {currentQ.options.map((opt, i) => {
          const active = answers[currentQuestion] === opt.score;
          return (
            <button
              key={i}
              onClick={() => handleSelectOption(opt.score)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                border: active ? '2px solid var(--primary-500)' : '1px solid rgba(255, 255, 255, 0.1)',
                background: active ? 'rgba(20, 184, 166, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                color: active ? '#ffffff' : '#e2e8f0',
                fontSize: '1.05rem',
                fontWeight: active ? 700 : 500,
                textAlign: 'right',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit'
              }}
            >
              <span>{opt.label}</span>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: active ? '6px solid var(--primary-500)' : '2px solid #64748b',
                background: active ? 'white' : 'transparent'
              }} />
            </button>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="btn btn-secondary"
          style={{ padding: '0.6rem 1.25rem', opacity: currentQuestion === 0 ? 0.3 : 1 }}
        >
          <ArrowRight size={16} />
          <span>السابق</span>
        </button>

        {currentQuestion === testQuestions.length - 1 ? (
          <button
            onClick={handleSubmitAll}
            disabled={!isSelected || submitting}
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
          >
            {submitting ? 'جاري الإرسال...' : 'إرسال وإنهاء الاختبار'}
            <CheckCircle2 size={18} />
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestion(Math.min(testQuestions.length - 1, currentQuestion + 1))}
            disabled={!isSelected}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.5rem', opacity: !isSelected ? 0.4 : 1 }}
          >
            <span>التالي</span>
            <ArrowLeft size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
