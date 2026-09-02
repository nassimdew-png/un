import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Search, 
  Filter, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  Award, 
  Stethoscope, 
  Brain, 
  ExternalLink, 
  GraduationCap, 
  ArrowRight,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { apiRequest } from '../../api';
import PublicClinicProfileModal from './PublicClinicProfileModal';

export default function NationalDirectoryView() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'ar';

  const [clinics, setClinics] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal
  const [selectedClinicForBooking, setSelectedClinicForBooking] = useState(null);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedWilaya) params.append('wilaya', selectedWilaya);
      if (selectedSpecialty) params.append('specialty', selectedSpecialty);
      if (searchQuery) params.append('search', searchQuery);

      const res = await apiRequest(`/public/directory?${params.toString()}`);
      if (res.success) {
        setClinics(res.clinics || []);
        if (res.wilayas) setWilayas(res.wilayas);
      }
    } catch (err) {
      console.error('Directory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, [selectedWilaya, selectedSpecialty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDirectory();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950" dir="rtl">
      {/* Top Platform Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-teal-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white">الدليل الوطني للعيادات ومراكز التأهيل</h1>
              <p className="text-xs text-slate-400">المنصة الطبية الجزائرية الموحدة &bull; 58 ولاية</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <a
              href="/academic"
              className="hidden sm:inline-flex items-center space-x-1.5 space-x-reverse px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition"
            >
              <GraduationCap className="w-4 h-4" />
              <span>فضاء الطلبة والمتربصين 🎓</span>
            </a>
            <a
              href="/login"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-md transition"
            >
              دخول العيادات
            </a>
          </div>
        </div>
      </header>

      {/* Hero Banner with Search Bar */}
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>شبكة وطنية للعيادات المعتمدة في الأرطوفونيا وعلم النفس والطب النفسي</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            ابحث عن أقرب عيادة متخصصة واحجز موعدك مباشرة
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            دليل وطني تفاعلي يربط المرضى والأولياء بأفضل الأخصائيين المعتمدين عبر 58 ولاية جزائرية.
          </p>

          {/* Search Filters Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-8 p-3 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl flex flex-wrap items-center gap-2 max-w-3xl mx-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="ابحث باسم العيادة، الطبيب، أو البلدية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* 58 Wilayas Filter */}
            <div className="min-w-[160px]">
              <select
                value={selectedWilaya}
                onChange={(e) => setSelectedWilaya(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="">جميع الولايات (58 ولاية)</option>
                {wilayas.map((w) => (
                  <option key={w.code} value={w.name_ar}>
                    {w.code} - {w.name_ar} ({w.name_fr})
                  </option>
                ))}
              </select>
            </div>

            {/* Specialty Filter */}
            <div className="min-w-[150px]">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="">كافة التخصصات</option>
                <option value="orthophonie">أرطوفونيا (Orthophonie)</option>
                <option value="psychologie">علم نفس (Psychologie)</option>
                <option value="neuro_psychiatrie">طب نفسي وأعصاب</option>
                <option value="pluridisciplinaire">مركز متعدد التخصصات</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-md transition shrink-0"
            >
              بحث
            </button>
          </form>
        </div>
      </section>

      {/* Directory Grid Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <span>العيادات المتاحة ({clinics.length}):</span>
          </h3>
          <span className="text-xs text-slate-500">حجز فوري ومباشر دون وسيط</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-bold animate-pulse">جارٍ تحميل دليل العيادات...</p>
          </div>
        ) : clinics.length === 0 ? (
          <div className="py-16 text-center text-slate-500 p-8 rounded-3xl bg-slate-900/40 border border-slate-800">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-bold">لم يتم العثور على عيادات مطابقة لمعايير البحث المحددة.</p>
            <button
              onClick={() => { setSelectedWilaya(''); setSelectedSpecialty(''); setSearchQuery(''); }}
              className="mt-3 text-xs text-teal-400 font-bold hover:underline"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinics.map((clinic) => (
              <div
                key={clinic.id}
                className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 transition-all p-6 shadow-xl flex flex-col justify-between space-y-4 relative group"
              >
                <div className="space-y-3">
                  {/* Clinic Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 space-x-reverse min-w-0">
                      {clinic.logo_url ? (
                        <img src={clinic.logo_url} alt={clinic.name} className="w-12 h-12 rounded-2xl object-contain bg-slate-950 p-1 border border-slate-800 shrink-0" />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950 font-black text-lg shrink-0 shadow-md"
                          style={{ backgroundColor: clinic.report_accent_color || '#0d9488' }}
                        >
                          {clinic.name?.charAt(0) || '🏥'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-base font-extrabold text-white truncate group-hover:text-teal-400 transition">{clinic.name}</h4>
                        <span className="inline-block text-[11px] font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20 mt-0.5">
                          {clinic.specialty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location & Contact */}
                  <div className="space-y-1 text-xs text-slate-400">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{clinic.wilaya} {clinic.commune ? `(${clinic.commune})` : ''} &bull; {clinic.address}</span>
                    </p>
                    {clinic.phone && (
                      <p className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{clinic.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    {clinic.public_bio}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>معتمد</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      ⚡ حجز فوري
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      🎓 تخفيض الطلبة
                    </span>
                  </div>
                </div>

                {/* Card Footer & Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-slate-500 block text-[10px]">الاستشارة تبدأ من:</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">{clinic.consultation_fee_dzd} دج</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={clinic.portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="زيارة فضاء العيادة"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => setSelectedClinicForBooking(clinic)}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>حجز موعد</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {selectedClinicForBooking && (
        <PublicClinicProfileModal
          clinic={selectedClinicForBooking}
          onClose={() => setSelectedClinicForBooking(null)}
          onBookingSuccess={() => {
            fetchDirectory();
          }}
        />
      )}
    </div>
  );
}
