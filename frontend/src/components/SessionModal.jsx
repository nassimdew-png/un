import React, { useState } from 'react';
import { sessionApi } from '../api';
import { Clock, Stethoscope, Brain, X, Check } from 'lucide-react';

export default function SessionModal({ isOpen, onClose, onSuccess, patients, tenant }) {
  const isOrthophony = tenant?.enabled_modules?.orthophony;
  const isPsychology = tenant?.enabled_modules?.psychology;

  const defaultSpecialty = isOrthophony ? 'orthophony' : isPsychology ? 'psychology' : 'orthophony';

  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 16));
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [specialty, setSpecialty] = useState(defaultSpecialty);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [exercisesInput, setExercisesInput] = useState('Loto des sons, Répétition de syllabes');
  const [progressNotes, setProgressNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const exercises_targeted = exercisesInput
      ? exercisesInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    try {
      await sessionApi.create({
        patient_id: patientId,
        session_date: sessionDate,
        duration_minutes: Number(durationMinutes),
        specialty,
        attendance_status: attendanceStatus,
        exercises_targeted,
        progress_notes: progressNotes,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création de la séance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nouvelle Séance de Suivi</h3>
              <p className="text-xs text-slate-400">Enregistrement clinique et assiduité</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Patient *
              </label>
              <select
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Spécialité de la Séance *
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500 font-semibold"
              >
                {isOrthophony && <option value="orthophony">🗣️ Orthophonie</option>}
                {isPsychology && <option value="psychology">🧠 Psychologie / TCC</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date & Heure *
              </label>
              <input
                type="datetime-local"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Durée (minutes) *
              </label>
              <input
                type="number"
                min="15"
                max="180"
                step="5"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Statut de Présence *
              </label>
              <select
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              >
                <option value="present">Présent</option>
                <option value="absent">Absent</option>
                <option value="excused">Excusé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Exercices & Outils Travaillés (séparés par des virgules)
            </label>
            <input
              type="text"
              value={exercisesInput}
              onChange={(e) => setExercisesInput(e.target.value)}
              placeholder="ex: Loto des phonèmes, Exercice de respiration, Colonne de Beck"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notes d'Évolution Clinique *
            </label>
            <textarea
              rows={3}
              required
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              placeholder="Progression du patient, difficultés rencontrées, consignes pour la prochaine séance..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
            />
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
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer la Séance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
