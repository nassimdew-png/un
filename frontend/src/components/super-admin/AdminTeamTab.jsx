import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Key,
  Mail,
  UserCheck,
  Zap
} from 'lucide-react';
import { apiRequest } from '../../api';

export default function AdminTeamTab() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/super-admin/admin-team');
      if (res.success) {
        setMembers(res.members || res.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiRequest('/super-admin/admin-team', {
        method: 'POST',
        body: JSON.stringify(newMember),
      });
      if (res.success) {
        setFeedback({ type: 'success', text: 'تمت إضافة العضو الإداري بنجاح!' });
        setShowAddModal(false);
        setNewMember({ name: '', email: '', password: '', role: 'admin' });
        fetchMembers();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل إنشاء الحساب الإداري.' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('هل أنت متأكد من سحب صلاحيات هذا المسؤول وإلغاء حسابه؟')) return;
    try {
      const res = await apiRequest(`/super-admin/admin-team/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setFeedback({ type: 'success', text: 'تم سحب الصلاحيات بنجاح.' });
        fetchMembers();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'فشل حذف الحساب.' });
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* 1. Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/25">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">إدارة المشرفين والأذونات (Admin Team & RBAC)</h2>
            <p className="text-xs text-slate-400">إدارة فريق العمل، تعيين الصلاحيات الإدارية وتأمين حسابات المشرفين</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            type="button"
            onClick={fetchMembers}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-2 space-x-reverse text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-2 space-x-reverse shadow-lg shadow-purple-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مسؤول جديد</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 space-x-reverse ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="font-bold">{feedback.text}</span>
        </div>
      )}

      {/* 2. Search & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد الإلكتروني..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
          <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
        </div>

        <div className="text-xs text-slate-400">
          <span>إجمالي أعضاء الإدارة: <strong className="text-white font-mono">{members.length}</strong></span>
        </div>
      </div>

      {/* 3. Members Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-bold">الاسم والبريد</th>
                <th className="py-3.5 px-4 font-bold">الدور والرتبة</th>
                <th className="py-3.5 px-4 font-bold">الحالة</th>
                <th className="py-3.5 px-4 font-bold">تاريخ الانضمام</th>
                <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                    جاري تحميل قائمة أعضاء الإدارة...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    لا يوجد أعضاء مسجلين.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4">
                      <div className="font-bold text-white">{member.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1 space-x-reverse mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{member.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center space-x-1.5 space-x-reverse px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold text-[10px]">
                        <Shield className="w-3 h-3" />
                        <span>{member.role === 'superadmin' ? 'مشرف عام أعلى' : 'مسؤول إداري'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center space-x-1 space-x-reverse px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                        <UserCheck className="w-3 h-3" />
                        <span>نشط</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-400">
                      {member.created_at ? new Date(member.created_at).toLocaleDateString('ar-DZ') : '--'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {member.email !== 'superadmin@clinic-saas.dz' && member.email !== 'admin@psypro.tech' && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(member.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="سحب الصلاحيات"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-right">
            <h3 className="text-base font-black text-white flex items-center space-x-2 space-x-reverse">
              <Users className="w-5 h-5 text-purple-400" />
              <span>إضافة مشرف إداري جديد</span>
            </h3>

            <form onSubmit={handleCreateMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف معمري"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  required
                  placeholder="admin@psypro.tech"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور:</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newMember.password}
                  onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 transition"
                >
                  {submitting ? 'جاري الإنشاء...' : 'حفظ المسؤول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
