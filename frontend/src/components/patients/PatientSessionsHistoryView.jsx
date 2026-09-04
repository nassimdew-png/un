import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Activity,
  CheckCircle2,
  FileText,
  TrendingUp,
  Scale,
  Send,
  Printer,
  Sparkles,
  Star,
  Target,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRightLeft,
  Info,
} from 'lucide-react';

export default function PatientSessionsHistoryView({
  patient,
  sessions = [],
  onStartSession = null,
  onRefresh = null,
}) {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'compare'
  const [expandedSessionId, setExpandedSessionId] = useState(sessions[0]?.id || null);

  // Comparison selectors
  const [compareSessionIdA, setCompareSessionIdA] = useState(
    sessions.length > 1 ? sessions[sessions.length - 1]?.id : sessions[0]?.id || null
  );
  const [compareSessionIdB, setCompareSessionIdB] = useState(sessions[0]?.id || null);

  // Parse structured SOAP lines from progress_notes string
  const parseSoapNotes = (notes) => {
    if (!notes) return { subjective: '', objective: '', assessment: '', plan: '', extra: '' };
    const lines = notes.split('\n');
    let subjective = '';
    let objective = '';
    let assessment = '';
    let plan = '';
    let trialAccuracy = '';
    let engagement = '';

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('• Subjective:')) subjective = trimmed.replace('• Subjective:', '').trim();
      else if (trimmed.startsWith('• Objective:')) objective = trimmed.replace('• Objective:', '').trim();
      else if (trimmed.startsWith('• Assessment:')) assessment = trimmed.replace('• Assessment:', '').trim();
      else if (trimmed.startsWith('• Plan:')) plan = trimmed.replace('• Plan:', '').trim();
      else if (trimmed.includes('Trial Accuracy:')) trialAccuracy = trimmed;
      else if (trimmed.includes('Behavioral Engagement:')) engagement = trimmed;
    });

    return {
      subjective: subjective || notes,
      objective,
      assessment,
      plan,
      trialAccuracy,
      engagement,
      raw: notes,
    };
  };

  // WhatsApp Sender for a specific session
  const sendSessionWhatsApp = (session) => {
    const phone = (patient?.phone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? `213${phone.substring(1)}` : phone;

    const parsed = parseSoapNotes(session.progress_notes);
    const dateStr = session.session_date
      ? new Date(session.session_date).toLocaleDateString('ar-DZ')
      : 'اليوم';

    const exercises = Array.isArray(session.exercises_targeted)
      ? session.exercises_targeted.slice(0, 3).join('، ')
      : 'تمارين نطقية وحركية';

    const msg = `السلام عليكم ورحمة الله،
تحية طيبة من عيادة التأهيل والأرطوفونيا 🩺

نشارككم ملخص جلسة البطل(ة) *${patient?.first_name || ''} ${patient?.last_name || ''}* ليوم ${dateStr}:
• *الأنشطة والتمارين:* ${exercises}
• *التوجيهات المنزلية:* ${parsed.plan || 'الاستمرار في التدريب المنزلي لمدة 10 دقائق يومياً.'}

شكراً لحرصكم وتعاونكم المستمر 🌸`;

    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Print Single Session Summary
  const printSessionSlip = (session) => {
    const parsed = parseSoapNotes(session.progress_notes);
    const dateStr = session.session_date
      ? new Date(session.session_date).toLocaleDateString('fr-FR')
      : '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>ملخص الجلسة السريرية - ${patient?.first_name || ''} ${patient?.last_name || ''}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 25px; color: #1e293b; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 18px; font-weight: bold; color: #0f766e; }
          .meta { font-size: 12px; color: #64748b; margin-top: 5px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
          .label { font-weight: bold; font-size: 13px; color: #0f766e; margin-bottom: 4px; }
          .footer { margin-top: 30px; text-align: left; font-size: 12px; font-weight: bold; color: #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">بطاقة توثيق الجلسة العلاجية (Fiche de Séance)</div>
          <div class="meta">المريض: <strong>${patient?.first_name} ${patient?.last_name}</strong> &bull; التاريخ: ${dateStr} &bull; المدة: ${session.duration_minutes || 45} دقيقة</div>
        </div>
        <div class="box">
          <div class="label">1. ملاحظات البداية والشكوى (Subjective):</div>
          <div>${parsed.subjective || 'لا توجد ملاحظات'}</div>
        </div>
        <div class="box">
          <div class="label">2. التمارين والملاحظات المقاسة (Objective):</div>
          <div>${parsed.objective || 'تم إنجاز التمارين المحددة بنجاح'}</div>
          ${parsed.trialAccuracy ? `<div style="margin-top:6px; color:#2563eb; font-weight:bold;">${parsed.trialAccuracy}</div>` : ''}
        </div>
        <div class="box">
          <div class="label">3. التقييم والتحليل السريري (Assessment):</div>
          <div>${parsed.assessment || 'استجابة وتفاعل إيجابي'}</div>
        </div>
        <div class="box">
          <div class="label">4. الخطة القادمة والتوصيات المنزلية (Plan):</div>
          <div>${parsed.plan || 'الالتزام بالتدريب المنزلي اليومي'}</div>
        </div>
        <div class="footer">توقيع وخاتم الأخصائي المعالج: ___________________</div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Metrics
  const totalSessionsCount = sessions.length;
  const totalMinutes = sessions.reduce((acc, s) => acc + (Number(s.duration_minutes) || 45), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Comparison Objects
  const sessionA = sessions.find((s) => s.id === Number(compareSessionIdA)) || sessions[sessions.length - 1];
  const sessionB = sessions.find((s) => s.id === Number(compareSessionIdB)) || sessions[0];
  const parsedA = sessionA ? parseSoapNotes(sessionA.progress_notes) : null;
  const parsedB = sessionB ? parseSoapNotes(sessionB.progress_notes) : null;

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Quick Analytics */}
      <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-white flex items-center space-x-2 space-x-reverse">
            <Calendar className="w-5 h-5 text-teal-400" />
            <span>سجل ومقارنة الحصص السريرية السابقة (Historique & Suivi des Séances)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            متابعة دقيقة لمسار التأهيل وتطور استجابة المريض من جلسة لأخرى مع أداة المقارنة المزدوجة
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-slate-900 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'timeline'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📜 الخط الزمني ({totalSessionsCount})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 space-x-reverse transition-all ${
                viewMode === 'compare'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>⚖️ مقارنة جلستين</span>
            </button>
          </div>

          {onStartSession && (
            <button
              type="button"
              onClick={onStartSession}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center space-x-1.5 space-x-reverse transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>⚡ بدء جلسة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">إجمالي الجلسات المنجزة</span>
          <span className="text-xl font-black text-white font-mono">{totalSessionsCount} جلسة</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">زمن التأهيل التراكمي</span>
          <span className="text-xl font-black text-amber-300 font-mono">{totalHours} ساعة ({totalMinutes} د)</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">نسبة الحضور والانتظام</span>
          <span className="text-xl font-black text-emerald-400 font-mono">100% منتظم 🟢</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">تاريخ أحدث جلسة</span>
          <span className="text-sm font-bold text-teal-300">
            {sessions[0]?.session_date
              ? new Date(sessions[0].session_date).toLocaleDateString('ar-DZ')
              : 'لا توجد جلسات'}
          </span>
        </div>
      </div>

      {/* 3. VIEW MODE A: TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-950/60 border border-slate-800 space-y-3">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">لم يتم تسجيل جلسات علاجية لهذا المريض بعد.</p>
              {onStartSession && (
                <button
                  type="button"
                  onClick={onStartSession}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
                >
                  ⚡ بدء الجلسة الأولى لهذا المريض
                </button>
              )}
            </div>
          ) : (
            sessions.map((session, idx) => {
              const sessionNumber = sessions.length - idx;
              const isExpanded = expandedSessionId === session.id;
              const parsed = parseSoapNotes(session.progress_notes);
              const dateStr = session.session_date
                ? new Date(session.session_date).toLocaleDateString('ar-DZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'تاريخ غير محدد';

              return (
                <div
                  key={session.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isExpanded
                      ? 'bg-slate-900 border-teal-500/40 shadow-lg shadow-teal-500/5'
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Collapsible Session Header Bar */}
                  <div
                    onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                    className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center justify-center font-black font-mono text-sm">
                        #{sessionNumber}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="font-extrabold text-xs text-white">الجلسة السريرية #{sessionNumber}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({dateStr})</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              session.specialty === 'orthophony'
                                ? 'bg-teal-500/20 text-teal-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {session.specialty === 'orthophony' ? '🗣️ أرطوفونيا' : '🧠 علم النفس'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-2 space-x-reverse">
                          <span className="font-mono text-amber-300 font-bold">{session.duration_minutes || 45} دقيقة</span>
                          <span>&bull;</span>
                          <span>الأخصائي: {session.specialist?.name || 'الأخصائي المعالج'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {parsed.trialAccuracy && (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                          {parsed.trialAccuracy}
                        </span>
                      )}

                      {/* Action buttons */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sendSessionWhatsApp(session);
                        }}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs"
                        title="إرسال الواجب للولي عبر WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          printSessionSlip(session);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        title="طباعة بطاقة الجلسة"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detailed View */}
                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-4 border-t border-slate-800/80 text-xs">
                      {/* Targeted exercises tags */}
                      {Array.isArray(session.exercises_targeted) && session.exercises_targeted.length > 0 && (
                        <div className="space-y-1.5 pt-3">
                          <span className="text-[10px] font-bold text-slate-400 block">التمارين المستهدفة في هذه الجلسة:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {session.exercises_targeted.map((ex, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 text-teal-300 border border-slate-700 text-[10px] font-bold"
                              >
                                ✓ {ex}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Structured SOAP Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* S */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-teal-400 block">
                            S &bull; شكوى وملاحظات البداية (Subjective):
                          </span>
                          <p className="text-slate-300 leading-relaxed">{parsed.subjective || 'لا توجد ملاحظات'}</p>
                        </div>

                        {/* O */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-blue-400 block">
                            O &bull; التمارين والملاحظات المقاسة (Objective):
                          </span>
                          <p className="text-slate-300 leading-relaxed">{parsed.objective || 'تم إنجاز التمارين بنجاح'}</p>
                        </div>

                        {/* A */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-purple-400 block">
                            A &bull; التقييم والتحليل السريري (Assessment):
                          </span>
                          <p className="text-slate-300 leading-relaxed">{parsed.assessment || 'استجابة وتفاعل إيجابي'}</p>
                        </div>

                        {/* P */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-amber-400 block">
                            P &bull; الخطة والواجبات المنزلية (Plan):
                          </span>
                          <p className="text-slate-300 leading-relaxed">{parsed.plan || 'الاستمرار في التدريب المنزلي'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. VIEW MODE B: HEAD-TO-HEAD COMPARISON TOOL */}
      {viewMode === 'compare' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-white flex items-center space-x-1.5 space-x-reverse">
                <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                <span>المقارنة السريرية المزدوجة بين جلستين (Face-à-Face)</span>
              </span>
              <p className="text-[11px] text-slate-400">
                اختر جلستين لمقارنة مستوى التفاعل، التمارين، التطور الإجرائي، وملاحظات الـ SOAP
              </p>
            </div>

            {/* Selectors */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">الجلسة (1):</span>
                <select
                  value={compareSessionIdA}
                  onChange={(e) => setCompareSessionIdA(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-bold"
                >
                  {sessions.map((s, i) => (
                    <option key={s.id} value={s.id}>
                      الجلسة #{sessions.length - i} ({new Date(s.session_date).toLocaleDateString('fr-FR')})
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-slate-500 font-bold">مقارنة مع</span>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">الجلسة (2):</span>
                <select
                  value={compareSessionIdB}
                  onChange={(e) => setCompareSessionIdB(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-bold"
                >
                  {sessions.map((s, i) => (
                    <option key={s.id} value={s.id}>
                      الجلسة #{sessions.length - i} ({new Date(s.session_date).toLocaleDateString('fr-FR')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Side-by-Side Cards Comparison */}
          {sessionA && sessionB ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Card A */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-black text-white text-sm">
                    الجلسة (1): {new Date(sessionA.session_date).toLocaleDateString('ar-DZ')}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-mono font-bold text-[10px]">
                    {sessionA.duration_minutes || 45} دقيقة
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-teal-400 font-bold block mb-1">التمارين المنجزة:</span>
                    <div className="flex flex-wrap gap-1">
                      {(sessionA.exercises_targeted || []).map((ex, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px]">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 space-y-1">
                    <span className="text-[10px] text-blue-400 font-bold block">Objective (الملاحظات المقاسة):</span>
                    <p className="text-slate-300 text-[11px]">{parsedA?.objective || 'لا توجد ملاحظات'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 space-y-1">
                    <span className="text-[10px] text-purple-400 font-bold block">Assessment (التقييم):</span>
                    <p className="text-slate-300 text-[11px]">{parsedA?.assessment || 'لا توجد ملاحظات'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 space-y-1">
                    <span className="text-[10px] text-amber-400 font-bold block">Plan (الواجب المنزلي):</span>
                    <p className="text-slate-300 text-[11px]">{parsedA?.plan || 'لا توجد توصيات'}</p>
                  </div>
                </div>
              </div>

              {/* Card B */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-black text-white text-sm">
                    الجلسة (2): {new Date(sessionB.session_date).toLocaleDateString('ar-DZ')}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px]">
                    {sessionB.duration_minutes || 45} دقيقة
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-purple-400 font-bold block mb-1">التمارين المنجزة:</span>
                    <div className="flex flex-wrap gap-1">
                      {(sessionB.exercises_targeted || []).map((ex, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px]">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 space-y-1">
                    <span className="text-[10px] text-blue-400 font-bold block">Objective (الملاحظات المقاسة):</span>
                    <p className="text-slate-300 text-[11px]">{parsedB?.objective || 'لا توجد ملاحظات'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 space-y-1">
                    <span className="text-[10px] text-purple-400 font-bold block">Assessment (التقييم):</span>
                    <p className="text-slate-300 text-[11px]">{parsedB?.assessment || 'لا توجد ملاحظات'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 space-y-1">
                    <span className="text-[10px] text-amber-400 font-bold block">Plan (الواجب المنزلي):</span>
                    <p className="text-slate-300 text-[11px]">{parsedB?.plan || 'لا توجد توصيات'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">يرجى اختيار جلستين على الأقل للمقارنة.</div>
          )}
        </div>
      )}
    </div>
  );
}
