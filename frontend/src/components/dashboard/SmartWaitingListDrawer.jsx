import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Plus, 
  Search, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Filter, 
  AlertCircle,
  Sparkles,
  UserCheck,
  Send,
  ListOrdered,
  Layers,
  PhoneCall
} from 'lucide-react';
import { clinicApi } from '../../api';

export default function SmartWaitingListDrawer({
  isOpen,
  onClose,
  onAppointmentConverted,
}) {
  const { t } = useTranslation();
  const [waitingList, setWaitingList] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('waiting');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals inside drawer
  const [showAddModal, setShowAddModal] = useState(false);
  const [convertingEntry, setConvertingEntry] = useState(null);

  // New Intake Form
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [specialtyNeeded, setSpecialtyNeeded] = useState('orthophonie');
  const [urgencyLevel, setUrgencyLevel] = useState('medium');
  const [preferredDays, setPreferredDays] = useState([]);
  const [intakeNotes, setIntakeNotes] = useState('');
  const [savingIntake, setSavingIntake] = useState(false);

  // Conversion Form
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:45');
  const [appointmentType, setAppointmentType] = useState('therapy_session');
  const [converting, setConverting] = useState(false);

  const fetchWaitlist = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await clinicApi.getWaitingList({
        specialty: specialtyFilter,
        urgency: urgencyFilter,
        status: statusFilter,
        search: searchQuery,
      });
      if (res.success) {
        setWaitingList(res.waiting_list || []);
        setStats(res.stats || {});
      }
    } catch (err) {
      console.error('Error fetching waitlist:', err);
      setFeedback({ type: 'error', text: err.message || 'فشل تحميل قائمة الانتظار' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWaitlist();
    }
  }, [isOpen, specialtyFilter, urgencyFilter, statusFilter, searchQuery]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setSavingIntake(true);
    setFeedback(null);
    try {
      const res = await clinicApi.addToWaitingList({
        patient_name: patientName,
        phone: patientPhone,
        specialty_needed: specialtyNeeded,
        urgency_level: urgencyLevel,
        preferred_days: preferredDays,
        notes: intakeNotes,
      });
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'تمت إضافة الحالة لقائمة الانتظار بنجاح.' });
        setShowAddModal(false);
        setPatientName('');
        setPatientPhone('');
        setIntakeNotes('');
        setPreferredDays([]);
        fetchWaitlist();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تسجيل الحالة' });
    } finally {
      setSavingIntake(false);
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!convertingEntry) return;
    setConverting(true);
    setFeedback(null);
    try {
      const res = await clinicApi.convertWaitingToAppointment(convertingEntry.id, {
        date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        type: appointmentType,
      });
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'تم تحويل طلب الانتظار إلى موعد بنجاح!' });
        setConvertingEntry(null);
        fetchWaitlist();
        if (onAppointmentConverted) onAppointmentConverted();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تسكين الموعد' });
    } finally {
      setConverting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await clinicApi.updateWaitingStatus(id, newStatus);
      fetchWaitlist();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحديث الحالة' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب من قائمة الانتظار؟')) return;
    try {
      await clinicApi.deleteWaitingEntry(id);
      fetchWaitlist();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حذف الطلب' });
    }
  };

  const toggleDay = (day) => {
    setPreferredDays((prev) => 
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-fade-in" dir="rtl">
      {/* Sliding Drawer Container */}
      <div className="w-full max-w-2xl bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>قائمة الانتظار الذكية (Smart Waiting List)</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-teal-500/20 text-teal-300 font-bold">
                  {stats.total_waiting || 0} بانتظار التسكين
                </span>
              </h3>
              <p className="text-xs text-slate-400">إدارة طلبات المواعيد وتسكين الحالات العاجلة في الفترات الشاغرة</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حالة جديدة</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3 mx-4 mt-3 rounded-xl text-xs font-bold flex items-center justify-between ${
            feedback.type === 'error' ? 'bg-red-500/10 text-red-300 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
          }`}>
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)}>&times;</button>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Specialty Filter */}
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold focus:outline-none focus:border-teal-500"
            >
              <option value="">جميع التخصصات</option>
              <option value="orthophonie">أرطوفونيا (Orthophonie)</option>
              <option value="psychologie">علم نفس (Psychologie)</option>
              <option value="neuro_psychiatrie">طب نفسي / عصبي</option>
            </select>

            {/* Urgency Filter */}
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold focus:outline-none focus:border-teal-500"
            >
              <option value="">جميع درجات الاستعجال</option>
              <option value="high">🔴 عاجل جداً (High)</option>
              <option value="medium">🟡 متوسط (Medium)</option>
              <option value="low">🟢 عادي (Low)</option>
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <button
              onClick={() => setStatusFilter('waiting')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'waiting' ? 'bg-teal-600 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              قيد الانتظار ({stats.total_waiting || 0})
            </button>
            <button
              onClick={() => setStatusFilter('contacted')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'contacted' ? 'bg-teal-600 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              تم التواصل ({stats.contacted || 0})
            </button>
            <button
              onClick={() => setStatusFilter('converted')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'converted' ? 'bg-teal-600 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              تم التسكين ({stats.converted_total || 0})
            </button>
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === '' ? 'bg-teal-600 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              الكل
            </button>
          </div>
        </div>

        {/* Waitlist Entries List */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
              جارٍ تحميل قائمة الانتظار...
            </div>
          ) : waitingList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <ListOrdered className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-bold">لا توجد حالات مسجلة تطابق الفلتر المحدد.</p>
            </div>
          ) : (
            waitingList.map((entry) => {
              const urgencyStyles = {
                high: 'bg-red-500/20 text-red-300 border-red-500/40',
                medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
              };

              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 transition flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                        <span>{entry.patient_name}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${urgencyStyles[entry.urgency_level] || urgencyStyles.medium}`}>
                          {entry.urgency_level === 'high' ? '🔴 عاجل' : entry.urgency_level === 'low' ? '🟢 عادي' : '🟡 متوسط'}
                        </span>
                      </h4>
                      <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-teal-400" />
                          <span>{entry.phone}</span>
                        </span>
                        <span>{entry.created_at_human}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="حذف من القائمة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      💬 {entry.notes}
                    </p>
                  )}

                  {entry.preferred_days && entry.preferred_days.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="text-slate-500">الأيام المفضلة:</span>
                      {entry.preferred_days.map((d) => (
                        <span key={d} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions Toolbar */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-teal-400">
                      {entry.specialty_needed === 'orthophonie' ? 'أرطوفونيا' : entry.specialty_needed === 'psychologie' ? 'علم نفس' : 'طب نفسي / عصبي'}
                    </span>

                    <div className="flex items-center gap-2">
                      {entry.status === 'waiting' && (
                        <button
                          onClick={() => handleStatusChange(entry.id, 'contacted')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>تم التواصل</span>
                        </button>
                      )}

                      {entry.status !== 'converted' && (
                        <button
                          onClick={() => setConvertingEntry(entry)}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-slate-950 font-black text-xs shadow-md shadow-teal-500/20 flex items-center gap-1 transition"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>📅 تسكين في موعد شاغر</span>
                        </button>
                      )}

                      {entry.status === 'converted' && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم التسكين بنجاح</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal 1: Add New Entry */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-teal-400" />
                  <span>إضافة حالة جديدة لقائمة الانتظار</span>
                </h4>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">&times;</button>
              </div>

              <form onSubmit={handleAddEntry} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم المريض:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوسف مهدي"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الهاتف (الولي):</label>
                  <input
                    type="text"
                    required
                    placeholder="0550123456"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">التخصص المطلوب:</label>
                    <select
                      value={specialtyNeeded}
                      onChange={(e) => setSpecialtyNeeded(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 font-bold"
                    >
                      <option value="orthophonie">أرطوفونيا</option>
                      <option value="psychologie">علم نفس</option>
                      <option value="neuro_psychiatrie">طب نفسي / عصبي</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">درجة الاستعجال:</label>
                    <select
                      value={urgencyLevel}
                      onChange={(e) => setUrgencyLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 font-bold"
                    >
                      <option value="high">🔴 عاجل جداً</option>
                      <option value="medium">🟡 متوسط</option>
                      <option value="low">🟢 عادي</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الأيام المفضلة:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'].map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          preferredDays.includes(d) ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">ملاحظات وسبب الطلب:</label>
                  <textarea
                    rows={2}
                    placeholder="ملاحظات سريرية أو أوقات مناسبة..."
                    value={intakeNotes}
                    onChange={(e) => setIntakeNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingIntake}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black"
                  >
                    {savingIntake ? 'جارٍ الحفظ...' : 'حفظ الحالة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Convert to Scheduled Appointment */}
        {convertingEntry && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-400" />
                  <span>تسكين موعد في الأجندة للمريض: {convertingEntry.patient_name}</span>
                </h4>
                <button onClick={() => setConvertingEntry(null)} className="text-slate-400 hover:text-white">&times;</button>
              </div>

              <form onSubmit={handleConvert} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ الموعد:</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">وقت البدء:</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">وقت النهاية:</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">نوع الموعد:</label>
                  <select
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 font-bold"
                  >
                    <option value="therapy_session">جلسة علاج ومتابعة (Séance de Rééducation)</option>
                    <option value="assessment">تقييم سريري أولي (Bilan Initial)</option>
                    <option value="initial_consultation">استشارة وتشخيص (Consultation)</option>
                    <option value="follow_up">متابعة دورية (Suivi)</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConvertingEntry(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={converting}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-black"
                  >
                    {converting ? 'جارٍ الحجز...' : 'تأكيد التسكين في الأجندة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
