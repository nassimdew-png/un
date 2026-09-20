import React, { useState, useMemo } from 'react';
import {
  Brain,
  Calculator,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Save,
  Printer,
  X,
  User,
  Clock,
  Sparkles,
  Copy,
  Check,
  FileText,
  HelpCircle,
  Award
} from 'lucide-react';
import { assessmentApi } from '../../../api';

export const ZAREKI_SUBTESTS = [
  { id: 1, name: '1. العد التنازلي الشفهي', name_fr: 'Compte à rebours', maxScore: 6, cutoff: 4, desc: 'العد التنازلي السريع من 20 إلى 1 بدون أخطاء أو توقف طويل.' },
  { id: 2, name: '2. إملاء وكتابة الأعداد', name_fr: 'Dictée de nombres', maxScore: 8, cutoff: 6, desc: 'كتابة الأرقام بالأرقام العربية عند سماعها وتجاوز الصفر العالق (مثل 105، 2040).' },
  { id: 3, name: '3. القراءة الجهرية للأعداد', name_fr: 'Lecture de nombres', maxScore: 8, cutoff: 6, desc: 'قراءة الأعداد المكتوبة مع مراعاة المنازل (آحاد، عشرات، مئات، آلاف).' },
  { id: 4, name: '4. الحساب الذهني الشفهي (جمع/طرح)', name_fr: 'Calcul mental oral', maxScore: 12, cutoff: 8, desc: 'إجراء عمليات الجمع والطرح البسيطة والمركبة ذهنياً في زمن محدد.' },
  { id: 5, name: '5. الحساب المكتوب العمودي', name_fr: 'Calcul écrit posé', maxScore: 8, cutoff: 5, desc: 'وضع الأرقام عمودياً والاحتفاظ وحفظ المنازل في العمليات المكتوبة.' },
  { id: 6, name: '6. مقارنة الأعداد وتحديد الأكبر', name_fr: 'Comparaison de nombres', maxScore: 8, cutoff: 6, desc: 'إدراك القيمة النسبية للأعداد وتحديد الأكبر والترتيب التصاعدي.' },
  { id: 7, name: '7. التقدير الكمي والحدس العددي', name_fr: 'Estimation quantitative', maxScore: 6, cutoff: 4, desc: 'تقدير الكميات بدون عد مباشر وربط الرمز الرياضي بالكم الفعلي.' },
  { id: 8, name: '8. موضع الأعداد على الخط العددي', name_fr: 'Ligne numérique', maxScore: 10, cutoff: 6, desc: 'تمثيل الأعداد مكانياً على خط مدرج من 0 إلى 100 ومن 0 إلى 1000.' },
  { id: 9, name: '9. حل المسائل الحسابية الكلامية', name_fr: 'Problèmes arithmétiques', maxScore: 8, cutoff: 5, desc: 'فهم نص المسألة، اختيار العملية الرياضية المناسبة، وتنفيذ الحل.' },
  { id: 10, name: '10. استرجاع حقائق الضرب المخزنة', name_fr: 'Faits arithmétiques / Tables', maxScore: 6, cutoff: 4, desc: 'الاسترجاع الآلي المباشر لجدول الضرب والعمليات الأساسية المحفوظة.' },
  { id: 11, name: '11. العلاقات والتوازن الرياضي', name_fr: 'Relations et équilibres', maxScore: 6, cutoff: 4, desc: 'إدراك العلاقات التبادلية والتساوي المنطقي الرياضي.' },
];

export default function ZarekiScorerModal({
  isOpen,
  onClose,
  patient,
  patients = [],
  initialPatientId = null,
  onSaved
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || patient?.id || patients[0]?.id || ''
  );
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('subtests'); // 'subtests' | 'report'
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);

  // Subtests score state
  const [scores, setScores] = useState(() => {
    const init = {};
    ZAREKI_SUBTESTS.forEach(s => { init[s.id] = s.maxScore; });
    return init;
  });

  const handleScoreChange = (id, val, max) => {
    const num = Math.min(max, Math.max(0, parseInt(val, 10) || 0));
    setScores(prev => ({ ...prev, [id]: num }));
  };

  // Metrics calculation
  const computedMetrics = useMemo(() => {
    let totalScore = 0;
    let maxPossible = 0;
    const deficits = [];

    ZAREKI_SUBTESTS.forEach(sub => {
      const s = scores[sub.id] ?? 0;
      totalScore += s;
      maxPossible += sub.maxScore;

      if (s < sub.cutoff) {
        deficits.push({
          ...sub,
          score: s,
          gap: sub.cutoff - s,
        });
      }
    });

    const percent = Math.round((totalScore / (maxPossible || 1)) * 100);

    let riskLevel = {
      label: 'أداء عددي وحسابي طبيعي (Normal Numerical Cognition)',
      color: 'emerald',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      advice: 'لا توجد مؤشرات فارزة دالة على عسر الحساب (Dyscalculie).',
    };

    if (deficits.length >= 4 || percent < 60) {
      riskLevel = {
        label: 'مؤشرات دالة بقوة على عسر الحساب (High Dyscalculia Risk / Dyscalculie avérée)',
        color: 'red',
        badge: 'bg-red-500/20 text-red-300 border-red-500/30',
        advice: 'عجز متعدد في معالجة الأعداد والحساب الذهني والمكاني يستدعي كفالة أرطوفونية ونفسية-حركية مكثفة وتكييفات مدرسية (PEI).',
      };
    } else if (deficits.length >= 2 || percent < 75) {
      riskLevel = {
        label: 'صعوبات حسابية نوعية خفيفة إلى متوسطة (Specific Arithmetic Difficulties)',
        color: 'amber',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        advice: 'ضعف نوعي محصور في بعض المهارات يستدعي تدريباً موجهاً على الخط العددي والحساب الذهني.',
      };
    }

    return {
      totalScore,
      maxPossible,
      percent,
      deficits,
      riskLevel,
    };
  }, [scores]);

  // Automated Report Text
  const generatedReport = useMemo(() => {
    let txt = `🧮 تقرير بطارية عسر الحساب والمهارات العددية (ZAREKI-R)\n`;
    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `• تاريخ الفحص: ${assessmentDate}\n`;
    txt += `• مجموع درجات البطارية: ${computedMetrics.totalScore} / ${computedMetrics.maxPossible} نقطة (${computedMetrics.percent}%)\n`;
    txt += `• التقييم الإكلينيكي: ${computedMetrics.riskLevel.label}\n`;
    txt += `• التوجيه السريري: ${computedMetrics.riskLevel.advice}\n\n`;

    txt += `🔍 المحاور التي تقع دون عتبة القطع السريرية (نقاط القصور):\n`;
    if (computedMetrics.deficits.length > 0) {
      computedMetrics.deficits.forEach(d => {
        txt += `  ⚠️ ${d.name}: ${d.score}/${d.maxScore} (عتبة الخطر: < ${d.cutoff})\n`;
      });
    } else {
      txt += `  ✓ كافة المحاور الـ 11 ضمن الحدود الطبيعية المقننة.\n`;
    }

    if (clinicalNotes.trim()) {
      txt += `\n📝 ملاحظات الأخصائي الإضافية والخطة العلاجية:\n${clinicalNotes}\n`;
    }

    return txt;
  }, [assessmentDate, computedMetrics, clinicalNotes]);

  // Save to Backend API
  const handleSaveAssessment = async () => {
    if (!selectedPatientId) {
      alert('يرجى اختيار ملف المريض أولاً.');
      return;
    }

    setSaving(true);
    try {
      const assessmentData = {
        patient_id: selectedPatientId,
        type: 'orthophony_bilan',
        title: `[ZAREKI-R] بطارية فحص عسر الحساب والمهارات العددية`,
        assessment_date: assessmentDate,
        results_data: {
          test_code: 'ZAREKI-R',
          test_title: 'بطارية عسر الحساب (ZAREKI-R)',
          total_score: computedMetrics.totalScore,
          max_score: computedMetrics.maxPossible,
          percent: computedMetrics.percent,
          deficits_count: computedMetrics.deficits.length,
          risk_level: computedMetrics.riskLevel.label,
          subtest_scores: scores,
          notes: clinicalNotes,
          raw_score: computedMetrics.totalScore,
        },
        diagnostic_conclusion: `ZAREKI-R Score: ${computedMetrics.totalScore}/${computedMetrics.maxPossible} (${computedMetrics.riskLevel.label})`,
        recommendations: generatedReport,
      };

      await assessmentApi.create(assessmentData);
      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save ZAREKI assessment:', err);
      alert('حدث خطأ أثناء حفظ التقييم: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setSaving(false);
    }
  };

  const copyReportToClipboard = () => {
    navigator.clipboard.writeText(generatedReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto font-sans" dir="rtl">
      <div className="bg-slate-900 border border-teal-500/40 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-teal-950/80 to-slate-900 border-b border-teal-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-inner">
              <Calculator className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  ZAREKI-R DYSCALCULIA SCORER
                </span>
                <span className="text-xs font-mono text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                  11 Subtests
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                مصحح بطارية عسر الحساب والمهارات العددية (ZAREKI-R)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name || `${p.first_name} ${p.last_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
            <button
              onClick={() => setActiveTab('subtests')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'subtests' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>المحاور الـ 11 ({computedMetrics.totalScore}/{computedMetrics.maxPossible})</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'report' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>التقرير والتحليل السريري</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {activeTab === 'subtests' && (
            <div className="space-y-6">
              
              {/* Grand Status Card */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400">مجموع درجات ZAREKI-R الإجمالي:</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-2xl font-black text-white font-mono">{computedMetrics.totalScore}</h3>
                    <span className="text-xs text-slate-400">/ {computedMetrics.maxPossible} نقطة ({computedMetrics.percent}%)</span>
                  </div>
                  <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold border ${computedMetrics.riskLevel.badge}`}>
                    {computedMetrics.riskLevel.label}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 max-w-sm">
                  {computedMetrics.riskLevel.advice}
                </div>
              </div>

              {/* Subtests Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {ZAREKI_SUBTESTS.map((sub) => {
                  const val = scores[sub.id] ?? sub.maxScore;
                  const isDeficit = val < sub.cutoff;

                  return (
                    <div
                      key={sub.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isDeficit
                          ? 'bg-red-950/20 border-red-500/40 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white">{sub.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          isDeficit ? 'bg-red-500/20 text-red-300 font-bold' : 'bg-slate-700 text-slate-300'
                        }`}>
                          القطع: &lt; {sub.cutoff}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-slate-400">{sub.desc}</span>
                        <div className="flex items-center gap-1.5 shrink-0 mr-2">
                          <input
                            type="number"
                            min="0"
                            max={sub.maxScore}
                            value={val}
                            onChange={(e) => handleScoreChange(sub.id, e.target.value, sub.maxScore)}
                            className="w-14 bg-slate-900 border border-slate-600 rounded-xl py-1 text-center font-bold text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
                          />
                          <span className="text-xs text-slate-400 font-mono">/ {sub.maxScore}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>التقرير والتحليل السريري لبطارية ZAREKI-R</span>
                </h3>
                <button
                  onClick={copyReportToClipboard}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReport ? 'تم النسخ!' : 'نسخ التقرير'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {generatedReport}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">ملاحظات الأرطوفوني الإضافية وتوجيهات الحصيلة:</label>
                <textarea
                  rows="3"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="سجل أي تكييفات مطلوبة للمدرسة، وسائل بصرية مساعدة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {saveSuccess && (
              <span className="text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                تم توثيق نتيجة بطارية ZAREKI-R في ملف المريض بنجاح!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveAssessment}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-teal-600/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جارٍ الحفظ...' : 'حفظ في ملف المريض والحصيلة ⚡'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
