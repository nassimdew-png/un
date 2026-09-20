import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  CheckSquare,
  Square,
  Stethoscope,
  Pill,
  Activity,
  History,
  Save,
  X,
  RefreshCw
} from 'lucide-react';
import { visionMedicalDocumentApi } from '../../api';

export default function VisionMedicalDocumentIngestionModal({
  isOpen,
  onClose,
  patient,
  onInjected = null,
}) {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [documentCategory, setDocumentCategory] = useState('audiometry');
  const [loading, setLoading] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [ingestedFileInfo, setIngestedFileInfo] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Approval selection states
  const [selectedAnamnesis, setSelectedAnamnesis] = useState({});
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [selectedParaclinical, setSelectedParaclinical] = useState({});
  const [clinicalNotes, setClinicalNotes] = useState('تم استيعاب التقرير الطبي وتأكيد البيانات عبر Vision AI.');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setSuccessMsg(null);
    setExtractedData(null);

    // Generate local preview
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result);
    };
    reader.readAsDataURL(selected);
  };

  const handleScanDocument = async () => {
    if (!file && !filePreview) {
      setError('يرجى تحديد ملف أو صورة للتقرير الطبي أولاً.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('document_file', file);
      } else {
        formData.append('image_base64', filePreview);
      }
      formData.append('patient_id', patient?.id || '');
      formData.append('document_category', documentCategory);

      const res = await visionMedicalDocumentApi.ingest(formData);

      if (res?.success && res.extracted_data) {
        setExtractedData(res.extracted_data);
        setIngestedFileInfo({
          file_url: res.file_url,
          file_name: res.file_name,
          file_size_kb: res.file_size_kb,
          mime_type: res.mime_type,
        });

        // Initialize approval selections
        setSelectedAnamnesis(res.extracted_data.anamnesis_facts || {});
        setSelectedDiagnoses(res.extracted_data.prior_diagnoses || []);
        setSelectedMedications(res.extracted_data.current_medications || []);
        setSelectedParaclinical(res.extracted_data.paraclinical_findings || {});
      } else {
        setError(res?.message || 'فشل مسح واستيعاب التقرير الطبي.');
      }
    } catch (err) {
      console.error('Vision ingest error:', err);
      setError(err.message || 'حدث خطأ أثناء فحص الوثيقة الطبية.');
    } finally {
      setLoading(false);
    }
  };

  const handleInjectIntoEhr = async () => {
    if (!patient?.id || !ingestedFileInfo) return;
    setInjecting(true);
    setError(null);

    try {
      const payload = {
        file_url: ingestedFileInfo.file_url,
        file_name: ingestedFileInfo.file_name,
        file_size_kb: ingestedFileInfo.file_size_kb,
        mime_type: ingestedFileInfo.mime_type,
        approved_anamnesis: selectedAnamnesis,
        approved_diagnoses: selectedDiagnoses,
        approved_medications: selectedMedications,
        approved_paraclinical: selectedParaclinical,
        clinical_notes: clinicalNotes,
      };

      const res = await visionMedicalDocumentApi.inject(patient.id, payload);

      if (res?.success) {
        setSuccessMsg('✅ تم دمج البيانات المستخلصة بنجاح في السجل السريري للمريض ومرفقاته.');
        if (onInjected) onInjected(res);
      } else {
        setError(res?.message || 'فشل حقن البيانات في ملف المريض.');
      }
    } catch (err) {
      console.error('Vision inject error:', err);
      setError(err.message || 'تعذر حقن البيانات في الملف السريري.');
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-6xl my-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">الاستيعاب والمسح الذكي للملفات الطبية (Vision Intake)</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
                  AI OCR & Entity Extraction
                </span>
              </div>
              <p className="text-xs text-slate-400">
                المريض: <span className="text-slate-200 font-medium">{patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Upload Drop Zone & Preset Selection */}
          {!extractedData && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">نوع الوثيقة أو التقرير الطبي المفحوص:</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'audiometry', label: 'فحص السمع (ORL Audiogramme)' },
                      { id: 'eeg', label: 'تخطيط الدماغ (EEG Neuropédiatrie)' },
                      { id: 'discharge_summary', label: 'تقرير خروج أو استشفاء قديم' },
                      { id: 'psychological_bilan', label: 'تقرير نفسي / أرطوفوني سابق' },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setDocumentCategory(cat.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                          documentCategory === cat.id
                            ? 'bg-teal-600 text-white border-teal-500'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upload Drop Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-teal-500 bg-slate-950/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                  className="hidden"
                />

                {filePreview ? (
                  <div className="space-y-3">
                    <img
                      src={filePreview}
                      alt="Medical report preview"
                      className="max-h-60 rounded-lg mx-auto object-contain border border-slate-800 shadow-md"
                    />
                    <p className="text-xs text-teal-400 font-semibold">انقر لتغيير الصورة المحددة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-110 transition">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">انقر لاختيار أو سحب صورة التقرير الطبي أو ملف PDF</h4>
                      <p className="text-xs text-slate-400 mt-1">يدعم صور الكاميرا، تقارير السكانير، وتخطيطات الدماغ والسمع (حتى 20 ميغابايت)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {filePreview && (
                <div className="flex justify-end">
                  <button
                    onClick={handleScanDocument}
                    disabled={loading}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg"
                  >
                    {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>بدء المسح والاستخلاص السريري (Vision AI)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Split Screen View after Extraction */}
          {extractedData && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Right Side: Document Preview (5 cols) */}
              <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 h-[600px]">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-teal-400" />
                    <span>معاينة الوثيقة الطبية الأصلية</span>
                  </span>
                  <button
                    onClick={() => {
                      setExtractedData(null);
                      setFile(null);
                      setFilePreview(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>مسح وثيقة أخرى</span>
                  </button>
                </div>

                <div className="flex-1 overflow-auto rounded-lg bg-slate-900/50 flex items-center justify-center p-2 border border-slate-800">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Original Scan"
                      className="max-h-full max-w-full object-contain rounded shadow"
                    />
                  ) : (
                    <div className="text-center text-slate-500 text-xs">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <span>معاينة PDF متاحة في نافذة خارجية</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>الجهة المصدرة: <strong className="text-slate-200">{extractedData.issuing_entity || 'غير محددة'}</strong></span>
                  <span>التاريخ: {extractedData.report_date || 'غير محدد'}</span>
                </div>
              </div>

              {/* Left Side: Extracted Entities Review & Approval (7 cols) */}
              <div className="lg:col-span-7 space-y-4 h-[600px] overflow-y-auto pr-1">
                <div className="p-3 bg-teal-950/30 border border-teal-500/20 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-teal-300">{extractedData.document_type_label || 'تقرير طبي سريري'}</div>
                    <div className="text-[11px] text-slate-400">راجع البيانات المستخرجة وتأكد من مطابقتها قبل الحقن في الملف</div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-500/20 text-teal-300 rounded border border-teal-500/30">
                    دقة استخلاص عالية
                  </span>
                </div>

                {/* Section 1: Anamnesis Facts */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-400" />
                    <span>السوابق النمائية والتوليدية (Anamnesis Facts)</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    {Object.entries(selectedAnamnesis).map(([key, val]) => (
                      <div key={key} className="flex items-start gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="mt-0.5 rounded border-slate-700 text-teal-500 focus:ring-0"
                        />
                        <div className="flex-1">
                          <span className="text-[11px] text-slate-400 block font-medium">
                            {key === 'pregnancy_and_birth' ? 'الحمل والولادة:' :
                             key === 'milestones_walking_months' ? 'سن المشي (شهور):' :
                             key === 'milestones_speech_months' ? 'سن الكلمات الأولى (شهور):' :
                             key === 'past_hospitalizations' ? 'سوابق الاستشفاء والحرارة:' : 'سوابق أسرية:'}
                          </span>
                          <span className="text-slate-200">{String(val || 'لا توجد ملاحظات')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Current & Prior Medications */}
                {selectedMedications.length > 0 && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-amber-400" />
                      <span>الأدوية الحالية والجرعات الموثقة (Medications)</span>
                    </h4>

                    <div className="space-y-2 text-xs">
                      {selectedMedications.map((med, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked={true} className="rounded border-slate-700 text-teal-500 focus:ring-0" />
                            <strong className="text-white">{med.name}</strong>
                          </div>
                          <span className="text-amber-400 text-[11px]">{med.dose} • {med.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Paraclinical Findings (Audiogram / EEG) */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <span>النتائج والفحوصات الباركلينيكية (Paraclinical Results)</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    {selectedParaclinical.audiogram_result && (
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                        <div className="font-semibold text-teal-300 text-[11px]">نتائج تخطيط السمع (Audiogram):</div>
                        <p className="text-slate-300">{selectedParaclinical.audiogram_result}</p>
                      </div>
                    )}

                    {selectedParaclinical.eeg_result && (
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                        <div className="font-semibold text-indigo-300 text-[11px]">نتائج تخطيط الدماغ (EEG):</div>
                        <p className="text-slate-300">{selectedParaclinical.eeg_result}</p>
                      </div>
                    )}

                    {selectedParaclinical.radiology_or_lab && (
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                        <div className="font-semibold text-slate-400 text-[11px]">المعاوقة والتحاليل الأخرى:</div>
                        <p className="text-slate-300">{selectedParaclinical.radiology_or_lab}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 4: Clinical Recommendations */}
                {extractedData.clinical_recommendations?.length > 0 && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-white">توصيات التقرير الطبي الخارجي:</h4>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                      {extractedData.clinical_recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
            إلغاء وإغلاق
          </button>

          {extractedData && (
            <button
              onClick={handleInjectIntoEhr}
              disabled={injecting}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg"
            >
              {injecting ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>حقن المعطيات المعتمدة في ملف وسوابق المريض (Inject into EHR) 📥</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
