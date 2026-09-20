import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Globe2,
  Building2,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Sparkles,
  Layers,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  Zap,
  ExternalLink,
  MessageCircle,
  Eye,
  Sliders,
  Maximize2
} from 'lucide-react';
import { superAdminApi } from '../../api';
import { ALGERIA_WILAYAS_GEO, ALGERIAN_REGIONS } from '../../data/algerianWilayasGeoData';
import { getCommunesForWilaya, ALGERIAN_WILAYAS } from '../../data/algerianWilayasCommunes';

export default function GeoClinicMapTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState(null);
  const [hoveredWilaya, setHoveredWilaya] = useState(null);

  // Geo Edit Modal
  const [editingClinic, setEditingClinic] = useState(null);
  const [editFormData, setEditFormData] = useState({
    wilaya: '',
    wilaya_code: '',
    commune: '',
    address: '',
    latitude: '',
    longitude: '',
  });
  const [savingLocation, setSavingLocation] = useState(false);
  const [autoGeocoding, setAutoGeocoding] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await superAdminApi.getGeoMapOverview();
      if (res && res.success) {
        setData(res);
      } else {
        setError(res.message || 'فشل تحميل بيانات خريطة الانتشار الجغرافي.');
      }
    } catch (err) {
      console.error('Failed to fetch geo map overview:', err);
      setError(err.response?.data?.message || err.message || 'تعذر الاتصال بخادم الخرائط السحابي.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Merge backend wilayas summary with static coordinates
  const mergedWilayas = useMemo(() => {
    if (!data?.wilayas) return ALGERIA_WILAYAS_GEO.map(w => ({ ...w, clinics_count: 0, patients_count: 0 }));

    const backendMap = {};
    data.wilayas.forEach(w => {
      backendMap[w.code] = w;
    });

    return ALGERIA_WILAYAS_GEO.map(staticW => {
      const live = backendMap[staticW.code] || {};
      return {
        ...staticW,
        ...live,
        clinics_count: live.clinics_count || 0,
        patients_count: live.patients_count || 0,
        density_level: live.density_level || 'none',
      };
    });
  }, [data]);

  // Filtered Clinics
  const filteredClinics = useMemo(() => {
    if (!data?.clinics) return [];

    return data.clinics.filter(clinic => {
      if (selectedRegion !== 'all') {
        const wMeta = ALGERIA_WILAYAS_GEO.find(w => w.code === clinic.wilaya_code);
        if (wMeta && wMeta.region !== selectedRegion) return false;
      }

      if (selectedSpecialty !== 'all') {
        if (clinic.type !== selectedSpecialty) return false;
      }

      if (selectedStatus !== 'all') {
        if (clinic.status !== selectedStatus) return false;
      }

      if (selectedWilayaCode) {
        if (clinic.wilaya_code !== selectedWilayaCode) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = clinic.name?.toLowerCase().includes(q);
        const matchDoctor = clinic.doctor_name?.toLowerCase().includes(q);
        const matchWilaya = clinic.wilaya?.toLowerCase().includes(q);
        const matchCommune = clinic.commune?.toLowerCase().includes(q);
        if (!matchName && !matchDoctor && !matchWilaya && !matchCommune) return false;
      }

      return true;
    });
  }, [data, selectedRegion, selectedSpecialty, selectedStatus, selectedWilayaCode, searchTerm]);

  // Selected Wilaya Details
  const activeWilayaData = useMemo(() => {
    if (!selectedWilayaCode) return null;
    return mergedWilayas.find(w => w.code === selectedWilayaCode) || null;
  }, [selectedWilayaCode, mergedWilayas]);

  // Open Edit Location Modal
  const handleOpenEdit = (clinic) => {
    const wCode = clinic.wilaya_code || '16';
    setEditingClinic(clinic);
    setEditFormData({
      wilaya: clinic.wilaya || 'الجزائر العاصمة',
      wilaya_code: wCode,
      commune: clinic.commune || 'حيدرة',
      address: clinic.address || '',
      latitude: clinic.latitude || '',
      longitude: clinic.longitude || '',
    });
  };

  // Wilaya change in modal
  const handleWilayaChangeInModal = (code) => {
    const staticW = ALGERIA_WILAYAS_GEO.find(w => w.code === code);
    const comms = getCommunesForWilaya(code);
    setEditFormData(prev => ({
      ...prev,
      wilaya_code: code,
      wilaya: staticW ? staticW.name_ar : '',
      commune: comms[0] || '',
      latitude: staticW ? staticW.lat : prev.latitude,
      longitude: staticW ? staticW.lng : prev.longitude,
    }));
  };

  // Auto fill centroid in modal
  const handleAutofillCentroid = () => {
    const staticW = ALGERIA_WILAYAS_GEO.find(w => w.code === editFormData.wilaya_code);
    if (staticW) {
      setEditFormData(prev => ({
        ...prev,
        latitude: staticW.lat,
        longitude: staticW.lng,
      }));
    }
  };

  // Submit Location Update
  const handleSaveLocation = async (e) => {
    e.preventDefault();
    if (!editingClinic) return;

    try {
      setSavingLocation(true);
      const res = await superAdminApi.updateClinicLocation(editingClinic.id, editFormData);
      if (res && res.success) {
        setEditingClinic(null);
        fetchOverview();
      } else {
        alert(res.message || 'تعذر حفظ إحداثيات العيادة.');
      }
    } catch (err) {
      console.error('Save location error:', err);
      alert(err.response?.data?.message || err.message || 'حدث خطأ أثناء حفظ الموقع.');
    } finally {
      setSavingLocation(false);
    }
  };

  // Auto Geocode All
  const handleAutoGeocodeAll = async () => {
    if (!window.confirm('هل تريد معايرة الإحداثيات الجغرافية التلقائية لكافة العيادات الناقصة؟')) return;
    try {
      setAutoGeocoding(true);
      const res = await superAdminApi.autoGeocodeClinics();
      alert(res.message || 'تمت معايرة الإحداثيات بنجاح!');
      fetchOverview();
    } catch (err) {
      console.error('Auto geocode error:', err);
      alert(err.response?.data?.message || err.message || 'تعذر استكمال المعايرة.');
    } finally {
      setAutoGeocoding(false);
    }
  };

  // Impersonate Clinic
  const handleImpersonate = async (clinic) => {
    try {
      const res = await superAdminApi.impersonateClinic(clinic.id);
      if (res.token) {
        localStorage.setItem('token', res.token);
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('tenant', JSON.stringify(clinic));
        localStorage.setItem('is_impersonating', 'true');
        localStorage.setItem('impersonating_clinic_name', clinic.name);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      alert(err.response?.data?.message || 'فشل تسجيل الدخول للعيادة.');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 text-center">
        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-slate-300 text-sm font-bold">جاري تحميل خريطة الانتشار والذكاء الجغرافي للولايات الـ 58...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-3xl bg-rose-950/30 border border-rose-800 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-black text-rose-200">تعذر تحميل بيانات الخريطة</h3>
        <p className="text-xs text-rose-300/80">{error}</p>
        <button
          onClick={fetchOverview}
          className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const kpis = data?.national_stats || {};

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5" />
                <span>الذكاء الجغرافي الوطني • 58 ولاية</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Coverage: {kpis.coverage_pct}% 🇩🇿
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              خريطة انتشار العيادات ومؤشرات التوسع الوطني
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              تتبع التركز الجغرافي للعيادات، نسب التغطية الإقليمية، ورصد مناطق الفرص البيضاء للتوسع الطبي والتسويقي
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleAutoGeocodeAll}
              disabled={autoGeocoding}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 shadow-md"
              title="معايرة الإحداثيات آلياً للعيادات بدون موقع"
            >
              <Zap className={`w-4 h-4 text-amber-400 ${autoGeocoding ? 'animate-spin' : ''}`} />
              <span>معايرة الإحداثيات آلياً</span>
            </button>

            <button
              onClick={fetchOverview}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث الخريطة</span>
            </button>
          </div>
        </div>

        {/* 4 Hero KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>نسبة التغطية الوطنية</span>
              <Globe2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{kpis.coverage_pct}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${kpis.coverage_pct}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {kpis.covered_wilayas} من أصل {kpis.total_wilayas} ولاية مغطاة
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>إجمالي العيادات الموزعة</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-indigo-300">{kpis.total_clinics}</div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2">
              <span className="text-emerald-400 font-bold">{kpis.active_clinics} نشطة</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">{kpis.trial_clinics} تجريبية</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>الولاية الأكثر نشاطاً</span>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl font-black text-teal-300 truncate">
              {kpis.top_wilaya?.name_ar || 'الجزائر العاصمة'}
            </div>
            <div className="text-[10px] text-slate-400 mt-2">
              تضم <strong className="text-white font-bold">{kpis.top_wilaya?.clinics_count || 0}</strong> عيادة طبية نشطة
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>مناطق الفرص البيضاء</span>
              <Compass className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-300">{kpis.white_spaces_count}</div>
            <div className="text-[10px] text-slate-400 mt-2">
              ولايات شاغرة مؤهلة للتوسع التسويقي
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Interactive Map Area (8 cols on lg) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-black text-white">الخريطة التفاعلية للتركز الطبي (Algeria Vector Canvas)</h2>
            </div>

            {/* Map Legend */}
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-600" />
                <span>شاغرة (0)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span>عيادة (1)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400/50" />
                <span>متوسطة (2-3)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                <span>عالية (4+)</span>
              </span>
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="relative w-full aspect-[4/3] bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px]" />

            <svg
              viewBox="0 0 950 900"
              className="w-full h-full max-h-[580px] drop-shadow-2xl select-none"
            >
              <defs>
                {/* Pulse Animation Filter */}
                <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-indigo" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Simplified stylized outline of Algeria territory */}
              <path
                d="M 120 490 L 330 330 L 400 170 L 450 145 L 560 110 L 760 105 L 770 170 L 720 260 L 810 570 L 810 650 L 660 860 L 470 780 L 420 500 L 120 510 Z"
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="3"
                strokeDasharray="4 4"
                className="opacity-60"
              />

              {/* Wilayas Geo Pins & Heat Nodes */}
              {mergedWilayas.map((w) => {
                const count = w.clinics_count || 0;
                const isSelected = selectedWilayaCode === w.code;
                const isHovered = hoveredWilaya?.code === w.code;

                // Color based on density
                let fillColor = '#334155'; // empty
                let strokeColor = '#475569';
                let radius = 6;
                let hasPulse = false;

                if (count >= 4) {
                  fillColor = '#6366f1'; // Indigo
                  strokeColor = '#a5b4fc';
                  radius = 12;
                  hasPulse = true;
                } else if (count >= 2) {
                  fillColor = '#14b8a6'; // Teal
                  strokeColor = '#5eead4';
                  radius = 10;
                  hasPulse = true;
                } else if (count === 1) {
                  fillColor = '#10b981'; // Emerald
                  strokeColor = '#6ee7b7';
                  radius = 8;
                  hasPulse = true;
                }

                if (isSelected) {
                  strokeColor = '#ffffff';
                  radius += 3;
                }

                return (
                  <g
                    key={w.code}
                    className="cursor-pointer transition-transform duration-200"
                    onClick={() => setSelectedWilayaCode(isSelected ? null : w.code)}
                    onMouseEnter={() => setHoveredWilaya(w)}
                    onMouseLeave={() => setHoveredWilaya(null)}
                  >
                    {/* Radar Pulse Ring for active Wilayas */}
                    {hasPulse && (
                      <circle
                        cx={w.x}
                        cy={w.y}
                        r={radius * 1.8}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="1.5"
                        className="animate-ping opacity-75 origin-center"
                      />
                    )}

                    {/* Outer glow ring */}
                    <circle
                      cx={w.x}
                      cy={w.y}
                      r={radius + 3}
                      fill={fillColor}
                      opacity={isSelected || isHovered ? 0.4 : 0.15}
                    />

                    {/* Main Node */}
                    <circle
                      cx={w.x}
                      cy={w.y}
                      r={radius}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="transition-all duration-300"
                    />

                    {/* Wilaya Code Label on Map */}
                    <text
                      x={w.x}
                      y={w.y + 3.5}
                      textAnchor="middle"
                      fontSize={count > 0 ? "8" : "7"}
                      fontWeight="bold"
                      fill={count > 0 ? "#ffffff" : "#94a3b8"}
                      className="pointer-events-none font-mono"
                    >
                      {w.code}
                    </text>

                    {/* Name Label for Active Wilayas or Selected */}
                    {(count > 0 || isSelected || isHovered) && (
                      <text
                        x={w.x}
                        y={w.y - radius - 5}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="black"
                        fill={isSelected ? "#ffffff" : (count > 0 ? "#a7f3d0" : "#cbd5e1")}
                        className="pointer-events-none drop-shadow-md"
                      >
                        {w.name_ar}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip floating panel */}
            {hoveredWilaya && (
              <div
                className="absolute top-4 left-4 bg-slate-900/95 border border-emerald-500/40 p-3 rounded-2xl shadow-2xl pointer-events-none backdrop-blur-md z-30 min-w-[200px]"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <span className="text-xs font-black text-white">{hoveredWilaya.name_ar}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    ولاية {hoveredWilaya.code}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>العيادات النشطة:</span>
                    <strong className="text-emerald-400 font-bold">{hoveredWilaya.clinics_count || 0}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>المرضى المعالجون:</span>
                    <strong className="text-indigo-300 font-bold">{hoveredWilaya.patients_count || 0}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px] pt-1">
                    <span>التعداد التقديري:</span>
                    <span>{(hoveredWilaya.population / 1000000).toFixed(1)} مليون</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Region Selector Pills below map */}
          <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-slate-800/80 text-xs font-bold scrollbar-thin">
            <span className="text-slate-400 text-[11px] shrink-0">الأقاليم:</span>
            {ALGERIAN_REGIONS.map(reg => {
              const isActive = selectedRegion === reg.id;
              return (
                <button
                  key={reg.id}
                  onClick={() => setSelectedRegion(reg.id)}
                  className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap text-xs ${
                    isActive
                      ? 'bg-emerald-600 text-white font-black shadow-md'
                      : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {reg.label_ar}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Wilaya Inspector Drawer & Expansion Opportunities (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Selected Wilaya Details Card */}
          {activeWilayaData ? (
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                    {activeWilayaData.code}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{activeWilayaData.name_ar}</h3>
                    <div className="text-[10px] text-slate-400">{activeWilayaData.name_fr}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWilayaCode(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="إلغاء التحديد"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Wilaya Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-right">
                  <div className="text-[10px] text-slate-400">العيادات بالولاية</div>
                  <div className="text-xl font-black text-emerald-400">{activeWilayaData.clinics_count || 0}</div>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-right">
                  <div className="text-[10px] text-slate-400">المرضى المسجلون</div>
                  <div className="text-xl font-black text-indigo-400">{activeWilayaData.patients_count || 0}</div>
                </div>
              </div>

              {/* Specialty distribution in this Wilaya */}
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="text-[11px] font-bold text-slate-400 mb-1">توزيع التخصصات بالولاية:</div>
                <div className="flex justify-between items-center bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/60">
                  <span className="text-teal-400 font-bold">أرطوفونيا وتخاطب:</span>
                  <span className="font-bold">{activeWilayaData.orthophony_count || 0}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/60">
                  <span className="text-purple-400 font-bold">طب ونفساني عيادي:</span>
                  <span className="font-bold">{activeWilayaData.psychology_count || 0}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/60">
                  <span className="text-indigo-400 font-bold">متعدد التخصصات:</span>
                  <span className="font-bold">{activeWilayaData.multidisciplinary_count || 0}</span>
                </div>
              </div>

              {/* Coordinates Info */}
              <div className="text-[10px] text-slate-400 font-mono bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>GPS Centroid:</span>
                <span>{activeWilayaData.lat}, {activeWilayaData.lng}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
              <Compass className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-black text-slate-300">مفتش الولايات الاستخباري</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                انقر فوق أي ولاية على الخريطة لعرض تفاصيل العيادات والتخصصات والمرضى ومؤشر الكثافة في تلك الولاية.
              </p>
            </div>
          )}

          {/* Expansion Opportunities Radar (White Spaces) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">رادار فرص التوسع (White Spaces)</h3>
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                أولوية الاستقطاب
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              الولايات ذات الكثافة السكانية العالية الخالية تماماً من عيادات المنصة لاستهدافها تسويقياً:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {(data?.white_spaces || []).map((ws, i) => (
                <div
                  key={ws.code}
                  onClick={() => setSelectedWilayaCode(ws.code)}
                  className="p-2.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/40 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono font-bold flex items-center justify-center group-hover:bg-amber-500/20 group-hover:text-amber-300">
                      {ws.code}
                    </span>
                    <div>
                      <div className="text-xs font-black text-white group-hover:text-amber-300">
                        {ws.name_ar}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {(ws.population / 1000000).toFixed(1)} مليون نسمة
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                    {ws.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filterable Clinics Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-black text-white">
                سجل العيادات الجغرافي ({filteredClinics.length} عيادة)
              </h2>
              {selectedWilayaCode && (
                <span className="text-xs text-emerald-400 font-bold">
                  مصفى لولاية: {activeWilayaData?.name_ar} (
                  <button onClick={() => setSelectedWilayaCode(null)} className="underline hover:text-white">
                    إلغاء التصفية
                  </button>
                  )
                </span>
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالعيادة، الطبيب، الولاية..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Specialty Filter */}
            <select
              value={selectedSpecialty}
              onChange={e => setSelectedSpecialty(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">كافة التخصصات</option>
              <option value="orthophony">أرطوفونيا وتخاطب</option>
              <option value="psychology">علم النفس والطب النفسي</option>
              <option value="multidisciplinary">متعدد التخصصات</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">كافة الحالات</option>
              <option value="active">نشطة (Active)</option>
              <option value="trial">تجريبية (Trial)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-bold">
                <th className="pb-3 px-3">العيادة والطبيب المسؤول</th>
                <th className="pb-3 px-3">التخصص</th>
                <th className="pb-3 px-3">الولاية والبلدية</th>
                <th className="pb-3 px-3">إحداثيات GPS</th>
                <th className="pb-3 px-3">المرضى</th>
                <th className="pb-3 px-3">الحالة</th>
                <th className="pb-3 px-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClinics.length > 0 ? (
                filteredClinics.map(clinic => (
                  <tr key={clinic.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-3">
                      <div className="font-black text-white text-sm">{clinic.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>د. {clinic.doctor_name}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500" dir="ltr">{clinic.phone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                        clinic.type === 'orthophony'
                          ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                          : clinic.type === 'psychology'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {clinic.type_label_ar}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{clinic.wilaya} ({clinic.wilaya_code})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 pr-4">{clinic.commune}</div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400" dir="ltr">
                      {clinic.latitude && clinic.longitude ? (
                        <span>{clinic.latitude.toFixed(4)}, {clinic.longitude.toFixed(4)}</span>
                      ) : (
                        <span className="text-amber-400 text-[10px]">غير محدد</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                        {clinic.patients_count} مريض
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                        clinic.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {clinic.status === 'active' ? 'نشطة 🟢' : 'تجريبية ⏳'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(clinic)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 border border-slate-700 transition"
                          title="تعديل الموقع الجغرافي والإحداثيات"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>

                        {clinic.phone && clinic.phone !== '--' && (
                          <a
                            href={`https://wa.me/${clinic.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700 transition"
                            title="مراسلة عبر WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => handleImpersonate(clinic)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 transition"
                          title="تسجيل الدخول للعيادة (Impersonate)"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    لا توجد عيادات تطابق خيارات التصفية المحددة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Geolocation Modal */}
      {editingClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">تعديل الموقع الجغرافي للعيادة</h3>
              </div>
              <button
                onClick={() => setEditingClinic(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div className="font-bold text-white text-sm">{editingClinic.name}</div>
              <div className="text-xs text-slate-400">المشرف: د. {editingClinic.doctor_name}</div>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4 text-xs">
              {/* Wilaya Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">الولاية (58 ولاية):</label>
                <select
                  value={editFormData.wilaya_code}
                  onChange={e => handleWilayaChangeInModal(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  {ALGERIAN_WILAYAS.map(w => (
                    <option key={w.code} value={w.code}>
                      {w.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commune Selection */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">البلدية:</label>
                <select
                  value={editFormData.commune}
                  onChange={e => setEditFormData({ ...editFormData, commune: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                >
                  {getCommunesForWilaya(editFormData.wilaya_code).map(comm => (
                    <option key={comm} value={comm}>
                      {comm}
                    </option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">العنوان التفصيلي للعيادة:</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                  placeholder="مثال: حي النور، عمارة 04، الطابق الأول"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Lat & Lng with Autofill button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">إحداثيات GPS (خط العرض وخط الطول):</label>
                  <button
                    type="button"
                    onClick={handleAutofillCentroid}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline"
                  >
                    <Zap className="w-3 h-3" />
                    <span>تعبئة تلقائية لمركز الولاية</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3" dir="ltr">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude (e.g. 36.7538)"
                    value={editFormData.latitude}
                    onChange={e => setEditFormData({ ...editFormData, latitude: e.target.value })}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs text-center focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude (e.g. 3.0588)"
                    value={editFormData.longitude}
                    onChange={e => setEditFormData({ ...editFormData, longitude: e.target.value })}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingClinic(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingLocation}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  {savingLocation && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>حفظ الموقع الجغرافي</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
