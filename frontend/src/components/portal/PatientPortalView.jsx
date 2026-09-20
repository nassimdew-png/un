import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MapPin, 
  BookOpen, 
  Sparkles, 
  Award, 
  Check, 
  FileText, 
  TrendingUp, 
  Heart, 
  UserCheck, 
  AlertCircle, 
  MessageSquare, 
  Download, 
  ChevronRight,
  Stethoscope,
  Activity,
  Send,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Printer,
  Star,
  Flame,
  Smartphone,
  ShieldCheck,
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { parentPortalApi } from '../../api';

// --- SOUND NOTIFIER (Web Audio API) ---
function playChime(frequency = 587.33, duration = 0.15) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio context errors
  }
}

function playCompletionFanfare() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
    });
  } catch (e) {
    // Ignore
  }
}

export default function PatientPortalView() {
  const { token } = useParams();
  const { t } = useTranslation();

  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('homework'); // 'homework' | 'appointments' | 'bilans' | 'guidance' | 'progress'

  // Action states
  const [confirmingApptId, setConfirmingApptId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [homeworkFilter, setHomeworkFilter] = useState('all'); // 'all' | 'pending' | 'completed'

  // Interactive Practice Companion Modal State
  const [companionHw, setCompanionHw] = useState(null);
  const [companionTimer, setCompanionTimer] = useState(600); // 10 mins default (in seconds)
  const [initialTimerMinutes, setInitialTimerMinutes] = useState(10);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [difficultyRating, setDifficultyRating] = useState('easy'); // 'easy' | 'moderate' | 'hard'
  const [attentionRating, setAttentionRating] = useState('focused'); // 'focused' | 'moderate' | 'distracted'
  const [companionFeedback, setCompanionFeedback] = useState('');
  const [isSubmittingHw, setIsSubmittingHw] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const companionIntervalRef = useRef(null);

  // Printable Workbook Modal
  const [showPrintWorkbook, setShowPrintWorkbook] = useState(false);

  // PWA Companion App Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissInstall, setDismissInstall] = useState(() => localStorage.getItem('parent_portal_pwa_dismissed') === 'true');

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      showToast('لتثبيت التطبيق على الشاشة الرئيسية:\nعلى Android (Chrome): القائمة (⋮) ثم "تثبيت التطبيق"\nعلى iPhone (Safari): زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"', 'info');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsStandalone(true);
      setDeferredPrompt(null);
      showToast('تهانينا! تم تثبيت تطبيق المرافق المنزلي بنجاح.');
    }
  };

  // Guided Diaphragmatic Breathing Exercise State
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('inhale'); // 'inhale' | 'hold' | 'exhale'
  const [breathingTimer, setBreathingTimer] = useState(4);
  const [breathingCycles, setBreathingCycles] = useState(0);
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isBreathingRunning) {
      interval = setInterval(() => {
        setBreathingTimer((prev) => {
          if (prev <= 1) {
            setBreathingPhase((currPhase) => {
              if (currPhase === 'inhale') {
                playChime(660, 0.15);
                return 'hold';
              }
              if (currPhase === 'hold') {
                playChime(520, 0.15);
                return 'exhale';
              }
              if (currPhase === 'exhale') {
                playChime(784, 0.2);
                setBreathingCycles((c) => c + 1);
                return 'inhale';
              }
              return 'inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathingRunning]);

  // Parent Daily Journal State
  const [journalNoteText, setJournalNoteText] = useState('');
  const [journalMood, setJournalMood] = useState('calm'); // 'happy' | 'calm' | 'frustrated' | 'distracted'
  const [journalCategory, setJournalCategory] = useState('behavior'); // 'speech' | 'behavior' | 'focus' | 'sleep'
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  const handleSaveJournalNote = async (e) => {
    e.preventDefault();
    if (!journalNoteText.trim()) return;
    setIsSavingJournal(true);
    try {
      const res = await parentPortalApi.saveJournalNote(token, {
        note: journalNoteText.trim(),
        mood: journalMood,
        category: journalCategory,
      });
      if (res.success) {
        playChime(660, 0.15);
        showToast('تم حفظ الملاحظة وإرسالها لسجل المريض بنجاح!');
        setPortalData((prev) => ({
          ...prev,
          journal_notes: res.notes || [res.note, ...(prev.journal_notes || [])],
        }));
        setJournalNoteText('');
      }
    } catch (err) {
      showToast(err.message || 'فشل حفظ الملاحظة', 'error');
    } finally {
      setIsSavingJournal(false);
    }
  };

  // Calendar Sync Helpers (Google & Apple .ics)
  const handleAddToCalendar = (appt, clinicName, type = 'google') => {
    const timeStr = appt.time || '10:00';
    const start = new Date(`${appt.date}T${timeStr}:00`);
    const end = new Date(start.getTime() + 45 * 60000);

    if (type === 'google') {
      const formatGCal = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
      const title = encodeURIComponent(`${appt.type === 'therapy_session' ? 'جلسة تأهيل سريرية' : 'استشارة سريرية'} - ${clinicName}`);
      const details = encodeURIComponent(`موعد متابعة سريرية لدى ${appt.specialist_name}. يرجى الحضور قبل الموعد بـ 10 دقائق.`);
      const location = encodeURIComponent(clinicName);
      const dates = `${formatGCal(start)}/${formatGCal(end)}`;
      window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`, '_blank');
    } else {
      const formatDate = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PsyPro//Clinic SaaS//AR',
        'BEGIN:VEVENT',
        `SUMMARY:${appt.type === 'therapy_session' ? 'جلسة تأهيل سريرية' : 'استشارة سريرية'} - ${clinicName}`,
        `DESCRIPTION:موعد متابعة سريرية لدى ${appt.specialist_name}`,
        `DTSTART:${formatDate(start)}`,
        `DTEND:${formatDate(end)}`,
        `LOCATION:${clinicName}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RendezVous_${appt.date}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    showToast('تم فتح / تنزيل تذكير التقويم بنجاح!');
  };

  // Fetch portal data
  const fetchPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await parentPortalApi.getAccess(token);
      if (res.success && res.patient) {
        setPortalData(res);
      } else {
        setError(res.message || 'تعذر تحميل بيانات البوابة.');
      }
    } catch (err) {
      console.error('Portal load error:', err);
      setError(err.message || 'رابط البوابة غير صالح أو انتهت صلاحيته.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortal();
    }
  }, [token]);

  // Countdown Timer in Companion Modal
  useEffect(() => {
    if (isTimerRunning && companionTimer > 0) {
      companionIntervalRef.current = setInterval(() => {
        setCompanionTimer((prev) => {
          if (prev <= 1) {
            clearInterval(companionIntervalRef.current);
            setIsTimerRunning(false);
            playCompletionFanfare();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(companionIntervalRef.current);
    }
    return () => clearInterval(companionIntervalRef.current);
  }, [isTimerRunning, companionTimer]);

  // Appointment Confirmation
  const handleConfirmAppointment = async (apptId) => {
    setConfirmingApptId(apptId);
    try {
      const res = await parentPortalApi.confirmAppointment(token, apptId);
      if (res.success) {
        playChime(784, 0.2);
        showToast('تم تأكيد حضور الموعد بنجاح! شكراً لتعاونكم.');
        setPortalData((prev) => ({
          ...prev,
          appointments: prev.appointments.map((a) => 
            a.id === apptId ? { ...a, confirmed_by_patient: true, status: 'confirmed' } : a
          ),
        }));
      }
    } catch (err) {
      showToast(err.message || 'فشل تأكيد الموعد', 'error');
    } finally {
      setConfirmingApptId(null);
    }
  };

  // Launch Companion Mode
  const launchCompanionMode = (hw) => {
    setCompanionHw(hw);
    const targetMins = hw.duration_minutes || 10;
    setInitialTimerMinutes(targetMins);
    setCompanionTimer(targetMins * 60);
    setIsTimerRunning(false);
    setDifficultyRating(hw.difficulty_rating || 'easy');
    setAttentionRating(hw.attention_rating || 'focused');
    setCompanionFeedback(hw.parent_feedback || '');
    setAudioBlob(null);
    setAudioUrl(hw.audio_url || null);
    setIsRecording(false);
    setRecordingDuration(0);
  };

  // Audio Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      playChime(600, 0.08);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Audio recording error:', err);
      showToast('يرجى السماح بصلاحية المايكروفون لتسجيل استجابة الطفل.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      playChime(440, 0.08);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
  };

  // Submit Completed Homework from Companion Modal
  const handleSubmitCompanionHomework = async () => {
    if (!companionHw) return;
    setIsSubmittingHw(true);

    try {
      let payload;
      if (audioBlob) {
        payload = new FormData();
        payload.append('parent_feedback', companionFeedback);
        payload.append('difficulty_rating', difficultyRating);
        payload.append('attention_rating', attentionRating);
        payload.append('duration_minutes', Math.max(1, Math.round(((initialTimerMinutes * 60) - companionTimer) / 60)) || initialTimerMinutes);
        payload.append('audio', audioBlob, `child_voice_${companionHw.id}.webm`);
      } else {
        payload = {
          parent_feedback: companionFeedback,
          difficulty_rating: difficultyRating,
          attention_rating: attentionRating,
          duration_minutes: initialTimerMinutes,
        };
      }

      const res = await parentPortalApi.completeHomework(token, companionHw.id, payload);
      if (res.success) {
        playCompletionFanfare();
        showToast('🌟 عمل رائع! تم حفظ إنجاز التمرين والتسجيل الصوتي وإشعار الأخصائي المعالج.');

        // Update local state
        setPortalData((prev) => ({
          ...prev,
          homework: prev.homework.map((h) => 
            h.id === companionHw.id 
              ? { 
                  ...h, 
                  is_completed: true, 
                  parent_feedback: companionFeedback,
                  difficulty_rating: difficultyRating,
                  attention_rating: attentionRating,
                  audio_url: res.homework?.audio_url || audioUrl,
                  completed_at: 'الآن'
                } 
              : h
          ),
          stats: {
            ...prev.stats,
            completed_homework: (prev.stats.completed_homework || 0) + (companionHw.is_completed ? 0 : 1),
            homework_completion_rate: Math.min(100, Math.round((((prev.stats.completed_homework || 0) + (companionHw.is_completed ? 0 : 1)) / Math.max(1, prev.stats.total_homework || 1)) * 100)),
          },
        }));

        setCompanionHw(null);
      }
    } catch (err) {
      showToast(err.message || 'فشل حفظ التمرين.', 'error');
    } finally {
      setIsSubmittingHw(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center font-sans" dir="rtl">
        <div className="w-14 h-14 rounded-2xl border-4 border-teal-500/20 border-t-teal-500 animate-spin mb-4" />
        <h3 className="text-white text-base font-extrabold mb-1">بوابة المتابعة السريرية للأولياء</h3>
        <p className="text-slate-400 text-xs font-medium animate-pulse">جارٍ تحميل التمارين والمواعيد والحصائل المعتمدة...</p>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans" dir="rtl">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-3xl mb-4 shadow-xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-black text-white mb-2">رابط البوابة غير متاح</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error || 'عذراً، هذا الرابط غير صالح أو انتهت مدة صلاحيته.'}</p>
        <p className="text-xs text-slate-500">يرجى التواصل مع العيادة لتزويدكم برابط الدخول المباشر.</p>
      </div>
    );
  }

  const { patient, clinic, appointments = [], homework = [], bilans = [], guidance_tips = [], stats = {} } = portalData;
  const accentColor = clinic?.report_accent_color || '#0d9488';

  const filteredHomework = homework.filter((h) => {
    if (homeworkFilter === 'pending') return !h.is_completed;
    if (homeworkFilter === 'completed') return h.is_completed;
    return true;
  });

  const isChild = patient.is_child ?? (Boolean(patient.guardian_name) || (patient.age !== undefined && patient.age < 18));
  const clinicPhoneClean = (clinic.phone || '').replace(/[^0-9]/g, '');
  const clinicWhatsAppUrl = clinicPhoneClean 
    ? `https://wa.me/${clinicPhoneClean.startsWith('0') ? '213' + clinicPhoneClean.substring(1) : clinicPhoneClean}?text=${encodeURIComponent(
        isChild 
          ? `السلام عليكم، استفسار بخصوص متابعة الطفل(ة) (${patient.full_name})`
          : `السلام عليكم، استفسار بخصوص المتابعة السريرية للأستاذ(ة) (${patient.full_name})`
      )}`
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans selection:bg-teal-500 selection:text-slate-950" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-black flex items-center gap-2 animate-fade-in backdrop-blur-xl ${
          toastMessage.type === 'error' ? 'bg-red-950/90 text-red-200 border-red-500/50' : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Clinic Branding Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            {clinic.logo_url ? (
              <img src={clinic.logo_url} alt={clinic.name} className="w-10 h-10 rounded-xl object-contain bg-slate-950 p-1 border border-slate-800 shrink-0" />
            ) : (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black text-base shrink-0 shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                {clinic.name?.charAt(0) || '🏥'}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-black text-white truncate">{clinic.name}</h1>
              <p className="text-[11px] text-teal-400 font-bold truncate flex items-center gap-1">
                <span>بوابة المتابعة السريرية للأولياء</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {clinicWhatsAppUrl && (
              <a
                href={clinicWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition border border-emerald-500/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp العيادة</span>
              </a>
            )}

            {clinic.phone && (
              <a
                href={`tel:${clinic.phone}`}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
              >
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">اتصال</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* PWA Companion App Install Banner */}
        {!isStandalone && !dismissInstall && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-teal-900/50 via-slate-900 to-indigo-950/60 border border-teal-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-lg">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="text-right">
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                  <span>تثبيت تطبيق المرافق المنزلي (PsyPro Companion PWA)</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-teal-500/20 text-teal-300 font-mono">سريع وخفيف</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ثبّت التطبيق على شاشة هاتفك لتصل للتمارين والمواعيد بضغطة زر واحدة دون فتح المتصفح.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                type="button"
                onClick={handleInstallApp}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/25 flex items-center gap-1.5 transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تثبيت على الشاشة الآن</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDismissInstall(true);
                  localStorage.setItem('parent_portal_pwa_dismissed', 'true');
                }}
                className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
                title="إخفاء التنبيه"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Child Hero Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تطبيق المتابعة المنزلية والواجبات</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBreathingModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition"
                >
                  <Heart className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>تمرين الاسترخاء والتنفس 4-4-4</span>
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isChild ? 'مرحباً بولي أمر الطفل(ة): ' : 'مرحباً بالأستاذ(ة): '}
                <span className="text-teal-400">{patient.full_name}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-medium">
                {patient.age_formatted && <span>العمر: <strong className="text-slate-200">{patient.age_formatted}</strong></span>}
                {patient.guardian_name && <span>الولي المسجل: <strong className="text-slate-200">{patient.guardian_name}</strong></span>}
                {patient.phone && <span>الهاتف: <strong className="text-slate-200">{patient.phone}</strong></span>}
              </div>
            </div>

            {/* Attendance & Completion Mini Badges */}
            <div className="flex items-center gap-2.5">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center min-w-[95px] shadow-inner">
                <div className="text-lg font-black text-teal-400 font-mono">{stats.attendance_rate || 100}%</div>
                <div className="text-[10px] text-slate-400 font-bold mt-0.5">حضور الجلسات</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center min-w-[95px] shadow-inner">
                <div className="text-lg font-black text-emerald-400 font-mono">{stats.completed_homework || 0}/{stats.total_homework || 0}</div>
                <div className="text-[10px] text-slate-400 font-bold mt-0.5">تمارين منجزة</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center min-w-[95px] shadow-inner">
                <div className="text-lg font-black text-amber-400 font-mono flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{stats.streak_days || stats.completed_homework || 1}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold mt-0.5">سلسلة الالتزام</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-extrabold shadow-lg overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('homework')}
            className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'homework' ? 'bg-teal-600 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>التمارين ({homework.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'appointments' ? 'bg-teal-600 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>المواعيد ({appointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'journal' ? 'bg-teal-600 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>دفتر الملاحظات ({portalData?.journal_notes?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('bilans')}
            className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'bilans' ? 'bg-teal-600 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>الحصائل ({bilans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('guidance')}
            className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'guidance' ? 'bg-teal-600 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>إرشاد الولي</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'progress' ? 'bg-teal-600 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>التقدم والالتزام</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: HOMEWORK HUB (Interactive Companion & Worksheets)                  */}
        {/* ========================================================================= */}
        {activeTab === 'homework' && (
          <div className="space-y-4">
            {/* Action Bar: Filters & Print Workbook Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setHomeworkFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    homeworkFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  الكل ({homework.length})
                </button>
                <button
                  onClick={() => setHomeworkFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    homeworkFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  قيد الإنجاز ({homework.filter((h) => !h.is_completed).length})
                </button>
                <button
                  onClick={() => setHomeworkFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    homeworkFilter === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  المنجزة ({homework.filter((h) => h.is_completed).length})
                </button>
              </div>

              {/* Printable Workbook A4 Button */}
              <button
                type="button"
                onClick={() => setShowPrintWorkbook(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-black flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة كراس التمارين الأسبوعي (A4 Cahier)</span>
              </button>
            </div>

            {filteredHomework.length === 0 ? (
              <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 space-y-2">
                <BookOpen className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm font-bold text-slate-300">لا توجد تمارين تطابق التصفية الحالية.</p>
                <p className="text-xs text-slate-500">سيقوم الأخصائي المعالج بإضافة تمارين جديدة فور انتهاء الجلسة.</p>
              </div>
            ) : (
              filteredHomework.map((hw) => {
                const isCompleted = hw.is_completed;
                return (
                  <div
                    key={hw.id}
                    className={`p-5 rounded-3xl border shadow-xl space-y-4 transition ${
                      isCompleted ? 'bg-slate-900/40 border-emerald-500/30' : 'bg-slate-900/90 border-slate-800 hover:border-teal-500/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-teal-500/10 text-teal-300 border border-teal-500/20">
                            {hw.category === 'articulation' ? 'نطق ومخارج حروف' : hw.category === 'langage_expressif' ? 'لغة وتعبير' : hw.category === 'attention' ? 'تركيز وانتباه' : 'تأهيل وتدريب'}
                          </span>

                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{hw.duration_minutes || 10} دقائق يومياً</span>
                          </span>

                          {hw.due_date_formatted && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              • موعد الإنجاز: {hw.due_date_formatted}
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-black text-white">{hw.title}</h4>
                      </div>

                      {isCompleted ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تم الإنجاز ✓</span>
                          </span>
                        </div>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          قيد المتابعة المنزلية
                        </span>
                      )}
                    </div>

                    {/* Instructions Box */}
                    {hw.instructions && (
                      <div className="text-xs text-slate-300 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 leading-relaxed">
                        <strong className="text-teal-400 block mb-1">📝 توجيهات الأخصائي للولي:</strong>
                        {hw.instructions}
                      </div>
                    )}

                    {/* Completed Details: Audio Sample & Ratings */}
                    {isCompleted && (
                      <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2 text-xs">
                        <div className="flex flex-wrap items-center gap-3">
                          {hw.difficulty_rating && (
                            <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-teal-300 text-[11px] font-bold">
                              مستوى الصعوبة: {hw.difficulty_rating === 'easy' ? 'سهل ومتقن 🌟' : hw.difficulty_rating === 'moderate' ? 'متوسط بمساعدة 👍' : 'صعب وبحاجة لمراجعة ⚡'}
                            </span>
                          )}
                          {hw.attention_rating && (
                            <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 text-[11px] font-bold">
                              التركيز: {hw.attention_rating === 'focused' ? 'تركيز عالي 🎯' : hw.attention_rating === 'moderate' ? 'تشتت خفيف 🔄' : 'صعوبة في الثبات ⚠️'}
                            </span>
                          )}
                          {hw.completed_at && (
                            <span className="text-[10px] text-slate-400 font-mono mr-auto">
                              تم الإنجاز: {hw.completed_at}
                            </span>
                          )}
                        </div>

                        {hw.parent_feedback && (
                          <p className="text-slate-300 pt-1 text-[11px]">
                            💬 <strong>ملاحظات الولي:</strong> {hw.parent_feedback}
                          </p>
                        )}

                        {hw.audio_url && (
                          <div className="pt-2">
                            <span className="text-[11px] text-teal-400 font-bold block mb-1">تسجيل استجابة الطفل المرفق للأخصائي:</span>
                            <audio controls src={hw.audio_url} className="w-full h-8 rounded-lg" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Launch Companion Mode Button */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => launchCompanionMode(hw)}
                        className={`px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg transition flex items-center gap-2 ${
                          isCompleted 
                            ? 'bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700' 
                            : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-teal-500/25'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isCompleted ? 'إعادة ممارسة التمرين (Companion Mode)' : '🚀 بدء تمرين اليوم مع الطفل (Companion Mode)'}</span>
                      </button>

                      {hw.attachment_url && (
                        <a
                          href={hw.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-teal-300 flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تحميل بطاقة التمرين المرفقة</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: APPOINTMENTS & CONFIRMATION                                       */}
        {/* ========================================================================= */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-300 flex items-center justify-between">
              <span>📅 جدول الجلسات والمواعيد السريرية:</span>
              <span className="text-xs text-slate-500 font-normal">يرجى تأكيد الحضور بنقرة واحدة لتأكيد الحجز</span>
            </h3>

            {appointments.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-bold">لا توجد مواعيد مجدولة حالياً.</p>
              </div>
            ) : (
              appointments.map((app) => {
                const isConfirmed = app.confirmed_by_patient || app.status === 'confirmed';
                return (
                  <div
                    key={app.id}
                    className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {app.type === 'therapy_session' ? 'جلسة تأهيل وعلاج' : 'استشارة / تقييم'}
                        </span>
                        {isConfirmed && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>مؤكد الحضور</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-black text-white flex items-center gap-2">
                        <span>{app.date_formatted || app.date}</span>
                        {app.time && <span className="font-mono text-teal-400 font-bold text-sm">({app.time})</span>}
                      </h4>

                      <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                        <span>مع الأخصائي: {app.specialist_name}</span>
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      {isConfirmed ? (
                        <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>تم تأكيد الحضور بنجاح</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfirmAppointment(app.id)}
                          disabled={confirmingApptId === app.id}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>{confirmingApptId === app.id ? 'جارٍ التأكيد...' : '✅ تأكيد الحضور بنقرة واحدة'}</span>
                        </button>
                      )}

                      {/* Calendar Sync Buttons */}
                      <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleAddToCalendar(app, clinic.name, 'google')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-bold transition flex items-center gap-1"
                          title="إضافة وتعيين تذكير في Google Calendar"
                        >
                          <Calendar className="w-3 h-3 text-teal-400" />
                          <span>Google Calendar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddToCalendar(app, clinic.name, 'ics')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold transition flex items-center gap-1"
                          title="تنزيل ملف .ics لـ Apple Calendar و Outlook"
                        >
                          <Download className="w-3 h-3 text-slate-400" />
                          <span>Apple / ics</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PARENT-CLINICIAN SHARED JOURNAL (دفتر الملاحظات السلوكية)          */}
        {/* ========================================================================= */}
        {activeTab === 'journal' && (
          <div className="space-y-5">
            {/* Journal Note Creation Card */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">دفتر الملاحظات السريرية المشترك</h3>
                    <p className="text-[11px] text-slate-400">شارِك الأخصائي بأي ملاحظة سلوكية، لغوية، أو تطور ملحوظ في المنزل</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  يصل للمعالج في الجلسة
                </span>
              </div>

              <form onSubmit={handleSaveJournalNote} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">مجال الملاحظة:</label>
                    <select
                      value={journalCategory}
                      onChange={(e) => setJournalCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      <option value="speech">🗣️ النطق والتخاطب والكلام</option>
                      <option value="behavior">🧸 السلوك والانفعال والتفاعل</option>
                      <option value="focus">🎯 التركيز والانتباه والدراسة</option>
                      <option value="sleep">🌙 النوم والروتين والاسترخاء</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">حالة الطفل المزاجية اليوم:</label>
                    <select
                      value={journalMood}
                      onChange={(e) => setJournalMood(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      <option value="happy">😄 سعيد ومتحمس ومتجاوب</option>
                      <option value="calm">😌 هادئ ومستقر</option>
                      <option value="frustrated">😤 متوتر أو قلق أو مقاوم</option>
                      <option value="distracted">🌀 مشتت أو مرهق</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">نص الملاحظة أو التطور المنزلي:</label>
                  <textarea
                    rows={3}
                    value={journalNoteText}
                    onChange={(e) => setJournalNoteText(e.target.value)}
                    placeholder="مثال: لاحظت اليوم نطق صوت /ر/ بشكل صحيح أثناء قراءة القصة، أو استجاب للتعليمات بدون تشتت لمدة 15 دقيقة..."
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingJournal || !journalNoteText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSavingJournal ? 'جارٍ الحفظ...' : 'حفظ الملاحظة وإرسالها للمعالج'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Past Journal Notes Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400">سجل الملاحظات السابقة ({portalData.journal_notes?.length || 0}):</h4>
              {(!portalData.journal_notes || portalData.journal_notes.length === 0) ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                  لم يتم تدوين أي ملاحظات حتى الآن. دوّن ملاحظتك الأولى ليراها الأخصائي في الجلسة القادمة.
                </div>
              ) : (
                portalData.journal_notes.map((n, idx) => (
                  <div key={n.id || idx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 font-bold">
                        {n.category === 'speech' ? '🗣️ نطق وتخاطب' : n.category === 'focus' ? '🎯 تركيز وانتباه' : n.category === 'sleep' ? '🌙 نوم وروتين' : '🧸 سلوك وتفاعل'}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">{n.created_date || n.created_at}</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{n.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: APPROVED CLINICAL BILANS & MEDICAL REPORTS                         */}
        {/* ========================================================================= */}
        {activeTab === 'bilans' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-300">
                📄 الحصائل والتقارير الطبية المعتمدة (Bilans Cliniques):
              </h3>
              <span className="text-xs text-slate-500">تقارير رسمية موقعة ومختومة من العيادة</span>
            </div>

            {bilans.length === 0 ? (
              <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 space-y-2">
                <FileText className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm font-bold text-slate-300">لا توجد حصائل طبية معتمدة منشورة حالياً.</p>
                <p className="text-xs text-slate-500">يقوم الأخصائي بنشر التقرير الطبي بعد الانتهاء من التقييم الشامل.</p>
              </div>
            ) : (
              bilans.map((bilan) => {
                return (
                  <div
                    key={bilan.id}
                    className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-500/30 transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {bilan.bilan_type === 'bilan_initial' ? 'حصيلة أولية شاملة' : bilan.bilan_type === 'bilan_evolution' ? 'حصيلة تطورية ومتابعة' : 'تقرير طبي سريري'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>معتمد رسمياً ✓</span>
                        </span>
                      </div>

                      <h4 className="text-base font-black text-white">{bilan.title}</h4>
                      {bilan.date_formatted && (
                        <p className="text-xs text-slate-400 font-mono">
                          تاريخ الإصدار: {bilan.date_formatted}
                        </p>
                      )}
                    </div>

                    <a
                      href={bilan.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل التقرير الرسمي (PDF)</span>
                    </a>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PARENT GUIDANCE & PSYCHOEDUCATION (Guidance Parentale)              */}
        {/* ========================================================================= */}
        {activeTab === 'guidance' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-teal-500/10 border border-teal-500/20 flex items-center gap-3">
              <Heart className="w-6 h-6 text-teal-400 shrink-0" />
              <div>
                <h4 className="text-xs font-black text-white">دليل التوجيه الأسري والتربية السريرية</h4>
                <p className="text-[11px] text-teal-200">
                  إرشادات وتوصيات قائمة على الأدلة السريرية لمساعدة الأولياء على دعم أطفالهم في المنزل.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guidance_tips.map((card) => (
                <div key={card.id} className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/10 text-teal-300 border border-teal-500/20">
                      {card.badge}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white">{card.title}</h4>

                  <ul className="space-y-2 text-xs text-slate-300">
                    {card.tips?.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PROGRESSION & ATTENDANCE ANALYTICS                                  */}
        {/* ========================================================================= */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                <span>مؤشرات الالتزام والتطور السريري</span>
              </h3>

              {/* Attendance Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">نسبة حضور الجلسات المجدولة في العيادة</span>
                  <span className="text-teal-400 font-mono font-black">{stats.attendance_rate || 100}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-500"
                    style={{ width: `${stats.attendance_rate || 100}%` }}
                  />
                </div>
              </div>

              {/* Homework Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">نسبة إنجاز الأنشطة والتمارين المنزلية</span>
                  <span className="text-emerald-400 font-mono font-black">{stats.homework_completion_rate || 0}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                    style={{ width: `${stats.homework_completion_rate || 0}%` }}
                  />
                </div>
              </div>

              {/* Motivational Banner */}
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200 leading-relaxed flex items-start gap-3">
                <Award className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-black text-white mb-1">أثر الالتزام المنزلي المشترك:</strong>
                  إن مواظبتكم على التمارين المنزلية اليومية يضاعف من استجابة الطفل ويثبت المهارات المكتسبة في الجلسات السريرية بشكل أسرع وأكثر استدامة.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: INTERACTIVE PRACTICE COMPANION (رفيق التمرين التفاعلي)            */}
      {/* ========================================================================= */}
      {companionHw && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto font-sans" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl my-8 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">رفيق التمرين المنزلي التفاعلي</h3>
                  <p className="text-[11px] text-teal-400 font-bold">{companionHw.title}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCompanionHw(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            {/* Exercise Instructions for the Parent */}
            {companionHw.instructions && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <strong className="text-teal-400 block mb-1">📝 ماذا تفعل مع الطفل الآن:</strong>
                {companionHw.instructions}
              </div>
            )}

            {/* COUNTDOWN TIMER SECTION */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>⏱️ ميقاتية التدريب اليومي المركّز:</span>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 15].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setInitialTimerMinutes(m);
                        setCompanionTimer(m * 60);
                        setIsTimerRunning(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition ${
                        initialTimerMinutes === m ? 'bg-teal-600 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m} د
                    </button>
                  ))}
                </div>
              </div>

              {/* Large Digital Clock */}
              <div className="py-2">
                <div className="text-5xl font-black font-mono tracking-wider text-teal-400 drop-shadow-md">
                  {formatSeconds(companionTimer)}
                </div>
                <div className="text-[11px] text-slate-500 font-bold mt-1">
                  {isTimerRunning ? 'التمرين جارٍ الآن... حافظ على تشجيع الطفل 🌟' : companionTimer === 0 ? 'انتهى وقت التمرين المحدد! رائع جداً 👏' : 'اضغط على زر البدء لبدء التدريب'}
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`px-6 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg transition ${
                    isTimerRunning ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-teal-600 hover:bg-teal-500 text-slate-950 shadow-teal-500/30'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isTimerRunning ? 'إيقاف مؤقت' : 'بدء الميقاتية'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setCompanionTimer(initialTimerMinutes * 60);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط</span>
                </button>
              </div>
            </div>

            {/* CHILD VOICE AUDIO RECORDER */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isRecording ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-teal-500/20 text-teal-400'}`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">تسجيل صوت ونطق الطفل (اختياري)</h4>
                    <p className="text-[10px] text-slate-400">سجل استجابة الطفل ليتمكن الأخصائي من الاستماع إليها وتقييم التقدم</p>
                  </div>
                </div>

                {isRecording && (
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-xs font-bold animate-pulse">
                    جارٍ التسجيل: {formatSeconds(recordingDuration)}
                  </span>
                )}
              </div>

              {!isRecording && !audioUrl && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-teal-300 font-bold text-xs border border-slate-800 flex items-center justify-center gap-2 transition"
                >
                  <Mic className="w-4 h-4 text-teal-400" />
                  <span>اضغط هنا لتسجيل صوت الطفل عبر المايكروفون 🎙️</span>
                </button>
              )}

              {isRecording && (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition"
                >
                  <MicOff className="w-4 h-4" />
                  <span>إيقاف وحفظ التسجيل الصوتي ⏹️</span>
                </button>
              )}

              {audioUrl && !isRecording && (
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تم تسجيل المقطع الصوتي بنجاح</span>
                    </span>

                    <button
                      type="button"
                      onClick={deleteRecording}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                    >
                      حذف وإعادة التسجيل
                    </button>
                  </div>

                  <audio controls src={audioUrl} className="w-full h-8 rounded-lg" />
                </div>
              )}
            </div>

            {/* RATINGS: DIFFICULTY & ATTENTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Difficulty Level */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-[11px] font-bold text-slate-300 block">مدى سهولة أو صعوبة التمرين على الطفل:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'easy', label: 'سهل ومتقن', icon: '🌟' },
                    { id: 'moderate', label: 'متوسط بمساعدة', icon: '👍' },
                    { id: 'hard', label: 'صعب ومعقد', icon: '⚡' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setDifficultyRating(lvl.id)}
                      className={`p-2 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 transition ${
                        difficultyRating === lvl.id ? 'bg-teal-600 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{lvl.icon}</span>
                      <span>{lvl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Child Engagement & Attention */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-[11px] font-bold text-slate-300 block">انتباه الطفل واستقراره أثناء التمرين:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'focused', label: 'تركيز عالي', icon: '🎯' },
                    { id: 'moderate', label: 'تشتت خفيف', icon: '🔄' },
                    { id: 'distracted', label: 'صعوبة استقرار', icon: '⚠️' },
                  ].map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => setAttentionRating(att.id)}
                      className={`p-2 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 transition ${
                        attentionRating === att.id ? 'bg-indigo-600 text-white font-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{att.icon}</span>
                      <span>{att.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PARENT OBSERVATION NOTES */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">ملاحظاتكم للأخصائي بعد تطبيق التمرين:</label>
              <textarea
                rows={2}
                value={companionFeedback}
                onChange={(e) => setCompanionFeedback(e.target.value)}
                placeholder="اكتب ملاحظاتك (مثل: واجه صعوبة في نطق صوت معين، كان متحمساً، استجاب بسرعة)..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 leading-relaxed"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCompanionHw(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                إلغاء والعودة
              </button>

              <button
                type="button"
                disabled={isSubmittingHw}
                onClick={handleSubmitCompanionHomework}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50"
              >
                {isSubmittingHw ? (
                  <span>جارٍ حفظ وإرسال البيانات...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ وتأكيد إنجاز التمرين للأخصائي ✓</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINTABLE WEEKLY WORKBOOK (A4 CAHIER D'EXERCICES)                 */}
      {/* ========================================================================= */}
      {showPrintWorkbook && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto font-sans" dir="rtl">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl my-8 print:p-0 print:m-0 print:border-none print:shadow-none">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-slate-900">معاينة كراس التمارين المنزلية للطباعة</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الآن (Print A4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintWorkbook(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* Printable A4 Sheet Body */}
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{clinic.name}</h2>
                  <p className="text-xs text-slate-600">{clinic.name_fr || 'Cabinet Médical & Rééducation'}</p>
                  {clinic.phone && <p className="text-xs text-slate-600 font-mono">الهاتف: {clinic.phone}</p>}
                </div>
                <div className="text-left">
                  <div className="text-xs font-black px-3 py-1 bg-slate-100 rounded-lg inline-block border">
                    دفتر المتابعة والواجبات المنزلية
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    التاريخ: {new Date().toLocaleDateString('ar-DZ')}
                  </p>
                </div>
              </div>

              {/* Patient Banner */}
              <div className="bg-slate-50 p-4 rounded-xl border flex justify-between text-xs font-bold">
                <div>
                  <span>{isChild ? 'اسم الطفل(ة): ' : 'اسم المعني(ة) / المراجع: '}</span>
                  <strong className="text-sm font-black text-slate-900">{patient.full_name}</strong>
                </div>
                <div>
                  <span>العمر: </span>
                  <strong className="font-mono text-slate-900">{patient.age_formatted || '—'}</strong>
                </div>
                <div>
                  <span>{isChild ? 'الولي: ' : 'الهاتف: '}</span>
                  <strong className="text-slate-900">{isChild ? (patient.guardian_name || '—') : (patient.phone || '—')}</strong>
                </div>
              </div>

              {/* Table of Exercises */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900">جدول التمارين المنزلية المعتمدة للأسبوع:</h4>
                <table className="w-full border-collapse border border-slate-300 text-right text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-black">
                      <th className="border border-slate-300 p-2 w-12 text-center">#</th>
                      <th className="border border-slate-300 p-2">التمرين والتوجيه السريري</th>
                      <th className="border border-slate-300 p-2 w-28 text-center">التدريب اليومي</th>
                      <th className="border border-slate-300 p-2 w-36 text-center">أيام الأسبوع (✓)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homework.map((hw, idx) => (
                      <tr key={hw.id} className="align-top">
                        <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-300 p-2">
                          <strong className="block text-slate-900 mb-1">{hw.title}</strong>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{hw.instructions || 'تطبيق التمرين حسب إرشادات الأخصائي'}</p>
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono text-[11px]">
                          {hw.duration_minutes || 10} دقيقة
                        </td>
                        <td className="border border-slate-300 p-2">
                          <div className="grid grid-cols-7 gap-1 text-[9px] text-center font-bold text-slate-500">
                            <div>سبت<div className="w-4 h-4 border mx-auto mt-0.5 rounded" /></div>
                            <div>أحد<div className="w-4 h-4 border mx-auto mt-0.5 rounded" /></div>
                            <div>إثن<div className="w-4 h-4 border mx-auto mt-0.5 rounded" /></div>
                            <div>ثلا<div className="w-4 h-4 border mx-auto mt-0.5 rounded" /></div>
                            <div>أرب<div className="w-4 h-4 border mx-auto mt-0.5 rounded" /></div>
                            <div>خمي<div className="w-4 h-4 border mx-auto mt-0.5 rounded" /></div>
                            <div>جمع<div className="w-4 h-4 border mx-auto mt-0.5 rounded" /></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes & Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs">
                <div className="space-y-8">
                  <span className="font-bold text-slate-700 block">ملاحظات ولي الأمر للأخصائي:</span>
                  <div className="border-b border-dashed border-slate-400" />
                  <div className="border-b border-dashed border-slate-400" />
                </div>
                <div className="text-left space-y-12">
                  <span className="font-bold text-slate-700 block">ختم وتوقيع الأخصائي المعالج:</span>
                  <div className="text-slate-400 text-[11px] italic">PsyPro Clinical Companion Hub</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GUIDED DIAPHRAGMATIC BREATHING (التنفس البطني والاسترخاء 4-4-4)   */}
      {/* ========================================================================= */}
      {showBreathingModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto font-sans" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl text-center relative my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-teal-400 animate-pulse" />
                <h3 className="text-sm font-black text-white">تمرين التنفس البطني والاسترخاء الموجه</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBreathingModal(false);
                  setIsBreathingRunning(false);
                }}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              يساعد هذا البروتوكول السريري المهدئ على استرخاء الحجاب الحاجز، تنظيم الإيقاع الصوتي، والحد من التشتت والتوتر قبل بدء التمارين.
            </p>

            {/* Visual Expanding Circle */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <div
                  className={`w-36 h-36 rounded-full transition-all duration-1000 flex items-center justify-center shadow-2xl ${
                    breathingPhase === 'inhale'
                      ? 'scale-125 bg-teal-500/25 border-2 border-teal-400 shadow-teal-500/30'
                      : breathingPhase === 'hold'
                      ? 'scale-125 bg-emerald-500/25 border-2 border-emerald-400 shadow-emerald-500/30'
                      : 'scale-90 bg-indigo-500/20 border-2 border-indigo-400 shadow-indigo-500/20'
                  }`}
                >
                  <div className="text-center space-y-1">
                    <span className="text-xs font-bold text-slate-300 block">
                      {breathingPhase === 'inhale' ? '🌬️ شهيق عميق' : breathingPhase === 'hold' ? '⏳ احبس النفس' : '💨 زفير بطيء'}
                    </span>
                    <span className="text-3xl font-black font-mono text-white block">{breathingTimer}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-400 font-mono">
                الدورات المكتملة: <span className="font-bold text-teal-400">{breathingCycles}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsBreathingRunning(!isBreathingRunning)}
                className={`px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition flex items-center gap-2 ${
                  isBreathingRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                    : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
                }`}
              >
                {isBreathingRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isBreathingRunning ? 'إيقاف مؤقت' : 'بدء تمرين التنفس'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsBreathingRunning(false);
                  setBreathingPhase('inhale');
                  setBreathingTimer(4);
                  setBreathingCycles(0);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
