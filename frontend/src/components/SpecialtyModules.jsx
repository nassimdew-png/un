import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Stethoscope,
  Brain,
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Languages,
  Play,
  Activity,
  Mic,
  ArrowRight,
  Search,
  X,
  User,
  Users,
  ChevronDown,
  Check,
  Filter,
  Phone,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import SpeechArticulationMatrixModal from './orthophony/SpeechArticulationMatrixModal';
import SpeechAcousticBiomarkersModal from './orthophony/SpeechAcousticBiomarkersModal';
import VoiceAcousticStudioModal from './orthophony/VoiceAcousticStudioModal';
import MelodicIntonationStudioModal from './orthophony/MelodicIntonationStudioModal';
import PacingBoardStudioModal from './orthophony/PacingBoardStudioModal';
import PsychomotorBodyMapModal from './psychomotricity/PsychomotorBodyMapModal';
import PmrRelaxationStudioModal from './psychomotricity/PmrRelaxationStudioModal';
import SnoezelenCalmStudioModal from './psychomotricity/SnoezelenCalmStudioModal';
import BilateralMidlineStudioModal from './psychomotricity/BilateralMidlineStudioModal';
import EmdrTraumaStudioModal from './therapy/EmdrTraumaStudioModal';
import CardiacCoherenceStudioModal from './therapy/CardiacCoherenceStudioModal';
import ExposureHierarchyStudioModal from './therapy/ExposureHierarchyStudioModal';
import ActMatrixStudioModal from './therapy/ActMatrixStudioModal';
import ImageryRescriptingStudioModal from './therapy/ImageryRescriptingStudioModal';

export function OrthophonyModule({ patients = [] }) {
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isAcousticModalOpen, setIsAcousticModalOpen] = useState(false);
  const [isVoiceAcousticOpen, setIsVoiceAcousticOpen] = useState(false);
  const [isMelodicOpen, setIsMelodicOpen] = useState(false);
  const [isPacingOpen, setIsPacingOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Search & Filter States for Roster
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedAgeFilter, setSelectedAgeFilter] = useState('all'); // 'all' | 'child' | 'adult'
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('all'); // 'all' | 'male' | 'female'

  // Top Banner Quick Patient Combobox State
  const [isBannerPickerOpen, setIsBannerPickerOpen] = useState(false);
  const [bannerSearchQuery, setBannerSearchQuery] = useState('');
  const bannerPickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (bannerPickerRef.current && !bannerPickerRef.current.contains(event.target)) {
        setIsBannerPickerOpen(false);
      }
    }
    if (isBannerPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBannerPickerOpen]);

  // Main Roster Filtered Patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // 1. Search Query
      if (patientSearchQuery.trim()) {
        const q = patientSearchQuery.toLowerCase().trim();
        const fullName = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
        const phone = (p.phone || p.parent_phone || '').toLowerCase();
        const folder = (p.folder_number || p.file_number || '').toLowerCase();
        const idStr = String(p.id);
        const reason = (p.anamnesis_data?.consultation_reason || '').toLowerCase();
        const therapy = (p.anamnesis_data?.therapy_type || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();

        const matches = fullName.includes(q) || phone.includes(q) || folder.includes(q) || idStr.includes(q) || reason.includes(q) || therapy.includes(q) || notes.includes(q);
        if (!matches) return false;
      }

      // 2. Age Filter
      const calculatedAge = p.age || (p.birth_date ? (new Date().getFullYear() - new Date(p.birth_date).getFullYear()) : null);
      if (selectedAgeFilter === 'child') {
        if (calculatedAge !== null && calculatedAge >= 12) return false;
      } else if (selectedAgeFilter === 'adult') {
        if (calculatedAge !== null && calculatedAge < 12) return false;
      }

      // 3. Gender Filter
      if (selectedGenderFilter !== 'all') {
        if (p.gender !== selectedGenderFilter) return false;
      }

      return true;
    });
  }, [patients, patientSearchQuery, selectedAgeFilter, selectedGenderFilter]);

  // Banner Dropdown Filtered Patients
  const filteredBannerPatients = useMemo(() => {
    if (!bannerSearchQuery.trim()) return patients;
    const q = bannerSearchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const fullName = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
      const phone = (p.phone || p.parent_phone || '').toLowerCase();
      const folder = (p.folder_number || p.file_number || '').toLowerCase();
      const idStr = String(p.id);
      return fullName.includes(q) || phone.includes(q) || folder.includes(q) || idStr.includes(q);
    });
  }, [patients, bannerSearchQuery]);

  const handleOpenMatrix = (patient = null) => {
    const target = patient || selectedPatient || (patients.length > 0 ? patients[0] : null);
    setSelectedPatient(target);
    setIsMatrixOpen(true);
  };

  const handleOpenAcoustic = (patient = null) => {
    const target = patient || selectedPatient || (patients.length > 0 ? patients[0] : null);
    setSelectedPatient(target);
    setIsAcousticModalOpen(true);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Banner & Primary Trigger */}
      <div className="p-6 rounded-3xl bg-gradient-to-l from-fuchsia-950/40 via-slate-900 to-indigo-950/40 border border-fuchsia-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-600/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-400">
              <Languages className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">
              جناح الأرطوفونيا وفحص النطق التفاعلي (PsyPro Orthophonie Suite)
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            أداة سريرية بصرية فائقة التخصص: تقييم عضوي وظيفي لأعضاء الكلام، شجرة مخارج الحروف العربية والفرنسية في المواضع الثلاثة، حساب آلي لنسبة دقة الحروف PCC، ومصفوفة التمييز السمعي للأزواج الصغرى مع البحث السريع للمرضى.
          </p>
        </div>

        {/* Quick Patient Selector + Primary Launch Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Searchable Patient Combobox in Banner */}
          <div className="relative" ref={bannerPickerRef}>
            <button
              type="button"
              onClick={() => setIsBannerPickerOpen((prev) => !prev)}
              className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-2xl bg-slate-950/90 border text-xs font-bold transition-all shadow-md w-full sm:w-60 ${
                selectedPatient
                  ? 'border-fuchsia-500/60 bg-fuchsia-950/20 text-fuchsia-200 ring-1 ring-fuchsia-500/30'
                  : 'border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {selectedPatient ? (
                  <div className="w-5 h-5 rounded-lg bg-fuchsia-600 text-white text-[10px] flex items-center justify-center shrink-0 font-black">
                    {(selectedPatient.first_name || 'م')[0]}
                  </div>
                ) : (
                  <User className="w-4 h-4 text-fuchsia-400 shrink-0" />
                )}
                <span className="truncate">
                  {selectedPatient
                    ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                    : 'اختر مريضاً للفحص...'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {selectedPatient && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPatient(null);
                    }}
                    className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                    title="إلغاء التحديد"
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isBannerPickerOpen ? 'rotate-180 text-fuchsia-400' : ''}`} />
              </div>
            </button>

            {/* Banner Combobox Dropdown */}
            {isBannerPickerOpen && (
              <div className="absolute z-50 mt-1.5 right-0 left-0 sm:w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2.5 space-y-2 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-fuchsia-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={bannerSearchQuery}
                    onChange={(e) => setBannerSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم، رقم الملف، الهاتف..."
                    className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-fuchsia-500 focus:outline-none transition-all"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  {bannerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBannerSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                  {filteredBannerPatients.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      لا يوجد مريض مطابق لـ "{bannerSearchQuery}"
                    </div>
                  ) : (
                    filteredBannerPatients.map((p) => {
                      const isSelected = selectedPatient?.id === p.id;
                      const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || `مريض #${p.id}`;
                      const folder = p.folder_number || p.file_number || `#${p.id}`;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setIsBannerPickerOpen(false);
                            setBannerSearchQuery('');
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

          <button
            type="button"
            onClick={() => setIsVoiceAcousticOpen(true)}
            className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 space-x-reverse shadow-lg shadow-teal-600/30 transition-all hover:scale-[1.02]"
          >
            <Activity className="w-4 h-4 text-teal-200" />
            <span>🎙️ التحليل الصوتي والبايوفيدباك</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMelodicOpen(true)}
            className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 space-x-reverse shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Activity className="w-4 h-4 text-indigo-200" />
            <span>🎵 العلاج بالتنغيم (MIT)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPacingOpen(true)}
            className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 space-x-reverse shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
          >
            <Activity className="w-4 h-4 text-emerald-200" />
            <span>🎯 لوح التقطيع والطلاقة</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenMatrix()}
            className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 space-x-reverse shadow-lg shadow-fuchsia-600/30 transition-all hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 text-fuchsia-200 fill-fuchsia-200" />
            <span>👅 مصفوفة الفحص</span>
          </button>
        </div>
      </div>

      {/* Specialty Pillars Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-fuchsia-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fuchsia-400 uppercase">الفحص العضوي الوظيفي</span>
            <span className="text-lg">👅</span>
          </div>
          <div className="text-lg font-black text-white">Bilan Bucco-Phonatoire</div>
          <p className="text-xs text-slate-400">فحص حركية اللسان والشفاه، لجام اللسان، صنف آنغل للإطباق، والنمط التنفسي.</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-400 uppercase">شجرة المخارج و PCC</span>
            <span className="text-lg">🗣️</span>
          </div>
          <div className="text-lg font-black text-white">Phonetic Tree & PCC %</div>
          <p className="text-xs text-slate-400">28 صوتاً في المواضع الثلاثة مع رصد التشويه، الحذف، والإبدال وحساب شدة الاضطراب آلياً.</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400 uppercase">التمييز السمعي للأزواج</span>
            <span className="text-lg">👂</span>
          </div>
          <div className="text-lg font-black text-white">Discrimination Auditive</div>
          <p className="text-xs text-slate-400">مصفوفة اختبار الأزواج الصغرى المتقاربة (س/ش، ر/ل، ت/ط، ف/ب) لتحديد أولويات التأهيل.</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-teal-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-400 uppercase">المختبر الصوتي والبيوماركرز</span>
            <span className="text-lg">🎙️</span>
          </div>
          <div className="text-lg font-black text-white">Speech AI & Biomarkers</div>
          <p className="text-xs text-slate-400">تحليل طيفي للتردد، Jitter/Shimmer، زمن التصويت TMF، وعدّاد التأتأة %SS.</p>
        </div>
      </div>

      {/* Patient List with Live Search & Instant Articulation Evaluation */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-fuchsia-400" />
              <h3 className="text-base font-black text-white">مرضى الأرطوفونيا والتخاطب المسجلين في العيادة</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ابحث عن أي مريض لفتح مصفوفة الفحص الفونولوجي أو تشغيل المختبر الصوتي فوراً
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 font-bold text-xs font-mono">
              عرض {filteredPatients.length} من أصل {patients.length} مريض
            </span>
          </div>
        </div>

        {/* Live Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-fuchsia-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              placeholder="ابحث باسم المريض، رقم الملف، الهاتف، أو سبب الاستشارة..."
              className="w-full pl-8 pr-10 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-fuchsia-500 focus:outline-none transition-all shadow-inner"
            />
            {patientSearchQuery && (
              <button
                type="button"
                onClick={() => setPatientSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <span className="text-[11px] text-slate-400 font-bold ml-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-fuchsia-400" />
              <span>تصفية:</span>
            </span>

            {/* Age Filter */}
            {[
              { id: 'all', label: 'الكل' },
              { id: 'child', label: 'أطفال (< 12)' },
              { id: 'adult', label: 'يافعين وكبار' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedAgeFilter(f.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  selectedAgeFilter === f.id
                    ? 'bg-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

            {/* Gender Filter */}
            {[
              { id: 'all', label: 'الجنس' },
              { id: 'male', label: 'ذكور' },
              { id: 'female', label: 'إناث' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGenderFilter(g.id)}
                className={`px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  selectedGenderFilter === g.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {g.label}
              </button>
            ))}

            {(patientSearchQuery || selectedAgeFilter !== 'all' || selectedGenderFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setPatientSearchQuery('');
                  setSelectedAgeFilter('all');
                  setSelectedGenderFilter('all');
                }}
                className="px-2 py-1 rounded-xl text-[10px] text-rose-400 hover:bg-rose-500/10 transition font-bold"
                title="إلغاء كافة التصفية"
              >
                إعادة ضبط
              </button>
            )}
          </div>
        </div>

        {/* Patients Cards List */}
        <div className="space-y-3">
          {filteredPatients.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center text-slate-400 text-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <p className="font-bold text-slate-300">
                {patientSearchQuery
                  ? `لم يتم العثور على مريض يطابق البحث "${patientSearchQuery}"`
                  : 'لا يوجد مرضى يطابقون خيارات التصفية الحالية'}
              </p>
              <p className="text-[11px] text-slate-500">
                يرجى التأكد من كتابة الاسم أو رقم الهاتف أو رقم الملف بدقة أو إعادة ضبط خيارات التصفية.
              </p>
              {(patientSearchQuery || selectedAgeFilter !== 'all' || selectedGenderFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setPatientSearchQuery('');
                    setSelectedAgeFilter('all');
                    setSelectedGenderFilter('all');
                  }}
                  className="mt-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                >
                  عرض جميع المرضى
                </button>
              )}
            </div>
          ) : (
            filteredPatients.map((p) => {
              const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || `مريض #${p.id}`;
              const folderNum = p.folder_number || p.file_number || `#${p.id}`;
              const age = p.age || (p.birth_date ? (new Date().getFullYear() - new Date(p.birth_date).getFullYear()) : null);

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-fuchsia-500/40 flex flex-wrap items-center justify-between gap-3 transition-all group"
                >
                  <div className="flex items-center space-x-3.5 space-x-reverse min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                      {(fullName[0] || 'م')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
                        <span className="font-black text-sm text-white group-hover:text-fuchsia-300 transition-colors">
                          {fullName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
                          {p.gender === 'male' ? 'ذكر' : 'أنثى'}
                        </span>
                        {age && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                            {age} سنة
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                          ملف: {folderNum}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 truncate max-w-md sm:max-w-xl">
                        الشكوى / سبب الاستشارة: <span className="text-slate-200">{p.anamnesis_data?.consultation_reason || 'تقييم نطقي ولغوي وفحص مخارج الحروف'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.phone && (
                      <span className="text-xs font-mono text-slate-400 font-semibold ml-2 flex items-center gap-1 hidden sm:flex">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{p.phone}</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenAcoustic(p)}
                      className="px-3.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all shadow-sm active:scale-95"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>المختبر الصوتي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenMatrix(p)}
                      className="px-3.5 py-2 rounded-xl bg-fuchsia-600/20 hover:bg-fuchsia-600 text-fuchsia-300 hover:text-white border border-fuchsia-500/30 font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all shadow-sm active:scale-95"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      <span>فحص النطق والمخارج</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Render Master Matrix Modal */}
      {isMatrixOpen && (
        <SpeechArticulationMatrixModal
          isOpen={isMatrixOpen}
          onClose={() => setIsMatrixOpen(false)}
          patient={selectedPatient}
          patients={patients}
        />
      )}

      {/* Render Voice Acoustic Biofeedback Studio Modal */}
      {isVoiceAcousticOpen && (
        <VoiceAcousticStudioModal
          isOpen={isVoiceAcousticOpen}
          onClose={() => setIsVoiceAcousticOpen(false)}
          patientName={selectedPatient ? `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() : 'المريض'}
        />
      )}

      {/* Render Melodic Intonation Therapy Studio Modal */}
      {isMelodicOpen && (
        <MelodicIntonationStudioModal
          isOpen={isMelodicOpen}
          onClose={() => setIsMelodicOpen(false)}
          patientName={selectedPatient ? `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() : 'المريض'}
        />
      )}

      {/* Render Pacing Board & Fluency Studio Modal */}
      {isPacingOpen && (
        <PacingBoardStudioModal
          isOpen={isPacingOpen}
          onClose={() => setIsPacingOpen(false)}
          patientName={selectedPatient ? `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() : 'المريض'}
        />
      )}
    </div>
  );
}

export function PsychologyModule({ patients = [] }) {
  const [isEmdrModalOpen, setIsEmdrModalOpen] = useState(false);
  const [isCardiacOpen, setIsCardiacOpen] = useState(false);
  const [isExposureOpen, setIsExposureOpen] = useState(false);
  const [isActMatrixOpen, setIsActMatrixOpen] = useState(false);
  const [isImageryOpen, setIsImageryOpen] = useState(false);
  const [selectedPatientForEmdr, setSelectedPatientForEmdr] = useState(null);

  // Search & Filter States for Roster
  const [psychologySearchQuery, setPsychologySearchQuery] = useState('');
  const [selectedAgeFilter, setSelectedAgeFilter] = useState('all'); // 'all' | 'child' | 'adult'
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('all'); // 'all' | 'male' | 'female'

  // Top Banner Quick Patient Combobox State
  const [isBannerPickerOpen, setIsBannerPickerOpen] = useState(false);
  const [bannerSearchQuery, setBannerSearchQuery] = useState('');
  const bannerPickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (bannerPickerRef.current && !bannerPickerRef.current.contains(event.target)) {
        setIsBannerPickerOpen(false);
      }
    }
    if (isBannerPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBannerPickerOpen]);

  // Main Roster Filtered Patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // 1. Text Search
      if (psychologySearchQuery.trim()) {
        const q = psychologySearchQuery.toLowerCase().trim();
        const fullName = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
        const phone = (p.phone || p.parent_phone || '').toLowerCase();
        const folder = (p.folder_number || p.file_number || '').toLowerCase();
        const idStr = String(p.id);
        const reason = (p.anamnesis_data?.consultation_reason || '').toLowerCase();
        const therapy = (p.anamnesis_data?.therapy_type || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();

        const matches =
          fullName.includes(q) ||
          phone.includes(q) ||
          folder.includes(q) ||
          idStr.includes(q) ||
          reason.includes(q) ||
          therapy.includes(q) ||
          notes.includes(q);
        if (!matches) return false;
      }

      // 2. Age Filter
      const calculatedAge =
        p.age ||
        (p.birth_date ? new Date().getFullYear() - new Date(p.birth_date).getFullYear() : null);
      if (selectedAgeFilter === 'child') {
        if (calculatedAge !== null && calculatedAge >= 12) return false;
      } else if (selectedAgeFilter === 'adult') {
        if (calculatedAge !== null && calculatedAge < 12) return false;
      }

      // 3. Gender Filter
      if (selectedGenderFilter !== 'all') {
        if (p.gender !== selectedGenderFilter) return false;
      }

      return true;
    });
  }, [patients, psychologySearchQuery, selectedAgeFilter, selectedGenderFilter]);

  // Banner Dropdown Filtered Patients
  const filteredBannerPatients = useMemo(() => {
    if (!bannerSearchQuery.trim()) return patients;
    const q = bannerSearchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const fullName = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
      const phone = (p.phone || p.parent_phone || '').toLowerCase();
      const folder = (p.folder_number || p.file_number || '').toLowerCase();
      const idStr = String(p.id);
      return fullName.includes(q) || phone.includes(q) || folder.includes(q) || idStr.includes(q);
    });
  }, [patients, bannerSearchQuery]);

  const handleLaunchEmdr = (patient = null) => {
    const target = patient || selectedPatientForEmdr || (patients.length > 0 ? patients[0] : null);
    setSelectedPatientForEmdr(target);
    setIsEmdrModalOpen(true);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Banner & Primary EMDR Trigger */}
      <div className="p-6 rounded-3xl bg-gradient-to-l from-indigo-950/40 via-slate-900 to-teal-950/40 border border-teal-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">
              جناح علم النفس العيادي وتقنية EMDR (PsyPro Psychology & Trauma Suite)
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            منظومة عيادية متكاملة للأطباء النفسانيين والمعالجين: مختبر التحفيز البصري والصوتي ثنائي الجانب (EMDR Bilateral Stimulation)، بروتوكول المراحل الثماني لمعالجة الصدمات والـ PTSD، أدوات العلاج المعرفي السلوكي (CBT)، ومقاييس القلق والاكتئاب.
          </p>
        </div>

        {/* Quick Patient Selector + Primary Launch Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Searchable Patient Combobox in Banner */}
          <div className="relative" ref={bannerPickerRef}>
            <button
              type="button"
              onClick={() => setIsBannerPickerOpen((prev) => !prev)}
              className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-2xl bg-slate-950/90 border text-xs font-bold transition-all shadow-md w-full sm:w-60 ${
                selectedPatientForEmdr
                  ? 'border-teal-500/60 bg-teal-950/20 text-teal-200 ring-1 ring-teal-500/30'
                  : 'border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {selectedPatientForEmdr ? (
                  <div className="w-5 h-5 rounded-lg bg-teal-600 text-white text-[10px] flex items-center justify-center shrink-0 font-black">
                    {(selectedPatientForEmdr.first_name || 'م')[0]}
                  </div>
                ) : (
                  <User className="w-4 h-4 text-teal-400 shrink-0" />
                )}
                <span className="truncate">
                  {selectedPatientForEmdr
                    ? `${selectedPatientForEmdr.first_name} ${selectedPatientForEmdr.last_name}`
                    : 'اختر مريضاً لجلسة EMDR...'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {selectedPatientForEmdr && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPatientForEmdr(null);
                    }}
                    className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                    title="إلغاء التحديد"
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isBannerPickerOpen ? 'rotate-180 text-teal-400' : ''
                  }`}
                />
              </div>
            </button>

            {/* Banner Combobox Dropdown */}
            {isBannerPickerOpen && (
              <div className="absolute z-50 mt-1.5 right-0 left-0 sm:w-80 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2.5 space-y-2 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-teal-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={bannerSearchQuery}
                    onChange={(e) => setBannerSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم، رقم الملف، الهاتف..."
                    className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-teal-500 focus:outline-none transition-all"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  {bannerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBannerSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                  {filteredBannerPatients.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      لا يوجد مريض مطابق لـ "{bannerSearchQuery}"
                    </div>
                  ) : (
                    filteredBannerPatients.map((p) => {
                      const isSelected = selectedPatientForEmdr?.id === p.id;
                      const name =
                        `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || `مريض #${p.id}`;
                      const folder = p.folder_number || p.file_number || `#${p.id}`;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatientForEmdr(p);
                            setIsBannerPickerOpen(false);
                            setBannerSearchQuery('');
                          }}
                          className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs border ${
                            isSelected
                              ? 'bg-teal-600/20 border-teal-500/50 text-white font-bold'
                              : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {name[0] || 'م'}
                            </div>
                            <div className="truncate">
                              <div className="truncate">{name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ملف: {folder}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-teal-400 stroke-[3]" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleLaunchEmdr()}
            className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 space-x-reverse shadow-lg shadow-teal-600/30 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-teal-200" />
            <span>⚡ جلسة EMDR</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCardiacOpen(true)}
            className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 space-x-reverse shadow-lg shadow-sky-600/30 transition-all hover:scale-[1.02]"
          >
            <Activity className="w-4 h-4 text-sky-200" />
            <span>🫁 الاتساق القلبي 365</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExposureOpen(true)}
            className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 space-x-reverse shadow-lg shadow-amber-600/30 transition-all hover:scale-[1.02]"
          >
            <Activity className="w-4 h-4 text-amber-200" />
            <span>🪜 سلم التعريض ERP</span>
          </button>

          <button
            type="button"
            onClick={() => setIsActMatrixOpen(true)}
            className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 space-x-reverse shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Activity className="w-4 h-4 text-indigo-200" />
            <span>🧭 مصفوفة ACT</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImageryOpen(true)}
            className="px-3.5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 space-x-reverse shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-rose-200" />
            <span>🎭 مخططات الذات</span>
          </button>
        </div>
      </div>

      {/* Specialty Pillars Cards (Interactive Direct Shortcuts) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: EMDR Studio */}
        <button
          type="button"
          onClick={() => handleLaunchEmdr()}
          className="text-right glass-card rounded-2xl p-5 border border-teal-500/30 hover:border-teal-500/70 hover:bg-teal-950/20 space-y-2.5 transition-all group hover:scale-[1.02] shadow-lg focus:outline-none relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-400 uppercase flex items-center gap-1.5">
              <span>تقنية EMDR ومعالجة الصدمات</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono font-bold">جديد</span>
            </span>
            <span className="text-xl group-hover:scale-125 transition-transform">⚡</span>
          </div>
          <div className="text-base font-black text-white group-hover:text-teal-300 transition-colors">
            EMDR & BLS Lightbar Studio
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            محرك التحفيز البصري الثنائي التفاعلي، نغمات الأذن المعيارية (Binaural Audio)، وبروتوكول المراحل الـ 8 الكامل لحساب SUDS و VoC.
          </p>
          <div className="text-[11px] text-teal-400/90 font-bold flex items-center gap-1 pt-1">
            <span>فتح استوديو EMDR التفاعلي</span>
            <ArrowRight className="w-3 h-3 group-hover:-translate-x-1 transition-transform rotate-180" />
          </div>
        </button>

        {/* Card 2: CBT */}
        <div className="glass-card rounded-2xl p-5 border border-cyan-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400 uppercase">العلاج المعرفي السلوكي (TCC)</span>
            <span className="text-lg">🧠</span>
          </div>
          <div className="text-base font-bold text-white">القلق والمخاوف والرهاب</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            سجلات بيك، التعريض المتدرج، إعادة الهيكلة المعرفية للأفكار الآلية ومخططات يانغ المعرفية.
          </p>
        </div>

        {/* Card 3: TDAH */}
        <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-400 uppercase">الطفولة والمراهقة</span>
            <span className="text-lg">🎯</span>
          </div>
          <div className="text-base font-bold text-white">فرط الحركة وتشتت الانتباه TDAH</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            التعديل السلوكي، الدعم النفسي-المدرسي، تنمية الوظائف التنفيذية والتحكم في الاندفاعية.
          </p>
        </div>

        {/* Card 4: Guidance */}
        <div className="glass-card rounded-2xl p-5 border border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400 uppercase">الإرشاد الأسري والنظامي</span>
            <span className="text-lg">👨‍👩‍👧‍👦</span>
          </div>
          <div className="text-base font-bold text-white">Guidance Parentale</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            مرافقة الديناميكية الوالدية، حل النزاعات الأسرية، ودعم استقرار البيئة المنزلية للطفل.
          </p>
        </div>
      </div>

      {/* Patients Roster with Live Search & Direct EMDR Launch */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" />
              <h3 className="text-base font-black text-white">مرضى المتابعة النفسية والصدمات المسجلين بالعيادة</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ابحث عن أي مريض لتشغيل جلسة EMDR تفاعلية أو مراجعة بروتوكولات المتابعة العيادية فوراً
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 font-bold text-xs font-mono">
              عرض {filteredPatients.length} من أصل {patients.length} مريض
            </span>
          </div>
        </div>

        {/* Live Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-teal-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={psychologySearchQuery}
              onChange={(e) => setPsychologySearchQuery(e.target.value)}
              placeholder="ابحث باسم المريض، رقم الملف، الهاتف، أو سبب الاستشارة..."
              className="w-full pl-8 pr-10 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-teal-500 focus:outline-none transition-all shadow-inner"
            />
            {psychologySearchQuery && (
              <button
                type="button"
                onClick={() => setPsychologySearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <span className="text-[11px] text-slate-400 font-bold ml-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-teal-400" />
              <span>تصفية:</span>
            </span>

            {/* Age Filter */}
            {[
              { id: 'all', label: 'الكل' },
              { id: 'child', label: 'أطفال (< 12)' },
              { id: 'adult', label: 'يافعين وكبار' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedAgeFilter(f.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  selectedAgeFilter === f.id
                    ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

            {/* Gender Filter */}
            {[
              { id: 'all', label: 'الجنس' },
              { id: 'male', label: 'ذكور' },
              { id: 'female', label: 'إناث' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGenderFilter(g.id)}
                className={`px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  selectedGenderFilter === g.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {g.label}
              </button>
            ))}

            {(psychologySearchQuery || selectedAgeFilter !== 'all' || selectedGenderFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setPsychologySearchQuery('');
                  setSelectedAgeFilter('all');
                  setSelectedGenderFilter('all');
                }}
                className="px-2 py-1 rounded-xl text-[10px] text-rose-400 hover:bg-rose-500/10 transition font-bold"
                title="إلغاء كافة التصفية"
              >
                إعادة ضبط
              </button>
            )}
          </div>
        </div>

        {/* Patients Cards List */}
        <div className="space-y-3">
          {filteredPatients.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center text-slate-400 text-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <p className="font-bold text-slate-300">
                {psychologySearchQuery
                  ? `لم يتم العثور على مريض يطابق البحث "${psychologySearchQuery}"`
                  : 'لا يوجد مرضى يطابقون خيارات التصفية الحالية'}
              </p>
              <p className="text-[11px] text-slate-500">
                يرجى التأكد من كتابة الاسم أو رقم الهاتف أو رقم الملف بدقة أو إعادة ضبط خيارات التصفية.
              </p>
              {(psychologySearchQuery || selectedAgeFilter !== 'all' || selectedGenderFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setPsychologySearchQuery('');
                    setSelectedAgeFilter('all');
                    setSelectedGenderFilter('all');
                  }}
                  className="mt-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                >
                  عرض جميع المرضى
                </button>
              )}
            </div>
          ) : (
            filteredPatients.map((p) => {
              const fullName =
                `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || `مريض #${p.id}`;
              const folderNum = p.folder_number || p.file_number || `#${p.id}`;
              const age =
                p.age ||
                (p.birth_date ? new Date().getFullYear() - new Date(p.birth_date).getFullYear() : null);
              const rawReason = p.anamnesis_data?.consultation_reason;
              const consultationReason =
                rawReason && typeof rawReason === 'string' && rawReason.trim().length > 2
                  ? rawReason.trim()
                  : 'متابعة نفسية، دعم انفعالي، وعلاج معرفي سلوكي';

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-teal-500/40 flex flex-wrap items-center justify-between gap-3 transition-all group"
                >
                  <div className="flex items-center space-x-3.5 space-x-reverse min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                      {fullName[0] || 'م'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
                        <span className="font-black text-sm text-white group-hover:text-teal-300 transition-colors">
                          {fullName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                          {p.gender === 'male' ? 'ذكر' : 'أنثى'}
                        </span>
                        {age && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                            {age} سنة
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                          ملف: {folderNum}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 truncate max-w-md sm:max-w-xl">
                        الشكوى / سبب الاستشارة: <span className="text-slate-200">{consultationReason}</span>
                      </p>
                      {p.anamnesis_data?.therapy_type && (
                        <p className="text-[11px] text-teal-400 mt-0.5 flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          <span>البروتوكول السريري: {p.anamnesis_data.therapy_type}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.phone && (
                      <span className="text-xs font-mono text-slate-400 font-semibold ml-2 flex items-center gap-1 hidden sm:flex">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{p.phone}</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleLaunchEmdr(p)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all shadow-md shadow-teal-600/20 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                      <span>⚡ جلسة EMDR</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Render EMDR Trauma Studio Modal */}
      {isEmdrModalOpen && (
        <EmdrTraumaStudioModal
          isOpen={isEmdrModalOpen}
          onClose={() => setIsEmdrModalOpen(false)}
          patient={selectedPatientForEmdr}
          patients={patients}
        />
      )}

      {/* Render Cardiac Coherence Studio Modal */}
      {isCardiacOpen && (
        <CardiacCoherenceStudioModal
          isOpen={isCardiacOpen}
          onClose={() => setIsCardiacOpen(false)}
          patientName={selectedPatientForEmdr ? `${selectedPatientForEmdr.first_name || ''} ${selectedPatientForEmdr.last_name || ''}`.trim() : 'المريض'}
        />
      )}

      {/* Render Graded Exposure ERP Studio Modal */}
      {isExposureOpen && (
        <ExposureHierarchyStudioModal
          isOpen={isExposureOpen}
          onClose={() => setIsExposureOpen(false)}
          patientName={selectedPatientForEmdr ? `${selectedPatientForEmdr.first_name || ''} ${selectedPatientForEmdr.last_name || ''}`.trim() : 'المريض'}
        />
      )}

      {/* Render ACT Matrix Studio Modal */}
      {isActMatrixOpen && (
        <ActMatrixStudioModal
          isOpen={isActMatrixOpen}
          onClose={() => setIsActMatrixOpen(false)}
          patientName={selectedPatientForEmdr ? `${selectedPatientForEmdr.first_name || ''} ${selectedPatientForEmdr.last_name || ''}`.trim() : 'المريض'}
        />
      )}

      {/* Render Imagery Rescripting & Schema Modes Modal */}
      {isImageryOpen && (
        <ImageryRescriptingStudioModal
          isOpen={isImageryOpen}
          onClose={() => setIsImageryOpen(false)}
          patientName={selectedPatientForEmdr ? `${selectedPatientForEmdr.first_name || ''} ${selectedPatientForEmdr.last_name || ''}`.trim() : 'المريض'}
        />
      )}
    </div>
  );
}

// =========================================================================
// 3. PSYCHOMOTRICITY MODULE (Interactive Psychomotor Suite)
// =========================================================================
export function PsychomotricityModule({ patients = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [initialModalTab, setInitialModalTab] = useState('body_map');

  // Interactive Clinical Studios States
  const [isPmrOpen, setIsPmrOpen] = useState(false);
  const [isSnoezelenOpen, setIsSnoezelenOpen] = useState(false);
  const [isBilateralOpen, setIsBilateralOpen] = useState(false);

  // Search & Filter States for Roster
  const [psychomotorSearchQuery, setPsychomotorSearchQuery] = useState('');
  const [selectedAgeFilter, setSelectedAgeFilter] = useState('all'); // 'all' | 'child' | 'adult'
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('all'); // 'all' | 'male' | 'female'

  // Top Banner Quick Patient Combobox State
  const [isBannerPickerOpen, setIsBannerPickerOpen] = useState(false);
  const [bannerSearchQuery, setBannerSearchQuery] = useState('');
  const bannerPickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (bannerPickerRef.current && !bannerPickerRef.current.contains(event.target)) {
        setIsBannerPickerOpen(false);
      }
    }
    if (isBannerPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBannerPickerOpen]);

  // Main Roster Filtered Patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // 1. Search Query
      if (psychomotorSearchQuery.trim()) {
        const q = psychomotorSearchQuery.toLowerCase().trim();
        const fullName = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
        const phone = (p.phone || p.parent_phone || '').toLowerCase();
        const folder = (p.folder_number || p.file_number || '').toLowerCase();
        const idStr = String(p.id);
        const reason = (p.anamnesis_data?.consultation_reason || '').toLowerCase();
        const therapy = (p.anamnesis_data?.therapy_type || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();

        const matches = fullName.includes(q) || phone.includes(q) || folder.includes(q) || idStr.includes(q) || reason.includes(q) || therapy.includes(q) || notes.includes(q);
        if (!matches) return false;
      }

      // 2. Age Filter
      const calculatedAge = p.age || (p.birth_date ? (new Date().getFullYear() - new Date(p.birth_date).getFullYear()) : null);
      if (selectedAgeFilter === 'child') {
        if (calculatedAge !== null && calculatedAge >= 12) return false;
      } else if (selectedAgeFilter === 'adult') {
        if (calculatedAge !== null && calculatedAge < 12) return false;
      }

      // 3. Gender Filter
      if (selectedGenderFilter !== 'all') {
        if (p.gender !== selectedGenderFilter) return false;
      }

      return true;
    });
  }, [patients, psychomotorSearchQuery, selectedAgeFilter, selectedGenderFilter]);

  // Banner Dropdown Filtered Patients
  const filteredBannerPatients = useMemo(() => {
    if (!bannerSearchQuery.trim()) return patients;
    const q = bannerSearchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const fullName = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
      const phone = (p.phone || p.parent_phone || '').toLowerCase();
      const folder = (p.folder_number || p.file_number || '').toLowerCase();
      const idStr = String(p.id);
      return fullName.includes(q) || phone.includes(q) || folder.includes(q) || idStr.includes(q);
    });
  }, [patients, bannerSearchQuery]);

  const handleOpenModal = (patient = null, tab = 'body_map') => {
    const target = patient || selectedPatient || (patients.length > 0 ? patients[0] : null);
    setSelectedPatient(target);
    setInitialModalTab(tab);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      {/* Top Banner & Quick Actions */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 relative overflow-hidden bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 space-x-reverse px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>وحدة التأهيل النفس-حركي والتكامل الحسي المتقدمة</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            لوحة التقييم الحركي والتناسق العضلي
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            منظومة سريرية متكاملة لتقييم النغمة العضلية، التوازن الإستاتيكي والديناميكي، المخطط الجسدي، والجانبية مع بطارية اختبارات معيارية وحساب تلقائي لدرجات الشدة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10 w-full md:w-auto">
          {/* Quick Select Patient Popover Button */}
          <div className="relative" ref={bannerPickerRef}>
            <button
              type="button"
              onClick={() => setIsBannerPickerOpen(!isBannerPickerOpen)}
              className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-between gap-2 shadow-md min-w-[170px]"
            >
              <div className="flex items-center gap-2 truncate">
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {selectedPatient ? `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() || selectedPatient.name : 'اختر مريضاً للبدء...'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isBannerPickerOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 animate-fadeIn">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو رقم الملف..."
                    value={bannerSearchQuery}
                    onChange={(e) => setBannerSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  {bannerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBannerSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                  {filteredBannerPatients.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      لا يوجد مريض مطابق لـ "{bannerSearchQuery}"
                    </div>
                  ) : (
                    filteredBannerPatients.map((p) => {
                      const isSelected = selectedPatient?.id === p.id;
                      const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || `مريض #${p.id}`;
                      const folder = p.folder_number || p.file_number || `#${p.id}`;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setIsBannerPickerOpen(false);
                            setBannerSearchQuery('');
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

          <button
            type="button"
            onClick={() => handleOpenModal(null, 'body_map')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 space-x-reverse shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 text-emerald-200 fill-emerald-200" />
            <span>🏃‍♂️ إطلاق خريطة الجسد والفحص الحركي</span>
          </button>
        </div>
      </div>

      {/* Specialty Pillars Cards (Interactive Direct Shortcuts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => handleOpenModal(null, 'body_map')}
          className="text-right glass-card rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-500/60 hover:bg-emerald-950/20 space-y-2.5 transition-all group hover:scale-[1.02] shadow-lg focus:outline-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
              <span>خريطة الجسد والنغمة</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">التبويب 1</span>
            </span>
            <span className="text-xl group-hover:scale-125 transition-transform">🏃</span>
          </div>
          <div className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">Sensory & Tonus Body Map</div>
          <p className="text-xs text-slate-400 leading-relaxed">مجسم بشري تفاعلي لتحديد مناطق فرط التوتر، الرخاوة، الباراتونيا، والدفاع اللمسي مع خريطة حرارية.</p>
          <div className="text-[11px] text-emerald-400/90 font-bold flex items-center gap-1 pt-1">
            <span>فتح خريطة الجسد المباشرة</span>
            <ArrowRight className="w-3 h-3 group-hover:-translate-x-1 transition-transform rotate-180" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleOpenModal(null, 'balance')}
          className="text-right glass-card rounded-2xl p-5 border border-teal-500/20 hover:border-teal-500/60 hover:bg-teal-950/20 space-y-2.5 transition-all group hover:scale-[1.02] shadow-lg focus:outline-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-400 uppercase flex items-center gap-1.5">
              <span>التوازن والجانبية</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono font-bold">التبويب 2</span>
            </span>
            <span className="text-xl group-hover:scale-125 transition-transform">⚖️</span>
          </div>
          <div className="text-lg font-black text-white group-hover:text-teal-300 transition-colors">Balance & Lateralization</div>
          <p className="text-xs text-slate-400 leading-relaxed">اختبارات رومبرغ، ميقاتية الوقوف على قدم واحدة (Flamant)، ومصفوفة هاريس لتشخيص الهيمنة المتجانسة أو المتصالبة.</p>
          <div className="text-[11px] text-teal-400/90 font-bold flex items-center gap-1 pt-1">
            <span>فتح مصفوفة فحص التوازن</span>
            <ArrowRight className="w-3 h-3 group-hover:-translate-x-1 transition-transform rotate-180" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleOpenModal(null, 'lateralization')}
          className="text-right glass-card rounded-2xl p-5 border border-cyan-500/20 hover:border-cyan-500/60 hover:bg-cyan-950/20 space-y-2.5 transition-all group hover:scale-[1.02] shadow-lg focus:outline-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
              <span>التآزر والتنظيم الفضائي</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">التبويب 3</span>
            </span>
            <span className="text-xl group-hover:scale-125 transition-transform">🧭</span>
          </div>
          <div className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">Praxies & Spatio-Temporel</div>
          <p className="text-xs text-slate-400 leading-relaxed">فحص حركات الدمية السريعة (ديادوكوكينيزيا)، إصبع-أنف، قبضة القلم، واختبار بياجيه-هيد لليمين واليسار.</p>
          <div className="text-[11px] text-cyan-400/90 font-bold flex items-center gap-1 pt-1">
            <span>فتح فحص البراكسيا والمكان</span>
            <ArrowRight className="w-3 h-3 group-hover:-translate-x-1 transition-transform rotate-180" />
          </div>
        </button>
      </div>

      {/* Interactive Clinical Relaxation & Snoezelen Studio Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
            🧘
          </div>
          <div>
            <h4 className="text-xs font-black text-white">استوديوهات الاسترخاء والتكامل الحسي التفاعلية</h4>
            <p className="text-[11px] text-slate-400">جلسات جاكبسون الموجهة، الغرفة الحسية الهادئة، والتحفيز الثنائي لخط الوسط</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPmrOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <span>🧘‍♂️ استرخاء جاكبسون (PMR)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSnoezelenOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <span>🌌 استوديو سنوزلين (Snoezelen)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsBilateralOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <span>🪞 التحفيز الثنائي (Bilateral)</span>
          </button>
        </div>
      </div>

      {/* Patients Roster with Live Search & Instant Psychomotor Assessment */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-black text-white">مرضى المتابعة والتأهيل الحركي المسجلين بالعيادة</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ابحث عن أي مريض لفتح خريطة الجسد أو تشغيل اختبارات التوازن والجانبية فوراً
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 font-bold text-xs font-mono">
              عرض {filteredPatients.length} من أصل {patients.length} مريض
            </span>
          </div>
        </div>

        {/* Live Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-emerald-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={psychomotorSearchQuery}
              onChange={(e) => setPsychomotorSearchQuery(e.target.value)}
              placeholder="ابحث باسم المريض، رقم الملف، الهاتف، أو سبب الاستشارة..."
              className="w-full pl-8 pr-10 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-emerald-500 focus:outline-none transition-all shadow-inner"
            />
            {psychomotorSearchQuery && (
              <button
                type="button"
                onClick={() => setPsychomotorSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <span className="text-[11px] text-slate-400 font-bold ml-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-400" />
              <span>تصفية:</span>
            </span>

            {/* Age Filter */}
            {[
              { id: 'all', label: 'الكل' },
              { id: 'child', label: 'أطفال (< 12)' },
              { id: 'adult', label: 'يافعين وكبار' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedAgeFilter(f.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  selectedAgeFilter === f.id
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

            {/* Gender Filter */}
            {[
              { id: 'all', label: 'الجنس' },
              { id: 'male', label: 'ذكور' },
              { id: 'female', label: 'إناث' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGenderFilter(g.id)}
                className={`px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  selectedGenderFilter === g.id
                    ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {g.label}
              </button>
            ))}

            {(psychomotorSearchQuery || selectedAgeFilter !== 'all' || selectedGenderFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setPsychomotorSearchQuery('');
                  setSelectedAgeFilter('all');
                  setSelectedGenderFilter('all');
                }}
                className="px-2 py-1 rounded-xl text-[10px] text-rose-400 hover:bg-rose-500/10 transition font-bold"
                title="إلغاء كافة التصفية"
              >
                إعادة ضبط
              </button>
            )}
          </div>
        </div>

        {/* Patients Cards List */}
        <div className="space-y-3">
          {filteredPatients.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center text-slate-400 text-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <p className="font-bold text-slate-300">
                {psychomotorSearchQuery
                  ? `لم يتم العثور على مريض يطابق البحث "${psychomotorSearchQuery}"`
                  : 'لا يوجد مرضى يطابقون خيارات التصفية الحالية'}
              </p>
              <p className="text-[11px] text-slate-500">
                يرجى التأكد من كتابة الاسم أو رقم الهاتف أو رقم الملف بدقة أو إعادة ضبط خيارات التصفية.
              </p>
              {(psychomotorSearchQuery || selectedAgeFilter !== 'all' || selectedGenderFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setPsychomotorSearchQuery('');
                    setSelectedAgeFilter('all');
                    setSelectedGenderFilter('all');
                  }}
                  className="mt-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                >
                  عرض جميع المرضى
                </button>
              )}
            </div>
          ) : (
            filteredPatients.map((p) => {
              const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || `مريض #${p.id}`;
              const folderNum = p.folder_number || p.file_number || `#${p.id}`;
              const age = p.age || (p.birth_date ? (new Date().getFullYear() - new Date(p.birth_date).getFullYear()) : null);
              const rawReason = p.anamnesis_data?.consultation_reason;
              const consultationReason =
                rawReason && typeof rawReason === 'string' && rawReason.trim().length > 2
                  ? rawReason.trim()
                  : 'تقييم نفسي حركي وتكامل حسي وتوازن';

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 transition-all group"
                >
                  <div className="flex items-center space-x-3.5 space-x-reverse min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                      {(fullName[0] || 'م')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-1">
                        <span className="font-black text-sm text-white group-hover:text-emerald-300 transition-colors">
                          {fullName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {p.gender === 'male' ? 'ذكر' : 'أنثى'}
                        </span>
                        {age && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                            {age} سنة
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                          ملف: {folderNum}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 truncate max-w-md sm:max-w-xl">
                        الشكوى / سبب الاستشارة: <span className="text-slate-200">{consultationReason}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.phone && (
                      <span className="text-xs font-mono text-slate-400 font-semibold ml-2 flex items-center gap-1 hidden sm:flex">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{p.phone}</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenModal(p, 'balance')}
                      className="px-3.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all shadow-sm active:scale-95"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>التوازن والجانبية</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenModal(p, 'body_map')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>خريطة الجسد والفحص</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Render Master Modal */}
      {isModalOpen && (
        <PsychomotorBodyMapModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          patient={selectedPatient}
          patients={patients}
          initialTab={initialModalTab}
        />
      )}

      {/* Render Jacobson PMR Relaxation Studio Modal */}
      {isPmrOpen && (
        <PmrRelaxationStudioModal
          isOpen={isPmrOpen}
          onClose={() => setIsPmrOpen(false)}
          patientName={selectedPatient ? `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() : 'المريض'}
        />
      )}

      {/* Render Snoezelen Multi-Sensory Studio Modal */}
      {isSnoezelenOpen && (
        <SnoezelenCalmStudioModal
          isOpen={isSnoezelenOpen}
          onClose={() => setIsSnoezelenOpen(false)}
          patientName={selectedPatient ? `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() : 'المريض'}
        />
      )}

      {/* Render Bilateral Midline & Mirror Tracing Matrix Modal */}
      {isBilateralOpen && (
        <BilateralMidlineStudioModal
          isOpen={isBilateralOpen}
          onClose={() => setIsBilateralOpen(false)}
          patientName={selectedPatient ? `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() : 'المريض'}
        />
      )}
    </div>
  );
}

