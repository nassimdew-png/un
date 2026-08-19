import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { BrainCircuit, AlertTriangle, CheckCircle, Calculator, Tablet } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ScaleScorer() {
  const [testType, setTestType] = useState('BDI-II');
  const [patientName, setPatientName] = useState('أمين بلحاج');

  // Sample items for BDI-II Beck Depression Inventory
  const [answers, setAnswers] = useState([1, 2, 1, 2, 3, 1, 2, 1, 0, 2]); // 10 sample items
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const bdiItems = [
    { id: 1, title: '1. الحزن والشعور بالكآبة', options: ['لا أشعر بالحزن (0)', 'أشعر بالحزن أغلب الوقت (1)', 'أنا حزين طوال الوقت ولا أستطيع الخروج من ذلك (2)', 'أنا حزين لدرجة لا تُطاق (3)'] },
    { id: 2, title: '2. التشاؤم والنظرة للمستقبل', options: ['لست محبطاً بشأن مستقبلي (0)', 'أشعر بالإحباط بشأن المستقبل أكثر من المعتاد (1)', 'لا أتوقع أن تتحسن الأمور (2)', 'أشعر أنه لا يوجد أمل وأن الأمور ستزداد سوءاً (3)'] },
    { id: 3, title: '3. الإحساس بالفشل', options: ['لا أشعر أنني فاشل (0)', 'لقد فشلت أكثر مما ينبغي (1)', 'عندما أنظر إلى ماضي أرى الكثير من الإخفاقات (2)', 'أشعر أنني فاشل تماماً كشخص (3)'] },
    { id: 4, title: '4. فقدان المتعة والاهتمام', options: ['أحصل على نفس المتعة كالمعتاد (0)', 'لا أستمتع بالأشياء كما كنت في السابق (1)', 'أحصل على متعة قليلة جداً من الأشياء (2)', 'لا أستطيع الحصول على أي متعة إطلاقاً (3)'] },
    { id: 5, title: '5. الشعور بالذنب', options: ['لا أشعر بالذنب بشكل خاص (0)', 'أشعر بالذنب بشأن أشياء كثيرة فعلتها (1)', 'أشعر بالذنب أغلب الوقت (2)', 'أشعر بالذنب باستمرار وبشكل مؤلم (3)'] },
  ];

  const handleScore = async () => {
    setLoading(true);
    const scoreData = await apiService.scoreScale({
      test_type: testType,
      answers: answers
    });
    setResult(scoreData);
    setLoading(false);
  };

  const handleAnswerChange = (index, value) => {
    const updated = [...answers];
    updated[index] = Number(value);
    setAnswers(updated);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="title-xl" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BrainCircuit color="var(--accent-600)" />
            <span>تصحيح وتحليل المقاييس النفسية (Psychometric Scorer)</span>
          </h1>
          <p className="subtitle">حساب الدرجات المعيارية والتأويل الإكلينيكي التلقائي (BDI-II, HAM-A, M-CHAT)</p>
        </div>

        <Link to="/tablet/kiosk" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
          <Tablet size={16} />
          <span>إرسال للاختبار على التابلت</span>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Scale Questionnaire Items */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 className="title-lg" style={{ fontSize: '1.1rem' }}>مقياس بيك للاكتئاب (BDI-II)</h2>
            <span className="badge badge-accent">21 بند إكلينيكي</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {bdiItems.map((item, idx) => (
              <div key={item.id} style={{ background: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                  {item.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {item.options.map((opt, optIdx) => (
                    <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name={`item_${item.id}`} 
                        value={optIdx} 
                        checked={answers[idx] === optIdx}
                        onChange={() => handleAnswerChange(idx, optIdx)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleScore}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem', marginTop: '1.5rem' }}
            disabled={loading}
          >
            <Calculator size={18} />
            <span>{loading ? 'جاري حساب الدرجات...' : 'حساب الدرجة والتأويل الإكلينيكي'}</span>
          </button>
        </div>

        {/* Results & Severity Panel */}
        <div className="card" style={{ padding: '1.75rem', position: 'sticky', top: '90px' }}>
          <h2 className="title-lg" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>
            النتائج والتصنيف التشخيصي
          </h2>

          {result ? (
            <div className="animate-fade">
              {/* Score Meter */}
              <div style={{
                textAlign: 'center',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, var(--accent-50), #f0fdfa)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--accent-200)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>مجموع الدرجات الخام</div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-700)', lineHeight: 1.1, margin: '0.25rem 0' }}>
                  {result.total_score} <span style={{ fontSize: '1.25rem', color: 'var(--slate-400)' }}>/ {result.max_possible_score}</span>
                </div>
                <div className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', marginTop: '0.5rem' }}>
                  {result.severity}
                </div>
              </div>

              {/* Clinical Interpretation */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-700)', marginBottom: '0.3rem' }}>
                  التأويل الإكلينيكي للنتيجة:
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-800)', lineHeight: 1.6 }}>
                  {result.interpretation_ar}
                </p>
              </div>

              {/* Safety Alerts */}
              {result.clinical_alerts && result.clinical_alerts.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.85rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', color: '#b91c1c', fontSize: '0.8rem' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <div>{result.clinical_alerts[0]}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '2.5rem 1rem' }}>
              <BrainCircuit size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--slate-600)' }}>اضغط على حساب الدرجة لعرض النتيجة</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>سيتم احتساب المؤشرات والشدة التشخيصية فوراً.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
