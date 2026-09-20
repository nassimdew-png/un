import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Send,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HeartPulse,
  Stethoscope,
  Info,
  Check
} from 'lucide-react';
import { getTestQuestionsDefinition } from '../therapy/PsychologicalQuestionsData';

export default function PatientTestPortalView() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null); // 'not_found' | 'expired' | 'already_completed' | 'pin_required' | 'network'
  const [errorMessage, setErrorMessage] = useState('');
  
  // PIN code dialog state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Questionnaire state
  const [answers, setAnswers] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Fetch test info
  const fetchTestInfo = async (pin = null) => {
    try {
      setLoading(true);
      setErrorStatus(null);
      setPinError('');

      const headers = { 'Content-Type': 'application/json' };
      if (pin) headers['X-Test-Pin'] = pin;

      const res = await fetch(`/api/public/clinical-test/${token}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 410 || data.status === 'expired') {
          setErrorStatus('expired');
          setErrorMessage(data.message || 'عذراً، انتهت صلاحية هذا الرابط.');
        } else if (res.status === 401 || data.status === 'pin_required') {
          setErrorStatus('pin_required');
          setErrorMessage(data.message || 'يتطلب هذا التقييم إدخال رمز الأمان (PIN).');
        } else if (res.status === 403) {
          setErrorStatus('pin_required');
          setPinError(data.message || 'رمز الأمان (PIN) غير صحيح.');
        } else {
          setErrorStatus('not_found');
          setErrorMessage(data.message || 'عذراً، رابط التقييم غير صالح أو تم حذفه.');
        }
        return;
      }

      if (data.status === 'already_completed') {
        setErrorStatus('already_completed');
        setAssignment(data);
        return;
      }

      setAssignment(data.assignment);
      setPatient(data.patient);
      setClinic(data.clinic);

      // Restore saved draft or initialize
      if (data.assignment?.saved_draft && typeof data.assignment.saved_draft === 'object') {
        setAnswers(data.assignment.saved_draft);
      }
    } catch (err) {
      console.error('Failed to load assessment link:', err);
      setErrorStatus('network');
      setErrorMessage('تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTestInfo();
    }
  }, [token]);

  // Question Definition
  const testDefinition = useMemo(() => {
    if (!assignment) return null;
    return getTestQuestionsDefinition({
      code: assignment.test_code,
      title_ar: assignment.test_title,
      norms_payload: assignment.norms_payload,
    });
  }, [assignment]);

  const items = testDefinition?.items || [];
  const totalItems = items.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalItems > 0 ? Math.round((answeredCount / totalItems) * 100) : 0;

  // Handle Choice
  const handleSelectScore = (itemId, score) => {
    const updated = { ...answers, [itemId]: score };
    setAnswers(updated);

    // Auto advance to next question if in single-question mode and not the last question
    if (currentStepIndex < totalItems - 1) {
      setTimeout(() => {
        setCurrentStepIndex(prev => Math.min(prev + 1, totalItems - 1));
      }, 250);
    }
  };

  // Submit test
  const handleSubmit = async () => {
    setConfirmModalOpen(false);

    // Calculate score
    let totalScore = 0;
    items.forEach(it => {
      const s = answers[it.id];
      if (s !== undefined && s !== null) {
        totalScore += Number(s);
      }
    });

    const severity = testDefinition.calculateSeverity ? testDefinition.calculateSeverity(totalScore) : { label: `الدرجة: ${totalScore}` };

    try {
      setIsSubmitting(true);

      const payload = {
        answers_payload: answers,
        raw_score: totalScore,
        severity_label: severity.label,
        diagnostic_notes: `تم إكمال التقييم ذاتياً من المريض(ة). النتيجة الكلية: ${totalScore} من ${testDefinition.maxScore || totalItems * 3} - التصنيف: [${severity.label}]. ${severity.advice || ''}`,
      };

      const res = await fetch(`/api/public/clinical-test/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'فشل إرسال التقييم.');
      }

      const hasItem9Alert = (testDefinition?.code?.includes('PHQ') || testDefinition?.code?.includes('BDI')) && answers[9] > 0;

      setSubmittedResult({
        raw_score: totalScore,
        severity: severity,
        hasCriticalAlert: Boolean(data.has_critical_alert || hasItem9Alert),
        completed_at: new Date().toISOString(),
      });
    } catch (err) {
      alert('خطأ أثناء إرسال الإجابات: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 animate-pulse mb-4">
          <Brain className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-base font-bold text-slate-300">جاري تحميل استمارة التقييم السريري...</h2>
        <p className="text-xs text-slate-500 mt-1">يرجى الانتظار لحظات</p>
      </div>
    );
  }

  // 2. PIN Required Dialog
  if (errorStatus === 'pin_required') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">التقييم محمي برمز أمان</h2>
            <p className="text-xs text-slate-400 mt-1">أدخل رمز الـ PIN المكون من 4 أرقام الممنوح لك من طرف العيادة</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); fetchTestInfo(pinInput); }} className="space-y-3">
            <input
              type="password"
              maxLength={10}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-bold outline-none"
              autoFocus
            />

            {pinError && (
              <div className="text-xs text-rose-400 font-bold flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!pinInput.trim()}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
            >
              تأكيد والدخول للاستمارة
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Error States (Expired / Not Found / Network)
  if (errorStatus === 'expired' || errorStatus === 'not_found' || errorStatus === 'network') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center" dir="rtl">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-base font-black text-white">
            {errorStatus === 'expired' ? 'انتهت صلاحية رابط التقييم' : 'الرابط غير صالح أو تم حذفه'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {errorMessage || 'يرجى التواصل مع العيادة أو الأخصائي المعالج لتزويدك برابط جديد مخصص.'}
          </p>
          <div className="pt-2 text-[11px] text-slate-500 font-mono">
            Clinic SaaS Secure Portal • 2026
          </div>
        </div>
      </div>
    );
  }

  // 4. Already Completed State
  if (errorStatus === 'already_completed' || submittedResult) {
    const isAlert = submittedResult?.hasCriticalAlert || answers[9] > 0;
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-center" dir="rtl">
        <div className="bg-slate-900 border border-slate-800/90 rounded-3xl max-w-md w-full p-8 space-y-5 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
              ✓ تم استلام الإجابات بنجاح
            </span>
            <h2 className="text-lg font-black text-white mt-2">
              شكراً لحسن تعاونكم {patient?.first_name ? `أستاذ(ة) ${patient.first_name}` : ''}!
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">
              تم إرسال وحفظ إجاباتك المشفرة مباشرة في ملفك الطبي لدى طبيبك المعالج في {clinic?.name || 'العيادة'}.
            </p>
          </div>

          {/* Supportive Care Notice for Item 9 Flag */}
          {isAlert && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs text-right space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <HeartPulse className="w-4 h-4 text-amber-400" />
                <span>رسالة رعاية ودعم:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                صحتك وسلامتك النفسية هي أولويتنا القصوى دائماً. طبيبك المعالج وفريق الرعاية في العيادة على اطلاع ومستعدون لمساندتك في أي وقت. لا تتردد أبداً في التواصل المباشر مع عيادتك.
              </p>
              {clinic?.phone && (
                <div className="pt-1 text-[11px] text-amber-300 font-bold font-mono">
                  هاتف العيادة: {clinic.phone}
                </div>
              )}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-right text-xs text-slate-300 space-y-1.5">
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>التقييم السريري:</span>
              <strong className="text-white font-bold">{assignment?.test_title || testDefinition?.title_ar}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>تاريخ وتوقيت الإكمال:</span>
              <strong className="text-slate-200 font-mono">
                {new Date(submittedResult?.completed_at || assignment?.completed_at || Date.now()).toLocaleString('ar-DZ')}
              </strong>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            يمكنك الآن إغلاق هذه الصفحة بأمان.
          </p>
        </div>
      </div>
    );
  }

  // 5. Active Questionnaire Interface
  const currentItem = items[currentStepIndex];
  const isLastQuestion = currentStepIndex === totalItems - 1;
  const allAnswered = totalItems > 0 && answeredCount === totalItems;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6" dir="rtl">
      {/* Top Header / Clinic Branding */}
      <header className="max-w-2xl w-full mx-auto pb-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white">{clinic?.name || 'العيادة التخصصية'}</h1>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>المريض: <strong className="text-slate-200">{patient?.first_name} {patient?.last_name}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400"><ShieldCheck className="w-3 h-3" /> اتصال مشفر</span>
            </div>
          </div>
        </div>

        {assignment?.mode === 'clinic_tablet' && (
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-black">
            📱 وضع التابلت المباشر
          </span>
        )}
      </header>

      {/* Main Questionnaire Box */}
      <main className="max-w-2xl w-full mx-auto my-auto py-6 space-y-6">
        {/* Title & Instruction Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-bold">
              {testDefinition?.code}
            </span>
            <div className="text-xs text-slate-400 font-bold">
              <span>السؤال {currentStepIndex + 1} من {totalItems}</span>
            </div>
          </div>

          <div>
            <h2 className="text-base font-black text-white">
              {testDefinition?.title_ar}
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {testDefinition?.instruction}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1 pt-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
              <span>نسبة الإنجاز: {progressPercent}%</span>
              <span>مكتمل ({answeredCount} من {totalItems})</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Question Card */}
        {currentItem && (
          <div className="bg-slate-900 border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in relative">
            <div className="text-sm sm:text-base font-black text-white leading-relaxed">
              {currentItem.title}
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {(currentItem.options || testDefinition?.standardOptions || []).map((opt, idx) => {
                const isSelected = answers[currentItem.id] === opt.score;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectScore(currentItem.id, opt.score)}
                    className={`w-full text-right p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-[1.01]'
                        : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-xl border flex items-center justify-center shrink-0 text-xs transition ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'border-slate-700 bg-slate-900 text-slate-400'
                      }`}>
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <span className="leading-snug">{opt.text}</span>
                    </div>

                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stepper Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold transition flex items-center gap-1.5"
          >
            <ArrowRight className="w-4 h-4" />
            <span>السؤال السابق</span>
          </button>

          {!isLastQuestion ? (
            <button
              type="button"
              onClick={() => setCurrentStepIndex(prev => Math.min(totalItems - 1, prev + 1))}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>السؤال التالي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmModalOpen(true)}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>إرسال التقييم النهائي للطبيب</span>
            </button>
          )}
        </div>

        {/* Quick Question Jump Dots */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          {items.map((it, idx) => {
            const isDone = answers[it.id] !== undefined;
            const isCurrent = idx === currentStepIndex;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`w-6 h-6 rounded-lg text-[10px] font-mono font-bold transition flex items-center justify-center ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                    : isDone
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-950 text-slate-600 border border-slate-800'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="max-w-2xl w-full mx-auto pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
        جميع الإجابات مشفرة وتخضع للسرية الطبية التامة وفق معايير حماية البيانات الصحية.
      </footer>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">تأكيد إرسال الإجابات</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              لقد أجبت عن <strong className="text-white font-bold">{answeredCount}</strong> من أصل <strong className="text-white font-bold">{totalItems}</strong> أسئلة. هل أنت متأكد من تسليم الإجابات لطبيبك المعالج؟
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? <Brain className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isSubmitting ? 'جاري الإرسال...' : 'نعم، إرسال الآن'}</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                مراجعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
