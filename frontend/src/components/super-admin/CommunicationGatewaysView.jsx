import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Smartphone,
  Mail,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  SlidersHorizontal,
  Server,
  Lock,
  Phone,
  Check,
  X
} from 'lucide-react';
import { communicationGatewayApi } from '../../api';

export default function CommunicationGatewaysView() {
  const [formData, setFormData] = useState({
    // Mail
    mail_driver: 'smtp',
    mail_host: 'smtp.gmail.com',
    mail_port: 587,
    mail_username: 'notifications@psypro.tech',
    mail_password: '',
    mail_encryption: 'tls',
    mail_from_address: 'noreply@psypro.tech',
    mail_from_name: 'PsyPro Tech Clinics Suite',
    is_mail_active: true,

    // SMS
    sms_provider: 'custom_http',
    sms_api_key: '',
    sms_sender_id: 'PsyProDZ',
    sms_api_url: 'https://api.sms-gateway.dz/v1/send',
    is_sms_active: false,

    // WhatsApp
    whatsapp_provider: 'whatsapp_cloud_api',
    whatsapp_instance_id: '',
    whatsapp_token: '',
    whatsapp_phone_number_id: '',
    whatsapp_sender_number: '+213550123456',
    is_whatsapp_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Sensitive fields show/hide toggles
  const [showMailPass, setShowMailPass] = useState(false);
  const [showSmsKey, setShowSmsKey] = useState(false);
  const [showWaToken, setShowWaToken] = useState(false);

  // Test inputs & states
  const [testEmailAddress, setTestEmailAddress] = useState('admin@psypro.tech');
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);

  const [testSmsNumber, setTestSmsNumber] = useState('0550123456');
  const [testingSms, setTestingSms] = useState(false);
  const [smsTestResult, setSmsTestResult] = useState(null);

  const [testWaNumber, setTestWaNumber] = useState('213550123456');
  const [testingWa, setTestingWa] = useState(false);
  const [waTestResult, setWaTestResult] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await communicationGatewayApi.getSettings();
      if (res && res.settings) {
        setFormData(res.settings);
      }
    } catch (err) {
      console.error('Failed to load communication settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await communicationGatewayApi.saveSettings(formData);
      setFeedback({ type: 'success', text: res.message || 'تم حفظ وتشفير إعدادات بوابات التواصل بنجاح!' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الإعدادات.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress) return;
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await communicationGatewayApi.testEmail(testEmailAddress);
      setEmailTestResult({ type: 'success', text: res.message });
    } catch (err) {
      setEmailTestResult({ type: 'error', text: err.message || 'فشل إرسال الإيميل التجريبي' });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSms = async () => {
    if (!testSmsNumber) return;
    setTestingSms(true);
    setSmsTestResult(null);
    try {
      const res = await communicationGatewayApi.testSms(testSmsNumber);
      setSmsTestResult({ type: 'success', text: res.message });
    } catch (err) {
      setSmsTestResult({ type: 'error', text: err.message || 'فشل إرسال SMS التجريبي' });
    } finally {
      setTestingSms(false);
    }
  };

  const handleTestWhatsapp = async () => {
    if (!testWaNumber) return;
    setTestingWa(true);
    setWaTestResult(null);
    try {
      const res = await communicationGatewayApi.testWhatsapp(testWaNumber);
      setWaTestResult({ type: 'success', text: res.message });
    } catch (err) {
      setWaTestResult({ type: 'error', text: err.message || 'فشل إرسال WhatsApp التجريبي' });
    } finally {
      setTestingWa(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-950 border border-emerald-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>COMMUNICATION & NOTIFICATIONS GATEWAY</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                مشفر ومؤمن 🔒
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              بوابات التواصل والربط (WhatsApp / SMS / البريد الإلكتروني)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              إدارة وتشفير قنوات الاتصال الرسمية للمنصة، ربط خوادم WhatsApp API لتأكيد المواعيد، بوابات الرسائل القصيرة SMS، وخوادم البريد SMTP مع إمكانية الفحص والتجربة المباشرة.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-xl shadow-emerald-600/30 self-start md:self-auto shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : '💾 حفظ وتشفير الإعدادات'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {feedback.text}
          </span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* CARD 1: WhatsApp Gateway */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">خادم ربط واتساب (WhatsApp)</h2>
                  <span className="text-[10px] text-emerald-400 font-mono">Meta / UltraMsg / GreenAPI</span>
                </div>
              </div>

              {/* Toggle switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_whatsapp_active}
                  onChange={(e) => setFormData({ ...formData, is_whatsapp_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">مزود خدمة الواتساب (Provider):</label>
                <select
                  value={formData.whatsapp_provider}
                  onChange={(e) => setFormData({ ...formData, whatsapp_provider: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="whatsapp_cloud_api">WhatsApp Cloud API (Meta Official)</option>
                  <option value="ultramsg">UltraMsg Gateway (Instance + Token)</option>
                  <option value="green_api">GreenAPI / Custom Webhook</option>
                </select>
              </div>

              {formData.whatsapp_provider === 'whatsapp_cloud_api' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Phone Number ID (Meta):</label>
                    <input
                      type="text"
                      value={formData.whatsapp_phone_number_id || ''}
                      onChange={(e) => setFormData({ ...formData, whatsapp_phone_number_id: e.target.value })}
                      placeholder="104928374928374"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Meta System User Permanent Token:</label>
                    <div className="relative">
                      <input
                        type={showWaToken ? 'text' : 'password'}
                        value={formData.whatsapp_token || ''}
                        onChange={(e) => setFormData({ ...formData, whatsapp_token: e.target.value })}
                        placeholder="EAAK..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-3 pl-10 py-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWaToken(!showWaToken)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        {showWaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">Instance ID:</label>
                    <input
                      type="text"
                      value={formData.whatsapp_instance_id || ''}
                      onChange={(e) => setFormData({ ...formData, whatsapp_instance_id: e.target.value })}
                      placeholder="instance_99482"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">API Token / Secret Key:</label>
                    <div className="relative">
                      <input
                        type={showWaToken ? 'text' : 'password'}
                        value={formData.whatsapp_token || ''}
                        onChange={(e) => setFormData({ ...formData, whatsapp_token: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-3 pl-10 py-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWaToken(!showWaToken)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        {showWaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">رقم هاتف المرسل المعتمد:</label>
                <input
                  type="text"
                  value={formData.whatsapp_sender_number || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp_sender_number: e.target.value })}
                  placeholder="+213550123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Test WhatsApp Section */}
          <div className="pt-4 border-t border-slate-800 space-y-2 bg-slate-950/40 p-3 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>فحص وإرسال واتساب تجريبي:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testWaNumber}
                onChange={(e) => setTestWaNumber(e.target.value)}
                placeholder="213550123456"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleTestWhatsapp}
                disabled={testingWa}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center gap-1 shadow"
              >
                {testingWa ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>فحص</span>
              </button>
            </div>

            {waTestResult && (
              <div
                className={`text-[10px] p-2 rounded-xl font-bold flex items-center gap-1.5 ${
                  waTestResult.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}
              >
                {waTestResult.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                <span>{waTestResult.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: SMS Gateway */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">بوابة الرسائل القصيرة (SMS)</h2>
                  <span className="text-[10px] text-amber-400 font-mono">Twilio / Local DZ / Infobip</span>
                </div>
              </div>

              {/* Toggle switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_sms_active}
                  onChange={(e) => setFormData({ ...formData, is_sms_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">نوع البوابة ومزود الـ SMS:</label>
                <select
                  value={formData.sms_provider}
                  onChange={(e) => setFormData({ ...formData, sms_provider: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="custom_http">بوابة SMS محلية (Algeria HTTP Gateway)</option>
                  <option value="twilio">Twilio SMS Global</option>
                  <option value="infobip">Infobip SMS</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">رابط البوابة (API Endpoint URL):</label>
                <input
                  type="text"
                  value={formData.sms_api_url || ''}
                  onChange={(e) => setFormData({ ...formData, sms_api_url: e.target.value })}
                  placeholder="https://api.sms-gateway.dz/v1/send"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">API Key / Token:</label>
                <div className="relative">
                  <input
                    type={showSmsKey ? 'text' : 'password'}
                    value={formData.sms_api_key || ''}
                    onChange={(e) => setFormData({ ...formData, sms_api_key: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-3 pl-10 py-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmsKey(!showSmsKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showSmsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">معرف اسم المرسل (Sender ID):</label>
                <input
                  type="text"
                  value={formData.sms_sender_id || ''}
                  onChange={(e) => setFormData({ ...formData, sms_sender_id: e.target.value })}
                  placeholder="PsyProDZ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Test SMS Section */}
          <div className="pt-4 border-t border-slate-800 space-y-2 bg-slate-950/40 p-3 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>فحص وإرسال SMS تجريبي:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testSmsNumber}
                onChange={(e) => setTestSmsNumber(e.target.value)}
                placeholder="0550123456"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleTestSms}
                disabled={testingSms}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold transition flex items-center gap-1 shadow"
              >
                {testingSms ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>فحص</span>
              </button>
            </div>

            {smsTestResult && (
              <div
                className={`text-[10px] p-2 rounded-xl font-bold flex items-center gap-1.5 ${
                  smsTestResult.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}
              >
                {smsTestResult.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                <span>{smsTestResult.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: SMTP Email Server */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">خادم البريد (SMTP Server)</h2>
                  <span className="text-[10px] text-indigo-400 font-mono">Gmail / Hostinger / Brevo</span>
                </div>
              </div>

              {/* Toggle switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_mail_active}
                  onChange={(e) => setFormData({ ...formData, is_mail_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">SMTP Host:</label>
                  <input
                    type="text"
                    value={formData.mail_host || ''}
                    onChange={(e) => setFormData({ ...formData, mail_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Port:</label>
                  <input
                    type="number"
                    value={formData.mail_port || 587}
                    onChange={(e) => setFormData({ ...formData, mail_port: parseInt(e.target.value) || 587 })}
                    placeholder="587"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">اسم المستخدم / البريد (Username):</label>
                <input
                  type="text"
                  value={formData.mail_username || ''}
                  onChange={(e) => setFormData({ ...formData, mail_username: e.target.value })}
                  placeholder="notifications@psypro.tech"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">كلمة المرور / App Password:</label>
                <div className="relative">
                  <input
                    type={showMailPass ? 'text' : 'password'}
                    value={formData.mail_password || ''}
                    onChange={(e) => setFormData({ ...formData, mail_password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-3 pl-10 py-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMailPass(!showMailPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showMailPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">التشفير:</label>
                  <select
                    value={formData.mail_encryption || 'tls'}
                    onChange={(e) => setFormData({ ...formData, mail_encryption: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="tls">TLS (Recommended)</option>
                    <option value="ssl">SSL</option>
                    <option value="none">بدون تشفير</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">اسم المرسل:</label>
                  <input
                    type="text"
                    value={formData.mail_from_name || ''}
                    onChange={(e) => setFormData({ ...formData, mail_from_name: e.target.value })}
                    placeholder="PsyPro Tech"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white text-[11px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Test Email Section */}
          <div className="pt-4 border-t border-slate-800 space-y-2 bg-slate-950/40 p-3 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>فحص وإرسال إيميل تجريبي:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="test@example.com"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center gap-1 shadow"
              >
                {testingEmail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>فحص</span>
              </button>
            </div>

            {emailTestResult && (
              <div
                className={`text-[10px] p-2 rounded-xl font-bold flex items-center gap-1.5 ${
                  emailTestResult.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}
              >
                {emailTestResult.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                <span>{emailTestResult.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
