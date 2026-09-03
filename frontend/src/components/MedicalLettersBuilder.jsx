import React, { useState } from 'react';
import { FileText, Printer, Sparkles, Download, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function MedicalLettersBuilder({ patient, tenant, practitioner }) {
  const [letterType, setLetterType] = useState('orientation'); // orientation, presence, school_adaptation, bilan_summary
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  const patientName = `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || 'المريض(ة)';
  const dateStr = new Date().toLocaleDateString('fr-FR');

  const templates = {
    orientation: `الجزائر في: ${dateStr}\n\nإلى السيد(ة) الدكتور(ة) المشرف(ة):\n\nالموضوع: رسالة توجيه ومتابعة سريرية (Lettre d'Orientation)\n\nأحيطكم علماً بأن الحالة: ${patientName}\nتتابع لدينا جلسات تأهيل وتقييم سريري متخصص.\n\nبناءً على نتائج التقييمات السريرية، نلتمس من سيادتكم إجراء الفحوصات التكميلية اللازمة.\n\nتقبلوا منا فائق التقدير والاحترام.\n\nالأخصائي المشرف: ${practitioner?.name || ''}\n${tenant?.name || 'العيادة'}\n`,
    presence: `الجمهورية الجزائرية الديمقراطية الشعبية\nشهادة حضور ومتابعة جلسات علاجية (Attestation de Suivi)\n\nيشهد الأخصائي: ${practitioner?.name || ''}\nأن المريض(ة): ${patientName}\nيتابع حصصاً علاجية منتظمة بمعدل حصة أسبوعياً.\n\nسلمت هذه الشهادة للمعني للإدلاء بها في حدود ما يسمح به القانون.\n\nحرر في: ${dateStr}`,
    school_adaptation: `تقرير التكييف والمرافقة المدرسية (Aménagement Scolaire)\n\nالتلميذ(ة): ${patientName}\n\nنوصي باتخاذ الترتيبات البيداغوجية التالية:\n1. الجلوس في الصف الأول بالقرب من المعلم.\n2. منح وقت إضافي (ثلث الوقت) أثناء الامتحانات الكتابية.\n3. تفادي القراءة الجهرية المفاجئة أمام القسم.\n\nالتوقيع والختم:`,
  };

  const handleSelectType = (type) => {
    setLetterType(type);
    setContent(templates[type] || '');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>محرر الخطابات والشهادات الطبية والمدرسية (Medical Letters)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            صياغة شهادات الحضور، خطابات التوجيه الطبي، وتوصيات التكييف المدرسي A4
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 space-x-reverse"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة الوثيقة 🖨️</span>
        </button>
      </div>

      {/* Templates Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleSelectType('orientation')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            letterType === 'orientation' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300'
          }`}
        >
          📩 خطاب توجيه طبي (Orientation)
        </button>
        <button
          type="button"
          onClick={() => handleSelectType('presence')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            letterType === 'presence' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300'
          }`}
        >
          📜 شهادة حضور ومتابعة (Attestation)
        </button>
        <button
          type="button"
          onClick={() => handleSelectType('school_adaptation')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            letterType === 'school_adaptation' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300'
          }`}
        >
          🎒 تكييف مدرسي (Aménagement)
        </button>
      </div>

      {/* Editor Box */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <textarea
          rows={12}
          value={content || templates[letterType]}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>
  );
}
