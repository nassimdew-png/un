import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, CheckCircle2, Calendar, Brain, Award } from 'lucide-react';
import { assessmentApi } from '../api';

export default function AssessmentProgressionView({ patientId }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    assessmentApi.getByPatient(patientId)
      .then((res) => {
        if (res.data || res.assessments) {
          setAssessments(res.data || res.assessments || []);
        }
      })
      .catch((e) => console.warn('Progression fetch error:', e))
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-white flex items-center space-x-2 space-x-reverse">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            <span>منحنى التطور السريري ونتائج الاختبارات المقننة (Progression Curve)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            رسم بياني زمني لتطور درجات المقاييس التشخيصية وتتبع الأثر العلاجي
          </p>
        </div>
        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
          {assessments.length} تقييمات مكتملة
        </span>
      </div>

      {assessments.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
          <Activity className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-xs">لا توجد تقييمات كافية لرسم منحنى التطور حالياً.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {assessments.map((a, idx) => (
              <div key={a.id || idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{a.test_name || a.title || 'فحص سريري'}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300">
                    {a.score ?? a.raw_score ?? 85}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, a.score ?? a.raw_score ?? 85)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>{a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : ''}</span>
                  <span className="text-slate-500">الجلسة #{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
