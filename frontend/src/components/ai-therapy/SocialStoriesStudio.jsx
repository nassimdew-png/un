import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { aiTherapyApi } from '../../api';
import StudioActionBar from './StudioActionBar';
import ClinicalReportPrintLetterhead, { ClinicalReportPrintStamp } from './ClinicalReportPrintLetterhead';

export default function SocialStoriesStudio({ selectedPatient, onSaveToPatient }) {
  const [behaviorTarget, setBehaviorTarget] = useState('التحكم في نوبات الغضب والانتظار بهدوء');
  const [childName, setChildName] = useState(selectedPatient ? selectedPatient.first_name : 'أمين');
  const [childAge, setChildAge] = useState(selectedPatient ? selectedPatient.age : 6);
  const [setting, setSetting] = useState('المدرسة الابتدائية وقاعة القسم والدار');
  const [loading, setLoading] = useState(false);
  const [storyOutput, setStoryOutput] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiTherapyApi.generateSocialStory({
        patient_id: selectedPatient ? selectedPatient.id : null,
        behavior_target: behaviorTarget,
        child_name: childName,
        child_age: parseInt(childAge, 10) || 6,
        cultural_setting: setting,
      });

      let parsed = res.data?.content;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed.replace(/```json|```/g, '').trim());
        } catch {
          parsed = { story_title: 'قصة اجتماعية', panels: [], parent_guidelines: parsed };
        }
      }
      setStoryOutput(parsed);
    } catch (err) {
      setError(err.message || 'فشل إنشاء القصة الاجتماعية.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right font-sans" dir="rtl">
      {/* Controls Form */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl print:hidden">
        <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-3">
          <BookOpen className="w-5 h-5 text-teal-400" />
          <div>
            <h3 className="text-sm font-black text-white">استوديو القصص الاجتماعية المصورة</h3>
            <p className="text-[11px] text-slate-400">صياغة سيناريوهات تعديل السلوك بـ 4 لوحات بصرية وبالدارجة الجزائرية.</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">السلوك أو الموقف المستهدف:</label>
          <input
            type="text"
            value={behaviorTarget}
            onChange={(e) => setBehaviorTarget(e.target.value)}
            placeholder="مثال: الذهاب إلى المدرسة بدون بكاء، مشاركة الألعاب، انتظار الدور..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">اسم الطفل البطل:</label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">عمر الطفل:</label>
            <input
              type="number"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">البيئة والسياق الجزائري:</label>
          <select
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-teal-500"
          >
            <option value="المدرسة الابتدائية والساحة وقاعة القسم">🏫 المدرسة والساحة وقاعة القسم</option>
            <option value="البيت وغرفة النوم والعائلة">🏠 البيت وغرفة النوم واللمة العائلية</option>
            <option value="حانوت الحومة والشارع والمشتريات">🛒 حانوت الحومة والشارع والسوق</option>
            <option value="عيادة الطبيب والفحص الطبي">🏥 عيادة الطبيب وقاعة الانتظار</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-slate-950 text-xs font-black shadow-lg shadow-teal-500/25 transition flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
          <span>{loading ? 'جاري تأليف القصة المصورة...' : '✨ إنشاء القصة الاجتماعية (4 Panels)'}</span>
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Storyboard View Output */}
      <div id="printable-report-area" className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl min-h-[480px] flex flex-col justify-between print:col-span-12 print:bg-white print:border-none print:shadow-none print:p-0">
        <div className="space-y-4">
          {/* Printable Letterhead */}
          <ClinicalReportPrintLetterhead
            selectedPatient={selectedPatient}
            reportTitle={`قصة اجتماعية علاجية: ${storyOutput?.story_title || behaviorTarget}`}
            specialty="العلاج النفسي الحركي وتعديل السلوك التواصلي"
          />

          <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-black text-white">لوحة القصة الاجتماعية (Social Storyboard)</h3>
            </div>
          </div>

          {/* 4-Panel Grid */}
          {storyOutput?.panels && storyOutput.panels.length > 0 ? (
            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-center print:bg-slate-100 print:border-slate-300">
                <h4 className="text-base font-black text-teal-300 print:text-slate-900">{storyOutput.story_title}</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:grid-cols-2">
                {storyOutput.panels.map((panel, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative print:bg-slate-50 print:border-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-teal-400 print:text-slate-800 font-mono">
                        {panel.panel_title || `لوحة رقم ${panel.step_number}`}
                      </span>
                      <span className="text-lg">{panel.emotion_icon || '⭐'}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-white print:text-slate-900 font-bold">{panel.text_arabic}</p>
                      <p className="text-teal-300/90 print:text-slate-700 text-[11px] italic font-sans">{panel.text_darja}</p>
                    </div>

                    {panel.visual_prompt && (
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400 print:text-slate-600 print:bg-white print:border-slate-200 font-mono">
                        🎨 المشهد البصري: {panel.visual_prompt}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {storyOutput.parent_guidelines && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs print:bg-slate-50 print:border-slate-300">
                  <span className="font-black text-purple-300 print:text-slate-900 block">💡 إرشادات وتوجيهات للأولياء:</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">{storyOutput.parent_guidelines}</p>
                </div>
              )}

              {/* Specialist Stamp in Print Mode */}
              <ClinicalReportPrintStamp />
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2 print:hidden">
              <BookOpen className="w-12 h-12 text-slate-600" />
              <h4 className="text-xs font-bold text-slate-400">في انتظار تأليف القصة</h4>
              <p className="text-[11px] text-slate-500 max-w-xs">
                حدد السلوك والاسم واضغط على زر الإنشاء لإنتاج لوحة القصة الاجتماعية المصورة.
              </p>
            </div>
          )}
        </div>

        {/* Unified Studio Action Bar */}
        {storyOutput && (
          <StudioActionBar
            selectedPatient={selectedPatient}
            toolType="social_story"
            title={`قصة اجتماعية: ${storyOutput.story_title || behaviorTarget}`}
            summary={storyOutput.parent_guidelines || 'قصة اجتماعية بـ 4 لوحات بصرية لتعديل السلوك.'}
            payload={storyOutput}
            onSaved={onSaveToPatient}
          />
        )}
      </div>
    </div>
  );
}
