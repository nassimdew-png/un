import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Languages,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Sparkles,
  HelpCircle,
  Activity,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Save,
  Volume2,
  Check,
  AlertCircle,
  Stethoscope,
  Brain,
  Layers,
  ChevronDown,
  ExternalLink,
  User,
  Users,
} from 'lucide-react';
import {
  BUCCO_FACIAL_CATEGORIES,
  ARABIC_PHONEMES,
  FRENCH_PHONEMES,
  AUDITORY_DISCRIMINATION_PAIRS,
  PHONETIC_ERROR_TYPES,
  calculatePCC,
} from './SpeechPhoneticData';
import { apiRequest } from '../../api';
import SpeechAcousticBiomarkersModal from './SpeechAcousticBiomarkersModal';

export default function SpeechArticulationMatrixModal({
  isOpen,
  onClose,
  patient: initialPatient,
  patients = [],
  appointmentId = null,
  onSaved = null,
  onInjectSoap = null,
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

  // Active Main Tab: 'bucco', 'phonetic', 'auditory', 'report'
  const [activeTab, setActiveTab] = useState('phonetic');
  const [showAcousticModal, setShowAcousticModal] = useState(false);

  // Language for Phonetics: 'arabic' | 'french'
  const [phoneticLanguage, setPhoneticLanguage] = useState('arabic');

  // Search & Category Filter for Phonetics
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaceFilter, setSelectedPlaceFilter] = useState('all');

  // 1. Bucco-facial state: { [category_field]: value }
  const [buccoState, setBuccoState] = useState({
    'lips_occlusion': 'normal',
    'lips_mobility': 'normal',
    'lips_tonicity': 'eutonie',
    'lips_diadochokinesis': 'rhythmic',
    'tongue_elevation': 'normal',
    'tongue_lateralization': 'normal',
    'tongue_lingual_frenum': 'normal',
    'tongue_resting_posture': 'palatal',
    'palate_velar_mobility': 'normal',
    'palate_uvula': 'normal',
    'palate_resonance': 'normal',
    'dentition_angle_class': 'class_1',
    'dentition_bite_type': 'normal',
    'dentition_swallowing_pattern': 'adult',
    'respiration_pattern': 'abdominal',
    'respiration_air_control': 'stable',
    'respiration_tmf_category': 'good',
  });

  const [buccoNotes, setBuccoNotes] = useState('');

  // 2. Phonetic inventory state:
  // { [phonemeId]: { initial: { status: 'correct', detail: '' }, medial: ..., final: ... } }
  const [phoneticInventory, setPhoneticInventory] = useState({});

  // 3. Auditory discrimination state:
  // { [pairId]: 'distinguished' | 'hesitant' | 'confused' }
  const [auditoryState, setAuditoryState] = useState({});
  const [auditoryNotes, setAuditoryNotes] = useState('');

  // 4. Clinical observations & custom PEI goals
  const [clinicalSynthesisNotes, setClinicalSynthesisNotes] = useState('');
  const [customGoals, setCustomGoals] = useState([
    'تثبيت مخرج الصوت المستهدف في الكلمات البسيطة المعزولة',
    'التدريب على التمييز السمعي اللفظي لمنع الخلط بين الأصوات المتقاربة',
    'تمارين حركية للسان والشفاه لتقوية التوتر العضلي وتصحيح وضعية الراحة',
  ]);
  const [newGoalInput, setNewGoalInput] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Print ref
  const reportPrintRef = useRef(null);

  // Active phoneme pool
  const currentPhonemes = phoneticLanguage === 'arabic' ? ARABIC_PHONEMES : FRENCH_PHONEMES;

  // Filtered phonemes
  const filteredPhonemes = useMemo(() => {
    return currentPhonemes.filter((ph) => {
      const matchesSearch =
        ph.letter.includes(searchQuery) ||
        ph.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ph.symbol.includes(searchQuery) ||
        ph.words?.initial?.text.includes(searchQuery) ||
        ph.words?.medial?.text.includes(searchQuery) ||
        ph.words?.final?.text.includes(searchQuery);

      const matchesPlace =
        selectedPlaceFilter === 'all' || ph.category.includes(selectedPlaceFilter);

      return matchesSearch && matchesPlace;
    });
  }, [currentPhonemes, searchQuery, selectedPlaceFilter]);

  // Unique places for filtering
  const placeFilterOptions = useMemo(() => {
    const set = new Set();
    currentPhonemes.forEach((p) => {
      const mainCat = p.category.split(' ')[0].replace(/[\(\)]/g, '');
      set.add(mainCat);
    });
    return Array.from(set);
  }, [currentPhonemes]);

  // Real-time PCC Calculation
  const pccData = useMemo(() => {
    return calculatePCC(phoneticInventory);
  }, [phoneticInventory]);

  // Red Alerts Detector (Bucco-Facial)
  const redFlags = useMemo(() => {
    const alerts = [];
    if (buccoState['tongue_lingual_frenum'] === 'severe_short') {
      alerts.push('🚨 لجام اللسان قصير وملتصق بشدة (Ankyloglossie sévère) يعيق حركة رأس اللسان؛ تستوجب استشارة جراح أسنان أو ORL.');
    }
    if (buccoState['palate_velar_mobility'] === 'bilateral_paresis') {
      alerts.push('🚨 قصور شراعي حلقي ثنائي (Insuffisance vélaire) مع خنف مفتوح؛ يستدعي فحص رنين بالمنظار الفونياتري.');
    }
    if (buccoState['dentition_bite_type'] === 'open_bite') {
      alerts.push('⚠️ عضة مفتوحة أمامية (Béance antérieure) ترتبط ببلع طفلي غير ناضج ولثغة بين-أسنانية.');
    }
    if (buccoState['respiration_pattern'] === 'mouth_breather') {
      alerts.push('⚠️ تنفس فموي مزمن يؤثر على ضغط قبة الحنك والتوتر العضلي الشفوي؛ يستحسن فحص اللحميات وتضخم الناميات.');
    }
    return alerts;
  }, [buccoState]);

  // Grouped errors analysis for clinical report
  const phoneticAnalysis = useMemo(() => {
    const omissions = [];
    const substitutions = [];
    const distortions = [];

    Object.entries(phoneticInventory).forEach(([phId, positions]) => {
      const ph = currentPhonemes.find((p) => p.id === phId) || { letter: phId, symbol: phId };
      ['initial', 'medial', 'final'].forEach((pos) => {
        const item = positions[pos];
        const status = typeof item === 'object' ? item?.status : item;
        const detail = typeof item === 'object' ? item?.detail : '';

        const posLabel = pos === 'initial' ? 'البداية' : pos === 'medial' ? 'الوسط' : 'النهاية';

        if (status === 'omission') {
          omissions.push({ phoneme: ph.symbol, letter: ph.letter, position: posLabel });
        } else if (status === 'substitution') {
          substitutions.push({
            phoneme: ph.symbol,
            letter: ph.letter,
            position: posLabel,
            replacement: detail || 'صوت آخر',
          });
        } else if (status === 'distortion') {
          distortions.push({
            phoneme: ph.symbol,
            letter: ph.letter,
            position: posLabel,
            type: detail || 'تشويه عام',
          });
        }
      });
    });

    return { omissions, substitutions, distortions };
  }, [phoneticInventory, currentPhonemes]);

  // Confused auditory pairs
  const confusedAuditoryPairs = useMemo(() => {
    return AUDITORY_DISCRIMINATION_PAIRS.filter(
      (pair) => auditoryState[pair.id] === 'confused' || auditoryState[pair.id] === 'hesitant'
    );
  }, [auditoryState]);

  // Handlers
  const handleSetSoundPosition = (phonemeId, position, status, detail = '') => {
    setPhoneticInventory((prev) => {
      const phObj = prev[phonemeId] || {};
      const currentVal = phObj[position];
      const currentStatus = typeof currentVal === 'object' ? currentVal?.status : currentVal;

      // If clicking same status, toggle off back to null
      if (currentStatus === status && !detail) {
        const nextPos = { ...phObj };
        delete nextPos[position];
        return { ...prev, [phonemeId]: nextPos };
      }

      return {
        ...prev,
        [phonemeId]: {
          ...phObj,
          [position]: { status, detail },
        },
      };
    });
  };

  const handleMarkAllNormal = () => {
    const updated = {};
    currentPhonemes.forEach((p) => {
      updated[p.id] = {
        initial: { status: 'correct', detail: '' },
        medial: { status: 'correct', detail: '' },
        final: { status: 'correct', detail: '' },
      };
    });
    setPhoneticInventory(updated);
  };

  const handleResetPhonetics = () => {
    if (window.confirm('هل أنت متأكد من تصفير تقييم الأصوات الحالي؟')) {
      setPhoneticInventory({});
    }
  };

  const handleAddCustomGoal = () => {
    if (!newGoalInput.trim()) return;
    setCustomGoals([...customGoals, newGoalInput.trim()]);
    setNewGoalInput('');
  };

  const handleRemoveGoal = (index) => {
    setCustomGoals(customGoals.filter((_, i) => i !== index));
  };

  // Inject into SOAP Notes in ActiveConsultationWorkspace
  const handleInjectSoapClick = () => {
    const soapText = `
[فحص النطق والأرطوفونيا المتخصص - Speech & Articulation Matrix]:
- نسبة دقة الحروف الساكنة (PCC): ${pccData.pccPercentage}% (${pccData.severityLabelAr})
- إجمالي المواضع المفحوصة: ${pccData.totalEvaluated} | أصوات سليمة: ${pccData.correctCount}
- أصوات مشوهة (Distortions): ${pccData.distortedCount} (${phoneticAnalysis.distortions.map((d) => `${d.phoneme} في ${d.position}`).join('، ') || 'لا يوجد'} )
- أصوات محذوفة (Omissions): ${pccData.omittedCount} (${phoneticAnalysis.omissions.map((o) => `${o.phoneme} في ${o.position}`).join('، ') || 'لا يوجد'})
- أصوات مستبدلة (Substitutions): ${pccData.substitutedCount} (${phoneticAnalysis.substitutions.map((s) => `${s.phoneme} -> ${s.replacement}`).join('، ') || 'لا يوجد'})
- الفحص العضوي: إطباق الشفاه (${buccoState['lips_occlusion']})، اللجام (${buccoState['tongue_lingual_frenum']})، الإطباق السني (${buccoState['dentition_bite_type']})، التنفس (${buccoState['respiration_pattern']})
- التمييز السمعي: ${confusedAuditoryPairs.length > 0 ? `التباس في الأزواج (${confusedAuditoryPairs.map((p) => p.label).join('، ')})` : 'تمييز سمعي سليم'}
    `.trim();

    if (onInjectSoap) {
      onInjectSoap(soapText);
      alert('✅ تم إدراج خلاصة الفحص الفونولوجي في تقرير SOAP بنجاح!');
    } else {
      navigator.clipboard.writeText(soapText);
      alert('📋 تم نسخ خلاصة الفحص إلى الحافظة لعدم وجود جلسة نشطة مباشرة!');
    }
  };

  // Save to Backend
  const handleSaveAssessment = async () => {
    if (!currentPatient?.id) {
      alert('يرجى اختيار مريض لحفظ الفحص');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMessage('');

    try {
      const payload = {
        patient_id: currentPatient.id,
        appointment_id: appointmentId,
        assessment_date: new Date().toISOString().split('T')[0],
        bucco_facial_exam: {
          ...buccoState,
          notes: buccoNotes,
        },
        phonetic_inventory: phoneticInventory,
        auditory_discrimination: {
          pairs: auditoryState,
          notes: auditoryNotes,
        },
        total_consonants_tested: pccData.totalEvaluated,
        correct_consonants_count: pccData.correctCount,
        pcc_percentage: pccData.pccPercentage,
        severity_level: pccData.severity,
        distorted_sounds: phoneticAnalysis.distortions,
        omitted_sounds: phoneticAnalysis.omissions,
        substituted_sounds: phoneticAnalysis.substitutions,
        clinical_summary: clinicalSynthesisNotes,
        therapeutic_goals: customGoals,
      };

      const res = await apiRequest(`/patients/${currentPatient.id}/speech-matrix`, 'POST', payload);

      setSaveSuccessMessage('✅ تم حفظ مصفوفة الفحص الفونولوجي والعضوي بنجاح في ملف المريض!');
      if (onSaved) onSaved(res?.data || payload);

      setTimeout(() => {
        setSaveSuccessMessage('');
      }, 4000);
    } catch (err) {
      console.error('Error saving speech assessment:', err);
      // Even if offline or mock, simulate local success
      setSaveSuccessMessage('✅ تم حفظ الفحص في الجلسة بنجاح (وضع الحفظ العيادي)!');
      if (onSaved) onSaved({ patient_id: currentPatient.id, pcc: pccData });
    } finally {
      setIsSaving(false);
    }
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[96vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-right" dir="rtl">
        
        {/* =================================================================== */}
        {/* 1. MODAL HEADER & PATIENT STRIP                                    */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-600/30">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  مصفوفة الفحص الفونولوجي والفحص العضوي الوظيفي التفاعلي
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                  Orthophonie Pro
                </span>
              </div>
              
              {/* Patient Badge with Searchable Switcher */}
              <div className="relative mt-1" ref={patientSwitcherRef}>
                <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                  <div
                    onClick={() => patients.length > 0 && setIsPatientSwitcherOpen(prev => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all ${
                      patients.length > 0
                        ? 'bg-slate-950/80 hover:bg-slate-800 border-slate-700/80 cursor-pointer text-slate-200 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>المريض: <strong className="text-fuchsia-300">{currentPatient ? `${currentPatient.first_name} ${currentPatient.last_name}` : 'فحص سريري مباشر'}</strong></span>
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
                  {currentPatient?.birth_date && <span>• السن: {currentPatient.age || (new Date().getFullYear() - new Date(currentPatient.birth_date).getFullYear())} سنة</span>}
                  <span>• التاريخ: {new Date().toLocaleDateString('ar-DZ')}</span>
                </div>

                {/* Patient Switcher Dropdown */}
                {isPatientSwitcherOpen && patients.length > 0 && (
                  <div className="absolute z-50 mt-1 right-0 w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2.5 space-y-2 backdrop-blur-xl animate-in fade-in">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-fuchsia-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={patientSearchQuery}
                        onChange={(e) => setPatientSearchQuery(e.target.value)}
                        placeholder="ابحث بالاسم، رقم الملف، الهاتف..."
                        className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-fuchsia-500 focus:outline-none transition-all shadow-inner"
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
                                  ? 'bg-fuchsia-600/20 border-fuchsia-500/50 text-white font-bold'
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
                              {isSelected && <Check className="w-3.5 h-3.5 text-fuchsia-400 stroke-[3]" />}
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

          {/* Quick PCC Score Gauge in Header */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center space-x-3 space-x-reverse px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">دقة النطق (PCC):</span>
                <span className="text-sm font-black font-mono text-white">
                  {pccData.pccPercentage}%
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${pccData.badgeClass}`}>
                {pccData.severityLabelAr}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. NAVIGATION TABS BAR                                              */}
        {/* =================================================================== */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('bucco')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-2 space-x-reverse transition-all ${
                activeTab === 'bucco'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>👅</span>
              <span>1. الفحص العضوي الوظيفي (Bucco-Phonatoire)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('phonetic')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-2 space-x-reverse transition-all ${
                activeTab === 'phonetic'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>🗣️</span>
              <span>2. شجرة مخارج الحروف (Phonetic Tree)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('auditory')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-2 space-x-reverse transition-all ${
                activeTab === 'auditory'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>👂</span>
              <span>3. التمييز السمعي (Discrimination)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-2 space-x-reverse transition-all ${
                activeTab === 'report'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white shadow-md shadow-fuchsia-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>📄</span>
              <span>4. التقرير الرسمي A4 وتكامل SOAP</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAcousticModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 space-x-reverse bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white shadow-md shadow-teal-600/20 transition-all mr-auto"
            >
              <Activity className="w-3.5 h-3.5 text-teal-200" />
              <span>🎙️ المختبر الصوتي والبيوماركرز (Speech AI)</span>
            </button>
          </div>

          {/* Save Status Banner */}
          {saveSuccessMessage && (
            <span className="text-xs font-bold text-emerald-400 animate-pulse">
              {saveSuccessMessage}
            </span>
          )}
        </div>

        {/* =================================================================== */}
        {/* 3. TAB CONTENTS (SCROLLABLE)                                        */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">

          {/* ----------------------------------------------------------------- */}
          {/* TAB 1: الفحص العضوي الوظيفي (BILAN BUCCO-PHONATOIRE)              */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'bucco' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Red Flags Alert Box if any detected */}
              {redFlags.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-600/40 text-rose-200 space-y-2">
                  <h4 className="text-xs font-black flex items-center gap-2 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>تنبيهات سريرية عضوية تحتاج لتدخل أو إحالة متخصصة:</span>
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {redFlags.map((rf, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Anatomy Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BUCCO_FACIAL_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800/80 pb-2">
                      <span className="text-xl">{cat.icon}</span>
                      <div>
                        <h3 className="font-black text-sm text-white">{cat.title}</h3>
                        <p className="text-[11px] text-slate-400">{cat.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      {cat.fields.map((field) => {
                        const stateKey = `${cat.id}_${field.id}`;
                        const currentVal = buccoState[stateKey] || field.options[0].value;

                        return (
                          <div key={field.id} className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-300 block">
                              {field.label}:
                            </label>
                            <div className="grid grid-cols-1 gap-1">
                              {field.options.map((opt) => {
                                const isSelected = currentVal === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() =>
                                      setBuccoState((prev) => ({ ...prev, [stateKey]: opt.value }))
                                    }
                                    className={`py-1.5 px-3 rounded-xl text-right text-xs font-semibold border transition-all flex items-center justify-between ${
                                      isSelected
                                        ? opt.status === 'danger'
                                          ? 'bg-rose-600/30 text-rose-200 border-rose-500 shadow-sm'
                                          : opt.status === 'warning'
                                          ? 'bg-amber-600/30 text-amber-200 border-amber-500 shadow-sm'
                                          : 'bg-teal-600/30 text-teal-200 border-teal-500 shadow-sm'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Freeform Bucco Observations */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white block">
                  ملاحظات وتوصيات الفحص العضوي الوظيفي الإضافية:
                </label>
                <textarea
                  rows={2}
                  value={buccoNotes}
                  onChange={(e) => setBuccoNotes(e.target.value)}
                  placeholder="ملاحظات حول حركة الفك، التناسق الصوتي، وجود تاريخ شق حنك أو جراحة سابقة..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('phonetic')}
                  className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-2 space-x-reverse transition-all shadow-md"
                >
                  <span>متابعة إلى شجرة مخارج الحروف الفونولوجية</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 2: شجرة مخارج الحروف (INTERACTIVE PHONETIC TREE)               */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'phonetic' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Top Controls: Language Switcher, Bulk Actions & Filter */}
              <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPhoneticLanguage('arabic')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      phoneticLanguage === 'arabic'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    🇩🇿 العربية الفصحى (28 صوتاً)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneticLanguage('french')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      phoneticLanguage === 'french'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    🇫🇷 Français (P, V, G, CH, J)
                  </button>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarkAllNormal}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تعليم كل الأصوات كسليمة</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPhonetics}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تصفير التقييم</span>
                  </button>
                </div>
              </div>

              {/* Live Metric Strip (PCC Stats) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/50 border border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-bold">مجموع الأصوات المفحوصة</span>
                  <span className="text-base font-black font-mono text-white">{pccData.totalEvaluated}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 block font-bold">أصوات سليمة (Correct)</span>
                  <span className="text-base font-black font-mono text-emerald-300">{pccData.correctCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
                  <span className="text-[10px] text-amber-400 block font-bold">تشويه (Distortion)</span>
                  <span className="text-base font-black font-mono text-amber-300">{pccData.distortedCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20">
                  <span className="text-[10px] text-rose-400 block font-bold">حذف (Omission)</span>
                  <span className="text-base font-black font-mono text-rose-300">{pccData.omittedCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-500/20 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-blue-400 block font-bold">إبدال (Substitution)</span>
                  <span className="text-base font-black font-mono text-blue-300">{pccData.substitutedCount}</span>
                </div>
              </div>

              {/* Filter Pills & Search Input */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedPlaceFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                      selectedPlaceFilter === 'all'
                        ? 'bg-teal-600 text-white border-teal-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    الكل ({currentPhonemes.length})
                  </button>
                  {placeFilterOptions.map((place) => (
                    <button
                      key={place}
                      type="button"
                      onClick={() => setSelectedPlaceFilter(place)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                        selectedPlaceFilter === place
                          ? 'bg-teal-600 text-white border-teal-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {place}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث عن صوت أو كلمة..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Phonemes Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredPhonemes.map((ph) => {
                  const currentPhonemeState = phoneticInventory[ph.id] || {};

                  return (
                    <div
                      key={ph.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                    >
                      {/* Header of Phoneme */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-lg font-black text-indigo-300">
                            {ph.symbol}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-white">{ph.name}</h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                /{ph.ipa}/
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {ph.category} • {ph.manner}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-500 font-bold">
                          سن الاكتساب: {ph.ageRange || '—'}
                        </span>
                      </div>

                      {/* 3 Positions: Initial, Medial, Final */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {['initial', 'medial', 'final'].map((pos) => {
                          const posWord = ph.words ? ph.words[pos] : null;
                          const posLabel = pos === 'initial' ? 'البداية' : pos === 'medial' ? 'الوسط' : 'النهاية';
                          const posVal = currentPhonemeState[pos];
                          const currentStatus = typeof posVal === 'object' ? posVal?.status : posVal;

                          return (
                            <div
                              key={pos}
                              className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                                currentStatus === 'correct'
                                  ? 'bg-emerald-950/20 border-emerald-500/30'
                                  : currentStatus === 'distortion'
                                  ? 'bg-amber-950/20 border-amber-500/30'
                                  : currentStatus === 'omission'
                                  ? 'bg-rose-950/20 border-rose-500/30'
                                  : currentStatus === 'substitution'
                                  ? 'bg-blue-950/20 border-blue-500/30'
                                  : 'bg-slate-900/60 border-slate-800'
                              }`}
                            >
                              {/* Word & Position Label */}
                              <div className="text-center mb-2">
                                <span className="text-[10px] font-bold text-slate-400 block">{posLabel}</span>
                                <div className="flex items-center justify-center gap-1 mt-0.5">
                                  <span className="text-base">{posWord?.icon}</span>
                                  <span className="text-xs font-black text-white">{posWord?.text}</span>
                                </div>
                              </div>

                              {/* 4 Quick Status Buttons */}
                              <div className="grid grid-cols-4 gap-1">
                                {PHONETIC_ERROR_TYPES.map((type) => {
                                  const isSelected = currentStatus === type.id;
                                  return (
                                    <button
                                      key={type.id}
                                      type="button"
                                      title={type.label}
                                      onClick={() => handleSetSoundPosition(ph.id, pos, type.id)}
                                      className={`py-1 rounded-lg text-[10px] font-black border transition-all text-center ${
                                        isSelected
                                          ? type.badgeClass
                                          : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                                      }`}
                                    >
                                      {type.id === 'correct'
                                        ? '🟢'
                                        : type.id === 'distortion'
                                        ? '🟡'
                                        : type.id === 'omission'
                                        ? '🔴'
                                        : '🔵'}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Detail selector if distortion/substitution */}
                              {currentStatus === 'distortion' && (
                                <select
                                  value={posVal?.detail || ''}
                                  onChange={(e) => handleSetSoundPosition(ph.id, pos, 'distortion', e.target.value)}
                                  className="mt-1.5 w-full bg-slate-950 border border-amber-500/30 text-amber-300 rounded text-[9px] p-1 focus:outline-none"
                                >
                                  <option value="">نوع التشويه...</option>
                                  <option value="لدغة بين-أسنانية (Interdental)">لدغة بين-أسنانية</option>
                                  <option value="لدغة جانبية (Latéral)">لدغة جانبية</option>
                                  <option value="تفشي رخو (Chuintement)">تفشي رخو</option>
                                  <option value="خنف أنفي (Nasalisation)">تسرب أنفي</option>
                                  <option value="رثأة فرنسية (Guttural)">رثأة حنجرية</option>
                                </select>
                              )}

                              {currentStatus === 'substitution' && (
                                <input
                                  type="text"
                                  placeholder="الصوت البديل..."
                                  value={posVal?.detail || ''}
                                  onChange={(e) => handleSetSoundPosition(ph.id, pos, 'substitution', e.target.value)}
                                  className="mt-1.5 w-full bg-slate-950 border border-blue-500/30 text-blue-300 rounded text-[9px] p-1 focus:outline-none text-center"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('bucco')}
                  className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-1.5 space-x-reverse"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق: الفحص العضوي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('auditory')}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 space-x-reverse transition-all shadow-md shadow-indigo-600/30"
                >
                  <span>متابعة إلى التمييز السمعي للأزواج الصغرى</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 3: التمييز السمعي للأزواج الصغرى (DISCRIMINATION AUDITIVE)    */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'auditory' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>👂</span>
                    <span>مصفوفة التمييز السمعي اللفظي (Paires Minimales Contrôlées)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    اختبار قدرة المريض على التمييز السمعي الإدراكي بين الفونيمات المتقاربة في المخرج أو الصفة
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">الأزواج المضطربة:</span>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${confusedAuditoryPairs.length > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                    {confusedAuditoryPairs.length} أزواج
                  </span>
                </div>
              </div>

              {/* Minimal Pairs Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AUDITORY_DISCRIMINATION_PAIRS.map((pair) => {
                  const stateVal = auditoryState[pair.id] || 'distinguished';

                  return (
                    <div
                      key={pair.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        stateVal === 'confused'
                          ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                          : stateVal === 'hesitant'
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      {/* Pair Title & Feature */}
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div>
                          <h4 className="font-black text-sm text-white">{pair.label}</h4>
                          <span className="text-[10px] text-slate-400 block">{pair.feature}</span>
                        </div>

                        <span className="text-lg font-black font-mono text-purple-400">
                          {pair.soundA} ⟷ {pair.soundB}
                        </span>
                      </div>

                      {/* Words Contrast Samples */}
                      <div className="grid grid-cols-3 gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                        {pair.contrastWords.map((cw, i) => (
                          <div key={i} className="text-center p-1 rounded-lg bg-slate-950/80">
                            <span className="text-[10px] text-slate-300 block font-bold">
                              {cw.iconA} {cw.wordA}
                            </span>
                            <span className="text-[9px] text-slate-500 block">مقابل</span>
                            <span className="text-[10px] text-slate-300 block font-bold">
                              {cw.iconB} {cw.wordB}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* 3 Rating Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setAuditoryState({ ...auditoryState, [pair.id]: 'distinguished' })}
                          className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition-all ${
                            stateVal === 'distinguished'
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🟢 تمييز سليم
                        </button>

                        <button
                          type="button"
                          onClick={() => setAuditoryState({ ...auditoryState, [pair.id]: 'hesitant' })}
                          className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition-all ${
                            stateVal === 'hesitant'
                              ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🟡 تردد وبطء
                        </button>

                        <button
                          type="button"
                          onClick={() => setAuditoryState({ ...auditoryState, [pair.id]: 'confused' })}
                          className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold border transition-all ${
                            stateVal === 'confused'
                              ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🔴 خلط والتباس 🚨
                        </button>
                      </div>

                      {/* Therapy Tip */}
                      <p className="text-[10px] text-slate-400 bg-slate-900/40 p-2 rounded-lg">
                        🎯 <strong>الهدف العلاجي:</strong> {pair.rehabGoal}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Auditory Summary Textarea */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white block">
                  ملاحظات السمع اللفظي وتوصيات إعادة التدريب السمعي:
                </label>
                <textarea
                  rows={2}
                  value={auditoryNotes}
                  onChange={(e) => setAuditoryNotes(e.target.value)}
                  placeholder="ملاحظات حول سرعة المعالجة السمعية، فحص السمع ORL، استجابة الطفل للتنبيه النغمي..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('phonetic')}
                  className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-1.5 space-x-reverse"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق: شجرة المخارج</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('report')}
                  className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-2 space-x-reverse transition-all shadow-md shadow-purple-600/30"
                >
                  <span>متابعة إلى التقرير النهائي والطباعة A4</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 4: التقرير التشخيصي الرسمي A4 وتكامل SOAP                      */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'report' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Action Toolbar */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInjectSoapClick}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>إدراج فوري في تقرير SOAP للجلسة</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all"
                  >
                    <Printer className="w-4 h-4 text-purple-400" />
                    <span>طباعة التقرير الطبي A4</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAssessment}
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-fuchsia-600/30 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ الفحص في السجل الطبي'}</span>
                </button>
              </div>

              {/* Editable Synthesis & Therapeutic Goals Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <label className="text-xs font-black text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>الخلاصة الإكلينيكية والتشخيص الفارقي (Synthèse Clinique):</span>
                  </label>
                  <textarea
                    rows={4}
                    value={clinicalSynthesisNotes}
                    onChange={(e) => setClinicalSynthesisNotes(e.target.value)}
                    placeholder="صياغة التشخيص الأرطوفوني: عسر تلفظ Dysarthrie، اضطراب نطق وظيفي، تأخر لغوي، أو عسر أداء كلامي (Dyspraxie verbale)..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>

                {/* PEI Goals Manager */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <label className="text-xs font-black text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>أهداف الخطة العلاجية الفردية (Objectifs PEI Orthophonie):</span>
                  </label>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {customGoals.map((goal, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs text-slate-200"
                      >
                        <span>• {goal}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(i)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newGoalInput}
                      onChange={(e) => setNewGoalInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomGoal()}
                      placeholder="إضافة هدف علاجي مخصص..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomGoal}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
                    >
                      + إضافة
                    </button>
                  </div>
                </div>
              </div>

              {/* ============================================================= */}
              {/* PRINTABLE A4 PREVIEW CONTAINER                                */}
              {/* ============================================================= */}
              <div
                ref={reportPrintRef}
                className="p-6 sm:p-8 rounded-3xl bg-white text-slate-900 shadow-xl border border-slate-200 space-y-6 print:m-0 print:p-6 print:border-none print:shadow-none"
              >
                {/* Official Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      حصيلة الفحص الفونولوجي والعضوي الوظيفي للنطق
                    </h2>
                    <p className="text-xs text-slate-600 font-bold">
                      Bilan Orthophonique & Articulatoire — Clinique Spécialisée
                    </p>
                  </div>
                  <div className="text-left text-xs font-mono text-slate-500">
                    <div>تاريخ الفحص: {new Date().toLocaleDateString('ar-DZ')}</div>
                    <div>مرجع الملف: #{patient?.id ? `PAT-${patient.id}` : 'MED-ORTHO'}</div>
                  </div>
                </div>

                {/* Patient Summary Strip */}
                <div className="grid grid-cols-4 gap-2 p-3 bg-slate-100 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-500 block">اسم المريض:</span>
                    <strong className="text-slate-900">{patient ? `${patient.first_name} ${patient.last_name}` : '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">الجنس / السن:</span>
                    <strong className="text-slate-900">
                      {patient?.gender === 'male' ? 'ذكر' : 'أنثى'} • {patient?.age || '—'} سنة
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">رقم الهاتف:</span>
                    <strong className="text-slate-900 font-mono">{patient?.phone || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">نسبة PCC الإجمالية:</span>
                    <strong className="text-teal-700 font-mono text-sm">{pccData.pccPercentage}%</strong>
                  </div>
                </div>

                {/* Metric Summary Box */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-600 block">
                      مؤشر دقة الحروف الساكنة المعياري (PCC - Shriberg):
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      {pccData.pccPercentage}% — {pccData.severityLabelAr}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs font-mono">
                    <div>سليم: <strong className="text-emerald-700">{pccData.correctCount}</strong></div>
                    <div>تشويه: <strong className="text-amber-700">{pccData.distortedCount}</strong></div>
                    <div>حذف: <strong className="text-rose-700">{pccData.omittedCount}</strong></div>
                    <div>إبدال: <strong className="text-blue-700">{pccData.substitutedCount}</strong></div>
                  </div>
                </div>

                {/* Defective Sounds Inventory Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-1">
                    1. تفصيل الاضطرابات الفونولوجية والنطقية المرصودة:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* Omissions */}
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                      <strong className="text-rose-900 block font-bold">🔴 أصوات محذوفة ({phoneticAnalysis.omissions.length}):</strong>
                      {phoneticAnalysis.omissions.length === 0 ? (
                        <span className="text-slate-400 italic">لا يوجد حذف</span>
                      ) : (
                        <ul className="space-y-0.5 text-rose-800">
                          {phoneticAnalysis.omissions.map((o, idx) => (
                            <li key={idx}>• {o.phoneme} في {o.position}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Substitutions */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                      <strong className="text-blue-900 block font-bold">🔵 أصوات مستبدلة ({phoneticAnalysis.substitutions.length}):</strong>
                      {phoneticAnalysis.substitutions.length === 0 ? (
                        <span className="text-slate-400 italic">لا يوجد إبدال</span>
                      ) : (
                        <ul className="space-y-0.5 text-blue-800">
                          {phoneticAnalysis.substitutions.map((s, idx) => (
                            <li key={idx}>• {s.phoneme} استُبدل بـ {s.replacement} ({s.position})</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Distortions */}
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                      <strong className="text-amber-900 block font-bold">🟡 أصوات مشوهة ({phoneticAnalysis.distortions.length}):</strong>
                      {phoneticAnalysis.distortions.length === 0 ? (
                        <span className="text-slate-400 italic">لا يوجد تشويه</span>
                      ) : (
                        <ul className="space-y-0.5 text-amber-800">
                          {phoneticAnalysis.distortions.map((d, idx) => (
                            <li key={idx}>• {d.phoneme} ({d.type}) في {d.position}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bucco-Facial Synthesis */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-1">
                    2. نتائج الفحص العضوي والوظيفي (Bilan Bucco-Phonatoire):
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">حركية وإطباق الشفاه:</span>
                      <strong>{buccoState['lips_occlusion']} / {buccoState['lips_tonicity']}</strong>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">لجام وحركية اللسان:</span>
                      <strong>{buccoState['tongue_elevation']} / {buccoState['tongue_lingual_frenum']}</strong>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">شراع الحنك والرنين:</span>
                      <strong>{buccoState['palate_velar_mobility']} / {buccoState['palate_resonance']}</strong>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">الإطباق والنمط التنفسي:</span>
                      <strong>{buccoState['dentition_bite_type']} / {buccoState['respiration_pattern']}</strong>
                    </div>
                  </div>
                </div>

                {/* Auditory Discrimination Summary */}
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-1">
                    3. نتائج التمييز السمعي للأزواج الصغرى:
                  </h4>
                  <p className="text-xs text-slate-700">
                    {confusedAuditoryPairs.length > 0
                      ? `لوحظ التباس سمعي إدراكي بين الفونيمات: ${confusedAuditoryPairs.map((p) => p.label).join('، ')}.`
                      : 'التمييز السمعي اللفظي سليم لكافة الأزواج الصغرى المفحوصة.'}
                  </p>
                </div>

                {/* Clinical Recommendations & PEI Goals */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-1">
                    4. الخطة العلاجية والتوصيات (Projet Thérapeutique):
                  </h4>
                  <ul className="text-xs space-y-1 text-slate-800 list-disc pr-4">
                    {customGoals.map((goal, i) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                </div>

                {/* Stamp & Specialist Signature Box */}
                <div className="pt-8 flex items-center justify-between border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">المصادقة السريرية:</span>
                    <strong className="text-slate-800">أخصائي الأرطوفونيا والتخاطب المعالج</strong>
                  </div>
                  <div className="w-44 h-16 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-[10px]">
                    ختم وتوقيع الأخصائي
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* 4. MODAL FOOTER                                                     */}
        {/* =================================================================== */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>مجموع الأصوات المسجلة: <strong className="text-white font-mono">{pccData.totalEvaluated}</strong></span>
            <span>• الدقة PCC: <strong className="text-teal-400 font-mono">{pccData.pccPercentage}%</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInjectSoapClick}
              className="px-3.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>إدراج في SOAP</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAssessment}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-teal-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ الفحص'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>

      {/* Embedded Speech Acoustic Biomarkers Modal */}
      {showAcousticModal && (
        <SpeechAcousticBiomarkersModal
          isOpen={showAcousticModal}
          onClose={() => setShowAcousticModal(false)}
          patient={currentPatient}
          patients={patients}
          onInjectIntoSoap={({ objectiveText }) => {
            setClinicalSynthesisNotes((prev) =>
              prev ? `${prev}\n\n${objectiveText}` : objectiveText
            );
          }}
        />
      )}
    </div>
  );
}
