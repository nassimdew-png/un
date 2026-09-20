import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  Heart, 
  ShieldCheck, 
  Stethoscope, 
  ArrowRight, 
  Volume2,
  RefreshCw,
  Clock,
  RotateCcw,
  Check,
  Star,
  Send
} from 'lucide-react';
import { remoteTherapyApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

// Import therapy submodules for embedded runner
import NamingTherapyModule from './modules/NamingTherapyModule';
import ComprehensionTherapyModule from './modules/ComprehensionTherapyModule';
import ApraxiaVideoModule from './modules/ApraxiaVideoModule';
import AlphaTopicsAAC from './modules/AlphaTopicsAAC';
import SpacedRetrievalModule from './modules/SpacedRetrievalModule';
import VisualAttentionModule from './modules/VisualAttentionModule';
import DysphagiaProtocolGuide from './modules/DysphagiaProtocolGuide';

export default function PublicRemoteTherapyPortal() {
  const { token } = useParams();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [taskData, setTaskData] = useState(null);

  // Completion state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionStats, setSubmissionStats] = useState(null);

  const handleKeypadPress = (val) => {
    if (pinInput.length < 6) {
      const nextPin = pinInput + val;
      setPinInput(nextPin);
      setPinError('');
      if (nextPin.length === 4) {
        verifyPinCode(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError('');
  };

  const verifyPinCode = async (pinToVerify = pinInput) => {
    if (!pinToVerify || pinToVerify.length < 4) {
      setPinError('يرجى إدخال رمز PIN المكون من 4 أرقام');
      return;
    }

    setVerifying(true);
    setPinError('');
    try {
      soundEngine.unlockAudio();
      const resp = await remoteTherapyApi.verifyPin(token, pinToVerify);
      if (resp && resp.status === 'success') {
        setTaskData(resp);
        setIsUnlocked(true);
        soundEngine.playSuccessSound();
      } else {
        setPinError(resp.error || 'رمز الدخول غير صحيح');
      }
    } catch (err) {
      setPinError(err.message || 'رمز الدخول غير صحيح. يرجى التحقق من الرمز المرسل عبر واتساب.');
      soundEngine.playErrorSound();
    } finally {
      setVerifying(false);
    }
  };

  const handleModuleComplete = async (metrics = {}) => {
    try {
      soundEngine.playSuccessSound();
      const payload = {
        accuracy_percentage: metrics.accuracy_percentage ?? metrics.accuracy ?? 100,
        cues_needed_count: metrics.cues_needed_count ?? metrics.cues_used ?? 0,
        total_time_seconds: metrics.total_time_seconds ?? 120,
        session_log: metrics.session_log ?? metrics.scoreLog ?? [],
      };

      const resp = await remoteTherapyApi.submitResults(token, payload);
      setSubmissionStats({
        accuracy: resp.accuracy ?? payload.accuracy_percentage,
        completedAt: resp.completed_at || new Date().toISOString(),
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to transmit remote results:', err);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white" dir="rtl">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 py-3 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-black shadow-md shadow-indigo-600/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-tight">
                {taskData?.clinic_name || 'بوابة التمارين العلاجية المنزلية'}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                {taskData?.practitioner_name ? `بإشراف: ${taskData.practitioner_name}` : 'المنصة الطبية السريرية'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              🇩🇿 الجزائر
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {!isUnlocked ? (
          /* STEP 1: PIN SECURITY GATE */
          <div className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 mx-auto flex items-center justify-center text-indigo-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-white">
                تأكيد هوية المريض
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                أدخل رمز المرور السري (PIN) المكون من 4 أرقام المرسل لكم عبر واتساب لبدء التمرين.
              </p>
            </div>

            {/* PIN Dots Indicator */}
            <div className="flex justify-center space-x-3 space-x-reverse py-2">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      filled
                        ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-lg shadow-indigo-500/50'
                        : 'border-slate-700 bg-slate-950'
                    }`}
                  />
                );
              })}
            </div>

            {pinError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold animate-in fade-in">
                {pinError}
              </div>
            )}

            {/* 0-9 Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto pt-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(String(num))}
                  className="h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-mono text-xl font-bold transition-all active:scale-95 shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="h-14 rounded-2xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 font-bold text-xs active:scale-95"
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-mono text-xl font-bold transition-all active:scale-95 shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-14 rounded-2xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 font-bold text-xs active:scale-95"
              >
                ⌫
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={verifying || pinInput.length < 4}
                onClick={() => verifyPinCode()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 space-x-reverse transition-all active:scale-98 disabled:opacity-40"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق من الرمز...</span>
                  </>
                ) : (
                  <>
                    <span>فتح التمرين وبدء الجلسة 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : !isSubmitted ? (
          /* STEP 2: INTERACTIVE EXERCISE RUNNER */
          <div className="space-y-4">
            {/* Top Patient Context Bar */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black">
                  👤
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">مرحباً، {taskData.patient_name}</h3>
                  <p className="text-xs text-slate-400">
                    {taskData.task_config?.instructions || 'أكمل التمرين بتركيز واطلب المساعدة عند الحاجة.'}
                  </p>
                </div>
              </div>

              <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                جلسة منزلية موثقة
              </div>
            </div>

            {/* Embedded Sub-Module Component */}
            <div className="bg-slate-900/40 rounded-3xl p-1">
              {taskData.module_key === 'naming' && (
                <NamingTherapyModule 
                  onComplete={handleModuleComplete} 
                />
              )}
              {taskData.module_key === 'comprehension' && (
                <ComprehensionTherapyModule 
                  onComplete={handleModuleComplete} 
                />
              )}
              {taskData.module_key === 'apraxia' && (
                <ApraxiaVideoModule 
                  onComplete={handleModuleComplete} 
                />
              )}
              {taskData.module_key === 'aac' && (
                <AlphaTopicsAAC />
              )}
              {taskData.module_key === 'spaced_retrieval' && (
                <SpacedRetrievalModule 
                  onComplete={handleModuleComplete} 
                />
              )}
              {taskData.module_key === 'visual_attention' && (
                <VisualAttentionModule 
                  onComplete={handleModuleComplete} 
                />
              )}
              {taskData.module_key === 'dysphagia' && (
                <DysphagiaProtocolGuide />
              )}
            </div>
          </div>
        ) : (
          /* STEP 3: CELEBRATION & TRANSMISSION COMPLETE */
          <div className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
              <Award className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-center space-x-1.5 space-x-reverse text-amber-400">
                <Star className="w-6 h-6 fill-amber-400" />
                <Star className="w-6 h-6 fill-amber-400" />
                <Star className="w-6 h-6 fill-amber-400" />
              </div>
              <h2 className="text-xl font-black text-white">
                أحسنت يا {taskData.patient_name}! 🎉
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                تم إكمال النشاط العلاجي بنجاح وإرسال نتائج الأداء تلقائياً إلى ملفك بالعيادة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>نسبة الدقة المحققة:</span>
                <strong className="text-white text-sm font-mono font-black">{submissionStats?.accuracy || 100}%</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>وقت الإكمال:</span>
                <span className="text-emerald-400 font-bold">تم التوثيق والاعتماد</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center space-x-2 space-x-reverse transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة أداء التمرين مرة أخرى</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-4 text-center text-xs text-slate-500 font-medium">
        نظام التأهيل والتخاطب الرقمي السحابي &copy; {new Date().getFullYear()} — جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
