import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  Sparkles, 
  Play, 
  Ear,
  Eye,
  Check
} from 'lucide-react';
import { digitalTherapyApi } from '../../../api';
import { soundEngine } from '../../../utils/soundEngine';

export default function ComprehensionTherapyModule({ patientId = null, onComplete = null }) {
  const [questions, setQuestions] = useState([
    {
      id: 1,
      prompt_ar: 'أين هو «فنجان القهوة الساخن»؟',
      prompt_fr: 'Où est « La tasse de café chaud » ?',
      target_label: 'فنجان قهوة',
      options: [
        { id: 'opt_coffee', label_ar: 'فنجان قهوة', emoji: '☕', is_correct: true },
        { id: 'opt_tea', label_ar: 'كأس ماء بارد', emoji: '🥛', is_correct: false },
        { id: 'opt_pot', label_ar: 'إبريق شاي', emoji: '🫖', is_correct: false },
        { id: 'opt_bowl', label_ar: 'صحن حساء', emoji: '🥣', is_correct: false },
      ],
    },
    {
      id: 2,
      prompt_ar: 'اختر: «سيارة الإسعاف السريعة»',
      prompt_fr: 'Sélectionnez : « L\'ambulance »',
      target_label: 'سيارة إسعاف',
      options: [
        { id: 'opt_car', label_ar: 'سيارة عادية', emoji: '🚗', is_correct: false },
        { id: 'opt_ambulance', label_ar: 'سيارة إسعاف', emoji: '🚑', is_correct: true },
        { id: 'opt_fire', label_ar: 'شاحنة إطفاء', emoji: '🚒', is_correct: false },
        { id: 'opt_bus', label_ar: 'حافلة نقل', emoji: '🚌', is_correct: false },
      ],
    },
    {
      id: 3,
      prompt_ar: 'ابحث عن: «طبيب يفحص المريض بسماعة طبية»',
      prompt_fr: 'Trouvez : « Le médecin avec stéthoscope »',
      target_label: 'طبيب',
      options: [
        { id: 'opt_doc', label_ar: 'طبيب معالج', emoji: '👨‍⚕️', is_correct: true },
        { id: 'opt_teacher', label_ar: 'معلم في القسم', emoji: '👨‍🏫', is_correct: false },
        { id: 'opt_chef', label_ar: 'طباخ في المطعم', emoji: '👨‍🍳', is_correct: false },
        { id: 'opt_builder', label_ar: 'عامل بناء', emoji: '👷', is_correct: false },
      ],
    },
    {
      id: 4,
      prompt_ar: 'انقر على: «كتاب مفتوح للقراءة»',
      prompt_fr: 'Cliquez sur : « Un livre ouvert »',
      target_label: 'كتاب مفتوح',
      options: [
        { id: 'opt_book', label_ar: 'كتاب مفتوح', emoji: '📖', is_correct: true },
        { id: 'opt_pen', label_ar: 'قلم حبر', emoji: '🖊️', is_correct: false },
        { id: 'opt_envelope', label_ar: 'رسالة بريدية', emoji: '✉️', is_correct: false },
        { id: 'opt_newspaper', label_ar: 'جريدة ورقية', emoji: '📰', is_correct: false },
      ],
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [scoreLog, setScoreLog] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentQ = questions[currentIndex];

  const playCurrentPrompt = (langOverride = null) => {
    soundEngine.unlockAudio();
    
    // Clean sentence to remove brackets, quotes, etc.
    let textToSpeak = '';
    const isArabicTarget = langOverride === 'ar' || (!langOverride && currentQ?.prompt_ar);

    if (isArabicTarget && currentQ?.prompt_ar) {
      textToSpeak = currentQ.prompt_ar.replace(/«|»|"|'|:/g, '').trim();
      soundEngine.speak(textToSpeak, 'ar-SA', { rate: 0.85 });
    } else if (currentQ?.prompt_fr) {
      textToSpeak = currentQ.prompt_fr.replace(/«|»|"|'|:/g, '').trim();
      soundEngine.speak(textToSpeak, 'fr-FR', { rate: 0.85 });
    } else if (currentQ?.prompt) {
      textToSpeak = currentQ.prompt.replace(/«|»|"|'|:/g, '').trim();
      soundEngine.speak(textToSpeak, soundEngine.containsArabic(textToSpeak) ? 'ar-SA' : 'fr-FR', { rate: 0.85 });
    }
  };

  useEffect(() => {
    playCurrentPrompt('ar');
  }, [currentIndex]);

  const handleSelectOption = (opt) => {
    if (isAnswered) return;
    setSelectedOptionId(opt.id);
    setIsAnswered(true);

    const isCorrect = opt.is_correct;
    if (isCorrect) {
      soundEngine.playSuccessSound();
    } else {
      soundEngine.playErrorSound();
    }

    const entry = {
      question_id: currentQ.id,
      prompt: currentQ.prompt_ar,
      chosen: opt.label_ar,
      is_correct: isCorrect,
    };

    const nextLogs = [...scoreLog, entry];
    setScoreLog(nextLogs);

    // Auto advance after 1.4s
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOptionId(null);
        setIsAnswered(false);
      } else {
        setIsFinished(true);
        submitResults(nextLogs);
      }
    }, 1400);
  };

  const submitResults = async (finalLogs) => {
    if (!patientId) return;
    setSaving(true);
    try {
      const correctCount = finalLogs.filter((l) => l.is_correct).length;
      const accuracy = Math.round((correctCount / finalLogs.length) * 100);

      await digitalTherapyApi.logResults(patientId, {
        category: 'aphasia_language',
        sub_tool: 'comprehension',
        accuracy_percentage: accuracy,
        cues_needed_count: 0,
        reaction_time_avg_ms: 1200,
        session_log: finalLogs,
      });
    } catch (e) {
      console.error('Failed to log comprehension results:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setScoreLog([]);
    setIsFinished(false);
  };

  const correctCount = scoreLog.filter((l) => l.is_correct).length;
  const accuracy = scoreLog.length > 0 ? Math.round((correctCount / scoreLog.length) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 max-w-2xl mx-auto shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-sky-500/20">
            <Ear className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              الفهم السمعي والقرائي (Comprehension Therapy)
            </h3>
            <p className="text-xs text-slate-400">
              مطابقة الجملة المنطوقة مع الصورة الصحيحة بين المموهات الدلالية
            </p>
          </div>
        </div>

        <div className="font-mono text-xs font-bold text-sky-300 bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-500/30">
          سؤال {currentIndex + 1} / {questions.length}
        </div>
      </div>

      {!isFinished ? (
        <div className="space-y-6">
          {/* Auditory Prompt Box */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-sky-500/30 text-center space-y-4 shadow-inner">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => playCurrentPrompt('ar')}
                className="inline-flex items-center space-x-2 space-x-reverse px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-sky-600/30 transition-all active:scale-95"
              >
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>استماع للجملة 🔊 (العربية)</span>
              </button>

              <button
                type="button"
                onClick={() => playCurrentPrompt('fr')}
                className="inline-flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-bold text-xs border border-slate-700 transition-all active:scale-95"
              >
                <span>🇫🇷 En Français</span>
              </button>
            </div>

            <div className="text-base sm:text-lg font-black text-white leading-relaxed">
              « {currentQ.prompt_ar} »
            </div>
            <div className="text-xs text-slate-400 font-medium italic">
              {currentQ.prompt_fr}
            </div>
          </div>

          {/* 4 Multi-Choice Option Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              let borderBgStyle = 'bg-slate-950/80 border-slate-800 hover:border-slate-600 hover:bg-slate-900';

              if (isAnswered) {
                if (opt.is_correct) {
                  borderBgStyle = 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-400 text-emerald-200';
                } else if (isSelected && !opt.is_correct) {
                  borderBgStyle = 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-400 text-rose-200';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center justify-center space-y-2 text-center shadow-md active:scale-95 ${borderBgStyle}`}
                >
                  <span className="text-5xl sm:text-6xl select-none">{opt.emoji}</span>
                  <span className="text-xs font-extrabold text-slate-200">{opt.label_ar}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-400 to-emerald-400 flex items-center justify-center text-slate-950 mx-auto shadow-xl">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-xl font-black text-white">اكتمل اختبار الفهم والاستيعاب 🌟</h4>
            <p className="text-xs text-slate-400">
              تم تسجيل نسبة دقة الإدراك السمعي بنجاح
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">نسبة الدقة</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{accuracy}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">الإجابات الصحيحة</span>
              <span className="text-2xl font-black font-mono text-sky-300">{correctCount} / {questions.length}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse justify-center pt-2">
            <button
              type="button"
              onClick={handleRestart}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة التمرين</span>
            </button>

            {onComplete && (
              <button
                type="button"
                onClick={onComplete}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs shadow-md"
              >
                متابعة التمارين
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
