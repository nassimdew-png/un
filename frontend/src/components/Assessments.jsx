import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus, Stethoscope, Brain, Calendar, User, Eye, Trash2, CheckCircle2 } from 'lucide-react';
import { assessmentApi } from '../api';

export default function Assessments({ tenant, patients, onOpenAddAssessment }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await assessmentApi.list({ per_page: 50 });
      setAssessments(res.data || []);
    } catch (err) {
      console.error('Error loading assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleDownloadPdf = async (id, patientName) => {
    setDownloadingId(id);
    try {
      await assessmentApi.downloadPdf(id, `Bilan_Medical_${patientName}_${id}.pdf`);
    } catch (err) {
      alert(err.message || 'Erreur lors du téléchargement du PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce bilan clinique ?')) return;
    try {
      await assessmentApi.delete(id);
      fetchAssessments();
    } catch (err) {
      alert(err.message || 'Erreur de suppression');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-brand-400" />
            <span>Bilans Cliniques & Comptes-Rendus Médicaux</span>
          </h2>
          <p className="text-xs text-slate-400">
            {tenant?.name} • Générateur de rapports PDF officiels aux normes algériennes
          </p>
        </div>

        <button
          onClick={onOpenAddAssessment}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Bilan Médical</span>
        </button>
      </div>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-slate-500 text-sm">
            Chargement des bilans cliniques...
          </div>
        ) : assessments.length === 0 ? (
          <div className="col-span-2 glass-card rounded-2xl p-8 text-center text-slate-500 text-sm">
            Aucun bilan enregistré pour l'instant. Cliquez sur "Nouveau Bilan Médical" pour commencer.
          </div>
        ) : (
          assessments.map((a) => {
            const isOrtho = a.type === 'orthophony_bilan';
            const isPsy = a.type === 'psychometric_eval';

            return (
              <div
                key={a.id}
                className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isOrtho
                        ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                        : isPsy
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {isOrtho ? <Stethoscope className="w-3 h-3" /> : isPsy ? <Brain className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      <span>{isOrtho ? 'Orthophonie' : isPsy ? 'Psychologie' : 'Général'}</span>
                    </span>

                    <span className="text-xs text-slate-400 flex items-center space-x-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{a.assessment_date?.split('T')[0] || a.assessment_date}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-2.5 leading-snug">
                    {a.title}
                  </h3>

                  <div className="mt-2 text-xs text-slate-300 flex items-center space-x-2">
                    <span className="font-semibold text-brand-300">
                      Patient : {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : 'N/A'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">Praticien : {a.specialist?.name}</span>
                  </div>

                  {/* Conclusion preview */}
                  {a.diagnostic_conclusion && (
                    <p className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 line-clamp-2">
                      <strong className="text-slate-400">Diagnostic : </strong>
                      {a.diagnostic_conclusion}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setSelectedAssessment(a)}
                    className="text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Détails</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadPdf(a.id, a.patient?.last_name || 'Patient')}
                      disabled={downloadingId === a.id}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 text-xs font-semibold transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadingId === a.id ? 'Export...' : 'Télécharger PDF'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-500 border border-slate-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assessment Details View Modal */}
      {selectedAssessment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-modal rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedAssessment.title}</h3>
                <p className="text-xs text-slate-400">
                  Patient : {selectedAssessment.patient?.first_name} {selectedAssessment.patient?.last_name} &bull; Date : {selectedAssessment.assessment_date}
                </p>
              </div>
              <button onClick={() => setSelectedAssessment(null)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <h4 className="font-bold text-brand-400 uppercase tracking-wider">Résultats des Épreuves & Scores</h4>
                {selectedAssessment.results_data ? (
                  Object.entries(selectedAssessment.results_data).map(([k, v]) => (
                    <div key={k} className="border-b border-slate-900 pb-1.5">
                      <span className="font-semibold text-slate-400 capitalize">{k.replace(/_/g, ' ')} : </span>
                      <span className="text-slate-200">{String(v)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Aucune donnée chiffrée.</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <h4 className="font-bold text-emerald-400 uppercase tracking-wider mb-1">Conclusion Diagnostique</h4>
                <p className="text-slate-200">{selectedAssessment.diagnostic_conclusion}</p>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30">
                <h4 className="font-bold text-blue-400 uppercase tracking-wider mb-1">Recommandations Thérapeutiques</h4>
                <p className="text-slate-200">{selectedAssessment.recommendations}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedAssessment(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Fermer
              </button>

              <button
                onClick={() => handleDownloadPdf(selectedAssessment.id, selectedAssessment.patient?.last_name || 'Patient')}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Exporter le Compte-Rendu PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
