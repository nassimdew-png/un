import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  Minimize2,
  Maximize2,
  BookOpen,
  Info,
  Check
} from 'lucide-react';
import { supportApi } from '../../api';

export default function AiSupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize or load Session ID
  useEffect(() => {
    let sid = localStorage.getItem('psypro_support_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('psypro_support_session_id', sid);
    }
    setSessionId(sid);

    // Initial greeting message
    setMessages([
      {
        role: 'assistant',
        text: 'مرحباً بك! 👋 أنا مساعد الدعم الفني والسريري الذكي لمنصة **PsyPro**.\n\nكيف يمكنني مساعدتك اليوم في إدارة عيادتك أو استخدام استوديوهات الذكاء الاصطناعي السريرية؟',
        sources: [
          { title: 'دليل المنصة الشامل', url: 'https://psypro.tech' }
        ],
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const quickPrompts = [
    '✨ كيف أصيغ حصيلة سريرية (Bilan)؟',
    '🎯 كيف أربط أهداف PEP بالملف؟',
    '🖨️ كيف أطبع التقرير بترويسة العيادة؟',
    '📲 كيف أرسل تذكيراً للولي عبر WhatsApp؟',
    '🧠 كيف يعمل مفسر WISC-V والمخطط؟'
  ];

  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isSending) return;

    const userMsg = {
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsSending(true);

    try {
      const res = await supportApi.ask({
        question: textToSend,
        session_id: sessionId,
      });

      if (res.answer) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: res.answer,
            sources: res.sources || [],
            timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error('Support chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'عذراً، حدث خطأ أثناء معالجة استفسارك. يرجى التحقق من اتصالك بالإنترنت أو إعادة المحاولة.',
          sources: [],
          timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    const sid = 'sess_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('psypro_support_session_id', sid);
    setSessionId(sid);
    setMessages([
      {
        role: 'assistant',
        text: 'تم بدء جلسة محادثة جديدة. كيف يمكنني مساعدتك؟ ✨',
        sources: [],
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const renderFormattedText = (text) => {
    return text.split('\n').map((line, lineIdx) => {
      // Bold handling: **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={lineIdx} className={line.trim() === '' ? 'h-2' : 'min-h-[1.2rem]'}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-black text-white">{part.slice(2, -2)}</strong>;
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 font-sans" dir="rtl">
      
      {/* 1. Floating Launch Bubble */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center p-4 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-600 text-white shadow-2xl shadow-purple-500/40 hover:scale-110 transition-all duration-300 ring-4 ring-purple-500/20"
          title="المساعد الذكي للدعم الفني (RAG AI Support)"
        >
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
          <span className="hidden group-hover:flex absolute right-16 px-3 py-1.5 rounded-xl bg-slate-950/90 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-slate-800 backdrop-blur-md">
            💬 استفسر من المساعد الذكي
          </span>
        </button>
      )}

      {/* 2. Chat Window Container */}
      {isOpen && (
        <div className={`w-[92vw] sm:w-[400px] bg-slate-950 border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 backdrop-blur-xl ${
          isMinimized ? 'h-16' : 'h-[580px] max-h-[85vh]'
        }`}>
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-purple-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
                  🤖
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-950" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center space-x-1.5 space-x-reverse">
                  <span>مساعد PsyPro الذكي</span>
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded-full font-mono">
                    RAG AI
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">إجابات موثوقة من قاعدة المعرفة</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 space-x-reverse">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition"
                title="محادثة جديدة"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition"
                title={isMinimized ? "تكبير" : "تصغير"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 text-xs transition"
                title="إغلاق"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body: Messages Scroll Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} space-y-1.5`}
                    >
                      <div className="flex items-center space-x-1.5 space-x-reverse text-[10px] text-slate-500">
                        {isUser ? <User className="w-3 h-3 text-purple-400" /> : <Bot className="w-3 h-3 text-emerald-400" />}
                        <span>{isUser ? 'أنت' : 'المساعد الذكي'}</span>
                        <span>•</span>
                        <span className="font-mono">{msg.timestamp}</span>
                      </div>

                      <div className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                        isUser
                          ? 'bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-600/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                      }`}>
                        {renderFormattedText(msg.text)}

                        {/* Source Badges */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center flex-wrap gap-1 text-[10px]">
                            <span className="text-slate-400 font-bold flex items-center space-x-1 space-x-reverse">
                              <BookOpen className="w-2.5 h-2.5 text-purple-400" />
                              <span>المصادر المعتمدة:</span>
                            </span>
                            {msg.sources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 rounded-md bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 flex items-center space-x-1 space-x-reverse transition"
                              >
                                <span>{src.title}</span>
                                <ExternalLink className="w-2 h-2 ml-0.5" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isSending && (
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center space-x-1.5 space-x-reverse text-[10px] text-slate-500">
                      <Bot className="w-3 h-3 text-emerald-400" />
                      <span>المساعد الذكي يبحث في قاعدة المعرفة...</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center space-x-1.5 space-x-reverse">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Quick Questions */}
              {messages.length <= 2 && (
                <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                  {quickPrompts.map((q, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => handleSendMessage(q)}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-purple-900/40 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 transition whitespace-nowrap shrink-0 text-right"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Bar */}
              <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center space-x-2 space-x-reverse">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="اطرح استفسارك هنا..."
                  className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                  disabled={isSending}
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isSending}
                  className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition disabled:opacity-40 shrink-0 shadow-md shadow-purple-600/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
}
