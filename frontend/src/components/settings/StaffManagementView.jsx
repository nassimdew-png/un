import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Search,
  Key,
  Trash2,
  Edit,
  Sparkles,
  Building2,
  Activity,
  X
} from 'lucide-react';
import { apiRequest } from '../../api';

export default function StaffManagementView({ tenant, user }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'specialist',
    specialty: 'orthophony',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/staff');
      const list = Array.isArray(res) ? res : res.data || res.staff || [];
      if (list.length > 0) {
        setStaffList(list);
      } else {
        // Fallback demo data if empty
        setStaffList([
          {
            id: user?.id || 1,
            name: user?.name || 'د. المشرف السريري',
            email: user?.email || 'admin@clinic.dz',
            phone: user?.phone || '0550123456',
            role: user?.role || 'admin_owner',
            specialty: 'أرطوفونيا وعلم النفس العيادي',
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setStaffList([
        {
          id: user?.id || 1,
          name: user?.name || 'د. المشرف السريري',
          email: user?.email || 'admin@clinic.dz',
          phone: user?.phone || '0550123456',
          role: user?.role || 'admin_owner',
          specialty: 'أرطوفونيا وعلم النفس العيادي',
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await apiRequest('/staff', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setFeedback({ type: 'success', text: 'تمت إضافة عضو الفريق بنجاح!' });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'specialist',
        specialty: 'orthophony',
        password: '',
      });
      fetchStaff();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'تعذر إضافة الموظف. يرجى التأكد من صحة البيانات.' });
    } finally {
      setSubmitting(false);
    }
  };

  const roleBadges = {
    admin_owner: { label: 'مدير العيادة / مالك', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    clinic_admin: { label: 'مشرف إداري', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    doctor: { label: 'طبيب ممارس', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    specialist: { label: 'أخصائي سريري', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
    orthophonist: { label: 'أخصائي أرطوفونيا', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    psychologist: { label: 'أخصائي نفساني', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    receptionist: { label: 'استقبال وسكرتارية', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  };

  const filteredStaff = staffList.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.phone?.includes(q);
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                CLINIC TEAM & PRACTITIONERS
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {staffList.length} أعضاء مسجلين 👥
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة فريق العمل والممارسين السريريين</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              إدارة حسابات الأطباء، الأخصائيين النفسيين والأرطوفونيين، وطاقم الاستقبال مع ضبط الصلاحيات.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-2 space-x-reverse shadow-lg shadow-indigo-600/30 self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة عضو جديد للفريق</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، البريد، أو رقم الهاتف..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-full md:w-auto"
        >
          <option value="all">كافة الأدوار والصلاحيات</option>
          <option value="admin_owner">مدير العيادة / المالك</option>
          <option value="specialist">أخصائي سريري</option>
          <option value="orthophonist">أخصائي أرطوفونيا</option>
          <option value="psychologist">أخصائي نفساني</option>
          <option value="receptionist">سكرتارية واستقبال</option>
        </select>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStaff.map((member) => {
          const badge = roleBadges[member.role] || { label: member.role || 'عضو فريق', color: 'bg-slate-800 text-slate-300 border-slate-700' };
          return (
            <div
              key={member.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-5 space-y-4 shadow-xl transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-900 to-slate-800 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-black text-lg">
                    {member.name ? member.name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{member.name}</h3>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{member.email}</div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${badge.color}`}>
                  {badge.label}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> الهاتف:</span>
                  <strong className="font-mono text-slate-200">{member.phone || 'غير مسجل'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-slate-500" /> الحالة:</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> نشط
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <span>إضافة عضو جديد لطاقم العيادة</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="د. أحمد بن علي"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">البريد الإلكتروني (لتسجيل الدخول):</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ahmed@clinic.dz"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">رقم الهاتف:</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0550123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">الدور والصلاحية:</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="specialist">أخصائي سريري</option>
                    <option value="orthophonist">أخصائي أرطوفونيا</option>
                    <option value="psychologist">أخصائي نفساني</option>
                    <option value="doctor">طبيب ممارس</option>
                    <option value="receptionist">استقبال وسكرتارية</option>
                    <option value="clinic_admin">مشرف إداري</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">كلمة المرور المؤقتة:</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'جاري الحفظ...' : 'حفظ وإرسال الدعوة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
