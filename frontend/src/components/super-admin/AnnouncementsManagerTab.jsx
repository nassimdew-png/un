import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Megaphone,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  RefreshCw,
  X,
  Calendar,
  Layers,
  Bell,
  Eye
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function AnnouncementsManagerTab() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target_tier: 'all',
    expires_at: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getAnnouncements();
      setAnnouncements(res.announcements || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleToggle = async (item) => {
    try {
      await superAdminApi.toggleAnnouncement(item.id);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, is_active: !a.is_active } : a))
      );
    } catch (err) {
      alert(err.message || 'فشل تغيير حالة الإعلان');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان الإداري؟')) return;
    try {
      await superAdminApi.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.message || 'فشل حذف الإعلان');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.title || !formData.message) {
      setFormError('يرجى كتابة عنوان الإعلان ونص الرسالة.');
      return;
    }

    setSaving(true);
    try {
      await superAdminApi.createAnnouncement(formData);
      setShowModal(false);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        target_tier: 'all',
        expires_at: '',
      });
      fetchAnnouncements();
    } catch (err) {
      setFormError(err.message || 'فشل إنشاء الإعلان');
    } finally {
      setSaving(false);
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'urgent':
        return {
          badge: 'bg-red-500/20 text-red-300 border-red-500/30',
          icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
          label: '🚨 عاجل وهام',
        };
      case 'warning':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: '⚠️ تنبيه تشغيلي',
        };
      case 'success':
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: '🎉 تحديث وميزة جديدة',
        };
      default:
        return {
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <Info className="w-4 h-4 text-blue-400" />,
          label: 'ℹ️ إشعار عام',
        };
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Action Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              نظام الإعلانات والتنبيهات العامة لكافة العيادات (Broadcast Announcements)
            </h3>
            <div className="text-xs text-slate-400">
              بث رسائل تنبيهية وتحديثات فورية تظهر في أعلى لوحة تحكم أصحاب العيادات والأطباء.
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء وبث إعلان جديد</span>
        </button>
      </div>

      {/* Announcements Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-3.5 px-4">نوع الإعلان</th>
                <th className="py-3.5 px-4">عنوان الإعلان</th>
                <th className="py-3.5 px-4">محتوى الرسالة</th>
                <th className="py-3.5 px-4">الفئة المستهدفة</th>
                <th className="py-3.5 px-4">تاريخ النشر</th>
                <th className="py-3.5 px-4 text-center">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 text-xs">
                    لا توجد إعلانات منشورة حالياً. يمكنك إنشاء إعلان جديد لبثه لكافة العيادات.
                  </td>
                </tr>
              ) : (
                announcements.map((item) => {
                  const typeStyle = getTypeStyle(item.type);

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border inline-flex items-center gap-1.5 ${typeStyle.badge}`}>
                          {typeStyle.icon}
                          <span>{typeStyle.label}</span>
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 font-bold text-white">
                        {item.title}
                      </td>

                      {/* Message Preview */}
                      <td className="py-3.5 px-4 text-slate-300 max-w-sm truncate text-xs">
                        {item.message}
                      </td>

                      {/* Target Tier */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                          {item.target_tier === 'all'
                            ? '🌐 كافة العيادات'
                            : item.target_tier === 'solo_starter'
                            ? 'Solo Starter'
                            : item.target_tier === 'multi_pro'
                            ? 'Multi-Pro Clinic'
                            : 'Enterprise DZ'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Toggle Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggle(item)}
                          className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition ${
                            item.is_active
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {item.is_active ? '🟢 نشط وبادي' : '⚪ متوقف'}
                        </button>
                      </td>

                      {/* Delete Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 transition"
                          title="حذف الإعلان"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">إنشاء وبث إعلان إداري جديد</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">عنوان الإعلان:</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: ترقية صيانة مبرمجة للخوادم أو إضافة اختبار جديد"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">نوع التنبيه:</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="info">ℹ️ إشعار عام (Information)</option>
                    <option value="success">🎉 ميزة جديدة (Update/Success)</option>
                    <option value="warning">⚠️ تنبيه تشغيلي (Warning)</option>
                    <option value="urgent">🚨 عاجل وهام (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">الفئة المستهدفة:</label>
                  <select
                    value={formData.target_tier}
                    onChange={(e) => setFormData({ ...formData, target_tier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">🌐 كافة العيادات والمشتركين</option>
                    <option value="solo_starter">باقة Solo Starter فقط</option>
                    <option value="multi_pro">باقة Multi-Pro Clinic فقط</option>
                    <option value="enterprise_dz">باقة Enterprise DZ فقط</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">نص ومحتوى الإعلان:</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows="4"
                  placeholder="اكتب تفاصيل التنبيه أو التوجيهات الموجهة للأطباء والعيادات..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 leading-relaxed"
                  required
                />
              </div>

              {/* Live Preview Box */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
                <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة فورية كما ستظهر في لوحات تحكم العيادات:</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs flex items-start gap-2.5">
                  <div className="mt-0.5">{getTypeStyle(formData.type).icon}</div>
                  <div>
                    <div className="font-bold text-white">{formData.title || 'عنوان الإعلان التجريبي'}</div>
                    <div className="text-slate-300 text-[11px] mt-0.5">{formData.message || 'نص الرسالة التنبيهية سيظهر هنا...'}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Megaphone className="w-3.5 h-3.5" />}
                  <span>بث ونشر الإعلان فوراً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
