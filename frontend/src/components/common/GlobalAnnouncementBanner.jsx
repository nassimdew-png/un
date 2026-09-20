import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  ShieldAlert,
  Wrench,
  Sparkles,
  X,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { clinicApi } from '../../api';

export default function GlobalAnnouncementBanner() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    const fetchBroadcasts = async () => {
      try {
        const res = await clinicApi.getActiveBroadcasts();
        if (res.success && Array.isArray(res.broadcasts)) {
          const dismissed = JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
          const unDismissed = res.broadcasts.filter(b => !dismissed.includes(b.id));

          // Check for modal-type announcement
          const modalItem = unDismissed.find(b => b.display_mode === 'modal');
          if (modalItem) {
            setActiveModal(modalItem);
          }

          setBroadcasts(unDismissed.filter(b => b.display_mode === 'banner'));
        }
      } catch (err) {
        // Silent catch: network blip shouldn't break UI
      }
    };

    fetchBroadcasts();
  }, []);

  const handleDismiss = (id) => {
    const dismissed = JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
    dismissed.push(id);
    localStorage.setItem('dismissed_broadcasts', JSON.stringify(dismissed));
    setBroadcasts(prev => prev.filter(b => b.id !== id));
    if (activeModal && activeModal.id === id) {
      setActiveModal(null);
    }
  };

  if (broadcasts.length === 0 && !activeModal) return null;

  return (
    <aside aria-label="System announcements" className="w-full">
      {/* 1. Sleek Top Banner for active broadcasts */}
      {broadcasts.map((b) => (
        <div
          key={b.id}
          className={`px-4 py-2.5 text-xs flex items-center justify-between gap-3 shadow-md border-b transition-all ${
            b.type === 'emergency' ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 border-rose-500/40 text-rose-100' :
            b.type === 'maintenance' ? 'bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 border-amber-500/40 text-amber-100' :
            b.type === 'feature' ? 'bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 border-purple-500/40 text-purple-100' :
            'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/30 text-slate-100'
          }`}
          dir="rtl"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {b.type === 'emergency' && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />}
            {b.type === 'maintenance' && <Wrench className="w-4 h-4 text-amber-400 shrink-0" />}
            {b.type === 'feature' && <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />}
            {b.type === 'info' && <Megaphone className="w-4 h-4 text-indigo-400 shrink-0" />}

            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold">{b.title}:</span>
              <span className="opacity-90">{b.message}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {b.action_label && (
              <a
                href={b.action_url || '#'}
                className="px-3 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] transition flex items-center gap-1"
              >
                <span>{b.action_label}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </a>
            )}

            {b.dismissible && (
              <button
                type="button"
                onClick={() => handleDismiss(b.id)}
                className="p-1 rounded-lg text-white/60 hover:text-white transition"
                title="إغلاق التنبيه"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* 2. Priority Modal Announcement */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-center text-right animate-in fade-in zoom-in-95" dir="rtl">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Megaphone className="w-6 h-6" />
            </div>

            <h3 className="font-black text-white text-base">
              {activeModal.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeModal.message}
            </p>

            <div className="pt-3 flex items-center justify-center gap-2">
              {activeModal.action_label && (
                <a
                  href={activeModal.action_url || '#'}
                  onClick={() => handleDismiss(activeModal.id)}
                  className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  {activeModal.action_label}
                </a>
              )}
              <button
                type="button"
                onClick={() => handleDismiss(activeModal.id)}
                className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                إغلاق ومتابعة
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
