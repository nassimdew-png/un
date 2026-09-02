import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Plus, User, Stethoscope, Brain, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { sessionApi } from '../api';

export default function TherapySessions({ tenant, patients, onOpenAddSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await sessionApi.list({ per_page: 50 });
      setSessions(res.data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette séance ?')) return;
    try {
      await sessionApi.delete(id);
      fetchSessions();
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>Séances de Rééducation & Consultations</span>
          </h2>
          <p className="text-xs text-slate-400">
            {tenant?.name} • Suivi chronologique des séances, assiduité et exercices travaillés
          </p>
        </div>

        <button
          onClick={onOpenAddSession}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Séance</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Date & Heure</th>
                <th className="px-5 py-3.5">Patient</th>
                <th className="px-5 py-3.5">Spécialité & Praticien</th>
                <th className="px-5 py-3.5">Durée</th>
                <th className="px-5 py-3.5">Statut Assiduité</th>
                <th className="px-5 py-3.5">Notes d'Évolution & Exercices</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500 text-sm">
                    Chargement des séances...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500 text-sm">
                    Aucune séance enregistrée pour le moment.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-300">
                      <div className="font-bold text-white">{s.session_date?.split('T')[0] || s.session_date}</div>
                      <div className="text-slate-500">{s.session_date?.split('T')[1]?.substring(0, 5) || '10:00'}</div>
                    </td>

                    <td className="px-5 py-3.5 font-bold text-white text-xs">
                      {s.patient ? `${s.patient.first_name} ${s.patient.last_name}` : 'N/A'}
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <div className="flex items-center space-x-1 font-semibold text-slate-200">
                        {s.specialty === 'orthophony' ? (
                          <Stethoscope className="w-3.5 h-3.5 text-fuchsia-400" />
                        ) : (
                          <Brain className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span className="capitalize">{s.specialty}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{s.specialist?.name}</div>
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono font-semibold text-slate-300">
                      {s.duration_minutes} min
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.attendance_status === 'present'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : s.attendance_status === 'absent'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {s.attendance_status === 'present' && <CheckCircle className="w-3 h-3" />}
                        {s.attendance_status === 'absent' && <XCircle className="w-3 h-3" />}
                        {s.attendance_status === 'excused' && <AlertCircle className="w-3 h-3" />}
                        <span>{s.attendance_status}</span>
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-300 max-w-xs">
                      <p className="line-clamp-2">{s.progress_notes || 'Aucune note particulière.'}</p>
                      {s.exercises_targeted && Array.isArray(s.exercises_targeted) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.exercises_targeted.map((ex, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                              {ex}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-500 border border-slate-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
