import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Building2, Users, Database, DollarSign, Stethoscope, Brain, Sparkles, ArrowUpRight, Plus, RefreshCw, Calendar } from 'lucide-react';
import { superadminApi } from '../../api';

export default function SuperadminDashboard({ onOpenCreateTenant }) {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await superadminApi.getMetrics();
      setMetrics(res);
    } catch (err) {
      console.error('Error fetching superadmin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-slate-900/60 border border-amber-500/30 p-6 sm:p-8">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Panneau de Contrôle Superadministrateur Global</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Supervision de la Plateforme ClinicSaaS DZ
          </h2>
          <p className="mt-1 text-sm text-slate-300 max-w-2xl">
            Gestion globale des cabinets d'orthophonie et de psychologie en Algérie. Provisionnement, suivi des quotas, et sauvegardes de données.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreateTenant}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Cabinet</span>
            </button>

            <button
              onClick={() => navigate('/superadmin/tenants')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Gérer les Cabinets</span>
            </button>

            <button
              onClick={() => navigate('/superadmin/backups')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-cyan-500/30 transition-all"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Sauvegardes DB</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cabinets Déployés</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {metrics ? metrics.tenants.total : '...'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              ({metrics ? metrics.tenants.active : 0} Actifs)
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {metrics ? `${metrics.tenants.trial} en essai, ${metrics.tenants.suspended} suspendus` : ''}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patients Globaux</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {metrics ? metrics.clinical.total_patients : '...'}
            </span>
            <span className="text-xs text-brand-300 font-semibold">
              ({metrics ? metrics.clinical.total_specialists : 0} praticiens)
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Dossiers médicaux isolés</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume d'Actes & Bilans</span>
            <div className="p-2 rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-white">
              {metrics ? metrics.clinical.total_appointments : '...'}
            </span>
            <span className="text-xs text-fuchsia-300 font-semibold">
              RDV enregistrés
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {metrics ? `${metrics.clinical.total_assessments} bilans & ${metrics.clinical.total_sessions} séances` : ''}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Facturation Globale</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-extrabold text-emerald-400 font-mono">
              {metrics ? Number(metrics.financial.total_billed_dzd).toLocaleString() : '...'} DZD
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {metrics ? `Encaissé : ${Number(metrics.financial.total_collected_dzd).toLocaleString()} DZD` : ''}
          </p>
        </div>
      </div>

      {/* Specialties Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-fuchsia-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-fuchsia-500/20 text-fuchsia-300">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cabinets d'Orthophonie</h4>
              <p className="text-xs text-fuchsia-300 font-semibold">
                {metrics ? metrics.specialties_distribution.orthophony : 0} structures actives
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cabinets de Psychologie</h4>
              <p className="text-xs text-cyan-300 font-semibold">
                {metrics ? metrics.specialties_distribution.psychology : 0} structures actives
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-emerald-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Centres Pluridisciplinaires</h4>
              <p className="text-xs text-emerald-300 font-semibold">
                {metrics ? metrics.specialties_distribution.multidisciplinary : 0} structures actives
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
