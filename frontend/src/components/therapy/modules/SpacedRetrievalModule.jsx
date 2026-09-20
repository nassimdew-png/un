import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  Award, 
  HelpCircle, 
  TrendingUp, 
  Volume2, 
  Edit3, 
  Check, 
  AlertCircle, 
  Play, 
  Pause,
  Layers
} from 'lucide-react';
import { digitalTherapyApi } from '../../../api';
import { soundEngine } from '../../../utils/soundEngine';

export default function SpacedRetrievalModule({ patientId = null, onComplete = null }) {
  const intervals = [15, 30, 60, 120, 240, 480]; // seconds: 15s -> 30s -> 1m -> 2m -> 4m -> 8m

  const defaultTemplates = [
    { question_ar: 'أين تقع غرفتك في العيادة؟', target_answer: 'غرفة رقم 14' },
    { question_ar: 'ما هو اسم المرافق الصحي الخاص بك؟', target_answer: 'أحمد' },
    { question_ar: 'ماذا تفعل قبل النهوض من السرير؟', target_answer: 'أرتدي حذائي وأضغط زر المنبه' },
    { question_ar: 'متى موعد تناول دواء الضغط؟', target_answer: 'بعد وجبة الإفطار مباشرة' },
  ];

  const [promptData, setPromptData] = useState(defaultTemplates[0]);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [customQuestion, setCustomQuestion] = useState(defaultTemplates[0].question_ar);
  const [customAnswer, setCustomAnswer] = useState(defaultTemplates[0].target_answer);

  const [currentIntervalIndex, setCurrentIntervalIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(intervals[0]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [showErrorlessCorrection, setShowErrorlessCorrection] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  const totalCurrentInterval = intervals[currentIntervalIndex];
  const progressPercent = totalCurrentInterval > 0 
    ? ((totalCurrentInterval - secondsRemaining) / totalCurrentInterval) * 100 
    : 0;

  useEffect(() => {
    let timer = null;
    if (isTimerRunning && secondsRemaining > 0) {
      timer = setInterval(() => setSecondsRemaining((s) => s - 1), 1000);
    } else if (isTimerRunning && secondsRemaining === 0) {
      setIsTimerRunning(false);
      setIsWaitingResponse(true);
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('حان وقت فحص الاسترجاع: ' + promptData.question_ar);
        u.lang = 'ar-SA';
        window.speechSynthesis.speak(u);
      }
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, secondsRemaining]);

  const handleStartInterval = () => {
    setSecondsRemaining(intervals[currentIntervalIndex]);
    setIsTimerRunning(true);
    setIsWaitingResponse(false);
    setShowErrorlessCorrection(false);
  };

  const handleSavePrompt = () => {
    setPromptData({
      question_ar: customQuestion,
      target_answer: customAnswer,
    });
    setIsEditingPrompt(false);
  };

  const handleScoreResponse = (isCorrect) => {
    const entry = {
      interval_seconds: intervals[currentIntervalIndex],
      is_correct: isCorrect,
      timestamp: new Date().toLocaleTimeString('ar-DZ'),
    };

    const nextHistory = [...sessionHistory, entry];
    setSessionHistory(nextHistory);

    if (isCorrect) {
      soundEngine.playSuccessSound();
      setShowErrorlessCorrection(false);
      if (currentIntervalIndex + 1 < intervals.length) {
        const nextIdx = currentIntervalIndex + 1;
        setCurrentIntervalIndex(nextIdx);
        setSecondsRemaining(intervals[nextIdx]);
        setIsWaitingResponse(false);
        setIsTimerRunning(true);
      } else {
        setIsFinished(true);
        saveResults(nextHistory);
      }
    } else {
      // Errorless Learning: Show immediate corrective feedback script
      soundEngine.playErrorSound();
      setShowErrorlessCorrection(true);
      soundEngine.speak(
        `تذكر: إجابة السؤال هي: ${promptData.target_answer}. كررها معي الآن من فضلك.`,
        'ar-SA',
        { rate: 0.85 }
      );
    }
  };

  const handleProceedAfterCorrection = () => {
    // Step back to previous interval in ladder
    const fallbackIdx = Math.max(0, currentIntervalIndex - 1);
    setCurrentIntervalIndex(fallbackIdx);
    setSecondsRemaining(intervals[fallbackIdx]);
    setShowErrorlessCorrection(false);
    setIsWaitingResponse(false);
    setIsTimerRunning(true);
  };

  const saveResults = async (history) => {
    if (!patientId) return;
    try {
      const correctCount = history.filter((h) => h.is_correct).length;
      const accuracy = Math.round((correctCount / history.length) * 100);

      await digitalTherapyApi.logResults(patientId, {
        category: 'cognition_memory',
        sub_tool: 'spaced_retrieval',
        accuracy_percentage: accuracy,
        cues_needed_count: history.length - correctCount,
        reaction_time_avg_ms: 1000,
        session_log: {
          question: promptData.question_ar,
          target_answer: promptData.target_answer,
          history,
          max_interval_reached: intervals[currentIntervalIndex],
        },
      });
    } catch (e) {
      console.error('Failed to log spaced retrieval:', e);
    }
  };

  const formatIntervalLabel = (sec) => {
    if (sec >= 60) {
      return `${sec / 60}د`;
    }
    return `${sec}ث`;
  };

  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 max-w-3xl mx-auto shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/25">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              تدريب الذاكرة المتباعدة (Spaced Retrieval Therapy)
            </h3>
            <p className="text-xs text-slate-400">
              تقنية الاسترجاع بفواصل متضاعفة والتعلم دون أخطاء (Errorless Learning Ladder)
            </p>
          </div>
        </div>

        <div className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-3.5 py-1.5 rounded-xl border border-amber-500/30">
          فاصل: {formatIntervalLabel(intervals[currentIntervalIndex])}
        </div>
      </div>

      {!isFinished ? (
        <div className="space-y-6">
          {/* Target Prompt Definition Box */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>المعلومة الإجرائية المستهدفة (Prompt & Target):</span>
              </span>

              <button
                type="button"
                onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                className="text-xs font-bold text-slate-400 hover:text-amber-300 flex items-center space-x-1 space-x-reverse transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingPrompt ? 'إلغاء' : 'تخصيص السؤال'}</span>
              </button>
            </div>

            {!isEditingPrompt ? (
              <div className="space-y-2">
                <div className="text-base font-black text-white leading-snug">
                  « {promptData.question_ar} »
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-bold flex items-center justify-between">
                  <span>🎯 الإجابة النموذجية: <strong className="text-white text-sm">{promptData.target_answer}</strong></span>
                  <button
                    type="button"
                    onClick={() => soundEngine.speak(promptData.target_answer, 'ar-SA', { rate: 0.85 })}
                    className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300"
                    title="نطق الإجابة"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">سؤال الفحص (Question):</label>
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">الإجابة المتوقعة (Target Answer):</label>
                  <input
                    type="text"
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSavePrompt}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1 space-x-reverse shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>حفظ وتطبيق</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Retention Ladder Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
              <span>سلم الفواصل الزمنية (Ladder):</span>
              <span className="font-mono text-amber-300">مستوى {currentIntervalIndex + 1} / {intervals.length}</span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {intervals.map((sec, i) => {
                let badgeStyle = 'bg-slate-950 text-slate-500 border-slate-800';
                if (i === currentIntervalIndex) {
                  badgeStyle = 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/20 scale-105';
                } else if (i < currentIntervalIndex) {
                  badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
                }

                return (
                  <div
                    key={i}
                    className={`py-2 rounded-2xl border text-center font-mono text-xs transition-all ${badgeStyle}`}
                  >
                    {formatIntervalLabel(sec)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Animated Circular Countdown Stage */}
          <div className="p-8 rounded-3xl bg-slate-950 border-2 border-slate-800 text-center space-y-5 shadow-inner relative overflow-hidden">
            {!isTimerRunning && !isWaitingResponse && !showErrorlessCorrection && (
              <div className="space-y-4 py-4">
                <button
                  type="button"
                  onClick={handleStartInterval}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 space-x-reverse mx-auto transition-all active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>بدء الفاصل الزمني ({formatIntervalLabel(intervals[currentIntervalIndex])})</span>
                </button>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  قم بإشغال المريض بنشاط ملء فراغ أو حديث غير متعلق حتى انتهاء الفاصل
                </p>
              </div>
            )}

            {isTimerRunning && (
              <div className="relative inline-flex items-center justify-center">
                {/* SVG Countdown Ring */}
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="text-amber-400 transition-all duration-1000"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black font-mono text-amber-300">
                    {secondsRemaining}s
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">متبقي</span>
                </div>
              </div>
            )}

            {/* Waiting for Recall Prompt */}
            {isWaitingResponse && !showErrorlessCorrection && (
              <div className="space-y-4 animate-in zoom-in-95 py-2">
                <div className="text-base font-black text-emerald-300 animate-bounce">
                  🔔 حان وقت طرح السؤال الآن: « {promptData.question_ar} »
                </div>

                <div className="flex items-center space-x-3 space-x-reverse justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleScoreResponse(false)}
                    className="px-6 py-3.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 font-black text-xs flex items-center space-x-2 space-x-reverse shadow-md transition-all active:scale-95"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>نسي الإجابة (إخفاق في الاسترجاع)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScoreResponse(true)}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center space-x-2 space-x-reverse shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تذكّر بنجاح ✅ (مضاعفة الفاصل)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Errorless Learning Immediate Correction Script */}
            {showErrorlessCorrection && (
              <div className="p-6 rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 text-right space-y-4 animate-in zoom-in-95">
                <div className="flex items-center space-x-2 space-x-reverse text-rose-300 font-black text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>بروتوكول التعلم دون أخطاء (Errorless Immediate Script):</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed">
                  <span className="text-amber-400 font-bold block mb-1">قم بتوجيه العبارة التالية للمريض فوراً:</span>
                  « تذكر: إجابة السؤال هي: <strong className="text-white bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40">{promptData.target_answer}</strong>. كررها معي الآن من فضلك. »
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleProceedAfterCorrection}
                    className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95"
                  >
                    <span>كررها المريض بنجاح ➔ استئناف الفاصل السابق</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Completion Summary Screen */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-teal-400 flex items-center justify-center text-slate-950 mx-auto shadow-xl shadow-amber-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-xl font-black text-white">اكتمل برنامج تثبيت الذاكرة المتباعدة 🌟</h4>
            <p className="text-xs text-slate-400">
              تمكن المريض من الاحتفاظ بالمعلومة واسترجاعها بنجاح حتى أقصى فاصل زمني (8 دقائق)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300">
            🎯 المعلومة المثبتة: « {promptData.target_answer} »
          </div>

          <div className="flex items-center space-x-3 space-x-reverse justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                setCurrentIntervalIndex(0);
                setIsFinished(false);
                setIsTimerRunning(false);
                setIsWaitingResponse(false);
                setShowErrorlessCorrection(false);
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة التدريب</span>
            </button>

            {onComplete && (
              <button
                type="button"
                onClick={onComplete}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs transition-all shadow-md"
              >
                العودة للكتالوج
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
