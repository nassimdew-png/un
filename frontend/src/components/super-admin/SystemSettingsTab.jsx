import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sliders,
  CreditCard,
  Key,
  ShieldAlert,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Mail,
  Phone,
  Power,
  Sparkles,
  Lock
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function SystemSettingsTab() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    payment_baridimob_rip: '',
    payment_baridimob_holder: '',
    payment_ccp_account: '',
    payment_phone: '',
    ai_openai_key: '',
    ai_gemini_key: '',
    ai_default_model: 'gemini-1.5-pro',
    maintenance_mode: 'false',
    maintenance_banner_text: '',
    platform_contact_email: '',
    platform_whatsapp: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getSystemSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await superAdminApi.updateSystemSettings(settings);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: res.message || 'تم حفظ وتطبيق جميع إعدادات النظام ومفاتيح الربط بنجاح.',
        });
      } else {
        setFeedback({ type: 'error', text: res.message || 'فشل حفظ الإعدادات.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'حدث خطأ أثناء حفظ الإعدادات.' });
    } finally {
      setSaving(false);
    }
  };

  const isMaintenanceActive = settings.maintenance_mode === 'true' || settings.maintenance_mode === true;

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
        <div className="text-sm font-semibold text-slate-400">جاري تحميل إعدادات وتكوين النظام...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Sliders className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">إعدادات النظام المركزية ومفاتيح الربط (Dynamic System Settings)</h2>
          </div>
          <p className="text-xs text-slate-400">
            تعديل بيانات الحسابات البريدية، مفاتيح الذكاء الاصطناعي، وتفعيل وضع الصيانة دون الحاجة لإعادة تشغيل السيرفر أو تعديل ملفات البيئة.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition flex items-center gap-2 disabled:opacity-50 self-start lg:self-auto"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'جاري الحفظ والتطبيق...' : 'حفظ وتحديث الإعدادات'}</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
          feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Maintenance Mode Card */}
      <div className={`p-6 rounded-3xl border transition ${
        isMaintenanceActive
          ? 'bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border-rose-500/50'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isMaintenanceActive ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>وضع الصيانة والتحديثات الشاملة (Maintenance Mode)</span>
                {isMaintenanceActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    مفعل الآن
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                عند التفعيل، سيتم إظهار شريط تنبيه للصيانة لجميع زوار وعيادات المنصة.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={isMaintenanceActive}
              onChange={(e) => handleChange('maintenance_mode', e.target.checked ? 'true' : 'false')}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">نص رسالة الصيانة المخصصة للعيادات والمستخدمين:</label>
          <input
            type="text"
            value={settings.maintenance_banner_text || ''}
            onChange={(e) => handleChange('maintenance_banner_text', e.target.value)}
            placeholder="مثال: المنصة قيد التحديث الإكلينيكي المجدول لمدة 30 دقيقة. سنعود للعمل قريباً."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Main Form Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Algerian Payment Settings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 font-bold text-sm text-white">
            <CreditCard className="w-4 h-4 text-teal-400" />
            <span>بيانات السداد والتحويل الجزائري (CCP & BaridiMob)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-bold">رقم RIP لخدمة بريدي موب (BaridiMob RIP):</label>
              <input
                type="text"
                value={settings.payment_baridimob_rip || ''}
                onChange={(e) => handleChange('payment_baridimob_rip', e.target.value)}
                placeholder="00799999002233445566"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">اسم صاحب الحساب المستفيد:</label>
              <input
                type="text"
                value={settings.payment_baridimob_holder || ''}
                onChange={(e) => handleChange('payment_baridimob_holder', e.target.value)}
                placeholder="PsyPro Platform SARL"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">رقم حساب البريد والمفتاح (CCP Account & Clé):</label>
              <input
                type="text"
                value={settings.payment_ccp_account || ''}
                onChange={(e) => handleChange('payment_ccp_account', e.target.value)}
                placeholder="22334455 Clé 88"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">رقم هاتف تأكيد واستقبال الوصولات:</label>
              <input
                type="text"
                value={settings.payment_phone || ''}
                onChange={(e) => handleChange('payment_phone', e.target.value)}
                placeholder="0550123456"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* AI Gateway Settings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 font-bold text-sm text-white">
            <Brain className="w-4 h-4 text-purple-400" />
            <span>بوابة الذكاء الاصطناعي (AI Gateway API Keys)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-bold flex items-center justify-between">
                <span>مفتاح Google Gemini API Key:</span>
                <span className="text-[10px] text-purple-400">موصى به للسرعة واللغة العربية</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={settings.ai_gemini_key || ''}
                  onChange={(e) => handleChange('ai_gemini_key', e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                />
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">مفتاح OpenAI API Key (GPT-4o):</label>
              <div className="relative">
                <input
                  type="password"
                  value={settings.ai_openai_key || ''}
                  onChange={(e) => handleChange('ai_openai_key', e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                />
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">النموذج الافتراضي لتوليد التقارير الإكلينيكية:</label>
              <select
                value={settings.ai_default_model || 'gemini-1.5-pro'}
                onChange={(e) => handleChange('ai_default_model', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
              >
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (الأسرع والأدق للغة العربية)</option>
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (استجابة فورية فائقة السرعة)</option>
                <option value="gpt-4o">OpenAI GPT-4o (Omni Clinical Engine)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">بريد الدعم والمساعدة:</label>
                <input
                  type="email"
                  value={settings.platform_contact_email || ''}
                  onChange={(e) => handleChange('platform_contact_email', e.target.value)}
                  placeholder="support@psypro.tech"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">واتساب الدعم العام:</label>
                <input
                  type="text"
                  value={settings.platform_whatsapp || ''}
                  onChange={(e) => handleChange('platform_whatsapp', e.target.value)}
                  placeholder="0550123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
