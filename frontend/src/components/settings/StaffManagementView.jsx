import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Search,
  Key,
  Trash2,
  Edit,
  Sparkles,
  Building2,
  Activity,
  X,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  Stethoscope,
  Calendar,
  CreditCard,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  Award,
  UserCheck,
  UserX,
  FileText,
  DollarSign,
  DoorOpen,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { staffApi } from '../../api';

export default function StaffManagementView({ tenant, user }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Permissions catalog state
  const [permissionsCatalog, setPermissionsCatalog] = useState({});
  const [rolePresets, setRolePresets] = useState({});
  const [rolesInfo, setRolesInfo] = useState({});

  // Form data for add / edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'specialist',
    specialty: 'أخصائي أرطوفونيا وتخاطب (Orthophoniste)',
    room_number: '',
    commission_percentage: '',
    password: '',
  });

  // Permissions state for matrix editor
  const [currentPermissions, setCurrentPermissions] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const specialtyPresets = [
    'أخصائي أرطوفونيا وتخاطب (Orthophoniste)',
    'طبيب / أخصائي نفساني عيادي (Psychologue Clinicien)',
    'أخصائي تأهيل نفسي حركي (Psychomotricien)',
    'طبيب نفسي / أعصاب (Neuro-Psychiatre)',
    'طبيب عام / ممارس سريري (Médecin Généraliste)',
    'استقبال وسكرتارية طبية (Secrétaire Médicale)',
    'مساعد سريري / متدرب (Assistant Thérapeute)',
    'مدير العيادة والمشرف العام (Directeur Médical)',
  ];

  const roleBadges = {
    admin_owner: { label: '👑 مدير العيادة / المالك', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    clinic_admin: { label: '👑 مدير العيادة (Admin)', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    doctor: { label: '🩺 طبيب سريري (Médecin)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    specialist: { label: '🩺 أخصائي معالج (Specialist)', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
    orthophonist: { label: '🗣️ أخصائي أرطوفونيا', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    psychologist: { label: '🧠 أخصائي نفساني', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    psychomotor: { label: '🏃 تأهيل نفسي حركي', color: 'bg-lime-500/20 text-lime-300 border-lime-500/30' },
    receptionist: { label: '📋 سكرتارية واستقبال', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    secretary: { label: '📋 سكرتارية طبية', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    assistant: { label: '🤝 مساعد سريري', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    intern: { label: '🎓 متدرب / مساعد', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  };

  const categoryIcons = {
    patients: Users,
    clinical: Stethoscope,
    specialties: Award,
    agenda: Calendar,
    finance: CreditCard,
    settings: Shield,
  };

  const fetchStaffAndCatalog = async () => {
    try {
      setLoading(true);
      const [staffRes, catalogRes] = await Promise.allSettled([
        staffApi.list(),
        staffApi.getPermissionsCatalog(),
      ]);

      if (staffRes.status === 'fulfilled') {
        const list = Array.isArray(staffRes.value) 
          ? staffRes.value 
          : staffRes.value?.data || staffRes.value?.staff || [];
        setStaffList(list);
      }

      if (catalogRes.status === 'fulfilled' && catalogRes.value?.catalog) {
        setPermissionsCatalog(catalogRes.value.catalog);
        setRolePresets(catalogRes.value.role_presets || {});
        setRolesInfo(catalogRes.value.roles_info || {});
      }
    } catch (err) {
      console.error('Failed to load staff or catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndCatalog();
  }, []);

  // Handle Add Staff Member
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        ...formData,
        commission_percentage: formData.commission_percentage !== '' ? parseFloat(formData.commission_percentage) : null,
      };
      const res = await staffApi.create(payload);
      setFeedback({ type: 'success', text: res.message || 'تمت إضافة عضو الفريق بنجاح! ✨' });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'specialist',
        specialty: 'أخصائي أرطوفونيا وتخاطب (Orthophoniste)',
        room_number: '',
        commission_percentage: '',
        password: '',
      });
      fetchStaffAndCatalog();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'تعذر إضافة الموظف. يرجى التأكد من صحة البيانات والبريد الإلكتروني.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (member) => {
    setSelectedStaff(member);
    setFormData({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'specialist',
      specialty: member.specialty || '',
      room_number: member.room_number || '',
      commission_percentage: member.commission_percentage !== null && member.commission_percentage !== undefined ? member.commission_percentage : '',
      password: '',
    });
    setIsEditModalOpen(true);
  };

  // Handle Update Staff Member Details
  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password; // don't send empty password
      payload.commission_percentage = payload.commission_percentage !== '' ? parseFloat(payload.commission_percentage) : null;

      const res = await staffApi.update(selectedStaff.id, payload);
      setFeedback({ type: 'success', text: res.message || 'تم تحديث بيانات العضو بنجاح!' });
      setIsEditModalOpen(false);
      fetchStaffAndCatalog();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحديث البيانات.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Permissions Matrix Modal
  const openPermissionsModal = (member) => {
    setSelectedStaff(member);
    const existingPerms = Array.isArray(member.permissions) ? member.permissions : [];
    setCurrentPermissions(existingPerms);
    setIsPermissionsModalOpen(true);
  };

  // Toggle individual permission in matrix
  const togglePermission = (permKey) => {
    setCurrentPermissions((prev) => {
      if (prev.includes(permKey)) {
        return prev.filter((p) => p !== permKey);
      } else {
        return [...prev, permKey];
      }
    });
  };

  // Apply Role Preset Permissions
  const applyRolePreset = (targetRole) => {
    const preset = rolePresets[targetRole] || rolePresets['specialist'] || [];
    setCurrentPermissions(preset);
  };

  // Select all permissions
  const selectAllPermissions = () => {
    const all = [];
    Object.values(permissionsCatalog).forEach((cat) => {
      Object.keys(cat.items || {}).forEach((k) => all.push(k));
    });
    setCurrentPermissions(all);
  };

  // Clear all permissions
  const clearAllPermissions = () => {
    setCurrentPermissions([]);
  };

  // Save Permissions Matrix
  const handleSavePermissions = async () => {
    if (!selectedStaff) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await staffApi.updatePermissions(selectedStaff.id, currentPermissions);
      setFeedback({ type: 'success', text: res.message || 'تم حفظ وتفعيل مصفوفة الصلاحيات بنجاح! 🛡️' });
      setIsPermissionsModalOpen(false);
      fetchStaffAndCatalog();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الصلاحيات.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Staff Active Status
  const handleToggleStatus = async (member) => {
    try {
      const res = await staffApi.toggleStatus(member.id);
      setFeedback({ type: 'success', text: res.message });
      fetchStaffAndCatalog();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'تعذر تغيير حالة الحساب.' });
    }
  };

  // Delete Staff Member
  const handleDeleteStaff = async (member) => {
    if (!window.confirm(`هل أنت متأكد من حذف حساب (${member.name}) نهائياً من العيادة؟`)) {
      return;
    }

    try {
      const res = await staffApi.delete(member.id);
      setFeedback({ type: 'success', text: res.message || 'تم حذف الحساب بنجاح.' });
      fetchStaffAndCatalog();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'تعذر حذف الحساب.' });
    }
  };

  // Copy email helper
  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.specialty?.toLowerCase().includes(q) ||
      s.room_number?.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.is_active !== false) ||
      (statusFilter === 'inactive' && s.is_active === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate Metrics
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.is_active !== false).length;
  const totalClinicians = staffList.filter((s) => ['doctor', 'specialist', 'orthophonist', 'psychologist', 'psychomotor'].includes(s.role)).length;
  const totalReception = staffList.filter((s) => ['receptionist', 'secretary'].includes(s.role)).length;
  const totalAdmins = staffList.filter((s) => ['clinic_admin', 'admin_owner', 'admin'].includes(s.role)).length;

  // Calculate total possible permissions from catalog
  let totalCatalogPermissions = 0;
  Object.values(permissionsCatalog).forEach((cat) => {
    totalCatalogPermissions += Object.keys(cat.items || {}).length;
  });
  if (totalCatalogPermissions === 0) totalCatalogPermissions = 24;

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* ========================================================================= */}
      {/* HEADER BANNER & METRICS                                                   */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-1">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>CLINICAL RBAC & GRANULAR PERMISSIONS MATRIX</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {activeStaff} نشط من أصل {totalStaff} عضو 👥
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة كوادر العيادة والأدوار والصلاحيات</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              تحكم دقيق في وصول الأطباء، أخصائيي الأرطوفونيا، علم النفس، التأهيل الحركي، وطاقم السكرتارية، مع مصفوفة صلاحيات تفصيلية لحماية سرية السجلات السريرية.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  role: 'specialist',
                  specialty: 'أخصائي أرطوفونيا وتخاطب (Orthophoniste)',
                  room_number: '',
                  commission_percentage: '',
                  password: '',
                });
                setIsAddModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black transition flex items-center space-x-2 space-x-reverse shadow-xl shadow-indigo-600/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة عضو جديد للفريق</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold">الأطباء والمعالجون السريريون</div>
                <div className="text-xs text-slate-500">أرطوفونيا، نفساني، حركي، أطباء</div>
              </div>
            </div>
            <span className="text-lg font-black text-teal-300 font-mono">{totalClinicians}</span>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold">طاقم الاستقبال والسكرتارية</div>
                <div className="text-xs text-slate-500">الأجندة، قاعة الانتظار، الفوترة</div>
              </div>
            </div>
            <span className="text-lg font-black text-amber-300 font-mono">{totalReception}</span>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold">إدارة العيادة والمشرفين</div>
                <div className="text-xs text-slate-500">تحكم كامل بالإعدادات والنظام</div>
              </div>
            </div>
            <span className="text-lg font-black text-purple-300 font-mono">{totalAdmins}</span>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            {feedback.text}
          </span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEARCH AND FILTERS BAR                                                    */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، البريد الإلكتروني، رقم الهاتف، التخصص، أو رقم القاعة..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">كافة الأدوار الوظيفية</option>
            <option value="clinic_admin">👑 مدير العيادة (Admin)</option>
            <option value="specialist">🩺 أخصائي معالج (Specialist)</option>
            <option value="orthophonist">🗣️ أخصائي أرطوفونيا</option>
            <option value="psychologist">🧠 أخصائي نفساني</option>
            <option value="psychomotor">🏃 تأهيل نفسي حركي</option>
            <option value="doctor">🩺 طبيب سريري</option>
            <option value="receptionist">📋 سكرتارية واستقبال</option>
            <option value="assistant">🤝 مساعد سريري / متدرب</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">كافة الحالات</option>
            <option value="active">نشط ومفعل 🟢</option>
            <option value="inactive">معطل ومجمد 🔴</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STAFF MEMBERS CARDS GRID                                                  */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="text-xs font-bold">جاري تحميل بيانات الكوادر ومصفوفة الصلاحيات السريرية...</span>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">لا يوجد أعضاء يطابقون معايير البحث</h3>
          <p className="text-xs text-slate-400">يمكنك إضافة عضو جديد أو إعادة ضبط فلاتر البحث.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((member) => {
            const badge = roleBadges[member.role] || {
              label: member.role || 'عضو فريق',
              color: 'bg-slate-800 text-slate-300 border-slate-700',
            };
            const activePermsCount = Array.isArray(member.permissions) ? member.permissions.length : 0;
            const isCurrentUser = member.id === user?.id;

            return (
              <div
                key={member.id}
                className={`bg-slate-900 border rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl transition-all hover:border-indigo-500/40 relative flex flex-col justify-between ${
                  member.is_active === false
                    ? 'border-rose-900/40 opacity-75 bg-slate-950/90'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Top Bar: Avatar, Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20 shrink-0">
                        {member.name ? member.name.charAt(0) : 'Ψ'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-black text-white text-sm">{member.name}</h3>
                          {isCurrentUser && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              أنت
                            </span>
                          )}
                          {member.is_active === false && (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                              مجمد
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{member.specialty || 'ممارس سريري بالعيادة'}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Badges for Room & Commission */}
                  {(member.room_number || (member.commission_percentage !== null && member.commission_percentage !== undefined && member.commission_percentage > 0)) && (
                    <div className="flex items-center gap-2 pt-3 flex-wrap">
                      {member.room_number && (
                        <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20 flex items-center gap-1">
                          <DoorOpen className="w-3 h-3 text-cyan-400" />
                          <span>{member.room_number}</span>
                        </span>
                      )}
                      {member.commission_percentage !== null && member.commission_percentage !== undefined && member.commission_percentage > 0 && (
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-emerald-400" />
                          <span>نسبة أتعاب: {member.commission_percentage}%</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Details (Email, Phone) */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        <span>البريد:</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-slate-300 text-left truncate max-w-[160px]" dir="ltr">
                          {member.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(member.email)}
                          className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
                          title="نسخ البريد الإلكتروني"
                        >
                          {copiedEmail === member.email ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {member.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-indigo-400" />
                          <span>الهاتف:</span>
                        </span>
                        <span className="font-mono font-semibold text-slate-300 text-left" dir="ltr">
                          {member.phone}
                        </span>
                      </div>
                    )}

                    {/* Permissions Count Pill */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>الصلاحيات المفعلة:</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 text-[11px]">
                        {activePermsCount} من أصل {totalCatalogPermissions} 🛡️
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Granular Permissions Button */}
                    <button
                      type="button"
                      onClick={() => openPermissionsModal(member)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition flex items-center gap-1.5 shadow-sm"
                      title="تخصيص مصفوفة الصلاحيات السريرية والإدارية"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>الصلاحيات</span>
                    </button>

                    {/* Edit Details Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(member)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition flex items-center gap-1"
                      title="تعديل البيانات، التخصص، القاعة، والعمولة"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle Active Status */}
                    {!isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(member)}
                        className={`p-1.5 rounded-xl border text-[11px] font-bold transition ${
                          member.is_active === false
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                        }`}
                        title={member.is_active === false ? 'حساب مجمد - انقر لإعادة التفعيل' : 'حساب نشط - انقر للتجميد المؤقت'}
                      >
                        {member.is_active === false ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Delete Staff Member */}
                    {!isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(member)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                        title="حذف الحساب نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: GRANULAR PERMISSIONS MATRIX                                      */}
      {/* ========================================================================= */}
      {isPermissionsModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-right" dir="rtl">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <span>مصفوفة الصلاحيات السريرية والإدارية:</span>
                    <span className="text-indigo-400">{selectedStaff.name}</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    الدور الأساسي: {roleBadges[selectedStaff.role]?.label || selectedStaff.role} &bull; {selectedStaff.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Role Preset Toolbar */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-bold ml-1">تطبيق قالب صلاحيات جاهز:</span>
                <button
                  type="button"
                  onClick={() => applyRolePreset('clinic_admin')}
                  className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold hover:bg-purple-500/30 transition text-[11px]"
                >
                  👑 مدير كامل
                </button>
                <button
                  type="button"
                  onClick={() => applyRolePreset('orthophonist')}
                  className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold hover:bg-blue-500/30 transition text-[11px]"
                >
                  🗣️ أرطوفونيا
                </button>
                <button
                  type="button"
                  onClick={() => applyRolePreset('psychologist')}
                  className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold hover:bg-cyan-500/30 transition text-[11px]"
                >
                  🧠 علم نفس
                </button>
                <button
                  type="button"
                  onClick={() => applyRolePreset('psychomotor')}
                  className="px-2.5 py-1 rounded-xl bg-lime-500/20 text-lime-300 border border-lime-500/30 font-bold hover:bg-lime-500/30 transition text-[11px]"
                >
                  🏃 تأهيل حركي
                </button>
                <button
                  type="button"
                  onClick={() => applyRolePreset('specialist')}
                  className="px-2.5 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold hover:bg-teal-500/30 transition text-[11px]"
                >
                  🩺 طبيب / أخصائي
                </button>
                <button
                  type="button"
                  onClick={() => applyRolePreset('receptionist')}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold hover:bg-amber-500/30 transition text-[11px]"
                >
                  📋 سكرتارية
                </button>
                <button
                  type="button"
                  onClick={() => applyRolePreset('assistant')}
                  className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold hover:bg-rose-500/30 transition text-[11px]"
                >
                  🤝 مساعد
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllPermissions}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition text-[11px]"
                >
                  تحديد الكل ({totalCatalogPermissions})
                </button>
                <button
                  type="button"
                  onClick={clearAllPermissions}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition text-[11px]"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>

            {/* Matrix Body: 6 Categorized Permission Groups */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {Object.entries(permissionsCatalog).map(([catKey, category]) => {
                const CatIcon = categoryIcons[catKey] || Shield;
                const items = category.items || {};

                return (
                  <div key={catKey} className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <CatIcon className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-black text-white">{category.category_name}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(items).map(([permKey, perm]) => {
                        const isChecked = currentPermissions.includes(permKey);

                        return (
                          <div
                            key={permKey}
                            onClick={() => togglePermission(permKey)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                              isChecked
                                ? 'bg-indigo-600/10 border-indigo-500/40 text-white shadow-sm ring-1 ring-indigo-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="pt-0.5 shrink-0">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-slate-200">{perm.label}</div>
                              <div className="text-[10px] text-slate-400 leading-relaxed">{perm.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer: Save & Status */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-300 font-bold flex items-center gap-2">
                <span>تم تحديد:</span>
                <span className="font-mono text-emerald-400 font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  {currentPermissions.length} من {totalCatalogPermissions} صلاحية 🛡️
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPermissionsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'جاري الحفظ...' : 'حفظ وتطبيق الصلاحيات'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT STAFF MEMBER                                          */}
      {/* ========================================================================= */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6 font-sans text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  {isAddModalOpen ? <UserPlus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-black text-white">
                    {isAddModalOpen ? 'إضافة عضو جديد لطاقم العيادة' : 'تعديل بيانات عضو الفريق'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isAddModalOpen ? 'إنشاء حساب جديد وتعيين الدور والتخصص والقاعة' : 'تحديث الاسم، التخصص، القاعة، نسبة الأتعاب، أو كلمة السر'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleAddStaff : handleUpdateStaff} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">الاسم واللقب الكامل</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="د. ياسين مزيان / أ. أمينة بن علي"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">البريد الإلكتروني (لتسجيل الدخول)</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="practitioner@clinic.dz"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">رقم الهاتف المباشر</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0550 12 34 56"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">الدور الوظيفي الأساسي</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                  >
                    <option value="specialist">🩺 أخصائي معالج (Specialist)</option>
                    <option value="orthophonist">🗣️ أخصائي أرطوفونيا (Orthophoniste)</option>
                    <option value="psychologist">🧠 أخصائي نفساني (Psychologue)</option>
                    <option value="psychomotor">🏃 تأهيل نفسي حركي (Psychomotricien)</option>
                    <option value="doctor">🩺 طبيب سريري (Doctor)</option>
                    <option value="receptionist">📋 سكرتارية واستقبال (Reception)</option>
                    <option value="clinic_admin">👑 مدير العيادة (Admin)</option>
                    <option value="assistant">🤝 مساعد سريري / متدرب</option>
                  </select>
                </div>
              </div>

              {/* Specialty Preset */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">المسمى المهني والتخصص</label>
                <select
                  value={specialtyPresets.includes(formData.specialty) ? formData.specialty : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setFormData({ ...formData, specialty: e.target.value });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none text-xs"
                >
                  {specialtyPresets.map((sp) => (
                    <option key={sp} value={sp} className="bg-slate-900 text-slate-200">{sp}</option>
                  ))}
                  <option value="custom" className="bg-slate-900 text-slate-200">✍️ مسمى آخر مخصص...</option>
                </select>

                {(!specialtyPresets.includes(formData.specialty) || formData.specialty === '') && (
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="اكتب المسمى المهني بالتفصيل..."
                    className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-indigo-500/50 text-white font-medium focus:outline-none"
                  />
                )}
              </div>

              {/* Room Number & Commission Percentage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1">
                    <DoorOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>رقم القاعة / المكتب</span>
                  </label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    placeholder="مثلاً: قاعة 01 أو مكتب A"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>نسبة أتعاب الاستشارة (%)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.commission_percentage}
                    onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                    placeholder="مثلاً: 50%"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span>كلمة المرور المشفرة</span>
                  {isEditModalOpen && (
                    <span className="text-[10px] text-slate-500 font-normal">اتركها فارغة إذا كنت لا ترغب في تغييرها</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={isAddModalOpen}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={isEditModalOpen ? '•••••••• (تغيير اختياري)' : 'كلمة مرور لا تقل عن 6 أحرف'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white font-medium focus:outline-none text-left font-mono pl-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{submitting ? 'جاري الحفظ...' : isAddModalOpen ? 'إنشاء الحساب وتفعيل الصلاحيات' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
