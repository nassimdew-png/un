import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  CheckCircle2, 
  Copy, 
  Send, 
  QrCode, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  BookOpen,
  FileText
} from 'lucide-react';
import { parentPortalApi, whatsappApi } from '../../api';
import { getPatientProfileInfo } from '../../utils/patientHelper';

export default function GeneratePortalLinkModal({ isOpen, onClose, patient }) {
  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');

  // Cloud API sending state
  const [sendingWa, setSendingWa] = useState(false);
  const [waSentSuccess, setWaSentSuccess] = useState(false);
  const [waError, setWaError] = useState(null);

  const profile = getPatientProfileInfo(patient);

  useEffect(() => {
    if (isOpen && patient?.id) {
      setRecipientPhone(patient?.phone || patient?.emergency_contact || '');
      loadPortalLink();
    }
  }, [isOpen, patient?.id]);

  const loadPortalLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await parentPortalApi.generatePortalLink(patient.id);
      if (res.success) {
        // Use current browser origin for accurate testing / staging / production
        const cleanPortalUrl = `${window.location.origin}/portal/${res.portal_token}`;
        const patientName = profile.fullName;

        const customMessage = profile.isChild
          ? `السلام عليكم ورحمة الله،\n\nتحية طيبة إلى ولي أمر الطفل(ة) (*${patientName}*) المحترم 🌸\n\nيسرنا تزويدكم برابط تطبيق المرافق المنزلي وبوابة المتابعة السريرية:\n\n🔗 ${cleanPortalUrl}\n\n📲 يمكنكم تثبيت التطبيق على شاشة الهاتف مباشرة (PWA) للوصول اليومي السريع بنقرة واحدة.\n\nالمميزات المتوفرة:\n📅 تأكيد المواعيد السريرية ومزامنتها مع تقويم الهاتف.\n📚 ممارسة التمارين المنزلية التفاعلية والتسجيل الصوتي.\n📓 تدوين الملاحظات اليومية ومشاركتها مع المعالج.\n🌬️ تمارين التنفس والاسترخاء الموجه.\n📄 تحميل الحصائل والتقارير الطبية الرسمية (PDF).\n\nدمتم بصحة وعافية.`
          : `السلام عليكم ورحمة الله وبركاته،\n\nتحية طيبة للأستاذ(ة) (*${patientName}*) المحترم(ة) 🌸\n\nيسرنا تزويدكم برابط بوابة المتابعة السريرية الشخصية والتكليفات المنزلية:\n\n🔗 ${cleanPortalUrl}\n\n📲 يمكنكم تثبيت التطبيق على شاشة الهاتف مباشرة (PWA) للوصول السريع بنقرة واحدة.\n\nالمميزات المتوفرة:\n📅 تأكيد المواعيد السريرية ومزامنتها مع تقويم الهاتف.\n📚 الاطلاع على التمارين والتكليفات السلوكية والعلاجية.\n📓 تدوين الملاحظات اليومية ومشاركتها مع المعالج.\n🌬️ تمارين التنفس البطني والاسترخاء الموجه.\n📄 تحميل الحصائل والتقارير الطبية الرسمية (PDF).\n\nدمتم بصحة وعافية.`;

        setLinkData({
          token: res.portal_token,
          portalUrl: cleanPortalUrl,
          whatsappMessage: customMessage,
        });
      } else {
        setError(res.message || 'تعذر توليد الرابط.');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء توليد الرابط.');
    } finally {
      setLoading(false);
    }
  };

  const getActiveWhatsAppUrl = () => {
    if (!linkData?.whatsappMessage) return '#';
    const cleanDigits = (recipientPhone || '').replace(/[^0-9]/g, '');
    const intl = cleanDigits ? (cleanDigits.startsWith('0') ? '213' + cleanDigits.substring(1) : cleanDigits) : null;
    return intl
      ? `https://wa.me/${intl}?text=${encodeURIComponent(linkData.whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(linkData.whatsappMessage)}`;
  };

  const trimName = (p) => {
    if (!p) return 'العميل';
    return `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'الطفل';
  };

  const handleCopyLink = () => {
    if (!linkData?.portalUrl) return;
    navigator.clipboard.writeText(linkData.portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    if (!linkData?.whatsappMessage) return;
    navigator.clipboard.writeText(linkData.whatsappMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleSendCloudWhatsApp = async () => {
    const rawDigits = (recipientPhone || '').replace(/[^0-9]/g, '');
    if (!rawDigits) {
      setWaError('يرجى كتابة رقم هاتف المستلم للإرسال.');
      return;
    }
    if (!linkData?.whatsappMessage) return;

    const cleanPhone = rawDigits.startsWith('0') ? '213' + rawDigits.substring(1) : rawDigits;

    setSendingWa(true);
    setWaError(null);
    setWaSentSuccess(false);
    try {
      const patientName = trimName(patient);
      const clinicName = patient?.clinic_name || 'العيادة السريرية';
      const portalUrl = linkData?.portalUrl || '';

      const res = await whatsappApi.sendMessage({
        phone: cleanPhone,
        message: linkData.whatsappMessage,
        patient_id: patient.id,
        service_type: 'patient_portal',
        template_name: 'patient_portal_magic_link',
        template_parameters: [patientName, clinicName, portalUrl],
      });
      if (res?.success) {
        setWaSentSuccess(true);
        setTimeout(() => setWaSentSuccess(false), 7000);
      } else {
        setWaError(res?.message || 'تعذر الإرسال التلقائي عبر واتساب.');
      }
    } catch (err) {
      setWaError(err.message || 'فشل الاتصال بخادم واتساب.');
    } finally {
      setSendingWa(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {profile.isChild ? 'بوابة الولي والمرافق المنزلي (Parent Hub)' : 'بوابة المتابعة السريرية الشخصية (Patient Portal)'}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {profile.isChild ? 'مشاركة الرابط المباشر لولي أمر الطفل(ة): ' : 'مشاركة الرابط المباشر للأستاذ(ة): '}
                <strong className="text-teal-300">{profile.fullName}</strong>
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
            <p className="text-xs text-slate-400 font-bold">
              {profile.isChild ? 'جارٍ توليد وتأمين رابط البوابة للولي...' : 'جارٍ توليد وتأمين رابط البوابة السريرية...'}
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs">
            {error}
          </div>
        ) : linkData ? (
          <div className="space-y-4">
            {/* Features Mini Banner */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-teal-300 flex flex-col items-center gap-1">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <span>تمارين تفاعلية + صوت</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-emerald-300 flex flex-col items-center gap-1">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>تأكيد المواعيد بضغطة</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-indigo-300 flex flex-col items-center gap-1">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>تحميل الحصائل (PDF)</span>
              </div>
            </div>

            {/* Direct URL Input */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">الرابط السريري المباشر (Magic Link):</span>
                <span className="text-teal-400/80 font-mono text-[10px]">مشفر وآمن 🔒</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={linkData.portalUrl}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-teal-300 font-mono focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 shrink-0"
                >
                  {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'تم النسخ!' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            {/* Recipient Phone Selector Box (Any phone number support) */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                  <span>رقم هاتف المستلم (WhatsApp):</span>
                </span>
                <span className="text-slate-500 text-[10px]">تعديل أو إرسال لرقم آخر</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="أدخل رقم الهاتف المستهدف، مثال: 0555123456"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-teal-300 font-mono focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Quick Preset Phone Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {patient?.phone && (
                  <button
                    type="button"
                    onClick={() => setRecipientPhone(patient.phone)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                      recipientPhone === patient.phone
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    📱 الأساسي: {patient.phone}
                  </button>
                )}
                {patient?.emergency_contact && patient.emergency_contact !== patient.phone && (
                  <button
                    type="button"
                    onClick={() => setRecipientPhone(patient.emergency_contact)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                      recipientPhone === patient.emergency_contact
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    🚨 الطوارئ / الولي: {patient.emergency_contact}
                  </button>
                )}
              </div>
            </div>

            {/* WhatsApp Direct Action Button */}
            <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">إرسال مباشر عبر WhatsApp</h4>
                    <p className="text-[10px] text-slate-400">
                      {recipientPhone ? `إلى الرقم: ${recipientPhone}` : 'أدخل رقم هاتف للإرسال'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendCloudWhatsApp}
                    disabled={sendingWa || !recipientPhone}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                  >
                    {sendingWa ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{sendingWa ? 'جاري الإرسال...' : 'إرسال فوري (Cloud API) ⚡'}</span>
                  </button>

                  <a
                    href={getActiveWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>يدوي</span>
                  </a>
                </div>
              </div>

              {/* Success / Error Alerts */}
              {waSentSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تم إرسال رابط البوابة بنجاح إلى الرقم ({recipientPhone})! 📲✨</span>
                </div>
              )}

              {waError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in">
                  <span>{waError}</span>
                  <a href={getActiveWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline text-[11px] shrink-0">
                    فتح الرابط اليدوي ↗
                  </a>
                </div>
              )}

              {/* Message preview with copy button */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 relative">
                <p className="line-clamp-3 leading-relaxed font-sans">{linkData.whatsappMessage}</p>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="mt-2 text-[10px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedMsg ? 'تم نسخ نص الرسالة الكامل!' : 'نسخ نص الرسالة بالكامل'}</span>
                </button>
              </div>
            </div>

            {/* Quick Open Preview Button */}
            <div className="flex items-center justify-between pt-1">
              <a
                href={linkData.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-teal-300 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>
                  {profile.isChild ? 'معاينة البوابة كولي أمر (نافذة جديدة)' : 'معاينة البوابة السريرية (نافذة جديدة)'}
                </span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
