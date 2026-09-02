import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  Wind,
  AlertCircle
} from 'lucide-react';
import { aiTherapyApi } from '../../api';
import StudioActionBar from './StudioActionBar';
import ClinicalReportPrintLetterhead, { ClinicalReportPrintStamp } from './ClinicalReportPrintLetterhead';

export default function RelaxationStudio({ selectedPatient, onSaveToPatient }) {
  const [therapyGoal, setTherapyGoal] = useState('تأتأة وقلق الكلام قبل الإلقاء المدرسي');
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [technique, setTechnique] = useState('cardiac_coherence');
  const [targetAge, setTargetAge] = useState(selectedPatient ? selectedPatient.age : 11);
  const [loading, setLoading] = useState(false);
  const [sessionOutput, setSessionOutput] = useState(null);
  const [error, setError] = useState(null);

  // Live Breathing Pacer Visualizer state
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('شهيق (Inhale)');
  const [breathScale, setBreathScale] = useState(1);

  useEffect(() => {
    let interval;
    if (isBreathingActive) {
      let step = 0;
      interval = setInterval(() => {
        step = (step + 1) % 10;
        if (step < 4) {
          setBreathingPhase('شهيق عميق من الأنف 🌬️');
          setBreathScale(1.35);
        } else if (step < 6) {
          setBreathingPhase('حبس النفس بهدوء ⏸️');
          setBreathScale(1.35);
        } else {
          setBreathingPhase('زفير بطيء ومريح من الفم 💨');
          setBreathScale(0.85);
        }
      }, 1000);
    } else {
      setBreathingPhase('جاهز للبدء');
      setBreathScale(1);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiTherapyApi.generateRelaxationSession({
        patient_id: selectedPatient ? selectedPatient.id : null,
        therapy_goal: therapyGoal,
        duration_minutes: parseInt(durationMinutes, 10) || 5,
        target_age: parseInt(targetAge, 10) || 10,
        technique,
      });

      let parsed = res.data?.content;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed.replace(/```json|```/g, '').trim());
        } catch {
          parsed = { session_title: 'جلسة استرخاء', phases: [], home_practice_instructions: parsed };
        }
      }
      setSessionOutput(parsed);
    } catch (err) {
      setError(err.message || 'فشل إنشاء جلسة الاسترخاء.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right font-sans" dir="rtl">
      {/* Controls Form */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl print:hidden">
        <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-3">
          <Wind className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-black text-white">استوديو الاسترخاء والتنفس السريري</h3>
            <p className="text-[11px] text-slate-400">تصميم جلسات استرخاء موجهة لعلاج التأتأة، القلق، ونوبات الهلع.</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">الهدف السريري للجلسة:</label>
          <input
            type="text"
            value={therapyGoal}
            onChange={(e) => setTherapyGoal(e.target.value)}
            placeholder="مثال: ضبط التنفس في التأتأة، تهدئة قلق الامتحانات، نوبات الهلع..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">مدة الجلسة:</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-indigo-500"
            >
              <option value={3}>⏱️ 3 دقائق (سريعة)</option>
              <option value={5}>⏱️ 5 دقائق (قياسية)</option>
              <option value={10}>⏱️ 10 دقائق (متعمقة)</option>
              <option value={15}>⏱️ 15 دقيقة (شاملة)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">عمر المريض:</label>
            <input
              type="number"
              value={targetAge}
              onChange={(e) => setTargetAge(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5">التقنية العلاجية المعتمدة:</label>
          <select
            value={technique}
            onChange={(e) => setTechnique(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-indigo-500"
          >
            <option value="cardiac_coherence">🫀 الاتساق القلبي (Cohérence Cardiaque 5.5s)</option>
            <option value="4_7_8">💨 تقنية التنفس 4-7-8 لخفض التوتر الفوري</option>
            <option value="jacobson">🧘 الاسترخاء العضلي التدريجي (Jacobson)</option>
            <option value="guided_imagery">🌅 التخيل الموجه والرسائل الإيجابية (Sophrologie)</option>
          </select>
        </div>

        {/* Interactive Breathing Pacer Mini Widget */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
          <span className="text-[11px] font-bold text-slate-400 block">مجسم التنفس التفاعلي الحي (Pacer Visualizer):</span>
          
          <div className="flex items-center justify-center h-24">
            <div
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 shadow-2xl shadow-indigo-500/50 flex items-center justify-center text-white transition-all duration-1000 ease-in-out"
              style={{ transform: `scale(${breathScale})` }}
            >
              <Wind className="w-7 h-7" />
            </div>
          </div>

          <div className="flex items-center justify-between px-2 text-xs font-bold">
            <span className="text-indigo-300 font-mono">{breathingPhase}</span>
            <button
              type="button"
              onClick={() => setIsBreathingActive(!isBreathingActive)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black transition flex items-center space-x-1 space-x-reverse"
            >
              {isBreathingActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isBreathingActive ? 'إيقاف المؤقت' : 'تشغيل النبض'}</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-500/25 transition flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{loading ? 'جاري تأليف الجلسة العلاجية...' : '✨ توليد نص وبروتوكول الاسترخاء'}</span>
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Script & Guided Meditation Output */}
      <div id="printable-report-area" className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl min-h-[480px] flex flex-col justify-between print:col-span-12 print:bg-white print:border-none print:shadow-none print:p-0">
        <div className="space-y-4">
          {/* Printable Letterhead */}
          <ClinicalReportPrintLetterhead
            selectedPatient={selectedPatient}
            reportTitle={`بروتوكول استرخاء سريري: ${sessionOutput?.session_title || therapyGoal}`}
            specialty="العلاج النفسي السريري وإعادة التأهيل الصوتي والكلامي"
          />

          <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-black text-white">البروتوكول والنص الصوتي الموجه</h3>
            </div>
          </div>

          {sessionOutput?.phases ? (
            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 print:bg-slate-100 print:border-slate-300">
                <h4 className="text-base font-black text-indigo-300 print:text-slate-900">{sessionOutput.session_title}</h4>
                <p className="text-xs text-slate-300 print:text-slate-800 mt-1">{sessionOutput.target_objective}</p>
                {sessionOutput.pacing_rhythm && (
                  <span className="text-[11px] font-mono text-emerald-400 print:text-slate-700 block mt-1 font-bold">
                    ⏱️ إيقاع التنفس: {sessionOutput.pacing_rhythm}
                  </span>
                )}
              </div>

              {sessionOutput.phases.map((phase, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 print:bg-slate-50 print:border-slate-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-purple-300 print:text-slate-900">{phase.phase_name}</span>
                    {phase.pacing_seconds && (
                      <span className="text-[10px] text-slate-400 print:text-slate-600 font-mono">{phase.pacing_seconds} ثانية</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 print:text-slate-800 leading-relaxed font-sans">{phase.script_text}</p>
                </div>
              ))}

              {sessionOutput.home_practice_instructions && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs print:bg-slate-50 print:border-slate-300">
                  <span className="font-black text-teal-300 print:text-slate-900 block">🏠 تعليمات الممارسة المنزلية:</span>
                  <p className="text-slate-300 print:text-slate-800 leading-relaxed">{sessionOutput.home_practice_instructions}</p>
                </div>
              )}

              {/* Specialist Stamp in Print Mode */}
              <ClinicalReportPrintStamp />
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2 print:hidden">
              <Heart className="w-12 h-12 text-slate-600" />
              <h4 className="text-xs font-bold text-slate-400">في انتظار تصميم الجلسة</h4>
              <p className="text-[11px] text-slate-500 max-w-xs">
                حدد الهدف والتقنية والمدة الزمنية لتوليد نص الجلسة والتوجيهات الصوتية.
              </p>
            </div>
          )}
        </div>

        {/* Unified Studio Action Bar */}
        {sessionOutput && (
          <StudioActionBar
            selectedPatient={selectedPatient}
            toolType="relaxation_plan"
            title={`جلسة استرخاء: ${sessionOutput.session_title || therapyGoal}`}
            summary={sessionOutput.target_objective || 'بروتوكول استرخاء وتنفس سريري.'}
            payload={sessionOutput}
            onSaved={onSaveToPatient}
          />
        )}
      </div>
    </div>
  );
}
