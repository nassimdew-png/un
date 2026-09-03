import React, { useState } from 'react';
import {
  GitBranch,
  UserPlus,
  Trash2,
  AlertTriangle,
  Heart,
  Sparkles,
  Save,
  CheckCircle2,
  ShieldCheck,
  Info,
  Layers,
  Plus
} from 'lucide-react';

export const CLINICAL_DISORDERS = [
  { id: 'stuttering', label: 'تأتأة واضطراب طلاقة', label_fr: 'Bégaiement', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
  { id: 'language_delay', label: 'تأخر لغوي أولي', label_fr: 'Retard de langage', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', dot: 'bg-blue-400' },
  { id: 'autism', label: 'اضطراب طيف التوحد', label_fr: 'TSA / Autisme', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', dot: 'bg-purple-400' },
  { id: 'epilepsy', label: 'صرع وتشنجات عصبية', label_fr: 'Épilepsie / Convulsions', color: 'bg-red-500/20 text-red-300 border-red-500/30', dot: 'bg-red-400' },
  { id: 'learning_disability', label: 'صعوبات تعلم وعسر قراءة', label_fr: 'Troubles des apprentissages (Dys)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  { id: 'depression_anxiety', label: 'قلق مزمن واكتئاب', label_fr: 'Dépression / Anxiété', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', dot: 'bg-indigo-400' },
  { id: 'intellectual_disability', label: 'تأخر نمائي ذهني', label_fr: 'Déficience intellectuelle', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', dot: 'bg-rose-400' },
  { id: 'genetic_syndrome', label: 'متلازمة صبغية / وراثية', label_fr: 'Syndrome génétique', color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30', dot: 'bg-fuchsia-400' },
];

export default function InteractiveGenogramPedigree({
  patient,
  genogramData,
  onSave,
  readOnly = false,
}) {
  const [data, setData] = useState(() => {
    return {
      consanguinity: genogramData?.consanguinity ?? false,
      consanguinity_degree: genogramData?.consanguinity_degree || 'none', // none, first_cousins, second_cousins, same_tribe
      consanguinity_notes: genogramData?.consanguinity_notes || '',
      members: genogramData?.members || [
        { id: 'paternal_grandfather', relation: 'جد للأب', gender: 'male', generation: 1, name: 'الجد للأب', disorders: [] },
        { id: 'paternal_grandmother', relation: 'جدة للأب', gender: 'female', generation: 1, name: 'الجدة للأب', disorders: [] },
        { id: 'maternal_grandfather', relation: 'جد للأم', gender: 'male', generation: 1, name: 'الجد للأم', disorders: [] },
        { id: 'maternal_grandmother', relation: 'جدة للأم', gender: 'female', generation: 1, name: 'الجدة للأم', disorders: [] },
        { id: 'father', relation: 'الأب', gender: 'male', generation: 2, name: 'الأب', disorders: [] },
        { id: 'mother', relation: 'الأم', gender: 'female', generation: 2, name: 'الأم', disorders: [] },
        { id: 'patient', relation: 'المريض الحالي (Index)', gender: patient?.gender || 'male', generation: 3, name: `${patient?.first_name || 'المريض'} (Index)`, isPatient: true, disorders: [] },
      ],
    };
  });

  const [selectedMember, setSelectedMember] = useState(null);
  const [isAddingSibling, setIsAddingSibling] = useState(false);
  const [newSiblingName, setNewSiblingName] = useState('');
  const [newSiblingGender, setNewSiblingGender] = useState('male');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Calculate Consanguinity Coefficient (Coefficient de consanguinité F)
  const consanguinityInfo = (() => {
    switch (data.consanguinity_degree) {
      case 'first_cousins':
        return {
          coefficient: 'F = 1/16 (6.25%)',
          riskLevel: 'مرتفعة (Risque Élevé)',
          riskColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          desc: 'أبناء عم أو خالة مباشرين: احتمال كبير لتوارث الطفرات المتنحية (Autosomal Recessive) المؤثرة على الجهاز العصبي والسمع والنطق.',
        };
      case 'second_cousins':
        return {
          coefficient: 'F = 1/64 (1.56%)',
          riskLevel: 'متوسطة (Risque Modéré)',
          riskColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          desc: 'قرابة درجة ثانية بين العائلتين.',
        };
      case 'same_tribe':
        return {
          coefficient: 'F > 0 (Endogamie)',
          riskLevel: 'زواج داخلي من نفس العرش/اللقب',
          riskColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          desc: 'تزاوج داخلي ممتد عبر الأجيال (Homogénéité génétique).',
        };
      default:
        return {
          coefficient: 'F = 0 (0%)',
          riskLevel: 'منعدمة (Pas de consanguinité)',
          riskColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          desc: 'لا توجد قرابة عائلية معروفة بين الوالدين.',
        };
    }
  })();

  const handleToggleDisorder = (memberId, disorderId) => {
    if (readOnly) return;
    setData((prev) => ({
      ...prev,
      members: prev.members.map((m) => {
        if (m.id !== memberId) return m;
        const exists = m.disorders?.includes(disorderId);
        const updated = exists ? m.disorders.filter((d) => d !== disorderId) : [...(m.disorders || []), disorderId];
        return { ...m, disorders: updated };
      }),
    }));
  };

  const handleAddSibling = () => {
    if (!newSiblingName.trim()) return;
    const newId = `sibling_${Date.now()}`;
    const newMember = {
      id: newId,
      relation: newSiblingGender === 'male' ? 'أخ' : 'أخت',
      gender: newSiblingGender,
      generation: 3,
      name: newSiblingName.trim(),
      disorders: [],
    };
    setData((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
    setNewSiblingName('');
    setIsAddingSibling(false);
  };

  const handleDeleteMember = (memberId) => {
    if (readOnly || memberId === 'patient' || memberId === 'father' || memberId === 'mother') return;
    setData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== memberId),
    }));
    if (selectedMember?.id === memberId) setSelectedMember(null);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(data);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Group members by Generation
  const gen1 = data.members.filter((m) => m.generation === 1);
  const gen2 = data.members.filter((m) => m.generation === 2);
  const gen3 = data.members.filter((m) => m.generation === 3);

  const totalAffected = data.members.filter((m) => m.disorders?.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header & Consanguinity Alert */}
      <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">شجرة العائلة والأمراض الوراثية السريرية (Clinical Pedigree DZ)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                رصد السوابق العائلية لاضطرابات النطق، التوحد، الصرع، وحساب مؤشر القرابة الوالدية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center space-x-1.5 space-x-reverse px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all"
              >
                {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{savedSuccess ? 'تم الحفظ بنجاح ✓' : 'حفظ الشجرة العائلية'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Parental Consanguinity Selector Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-purple-300 mb-1.5 flex items-center space-x-1.5 space-x-reverse">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>القرابة الوالدية (Consanguinité Parentale):</span>
            </label>
            <select
              disabled={readOnly}
              value={data.consanguinity_degree}
              onChange={(e) => {
                const deg = e.target.value;
                setData({
                  ...data,
                  consanguinity_degree: deg,
                  consanguinity: deg !== 'none',
                });
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
            >
              <option value="none">🟢 لا توجد قرابة عائلية (Non consanguin)</option>
              <option value="first_cousins">🔴 قرابة درجة أولى: أبناء عم / خالة مباشرين (F = 1/16)</option>
              <option value="second_cousins">🟡 قرابة درجة ثانية: أبناء عمومة من الدرجة الثانية (F = 1/64)</option>
              <option value="same_tribe">🟣 زواج داخلي من نفس العرش / القبيلة (Endogamie)</option>
            </select>
          </div>

          <div className="md:col-span-2 p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start space-x-3 space-x-reverse">
            <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="font-bold text-white">مؤشر القرابة الوراثي:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${consanguinityInfo.riskColor}`}>
                  {consanguinityInfo.coefficient} &bull; {consanguinityInfo.riskLevel}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{consanguinityInfo.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Pedigree Canvas */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-8 relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <span className="w-3.5 h-3.5 rounded bg-blue-500/30 border border-blue-400 inline-block" />
              <span>ذكر (Homme ⏹)</span>
            </div>
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <span className="w-3.5 h-3.5 rounded-full bg-pink-500/30 border border-pink-400 inline-block" />
              <span>أنثى (Femme ⏺)</span>
            </div>
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <span className="w-3.5 h-3.5 rounded-full ring-2 ring-purple-500 bg-purple-500 inline-block" />
              <span>المريض المفحوص (Proband)</span>
            </div>
          </div>

          <div className="text-[11px] text-purple-300 font-bold">
            {totalAffected > 0 ? `⚠️ تم رصد اضطرابات لدى ${totalAffected} أفراد من العائلة` : '🟢 لا توجد سوابق اضطرابات عائلية مسجلة'}
          </div>
        </div>

        {/* GENERATION 1: GRANDPARENTS */}
        <div className="space-y-2 text-center">
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase block">الجيل الأول (Grand-Parents)</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {gen1.map((member) => (
              <PedigreeMemberCard
                key={member.id}
                member={member}
                isSelected={selectedMember?.id === member.id}
                onClick={() => setSelectedMember(member)}
              />
            ))}
          </div>
        </div>

        {/* Marriage & Descendance Connector Line */}
        <div className="flex items-center justify-center">
          <div className="w-px h-6 bg-slate-700" />
        </div>

        {/* GENERATION 2: PARENTS */}
        <div className="space-y-2 text-center">
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase block">الجيل الثاني: الوالدان (Parents)</span>
          <div className="flex items-center justify-center gap-6 max-w-md mx-auto">
            {gen2.map((member, idx) => (
              <React.Fragment key={member.id}>
                <PedigreeMemberCard
                  member={member}
                  isSelected={selectedMember?.id === member.id}
                  onClick={() => setSelectedMember(member)}
                />
                {idx === 0 && (
                  <div className="flex flex-col items-center">
                    {data.consanguinity ? (
                      <div className="text-center px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                        ═ زواج أقارب ═
                      </div>
                    ) : (
                      <div className="w-8 h-px bg-slate-700" />
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Connector to Offspring */}
        <div className="flex items-center justify-center">
          <div className="w-px h-6 bg-slate-700" />
        </div>

        {/* GENERATION 3: PATIENT & SIBLINGS */}
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center space-x-2 space-x-reverse">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
              الجيل الثالث: المريض والإخوة (Fratrie)
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => setIsAddingSibling(true)}
                className="text-[11px] font-bold text-teal-400 hover:text-teal-300 underline"
              >
                + إضافة أخ / أخت
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 max-w-2xl mx-auto">
            {gen3.map((member) => (
              <PedigreeMemberCard
                key={member.id}
                member={member}
                isSelected={selectedMember?.id === member.id}
                onClick={() => setSelectedMember(member)}
                onDelete={member.id !== 'patient' && !readOnly ? () => handleDeleteMember(member.id) : null}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Add Sibling Modal / Inline Form */}
      {isAddingSibling && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-3 animate-in fade-in">
          <h4 className="text-xs font-bold text-teal-300 flex items-center space-x-1.5 space-x-reverse">
            <UserPlus className="w-4 h-4" />
            <span>إضافة أخ أو أخت للشجرة العائلية:</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="اسم الأخ / الأخت..."
              value={newSiblingName}
              onChange={(e) => setNewSiblingName(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewSiblingGender('male')}
                className={`py-2 rounded-xl text-xs font-bold border ${
                  newSiblingGender === 'male' ? 'bg-blue-600/30 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                ذكر ⏹
              </button>
              <button
                type="button"
                onClick={() => setNewSiblingGender('female')}
                className={`py-2 rounded-xl text-xs font-bold border ${
                  newSiblingGender === 'female' ? 'bg-pink-600/30 border-pink-500 text-pink-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                أنثى ⏺
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddSibling}
                className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
              >
                تأكيد الإضافة
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSibling(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Details & Disorders Tagging Panel */}
      {selectedMember && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5 space-x-reverse">
              <div
                className={`w-8 h-8 flex items-center justify-center font-bold text-xs ${
                  selectedMember.gender === 'male' ? 'rounded bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30'
                }`}
              >
                {selectedMember.gender === 'male' ? '⏹' : '⏺'}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  السوابق السريرية لـ: <span className="text-purple-300">{selectedMember.name}</span> ({selectedMember.relation})
                </h4>
                <p className="text-[11px] text-slate-400">انقر على الاضطرابات لتفعيلها أو إزالتها في الشجرة العائلية</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMember(null)}
              className="text-xs text-slate-500 hover:text-white"
            >
              إغلاق ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CLINICAL_DISORDERS.map((d) => {
              const hasIt = selectedMember.disorders?.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleToggleDisorder(selectedMember.id, d.id)}
                  className={`p-2.5 rounded-xl text-start text-xs font-bold transition-all border flex flex-col justify-between ${
                    hasIt ? d.color : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] text-slate-400">{d.label_fr}</span>
                    <span className={`w-2 h-2 rounded-full ${hasIt ? d.dot : 'bg-slate-700'}`} />
                  </div>
                  <span>{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Pedigree Member Visual Card
function PedigreeMemberCard({ member, isSelected, onClick, onDelete }) {
  const isMale = member.gender === 'male';
  const hasDisorders = member.disorders && member.disorders.length > 0;

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer p-3 rounded-2xl border transition-all text-center space-y-1.5 ${
        isSelected
          ? 'bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20'
          : hasDisorders
          ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Icon Shape */}
      <div className="flex justify-center">
        <div
          className={`w-9 h-9 flex items-center justify-center font-bold text-xs transition-all ${
            isMale
              ? 'rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40'
              : 'rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40'
          } ${member.isPatient ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950' : ''}`}
        >
          {isMale ? '⏹' : '⏺'}
        </div>
      </div>

      <div className="text-[11px] font-bold text-white truncate max-w-[110px] mx-auto">
        {member.name}
      </div>
      <div className="text-[10px] text-slate-400 truncate">{member.relation}</div>

      {/* Disorders Badge */}
      {hasDisorders ? (
        <div className="flex flex-wrap justify-center gap-1 pt-1">
          {member.disorders.map((disorderId) => {
            const d = CLINICAL_DISORDERS.find((x) => x.id === disorderId);
            return (
              <span
                key={disorderId}
                title={d?.label}
                className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"
              />
            );
          })}
        </div>
      ) : (
        <div className="text-[9px] text-emerald-400/80 font-bold">سليم</div>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
}
