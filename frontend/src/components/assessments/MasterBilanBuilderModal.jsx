import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckSquare, Square, Download, Printer, Sparkles, 
  Layers, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, 
  Brain, User, Calendar, BookOpen, AlertCircle, RefreshCw, X,
  Globe, Stethoscope, Users, Zap, Check, Eye, Edit3, ChevronRight
} from 'lucide-react';
import { patientBilanApi, clinicalAiCopilotApi } from '../../api';

export default function MasterBilanBuilderModal({ isOpen, onClose, patient, onBilanCreated }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiQuota, setAiQuota] = useState(null);

  const [bilanData, setBilanData] = useState(null);
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  
  // AI Control Panel State
  const [language, setLanguage] = useState('fr'); // 'fr' or 'ar'
  const [audience, setAudience] = useState('medical'); // 'medical' or 'parent'
  const [practitionerNotes, setPractitionerNotes] = useState('');
  const [aiModelUsed, setAiModelUsed] = useState(null);

  // Structured Sections State
  const [bilanType, setBilanType] = useState('orthophonique');
  const [bilanTitle, setBilanTitle] = useState('Compte-Rendu de Bilan Clinique & Évaluation Psychométrique');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [psychometricAnalysis, setPsychometricAnalysis] = useState('');
  const [strengthsWeaknesses, setStrengthsWeaknesses] = useState('');
  const [diagnosticHypotheses, setDiagnosticHypotheses] = useState('');
  const [therapeuticProject, setTherapeuticProject] = useState('');
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);

  useEffect(() => {
    if (isOpen && patient?.id) {
      fetchBilanData();
      fetchAiQuota();
    }
  }, [isOpen, patient?.id]);

  // Adjust title based on language
  useEffect(() => {
    if (language === 'ar') {
      setBilanTitle('الحصيلة الإكلينيكية والتقييم النفسي-المتري الشامل');
    } else {
      setBilanTitle('Compte-Rendu de Bilan Clinique & Évaluation Psychométrique');
    }
  }, [language]);

  const fetchAiQuota = async () => {
    try {
      const res = await clinicalAiCopilotApi.getQuotaStatus();
      if (res.success) {
        setAiQuota(res.quota);
      }
    } catch (err) {
      console.warn('Could not load AI quota status:', err);
    }
  };

  const fetchBilanData = async () => {
    setLoading(true);
    try {
      const res = await patientBilanApi.getBilanData(patient.id);
      setBilanData(res);
      if (res.assessments && res.assessments.length > 0) {
        setSelectedSessionIds(res.assessments.map((a) => a.id));
      }
      if (res.patient?.anamnesis_notes) {
        setPractitionerNotes(res.patient.anamnesis_notes);
      }
    } catch (err) {
      console.error('Error fetching bilan data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = (id) => {
    setSelectedSessionIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!bilanData?.assessments) return;
    if (selectedSessionIds.length === bilanData.assessments.length) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(bilanData.assessments.map((a) => a.id));
    }
  };

  // Trigger AI Clinical Synthesis
  const handleGenerateWithAi = async () => {
    setGeneratingAi(true);
    setAiFeedback(null);
    try {
      const res = await clinicalAiCopilotApi.generateBilan({
        patient_id: patient.id,
        selected_assessment_ids: selectedSessionIds,
        practitioner_notes: practitionerNotes,
        language: language,
        audience: audience,
      });

      if (res.success && res.data) {
        const d = res.data;
        setAiModelUsed(`${d.provider} (${d.model})`);

        if (d.structured_sections) {
          setClinicalSummary(d.structured_sections.synthese_globale || '');
          setPsychometricAnalysis(d.structured_sections.analyse_psychometrique || '');
          setStrengthsWeaknesses(d.structured_sections.points_forts_faiblesses || '');
          setDiagnosticHypotheses(d.structured_sections.hypotheses_diagnostiques || '');
          setTherapeuticProject(d.structured_sections.projet_therapeutique || '');
        }

        setAiFeedback({
          type: 'success',
          text: `تمت صياغة الحصيلة السريرية بنجاح عبر ${d.provider} (${d.tokens_consumed} رمز مستهلك)`,
        });

        // Automatically move to step 2 for review
        setStep(2);
        fetchAiQuota();
      }
    } catch (err) {
      setAiFeedback({
        type: 'error',
        text: err.message || 'حدث خطأ أثناء توليد الحصيلة السريرية بالذكاء الاصطناعي.',
      });
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleGenerateAndSave = async () => {
    setSaving(true);
    try {
      const payload = {
        included_session_ids: selectedSessionIds,
        bilan_type: bilanType,
        title: bilanTitle,
        clinical_summary: `${clinicalSummary}\n\n${psychometricAnalysis}\n\n${strengthsWeaknesses}`,
        therapeutic_project: therapeuticProject,
        diagnosis_codes: diagnosticHypotheses,
        language: language,
      };

      const res = await patientBilanApi.generateBilan(patient.id, payload);
      setGeneratedPdfUrl(res.pdf_url);
      setStep(3);
      if (onBilanCreated) onBilanCreated(res.bilan);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء إنشاء وتوثيق الحصيلة');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const isRtl = language === 'ar';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header with Patient Card & Quota Indicator */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2 space-x-reverse">
                <span>مولد الحصيلة الإكلينيكية الذكي (Bilingual AI Clinical Bilan)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  DSM-5 / ICD-11
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                المريض: <strong className="text-white">{patient?.first_name} {patient?.last_name}</strong> &bull; العمر: {bilanData?.patient?.age_formatted || '--'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse self-end sm:self-auto">
            {/* AI Token Balance Chip */}
            {aiQuota && (
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono flex items-center space-x-1.5 space-x-reverse">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span className="text-slate-400">رصيد الذكاء الاصطناعي:</span>
                <span className="font-black text-teal-400">{aiQuota.tokens_balance?.toLocaleString()}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-950/50 px-6 py-3 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6 space-x-reverse">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center space-x-2 space-x-reverse font-bold transition-colors ${
                step === 1 ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${
                step === 1 ? 'bg-teal-600 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
              }`}>1</span>
              <span>تكوين الصياغة واختيار المقاييس ({selectedSessionIds.length})</span>
            </button>

            <span className="text-slate-700">&bull;</span>

            <button
              onClick={() => setStep(2)}
              className={`flex items-center space-x-2 space-x-reverse font-bold transition-colors ${
                step === 2 ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${
                step === 2 ? 'bg-teal-600 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
              }`}>2</span>
              <span>المراجعة السريرية والمحرر التفاعلي</span>
            </button>

            <span className="text-slate-700">&bull;</span>

            <button
              onClick={() => step === 3 && setStep(3)}
              className={`flex items-center space-x-2 space-x-reverse font-bold transition-colors ${
                step === 3 ? 'text-teal-400' : 'text-slate-500'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${
                step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>3</span>
              <span>المعاينة والتصدير الرسمي A4</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            المرحلة {step} من 3
          </div>
        </div>

        {/* Feedback Alert */}
        {aiFeedback && (
          <div className={`px-6 py-3 text-xs font-bold flex items-center justify-between border-b ${
            aiFeedback.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
          }`}>
            <span>{aiFeedback.text}</span>
            <button onClick={() => setAiFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-teal-400" />
              <p className="text-xs font-bold">جاري تجميع البيانات السريرية وسجل المقاييس...</p>
            </div>
          ) : step === 1 ? (
            /* ================= STEP 1: AI CONFIG & TEST SELECTION ================= */
            <div className="space-y-6">
              {/* AI Generation Control Bar */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-teal-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      لوحة التحكم في الذكاء الاصطناعي السريري (Clinical Copilot Parameters)
                    </h4>
                  </div>
                  {aiModelUsed && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-teal-300 border border-slate-800">
                      {aiModelUsed}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Language Selector */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center space-x-1.5 space-x-reverse">
                      <Globe className="w-3.5 h-3.5 text-teal-400" />
                      <span>لغة الصياغة والتحرير:</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLanguage('fr')}
                        className={`p-2.5 rounded-xl border font-black transition flex items-center justify-center space-x-1.5 space-x-reverse ${
                          language === 'fr' 
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <span>🇫🇷 Français Médical</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLanguage('ar')}
                        className={`p-2.5 rounded-xl border font-black transition flex items-center justify-center space-x-1.5 space-x-reverse ${
                          language === 'ar' 
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <span>🇩🇿 العربية الأكاديمية</span>
                      </button>
                    </div>
                  </div>

                  {/* Target Audience Selector */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center space-x-1.5 space-x-reverse">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>الجمهور المستهدف ونبرة الخطاب:</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAudience('medical')}
                        className={`p-2.5 rounded-xl border font-black transition flex items-center justify-center space-x-1.5 space-x-reverse ${
                          audience === 'medical' 
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>🏥 تقني (طبيب/أخصائي)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAudience('parent')}
                        className={`p-2.5 rounded-xl border font-black transition flex items-center justify-center space-x-1.5 space-x-reverse ${
                          audience === 'parent' 
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>👨‍👩‍👧 مبسط (الأولياء/المدرسة)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Practitioner Raw Notes */}
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-300 font-bold">
                    ملاحظات الطبيب/الأخصائي الميدانية وسلوك الطفل أثناء الفحص (اختياري):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="مثال: الطفل كان متعاوناً مع الأنشطة البصرية، تشتت خفيف في المهام السمعية الطويلة، تحسن في التواصل العيني..."
                    value={practitionerNotes}
                    onChange={(e) => setPractitionerNotes(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Tests Selection Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white">المقاييس والاختبارات النفسية-المترية المنجزة</h4>
                    <p className="text-xs text-slate-400">حدد الاختبارات المراد تحليل درجاتها وأبعادها الفرعية في الحصيلة</p>
                  </div>
                  <button
                    onClick={toggleSelectAll}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
                  >
                    {selectedSessionIds.length === (bilanData?.assessments?.length || 0) ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-teal-400" />
                        <span>إلغاء تحديد الكل</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                        <span>تحديد كل الاختبارات ({bilanData?.assessments?.length || 0})</span>
                      </>
                    )}
                  </button>
                </div>

                {(!bilanData?.assessments || bilanData.assessments.length === 0) ? (
                  <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-500 space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs font-bold">لا توجد اختبارات مسجلة بعد لهذا المريض.</p>
                    <p className="text-[11px] text-slate-600">يمكنك المتابعة لإنشاء حصيلة تقييمية اعتماداً على الملاحظة السريرية والسوابق النمائية.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bilanData.assessments.map((test) => {
                      const isSelected = selectedSessionIds.includes(test.id);
                      return (
                        <div
                          key={test.id}
                          onClick={() => toggleSession(test.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? 'bg-teal-500/10 border-teal-500/40 text-white shadow-md' 
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Square className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-extrabold text-xs text-white">{test.title || test.test_title || test.type}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {test.created_at ? new Date(test.created_at).toLocaleDateString('fr-FR') : ''} &bull; الدرجة: {test.score || test.total_score || '--'}
                              </div>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            test.severity_level === 'severe' || test.severity_level === 'high'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          }`}>
                            {test.severity_level || test.risk_level || 'مكتمل'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Generate Action Button */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  تخطي الصياغة الذكية والتحرير اليدوي ──►
                </button>

                <button
                  type="button"
                  onClick={handleGenerateWithAi}
                  disabled={generatingAi}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-xl shadow-teal-500/25 flex items-center space-x-2 space-x-reverse transition-all disabled:opacity-50"
                >
                  {generatingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-current" />}
                  <span>{generatingAi ? 'جاري صياغة الحصيلة السريرية بالذكاء الاصطناعي...' : '✨ صياغة الحصيلة السريرية بالذكاء الاصطناعي'}</span>
                </button>
              </div>
            </div>
          ) : step === 2 ? (
            /* ================= STEP 2: SPLIT-VIEW CLINICAL EDITOR ================= */
            <div className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
              {/* Document Title Header */}
              <div className="space-y-1.5">
                <label className="text-slate-300 text-xs font-bold">
                  {isRtl ? 'عنوان التقرير الطبي والحصيلة:' : 'Titre Officiel du Compte-Rendu :'}
                </label>
                <input
                  type="text"
                  value={bilanTitle}
                  onChange={(e) => setBilanTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white font-extrabold text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Section 1: Synthèse Globale */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-teal-400 flex items-center space-x-1.5 space-x-reverse">
                    <span>1. {isRtl ? 'الخلاصة السريرية وسياق الفحص' : 'Synthèse Globale & Motif du Bilan'}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Section 1</span>
                </div>
                <textarea
                  rows={3}
                  value={clinicalSummary}
                  onChange={(e) => setClinicalSummary(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Section 2: Psychometric Analysis */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-400 flex items-center space-x-1.5 space-x-reverse">
                    <span>2. {isRtl ? 'التحليل النفسي-المتري للدرجات والاختبارات' : 'Analyse Psychométrique des Scores (WISC, ELO, ADOS, Vineland)'}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Section 2</span>
                </div>
                <textarea
                  rows={3}
                  value={psychometricAnalysis}
                  onChange={(e) => setPsychometricAnalysis(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Section 3: Strengths and Fragilities */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-400 flex items-center space-x-1.5 space-x-reverse">
                    <span>3. {isRtl ? 'نقاط القوة ومواطن الضعف النمائية' : 'Points d\'Appui & Axes de Fragilité'}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Section 3</span>
                </div>
                <textarea
                  rows={3}
                  value={strengthsWeaknesses}
                  onChange={(e) => setStrengthsWeaknesses(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Section 4: Diagnostic Hypotheses */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-purple-400 flex items-center space-x-1.5 space-x-reverse">
                    <span>4. {isRtl ? 'الفرضيات التشخيصية السريرية (DSM-5 / CIM-11)' : 'Hypothèses Diagnostiques & Codage DSM-5 / CIM-11'}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Section 4</span>
                </div>
                <textarea
                  rows={2}
                  value={diagnosticHypotheses}
                  onChange={(e) => setDiagnosticHypotheses(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Section 5: Therapeutic Project */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-400 flex items-center space-x-1.5 space-x-reverse">
                    <span>5. {isRtl ? 'المشروع العلاجي الفردي والتوصيات المدرسية' : 'Projet Thérapeutique Individualisé & Aménagements Pédagogiques'}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Section 5</span>
                </div>
                <textarea
                  rows={3}
                  value={therapeuticProject}
                  onChange={(e) => setTherapeuticProject(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between" dir="rtl">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1 space-x-reverse"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>العودة لإعدادات التوليد</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAndSave}
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 flex items-center space-x-2 space-x-reverse transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  <span>{saving ? 'جاري بناء الحصيلة وتوليد PDF...' : '📄 اعتماد الحصيلة وتوليد وثيقة A4 الرسمية'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= STEP 3: FINAL PREVIEW & PDF DOWNLOAD ================= */
            <div className="py-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-black text-white">تم توثيق واعتماد الحصيلة الإكلينيكية بنجاح!</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  تم دمج كافة التحليلات النفسية-المترية والمشروع العلاجي في وثيقة طبية رسمية مدمجة بالترويسة والختم الرقمي.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                {generatedPdfUrl && (
                  <a
                    href={generatedPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-xl shadow-teal-500/25 flex items-center space-x-2 space-x-reverse transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل وثيقة الحصيلة الرسمية (PDF A4)</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
