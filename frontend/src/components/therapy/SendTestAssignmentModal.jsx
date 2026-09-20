import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  Tablet,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  Clock,
  User,
  AlertCircle,
  Sparkles,
  Calendar,
  Lock,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Eye
} from 'lucide-react';
import { clinicalTestAssignmentApi, patientApi } from '../../api';
import SearchablePatientSelect, { DEFAULT_DEMO_PATIENT, DEFAULT_DEMO_PATIENT_2 } from '../common/SearchablePatientSelect';

export default function SendTestAssignmentModal({
  test,
  patients = [],
  initialPatientId = null,
  appointmentId = null,
  tenant = null,
  onClose
}) {
  const [fetchedPatients, setFetchedPatients] = useState([]);

  useEffect(() => {
    if (!patients || patients.length === 0) {
      patientApi.list({ per_page: 100 })
        .then(res => {
          const list = res.patients?.data || res.patients || res.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setFetchedPatients(list);
          }
        })
        .catch(err => console.warn('Could not load patients in SendTestAssignmentModal:', err));
    }
  }, []);

  const effectivePatients = useMemo(() => {
    if (patients && patients.length > 0) return patients;
    if (fetchedPatients.length > 0) return fetchedPatients;
    return [DEFAULT_DEMO_PATIENT, DEFAULT_DEMO_PATIENT_2];
  }, [patients, fetchedPatients]);

  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || (effectivePatients.length > 0 ? effectivePatients[0].id : DEFAULT_DEMO_PATIENT.id)
  );

  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
    } else if (!selectedPatientId && effectivePatients.length > 0) {
      setSelectedPatientId(effectivePatients[0].id);
    }
  }, [initialPatientId, effectivePatients, selectedPatientId]);

  const [mode, setMode] = useState('remote'); // 'remote' | 'tablet'
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [usePin, setUsePin] = useState(false);
  const [pinCode, setPinCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [copied, setCopied] = useState(false);

  // WhatsApp Cloud API sending state
  const [sendingWa, setSendingWa] = useState(false);
  const [waSentSuccess, setWaSentSuccess] = useState(false);
  const [waError, setWaError] = useState(null);
  const [recipientPhone, setRecipientPhone] = useState('');

  // History for this patient
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'

  const selectedPatient = useMemo(() => {
    return effectivePatients.find(p => String(p.id) === String(selectedPatientId)) || effectivePatients[0] || null;
  }, [effectivePatients, selectedPatientId]);

  useEffect(() => {
    if (selectedPatient) {
      setRecipientPhone(selectedPatient.phone || selectedPatient.emergency_contact || '');
    }
  }, [selectedPatient?.id, selectedPatient?.phone, selectedPatient?.emergency_contact]);

  // Load history when patient changes
  useEffect(() => {
    if (selectedPatientId) {
      loadPatientHistory(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadPatientHistory = async (patientId) => {
    if (!patientId || String(patientId).includes('demo')) {
      setHistory([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await clinicalTestAssignmentApi.getPatientAssignments(patientId);
      setHistory(res.data || []);
    } catch (err) {
      console.warn('Could not load test assignments history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Generate Assignment Link
  const handleGenerateAssignment = async () => {
    if (!selectedPatientId) {
      setError('يرجى تحديد مريض أولاً');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        test_code: test?.code || test?.test_code || 'TEST',
        test_title: test?.title_ar || test?.name || test?.title || 'رائز سريري',
        appointment_id: appointmentId,
        mode,
        expires_in_hours: expiresInHours,
        pin_code: usePin ? pinCode : null
      };

      const res = await clinicalTestAssignmentApi.create(selectedPatientId, payload);
      setActiveAssignment(res.assignment);
      // Reload history in background
      loadPatientHistory(selectedPatientId);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الرابط');
    } finally {
      setLoading(false);
    }
  };

  const getEffectivePortalUrl = () => {
    if (!activeAssignment) return '';
    const token = activeAssignment.access_token;
    if (typeof window !== 'undefined' && window.location?.origin && token) {
      return `${window.location.origin}/portal/test/${token}`;
    }
    return activeAssignment.portal_url || '';
  };

  const getEffectiveWhatsAppLink = () => {
    const portalUrl = getEffectivePortalUrl();
    const patientName = selectedPatient ? (selectedPatient.first_name || selectedPatient.name) : 'المريض';
    const testName = testTitle;
    const rawDigits = (recipientPhone || selectedPatient?.phone || '').replace(/[^0-9]/g, '');
    const phone = rawDigits.startsWith('0') ? '213' + rawDigits.substring(1) : rawDigits;
    const pinPart = activeAssignment?.pin_code ? `\n🔐 رمز الأمان (PIN): *${activeAssignment.pin_code}*` : '';
    const text = `مرحباً ${patientName}،\nيرجى التكرم بملء هذا التقييم السريري المطلوب:\n\n📋 *${testName}*\n\nالرابط المباشر الآمن:\n${portalUrl}${pinPart}\n\n(هذا الرابط صالح لمدة ${expiresInHours} ساعة).`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const handleCopyLink = () => {
    const url = getEffectivePortalUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendCloudWhatsApp = async (assignmentId = null) => {
    const targetId = assignmentId || activeAssignment?.id;
    if (!targetId) return;
    setSendingWa(true);
    setWaError(null);
    setWaSentSuccess(false);
    try {
      const res = await clinicalTestAssignmentApi.sendWhatsApp(targetId, {
        phone: recipientPhone || selectedPatient?.phone,
      });
      if (res?.success) {
        setWaSentSuccess(true);
        setTimeout(() => setWaSentSuccess(false), 7000);
      } else {
        setWaError(res?.message || 'تعذر الإرسال التلقائي عبر واتساب.');
      }
    } catch (err) {
      setWaError(err.message || 'فشل الاتصال بخادم واتساب السحابي.');
    } finally {
      setSendingWa(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الرابط؟ لن يتمكن المريض من الدخول إليه بعد الآن.')) return;
    try {
      await clinicalTestAssignmentApi.revoke(id);
      loadPatientHistory(selectedPatientId);
      if (activeAssignment?.id === id) {
        setActiveAssignment(null);
      }
    } catch (err) {
      alert('تعذر إلغاء الرابط: ' + err.message);
    }
  };

  const testTitle = test?.title_ar || test?.title || test?.name || 'الرائز السريري';
  const testCode = test?.code || test?.test_code || 'TEST';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-6 shadow-2xl relative text-right my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">إرسال الرائز للمريض / وضع التابلت</h3>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {testCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{testTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'new'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>إنشاء رابط / كود جديد</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>الروابط السابقة للمريض ({history.length})</span>
          </button>
        </div>

        {/* TAB 1: NEW ASSIGNMENT GENERATOR */}
        {activeTab === 'new' && (
          <div className="space-y-5">
            {/* Clinical Information Banners */}
            {test?.code?.includes('PHQ') && (
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-300">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>المعيار الذهبي العالمي لمسح الاكتئاب (PHQ-9) 🌐</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  يقيس شدة الأعراض الاكتئابية خلال الأسبوعين الماضيين، مزود بنظام الرصد السريري التلقائي للأمان (Red Alert للبند 9) الذي يُظهر تنبيهاً أحمر فورياً للأخصائي في السجل الطبي وملاحظات الجلسة إذا رُصدت أي أفكار لإيذاء النفس.
                </p>
              </div>
            )}

            {test?.code?.includes('GAD') && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>المعيار الذهبي العالمي لفرز القلق العام (GAD-7) 🌐</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  يقيس أعراض القلق العام خلال الأسبوعين الماضيين (7 بنود) مع تفسيرات سريرية موحدة وتحديد تلقائي لعتبة التحقق السريري وطلب التدخل (10-14).
                </p>
              </div>
            )}

            {(test?.code?.includes('HAM') || test?.clinicianOnly) && (
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-300">
                  <AlertCircle className="w-4 h-4 text-purple-400" />
                  <span>تنبيه عيادي: مقياس تقييم الأخصائي (Clinician-rated)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  مقياس هاملتون للقلق مقنن ليملؤه الأخصائي بنفسه بناءً على الملاحظة العيادية والمقابلة السريرية وليس المريض. يُنصح بتمريره عبر "وضع التابلت" أو "التمرير المباشر".
                </p>
              </div>
            )}

            {/* Searchable Patient Selector */}
            <SearchablePatientSelect
              patients={effectivePatients}
              selectedPatientId={selectedPatientId}
              onSelectPatient={(pId) => {
                setSelectedPatientId(pId);
                setActiveAssignment(null);
              }}
              label="المريض المستهدف:"
              placeholder="ابحث بالاسم، اللقب، رقم الهاتف، أو رقم الملف..."
              accentColor="indigo"
              maxHeight="max-h-44"
              required
              allowDemoFallback={true}
            />

            {/* If assignment already generated, show QR Code and links */}
            {activeAssignment ? (
              <div className="p-5 rounded-3xl bg-slate-950 border border-indigo-500/40 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-black text-white">تم إنشاء رابط الاختبار بنجاح!</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    ينتهي: {new Date(activeAssignment.expires_at).toLocaleString('ar-DZ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                  {/* QR Code Section */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-700 shadow-xl space-y-2 text-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        getEffectivePortalUrl()
                      )}`}
                      alt="رمز QR للاختبار"
                      className="w-44 h-44 object-contain rounded-lg"
                      loading="lazy"
                    />
                    <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                      <span>امسح بكاميرا الهاتف للبدء فوراً</span>
                    </div>
                  </div>

                  {/* Options & Action buttons */}
                  <div className="space-y-3">
                    {activeAssignment.pin_code && (
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                          <Lock className="w-4 h-4 text-amber-400" />
                          <span>رمز PIN للتحقق:</span>
                        </div>
                        <span className="text-lg font-mono font-black text-amber-300 tracking-widest bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-500/40">
                          {activeAssignment.pin_code}
                        </span>
                      </div>
                    )}

                    {/* Recipient Phone Selector Box */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-right">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-bold flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>رقم هاتف المستلم (WhatsApp):</span>
                        </span>
                        <span className="text-slate-500 text-[10px]">تعديل أو إرسال لرقم آخر</span>
                      </div>

                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="0555..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
                      />

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {selectedPatient?.phone && (
                          <button
                            type="button"
                            onClick={() => setRecipientPhone(selectedPatient.phone)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                              recipientPhone === selectedPatient.phone
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            📱 الأساسي: {selectedPatient.phone}
                          </button>
                        )}
                        {selectedPatient?.emergency_contact && selectedPatient.emergency_contact !== selectedPatient.phone && (
                          <button
                            type="button"
                            onClick={() => setRecipientPhone(selectedPatient.emergency_contact)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                              recipientPhone === selectedPatient.emergency_contact
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            🚨 الطوارئ / الولي: {selectedPatient.emergency_contact}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* WhatsApp Cloud API Direct Dispatch Button */}
                    <button
                      type="button"
                      onClick={() => handleSendCloudWhatsApp()}
                      disabled={sendingWa || !recipientPhone}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                    >
                      {sendingWa ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 text-emerald-200" />
                      )}
                      <span>{sendingWa ? 'جاري الإرسال عبر واتساب...' : 'إرسال فوري إلى واتساب المستلم (Cloud API) ⚡'}</span>
                    </button>

                    {/* WhatsApp Status Alerts */}
                    {waSentSuccess && (
                      <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>تم إرسال رابط المقياس إلى واتساب المريض بنجاح! 📲✨</span>
                      </div>
                    )}

                    {waError && (
                      <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{waError}</span>
                        </div>
                        <a
                          href={getEffectiveWhatsAppLink()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline text-[11px] shrink-0"
                        >
                          استخدام الرابط اليدوي ↗
                        </a>
                      </div>
                    )}

                    {/* WhatsApp Manual Fallback Link */}
                    <a
                      href={getEffectiveWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>فتح المحادثة في تطبيق واتساب (يدوي) ↗</span>
                    </a>

                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'تم نسخ الرابط إلى الحافظة!' : 'نسخ الرابط المباشر 🔗'}</span>
                    </button>

                    {/* Tablet Kiosk Mode Button */}
                    <a
                      href={getEffectivePortalUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition flex items-center justify-center gap-2"
                    >
                      <Tablet className="w-4 h-4 text-purple-400" />
                      <span>فتح وضع التابلت للمريض (Tablet Kiosk) 📟</span>
                    </a>
                  </div>
                </div>

                {/* Reset button to generate another */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveAssignment(null)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إنشاء رابط جديد أو تغيير الخيارات</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Generation Form */
              <div className="space-y-4">
                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('remote')}
                    className={`p-3.5 rounded-2xl border text-right transition flex items-start gap-3 ${
                      mode === 'remote'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-black">إرسال عن بُعد للمريض</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">عبر واتساب، SMS، أو مسح QR</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('tablet')}
                    className={`p-3.5 rounded-2xl border text-right transition flex items-start gap-3 ${
                      mode === 'tablet'
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Tablet className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-black">وضع التابلت بالعيادة</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">جهاز لوحي مخصص للمراجع</div>
                    </div>
                  </button>
                </div>

                {/* Expiry Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>صلاحية الرابط:</span>
                    </label>
                    <select
                      value={expiresInHours}
                      onChange={(e) => setExpiresInHours(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value={24}>24 ساعة (يوم واحد)</option>
                      <option value={48}>48 ساعة (يومان)</option>
                      <option value={72}>72 ساعة (3 أيام - موصى به)</option>
                      <option value={168}>7 أيام (أسبوع)</option>
                    </select>
                  </div>

                  {/* PIN Protection Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-indigo-400" />
                        <span>حماية برمز PIN للخصوصية:</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={usePin}
                        onChange={(e) => setUsePin(e.target.checked)}
                        className="accent-indigo-600 rounded cursor-pointer w-4 h-4"
                      />
                    </label>
                    {usePin ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500/60 rounded-2xl p-2.5 text-center font-mono font-bold text-amber-300 text-xs tracking-widest focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setPinCode(Math.floor(1000 + Math.random() * 9000).toString())}
                          className="px-3 py-2.5 rounded-2xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                        >
                          عشوائي
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                        دخول مباشر عبر الرابط الآمن دون طلب رمز.
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Integration Notice */}
                {appointmentId && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      سيتم ربط نتيجة الاختبار تلقائياً بالجلسة الحالية وإدراج النتيجة في ملخص SOAP Note.
                    </span>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerateAssignment}
                  disabled={loading || !selectedPatientId}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4 text-amber-300" />
                  )}
                  <span>{loading ? 'جاري توليد الرابط والباركود...' : 'توليد رابط وراموز QR السريري 🚀'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PREVIOUS ASSIGNMENTS HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {loadingHistory ? (
              <div className="py-12 text-center text-xs text-slate-400">جاري تحميل سجل الروائز...</div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-600" />
                <p>لا توجد روابط روائز سابقة مرسلة لهذا المريض.</p>
              </div>
            ) : (
              history.map((item) => {
                const isCompleted = item.status === 'completed';
                const isExpired = item.status === 'expired' || (item.expires_at && new Date(item.expires_at) < new Date());
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-white font-bold">{item.test_title}</strong>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-indigo-300">
                          {item.test_code}
                        </span>
                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            مكتمل ({item.raw_score} نقطة - {item.severity_label})
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            منتهي الصلاحية
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            قيد الانتظار (معلّق)
                          </span>
                        )}

                        {Boolean(item.has_critical_alert || item.answers_payload?.['9'] > 0) && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white border border-rose-400 flex items-center gap-1 animate-pulse shadow-md shadow-rose-600/30">
                            <span>🚨 تنبيه أمان: رصد أفكار انتحارية / إيذاء للنفس (البند 9)</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3">
                        <span>أُنشئ: {new Date(item.created_at).toLocaleDateString('ar-DZ')}</span>
                        {item.pin_code && <span>رمز PIN: {item.pin_code}</span>}
                        {item.completed_at && <span>اكتمل: {new Date(item.completed_at).toLocaleDateString('ar-DZ')}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isCompleted && !isExpired && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSendCloudWhatsApp(item.id)}
                            disabled={sendingWa}
                            className="p-2 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 transition disabled:opacity-50"
                            title="إرسال رابط المقياس لواتساب المريض فوراً"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <a
                            href={item.portal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition"
                            title="فتح الرابط"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => handleRevoke(item.id)}
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                        title="حذف أو إلغاء الرابط"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}
