import React, { useState, useEffect } from 'react';
import { 
  Palette, 
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
  Layers, 
  Shield, 
  Eye, 
  ChevronRight, 
  ChevronLeft,
  Flame,
  Zap,
  Check,
  Clock
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

// Standard 10 Plates of Children's Apperception Test (CAT - Bellak)
const CAT_PLATES = [
  { id: 1, title_ar: 'اللوحة 1: كتاكيت حول مائدة الطعام مع دجاجة', title_fr: 'Planche 1: Poussins autour d\'une table', latent_ar: 'التغذية، الإشباع الفمي، التنافس الأخوي حول الرعاية الوالدية' },
  { id: 2, title_ar: 'اللوحة 2: لعبة شد الحبل بين الدببة', title_fr: 'Planche 2: Ours tirant sur une corde', latent_ar: 'العدوانية، الصراع والمواجهة، التعاون والتحالف الأسري' },
  { id: 3, title_ar: 'اللوحة 3: الأسد مع الغليون وعصا المشي', title_fr: 'Planche 3: Lion avec pipe et canne', latent_ar: 'السلطة الأبوية، رمزية القوة والهيبة، قلق الخصاء' },
  { id: 4, title_ar: 'اللوحة 4: الكنغر مع الصغير في الجراب ودراجة', title_fr: 'Planche 4: Kangourou avec petit dans la poche', latent_ar: 'العلاقة بالأم، الحمل والولادة، التنافس مع المولود الجديد' },
  { id: 5, title_ar: 'اللوحة 5: غرفة مظلمة بسرير كبير وسرير أطفال', title_fr: 'Planche 5: Chambre sombre avec berceau', latent_ar: 'المشهد البدائي (Scène primitive)، الفضول الجنسي، الخوف الليلي' },
  { id: 6, title_ar: 'اللوحة 6: مغارة مظلمة بداخلها دبان نائمان', title_fr: 'Planche 6: Grotte sombre avec ours', latent_ar: 'المشهد البدائي، الغيرة، الدفء والاحتواء الوالدي' },
  { id: 7, title_ar: 'اللوحة 7: النمر يهاجم القرد', title_fr: 'Planche 7: Tigre bondissant sur un singe', latent_ar: 'العدوانية الصريحة، الخوف من العقاب، آليات الإسقاط والهروب' },
  { id: 8, title_ar: 'اللوحة 8: جلسة عائلية للقرود وشرب الشاي', title_fr: 'Planche 8: Singes prenant le thé', latent_ar: 'المكانة داخل النسق الأسري، التنشئة والمحظورات الاجتماعية' },
  { id: 9, title_ar: 'اللوحة 9: غرفة مظلمة يُنظر إليها من خلال باب مفتوح', title_fr: 'Planche 9: Chambre vue par porte ouverte', latent_ar: 'قلق الانفصال، الشعور بالوحدة، الهجران والمخاوف المجهولة' },
  { id: 10, title_ar: 'اللوحة 10: كلب صغير في الحمام يتعرض للتأديب', title_fr: 'Planche 10: Chiot puni dans les toilettes', latent_ar: 'النظافة والتدريب الإخراجي، الذنب والعقاب، الصراع مع الأنا الأعلى' },
];

const DEFENSE_MECHANISMS = [
  { id: 'refoulement', labelAr: 'الكبت (Refoulement)', desc: 'إبعاد الأفكار والدوافع المؤلمة عن الوعي' },
  { id: 'projection', labelAr: 'الإسقاط (Projection)', desc: 'نسب النزوات والمشاعر غير المقبولة للآخرين' },
  { id: 'deni', labelAr: 'الإنكار (Déni)', desc: 'رفض الاعتراف بالواقع المؤلم أو المهدد' },
  { id: 'regression', labelAr: 'النكوص (Régression)', desc: 'العودة إلى أنماط سلوكية نمائية سابقة' },
  { id: 'clivage', labelAr: 'الانشطار (Clivage)', desc: 'تقسيم الذات أو الموضوع إلى طيب مطلق وشرير مطلق' },
  { id: 'rationalisation', labelAr: 'العقلنة (Rationalisation)', desc: 'تقديم تبريرات منطقية لإخفاء الدوافع الانفعالية' },
  { id: 'deplacement', labelAr: 'الإزاحة (Déplacement)', desc: 'تحويل الانفعال من موضوع أصلي خطير لموضوع بديل آمن' },
  { id: 'formation_reactionnelle', labelAr: 'التكوين العكسي (Formation Réactionnelle)', desc: 'تبني سلوك مضاد تماماً للدافع الحقيقي' },
  { id: 'sublimation', labelAr: 'التسامي والإعلاء (Sublimation)', desc: 'توجيه النزوات نحو أنشطة مقبولة اجتماعياً وإبداعياً' },
  { id: 'identification_agresseur', labelAr: 'التماهي مع المعتدي (Id. Agresseur)', desc: 'تقمص صفات وسلوك مصدر التهديد للسيطرة على القلق' },
];

const ANXIETY_INDICATORS = [
  { id: 'angoisse_separation', labelAr: 'قلق الانفصال والفقدان (Séparation)' },
  { id: 'angoisse_castration', labelAr: 'قلق الخصاء وفقدان القدرة (Castration)' },
  { id: 'conflit_oedipien', labelAr: 'الصراع الأوديبي والتنافسية (Œdipe)' },
  { id: 'rivalite_fraternelle', labelAr: 'الغيرة والتنافس الأخوي (Rivalité)' },
  { id: 'dependance_orale', labelAr: 'الاعتمادية والحرمان الفمي (Orale)' },
  { id: 'perte_objet', labelAr: 'الخوف من فقدان حب الموضوع (Perte d\'objet)' },
];

export default function ProjectiveGridRunnerView({ 
  testCode = 'CAT', 
  patientId = null, 
  patientName = null, 
  onClose = null, 
  onSaved = null 
}) {
  const [currentPlateIndex, setCurrentPlateIndex] = useState(0);
  const [plateNarratives, setPlateNarratives] = useState({});
  const [reactionTimes, setReactionTimes] = useState({});
  
  // Clinical Analysis Tags
  const [selectedDefenses, setSelectedDefenses] = useState(['projection', 'refoulement']);
  const [selectedAnxieties, setSelectedAnxieties] = useState(['angoisse_separation', 'rivalite_fraternelle']);
  const [egoStrength, setEgoStrength] = useState(3);
  const [clinicalObservations, setClinicalObservations] = useState('أظهر الطفل في سرده تفاعلاً إسقاطياً واضحاً مع تماسك لفظي ملائم.');

  const [projectiveResult, setProjectiveResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeProjective();
  }, [selectedDefenses, selectedAnxieties, egoStrength, clinicalObservations, plateNarratives]);

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

  const recomputeProjective = async () => {
    try {
      const platesArray = CAT_PLATES.map((p) => ({
        plate_number: p.id,
        title: p.title_ar,
        narrative: plateNarratives[p.id] || '',
        reaction_time: reactionTimes[p.id] || 0,
      }));

      const resp = await clinicalTestApi.runProjectiveGrid({
        test_code: testCode,
        plates: platesArray,
        defense_mechanisms: selectedDefenses,
        anxiety_indicators: selectedAnxieties,
        ego_strength: egoStrength,
        clinical_observations: clinicalObservations,
      });

      setProjectiveResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('Projective calculation error:', e);
    }
  };

  const toggleDefense = (defId) => {
    setSelectedDefenses((prev) => {
      const next = prev.includes(defId) ? prev.filter((d) => d !== defId) : [...prev, defId];
      return next;
    });
    soundEngine.playTone(500, 0.04);
  };

  const toggleAnxiety = (anxId) => {
    setSelectedAnxieties((prev) => {
      const next = prev.includes(anxId) ? prev.filter((a) => a !== anxId) : [...prev, anxId];
      return next;
    });
    soundEngine.playTone(450, 0.04);
  };

  const currentPlate = CAT_PLATES[currentPlateIndex];

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مفحوص لربط التحليل الإسقاطي بملفه العيادي');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: testCode || 'CAT',
        calculated_total_score: egoStrength * 20,
        subscale_scores: {
          ego_strength: { name: 'قوة وتماسك الأنا', raw: `${egoStrength} / 5`, interpretation: projectiveResult?.ego_strength_label },
          defenses_count: { name: 'الآليات الدفاعية المسجلة', raw: selectedDefenses.length },
          anxiety_markers: { name: 'مؤشرات القلق المركزي', raw: selectedAnxieties.length },
        },
        raw_responses: {
          narratives: plateNarratives,
          reaction_times: reactionTimes,
          defense_mechanisms: selectedDefenses,
          anxiety_indicators: selectedAnxieties,
          ego_strength: egoStrength,
        },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ التحليل الإسقاطي');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-pink-600/30">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                شبكة التحليل الإسقاطي الدينامي (Grille Projective CAT / FAT DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20">
                Bellak Psychodynamics
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              توثيق سرد اللوحات الـ 10، ترميز الآليات الدفاعية النفسية (Mécanismes de défense)، وأنماط القلق والصراع.
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
                <User className="w-4 h-4 text-pink-400" />
                <span>المفحوص (Patient):</span>
              </div>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-pink-500"
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
              <User className="w-4 h-4 text-pink-400" />
              <span className="font-bold">المريض:</span>
              <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
            </div>
          )}

          {/* PLATE SELECTOR CAROUSEL & NARRATIVE RECORDER */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="px-3 py-1 rounded-xl bg-pink-600 text-white font-mono font-black text-xs shadow-md shadow-pink-600/30">
                  لوحة {currentPlate.id} / 10
                </span>
                <h4 className="text-xs font-black text-white">{currentPlate.title_ar}</h4>
              </div>

              <div className="flex items-center space-x-1 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setCurrentPlateIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentPlateIndex === 0}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPlateIndex((prev) => Math.min(CAT_PLATES.length - 1, prev + 1))}
                  disabled={currentPlateIndex === CAT_PLATES.length - 1}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Latent Theme Guide */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-xs flex items-center space-x-2 space-x-reverse">
              <Eye className="w-4 h-4 text-pink-400 shrink-0" />
              <div>
                <span className="text-slate-400 font-bold">المحتوى الكامن النموذجي: </span>
                <span className="text-pink-300 font-medium">{currentPlate.latent_ar}</span>
              </div>
            </div>

            {/* Narrative Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>سرد واستجابة الطفل للوحة (Récit de l'enfant):</span>
                <span className="text-[10px] text-slate-500 font-mono">سجل النص الحرفي والتعليقات</span>
              </label>
              <textarea
                rows="3"
                placeholder="اكتب هنا القصة التي رواها الطفل استجابة لهذه اللوحة مع أي تنهدات أو صمت..."
                value={plateNarratives[currentPlate.id] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlateNarratives((prev) => ({ ...prev, [currentPlate.id]: val }));
                }}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-pink-500 leading-relaxed"
              />
            </div>
          </div>

          {/* PSYCHODYNAMIC CODING MATRIX (DEFENSE MECHANISMS & ANXIETIES) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Defense Mechanisms Checklist */}
            <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800/80 pb-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-black text-white">الآليات الدفاعية النفسية المرصودة (Mécanismes de défense):</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEFENSE_MECHANISMS.map((def) => {
                  const isSelected = selectedDefenses.includes(def.id);
                  return (
                    <button
                      key={def.id}
                      type="button"
                      onClick={() => toggleDefense(def.id)}
                      className={`p-2.5 rounded-2xl text-right transition-all flex items-start space-x-2 space-x-reverse border ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                          : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-lg mt-0.5 flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-500 text-white' : 'border border-slate-700 bg-slate-950'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{def.labelAr}</span>
                        <span className="text-[10px] text-slate-400 block">{def.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Anxieties & Ego Strength */}
            <div className="space-y-4">
              {/* Anxiety Types */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-lg">
                <div className="flex items-center space-x-2 space-x-reverse border-b border-slate-800/80 pb-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-black text-white">طبيعة القلق والصراعات المركزية (Types d'angoisse):</h4>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ANXIETY_INDICATORS.map((anx) => {
                    const isSelected = selectedAnxieties.includes(anx.id);
                    return (
                      <button
                        key={anx.id}
                        type="button"
                        onClick={() => toggleAnxiety(anx.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse border ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                        <span>{anx.labelAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ego Strength Slider */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-black text-white">قوة وتماسك الأنا (Force et structure du Moi):</h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    مستوى {egoStrength} / 5
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="5"
                  value={egoStrength}
                  onChange={(e) => setEgoStrength(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                <div className="text-xs text-amber-300 font-medium">
                  {projectiveResult?.ego_strength_label}
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير السيكودينامي (Synthèse Projective):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-pink-500 leading-relaxed"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setSelectedDefenses(['refoulement']);
                setSelectedAnxieties(['angoisse_separation']);
                setEgoStrength(3);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط التحليل</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs shadow-xl shadow-pink-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ التحليل الإسقاطي...' : 'اعتماد التقرير الإسقاطي CAT 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-pink-500/20 border border-pink-500/30 mx-auto flex items-center justify-center text-pink-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم اعتماد وحفظ التحليل السيكودينامي الإسقاطي بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم توثيق الآليات الدفاعية ومؤشرات القلق وتوليد الخلاصة الإكلينيكية للحصيلة النفسية.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">صلابة الأنا:</span>
              <strong className="text-pink-400 text-sm font-bold">
                {projectiveResult?.ego_strength_label}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الآليات الدفاعية:</span>
              <span className="text-white font-bold">{selectedDefenses.length} دفاعات مفعلة</span>
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
