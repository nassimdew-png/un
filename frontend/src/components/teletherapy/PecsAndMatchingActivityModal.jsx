import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  X,
  Play,
  ArrowRight,
  Smile,
  Heart,
  Award,
  RefreshCw,
  Send,
  HelpCircle
} from 'lucide-react';

export const PECS_CARDS_CATALOG = [
  { id: 'p1', titleAr: 'تفاحة حمراء', titleFr: 'Pomme', category: 'food', symbol: '🍎', phonetic: '/t/' },
  { id: 'p2', titleAr: 'حليب دافئ', titleFr: 'Lait', category: 'drinks', symbol: '🥛', phonetic: '/h/' },
  { id: 'p3', titleAr: 'ماء نقي', titleFr: 'Eau', category: 'drinks', symbol: '💧', phonetic: '/m/' },
  { id: 'p4', titleAr: 'سيارة لعبة', titleFr: 'Voiture', category: 'toys', symbol: '🚗', phonetic: '/s/' },
  { id: 'p5', titleAr: 'كرة ملونة', titleFr: 'Ballon', category: 'toys', symbol: '⚽', phonetic: '/k/' },
  { id: 'p6', titleAr: 'بسكويت لذيذ', titleFr: 'Biscuit', category: 'food', symbol: '🍪', phonetic: '/b/' },
  { id: 'p7', titleAr: 'موز أصفر', titleFr: 'Banane', category: 'food', symbol: '🍌', phonetic: '/m/' },
  { id: 'p8', titleAr: 'دمية دب', titleFr: 'Peluche', category: 'toys', symbol: '🧸', phonetic: '/d/' },
];

export const MATCHING_PAIRS_CATALOG = [
  { id: 'mp1', leftSymbol: '🐱', leftLabel: 'قطة', rightSymbol: '🐱', rightLabel: 'قطة مطابقة', category: 'identical' },
  { id: 'mp2', leftSymbol: '🚗', leftLabel: 'سيارة', rightSymbol: '🚗', rightLabel: 'سيارة مطابقة', category: 'identical' },
  { id: 'mp3', leftSymbol: '🍎', leftLabel: 'تفاحة', rightSymbol: '🍎', rightLabel: 'تفاحة مطابقة', category: 'identical' },
  { id: 'mp4', leftSymbol: '🐶', leftLabel: 'كلب', rightSymbol: '🐶', rightLabel: 'كلب مطابق', category: 'identical' },
  { id: 'mp5', leftSymbol: '✈️', leftLabel: 'طائرة', rightSymbol: '✈️', rightLabel: 'طائرة مطابقة', category: 'identical' },
];

export default function PecsAndMatchingActivityModal({
  isOpen,
  onClose,
  patientName = 'المريض',
  onLaunchToWhiteboard = null,
  onInjectIntoSoap = null,
}) {
  const [activeTab, setActiveTab] = useState('pecs'); // 'pecs' | 'matching' | 'sentence_strip'
  
  // PECS Sentence Strip State
  const [sentencePrefix, setSentencePrefix] = useState('أنا أريد'); // 'أنا أريد' | 'أنا أرى' | 'أنا أسمع'
  const [selectedPecsCard, setSelectedPecsCard] = useState(PECS_CARDS_CATALOG[0]);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [exchangeHistory, setExchangeHistory] = useState([]);

  // Matching Activity State
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [matchingScore, setMatchingScore] = useState(0);

  if (!isOpen) return null;

  // Handle PECS exchange confirmation
  const handleCompletePecsExchange = () => {
    const newEntry = {
      prefix: sentencePrefix,
      card: selectedPecsCard.titleAr,
      symbol: selectedPecsCard.symbol,
      time: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
    };
    setExchangeHistory((prev) => [newEntry, ...prev]);
    setExchangeCount((prev) => prev + 1);
  };

  // Handle Matching Game Selection
  const handleSelectLeftMatching = (item) => {
    setSelectedLeft(item);
  };

  const handleSelectRightMatching = (item) => {
    if (!selectedLeft) return;
    if (selectedLeft.id === item.id) {
      // Correct Match!
      if (!matchedPairs.includes(item.id)) {
        setMatchedPairs((prev) => [...prev, item.id]);
        setMatchingScore((prev) => prev + 10);
      }
      setSelectedLeft(null);
    } else {
      // Incorrect Match
      setSelectedLeft(null);
    }
  };

  // Inject activity results into SOAP Notes
  const handleInjectToSoap = () => {
    const pecsSummary = exchangeHistory.length > 0
      ? `• نظام PECS للتواصل البديل: إنجاز ${exchangeCount} محاولات تبادل ناجحة بتركيب شريط الجملة (${sentencePrefix} + بطاقة الهدف).\n`
      : '';
    const matchingSummary = matchedPairs.length > 0
      ? `• نشاط مطابقة الصور والتصنيف البصري: إنجاز مطابقة ${matchedPairs.length}/${MATCHING_PAIRS_CATALOG.length} أزواج بدقة عالية (النقاط: ${matchingScore}).\n`
      : '';

    const totalSummary = `\n[أنشطة التواصل البصري والمطابقة - PECS & Matching]:\n${pecsSummary}${matchingSummary}• التفاعل السريري: استجابة ممتازة للتعزيزات البصرية والمبادأة التواصلية.\n`;

    if (onInjectIntoSoap) {
      onInjectIntoSoap({ field: 'objective', text: totalSummary });
    }
    alert('✅ تم إدراج نتائج نشاط PECS ومطابقة الصور في خانة الملاحظات الموضوعية (Objective - O) في SOAP!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none font-sans" dir="rtl">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-500/30 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">
              🎴
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  بنك بطاقات PECS وأنشطة مطابقة الصور التفاعلية
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  PECS & Matching Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                المريض: <strong className="text-slate-200">{patientName}</strong> &bull; أنشطة التواصل البديل والمعزز والمطابقة المعرفية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 p-2.5 bg-slate-950/50 border-b border-slate-800 shrink-0 overflow-x-auto">
          <button
            type="button"
            data-testid="pecs-cards-activity-btn"
            onClick={() => setActiveTab('pecs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'pecs'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🎴 بطاقات PECS والتواصل البصري</span>
          </button>

          <button
            type="button"
            data-testid="matching-activity-btn"
            onClick={() => setActiveTab('matching')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'matching'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🧩 نشاط مطابقة الصور والتصنيف الدلالي</span>
          </button>
        </div>

        {/* TAB 1: PECS COMMUNICATION STUDIO */}
        {activeTab === 'pecs' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Sentence Strip Container */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>شريط الجملة التواصلي (PECS Sentence Strip - Phase IV):</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {exchangeCount} تبادلات ناجحة ⭐
                </span>
              </div>

              {/* Live Sentence Strip Display */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex-wrap">
                {/* Prefix Selector */}
                <select
                  value={sentencePrefix}
                  onChange={(e) => setSentencePrefix(e.target.value)}
                  className="bg-purple-950/60 border border-purple-500/40 text-purple-200 font-black text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-400"
                >
                  <option value="أنا أريد">أنا أريد (Je veux)</option>
                  <option value="أنا أرى">أنا أرى (Je vois)</option>
                  <option value="أنا أسمع">أنا أسمع (J'entends)</option>
                  <option value="أعطني">أعطني (Donne-moi)</option>
                </select>

                <span className="text-xl text-slate-600">+</span>

                {/* Selected Card Badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-950 border border-purple-500/50 shadow-md">
                  <span className="text-3xl">{selectedPecsCard.symbol}</span>
                  <div>
                    <span className="block text-sm font-black text-white">{selectedPecsCard.titleAr}</span>
                    <span className="block text-[10px] text-purple-400 font-mono">{selectedPecsCard.titleFr}</span>
                  </div>
                </div>

                {/* Exchange Action Button */}
                <button
                  type="button"
                  onClick={handleCompletePecsExchange}
                  className="mr-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد تبادل البطاقة وإرسال التعزيز 🌟</span>
                </button>
              </div>
            </div>

            {/* Available PECS Cards Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">
                اختر بطاقة التواصل الهدف (PECS Flashcards):
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PECS_CARDS_CATALOG.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedPecsCard(card)}
                    className={`p-3.5 rounded-2xl border text-center space-y-1.5 transition-all ${
                      selectedPecsCard.id === card.id
                        ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-500/20 scale-105'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="text-4xl py-1">{card.symbol}</div>
                    <div className="text-xs font-black text-white">{card.titleAr}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{card.titleFr}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Launch to Whiteboard CTA */}
            {onLaunchToWhiteboard && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-bold text-indigo-300 block">عرض البطاقات على السبورة التفاعلية:</span>
                  <span className="text-[11px] text-slate-400">يمكن للطفل والمعالج الرسم والإشارة المشتركة بالقلم التفاعلي.</span>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchToWhiteboard('naming_fruits')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
                >
                  نقل للسبورة التفاعلية 🖼️
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: IMAGE MATCHING ACTIVITY */}
        {activeTab === 'matching' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Score Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-teal-500/30 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-teal-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-teal-400" />
                  <span>نشاط مطابقة الصور والتصنيف البصري:</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  انقر على الصورة من العمود الأيمن ثم انقر على البطاقة المطابقة لها في العمود الأيسر.
                </p>
              </div>

              <div className="text-center px-4 py-1.5 rounded-xl bg-teal-950/60 border border-teal-500/40">
                <div className="text-xs text-slate-400 font-medium">النقاط</div>
                <div className="text-lg font-black font-mono text-teal-300">{matchingScore} pts</div>
              </div>
            </div>

            {/* Interactive Matching Board */}
            <div className="grid grid-cols-2 gap-4">
              {/* Column 1: Source Cards */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-400 block px-1">1. بطاقات العرض:</span>
                {MATCHING_PAIRS_CATALOG.map((item) => {
                  const isMatched = matchedPairs.includes(item.id);
                  const isSelected = selectedLeft?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isMatched}
                      onClick={() => handleSelectLeftMatching(item)}
                      className={`w-full p-3 rounded-2xl border text-right flex items-center justify-between transition-all ${
                        isMatched
                          ? 'bg-emerald-950/20 border-emerald-500/30 opacity-60'
                          : isSelected
                          ? 'bg-teal-950/50 border-teal-400 scale-102 shadow-lg shadow-teal-500/20'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{item.leftSymbol}</span>
                        <span className="text-xs font-bold text-white">{item.leftLabel}</span>
                      </div>
                      {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Column 2: Target Matching Cards */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-400 block px-1">2. بطاقات المطابقة:</span>
                {MATCHING_PAIRS_CATALOG.slice().reverse().map((item) => {
                  const isMatched = matchedPairs.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isMatched}
                      onClick={() => handleSelectRightMatching(item)}
                      className={`w-full p-3 rounded-2xl border text-right flex items-center justify-between transition-all ${
                        isMatched
                          ? 'bg-emerald-950/20 border-emerald-500/30 opacity-60'
                          : 'bg-slate-950 border-slate-800 hover:border-teal-500/60 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{item.rightSymbol}</span>
                        <span className="text-xs font-bold text-white">{item.rightLabel}</span>
                      </div>
                      {isMatched ? (
                        <span className="text-[10px] text-emerald-400 font-bold font-mono">مطابق ✓</span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">مطابقة</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleInjectToSoap}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-md flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>حقن نتائج نشاط PECS والمطابقة في تقرير SOAP</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}
