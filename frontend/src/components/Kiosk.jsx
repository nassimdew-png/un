import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kioskApi } from '../api';
import { Sparkles, CheckCircle2, AlertCircle, ArrowLeft, Delete, Building2 } from 'lucide-react';

export default function Kiosk({ tenant }) {
  const navigate = useNavigate();
  const [subdomain, setSubdomain] = useState(tenant?.subdomain || 'elbiar-ortho');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 6) {
        submitCheckIn(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
    setResult(null);
  };

  const submitCheckIn = async (code) => {
    setError('');
    setLoading(true);
    try {
      const res = await kioskApi.checkIn({
        kiosk_pin: code,
        subdomain: subdomain || 'elbiar-ortho',
      });
      setResult(res);
      setPin('');
    } catch (err) {
      setError(err.message || 'Code PIN introuvable. Veuillez vous présenter à l accueil.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-brand-500/20">
            🏥
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{tenant?.name || 'Borne Médicale ClinicSaaS'}</h1>
            <p className="text-xs text-slate-400">Enregistrement Patient & Salle d'Attente</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!tenant && (
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-brand-400" />
              <select
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none"
              >
                <option value="elbiar-ortho" className="bg-slate-900 text-slate-200">Cabinet Orthophonie Alger</option>
                <option value="oran-psy" className="bg-slate-900 text-slate-200">Clinique Psychologie Oran</option>
                <option value="constantine-sante" className="bg-slate-900 text-slate-200">Centre Constantine</option>
              </select>
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quitter</span>
          </button>
        </div>
      </div>

      {/* Main Check-in Body */}
      <div className="max-w-md w-full mx-auto my-auto z-10 space-y-6 text-center">
        {result ? (
          <div className="glass-modal rounded-3xl p-8 border border-emerald-500/40 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">{result.message}</h2>
              <p className="text-sm text-emerald-300 font-semibold mt-1">
                {result.patient?.appointment_time ? `Rendez-vous prévu à : ${result.patient.appointment_time}` : ''}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              Votre arrivée a été notifiée à votre praticien. Veuillez vous installer confortablement en salle d'attente.
            </div>

            <button
              onClick={handleClear}
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all"
            >
              Patient Suivant
            </button>
          </div>
        ) : (
          <div className="glass-modal rounded-3xl p-8 border border-slate-800/80 shadow-2xl space-y-6">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-brand-400">
                🇩🇿 مرحباً بكم • Bienvenue
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1">
                Saisissez votre code PIN (6 chiffres)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Indiqué sur votre fiche patient ou reçu par SMS
              </p>
            </div>

            {/* PIN Display Boxes */}
            <div className="flex justify-center items-center space-x-2.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-11 h-13 sm:w-12 sm:h-14 rounded-2xl border flex items-center justify-center text-xl font-mono font-bold transition-all ${
                    pin[i]
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300 shadow-md shadow-brand-500/20'
                      : 'border-slate-800 bg-slate-900/80 text-slate-600'
                  }`}
                >
                  {pin[i] ? '●' : ''}
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={loading}
                  onClick={() => handleKeyPress(String(num))}
                  className="py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-brand-600 active:text-white border border-slate-800 text-lg font-bold text-slate-100 transition-all shadow-md"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="py-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-400 transition-all"
              >
                Effacer
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleKeyPress('0')}
                className="py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-brand-600 active:text-white border border-slate-800 text-lg font-bold text-slate-100 transition-all shadow-md"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="py-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500 z-10">
        Système Médical ClinicSaaS &bull; Borne Interactive &bull; Version 2.0
      </div>
    </div>
  );
}
