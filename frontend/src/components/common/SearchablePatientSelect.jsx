import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, User, Phone, Check, AlertCircle, Sparkles, PlusCircle } from 'lucide-react';
import { patientApi } from '../../api';

export const DEFAULT_DEMO_PATIENT = {
  id: 'demo-patient-001',
  first_name: 'أحمد (مريض تجريبي)',
  last_name: 'المهدي',
  name: 'أحمد المهدي (مريض تجريبي)',
  gender: 'male',
  birth_date: '2016-05-12',
  phone: '0555123456',
  parent_phone: '0555123456',
  parent_name: 'محمد المهدي',
  emergency_contact: '0555123456',
  folder_number: 'DEMO-2026',
  age: 10,
  is_demo: true
};

export const DEFAULT_DEMO_PATIENT_2 = {
  id: 'demo-patient-002',
  first_name: 'سارة (مريضة تجريبية)',
  last_name: 'بن علي',
  name: 'سارة بن علي (مريضة تجريبية)',
  gender: 'female',
  birth_date: '2014-08-20',
  phone: '0661987654',
  parent_phone: '0661987654',
  parent_name: 'فاطمة بن علي',
  emergency_contact: '0661987654',
  folder_number: 'DEMO-2026-B',
  age: 12,
  is_demo: true
};

/**
 * Normalizes patient display name
 */
export function getPatientDisplayName(p) {
  if (!p) return '';
  if (p.name) return p.name;
  const first = p.first_name || '';
  const last = p.last_name || '';
  const full = `${first} ${last}`.trim();
  return full || `مريض #${p.id || '---'}`;
}

/**
 * Calculates or formats patient display age
 */
export function getPatientDisplayAge(p) {
  if (!p) return null;
  if (p.age) return `${p.age} سنة`;
  if (p.birth_date) {
    const birth = new Date(p.birth_date);
    if (!isNaN(birth.getTime())) {
      const diff = Date.now() - birth.getTime();
      const ageDate = new Date(diff);
      const years = Math.abs(ageDate.getUTCFullYear() - 1970);
      return `${years} سنة`;
    }
  }
  return null;
}

/**
 * SearchablePatientSelect Component
 * Rich live searchable patient selector with cards, avatars, visual check indicators,
 * and zero-block fallback to demo patient to ensure tablet/kiosk tests never stall.
 */
export default function SearchablePatientSelect({
  patients = [],
  selectedPatientId = '',
  onSelectPatient,
  label = 'اختر ملف المريض / الطفل المستهدف:',
  placeholder = 'ابحث بالاسم، اللقب، رقم الهاتف، أو رقم الملف...',
  accentColor = 'indigo', // 'indigo' | 'emerald' | 'amber' | 'teal' | 'purple'
  maxHeight = 'max-h-52',
  showSelectedBadge = true,
  autoFocus = false,
  required = false,
  allowDemoFallback = true
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingQuickPatient, setCreatingQuickPatient] = useState(false);
  const [createdDemoPatient, setCreatedDemoPatient] = useState(null);

  // Effective list of patients (including fallback demo patients if system has 0 patients)
  const hasRealPatients = Array.isArray(patients) && patients.length > 0;
  
  const effectivePatients = useMemo(() => {
    if (hasRealPatients) return patients;
    if (createdDemoPatient) return [createdDemoPatient, DEFAULT_DEMO_PATIENT_2];
    if (allowDemoFallback) return [DEFAULT_DEMO_PATIENT, DEFAULT_DEMO_PATIENT_2];
    return [];
  }, [patients, hasRealPatients, createdDemoPatient, allowDemoFallback]);

  // Accent styles map
  const styles = {
    indigo: {
      text: 'text-indigo-400',
      activeText: 'text-indigo-300',
      border: 'focus:border-indigo-500',
      activeBorder: 'border-indigo-500/50',
      activeBg: 'bg-indigo-600/15',
      badgeBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
      avatarBg: 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white',
      checkBg: 'bg-indigo-500 text-white'
    },
    emerald: {
      text: 'text-emerald-400',
      activeText: 'text-emerald-300',
      border: 'focus:border-emerald-500',
      activeBorder: 'border-emerald-500/50',
      activeBg: 'bg-emerald-600/15',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
      avatarBg: 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white',
      checkBg: 'bg-emerald-500 text-white'
    },
    amber: {
      text: 'text-amber-400',
      activeText: 'text-amber-300',
      border: 'focus:border-amber-500',
      activeBorder: 'border-amber-500/50',
      activeBg: 'bg-amber-600/15',
      badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      avatarBg: 'bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950',
      checkBg: 'bg-amber-500 text-slate-950'
    },
    teal: {
      text: 'text-teal-400',
      activeText: 'text-teal-300',
      border: 'focus:border-teal-500',
      activeBorder: 'border-teal-500/50',
      activeBg: 'bg-teal-600/15',
      badgeBg: 'bg-teal-500/10 border-teal-500/20 text-teal-300',
      avatarBg: 'bg-gradient-to-tr from-teal-500 to-cyan-600 text-white',
      checkBg: 'bg-teal-500 text-white'
    },
    purple: {
      text: 'text-purple-400',
      activeText: 'text-purple-300',
      border: 'focus:border-purple-500',
      activeBorder: 'border-purple-500/50',
      activeBg: 'bg-purple-600/15',
      badgeBg: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
      avatarBg: 'bg-gradient-to-tr from-purple-500 to-pink-600 text-white',
      checkBg: 'bg-purple-500 text-white'
    }
  }[accentColor] || {
    text: 'text-indigo-400',
    activeText: 'text-indigo-300',
    border: 'focus:border-indigo-500',
    activeBorder: 'border-indigo-500/50',
    activeBg: 'bg-indigo-600/15',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
    avatarBg: 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white',
    checkBg: 'bg-indigo-500 text-white'
  };

  // Auto-select demo patient if no patient is currently selected and we are in demo fallback mode
  useEffect(() => {
    if (!selectedPatientId && !hasRealPatients && allowDemoFallback && effectivePatients.length > 0) {
      const firstPatient = effectivePatients[0];
      if (onSelectPatient) {
        onSelectPatient(firstPatient.id, firstPatient);
      }
    }
  }, [selectedPatientId, hasRealPatients, allowDemoFallback, effectivePatients, onSelectPatient]);

  // Currently selected patient
  const selectedPatient = useMemo(() => {
    return effectivePatients.find((p) => String(p.id) === String(selectedPatientId)) || null;
  }, [effectivePatients, selectedPatientId]);

  // Filtered patients based on search query
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return effectivePatients;
    const q = searchQuery.toLowerCase().trim();
    return effectivePatients.filter((p) => {
      const name = (p.name || `${p.first_name || ''} ${p.last_name || ''}`).toLowerCase();
      const phone = (p.phone || p.parent_phone || p.emergency_contact || '').toLowerCase();
      const folder = (p.folder_number || p.file_number || '').toLowerCase();
      const idStr = String(p.id);
      return name.includes(q) || phone.includes(q) || folder.includes(q) || idStr.includes(q);
    });
  }, [effectivePatients, searchQuery]);

  // Quick 1-click creation of a demo patient in the actual database
  const handleCreateQuickDemoPatient = async () => {
    setCreatingQuickPatient(true);
    try {
      const payload = {
        first_name: 'أحمد (مريض تجريبي)',
        last_name: 'المهدي',
        gender: 'male',
        birth_date: '2016-05-12',
        phone: '0555123456',
        phone_operator: 'mobilis',
        guardian_name: 'محمد المهدي',
        emergency_contact: '0555123456',
        commune_name: 'الجزائر الوسطى',
        folder_number: `DEMO-${Date.now().toString().slice(-4)}`,
        status: 'active'
      };
      const res = await patientApi.create(payload);
      const newP = res.patient || res.data || res;
      if (newP && newP.id) {
        setCreatedDemoPatient(newP);
        if (onSelectPatient) {
          onSelectPatient(newP.id, newP);
        }
      }
    } catch (err) {
      console.warn('Could not auto-create demo patient via API, relying on dynamic backend resolution:', err);
      if (onSelectPatient) {
        onSelectPatient(DEFAULT_DEMO_PATIENT.id, DEFAULT_DEMO_PATIENT);
      }
    } finally {
      setCreatingQuickPatient(false);
    }
  };

  if (!hasRealPatients && !allowDemoFallback) {
    return (
      <div className="space-y-1.5 text-right" dir="rtl">
        {label && (
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <User className={`w-3.5 h-3.5 ${styles.text}`} />
            <span>{label}</span>
          </label>
        )}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-amber-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>⚠️ لا يوجد مرضى مسجلين حالياً في قاعدة البيانات.</span>
          </div>
          <button
            type="button"
            onClick={handleCreateQuickDemoPatient}
            disabled={creatingQuickPatient}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition flex items-center gap-1 shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{creatingQuickPatient ? 'جاري الإنشاء...' : 'إضافة مريض تجريبي الآن ⚡'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-right font-sans" dir="rtl">
      {/* Label and Selected Status Badge */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <User className={`w-3.5 h-3.5 ${styles.text}`} />
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}
        {showSelectedBadge && selectedPatient && (
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border truncate max-w-[240px] ${styles.badgeBg}`}>
            المحدد: {getPatientDisplayName(selectedPatient)}
            {getPatientDisplayAge(selectedPatient) && (
              <span className="font-normal opacity-80 mr-1 font-mono">
                ({getPatientDisplayAge(selectedPatient)})
              </span>
            )}
          </span>
        )}
      </div>

      {/* Zero-Block Notice when using Demo Fallback */}
      {!hasRealPatients && (
        <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs text-indigo-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              💡 وضع المعاينة السريعة مفعّل: تم توفير مريض تجريبي لإطلاق الفحص ووضع التابلت مباشرة دون عوائق.
            </span>
          </div>
          <button
            type="button"
            onClick={handleCreateQuickDemoPatient}
            disabled={creatingQuickPatient}
            className="px-2.5 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-[10px] font-bold text-indigo-200 border border-indigo-500/40 transition shrink-0 self-end sm:self-auto flex items-center gap-1"
          >
            <PlusCircle className="w-3 h-3" />
            <span>{creatingQuickPatient ? 'جاري الحفظ...' : '+ تثبيت مريض تجريبي دائم'}</span>
          </button>
        </div>
      )}

      {/* Live Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-8 pr-10 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none transition-all shadow-inner ${styles.border}`}
          autoFocus={autoFocus}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 transition"
            title="مسح البحث"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filtered Patients Cards List */}
      <div className={`${maxHeight} overflow-y-auto space-y-1.5 p-1 rounded-2xl bg-slate-950/60 border border-slate-800/80 custom-scrollbar`}>
        {filteredPatients.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs space-y-2">
            <p className="font-semibold">لا يوجد مريض مطابق للبحث "{searchQuery}"</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                if (effectivePatients.length > 0 && onSelectPatient) {
                  onSelectPatient(effectivePatients[0].id, effectivePatients[0]);
                }
              }}
              className="px-3 py-1 rounded-lg bg-slate-800 text-indigo-300 text-[11px] font-bold border border-slate-700 hover:bg-slate-700 transition"
            >
              إلغاء البحث واختيار المريض التجريبي
            </button>
          </div>
        ) : (
          filteredPatients.map((p) => {
            const isSelected = String(p.id) === String(selectedPatientId);
            const name = getPatientDisplayName(p);
            const age = getPatientDisplayAge(p);
            const folderNum = p.folder_number || p.file_number || `#${p.id}`;
            const isDemo = p.is_demo || String(p.id).includes('demo') || name.includes('تجريبي');

            return (
              <div
                key={p.id}
                onClick={() => onSelectPatient && onSelectPatient(p.id, p)}
                className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                  isSelected
                    ? `${styles.activeBg} ${styles.activeBorder} shadow-sm text-white`
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 space-x-reverse min-w-0">
                  {/* Initials Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? `${styles.avatarBg} shadow-md`
                        : isDemo
                        ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {name[0] || 'م'}
                  </div>

                  {/* Info details */}
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <span className={isSelected ? `${styles.activeText} font-extrabold` : 'text-slate-100'}>
                        {name}
                      </span>
                      {age && (
                        <span className="text-[10px] font-normal text-slate-400 font-mono">
                          ({age})
                        </span>
                      )}
                      {isDemo && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold shrink-0">
                          ⚡ تجريبي / تابلت
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 truncate">
                      <span>ملف: {folderNum}</span>
                      {p.phone && (
                        <span className="flex items-center gap-0.5 text-slate-500">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{p.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Check / Radio Status */}
                <div className="shrink-0 mr-2">
                  {isSelected ? (
                    <div className={`w-5 h-5 rounded-full ${styles.checkBg} flex items-center justify-center shadow-sm`}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-700 hover:border-slate-500 transition" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
