import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CreditCard,
  BookOpen,
  Activity,
  Ear,
  Send,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Search,
  FileUp,
  Image as ImageIcon,
  FolderOpen
} from 'lucide-react';
import { attachmentApi, patientApi } from '../../api';

const CATEGORY_MAP = {
  chifa_card: {
    label: 'بطاقة الشفاء / بطاقة الهوية الوطنية',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: CreditCard,
    dbCategory: 'other',
  },
  carnet_sante: {
    label: 'الدفتر الصحي والتلقيحات',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    icon: BookOpen,
    dbCategory: 'other',
  },
  medical_report: {
    label: 'تقرير طبي / استشارة عصبية',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: FileText,
    dbCategory: 'medical_report',
  },
  eeg_report: {
    label: 'تخطيط الدماغ والأشعة (EEG / IRM)',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: Activity,
    dbCategory: 'imaging',
  },
  audiogram: {
    label: 'تخطيط السمعيات وفحص الأذن (Audiogramme)',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: Ear,
    dbCategory: 'medical_report',
  },
  referral_letter: {
    label: 'رسالة توجيه الطبيب (Lettre d\'Orientation)',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    icon: Send,
    dbCategory: 'medical_report',
  },
  other: {
    label: 'وثيقة أو تعهد إداري آخر',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    icon: FolderOpen,
    dbCategory: 'other',
  },
};

export default function ExternalDocumentScannerModal({
  isOpen,
  onClose,
  initialPatientId = null,
  patients = [],
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');
  const [patientSearch, setPatientSearch] = useState('');
  const [category, setCategory] = useState('chifa_card');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Existing Attachments
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientAttachments(selectedPatientId);
    } else {
      setAttachments([]);
    }
  }, [selectedPatientId]);

  const loadPatientAttachments = async (patientId) => {
    setLoadingAttachments(true);
    try {
      const res = await attachmentApi.list(patientId);
      setAttachments(res.attachments || res.data || []);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  if (!isOpen) return null;

  const filteredPatients = patients.filter((p) => {
    const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const phone = (p.phone || '').toLowerCase();
    return name.includes(patientSearch.toLowerCase()) || phone.includes(patientSearch.toLowerCase());
  });

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 15 * 1024 * 1024) {
      setError('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 15 ميغابايت.');
      return;
    }

    setFile(selected);
    setError('');

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError('يرجى اختيار المريض أولاً.');
      return;
    }
    if (!file) {
      setError('يرجى اختيار أو مسح الملف المراد أرشفته.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const catConfig = CATEGORY_MAP[category] || CATEGORY_MAP.other;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', catConfig.dbCategory);
      formData.append('related_type', 'general');
      const compositeNotes = `[${catConfig.label}] ${notes.trim()}`;
      formData.append('notes', compositeNotes);

      await attachmentApi.upload(selectedPatientId, formData);

      setSuccess('تم حفظ وأرشفة الوثيقة في السجل الطبي للمريض بنجاح.');
      setFile(null);
      setFilePreview(null);
      setNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      loadPatientAttachments(selectedPatientId);
    } catch (err) {
      console.error('Upload document error:', err);
      setError(err.message || 'فشل رفع الوثيقة.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الوثيقة المرفقة؟')) return;
    try {
      await attachmentApi.delete(id);
      loadPatientAttachments(selectedPatientId);
    } catch (err) {
      console.error('Delete attachment error:', err);
      alert('فشل حذف الوثيقة.');
    }
  };

  const selectedPatient = patients.find((p) => String(p.id) === String(selectedPatientId));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold shadow-lg shadow-indigo-500/10">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>أرشفة وماسح الوثائق والبطاقات الخارجية</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono font-bold">
                  SCANNER & ARCHIVE 📂
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                مسح وأرشفة بطاقات الشفاء، الدفاتر الصحية، تقارير EEG، ورسائل التوجيه في السجل الإداري
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Patient Selection Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>اختيار ملف المريض:</span>
                {selectedPatient && (
                  <span className="text-teal-400 font-extrabold">
                    ({selectedPatient.first_name} {selectedPatient.last_name} • {selectedPatient.phone || 'بدون هاتف'})
                  </span>
                )}
              </label>

              {/* Patient Search Input */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="بحث سريع بالاسم أو الهاتف..."
                  className="w-full px-3 py-1.5 pl-8 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="">-- اضغط لاختيار المريض المستهدف --</option>
              {filteredPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} (الهاتف: {p.phone || 'غير مسجل'})
                </option>
              ))}
            </select>
          </div>

          {/* Upload Box (Only active if patient is selected) */}
          {selectedPatientId ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Side */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Category Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    نوع وتصنيف الوثيقة المرفوعة:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(CATEGORY_MAP).map(([key, cfg]) => {
                      const IconComp = cfg.icon;
                      const isSelected = category === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCategory(key)}
                          className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold shadow-md shadow-indigo-500/10'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg border ${cfg.badge}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span className="text-xs truncate">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dropzone & File Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    الملف أو الصورة الممسوحة:
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-2xl bg-slate-950/40 hover:bg-slate-950/80 cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />

                    {filePreview ? (
                      <div className="space-y-2">
                        <img
                          src={filePreview}
                          alt="معاينة الوثيقة"
                          className="max-h-36 rounded-xl mx-auto border border-slate-700 shadow-md object-cover"
                        />
                        <p className="text-[11px] text-teal-400 font-bold">
                          {file?.name} ({(file?.size / 1024).toFixed(0)} KB)
                        </p>
                      </div>
                    ) : file ? (
                      <div className="space-y-2">
                        <FileText className="w-10 h-10 text-indigo-400 mx-auto" />
                        <p className="text-xs text-white font-bold">{file.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {(file.size / 1024).toFixed(0)} KB • جاهز للرفع
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <FileUp className="w-6 h-6" />
                        </div>
                        <h5 className="text-xs font-bold text-white mb-1">
                          انقر لاختيار الملف أو التقاط صورة بالماسح
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          يدعم صور (JPG, PNG, WebP) وملفات PDF حتى 15 ميغابايت
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ملاحظات أو تعليق حول الوثيقة (اختياري):
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: صادرة من مستشفى عين النعجة بتاريخ 2026..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading || !file}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {uploading ? (
                    <span>جاري حفظ وأرشفة الوثيقة...</span>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>حفظ وأرشفة الوثيقة في الملف الطبي ⚡</span>
                    </>
                  )}
                </button>
              </div>

              {/* Patient's Existing Documents List */}
              <div className="lg:col-span-5 bg-slate-950/60 rounded-2xl border border-slate-800 p-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-indigo-400" />
                    <span>المستندات المؤرشفة للمريض ({attachments.length})</span>
                  </h4>
                  {loadingAttachments && (
                    <span className="text-[10px] text-slate-400 animate-pulse">جاري التحميل...</span>
                  )}
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[380px] flex-1 pr-1">
                  {attachments.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 space-y-2">
                      <FileText className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs">لا توجد وثائق خارجية مؤرشفة بعد لهذا المريض.</p>
                    </div>
                  ) : (
                    attachments.map((att) => {
                      const isImage = att.mime_type?.startsWith('image/');
                      return (
                        <div
                          key={att.id}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-indigo-400">
                              {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-white truncate" title={att.file_name}>
                                {att.file_name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {att.notes || att.category || 'مستند إداري'} • {att.file_size_kb || 0} KB
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => attachmentApi.download(att.id)}
                              title="تنزيل أو عرض الوثيقة"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAttachment(att.id)}
                              title="حذف الوثيقة"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <FolderOpen className="w-12 h-12 mx-auto opacity-30 text-indigo-400" />
              <p className="text-sm font-semibold text-slate-400">يرجى اختيار مريض للبدء في مسح أو أرشفة وثائقه.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
