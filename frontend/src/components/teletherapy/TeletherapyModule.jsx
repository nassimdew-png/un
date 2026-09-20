import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Layers,
  Plus,
  Clock,
  Calendar,
  User,
  Phone,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Play,
  Share2,
  CheckCircle2,
  Activity,
  History,
  FileText,
  Search,
  X,
  ChevronDown,
  Check,
  Users
} from 'lucide-react';
import { apiRequest, whatsappApi } from '../../api';
import ClinicalInteractiveCanvas from './ClinicalInteractiveCanvas';
import ShareTeletherapyLinkModal from './ShareTeletherapyLinkModal';

export default function TeletherapyModule() {
  const navigate = useNavigate();

  // State
  const [activeMainTab, setActiveMainTab] = useState('rooms'); // 'rooms' | 'whiteboard'
  const [toastMsg, setToastMsg] = useState(null);
  const [sessionToShare, setSessionToShare] = useState(null);
  const [patients, setPatients] = useState([]);
  const [scheduledSessions, setScheduledSessions] = useState([
    {
      id: 101,
      room_code: 'ROOM-ORTHO-88',
      patient_id: 1,
      patient_name: 'أحمد أمين بن علي',
      age: 7,
      specialty: 'orthophony',
      specialty_ar: 'تأهيل تخاطب وأرطوفونيا',
      scheduled_time: '11:00 صباحاً اليوم',
      status: 'scheduled',
      phone: '0555123456',
      pin: '4421'
    },
    {
      id: 102,
      room_code: 'ROOM-PSY-12',
      patient_id: 2,
      patient_name: 'سارة مراد',
      age: 14,
      specialty: 'psychology',
      specialty_ar: 'دعم نفسي معرفي سلوكي',
      scheduled_time: '02:30 مساءً اليوم',
      status: 'scheduled',
      phone: '0661987654',
      pin: '9812'
    },
    {
      id: 103,
      room_code: 'ROOM-PARENT-05',
      patient_id: 3,
      patient_name: 'يوسف بن سالم (مع الولي)',
      age: 6,
      specialty: 'parent_guidance',
      specialty_ar: 'إرشاد والدي ومتابعة سلوكية',
      scheduled_time: '04:00 مساءً اليوم',
      status: 'scheduled',
      phone: '0770334455',
      pin: '3310'
    }
  ]);

  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [customPatientName, setCustomPatientName] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('orthophony');

  // Searchable patient combobox state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target)) {
        setIsPatientDropdownOpen(false);
      }
    };
    if (isPatientDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPatientDropdownOpen]);

  // Load patients from API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await apiRequest('/patients');
        if (res && res.data) {
          setPatients(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch patients, using fallback defaults', err);
      }
    };
    fetchPatients();
  }, []);

  // Helper: Patient full display name
  const getPatientDisplayName = (p) => {
    if (!p) return '';
    const combined = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    return combined || p.full_name || p.name || `مريض #${p.id}`;
  };

  // Selected Patient Object
  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => String(p.id) === String(selectedPatientId)) || null;
  }, [patients, selectedPatientId]);

  // Filtered Patients for instant session combobox
  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) {
      return patients;
    }
    const q = patientSearchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const fullName = getPatientDisplayName(p).toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const folder = (p.folder_number || p.file_number || '').toLowerCase();
      const idStr = String(p.id || '');
      return fullName.includes(q) || phone.includes(q) || folder.includes(q) || idStr.includes(q);
    });
  }, [patients, patientSearchQuery]);

  // Launch Session
  const handleLaunchInstantRoom = () => {
    if (!selectedPatientId && !customPatientName.trim()) {
      alert('⚠️ تنبيه سريري: يرجى اختيار مريض من القائمة أو كتابة اسم المريض قبل إطلاق الجلسة لضمان توثيق السجل الطبي.');
      return;
    }

    const code = 'ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    let patientObj = null;

    if (selectedPatientId) {
      const p = patients.find((item) => String(item.id) === String(selectedPatientId));
      if (p) {
        patientObj = {
          ...p,
          id: p.id,
          full_name: getPatientDisplayName(p),
          age: p.age || 8,
          specialty: selectedSpecialty,
          phone: p.phone || '0555000000',
          file_number: p.file_number || p.folder_number || `CL-${p.id}`
        };
      }
    }
    if (!patientObj && customPatientName.trim()) {
      patientObj = {
        id: Date.now(),
        full_name: customPatientName.trim(),
        age: 8,
        specialty: selectedSpecialty,
        phone: '0555000000',
        file_number: 'CL-TELE-' + Math.floor(100 + Math.random() * 900)
      };
    }

    if (!patientObj) {
      alert('يرجى اختيار مريض من القائمة.');
      return;
    }

    navigate(`/teletherapy/room/${code}`, {
      state: { patient: patientObj }
    });
  };

  // Launch from scheduled card
  const handleLaunchScheduled = (session) => {
    navigate(`/teletherapy/room/${session.room_code}`, {
      state: {
        patient: {
          id: session.patient_id,
          full_name: session.patient_name,
          age: session.age,
          specialty: session.specialty,
          phone: session.phone,
          file_number: `CL-${session.patient_id}`
        }
      }
    });
  };

  // Send WhatsApp invite for scheduled session (Cloud API with manual fallback)
  const handleSendWhatsApp = async (session) => {
    const phone = session.phone ? session.phone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = phone.startsWith('0') ? '213' + phone.substring(1) : phone;
    const roomUrl = `${window.location.origin}/teletherapy/room/${session.room_code}?pin=${session.pin}`;
    const msg = `السلام عليكم ورحمة الله،\nموعدكم لجلسة الاستشارة والتطبيب عن بعد (${session.specialty_ar}) مجدولة اليوم في توقيت: ${session.scheduled_time}.\n\n🔗 رابط الدخول المباشر للغرفة:\n${roomUrl}\n\n🔐 رمز الدخول (PIN): ${session.pin}\nمنصة PsyPro للرعاية السريرية.`;

    if (cleanPhone) {
      try {
        const res = await whatsappApi.sendMessage({
          phone: cleanPhone,
          message: msg,
          patient_id: session.patient_id,
          service_type: 'teletherapy_room',
        });
        if (res.success) {
          setToastMsg('تم إرسال رابط غرفة الاستشارة إلى واتساب المريض بنجاح! 🚀📲');
          setTimeout(() => setToastMsg(null), 5000);
          return;
        }
      } catch (err) {
        console.warn('Cloud dispatch failed, opening manual fallback link:', err);
      }
    }

    const encoded = encodeURIComponent(msg);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans select-none" dir="rtl">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xl font-bold shadow-lg shadow-indigo-600/10">
              💻
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              عيادة التطبيب عن بعد والسبورة السريرية
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            استشارات مرئية فائقة الأمان (WebRTC P2P) • سبورة تفاعلية مشتركة • توثيق متزامن لـ SOAP
          </p>
          {toastMsg && (
            <div className="mt-3 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}
        </div>

        {/* Quick Launch CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsQuickModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xl shadow-indigo-600/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>بدء جلسة فورية جديدة</span>
          </button>
        </div>
      </div>

      {/* MAIN NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl mb-6 max-w-xl">
        <button
          type="button"
          onClick={() => setActiveMainTab('rooms')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'rooms'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>جلسات الاستشارة وغرف الفيديو ({scheduledSessions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('whiteboard')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'whiteboard'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>أستوديو السبورة السريرية المباشرة 🎨</span>
        </button>
      </div>

      {activeMainTab === 'whiteboard' ? (
        /* DIRECT INTERACTIVE WHITEBOARD STUDIO */
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col h-[780px] mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-xl font-bold">
                🎨
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-100">
                  أستوديو السبورة السريرية التفاعلية المباشرة
                </h2>
                <p className="text-xs text-slate-400">
                  لوحة سريرية متكاملة ببطاقات التسمية، الفونيمات، مقياس SUDS، والتحفيز السلوكي بالأختام • جاهزة للاستخدام الحضوري أو عن بعد
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuickModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-indigo-600/25"
              >
                <Video className="w-4 h-4" />
                <span>إطلاق مكالمة مع السبورة</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
            <ClinicalInteractiveCanvas isPractitioner={true} />
          </div>
        </div>
      ) : (
        <>
          {/* METRIC PILLS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">استشارات الشهر</span>
                <Video className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">42</div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <span>+18% نمو المتابعة عن بعد</span>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">جلسات اليوم المجدولة</span>
                <Calendar className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">{scheduledSessions.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">تخاطب، سلوك، إرشاد</div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">متوسط زمن الجلسة</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-slate-100">38 دقيقة</div>
              <div className="text-[11px] text-slate-400 mt-1">تفاعلية مع السبورة</div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">حالة خادم التوجيه (WebRTC)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>جاهز ونشط 100%</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">تشفير E2EE طرف لطرف</div>
            </div>
          </div>

          {/* SCHEDULED SESSIONS & ACTIVE ROOMS */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h2 className="text-base font-bold text-slate-100">
                  جلسات التطبيب عن بعد المجدولة لليوم
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                يمكن للمريض الدخول مباشرة عبر المتصفح دون تثبيت أي برامج
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-4 transition-all duration-200 shadow-md group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {session.patient_name[0]}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {session.patient_name}
                          </h3>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {session.specialty_ar} • العمر {session.age} سنوات
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                        {session.scheduled_time}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/60 text-[11px] text-slate-400 space-y-1 mb-4">
                      <div className="flex justify-between">
                        <span>رمز الغرفة:</span>
                        <span className="font-mono text-indigo-300">{session.room_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>رمز الدخول (PIN):</span>
                        <span className="font-mono text-slate-200">{session.pin}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-900">
                    <button
                      onClick={() => handleLaunchScheduled(session)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>دخول القمرة</span>
                    </button>

                    <button
                      onClick={() => setSessionToShare(session)}
                      title="مشاركة رابط الجلسة عبر كافة القنوات (واتساب، SMS، إيميل، تيليجرام، نسخ)"
                      className="px-2.5 py-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600 hover:to-teal-600 text-emerald-300 hover:text-white rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1 text-xs font-bold"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">مشاركة</span>
                    </button>

                    <button
                      onClick={() => handleSendWhatsApp(session)}
                      title="إرسال مباشر عبر واتساب"
                      className="p-2 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CLINICAL TELETHERAPY ADVANTAGES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1">السبورة السريرية التفاعلية</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                مشاركة بطاقات التسمية، ألواح التمييز البصري، تمارين الفونيمات، ومقياس الضيق SUDS مع تفاعل المتلقي بالرسم وختم النجوم ⭐ في الوقت الفعلي.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1">ميقاتية وتوثيق متزامن</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                توثيق بطاقات SOAP الأربعة بجانب الفيديو دون انقطاع الاتصال أو تصفير الميقاتية، مع ميزة الإملاء الصوتي الفوري والتصدير للسجل الطبي.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1">خصوصية طبية بدون وسيط</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                اتصال مباشر WebRTC Peer-to-Peer محمي بتشفير end-to-end دون الحاجة لبرامج خارجية كـ Zoom أو Google Meet، وبدون أي تثبيت للمريض.
              </p>
            </div>
          </div>
        </>
      )}

      {/* QUICK LAUNCH MODAL */}
      {isQuickModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                بدء جلسة تطبيب فوري جديدة
              </h3>
              <button
                onClick={() => setIsQuickModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Searchable Patient Combobox */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>اختر أو ابحث عن مريض بالاسم / الملف: <span className="text-rose-400">*</span></span>
                  {selectedPatient && (
                    <span className="text-[10px] text-teal-400 font-mono flex items-center gap-1">
                      <Check className="w-3 h-3 text-teal-400" />
                      <span>تم تحديد المريض</span>
                    </span>
                  )}
                </label>

                <div className="relative" ref={patientDropdownRef}>
                  {/* Combobox Trigger */}
                  <div
                    onClick={() => setIsPatientDropdownOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950 border cursor-pointer transition-all shadow-sm ${
                      selectedPatient
                        ? 'border-indigo-500/80 bg-indigo-950/30 text-white ring-1 ring-indigo-500/30'
                        : isPatientDropdownOpen
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 text-slate-200'
                        : 'border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse min-w-0">
                      {selectedPatient ? (
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-teal-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                          {(getPatientDisplayName(selectedPatient)[0] || 'م')}
                        </div>
                      ) : (
                        <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}

                      <div className="truncate text-xs font-bold">
                        {selectedPatient ? (
                          <span className="text-indigo-200 font-bold">
                            {getPatientDisplayName(selectedPatient)}
                            <span className="text-[10px] text-slate-400 font-mono font-normal mr-1.5">
                              ({selectedPatient.folder_number || selectedPatient.file_number || `CL-${selectedPatient.id}`})
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">
                            ابحث بالاسم، رقم الهاتف، أو رقم الملف...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 space-x-reverse shrink-0 mr-2">
                      {selectedPatientId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatientId('');
                          }}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                          title="إلغاء التحديد"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          isPatientDropdownOpen ? 'rotate-180 text-indigo-400' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Dropdown Popover */}
                  {isPatientDropdownOpen && (
                    <div
                      className="absolute z-50 mt-1.5 right-0 left-0 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-hidden p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl"
                      dir="rtl"
                    >
                      {/* Live Search Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={patientSearchQuery}
                          onChange={(e) => setPatientSearchQuery(e.target.value)}
                          placeholder="ابحث بالاسم، رقم الملف، أو الهاتف..."
                          className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-indigo-500 focus:outline-none transition-all shadow-inner"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        {patientSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setPatientSearchQuery('')}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* List of Patients */}
                      <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                        {filteredPatients.length === 0 ? (
                          <div className="py-5 text-center text-slate-500 text-xs space-y-1">
                            <p className="font-semibold">لا يوجد مريض مطابق لـ "{patientSearchQuery}"</p>
                            <p className="text-[10px] text-slate-600">يمكنك كتابة اسم مريض سريع بالأسفل</p>
                          </div>
                        ) : (
                          filteredPatients.map((p) => {
                            const isSelected = String(p.id) === String(selectedPatientId);
                            const fullName = getPatientDisplayName(p);
                            const folderNum = p.folder_number || p.file_number || `CL-${p.id}`;

                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setSelectedPatientId(String(p.id));
                                  setCustomPatientName('');
                                  setIsPatientDropdownOpen(false);
                                  setPatientSearchQuery('');
                                }}
                                className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                                  isSelected
                                    ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm'
                                    : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/80 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 space-x-reverse min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'bg-gradient-to-tr from-indigo-500 to-teal-500 text-white'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {(fullName[0] || 'م')}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold truncate flex items-center gap-1">
                                      <span
                                        className={
                                          isSelected ? 'text-indigo-300 font-extrabold' : 'text-slate-200'
                                        }
                                      >
                                        {fullName}
                                      </span>
                                      {p.age && (
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          ({p.age} سنة)
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 truncate">
                                      <span>ملف: {folderNum}</span>
                                      {p.phone && <span>• {p.phone}</span>}
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0 mr-1.5">
                                  {isSelected ? (
                                    <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 hover:text-indigo-400">
                                      اختيار
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!selectedPatientId && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    أو اسم المريض / الولي (جلسة سريعة): <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={customPatientName}
                    onChange={(e) => setCustomPatientName(e.target.value)}
                    placeholder="مثال: حسام الدين بن سالم"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  التخصص السريري للجلسة:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'orthophony', label: 'تخاطب' },
                    { id: 'psychology', label: 'دعم نفسي' },
                    { id: 'psychomotor', label: 'حركي / والدي' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSpecialty(s.id)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                        selectedSpecialty === s.id
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLaunchInstantRoom}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>إطلاق القمرة الآن</span>
              </button>

              <button
                onClick={() => setIsQuickModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-CHANNEL SHARE LINK MODAL */}
      {sessionToShare && (
        <ShareTeletherapyLinkModal
          isOpen={!!sessionToShare}
          onClose={() => setSessionToShare(null)}
          roomCode={sessionToShare.room_code}
          roomPin={sessionToShare.pin || '7788'}
          patient={{
            id: sessionToShare.patient_id,
            full_name: sessionToShare.patient_name,
            phone: sessionToShare.phone,
          }}
          doctorName="الأخصائي المعالج"
        />
      )}
    </div>
  );
}
