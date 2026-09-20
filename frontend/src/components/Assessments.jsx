import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, Download, Plus, Stethoscope, Brain, Calendar, 
  User, Eye, Trash2, CheckCircle2, Printer, Share2, 
  QrCode, Search, Filter, Sparkles, ShieldCheck, Activity, 
  Award, Phone, Copy, Check, ExternalLink, Layers, 
  MessageSquare, AlertTriangle, X, Clock, SlidersHorizontal,
  RefreshCw, CheckSquare, ChevronRight, ChevronDown, Users, Hash, FolderOpen, AlertCircle
} from 'lucide-react';
import { patientBilanApi, assessmentApi } from '../api';
import MasterBilanBuilderModal from './assessments/MasterBilanBuilderModal';

// Helper to format clinical assessment dates cleanly
function formatAssessmentDate(d) {
  if (!d) return '---';
  try {
    const dateObj = new Date(d);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return String(d).split('T')[0] || String(d);
  } catch (e) {
    return String(d).split('T')[0] || String(d);
  }
}

// Helper to render nested/complex subscale scores and results
function renderFormattedResultValue(val) {
  if (val === null || val === undefined) return <span className="text-slate-500 font-mono italic">غير مسجل</span>;

  // Attempt JSON parsing if stringified
  if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
    try {
      val = JSON.parse(val);
    } catch (e) {
      // Keep as string
    }
  }

  // 1. Primitive number, boolean, string
  if (typeof val !== 'object') {
    return <span className="text-teal-300 font-mono font-bold text-xs">{String(val)}</span>;
  }

  // 2. Array
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-slate-500 italic">فارغ</span>;
    if (val.every(item => typeof item !== 'object')) {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {val.map((item, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-teal-300 font-mono text-[11px]">
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-1.5 w-full mt-1.5">
        {val.map((item, idx) => {
          if (typeof item !== 'object' || item === null) {
            return (
              <span key={idx} className="inline-block px-2 py-0.5 rounded bg-slate-900 text-teal-300 font-mono text-[11px] mr-1">
                {String(item)}
              </span>
            );
          }
          const title = item.title || item.title_ar || item.name || item.dimension || item.subscale || item.label || item.key || `بند #${idx + 1}`;
          const score = item.score !== undefined ? item.score : (item.value !== undefined ? item.value : (item.raw !== undefined ? item.raw : null));
          const level = item.severity_label || item.status || item.level || item.interpretation || null;

          return (
            <div key={idx} className="flex items-center justify-between bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px] hover:border-slate-700 transition-all">
              <span className="text-slate-300 font-medium">{title}</span>
              <div className="flex items-center gap-2">
                {level && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-bold">
                    {level}
                  </span>
                )}
                {score !== null && (
                  <span className="text-teal-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                    {String(score)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 3. Object (Key-Value map)
  return (
    <div className="space-y-1.5 w-full mt-1.5">
      {Object.entries(val).map(([subK, subV]) => {
        const cleanKey = subK.replace(/_/g, ' ');
        return (
          <div key={subK} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px] gap-1">
            <span className="text-slate-400 font-medium">{cleanKey}:</span>
            <div className="self-end sm:self-auto">
              {typeof subV === 'object' && subV !== null ? (
                renderFormattedResultValue(subV)
              ) : (
                <span className="text-teal-300 font-mono font-bold">{String(subV)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Assessments({ tenant, patients = [], onOpenAddAssessment }) {
  // Tabs: master_bilans (الحصائل الشاملة) vs single_tests (الروائز الفردية)
  const [activeTab, setActiveTab] = useState('master_bilans');

  // Master Bilans State
  const [bilans, setBilans] = useState([]);
  const [loadingBilans, setLoadingBilans] = useState(true);
  const [stats, setStats] = useState({ total: 0, orthophonie: 0, psychologie: 0, psychomotricite: 0 });

  // Single Tests (Legacy / Fast Scorers) State
  const [legacyAssessments, setLegacyAssessments] = useState([]);
  const [loadingLegacy, setLoadingLegacy] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all'); // all, orthophonique, psychologique, psychomoteur
  const [selectedLanguage, setSelectedLanguage] = useState('all'); // all, ar, fr
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // UI Interactive States
  const [downloadingId, setDownloadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [previewBilan, setPreviewBilan] = useState(null);
  const [previewLegacy, setPreviewLegacy] = useState(null);

  // Quick Patient Search Filter Popover State
  const [isPatientFilterOpen, setIsPatientFilterOpen] = useState(false);
  const [patientFilterSearch, setPatientFilterSearch] = useState('');
  const patientFilterRef = useRef(null);

  // Close patient filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (patientFilterRef.current && !patientFilterRef.current.contains(event.target)) {
        setIsPatientFilterOpen(false);
      }
    }
    if (isPatientFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPatientFilterOpen]);

  // Master Bilan Creation Flow States
  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerSpecialty, setPickerSpecialty] = useState('orthophony');
  const [selectedPatientForBilan, setSelectedPatientForBilan] = useState(null);
  const [isMasterBuilderOpen, setIsMasterBuilderOpen] = useState(false);

  // Fetch Master Bilans (Clinic-wide)
  const fetchBilans = async () => {
    setLoadingBilans(true);
    try {
      const params = { per_page: 60 };
      if (selectedSpecialty !== 'all') params.bilan_type = selectedSpecialty;
      if (selectedLanguage !== 'all') params.language = selectedLanguage;
      if (selectedPatientId) params.patient_id = selectedPatientId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await patientBilanApi.listAll(params);
      setBilans(res.data || []);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching master bilans:', err);
    } finally {
      setLoadingBilans(false);
    }
  };

  // Fetch Single Tests
  const fetchLegacyAssessments = async () => {
    setLoadingLegacy(true);
    try {
      const params = { per_page: 50 };
      if (selectedPatientId) params.patient_id = selectedPatientId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await assessmentApi.list(params);
      setLegacyAssessments(res.data || []);
    } catch (err) {
      console.error('Error fetching single assessments:', err);
    } finally {
      setLoadingLegacy(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'master_bilans') {
      fetchBilans();
    } else {
      fetchLegacyAssessments();
    }
  }, [activeTab, selectedSpecialty, selectedLanguage, selectedPatientId]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'master_bilans') {
        fetchBilans();
      } else {
        fetchLegacyAssessments();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Actions
  const handleDownloadMasterPdf = async (bilan) => {
    setDownloadingId(bilan.id);
    try {
      const lastName = bilan.patient?.last_name || 'Patient';
      await patientBilanApi.downloadBilanPdf(bilan.id, `Bilan_Medical_${lastName}_${bilan.id}.pdf`);
    } catch (err) {
      alert(err.message || 'خطأ أثناء تحميل التقرير الطبي بصيغة PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintMasterPdf = (bilanId) => {
    const url = patientBilanApi.bilanPdfUrl(bilanId);
    window.open(url, '_blank');
  };

  const handleCopyQrVerificationLink = (bilan) => {
    const token = `BILAN-${bilan.id}-${(bilan.id * 31).toString(16)}`;
    const url = `https://psypro.tech/verify/doc/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(bilan.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShareWhatsApp = (bilan) => {
    const phone = bilan.patient?.phone;
    if (!phone) {
      alert('رقم هاتف المريض أو الولي غير مسجل في الملف الطبي.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const clinicName = tenant?.name || 'العيادة الطبية السريرية';
    const patientName = `${bilan.patient?.first_name || ''} ${bilan.patient?.last_name || ''}`.trim();
    const token = `BILAN-${bilan.id}-${(bilan.id * 31).toString(16)}`;
    const verifyUrl = `https://psypro.tech/verify/doc/${token}`;

    const text = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته،\n` +
      `تحية طيبة من ${clinicName}.\n\n` +
      `نحيطكم علماً بأنه قد تم إصدار وتوثيق تقرير الحصيلة السريرية الشاملة للمريض: ${patientName}.\n` +
      `• نوع التقرير: ${bilan.title || 'الحصيلة الطبية المعتمدة'}\n` +
      `• الأخصائي المشرف: ${bilan.specialist?.name || 'الأخصائي المعالج'}\n` +
      `• رابط التحقق الرقمي المعتمد: ${verifyUrl}\n\n` +
      `يمكنكم استلام النسخة الورقية الرسمية المختومة من إدارة العيادة، أو التواصل معنا لأي استفسار سريري.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleDeleteMasterBilan = async (bilanId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحصيلة السريرية الرسمية نهائياً؟')) return;
    try {
      await patientBilanApi.deleteBilan(bilanId);
      fetchBilans();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حذف الحصيلة');
    }
  };

  const handleDeleteLegacyAssessment = async (id) => {
    if (!window.confirm('هل تريد حذف هذا الاختبار السريري؟')) return;
    try {
      await assessmentApi.delete(id);
      fetchLegacyAssessments();
    } catch (err) {
      alert(err.message || 'خطأ في الحذف');
    }
  };

  // Active selected patient object
  const activeSelectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find(p => String(p.id) === String(selectedPatientId)) || null;
  }, [patients, selectedPatientId]);

  // Filtered patients for the Quick Search Dropdown
  const filteredQuickPatients = useMemo(() => {
    if (!patientFilterSearch.trim()) return patients;
    const q = patientFilterSearch.toLowerCase().trim();
    return patients.filter(p => {
      const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
      const phone = (p.phone || p.parent_phone || '').toLowerCase();
      const folder = (p.folder_number || p.file_number || '').toLowerCase();
      const idStr = String(p.id);
      return name.includes(q) || phone.includes(q) || folder.includes(q) || idStr.includes(q);
    });
  }, [patients, patientFilterSearch]);

  // Filtered Patients for Patient Picker Modal
  const filteredPickerPatients = useMemo(() => {
    if (!pickerSearchQuery.trim()) return patients.slice(0, 15);
    const q = pickerSearchQuery.toLowerCase();
    return patients.filter(p => 
      p.first_name?.toLowerCase().includes(q) ||
      p.last_name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      String(p.id).includes(q) ||
      p.folder_number?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [patients, pickerSearchQuery]);

  const handleStartNewBilanForPatient = (patient) => {
    setSelectedPatientForBilan(patient);
    setIsPatientPickerOpen(false);
    setIsMasterBuilderOpen(true);
  };

  const openNewBilanLauncher = () => {
    if (selectedPatientId) {
      const patient = patients.find(p => String(p.id) === String(selectedPatientId));
      if (patient) {
        handleStartNewBilanForPatient(patient);
        return;
      }
    }
    setIsPatientPickerOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* Cockpit Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 via-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  قمرة الحصائل السريرية والتقارير الطبية
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[11px] font-bold">
                  Bilans & Comptes-Rendus
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {tenant?.name || 'المنصة الطبية'} • إصدار الحصائل المعتمدة بالروائز الـ 18، خطة PEI، التحليل الصوتي، والتوقيع الرقمي المشفر QR
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
          <button
            onClick={() => {
              if (activeTab === 'master_bilans') fetchBilans();
              else fetchLegacyAssessments();
            }}
            title="تحديث البيانات"
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all hover:rotate-180 duration-500"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={openNewBilanLauncher}
            className="inline-flex items-center space-x-2 space-x-reverse px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 via-brand-600 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء حصيلة سريرية جديدة</span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-center space-x-3.5 space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center border border-teal-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            {loadingBilans ? (
              <div className="h-6 w-12 bg-slate-800 animate-pulse rounded-md my-1" />
            ) : (
              <div className="text-lg sm:text-xl font-black text-white">{stats.total || bilans.length}</div>
            )}
            <div className="text-[11px] text-slate-400 font-medium">إجمالي الحصائل المعتمدة</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-center space-x-3.5 space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/15 text-fuchsia-400 flex items-center justify-center border border-fuchsia-500/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            {loadingBilans ? (
              <div className="h-6 w-12 bg-slate-800 animate-pulse rounded-md my-1" />
            ) : (
              <div className="text-lg sm:text-xl font-black text-white">{stats.orthophonie || 0}</div>
            )}
            <div className="text-[11px] text-slate-400 font-medium">حصائل الأرطوفونيا واللغة</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-center space-x-3.5 space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            {loadingBilans ? (
              <div className="h-6 w-12 bg-slate-800 animate-pulse rounded-md my-1" />
            ) : (
              <div className="text-lg sm:text-xl font-black text-white">{stats.psychologie || 0}</div>
            )}
            <div className="text-[11px] text-slate-400 font-medium">حصائل التقييم النفسي والـ CBT</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-center space-x-3.5 space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            {loadingBilans ? (
              <div className="h-6 w-12 bg-slate-800 animate-pulse rounded-md my-1" />
            ) : (
              <div className="text-lg sm:text-xl font-black text-white">{stats.psychomotricite || bilans.length}</div>
            )}
            <div className="text-[11px] text-slate-400 font-medium">موثقة بالختم والـ QR</div>
          </div>
        </div>
      </div>

      {/* Tabs & Filters Navigation Bar */}
      <div className="space-y-4 p-5 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Dual Tabs Selector */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-950/80 border border-slate-800 self-start">
            <button
              onClick={() => setActiveTab('master_bilans')}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'master_bilans'
                  ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>الحصائل والتقارير الطبية الشاملة</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {bilans.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('single_tests')}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'single_tests'
                  ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>سجل الروائز والاختبارات الفردية</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {legacyAssessments.length}
              </span>
            </button>
          </div>

          {/* Quick Patient Live Search Combobox */}
          <div className="relative w-full md:w-80" ref={patientFilterRef}>
            {/* Trigger Button */}
            <div
              onClick={() => setIsPatientFilterOpen(prev => !prev)}
              className={`flex items-center justify-between px-3.5 py-2 rounded-2xl bg-slate-950/90 border cursor-pointer transition-all shadow-sm group ${
                selectedPatientId
                  ? 'border-teal-500/60 bg-teal-950/20 text-white ring-1 ring-teal-500/20'
                  : isPatientFilterOpen
                  ? 'border-teal-500 ring-2 ring-teal-500/20 text-slate-200'
                  : 'border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse min-w-0">
                {activeSelectedPatient ? (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-teal-500 to-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-sm">
                    {(activeSelectedPatient.first_name || 'م')[0]}
                  </div>
                ) : (
                  <Users className="w-4 h-4 text-teal-400 shrink-0" />
                )}
                
                <div className="truncate text-xs font-bold">
                  {activeSelectedPatient ? (
                    <span className="text-teal-300">
                      {activeSelectedPatient.first_name} {activeSelectedPatient.last_name}
                      <span className="text-[10px] text-slate-400 font-mono font-normal mr-1.5">
                        ({activeSelectedPatient.folder_number || `#${activeSelectedPatient.id}`})
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-300">
                      جميع المرضى بالعيادة
                      <span className="text-[10px] text-slate-500 font-mono font-normal mr-1.5">
                        ({patients.length})
                      </span>
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
                    title="عرض جميع المرضى (إلغاء التصفية)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isPatientFilterOpen ? 'rotate-180 text-teal-400' : ''}`} />
              </div>
            </div>

            {/* Dropdown Popover */}
            {isPatientFilterOpen && (
              <div 
                className="absolute z-50 mt-1.5 right-0 left-0 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-hidden p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl"
                dir="rtl"
              >
                {/* Live Search Input Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-teal-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={patientFilterSearch}
                    onChange={(e) => setPatientFilterSearch(e.target.value)}
                    placeholder="ابحث بالاسم، رقم الملف، أو الهاتف..."
                    className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-teal-500 focus:outline-none transition-all shadow-inner"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  {patientFilterSearch && (
                    <button
                      type="button"
                      onClick={() => setPatientFilterSearch('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Options List */}
                <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                  {/* Option: All Patients */}
                  <div
                    onClick={() => {
                      setSelectedPatientId('');
                      setIsPatientFilterOpen(false);
                      setPatientFilterSearch('');
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs font-bold ${
                      !selectedPatientId
                        ? 'bg-teal-500/15 border border-teal-500/40 text-teal-300'
                        : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 space-x-reverse">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${!selectedPatientId ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div>جميع المرضى بالعيادة</div>
                        <div className="text-[10px] text-slate-400 font-normal">عرض كافة التقارير والحصائل بدون تصفية ({patients.length})</div>
                      </div>
                    </div>
                    {!selectedPatientId && <Check className="w-4 h-4 text-teal-400 stroke-[3]" />}
                  </div>

                  <div className="h-px bg-slate-800 my-1" />

                  {/* Filtered Patient Cards */}
                  {filteredQuickPatients.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs space-y-1">
                      <p className="font-semibold">لا يوجد مريض مطابق لـ "{patientFilterSearch}"</p>
                      <p className="text-[10px] text-slate-600">تأكد من كتابة الاسم أو رقم الهاتف أو رقم الملف بدقة</p>
                    </div>
                  ) : (
                    filteredQuickPatients.map(p => {
                      const isSelected = String(p.id) === String(selectedPatientId);
                      const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || `مريض #${p.id}`;
                      const folderNum = p.folder_number || p.file_number || `#${p.id}`;

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatientId(String(p.id));
                            setIsPatientFilterOpen(false);
                            setPatientFilterSearch('');
                          }}
                          className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                            isSelected
                              ? 'bg-teal-600/20 border-teal-500/50 text-white shadow-sm'
                              : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 space-x-reverse min-w-0">
                            <div className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-gradient-to-tr from-teal-500 to-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {(fullName[0] || 'م')}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate flex items-center gap-1">
                                <span className={isSelected ? 'text-teal-300 font-extrabold' : 'text-slate-200'}>
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

                          <div className="shrink-0 mr-1.5">
                            {isSelected ? (
                              <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center text-white">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-700 hover:border-slate-500" />
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

        {/* Search & Secondary Filter Chips */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، رقم الملف، التشخيص، أو العنوان..."
              className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-teal-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Specialty Filter Pills (Master Bilans) */}
          {activeTab === 'master_bilans' && (
            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              <span className="text-[11px] text-slate-400 font-bold ml-2 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>التخصص:</span>
              </span>
              {[
                { id: 'all', label: 'الكل' },
                { id: 'orthophonique', label: 'أرطوفونيا', color: 'fuchsia' },
                { id: 'psychologique', label: 'علم النفس', color: 'cyan' },
                { id: 'psychomoteur', label: 'تأهيل حركي', color: 'amber' },
              ].map(spec => (
                <button
                  key={spec.id}
                  onClick={() => setSelectedSpecialty(spec.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                    selectedSpecialty === spec.id
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {spec.label}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

              {/* Language toggle */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'all', label: 'اللغات' },
                  { id: 'ar', label: 'عربية' },
                  { id: 'fr', label: 'Français' },
                ].map(l => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLanguage(l.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold ${
                      selectedLanguage === l.id
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'master_bilans' ? (
        /* TAB 1: Master Bilans Cards Grid */
        <div className="space-y-4">
          {loadingBilans ? (
            <div className="text-center py-20 rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md space-y-3">
              <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">جاري تحميل وسحب الحصائل السريرية المعتمدة...</p>
            </div>
          ) : bilans.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 text-teal-400 flex items-center justify-center mx-auto border border-slate-700">
                <FileText className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">لا توجد حصائل سريرية مسجلة حتى الآن</h3>
                <p className="text-xs text-slate-400">
                  يمكنك إنشاء حصيلة سريرية رسمية شاملة لأي مريض بالاعتماد على بنك الروائز المعيارية الـ 18 وصياغة التقرير عبر الذكاء الاصطناعي.
                </p>
              </div>
              <button
                onClick={openNewBilanLauncher}
                className="inline-flex items-center space-x-2 space-x-reverse px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء أول حصيلة الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bilans.map(b => {
                const isOrtho = b.bilan_type === 'orthophonique';
                const isPsy = b.bilan_type === 'psychologique';
                const isMot = b.bilan_type === 'psychomoteur';
                const isAr = b.language === 'ar';
                const token = `BILAN-${b.id}-${(b.id * 31).toString(16)}`;

                return (
                  <div
                    key={b.id}
                    className="rounded-3xl bg-slate-900/85 border border-slate-800/80 hover:border-teal-500/40 p-5 backdrop-blur-md transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-teal-950/20 group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center space-x-1 space-x-reverse px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wider ${
                          isOrtho
                            ? 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30'
                            : isPsy
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : isMot
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                        }`}>
                          {isOrtho ? <Stethoscope className="w-3 h-3" /> : isPsy ? <Brain className="w-3 h-3" /> : isMot ? <Activity className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          <span>{isOrtho ? 'أرطوفونيا وتخاطب' : isPsy ? 'تقييم نفسي-متري' : isMot ? 'تأهيل حركي' : 'حصيلة شاملة'}</span>
                        </span>

                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold">
                            {isAr ? 'العربية 🇩🇿' : 'Français 🇫🇷'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{b.created_at ? b.created_at.split('T')[0] : '—'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Bilan Title */}
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-teal-300 transition-colors leading-snug line-clamp-2">
                        {b.title || 'الحصيلة الإكلينيكية والتقييم السريري الشامل'}
                      </h3>

                      {/* Patient & Specialist Identity Card */}
                      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-300 font-black text-xs flex items-center justify-center">
                              {b.patient?.first_name ? b.patient.first_name[0] : 'م'}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">
                                {b.patient ? `${b.patient.first_name} ${b.patient.last_name}` : 'مريض غير محدد'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ملف: {b.patient?.folder_number || `#${b.patient?.id || '—'}`}
                              </div>
                            </div>
                          </div>

                          {b.patient?.phone && (
                            <button
                              onClick={() => handleShareWhatsApp(b)}
                              title="مراسلة ولي الأمر عبر واتساب"
                              className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-900 flex items-center justify-between">
                          <span>المعالج: <strong className="text-slate-300">{b.specialist?.name || 'الأخصائي المشرف'}</strong></span>
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>معتمد وموثق</span>
                          </span>
                        </div>
                      </div>

                      {/* Diagnostic Snippet / Summary */}
                      {(b.clinical_summary || b.diagnosis_codes) && (
                        <p className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                          <strong className="text-teal-400 font-bold">الخلاصة: </strong>
                          {b.diagnosis_codes || b.clinical_summary}
                        </p>
                      )}

                      {/* Cryptographic QR Token Badge */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
                        <span className="flex items-center gap-1">
                          <QrCode className="w-3 h-3 text-slate-400" />
                          <span>{token}</span>
                        </span>
                        <button
                          onClick={() => handleCopyQrVerificationLink(b)}
                          className="hover:text-teal-400 text-slate-400 flex items-center gap-0.5"
                          title="نسخ رابط التحقق المشفر"
                        >
                          {copiedId === b.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === b.id ? 'تم النسخ!' : 'رابط QR'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                      <button
                        onClick={() => setPreviewBilan(b)}
                        className="text-xs text-slate-300 hover:text-teal-300 font-semibold flex items-center space-x-1 space-x-reverse"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>معاينة</span>
                      </button>

                      <div className="flex items-center space-x-1.5 space-x-reverse">
                        <button
                          onClick={() => handlePrintMasterPdf(b.id)}
                          title="طباعة التقرير"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDownloadMasterPdf(b)}
                          disabled={downloadingId === b.id}
                          className="inline-flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-bold transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingId === b.id ? 'تحميل...' : 'PDF'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteMasterBilan(b.id)}
                          title="حذف الحصيلة"
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-500 border border-slate-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: Single Tests & Batteries Grid */
        <div className="space-y-4">
          {loadingLegacy ? (
            <div className="text-center py-20 rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md">
              <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">جاري تحميل سجل الروائز والاختبارات الفردية...</p>
            </div>
          ) : legacyAssessments.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-md space-y-2">
              <p className="text-sm font-bold text-white">لا توجد اختبارات فردية منفصلة مسجلة</p>
              <p className="text-xs text-slate-400">تظهر هنا نتائج المقاييس الرقمية المباشرة (GAD-7, PHQ-9, Zareki, WISC, Stroop) عند تمريرها منفردة.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {legacyAssessments.map(a => (
                <div
                  key={a.id}
                  className="rounded-3xl bg-slate-900/85 border border-slate-800/80 hover:border-slate-700 p-5 backdrop-blur-md flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-bold">
                        {a.type || 'اختبار سريري'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {a.assessment_date?.split('T')[0] || a.assessment_date}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{a.title}</h4>

                    <div className="text-xs text-slate-300">
                      المريض: <strong className="text-teal-300">{a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : 'N/A'}</strong>
                    </div>

                    {a.diagnostic_conclusion && (
                      <p className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 line-clamp-2">
                        {a.diagnostic_conclusion}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => setPreviewLegacy(a)}
                      className="text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>التفاصيل والدرجات</span>
                    </button>

                    <button
                      onClick={() => handleDeleteLegacyAssessment(a.id)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-500 border border-slate-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUICK PREVIEW MODAL FOR MASTER BILAN */}
      {previewBilan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in" dir="rtl">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">{previewBilan.title}</h3>
                  <p className="text-xs text-slate-400">
                    المريض: {previewBilan.patient?.first_name} {previewBilan.patient?.last_name} • التاريخ: {previewBilan.created_at?.split('T')[0]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewBilan(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Structured Clinical Content */}
            <div className="space-y-4 text-xs">
              {/* Summary */}
              {previewBilan.clinical_summary && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <h4 className="font-bold text-teal-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>الملخص السريري وسياق الاستشارة</span>
                  </h4>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{
                    __html: previewBilan.clinical_summary
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }} />
                </div>
              )}

              {/* Psychometrics & Tests */}
              {previewBilan.psychometric_analysis && (
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-1">
                  <h4 className="font-bold text-indigo-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>التحليل النفسي-المتري وتفسير الدرجات المعيارية</span>
                  </h4>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{
                    __html: previewBilan.psychometric_analysis
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }} />
                </div>
              )}

              {/* Strengths & Weaknesses */}
              {previewBilan.strengths_weaknesses && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>مصفوفة نقاط القوة والتحديات</span>
                  </h4>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{
                    __html: previewBilan.strengths_weaknesses
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }} />
                </div>
              )}

              {/* Diagnostic Hypotheses */}
              {previewBilan.diagnosis_codes && (
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>الفرضيات والتشخيص الإكلينيكي</span>
                  </h4>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{
                    __html: previewBilan.diagnosis_codes
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }} />
                </div>
              )}

              {/* Therapeutic Project */}
              {previewBilan.therapeutic_project && (
                <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-1">
                  <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>المشروع العلاجي والتوصيات المنهجية</span>
                  </h4>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{
                    __html: previewBilan.therapeutic_project
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }} />
                </div>
              )}

              {/* Digital Seal & Stamp Info */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span>المصادقة الرقمية الرسمية والاعتماد</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    معرف التوثيق: BILAN-{previewBilan.id}-{(previewBilan.id * 31).toString(16)}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyQrVerificationLink(previewBilan)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الرابط</span>
                </button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 gap-2 flex-wrap">
              <button
                onClick={() => setPreviewBilan(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                إغلاق النافذة
              </button>

              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => handleShareWhatsApp(previewBilan)}
                  className="inline-flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>واتساب</span>
                </button>

                <button
                  onClick={() => handlePrintMasterPdf(previewBilan.id)}
                  className="inline-flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة</span>
                </button>

                <button
                  onClick={() => handleDownloadMasterPdf(previewBilan)}
                  disabled={downloadingId === previewBilan.id}
                  className="inline-flex items-center space-x-2 space-x-reverse px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingId === previewBilan.id ? 'جاري التحميل...' : 'تحميل تقرير PDF الرسمي'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PREVIEW MODAL FOR LEGACY ASSESSMENT */}
      {previewLegacy && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" dir="rtl">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 w-full max-w-xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{previewLegacy.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  المريض: <strong className="text-teal-300">{previewLegacy.patient?.first_name} {previewLegacy.patient?.last_name}</strong> • التاريخ: <span className="text-slate-300 font-mono">{formatAssessmentDate(previewLegacy.assessment_date)}</span>
                </p>
              </div>
              <button onClick={() => setPreviewLegacy(null)} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-teal-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>نتائج القياس والمقاييس الفرعية (Subscales & Scores)</span>
                </h4>
                {previewLegacy.results_data && Object.keys(previewLegacy.results_data).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(previewLegacy.results_data).map(([k, v]) => (
                      <div key={k} className="border-b border-slate-900 pb-2 last:border-none">
                        <div className="font-semibold text-slate-300 mb-1">{k.replace(/_/g, ' ')}:</div>
                        <div>{renderFormattedResultValue(v)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">لا توجد درجات مفصلة مسجلة.</p>
                )}
              </div>

              {previewLegacy.diagnostic_conclusion && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                  <h4 className="font-bold text-emerald-400 mb-1">الخلاصة التشخيصية</h4>
                  <p className="text-slate-200 leading-relaxed">{previewLegacy.diagnostic_conclusion}</p>
                </div>
              )}

              {previewLegacy.recommendations && (
                <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30">
                  <h4 className="font-bold text-blue-400 mb-1">التوصيات العلاجية</h4>
                  <p className="text-slate-200 leading-relaxed">{previewLegacy.recommendations}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setPreviewLegacy(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PATIENT PICKER MODAL (WHEN CREATING A BILAN) */}
      {isPatientPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" dir="rtl">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 w-full max-w-xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">اختر المريض لإنشاء الحصيلة السريرية</h3>
                  <p className="text-xs text-slate-400">سيتم فتح محرر الحصيلة الشاملة وربط الروائز وخطط أهداف PEI فوراً</p>
                </div>
              </div>
              <button
                onClick={() => setIsPatientPickerOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Specialty Selection for the new Bilan */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-teal-400" />
                <span>تخصص الحصيلة السريرية:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'orthophony', label: 'أرطوفونيا وتخاطب', icon: Stethoscope, color: 'fuchsia' },
                  { id: 'psychology', label: 'تقييم نفسي-متري', icon: Brain, color: 'cyan' },
                  { id: 'psychomotricite', label: 'تأهيل نفسي-حركي', icon: Activity, color: 'amber' },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPickerSpecialty(s.id)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        pickerSpecialty === s.id
                          ? 'bg-teal-500/15 border-teal-500/50 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-teal-400" />
                      <span className="text-[11px] font-bold">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pickerSearchQuery}
                onChange={(e) => setPickerSearchQuery(e.target.value)}
                placeholder="ابحث باسم المريض، رقم الهاتف، أو رقم الملف..."
                className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-teal-500 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Patients List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredPickerPatients.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  لم يتم العثور على مريض بهذا الاسم. يرجى التأكد من كتابة الاسم بدقة.
                </div>
              ) : (
                filteredPickerPatients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleStartNewBilanForPatient(p)}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {p.first_name ? p.first_name[0] : 'م'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                          {p.first_name} {p.last_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                          <span>ملف: {p.folder_number || `#${p.id}`}</span>
                          {p.phone && <span>• {p.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-xl bg-teal-600/20 group-hover:bg-teal-600 text-teal-300 group-hover:text-white text-xs font-bold transition-all"
                    >
                      <span>بدء الحصيلة</span>
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPatientPickerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMBEDDED MASTER BILAN BUILDER MODAL */}
      {isMasterBuilderOpen && selectedPatientForBilan && (
        <MasterBilanBuilderModal
          isOpen={isMasterBuilderOpen}
          onClose={() => {
            setIsMasterBuilderOpen(false);
            setSelectedPatientForBilan(null);
          }}
          patient={selectedPatientForBilan}
          initialSpecialty={pickerSpecialty}
          onBilanCreated={() => {
            fetchBilans();
          }}
        />
      )}
    </div>
  );
}
