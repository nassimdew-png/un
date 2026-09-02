import React, { useState, useEffect } from 'react';
import { Database, Download, Plus, RefreshCw, CheckCircle2, AlertCircle, HardDrive, ShieldCheck } from 'lucide-react';
import { superadminApi } from '../../api';

export default function DatabaseBackups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingName, setDownloadingName] = useState(null);
  const [message, setMessage] = useState('');

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await superadminApi.listBackups();
      setBackups(res.backups || []);
    } catch (err) {
      console.error('Error fetching backups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setGenerating(true);
    setMessage('');
    try {
      const res = await superadminApi.createBackup();
      setMessage(res.message || 'Sauvegarde créée avec succès.');
      fetchBackups();
    } catch (err) {
      alert(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (filename) => {
    setDownloadingName(filename);
    try {
      await superadminApi.downloadBackup(filename);
    } catch (err) {
      alert(err.message || 'Erreur de téléchargement');
    } finally {
      setDownloadingName(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Sauvegardes de la Base de Données (MySQL Dumps)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Exportations compressées `.sql.gz` de l'ensemble des données multi-tenants
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={generating}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          <span>{generating ? 'Génération du dump...' : 'Créer une Sauvegarde Maintenant'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Info Card */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center space-x-4">
        <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
          <HardDrive className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Stockage Sécurisé des Snapshots</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Toutes les sauvegardes sont chiffrées et archivées dans <code className="text-cyan-300 font-mono">/var/www/clinic-saas/backend/storage/app/backups/</code>.
          </p>
        </div>
      </div>

      {/* Backups Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Fichier de Sauvegarde</th>
                <th className="px-5 py-3.5">Date & Heure de Création</th>
                <th className="px-5 py-3.5">Taille Compressée (Gzip)</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-5 py-12 text-center text-slate-500 text-sm">
                    Chargement des sauvegardes...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-12 text-center text-slate-500 text-sm">
                    Aucune sauvegarde trouvée. Cliquez sur "Créer une Sauvegarde" pour générer la première.
                  </td>
                </tr>
              ) : (
                backups.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-white">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-cyan-400" />
                        <span>{b.filename}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-300 font-mono">
                      {b.created_at}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono font-semibold text-slate-200">
                      {b.size_kb} KB {b.size_mb > 0 && `(${b.size_mb} MB)`}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDownload(b.filename)}
                        disabled={downloadingName === b.filename}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{downloadingName === b.filename ? 'Téléchargement...' : 'Télécharger (.sql.gz)'}</span>
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
