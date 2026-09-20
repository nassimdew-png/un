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
  ShieldAlert, 
  Users, 
  Layers, 
  TrendingUp, 
  Check, 
  Sliders, 
  HeartHandshake,
  Tag
} from 'lucide-react';
import { clinicalTestApi, patientApi } from '../../api';
import { soundEngine } from '../../utils/soundEngine';

const AVAILABLE_TRIGGERS = [
  'الإحباط عند المنع أو رفض طلب',
  'الضوضاء والحمل الحسي المفرط',
  'تغيير الروتين أو الانتقال بين الأنشطة',
  'صعوبة التعبير عن الألم أو الانزعاج الجسدي',
  'المطالب الدراسية أو الأكاديمية الصعبة',
  'التعب أو قلة النوم',
  'التواجد في أماكن مزدحمة أو غير مألوفة',
];

const AVAILABLE_BODY_SITES = [
  'الرأس والجبين (Coups de tête sur objets/murs)',
  'اليدين والمعصمين (Morsures des mains)',
  'الوجه والخدين (Griffures / Gifles)',
  'الأطراف العلوية والذراعين (Pincements)',
  'الأطراف السفلية والركبتين (Coups)',
  'الشعر (Arrachage de cheveux / Trichotillomanie)',
  'العينين أو الأذنين (Frottements violents)',
];

export default function EchaEcaaRunnerView({ patientId = null, patientName = null, onClose = null, onSaved = null }) {
  const [activeTab, setActiveTab] = useState('echa'); // 'echa' | 'ecaa'

  // ECHA State (Hetero-Aggressive - 0 to 4)
  const [physAgg, setPhysAgg] = useState(2);
  const [verbAgg, setVerbAgg] = useState(1);
  const [destruct, setDestruct] = useState(1);
  const [selectedTriggers, setSelectedTriggers] = useState([
    'الإحباط عند المنع أو رفض طلب',
    'الضوضاء والحمل الحسي المفرط',
  ]);

  // ECAA State (Auto-Aggressive / SIB - 0 to 4)
  const [sibFreq, setSibFreq] = useState(1);
  const [sibSev, setSibSev] = useState(1);
  const [selectedBodySites, setSelectedBodySites] = useState([
    'الرأس والجبين (Coups de tête sur objets/murs)',
    'اليدين والمعصمين (Morsures des mains)',
  ]);

  const [behaviorResult, setBehaviorResult] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState(null);

  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [patientsList, setPatientsList] = useState([]);

  useEffect(() => {
    if (!patientId) fetchPatients();
  }, [patientId]);

  useEffect(() => {
    recomputeBehavior();
  }, [physAgg, verbAgg, destruct, selectedTriggers, sibFreq, sibSev, selectedBodySites]);

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

  const recomputeBehavior = async () => {
    try {
      const resp = await clinicalTestApi.runEchaEcaa({
        physical_aggression: physAgg,
        verbal_aggression: verbAgg,
        property_destruction: destruct,
        triggers: selectedTriggers,
        sib_frequency: sibFreq,
        sib_severity: sibSev,
        body_locations: selectedBodySites,
      });
      setBehaviorResult(resp);
      setClinicalNotes(resp.diagnostic_summary || '');
    } catch (e) {
      console.error('ECHA/ECAA calculation error:', e);
    }
  };

  const toggleTrigger = (trig) => {
    setSelectedTriggers((prev) =>
      prev.includes(trig) ? prev.filter((t) => t !== trig) : [...prev, trig]
    );
    soundEngine.playTone(500, 0.03);
  };

  const toggleBodySite = (site) => {
    setSelectedBodySites((prev) =>
      prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site]
    );
    soundEngine.playTone(500, 0.03);
  };

  const setPreset = (type) => {
    if (type === 'mild') {
      setPhysAgg(1); setVerbAgg(1); setDestruct(0);
      setSibFreq(0); setSibSev(0);
      setSelectedTriggers(['الإحباط عند المنع أو رفض طلب']);
      setSelectedBodySites([]);
    } else if (type === 'crisis_sib') {
      setPhysAgg(3); setVerbAgg(2); setDestruct(3);
      setSibFreq(3); setSibSev(3);
      setSelectedTriggers(['الضوضاء والحمل الحسي المفرط', 'تغيير الروتين أو الانتقال بين الأنشطة']);
      setSelectedBodySites([
        'الرأس والجبين (Coups de tête sur objets/murs)',
        'اليدين والمعصمين (Morsures des mains)',
      ]);
    }
    soundEngine.playTone(600, 0.05);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const pId = patientId || selectedPatientId;
    if (!pId) {
      alert('يرجى اختيار مريض لربط تقييم السلوك التحدي ECHA/ECAA بملفه السريري');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        test_code: 'ECHA_ECAA',
        calculated_total_score: (behaviorResult?.echa_total || 0) + (behaviorResult?.ecaa_total || 0),
        subscale_scores: {
          echa_total: { name: 'مقياس العدوانية تجاه الغير (ECHA)', raw: `${behaviorResult?.echa_total} / 12`, interpretation: behaviorResult?.echa_label_ar },
          ecaa_total: { name: 'مقياس إيذاء الذات (ECAA)', raw: `${behaviorResult?.ecaa_total} / 8`, interpretation: behaviorResult?.ecaa_label_ar },
          triggers: { name: 'المثيرات السلوكية السائدة', raw: selectedTriggers.join('، ') || 'لا توجد مثيرات محددة' },
          body_sites: { name: 'المواضع الجسدية المستهدفة بإيذاء الذات', raw: selectedBodySites.join('، ') || 'لا توجد إصابات ذاتية' },
          critical_alert: { name: 'حالة الإنذار السريري للسلامة', raw: behaviorResult?.ecaa_critical_alert ? '🚨 إنذار حرج فعال' : 'مستوى آمن ✅' },
        },
        raw_responses: { physAgg, verbAgg, destruct, selectedTriggers, sibFreq, sibSev, selectedBodySites },
        notes: clinicalNotes,
      };

      const resp = await clinicalTestApi.saveSession(pId, payload);
      soundEngine.playSuccessSound();
      setSavedAssessment(resp.assessment);
      if (onSaved) onSaved(resp.assessment);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ تقييم ECHA/ECAA');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-600 flex items-center justify-center text-white font-black shadow-lg shadow-red-600/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h3 className="text-base font-black text-white">
                سلالم تقييم السلوكيات العدوانية وإيذاء الذات (ECHA / ECAA DZ)
              </h3>
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20">
                J.L. Adrien & C. Barthélémy
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              التقييم السريري للسلوك العدواني تجاه الغير (ECHA) وسلوك إيذاء الذات (ECAA) وتتبع المثيرات ومواضع الإصابة.
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
          {/* Patient Selector & Preset Profiles */}
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
                <User className="w-4 h-4 text-rose-400" />
                <span className="font-bold">المريض:</span>
                <span className="text-white font-bold">{patientName || `#${patientId}`}</span>
              </div>
            )}

            {/* Quick Demo Profiles */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <button
                type="button"
                onClick={() => setPreset('mild')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
              >
                سلوك هادئ / خفيف
              </button>
              <button
                type="button"
                onClick={() => setPreset('crisis_sib')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/30"
              >
                أزمة حادة وإيذاء ذات
              </button>
            </div>
          </div>

          {/* REAL-TIME BEHAVIOR THREAT & SIB SAFETY HERO BANNER */}
          {behaviorResult && (
            <div className={`p-5 rounded-3xl border space-y-4 shadow-xl transition-all ${
              behaviorResult.ecaa_critical_alert
                ? 'bg-gradient-to-r from-slate-950 via-red-950/60 to-slate-950 border-red-500 animate-pulse'
                : 'bg-gradient-to-r from-slate-950 via-rose-950/30 to-slate-950 border-rose-500/30'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className={`px-5 py-2.5 rounded-2xl font-mono font-black text-2xl shadow-lg ${
                    behaviorResult.ecaa_critical_alert
                      ? 'bg-red-600 text-white shadow-red-600/50'
                      : 'bg-amber-600 text-white shadow-amber-600/30'
                  }`}>
                    {behaviorResult.ecaa_critical_alert ? '🚨 ALERT' : 'STATUS OK'}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">مؤشر السلامة والتقييم الوظيفي للسلوك:</span>
                    <strong className="text-base font-black text-white block">
                      {behaviorResult.ecaa_critical_alert ? behaviorResult.ecaa_label_ar : behaviorResult.echa_label_ar}
                    </strong>
                    <span className="text-xs text-slate-400">
                      العدوانية تجاه الغير (ECHA): <strong className="text-amber-400 font-mono font-bold">{behaviorResult.echa_total}/12</strong> | إيذاء الذات (ECAA): <strong className="text-rose-400 font-mono font-bold">{behaviorResult.ecaa_total}/8</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">المثيرات:</span>
                    <span className="text-sky-400 font-mono font-bold text-xs">{selectedTriggers.length} محفزات</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 block">مواضع الإصابة:</span>
                    <span className="text-rose-400 font-mono font-bold text-xs">{selectedBodySites.length} مناطق</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DUAL DOMAIN TABS: ECHA (HETERO) vs ECAA (AUTO) */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('echa')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse ${
                  activeTab === 'echa'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>1. السلوك العدواني تجاه الغير (ECHA - Hétéro-Agressivité)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ecaa')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 space-x-reverse ${
                  activeTab === 'ecaa'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>2. سلوكيات إيذاء الذات (ECAA - Auto-Agressivité / SIB)</span>
              </button>
            </div>

            {/* TAB 1: ECHA (HETERO-AGGRESSION) */}
            {activeTab === 'echa' && (
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-5 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Physical Aggression */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-bold">الاعتداء الجسدي (ضرب، عض، ركل):</span>
                      <span className="font-mono text-amber-300 font-bold">{physAgg} / 4</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      value={physAgg}
                      onChange={(e) => setPhysAgg(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      {['0: منعدم', '1: نادر جداً', '2: متكرر أسبوعياً', '3: متكرر يومياً', '4: شديد ومستمر'][physAgg]}
                    </span>
                  </div>

                  {/* Verbal Aggression */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-bold">العدوان اللفظي (صراخ، شتم):</span>
                      <span className="font-mono text-amber-300 font-bold">{verbAgg} / 4</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      value={verbAgg}
                      onChange={(e) => setVerbAgg(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      {['0: منعدم', '1: نادر جداً', '2: متكرر أسبوعياً', '3: متكرر يومياً', '4: صراخ حاد مستمر'][verbAgg]}
                    </span>
                  </div>

                  {/* Property Destruction */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-bold">تخريب الممتلكات ورمي الأشياء:</span>
                      <span className="font-mono text-amber-300 font-bold">{destruct} / 4</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      value={destruct}
                      onChange={(e) => setDestruct(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      {['0: منعدم', '1: رمي طفيف', '2: كسر ألعاب', '3: تدمير أثاث', '4: تخريب خطر وشامل'][destruct]}
                    </span>
                  </div>
                </div>

                {/* Triggers Selector */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>المثيرات والمحفزات السلوكية الشائعة (Déclencheurs):</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TRIGGERS.map((trig) => {
                      const isSelected = selectedTriggers.includes(trig);
                      return (
                        <button
                          key={trig}
                          type="button"
                          onClick={() => toggleTrigger(trig)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse ${
                            isSelected
                              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{trig}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ECAA (AUTO-AGGRESSION / SIB) */}
            {activeTab === 'ecaa' && (
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-5 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SIB Frequency */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-400 font-bold">وتيرة وتكرار إيذاء الذات (Fréquence):</span>
                      <span className="font-mono text-red-300 font-bold">{sibFreq} / 4</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      value={sibFreq}
                      onChange={(e) => setSibFreq(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      {['0: منعدم', '1: نادر (نوبة شهرية)', '2: أسبوعي', '3: يومي', '4: عدة نوبات يومياً'][sibFreq]}
                    </span>
                  </div>

                  {/* SIB Severity */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-400 font-bold">شدة الإصابة والخطورة الجسدية (Gravité):</span>
                      <span className="font-mono text-red-300 font-bold">{sibSev} / 4</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      value={sibSev}
                      onChange={(e) => setSibSev(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      {['0: لا توجد آثار', '1: احمرار طفيف مؤقت', '2: كدمات سطحية', '3: جروح ونزيف يتطلب إسعافاً', '4: إصابات خطرة تهدد الأنسجة'][sibSev]}
                    </span>
                  </div>
                </div>

                {/* Body Site Location Tagger */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span>المواضع الجسدية المستهدفة بإيذاء الذات (Localisation Corporelle):</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_BODY_SITES.map((site) => {
                      const isSelected = selectedBodySites.includes(site);
                      return (
                        <button
                          key={site}
                          type="button"
                          onClick={() => toggleBodySite(site)}
                          className={`p-3 rounded-2xl text-xs font-bold transition-all text-right flex items-center justify-between ${
                            isSelected
                              ? 'bg-red-600/30 text-red-200 border border-red-500/50 shadow-md'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          <span>{site}</span>
                          {isSelected && <Check className="w-4 h-4 text-red-400 shrink-0 mr-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Clinical Summary Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block flex items-center space-x-1.5 space-x-reverse">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>الخلاصة الإكلينيكية وخطة التدخل السلوكي الوظيفي (Synthèse ECHA/ECAA):</span>
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-red-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPreset('mild')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1 space-x-reverse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط للمستوى الهادئ</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-xl shadow-red-600/30 flex items-center space-x-2 space-x-reverse transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري حفظ التقييم السلوكي...' : 'اعتماد تقرير السلوك التحدي ECHA/ECAA 💾'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* CONFIRMATION & 1-CLICK A4 BILAN PRINT EXPORT */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-red-500/20 border border-red-500/30 mx-auto flex items-center justify-center text-red-400 shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">
              تم توثيق تقييم السلوك التحدي ECHA/ECAA بنجاح! 🎉
            </h3>
            <p className="text-xs text-slate-300">
              تم تسجيل مؤشرات العدوانية تجاه الغير وإيذاء الذات وتوثيق المثيرات ومواضع الإصابة.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-around">
            <div>
              <span className="text-slate-500 block text-[10px]">العدوانية للغير:</span>
              <strong className="text-amber-400 text-base font-black font-mono">
                {behaviorResult?.echa_total} / 12
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">إيذاء الذات:</span>
              <strong className="text-rose-400 text-base font-black font-mono">
                {behaviorResult?.ecaa_total} / 8
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">حالة الإنذار:</span>
              <span className={behaviorResult?.ecaa_critical_alert ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {behaviorResult?.ecaa_critical_alert ? '🚨 إنذار حرج' : 'مستوى آمن'}
              </span>
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
              <span>تطبيق تقييم جديد</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
