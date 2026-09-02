import React, { useState } from 'react';
import { Coins, CheckCircle2, Edit2, Plus, Sparkles, ShieldCheck } from 'lucide-react';

export default function PlansManagerTab({ plans = [], onRefresh }) {
  const defaultPlans = [
    {
      id: 1,
      name: 'الباقة الأساسية (Basic)',
      price_monthly: 4500,
      price_yearly: 45000,
      max_patients: 100,
      max_users: 2,
      features: ['20 حصيلة سريرية شهرياً', '30 دقيقة تفريغ صوتي', '10 بطاقات PECS', 'دعم فني عبر البريد'],
      is_active: true,
    },
    {
      id: 2,
      name: 'الباقة الاحترافية (Pro Clinic)',
      price_monthly: 8900,
      price_yearly: 89000,
      max_patients: 500,
      max_users: 5,
      features: ['100 حصيلة سريرية شهرياً', '120 دقيقة تفريغ صوتي حي', '50 بطاقة بصرية و PECS', '5 حلقات بودكاست إذاعية', 'استوديو النمذجة البصرية'],
      is_active: true,
      popular: true,
    },
    {
      id: 3,
      name: 'باقة المراكز الكبرى (Enterprise)',
      price_monthly: 16500,
      price_yearly: 165000,
      max_patients: 2000,
      max_users: 20,
      features: ['استخدام غير محدود للحصائل', 'تفريغ صوتي مفتوح للجلسات', 'توليد فيديو غير محدود', 'نطاق مخصص SSL', 'دعم هاتفي مباشر 24/7'],
      is_active: true,
    },
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">إدارة باقات وخطط الاشتراك (Subscription Plans)</h2>
            <p className="text-xs text-slate-400">تحديد أسعار الاشتراكات الشهرية والسنوية وحدود المرضى والمستخدمين لكل باقة</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayPlans.map((plan) => (
          <div
            key={plan.id}
            className={`p-6 rounded-3xl border flex flex-col justify-between space-y-6 relative transition-all ${
              plan.popular
                ? 'bg-gradient-to-b from-indigo-950/40 to-slate-900 border-indigo-500/50 shadow-2xl shadow-indigo-500/10'
                : 'bg-slate-900 border-slate-800 shadow-xl'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 text-[10px] font-black text-white shadow-md">
                الأكثر طلباً ⭐
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-black text-white">{plan.name}</h3>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                  {Number(plan.price_monthly || plan.price_dzd || 0).toLocaleString()} <span className="text-xs text-slate-400">دج / شهر</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {Number(plan.price_yearly || 0).toLocaleString()} دج / سنة (وفر شهرين)
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>سعة المرضى:</span>
                  <span className="font-bold text-white">{plan.max_patients || 'غير محدود'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>عدد الأخصائيين:</span>
                  <span className="font-bold text-white">{plan.max_users || 'غير محدود'}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block">الميزات والحصص المضمنة:</span>
                <ul className="space-y-2">
                  {(plan.features || []).map((f, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-center space-x-2 space-x-reverse">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                plan.is_active !== false ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {plan.is_active !== false ? '🟢 باقة معروضة للعيادات' : '⚪ باقة مخفية'}
              </span>

              <button
                type="button"
                onClick={() => alert(`تعديل ${plan.name}`)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
              >
                <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>تعديل الباقة</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
