import React, { useState, useEffect } from 'react';
import {
  Headphones,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Send,
  User,
  Building,
  Tag,
  CornerDownLeft,
  X
} from 'lucide-react';
import { apiRequest } from '../../api';

export default function SupportTicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/super-admin/support-tickets');
      if (res.success) {
        setTickets(res.tickets || res.data || []);
      }
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const res = await apiRequest(`/super-admin/support-tickets/${ticketId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
        );
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus });
        }
        setFeedback({ type: 'success', text: 'تم تحديث حالة التذكرة بنجاح.' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'فشل تغيير حالة التذكرة.' });
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;
    setSendingReply(true);
    try {
      const res = await apiRequest(`/super-admin/support-tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: replyMessage }),
      });
      if (res.success) {
        const newMsg = {
          id: Date.now(),
          sender_name: 'إدارة المنصة (Super Admin)',
          is_admin: true,
          message: replyMessage,
          created_at: new Date().toISOString(),
        };
        const updated = {
          ...selectedTicket,
          messages: [...(selectedTicket.messages || []), newMsg],
          status: 'replied',
        };
        setSelectedTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
        setReplyMessage('');
        setFeedback({ type: 'success', text: 'تم إرسال الرد للعيادة بنجاح.' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'فشل إرسال الرد.' });
    } finally {
      setSendingReply(false);
    }
  };

  const filteredTickets = tickets.filter(
    (t) =>
      (t.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.clinic_name || t.tenant_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.user_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* 1. Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white font-black shadow-lg shadow-rose-500/25">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">مركز الدعم الفني وتذاكر المساعدة (Helpdesk & Support)</h2>
            <p className="text-xs text-slate-400">متابعة استفسارات ومشاكل أصحاب العيادات، الرد المباشر، وتحديث حالات التذاكر</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchTickets}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-2 space-x-reverse text-xs font-bold self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث التذاكر</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 space-x-reverse ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="font-bold">{feedback.text}</span>
        </div>
      )}

      {/* 2. Search & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="بحث بالموضوع، العيادة، أو اسم المرسل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
          />
          <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3" />
        </div>

        <div className="flex items-center space-x-4 space-x-reverse text-xs text-slate-400">
          <span>إجمالي التذاكر: <strong className="text-white font-mono">{tickets.length}</strong></span>
          <span>تذاكر مفتوحة: <strong className="text-amber-400 font-mono">{tickets.filter(t => t.status === 'open' || t.status === 'pending').length}</strong></span>
          <span>تم الحل: <strong className="text-emerald-400 font-mono">{tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}</strong></span>
        </div>
      </div>

      {/* 3. Tickets Grid & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-500" />
              جاري تحميل التذاكر...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center text-xs text-slate-500">
              لا توجد تذاكر مسجلة حالياً.
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 rounded-2xl border cursor-pointer transition text-right ${
                    isSelected
                      ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ticket.status === 'open' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      ticket.status === 'replied' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {ticket.status === 'open' ? 'جديدة' : ticket.status === 'replied' ? 'تم الرد' : 'مغلقة'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('ar-DZ') : ''}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">{ticket.subject || 'تذكرة دعم'}</h4>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 space-x-reverse">
                    <Building className="w-3 h-3 text-slate-500" />
                    <span>{ticket.clinic_name || ticket.tenant_name || 'عيادة'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Ticket Conversation & Actions */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-white">{selectedTicket.subject}</h3>
                  <div className="text-xs text-slate-400 flex items-center space-x-3 space-x-reverse mt-1">
                    <span>المرسل: <strong className="text-slate-200">{selectedTicket.user_name || 'طبيب/مسؤول'}</strong></span>
                    <span>•</span>
                    <span>العيادة: <strong className="text-rose-400">{selectedTicket.clinic_name || 'عيادة'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  {selectedTicket.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center space-x-1 space-x-reverse"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>إغلاق كـ محلولة</span>
                    </button>
                  )}
                  {selectedTicket.status === 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'open')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                    >
                      إعادة الفتح
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Flow */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {/* Initial Description */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mb-1">
                    <span>{selectedTicket.user_name || 'العيادة'}</span>
                    <span className="font-mono text-[10px]">{selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString('ar-DZ') : ''}</span>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.description || selectedTicket.message || 'لا يوجد وصف إضافي.'}
                  </p>
                </div>

                {/* Replies */}
                {(selectedTicket.messages || []).map((msg, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl text-xs space-y-1 ${
                      msg.is_admin
                        ? 'bg-rose-950/30 border border-rose-500/30 mr-4'
                        : 'bg-slate-950 border border-slate-800 ml-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                      <span className={msg.is_admin ? 'text-rose-300' : 'text-slate-300'}>
                        {msg.sender_name || (msg.is_admin ? 'الدعم الفني للمنصة' : 'العيادة')}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                <textarea
                  rows="3"
                  required
                  placeholder="اكتب رد الدعم الفني المباشر للعيادة هنا..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none transition"
                />
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black flex items-center space-x-2 space-x-reverse shadow-lg shadow-rose-600/30 disabled:opacity-50 transition"
                  >
                    <Send className={`w-3.5 h-3.5 ${sendingReply ? 'animate-spin' : ''}`} />
                    <span>{sendingReply ? 'جاري الإرسال...' : 'إرسال الرد للعيادة'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-500 h-full flex flex-col items-center justify-center">
              <MessageSquare className="w-10 h-10 text-slate-700 mb-3" />
              <p>اختر تذكرة من القائمة الجانبية لمعاينة المحادثة والرد عليها.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
