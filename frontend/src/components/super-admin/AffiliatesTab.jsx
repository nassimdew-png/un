import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Share2,
  Users,
  Percent,
  Coins,
  Plus,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Power,
  Trash2,
  ExternalLink,
  Phone,
  CreditCard,
  Sparkles,
  X
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function AffiliatesTab() {
  const { t } = useTranslation();
  const [affiliates, setAffiliates] = useState([]);
  const [stats, setStats] = useState({ total_partners: 0, total_referred_clinics: 0, total_commissions_dzd: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  // New Partner Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    affiliate_name: '',
    referral_code: '',
    commission_rate: 15,
    payout_phone: '',
    payout_ccp_rip: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getAffiliates();
      if (res.success) {
        setAffiliates(res.affiliates || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load affiliates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggle = async (id) => {
    try {
      await superAdminApi.toggleAffiliate(id);
      fetchAffiliates();
    } catch (err) {
      console.error('Failed to toggle affiliate:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف شريك الإحالة هذا؟')) return;
    try {
      await superAdminApi.deleteAffiliate(id);
      fetchAffiliates();
    } catch (err) {
      console.error('Failed to delete affiliate:', err);
    }
  };

  const handleCreate = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await superAdminApi.createAffiliate(formData);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'تم إنشاء الشريك ورابط الإحالة بنجاح.' });
        fetchAffiliates();
        setTimeout(() => {
          setShowModal(false);
          setFormData({
            affiliate_name: '',
            referral_code: '',
            commission_rate: 15,
            payout_phone: '',
            payout_ccp_rip: '',
          });
        }, 1200);
      } else {
        setFeedback({ type: 'error', text: res.message || 'فشل إنشاء الشريك.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'خطأ أثناء إنشاء الشريك.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Share2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">منظومة شركاء التسويق وروابط الإحالة (Affiliate & Referral Tracking)</h2>
          </div>
          <p className="text-xs text-slate-400">
            توليد روابط تتبع مخصصة للجمعيات الطبية والمؤثرين، احتساب العمولات التلقائية لكل عيادة مسجلة، ومتابعة المستحقات.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          <button
            onClick={fetchAffiliates}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة شريك تسويق جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي شركاء التسويق</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            {stats.total_partners} <span className="text-xs font-normal text-slate-400">شريك معتمد</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">جمعيات، أساتذة ومؤثرون إكلينيكيون</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">العيادات المسجلة عبر الإحالات</span>
            <Share2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {stats.total_referred_clinics} <span className="text-xs font-normal text-slate-400">عيادة جديدة</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">عبر كود وروابط الشركاء</div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">إجمالي العمولات المستحقة (DZD)</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {Number(stats.total_commissions_dzd || 0).toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">د.ج</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">مدفوعة عبر CCP / بريدي موب</div>
        </div>
      </div>

      {/* Affiliates List Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold">
                <th className="py-4 px-6">الشريك / الجهة</th>
                <th className="py-4 px-6">كود ورابط الإحالة المخصص</th>
                <th className="py-4 px-6">نسبة العمولة</th>
                <th className="py-4 px-6">العيادات المحالة</th>
                <th className="py-4 px-6">الأرباح (د.ج)</th>
                <th className="py-4 px-6">معلومات الدفع (CCP)</th>
                <th className="py-4 px-6 text-center">الحالة</th>
                <th className="py-4 px-6 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                    <span>جاري تحميل قائمة الشركاء...</span>
                  </td>
                </tr>
              ) : affiliates.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    لا يوجد شركاء تسويق مسجلون حالياً
                  </td>
                </tr>
              ) : (
                affiliates.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-bold text-white">
                      <div>{a.affiliate_name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">منذ {a.created_at_human}</div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {a.referral_code}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => handleCopy(a.referral_url, a.id)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[10px]"
                            title="نسخ رابط الإحالة"
                          >
                            {copiedCode === a.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedCode === a.id ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-teal-400">
                      {a.commission_rate}%
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-white">
                      {a.total_referred_clinics} عيادة
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-amber-300">
                      {Number(a.total_earned_dzd || 0).toLocaleString()} د.ج
                    </td>

                    <td className="py-4 px-6 text-[11px] text-slate-400">
                      <div>📞 {a.payout_phone}</div>
                      <div className="font-mono text-slate-500 mt-0.5">💳 {a.payout_ccp_rip}</div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggle(a.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                          a.is_active
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}
                      >
                        {a.is_active ? 'نشط ومفعل' : 'معطل'}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        title="حذف الشريك"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Partner Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">إضافة شريك تسويق وإحالة جديد</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedback && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الشريك / الجمعية / الدكتور:</label>
                <input
                  type="text"
                  placeholder="مثال: الجمعية الجزائرية للأخصائيين النفسانيين"
                  value={formData.affiliate_name}
                  onChange={(e) => setFormData({ ...formData, affiliate_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">كود الإحالة المخصص:</label>
                  <input
                    type="text"
                    placeholder="مثال: ANOP-2026"
                    value={formData.referral_code}
                    onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">نسبة العمولة (%):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم هاتف الشريك:</label>
                <input
                  type="text"
                  placeholder="0550112233"
                  value={formData.payout_phone}
                  onChange={(e) => setFormData({ ...formData, payout_phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الحساب أو RIP لتحويل العمولات:</label>
                <input
                  type="text"
                  placeholder="00799999001122334455"
                  value={formData.payout_ccp_rip}
                  onChange={(e) => setFormData({ ...formData, payout_ccp_rip: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>إنشاء رابط الشريك</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
