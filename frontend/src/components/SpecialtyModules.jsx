import React from 'react';
import { Stethoscope, Brain, Sparkles, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export function OrthophonyModule({ patients }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Stethoscope className="w-5 h-5 text-fuchsia-400" />
            <span>Module Spécialisé Orthophonie (Algérie)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Évaluations du langage oral, écrit, bégaiement et rééducation phonologique
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-fuchsia-500/20">
          <span className="text-xs font-semibold text-fuchsia-400 uppercase">Langage Oral</span>
          <div className="mt-2 text-2xl font-bold text-white">Retards & Troubles</div>
          <p className="mt-1 text-xs text-slate-400">Articulations, dysphasies et retards simples</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-fuchsia-500/20">
          <span className="text-xs font-semibold text-fuchsia-400 uppercase">Langage Écrit</span>
          <div className="mt-2 text-2xl font-bold text-white">Dyslexie / Dysorthographie</div>
          <p className="mt-1 text-xs text-slate-400">Parcours scolaire primaire et CEM</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-fuchsia-500/20">
          <span className="text-xs font-semibold text-fuchsia-400 uppercase">Fluence & Voix</span>
          <div className="mt-2 text-2xl font-bold text-white">Bégaiement & Dysphonies</div>
          <p className="mt-1 text-xs text-slate-400">Gestion du souffle et débit verbal</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4">Bilans Orthophoniques Récents</h3>
        <div className="space-y-3">
          {patients.map((p) => (
            <div key={p.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-white">{p.first_name} {p.last_name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
                    {p.gender === 'male' ? 'Garçon' : 'Fille'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Motif : <span className="text-slate-200">{p.anamnesis_data?.consultation_reason}</span>
                </p>
                {p.anamnesis_data?.speech_assessment && (
                  <p className="text-xs text-fuchsia-400 mt-0.5">
                    Évaluation : {p.anamnesis_data.speech_assessment}
                  </p>
                )}
              </div>
              <span className="text-xs font-mono text-slate-400 font-semibold">{p.phone}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PsychologyModule({ patients }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <span>Module Spécialisé Psychologie Clinique</span>
          </h2>
          <p className="text-xs text-slate-400">
            Psychothérapie, Thérapies Cognitivo-Comportementales (TCC) et guidance parentale
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-cyan-500/20">
          <span className="text-xs font-semibold text-cyan-400 uppercase">Thérapies TCC</span>
          <div className="mt-2 text-2xl font-bold text-white">Anxiété & Phobies</div>
          <p className="mt-1 text-xs text-slate-400">Exposition et restructuration cognitive</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-cyan-500/20">
          <span className="text-xs font-semibold text-cyan-400 uppercase">Enfance & Ado</span>
          <div className="mt-2 text-2xl font-bold text-white">TDAH & Troubles de l'Humeur</div>
          <p className="mt-1 text-xs text-slate-400">Remédiation et soutien scolaire</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-cyan-500/20">
          <span className="text-xs font-semibold text-cyan-400 uppercase">Systémique</span>
          <div className="mt-2 text-2xl font-bold text-white">Guidance Familiale</div>
          <p className="mt-1 text-xs text-slate-400">Accompagnement de la dynamique parentale</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4">Suivis Psychologiques Récents</h3>
        <div className="space-y-3">
          {patients.map((p) => (
            <div key={p.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-white">{p.first_name} {p.last_name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {p.gender === 'male' ? 'Homme' : 'Femme'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Motif : <span className="text-slate-200">{p.anamnesis_data?.consultation_reason}</span>
                </p>
                {p.anamnesis_data?.therapy_type && (
                  <p className="text-xs text-cyan-400 mt-0.5">
                    Protocole : {p.anamnesis_data.therapy_type}
                  </p>
                )}
              </div>
              <span className="text-xs font-mono text-slate-400 font-semibold">{p.phone}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
