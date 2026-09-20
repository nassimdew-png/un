import React, { useState, useEffect, useMemo } from 'react';
import {
  Video,
  VideoOff,
  PhoneCall,
  PhoneOff,
  Shield,
  ShieldCheck,
  Wifi,
  Server,
  Activity,
  Users,
  Clock,
  Settings,
  Sliders,
  Play,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Layers,
  Monitor,
  Sparkles,
  Lock,
  Eye,
  Radio,
  Globe,
  Search,
  Building2,
  FileText,
  Palette,
  X
} from 'lucide-react';
import { superAdminApi } from '../../api';

export default function TeletherapyManagerTab() {
  const [subTab, setSubTab] = useState('active_rooms'); // 'active_rooms' | 'history' | 'settings'
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Overview Data
  const [kpis, setKpis] = useState({
    total_rooms: 0,
    active_rooms: 0,
    completed_rooms: 0,
    total_minutes: 0,
    total_hours: 0,
    participating_clinics: 0,
  });
  const [liveRooms, setLiveRooms] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  // All Rooms Query (History)
  const [historyRooms, setHistoryRooms] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Settings State
  const [settings, setSettings] = useState({
    enabled: true,
    webrtc_provider: 'p2p_mesh',
    stun_server_primary: 'stun:stun.l.google.com:19302',
    stun_server_secondary: 'stun:global.stun.twilio.com:3478',
    turn_server: '',
    turn_username: '',
    turn_credential: '',
    max_session_minutes: 60,
    allow_canvas: true,
    allow_tests_passation: true,
    allow_screen_share: true,
    allow_cbt_protocols: true,
    allow_recording: false,
    eco_bandwidth_mode: true,
    allowed_plans: ['starter', 'pro', 'enterprise', 'clinic_unlimited'],
  });

  // Action states
  const [actionLoading, setActionLoading] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getTeletherapyOverview();
      if (res && res.success) {
        setKpis(res.kpis || {});
        setLiveRooms(res.live_rooms || []);
        setRecentSessions(res.recent_sessions || []);
        if (res.settings) {
          setSettings(res.settings);
        }
      }
    } catch (err) {
      console.error('Failed to load teletherapy overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryRooms = async () => {
    setHistoryLoading(true);
    try {
      const res = await superAdminApi.getTeletherapyRooms({
        search: searchTerm,
        specialty: specialtyFilter,
        status: statusFilter,
        per_page: 50,
      });
      if (res && res.success) {
        setHistoryRooms(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load teletherapy history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (subTab === 'history') {
      fetchHistoryRooms();
    }
  }, [subTab, searchTerm, specialtyFilter, statusFilter]);

  const handleCopyLink = (roomCode, accessPin) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://psypro.tech';
    const link = `${origin}/portal/teletherapy/${roomCode}${accessPin ? `?pin=${accessPin}` : ''}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(roomCode);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleTerminateRoom = async (roomCode) => {
    if (!window.confirm(`هل أنت متأكد من إنهاء جلسة التطبيب عن بعد [${roomCode}] إجبارياً؟ سيتم قطع الاتصال وحفظ الملاحظات.`)) {
      return;
    }
    setActionLoading(roomCode);
    try {
      await superAdminApi.terminateTeletherapyRoom(roomCode);
      setStatusMessage({ type: 'success', text: `تم إنهاء الغرفة [${roomCode}] بنجاح.` });
      fetchOverview();
      if (subTab === 'history') fetchHistoryRooms();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'تعذر إنهاء الغرفة' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleDeleteRoom = async (roomCode) => {
    if (!window.confirm(`هل تريد حذف سجل جلسة التطبيب عن بعد [${roomCode}] نهائياً من قاعدة البيانات؟`)) {
      return;
    }
    setActionLoading(roomCode);
    try {
      await superAdminApi.deleteTeletherapyRoom(roomCode);
      setStatusMessage({ type: 'success', text: `تم حذف سجل الغرفة [${roomCode}] بنجاح.` });
      fetchOverview();
      if (subTab === 'history') fetchHistoryRooms();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'تعذر حذف سجل الغرفة' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      await superAdminApi.updateTeletherapySettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('فشل حفظ الإعدادات: ' + (err.message || 'خطأ في الاتصال بالخادم'));
    } finally {
      setSavingSettings(false);
    }
  };

  const formatSeconds = (sec) => {
    if (!sec) return '0 د';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} ث`;
    return `${m} د ${s > 0 ? `${s} ث` : ''}`;
  };

  const getSpecialtyLabel = (spec) => {
    const map = {
      orthophony: '🗣️ أرطوفونيا وتخاطب',
      psychology: '🧠 علم النفس العيادي',
      psychomotricity: '🏃 التأهيل النفسي-حركي',
      pediatrie: '👶 طب الأطفال والنمو',
    };
    return map[spec] || spec || 'عيادة عامة';
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Alert / Notification banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition-all shadow-lg ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-950 border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 shadow-sm">
                <Video className="w-3.5 h-3.5 text-purple-400" />
                <span>TELETHERAPY GOVERNANCE STUDIO</span>
              </span>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                settings.enabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {settings.enabled ? 'الخدمة مفعّلة بالكامل 🟢' : 'الخدمة معطلة مؤقتاً 🔴'}
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">
                WebRTC DTLS/SRTP E2EE 🔐
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              حوكمة قمرة التطبيب عن بعد والعيادات الافتراضية
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              الإشراف الشامل على غرف الاستشارات الطبية والأرطوفونية عن بعد: مراقبة المكالمات الحية لحظياً، خوادم الإشارة WebRTC و STUN/TURN، إنهاء الجلسات إدارياً، وضبط أذونات التفاعل والسبورة الرقمية.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              onClick={() => {
                fetchOverview();
                if (subTab === 'history') fetchHistoryRooms();
              }}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 shadow-md border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              <span>تحديث الحالة</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 pt-6 border-t border-slate-800/80 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setSubTab('active_rooms')}
            className={`px-4 py-2.5 rounded-2xl transition whitespace-nowrap flex items-center gap-2 shrink-0 ${
              subTab === 'active_rooms'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 font-black'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>الجلسات المباشرة الآن</span>
            {kpis.active_rooms > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-bounce">
                {kpis.active_rooms}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`px-4 py-2.5 rounded-2xl transition whitespace-nowrap flex items-center gap-2 shrink-0 ${
              subTab === 'history'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 font-black'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>سجل وأرشيف الجلسات الشامل</span>
            <span className="text-[10px] opacity-75 font-mono">({kpis.total_rooms})</span>
          </button>

          <button
            onClick={() => setSubTab('settings')}
            className={`px-4 py-2.5 rounded-2xl transition whitespace-nowrap flex items-center gap-2 shrink-0 ${
              subTab === 'settings'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 font-black'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>إعدادات WebRTC وخوادم STUN/TURN</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">جلسات مباشرة الآن</div>
            <div className="text-2xl font-black text-rose-400 font-mono">
              {loading ? '--' : kpis.active_rooms}
            </div>
          </div>
          {kpis.active_rooms > 0 && (
            <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">إجمالي الغرف المنشأة</div>
            <div className="text-2xl font-black text-white font-mono">
              {loading ? '--' : kpis.total_rooms}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">جلسات مكتملة وموثقة</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {loading ? '--' : kpis.completed_rooms}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">ساعات التطبيب عن بعد</div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {loading ? '--' : `${kpis.total_hours} س`}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-bold">العيادات المستفيدة</div>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              {loading ? '--' : kpis.participating_clinics}
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: LIVE ACTIVE ROOMS MONITOR */}
      {subTab === 'active_rooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h3 className="text-sm font-bold text-white">
                قمرة المراقبة اللحظية للغرف النشطة ({liveRooms.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              يتم تحديث الجلسات المتصلة وإشارات الـ WebRTC تلقائياً
            </span>
          </div>

          {liveRooms.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                <VideoOff className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">لا توجد مكالمات تطبيب عن بعد جارية الآن</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                عندما يبدأ أي أخصائي أو طبيب جلسة علاج عن بعد في أي عيادة، ستظهر الغرفة هنا فوراً للمعاينة والمراقبة التقنية.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-slate-900 border border-rose-500/30 rounded-3xl p-5 space-y-4 shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-rose-500" />
                  
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                          <span>LIVE CALL</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          #{room.room_code}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5 pt-1">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span>المريض: {room.patient_name}</span>
                      </h4>
                    </div>

                    <div className="text-left">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {getSpecialtyLabel(room.specialty)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">الأخصائي المشرف:</span>
                      <span className="text-slate-200 font-bold truncate block">{room.specialist_name}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">معرف العيادة (Tenant):</span>
                      <span className="text-purple-300 font-mono font-bold truncate block">{room.tenant_id || 'افتراضي'}</span>
                    </div>
                    {room.access_pin && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block">رمز الحماية (PIN):</span>
                        <span className="text-amber-400 font-mono font-bold">{room.access_pin}</span>
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">المدة الحالية:</span>
                      <span className="text-emerald-400 font-mono font-bold">{formatSeconds(room.duration_seconds)}</span>
                    </div>
                  </div>

                  {/* Actions for Live Room */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                    <a
                      href={`/teletherapy/room/${room.room_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة إدارية للغرفة</span>
                    </a>

                    <button
                      onClick={() => handleCopyLink(room.room_code, room.access_pin)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1"
                      title="نسخ رابط المريض"
                    >
                      {copiedCode === room.room_code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>رابط المريض</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleTerminateRoom(room.room_code)}
                      disabled={actionLoading === room.room_code}
                      className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1"
                      title="إنهاء الجلسة إجبارياً من الخادم"
                    >
                      <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>إنهاء إجباري</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: SESSIONS HISTORY & AUDIT LOG */}
      {subTab === 'history' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بكود الغرفة، اسم المريض، اسم الأخصائي، أو اسم العيادة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="w-full sm:w-48 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">كافة التخصصات</option>
              <option value="orthophony">🗣️ أرطوفونيا وتخاطب</option>
              <option value="psychology">🧠 علم النفس العيادي</option>
              <option value="psychomotricity">🏃 التأهيل النفسي-حركي</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-40 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">كافة الحالات</option>
              <option value="active">🔴 جارية الآن (Active)</option>
              <option value="closed">🏁 مكتملة (Closed)</option>
              <option value="scheduled">🕒 مجدولة (Scheduled)</option>
            </select>
          </div>

          {/* Sessions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="p-4">كود الغرفة</th>
                    <th className="p-4">العيادة (Tenant)</th>
                    <th className="p-4">المريض / الطفل</th>
                    <th className="p-4">الأخصائي</th>
                    <th className="p-4">التخصص</th>
                    <th className="p-4">المدة</th>
                    <th className="p-4">التوثيق (SOAP/السبورة)</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
                        <span>جاري تحميل سجل الجلسات...</span>
                      </td>
                    </tr>
                  ) : historyRooms.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        لا توجد جلسات تطبيب عن بعد مطابقة لشروط البحث
                      </td>
                    </tr>
                  ) : (
                    historyRooms.map((room) => {
                      const patientName = room.patient ? (room.patient.name || `${room.patient.first_name || ''} ${room.patient.last_name || ''}`.trim()) : 'مريض غير مسجل';
                      const specialistName = room.specialist?.name || 'الأخصائي';

                      return (
                        <tr key={room.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 font-mono font-bold text-white">
                            #{room.room_code}
                          </td>
                          <td className="p-4 text-purple-300 font-mono text-[11px]">
                            {room.tenant_id || 'عام'}
                          </td>
                          <td className="p-4 font-bold text-slate-100">
                            {patientName}
                            {room.patient?.phone && (
                              <span className="block text-[10px] text-slate-500 font-mono">
                                📞 {room.patient.phone}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-slate-300">
                            {specialistName}
                          </td>
                          <td className="p-4 text-slate-400 text-[11px]">
                            {getSpecialtyLabel(room.specialty)}
                          </td>
                          <td className="p-4 font-mono text-emerald-400 font-bold">
                            {formatSeconds(room.duration_seconds)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              {room.soap_snapshot ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  📝 SOAP
                                </span>
                              ) : null}
                              {room.canvas_snapshot ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  🎨 رسم
                                </span>
                              ) : null}
                              {!room.soap_snapshot && !room.canvas_snapshot && (
                                <span className="text-[10px] text-slate-600">بدون مرفقات</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {room.status === 'active' ? (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                                <span>متصل الآن</span>
                              </span>
                            ) : room.status === 'closed' || room.status === 'completed' ? (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit block">
                                🏁 مكتملة
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 w-fit block">
                                {room.status}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <a
                                href={`/teletherapy/room/${room.room_code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition"
                                title="معاينة الغرفة"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              {room.status === 'active' && (
                                <button
                                  onClick={() => handleTerminateRoom(room.room_code)}
                                  className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition"
                                  title="إنهاء إجباري"
                                >
                                  <PhoneOff className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteRoom(room.room_code)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition"
                                title="حذف السجل"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: WEBRTC & INFRASTRUCTURE SETTINGS */}
      {subTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>تم حفظ وتحديث إعدادات البنية التحتية للتطبيب عن بعد بنجاح!</span>
            </div>
          )}

          {/* Section 1: Global Master Switch */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>المفتاح العام لتشغيل التطبيب عن بعد (Platform Master Switch)</span>
            </h3>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-200 block">
                  إتاحة خدمة غرف التطبيب عن بعد للعيادات والمشتركين
                </span>
                <span className="text-[11px] text-slate-400 block">
                  عند تعطيل هذا الخيار، سيتم حجب إنشاء غرف جديدة وإظهار رسالة صيانة لكافة المستخدمين.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          {/* Section 2: WebRTC & STUN/TURN Topology */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <span>إعدادات خوادم الإشارة والتمرير (WebRTC / STUN / TURN NAT Traversal)</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                P2P Ultra-Low Latency
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">خادم STUN الأساسي (Primary STUN):</label>
                <input
                  type="text"
                  value={settings.stun_server_primary}
                  onChange={(e) => setSettings({ ...settings, stun_server_primary: e.target.value })}
                  placeholder="stun:stun.l.google.com:19302"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-slate-500">يستخدم لكشف العنوان العام للمتصفح وتجاوز NAT.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">خادم STUN الاحتياطي (Secondary STUN):</label>
                <input
                  type="text"
                  value={settings.stun_server_secondary}
                  onChange={(e) => setSettings({ ...settings, stun_server_secondary: e.target.value })}
                  placeholder="stun:global.stun.twilio.com:3478"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-slate-500">خادم بديل في حال تعذر الاتصال بالخادم الأساسي.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">عنوان خادم TURN المخصص (اختياري - للشبكات المغلقة):</label>
                <input
                  type="text"
                  value={settings.turn_server}
                  onChange={(e) => setSettings({ ...settings, turn_server: e.target.value })}
                  placeholder="turn:turn.psypro.tech:3478"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-slate-500">لتمرير حركة المرور إذا كان الاتصال المباشر P2P محجوباً.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">اسم مستخدم TURN وكلمة المرور:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={settings.turn_username}
                    onChange={(e) => setSettings({ ...settings, turn_username: e.target.value })}
                    placeholder="Username"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="password"
                    value={settings.turn_credential}
                    onChange={(e) => setSettings({ ...settings, turn_credential: e.target.value })}
                    placeholder="Password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Feature Toggles & Bandwidth Optimization */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-400" />
              <span>ميزات الجلسة التفاعلية وتحسين استهلاك البيانات</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">السبورة السريرية التفاعلية المباشرة</span>
                  <span className="text-[10px] text-slate-400">إتاحة الرسم التفاعلي المتبادل بين الأخصائي والمريض</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allow_canvas}
                  onChange={(e) => setSettings({ ...settings, allow_canvas: e.target.checked })}
                  className="rounded bg-slate-800 text-purple-600 focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">تمرير الروائز والمقاييس السريرية المباشرة</span>
                  <span className="text-[10px] text-slate-400">إتاحة تطبيق الـ 18 رائزاً معيارياً أثناء المكالمة</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allow_tests_passation}
                  onChange={(e) => setSettings({ ...settings, allow_tests_passation: e.target.checked })}
                  className="rounded bg-slate-800 text-purple-600 focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">بروتوكولات CBT ومقياس SUDS</span>
                  <span className="text-[10px] text-slate-400">إتاحة سجل إعادة الهيكلة المعرفية ومقياس الضيق اللحظي</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allow_cbt_protocols}
                  onChange={(e) => setSettings({ ...settings, allow_cbt_protocols: e.target.checked })}
                  className="rounded bg-slate-800 text-purple-600 focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">مشاركة الشاشة (Screen Share)</span>
                  <span className="text-[10px] text-slate-400">تمكين الأخصائي من عرض شرائح ومواد تعليمية للمريض</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allow_screen_share}
                  onChange={(e) => setSettings({ ...settings, allow_screen_share: e.target.checked })}
                  className="rounded bg-slate-800 text-purple-600 focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">وضع توفير البيانات (Eco Mode للشبكات الضعيفة)</span>
                  <span className="text-[10px] text-slate-400">تخفيض استهلاك الباندويث تلقائياً لدعم شبكات 3G/4G في الجزائر</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.eco_bandwidth_mode}
                  onChange={(e) => setSettings({ ...settings, eco_bandwidth_mode: e.target.checked })}
                  className="rounded bg-slate-800 text-purple-600 focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">التسجيل السحابي للجلسات (Cloud Recording)</span>
                  <span className="text-[10px] text-slate-400">حفظ تسجيلات الفيديو على الخادم (يتطلب سعة تخزين عالية)</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allow_recording}
                  onChange={(e) => setSettings({ ...settings, allow_recording: e.target.checked })}
                  className="rounded bg-slate-800 text-purple-600 focus:ring-0 w-4 h-4"
                />
              </label>
            </div>

            <div className="pt-3 max-w-xs space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الحد الأقصى لمدة الجلسة الواحدة (بالدقائق):</label>
              <input
                type="number"
                min={15}
                max={240}
                value={settings.max_session_minutes}
                onChange={(e) => setSettings({ ...settings, max_session_minutes: parseInt(e.target.value) || 60 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-[0.99]"
            >
              {savingSettings ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري حفظ التغييرات...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>حفظ إعدادات التطبيب عن بعد</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
