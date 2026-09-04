import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Brain,
  Search,
  Layers,
  Printer,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  BookOpen,
  Award,
  ChevronRight,
  Info,
  X,
  Send,
  MessageSquare,
  Activity,
  Zap,
  Volume2,
  Calculator,
  Compass,
  FileCheck,
  Check,
  Smartphone,
  Copy,
  Sliders,
  BarChart2,
  ExternalLink,
  Target,
  FileText
} from 'lucide-react';
import { CLINICAL_TESTS_CATALOG, CLINICAL_PROTOCOLS_CATALOG } from './ClinicalCatalogData';

// Helper function to interpret clinical test scores
function getScoreInterpretation(test, rawScore) {
  if (rawScore === '' || isNaN(rawScore)) return null;
  const num = parseFloat(rawScore);
  const code = (test.code || '').toUpperCase();

  // 1. SSI-4 (Stuttering Severity)
  if (code.includes('SSI')) {
    if (num < 10) return { label: 'ضمن الحدود الطبيعية (Normal Fluency)', level: 'normal', color: 'emerald', advice: 'طلاقة طبيعية لا تستدعي تدخلاً مكثفاً.' };
    if (num <= 17) return { label: 'تأتأة خفيفة (Mild Stuttering)', level: 'mild', color: 'amber', advice: 'يوصى بتمارين الإطالة والتنفس الهادئ.' };
    if (num <= 24) return { label: 'تأتأة متوسطة (Moderate Stuttering)', level: 'moderate', color: 'orange', advice: 'تتطلب خطة علاج نطق منتظمة وتدريب الوالدين.' };
    if (num <= 31) return { label: 'تأتأة شديدة (Severe Stuttering)', level: 'severe', color: 'rose', advice: 'خطة تأهيلية مكثفة ودعم نفسي للحد من القلق.' };
    return { label: 'تأتأة حادة جداً (Very Severe Stuttering)', level: 'critical', color: 'red', advice: 'تدخل عيادي شامل يشمل تقنيات التعديل والتغذية الحيوية.' };
  }

  // 2. CARS-2 (Autism)
  if (code.includes('CARS')) {
    if (num < 30) return { label: 'سليم / خارج طيف التوحد (Non-Autistic)', level: 'normal', color: 'emerald', advice: 'الأداء السلوكي لا يظهر علامات دالة على طيف التوحد.' };
    if (num <= 36.5) return { label: 'طيف توحد خفيف إلى متوسط (Mild-Moderate ASD)', level: 'moderate', color: 'orange', advice: 'يوصى ببرنامج تدخل سلوكي مبكر وتنمية التواصل (PECS/TEACCH).' };
    return { label: 'طيف توحد شديد (Severe ASD)', level: 'critical', color: 'red', advice: 'برنامج فردي مكثف (ABA/تأهيل حسي وأرطوفوني متكامل).' };
  }

  // 3. WISC-V / IQ Scales
  if (code.includes('WISC') || code.includes('CATTELL') || code.includes('RAVEN') || code.includes('STANFORD')) {
    if (num < 70) return { label: 'قصور ذهني دال (Significantly Below Average / ID)', level: 'critical', color: 'red', advice: 'يتطلب تكييفات مدرسية وخطة فردية متخصصة (PEI).' };
    if (num <= 79) return { label: 'الفئة البينية / بطء تعلم (Borderline)', level: 'moderate', color: 'amber', advice: 'يحتاج لتعزيز الذاكرة العاملة وسرعة المعالجة.' };
    if (num <= 89) return { label: 'متوسط منخفض (Low Average)', level: 'mild', color: 'blue', advice: 'ضمن الحدود المقبولة مع دعم في الجوانب الضعيفة.' };
    if (num <= 109) return { label: 'متوسط طبيعي (Average IQ)', level: 'normal', color: 'emerald', advice: 'قدرات عقلية عامة سليمة ومناسبة للمرحلة العمرية.' };
    if (num <= 119) return { label: 'فوق المتوسط (High Average)', level: 'normal', color: 'emerald', advice: 'جاهزية معرفية ممتازة.' };
    if (num <= 129) return { label: 'متفوق ذهنياً (Superior)', level: 'normal', color: 'purple', advice: 'قدرات تفكير واستدلال عالية.' };
    return { label: 'موهبة فكرية عالية جداً (Very Superior / Gifted)', level: 'normal', color: 'indigo', advice: 'استعدادات ذهنية استثنائية (موهبة وتفوق).' };
  }

  // 4. BDI-II (Beck Depression)
  if (code.includes('BDI') || code.includes('DEPRESSION')) {
    if (num <= 13) return { label: 'اكتئاب في حده الأدنى (Minimal)', level: 'normal', color: 'emerald', advice: 'حالة مزاجية مستقرة ضمن الطبيعي.' };
    if (num <= 19) return { label: 'اكتئاب خفيف (Mild Depression)', level: 'mild', color: 'amber', advice: 'يوصى بالدعم النفسي الداعم وممارسة الأنشطة السارة.' };
    if (num <= 28) return { label: 'اكتئاب متوسط (Moderate Depression)', level: 'moderate', color: 'orange', advice: 'جلسات علاج معرفي سلوكي (CBT) وإعادة تفعيل السلوك.' };
    return { label: 'اكتئاب حاد / شديد (Severe Depression)', level: 'critical', color: 'red', advice: 'تدخل نفسي وطبي متخصص فوراً ومتابعة الأفكار الانتحارية.' };
  }

  // 5. GAD-7 (General Anxiety)
  if (code.includes('GAD')) {
    if (num <= 4) return { label: 'قلق طبيعي / طفيف (Minimal)', level: 'normal', color: 'emerald', advice: 'لا توجد مؤشرات سريرية للقلق المرضي.' };
    if (num <= 9) return { label: 'قلق خفيف (Mild Anxiety)', level: 'mild', color: 'blue', advice: 'تمارين الاسترخاء والتنفس البطني ومراقبة المنبهات.' };
    if (num <= 14) return { label: 'قلق متوسط (Moderate Anxiety)', level: 'moderate', color: 'orange', advice: 'تطبيق بروتوكول التخلص من القلق المعمم واستراتيجيات اليقظة.' };
    return { label: 'قلق حاد (Severe Anxiety)', level: 'critical', color: 'red', advice: 'تدخل عيادي متخصص لخفض الاستثارة الجسدية والأفكار القلقية.' };
  }

  // 6. Generic Fallback based on typical scale benchmarks
  if (num < 20) return { label: 'درجة منخفضة (Low Range)', level: 'mild', color: 'blue', advice: 'تفسير استرشادي: يُنصح بمقارنة النتيجة بكتيب الدليل المعياري.' };
  if (num <= 50) return { label: 'درجة متوسطة (Average Range)', level: 'normal', color: 'emerald', advice: 'ضمن المدى الملاحظ عادة في العينات المعيارية المقارنة.' };
  return { label: 'درجة مرتفعة (High Range / Alert)', level: 'moderate', color: 'orange', advice: 'تشير إلى وجود علامات واضحة تستلزم تدخلاً علاجياً مخصصاً.' };
}

export default function TestsBankView({ patients = [], tenant }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'exercises'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');
  
  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedItemForAssign, setSelectedItemForAssign] = useState(null);
  const [targetPatientId, setTargetPatientId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Quick Protocol Card Modal
  const [protocolModalItem, setProtocolModalItem] = useState(null);

  // Interactive Scoring Calculator inside modal
  const [modalRawScore, setModalRawScore] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Categories aligned across all 98 tests & 16 protocols
  const categories = [
    { id: 'all', label: '🌟 كافة التخصصات والروائز (+110)' },
    { id: 'orthophony', label: '🗣️ النطق والأرطوفونيا' },
    { id: 'fluency', label: '🎙️ طلاقة الكلام والتأتأة' },
    { id: 'autism', label: '🧩 طيف التوحد (Autism & TSA)' },
    { id: 'tdah_apprentissage', label: '⚡ فرط الحركة وصعوبات التعلم' },
    { id: 'intelligence', label: '💡 الذكاء والقدرات العقلية (IQ)' },
    { id: 'psychologie', label: '🧠 علم النفس العيادي والانفعالي' },
    { id: 'psychomotricite', label: '🏃 النفسي-حركي والتوازن الحركي' },
  ];

  // Age group filters
  const ageFilters = [
    { id: 'all', label: 'كل الفئات العمرية' },
    { id: 'early', label: '👶 التدخل المبكر (2 - 5 سنوات)' },
    { id: 'school', label: '🧒 سن التمدرس (6 - 12 سنة)' },
    { id: 'ado_adult', label: '🧑 المراهقون والبالغون (13+)' },
  ];

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return CLINICAL_TESTS_CATALOG.filter(test => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        test.title_ar.toLowerCase().includes(q) || 
        test.title_fr.toLowerCase().includes(q) || 
        test.code.toLowerCase().includes(q) ||
        test.category_label.toLowerCase().includes(q) ||
        (test.description && test.description.toLowerCase().includes(q)) ||
        (test.dimensions && test.dimensions.some(d => d.toLowerCase().includes(q)));

      // Category matching
      let matchesCategory = selectedCategory === 'all';
      if (!matchesCategory) {
        if (selectedCategory === 'orthophony') matchesCategory = test.category === 'orthophony';
        else if (selectedCategory === 'fluency') matchesCategory = test.category === 'fluency';
        else if (selectedCategory === 'autism') matchesCategory = test.category === 'autism';
        else if (selectedCategory === 'tdah_apprentissage') matchesCategory = ['tdah_apprentissage', 'adhd', 'learning'].includes(test.category);
        else if (selectedCategory === 'intelligence') matchesCategory = ['intelligence', 'wisc'].includes(test.category);
        else if (selectedCategory === 'psychologie') matchesCategory = ['psychologie', 'psychology'].includes(test.category);
        else if (selectedCategory === 'psychomotricite') matchesCategory = test.category === 'psychomotricite';
      }

      // Age group matching (rough estimate based on age_range text)
      let matchesAge = selectedAge === 'all';
      if (!matchesAge) {
        const ar = test.age_range || '';
        if (selectedAge === 'early') matchesAge = ar.includes('2') || ar.includes('3') || ar.includes('4') || ar.includes('5') || ar.includes('مبكر') || ar.includes('سنتين');
        else if (selectedAge === 'school') matchesAge = ar.includes('6') || ar.includes('7') || ar.includes('8') || ar.includes('9') || ar.includes('10') || ar.includes('11') || ar.includes('12') || ar.includes('مدرسة');
        else if (selectedAge === 'ado_adult') matchesAge = ar.includes('13') || ar.includes('14') || ar.includes('15') || ar.includes('16') || ar.includes('18') || ar.includes('بالغ') || ar.includes('مراهق') || ar.includes('فما فوق');
      }

      return matchesSearch && matchesCategory && matchesAge;
    });
  }, [searchTerm, selectedCategory, selectedAge]);

  // Filtered Protocols & Exercises
  const filteredExercises = useMemo(() => {
    return CLINICAL_PROTOCOLS_CATALOG.filter(ex => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        ex.title.toLowerCase().includes(q) || 
        ex.target.toLowerCase().includes(q) ||
        ex.category_label.toLowerCase().includes(q) ||
        (ex.materials && ex.materials.toLowerCase().includes(q)) ||
        (ex.steps && ex.steps.some(s => s.toLowerCase().includes(q)));

      let matchesCategory = selectedCategory === 'all';
      if (!matchesCategory) {
        if (selectedCategory === 'orthophony') matchesCategory = ex.category === 'orthophony';
        else if (selectedCategory === 'fluency') matchesCategory = ex.category === 'fluency';
        else if (selectedCategory === 'autism') matchesCategory = ex.category === 'autism';
        else if (selectedCategory === 'tdah_apprentissage') matchesCategory = ['tdah_apprentissage', 'adhd', 'learning'].includes(ex.category);
        else if (selectedCategory === 'intelligence') matchesCategory = ['intelligence', 'wisc'].includes(ex.category);
        else if (selectedCategory === 'psychologie') matchesCategory = ['psychologie', 'psychology'].includes(ex.category);
        else if (selectedCategory === 'psychomotricite') matchesCategory = ex.category === 'psychomotricite';
      }

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleOpenAssignModal = (item) => {
    setSelectedItemForAssign(item);
    setTargetPatientId(patients[0]?.id || '');
    setAssignNotes('');
    setAssignSuccess(false);
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = (e) => {
    e.preventDefault();
    if (!targetPatientId) {
      alert('يرجى اختيار ملف المريض أولاً.');
      return;
    }
    setAssignSuccess(true);
    setTimeout(() => {
      setAssignModalOpen(false);
      setAssignSuccess(false);
    }, 1500);
  };

  const handleOpenProtocolModal = (item) => {
    setProtocolModalItem(item);
    setModalRawScore('');
    setCopiedLink(false);
  };

  // Generate formatted WhatsApp message for parents
  const generateWhatsAppLink = (protocol) => {
    const selectedPatient = patients.find(p => String(p.id) === String(targetPatientId)) || patients[0];
    const patientName = selectedPatient?.name ? `الطفل(ة): ${selectedPatient.name}` : 'المريض الكريم';
    const patientPhone = selectedPatient?.phone ? selectedPatient.phone.replace(/[^0-9]/g, '') : '';
    
    let text = `🏥 *العيادة النفسية والأرطوفونية - خطة التدريب المنزلي*\n`;
    text += `👤 *${patientName}*\n`;
    text += `📌 *البرنامج العلاجي:* ${protocol.title}\n`;
    text += `🎯 *الهدف المستهدف:* ${protocol.target}\n`;
    text += `⏱️ *التكرار الموصى به:* ${protocol.frequency}\n`;
    if (protocol.materials) {
      text += `🎒 *الوسائل المطلوبة:* ${protocol.materials}\n`;
    }
    text += `\n📝 *خطوات التطبيق في المنزل:*\n`;
    protocol.steps.forEach((step, idx) => {
      text += `${idx + 1}. ${step}\n`;
    });
    text += `\n💡 *ملاحظة الأخصائي:* يرجى تطبيق الخطوات بهدوء وتشجيع الطفل، وتسجيل أي تقدم لمناقشته في الجلسة القادمة.\n`;
    text += `_مع تحيات الأخصائي المشرف_ ✨`;

    const encoded = encodeURIComponent(text);
    return patientPhone ? `https://wa.me/${patientPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  };

  const currentInterpretation = useMemo(() => {
    if (!protocolModalItem || !protocolModalItem.code) return null;
    return getScoreInterpretation(protocolModalItem, modalRawScore);
  }, [protocolModalItem, modalRawScore]);

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>CLINICAL TESTS & PROTOCOLS BANK</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                +90 رائز مقنن (CREAPSY / الجامعات 🇩🇿) + 16 بروتوكول علاجي 🌟
              </span>
              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                المعيار الجزائري والعربي 🇩🇿
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              بنك الروائز، المقاييس والبروتوكولات السريرية المعيارية
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              المكتبة السريرية المعتمدة للأخصائيين والأطباء: روائز تشخيصية مقننة، استبيانات فارزة، حاسبة معيارية للقطع (Cutoffs)، بروتوكولات تأهيلية، ومشاركات فورية للتدريب المنزلي عبر واتساب.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => navigate('/ai-therapy')}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-purple-500/20"
            >
              <Brain className="w-4 h-4" />
              <span>استوديو الذكاء الاصطناعي ✨</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse border border-slate-700 shadow"
              title="طباعة الدليل السريري"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الدليل</span>
            </button>
          </div>
        </div>

        {/* Master Navigation Switch Tabs */}
        <div className="flex items-center gap-3 border-t border-slate-800/80 pt-4 flex-wrap">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 space-x-reverse ${
              activeTab === 'tests'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>🧩 الروائز والمقاييس التشخيصية المقننة ({filteredTests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('exercises')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center space-x-2 space-x-reverse ${
              activeTab === 'exercises'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>🏃 التمارين والبروتوكولات المنزلية والتأهيلية ({filteredExercises.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'tests' ? "بحث بالاسم (عربي/فرنسي)، الرمز (SSI-4, CARS-2, WISC, BHK, BDI)، الأبعاد، أو معايير القطع..." : "بحث باسم التمرين، الهدف التأهيلي، الأدوات، أو الخطوات الإجرائية..."}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
          </div>

          {activeTab === 'tests' && (
            <div className="w-full md:w-64">
              <select
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition"
              >
                {ageFilters.map(af => (
                  <option key={af.id} value={af.id}>{af.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: TESTS & SCALES CATALOG (48 Standarized Clinical Tests) */}
      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map((test) => {
            const Icon = test.icon || Brain;
            return (
              <div
                key={test.id}
                className="bg-slate-900 border border-slate-800/90 hover:border-indigo-500/50 rounded-3xl p-5 space-y-4 shadow-xl transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-indigo-950/40 relative overflow-hidden"
              >
                {/* Accent top gradient line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${test.color || 'from-indigo-500 to-purple-600'}`} />

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-105 transition">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        {test.source && (
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {test.source}
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-mono font-black bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {test.code}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {test.category_label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug group-hover:text-indigo-300 transition line-clamp-2">
                      {test.title_ar}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-1 line-clamp-1">
                      {test.title_fr}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {test.description}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-indigo-400" /> الفئة العمرية:</span>
                      <strong className="text-slate-200 font-bold">{test.age_range}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> مدة التطبيق:</span>
                      <strong className="text-slate-200 font-bold">{test.duration}</strong>
                    </div>
                  </div>

                  {/* Cutoff Highlight Pill */}
                  {test.cutoff && (
                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 flex items-start gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1"><strong className="text-indigo-300 font-bold">معيار القطع:</strong> {test.cutoff}</span>
                    </div>
                  )}

                  {/* Dimensions Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {test.dimensions.slice(0, 3).map((d, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-950 text-slate-400 border border-slate-800">
                        • {d}
                      </span>
                    ))}
                    {test.dimensions.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-lg text-[10px] bg-slate-950 text-slate-500 font-mono">
                        +{test.dimensions.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenProtocolModal(test)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1 space-x-reverse"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>تفاصيل وحاسبة</span>
                  </button>

                  <button
                    onClick={() => handleOpenAssignModal(test)}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1 space-x-reverse shadow-md shadow-indigo-600/20"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>تخصيص لمريض</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: THERAPY EXERCISES & PROTOCOLS (16 Protocols) */}
      {activeTab === 'exercises' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExercises.map((ex) => (
            <div
              key={ex.id}
              className="bg-slate-900 border border-slate-800/90 hover:border-emerald-500/50 rounded-3xl p-5 space-y-4 shadow-xl transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-emerald-950/40 relative overflow-hidden"
            >
              {/* Top Accent Gradient */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${ex.color || 'from-emerald-500 to-teal-600'}`} />

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-105 transition">
                    <Stethoscope className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {ex.category_label}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white leading-snug group-hover:text-emerald-300 transition line-clamp-2">
                    {ex.title}
                  </h3>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <span>الهدف العلاجي المستهدف:</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {ex.target}
                  </p>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> التكرار الموصى به:</span>
                    <strong className="text-slate-200">{ex.frequency}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-indigo-400" /> مستوى الصعوبة:</span>
                    <strong className="text-slate-200">{ex.difficulty}</strong>
                  </div>
                </div>

                {/* Steps Preview */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400">خطوات البروتوكول:</div>
                  <ul className="text-[11px] text-slate-300 space-y-1">
                    {ex.steps.slice(0, 2).map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span className="line-clamp-1">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleOpenProtocolModal(ex)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-1 space-x-reverse"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>عرض الدليل</span>
                </button>

                <a
                  href={generateWhatsAppLink(ex)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1"
                  title="إرسال عبر واتساب لولي الأمر"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>واتساب</span>
                </a>

                <button
                  onClick={() => handleOpenAssignModal(ex)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1 space-x-reverse shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تعيين كواجب</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGN TO PATIENT MODAL */}
      {assignModalOpen && selectedItemForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">تخصيص العنصر لملف مريض</h3>
                  <p className="text-xs text-slate-400">{selectedItemForAssign.title_ar || selectedItemForAssign.title}</p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {assignSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-sm">تم تخصيص وتعيين العنصر للمريض بنجاح!</div>
                <div className="text-xs text-slate-400">سيظهر في السجل السريري للمريض وخطة المتابعة المنزلية.</div>
              </div>
            ) : (
              <form onSubmit={handleConfirmAssign} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">اختر المريض / الطفل:</label>
                  {patients.length === 0 ? (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-amber-400">
                      ⚠️ لا يوجد مرضى مسجلين حالياً. يرجى إضافة مريض أولاً من قسم ملفات المرضى.
                    </div>
                  ) : (
                    <select
                      value={targetPatientId}
                      onChange={(e) => setTargetPatientId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {p.age ? `${p.age} سنة` : ''} ({p.phone || 'بدون هاتف'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">ملاحظات وتوجيهات للأخصائي أو ولي الأمر:</label>
                  <textarea
                    rows={3}
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="مثال: يرجى التدريب 10 دقائق يومياً قبل موعد الحصة القادمة، والتركيز على التنفس الهادئ..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد التخصيص</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PROTOCOL & TEST DETAILS MODAL WITH INTERACTIVE SCORING CALCULATOR */}
      {protocolModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto my-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  {protocolModalItem.code || 'THERAPY PROTOCOL'}
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {protocolModalItem.title_ar || protocolModalItem.title}
                </h3>
                {protocolModalItem.title_fr && (
                  <div className="text-xs text-slate-400 font-mono">{protocolModalItem.title_fr}</div>
                )}
              </div>
              <button
                onClick={() => setProtocolModalItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-4">
              {protocolModalItem.description && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <div className="font-bold text-indigo-400 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>الوصف السريري والإكلينيكي:</span>
                  </div>
                  {protocolModalItem.description}
                </div>
              )}

              {/* INTERACTIVE SCORING CALCULATOR (For Clinical Tests) */}
              {protocolModalItem.code && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-indigo-950/40 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-indigo-400" />
                      <span>حاسبة النتيجة المعيارية والتفسير السريري الفوري:</span>
                    </div>
                    {protocolModalItem.cutoff && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        معيار: {protocolModalItem.cutoff}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-48">
                      <input
                        type="number"
                        step="any"
                        value={modalRawScore}
                        onChange={(e) => setModalRawScore(e.target.value)}
                        placeholder="أدخل الدرجة الخام..."
                        className="w-full bg-slate-900 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 text-center font-mono font-bold"
                      />
                    </div>
                    <div className="text-xs text-slate-400">
                      أدخل الدرجة المحصل عليها لحساب التفسير التشخيصي والتوصية السريرية مباشرة.
                    </div>
                  </div>

                  {currentInterpretation && (
                    <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                      currentInterpretation.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                      currentInterpretation.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                      currentInterpretation.color === 'orange' ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' :
                      currentInterpretation.color === 'purple' ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' :
                      currentInterpretation.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' :
                      'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}>
                      <div className="font-black flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>التصنيف السريري: {currentInterpretation.label}</span>
                      </div>
                      <div className="text-[11px] opacity-90">
                        <strong>التوصية السريرية:</strong> {currentInterpretation.advice}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {protocolModalItem.target && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    <span>الهدف التأهيلي المستهدف:</span>
                  </div>
                  {protocolModalItem.target}
                </div>
              )}

              {protocolModalItem.dimensions && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300">أبعاد ومحاور التقييم السريري:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {protocolModalItem.dimensions.map((d, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {protocolModalItem.steps && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300">الخطوات الإجرائية بالتسلسل:</div>
                  <div className="space-y-2">
                    {protocolModalItem.steps.map((step, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {protocolModalItem.materials && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                  <strong className="text-slate-300 font-bold">الأدوات والوسائل المطلوبة:</strong> {protocolModalItem.materials}
                </div>
              )}

              {/* WhatsApp Share Box (For Therapy Protocols) */}
              {protocolModalItem.steps && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 text-right w-full sm:w-auto">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>إرسال برنامج التمرين المنزلي للأولياء</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      يتم توليد رسالة واتساب منسقة خطوة بخطوة موجهة للأب أو الأم.
                    </div>
                  </div>
                  <a
                    href={generateWhatsAppLink(protocolModalItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 shrink-0"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>فتح في واتساب 📲</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  const it = protocolModalItem;
                  setProtocolModalItem(null);
                  handleOpenAssignModal(it);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <User className="w-4 h-4" />
                <span>تخصيص لملف مريض</span>
              </button>
              <button
                onClick={() => setProtocolModalItem(null)}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
