import React from 'react';
import { 
  Printer, 
  X, 
  Building2, 
  User, 
  Calendar, 
  FileText, 
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default function PrintableClinicalReport({
  title = 'تقرير سريري متخصص',
  patient = null,
  tenant = null,
  user = null,
  content = '',
  scores = null,
  customSection = null,
  date = null,
  documentRef = null,
  onClose = null,
}) {
  const printDate = date || new Date().toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const refCode = documentRef || `PSY-${patient?.id || '00'}-${Date.now().toString().slice(-4)}`;

  const handlePrint = () => {
    window.print();
  };

  // Determine text direction (RTL if mostly Arabic, else LTR)
  const isArabic = /[\u0600-\u06FF]/.test(typeof content === 'string' ? content : '');
  const dir = isArabic ? 'rtl' : 'ltr';

  // Simple clean markdown-to-HTML parser for clinical reports
  const renderFormattedContent = (text) => {
    if (typeof text !== 'string') return text;

    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let listType = null; // 'ul' or 'ol'

    const flushList = () => {
      if (listItems.length > 0) {
        if (listType === 'ol') {
          elements.push(
            <ol key={`ol-${elements.length}`} className="list-decimal mr-6 ml-6 mb-3 space-y-1 text-slate-800 text-sm leading-relaxed">
              {listItems.map((item, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />)}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${elements.length}`} className="list-disc mr-6 ml-6 mb-3 space-y-1 text-slate-800 text-sm leading-relaxed">
              {listItems.map((item, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />)}
            </ul>
          );
        }
        listItems = [];
        listType = null;
      }
    };

    const formatInline = (str) => {
      return str
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 rounded text-xs">$1</code>');
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        return;
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={idx} className="text-base font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">
            {trimmed.replace('### ', '')}
          </h3>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={idx} className="text-lg font-black text-indigo-900 mt-5 mb-2 pb-1.5 border-b-2 border-indigo-200">
            {trimmed.replace('## ', '')}
          </h2>
        );
      } else if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={idx} className="text-xl font-black text-indigo-950 mt-6 mb-3 pb-2 border-b-2 border-indigo-500">
            {trimmed.replace('# ', '')}
          </h1>
        );
      } 
      // Horizontal Rule
      else if (trimmed === '---' || trimmed === '***') {
        flushList();
        elements.push(<hr key={idx} className="my-4 border-slate-200" />);
      }
      // Unordered Lists
      else if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        if (listType === 'ol') flushList();
        listType = 'ul';
        listItems.push(formatInline(trimmed.replace(/^[\*\-•]\s*/, '')));
      }
      // Ordered Lists
      else if (/^\d+[\.\)]\s/.test(trimmed)) {
        if (listType === 'ul') flushList();
        listType = 'ol';
        listItems.push(formatInline(trimmed.replace(/^\d+[\.\)]\s*/, '')));
      }
      // Standard Paragraph
      else {
        flushList();
        elements.push(
          <p key={idx} className="mb-2 text-slate-800 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
        );
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start">
      
      {/* Floating Action Controls (Hidden when printing) */}
      <div className="no-print fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 space-x-reverse bg-slate-900 border border-slate-700 shadow-2xl px-5 py-2.5 rounded-2xl">
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition"
        >
          <Printer className="w-4 h-4" />
          <span>🖨️ طباعة التقرير (Print PDF)</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center space-x-1 space-x-reverse bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition"
          >
            <X className="w-4 h-4" />
            <span>إغلاق</span>
          </button>
        )}
      </div>

      {/* Printable Sheet Container */}
      <div 
        id="printable-report-area"
        className="w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl rounded-none sm:rounded-2xl p-8 sm:p-12 my-12 border border-slate-200"
        dir={dir}
      >
        
        {/* =========================================================
            1. OFFICIAL CLINICAL LETTERHEAD (En-tête Officiel)
           ========================================================= */}
        <header className="border-b-2 border-slate-900 pb-4 mb-6 print-avoid-break">
          <div className="flex items-start justify-between">
            
            {/* Right Side: Clinic Identity */}
            <div className="space-y-1 text-right">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-9 h-9 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-black text-lg print:border print:border-black">
                  Ψ
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    {tenant?.name || 'العيادة التخصصية في التأهيل والأرطوفونيا'}
                  </h2>
                  <p className="text-xs text-indigo-800 font-bold">
                    {user?.specialty || 'الطب النفسي، الأرطوفونيا والتأهيل الحركي-المعرفي'}
                  </p>
                </div>
              </div>

              {(tenant?.address || tenant?.phone || tenant?.email) && (
                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                  {tenant?.address && (
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{tenant.address}</span>
                    </div>
                  )}
                  {tenant?.phone && (
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span dir="ltr">{tenant.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Left Side: Document Metadata & Ref */}
            <div className="text-left space-y-1 font-mono text-xs">
              <div className="bg-slate-100 px-3 py-1 rounded border border-slate-300 inline-block font-bold text-slate-800">
                {refCode}
              </div>
              <div className="text-slate-600 text-[11px]">
                <span>التاريخ: </span>
                <strong>{printDate}</strong>
              </div>
              <div className="text-[10px] text-emerald-700 font-bold flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 inline ml-1" />
                <span>وثيقة معتمدة ومحمية سريرياً</span>
              </div>
            </div>
          </div>

          {/* Report Main Title Banner */}
          <div className="mt-5 text-center bg-indigo-50 border-y border-indigo-200 py-2.5">
            <h1 className="text-lg font-black text-indigo-950 tracking-wide uppercase">
              {title}
            </h1>
          </div>
        </header>

        {/* =========================================================
            2. PATIENT DEMOGRAPHICS BANNER (Fiche Patient)
           ========================================================= */}
        {patient && (
          <section className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 mb-6 text-xs text-slate-800 print-avoid-break">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">اسم ولقب المريض:</span>
                <span className="font-bold text-slate-900 text-sm">{patient.first_name} {patient.last_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">السن / تاريخ الميلاد:</span>
                <span className="font-bold text-slate-900">{patient.age ? `${patient.age} سنوات` : 'غير محدد'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">التشخيص الأولي:</span>
                <span className="font-bold text-indigo-900">{patient.diagnosis_primary || 'استشارة تقييمية'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">الأخصائي المعالج:</span>
                <span className="font-bold text-slate-900">{user?.name || 'الأخصائي الفاحص'}</span>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            3. CUSTOM CHARTS / SCORE SUMMARY (If provided)
           ========================================================= */}
        {customSection && (
          <section className="mb-6 print-avoid-break">
            {customSection}
          </section>
        )}

        {/* =========================================================
            4. CLINICAL CONTENT / AI SYNTHESIS (Corps du Bilan)
           ========================================================= */}
        <main className="clinical-report-body space-y-2 text-justify mb-8">
          {typeof content === 'string' ? renderFormattedContent(content) : content}
        </main>

        {/* =========================================================
            5. FOOTER & SPECIALIST STAMP / SIGNATURE BOX
           ========================================================= */}
        <footer className="mt-12 pt-6 border-t-2 border-slate-300 print-avoid-break">
          <div className="grid grid-cols-2 gap-6 items-end">
            
            {/* Legal Notice */}
            <div className="text-[10px] text-slate-500 leading-relaxed space-y-1">
              <p className="font-bold text-slate-700">تنبيه قانوني وسري:</p>
              <p>
                هذا التقرير وثيقة طبية ونفسية خاصة موجهة للاستخدام العلاجي والمدرسي والتوجيه التخصصي، ومحمية بموجب السر المهني وفق القوانين والأنظمة المعمول بها.
              </p>
              <p className="text-[9px] text-slate-400 font-mono">
                صادر عن منصة PsyPro Clinical SaaS • النظام المقنن للتقييم
              </p>
            </div>

            {/* Specialist Signature & Official Stamp Box */}
            <div className="border-2 border-dashed border-slate-400 rounded-xl p-4 text-center bg-slate-50/50 min-h-[110px] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-800 block">
                  ختم وتوقيع الأخصائي الفاحص
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Signature & Cachet de l'Orthophoniste / Psychologue
                </span>
              </div>

              <div className="pt-6 text-[11px] font-mono text-slate-700 font-bold border-t border-slate-200 mt-3">
                {user?.name || 'الأخصائي المعالج'}
              </div>
            </div>

          </div>
        </footer>

      </div>
    </div>
  );
}
