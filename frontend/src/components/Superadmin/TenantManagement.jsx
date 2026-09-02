import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, CheckCircle2, AlertTriangle, XCircle, Trash2, Edit, Stethoscope, Brain, Sparkles, Filter, ExternalLink, ShieldCheck } from 'lucide-react';
import { superadminApi } from '../../api';

export default function TenantManagement({ onOpenCreateTenant }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await superadminApi.listTenants({ per_page: 50 });
      setTenants(res.data || []);
    } catch (err) {
      console.error('Error loading tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await superadminApi.updateTenantStatus(id, { status: newStatus });
      fetchTenants();
    } catch (err) {
      alert(err.message || 'Erreur lors du changement de statut');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`⚠️ Attention : Supprimer définitivement le cabinet '${name}' ainsi que toutes ses données ?`)) {
      return;
    }
    try {
      await superadminApi.deleteTenant(id);
      fetchTenants();
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.subdomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span>Gestion des Cabinets Médicaux (Tenants)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Contrôle multi-tenant global, isolation des bases et gestion des abonnements
          </p>
        </div>

        <button
          onClick={onOpenCreateTenant}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provisionner un Nouveau Cabinet</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom de cabinet ou sous-domaine..."
            className="block w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif (Active)</option>
          <option value="trial">Période d'Essai (Trial)</option>
          <option value="suspended">Suspendu (Suspended)</option>
        </select>
      </div>

      {/* Tenants Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Cabinet & Sous-domaine</th>
                <th className="px-5 py-3.5">Spécialité & Wilaya</th>
                <th className="px-5 py-3.5">Administrateur Principal</th>
                <th className="px-5 py-3.5">Métriques Clés</th>
                <th className="px-5 py-3.5">Plan & Statut</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500 text-sm">
                    Chargement des cabinets...
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-slate-500 text-sm">
                    Aucun cabinet ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white text-sm">{t.name}</div>
                      <div className="text-amber-400 font-mono text-xs flex items-center space-x-1 mt-0.5">
                        <span>{t.subdomain}.clinic-saas.dz</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.type === 'orthophony'
                          ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                          : t.type === 'psychology'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {t.type === 'orthophony' ? <Stethoscope className="w-3 h-3" /> : t.type === 'psychology' ? <Brain className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                        <span>{t.type}</span>
                      </span>
                      <div className="text-slate-400 mt-1">{t.settings?.city || 'Algérie'}</div>
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-semibold text-slate-200">
                        {t.primary_admin ? t.primary_admin.name : 'Administrateur'}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {t.primary_admin?.email}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono text-slate-300">
                      <div className="flex items-center space-x-3">
                        <span title="Nombre de patients">👥 {t.patients_count || 0}</span>
                        <span title="Praticiens">🩺 {t.users_count || 0}</span>
                        <span title="Rendez-vous">📅 {t.appointments_count || 0}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-mono uppercase font-semibold text-slate-300">
                        Plan {t.subscription_meta?.plan || 'PRO'}
                      </div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : t.status === 'trial'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {t.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                          {t.status === 'trial' && <Sparkles className="w-3 h-3" />}
                          {t.status === 'suspended' && <AlertTriangle className="w-3 h-3" />}
                          <span>{t.status}</span>
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center space-x-1.5">
                        {t.status !== 'active' ? (
                          <button
                            onClick={() => handleStatusChange(t.id, 'active')}
                            title="Activer le cabinet"
                            className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold"
                          >
                            Activer
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(t.id, 'suspended')}
                            title="Suspendre l'accès du cabinet"
                            className="px-2 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-semibold"
                          >
                            Suspendre
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          title="Supprimer définitivement"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-500 border border-slate-700"
                        >
                          <Trash2 className="w-4 h-4" />
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
