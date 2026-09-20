import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Power,
  RefreshCw,
  Eye,
  AlertTriangle,
  Info,
  ShieldAlert,
  Sparkles,
  Wrench,
  CheckCircle2,
  Calendar,
  Layers,
  Send,
  X,
  ExternalLink
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function AnnouncementsBroadcastTab() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info', // info, warning, emergency, feature, maintenance
    display_mode: 'banner', // banner, modal, toast, maintenance
    target_specialty: 'all', // all, orthophony, psychology, psychomotricite
    target_tier: 'all',
    priority: 'normal', // normal, high, urgent
    action_label: '',
    action_url: '',
    dismissible: true,
    is_active: true,
    starts_at: '',
    expires_at: '',
  });

  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getBroadcasts();
      if (res.success) {
        setBroadcasts(res.broadcasts || []);
        setActiveCount(res.active_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch broadcasts:', err);
      showFeedback('error', err.message || 'فشل جلب الإعلانات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      showFeedback('error', 'يرجى ملء عنوان ونص الإعلان.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type || 'info',
        display_mode: formData.display_mode || 'banner',
        target_specialty: formData.target_specialty || 'all',
        target_tier: formData.target_tier || 'all',
        priority: formData.priority || 'normal',
        action_label: formData.action_label?.trim() || null,
        action_url: formData.action_url?.trim() || null,
        dismissible: Boolean(formData.dismissible),
        is_active: Boolean(formData.is_active),
        starts_at: formData.starts_at ? formData.starts_at : null,
        expires_at: formData.expires_at ? formData.expires_at : null,
      };

      const res = await superAdminApi.createBroadcast(payload);
      if (res.success) {
        showFeedback('success', res.message || 'تم نشر البث العام بنجاح!');
        setFormData({
          title: '',
          message: '',
          type: 'info',
          display_mode: 'banner',
          target_specialty: 'all',
          target_tier: 'all',
          priority: 'normal',
          action_label: '',
          action_url: '',
          dismissible: true,
          is_active: true,
          starts_at: '',
          expires_at: '',
        });
        await fetchBroadcasts();
      } else {
        throw new Error(res.message || 'فشل نشر البث.');
      }
    } catch (err) {
      console.error('Create broadcast error:', err);
      showFeedback('error', err.message || 'فشل نشر البث.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await superAdminApi.toggleBroadcastStatus(id);
      if (res.success) {
        showFeedback('success', res.message || 'تم تغيير حالة البث.');
        fetchBroadcasts();
      }
    } catch (err) {
      showFeedback('error', err.message || 'فشل تغيير حالة البث.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا البث الإعلاني نهائياً؟')) return;
    try {
      const res = await superAdminApi.deleteBroadcast(id);
      if (res.success) {
        showFeedback('success', res.message || 'تم حذف البث بنجاح.');
        fetchBroadcasts();
      }
    } catch (err) {
      showFeedback('error', err.message || 'فشل حذف البث.');
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 1. Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black shadow-inner">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>مركز البث والإعلانات العامة للعيادات</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Global Broadcast Hub 📢
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              إطلاق إعلانات التحديثات، تنبيهات الصيانة المجدولة، والتنبيهات السريرية الطارئة لكافة العيادات أو لتخصص محدد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-bold">الإعلانات النشطة حالياً:</span>
            <span className="font-mono text-emerald-400 font-bold">{activeCount}</span>
          </div>

          <button
            type="button"
            onClick={fetchBroadcasts}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 space-x-reverse ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 2. Composer & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Broadcast Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 pb-2 border-b border-slate-800">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>إنشاء وتوجيه بث إعلاني جديد</span>
          </h3>

          <form onSubmit={handleCreateBroadcast} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold">عنوان البث الإعلاني:</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="مثال: إطلاق بنك الروائز الفونولوجية، أو صيانة مجدولة للنظام..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold">نص الرسالة والتفاصيل:</label>
              <textarea
                required
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="اكتب تفاصيل التحديث أو التنبيه هنا..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">نوع البث:</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                >
                  <option value="info">📢 إعلان عام — General</option>
                  <option value="feature">💡 ميزة سريرية جديدة — New Feature</option>
                  <option value="maintenance">⚠️ صيانة مجدولة — Maintenance</option>
                  <option value="emergency">🚨 تنبيه أمني عاجل — Emergency</option>
                  <option value="warning">⚠️ تحذير تنظيمي — Warning</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">أسلوب الظهور في العيادة:</label>
                <select
                  value={formData.display_mode}
                  onChange={(e) => setFormData({ ...formData, display_mode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                >
                  <option value="banner">شريط علوي بارز — Banner</option>
                  <option value="modal">نافذة منبثقة عند الدخول — Modal</option>
                  <option value="toast">إشعار جانبي هادئ — Toast</option>
                  <option value="maintenance">شاشة إيقاف للصيانة — Maintenance</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">استهداف التخصص السريري:</label>
                <select
                  value={formData.target_specialty}
                  onChange={(e) => setFormData({ ...formData, target_specialty: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                >
                  <option value="all">كافة العيادات والتخصصات (الكل)</option>
                  <option value="orthophony">عيادات الأرطوفونيا والتخاطب فقط</option>
                  <option value="psychology">عيادات الفحص والعلاج النفسي فقط</option>
                  <option value="psychomotricite">عيادات التأهيل الحركي النفسي فقط</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">درجة الأهمية:</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white"
                >
                  <option value="normal">عادية — Normal</option>
                  <option value="high">مرتفعة — High</option>
                  <option value="urgent">عاجلة / قصوى — Urgent 🔴</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">نص الزر التفاعلي (اختياري):</label>
                <input
                  type="text"
                  value={formData.action_label}
                  onChange={(e) => setFormData({ ...formData, action_label: e.target.value })}
                  placeholder="مثال: تجربة الميزة، تفاصيل الصيانة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold">الرابط التفاعلي (URL):</label>
                <input
                  type="text"
                  value={formData.action_url}
                  onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                  placeholder="/tests أو https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-white placeholder-slate-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                <input
                  type="checkbox"
                  checked={formData.dismissible}
                  onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800"
                />
                <span>تمكين الطبيب من إغلاق الإشعار (Dismissible ✕)</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>إطلاق ونشر البث الآن</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Interactive Preview */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2 pb-2 border-b border-slate-800">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>معاينة بصرية واقعية حية (Live Client Preview)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              هكذا سيظهر الإعلان بالضبط في واجهة الطبيب المعالج والعيادات المستهدفة
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              {/* Banner Preview */}
              {formData.display_mode === 'banner' && (
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-lg ${
                  formData.type === 'emergency' ? 'bg-rose-950/40 border-rose-500/50 text-rose-200' :
                  formData.type === 'maintenance' ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' :
                  formData.type === 'feature' ? 'bg-purple-950/40 border-purple-500/50 text-purple-200' :
                  'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {formData.type === 'emergency' && <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />}
                    {formData.type === 'maintenance' && <Wrench className="w-5 h-5 text-amber-400 shrink-0" />}
                    {formData.type === 'feature' && <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />}
                    {formData.type === 'info' && <Megaphone className="w-5 h-5 text-indigo-400 shrink-0" />}

                    <div>
                      <div className="font-bold text-xs text-white">
                        {formData.title || 'عنوان الإعلان التجريبي'}
                      </div>
                      <div className="text-[11px] opacity-90">
                        {formData.message || 'نص الرسالة الإعلانية سيظهر هنا بوضوح وسلاسة.'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {formData.action_label && (
                      <span className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[10px] font-black cursor-pointer">
                        {formData.action_label}
                      </span>
                    )}
                    {formData.dismissible && (
                      <span className="p-1 rounded-lg text-white/60 hover:text-white cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Preview */}
              {formData.display_mode === 'modal' && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-3 text-center">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-white text-sm">
                    {formData.title || 'نافذة منبثقة تفاعلية'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {formData.message || 'تظهر هذه النافذة المنبثقة للطبيب عند تسجيل الدخول للعيادة لمرة واحدة.'}
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    {formData.action_label && (
                      <span className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                        {formData.action_label}
                      </span>
                    )}
                    <span className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs">
                      إغلاق ومتابعة
                    </span>
                  </div>
                </div>
              )}

              {/* Toast Preview */}
              {formData.display_mode === 'toast' && (
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="font-bold text-white">{formData.title || 'إشعار فوري لطيف'}</span>
                  </div>
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </div>
              )}

              {/* Maintenance Preview */}
              {formData.display_mode === 'maintenance' && (
                <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/50 text-center space-y-2">
                  <Wrench className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
                  <div className="font-black text-white text-xs">شاشة الصيانة الطارئة أو المجدولة</div>
                  <div className="text-[10px] text-amber-200">يتم إيقاف الواجهة مؤقتاً وعرض العد التنازلي لعودة السيرفر.</div>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center pt-2">
            يتم توثيق كافة البثوث آلياً في سجل التدقيق الجنائي والأمني (Audit Logs).
          </div>
        </div>
      </div>

      {/* 3. Broadcasts List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>سجل الإعلانات المجدولة والنشطة</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">الإجمالي: {broadcasts.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="p-4">العنوان والرسالة</th>
                <th className="p-4">النوع والنمط</th>
                <th className="p-4">الجمهور المستهدف</th>
                <th className="p-4">الأولوية</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">تاريخ الإنشاء</th>
                <th className="p-4 text-center">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    جاري تحميل البثوث...
                  </td>
                </tr>
              ) : broadcasts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد إعلانات مسجلة في النظام حالياً.
                  </td>
                </tr>
              ) : (
                broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-white text-sm">{b.title}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{b.message}</div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold">{b.type}</div>
                      <div className="text-[10px] text-slate-400 font-mono">نمط: {b.display_mode}</div>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                        {b.target_specialty === 'all' ? 'كافة التخصصات' : b.target_specialty}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300' :
                        b.priority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {b.priority}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggle(b.id)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition flex items-center gap-1.5 ${
                          b.is_active ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{b.is_active ? 'نشط 🟢' : 'معطل 🔴'}</span>
                      </button>
                    </td>

                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {new Date(b.created_at).toLocaleDateString('ar-DZ')}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition"
                        title="حذف البث"
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
    </div>
  );
}
