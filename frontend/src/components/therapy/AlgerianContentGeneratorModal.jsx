import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  X,
  BookOpen,
  Send,
  Printer,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Layers,
  Smile,
  ShieldCheck,
  Check
} from 'lucide-react';
import { rehabPlanApi } from '../../api';

export default function AlgerianContentGeneratorModal({
  isOpen,
  onClose,
  patient = null,
  initialGoal = null,
  onDispatched = null,
}) {
  const { t } = useTranslation();
  const [contentType, setContentType] = useState('social_story'); // social_story, articulation_cards, home_worksheet
  const [context, setContext] = useState('school'); // school, home, grocery, transport, emotions
  const [targetGoalText, setTargetGoalText] = useState(initialGoal?.title || 'التواصل الفعال والتعبير اللفظي اليومي');
  
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await rehabPlanApi.generateAlgerianContent({
        patient_id: patient?.id,
        content_type: contentType,
        context: context,
        target_goal: {
          title: targetGoalText,
          domain: initialGoal?.domain || 'langage',
        },
        language: 'ar',
      });

      if (res.success && res.data) {
        setGeneratedContent(res.data);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل توليد التمارين السريرية.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchToPortal = async () => {
    if (!patient?.id || !generatedContent) return;

    setDispatching(true);
    setFeedback(null);
    try {
      const title = generatedContent.title || 'تمرين علاجي منزلي موجه';
      let instructions = '';

      if (contentType === 'social_story') {
        instructions = `قصة اجتماعية: ${generatedContent.title}\n\n` +
          generatedContent.steps?.map((s) => `${s.step_num}. ${s.heading}\n${s.text}\n(${s.cue})`).join('\n\n') +
          `\n\nتوجيه الأولياء: ${generatedContent.parent_guidance || ''}`;
      } else if (contentType === 'articulation_cards') {
        instructions = `بطاقات تدريب النطق (${generatedContent.target_phoneme}):\n\n` +
          generatedContent.cards?.map((c) => `• ${c.word} (${c.phonetic}): ${c.phrase}`).join('\n') +
          `\n\nإرشادات التدريب: ${generatedContent.drill_instructions || ''}`;
      } else {
        instructions = `ورقة عمل منزلية أسبوعية (${generatedContent.frequency || ''}):\n\n` +
          generatedContent.activities?.map((a) => `[${a.day}] ${a.title}\n${a.description}`).join('\n\n') +
          `\n\nنصيحة التعزيز: ${generatedContent.reinforcement_tip || ''}`;
      }

      const res = await rehabPlanApi.dispatchToPortal({
        patient_id: patient.id,
        exercise_title: title,
        instructions: instructions,
        category: 'rehabilitation_pep',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });

      if (res.success) {
        setFeedback({ type: 'success', text: 'تم إرسال المحتوى العلاجي بنجاح إلى بوابة الولي والمريض الرقمية! 📲' });
        if (onDispatched) onDispatched(res.assignment);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل الإرسال للبوابة.' });
    } finally {
      setDispatching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              🇩🇿
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2 space-x-reverse">
                <span>مولد التمارين والقصص الاجتماعية في السياق الجزائري</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Algerian-Context AI
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                مخصص للمريض: <strong className="text-white">{patient?.first_name || 'الطفل'}</strong> &bull; البيئة المحلية الجزائرية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`px-6 py-3 text-xs font-bold flex items-center justify-between border-b ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
          }`}>
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Controls Bar */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            {/* Content Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">نوع المحتوى العلاجي المستهدف:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setContentType('social_story')}
                  className={`p-3 rounded-2xl border font-black transition flex items-center justify-center space-x-1.5 space-x-reverse ${
                    contentType === 'social_story' 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>📖 قصة اجتماعية مصورة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContentType('articulation_cards')}
                  className={`p-3 rounded-2xl border font-black transition flex items-center justify-center space-x-1.5 space-x-reverse ${
                    contentType === 'articulation_cards' 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>🔤 بطاقات تدريب مخارج الحروف</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContentType('home_worksheet')}
                  className={`p-3 rounded-2xl border font-black transition flex items-center justify-center space-x-1.5 space-x-reverse ${
                    contentType === 'home_worksheet' 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>📝 ورقة عمل وتدريب منزلي</span>
                </button>
              </div>
            </div>

            {/* Context & Situation Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">السياق والبيئة المرجعية:</label>
                <select
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="school">🏫 المدرسة الابتدائية والساحة والصف</option>
                  <option value="home">🏡 المنزل والتفاعل مع الوالدين والإخوة</option>
                  <option value="grocery">🛒 حانوت الحومة والتسوق وطلب الأغراض</option>
                  <option value="transport">🚌 الحافلة، الترامواي، والشارع العام</option>
                  <option value="emotions">🤝 إدارة نوبات الغضب والهدوء الذاتي</option>
                  <option value="eid">🎉 مناسبة العيد، الزيارات العائلية، والتهاني</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">الهدف السريري المرتبط:</label>
                <input
                  type="text"
                  value={targetGoalText}
                  onChange={(e) => setTargetGoalText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Action Trigger */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 space-x-reverse disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-current" />}
                <span>{loading ? 'جاري الصياغة في السياق الجزائري...' : '✨ توليد المحتوى العلاجي بالذكاء الاصطناعي'}</span>
              </button>
            </div>
          </div>

          {/* Render Generated Material */}
          {generatedContent && (
            <div className="p-6 rounded-3xl bg-slate-950 border border-amber-500/30 shadow-2xl space-y-6 animate-fade-in print:bg-white print:text-black">
              {/* Material Title Banner */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-base font-black text-amber-300">{generatedContent.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    البيئة المرجعية: {generatedContent.context || 'البيئة الجزائرية'} &bull; الطفل: {patient?.first_name || 'أنيس'}
                  </p>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={handlePrint}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1 space-x-reverse"
                    title="طباعة ورقة النشاط"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة</span>
                  </button>

                  <button
                    onClick={handleDispatchToPortal}
                    disabled={dispatching}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black transition flex items-center space-x-1.5 space-x-reverse disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{dispatching ? 'جارٍ الإرسال...' : '📲 إرسال فوري لبوابة الولي'}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Presentation Based on Content Type */}
              {contentType === 'social_story' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {generatedContent.steps?.map((step) => (
                      <div
                        key={step.step_num}
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 relative overflow-hidden"
                      >
                        <div className="flex items-center space-x-2.5 space-x-reverse">
                          <span className="text-2xl">{step.illustration}</span>
                          <h5 className="font-extrabold text-xs text-white">{step.heading}</h5>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{step.text}</p>
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-bold">
                          💡 {step.cue}
                        </div>
                      </div>
                    ))}
                  </div>

                  {generatedContent.parent_guidance && (
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
                      <div className="font-black text-white">👨‍👩‍👧 إرشادات للأولياء لتطبيق القصة في البيت:</div>
                      <p>{generatedContent.parent_guidance}</p>
                    </div>
                  )}
                </div>
              )}

              {contentType === 'articulation_cards' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {generatedContent.cards?.map((card, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-4 space-x-reverse"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-3xl flex items-center justify-center shrink-0">
                          {card.image_emoji}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-sm font-black text-amber-400">{card.word}</span>
                            <span className="text-[10px] font-mono text-slate-400">{card.phonetic}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-bold">{card.phrase}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {generatedContent.drill_instructions && (
                    <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300">
                      <strong>تعليمات التدريب:</strong> {generatedContent.drill_instructions}
                    </div>
                  )}
                </div>
              )}

              {contentType === 'home_worksheet' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {generatedContent.activities?.map((act, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {act.day}
                          </span>
                          <h5 className="font-extrabold text-xs text-white mt-1">{act.title}</h5>
                          <p className="text-xs text-slate-400">{act.description}</p>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-bold flex items-center space-x-2 space-x-reverse shrink-0">
                          <input type="checkbox" className="w-4 h-4 rounded text-teal-500" readOnly />
                          <span>{act.checkbox_label}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {generatedContent.reinforcement_tip && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                      <strong>🌟 نصيحة التشجيع والتعزيز:</strong> {generatedContent.reinforcement_tip}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
