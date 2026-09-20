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
  Boxes, 
  Layers, 
  TrendingUp, 
  Check, 
  Sliders, 
  LayoutGrid, 
  Smile, 
  Home, 
  Trees, 
  Dog
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

const SPATIAL_ORGANIZATION_TYPES = [
  { key: 'harmonious', label: '1. تنظيم متناسق ومتكامل (Harmonieuse)', desc: 'توزيع متوازن للمساحة، علاقات واضحة بين الشخصيات، وسرد درامي هادف.', color: 'emerald' },
  { key: 'constricted', label: '2. تنظيم منكمش ومقيد (Rétractée / Inhibée)', desc: 'تجمع العناصر في زاوية ضيقة، فراغ مكاني مفرط، دال على التثبيط والحذر.', color: 'amber' },
  { key: 'chaotic', label: '3. تنظيم فوضوي ومشتت (Chaotique / Agitée)', desc: 'تكدس عشوائي، اندفاعية في وضع الأشياء، دال على ضعف الضبط الحركي.', color: 'orange' },
  { key: 'fragmented', label: '4. تنظيم متفكك ومشطور (Fragmentée / Clivée)', desc: 'عزل تام بين المناطق، غياب الروابط، دال على قلق التفكك والهشاشة.', color: 'rose' },
];

export default function ScenoRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [numChars, setNumChars] = useState(4);
  const [numAnimals, setNumAnimals] = useState(2);
  const [numTrees, setNumTrees] = useState(3);
  const [numBuildings, setNumBuildings] = useState(2);

  const [spatialOrg, setSpatialOrg] = useState('harmonious');
  const [dominantAffect, setDominantAffect] = useState('أمن واستقرار مع رغبة في الاحتواء والحماية');
  const [verbatim, setVerbatim] = useState('بناء حديقة منزلية آمنة ومحاطة بسياج لحماية الحيوانات الصغيرة والأسرة');

  const [scenoResult, setScenoResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeSceno();
  }, [numChars, numAnimals, numTrees, numBuildings, spatialOrg, dominantAffect, verbatim]);

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

  const recomputeSceno = async () => {
    try {
      const resp = await clinicalTestApi.runSceno({
        chosen_characters: numChars,
        chosen_animals: numAnimals,
        chosen_trees: numTrees,
        chosen_buildings: numBuildings,
        spatial_organization: spatialOrg,
        dominant_affect: dominantAffect,
        verbatim_summary: verbatim,
      });
      setScenoResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('Scéno-Test calculation error:', e);
    }
  };

  const setPreset = (type) => {
    if (type === 'harmonious') {
      setNumChars(4); setNumAnimals(2); setNumTrees(3); setNumBuildings(2);
      setSpatialOrg('harmonious');
      setDominantAffect('أمن واستقرار مع رغبة في الاحتواء والحماية');
      setVerbatim('بناء حديقة منزلية آمنة ومحاطة بسياج لحماية الحيوانات الصغيرة والأسرة');
    } else if (type === 'constricted') {
      setNumChars(1); setNumAnimals(1); setNumTrees(1); setNumBuildings(4);
      setSpatialOrg('constricted');
      setDominantAffect('حذر شديد وتثبيط دفاعي مع خوف من التعبير');
      setVerbatim('وضع الشخصية وحدها خلف سور مرتفع دون أي حركة أو تفاعل');
    } else if (type === 'chaotic') {
      setNumChars(8); setNumAnimals(6); setNumTrees(0); setNumBuildings(5);
      setSpatialOrg('chaotic');
      setDominantAffect('اندفاعية وقلق مشوش وصراع صريح');
      setVerbatim('رمي الحيوانات والشخصيات في وسط الصينية بشكل متداخل وعراك متواصل');
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط تقييم Scéno-Test بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'SCENO_TEST',
        calculated_total_score: scenoResult?.emotional_cohesion_score || 75,
        subscale_scores: {
          total_elements: { name: 'إجمالي المجسمات المستعملة', raw: `${scenoResult?.total_elements_used} مجسمات (${numChars} شخصيات، ${numAnimals} حيوانات، ${numTrees} أشجار، ${numBuildings} مباني)` },
          spatial_org: { name: 'التنظيم الفضائي للمشهد', raw: scenoResult?.spatial_organization_label_ar },
          cohesion_score: { name: 'مؤشر التماسك الوجداني', raw: `${scenoResult?.emotional_cohesion_score} / 100` },
          dominant_affect: { name: 'الانفعال والمضمون السائد', raw: dominantAffect },
          verbatim: { name: 'السرد الدرامي للمريض', raw: verbatim },
        },
        raw_responses: { numChars, numAnimals, numTrees, numBuildings, spatialOrg, dominantAffect, verbatim },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم Scéno-Test');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-teal-600 flex items-center justify-center text-white font-black shadow-lg shadow-orange-600/30">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                اختبار المشهد الإسقاطي واللعب العلاجي (Scéno-Test DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-300 border border-orange-500/20">
                Gerdhild von Staabs
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تقنية إسقاطية عبر تنظيم وتشييد مشاهد درامية تفاعلية باستخدام المجسمات لتحليل البنية النفسية والصراعات اللاواعية.
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
          {/* Patient Selector & Presets */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {!patientId ? (
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300">
                <User className="w-4 h-4 text-orange-400" />
                <span>المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- اختر مفحوصاً من العيادة --</option>
                  {patientsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.phone || '--'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-300">
                <User className="w-4 h-4 text-orange-400" />
                <span className="font-bold">المريض:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Demo Presets */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setPreset('harmonious')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
              >
                مشهد متناسق
              </button>
              <button
                type="button"
                onClick={() => setPreset('constricted')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/30"
              >
                مشهد منكمش
              </button>
              <button
                type="button"
                onClick={() => setPreset('chaotic')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/30"
              >
                مشهد فوضوي
              </button>
            </div>
          </div>

          {/* REAL-TIME SCENO COHESION HERO BANNER */}
          {scenoResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-orange-950/30 to-slate-950 border border-orange-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-orange-600 text-white font-mono font-black text-2xl shadow-lg shadow-orange-600/30">
                    {scenoResult.emotional_cohesion_score} / 100
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">مؤشر التماسك الوجداني والتنظيم المكاني:</span>
                    <strong className="text-base font-black text-white block">
                      {scenoResult.spatial_organization_label_ar}
                    </strong>
                    <span className="text-xs text-slate-400">
                      إجمالي العناصر المستخدمة: <strong className="text-orange-400 font-mono font-bold">{scenoResult.total_elements_used} مجسمات</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4 ELEMENT CATEGORY COUNTERS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-center">
              <span className="text-xs font-bold text-amber-400 flex items-center justify-center space-x-1 space-x-reverse">
                <User className="w-4 h-4" />
                <span>الشخصيات (Personnages):</span>
              </span>
              <input
                type="number"
                min="0"
                max="20"
                value={numChars}
                onChange={(e) => setNumChars(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center text-lg"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-center">
              <span className="text-xs font-bold text-teal-400 flex items-center justify-center space-x-1 space-x-reverse">
                <Dog className="w-4 h-4" />
                <span>الحيوانات (Animaux):</span>
              </span>
              <input
                type="number"
                min="0"
                max="20"
                value={numAnimals}
                onChange={(e) => setNumAnimals(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center text-lg"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-center">
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-center space-x-1 space-x-reverse">
                <Trees className="w-4 h-4" />
                <span>الأشجار والنباتات (Arbres):</span>
              </span>
              <input
                type="number"
                min="0"
                max="20"
                value={numTrees}
                onChange={(e) => setNumTrees(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center text-lg"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-center">
              <span className="text-xs font-bold text-indigo-400 flex items-center justify-center space-x-1 space-x-reverse">
                <Home className="w-4 h-4" />
                <span>المباني والحواجز (Bâtiments):</span>
              </span>
              <input
                type="number"
                min="0"
                max="20"
                value={numBuildings}
                onChange={(e) => setNumBuildings(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-center text-lg"
              />
            </div>
          </div>

          {/* SPATIAL ORGANIZATION SELECTION GRID */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-orange-400">نمط التنظيم الفضائي للمشهد (Organisation Spatiale):</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SPATIAL_ORGANIZATION_TYPES.map((t) => {
                const isSelected = spatialOrg === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => { setSpatialOrg(t.key); soundEngine.playTone(550, 0.03); }}
                    className={`p-4 rounded-2xl text-right border transition-all space-y-1 ${
                      isSelected
                        ? 'bg-orange-600/20 border-orange-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{t.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-orange-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dominant Affect & Verbatim */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">الانفعال والمضمون الرمزي السائد:</label>
              <input
                type="text"
                value={dominantAffect}
                onChange={(e) => setDominantAffect(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">السرد الدرامي وتعليق المفحوص (Verbatim):</label>
              <input
                type="text"
                value={verbatim}
                onChange={(e) => setVerbatim(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير الإسقاطي لـ Scéno-Test:</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-orange-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPreset('harmonious')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للمستوى المتناسق</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-teal-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-xl shadow-orange-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج Scéno-Test...' : 'اعتماد تقرير فحص Scéno-Test 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-orange-500/20 border border-orange-500/30 mx-auto flex items-center justify-center text-orange-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق نتائج اختبار المشهد الإسقاطي Scéno-Test بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل التنظيم الفضائي والمجسمات المستخدمة ومؤشر التماسك الوجداني.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">مؤشر التماسك:</span>
              <strong className="text-orange-400 text-base font-black font-mono">
                {scenoResult?.emotional_cohesion_score} / 100
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التنظيم الفضائي:</span>
              <strong className="text-white font-bold">{scenoResult?.spatial_organization_label_ar}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">العناصر المستخدمة:</span>
              <span className="text-amber-400 font-mono font-bold">{scenoResult?.total_elements_used} مجسمات</span>
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
