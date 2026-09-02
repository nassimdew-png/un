import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Stethoscope, 
  User, 
  ArrowRight,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { apiRequest } from '../../api';

export default function PublicClinicProfileModal({ clinic, onClose, onBookingSuccess }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: Select slot, 2: Patient info, 3: Success

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('09:00 - 10:00');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [specialty, setSpecialty] = useState(clinic?.type || 'orthophonie');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!clinic) return null;

  const timeSlots = [
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00',
  ];

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest(`/public/directory/${clinic.id}/book`, {
        method: 'POST',
        body: JSON.stringify({
          patient_name: patientName,
          phone: patientPhone,
          specialty,
          preferred_date: selectedDate,
          preferred_time_slot: selectedSlot,
          reason_for_visit: reason,
        }),
      });

      if (res.success) {
        setStep(3);
        if (onBookingSuccess) onBookingSuccess(res.booking_request);
      } else {
        setError(res.message || 'تعذر إرسال الطلب');
      }
    } catch (err) {
      setError(err.message || 'فشل إرسال طلب الحجز');
    } finally {
      setSubmitting(false);
    }
  };

  const accentColor = clinic.report_accent_color || '#0d9488';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            {clinic.logo_url ? (
              <img src={clinic.logo_url} alt={clinic.name} className="w-14 h-14 rounded-2xl object-contain bg-slate-900 p-1 border border-slate-800 shrink-0" />
            ) : (
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-950 font-black text-xl shrink-0 shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                {clinic.name?.charAt(0) || '🏥'}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white truncate">{clinic.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>معتمد</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>{clinic.wilaya} {clinic.commune ? `(${clinic.commune})` : ''} &bull; {clinic.address}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              {/* Bio & Pricing Highlights */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {clinic.public_bio}
                </p>
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400">سعر الاستشارة / التقييم المبدئي:</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">{clinic.consultation_fee_dzd} دج</span>
                </div>
              </div>

              {/* Step 1: Select Date and Slot */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-400" />
                  <span>1. اختر تاريخ الموعد والفترة الزمنية المفضلة:</span>
                </h4>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">تاريخ الزيارة المطلوب:</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-teal-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">الفترات المتاحة:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 border ${
                          selectedSlot === slot
                            ? 'bg-teal-600 text-slate-950 border-teal-500 shadow-md'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{slot}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 transition"
                >
                  <span>متابعة إدخال بيانات المريض</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmitBooking} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 text-red-300 border border-red-500/30 font-bold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم ولقب المريض / الطفل:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يانيس مزياني"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الهاتف (الولي للتأكيد والتواصل):</label>
                <input
                  type="tel"
                  required
                  placeholder="0550123456"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">التخصص أو سبب الاستشارة:</label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 font-bold"
                >
                  <option value="orthophonie">أرطوفونيا وتأهيل لغوي ونطق</option>
                  <option value="psychologie">علم نفس واستشارات نفسية وعيادية</option>
                  <option value="neuro_psychiatrie">طب نفسي وأعصاب</option>
                  <option value="pluridisciplinaire">فحص وتقييم شامل متعدد التخصصات</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات إضافية أو أعراض الحالية (اختياري):</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات مختصرة حول الحالة أو الصعوبات الملاحظة..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  رجوع
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black shadow-lg flex items-center gap-2 transition disabled:opacity-50"
                >
                  <span>{submitting ? 'جارٍ إرسال الطلب...' : '⚡ تأكيد وإرسال طلب الحجز'}</span>
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-3xl shadow-xl animate-bounce">
                ✓
              </div>
              <h4 className="text-lg font-black text-white">تم إرسال طلب الحجز بنجاح!</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                شكراً لكم. تم إشعار فريق الاستقبال في <strong>{clinic.name}</strong>، وسيتم الاتصال بكم هاتفياً على الرقم <strong>{patientPhone}</strong> لتأكيد الموعد النهائي.
              </p>
              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
