import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  GraduationCap, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  Upload, 
  ArrowRight, 
  FileText, 
  School,
  ExternalLink,
  Lock,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { apiRequest } from '../../api';

export default function StudentHubView() {
  const { t } = useTranslation();
  const [universities, setUniversities] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [faculty, setFaculty] = useState('كلية العلوم الاجتماعية والإنسانية (قسم الأرطوفونيا وعلم النفس)');
  const [degreeLevel, setDegreeLevel] = useState('master_m2');
  const [specialty, setSpecialty] = useState('orthophonie');
  const [studentCardDoc, setStudentCardDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Success Result
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await apiRequest('/academic/tiers');
        if (res.success) {
          if (res.universities) setUniversities(res.universities);
          if (res.tiers) setTiers(res.tiers);
          if (res.universities && res.universities.length > 0) {
            setUniversityName(res.universities[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching academic tiers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTiers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('student_name', studentName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('university_name', universityName);
      formData.append('faculty', faculty);
      formData.append('degree_level', degreeLevel);
      formData.append('specialty', specialty);
      if (studentCardDoc) {
        formData.append('student_card_doc', studentCardDoc);
      }

      const res = await apiRequest('/academic/apply', {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        setResultData(res);
      } else {
        setError(res.message || 'فشل تسجيل الطلب الأكاديمي');
      }
    } catch (err) {
      setError(err.message || 'تعذر معالجة الطلب الأكاديمي');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-slate-950" dir="rtl">
      {/* Platform Nav Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white">فضاء الطلبة والمتربصين الأكاديمي</h1>
              <p className="text-xs text-slate-400">برنامج الشراكة ودعم طلبة الأرطوفونيا وعلم النفس في الجامعات الجزائرية</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <a
              href="/annuaire"
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800"
            >
              الدليل الوطني
            </a>
            <a
              href="/login"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition"
            >
              تسجيل الدخول
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-950 border-b border-slate-800 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
            <span>عرض مجاني 100% لطلبة السنة التخرج والماستر والمتربصين</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            فضاء سريري مجاني لمدة 6 أشهر مع وصول كامل للاختبارات والمقاييس المقننة
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            تدرب على بيئة العمل الواقعية، أنجز مذكرات التخرج، وطبق اختبارات ELO و WISC و BDI مع تقارير سريرية معتمدة.
          </p>
        </div>
      </section>

      {/* Main Form & Tiers Container */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {resultData ? (
          /* Success Activation Box */
          <div className="p-8 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-6 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-4xl shadow-xl animate-bounce">
              🎓
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">تهانينا! تم تفعيل حسابك الأكاديمي المجاني بنجاح</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                تم إنشاء مساحة عمل تدريبية مخصصة لك صالحة لمدة 6 أشهر، بالإضافة إلى رمز تخفيض بنسبة 70% عند بدء نشاطك المهني المستقل.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 max-w-lg mx-auto text-right text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 font-bold">
                <span className="text-slate-400">رابط الفضاء الأكاديمي:</span>
                <a href={resultData.sandbox_url} target="_blank" rel="noopener noreferrer" className="text-teal-400 font-mono hover:underline flex items-center gap-1">
                  <span>{resultData.sandbox_url}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">البريد الإلكتروني:</span>
                <span className="font-mono text-white font-bold">{resultData.login_credentials?.email}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">كلمة المرور المؤقتة:</span>
                <span className="font-mono text-emerald-400 font-black">{resultData.login_credentials?.temporary_password}</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">رمز التخفيض المستقبلي (70%):</span>
                <span className="font-mono text-amber-400 font-black bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {resultData.discount_code}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={resultData.sandbox_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/20 transition hover:scale-105"
              >
                <span>الدخول إلى فضاء العمل الأكاديمي الآن</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        ) : (
          /* Application Form Card */
          <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-8">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-400" />
                <span>استمارة التسجيل وتفعيل الحساب الأكاديمي الفوري</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                املأ البيانات الجامعية التالية للحصول الفوري على بيئة التدريب السريرية
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">اسم ولقب الطالب / المتربص:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أمينة بوعلام"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    required
                    placeholder="etudiant@univ-alger.dz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">رقم الهاتف:</label>
                  <input
                    type="tel"
                    required
                    placeholder="0550123456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">التخصص الأكاديمي:</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="orthophonie">أرطوفونيا (Orthophonie)</option>
                    <option value="psychologie">علم نفس عيادي / تربوي (Psychologie)</option>
                    <option value="neuro_psychiatrie">طب نفسي / علوم عصبية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">الجامعة أو المعهد التابع له:</label>
                <select
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  {universities.map((u, idx) => (
                    <option key={idx} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">المستوى الدراسي / التربص:</label>
                  <select
                    value={degreeLevel}
                    onChange={(e) => setDegreeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="master_m2">ماستر 2 (سنة التخرج / مذكرة)</option>
                    <option value="master_m1">ماستر 1 (سنة أولى ماستر)</option>
                    <option value="licence_l3">ليسانس L3 (سنة ثالثة)</option>
                    <option value="intern_resident">طبيب مقيم / متربص عيادي (Interne / Résident)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">شهادة مدرسية أو بطاقة الطالب (اختياري للتأكيد):</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setStudentCardDoc(e.target.files[0])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs focus:outline-none file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{submitting ? 'جارٍ تفعيل الحساب الأكاديمي...' : '🎓 تفعيل الحساب الأكاديمي المجاني (6 أشهر)'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
