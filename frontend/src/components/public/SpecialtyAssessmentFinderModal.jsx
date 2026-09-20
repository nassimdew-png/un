import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Search,
  X,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Activity,
  Layers,
  Award,
  Zap,
  ChevronLeft,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CLINICAL_CATEGORIES = [
  { id: 'all', nameAr: 'كافة المجالات السريرية' },
  { id: 'autism', nameAr: 'طيف التوحد والنمو العصبي (TSA)' },
  { id: 'speech_lang', nameAr: 'تأخر النطق واللغة (Orthophonie)' },
  { id: 'learning', nameAr: 'صعوبات التعلم وعسر القراءة (Dys)' },
  { id: 'cognitive_iq', nameAr: 'الذكاء والوظائف التنفيذية (IQ)' },
  { id: 'psychology', nameAr: 'القلق والاكتئاب والصدمات النفسية' },
  { id: 'behavior', nameAr: 'فرط الحركة وتشتت الانتباه (TDAH)' },
];

const CLINICAL_TOOLS = [
  {
    code: 'CARS_2',
    name: 'مقياس كارز-2 لتقييم التوحد (CARS-2)',
    category: 'autism',
    specialty: 'orthophonie_psy',
    ageRange: 'من سنتين فما فوق',
    duration: '20-30 دقيقة',
    tScores: true,
    description: 'المعيار الذهبي لتشخيص اضطراب طيف التوحد وتحديد شدته (خفيف، متوسط، شديد) مع حساب الدرجة الخام والتحويل المعياري التلقائي.',
    features: ['15 بُعداً سلوكياً وملاحظة عيادية', 'حساب آلي لمؤشر الشدة', 'تقرير إكلينيكي مفصل للولي والطبيب'],
    demoUrl: '/assessments',
    badge: 'مقنن ومطابق لـ DSM-5',
    color: 'emerald',
  },
  {
    code: 'BDI_II',
    name: 'مقياس بيك للاكتئاب (BDI-II DZ)',
    category: 'psychology',
    specialty: 'psychologie',
    ageRange: '13 سنة فما فوق (مراهقين وبالغين)',
    duration: '10-15 دقيقة',
    tScores: true,
    description: 'التقييم المقنن لشدة الاكتئاب وفق الدليل التشخيصي والإحصائي مع مؤشرات فورية لليقظة السريرية وخطورة التدهور المزاجي.',
    features: ['21 عنصراً عيادياً متدرجاً', 'كشف فوري لمؤشرات الخطر', 'مقارنة تطور النتائج عبر الجلسات'],
    demoUrl: '/assessments/run/bdi',
    badge: 'تنبيه أمني للسلامة السريرية',
    color: 'rose',
  },
  {
    code: 'CONNERS_3',
    name: 'مقياس كونرز-3 لفرط الحركة (Conners-3)',
    category: 'behavior',
    specialty: 'psychologie',
    ageRange: '6 إلى 18 سنة',
    duration: '15-20 دقيقة',
    tScores: true,
    description: 'تقييم متكامل لأعراض اضطراب نقص الانتباه مع فرط النشاط والاندفاعية من منظور الوالدين والمعلمين والأخصائي.',
    features: ['درجات معيارية T-Scores (متوسط 50، انحراف 10)', 'فحص التشتت والفرط الحركي والعناد', 'تصدير رسوم بيانية للملف المدرسي'],
    demoUrl: '/assessments',
    badge: 'مقياس ثلاثي الأطراف',
    color: 'amber',
  },
  {
    code: 'DYSLEXIA_DZ',
    name: 'بطارية تقييم عسر القراءة والتعلم (Dyslexia Suite)',
    category: 'learning',
    specialty: 'orthophonie',
    ageRange: 'المرحلة الابتدائية والمتوسطة (6-14 سنة)',
    duration: '25-35 دقيقة',
    tScores: true,
    description: 'حزمة إكلينيكية متخصصة لفحص مسار التهجئة، الوعي الفونولوجي، القراءة الصامتة والجهرية وسرعة المعالجة اللغوية.',
    features: ['اختبار طائر اللقلق (Alouette-R) المقنن', 'مصفوفة الفونولوجيا والأخطاء النطقية', 'خطة تدخل بيداغوجية علاجية فورية'],
    demoUrl: '/assessments/run/alouette',
    badge: 'معايرة لغوية ثنائية (عربي/فرنسي)',
    color: 'purple',
  },
  {
    code: 'WISC_V',
    name: 'مقياس وكسلر لذكاء الأطفال (WISC-V Explorer)',
    category: 'cognitive_iq',
    specialty: 'psychologie',
    ageRange: '6 إلى 16 سنة و 11 شهراً',
    duration: '45-60 دقيقة',
    tScores: true,
    description: 'المرجع العالمي لقياس القدرات المعرفية العامة وتحديد معامل الذكاء (FSIQ) والمؤشرات الأولية الخمسة.',
    features: ['الفهم اللفظي والذاكرة العاملة وسرعة المعالجة', 'الاستدلال السائل والبصري المكاني', 'منحنى التوزيع الطبيعي والتحليل المعياري'],
    demoUrl: '/assessments/run/wisc',
    badge: 'معامل ذكاء شامل (QI Total)',
    color: 'cyan',
  },
  {
    code: 'ELO_DZ',
    name: 'اختبار اللغة الشفهية المقنن (ELO-DZ Orthophonie)',
    category: 'speech_lang',
    specialty: 'orthophonie',
    ageRange: '3 إلى 8 سنوات',
    duration: '20 دقيقة',
    tScores: true,
    description: 'تقييم شامل للتركيب النحوي والمعجم اللغوي والفهم الشفهي ملائم للبيئة الثقافية واللغوية المغاربية.',
    features: ['فهم وتعبير تركيبي ومفردات مصورة', 'مقارنة دقيقة بالرتب المئينية للأقران', 'حصيلة أولية (Bilan Initial) بنقرة واحدة'],
    demoUrl: '/assessments/run/elo',
    badge: 'أساسي لكل عيادة تخاطب',
    color: 'indigo',
  },
  {
    code: 'VINELAND_II',
    name: 'مقياس فاينلاند للسلوك التكيفي (Vineland-II)',
    category: 'autism',
    specialty: 'multidisciplinary',
    ageRange: 'من الولادة حتى سن 90 سنة',
    duration: '30-45 دقيقة',
    tScores: true,
    description: 'تقييم الكفاءة الشخصية والاجتماعية في مهارات التواصل والحياة اليومية والتنشئة الاجتماعية والمهارات الحركية.',
    features: ['أداة مثالية لتشخيص الإعاقة النمائية وتحديد الدعم', 'مصفوفة الأهداف الفردية (PEI)', 'دعم المقابلة نصف الموجهة للوالدين'],
    demoUrl: '/assessments/run/vineland',
    badge: 'تخطيط التدخل الفردي PEI',
    color: 'teal',
  },
  {
    code: 'PECS_SOUND_CARDS',
    name: 'بنك بطاقات التواصل المعزز والتمارين (PECS & Articulation DZ)',
    category: 'speech_lang',
    specialty: 'orthophonie',
    ageRange: 'كافة الأعمار',
    duration: 'جلسات مستمرة وتدريب منزلي',
    tScores: false,
    description: 'أكثر من 500 بطاقة بصرية وصوتية عالية الدقة لنطق الحروف والأصوات ومفردات الحياة اليومية بالدارجة والعربية الفصحى.',
    features: ['توليد تسجيلات صوتية لنماذج النطق الصحيحة', 'إرسال واجبات منزلية تفاعلية لبوابة الأولياء', 'طباعة بطاقات مقننة ومصفوفات تمارين'],
    demoUrl: '/therapy/demo/naming',
    badge: 'وسائط علاجية تفاعلية',
    color: 'blue',
  },
  {
    code: 'SPEECH_ARTICULATION_MATRIX',
    name: 'مصفوفة تصحيح مخارج الحروف الفونولوجية (Articulation Matrix)',
    category: 'speech_lang',
    specialty: 'orthophonie',
    ageRange: 'الأطفال والبالغين (3 سنوات فما فوق)',
    duration: '15-20 دقيقة',
    tScores: true,
    description: 'أداة سريرية بصرية فائقة التخصص: تقييم عضوي وظيفي لأعضاء النطق والكلام، شجرة مخارج الحروف العربية والفرنسية في المواضع الثلاثة، وحساب آلي لنسبة دقة الحروف PCC ومصفوفة التمييز السمعي.',
    features: ['الفحص العضوي الوظيفي Bilan Bucco-Phonatoire', 'شجرة مخارج الحروف العربية والفرنسية وحساب PCC', 'مصفوفة التمييز السمعي للأزواج الصغرى المتقاربة'],
    demoUrl: '/speech-matrix',
    badge: 'بروتوكول أرطوفوني متكامل 🗣️',
    color: 'indigo',
  }
];

export default function SpecialtyAssessmentFinderModal({ isOpen, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredTools = CLINICAL_TOOLS.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative text-right font-sans">
        
        {/* Top Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h2 className="text-lg font-black text-white">مكتشف المقاييس والأدوات السريرية المقننة</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  30+ مقياساً إكلينيكياً
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تصفح أدوات التشخيص المقننة، الحصائل السريرية الآلية، وبطاريات القياس المعتمدة بالمنصة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/60 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المقياس، الاضطراب (توحد، عسر قراءة، اكتئاب)، أو الفئة العمرية..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
            {CLINICAL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap shrink-0 transition text-[11px] ${
                  selectedCategory === cat.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.nameAr}
              </button>
            ))}
          </div>
        </div>

        {/* Tools List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredTools.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Activity className="w-8 h-8 mx-auto text-slate-600" />
              <div className="text-sm font-bold text-slate-400">لم يتم العثور على مقاييس مطابقة لبحثك</div>
              <div className="text-xs text-slate-500">جرب كتابة مصطلح آخر مثل "نطق"، "توحد"، أو "اكتئاب"</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTools.map((tool) => (
                <div
                  key={tool.code}
                  className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-brand-500/40 transition flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-black text-white group-hover:text-brand-400 transition">
                        {tool.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20 whitespace-nowrap">
                        {tool.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {tool.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-400 font-mono">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
                        ⏳ {tool.duration}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
                        👶 {tool.ageRange}
                      </span>
                      {tool.tScores && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          📊 درجات معيارية T-Scores
                        </span>
                      )}
                    </div>

                    <ul className="space-y-1 pt-1 border-t border-slate-900">
                      {tool.features.map((feat, i) => (
                        <li key={i} className="text-[10px] text-slate-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-brand-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-900 text-xs">
                    <span className="text-[10px] text-slate-500 font-mono">{tool.code}</span>
                    <Link
                      to={tool.demoUrl}
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 transition text-[11px] font-bold flex items-center gap-1"
                    >
                      <span>تجربة المقياس</span>
                      <ChevronLeft className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 text-[11px]">
            جميع المقاييس معتمدة ومطابقة للمعايير الإكلينيكية الدولية مع تصدير تقارير Bilan جاهزة للطباعة.
          </span>
          <Link
            to="/register"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 hover:opacity-95 transition flex items-center gap-1.5 shrink-0"
          >
            <span>ابدأ تجربة المنصة بكافة المقاييس (14 يوماً مجاناً)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
