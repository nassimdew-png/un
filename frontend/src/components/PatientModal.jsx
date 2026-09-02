import React, { useState } from 'react';
import { patientApi } from '../api';
import { Stethoscope, Brain, Sparkles, X, Check, UserPlus } from 'lucide-react';

export default function PatientModal({ isOpen, onClose, onSuccess, tenant }) {
  const isOrthophony = tenant?.enabled_modules?.orthophony;
  const isPsychology = tenant?.enabled_modules?.psychology;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'male',
    guardian_name: '',
    phone: '',
    emergency_contact: '',
    kiosk_pin: Math.floor(100000 + Math.random() * 900000).toString(),
    consultation_reason: '',
    medical_history: '',
    speech_assessment: '',
    psychology_notes: '',
    therapy_type: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Build JSON anamnesis
      const anamnesis_data = {
        consultation_reason: formData.consultation_reason,
        medical_history: formData.medical_history,
        ...(isOrthophony && formData.speech_assessment ? { speech_assessment: formData.speech_assessment } : {}),
        ...(isPsychology && formData.psychology_notes ? { psychology_notes: formData.psychology_notes } : {}),
        ...(isPsychology && formData.therapy_type ? { therapy_type: formData.therapy_type } : {}),
      };

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        birth_date: formData.birth_date,
        gender: formData.gender,
        guardian_name: formData.guardian_name || null,
        phone: formData.phone,
        emergency_contact: formData.emergency_contact || null,
        kiosk_pin: formData.kiosk_pin || null,
        anamnesis_data,
      };

      await patientApi.create(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création du patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nouveau Dossier Patient</h3>
              <p className="text-xs text-slate-400">
                Cabinet : <span className="text-brand-300">{tenant?.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Civil Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="ex: Yanis"
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nom de Famille *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="ex: Meziani"
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date de Naissance *
              </label>
              <input
                type="date"
                required
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Genre *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              >
                <option value="male">Masculin (Garçon / Homme)</option>
                <option value="female">Féminin (Fille / Femme)</option>
              </select>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Téléphone Principal *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0661234567"
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tuteur Légal (si mineur)
              </label>
              <input
                type="text"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                placeholder="ex: Père, Mère..."
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                PIN Borne d'Accueil (6 chiffres)
              </label>
              <input
                type="text"
                maxLength={6}
                value={formData.kiosk_pin}
                onChange={(e) => setFormData({ ...formData, kiosk_pin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-brand-300 text-xs focus:ring-2 focus:ring-brand-500 font-mono font-bold"
              />
            </div>
          </div>

          {/* Anamnesis / Clinical Data */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <span>🩺 Données Cliniques & Anamnèse</span>
            </h4>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Motif Principal de Consultation *
              </label>
              <input
                type="text"
                required
                value={formData.consultation_reason}
                onChange={(e) => setFormData({ ...formData, consultation_reason: e.target.value })}
                placeholder="ex: Retard de langage, Bégaiement, Anxiété, Bilan d'orientation..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Antécédents Médicaux & Développementaux
              </label>
              <textarea
                rows={2}
                value={formData.medical_history}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                placeholder="Accouchement, otites, développement moteur, scolarité..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {isOrthophony && (
              <div>
                <label className="block text-[11px] font-medium text-fuchsia-300 mb-1 flex items-center space-x-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Notes Bilan Orthophonique</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.speech_assessment}
                  onChange={(e) => setFormData({ ...formData, speech_assessment: e.target.value })}
                  placeholder="Trouble d'articulation, phonologie, fluence, compréhension, syntaxe..."
                  className="w-full px-3 py-2 bg-slate-900 border border-fuchsia-500/30 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>
            )}

            {isPsychology && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-cyan-300 mb-1 flex items-center space-x-1">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Observations Psychologiques</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.psychology_notes}
                    onChange={(e) => setFormData({ ...formData, psychology_notes: e.target.value })}
                    placeholder="Comportement, état émotionnel, régulation cognitive..."
                    className="w-full px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-cyan-300 mb-1">
                    Approche Thérapeutique (TCC, Systémique...)
                  </label>
                  <input
                    type="text"
                    value={formData.therapy_type}
                    onChange={(e) => setFormData({ ...formData, therapy_type: e.target.value })}
                    placeholder="ex: TCC, Soutien intégratif, Thérapie familiale"
                    className="w-full px-3 py-2 bg-slate-900 border border-cyan-500/30 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Créer le Dossier Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
