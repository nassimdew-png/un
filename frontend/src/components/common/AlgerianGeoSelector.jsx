import React, { useMemo } from 'react';
import { ALGERIAN_WILAYAS, getCommunesForWilaya } from '../../data/algerianWilayasCommunes';
import { MapPin } from 'lucide-react';

export default function AlgerianGeoSelector({
  wilayaCode = '16',
  communeName = '',
  onChange,
  onWilayaChange,
  onCommuneChange,
  className = '',
  disabled = false,
}) {
  const communes = useMemo(() => {
    return getCommunesForWilaya(wilayaCode);
  }, [wilayaCode]);

  const handleWilayaSelect = (e) => {
    const newCode = e.target.value;
    if (typeof onWilayaChange === 'function') {
      onWilayaChange(newCode);
    }
    const newCommunes = getCommunesForWilaya(newCode);
    const newCommune = (newCommunes.length > 0 && !newCommunes.includes(communeName)) ? newCommunes[0] : (communeName || '');
    if (typeof onCommuneChange === 'function') {
      onCommuneChange(newCommune);
    }
    if (typeof onChange === 'function') {
      onChange({ wilayaCode: newCode, communeName: newCommune });
    }
  };

  const handleCommuneSelect = (e) => {
    const newCommune = e.target.value;
    if (typeof onCommuneChange === 'function') {
      onCommuneChange(newCommune);
    }
    if (typeof onChange === 'function') {
      onChange({ wilayaCode: wilayaCode || '16', communeName: newCommune });
    }
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5 space-x-reverse">
          <MapPin className="w-3.5 h-3.5 text-teal-400" />
          <span>الولاية (Wilaya - 58)</span>
        </label>
        <select
          value={wilayaCode || '16'}
          disabled={disabled}
          onChange={handleWilayaSelect}
          className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-all"
        >
          {ALGERIAN_WILAYAS.map((w) => (
            <option key={w.code} value={w.code}>
              {w.name_ar} ({w.name_fr})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5 space-x-reverse">
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          <span>البلدية / الدائرة (Commune)</span>
        </label>
        <select
          value={communeName || ''}
          disabled={disabled}
          onChange={handleCommuneSelect}
          className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-all"
        >
          <option value="">-- اختر البلدية --</option>
          {communes.map((commune, idx) => (
            <option key={idx} value={commune}>
              {commune}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
