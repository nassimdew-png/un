import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
 
  Users, 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Calendar, 
  Phone, 
  FileText, 
  ClipboardList, 
  Paperclip, 
  Activity, 
  Mic, 
  Volume2, 
  Send,
  Baby,
  GraduationCap,
  Stethoscope,
  Sparkles,
  Layers,
  ArrowRightLeft,
  AlertTriangle,
  HeartPulse,
  Tv,
  Languages,
  CheckCircle2,
  Ear,
  Brain,
  GitBranch,
  MapPin,
  Building,
  Printer,
  BookOpen,
  Trophy,
  Star,
  Zap,
  Target,
  Smartphone,
  FileSpreadsheet

} from 'lucide-react';
import { patientApi, assessmentApi, sessionApi, attachmentApi, appointmentApi, clinicalTestApi, patientBilanApi, therapyHubApi } from '../api';
import PatientVoiceArchive from './PatientVoiceArchive';
import ClinicalAudioRecorder from './ClinicalAudioRecorder';
import AssessmentProgressionView from './AssessmentProgressionView';
import MedicalLettersBuilder from './MedicalLettersBuilder';
import ClinicalFlashcardsBank from './ClinicalFlashcardsBank';
import BehaviorProgressionView from './BehaviorProgressionView';
import ActiveConsultationWorkspace from './ActiveConsultationWorkspace';
import SendRemoteAssessmentModal from './SendRemoteAssessmentModal';
import ClinicalGoalsManager from './ClinicalGoalsManager';
import TreatmentPlanView from './patients/TreatmentPlanView';
import PatientAiRecordsTab from './patients/PatientAiRecordsTab';
import VoiceScribeRecorderModal from './sessions/VoiceScribeRecorderModal';
import AnamnesisCopilotWidget from './patients/AnamnesisCopilotWidget';
import TherapyAppFinder from './therapy/TherapyAppFinder';
import MasterBilanBuilderModal from './assessments/MasterBilanBuilderModal';
import HomeworkPlanCard from './therapy-hub/HomeworkPlanCard';
import PatientHomeworkBuilderModal from './therapy-hub/PatientHomeworkBuilderModal';
import GeneratePortalLinkModal from './portal/GeneratePortalLinkModal';
import DataExportModal from './common/DataExportModal';

export default function Patients({ patients = [], loading = false, onRefresh = null, onOpenAddPatient = null, onOpenAddAssessment = null, onOpenAddSession = null, tenant = null, user = null }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientTab, setPatientTab] = useState('anamnesis'); // 'anamnesis', 'behavior', 'flashcards', 'documents', 'voice_archive', 'audio_dictation', 'progression', 'assessments', 'sessions', 'attachments'
  
  const [patientAssessments, setPatientAssessments] = useState([]);
  const [patientSessions, setPatientSessions] = useState([]);
  const [patientAttachments, setPatientAttachments] = useState([]);
  const [pastBilans, setPastBilans] = useState([]);
  const [patientHomeworkPlans, setPatientHomeworkPlans] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeConsultationId, setActiveConsultationId] = useState(null);
  const [startingDirectSession, setStartingDirectSession] = useState(false);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [showMasterBilanModal, setShowMasterBilanModal] = useState(false);
  const [showHomeworkBuilderModal, setShowHomeworkBuilderModal] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showVoiceSoapModal, setShowVoiceSoapModal] = useState(false);

  const isSecretary = user?.role === 'secretary' || user?.role === 'receptionist';

  const filteredPatients = (Array.isArray(patients) ? patients : []).filter((p) => {
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const phone = (p.phone || '').toLowerCase();
    const commune = (p.commune_name || '').toLowerCase();
    const matchSearch = fullName.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm.toLowerCase()) || commune.includes(searchTerm.toLowerCase());
    const matchGender = !genderFilter || p.gender === genderFilter;
    return matchSearch && matchGender;
  });

  const loadPatientDetails = async (patient) => {
    setSelectedPatient(patient);
    setLoadingDetails(true);
    try {
      const [historyRes, assessRes, sessRes, attachRes, bilansRes, plansRes] = await Promise.allSettled([
        clinicalTestApi.getAssessmentsHistory(patient.id),
        assessmentApi.list(patient.id),
        sessionApi.list(patient.id),
        attachmentApi.list(patient.id),
        patientBilanApi.listBilans(patient.id),
        therapyHubApi.getPatientPlans(patient.id),
      ]);

      if (historyRes.status === 'fulfilled' && historyRes.value?.history) {
        setPatientAssessments(historyRes.value.history);
      } else if (assessRes.status === 'fulfilled') {
        setPatientAssessments(assessRes.value.data || []);
      }

      if (sessRes.status === 'fulfilled') setPatientSessions(sessRes.value.data || []);
      if (attachRes.status === 'fulfilled') setPatientAttachments(attachRes.value.data || []);
      if (bilansRes.status === 'fulfilled') setPastBilans(bilansRes.value?.bilans || []);
      if (plansRes.status === 'fulfilled') setPatientHomeworkPlans(plansRes.value?.plans || []);
    } catch (err) {
      console.error('Error loading patient details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce dossier patient ?')) return;
    setDeletingId(id);
    try {
      await patientApi.delete(id);
      if (onRefresh) onRefresh();
      if (selectedPatient?.id === id) setSelectedPatient(null);
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression du dossier.');
    } finally {
      setDeletingId(null);
    }
  };

  const openWhatsAppChat = (patient, e) => {
    e.stopPropagation();
    if (!patient?.phone) return;
    let phoneNum = patient.phone.replace(/[^0-9]/g, '');
    if (phoneNum.startsWith('0')) phoneNum = '213' + phoneNum.substring(1);
    const msg = encodeURIComponent(`Bonjour ${patient.first_name}, nous vous contactons depuis le ${tenant?.name || 'Cabinet Médical'}.`);
    window.open(`https://wa.me/${phoneNum}?text=${msg}`, '_blank');
  };

  const anamnesis = selectedPatient?.anamnesis_data || {};
  const perinatal = anamnesis.perinatal || {};
  const milestones = anamnesis.milestones || {};
  const familyLinguistic = anamnesis.family_linguistic || {};
  const schooling = anamnesis.schooling || {};
  const medicalHistory = anamnesis.medical_history || {};
  const referral = anamnesis.referral || {};
  const genogram = selectedPatient?.family_genogram || {};
  const sensory = selectedPatient?.sensory_profile || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2.5 space-x-reverse">
            <Users className="w-6 h-6 text-brand-400" />
            <span>ملفات وسجلات المرضى (Dossiers Patients)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {tenant?.name || 'العيادة'} &bull; إدارة متكاملة للسوابق النمائية، التقييمات، والأرشيف الصوتي
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center space-x-1.5 space-x-reverse px-3.5 py-2.5 rounded-2xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 font-bold text-xs shadow-md transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel (.xlsx)</span>
          </button>

          <button
            onClick={onOpenAddPatient}
            className="inline-flex items-center space-x-2 space-x-reverse px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ فتح ملف مريض جديد (Anamnèse DZ)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-3.5 border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، اللقب، الهاتف، أو البلدية..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
        >
          <option value="">كافة الأجناس</option>
          <option value="male">ذكر (Garçon / Homme)</option>
          <option value="female">أنثى (Fille / Femme)</option>
        </select>
      </div>

      {/* Patients Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">المريض (Nom & Prénom)</th>
                <th className="px-5 py-3.5">الميلاد / الجنس</th>
                <th className="px-5 py-3.5">الهاتف والشبكة</th>
                <th className="px-5 py-3.5">الولاية / البلدية</th>
                <th className="px-5 py-3.5">اكتمال السوابق</th>
                <th className="px-5 py-3.5 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                    {loading ? 'جارٍ تحميل السجلات...' : 'لا يوجد مرضى مسجلون مطابقون لخيارات البحث.'}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white">
                      <div className="flex items-center space-x-2.5 space-x-reverse">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-xs font-black">
                          {p.first_name?.[0] || 'P'}{p.last_name?.[0] || ''}
                        </div>
                        <div>
                          <div className="text-white font-bold">{p.first_name} {p.last_name}</div>
                          <span className="text-[10px] text-slate-500 font-mono">ملف #{p.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div>{p.birth_date?.split('T')[0] || p.birth_date || '--'}</div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5 ${
                        p.gender === 'male' ? 'bg-blue-500/15 text-blue-300' : 'bg-pink-500/15 text-pink-300'
                      }`}>
                        {p.gender === 'male' ? 'ذكر' : 'أنثى'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-mono text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          {p.operator_badge || '🇩🇿'}
                        </span>
                        <span>{p.phone || '--'}</span>
                        {p.phone && (
                          <button
                            type="button"
                            onClick={(e) => openWhatsAppChat(p, e)}
                            title="مراسلة عبر واتساب"
                            className="p-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 transition-all"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="text-slate-200 font-semibold flex items-center space-x-1 space-x-reverse">
                        <MapPin className="w-3 h-3 text-brand-400" />
                        <span>{p.commune_name ? `${p.commune_name} (${p.wilaya_code})` : (p.address || '--')}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="w-14 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full"
                            style={{ width: `${p.completion_rate || 50}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {p.completion_rate || 50}%
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center space-x-1.5 space-x-reverse">
                        <button
                          type="button"
                          onClick={() => loadPatientDetails(p)}
                          className="px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 text-xs font-bold flex items-center space-x-1 space-x-reverse transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>فتح الملف</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-500 border border-slate-700 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Comprehensive Patient Profile Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg">
                  {selectedPatient.first_name?.[0]}{selectedPatient.last_name?.[0]}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center space-x-2 space-x-reverse">
                    <span>{selectedPatient.first_name} {selectedPatient.last_name}</span>
                    <span className="text-xs text-brand-400 font-mono">#{selectedPatient.id}</span>
                    {selectedPatient.operator_badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                        {selectedPatient.operator_badge}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    الميلاد: {selectedPatient.birth_date?.split('T')[0] || selectedPatient.birth_date} &bull; {selectedPatient.phone || 'بدون هاتف'} &bull; {selectedPatient.commune_name ? `${selectedPatient.commune_name} (ولاية ${selectedPatient.wilaya_code})` : (selectedPatient.address || 'العنوان غير محدد')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowPortalModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600 hover:to-teal-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>📱 استمارة الولي / WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (startingDirectSession) return;
                    setStartingDirectSession(true);
                    try {
                      const today = new Date().toISOString().split('T')[0];
                      const res = await appointmentApi.create({
                        patient_id: selectedPatient.id,
                        appointment_date: today,
                        start_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                        type: 'consultation',
                        status: 'in_progress',
                        notes: 'جلسة علاجية فورية من ملف المريض',
                      });
                      if (res.data?.id) {
                        setActiveConsultationId(res.data.id);
                      }
                    } catch (err) {
                      console.error('Error starting direct session:', err);
                      alert(err.message || 'تعذر بدء الجلسة المباشرة');
                    } finally {
                      setStartingDirectSession(false);
                    }
                  }}
                  disabled={startingDirectSession}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center space-x-1.5 space-x-reverse transition-all disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{startingDirectSession ? 'جارٍ البدء...' : '⚡ بدء جلسة لهذا المريض الآن'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-tabs Navigation */}
            <div className="flex items-center space-x-1 space-x-reverse p-2 bg-slate-950 border-b border-slate-800 text-xs font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setPatientTab('anamnesis')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  patientTab === 'anamnesis'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                📋 السوابق والشجرة والملف الحسي
              </button>

              <button
                type="button"
                onClick={() => setPatientTab('ai_records')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 space-x-reverse ${
                  patientTab === 'ai_records'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 font-black'
                    : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>🤖 مخرجات وسجلات الـ AI</span>
              </button>
              <button
                type="button"
                onClick={() => setPatientTab('goals')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 space-x-reverse ${
                  patientTab === 'goals'
                    ? 'bg-emerald-600 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>🎯 خطة التكفل والأهداف (PEI)</span>
              </button>

              <button
                type="button"
                onClick={() => setPatientTab('therapy')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 space-x-reverse ${
                  patientTab === 'therapy'
                    ? 'bg-gradient-to-r from-teal-500 to-brand-600 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>🧠 التمارين والتأهيل الرقمي (Therapy)</span>
              </button>

              <button
                type="button"
                onClick={() => setPatientTab('behavior')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  patientTab === 'behavior'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                ⭐ السلوك والتعزيز (Comportement)
              </button>

              <button
                type="button"
                onClick={() => setPatientTab('flashcards')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  patientTab === 'flashcards'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                🎴 التمارين والواجبات المنزلية
              </button>

              <button
                type="button"
                onClick={() => setPatientTab('documents')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  patientTab === 'documents'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                📜 الشهادات والوثائق الطبية
              </button>

              <button
                type="button"
                onClick={() => setPatientTab('voice_archive')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  patientTab === 'voice_archive'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                🎙️ الأرشيف الصوتي & المقارنة
              </button>

              <button
                type="button"
                onClick={() => setPatientTab('audio_dictation')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  patientTab === 'audio_dictation'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                🗣️ الإملاء والتفريغ النصي
              </button>

              <button
                type="button"
                onClick={() => setPatientTab('progression')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  patientTab === 'progression'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                📈 منحنى التطور السريري
              </button>

              <button
                type="button"
                onClick={() => setPatientTab('assessments')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  patientTab === 'assessments'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                🧠 المقاييس ({patientAssessments.length})
              </button>

              <button
                type="button"
                onClick={() => setPatientTab('sessions')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  patientTab === 'sessions'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                🩺 الجلسات ({patientSessions.length})
              </button>

              <button
                type="button"
                onClick={() => setPatientTab('homework')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  patientTab === 'homework'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                🧩 الواجبات والتمارين ({patientHomeworkPlans.length})
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Role Restricted Banner for Administrative / Secretary accounts */}
              {isSecretary && ['anamnesis', 'goals', 'therapy', 'behavior', 'assessments', 'sessions'].includes(patientTab) ? (
                <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3 animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-white">ملف سريري وسجلات طبية محمية (Accès Restreint)</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    هذا القسم يحتوي على بيانات تشخيصية وتقييمات سريرية خاصة، ومخصص للاطلاع والتعديل من قبل الأخصائيين والأطباء المشرفين فقط وفقاً لسياسات حماية البيانات الطبية.
                  </p>
                </div>
              ) : (
                <>
              {/* TAB 1: Structured Anamnesis with Genogram & Sensory */}
              {patientTab === 'anamnesis' && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Summary & Completion Card */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">اكتمال السوابق والتاريخ السريري للمريض</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        تم توثيق البيانات النمائية، الشجرة العائلية، والملف الحسي
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      {selectedPatient.completion_rate || 80}% مكتمل
                    </span>
                  </div>

                  {/* Grid Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Perinatal & Milestones */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                      <h5 className="text-xs font-extrabold text-amber-300 flex items-center space-x-1.5 space-x-reverse pb-1.5 border-b border-slate-800/80">
                        <Baby className="w-4 h-4" />
                        <span>السوابق الولادية والنمو الحركي</span>
                      </h5>
                      <div className="text-xs space-y-1.5 text-slate-300">
                        <div><span className="text-slate-500">مدة الحمل:</span> {perinatal.pregnancy_terms === 'preterm' ? 'ولادة مبكرة (<37s)' : 'حمل كامل'}</div>
                        <div><span className="text-slate-500">نوع الولادة:</span> {perinatal.delivery_type === 'c_section' ? 'قيصرية (Césarienne)' : 'طبيعية (Voie basse)'}</div>
                        <div><span className="text-slate-500">الوزن عند الولادة:</span> {perinatal.birth_weight ? `${perinatal.birth_weight} kg` : '--'}</div>
                        <div><span className="text-slate-500">سن المشي المستقل:</span> {milestones.walking_age_months ? `${milestones.walking_age_months} شهر` : '--'}</div>
                        <div><span className="text-slate-500">ظهور الكلمات الأولى:</span> {milestones.first_words_age_months ? `${milestones.first_words_age_months} شهر` : '--'}</div>
                        {perinatal.complications && (
                          <div className="text-amber-300/90 text-[11px] pt-1 bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
                            ⚠️ مضاعفات: {perinatal.complications}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Family Genogram & Consanguinity */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                      <h5 className="text-xs font-extrabold text-purple-300 flex items-center space-x-1.5 space-x-reverse pb-1.5 border-b border-slate-800/80">
                        <GitBranch className="w-4 h-4" />
                        <span>الشجرة العائلية والقرابة الوراثية</span>
                      </h5>
                      <div className="text-xs space-y-1.5 text-slate-300">
                        <div>
                          <span className="text-slate-500">القرابة الوالدية:</span>{' '}
                          {genogram.consanguinity ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                              نعم - {genogram.consanguinity_degree === 'first_cousins' ? 'أبناء عم/خال مباشرين' : 'قرابة عائلية'}
                            </span>
                          ) : 'لا توجد قرابة'}
                        </div>
                        <div>
                          <span className="text-slate-500">سوابق الأب:</span>{' '}
                          {genogram.father_conditions?.length > 0 ? genogram.father_conditions.join(', ') : 'سليم'}
                        </div>
                        <div>
                          <span className="text-slate-500">سوابق الأم:</span>{' '}
                          {genogram.mother_conditions?.length > 0 ? genogram.mother_conditions.join(', ') : 'سليمة'}
                        </div>
                        <div>
                          <span className="text-slate-500">الإخوة:</span> {genogram.siblings?.length || 0} إخوة
                        </div>
                      </div>
                    </div>

                    {/* 3. Sensory Profile */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                      <h5 className="text-xs font-extrabold text-cyan-300 flex items-center space-x-1.5 space-x-reverse pb-1.5 border-b border-slate-800/80">
                        <Activity className="w-4 h-4" />
                        <span>الملف الحسي والسلوكي (Profil Sensoriel)</span>
                      </h5>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <div><span className="text-slate-500">السمعي:</span> <span className="font-bold">{sensory.auditory || 'طبيعي'}</span></div>
                        <div><span className="text-slate-500">البصري:</span> <span className="font-bold">{sensory.visual || 'طبيعي'}</span></div>
                        <div><span className="text-slate-500">اللمسي:</span> <span className="font-bold">{sensory.tactile || 'طبيعي'}</span></div>
                        <div><span className="text-slate-500">الدهليزي:</span> <span className="font-bold">{sensory.vestibular || 'طبيعي'}</span></div>
                      </div>
                      {sensory.stereotypies?.length > 0 && (
                        <div className="text-cyan-300 text-[10px] pt-1 bg-cyan-500/5 p-2 rounded-lg border border-cyan-500/20">
                          🌀 حركات نمطية: {sensory.stereotypies.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* 4. Schooling & Environment */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                      <h5 className="text-xs font-extrabold text-emerald-300 flex items-center space-x-1.5 space-x-reverse pb-1.5 border-b border-slate-800/80">
                        <GraduationCap className="w-4 h-4" />
                        <span>المحيط الأسري والمدرسي</span>
                      </h5>
                      <div className="text-xs space-y-1.5 text-slate-300">
                        <div><span className="text-slate-500">اللغات:</span> {familyLinguistic.primary_languages?.join(', ') || 'الدارجة'}</div>
                        <div><span className="text-slate-500">الشاشات:</span> {familyLinguistic.screen_time_hours_daily ? `${familyLinguistic.screen_time_hours_daily} ساعات/يوم` : '--'}</div>
                        <div><span className="text-slate-500">المؤسسة / القسم:</span> {schooling.school_name || '--'} ({schooling.grade_level || '--'})</div>
                        <div><span className="text-slate-500">مرافقة AVS:</span> {schooling.has_avs ? 'نعم' : 'لا'}</div>
                      </div>
                    </div>

                    {/* 5. Medical Exams & Referral */}
                    <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                      <h5 className="text-xs font-extrabold text-indigo-300 flex items-center space-x-1.5 space-x-reverse pb-1.5 border-b border-slate-800/80">
                        <Stethoscope className="w-4 h-4" />
                        <span>الفحوصات السابقة وتوجيه الطبيب (Examens & Orientation)</span>
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">فحص السمع (Audiogramme)</span>
                          <span className="font-bold text-white">{medicalHistory.hearing_tested ? 'تم إجراؤه' : 'لم يجرى'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">تخطيط الدماغ (EEG)</span>
                          <span className="font-bold text-white">{medicalHistory.eeg_done ? 'تم إجراؤه' : 'لم يجرى'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">الطبيب الموجه</span>
                          <span className="font-bold text-white">{referral.referred_by_doctor || 'استشارة مباشرة'} ({referral.referral_specialty || '--'})</span>
                        </div>
                      </div>

                      {referral.initial_complaint && (
                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
                          <strong className="block text-[11px] text-indigo-400 mb-0.5">سبب الاستشارة الرئيسي (Motif Initial):</strong>
                          {referral.initial_complaint}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: AI Clinical Records & Studios */}
              {patientTab === 'ai_records' && (
                <div className="animate-in fade-in space-y-6">
                  <PatientAiRecordsTab patient={selectedPatient} onRefresh={onRefresh} />
                </div>
              )}

              {/* TAB 2: Clinical Goals & PEP/IEP Management */}
              {patientTab === 'goals' && (
                <div className="animate-in fade-in space-y-6">
                  <TreatmentPlanView patient={selectedPatient} onRefresh={onRefresh} />
                  <div className="pt-6 border-t border-slate-800">
                    <h4 className="text-sm font-black text-white mb-3">بنك الأهداف الإجرائية الدقيقة (Granular Targets Bank):</h4>
                    <ClinicalGoalsManager patientId={selectedPatient.id} />
                  </div>
                </div>
              )}

              {/* TAB 3: Digital Speech, Language & Cognitive Therapy */}
              {patientTab === 'therapy' && (
                <div className="animate-in fade-in">
                  <TherapyAppFinder
                    patientId={selectedPatient.id}
                    patientName={`${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`}
                  />
                </div>
              )}

              {/* TAB 4: Behavior Progression & Token Analytics */}
              {patientTab === 'behavior' && (
                <BehaviorProgressionView patientId={selectedPatient.id} />
              )}

              {/* TAB 3: Flashcards & Homework Generator */}
              {patientTab === 'flashcards' && (
                <ClinicalFlashcardsBank
                  patient={selectedPatient}
                  tenant={tenant}
                  practitioner={user}
                />
              )}

              {/* TAB 4: Medical Letters & Certificates Builder */}
              {patientTab === 'documents' && (
                <MedicalLettersBuilder
                  patient={selectedPatient}
                  tenant={tenant}
                  practitioner={user}
                />
              )}

              {/* TAB 5: Voice Archive & Dual Track Player */}
              {patientTab === 'voice_archive' && (
                <PatientVoiceArchive patient={selectedPatient} />
              )}

              {/* TAB 6: Audio Dictation */}
              {patientTab === 'audio_dictation' && (
                <ClinicalAudioRecorder patientId={selectedPatient.id} />
              )}

              {/* TAB 7: Progression Curve */}
              {patientTab === 'progression' && (
                <AssessmentProgressionView patientId={selectedPatient.id} />
              )}

              {/* TAB 8: Assessments & Clinical Bilans */}
              {patientTab === 'assessments' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center space-x-2 space-x-reverse">
                        <Brain className="w-4 h-4 text-indigo-400" />
                        <span>الفحوصات والمقاييس السريرية المنجزة ({patientAssessments.length})</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        السجل الزمني لكافة التقييمات المقننة مع تتبع الفوارق النمائية والمقارنة البعدية
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      {patientAssessments.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowMasterBilanModal(true)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 space-x-reverse transition-all active:scale-95"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>📄 إنشاء وتصدير الحصيلة الشاملة (Générer Bilan Complet A4) 🖨️</span>
                        </button>
                      )}

                      {onOpenAddAssessment && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatient(null);
                            onOpenAddAssessment();
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center space-x-1 space-x-reverse"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إجراء تقييم جديد</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Past Generated Master Bilans Section */}
                  {pastBilans.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-indigo-300 flex items-center space-x-2 space-x-reverse">
                          <FileText className="w-4 h-4" />
                          <span>سجل الحصائل الإكلينيكية المعتمدة والموثقة ({pastBilans.length})</span>
                        </h5>
                        <span className="text-[10px] text-slate-400">تقارير رسمية صادرة بتنسيق A4</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {pastBilans.map((b) => (
                          <div key={b.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-white">{b.title}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {b.created_at ? new Date(b.created_at).toLocaleDateString('fr-FR') : ''} &bull; {b.specialist?.name || 'الأخصائي المعالج'}
                              </div>
                            </div>
                            <a
                              href={patientBilanApi.bilanPdfUrl(b.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-bold flex items-center space-x-1 space-x-reverse transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>تحميل PDF 🖨️</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {patientAssessments.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/60">
                      لم يتم تسجيل تقييمات سريرية لهذا المريض بعد.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientAssessments.map((a) => (
                        <div key={a.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                <Activity className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-extrabold text-xs text-white">
                                  {a.test_name_ar || a.title_ar || a.test_name || a.type}
                                  {a.title_fr && <span className="text-[10px] text-slate-400 font-normal mr-2">({a.title_fr})</span>}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  📅 {a.assessment_date} &bull; الأخصائي: {a.specialist_name || 'الأخصائي المعالج'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 space-x-reverse">
                              {/* Longitudinal Delta Badge if re-tested */}
                              {a.longitudinal && (
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border flex items-center space-x-1 space-x-reverse ${
                                  a.longitudinal.trend === 'progression'
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : a.longitudinal.trend === 'regression'
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}>
                                  <TrendingUp className="w-3 h-3" />
                                  <span>
                                    {a.longitudinal.delta > 0 ? `+${a.longitudinal.delta}` : a.longitudinal.delta} ({a.longitudinal.delta_percent > 0 ? `+${a.longitudinal.delta_percent}%` : `${a.longitudinal.delta_percent}%`}) &bull; مقارنة بعدية ({a.longitudinal.days_between} يوم)
                                  </span>
                                </span>
                              )}

                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                النتيجة: {a.total_score}
                              </span>

                              <a
                                href={a.pdf_url || clinicalTestApi.bilanPdfUrl(a.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 text-[10px] font-bold flex items-center space-x-1 space-x-reverse transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>📄 تقرير A4</span>
                              </a>
                            </div>
                          </div>

                          {/* Partial interpretation */}
                          {a.clinical_interpretation && (
                            <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
                              {a.clinical_interpretation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 9: Therapy Sessions */}
              {patientTab === 'sessions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">سجل الجلسات والمتابعة العلاجية</h4>
                    {onOpenAddSession && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null);
                          onOpenAddSession();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-md hover:bg-brand-500"
                      >
                        + تدوين جلسة جديدة
                      </button>
                    )}
                  </div>

                  {patientSessions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      لا توجد جلسات مسجلة لهذا المريض بعد.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {patientSessions.map((s) => (
                        <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">جلسة #{s.session_number || s.id}</span>
                            <span className="text-[10px] text-slate-400">{s.session_date}</span>
                          </div>
                          <p className="text-[11px] text-slate-300">{s.notes || s.objectives || 'لا توجد ملاحظات'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 10: Homework & Therapy Workbook Plans */}
              {patientTab === 'homework' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center space-x-2 space-x-reverse">
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        <span>كراسات التمارين والواجبات المنزلية المعتمدة ({patientHomeworkPlans.length})</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        برامج تدريبية منزلية مخصصة للأولياء مع أوراق عمل عالية الدقة قابلة للطباعة A4
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowHomeworkBuilderModal(true)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center space-x-1.5 space-x-reverse transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>➕ إنشاء كراس منزلي جديد (Nouveau Cahier A4)</span>
                    </button>
                  </div>

                  {patientHomeworkPlans.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-2">
                      <p>لا توجد كراسات تمارين مسندة لهذا المريض بعد.</p>
                      <button
                        type="button"
                        onClick={() => setShowHomeworkBuilderModal(true)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all"
                      >
                        ➕ إنشاء أول كراس تدريب منزلي
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {patientHomeworkPlans.map((plan) => (
                        <HomeworkPlanCard
                          key={plan.id}
                          plan={plan}
                          onRefresh={() => loadPatientDetails(selectedPatient)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Consultation Workspace Modal from Patient Profile */}
      {activeConsultationId && (
        <ActiveConsultationWorkspace
          appointmentId={activeConsultationId}
          onClose={() => setActiveConsultationId(null)}
          onSuccess={() => {
            if (selectedPatient) loadPatientDetails(selectedPatient);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Send Remote Assessment Link Modal */}
      {showRemoteModal && selectedPatient && (
        <SendRemoteAssessmentModal
          patient={selectedPatient}
          onClose={() => setShowRemoteModal(false)}
          onCreated={() => {
            if (selectedPatient) loadPatientDetails(selectedPatient);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Master Multi-Battery Clinical Bilan Builder Modal */}
      {showMasterBilanModal && selectedPatient && (
        <MasterBilanBuilderModal
          isOpen={showMasterBilanModal}
          patient={selectedPatient}
          onClose={() => setShowMasterBilanModal(false)}
          onBilanCreated={() => {
            if (selectedPatient) loadPatientDetails(selectedPatient);
          }}
        />
      )}

      {/* Patient Homework Workbook Builder Modal */}
      {showHomeworkBuilderModal && selectedPatient && (
        <PatientHomeworkBuilderModal
          isOpen={showHomeworkBuilderModal}
          patient={selectedPatient}
          onClose={() => setShowHomeworkBuilderModal(false)}
          onSuccess={() => {
            if (selectedPatient) loadPatientDetails(selectedPatient);
          }}
        />
      )}

      {/* Magic Link Parent Portal Modal */}
      {showPortalModal && selectedPatient && (
        <GeneratePortalLinkModal
          isOpen={showPortalModal}
          patient={selectedPatient}
          onClose={() => setShowPortalModal(false)}
          onGenerated={() => {
            if (selectedPatient) loadPatientDetails(selectedPatient);
          }}
        />
      )}

      {/* Granular Patients Data Export Modal */}
      <DataExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        initialDomain="patients"
      />
    </div>
  );
}
