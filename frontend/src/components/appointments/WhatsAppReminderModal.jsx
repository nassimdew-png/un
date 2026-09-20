import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Check, 
  Copy, 
  Phone, 
  Calendar, 
  Clock, 
  User, 
  ExternalLink, 
  MessageSquare, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Edit3 
} from 'lucide-react';
import { appointmentApi } from '../../api';

export default function WhatsAppReminderModal({
  isOpen,
  onClose,
  appointment,
  initialData = null,
  onSent = null,
}) {
  if (!isOpen || !appointment) return null;

  const patient = appointment.patient || {};
  const specialist = appointment.specialist || {};

  // Form states
  const [phone, setPhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSendingCloud, setIsSendingCloud] = useState(false);
  const [cloudStatus, setCloudStatus] = useState(null);
  const [draftPrepared, setDraftPrepared] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState('standard');

  // Format appointment date and time cleanly
  const appointmentDate = appointment.appointment_date 
    ? new Date(appointment.appointment_date) 
    : new Date();
  const dateStr = !isNaN(appointmentDate.getTime())
    ? appointmentDate.toISOString().split('T')[0]
    : '';
  const timeStr = !isNaN(appointmentDate.getTime())
    ? appointmentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '10:00';

  const patientName = patient.first_name 
    ? `${patient.first_name} ${patient.last_name || ''}`.trim()
    : 'المريض المحترم';

  const specialistName = specialist.name || 'الأخصائي المعالج';

  // Helper to build standardized template text
  const buildTemplateText = (templateType, currentPatientName, currentDate, currentTime) => {
    const clinicName = 'العيادة التخصصية';
    if (templateType === 'confirm') {
      return `السلام عليكم ورحمة الله وبركاته،\n` +
        `تحية طيبة من *${clinicName}* 🏥\n\n` +
        `👤 *المريض:* ${currentPatientName}\n` +
        `📅 *موعدكم السريري القادم:* ${currentDate} على الساعة ${currentTime}\n\n` +
        `يرجى التكرم بتأكيد حضوركم بالرد على هذه الرسالة بـ *نعم* أو إشعارنا في حال رغبتكم في إعادة الجدولة.\n` +
        `مع تمنياتنا لكم بدوام الصحة والعافية.`;
    }

    if (templateType === 'instructions') {
      return `السلام عليكم ورحمة الله وبركاته،\n` +
        `نود تذكيركم بموعدكم القادم في: *${clinicName}*\n\n` +
        `👤 *المريض:* ${currentPatientName}\n` +
        `📅 *التاريخ:* ${currentDate} | ⏰ *التوقيت:* ${currentTime}\n` +
        `👨‍⚕️ *المعالج:* ${specialistName}\n\n` +
        `📌 *تعليمات هامة:* يرجى الحضور قبل الموعد بـ 10 دقائق لتأكيد الحضور عبر الشاشة الذكية في قاعة الانتظار، وإحضار الملف الطبي وأي فحوصات سابقة.\n` +
        `مع خالص التحيات والتقدير.`;
    }

    // Default Standard Reminder
    return `السلام عليكم ورحمة الله وبركاته،\n` +
      `نود تذكيركم بموعدكم القادم في: *${clinicName}*\n\n` +
      `👤 *المريض:* ${currentPatientName}\n` +
      `🩺 *نوع الجلسة:* جلسة علاجية واستشارة سريرية\n` +
      `📅 *التاريخ:* ${currentDate}\n` +
      `⏰ *التوقيت:* ${currentTime}\n` +
      `👨‍⚕️ *المعالج:* ${specialistName}\n\n` +
      `يرجى التفضل بالحضور قبل الموعد بـ 10 دقائق لتأكيد حضوركم عبر الشاشة الذكية في قاعة الانتظار.\n` +
      `مع تمنياتنا لكم بدوام الصحة والعافية.`;
  };

  // Initialize or update fields on mount/prop change
  useEffect(() => {
    let initialPhone = initialData?.phone || patient.phone || '';
    // Normalize phone
    const cleanDigits = initialPhone.replace(/[^0-9]/g, '');
    let normalizedPhone = cleanDigits;
    if (cleanDigits.startsWith('0') && cleanDigits.length === 10) {
      normalizedPhone = '213' + cleanDigits.substring(1);
    }
    setPhone(normalizedPhone);

    if (initialData?.message_text) {
      setMessageText(initialData.message_text);
    } else {
      setMessageText(buildTemplateText('standard', patientName, dateStr, timeStr));
    }
    setCloudStatus(null);
    setDraftPrepared(true);
  }, [appointment, initialData]);

  // Clean phone for wa.me link
  const getNormalizedPhone = () => {
    const raw = phone.replace(/[^0-9]/g, '');
    if (raw.startsWith('0') && raw.length === 10) {
      return '213' + raw.substring(1);
    }
    return raw;
  };

  const currentNormalizedPhone = getNormalizedPhone();
  const currentWaUrl = currentNormalizedPhone
    ? `https://wa.me/${currentNormalizedPhone}?text=${encodeURIComponent(messageText)}`
    : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  // Handle template switch
  const handleSelectTemplate = (templateKey) => {
    setActiveTemplate(templateKey);
    setMessageText(buildTemplateText(templateKey, patientName, dateStr, timeStr));
  };

  // Copy draft to clipboard
  const handleCopyText = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(messageText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = messageText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  // Open direct WhatsApp web / app draft link
  const handleOpenWhatsAppDraft = () => {
    const url = currentWaUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
    setDraftPrepared(true);
    if (onSent) {
      onSent(appointment.id, 'manual_draft');
    }
  };

  // Attempt dispatch via Cloud API
  const handleSendCloudApi = async () => {
    setIsSendingCloud(true);
    setCloudStatus(null);
    try {
      const res = await appointmentApi.sendWhatsAppReminder(appointment.id);
      if (res?.cloud_sent || res?.success) {
        setCloudStatus({
          success: true,
          message: res.message || 'تم إرسال تذكير الموعد السريري عبر واتساب بنجاح! 🚀'
        });
        if (onSent) onSent(appointment.id, 'cloud_api');
      } else {
        setCloudStatus({
          success: false,
          message: res?.message || 'بوابة واتساب السحابية غير مفعلة، يمكنك فتح المسودة في واتساب مباشرة.'
        });
      }
    } catch (err) {
      console.warn('Cloud API error, providing direct link fallback:', err);
      setCloudStatus({
        success: false,
        message: 'تعذر الإرسال الآلي، يمكنك فتح المسودة وإرسالها يدوياً عبر الزر الأخضر أدناه.'
      });
    } finally {
      setIsSendingCloud(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      dir="rtl"
      data-testid="whatsapp-reminder-modal"
    >
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  تجهيز وإرسال تذكير WhatsApp للمريض
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  مسودة سريرية جاهزة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                معاينة وتحرير نص رسالة التذكير وإرسالها مباشرة إلى واتساب المريض
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="إغلاق"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Patient and Appointment Quick Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">المريض:</span>
                <span className="text-slate-200 font-bold">{patientName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">التاريخ:</span>
                <span className="text-slate-200 font-bold">{dateStr}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px]">التوقيت:</span>
                <span className="text-slate-200 font-bold">{timeStr}</span>
              </div>
            </div>
          </div>

          {/* Cloud API Feedback Banner if any */}
          {cloudStatus && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              cloudStatus.success 
                ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-200' 
                : 'bg-amber-950/30 border-amber-600/30 text-amber-200'
            }`}>
              {cloudStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{cloudStatus.message}</p>
              </div>
            </div>
          )}

          {/* Phone Number Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                رقم هاتف المستلم (WhatsApp):
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                صيغة دولية أو محلية (مثال: 0555123456 أو 213555123456)
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="أدخل رقم هاتف المريض..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-left"
                dir="ltr"
              />
              <span className="absolute right-3 px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-400 border border-slate-700 font-mono">
                +213
              </span>
            </div>
          </div>

          {/* Template Quick Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-brand-400" />
                اختر نموذج الرسالة السريعة:
              </span>
              <span className="text-[11px] text-slate-500">
                {messageText.length} حرف
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectTemplate('standard')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  activeTemplate === 'standard'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                تذكير سريري قياسي
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate('confirm')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  activeTemplate === 'confirm'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                طلب تأكيد الحضور
              </button>
              <button
                type="button"
                onClick={() => handleSelectTemplate('instructions')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  activeTemplate === 'instructions'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                تعليمات الحضور المبكر
              </button>
            </div>
          </div>

          {/* Editable Draft Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                مسودة الرسالة (قابلة للتعديل المباشر):
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold transition-colors"
                title="نسخ نص الرسالة إلى الحافظة"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ المسودة</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={7}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="اكتب أو عدل نص رسالة التذكير هنا..."
              className="w-full px-3.5 py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none font-sans"
            />
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Cloud API Secondary Action */}
          <button
            type="button"
            onClick={handleSendCloudApi}
            disabled={isSendingCloud}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            title="محاولة الإرسال الآلي عبر بوابة Meta Cloud API"
          >
            {isSendingCloud ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-400" />
                <span>جارِ الإرسال الآلي...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-brand-400" />
                <span>إرسال آلي عبر البوابة السحابية</span>
              </>
            )}
          </button>

          {/* Primary Action Buttons */}
          <div className="w-full sm:w-auto flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              إلغاء
            </button>

            {/* Direct WhatsApp Draft Launch Button */}
            <button
              type="button"
              onClick={handleOpenWhatsAppDraft}
              data-testid="open-whatsapp-draft-btn"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="فتح مسودة الرسالة في WhatsApp مباشرة"
            >
              <Phone className="w-4 h-4 fill-white" />
              <span>فتح المسودة في WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
