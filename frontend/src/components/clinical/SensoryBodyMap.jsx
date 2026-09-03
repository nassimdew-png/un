import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Ear,
  Eye,
  Hand,
  Volume2,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';

export const BODY_ZONES = [
  { id: 'eyes', label: 'العينان والوجه العلوي', label_fr: 'Yeux & Visage', tics: ['طرف العينين المتكرر (Clignements)', 'تكشير الوجه (Grimaces facials)', 'تثبيت النظر في الأضواء'], sensory: ['فرط تحسس بصري للضوء', 'بحث بصري عن الحركة الدائرية'] },
  { id: 'mouth_throat', label: 'الفم والحنجرة (الصوت والنطق)', label_fr: 'Bouche & Gorge', tics: ['تنحنح حنجري متكرر (Raclement)', 'أصوات لاإرادية / تكرار كلام (Écholalie)', 'صرير الأسنان (Bruxisme)', 'عض الشفاه'], sensory: ['انتقائية غذائية شديدة للملمس', 'حاجة مستمرة لوضع الأشياء بالفم'] },
  { id: 'head_neck', label: 'الرأس والرقبة', label_fr: 'Tête & Cou', tics: ['هز الرأس اللاإرادي (Secousses)', 'التأرجح بالأمام والخلف (Balancement)', 'إمالة الرقبة الفجائية'], sensory: ['حساسية شديدة لغسيل الشعر أو لمس الرأس'] },
  { id: 'shoulders', label: 'الكتفان وأعلى الصدر', label_fr: 'Épaules & Tronc', tics: ['رفع وهز الكتفين (Haussement)', 'تشنج عضلي لاإرادي في الجذع'], sensory: ['انزعاج من ياقات الملابس والملصقات (Étiquettes)'] },
  { id: 'hands_arms', label: 'اليدان والأصابع', label_fr: 'Mains & Bras', tics: ['رفرفة اليدين (Flapping / Battements)', 'فرقعة أو نقر الأصابع (Claquements)', 'هز الذراعين عند الفرح أو التوتر'], sensory: ['رفض لمس العجين والرمال والألوان', 'بحث عن ملامس ناعمة أو خشنة'] },
  { id: 'legs_feet', label: 'القدمان والساقان', label_fr: 'Jambes & Pieds', tics: ['المشي على أطراف الأصابع (Marche sur pointes)', 'ركل الساقين اللاإرادي', 'القفز المتكرر في المكان'], sensory: ['رفض انتعال الأحذية / الجوارب', 'بحث دهليزي عن القفز المستمر'] },
];

export const SENSORY_DOMAINS = [
  { id: 'auditory', label: 'السمعي (Auditif)', icon: Volume2, hyper: 'انزعاج شديد من الأصوات المرتفعة (مكنسة، خلاط، صراخ)', hypo: 'عدم الاستجابة لمناداته باسمه، البحث عن إصدار أصوات عالية' },
  { id: 'tactile', label: 'اللمسي (Tactile)', icon: Hand, hyper: 'رفض ملامسة قوام معين (الرمل، الماء، البلل، قص الشعر)', hypo: 'قلة الشعور بالألم أو درجات الحرارة، لمس كل شيء باستمرار' },
  { id: 'visual', label: 'البصري (Visuel)', icon: Eye, hyper: 'تغطية العينين في الإضاءة الساطعة، التشتت بالمحفزات البصرية', hypo: 'التحديق الطويل في الأضواء، تحريك الأصابع أمام العينين' },
  { id: 'vestibular', label: 'الدهليزي والحركي (Vestibulaire)', icon: Activity, hyper: 'خوف مفرط من المرتفعات أو الأراجيح أو فقدان التوازن', hypo: 'دوران مستمر حول النفس دون دوار، حركة دائمة وبحث عن التسلق' },
  { id: 'proprioceptive', label: 'العضلي المفصلي (Proprioceptif)', icon: Zap, hyper: 'تجنب الأنشطة البدنية والمجهود العضلي', hypo: 'الاصطدام بالأشياء، الحاجة لعناق وضغط عميق جداً' },
];

export default function SensoryBodyMap({
  patient,
  bodyMapData,
  onSave,
  readOnly = false,
}) {
  const [viewMode, setViewMode] = useState('tics'); // 'tics' vs 'sensory'
  const [selectedZone, setSelectedZone] = useState('eyes');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [data, setData] = useState(() => {
    return bodyMapData || {
      activeTics: [],
      sensoryProfile: {
        auditory: 'normal', // normal, hyper, hypo, mixed
        tactile: 'normal',
        visual: 'normal',
        vestibular: 'normal',
        proprioceptive: 'normal',
      },
      zoneNotes: {},
    };
  });

  const handleToggleTic = (ticName) => {
    if (readOnly) return;
    setData((prev) => {
      const exists = prev.activeTics?.includes(ticName);
      const updated = exists ? prev.activeTics.filter((t) => t !== ticName) : [...(prev.activeTics || []), ticName];
      return { ...prev, activeTics: updated };
    });
  };

  const handleSensoryChange = (domainId, status) => {
    if (readOnly) return;
    setData((prev) => ({
      ...prev,
      sensoryProfile: {
        ...prev.sensoryProfile,
        [domainId]: status,
      },
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(data);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const currentZoneObj = BODY_ZONES.find((z) => z.id === selectedZone) || BODY_ZONES[0];

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">خريطة الجسد والأعراض السريرية (Symptom & Sensory Body Map)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تحديد مواضع التشنجات والحركات النمطية (Tics / Stéréotypies) ورسم الملف الحسي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('tics')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'tics' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌀 الحركات النمطية والتشنجات (Tics)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sensory')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'sensory' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌈 الملف الحسي (Profil Sensoriel)
            </button>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center space-x-1.5 space-x-reverse px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition-all"
            >
              {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'تم الحفظ بنجاح ✓' : 'حفظ الخريطة'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Visual Body Map + Interactive Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Top: Interactive Anatomical Body Diagram */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative">
          <span className="text-[11px] font-bold text-slate-400 mb-4 block">
            انقر على منطقة الجسم لتحديد الأعراض المرتبطة بها:
          </span>

          {/* Anatomical Schematic Layout */}
          <div className="w-full max-w-[280px] space-y-2 py-4">
            {BODY_ZONES.map((zone) => {
              const isSelected = selectedZone === zone.id;
              const hasActiveTics = zone.tics.some((t) => data.activeTics?.includes(t));

              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZone(zone.id)}
                  className={`w-full p-3 rounded-2xl border text-start transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-cyan-600/20 border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : hasActiveTics
                      ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-400'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 space-x-reverse">
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        isSelected ? 'bg-cyan-400 ring-2 ring-cyan-400/50' : hasActiveTics ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {zone.label}
                      </div>
                      <div className="text-[10px] text-slate-500">{zone.label_fr}</div>
                    </div>
                  </div>

                  {hasActiveTics && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ⚠️ أعراض نشطة
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <span className="text-[11px] text-slate-500">
              مجموع الحركات والأعراض المسجلة: <strong className="text-cyan-300">{data.activeTics?.length || 0}</strong>
            </span>
          </div>
        </div>

        {/* Right: Zone Clinical Editor & Sensory Details */}
        <div className="lg:col-span-7 space-y-5">
          {viewMode === 'tics' ? (
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center space-x-2 space-x-reverse">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>الاضطرابات الحركية في: {currentZoneObj.label}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{currentZoneObj.label_fr}</p>
                </div>
              </div>

              {/* Tics Checkboxes */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-300 block">
                  الأعراض والحركات النمطية الملاحظة (Tics & Stéréotypies):
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {currentZoneObj.tics.map((tic) => {
                    const isActive = data.activeTics?.includes(tic);
                    return (
                      <button
                        key={tic}
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleToggleTic(tic)}
                        className={`p-3 rounded-2xl border text-start text-xs font-bold flex items-center justify-between transition-all ${
                          isActive
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{tic}</span>
                        <span
                          className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold border ${
                            isActive ? 'bg-amber-500 text-slate-950 border-amber-400' : 'border-slate-700 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clinical Note for this zone */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 mb-1.5">ملاحظات سريرية حول هذه المنطقة:</label>
                <textarea
                  rows={2}
                  disabled={readOnly}
                  value={data.zoneNotes?.[selectedZone] || ''}
                  onChange={(e) =>
                    setData({
                      ...data,
                      zoneNotes: { ...data.zoneNotes, [selectedZone]: e.target.value },
                    })
                  }
                  placeholder="ملاحظات حول وتيرة الظهور، المحفزات، أو القمع الإرادي..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600"
                />
              </div>
            </div>
          ) : (
            /* SENSORY PROFILE VIEW */
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-5">
              <div className="pb-3 border-b border-slate-800">
                <h4 className="text-xs font-black text-indigo-300 flex items-center space-x-2 space-x-reverse">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>الملف الحسي المعياري (Sensory Integration Profile)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  رصد استجابة الطفل للمدخلات الحسية (فرط تحسس Hyper / نقص تحسس Hypo)
                </p>
              </div>

              <div className="space-y-4">
                {SENSORY_DOMAINS.map((domain) => {
                  const Icon = domain.icon;
                  const currentStatus = data.sensoryProfile?.[domain.id] || 'normal';

                  return (
                    <div key={domain.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Icon className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-white">{domain.label}</span>
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-1.5">
                          {[
                            { id: 'normal', label: 'طبيعي', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                            { id: 'hyper', label: '🔴 فرط تحسس (Hyper)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
                            { id: 'hypo', label: '🟣 نقص / بحث (Hypo)', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                          ].map((opt) => {
                            const isChosen = currentStatus === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={readOnly}
                                onClick={() => handleSensoryChange(domain.id, opt.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                  isChosen ? opt.color : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Helper clinical descriptions */}
                      <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                        <div><strong className="text-rose-400">فرط التحسس:</strong> {domain.hyper}</div>
                        <div><strong className="text-purple-400">نقص التحسس:</strong> {domain.hypo}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
