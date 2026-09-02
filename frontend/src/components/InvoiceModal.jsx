import React, { useState } from 'react';
import { invoiceApi } from '../api';
import { DollarSign, Plus, Trash2, X, Check, CreditCard } from 'lucide-react';

export default function InvoiceModal({ isOpen, onClose, onSuccess, patients, tenant, preselectedAppointment }) {
  const [patientId, setPatientId] = useState(
    preselectedAppointment?.patient_id || patients[0]?.id || ''
  );
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [items, setItems] = useState([
    {
      description: preselectedAppointment ? `Séance de consultation (${preselectedAppointment.type})` : 'Séance de rééducation clinique',
      quantity: 1,
      unit_price: 3500,
    }
  ]);

  const totalAmount = items.reduce((acc, item) => acc + (Number(item.quantity) || 1) * (Number(item.unit_price) || 0), 0);
  const [paidAmount, setPaidAmount] = useState(totalAmount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { description: 'Acte complémentaire', quantity: 1, unit_price: 2000 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await invoiceApi.create({
        patient_id: patientId,
        appointment_id: preselectedAppointment?.id || null,
        total_amount: totalAmount,
        paid_amount: Number(paidAmount),
        payment_method: paymentMethod,
        issued_date: issuedDate,
        due_date: dueDate || null,
        items,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création de la facture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-modal rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Établir une Facture / Reçu d'Honoraires</h3>
              <p className="text-xs text-slate-400">Cabinet : {tenant?.name} • Monnaie : Dinar Algérien (DZD)</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Patient à Facturer *
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mode de Règlement *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500 font-semibold"
              >
                <option value="cash">💵 Espèces (Cash)</option>
                <option value="baridimob">📱 BaridiMob / Algérie Poste</option>
                <option value="card">💳 Carte CIB / Bancaire</option>
                <option value="bank_transfer">🏛️ Virement Bancaire</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date d'Émission *
              </label>
              <input
                type="date"
                required
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date d'Échéance (Optionnel)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Dynamic Items Rows */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Prestations & Actes Facturés
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Désignation de l'acte..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs"
                />
                <input
                  type="number"
                  min="1"
                  required
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                  placeholder="Qté"
                  className="w-16 px-2 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs text-center font-mono"
                />
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={item.unit_price}
                  onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                  placeholder="Prix DZD"
                  className="w-28 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs text-right font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length <= 1}
                  className="p-2 text-slate-500 hover:text-red-400 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Totals Summary */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col items-end space-y-1.5 text-xs">
              <div className="flex justify-between w-64 text-slate-400">
                <span>Total Honoraires :</span>
                <span className="font-mono font-bold text-white text-sm">{totalAmount.toLocaleString()} DZD</span>
              </div>
              <div className="flex items-center justify-between w-64">
                <span className="text-slate-300 font-semibold">Montant Réglé :</span>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-28 px-2 py-1 bg-slate-900 border border-emerald-500/40 rounded-lg text-emerald-400 font-mono font-bold text-xs text-right"
                />
              </div>
              <div className="flex justify-between w-64 text-slate-400">
                <span>Reste Dû :</span>
                <span className="font-mono font-bold text-amber-400">
                  {Math.max(0, totalAmount - paidAmount).toLocaleString()} DZD
                </span>
              </div>
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
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Émission...' : 'Émettre la Facture'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
