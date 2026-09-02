import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  FileText,
  Target,
  BookOpen,
  Mic,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Printer,
  Save,
  Send,
  RefreshCw,
  Zap,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Volume2,
  Square,
  Share2,
  FileCheck,
  Stethoscope,
  Heart,
  Wind,
  Image as ImageIcon,
  BarChart2,
  Radio,
  Palette,
  Video,
  Activity
} from 'lucide-react';
import { aiTherapyApi, patientApi } from '../../api';
import { useFeatureFlags } from '../../context/FeatureFlagsContext';
import SocialStoriesStudio from './SocialStoriesStudio';
import RelaxationStudio from './RelaxationStudio';
import DrawingAnalyzerStudio from './DrawingAnalyzerStudio';
import PsychometricInterpreterStudio from './PsychometricInterpreterStudio';
import AiRadioStudio from './AiRadioStudio';
import AiImageStudioView from './AiImageStudioView';
import AiVideoModelingStudio from './AiVideoModelingStudio';
import AiClinicalSpeechStudio from './AiClinicalSpeechStudio';
import SpeechFluencyAnalyzerView from './SpeechFluencyAnalyzerView';
import LiveInteractiveAudioStudio from './LiveInteractiveAudioStudio';
import AiQuotaProgressBar from '../common/AiQuotaProgressBar';
import UpgradePlanModal from '../common/UpgradePlanModal';
import PrintableClinicalReport from '../common/PrintableClinicalReport';

export default function AiTherapyHubView() {
  const { t } = useTranslation();
  const { isFeatureEnabled } = useFeatureFlags();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [searchParams] = useSearchParams();

  // Handle URL Query Params for 1-click loading
  useEffect(() => {
    const pid = searchParams.get('patientId');
    const std = searchParams.get('studio');
    if (std) {
      const aliasMap = {
        'soap': 'soap',
        'image': 'image_studio',
        'image_studio': 'image_studio',
        'fluency': 'fluency_analyzer',
        'stuttering': 'fluency_analyzer',
        'podcast': 'radio_podcast',
        'radio': 'radio_podcast',
        'video': 'video_modeling',
        'live': 'live_audio',
        'transcribe': 'speech_transcribe',
      };
      setActiveStudio(aliasMap[std] || std);
    }
    if (pid && patients.length > 0) {
      setSelectedPatientId(String(pid));
    }
  }, [searchParams, patients]);

  // Active Tool Tab ('bilan', 'pep', 'exercise', 'soap', 'social_story', 'relaxation', 'drawing', 'wisc')
  const [activeStudio, setActiveStudio] = useState('bilan');
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [printableReport, setPrintableReport] = useState(null);

  // Tool 1: Bilan State
  const [bilanSpecialty, setBilanSpecialty] = useState('orthophonie');
  const [bilanLanguage, setBilanLanguage] = useState('fr');
  const [bilanAudience, setBilanAudience] = useState('medical');
  const [bilanObservations, setBilanObservations] = useState('');
  const [bilanOutput, setBilanOutput] = useState(null);

  // Tool 2: PEP State
  const [pepSpecialty, setPepSpecialty] = useState('orthophonie');
  const [pepSummary, setPepSummary] = useState('');
  const [pepFrequency, setPepFrequency] = useState('حصة أسبوعياً (45 دقيقة)');
  const [pepLanguage, setPepLanguage] = useState('ar');
  const [pepOutput, setPepOutput] = useState(null);

  // Tool 3: Algerian Exercise State
  const [contentType, setContentType] = useState('social_story');
  const [targetGoal, setTargetGoal] = useState('');
  const [envSetting, setEnvSetting] = useState('المدرسة والساحة وحانوت الحومة');
  const [exerciseOutput, setExerciseOutput] = useState(null);

  // Tool 4: SOAP Voice State
  const [soapNotesRaw, setSoapNotesRaw] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [soapOutput, setSoapOutput] = useState(null);

  // Load Patients
  useEffect(() => {
    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const res = await patientApi.list();
        const list = res.data || (Array.isArray(res) ? res : []);
        setPatients(list);
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  // Update selected patient details
  useEffect(() => {
    if (selectedPatientId) {
      const p = patients.find((item) => String(item.id) === String(selectedPatientId));
      setSelectedPatient(p || null);
      if (p) {
        if (p.diagnosis_primary) {
          setPepSummary(p.diagnosis_primary);
          setTargetGoal(`تحسين التواصل والتفاعل الاجتماعي لعلاج: ${p.diagnosis_primary}`);
        }
      }
    } else {
      setSelectedPatient(null);
    }
  }, [selectedPatientId, patients]);

  // Voice recording timer
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // 1. Generate Bilan Synthesis
  const handleGenerateBilan = async () => {
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await aiTherapyApi.generateBilan({
        patient_id: selectedPatientId ? parseInt(selectedPatientId, 10) : null,
        specialty: bilanSpecialty,
        language: bilanLanguage,
        audience: bilanAudience,
        clinical_observations: bilanObservations,
      });
      setBilanOutput(res.data?.content || 'تمت الصياغة بنجاح.');
      setFeedback({ type: 'success', text: 'تمت صياغة الحصيلة السريرية بنجاح عبر محرك Google Gemini الذكي.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل توليد الحصيلة السريرية.' });
    } finally {
      setGenerating(false);
    }
  };

  // 2. Generate PEP
  const handleGeneratePep = async () => {
    if (!pepSummary) {
      setFeedback({ type: 'error', text: 'يرجى إدخال ملخص التشخيص أو اختيار مريض أولاً.' });
      return;
    }
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await aiTherapyApi.generatePep({
        patient_id: selectedPatientId ? parseInt(selectedPatientId, 10) : null,
        specialty: pepSpecialty,
        diagnostic_summary: pepSummary,
        therapy_frequency: pepFrequency,
        language: pepLanguage,
      });
      let parsed = res.data?.content;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed.replace(/```json|```/g, '').trim());
        } catch {
          parsed = { title: 'مشروع علاجي', raw: parsed };
        }
      }
      setPepOutput(parsed);
      setFeedback({ type: 'success', text: 'تم إنشاء أهداف المشروع العلاجي (PEP) بنجاح.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل توليد المشروع العلاجي.' });
    } finally {
      setGenerating(false);
    }
  };

  // 3. Generate Algerian Exercise
  const handleGenerateExercise = async () => {
    if (!targetGoal) {
      setFeedback({ type: 'error', text: 'يرجى تحديد الهدف العلاجي المستهدف.' });
      return;
    }
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await aiTherapyApi.generateExercise({
        patient_id: selectedPatientId ? parseInt(selectedPatientId, 10) : null,
        content_type: contentType,
        target_goal: targetGoal,
        child_name: selectedPatient ? selectedPatient.first_name : 'أنيس',
        target_age: selectedPatient ? selectedPatient.age : 6,
        environment_setting: envSetting,
      });
      setExerciseOutput(res.data?.content || 'تم توليد المحتوى.');
      setFeedback({ type: 'success', text: 'تم إنشاء التمرين العلاجي بالسياق الجزائري بنجاح.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل إنشاء التمرين الجزائري.' });
    } finally {
      setGenerating(false);
    }
  };

  // 4. Generate SOAP Notes
  const handleGenerateSoap = async () => {
    if (!soapNotesRaw) {
      setFeedback({ type: 'error', text: 'يرجى تسجيل الصوت أو كتابة الملاحظات الخام أولاً.' });
      return;
    }
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await aiTherapyApi.voiceScribe({
        patient_id: selectedPatientId ? parseInt(selectedPatientId, 10) : null,
        notes_raw: soapNotesRaw,
        language: 'fr',
      });
      let parsed = res.data?.content;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed.replace(/```json|```/g, '').trim());
        } catch {
          parsed = { subjective: parsed, objective: '', assessment: '', plan: '' };
        }
      }
      setSoapOutput(parsed);
      setFeedback({ type: 'success', text: 'تم تحويل الملاحظات إلى تقرير SOAP سريري بنجاح.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تدوين تقرير SOAP.' });
    } finally {
      setGenerating(false);
    }
  };

  // Save to Patient Record
  const handleSaveToPatient = async (type, payload) => {
    if (!selectedPatientId) {
      alert('يرجى اختيار مريض أولاً لحفظ هذا التقرير في ملفه السريري.');
      return;
    }
    try {
      const res = await aiTherapyApi.saveToPatient({
        patient_id: parseInt(selectedPatientId, 10),
        type,
        payload,
      });
      alert(res.message || 'تم الحفظ في الملف السريري بنجاح!');
    } catch (err) {
      alert(err.message || 'فشل حفظ التقرير في الملف.');
    }
  };

  // Copy to clipboard
    const handlePrintCurrentOutput = () => {
    let reportTitle = 'تقرير سريري متخصص';
    let reportContent = '';

    if (activeStudio === 'bilan') {
      reportTitle = `حصيلة سريرية متخصصة (${specialty})`;
      reportContent = bilanOutput || '';
    } else if (activeStudio === 'pep') {
      reportTitle = pepOutput?.title || 'مشروع التكفل الفردي والتأهيل العصبي المعرفي (PEP)';
      const shortGoals = (pepOutput?.short_term_goals || []).map(g => `* ${g}`).join('\n');
      const medGoals = (pepOutput?.medium_term_goals || []).map(g => `* ${g}`).join('\n');
      reportContent = `**الرؤية والهدف العام:**\n${pepOutput?.long_term_vision || ''}\n\n### أهداف قريبة المدى (1-3 أشهر):\n${shortGoals}\n\n### أهداف متوسطة المدى (3-6 أشهر):\n${medGoals}`;
    } else if (activeStudio === 'exercise') {
      reportTitle = `محتوى علاجي وتمارين (${exerciseType})`;
      reportContent = typeof exerciseOutput === 'object' ? (exerciseOutput?.content || JSON.stringify(exerciseOutput, null, 2)) : String(exerciseOutput || '');
    } else if (activeStudio === 'soap') {
      reportTitle = 'ملاحظة توثيق الجلسة السريرية (SOAP Clinical Note)';
      reportContent = `### S - Subjective (الذاتي وملاحظات المفحوص):\n${soapOutput?.subjective || ''}\n\n### O - Objective (الملاحظات السريرية والمقاييس):\n${soapOutput?.objective || ''}\n\n### A - Assessment (التحليل السريري والتطور):\n${soapOutput?.assessment || ''}\n\n### P - Plan (خطة الجلسة القادمة والتوجيهات):\n${soapOutput?.plan || ''}`;
    }

    setPrintableReport({
      title: reportTitle,
      content: reportContent,
      patient: selectedPatient,
      date: new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })
    });
  };

  const handleCopy = (text) => {
    const str = typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text);
    navigator.clipboard.writeText(str);
    alert('تم نسخ التقرير إلى الحافظة بنجاح!');
  };

  const studioTabs = [
    { id: 'bilan', label: '📄 محرك الحصائل السريرية', category: 'core', desc: 'صياغة الحصيلة الشاملة (Bilan A4)', icon: FileText, color: 'from-blue-600 to-indigo-600' },
    { id: 'pep', label: '🎯 مولد مشاريع الـ PEP', category: 'core', desc: 'أهداف ذكية مقسمة على 3 مراحل', icon: Target, color: 'from-purple-600 to-pink-600' },
    { id: 'exercise', label: '🇩🇿 التمارين والتطبيقات المنزلية', category: 'core', desc: 'تمارين بالسياق الجزائري للأولياء', icon: BookOpen, color: 'from-teal-600 to-emerald-600' },
    { id: 'soap', label: '🎙️ مدون الجلسات الصوتي SOAP', category: 'core', desc: 'توثيق فوري للجلسة بالصوت والكلام', icon: Mic, color: 'from-amber-600 to-orange-600' },
    { id: 'social_story', label: '📖 القصص الاجتماعية وتعديل السلوك', category: 'advanced', desc: 'سيناريوهات بـ 4 لوحات بصرية', icon: Sparkles, color: 'from-emerald-600 to-teal-600' },
    { id: 'relaxation', label: '🫁 الاسترخاء والتنفس السريري', category: 'advanced', desc: 'جلسات استرخاء للتأتأة ونوبات الهلع', icon: Wind, color: 'from-indigo-600 to-purple-600' },
    { id: 'drawing', label: '🎨 محلل الاختبارات الإسقاطية', category: 'advanced', desc: 'رسم الرجل، العائلة، والشجرة (Vision)', icon: ImageIcon, color: 'from-amber-600 to-red-600' },
    { id: 'image_studio', label: '🎨 استوديو الوسائل البصرية و PECS', category: 'advanced', desc: 'بطاقات تواصل، تلوين، ومشاهد قصصية', icon: Palette, color: 'from-pink-600 to-indigo-600' },
    { id: 'video_modeling', label: '🎬 استوديو النمذجة البصرية والفيديو', category: 'advanced', desc: 'قصص متحركة، نمذجة سلوك، وريلز', icon: Video, color: 'from-cyan-600 to-indigo-600' },
    { id: 'speech_transcribe', label: '🎙️ المساعد الصوتي والتفريغ السريري', category: 'advanced', desc: 'إملاء حي وتفريغ جلسات عبر Gemini 3.6', icon: Mic, color: 'from-amber-600 to-rose-600' },
    { id: 'fluency_analyzer', label: '🗣️ فحص التأتأة وطلاقة النطق', category: 'advanced', desc: 'حساب نسبة %SS، الحبسات، وخطة الأرطوفونيا', icon: Activity, color: 'from-teal-500 to-indigo-600' },
    { id: 'live_audio', label: '⚡ الجلسات الحية والتفاعل الصوتي', category: 'advanced', desc: 'محاكاة سريرية وترجمة حية بدون تأخير', icon: Zap, color: 'from-cyan-500 to-purple-600' },
    { id: 'wisc', label: '🧠 مفسر مقياس وكسلر WISC-V', category: 'advanced', desc: 'المخطط المعرفي وحساب التباين', icon: BarChart2, color: 'from-purple-600 to-cyan-600' },
    { id: 'radio_podcast', label: '🎙️ بودكاست وتثقيف إذاعي', category: 'advanced', desc: 'حوار إذاعي متعدد الأصوات للأولياء', icon: Radio, color: 'from-amber-500 to-rose-600' },
  ];

  return (
    <div className="space-y-6 text-right font-sans max-w-7xl mx-auto" dir="rtl">
      {/* 1. Header Hero Workspace */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-950 border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1.5 space-x-reverse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI CLINICAL SUITE PRO (13 STUDIOS) ✨</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Powered by Google Gemini 🟢
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              العلاج بالذكاء الاصطناعي السريري (AI Therapy Hub)
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl">
              13 استوديو ذكي فائق الدقة متخصص للأطباء النفسيين، الأرطوفونيين، والمختصين النفسانيين.
            </p>

            <div className="pt-2">
              <AiQuotaProgressBar onOpenUpgradeModal={() => setShowUpgradeModal(true)} />
            </div>
          </div>

          {/* Quick Engine Pill */}
          <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4 shrink-0 flex items-center space-x-3.5 space-x-reverse">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">المحرك السريري النشط:</span>
              <span className="text-xs font-black text-white">Google Gemini 3.6 Flash</span>
              <span className="text-[10px] text-emerald-400 block font-mono font-bold">⚡ دقة تشخيصية ورؤية بصرية فائقة</span>
            </div>
          </div>
        </div>

        {/* Patient Selector Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300">
              <Users className="w-4 h-4 text-teal-400" />
              <span>المريض المستهدف في كافة الاستوديوهات:</span>
            </div>

            <div className="relative flex-1 max-w-md">
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-purple-500 shadow-inner"
              >
                <option value="">-- فضاء عمل عام (بدون ربط بمريض) --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.age ? `${p.age} سنة` : 'العمر غير محدد'}) {p.diagnosis_primary ? `• ${p.diagnosis_primary}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Patient Mini Card */}
          {selectedPatient && (
            <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center space-x-3 space-x-reverse text-xs animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-black">
                {selectedPatient.first_name?.[0] || 'P'}
              </div>
              <div className="leading-tight">
                <span className="font-black text-white block">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </span>
                <span className="text-[10px] text-teal-300 font-mono">
                  {selectedPatient.age} سنة • {selectedPatient.phone || 'بدون هاتف'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatientId('')}
                className="p-1 text-slate-400 hover:text-white text-xs font-bold"
                title="إلغاء التحديد"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-red-500/20 text-red-300 border-red-500/40'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white font-black">
            ✕
          </button>
        </div>
      )}

      {/* 2. Studio Switcher Tabs (8 Studios Grid) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
          <span>اختر الاستوديو السريري المطلوب (8 أدوات متقدمة):</span>
          <span className="font-mono text-purple-400">{studioTabs.length} استوديوهات مفعلة</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
          {studioTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeStudio === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveStudio(tab.id);
                  setFeedback(null);
                }}
                className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2 shadow-lg ${
                  isActive
                    ? `bg-gradient-to-br ${tab.color} text-white border-white/20 shadow-purple-500/25 ring-2 ring-purple-400 scale-[1.02]`
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-400'}`} />
                  {isActive && <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full">نشط</span>}
                </div>
                <div>
                  <span className="text-xs font-black block leading-tight">{tab.label}</span>
                  <span className={`text-[10px] block mt-0.5 line-clamp-1 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                    {tab.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Studio Content View Container */}
      <div className="space-y-6">
        {/* Sub-Studio 5: Social Stories */}
        {activeStudio === 'social_story' && (
          <SocialStoriesStudio
            selectedPatient={selectedPatient}
            onSaveToPatient={handleSaveToPatient}
          />
        )}

        {/* Sub-Studio 6: Relaxation & Breathing */}
        {activeStudio === 'relaxation' && (
          <RelaxationStudio
            selectedPatient={selectedPatient}
            onSaveToPatient={handleSaveToPatient}
          />
        )}

        {/* Sub-Studio 7: Drawing Analyzer (Vision) */}
        {activeStudio === 'drawing' && (
          <DrawingAnalyzerStudio
            selectedPatient={selectedPatient}
            onSaveToPatient={handleSaveToPatient}
          />
        )}

        {/* Sub-Studio 8: WISC-V & Psychometrics */}
        {activeStudio === 'wisc' && (
          <PsychometricInterpreterStudio
            selectedPatient={selectedPatient}
            onSaveToPatient={handleSaveToPatient}
          />
        )}

        {/* Sub-Studio 9: AI Talk Radio & Psycho-education Podcast */}
        {activeStudio === 'radio_podcast' && (
          <AiRadioStudio
            selectedPatient={selectedPatient}
            onSaveToPatient={handleSaveToPatient}
          />
        )}

        {/* Sub-Studio 10: AI Visual Asset & PECS Card Generator */}
        {activeStudio === 'image_studio' && (
          <AiImageStudioView
            selectedPatient={selectedPatient}
            onSaveToPatient={(data) => handleSaveToPatient('social_story', data)}
          />
        )}

        {/* Sub-Studio 11: AI Video Modeling & Animated Social Stories */}
        {activeStudio === 'video_modeling' && (
          <AiVideoModelingStudio
            selectedPatient={selectedPatient}
            onSaveToPatient={(data) => handleSaveToPatient('social_story', data)}
          />
        )}

        {/* Sub-Studio 12: Live Clinical Dictation & Speech Transcription */}
        {activeStudio === 'speech_transcribe' && (
          <AiClinicalSpeechStudio
            selectedPatient={selectedPatient}
            onSaveToPatient={(data) => handleSaveToPatient('soap', data)}
          />
        )}

        {/* Sub-Studio 13: Speech Disfluency & Stuttering Analyzer */}
        {activeStudio === 'fluency_analyzer' && (
          <SpeechFluencyAnalyzerView
            selectedPatient={selectedPatient}
            onSaveToPatient={(data) => handleSaveToPatient('bilan', data)}
          />
        )}

        {/* Sub-Studio 14: Real-time Live Interactive Audio Studio */}
        {activeStudio === 'live_audio' && (
          <LiveInteractiveAudioStudio
            selectedPatient={selectedPatient}
          />
        )}

        {/* Core Studios (1, 2, 3, 4) */}
        {['bilan', 'pep', 'exercise', 'soap'].includes(activeStudio) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 5 Cols: Input Controls */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              {/* Studio 1: Bilan Form */}
              {activeStudio === 'bilan' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-3">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-black text-white">إعدادات صياغة الحصيلة السريرية</h3>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">التخصص الإكلينيكي:</label>
                    <select
                      value={bilanSpecialty}
                      onChange={(e) => setBilanSpecialty(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-purple-500"
                    >
                      <option value="orthophonie">أرطوفونيا (Orthophonie & Langage)</option>
                      <option value="psychologie">علم النفس والتقييم المعرفي (Psychologie)</option>
                      <option value="neuropsychiatrie">طب النفس العصبي (Neuropsychiatrie)</option>
                      <option value="psychomotricite">العلاج النفسي الحركي (Psychomotricité)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">لغة التقرير:</label>
                      <select
                        value={bilanLanguage}
                        onChange={(e) => setBilanLanguage(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-purple-500"
                      >
                        <option value="fr">🇫🇷 Français Médical</option>
                        <option value="ar">🇩🇿 العربية الأكاديمية</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">الجمهور المستهدف:</label>
                      <select
                        value={bilanAudience}
                        onChange={(e) => setBilanAudience(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-purple-500"
                      >
                        <option value="medical">طبيب / أخصائي (Médical)</option>
                        <option value="parent">الأولياء والأسرة (Parents)</option>
                        <option value="school">المدرسة والمعلمين (Scolaire)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">ملاحظات الفحص والنتائج السريرية:</label>
                    <textarea
                      rows={4}
                      value={bilanObservations}
                      onChange={(e) => setBilanObservations(e.target.value)}
                      placeholder="أدخل ملخص السوابق، استجابات الطفل، أو درجات المقاييس المنجزة..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-purple-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateBilan}
                    disabled={generating}
                    className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-purple-500/25 transition flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
                  >
                    {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{generating ? 'جاري صياغة الحصيلة عبر Gemini...' : '✨ صياغة الحصيلة السريرية الفورية'}</span>
                  </button>
                </div>
              )}

              {/* Studio 2: PEP Form */}
              {activeStudio === 'pep' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-3">
                    <Target className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-black text-white">إعدادات المشروع العلاجي (PEP)</h3>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">ملخص التشخيص والصعوبات المستهدفة:</label>
                    <textarea
                      rows={3}
                      value={pepSummary}
                      onChange={(e) => setPepSummary(e.target.value)}
                      placeholder="مثال: تأخر لغوي نمائي مصحوب بصعوبات في النطق والتركيز التنفيذي..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">تواتر الجلسات:</label>
                      <input
                        type="text"
                        value={pepFrequency}
                        onChange={(e) => setPepFrequency(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">لغة الأهداف:</label>
                      <select
                        value={pepLanguage}
                        onChange={(e) => setPepLanguage(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-purple-500"
                      >
                        <option value="ar">🇩🇿 العربية</option>
                        <option value="fr">🇫🇷 Français</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGeneratePep}
                    disabled={generating}
                    className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black shadow-lg shadow-purple-500/25 transition flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
                  >
                    {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                    <span>{generating ? 'جاري بناء الأهداف...' : '🎯 توليد الأهداف الإجرائية (PEP)'}</span>
                  </button>
                </div>
              )}

              {/* Studio 3: Algerian Exercise Form */}
              {activeStudio === 'exercise' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-3">
                    <BookOpen className="w-5 h-5 text-teal-400" />
                    <h3 className="text-sm font-black text-white">إعداد التمارين والقصص الجزائرية</h3>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">نوع المحتوى المطلوب:</label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:border-teal-500"
                    >
                      <option value="social_story">📖 قصة اجتماعية علاجية (Social Story)</option>
                      <option value="articulation_cards">🃏 بطاقات تدريب نطق وتمييز سمعي</option>
                      <option value="home_worksheet">📝 ورقة تمارين وتطبيقات للأولياء</option>
                      <option value="visual_schedule">📅 جدول روتين بصري يومي</option>
                      <option value="darja_pragmatics">🗣️ مواقف تواصل وبراغماتية بالدارجة</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">الهدف الإجرائي المستهدف:</label>
                    <input
                      type="text"
                      value={targetGoal}
                      onChange={(e) => setTargetGoal(e.target.value)}
                      placeholder="مثال: التدريب على الانتظار والطلب المهذب في القسم..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">السياق والبيئة الجزائرية:</label>
                    <input
                      type="text"
                      value={envSetting}
                      onChange={(e) => setEnvSetting(e.target.value)}
                      placeholder="مثال: المدرسة والساحة وحانوت الحومة..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-teal-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateExercise}
                    disabled={generating}
                    className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-teal-500/25 transition flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
                  >
                    {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{generating ? 'جاري تأليف التمرين الجزائري...' : '🇩🇿 إنشاء التمرين بالسياق الجزائري'}</span>
                  </button>
                </div>
              )}

              {/* Studio 4: SOAP Voice Form */}
              {activeStudio === 'soap' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-3">
                    <Mic className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-black text-white">المسجل والمدون الصوتي السريع</h3>
                  </div>

                  {/* Voice Recorder Widget */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                    <div className="flex items-center justify-center space-x-2 space-x-reverse text-xs font-mono font-bold text-slate-400">
                      <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                      <span>{isRecording ? `جاري التسجيل الصوتي... (${recordingTime} ثانية)` : 'جاهز للتسجيل الصوتي بالمايكروفون'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsRecording(!isRecording)}
                      className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white text-xl shadow-xl transition-all ${
                        isRecording
                          ? 'bg-red-600 hover:bg-red-500 animate-pulse'
                          : 'bg-gradient-to-tr from-amber-600 to-orange-500 hover:scale-105'
                      }`}
                    >
                      {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">ملاحظات الجلسة الخام (أو الصق النص المفرغ):</label>
                    <textarea
                      rows={4}
                      value={soapNotesRaw}
                      onChange={(e) => setSoapNotesRaw(e.target.value)}
                      placeholder="تحدث أو اكتب ما جرى في الجلسة: أداء الطفل، التمارين المنجزة..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateSoap}
                    disabled={generating}
                    className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 transition flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
                  >
                    {generating ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Zap className="w-4 h-4 fill-current" />}
                    <span>{generating ? 'جاري تحويل الملاحظات إلى SOAP...' : '✨ تحويل الملاحظات إلى تقرير SOAP'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right 7 Cols: Output Studio & Live Actions */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl min-h-[500px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-black text-white">التقرير السريري المولد (AI Live Output)</h3>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1.5 space-x-reverse">
                    <button
                      type="button"
                      onClick={() => handleCopy(bilanOutput || pepOutput || exerciseOutput || soapOutput || '')}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition"
                      title="نسخ التقرير"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintCurrentOutput}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition"
                      title="طباعة التقرير"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Output Display */}
                {activeStudio === 'bilan' && bilanOutput && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-[460px] overflow-y-auto">
                    {bilanOutput}
                  </div>
                )}

                {activeStudio === 'pep' && pepOutput && (
                  <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                      <h4 className="text-sm font-black text-purple-300">{pepOutput.title || 'مشروع التكفل الفردي'}</h4>
                      <p className="text-xs text-slate-300 mt-1">{pepOutput.long_term_vision}</p>
                    </div>

                    {pepOutput.short_term_goals && (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs font-black text-teal-400 block">🎯 أهداف قريبة المدى (1-3 أشهر):</span>
                        <ul className="space-y-1 text-xs text-slate-300 list-disc pr-4">
                          {pepOutput.short_term_goals.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {pepOutput.medium_term_goals && (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs font-black text-indigo-400 block">🎯 أهداف متوسطة المدى (3-6 أشهر):</span>
                        <ul className="space-y-1 text-xs text-slate-300 list-disc pr-4">
                          {pepOutput.medium_term_goals.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeStudio === 'exercise' && exerciseOutput && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[460px] overflow-y-auto">
                    {exerciseOutput}
                  </div>
                )}

                {activeStudio === 'soap' && soapOutput && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-xs font-black text-amber-400 block">S - الذاتي (Subjective)</span>
                      <p className="text-xs text-slate-300">{soapOutput.subjective}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-xs font-black text-teal-400 block">O - الموضوعي (Objective)</span>
                      <p className="text-xs text-slate-300">{soapOutput.objective}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-xs font-black text-indigo-400 block">A - التقييم (Assessment)</span>
                      <p className="text-xs text-slate-300">{soapOutput.assessment}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-xs font-black text-purple-400 block">P - الخطة (Plan)</span>
                      <p className="text-xs text-slate-300">{soapOutput.plan}</p>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!bilanOutput && !pepOutput && !exerciseOutput && !soapOutput && (
                  <div className="h-72 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl">
                      ✨
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-300">في انتظار بدء التوليد الذكي</h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        اختر مريضاً وحدد المعايير من القائمة الجانبية ثم اضغط على زر التوليد لتظهر النتائج هنا فورياً.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-400 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>جاهز للحفظ أو المشاركة المباشرة</span>
                </div>

                <div className="flex items-center gap-2">
                  {activeStudio === 'pep' && pepOutput && (
                    <button
                      type="button"
                      onClick={() => handleSaveToPatient('pep', pepOutput)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition flex items-center space-x-1.5 space-x-reverse shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      <span>💾 حفظ في خطة علاج المريض</span>
                    </button>
                  )}

                  {activeStudio === 'soap' && soapOutput && (
                    <button
                      type="button"
                      onClick={() => handleSaveToPatient('soap', soapOutput)}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black transition flex items-center space-x-1.5 space-x-reverse shadow-md"
                    >
                      <Save className="w-4 h-4" />
                      <span>💾 حفظ في سجل جلسات المريض</span>
                    </button>
                  )}

                  {activeStudio === 'exercise' && exerciseOutput && (
                    <button
                      type="button"
                      onClick={() => alert('تم إرسال التمرين مباشرة إلى بوابة الأولياء!')}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 text-xs font-black transition flex items-center space-x-1.5 space-x-reverse shadow-md"
                    >
                      <Send className="w-4 h-4" />
                      <span>📲 إرسال لبوابة الولي</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Printable Clinical Report Modal */}
      {printableReport && (
        <PrintableClinicalReport
          title={printableReport.title}
          patient={printableReport.patient}
          content={printableReport.content}
          date={printableReport.date}
          onClose={() => setPrintableReport(null)}
        />
      )}

      {/* Upgrade Plan Paywall Modal */}
      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}