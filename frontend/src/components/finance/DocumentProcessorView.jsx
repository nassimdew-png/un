import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  DollarSign,
  Building2,
  Layers,
  Trash2,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Presentation,
  Play,
  Calendar,
  Tag,
  ArrowRight,
  ShieldCheck,
  Zap,
  Plus
} from 'lucide-react';
import { financeDocumentApi } from '../../api';
import InteractiveSlideshowViewer from './InteractiveSlideshowViewer';

export default function DocumentProcessorView() {
  const [activeTab, setActiveTab] = useState('ocr'); // 'ocr', 'slideshow'
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ total_count: 0, total_expenses: 0, reconciled_count: 0, discrepancy_count: 0 });
  const [loading, setLoading] = useState(true);

  // Upload & Extraction State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [discrepancies, setDiscrepancies] = useState([]);

  // Editable Form for Reconciling
  const [vendorName, setVendorName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [category, setCategory] = useState('medical_supplies');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Slideshow Reports State
  const [slideshowReports, setSlideshowReports] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [activeSlideshow, setActiveSlideshow] = useState(null);

  const [toast, setToast] = useState(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await financeDocumentApi.getDocuments();
      if (res.success) {
        setDocuments(res.documents || []);
        setStats(res.stats || {});
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSlideshows = async () => {
    try {
      const res = await financeDocumentApi.getSlideshowReports();
      if (res.success) {
        setSlideshowReports(res.reports || []);
      }
    } catch (err) {
      console.error('Failed to load slideshows:', err);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadSlideshows();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setExtractedData(null);
    setCurrentDoc(null);
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile || isProcessing) return;
    setIsProcessing(true);
    setToast(null);

    const formData = new FormData();
    formData.append('document_file', selectedFile);
    formData.append('type', 'expense_receipt');

    try {
      const res = await financeDocumentApi.processDocument(formData);
      if (res.success) {
        setCurrentDoc(res.document);
        setExtractedData(res.raw_data);
        setDiscrepancies(res.discrepancies || []);

        // Fill Form
        setVendorName(res.raw_data.vendor_name || '');
        setInvoiceNumber(res.raw_data.invoice_number || '');
        setInvoiceDate(res.raw_data.invoice_date || '');
        setTotalAmount(res.raw_data.total_amount || '');
        setCategory(res.raw_data.category || 'medical_supplies');
        setNotes(res.document.notes || '');

        setToast({ type: 'success', text: 'تمت قراءة واستخراج بيانات الفاتورة بنجاح بواسطة الذكاء الاصطناعي!' });
        loadDocuments();
      } else {
        throw new Error(res.message || 'فشلت معالجة الفاتورة');
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'تعذر استخراج بيانات الفاتورة.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReconcile = async () => {
    if (!currentDoc?.id || isSaving) return;
    setIsSaving(true);
    try {
      const res = await financeDocumentApi.reconcileDocument(currentDoc.id, {
        vendor_name: vendorName,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        total_amount: parseFloat(totalAmount) || 0,
        category,
        notes,
      });

      if (res.success) {
        setToast({ type: 'success', text: 'تم اعتماد الفاتورة ومطابقتها في السجل المحاسبي للعيادة!' });
        setCurrentDoc(null);
        setExtractedData(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        loadDocuments();
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'فشل اعتماد الفاتورة.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المستند المالي؟')) return;
    try {
      await financeDocumentApi.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      setToast({ type: 'success', text: 'تم حذف المستند بنجاح.' });
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'فشل حذف المستند.' });
    }
  };

  const handleGenerateSlideshow = async () => {
    setIsGeneratingDeck(true);
    setToast(null);
    try {
      const res = await financeDocumentApi.generateSlideshowReport({
        period: selectedPeriod,
      });
      if (res.success) {
        setToast({ type: 'success', text: 'تم إنشاء العرض التقديمي المالي الذكي بنجاح!' });
        loadSlideshows();
        setActiveSlideshow(res.report);
      }
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'فشل توليد العرض التقديمي.' });
    } finally {
      setIsGeneratingDeck(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-right max-w-7xl mx-auto" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-950 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1.5 space-x-reverse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI FINANCIAL OCR & PRESENTATION DECK 🧾✨</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              معالج الفواتير الذكي والعروض المالية التفاعلية
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              ارفع صور الفواتير والإيصالات لاستخراج البنود والمبالغ بدقة، وتدقيق التكرار والأسعار، ثم ولّد عروض شرائح تفاعلية جاهزة للعرض والإدارة بنقرة واحدة.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-slate-950/80 border border-amber-500/20 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي النفقات المدققة</span>
              <span className="text-sm font-black text-amber-300 font-mono">
                {stats.total_expenses?.toLocaleString()} دج
              </span>
            </div>
            <div className="bg-slate-950/80 border border-amber-500/20 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] text-slate-400 font-bold block">الفواتير المعالجة</span>
              <span className="text-sm font-black text-white font-mono">
                {stats.total_count} وثيقة
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
          toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        }`}>
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white font-black">✕</button>
        </div>
      )}

      {/* 2. Sub-Tabs Switcher */}
      <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800 pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('ocr')}
          className={`px-5 py-2.5 rounded-2xl transition flex items-center space-x-2 space-x-reverse ${
            activeTab === 'ocr' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>مسح ومطابقة الفواتير (OCR)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('slideshow')}
          className={`px-5 py-2.5 rounded-2xl transition flex items-center space-x-2 space-x-reverse ${
            activeTab === 'slideshow' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-black' : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Presentation className="w-4 h-4" />
          <span>عروض الشرائح المالية الذكية ({slideshowReports.length})</span>
        </button>
      </div>

      {/* 3. TAB 1: OCR & Ingestion */}
      {activeTab === 'ocr' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Upload Dropzone */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
              <UploadCloud className="w-5 h-5 text-amber-400" />
              <span>رفع صورة الفاتورة أو وصل المصاريف (PDF / Images)</span>
            </h3>

            <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-3xl p-8 text-center bg-slate-950/60 transition cursor-pointer relative group">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {selectedFile ? selectedFile.name : 'اسحب وأفلت الفاتورة هنا، أو انقر للاختيار من جهازك'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    يدعم PNG, JPG, WebP, PDF (حتى 15 ميجابايت)
                  </span>
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleUploadAndProcess}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-amber-600/25 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جارٍ تحليل الوثيقة واستخراج البنود بالـ Vision AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>⚡ استخراج البيانات المحاسبية</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Side-by-Side Review Panel */}
          {extractedData && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl space-y-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-white">مراجعة واعتماد بنود الفاتورة</h3>
                  <p className="text-xs text-slate-400">تأكد من صحة المبالغ والبنود المستخرجة قبل الاعتماد في السجل.</p>
                </div>

                {discrepancies.length > 0 ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1.5 space-x-reverse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>تم رصد تباين / تكرار</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1.5 space-x-reverse">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>مطابقة محاسبية سليمة ✅</span>
                  </span>
                )}
              </div>

              {/* Discrepancy Warnings */}
              {discrepancies.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-1 text-xs text-rose-300">
                  {discrepancies.map((d, idx) => (
                    <div key={idx} className="font-bold">{d}</div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Preview */}
                <div className="lg:col-span-5 border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center p-4">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Uploaded receipt" className="max-h-96 object-contain rounded-xl" />
                  ) : (
                    <span className="text-xs text-slate-500">لا توجد معاينة متاحة</span>
                  )}
                </div>

                {/* Right: Editable Form */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">اسم المورد / الشركة:</label>
                      <input
                        type="text"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">رقم الفاتورة:</label>
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">تاريخ الفاتورة:</label>
                      <input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">المبلغ الإجمالي (دج):</label>
                      <input
                        type="number"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs text-amber-300 font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400">فئة المصروف:</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      >
                        <option value="medical_supplies">مستلزمات طبية وتجهيزات سريرية</option>
                        <option value="materials">روائز واختبارات وألعاب تأهيل</option>
                        <option value="rent">إيجار المقر والعيادة</option>
                        <option value="utilities">كهرباء / ماء / إنترنت</option>
                        <option value="software">برمجيات واشتراكات تقنية</option>
                        <option value="marketing">تسويق وإعلانات</option>
                        <option value="salary">أجور ومكافآت</option>
                        <option value="other">مصاريف أخرى</option>
                      </select>
                    </div>
                  </div>

                  {/* Extracted Line Items Table */}
                  {extractedData.items && extractedData.items.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-bold text-slate-400">البنود المستخرجة بالتفصيل:</span>
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-right text-[11px]">
                          <thead className="bg-slate-950 text-slate-400">
                            <tr>
                              <th className="p-2">البند</th>
                              <th className="p-2 text-center">الكمية</th>
                              <th className="p-2 text-center">السعر</th>
                              <th className="p-2 text-center">الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 font-mono">
                            {extractedData.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="p-2 font-sans">{item.description}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-center">{item.unit_price?.toLocaleString()}</td>
                                <td className="p-2 text-center font-bold text-amber-300">{item.total?.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={handleReconcile}
                      disabled={isSaving}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center space-x-1.5 space-x-reverse shadow-md disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSaving ? 'جارٍ الاعتماد...' : '💾 اعتماد ومطابقة في السجل المحاسبي'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Stored Documents Table */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-white">سجل الفواتير والمصاريف المدخلة ({documents.length})</h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">المورد</th>
                    <th className="p-3.5">رقم الفاتورة</th>
                    <th className="p-3.5">التاريخ</th>
                    <th className="p-3.5">الفئة</th>
                    <th className="p-3.5 text-center">المبلغ الإجمالي</th>
                    <th className="p-3.5 text-center">الحالة</th>
                    <th className="p-3.5 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        لا توجد فواتير مسجلة بعد. ارفع أول فاتورة أعلاه.
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-950/60 transition">
                        <td className="p-3.5 font-bold text-white">{doc.vendor_name || 'غير محدد'}</td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">{doc.invoice_number || '---'}</td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          {doc.invoice_date ? new Date(doc.invoice_date).toLocaleDateString('ar-DZ') : '---'}
                        </td>
                        <td className="p-3.5 text-slate-300 text-[11px]">{doc.category}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-amber-300">
                          {parseFloat(doc.total_amount || 0).toLocaleString()} دج
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            doc.status === 'reconciled'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : doc.status === 'discrepancy'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {doc.status === 'reconciled' ? 'معتمدة ✅' : doc.status === 'discrepancy' ? 'تباين ⚠️' : 'مستخرجة'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(doc.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 4. TAB 2: Slideshow Deck Generator */}
      {activeTab === 'slideshow' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Deck Generator Control Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Presentation className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-black text-white">توليد عرض الشرائح المالي الذكي (AI Presentation Deck)</h3>
                <p className="text-xs text-slate-400">يقوم الذكاء الاصطناعي بتجميع الإيرادات والنفقات وصياغة شرائح جاهزة للعرض التفاعلي.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full sm:w-64 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-bold"
              >
                <option value="this_month">الشهر الحالي</option>
                <option value="last_quarter">الثلاثي الأخير Q3</option>
                <option value="yearly">السنة المالية 2026</option>
                <option value="all_time">كامل السجل التاريخي</option>
              </select>

              <button
                type="button"
                onClick={handleGenerateSlideshow}
                disabled={isGeneratingDeck}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition flex items-center justify-center space-x-2 space-x-reverse shadow-lg shadow-indigo-600/25 disabled:opacity-50"
              >
                {isGeneratingDeck ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ تجميع البيانات وتوليد الشرائح...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>🎬 إنشاء العرض التقديمي الذكي</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* List of Saved Decks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slideshowReports.map((report) => (
              <div key={report.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition space-y-4 shadow-lg group">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {report.period}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(report.created_at).toLocaleDateString('ar-DZ')}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white group-hover:text-indigo-300 transition">{report.title}</h4>
                  <p className="text-xs text-slate-400">
                    عرض تفاعلي مكوّن من {report.slides_json?.length || 6} شرائح مع مؤشرات الأداء.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSlideshow(report)}
                  className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 space-x-reverse border border-slate-800"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>بدء العرض التقديمي (Play Deck)</span>
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 5. Interactive Slideshow Modal Player */}
      {activeSlideshow && (
        <InteractiveSlideshowViewer
          report={activeSlideshow}
          onClose={() => setActiveSlideshow(null)}
        />
      )}

    </div>
  );
}
