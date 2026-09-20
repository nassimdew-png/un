import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Mail,
  Send,
  QrCode,
  Smartphone,
  ShieldCheck,
  Video,
  KeyRound,
  Sparkles,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { whatsappApi } from '../../api';

export default function ShareTeletherapyLinkModal({
  isOpen,
  onClose,
  roomCode,
  roomPin = '7788',
  patient = null,
  doctorName = 'الأخصائي المعالج',
  clinicName = 'منصة PsyPro السريرية',
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [sendingWa, setSendingWa] = useState(false);
  const [waSentSuccess, setWaSentSuccess] = useState(false);
  const [waError, setWaError] = useState(null);

  const patientFullName = patient?.full_name || 
    (patient?.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : null) || 
    'المراجع الكريم';

  useEffect(() => {
    if (isOpen) {
      setRecipientPhone(patient?.phone || patient?.emergency_contact || '');
      setRecipientEmail(patient?.email || '');
      setWaSentSuccess(false);
      setWaError(null);
    }
  }, [isOpen, patient]);

  // Generate public patient-friendly room URL
  const publicRoomUrl = useMemo(() => {
    if (!roomCode) return '';
    const origin = window.location.origin;
    return `${origin}/portal/teletherapy/${roomCode}?pin=${roomPin}`;
  }, [roomCode, roomPin]);

  // Clinical invitation text
  const invitationMessage = useMemo(() => {
    return `🏥 دعوة استشارة طبية وتأهيل سريري عن بعد (Teleconsultation)

عزيزي المريض / الولي الكريم: *${patientFullName}* 🌸
يسرنا تزويدكم برابط الجلسة السريرية المرئية المباشرة مع *${doctorName}* في *${clinicName}*.

📌 رابط الدخول المباشر إلى غرفة الفحص:
🔗 ${publicRoomUrl}

🔑 رمز المرور السريع (PIN): *${roomPin}*
🏷️ رمز الغرفة: *${roomCode}*
${customNotes ? `\n📝 تعليمات إضافية من الطبيب:\n${customNotes}\n` : ''}
💡 تنبيه تقني: يرجى فتح الرابط عبر متصفح الهاتف أو الكمبيوتر (Google Chrome أو Safari أو Edge) والسماح باستخدام الكاميرا والميكروفون للانضمام فوراً دون الحاجة لتثبيت أي برامج أو تطبيقات.

نتمنى لكم دوام الصحة والعافية.`;
  }, [patientFullName, doctorName, clinicName, publicRoomUrl, roomPin, roomCode, customNotes]);

  if (!isOpen) return null;

  // 1. Copy Direct Link
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(publicRoomUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = publicRoomUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.warn('Copy link error:', e);
    }
  };

  // 2. Copy Full Invitation Message
  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(invitationMessage);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = invitationMessage;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    } catch (e) {
      console.warn('Copy message error:', e);
    }
  };

  // 3. WhatsApp Direct / Web
  const handleShareWhatsApp = (forceManual = false) => {
    const raw = (recipientPhone || '').replace(/[^0-9]/g, '');
    const cleanPhone = raw ? (raw.startsWith('0') ? '213' + raw.substring(1) : raw) : '';
    const encoded = encodeURIComponent(invitationMessage);

    if (forceManual || !cleanPhone) {
      const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
      window.open(url, '_blank');
      return;
    }

    // Try Cloud API, then fallback to wa.me
    setSendingWa(true);
    setWaError(null);
    setWaSentSuccess(false);

    whatsappApi.sendMessage({
      phone: cleanPhone,
      message: invitationMessage,
      patient_id: patient?.id,
      service_type: 'teletherapy_room',
    })
      .then((res) => {
        if (res?.success) {
          setWaSentSuccess(true);
          setTimeout(() => setWaSentSuccess(false), 6000);
        } else {
          window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
        }
      })
      .catch(() => {
        window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
      })
      .finally(() => {
        setSendingWa(false);
      });
  };

  // 4. SMS Direct
  const handleShareSms = () => {
    const raw = (recipientPhone || '').replace(/[^0-9]/g, '');
    const cleanPhone = raw ? (raw.startsWith('0') ? '213' + raw.substring(1) : raw) : '';
    const encoded = encodeURIComponent(invitationMessage);
    const smsUrl = cleanPhone ? `sms:${cleanPhone}?body=${encoded}` : `sms:?body=${encoded}`;
    window.open(smsUrl, '_self');
  };

  // 5. Email (mailto)
  const handleShareEmail = () => {
    const subject = encodeURIComponent(`دعوة استشارة طبية عن بعد: ${patientFullName}`);
    const body = encodeURIComponent(invitationMessage);
    const mailtoUrl = recipientEmail 
      ? `mailto:${recipientEmail}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
  };

  // 6. Telegram Share
  const handleShareTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(publicRoomUrl)}&text=${encodeURIComponent(`دعوة استشارة سريرية عن بعد مع ${doctorName}\nرمز PIN: ${roomPin}`)}`;
    window.open(tgUrl, '_blank');
  };

  // 7. Native Web Share API (Viber, Messenger, Teams, AirDrop, etc.)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `استشارة طبية عن بعد - ${patientFullName}`,
          text: invitationMessage,
          url: publicRoomUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed:', err);
        }
      }
    } else {
      handleCopyMessage();
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicRoomUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        
        {/* Top Accent Gradient */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-500" />

        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
                <span>مشاركة ودعوة المريض للجلسة المرئية</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  MULTI-CHANNEL SHARE 🌐
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                مشاركة رابط الغرفة الآمن عبر كافة القنوات والوسائط (واتساب، رسائل SMS، إيميل، تيليجرام، أو نسخ مباشر)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          
          {/* Room Credentials Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">المريض المستهدف:</span>
              <span className="text-xs font-black text-white truncate block">
                {patientFullName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">رمز الغرفة (Room):</span>
              <span className="text-xs font-mono font-black text-indigo-300 truncate block">
                {roomCode}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">رمز الدخول (PIN):</span>
              <span className="text-sm font-mono font-black text-emerald-400">
                {roomPin}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">نوع التشفير:</span>
              <span className="text-[11px] font-bold text-teal-300 flex items-center space-x-1 space-x-reverse">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>WebRTC E2EE 🔒</span>
              </span>
            </div>
          </div>

          {/* Direct Link Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>رابط الجلسة المباشر للمريض (Direct Join URL):</span>
              <button
                type="button"
                onClick={() => window.open(publicRoomUrl, '_blank')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 space-x-reverse font-semibold"
              >
                <span>فتح ومعاينة الرابط</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </label>

            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="flex-1 p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono select-all truncate">
                {publicRoomUrl}
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse shrink-0 ${
                  copiedLink
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'تم النسخ ✓' : 'نسخ الرابط'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className={`p-2.5 rounded-2xl border transition ${
                  showQrCode
                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800'
                }`}
                title="عرض رمز الاستجابة السريعة (QR Code) للمسح عبر كاميرا الهاتف"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* QR Code Popup Box */}
          {showQrCode && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-purple-900/40 text-center space-y-2 animate-fade-in">
              <div className="text-xs font-bold text-purple-300">
                امسح الرمز بكاميرا الهاتف أو الجهاز اللوحي للدخول فوراً للجلسة:
              </div>
              <div className="bg-white p-2.5 rounded-2xl inline-block shadow-xl">
                <img
                  src={qrImageUrl}
                  alt="Teletherapy QR Code"
                  className="w-36 h-36 mx-auto block"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                لا يحتاج المريض لتثبيت أي تطبيق • يعمل مباشرة في المتصفح
              </p>
            </div>
          )}

          {/* Quick Contact Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                رقم هاتف المريض / الولي (للواتساب و SMS):
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="05 / 06 / 07 ..."
                  className="w-full px-3 py-2 pl-9 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                البريد الإلكتروني للمريض (اختياري):
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full px-3 py-2 pl-9 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Multi-Channel Action Buttons Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              اختر وسيلة المشاركة والإرسال الفوري:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* WhatsApp Button */}
              <button
                type="button"
                disabled={sendingWa}
                onClick={() => handleShareWhatsApp(false)}
                className="p-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex flex-col items-center justify-center space-y-1 group shadow-sm active:scale-95"
              >
                <MessageSquare className="w-5 h-5 text-emerald-400 group-hover:text-white" />
                <span>واتساب WhatsApp</span>
              </button>

              {/* SMS Button */}
              <button
                type="button"
                onClick={handleShareSms}
                className="p-3 rounded-2xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-bold transition flex flex-col items-center justify-center space-y-1 group shadow-sm active:scale-95"
              >
                <Smartphone className="w-5 h-5 text-teal-400 group-hover:text-white" />
                <span>رسالة نصية SMS</span>
              </button>

              {/* Email Button */}
              <button
                type="button"
                onClick={handleShareEmail}
                className="p-3 rounded-2xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold transition flex flex-col items-center justify-center space-y-1 group shadow-sm active:scale-95"
              >
                <Mail className="w-5 h-5 text-blue-400 group-hover:text-white" />
                <span>البريد الإلكتروني</span>
              </button>

              {/* Telegram Button */}
              <button
                type="button"
                onClick={handleShareTelegram}
                className="p-3 rounded-2xl bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-bold transition flex flex-col items-center justify-center space-y-1 group shadow-sm active:scale-95"
              >
                <Send className="w-5 h-5 text-sky-400 group-hover:text-white" />
                <span>تيليجرام Telegram</span>
              </button>
            </div>
          </div>

          {/* Native System Share / Other Apps */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition flex items-center justify-center space-x-2 space-x-reverse"
            >
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>مشاركة عبر تطبيقات أخرى (Viber / Teams / Messenger)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMessage}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse shrink-0 ${
                copiedMsg
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
              }`}
            >
              {copiedMsg ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              <span>{copiedMsg ? 'تم نسخ الرسالة ✓' : 'نسخ نص الدعوة كاملاً'}</span>
            </button>
          </div>

          {/* Invitation Message Preview Box */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-400 flex items-center justify-between">
              <span>معاينة نص الدعوة الطبية المعتمدة:</span>
              <span className="text-[10px] text-slate-500">جاهزة للإرسال</span>
            </label>
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto select-all">
              {invitationMessage}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 space-x-reverse">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>يمكن للمريض الدخول بضغطة زر دون الحاجة لإنشاء حساب أو تحميل تطبيقات.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
