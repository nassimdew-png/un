import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Clock,
  Calendar,
  Phone,
  Volume2,
  VolumeX,
  Plus,
  CheckCircle2,
  Play,
  DollarSign,
  Printer,
  UploadCloud,
  FileText,
  Search,
  UserPlus,
  Send,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  PhoneCall,
  CalendarDays,
  CreditCard,
  Building2,
  Filter,
  Eye,
  RefreshCw,
  Flame,
  Radio,
  Share2,
  Trash2,
  UserCheck
} from 'lucide-react';
import { appointmentApi, patientApi, clinicApi, invoiceApi, staffApi } from '../../api';
import FastPatientIntakeModal from './FastPatientIntakeModal';
import ExternalDocumentScannerModal from './ExternalDocumentScannerModal';
import FrontDeskReceiptModal from './FrontDeskReceiptModal';
import WhatsAppPreIntakeModal from './WhatsAppPreIntakeModal';
import PatientArrivalCheckInModal from './PatientArrivalCheckInModal';
import { getPatientProfileInfo } from '../../utils/patientHelper';

// Status Configuration for Reception
const STATUS_MAP = {
  all: { label: 'جميع المواعيد', badge: 'bg-slate-800 text-slate-300' },
  confirmed: { label: 'في قاعة الانتظار (حاضر)', badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  scheduled: { label: 'مبرمج (لم يحضر بعد)', badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  in_progress: { label: 'الجلسة جارية (قيد الفحص)', badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' },
  completed: { label: 'مكتملة ومنتهية', badge: 'bg-slate-700 text-slate-300' },
  no_show: { label: 'غياب (No-Show)', badge: 'bg-red-500/20 text-red-300 border border-red-500/30' },
  cancelled: { label: 'ملغاة', badge: 'bg-slate-800 text-slate-500' },
};

export default function FrontDeskReceptionCockpit({ tenant, user, patients = [] }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Active Tab
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'intake', 'scanner', 'cashier', 'calls'

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Audio Chime Toggle
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callingPatientId, setCallingPatientId] = useState(null);

  // Appointments & Queue Data
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [staffSpecialists, setStaffSpecialists] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialistFilter, setSpecialistFilter] = useState('');

  // Modals
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);
  const [arrivalInitialPatient, setArrivalInitialPatient] = useState(null);
  const [isFastIntakeOpen, setIsFastIntakeOpen] = useState(false);
  const [isDocScannerOpen, setIsDocScannerOpen] = useState(false);
  const [scannerInitialPatientId, setScannerInitialPatientId] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptInitialData, setReceiptInitialData] = useState(null);
  const [isPreIntakeModalOpen, setIsPreIntakeModalOpen] = useState(false);
  const [preIntakePatient, setPreIntakePatient] = useState(null);

  // Phone Call Logs (Persistent via localStorage)
  const phoneStorageKey = `clinic_phone_calls_${tenant?.id || 'default'}`;
  const [phoneCalls, setPhoneCalls] = useState(() => {
    try {
      const saved = localStorage.getItem(phoneStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [newCallData, setNewCallData] = useState({
    caller_name: '',
    phone: '',
    purpose: 'new_appointment', // new_appointment, pricing_info, reschedule, followup
    notes: '',
    status: 'pending', // pending, booked, resolved
  });
  const [showAddCallBox, setShowAddCallBox] = useState(false);

  // Toast feedback
  const [feedback, setFeedback] = useState(null);

  const showToast = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save phone calls
  useEffect(() => {
    try {
      localStorage.setItem(phoneStorageKey, JSON.stringify(phoneCalls));
    } catch (e) {}
  }, [phoneCalls, phoneStorageKey]);

  // Fetch today's appointments and summary
  const fetchTodayData = async () => {
    setLoadingAppts(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [apptRes, summaryRes] = await Promise.allSettled([
        appointmentApi.list({ date: todayStr }),
        clinicApi.getTodayAgendaSummary ? clinicApi.getTodayAgendaSummary() : clinicApi.getTodaySummary(),
      ]);

      if (apptRes.status === 'fulfilled') {
        const list = apptRes.value?.appointments || apptRes.value?.data || apptRes.value || [];
        setAppointments(Array.isArray(list) ? list : []);
      }

      if (summaryRes.status === 'fulfilled') {
        setSummaryData(summaryRes.value);
      }
    } catch (err) {
      console.error('Error loading front desk data:', err);
    } finally {
      setLoadingAppts(false);
    }
  };

  useEffect(() => {
    fetchTodayData();
    // Fetch staff specialists
    const loadStaff = async () => {
      try {
        const res = await staffApi.list();
        const list = res.staff || res.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          setStaffSpecialists(list);
        }
      } catch (e) {
        console.warn('Failed to load staff specialists:', e);
      }
    };
    loadStaff();
    // Refresh queue every 45 seconds
    const interval = setInterval(fetchTodayData, 45000);
    return () => clearInterval(interval);
  }, []);

  // Audio Calling Chime + Arabic Speech Announcement
  const handleCallPatient = (appointment) => {
    const patientName = appointment.patient
      ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
      : 'المريض';
    const doctorName = appointment.specialist?.name || 'الأخصائي المعالج';

    setCallingPatientId(appointment.id);
    setTimeout(() => setCallingPatientId(null), 6000);

    if (!audioEnabled) {
      showToast(`تم إرسال نداء بصري للمريض: ${patientName}`);
      return;
    }

    // 1. Dual-Tone Medical Chime (D5 587Hz -> A5 880Hz)
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      }
    } catch (e) {
      console.log('Audio chime error:', e);
    }

    // 2. Arabic Voice Announcement via Web Speech API
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const message = `نداء للمريض ${patientName}. يرجى التوجه لغرفة الفحص لدى ${doctorName}`;
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.log('Speech synthesis error:', e);
    }

    showToast(`🔊 تم إطلاق النداء الصوتي للمريض: ${patientName}`);
  };

  // 1-Click Check-In (Moves to Waiting Room: 'confirmed')
  const handleCheckIn = async (appointmentId) => {
    try {
      await appointmentApi.update(appointmentId, {
        status: 'confirmed',
      });
      showToast('🟢 تم تسجيل حضور المريض في قاعة الانتظار بنجاح.');
      fetchTodayData();
    } catch (err) {
      console.error('Check-in error:', err);
      showToast('فشل تحديث حالة الحضور.', 'error');
    }
  };

  // 1-Click Dispatch to Therapist (Moves to 'in_progress')
  const handleDispatchToSession = async (appointmentId) => {
    try {
      await appointmentApi.update(appointmentId, {
        status: 'in_progress',
      });
      showToast('🩺 تم تحويل المريض لغرفة الفحص وبدء الجلسة.');
      fetchTodayData();
    } catch (err) {
      console.error('Dispatch error:', err);
      showToast('فشل تحويل المريض.', 'error');
    }
  };

  // 1-Click Mark Completed
  const handleMarkCompleted = async (appointmentId) => {
    try {
      await appointmentApi.update(appointmentId, {
        status: 'completed',
      });
      showToast('✅ تم إنهاء الجلسة واكتمالها.');
      fetchTodayData();
    } catch (err) {
      console.error('Completion error:', err);
      showToast('فشل إنهاء الجلسة.', 'error');
    }
  };

  // Send / Prepare WhatsApp Pre-Intake Magic Link Modal
  const handleSendWhatsAppMagicLink = (patient) => {
    if (!patient) return;
    setPreIntakePatient(patient);
    setIsPreIntakeModalOpen(true);
  };

  // Open Scanner for specific patient
  const handleOpenScannerForPatient = (patientId) => {
    setScannerInitialPatientId(patientId);
    setIsDocScannerOpen(true);
  };

  // Open Cashier for specific appointment
  const handleOpenCashierForAppointment = (app) => {
    setReceiptInitialData({
      patient: app.patient,
      appointment: app,
    });
    setIsReceiptModalOpen(true);
  };

  // Add Phone Call Entry
  const handleSavePhoneCall = (e) => {
    e.preventDefault();
    if (!newCallData.caller_name || !newCallData.phone) {
      showToast('يرجى ملء اسم المتصل ورقم الهاتف.', 'error');
      return;
    }

    const entry = {
      id: Date.now(),
      ...newCallData,
      time: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('ar-DZ'),
    };

    setPhoneCalls([entry, ...phoneCalls]);
    setNewCallData({
      caller_name: '',
      phone: '',
      purpose: 'new_appointment',
      notes: '',
      status: 'pending',
    });
    setShowAddCallBox(false);
    showToast('تم توثيق المكالمة بنجاح.');
  };

  // Convert phone call to Fast Intake
  const handleConvertCallToIntake = (call) => {
    setIsFastIntakeOpen(true);
  };

  // Delete Call
  const handleDeleteCall = (id) => {
    setPhoneCalls(phoneCalls.filter((c) => c.id !== id));
    showToast('تم حذف سجل المكالمة.');
  };

  // Compute Daily KPIs
  const kpis = useMemo(() => {
    const totalToday = appointments.length;
    const waitingRoom = appointments.filter((a) => a.status === 'confirmed').length;
    const inProgress = appointments.filter((a) => a.status === 'in_progress').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const todayCollected = summaryData?.stats?.today_collected || 0;

    return {
      totalToday,
      waitingRoom,
      inProgress,
      completed,
      todayCollected,
    };
  }, [appointments, summaryData]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Status
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;

      // Specialist
      if (specialistFilter && String(app.specialist_id) !== String(specialistFilter)) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const pName = `${app.patient?.first_name || ''} ${app.patient?.last_name || ''}`.toLowerCase();
        const phone = (app.patient?.phone || '').toLowerCase();
        const docName = (app.specialist?.name || '').toLowerCase();
        const match = pName.includes(query) || phone.includes(query) || docName.includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [appointments, statusFilter, specialistFilter, searchQuery]);

  // Unique Specialists for Filter & Check-In
  const uniqueSpecialists = useMemo(() => {
    const map = new Map();
    appointments.forEach((a) => {
      if (a.specialist && !map.has(a.specialist.id)) {
        map.set(a.specialist.id, a.specialist);
      }
    });
    return Array.from(map.values());
  }, [appointments]);

  // Combined Specialists (Staff + Specialists from appointments + Current User)
  const allAvailableSpecialists = useMemo(() => {
    const map = new Map();
    if (user?.id) {
      map.set(user.id, { id: user.id, name: user.name || 'الأخصائي الحالي' });
    }
    staffSpecialists.forEach((s) => {
      if (s.id) map.set(s.id, s);
    });
    uniqueSpecialists.forEach((s) => {
      if (s.id) map.set(s.id, s);
    });
    return Array.from(map.values());
  }, [staffSpecialists, uniqueSpecialists, user]);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top ${
            feedback.type === 'error'
              ? 'bg-red-950 border border-red-500/50 text-red-200'
              : 'bg-emerald-950 border border-emerald-500/50 text-emerald-200'
          }`}
        >
          {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* 1. Executive Top Header with Digital Clock & Fast Actions */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Title & Reception Desk Branding */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-teal-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <span>قمرة الاستقبال والسكرتارية الطبية</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono font-bold">
                    FRONT-DESK COCKPIT 👩‍💼
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {tenant?.header_title_ar || tenant?.name} • إدارة تدفق قاعة الانتظار، التسجيل الإداري، وأرشفة بطاقات الشفاء
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Live Clock, Audio Chime Toggle & Top Fast Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Live Clock Card */}
            <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-right">
                <div className="text-base font-black font-mono tracking-wider text-white">
                  {currentTime.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {currentTime.toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>

            {/* Audio Calling Chime Toggle */}
            <button
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                showToast(audioEnabled ? 'تم كتم النداء الصوتي' : 'تم تفعيل النداء الصوتي');
              }}
              className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                audioEnabled
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title="تفعيل أو كتم نداء المرضى الصوتي بالمكبر"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span className="hidden sm:inline">{audioEnabled ? 'النداء الصوتي مفعّل' : 'صامت'}</span>
            </button>

            {/* PRIMARY ACTION: Walk-in Patient Arrival Check-In */}
            <button
              onClick={() => {
                setArrivalInitialPatient(null);
                setIsArrivalModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all transform active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>تسجيل مريض حضر الآن (Walk-in) 🚪</span>
            </button>

            {/* Fast Intake Button */}
            <button
              onClick={() => setIsFastIntakeOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all transform active:scale-95"
              title="تسجيل ملف مريض جديد في النظام"
            >
              <UserPlus className="w-4 h-4 text-teal-400" />
              <span>ملف جديد ⚡</span>
            </button>

            {/* Quick Cashier Button */}
            <button
              onClick={() => {
                setReceiptInitialData(null);
                setIsReceiptModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all transform active:scale-95"
            >
              <DollarSign className="w-4 h-4" />
              <span>قبض أتعاب 💵</span>
            </button>

            {/* Document Scanner Button */}
            <button
              onClick={() => {
                setScannerInitialPatientId(null);
                setIsDocScannerOpen(true);
              }}
              className="p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="مسح وأرشفة بطاقات الشفاء والمستندات"
            >
              <UploadCloud className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Launch Kiosk Screen */}
            <button
              onClick={() => navigate('/kiosk')}
              className="p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="فتح شاشة الاستقبال الذاتي (Kiosk PIN)"
            >
              <Radio className="w-4 h-4 text-teal-400" />
            </button>

            {/* Print Today Schedule */}
            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="طباعة جدول حضور اليوم"
            >
              <Printer className="w-4 h-4 text-slate-400" />
            </button>
          </div>

        </div>

        {/* Medical Privacy Firewall Banner */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>
              <strong className="text-teal-300 font-bold">جدار الحماية السريرية مفعّل:</strong> الملاحظات النفسية العميقة (SOAP) وبنود المقاييس محجوبة عن موظفي الاستقبال ومخصصة للأطباء المشرفين فقط.
            </span>
          </div>
          <button
            onClick={fetchTodayData}
            disabled={loadingAppts}
            className="text-slate-400 hover:text-teal-300 flex items-center gap-1 font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAppts ? 'animate-spin text-teal-400' : ''}`} />
            <span>تحديث فوري</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 Real-Time Pulse Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Card 1: Total Appointments */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">مواعيد اليوم الكلية</span>
            <span className="text-2xl font-black text-white font-mono">{kpis.totalToday}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Waiting Room Live */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <span className="text-[11px] text-emerald-400 font-bold block flex items-center gap-1">
              <span>في قاعة الانتظار</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LIVE
              </span>
            </span>
            <span className="text-2xl font-black text-emerald-300 font-mono">{kpis.waitingRoom}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: In Session */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-cyan-400 font-bold block">في غرف الفحص</span>
            <span className="text-2xl font-black text-cyan-300 font-mono">{kpis.inProgress}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
            <Play className="w-5 h-5 fill-cyan-400" />
          </div>
        </div>

        {/* Card 4: Completed Sessions */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">اكتملت الجلسة</span>
            <span className="text-2xl font-black text-slate-200 font-mono">{kpis.completed}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
          </div>
        </div>

        {/* Card 5: Cashier Today */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg shadow-amber-500/5 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[11px] text-amber-400 font-bold block">مقبوضات الصندوق</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-amber-300 font-mono">
                {kpis.todayCollected.toLocaleString('fr-FR')}
              </span>
              <span className="text-[10px] text-amber-400 font-bold">دج</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. Main Cockpit Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'queue'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>تدفق قاعة الانتظار ومواعيد اليوم ({filteredAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'scanner'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>أرشفة وماسح الوثائق والشفاء 📂</span>
        </button>

        <button
          onClick={() => setActiveTab('cashier')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'cashier'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>صندوق القبض والوصولات الفورية 💵</span>
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'calls'
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>سجل المكالمات والاستفسارات ({phoneCalls.length}) 📞</span>
        </button>
      </div>

      {/* TAB 1: LIVE QUEUE & PATIENT FLOW */}
      {activeTab === 'queue' && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {Object.entries(STATUS_MAP).map(([key, cfg]) => {
                const count =
                  key === 'all'
                    ? appointments.length
                    : appointments.filter((a) => a.status === key).length;
                const isSelected = statusFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{cfg.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search, Doctor Filter & Quick Walk-in Check-in */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم المريض أو الهاتف..."
                  className="w-full px-3 py-1.5 pl-8 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>

              {allAvailableSpecialists.length > 0 && (
                <select
                  value={specialistFilter}
                  onChange={(e) => setSpecialistFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none"
                >
                  <option value="">جميع الأخصائيين</option>
                  {allAvailableSpecialists.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => {
                  setArrivalInitialPatient(null);
                  setIsArrivalModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 shrink-0 transition"
                title="تسجيل حضور مريض حضر الآن لقاعة الانتظار"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">حضور مريض</span>
                <span>(Walk-in)</span>
              </button>
            </div>

          </div>

          {/* Queue Cards List */}
          {loadingAppts ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-400" />
              <p className="text-xs">جاري تحميل تدفق قاعة الانتظار...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-10 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
              <Clock className="w-10 h-10 mx-auto text-slate-600" />
              <h4 className="text-sm font-bold text-white">لا توجد مواعيد تطابق الفلتر المحدد لليوم.</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                إذا حضر مريض للعيادة الآن بدون موعد مسبق أو رغب في الدخول لقاعة الانتظار، يمكنك تسجيل حضوره فوراً.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setArrivalInitialPatient(null);
                    setIsArrivalModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>تسجيل حضور مريض حضر الآن (Walk-in) 🚪</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFastIntakeOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4 text-teal-400" />
                  <span>تسجيل ملف جديد ⚡</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((app) => {
                const isWaiting = app.status === 'confirmed';
                const isInProgress = app.status === 'in_progress';
                const isCalling = callingPatientId === app.id;
                const timeStr = app.appointment_date?.split('T')[1]?.slice(0, 5) || '09:00';
                const stCfg = STATUS_MAP[app.status] || STATUS_MAP.scheduled;

                return (
                  <div
                    key={app.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCalling
                        ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/20'
                        : isWaiting
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                        : isInProgress
                        ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Patient & Clinic Details */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-black text-brand-400 font-mono px-2 py-0.5 rounded-lg bg-brand-500/10 border border-brand-500/20">
                            ⏰ {timeStr}
                          </span>
                          
                          <span className="text-sm font-black text-white">
                            {app.patient ? `${app.patient.first_name} ${app.patient.last_name}` : 'مريض غير محدد'}
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${stCfg.badge}`}>
                            {stCfg.label}
                          </span>

                          {isWaiting && (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              <span>حاضر في قاعة الانتظار</span>
                            </span>
                          )}

                          {isCalling && (
                            <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/40 animate-pulse flex items-center gap-1">
                              <Volume2 className="w-3 h-3 text-indigo-400" />
                              <span>جاري نداء المريض بالمكبر 📢</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                          {app.patient?.phone && (
                            <span className="font-mono text-[11px] text-slate-300 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{app.patient.phone}</span>
                            </span>
                          )}

                          <span>👨‍⚕️ {app.specialist?.name || 'الأخصائي المعالج'}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-300 font-semibold">{app.type?.replace(/_/g, ' ')}</span>
                          
                          {app.notes && (
                            <span className="text-slate-400 italic">({app.notes})</span>
                          )}
                        </div>
                      </div>

                      {/* Front-Desk Quick Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                        
                        {/* 1. Check-In Button (If scheduled) */}
                        {app.status === 'scheduled' && (
                          <button
                            onClick={() => handleCheckIn(app.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                            title="تسجيل حضور المريض لقاعة الانتظار"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تسجيل الحضور (Check-In)</span>
                          </button>
                        )}

                        {/* 2. Call Patient Audio Chime */}
                        <button
                          onClick={() => handleCallPatient(app)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                          title="نداء صوتي بالمكبر وجرس المستشفيات"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>نداء صوتي بالمكبر</span>
                        </button>

                        {/* 3. Dispatch to Therapist (If waiting) */}
                        {isWaiting && (
                          <button
                            onClick={() => handleDispatchToSession(app.id)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
                            title="تحويل المريض لغرفة الفحص وبدء الجلسة"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>تحويل للأخصائي</span>
                          </button>
                        )}

                        {/* 4. Complete Session (If in progress) */}
                        {isInProgress && (
                          <button
                            onClick={() => handleMarkCompleted(app.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                            title="إنهاء الجلسة"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>إنهاء الجلسة</span>
                          </button>
                        )}

                        {/* 5. Fast Cashier / Receipt */}
                        <button
                          onClick={() => handleOpenCashierForAppointment(app)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                          title="تحصيل الرسوم وطباعة وصل استلام"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>قبض أتعاب</span>
                        </button>

                        {/* 6. Document Scan */}
                        {app.patient && (
                          <button
                            onClick={() => handleOpenScannerForPatient(app.patient.id)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                            title="مسح وأرشفة بطاقة الشفاء أو الوثائق"
                          >
                            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                          </button>
                        )}

                        {/* 7. WhatsApp Pre-Intake Link */}
                        {app.patient && (
                          <button
                            onClick={() => handleSendWhatsAppMagicLink(app.patient)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border border-slate-700 transition-colors"
                            title="إرسال ومعاينة رابط استبيان الولي عبر WhatsApp"
                            data-testid={`whatsapp-preintake-btn-${app.patient.id}`}
                            aria-label="إرسال ومعاينة استبيان الولي عبر WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                        )}

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: EXTERNAL DOCUMENTS & CHIFA SCANNER */}
      {activeTab === 'scanner' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-400" />
                  <span>مركز أرشفة وماسح الوثائق والبطاقات الخارجية</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ارفع بطاقات الشفاء، الدفاتر الصحية، تقارير EEG، والوثائق الإدارية للمرضى بضغطة زر
                </p>
              </div>

              <button
                onClick={() => {
                  setScannerInitialPatientId(null);
                  setIsDocScannerOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>مسح وثيقة جديدة الآن</span>
              </button>
            </div>

            {/* Quick list of patients for fast upload */}
            <div className="pt-3 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 mb-2 block">
                اختر مريضاً من القائمة لمشاهدة أو أرشفة وثائقه:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {patients.slice(0, 9).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleOpenScannerForPatient(p.id)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-right transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-xs font-black text-white group-hover:text-indigo-300 block">
                        {p.first_name} {p.last_name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        📞 {p.phone || 'بدون هاتف'}
                      </span>
                    </div>
                    <UploadCloud className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: FRONT-DESK CASHIER & RECEIPTS */}
      {activeTab === 'cashier' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <span>صندوق القبض وإصدار الوصولات السريرية المعتمدة</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تسجيل دفعات الأتعاب، طباعة وصل الاستلام A5/A4، وإرسال إشعار WhatsApp للمريض
                </p>
              </div>

              <button
                onClick={() => {
                  setReceiptInitialData(null);
                  setIsReceiptModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>إصدار سند قبض فوري</span>
              </button>
            </div>

            {/* Quick unbilled session cards from today */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 mb-2 block">
                مواعيد اليوم الجاهزة للتحصيل والفوترة السريعة:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {appointments.slice(0, 6).map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-black text-white block">
                        {app.patient ? `${app.patient.first_name} ${app.patient.last_name}` : 'مريض'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {app.type?.replace(/_/g, ' ')} • ⏰ {app.appointment_date?.split('T')[1]?.slice(0, 5) || '09:00'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenCashierForAppointment(app)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>قبض</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: PHONE INQUIRIES & CALL LOG */}
      {activeTab === 'calls' && (
        <div className="space-y-4 animate-in fade-in">
          
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-teal-400" />
                  <span>سجل المكالمات والاستفسارات الهاتفية السريعة</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  توثيق مكالمات المرضى والأولياء الواردة وتحويلها بضغطة واحدة إلى موعد أو ملف مريض مسجل
                </p>
              </div>

              <button
                onClick={() => setShowAddCallBox(!showAddCallBox)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل مكالمة واردة الآن</span>
              </button>
            </div>

            {/* Quick Add Call Form */}
            {showAddCallBox && (
              <form onSubmit={handleSavePhoneCall} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in zoom-in-95">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">اسم المتصل / الولي:</label>
                    <input
                      type="text"
                      required
                      value={newCallData.caller_name}
                      onChange={(e) => setNewCallData({ ...newCallData, caller_name: e.target.value })}
                      placeholder="مثال: أمين ساسي"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">رقم هاتف المتصل:</label>
                    <input
                      type="tel"
                      required
                      value={newCallData.phone}
                      onChange={(e) => setNewCallData({ ...newCallData, phone: e.target.value })}
                      placeholder="05 / 06 / 07 ..."
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">غرض المكالمة:</label>
                    <select
                      value={newCallData.purpose}
                      onChange={(e) => setNewCallData({ ...newCallData, purpose: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                    >
                      <option value="new_appointment">طلب حجز موعد جديد</option>
                      <option value="pricing_info">استفسار عن الأسعار والتخصصات</option>
                      <option value="reschedule">طلب تأجيل أو تغيير موعد</option>
                      <option value="followup">متابعة ملف وفحوصات سابقة</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">ملاحظات المكالمة:</label>
                  <input
                    type="text"
                    value={newCallData.notes}
                    onChange={(e) => setNewCallData({ ...newCallData, notes: e.target.value })}
                    placeholder="مثال: يطلب موعد مع أخصائية الأرطوفونيا يوم السبت القادم..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCallBox(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
                  >
                    حفظ المكالمة
                  </button>
                </div>
              </form>
            )}

            {/* Calls Table */}
            <div className="space-y-2">
              {phoneCalls.length === 0 ? (
                <div className="text-center py-10 text-slate-500 space-y-1">
                  <PhoneCall className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs">لم يتم تسجيل مكالمات واردة اليوم بعد.</p>
                </div>
              ) : (
                phoneCalls.map((call) => (
                  <div
                    key={call.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{call.caller_name}</span>
                        <span className="text-[11px] font-mono text-teal-400 font-bold">📞 {call.phone}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                          {call.time} • {call.date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        <span className="text-slate-300 font-semibold">
                          {call.purpose === 'new_appointment' ? 'طلب موعد جديد' : call.purpose === 'pricing_info' ? 'استفسار عن الخدمات والأسعار' : 'متابعة'}
                        </span>
                        {call.notes && <span className="mr-1 text-slate-400">({call.notes})</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleConvertCallToIntake(call)}
                        className="px-3 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-bold transition-all"
                      >
                        تسجيل كمريض فوراً ⚡
                      </button>

                      <button
                        onClick={() => handleDeleteCall(call.id)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      )}

      {/* MODALS */}
      {/* 0. Patient Arrival / Walk-In Check-In Modal */}
      <PatientArrivalCheckInModal
        isOpen={isArrivalModalOpen}
        onClose={() => {
          setIsArrivalModalOpen(false);
          setArrivalInitialPatient(null);
        }}
        onSuccess={(createdAppt, patient) => {
          showToast(`تم تسجيل حضور المريض ${patient?.first_name || ''} وإدخاله لقاعة الانتظار 🛋️`);
          fetchTodayData();
        }}
        tenant={tenant}
        user={user}
        patients={patients}
        specialists={allAvailableSpecialists}
        initialPatient={arrivalInitialPatient}
      />

      {/* 1. Fast Intake Modal */}
      <FastPatientIntakeModal
        isOpen={isFastIntakeOpen}
        onClose={() => setIsFastIntakeOpen(false)}
        onSuccess={(newPatient) => {
          showToast(`تم تسجيل المريض ${newPatient.first_name} بنجاح!`);
          fetchTodayData();
        }}
        tenant={tenant}
        specialists={allAvailableSpecialists}
      />

      {/* 2. Document Scanner Modal */}
      <ExternalDocumentScannerModal
        isOpen={isDocScannerOpen}
        onClose={() => setIsDocScannerOpen(false)}
        initialPatientId={scannerInitialPatientId}
        patients={patients}
      />

      {/* 3. Fast Cashier Receipt Modal */}
      <FrontDeskReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onSuccess={(invoice) => {
          showToast('تم تسجيل القبض بنجاح.');
          fetchTodayData();
        }}
        tenant={tenant}
        initialPatient={receiptInitialData?.patient}
        initialAppointment={receiptInitialData?.appointment}
        patients={patients}
      />

      {/* 4. WhatsApp Pre-Intake Modal */}
      <WhatsAppPreIntakeModal
        isOpen={isPreIntakeModalOpen}
        onClose={() => {
          setIsPreIntakeModalOpen(false);
          setPreIntakePatient(null);
        }}
        patient={preIntakePatient}
        tenant={tenant}
        onSuccess={(msg) => {
          showToast(msg || 'تم إرسال رابط الاستبيان بنجاح.');
        }}
      />

    </div>
  );
}
