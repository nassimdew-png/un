import React from 'react';
import { X, Zap, CheckCircle2, Phone, Sparkles, ShieldCheck } from 'lucide-react';

export default function UpgradePlanModal({ isOpen, onClose, featureName }) {
  if (!isOpen) return null;

  const plans = [
    {
      name: 'الباقة الأساسية (Basic)',
      price: '4,500 دج / شهر',
      features: ['20 حصيلة سريرية شهرياً', '30 دقيقة تفريغ صوتي', '10 بطاقات PECS', 'دعم فني عبر البريد'],
      color: 'border-slate-700 bg-slate-950/60',
      popular: false,
    },
    {
      name: 'الباقة الاحترافية (Pro Clinic)',
      price: '8,900 دج / شهر',
      features: ['100 حصيلة سريرية شهرياً', '120 دقيقة تفريغ صوتي حي', '50 بطاقة بصرية و PECS', '5 حلقات بودكاست إذاعية', 'استوديو النمذجة البصرية'],
      color: 'border-indigo-500 bg-indigo-950/30',
      popular: true,
    },
    {
      name: 'باقة المراكز الكبرى (Enterprise)',
      price: '16,500 دج / شهر',
      features: ['استخدام غير محدود للحصائل', 'تفريغ صوتي مفتوح للجلسات', 'توليد فيديو غير محدود', 'نطاق مخصص SSL', 'دعم هاتفي مباشر 24/7'],
      color: 'border-purple-500 bg-purple-950/30',
      popular: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans text-right" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute left-6 top-6 p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-xl shadow-amber-500/25 mb-1">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-white">
            {featureName ? `نفدت حصتك الشهرية لـ (${featureName})` : 'ترقية باقة العيادة لفتح كامل ميزات الذكاء الاصطناعي'}
          </h3>
          <p className="text-xs text-slate-400">
            اختر الباقة المناسبة لحجم نشاط عيادتك واستمتع بسرعة وتكامل متواصل لجميع أدوات المساعد السريري.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 relative ${p.color}`}
            >
              {p.popular && (
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 text-[10px] font-black text-white shadow-md">
                  الأكثر طلباً ⭐
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-black text-white">{p.name}</h4>
                <div className="text-base font-black text-emerald-400 font-mono">{p.price}</div>
                <ul className="space-y-1.5 pt-2">
                  {p.features.map((f, i) => (
                    <li key={i} className="text-[11px] text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={`https://wa.me/213555000000?text=${encodeURIComponent(`السلام عليكم، أود طلب ترقية باقتي إلى ${p.name} في منصة PsyPro.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white text-xs font-bold text-center transition flex items-center justify-center space-x-1.5 space-x-reverse"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>طلب الترقية الآن</span>
              </a>
            </div>
          ))}
        </div>

        {/* Footer Guarantee */}
        <div className="text-center text-xs text-slate-400 flex items-center justify-center space-x-2 space-x-reverse pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>تفعيل فوري للباقة مع ضمان استمرارية كافة البيانات وسجلات المرضى.</span>
        </div>

      </div>
    </div>
  );
}
