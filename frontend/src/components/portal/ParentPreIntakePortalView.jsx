import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { patientApi } from '../../api';
import {
  Baby,
  Calendar,
  Phone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Activity,
  Languages,
  Tv,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Heart,
  Send,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

export default function ParentPreIntakePortalView() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successSubmitted, setSuccessSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [patientInfo, setPatientInfo] = useState(null);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Parent form state
  const [formData, setFormData] = useState({
    parent_notes: '',
    consultation_reason: '',
    // 1. Perinatal
    perinatal: {
      pregnancy_term: 'full_term',
      delivery_type: 'natural',
      birth_cry: 'immediate',
      birth_weight_kg: 3.2,
      neonatal_anoxia: false,
      incubator_stay: false,
    },
    // 2. Milestones & Language
    milestones: {
      sitting_age_months: 6,
      walking_age_months: 12,
      babbling_age_months: 6,
      first_words_age_months: 12,
      first_sentences_age_months: 24,
    },
    // 3. Family & Screen Time
    family_context: {
      home_languages: ['darja'],
      daily_screen_hours: 2,
      screen_start_age_months: 18,
      sibling_rank: 'first_born',
      consanguinity: 'none',
    },
    // 4. School
    school_context: {
      school_name: '',
      school_grade: '',
      schooling_type: 'regular',
      teacher_complaints: [],
    },
  });

  useEffect(() => {
    fetchPreIntakeData();
  }, [token]);

  const fetchPreIntakeData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await patientApi.getPublicPreIntake(token);
      if (res.success) {
        setPatientInfo(res.patient);
        setClinicInfo(res.clinic);
        if (res.pre_intake_status === 'submitted' || res.pre_intake_status === 'reviewed') {
          setSuccessSubmitted(true);
        }
        if (res.existing_answers) {
          setFormData((prev) => ({ ...prev, ...res.existing_answers }));
        }
      }
    } catch (err) {
      setError(err.message || 'تعذر تحميل استمارة الاستقبال المسبق. يرجى التأكد من صحة الرابط.');
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (path, item) => {
    setFormData((prev) => {
      const current = path === 'home_languages' ? prev.family_context.home_languages : prev.school_context.teacher_complaints;
      const exists = current?.includes(item);
      const updated = exists ? current.filter((x) => x !== item) : [...(current || []), item];

      if (path === 'home_languages') {
        return { ...prev, family_context: { ...prev.family_context, home_languages: updated } };
      } else {
        return { ...prev, school_context: { ...prev.school_context, teacher_complaints: updated } };
      }
    });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);
    try {
      const res = await patientApi.submitPublicPreIntake(token, formData);
      if (res.success) {
        setSuccessSubmitted(true);
      }
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء إرسال الاستمارة.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">جاري تحميل استمارة السوابق السريرية...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-base font-bold text-white">عذراً، تعذر الوصول للاستمارة</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (successSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-white">تم استلام الاستمارة بنجاح!</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            شكراً لتعاونكم معنا. تم حفظ كافة البيانات والسوابق النمائية للطفل <strong className="text-teal-300 font-bold">{patientInfo?.first_name} {patientInfo?.last_name}</strong> وستظهر مباشرة للأخصائي المعالج في {clinicInfo?.name || 'العيادة'}.
          </p>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            🏥 نتمنى لكم ولطفلكم دوام الصحة والعافية.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between" dir="rtl">
      {/* Top Clinic Branding Header */}
      <header className="p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xs font-black text-white">{clinicInfo?.name || 'العيادة التخصصية'}</h1>
              <p className="text-[11px] text-teal-300 font-medium">
                استمارة السوابق النمائية المسبقة لـ: <strong>{patientInfo?.first_name} {patientInfo?.last_name}</strong>
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-400 font-mono">
            خطوة {currentStep} / 4
          </span>
        </div>
      </header>

      {/* Main Wizard Form Container */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 flex-1">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
          {/* Step Progress Dots */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            {[
              { step: 1, label: 'الولادة والحمل', icon: Baby },
              { step: 2, label: 'المعالم واللغة', icon: Activity },
              { step: 3, label: 'البيت والشاشات', icon: Tv },
              { step: 4, label: 'التمدرس والشكوى', icon: GraduationCap },
            ].map((s) => {
              const Icon = s.icon;
              const isPassed = currentStep > s.step;
              const isCurrent = currentStep === s.step;
              return (
                <div key={s.step} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-teal-500 text-white ring-4 ring-teal-500/20 shadow-lg'
                        : isPassed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-950 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {isPassed ? '✓' : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] hidden sm:block ${isCurrent ? 'text-teal-300 font-bold' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* STEP 1: PERINATAL HISTORY */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs">
                👋 مرحباً بكم، يرجى ملء تفاصيل فترة الحمل والولادة لمساعدة الأخصائي على فهم التاريخ النمائي للطفل.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">مدة الحمل:</label>
                <select
                  value={formData.perinatal.pregnancy_term}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      perinatal: { ...formData.perinatal, pregnancy_term: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                >
                  <option value="full_term">حمل كامل طبيعي (في وقته 37-41 أسبوع)</option>
                  <option value="preterm">ولادة مبكرة - خديج (قبل 37 أسبوع)</option>
                  <option value="post_term">حمل متأخر (أكثر من 42 أسبوع)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">طريقة الولادة:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        perinatal: { ...formData.perinatal, delivery_type: 'natural' },
                      })
                    }
                    className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                      formData.perinatal.delivery_type === 'natural'
                        ? 'bg-teal-600/30 border-teal-500 text-teal-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    طبيعية (Voie basse)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        perinatal: { ...formData.perinatal, delivery_type: 'c_section' },
                      })
                    }
                    className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                      formData.perinatal.delivery_type === 'c_section'
                        ? 'bg-teal-600/30 border-teal-500 text-teal-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    عملية قيصرية (Césarienne)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">هل بكى الطفل فور ولادته؟</label>
                <select
                  value={formData.perinatal.birth_cry}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      perinatal: { ...formData.perinatal, birth_cry: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                >
                  <option value="immediate">🟢 نعم، بكاء فوري وقوي</option>
                  <option value="delayed">🟡 بكاء متأخر مع إنعاش أو صعوبة تنفس</option>
                  <option value="absent">🔴 لم يبكِ عند الولادة مباشرة</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center space-x-2.5 space-x-reverse cursor-pointer p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.perinatal.neonatal_anoxia}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        perinatal: { ...formData.perinatal, neonatal_anoxia: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-teal-500"
                  />
                  <span className="text-xs font-bold text-slate-300">نقص أكسجين عند الولادة</span>
                </label>

                <label className="flex items-center space-x-2.5 space-x-reverse cursor-pointer p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.perinatal.incubator_stay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        perinatal: { ...formData.perinatal, incubator_stay: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-teal-500"
                  />
                  <span className="text-xs font-bold text-slate-300">دخول الحضانة الاصطناعية</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: MILESTONES & LANGUAGE */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xs font-bold text-cyan-300">المعالم الحركية والتطور اللغوي للطفل:</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">سن المشي المستقل:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.milestones.walking_age_months}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          milestones: { ...formData.milestones, walking_age_months: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-cyan-300 font-mono font-bold"
                    />
                    <span className="text-xs text-slate-500">شهر</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">سن ظهور أول كلمة مفهومة (ماما، دادا):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.milestones.first_words_age_months}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          milestones: { ...formData.milestones, first_words_age_months: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-cyan-300 font-mono font-bold"
                    />
                    <span className="text-xs text-slate-500">شهر</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <label className="text-xs font-bold text-slate-300 block">سن تركيب جملة من كلمتين (مثل: أعطيني ماء):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.milestones.first_sentences_age_months}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        milestones: { ...formData.milestones, first_sentences_age_months: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-cyan-300 font-mono font-bold"
                  />
                  <span className="text-xs text-slate-500">شهر</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: HOME & SCREEN TIME */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xs font-bold text-rose-300">المحيط اللغوي بالمنزل والتعرض للشاشات:</h3>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">اللغات المستعملة في التواصل بالبيت:</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'darja', label: 'الدارجة الجزائرية' },
                    { id: 'arabic', label: 'العربية الفصحى' },
                    { id: 'tamazight', label: 'الأمازيغية' },
                    { id: 'french', label: 'الفرنسية' },
                  ].map((l) => {
                    const sel = formData.family_context.home_languages?.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => toggleArrayItem('home_languages', l.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                          sel ? 'bg-rose-600/30 border-rose-500 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {sel ? '✓ ' : '+ '} {l.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <label className="block text-xs font-bold text-amber-300">ساعات التعرض للشاشات يومياً (الهواتف / التلفاز):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={formData.family_context.daily_screen_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        family_context: { ...formData.family_context, daily_screen_hours: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-amber-300 font-mono font-bold"
                  />
                  <span className="text-xs text-slate-500 whitespace-nowrap">ساعة/يوم</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SCHOOLING & COMPLAINT */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xs font-bold text-indigo-300">التمدرس وسبب الاستشارة الرئيسي:</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المؤسسة / الروضة:</label>
                  <input
                    type="text"
                    value={formData.school_context.school_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        school_context: { ...formData.school_context, school_name: e.target.value },
                      })
                    }
                    placeholder="اسم الروضة أو المدرسة..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">القسم والمستوى:</label>
                  <input
                    type="text"
                    value={formData.school_context.school_grade}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        school_context: { ...formData.school_context, school_grade: e.target.value },
                      })
                    }
                    placeholder="مثال: تحضيري / سنة 1..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ما هو انشغالكم الأساسي وسبب طلب الاستشارة؟ <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.consultation_reason}
                  onChange={(e) => setFormData({ ...formData, consultation_reason: e.target.value })}
                  placeholder="صف ما يقلقك في كلام أو سلوك أو تمدرس طفلك بكل حرية..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">ملاحظات إضافية ترغبون في إيصالها للأخصائي:</label>
                <textarea
                  rows={2}
                  value={formData.parent_notes}
                  onChange={(e) => setFormData({ ...formData, parent_notes: e.target.value })}
                  placeholder="أي معلومات أخرى ترونها مفيدة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Wizard Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="inline-flex items-center space-x-1.5 space-x-reverse px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="inline-flex items-center space-x-1.5 space-x-reverse px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-lg shadow-teal-600/30 transition-all"
              >
                <span>متابعة</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="inline-flex items-center space-x-1.5 space-x-reverse px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-teal-600/30 transition-all active:scale-95"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>إرسال الاستمارة للأخصائي ✅</span>
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-[11px] text-slate-500 border-t border-slate-900">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-400 inline ml-1" />
        كافة البيانات مشفرة وتُعامل بسرية طبية تامة من قبل الفريق الطبي للعيادة.
      </footer>
    </div>
  );
}
