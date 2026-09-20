import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Clock, Calendar, Plus, User, Stethoscope, Brain, CheckCircle, 
  XCircle, AlertCircle, Trash2, Search, Filter, Activity, 
  Sparkles, RefreshCw, FileText, ChevronRight, UserCheck, Play,
  Users, ChevronDown, Check, X, Phone, MessageSquare, Share2,
  Info, HelpCircle, Layers, ArrowUpRight, BarChart2, ShieldCheck,
  TrendingUp, Award, BookOpen, HeartHandshake, Eye, Printer, Copy
} from 'lucide-react';
import { sessionApi, appointmentApi, whatsappApi } from '../api';
import SessionModal from './SessionModal';
import SessionClosureSummaryModal from './sessions/SessionClosureSummaryModal';

export default function TherapySessions({ tenant, patients = [], onOpenAddSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('patient_cards'); // 'patient_cards' | 'timeline_log' | 'analytics'
  const [showGuide, setShowGuide] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientFilterId, setSelectedPatientFilterId] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all'); // all, orthophony, psychology, psychomotor, parent_guidance
  const [statusFilter, setStatusFilter] = useState('all'); // all, present, absent, excused

  // Searchable Patient Dropdown in Filter Bar
  const [isPatientFilterOpen, setIsPatientFilterOpen] = useState(false);
  const [patientFilterSearch, setPatientFilterSearch] = useState('');
  const patientFilterRef = useRef(null);

  // In-cockpit Session Modal State
  const [isLocalSessionModalOpen, setIsLocalSessionModalOpen] = useState(false);
  const [modalTargetPatientId, setModalTargetPatientId] = useState(null);

  // Patient Trajectory Drawer / Detail Modal
  const [selectedTrajectoryPatient, setSelectedTrajectoryPatient] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Session Closure & Homework Summary Modal State
  const [selectedClosureSession, setSelectedClosureSession] = useState(null);
  const [seedingDemo, setSeedingDemo] = useState(false);

  // Click outside listener for patient filter
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (patientFilterRef.current && !patientFilterRef.current.contains(e.target)) {
        setIsPatientFilterOpen(false);
      }
    };
    if (isPatientFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPatientFilterOpen]);

  const fetchSessions = async (retryAutoSeed = true) => {
    setLoading(true);
    try {
      const res = await sessionApi.list({ per_page: 250 });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setSessions(list);

      if (list.length === 0 && retryAutoSeed) {
        try {
          await sessionApi.seedDemo();
          const secondTry = await sessionApi.list({ per_page: 250 });
          const secondList = Array.isArray(secondTry) ? secondTry : (secondTry?.data || []);
          if (secondList.length > 0) {
            setSessions(secondList);
          }
        } catch (seedErr) {
          console.warn('Auto seed demo sessions notice:', seedErr);
        }
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setSeedingDemo(true);
    try {
      await sessionApi.seedDemo();
      await fetchSessions(false);
    } catch (err) {
      console.error('Error manual seeding demo sessions:', err);
    } finally {
      setSeedingDemo(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف سجل هذه الجلسة التأهيلية نهائياً ؟')) return;
    try {
      await sessionApi.delete(id);
      fetchSessions();
    } catch (err) {
      alert(err.message || 'خطأ أثناء حذف الجلسة');
    }
  };

  // Helper: Patient display name
  const getPatientDisplayName = (p) => {
    if (!p) return '';
    const combined = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    return combined || p.full_name || p.name || `مريض #${p.id}`;
  };

  // Filtered Sessions List
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedPatientFilterId && String(s.patient_id) !== String(selectedPatientFilterId)) return false;
      if (specialtyFilter !== 'all' && s.specialty !== specialtyFilter) return false;
      if (statusFilter !== 'all' && s.attendance_status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = `${s.patient?.first_name || ''} ${s.patient?.last_name || ''}`.toLowerCase();
        const docName = (s.specialist?.name || '').toLowerCase();
        const notes = (s.progress_notes || '').toLowerCase();
        const exercises = Array.isArray(s.exercises_targeted) ? s.exercises_targeted.join(' ').toLowerCase() : '';
        if (!pName.includes(q) && !docName.includes(q) && !notes.includes(q) && !exercises.includes(q)) return false;
      }
      return true;
    });
  }, [sessions, selectedPatientFilterId, specialtyFilter, statusFilter, searchQuery]);

  // Group Sessions by Patient for Dossier Cards
  const patientTrajectories = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const pid = s.patient_id || s.patient?.id;
      if (!pid) return;
      if (!map[pid]) {
        map[pid] = {
          patient: s.patient || patients.find((p) => String(p.id) === String(pid)) || { id: pid, first_name: 'مريض', last_name: `#${pid}` },
          sessions: [],
          totalDuration: 0,
          presentCount: 0,
          absentCount: 0,
          excusedCount: 0,
          exercises: new Set(),
          specialties: new Set(),
          lastSessionDate: null,
          latestNotes: ''
        };
      }
      map[pid].sessions.push(s);
      map[pid].totalDuration += (s.duration_minutes || 45);
      if (s.attendance_status === 'present') map[pid].presentCount++;
      else if (s.attendance_status === 'absent') map[pid].absentCount++;
      else if (s.attendance_status === 'excused') map[pid].excusedCount++;

      if (s.specialty) map[pid].specialties.add(s.specialty);
      if (Array.isArray(s.exercises_targeted)) {
        s.exercises_targeted.forEach((ex) => map[pid].exercises.add(ex));
      }

      const sDate = s.session_date;
      if (!map[pid].lastSessionDate || new Date(sDate) > new Date(map[pid].lastSessionDate)) {
        map[pid].lastSessionDate = sDate;
        map[pid].latestNotes = s.progress_notes || '';
      }
    });

    // Also include patients that might not have sessions yet if filtered
    return Object.values(map).sort((a, b) => new Date(b.lastSessionDate || 0) - new Date(a.lastSessionDate || 0));
  }, [sessions, patients]);

  // Filtered Patient Trajectories for Card Tab
  const filteredTrajectories = useMemo(() => {
    return patientTrajectories.filter((item) => {
      if (selectedPatientFilterId && String(item.patient.id) !== String(selectedPatientFilterId)) return false;
      if (specialtyFilter !== 'all' && !item.specialties.has(specialtyFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = getPatientDisplayName(item.patient).toLowerCase();
        const folder = (item.patient.folder_number || item.patient.file_number || '').toLowerCase();
        const phone = (item.patient.phone || '').toLowerCase();
        const notes = (item.latestNotes || '').toLowerCase();
        if (!pName.includes(q) && !folder.includes(q) && !phone.includes(q) && !notes.includes(q)) return false;
      }
      return true;
    });
  }, [patientTrajectories, selectedPatientFilterId, specialtyFilter, searchQuery]);

  // Filtered Patients for Filter Combobox
  const filteredQuickPatients = useMemo(() => {
    if (!patientFilterSearch.trim()) return patients;
    const q = patientFilterSearch.toLowerCase().trim();
    return patients.filter((p) => {
      const name = getPatientDisplayName(p).toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const folder = (p.folder_number || p.file_number || '').toLowerCase();
      const idStr = String(p.id || '');
      return name.includes(q) || phone.includes(q) || folder.includes(q) || idStr.includes(q);
    });
  }, [patients, patientFilterSearch]);

  const activeSelectedPatient = useMemo(() => {
    if (!selectedPatientFilterId) return null;
    return patients.find((p) => String(p.id) === String(selectedPatientFilterId)) || null;
  }, [patients, selectedPatientFilterId]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const total = sessions.length;
    const present = sessions.filter((s) => s.attendance_status === 'present').length;
    const absent = sessions.filter((s) => s.attendance_status === 'absent').length;
    const excused = sessions.filter((s) => s.attendance_status === 'excused').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 45), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    const orthophonie = sessions.filter((s) => s.specialty === 'orthophony').length;
    const psychologie = sessions.filter((s) => s.specialty === 'psychology').length;
    const psychomotor = sessions.filter((s) => s.specialty === 'psychomotor' || s.specialty === 'psychomotricite').length;
    const guidance = sessions.filter((s) => s.specialty === 'parent_guidance').length;

    const uniquePatientsCount = new Set(sessions.map((s) => s.patient_id)).size;

    return { total, present, absent, excused, rate, totalHours, orthophonie, psychologie, psychomotor, guidance, uniquePatientsCount };
  }, [sessions]);

  // Send WhatsApp Progress Summary to Parent
  const handleSendWhatsAppSummary = (patientObj, sessionList) => {
    const phone = patientObj?.phone ? patientObj.phone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = phone.startsWith('0') ? '213' + phone.substring(1) : phone;
    const pName = getPatientDisplayName(patientObj);
    const presentCount = sessionList.filter((s) => s.attendance_status === 'present').length;
    const rate = sessionList.length > 0 ? Math.round((presentCount / sessionList.length) * 100) : 100;
    const lastSession = sessionList[0];

    const msg = `السلام عليكم ورحمة الله،\nتحية طيبة من ${tenant?.name || 'العيادة السريرية'}.\n\n📊 ملخص المتابعة والتأهيل للمريض: ${pName}\n• إجمالي الحصص المنجزة: ${sessionList.length} حصة\n• نسبة الالتزام والمواظبة: ${rate}%\n${lastSession ? `• آخر ملاحظة سريرية (${lastSession.session_date?.split('T')[0]}): ${lastSession.progress_notes || 'تقدم ممتاز'}` : ''}\n\nنشكركم على حسن التعاون والمواظبة لدعم مسار التأهيل.`;

    if (cleanPhone) {
      whatsappApi.sendMessage({
        phone: cleanPhone,
        message: msg,
        patient_id: patientObj.id,
        service_type: 'session_summary',
      }).catch((err) => console.warn('Cloud dispatch failed:', err));
    }

    const encoded = encodeURIComponent(msg);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleOpenAddSessionForPatient = (patientId) => {
    setModalTargetPatientId(patientId);
    setIsLocalSessionModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans" dir="rtl">
      
      {/* 1. Cockpit Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                قمرة الجلسات والمتابعة التأهيلية
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[11px] font-bold">
                Séances & Suivi Clinique
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {tenant?.name || 'المنظومة السريرية'} • المتابعة التراكمية للحصص، التمارين المتقنة، ونسب المواظبة والتطور السريري عبر الزمن
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
          <button
            onClick={() => setShowGuide((prev) => !prev)}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              showGuide 
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="دليل ومميزات القمرة"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>{showGuide ? 'إخفاء الدليل' : 'دليل ومميزات القمرة'}</span>
          </button>

          <button
            onClick={fetchSessions}
            title="تحديث البيانات"
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all hover:rotate-180 duration-500"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              setModalTargetPatientId(null);
              if (onOpenAddSession) onOpenAddSession();
              else setIsLocalSessionModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 space-x-reverse px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            <span>توثيق جلسة تأهيلية جديدة</span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Clinical Guide & Identity Explainer Banner */}
      {showGuide && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-cyan-950/30 border border-cyan-500/30 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              <h2 className="text-sm sm:text-base font-black text-white">
                دليل ومميزات قمرة المتابعة التأهيلية (Clinical Trajectory Guide)
              </h2>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              إغلاق الدليل ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Purpose */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold text-sm">
                🎯
              </div>
              <h3 className="text-xs font-black text-cyan-300">ما هو دور هذه القمرة في البرنامج؟</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                هذه القمرة هي <strong>السجل التراكمي للأثر الطبي (Longitudinal Tracker)</strong>؛ حيث توثق كل حصة تأهيلية خضع لها المريض عبر الزمن، مع رصد دقيق للتمارين المتقنة والملاحظات السريرية ونسب المواظبة.
              </p>
            </div>

            {/* Card 2: Difference */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center font-bold text-sm">
                ⚖️
              </div>
              <h3 className="text-xs font-black text-teal-300">الفرق بين قمرات المنظومة الثلاث:</h3>
              <ul className="text-[11px] text-slate-300 space-y-1 leading-relaxed">
                <li>• <strong>قمرة المواعيد</strong>: لجدولة الحجوزات وتنظيم قاعة الانتظار.</li>
                <li>• <strong>قمرة الجلسة المباشرة</strong>: لإدارة الحصة الحية بالسبورة والميقاتية.</li>
                <li>• <strong>قمرة المتابعة التأهيلية</strong>: المسار التاريخي التراكمي وقياس تحسن الحالة.</li>
              </ul>
            </div>

            {/* Card 3: Top Features */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold text-sm">
                ⭐
              </div>
              <h3 className="text-xs font-black text-indigo-300">المميزات الـ 5 التي توفرها لك:</h3>
              <ul className="text-[11px] text-slate-300 space-y-1 leading-relaxed">
                <li>1. <strong>ملفات المرضى التأهيلية</strong>: حساب نسبة الحضور (Adherence %).</li>
                <li>2. <strong>بنك التمارين السريرية</strong>: تجميع كل التمارين المتقنة عبر الحصص.</li>
                <li>3. <strong>مشاركة WhatsApp</strong>: إرسال ملخص الحصة وتمارين المنزل للولي.</li>
                <li>4. <strong>التصدير للحصائل</strong>: ربط عدد الحصص بمولد الحصيلة (Master Bilan).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. KPI Statistics Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-center space-x-3.5 space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            {loading ? (
              <div className="h-6 w-12 bg-slate-800 animate-pulse rounded-md my-1" />
            ) : (
              <div className="text-lg sm:text-xl font-black text-white">{kpis.total}</div>
            )}
            <div className="text-[11px] text-slate-400 font-medium">إجمالي الجلسات الموثقة</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-center space-x-3.5 space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            {loading ? (
              <div className="h-6 w-12 bg-slate-800 animate-pulse rounded-md my-1" />
            ) : (
              <div className="text-lg sm:text-xl font-black text-emerald-300">{kpis.rate}%</div>
            )}
            <div className="text-[11px] text-slate-400 font-medium">نسبة المواظبة والالتزام</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-center space-x-3.5 space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            {loading ? (
              <div className="h-6 w-12 bg-slate-800 animate-pulse rounded-md my-1" />
            ) : (
              <div className="text-lg sm:text-xl font-black text-indigo-300">{kpis.totalHours} س</div>
            )}
            <div className="text-[11px] text-slate-400 font-medium">ساعات التأهيل المنجزة</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-center space-x-3.5 space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            {loading ? (
              <div className="h-6 w-12 bg-slate-800 animate-pulse rounded-md my-1" />
            ) : (
              <div className="text-lg sm:text-xl font-black text-white">{kpis.uniquePatientsCount}</div>
            )}
            <div className="text-[11px] text-slate-400 font-medium">مرضى بمسارات تأهيلية</div>
          </div>
        </div>
      </div>

      {/* 4. Controls Bar: Tabs Switcher + Multi-Filter & Search */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-xl">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('patient_cards')}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'patient_cards'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>بطاقات المسار التأهيلي للمرضى</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {patientTrajectories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('timeline_log')}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'timeline_log'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>السجل الزمني الشامل للحصص</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {sessions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>تحليلات المواظبة والأداء</span>
            </button>
          </div>

          {/* Quick Clear Filters if active */}
          {(selectedPatientFilterId || specialtyFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedPatientFilterId('');
                setSpecialtyFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>إعادة ضبط الفلاتر</span>
            </button>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 1. Live Patient Searchable Combobox */}
          <div className="relative" ref={patientFilterRef}>
            <div
              onClick={() => setIsPatientFilterOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-slate-950 border cursor-pointer transition-all shadow-inner text-xs ${
                activeSelectedPatient
                  ? 'border-cyan-500/80 bg-cyan-950/20 text-white ring-1 ring-cyan-500/30'
                  : isPatientFilterOpen
                  ? 'border-cyan-500 ring-2 ring-cyan-500/20 text-slate-200'
                  : 'border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse min-w-0">
                {activeSelectedPatient ? (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {(getPatientDisplayName(activeSelectedPatient)[0] || 'م')}
                  </div>
                ) : (
                  <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                )}

                <div className="truncate font-bold">
                  {activeSelectedPatient ? (
                    <span className="text-cyan-200">
                      {getPatientDisplayName(activeSelectedPatient)}
                      <span className="text-[10px] text-slate-400 font-mono mr-1">
                        ({activeSelectedPatient.folder_number || `#${activeSelectedPatient.id}`})
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">
                      جميع المرضى بالعيادة ({patients.length})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 space-x-reverse shrink-0 mr-1">
                {selectedPatientFilterId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPatientFilterId('');
                    }}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                    title="عرض جميع المرضى"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isPatientFilterOpen ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </div>
            </div>

            {/* Dropdown Popover */}
            {isPatientFilterOpen && (
              <div
                className="absolute z-50 mt-1.5 right-0 left-0 sm:w-80 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-hidden p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl"
                dir="rtl"
              >
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-cyan-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={patientFilterSearch}
                    onChange={(e) => setPatientFilterSearch(e.target.value)}
                    placeholder="ابحث بالاسم، رقم الملف، أو الهاتف..."
                    className="w-full pl-8 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-cyan-500 focus:outline-none transition-all shadow-inner"
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

                <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
                  <div
                    onClick={() => {
                      setSelectedPatientFilterId('');
                      setIsPatientFilterOpen(false);
                      setPatientFilterSearch('');
                    }}
                    className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs font-bold ${
                      !selectedPatientFilterId
                        ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>جميع المرضى بالعيادة ({patients.length})</span>
                    </div>
                    {!selectedPatientFilterId && <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />}
                  </div>

                  <div className="h-px bg-slate-800 my-1" />

                  {filteredQuickPatients.length === 0 ? (
                    <div className="py-4 text-center text-slate-500 text-xs">
                      لا يوجد مريض مطابق لـ "{patientFilterSearch}"
                    </div>
                  ) : (
                    filteredQuickPatients.map((p) => {
                      const isSelected = String(p.id) === String(selectedPatientFilterId);
                      const fullName = getPatientDisplayName(p);
                      const folderNum = p.folder_number || p.file_number || `CL-${p.id}`;

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatientFilterId(String(p.id));
                            setIsPatientFilterOpen(false);
                            setPatientFilterSearch('');
                          }}
                          className={`p-2 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                            isSelected
                              ? 'bg-cyan-600/20 border-cyan-500/50 text-white shadow-sm'
                              : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2 space-x-reverse min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {(fullName[0] || 'م')}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">
                                <span className={isSelected ? 'text-cyan-300' : 'text-slate-200'}>
                                  {fullName}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                ملف: {folderNum} {p.phone ? `• ${p.phone}` : ''}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Text Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، التمرين، أو الملاحظة..."
              className="w-full pr-9 pl-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
            />
          </div>

          {/* 3. Specialty Filter */}
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500 shadow-inner"
          >
            <option value="all">جميع التخصصات السريرية</option>
            <option value="orthophony">🗣️ أرطوفونيا وتخاطب</option>
            <option value="psychology">🧠 علم النفس وعلاج CBT</option>
            <option value="psychomotor">🏃‍♂️ تأهيل حركي ونفسي</option>
            <option value="parent_guidance">👨‍👩‍👧 إرشاد والدي وأسري</option>
          </select>

          {/* 4. Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500 shadow-inner"
          >
            <option value="all">جميع حالات المواظبة والحضور</option>
            <option value="present">✅ حاضر (Présent)</option>
            <option value="absent">❌ غائب (Absent)</option>
            <option value="excused">⚠️ معتذر (Excusé)</option>
          </select>
        </div>
      </div>

      {/* 5. Main Tab Views */}
      
      {/* TAB 1: PATIENT REHABILITATION TRAJECTORY CARDS */}
      {activeTab === 'patient_cards' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/60 rounded-3xl border border-slate-800">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
              <span>جاري تحميل بطاقات المسارات التأهيلية للمرضى...</span>
            </div>
          ) : filteredTrajectories.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">لا توجد بطاقات مسار تأهيلي مطابقة للفلاتر</h3>
              <p className="text-xs text-slate-500">قم بتسجيل جلسات جديدة للمرضى للبدء في تتبع مساراتهم السريرية أو توليد جلسات تجريبية مكتملة.</p>
              <button
                type="button"
                onClick={handleSeedDemo}
                disabled={seedingDemo}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition-all inline-flex items-center gap-2 mx-auto"
              >
                <Sparkles className={`w-4 h-4 text-amber-300 ${seedingDemo ? 'animate-spin' : ''}`} />
                <span>{seedingDemo ? 'جاري تهيئة جلسات تجريبية مكتملة...' : 'توليد جلسات تأهيلية مكتملة للاختبار (Seed Demo)'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrajectories.map((item) => {
                const p = item.patient;
                const pName = getPatientDisplayName(p);
                const total = item.sessions.length;
                const rate = total > 0 ? Math.round((item.presentCount / total) * 100) : 100;
                const exercisesList = Array.from(item.exercises);

                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-3.5">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
                            {(pName[0] || 'م')}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {pName}
                            </h3>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              ملف: {p.folder_number || p.file_number || `CL-${p.id}`} {p.age ? `• ${p.age} سنة` : ''}
                            </div>
                          </div>
                        </div>

                        {/* Attendance Pill */}
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border ${
                          rate >= 80 
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            : rate >= 60 
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        }`}>
                          {rate}% مواظبة
                        </span>
                      </div>

                      {/* Trajectory KPIs */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-3.5 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">الجلسات</span>
                          <span className="text-sm font-black text-cyan-300">{total}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">حاضر</span>
                          <span className="text-sm font-black text-emerald-400">{item.presentCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">غياب/اعتذار</span>
                          <span className="text-sm font-black text-rose-400">{item.absentCount + item.excusedCount}</span>
                        </div>
                      </div>

                      {/* Progress Adherence Bar */}
                      <div className="space-y-1 mb-3.5">
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                          <span>معدل الالتزام بالبرنامج</span>
                          <span className="font-mono">{item.presentCount} من {total} حصص</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              rate >= 80 ? 'bg-gradient-to-r from-teal-400 to-emerald-400' : rate >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>

                      {/* Exercises Mastered Chips */}
                      {exercisesList.length > 0 && (
                        <div className="space-y-1.5 mb-3.5">
                          <span className="text-[10px] font-bold text-slate-400 block">التمارين والبروتوكولات المستهدفة:</span>
                          <div className="flex flex-wrap gap-1">
                            {exercisesList.slice(0, 3).map((ex, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 text-[10px]">
                                {ex}
                              </span>
                            ))}
                            {exercisesList.length > 3 && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[10px]">
                                +{exercisesList.length - 3} تمارين
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Latest Clinician Note */}
                      {item.latestNotes && (
                        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-[11px] text-slate-300 mb-3.5 line-clamp-2 italic">
                          "{item.latestNotes}"
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTrajectoryPatient(item)}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>عرض المسار التراكمي</span>
                      </button>

                      <button
                        onClick={() => {
                          const latestSession = item.sessions?.[0] || {
                            patient: item.patient,
                            session_date: item.lastSessionDate,
                            attendance_status: 'present',
                            exercises_targeted: Array.from(item.exercises),
                            progress_notes: item.latestNotes || 'إتمام أهداف الجلسة وتحقيق الاستجابة المطلوبة'
                          };
                          setSelectedClosureSession(latestSession);
                        }}
                        className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all"
                        title="ملخص إنهاء الجلسة والواجبات المنزلية (WhatsApp)"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenAddSessionForPatient(p.id)}
                        className="p-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 transition-all"
                        title="تسجيل جلسة جديدة لهذا المريض"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleSendWhatsAppSummary(p, item.sessions)}
                        className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all"
                        title="إرسال تقرير الالتزام للولي عبر WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CHRONOLOGICAL DETAILED SESSIONS LOG TABLE */}
      {activeTab === 'timeline_log' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">التاريخ والتوقيت</th>
                  <th className="px-5 py-4">المريض المفحوص</th>
                  <th className="px-5 py-4">التخصص والأخصائي المشرف</th>
                  <th className="px-5 py-4 text-center">المدة</th>
                  <th className="px-5 py-4 text-center">حالة المواظبة</th>
                  <th className="px-5 py-4">الملاحظات السريرية والتمارين المنجزة</th>
                  <th className="px-5 py-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                        <span>جاري تحميل سجلات الجلسات...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Clock className="w-8 h-8 text-slate-600" />
                        <span className="font-bold text-sm text-slate-400">لا توجد جلسات مسجلة مطابقة للبحث</span>
                        <p className="text-xs text-slate-600">يمكنك تسجيل جلسة جديدة أو توليد جلسات تأهيلية تجريبية مكتملة.</p>
                        <button
                          type="button"
                          onClick={handleSeedDemo}
                          disabled={seedingDemo}
                          className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-2"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${seedingDemo ? 'animate-spin' : ''}`} />
                          <span>{seedingDemo ? 'جاري التوليد...' : 'توليد جلسات تجريبية مكتملة (Seed Demo)'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-mono text-slate-300 whitespace-nowrap">
                        <div className="font-bold text-white text-xs">{s.session_date?.split('T')[0] || s.session_date}</div>
                        <div className="text-[11px] text-slate-500">{s.session_date?.split('T')[1]?.substring(0, 5) || '10:00'}</div>
                      </td>

                      <td className="px-5 py-4 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-300 flex items-center justify-center text-xs font-black">
                            {s.patient ? (s.patient.first_name?.[0] || 'م') : 'م'}
                          </div>
                          <div>
                            <div>{s.patient ? `${s.patient.first_name} ${s.patient.last_name}` : 'غير محدد'}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              ملف: {s.patient?.folder_number || s.patient?.file_number || `CL-${s.patient_id}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-200">
                          {s.specialty === 'orthophony' ? (
                            <Stethoscope className="w-3.5 h-3.5 text-fuchsia-400" />
                          ) : s.specialty === 'psychology' ? (
                            <Brain className="w-3.5 h-3.5 text-cyan-400" />
                          ) : s.specialty === 'psychomotor' || s.specialty === 'psychomotricite' ? (
                            <Activity className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>
                            {s.specialty === 'orthophony' 
                              ? 'أرطوفونيا' 
                              : s.specialty === 'psychology' 
                              ? 'دعم نفسي' 
                              : s.specialty === 'psychomotor' || s.specialty === 'psychomotricite'
                              ? 'تأهيل حركي'
                              : 'إرشاد والدي'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{s.specialist?.name || 'الأخصائي المتابع'}</div>
                      </td>

                      <td className="px-5 py-4 text-center font-mono font-bold text-slate-300">
                        {s.duration_minutes || 45} د
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          s.attendance_status === 'present'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : s.attendance_status === 'absent'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {s.attendance_status === 'present' && <CheckCircle className="w-3 h-3" />}
                          {s.attendance_status === 'absent' && <XCircle className="w-3 h-3" />}
                          {s.attendance_status === 'excused' && <AlertCircle className="w-3 h-3" />}
                          <span>
                            {s.attendance_status === 'present' ? 'حاضر' : s.attendance_status === 'absent' ? 'غائب' : 'معتذر'}
                          </span>
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-300 max-w-md">
                        <p className="line-clamp-2 leading-relaxed">{s.progress_notes || 'لا توجد ملاحظات تفصيلية مسجلة.'}</p>
                        {s.exercises_targeted && Array.isArray(s.exercises_targeted) && s.exercises_targeted.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {s.exercises_targeted.map((ex, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 text-[10px] font-medium">
                                {ex}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-left whitespace-nowrap">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setSelectedClosureSession(s)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 transition-colors"
                            title="ملخص الإنهاء والواجبات وإرسال WhatsApp"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              const found = patientTrajectories.find((pt) => pt.patient.id === s.patient_id);
                              if (found) setSelectedTrajectoryPatient(found);
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                            title="عرض المسار التأهيلي للمريض"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 text-slate-500 transition-colors"
                            title="حذف سجل الجلسة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CLINICAL ANALYTICS & ADHERENCE */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Specialty Breakdown Card */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  <span>توزيع الحصص التأهيلية حسب التخصص</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">الإجمالي: {kpis.total}</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'الأرطوفونيا والتخاطب', count: kpis.orthophonie, color: 'bg-fuchsia-500', text: 'text-fuchsia-400' },
                  { label: 'علم النفس العيادي والـ CBT', count: kpis.psychologie, color: 'bg-cyan-500', text: 'text-cyan-400' },
                  { label: 'التأهيل الحركي والنفسي', count: kpis.psychomotor, color: 'bg-amber-500', text: 'text-amber-400' },
                  { label: 'الإرشاد الوالدي والأسري', count: kpis.guidance, color: 'bg-emerald-500', text: 'text-emerald-400' }
                ].map((spec, i) => {
                  const pct = kpis.total > 0 ? Math.round((spec.count / kpis.total) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-300">{spec.label}</span>
                        <span className={spec.text}>{spec.count} حصة ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div className={`h-full rounded-full ${spec.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attendance & Adherence Distribution */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>مؤشرات المواظبة والالتزام السريري</span>
                </h3>
                <span className="text-xs text-emerald-400 font-bold">{kpis.rate}% نسبة الحضور</span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-center">
                <div className="space-y-1">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                  <span className="text-[11px] text-slate-400 block">حضور تام</span>
                  <span className="text-base font-black text-emerald-300">{kpis.present}</span>
                </div>

                <div className="space-y-1">
                  <XCircle className="w-5 h-5 text-rose-400 mx-auto" />
                  <span className="text-[11px] text-slate-400 block">غياب غير مبرر</span>
                  <span className="text-base font-black text-rose-400">{kpis.absent}</span>
                </div>

                <div className="space-y-1">
                  <AlertCircle className="w-5 h-5 text-amber-400 mx-auto" />
                  <span className="text-[11px] text-slate-400 block">اعتذار مسبق</span>
                  <span className="text-base font-black text-amber-300">{kpis.excused}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                يساعد تتبع نسب الغياب والاعتذار في الكشف المبكر عن احتمالات الانتكاسة السريرية وإعادة تفعيل التواصل مع أولياء الأمور لضمان استمرارية الخطة التأهيلية.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. Patient Longitudinal Trajectory Slide-over Modal / Drawer */}
      {selectedTrajectoryPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl custom-scrollbar">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  {(getPatientDisplayName(selectedTrajectoryPatient.patient)[0] || 'م')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">
                      {getPatientDisplayName(selectedTrajectoryPatient.patient)}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-bold">
                      ملف المسار التأهيلي التراكمي
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ملف رقم: {selectedTrajectoryPatient.patient.folder_number || selectedTrajectoryPatient.patient.file_number || `CL-${selectedTrajectoryPatient.patient.id}`} • {selectedTrajectoryPatient.patient.phone || 'بدون هاتف'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTrajectoryPatient(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Trajectory KPIs Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">إجمالي الحصص</span>
                <span className="text-base font-black text-cyan-300">{selectedTrajectoryPatient.sessions.length} حصص</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">نسبة المواظبة</span>
                <span className="text-base font-black text-emerald-400">
                  {selectedTrajectoryPatient.sessions.length > 0 
                    ? Math.round((selectedTrajectoryPatient.presentCount / selectedTrajectoryPatient.sessions.length) * 100)
                    : 100}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">ساعات التأهيل</span>
                <span className="text-base font-black text-indigo-300">
                  {Math.round((selectedTrajectoryPatient.totalDuration / 60) * 10) / 10} ساعة
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">التمارين المتقنة</span>
                <span className="text-base font-black text-purple-300">
                  {selectedTrajectoryPatient.exercises.size} تمارين
                </span>
              </div>
            </div>

            {/* Mastered Exercises Cloud */}
            {selectedTrajectoryPatient.exercises.size > 0 && (
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/60 space-y-2">
                <span className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>سجل التمارين والبروتوكولات السريرية التي تدرب عليها المريض:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedTrajectoryPatient.exercises).map((ex, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-cyan-300 text-xs font-medium">
                      ✓ {ex}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Chronological Sessions Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>سجل الجلسات والملاحظات السريرية بالترتيب الزمني ({selectedTrajectoryPatient.sessions.length}):</span>
              </h4>

              <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {selectedTrajectoryPatient.sessions.map((s, idx) => (
                  <div key={s.id || idx} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-mono text-slate-300">
                        <span className="font-bold text-white">حصة #{selectedTrajectoryPatient.sessions.length - idx}</span>
                        <span>• {s.session_date?.split('T')[0] || s.session_date}</span>
                        <span className="text-slate-500">({s.duration_minutes || 45} دقيقة)</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        s.attendance_status === 'present' 
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : s.attendance_status === 'absent'
                          ? 'bg-rose-500/15 text-rose-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}>
                        {s.attendance_status === 'present' ? 'حاضر' : s.attendance_status === 'absent' ? 'غائب' : 'معتذر'}
                      </span>
                    </div>

                    {s.progress_notes && (
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                        {s.progress_notes}
                      </p>
                    )}

                    {s.exercises_targeted && Array.isArray(s.exercises_targeted) && s.exercises_targeted.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.exercises_targeted.map((ex, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-slate-900 text-teal-300 text-[10px]">
                            • {ex}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handleSendWhatsAppSummary(selectedTrajectoryPatient.patient, selectedTrajectoryPatient.sessions)}
                className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>إرسال تقرير التطور عبر WhatsApp للولي</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedTrajectoryPatient(null);
                    handleOpenAddSessionForPatient(selectedTrajectoryPatient.patient.id);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل جلسة جديدة</span>
                </button>

                <button
                  onClick={() => setSelectedTrajectoryPatient(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Local In-Cockpit Session Modal */}
      {isLocalSessionModalOpen && (
        <SessionModal
          isOpen={isLocalSessionModalOpen}
          onClose={() => setIsLocalSessionModalOpen(false)}
          onSuccess={() => {
            fetchSessions();
            setIsLocalSessionModalOpen(false);
          }}
          patients={patients}
          tenant={tenant}
          initialPatientId={modalTargetPatientId}
        />
      )}

      {/* 8. Session Closure & Homework WhatsApp Modal */}
      {selectedClosureSession && (
        <SessionClosureSummaryModal
          isOpen={Boolean(selectedClosureSession)}
          onClose={() => setSelectedClosureSession(null)}
          session={selectedClosureSession}
          tenant={tenant}
        />
      )}

    </div>
  );
}
