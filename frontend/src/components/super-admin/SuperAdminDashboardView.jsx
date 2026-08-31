import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Sparkles, 
  CreditCard, 
  TrendingUp, 
  RefreshCw,
  Layers,
  Activity,
  DollarSign,
  UserCheck,
  Clock
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function SuperAdminDashboardView() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token') || '';
      const res = await fetch('/api/superadmin/stats', {
        headers: {
          'Accept': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        }
      });
      if (res.ok) {
        const json = await res.json();
        setStats(json.data || json);
      }
    } catch (e) {
      console.warn('Could not fetch live superadmin stats, fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalClinics = stats?.total_clinics ?? stats?.data?.total_clinics ?? 0;
  const activeSubscriptions = stats?.active_subscriptions ?? stats?.data?.active_subscriptions ?? 0;
  const trialClinics = stats?.trial_clinics ?? stats?.data?.trial_clinics ?? 0;
  const totalPatients = stats?.total_patients ?? stats?.data?.total_patients ?? 0;
  const totalRevenue = stats?.total_revenue ?? stats?.data?.total_revenue ?? 0;
  const currency = stats?.currency ?? 'DZD';

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">📊 الإحصائيات العامة للمنصة السحابية</h2>
          <p className="text-xs text-slate-500 mt-0.5">مؤشرات النمو، الإيرادات، واستخدام العيادات المسجلة بالمنظومة</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث الأرقام</span>
        </button>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Clinics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">إجمالي العيادات</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalClinics}</div>
          </div>
        </div>

        {/* Card 2: Active Subscribers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">مشتركون نشطون</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-0.5">{activeSubscriptions}</div>
          </div>
        </div>

        {/* Card 3: Trial Clinics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">فترة تجريبية</div>
            <div className="text-2xl font-extrabold text-amber-700 mt-0.5">{trialClinics}</div>
          </div>
        </div>

        {/* Card 4: Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">إجمالي المرضى</div>
            <div className="text-2xl font-extrabold text-blue-800 mt-0.5">{totalPatients}</div>
          </div>
        </div>

        {/* Card 5: Cumulative Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">الإيراد التراكمي</div>
            <div className="text-2xl font-extrabold text-purple-900 mt-0.5">
              {Number(totalRevenue).toLocaleString()} <span className="text-xs font-bold text-slate-500">{currency}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
