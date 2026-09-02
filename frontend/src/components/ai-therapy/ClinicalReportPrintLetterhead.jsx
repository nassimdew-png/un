import React from 'react';

export default function ClinicalReportPrintLetterhead({
  selectedPatient,
  reportTitle,
  specialty = 'التقييم السريري والتأهيل العصبي المعرفي',
}) {
  const currentDate = new Date().toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="hidden print:block mb-6 font-sans text-slate-900 border-b-2 border-slate-900 pb-4" dir="rtl">
      {/* 1. Top Clinic Letterhead Banner */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-3">
        <div className="text-right space-y-0.5">
          <h2 className="text-lg font-black text-slate-900">الجمهورية الجزائرية الديمقراطية الشعبية</h2>
          <h3 className="text-sm font-bold text-slate-700">عيادة التكفل النفسي والأرطوفوني المتخصص</h3>
          <p className="text-xs text-slate-500 font-mono">{specialty}</p>
        </div>

        <div className="text-left space-y-0.5 text-xs text-slate-600 font-mono">
          <span className="font-bold text-slate-900 block">منصة PsyPro السريرية الذكية</span>
          <span>التاريخ: {currentDate}</span>
          <span className="block">ملف استشاري رقم: {selectedPatient?.id ? `DZ-PT-${selectedPatient.id}` : 'REF-GENERAL'}</span>
        </div>
      </div>

      {/* 2. Patient Demographics Strip */}
      <div className="mt-3 bg-slate-100 p-3 rounded-lg border border-slate-300 grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="font-bold text-slate-600">اسم ولقب المريض: </span>
          <span className="font-black text-slate-900">
            {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : 'فحص استشاري عام'}
          </span>
        </div>
        <div>
          <span className="font-bold text-slate-600">العمر / الميلاد: </span>
          <span className="font-bold text-slate-900">
            {selectedPatient?.age ? `${selectedPatient.age} سنة` : 'غير محدد'} {selectedPatient?.birth_date ? `(${selectedPatient.birth_date})` : ''}
          </span>
        </div>
        <div>
          <span className="font-bold text-slate-600">التشخيص الأولي: </span>
          <span className="font-bold text-slate-900">
            {selectedPatient?.diagnosis_primary || 'استشارة تقييمية'}
          </span>
        </div>
      </div>

      {/* 3. Document Report Title */}
      <div className="mt-3 text-center">
        <h1 className="text-base font-black text-slate-900 underline underline-offset-4">
          {reportTitle || 'تقرير فحص وتدخل علاجي سريري'}
        </h1>
      </div>
    </div>
  );
}

export function ClinicalReportPrintStamp({ practitionerName = 'الأخصائي المعالج' }) {
  const currentDate = new Date().toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="hidden print:flex mt-8 pt-4 border-t border-slate-400 justify-between items-start text-xs text-slate-800 font-sans" dir="rtl">
      <div>
        <span className="font-bold block">ملاحظة نظامية:</span>
        <p className="text-[10px] text-slate-500 max-w-xs mt-0.5">
          هذا التقرير السريري صادر إلكترونياً ومصادق عليه عبر سجلات العيادة، ومحمي وفق معايير السرية الطبية.
        </p>
      </div>

      <div className="text-center space-y-1 w-48 border-2 border-dashed border-slate-400 p-2 rounded-lg">
        <span className="font-black text-slate-900 block">ختم وتوقيع الأخصائي الفاحص</span>
        <span className="text-[10px] text-slate-600 font-mono block">حرر بتاريخ: {currentDate}</span>
        <div className="h-12 flex items-center justify-center text-[10px] text-slate-400 italic">
          [ختم العيادة والتوقيع]
        </div>
      </div>
    </div>
  );
}
