import React, { useState } from 'react';
import { superAdminApi } from '../../api';
import {
  Building2,
  X,
  ShieldCheck,
  Mail,
  Lock,
  Phone,
  MapPin,
  Sparkles,
  Stethoscope,
  Brain,
  Layers,
  Plus,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

const ALGERIAN_WILAYAS = [
  '16 - الجزائر العاصمة',
  '31 - وهران',
  '25 - قسنطينة',
  '19 - سطيف',
  '09 - البليدة',
  '06 - بجاية',
  '15 - تيزي وزو',
  '13 - تلمسان',
  '23 - عنابة',
  '35 - بومرداس',
  '47 - غرداية',
  '30 - ورقلة',
  '05 - باتنة',
  '27 - مستغانم',
  '22 - سيدي بلعباس',
  '02 - الشلف',
  '26 - المدية',
  '10 - البويرة',
  '17 - الجلفة',
  '18 - جيجل',
  '21 - سكيكدة',
  '34 - برج بوعريريج',
];

export default function CreateTenantModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [type, setType] = useState('orthophony');
  const [plan, setPlan] = useState('pro');
  const [status, setStatus] = useState('active');

  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('0550000000');
  const [adminPassword, setAdminPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const [wilaya, setWilaya] = useState('16 - الجزائر العاصمة');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (val) => {
    setName(val);
    if (!subdomain || subdomain === generateSlug(name)) {
      setSubdomain(generateSlug(val));
    }
    if (!adminName) {
      setAdminName(`د. مسؤول ${val}`);
    }
  };

  const generateSlug = (val) => {
    return val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await superAdminApi.createClinic({
        name,
        clinic_name: name,
        subdomain: subdomain.trim().toLowerCase(),
        type,
        specialty: type,
        plan,
        plan_id: plan,
        status,
        admin_name: adminName,
        admin_email: adminEmail.trim().toLowerCase(),
        email: adminEmail.trim().toLowerCase(),
        admin_phone: adminPhone,
        phone: adminPhone,
        admin_password: adminPassword,
        password: adminPassword,
        wilaya,
        city: wilaya,
        address: address ? `${address} - ${wilaya}` : `${wilaya}, Algérie`,
      });

      if (res.success || res.status === 'success') {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.message || 'فشل إنشاء العيادة.');
      }
    } catch (err) {
      console.error('Failed to create clinic:', err);
      setError(err.response?.data?.message || err.message || 'حدث خطأ أثناء محاولة إنشاء وتفعيل العيادة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans text-right animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center space-x-3.5 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-white">إنشاء وتجهيز عيادة جديدة على المنصة</h3>
              <p className="text-xs text-slate-400">توليد مساحة العمل المعزولة، حساب المدير، وقواعد الـ DNS وتراخيص النظام تلقائياً</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Clinic Identity */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>1. بيانات الهوية الطبية والموقع</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم العيادة / المركز الطبي *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="مثال: عيادة النور للأرطوفونيا"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  النطاق الفرعي (Subdomain) *
                </label>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden focus-within:border-emerald-500 transition" dir="ltr">
                  <input
                    type="text"
                    required
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="el-nour"
                    className="w-full px-4 py-2.5 bg-transparent text-white text-xs font-mono focus:outline-none"
                  />
                  <span className="px-3 py-2.5 bg-slate-800 text-slate-400 text-xs font-mono font-bold border-l border-slate-700">
                    .psypro.tech
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  التخصص الطبي الأساسي *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="orthophony">🗣️ أرطوفونيا وتأهيل النطق والكلام (Orthophonie)</option>
                  <option value="psychology">🧠 علم النفس والاستشارات النفسية (Psychologie)</option>
                  <option value="multidisciplinary">🏢 مركز تأهيل متعدد التخصصات (Pluridisciplinaire)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الولاية *
                </label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  {ALGERIAN_WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  العنوان التفصيلي
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: حي 500 مسكن، عمارة B، الطابق 1"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Subscription & Status */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>2. خطة الاشتراك والحالة المبدئية</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  باقة الاشتراك *
                </label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="pro">⭐ باقة العيادة الفردية (Clinic PRO)</option>
                  <option value="multi_pro">🚀 باقة المراكز الشاملة (Multi-Disciplinary PRO)</option>
                  <option value="enterprise">👑 باقة المجمعات الكبرى (Enterprise VIP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  حالة الحساب المبدئية *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="active">🟢 حساب نشط ومشترك (Active)</option>
                  <option value="trial">⏳ فترة تجريبية مجانية 14 يوماً (Trial)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Clinic Administrator Account */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>3. حساب المشرف / الطبيب المسؤول (Admin Owner)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم الطبيب / المشرف *
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="د. أحمد بن علي"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رقم الهاتف *
                </label>
                <input
                  type="text"
                  required
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="0559 22 33 44"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  البريد الإلكتروني لتسجيل الدخول *
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="dr.benali@gmail.com"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  كلمة المرور الافتراضية *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading || !name || !subdomain || !adminEmail}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-xl shadow-emerald-500/25 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{loading ? 'جاري تجهيز وتفعيل العيادة...' : '🚀 إنشاء وتجهيز العيادة الآن'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
