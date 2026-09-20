import React, { useState, useEffect } from 'react';
import { 
  Users, 
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
  CheckSquare, 
  Square, 
  MessageSquare, 
  Heart, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

const ADIR_DOMAINS_SCHEMA = [
  {
    key: 'domain_a',
    titleAr: 'المجال (A): التفاعل الاجتماعي المتبادل (Social Interaction)',
    titleFr: 'Anomalies qualitatives dans les interactions sociales réciproques',
    cutoff: 10,
    items: [
      { id: 'a1', label: 'التواصل البصري المباشر وتناغمه مع التعبير الاجتماعي' },
      { id: 'a2', label: 'الابتسامة الاجتماعية التفاعلية واستجابة الوجه للآخرين' },
      { id: 'a3', label: 'المشاركة الوجدانية وإظهار المتعة المشتركة' },
      { id: 'a4', label: 'تقديم المواساة والاستجابة لانفعالات وضيق الآخرين' },
      { id: 'a5', label: 'المبادرة في اللعب التفاعلي والاهتمام بالأقران والأطفال' },
      { id: 'a6', label: 'الاستجابة لنداء الاسم والترحيب الاجتماعي المتبادل' },
    ],
  },
  {
    key: 'domain_b',
    titleAr: 'المجال (B): التواصل اللغوي وغير اللغوي (Communication)',
    titleFr: 'Anomalies qualitatives dans la communication',
    cutoffVerbal: 8,
    cutoffNonVerbal: 7,
    items: [
      { id: 'b1', label: 'الإشارة بالأصبع لإبداء الاهتمام ومشاركة الانتباه (Pointage)' },
      { id: 'b2', label: 'إيماءات الرأس للتعبير عن الموافقة (نعم) أو الرفض (لا)' },
      { id: 'b3', label: 'استخدام يد وجسد الوالدين كأداة لتحقيق الطلبات (Main-outil)' },
      { id: 'b4', label: 'التقليد الحركي والصوتي العفوي للأنشطة الاجتماعية' },
      { id: 'b5', label: 'اللعب التخيلي الإيهامي والإبداعي المشترك (Jeu de faire-semblant)' },
      { id: 'b6', label: 'المصاداة والتكرار الآلي للعبارات (Écholalie immédiate/différée)' },
    ],
  },
  {
    key: 'domain_c',
    titleAr: 'المجال (C): السلوكيات النمطية والاهتمامات المقيدة (Repetitive Behaviors)',
    titleFr: 'Comportements stéréotypés et répétitifs',
    cutoff: 3,
    items: [
      { id: 'c1', label: 'انشغال غير اعتيادي واهتمامات محصورة وشديدة التركيز' },
      { id: 'c2', label: 'حركات نمطية وتكرارية باليدين أو الأصابع (رفرفة، فتل)' },
      { id: 'c3', label: 'استخدام متكرر وغير وظيفي لأجزاء من الألعاب (دوران العجلات)' },
      { id: 'c4', label: 'طقوس وروتينات صارمة ومقاومة شديدة لأي تغيير في البيئة' },
      { id: 'c5', label: 'اهتمامات حسية شاذة (شم الأشياء، التلذذ بالملمس، التحديق في الأضواء)' },
    ],
  },
  {
    key: 'domain_d',
    titleAr: 'المجال (D): الظهور النمائي المبكر قبل سن 36 شهراً (Developmental Onset)',
    titleFr: 'Anomalies évidentes avant l\'âge de 36 mois',
    cutoff: 1,
    items: [
      { id: 'd1', label: 'ملاحظة الوالدين لغرابة أو تأخر في النمو التواصلي قبل 36 شهراً' },
      { id: 'd2', label: 'فقدان أو تراجع مكتسبات لغوية أو اجتماعية بعد تطور أولي' },
    ],
  },
];

export default function AdirRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [isVerbal, setIsVerbal] = useState(true);
  
  // Checklist for each item (0: سليم, 1: متوسط/غير مؤكد, 2: مؤشر دال ومستوفى)
  const [itemScores, setItemScores] = useState(() => {
    const init = {};
    ADIR_DOMAINS_SCHEMA.forEach((dom) => {
      dom.items.forEach((it, idx) => {
        init[it.id] = 2; // Default typical positive ratings
      });
    });
    return init;
  });

  const [adirResult, setAdirResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeAdir();
  }, [itemScores, isVerbal]);

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

  const calculateDomainTotals = () => {
    let scoreA = 0;
    let scoreB = 0;
    let scoreC = 0;
    let scoreD = 0;

    ADIR_DOMAINS_SCHEMA[0].items.forEach((it) => { scoreA += (itemScores[it.id] || 0); });
    ADIR_DOMAINS_SCHEMA[1].items.forEach((it) => { scoreB += (itemScores[it.id] || 0); });
    ADIR_DOMAINS_SCHEMA[2].items.forEach((it) => { scoreC += (itemScores[it.id] || 0); });
    ADIR_DOMAINS_SCHEMA[3].items.forEach((it) => { scoreD += (itemScores[it.id] || 0); });

    return { scoreA, scoreB, scoreC, scoreD };
  };

  const recomputeAdir = async () => {
    const { scoreA, scoreB, scoreC, scoreD } = calculateDomainTotals();
    try {
      const resp = await clinicalTestApi.runAdir({
        domain_a_social: scoreA,
        domain_b_communication: scoreB,
        is_verbal: isVerbal,
        domain_c_repetitive: scoreC,
        domain_d_onset: scoreD,
      });
      setAdirResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('ADI-R calculation error:', e);
    }
  };

  const setScore = (id, val) => {
    setItemScores((prev) => ({ ...prev, [id]: val }));
    soundEngine.playTone(450 + val * 80, 0.04);
  };

  const setAllDomainScores = (val) => {
    const next = {};
    ADIR_DOMAINS_SCHEMA.forEach((dom) => {
      dom.items.forEach((it) => { next[it.id] = val; });
    });
    setItemScores(next);
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط فحص ADI-R بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const { scoreA, scoreB, scoreC, scoreD } = calculateDomainTotals();
      const payload = {
        test_code: 'ADI_R',
        calculated_total_score: scoreA + scoreB + scoreC + scoreD,
        subscale_scores: {
          domain_a: { name: 'المجال (A) التفاعل الاجتماعي', raw: `${scoreA} (العتبة: 10)`, is_met: scoreA >= 10 },
          domain_b: { name: 'المجال (B) التواصل', raw: `${scoreB} (العتبة: ${isVerbal ? 8 : 7})`, is_met: scoreB >= (isVerbal ? 8 : 7) },
          domain_c: { name: 'المجال (C) السلوكيات النمطية', raw: `${scoreC} (العتبة: 3)`, is_met: scoreC >= 3 },
          domain_d: { name: 'المجال (D) الظهور المبكر', raw: `${scoreD} (العتبة: 1)`, is_met: scoreD >= 1 },
          criteria_met: { name: 'المعايير المستوفاة', raw: `${adirResult?.met_criteria_count} / 4`, interpretation: adirResult?.diagnosis_label_ar },
        },
        raw_responses: { scores: itemScores, is_verbal: isVerbal },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم ADI-R');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-600/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                المقابلة التشخيصية للتوحد مع الوالدين (ADI-R DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Rutter, Le Couteur, Lord
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              التقييم النمائي الشامل عبر المقابلة العيادية المعيارية والمطابقة مع عتبات المجالات الأربعة (A, B, C, D).
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
          {/* Patient Selector & Verbal Switcher */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {!patientId ? (
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300">
                <User className="w-4 h-4 text-purple-400" />
                <span>المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
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
              <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-300">
                <User className="w-4 h-4 text-purple-400" />
                <span className="font-bold">المريض:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Language Verbal Toggle */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <span className="text-slate-400 font-bold">الحالة اللغوية للطفل:</span>
              <button
                type="button"
                onClick={() => setIsVerbal(!isVerbal)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                  isVerbal
                    ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                {isVerbal ? '🗣️ ناطق / لغة تعبيرية (عتبة التواصل: 8)' : '🔇 غير ناطق (عتبة التواصل: 7)'}
              </button>
            </div>
          </div>

          {/* REAL-TIME 4-DOMAIN CUTOFF THRESHOLD COMPARISON BANNER */}
          {adirResult && (
            <div className={`p-5 rounded-3xl border space-y-4 shadow-xl transition-all ${
              adirResult.is_autism_confirmed
                ? 'bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 border-purple-500/50'
                : adirResult.met_criteria_count >= 2
                ? 'bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border-amber-500/40'
                : 'bg-gradient-to-r from-slate-950 via-emerald-950/30 to-slate-950 border-emerald-500/30'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className={`px-5 py-2.5 rounded-2xl font-mono font-black text-2xl shadow-lg ${
                    adirResult.is_autism_confirmed
                      ? 'bg-purple-600 text-white shadow-purple-600/30'
                      : adirResult.met_criteria_count >= 2
                      ? 'bg-amber-600 text-white shadow-amber-600/30'
                      : 'bg-emerald-600 text-white shadow-emerald-600/30'
                  }`}>
                    {adirResult.met_criteria_count} / 4 معايير
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">الاستنتاج التشخيصي لـ ADI-R:</span>
                    <strong className="text-base font-black text-white block">
                      {adirResult.diagnosis_label_ar}
                    </strong>
                    <span className="text-xs text-slate-400">
                      {adirResult.is_autism_confirmed ? '✅ مستوفى لجميع العتبات المعيارية الأربعة' : '⚠️ استيفاء جزئي أو غير مكتمل للمعايير'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Domain Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {Object.entries(adirResult.domains || {}).map(([dKey, dMeta]) => (
                  <div
                    key={dKey}
                    className={`p-3 rounded-2xl border text-center space-y-1 ${
                      dMeta.is_met
                        ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold block truncate">{dMeta.name_ar}</span>
                    <div className="font-mono font-black text-base">
                      {dMeta.score} / {dMeta.cutoff}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                      dMeta.is_met ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {dMeta.is_met ? 'مستوفى للعتبة ✅' : 'دون العتبة ❌'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4 INTERVIEW DOMAINS SECTIONS */}
          <div className="space-y-4">
            {ADIR_DOMAINS_SCHEMA.map((dom) => (
              <div key={dom.key} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div>
                    <h4 className="text-xs font-black text-purple-400">{dom.titleAr}</h4>
                    <span className="text-[10px] text-slate-400 block italic font-serif" dir="ltr">{dom.titleFr}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-300 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
                    العتبة المطلوبة: {dom.key === 'domain_b' ? (isVerbal ? '8 نقاط' : '7 نقاط') : `${dom.cutoff} نقاط`}
                  </span>
                </div>

                <div className="space-y-2">
                  {dom.items.map((item) => {
                    const currentScore = itemScores[item.id] !== undefined ? itemScores[item.id] : 2;
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                      >
                        <span className="text-xs font-bold text-white leading-snug">{item.label}</span>

                        <div className="flex items-center space-x-1 space-x-reverse shrink-0">
                          {[
                            { score: 0, label: '0: طبيعي' },
                            { score: 1, label: '1: طفيف' },
                            { score: 2, label: '2: مؤشر دال' },
                          ].map((btn) => (
                            <button
                              key={btn.score}
                              type="button"
                              onClick={() => setScore(item.id, btn.score)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                currentScore === btn.score
                                  ? btn.score === 2
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : btn.score === 1
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-emerald-600 text-white'
                                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
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
            ))}
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية والتقرير النمائي لـ ADI-R:</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setAllDomainScores(0)}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير لنمو طبيعي (0)</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-purple-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج ADI-R...' : 'اعتماد تقرير المقابلة التشخيصية ADI-R 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border border-purple-500/30 mx-auto flex items-center justify-center text-purple-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق نتائج مقابلة ADI-R بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم توثيق العتبات التشخيصية للمجالات الأربعة وتأكيد المخرجات السريرية.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">المعايير المستوفاة:</span>
              <strong className="text-purple-400 text-base font-black font-mono">
                {adirResult?.met_criteria_count} / 4 معايير
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">التصنيف:</span>
              <strong className="text-white font-bold">{adirResult?.diagnosis_label_ar}</strong>
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
