import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  FileText,
  Target,
  BookOpen,
  Mic,
  Activity,
  Calendar,
  User,
  Printer,
  Trash2,
  Eye,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Layers,
  Wind,
  Image as ImageIcon,
  BarChart2
} from 'lucide-react';
import { patientApi } from '../../api';
import PrintableClinicalReport from '../common/PrintableClinicalReport';

export default function PatientAiRecordsTab({ patient, onRefresh }) {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecordForPreview, setSelectedRecordForPreview] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchRecords = async () => {
    if (!patient?.id) return;
    setLoading(true);
    try {
      const res = await patientApi.getAiRecords(patient.id);
      setRecords(res.records || []);
    } catch (err) {
      console.error('Failed to load patient AI records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [patient?.id]);

  const handleDelete = async (recordId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا التقرير السريري من سجل المريض؟')) return;
    setDeletingId(recordId);
    try {
      await patientApi.deleteAiRecord(patient.id, recordId);
      setRecords(prev => prev.filter(r => r.id !== recordId));
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'فشل حذف التقرير');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenStudio = (studioName) => {
    navigate(`/ai-therapy?patientId=${patient.id}&studio=${studioName}`);
  };

  const getToolMeta = (toolType) => {
    switch (toolType) {
      case 'bilan_synthesis':
        return { label: 'حصيلة سريرية وتشخيص', icon: FileText, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      case 'pep_plan':
        return { label: 'مشروع تكفل فردي PEP', icon: Target, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'social_story':
        return { label: 'قصة اجتماعية مصورة', icon: BookOpen, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' };
      case 'wisc_report':
        return { label: 'تحليل WISC-V ومخطط معرفي', icon: BarChart2, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'drawing_analysis':
        return { label: 'تحليل رسم إسقاطي', icon: ImageIcon, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'relaxation_plan':
        return { label: 'جلسة استرخاء وتنفس', icon: Wind, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'soap_note':
        return { label: 'توثيق جلسة SOAP', icon: Mic, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      default:
        return { label: 'مخرج ذكاء اصطناعي', icon: Sparkles, color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  const filteredRecords = activeFilter === 'all' 
    ? records 
    : records.filter(r => r.tool_type === activeFilter);

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      
      {/* 1. Quick Launch Action Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/30 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-black text-xl shrink-0">
              🤖
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
                <span>استوديوهات الذكاء الاصطناعي لـ {patient?.first_name} {patient?.last_name}</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                  {records.length} تقارير محفوظة
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                توليد مباشر ومحكم للحصائل، خطط الـ PEP، وتفسير الروائز بضغطة زر واحدة مع استيراد تلقائي لبيانات الطفل.
              </p>
            </div>
          </div>

          {/* Quick Buttons Grid */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            <button
              type="button"
              onClick={() => handleOpenStudio('bilan')}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition flex items-center space-x-1.5 space-x-reverse shadow-md shadow-indigo-600/20"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>صياغة حصيلة (Bilan)</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenStudio('pep')}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition flex items-center space-x-1.5 space-x-reverse shadow-md shadow-purple-600/20"
            >
              <Target className="w-3.5 h-3.5" />
              <span>خطة PEP ذكية</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenStudio('social_story')}
              className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition flex items-center space-x-1.5 space-x-reverse shadow-md shadow-teal-600/20"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>قصة اجتماعية</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenStudio('wisc')}
              className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs transition flex items-center space-x-1.5 space-x-reverse shadow-md shadow-amber-600/20"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>تقييم WISC-V</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Records History & Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                activeFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              الكل ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('bilan_synthesis')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                activeFilter === 'bilan_synthesis' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              الحصائل السريرية
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('pep_plan')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                activeFilter === 'pep_plan' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              خطط PEP
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('social_story')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                activeFilter === 'social_story' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              القصص الاجتماعية
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('wisc_report')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                activeFilter === 'wisc_report' ? 'bg-amber-600 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              WISC-V
            </button>
          </div>

          <button
            type="button"
            onClick={fetchRecords}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition text-xs font-bold flex items-center space-x-1 space-x-reverse shrink-0"
            title="تحديث السجلات"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>

        {/* 3. Records List */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-bold">جارٍ تحميل سجلات الذكاء الاصطناعي للمريض...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl p-8 space-y-3">
            <Brain className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">لا توجد مخرجات ذكاء اصطناعي محفوظة حتى الآن</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              يمكنك فتح أي استوديو من الأزرار العلوية لتوليد وحفظ الحصائل والخطط العلاجية مباشرة في هذا الملف.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords.map((rec) => {
              const meta = getToolMeta(rec.tool_type);
              const Icon = meta.icon;
              const formattedDate = new Date(rec.created_at).toLocaleDateString('ar-DZ', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={rec.id}
                  className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border flex items-center space-x-1.5 space-x-reverse ${meta.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{meta.label}</span>
                      </span>

                      <span className="text-[10px] text-slate-500 font-mono">
                        {formattedDate}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">
                        {rec.title || 'تقرير سريري غير معنون'}
                      </h4>
                      {rec.summary && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {rec.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500">
                      بواسطة: {rec.user?.name || 'الأخصائي المعالج'}
                    </span>

                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <button
                        type="button"
                        onClick={() => setSelectedRecordForPreview(rec)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white font-bold text-xs transition flex items-center space-x-1 space-x-reverse"
                        title="معاينة وقراءة التقرير"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRecordForPreview(rec)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="طباعة التقرير بترويسة العيادة"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(rec.id)}
                        disabled={deletingId === rec.id}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 transition"
                        title="حذف من السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Full-Screen Preview & Printable Clinical Report Modal */}
      {selectedRecordForPreview && (
        <PrintableClinicalReport
          title={selectedRecordForPreview.title}
          patient={patient}
          content={
            typeof selectedRecordForPreview.payload === 'string'
              ? selectedRecordForPreview.payload
              : selectedRecordForPreview.payload?.content ||
                selectedRecordForPreview.payload?.synthese ||
                JSON.stringify(selectedRecordForPreview.payload, null, 2)
          }
          date={new Date(selectedRecordForPreview.created_at).toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          documentRef={`AI-REC-${selectedRecordForPreview.id}`}
          onClose={() => setSelectedRecordForPreview(null)}
        />
      )}

    </div>
  );
}
