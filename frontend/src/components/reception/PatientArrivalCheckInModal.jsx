import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  UserCheck,
  UserPlus,
  Search,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  DollarSign,
  Send,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  Check,
  Volume2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import AlgerianGeoSelector from '../common/AlgerianGeoSelector';
import { patientApi, appointmentApi, staffApi } from '../../api';
import {
  normalizeWhatsAppPhone,
  formatWhatsAppDisplayPhone,
  buildWhatsAppLinks
} from '../../utils/phoneHelper';

const CLINICAL_TYPES = [
  {
    id: 'therapy_session',
    labelAr: 'حصة تأهيل وعلاج سريري',
    labelFr: 'Séance de rééducation',
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    icon: Stethoscope,
  },
  {
    id: 'initial_consultation',
    labelAr: 'استشارة أولى / فحص تشخيصي',
    labelFr: 'Première consultation / Diagnostic',
    color: 'border-teal-500/40 bg-teal-500/10 text-teal-300',
    icon: Sparkles,
  },
  {
    id: 'assessment',
    labelAr: 'جلسة تقييم وتمرير مقاييس',
    labelFr: 'Passation de bilan & tests',
    color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
    icon: FileText,
  },
  {
    id: 'follow_up',
    labelAr: 'جلسة متابعة ومراقبة مرحلية',
    labelFr: 'Séance de contrôle / Suivi',
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    icon: Clock,
  },
  {
    id: 'urgent',
    labelAr: 'استشارة مستعجلة / طارئة',
    labelFr: 'Consultation urgente',
    color: 'border-red-500/40 bg-red-500/10 text-red-300',
    icon: Zap,
  },
];

const PRESET_REASONS = [
  'حضر بدون موعد مسبق (Walk-in)',
  'جلسة تأهيل إضافية',
  'فحص سريري مستعجل',
  'متابعة ومراجعة التمارين المنزلية',
  'استلام شهادة أو تقرير طبي',
  'استشارة أسرية وتوجيه الولي',
];

export default function PatientArrivalCheckInModal({
  isOpen,
  onClose,
  onSuccess,
  tenant,
  user,
  patients = [],
  specialists = [],
  initialPatient = null,
}) {
  const [activeMode, setActiveMode] = useState('existing'); // 'existing' | 'new'
  
  // Existing Patient Search & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(initialPatient || null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Check-In Settings
  const [specialistId, setSpecialistId] = useState(user?.id || specialists[0]?.id || '');
  const [visitType, setVisitType] = useState('therapy_session');
  const [arrivalNotes, setArrivalNotes] = useState('حضر بدون موعد مسبق (Walk-in)');
  const [autoChime, setAutoChime] = useState(true);

  // New Patient Form State
  const [newPatientData, setNewPatientData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'male',
    guardian_name: '',
    guardian_relation: 'father',
    phone: '',
    wilaya_code: '16',
    commune_name: '',
    chifa_number: '',
    consultation_reason: 'حضور مباشر للعيادة لأول مرة',
    kiosk_pin: Math.floor(100000 + Math.random() * 900000).toString(),
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Sync initial patient if provided
  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
      setActiveMode('existing');
    }
  }, [initialPatient]);

  // Set default specialist from available list
  useEffect(() => {
    if (!specialistId && specialists.length > 0) {
      setSpecialistId(specialists[0].id);
    } else if (!specialistId && user?.id) {
      setSpecialistId(user.id);
    }
  }, [specialists, user]);

  // Live Deep Search in Patients
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    
    // 1. Instant filter from in-memory patients list
    const localMatches = (patients || []).filter((p) => {
      const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const pin = (p.kiosk_pin || '').toLowerCase();
      const chifa = (p.chifa_number || '').toLowerCase();
      return fullName.includes(query) || phone.includes(query) || pin.includes(query) || chifa.includes(query);
    });

    setSearchResults(localMatches.slice(0, 8));

    // 2. Async deep DB search if needed
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setSearching(true);
        try {
          const res = await patientApi.search(query);
          const list = res.patients || res.data || (Array.isArray(res) ? res : []);
          if (Array.isArray(list) && list.length > 0) {
            // Merge unique
            const map = new Map();
            localMatches.forEach((p) => map.set(p.id, p));
            list.forEach((p) => map.set(p.id, p));
            setSearchResults(Array.from(map.values()).slice(0, 10));
          }
        } catch (e) {
          console.warn('Patient deep search error:', e);
        } finally {
          setSearching(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, patients]);

  if (!isOpen) return null;

  // Sound chime & Arabic speech
  const playArrivalNotification = (patientName, targetStatus) => {
    if (!autoChime) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
        });
      }

      if ('speechSynthesis' in window && patientName) {
        window.speechSynthesis.cancel();
        const statusText = targetStatus === 'in_progress' 
          ? `المريض ${patientName}، يرجى التوجه فوراً لغرفة الفحص` 
          : `المريض ${patientName}، تم تسجيل حضوركم في قاعة الانتظار`;
        const utter = new SpeechSynthesisUtterance(statusText);
        utter.lang = 'ar-SA';
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {
      console.warn('Audio notification error:', e);
    }
  };

  // Submit Action: Existing Patient Check-In
  const handleCheckInExisting = async (targetStatus = 'confirmed') => {
    if (!selectedPatient) {
      setError('يرجى اختيار المريض من قائمة البحث.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const todayIso = now.toISOString();

      const payload = {
        tenant_id: tenant?.id,
        patient_id: selectedPatient.id,
        specialist_id: specialistId || null,
        appointment_date: todayIso,
        type: visitType,
        status: targetStatus, // 'confirmed' = waiting room, 'in_progress' = direct consultation
        notes: `تسجيل حضور فوري بالمكتب • ${arrivalNotes}`,
      };

      const res = await appointmentApi.create(payload);
      const createdAppt = res.appointment || res.data || res;

      // Notification
      const patientFullName = `${selectedPatient.first_name} ${selectedPatient.last_name}`;
      playArrivalNotification(patientFullName, targetStatus);

      setSuccessInfo({
        patient: selectedPatient,
        appointment: createdAppt,
        status: targetStatus,
      });

      if (onSuccess) {
        onSuccess(createdAppt, selectedPatient);
      }
    } catch (err) {
      console.error('Check-in error:', err);
      setError(err.message || 'حدث خطأ أثناء تسجيل حضور المريض.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Action: Register New Patient & Check-In
  const handleRegisterAndCheckIn = async (targetStatus = 'confirmed') => {
    if (!newPatientData.first_name.trim() || !newPatientData.last_name.trim()) {
      setError('يرجى كتابة الاسم واللقب بشكل كامل.');
      return;
    }
    if (!newPatientData.birth_date) {
      setError('يرجى تحديد تاريخ ميلاد المريض.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create Patient
      const patientPayload = {
        first_name: newPatientData.first_name.trim(),
        last_name: newPatientData.last_name.trim(),
        birth_date: newPatientData.birth_date,
        gender: newPatientData.gender,
        guardian_name: newPatientData.guardian_name || null,
        parent_name: newPatientData.guardian_name || null,
        parent_relation: newPatientData.guardian_relation || null,
        phone: newPatientData.phone || null,
        wilaya_code: newPatientData.wilaya_code || '16',
        commune_name: newPatientData.commune_name || null,
        chifa_number: newPatientData.chifa_number || null,
        kiosk_pin: newPatientData.kiosk_pin,
        consultation_reason: newPatientData.consultation_reason || 'حضور مباشر بدون موعد',
      };

      const pRes = await patientApi.create(patientPayload);
      const createdPatient = pRes.patient || pRes.data || pRes;

      // 2. Create Today's Checked-In Appointment
      const now = new Date();
      const todayIso = now.toISOString();

      const apptPayload = {
        tenant_id: tenant?.id,
        patient_id: createdPatient.id,
        specialist_id: specialistId || null,
        appointment_date: todayIso,
        type: visitType,
        status: targetStatus,
        notes: `مريض جديد • تسجيل حضور فوري • ${newPatientData.consultation_reason || arrivalNotes}`,
      };

      const apptRes = await appointmentApi.create(apptPayload);
      const createdAppt = apptRes.appointment || apptRes.data || apptRes;

      const patientFullName = `${createdPatient.first_name} ${createdPatient.last_name}`;
      playArrivalNotification(patientFullName, targetStatus);

      setSuccessInfo({
        patient: createdPatient,
        appointment: createdAppt,
        status: targetStatus,
      });

      if (onSuccess) {
        onSuccess(createdAppt, createdPatient);
      }
    } catch (err) {
      console.error('Registration & check-in error:', err);
      setError(err.message || 'حدث خطأ أثناء تسجيل المريض وحضوره.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black shadow-lg shadow-teal-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
                <span>تسجيل حضور مريض إلى العيادة</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  WALK-IN CHECK-IN 🚪
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                إدخال المريض فوراً إلى قاعة الانتظار أو توجيهه مباشرة لغرفة الفحص
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {successInfo ? (
          <div className="p-6 sm:p-8 space-y-6 text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">
                تم تسجيل حضور المريض بنجاح!
              </h3>
              <p className="text-sm font-bold text-emerald-300">
                {successInfo.patient?.first_name} {successInfo.patient?.last_name}
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {successInfo.status === 'in_progress'
                  ? 'تم تحويل المريض مباشرة لغرفة الفحص وبدء الجلسة السريرية.'
                  : 'تمت إضافة المريض إلى قاعة الانتظار وتحديث شاشات الاستقبال وشاشة التلفاز الذكية.'}
              </p>
            </div>

            {/* Patient Badge Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-right grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">رقم المرور الذاتي (PIN):</span>
                <span className="text-base font-black text-teal-300 font-mono">
                  {successInfo.patient?.kiosk_pin || '---'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">رقم الهاتف:</span>
                <span className="text-xs font-bold text-white font-mono">
                  {successInfo.patient?.phone || 'بدون هاتف'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">حالة الحضور:</span>
                <span className="text-xs font-black text-emerald-400">
                  {successInfo.status === 'in_progress' ? '🩺 داخل الفحص' : '🛋️ في قاعة الانتظار'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSuccessInfo(null);
                  setSelectedPatient(null);
                  setSearchQuery('');
                  onClose();
                }}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/20 transition active:scale-95"
              >
                إغلاق والعودة لقمرة الاستقبال
              </button>

              <button
                onClick={() => {
                  setSuccessInfo(null);
                  setSelectedPatient(null);
                  setSearchQuery('');
                }}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
              >
                تسجيل مريض آخر ➕
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            
            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('existing');
                  setError('');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 space-x-reverse ${
                  activeMode === 'existing'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>مريض مسجل مسبقاً (بحث فوري)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMode('new');
                  setError('');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 space-x-reverse ${
                  activeMode === 'new'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>مريض جديد لأول مرة ⚡</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-bold flex items-center space-x-2 space-x-reverse">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* MODE 1: EXISTING PATIENT QUICK SEARCH & CHECK-IN */}
            {activeMode === 'existing' && (
              <div className="space-y-4">
                
                {/* Search Bar */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    ابحث عن المريض بالاسم، رقم الهاتف، بطاقة الشفاء، أو رمز الـ PIN:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="اكتب اسم المريض أو رقم هاتفه للبحث الفوري..."
                      className="w-full px-4 py-3 pl-10 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-teal-500 transition"
                      autoFocus
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* Live Search Results Dropdown/Grid */}
                {searchQuery.trim() && !selectedPatient && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                      <span>نتائج البحث ({searchResults.length}):</span>
                      {searching && <span className="text-teal-400 animate-pulse">جاري البحث في قاعدة البيانات...</span>}
                    </div>

                    {searchResults.length === 0 && !searching ? (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 space-y-2">
                        <p className="text-xs font-bold">لم يتم العثور على مريض مسجل بهذا الاسم أو الرقم.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMode('new');
                            setNewPatientData((prev) => ({
                              ...prev,
                              first_name: searchQuery.split(' ')[0] || '',
                              last_name: searchQuery.split(' ').slice(1).join(' ') || '',
                            }));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-teal-600/20 text-teal-300 border border-teal-500/30 text-xs font-bold hover:bg-teal-600 hover:text-white transition"
                        >
                          تسجيل هذا المريض كملف جديد الآن ⚡
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
                        {searchResults.map((p) => {
                          const age = calculateAge(p.birth_date);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatient(p);
                                setSearchQuery('');
                              }}
                              className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800/80 hover:border-teal-500/50 text-right transition flex items-center justify-between group"
                            >
                              <div className="space-y-0.5">
                                <div className="text-xs font-black text-white group-hover:text-teal-300 flex items-center space-x-2 space-x-reverse">
                                  <span>{p.first_name} {p.last_name}</span>
                                  {age && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 font-mono">
                                      {age} سنة
                                    </span>
                                  )}
                                  {p.kiosk_pin && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20">
                                      PIN: {p.kiosk_pin}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center space-x-2 space-x-reverse">
                                  {p.phone && <span>📞 {p.phone}</span>}
                                  {p.guardian_name && <span>• الولي: {p.guardian_name}</span>}
                                  {p.chifa_number && <span>• ش شفاء: {p.chifa_number}</span>}
                                </div>
                              </div>

                              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:-translate-x-1 transition-transform" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Patient Preview Card */}
                {selectedPatient && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/30 to-slate-950 border border-teal-500/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                          {selectedPatient.first_name?.[0] || 'م'}
                        </div>
                        <div>
                          <div className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                            <span>{selectedPatient.first_name} {selectedPatient.last_name}</span>
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                              مريض محدد
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            📞 {selectedPatient.phone || 'بدون هاتف'} • PIN: {selectedPatient.kiosk_pin || '---'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="text-xs text-slate-400 hover:text-red-400 font-bold px-2 py-1 rounded-lg hover:bg-slate-800 transition"
                    >
                      تغيير المريض
                    </button>
                  </div>
                )}

                {/* Arrival & Session Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      الأخصائي / الطبيب المستلم:
                    </label>
                    <select
                      value={specialistId}
                      onChange={(e) => setSpecialistId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
                    >
                      {specialists.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          👨‍⚕️ {sp.name} ({sp.specialty || 'مختص'})
                        </option>
                      ))}
                      {specialists.length === 0 && (
                        <option value={user?.id || ''}>{user?.name || 'الأخصائي الحالي'}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      نوع الحصة / سبب الزيارة:
                    </label>
                    <select
                      value={visitType}
                      onChange={(e) => setVisitType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
                    >
                      {CLINICAL_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.labelAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Arrival Reason Chips */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    ملاحظات الاستقبال (اختياري):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_REASONS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setArrivalNotes(preset)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                          arrivalNotes === preset
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio Chime Checkbox */}
                <div className="flex items-center space-x-2 space-x-reverse pt-1 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    id="autoChime"
                    checked={autoChime}
                    onChange={(e) => setAutoChime(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-teal-500 focus:ring-teal-500"
                  />
                  <label htmlFor="autoChime" className="cursor-pointer flex items-center space-x-1 space-x-reverse">
                    <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>إطلاق جرس التنبيه الطبي والنداء الصوتي فور التسجيل</span>
                  </label>
                </div>

                {/* Action Submit Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={loading || !selectedPatient}
                    onClick={() => handleCheckInExisting('confirmed')}
                    className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 space-x-reverse transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>إدخال فوري لقاعة الانتظار 🛋️</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading || !selectedPatient}
                    onClick={() => handleCheckInExisting('in_progress')}
                    className="py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-600/20 flex items-center justify-center space-x-2 space-x-reverse transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>تحويل مباشر لغرفة الفحص 🩺</span>
                  </button>
                </div>

              </div>
            )}

            {/* MODE 2: NEW PATIENT FAST REGISTRATION & CHECK-IN */}
            {activeMode === 'new' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegisterAndCheckIn('confirmed');
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">الاسم الأول *:</label>
                    <input
                      type="text"
                      required
                      value={newPatientData.first_name}
                      onChange={(e) => setNewPatientData({ ...newPatientData, first_name: e.target.value })}
                      placeholder="مثال: يوسف"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">اللقب العائلي *:</label>
                    <input
                      type="text"
                      required
                      value={newPatientData.last_name}
                      onChange={(e) => setNewPatientData({ ...newPatientData, last_name: e.target.value })}
                      placeholder="مثال: بوعلام"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">تاريخ الميلاد *:</label>
                    <input
                      type="date"
                      required
                      value={newPatientData.birth_date}
                      onChange={(e) => setNewPatientData({ ...newPatientData, birth_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">الجنس:</label>
                    <select
                      value={newPatientData.gender}
                      onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
                    >
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">رقم الهاتف (الجزائر):</label>
                    <input
                      type="tel"
                      value={newPatientData.phone}
                      onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                      placeholder="05 / 06 / 07 ..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">اسم الولي / المرافق (للأطفال):</label>
                    <input
                      type="text"
                      value={newPatientData.guardian_name}
                      onChange={(e) => setNewPatientData({ ...newPatientData, guardian_name: e.target.value })}
                      placeholder="اسم الأب أو الأم..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">رقم بطاقة الشفاء (إن وجد):</label>
                    <input
                      type="text"
                      value={newPatientData.chifa_number}
                      onChange={(e) => setNewPatientData({ ...newPatientData, chifa_number: e.target.value })}
                      placeholder="رقم بطاقة الشفاء..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Location Selection */}
                <div>
                  <AlgerianGeoSelector
                    wilayaCode={newPatientData.wilaya_code}
                    communeName={newPatientData.commune_name}
                    onWilayaChange={(wCode) => setNewPatientData({ ...newPatientData, wilaya_code: wCode })}
                    onCommuneChange={(cName) => setNewPatientData({ ...newPatientData, commune_name: cName })}
                  />
                </div>

                {/* Assignment & Reason */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">الأخصائي المستلم:</label>
                    <select
                      value={specialistId}
                      onChange={(e) => setSpecialistId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
                    >
                      {specialists.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          👨‍⚕️ {sp.name} ({sp.specialty || 'مختص'})
                        </option>
                      ))}
                      {specialists.length === 0 && (
                        <option value={user?.id || ''}>{user?.name || 'الأخصائي الحالي'}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">نوع الاستشارة:</label>
                    <select
                      value={visitType}
                      onChange={(e) => setVisitType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
                    >
                      {CLINICAL_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.labelAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Submit Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 space-x-reverse transition disabled:opacity-50 active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>تسجيل وإدخال لقاعة الانتظار 🛋️</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleRegisterAndCheckIn('in_progress')}
                    className="py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-600/20 flex items-center justify-center space-x-2 space-x-reverse transition disabled:opacity-50 active:scale-95"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>تسجيل وتحويل مباشر للفحص 🩺</span>
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
