import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  DollarSign, 
  Filter, 
  ChevronRight, 
  ChevronLeft, 
  CalendarDays, 
  LayoutList, 
  Grid3X3, 
  ListOrdered, 
  Search, 
  Phone, 
  Sparkles, 
  Stethoscope, 
  Printer, 
  Volume2, 
  Inbox, 
  Play, 
  Check, 
  X, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  Activity,
  UserCheck,
  Tv,
  Radar,
  Bot
} from 'lucide-react';
import { appointmentApi, patientApi, queueApi } from '../api';
import ActiveConsultationWorkspace from './ActiveConsultationWorkspace';
import AppointmentModal from './AppointmentModal';
import ClinicAiReceptionistModal from './reception/ClinicAiReceptionistModal';
import PatientRetentionRadarModal from './clinical/PatientRetentionRadarModal';
import WhatsAppReminderModal from './appointments/WhatsAppReminderModal';

// Status labels & styles
const STATUS_CONFIG = {
  scheduled: {
    labelAr: 'مبرمج',
    labelFr: 'Programmé',
    badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    dot: 'bg-amber-400'
  },
  confirmed: {
    labelAr: 'حاضر (قاعة الانتظار)',
    labelFr: 'Présent (Salle d\'attente)',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse font-bold',
    dot: 'bg-emerald-400'
  },
  in_progress: {
    labelAr: 'الجلسة جارية',
    labelFr: 'En séance',
    badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse font-bold',
    dot: 'bg-cyan-400'
  },
  completed: {
    labelAr: 'مكتملة',
    labelFr: 'Terminée',
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    dot: 'bg-blue-400'
  },
  cancelled: {
    labelAr: 'ملغى',
    labelFr: 'Annulé',
    badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    dot: 'bg-rose-400'
  },
  no_show: {
    labelAr: 'لم يحضر (غياب)',
    labelFr: 'Absent / No-Show',
    badge: 'bg-red-500/15 text-red-300 border border-red-500/30',
    dot: 'bg-red-500'
  }
};

const CLINICAL_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function Appointments({ 
  tenant, 
  patients = [], 
  user, 
  onOpenAddAppointment, 
  onOpenAddInvoiceForAppointment 
}) {
  // Navigation & View Mode: 'timeline' (Day) | 'week' | 'month' | 'list'
  const [viewMode, setViewMode] = useState('timeline');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Local Patients fallback & sync
  const [localPatients, setLocalPatients] = useState(patients || []);

  useEffect(() => {
    if (patients && patients.length > 0) {
      setLocalPatients(patients);
    } else {
      patientApi.list({ per_page: 200, all: true })
        .then(res => {
          const list = res.data || res.patients || [];
          if (Array.isArray(list) && list.length > 0) {
            setLocalPatients(list);
          }
        })
        .catch(err => console.warn('Could not pre-fetch patients in Appointments:', err));
    }
  }, [patients]);

  // Appointments state
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    today_total: 0,
    waiting_room: 0,
    in_progress: 0,
    completed: 0,
    scheduled: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [specialistFilter, setSpecialistFilter] = useState('all'); // 'all' | 'me'

  // Direct Active Consultation Launch
  const [activeConsultationId, setActiveConsultationId] = useState(null);

  // Quick In-Place Appointment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState(null);
  const [modalInitialPatientId, setModalInitialPatientId] = useState(null);

  // Online Bookings Drawer State
  const [showBookingRequests, setShowBookingRequests] = useState(false);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookingCounts, setBookingCounts] = useState({ total: 0, pending: 0 });
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Patient Calling Sound / Speech Notification
  const [callingPatientName, setCallingPatientName] = useState(null);

  // Clinic Automation Modals
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [isReceptionistOpen, setIsReceptionistOpen] = useState(false);

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Get all appointments without tight pagination for calendar view
      const res = await appointmentApi.list({ per_page: 200, all: true });
      const list = res.data || [];
      setAppointments(list);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch online booking requests from Public Directory
  const fetchBookingRequests = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('clinic_token') || localStorage.getItem('auth_token');
    if (!token) return;
    setLoadingBookings(true);
    try {
      const res = await appointmentApi.listBookingRequests();
      if (res && res.success) {
        setBookingRequests(res.requests || []);
        setBookingCounts(res.counts || { total: 0, pending: 0 });
      }
    } catch (err) {
      if (!err?.message?.includes('غير مصرح') && !err?.message?.includes('Unauthenticated')) {
        console.warn('Booking requests fetch error:', err);
      }
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchBookingRequests();
  }, []);

  // Handle status update
  const handleStatusChange = async (id, newStatus) => {
    try {
      await appointmentApi.update(id, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'خطأ أثناء تحديث حالة الموعد');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموعد نهائياً؟')) return;
    try {
      await appointmentApi.delete(id);
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'خطأ أثناء الحذف');
    }
  };

  // Patient Call Chime & Speech Announce & Live TV Sync
  const handleCallPatient = async (appointment) => {
    const patientName = appointment.patient 
      ? `${appointment.patient.first_name} ${appointment.patient.last_name}` 
      : 'المريض';
    const token = appointment.token || (appointment.id ? `T-${String(appointment.id).padStart(3, '0')}` : 'T-001');

    setCallingPatientName(patientName);
    setTimeout(() => setCallingPatientName(null), 5000);

    // Call queue API
    try {
      if (queueApi && appointment.id) {
        await queueApi.callPatient(appointment.id, {
          room_name: 'قاعة الاستشارة والتشخيص 1',
        });
      }
    } catch (err) {
      console.warn('Queue call API warning:', err);
    }

    // Broadcast across windows / tabs to TV screen
    const callPayload = {
      type: 'PATIENT_CALLED',
      id: appointment.id,
      token: token,
      token_number: token,
      patient_name: patientName,
      room_name: 'قاعة الاستشارة والتشخيص 1',
      room: 'قاعة الاستشارة والتشخيص 1',
      timestamp: Date.now(),
    };

    try {
      const channel = new BroadcastChannel('psypro_clinic_queue');
      channel.postMessage(callPayload);
      channel.close();
    } catch (e) {}

    try {
      localStorage.setItem('psypro_queue_event', JSON.stringify(callPayload));
      localStorage.setItem('psypro_last_called', JSON.stringify(callPayload));
      window.dispatchEvent(new CustomEvent('psypro_queue_event', { detail: callPayload }));
    } catch (e) {}

    // Play tone via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio chime error:', e);
    }

    // Announce via Web Speech Synthesis if available
    try {
      if ('speechSynthesis' in window) {
        const text = `نداء للمريض ${patientName}، رقم ${token}، يرجى التفضل لقاعة الفحص`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.log('TTS announce error:', e);
    }
  };

  // WhatsApp Reminder State & Modal
  const [selectedWaAppt, setSelectedWaAppt] = useState(null);
  const [waReminderData, setWaReminderData] = useState(null);
  const [preparedReminders, setPreparedReminders] = useState({});

  const handleSendWhatsApp = async (apptOrId, forceManual = false) => {
    try {
      let targetAppt = null;
      let targetId = null;

      if (typeof apptOrId === 'object' && apptOrId !== null) {
        targetAppt = apptOrId;
        targetId = apptOrId.id;
      } else {
        targetId = apptOrId;
        targetAppt = appointments.find((a) => a.id === targetId) || null;
      }

      if (!targetAppt && targetId) {
        targetAppt = { 
          id: targetId, 
          appointment_date: new Date().toISOString() 
        };
      }

      if (!targetAppt) return;

      // Immediately set appointment to open modal on screen
      setSelectedWaAppt(targetAppt);
      setPreparedReminders((prev) => ({ ...prev, [targetId]: true }));

      // Fetch rich reminder draft from backend
      try {
        const res = await appointmentApi.whatsappReminder(targetId);
        if (res && res.success) {
          setWaReminderData(res);
          if (forceManual && res.whatsapp_url) {
            window.open(res.whatsapp_url, '_blank');
          }
        }
      } catch (backendErr) {
        console.warn('Backend draft fetch warning, using client draft:', backendErr);
      }
    } catch (err) {
      console.error('Error opening WhatsApp reminder composer:', err);
    }
  };

  // Approve online booking request
  const handleApproveBooking = async (bookingId) => {
    try {
      await appointmentApi.updateBookingStatus(bookingId, {
        status: 'approved',
        create_appointment: true
      });
      fetchBookingRequests();
      fetchAppointments();
      alert('تم قبول طلب الحجز وتحويله لموعد سريري بنجاح.');
    } catch (err) {
      alert('خطأ أثناء اعتماد طلب الحجز.');
    }
  };

  // Reject online booking request
  const handleRejectBooking = async (bookingId) => {
    if (!window.confirm('هل تريد رفض طلب الحجز هذا؟')) return;
    try {
      await appointmentApi.updateBookingStatus(bookingId, {
        status: 'rejected'
      });
      fetchBookingRequests();
    } catch (err) {
      alert('خطأ أثناء رفض طلب الحجز.');
    }
  };

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = `${app.patient?.first_name || ''} ${app.patient?.last_name || ''}`.toLowerCase();
        const phone = app.patient?.phone || '';
        const notes = (app.notes || '').toLowerCase();
        const specName = (app.specialist?.name || '').toLowerCase();
        if (!pName.includes(q) && !phone.includes(q) && !notes.includes(q) && !specName.includes(q)) {
          return false;
        }
      }

      // Status
      if (statusFilter && app.status !== statusFilter) {
        return false;
      }

      // Specialist (me vs all)
      if (specialistFilter === 'me' && user?.id && String(app.specialist_id) !== String(user.id)) {
        return false;
      }

      return true;
    });
  }, [appointments, searchQuery, statusFilter, specialistFilter, user]);

  // Selected date ISO string (YYYY-MM-DD)
  const selectedDateStr = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  // Appointments for the selected day (for timeline)
  const dayAppointments = useMemo(() => {
    return filteredAppointments.filter(app => {
      const appDate = app.appointment_date?.split('T')[0] || app.appointment_date?.split(' ')[0];
      return appDate === selectedDateStr;
    }).sort((a, b) => (a.appointment_date > b.appointment_date ? 1 : -1));
  }, [filteredAppointments, selectedDateStr]);

  // Date Navigators
  const navigateDay = (offset) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + offset);
    setSelectedDate(next);
  };

  const navigateMonth = (offset) => {
    const next = new Date(selectedDate);
    next.setMonth(next.getMonth() + offset);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Print reception schedule
  const handlePrintDailySchedule = () => {
    window.print();
  };

  // Open modal with prefilled date
  const handleOpenAddAt = (datetime) => {
    setModalInitialDate(datetime);
    setModalInitialPatientId(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Header & Live Statistics Pulse */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold shadow-lg shadow-brand-500/10">
              <CalendarDays className="w-5 h-5 text-brand-400" />
            </div>
            <span>إدارة المواعيد والأجندة السريرية</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-normal">
              Agenda & Cockpit
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {tenant?.header_title_ar || tenant?.name} • تزامن فوري مع شاشة الاستقبال (Kiosk PIN) وبوابة المرضى
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Online Bookings Trigger */}
          <button
            onClick={() => setShowBookingRequests(true)}
            className={`relative px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
              bookingCounts.pending > 0
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Inbox className="w-4 h-4 text-indigo-400" />
            <span>طلبات الحجز أونلاين</span>
            {bookingCounts.pending > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black">
                {bookingCounts.pending}
              </span>
            )}
          </button>

          {/* Smart Waiting Room TV Display */}
          <a
            href="/tv"
            target="_blank"
            rel="noopener noreferrer"
            title="فتح شاشة قاعة الانتظار الذكية على شاشة العرض أو التلفزيون"
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-teal-300 hover:text-teal-200 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Tv className="w-4 h-4 text-teal-400" />
            <span className="hidden xl:inline">شاشة الانتظار TV</span>
          </a>

          {/* Retention & Recall Radar */}
          <button
            onClick={() => setIsRadarOpen(true)}
            title="رادار متابعة واستعادة المرضى المنقطعين"
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Radar className="w-4 h-4 text-rose-400" />
            <span className="hidden xl:inline">رادار الاستعادة</span>
          </button>

          {/* AI WhatsApp Receptionist */}
          <button
            onClick={() => setIsReceptionistOpen(true)}
            title="موظف الاستقبال الذكي ومحاكي الفرز عبر WhatsApp"
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="hidden xl:inline">استقبال WhatsApp</span>
          </button>

          {/* Print Daily Schedule */}
          <button
            onClick={handlePrintDailySchedule}
            title="طباعة كشف المواعيد اليومي لموظف الاستقبال"
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">طباعة الكشف</span>
          </button>

          {/* New Appointment Modal */}
          <button
            onClick={() => {
              setModalInitialDate(null);
              setModalInitialPatientId(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>حجز موعد سريري</span>
          </button>
        </div>
      </div>

      {/* Calling Patient Banner notification */}
      {callingPatientName && (
        <div className="p-4 rounded-2xl bg-brand-600/20 border border-brand-500/40 text-brand-200 flex items-center justify-between shadow-xl animate-bounce">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-brand-400 animate-pulse" />
            <div>
              <span className="text-xs font-bold text-slate-300">نداء المريض الحالي:</span>
              <div className="text-sm font-black text-white">يرجى من المريض: {callingPatientName} التفضل لقاعة الفحص والعلاج</div>
            </div>
          </div>
          <button 
            onClick={() => setCallingPatientName(null)}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Top Metric Cards: Waiting Room & Daily Pulse */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
          <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-brand-400" />
            <span>إجمالي مواعيد اليوم</span>
          </div>
          {loading ? (
            <div className="h-7 w-12 bg-slate-800 animate-pulse rounded-lg mt-1" />
          ) : (
            <div className="text-2xl font-black text-white mt-1 font-mono">{stats.today_total || 0}</div>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 shadow-sm">
          <div className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>مجدولة / قادمة</span>
          </div>
          {loading ? (
            <div className="h-7 w-12 bg-slate-800 animate-pulse rounded-lg mt-1" />
          ) : (
            <div className="text-2xl font-black text-indigo-300 mt-1 font-mono">{stats.scheduled || 0}</div>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 shadow-sm">
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>حاضر بقاعة الانتظار</span>
          </div>
          {loading ? (
            <div className="h-7 w-12 bg-slate-800 animate-pulse rounded-lg mt-1" />
          ) : (
            <div className="text-2xl font-black text-emerald-300 mt-1 font-mono flex items-center gap-2">
              <span>{stats.waiting_room || 0}</span>
              {stats.waiting_room > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 shadow-sm">
          <div className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>جلسات جارية</span>
          </div>
          {loading ? (
            <div className="h-7 w-12 bg-slate-800 animate-pulse rounded-lg mt-1" />
          ) : (
            <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{stats.in_progress || 0}</div>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30 shadow-sm">
          <div className="text-[11px] text-blue-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>مكتملة اليوم</span>
          </div>
          {loading ? (
            <div className="h-7 w-12 bg-slate-800 animate-pulse rounded-lg mt-1" />
          ) : (
            <div className="text-2xl font-black text-blue-300 mt-1 font-mono">{stats.completed || 0}</div>
          )}
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>غياب / ملغاة</span>
          </div>
          {loading ? (
            <div className="h-7 w-12 bg-slate-800 animate-pulse rounded-lg mt-1" />
          ) : (
            <div className="text-2xl font-black text-rose-300 mt-1 font-mono">{stats.cancelled || 0}</div>
          )}
        </div>
      </div>

      {/* 3. Navigation Bar: View Modes & Date Controls */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* View Modes Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800/80 self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'timeline'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>جدول الحصص (Timeline)</span>
          </button>

          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'week'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>الأسبوع (Semaine)</span>
          </button>

          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'month'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>الشهري (Mois)</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>القائمة التفصيلية</span>
          </button>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => (viewMode === 'month' ? navigateMonth(-1) : navigateDay(-1))}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
            title="السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
          >
            اليوم (Aujourd'hui)
          </button>

          <button
            onClick={() => (viewMode === 'month' ? navigateMonth(1) : navigateDay(1))}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
            title="التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Current Date Display */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white font-mono flex items-center gap-2">
            <span>📅</span>
            <span>
              {selectedDate.toLocaleDateString('ar-DZ', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          <button
            onClick={fetchAppointments}
            title="تحديث البيانات"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* 4. Filters Bar (Practitioner filter, Status filter, Search) */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الهاتف، المعالج، أو الملاحظات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Specialist Toggle (Mes RDV vs All) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setSpecialistFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              specialistFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            كل الفريق الطبي
          </button>
          <button
            onClick={() => setSpecialistFilter('me')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              specialistFilter === 'me'
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            مواعيدي الخاصة فقط
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
              statusFilter === ''
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            الكل ({filteredAppointments.length})
          </button>

          {Object.entries(STATUS_CONFIG).map(([stKey, config]) => {
            const count = appointments.filter(a => a.status === stKey).length;
            return (
              <button
                key={stKey}
                onClick={() => setStatusFilter(statusFilter === stKey ? '' : stKey)}
                className={`px-2.5 py-1 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                  statusFilter === stKey
                    ? `${config.badge} font-bold shadow-sm`
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                <span>{config.labelAr}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. VIEW MODES RENDERING                                                   */}
      {/* ========================================================================= */}

      {/* MODE 1: DAY TIMELINE (جدول الحصص السريري اليومي) */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>جدول حصص يوم: {selectedDateStr}</span>
              <span className="text-xs text-slate-400">({dayAppointments.length} موعد مجدول)</span>
            </div>
            <button
              onClick={() => handleOpenAddAt(`${selectedDateStr}T10:00`)}
              className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة موعد لهذا اليوم</span>
            </button>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl divide-y divide-slate-800/60">
            {CLINICAL_HOURS.map(hour => {
              // Find appointments starting around this hour
              const slotAppts = dayAppointments.filter(app => {
                const time = app.appointment_date?.split('T')[1] || app.appointment_date?.split(' ')[1] || '';
                return time.startsWith(hour.slice(0, 2));
              });

              return (
                <div 
                  key={hour} 
                  className="p-3 sm:p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row items-start gap-3 sm:gap-6 group"
                >
                  {/* Hour Label */}
                  <div className="w-20 flex-shrink-0">
                    <span className="text-sm font-black text-brand-400 font-mono tracking-wider">
                      {hour}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono">جلسة علاجية</div>
                  </div>

                  {/* Appointments in this slot */}
                  <div className="flex-1 w-full space-y-2.5">
                    {slotAppts.length === 0 ? (
                      <div 
                        onClick={() => handleOpenAddAt(`${selectedDateStr}T${hour}`)}
                        className="py-2.5 px-4 rounded-2xl border border-dashed border-slate-800/80 hover:border-brand-500/50 hover:bg-brand-500/5 cursor-pointer text-xs text-slate-500 hover:text-brand-400 transition-all flex items-center justify-between"
                      >
                        <span>شاغر • انقر لحجز موعد في الساعة {hour}</span>
                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      slotAppts.map(app => {
                        const stConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.scheduled;
                        const timeStr = app.appointment_date?.split('T')[1]?.slice(0, 5) || hour;
                        const isWaiting = app.status === 'confirmed';
                        const isInProgress = app.status === 'in_progress';

                        return (
                          <div
                            key={app.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              isWaiting
                                ? 'bg-emerald-950/30 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                                : isInProgress
                                ? 'bg-cyan-950/30 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                              
                              {/* Patient & Clinic Details */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-brand-400 font-mono">⏰ {timeStr}</span>
                                  <span className="text-sm font-black text-white">
                                    {app.patient ? `${app.patient.first_name} ${app.patient.last_name}` : 'مريض غير محدد'}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${stConfig.badge}`}>
                                    {stConfig.labelAr}
                                  </span>
                                  {isWaiting && (
                                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                      🟢 متواجد في قاعة الانتظار
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                                  {app.patient?.phone && (
                                    <span className="font-mono text-[11px] text-slate-300">📞 {app.patient.phone}</span>
                                  )}
                                  <span>👨‍⚕️ {app.specialist?.name || 'الأخصائي المعالج'}</span>
                                  <span className="text-slate-500">•</span>
                                  <span className="text-slate-300 font-semibold">{app.type?.replace(/_/g, ' ')}</span>
                                  {app.notes && (
                                    <span className="text-slate-400 italic">({app.notes})</span>
                                  )}
                                </div>
                              </div>

                              {/* Clinical Actions Bar */}
                              <div className="flex flex-wrap items-center gap-1.5 self-end lg:self-center">
                                
                                {/* 🚀 Direct Active Consultation Launch */}
                                <button
                                  onClick={() => setActiveConsultationId(app.id)}
                                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 transition-all transform active:scale-95"
                                  title="إطلاق قمرة الجلسة السريرية المباشرة"
                                >
                                  <Play className="w-3.5 h-3.5 fill-white" />
                                  <span>بدء الجلسة السريرية</span>
                                </button>

                                {/* Call Patient Audio */}
                                <button
                                  onClick={() => handleCallPatient(app)}
                                  title="نداء المريض الصوتي عبر مكبر قاعة الانتظار"
                                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                                >
                                  <Volume2 className="w-4 h-4 text-brand-400" />
                                </button>

                                {/* WhatsApp Reminder */}
                                <button
                                  onClick={() => handleSendWhatsApp(app)}
                                  title="إرسال تذكير WhatsApp للمريض"
                                  data-testid={`whatsapp-reminder-btn-${app.id}`}
                                  className={`p-1.5 rounded-xl border transition-all ${
                                    preparedReminders[app.id]
                                      ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-500/30'
                                      : 'bg-slate-800 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 border-slate-700'
                                  }`}
                                >
                                  <Phone className="w-4 h-4 text-emerald-400" />
                                </button>

                                {/* Invoice / Facturer */}
                                <button
                                  onClick={() => onOpenAddInvoiceForAppointment && onOpenAddInvoiceForAppointment(app)}
                                  title="إصدار فاتورة أتعاب"
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1"
                                >
                                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                                  <span>فوترة</span>
                                </button>

                                {/* Status Quick Menu */}
                                <select
                                  value={app.status}
                                  onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                  className="px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] text-slate-200 font-semibold focus:outline-none"
                                >
                                  <option value="scheduled">مبرمج</option>
                                  <option value="confirmed">حاضر (قاعة الانتظار)</option>
                                  <option value="in_progress">الجلسة جارية</option>
                                  <option value="completed">منتهية ومكتملة</option>
                                  <option value="cancelled">ملغاة</option>
                                  <option value="no_show">غياب (No-show)</option>
                                </select>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDelete(app.id)}
                                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-700"
                                  title="حذف الموعد"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: WEEK VIEW (شبكة الأسبوع التفاعلية) */}
      {viewMode === 'week' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 overflow-x-auto shadow-xl">
          <div className="min-w-[900px]">
            {/* Week Days Header */}
            <div className="grid grid-cols-8 gap-2 border-b border-slate-800 pb-3 mb-3 text-center">
              <div className="text-xs font-bold text-slate-500">التوقيت</div>
              {Array.from({ length: 7 }).map((_, i) => {
                const dayDate = new Date(selectedDate);
                // Align to week start (Saturday in Algeria)
                const dayOfWeek = dayDate.getDay(); // 0 is Sunday, 6 is Saturday
                const diff = (dayOfWeek + 1) % 7; // distance from Saturday
                dayDate.setDate(dayDate.getDate() - diff + i);
                
                const isSelected = dayDate.toDateString() === selectedDate.toDateString();
                const dayNum = dayDate.getDate();
                const dayName = dayDate.toLocaleDateString('ar-DZ', { weekday: 'short' });

                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      setSelectedDate(dayDate);
                      setViewMode('timeline');
                    }}
                    className={`p-2 rounded-2xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-brand-600/30 border border-brand-500/40 text-brand-300' 
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{dayName}</div>
                    <div className="text-sm font-black font-mono mt-0.5">{dayNum}</div>
                  </div>
                );
              })}
            </div>

            {/* Hourly Grid Rows */}
            <div className="space-y-2">
              {CLINICAL_HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-8 gap-2 items-start min-h-[64px]">
                  <div className="text-xs font-mono font-bold text-slate-500 text-center pt-2">
                    {hour}
                  </div>

                  {Array.from({ length: 7 }).map((_, i) => {
                    const cellDate = new Date(selectedDate);
                    const dayOfWeek = cellDate.getDay();
                    const diff = (dayOfWeek + 1) % 7;
                    cellDate.setDate(cellDate.getDate() - diff + i);

                    const y = cellDate.getFullYear();
                    const m = String(cellDate.getMonth() + 1).padStart(2, '0');
                    const d = String(cellDate.getDate()).padStart(2, '0');
                    const cellDateStr = `${y}-${m}-${d}`;

                    // Find matching appt
                    const apptsInCell = filteredAppointments.filter(app => {
                      const appDate = app.appointment_date?.split('T')[0] || app.appointment_date?.split(' ')[0];
                      const appTime = app.appointment_date?.split('T')[1] || app.appointment_date?.split(' ')[1] || '';
                      return appDate === cellDateStr && appTime.startsWith(hour.slice(0, 2));
                    });

                    return (
                      <div
                        key={i}
                        className="h-full min-h-[58px] p-1.5 rounded-xl border border-slate-800/60 bg-slate-950/40 hover:border-slate-700 transition-colors flex flex-col justify-between"
                      >
                        {apptsInCell.length === 0 ? (
                          <button
                            onClick={() => handleOpenAddAt(`${cellDateStr}T${hour}`)}
                            className="w-full h-full opacity-0 hover:opacity-100 flex items-center justify-center text-[10px] text-brand-400 transition-opacity"
                          >
                            + حجز
                          </button>
                        ) : (
                          apptsInCell.map(app => (
                            <div
                              key={app.id}
                              onClick={() => setActiveConsultationId(app.id)}
                              className="p-1.5 rounded-lg bg-brand-600/30 border border-brand-500/30 text-white text-[10px] font-bold truncate cursor-pointer hover:bg-brand-600/50 transition-colors"
                              title={`${app.patient?.first_name} ${app.patient?.last_name} (${app.status})`}
                            >
                              <div>{app.patient?.first_name} {app.patient?.last_name}</div>
                              <div className="text-[9px] text-brand-300 font-mono">
                                {app.appointment_date?.split('T')[1]?.slice(0, 5) || hour}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: MONTH VIEW (عرض التقويم الشهري) */}
      {viewMode === 'month' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
          <div className="grid grid-cols-7 gap-2 mb-3 text-center border-b border-slate-800 pb-3">
            {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((dayName, idx) => (
              <div key={idx} className="text-xs font-bold text-slate-400">
                {dayName}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {(() => {
              const year = selectedDate.getFullYear();
              const month = selectedDate.getMonth();
              const firstDayOfMonth = new Date(year, month, 1);
              const lastDayOfMonth = new Date(year, month + 1, 0);

              // Saturday offset: (day + 1) % 7
              const startOffset = (firstDayOfMonth.getDay() + 1) % 7;
              const totalDays = lastDayOfMonth.getDate();

              const cells = [];

              // Empty slots before month start
              for (let i = 0; i < startOffset; i++) {
                cells.push(
                  <div key={`empty-${i}`} className="min-h-[85px] rounded-2xl bg-slate-950/20 border border-slate-800/30 opacity-40" />
                );
              }

              // Days of current month
              for (let d = 1; d <= totalDays; d++) {
                const currentDay = new Date(year, month, d);
                const isToday = currentDay.toDateString() === new Date().toDateString();
                const isSelected = currentDay.toDateString() === selectedDate.toDateString();

                const y = currentDay.getFullYear();
                const m = String(currentDay.getMonth() + 1).padStart(2, '0');
                const dayStr = String(currentDay.getDate()).padStart(2, '0');
                const dateIso = `${y}-${m}-${dayStr}`;

                const apptsOnDay = filteredAppointments.filter(app => {
                  const aDate = app.appointment_date?.split('T')[0] || app.appointment_date?.split(' ')[0];
                  return aDate === dateIso;
                });

                cells.push(
                  <div
                    key={d}
                    onClick={() => {
                      setSelectedDate(currentDay);
                      setViewMode('timeline');
                    }}
                    className={`min-h-[95px] p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500 shadow-md text-white'
                        : isToday
                        ? 'bg-slate-800/60 border-brand-400 text-white'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-black ${isToday ? 'text-brand-400' : ''}`}>
                        {d}
                      </span>
                      {apptsOnDay.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold">
                          {apptsOnDay.length}
                        </span>
                      )}
                    </div>

                    {/* Mini appointment pills */}
                    <div className="space-y-1 mt-1">
                      {apptsOnDay.slice(0, 2).map(app => (
                        <div 
                          key={app.id} 
                          className="px-1.5 py-0.5 rounded bg-slate-800/90 text-[10px] text-slate-200 truncate font-sans"
                        >
                          {app.patient?.first_name || 'موعد'}
                        </div>
                      ))}
                      {apptsOnDay.length > 2 && (
                        <div className="text-[9px] text-slate-500">
                          +{apptsOnDay.length - 2} مواعيد أخرى
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return cells;
            })()}
          </div>
        </div>
      )}

      {/* MODE 4: ADVANCED LIST VIEW (جدول القائمة المتقدم) */}
      {viewMode === 'list' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] uppercase text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">التاريخ والتوقيت</th>
                  <th className="px-5 py-3.5">المريض المستفيد</th>
                  <th className="px-5 py-3.5">الأخصائي المعالج</th>
                  <th className="px-5 py-3.5">النوع والهدف السريري</th>
                  <th className="px-5 py-3.5">الحالة</th>
                  <th className="px-5 py-3.5 text-left">الإجراءات السريرية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                      جارٍ تحميل المواعيد...
                    </td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                      لا يوجد أي موعد مطابق لمعايير البحث.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(app => {
                    const stConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.scheduled;
                    const datePart = app.appointment_date?.split('T')[0] || app.appointment_date?.split(' ')[0] || '--';
                    const rawTime = app.appointment_date?.includes('T') 
                      ? app.appointment_date.split('T')[1]?.slice(0, 5)
                      : (app.appointment_date?.split(' ')[1]?.slice(0, 5) || '');
                    const timePart = (rawTime && rawTime !== '00:00') ? rawTime : '10:00';

                    return (
                      <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-mono">
                          <div className="font-bold text-white text-xs">{datePart}</div>
                          <div className="text-brand-400 font-semibold mt-0.5">⏰ {timePart}</div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="font-bold text-white text-xs">
                            {app.patient ? `${app.patient.first_name} ${app.patient.last_name}` : 'N/A'}
                          </div>
                          <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                            {app.patient?.phone || 'بدون هاتف'}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-200">{app.specialist?.name || '---'}</div>
                          <div className="text-[10px] text-slate-400">{app.specialist?.role || 'مختص'}</div>
                        </td>

                        <td className="px-5 py-3.5 max-w-xs">
                          <span className="font-semibold text-slate-200 block">
                            {app.type?.replace(/_/g, ' ')}
                          </span>
                          <p className="text-slate-400 truncate mt-0.5 text-[11px]">{app.notes || '---'}</p>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${stConfig.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${stConfig.dot}`} />
                            <span>{stConfig.labelAr}</span>
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-left">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Start Session */}
                            <button
                              onClick={() => setActiveConsultationId(app.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow flex items-center gap-1"
                              title="بدء الجلسة السريرية المباشرة"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>الجلسة</span>
                            </button>

                            {/* WhatsApp */}
                            <button
                              onClick={() => handleSendWhatsApp(app)}
                              title="إرسال تذكير WhatsApp للمريض"
                              data-testid={`whatsapp-btn-table-${app.id}`}
                              className={`p-1.5 rounded-lg border transition-all ${
                                preparedReminders[app.id]
                                  ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/50'
                                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                              }`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>

                            {/* Invoice */}
                            <button
                              onClick={() => onOpenAddInvoiceForAppointment && onOpenAddInvoiceForAppointment(app)}
                              title="فوترة"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(app.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ONLINE BOOKING REQUESTS DRAWER (طلبات الحجز عبر الإنترنت)                */}
      {/* ========================================================================= */}
      {showBookingRequests && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[88vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">طلبات الحجز الواردة من الدليل الوطني للعيادات</h3>
              </div>
              <button 
                onClick={() => setShowBookingRequests(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingBookings ? (
              <div className="p-8 text-center text-xs text-slate-500">جارٍ جلب الطلبات...</div>
            ) : bookingRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                لا توجد طلبات حجز معلقة حالياً.
              </div>
            ) : (
              <div className="space-y-3">
                {bookingRequests.map(req => (
                  <div key={req.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{req.patient_name}</span>
                        <span className="text-slate-400 font-mono text-xs">📞 {req.phone}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        <span>📅 التاريخ المفضل: {req.preferred_date ? new Date(req.preferred_date).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }) : '--'}</span> • 
                        <span>⏰ الفترة: {req.preferred_time_slot}</span> • 
                        <span className="text-brand-300">🩺 {req.specialty}</span>
                      </div>
                      {req.reason_for_visit && (
                        <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2 rounded-xl mt-1">
                          "{req.reason_for_visit}"
                        </p>
                      )}
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleApproveBooking(req.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>قبول وجدولة</span>
                        </button>
                        <button
                          onClick={() => handleRejectBooking(req.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 text-xs font-bold"
                        >
                          رفض
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. ACTIVE CONSULTATION WORKSPACE (قمرة الجلسة السريرية المباشرة)             */}
      {/* ========================================================================= */}
      {activeConsultationId && (
        <ActiveConsultationWorkspace
          appointmentId={activeConsultationId}
          onClose={() => {
            setActiveConsultationId(null);
            fetchAppointments();
          }}
          onCompleted={(appointment) => {
            setActiveConsultationId(null);
            fetchAppointments();
            if (onOpenAddInvoiceForAppointment && appointment?.patient) {
              onOpenAddInvoiceForAppointment(appointment);
            }
          }}
          currentSpecialist={user}
          tenant={tenant}
        />
      )}

      {/* ========================================================================= */}
      {/* 8. IN-PLACE APPOINTMENT MODAL                                             */}
      {/* ========================================================================= */}
      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          fetchAppointments();
        }}
        patients={localPatients.length > 0 ? localPatients : patients}
        user={user}
        tenant={tenant}
        initialDate={modalInitialDate}
        initialPatientId={modalInitialPatientId}
        existingAppointments={appointments}
      />

      {/* ========================================================================= */}
      {/* 9. AI CLINIC RECEPTIONIST & RETENTION RADAR MODALS                        */}
      {/* ========================================================================= */}
      <ClinicAiReceptionistModal
        isOpen={isReceptionistOpen}
        onClose={() => setIsReceptionistOpen(false)}
      />

      <PatientRetentionRadarModal
        isOpen={isRadarOpen}
        onClose={() => setIsRadarOpen(false)}
      />

      {/* ========================================================================= */}
      {/* 10. WHATSAPP REMINDER COMPOSER & DRAFT MODAL                              */}
      {/* ========================================================================= */}
      {selectedWaAppt && (
        <WhatsAppReminderModal
          isOpen={!!selectedWaAppt}
          onClose={() => {
            setSelectedWaAppt(null);
            setWaReminderData(null);
          }}
          appointment={selectedWaAppt}
          initialData={waReminderData}
          onSent={(apptId) => {
            setPreparedReminders((prev) => ({ ...prev, [apptId]: true }));
          }}
        />
      )}

    </div>
  );
}

