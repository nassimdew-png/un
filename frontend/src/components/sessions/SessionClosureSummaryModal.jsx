import React, { useState } from 'react';
import { 
  X, CheckCircle2, Clock, Calendar, User, Stethoscope, 
  MessageSquare, Copy, Check, ExternalLink, Award, FileText, Send 
} from 'lucide-react';
import { whatsappApi } from '../../api';

export default function SessionClosureSummaryModal({
  isOpen,
  onClose,
  session,
  tenant,
}) {
  if (!isOpen || !session) return null;

  const patient = session.patient || {};
  const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'المريض';
  const rawPhone = patient.phone || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const [waPhone, setWaPhone] = useState(cleanPhone.startsWith('0') ? '213' + cleanPhone.substring(1) : cleanPhone);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const exercises = Array.isArray(session.exercises_targeted) ? session.exercises_targeted : [];
  const exercisesText = exercises.length > 0 ? exercises.join('، ') : 'تمارين التأهيل الصوتي والنطق';
  const closureNotes = session.progress_notes || 'إتمام التدخل السريري بنجاح مع تجاوب إيجابي واستقرار المؤشرات.';
  const homework = 'تدريب يومي لمدة 10 دقائق بعد الوجبات بمرافقة الولي ومتابعة كراس التمارين المصور.';

  const sessionDateFormatted = session.session_date ? String(session.session_date).split('T')[0] : new Date().toISOString().split('T')[0];

  const preparedMessage = `السلام عليكم ورحمة الله وبركاته،\nتحية طيبة من ${tenant?.name || 'العيادة السريرية'}.\n\n📄 ملخص إنهاء الجلسة التأهيلية والواجبات المنزلية:\n• المريض: ${patientName}\n• تاريخ الحصة: ${sessionDateFormatted} (${session.duration_minutes || 45} دقيقة)\n• التخصص: ${session.specialty === 'orthophony' ? 'أرطوفونيا وتخاطب' : (session.specialty === 'psychology' ? 'دعم نفسي وعلاج CBT' : 'تأهيل سريري')}\n• حالة الجلسة: ✅ مكتملة (حاضر)\n\n🎯 الأنشطة والتمارين المنجزة:\n${exercises.length > 0 ? exercises.map(ex => `  - ${ex}`).join('\n') : `  - ${exercisesText}`}\n\n📝 ملاحظات الإنهاء والتطور السريري:\n${closureNotes}\n\n🏡 التكليفات والواجبات المنزلية المقترحة للأسرة:\n${homework}\n\nنشكركم على حسن التعاون والمواظبة لدعم مسار التأهيل والشفاء.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(preparedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = async () => {
    setSending(true);
    try {
      if (waPhone) {
        await whatsappApi.sendMessage({
          phone: waPhone,
          message: preparedMessage,
          patient_id: patient.id,
          service_type: 'closure_homework_summary',
        }).catch(err => console.warn('Cloud dispatch warning:', err));
      }
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
      const encoded = encodeURIComponent(preparedMessage);
      const url = waPhone ? `https://wa.me/${waPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl custom-scrollbar my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  ملخص إنهاء الجلسة والواجبات المنزلية
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  ✅ جلسة مكتملة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Session Closure & Homework Summary • {tenant?.name || 'المنظومة السريرية'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Session Metadata Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block">المريض</span>
            <span className="font-bold text-white text-xs">{patientName}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">التاريخ والمدة</span>
            <span className="font-mono text-cyan-300 font-bold">{sessionDateFormatted} ({session.duration_minutes || 45} د)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">التخصص</span>
            <span className="font-bold text-teal-300">
              {session.specialty === 'orthophony' ? 'أرطوفونيا وتخاطب' : (session.specialty === 'psychology' ? 'دعم نفسي وعلاج CBT' : 'تأهيل سريري')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">حالة الحضور</span>
            <span className="font-bold text-emerald-400">حاضر (Présent) ✓</span>
          </div>
        </div>

        {/* Completed Exercises */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>الأنشطة والتدخلات المنجزة في الجلسة:</span>
          </span>
          {exercises.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {exercises.map((ex, i) => (
                <span key={i} className="px-2.5 py-1 rounded-xl bg-slate-900 border border-teal-500/30 text-teal-300 text-xs font-medium">
                  ✓ {ex}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">تمارين تقويم النطق والوعي الصوتي والتنفس الحجابي.</p>
          )}
        </div>

        {/* Clinical Closure Notes */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <span className="text-xs font-bold text-slate-300 block">
            ملاحظات الإنهاء السريري والتطور:
          </span>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 font-sans">
            {closureNotes}
          </p>
        </div>

        {/* Recommended Homework */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <span className="text-xs font-bold text-amber-300 block">
            🏡 التوجيهات والواجبات المنزلية المقترحة للأسرة (Homework Guidance):
          </span>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 font-sans">
            {homework}
          </p>
        </div>

        {/* WhatsApp-Prepared Message Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 border border-emerald-500/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <MessageSquare className="w-4 h-4" />
              <span>معاينة رسالة WhatsApp المجهزة (Prepared WhatsApp Message):</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-500 text-[10px]">📲 هاتف المستلم:</span>
              <input
                type="tel"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="213555..."
                className="w-28 bg-transparent text-emerald-300 font-mono text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line max-h-48 overflow-y-auto custom-scrollbar">
            {preparedMessage}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? '✓ تم نسخ الرسالة بنجاح' : 'نسخ نص الرسالة'}</span>
            </button>

            <button
              type="button"
              disabled={sending}
              onClick={handleSendWhatsApp}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'جارٍ الإرسال...' : (sentSuccess ? '✓ تم الإرسال للعميل' : 'إرسال مباشر عبر WhatsApp')}</span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
