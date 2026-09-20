import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, 
  Search, 
  Sparkles, 
  Layers, 
  BookOpen, 
  Sliders, 
  SlidersHorizontal, 
  Play, 
  CheckCircle2, 
  Award, 
  FileText, 
  Activity, 
  User, 
  Stethoscope, 
  ChevronLeft, 
  Filter, 
  X,
  ExternalLink,
  Send,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import InteractiveAssessmentRunner from './InteractiveAssessmentRunner';
import SendTestAssignmentModal from '../therapy/SendTestAssignmentModal';

export default function ClinicalTestsCatalogHub({ 
  patientId = null, 
  patientName = null, 
  onSelectTest = null,
  patients = [],
  tenant = null
}) {
  const [internalPatients, setInternalPatients] = useState([]);

  useEffect(() => {
    if (!patients || patients.length === 0) {
      patientApi.list({ per_page: 100 })
        .then(res => {
          const list = res.patients?.data || res.patients || res.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setInternalPatients(list);
          }
        })
        .catch(err => console.warn('Could not load patients in ClinicalTestsCatalogHub:', err));
    }
  }, []);

  const effectivePatients = useMemo(() => {
    if (patients && patients.length > 0) return patients;
    if (internalPatients.length > 0) return internalPatients;
    return [];
  }, [patients, internalPatients]);

  const [specialtyTab, setSpecialtyTab] = useState('all'); // 'all', 'psychologie_clinique', 'orthophonie', 'psychomotricite'
  const [selectedAgeRange, setSelectedAgeRange] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Runner State
  const [activeTestCode, setActiveTestCode] = useState(null);
  const [sendAssignmentTest, setSendAssignmentTest] = useState(null);

  const AGE_BRACKETS = [
    { id: 'all', label: 'جميع الفئات العمرية' },
    { id: '0_3_infant', label: '👶 0 - 3 سنوات (رضع / مبكر)' },
    { id: '3_6_preschool', label: '🧸 3 - 6 سنوات (ما قبل التمدرس)' },
    { id: '6_12_school', label: '🎒 6 - 12 سنة (أطفال متمدرسين)' },
    { id: '12_18_teen', label: '🎧 12 - 18 سنة (مراهقين)' },
    { id: '18_plus_adult', label: '👤 18+ سنة (راشدين وكبار)' },
  ];

  const DOMAINS = [
    { id: 'all', label: 'جميع المجالات السريرية' },
    { id: 'intelligence_cognition', label: '🧠 الذكاء والقدرات المعرفية (IQ & Cognition)' },
    { id: 'langage_oral', label: '🗣️ اللغة الشفهية والفونولوجيا (Langage Oral)' },
    { id: 'langage_ecrit_lecture', label: '📖 القراءة والكتابة والديسليكسيا (Lecture & Écrit)' },
    { id: 'calcul_dyscalculie', label: '🔢 الحساب ومعالجة الأرقام (Dyscalculie)' },
    { id: 'autisme_developpement', label: '🧩 طيف التوحد والسلوك التكيفي (TSA & Vineland)' },
    { id: 'anxiete_depression', label: '🌧️ القلق والاكتئاب (BDI, STAI, R-CMAS)' },
    { id: 'personnalite_projectif', label: '🎨 الاختبارات الإسقاطية والشخصية (CAT, Rorschach)' },
    { id: 'attention_memoire', label: '⚡ الانتباه والذاكرة والوظائف التنفيذية (TDAH & Stroop)' },
    { id: 'aphasie', label: '🏥 الحبسة العصبية وإعادة التأهيل (MT-86 & DO80)' },
    { id: 'psychomotricite', label: '🏃 التأهيل النفسي-حركي والتوازن الحركي (Psychomotricité)' },
  ];

  useEffect(() => {
    fetchTests();
  }, [specialtyTab, selectedAgeRange, selectedDomain, searchQuery]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (specialtyTab !== 'all') params.specialty = specialtyTab;
      if (selectedAgeRange !== 'all') params.age_range = selectedAgeRange;
      if (selectedDomain !== 'all') params.target_domain = selectedDomain;
      if (searchQuery) params.search = searchQuery;

      const resp = await clinicalTestApi.list(params);
      if (resp && resp.tests) {
        setTests(resp.tests);
      }
    } catch (err) {
      console.error('Failed to load clinical tests catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoringBadge = (type) => {
    switch (type) {
      case 'standard_iq_indices':
        return { label: 'مؤشرات ذكاء QIT', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' };
      case 'projective_qualitative':
        return { label: 'تحليل إسقاطي كيفي', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' };
      case 'percentile_speed':
        return { label: 'سرعة ودقة مئينية', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
      default:
        return { label: 'تصحيح معياري آلي', color: 'bg-teal-500/10 text-teal-300 border-teal-500/30' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white">
                بنك المقاييس والاختبارات السريرية المعيارية (Tests Cliniques DZ)
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              الحقيبة السيكومترية والأرطوفونية الشاملة المقننة، الموزعة عبر كافة التخصصات والفئات العمرية مع التصحيح الآلي واستخراج التقارير الرسمية (Bilan PDF).
            </p>
          </div>

          {/* Specialty Tabs */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0 flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setSpecialtyTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                specialtyTab === 'all'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({tests.length})
            </button>
            <button
              type="button"
              onClick={() => setSpecialtyTab('psychologie_clinique')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 space-x-reverse ${
                specialtyTab === 'psychologie_clinique'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>علم النفس العيادي</span>
            </button>
            <button
              type="button"
              onClick={() => setSpecialtyTab('orthophonie')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 space-x-reverse ${
                specialtyTab === 'orthophonie'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>الأرطوفونيا</span>
            </button>
            <button
              type="button"
              onClick={() => setSpecialtyTab('psychomotricite')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 space-x-reverse ${
                specialtyTab === 'psychomotricite'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>التأهيل النفسي-حركي</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        {/* Age Brackets Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {AGE_BRACKETS.map((age) => (
            <button
              key={age.id}
              type="button"
              onClick={() => setSelectedAgeRange(age.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                selectedAgeRange === age.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {age.label}
            </button>
          ))}
        </div>

        {/* Domain Selector & Search Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="md:col-span-2">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
            >
              {DOMAINS.map((dm) => (
                <option key={dm.id} value={dm.id}>
                  {dm.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="بحث باسم الاختبار، الرمز، أو المرجع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* ACTIVE RUNNER MODAL / VIEW */}
      {activeTestCode && (
        <div className="animate-in zoom-in-95">
          <InteractiveAssessmentRunner
            testCode={activeTestCode}
            patientId={patientId}
            patientName={patientName}
            patients={effectivePatients}
            tenant={tenant}
            onClose={() => setActiveTestCode(null)}
            onSaved={(assessment) => {
              if (onSelectTest) onSelectTest(assessment);
            }}
          />
        </div>
      )}

      {/* TESTS GRID */}
      {!activeTestCode && (
        <>
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold">جاري تحميل بطاريات الاختبارات المقننة...</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
              <p className="text-sm font-bold text-slate-400">لا توجد اختبارات مطابقة لشروط التصفية الحالية.</p>
              <button
                type="button"
                onClick={() => {
                  setSpecialtyTab('all');
                  setSelectedAgeRange('all');
                  setSelectedDomain('all');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-indigo-400 hover:underline"
              >
                إعادة ضبط خيارات البحث
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map((test) => {
                const badge = getScoringBadge(test.scoring_type);
                const isOrthophonie = test.specialty === 'orthophonie';

                return (
                  <div
                    key={test.id}
                    className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-4 shadow-xl transition-all hover:shadow-indigo-500/5 group"
                  >
                    <div className="space-y-3">
                      {/* Code Badge & Scoring Type */}
                      <div className="flex items-center justify-between">
                        <span className={`font-mono text-xs font-black px-3 py-1 rounded-xl border ${
                          isOrthophonie 
                            ? 'bg-teal-500/10 text-teal-300 border-teal-500/30' 
                            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {test.code}
                        </span>

                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Names & Description */}
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors">
                          {test.name_ar}
                        </h4>
                        <div className="text-[11px] font-semibold text-slate-400 italic">
                          {test.name_fr}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed pt-1">
                          {test.short_desc_ar}
                        </p>
                      </div>

                      {/* Meta Pills: Duration, Age, Red Alert */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                        {test.has_red_alert && (
                          <span className="px-2 py-0.5 rounded-md font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                            <span>تنبيه أمان سريري ⚠️</span>
                          </span>
                        )}
                        {test.duration && (
                          <span className="px-2 py-0.5 rounded-md font-medium bg-slate-950 text-slate-400 border border-slate-800 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{test.duration}</span>
                          </span>
                        )}
                        {test.age_range && (
                          <span className="px-2 py-0.5 rounded-md font-medium bg-slate-950 text-slate-400 border border-slate-800 truncate max-w-[180px]">
                            👶 {test.age_range}
                          </span>
                        )}
                      </div>

                      {/* Reference metadata */}
                      {test.author_reference && (
                        <div className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80 truncate">
                          📚 {test.author_reference}
                        </div>
                      )}
                    </div>

                    {/* Launch & Assign Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setActiveTestCode(test.code)}
                        className={`flex-1 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 space-x-reverse transition-all shadow-md active:scale-95 text-white ${
                          isOrthophonie
                            ? 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 shadow-teal-600/20'
                            : test.specialty === 'psychomotricite'
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-600/20'
                            : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-600/20'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>تمرير الرائز 🚀</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSendAssignmentTest(test)}
                        className="px-3.5 py-2.5 rounded-2xl font-bold text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                        title="إرسال الرائز للمريض عن بعد (WhatsApp / QR)"
                      >
                        <Send className="w-3.5 h-3.5 text-indigo-400" />
                        <span>إرسال 📲</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Send Remote Assignment Modal */}
      {sendAssignmentTest && (
        <SendTestAssignmentModal
          test={sendAssignmentTest}
          patients={effectivePatients}
          initialPatientId={patientId}
          tenant={tenant}
          onClose={() => setSendAssignmentTest(null)}
        />
      )}
    </div>
  );
}
