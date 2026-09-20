import React, { useState, useEffect, useRef } from 'react';
import { 
  Lightbulb, 
  Volume2, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  Sparkles, 
  HelpCircle, 
  Clock, 
  Check, 
  Play, 
  Layers, 
  Zap, 
  ThumbsUp, 
  FileText
} from 'lucide-react';
import { digitalTherapyApi } from '../../../api';
import { soundEngine } from '../../../utils/soundEngine';

export default function NamingTherapyModule({ patientId = null, onComplete = null }) {
  const defaultItems = [
    {
      id: 'item_1',
      target_word_ar: 'فنجان',
      target_word_fr: 'Tasse',
      category_ar: 'أدوات يومية',
      emoji: '☕',
      semantic_cue_ar: 'أداة لشرب القهوة والشاي الساخن.',
      semantic_cue_fr: 'Récipient pour boire le café ou le thé.',
      completion_cue_ar: 'صببت القهوة الساخنة في الـ...',
      completion_cue_fr: 'Je bois mon café dans une...',
      phonemic_cue_ar: 'يبدأ بالصوت [فِـ...]',
      phonemic_cue_fr: 'Commence par le son [T...]',
      whole_word_ar: 'فِنْجَان',
      whole_word_fr: 'Une Tasse',
    },
    {
      id: 'item_2',
      target_word_ar: 'تفاحة',
      target_word_fr: 'Pomme',
      category_ar: 'فواكه وتغذية',
      emoji: '🍎',
      semantic_cue_ar: 'فاكهة حمراء أو خضراء لذيذة ومقرمشة.',
      semantic_cue_fr: 'Un fruit rouge ou vert qu\'on croque.',
      completion_cue_ar: 'أكل الولد الـ...',
      completion_cue_fr: 'Blanche-Neige croque dans la...',
      phonemic_cue_ar: 'يبدأ بالصوت [تُـ...]',
      phonemic_cue_fr: 'Commence par le son [P...]',
      whole_word_ar: 'تُفَّاحَة',
      whole_word_fr: 'Une Pomme',
    },
    {
      id: 'item_3',
      target_word_ar: 'مفتاح',
      target_word_fr: 'Clé',
      category_ar: 'أدوات وأقفال',
      emoji: '🔑',
      semantic_cue_ar: 'يُستخدم لفتح وقفل الأبواب والأقفال المعدنية.',
      semantic_cue_fr: 'Sert à ouvrir les portes et les serrures.',
      completion_cue_ar: 'فتحت قفل الباب بالـ...',
      completion_cue_fr: 'J\'ouvre la porte avec la...',
      phonemic_cue_ar: 'يبدأ بالصوت [مِـ...]',
      phonemic_cue_fr: 'Commence par le son [K...]',
      whole_word_ar: 'مِفْتَاح',
      whole_word_fr: 'Une Clé',
    },
    {
      id: 'item_4',
      target_word_ar: 'هاتف',
      target_word_fr: 'Téléphone',
      category_ar: 'أجهزة إلكترونية',
      emoji: '📱',
      semantic_cue_ar: 'جهاز نتصل به ونتحدث مع العائلة والأصدقاء.',
      semantic_cue_fr: 'Appareil pour appeler et envoyer des messages.',
      completion_cue_ar: 'اتصلت بأمي عبر الـ...',
      completion_cue_fr: 'Je réponds à l\'appel sur mon...',
      phonemic_cue_ar: 'يبدأ بالصوت [هـَ...]',
      phonemic_cue_fr: 'Commence par le son [T...]',
      whole_word_ar: 'هَاتِف',
      whole_word_fr: 'Un Téléphone',
    },
    {
      id: 'item_5',
      target_word_ar: 'ملعقة',
      target_word_fr: 'Cuillère',
      category_ar: 'أواني المطبخ',
      emoji: '🥄',
      semantic_cue_ar: 'أداة لتناول الحساء والزبادي في المطبخ.',
      semantic_cue_fr: 'Ustensile pour manger la soupe.',
      completion_cue_ar: 'شربت الشوربة الساخنة بالـ...',
      completion_cue_fr: 'Je mange mon yaourt avec une...',
      phonemic_cue_ar: 'يبدأ بالصوت [مِـ...]',
      phonemic_cue_fr: 'Commence par le son [K...]',
      whole_word_ar: 'مِلْعَقَة',
      whole_word_fr: 'Une Cuillère',
    },
    {
      id: 'item_6',
      target_word_ar: 'نظارة',
      target_word_fr: 'Lunettes',
      category_ar: 'مستلزمات شخصية',
      emoji: '👓',
      semantic_cue_ar: 'نضعها على العينين لتحسين الرؤية والقراءة.',
      semantic_cue_fr: 'Accessoire qu\'on met pour mieux voir et lire.',
      completion_cue_ar: 'قرأت الجريدة واضعاً الـ...',
      completion_cue_fr: 'Pour lire le journal, je mets mes...',
      phonemic_cue_ar: 'يبدأ بالصوت [نَـ...]',
      phonemic_cue_fr: 'Commence par le son [L...]',
      whole_word_ar: 'نَظَّارَة',
      whole_word_fr: 'Des Lunettes',
    },
    {
      id: 'item_7',
      target_word_ar: 'ساعة',
      target_word_fr: 'Montre',
      category_ar: 'مستلزمات الوقت',
      emoji: '⌚',
      semantic_cue_ar: 'نرتديها في المعصم لمعرفة الوقت ومواعيد اليوم.',
      semantic_cue_fr: 'Objet porté au poignet pour lire l\'heure.',
      completion_cue_ar: 'نظرت إلى معصمي لأعرف الوقت عبر الـ...',
      completion_cue_fr: 'Il est midi pile à ma...',
      phonemic_cue_ar: 'يبدأ بالصوت [سَـ...]',
      phonemic_cue_fr: 'Commence par le son [M...]',
      whole_word_ar: 'سَاعَة',
      whole_word_fr: 'Une Montre',
    },
    {
      id: 'item_8',
      target_word_ar: 'قلم',
      target_word_fr: 'Stylo',
      category_ar: 'أدوات مكتبية',
      emoji: '🖊️',
      semantic_cue_ar: 'أداة حبرية نمسكها بالأصابع للكتابة وتوقيع الوثائق.',
      semantic_cue_fr: 'Outil pour écrire sur du papier.',
      completion_cue_ar: 'وقّع الطبيب الوصفة بواسطة الـ...',
      completion_cue_fr: 'J\'écris une lettre avec un...',
      phonemic_cue_ar: 'يبدأ بالصوت [قَـ...]',
      phonemic_cue_fr: 'Commence par le son [S...]',
      whole_word_ar: 'قَلَم',
      whole_word_fr: 'Un Stylo',
    },
    {
      id: 'item_9',
      target_word_ar: 'كرسي',
      target_word_fr: 'Chaise',
      category_ar: 'أثاث منزلي',
      emoji: '🪑',
      semantic_cue_ar: 'قطعة أثاث بأربعة أرجل نستخدمها للجلوس والراحة.',
      semantic_cue_fr: 'Meuble à quatre pieds pour s\'asseoir.',
      completion_cue_ar: 'تعب الرجل فجلس ليستريح على الـ...',
      completion_cue_fr: 'Je m\'assois confortablement sur la...',
      phonemic_cue_ar: 'يبدأ بالصوت [كُـ...]',
      phonemic_cue_fr: 'Commence par le son [CH...]',
      whole_word_ar: 'كُرْسِي',
      whole_word_fr: 'Une Chaise',
    },
    {
      id: 'item_10',
      target_word_ar: 'سيارة',
      target_word_fr: 'Voiture',
      category_ar: 'وسائل النقل',
      emoji: '🚗',
      semantic_cue_ar: 'مركبة بأربع عجلات ومحرك للتنقل في الشوارع والسفر.',
      semantic_cue_fr: 'Véhicule à moteur pour se déplacer sur la route.',
      completion_cue_ar: 'سافرنا إلى العمل في الصباح بواسطة الـ...',
      completion_cue_fr: 'Je conduis sur l\'autoroute en...',
      phonemic_cue_ar: 'يبدأ بالصوت [سَـ...]',
      phonemic_cue_fr: 'Commence par le son [V...]',
      whole_word_ar: 'سَيَّارَة',
      whole_word_fr: 'Une Voiture',
    },
  ];

  const [items, setItems] = useState(defaultItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeCueTier, setActiveCueTier] = useState(0); // 0: None, 1: Semantic, 2: Completion, 3: Phonemic, 4: Whole Word
  const [scoreLog, setScoreLog] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [saving, setSaving] = useState(false);

  // Fetch from server if available
  useEffect(() => {
    const loadModules = async () => {
      try {
        const resp = await digitalTherapyApi.listModules({ sub_tool: 'naming' });
        if (resp && resp.modules && resp.modules.length > 0) {
          const mod = resp.modules.find((m) => m.sub_tool === 'naming');
          if (mod && mod.content_payload && mod.content_payload.items) {
            setItems(mod.content_payload.items);
          }
        }
      } catch (err) {
        // Fallback to local defaultItems
      }
    };
    loadModules();
  }, []);

  const currentItem = items[currentIndex] || items[0];

  const speakText = (text) => {
    soundEngine.speak(text, 'ar-SA', { rate: 0.85 });
  };

  const handleRevealCue = (tier) => {
    setActiveCueTier(tier);
    if (tier === 1) speakText(currentItem.semantic_cue_ar);
    if (tier === 2) speakText(currentItem.completion_cue_ar || currentItem.semantic_cue_ar);
    if (tier === 3) speakText(currentItem.phonemic_cue_ar);
    if (tier === 4) speakText(currentItem.whole_word_ar);
  };

  const handleScore = (type) => {
    const elapsed = Date.now() - startTime;
    let isCorrect = false;
    let cuesUsed = 0;

    if (type === 'independent') {
      isCorrect = true;
      cuesUsed = 0;
      soundEngine.playSuccessSound();
    } else if (type === 'assisted') {
      isCorrect = true;
      cuesUsed = Math.max(1, activeCueTier);
      soundEngine.playSuccessSound();
    } else if (type === 'incorrect') {
      isCorrect = false;
      cuesUsed = activeCueTier;
      soundEngine.playErrorSound();
    }

    const entry = {
      item_id: currentItem.id,
      target: currentItem.target_word_ar,
      emoji: currentItem.emoji,
      scoring_type: type,
      is_correct: isCorrect,
      cues_used: cuesUsed,
      reaction_time_ms: elapsed,
    };

    const nextLogs = [...scoreLog, entry];
    setScoreLog(nextLogs);

    if (currentIndex + 1 < items.length) {
      setCurrentIndex(currentIndex + 1);
      setActiveCueTier(0);
      setStartTime(Date.now());
    } else {
      setIsFinished(true);
      submitResults(nextLogs);
    }
  };

  const submitResults = async (finalLogs) => {
    const correctCount = finalLogs.filter((l) => l.is_correct).length;
    const accuracy = Math.round((correctCount / finalLogs.length) * 100);
    const totalCues = finalLogs.reduce((acc, curr) => acc + curr.cues_used, 0);
    const avgTime = Math.round(
      finalLogs.reduce((acc, curr) => acc + curr.reaction_time_ms, 0) / finalLogs.length
    );

    const payload = {
      category: 'aphasia_language',
      sub_tool: 'naming',
      accuracy_percentage: accuracy,
      cues_needed_count: totalCues,
      reaction_time_avg_ms: avgTime,
      session_log: finalLogs,
    };

    setSaving(true);
    try {
      if (patientId) {
        await digitalTherapyApi.logResults(patientId, payload);
      }
    } catch (e) {
      console.error('Failed to log therapy result:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setActiveCueTier(0);
    setScoreLog([]);
    setIsFinished(false);
    setStartTime(Date.now());
  };

  const correctCount = scoreLog.filter((l) => l.is_correct).length;
  const independentCount = scoreLog.filter((l) => l.scoring_type === 'independent').length;
  const assistedCount = scoreLog.filter((l) => l.scoring_type === 'assisted').length;
  const incorrectCount = scoreLog.filter((l) => l.scoring_type === 'incorrect').length;
  const totalCuesUsed = scoreLog.reduce((acc, curr) => acc + curr.cues_used, 0);
  const accuracy = scoreLog.length > 0 ? Math.round((correctCount / scoreLog.length) * 100) : 0;
  const avgCuesPerItem = scoreLog.length > 0 ? (totalCuesUsed / scoreLog.length).toFixed(1) : '0';
  const avgLatency = scoreLog.length > 0 
    ? Math.round(scoreLog.reduce((acc, curr) => acc + curr.reaction_time_ms, 0) / scoreLog.length)
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 max-w-3xl mx-auto shadow-2xl animate-in fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/25">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              علاج استرجاع الكلمات والتسمية (Hierarchical Naming Therapy)
            </h3>
            <p className="text-xs text-slate-400">
              محرك التلميحات السريرية المتدرجة (4 مستويات) مع لوحة التقييم المباشر
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-3.5 py-1.5 rounded-xl border border-amber-500/30">
          <span>عنصر {currentIndex + 1} / {items.length}</span>
        </div>
      </div>

      {!isFinished ? (
        <div className="space-y-6">
          {/* Main Stimulus Card */}
          <div className="p-8 rounded-3xl bg-slate-950 border-2 border-slate-800 text-center space-y-3 shadow-inner relative overflow-hidden group">
            <div className="text-8xl sm:text-9xl select-none animate-in zoom-in-95 transition-transform group-hover:scale-105 duration-300">
              {currentItem.emoji}
            </div>
            
            <div className="flex items-center justify-center space-x-2 space-x-reverse">
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400">
                التصنيف: <strong className="text-slate-200">{currentItem.category_ar || 'أدوات عامة'}</strong>
              </span>

              <button
                type="button"
                onClick={() => speakText(currentItem.target_word_ar)}
                className="px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center space-x-1 space-x-reverse transition-all"
                title="نطق الكلمة"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>نطق الصوت</span>
              </button>
            </div>
          </div>

          {/* 4-Tier Progressive Clinical Cueing Engine */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold text-slate-300 flex items-center justify-between">
              <span className="flex items-center space-x-1.5 space-x-reverse">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>نظام التلميحات المتدرجة (Indices Hiérarchisés):</span>
              </span>
              <span className="text-[11px] text-slate-500">انقر لتقديم المساعدة للمريض</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Tier 1: Semantic Cue */}
              <button
                type="button"
                onClick={() => handleRevealCue(1)}
                className={`p-3.5 rounded-2xl border text-right transition-all space-y-1 ${
                  activeCueTier >= 1
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-md ring-1 ring-amber-400/40'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="text-xs font-black flex items-center justify-between">
                  <span>💡 1. تلميح دلالي (Sémantique)</span>
                  {activeCueTier >= 1 && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="text-xs text-slate-300 leading-snug">
                  {activeCueTier >= 1 ? currentItem.semantic_cue_ar : 'تقديم شرح وظيفة الشيء...'}
                </div>
              </button>

              {/* Tier 2: Sentence Completion Prompt */}
              <button
                type="button"
                onClick={() => handleRevealCue(2)}
                className={`p-3.5 rounded-2xl border text-right transition-all space-y-1 ${
                  activeCueTier >= 2
                    ? 'bg-orange-500/15 border-orange-500/50 text-orange-200 shadow-md ring-1 ring-orange-400/40'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="text-xs font-black flex items-center justify-between">
                  <span>📝 2. إكمال الجملة (Complétion)</span>
                  {activeCueTier >= 2 && <Check className="w-4 h-4 text-orange-400" />}
                </div>
                <div className="text-xs text-slate-300 leading-snug">
                  {activeCueTier >= 2 ? currentItem.completion_cue_ar : 'سياق جملة مفتوحة للإكمال...'}
                </div>
              </button>

              {/* Tier 3: First Sound / Phonemic Cue */}
              <button
                type="button"
                onClick={() => handleRevealCue(3)}
                className={`p-3.5 rounded-2xl border text-right transition-all space-y-1 ${
                  activeCueTier >= 3
                    ? 'bg-sky-500/15 border-sky-500/50 text-sky-200 shadow-md ring-1 ring-sky-400/40'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="text-xs font-black flex items-center justify-between">
                  <span>🗣️ 3. صوت البداية (Phonémique)</span>
                  {activeCueTier >= 3 && <Check className="w-4 h-4 text-sky-400" />}
                </div>
                <div className="text-xs text-slate-300 leading-snug">
                  {activeCueTier >= 3 ? currentItem.phonemic_cue_ar : 'نطق المقطع الصوتي الأول...'}
                </div>
              </button>

              {/* Tier 4: Whole Word Assist */}
              <button
                type="button"
                onClick={() => handleRevealCue(4)}
                className={`p-3.5 rounded-2xl border text-right transition-all space-y-1 ${
                  activeCueTier >= 4
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 shadow-md ring-1 ring-emerald-400/40'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="text-xs font-black flex items-center justify-between">
                  <span>🌟 4. الكلمة كاملة (Mot Entier)</span>
                  {activeCueTier >= 4 && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-xs text-slate-300 leading-snug">
                  {activeCueTier >= 4 ? `${currentItem.whole_word_ar} (${currentItem.whole_word_fr})` : 'إظهار ونطق الكلمة بالكامل'}
                </div>
              </button>
            </div>
          </div>

          {/* Rapid SLP Scoring Pad */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-xs font-black text-slate-400">لوحة تسجيل إجابة المريض السريعة:</div>
            <div className="grid grid-cols-3 gap-3">
              {/* Option 1: Independent (0 cue) */}
              <button
                type="button"
                onClick={() => handleScore('independent')}
                className="py-3.5 px-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>إجابة مستقلة ✅ (Indépendant)</span>
              </button>

              {/* Option 2: Assisted (with cues) */}
              <button
                type="button"
                onClick={() => handleScore('assisted')}
                className="py-3.5 px-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>مع تلميح 💡 (Assisté)</span>
              </button>

              {/* Option 3: Incorrect */}
              <button
                type="button"
                onClick={() => handleScore('incorrect')}
                className="py-3.5 px-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <XCircle className="w-4 h-4" />
                <span>لم يستطع ❌ (Échec)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Results & Performance Summary Card */
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-6 animate-in zoom-in-95 text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center text-slate-950 mx-auto shadow-xl shadow-amber-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-xl font-black text-white">تقرير جلسة التسمية واسترجاع الكلمات 🌟</h4>
            <p className="text-xs text-slate-400">
              تم توثيق المؤشرات السريرية ومستوى استقلالية المريض بدقة
            </p>
          </div>

          {/* 4 KPIs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">نسبة الدقة الكلية</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{accuracy}%</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">تسمية مستقلة (0 تلميح)</span>
              <span className="text-2xl font-black font-mono text-teal-300">{independentCount} / {items.length}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">معدل التلميحات / عنصر</span>
              <span className="text-2xl font-black font-mono text-amber-300">{avgCuesPerItem}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">متوسط سرعة الاستجابة</span>
              <span className="text-2xl font-black font-mono text-sky-300">{avgLatency}ms</span>
            </div>
          </div>

          {/* Items breakdown list */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-right">
            <div className="text-xs font-black text-slate-300 flex items-center justify-between pb-1 border-b border-slate-800">
              <span>تفاصيل العناصر ({scoreLog.length}):</span>
              <span>الاستقلالية &bull; التلميحات</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {scoreLog.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                  <div className="flex items-center space-x-2 space-x-reverse font-bold text-slate-200">
                    <span className="text-base">{log.emoji}</span>
                    <span>{log.target}</span>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse font-mono text-[11px]">
                    {log.scoring_type === 'independent' && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">مستقل ✅</span>
                    )}
                    {log.scoring_type === 'assisted' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">تلميح ({log.cues_used}) 💡</span>
                    )}
                    {log.scoring_type === 'incorrect' && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold">إخفاق ❌</span>
                    )}
                    <span className="text-slate-500">{log.reaction_time_ms}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse justify-center pt-2">
            <button
              type="button"
              onClick={handleRestart}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة التمرين</span>
            </button>

            {onComplete && (
              <button
                type="button"
                onClick={onComplete}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs transition-all shadow-md"
              >
                العودة للكتالوج
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
