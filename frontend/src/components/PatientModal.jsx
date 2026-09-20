import React, { useState, useMemo } from 'react';
import { patientApi } from '../api';
import {
  UserPlus,
  Zap,
  Stethoscope,
  Brain,
  Baby,
  Activity,
  GitBranch,
  GraduationCap,
  Languages,
  Ear,
  Eye,
  CheckCircle2,
  X,
  Phone,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import AlgerianGeoSelector from './common/AlgerianGeoSelector';

export default function PatientModal({ isOpen, onClose, onSuccess, tenant }) {
  // Mode: 'quick' (Reception Fast Intake) vs 'clinical' (Deep Clinical Anamnesis)
  const [activeMode, setActiveMode] = useState('quick');
  const [clinicalTab, setClinicalTab] = useState('perinatal'); // 'perinatal', 'language_exams', 'family_school', 'referral'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Reception Quick Intake
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'male',
    guardian_name: '',
    guardian_relation: 'father', // father, mother, legal_guardian, self
    phone: '',
    emergency_contact: '',
    wilaya_code: '16', // Alger default
    commune_name: '',
    consultation_reason: '',
    urgency_level: 'routine', // routine, priority, urgent
    kiosk_pin: Math.floor(100000 + Math.random() * 900000).toString(),

    // Step 2: Perinatal & Motor Milestones
    pregnancy_term: 'full_term', // full_term, preterm, post_term
    gestational_weeks: 39,
    delivery_type: 'natural', // natural, c_section, instrumental
    birth_cry: 'immediate', // immediate, delayed, absent
    neonatal_anoxia: false,
    incubator_stay: false,
    incubator_days: 0,
    birth_weight_kg: 3.2,
    sitting_age_months: 6,
    crawling_age_months: 8,
    walking_age_months: 12,
    sphincter_day_months: 24,
    sphincter_night_months: 30,

    // Step 2: Early Language & Organic Exams
    babbling_age_months: 6,
    first_words_age_months: 12,
    first_sentences_age_months: 24,
    hearing_exam_status: 'not_done', // not_done, normal, conductive_loss, sensorineural_loss, pea_done
    hearing_exam_notes: '',
    eeg_exam_status: 'not_done', // not_done, normal, abnormal, epilespy_signs
    eeg_exam_notes: '',
    vision_exam_status: 'normal', // normal, strabismus, refractive_error, not_done
    vision_exam_notes: '',

    // Step 2: Family & School Context
    home_languages: ['darja'], // darja, arabic, tamazight, french
    other_language: '',
    sibling_rank: 'first_born', // first_born, middle, youngest, only_child
    siblings_count: 2,
    consanguinity: 'none', // none, first_cousins, second_cousins, distant
    school_name: '',
    school_grade: '',
    schooling_type: 'regular', // regular, integrated, with_avs, specialized_center
    teacher_complaints: [], // reading, writing, attention, hyperactivity, impulsivity, speech_clarity
    daily_screen_hours: 2,
    screen_start_age_months: 18,

    // Step 2: Orientation & Referral
    referred_by_type: 'parents', // pediatrician, neuropediatrician, school_doctor, orl, parents, pedopsychiatrist
    referred_by_name: '',
    parallel_followups: [], // psychomotrician, speech_therapist, pedopsychiatrist, psychologist
    medical_history_notes: '',
    allergies: '',
  });

  if (!isOpen) return null;

  // Auto detect Algerian Phone Operator
  const phoneOperator = (() => {
    const clean = (formData.phone || '').replace(/\D/g, '');
    if (clean.startsWith('05') || clean.startsWith('2135')) return { name: 'Ooredoo', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (clean.startsWith('06') || clean.startsWith('2136')) return { name: 'Mobilis', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (clean.startsWith('07') || clean.startsWith('2137')) return { name: 'Djezzy', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    return null;
  })();

  // Calculate Age in Years & Months
  const calculatedAge = (() => {
    if (!formData.birth_date) return null;
    const birth = new Date(formData.birth_date);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return { years, months, isChild: years < 18, isInfant: years < 3 };
  })();

  const toggleArrayItem = (key, item) => {
    setFormData((prev) => {
      const arr = prev[key] || [];
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      };
    });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    if (!formData.first_name || !formData.first_name.trim() || !formData.last_name || !formData.last_name.trim()) {
      setError('يرجى إدخال الاسم واللقب للمريض.');
      return;
    }

    if (!formData.birth_date) {
      setError('يرجى تحديد تاريخ ميلاد المريض.');
      return;
    }

    const birthDate = new Date(formData.birth_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (birthDate > today) {
      setError('تاريخ الميلاد غير صالح: لا يمكن تسجيل تاريخ ميلاد في المستقبل.');
      return;
    }

    setLoading(true);

    try {
      // Build structured clinical payload
      const anamnesis_data = {
        consultation_reason: formData.consultation_reason,
        urgency_level: formData.urgency_level,
        guardian_relation: formData.guardian_relation,

        // 1. Perinatal & Milestones
        perinatal: {
          pregnancy_term: formData.pregnancy_term,
          gestational_weeks: formData.gestational_weeks,
          delivery_type: formData.delivery_type,
          birth_cry: formData.birth_cry,
          neonatal_anoxia: formData.neonatal_anoxia,
          incubator_stay: formData.incubator_stay,
          incubator_days: formData.incubator_days,
          birth_weight_kg: formData.birth_weight_kg,
        },
        milestones: {
          sitting_age_months: formData.sitting_age_months,
          crawling_age_months: formData.crawling_age_months,
          walking_age_months: formData.walking_age_months,
          sphincter_day_months: formData.sphincter_day_months,
          sphincter_night_months: formData.sphincter_night_months,
          babbling_age_months: formData.babbling_age_months,
          first_words_age_months: formData.first_words_age_months,
          first_sentences_age_months: formData.first_sentences_age_months,
        },

        // 2. Organic Exams
        organic_exams: {
          hearing: { status: formData.hearing_exam_status, notes: formData.hearing_exam_notes },
          eeg: { status: formData.eeg_exam_status, notes: formData.eeg_exam_notes },
          vision: { status: formData.vision_exam_status, notes: formData.vision_exam_notes },
        },

        // 3. Family & School Context
        family_context: {
          home_languages: formData.home_languages,
          other_language: formData.other_language,
          sibling_rank: formData.sibling_rank,
          siblings_count: formData.siblings_count,
          consanguinity: formData.consanguinity,
          daily_screen_hours: formData.daily_screen_hours,
          screen_start_age_months: formData.screen_start_age_months,
        },
        school_context: {
          school_name: formData.school_name,
          school_grade: formData.school_grade,
          schooling_type: formData.schooling_type,
          teacher_complaints: formData.teacher_complaints,
        },

        // 4. Referral & Network
        referral: {
          referred_by_type: formData.referred_by_type,
          referred_by_name: formData.referred_by_name,
          parallel_followups: formData.parallel_followups,
          initial_complaint: formData.consultation_reason,
        },
        medical_history: formData.medical_history_notes,
      };

      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        birth_date: formData.birth_date,
        gender: formData.gender,
        guardian_name: formData.guardian_name || null,
        parent_name: formData.guardian_name || null,
        parent_relation: formData.guardian_relation || null,
        phone: formData.phone || null,
        phone_operator: phoneOperator ? phoneOperator.name.toLowerCase() : null,
        emergency_contact: formData.emergency_contact || null,
        wilaya_code: formData.wilaya_code || '16',
        commune_name: formData.commune_name || null,
        kiosk_pin: formData.kiosk_pin || null,
        medical_history: formData.medical_history_notes || null,
        allergies: formData.allergies || null,
        school_name: formData.school_name || null,
        school_grade: formData.school_grade || null,
        referral_source: formData.referred_by_name ? `${formData.referred_by_type}: ${formData.referred_by_name}` : formData.referred_by_type,
        anamnesis_data,
        family_genogram: {
          consanguinity: formData.consanguinity !== 'none',
          consanguinity_degree: formData.consanguinity,
          siblings_count: formData.siblings_count,
          sibling_rank: formData.sibling_rank,
        },
        sensory_profile: {
          languages: formData.home_languages,
          screen_exposure: formData.daily_screen_hours,
        },
      };

      await patientApi.create(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تسجيل ملف المريض.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header & Mode Switcher */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h3 className="text-base font-black text-white">إضافة ملف مريض جديد (New Patient Intake)</h3>
                {calculatedAge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    👶 {calculatedAge.years} سنة {calculatedAge.months > 0 ? `و ${calculatedAge.months} شهر` : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                عيادة: <span className="text-teal-300 font-bold">{tenant?.name || 'العيادة التخصصية'}</span>
              </p>
            </div>
          </div>

          {/* Mode Pill Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveMode('quick')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all ${
                activeMode === 'quick'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1. تسجيل سريع للاستقبال ⚡</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('clinical')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all ${
                activeMode === 'clinical'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>2. السوابق السريرية والنمائية 🩺</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 space-x-reverse">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* MODE 1: RECEPTION QUICK INTAKE */}
          {activeMode === 'quick' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 space-x-reverse text-xs text-teal-300">
                  <Zap className="w-4 h-4 text-teal-400" />
                  <span>
                    <strong>وضع الاستقبال السريع:</strong> مخصص لتدوين البيانات الأساسية وفتح الملف الإداري في أقل من 30 ثانية.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMode('clinical')}
                  className="text-xs font-bold text-teal-400 hover:text-teal-300 underline underline-offset-4"
                >
                  فتح استمارة السوابق السريرية ➔
                </button>
              </div>

              {/* Basic Demographics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الاسم (Prénom) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="مثال: يوسف"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اللقب (Nom de famille) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="مثال: بن علي"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الجنس (Sexe) <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'male' })}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        formData.gender === 'male'
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      👦 ذكر (Garçon)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'female' })}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        formData.gender === 'female'
                          ? 'bg-pink-600/30 border-pink-500 text-pink-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      👧 أنثى (Fille)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    تاريخ الميلاد (Date de Naissance) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    min="1900-01-01"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    رقم هاتف الولي / التواصل <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="05 / 06 / 07 XX XX XX XX"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-white placeholder:text-slate-600 font-mono focus:outline-none"
                    />
                    <Phone className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                    {phoneOperator && (
                      <span className={`absolute left-2.5 top-2.5 px-2 py-0.5 rounded text-[10px] font-bold border ${phoneOperator.color}`}>
                        {phoneOperator.name}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم الولي أو المرافق (Parent / Tuteur)
                  </label>
                  <input
                    type="text"
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    placeholder="اسم الأب أو الأم"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Algerian 58 Wilayas & Communes Smart Cascading Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                <AlgerianGeoSelector
                  wilayaCode={formData.wilaya_code}
                  communeName={formData.commune_name}
                  onWilayaChange={(code) => setFormData((prev) => ({ ...prev, wilaya_code: code }))}
                  onCommuneChange={(commune) => setFormData((prev) => ({ ...prev, commune_name: commune }))}
                />
              </div>

              {/* Primary Complaint / Reason for Visit */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  السبب الرئيسي للزيارة والشكوى الأولية (Motif de Consultation Principal) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.consultation_reason}
                  onChange={(e) => setFormData({ ...formData, consultation_reason: e.target.value })}
                  placeholder="مثال: تأخر في الكلام، عدم وضوح نطق مخارج الحروف (تأتأة/لدغة)، صعوبة في التركيز والانتباه، صعوبة في القراءة المدرسية..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-2xl p-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Quick Tags Suggestions for Complaint */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400">وسوم شكاوى شائعة للاختيار السريع:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'تأخر لغوي أولي (Retard de parole)',
                    'تأتأة واضطراب طلاقة (Bégaiement)',
                    'اضطراب نطق الفونيمات (Trouble d\'articulation)',
                    'فرط حركة وتشتت انتباه (TDAH)',
                    'صعوبات تعلم وقراءة (Dyslexie)',
                    'اضطراب طيف التوحد (TSA)',
                    'تأخر حركي نفسي (Psychomoteur)',
                    'استشارة نفسية ودعم سلوكي'
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const current = formData.consultation_reason;
                        setFormData({
                          ...formData,
                          consultation_reason: current ? `${current} - ${tag}` : tag,
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all hover:border-slate-700"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: DEEP CLINICAL ANAMNESIS */}
          {activeMode === 'clinical' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Clinical Navigation Subtabs */}
              <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto pb-1 border-b border-slate-800">
                {[
                  { id: 'perinatal', label: '1. السوابق الولادية والنمائية (Périnatale & Moteur)', icon: Baby },
                  { id: 'language_exams', label: '2. التطور اللغوي والفحوصات (Langage & Examens)', icon: Ear },
                  { id: 'family_school', label: '3. البيئة الأسرية والمدرسية (Famille & École)', icon: GraduationCap },
                  { id: 'referral', label: '4. جهة التوجيه والمتابعة (Orientation & Suivi)', icon: Stethoscope },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = clinicalTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setClinicalTab(tab.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 space-x-reverse whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: PERINATAL & MOTOR */}
              {clinicalTab === 'perinatal' && (
                <div className="space-y-5 animate-in fade-in">
                  <h4 className="text-xs font-black text-amber-300 flex items-center space-x-2 space-x-reverse">
                    <Baby className="w-4 h-4" />
                    <span>فترة الحمل والولادة (Histoire Périnatale)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">مدة الحمل (Terme de Grossesse):</label>
                      <select
                        value={formData.pregnancy_term}
                        onChange={(e) => setFormData({ ...formData, pregnancy_term: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="full_term">حمل كامل طبيعي (À terme 37-41 SA)</option>
                        <option value="preterm">ولادة مبكرة - خديج (Prématuré &lt; 37 SA)</option>
                        <option value="post_term">حمل متأخر (Post-terme &gt; 42 SA)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">نوع الولادة (Mode d'Accouchement):</label>
                      <select
                        value={formData.delivery_type}
                        onChange={(e) => setFormData({ ...formData, delivery_type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="natural">طبيعية عادية (Voie basse spontanée)</option>
                        <option value="c_section">عملية قيصرية (Césarienne programmée / urgence)</option>
                        <option value="instrumental">ولادة بأدوات مساعدة (Forceps / Ventouse)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">بكاء الطفل الفوري (Cri Immédiat):</label>
                      <select
                        value={formData.birth_cry}
                        onChange={(e) => setFormData({ ...formData, birth_cry: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="immediate">🟢 بكاء فوري وقوي (Immédiat)</option>
                        <option value="delayed">🟡 بكاء متأخر مع إنعاش (Retardé / Réanimation)</option>
                        <option value="absent">🔴 غياب البكاء (Absent)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">الوزن عند الولادة (Poids de Naissance):</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={formData.birth_weight_kg}
                          onChange={(e) => setFormData({ ...formData, birth_weight_kg: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                        />
                        <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">kg</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 space-x-reverse pt-4">
                      <input
                        type="checkbox"
                        id="anoxia_check"
                        checked={formData.neonatal_anoxia}
                        onChange={(e) => setFormData({ ...formData, neonatal_anoxia: e.target.checked })}
                        className="w-4 h-4 rounded text-teal-600 bg-slate-950 border-slate-800"
                      />
                      <label htmlFor="anoxia_check" className="text-xs font-bold text-slate-300 cursor-pointer">
                        نقص أكسجين عند الولادة (Anoxie néonatale / Souffrance)
                      </label>
                    </div>

                    <div className="flex items-center space-x-3 space-x-reverse pt-4">
                      <input
                        type="checkbox"
                        id="incubator_check"
                        checked={formData.incubator_stay}
                        onChange={(e) => setFormData({ ...formData, incubator_stay: e.target.checked })}
                        className="w-4 h-4 rounded text-teal-600 bg-slate-950 border-slate-800"
                      />
                      <label htmlFor="incubator_check" className="text-xs font-bold text-slate-300 cursor-pointer">
                        دخول الحضانة الاصطناعية (Séjour en Couveuse)
                      </label>
                    </div>
                  </div>

                  {/* Motor Milestones */}
                  <h4 className="text-xs font-black text-teal-300 flex items-center space-x-2 space-x-reverse pt-4 border-t border-slate-800">
                    <Activity className="w-4 h-4" />
                    <span>المعالم النمائية الحركية (Développement Psychomoteur)</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 font-bold block">الجلوس المستقل:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formData.sitting_age_months}
                          onChange={(e) => setFormData({ ...formData, sitting_age_months: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-teal-300 font-mono font-bold"
                        />
                        <span className="text-[10px] text-slate-500">شهر</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 font-bold block">الحبو (4 pattes):</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formData.crawling_age_months}
                          onChange={(e) => setFormData({ ...formData, crawling_age_months: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-teal-300 font-mono font-bold"
                        />
                        <span className="text-[10px] text-slate-500">شهر</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 font-bold block">المشي المستقل:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formData.walking_age_months}
                          onChange={(e) => setFormData({ ...formData, walking_age_months: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-teal-300 font-mono font-bold"
                        />
                        <span className="text-[10px] text-slate-500">شهر</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 font-bold block">النظافة نهاراً (Propreté):</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formData.sphincter_day_months}
                          onChange={(e) => setFormData({ ...formData, sphincter_day_months: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-teal-300 font-mono font-bold"
                        />
                        <span className="text-[10px] text-slate-500">شهر</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 font-bold block">النظافة ليلاً (Nuit):</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={formData.sphincter_night_months}
                          onChange={(e) => setFormData({ ...formData, sphincter_night_months: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-teal-300 font-mono font-bold"
                        />
                        <span className="text-[10px] text-slate-500">شهر</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: LANGUAGE & ORGANIC EXAMS */}
              {clinicalTab === 'language_exams' && (
                <div className="space-y-5 animate-in fade-in">
                  <h4 className="text-xs font-black text-cyan-300 flex items-center space-x-2 space-x-reverse">
                    <Languages className="w-4 h-4" />
                    <span>التطور اللغوي الأولي (Développement du Langage)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-xs font-bold text-slate-300 block">سن بداية المناغاة (Babillage):</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={formData.babbling_age_months}
                          onChange={(e) => setFormData({ ...formData, babbling_age_months: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono font-bold"
                        />
                        <span className="text-xs text-slate-500">شهر</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">الطبيعي: بين 4 إلى 8 أشهر (ba-ba, ma-ma)</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-xs font-bold text-slate-300 block">الكلمات الأولى الهادفة (Mots Isolé):</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={formData.first_words_age_months}
                          onChange={(e) => setFormData({ ...formData, first_words_age_months: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono font-bold"
                        />
                        <span className="text-xs text-slate-500">شهر</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">الطبيعي: حوالي 12 شهراً (ماما، دادا، ماء)</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-xs font-bold text-slate-300 block">تركيب الجمل البسيطة (Phrases):</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={formData.first_sentences_age_months}
                          onChange={(e) => setFormData({ ...formData, first_sentences_age_months: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono font-bold"
                        />
                        <span className="text-xs text-slate-500">شهر</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">الطبيعي: جملة من كلمتين عند عمر سنتين</span>
                    </div>
                  </div>

                  {/* Organic / Medical Exams */}
                  <h4 className="text-xs font-black text-indigo-300 flex items-center space-x-2 space-x-reverse pt-4 border-t border-slate-800">
                    <Ear className="w-4 h-4" />
                    <span>الفحوصات الطبية والعضوية المسبقة (Examens Organiques & Sensorielles)</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Hearing */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5 space-x-reverse">
                        <Ear className="w-3.5 h-3.5" />
                        <span>فحص السمع (Audiogramme / PEA):</span>
                      </span>
                      <select
                        value={formData.hearing_exam_status}
                        onChange={(e) => setFormData({ ...formData, hearing_exam_status: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="not_done">لم يجرى فحص السمع بعد</option>
                        <option value="normal">🟢 فحص السمع سليم (Audition Normale)</option>
                        <option value="pea_done">تم إنجاز PEA (استجابة جذع الدماغ)</option>
                        <option value="conductive_loss">ضعف سمع توصيلي (Surdité de Transmission)</option>
                        <option value="sensorineural_loss">ضعف سمع إدراكي عصبي (Perception)</option>
                      </select>
                      <input
                        type="text"
                        value={formData.hearing_exam_notes}
                        onChange={(e) => setFormData({ ...formData, hearing_exam_notes: e.target.value })}
                        placeholder="تفاصيل فحص السمع والجهة..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] text-slate-300"
                      />
                    </div>

                    {/* EEG */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-purple-300 flex items-center space-x-1.5 space-x-reverse">
                        <Brain className="w-3.5 h-3.5" />
                        <span>تخطيط الدماغ (Électroencéphalogramme EEG):</span>
                      </span>
                      <select
                        value={formData.eeg_exam_status}
                        onChange={(e) => setFormData({ ...formData, eeg_exam_status: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="not_done">لم يجرى تخطيط الدماغ</option>
                        <option value="normal">🟢 تخطيط سليم (EEG Normal)</option>
                        <option value="abnormal">شحنات كهربائية غير منتظمة</option>
                        <option value="epilespy_signs">نشاط صرعي أو بؤري (Épileptogène)</option>
                      </select>
                      <input
                        type="text"
                        value={formData.eeg_exam_notes}
                        onChange={(e) => setFormData({ ...formData, eeg_exam_notes: e.target.value })}
                        placeholder="طبيب الأعصاب المعالج والملاحظات..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] text-slate-300"
                      />
                    </div>

                    {/* Vision */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-teal-300 flex items-center space-x-1.5 space-x-reverse">
                        <Eye className="w-3.5 h-3.5" />
                        <span>فحص النظر والرؤية (Ophtalmologie):</span>
                      </span>
                      <select
                        value={formData.vision_exam_status}
                        onChange={(e) => setFormData({ ...formData, vision_exam_status: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="normal">🟢 فحص نظر سليم</option>
                        <option value="strabismus">حول بصري (Strabisme)</option>
                        <option value="refractive_error">ارتداء نظارات تصحيحية (Lunettes)</option>
                        <option value="not_done">لم يجرى الفحص</option>
                      </select>
                      <input
                        type="text"
                        value={formData.vision_exam_notes}
                        onChange={(e) => setFormData({ ...formData, vision_exam_notes: e.target.value })}
                        placeholder="حدة البصر وملاحظات النظر..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FAMILY & SCHOOL */}
              {clinicalTab === 'family_school' && (
                <div className="space-y-5 animate-in fade-in">
                  {/* Linguistic Environment */}
                  <h4 className="text-xs font-black text-rose-300 flex items-center space-x-2 space-x-reverse">
                    <Languages className="w-4 h-4" />
                    <span>المحيط اللغوي في البيت (Bain Linguistique Familial - DZ Context)</span>
                  </h4>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs text-slate-400 block">
                      حدد اللغات المستعملة في التواصل اليومي داخل الأسرة (حاسم لتشخيص التأخر اللغوي):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'darja', label: 'الدارجة الجزائرية' },
                        { id: 'arabic', label: 'العربية الفصحى' },
                        { id: 'tamazight', label: 'الأمازيغية (قبائلية/شاوية/ميزابية)' },
                        { id: 'french', label: 'الفرنسية (Français)' },
                        { id: 'multilingual', label: 'خليط لغوي مكثف (Bilinguisme précoce)' },
                      ].map((lang) => {
                        const selected = formData.home_languages.includes(lang.id);
                        return (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => toggleArrayItem('home_languages', lang.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              selected
                                ? 'bg-rose-600/30 border-rose-500 text-rose-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {selected ? '✓ ' : '+ '} {lang.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sibling Order & Consanguinity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">الترتيب بين الإخوة (Fratrie):</label>
                      <select
                        value={formData.sibling_rank}
                        onChange={(e) => setFormData({ ...formData, sibling_rank: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="first_born">الابن البكر / الأكبر (Aîné)</option>
                        <option value="middle">الابن الأوسط (Cadet)</option>
                        <option value="youngest">الابن الأصغر (Benjamin)</option>
                        <option value="only_child">طفل وحيد (Enfant unique)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">القرابة بين الوالدين (Consanguinité):</label>
                      <select
                        value={formData.consanguinity}
                        onChange={(e) => setFormData({ ...formData, consanguinity: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="none">لا توجد قرابة عائلية (Pas de consanguinité)</option>
                        <option value="first_cousins">قرابة درجة أولى (أبناء عم / خالة)</option>
                        <option value="second_cousins">قرابة درجة ثانية</option>
                        <option value="distant">قرابة عائلية بعيدة</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">ساعات التعرض اليومية للشاشات (Écrans):</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          value={formData.daily_screen_hours}
                          onChange={(e) => setFormData({ ...formData, daily_screen_hours: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold"
                        />
                        <span className="text-xs text-slate-500 whitespace-nowrap">ساعة/يوم</span>
                      </div>
                    </div>
                  </div>

                  {/* Schooling */}
                  <h4 className="text-xs font-black text-emerald-300 flex items-center space-x-2 space-x-reverse pt-4 border-t border-slate-800">
                    <GraduationCap className="w-4 h-4" />
                    <span>التمدرس والتكيف المدرسي (Scolarisation)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">المؤسسة التعليمية / الروضة:</label>
                      <input
                        type="text"
                        value={formData.school_name}
                        onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                        placeholder="اسم المدرسة أو الروضة"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">القسم والمستوى الدراسي:</label>
                      <input
                        type="text"
                        value={formData.school_grade}
                        onChange={(e) => setFormData({ ...formData, school_grade: e.target.value })}
                        placeholder="مثال: تحضيري / سنة 2 ابتدائي"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">نوع التمدرس (Mode de Scolarisation):</label>
                      <select
                        value={formData.schooling_type}
                        onChange={(e) => setFormData({ ...formData, schooling_type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="regular">تمدرس عادي (Classe Ordinaire)</option>
                        <option value="with_avs">تمدرس عادي مع مرافقة مدرسية (AVS)</option>
                        <option value="integrated">قسم مدمج خاص (Classe Intégrée CLIS)</option>
                        <option value="specialized_center">مركز نفسي بيداغوجي متخصص (CMPP / CNP)</option>
                      </select>
                    </div>
                  </div>

                  {/* Teacher Complaints Tags */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">ملاحظات وشكاوى المعلمين في القسم:</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'reading', label: 'صعوبة في تعلم القراءة والحروف' },
                        { id: 'writing', label: 'صعوبة في الإملاء والكتابة (Dysorthographie)' },
                        { id: 'attention', label: 'تشتت الانتباه وعدم التركيز' },
                        { id: 'hyperactivity', label: 'حركة مفرطة وتململ بالقسم' },
                        { id: 'impulsivity', label: 'اندفاعية ومقاطعة الكلام' },
                        { id: 'speech_clarity', label: 'عدم وضوح الكلام مع الزملاء' },
                      ].map((c) => {
                        const active = formData.teacher_complaints.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleArrayItem('teacher_complaints', c.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              active
                                ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {active ? '✓ ' : '+ '} {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: REFERRAL & PARALLEL FOLLOW-UPS */}
              {clinicalTab === 'referral' && (
                <div className="space-y-5 animate-in fade-in">
                  <h4 className="text-xs font-black text-purple-300 flex items-center space-x-2 space-x-reverse">
                    <Stethoscope className="w-4 h-4" />
                    <span>جهة التوجيه الطبي والمتابعات الموازية (Orientation & Réseau Médical)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">الموجه الرئيسي (Référé Par):</label>
                      <select
                        value={formData.referred_by_type}
                        onChange={(e) => setFormData({ ...formData, referred_by_type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="parents">مبادرة ذاتية من الأولياء (Initiative parentale)</option>
                        <option value="pediatrician">طبيب أطفال (Pédiatre)</option>
                        <option value="neuropediatrician">طبيب أعصاب أطفال (Neuropédiatre)</option>
                        <option value="school_doctor">طبيب الصحة المدرسية (Médecin scolaire / UDS)</option>
                        <option value="orl">طبيب أنف وأذن وحنجرة (Médecin ORL)</option>
                        <option value="pedopsychiatrist">طبيب نفسي للأطفال (Pédopsychiatre)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم الطبيب أو العيادة الموجهة:</label>
                      <input
                        type="text"
                        value={formData.referred_by_name}
                        onChange={(e) => setFormData({ ...formData, referred_by_name: e.target.value })}
                        placeholder="مثال: د. بلحاج - مستشفى القبة"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Parallel Therapies */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">المتابعات العلاجية الموازية (Prises en charge parallèles):</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'psychomotrician', label: 'أخصائي نفسي حركي (Psychomotricité)' },
                        { id: 'other_speech_therapist', label: 'أخصائي أرطوفوني آخر (Orthophonie)' },
                        { id: 'pedopsychiatrist', label: 'طبيب نفسي للأطفال (Pédopsychiatre)' },
                        { id: 'psychologist', label: 'أخصائي نفسي عيادي (Psychologie clinique)' },
                        { id: 'kinesitherapy', label: 'علاج طبيعي / حركي (Kinésithérapie)' },
                      ].map((t) => {
                        const active = formData.parallel_followups.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleArrayItem('parallel_followups', t.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              active
                                ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {active ? '✓ ' : '+ '} {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* General Medical Notes & Allergies */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">السوابق المرضية والعمليات الجراحية:</label>
                      <textarea
                        rows={2}
                        value={formData.medical_history_notes}
                        onChange={(e) => setFormData({ ...formData, medical_history_notes: e.target.value })}
                        placeholder="التهابات أذن وسطى متكررة، استئصال اللوزتين، أمراض مزمنة..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">الحساسية والأدوية المستمرة:</label>
                      <textarea
                        rows={2}
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                        placeholder="حساسية أدوية، مضادات الصرع، مكملات غذائية..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>كافة السجلات الطبية والسوابق النمائية مشفرة ومحمية وفق معايير الخصوصية الصحية.</span>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              إلغاء
            </button>

            {activeMode === 'quick' ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveMode('clinical')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-teal-500/30 flex items-center space-x-1.5 space-x-reverse transition-all"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>متابعة السوابق السريرية ➔</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-teal-600/30 flex items-center space-x-1.5 space-x-reverse transition-all active:scale-95"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>حفظ وفتح الملف الإداري ⚡</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 space-x-reverse transition-all active:scale-95"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>حفظ السوابق السريرية الشاملة ✅</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
