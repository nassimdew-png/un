import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Activity,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  Mic,
  MessageSquare,
  Sparkles,
  Award,
  Flame,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Smartphone,
  ExternalLink,
  Share2,
  FileText,
  Smile,
  Frown,
  Meh,
  ShieldCheck,
  Star,
  Download,
  Info
} from 'lucide-react';
import { homeCareApi, parentHomeCareApi } from '../../api';

export default function PatientHomeCareTrackerTab({
  patient,
  tenant,
  onOpenAssignModal,
  onOpenPortalModal,
  onInjectIntoSoap,
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [subTab, setSubTab] = useState('homework'); // 'homework' | 'audio' | 'journal'
  const [togglingHwId, setTogglingHwId] = useState(null);
  const [deletingHwId, setDeletingHwId] = useState(null);
  const [acknowledgingNoteId, setAcknowledgingNoteId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (patient?.id) {
      loadOverview();
    }
  }, [patient?.id]);

  const loadOverview = async () => {
    if (!patient?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await homeCareApi.getOverview(patient.id);
      if (res?.success) {
        setData(res);
      } else {
        setError(res?.message || 'تعذر تحميل بيانات المتابعة المنزلية.');
      }
    } catch (err) {
      console.error('Error loading patient home care overview:', err);
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleHomework = async (hwId) => {
    if (!patient?.id) return;
    setTogglingHwId(hwId);
    try {
      const res = await homeCareApi.toggleHomework(patient.id, hwId);
      if (res?.success) {
        showToast(res.message || 'تم تحديث حالة النشاط.');
        loadOverview();
      }
    } catch (err) {
      console.error('Toggle error:', err);
      alert(err.message || 'تعذر تحديث حالة النشاط');
    } finally {
      setTogglingHwId(null);
    }
  };

  const handleDeleteHomework = async (hwId) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا التكليف المنزلي؟')) return;
    setDeletingHwId(hwId);
    try {
      const res = await homeCareApi.deleteHomework(patient.id, hwId);
      if (res?.success) {
        showToast('تم حذف النشاط بنجاح.');
        loadOverview();
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.message || 'تعذر حذف النشاط');
    } finally {
      setDeletingHwId(null);
    }
  };

  const handleAcknowledgeNote = async (noteId) => {
    if (!patient?.id) return;
    setAcknowledgingNoteId(noteId);
    try {
      const res = await parentHomeCareApi.acknowledgeNote(patient.id, noteId);
      if (res?.success) {
        showToast('تم تأكيد معاينة ملاحظة الولي بنجاح.');
        loadOverview();
      }
    } catch (err) {
      console.error('Acknowledge note error:', err);
    } finally {
      setAcknowledgingNoteId(null);
    }
  };

  if (!patient?.id) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        يرجى تحديد مريض لعرض سجل المتابعة وتفاعل الأولياء.
      </div>
    );
  }

  const stats = data?.stats || {
    total_homework: 0,
    completed_homework: 0,
    pending_homework: 0,
    compliance_rate: 100,
    streak_days: 0,
    total_audio_samples: 0,
    total_journal_notes: 0,
  };

  const homeworkList = data?.homework || [];
  const audioSamples = data?.audio_samples || [];
  const journalNotes = data?.journal_notes || [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast Notifier */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 space-x-reverse animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  رادار المتابعة المنزلية وتفاعل الأولياء (Parent Compliance & Tele-Care)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  بوابة المريض المباشرة 🏡
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة إنجاز التمارين الأسبوعية، التسجيلات الصوتية لنطق الطفل، ويوميات الولي السلوكية
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadOverview}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-xs"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            </button>

            {onOpenPortalModal && (
              <button
                type="button"
                onClick={onOpenPortalModal}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all"
                title="إرسال رابط البوابة ورمز PIN للولي"
              >
                <Smartphone className="w-4 h-4" />
                <span>رابط البوابة ورمز PIN 📱</span>
              </button>
            )}

            {onOpenAssignModal && (
              <button
                type="button"
                onClick={onOpenAssignModal}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center space-x-1.5 space-x-reverse shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ تكليف تمرين منزلي جديد (WhatsApp)</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 KPIs Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* 1. Compliance Rate */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-bold">مؤشر الالتزام المنزلي</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black font-mono ${
                stats.compliance_rate >= 70 ? 'text-emerald-300' : stats.compliance_rate >= 40 ? 'text-amber-300' : 'text-rose-400'
              }`}>
                {stats.compliance_rate}%
              </span>
              <span className="text-[10px] text-slate-500">
                ({stats.completed_homework} من {stats.total_homework})
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stats.compliance_rate >= 70 ? 'bg-emerald-500' : stats.compliance_rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, stats.compliance_rate))}%` }}
              />
            </div>
          </div>

          {/* 2. Streak Days */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-bold">سلسلة المواظبة</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-amber-300">
                {stats.streak_days}
              </span>
              <span className="text-[11px] text-amber-400 font-bold">أيام متتالية 🔥</span>
            </div>
            <span className="text-[10px] text-slate-500 block">
              {stats.streak_days >= 5 ? '🏆 مستوى بطل التأهيل' : stats.streak_days >= 3 ? '🥈 وسام المثابرة' : '🌱 بداية واعدة'}
            </span>
          </div>

          {/* 3. Audio Pronunciation Samples */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-bold">التسجيلات الصوتية</span>
              <Mic className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-rose-300">
                {stats.total_audio_samples}
              </span>
              <span className="text-[10px] text-slate-500">تسجيلات نطق 🎙️</span>
            </div>
            <span className="text-[10px] text-slate-500 block">من التمارين المنزلية</span>
          </div>

          {/* 4. Parent Daily Notes */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-bold">يوميات وملاحظات الولي</span>
              <MessageSquare className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-indigo-300">
                {stats.total_journal_notes}
              </span>
              <span className="text-[10px] text-slate-500">ملاحظات مسجلة</span>
            </div>
            <span className="text-[10px] text-slate-500 block">تغيرات سلوكية ونطقية</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
        <button
          type="button"
          onClick={() => setSubTab('homework')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
            subTab === 'homework'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>الواجبات والتكليفات المنزلية ({homeworkList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('audio')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
            subTab === 'audio'
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>أرشيف التسجيلات الصوتية المنزلية ({audioSamples.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('journal')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
            subTab === 'journal'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>سجل يوميات وملاحظات الولي ({journalNotes.length})</span>
        </button>
      </div>

      {/* SubTab 1: Homework Assignments List */}
      {subTab === 'homework' && (
        <div className="space-y-4 animate-in fade-in">
          {homeworkList.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-950/60 border border-slate-800 text-slate-400 space-y-3">
              <HeartHandshake className="w-12 h-12 text-emerald-400 mx-auto opacity-60" />
              <h4 className="text-sm font-bold text-white">لا توجد واجبات منزلية مكلّفة لهذا المريض حالياً</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                يمكنك تكليف الأسرة بتمارين مخارج الحروف، التمييز السمعي، أو سجلات CBT اليومية بضغطة زر.
              </p>
              {onOpenAssignModal && (
                <button
                  type="button"
                  onClick={onOpenAssignModal}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center space-x-1.5 space-x-reverse"
                >
                  <Plus className="w-4 h-4" />
                  <span>تكليف أول نشاط منزلي الآن</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {homeworkList.map((hw) => (
                <div
                  key={hw.id}
                  className={`p-5 rounded-3xl border transition-all space-y-3.5 flex flex-col justify-between ${
                    hw.is_completed
                      ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                      : 'bg-slate-950 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Badge Header */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        hw.is_completed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {hw.is_completed ? '✓ تم الإنجاز في المنزل' : '⏳ قيد التدريب المنزلي'}
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{hw.duration_minutes} د/يوم</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-black text-white leading-snug">
                      {hw.title}
                    </h4>

                    {/* Therapist Instructions */}
                    <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">إرشادات المختص:</span>
                      <p className="line-clamp-3">{hw.instructions}</p>
                    </div>

                    {/* Completion Feedback from Parent */}
                    {hw.is_completed && (
                      <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تقييم الولي: {hw.completed_at || 'تم بنجاح'}</span>
                          </span>

                          <div className="flex items-center gap-2">
                            {hw.difficulty_rating && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 text-[10px]">
                                الصعوبة: {hw.difficulty_rating === 'easy' ? 'سهل 😊' : hw.difficulty_rating === 'hard' ? 'صعب 😓' : 'متوسط 😐'}
                              </span>
                            )}
                            {hw.attention_rating && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 text-[10px]">
                                الانتباه: {hw.attention_rating === 'focused' ? 'مركّز 🎯' : hw.attention_rating === 'distracted' ? 'مشتت 🌀' : 'متوسط ⚡'}
                              </span>
                            )}
                          </div>
                        </div>

                        {hw.parent_feedback && (
                          <p className="text-slate-200 text-xs italic bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                            "{hw.parent_feedback}"
                          </p>
                        )}

                        {/* Direct Audio Player if uploaded with homework */}
                        {hw.audio_url && (
                          <div className="pt-1">
                            <span className="text-[10px] text-emerald-300 font-bold block mb-1">
                              تسجيل صوتي مرفق من تدريب اليوم:
                            </span>
                            <audio controls src={hw.audio_url} className="w-full h-8 rounded-xl" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-500 font-mono">
                      📅 الاستحقاق: {hw.due_date_formatted || hw.due_date || '--'}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleHomework(hw.id)}
                        disabled={togglingHwId === hw.id}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-1 space-x-reverse transition-all ${
                          hw.is_completed
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{hw.is_completed ? 'إعادة فتح' : 'تعليم كمكتمل'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteHomework(hw.id)}
                        disabled={deletingHwId === hw.id}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-800 transition-all text-xs"
                        title="حذف النشاط"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab 2: Audio Samples Archive */}
      {subTab === 'audio' && (
        <div className="space-y-4 animate-in fade-in">
          {audioSamples.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-950/60 border border-slate-800 text-slate-400 space-y-2">
              <Mic className="w-12 h-12 text-rose-400 mx-auto opacity-60" />
              <h4 className="text-sm font-bold text-white">لا توجد تسجيلات صوتية مرفوعة بعد</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                عند قيام الولي بتسجيل نطق الطفل من خلال بوابة المريض، ستظهر جميع التسجيلات الصوتية هنا للاستماع والمقارنة.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {audioSamples.map((sample) => (
                <div key={sample.id} className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white truncate max-w-[200px]">
                          {sample.file_name || 'تسجيل صوتي من الولي'}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {sample.uploaded_at_human || sample.uploaded_at?.split('T')[0]} &bull; {sample.file_size_kb || 1} KB
                        </span>
                      </div>
                    </div>

                    <a
                      href={sample.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition-all"
                      title="تحميل الملف الصوتي"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {sample.notes && (
                    <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                      📝 {sample.notes}
                    </p>
                  )}

                  <audio controls src={sample.url} className="w-full h-9 rounded-xl" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab 3: Parent Journal & Meltdown Log */}
      {subTab === 'journal' && (
        <div className="space-y-4 animate-in fade-in">
          {journalNotes.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-950/60 border border-slate-800 text-slate-400 space-y-2">
              <MessageSquare className="w-12 h-12 text-indigo-400 mx-auto opacity-60" />
              <h4 className="text-sm font-bold text-white">لا توجد ملاحظات يومية مسجلة من الولي بعد</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                يمكن لولي الأمر تدوين الكلمات الجديدة، السلوكيات الملاحظة، أو الصعوبات عبر بوابة المريض اليومية.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {journalNotes.map((note, idx) => (
                <div
                  key={note.id || idx}
                  className={`p-4 rounded-2xl border transition-all space-y-2 ${
                    note.acknowledged_by_specialist
                      ? 'bg-slate-950/80 border-slate-800/80'
                      : 'bg-indigo-950/40 border-indigo-500/40 shadow-md shadow-indigo-950/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-lg">
                        {note.mood === 'happy' ? '😊' : note.mood === 'anxious' ? '😟' : note.mood === 'meltdown' ? '😡' : '😴'}
                      </span>
                      <div>
                        <span className="font-bold text-xs text-white">
                          {note.category === 'speech' ? '🗣️ نطق ولغة' : note.category === 'behavior' ? '🎭 سلوك وانفعال' : '📝 ملاحظة عامة'}
                        </span>
                        <span className="text-[10px] text-slate-500 mr-2 font-mono">
                          {note.created_date || note.created_at?.split('T')[0] || 'مؤخراً'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onInjectIntoSoap && (
                        <button
                          type="button"
                          onClick={() => {
                            onInjectIntoSoap(`• ملاحظة الولي المنزلي (${note.created_date || ''}): ${note.note}`);
                            showToast('تم حقن الملاحظة في تقرير SOAP!');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-bold flex items-center space-x-1 space-x-reverse transition-all"
                          title="إدراج في الشكوى والملاحظات (SOAP Subjective)"
                        >
                          <FileText className="w-3 h-3" />
                          <span>إدراج في SOAP</span>
                        </button>
                      )}

                      {!note.acknowledged_by_specialist ? (
                        <button
                          type="button"
                          onClick={() => handleAcknowledgeNote(note.id)}
                          disabled={acknowledgingNoteId === note.id}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-bold flex items-center space-x-1 space-x-reverse transition-all"
                        >
                          <Check className="w-3 h-3" />
                          <span>إقرار المعاينة</span>
                        </button>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-bold">
                          ✓ تمت المعاينة
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800 font-sans">
                    {note.note}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
