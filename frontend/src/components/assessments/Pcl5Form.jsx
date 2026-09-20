import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Pcl5Form({ patients = [], isOpen, onClose, onSave, saving }) {
  const [patientId, setPatientId] = useState('');
  const [answers, setAnswers] = useState({});

  const pclQuestions = [
    { id: 'q1', cluster: 'B', text_ar: "ذكريات متكررة ومزعجة وغير مرغوب فيها عن التجربة الصادمة؟", text_fr: "Souvenirs répétés et pénibles de l'événement ?" },
    { id: 'q2', cluster: 'B', text_ar: "أحلام وكوابيس متكررة ومزعجة عن التجربة الصادمة؟", text_fr: "Rêves répétés et pénibles concernant l'événement ?" },
    { id: 'q3', cluster: 'B', text_ar: "الشعور أو التصرف المفاجئ وكأن التجربة الصادمة تحدث مرة أخرى (استرجاع الفلاش باك)؟", text_fr: "Flashbacks (impression que l'événement se reproduit) ?" },
    { id: 'q4', cluster: 'B', text_ar: "الشعور بضيق نفسي شديد عند تذكر ما حدث أو مواجهة ما يذكر به؟", text_fr: "Détresse intense lors de rappels de l'événement ?" },
    { id: 'q5', cluster: 'B', text_ar: "ردود فعل جسدية قوية (تسارع نبض القلب، صعوبة تنفس، تعرق) عند التذكر؟", text_fr: "Réactions physiques intenses (cœur qui bat, sueurs) ?" },
    
    { id: 'q6', cluster: 'C', text_ar: "تجنب الأفكار أو المشاعر أو المحادثات المتعلقة بالتجربة الصادمة؟", text_fr: "Évitement des pensées ou sentiments liés au trauma ?" },
    { id: 'q7', cluster: 'C', text_ar: "تجنب الأشخاص أو الأماكن أو الأنشطة أو الأشياء التي تذكر بالتجربة؟", text_fr: "Évitement des lieux, personnes ou situations associées ?" },
    
    { id: 'q8', cluster: 'D', text_ar: "صعوبة في تذكر أجزاء هامة من التجربة الصادمة؟", text_fr: "Incapacité de se rappeler des aspects importants du trauma ?" },
    { id: 'q9', cluster: 'D', text_ar: "معتقدات سلبية قوية ومستمرة عن نفسك أو الآخرين أو العالم (أنا سيء، لا يمكن الوثوق بأحد)؟", text_fr: "Croyances négatives fortes sur soi-même ou le monde ?" },
    { id: 'q10', cluster: 'D', text_ar: "إلقاء اللوم على نفسك أو على الآخرين بشكل غير واقعي حيال ما حدث؟", text_fr: "Blâme exagéré de soi-même ou d'autrui pour l'événement ?" },
    { id: 'q11', cluster: 'D', text_ar: "مشاعر سلبية شديدة ومستمرة مثل الخوف، الرعب، الغضب، الشعور بالذنب أو العار؟", text_fr: "Sentiments négatifs persistants (peur, colère, honte) ?" },
    { id: 'q12', cluster: 'D', text_ar: "فقدان الاهتمام الملحوظ بالأنشطة التي كنت تستمتع بها في السابق؟", text_fr: "Perte d'intérêt pour les activités importantes ?" },
    { id: 'q13', cluster: 'D', text_ar: "الشعور بالعزلة أو الانفصال عن الآخرين؟", text_fr: "Sentiment de détachement ou d'éloignement des autres ?" },
    { id: 'q14', cluster: 'D', text_ar: "صعوبة في الشعور بالمشاعر الإيجابية (عدم القدرة على الشعور بالحب أو السعادة)؟", text_fr: "Incapacité d'éprouver des émotions positives ?" },
    
    { id: 'q15', cluster: 'E', text_ar: "سلوك سريع الغضب أو نوبات من الغضب الشديد والعدوانية مع قليل من الاستفزاز؟", text_fr: "Comportement irritable ou explosions de colère ?" },
    { id: 'q16', cluster: 'E', text_ar: "المجازفة أو التصرف بتهور وسلوكيات مدمرة للذات؟", text_fr: "Comportement imprudent ou autodestructeur ?" },
    { id: 'q17', cluster: 'E', text_ar: "حالة من الحذر واليقظة المفرطة وكأن خطراً داهماً يحيط بك طوال الوقت؟", text_fr: "Hypervigilance constante ?" },
    { id: 'q18', cluster: 'E', text_ar: "الفزع وسرعة الجفل من الأصوات أو الحركات المفاجئة؟", text_fr: "Réaction de sursaut exagérée ?" },
    { id: 'q19', cluster: 'E', text_ar: "صعوبة كبيرة في التركيز على المهام اليومية؟", text_fr: "Difficultés de concentration ?" },
    { id: 'q20', cluster: 'E', text_ar: "صعوبة في النوم (صعوبة الاستغراق في النوم أو الاستيقاظ المتكرر)؟", text_fr: "Troubles du sommeil (difficulté d'endormissement) ?" },
  ];

  const scaleOptions = [
    { val: 0, label: "0 - أبداً / Pas du tout" },
    { val: 1, label: "1 - قليلاً / Un peu" },
    { val: 2, label: "2 - باعتدال / Modérément" },
    { val: 3, label: "3 - كثيراً / Beaucoup" },
    { val: 4, label: "4 - بشدة بالغة / Extrêmement" },
  ];

  const calculateClusters = () => {
    let total = 0, b = 0, c = 0, d = 0, e = 0;
    pclQuestions.forEach((q, idx) => {
      const v = parseInt(answers[q.id] || 0, 10);
      total += v;
      if (q.cluster === 'B') b += v;
      else if (q.cluster === 'C') c += v;
      else if (q.cluster === 'D') d += v;
      else if (q.cluster === 'E') e += v;
    });
    const isProbable = (total >= 33);
    return { total, b, c, d, e, isProbable };
  };

  if (!isOpen) return null;

  const { total, b, c, d, e, isProbable } = calculateClusters();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                مقياس اضطراب ما بعد الصدمة (PCL-5)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                PTSD Checklist for DSM-5 (20 أعراض عبر 4 أبعاد إكلينيكية - العتبة التشخيصية: 33)
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-bold text-rose-300">
              Score : <span className="text-lg font-black text-white">{total}</span> / 80
            </div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${
              isProbable ? 'bg-rose-500/20 text-rose-300 border-rose-500' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
            }`}>
              {isProbable ? "⚠️ TSPT / PTSD Probable (>=33)" : "Infra-seuil (<33)"}
            </span>
          </div>
        </div>

        {/* Patient Select */}
        <div className="shrink-0 space-y-1">
          <label className="text-xs font-bold text-slate-300">Sélectionner le Patient :</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-rose-500"
          >
            <option value="">-- Choisir un patient --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} ({p.phone || 'Sans tél'})
              </option>
            ))}
          </select>
        </div>

        {/* Clusters Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs shrink-0">
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400">B. الاقتحام (Intrusions)</div>
            <div className="text-sm font-bold text-rose-300 font-mono">{b} / 20</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400">C. التجنب (Évitement)</div>
            <div className="text-sm font-bold text-amber-300 font-mono">{c} / 8</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400">D. المزاج والأفكار</div>
            <div className="text-sm font-bold text-purple-300 font-mono">{d} / 28</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400">E. الاستثارة الحركية</div>
            <div className="text-sm font-bold text-cyan-300 font-mono">{e} / 24</div>
          </div>
        </div>

        {/* Questions List */}
        <div className="overflow-y-auto flex-1 space-y-3.5 pr-1">
          {pclQuestions.map((q, idx) => {
            const currentVal = parseInt(answers[q.id] || 0, 10);
            return (
              <div key={q.id} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="font-bold text-xs text-slate-200">
                  <span className="text-rose-400 font-mono mr-1">#{idx + 1}</span> {q.text_ar}
                  <div className="text-slate-400 text-[11px] font-normal mt-0.5">{q.text_fr}</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center text-xs">
                  {scaleOptions.map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: opt.val })}
                      className={`p-2 rounded-xl text-[11px] font-semibold border transition-all ${
                        currentVal === opt.val
                          ? 'bg-rose-500/25 border-rose-500/80 text-rose-200 font-bold ring-1 ring-rose-500/40 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold"
          >
            Annuler
          </button>

          <button
            type="button"
            disabled={!patientId || saving}
            onClick={() => onSave(patientId, answers)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Valider & Enregistrer le PCL-5'}
          </button>
        </div>
      </div>
    </div>
  );
}
