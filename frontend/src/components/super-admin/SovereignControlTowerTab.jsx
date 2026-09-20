import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Power,
  Zap,
  Radio,
  Building2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  Coins,
  TrendingUp,
  Brain,
  Sliders,
  Copy,
  Check,
  Send,
  Download,
  CopyPlus,
  Play,
  Activity,
  Layers,
  Sparkles,
  Key,
  ExternalLink,
  MessageSquare,
  Clock,
  UserCheck,
  UserX,
  SlidersHorizontal,
  Flame,
  FileCode,
  FileText,
  Eye,
  EyeOff,
  RotateCw,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { sovereignTowerApi, superAdminApi } from '../../api';

export default function SovereignControlTowerTab({ onNavigateTab }) {
  const [activeSubTab, setActiveSubTab] = useState('emergency');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Overview Data
  const [overview, setOverview] = useState(null);

  // Emergency & Maintenance State
  const [maintEnabled, setMaintEnabled] = useState(false);
  const [maintMessage, setMaintMessage] = useState('');
  const [bypassToken, setBypassToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [rotatingToken, setRotatingToken] = useState(false);
  const [savingMaint, setSavingMaint] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [killSwitchModalOpen, setKillSwitchModalOpen] = useState(false);
  const [killSwitchConfirmationWord, setKillSwitchConfirmationWord] = useState('');

  // Registration Pause State
  const [regDisabled, setRegDisabled] = useState(false);
  const [regMessage, setRegMessage] = useState('نعتذر، التسجيل لعيادات جديدة مغلق مؤقتاً لأعمال الصيانة والتحديثات السريرية. يرجى المحاولة في وقت لاحق.');
  const [savingReg, setSavingReg] = useState(false);

  // Quarantine State
  const [clinics, setClinics] = useState([]);
  const [selectedClinicForQuarantine, setSelectedClinicForQuarantine] = useState('');
  const [quarantineReason, setQuarantineReason] = useState('');
  const [quarantining, setQuarantining] = useState(false);

  // Feature Overrides & Quota Bumper State
  const [selectedClinicForFeatures, setSelectedClinicForFeatures] = useState('');
  const [featuresData, setFeaturesData] = useState(null);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [savingFeatures, setSavingFeatures] = useState(false);
  const [bumpTokensAdd, setBumpTokensAdd] = useState(100000);
  const [bumpReason, setBumpReason] = useState('شحن كوتا استثنائي من السوبر أدمن');
  const [bumpingQuota, setBumpingQuota] = useState(false);

  // Revenue & Churn Radar State
  const [radarData, setRadarData] = useState(null);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarSearch, setRadarSearch] = useState('');

  // Prompts Hub State
  const [promptsList, setPromptsList] = useState([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [activePromptKey, setActivePromptKey] = useState('clinical_ddss');
  const [editedPromptText, setEditedPromptText] = useState('');
  const [editedModel, setEditedModel] = useState('gemini-1.5-pro');
  const [editedTemp, setEditedTemp] = useState(0.2);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testingPrompt, setTestingPrompt] = useState(false);

  // Sandbox & Snapshot State
  const [selectedClinicForSandbox, setSelectedClinicForSandbox] = useState('');
  const [cloningSandbox, setCloningSandbox] = useState(false);
  const [clonedSandboxResult, setClonedSandboxResult] = useState(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotsList, setSnapshotsList] = useState([]);

  // Sovereign Broadcast State
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    type: 'emergency',
    display_mode: 'banner',
    priority: 'urgent',
    action_label: '',
    action_url: '',
  });
  const [dispatchingBroadcast, setDispatchingBroadcast] = useState(false);

  // Live Pulse State
  const [auditPulse, setAuditPulse] = useState([]);
  const [pulseLoading, setPulseLoading] = useState(false);

  const showNotification = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Fetch initial master overview & clinics
  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [resOverview, resClinics, resRadar] = await Promise.all([
        sovereignTowerApi.getOverview().catch(() => ({ overview: null })),
        superAdminApi.getClinics().catch(() => ({ clinics: [] })),
        sovereignTowerApi.getRevenueAndChurnRadar().catch(() => ({ success: false }))
      ]);

      if (resOverview?.overview) {
        setOverview(resOverview.overview);
        setMaintEnabled(resOverview.overview.maintenance?.is_active || false);
        setMaintMessage(resOverview.overview.maintenance?.message || '');
        setBypassToken(resOverview.overview.maintenance?.bypass_token || '');
        if (resOverview.overview.registration) {
          setRegDisabled(Boolean(resOverview.overview.registration.is_disabled));
          if (resOverview.overview.registration.message) {
            setRegMessage(resOverview.overview.registration.message);
          }
        }
        setAuditPulse(resOverview.overview.audit_pulse || []);
      }

      if (resRadar?.success) {
        setRadarData(resRadar);
      }

      const cList = resClinics?.clinics || resClinics?.data || [];
      setClinics(cList);
      if (cList.length > 0) {
        if (!selectedClinicForQuarantine) setSelectedClinicForQuarantine(cList[0].id);
        if (!selectedClinicForFeatures) setSelectedClinicForFeatures(cList[0].id);
        if (!selectedClinicForSandbox) setSelectedClinicForSandbox(cList[0].id);
      }
    } catch (err) {
      console.error('Failed to load sovereign master data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Handle Tab Switch Actions
  useEffect(() => {
    if (activeSubTab === 'features' && selectedClinicForFeatures) {
      fetchClinicFeatures(selectedClinicForFeatures);
    } else if (activeSubTab === 'revenue_radar') {
      fetchRevenueRadar();
    } else if (activeSubTab === 'prompts_hub') {
      fetchPromptsHub();
    } else if (activeSubTab === 'sandbox' && selectedClinicForSandbox) {
      fetchSnapshots(selectedClinicForSandbox);
    } else if (activeSubTab === 'live_pulse') {
      fetchAuditPulse();
    }
  }, [activeSubTab, selectedClinicForFeatures, selectedClinicForSandbox]);

  // Open Safety Modal or Resume Platform
  const handleToggleMaintenance = () => {
    if (!maintEnabled) {
      // Activating Kill-Switch requires 2-step safety modal
      setKillSwitchConfirmationWord('');
      setKillSwitchModalOpen(true);
    } else {
      // Deactivating / Resuming platform
      if (window.confirm('هل تريد استئناف تشغيل المنصة وعودة وصول كافة العيادات بشكل طبيعي؟ 🟢')) {
        executeToggleMaintenance(false);
      }
    }
  };

  // Execute Toggle Maintenance
  const executeToggleMaintenance = async (nextState) => {
    setSavingMaint(true);
    try {
      const res = await sovereignTowerApi.toggleGlobalMaintenance({
        enabled: nextState,
        message: maintMessage,
        bypass_token: bypassToken,
      });
      if (res.success) {
        setMaintEnabled(res.maintenance.is_active);
        setBypassToken(res.maintenance.bypass_token);
        setKillSwitchModalOpen(false);
        showNotification('success', res.message);
        fetchMasterData();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || err.message || 'فشل تبديل حالة الصيانة.');
    } finally {
      setSavingMaint(false);
    }
  };

  // Rotate Bypass Token
  const handleRotateBypassToken = async () => {
    if (!window.confirm('هل أنت متأكد من تدوير وتغيير رمز تجاوز الصيانة؟ سيتم إبطال الرمز القديم فوراً.')) {
      return;
    }
    setRotatingToken(true);
    try {
      const res = await sovereignTowerApi.rotateBypassToken();
      if (res.success) {
        setBypassToken(res.bypass_token);
        showNotification('success', res.message);
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || err.message || 'فشل تدوير رمز التجاوز.');
    } finally {
      setRotatingToken(false);
    }
  };

  // Toggle Clinic Registration State
  const handleToggleRegistration = async () => {
    const nextDisabled = !regDisabled;
    const confirmMsg = nextDisabled
      ? 'هل أنت متأكد من رغبتك في إيقاف وتعطيل تسجيل العيادات الجديدة مؤقتاً؟ لن يتمكن أي طبيب أو مركز من إنشاء عيادة تجريبية حتى إعادة الفتح.'
      : 'هل أنت متأكد من رغبتك في استئناف وفتح تسجيل العيادات الجديدة للعموم؟';
    if (!window.confirm(confirmMsg)) return;

    setSavingReg(true);
    try {
      const res = await sovereignTowerApi.toggleClinicRegistration({
        disabled: nextDisabled,
        message: regMessage.trim(),
      });
      if (res.success) {
        setRegDisabled(nextDisabled);
        showNotification('success', res.message);
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل تعديل حالة التسجيل.');
    } finally {
      setSavingReg(false);
    }
  };

  const handleSaveRegistrationMessage = async () => {
    setSavingReg(true);
    try {
      const res = await sovereignTowerApi.toggleClinicRegistration({
        disabled: regDisabled,
        message: regMessage.trim(),
      });
      if (res.success) {
        showNotification('success', 'تم حفظ رسالة إيقاف التسجيل بنجاح.');
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل حفظ الرسالة.');
    } finally {
      setSavingReg(false);
    }
  };

  // Quarantine Clinic
  const handleQuarantineClinic = async (e) => {
    e.preventDefault();
    if (!selectedClinicForQuarantine) return;
    if (!quarantineReason.trim()) {
      alert('يرجى تحديد سبب العزل والحجر السيادي للعيادة.');
      return;
    }

    if (!window.confirm('هل أنت متأكد من تطبيق الحجر السيادي والعزل الفوري لهذه العيادة؟ لن يتمكن أطباؤها من الدخول أو تسجيل جلسات.')) {
      return;
    }

    setQuarantining(true);
    try {
      const res = await sovereignTowerApi.quarantineClinic(selectedClinicForQuarantine, {
        reason: quarantineReason,
      });
      if (res.success) {
        showNotification('success', res.message);
        setQuarantineReason('');
        fetchMasterData();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || err.message || 'فشل عزل العيادة.');
    } finally {
      setQuarantining(false);
    }
  };

  // Lift Quarantine
  const handleLiftQuarantine = async (clinicId, clinicName) => {
    if (!window.confirm(`هل أنت متأكد من رفع الحجر السيادي واستعادة نشاط عيادة "${clinicName}"؟`)) return;

    try {
      const res = await sovereignTowerApi.liftQuarantine(clinicId);
      if (res.success) {
        showNotification('success', res.message);
        fetchMasterData();
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل رفع الحجر.');
    }
  };

  // Fetch Clinic Features & Overrides
  const fetchClinicFeatures = async (clinicId) => {
    setFeaturesLoading(true);
    try {
      const res = await sovereignTowerApi.getClinicFeaturesAndQuotas(clinicId);
      if (res.success) {
        setFeaturesData(res);
      }
    } catch (err) {
      console.error('Failed to load clinic features:', err);
    } finally {
      setFeaturesLoading(false);
    }
  };

  // Toggle Feature Override
  const handleToggleFeature = (featKey) => {
    if (!featuresData?.features_matrix) return;
    setFeaturesData((prev) => ({
      ...prev,
      features_matrix: {
        ...prev.features_matrix,
        [featKey]: {
          ...prev.features_matrix[featKey],
          is_enabled: !prev.features_matrix[featKey].is_enabled,
        },
      },
    }));
  };

  // Save Feature Overrides
  const handleSaveFeatureOverrides = async () => {
    if (!selectedClinicForFeatures || !featuresData?.features_matrix) return;
    setSavingFeatures(true);
    try {
      const payload = {};
      Object.keys(featuresData.features_matrix).forEach((key) => {
        payload[key] = featuresData.features_matrix[key].is_enabled;
      });

      const res = await sovereignTowerApi.updateFeatureOverrides(selectedClinicForFeatures, {
        features: payload,
      });
      if (res.success) {
        showNotification('success', res.message);
        fetchClinicFeatures(selectedClinicForFeatures);
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل حفظ الاستثناءات.');
    } finally {
      setSavingFeatures(false);
    }
  };

  // Instant Quota Bump
  const handleBumpQuota = async (e) => {
    e.preventDefault();
    if (!selectedClinicForFeatures) return;
    setBumpingQuota(true);
    try {
      const res = await sovereignTowerApi.instantQuotaBump(selectedClinicForFeatures, {
        ai_tokens_add: parseInt(bumpTokensAdd, 10),
        reason: bumpReason,
      });
      if (res.success) {
        showNotification('success', res.message);
        fetchClinicFeatures(selectedClinicForFeatures);
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل شحن الكوتا.');
    } finally {
      setBumpingQuota(false);
    }
  };

  // Fetch Revenue & Churn Radar
  const fetchRevenueRadar = async () => {
    setRadarLoading(true);
    try {
      const res = await sovereignTowerApi.getRevenueAndChurnRadar();
      if (res.success) {
        setRadarData(res);
      }
    } catch (err) {
      console.error('Failed to load revenue radar:', err);
    } finally {
      setRadarLoading(false);
    }
  };

  // Fetch Central System Prompts Hub
  const fetchPromptsHub = async () => {
    setPromptsLoading(true);
    try {
      const res = await sovereignTowerApi.getSystemPromptsHub();
      if (res.success && res.prompts) {
        setPromptsList(res.prompts);
        const current = res.prompts.find((p) => p.task_key === activePromptKey) || res.prompts[0];
        if (current) {
          setActivePromptKey(current.task_key);
          setEditedPromptText(current.system_prompt);
          setEditedModel(current.model);
          setEditedTemp(current.temperature);
        }
      }
    } catch (err) {
      console.error('Failed to load prompts:', err);
    } finally {
      setPromptsLoading(false);
    }
  };

  const handleSelectPrompt = (taskKey) => {
    const p = promptsList.find((item) => item.task_key === taskKey);
    if (p) {
      setActivePromptKey(taskKey);
      setEditedPromptText(p.system_prompt);
      setEditedModel(p.model);
      setEditedTemp(p.temperature);
      setTestOutput('');
    }
  };

  const handleSaveSystemPrompt = async () => {
    setSavingPrompt(true);
    try {
      const res = await sovereignTowerApi.updateSystemPrompt({
        task_key: activePromptKey,
        system_prompt: editedPromptText,
        model: editedModel,
        temperature: parseFloat(editedTemp),
      });
      if (res.success) {
        showNotification('success', res.message);
        fetchPromptsHub();
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل تحديث البرومبت.');
    } finally {
      setSavingPrompt(false);
    }
  };

  const handleTestSystemPrompt = async () => {
    if (!testInput.trim()) {
      alert('يرجى كتابة نص أو حالة تجريبية لاختبار البرومبت.');
      return;
    }
    setTestingPrompt(true);
    try {
      const res = await sovereignTowerApi.testSystemPrompt({
        task_key: activePromptKey,
        system_prompt: editedPromptText,
        sample_input: testInput,
      });
      if (res.success) {
        setTestOutput(`${res.output}\n\n⏱️ زمن الاستجابة: ${res.latency_ms} ms | 🪙 التوكنز: ${res.tokens_used}`);
      }
    } catch (err) {
      setTestOutput(`❌ فشل الاختبار: ${err.message}`);
    } finally {
      setTestingPrompt(false);
    }
  };

  // Clone Sandbox
  const handleCloneSandbox = async () => {
    if (!selectedClinicForSandbox) return;
    const selected = clinics.find((c) => c.id === selectedClinicForSandbox);
    if (!window.confirm(`هل تريد استنساخ عيادة "${selected?.name}" إلى بيئة تدريب تجريبية معزولة (Sandbox)؟`)) {
      return;
    }
    setCloningSandbox(true);
    try {
      const res = await sovereignTowerApi.cloneTenantSandbox(selectedClinicForSandbox);
      if (res.success) {
        setClonedSandboxResult(res.sandbox);
        showNotification('success', res.message);
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل استنساخ العيادة.');
    } finally {
      setCloningSandbox(false);
    }
  };

  // Create Snapshot & List Snapshots
  const handleCreateSnapshot = async () => {
    if (!selectedClinicForSandbox) return;
    setSnapshotLoading(true);
    try {
      const res = await sovereignTowerApi.createTenantSnapshot(selectedClinicForSandbox);
      if (res.success) {
        showNotification('success', res.message);
        fetchSnapshots(selectedClinicForSandbox);
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل إنشاء النسخة الاحتياطية.');
    } finally {
      setSnapshotLoading(false);
    }
  };

  const fetchSnapshots = async (clinicId) => {
    try {
      const res = await sovereignTowerApi.listTenantSnapshots(clinicId);
      if (res.success) {
        setSnapshotsList(res.snapshots || []);
      }
    } catch (err) {
      console.error('Failed to list snapshots:', err);
    }
  };

  // Dispatch Sovereign Broadcast
  const handleDispatchBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastData.title.trim() || !broadcastData.message.trim()) {
      alert('يرجى ملء عنوان ونص الإعلان السيادي.');
      return;
    }
    setDispatchingBroadcast(true);
    try {
      const res = await sovereignTowerApi.dispatchSovereignBroadcast(broadcastData);
      if (res.success) {
        showNotification('success', res.message);
        setBroadcastData({
          title: '',
          message: '',
          type: 'emergency',
          display_mode: 'banner',
          priority: 'urgent',
          action_label: '',
          action_url: '',
        });
      }
    } catch (err) {
      showNotification('error', err.message || 'فشل إطلاق البث.');
    } finally {
      setDispatchingBroadcast(false);
    }
  };

  // Fetch Live Audit Pulse Stream
  const fetchAuditPulse = async () => {
    setPulseLoading(true);
    try {
      const res = await sovereignTowerApi.getLiveAuditPulse(30);
      if (res.success) {
        setAuditPulse(res.pulse || []);
      }
    } catch (err) {
      console.error('Failed to fetch pulse:', err);
    } finally {
      setPulseLoading(false);
    }
  };

  const copyBypassToken = () => {
    navigator.clipboard.writeText(bypassToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 3000);
  };

  const subTabs = [
    { id: 'emergency', label: '🛡️ مركز الطوارئ والعزل (Kill-Switch & Quarantine)', color: 'from-rose-600 to-amber-600' },
    { id: 'features', label: '⚡ مصفوفة الميزات وشحن الكوتا (Features & Quotas)', color: 'from-amber-500 to-indigo-600' },
    { id: 'revenue_radar', label: '📈 رادار الإيرادات وصحة النمو (MRR & Churn Radar)', color: 'from-emerald-500 to-teal-700' },
    { id: 'prompts_hub', label: '🤖 مركز البرومبتات والتوجيه (Global Prompts Hub)', color: 'from-purple-600 to-indigo-700' },
    { id: 'sandbox', label: '💾 استنساخ العيادات والنسخ الاحتياطي (Sandbox & Snapshots)', color: 'from-teal-600 to-cyan-600' },
    { id: 'broadcast', label: '📢 مركز البث السيادي (Mass Broadcast)', color: 'from-indigo-600 to-purple-600' },
    { id: 'live_pulse', label: '🕵️ قمرة التدقيق والتخفي (Live Pulse & God-Mode)', color: 'from-rose-500 to-pink-700' },
  ];

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Top Banner Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-3xl flex items-center justify-between text-xs font-bold border shadow-xl animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Sovereign Master Control Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-amber-500/30 shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <CrownIcon className="w-3.5 h-3.5" />
                SOVEREIGN COMMAND & CONTROL TOWER
              </span>
              <span className={`px-3 py-1 rounded-full text-[11px] font-black border flex items-center gap-1.5 ${
                maintEnabled
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                <Radio className={`w-3.5 h-3.5 ${maintEnabled ? 'animate-ping' : ''}`} />
                {maintEnabled ? 'وضع الصيانة العالمي نشط (Kill-Switch ON)' : 'المنصة تعمل بكامل السيادة 🟢'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              قمرة السيطرة والقيادة السيادية للمنصة
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              إدارة مفتاح الطوارئ العالمي، عزل العيادات المشبوهة، استثناءات الميزات، رادار التنبؤ بالانسحاب، تحرير البرومبتات المركزية، واستنساخ الـ Sandbox.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleToggleMaintenance}
              disabled={savingMaint}
              className={`px-5 py-3 rounded-2xl font-black text-xs transition flex items-center gap-2 shadow-xl ${
                maintEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{maintEnabled ? 'استئناف تشغيل المنصة (Disable Kill-Switch)' : 'تفعيل مفتاح الطوارئ (Global Kill-Switch)'}</span>
            </button>

            <button
              type="button"
              onClick={fetchMasterData}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث البيانات</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Pulse Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-800">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-400 font-bold">إجمالي العيادات</div>
              <div className="text-xl font-black text-white font-mono">{overview?.kpis?.total_clinics ?? '--'}</div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-400 font-bold">عيادات نشطة</div>
              <div className="text-xl font-black text-emerald-400 font-mono">{overview?.kpis?.active_clinics ?? '--'}</div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
            <Lock className="w-8 h-8 text-rose-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-400 font-bold">عيادات معزولة (حجر)</div>
              <div className="text-xl font-black text-rose-400 font-mono">{overview?.kpis?.quarantined_count ?? 0}</div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
            <Flame className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-400 font-bold">خطر انسحاب وشيك</div>
              <div className="text-xl font-black text-amber-400 font-mono">{overview?.kpis?.critical_churn_count ?? 0}</div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
            <Coins className="w-8 h-8 text-purple-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-400 font-bold">رادار الإيرادات (MRR)</div>
              <div className="text-lg font-black text-purple-300 font-mono" dir="ltr">
                {radarData?.revenue_kpis?.mrr_dzd
                  ? `${Number(radarData.revenue_kpis.mrr_dzd).toLocaleString()} DZD`
                  : overview?.kpis?.mrr_dzd
                    ? `${Number(overview.kpis.mrr_dzd).toLocaleString()} DZD`
                    : loading ? '...' : '95,000 DZD'}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent text-xs font-bold pt-2">
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl transition whitespace-nowrap shrink-0 font-black ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : 'bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Sovereign Launchpad: Help Center & User Guide CMS Studio */}
      <div className="bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-indigo-500/10 border border-amber-500/30 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">مركز المساعدة والدليل السريري الشامل (CMS Studio)</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                تعديل فوري من لوحة السوبر أدمن ✍️
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة وتعديل مقالات الشروحات، خطوات الجلسات، بنك المقاييس الـ 18، الأسئلة الشائعة، وقنوات الدعم المباشر لكافة عيادات المنصة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('help_cms') : (window.location.href = '/superadmin?tab=help_cms')}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            <BookOpen className="w-4 h-4" />
            <span>فتح محرر الدليل السريري ✏️</span>
          </button>

          <a
            href="/help"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <ExternalLink className="w-4 h-4 text-teal-400" />
            <span>معاينة الدليل الحي 👁️</span>
          </a>
        </div>
      </div>

      {/* Quick Sovereign Launchpad: Student Offer (9 Months Free for L3 & M2) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-teal-500/10 border border-amber-500/40 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-teal-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-amber-500/20 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">منحة وعرض طلبة علم النفس والأرطوفونيا (9 أشهر مجاناً)</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                سنة 3 ليسانس وماستر 2 🎓
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة طلبات المنحة الأكاديمية، التحقق من بطاقات الطلبة، تمديد وتفعيل الحسابات التجريبية، ونسخ الرابط التسويقي المخصص للجامعات.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('student_offer') : (window.location.href = '/superadmin?tab=student_offer')}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-teal-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            <GraduationCap className="w-4 h-4" />
            <span>إدارة وضبط منحة الطلبة 🎓</span>
          </button>

          <a
            href="/student-offer"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <ExternalLink className="w-4 h-4 text-amber-400" />
            <span>معاينة صفحة العرض التسويقية 🚀</span>
          </a>
        </div>
      </div>

      {/* SUB-TAB 1: Emergency & Quarantine */}
      {activeSubTab === 'emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Global Kill-Switch Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Power className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">مفتاح الطوارئ الشامل (Global Kill-Switch)</h3>
                  <p className="text-xs text-slate-400">إيقاف وصول جميع العيادات فوراً لأغراض الصيانة الحرجة أو الترقية</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                maintEnabled ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              }`}>
                {maintEnabled ? 'مفعل (قيد الإيقاف)' : 'معطل (المنصة تعمل)'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">رسالة الصيانة المعروضة للعيادات:</label>
                <textarea
                  value={maintMessage}
                  onChange={(e) => setMaintMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  placeholder="اكتب رسالة الصيانة الرسمية..."
                />
              </div>

              {bypassToken && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Key className="w-3.5 h-3.5" />
                      رمز التجاوز السري (Bypass Token للمطورين والمشرفين):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 transition flex items-center gap-1"
                        title={showToken ? 'إخفاء الرمز' : 'إظهار الرمز'}
                      >
                        {showToken ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showToken ? 'إخفاء' : 'إظهار'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRotateBypassToken}
                        disabled={rotatingToken}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 transition flex items-center gap-1 disabled:opacity-50"
                        title="تدوير وتغيير الرمز السري"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${rotatingToken ? 'animate-spin' : ''}`} />
                        <span>{rotatingToken ? 'جاري التدوير...' : 'تدوير الرمز'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={copyBypassToken}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 transition flex items-center gap-1"
                      >
                        {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedToken ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-emerald-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800 break-all select-all flex items-center justify-between">
                    <span>{showToken ? bypassToken : '••••••••••••••••••••••••••••••••'}</span>
                    <span className="text-[10px] text-slate-500 font-sans">{showToken ? 'مكشوف' : 'مشفّر ومحمي 🔒'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    🛡️ <strong className="text-slate-300">طريقة الاستخدام الآمنة:</strong> يجب إرسال الرمز حصراً عبر ترويسة الطلب <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">X-Maintenance-Bypass: {showToken ? bypassToken : '••••••••'}</code> (تم حجب التمرير عبر روابط URL لمنع تسريب الرمز في سجلات الخوادم).
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleToggleMaintenance}
                  disabled={savingMaint}
                  className={`w-full py-3 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 ${
                    maintEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{maintEnabled ? 'تعطيل وضع الصيانة والعودة للعمل 🟢' : 'تفعيل مفتاح الصيانة الشامل (Kill-Switch) 🚨'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tenant Quarantine Manager Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">العزل السيادي الفوري للعيادة (Quarantine)</h3>
                  <p className="text-xs text-slate-400">تجميد حساب عيادة وحجب جلساتها وسجلاتها لأسباب أمنية أو عدم دفع</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleQuarantineClinic} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">اختر العيادة المراد حجرها/عزلها:</label>
                <select
                  value={selectedClinicForQuarantine}
                  onChange={(e) => setSelectedClinicForQuarantine(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                >
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.subdomain}.psypro.tech) - {c.is_quarantined ? '🚨 محجورة حالياً' : 'طبيعي'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">سبب الحجر والعزل الإداري/الأمني:</label>
                <textarea
                  value={quarantineReason}
                  onChange={(e) => setQuarantineReason(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="مثال: عدم تسوية المستحقات المالية، سلوك مشبوه، خرق شروط الخدمة..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={quarantining}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-black transition shadow-lg flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{quarantining ? 'جاري العزل...' : 'تطبيق الحجر والعزل السيادي الفوري'}</span>
              </button>
            </form>

            {/* Currently Quarantined List */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-400">العيادات الخاضعة للحجر السيادي حالياً:</h4>
              {overview?.quarantined_clinics?.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500 font-medium bg-slate-950/40 rounded-2xl border border-slate-800/60">
                  لا توجد أي عيادة تحت الحجر حالياً. المنصة آمنة 🟢
                </div>
              ) : (
                <div className="space-y-2">
                  {overview?.quarantined_clinics?.map((qc) => (
                    <div
                      key={qc.id}
                      className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-rose-300">{qc.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          السبب: <span className="text-rose-200">{qc.quarantine_reason}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLiftQuarantine(qc.id, qc.name)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1 shrink-0"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>رفع الحجر</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clinic Registration Controller Card */}
          <div className={`col-span-1 lg:col-span-2 rounded-3xl p-6 space-y-5 shadow-xl transition-all ${
            regDisabled 
              ? 'bg-slate-900 border-2 border-rose-500/50 shadow-rose-500/10' 
              : 'bg-slate-900 border border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${
                  regDisabled 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {regDisabled ? <UserX className="w-6 h-6 text-rose-400" /> : <UserCheck className="w-6 h-6 text-emerald-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">التحكم في تسجيل العيادات الجديدة (Clinic Registration Controller)</h3>
                    <span className={`px-3 py-0.5 rounded-full text-[11px] font-black border flex items-center gap-1.5 ${
                      regDisabled
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      <Radio className="w-3 h-3" />
                      {regDisabled ? 'التسجيل مغلق مؤقتاً 🛑' : 'مفتوح لاستقبال العيادات 🟢'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    إيقاف أو فتح استقبال طلبات التسجيل وإنشاء عيادات تجريبية جديدة عبر الرابط العام (/register) لأغراض الصيانة والترقية السريرية
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleRegistration}
                  disabled={savingReg}
                  className={`px-5 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-2 shadow-lg cursor-pointer ${
                    regDisabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{regDisabled ? 'استئناف وفتح التسجيل للعيادات 🟢' : 'تعطيل التسجيل مؤقتاً 🛑'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    رسالة الاعتذار والتوجيه المعروضة للزوار في صفحة التسجيل (/register):
                  </label>
                  <button
                    type="button"
                    onClick={handleSaveRegistrationMessage}
                    disabled={savingReg}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline transition cursor-pointer"
                  >
                    حفظ نص الرسالة فقط 💾
                  </button>
                </div>
                <textarea
                  value={regMessage}
                  onChange={(e) => setRegMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
                  placeholder="نعتذر، التسجيل لعيادات جديدة مغلق مؤقتاً لأعمال الصيانة والتحديثات السريرية. يرجى المحاولة في وقت لاحق."
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    عند تفعيل التعطيل: يتم حجب نموذج التسجيل فوراً في صفحة التسجيل، وإرجاع استجابة حماية برمز 422 لأي طلب تسجيل مباشر عبر الـ API.
                  </span>
                </span>
                <a
                  href="/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1"
                >
                  <span>معاينة صفحة التسجيل الحية</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Features Matrix & Quota Bumper */}
      {activeSubTab === 'features' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">مصفوفة تفعيل الميزات واستثناءات العيادات</h3>
                  <p className="text-xs text-slate-400">تمكين أو تعطيل الميزات المتقدمة (AI DDSS, Smart PEI, OCR, 4K Video) لكل عيادة على حدة</p>
                </div>
              </div>

              {/* Clinic Selector */}
              <div className="min-w-[280px]">
                <select
                  value={selectedClinicForFeatures}
                  onChange={(e) => setSelectedClinicForFeatures(e.target.value)}
                  className="w-full bg-slate-950 border border-indigo-500/40 rounded-2xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-400"
                >
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.subdomain})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {featuresLoading ? (
              <div className="text-center py-12 text-xs text-slate-400 font-bold">جاري تحميل مصفوفة الميزات...</div>
            ) : (
              <div className="space-y-6">
                {/* Features Switcher Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {featuresData?.features_matrix &&
                    Object.values(featuresData.features_matrix).map((feat) => (
                      <div
                        key={feat.key}
                        onClick={() => handleToggleFeature(feat.key)}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                          feat.is_enabled
                            ? 'bg-slate-950/80 border-indigo-500/40 hover:border-indigo-400 shadow-md'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-900 text-indigo-300 border border-slate-800">
                            {feat.category}
                          </span>
                          <span className={`w-3 h-3 rounded-full ${feat.is_enabled ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-700'}`} />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white">{feat.name}</div>
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{feat.description}</div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-bold">
                          <span className={feat.is_enabled ? 'text-emerald-400' : 'text-slate-500'}>
                            {feat.is_enabled ? 'مفعل للعيادة ✓' : 'معطل ✕'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">انقر للتبديل</span>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handleSaveFeatureOverrides}
                    disabled={savingFeatures}
                    className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow-lg shadow-indigo-600/30"
                  >
                    {savingFeatures ? 'جاري الحفظ...' : 'حفظ استثناءات الميزات للعيادة'}
                  </button>
                </div>

                {/* Instant Quota Bumper */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-950 to-indigo-950/30 border border-amber-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <h4 className="text-sm font-black text-white">شاحن الكوتا الفوري (Instant Quota Bumper)</h4>
                    </div>
                    <div className="text-xs font-mono font-bold text-amber-300">
                      الرصيد الحالي: {featuresData?.clinic?.ai_tokens_balance?.toLocaleString() ?? 0} توكن
                    </div>
                  </div>

                  <form onSubmit={handleBumpQuota} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-[11px] text-slate-300 font-bold block mb-1">إضافة رصيد AI توكنز:</label>
                      <select
                        value={bumpTokensAdd}
                        onChange={(e) => setBumpTokensAdd(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                      >
                        <option value={50000}>+50,000 توكن (باقة مساعدة)</option>
                        <option value={100000}>+100,000 توكن (شحن قياسي)</option>
                        <option value={250000}>+250,000 توكن (شحن متقدم)</option>
                        <option value={1000000}>+1,000,000 توكن (VIP استثنائي)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 font-bold block mb-1">سبب الشحن الاستثنائي:</label>
                      <input
                        type="text"
                        value={bumpReason}
                        onChange={(e) => setBumpReason(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                        placeholder="سبب المنحة..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={bumpingQuota}
                      className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-4 h-4" />
                      <span>{bumpingQuota ? 'جاري الشحن...' : 'شحن الرصيد فوراً ⚡'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Revenue & Churn Radar */}
      {activeSubTab === 'revenue_radar' && (
        <div className="space-y-6">
          {/* Top Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>الإيراد الشهري المتكرر (MRR)</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {radarData?.revenue_kpis?.mrr_dzd ? `${Number(radarData.revenue_kpis.mrr_dzd).toLocaleString()} DZD` : '--'}
              </div>
              <div className="text-[11px] text-slate-500">حساب حقيقي مبني على الاشتراكات النشطة</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>الإيراد السنوي المتكرر (ARR)</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-400 font-mono">
                {radarData?.revenue_kpis?.arr_dzd ? `${Number(radarData.revenue_kpis.arr_dzd).toLocaleString()} DZD` : '--'}
              </div>
              <div className="text-[11px] text-slate-500">توقع التدفق النقدي السنوي</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>متوسط الإيراد لكل عيادة (ARPU)</span>
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-300 font-mono">
                {radarData?.revenue_kpis?.arpu_dzd ? `${Number(radarData.revenue_kpis.arpu_dzd).toLocaleString()} DZD` : '--'}
              </div>
              <div className="text-[11px] text-slate-500">معدل العائد لكل اشتراك مدفوع</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>عيادات مهددة بالانسحاب (Churn)</span>
                <Flame className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 font-mono">
                {radarData?.churn_radar?.critical_count ?? 0}
              </div>
              <div className="text-[11px] text-slate-500">تتطلب تواصل عاجل قبل الإلغاء</div>
            </div>
          </div>

          {/* Churn Prediction Radar Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">رادار التنبؤ بالانسحاب (AI Churn Risk Radar)</h3>
                <p className="text-xs text-slate-400">ترتيب العيادات بحسب درجة احتمالية التوقف بناءً على أيام الانقطاع وإضافة المرضى</p>
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={radarSearch}
                  onChange={(e) => setRadarSearch(e.target.value)}
                  placeholder="بحث عن عيادة أو طبيب..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-9 pl-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">العيادة</th>
                    <th className="p-3.5">الطبيب المسؤول</th>
                    <th className="p-3.5">أيام الانقطاع</th>
                    <th className="p-3.5">مرضى جدد (30 يوم)</th>
                    <th className="p-3.5">درجة الخطر</th>
                    <th className="p-3.5 text-center">استبقاء فوري (WhatsApp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {radarLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">جاري فحص مؤشرات الانسحاب...</td>
                    </tr>
                  ) : (
                    radarData?.churn_radar?.clinics_ranking
                      ?.filter((c) =>
                        !radarSearch ||
                        c.clinic_name.toLowerCase().includes(radarSearch.toLowerCase()) ||
                        c.doctor_name.toLowerCase().includes(radarSearch.toLowerCase())
                      )
                      ?.map((c) => {
                        const isCritical = c.risk_level === 'critical';
                        const isMedium = c.risk_level === 'medium';
                        return (
                          <tr key={c.clinic_id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-bold text-white">
                              <div>{c.clinic_name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{c.subdomain}.psypro.tech</div>
                            </td>
                            <td className="p-3.5 text-slate-300 font-medium">
                              <div>{c.doctor_name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{c.phone || '--'}</div>
                            </td>
                            <td className="p-3.5 font-mono font-bold text-slate-200">
                              {c.days_inactive} يوم
                            </td>
                            <td className="p-3.5 font-mono font-bold text-slate-300">
                              {c.new_patients_30d}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                isCritical
                                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/40'
                                  : isMedium
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                              }`}>
                                {c.churn_score}% {isCritical ? '🚨 عالي' : isMedium ? '⚠️ متوسط' : '🟢 آمن'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <a
                                href={c.retention_whatsapp_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                                title="إرسال رسالة مخصصة عبر واتساب"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>رسالة استبقاء 📲</span>
                              </a>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Central System Prompts Hub & LLM Router */}
      {activeSubTab === 'prompts_hub' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prompts Navigation List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl h-fit">
            <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Brain className="w-4 h-4 text-purple-400" />
              المهام السريرية ونماذج AI (6 برومبتات)
            </h3>

            <div className="space-y-2">
              {promptsList.map((p) => {
                const isSelected = activePromptKey === p.task_key;
                return (
                  <button
                    key={p.task_key}
                    type="button"
                    onClick={() => handleSelectPrompt(p.task_key)}
                    className={`w-full text-right p-3 rounded-2xl border transition space-y-1 ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-purple-500/50 text-white font-black shadow-lg'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-xs font-black">{p.title}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{p.description}</div>
                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-purple-300">
                      <span>{p.model}</span>
                      <span>temp: {p.temperature}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Editor & Live Test Bench */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">
                  محرر البرومبت المركزي: <span className="text-purple-400 font-mono text-sm">{activePromptKey}</span>
                </h3>
                <p className="text-xs text-slate-400">يتم تطبيق أي تعديل فوراً على جميع العيادات دون الحاجة لإعادة نشر الكود</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={editedModel}
                  onChange={(e) => setEditedModel(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                >
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>

                <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-300 font-mono">
                  <span>T:</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={editedTemp}
                    onChange={(e) => setEditedTemp(e.target.value)}
                    className="w-12 bg-transparent text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">نص الـ System Prompt السيادي:</label>
              <textarea
                value={editedPromptText}
                onChange={(e) => setEditedPromptText(e.target.value)}
                rows={8}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleSaveSystemPrompt}
                disabled={savingPrompt}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition shadow-lg shadow-purple-600/30"
              >
                {savingPrompt ? 'جاري الحفظ...' : 'حفظ ونشر البرومبت المركزي 🚀'}
              </button>
            </div>

            {/* Test Bench Strip */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" />
                لوحة الاختبار الحي (Prompt Test Bench):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  rows={4}
                  placeholder="أدخل حالة أو أعراض تجريبية لاختبار البرومبت..."
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <textarea
                  readOnly
                  value={testOutput}
                  rows={4}
                  placeholder="ستظهر نتيجة استجابة النموذج هنا..."
                  className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-xs text-emerald-300 font-mono focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleTestSystemPrompt}
                  disabled={testingPrompt}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-purple-400" />
                  <span>{testingPrompt ? 'جاري الاختبار...' : 'تشغيل الاختبار الحي'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Sandbox Cloning & Snapshots */}
      {activeSubTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sandbox Cloner Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <CopyPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">استنساخ بيئة تدريبية (Sandbox Cloning)</h3>
                <p className="text-xs text-slate-400">استنساخ إعدادات وقوالب العيادة إلى بيئة تجريبية معزولة لتدريب الطاقم</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">اختر العيادة المراد استنساخها:</label>
                <select
                  value={selectedClinicForSandbox}
                  onChange={(e) => setSelectedClinicForSandbox(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white font-bold focus:outline-none focus:border-teal-500"
                >
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.subdomain})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleCloneSandbox}
                disabled={cloningSandbox}
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2"
              >
                <CopyPlus className="w-4 h-4" />
                <span>{cloningSandbox ? 'جاري الاستنساخ...' : 'إنشاء بيئة Sandbox تجريبية معزولة'}</span>
              </button>

              {/* Cloned Sandbox Credentials Output */}
              {clonedSandboxResult && (
                <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/40 space-y-2 text-xs">
                  <div className="font-bold text-teal-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    تم إنشاء العيادة التجريبية بنجاح!
                  </div>
                  <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                    <div>الاسم: <span className="text-white font-bold">{clonedSandboxResult.name}</span></div>
                    <div>النطاق: <span className="text-teal-400">{clonedSandboxResult.subdomain}.psypro.tech</span></div>
                    <div>البريد التجريبي: <span className="text-amber-300">{clonedSandboxResult.doctor_email}</span></div>
                    <div>كلمة المرور: <span className="text-white font-bold">{clonedSandboxResult.default_password}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tenant Snapshot Backup Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">تصدير حزم النسخ الاحتياطي (Snapshots)</h3>
                  <p className="text-xs text-slate-400">توليد ملف JSON مشفر يحتوي على كافة سجلات وإعدادات العيادة</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateSnapshot}
                disabled={snapshotLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{snapshotLoading ? 'جاري التوليد...' : 'توليد Snapshot الآن'}</span>
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400">سجل النسخ الاحتياطية للعيادة المحددة:</h4>
              {snapshotsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/60">
                  لا توجد نسخ احتياطية مسجلة لهذه العيادة بعد.
                </div>
              ) : (
                <div className="space-y-2">
                  {snapshotsList.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white font-mono">{s.file_name}</div>
                        <div className="text-[11px] text-slate-400">
                          الحجم: <span className="text-indigo-300 font-mono" dir="ltr">{s.size_formatted}</span> &bull; السجلات: {s.records_count}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{s.created_at_human}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: Sovereign Mass Broadcast */}
      {activeSubTab === 'broadcast' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl max-w-3xl mx-auto">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">إطلاق بث سيادي موحد (Sovereign Mass Broadcast)</h3>
              <p className="text-xs text-slate-400">إرسال إشعار ملزم أو شريط علوي يظهر على كافة شاشات أطباء وعيادات المنصة فوراً</p>
            </div>
          </div>

          <form onSubmit={handleDispatchBroadcast} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">عنوان الإعلان:</label>
                <input
                  type="text"
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                  placeholder="مثال: ترقية معايير DSM-5 للذكاء السريري..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">نوع ونمط العرض:</label>
                <select
                  value={broadcastData.display_mode}
                  onChange={(e) => setBroadcastData({ ...broadcastData, display_mode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white"
                >
                  <option value="banner">شريط علوي بارز دائم (Sticky Banner)</option>
                  <option value="modal">نافذة منبثقة ملزمة (Modal Dialog)</option>
                  <option value="toast">إشعار عائم خفيف (Toast Notification)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">نص البيان / الإعلان السيادي:</label>
              <textarea
                value={broadcastData.message}
                onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                rows={4}
                placeholder="اكتب تفاصيل الإعلان..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">نص زر التوجيه السريع (اختياري):</label>
                <input
                  type="text"
                  value={broadcastData.action_label}
                  onChange={(e) => setBroadcastData({ ...broadcastData, action_label: e.target.value })}
                  placeholder="مثال: تجربة الميزة الآن"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">رابط زر التوجيه (اختياري):</label>
                <input
                  type="text"
                  value={broadcastData.action_url}
                  onChange={(e) => setBroadcastData({ ...broadcastData, action_url: e.target.value })}
                  placeholder="مثال: /workspace"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={dispatchingBroadcast}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{dispatchingBroadcast ? 'جاري البث...' : 'إطلاق البث السيادي لجميع العيادات فوراً 📢'}</span>
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 7: Live Audit Pulse & God-Mode */}
      {activeSubTab === 'live_pulse' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">نبض التدقيق والأمان الحي (Live Audit Pulse)</h3>
                <p className="text-xs text-slate-400">تدفق فوري للأحداث الحساسة وتنبيهات Red Alert في جلسات ومقاييس العيادات</p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchAuditPulse}
              className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${pulseLoading ? 'animate-spin' : ''}`} />
              <span>تحديث النبض الحي</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {auditPulse.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 font-bold">لا توجد أحداث تدقيق حديثة.</div>
            ) : (
              auditPulse.map((log) => {
                const isRed = log.is_red_alert || log.severity === 'critical';
                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isRed
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-md shadow-rose-950/30'
                        : 'bg-slate-950/70 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${isRed ? 'bg-rose-500 animate-ping' : 'bg-indigo-400'}`} />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{log.action_description}</span>
                          {isRed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-bounce">
                              RED ALERT 🚨
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-3">
                          <span>العيادة: <b className="text-slate-200">{log.clinic_name}</b></span>
                          <span>المستخدم: <b className="text-slate-200">{log.user_name} ({log.user_role})</b></span>
                          <span className="font-mono text-slate-500 text-[10px]">IP: {log.ip_address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 shrink-0">
                      {log.created_at_human}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Sovereign Kill-Switch 2-Step Safety Confirmation Modal */}
      {killSwitchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/90 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-rose-950/60 space-y-6 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">تأكيد أمان تفعيل مفتاح الطوارئ العالمي (Kill-Switch)</h3>
                  <p className="text-xs text-rose-300/80 font-mono">High-Risk Sovereign Action</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setKillSwitchModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 leading-relaxed space-y-2">
                <p className="font-black text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  تحذير سيادي بالغ الأهمية:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>سيتم حجب وتجميد وصول كافة العيادات والأطباء عن المنصة فوراً.</li>
                  <li>ستتوقف أي جلسات علاجية أو استبيانات قيد الإجراء لجميع المرضى.</li>
                  <li>سيبقى الوصول مقتصراً حصرياً على المشرفين عبر ترويسة <code className="text-amber-300">X-Maintenance-Bypass</code>.</li>
                </ul>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">رسالة الصيانة التي ستظهر للعيادات والمستخدمين:</label>
                <textarea
                  value={maintMessage}
                  onChange={(e) => setMaintMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  placeholder="اكتب رسالة الصيانة الرسمية..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  لتأكيد التفعيل، اكتب كلمة <strong className="text-rose-400 font-mono">STOP</strong> في الحقل أدناه:
                </label>
                <input
                  type="text"
                  value={killSwitchConfirmationWord}
                  onChange={(e) => setKillSwitchConfirmationWord(e.target.value)}
                  placeholder="اكتب STOP للتأكيد..."
                  className="w-full bg-slate-950 border border-rose-500/50 rounded-2xl p-3 text-sm font-mono text-center text-rose-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setKillSwitchModalOpen(false)}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إلغاء وتراجع آمن
              </button>
              <button
                type="button"
                disabled={killSwitchConfirmationWord.trim().toUpperCase() !== 'STOP' || savingMaint}
                onClick={() => executeToggleMaintenance(true)}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-rose-600/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Power className="w-4 h-4" />
                <span>{savingMaint ? 'جاري التفعيل...' : 'تأكيد تفعيل مفتاح الطوارئ 🚨'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Small Crown icon component
function CrownIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}
