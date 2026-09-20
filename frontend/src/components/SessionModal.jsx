import React, { useState, useRef, useEffect, useMemo } from 'react';
import { sessionApi } from '../api';
import { 
  Clock, Stethoscope, Brain, Activity, HeartHandshake, 
  X, Check, Search, Users, ChevronDown, Sparkles, FileText, 
  CheckCircle2, XCircle, AlertCircle, Plus, Tag
} from 'lucide-react';

const CLINICAL_EXERCISE_PRESETS = {
  orthophony: [
    'لوتو الأصوات والفونيمات',
    'تمارين التنفس والتحكم الهوائي',
    'التمييز السمعي الإدراكي',
    'التسمية السريعة والتعبير الشفهي',
    'التدريب على الطلاقة النطقية',
    'مصفوفة مخارج الحروف الشفوية',
    'تقوية عضلات النطق (Praxies)',
    'التركيب النحوي وبناء الجمل'
  ],
  psychology: [
    'سجل الأفكار التلقائية CBT',
    'تقنيات الاسترخاء والتنفس البطني',
    'التعريض التدريجي للمحفزات',
    'إعادة الهيكلة المعرفية',
    'تحديد الأخطاء التفكيرية الشائعة',
    'تعديل السلوك وتوكيد الذات',
    'إدارة المشاعر ومقياس الضيق SUDS',
    'تقنيات حل المشكلات المعرفية'
  ],
  psychomotor: [
    'التناسق الحركي البصري (Oculo-manuel)',
    'التوازن الثابت والديناميكي',
    'خريطة الجسد والوعي البدني (Schéma Corporel)',
    'التوجه المكاني والزماني (Latéralité)',
    'المهارات الحركية الدقيقة (Motricité Fine)',
    'التحكم في التوتر العضلي والاسترخاء',
    'التنظيم الإيقاعي والحركي',
    'التنسيق الشامل والتخطيط الحركي'
  ],
  parent_guidance: [
    'تطبيق جدول التعزيز الإيجابي المنزلي',
    'إدارة نوبات الغضب والسلوك المعارض',
    'تنظيم روتين النوم والدراسة اليومي',
    'تطوير استراتيجيات التواصل الإيجابي',
    'تدريب الوالدين على تقنيات التهدئة',
    'متابعة تنفيذ التوصيات المدرسية'
  ]
};

const CLINICAL_NOTE_PRESETS = [
  'استجابة ممتازة وإتقان تام للتمارين المستهدفة مع تفاعل إيجابي وتركيز عالٍ.',
  'تحسن تدريجي ملحوظ مع حاجة لتكرار التدريب المنزلي لتثبيت المكتسبات.',
  'لوحظ تشتت خفيف في النصف الثاني من الجلسة، تم تعديل الإيقاع بنجاح.',
  'إنجاز 80% من أهداف الحصة وتجاوب مشجع مع التعليمات السريرية.',
  'تطبيق متقن لتقنيات التنفس والاسترخاء مع انخفاض مستوى القلق والتوتر.'
];

export default function SessionModal({ isOpen, onClose, onSuccess, patients = [], tenant, initialPatientId = null }) {
  const isOrthophony = tenant?.enabled_modules?.orthophony;
  const isPsychology = tenant?.enabled_modules?.psychology;
  const isPsychomotor = tenant?.enabled_modules?.psychomotricity;

  const defaultSpecialty = isOrthophony ? 'orthophony' : isPsychology ? 'psychology' : isPsychomotor ? 'psychomotor' : 'orthophony';

  const initialPid = (typeof initialPatientId === 'object' && initialPatientId !== null)
    ? initialPatientId.id
    : (initialPatientId || patients[0]?.id || '');

  const [patientId, setPatientId] = useState(initialPid);
  const [sessionDate, setSessionDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [specialty, setSpecialty] = useState(defaultSpecialty);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [customExerciseInput, setCustomExerciseInput] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Searchable Patient Dropdown State
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef(null);

  useEffect(() => {
    if (initialPatientId) {
      const pid = (typeof initialPatientId === 'object' && initialPatientId !== null)
        ? initialPatientId.id
        : initialPatientId;
      setPatientId(pid);
    }
  }, [initialPatientId]);

  // Click outside listener
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

  // Helper for patient name
  const getPatientDisplayName = (p) => {
    if (!p) return '';
    const combined = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    return combined || p.full_name || p.name || `مريض #${p.id}`;
  };

  const selectedPatient = useMemo(() => {
    if (!patientId) return null;
    return patients.find((p) => String(p.id) === String(patientId)) || null;
  }, [patients, patientId]);

  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return patients;
    const q = patientSearchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const name = getPatientDisplayName(p).toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const folder = (p.folder_number || p.file_number || '').toLowerCase();
      const idStr = String(p.id || '');
      return name.includes(q) || phone.includes(q) || folder.includes(q) || idStr.includes(q);
    });
  }, [patients, patientSearchQuery]);

  if (!isOpen) return null;

  const toggleExercise = (ex) => {
    if (selectedExercises.includes(ex)) {
      setSelectedExercises(selectedExercises.filter((item) => item !== ex));
    } else {
      setSelectedExercises([...selectedExercises, ex]);
    }
  };

  const addCustomExercise = (e) => {
    e?.preventDefault();
    if (!customExerciseInput.trim()) return;
    const trimmed = customExerciseInput.trim();
    if (!selectedExercises.includes(trimmed)) {
      setSelectedExercises([...selectedExercises, trimmed]);
    }
    setCustomExerciseInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPatientId = (typeof patientId === 'object' && patientId !== null) ? patientId.id : patientId;
    if (!cleanPatientId) {
      setError('يرجى اختيار مريض لتسجيل الجلسة.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await sessionApi.create({
        patient_id: cleanPatientId,
        session_date: sessionDate,
        duration_minutes: Number(durationMinutes),
        specialty,
        attendance_status: attendanceStatus,
        exercises_targeted: selectedExercises,
        progress_notes: progressNotes,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الجلسة السريرية');
    } finally {
      setLoading(false);
    }
  };

  const availablePresets = CLINICAL_EXERCISE_PRESETS[specialty] || CLINICAL_EXERCISE_PRESETS.orthophony;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl custom-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">تسجيل وتوثيق جلسة تأهيلية جديدة</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                  Séance de Suivi
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">توثيق الحضور، التمارين المنجزة، والملاحظات السريرية التراكمية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Searchable Combobox */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>المريض المستهدف في الحصة التأهيلية: <span className="text-rose-400">*</span></span>
              {selectedPatient && (
                <span className="text-[10px] text-teal-400 font-mono">
                  ملف: {selectedPatient.folder_number || selectedPatient.file_number || `CL-${selectedPatient.id}`}
                </span>
              )}
            </label>

            <div className="relative" ref={patientDropdownRef}>
              <div
                onClick={() => setIsPatientDropdownOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-950 border cursor-pointer transition-all shadow-inner ${
                  selectedPatient
                    ? 'border-cyan-500/80 bg-cyan-950/20 text-white ring-1 ring-cyan-500/30'
                    : isPatientDropdownOpen
                    ? 'border-cyan-500 ring-2 ring-cyan-500/20 text-slate-200'
                    : 'border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 space-x-reverse min-w-0">
                  {selectedPatient ? (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {(getPatientDisplayName(selectedPatient)[0] || 'م')}
                    </div>
                  ) : (
                    <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}

                  <div className="truncate text-xs font-bold">
                    {selectedPatient ? (
                      <span className="text-cyan-200 font-bold">
                        {getPatientDisplayName(selectedPatient)}
                        <span className="text-[10px] text-slate-400 font-mono font-normal mr-1.5">
                          ({selectedPatient.age ? `${selectedPatient.age} سنة` : 'العمر غير محدد'})
                          {selectedPatient.phone ? ` • ${selectedPatient.phone}` : ''}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">
                        ابحث بالاسم، رقم الملف، أو رقم الهاتف...
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 space-x-reverse shrink-0 mr-2">
                  {patientId && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPatientId('');
                      }}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                      title="إلغاء التحديد"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isPatientDropdownOpen ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Popover */}
              {isPatientDropdownOpen && (
                <div
                  className="absolute z-50 mt-1.5 right-0 left-0 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-hidden p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl"
                  dir="rtl"
                >
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-cyan-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      placeholder="ابحث بالاسم، اللقب، رقم الملف، أو الهاتف..."
                      className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-cyan-500 focus:outline-none transition-all shadow-inner"
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

                  <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                    {filteredPatients.length === 0 ? (
                      <div className="py-5 text-center text-slate-500 text-xs">
                        لا يوجد مريض مطابق لـ "{patientSearchQuery}"
                      </div>
                    ) : (
                      filteredPatients.map((p) => {
                        const isSelected = String(p.id) === String(patientId);
                        const fullName = getPatientDisplayName(p);
                        const folderNum = p.folder_number || p.file_number || `CL-${p.id}`;

                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setPatientId(String(p.id));
                              setIsPatientDropdownOpen(false);
                              setPatientSearchQuery('');
                            }}
                            className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                              isSelected
                                ? 'bg-cyan-600/20 border-cyan-500/50 text-white shadow-sm'
                                : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/80 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 space-x-reverse min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {(fullName[0] || 'م')}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold truncate flex items-center gap-1">
                                  <span className={isSelected ? 'text-cyan-300 font-extrabold' : 'text-slate-200'}>
                                    {fullName}
                                  </span>
                                  {p.age && (
                                    <span className="text-[10px] text-slate-400 font-mono">({p.age} سنة)</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 truncate">
                                  <span>ملف: {folderNum}</span>
                                  {p.phone && <span>• {p.phone}</span>}
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 mr-2" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Specialty Selector Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              التخصص والمجال السريري للحصة: <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'orthophony', label: 'أرطوفونيا وتخاطب', icon: Stethoscope, color: 'text-fuchsia-400' },
                { id: 'psychology', label: 'دعم نفسي و CBT', icon: Brain, color: 'text-cyan-400' },
                { id: 'psychomotor', label: 'تأهيل حركي ونفسي', icon: Activity, color: 'text-amber-400' },
                { id: 'parent_guidance', label: 'إرشاد والدي وأسري', icon: HeartHandshake, color: 'text-emerald-400' }
              ].map((item) => {
                const Icon = item.icon;
                const isCurrent = specialty === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSpecialty(item.id)}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      isCurrent
                        ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isCurrent ? item.color : 'text-slate-500'}`} />
                    <span className="text-[11px] leading-tight text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date, Duration & Attendance Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                تاريخ وتوقيت الحصة: <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                مدة الجلسة (دقيقة):
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value={30}>30 دقيقة (جلسة قصيرة / أطفال)</option>
                <option value={45}>45 دقيقة (المعيار السريري)</option>
                <option value={60}>60 دقيقة (حصة مكثفة)</option>
                <option value={90}>90 دقيقة (تقييم وفحص مطول)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                حالة المواظبة والحضور:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'present', label: 'حاضر', color: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' },
                  { id: 'absent', label: 'غائب', color: 'bg-rose-500/15 border-rose-500/40 text-rose-300' },
                  { id: 'excused', label: 'معتذر', color: 'bg-amber-500/15 border-amber-500/40 text-amber-300' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setAttendanceStatus(st.id)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      attendanceStatus === st.id
                        ? st.color
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clinical Exercises Bank */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>التمارين والبروتوكولات السريرية المنجزة في الجلسة:</span>
              </div>
              <span className="text-[10px] text-slate-500">اضغط للإضافة السريعة</span>
            </div>

            {/* Presets Chips */}
            <div className="flex flex-wrap gap-1.5">
              {availablePresets.map((preset) => {
                const isSelected = selectedExercises.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => toggleExercise(preset)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all border flex items-center gap-1 ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-slate-500" />}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Exercise Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customExerciseInput}
                onChange={(e) => setCustomExerciseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomExercise();
                  }
                }}
                placeholder="أضف تمريناً مخصصاً واضغط Enter أو زر الإضافة..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustomExercise}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                إضافة
              </button>
            </div>
          </div>

          {/* Progress Notes with Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                الملاحظات السريرية وتقييم التطور (Clinical Progress Notes):
              </label>
              <span className="text-[10px] text-slate-500">تدعم الحفظ في ملف المريض التراكمي</span>
            </div>

            {/* Fast Preset Templates */}
            <div className="flex flex-wrap gap-1 mb-2">
              {CLINICAL_NOTE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setProgressNotes((prev) => (prev ? `${prev}\n• ${preset}` : `• ${preset}`))}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-cyan-300 text-[10px] transition-all truncate max-w-xs"
                  title={preset}
                >
                  + {preset.substring(0, 30)}...
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              placeholder="اكتب الملاحظات السريرية، مدى تجاوب المفحوص، التمارين المنزلية الموصى بها للأولياء..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? 'جاري الحفظ...' : 'حفظ الجلسة في السجل الطبي'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
