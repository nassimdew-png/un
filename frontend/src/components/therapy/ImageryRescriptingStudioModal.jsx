import React, { useState, useMemo, useRef } from 'react';
import {
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  FileText,
  User,
  Search,
  Check,
  X,
  Layers,
  ArrowRight,
  Shield,
  Heart,
  Baby,
  Smile,
  AlertCircle
} from 'lucide-react';

export default function ImageryRescriptingStudioModal({
  isOpen,
  onClose,
  patient = null,
  patients = [],
  onInjectSoap = null,
}) {
  if (!isOpen) return null;

  const [selectedPatient, setSelectedPatient] = useState(patient || (patients.length > 0 ? patients[0] : null));
  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const pickerRef = useRef(null);

  // Active Protocol Phase: 1 (Original Scene) | 2 (Adult/Therapist Intervention) | 3 (Needs Fulfillment & Safe Conclusion)
  const [currentStep, setCurrentStep] = useState(1);

  // Schema Modes Activation Tracker
  const [activeSchemaModes, setActiveSchemaModes] = useState(['vulnerable_child', 'punitive_parent']);

  // Protocol Rescripting Data
  const [rescriptingData, setRescriptingData] = useState({
    // Phase 1
    childAge: '7 سنوات',
    originalSceneDescription: 'توبيخ شديد وصراخ في المنزل مع الشعور بالعجز والوحدة التامة.',
    coreEmotion: 'خوف شديد، خزي، شعور بالدونية',
    unmetNeed: 'الأمان، الاحتضان، والقبول غير المشروط',

    // Phase 2
    intervenor: 'adult_self', // 'adult_self' | 'therapist'
    interventionAction: 'دخول الذات البالغة الحكيمة إلى الغرفة، إيقاف الصراخ ووضع حد حازم للمعتدي، وحماية الطفل الصغير.',
    therapistBoundaryStatement: 'أنت في أمان الآن، لا أحد يستطيع إيذاءك مجدداً، لقد ارتكبوا خطأ وأنت لم تكن السبب.',

    // Phase 3
    soothingAction: 'احتضان الطفل الصغير وأخذه إلى مكان آمن وجميل وتقديم الرعاية والدفء.',
    newCoreBelief: 'أنا شخص ذو قيمة، أستحق الحماية والحب، وأنا بأمان في الحاضر.',
    postSessionSuds: 2, // 0 to 10
  });

  const schemaModesList = [
    { id: 'vulnerable_child', label: 'الطفل الضعيف/المتألم (Vulnerable Child)', color: 'border-rose-500/40 text-rose-300 bg-rose-950/20' },
    { id: 'angry_child', label: 'الطفل الغاضب (Angry Child)', color: 'border-amber-500/40 text-amber-300 bg-amber-950/20' },
    { id: 'punitive_parent', label: 'الوالد المعاقب/الناقد (Punitive Parent)', color: 'border-purple-500/40 text-purple-300 bg-purple-950/20' },
    { id: 'detached_protector', label: 'الحامي المنفصل/المتجنب (Detached Protector)', color: 'border-blue-500/40 text-blue-300 bg-blue-950/20' },
    { id: 'healthy_adult', label: 'البالغ الصحي الحكيم (Healthy Adult)', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20' },
  ];

  const toggleSchemaMode = (id) => {
    setActiveSchemaModes((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  // Inject into SOAP notes
  const handleInjectSoap = () => {
    const summary = `[جلسة إعادة كتابة السيناريو التخيلي ومخططات يانغ - Imagery Rescripting Protocol]:\n` +
      `- المشهد المبكر المستهدف: مشهد بسن (${rescriptingData.childAge}) - ${rescriptingData.originalSceneDescription}\n` +
      `- الحاجة النفسية غير المشبعة: ${rescriptingData.unmetNeed} | المشاعر المرصودة: ${rescriptingData.coreEmotion}\n` +
      `- نمط التدخل العلاجي: تدخل (${rescriptingData.intervenor === 'adult_self' ? 'الذات البالغة الحكيمة للمريض' : 'المعالج السريري'}) لوضع الحدود وحماية الطفل.\n` +
      `- سيناريو الاحتواء وتلبية الحاجات: ${rescriptingData.soothingAction}\n` +
      `- المعتقد الإيجابي الراسخ الجديد: "${rescriptingData.newCoreBelief}"\n` +
      `- تراجع الضيق الانفعالي بعد الجلسة إلى: ${rescriptingData.postSessionSuds}/10.`;

    if (onInjectSoap) {
      onInjectSoap({
        objective: summary,
        assessment: 'استجابة وجدانية عميقة لإعادة كتابة السيناريو وتفريغ الشحنة الصدمية للطفل الداخلي.',
      });
    }
    onClose();
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return patients;
    const q = patientSearchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const name = `${p.first_name || ''} ${p.last_name || ''} ${p.name || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [patients, patientSearchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans" dir="rtl">
      <div className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-purple-950/30 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white truncate">
                  مختبر إعادة بناء السيناريو التخيلي ومخططات يانغ (Imagery Rescripting)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Schema Therapy
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                إعادة معالجة ذكريات الطفولة المؤلمة، احتواء الطفل الداخلي وتصحيح المعتقدات الصادمة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Patient Selector */}
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setIsPatientPickerOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-xs font-bold text-slate-200 transition flex items-center gap-2 shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {selectedPatient ? `${selectedPatient.first_name || ''} ${selectedPatient.last_name || selectedPatient.name}` : 'اختر مريضاً...'}
                </span>
              </button>

              {isPatientPickerOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      placeholder="ابحث بالاسم..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="w-full pr-8 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setIsPatientPickerOpen(false);
                        }}
                        className="p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer hover:bg-slate-900 text-slate-300"
                      >
                        <span>{p.first_name} {p.last_name}</span>
                        {selectedPatient?.id === p.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-Step Guided Bar */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          {[
            { step: 1, title: 'المرحلة 1: استحضار المشهد والطفل الداخلي', icon: Baby },
            { step: 2, title: 'المرحلة 2: تدخل البالغ الصحي ووضع الحدود', icon: Shield },
            { step: 3, title: 'المرحلة 3: تلبية الحاجات والخاتمة الآمنة', icon: Heart },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStep(s.step)}
              className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                currentStep === s.step
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <s.icon className="w-4 h-4" />
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Active Schema Modes Selection */}
          <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-[11px] text-slate-400 font-bold block">الأنماط والمخططات المفعلة في جلسة اليوم (Schema Modes):</span>
            <div className="flex flex-wrap gap-2">
              {schemaModesList.map((mode) => {
                const isSelected = activeSchemaModes.includes(mode.id);
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => toggleSchemaMode(mode.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      isSelected
                        ? mode.color + ' shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 1: ORIGINAL SCENE & VULNERABLE CHILD */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-3xl bg-slate-950 border border-purple-500/20 space-y-4">
                <h3 className="text-xs font-black text-purple-300 uppercase flex items-center gap-2">
                  <Baby className="w-4 h-4 text-purple-400" />
                  <span>تفاصيل المشهد الصادم في مرحلة الطفولة:</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">سن الطفل التقريبي:</label>
                    <input
                      type="text"
                      value={rescriptingData.childAge}
                      onChange={(e) => setRescriptingData({ ...rescriptingData, childAge: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">الحاجة النفسية الأساسية المفقودة:</label>
                    <input
                      type="text"
                      value={rescriptingData.unmetNeed}
                      onChange={(e) => setRescriptingData({ ...rescriptingData, unmetNeed: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-bold">وصف المشهد المؤلم كما يتذكره المريض:</label>
                  <textarea
                    rows="3"
                    value={rescriptingData.originalSceneDescription}
                    onChange={(e) => setRescriptingData({ ...rescriptingData, originalSceneDescription: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <span>الانتقال لتدخل البالغ الصحي</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: HEALTHY ADULT / THERAPIST INTERVENTION */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-3xl bg-slate-950 border border-indigo-500/20 space-y-4">
                <h3 className="text-xs font-black text-indigo-300 uppercase flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>تدخل البالغ الصحي ووضع الحدود الحازمة للمعتدي:</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">من الذي يتدخل في المشهد التخيلي؟</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setRescriptingData({ ...rescriptingData, intervenor: 'adult_self' })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          rescriptingData.intervenor === 'adult_self'
                            ? 'bg-indigo-600/30 border-indigo-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        الذات البالغة الحكيمة للمريض (Adult Self)
                      </button>

                      <button
                        type="button"
                        onClick={() => setRescriptingData({ ...rescriptingData, intervenor: 'therapist' })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          rescriptingData.intervenor === 'therapist'
                            ? 'bg-purple-600/30 border-purple-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        المعالج السريري (Therapist Entry)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">سيناريو التدخل والحماية:</label>
                    <textarea
                      rows="3"
                      value={rescriptingData.interventionAction}
                      onChange={(e) => setRescriptingData({ ...rescriptingData, interventionAction: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">عبارة الطمأنة ووضع الحدود الموجهة للطفل والمعتدي:</label>
                    <input
                      type="text"
                      value={rescriptingData.therapistBoundaryStatement}
                      onChange={(e) => setRescriptingData({ ...rescriptingData, therapistBoundaryStatement: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    السابق
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <span>الانتقال لتلبية الحاجات والخاتمة</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: NEEDS FULFILLMENT & SAFE CONCLUSION */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-3xl bg-slate-950 border border-emerald-500/20 space-y-4">
                <h3 className="text-xs font-black text-emerald-300 uppercase flex items-center gap-2">
                  <Heart className="w-4 h-4 text-emerald-400" />
                  <span>تلبية الحاجات النفسية وتثبيت المعتقد الجديد:</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">سيناريو الاحتواء وتلبية رغبة الطفل الداخلي:</label>
                    <textarea
                      rows="3"
                      value={rescriptingData.soothingAction}
                      onChange={(e) => setRescriptingData({ ...rescriptingData, soothingAction: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">المعتقد الإيجابي الراسخ الجديد (New Core Belief):</label>
                    <input
                      type="text"
                      value={rescriptingData.newCoreBelief}
                      onChange={(e) => setRescriptingData({ ...rescriptingData, newCoreBelief: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-300 font-black focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-bold">مستوى الضيق المتبقي بعد التمرين (SUDS 0-10):</span>
                    <select
                      value={rescriptingData.postSessionSuds}
                      onChange={(e) => setRescriptingData({ ...rescriptingData, postSessionSuds: Number(e.target.value) })}
                      className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-bold font-mono"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>{n} / 10</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    السابق
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>بروتوكول العلاج بالمخططات والسيناريو التخيلي (Imagery Rescripting)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInjectSoap}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>حقن تقرير السيناريو التخيلي في SOAP ✨</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
