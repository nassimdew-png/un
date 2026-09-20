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
  Heart, 
  ThumbsDown, 
  Layers, 
  TrendingUp, 
  Check, 
  Smile, 
  Frown, 
  Tag, 
  ShieldCheck
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

const PN_PLATES = [
  { id: 'F', title: 'Frontispice', nameAr: 'الواجهة: تقديم شخصيات العائلة (بات نوار، الوالدان، الإخوة)', theme: 'عائلي/هوية' },
  { id: '1', title: 'Planche 1', nameAr: 'المعلف (Auge): إشباع فموي وحاجة بيولوجية', theme: 'فموي' },
  { id: '2', title: 'Planche 2', nameAr: 'الرضاعة الأولى (Tétée 1): التغذية الأمومية التفضيلية', theme: 'فموي/أمومي' },
  { id: '3', title: 'Planche 3', nameAr: 'الرضاعة الثانية (Tétée 2): الغيرة، الإحباط، والحرمان', theme: 'غيرة/حرمان' },
  { id: '4', title: 'Planche 4', nameAr: 'الحفرة (Trou): القذارة، العناد، والنبذ', theme: 'شرجي' },
  { id: '5', title: 'Planche 5', nameAr: 'الضرب (Fessée): العقاب الأبوي، الخضوع، والشعور بالذنب', theme: 'عقاب/أوديب' },
  { id: '6', title: 'Planche 6', nameAr: 'اللعبة (Jouet): النرجسية والاستمتاع الذاتي المعزول', theme: 'نرجسي' },
  { id: '7', title: 'Planche 7', nameAr: 'الليل (Nuit): المشهد البدائي، الغموض، وقلق الانفصال', theme: 'مشهد بدائي' },
  { id: '8', title: 'Planche 8', nameAr: 'الشاحنة (Camion): العدوانية المباشرة، التهديد، والهروب', theme: 'عدوانية/خطر' },
  { id: '9', title: 'Planche 9', nameAr: 'الحظيرة (Étable): العزلة، الإقصاء، والبحث عن الأمان', theme: 'عزلة/أمان' },
  { id: '10', title: 'Planche 10', nameAr: 'الرحيل (Départ): الفطام، الاستقلالية، ومغادرة العائلة', theme: 'انفصال/فطام' },
  { id: '11', title: 'Planche 11', nameAr: 'الوصول (Arrivée): الاستكشاف الخارجي والمجهول', theme: 'استكشاف' },
  { id: '12', title: 'Planche 12', nameAr: 'القبلة (Baiser): الحنان الأوديبي والعلاقة الوالدية', theme: 'أوديب/عاطفة' },
  { id: '13', title: 'Planche 13', nameAr: 'الصراع (Combat): التنافس الأخوي الصريح والعراك', theme: 'تنافس أخوي' },
  { id: '14', title: 'Planche 14', nameAr: 'العربة (Brouette): التعاون أو العبء والمساعدة', theme: 'تعاون/عبء' },
  { id: '15', title: 'Planche 15', nameAr: 'العنزة (Chèvre): الأم البديلة والبحث عن الرعاية الخارجية', theme: 'أم بديلة' },
  { id: '16', title: 'Planche 16', nameAr: 'السلم (Échelle): الارتقاء، التحدي، أو الخوف من السقوط', theme: 'طموح/سقوط' },
  { id: '17', title: 'Planche 17', nameAr: 'حلم الأم (Rêve mère): الرغبات اللاواعية تجاه الأم', theme: 'حلم/أم' },
  { id: '18', title: 'Planche 18', nameAr: 'حلم الأب (Rêve père): الإسقاط المثالي أو المخيف للأب', theme: 'حلم/أب' },
];

const PSYCHODYNAMIC_THEMES = [
  'التثبيت الفموي والبحث عن الإشباع (Fixation orale)',
  'الغيرة الأخوية والتنافس التدميري (Rivalité fraternelle)',
  'العقدة الأوديبية وتثليث العلاقة (Conflit œdipien)',
  'القلق من النبذ والإقصاء العائلي (Angoisse de rejet)',
  'الشعور بالذنب وعقدة العقاب (Culpabilité & Châtiment)',
  'العدوانية المرتدة نحو الذات (Agressivité retournée)',
  'النرجسية والانسحاب الدفاعي (Repli narcissique)',
];

const DEFENSE_MECHANISMS = [
  'الكبت والإخفاء (Refoulement)',
  'الإنكار البسيط (Déni)',
  'التكوين العكسي والود المصطنع (Formation réactionnelle)',
  'الإسقاط العدواني على الآخرين (Projection)',
  'الانشطار إلى موضوع جيد وسيء (Clivage de l\'objet)',
  'العزل الانفعالي والحديث البارد (Isolation)',
];

export default function PatteNoireRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [likedPlates, setLikedPlates] = useState(['Planche 1', 'Planche 6', 'Planche 12', 'Planche 17']);
  const [rejectedPlates, setRejectedPlates] = useState(['Planche 4', 'Planche 5', 'Planche 8']);
  
  const [identifications, setIdentifications] = useState({
    patte_noire: 'الطفل المفحوص نفسه (التطابق الذاتي الأساسي)',
    father: 'الأب (سلطة الضبط والقانون الأبوي)',
    mother: 'الأم (مصدر الإشباع العاطفي والتغذية)',
    siblings: 'الإخوة (موضوع الغيرة والتنافس)',
  });

  const [selectedThemes, setSelectedThemes] = useState([
    'التثبيت الفموي والبحث عن الإشباع (Fixation orale)',
    'الغيرة الأخوية والتنافس التدميري (Rivalité fraternelle)',
    'العقدة الأوديبية وتثليث العلاقة (Conflit œdipien)',
  ]);

  const [selectedDefenses, setSelectedDefenses] = useState([
    'الكبت والإخفاء (Refoulement)',
    'التكوين العكسي والود المصطنع (Formation réactionnelle)',
  ]);

  const [pnResult, setPnResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputePn();
  }, [likedPlates, rejectedPlates, identifications, selectedThemes, selectedDefenses]);

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

  const recomputePn = async () => {
    try {
      const resp = await clinicalTestApi.runPatteNoire({
        liked_plates: likedPlates,
        rejected_plates: rejectedPlates,
        character_identifications: identifications,
        dominant_themes: selectedThemes,
        defense_mechanisms: selectedDefenses,
      });
      setPnResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('Patte Noire calculation error:', e);
    }
  };

  const toggleLiked = (plateTitle) => {
    setLikedPlates((prev) =>
      prev.includes(plateTitle) ? prev.filter((p) => p !== plateTitle) : [...prev, plateTitle]
    );
    setRejectedPlates((prev) => prev.filter((p) => p !== plateTitle));
    soundEngine.playTone(600, 0.04);
  };

  const toggleRejected = (plateTitle) => {
    setRejectedPlates((prev) =>
      prev.includes(plateTitle) ? prev.filter((p) => p !== plateTitle) : [...prev, plateTitle]
    );
    setLikedPlates((prev) => prev.filter((p) => p !== plateTitle));
    soundEngine.playTone(350, 0.04);
  };

  const toggleTheme = (theme) => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
    soundEngine.playTone(500, 0.03);
  };

  const toggleDefense = (defense) => {
    setSelectedDefenses((prev) =>
      prev.includes(defense) ? prev.filter((d) => d !== defense) : [...prev, defense]
    );
    soundEngine.playTone(500, 0.03);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار طفل لربط اختبار الساق السوداء بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'PATTE_NOIRE',
        calculated_total_score: pnResult?.positivity_ratio_pct || 50,
        subscale_scores: {
          liked_count: { name: 'اللوحات المحبوبة (Aimées)', raw: `${likedPlates.length} لوحات`, standard: likedPlates.join('، ') },
          rejected_count: { name: 'اللوحات المرفوضة (Rejetées)', raw: `${rejectedPlates.length} لوحات`, standard: rejectedPlates.join('، ') },
          themes: { name: 'المحاور والصراعات الدينامية', raw: selectedThemes.join('، ') },
          defenses: { name: 'آليات الدفاع الموظفة', raw: selectedDefenses.join('، ') },
          identification: { name: 'التماهي مع بات نوار', raw: identifications.patte_noire },
        },
        raw_responses: { likedPlates, rejectedPlates, identifications, selectedThemes, selectedDefenses },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم Patte Noire');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-600 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-pink-600/30">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                اختبار الساق السوداء الإسقاطي للأطفال (Patte Noire DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-pink-500/10 text-pink-300 border border-pink-500/20">
                Louis Corman
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              18 لوحة إسقاطية لتحليل الصراعات الطفولية اللاواعية (فموي، شرجي، أوديب، غيرة إخوية) وفرز اللوحات المحبوبة والمرفوضة.
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
                <span>المفحوص:</span>
              </div>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-pink-500"
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
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-2 space-x-reverse text-xs text-slate-300">
              <User className="w-4 h-4 text-pink-400" />
              <span className="font-bold">المريض:</span>
              <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
            </div>
          )}

          {/* REAL-TIME PN DYNAMICS BANNER */}
          {pnResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-pink-950/30 to-slate-950 border border-pink-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-pink-600 text-white font-mono font-black text-2xl shadow-lg shadow-pink-600/30">
                    {pnResult.positivity_ratio_pct}% +
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">مؤشر التوازن الوجداني الإسقاطي:</span>
                    <strong className="text-sm font-black text-pink-300 block">
                      {likedPlates.length} لوحات محبوبة | {rejectedPlates.length} لوحات مرفوضة ومقلقة
                    </strong>
                    <span className="text-xs text-slate-400">
                      التماهي الذاتي: <strong className="text-white font-bold">{identifications.patte_noire}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">المحاور:</span>
                    <span className="text-pink-400 font-mono font-bold text-xs">{selectedThemes.length} صراعات</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">الدفاعات:</span>
                    <span className="text-purple-400 font-mono font-bold text-xs">{selectedDefenses.length} آليات</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 18 PLATES VISUAL SORTING GRID */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-pink-400 flex items-center justify-between">
              <span>فرز لوحات بات نوار (18 لوحة):</span>
              <span className="text-[10px] text-slate-500 font-normal">اضغط على ❤️ للتفضيل أو ✖️ للرفض</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {PN_PLATES.map((pl) => {
                const isLiked = likedPlates.includes(pl.title);
                const isRejected = rejectedPlates.includes(pl.title);

                return (
                  <div
                    key={pl.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isLiked
                        ? 'bg-emerald-950/25 border-emerald-500/40'
                        : isRejected
                        ? 'bg-rose-950/25 border-rose-500/40'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-xs font-bold text-white block">{pl.title}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{pl.nameAr}</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                        {pl.theme}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse pt-1">
                      <button
                        type="button"
                        onClick={() => toggleLiked(pl.title)}
                        className={`flex-1 py-1 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 space-x-reverse transition-all ${
                          isLiked
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                        }`}
                      >
                        <Smile className="w-3.5 h-3.5" />
                        <span>محبوبة ❤️</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleRejected(pl.title)}
                        className={`flex-1 py-1 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 space-x-reverse transition-all ${
                          isRejected
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                        }`}
                      >
                        <Frown className="w-3.5 h-3.5" />
                        <span>مرفوضة ✖️</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHARACTER IDENTIFICATION INPUTS */}
          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-black text-purple-400 border-b border-slate-800/80 pb-2">
              التماهي الإسقاطي مع شخصيات القصة (Identifications):
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">من هو بات نوار؟ (Patte Noire):</label>
                <input
                  type="text"
                  value={identifications.patte_noire}
                  onChange={(e) => setIdentifications({ ...identifications, patte_noire: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">من هو الأب؟ (Père):</label>
                <input
                  type="text"
                  value={identifications.father}
                  onChange={(e) => setIdentifications({ ...identifications, father: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">من هي الأم؟ (Mère):</label>
                <input
                  type="text"
                  value={identifications.mother}
                  onChange={(e) => setIdentifications({ ...identifications, mother: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">من هم الإخوة؟ (Frères/Sœurs):</label>
                <input
                  type="text"
                  value={identifications.siblings}
                  onChange={(e) => setIdentifications({ ...identifications, siblings: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC THEMES & DEFENSE MECHANISMS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Themes */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-pink-400 flex items-center space-x-1.5 space-x-reverse">
                <Tag className="w-3.5 h-3.5" />
                <span>المحاور والصراعات الدينامية اللاواعية:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {PSYCHODYNAMIC_THEMES.map((th) => {
                  const isSelected = selectedThemes.includes(th);
                  return (
                    <button
                      key={th}
                      type="button"
                      onClick={() => toggleTheme(th)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse ${
                        isSelected
                          ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{th}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Defense Mechanisms */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-purple-400 flex items-center space-x-1.5 space-x-reverse">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>آليات الدفاع الموظفة (Mécanismes de défense):</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {DEFENSE_MECHANISMS.map((def) => {
                  const isSelected = selectedDefenses.includes(def);
                  return (
                    <button
                      key={def}
                      type="button"
                      onClick={() => toggleDefense(def)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{def}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير التحليلي لاختبار الساق السوداء (Synthèse PN):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-pink-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setLikedPlates(['Planche 1', 'Planche 6', 'Planche 12', 'Planche 17']);
                setRejectedPlates(['Planche 4', 'Planche 5', 'Planche 8']);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط الفرز الافتراضي</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-xs shadow-xl shadow-pink-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج Patte Noire...' : 'اعتماد تقرير فحص الساق السوداء 💾'}</span>
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
              تم توثيق نتائج اختبار الساق السوداء بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل فرز اللوحات المحبوبة والمرفوضة ومحاور الصراع وآليات الدفاع بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">اللوحات المحبوبة:</span>
              <strong className="text-emerald-400 text-base font-black font-mono">
                {likedPlates.length} لوحات
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">اللوحات المرفوضة:</span>
              <strong className="text-rose-400 text-base font-black font-mono">
                {rejectedPlates.length} لوحات
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التماهي:</span>
              <span className="text-white font-bold">{identifications.patte_noire}</span>
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
