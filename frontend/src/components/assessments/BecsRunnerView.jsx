import React, { useState, useEffect } from 'react';
import { 
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
  Baby, 
  Layers, 
  TrendingUp, 
  Check, 
  Radar as RadarIcon, 
  Sliders
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

const BECS_COGNITIVE_SCALES = [
  { key: 'object_permanence', nameAr: '1. دوام واستمرارية بقاء الموضوع (Permanence de l\'objet)', desc: 'البحث عن الألعاب المخفية وراء الحواجز المتعددة' },
  { key: 'spatial_relations', nameAr: '2. إدراك العلاقات المكانية (Relations spatiales)', desc: 'تركيب العلب، تدوير الأشياء، وإدراك الفضاء المحيط' },
  { key: 'means_ends', nameAr: '3. الوسائل والغايات واستخدام الأدوات (Moyens-buts)', desc: 'استعمال خيط أو عصا لجلب لعبة بعيدة عن متناول اليد' },
  { key: 'causality', nameAr: '4. السببية الإجرائية والعملياتية (Causalité)', desc: 'إدراك الآلية المسببة لحركة الأشياء والألعاب الآلية' },
  { key: 'vocal_imitation', nameAr: '5. التقليد الصوتي المعرفي (Imitation vocale)', desc: 'تقليد الأصوات والنغمات المألوفة والجديدة' },
  { key: 'gestural_imitation', nameAr: '6. التقليد الحركي الإجرائي (Imitation gestuelle)', desc: 'تقليد الحركات البسيطة والمركبة المرئية وغير المرئية' },
  { key: 'action_schemes', nameAr: '7. المخططات الإجرائية للأفعال (Schèmes d\'action)', desc: 'تطبيق مخططات حركية ملائمة لوظيفة الشيء' },
];

const BECS_SOCIO_EMOTIONAL_SCALES = [
  { key: 'joint_attention', nameAr: '8. الانتباه المشترك (Attention conjointe)', desc: 'متابعة نظرات وإيماءات الفاحص وتوجيه انتباهه' },
  { key: 'affect_regulation', nameAr: '9. التنظيم الانفعالي والوجداني (Régulation affective)', desc: 'التحكم في التوتر وتهدئة الذات في المواقف التفاعلية' },
  { key: 'social_interaction', nameAr: '10. التفاعل الاجتماعي التبادلي (Interaction sociale)', desc: 'المبادرة والاستجابة في ألعاب التفاعل المتبادل' },
  { key: 'social_imitation', nameAr: '11. التقليد الاجتماعي الوجداني (Imitation sociale)', desc: 'محاكاة التعابير الانفعالية والحركات الرمزية للآخرين' },
  { key: 'gestural_comm', nameAr: '12. التواصل الإيمائي (Communication gestuelle)', desc: 'استخدام الإشارات والإيماءات لطلب المساعدة أو المشاركة' },
  { key: 'vocal_comm', nameAr: '13. التواصل الصوتي التعبيري (Communication vocale)', desc: 'إصدار أصوات ومناغاة موجهة لأشخاص للتعبير عن الرغبات' },
  { key: 'emotions', nameAr: '14. التعبير عن الانفعالات وتمييزها (Émotions)', desc: 'إظهار الفرح، الخوف، الغضب، وتمييز مشاعر الفاحص' },
  { key: 'symbolic_play', nameAr: '15. اللعب الإيهامي والرمزي (Jeu symbolique)', desc: 'إطعام الدمية، التظاهر بالشرب، واستخدام الرموز' },
  { key: 'self_image', nameAr: '16. إدراك صورة الذات والمخطط الجسدي (Image de soi)', desc: 'التعرف على انعكاس صورته في المرآة واستكشاف أطرافه' },
];

const LEVEL_DESCRIPTIONS = [
  { level: 1, age: '4 أشهر', label: 'المستوى 1 (4 أشهر): مرحلة الأفعال الانعكاسية والمخططات الأولية' },
  { level: 2, age: '8 أشهر', label: 'المستوى 2 (8 أشهر): التنسيق الحركي البصري والتفاعل التكراري' },
  { level: 3, age: '12 شهراً', label: 'المستوى 3 (12 شهراً): التمايز بين الوسائل والغايات والبدايات الرمزية' },
  { level: 4, age: '18 شهراً', label: 'المستوى 4 (18 شهراً): الاكتشاف التجريبي والانتباه المشترك' },
  { level: 5, age: '24 شهراً', label: 'المستوى 5 (24 شهراً): التمثيل الذهني التام واللعب الإيهامي' },
];

export default function BecsRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [chronoAgeMonths, setChronoAgeMonths] = useState(18);
  
  // 7 Cognitive Scales (Levels 1 to 5)
  const [cogLevels, setCogLevels] = useState({
    object_permanence: 4,
    spatial_relations: 4,
    means_ends: 3,
    causality: 4,
    vocal_imitation: 3,
    gestural_imitation: 4,
    action_schemes: 4,
  });

  // 9 Socio-Emotional Scales (Levels 1 to 5)
  const [socioLevels, setSocioLevels] = useState({
    joint_attention: 3,
    affect_regulation: 3,
    social_interaction: 3,
    social_imitation: 3,
    gestural_comm: 3,
    vocal_comm: 3,
    emotions: 3,
    symbolic_play: 2,
    self_image: 3,
  });

  const [becsResult, setBecsResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeBecs();
  }, [cogLevels, socioLevels, chronoAgeMonths]);

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

  const recomputeBecs = async () => {
    try {
      const resp = await clinicalTestApi.runBecs({
        cognitive_levels: cogLevels,
        socio_emotional_levels: socioLevels,
        chronological_age_months: chronoAgeMonths,
      });
      setBecsResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('BECS calculation error:', e);
    }
  };

  const setCogLevel = (key, lvl) => {
    setCogLevels((prev) => ({ ...prev, [key]: lvl }));
    soundEngine.playTone(450 + lvl * 70, 0.04);
  };

  const setSocioLevel = (key, lvl) => {
    setSocioLevels((prev) => ({ ...prev, [key]: lvl }));
    soundEngine.playTone(450 + lvl * 70, 0.04);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار طفل لربط بطارية BECS النمائية بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'BECS',
        calculated_total_score: becsResult?.developmental_quotient_dq || 100,
        subscale_scores: {
          global_dev_age: { name: 'العمر النمائي العام', raw: `${becsResult?.global_developmental_age_months} شهراً` },
          dq: { name: 'حاصل التطور النمائي (DQ)', raw: `${becsResult?.developmental_quotient_dq}%` },
          cog_dev_age: { name: 'العمر النمائي المعرفي', raw: `${becsResult?.cognitive_developmental_age_months} شهراً` },
          socio_dev_age: { name: 'العمر النمائي الانفعالي الاجتماعي', raw: `${becsResult?.socio_emotional_developmental_age_months} شهراً` },
          discrepancy: { name: 'الفارق بين المسارين', raw: `${becsResult?.discrepancy_months} أشهر`, interpretation: becsResult?.discrepancy_note },
        },
        raw_responses: { cogLevels, socioLevels, chronoAgeMonths },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم BECS');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-600 flex items-center justify-center text-white font-black shadow-lg shadow-rose-600/30">
            <Baby className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                بطارية التقييم المعرفي والانفعالي الاجتماعي للطفولة المبكرة (BECS DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20">
                Jean-Louis Adrien
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              16 مقياساً نمائياً (4 إلى 24 شهراً) لتقييم المسار المعرفي والانفعالي الاجتماعي وحساب حاصل التطور DQ.
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
          {/* Patient Selector & Chronological Age Input */}
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

            {/* Chronological Age in Months */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <span className="text-slate-400 font-bold">السن الزمني للطفل (بالأشهر):</span>
              <input
                type="number"
                min="4"
                max="48"
                value={chronoAgeMonths}
                onChange={(e) => setChronoAgeMonths(Number(e.target.value))}
                className="w-20 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-white text-center font-bold font-mono"
              />
            </div>
          </div>

          {/* REAL-TIME BECS DEVELOPMENTAL QUOTIENT HERO BANNER */}
          {becsResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-rose-950/30 to-slate-950 border border-rose-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white font-mono font-black text-2xl shadow-lg shadow-rose-600/30">
                    DQ = {becsResult.developmental_quotient_dq}%
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">العمر النمائي العام (Âge de Développement Global):</span>
                    <strong className="text-base font-black text-white block">
                      {becsResult.global_developmental_age_months} شهراً (السن الزمني: {becsResult.chronological_age_months} شهراً)
                    </strong>
                    <span className="text-xs text-slate-400">
                      الفارق النمائي: <strong className="text-amber-400 font-mono font-bold">{becsResult.discrepancy_months} أشهر</strong> ({becsResult.discrepancy_note})
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">العمر المعرفي:</span>
                    <span className="text-rose-400 font-mono font-bold text-xs">{becsResult.cognitive_developmental_age_months} شهراً</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">الانفعالي الاجتماعي:</span>
                    <span className="text-amber-400 font-mono font-bold text-xs">{becsResult.socio_emotional_developmental_age_months} شهراً</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 16 DEVELOPMENTAL SCALES IN 2 DOMAINS */}
          <div className="space-y-6">
            {/* DOMAIN 1: 7 COGNITIVE SCALES */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-rose-400 border-b border-slate-800/80 pb-2">
                1. المجالات المعرفية والإجرائية (7 مقاييس فرعية - Domaine Cognitif):
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {BECS_COGNITIVE_SCALES.map((sc) => {
                  const currentLevel = cogLevels[sc.key] || 3;
                  return (
                    <div key={sc.key} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-white block">{sc.nameAr}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{sc.desc}</span>
                        </div>
                        <span className="font-mono text-rose-300 font-black text-xs px-2.5 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 shrink-0">
                          المستوى {currentLevel}
                        </span>
                      </div>

                      {/* 5 Level Pill Buttons */}
                      <div className="grid grid-cols-5 gap-1 pt-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setCogLevel(sc.key, lvl)}
                            className={`py-1 rounded-xl text-[10px] font-bold transition-all ${
                              currentLevel === lvl
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                            }`}
                          >
                            N{lvl} ({[4, 8, 12, 18, 24][lvl-1]}m)
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DOMAIN 2: 9 SOCIO-EMOTIONAL SCALES */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-amber-400 border-b border-slate-800/80 pb-2">
                2. المجالات الانفعالية والاجتماعية والتواصلية (9 مقاييس فرعية - Domaine Socio-émotionnel):
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {BECS_SOCIO_EMOTIONAL_SCALES.map((sc) => {
                  const currentLevel = socioLevels[sc.key] || 3;
                  return (
                    <div key={sc.key} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-white block">{sc.nameAr}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{sc.desc}</span>
                        </div>
                        <span className="font-mono text-amber-300 font-black text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
                          المستوى {currentLevel}
                        </span>
                      </div>

                      {/* 5 Level Pill Buttons */}
                      <div className="grid grid-cols-5 gap-1 pt-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setSocioLevel(sc.key, lvl)}
                            className={`py-1 rounded-xl text-[10px] font-bold transition-all ${
                              currentLevel === lvl
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                            }`}
                          >
                            N{lvl} ({[4, 8, 12, 18, 24][lvl-1]}m)
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير النمائي لبطارية BECS:</span>
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
              onClick={() => {
                const initCog = {}; BECS_COGNITIVE_SCALES.forEach((s) => { initCog[s.key] = 4; });
                const initSocio = {}; BECS_SOCIO_EMOTIONAL_SCALES.forEach((s) => { initSocio[s.key] = 4; });
                setCogLevels(initCog); setSocioLevels(initSocio);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للمستوى 4 (18 شهراً)</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs shadow-xl shadow-rose-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج BECS...' : 'اعتماد تقرير فحص بطارية BECS 💾'}</span>
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
              تم توثيق نتائج بطارية BECS النمائية بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم حساب العمر النمائي العام وحاصل التطور DQ وتوثيق المسار المعرفي والانفعالي الاجتماعي.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">العمر النمائي:</span>
              <strong className="text-rose-400 text-base font-black font-mono">
                {becsResult?.global_developmental_age_months} شهراً
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">حاصل التطور DQ:</span>
              <strong className="text-amber-400 text-base font-black font-mono">
                {becsResult?.developmental_quotient_dq}%
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التاريخ:</span>
              <span className="text-white font-mono">{new Date().toLocaleDateString('ar-DZ')}</span>
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
