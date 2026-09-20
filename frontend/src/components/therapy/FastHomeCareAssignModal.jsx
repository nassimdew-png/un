import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Share2,
  Smartphone,
  Layers,
  MessageSquare,
  HelpCircle,
  Activity,
  HeartHandshake
} from 'lucide-react';
import { CLINICAL_EXERCISES_CATALOG, EXERCISE_CATEGORIES } from './ExercisesCatalogData';
import { homeCareApi, whatsappApi } from '../../api';

export default function FastHomeCareAssignModal({
  isOpen,
  onClose,
  patient = null,
  patients = [],
  initialExercise = null,
  onAssigned = null,
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(patient?.id || '');
  const [mode, setMode] = useState(initialExercise ? 'catalog' : 'catalog'); // 'catalog' | 'custom'
  const [selectedCatalogId, setSelectedCatalogId] = useState(initialExercise?.id || '');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form Fields
  const [title, setTitle] = useState(initialExercise?.title_ar || '');
  const [instructions, setInstructions] = useState(
    initialExercise?.instructions_for_patient
      ? (Array.isArray(initialExercise.instructions_for_patient)
          ? initialExercise.instructions_for_patient.join('\n')
          : initialExercise.instructions_for_patient)
      : ''
  );
  const [category, setCategory] = useState(initialExercise?.category || 'articulation');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [frequency, setFrequency] = useState('يومياً');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successPayload, setSuccessPayload] = useState(null);
  const [copied, setCopied] = useState(false);

  // Sync when initialExercise or patient changes
  useEffect(() => {
    if (patient?.id) {
      setSelectedPatientId(patient.id);
    }
  }, [patient]);

  useEffect(() => {
    if (initialExercise) {
      setMode('catalog');
      setSelectedCatalogId(initialExercise.id);
      setTitle(initialExercise.title_ar || '');
      setCategory(initialExercise.category || 'articulation');
      if (initialExercise.instructions_for_patient) {
        setInstructions(
          Array.isArray(initialExercise.instructions_for_patient)
            ? initialExercise.instructions_for_patient.join('\n')
            : initialExercise.instructions_for_patient
        );
      }
    }
  }, [initialExercise]);

  if (!isOpen) return null;

  // Active target patient object
  const activePatient = patient || patients.find((p) => String(p.id) === String(selectedPatientId)) || null;

  // Filter catalog exercises
  const filteredCatalog = CLINICAL_EXERCISES_CATALOG.filter((ex) => {
    if (specialtyFilter !== 'all' && ex.specialty !== specialtyFilter) return false;
    if (categoryFilter !== 'all' && ex.category !== categoryFilter) return false;
    return true;
  });

  const handleSelectCatalogExercise = (ex) => {
    setSelectedCatalogId(ex.id);
    setTitle(ex.title_ar);
    setCategory(ex.category);
    const instr = Array.isArray(ex.instructions_for_patient)
      ? ex.instructions_for_patient.join('\n')
      : (ex.instructions_for_patient || ex.summary || '');
    setInstructions(instr);
  };

  const handleSaveAndAssign = async () => {
    if (!activePatient?.id) {
      setError('يرجى تحديد المريض أولاً.');
      return;
    }
    if (!title.trim()) {
      setError('يرجى كتابة أو اختيار عنوان النشاط المنزلي.');
      return;
    }
    if (!instructions.trim()) {
      setError('يرجى إدخال إرشادات التمرين للولي.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        exercise_title: title.trim(),
        instructions: instructions.trim(),
        category,
        due_date: dueDate,
        duration_minutes: Number(durationMinutes) || 10,
        frequency,
      };

      const res = await homeCareApi.assignHomework(activePatient.id, payload);

      if (res?.success) {
        setSuccessPayload(res);
        if (onAssigned) onAssigned(res);
      } else {
        setError(res?.message || 'فشل حفظ التكليف المنزلي.');
      }
    } catch (err) {
      console.error('Error assigning home care:', err);
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyMessage = () => {
    if (!successPayload?.whatsapp_message) return;
    navigator.clipboard.writeText(successPayload.whatsapp_message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    if (successPayload?.whatsapp_url) {
      window.open(successPayload.whatsapp_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl animate-in fade-in duration-150 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>تكليف تمرين منزلي وتفاعل الأولياء (Parent Practice)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  WhatsApp & Portal 🏡
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                إرسال مهام أسبوعية للأهل مع إمكانية تسجيل الصوت ومتابعة مؤشر الالتزام
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Modal View */}
        {successPayload ? (
          <div className="space-y-4 py-2 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-white">تم تكليف النشاط المنزلي بنجاح!</h4>
              <p className="text-xs text-emerald-300 max-w-md mx-auto">
                تم تثبيت النشاط في ملف المريض وتوليد الرابط المباشر للبوابة ورسالة WhatsApp المعتمدة للأهل.
              </p>
            </div>

            {/* Formatted WhatsApp Message Preview */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-800/80 pb-1.5">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>معاينة رسالة WhatsApp الموجهة للأسرة:</span>
                </span>
                <span className="text-[10px] text-slate-500">جاهزة للإرسال الفوري</span>
              </div>
              <pre className="text-[11px] text-slate-300 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                {successPayload.whatsapp_message}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ نص الرسالة والرابط'}</span>
              </button>

              {successPayload.whatsapp_url && (
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center space-x-1.5 space-x-reverse shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال عبر WhatsApp الآن 📱</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          /* Main Assignment Form */
          <div className="space-y-4 text-xs">
            
            {/* Patient Header / Selector */}
            {activePatient ? (
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                    {activePatient.first_name?.[0] || 'P'}
                  </div>
                  <div>
                    <span className="font-black text-white text-xs block">
                      {activePatient.first_name} {activePatient.last_name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ملف #{activePatient.id} &bull; هاتف: {activePatient.phone || 'غير مسجل'}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                  مريض الجلسة الحالي ✅
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">اختيار المريض المستهدف:</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-teal-500"
                >
                  <option value="">-- يرجى اختيار المريض من القائمة --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.phone || 'بدون هاتف'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Source Mode Toggle */}
            <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('catalog')}
                className={`flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 space-x-reverse transition-all ${
                  mode === 'catalog'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>اختيار من بنك التمارين المعياري (30+ نشاط)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 space-x-reverse transition-all ${
                  mode === 'custom'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>صياغة تمرين وتوجيه علاجي مخصص</span>
              </button>
            </div>

            {/* Catalog Selector */}
            {mode === 'catalog' && (
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-300 text-[11px]">اختر النشاط المعياري من القائمة:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSpecialtyFilter('all')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        specialtyFilter === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecialtyFilter('orthophony')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        specialtyFilter === 'orthophony' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      تخاطب
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecialtyFilter('psychology')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        specialtyFilter === 'psychology' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      نفسي
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecialtyFilter('psychomotricite')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        specialtyFilter === 'psychomotricite' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      حركي
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {filteredCatalog.map((ex) => {
                    const isSelected = selectedCatalogId === ex.id;
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => handleSelectCatalogExercise(ex)}
                        className={`p-2.5 rounded-xl text-right border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-teal-950/80 border-teal-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 font-mono">
                            {ex.badge || ex.category}
                          </span>
                          <span className="text-[9px] text-slate-500">{ex.estimated_duration}</span>
                        </div>
                        <div className="font-bold text-[11px] text-white truncate">{ex.title_ar}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Exercise Title */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">عنوان النشاط / التمرين المنزلي:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تدريب مخارج صوت الراء /r/ وتمارين الشفاه أمام المرآة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-teal-500"
              />
            </div>

            {/* Duration, Frequency & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>المدة اليومية:</span>
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-teal-500"
                >
                  <option value={5}>5 دقائق</option>
                  <option value={10}>10 دقائق (موصى به)</option>
                  <option value={15}>15 دقيقة</option>
                  <option value={20}>20 دقيقة</option>
                  <option value={30}>30 دقيقة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>تكرار التمرين:</span>
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-teal-500"
                >
                  <option value="يومياً">يومياً (مستمر)</option>
                  <option value="مرتين يومياً">مرتين يومياً</option>
                  <option value="3 مرات بالأسبوع">3 مرات بالأسبوع</option>
                  <option value="عند الحاجة">عند الحاجة / المواقف الضاغطة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>تاريخ الاستحقاق:</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-teal-500"
                />
              </div>
            </div>

            {/* Instructions for Parent */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                  <span>إرشادات وتوجيهات المختص للأهل (خطوات التنفيذ المنزلي):</span>
                </label>
                <span className="text-[10px] text-slate-500">تظهر في البوابة ورسالة WhatsApp</span>
              </div>
              <textarea
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="1. الجلوس أمام المرآة في مكان هادئ...&#10;2. نطق الكلمات المحددة 3 مرات متتالية...&#10;3. تسجيل مقطع صوتي عبر البوابة لتقييمه في الجلسة القادمة."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-white focus:border-teal-500 leading-relaxed font-sans"
              />
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveAndAssign}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center space-x-2 space-x-reverse shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{saving ? 'جارٍ الحفظ وتوليد الرابط...' : 'حفظ وتكليف الولي عبر WhatsApp 🚀'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
