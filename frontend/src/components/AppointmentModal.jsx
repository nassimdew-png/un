import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  X, 
  Check, 
  AlertTriangle, 
  Repeat, 
  Search, 
  Send, 
  Sparkles, 
  Phone, 
  Stethoscope, 
  FileText,
  CheckCircle2,
  CalendarDays,
  Video
} from 'lucide-react';
import { appointmentApi, patientApi } from '../api';

function normalizeArabic(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic tashkeel / harakat
    .replace(/[ـ]/g, '') // Remove tatweel
    .replace(/[أإآٱ]/g, 'ا') // Normalize Alefs
    .replace(/ة/g, 'ه') // Normalize Teh Marbuta to Heh
    .replace(/[ىئ]/g, 'ي') // Normalize Yeh
    .replace(/[ؤ]/g, 'و')
    .toLowerCase()
    .trim();
}

const CLINICAL_TYPES = [
  {
    id: 'therapy_session',
    labelAr: 'حصة تأهيل وعلاج سريري',
    labelFr: 'Séance de rééducation',
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    icon: Stethoscope,
    defaultDuration: 45
  },
  {
    id: 'teleconsultation',
    labelAr: 'استشارة مرئية عن بعد (Tele-Therapy)',
    labelFr: 'Téléconsultation vidéo & Canvas',
    color: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    icon: Video,
    defaultDuration: 45
  },
  {
    id: 'initial_consultation',
    labelAr: 'استشارة أولى / فحص تشخيصي أولي',
    labelFr: 'Première consultation / Anamnèse',
    color: 'border-brand-500/40 bg-brand-500/10 text-brand-300',
    icon: Sparkles,
    defaultDuration: 60
  },
  {
    id: 'assessment',
    labelAr: 'جلسة تقييم وتمرير روائز ومقاييس',
    labelFr: 'Passation de bilan psychométrique',
    color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
    icon: FileText,
    defaultDuration: 60
  },
  {
    id: 'follow_up',
    labelAr: 'جلسة متابعة ومراقبة مرحلية',
    labelFr: 'Séance de contrôle / Suivi',
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    icon: Clock,
    defaultDuration: 30
  }
];

const CLINICAL_NOTE_PRESETS = [
  'متابعة النطق والتأتأة وتنظيم التنفس',
  'تأهيل التعبير اللغوي الشفهي والكتابي',
  'جلسة علاج سلوكي معرفي (CBT) وسجل الأفكار',
  'إعادة تأهيل نفسي حركي وتناسق حركي',
  'فحص أولي وتقييم الصعوبات النمائية',
  'مراجعة تطبيق التمارين المنزلية الأسبوعية'
];

export default function AppointmentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  patients = [], 
  user, 
  tenant,
  initialDate = null,
  initialPatientId = null,
  existingAppointments = []
}) {
  const [localPatients, setLocalPatients] = useState(patients || []);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || patients[0]?.id || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFetchingPatients, setIsFetchingPatients] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Sync with incoming patients prop
  useEffect(() => {
    if (patients && patients.length > 0) {
      setLocalPatients(prev => {
        const map = new Map();
        patients.forEach(p => map.set(String(p.id), p));
        prev.forEach(p => {
          if (!map.has(String(p.id))) map.set(String(p.id), p);
        });
        return Array.from(map.values());
      });
    }
  }, [patients]);

  // Self-healing patient loader when modal is opened
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const loadPatients = async () => {
      try {
        setIsFetchingPatients(true);
        const res = await patientApi.list({ per_page: 200, all: true });
        const list = res.data || res.patients || [];
        if (active && Array.isArray(list) && list.length > 0) {
          setLocalPatients(prev => {
            const map = new Map();
            list.forEach(p => map.set(String(p.id), p));
            prev.forEach(p => {
              if (!map.has(String(p.id))) map.set(String(p.id), p);
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Could not auto-fetch patients in AppointmentModal:', err);
      } finally {
        if (active) setIsFetchingPatients(false);
      }
    };
    loadPatients();
    return () => { active = false; };
  }, [isOpen]);

  // Live debounced search against backend API if query has 2+ characters
  useEffect(() => {
    if (!patientSearch || patientSearch.trim().length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = await patientApi.search(patientSearch.trim());
        const found = res.data || res.patients || [];
        if (Array.isArray(found) && found.length > 0) {
          setLocalPatients(prev => {
            const map = new Map();
            found.forEach(p => map.set(String(p.id), p));
            prev.forEach(p => {
              if (!map.has(String(p.id))) map.set(String(p.id), p);
            });
            return Array.from(map.values());
          });
        }
      } catch (e) {
        console.warn('Patient live search error:', e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const getInitialDateTime = (initDate) => {
    if (initDate) {
      return initDate.includes('T') ? initDate.slice(0, 16) : `${initDate}T09:00`;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    let hours = now.getHours() + 1;
    if (hours < 8 || hours >= 18) {
      return `${year}-${month}-${day}T09:00`;
    }
    const hoursStr = String(hours).padStart(2, '0');
    return `${year}-${month}-${day}T${hoursStr}:00`;
  };

  const [appointmentDate, setAppointmentDate] = useState(() => getInitialDateTime(initialDate));
  const [selectedType, setSelectedType] = useState('therapy_session');
  const [duration, setDuration] = useState(45);
  const [notes, setNotes] = useState('');

  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(4);

  // WhatsApp auto-send
  const [sendWhatsApp, setSendWhatsApp] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conflictWarning, setConflictWarning] = useState(null);

  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
    }
    if (initialDate) {
      setAppointmentDate(getInitialDateTime(initialDate));
    }
  }, [initialDate, initialPatientId, isOpen]);

  // Filter patients by search query with Arabic text normalization & token matching
  const filteredPatients = useMemo(() => {
    const q = normalizeArabic(patientSearch);
    if (!q) return localPatients.slice(0, 30);

    const tokens = q.split(/\s+/).filter(Boolean);

    return localPatients.filter(p => {
      const first = normalizeArabic(p.first_name);
      const last = normalizeArabic(p.last_name);
      const full = `${first} ${last}`;
      const revFull = `${last} ${first}`;
      const phone = (p.phone || '').toLowerCase();
      const fileNum = (p.file_number || p.folder_number || String(p.id)).toLowerCase();

      // Exact substring match
      if (full.includes(q) || revFull.includes(q) || phone.includes(q) || fileNum.includes(q)) {
        return true;
      }

      // All tokens match in full name or phone
      if (tokens.length > 1) {
        return tokens.every(tok => full.includes(tok) || revFull.includes(tok) || phone.includes(tok));
      }

      return false;
    }).slice(0, 30);
  }, [localPatients, patientSearch]);

  const selectedPatient = useMemo(() => {
    return localPatients.find(p => String(p.id) === String(selectedPatientId));
  }, [localPatients, selectedPatientId]);

  // Check conflicts whenever date/time changes
  useEffect(() => {
    if (!appointmentDate) {
      setConflictWarning(null);
      return;
    }

    const checkTime = new Date(appointmentDate).getTime();
    if (isNaN(checkTime)) return;

    // Check local existing appointments within 30 minutes
    const found = existingAppointments.find(app => {
      if (app.status === 'cancelled' || app.status === 'no_show') return false;
      const appTime = new Date(app.appointment_date).getTime();
      const diffMinutes = Math.abs(appTime - checkTime) / (1000 * 60);
      return diffMinutes < 30;
    });

    if (found) {
      const pName = found.patient ? `${found.patient.first_name} ${found.patient.last_name}` : 'مريض آخر';
      const timeStr = found.appointment_date?.split('T')[1]?.slice(0, 5) || '';
      setConflictWarning(`⚠️ تنبيه تعارض زمني: يوجد موعد مجدول بالفعل في نفس الفترة (الساعة ${timeStr}) للمريض: ${pName}`);
    } else {
      setConflictWarning(null);
    }
  }, [appointmentDate, existingAppointments]);

  if (!isOpen) return null;

  // Preset time adjuster
  const setQuickDate = (daysAhead, hours = 9, minutes = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hours, minutes, 0, 0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    setAppointmentDate(`${y}-${m}-${day}T${h}:${min}`);
  };

  const handleQuickAddPatient = async () => {
    if (!patientSearch.trim()) return;
    setIsQuickAdding(true);
    setError('');
    try {
      const parts = patientSearch.trim().split(/\s+/);
      const firstName = parts[0] || patientSearch.trim();
      const lastName = parts.slice(1).join(' ') || 'غربي';
      const res = await patientApi.create({
        first_name: firstName,
        last_name: lastName,
        gender: 'female',
        birth_date: '2015-01-01',
        phone: '0550123789'
      });
      const created = res.data || res.patient || res;
      if (created && created.id) {
        setLocalPatients(prev => [created, ...prev]);
        setSelectedPatientId(created.id);
        setIsDropdownOpen(false);
        setPatientSearch('');
      }
    } catch (err) {
      setError('تعذر إنشاء المريض تلقائياً: ' + (err.message || ''));
    } finally {
      setIsQuickAdding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPatientId) {
      setError('يرجى اختيار المريض لتحديد الموعد.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        patient_id: selectedPatientId,
        specialist_id: user?.id || null,
        appointment_date: appointmentDate,
        type: selectedType,
        notes: notes.trim(),
        recurrence_weeks: isRecurring ? recurrenceWeeks : 1,
      };

      const res = await appointmentApi.create(payload);
      const createdAppt = res.data || res.appointment;

      // If user wants WhatsApp message, trigger Cloud API or fallback link
      if (sendWhatsApp && createdAppt?.id) {
        try {
          try {
            await appointmentApi.sendWhatsAppReminder(createdAppt.id);
          } catch (cErr) {
            console.warn('Direct Cloud WhatsApp failed, falling back to manual link:', cErr);
            const wRes = await appointmentApi.whatsappReminder(createdAppt.id);
            if (wRes?.whatsapp_url) {
              window.open(wRes.whatsapp_url, '_blank');
            }
          }
        } catch (wErr) {
          console.warn('WhatsApp prompt failed:', wErr);
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تخطيط الموعد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-6 shadow-2xl relative text-right">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold shadow-lg shadow-brand-500/10">
              <CalendarDays className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>تخطيط وجدولة موعد سريري</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-normal">
                  Nouveau RDV
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {tenant?.header_title_ar || tenant?.name} • الأخصائي: {user?.name || 'الطبيب المعالج'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Conflict Warning */}
        {conflictWarning && (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>{conflictWarning}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Hidden standard select for full accessibility / automation tools */}
          <select
            id="patient_select"
            name="patient_id"
            data-testid="patient-select-dropdown"
            value={selectedPatientId || ''}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          >
            <option value="">-- اختر المريض --</option>
            {localPatients.map(p => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} {p.phone ? `(${p.phone})` : ''}
              </option>
            ))}
          </select>

          {/* 1. Patient Selector with Live Search */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-400" />
                <span>المريض المستفيد (Patient) *</span>
              </span>
              {selectedPatient && (
                <span className="text-[11px] text-emerald-400 font-mono">
                  رقم الملف: #{selectedPatient.id} • {selectedPatient.phone || 'بدون هاتف'}
                </span>
              )}
            </label>

            <div className="relative">
              <div 
                data-testid="patient-picker-trigger"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl text-slate-200 text-xs flex items-center justify-between cursor-pointer"
              >
                {selectedPatient ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </span>
                    {selectedPatient.phone && (
                      <span className="text-slate-400 text-xs font-mono">({selectedPatient.phone})</span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-500">اختر مريضاً من القائمة أو ابحث بالاسم...</span>
                )}
                <Search className="w-4 h-4 text-slate-400" />
              </div>

              {/* Autocomplete Dropdown */}
              {isDropdownOpen && (
                <div className="absolute top-full right-0 left-0 mt-2 p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto space-y-1">
                  <div className="p-1 sticky top-0 bg-slate-900 z-10">
                    <input
                      type="text"
                      data-testid="patient-search-input"
                      placeholder="ابحث بالاسم (أميرة غربي)، اللقب، أو الهاتف..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      autoFocus
                    />
                  </div>

                  {filteredPatients.length === 0 ? (
                    <div className="p-3 text-center space-y-2">
                      <div className="text-xs text-slate-500">
                        {isFetchingPatients ? 'جارٍ البحث في قاعدة المرضى...' : 'لا يوجد مريض مطابق للبحث.'}
                      </div>
                      {patientSearch.trim().length >= 2 && (
                        <button
                          type="button"
                          onClick={handleQuickAddPatient}
                          disabled={isQuickAdding}
                          className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold w-full transition-all flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <span>{isQuickAdding ? 'جارٍ الإضافة...' : `➕ إضافة المريض "${patientSearch}" وتعيينه فوراً`}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredPatients.map(p => (
                      <div
                        key={p.id}
                        data-testid={`patient-option-${p.id}`}
                        data-patient-name={`${p.first_name} ${p.last_name}`}
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setIsDropdownOpen(false);
                          setPatientSearch('');
                        }}
                        className={`p-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          String(selectedPatientId) === String(p.id)
                            ? 'bg-brand-600/30 text-brand-300 font-bold border border-brand-500/30'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white text-xs">{p.first_name} {p.last_name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            {p.phone && <span>📞 {p.phone}</span>}
                            {p.date_of_birth && <span>🎂 {p.date_of_birth}</span>}
                          </div>
                        </div>
                        {String(selectedPatientId) === String(p.id) && (
                          <Check className="w-4 h-4 text-brand-400" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. Consultation Clinical Type */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-brand-400" />
              <span>نوع الحصة السريرية (Type de Consultation) *</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CLINICAL_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <div
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      setDuration(type.defaultDuration);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected 
                        ? `${type.color} ring-1 ring-white/20 shadow-md` 
                        : 'border-slate-800/80 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-800/80 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-white">{type.labelAr}</div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">{type.labelFr}</div>
                      <div className="text-[10px] text-slate-500 mt-1">المدة المقترحة: {type.defaultDuration} دقيقة</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Date & Time Selection + Quick Presets */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                <span>توقيت وتاريخ الجلسة (Date & Heure) *</span>
              </label>

              {/* Quick Date Presets */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setQuickDate(0, 10, 0)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  اليوم 10:00
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(0, 14, 0)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  اليوم 14:00
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1, 10, 0)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  غداً 10:00
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1, 15, 0)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  غداً 15:00
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="datetime-local"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5 h-full">
                  {[30, 45, 60, 90].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setDuration(dur)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        duration === dur
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                          : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {dur} د
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Recurrence Toggle (Programmation de Séances Récurrentes) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsRecurring(prev => !prev)}>
              <div className="flex items-center gap-2">
                <Repeat className={`w-4 h-4 ${isRecurring ? 'text-brand-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold text-white">برنامج حصص متكررة (Reconduction Hebdomadaire)</div>
                  <div className="text-[10px] text-slate-400">حجز جلسات دورية متتالية في نفس اليوم والتوقيت أسبوعياً</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 bg-slate-900 border-slate-700 focus:ring-brand-500"
              />
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-slate-800/60 flex items-center gap-3 animate-fadeIn">
                <span className="text-xs text-slate-300">عدد الحصص المتكررة أسبوعياً:</span>
                <div className="flex items-center gap-1.5">
                  {[2, 4, 6, 8, 10, 12].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setRecurrenceWeeks(w)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        recurrenceWeeks === w
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {w} حصص
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Motif & Clinical Notes + Suggestions */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-400" />
                <span>الهدف العلاجي / ملاحظات الحصة (Motif de consultation)</span>
              </span>
              <span className="text-[10px] text-slate-400">اختياري</span>
            </label>

            {/* Quick preset badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CLINICAL_NOTE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNotes(prev => prev ? `${prev} • ${preset}` : preset)}
                  className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition-colors border border-slate-700/50"
                >
                  + {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أهداف الجلسة، التعليمات السريرية، أو تذكير خاص بالملف..."
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-slate-200 text-xs focus:ring-2 focus:ring-brand-500 placeholder-slate-500"
            />
          </div>

          {/* 6. WhatsApp Instant Reminder Notification Option */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-emerald-300">تذكير WhatsApp الفوري</span>
                <p className="text-[10px] text-emerald-400/80">فتح رسالة التذكير تلقائياً وتوجيهها للمريض بعد تأكيد الحجز</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              إلغاء (Annuler)
            </button>

            <button
              type="submit"
              data-testid="appointment-submit-btn"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'جارٍ التخطيط والتثبيت...' : isRecurring ? `تأكيد حجز ${recurrenceWeeks} حصص` : 'تأكيد وحفظ الموعد'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
