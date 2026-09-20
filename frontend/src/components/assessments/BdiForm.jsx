import React, { useState } from 'react';
import { HeartPulse, X, CheckCircle2 } from 'lucide-react';

export default function BdiForm({ patients = [], isOpen, onClose, onSave, saving }) {
  const [patientId, setPatientId] = useState('');
  const [answers, setAnswers] = useState({});

  const bdiQuestions = [
    { id: 'q1', title: "1. الحزن والتعاسة (Tristesse)", options: ["0 - لا أشعر بالحزن", "1 - أشعر بالحزن أغلب الوقت", "2 - أنا حزين طوال الوقت ولا أستطيع التخلص من ذلك", "3 - أنا شديد الحزن لدرجة لا أستطيع تحملها"] },
    { id: 'q2', title: "2. التشاؤم (Pessimisme)", options: ["0 - لست متشائماً بشأن مستقبلي", "1 - أشعر بالإحباط حيال المستقبل أكثر من المعتاد", "2 - لا أتوقع أن تسير الأمور على ما يرام", "3 - أشعر أن مستقبلي ميؤوس منه"] },
    { id: 'q3', title: "3. الشعور بالفشل (Échec passé)", options: ["0 - لا أشعر بالفشل", "1 - لقد فشلت أكثر مما ينبغي", "2 - عندما أنظر إلى الماضي أرى الكثير من الإخفاقات", "3 - أشعر أنني شخص فاشل تماماً"] },
    { id: 'q4', title: "4. فقدان المتعة (Perte de plaisir)", options: ["0 - ما زلت أستمتع بالأشياء كما في السابق", "1 - لا أستمتع بالأشياء بالقدر المعتاد", "2 - أحصل على متعة قليلة جداً من الأشياء التي كنت أحبها", "3 - لا أستطيع الحصول على أي متعة على الإطلاق"] },
    { id: 'q5', title: "5. الشعور بالذنب (Sentiment de culpabilité)", options: ["0 - لا أشعر بذنب خاص", "1 - أشعر بالذنب بشأن أشياء كثيرة فعلتها أو كان يجب أن أفعلها", "2 - أشعر بالذنب أغلب الوقت", "3 - أشعر بالذنب طوال الوقت"] },
    { id: 'q6', title: "6. الشعور بالعقاب (Sentiment de punition)", options: ["0 - لا أشعر بأنني أتعرض للعقاب", "1 - أشعر بأنني قد أعاقب", "2 - أتوقع أن أعاقب", "3 - أشعر بأنني أعاقب بالفعل"] },
    { id: 'q7', title: "7. كراهية الذات (Dégoût de soi)", options: ["0 - أشعر بالرضا عن نفسي كالمعتاد", "1 - لقد فقدت الثقة في نفسي", "2 - أشعر بخيبة أمل في نفسي", "3 - أكره نفسي تماماً"] },
    { id: 'q8', title: "8. لوم الذات (Auto-critique)", options: ["0 - لا أنتقد نفسي أكثر من المعتاد", "1 - أنتقد نفسي أكثر من المعتاد", "2 - أنتقد نفسي على كل أخطائي", "3 - ألوم نفسي على كل سوء يحدث"] },
    { id: 'q9', title: "9. الأفكار الانتحارية (Pensées suicidaires)", options: ["0 - ليس لدي أي أفكار لإيذاء نفسي", "1 - تراودني أفكار لإيذاء نفسي ولكنني لن أنفذها", "2 - أرغب في إنهاء حياتي", "3 - سأقتل نفسي إذا سنحت لي الفرصة"] },
    { id: 'q10', title: "10. البكاء (Pleurs)", options: ["0 - لا أبكي أكثر من المعتاد", "1 - أبكي أكثر مما كنت أفعل", "2 - أبكي على كل شيء صغير", "3 - أشعر برغبة في البكاء لكنني عاجز عن ذلك"] },
    { id: 'q11', title: "11. التململ والاضطراب (Agitation)", options: ["0 - لست متململاً أكثر من المعتاد", "1 - أشعر بالتململ والاضطراب أكثر من المعتاد", "2 - أنا مضطرب جداً ويصعب علي البقاء ساكناً", "3 - أنا في حالة حركة مستمرة من شدة القلق"] },
    { id: 'q12', title: "12. فقدان الاهتمام (Perte d'intérêt)", options: ["0 - لم أفقد اهتمامي بالآخرين أو بالأنشطة", "1 - أنا أقل اهتماماً بالآخرين والأشياء", "2 - لقد فقدت معظم اهتمامي بالناس والأشياء", "3 - من الصعب جداً أن أهتم بأي شيء"] },
    { id: 'q13', title: "13. التردد وصعوبة القرار (Indécision)", options: ["0 - أتخذ قراراتي كالمعتاد", "1 - أجد صعوبة أكبر في اتخاذ القرارات", "2 - لدي صعوبة بالغة في اتخاذ القرارات", "3 - أعجز تماماً عن اتخاذ أي قرار"] },
    { id: 'q14', title: "14. الشعور بعدم القيمة (Dévalorisation)", options: ["0 - لا أشعر بأنني عديم الفائدة", "1 - لا أعتبر نفسي ذا قيمة كما في السابق", "2 - أشعر بأنني أقل قيمة مقارنة بالآخرين", "3 - أشعر بأنني عديم القيمة تماماً"] },
    { id: 'q15', title: "15. فقدان الطاقة (Perte d'énergie)", options: ["0 - لدي نفس الطاقة كالمعتاد", "1 - طاقتي أقل مما كانت عليه", "2 - ليس لدي طاقة كافية للقيام بالكثير من الأشياء", "3 - ليس لدي أي طاقة للقيام بأي شيء"] },
    { id: 'q16', title: "16. اضطراب النوم (Changements de sommeil)", options: ["0 - نمط نومي لم يتغير", "1 - أنام أكثر أو أقل قليلاً من المعتاد", "2 - أنام أكثر بكثير أو أقل بكثير من المعتاد", "3 - أستيقظ مبكراً جداً ولا أستطيع العودة للنوم أو أنام معظم اليوم"] },
    { id: 'q17', title: "17. سرعة الغضب والانفعال (Irritabilité)", options: ["0 - لست سريع الانفعال أكثر من المعتاد", "1 - أنا أكثر انفعالاً وغضباً من المعتاد", "2 - أنا شديد الانفعال أغلب الوقت", "3 - أنا غاضب ومستفز طوال الوقت"] },
    { id: 'q18', title: "18. تغير الشهية (Changements d'appétit)", options: ["0 - شهيتي لم تتغير", "1 - شهيتي أقل أو أكبر قليلاً من المعتاد", "2 - شهيتي أقل بكثير أو أكبر بكثير", "3 - ليس لدي شهية إطلاقاً أو أريد الأكل طوال الوقت"] },
    { id: 'q19', title: "19. صعوبة التركيز (Difficulté de concentration)", options: ["0 - أستطيع التركيز كالمعتاد", "1 - أجد صعوبة أكبر في التركيز", "2 - من الصعب جداً أن أركز على أي شيء لفترة طويلة", "3 - أعجز تماماً عن التركيز على أي شيء"] },
    { id: 'q20', title: "20. التعب والإرهاق (Fatigue)", options: ["0 - لست متعباً أكثر من المعتاد", "1 - أتعب بسهولة أكبر من المعتاد", "2 - أنا متعب جداً لدرجة تعيقني عن القيام بأنشطة كثيرة", "3 - أنا متعب جداً لدرجة تعجزني عن القيام بأي شيء"] },
    { id: 'q21', title: "21. فقدان الاهتمام بالجنس (Perte d'intérêt sexuel)", options: ["0 - لم ألاحظ تغيراً في اهتمامي بالجنس", "1 - أنا أقل اهتماماً بالجنس من المعتاد", "2 - اهتمامي بالجنس ضئيل جداً حالياً", "3 - لقد فقدت كل اهتمامي بالجنس تماماً"] },
  ];

  const calculateScore = () => {
    let sum = 0;
    bdiQuestions.forEach((q) => {
      sum += parseInt(answers[q.id] || 0, 10);
    });
    return sum;
  };

  const getSeverity = (score) => {
    if (score <= 13) return { text: "Dépression Minime / منعدمة أو طفيفة", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
    if (score <= 19) return { text: "Dépression Légère / اكتئاب خفيف", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
    if (score <= 28) return { text: "Dépression Modérée / اكتئاب متوسط", color: "bg-orange-500/20 text-orange-300 border-orange-500/40" };
    return { text: "Dépression Sévère / اكتئاب حاد", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
  };

  if (!isOpen) return null;

  const currentScore = calculateScore();
  const severity = getSeverity(currentScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-blue-500/30 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                مقياس بيك للاكتئاب (BDI-II)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Beck Depression Inventory, 2ème Édition (21 items cliniques)
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-bold text-blue-300">
              Score Total : <span className="text-lg font-black text-white">{currentScore}</span> / 63
            </div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${severity.color}`}>
              {severity.text}
            </span>
          </div>
        </div>

        {/* Patient Select */}
        <div className="shrink-0 space-y-1">
          <label className="text-xs font-bold text-slate-300">Sélectionner le Patient :</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:ring-2 focus:ring-blue-500"
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
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {bdiQuestions.map((q) => {
            const currentVal = answers[q.id] ?? 0;
            return (
              <div key={q.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="font-bold text-xs text-blue-300">{q.title}</div>
                <div className="space-y-1.5">
                  {q.options.map((optText, optIdx) => (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: optIdx })}
                      className={`w-full text-right p-2.5 rounded-xl text-xs border transition-all ${
                        currentVal === optIdx
                          ? 'bg-blue-500/20 border-blue-500/70 text-blue-200 font-bold ring-1 ring-blue-500/30'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {optText}
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
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Valider & Enregistrer le BDI-II'}
          </button>
        </div>
      </div>
    </div>
  );
}
