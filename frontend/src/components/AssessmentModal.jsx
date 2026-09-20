import React, { useState } from 'react';
import { assessmentApi } from '../api';
import { 
  Stethoscope, Brain, FileText, X, Check, Sparkles, 
  SlidersHorizontal, Award, Activity, ShieldCheck, ChevronRight, User
} from 'lucide-react';
import MasterBilanBuilderModal from './assessments/MasterBilanBuilderModal';

export default function AssessmentModal({ isOpen, onClose, onSuccess, patients = [], tenant }) {
  const [mode, setMode] = useState('master_bilan'); // 'master_bilan' or 'single_test'

  // Common Selection
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [specialty, setSpecialty] = useState(
    tenant?.enabled_modules?.orthophony ? 'orthophony' : (tenant?.enabled_modules?.psychology ? 'psychology' : 'orthophony')
  );

  // Master Bilan Bridge State
  const [isMasterBuilderOpen, setIsMasterBuilderOpen] = useState(false);

  // Single Test State
  const [type, setType] = useState('orthophony_bilan');
  const [title, setTitle] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [phonologyNotes, setPhonologyNotes] = useState('');
  const [compScore, setCompScore] = useState('18/20 (طبيعي)');
  const [readingSpeed, setReadingSpeed] = useState('75 كلمة/دقيقة');
  const [gad7Score, setGad7Score] = useState(10);
  const [phq9Score, setPhq9Score] = useState(6);
  const [cognitiveNotes, setCognitiveNotes] = useState('');
  const [diagnosticConclusion, setDiagnosticConclusion] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const selectedPatient = patients.find(p => String(p.id) === String(patientId)) || patients[0];

  const handleLaunchMasterBuilder = () => {
    if (!selectedPatient) {
      alert('يرجى اختيار المريض أولاً.');
      return;
    }
    setIsMasterBuilderOpen(true);
  };

  const handleSingleTestSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let results_data = {};
    if (type === 'orthophony_bilan') {
      results_data = {
        نطق_وفونولوجيا: phonologyNotes || 'فحص أولي للأصوات والمخارج',
        الفهم_التركيبي: compScore,
        سرعة_القراءة_والطلاقة: readingSpeed,
      };
    } else if (type === 'psychometric_eval') {
      results_data = {
        مقياس_القلق_GAD7: `${gad7Score}/21 (${gad7Score >= 15 ? 'شديد' : gad7Score >= 10 ? 'متوسط' : 'خفيف'})`,
        مقياس_الاكتئاب_PHQ9: `${phq9Score}/27 (${phq9Score >= 15 ? 'شديد' : phq9Score >= 10 ? 'متوسط' : 'خفيف'})`,
        الملاحظات_المعرفية: cognitiveNotes || 'تقييم أولي للأفكار التلقائية',
      };
    } else {
      results_data = {
        فحص_عام: phonologyNotes || cognitiveNotes || 'ملاحظات الفحص المبدئي',
      };
    }

    try {
      await assessmentApi.create({
        patient_id: patientId,
        type,
        title: title || (type === 'orthophony_bilan' ? 'تقييم أرطوفوني أولي' : 'تقييم نفسي-متري أولي'),
        assessment_date: assessmentDate,
        results_data,
        diagnostic_conclusion: diagnosticConclusion,
        recommendations,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'خطأ أثناء تسجيل نتيجة التقييم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" dir="rtl">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">إصدار تقييم / حصيلة سريرية</h3>
                <p className="text-xs text-slate-400">اختر نوع التقييم والمريض لإنشاء المستند الطبي المعتمد</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('master_bilan')}
              className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 space-x-reverse ${
                mode === 'master_bilan'
                  ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>الحصيلة الشاملة (Master Bilan)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('single_test')}
              className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 space-x-reverse ${
                mode === 'single_test'
                  ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>تسجيل رائز مفرد (Test Rapide)</span>
            </button>
          </div>

          {/* Patient Selection Card */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>المريض المستهدف:</span>
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-teal-500 focus:outline-none"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.folder_number || `#${p.id}`}) - {p.phone || 'بدون هاتف'}
                </option>
              ))}
            </select>
          </div>

          {/* MODE 1: MASTER BILAN LAUNCHER */}
          {mode === 'master_bilan' ? (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse text-teal-300 font-bold text-xs">
                  <Award className="w-4 h-4 text-teal-400" />
                  <span>قدرات محرر الحصيلة السريرية الشاملة المعتمدة:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-400" />
                    <span>دمج بنك الروائز المعيارية الـ 18</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-400" />
                    <span>مصفوفة النطق والتحليل الصوتي AI</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-400" />
                    <span>أهداف الخطة الفردية للتدخل (PEI)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-400" />
                    <span>الصياغة السريرية الذكية بالـ AI Scribe</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-400" />
                    <span>المصادقة بالختم والتوقيع والرمز المشفر QR</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-400" />
                    <span>توليد تقرير رسمي جاهز للطباعة والـ WhatsApp</span>
                  </div>
                </div>
              </div>

              {/* Specialty Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">تخصص الحصيلة السريرية:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'orthophony', label: 'أرطوفونيا وتخاطب', icon: Stethoscope },
                    { id: 'psychology', label: 'علم النفس و CBT', icon: Brain },
                    { id: 'psychomotricite', label: 'تأهيل نفسي-حركي', icon: Activity },
                  ].map(s => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSpecialty(s.id)}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                          specialty === s.id
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

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleLaunchMasterBuilder}
                  className="inline-flex items-center space-x-2 space-x-reverse px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all"
                >
                  <span>فتح محرر الحصيلة الشاملة</span>
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          ) : (
            /* MODE 2: QUICK SINGLE TEST FORM */
            <form onSubmit={handleSingleTestSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">نوع الاختبار:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-teal-500 focus:outline-none"
                  >
                    <option value="orthophony_bilan">أرطوفونيا / فحص نطقي</option>
                    <option value="psychometric_eval">تقييم نفسي-متري (GAD-7 / PHQ-9)</option>
                    <option value="initial_anamnesis">فحص مبدئي عام</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">تاريخ الاختبار:</label>
                  <input
                    type="date"
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">عنوان الاختبار أو الجلسة:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تقييم أولي للغة التعبيرية أو قياس القلق"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              {type === 'psychometric_eval' ? (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-300">مقياس القلق GAD-7:</span>
                      <span className="font-mono text-teal-400 font-bold">{gad7Score} / 21</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="21"
                      value={gad7Score}
                      onChange={(e) => setGad7Score(Number(e.target.value))}
                      className="w-full accent-teal-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-300">مقياس الاكتئاب PHQ-9:</span>
                      <span className="font-mono text-teal-400 font-bold">{phq9Score} / 27</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="27"
                      value={phq9Score}
                      onChange={(e) => setPhq9Score(Number(e.target.value))}
                      className="w-full accent-teal-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1 block">ملاحظات النطق أو الفحص:</label>
                    <textarea
                      rows="2"
                      value={phonologyNotes}
                      onChange={(e) => setPhonologyNotes(e.target.value)}
                      placeholder="الأصوات المصابة، نوع الخلل النطقي، أو ملاحظات الفحص..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">الخلاصة التشخيصية المبدئية:</label>
                <textarea
                  rows="2"
                  value={diagnosticConclusion}
                  onChange={(e) => setDiagnosticConclusion(e.target.value)}
                  placeholder="التشخيص الفارق أو الخلاصة السريرية للمقياس..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ نتيجة الاختبار'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Embedded Master Bilan Builder */}
      {isMasterBuilderOpen && selectedPatient && (
        <MasterBilanBuilderModal
          isOpen={isMasterBuilderOpen}
          onClose={() => {
            setIsMasterBuilderOpen(false);
            onClose();
          }}
          patient={selectedPatient}
          initialSpecialty={specialty}
          onBilanCreated={() => {
            if (onSuccess) onSuccess();
            setIsMasterBuilderOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
