import React, { useState, useEffect } from 'react';
import {
  Globe,
  ShieldCheck,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Lock,
  Copy,
  Check,
  Trash2,
  Zap,
  Server,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { customDomainsApi } from '../../api';

export default function CustomDomainSettingsView({ tenant, user }) {
  const [domains, setDomains] = useState([]);
  const [serverIp, setServerIp] = useState('145.223.116.54');
  const [loading, setLoading] = useState(true);
  const [inputDomain, setInputDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [issuingSslId, setIssuingSslId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [activeStep, setActiveStep] = useState(1);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await customDomainsApi.getClinicDomains();
      if (res.success) {
        setDomains(res.domains || res.data || []);
        if (res.server_ip) setServerIp(res.server_ip);
      }
    } catch (err) {
      console.error('Failed to load clinic custom domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!inputDomain.trim()) return;

    setAddingDomain(true);
    setFeedback(null);
    try {
      const res = await customDomainsApi.addClinicDomain(inputDomain.trim());
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'تم حفظ النطاق بنجاح. يرجى توجيه سجل A في مزود النطاق.' });
        setInputDomain('');
        fetchDomains();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل إضافة النطاق المخصص.' });
    } finally {
      setAddingDomain(false);
    }
  };

  const handleVerifyDns = async (domainObj) => {
    setVerifyingId(domainObj.id);
    setFeedback(null);
    try {
      const res = await customDomainsApi.verifyDns(domainObj.id);
      if (res.is_verified) {
        setFeedback({ type: 'success', text: res.message || '🟢 تم التحقق من توجيه سجلات الـ DNS بنجاح!' });
      } else {
        setFeedback({ type: 'warning', text: res.message || '🟡 في انتظار انتشار الـ DNS.' });
      }
      fetchDomains();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل التحقق من الـ DNS.' });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleIssueSsl = async (domainObj) => {
    setIssuingSslId(domainObj.id);
    setFeedback(null);
    try {
      const res = await customDomainsApi.issueSsl(domainObj.id);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || '🔒 تم تثبيت شهادة SSL وتفعيل النطاق بنجاح!' });
        fetchDomains();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل إصدار وتثبيت شهادة SSL.' });
    } finally {
      setIssuingSslId(null);
    }
  };

  const handleDeleteDomain = async (domainObj) => {
    if (!window.confirm(`هل أنت متأكد من حذف النطاق المخصص (${domainObj.domain}) وإلغاء ربطه بالعيادة؟`)) {
      return;
    }

    setDeletingId(domainObj.id);
    setFeedback(null);
    try {
      const res = await customDomainsApi.deleteDomain(domainObj.id);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'تم حذف النطاق بنجاح.' });
        fetchDomains();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حذف النطاق.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-fade-in font-sans" dir="rtl">
      {/* 1. Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/25 shrink-0">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white">إدارة النطاق المخصص وشهادة الأمان (Custom Domain & SSL)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO Branding
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              اربط نطاقك الخاص (مثل <span className="text-indigo-300 font-mono">dr-benali.dz</span> أو <span className="text-indigo-300 font-mono">cabinet-ortho.com</span>) مع توليد شهادة SSL تلقائياً مجاناً
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchDomains}
          className="px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-2 space-x-reverse self-start md:self-auto border border-slate-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث الحالة</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center space-x-3 space-x-reverse transition ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : feedback.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 2. Three-Step Guided Setup Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Step 1 Card: Domain Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="text-sm font-black text-white">الخطوة الأولى: تسجيل اسم النطاق</h3>
            </div>
            <p className="text-xs text-slate-400">
              أدخل النطاق الذي قمت بشرائه من مسجل النطاقات (مثل Namecheap أو GoDaddy أو Nic.dz):
            </p>

            <form onSubmit={handleAddDomain} className="space-y-3 pt-2">
              <div>
                <input
                  type="text"
                  placeholder="مثال: dr-benali.dz"
                  value={inputDomain}
                  onChange={(e) => setInputDomain(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none transition"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={addingDomain || !inputDomain.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black transition flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 shadow-lg shadow-indigo-600/20"
              >
                {addingDomain ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>إضافة النطاق وتوليد تعليمات DNS</span>
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
            * تأكد من كتابة النطاق بدون http أو https
          </div>
        </div>

        {/* Step 2 Card: DNS Instructions */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="text-sm font-black text-white">الخطوة الثانية: ضبط سجلات الـ DNS</h3>
            </div>
            <p className="text-xs text-slate-400">
              قم بالدخول للوحة تحكم النطاق وأضف سجل <span className="text-purple-300 font-bold font-mono">A-Record</span> التالي:
            </p>

            <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">نوع السجل (Type):</span>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">A</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">المضيف / الاسم (Host):</span>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">@</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">القيمة / الهدف (Points to):</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-indigo-300">{serverIp}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(serverIp, 'ip')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="نسخ IP السيرفر"
                  >
                    {copiedKey === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>قد يستغرق انتشار الـ DNS ما بين دقيقة إلى 15 دقيقة.</span>
          </div>
        </div>

        {/* Step 3 Card: SSL Automation */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="text-sm font-black text-white">الخطوة الثالثة: تفعيل شهادة SSL</h3>
            </div>
            <p className="text-xs text-slate-400">
              بعد تأكيد توجيه الـ DNS، يتيح لك النظام إصدار وتثبيت شهادة Let's Encrypt وتفعيل التشفير HTTPS تلقائياً بضغطة زر واحدة.
            </p>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs text-emerald-300">
              <div className="flex items-center gap-1.5 font-black">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>تشفير كامل TLS 1.3 مع تجديد تلقائي</span>
              </div>
              <p className="text-[11px] text-emerald-200/80">
                يتم إدارة شهادات الأمان وتجديدها دورياً كل 90 يوماً بدون أي تدخل يدوي.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>يتم ربط عيادتك مباشرة بالنطاق فور اكتمال التثبيت.</span>
          </div>
        </div>
      </div>

      {/* 3. Registered Domains List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">النطاقات المربوطة بالعيادة</h3>
              <p className="text-xs text-slate-400">قائمة النطاقات وحالة توجيه الـ DNS وشهادات الأمان</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            {domains.length} نطاق مسجل
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs">جاري تحميل بيانات النطاقات...</span>
          </div>
        ) : domains.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Globe className="w-12 h-12 text-slate-700 mx-auto" />
            <div className="text-sm font-bold text-slate-300">لا يوجد نطاق مخصص مربوط حالياً</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              يمكنك استخدام النموذج في الخطوة 1 أعلاه لإضافة نطاق عيادتك الخاص والاستفادة من تجربة استخدام فريدة لمرضاك.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-4">اسم النطاق</th>
                  <th className="py-3 px-4">حالة الـ DNS</th>
                  <th className="py-3 px-4">حالة شهادة SSL</th>
                  <th className="py-3 px-4">تاريخ الانتهاء</th>
                  <th className="py-3 px-4 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {domains.map((dom) => {
                  const isVerified = dom.status === 'dns_verified' || dom.status === 'ssl_active';
                  const isSslActive = dom.status === 'ssl_active';
                  const isPending = dom.status === 'pending_dns';
                  const isFailed = dom.status === 'failed';

                  return (
                    <tr key={dom.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2.5 space-x-reverse">
                          <span className="font-mono font-black text-sm text-white">{dom.domain}</span>
                          {isSslActive && (
                            <a
                              href={`https://${dom.domain}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 transition"
                              title="فتح الرابط"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {dom.is_primary && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              رئيسي
                            </span>
                          )}
                        </div>
                        {dom.dns_detected_ip && (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            IP مكتشف: {dom.dns_detected_ip}
                          </div>
                        )}
                        {dom.error_message && (
                          <div className="text-[11px] text-rose-400 max-w-sm mt-1 truncate" title={dom.error_message}>
                            خطأ: {dom.error_message}
                          </div>
                        )}
                      </td>

                      {/* DNS Status Column */}
                      <td className="py-4 px-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>موجه بنجاح (A-Record OK)</span>
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[11px] animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>في انتظار انتشار الـ DNS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>فشل التحقق من التوجيه</span>
                          </span>
                        )}
                      </td>

                      {/* SSL Status Column */}
                      <td className="py-4 px-4">
                        {isSslActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[11px]">
                            <Lock className="w-3.5 h-3.5" />
                            <span>نشط ومشفر (HTTPS Active)</span>
                          </span>
                        ) : isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>جاهز لتوليد الشهادة</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>غير مفعل بعد</span>
                          </span>
                        )}
                      </td>

                      {/* SSL Expiry Column */}
                      <td className="py-4 px-4 text-slate-300 font-mono text-[11px]">
                        {dom.ssl_expires_at ? new Date(dom.ssl_expires_at).toLocaleDateString('ar-DZ') : '--'}
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* DNS Verify Button */}
                          <button
                            type="button"
                            onClick={() => handleVerifyDns(dom)}
                            disabled={verifyingId === dom.id}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition flex items-center space-x-1 space-x-reverse border border-slate-700 disabled:opacity-50"
                            title="فحص سجلات الـ DNS الآن"
                          >
                            <RefreshCw className={`w-3 h-3 ${verifyingId === dom.id ? 'animate-spin' : ''}`} />
                            <span>فحص الـ DNS</span>
                          </button>

                          {/* SSL Issue Button */}
                          {(!isSslActive || isFailed) && (
                            <button
                              type="button"
                              onClick={() => handleIssueSsl(dom)}
                              disabled={issuingSslId === dom.id}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] transition flex items-center space-x-1 space-x-reverse disabled:opacity-50 shadow-md shadow-emerald-600/20"
                              title="توليد وتثبيت شهادة SSL"
                            >
                              {issuingSslId === dom.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Lock className="w-3 h-3" />
                              )}
                              <span>توليد شهادة SSL</span>
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteDomain(dom)}
                            disabled={deletingId === dom.id}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white transition border border-rose-500/20"
                            title="حذف النطاق"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
