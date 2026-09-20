import React, { useState } from 'react';
import { 
  Volume2, 
  MessageSquare, 
  Sparkles, 
  Heart, 
  Delete, 
  RotateCcw, 
  Activity, 
  AlertCircle, 
  User, 
  Smile, 
  Droplet, 
  Utensils, 
  Pill, 
  ShieldAlert, 
  Check, 
  Trash2,
  Mic
} from 'lucide-react';
import { soundEngine } from '../../../utils/soundEngine';

export default function AlphaTopicsAAC({ patientId = null }) {
  const [activeTab, setActiveTab] = useState('alphabet'); // 'alphabet' or 'topics'
  const [sentenceSequence, setSentenceSequence] = useState([]);
  const [activeLang, setActiveLang] = useState('ar'); // 'ar' or 'fr'

  const alphabetLettersAr = [
    'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ',
    'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص',
    'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق',
    'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي', 'مسافة',
  ];

  const alphabetLettersFr = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G',
    'H', 'I', 'J', 'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R', 'S', 'T', 'U',
    'V', 'W', 'X', 'Y', 'Z', 'ESPACE',
  ];

  const basicNeeds = [
    { id: 'need_water', label_ar: 'عطشان / ماء', label_fr: 'Soif / Eau', icon: '💧', text_ar: 'أنا عطشان وأريد ماء من فضلك', text_fr: 'J\'ai soif, je veux de l\'eau s\'il vous plaît', color: 'bg-sky-600 hover:bg-sky-500 text-white' },
    { id: 'need_food', label_ar: 'جوعان / طعام', label_fr: 'Faim / Manger', icon: '🍲', text_ar: 'أنا جائع وأريد وجبة طعام', text_fr: 'J\'ai faim, je veux manger', color: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
    { id: 'need_wc', label_ar: 'دخول الحمام', label_fr: 'Toilettes', icon: '🚻', text_ar: 'أريد الذهاب إلى الحمام فوراً', text_fr: 'Je dois aller aux toilettes maintenant', color: 'bg-amber-600 hover:bg-amber-500 text-white' },
    { id: 'need_pain', label_ar: 'أشعر بألم', label_fr: 'Douleur', icon: '⚡', text_ar: 'أشعر بألم شديد، يرجى مساعدتي', text_fr: 'J\'ai très mal, aidez-moi s\'il vous plaît', color: 'bg-rose-600 hover:bg-rose-500 text-white' },
    { id: 'need_med', label_ar: 'أحتاج دواء', label_fr: 'Médicament', icon: '💊', text_ar: 'حان وقت تناول الدواء الخاص بي', text_fr: 'J\'ai besoin de mon médicament', color: 'bg-purple-600 hover:bg-purple-500 text-white' },
  ];

  const peopleList = [
    { id: 'ppl_family', label_ar: 'عائلة', label_fr: 'Famille', icon: '👨‍👩‍👧', text_ar: 'أريد الاتصال بعائلتي ورؤيتهم', text_fr: 'Je veux appeler ma famille', color: 'bg-indigo-600 hover:bg-indigo-500 text-white' },
    { id: 'ppl_doctor', label_ar: 'طبيب', label_fr: 'Médecin', icon: '👨‍⚕️', text_ar: 'أريد التحدث مع الطبيب المعالج', text_fr: 'Je veux voir le médecin', color: 'bg-teal-600 hover:bg-teal-500 text-white' },
    { id: 'ppl_nurse', label_ar: 'ممرض', label_fr: 'Infirmier', icon: '👩‍⚕️', text_ar: 'أحتاج مساعدة الممرض الآن', text_fr: 'J\'appelle l\'infirmier', color: 'bg-cyan-600 hover:bg-cyan-500 text-white' },
  ];

  const feelingsList = [
    { id: 'feel_tired', label_ar: 'متعب', label_fr: 'Fatigué', icon: '😴', text_ar: 'أشعر بالإرهاق وأريد أخذ قسط من الراحة', text_fr: 'Je suis très fatigué, je veux dormir', color: 'bg-slate-700 hover:bg-slate-600 text-white' },
    { id: 'feel_happy', label_ar: 'سعيد', label_fr: 'Content', icon: '😊', text_ar: 'أنا سعيد وبصحة جيدة ومطمئن', text_fr: 'Je suis content et tout va bien', color: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
    { id: 'feel_anxious', label_ar: 'قلق', label_fr: 'Inquiet', icon: '😟', text_ar: 'أشعر بالقلق والتوتر وأحتاج طمأنة', text_fr: 'Je me sens inquiet et angoissé', color: 'bg-orange-600 hover:bg-orange-500 text-white' },
  ];

  const speakText = (text, lang = 'ar-SA') => {
    soundEngine.speak(text, lang, { rate: 0.9 });
  };

  const handleTapTile = (item) => {
    const textToSpeak = activeLang === 'ar' ? item.text_ar : item.text_fr;
    const label = activeLang === 'ar' ? item.label_ar : item.label_fr;
    const langCode = activeLang === 'ar' ? 'ar-SA' : 'fr-FR';

    soundEngine.playChime();
    speakText(textToSpeak, langCode);
    setSentenceSequence((prev) => [...prev, `${item.icon} ${label}`]);
  };

  const handleTapLetter = (char) => {
    const isSpace = char === 'مسافة' || char === 'ESPACE';
    const langCode = activeLang === 'ar' ? 'ar-SA' : 'fr-FR';

    if (!isSpace) {
      speakText(char, langCode);
      setSentenceSequence((prev) => [...prev, char]);
    } else {
      setSentenceSequence((prev) => [...prev, ' ']);
    }
  };

  const handleSpeakFullSentence = () => {
    if (sentenceSequence.length === 0) return;
    const sentence = sentenceSequence.join(' ').replace(/  +/g, ' ');
    const langCode = activeLang === 'ar' ? 'ar-SA' : 'fr-FR';
    speakText(sentence, langCode);
  };

  const handleClearSentence = () => {
    setSentenceSequence([]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 max-w-4xl mx-auto shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center text-white font-black shadow-lg shadow-teal-500/25">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              لوحة التواصل المعزز والبديل (AlphaTopics AAC Suite)
            </h3>
            <p className="text-xs text-slate-400">
              لوحة الحروف الأولى، بنك الاحتياجات الوظيفية، وشريط بناء الجمل مع النطق الصوتي الفوري
            </p>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveLang('ar')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeLang === 'ar' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇩🇿 العربية (ar)
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('fr')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeLang === 'fr' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇫🇷 Français (fr)
          </button>
        </div>
      </div>

      {/* Top Sentence Builder Bar */}
      <div className="p-4 rounded-3xl bg-slate-950 border-2 border-teal-500/30 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex-1 min-h-[36px] flex items-center flex-wrap gap-1.5 text-sm font-bold text-teal-200">
          {sentenceSequence.length > 0 ? (
            sentenceSequence.map((token, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-100 font-black animate-in zoom-in-95"
              >
                {token}
              </span>
            ))
          ) : (
            <span className="text-slate-600 text-xs font-normal">
              انقر على الحروف أو البلاطات لبناء الجملة ونطقها فورياً...
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            type="button"
            disabled={sentenceSequence.length === 0}
            onClick={handleSpeakFullSentence}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:opacity-40 text-white font-black text-xs flex items-center space-x-1.5 space-x-reverse shadow-lg shadow-teal-500/20 transition-all active:scale-95"
          >
            <Volume2 className="w-4 h-4" />
            <span>🔊 قراءة الجملة</span>
          </button>

          <button
            type="button"
            disabled={sentenceSequence.length === 0}
            onClick={handleClearSentence}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all"
            title="مسح"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Tabs (Alphabet vs Topics) */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('alphabet')}
          className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-2 space-x-reverse ${
            activeTab === 'alphabet'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🔤 1. لوحة الحروف الأولى (First-Letter Board)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('topics')}
          className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-2 space-x-reverse ${
            activeTab === 'topics'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📋 2. لوحة المواضيع والاحتياجات (Topic & Needs Board)</span>
        </button>
      </div>

      {/* TAB 1: First-Letter High-Contrast Alphabet Grid */}
      {activeTab === 'alphabet' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span>انقر على الحرف الأول للكلمة المستهدفة لنطقه ومساعدة المستمع:</span>
            <span className="text-teal-400 font-mono">Alphabet Grid</span>
          </div>

          <div className="grid grid-cols-7 gap-2.5">
            {(activeLang === 'ar' ? alphabetLettersAr : alphabetLettersFr).map((char, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTapLetter(char)}
                className="py-4 rounded-2xl bg-slate-950 border-2 border-slate-800 hover:border-teal-400 text-white font-mono font-black text-lg hover:bg-slate-900 shadow-md transition-all active:scale-90 flex items-center justify-center"
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Categorized Topic & Functional Needs Board */}
      {activeTab === 'topics' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Section 1: Basic Needs */}
          <div className="space-y-2.5">
            <div className="text-xs font-extrabold text-teal-300 flex items-center space-x-1.5 space-x-reverse">
              <Droplet className="w-4 h-4 text-sky-400" />
              <span>الاحتياجات الحيوية العاجلة (Besoins Vitaux):</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {basicNeeds.map((need) => (
                <button
                  key={need.id}
                  type="button"
                  onClick={() => handleTapTile(need)}
                  className={`p-4 rounded-3xl font-black text-xs flex flex-col items-center justify-center space-y-1.5 shadow-lg transition-all active:scale-95 text-center ${need.color}`}
                >
                  <span className="text-3xl">{need.icon}</span>
                  <span className="text-xs leading-tight">
                    {activeLang === 'ar' ? need.label_ar : need.label_fr}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: People */}
          <div className="space-y-2.5">
            <div className="text-xs font-extrabold text-indigo-300 flex items-center space-x-1.5 space-x-reverse">
              <User className="w-4 h-4 text-indigo-400" />
              <span>الأشخاص والمساعدون (Personnes & Équipe):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {peopleList.map((ppl) => (
                <button
                  key={ppl.id}
                  type="button"
                  onClick={() => handleTapTile(ppl)}
                  className={`p-4 rounded-3xl font-black text-xs flex items-center justify-center space-x-2.5 space-x-reverse shadow-lg transition-all active:scale-95 ${ppl.color}`}
                >
                  <span className="text-2xl">{ppl.icon}</span>
                  <span className="text-xs font-black">
                    {activeLang === 'ar' ? ppl.label_ar : ppl.label_fr}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Feelings */}
          <div className="space-y-2.5">
            <div className="text-xs font-extrabold text-amber-300 flex items-center space-x-1.5 space-x-reverse">
              <Smile className="w-4 h-4 text-amber-400" />
              <span>المشاعر والحالة (Émotions & État):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {feelingsList.map((feel) => (
                <button
                  key={feel.id}
                  type="button"
                  onClick={() => handleTapTile(feel)}
                  className={`p-4 rounded-3xl font-black text-xs flex items-center justify-center space-x-2.5 space-x-reverse shadow-lg transition-all active:scale-95 ${feel.color}`}
                >
                  <span className="text-2xl">{feel.icon}</span>
                  <span className="text-xs font-black">
                    {activeLang === 'ar' ? feel.label_ar : feel.label_fr}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
