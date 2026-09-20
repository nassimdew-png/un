import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Volume2,
  CheckCircle2,
  Brain,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import SpeechArticulationMatrixModal from '../orthophony/SpeechArticulationMatrixModal';

export default function PublicSpeechMatrixView() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Top Banner Navigation */}
      <header className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى الصفحة الرئيسية</span>
          </Link>
          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>مصفوفة تصحيح مخارج الحروف الفونولوجية</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  PRO SUITE
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                أداة الفحص العضوي الوظيفي وشجرة مخارج الحروف العربية والفرنسية
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
            >
              إعادة فتح المصفوفة 🗣️
            </button>
          )}
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>تجربة المنصة مجاناً</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {!isOpen ? (
          <div className="max-w-md text-center p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Volume2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-white">
              مصفوفة تصحيح مخارج الحروف الفونولوجية
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              تم إغلاق نافذة المعاينة. يمكنك إعادة فتحها في أي وقت أو الانتقال للصفحة الرئيسية.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                فتح المصفوفة التفاعلية 🗣️
              </button>
              <Link
                to="/"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                الصفحة الرئيسية
              </Link>
            </div>
          </div>
        ) : null}
      </main>

      {/* Full Modal */}
      <SpeechArticulationMatrixModal
        isOpen={isOpen}
        onClose={handleClose}
      />
    </div>
  );
}
