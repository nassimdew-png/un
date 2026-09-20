import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, Send, Bot, User, Sparkles, CheckCircle2, 
  ExternalLink, Settings, Phone, Clock, AlertTriangle, ShieldCheck,
  Copy, Check, ArrowRight, RefreshCw, Zap
} from 'lucide-react';
import { clinicAiReceptionistApi } from '../../api';

export default function ClinicAiReceptionistModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'settings'
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulated Chat Messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'patient',
      text: 'السلام عليكم، ابني عمره 4 سنوات ونصف وعنده تأخر في نطق الكلمات وصعوبة في التواصل، هل عندكم جلسات أرطوفونيا؟ وما هو السعر؟',
      time: '14:20',
    },
    {
      id: 2,
      sender: 'bot',
      text: 'وعليكم السلام ورحمة الله وبركاته 🏥✨\nنشكر تواصلكم وثقتكم بنا.\n\nبناءً على رسالتكم، يفيدكم نظام الفرز الذكي بأن التخصص الأنسب لحالة ابنكم الكريم هو:\n📌 الأرطوفونيا وعلاج اضطرابات النطق والكلام (Orthophonie)\n\n💡 التوصية السريرية المبدئية:\nإجراء فحص فونولوجي وحصيلة لغوية أولية مع الأخصائي الأرطوفوني لتحديد خطة التدخل المناسبة.\n\n🗓️ لحجز موعدكم، يمكنكم إما الرد بتأكيد الموعد المفضل أو ملء استمارة الفرز الرقمي السريع قبل القدوم.',
      triage: {
        specialty: 'الأرطوفونيا وعلاج اضطرابات النطق والكلام (Orthophonie)',
        urgency: 'routine',
        recommendation: 'فحص فونولوجي وحصيلة لغوية أولية',
      },
      time: '14:21',
      quickReplies: ['حجز حصيلة لغوية أولية', 'تعبئة استمارة التطور اللغوي للطفل', 'أوقات دوام عيادة التخاطب'],
    }
  ]);

  // Form State for Settings
  const [formPhone, setFormPhone] = useState('');
  const [formAutoReply, setFormAutoReply] = useState(true);

  // Load Settings
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    clinicAiReceptionistApi.getSettings()
      .then(res => {
        if (res && res.success) {
          setSettings(res.settings);
          setFormPhone(res.settings.whatsapp_phone || '');
          setFormAutoReply(res.settings.auto_reply_enabled);
        }
      })
      .catch(err => console.error('Failed to load receptionist settings:', err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  // Preset Questions
  const presetPrompts = [
    'عندي طفل يعاني من فرط حركة وتشتت انتباه وصعوبة في الجلوس',
    'أعاني من نوبات هلع وقلق مستمر وضيق في التنفس وأريد استشارة نفسية',
    'ما هي أوقات العمل في العيادة وعنوان المقر بالتفصيل؟',
    'أريد معرفة أسعار الجلسات وإمكانية المتابعة عن بعد'
  ];

  const handleSendMessage = async (customText = null) => {
    const text = customText || inputMessage;
    if (!text.trim() || isSimulating) return;

    const patientMsg = {
      id: Date.now(),
      sender: 'patient',
      text: text.trim(),
      time: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };

    setMessages(prev => [...prev, patientMsg]);
    setInputMessage('');
    setIsSimulating(true);

    try {
      const res = await clinicAiReceptionistApi.simulateMessage(text.trim());
      if (res && res.success) {
        const botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: res.response_text,
          triage: res.triage,
          whatsappUrl: res.whatsapp_url,
          quickReplies: res.quick_replies || [],
          time: res.timestamp || new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', hour12: false }),
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'مرحباً بكم. نعتذر عن هذا التأخير الطفيف، سنقوم بالرد عليكم فوراً وتزويدكم بالموعد الأنسب.',
        time: 'الآن',
      }]);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await clinicAiReceptionistApi.updateSettings({
        whatsapp_phone: formPhone,
        whatsapp_auto_reply_enabled: formAutoReply,
      });
      if (res && res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  موظف الاستقبال الذكي والفرز الآلي عبر WhatsApp
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                  AI Triage v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                استقبال استفسارات المرضى، التوجيه للتخصص السريري الدقيق، وحجز المواعيد تلقائياً 24/7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex p-1 rounded-xl bg-slate-950/60 border border-slate-800">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'chat' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                محاكي WhatsApp
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'settings' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                الإعدادات والربط
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          
          {activeTab === 'chat' ? (
            <div className="grid grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Preset Questions & Clinical Explanations (5 Cols) */}
              <div className="col-span-12 lg:col-span-5 space-y-4">
                {/* Clinical Triage Explanation Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/20 text-slate-300">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    كيف يعمل الفرز السريري الذكي؟
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    يقوم المساعد بتحليل كلمات المريض أو ولي الأمر باللغة العربية أو الدارجة الجزائرية وتحديد ما إذا كانت الحالة تخص الأرطوفونيا، التأهيل الحركي، أو العلاج النفسي، مع رصد تنبيهات الأمان الفورية.
                  </p>
                </div>

                {/* Preset Chips */}
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    جرّب رسائل واستفسارات جاهزة للمحاكاة:
                  </div>
                  <div className="space-y-2">
                    {presetPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="w-full text-right p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 font-medium transition-all group flex items-center justify-between"
                      >
                        <span className="truncate">{prompt}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-[-2px] transition-all shrink-0 mr-2" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clinic Working Hours & Phone Info Card */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      رقم واتساب العيادة المربوط:
                    </span>
                    <span className="font-mono font-bold text-white">{formPhone || '0555 00 00 00'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      ساعات الاستقبال:
                    </span>
                    <span className="text-slate-300">السبت - الخميس (08:30 - 17:00)</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Smartphone Frame WhatsApp Chat (7 Cols) */}
              <div className="col-span-12 lg:col-span-7 flex justify-center">
                <div className="w-full max-w-[420px] rounded-[38px] border-4 border-slate-800 bg-[#0b141a] shadow-2xl overflow-hidden flex flex-col h-[540px] relative">
                  
                  {/* WhatsApp Top Header Bar */}
                  <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between text-white border-b border-slate-700/60 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        🏥
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1">
                          {settings?.clinic_name || 'العيادة التخصصية'}
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          متصل الآن (Online)
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      WhatsApp Business
                    </div>
                  </div>

                  {/* Chat Messages Body */}
                  <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                    {messages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'patient' ? 'items-start' : 'items-end'}`}
                      >
                        <div className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                          msg.sender === 'patient'
                            ? 'bg-[#202c33] text-slate-200 rounded-tr-none border border-slate-700/40'
                            : 'bg-[#005c4b] text-white rounded-tl-none border border-emerald-600/30'
                        }`}>
                          {/* Clinical Triage Chip for bot */}
                          {msg.triage && (
                            <div className="mb-2 pb-2 border-b border-white/10 flex flex-wrap gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-black/20 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                {msg.triage.specialty}
                              </span>
                              {msg.triage.urgency === 'urgent' && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-500/40 text-rose-200 font-bold text-[10px]">
                                  🚨 فوري
                                </span>
                              )}
                            </div>
                          )}

                          <p className="whitespace-pre-line">{msg.text}</p>
                          
                          <div className="mt-1 text-[9px] text-white/50 text-left font-mono">
                            {msg.time}
                          </div>
                        </div>

                        {/* Quick Replies chips */}
                        {msg.quickReplies && msg.quickReplies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5 justify-end">
                            {msg.quickReplies.map((qr, qidx) => (
                              <button
                                key={qidx}
                                onClick={() => handleSendMessage(qr)}
                                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-[10px] text-emerald-300 border border-slate-700 font-medium transition-colors"
                              >
                                {qr}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {isSimulating && (
                      <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span className="text-[10px]">العيادة تكتب الآن...</span>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Input Bar */}
                  <div className="p-2.5 bg-[#1f2c34] border-t border-slate-700/60 flex items-center gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="اكتب استفسار المريض هنا..."
                      className="flex-1 px-3.5 py-2 rounded-2xl bg-[#2a3942] border border-transparent focus:border-emerald-500 text-white placeholder-slate-400 text-xs focus:outline-none"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim() || isSimulating}
                      className="p-2 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-slate-950 transition-colors shadow-md"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Settings Tab */
            <div className="max-w-2xl mx-auto space-y-6">
              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* Phone Configuration */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    رقم هاتف WhatsApp المخصص للعيادة
                  </h3>
                  <p className="text-xs text-slate-400">
                    الرقم الذي يتواصل من خلاله المرضى. يُستخدم لتوليد روابط التواصل المباشر ورسائل الفرز التلقائي.
                  </p>
                  <div>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="مثال: 0550123456 أو 213550123456"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-white">تفعيل الرد والفرز الآلي</div>
                      <div className="text-[11px] text-slate-400">توجيه المرضى للتخصص وحجز المواعيد تلقائياً</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formAutoReply}
                        onChange={(e) => setFormAutoReply(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>
                </div>

                {/* Pre-Intake Public Link Generator */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-teal-400" />
                    رابط استمارة الفرز المسبق الرقمي (Pre-Intake)
                  </h3>
                  <p className="text-xs text-slate-400">
                    شارك هذا الرابط مع المرضى الجدد عبر WhatsApp لتجهيز ملفهم وتعبئة بيانات السوابق المرضية قبل الحضور.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`https://${settings?.clinic_slug || 'clinic'}.psypro.tech/pre-intake/new`}
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`https://${settings?.clinic_slug || 'clinic'}.psypro.tech/pre-intake/new`)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'تم النسخ' : 'نسخ الرابط'}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4" />
                      تم حفظ التعديلات بنجاح!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    {savingSettings ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
