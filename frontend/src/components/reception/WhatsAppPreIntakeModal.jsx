import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  MessageSquare,
  Sparkles,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { patientApi } from '../../api';
import { getPatientProfileInfo } from '../../utils/patientHelper';
import {
  normalizeWhatsAppPhone,
  formatWhatsAppDisplayPhone,
  buildWhatsAppLinks
} from '../../utils/phoneHelper';

export default function WhatsAppPreIntakeModal({
  isOpen,
  onClose,
  patient,
  tenant,
  onSuccess
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [phone, setPhone] = useState('');
  const [magicLink, setMagicLink] = useState('');
  const [token, setToken] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendingCloud, setSendingCloud] = useState(false);
  const [cloudSuccess, setCloudSuccess] = useState(false);

  // Initialize or fetch link when patient changes
  useEffect(() => {
    if (!isOpen || !patient) {
      setMagicLink('');
      setMessageText('');
      setError('');
      setCopiedMsg(false);
      setCopiedLink(false);
      setCloudSuccess(false);
      return;
    }

    const initialPhone = patient.phone || '';
    setPhone(initialPhone);

    const initPreIntake = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await patientApi.generatePreIntakeLink(patient.id);
        const resolvedLink =
          res.magic_link ||
          res.link ||
          `${window.location.origin}/pre-intake/${res.token || patient.pre_intake_token || ''}`;

        setToken(res.token || patient.pre_intake_token || '');
        setMagicLink(resolvedLink);

        const clinicName = tenant?.header_title_ar || tenant?.name || 'العيادة التخصصية';
        const profile = getPatientProfileInfo(patient);
        const welcomeLine = profile.isChild
          ? `نرحب بحضور الطفل(ة) (*${profile.fullName}*) وأولياء أمره الكرام في قاعة الانتظار.`
          : `نرحب بحضوركم الكريم أستاذ(ة) (*${profile.fullName}*) في قاعة الانتظار.`;

        const formType = profile.isChild
          ? 'استبيان السوابق النمائية والتطورية'
          : 'استبيان البيانات السريرية الأولية';

        const defaultMsg = `مرحباً بكم في *${clinicName}* 🏥\n\n${welcomeLine}\n\nلتوفير وقتكم ومساعدة المعالج في مراجعة الملف بدقة، يرجى ملء ${formType} على هاتفكم أثناء الانتظار عبر الرابط السريع:\n🔗 ${resolvedLink}\n\nشكراً لتعاونكم معنا!`;

        setMessageText(defaultMsg);
      } catch (err) {
        console.error('Failed to generate pre-intake link:', err);
        setError(err.message || 'تعذر استخراج رابط الاستبيان.');
        // Fallback link
        const fallback = `${window.location.origin}/pre-intake/${patient.pre_intake_token || ''}`;
        setMagicLink(fallback);
      } finally {
        setLoading(false);
      }
    };

    initPreIntake();
  }, [isOpen, patient, tenant]);

  // Recalculate message if link or phone changes dynamically
  const profile = useMemo(() => (patient ? getPatientProfileInfo(patient) : {}), [patient]);
  const cleanPhone = useMemo(() => normalizeWhatsAppPhone(phone), [phone]);
  const formattedPhone = useMemo(() => formatWhatsAppDisplayPhone(phone), [phone]);

  const { waMeUrl, apiWaUrl } = useMemo(() => {
    return buildWhatsAppLinks(cleanPhone, messageText);
  }, [cleanPhone, messageText]);

  // Copy helpers with clipboard fallback
  const handleCopyMessage = async () => {
    if (!messageText) return;
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
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    } catch (e) {
      console.warn('Copy message failed:', e);
    }
  };

  const handleCopyLink = async () => {
    if (!magicLink) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(magicLink);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = magicLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.warn('Copy link failed:', e);
    }
  };

  const handleSendCloudApi = async () => {
    if (!cleanPhone) {
      setError('يرجى التأكد من رقم الهاتف أولاً.');
      return;
    }
    setSendingCloud(true);
    setError('');
    try {
      if (patientApi.sendWhatsApp) {
        await patientApi.sendWhatsApp({
          phone: cleanPhone,
          message: messageText,
          patient_id: patient?.id,
          template: 'pre_intake'
        });
      }
      setCloudSuccess(true);
      if (onSuccess) onSuccess('تم إرسال الرسالة عبر خادم WhatsApp Cloud API بنجاح.');
      setTimeout(() => setCloudSuccess(false), 3000);
    } catch (err) {
      console.warn('Cloud dispatch failed:', err);
      setError('تعذر الإرسال التلقائي عبر السيرفر. يمكنك استخدام زر الإرسال اليدوي المباشر.');
    } finally {
      setSendingCloud(false);
    }
  };

  if (!isOpen || !patient) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      dir="rtl"
      data-testid="whatsapp-preintake-modal"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/10">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>إرسال استبيان الاستقبال عبر WhatsApp</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono font-bold">
                  PRE-INTAKE LINK ⚡
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تجهيز وإرسال رابط استمارة الاستقبال المسبقة للمريض {profile?.fullName || ''} في قاعة الانتظار
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {cloudSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>تم الإرسال السحابي بنجاح!</span>
            </div>
          )}

          {/* Patient and Phone Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span>المراجع المستهدف:</span>
              </div>
              <div className="text-sm font-black text-white">
                {profile?.fullName || 'مراجع العيادة'}
              </div>
              <div className="text-[11px] text-slate-400">
                {profile?.isChild ? `طفل • الولي: ${profile.guardian || 'الأولياء'}` : 'بالغ / راشد'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="text-[11px] text-slate-400 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>رقم WhatsApp للمستلم:</span>
                </span>
                {cleanPhone && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {formattedPhone}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 0550123456 أو 213550123456"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                dir="ltr"
              />
            </div>
          </div>

          {/* Magic Link Box */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-300">
                <FileText className="w-4 h-4 text-brand-400" />
                <span>رابط الاستبيان الرقمي السريع (Magic Pre-Intake Link):</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  data-testid="copy-preintake-link-btn"
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
                </button>
                {magicLink && (
                  <a
                    href={magicLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                    title="فتح ومعاينة الاستمارة"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-teal-300 break-all select-all">
              {loading ? 'جارٍ توليد الرابط الآمن...' : magicLink || 'https://psypro.tech/pre-intake/...'}
            </div>
          </div>

          {/* WhatsApp Message Preview Box (Crucial for Automated Tests and Reception Staff) */}
          <div
            className="space-y-2 p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/20 shadow-inner"
            data-testid="whatsapp-preintake-preview"
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-emerald-400">
                <MessageSquare className="w-4 h-4" />
                <span>معاينة نص رسالة WhatsApp المعدة للإرسال:</span>
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                data-testid="copy-preintake-message-btn"
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                {copiedMsg ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedMsg ? 'تم نسخ النص بالكامل ✅' : 'نسخ نص الرسالة'}</span>
              </button>
            </div>

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={6}
              data-testid="whatsapp-preintake-message"
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-emerald-500 font-sans resize-y"
              placeholder="نص الرسالة..."
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>* يمكنك تعديل النص أو تخصيصه قبل الإرسال</span>
              <span>{messageText.length} حرفاً</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            إلغاء وإغلاق
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Direct wa.me link button */}
            <a
              href={waMeUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="open-whatsapp-link"
              onClick={() => {
                if (onSuccess) onSuccess('تم فتح تطبيق WhatsApp');
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>إرسال عبر WhatsApp (wa.me)</span>
            </a>

            {/* 2. Direct api.whatsapp.com fallback */}
            <a
              href={apiWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="open-api-whatsapp-link"
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="فتح عبر رابط WhatsApp Web المباشر"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>WhatsApp Web</span>
            </a>

            {/* 3. Server Cloud API dispatch */}
            <button
              type="button"
              onClick={handleSendCloudApi}
              disabled={sendingCloud || !cleanPhone}
              data-testid="send-cloud-api-btn"
              className="px-4 py-2.5 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="إرسال فوري تلقائي عبر خادم UltraMsg / Meta Cloud API"
            >
              {sendingCloud ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>إرسال سحابي تلقائي</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
