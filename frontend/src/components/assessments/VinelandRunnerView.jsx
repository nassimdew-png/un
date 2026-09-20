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
  Sliders, 
  User, 
  Activity, 
  X, 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Home, 
  Smile, 
  Bike,
  Check
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

const DOMAIN_TABS = [
  {
    id: 'communication',
    nameAr: 'التواصل (Communication)',
    icon: MessageSquare,
    color: 'from-blue-600 to-indigo-600',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    subscales: [
      { key: 'receptive', label: 'التواصل الاستقبالي (Réceptif)', desc: 'الاستجابة للأوامر، فهم التوجيهات والمفردات اليومية' },
      { key: 'expressive', label: 'التواصل التعبيري (Expressif)', desc: 'استخدام الكلمات والجمل، التعبير عن الرغبات والحوار' },
      { key: 'written', label: 'التواصل الكتابي (Écrit)', desc: 'التعرف على الحروف والرموز والقراءة والكتابة الوظيفية' },
    ],
  },
  {
    id: 'daily_living',
    nameAr: 'الحياة اليومية (Vie Quotidienne)',
    icon: Home,
    color: 'from-emerald-600 to-teal-600',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    subscales: [
      { key: 'personal', label: 'الاستقلالية الشخصية (Personnel)', desc: 'تناول الطعام، النظافة، ارتداء الملابس واستخدام المرحاض' },
      { key: 'domestic', label: 'المهام المنزلية (Domestique)', desc: 'المساعدة في ترتيب الأغراض، تنظيف الألعاب والمسؤوليات البسيطة' },
      { key: 'community', label: 'المهارات المجتمعية (Communautaire)', desc: 'استخدام النقود، الالتزام بقواعد السلامة في الشارع والتعامل مع الوقت' },
    ],
  },
  {
    id: 'socialization',
    nameAr: 'التنشئة الاجتماعية (Socialisation)',
    icon: Smile,
    color: 'from-purple-600 to-pink-600',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400',
    subscales: [
      { key: 'interpersonal', label: 'العلاقات بين الأشخاص (Relations)', desc: 'التفاعل مع الأقران والبالغين، التعبير عن المشاعر والمشاركة' },
      { key: 'play', label: 'اللعب ووقت الفراغ (Jeu & Loisirs)', desc: 'مشاركة الألعاب، احترام الأدوار، وممارسة الهوايات' },
      { key: 'coping', label: 'مهارات التأقلم والتعامل (Adaptation)', desc: 'إظهار المسؤولية، تقبل التغيير والاعتذار عند الخطأ' },
    ],
  },
  {
    id: 'motor_skills',
    nameAr: 'المهارات الحركية (Motricité)',
    icon: Bike,
    color: 'from-amber-600 to-orange-600',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    subscales: [
      { key: 'gross_motor', label: 'الحركية الكبرى (Motricité Globale)', desc: 'الجري، القفز، صعود ونزول الدرج، التوازن وركوب الدراجة' },
      { key: 'fine_motor', label: 'الحركية الدقيقة (Motricité Fine)', desc: 'استخدام المقص، مسك القلم، فتح الأزرار والتحكم اليدوي الدقيق' },
    ],
  },
];

export default function VinelandRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [activeTab, setActiveTab] = useState('communication');
  const [subscales, setSubscales] = useState({
    receptive: 12,
    expressive: 11,
    written: 10,
    personal: 12,
    domestic: 10,
    community: 9,
    interpersonal: 11,
    play: 12,
    coping: 10,
    gross_motor: 13,
    fine_motor: 12,
  });

  const [vinelandResult, setVinelandResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeVineland();
  }, [subscales]);

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

  const recomputeVineland = async () => {
    try {
      const resp = await clinicalTestApi.runVineland({ subscales });
      setVinelandResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('Vineland calculation error:', e);
    }
  };

  const handleScoreChange = (key, val) => {
    const num = Math.max(0, Math.min(20, Number(val)));
    setSubscales((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  const setPreset = (type) => {
    if (type === 'adequate') {
      setSubscales({
        receptive: 10, expressive: 10, written: 10,
        personal: 10, domestic: 10, community: 10,
        interpersonal: 10, play: 10, coping: 10,
        gross_motor: 10, fine_motor: 10,
      });
    } else if (type === 'high') {
      setSubscales({
        receptive: 16, expressive: 15, written: 14,
        personal: 16, domestic: 15, community: 14,
        interpersonal: 16, play: 15, coping: 15,
        gross_motor: 15, fine_motor: 16,
      });
    } else if (type === 'deficit') {
      setSubscales({
        receptive: 5, expressive: 4, written: 3,
        personal: 6, domestic: 4, community: 3,
        interpersonal: 5, play: 4, coping: 4,
        gross_motor: 6, fine_motor: 5,
      });
    }
    soundEngine.playTone(550, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط تقييم السلوك التكيفي Vineland-II بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'VINELAND_II',
        calculated_total_score: vinelandResult?.abc_score || 100,
        subscale_scores: {
          ABC: { name: 'المعدل التكيفي العام (Composite ABC)', raw: vinelandResult?.abc_score, standard: vinelandResult?.abc_score, interpretation: vinelandResult?.classification_ar },
          communication: { name: 'التواصل', raw: vinelandResult?.domains?.communication?.score, standard: vinelandResult?.domains?.communication?.score },
          daily_living: { name: 'الحياة اليومية', raw: vinelandResult?.domains?.daily_living?.score, standard: vinelandResult?.domains?.daily_living?.score },
          socialization: { name: 'التنشئة الاجتماعية', raw: vinelandResult?.domains?.socialization?.score, standard: vinelandResult?.domains?.socialization?.score },
          motor_skills: { name: 'المهارات الحركية', raw: vinelandResult?.domains?.motor_skills?.score, standard: vinelandResult?.domains?.motor_skills?.score },
        },
        raw_responses: subscales,
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم Vineland-II');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-600/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                مقياس فاينلاند للسلوك التكيفي (Vineland-II DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Sparrow et al.
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تقييم مجالات السلوك التكيفي الأربعة (التواصل، الحياة اليومية، التنشئة الاجتماعية، الحركية) واستخراج المعدل المركب (ABC).
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
          {/* Patient Selector & Preset Quick Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            {!patientId ? (
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-slate-300 w-full sm:w-1/2">
                <User className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="shrink-0">المفحوص:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
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

            {/* Quick Demo Controls */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setPreset('adequate')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
              >
                تكيف ملائم (100)
              </button>
              <button
                type="button"
                onClick={() => setPreset('high')}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition-colors"
              >
                مستوى متقدم
              </button>
              <button
                type="button"
                onClick={() => setPreset('deficit')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 transition-colors"
              >
                قصور تكيفي
              </button>
            </div>
          </div>

          {/* REAL-TIME VINELAND ABC DASHBOARD & 4-DOMAIN SUMMARY */}
          {vinelandResult && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950/30 to-slate-950 border border-purple-500/30 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="px-5 py-2.5 rounded-2xl bg-purple-600 text-white font-mono font-black text-3xl shadow-lg shadow-purple-600/30">
                    ABC {vinelandResult.abc_score}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">المعدل التكيفي العام (Composite Score):</span>
                    <strong className="text-base font-black text-purple-300 block">
                      {vinelandResult.classification_ar}
                    </strong>
                    <span className="text-xs text-slate-400">
                      الرتبة المئينية: <strong className="text-white font-mono font-bold">{vinelandResult.abc_percentile}%</strong>
                    </span>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <span className="text-slate-500 block text-[10px]">المعيار المعياري:</span>
                  <span>Mean = 100 (SD = 15)</span>
                </div>
              </div>

              {/* 4 Domain Standard Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                {DOMAIN_TABS.map((dom) => {
                  const domData = vinelandResult?.domains?.[dom.id];
                  const score = domData?.score || 100;
                  const pct = domData?.percentile || 50;

                  return (
                    <div key={dom.id} className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold truncate">{dom.nameAr}</span>
                      <div className="text-lg font-black font-mono text-white">{score}</div>
                      <div className="text-[10px] text-purple-300 font-semibold">رتبة {pct}%</div>
                      {/* Visual Bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.max(10, ((score - 40) / 120) * 100))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DOMAIN TABS & SUBSCALE SLIDERS */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto pb-1 custom-scrollbar">
              {DOMAIN_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 space-x-reverse shrink-0 transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.nameAr}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Tab Subscales */}
            {DOMAIN_TABS.filter((t) => t.id === activeTab).map((currentTab) => (
              <div
                key={currentTab.id}
                className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-lg animate-in fade-in"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <currentTab.icon className={`w-5 h-5 ${currentTab.textColor}`} />
                    <h4 className="text-sm font-black text-white">{currentTab.nameAr}</h4>
                  </div>
                  <span className="text-xs text-slate-400">
                    الدرجة المعيارية للمجال: <strong className="text-purple-400 font-mono font-bold">{vinelandResult?.domains?.[currentTab.id]?.score || 100}</strong>
                  </span>
                </div>

                <div className="space-y-4">
                  {currentTab.subscales.map((st) => (
                    <div key={st.key} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-white block">{st.label}</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{st.desc}</span>
                        </div>
                        <span className="font-mono text-purple-400 font-black text-sm px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 shrink-0">
                          {subscales[st.key]} / 20
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={subscales[st.key]}
                        onChange={(e) => handleScoreChange(st.key, e.target.value)}
                        className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />

                      <div className="flex justify-between text-[10px] text-slate-500 font-medium px-1">
                        <span>0: أبداً / عجز تام</span>
                        <span>10: أداء مناسب جزئياً</span>
                        <span>20: استقلالية وتكيف تام</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية للسلوك التكيفي (Synthèse Vineland-II):</span>
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
              onClick={() => setPreset('adequate')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للمتوسط (10)</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-purple-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ نتائج التكيف...' : 'اعتماد تقييم فاينلاند Vineland-II 💾'}</span>
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
              تم توثيق نتائج مقياس فاينلاند للسلوك التكيفي بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل درجات المجالات الأربعة وحساب المعدل التكيفي العام ABC وربط التقرير بملف المريض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">المعدل العام ABC:</span>
              <strong className="text-purple-400 text-base font-black font-mono">
                {vinelandResult?.abc_score}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">مستوى التكيف:</span>
              <span className="text-white font-bold">{vinelandResult?.classification_ar}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">الرتبة المئينية:</span>
              <span className="text-emerald-400 font-mono font-bold">{vinelandResult?.abc_percentile}%</span>
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
