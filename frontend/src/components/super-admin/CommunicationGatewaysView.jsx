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
  X,
  Copy,
  ExternalLink,
  Activity,
  Bot,
  UserCheck,
  Sparkles,
  Terminal,
  Plus,
  Trash2,
  Layers,
  Tag,
  KeyRound,
  Megaphone,
  Wrench,
  Info,
  ChevronRight,
  Play,
  Share2,
  HelpCircle
} from 'lucide-react';
import { communicationGatewayApi } from '../../api';

export default function CommunicationGatewaysView() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('templates'); // 'settings' | 'templates' | 'webhooks'

  const [formData, setFormData] = useState({
    // Mail
    mail_driver: 'smtp',
    mail_host: 'smtp.gmail.com',
    mail_port: 587,
    mail_username: 'notifications@psypro.tech',
    mail_password: '',
    mail_encryption: 'tls',
    mail_from_address: 'noreply@psypro.tech',
    mail_from_name: 'PsySnap Clinics Suite',
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
    whatsapp_webhook_verify_token: 'psypro_wa_webhook_verify_secret_2026',
    whatsapp_app_secret: '',
    whatsapp_business_account_id: '',
    whatsapp_webhook_url: 'https://psypro.tech/api/whatsapp/webhook',
    is_whatsapp_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Sensitive fields show/hide toggles
  const [showMailPass, setShowMailPass] = useState(false);
  const [showSmsKey, setShowSmsKey] = useState(false);
  const [showWaToken, setShowWaToken] = useState(false);
  const [showWaSecret, setShowWaSecret] = useState(false);

  // Copy badges
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

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

  // Webhook Logs & Live Activity
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [webhookStats, setWebhookStats] = useState({
    total_received: 0,
    total_replied: 0,
    total_delivered: 0,
    total_read: 0,
  });
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Webhook Simulator State
  const [simPhone, setSimPhone] = useState('213550123456');
  const [simSenderName, setSimSenderName] = useState('أمير التجريبي');
  const [simMessage, setSimMessage] = useState('1');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // =========================================================================
  // WHATSAPP TEMPLATES STUDIO STATE (META CATEGORIZATION)
  // =========================================================================
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('ALL'); // 'ALL' | 'UTILITY' | 'AUTHENTICATION' | 'MARKETING'
  const [searchTemplate, setSearchTemplate] = useState('');
  const [isLiveMeta, setIsLiveMeta] = useState(false);
  const [syncingDefaults, setSyncingDefaults] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Template Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewCustomParams, setPreviewCustomParams] = useState({});

  // Template Test Send Modal
  const [sendModalTemplate, setSendModalTemplate] = useState(null);
  const [sendModalPhone, setSendModalPhone] = useState('213550123456');
  const [sendModalParams, setSendModalParams] = useState({});
  const [sendingTestTemplate, setSendingTestTemplate] = useState(false);
  const [sendTestResult, setSendTestResult] = useState(null);

  // Create Template Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({
    name: '',
    title_ar: '',
    category: 'UTILITY',
    language: 'ar',
    header_text: '',
    body_text: '',
    footer_text: 'منصة PsyPro السريرية',
    buttons_type: 'NONE', // 'NONE' | 'QUICK_REPLY' | 'URL' | 'OTP'
    button_1_text: '',
    button_2_text: '',
    button_url: '',
  });
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [createModalError, setCreateModalError] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await communicationGatewayApi.getSettings();
      if (res && res.settings) {
        setFormData((prev) => ({ ...prev, ...res.settings }));
      }
    } catch (err) {
      console.error('Failed to load communication settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await communicationGatewayApi.getWhatsappLogs(30);
      if (res && res.logs) {
        setWebhookLogs(res.logs);
        if (res.stats) setWebhookStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load webhook logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await communicationGatewayApi.getTemplates();
      if (res && res.templates) {
        setTemplates(res.templates);
        setIsLiveMeta(!!res.is_live);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLogs();
    fetchTemplates();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await communicationGatewayApi.saveSettings(formData);
      setFeedback({ type: 'success', text: res.message || 'تم حفظ وتشفير إعدادات بوابات التواصل بنجاح!' });
      fetchTemplates(); // Refresh templates status after saving new credentials
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الإعدادات.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleGenerateVerifyToken = () => {
    const randomToken = 'psypro_wa_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    setFormData((prev) => ({ ...prev, whatsapp_webhook_verify_token: randomToken }));
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

  const handleSimulateWebhook = async () => {
    if (!simMessage) return;
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await communicationGatewayApi.simulateWhatsappWebhook({
        sender_phone: simPhone,
        sender_name: simSenderName,
        message_body: simMessage,
        message_type: 'text',
      });
      setSimResult({
        type: 'success',
        text: res.message,
        data: res.simulated_log,
      });
      fetchLogs(); // refresh log stream
    } catch (err) {
      setSimResult({ type: 'error', text: err.message || 'فشل تشغيل محاكاة خطاف الويب' });
    } finally {
      setSimulating(false);
    }
  };

  // Sync Default Templates
  const handleSyncDefaults = async () => {
    setSyncingDefaults(true);
    try {
      const res = await communicationGatewayApi.syncDefaultTemplates();
      setFeedback({ type: 'success', text: res.message || 'تمت مزامنة القوالب السريرية الافتراضية مع Meta بنجاح!' });
      fetchTemplates();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'تعذر مزامنة القوالب مع Meta.' });
    } finally {
      setSyncingDefaults(false);
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (templateName) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف القالب '${templateName}' من حساب Meta؟`)) return;
    try {
      const res = await communicationGatewayApi.deleteTemplate(templateName);
      setFeedback({ type: 'success', text: res.message || 'تم حذف القالب بنجاح.' });
      fetchTemplates();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حذف القالب.' });
    }
  };

  // Open Preview Modal
  const handleOpenPreview = (tmpl) => {
    setPreviewTemplate(tmpl);
    const initialParams = {};
    if (tmpl.sample_params && Array.isArray(tmpl.sample_params)) {
      tmpl.sample_params.forEach((paramVal, idx) => {
        initialParams[idx + 1] = paramVal;
      });
    }
    setPreviewCustomParams(initialParams);
  };

  // Open Test Send Modal
  const handleOpenTestSend = (tmpl) => {
    setSendModalTemplate(tmpl);
    setSendTestResult(null);
    const initialParams = {};
    if (tmpl.sample_params && Array.isArray(tmpl.sample_params)) {
      tmpl.sample_params.forEach((paramVal, idx) => {
        initialParams[idx + 1] = paramVal;
      });
    } else {
      // detect variables count from body
      const bodyComp = tmpl.components?.find((c) => c.type?.toUpperCase() === 'BODY');
      if (bodyComp && bodyComp.text) {
        const matches = bodyComp.text.match(/\{\{(\d+)\}\}/g) || [];
        matches.forEach((m, i) => {
          initialParams[i + 1] = `قيمة_${i + 1}`;
        });
      }
    }
    setSendModalParams(initialParams);
  };

  // Execute Test Send Template
  const handleExecuteTestSend = async () => {
    if (!sendModalTemplate || !sendModalPhone) return;
    setSendingTestTemplate(true);
    setSendTestResult(null);
    try {
      const bodyParamsArray = Object.values(sendModalParams);
      const res = await communicationGatewayApi.testSendTemplate({
        test_phone: sendModalPhone,
        template_name: sendModalTemplate.name,
        language: sendModalTemplate.language || 'ar',
        body_parameters: bodyParamsArray,
      });
      setSendTestResult({ type: 'success', text: res.message });
    } catch (err) {
      setSendTestResult({ type: 'error', text: err.message || 'فشل إرسال القالب التجريبي' });
    } finally {
      setSendingTestTemplate(false);
    }
  };

  // Create Template Submit
  const handleCreateTemplateSubmit = async (e) => {
    if (e) e.preventDefault();
    setCreatingTemplate(true);
    setCreateModalError(null);

    try {
      // Build components payload
      const components = [];

      // Header
      if (newTemplateData.header_text.trim()) {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: newTemplateData.header_text.trim(),
        });
      }

      // Body (Mandatory)
      if (!newTemplateData.body_text.trim()) {
        throw new Error('نص القالب الأساسي (Body) إلزامي.');
      }

      // Detect sample parameters for Meta example object
      const matches = newTemplateData.body_text.match(/\{\{(\d+)\}\}/g) || [];
      const sampleValues = matches.map((_, i) => `عينة_${i + 1}`);

      const bodyComp = {
        type: 'BODY',
        text: newTemplateData.body_text.trim(),
      };
      if (sampleValues.length > 0) {
        bodyComp.example = {
          body_text: [sampleValues],
        };
      }
      components.push(bodyComp);

      // Footer
      if (newTemplateData.footer_text.trim()) {
        components.push({
          type: 'FOOTER',
          text: newTemplateData.footer_text.trim(),
        });
      }

      // Buttons
      if (newTemplateData.buttons_type === 'QUICK_REPLY') {
        const btns = [];
        if (newTemplateData.button_1_text.trim()) {
          btns.push({ type: 'QUICK_REPLY', text: newTemplateData.button_1_text.trim() });
        }
        if (newTemplateData.button_2_text.trim()) {
          btns.push({ type: 'QUICK_REPLY', text: newTemplateData.button_2_text.trim() });
        }
        if (btns.length > 0) {
          components.push({ type: 'BUTTONS', buttons: btns });
        }
      } else if (newTemplateData.buttons_type === 'URL' && newTemplateData.button_url.trim()) {
        components.push({
          type: 'BUTTONS',
          buttons: [
            {
              type: 'URL',
              text: newTemplateData.button_1_text.trim() || 'فتح الرابط',
              url: newTemplateData.button_url.trim(),
            },
          ],
        });
      } else if (newTemplateData.buttons_type === 'OTP') {
        components.push({
          type: 'BUTTONS',
          buttons: [
            {
              type: 'OTP',
              otp_type: 'COPY_CODE',
              text: newTemplateData.button_1_text.trim() || 'نسخ رمز التحقق',
            },
          ],
        });
      }

      const res = await communicationGatewayApi.createTemplate({
        name: newTemplateData.name,
        category: newTemplateData.category,
        language: newTemplateData.language || 'ar',
        components: components,
      });

      setFeedback({ type: 'success', text: res.message || 'تم إرسال القالب إلى Meta بنجاح!' });
      setShowCreateModal(false);
      fetchTemplates();
    } catch (err) {
      setCreateModalError(err.message || 'فشل إرسال القالب إلى Meta.');
    } finally {
      setCreatingTemplate(false);
    }
  };

  // Helper to render formatted template body with injected variables
  const renderInjectedBody = (bodyText, paramsObj) => {
    if (!bodyText) return '';
    let text = bodyText;
    Object.keys(paramsObj).forEach((key) => {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), paramsObj[key]);
    });
    return text;
  };

  // Filtered templates
  const filteredTemplates = templates.filter((t) => {
    const matchCategory = templateCategoryFilter === 'ALL' || t.category === templateCategoryFilter;
    const matchSearch =
      !searchTemplate ||
      t.name.toLowerCase().includes(searchTemplate.toLowerCase()) ||
      (t.title_ar && t.title_ar.includes(searchTemplate)) ||
      (t.description_ar && t.description_ar.includes(searchTemplate));
    return matchCategory && matchSearch;
  });

  const categoryCounts = {
    ALL: templates.length,
    UTILITY: templates.filter((t) => t.category === 'UTILITY').length,
    AUTHENTICATION: templates.filter((t) => t.category === 'AUTHENTICATION').length,
    MARKETING: templates.filter((t) => t.category === 'MARKETING').length,
  };

  return (
    <div className="space-y-8 font-sans text-right" dir="rtl">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-950 border border-emerald-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>META WHATSAPP CLOUD API & TEMPLATES SUITE</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                تصنيف ميتا المعياري: Utility 🛠️ | Auth 🔐 | Marketing 📢
              </span>
              {isLiveMeta ? (
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/30 px-2.5 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Meta WABA Live Connected</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  📦 وضع القوالب السريرية الجاهزة
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              بوابات التواصل واستوديو قوالب واتساب كلاود
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              إدارة تكامل Meta WhatsApp Cloud API v20.0 الرسمي، تصنيف القوالب السريرية المعتمدة (تأكيد وتذكير المواعيد، روابط المقاييس، الواجبات المنزلية، وصولات السداد، ورموز OTP)، وخطافات الويب التفاعلية.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => setShowGuideModal(true)}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>دليل تصنيف ميتا 📖</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-xl shadow-emerald-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : '💾 حفظ وتشفير الإعدادات'}</span>
            </button>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
              activeTab === 'templates'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>استوديو قوالب واتساب كلاود ({categoryCounts.ALL})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>إعدادات البوابات (Meta WhatsApp / SMS / SMTP)</span>
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 ${
              activeTab === 'webhooks'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>قمرة خطافات الويب والمحاكي التفاعلي</span>
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
          <div className="flex items-center space-x-2 space-x-reverse">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: WHATSAPP TEMPLATES STUDIO (META CATEGORIZATION ENGINE)             */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Action Bar & Categorization Filter */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTemplateCategoryFilter('ALL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    templateCategoryFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>الكل ({categoryCounts.ALL})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateCategoryFilter('UTILITY')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    templateCategoryFilter === 'UTILITY'
                      ? 'bg-teal-500 text-slate-950 shadow font-black'
                      : 'bg-teal-950/40 text-teal-300 hover:bg-teal-900/40 border border-teal-500/30'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>🛠️ الخدمية والمعاملات (UTILITY - {categoryCounts.UTILITY})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateCategoryFilter('AUTHENTICATION')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    templateCategoryFilter === 'AUTHENTICATION'
                      ? 'bg-violet-500 text-white shadow font-black'
                      : 'bg-violet-950/40 text-violet-300 hover:bg-violet-900/40 border border-violet-500/30'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>🔐 المصادقة والـ OTP (AUTH - {categoryCounts.AUTHENTICATION})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateCategoryFilter('MARKETING')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    templateCategoryFilter === 'MARKETING'
                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                      : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/40 border border-amber-500/30'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>📢 التسويقية والتوعوية (MARKETING - {categoryCounts.MARKETING})</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={searchTemplate}
                  onChange={(e) => setSearchTemplate(e.target.value)}
                  placeholder="بحث في القوالب بالاسم أو النص..."
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-56"
                />

                <button
                  type="button"
                  onClick={handleSyncDefaults}
                  disabled={syncingDefaults}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                  title="نشر ومزامنة كافة القوالب السريرية الجاهزة إلى حساب Meta بنقرة واحدة"
                >
                  <Zap className={`w-3.5 h-3.5 ${syncingDefaults ? 'animate-spin' : 'fill-current'}`} />
                  <span>{syncingDefaults ? 'جاري المزامنة...' : 'نشر الافتراضيات لـ Meta'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>قالب مخصص جديد</span>
                </button>

                <button
                  type="button"
                  onClick={fetchTemplates}
                  disabled={loadingTemplates}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="تحديث القوالب"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingTemplates ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Meta Category Info Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-400" />
                  <span>قواعد تصنيف ميتا الرسمية لتفادي رفض القوالب (Meta Template Guidelines):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Meta Graph API v20.0 Compliant</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] leading-relaxed">
                <div className="p-2.5 rounded-xl bg-teal-950/30 border border-teal-500/20 text-teal-200 space-y-1">
                  <span className="font-bold block text-teal-300">1️⃣ قوالب UTILITY (الخدمية):</span>
                  <p className="text-slate-300">
                    مخصصة حصراً لمعاملات محددة مطلوبة من المريض (تذكير موعد، رابط استبيان، وصل دفع، واجب منزلي). <strong className="text-amber-300">ممنوع منعاً باتاً</strong> إدراج أي عروض ترويجية أو كلمات تسويقية وإلا سيتم رفضها أو تحويلها لـ Marketing.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-violet-950/30 border border-violet-500/20 text-violet-200 space-y-1">
                  <span className="font-bold block text-violet-300">2️⃣ قوالب AUTHENTICATION (المصادقة):</span>
                  <p className="text-slate-300">
                    مخصصة لرموز التحقق OTP المؤقتة لفتح الملف الطبي أو تسجيل الدخول السري. تتضمن زراً مدمجاً لنسخ الرمز بنقرة واحدة (Copy Code)، ولا يُسمح فيها بروابط خارجية داخل النص.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-amber-200 space-y-1">
                  <span className="font-bold block text-amber-300">3️⃣ قوالب MARKETING (التسويقية والتوعوية):</span>
                  <p className="text-slate-300">
                    تشمل الرسائل الترحيبية بالعيادة، نصائح التوعية النفسية والأرطوفونية، واطمئنان المتابعة الدورية بعد انتهاء البرنامج العلاجي لزيادة استبقاء المرضى.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {loadingTemplates ? (
              <div className="col-span-full p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400 mb-3" />
                <p className="text-sm font-bold">جاري جلب وفحص قوالب واتساب كلاود وتصنيفاتها...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="col-span-full p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-bold">لا توجد قوالب تطابق الفلتر المحدد.</p>
                <button
                  onClick={handleSyncDefaults}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow"
                >
                  نشر القوالب السريرية الافتراضية الآن
                </button>
              </div>
            ) : (
              filteredTemplates.map((tmpl) => {
                const headerComp = tmpl.components?.find((c) => c.type?.toUpperCase() === 'HEADER');
                const bodyComp = tmpl.components?.find((c) => c.type?.toUpperCase() === 'BODY');
                const footerComp = tmpl.components?.find((c) => c.type?.toUpperCase() === 'FOOTER');
                const buttonsComp = tmpl.components?.find((c) => c.type?.toUpperCase() === 'BUTTONS');

                return (
                  <div
                    key={tmpl.name}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition group"
                  >
                    <div className="space-y-3">
                      {/* Card Header & Badges */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-white group-hover:text-emerald-300 transition">
                            {tmpl.title_ar || tmpl.name}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400 block">{tmpl.name}</span>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {/* Category Badge */}
                          {tmpl.category === 'UTILITY' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              🛠️ UTILITY
                            </span>
                          ) : tmpl.category === 'AUTHENTICATION' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              🔐 AUTH (OTP)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              📢 MARKETING
                            </span>
                          )}

                          {/* Status Badge */}
                          {tmpl.status === 'APPROVED' ? (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>معتمد في Meta</span>
                            </span>
                          ) : tmpl.status === 'PENDING' ? (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              <span>قيد مراجعة Meta</span>
                            </span>
                          ) : tmpl.status === 'REJECTED' ? (
                            <span className="text-[9px] font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              ❌ مرفوض
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                              📦 جاهز للنشر
                            </span>
                          )}
                        </div>
                      </div>

                      {tmpl.description_ar && (
                        <p className="text-[11px] text-slate-400 leading-snug">{tmpl.description_ar}</p>
                      )}

                      {/* Mini Preview Box */}
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                        {headerComp && headerComp.text && (
                          <div className="text-[11px] font-bold text-emerald-400 border-b border-slate-800/60 pb-1">
                            {headerComp.text}
                          </div>
                        )}

                        {bodyComp && bodyComp.text && (
                          <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap font-sans">
                            {bodyComp.text}
                          </p>
                        )}

                        {footerComp && footerComp.text && (
                          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                            {footerComp.text}
                          </div>
                        )}

                        {buttonsComp && buttonsComp.buttons && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {buttonsComp.buttons.map((btn, bIdx) => (
                              <span
                                key={bIdx}
                                className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1"
                              >
                                {btn.type === 'OTP' || btn.otp_type === 'COPY_CODE' ? (
                                  <Copy className="w-2.5 h-2.5" />
                                ) : btn.type === 'URL' ? (
                                  <ExternalLink className="w-2.5 h-2.5" />
                                ) : (
                                  <MessageSquare className="w-2.5 h-2.5" />
                                )}
                                <span>{btn.text}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(tmpl)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>معاينة حية</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenTestSend(tmpl)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال تجريبي</span>
                        </button>
                      </div>

                      {tmpl.is_custom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tmpl.name)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition"
                          title="حذف القالب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GATEWAY CONFIGURATIONS (META WA, SMS, SMTP)                        */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* CARD 1: WhatsApp Gateway Setup */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5 space-x-reverse">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">خادم واتساب الرسمي (Meta API)</h2>
                    <span className="text-[10px] text-emerald-400 font-mono">WhatsApp Cloud API v20.0</span>
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
                      <label className="text-slate-300 font-bold">WABA ID (WhatsApp Business Account ID):</label>
                      <input
                        type="text"
                        value={formData.whatsapp_business_account_id || ''}
                        onChange={(e) => setFormData({ ...formData, whatsapp_business_account_id: e.target.value })}
                        placeholder="102938475610293"
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

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Meta App Secret (للمصادقة الرقمية HMAC):</label>
                      <div className="relative">
                        <input
                          type={showWaSecret ? 'text' : 'password'}
                          value={formData.whatsapp_app_secret || ''}
                          onChange={(e) => setFormData({ ...formData, whatsapp_app_secret: e.target.value })}
                          placeholder="••••••••••••••••••••••••"
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-3 pl-10 py-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowWaSecret(!showWaSecret)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          {showWaSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

                {/* Webhook Meta Configuration Box */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3 bg-emerald-950/20 p-3 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>إعدادات Webhook في Meta Dashboard:</span>
                    </span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      HTTPS Live
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono">Callback URL (الصقه في Meta):</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={formData.whatsapp_webhook_url || 'https://psypro.tech/api/whatsapp/webhook'}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-emerald-300 font-mono text-[10px] select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(formData.whatsapp_webhook_url || 'https://psypro.tech/api/whatsapp/webhook', 'url')}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="نسخ الرابط"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-slate-400 font-mono">Verify Token (رمز التحقق):</label>
                      <button
                        type="button"
                        onClick={handleGenerateVerifyToken}
                        className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        توليد رمز جديد ↺
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={formData.whatsapp_webhook_verify_token || ''}
                        onChange={(e) => setFormData({ ...formData, whatsapp_webhook_verify_token: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-white font-mono text-[10px]"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(formData.whatsapp_webhook_verify_token || '', 'token')}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="نسخ الرمز"
                      >
                        {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
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
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">مزود خدمة SMS (Provider):</label>
                  <select
                    value={formData.sms_provider}
                    onChange={(e) => setFormData({ ...formData, sms_provider: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="custom_http">Custom HTTP Gateway (Local Algerian Provider)</option>
                    <option value="twilio">Twilio SMS API</option>
                    <option value="infobip">Infobip Enterprise SMS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">اسم المرسل (Sender ID):</label>
                  <input
                    type="text"
                    value={formData.sms_sender_id || ''}
                    onChange={(e) => setFormData({ ...formData, sms_sender_id: e.target.value })}
                    placeholder="PsyProDZ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">رابط البوابة (Endpoint URL):</label>
                  <input
                    type="text"
                    value={formData.sms_api_url || ''}
                    onChange={(e) => setFormData({ ...formData, sms_api_url: e.target.value })}
                    placeholder="https://api.sms-gateway.dz/v1/send"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">مفتاح الربط (API Key / Auth Token):</label>
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

          {/* CARD 3: Email SMTP Gateway */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5 space-x-reverse">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">خادم البريد (SMTP)</h2>
                    <span className="text-[10px] text-indigo-400 font-mono">Google / SendGrid / Custom</span>
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
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-slate-300 font-bold">مضيف SMTP (Host):</label>
                    <input
                      type="text"
                      value={formData.mail_host || ''}
                      onChange={(e) => setFormData({ ...formData, mail_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">المنفذ (Port):</label>
                    <input
                      type="number"
                      value={formData.mail_port || 587}
                      onChange={(e) => setFormData({ ...formData, mail_port: parseInt(e.target.value, 10) })}
                      placeholder="587"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">اسم المستخدم (Username):</label>
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
                    <label className="text-slate-300 font-bold">التشفير (Encryption):</label>
                    <select
                      value={formData.mail_encryption}
                      onChange={(e) => setFormData({ ...formData, mail_encryption: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500 text-[11px]"
                    >
                      <option value="tls">TLS (Recommended)</option>
                      <option value="ssl">SSL</option>
                      <option value="">بدون تشفير (None)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">اسم المرسل الظاهر:</label>
                    <input
                      type="text"
                      value={formData.mail_from_name || ''}
                      onChange={(e) => setFormData({ ...formData, mail_from_name: e.target.value })}
                      placeholder="PsySnap"
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
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WEBHOOKS HUB & SIMULATOR                                           */}
      {/* ========================================================================= */}
      {activeTab === 'webhooks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Bot className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-black text-white">
                  قمرة خطافات واتساب كلاود التفاعلية (Meta Webhook Console & Simulator)
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                مراقبة حركة الرسائل الواردة لحظياً من المرضى، استجابات تأكيد وإلغاء المواعيد، الفرز والرد الآلي الذكي، مع أداة محاكاة لاختبار الربط دون انتظار رسائل حقيقية.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                <span>تحديث السجل</span>
              </button>
            </div>
          </div>

          {/* Telemetry Counter Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي الرسائل الواردة</span>
              <span className="text-2xl font-black text-white font-mono">{webhookStats.total_received}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold block">ردود آلية ناجحة</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{webhookStats.total_replied}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-teal-400 font-bold block">إشعارات تسليم (Delivered)</span>
              <span className="text-2xl font-black text-teal-400 font-mono">{webhookStats.total_delivered}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-indigo-400 font-bold block">إشعارات قراءة (Read)</span>
              <span className="text-2xl font-black text-indigo-400 font-mono">{webhookStats.total_read}</span>
            </div>
          </div>

          {/* Interactive Webhook Simulator */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>محاكي اختبار خطافات الويب والرد السريري (Interactive Webhook Simulator):</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                يحاكي إشعار Meta JSON الحقيقي ويعالج تأكيد المواعيد والفرز الآلي
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSimMessage('1')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
              >
                <span>1️⃣ تأكيد موعد سريري</span>
              </button>
              <button
                type="button"
                onClick={() => setSimMessage('2')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1"
              >
                <span>2️⃣ اعتذار وإلغاء موعد</span>
              </button>
              <button
                type="button"
                onClick={() => setSimMessage('عندي طفل عمره 4 سنوات ومازال لا ينطق')}
                className="px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold transition flex items-center gap-1"
              >
                <span>🗣️ استفسار أرطوفونيا ونطق</span>
              </button>
              <button
                type="button"
                onClick={() => setSimMessage('أريد فحص تشخيصي للتوحد وفرط الحركة')}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1"
              >
                <span>👶 استفسار توحد وفرط حركة</span>
              </button>
              <button
                type="button"
                onClick={() => setSimMessage('أشعر بحزن عميق وقلق متواصل وضيق في التنفس')}
                className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center gap-1"
              >
                <span>🩺 استشارة نفسية وعلاج CBT</span>
              </button>
              <button
                type="button"
                onClick={() => setSimMessage('أشعر برغبة في إنهاء حياتي والانتحار')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1"
              >
                <span>🚨 تنبيه أمان عاجل (Red Alert)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">رقم هاتف المريض المرسل:</label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  placeholder="213550123456"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">اسم المرسل الظاهر:</label>
                <input
                  type="text"
                  value={simSenderName}
                  onChange={(e) => setSimSenderName(e.target.value)}
                  placeholder="أمير التجريبي"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">نص الرسالة الواردة:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    placeholder="1 أو نص الاستفسار"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-emerald-500 font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleSimulateWebhook}
                    disabled={simulating}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 shrink-0"
                  >
                    {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
                    <span>محاكاة الإرسال</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Simulation Output Card */}
            {simResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
                  simResult.type === 'success'
                    ? 'bg-slate-950 border-emerald-500/40 text-slate-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>نتيجة استجابة خطاف الويب Webhook:</span>
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                    HTTP 200 OK — EVENT_RECEIVED
                  </span>
                </div>

                {simResult.data?.auto_reply_sent && (
                  <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/20 space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold block flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      <span>الرد الآلي الذي تم إرساله للمريض على واتساب:</span>
                    </span>
                    <p className="text-xs whitespace-pre-wrap font-sans text-emerald-100 leading-relaxed">
                      {simResult.data.auto_reply_sent}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                  <span>المريض المطابق: {simResult.data?.patient_id ? `#${simResult.data.patient_id}` : 'غير مسجل مسبقاً'}</span>
                  <span>•</span>
                  <span>الحالة: {simResult.data?.status}</span>
                  <span>•</span>
                  <span>رقم الرسالة: {simResult.data?.message_id}</span>
                </div>
              </div>
            )}
          </div>

          {/* Live Incoming Webhook Stream Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-400" />
                <span>سجل أحداث خطافات الويب والرسائل الواردة (Live Event Log):</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                عرض آخر 30 حدث وارد
              </span>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-900/80 text-slate-400 text-[10px] font-bold border-b border-slate-800 sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="p-3">التوقيت</th>
                      <th className="p-3">نوع الحدث</th>
                      <th className="p-3">المرسل / الهاتف</th>
                      <th className="p-3">نص الرسالة الواردة</th>
                      <th className="p-3">المريض المطابق</th>
                      <th className="p-3">حالة التسليم والرد</th>
                      <th className="p-3">الرد الآلي المرسل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {webhookLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-500">
                          {loadingLogs ? 'جاري تحميل السجلات...' : 'لا توجد رسائل واتساب واردة مسجلة حتى الآن. استخدم المحاكي أعلاه لتجربة تدفق البيانات.'}
                        </td>
                      </tr>
                    ) : (
                      webhookLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/40 transition">
                          <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleTimeString('ar-DZ')}
                            <span className="block text-[9px] text-slate-600">
                              {new Date(log.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {log.event_type === 'incoming_message' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                💬 رسالة واردة
                              </span>
                            ) : log.event_type === 'status_update' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                ✓ إشعار حالة
                              </span>
                            ) : log.event_type === 'verification' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                🛡️ فحص Challenge
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                ⚠️ استثناء
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-xs whitespace-nowrap">
                            <span className="text-white font-bold block">{log.sender_name || 'واتساب'}</span>
                            <span className="text-[10px] text-slate-500">{log.sender_phone || '---'}</span>
                          </td>
                          <td className="p-3 max-w-xs text-xs font-semibold text-slate-200">
                            {log.message_body || '---'}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {log.patient ? (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 w-fit">
                                <UserCheck className="w-3 h-3" />
                                <span>{log.patient.first_name} {log.patient.last_name} (#{log.patient.id})</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">غير مرتبط</span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {log.status === 'replied' ? (
                              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">
                                ✓✓ تم الرد الآلي
                              </span>
                            ) : log.status === 'delivered' ? (
                              <span className="text-[10px] text-teal-300 font-bold bg-teal-500/20 px-2 py-0.5 rounded">
                                ✓✓ تم التسليم
                              </span>
                            ) : log.status === 'read' ? (
                              <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/20 px-2 py-0.5 rounded">
                                ✓✓ تمت القراءة
                              </span>
                            ) : log.status === 'verified' ? (
                              <span className="text-[10px] text-emerald-400 font-bold">
                                ✓ ناجح
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">
                                {log.status || 'مستلم'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 max-w-xs text-[11px] text-emerald-300 truncate" title={log.auto_reply_sent || ''}>
                            {log.auto_reply_sent ? (
                              <span className="block truncate font-mono text-[10px]">
                                {log.auto_reply_sent}
                              </span>
                            ) : (
                              <span className="text-slate-600">---</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: LIVE PHONE SCREEN MOCKUP PREVIEW                                 */}
      {/* ========================================================================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">{previewTemplate.title_ar || previewTemplate.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">معاينة حية للقالب على هاتف المريض</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Smartphone Simulation Container */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* WhatsApp Phone Mockup */}
              <div className="max-w-xs mx-auto rounded-[32px] bg-slate-950 border-4 border-slate-800 shadow-2xl overflow-hidden">
                {/* Phone Top Notch */}
                <div className="bg-emerald-900/90 text-white p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 border border-emerald-500 flex items-center justify-center font-bold text-xs">
                      🩺
                    </div>
                    <div>
                      <span className="text-xs font-bold block">PsyPro Clinics</span>
                      <span className="text-[9px] text-emerald-200 block">حساب أعمال رسمي معتمد ✓</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-200">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Chat Background & Message Bubble */}
                <div className="p-3 bg-slate-900 min-h-[300px] flex flex-col justify-end space-y-2">
                  <div className="bg-emerald-950/80 border border-emerald-500/30 rounded-2xl rounded-tl-sm p-3.5 text-right space-y-2 shadow">
                    {/* Header Component */}
                    {previewTemplate.components?.find((c) => c.type?.toUpperCase() === 'HEADER')?.text && (
                      <div className="text-xs font-black text-emerald-300 border-b border-emerald-500/20 pb-1.5">
                        {previewTemplate.components.find((c) => c.type?.toUpperCase() === 'HEADER').text}
                      </div>
                    )}

                    {/* Body Component with Injected Parameters */}
                    <p className="text-xs text-slate-100 whitespace-pre-wrap leading-relaxed font-sans">
                      {renderInjectedBody(
                        previewTemplate.components?.find((c) => c.type?.toUpperCase() === 'BODY')?.text || '',
                        previewCustomParams
                      )}
                    </p>

                    {/* Footer Component */}
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                      <span>{previewTemplate.components?.find((c) => c.type?.toUpperCase() === 'FOOTER')?.text || 'PsyPro'}</span>
                      <span className="font-mono text-[9px] text-slate-500">10:30 ✓✓</span>
                    </div>

                    {/* Action Buttons */}
                    {previewTemplate.components?.find((c) => c.type?.toUpperCase() === 'BUTTONS')?.buttons && (
                      <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
                        {previewTemplate.components
                          .find((c) => c.type?.toUpperCase() === 'BUTTONS')
                          .buttons.map((btn, bIdx) => (
                            <div
                              key={bIdx}
                              className="p-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-900/90 text-emerald-200 text-[11px] font-bold text-center border border-emerald-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              {btn.type === 'OTP' || btn.otp_type === 'COPY_CODE' ? (
                                <Copy className="w-3 h-3 text-emerald-300" />
                              ) : btn.type === 'URL' ? (
                                <ExternalLink className="w-3 h-3 text-emerald-300" />
                              ) : (
                                <MessageSquare className="w-3 h-3 text-emerald-300" />
                              )}
                              <span>{btn.text}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Parameter Tweaker Inputs */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 block">
                  تجربة تغيير متغيرات القالب (Live Parameter Customizer):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.keys(previewCustomParams).map((paramIndex) => (
                    <div key={paramIndex} className="space-y-0.5">
                      <label className="text-[10px] font-mono text-emerald-400 font-bold">{`{{${paramIndex}}}`}:</label>
                      <input
                        type="text"
                        value={previewCustomParams[paramIndex]}
                        onChange={(e) =>
                          setPreviewCustomParams({ ...previewCustomParams, [paramIndex]: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white font-sans focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const tmpl = previewTemplate;
                  setPreviewTemplate(null);
                  handleOpenTestSend(tmpl);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال تجريبي الآن</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TEST SEND TEMPLATE MODAL                                         */}
      {/* ========================================================================= */}
      {sendModalTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Send className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">إرسال قالب تجريبي عبر واتساب كلاود</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{sendModalTemplate.name}</span>
                </div>
              </div>
              <button
                onClick={() => setSendModalTemplate(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">رقم هاتف المستلم (مع كود الدولة):</label>
                <input
                  type="text"
                  value={sendModalPhone}
                  onChange={(e) => setSendModalPhone(e.target.value)}
                  placeholder="213550123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500">مثال للجزائر: 213550123456 أو 0550123456</span>
              </div>

              {/* Dynamic Parameter Inputs */}
              {Object.keys(sendModalParams).length > 0 && (
                <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    قيم المتغيرات المطلوبة في نص القالب:
                  </span>
                  <div className="space-y-2">
                    {Object.keys(sendModalParams).map((pIndex) => (
                      <div key={pIndex} className="space-y-0.5">
                        <label className="text-[10px] font-mono text-emerald-400 font-bold">{`المتغير {{${pIndex}}}`}:</label>
                        <input
                          type="text"
                          value={sendModalParams[pIndex]}
                          onChange={(e) => setSendModalParams({ ...sendModalParams, [pIndex]: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sendTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    sendTestResult.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {sendTestResult.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{sendTestResult.text}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleExecuteTestSend}
                disabled={sendingTestTemplate || !sendModalPhone}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow"
              >
                {sendingTestTemplate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{sendingTestTemplate ? 'جاري الإرسال...' : 'إرسال القالب الآن'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSendModalTemplate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE NEW TEMPLATE MODAL                                        */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Plus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">إنشاء قالب جديد مطابق لمعايير Meta الرسمية</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Meta WhatsApp Cloud Template Creator</span>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplateSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {createModalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createModalError}</span>
                </div>
              )}

              {/* Category Selector */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">تصنيف القالب المعياري (Meta Category):</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTemplateData({ ...newTemplateData, category: 'UTILITY' })}
                    className={`p-3 rounded-2xl border text-center transition ${
                      newTemplateData.category === 'UTILITY'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs">🛠️ UTILITY</span>
                    <span className="text-[10px] block opacity-80">خدمي / معاملات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTemplateData({ ...newTemplateData, category: 'AUTHENTICATION' })}
                    className={`p-3 rounded-2xl border text-center transition ${
                      newTemplateData.category === 'AUTHENTICATION'
                        ? 'bg-violet-500/20 border-violet-500 text-violet-300 font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs">🔐 AUTH</span>
                    <span className="text-[10px] block opacity-80">مصادقة ورمز OTP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTemplateData({ ...newTemplateData, category: 'MARKETING' })}
                    className={`p-3 rounded-2xl border text-center transition ${
                      newTemplateData.category === 'MARKETING'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs">📢 MARKETING</span>
                    <span className="text-[10px] block opacity-80">تسويق وتوعية</span>
                  </button>
                </div>
              </div>

              {/* Name & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">اسم القالب بالإنجليزية (Meta Slug):</label>
                  <input
                    type="text"
                    required
                    value={newTemplateData.name}
                    onChange={(e) =>
                      setNewTemplateData({
                        ...newTemplateData,
                        name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                      })
                    }
                    placeholder="clinic_followup_alert"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">أحرف صغيرة وأرقام وشرطة سفلية فقط</span>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">اللغة (Language):</label>
                  <select
                    value={newTemplateData.language}
                    onChange={(e) => setNewTemplateData({ ...newTemplateData, language: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ar">العربية (Arabic - ar)</option>
                    <option value="fr">الفرنسية (French - fr)</option>
                    <option value="en_US">الإنجليزية (English US - en_US)</option>
                  </select>
                </div>
              </div>

              {/* Header Text */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">عنوان الترويسة Header (اختياري):</label>
                <input
                  type="text"
                  value={newTemplateData.header_text}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, header_text: e.target.value })}
                  placeholder="🩺 إشعار طبي سريري"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Body Text */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">نص القالب الأساسي Body (إلزامي):</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setNewTemplateData({
                          ...newTemplateData,
                          body_text: newTemplateData.body_text + ' {{1}}',
                        })
                      }
                      className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold hover:bg-emerald-500/30"
                    >
                      + {`{{1}}`}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewTemplateData({
                          ...newTemplateData,
                          body_text: newTemplateData.body_text + ' {{2}}',
                        })
                      }
                      className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold hover:bg-emerald-500/30"
                    >
                      + {`{{2}}`}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewTemplateData({
                          ...newTemplateData,
                          body_text: newTemplateData.body_text + ' {{3}}',
                        })
                      }
                      className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold hover:bg-emerald-500/30"
                    >
                      + {`{{3}}`}
                    </button>
                  </div>
                </div>
                <textarea
                  required
                  rows={4}
                  value={newTemplateData.body_text}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, body_text: e.target.value })}
                  placeholder="مرحباً بك {{1}}، نود إعلامكم بـ {{2}} في عيادة {{3}}."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-sans leading-relaxed focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* Footer Text */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">التذييل Footer (اختياري):</label>
                <input
                  type="text"
                  value={newTemplateData.footer_text}
                  onChange={(e) => setNewTemplateData({ ...newTemplateData, footer_text: e.target.value })}
                  placeholder="منصة PsyPro السريرية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Buttons Type */}
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <label className="text-slate-300 font-bold block">أزرار الإجراء التفاعلي (Interactive Buttons):</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTemplateData({ ...newTemplateData, buttons_type: 'NONE' })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      newTemplateData.buttons_type === 'NONE'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    بدون أزرار
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTemplateData({ ...newTemplateData, buttons_type: 'QUICK_REPLY' })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      newTemplateData.buttons_type === 'QUICK_REPLY'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    ردود سريعة (Quick Replies)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTemplateData({ ...newTemplateData, buttons_type: 'URL' })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      newTemplateData.buttons_type === 'URL'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    رابط خارجي (URL Button)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTemplateData({ ...newTemplateData, buttons_type: 'OTP' })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      newTemplateData.buttons_type === 'OTP'
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    نسخ رمز OTP (Copy Code)
                  </button>
                </div>

                {newTemplateData.buttons_type === 'QUICK_REPLY' && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <input
                      type="text"
                      value={newTemplateData.button_1_text}
                      onChange={(e) => setNewTemplateData({ ...newTemplateData, button_1_text: e.target.value })}
                      placeholder="زر 1: ✅ تأكيد الحضور"
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white text-xs"
                    />
                    <input
                      type="text"
                      value={newTemplateData.button_2_text}
                      onChange={(e) => setNewTemplateData({ ...newTemplateData, button_2_text: e.target.value })}
                      placeholder="زر 2: ❌ اعتذار / تأجيل"
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                )}

                {newTemplateData.buttons_type === 'URL' && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <input
                      type="text"
                      value={newTemplateData.button_1_text}
                      onChange={(e) => setNewTemplateData({ ...newTemplateData, button_1_text: e.target.value })}
                      placeholder="نص الزر: 🔗 فتح البوابة الطبية"
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white text-xs"
                    />
                    <input
                      type="text"
                      value={newTemplateData.button_url}
                      onChange={(e) => setNewTemplateData({ ...newTemplateData, button_url: e.target.value })}
                      placeholder="https://psypro.tech/portal"
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white text-xs font-mono"
                    />
                  </div>
                )}

                {newTemplateData.buttons_type === 'OTP' && (
                  <div className="pt-2">
                    <input
                      type="text"
                      value={newTemplateData.button_1_text || 'نسخ رمز التحقق'}
                      onChange={(e) => setNewTemplateData({ ...newTemplateData, button_1_text: e.target.value })}
                      placeholder="نسخ رمز التحقق"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-between pt-4">
                <button
                  type="submit"
                  disabled={creatingTemplate}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow"
                >
                  {creatingTemplate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{creatingTemplate ? 'جاري الإرسال لـ Meta...' : 'إرسال القالب للاعتماد في Meta'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: META CATEGORIZATION OFFICIAL GUIDE MODAL                         */}
      {/* ========================================================================= */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <HelpCircle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">دليل تصنيف قوالب واتساب الرسمي (Meta Guidelines)</h3>
                  <span className="text-[10px] text-slate-400 font-mono">WhatsApp Template Categorization Standard</span>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs leading-relaxed text-slate-300">
              <p>
                تعتمد شركة Meta في WhatsApp Business Cloud API على <strong>3 تصنيفات رئيسية صارمة</strong> للرسائل المسبقة الاعتماد (Templates)، والتي تحدد تسعير الرسائل وشروط قبولها:
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 space-y-1.5">
                  <h4 className="font-bold text-teal-300 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" />
                    <span>1. الخدمية والمعاملات (UTILITY Templates):</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                    <li>تُرسل كنتيجة لطلب مسبق أو معاملة سارية بين المريض والعيادة.</li>
                    <li>أمثلة سريرية: تذكير الموعد السريري، تأكيد الحجز، وصل السداد، رابط استبيان المتابعة، والواجبات المنزلية.</li>
                    <li><strong className="text-rose-400">تنبيه حاسم:</strong> لا يجوز إدراج أي كود خصم، كلمات تسويقية، أو روابط ترويجية، وإلا ستُصنف تلقائياً كـ MARKETING أو تُرفض.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-500/30 space-y-1.5">
                  <h4 className="font-bold text-violet-300 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    <span>2. المصادقة والتحقق (AUTHENTICATION Templates):</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                    <li>مخصصة حصرياً لإرسال رموز المرور المؤقتة (OTP) للتحقق من هوية المريض أو الممارس.</li>
                    <li>يجب أن تحتوي على متغير الرمز <code>{`{{1}}`}</code>.</li>
                    <li>تتضمن زراً رسمياً لنسخ الرمز (Copy Code) أو التعبئة التلقائية بنقرة واحدة (One-Tap Autofill).</li>
                    <li>يُمنع منعاً باتاً تضمين روابط URLs داخل نص الرسالة.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
                  <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4" />
                    <span>3. التسويق والتوعية (MARKETING Templates):</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                    <li>أي قالب يتضمن رسائل ترحيبية، نصائح توعوية بالصحة النفسية والتخاطب، أو إعادة التواصل مع المرضى المنقطعين (Retention).</li>
                    <li>أي قالب خدمي يمتزج بنبرة تسويقية أو عروض يعتبر تلقائياً قالب Marketing.</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1">
                <span className="font-bold text-emerald-400 block">💡 نصيحة منصة PsyPro للممارسين والعيادات:</span>
                <p>
                  قوالب منصة PsyPro الافتراضية مصممة ومصاغة بعناية طبية فائقة لتنال موافقة Meta الفورية بنسبة 100% دون أي إعادة تصنيف. استخدم زر "نشر الافتراضيات لـ Meta" لرفعها دفعة واحدة.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
              >
                فهمت ذلك ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
