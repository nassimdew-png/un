import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Activity,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Sparkles,
  HelpCircle,
  Clock,
  Play,
  Square,
  RotateCcw,
  Save,
  Check,
  Award,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ArrowRight,
  Layers,
  Compass,
  Zap,
  Search,
  Users,
  ChevronDown,
} from 'lucide-react';
import InteractiveBodyMapSvg from './InteractiveBodyMapSvg';
import {
  TONUS_STATES,
  SENSORY_STATES,
  ANATOMICAL_ZONES,
  STATIC_BALANCE_TESTS,
  DYNAMIC_BALANCE_TESTS,
  LATERALIZATION_ITEMS,
  VISUO_MOTOR_TESTS,
  SPATIAL_TEMPORAL_TESTS,
  calculateBodyMapStats,
  determineLateralizationProfile,
  generatePsychomotorSoapSummary,
} from './PsychomotorData';
import { apiRequest } from '../../api';

export default function PsychomotorBodyMapModal({
  isOpen,
  onClose,
  patient: initialPatient,
  patients = [],
  appointmentId = null,
  onSaved = null,
  onInjectSoap = null,
  initialTab = 'body_map',
}) {
  if (!isOpen) return null;

  // Active Patient & Patient Switcher State
  const [currentPatient, setCurrentPatient] = useState(initialPatient || (patients.length > 0 ? patients[0] : null));
  const [isPatientSwitcherOpen, setIsPatientSwitcherOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const patientSwitcherRef = useRef(null);

  useEffect(() => {
    if (initialPatient) setCurrentPatient(initialPatient);
  }, [initialPatient]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (patientSwitcherRef.current && !patientSwitcherRef.current.contains(event.target)) {
        setIsPatientSwitcherOpen(false);
      }
    }
    if (isPatientSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPatientSwitcherOpen]);

  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return patients;
    const q = patientSearchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const name = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
      const phone = (p.phone || p.parent_phone || '').toLowerCase();
      const folder = (p.folder_number || p.file_number || '').toLowerCase();
      const idStr = String(p.id);
      return name.includes(q) || phone.includes(q) || folder.includes(q) || idStr.includes(q);
    });
  }, [patients, patientSearchQuery]);

  // Algeria Timezone Helpers (UTC+1 without UTC day-slippage)
  const getAlgeriaDateStr = () => {
    try {
      return new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'Africa/Algiers',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const getAlgeriaArabicDateStr = () => {
    try {
      return new Intl.DateTimeFormat('ar-DZ', {
        timeZone: 'Africa/Algiers',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date());
    } catch {
      return new Date().toLocaleDateString('ar-DZ');
    }
  };

  const formatPatientAge = (p) => {
    if (p?.age && Number(p.age) > 0) return `${p.age} سنة`;
    if (p?.birth_date) {
      const birth = new Date(p.birth_date);
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        if (age >= 0) return `${age} سنة`;
      }
    }
    return 'غير مسجل في الملف';
  };

  // Active Main Tab: 'body_map' | 'balance' | 'lateralization' | 'report'
  const [activeMainTab, setActiveMainTab] = useState(initialTab || 'body_map');

  useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);

  // 1. Body Map State: { [zoneId]: { tonus, sensory, severity, notes } }
  const [bodyMapState, setBodyMapState] = useState({});
  const [selectedZoneId, setSelectedZoneId] = useState('head_anterior');
  const [activeView, setActiveView] = useState('anterior');

  // 2. Balance Battery State
  const [balanceState, setBalanceState] = useState({
    romberg_eyes_open: 'stable',
    romberg_eyes_closed: 'negative',
    flamingo_right_sec: 0,
    flamingo_left_sec: 0,
    tandem_gait: 'perfect',
    unipedal_hopping: 'bilateral_good',
    obstacle_stepping: 'adapted',
  });

  // Stopwatch for Flamingo Test
  const [stopwatchTarget, setStopwatchTarget] = useState('flamingo_right_sec'); // 'flamingo_right_sec' | 'flamingo_left_sec'
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // 3. Lateralization Battery State
  const [lateralizationState, setLateralizationState] = useState({
    hand_writing: 'right',
    hand_scissors: 'right',
    hand_throw: 'right',
    eye_monocular: 'right',
    eye_peep_hole: 'right',
    foot_kick: 'right',
    foot_stairs: 'right',
  });

  // 4. Visuo-Motor & Coordination State
  const [visuoMotorState, setVisuoMotorState] = useState({
    diadochokinesia: 'fluid',
    finger_nose: 'precise',
    pencil_grasp: 'dynamic_tripod',
  });

  // 5. Spatial-Temporal Organization State
  const [spatialTemporalState, setSpatialTemporalState] = useState({
    piaget_head_self: 'mastered',
    piaget_head_examiner: 'decentered',
    stambak_rhythms: 'perfect_tempo',
  });

  // 6. Clinical Synthesis & Goals
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [therapeuticGoals, setTherapeuticGoals] = useState([
    'تنمية الوعي بالمخطط الجسمي والتمايز الحركي للطرفين',
    'تعزيز التوازن الاستاتيكي والديناميكي وتناسق الخطوة',
    'تثبيت الجانبية الوظيفية وضبط قبضة القلم ثلاثية الأصابع',
  ]);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing latest assessment if available
  useEffect(() => {
    if (patient?.id) {
      loadLatestAssessment();
    }
  }, [patient?.id]);

  const loadLatestAssessment = async () => {
    try {
      const res = await apiRequest(`/patients/${patient.id}/psychomotor-assessments/latest`);
      if (res && res.success && res.data) {
        const d = res.data;
        if (d.body_map_data) setBodyMapState(d.body_map_data);
        if (d.balance_battery) setBalanceState((prev) => ({ ...prev, ...d.balance_battery }));
        if (d.lateralization) setLateralizationState((prev) => ({ ...prev, ...d.lateralization }));
        if (d.visuo_motor) setVisuoMotorState((prev) => ({ ...prev, ...d.visuo_motor }));
        if (d.spatial_temporal) setSpatialTemporalState((prev) => ({ ...prev, ...d.spatial_temporal }));
        if (d.clinical_summary) setClinicalSummary(d.clinical_summary);
        if (d.therapeutic_goals && Array.isArray(d.therapeutic_goals)) setTherapeuticGoals(d.therapeutic_goals);
      }
    } catch (err) {
      console.warn('No existing psychomotor assessment found or error loading:', err);
    }
  };

  // Stopwatch effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setBalanceState((prev) => ({
          ...prev,
          [stopwatchTarget]: (prev[stopwatchTarget] || 0) + 1,
        }));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, stopwatchTarget]);

  // Derived Stats
  const bodyMapStats = useMemo(() => calculateBodyMapStats(bodyMapState), [bodyMapState]);
  const lateralProfile = useMemo(() => determineLateralizationProfile(lateralizationState), [lateralizationState]);

  // Selected Zone Details
  const selectedZone = useMemo(
    () => ANATOMICAL_ZONES.find((z) => z.id === selectedZoneId) || ANATOMICAL_ZONES[0],
    [selectedZoneId]
  );
  const selectedZoneData = bodyMapState[selectedZoneId] || {
    tonus: 'eutonie',
    sensory: 'normosensible',
    severity: 'mild',
    notes: '',
  };

  // Zone Update Handler
  const handleUpdateZone = (field, value) => {
    setBodyMapState((prev) => ({
      ...prev,
      [selectedZoneId]: {
        ...(prev[selectedZoneId] || {
          tonus: 'eutonie',
          sensory: 'normosensible',
          severity: 'mild',
          notes: '',
        }),
        [field]: value,
      },
    }));
  };

  // Bilateral Application (e.g. shoulder right -> shoulder left)
  const handleApplyBilateral = () => {
    if (!selectedZone) return;
    const isRight = selectedZone.id.includes('right');
    const isLeft = selectedZone.id.includes('left');
    if (!isRight && !isLeft) return;

    const counterId = isRight
      ? selectedZone.id.replace('right', 'left')
      : selectedZone.id.replace('left', 'right');

    setBodyMapState((prev) => ({
      ...prev,
      [counterId]: {
        ...(prev[selectedZoneId] || {}),
      },
    }));
  };

  // Reset All Zones to Eutonie
  const handleResetAllZones = () => {
    if (window.confirm('هل تريد إعادة تعيين كافة المناطق إلى النغمة السوية (Eutonie)؟')) {
      setBodyMapState({});
    }
  };

  // Feedback banner state for SOAP injection
  const [soapFeedback, setSoapFeedback] = useState(null);

  // Save to Backend
  const handleSaveAssessment = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const payload = {
      appointment_id: appointmentId,
      assessment_date: getAlgeriaDateStr(),
      body_map_data: bodyMapState,
      balance_battery: balanceState,
      lateralization: lateralizationState,
      visuo_motor: visuoMotorState,
      spatial_temporal: spatialTemporalState,
      body_map_stats: bodyMapStats,
      lateral_profile: lateralProfile,
      clinical_summary: clinicalSummary,
      therapeutic_goals: therapeuticGoals,
    };

    if (!currentPatient?.id) {
      alert('يرجى اختيار مريض لحفظ الفحص الحركي');
      return;
    }

    try {
      const res = await apiRequest(`/patients/${currentPatient.id}/psychomotor-assessments`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && res.success) {
        setSaveSuccess(true);
        if (onSaved) onSaved(res.data);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving psychomotor assessment:', err);
      alert('حدث خطأ أثناء حفظ التقييم: ' + (err.message || 'يرجى المحاولة مجدداً'));
    } finally {
      setIsSaving(false);
    }
  };

  // Inject into SOAP (Active Session or Standalone Clipboard)
  const handleTriggerSoapInjection = () => {
    const balanceDesc = `رومبرغ مفتوح: ${balanceState.romberg_eyes_open}، مغلق: ${balanceState.romberg_eyes_closed} | الوقوف بقدم واحدة (Flamant): يمين ${balanceState.flamingo_right_sec}ث، يسار ${balanceState.flamingo_left_sec}ث | مشي ترادفي: ${balanceState.tandem_gait}`;
    const soapData = generatePsychomotorSoapSummary({
      bodyMapStats,
      lateralProfile,
      balanceSummary: balanceDesc,
      patientName: `${currentPatient?.first_name || ''} ${currentPatient?.last_name || ''}`.trim(),
    });

    if (onInjectSoap) {
      onInjectSoap(soapData);
      setSoapFeedback({
        type: 'success',
        text: 'تم حقن فحص خريطة الجسد والتأهيل الحركي بنجاح في حقول الـ SOAP للجلسة السريرية النشطة! 🚀',
      });
    } else {
      // In standalone module mode, copy formatted clinical summary to clipboard
      const plainTextSoap = typeof soapData === 'string'
        ? soapData
        : `[فحص خريطة الجسد والتأهيل الحركي الحسي]\n` +
          `الهدف والملاحظة السريرية (Objective):\n${soapData.objective || ''}\n\n` +
          `التقييم والتحليل الحركي (Assessment):\n${soapData.assessment || ''}\n\n` +
          `الخطة التأهيلية المقترحة (Plan):\n${soapData.plan || ''}`;

      try {
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(plainTextSoap);
        }
        setSoapFeedback({
          type: 'copied',
          text: 'تم توليد ملخص SOAP السريري ونسخه إلى الحافظة بنجاح! يمكنك لصقه مباشرة في أي جلسة أو تقرير. 📋',
        });
      } catch (e) {
        setSoapFeedback({
          type: 'copied',
          text: 'تم توليد ملخص SOAP السريري بنجاح! 📋',
        });
      }
    }

    setTimeout(() => {
      setSoapFeedback(null);
    }, 4500);
  };

  // Add Goal
  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoalInput.trim()) return;
    setTherapeuticGoals([...therapeuticGoals, newGoalInput.trim()]);
    setNewGoalInput('');
  };

  const handleRemoveGoal = (index) => {
    setTherapeuticGoals(therapeuticGoals.filter((_, i) => i !== index));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-emerald-500/40 w-full max-w-6xl max-h-[96vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* ========================================================================= */}
        {/* 1. TOP HEADER & METADATA BAR                                              */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-slate-950 via-slate-900 to-emerald-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h3 className="text-base sm:text-lg font-black text-white">
                  خريطة الجسد والفحص الحركي الحسي التفاعلي (PsyPro Psychomotor Suite)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  التأهيل الحركي 🏃
                </span>
              </div>
              
              {/* Patient Badge with Searchable Switcher */}
              <div className="relative mt-1" ref={patientSwitcherRef}>
                <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                  <div
                    onClick={() => patients.length > 0 && setIsPatientSwitcherOpen(prev => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl border text-xs font-bold transition-all ${
                      patients.length > 0
                        ? 'bg-slate-950/80 hover:bg-slate-800 border-slate-700/80 cursor-pointer text-slate-200 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>المريض: <strong className="text-emerald-300">{currentPatient ? `${currentPatient.first_name} ${currentPatient.last_name}` : 'فحص حركي مباشر'}</strong></span>
                    {currentPatient && (
                      <span className="text-[10px] text-emerald-400/80 font-mono font-normal">({formatPatientAge(currentPatient)})</span>
                    )}
                    {currentPatient?.folder_number && (
                      <span className="text-[10px] text-slate-400 font-mono font-normal">({currentPatient.folder_number})</span>
                    )}
                    {patients.length > 0 && (
                      <span className="text-[10px] text-teal-400 font-normal mr-1 flex items-center gap-0.5">
                        <Search className="w-2.5 h-2.5" />
                        <span>(تغيير)</span>
                      </span>
                    )}
                  </div>
                  <span>— تقييم النغمة العضلية، التوازن، الجانبية، والتنظيم المكاني</span>
                </div>

                {/* Patient Switcher Dropdown */}
                {isPatientSwitcherOpen && patients.length > 0 && (
                  <div className="absolute z-50 mt-1 right-0 w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2.5 space-y-2 backdrop-blur-xl animate-in fade-in">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={patientSearchQuery}
                        onChange={(e) => setPatientSearchQuery(e.target.value)}
                        placeholder="ابحث بالاسم، رقم الملف، الهاتف..."
                        className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-emerald-500 focus:outline-none transition-all shadow-inner"
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

                    <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                      {filteredPatients.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-xs">
                          لا يوجد مريض مطابق لـ "{patientSearchQuery}"
                        </div>
                      ) : (
                        filteredPatients.map((p) => {
                          const isSelected = currentPatient?.id === p.id;
                          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || `مريض #${p.id}`;
                          const folder = p.folder_number || p.file_number || `#${p.id}`;
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setCurrentPatient(p);
                                setIsPatientSwitcherOpen(false);
                                setPatientSearchQuery('');
                              }}
                              className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs border ${
                                isSelected
                                  ? 'bg-emerald-600/20 border-emerald-500/50 text-white font-bold'
                                  : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/80 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {(name[0] || 'م')}
                                </div>
                                <div className="truncate">
                                  <div className="truncate">{name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">ملف: {folder}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerSoapInjection}
              className="px-3.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all shadow-sm"
              title="حقن الملخص السريري فوراً في خانات SOAP"
            >
              <FileText className="w-4 h-4" />
              <span>إدراج في SOAP</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAssessment}
              disabled={isSaving}
              className={`px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all shadow-lg ${
                saveSuccess
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25'
              }`}
            >
              {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'جارٍ الحفظ...' : saveSuccess ? 'تم الحفظ بنجاح!' : 'حفظ الفحص 💾'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SOAP Feedback Notification Toast Banner */}
        {soapFeedback && (
          <div className="mx-4 sm:mx-6 my-2 p-3.5 rounded-2xl bg-gradient-to-l from-teal-950 via-slate-900 to-emerald-950 border border-teal-500/50 flex items-center justify-between text-xs text-white shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center space-x-2 space-x-reverse font-bold text-teal-300">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0 animate-bounce" />
              <span>{soapFeedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setSoapFeedback(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. NAVIGATION TABS (4 CLINICAL PILLARS)                                    */}
        {/* ========================================================================= */}
        <div className="flex items-center px-4 sm:px-6 bg-slate-950 border-b border-slate-800 gap-2 overflow-x-auto">
          {[
            { id: 'body_map', label: '1. خريطة الجسد والنغمة العضلية', icon: Activity, count: bodyMapStats.abnormalTonusCount },
            { id: 'balance', label: '2. مصفوفة فحص التوازن والثبات', icon: Zap },
            { id: 'lateralization', label: '3. الجانبية والتنظيم المكاني', icon: Compass, badge: lateralProfile.profileLabelAr.split(' ')[0] },
            { id: 'report', label: '4. التقرير الطبي والحصيلة A4', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMainTab(tab.id)}
                className={`py-3 px-4 font-bold text-xs border-b-2 whitespace-nowrap flex items-center space-x-2 space-x-reverse transition-all ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono font-black">
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-teal-500/20 text-teal-300 font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 3. MAIN WORKSPACE CONTENT AREA                                            */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: SENSORY & TONUS BODY MAP */}
          {activeMainTab === 'body_map' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
              {/* Left Column: Interactive Human Body SVG */}
              <div className="lg:col-span-6 flex flex-col">
                <InteractiveBodyMapSvg
                  bodyMapState={bodyMapState}
                  selectedZoneId={selectedZoneId}
                  onSelectZone={(zoneId) => {
                    setSelectedZoneId(zoneId);
                    // Also auto toggle view if user clicks a posterior zone
                    const zoneObj = ANATOMICAL_ZONES.find((z) => z.id === zoneId);
                    if (zoneObj) setActiveView(zoneObj.view);
                  }}
                  activeView={activeView}
                  onChangeView={setActiveView}
                />

                {/* Quick Presets Bar */}
                <div className="mt-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-semibold">إجراءات سريعة للخريطة:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApplyBilateral}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-bold transition"
                    >
                      تطبيق على الطرف المقابل ↔️
                    </button>
                    <button
                      type="button"
                      onClick={handleResetAllZones}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] font-bold transition"
                    >
                      إعادة ضبط 🔄
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Zone Clinical Inspector */}
              <div className="lg:col-span-6 space-y-4">
                {/* Active Zone Card */}
                <div className="p-5 rounded-3xl bg-slate-950 border border-emerald-500/30 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <h4 className="text-base font-black text-white">{selectedZone.labelAr}</h4>
                      </div>
                      <span className="text-xs text-slate-400 font-mono block mt-0.5">{selectedZone.labelFr}</span>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-mono text-emerald-400 font-bold">
                      {selectedZone.category.toUpperCase()}
                    </span>
                  </div>

                  {/* 1. Muscle Tonus Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-300 block">
                      1. النغمة العضلية للمنطقة (Tonus Musculaire):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.values(TONUS_STATES).map((t) => {
                        const isSelected = selectedZoneData.tonus === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleUpdateZone('tonus', t.id)}
                            className={`p-2.5 rounded-2xl text-right border transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'bg-slate-900 border-2'
                                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                            style={{
                              borderColor: isSelected ? t.color : undefined,
                            }}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span
                                className="text-xs font-black"
                                style={{ color: isSelected ? t.color : '#e2e8f0' }}
                              >
                                {t.labelAr}
                              </span>
                              {isSelected && (
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: t.color }}
                                />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                              {t.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Sensory & Tactile Selector */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-black text-slate-300 block">
                      2. التكامل الحسي اللمسي (Intégration Sensorielle & Tactile):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(SENSORY_STATES).map((s) => {
                        const isSelected = selectedZoneData.sensory === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleUpdateZone('sensory', s.id)}
                            className={`p-2 rounded-xl text-right border transition-all text-xs font-bold ${
                              isSelected
                                ? 'bg-slate-900 border-2 shadow-sm'
                                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                            style={{
                              borderColor: isSelected ? s.color : undefined,
                              color: isSelected ? s.color : undefined,
                            }}
                          >
                            {s.labelAr}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Clinical Observation / Specific Notes */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-bold text-slate-300 block">
                      3. ملاحظات سريرية دقيقة حول المنطقة:
                    </label>
                    <input
                      type="text"
                      value={selectedZoneData.notes || ''}
                      onChange={(e) => handleUpdateZone('notes', e.target.value)}
                      placeholder="مثال: مقاومة تشنجية تزداد عند المحاولات المتكررة..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live Body Map Clinical Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30">
                    <span className="text-[10px] text-amber-400 font-bold block">فرط توتر (Hyper)</span>
                    <span className="text-2xl font-black text-white font-mono">{bodyMapStats.hypertonieCount}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-cyan-500/30">
                    <span className="text-[10px] text-cyan-400 font-bold block">رخاوة (Hypo)</span>
                    <span className="text-2xl font-black text-white font-mono">{bodyMapStats.hypotonieCount}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-rose-500/30">
                    <span className="text-[10px] text-rose-400 font-bold block">دفاع لمسي</span>
                    <span className="text-2xl font-black text-white font-mono">{bodyMapStats.hypersensibleCount}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 font-bold block">بحث حسي</span>
                    <span className="text-2xl font-black text-white font-mono">{bodyMapStats.hyposensibleCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BALANCE & MOTOR COORDINATION BATTERY */}
          {activeMainTab === 'balance' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Top Banner with Stopwatch Tool */}
              <div className="p-5 rounded-3xl bg-gradient-to-l from-emerald-950/40 via-slate-950 to-teal-950/40 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>ميقاتية التوازن الحي (Stopwatch للأرجل الفردية):</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    استخدم المؤقت لقياس ثواني الوقوف على الساق الواحدة بدقة (Flamant Rose)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStopwatchTarget('flamingo_right_sec')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        stopwatchTarget === 'flamingo_right_sec'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ساق يمنى ({balanceState.flamingo_right_sec}ث)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStopwatchTarget('flamingo_left_sec')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        stopwatchTarget === 'flamingo_left_sec'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ساق يسرى ({balanceState.flamingo_left_sec}ث)
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 space-x-reverse shadow-md transition ${
                        isTimerRunning ? 'bg-rose-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isTimerRunning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isTimerRunning ? 'إيقاف' : 'بدء'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsTimerRunning(false);
                        setBalanceState((p) => ({ ...p, [stopwatchTarget]: 0 }));
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Static Balance Grid */}
              <div className="space-y-3">
                <span className="text-xs font-black text-emerald-300 uppercase tracking-wider block">
                  أ. اختبارات التوازن الثابت (Équilibre Statique):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STATIC_BALANCE_TESTS.filter((t) => !t.hasStopwatch).map((test) => (
                    <div key={test.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                      <div>
                        <span className="text-xs font-bold text-white block">{test.titleAr}</span>
                        <span className="text-[10px] text-slate-400">{test.instructions}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {test.options.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setBalanceState({ ...balanceState, [test.id]: opt.id })}
                            className={`p-2 rounded-xl text-[11px] font-bold text-center border transition-all ${
                              balanceState[test.id] === opt.id
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {opt.labelAr}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Balance Grid */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-black text-teal-300 uppercase tracking-wider block">
                  ب. اختبارات التوازن الحركي والديناميكي (Équilibre Dynamique):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {DYNAMIC_BALANCE_TESTS.map((test) => (
                    <div key={test.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                      <div>
                        <span className="text-xs font-bold text-white block">{test.titleAr}</span>
                        <span className="text-[10px] text-slate-400">{test.instructions}</span>
                      </div>
                      <div className="space-y-1">
                        {test.options.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setBalanceState({ ...balanceState, [test.id]: opt.id })}
                            className={`w-full p-2 rounded-xl text-[11px] font-bold text-right border transition-all ${
                              balanceState[test.id] === opt.id
                                ? 'bg-teal-600 text-white border-teal-400'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {opt.labelAr}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LATERALIZATION & SPATIAL-TEMPORAL */}
          {activeMainTab === 'lateralization' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Profile Diagnosis Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-l from-indigo-950/40 via-slate-950 to-purple-950/40 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-indigo-400 block">التشخيص الآلي للجانبية:</span>
                  <div className="text-lg font-black text-white mt-0.5">{lateralProfile.profileLabelAr}</div>
                  <p className="text-xs text-slate-400 mt-1">
                    اليد المهيمنة: <span className="text-indigo-300 font-bold">{lateralProfile.dominantHand === 'right' ? 'يمنى' : 'يسرى'}</span> |
                    العين المهيمنة: <span className="text-purple-300 font-bold">{lateralProfile.dominantEye === 'right' ? 'يمنى' : 'يسرى'}</span> |
                    القدم المهيمنة: <span className="text-teal-300 font-bold">{lateralProfile.dominantFoot === 'right' ? 'يمنى' : 'يسرى'}</span>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">مؤشر التجانس</span>
                  <span className="text-sm font-black text-indigo-300">
                    {lateralProfile.profileType === 'crossed'
                      ? 'متصالبة ⚠️'
                      : lateralProfile.profileType === 'homogeneous_right'
                      ? 'متجانسة يمنى ✅'
                      : 'متجانسة يسرى ✅'}
                  </span>
                </div>
              </div>

              {/* Lateralization Battery Items */}
              <div className="space-y-3">
                <span className="text-xs font-black text-indigo-300 uppercase tracking-wider block">
                  أ. بنود اختبار الهيمنة الجانبية (Test de Harris & Zazzo):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {LATERALIZATION_ITEMS.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-white block">{item.titleAr}</span>
                      <div className="grid grid-cols-3 gap-1">
                        {item.options.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setLateralizationState({ ...lateralizationState, [item.id]: opt.id })}
                            className={`py-1.5 px-1 rounded-xl text-[10px] font-bold text-center border transition-all ${
                              lateralizationState[item.id] === opt.id
                                ? 'bg-indigo-600 text-white border-indigo-400'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {opt.labelAr}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visuo-Motor & Spatial-Temporal Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Visuo-Motor */}
                <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                  <span className="text-xs font-black text-teal-300 uppercase tracking-wider block">
                    ب. التآزر الحركي والبراكسيا (Praxies & Motricité fine):
                  </span>
                  <div className="space-y-3">
                    {VISUO_MOTOR_TESTS.map((test) => (
                      <div key={test.id} className="space-y-1.5">
                        <span className="text-xs font-bold text-white block">{test.titleAr}</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {test.options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setVisuoMotorState({ ...visuoMotorState, [test.id]: opt.id })}
                              className={`p-2 rounded-xl text-[10px] font-bold text-right border transition-all ${
                                visuoMotorState[test.id] === opt.id
                                ? 'bg-teal-600 text-white border-teal-400'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {opt.labelAr}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spatial-Temporal */}
                <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                  <span className="text-xs font-black text-purple-300 uppercase tracking-wider block">
                    ج. التنظيم المكاني والزماني (Organisation Spatio-Temporelle):
                  </span>
                  <div className="space-y-3">
                    {SPATIAL_TEMPORAL_TESTS.map((test) => (
                      <div key={test.id} className="space-y-1.5">
                        <span className="text-xs font-bold text-white block">{test.titleAr}</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {test.options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSpatialTemporalState({ ...spatialTemporalState, [test.id]: opt.id })}
                              className={`p-2 rounded-xl text-[10px] font-bold text-right border transition-all ${
                                spatialTemporalState[test.id] === opt.id
                                ? 'bg-purple-600 text-white border-purple-400'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {opt.labelAr}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLINICAL REPORT & BILAN INTEGRATION */}
          {activeMainTab === 'report' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">التقرير السريري الطبي الشامل للحصيلة الحركية الحسيّة</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة التقرير (A4 Print)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerSoapInjection}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>حقن في SOAP الجلسة</span>
                  </button>
                </div>
              </div>

              {/* Printable Medical A4 Card */}
              <div
                id="psychomotor-printable-bilan"
                className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl space-y-6 text-right print:bg-white print:text-slate-900 print:border print:border-slate-300 print:shadow-none print:p-6"
              >
                {/* Header */}
                <div className="border-b border-slate-800 pb-4 flex items-center justify-between print:border-slate-300">
                  <div>
                    <h2 className="text-xl font-black text-white print:text-slate-900">
                      تقرير الفحص الحركي النفسي وخريطة الجسد (Bilan Psychomoteur)
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                      العيادة النفسية والتأهيلية المتخصصة — تاريخ الفحص: {getAlgeriaArabicDateStr()}
                    </p>
                  </div>
                  <div className="text-left font-mono text-xs text-slate-400 print:text-slate-700">
                    <span className="block text-white font-bold print:text-slate-900">{patient?.first_name} {patient?.last_name}</span>
                    <span>العمر: <span className="text-emerald-400 print:text-slate-900 font-bold">{formatPatientAge(patient)}</span></span>
                  </div>
                </div>

                {/* Synthesis Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 print:bg-slate-50 print:border-slate-200 print:text-slate-900">
                    <span className="font-black text-emerald-400 block print:text-emerald-700">1. المخطط الجسمي والنغمة (Tonus & Schéma Corporel):</span>
                    <p className="text-slate-300 leading-relaxed print:text-slate-700">
                      {bodyMapStats.abnormalTonusCount > 0
                        ? `تم رصد اضطراب توتري في ${bodyMapStats.abnormalTonusCount} منطقة تشريحية، منها ${bodyMapStats.hypertonieCount} منطقة بفرط توتر عضلي و${bodyMapStats.hypotonieCount} مناطق رخوة.`
                        : 'نغمة عضلية متوازنة (Eutonie) في كافة المحاور الجسمية دون رصد تشنجات أو رخاوة مرضية.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 print:bg-slate-50 print:border-slate-200 print:text-slate-900">
                    <span className="font-black text-indigo-400 block print:text-indigo-700">2. الهيمنة الجانبية (Latéralité):</span>
                    <p className="text-slate-300 leading-relaxed print:text-slate-700">
                      {lateralProfile.profileLabelAr} — اليد المهيمنة: {lateralProfile.dominantHand === 'right' ? 'يمنى' : 'يسرى'}، العين المهيمنة: {lateralProfile.dominantEye === 'right' ? 'يمنى' : 'يسرى'}.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 print:bg-slate-50 print:border-slate-200 print:text-slate-900">
                    <span className="font-black text-teal-400 block print:text-teal-700">3. التوازن الثابت والديناميكي (Équilibre):</span>
                    <p className="text-slate-300 leading-relaxed print:text-slate-700">
                      رومبرغ: {balanceState.romberg_eyes_open}، رومبرغ مغمض: {balanceState.romberg_eyes_closed}. الوقوف الفردي: يمين {balanceState.flamingo_right_sec}ث، يسار {balanceState.flamingo_left_sec}ث.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 print:bg-slate-50 print:border-slate-200 print:text-slate-900">
                    <span className="font-black text-purple-400 block print:text-purple-700">4. التآزر والتنظيم الفضائي:</span>
                    <p className="text-slate-300 leading-relaxed print:text-slate-700">
                      ديادوكوكينيزيا: {visuoMotorState.diadochokinesia} | قبضة القلم: {visuoMotorState.pencil_grasp} | بياجيه-هيد: {spatialTemporalState.piaget_head_self}.
                    </p>
                  </div>
                </div>

                {/* PEI Therapeutic Goals Editor */}
                <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3 print:bg-slate-50 print:border-slate-200">
                  <span className="text-xs font-black text-emerald-400 block print:text-emerald-700">
                    أهداف الخطة العلاجية الفردية المقترحة (Objectifs PEI):
                  </span>
                  <div className="space-y-1.5">
                    {therapeuticGoals.map((goal, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs print:bg-white print:border-slate-200"
                      >
                        <span className="text-slate-200 font-bold print:text-slate-800">{goal}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition print:hidden"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddGoal} className="flex gap-2 pt-2 print:hidden">
                    <input
                      type="text"
                      value={newGoalInput}
                      onChange={(e) => setNewGoalInput(e.target.value)}
                      placeholder="إضافة هدف تأهيلي جديد..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 space-x-reverse"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة هدف</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
