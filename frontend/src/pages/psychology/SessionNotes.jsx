import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { 
  Activity, 
  Sparkles, 
  Save, 
  Copy, 
  FileCheck, 
  User, 
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export default function SessionNotes() {
  const [patientName, setPatientName] = useState('أمين بلحاج');
  const [sessionNumber, setSessionNumber] = useState(3);
  const [rawNotes, setRawNotes] = useState(
    'المسترشد يشكو من صعوبات في النوم وضغط متواصل في العمل. صرح بأنه يشعر بالتردد المستمر عند اتخاذ القرارات. خلال الجلسة كان متجاوباً، تواصل بصري سليم، أتم واجب رصد الأفكار بنسبة 80%. قمنا بتطبيق تقنية إعادة الهيكلة المعرفية على فكرة "يجب أن أكون مثالياً". استجاب بشكل إيجابي وتم الاتفاق على ممارسة الاسترخاء العضلي.'
  );

  const [loading, setLoading] = useState(false);
  const [soapResult, setSoapResult] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleGenerateSOAP = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await apiService.summarizeSoap({
      patient_name: patientName,
      session_number: sessionNumber,
      raw_notes: rawNotes,
    });

    setSoapResult(result);
    setLoading(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="title-xl" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity color="var(--primary-600)" />
            <span>تنظيم ملاحظات الجلسات العلاجية (SOAP Notes AI)</span>
          </h1>
          <p className="subtitle">تحويل الملاحظات الحرة إلى هيكل إكلينيكي معتمد (Subjective, Objective, Assessment, Plan)</p>
        </div>

        <div className="badge badge-primary">
          <Sparkles size={12} />
          <span>SOAP NLP Clinical Parser</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Therapist Freeform Notes Input */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h2 className="title-lg" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            ملاحظات الأخصائي الخام أثناء الجلسة
          </h2>

          <form onSubmit={handleGenerateSOAP}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">اسم المسترشد / المريض</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={patientName} 
                  onChange={(e) => setPatientName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">رقم الجلسة</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={sessionNumber} 
                  onChange={(e) => setSessionNumber(Number(e.target.value))} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">سرد ومجريات الجلسة (ملاحظات سريعة)</label>
              <textarea 
                className="form-textarea" 
                rows="8"
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                placeholder="اكتب ملاحظاتك بحرية (الأقوال، السلوك، التمارين المطبقة، الواجب المنزلي)..."
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-ai"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="pulse" size={18} />
                  <span>جاري التحليل والتنسيق الإكلينيكي...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>تحويل إلى تقرير SOAP منظم</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Structured SOAP Output */}
        <div className="card" style={{ padding: '1.75rem', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 className="title-lg" style={{ fontSize: '1.1rem' }}>تقرير الجلسة المنظم (SOAP Record)</h2>
            {soapResult && (
              <button 
                onClick={handleSave} 
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                <span>{saved ? 'تم الحفظ بالملف!' : 'حفظ في الملف'}</span>
              </button>
            )}
          </div>

          {soapResult ? (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* S */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', borderRight: '4px solid #3b82f6' }}>
                <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  S - الجانب الذاتي وأقوال المسترشد (Subjective)
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--slate-800)' }}>
                  {soapResult.subjective}
                </div>
              </div>

              {/* O */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', borderRight: '4px solid #10b981' }}>
                <div style={{ fontWeight: 800, color: '#047857', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  O - الملاحظات الموضوعية والسلوكية (Objective)
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--slate-800)' }}>
                  {soapResult.objective}
                </div>
              </div>

              {/* A */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', borderRight: '4px solid #f59e0b' }}>
                <div style={{ fontWeight: 800, color: '#b45309', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  A - التقييم والتأويل الإكلينيكي (Assessment)
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--slate-800)' }}>
                  {soapResult.assessment}
                </div>
              </div>

              {/* P */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', borderRight: '4px solid #8b5cf6' }}>
                <div style={{ fontWeight: 800, color: '#6d28d9', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  P - الخطة والتدخلات القادمة (Plan)
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--slate-800)', whiteSpace: 'pre-line' }}>
                  {soapResult.plan}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--slate-400)',
              textAlign: 'center'
            }}>
              <FileCheck size={44} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, color: 'var(--slate-600)' }}>تقرير SOAP سيظهر هنا بعد التحليل</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>يتم تنقيح وتنظيم الأقوال والسلوك والخطة تلقائياً.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
