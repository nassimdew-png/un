import React, { useState } from 'react';
import {
  MessageCircle,
  Phone,
  X,
  Sparkles,
  HelpCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Send,
  Building2,
  CreditCard
} from 'lucide-react';

export default function FloatingClinicalAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [inquiryType, setInquiryType] = useState('demo');

  const WHATSAPP_PHONE = '213550112233'; // Platform clinical direct line
  const SUPPORT_PHONE = '0550 11 22 33';

  const handleOpenWhatsApp = (customMsg = null) => {
    const text = customMsg || (
      inquiryType === 'demo'
        ? 'مرحباً، أود حجز جلسة عرض تفاعلي وتدريب مجاني (Demo) للتعرف على منصة عيادتي السحابية PsyPro.'
        : inquiryType === 'payment'
        ? 'مرحباً، أستفسر بخصوص خطوات الاشتراك والتسديد عبر تطبيق بريدي موب (BaridiMob) أو CCP.'
        : inquiryType === 'migration'
        ? 'مرحباً، أود الاستفسار حول إمكانية استيراد ونقل ملفات المرضى القديمة إلى منصة PsyPro.'
        : 'مرحباً، لدي استفسار تقني وسريري حول منصة PsyPro SaaS.'
    );

    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside aria-label="مستشار المنصة الإكلينيكي" className="fixed bottom-6 left-6 z-40 font-sans" dir="rtl">
      {/* Expanded Advisor Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-5 text-right relative overflow-hidden">
          {/* Header Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div className="flex items-center space-x-2.5 space-x-reverse">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>مستشار المنصة الإكلينيكي</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h3>
                <span className="text-[10px] text-slate-400 block font-mono">متصل الآن • رد فوري</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            هل تحتاج إلى مساعدة في اختيار الباقة المناسبة لعيادتك، أو الاستفسار عن المقاييس السريرية والدفع بـ BaridiMob؟
          </p>

          <div className="space-y-1.5 mb-4 text-xs">
            <button
              type="button"
              onClick={() => setInquiryType('demo')}
              className={`w-full p-2 rounded-xl text-right transition flex items-center justify-between ${
                inquiryType === 'demo'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold'
                  : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎥 طلب عرض حي وتدريب مجاني (Demo)</span>
              {inquiryType === 'demo' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={() => setInquiryType('payment')}
              className={`w-full p-2 rounded-xl text-right transition flex items-center justify-between ${
                inquiryType === 'payment'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold'
                  : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>💳 استفسار حول بريدي موب / CCP والفاتورة</span>
              {inquiryType === 'payment' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={() => setInquiryType('migration')}
              className={`w-full p-2 rounded-xl text-right transition flex items-center justify-between ${
                inquiryType === 'migration'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold'
                  : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📂 نقل بيانات وملفات المرضى القديمة</span>
              {inquiryType === 'migration' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleOpenWhatsApp()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>محادثة فورية عبر واتساب (WhatsApp)</span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" />
                <span>{SUPPORT_PHONE}</span>
              </span>
              <span>دعم محلي متاح 6 أيام/أسبوع</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 hover:scale-105 transition flex items-center space-x-2.5 space-x-reverse border border-emerald-400/30"
      >
        <div className="relative">
          <MessageCircle className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-emerald-600 animate-pulse" />
        </div>
        <span className="hidden sm:inline">استفسار سريري وتقني سريع</span>
        <span className="sm:hidden">استفسار</span>
      </button>
    </aside>
  );
}
