import React, { useState, useMemo } from 'react';
import { 
  Play, Stethoscope, Clock, CheckCircle2, User, Search, 
  X, Check, Sparkles, Activity, Users, FileText, Phone, AlertCircle
} from 'lucide-react';
import { appointmentApi } from '../api';

export default function QuickStartSessionModal({ 
  isOpen, 
  onClose, 
  patients = [], 
  onStartSession, 
  onSessionStarted 
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [sessionType, setSessionType] = useState('reeducation'); // reeducation, assessment, guidance
  const [searchQuery, setSearchQuery] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  // Filter patients by search query (name, phone, folder number, ID)
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) {
      return patients.slice(0, 30);
    }
    const q = searchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const folder = (p.folder_number || p.file_number || '').toLowerCase();
      const idStr = String(p.id || '');
      const natId = (p.national_id || '').toLowerCase();

      return (
        fullName.includes(q) ||
        phone.includes(q) ||
        folder.includes(q) ||
        idStr.includes(q) ||
        natId.includes(q)
      );
    });
  }, [patients, searchQuery]);

  if (!isOpen) return null;

  const selectedPatient = patients.find(pt => String(pt.id) === String(selectedPatientId)) || filteredPatients[0];

  const handleStart = async () => {
    const patientToUse = selectedPatient || filteredPatients[0];
    if (!patientToUse) {
      setError('يرجى اختيار مريض لبدء الجلسة السريرية.');
      return;
    }

    setError('');
    setIsStarting(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      // Create an active in_progress appointment on the backend
      const res = await appointmentApi.create({
        patient_id: patientToUse.id,
        appointment_date: today,
        start_time: nowTime,
        type: sessionType === 'assessment' ? 'assessment' : (sessionType === 'guidance' ? 'consultation' : 'therapy_session'),
        status: 'in_progress',
        notes: `جلسة سريرية فورية ومباشرة (${sessionType === 'assessment' ? 'تقييم ورائز' : (sessionType === 'guidance' ? 'إرشاد أسري' : 'إعادة تأهيل ونطق')})`,
      });

      const appointmentObj = res.data || res.appointment || res;

      if (onSessionStarted) {
        onSessionStarted(appointmentObj);
      }
      if (onStartSession) {
        onStartSession(patientToUse, sessionType, appointmentObj);
      }
      onClose();
    } catch (err) {
      console.warn('Could not persist appointment before session launch, opening fallback:', err);
      // Fallback: still launch session with dummy ID or direct patient object
      const fallbackAppt = {
        id: `temp-${Date.now()}`,
        patient_id: patientToUse.id,
        patient: patientToUse,
        status: 'in_progress',
        type: sessionType,
        created_at: new Date().toISOString(),
      };

      if (onSessionStarted) {
        onSessionStarted(fallbackAppt);
      }
      if (onStartSession) {
        onStartSession(patientToUse, sessionType, fallbackAppt);
      }
      onClose();
    } finally {
      setIsStarting(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} سنة` : 'أقل من سنة';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>بدء جلسة سريرية فورية</span>
                <span className="text-[11px] font-medium text-slate-400 font-mono">(Démarrer Consultation)</span>
              </h3>
              <p className="text-xs text-slate-400">إطلاق فوري لقمرة الجلسة مع الميقاتية المباشرة ونماذج SOAP</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs overflow-y-auto pr-1 custom-scrollbar">
          {/* 1. Patient Search & Selection Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>اختر المريض للجلسة:</span>
              </label>
              {selectedPatient && (
                <span className="text-[11px] text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded-lg border border-teal-500/20">
                  المحدد: {selectedPatient.first_name} {selectedPatient.last_name}
                </span>
              )}
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، اللقب، رقم الهاتف، أو رقم الملف..."
                className="w-full pl-8 pr-10 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:border-amber-500 focus:outline-none transition-all shadow-inner"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtered Patients List Container */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 rounded-2xl bg-slate-950/60 border border-slate-800/80 custom-scrollbar">
              {filteredPatients.length === 0 ? (
                <div className="p-5 text-center text-slate-500 text-xs space-y-1">
                  <p className="font-semibold">لا يوجد مريض مطابق للبحث "{searchQuery}"</p>
                  <p className="text-[10px] text-slate-600">يرجى التأكد من كتابة الاسم أو رقم الهاتف بدقة</p>
                </div>
              ) : (
                filteredPatients.map((p) => {
                  const isSelected = String(p.id) === String(selectedPatientId);
                  const age = calculateAge(p.birth_date);

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 shadow-sm text-white'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 space-x-reverse min-w-0">
                        <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-md'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {p.first_name ? p.first_name[0] : 'م'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate flex items-center gap-1.5">
                            <span className={isSelected ? 'text-amber-300 font-extrabold' : 'text-slate-100'}>
                              {p.first_name} {p.last_name}
                            </span>
                            {age && (
                              <span className="text-[10px] font-normal text-slate-400 font-mono">
                                ({age})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 truncate">
                            <span>ملف: {p.folder_number || p.file_number || `#${p.id}`}</span>
                            {p.phone && (
                              <span className="flex items-center gap-0.5 text-slate-500">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{p.phone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 mr-2">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-700 hover:border-slate-500" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. Session Type Selection */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>نوع الجلسة والبروتوكول السريري:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { 
                  id: 'reeducation', 
                  label: 'إعادة تأهيل ونطق', 
                  sub: 'Rééducation & Ortho', 
                  icon: Stethoscope 
                },
                { 
                  id: 'assessment', 
                  label: 'تقييم ورائز تشخيصي', 
                  sub: 'Bilan & Test', 
                  icon: FileText 
                },
                { 
                  id: 'guidance', 
                  label: 'إرشاد وتوجيه أسري', 
                  sub: 'Guidance Parentale', 
                  icon: Users 
                },
              ].map((item) => {
                const isSelected = sessionType === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSessionType(item.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="text-[11px] font-bold leading-tight">{item.label}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{item.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-800">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isStarting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting || !selectedPatient}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black flex items-center space-x-2 space-x-reverse shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isStarting ? 'جارٍ إطلاق الجلسة...' : 'انطلاق الجلسة السريرية 🩺'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
