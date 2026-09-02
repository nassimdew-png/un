import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Inbox, 
  Calendar, 
  Clock, 
  Phone, 
  Check, 
  X, 
  Send, 
  User, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { apiRequest } from '../../api';

export default function PublicBookingsInboxWidget({ onAppointmentCreated = null }) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await apiRequest('/clinic/booking-requests');
      if (res.success) {
        setRequests(res.requests || []);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      console.error('Error fetching clinic booking requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    setProcessingId(id);
    try {
      const res = await apiRequest(`/clinic/booking-requests/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          create_appointment: newStatus === 'approved',
        }),
      });

      if (res.success) {
        setToastMessage(res.message);
        setTimeout(() => setToastMessage(null), 4000);
        fetchBookings();
        if (newStatus === 'approved' && onAppointmentCreated) {
          onAppointmentCreated(res.appointment);
        }
      }
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  if (pendingRequests.length === 0 && !loading) {
    return null; // Don't clutter dashboard if no pending incoming bookings
  }

  return (
    <div className="p-5 rounded-3xl bg-slate-900/90 border border-teal-500/30 shadow-2xl relative overflow-hidden" dir="rtl">
      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black text-sm">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>طلبات الحجز الواردة من الدليل الوطني</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30 animate-pulse">
                {counts.pending || pendingRequests.length} طلب جديد
              </span>
            </h3>
          </div>
        </div>

        <span className="text-[11px] text-slate-500">حجوزات مباشرة من https://psypro.tech/annuaire</span>
      </div>

      {/* Requests List */}
      <div className="mt-4 space-y-3">
        {pendingRequests.map((req) => {
          const patientPhone = req.phone ? pregPhone(req.phone) : '';
          const waUrl = patientPhone ? `https://wa.me/${patientPhone}?text=${encodeURIComponent(`السلام عليكم، نتواصل معكم من العيادة بخصوص طلب موعدكم ليوم ${req.preferred_date}`)}` : null;

          return (
            <div
              key={req.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-sm">{req.patient_name}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-teal-300">
                    {req.specialty === 'orthophonie' ? 'أرطوفونيا' : req.specialty === 'psychologie' ? 'علم نفس' : 'استشارة سريرية'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{req.phone}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-teal-400" />
                    <span>تاريخ الموعد: <strong>{req.preferred_date}</strong> ({req.preferred_time_slot})</span>
                  </span>
                </div>

                {req.reason_for_visit && (
                  <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 mt-1">
                    💬 {req.reason_for_visit}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition"
                    title="مراسلة سريعة عبر واتساب"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  onClick={() => handleUpdateStatus(req.id, 'rejected')}
                  disabled={processingId === req.id}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-400 text-xs font-bold transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleUpdateStatus(req.id, 'approved')}
                  disabled={processingId === req.id}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{processingId === req.id ? 'جارٍ التثبيت...' : '✅ قبول وتثبيت في الأجندة'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function pregPhone(phone) {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) {
    return '213' + digits.substring(1);
  }
  return digits;
}
