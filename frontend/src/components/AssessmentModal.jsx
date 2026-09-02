import React, { useState } from 'react';
import { assessmentApi } from '../api';
import { Stethoscope, Brain, FileText, X, Check, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function AssessmentModal({ isOpen, onClose, onSuccess, patients, tenant }) {
  const isOrthophony = tenant?.enabled_modules?.orthophony;
  const isPsychology = tenant?.enabled_modules?.psychology;

  const defaultType = isOrthophony ? 'orthophony_bilan' : isPsychology ? 'psychometric_eval' : 'initial_anamnesis';

  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);

  // Orthophony specific
  const [phonologyNotes, setPhonologyNotes] = useState('Sigmatisme interdental sur /s/ et /z/');
  const [compScore, setCompScore] = useState('18/20 (Normal)');
  const [readingSpeed, setReadingSpeed] = useState('75 mots/min');

  // Psychology specific
  const [gad7Score, setGad7Score] = useState(12);
  const [phq9Score, setPhq9Score] = useState(8);
  const [cognitiveNotes, setCognitiveNotes] = useState('Pensées automatiques négatives liées à la performance');

  const [diagnosticConclusion, setDiagnosticConclusion] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let results_data = {};
    if (type === 'orthophony_bilan') {
      results_data = {
        phonologie_articulation: phonologyNotes,
        comprehension_syntaxique: compScore,
        vitesse_lecture_debit: readingSpeed,
      };
    } else if (type === 'psychometric_eval') {
      results_data = {
        echelle_anxiete_gad7: `${gad7Score}/21 (${gad7Score >= 15 ? 'Sévère' : gad7Score >= 10 ? 'Modéré' : 'Léger'})`,
        echelle_depression_phq9: `${phq9Score}/27 (${phq9Score >= 15 ? 'Sévère' : phq9Score >= 10 ? 'Modéré' : 'Léger'})`,
        observations_cognitives: cognitiveNotes,
      };
    } else {
      results_data = {
        bilan_general: phonologyNotes || cognitiveNotes,
      };
    }

    try {
      await assessmentApi.create({
        patient_id: patientId,
        type,
        title: title || (type === 'orthophony_bilan' ? 'Bilan Orthophonique Standard' : 'Évaluation Psychométrique'),
        assessment_date: assessmentDate,
        results_data,
        diagnostic_conclusion: diagnosticConclusion,
        recommendations,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de l enregistrement du bilan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nouveau Bilan & Évaluation Clinique</h3>
              <p className="text-xs text-slate-400">Génération automatique du rapport médical PDF</p>
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
          {/* Patient Selection & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Patient Concerné *
              </label>
              <select
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.gender === 'male' ? 'M' : 'F'} - {p.birth_date?.split('T')[0] || p.birth_date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Type de Bilan *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500 font-semibold"
              >
                {isOrthophony && <option value="orthophony_bilan">🗣️ Bilan Orthophonique Complet</option>}
                {isPsychology && <option value="psychometric_eval">🧠 Évaluation Psychométrique (GAD-7/PHQ-9)</option>}
                <option value="initial_anamnesis">📋 Anamnèse & Bilan d'Entrée</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Titre du Compte-Rendu *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Bilan Phonologique Initial"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date de Passation *
              </label>
              <input
                type="date"
                required
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Specialty Specific Grids */}
          {type === 'orthophony_bilan' && (
            <div className="p-4 rounded-xl bg-fuchsia-950/20 border border-fuchsia-500/30 space-y-3">
              <h4 className="text-xs font-bold text-fuchsia-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Stethoscope className="w-4 h-4" />
                <span>Grille d'Évaluation Orthophonique</span>
              </h4>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Phonologie & Articulation (Erreurs / Substitutions)
                </label>
                <input
                  type="text"
                  value={phonologyNotes}
                  onChange={(e) => setPhonologyNotes(e.target.value)}
                  placeholder="ex: Sigmatisme interdental /s/, omission des finales"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Compréhension Syntaxique
                  </label>
                  <input
                    type="text"
                    value={compScore}
                    onChange={(e) => setCompScore(e.target.value)}
                    placeholder="Score /20"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Vitesse de Lecture & Fluence
                  </label>
                  <input
                    type="text"
                    value={readingSpeed}
                    onChange={(e) => setReadingSpeed(e.target.value)}
                    placeholder="ex: 75 mots/min"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
              </div>
            </div>
          )}

          {type === 'psychometric_eval' && (
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-4">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Brain className="w-4 h-4" />
                <span>Échelles Psychométriques Standardisées</span>
              </h4>

              {/* GAD-7 Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Échelle d'Anxiété GAD-7 (0 - 21)</span>
                  <span className="font-bold text-cyan-400">{gad7Score} / 21 ({gad7Score >= 15 ? 'Anxiété Sévère' : gad7Score >= 10 ? 'Anxiété Modérée' : 'Légère'})</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="21"
                  value={gad7Score}
                  onChange={(e) => setGad7Score(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* PHQ-9 Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Échelle de Dépression PHQ-9 (0 - 27)</span>
                  <span className="font-bold text-cyan-400">{phq9Score} / 27 ({phq9Score >= 15 ? 'Sévère' : phq9Score >= 10 ? 'Modéré' : 'Léger'})</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="27"
                  value={phq9Score}
                  onChange={(e) => setPhq9Score(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Schémas Cognitifs & Observations Thérapeutiques
                </label>
                <input
                  type="text"
                  value={cognitiveNotes}
                  onChange={(e) => setCognitiveNotes(e.target.value)}
                  placeholder="ex: Hypervigilance, évitement, pensées catastrophistes..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Diagnostic & Recommendations */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Conclusion Clinique & Diagnostic *
              </label>
              <textarea
                rows={2}
                required
                value={diagnosticConclusion}
                onChange={(e) => setDiagnosticConclusion(e.target.value)}
                placeholder="Diagnostic précis établi selon les épreuves administrées..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Préconisations & Projet Thérapeutique *
              </label>
              <textarea
                rows={2}
                required
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Fréquence des séances, axes de rééducation ou protocole TCC..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>
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
              <span>{loading ? 'Génération...' : 'Enregistrer le Bilan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
