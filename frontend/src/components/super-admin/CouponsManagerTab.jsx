import React, { useState } from 'react';
import { Tag, Plus, CheckCircle2, Clock, Trash2, Copy, Check } from 'lucide-react';

export default function CouponsManagerTab() {
  const [copiedCode, setCopiedCode] = useState(null);

  const coupons = [
    { id: 1, code: 'RAMADAN2026', discount_percentage: 25, type: 'percentage', max_uses: 100, used_count: 34, expires_at: '2026-12-31', is_active: true },
    { id: 2, code: 'CLINICPRO50', discount_percentage: 50, type: 'percentage', max_uses: 20, used_count: 12, expires_at: '2026-10-15', is_active: true },
    { id: 3, code: 'WELCOME_DZ', discount_amount_dzd: 2000, type: 'fixed', max_uses: 500, used_count: 180, expires_at: '2026-12-31', is_active: true },
  ];

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-black">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">إدارة كوبونات وقسائم الخصم الترويجية (Discount Coupons)</h2>
            <p className="text-xs text-slate-400">إنشاء أكواد ترويجية للعيادات الجديدة ونسب الخصم على الباقات الشهرية والسنوية</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert('إنشاء كوبون ترويجي جديد')}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-90 text-white text-xs font-bold transition flex items-center space-x-2 space-x-reverse shadow-lg self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء كوبون جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 transition space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  {c.type === 'percentage' ? `خصم ${c.discount_percentage}%` : `خصم ${c.discount_amount_dzd} دج`}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">🟢 نشط</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-dashed border-slate-700 flex items-center justify-between">
                <span className="text-base font-black text-white font-mono tracking-wider">{c.code}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(c.code)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="نسخ الكود"
                >
                  {copiedCode === c.code ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>مرات الاستخدام:</span>
                  <span className="font-mono text-white font-bold">{c.used_count} / {c.max_uses}</span>
                </div>
                <div className="flex justify-between">
                  <span>تاريخ الانتهاء:</span>
                  <span className="font-mono text-slate-300">{c.expires_at}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-500">تم الإنشاء بواسطة الإدارة</span>
              <button
                type="button"
                onClick={() => alert(`حذف الكوبون ${c.code}`)}
                className="text-rose-400 hover:text-rose-300 text-xs font-bold"
              >
                تعطيل الكوبون
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
