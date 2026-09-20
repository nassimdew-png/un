import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Printer,
  Smartphone,
  Play,
  CheckCircle2,
  Clock,
  User,
  Sparkles,
  Volume2,
  Brain,
  Activity,
  Smile,
  Target,
  Compass,
  FileText,
  X,
  Share2,
  Check,
  Send,
  Download,
  AlertCircle
} from 'lucide-react';
import { CLINICAL_EXERCISES_CATALOG, EXERCISE_CATEGORIES } from './ExercisesCatalogData';
import { homeworkApi, exerciseApi, patientApi, whatsappApi } from '../../api';
import SearchablePatientSelect, { getPatientDisplayName, getPatientDisplayAge } from '../common/SearchablePatientSelect';
import FastHomeCareAssignModal from './FastHomeCareAssignModal';

export default function ExercisesBankView({ patients = [], tenant }) {
  // Exercises dynamic bank state (initialized with local clinical catalog)
  const [exercisesList, setExercisesList] = useState(CLINICAL_EXERCISES_CATALOG);
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Local patients with auto-fetch fallback
  const [localPatients, setLocalPatients] = useState(patients || []);

  useEffect(() => {
    if (patients && patients.length > 0) {
      setLocalPatients(patients);
    } else {
      patientApi.list({ per_page: 100 })
        .then((res) => {
          if (res?.data) setLocalPatients(res.data);
        })
        .catch((err) => console.warn('ExercisesBankView: unable to fetch patients fallback:', err));
    }
  }, [patients]);

  // Load from database API on mount
  useEffect(() => {
    let isMounted = true;
    const loadDynamicExercises = async () => {
      try {
        setLoadingExercises(true);
        const res = await exerciseApi.list();
        if (isMounted && res && res.exercises && res.exercises.length > 0) {
          const mapped = res.exercises.map((item) => ({
            ...item,
            id: item.exercise_code || item.id,
            instructions_for_patient: item.instructions || item.instructions_for_patient || [],
          }));
          setExercisesList(mapped);
        }
      } catch (err) {
        console.warn('Using local fallback catalog for exercises bank:', err);
      } finally {
        if (isMounted) setLoadingExercises(false);
      }
    };
    loadDynamicExercises();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filters & Search
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [exerciseForPrintSelect, setExerciseForPrintSelect] = useState(null);
  const [activePrintExercise, setActivePrintExercise] = useState(null);
  const [activePrintPatient, setActivePrintPatient] = useState(null);
  const [activePrintCustomNote, setActivePrintCustomNote] = useState('');
  const [activeAssignExercise, setActiveAssignExercise] = useState(null);
  const [activeLiveExercise, setActiveLiveExercise] = useState(null);

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return exercisesList.filter((ex) => {
      // Specialty
      if (selectedSpecialty !== 'all' && ex.specialty !== selectedSpecialty) return false;

      // Category
      if (selectedCategory !== 'all' && ex.category !== selectedCategory) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tAr = (ex.title_ar || '').toLowerCase();
        const tFr = (ex.title_fr || '').toLowerCase();
        const sum = (ex.summary || '').toLowerCase();
        const cat = (ex.category_label || '').toLowerCase();
        return tAr.includes(q) || tFr.includes(q) || sum.includes(q) || cat.includes(q);
      }

      return true;
    });
  }, [exercisesList, selectedSpecialty, selectedCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = exercisesList.length;
    const ortho = exercisesList.filter((e) => e.specialty === 'orthophony').length;
    const psych = exercisesList.filter((e) => e.specialty === 'psychology').length;
    const psychomot = exercisesList.filter((e) => e.specialty === 'psychomotricite').length;
    return { total, ortho, psych, psychomot };
  }, [exercisesList]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white flex items-center space-x-2 space-x-reverse">
                <span>بنك التمارين والكراسات التأهيلية والمنزلية</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  EHR Medical Grade 🇩🇿
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {tenant?.name || 'العيادة التخصصية'} • كراسات التدريب اليومي، أوراق العمل القابلة للطباعة A4، وتكليفات التمارين المنزلية المباشرة
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats badges */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono font-bold self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            الإجمالي: <span className="text-white">{stats.total}</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-teal-950/60 border border-teal-800/40 text-teal-300">
            تخاطب: {stats.ortho}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
            نفسي: {stats.psych}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-300">
            حركي: {stats.psychomot}
          </span>
        </div>
      </div>

      {/* Specialty Main Tabs */}
      <div className="glass-card rounded-2xl p-1.5 border border-slate-800 bg-slate-950/80 flex items-center space-x-1.5 space-x-reverse overflow-x-auto">
        {[
          { id: 'all', label: 'جميع التخصصات السريرية', icon: Sparkles },
          { id: 'orthophony', label: '🗣️ الأرطوفونيا والتخاطب (Orthophonie)', icon: Volume2 },
          { id: 'psychology', label: '🧠 علم النفس وعلاج CBT (Psychologie)', icon: Brain },
          { id: 'psychomotricite', label: '🏃 التأهيل النفسي الحركي (Psychomotricité)', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedSpecialty(tab.id);
                setSelectedCategory('all');
              }}
              className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 space-x-reverse shrink-0 ${
                selectedSpecialty === tab.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Category Filter Pills */}
      <div className="glass-card rounded-2xl p-3 border border-slate-800 bg-slate-900/70 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالصوت (الراء، السين...)، أو نوع التمرين..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mx-1" />
          {EXERCISE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises Cards Grid */}
      {filteredExercises.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 text-slate-400">
          <BookOpen className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
          <p className="font-bold text-white text-base">لا توجد تمارين مطابقة لمعايير البحث الحالية</p>
          <p className="text-xs text-slate-500 mt-1">جرّب تغيير كلمات البحث أو اختيار تخصص سريري آخر.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="glass-card rounded-3xl p-5 border border-slate-800/90 bg-slate-900/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-slate-950/40"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-black">
                    {exercise.badge}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1 space-x-reverse">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{exercise.estimated_duration}</span>
                  </span>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="text-sm font-black text-white leading-snug">
                    {exercise.title_ar}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                    {exercise.title_fr}
                  </p>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {exercise.summary}
                </p>

                {/* Target & Difficulty Info */}
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1.5 text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">الفئة المستهدفة:</span>
                    <span className="text-white font-medium">{exercise.target_group}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">مستوى الصعوبة:</span>
                    <span className="text-teal-400 font-bold">{exercise.difficulty}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                {/* Live In-Session Play */}
                <button
                  onClick={() => setActiveLiveExercise(exercise)}
                  className="p-2 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 transition-all flex items-center justify-center"
                  title="تشغيل التمرين اللحظي داخل الجلسة"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>

                {/* Print Worksheet A4 */}
                <button
                  onClick={() => setExerciseForPrintSelect(exercise)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center space-x-1.5 space-x-reverse shadow-sm hover:border-emerald-500/50"
                  title="تخصيص المريض ومعاينة وطباعة كراس التمرين A4"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>طباعة الكراس A4</span>
                </button>

                {/* WhatsApp Assignment */}
                <button
                  onClick={() => setActiveAssignExercise(exercise)}
                  className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/40 transition-all flex items-center justify-center"
                  title="تكليف المريض وإرسال التمرين عبر WhatsApp"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 0. SELECT PATIENT BEFORE PRINT MODAL (A4 PERSONALIZATION)                  */}
      {/* ========================================================================= */}
      {exerciseForPrintSelect && (
        <SelectPatientForPrintModal
          exercise={exerciseForPrintSelect}
          patients={localPatients}
          onProceed={(selectedPatient, customNote) => {
            const ex = exerciseForPrintSelect;
            setExerciseForPrintSelect(null);
            setActivePrintExercise(ex);
            setActivePrintPatient(selectedPatient);
            setActivePrintCustomNote(customNote || '');
          }}
          onClose={() => setExerciseForPrintSelect(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. PRINT WORKSHEET MODAL (A4 FORMAT)                                      */}
      {/* ========================================================================= */}
      {activePrintExercise && (
        <PrintWorksheetModal
          exercise={activePrintExercise}
          patient={activePrintPatient}
          customNote={activePrintCustomNote}
          patients={localPatients}
          onUpdatePatient={(p) => setActivePrintPatient(p)}
          tenant={tenant}
          onClose={() => {
            setActivePrintExercise(null);
            setActivePrintPatient(null);
            setActivePrintCustomNote('');
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. ASSIGN HOMEWORK & TELE-CARE VIA WHATSAPP & PORTAL                       */}
      {/* ========================================================================= */}
      {activeAssignExercise && (
        <FastHomeCareAssignModal
          isOpen={true}
          initialExercise={activeAssignExercise}
          patients={localPatients}
          onClose={() => setActiveAssignExercise(null)}
          onAssigned={() => {
            setActiveAssignExercise(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. LIVE IN-SESSION PRACTICE MODAL                                         */}
      {/* ========================================================================= */}
      {activeLiveExercise && (
        <LivePracticeModal
          exercise={activeLiveExercise}
          onClose={() => setActiveLiveExercise(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUBCOMPONENT 0: SELECT PATIENT BEFORE PRINT MODAL
// ---------------------------------------------------------------------------
function SelectPatientForPrintModal({ exercise, patients = [], onProceed, onClose }) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id ? String(patients[0].id) : '');
  const [customNote, setCustomNote] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => String(p.id) === String(selectedPatientId)) || null;
  }, [selectedPatientId, patients]);

  const patientName = selectedPatient ? getPatientDisplayName(selectedPatient) : '';
  const patientFileNumber = selectedPatient?.folder_number || selectedPatient?.file_number || (selectedPatient?.id ? `#${selectedPatient.id}` : '');
  const patientAge = selectedPatient ? getPatientDisplayAge(selectedPatient) : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-modal rounded-3xl w-full max-w-xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 my-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">تخصيص وطباعة كراس التمرين A4</h3>
              <p className="text-xs text-slate-400">
                اختر ملف المريض لتضمين بياناته الرسمية في الترويسة المطبوعة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Exercise Quick Pill */}
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white">{exercise.title_ar}</span>
            <span className="text-slate-500 font-mono text-[11px]">({exercise.specialty_label})</span>
          </div>
          <span className="text-teal-400 font-mono text-[11px] bg-teal-500/10 px-2 py-0.5 rounded-lg border border-teal-500/20">
            المدة: {exercise.estimated_duration}
          </span>
        </div>

        {/* Patient Selection using SearchablePatientSelect */}
        <div className="space-y-3">
          <SearchablePatientSelect
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={(pId) => setSelectedPatientId(pId)}
            label="1. اختر ملف المريض / الطفل المستهدف للطباعة:"
            placeholder="ابحث بالاسم، اللقب، رقم الهاتف، أو رقم الملف..."
            accentColor="emerald"
            maxHeight="max-h-48"
            showSelectedBadge={true}
          />

          {/* Selected Patient Live Preview Banner */}
          {selectedPatient ? (
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-600/40 text-xs text-emerald-300 space-y-1 animate-in fade-in duration-150">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center space-x-1.5 space-x-reverse text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>الترويسة المطبوعة ستتضمن:</span>
                </span>
                <span className="text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-300 font-mono">
                  ملف: {patientFileNumber}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/90 leading-relaxed pr-5">
                المريض: <strong className="text-white font-black">{patientName}</strong>
                {patientAge ? ` • السن: ${patientAge}` : ''}
                {` • تاريخ اليوم: ${new Date().toLocaleDateString('ar-DZ')}`}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2 space-x-reverse">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                لم يتم اختيار مريض بعد. يمكنك اختيار مريض من القائمة أعلاه أو الضغط على زر "طباعة كراس عام فارغ" في الأسفل.
              </span>
            </div>
          )}
        </div>

        {/* Custom Clinical Instruction / Note */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            2. توجيه أو ملاحظة علاجية خاصة للمريض في أسفل الكراس (اختياري) :
          </label>
          <textarea
            rows="2"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="مثال: يرجى التدريب أمام المرآة لمدة 10 دقائق صباحاً ومساءً مع تسجيل الملاحظات..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
          {/* Secondary Action: Print Blank/Generic Workbook */}
          <button
            onClick={() => onProceed(null, customNote)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 space-x-reverse"
            title="طباعة كراس عام فارغ بدون اسم مريض لكتابة البيانات باليد"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>طباعة كراس عام فارغ 📄</span>
          </button>

          <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              onClick={() => onProceed(selectedPatient, customNote)}
              disabled={!selectedPatient}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 space-x-reverse ${
                selectedPatient
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>
                {selectedPatient ? `معاينة وطباعة باسم ${patientName}` : 'اختر مريضاً للمتابعة'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUBCOMPONENT 1: PRINT WORKSHEET MODAL (A4 PRINTABLE)
// ---------------------------------------------------------------------------
function PrintWorksheetModal({
  exercise,
  patient = null,
  customNote = '',
  patients = [],
  onUpdatePatient,
  tenant,
  onClose
}) {
  const [showPatientPicker, setShowPatientPicker] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const scrollToTop = () => {
    const modalEl = document.getElementById('print-modal-container');
    if (modalEl) modalEl.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ws = exercise.worksheet_content || {};

  const patientName = patient ? getPatientDisplayName(patient) : '';
  const patientFileNumber = patient?.folder_number || patient?.file_number || (patient?.id ? `#${patient.id}` : '---');
  const patientAge = patient ? getPatientDisplayAge(patient) : null;
  const todayDate = new Date().toLocaleDateString('ar-DZ');

  return (
    <div
      id="print-modal-container"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Floating Quick Close Button (Top Left/Right viewport pinned) */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 left-4 sm:left-8 z-50 print:hidden px-3.5 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all duration-200 group flex items-center gap-2 text-xs font-bold active:scale-95"
        title="إغلاق المعاينة والرجوع للبنك (Esc)"
      >
        <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200 text-slate-300 group-hover:text-white" />
        <span className="hidden sm:inline">إغلاق المعاينة (Esc)</span>
      </button>

      <div className="relative w-full max-w-3xl my-4 sm:my-6" onClick={(e) => e.stopPropagation()}>
        {/* Sticky Top Control Bar (Hidden when printing) */}
        <div className="print:hidden sticky top-2 z-40 space-y-3 mb-4 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl px-5 py-3 shadow-2xl">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm font-bold text-white flex-wrap">
                  <span>كراس التمرين السريري والمنزلي (A4)</span>
                  {patient ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs flex items-center space-x-1 space-x-reverse">
                      <User className="w-3 h-3" />
                      <span>المريض: {patientName}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs">
                      كراس عام فارغ
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{exercise.title_ar}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              {/* Change / pick patient button */}
              <button
                onClick={() => setShowPatientPicker(!showPatientPicker)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center space-x-1.5 space-x-reverse transition-all"
                title="تغيير المريض أو اختيار مريض لهذا الكراس"
              >
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span>{patient ? 'تغيير المريض' : 'تخصيص لمريض'}</span>
              </button>

              {patient && (
                <button
                  onClick={() => onUpdatePatient && onUpdatePatient(null)}
                  className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-red-400 text-xs transition-all"
                  title="إلغاء التخصيص والعودة لكراس عام"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 space-x-reverse active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الكراس فوراً (Imprimer)</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/80 text-slate-400 hover:text-white transition-all"
                title="إغلاق المعاينة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible patient selector inside preview */}
          {showPatientPicker && (
            <div className="p-4 bg-slate-900/95 border border-emerald-500/30 rounded-2xl shadow-2xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                <span>تحديد ملف المريض لإدراجه في الترويسة المطبوعة:</span>
                <button
                  onClick={() => setShowPatientPicker(false)}
                  className="text-slate-500 hover:text-white text-xs"
                >
                  إخفاء ✕
                </button>
              </div>
              <SearchablePatientSelect
                patients={patients}
                selectedPatientId={patient?.id ? String(patient.id) : ''}
                onSelectPatient={(pId) => {
                  const p = patients.find((item) => String(item.id) === String(pId));
                  if (p && onUpdatePatient) {
                    onUpdatePatient(p);
                  }
                  setShowPatientPicker(false);
                }}
                label=""
                placeholder="ابحث بالاسم، اللقب، الهاتف، أو رقم الملف..."
                accentColor="emerald"
                maxHeight="max-h-40"
              />
            </div>
          )}
        </div>

        {/* Printable A4 Paper Container */}
        <div
          id="printable-exercise-worksheet"
          className="bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200 print:border-none print:shadow-none print:p-4 print:m-0 print:rounded-none print:w-full"
          dir="rtl"
        >
          {/* Clinic Official Header */}
          <div className="flex flex-row justify-between items-start border-b-2 border-emerald-700 pb-5 mb-5">
            <div>
              <span className="text-xl font-black text-emerald-900">
                {tenant?.name || 'العيادة التخصصية للطب النفسي والأرطوفونيا'}
              </span>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                وحدة التأهيل السريري والمتابعة المنزلية • Cahier d'Exercices Thérapeutiques
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {tenant?.phone ? `الهاتف: ${tenant.phone}` : ''} {tenant?.address ? `• العنوان: ${tenant.address}` : ''}
              </p>
            </div>

            <div className="text-left" dir="ltr">
              <div className="inline-block bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-emerald-900 font-bold text-xs">
                {exercise.specialty_label}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Réf: {exercise.id}
              </div>
            </div>
          </div>

          {/* Patient Official Header Box */}
          {patient ? (
            <div className="grid grid-cols-4 gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-300 mb-6 text-xs print:bg-slate-50 print:border-slate-300">
              <div>
                <span className="text-emerald-950/70 font-bold block text-[11px]">اسم الطفل / المريض:</span>
                <span className="font-black text-slate-950 text-sm">{patientName}</span>
              </div>
              <div>
                <span className="text-emerald-950/70 font-bold block text-[11px]">رقم الملف الطبي:</span>
                <span className="font-bold font-mono text-emerald-900">{patientFileNumber}</span>
              </div>
              <div>
                <span className="text-emerald-950/70 font-bold block text-[11px]">السن / الفئة المستهدفة:</span>
                <span className="font-bold text-slate-800">{patientAge || exercise.target_group}</span>
              </div>
              <div>
                <span className="text-emerald-950/70 font-bold block text-[11px]">تاريخ التدريب:</span>
                <span className="font-mono font-bold text-slate-900">{todayDate}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-xs">
              <div>
                <span className="text-slate-500 font-bold block text-[11px]">اسم الطفل / المريض:</span>
                <span className="font-bold text-slate-800">......................................................</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[11px]">تاريخ التدريب:</span>
                <span className="font-mono text-slate-800">{todayDate}</span>
              </div>
              <div className="text-left" dir="ltr">
                <span className="text-slate-500 font-bold block text-[11px]">Durée quotidienne:</span>
                <span className="font-bold text-emerald-800">{exercise.estimated_duration}</span>
              </div>
            </div>
          )}

          {/* Exercise Title */}
          <div className="mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900">{exercise.title_ar}</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">{exercise.title_fr}</p>
          </div>

          {/* Patient Step-by-Step Instructions */}
          <div className="mb-6 space-y-2">
            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide">
              📋 خطوات وتوجيهات التطبيق (Instructions pratiques) :
            </h4>
            <div className="space-y-1.5 pr-2">
              {exercise.instructions_for_patient.map((step, idx) => (
                <p key={idx} className="text-xs text-slate-800 leading-relaxed">
                  {step}
                </p>
              ))}
            </div>
          </div>

          {/* Specific Worksheet Content (Tables/Cards) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 space-y-4">
            <h4 className="text-xs font-black text-slate-800">
              🎯 جدول التدريب والمفردات المستهدفة :
            </h4>

            {/* Words list if present */}
            {ws.words_initial && (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-emerald-800 block text-[11px] mb-1">1. أصوات ومقاطع البداية:</span>
                  <div className="flex flex-wrap gap-2">
                    {ws.words_initial.map((w, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-slate-300 rounded-lg font-bold text-sm">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-emerald-800 block text-[11px] mb-1">2. أصوات ومقاطع الوسط والنهاية:</span>
                  <div className="flex flex-wrap gap-2">
                    {[...(ws.words_medial || []), ...(ws.words_final || [])].map((w, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-slate-300 rounded-lg font-bold text-sm">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>

                {ws.sentences && (
                  <div className="pt-2">
                    <span className="font-bold text-emerald-800 block text-[11px] mb-1">3. الجمل السياقية:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-800">
                      {ws.sentences.map((s, i) => (
                        <li key={i} className="font-medium text-xs">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Praxies movements if present */}
            {ws.movements && (
              <div className="space-y-2">
                {ws.movements.map((m, i) => (
                  <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900">{m.name}</span>
                    <span className="text-emerald-700 font-mono font-bold">{m.reps}</span>
                    <span className="text-slate-500 text-[11px]">{m.focus}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CBT Columns if present */}
            {ws.columns && (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-1 text-[10px] font-bold text-center bg-emerald-100 p-2 rounded-lg text-emerald-950">
                  {ws.columns.map((c, i) => (
                    <div key={i}>{c}</div>
                  ))}
                </div>
                {/* 3 Empty Lines for Patient to Fill */}
                {[1, 2, 3].map((row) => (
                  <div key={row} className="grid grid-cols-5 gap-1 h-14 bg-white border border-slate-200 rounded-lg p-1">
                    <div className="border-r border-slate-100"></div>
                    <div className="border-r border-slate-100"></div>
                    <div className="border-r border-slate-100"></div>
                    <div className="border-r border-slate-100"></div>
                    <div></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Practice Checkbox Table */}
          <div className="mb-6">
            <h4 className="text-xs font-black text-slate-800 mb-2">
              📅 جدول متابعة الممارسة اليومية (لولي الأمر / المريض) :
            </h4>
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day, i) => (
                <div key={i} className="p-2 border border-slate-300 rounded-xl bg-slate-50">
                  <span className="font-bold text-[11px] text-slate-700 block mb-1.5">{day}</span>
                  <div className="w-5 h-5 border-2 border-slate-400 rounded-md mx-auto"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Stamp & Advice Footer */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
            <div className="text-slate-600">
              <span className="font-bold text-slate-800 block mb-1">إرشاد الأخصائي المعالج:</span>
              <div className="text-[11px] leading-relaxed text-slate-700 space-y-1">
                {customNote ? (
                  <div className="font-semibold text-emerald-950 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    💡 <span className="font-bold">توجيه خاص للمريض:</span> {customNote}
                  </div>
                ) : null}
                <p className="text-slate-500">{exercise.homework_tips}</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-2xl min-h-[90px] text-center">
              <span className="text-[11px] font-bold text-slate-400 mb-6">ختم وتوقيع المعالج</span>
              <div className="w-24 border-b border-slate-400"></div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar (Hidden when printing) */}
        <div className="print:hidden mt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>إغلاق المعاينة والرجوع للبنك</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={scrollToTop}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
              title="الصعود لأعلى الكراس"
            >
              <span>↑ لأعلى</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكراس الآن (A4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUBCOMPONENT 2: ASSIGN EXERCISE MODAL (WHATSAPP SENDER)
// ---------------------------------------------------------------------------
function AssignExerciseModal({ exercise, patients, tenant, onClose }) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [customNote, setCustomNote] = useState('');
  const [sendingCloud, setSendingCloud] = useState(false);
  const [cloudSuccess, setCloudSuccess] = useState(false);
  const [cloudError, setCloudError] = useState(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const selectedPatient = patients.find((p) => p.id === Number(selectedPatientId)) || patients[0];

  const getExerciseMessage = () => {
    const patientName = selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : 'ولي الأمر المحترم';
    const clinicTitle = tenant?.name || 'العيادة التخصصية';

    return `السلام عليكم ورحمة الله وبركاته،
تحية طيبة من *${clinicTitle}* 🏥

إليكم تمرين التدريب المنزلي المخصص لـ *${patientName}*:
📘 *عنوان التمرين:* ${exercise.title_ar}
⏱️ *المدة المقترحة:* ${exercise.estimated_duration}
🎯 *الهدف السريري:* ${exercise.summary}

📝 *الخطوات المطلوبة للتدريب اليومي:*
${exercise.instructions_for_patient.slice(0, 3).join('\n')}
${customNote ? `\n💡 *ملاحظة خاصة من المعالج:* ${customNote}` : ''}

نثمن التزامكم ومتابعتكم المستمرة لتعزيز التطور الإيجابي 🌸`;
  };

  const handleSendCloudWhatsApp = async () => {
    if (!selectedPatient?.phone) {
      setCloudError('المريض المحدد لا يملك رقم هاتف مسجل.');
      return;
    }
    setSendingCloud(true);
    setCloudError(null);
    setCloudSuccess(false);
    try {
      const msg = getExerciseMessage();
      const res = await whatsappApi.sendMessage({
        phone: selectedPatient.phone,
        message: msg,
        patient_id: selectedPatient.id,
        service_type: 'homework_exercise',
      });
      if (res.success) {
        setCloudSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        setCloudError(res.message || 'تعذر الإرسال السحابي.');
      }
    } catch (err) {
      setCloudError(err.message || 'فشل الاتصال بخادم واتساب.');
    } finally {
      setSendingCloud(false);
    }
  };

  const handleSendManualWhatsApp = () => {
    const phone = (selectedPatient?.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? `213${phone.substring(1)}` : phone;
    const msg = getExerciseMessage();
    const encoded = encodeURIComponent(msg);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-modal rounded-3xl w-full max-w-lg bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">تكليف المريض بالتمرين عبر WhatsApp</h3>
              <p className="text-xs text-slate-400">{exercise.title_ar}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <SearchablePatientSelect
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={(pId) => setSelectedPatientId(pId)}
            label="اختر المريض المستفيد:"
            placeholder="ابحث بالاسم، اللقب، رقم الهاتف، أو رقم الملف..."
            accentColor="emerald"
            maxHeight="max-h-44"
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              ملاحظة أو توجيه إضافي لولي الأمر (اختياري)
            </label>
            <textarea
              rows="3"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="مثال: التركيز على الهدوء أثناء النطق، تكرار التمرين مرتين يومياً..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {cloudSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>تم إرسال التمرين بنجاح إلى واتساب المريض! 📲✨</span>
            </div>
          )}

          {cloudError && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in">
              <span>{cloudError}</span>
              <button type="button" onClick={handleSendManualWhatsApp} className="text-emerald-400 hover:underline text-[11px] shrink-0">
                فتح الرابط اليدوي ↗
              </button>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            يمكنك الإرسال التلقائي المباشر عبر السحابة أو فتح المحادثة اليدوية عبر WhatsApp Web/تطبيق الهاتف.
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            إلغاء
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendManualWhatsApp}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>يدوي</span>
            </button>
            <button
              type="button"
              onClick={handleSendCloudWhatsApp}
              disabled={sendingCloud || !selectedPatient?.phone}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {sendingCloud ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{sendingCloud ? 'جاري الإرسال...' : 'إرسال فوري إلى واتساب (Cloud API) ⚡'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUBCOMPONENT 3: LIVE PRACTICE IN-SESSION MODAL (STOPWATCH & STEPS)
// ---------------------------------------------------------------------------
function LivePracticeModal({ exercise, onClose }) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggleStep = (idx) => {
    if (completedSteps.includes(idx)) {
      setCompletedSteps(completedSteps.filter((s) => s !== idx));
    } else {
      setCompletedSteps([...completedSteps, idx]);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-modal rounded-3xl w-full max-w-xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">تطبيق التمرين اللحظي في الجلسة</h3>
              <p className="text-xs text-slate-400">{exercise.title_ar}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stopwatch Pulse Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">ميقاتية التمرين الحية</span>
            <span className="text-2xl font-black font-mono text-emerald-400 tracking-wider">
              {formatTimer(seconds)}
            </span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              }`}
            >
              {isActive ? 'إيقاف مؤقت ⏸️' : 'بدء التمرين ▶️'}
            </button>
            <button
              onClick={() => {
                setIsActive(false);
                setSeconds(0);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold"
            >
              تصفير
            </button>
          </div>
        </div>

        {/* Steps to follow */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-300 block">
            مراحل وخطوات التطبيق السريري :
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {exercise.instructions_for_patient.map((step, idx) => (
              <div
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start space-x-2.5 space-x-reverse ${
                  completedSteps.includes(idx)
                    ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    completedSteps.includes(idx)
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-slate-700'
                  }`}
                >
                  {completedSteps.includes(idx) && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            إنهاء وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
