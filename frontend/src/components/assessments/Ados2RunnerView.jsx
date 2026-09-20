import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
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
  ShieldAlert, 
  Gauge, 
  Layers, 
  Eye,
  Sliders,
  Check
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

const ADOS_MODULES = [
  { id: 'toddler', nameAr: 'وحدة الرضع (Toddler: 12-30 شهراً)', desc: 'للأطفال الصغار ذوي الكلمات المفردة أو بدون كلام' },
  { id: 'module_1', nameAr: 'الوحدة 1 (Module 1: ما قبل اللفظي)', desc: 'للأطفال بعمر 31 شهراً فما فوق بدون لغة أو بكلمات مفردة' },
  { id: 'module_2', nameAr: 'الوحدة 2 (Module 2: جمل بسيطة)', desc: 'للأطفال من أي سن يستعملون عبارات مركبة غير طليقة' },
  { id: 'module_3', nameAr: 'الوحدة 3 (Module 3: طلاقة لفظية أطفال)', desc: 'للأطفال والمراهقين ذوي طلاقة لغوية تعبيرية تامة' },
  { id: 'module_4', nameAr: 'الوحدة 4 (Module 4: طلاقة راشدين)', desc: 'للمراهقين الأكبر سناً والبالغين ذوي الطلاقة اللغوية' },
];

const ADOS_OBSERVATION_ITEMS = [
  // Social Affect (SA)
  { id: 'sa_eye_contact', domain: 'SA', nameAr: '1. التواصل البصري غير المعتاد (Contact visuel)', desc: 'مرونة وتناغم النظرات مع الإيماءات والحديث' },
  { id: 'sa_facial_expressions', domain: 'SA', nameAr: '2. تعابير الوجه الموجهة للآخرين (Expressions faciales)', desc: 'توجيه الابتسامات والانفعالات للمشاركة الوجدانية' },
  { id: 'sa_shared_enjoyment', domain: 'SA', nameAr: '3. الاستمتاع المشترك في التفاعل (Plaisir partagé)', desc: 'إظهار السرور والمشاركة العاطفية المتبادلة' },
  { id: 'sa_pointing', domain: 'SA', nameAr: '4. الإشارة بالأصبع لإبداء الاهتمام (Pointage)', desc: 'الإشارة بغرض المشاركة (Proto-déclaratif) وليس للطلب فقط' },
  { id: 'sa_gestures', domain: 'SA', nameAr: '5. الإيماءات التعبيرية والوصفية (Gestes descriptifs)', desc: 'استخدام إيماءات الجسد واليدين لتعزيز الكلام' },
  { id: 'sa_conversation', domain: 'SA', nameAr: '6. التبادل الحواري والأخذ والرد (Conversation)', desc: 'القدرة على الحفاظ على حوار مرن ومتبادل' },
  { id: 'sa_empathy', domain: 'SA', nameAr: '7. إظهار التعاطف وفهم مشاعر الآخرين (Empathie)', desc: 'الاستجابة لضيق أو مشاعر الفاحص والآخرين' },
  
  // Restricted & Repetitive Behaviors (RRB)
  { id: 'rrb_stereotyped_speech', domain: 'RRB', nameAr: '8. الاستخدام النمطي والتكراري للغة (Langage stéréotypé)', desc: 'المصاداة (Écholalie)، التكرار الحرفي والتنغيم الغريب' },
  { id: 'rrb_sensory_interests', domain: 'RRB', nameAr: '9. الاهتمامات الحسية غير المألوفة (Intérêts sensoriels)', desc: 'شم، تلمس، أو التحديق في حركة دوران الأشياء' },
  { id: 'rrb_hand_mannerisms', domain: 'RRB', nameAr: '10. حركات اليدين والأصابع النمطية (Maniérismes)', desc: 'رفرفة اليدين، ثني الأصابع، أو حركات الجذع المعقدة' },
  { id: 'rrb_compulsions', domain: 'RRB', nameAr: '11. الطقوس والروتينات القهرية (Rituels / Compulsions)', desc: 'الإصرار على التماثل ومقاومة التغيير الطفيف في النشاط' },
];

export default function Ados2RunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [selectedModule, setSelectedModule] = useState('module_3');
  
  // Item ratings: { [itemId]: 0 | 1 | 2 | 3 }
  const [itemRatings, setItemRatings] = useState(() => {
    const init = {};
    ADOS_OBSERVATION_ITEMS.forEach((it) => { init[it.id] = 1; });
    return init;
  });

  const [adosResult, setAdosResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeAdos();
  }, [itemRatings, selectedModule]);

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

  const calculateDomainScores = () => {
    let sa = 0;
    let rrb = 0;
    ADOS_OBSERVATION_ITEMS.forEach((it) => {
      const raw = itemRatings[it.id] || 0;
      // In standard ADOS scoring algorithm, rating 3 is converted to 2
      const algoScore = raw === 3 ? 2 : raw;
      if (it.domain === 'SA') sa += algoScore;
      else rrb += algoScore;
    });
    return { sa, rrb };
  };

  const recomputeAdos = async () => {
    const { sa, rrb } = calculateDomainScores();
    try {
      const resp = await clinicalTestApi.runAdos2({
        module: selectedModule,
        social_affect_score: sa,
        rrb_score: rrb,
      });
      setAdosResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('ADOS-2 calculation error:', e);
    }
  };

  const setItemRating = (itemId, score) => {
    setItemRatings((prev) => ({ ...prev, [itemId]: score }));
    soundEngine.playTone(400 + score * 80, 0.04);
  };

  const setPreset = (type) => {
    const next = {};
    if (type === 'autism_high') {
      ADOS_OBSERVATION_ITEMS.forEach((it) => { next[it.id] = 2; });
    } else if (type === 'spectrum') {
      ADOS_OBSERVATION_ITEMS.forEach((it, i) => { next[it.id] = i % 2 === 0 ? 1 : 2; });
    } else if (type === 'non_spectrum') {
      ADOS_OBSERVATION_ITEMS.forEach((it) => { next[it.id] = 0; });
    }
    setItemRatings(next);
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط فحص ADOS-2 التشخيصي بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const { sa, rrb } = calculateDomainScores();
      const payload = {
        test_code: 'ADOS_2',
        calculated_total_score: adosResult?.total_algorithm_score || 0,
        subscale_scores: {
          total_algorithm: { name: 'المجموع الخوارزمي الإجمالي (SA + RRB)', raw: `${adosResult?.total_algorithm_score}`, standard: `CSS=${adosResult?.comparison_score_css}/10`, interpretation: adosResult?.classification_ar },
          social_affect: { name: 'التأثير الاجتماعي (SA)', raw: sa },
          rrb_score: { name: 'السلوكيات النمطية المقيدة (RRB)', raw: rrb },
          module: { name: 'الوحدة المطبقة', raw: selectedModule },
          severity_level: { name: 'مستوى حدة الأعراض', raw: adosResult?.severity_label_ar },
        },
        raw_responses: { ratings: itemRatings, module: selectedModule },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم ADOS-2');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-rose-600/30">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                جدول الملاحظة التشخيصية للتوحد (ADOS-2 DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20">
                Lord, Rutter, DiLavore
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              المعيار الذهبي للملاحظة الإكلينيكية المباشرة (Social Affect & RRB)، درجة المقارنة المعيارية (CSS 1-10) والتصنيف التشخيصي.
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
          {/* Patient Selector & Module Switcher */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {!patientId ? (
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300">
                <User className="w-4 h-4 text-rose-400" />
                <span>المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- اختر طفلاً من العيادة --</option>
                  {patientsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.phone || '--'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-300">
                <User className="w-4 h-4 text-rose-400" />
                <span className="font-bold">المريض:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Demo Presets */}
            <div className="flex items-center space-x-1.5 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setPreset('non_spectrum')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
              >
                خارج الطيف (0)
              </button>
              <button
                type="button"
                onClick={() => setPreset('spectrum')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30"
              >
                طيف التوحد (Modéré)
              </button>
              <button
                type="button"
                onClick={() => setPreset('autism_high')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/30"
              >
                توحد مؤكد (Sévère)
              </button>
            </div>
          </div>

          {/* MODULE SELECTOR TABS */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>اختيار وحدة الملاحظة التشخيصية المناسبة لمستوى الطلاقة اللغوية:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ADOS_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setSelectedModule(mod.id)}
                  className={`p-3 rounded-2xl text-right transition-all border ${
                    selectedModule === mod.id
                      ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span className="text-xs font-bold block">{mod.nameAr}</span>
                  <span className="text-[10px] text-slate-300/80 block mt-1 leading-tight">{mod.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* REAL-TIME ADOS-2 DIAGNOSTIC SCORE & COMPARISON CSS HERO BANNER */}
          {adosResult && (
            <div className={`p-5 rounded-3xl border space-y-4 shadow-xl transition-all ${
              adosResult.classification === 'autism'
                ? 'bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950 border-rose-500/50 shadow-rose-500/10'
                : adosResult.classification === 'autism_spectrum'
                ? 'bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border-amber-500/40'
                : 'bg-gradient-to-r from-slate-950 via-emerald-950/30 to-slate-950 border-emerald-500/30'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className={`px-5 py-2.5 rounded-2xl font-mono font-black text-3xl shadow-lg ${
                    adosResult.classification === 'autism'
                      ? 'bg-rose-600 text-white shadow-rose-600/30'
                      : adosResult.classification === 'autism_spectrum'
                      ? 'bg-amber-600 text-white shadow-amber-600/30'
                      : 'bg-emerald-600 text-white shadow-emerald-600/30'
                  }`}>
                    {adosResult.total_algorithm_score} نقطة
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">التصنيف التشخيصي المعتمد:</span>
                    <strong className="text-base font-black text-white block">
                      {adosResult.classification_ar}
                    </strong>
                    <span className="text-xs text-slate-400">
                      التأثير الاجتماعي SA: <strong className="text-rose-400 font-mono font-bold">{adosResult.social_affect_score}</strong> | السلوكيات النمطية RRB: <strong className="text-amber-400 font-mono font-bold">{adosResult.rrb_score}</strong>
                    </span>
                  </div>
                </div>

                {/* Calibrated Comparison Score Gauge (CSS 1-10) */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3 space-x-reverse">
                  <Gauge className="w-6 h-6 text-rose-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">درجة المقارنة المعيارية (CSS):</span>
                    <div className="text-lg font-black font-mono text-white">
                      CSS {adosResult.comparison_score_css} / 10
                    </div>
                    <span className="text-[10px] text-rose-300 font-semibold">{adosResult.severity_label_ar}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OBSERVATIONAL BEHAVIORAL ITEMS GRID */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-300 flex items-center space-x-1.5 space-x-reverse">
              <Eye className="w-4 h-4 text-rose-400" />
              <span>بنود الملاحظة السلوكية المباشرة (0: سليم | 1: طفيف | 2: دال | 3: شذوذ حاد):</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {ADOS_OBSERVATION_ITEMS.map((item) => {
                const currentRating = itemRatings[item.id] || 0;
                const isSA = item.domain === 'SA';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-1.5 space-x-reverse">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                            isSA ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {isSA ? 'تأثير اجتماعي (SA)' : 'سلوك نمطي (RRB)'}
                          </span>
                          <span className="text-xs font-bold text-white">{item.nameAr}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                      </div>
                    </div>

                    {/* 4-Point Rating Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { score: 0, label: '0: طبيعي' },
                        { score: 1, label: '1: غير نمطي طفيف' },
                        { score: 2, label: '2: مؤشر دال' },
                        { score: 3, label: '3: شديد' },
                      ].map((btn) => (
                        <button
                          key={btn.score}
                          type="button"
                          onClick={() => setItemRating(item.id, btn.score)}
                          className={`py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                            currentRating === btn.score
                              ? btn.score >= 2
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                : btn.score === 1
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير التشخيصي لـ ADOS-2:</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-rose-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPreset('non_spectrum')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط الملاحظات</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs shadow-xl shadow-rose-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج ADOS-2...' : 'اعتماد تقرير فحص ADOS-2 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 mx-auto flex items-center justify-center text-rose-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق نتائج جدول الملاحظة ADOS-2 بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل المجموع الخوارزمي ودرجة المقارنة CSS ومستوى حدة الأعراض بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">المجموع الخوارزمي:</span>
              <strong className="text-rose-400 text-base font-black font-mono">
                {adosResult?.total_algorithm_score} نقطة
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التصنيف التشخيصي:</span>
              <strong className="text-white font-bold">{adosResult?.classification_ar}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">درجة المقارنة:</span>
              <span className="text-amber-400 font-mono font-bold">CSS {adosResult?.comparison_score_css}/10</span>
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
