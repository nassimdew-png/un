import React from 'react';
import {
  Languages,
  Brain,
  Activity,
  Smile,
  Frown,
  Meh,
  Scale,
  ShieldAlert,
  Zap,
  Check,
  Plus,
  Sparkles,
  HeartPulse,
  Eye,
  CheckCircle2,
  FileText,
} from 'lucide-react';

// ==========================================
// 1. ORTHOPHONY WORKSPACE COMPONENT
// ==========================================
export function OrthophonyWorkspaceSection({
  orthoBucco,
  setOrthoBucco,
  orthoTargetSound,
  setOrthoTargetSound,
  orthoSoundPosition,
  setOrthoSoundPosition,
  orthoErrorType,
  setOrthoErrorType,
  orthoFluencyType,
  setOrthoFluencyType,
  orthoSecondaryBehaviors,
  setOrthoSecondaryBehaviors,
  onInsertIntoSoap,
}) {
  const commonSounds = ['/ر/', '/س/', '/ش/', '/ك/', '/ل/', '/ج/', '/ص/', '/ط/', '/ق/', '/ت/'];

  return (
    <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/30 border border-teal-500/30 shadow-xl space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-teal-500/20">
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
              <span>فحص وتقييم الأرطوفونيا المتخصص (Bilan Bucco-Phonatoire & Articulation)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Orthophonie
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              الفحص العضوي والوظيفي لأعضاء النطق، الفونيمات المستهدفة، واضطرابات الطلاقة والصوت
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onInsertIntoSoap}
          className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-md shadow-teal-600/20 transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>📥 إدراج الفحص في الملاحظات السريرية (Objective)</span>
        </button>
      </div>

      {/* 3 Clinical Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
        {/* Block A: Examen Bucco-Phonatoire */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-teal-300 flex items-center space-x-1.5 space-x-reverse">
              <span>1. فحص أعضاء النطق (Bucco-Phonatoire)</span>
            </span>
            <span className="text-[10px] text-slate-500">حركية ووظيفة</span>
          </div>

          {/* Lips */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">الشفتين (Lèvres):</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'normal', label: 'طبيعية' },
                { id: 'hypotonia', label: 'ارتخاء عضلي' },
                { id: 'hypertonia', label: 'شد وانقباض' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOrthoBucco({ ...orthoBucco, lips: opt.id })}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    orthoBucco.lips === opt.id
                      ? 'bg-teal-600 text-white border-teal-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tongue */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">اللسان (Langue):</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'normal', label: 'حركة حرة' },
                { id: 'short_frenulum', label: 'لجام قصير' },
                { id: 'apraxia', label: 'صعوبة رفع' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOrthoBucco({ ...orthoBucco, tongue: opt.id })}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    orthoBucco.tongue === opt.id
                      ? 'bg-teal-600 text-white border-teal-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Soft Palate */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">الحنك واللهاة (Voile):</span>
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'normal', label: 'سليم وإغلاق تام' },
                { id: 'cleft_or_insufficiency', label: 'قصور رخوي (خنف)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOrthoBucco({ ...orthoBucco, palate: opt.id })}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    orthoBucco.palate === opt.id
                      ? 'bg-teal-600 text-white border-teal-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Respiration */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">نمط التنفس (Respiration):</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'abdominal', label: 'بطني حجابي' },
                { id: 'thoracic', label: 'صدري سطحي' },
                { id: 'mouth', label: 'تنفس فموي' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOrthoBucco({ ...orthoBucco, respiration: opt.id })}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    orthoBucco.respiration === opt.id
                      ? 'bg-teal-600 text-white border-teal-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Block B: Target Phoneme & Articulation */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-cyan-300 flex items-center space-x-1.5 space-x-reverse">
              <span>2. الفونيم ومخارج الحروف (Phonèmes)</span>
            </span>
            <span className="text-[10px] text-slate-500">نطق ومقاطع</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">الصوت المستهدف:</span>
            <div className="flex flex-wrap gap-1">
              {commonSounds.map((snd) => (
                <button
                  key={snd}
                  type="button"
                  onClick={() => setOrthoTargetSound(snd)}
                  className={`w-8 h-8 rounded-lg font-mono font-bold text-xs border transition-all ${
                    orthoTargetSound === snd
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {snd}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">موضع الصوت في الكلمة:</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'initial', label: 'بداية الكلمة' },
                { id: 'medial', label: 'وسط الكلمة' },
                { id: 'final', label: 'نهاية الكلمة' },
              ].map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setOrthoSoundPosition(pos.id)}
                  className={`py-1 px-1 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    orthoSoundPosition === pos.id
                      ? 'bg-cyan-600 text-white border-cyan-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">نوع الاضطراب النطقي (Type d'erreur):</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'distortion', label: 'تشويه (Distorsion)' },
                { id: 'omission', label: 'حذف (Omission)' },
                { id: 'substitution', label: 'إبدال (Substitution)' },
              ].map((err) => (
                <button
                  key={err.id}
                  type="button"
                  onClick={() => setOrthoErrorType(err.id)}
                  className={`py-1 px-1 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    orthoErrorType === err.id
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {err.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Block C: Fluency, Voice & Stuttering */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-amber-300 flex items-center space-x-1.5 space-x-reverse">
              <span>3. الطلاقة والتأتأة (Bégaiement & Voix)</span>
            </span>
            <span className="text-[10px] text-slate-500">إيقاع الكلام</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">نمط التلعثم السائد:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'none', label: 'طلاقة طبيعية' },
                { id: 'repetition', label: 'تكرار مقاطع' },
                { id: 'prolongation', label: 'إطالة أصوات' },
                { id: 'block', label: 'احتباس وقفل حنجري' },
              ].map((fl) => (
                <button
                  key={fl.id}
                  type="button"
                  onClick={() => setOrthoFluencyType(fl.id)}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    orthoFluencyType === fl.id
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {fl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center space-x-2 space-x-reverse cursor-pointer p-2 rounded-xl bg-slate-900 border border-slate-800">
              <input
                type="checkbox"
                checked={orthoSecondaryBehaviors}
                onChange={(e) => setOrthoSecondaryBehaviors(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span className="text-slate-300 text-[11px] font-bold">
                سلوكيات حركية ثانوية مصاحبة (رمش، شد الرقبة، تشنج)
              </span>
            </label>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed">
            💡 نصيحة سريرية: استخدم أداة <strong className="text-amber-300">ميترونوم الطلاقة</strong> في الشريط العلوي لتدريب المريض على الإيقاع الهادئ والتنفس الحجابي المستمر.
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. PSYCHOLOGY WORKSPACE COMPONENT
// ==========================================
export function PsychologyWorkspaceSection({
  psychAffect,
  setPsychAffect,
  psychInterview,
  setPsychInterview,
  psychTest,
  setPsychTest,
  psychTechnique,
  setPsychTechnique,
  onInsertIntoSoap,
}) {
  const commonDefenseMechanisms = [
    { id: 'rationalization', label: 'التبرير (Rationalisation)' },
    { id: 'projection', label: 'الإسقاط (Projection)' },
    { id: 'regression', label: 'النكوص (Régression)' },
    { id: 'repression', label: 'الكبت (Refoulement)' },
    { id: 'denial', label: 'الإنكار (Déni)' },
  ];

  const toggleDefense = (defId) => {
    const list = psychInterview.defenseMechanisms || [];
    if (list.includes(defId)) {
      setPsychInterview({ ...psychInterview, defenseMechanisms: list.filter((x) => x !== defId) });
    } else {
      setPsychInterview({ ...psychInterview, defenseMechanisms: [...list, defId] });
    }
  };

  return (
    <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 border border-purple-500/30 shadow-xl space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
              <span>الفحص والتقييم النفسي العيادي والسلوكي (Évaluation Psychologique & Clinique)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Psychologie
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              الحالة الانفعالية والسلوكية، المقابلة العيادية، المقاييس النفسية، واستراتيجيات CBT / ABA
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onInsertIntoSoap}
          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-md shadow-purple-600/20 transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>📥 إدراج الفحص في الملاحظات السريرية (Objective)</span>
        </button>
      </div>

      {/* 3 Clinical Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
        {/* Block A: Affect, Mood & Therapeutic Alliance */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-purple-300 flex items-center space-x-1.5 space-x-reverse">
              <span>1. الحالة الانفعالية والمزاج (Humeur & Affect)</span>
            </span>
            <span className="text-[10px] text-slate-500">المظهر والسلوك</span>
          </div>

          {/* Mood */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">المزاج السائد (Humeur):</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {[
                { id: 'euthymic', label: 'مستقر ومتزن' },
                { id: 'anxious', label: 'قلق ومتوتر' },
                { id: 'depressed', label: 'حزين ومكتئب' },
                { id: 'euphoric', label: 'منشرح مفرط' },
                { id: 'irritable', label: 'متهيج وسريع الغضب' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPsychAffect({ ...psychAffect, mood: m.id })}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    psychAffect.mood === m.id
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alliance */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">التحالف العلاجي (Alliance):</span>
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'cooperative', label: 'تعاون ممتاز ومتفاعل' },
                { id: 'guarded', label: 'متحفظ وخائف' },
                { id: 'resistant', label: 'مقاوم ورافض' },
                { id: 'passive', label: 'سلبي ومتردد' },
              ].map((al) => (
                <button
                  key={al.id}
                  type="button"
                  onClick={() => setPsychAffect({ ...psychAffect, alliance: al.id })}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    psychAffect.alliance === al.id
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {al.label}
                </button>
              ))}
            </div>
          </div>

          {/* Eye Contact */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">التواصل البصري ولغة الجسد:</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'good', label: 'طبيعي ومستمر' },
                { id: 'fleeting', label: 'متقطع' },
                { id: 'avoidant', label: 'تجنب كلي' },
              ].map((ec) => (
                <button
                  key={ec.id}
                  type="button"
                  onClick={() => setPsychAffect({ ...psychAffect, eyeContact: ec.id })}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    psychAffect.eyeContact === ec.id
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {ec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Insight */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">الاستبصار بالمشكلة (Insight):</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'full', label: 'وعي واستبصار كامل' },
                { id: 'partial', label: 'استبصار جزئي' },
                { id: 'denial', label: 'إنكار تام' },
              ].map((ins) => (
                <button
                  key={ins.id}
                  type="button"
                  onClick={() => setPsychInterview({ ...psychInterview, insight: ins.id })}
                  className={`py-1 px-1.5 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    psychInterview.insight === ins.id
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {ins.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Block B: Psychometric Scales & Tests */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-indigo-300 flex items-center space-x-1.5 space-x-reverse">
              <span>2. المقاييس والاختبارات النفسية (Tests)</span>
            </span>
            <span className="text-[10px] text-slate-500">رصد الدرجات</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">المقياس المطبق في الجلسة:</span>
            <select
              value={psychTest.testName}
              onChange={(e) => setPsychTest({ ...psychTest, testName: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-bold text-xs"
            >
              <option value="Conners (فرط الحركة وتشتت الانتباه TDAH)">Conners (فرط الحركة وتشتت الانتباه TDAH)</option>
              <option value="CARS (مقياس تقدير التوحد الطفولي)">CARS (مقياس تقدير التوحد الطفولي)</option>
              <option value="GAD-7 (مقياس اضطراب القلق العام)">GAD-7 (مقياس اضطراب القلق العام)</option>
              <option value="Beck (مقياس الاكتئاب)">Beck (مقياس الاكتئاب)</option>
              <option value="WISC-V (مقياس وكسلر لذكاء الأطفال)">WISC-V (مقياس وكسلر لذكاء الأطفال)</option>
              <option value="Vineland-II (مقياس السلوك التكيفي)">Vineland-II (مقياس السلوك التكيفي)</option>
              <option value="اختبار إسقاطي أو استبيان مخصص">اختبار إسقاطي أو استبيان مخصص</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">الدرجة الخام / النسبة:</span>
              <input
                type="text"
                value={psychTest.score}
                onChange={(e) => setPsychTest({ ...psychTest, score: e.target.value })}
                placeholder="مثلاً: 28 أو 85%"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-white font-mono font-bold text-xs"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">الدلالة الإكلينيكية:</span>
              <select
                value={psychTest.interpretation}
                onChange={(e) => setPsychTest({ ...psychTest, interpretation: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-indigo-300 font-bold text-xs"
              >
                <option value="normal">طبيعي (Normal)</option>
                <option value="mild">خفيف (Léger)</option>
                <option value="moderate">متوسط (Modéré)</option>
                <option value="severe">شديد دال (Sévère)</option>
              </select>
            </div>
          </div>

          <div className="pt-1">
            <span className="text-[11px] text-slate-400 block mb-1.5">آليات الدفاع الملاحظة (Mécanismes):</span>
            <div className="flex flex-wrap gap-1">
              {commonDefenseMechanisms.map((def) => {
                const active = (psychInterview.defenseMechanisms || []).includes(def.id);
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => toggleDefense(def.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {active ? '✓ ' : '+ '} {def.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Block C: Interventions CBT / ABA */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-pink-300 flex items-center space-x-1.5 space-x-reverse">
              <span>3. التقنية العلاجية (Interventions CBT/ABA)</span>
            </span>
            <span className="text-[10px] text-slate-500">التدخل الميداني</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">التقنية المعتمدة في الجلسة:</span>
            <div className="space-y-1">
              {[
                { id: 'cbt_restructuring', label: 'إعادة الهيكلة المعرفية (Restructuration CBT)' },
                { id: 'aba_reinforcement', label: 'التعزيز السلوكي واللوحة الرمزية (ABA)' },
                { id: 'exposure', label: 'التعريض التدريجي وإزالة الحساسية (Exposition)' },
                { id: 'play_therapy', label: 'العلاج باللعب الإسقاطي والتفريغ (Jeu)' },
                { id: 'relaxation', label: 'الاسترخاء العضلي والتنفس الهادئ (Relaxation)' },
              ].map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => setPsychTechnique(tech.id)}
                  className={`w-full py-1.5 px-2.5 rounded-xl text-[11px] font-bold text-start border flex items-center justify-between transition-all ${
                    psychTechnique === tech.id
                      ? 'bg-pink-600 text-white border-pink-400 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{tech.label}</span>
                  {psychTechnique === tech.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed">
            💡 التوثيق النفسي: يتم دمج استجابة المريض والمقاييس تلقائياً داخل خانة <strong className="text-pink-300">Objective</strong> لتوفير وقت المعالج.
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. PSYCHOMOTRICITY WORKSPACE COMPONENT
// ==========================================
export function PsychomotricityWorkspaceSection({ motorState, setMotorState, onInsertIntoSoap }) {
  return (
    <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 border border-emerald-500/30 shadow-xl space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
              <span>فحص وتقييم التأهيل النفسي الحركي (Bilan Psychomoteur & Tonus)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Psychomotricité
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              المخطط الجسمي، الجانبية، التوازن، والحركية الدقيقة والتنظيم المكاني الزماني
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onInsertIntoSoap}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-md shadow-emerald-600/20 transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>📥 إدراج الفحص في الملاحظات السريرية (Objective)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
        {/* Schéma Corporel & Latéralité */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <span className="font-black text-emerald-300 block">1. المخطط الجسمي والجانبية</span>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">المخطط الجسمي:</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'good', label: 'سليم وواعٍ' },
                { id: 'in_progress', label: 'قيد النضج' },
                { id: 'deficit', label: 'اضطراب وصعوبة' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMotorState({ ...motorState, bodySchema: opt.id })}
                  className={`py-1 px-1 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    motorState.bodySchema === opt.id
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">الجانبية (Latéralité):</span>
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'right_handed', label: 'يمينية متجانسة' },
                { id: 'left_handed', label: 'يسارية متجانسة' },
                { id: 'cross_lateral', label: 'متصالبة (Croisée)' },
                { id: 'undefined', label: 'غير مستقرة' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMotorState({ ...motorState, lateralization: opt.id })}
                  className={`py-1 px-1 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    motorState.lateralization === opt.id
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Balance & Coordination */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <span className="font-black text-teal-300 block">2. التوازن والحركية الدقيقة</span>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">التوازن العام (Équilibre):</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'stable', label: 'ثابت وممتاز' },
                { id: 'unsteady', label: 'ترنح وضعف' },
                { id: 'clumsy', label: 'خرق ملحوظ' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMotorState({ ...motorState, balance: opt.id })}
                  className={`py-1 px-1 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    motorState.balance === opt.id
                      ? 'bg-teal-600 text-white border-teal-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">الحركية الدقيقة والقبض (Motricité Fine):</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'good', label: 'قبض سليم' },
                { id: 'dyspraxic', label: 'عسر حركي' },
                { id: 'tremorous', label: 'شد ورعشة' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMotorState({ ...motorState, fineMotor: opt.id })}
                  className={`py-1 px-1 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    motorState.fineMotor === opt.id
                      ? 'bg-teal-600 text-white border-teal-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Spatial-Temporal */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <span className="font-black text-cyan-300 block">3. التوجه المكاني والزماني</span>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">الإدراك الفراغي والزماني:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'oriented', label: 'منظم ومدرك للمفاهيم' },
                { id: 'disoriented', label: 'تشتت وصعوبة تنظيم' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMotorState({ ...motorState, spatialTemporal: opt.id })}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold text-center border transition-all ${
                    motorState.spatialTemporal === opt.id
                      ? 'bg-cyan-600 text-white border-cyan-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed">
            💡 التأهيل الحركي: تقييم التناسق العضلي والتوازن يسهم في بناء برامج علاجية مخصصة لصعوبات التعلم وعسر الكتابة (Dysgraphie).
          </div>
        </div>
      </div>
    </div>
  );
}
