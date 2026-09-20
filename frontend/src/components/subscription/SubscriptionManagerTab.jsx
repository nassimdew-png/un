import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Users,
  Coins,
  RefreshCw,
  ExternalLink,
  Layers,
  Zap,
  Check
} from 'lucide-react';
import { subscriptionApi } from '../../api';
import RenewSubscriptionModal from './RenewSubscriptionModal';

export default function SubscriptionManagerTab() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRenewModal, setShowRenewModal] = useState(false);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const [subRes, invRes] = await Promise.all([
        subscriptionApi.getCurrent(),
        subscriptionApi.getInvoices(),
      ]);
      setData(subRes);
      setInvoices(invRes.invoices || []);
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const sub = data?.subscription;
  const clinic = data?.clinic;
  const plans = data?.plans || [];
  const paymentDetails = data?.payment_details;
  const pastRequests = data?.past_requests || [];
  const hasPending = data?.has_pending_request;

  const daysRemaining = sub?.days_remaining ?? 0;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Current Subscription Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950/40 border border-teal-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                حالة ترخيص منصة العيادة (SaaS License)
              </span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  sub?.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : sub?.status === 'trialing'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}
              >
                {sub?.status_label_ar || 'غير محدد'}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">{sub?.plan_name_ar || 'باقة العيادة'}</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                المساحة المرخصة: <span className="font-mono font-bold text-teal-300">{clinic?.subdomain}.psypro.tech</span> &bull; {clinic?.name}
              </p>
            </div>

            {/* Quota & Days Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-slate-400 block text-[10px]">الأيام المتبقية:</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  {daysRemaining} يوم
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-slate-400 block text-[10px]">تاريخ الانتهاء:</span>
                <span className="font-mono font-bold text-white text-xs">{sub?.ends_at || '--'}</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-slate-400 block text-[10px]">سعة الأخصائيين:</span>
                <span className="font-mono font-bold text-teal-300 text-xs">
                  {sub?.max_clinicians >= 50 ? 'غير محدود' : `${sub?.max_clinicians} أطباء`}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-slate-400 block text-[10px]">سعة المرضى:</span>
                <span className="font-mono font-bold text-cyan-300 text-xs">
                  {sub?.max_patients >= 5000 ? 'غير محدود' : `${sub?.max_patients} مريض`}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setShowRenewModal(true)}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm shadow-xl shadow-teal-600/25 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>تجديد / ترقية الاشتراك</span>
            </button>
            <span className="text-[10px] text-slate-400 text-center">
              سداد عبر بريدي موب (BaridiMob) أو CCP 🇩🇿
            </span>
          </div>
        </div>
      </div>

      {/* Pending Request Banner */}
      {hasPending && (
        <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-4 flex items-center justify-between text-xs text-white shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <strong className="text-teal-300">طلب التجديد قيد التحقق والمراجعة:</strong>
              <p className="text-slate-300 text-[11px] mt-0.5">
                تم استلام وصل السداد وهو قيد المراجعة من طرف إدارة المنصة. سيتم التفعيل وتوليد الفاتورة قريباً.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 text-xs shrink-0">
            قيد المراجعة ⏳
          </span>
        </div>
      )}

      {/* Grid: Past Requests & Issued Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Past Payment Requests */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-400" />
              طلبات السداد والتحويلات السابقة
            </h4>
            <span className="text-xs text-slate-500 font-mono">{pastRequests.length} طلبات</span>
          </div>

          {pastRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              لا توجد طلبات سداد سابقة مسجلة للعيادة.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {pastRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between text-xs hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white">{req.plan_name_ar}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {req.created_at_human} &bull; {req.amount_formatted}
                    </div>
                  </div>

                  <div className="text-left space-y-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : req.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}
                    >
                      {req.status_label}
                    </span>
                    {req.receipt_url && (
                      <div>
                        <a
                          href={req.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-teal-400 hover:underline flex items-center justify-end gap-1"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          معاينة الوصل
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Issued B2B Invoices */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              الفواتير الرسمية للعيادة (B2B Invoices)
            </h4>
            <span className="text-xs text-slate-500 font-mono">{invoices.length} فواتير</span>
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              سيتم إدراج فواتير الاشتراك الرسمية هنا بمجرد اعتماد الدفع.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between text-xs hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white font-mono text-cyan-300">{inv.invoice_number}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {inv.created_at_human} &bull; <strong className="text-emerald-400">{inv.amount_formatted}</strong>
                    </div>
                  </div>

                  <a
                    href={subscriptionApi.downloadInvoiceUrl(inv.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    تحميل PDF
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Renew Modal */}
      {showRenewModal && (
        <RenewSubscriptionModal
          isOpen={showRenewModal}
          onClose={() => setShowRenewModal(false)}
          currentSubscription={sub}
          plans={plans}
          paymentDetails={paymentDetails}
          onSuccess={fetchSubscriptionData}
        />
      )}
    </div>
  );
}
