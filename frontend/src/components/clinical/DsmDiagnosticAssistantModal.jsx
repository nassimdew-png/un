import React, { useState, useEffect } from 'react';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  ArrowRight,
  ShieldAlert,
  Stethoscope,
  Sparkles,
  Save,
  Send,
  HelpCircle,
  Clock,
  UserCheck,
  X,
  Edit3,
  RotateCcw,
  Eye
} from 'lucide-react';
import { clinicalDdssApi } from '../../api';

export default function DsmDiagnosticAssistantModal({
  isOpen,
  onClose,
  patient,
  sessionId = null,
  appointmentId = null,
  initialSpecialty = 'orthophony',
  initialSoapText = '',
  onInjectSoap = null,
  onExportBilan = null,
}) {
  const normalizeSpec = (spec) => {
    if (!spec) return 'orthophony';
    if (spec === 'orthophonie' || spec === 'orthophony') return 'orthophony';
    if (spec === 'psychologie' || spec === 'psychology') return 'psychology';
    if (spec === 'psychomotricite' || spec === 'psychomotricity') return 'psychomotricite';
    if (spec === 'neurodevelopmental') return 'neurodevelopmental';
    return spec;
  };

  const [specialty, setSpecialty] = useState(normalizeSpec(initialSpecialty));
  const [symptomsText, setSymptomsText] = useState(initialSoapText || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [practitionerNotes, setPractitionerNotes] = useState('');
  const [isEditingSynthesis, setIsEditingSynthesis] = useState(false);
  const [editedSynthesis, setEditedSynthesis] = useState('');

  // Quick symptom chips by specialty
  const specialtyChips = {
    orthophony: ['صعوبة نطق الفونيمات', 'إبدال وحذف الأصوات (مثل حرف الراء /r/)', 'تأتأة وتكرار المقاطع', 'تأخر لغوي تعبيري', 'عسر القراءة والكتابة', 'عدم وضوح مخارج الحروف'],
    neurodevelopmental: ['قصور التواصل البصري', 'تكرار نمطي ورفرفة', 'حساسية سمعية مفرطة', 'صعوبة التفاعل مع الأقران', 'تمسك صارم بالروتين', 'تشتت الانتباه وفرط النشاط'],
    psychology: ['مزاج مكتئب مستمر', 'فقدان الشغف والمتعة', 'قلق وتوتر دائم', 'أفكار وسواسية متكررة', 'أرق وصعوبة النوم', 'نوبات هلع مفاجئة'],
    psychomotricite: ['تعثر وبطء حركي', 'صعوبة مسك القلم', 'اضطراب التوازن الحركي', 'صعوبة في التناسق البصري الحركي', 'خمول دهليزي وحسي'],
  };

  useEffect(() => {
    if (isOpen && patient?.id) {
      const activeSpec = normalizeSpec(initialSpecialty);
      setSpecialty(activeSpec);
      handleEvaluate(activeSpec);
    }
  }, [isOpen, patient?.id, initialSpecialty]);

  const handleEvaluate = async (selectedSpec = specialty) => {
    if (!patient?.id) return;
    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await clinicalDdssApi.evaluate({
        patient_id: patient.id,
        specialty: selectedSpec,
        symptoms_text: symptomsText,
        soap_text: initialSoapText,
        session_id: sessionId,
        appointment_id: appointmentId,
      });

      if (res?.success) {
        setEvaluation(res.evaluation);
        setRecentTests(res.recent_tests || []);
        setEditedSynthesis(res.evaluation?.clinical_synthesis || '');
        setIsEditingSynthesis(false);
      } else {
        setError(res?.message || 'فشل تشغيل التحليل التشخيصي المعياري.');
      }
    } catch (err) {
      console.error('DDSS evaluate error:', err);
      setError(err.message || 'حدث خطأ أثناء الاتصال بمحرك التشخيص.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = async (confirmed = true) => {
    if (!evaluation?.primary_diagnosis || !patient?.id) return;
    setSaving(true);
    setError(null);

    try {
      const activeSynthesis = editedSynthesis || evaluation.clinical_synthesis || '';
      const payload = {
        patient_id: patient.id,
        session_id: sessionId,
        appointment_id: appointmentId,
        specialty,
        primary_diagnosis_code: evaluation.primary_diagnosis.code || evaluation.primary_diagnosis.dsm5_code,
        primary_diagnosis_title: evaluation.primary_diagnosis.title_ar,
        dsm5_code: evaluation.primary_diagnosis.dsm5_code,
        icd11_code: evaluation.primary_diagnosis.icd11_code,
        confidence_score: evaluation.primary_diagnosis.confidence_score,
        matched_criteria: evaluation.matched_criteria || [],
        unmatched_criteria: evaluation.unmatched_criteria || [],
        differential_diagnoses: evaluation.differential_diagnoses || [],
        clinical_red_alerts: evaluation.clinical_red_alerts || [],
        recommended_referrals: evaluation.recommended_referrals || [],
        practitioner_confirmed: confirmed,
        practitioner_notes: practitionerNotes ? `${practitionerNotes}\n\n[الخلاصة الإكلينيكية المعتمدة]:\n${activeSynthesis}` : activeSynthesis,
        context_payload: {
          clinical_synthesis: activeSynthesis,
        },
      };

      const res = await clinicalDdssApi.saveRecord(payload);
      if (res?.success) {
        setSaveSuccess(true);
      } else {
        setError(res?.message || 'فشل حفظ السجل التشخيصي.');
      }
    } catch (err) {
      console.error('Save diagnostic record error:', err);
      setError(err.message || 'تعذر حفظ السجل في قاعدة البيانات.');
    } finally {
      setSaving(false);
    }
  };

  const handleInjectSoap = () => {
    if (!evaluation || !onInjectSoap) return;
    const diag = evaluation.primary_diagnosis;
    const criteriaStr = (evaluation.matched_criteria || []).map(c => `• ${c.name}: ${c.details || ''}`).join('\n');
    const diffStr = (evaluation.differential_diagnoses || []).map(d => `• ${d.title_ar} (${d.code}): ${d.distinction || ''}`).join('\n');
    const activeSynthesis = editedSynthesis || evaluation.clinical_synthesis || '';

    const injectionText = `[التقييم التشخيصي المعياري DSM-5-TR & ICD-11]\n` +
      `التشخيص الأولي: ${diag.title_ar}\n` +
      `الترميز: DSM-5-TR: ${diag.dsm5_code || 'N/A'} | ICD-11: ${diag.icd11_code || 'N/A'}\n` +
      `نسبة التطابق السريري: ${diag.confidence_score}%\n\n` +
      `المعايير السريرية المتحققة:\n${criteriaStr}\n\n` +
      `التشخيص الفارق المستبعد/المقارن:\n${diffStr}\n\n` +
      `الخلاصة الإكلينيكية والتقييم السريري (المعتمد):\n${activeSynthesis}` +
      (practitionerNotes ? `\n\nملاحظات وقرار الأخصائي الممارس:\n${practitionerNotes}` : '');

    onInjectSoap(injectionText);
    onClose();
  };

  if (!isOpen) return null;

  const diag = evaluation?.primary_diagnosis;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-5xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">المساعد التشخيصي والمعياري (DDSS)</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  DSM-5-TR & ICD-11
                </span>
              </div>
              <p className="text-xs text-slate-400">
                المريض: <span className="text-slate-200 font-medium">{patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`}</span>
                {patient?.birth_date && ` (${Math.floor((new Date() - new Date(patient.birth_date)) / (365.25 * 24 * 3600 * 1000))} سنوات)`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>تم اعتماد وحفظ السجل التشخيصي في الملف السريري للمريض بنجاح.</span>
            </div>
          )}

          {/* Specialty Selector & Symptom Prompter */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300">التخصص والمحور التشخيصي المستهدف:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'neurodevelopmental', label: 'النمائي العصبي والتوحد' },
                  { id: 'orthophony', label: 'التخاطب والأرطوفونيا' },
                  { id: 'psychology', label: 'النفسي والسلوكي' },
                  { id: 'psychomotricite', label: 'التأهيل النفس حركي' },
                ].map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => {
                      setSpecialty(spec.id);
                      handleEvaluate(spec.id);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                      specialty === spec.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">إضافة سريعة:</span>
              {(specialtyChips[specialty] || []).map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSymptomsText(prev => prev ? `${prev}، ${chip}` : chip);
                  }}
                  className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                >
                  + {chip}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={symptomsText}
                onChange={(e) => setSymptomsText(e.target.value)}
                placeholder="أدخل الأعراض الملاحظة أو المظاهر الإكلينيكية للجلسة..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleEvaluate(specialty)}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shrink-0"
              >
                {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>تحليل معياري</span>
              </button>
            </div>
          </div>

          {/* Red Alert Banner if Present */}
          {evaluation?.clinical_red_alerts?.length > 0 && (
            <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                <span>🚨 تنبيه سريري عاجل ومؤشرات خطورة</span>
              </div>
              {evaluation.clinical_red_alerts.map((alert, idx) => (
                <div key={idx} className="bg-red-900/20 border border-red-500/20 rounded-lg p-3 text-xs text-red-200 space-y-1">
                  <div className="font-semibold text-red-300">{alert.title}</div>
                  <p>{alert.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Evaluation Results Card */}
          {diag && (
            <div className="space-y-6">
              {/* Primary Diagnosis Box */}
              <div className="p-5 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl relative overflow-hidden shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                        التشخيص الأولي المقترح
                      </span>
                      <span className="text-xs text-slate-400">{diag.title_fr}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{diag.title_ar}</h3>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <span className="text-slate-300">
                        كود DSM-5-TR: <strong className="text-indigo-400">{diag.dsm5_code || 'N/A'}</strong>
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">
                        كود ICD-11: <strong className="text-teal-400">{diag.icd11_code || 'N/A'}</strong>
                      </span>
                      {diag.severity && (
                        <>
                          <span className="text-slate-500">•</span>
                          <span className="text-amber-400">الشدة: {diag.severity}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Confidence Meter Ring */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-950/70 border border-slate-800 rounded-xl min-w-[110px]">
                    <div className="text-2xl font-black text-emerald-400">
                      {diag.confidence_score}%
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">مؤشر التطابق</div>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${diag.confidence_score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Narrative clinical synthesis with clinician direct editing */}
                {(evaluation.clinical_synthesis || isEditingSynthesis) && (
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl space-y-2.5 border border-indigo-500/20 shadow-inner">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-white text-xs">
                          الخلاصة والتقييم السريري (Clinical Synthesis):
                        </span>
                        {editedSynthesis !== evaluation.clinical_synthesis && (
                          <span className="px-2 py-0.5 text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full font-medium">
                            تم التعديل بواسطة المختص ✏️
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isEditingSynthesis && editedSynthesis !== evaluation.clinical_synthesis && (
                          <button
                            type="button"
                            onClick={() => setEditedSynthesis(evaluation.clinical_synthesis || '')}
                            className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 flex items-center gap-1 transition"
                            title="التراجع عن التعديلات واستعادة نص الذكاء الاصطناعي الأصلي"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>استعادة الأصل</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsEditingSynthesis(!isEditingSynthesis)}
                          className={`text-[11px] px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition border ${
                            isEditingSynthesis
                              ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border-emerald-500/40'
                              : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          {isEditingSynthesis ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>معاينة وتأكيد التعديل ✓</span>
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل وتصحيح النص باليد ✏️</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {isEditingSynthesis ? (
                      <div className="space-y-2 animate-in fade-in duration-200">
                        <textarea
                          value={editedSynthesis}
                          onChange={(e) => setEditedSynthesis(e.target.value)}
                          rows={4}
                          className="w-full bg-slate-900 border border-indigo-500/50 focus:border-indigo-400 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed font-sans shadow-inner"
                          placeholder="يمكنك هنا تصحيح، تدقيق، إضافة، أو حذف أي جملة صاغها الذكاء الاصطناعي وفق رؤيتك السريرية الخاصة..."
                        />
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span className="text-emerald-400">✓</span>
                          <span>سيتم اعتماد هذا النص المعدل تلقائياً عند النقر على 'دمج في تقييم SOAP' أو حفظ السجل السريري.</span>
                        </p>
                      </div>
                    ) : (
                      <p className="whitespace-pre-line text-slate-200 text-xs leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
                        {editedSynthesis || evaluation.clinical_synthesis}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Two-Column Grid: Matched Criteria & Differential Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matched Criteria */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>المعايير السريرية المتحققة (Checklist)</span>
                    </h4>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      {evaluation.matched_criteria?.length || 0} معايير
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(evaluation.matched_criteria || []).map((crit, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-200 font-semibold">
                          <span>{crit.name}</span>
                          <span className="text-[10px] text-emerald-400">{crit.code}</span>
                        </div>
                        {crit.details && <p className="text-[11px] text-slate-400">{crit.details}</p>}
                      </div>
                    ))}

                    {(evaluation.unmatched_criteria || []).map((crit, idx) => (
                      <div key={idx} className="p-2.5 bg-amber-950/20 border border-amber-500/20 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between text-amber-300 font-semibold">
                          <span>{crit.name}</span>
                          <span className="text-[10px] text-amber-400">قيد الاستيفاء</span>
                        </div>
                        {crit.action_required && (
                          <p className="text-[11px] text-slate-400">إجراء مطلوب: {crit.action_required}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Differential Diagnoses */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                      <span>التشخيص الفارق المستبعد (Differential)</span>
                    </h4>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                      {evaluation.differential_diagnoses?.length || 0} اضطرابات
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(evaluation.differential_diagnoses || []).map((diff, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-200 font-semibold">
                          <span>{diff.title_ar}</span>
                          <span className="text-[10px] text-slate-400">{diff.code}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          <strong className="text-slate-300">معيار الفصل: </strong>
                          {diff.distinction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Referrals */}
              {evaluation.recommended_referrals?.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-400" />
                    <span>الإحالات والفحوصات التكميلية الموصى بها (Cross-Referrals)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {evaluation.recommended_referrals.map((ref, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1 text-xs">
                        <div className="font-semibold text-teal-300">{ref.specialty}</div>
                        <p className="text-[11px] text-slate-400">{ref.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practitioner Notes for Confirmation */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>ملاحظات وقرار الأخصائي الممارس (Clinician Decision & Notes):</span>
                </label>
                <textarea
                  value={practitionerNotes}
                  onChange={(e) => setPractitionerNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات سريرية أو تحفظات خاصة قبل اعتماد التشخيص في السجل الطبي..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            إغلاق
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {onInjectSoap && diag && (
              <button
                onClick={handleInjectSoap}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                title="حقن التقييم في تقرير SOAP للجلسة النشطة"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>دمج في تقييم SOAP 📋</span>
              </button>
            )}

            {diag && (
              <button
                onClick={() => handleSaveRecord(true)}
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-md"
              >
                {saving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>اعتماد وحفظ التشخيص في الملف 💾</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
