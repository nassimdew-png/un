import React, { useState, useEffect } from 'react';
import { DollarSign, Download, Plus, CheckCircle, Clock, AlertTriangle, Trash2, Filter } from 'lucide-react';
import { invoiceApi } from '../api';

export default function Billing({ tenant, patients, onOpenAddInvoice }) {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ total_billed: 0, total_paid: 0, unpaid_balance: 0 });
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.list({ per_page: 50 });
      setInvoices(res.invoices?.data || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownloadPdf = async (id, invoiceNumber) => {
    setDownloadingId(id);
    try {
      await invoiceApi.downloadPdf(id, `Recu_${invoiceNumber}.pdf`);
    } catch (err) {
      alert(err.message || 'Erreur lors du téléchargement');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette facture ?')) return;
    try {
      await invoiceApi.delete(id);
      fetchInvoices();
    } catch (err) {
      alert(err.message || 'Erreur de suppression');
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    return statusFilter ? inv.payment_status === statusFilter : true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Facturation & Encaissements d'Honoraires</span>
          </h2>
          <p className="text-xs text-slate-400">
            {tenant?.name} • Gestion des reçus médicaux et paiements en Dinars Algériens (DZD)
          </p>
        </div>

        <button
          onClick={onOpenAddInvoice}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Facture</span>
        </button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Facturé</span>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">
            {Number(summary.total_billed).toLocaleString()} <span className="text-xs text-slate-400 font-sans">DZD</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Volume total d'actes émis</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Encaissé</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-mono">
            {Number(summary.total_paid).toLocaleString()} <span className="text-xs text-emerald-500/80 font-sans">DZD</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Espèces & BaridiMob collectés</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reste à Recouvrer</span>
          <div className="mt-2 text-2xl font-extrabold text-amber-400 font-mono">
            {Number(summary.unpaid_balance).toLocaleString()} <span className="text-xs text-amber-500/80 font-sans">DZD</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Soldes en attente de règlement</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card rounded-2xl p-3 border border-slate-800 flex items-center space-x-2 overflow-x-auto">
        <span className="text-xs font-semibold text-slate-400 px-2 flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Statut :</span>
        </span>
        {['', 'paid', 'partially_paid', 'unpaid'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              statusFilter === st
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {st === '' ? 'Toutes les factures' : st === 'paid' ? 'Payées' : st === 'partially_paid' ? 'Partiellement payées' : 'Non payées'}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">N° Facture & Date</th>
                <th className="px-5 py-3.5">Patient</th>
                <th className="px-5 py-3.5">Mode de Règlement</th>
                <th className="px-5 py-3.5 text-right">Montant Total</th>
                <th className="px-5 py-3.5 text-right">Montant Réglé</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500 text-sm">
                    Chargement des factures...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500 text-sm">
                    Aucune facture enregistrée pour l'instant.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-mono">
                      <div className="font-bold text-white text-sm">{inv.invoice_number}</div>
                      <div className="text-slate-500">{inv.issued_date}</div>
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-bold text-white">
                        {inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : 'N/A'}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">{inv.patient?.phone}</div>
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-semibold text-[10px]">
                        <span>{inv.payment_method === 'baridimob' ? '📱 BaridiMob' : inv.payment_method === 'cash' ? '💵 Espèces' : inv.payment_method}</span>
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-white text-right">
                      {Number(inv.total_amount).toLocaleString()} DZD
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-emerald-400 text-right">
                      {Number(inv.paid_amount).toLocaleString()} DZD
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        inv.payment_status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : inv.payment_status === 'partially_paid'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {inv.payment_status === 'paid' ? 'Payé' : inv.payment_status === 'partially_paid' ? 'Partiel' : 'Non Payé'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}
                          disabled={downloadingId === inv.id}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingId === inv.id ? 'Export...' : 'Reçu PDF'}</span>
                        </button>

                        <button
                          onClick={() => handleDelete(inv.id)}
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
