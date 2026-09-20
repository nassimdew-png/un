import React, { useState } from 'react';
import { Baby, X, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function MchatForm({ patients = [], isOpen, onClose, onSave, saving }) {
  const [patientId, setPatientId] = useState('');
  const [answers, setAnswers] = useState({});

  const questions = [
    { id: 'q1', text_ar: "إذا أشرت إلى شيء ما عبر الغرفة، هل ينظر طفلك إليه؟", text_fr: "Si vous pointez quelque chose dans la pièce, votre enfant le regarde-t-il ?" },
    { id: 'q2', text_ar: "هل تساءلت يوماً عما إذا كان طفلك أصم (لا يسمع)؟ (سؤال عكسي)", text_fr: "Vous êtes-vous déjà demandé si votre enfant était sourd ?" },
    { id: 'q3', text_ar: "هل يلعب طفلك ألعاب التخيل والتظاهر (مثل شرب الشاي من كوب فارغ)؟", text_fr: "Votre enfant joue-t-il à faire semblant ?" },
    { id: 'q4', text_ar: "هل يحب طفلك التسلق على الأشياء (مثل السلالم أو الأثاث)؟", text_fr: "Votre enfant aime-t-il grimper sur les choses ?" },
    { id: 'q5', text_ar: "هل يقوم طفلك بحركات غير عادية بأصابعه بالقرب من عينيه؟ (سؤال عكسي)", text_fr: "Votre enfant fait-il des mouvements inhabituels avec ses doigts près de ses yeux ?" },
    { id: 'q6', text_ar: "هل يشير طفلك بإصبعه ليطلب شيئاً أو لطلب المساعدة؟", text_fr: "Votre enfant pointe-t-il du doigt pour demander quelque chose ou de l'aide ?" },
    { id: 'q7', text_ar: "هل يشير طفلك بإصبعه ليلفت انتباهك إلى شيء مثير للاهتمام؟", text_fr: "Votre enfant pointe-t-il pour vous montrer quelque chose d'intéressant ?" },
    { id: 'q8', text_ar: "هل يهتم طفلك بالأطفال الآخرين ويحاول التفاعل معهم؟", text_fr: "Votre enfant s'intéresse-t-il aux autres enfants ?" },
    { id: 'q9', text_ar: "هل يعرض طفلك عليك أشياء أو يحضرها لك لمجرد مشاركتها معك؟", text_fr: "Votre enfant vous montre-t-il des objets juste pour partager avec vous ?" },
    { id: 'q10', text_ar: "هل يستجيب طفلك عند مناداته باسمه (ينظر إليك أو يلتفت)؟", text_fr: "Votre enfant répond-il quand vous l'appelez par son prénom ?" },
    { id: 'q11', text_ar: "عندما تبتسم لطفلك، هل يبتسم لك في المقابل؟", text_fr: "Quand vous souriez à votre enfant, vous sourit-il en retour ?" },
    { id: 'q12', text_ar: "هل ينزعج طفلك بشدة من الأصوات اليومية المعتادة (مثل المكنسة)؟ (سؤال عكسي)", text_fr: "Votre enfant est-il très dérangé par les bruits du quotidien ?" },
    { id: 'q13', text_ar: "هل يمشي طفلك بمفرده؟", text_fr: "Votre enfant marche-t-il ?" },
    { id: 'q14', text_ar: "هل ينظر طفلك في عينيك عندما تتحدث معه أو تلعب معه؟", text_fr: "Votre enfant vous regarde-t-il dans les yeux quand vous lui parlez ?" },
    { id: 'q15', text_ar: "هل يحاول طفلك تقليد ما تفعله (مثل التلويح باي باي أو التصفيق)؟", text_fr: "Votre enfant essaie-t-il d'imiter ce que vous faites ?" },
    { id: 'q16', text_ar: "إذا أدرت رأسك لتنظر إلى شيء ما، هل ينظر طفلك ليرى ما تنظر إليه؟", text_fr: "Si vous tournez la tête pour regarder quelque chose, regarde-t-il aussi ?" },
    { id: 'q17', text_ar: "هل يحاول طفلك لفت انتباهك لتشاهده وهو يفعل شيئاً؟", text_fr: "Votre enfant essaie-t-il de vous amener à le regarder ?" },
    { id: 'q18', text_ar: "هل يفهم طفلك عندما تطلب منه القيام بأمر بسيط بدون إشارة؟", text_fr: "Votre enfant comprend-il des consignes simples sans gestes ?" },
    { id: 'q19', text_ar: "عندما يحدث شيء جديد، هل ينظر طفلك إلى وجهك ليرى ردة فعلك؟", text_fr: "Quand quelque chose de nouveau arrive, regarde-t-il votre visage ?" },
    { id: 'q20', text_ar: "هل يحب طفلك الأنشطة الحركية (مثل الهز أو التأرجح على ركبتيك)؟", text_fr: "Votre enfant aime-t-il les jeux de mouvement ?" },
  ];

  const reverseItems = [2, 5, 12];

  const calculateRiskScore = () => {
    let riskPoints = 0;
    questions.forEach((q, idx) => {
      const itemNum = idx + 1;
      const ans = answers[q.id];
      if (reverseItems.includes(itemNum)) {
        if (ans === 'yes') riskPoints++;
      } else {
        if (ans === 'no') riskPoints++;
      }
    });
    return riskPoints;
  };

  const getRiskBadge = (points) => {
    if (points <= 2) return { text: "خطر منخفض (0-2) / Faible Risque", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
    if (points <= 7) return { text: "خطر متوسط (3-7) / Risque Modéré", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
    return { text: "خطر مرتفع (8-20) / Risque Élevé", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
  };

  if (!isOpen) return null;

  const currentRisk = calculateRiskScore();
  const badge = getRiskBadge(currentRisk);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-pink-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                استبيان الكشف المبكر عن التوحد (M-CHAT-R)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Modified Checklist for Autism in Toddlers, Revised (16-30 mois)
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-bold text-pink-300">
              Score de risque : <span className="text-lg font-black text-white">{currentRisk}</span> / 20
            </div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${badge.color}`}>
              {badge.text}
            </span>
          </div>
        </div>

        {/* Patient Select */}
        <div className="shrink-0 space-y-1">
          <label className="text-xs font-bold text-slate-300">Sélectionner le Patient :</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:ring-2 focus:ring-pink-500"
          >
            <option value="">-- Choisir un patient --</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} ({p.phone || 'Sans tél'})
              </option>
            ))}
          </select>
        </div>

        {/* Questions List */}
        <div className="overflow-y-auto flex-1 space-y-3 pr-1">
          {questions.map((q, idx) => {
            const itemNum = idx + 1;
            const isReverse = reverseItems.includes(itemNum);
            const currentAns = answers[q.id];
            const isRisk = isReverse ? currentAns === 'yes' : currentAns === 'no';

            return (
              <div
                key={q.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  isRisk
                    ? 'bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-slate-200 flex-1">
                  <span className="text-pink-400 font-mono mr-1">#{itemNum}</span> {q.text_ar}
                  <div className="text-slate-400 text-[11px] font-normal mt-0.5">{q.text_fr}</div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse shrink-0">
                  <button
                    type="button"
                    onClick={() => setAnswers({ ...answers, [q.id]: 'yes' })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      currentAns === 'yes'
                        ? (isReverse
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500/30'
                            : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30')
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    نعم (Oui)
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnswers({ ...answers, [q.id]: 'no' })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      currentAns === 'no'
                        ? (!isReverse
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500/30'
                            : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30')
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    لا (Non)
                  </button>
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
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/25 transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Valider & Enregistrer le M-CHAT-R'}
          </button>
        </div>
      </div>
    </div>
  );
}
