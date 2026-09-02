import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Video,
  Radio,
  Activity,
  Palette,
  Mic,
  PieChart,
  FileText,
  Bot,
  Zap,
  Check,
  Edit2
} from 'lucide-react';
import { featureFlagsApi } from '../../api';

export default function FeatureFlagsManagerView() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Edit Message Modal / State
  const [editingFlag, setEditingFlag] = useState(null);
  const [customMsg, setCustomMsg] = useState('');

  const loadFlags = async () => {
    setLoading(true);
    try {
      const res = await featureFlagsApi.getAdminFlags();
      if (res.success && res.flags) {
        setFlags(res.flags);
      }
    } catch (err) {
      console.error('Failed to load feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (flag) => {
    setUpdatingKey(flag.feature_key);
    try {
      const res = await featureFlagsApi.toggleFlag({
        feature_key: flag.feature_key,
        is_enabled: !flag.is_enabled,
        maintenance_message: flag.maintenance_message,
      });

      if (res.success) {
        setFlags((prev) =>
          prev.map((f) => (f.feature_key === flag.feature_key ? res.flag : f))
        );
        setFeedback({
          type: 'success',
          text: res.message,
        });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'فشل تحديث حالة الميزة.',
      });
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleSaveMessage = async () => {
    if (!editingFlag) return;
    try {
      const res = await featureFlagsApi.toggleFlag({
        feature_key: editingFlag.feature_key,
        is_enabled: editingFlag.is_enabled,
        maintenance_message: customMsg,
      });

      if (res.success) {
        setFlags((prev) =>
          prev.map((f) => (f.feature_key === editingFlag.feature_key ? res.flag : f))
        );
        setEditingFlag(null);
        setFeedback({ type: 'success', text: 'تم تحديث رسالة الصيانة للميزة بنجاح.' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الرسالة.' });
    }
  };

  const getFeatureIcon = (key) => {
    switch (key) {
      case 'video_studio': return <Video className="w-5 h-5 text-cyan-400" />;
      case 'podcast_studio': return <Radio className="w-5 h-5 text-rose-400" />;
      case 'fluency_analyzer': return <Activity className="w-5 h-5 text-teal-400" />;
      case 'image_studio': return <Palette className="w-5 h-5 text-pink-400" />;
      case 'speech_transcribe': return <Mic className="w-5 h-5 text-amber-400" />;
      case 'live_audio_studio': return <Zap className="w-5 h-5 text-indigo-400" />;
      case 'data_analyst': return <PieChart className="w-5 h-5 text-purple-400" />;
      case 'document_processor': return <FileText className="w-5 h-5 text-emerald-400" />;
      case 'ai_support_bot': return <Bot className="w-5 h-5 text-blue-400" />;
      default: return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/25">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">لوحة مفاتيح تشغيل وإيقاف الميزات (Feature Master Switches)</h2>
            <p className="text-xs text-slate-400">التحكم الفوري في تفعيل وتعطيل الميزات عبر المنصة وحجب الوصول مع رسائل مخصصة</p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadFlags}
          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-2 space-x-reverse text-xs font-bold self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث الحالات</span>
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

      {/* 2. Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flags.map((flag) => {
          const isEnabled = flag.is_enabled;
          const isUpdating = updatingKey === flag.feature_key;

          return (
            <div
              key={flag.id}
              className={`p-5 rounded-3xl border transition-all space-y-4 flex flex-col justify-between ${
                isEnabled
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'
                  : 'bg-slate-950/80 border-slate-900 opacity-75 shadow-inner'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                      {getFeatureIcon(flag.feature_key)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{flag.feature_name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{flag.feature_key}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(flag)}
                    disabled={isUpdating}
                    className="p-1 rounded-xl hover:scale-105 active:scale-95 transition disabled:opacity-50"
                  >
                    {isEnabled ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-600" />
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold">رسالة التعطيل للمستخدمين:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFlag(flag);
                        setCustomMsg(flag.maintenance_message || '');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 text-[10px] flex items-center space-x-1 space-x-reverse font-bold"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>تعديل</span>
                    </button>
                  </div>
                  <p className="line-clamp-2 text-slate-300">
                    {flag.maintenance_message || 'هذه الميزة قيد التحديث والصيانة مؤقتاً.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className={`px-2 py-0.5 rounded-full font-bold border ${
                  isEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {isEnabled ? '🟢 الميزة مفعلة للعملاء' : '🔴 الميزة محجوبة مؤقتاً'}
                </span>
                <span className="text-slate-500 font-mono">
                  {flag.updated_at ? new Date(flag.updated_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Message Modal */}
      {editingFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in">
            <h3 className="text-sm font-black text-white">
              تعديل رسالة الصيانة لـ ({editingFlag.feature_name})
            </h3>
            <textarea
              rows={3}
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="اكتب رسالة تظهر للمستخدم عند محاولة فتح الميزة المعطلة..."
            />
            <div className="flex items-center justify-end space-x-2 space-x-reverse">
              <button
                type="button"
                onClick={() => setEditingFlag(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveMessage}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                حفظ الرسالة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
