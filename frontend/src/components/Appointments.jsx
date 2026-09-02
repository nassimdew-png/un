import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, User, CheckCircle2, XCircle, AlertCircle, Trash2, DollarSign, Filter } from 'lucide-react';
import { appointmentApi } from '../api';

export default function Appointments({ tenant, patients, onOpenAddAppointment, onOpenAddInvoiceForAppointment }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.list({ per_page: 50 });
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await appointmentApi.update(id, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce rendez-vous ?')) return;
    try {
      await appointmentApi.delete(id);
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    return statusFilter ? app.status === statusFilter : true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-brand-400" />
            <span>Gestion des Rendez-vous & Agenda</span>
          </h2>
          <p className="text-xs text-slate-400">
            {tenant?.name} • Synchronisation en temps réel avec la Borne d'accueil (Kiosk PIN)
          </p>
        </div>

        <button
          onClick={onOpenAddAppointment}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Planifier un Rendez-vous</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card rounded-2xl p-3 border border-slate-800 flex items-center space-x-2 overflow-x-auto">
        <span className="text-xs font-semibold text-slate-400 px-2 flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtrer :</span>
        </span>
        {['', 'confirmed', 'scheduled', 'completed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              statusFilter === st
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {st === '' ? 'Tous les RDV' : st === 'confirmed' ? 'Présents / Confirmés' : st === 'scheduled' ? 'Programmés' : st === 'completed' ? 'Terminés' : 'Annulés'}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Date & Heure</th>
                <th className="px-5 py-3.5">Patient</th>
                <th className="px-5 py-3.5">Praticien / Spécialité</th>
                <th className="px-5 py-3.5">Type & Notes</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500 text-sm">
                    Chargement des rendez-vous...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500 text-sm">
                    Aucun rendez-vous trouvé avec ce filtre.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-mono">
                      <div className="font-bold text-white text-sm">
                        {app.appointment_date?.split('T')[0] || app.appointment_date}
                      </div>
                      <div className="text-brand-400 font-semibold">
                        ⏰ {app.appointment_date?.split('T')[1]?.substring(0, 5) || '10:00'}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-bold text-white text-sm">
                        {app.patient ? `${app.patient.first_name} ${app.patient.last_name}` : 'N/A'}
                      </div>
                      <div className="text-slate-400 font-mono mt-0.5">{app.patient?.phone}</div>
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-semibold text-slate-200">{app.specialist?.name}</div>
                      <div className="text-[11px] text-slate-400">{app.specialist?.role}</div>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-300 max-w-xs">
                      <span className="font-semibold text-slate-200 capitalize block">
                        {app.type?.replace(/_/g, ' ')}
                      </span>
                      <p className="text-slate-400 truncate mt-0.5">{app.notes || '---'}</p>
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        app.status === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                          : app.status === 'completed'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : app.status === 'scheduled'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {app.status === 'confirmed' ? '✅ Présent (Salle d\'attente)' : app.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        {app.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(app.id, 'completed')}
                            title="Marquer comme terminé"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-400 border border-slate-700 text-xs"
                          >
                            Terminer
                          </button>
                        )}

                        <button
                          onClick={() => onOpenAddInvoiceForAppointment(app)}
                          title="Générer la facture d'honoraires"
                          className="px-2.5 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 text-xs font-semibold flex items-center space-x-1 transition-all"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Facturer</span>
                        </button>

                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-500 border border-slate-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
