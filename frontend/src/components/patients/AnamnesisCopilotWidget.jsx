import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  Sparkles,
  Plus,
  Check,
  HelpCircle,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  RefreshCw
} from 'lucide-react';
import { voiceSoapApi } from '../../api';

export default function AnamnesisCopilotWidget({
  patient = null,
  initialComplaint = '',
  onInsertQuestion = null,
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [insertedIds, setInsertedIds] = useState(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await voiceSoapApi.suggestAnamnesisQuestions({
        intake_data: { complaint: initialComplaint },
        specialty: 'orthophonie',
        age_in_months: patient?.birth_date ? Math.round((Date.now() - new Date(patient.birth_date)) / (1000 * 3600 * 24 * 30.4)) : 48,
        language: 'ar',
      });

      if (res.success && res.questions) {
        setQuestions(res.questions);
      }
    } catch (err) {
      console.error('Failed to fetch anamnesis suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [initialComplaint]);

  const handleInsert = (q) => {
    if (onInsertQuestion) {
      const textToInsert = `\n• [${q.category}]: ${q.question_ar}\n  - الإجابة: `;
      onInsertQuestion(textToInsert);
      setInsertedIds((prev) => new Set([...prev, q.id]));
    }
  };

  const categories = ['all', 'النمو الحركي العام', 'التطور اللغوي والتواصلي', 'البيئة والتعرض للشاشات', 'الملف الحسي والسلوكي', 'التفاعل الاجتماعي واللعب', 'السوابق الطبية والولادة'];

  const filteredQuestions = selectedCategory === 'all'
    ? questions
    : questions.filter((q) => q.category === selectedCategory);

  return (
    <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 font-sans text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
            💡
          </div>
          <div>
            <h4 className="text-xs font-black text-white flex items-center space-x-1.5 space-x-reverse">
              <span>المساعد الذكي للمقابلة العيادية (Anamnesis Copilot)</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Live Suggestions
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">
              أسئلة سريرية موجهة لاستكشاف التاريخ النمائي حسب عمر المريض
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 space-x-reverse">
          <button
            type="button"
            onClick={fetchQuestions}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="تحديث الاقتراحات"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-1">
          {/* Category Filter Chips */}
          <div className="flex items-center space-x-1 space-x-reverse overflow-x-auto pb-1 text-[10px]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat === 'all' ? 'جميع الأسئلة' : cat}
              </button>
            ))}
          </div>

          {/* Questions Grid */}
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
            {filteredQuestions.map((q) => {
              const isInserted = insertedIds.has(q.id);

              return (
                <div
                  key={q.id}
                  onClick={() => handleInsert(q)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isInserted
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75'
                      : 'bg-slate-950 border-slate-800 hover:border-amber-500/50 hover:bg-slate-950/90'
                  }`}
                  title="انقر لإدراج السؤال في محرر الملاحظات"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">
                        {q.category}
                      </span>
                      <p className="text-xs font-bold text-white leading-snug truncate">
                        {q.question_ar}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      🎯 {q.clinical_relevance}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isInserted ? (
                      <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center space-x-1 text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                        <span>تم الإدراج</span>
                      </span>
                    ) : (
                      <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 flex items-center space-x-0.5 text-[10px] font-bold">
                        <MessageSquarePlus className="w-3 h-3" />
                        <span>إدراج</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
