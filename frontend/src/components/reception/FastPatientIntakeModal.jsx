import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Phone,
  Calendar,
  User,
  MapPin,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  Stethoscope,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import AlgerianGeoSelector from '../common/AlgerianGeoSelector';
import { patientApi, appointmentApi } from '../../api';
import {
  normalizeWhatsAppPhone,
  formatWhatsAppDisplayPhone,
  buildWhatsAppLinks
} from '../../utils/phoneHelper';

export default function FastPatientIntakeModal({
  isOpen,
  onClose,
  onSuccess,
  tenant,
  specialists = [],
}) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'male',
    guardian_name: '',
    guardian_relation: 'father',
    phone: '',
    emergency_contact: '',
    wilaya_code: '16',
    commune_name: '',
    chifa_number: '',
    consultation_reason: '',
    urgency_level: 'routine',
    specialist_id: '',
    kiosk_pin: Math.floor(100000 + Math.random() * 900000).toString(),
    add_to_waiting_room_today: true,
    send_whatsapp_preintake: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Detect Algerian Phone Operator
  const detectPhoneOperator = (phone) => {
    const clean = (phone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('05') || clean.startsWith('2135')) return { name: 'Ooredoo', color: 'bg-red-500/20 text-red-300 border-red-500/30' };
    if (clean.startsWith('06') || clean.startsWith('2136')) return { name: 'Mobilis', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    if (clean.startsWith('07') || clean.startsWith('2137')) return { name: 'Djezzy', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    return null;
  };

  const operator = detectPhoneOperator(formData.phone);

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const age = calculateAge(formData.birth_date);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('يرجى كتابة الاسم واللقب بشكل كامل.');
      return;
    }
    if (!formData.birth_date) {
      setError('يرجى تحديد تاريخ ميلاد المريض.');
      return;
    }

    const birthDate = new Date(formData.birth_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (birthDate > today) {
      setError('تاريخ الميلاد غير صالح: لا يمكن تسجيل تاريخ ميلاد في المستقبل.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create Patient
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        birth_date: formData.birth_date,
        gender: formData.gender,
        guardian_name: formData.guardian_name || null,
        parent_name: formData.guardian_name || null,
        parent_relation: formData.guardian_relation || null,
        phone: formData.phone || null,
        phone_operator: operator ? operator.name.toLowerCase() : null,
        emergency_contact: formData.emergency_contact || null,
        wilaya_code: formData.wilaya_code || '16',
        commune_name: formData.commune_name || null,
        chifa_number: formData.chifa_number || null,
        kiosk_pin: formData.kiosk_pin,
        consultation_reason: formData.consultation_reason || null,
      };

      const res = await patientApi.create(payload);
      const newPatient = res.patient || res.data || res;
      const patientId = newPatient.id;

      let createdAppointment = null;
      let magicLink = null;

      // 2. Optionally Add directly to today's waiting room
      if (formData.add_to_waiting_room_today && patientId) {
        try {
          const now = new Date();
          const todayIso = now.toISOString();
          const apptRes = await appointmentApi.create({
            patient_id: patientId,
            specialist_id: formData.specialist_id || null,
            appointment_date: todayIso,
            type: 'initial_consultation',
            status: 'confirmed', // Directly in waiting room
            notes: `استقبال فوري عبر مكتب السكرتارية • السبب: ${formData.consultation_reason || 'فحص عام'}`,
          });
          createdAppointment = apptRes.appointment || apptRes.data || apptRes;
        } catch (apptErr) {
          console.error('Error creating today appointment:', apptErr);
        }
      }

      // 3. Generate Pre-Intake link if requested
      if (patientId) {
        try {
          const linkRes = await patientApi.generatePreIntakeLink(patientId);
          magicLink = linkRes.magic_link || linkRes.link;
        } catch (linkErr) {
          console.error('Error generating pre-intake link:', linkErr);
        }
      }

      setSuccessData({
        patient: newPatient,
        appointment: createdAppointment,
        magicLink,
      });

      if (onSuccess) {
        onSuccess(newPatient);
      }
    } catch (err) {
      console.error('Fast intake error:', err);
      setError(err.message || 'حدث خطأ أثناء تسجيل المريض.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare WhatsApp text and links
  const cleanPhone = normalizeWhatsAppPhone(formData.phone);
  const formattedPhone = formatWhatsAppDisplayPhone(formData.phone);
  const clinicName = tenant?.header_title_ar || tenant?.name || 'العيادة التخصصية';
  const patientName = `${formData.first_name} ${formData.last_name}`.trim() || 'المراجع الكريم';

  let isChild = Boolean(formData.guardian_name);
  if (formData.birth_date) {
    const birth = new Date(formData.birth_date);
    if (!isNaN(birth.getTime())) {
      const age = Math.floor((new Date() - birth) / (365.25 * 24 * 60 * 60 * 1000));
      isChild = age < 18;
    }
  }

  const regLine = isChild
    ? `تم تسجيل ملف الطفل(ة) (*${patientName}*) بنجاح.`
    : `تم تسجيل ملف الأستاذ(ة) (*${patientName}*) بنجاح.`;
  const formType = isChild
    ? 'الاستبيان الأولي للسوابق النمائية والتطورية'
    : 'استبيان البيانات السريرية الأولية';

  const magicUrl =
    successData?.magicLink ||
    (successData?.patient?.id
      ? `${window.location.origin}/pre-intake`
      : window.location.origin);

  const preparedWhatsAppText = `مرحباً بكم في *${clinicName}* 🏥\n\n${regLine}\n\n📱 *رمز المرور السريع لشاشة الاستقبال (PIN):* *${formData.kiosk_pin}*\n\nلضمان أعلى دقة في الفحص وتوفير الوقت، يرجى ملء ${formType} عبر الرابط التالي:\n🔗 ${magicUrl}\n\nنتمنى لكم دوام الصحة والعافية.`;

  const { waMeUrl, apiWaUrl } = buildWhatsAppLinks(cleanPhone, preparedWhatsAppText);

  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(preparedWhatsAppText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = preparedWhatsAppText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(magicUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = magicUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.warn('Copy link failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold shadow-lg shadow-teal-500/10">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>التسجيل والاستقبال الإداري السريع</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono font-bold">
                  FAST INTAKE ⚡
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تسجيل فوري لبيانات المريض الأساسية وتوليد PIN ورابط الاستبيان في أقل من دقيقة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successData ? (
            /* Success View */
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-white">
                  تم تسجيل المريض بنجاح! 🎉
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  تم فتح الملف الإداري للمريض {formData.first_name} {formData.last_name} وتوليد رمز المرور السريع.
                </p>
              </div>

              {/* PIN Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 max-w-sm mx-auto space-y-1">
                <div className="text-[11px] text-slate-400 font-bold flex items-center justify-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>رمز المرور لشاشة الاستقبال (Kiosk PIN):</span>
                </div>
                <div className="text-3xl font-black font-mono tracking-widest text-brand-400">
                  {formData.kiosk_pin}
                </div>
                {formData.add_to_waiting_room_today && (
                  <div className="text-[11px] text-emerald-400 font-bold pt-1">
                    🟢 تم إدراج المريض مباشرة في قاعة الانتظار لليوم
                  </div>
                )}
              </div>

              {/* WhatsApp Message Box Preview (Crucial for automated testing & reception verification) */}
              <div
                className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/20 text-right space-y-3"
                data-testid="whatsapp-preintake-preview"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    <span>رسالة WhatsApp المعدة (PIN + رابط الاستبيان):</span>
                    {cleanPhone && (
                      <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                        ({formattedPhone})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      data-testid="copy-preintake-link-btn"
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      data-testid="copy-preintake-message-btn"
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      {copiedMsg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedMsg ? 'تم نسخ النص' : 'نسخ نص الرسالة'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={preparedWhatsAppText}
                  rows={4}
                  data-testid="whatsapp-preintake-message"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs leading-relaxed focus:outline-none font-sans resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {formData.phone && (
                  <a
                    href={waMeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="open-whatsapp-link"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>إرسال عبر WhatsApp (wa.me)</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
                >
                  إغلاق ومتابعة الاستقبال
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Row 1: Name & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الاسم الشخصي <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="مثال: يوسف"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اللقب العائلي <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="مثال: بن علي"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الجنس
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                  >
                    <option value="male">ذكر (Boy / Man)</option>
                    <option value="female">أنثى (Girl / Woman)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Birth Date & Age Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>تاريخ الميلاد <span className="text-red-400">*</span></span>
                    {age !== null && (
                      <span className="text-[11px] font-mono text-teal-400 font-bold">
                        العمر: {age} سنة
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    min="1900-01-01"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    رقم بطاقة الشفاء / التعريف الوطني (اختياري)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.chifa_number}
                      onChange={(e) => setFormData({ ...formData, chifa_number: e.target.value })}
                      placeholder="رقم الضمان الاجتماعي أو التعريف"
                      className="w-full px-3.5 py-2 pl-9 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                    />
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 3: Phone & Guardian */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>رقم الهاتف <span className="text-red-400">*</span></span>
                    {operator && (
                      <span className={`text-[10px] px-2 py-0.2 rounded-md font-bold border ${operator.color}`}>
                        {operator.name}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="05 / 06 / 07 ..."
                      className="w-full px-3.5 py-2 pl-8 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                    />
                    <Phone className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم الولي / المرافق
                  </label>
                  <input
                    type="text"
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    placeholder="مثال: أحمد بن علي"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    صلة القرابة
                  </label>
                  <select
                    value={formData.guardian_relation}
                    onChange={(e) => setFormData({ ...formData, guardian_relation: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                  >
                    <option value="father">الأب (Père)</option>
                    <option value="mother">الأم (Mère)</option>
                    <option value="legal_guardian">الولي الشرعي (Tuteur)</option>
                    <option value="self">المريض نفسه (Patient Adulte)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Algerian Geo Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>عنوان الإقامة (الولاية والبلدية):</span>
                </div>
                <AlgerianGeoSelector
                  wilayaCode={formData.wilaya_code}
                  communeName={formData.commune_name}
                  onChange={({ wilayaCode, communeName }) => {
                    setFormData({ ...formData, wilaya_code: wilayaCode, commune_name: communeName });
                  }}
                />
              </div>

              {/* Row 5: Reason for Visit & Specialist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    سبب الزيارة / الشكوى المبدئية
                  </label>
                  <input
                    type="text"
                    value={formData.consultation_reason}
                    onChange={(e) => setFormData({ ...formData, consultation_reason: e.target.value })}
                    placeholder="مثال: تأخر لغوي، تشتت انتباه، قلق وامتحانات..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الأخصائي المعالج المطلوب
                  </label>
                  <select
                    value={formData.specialist_id}
                    onChange={(e) => setFormData({ ...formData, specialist_id: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                  >
                    <option value="">أي أخصائي متاح (Premier disponible)</option>
                    {specialists.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.specialty || 'أخصائي'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Checkboxes for Receptionist Efficiency */}
              <div className="p-3 rounded-2xl bg-teal-950/20 border border-teal-500/20 space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-teal-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.add_to_waiting_room_today}
                    onChange={(e) => setFormData({ ...formData, add_to_waiting_room_today: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <span className="font-bold">
                    🟢 إدراج المريض فوراً في قاعة الانتظار لليوم (Check-In Live)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-teal-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.send_whatsapp_preintake}
                    onChange={(e) => setFormData({ ...formData, send_whatsapp_preintake: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <span>
                    📱 تجهيز رابط استبيان الولي الذكي (Magic Link) للمشاركة عبر WhatsApp
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>جاري الحفظ والتسجيل...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>حفظ واستقبال المريض ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
