import React, { useState } from 'react';
import { appointmentApi } from '../api';
import { Calendar, User, Clock, X, Check } from 'lucide-react';

export default function AppointmentModal({ isOpen, onClose, onSuccess, patients, user, tenant }) {
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [type, setType] = useState('follow_up');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await appointmentApi.create({
        patient_id: patientId,
        specialist_id: user.id,
        appointment_date: appointmentDate,
        type,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la planification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Planifier un Rendez-vous</h3>
              <p className="text-xs text-slate-400">Cabinet : {tenant?.name}</p>
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
                  {p.first_name} {p.last_name} ({p.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date & Heure *
              </label>
              <input
                type="datetime-local"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Type de Consultation *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              >
                <option value="follow_up">Séance de Suivi</option>
                <option value="initial_consultation">Première Consultation</option>
                <option value="assessment">Passation de Bilan</option>
                <option value="therapy_session">Rééducation Intensive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Motif / Notes complémentaires
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Suivi de langage, apporter les derniers bilans scolaires..."
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
              <span>{loading ? 'Planification...' : 'Confirmer le Rendez-vous'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
