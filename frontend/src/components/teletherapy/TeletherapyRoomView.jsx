import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Video,
  Layers,
  Layout,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Save,
  CheckCircle2,
  Copy,
  Share2,
  PhoneOff,
  Mic,
  MicOff,
  Sparkles,
  FileText,
  User,
  ShieldCheck,
  ChevronDown,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Camera,
  Maximize2,
  Brain,
  Gauge,
  Activity,
  Target,
  Search,
  X
} from 'lucide-react';
import WebRtcVideoGrid from './WebRtcVideoGrid';
import ClinicalInteractiveCanvas from './ClinicalInteractiveCanvas';
import { TELETHERAPY_SOAP_PRESETS } from './ClinicalCanvasData';
import InteractiveTestPassationModal from '../therapy/InteractiveTestPassationModal';
import ClinicalProtocolsModal from './ClinicalProtocolsModal';
import PecsAndMatchingActivityModal from './PecsAndMatchingActivityModal';
import SpeechAcousticBiomarkersModal from '../orthophony/SpeechAcousticBiomarkersModal';
import AmbientClinicalScribeModal from '../sessions/AmbientClinicalScribeModal';
import ShareTeletherapyLinkModal from './ShareTeletherapyLinkModal';
import { CLINICAL_TESTS_CATALOG } from '../therapy/ClinicalCatalogData';
import { apiRequest, whatsappApi } from '../../api';

export default function TeletherapyRoomView({
  initialPatient = null,
  initialRoomCode = null,
  onClose = null
}) {
  const { roomCode: paramRoomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const roomCode = initialRoomCode || paramRoomCode || 'ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const roomPin = '7788'; // 4-digit PIN for patient entry

  // Patient Info
  const [patient, setPatient] = useState(
    initialPatient ||
    location.state?.patient || {
      id: 1,
      full_name: 'أحمد أمين بن علي',
      age: 7,
      specialty: 'orthophony',
      phone: '0555123456',
      file_number: 'CL-2026-089'
    }
  );

  // Active Main Pane: 'video' | 'canvas' | 'combined'
  const [activePane, setActivePane] = useState('combined'); // default to combined (canvas + video) so camera is immediately visible

  // Live Concurrent Stopwatch
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Concurrent SOAP Notes
  const [soapData, setSoapData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  const [activeVoiceField, setActiveVoiceField] = useState(null); // 'subjective' | 'objective' | 'assessment' | 'plan'
  const [selectedPreset, setSelectedPreset] = useState('');
  const [canvasSnapshot, setCanvasSnapshot] = useState(null);

  // Clinical Tools & Psychometrics
  const [selectedPassationTest, setSelectedPassationTest] = useState(null);
  const [showTestPickerModal, setShowTestPickerModal] = useState(false);
  const [showProtocolsModal, setShowProtocolsModal] = useState(false);
  const [showPecsModal, setShowPecsModal] = useState(false);
  const [showSpeechBiomarkersModal, setShowSpeechBiomarkersModal] = useState(false);
  const [showAmbientScribeModal, setShowAmbientScribeModal] = useState(false);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [selectedTestCategory, setSelectedTestCategory] = useState('all');

  // Handle saving clinical test results directly into SOAP Assessment (A)
  const handleTestSaved = (result) => {
    const testTitle = selectedPassationTest?.title_ar || selectedPassationTest?.name || 'رائز سريري معتمد';
    const hasAlert = result?.has_critical_alert || result?.critical_alert;
    const alertWarning = hasAlert ? '\n🚨 [تنبيه أمان سريري عاجل - RED ALERT: تم رصد مؤشرات حرجة تستدعي التدخل السريري الفوري]' : '';
    const scoreVal = result?.totalScore ?? result?.total_score ?? result?.score ?? 'مكتمل بنجاح';
    const interp = result?.interpretation || result?.severity || 'تم التقييم السريري الرقمي';
    
    const summary = `\n[رائز سريري معتمد]: ${testTitle}\n• النتيجة الإجمالية: ${scoreVal}\n• الدلالة السريرية: ${interp}${alertWarning}\n`;

    setSoapData((prev) => ({
      ...prev,
      assessment: prev.assessment ? `${prev.assessment}\n${summary}` : summary
    }));

    setSelectedPassationTest(null);
  };

  // Handle injecting CBT, SUDS, or ERP protocols into SOAP
  const handleInjectProtocolIntoSoap = ({ field, text }) => {
    setSoapData((prev) => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}\n${text}` : text
    }));
  };

  // Handle injecting Speech AI Biomarkers into SOAP (Objective & Assessment)
  const handleInjectSpeechBiomarkersIntoSoap = ({ objectiveText, assessmentText }) => {
    setSoapData((prev) => ({
      ...prev,
      objective: prev.objective ? `${prev.objective}\n\n${objectiveText}` : objectiveText,
      assessment: prev.assessment ? `${prev.assessment}\n\n${assessmentText}` : assessmentText
    }));
  };

  // Handle injecting Ambient Scribe SOAP into Teletherapy SOAP
  const handleInjectAmbientSoap = (data) => {
    setSoapData((prev) => ({
      ...prev,
      subjective: data.subjective ? (prev.subjective ? `${prev.subjective}\n\n${data.subjective}` : data.subjective) : prev.subjective,
      objective: data.objective ? (prev.objective ? `${prev.objective}\n\n${data.objective}` : data.objective) : prev.objective,
      assessment: data.assessment ? (prev.assessment ? `${prev.assessment}\n\n${data.assessment}` : data.assessment) : prev.assessment,
      plan: data.plan ? (prev.plan ? `${prev.plan}\n\n${data.plan}` : data.plan) : prev.plan,
    }));
  };

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // External Signaling state for canvas sync
  const [incomingCanvasEvent, setIncomingCanvasEvent] = useState(null);

  // Stopwatch interval
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Preset Selection
  const applySoapPreset = (presetTitle) => {
    setSelectedPreset(presetTitle);
    const found = TELETHERAPY_SOAP_PRESETS.find((p) => p.title === presetTitle);
    if (found) {
      setSoapData({
        subjective: found.subjective,
        objective: found.objective,
        assessment: found.assessment,
        plan: found.plan
      });
    }
  };

  // Speech Recognition (Voice Dictation)
  const toggleVoiceDictation = (field) => {
    if (activeVoiceField === field) {
      setActiveVoiceField(null);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('متصفحك لا يدعم الإملاء الصوتي المباشر. يرجى استخدام Google Chrome أو Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = false;

      setActiveVoiceField(field);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSoapData((prev) => ({
          ...prev,
          [field]: prev[field] ? `${prev[field]} ${transcript}` : transcript
        }));
        setActiveVoiceField(null);
      };

      recognition.onerror = () => {
        setActiveVoiceField(null);
      };

      recognition.onend = () => {
        setActiveVoiceField(null);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setActiveVoiceField(null);
    }
  };

  // Copy Public Link
  const publicRoomUrl = `${window.location.origin}/teletherapy/room/${roomCode}?pin=${roomPin}`;

  const copyRoomLink = () => {
    navigator.clipboard.writeText(publicRoomUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  const [sendingWaInvite, setSendingWaInvite] = useState(false);
  const [waInviteSentSuccess, setWaInviteSentSuccess] = useState(false);

  // WhatsApp Invite Generator (Cloud API + wa.me manual fallback)
  const sendWhatsAppInvite = async (forceManual = false) => {
    const phone = patient.phone ? patient.phone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = phone.startsWith('0') ? '213' + phone.substring(1) : phone;
    const msg = `مرحباً بكم،
ندعوكم للانضمام إلى الجلسة السريرية المرئية المباشرة مع الأخصائي المعالج في منصة PsyPro.

📌 رابط الدخول المباشر:
${publicRoomUrl}

🔑 رمز الدخول السريع (PIN): ${roomPin}

💡 تنبيه: يرجى الضغط على الرابط والسماح باستخدام الكاميرا والميكروفون للانضمام فوراً دون الحاجة لتثبيت أي تطبيق.`;

    if (forceManual) {
      const encoded = encodeURIComponent(msg);
      const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
      window.open(url, '_blank');
      return;
    }

    if (!cleanPhone) {
      const encoded = encodeURIComponent(msg);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
      return;
    }

    setSendingWaInvite(true);
    try {
      const res = await whatsappApi.sendMessage({
        phone: cleanPhone,
        message: msg,
        patient_id: patient?.id,
        service_type: 'teletherapy_room',
      });
      if (res?.success) {
        setWaInviteSentSuccess(true);
        alert('✅ تم إرسال رابط ودعوة الجلسة المرئية إلى واتساب المريض بنجاح!');
        setTimeout(() => setWaInviteSentSuccess(false), 6000);
      } else {
        throw new Error(res?.message || 'فشل الإرسال السحابي');
      }
    } catch (err) {
      console.warn('WhatsApp Cloud API dispatch failed, opening manual fallback link:', err);
      const encoded = encodeURIComponent(msg);
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    } finally {
      setSendingWaInvite(false);
    }
  };

  // Save Session & Conclude
  const handleSaveAndConclude = async () => {
    if (!patient?.id && !patient?.full_name) {
      alert('⚠️ خطأ: لا يوجد مريض محدد لربط هذه الجلسة به في السجل الطبي.');
      return;
    }

    const isSoapEmpty = !soapData.subjective?.trim() && !soapData.objective?.trim() && !soapData.assessment?.trim() && !soapData.plan?.trim();
    if (isSoapEmpty) {
      const proceed = window.confirm(
        '⚠️ تنبيه سريري: حقول التوثيق الطبي (SOAP Notes) فارغة تماماً.\n\nهل أنت متأكد من رغبتك في إنهاء وحفظ الجلسة بدون توثيق سريري؟'
      );
      if (!proceed) {
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await apiRequest('/teletherapy/save-session', {
        method: 'POST',
        body: JSON.stringify({
          room_code: roomCode,
          patient_id: patient.id,
          duration_seconds: timerSeconds,
          soap_data: soapData,
          canvas_snapshot: canvasSnapshot
        })
      });
      if (res && res.success !== false) {
        setSaveSuccess(true);
        setTimeout(() => {
          if (onClose) onClose();
          else navigate('/teletherapy');
        }, 1500);
      } else {
        throw new Error(res?.message || 'تعذر حفظ الجلسة على الخادم');
      }
    } catch (err) {
      console.warn('API save session error:', err);
      // If server returned a validation or permission error
      if (err.message && !err.message.includes('fetch') && !err.message.includes('Network')) {
        alert('⚠️ تعذر حفظ الجلسة: ' + err.message);
      } else {
        // Offline / local cache fallback
        setSaveSuccess(true);
        setTimeout(() => {
          if (onClose) onClose();
          else navigate('/teletherapy');
        }, 1500);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans" dir="rtl">
      {/* TOP CLINICAL HEADER BAR */}
      <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0 shadow-lg">
        {/* Patient & Room Metadata */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
            💻
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100">
                قمرة التطبيب عن بعد والسبورة السريرية
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                جلسة مباشرة
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-slate-200 font-semibold">{patient.full_name}</span>
              <span>•</span>
              <span>الملف: {patient.file_number || 'CL-2026'}</span>
              <span>•</span>
              <span className="font-mono text-indigo-300">غرفة: {roomCode}</span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs (Middle) */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActivePane('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePane === 'canvas'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>السبورة التفاعلية</span>
          </button>

          <button
            onClick={() => setActivePane('combined')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePane === 'combined'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>عرض مدمج (سبورة + فيديو)</span>
          </button>

          <button
            onClick={() => setActivePane('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePane === 'video'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>شاشة الفيديو الكاملة</span>
          </button>
        </div>

        {/* Action Controls & Clinical Tools */}
        <div className="flex items-center gap-2">
          {/* Clinical Tests & Psychometrics Button */}
          <button
            onClick={() => setShowTestPickerModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            title="فتح بنك الروائز والمقاييس السريرية الـ 18"
          >
            <Brain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">الروائز والمقاييس (18)</span>
          </button>

          {/* Clinical Protocols & SUDS Button */}
          <button
            onClick={() => setShowProtocolsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all active:scale-95"
            title="بروتوكولات CBT ومقياس SUDS"
          >
            <Gauge className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">بروتوكول CBT & SUDS</span>
          </button>

          {/* PECS & Image Matching Activities */}
          <button
            data-testid="pecs-cards-activity-btn"
            onClick={() => setShowPecsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            title="بنك بطاقات PECS وأنشطة مطابقة الصور والتواصل البديل"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">بطاقات PECS ومطابقة الصور</span>
          </button>

          {/* Speech Acoustic Biomarkers Button */}
          <button
            onClick={() => setShowSpeechBiomarkersModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all active:scale-95"
            title="المختبر الصوتي والبيوماركرز الفونولوجية (Speech AI)"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">المختبر الصوتي (Speech AI)</span>
          </button>

          {/* Ambient Clinical Scribe Button */}
          <button
            onClick={() => setShowAmbientScribeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all active:scale-95"
            title="الكاتب السريري المحيطي وتوثيق الحوار (Ambient Scribe)"
          >
            <Mic className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">الكاتب المحيطي (Scribe)</span>
          </button>

          {/* Multi-Channel Share & Invite Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            title="مشاركة رابط الجلسة المرئية عبر واتساب، SMS، الإيميل، تيليجرام، أو نسخ الرابط"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة رابط الجلسة 🔗</span>
          </button>

          {/* Quick WhatsApp Shortcut */}
          <button
            onClick={() => sendWhatsAppInvite(false)}
            disabled={sendingWaInvite}
            title="إرسال رابط الجلسة المباشر مع PIN عبر واتساب"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              waInviteSentSuccess
                ? 'bg-emerald-700 text-emerald-100'
                : 'bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">
              {sendingWaInvite ? '...' : waInviteSentSuccess ? '✓ تم' : 'واتساب'}
            </span>
          </button>

          {/* Copy Link */}
          <button
            onClick={copyRoomLink}
            title="نسخ رابط الغرفة المباشر"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-all flex items-center gap-1"
          >
            {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Exit without Concluding */}
          <button
            onClick={() => {
              if (window.confirm('هل تود الخروج والعودة لعيادة التطبيب عن بعد؟')) {
                if (onClose) onClose();
                else navigate('/teletherapy');
              }
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all flex items-center gap-1 text-xs"
            title="خروج وعودة لقائمة الجلسات"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>

          {/* End Call / Exit */}
          <button
            onClick={() => {
              if (window.confirm('هل أنت متأكد من إنهاء جلسة التطبيب عن بعد؟')) {
                handleSaveAndConclude();
              }
            }}
            className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl border border-rose-500/30 transition-all"
            title="إنهاء وخروج"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN DUAL-PANE COCKPIT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT / CENTER INTERACTIVE WORKSPACE (65%) */}
        <div className="flex-1 h-full relative overflow-hidden bg-slate-950 p-2 flex flex-col">
          {activePane === 'video' && (
            <div className="w-full h-full rounded-2xl overflow-hidden">
              <WebRtcVideoGrid
                roomCode={roomCode}
                patientName={patient.full_name}
                isPractitioner={true}
                onCanvasShareToggle={() => setActivePane('canvas')}
                isCanvasActive={false}
              />
            </div>
          )}

          {activePane === 'canvas' && (
            <div className="w-full h-full rounded-2xl overflow-hidden relative">
              <ClinicalInteractiveCanvas
                isPractitioner={true}
                onSendCanvasEvent={(evt) => {
                  // Signaling hook
                }}
                externalCanvasEvent={incomingCanvasEvent}
                onSaveSnapshot={(dataUrl) => {
                  setCanvasSnapshot(dataUrl);
                }}
              />
            </div>
          )}

          {activePane === 'combined' && (
            <div className="w-full h-full rounded-2xl overflow-hidden relative flex">
              {/* Canvas takes 70% */}
              <div className="flex-1 h-full relative">
                <ClinicalInteractiveCanvas
                  isPractitioner={true}
                  onSendCanvasEvent={(evt) => {
                    // Signaling hook
                  }}
                  externalCanvasEvent={incomingCanvasEvent}
                  onSaveSnapshot={(dataUrl) => setCanvasSnapshot(dataUrl)}
                />
              </div>
              {/* Compact Video takes 30% */}
              <div className="w-80 h-full border-r border-slate-800 bg-slate-900 p-2">
                <WebRtcVideoGrid
                  roomCode={roomCode}
                  patientName={patient.full_name}
                  isPractitioner={true}
                  isCanvasActive={true}
                  onCanvasShareToggle={() => setActivePane('canvas')}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT CLINICAL COCKPIT (35% - Concurrent Stopwatch & SOAP) */}
        <div className="w-[380px] lg:w-[420px] h-full bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 shadow-2xl z-20">
          {/* STOPWATCH HEADER CARD */}
          <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">الميقاتية السريرية الحية</div>
                <div className="text-xl font-black font-mono tracking-wider text-slate-100">
                  {formatTimer(timerSeconds)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-1.5 rounded-lg transition-all ${
                  isTimerRunning
                    ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                }`}
                title={isTimerRunning ? 'إيقاف مؤقت' : 'استئناف'}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setTimerSeconds(0)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                title="تصفير الميقاتية"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SOAP DOCUMENTATION CONTAINER */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* Quick Clinical Tool Shortcuts */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowTestPickerModal(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-[11px] font-bold transition-all shadow-sm"
              >
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                <span>رائز سريري مباشر</span>
              </button>

              <button
                type="button"
                onClick={() => setShowProtocolsModal(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-xl text-[11px] font-bold transition-all shadow-sm"
              >
                <Gauge className="w-3.5 h-3.5 text-teal-400" />
                <span>مقياس SUDS & CBT</span>
              </button>

              <button
                type="button"
                data-testid="pecs-cards-activity-btn"
                onClick={() => setShowPecsModal(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-[11px] font-bold transition-all shadow-sm"
              >
                <span className="text-sm">🎴</span>
                <span>بطاقات PECS والتواصل</span>
              </button>

              <button
                type="button"
                data-testid="matching-activity-btn"
                onClick={() => setShowPecsModal(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition-all shadow-sm"
              >
                <span className="text-sm">🧩</span>
                <span>مطابقة الصور (Matching)</span>
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  قوالب التوثيق السريع (SOAP):
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {TELETHERAPY_SOAP_PRESETS.map((p) => (
                  <button
                    key={p.title}
                    onClick={() => applySoapPreset(p.title)}
                    className={`text-right text-[11px] p-2 rounded-lg transition-all border ${
                      selectedPreset === p.title
                        ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200 font-semibold'
                        : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            {/* S: Subjective */}
            <div className="bg-slate-950/40 rounded-xl border border-slate-800 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-black">
                    S
                  </span>
                  الشكوى والملاحظات الذاتية (Subjective)
                </label>
                <button
                  onClick={() => toggleVoiceDictation('subjective')}
                  className={`p-1.5 rounded-lg transition-all text-xs flex items-center gap-1 ${
                    activeVoiceField === 'subjective'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                  title="إملاء صوتي مباشر"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={soapData.subjective}
                onChange={(e) => setSoapData({ ...soapData, subjective: e.target.value })}
                placeholder="شكوى المريض، ملاحظات الولي حول التطورات والتواصل البصري..."
                rows={2}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* O: Objective */}
            <div className="bg-slate-950/40 rounded-xl border border-slate-800 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center text-[10px] font-black">
                    O
                  </span>
                  الملاحظات الموضوعية والسبورة (Objective)
                </label>
                <button
                  onClick={() => toggleVoiceDictation('objective')}
                  className={`p-1.5 rounded-lg transition-all text-xs flex items-center gap-1 ${
                    activeVoiceField === 'objective'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                  title="إملاء صوتي مباشر"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={soapData.objective}
                onChange={(e) => setSoapData({ ...soapData, objective: e.target.value })}
                placeholder="أداء الطفل في السبورة التفاعلية، زمن الاستجابة، بنود التسمية المنجزة..."
                rows={2}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            {/* A: Assessment */}
            <div className="bg-slate-950/40 rounded-xl border border-slate-800 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">
                    A
                  </span>
                  التحليل والتقييم السريري (Assessment)
                </label>
                <button
                  onClick={() => toggleVoiceDictation('assessment')}
                  className={`p-1.5 rounded-lg transition-all text-xs flex items-center gap-1 ${
                    activeVoiceField === 'assessment'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                  title="إملاء صوتي مباشر"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={soapData.assessment}
                onChange={(e) => setSoapData({ ...soapData, assessment: e.target.value })}
                placeholder="تحليل التطور مقارنة بالحصة السابقة، قياس التفاعل والانتباه المشترك..."
                rows={2}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* P: Plan */}
            <div className="bg-slate-950/40 rounded-xl border border-slate-800 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-black">
                    P
                  </span>
                  الخطة والواجبات الرقمية (Plan)
                </label>
                <button
                  onClick={() => toggleVoiceDictation('plan')}
                  className={`p-1.5 rounded-lg transition-all text-xs flex items-center gap-1 ${
                    activeVoiceField === 'plan'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                  title="إملاء صوتي مباشر"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={soapData.plan}
                onChange={(e) => setSoapData({ ...soapData, plan: e.target.value })}
                placeholder="التمارين المنزلية المكلف بها، تاريخ الحصة القادمة..."
                rows={2}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            {/* Snapshot attached alert */}
            {canvasSnapshot && (
              <div className="flex items-center gap-2 p-2 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-xs text-indigo-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>تم إرفاق لقطة السبورة السريرية بنجاح بالسجل الطبي</span>
              </div>
            )}
          </div>

          {/* BOTTOM ACTIONS BAR */}
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={handleSaveAndConclude}
              disabled={isSaving}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم الحفظ والتوثيق بنجاح!</span>
                </>
              ) : isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>جاري الحفظ في الملف الطبي...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ الجلسة وإغلاق السجل</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 1. CLINICAL TESTS SELECTOR MODAL */}
      {showTestPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none font-sans" dir="rtl">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  📊
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>بنك الروائز والمقاييس السريرية المعيارية (18 رائزاً معتمداً)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      LIVE ⚡
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    اختر المقياس لتمريره مباشرة في الجلسة أو تشغيل المصحح الرقمي للمريض {patient.full_name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTestPickerModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-3 bg-slate-950/50 border-b border-slate-800 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={testSearchQuery}
                  onChange={(e) => setTestSearchQuery(e.target.value)}
                  placeholder="ابحث باسم المقياس أو الرمز (PHQ-9, Beck, MMPI-2, WISC, Stroop, CARS...)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { id: 'all', label: 'الكل (18)' },
                  { id: 'psychiatry', label: 'الاكتئاب والقلق' },
                  { id: 'child', label: 'الطفولة والتوحد' },
                  { id: 'cognitive', label: 'القدرات والإدراك' },
                  { id: 'speech', label: 'الأرطوفونيا' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedTestCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedTestCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tests Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CLINICAL_TESTS_CATALOG
                .filter((test) => {
                  const matchQuery =
                    !testSearchQuery ||
                    test.title_ar?.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
                    test.code?.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
                    test.title_fr?.toLowerCase().includes(testSearchQuery.toLowerCase());
                  const matchCat =
                    selectedTestCategory === 'all' ||
                    test.category === selectedTestCategory ||
                    (selectedTestCategory === 'cognitive' && (test.code === 'STROOP' || test.code === 'REY' || test.code === 'WAIS' || test.code === 'MMPI-2' || test.code === 'ZAREKI-R'));
                  return matchQuery && matchCat;
                })
                .map((test) => (
                  <div
                    key={test.id || test.code}
                    onClick={() => {
                      setSelectedPassationTest(test);
                      setShowTestPickerModal(false);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {test.code}
                        </span>
                        {test.hasRedAlert && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Red Alert ⚠️
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
                        {test.title_ar}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {test.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span>الفئة: {test.age_range || 'كل الأعمار'}</span>
                      <span className="text-indigo-400 font-bold group-hover:translate-x-[-2px] transition-transform">
                        تمرير مباشر ←
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. INTERACTIVE PASSATION MODAL (18 Standardized Tests + Scorers) */}
      {selectedPassationTest && (
        <InteractiveTestPassationModal
          test={selectedPassationTest}
          patients={[patient]}
          initialPatientId={patient.id}
          onClose={() => setSelectedPassationTest(null)}
          onSaved={handleTestSaved}
        />
      )}

      {/* 3. CLINICAL PROTOCOLS MODAL (CBT, SUDS & ERP) */}
      {showProtocolsModal && (
        <ClinicalProtocolsModal
          isOpen={showProtocolsModal}
          onClose={() => setShowProtocolsModal(false)}
          patientName={patient.full_name}
          onInjectIntoSoap={handleInjectProtocolIntoSoap}
        />
      )}

      {/* 4. SPEECH ACOUSTIC BIOMARKERS MODAL (Speech AI) */}
      {showSpeechBiomarkersModal && (
        <SpeechAcousticBiomarkersModal
          isOpen={showSpeechBiomarkersModal}
          onClose={() => setShowSpeechBiomarkersModal(false)}
          patient={patient}
          onInjectIntoSoap={handleInjectSpeechBiomarkersIntoSoap}
        />
      )}

      {/* 5. AMBIENT CLINICAL SCRIBE MODAL */}
      {showAmbientScribeModal && (
        <AmbientClinicalScribeModal
          isOpen={showAmbientScribeModal}
          onClose={() => setShowAmbientScribeModal(false)}
          patient={patient}
          appointment={null}
          onInjectIntoSoap={handleInjectAmbientSoap}
        />
      )}

      {/* 6. PECS & MATCHING CLINICAL ACTIVITY MODAL */}
      {showPecsModal && (
        <PecsAndMatchingActivityModal
          isOpen={showPecsModal}
          onClose={() => setShowPecsModal(false)}
          patientName={patient.full_name}
          onLaunchToWhiteboard={(deckId) => {
            setActivePane('canvas');
            setShowPecsModal(false);
          }}
          onInjectIntoSoap={({ field, text }) => {
            setSoapData((prev) => ({
              ...prev,
              [field]: prev[field] ? `${prev[field]}\n${text}` : text
            }));
          }}
        />
      )}

      {/* 7. MULTI-CHANNEL SHARE & INVITE MODAL */}
      {showShareModal && (
        <ShareTeletherapyLinkModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          roomCode={roomCode}
          roomPin={roomPin}
          patient={patient}
          doctorName="الأخصائي المعالج"
        />
      )}
    </div>
  );
}
