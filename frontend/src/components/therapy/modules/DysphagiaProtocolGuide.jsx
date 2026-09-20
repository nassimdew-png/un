import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  HelpCircle, 
  Layers, 
  Activity, 
  Heart, 
  Printer, 
  Sliders, 
  Clock, 
  Check, 
  Play, 
  RotateCcw, 
  FileText,
  Download
} from 'lucide-react';

export default function DysphagiaProtocolGuide({ patientId = null }) {
  const [activeTab, setActiveTab] = useState('maneuvers'); // 'maneuvers', 'postures', 'iddsi'
  const [selectedIddsiLevel, setSelectedIddsiLevel] = useState(4); // 0 to 7
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [repsCount, setRepsCount] = useState({});

  const maneuvers = [
    {
      id: 'mendelsohn',
      title_ar: 'مناورة مندلسون (Mendelsohn Maneuver)',
      title_fr: 'Manœuvre de Mendelsohn',
      target_hold_sec: 2,
      indication_ar: 'ضعف في رفع الحنجرة وتضيق العضلة العاصرة للمريء العلوي.',
      steps: [
        'تحسس تفاحة آدم بيدك أثناء البلع.',
        'عندما ترتفع الحنجرة لأعلى قمة، احبسها في الأعلى لمدة ثانيتين.',
        'أكمل عملية البلع واسترخِ.',
      ],
    },
    {
      id: 'masako',
      title_ar: 'تقنية ماساكو (Masako / Tongue-Hold)',
      title_fr: 'Technique de Masako',
      target_hold_sec: 0,
      indication_ar: 'تقوية الجدار البلعومي الخلفي وقاعدة اللسان.',
      steps: [
        'أخرج طرف لسانك قليلاً بين أسنانك وثبته بلطف دون عض شديد.',
        'ابلع ريقك وأنت ممسك بطرف اللسان بين الأسنان.',
        'أعد تكرار التمرين 5 مرات لتقوية عضلات البلعوم.',
      ],
    },
    {
      id: 'effortful',
      title_ar: 'البلع بمجهود وضغط عضلي (Effortful Swallow)',
      title_fr: 'Déglutition avec Effort',
      target_hold_sec: 0,
      indication_ar: 'ضعف في حركة قاعدة اللسان وبقاء بقايا الطعام في البلعوم.',
      steps: [
        'اجمع كل عضلات الحلق والفم بقوة.',
        'اضغط بلسانك على سقف الحلق بقوة واضغط اللقمة إلى أسفل.',
        'ابلع بشدة وكأنك تبتلع حبة كبيرة.',
      ],
    },
    {
      id: 'shaker',
      title_ar: 'تمرين شاكر لرفع الرأس (Shaker Head-Lift)',
      title_fr: 'Exercice de Shaker',
      target_hold_sec: 60,
      indication_ar: 'تقوية العضلات فوق اللامية وفتح مدخل المريء.',
      steps: [
        'استلقِ على ظهرك بشكل مستوٍ تماماً على السرير.',
        'ارفع رأسك فقط لتنظر إلى أصابع قدميك دون رفع الكتفين.',
        'اثبت لمدة 60 ثانية (تمرين متساوي القياس) أو كرر الرفع 30 مرة.',
      ],
    },
    {
      id: 'supraglottic',
      title_ar: 'البلع فوق المزماري (Supraglottic Swallow)',
      title_fr: 'Déglutition Supraglottique',
      target_hold_sec: 0,
      indication_ar: 'حماية مجرى التنفس وإغلاق الحبال الصوتية قبل وأثناء البلع.',
      steps: [
        'خذ نفساً عميقاً واحبسه بإحكام.',
        'ابلع اللقمة وأنت حابس لنفسك.',
        'اسعل بقوة فوراً بعد البلع لطرد أي بقايا، ثم ابلع مرة ثانية وتنفس.',
      ],
    },
  ];

  const postures = [
    {
      id: 'chin_tuck',
      title_ar: 'خفض الذقن نحو الصدر (Chin-Tuck Posture)',
      icon: '📐',
      desc_ar: 'خفض الذقن يضيق مدخل القصبة الهوائية، ويوسع الوادي البلعومي (Valleculae)، ويدفع قاعدة اللسان للخلف لحماية الرئتين من الشرقة.',
      benefit_ar: 'حماية الرئتين من دخول السوائل الخفيفة المتدفقة بسرعة.',
    },
    {
      id: 'head_turn',
      title_ar: 'تدوير الرأس نحو الجهة الضعيفة (Head Turn)',
      icon: '🔄',
      desc_ar: 'تدوير الرأس نحو جانب الشلل البلعومي يغلق الجيب الكمثري الضعيف ويوجه مسار اللقمة عبر الجانب السليم القوي.',
      benefit_ar: 'تجاوز الشلل النصفي البلعومي وتفادي تراكم بقايا الطعام.',
    },
    {
      id: 'head_tilt',
      title_ar: 'إمالة الرأس نحو الجهة السليمة (Head Tilt)',
      icon: '↗️',
      desc_ar: 'استخدام الجاذبية الأرضية لتمرير الطعام والشراب عبر النصف السليم من تجويف الفم والبلعوم.',
      benefit_ar: 'تعويض ضعف حركة اللسان أحادية الجانب.',
    },
  ];

  const iddsiLevels = [
    { level: 0, type: 'drink', name_ar: 'سوائل خفيفة (Thin)', desc_ar: 'ماء، شاي خفيف، حليب بدون مكثفات يتدفق بسرعة عالية.', color: 'bg-slate-800 border-slate-700 text-slate-200' },
    { level: 1, type: 'drink', name_ar: 'سميكة قليلاً (Slightly Thick)', desc_ar: 'أكثر كثافة من الماء وتتطلب جهداً خفيفاً للشرب بالمصاصة.', color: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200' },
    { level: 2, type: 'drink', name_ar: 'متوسطة الكثافة (Mildly Thick)', desc_ar: 'تتدفق من الملعقة كعصير المانجو أو الطماطم الطبيعي.', color: 'bg-teal-950/60 border-teal-500/40 text-teal-200' },
    { level: 3, type: 'both', name_ar: 'كثيفة / طعام مسال (Liquidised)', desc_ar: 'حساء مطحون ناعم لا يتطلب مضغاً، يؤكل بالملعقة أو يُشرب ببطء.', color: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' },
    { level: 4, type: 'both', name_ar: 'مهروس ناعم متجانس (Pureed)', desc_ar: 'بوريه متماسك يحتفظ بشكله على الملعقة دون كتل أو مضغ.', color: 'bg-amber-950/60 border-amber-500/40 text-amber-200' },
    { level: 5, type: 'food', name_ar: 'مفروم ورطب (Minced & Moist)', desc_ar: 'قطع صغيرة جداً لا تتجاوز 4 ملم للبالغين، رطبة بصلصة غنية.', color: 'bg-orange-950/60 border-orange-500/40 text-orange-200' },
    { level: 6, type: 'food', name_ar: 'طري وسهل المضغ (Soft & Bite-Sized)', desc_ar: 'قطع طرية بحجم 1.5 سم يمكن هرسها بالشوكة أو باللسان.', color: 'bg-purple-950/60 border-purple-500/40 text-purple-200' },
    { level: 7, type: 'food', name_ar: 'طعام عادي منتظم (Regular Diet)', desc_ar: 'كافة الأطعمة العادية بمختلف القوامات الصلبة والمقرمشة.', color: 'bg-blue-950/60 border-blue-500/40 text-blue-200' },
  ];

  const handleExportPdf = () => {
    const pId = patientId || 1;
    const token = localStorage.getItem('token') || '';
    const url = `/api/therapy/dysphagia/export-pdf/${pId}?token=${token}`;
    window.open(url, '_blank');
  };

  const handleIncrementRep = (mId) => {
    setRepsCount((prev) => ({
      ...prev,
      [mId]: (prev[mId] || 0) + 1,
    }));
  };

  const currentIddsi = iddsiLevels.find((lvl) => lvl.level === selectedIddsiLevel) || iddsiLevels[4];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 max-w-4xl mx-auto shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header & Print Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-orange-500 flex items-center justify-center text-white font-black shadow-lg shadow-rose-500/25">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              بروتوكولات ومناورات سلامة البلع (Dysphagia Safety Suite)
            </h3>
            <p className="text-xs text-slate-400">
              دليل المناورات السريرية، الوضعيات التعويضية، ومقياس القوام IDDSI للوقاية من الشرقة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportPdf}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs flex items-center space-x-2 space-x-reverse shadow-lg shadow-teal-600/25 transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>🖨️ طباعة إرشادات البلع للمنزل (PDF)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('maneuvers')}
          className={`py-2.5 rounded-xl font-black text-xs transition-all ${
            activeTab === 'maneuvers'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🛡️ 1. المناورات والتمارين (5)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('postures')}
          className={`py-2.5 rounded-xl font-black text-xs transition-all ${
            activeTab === 'postures'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📐 2. الوضعيات التعويضية
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('iddsi')}
          className={`py-2.5 rounded-xl font-black text-xs transition-all ${
            activeTab === 'iddsi'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🥣 3. مقياس القوام IDDSI
        </button>
      </div>

      {/* TAB 1: Maneuvers & Exercises */}
      {activeTab === 'maneuvers' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 gap-4">
            {maneuvers.map((m) => {
              const reps = repsCount[m.id] || 0;
              return (
                <div
                  key={m.id}
                  className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 shadow-inner"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{m.title_ar}</h4>
                      <span className="text-[11px] text-rose-400 font-bold">{m.title_fr}</span>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                        {reps} تكرار
                      </span>

                      <button
                        type="button"
                        onClick={() => handleIncrementRep(m.id)}
                        className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-xs font-black transition-all"
                      >
                        +1 تكرار
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800/80">
                    <strong className="text-amber-400">دواعي الاستخدام السريري:</strong> {m.indication_ar}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-black text-slate-400">خطوات التنفيذ للمريض:</div>
                    {m.steps.map((st, sIdx) => (
                      <div key={sIdx} className="flex items-start space-x-2 space-x-reverse text-xs text-slate-200">
                        <span className="w-4 h-4 rounded-full bg-rose-600/30 text-rose-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Compensatory Postures */}
      {activeTab === 'postures' && (
        <div className="space-y-4 animate-in fade-in">
          {postures.map((post) => (
            <div
              key={post.id}
              className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-2 shadow-inner"
            >
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <span className="text-2xl">{post.icon}</span>
                <h4 className="text-sm font-black text-white">{post.title_ar}</h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-2xl border border-slate-800">
                {post.desc_ar}
              </p>

              <div className="text-xs text-emerald-300 font-bold flex items-center space-x-1.5 space-x-reverse pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>الفائدة السريرية: {post.benefit_ar}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: IDDSI Interactive Slider & Texture Matrix */}
      {activeTab === 'iddsi' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Interactive IDDSI Slider Card */}
          <div className="p-6 rounded-3xl bg-slate-950 border-2 border-slate-800 space-y-4 text-center">
            <div className="text-xs font-black text-slate-400">حدد مستوى القوام لعرض التفاصيل السريرية:</div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2">
              <span>0 (سوائل خفيفة)</span>
              <span className="text-sm font-black font-mono text-amber-300">
                مستوى IDDSI الحالي: {selectedIddsiLevel}
              </span>
              <span>7 (طعام عادي)</span>
            </div>

            <input
              type="range"
              min="0"
              max="7"
              step="1"
              value={selectedIddsiLevel}
              onChange={(e) => setSelectedIddsiLevel(parseInt(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />

            {/* Current Selected Level Detail Card */}
            <div className={`p-5 rounded-3xl border-2 text-right space-y-2 ${currentIddsi.color}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black">{currentIddsi.name_ar}</h4>
                <span className="w-8 h-8 rounded-xl bg-black/40 font-mono font-black text-sm flex items-center justify-center">
                  L{currentIddsi.level}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{currentIddsi.desc_ar}</p>
            </div>
          </div>

          {/* Full Level Grid */}
          <div className="space-y-2">
            <div className="text-xs font-black text-slate-400">كافة مستويات مقياس IDDSI الدولي:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {iddsiLevels.map((lvl) => (
                <div
                  key={lvl.level}
                  onClick={() => setSelectedIddsiLevel(lvl.level)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${lvl.color} ${
                    selectedIddsiLevel === lvl.level ? 'ring-2 ring-white shadow-lg' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 space-x-reverse">
                    <span className="w-6 h-6 rounded-lg bg-black/40 font-mono font-black text-xs flex items-center justify-center shrink-0">
                      {lvl.level}
                    </span>
                    <div>
                      <div className="text-xs font-black">{lvl.name_ar}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
