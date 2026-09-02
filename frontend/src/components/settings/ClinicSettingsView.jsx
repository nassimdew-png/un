import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Globe,
  Save,
  Palette,
  Phone,
  MapPin,
  FileText,
  Key,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Monitor,
  Upload,
  Image as ImageIcon,
  Stamp,
  PenTool,
  Trash2,
  Eye,
  Layers,
  Layout,
  SlidersHorizontal,
  Check,
  RefreshCw,
  Printer,
  Shield,
  Award
} from 'lucide-react';
import { clinicBrandingApi } from '../../api';

export default function ClinicSettingsView({ tenant, user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: tenant?.name || 'عيادة الأمل للأرطوفونيا وعلم النفس',
    license_number: 'DZ-MSPRH-2026/884',
    official_title_ar: 'عيادة ومخبر الفحوصات والتشخيص السريري والتأهيلي',
    official_title_fr: 'Cabinet Médical Spécialisé en Orthophonie et Psychologie',
    phone: tenant?.phone || '0559 22 33 44',
    address: tenant?.address || 'حي 500 مسكن - عمارة B، بئر مراد رايس',
    wilaya: tenant?.wilaya || '16 - الجزائر العاصمة',
    primary_color: '#2563eb',
    secondary_color: '#06b6d4',
    header_layout: 'modern_split', // 'modern_split' | 'centered_minimal' | 'classic_boxed'
    show_watermark: true,
    show_stamp_on_bilans: true,
    kiosk_pin: '1234',
    kiosk_enabled: true,
    reassessment_days_threshold: 90,
    footer_text: 'وثيقة طبية وسريرية رسمية صادرة عن منظومة السجلات الرقمية PsyPro Tech • صالحة للإجراءات الإدارية والمدرسية',
  });

  // Files state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [stampFile, setStampFile] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const logoInputRef = useRef(null);
  const stampInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  const colorPresets = [
    { name: 'أزرق ملكي', primary: '#2563eb', secondary: '#06b6d4' },
    { name: 'فيروزي سريري', primary: '#0d9488', secondary: '#14b8a6' },
    { name: 'نيلي طبي', primary: '#4f46e5', secondary: '#818cf8' },
    { name: 'زمردي صحي', primary: '#059669', secondary: '#34d399' },
    { name: 'بنفسجي راقٍ', primary: '#7c3aed', secondary: '#c084fc' },
    { name: 'كحلي داكن', primary: '#0f172a', secondary: '#475569' },
  ];

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        setLoading(true);
        const res = await clinicBrandingApi.getBranding();
        if (res && res.settings) {
          setFormData((prev) => ({
            ...prev,
            ...res.settings,
            name: res.tenant?.name || prev.name,
          }));
          if (res.settings.logo_url) setLogoPreview(res.settings.logo_url);
          if (res.settings.stamp_url) setStampPreview(res.settings.stamp_url);
          if (res.settings.signature_url) setSignaturePreview(res.settings.signature_url);
        }
      } catch (err) {
        console.error('Failed to load branding:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBranding();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleStampChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStampFile(file);
      setStampPreview(URL.createObjectURL(file));
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData((prev) => ({ ...prev, logo_url: 'DELETE' }));
  };

  const handleRemoveStamp = () => {
    setStampFile(null);
    setStampPreview(null);
    setFormData((prev) => ({ ...prev, stamp_url: 'DELETE' }));
  };

  const handleRemoveSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
    setFormData((prev) => ({ ...prev, signature_url: 'DELETE' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      if (logoFile) data.append('logo', logoFile);
      if (stampFile) data.append('stamp', stampFile);
      if (signatureFile) data.append('signature', signatureFile);

      const res = await clinicBrandingApi.updateBranding(data);
      setFeedback({ type: 'success', text: res.message || 'تم حفظ الهوية البصرية بنجاح!' });

      if (res.settings) {
        if (res.settings.logo_url) setLogoPreview(res.settings.logo_url);
        if (res.settings.stamp_url) setStampPreview(res.settings.stamp_url);
        if (res.settings.signature_url) setSignaturePreview(res.settings.signature_url);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الإعدادات.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>CLINICAL VISUAL IDENTITY & EN-TÊTE STUDIO</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                A4 Live Preview 📄
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">استوديو الهوية البصرية وترويسة التقارير الطبية</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              تحكم بهوية العيادة، رفع الشعار عالي الدقة، الختم الطبي الرقمي، التوقيع، وتخصيص ترويسة الحصائل والوصفات الطبية (A4) مع معاينة حية لحظية.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => navigate('/settings/domains')}
              className="px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center space-x-2 space-x-reverse"
            >
              <Globe className="w-4 h-4" />
              <span>🌐 النطاق المخصص وSSL</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-xl shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : '💾 حفظ وتطبيق الهوية'}</span>
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {feedback.text}
          </span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Split Studio Layout: Form on Right, A4 Live Canvas on Left */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* RIGHT PANEL: Controls & Uploads (7 Cols on XL) */}
        <div className="xl:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Upload Assets Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>1. الأصول البصرية (الشعار، الختم الطبي، التوقيع)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Logo Upload */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col justify-between items-center text-center space-y-3">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>شعار العيادة (Logo)</span>
                  </div>

                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 flex items-center justify-center overflow-hidden relative bg-slate-900 group">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold">لا يوجد شعار</span>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex-1 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-bold transition border border-indigo-500/30"
                    >
                      {logoPreview ? 'تغيير' : 'رفع'}
                    </button>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition border border-rose-500/30"
                        title="حذف الشعار"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stamp Upload */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col justify-between items-center text-center space-y-3">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Stamp className="w-4 h-4 text-emerald-400" />
                    <span>الختم الطبي (Cachet)</span>
                  </div>

                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500 flex items-center justify-center overflow-hidden relative bg-slate-900 group">
                    {stampPreview ? (
                      <img src={stampPreview} alt="Stamp" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold">لا يوجد ختم</span>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={stampInputRef}
                    onChange={handleStampChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => stampInputRef.current?.click()}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[11px] font-bold transition border border-emerald-500/30"
                    >
                      {stampPreview ? 'تغيير' : 'رفع'}
                    </button>
                    {stampPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveStamp}
                        className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition border border-rose-500/30"
                        title="حذف الختم"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Signature Upload */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col justify-between items-center text-center space-y-3">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-purple-400" />
                    <span>التوقيع الطبي (Signature)</span>
                  </div>

                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-700 hover:border-purple-500 flex items-center justify-center overflow-hidden relative bg-slate-900 group">
                    {signaturePreview ? (
                      <img src={signaturePreview} alt="Signature" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold">لا يوجد توقيع</span>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={signatureInputRef}
                    onChange={handleSignatureChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => signatureInputRef.current?.click()}
                      className="flex-1 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-[11px] font-bold transition border border-purple-500/30"
                    >
                      {signaturePreview ? 'تغيير' : 'رفع'}
                    </button>
                    {signaturePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveSignature}
                        className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition border border-rose-500/30"
                        title="حذف التوقيع"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Header Layout Selection */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Layout className="w-4 h-4 text-indigo-400" />
                <span>2. تخطيط وشكل ترويسة التقارير (Header Layout)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'modern_split',
                    title: 'حديث منقسم',
                    subtitle: 'Modern Split',
                    desc: 'الشعار والبيانات يميناً ويساراً مع خط فاصل جمالي متدرج.',
                  },
                  {
                    id: 'centered_minimal',
                    title: 'وسطي بسيط',
                    subtitle: 'Centered Minimal',
                    desc: 'الشعار بالمركز مع ترويسة متناسقة وأنيقة في الوسط.',
                  },
                  {
                    id: 'classic_boxed',
                    title: 'كلاسيكي بإطار',
                    subtitle: 'Classic Boxed',
                    desc: 'إطار طبي رسمي محكم مع شارة الاعتماد والختم.',
                  },
                ].map((layout) => (
                  <div
                    key={layout.id}
                    onClick={() => setFormData({ ...formData, header_layout: layout.id })}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                      formData.header_layout === layout.id
                        ? 'bg-indigo-600/10 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{layout.title}</span>
                      {formData.header_layout === layout.id && (
                        <Check className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-indigo-400 font-mono">{layout.subtitle}</div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{layout.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Brand Colors */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Palette className="w-4 h-4 text-purple-400" />
                <span>3. لوحة ألوان الهوية البصرية (Theme Colors)</span>
              </h2>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                {colorPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        primary_color: preset.primary,
                        secondary_color: preset.secondary,
                      })
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 space-x-reverse shrink-0 border ${
                      formData.primary_color === preset.primary
                        ? 'bg-slate-800 border-indigo-500 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">اللون الرئيسي للترويسة والعناوين:</label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="bg-transparent border-0 font-mono text-white text-xs focus:outline-none flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">اللون الثانوي وخطوط التمييز:</label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2">
                    <input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="bg-transparent border-0 font-mono text-white text-xs focus:outline-none flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Official Clinical Data */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Award className="w-4 h-4 text-amber-400" />
                <span>4. البيانات والاعتمادات الرسمية</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">اسم العيادة أو المركز:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">رقم الاعتماد الطبي (Agrément N°):</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="DZ-MSPRH-2026/884"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">اللقب والصفة السريرية (بالعربية):</label>
                  <input
                    type="text"
                    value={formData.official_title_ar}
                    onChange={(e) => setFormData({ ...formData, official_title_ar: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">اللقب والصفة السريرية (بالفرنسية):</label>
                  <input
                    type="text"
                    value={formData.official_title_fr}
                    onChange={(e) => setFormData({ ...formData, official_title_fr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">هاتف العيادة:</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">الولاية:</label>
                  <input
                    type="text"
                    value={formData.wilaya}
                    onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-bold">العنوان الكامل:</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-bold">نص التذييل القانوني وسرية الوثيقة (Footer Legal Notice):</label>
                  <textarea
                    rows={2}
                    value={formData.footer_text}
                    onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 5. Toggles & Security */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>5. خيارات الطباعة والأتمتة السريرية</span>
              </h2>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                  <span className="text-slate-200 font-bold">إظهار العلامة المائية لشعار العيادة (Watermark) في خلفية التقارير</span>
                  <input
                    type="checkbox"
                    checked={formData.show_watermark}
                    onChange={(e) => setFormData({ ...formData, show_watermark: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                  <span className="text-slate-200 font-bold">تضمين الختم والتوقيع الطبي تلقائياً عند طباعة وتصدير الحصائل (PDF)</span>
                  <input
                    type="checkbox"
                    checked={formData.show_stamp_on_bilans}
                    onChange={(e) => setFormData({ ...formData, show_stamp_on_bilans: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-700 focus:ring-0"
                  />
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* LEFT PANEL: Live Real-Time A4 Medical Document Preview Canvas (5 Cols on XL) */}
        <div className="xl:col-span-5 space-y-4 sticky top-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>معاينة حية فورية للتقرير الطبي (A4 Canvas Preview)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">210mm × 297mm (Standard A4)</span>
          </div>

          {/* Authentic A4 Document Canvas */}
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-7 border border-slate-200 min-h-[640px] flex flex-col justify-between relative overflow-hidden text-right font-sans select-none scale-[0.98] origin-top transition-all">
            {/* Watermark Logo Background */}
            {formData.show_watermark && logoPreview && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] z-0">
                <img src={logoPreview} alt="Watermark" className="w-64 h-64 object-contain grayscale" />
              </div>
            )}

            {/* Document Header Section */}
            <div className="relative z-10 border-b pb-4" style={{ borderColor: formData.primary_color + '30' }}>
              {formData.header_layout === 'modern_split' && (
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <h2 className="text-sm sm:text-base font-black tracking-tight" style={{ color: formData.primary_color }}>
                      {formData.name}
                    </h2>
                    <div className="text-[10px] text-slate-700 font-bold">{formData.official_title_ar}</div>
                    <div className="text-[9px] text-slate-500 font-mono">{formData.official_title_fr}</div>
                    <div className="text-[9px] text-slate-600 font-mono pt-1">
                      Agrément N°: <strong className="text-slate-900">{formData.license_number}</strong>
                    </div>
                  </div>

                  <div className="w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden bg-slate-50 shrink-0 p-1">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center">
                        <Building2 className="w-6 h-6 text-slate-400 mx-auto" />
                        <span className="text-[8px] text-slate-400 block mt-0.5">LOGO</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formData.header_layout === 'centered_minimal' && (
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full border mx-auto flex items-center justify-center overflow-hidden bg-slate-50 p-1">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-black" style={{ color: formData.primary_color }}>
                      {formData.name}
                    </h2>
                    <div className="text-[10px] text-slate-700 font-bold mt-0.5">{formData.official_title_ar}</div>
                    <div className="text-[8px] text-slate-500 font-mono">{formData.official_title_fr} • Agrément: {formData.license_number}</div>
                  </div>
                </div>
              )}

              {formData.header_layout === 'classic_boxed' && (
                <div className="border-2 p-3 rounded-xl flex items-center justify-between" style={{ borderColor: formData.primary_color }}>
                  <div className="w-14 h-14 border rounded-lg flex items-center justify-center bg-slate-50 p-1 shrink-0">
                    {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" /> : <Building2 className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div className="text-center flex-1 px-2">
                    <h2 className="text-xs font-black uppercase" style={{ color: formData.primary_color }}>{formData.name}</h2>
                    <div className="text-[9px] font-bold text-slate-800">{formData.official_title_ar}</div>
                    <div className="text-[8px] font-mono text-slate-600">Réf. Agrément: {formData.license_number}</div>
                  </div>
                  <div className="text-[9px] text-left font-mono text-slate-500 shrink-0">
                    <div>{formData.wilaya}</div>
                    <div>{formData.phone}</div>
                  </div>
                </div>
              )}

              {/* Accent Line */}
              <div
                className="h-1 rounded-full mt-3"
                style={{
                  background: `linear-gradient(to left, ${formData.primary_color}, ${formData.secondary_color})`,
                }}
              />
            </div>

            {/* Sample Clinical Medical Report Body */}
            <div className="relative z-10 space-y-3.5 my-auto py-3">
              {/* Report Title */}
              <div className="text-center border-b pb-2">
                <span className="text-[9px] font-mono text-slate-400 block">BILAN CLINIQUE & COMPTE RENDU MÉDICAL</span>
                <h3 className="text-xs font-black text-slate-900 mt-0.5">حصيلة التقييم السريري والتأهيلي</h3>
              </div>

              {/* Patient Meta Box */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-500">اسم المريض: </span>
                  <strong className="text-slate-900">يوسف بوعلام</strong>
                </div>
                <div>
                  <span className="text-slate-500">العمر: </span>
                  <strong className="text-slate-900">8 سنوات و 4 أشهر</strong>
                </div>
                <div>
                  <span className="text-slate-500">رقم الملف: </span>
                  <strong className="font-mono text-slate-900">#DZ-2026-0842</strong>
                </div>
                <div>
                  <span className="text-slate-500">التاريخ: </span>
                  <strong className="font-mono text-slate-900">28/08/2026</strong>
                </div>
              </div>

              {/* Sample Diagnostic Content */}
              <div className="space-y-2 text-[9.5px] leading-relaxed text-slate-700">
                <div className="font-bold flex items-center gap-1" style={{ color: formData.primary_color }}>
                  <span>📌 الخلاصة التشخيصية والملاحظات السريرية:</span>
                </div>
                <p className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                  أظهرت نتائج الاختبارات المقننة (SSI-4 و رائز الفونولوجيا) وجود اضطراب في طلاقة الكلام بمستوى متوسط، مصحوب بوقفات لاإرادية أثناء القراءة الجهرية مع مرونة لسانية ممتازة.
                </p>

                <div className="font-bold flex items-center gap-1 pt-1" style={{ color: formData.primary_color }}>
                  <span>🎯 التوصيات والخطة العلاجية المقترحة:</span>
                </div>
                <p className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                  يوصى ببدء برنامج التأهيل الصوتي (Easy Onset) بمعدل حصتين أسبوعياً مع متابعة تمارين التنفس الحجابي المنزلية بالتنسيق مع الأولياء.
                </p>
              </div>
            </div>

            {/* Document Footer Section with Stamp & Signature */}
            <div className="relative z-10 pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-end justify-between px-2">
                <div className="text-center space-y-1">
                  <div className="text-[9px] font-bold text-slate-700">توقيع وختم الطبيب المشرف</div>
                  <div className="w-20 h-12 rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 relative">
                    {signaturePreview ? (
                      <img src={signaturePreview} alt="Signature" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[7px] text-slate-400">توقيع الطبيب</span>
                    )}
                  </div>
                </div>

                {formData.show_stamp_on_bilans && (
                  <div className="text-center space-y-1">
                    <div className="text-[9px] font-bold text-slate-700">الختم الطبي الرسمي</div>
                    <div className="w-16 h-16 rounded-full border border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 relative">
                      {stampPreview ? (
                        <img src={stampPreview} alt="Stamp" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[7px] text-slate-400">الختم الدائري</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Legal Footer Notice */}
              <div className="text-center pt-2 border-t border-slate-100 text-[8px] text-slate-500 leading-tight">
                <div>{formData.address} • {formData.wilaya} • هاتف: {formData.phone}</div>
                <div className="text-[7px] text-slate-400 mt-0.5">{formData.footer_text}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
