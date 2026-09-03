import React, { useState } from 'react';
import { patientApi } from '../../api';
import {
  Baby,
  CheckCircle2,
  X,
  AlertTriangle,
  Clock,
  Send,
  Phone,
  Copy,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Activity,
  Tv,
  GraduationCap,
  MessageSquare
} from 'lucide-react';

export default function PreIntakeReviewModal({
  isOpen,
  onClose,
  patient,
  onApproved,
  tenant,
}) {
  const [loading, setLoading] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preIntakeLink, setPreIntakeLink] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !patient) return null;

  const preIntakeData = patient.pre_intake_data || {};
  const status = patient.pre_intake_status || 'not_sent';
  const submittedAt = patient.pre_intake_submitted_at;

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    setError('');
    try {
      const res = await patientApi.generatePreIntakeLink(patient.id);
      if (res.success) {
        setPreIntakeLink(res.link);
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الرابط.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = () => {
    if (!preIntakeLink) return;
    navigator.clipboard.writeText(preIntakeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const sendViaWhatsApp = () => {
    if (!patient.phone) {
      alert('لا يوجد رقم هاتف مسجل لهذا المريض.');
      return;
    }
    let phoneNum = patient.phone.replace(/[^0-9]/g, '');
    if (phoneNum.startsWith('0')) phoneNum = '213' + phoneNum.substring(1);

    const link = preIntakeLink || `${window.location.origin}/pre-intake/${patient.pre_intake_token || ''}`;
    const text = encodeURIComponent(
      `السلام عليكم ولي أمر الطفل ${patient.first_name}، نرحب بكم في ${tenant?.name || 'العيادة'}.\nيرجى التفضل بملء استمارة السوابق النمائية المسبقة عبر هذا الرابط الآمن قبل الموعد:\n${link}`
    );
    window.open(`https://wa.me/${phoneNum}?text=${text}`, '_blank');
  };

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await patientApi.approvePreIntake(patient.id);
      if (res.success) {
        if (onApproved) onApproved(res.patient);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'تعذر اعتماد الاستمارة.');
    } finally {
      setLoading(false);
    }
  };

  const perinatal = preIntakeData.perinatal || {};
  const milestones = preIntakeData.milestones || {};
  const family = preIntakeData.family_context || {};
  const school = preIntakeData.school_context || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h3 className="text-sm font-black text-white">
                  استمارة الاستقبال المسبق الذاتي للولي (Parent Pre-Intake)
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    status === 'submitted'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                      : status === 'reviewed'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {status === 'submitted' ? '📩 واردة تنتظر المراجعة' : status === 'reviewed' ? '✓ تم الاعتماد' : 'لم تُرسل بعد'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                المريض: <strong className="text-teal-300">{patient.first_name} {patient.last_name}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Quick Link Generator Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300">
                رابط الاستمارة المخصص للولي (عبر الهاتف / واتساب):
              </span>
              <button
                type="button"
                disabled={generatingLink}
                onClick={handleGenerateLink}
                className="text-xs font-bold text-teal-400 hover:text-teal-300 underline self-start sm:self-auto"
              >
                {generatingLink ? 'جاري التوليد...' : '⚡ توليد / تحديث الرابط'}
              </button>
            </div>

            {(preIntakeLink || patient.pre_intake_token) && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={preIntakeLink || `${window.location.origin}/pre-intake/${patient.pre_intake_token}`}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-teal-300 font-mono"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-1 space-x-reverse"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
                <button
                  type="button"
                  onClick={sendViaWhatsApp}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 space-x-reverse"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>واتساب</span>
                </button>
              </div>
            )}
          </div>

          {/* Display Submitted Data or Empty State */}
          {status === 'submitted' || status === 'reviewed' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white flex items-center space-x-2 space-x-reverse">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>البيانات الواردة من الولي:</span>
                </h4>
                {submittedAt && (
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1 space-x-reverse">
                    <Clock className="w-3.5 h-3.5" />
                    <span>تاريخ الإرسال: {new Date(submittedAt).toLocaleString('ar-DZ')}</span>
                  </span>
                )}
              </div>

              {/* Data Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Perinatal */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5 space-x-reverse">
                    <Baby className="w-4 h-4" />
                    <span>السوابق الولادية:</span>
                  </span>
                  <div className="text-xs space-y-1 text-slate-300">
                    <div><span className="text-slate-500">مدة الحمل:</span> {perinatal.pregnancy_term === 'full_term' ? 'حمل كامل طبيعي' : 'ولادة مبكرة'}</div>
                    <div><span className="text-slate-500">طريقة الولادة:</span> {perinatal.delivery_type === 'c_section' ? 'قيصرية' : 'طبيعية'}</div>
                    <div><span className="text-slate-500">بكاء الطفل:</span> {perinatal.birth_cry === 'immediate' ? 'فوري وقوي' : 'متأخر'}</div>
                    <div><span className="text-slate-500">نقص أكسجين:</span> {perinatal.neonatal_anoxia ? 'نعم ⚠️' : 'لا'}</div>
                    <div><span className="text-slate-500">حضانة اصطناعية:</span> {perinatal.incubator_stay ? 'نعم' : 'لا'}</div>
                  </div>
                </div>

                {/* 2. Milestones */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5 space-x-reverse">
                    <Activity className="w-4 h-4" />
                    <span>المعالم الحركية واللغة:</span>
                  </span>
                  <div className="text-xs space-y-1 text-slate-300">
                    <div><span className="text-slate-500">سن المشي:</span> {milestones.walking_age_months || '--'} شهر</div>
                    <div><span className="text-slate-500">أول كلمة:</span> {milestones.first_words_age_months || '--'} شهر</div>
                    <div><span className="text-slate-500">أول جملة:</span> {milestones.first_sentences_age_months || '--'} شهر</div>
                  </div>
                </div>

                {/* 3. Family & Screens */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-rose-300 flex items-center space-x-1.5 space-x-reverse">
                    <Tv className="w-4 h-4" />
                    <span>البيت والشاشات:</span>
                  </span>
                  <div className="text-xs space-y-1 text-slate-300">
                    <div><span className="text-slate-500">لغات البيت:</span> {family.home_languages?.join(', ') || 'الدارجة'}</div>
                    <div><span className="text-slate-500">ساعات الشاشات:</span> {family.daily_screen_hours || '--'} ساعات/يوم</div>
                  </div>
                </div>

                {/* 4. School */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5 space-x-reverse">
                    <GraduationCap className="w-4 h-4" />
                    <span>التمدرس:</span>
                  </span>
                  <div className="text-xs space-y-1 text-slate-300">
                    <div><span className="text-slate-500">المؤسسة / القسم:</span> {school.school_name || '--'} ({school.school_grade || '--'})</div>
                  </div>
                </div>
              </div>

              {/* Reason & Notes from parent */}
              {preIntakeData.consultation_reason && (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200">
                  <strong className="block text-indigo-400 font-bold mb-1">سبب الاستشارة وفق تصريح الولي:</strong>
                  {preIntakeData.consultation_reason}
                </div>
              )}

              {preIntakeData.parent_notes && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <strong className="block text-slate-500 font-bold mb-1">ملاحظات إضافية من الولي:</strong>
                  {preIntakeData.parent_notes}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3">
              <Clock className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-xs font-bold text-white">لم يقم الولي بملء الاستمارة بعد</h4>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                يمكنك نسخ الرابط أعلاه وإرساله للولي عبر واتساب ليقوم بتعبئتها على مهل من هاتفه قبل موعد الجلسة.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5 space-x-reverse">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>يتم دمج البيانات المعتمدة مباشرة في السجل السريري.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              إغلاق
            </button>

            {status === 'submitted' && (
              <button
                type="button"
                disabled={loading}
                onClick={handleApprove}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-teal-600/30 flex items-center space-x-1.5 space-x-reverse transition-all active:scale-95"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>اعتماد ودمج البيانات في الملف السريري ✅</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
