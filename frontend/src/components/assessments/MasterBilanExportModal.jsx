import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  CheckSquare, 
  Square, 
  X, 
  Sparkles, 
  Award, 
  Activity, 
  Brain, 
  User, 
  Calendar, 
  CheckCircle2, 
  Sliders, 
  Stethoscope, 
  Target, 
  ArrowRight,
  TrendingUp,
  Download
} from 'lucide-react';
import { clinicalTestApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

export default function MasterBilanExportModal({ patient, assessments = [], onClose }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [bilanTitle, setBilanTitle] = useState('الحصيلة العيادية التخصصية الشاملة (Bilan Clinique Global)');
  const [anamnesisSummary, setAnamnesisSummary] = useState('');
  const [clinicalObservation, setClinicalObservation] = useState('');
  const [conclusionDiagnostic, setConclusionDiagnostic] = useState('');
  const [therapeuticProject, setTherapeuticProject] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // By default select all tests
    if (assessments && assessments.length > 0) {
      setSelectedIds(assessments.map((a) => a.id));
    }
  }, [assessments]);

  const toggleSelect = (id) => {
    soundEngine.playTone(600, 0.03);
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(assessments.map((a) => a.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const getPdfUrl = () => {
    return clinicalTestApi.masterBilanPdfUrl(patient.id, selectedIds, {
      title: bilanTitle,
      anamnesis: anamnesisSummary,
      observation: clinicalObservation,
      conclusion: conclusionDiagnostic,
      project: therapeuticProject,
    });
  };

  const handlePrint = (e) => {
    if (selectedIds.length === 0) {
      e.preventDefault();
      alert('يرجى تحديد اختبار سريري واحد على الأقل لإدراجه بالحصيلة الشاملة');
      return;
    }
    soundEngine.playSuccessSound();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                توليد وتصدير الحصيلة السريرية الشاملة (Générer Bilan Complet A4)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تجميع السوابق والملاحظات العيادية والبطاريات المطبقة في تقرير رسمي مطبوع مع الختم ورمز التحقق.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Patient Quick Info Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-2 space-x-reverse">
              <User className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-400">المريض:</span>
              <strong className="text-white text-sm">{patient?.first_name} {patient?.last_name}</strong>
              <span className="font-mono text-slate-500">#{patient?.id}</span>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse text-slate-300 font-bold">
              <span>الميلاد: {patient?.birth_date?.split('T')[0] || patient?.birth_date || '--'}</span>
              <span>المقر: {patient?.commune_name || patient?.address || 'الجزائر'}</span>
            </div>
          </div>

          {/* Report Title Config */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">عنوان الحصيلة والتقرير الرسمي:</label>
            <input
              type="text"
              value={bilanTitle}
              onChange={(e) => setBilanTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Test Selector with Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                <Brain className="w-4 h-4 text-indigo-400" />
                <span>اختر الفحوصات والبطاريات المنجزة المراد إدراجها بالحصيلة ({selectedIds.length}/{assessments.length}):</span>
              </span>

              <div className="flex items-center space-x-2 space-x-reverse text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  تحديد الكل
                </button>
                <span className="text-slate-600">&bull;</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-slate-400 hover:text-slate-300 font-bold"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>

            {assessments.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                لم يتم تسجيل أي اختبارات سريرية لهذا المريض بعد.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {assessments.map((a) => {
                  const isChecked = selectedIds.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      onClick={() => toggleSelect(a.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked 
                          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 space-x-reverse">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${isChecked ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                          {isChecked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-slate-600" />}
                        </div>
                        <div>
                          <strong className="text-xs font-bold text-white block">{a.test_name_ar || a.title_ar || a.type}</strong>
                          <span className="text-[10px] text-slate-400 block">{a.assessment_date} &bull; الدرجة: {a.total_score}</span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-indigo-300">
                        {a.severity_level || a.severity || 'Évalué'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 1: Anamnesis Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">1. السوابق والمعطيات النمائية (Anamnèse Clinique):</label>
            <textarea
              rows="2"
              value={anamnesisSummary}
              onChange={(e) => setAnamnesisSummary(e.target.value)}
              placeholder="سوابق الحمل، الولادة، التطور الحركي واللغوي، التاريخ العائلي والحسي..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />
          </div>

          {/* Section 2: Clinical Observations */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">2. الملاحظات السريرية والسلوكية أثناء الفحص (Observations Cliniques):</label>
            <textarea
              rows="2"
              value={clinicalObservation}
              onChange={(e) => setClinicalObservation(e.target.value)}
              placeholder="مستوى التعاون، الانتباه، الاستجابة للتعليمات الشفهية والبصرية، التموضع المكاني..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />
          </div>

          {/* Section 3: Diagnostic Synthesis */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">3. التركيب والتشخيص العيادي الإجمالي (Synthèse Diagnostique):</label>
            <textarea
              rows="2"
              value={conclusionDiagnostic}
              onChange={(e) => setConclusionDiagnostic(e.target.value)}
              placeholder="الخلاصة التشخيصية المجمعة للذكاء، اللغة، الوظائف التنفيذية، والملف النفسي..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />
          </div>

          {/* Section 4: Therapeutic Project */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">4. المشروع العلاجي والتوصيات (Projet Thérapeutique & Préconisations):</label>
            <textarea
              rows="2"
              value={therapeuticProject}
              onChange={(e) => setTherapeuticProject(e.target.value)}
              placeholder="محاور التأهيل الأرطوفوني/النفسي، وتيرة الجلسات، التكييفات المدرسية، والتوجيه الأسري..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-slate-400">
            سيتم تجميع {selectedIds.length} اختبار في مستند PDF A4 رسمي منسق وجاهز للطباعة.
          </span>

          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              إلغاء
            </button>

            <a
              href={getPdfUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs shadow-xl shadow-indigo-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>📄 استخراج وطباعة الحصيلة الشاملة (Imprimer Bilan A4) 🖨️</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
