import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  X,
  ShieldCheck
} from 'lucide-react';

export default function SubscriptionStatusBanner({
  subscription,
  hasPendingRequest = false,
  onOpenRenew,
}) {
  const { t } = useTranslation();

  if (!subscription) return null;

  const daysRemaining = subscription.days_remaining ?? 0;
  const isTrial = Boolean(
    (subscription.is_trial ||
      subscription.status === 'trial' ||
      subscription.status === 'trialing') &&
      subscription.status !== 'active'
  );
  const isExpired = Boolean(subscription.is_expired || daysRemaining === 0);
  const isExpiringSoon = Boolean(subscription.is_expiring_soon || (daysRemaining <= 7 && daysRemaining > 0));

  // Don't show if active (non-trial) with more than 7 days remaining and no pending request
  if (!isTrial && !isExpiringSoon && !isExpired && !hasPendingRequest) {
    return null;
  }


  return (
    <div className="sticky top-0 z-40 w-full animate-fade-in shadow-lg">
      {hasPendingRequest ? (
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 border-b border-teal-500/40 px-4 py-2.5 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center animate-pulse shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span>
              <strong>وصل السداد قيد المراجعة الفنية:</strong> تم استلام طلب تجديد اشتراك العيادة وسيتم اعتماده وتمديد الترخيص خلال أقل من ساعتين.
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 text-[10px] hidden sm:inline-block">
            ⏳ قيد المراجعة (En cours de validation)
          </span>
        </div>
      ) : isExpired ? (
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-900 border-b border-red-500/50 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center animate-bounce shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-red-300">انتهت صلاحية ترخيص اشتراك العيادة!</strong>
              <p className="text-slate-300 text-[11px] mt-0.5">
                يرجى تجديد الاشتراك للاستمرار في حفظ ملفات المرضى وتوليد الحصائل والوصولات الرسمية.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenRenew}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-xs shadow-lg shadow-red-600/30 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>تجديد الاشتراك الآن (BaridiMob / CCP)</span>
          </button>
        </div>
      ) : isTrial ? (
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border-b border-teal-500/50 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-teal-300">الفترة التجريبية المجانية مفعّلة:</span>
              <span className="text-slate-200 mr-1.5">
                يتبقى في ترخيص التجربة <strong className="text-amber-400 font-mono text-sm px-1 font-black">{Math.min(daysRemaining, 14)} يوم</strong> من أصل 14 يوماً مع كافة المميزات السريرية.
              </span>

            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-bold hidden md:inline-block">
              🇩🇿 ترخيص رسمي تجريبي
            </span>
            <button
              onClick={onOpenRenew}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black text-xs shadow-md shadow-teal-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>تثبيت / ترقية الاشتراك (BaridiMob / CCP)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 border-b border-amber-500/40 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span>
              <strong>تنبيه انتهاء الاشتراك:</strong> يتبقى <strong className="text-amber-400 font-mono">{daysRemaining} يوم</strong> على انتهاء ترخيص باقة {subscription.plan_name_ar || 'العيادة'}.
            </span>
          </div>
          <button
            onClick={onOpenRenew}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Zap className="w-3 h-3 text-slate-950" />
            <span>تجديد الاشتراك</span>
          </button>
        </div>
      )}
    </div>
  );
}
