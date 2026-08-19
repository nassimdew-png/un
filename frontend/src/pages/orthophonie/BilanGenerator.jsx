import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { 
  Sparkles, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Stethoscope,
  Copy,
  BookOpen
} from 'lucide-react';

export default function BilanGenerator() {
  const [patientName, setPatientName] = useState('ياسين بن علي');
  const [bilanType, setBilanType] = useState('initial');
  
  // Clinical observations state
  const [vocalArticulation, setVocalArticulation] = useState('تشويه نطق حرفي /s/ و /z/ واستبدالهما بصوت ث');
  const [expressiveLanguage, setExpressiveLanguage] = useState('تأخر لغوي بسيط في بناء الجمل المركبة واستخدام روابط الربط');
  const [comprehension, setComprehension] = useState('فهم سليم للأوامر البسيطة والمعقدة والمفاهيم المكانية');
  const [stuttering, setStuttering] = useState('لا توجد مظاهر تأتأة، طلاقة كلامية طبيعية');
  const [additionalNotes, setAdditionalNotes] = useState('تعاون إيجابي وتفاعل ممتاز مع الأنشطة التقييمية المصورة');

  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      patient_name: patientName,
      anamnese: {
        pregnancy_notes: 'ولادة طبيعية دون مضاعفات',
        motor_development: 'المشي في عمر 13 شهراً',
        school_grade: 'السنة الأولى ابتدائي'
      },
      clinical_input: {
        vocal_articulation: vocalArticulation,
        expressive_language: expressiveLanguage,
        comprehension: comprehension,
        stuttering: stuttering,
        additional_notes: additionalNotes
      }
    };

    const result = await apiService.generateBilan(payload);
    setAiReport(result);
    setLoading(false);
  };

  const handleCopy = () => {
    if (aiReport?.ai_generated_report) {
      navigator.clipboard.writeText(aiReport.ai_generated_report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="title-xl" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles color="var(--indigo-600)" />
            <span>مولد الحصيلة الأرطوفونية الذكي (Clinical AI)</span>
          </h1>
          <p className="subtitle">صياغة الحصيلة الإكلينيكية الرسمية تلقائياً بناءً على الملاحظات والفحص المباشر</p>
        </div>

        <div className="badge badge-primary" style={{ padding: '0.4rem 0.8rem' }}>
          <span>Gemini 1.5 Clinical Pipeline</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Clinical Intake Form */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--slate-100)', paddingBottom: '0.75rem' }}>
            <Stethoscope size={20} color="var(--primary-600)" />
            <h2 className="title-lg" style={{ fontSize: '1.1rem' }}>البيانات والملاحظات الإكلينيكية للفاحص</h2>
          </div>

          <form onSubmit={handleGenerate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">اسم المريض</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={patientName} 
                  onChange={(e) => setPatientName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">نوع الحصيلة</label>
                <select 
                  className="form-select" 
                  value={bilanType} 
                  onChange={(e) => setBilanType(e.target.value)}
                >
                  <option value="initial">حصيلة أولية (Bilan Initial)</option>
                  <option value="reassessment">إعادة تقييم دوري (Évolution)</option>
                  <option value="discharge">حصيلة خروج وإنهاء الكفالة</option>
                </select>
              </div>
            </div>

            {/* Vocal Articulation */}
            <div className="form-group">
              <label className="form-label">1. النطق والجانب الفونولوجي (Articulation et Phonologie)</label>
              <textarea 
                className="form-textarea" 
                rows="2"
                value={vocalArticulation}
                onChange={(e) => setVocalArticulation(e.target.value)}
                placeholder="مخارج الأصوات، التشويه، الإبدال، الحذف..."
              />
            </div>

            {/* Expressive Language */}
            <div className="form-group">
              <label className="form-label">2. اللغة التعبيرية والتركيب النحوي (Langage Expressif)</label>
              <textarea 
                className="form-textarea" 
                rows="2"
                value={expressiveLanguage}
                onChange={(e) => setExpressiveLanguage(e.target.value)}
                placeholder="الرصيد المعجمي، تركيب الجمل، الصرف والنحو..."
              />
            </div>

            {/* Comprehension */}
            <div className="form-group">
              <label className="form-label">3. الفهم اللغوي والإدراكي (Compréhension Orale)</label>
              <textarea 
                className="form-textarea" 
                rows="2"
                value={comprehension}
                onChange={(e) => setComprehension(e.target.value)}
                placeholder="فهم التعليمات البسيطة والمركبة، المعاني المجردة..."
              />
            </div>

            {/* Stuttering / Fluency */}
            <div className="form-group">
              <label className="form-label">4. الطلاقة الكلامية والتأتأة (Fluidité et Voix)</label>
              <input 
                type="text" 
                className="form-input"
                value={stuttering}
                onChange={(e) => setStuttering(e.target.value)}
                placeholder="التأتأة، الإطالات، التكرارات، نوعية الصوت..."
              />
            </div>

            {/* Additional Observations */}
            <div className="form-group">
              <label className="form-label">5. الملاحظات السلوكية والتواصلية الإضافية</label>
              <input 
                type="text" 
                className="form-input"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-ai"
              style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="pulse" size={18} />
                  <span>جاري الصياغة الإكلينيكية بالذكاء الاصطناعي...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>توليد نص الحصيلة الأرطوفونية الرسمية</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: AI Output & PDF Preview */}
        <div className="card" style={{ padding: '1.75rem', background: '#ffffff', minHeight: '620px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--slate-100)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--indigo-600)" />
              <h2 className="title-lg" style={{ fontSize: '1.1rem' }}>معاينة الحصيلة الإكلينيكية المعتمدة</h2>
            </div>

            {aiReport && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button 
                  onClick={handleCopy}
                  className="btn btn-secondary" 
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                  title="نسخ التقرير"
                >
                  <Copy size={14} />
                  <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="btn btn-primary" 
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <Download size={14} />
                  <span>تصدير PDF</span>
                </button>
              </div>
            )}
          </div>

          {aiReport ? (
            <div className="animate-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Diagnostic pill */}
              <div style={{
                background: 'var(--primary-50)',
                border: '1px solid var(--primary-200)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                  الخلاصة التشخيصية المقترحة:
                </div>
                <div style={{ color: 'var(--slate-800)', marginTop: '0.2rem' }}>
                  {aiReport.diagnostic_summary}
                </div>
              </div>

              {/* Formatted Report View */}
              <div style={{
                flex: 1,
                background: 'var(--slate-50)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--slate-200)',
                fontSize: '0.875rem',
                lineHeight: 1.8,
                whiteSpace: 'pre-line',
                overflowY: 'auto',
                maxHeight: '480px'
              }}>
                {aiReport.ai_generated_report}
              </div>
            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'var(--slate-400)',
              padding: '2rem'
            }}>
              <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-600)', marginBottom: '0.3rem' }}>
                في انتظار إدخال الملاحظات
              </div>
              <p style={{ fontSize: '0.85rem', maxWidth: '320px' }}>
                أدخل الملاحظات الإكلينيكية واضغط على "توليد نص الحصيلة" لصياغة تقرير طبي مهني معتمد.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
