import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  FileText, 
  Printer, 
  RotateCcw, 
  Save, 
  AlertTriangle, 
  User, 
  Activity, 
  X, 
  Image as ImageIcon,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  Percent
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

// Standard 80 DO-80 item targets (French & Arabic translation)
const DO80_ITEMS = [
  { id: 1, name_ar: 'مائدة / طاولة', name_fr: 'Table', category: 'أثاث' },
  { id: 2, name_ar: 'مقص', name_fr: 'Ciseaux', category: 'أدوات' },
  { id: 3, name_ar: 'أسد', name_fr: 'Lion', category: 'حيوانات' },
  { id: 4, name_ar: 'ساعة يد', name_fr: 'Montre', category: 'أغراض' },
  { id: 5, name_ar: 'قفل ومفتاح', name_fr: 'Cadenas', category: 'أدوات' },
  { id: 6, name_ar: 'فيل', name_fr: 'Éléphant', category: 'حيوانات' },
  { id: 7, name_ar: 'شجرة', name_fr: 'Arbre', category: 'طبيعة' },
  { id: 8, name_ar: 'نظارات', name_fr: 'Lunettes', category: 'أغراض' },
  { id: 9, name_ar: 'شمعة', name_fr: 'Bougie', category: 'أغراض' },
  { id: 10, name_ar: 'دراجة هوائية', name_fr: 'Vélo', category: 'مركبات' },
  { id: 11, name_ar: 'فراشة', name_fr: 'Papillon', category: 'حشرات' },
  { id: 12, name_ar: 'مظلة مطر', name_fr: 'Parapluie', category: 'أغراض' },
  { id: 13, name_ar: 'سرير', name_fr: 'Lit', category: 'أثاث' },
  { id: 14, name_ar: 'طائرة', name_fr: 'Avion', category: 'مركبات' },
  { id: 15, name_ar: 'حصان', name_fr: 'Cheval', category: 'حيوانات' },
  { id: 16, name_ar: 'تفاحة', name_fr: 'Pomme', category: 'فواكه' },
  { id: 17, name_ar: 'كتاب', name_fr: 'Livre', category: 'أدوات' },
  { id: 18, name_ar: 'سيارة', name_fr: 'Voiture', category: 'مركبات' },
  { id: 19, name_ar: 'قبعة', name_fr: 'Chapeau', category: 'ملابس' },
  { id: 20, name_ar: 'سمكة', name_fr: 'Poisson', category: 'حيوانات' },
];

export default function Do80RunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Item status: { [itemId]: 'immediate' | 'delayed' | 'phonemic' | 'semantic' | 'neologism' | 'anomia' }
  const [itemResponses, setItemResponses] = useState(() => {
    const init = {};
    for (let i = 1; i <= 80; i++) {
      init[i] = i <= 65 ? 'immediate' : i <= 72 ? 'delayed' : i <= 76 ? 'phonemic' : 'semantic';
    }
    return init;
  });

  const [do80Result, setDo80Result] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeDo80();
  }, [itemResponses]);

  const fetchPatients = async () => {
    try {
      const resp = await patientApi.list({ per_page: 100 });
      const pts = resp.patients?.data || resp.patients || resp.data || [];
      setPatientsList(pts);
      if (pts.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pts[0].id);
      }
    } catch (e) {
      console.error('Failed to load patients:', e);
    }
  };

  const recomputeDo80 = async () => {
    let immediate = 0, delayed = 0, phonemic = 0, semantic = 0, neologisms = 0, lack = 0;
    for (let i = 1; i <= 80; i++) {
      const st = itemResponses[i] || 'immediate';
      if (st === 'immediate') immediate++;
      else if (st === 'delayed') delayed++;
      else if (st === 'phonemic') phonemic++;
      else if (st === 'semantic') semantic++;
      else if (st === 'neologism') neologisms++;
      else if (st === 'anomia') lack++;
    }

    try {
      const resp = await clinicalTestApi.runDo80({
        correct_immediate: immediate,
        correct_delayed: delayed,
        paraphasias_phonemic: phonemic,
        paraphasias_semantic: semantic,
        paraphasias_neologisms: neologisms,
        lack_of_word: lack,
      });
      setDo80Result(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('DO80 calculation error:', e);
    }
  };

  const setResponse = (type) => {
    const currentItemId = (currentIndex % 20) + 1;
    setItemResponses((prev) => ({
      ...prev,
      [currentItemId]: type,
    }));
    soundEngine.playTone(type === 'immediate' ? 650 : type === 'delayed' ? 520 : 350, 0.05);

    // Auto-advance to next item
    if (currentIndex < 79) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const currentItem = DO80_ITEMS[currentIndex % DO80_ITEMS.length];
  const currentItemRealId = currentIndex + 1;
  const currentStatus = itemResponses[currentItemRealId] || 'immediate';

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط فحص التسمية DO-80 بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'DO80',
        calculated_total_score: do80Result?.total_correct || 0,
        subscale_scores: {
          total_correct: { name: 'إجمالي التسميات الصحيحة', raw: `${do80Result?.total_correct} / 80 (${do80Result?.accuracy_pct}%)`, standard: do80Result?.total_correct },
          immediate_rate: { name: 'نسبة التسمية الفورية', raw: `${do80Result?.correct_immediate} / 80 (${do80Result?.immediate_pct}%)` },
          phonemic_errors: { name: 'أخطاء فونولوجية', raw: do80Result?.error_taxonomy?.phonemic?.count || 0 },
          semantic_errors: { name: 'أخطاء دلالية', raw: do80Result?.error_taxonomy?.semantic?.count || 0 },
          anomia_errors: { name: 'عجز استرجاع / صمت', raw: do80Result?.error_taxonomy?.lack_of_word?.count || 0 },
        },
        raw_responses: itemResponses,
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم DO-80');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-600/30">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                بطارية التسمية الشفهية للصور (DO-80 / MT-86 DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Deloche & Hannequin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              فحص التسمية الشفهية لـ 80 صورة معيارية، تصنيف البارافازيات الفونولوجية والدلالية وتشخيص الحبسة (Aphasie).
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!savedAssessment ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Patient Selector */}
          {!patientId ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300">
                <User className="w-4 h-4 text-cyan-400" />
                <span>المفحوص (Patient):</span>
              </div>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- اختر مريضاً من العيادة --</option>
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.phone || '--'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-2 space-x-reverse text-xs text-slate-300">
              <User className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">المريض:</span>
              <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
            </div>
          )}

          {/* REAL-TIME DO-80 PERFORMANCE BANNER */}
          {do80Result && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-cyan-950/30 to-slate-950 border border-cyan-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-cyan-600 text-white font-mono font-black text-3xl shadow-lg shadow-cyan-600/30">
                    {do80Result.total_correct} / 80
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">دقة التسمية الإجمالية:</span>
                    <strong className="text-base font-black text-cyan-300 block">
                      {do80Result.severity_label_ar}
                    </strong>
                    <span className="text-xs text-slate-400">
                      الدقة: <strong className="text-white font-mono">{do80Result.accuracy_pct}%</strong> | التسمية الفورية: <strong className="text-emerald-400 font-mono">{do80Result.correct_immediate} ({do80Result.immediate_pct}%)</strong>
                    </span>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <span className="text-slate-500 block text-[10px]">المعيار السليم:</span>
                  <span>الدرجة $\ge 74/80$</span>
                </div>
              </div>

              {/* Error Taxonomy Mini Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
                <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">أخطاء فونولوجية:</span>
                  <strong className="font-mono text-white text-sm">{do80Result.error_taxonomy?.phonemic?.count || 0}</strong>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">أخطاء دلالية:</span>
                  <strong className="font-mono text-amber-400 text-sm">{do80Result.error_taxonomy?.semantic?.count || 0}</strong>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ألفاظ مستحدثة:</span>
                  <strong className="font-mono text-purple-400 text-sm">{do80Result.error_taxonomy?.neologisms?.count || 0}</strong>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">عجز استرجاع:</span>
                  <strong className="font-mono text-rose-400 text-sm">{do80Result.error_taxonomy?.lack_of_word?.count || 0}</strong>
                </div>
              </div>
            </div>
          )}

          {/* PICTURE NAMING SLIDE VIEWER (CARD CAROUSEL) */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-5 shadow-xl text-center">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-xl bg-cyan-600 text-white font-mono font-black text-xs">
                صورة {currentItemRealId} / 80
              </span>

              <span className="text-xs font-bold text-slate-400">
                التصنيف: <strong className="text-white">{currentItem.category}</strong>
              </span>

              <div className="flex items-center space-x-1 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(79, prev + 1))}
                  disabled={currentIndex === 79}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stimulus Card Presentation */}
            <div className="py-6 px-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center space-y-3">
              <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
                <ImageIcon className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{currentItem.name_ar}</h3>
                <span className="text-sm text-slate-400 font-serif italic">{currentItem.name_fr}</span>
              </div>
            </div>

            {/* QUICK RESPONSE CLASSIFICATION BUTTONS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResponse('immediate')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 space-x-reverse ${
                  currentStatus === 'immediate'
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>✅ تسمية فورية سليمة (&le; 5ث)</span>
              </button>

              <button
                type="button"
                onClick={() => setResponse('delayed')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 space-x-reverse ${
                  currentStatus === 'delayed'
                    ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/30'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>⏱️ تسمية متأخرة (&gt; 5ث)</span>
              </button>

              <button
                type="button"
                onClick={() => setResponse('phonemic')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 space-x-reverse ${
                  currentStatus === 'phonemic'
                    ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>🔤 خطأ فونولوجي (Phonémique)</span>
              </button>

              <button
                type="button"
                onClick={() => setResponse('semantic')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 space-x-reverse ${
                  currentStatus === 'semantic'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>💡 خطأ دلالي (Sémantique)</span>
              </button>

              <button
                type="button"
                onClick={() => setResponse('neologism')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 space-x-reverse ${
                  currentStatus === 'neologism'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>🌀 رطانة / لفظ مستحدث</span>
              </button>

              <button
                type="button"
                onClick={() => setResponse('anomia')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center space-x-1.5 space-x-reverse ${
                  currentStatus === 'anomia'
                    ? 'bg-red-700 border-red-600 text-white shadow-lg shadow-red-700/30'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>❌ عجز استرجاع / صمت</span>
              </button>
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتشخيص الأرطوفوني (Synthèse DO-80):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const fresh = {};
                for (let i = 1; i <= 80; i++) fresh[i] = 'immediate';
                setItemResponses(fresh);
                setCurrentIndex(0);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين الفحص</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-xl shadow-cyan-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج التسمية...' : 'اعتماد فحص التسمية DO-80 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-500/30 mx-auto flex items-center justify-center text-cyan-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق نتائج بطارية التسمية DO-80 بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم حفظ دقة التسمية وتصنيف البارافازيات وتوليد التقرير الأرطوفوني.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">الدرجة الإجمالية:</span>
              <strong className="text-cyan-400 text-base font-black font-mono">
                {do80Result?.total_correct} / 80
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التصنيف:</span>
              <span className="text-white font-bold">{do80Result?.severity_label_ar}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الدقة:</span>
              <span className="text-emerald-400 font-mono font-bold">{do80Result?.accuracy_pct}%</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={clinicalTestApi.bilanPdfUrl(savedAssessment.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 space-x-reverse transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>📄 إدراج النتيجة في تقرير الحصيلة السريرية (Bilan PDF A4) 🖨️</span>
            </a>

            <button
              type="button"
              onClick={() => setSavedAssessment(null)}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center space-x-1.5 space-x-reverse transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تطبيق فحص جديد</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
