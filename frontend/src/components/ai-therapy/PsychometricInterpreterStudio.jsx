import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  RefreshCw,
  BarChart2,
  AlertCircle
} from 'lucide-react';
import { aiTherapyApi } from '../../api';
import StudioActionBar from './StudioActionBar';
import ClinicalReportPrintLetterhead, { ClinicalReportPrintStamp } from './ClinicalReportPrintLetterhead';

export default function PsychometricInterpreterStudio({ selectedPatient, onSaveToPatient }) {
  const [vci, setVci] = useState(112); // ICV - Compréhension Verbale
  const [vsi, setVsi] = useState(98);  // IVS - Visuo-Spatial
  const [fri, setFri] = useState(105); // IRF - Raisonnement Fluide
  const [wmi, setWmi] = useState(85);  // IMT - Mémoire de Travail
  const [psi, setPsi] = useState(92);  // IVT - Vitesse de Traitement
  const [fsiq, setFsiq] = useState(101); // QIT
  const [language, setLanguage] = useState('fr');

  const [loading, setLoading] = useState(false);
  const [reportOutput, setReportOutput] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  // Derived calculations
  const scores = [vci, vsi, fri, wmi, psi];
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const discrepancy = maxScore - minScore;
  const isHeterogeneous = discrepancy >= 15;
  const gai = Math.round((vci + vsi + fri) / 3);
  const cpi = Math.round((wmi + psi) / 2);

  const handleInterpret = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiTherapyApi.interpretWisc({
        patient_id: selectedPatient ? selectedPatient.id : null,
        vci: parseInt(vci, 10),
        vsi: parseInt(vsi, 10),
        fri: parseInt(fri, 10),
        wmi: parseInt(wmi, 10),
        psi: parseInt(psi, 10),
        fsiq: parseInt(fsiq, 10),
        child_age: selectedPatient ? selectedPatient.age : 9,
        language,
      });

      setMetrics(res.metrics || {
        vci, vsi, fri, wmi, psi,
        max_discrepancy: discrepancy,
        is_heterogeneous: isHeterogeneous,
        gai, cpi,
      });

      let parsed = res.data?.content;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed.replace(/```json|```/g, '').trim());
        } catch {
          parsed = { profile_summary: parsed };
        }
      }
      setReportOutput(parsed);
    } catch (err) {
      setError(err.message || 'فشل تفسير النتائج السيكومترية.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right font-sans" dir="rtl">
      {/* Controls & Scores Inputs */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl print:hidden">
        <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-3">
          <Brain className="w-5 h-5 text-purple-400" />
          <div>
            <h3 className="text-sm font-black text-white">مفسر الروائز وحاسبة المخطط المعرفي (WISC-V)</h3>
            <p className="text-[11px] text-slate-400">حساب مؤشرات IAG/IPC، فحص التباين، وصياغة التقرير العصبي المعرفي.</p>
          </div>
        </div>

        {/* 5 Index Standard Score Inputs */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-300 block">العلامات المعيارية للمؤشرات الأساسية الـ 5 (Standard Scores):</span>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">ICV / VCI (لفظي):</label>
              <input
                type="number"
                min={40}
                max={160}
                value={vci}
                onChange={(e) => setVci(parseInt(e.target.value, 10) || 100)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-center focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">IVS / VSI (فضائي):</label>
              <input
                type="number"
                min={40}
                max={160}
                value={vsi}
                onChange={(e) => setVsi(parseInt(e.target.value, 10) || 100)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-center focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">IRF / FRI (استدلال):</label>
              <input
                type="number"
                min={40}
                max={160}
                value={fri}
                onChange={(e) => setFri(parseInt(e.target.value, 10) || 100)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-center focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">IMT / WMI (ذاكرة عمل):</label>
              <input
                type="number"
                min={40}
                max={160}
                value={wmi}
                onChange={(e) => setWmi(parseInt(e.target.value, 10) || 100)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-center focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">IVT / PSI (سرعة معالجة):</label>
              <input
                type="number"
                min={40}
                max={160}
                value={psi}
                onChange={(e) => setPsi(parseInt(e.target.value, 10) || 100)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-center focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">QIT / FSIQ (كلي):</label>
              <input
                type="number"
                min={40}
                max={160}
                value={fsiq}
                onChange={(e) => setFsiq(parseInt(e.target.value, 10) || 100)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-purple-500/40 text-purple-300 font-mono font-black text-center focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Real-time Computed Badges */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">أعلى فارق بين المؤشرات (Écart Max):</span>
            <span className={`font-bold ${isHeterogeneous ? 'text-amber-400' : 'text-emerald-400'}`}>
              {discrepancy} pts {isHeterogeneous ? '(غير متجانس ⚠️)' : '(متجانس 🟢)'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">IAG / GAI (القدرة العامة):</span>
            <span className="text-white font-black">{gai}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">IPC / CPI (الكفاءة الإجرائية):</span>
            <span className="text-white font-black">{cpi}</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">لغة الصياغة الطبية للتقرير:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-purple-500"
          >
            <option value="fr">🇫🇷 Français Neuropsychologique Médical</option>
            <option value="ar">🇩🇿 العربية الأكاديمية السريرية</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleInterpret}
          disabled={loading}
          className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-500/25 transition flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
          <span>{loading ? 'جاري تحليل المخطط المعرفي عبر Gemini...' : '✨ تحليل وتفسير المخطط المعرفي'}</span>
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Psychogramme Visualizer & Neuropsychological Report */}
      <div id="printable-report-area" className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl min-h-[480px] flex flex-col justify-between print:col-span-12 print:bg-white print:border-none print:shadow-none print:p-0">
        <div className="space-y-4">
          {/* Printable Letterhead */}
          <ClinicalReportPrintLetterhead
            selectedPatient={selectedPatient}
            reportTitle="تقرير الحصيلة العصبية المعرفية والمخطط النفسي (WISC-V Psychogramme)"
            specialty="التقييم العصبي المعرفي والذكاء السريري للأطفال والمراهقين"
          />

          <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-black text-white">المخطط النفسي والتقرير المعرفي (Psychogramme)</h3>
            </div>
          </div>

          {/* Psychogramme Chart Visualizer */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 print:bg-slate-50 print:border-slate-300">
            <span className="text-[11px] font-bold text-slate-400 print:text-slate-900 block font-mono">
              📊 التوزيع البياني للمؤشرات الـ 5 (المتوسط المعياري = 100 ± 15):
            </span>

            <div className="space-y-2 font-mono text-xs">
              {[
                { code: 'ICV / VCI', name: 'الفهم اللفظي', val: vci },
                { code: 'IVS / VSI', name: 'البصري المكاني', val: vsi },
                { code: 'IRF / FRI', name: 'الاستدلال السائل', val: fri },
                { code: 'IMT / WMI', name: 'ذاكرة العمل', val: wmi },
                { code: 'IVT / PSI', name: 'سرعة المعالجة', val: psi },
              ].map((idx) => (
                <div key={idx.code} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white print:text-slate-900 font-bold">{idx.code} ({idx.name})</span>
                    <span className="font-bold text-purple-300 print:text-slate-900">{idx.val}</span>
                  </div>
                  <div className="w-full bg-slate-900 print:bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-800 print:border-slate-300 relative">
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-500 z-10"
                      style={{ left: '50%' }}
                      title="المتوسط = 100"
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx.val >= 115 ? 'bg-purple-500' : idx.val >= 90 ? 'bg-blue-500' : idx.val >= 80 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(Math.max(((idx.val - 40) / 120) * 100, 5), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Neuropsychological Synthesis Output */}
          {reportOutput ? (
            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 text-xs print:max-h-none print:overflow-visible">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 print:bg-slate-100 print:border-slate-300">
                <h4 className="text-sm font-black text-purple-300 print:text-slate-900">ملخص الأداء السيكومتري والتجانس</h4>
                <p className="text-slate-300 print:text-slate-800 mt-1 leading-relaxed">{reportOutput.homogeneity_analysis || reportOutput.profile_summary}</p>
              </div>

              {reportOutput.strengths && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                  <span className="font-black text-emerald-400 print:text-slate-900 block">⭐ نقاط القوة المعرفية (Points Forts):</span>
                  <ul className="space-y-1 text-slate-300 print:text-slate-800 list-disc pr-4">
                    {reportOutput.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {reportOutput.weaknesses && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                  <span className="font-black text-amber-400 print:text-slate-900 block">⚠️ محاور الهشاشة والصعوبة (Points de Fragilité):</span>
                  <ul className="space-y-1 text-slate-300 print:text-slate-800 list-disc pr-4">
                    {reportOutput.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {reportOutput.school_impact && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                  <span className="font-black text-indigo-400 print:text-slate-900 block">🏫 الانعكاس على التعلمات المدرسية (Impact Scolaire):</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">{reportOutput.school_impact}</p>
                </div>
              )}

              {reportOutput.therapeutic_recommendations && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                  <span className="font-black text-teal-400 print:text-slate-900 block">📋 التوصيات السريرية والمدرسية:</span>
                  <ul className="space-y-1 text-slate-300 print:text-slate-800 list-disc pr-4">
                    {reportOutput.therapeutic_recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specialist Stamp in Print Mode */}
              <ClinicalReportPrintStamp />
            </div>
          ) : (
            <div className="h-44 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2 print:hidden">
              <Brain className="w-10 h-10 text-slate-600" />
              <h4 className="text-xs font-bold text-slate-400">في انتظار تحليل المؤشرات</h4>
              <p className="text-[10px] text-slate-500 max-w-xs">
                اضغط على زر التحليل لصياغة التقرير النفسي المعرفي وتحديد التوصيات المدرسية.
              </p>
            </div>
          )}
        </div>

        {/* Unified Studio Action Bar */}
        {reportOutput && (
          <StudioActionBar
            selectedPatient={selectedPatient}
            toolType="wisc_report"
            title="تقرير تفسير مقياس WISC-V والمخطط المعرفي"
            summary={`IAG: ${gai} | IPC: ${cpi} | Écart Max: ${discrepancy} pts (${isHeterogeneous ? 'غير متجانس' : 'متجانس'})`}
            payload={reportOutput}
            onSaved={onSaveToPatient}
          />
        )}
      </div>
    </div>
  );
}
