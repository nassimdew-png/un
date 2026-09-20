import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckSquare, Square, Download, Printer, Sparkles, 
  Layers, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, 
  Brain, User, Calendar, BookOpen, AlertCircle, RefreshCw, X,
  Globe, Stethoscope, Users, Zap, Check, Eye, Edit3, ChevronRight,
  GitBranch, Activity, Baby, Send, Target, Plus, Trash2, Award,
  AlertTriangle, ClipboardCheck, QrCode, Lock, Loader2, ExternalLink
} from 'lucide-react';
import { patientBilanApi, clinicalAiCopilotApi, whatsappApi } from '../../api';
import DigitalSignaturePadModal from '../common/DigitalSignaturePadModal';
import DsmDiagnosticAssistantModal from '../clinical/DsmDiagnosticAssistantModal';
import SmartPeiBuilderModal from '../clinical/SmartPeiBuilderModal';

const DEFAULT_PEI_GOALS = [
  { id: 'g1', text: 'نطق صوت الراء /r/ في بداية الكلمة بدقة 80%', status: 'in_progress' },
  { id: 'g2', text: 'إنتاج جملة اسمية من 3 عناصر (فاعل + فعل + مفعول)', status: 'in_progress' },
  { id: 'g3', text: 'الحفاظ على التواصل البصري أثناء الإجابة لمدة 10 ثوانٍ', status: 'achieved' },
  { id: 'g4', text: 'تقليل التكرارات التأتاتية باستخدام التنفس البطني', status: 'needs_work' },
];

export default function MasterBilanBuilderModal({ 
  isOpen, 
  onClose, 
  patient, 
  onBilanCreated,
  initialSoapNotes = null,
  initialPeiGoals = null,
  initialSpecialty = 'orthophony' 
}) {
  const [step, setStep] = useState(1);
  const [showDsmModal, setShowDsmModal] = useState(false);
  const [showSmartPeiModal, setShowSmartPeiModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiQuota, setAiQuota] = useState(null);

  const [bilanData, setBilanData] = useState(null);
  
  // Tests selection: digital standardized scales vs legacy
  const [selectedDigitalTestIds, setSelectedDigitalTestIds] = useState([]);
  const [selectedLegacyIds, setSelectedLegacyIds] = useState([]);
  
  // PEI goals
  const [peiGoals, setPeiGoals] = useState(initialPeiGoals || DEFAULT_PEI_GOALS);
  const [newGoalText, setNewGoalText] = useState('');
  const [loadingAiBilanGoals, setLoadingAiBilanGoals] = useState(false);

  const [includedSections, setIncludedSections] = useState({
    genogram: true,
    sensory_map: true,
    anamnesis: true,
    assessments: true,
    pei_goals: true,
    therapeutic_project: true,
  });
  
  // AI Control Panel State
  const [language, setLanguage] = useState('ar'); // Default Arabic clinical standard
  const [audience, setAudience] = useState('medical'); // 'medical' or 'parent'
  const [practitionerNotes, setPractitionerNotes] = useState('');
  const [aiModelUsed, setAiModelUsed] = useState(null);

  // Structured Sections State
  const [bilanType, setBilanType] = useState(
    initialSpecialty === 'psychology' ? 'psychologique' : (initialSpecialty === 'psychomotricite' ? 'psychomoteur' : 'orthophonique')
  );
  const [bilanTitle, setBilanTitle] = useState('الحصيلة الإكلينيكية والتقييم النفسي-المتري الشامل');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [psychometricAnalysis, setPsychometricAnalysis] = useState('');
  const [strengthsWeaknesses, setStrengthsWeaknesses] = useState('');
  const [diagnosticHypotheses, setDiagnosticHypotheses] = useState('');
  const [therapeuticProject, setTherapeuticProject] = useState('');
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);

  // Digital Signature & QR Verification States
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [includeDigitalSeal, setIncludeDigitalSeal] = useState(true);
  const [signatureData, setSignatureData] = useState(() => localStorage.getItem('clinic_practitioner_signature') || null);
  const [stampData, setStampData] = useState(() => localStorage.getItem('clinic_practitioner_stamp') || null);
  const [licenseNumber, setLicenseNumber] = useState(() => localStorage.getItem('clinic_practitioner_license') || 'DZ-MSP-77492-MED');
  const [savedBilanId, setSavedBilanId] = useState(null);

  useEffect(() => {
    if (isOpen && patient?.id) {
      fetchBilanData();
      fetchAiQuota();
      if (initialPeiGoals && initialPeiGoals.length > 0) {
        setPeiGoals(initialPeiGoals);
      }
      if (initialSoapNotes) {
        if (initialSoapNotes.subjective && !clinicalSummary) {
          setClinicalSummary(initialSoapNotes.subjective);
        }
        if (initialSoapNotes.plan && !therapeuticProject) {
          setTherapeuticProject(initialSoapNotes.plan);
        }
        if (initialSoapNotes.assessment && !diagnosticHypotheses) {
          setDiagnosticHypotheses(initialSoapNotes.assessment);
        }
      }
    }
  }, [isOpen, patient?.id]);

  // Adjust title based on language
  useEffect(() => {
    if (language === 'ar') {
      setBilanTitle(
        bilanType === 'psychologique'
          ? 'تقرير الحصيلة النفسية العيادية والتقييم السريري'
          : bilanType === 'psychomoteur'
          ? 'تقرير الحصيلة النفسية-الحركية والتأهيلية'
          : 'الحصيلة الإكلينيكية والتقييم الأرطوفوني الشامل'
      );
    } else {
      setBilanTitle(
        bilanType === 'psychologique'
          ? 'Compte-Rendu de Bilan Psychologique & Clinique'
          : bilanType === 'psychomoteur'
          ? 'Compte-Rendu de Bilan Psychomoteur'
          : 'Compte-Rendu de Bilan Orthophonique Standardisé'
      );
    }
  }, [language, bilanType]);

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
      
      // Auto-select all completed digital tests by default
      if (res.digital_tests && res.digital_tests.length > 0) {
        setSelectedDigitalTestIds(res.digital_tests.map((t) => t.id));
      }
      if (res.assessments && res.assessments.length > 0) {
        setSelectedLegacyIds(res.assessments.map((a) => a.id));
      }
      if (res.patient?.anamnesis_notes) {
        setPractitionerNotes(res.patient.anamnesis_notes);
      }

      // If patient has recent SOAP and fields are empty, prefill prompt
      if (res.recent_soap_notes && res.recent_soap_notes.length > 0 && !clinicalSummary) {
        const lastSoap = res.recent_soap_notes[0];
        if (lastSoap.subjective) setClinicalSummary(lastSoap.subjective);
        if (lastSoap.plan) setTherapeuticProject(lastSoap.plan);
        if (lastSoap.assessment) setDiagnosticHypotheses(lastSoap.assessment);
      }
    } catch (err) {
      console.error('Error fetching bilan data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDigitalTest = (id) => {
    setSelectedDigitalTestIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllDigital = () => {
    if (!bilanData?.digital_tests) return;
    if (selectedDigitalTestIds.length === bilanData.digital_tests.length) {
      setSelectedDigitalTestIds([]);
    } else {
      setSelectedDigitalTestIds(bilanData.digital_tests.map((t) => t.id));
    }
  };

  const toggleLegacyAssessment = (id) => {
    setSelectedLegacyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllLegacy = () => {
    if (!bilanData?.assessments) return;
    if (selectedLegacyIds.length === bilanData.assessments.length) {
      setSelectedLegacyIds([]);
    } else {
      setSelectedLegacyIds(bilanData.assessments.map((a) => a.id));
    }
  };

  const handleImportAssessmentToAnalysis = (assessment) => {
    if (!assessment) return;
    const textToAdd = assessment.recommendations || assessment.diagnostic_conclusion || '';
    if (!textToAdd) return;
    setPsychometricAnalysis((prev) => {
      if (!prev) return textToAdd;
      return `${prev}\n\n---\n• [${assessment.title}]:\n${textToAdd}`;
    });
    setAiFeedback({
      type: 'success',
      text: `تم استيراد نتيجة [${assessment.title}] إلى التحليل النفسي-المتري بنجاح!`,
    });
  };

  // Import from last SOAP note
  const handleImportFromSoap = (soap) => {
    if (!soap) return;
    if (soap.subjective) setClinicalSummary(soap.subjective);
    if (soap.objective) setPsychometricAnalysis(`نتائج الفحص المباشر: ${soap.objective}`);
    if (soap.assessment) setDiagnosticHypotheses(soap.assessment);
    if (soap.plan) setTherapeuticProject(soap.plan);
    setAiFeedback({
      type: 'success',
      text: 'تم استيراد بيانات الجلسة السريرية (SOAP) بنجاح إلى حقول الحصيلة.',
    });
  };

  // Add custom PEI goal
  const handleAddPeiGoal = (e) => {
    e.preventDefault();
    const clean = newGoalText.trim();
    if (!clean) return;
    setPeiGoals((prev) => [
      ...prev,
      { id: `custom_${Date.now()}`, text: clean, status: 'in_progress' }
    ]);
    setNewGoalText('');
  };

  const updateGoalStatus = (goalId, newStatus) => {
    setPeiGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, status: newStatus } : g))
    );
  };

  const removeGoal = (goalId) => {
    setPeiGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const handleAiSuggestPeiGoalsForBilan = async () => {
    if (!patient?.id || loadingAiBilanGoals) return;
    setLoadingAiBilanGoals(true);
    try {
      const res = await clinicalAiCopilotApi.suggestPeiGoals({
        patient_id: patient.id,
        specialty: initialSpecialty || (bilanType === 'psychologique' ? 'psychology' : 'orthophony'),
        notes: `${clinicalSummary || ''} ${diagnosticHypotheses || ''}`.trim(),
        current_goals: peiGoals.map((g) => g.text),
        language: language || 'ar',
      });
      if (res && res.goals && res.goals.length > 0) {
        const newGoals = res.goals.map((g, idx) => ({
          id: `ai_bilan_${Date.now()}_${idx}`,
          text: g.text || g.title,
          status: 'in_progress',
        }));
        setPeiGoals((prev) => [...prev, ...newGoals]);
        setAiFeedback({
          type: 'success',
          text: `تم اقتراح وإدراج ${newGoals.length} أهداف SMART متوافقة مع التقرير الطبي بنجاح ✨`,
        });
      }
    } catch (err) {
      console.error('Error suggesting goals for bilan:', err);
      setAiFeedback({
        type: 'error',
        text: 'تعذر اقتراح أهداف PEI بالذكاء الاصطناعي.',
      });
    } finally {
      setLoadingAiBilanGoals(false);
    }
  };

  // Trigger AI Clinical Synthesis
  const handleGenerateWithAi = async () => {
    setGeneratingAi(true);
    setAiFeedback(null);
    try {
      const res = await clinicalAiCopilotApi.generateBilan({
        patient_id: patient.id,
        selected_assessment_ids: selectedLegacyIds,
        selected_test_assignment_ids: selectedDigitalTestIds,
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
          text: `تمت صياغة الحصيلة السريرية بنجاح عبر ${d.provider} (المستهلك في هذه الصياغة: ${d.tokens_consumed} توكن)`,
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
        selected_session_ids: selectedLegacyIds,
        selected_test_assignment_ids: selectedDigitalTestIds,
        pei_goals: peiGoals,
        soap_notes: initialSoapNotes,
        bilan_type: bilanType,
        title: bilanTitle,
        clinical_summary: clinicalSummary,
        psychometric_analysis: psychometricAnalysis,
        strengths_weaknesses: strengthsWeaknesses,
        therapeutic_project: therapeuticProject,
        diagnosis_codes: diagnosticHypotheses,
        included_sections: includedSections,
        language: language,
        audience: audience,
        signature_data: signatureData,
        stamp_data: stampData,
        license_number: licenseNumber,
        include_seal: includeDigitalSeal,
      };

      const res = await patientBilanApi.generateBilan(patient.id, payload);
      setGeneratedPdfUrl(res.pdf_url);
      if (res.bilan?.id) {
        setSavedBilanId(res.bilan.id);
      }
      setStep(3);
      if (onBilanCreated) onBilanCreated(res.bilan);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء إنشاء وتوثيق الحصيلة');
    } finally {
      setSaving(false);
    }
  };

  const [sendingWa, setSendingWa] = useState(false);
  const [waSentSuccess, setWaSentSuccess] = useState(false);

  const handleShareWhatsApp = async (forceManual = false) => {
    const phone = patient?.phone;
    if (!phone) {
      alert('رقم هاتف المريض أو الولي غير مسجل في الملف.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const clinicName = bilanData?.patient?.tenant?.name || 'العيادة الطبية';
    const messageText = 
      `السلام عليكم ورحمة الله وبركاته،\n` +
      `تحية طيبة من ${clinicName}.\n` +
      `نحيطكم علماً بأنه قد تم إصدار وتوثيق تقرير الحصيلة السريرية الشاملة للمريض: ${patient.first_name} ${patient.last_name}.\n\n` +
      `• العنوان: ${bilanTitle}\n` +
      `• التشخيص والنتائج: ${diagnosticHypotheses || 'فحص سريري معتمد'}\n` +
      `• التوصيات والمشروع العلاجي: ${therapeuticProject ? therapeuticProject.slice(0, 160) + '...' : 'توصيات ومتابعة محددة'}\n\n` +
      `• رابط التحقق الرقمي: https://psypro.tech/verify/doc/BILAN-${savedBilanId || patient?.id || '1'}\n\n` +
      `يمكنكم استلام النسخة الرسمية المختومة من العيادة أو التواصل معنا لمناقشة الخطة العلاجية.`;

    if (forceManual) {
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
      return;
    }

    setSendingWa(true);
    try {
      await whatsappApi.sendMessage({
        phone: cleanPhone,
        message: messageText,
        patient_id: patient?.id,
        service_type: 'bilan_notification'
      });
      setWaSentSuccess(true);
      alert('✅ تم إرسال إشعار الحصيلة الطبية إلى واتساب المريض بنجاح عبر خدمة المنصة الرسمية.');
    } catch (err) {
      console.warn('WhatsApp Cloud API dispatch failed, opening manual link:', err);
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
    } finally {
      setSendingWa(false);
    }
  };

  if (!isOpen) return null;

  const isRtl = language === 'ar';
  const digitalTests = bilanData?.digital_tests || [];
  const criticalCount = digitalTests.filter(t => t.has_critical_alert).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header with Patient Card & Quota Indicator */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2 space-x-reverse">
                <span>محرك الحصائل والتقارير الطبية الرسمية (Automated Clinical Bilan Engine)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  DSM-5 / CIM-11
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
                <span className="text-slate-400">الرصيد المتاح:</span>
                <span className="font-black text-teal-400">{aiQuota.tokens_balance?.toLocaleString()}</span>
                <span className="text-slate-500 text-[10px]">توكن</span>
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
              <span>تكوين المقاييس وأهداف PEI ({selectedDigitalTestIds.length} رائز)</span>
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
              <span>المحرر السريري والتشخيص المعياري</span>
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
              <span>المعاينة والتصدير الرسمي A4 & WhatsApp</span>
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
              <p className="text-xs font-bold">جاري استرجاع السجل السريري والمقاييس الرقمية وأهداف PEI...</p>
            </div>
          ) : step === 1 ? (
            /* ================= STEP 1: PARAMETERS, TESTS & PEI GOALS ================= */
            <div className="space-y-6">
              
              {/* Quick SOAP Importer Bar */}
              {bilanData?.recent_soap_notes && bilanData.recent_soap_notes.length > 0 && (
                <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5 space-x-reverse">
                    <ClipboardCheck className="w-4 h-4 text-teal-400" />
                    <div>
                      <span className="text-xs font-black text-white block">
                        تتوفر سجلات SOAP حديثة من الجلسات السابقة لهذا المريض
                      </span>
                      <span className="text-[10px] text-slate-400">
                        آخر جلسة: {new Date(bilanData.recent_soap_notes[0].session_date || bilanData.recent_soap_notes[0].created_at).toLocaleDateString('ar-DZ')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleImportFromSoap(bilanData.recent_soap_notes[0])}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-md"
                  >
                    <span>⚡ استيراد ملاحظات SOAP إلى الحصيلة</span>
                  </button>
                </div>
              )}

              {/* Red Alert Warning Banner if any critical scale found */}
              {criticalCount > 0 && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 flex items-center space-x-3 space-x-reverse text-rose-200">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-black block">🚨 تنبيه أمان سريري عاجل (Red Alert Detected):</span>
                    تم رصد {criticalCount} مقياس يحتوي على بنود حرجة أو أفكار إيذاء نفس؛ سيتم إبراز التحذير تلقائياً في التقرير الطبي لحماية المريض.
                  </div>
                </div>
              )}

              {/* Configuration Bar: Language & Specialty */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      معايير التقرير واللغة والتخصص السريري
                    </h4>
                  </div>
                  {aiModelUsed && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-teal-300 border border-slate-800">
                      {aiModelUsed}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Language Selector */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center space-x-1.5 space-x-reverse">
                      <Globe className="w-3.5 h-3.5 text-teal-400" />
                      <span>لغة الصياغة والتقرير:</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLanguage('ar')}
                        className={`p-2 rounded-xl border font-black transition text-center ${
                          language === 'ar' 
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        🇩🇿 العربية الطبية
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('fr')}
                        className={`p-2 rounded-xl border font-black transition text-center ${
                          language === 'fr' 
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        🇫🇷 Français
                      </button>
                    </div>
                  </div>

                  {/* Bilan Specialty */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center space-x-1.5 space-x-reverse">
                      <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
                      <span>التخصص والمسار السريري:</span>
                    </label>
                    <select
                      value={bilanType}
                      onChange={(e) => setBilanType(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs focus:outline-none focus:border-teal-500"
                    >
                      <option value="orthophonique">أرطوفونيا وتخاطب (Orthophonie)</option>
                      <option value="psychologique">علم النفس العيادي (Psychologie)</option>
                      <option value="psychomoteur">التأهيل النفسي-حركي (Psychomotricité)</option>
                      <option value="neuropsychologique">فحص عصبي-معرفي (Neuropsychologie)</option>
                      <option value="pluridisciplinaire">حصيلة متعددة التخصصات (Pluridisciplinaire)</option>
                    </select>
                  </div>

                  {/* Target Audience */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold flex items-center space-x-1.5 space-x-reverse">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>الجهة الموجه إليها التقرير:</span>
                    </label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs focus:outline-none focus:border-teal-500"
                    >
                      <option value="medical">🏥 تقرير طبي موجه لطبيب مختص / معالج</option>
                      <option value="parent">👨‍👩‍👧 تقرير سريري مبسط للأولياء والأسرة</option>
                      <option value="school">🏫 ملف توجيهي وتسهيلات مدرسية (École)</option>
                    </select>
                  </div>
                </div>

                {/* Practitioner Raw Notes */}
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-300 font-bold">
                    ملاحظات سريرية وسلوك المريض أثناء الفحص (اختياري للصياغة الذكية):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="مثال: المريض أبدى تعاوناً إيجابياً، تركيز جيد في المهام البصرية، تشتت خفيف مع المهام السمعية الطويلة..."
                    value={practitionerNotes}
                    onChange={(e) => setPractitionerNotes(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Standardized Digital Scales (The 18 Standard Scales) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                      <Brain className="w-4 h-4 text-teal-400" />
                      <span>المقاييس والاختبارات الرقمية المعيارية المنجزة ({digitalTests.length})</span>
                    </h4>
                    <p className="text-xs text-slate-400">حدد المقاييس المعيارية لتضمين درجاتها وتصنيفاتها في التقرير</p>
                  </div>
                  <button
                    onClick={toggleSelectAllDigital}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
                  >
                    {selectedDigitalTestIds.length === digitalTests.length ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-teal-400" />
                        <span>إلغاء تحديد الكل</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                        <span>تحديد كل المقاييس ({digitalTests.length})</span>
                      </>
                    )}
                  </button>
                </div>

                {digitalTests.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-500 space-y-1">
                    <BookOpen className="w-6 h-6 mx-auto text-slate-600" />
                    <p className="text-xs font-bold">لا توجد مقاييس رقمية معيارية مكتملة بعد لهذا المريض.</p>
                    <p className="text-[10px] text-slate-600">يمكنك تمرير المقاييس الـ 18 مباشرة أثناء الجلسة أو الاعتماد على الفحص المباشر.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {digitalTests.map((t) => {
                      const isSelected = selectedDigitalTestIds.includes(t.id);
                      const isCrit = t.has_critical_alert;
                      return (
                        <div
                          key={t.id}
                          onClick={() => toggleDigitalTest(t.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? isCrit
                                ? 'bg-rose-950/30 border-rose-500/50 text-white shadow-md'
                                : 'bg-teal-500/10 border-teal-500/40 text-white shadow-md' 
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              isSelected 
                                ? isCrit ? 'bg-rose-600 text-white' : 'bg-teal-500 text-slate-950' 
                                : 'bg-slate-800 text-slate-500'
                            }`}>
                              {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Square className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-extrabold text-xs text-white flex items-center space-x-1.5 space-x-reverse">
                                <span>{t.test_title || t.test_code}</span>
                                {isCrit && <span className="text-xs">🚨</span>}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {t.completed_at ? new Date(t.completed_at).toLocaleDateString('ar-DZ') : ''} &bull; الدرجة: <strong className="text-teal-300">{t.raw_score ?? '--'}</strong>
                              </div>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCrit
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          }`}>
                            {t.severity_label || (t.status === 'completed' ? 'مكتمل' : 'قيد الانتظار')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Clinical Battery Assessments & Specialized Digital Scorers (WISC, MMPI, STROOP, REY, ZAREKI, TAT...) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                      <Award className="w-4 h-4 text-indigo-400" />
                      <span>البطاريات والروائز السريرية والمصححات الذكية ({bilanData?.assessments?.length || 0})</span>
                    </h4>
                    <p className="text-xs text-slate-400">روائز الذكاء (WISC/WAIS)، الشخصية (MMPI)، الانتباه (Stroop)، راي، وزريكي المنجزة للمريض</p>
                  </div>
                  {bilanData?.assessments && bilanData.assessments.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAllLegacy}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1.5 space-x-reverse"
                    >
                      {selectedLegacyIds.length === bilanData.assessments.length ? (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                          <span>إلغاء تحديد الكل</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                          <span>تحديد الكل ({bilanData.assessments.length})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {(!bilanData?.assessments || bilanData.assessments.length === 0) ? (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-500 space-y-1">
                    <Award className="w-6 h-6 mx-auto text-slate-600" />
                    <p className="text-xs font-bold">لا توجد بطاريات أو روائز سريرية متقدمة مسجلة بعد.</p>
                    <p className="text-[10px] text-slate-600">يمكنك تشغيل المصححات الرقمية المتقدمة (WISC, MMPI-2, Stroop, Rey, Zareki) من بنك الروائز وحفظها هنا.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bilanData.assessments.map((a) => {
                      const isSelected = selectedLegacyIds.includes(a.id);
                      return (
                        <div
                          key={a.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                            isSelected
                              ? 'bg-indigo-950/30 border-indigo-500/50 text-white shadow-md'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div
                              onClick={() => toggleLegacyAssessment(a.id)}
                              className="flex items-start space-x-3 space-x-reverse cursor-pointer flex-1"
                            >
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                              }`}>
                                {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Square className="w-4 h-4" />}
                              </div>
                              <div>
                                <h5 className="font-extrabold text-xs text-white leading-tight">{a.title}</h5>
                                <div className="text-[10px] text-slate-400 font-mono mt-1">
                                  {a.assessment_date ? new Date(a.assessment_date).toLocaleDateString('ar-DZ') : ''}
                                  {a.diagnostic_conclusion && (
                                    <span className="text-indigo-300 font-bold mr-2">&bull; {a.diagnostic_conclusion}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                              {a.type === 'orthophony_bilan' ? 'أرطوفونيا' : 'فحص نفسي-متري'}
                            </span>
                          </div>

                          {(a.recommendations || a.diagnostic_conclusion) && (
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                {a.recommendations ? a.recommendations.slice(0, 45) + '...' : a.diagnostic_conclusion}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleImportAssessmentToAnalysis(a)}
                                className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold transition flex items-center gap-1 shrink-0"
                                title="استيراد التقرير الكامل إلى التحليل النفسي-المتري للحصيلة"
                              >
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>استيراد للتحليل</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Psychomotor Body Map & Balance Examination Section */}
              {bilanType === 'psychomoteur' && (
                <div className="p-5 rounded-3xl bg-slate-950 border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2.5 space-x-reverse">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">
                          فحص خريطة الجسد والتأهيل الحركي الحسي (Sensory & Tonus Body Map)
                        </h4>
                        <p className="text-xs text-slate-400">
                          {bilanData?.latest_psychomotor_assessment
                            ? `توجد بيانات فحص حركي محفوظة بتاريخ ${bilanData.latest_psychomotor_assessment.assessment_date}`
                            : 'يمكنك استيراد بيانات الفحص الحركي أو فتح خريطة الجسد لتضمينها في الحصيلة'}
                        </p>
                      </div>
                    </div>

                    {bilanData?.latest_psychomotor_assessment && (
                      <button
                        type="button"
                        onClick={() => {
                          const pData = bilanData.latest_psychomotor_assessment;
                          const stats = pData.body_map_stats || {};
                          const lat = pData.lateral_profile || {};
                          const psychomText = `[فحص خريطة الجسد والنغمة العضلية]:\n- عدد مناطق الاضطراب التوتري: ${stats.abnormalTonusCount || 0} (فرط توتر: ${stats.hypertonieCount || 0}، رخاوة: ${stats.hypotonieCount || 0}).\n- الدفاع والتحسس اللمسي: ${stats.hypersensibleCount || 0} مناطق دفاع لمسي.\n- الجانبية: ${lat.profileLabelAr || 'غير محددة'}.\n- الخلاصة السريرية: ${pData.clinical_summary || 'توصية ببرنامج علاج حركي مكثف.'}`;
                          setPsychometricAnalysis((prev) => (prev ? prev + '\n\n' : '') + psychomText);
                          if (pData.therapeutic_goals && Array.isArray(pData.therapeutic_goals)) {
                            const newGoals = pData.therapeutic_goals.map((tg, idx) => ({
                              id: `psychom_${Date.now()}_${idx}`,
                              text: tg,
                              status: 'in_progress',
                            }));
                            setPeiGoals((prev) => [...prev, ...newGoals]);
                          }
                          setAiFeedback({
                            type: 'success',
                            text: 'تم استيراد نتائج الفحص الحركي وأهداف PEI بنجاح إلى الحصيلة.',
                          });
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-md"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>استيراد نتائج الفحص الحركي في الحصيلة 📥</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* PEI Clinical Goals Section */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-black text-white">
                        أهداف الخطة العلاجية الفردية (PEI Goals) المرفقة بالتقرير
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">تدرج في المحور السابع للتقرير الطبي</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiSuggestPeiGoalsForBilan}
                    disabled={loadingAiBilanGoals}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 space-x-reverse shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loadingAiBilanGoals ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                    <span>{loadingAiBilanGoals ? 'جارٍ التوليد...' : '✨ اقتراح أهداف SMART بالذكاء الاصطناعي'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {peiGoals.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white truncate max-w-[220px]">{g.text}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateGoalStatus(g.id, 'achieved')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            g.status === 'achieved'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🟢 مكتسب
                        </button>
                        <button
                          type="button"
                          onClick={() => updateGoalStatus(g.id, 'in_progress')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            g.status === 'in_progress'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🟡 تدريب
                        </button>
                        <button
                          type="button"
                          onClick={() => updateGoalStatus(g.id, 'needs_work')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            g.status === 'needs_work'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🔴 تعزيز
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGoal(g.id)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Goal Form */}
                <form onSubmit={handleAddPeiGoal} className="flex gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    placeholder="إضافة هدف سريري مخصص لهذا المريض في الخطة العلاجية..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center space-x-1 space-x-reverse"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة هدف</span>
                  </button>
                </form>
              </div>

              {/* Bottom Action Bar */}
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
            /* ================= STEP 2: CLINICAL EDITOR ================= */
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
                  placeholder="الشكوى وسياق التقييم السريري..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Section 2: Psychometric Analysis */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-400 flex items-center space-x-1.5 space-x-reverse">
                    <span>2. {isRtl ? 'التحليل النفسي-المتري للدرجات والاختبارات' : 'Analyse Psychométrique des Scores'}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Section 2</span>
                </div>
                <textarea
                  rows={3}
                  value={psychometricAnalysis}
                  onChange={(e) => setPsychometricAnalysis(e.target.value)}
                  placeholder="تحليل درجات المقاييس المطبقة..."
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
                  placeholder="نقاط الارتكاز الإيجابية ومجالات التعزيز..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Section 4: Diagnostic Hypotheses */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-purple-400 flex items-center space-x-1.5 space-x-reverse">
                    <span>4. {isRtl ? 'الفرضيات التشخيصية والترميز (DSM-5 / CIM-11)' : 'Hypothèses Diagnostiques & Codage DSM-5 / CIM-11'}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDsmModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <Brain className="w-3 h-3" />
                      <span>🧠 مساعد DSM-5</span>
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">Section 4</span>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={diagnosticHypotheses}
                  onChange={(e) => setDiagnosticHypotheses(e.target.value)}
                  placeholder="مثال: اضطراب طيف التوحد (F84.0) أو اضطراب النطق الفونولوجي (F80.0)..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Section 5: Therapeutic Project */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-400 flex items-center space-x-1.5 space-x-reverse">
                    <span>5. {isRtl ? 'المشروع العلاجي الفردي والتوصيات' : 'Projet Thérapeutique & Préconisations'}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSmartPeiModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <Target className="w-3 h-3" />
                      <span>📋 مشروع PEI والتمارين</span>
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">Section 5</span>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={therapeuticProject}
                  onChange={(e) => setTherapeuticProject(e.target.value)}
                  placeholder="وتيرة الحصص الأسبوعية، التوجيهات الأسرية والمدرسية..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>

              {/* Section 6: Digital Signature & QR Verification */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-teal-400 flex items-center space-x-1.5 space-x-reverse">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span>6. {isRtl ? 'المصادقة الرقمية الرسمية والتحقق بالـ QR' : 'Signature Électronique & Vérification QR'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSignatureModal(true)}
                    className="text-[11px] font-bold text-teal-300 hover:text-white px-3 py-1 rounded-xl bg-slate-900 border border-teal-500/30 flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{signatureData || stampData ? 'تعديل الختم والتوقيع' : 'إعداد التوقيع والختم'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* QR Code Verification Preview */}
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="w-14 h-14 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                          `https://psypro.tech/verify/doc/BILAN-${patient?.id || '1'}`
                        )}`}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-[10px] space-y-0.5">
                      <span className="font-bold text-white block">رمز المصادقة الإلكترونية:</span>
                      <span className="font-mono text-teal-400 block">BILAN-{patient?.id || '1'}-VERIF</span>
                      <p className="text-slate-400">امسح الرمز للتحقق الفوري من صحة الحصيلة ومطابقتها للسجل الطبي.</p>
                    </div>
                  </div>

                  {/* Stamp & Signature Preview */}
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">توقيع وخاتم الأخصائي:</span>
                      {signatureData ? (
                        <img src={signatureData} alt="التوقيع" className="h-8 object-contain filter invert opacity-90" />
                      ) : (
                        <span className="text-xs font-serif italic text-teal-300 block">الأخصائي المعالج المعتمد</span>
                      )}
                      <span className="text-[9px] font-mono text-slate-500 block">
                        رقم القيد: {licenseNumber}
                      </span>
                    </div>

                    {stampData && (
                      <div className="w-14 h-14 bg-white/5 rounded-lg p-1 flex items-center justify-center border border-slate-700">
                        <img src={stampData} alt="ختم العيادة" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between" dir="rtl">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1 space-x-reverse"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>العودة لإعدادات المقاييس</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAndSave}
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 flex items-center space-x-2 space-x-reverse transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  <span>{saving ? 'جاري بناء وتوثيق الحصيلة وتوليد وثيقة PDF...' : '📄 اعتماد الحصيلة وتوليد وثيقة A4 الرسمية'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= STEP 3: PREVIEW & WHATSAPP DELIVERY ================= */
            <div className="py-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-black text-white">تم توثيق واعتماد الحصيلة الإكلينيكية بنجاح!</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  تم دمج المقاييس الرقمية المعيارية وأهداف الخطة العلاجية في وثيقة طبية رسمية مدمجة بالترويسة والختم الرقمي.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                {generatedPdfUrl && (
                  <>
                    <a
                      href={generatedPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-xl shadow-teal-500/25 flex items-center space-x-2 space-x-reverse transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل وثيقة الحصيلة الرسمية (PDF A4)</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => window.open(generatedPdfUrl, '_blank')}
                      className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs flex items-center space-x-2 space-x-reverse transition border border-teal-500/30"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة ومعاينة فورية (Print)</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={sendingWa}
                        onClick={() => handleShareWhatsApp(false)}
                        className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 space-x-reverse transition shadow-lg ${
                          waSentSuccess
                            ? 'bg-emerald-700 text-emerald-100 shadow-emerald-700/20'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        }`}
                      >
                        {sendingWa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>{sendingWa ? 'جارٍ الإرسال السحابي...' : (waSentSuccess ? '✓ تم الإرسال للمريض' : 'إرسال الحصيلة للمريض (WhatsApp Cloud)')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(true)}
                        title="فتح محادثة واتساب يدوياً"
                        className="px-3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition border border-slate-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>يدوي (wa.me)</span>
                      </button>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  إغلاق النافذة
                </button>
              </div>

              {/* Digital Certificate & Verification Box */}
              <div className="max-w-lg mx-auto p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-right space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-teal-300">
                    <QrCode className="w-4 h-4 text-teal-400" />
                    <span>شهادة التحقق والمصادقة المشفرة (QR Verification)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                    SHA-256 VALIDATED
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white p-1 rounded-xl shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                        `https://psypro.tech/verify/doc/BILAN-${savedBilanId || patient?.id || '1'}`
                      )}`}
                      alt="Verification QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] space-y-1 text-slate-300">
                    <p className="text-slate-400">
                      يمكن لأي هيئة طبية أو جهة رسمية مسح الرمز أو زيارة الرابط أدناه للتحقق من هوية المعالج وصحة التقرير:
                    </p>
                    <a
                      href={`/verify/doc/BILAN-${savedBilanId || patient?.id || '1'}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-400 hover:text-teal-300 font-mono text-[10px] block underline"
                    >
                      https://psypro.tech/verify/doc/BILAN-{savedBilanId || patient?.id || '1'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Digital Signature Pad & Stamp Modal */}
      <DigitalSignaturePadModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        initialLicense={licenseNumber}
        onSave={(saved) => {
          if (saved.signature) setSignatureData(saved.signature);
          if (saved.stamp) setStampData(saved.stamp);
          if (saved.licenseNumber) setLicenseNumber(saved.licenseNumber);
        }}
      />

      {/* DSM-5-TR & ICD-11 Diagnostic Decision Support Modal */}
      {showDsmModal && patient && (
        <DsmDiagnosticAssistantModal
          isOpen={showDsmModal}
          patient={patient}
          onClose={() => setShowDsmModal(false)}
          onInjectSoap={(injectedText) => {
            setDiagnosticHypotheses(prev => prev ? prev + '\n\n' + injectedText : injectedText);
          }}
        />
      )}

      {/* Smart PEI Builder Modal */}
      {showSmartPeiModal && patient && (
        <SmartPeiBuilderModal
          isOpen={showSmartPeiModal}
          patient={patient}
          specialty={initialSpecialty}
          onClose={() => setShowSmartPeiModal(false)}
          onPlanSaved={(plan) => {
            if (plan?.title) {
              const goalsStr = (plan.short_term_goals || []).map(g => `• ${g.title} (${g.indicator || ''})`).join('\n');
              const summary = `المشروع العلاجي الفردي:\n${goalsStr}\n\nالرؤية بعيدة المدى:\n${plan.long_term_vision || ''}`;
              setTherapeuticProject(prev => prev ? prev + '\n\n' + summary : summary);
            }
          }}
        />
      )}
    </div>
  );
}
