import React, { useState, useEffect } from 'react';
import { 
  X, Radar, AlertTriangle, MessageCircle, Phone, Calendar, Clock, 
  CheckCircle2, Search, Filter, RefreshCw, Send, Sparkles, ExternalLink,
  ShieldAlert, UserX, ArrowUpRight
} from 'lucide-react';
import { patientRetentionRadarApi } from '../../api';

export default function PatientRetentionRadarModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'critical' | 'high' | 'medium'
  
  // Recall Action Modal / Panel State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('gentle_checkin');
  const [customText, setCustomText] = useState('');
  const [sendingRecall, setSendingRecall] = useState(false);
  const [recallSuccessMsg, setRecallSuccessMsg] = useState(null);

  const fetchRadarData = () => {
    setLoading(true);
    patientRetentionRadarApi.getOverview()
      .then(res => {
        if (res && res.success) {
          setData(res);
        }
      })
      .catch(err => console.error('Failed to load retention radar:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchRadarData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const kpis = data?.kpis || {
    retention_rate_pct: 0,
    total_monitored_patients: 0,
    total_at_risk: 0,
    critical_risk_count: 0,
    high_risk_count: 0,
    medium_risk_count: 0,
    recalled_this_month: 0,
  };

  const templates = data?.templates || [
    { key: 'gentle_checkin', title: 'اطمئنان ودي واستفسار عن الحالة' },
    { key: 'progress_review', title: 'جلسة تقييم التقدم الدوري' },
    { key: 'treatment_milestone', title: 'حماية الخطة العلاجية من الانتكاسة' },
  ];

  // Filter patients
  const filteredPatients = (data?.at_risk_patients || []).filter(p => {
    const matchesSearch = !searchQuery || 
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery);
    const matchesRisk = riskFilter === 'all' || p.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const handleOpenRecall = (patient) => {
    setSelectedPatient(patient);
    setSelectedTemplate('gentle_checkin');
    setCustomText('');
    setRecallSuccessMsg(null);
  };

  const handleSendRecall = async () => {
    if (!selectedPatient || sendingRecall) return;

    setSendingRecall(true);
    try {
      const res = await patientRetentionRadarApi.sendRecallWhatsApp({
        patient_id: selectedPatient.patient_id,
        template_key: selectedTemplate,
        custom_message: selectedTemplate === 'custom' ? customText : undefined,
      });

      if (res && res.success) {
        setRecallSuccessMsg('تم إنشاء رسالة التذكير وتسجيل الاستعادة بنجاح!');
        
        // Open WhatsApp in new tab
        if (res.whatsapp_url) {
          window.open(res.whatsapp_url, '_blank');
        }

        // Refresh data in background
        fetchRadarData();

        setTimeout(() => {
          setSelectedPatient(null);
          setRecallSuccessMsg(null);
        }, 1800);
      }
    } catch (err) {
      console.error('Failed to send recall:', err);
    } finally {
      setSendingRecall(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-500 p-0.5 shadow-lg shadow-rose-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Radar className="w-6 h-6 text-rose-400 animate-spin-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">
                  رادار متابعة المرضى واستعادة المتسربين
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold">
                  Clinical Recall Radar
                </span>
              </div>
              <p className="text-xs text-slate-400">
                كشف تلقائي للمرضى المنقطعين عن الجلسات دون موعد قادم وإرسال رسائل استعادة ذكية عبر WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRadarData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. KPIs Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Retention Rate */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400">معدل الاحتفاظ بالمرضى</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-emerald-400">
                  {kpis.retention_rate_pct}%
                </span>
                <span className="text-[10px] text-slate-500">من إجمالي المتابعين</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, kpis.retention_rate_pct)}%` }}
                />
              </div>
            </div>

            {/* Total Monitored */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-bold text-slate-400">المرضى تحت الرادار</span>
              <div className="text-3xl font-black font-mono text-white mt-2">
                {kpis.total_monitored_patients}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">لديهم سجل جلسات بالعيادة</div>
            </div>

            {/* At Risk Count */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                إجمالي المعرضين للانقطاع
              </span>
              <div className="text-3xl font-black font-mono text-amber-300 mt-2">
                {kpis.total_at_risk}
              </div>
              <div className="text-[11px] text-amber-500/80 mt-1">دون موعد قادم مجدول</div>
            </div>

            {/* Critical Risk */}
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                خطر حرج (&gt; 45 يوم)
              </span>
              <div className="text-3xl font-black font-mono text-rose-300 mt-2">
                {kpis.critical_risk_count}
              </div>
              <div className="text-[11px] text-rose-400/70 mt-1">انقطاع تام عن العلاج</div>
            </div>

            {/* Recalled This Month */}
            <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20">
              <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                تذكيرات أُرسلت هذا الشهر
              </span>
              <div className="text-3xl font-black font-mono text-teal-300 mt-2">
                {kpis.recalled_this_month}
              </div>
              <div className="text-[11px] text-teal-400/70 mt-1">عبر رابط WhatsApp الذكي</div>
            </div>

          </div>

          {/* 2. Controls & Search Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Filter Chips */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950/60 border border-slate-800 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setRiskFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  riskFilter === 'all' 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل ({data?.at_risk_patients?.length || 0})
              </button>
              <button
                onClick={() => setRiskFilter('critical')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  riskFilter === 'critical' 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                خطر حرج &gt; 45 يوم ({kpis.critical_risk_count})
              </button>
              <button
                onClick={() => setRiskFilter('high')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  riskFilter === 'high' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                انقطاع 30-45 يوم ({kpis.high_risk_count})
              </button>
              <button
                onClick={() => setRiskFilter('medium')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  riskFilter === 'medium' 
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                تأخر 14-29 يوم ({kpis.medium_risk_count})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم المريض أو الهاتف..."
                className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Patients Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">المريض / الولي</th>
                  <th className="py-3.5 px-4">الهاتف</th>
                  <th className="py-3.5 px-4">آخر زيارة</th>
                  <th className="py-3.5 px-4">مدة الانقطاع</th>
                  <th className="py-3.5 px-4">حالة الاستعادة</th>
                  <th className="py-3.5 px-4 text-center">إجراء الاستعادة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPatients.map((p) => (
                  <tr key={p.patient_id} className="hover:bg-slate-800/30 transition-colors">
                    
                    {/* Patient Name & Age */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{p.full_name}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.guardian_name ? `الولي: ${p.guardian_name}` : ''}
                        {p.age ? ` • ${p.age} سنة` : ''}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {p.phone || '—'}
                    </td>

                    {/* Last Visit */}
                    <td className="py-3 px-4 text-slate-300">
                      <div>{p.last_attended_formatted}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{p.last_attended_date}</div>
                    </td>

                    {/* Days Absent Badge */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black font-mono ${
                        p.risk_level === 'critical'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : p.risk_level === 'high'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        <Clock className="w-3 h-3" />
                        منقطع منذ {p.days_absent} يوم
                      </span>
                    </td>

                    {/* Recall History Status */}
                    <td className="py-3 px-4">
                      {p.recall_count > 0 ? (
                        <div className="text-teal-400 text-xs flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>أُرسل تذكير ({p.recall_count})</span>
                          <span className="text-[10px] text-slate-500">في {p.last_recall_date}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">لم يتم التذكير بعد</span>
                      )}
                    </td>

                    {/* Recall Action Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenRecall(p)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        استعادة عبر WhatsApp
                      </button>
                    </td>

                  </tr>
                ))}

                {filteredPatients.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/40 mb-2" />
                      <p className="font-bold text-slate-300">رائع! لا يوجد مرضى منقطعون وفق المعايير المحددة</p>
                      <p className="text-xs text-slate-500 mt-1">جميع المرضى المتابعين لديهم مواعيد قادمة أو مواظبون على الجلسات</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* 4. Sub-Modal: Recall WhatsApp Generator */}
      {selectedPatient && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    إرسال تذكير استعادة لـ {selectedPatient.full_name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedPatient.phone} • منقطع منذ {selectedPatient.days_absent} يوم
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">اختر نموذج الرسالة السريرية:</label>
              <div className="grid grid-cols-1 gap-2">
                {templates.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelectedTemplate(t.key)}
                    className={`text-right p-3 rounded-xl border text-xs font-semibold transition-all ${
                      selectedTemplate === t.key
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold">{t.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              {recallSuccessMsg && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {recallSuccessMsg}
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSendRecall}
                disabled={sendingRecall}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sendingRecall ? 'جارٍ التجهيز...' : 'فتح وإرسال عبر WhatsApp 📲'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
