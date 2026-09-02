import React, { useState } from 'react';
import {
  Image,
  Upload,
  Sparkles,
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react';
import { aiTherapyApi } from '../../api';
import StudioActionBar from './StudioActionBar';
import ClinicalReportPrintLetterhead, { ClinicalReportPrintStamp } from './ClinicalReportPrintLetterhead';

export default function DrawingAnalyzerStudio({ selectedPatient, onSaveToPatient }) {
  const [testType, setTestType] = useState('bonhomme');
  const [childAge, setChildAge] = useState(selectedPatient ? selectedPatient.age : 7);
  const [notes, setNotes] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisOutput, setAnalysisOutput] = useState(null);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiTherapyApi.analyzeDrawing({
        patient_id: selectedPatient ? selectedPatient.id : null,
        test_type: testType,
        child_age: parseInt(childAge, 10) || 7,
        drawing_image: imageBase64,
        clinical_notes: notes,
      });

      let parsed = res.data?.content;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed.replace(/```json|```/g, '').trim());
        } catch {
          parsed = { test_title: 'تحليل الرسم', clinical_hypotheses: parsed };
        }
      }
      setAnalysisOutput(parsed);
    } catch (err) {
      setError(err.message || 'فشل تحليل الرسم الإسقاطي.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right font-sans" dir="rtl">
      {/* Controls & Upload Form */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl print:hidden">
        <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-3">
          <Image className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-black text-white">محلل الاختبارات الإسقاطية والرسوم (Vision AI)</h3>
            <p className="text-[11px] text-slate-400">تحليل رائز رسم الرجل (Goodenough)، العائلة (Corman)، والشجرة (Koch).</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">نوع الروائز الإسقاطي:</label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-amber-500"
          >
            <option value="bonhomme">🎨 رسم الرجل (Dessin du Bonhomme - Goodenough-Harris)</option>
            <option value="famille">👨‍👩‍👧‍👦 رسم العائلة (Dessin de la Famille - Corman)</option>
            <option value="arbre">🌳 رسم الشجرة (Test de l'Arbre - Koch)</option>
            <option value="htp">🏠 البيت والشجرة والشخص (House-Tree-Person - HTP)</option>
            <option value="libre">🖌️ رسم حر تعبيري (Dessin Libre)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">عمر الطفل وقت إنجاز الرسم:</label>
          <input
            type="number"
            value={childAge}
            onChange={(e) => setChildAge(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-amber-500"
          />
        </div>

        {/* Image Upload Area */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">رفع صورة أو مسح الرسم المنجز:</label>
          <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 text-center cursor-pointer relative bg-slate-950 transition">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {imagePreview ? (
              <div className="space-y-2">
                <img
                  src={imagePreview}
                  alt="Drawing Preview"
                  className="max-h-32 mx-auto rounded-xl border border-slate-700 object-contain"
                />
                <span className="text-[10px] text-amber-400 font-bold block">انقر لتغيير الصورة 🔄</span>
              </div>
            ) : (
              <div className="space-y-1 py-3 text-slate-400">
                <Upload className="w-8 h-8 mx-auto text-amber-400/80" />
                <span className="text-xs font-bold block text-white">اختر صورة الرسم أو اسحبها هنا</span>
                <span className="text-[10px] text-slate-500 block">يدعم JPG, PNG, WEBP بدقة واضحة</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">ملاحظات سلوكية أثناء الرسم (اختياري):</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: تردد، مسح متكرر، إهمال جهة معينة، تعليقات شفهية..."
            className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-amber-500"
          />
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 transition flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Eye className="w-4 h-4 text-slate-950" />}
          <span>{loading ? 'جاري الفحص البصري عبر Gemini Vision...' : '✨ فحص وتحليل الرسم الإسقاطي'}</span>
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Analysis Output Studio */}
      <div id="printable-report-area" className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl min-h-[480px] flex flex-col justify-between print:col-span-12 print:bg-white print:border-none print:shadow-none print:p-0">
        <div className="space-y-4">
          {/* Printable Letterhead */}
          <ClinicalReportPrintLetterhead
            selectedPatient={selectedPatient}
            reportTitle={`تقرير تحليل الاختبار الإسقاطي: ${analysisOutput?.test_title || testType}`}
            specialty="التقييم النفسي الإسقاطي وديناميات الشخصية"
          />

          <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-white">التقرير النفسي التحليلي للرسم (Clinical Report)</h3>
            </div>
          </div>

          {analysisOutput ? (
            <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1 text-xs print:max-h-none print:overflow-visible">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 print:bg-slate-100 print:border-slate-300">
                <h4 className="text-sm font-black text-amber-300 print:text-slate-900">{analysisOutput.test_title || 'تحليل الاختبار الإسقاطي'}</h4>
                <p className="text-slate-300 print:text-slate-800 mt-1">{analysisOutput.developmental_level}</p>
              </div>

              {/* Drawing Preview in print if uploaded */}
              {imagePreview && (
                <div className="hidden print:block text-center my-3">
                  <img
                    src={imagePreview}
                    alt="Patient Drawing"
                    className="max-h-48 mx-auto rounded-lg border border-slate-400 object-contain"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">الرسم المنجز المرفق بالفحص</span>
                </div>
              )}

              {analysisOutput.spatial_layout && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                  <span className="font-black text-indigo-400 print:text-slate-900 block">📐 التموقع المكاني وإشغال الصفحة (Spatial Layout):</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">{analysisOutput.spatial_layout}</p>
                </div>
              )}

              {analysisOutput.graphic_traits && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                  <span className="font-black text-purple-400 print:text-slate-900 block">✏️ الخصائص الخطية وضغط القلم (Graphic Traits):</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">{analysisOutput.graphic_traits}</p>
                </div>
              )}

              {analysisOutput.prominent_indicators && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 print:bg-slate-50 print:border-slate-300">
                  <span className="font-black text-amber-400 print:text-slate-900 block">🔍 المؤشرات البارزة والإسقاطات النوعية:</span>
                  <ul className="space-y-1 text-slate-300 print:text-slate-800 list-disc pr-4">
                    {analysisOutput.prominent_indicators.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisOutput.clinical_hypotheses && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                  <span className="font-black text-emerald-400 print:text-slate-900 block">🧠 الفرضيات الإكلينيكية (Hypothèses Cliniques):</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">{analysisOutput.clinical_hypotheses}</p>
                </div>
              )}

              {analysisOutput.recommendations && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 print:bg-slate-50 print:border-slate-300">
                  <span className="font-black text-teal-400 print:text-slate-900 block">📋 التوصيات السريرية والمتابعة:</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">{analysisOutput.recommendations}</p>
                </div>
              )}

              {/* Specialist Stamp in Print Mode */}
              <ClinicalReportPrintStamp />
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2 print:hidden">
              <Image className="w-12 h-12 text-slate-600" />
              <h4 className="text-xs font-bold text-slate-400">في انتظار رفع الرسم والتحليل</h4>
              <p className="text-[11px] text-slate-500 max-w-xs">
                ارفع صورة واضحة لرسم الطفل لتحليل التموقع المكاني، ضغط القلم، والمؤشرات النفسية.
              </p>
            </div>
          )}
        </div>

        {/* Unified Studio Action Bar */}
        {analysisOutput && (
          <StudioActionBar
            selectedPatient={selectedPatient}
            toolType="drawing_analysis"
            title={`تحليل رسم إسقاطي (${testType})`}
            summary={analysisOutput.developmental_level || 'تحليل نوعي للرسم الإسقاطي عبر Vision AI.'}
            payload={analysisOutput}
            onSaved={onSaveToPatient}
          />
        )}
      </div>
    </div>
  );
}
