<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu de Paiement - {{ $invoice->invoice_number }}</title>
    <style>
        @page {
            margin: 28px 32px;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
        }
        body {
            font-size: 11.5px;
            line-height: 1.45;
            color: #1e293b;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .clinic-title {
            font-size: 16px;
            font-weight: bold;
            color: #0369a1;
            text-transform: uppercase;
        }
        .clinic-meta {
            font-size: 10px;
            color: #64748b;
            margin-top: 3px;
        }
        .invoice-badge {
            background-color: #0284c7;
            color: #ffffff;
            font-size: 13px;
            font-weight: bold;
            text-align: center;
            padding: 7px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
        }
        .info-grid {
            width: 100%;
            margin-bottom: 16px;
            border-collapse: collapse;
        }
        .info-grid td {
            padding: 6px 10px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .info-label {
            font-weight: bold;
            color: #475569;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .info-val {
            font-size: 11px;
            color: #0f172a;
            font-weight: 600;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
            margin-bottom: 14px;
        }
        .items-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
            font-size: 10px;
            text-align: left;
            padding: 7px 10px;
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
        }
        .items-table td {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
            font-size: 11px;
        }
        .total-box {
            width: 45%;
            margin-left: auto;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .total-box td {
            padding: 5px 10px;
            font-size: 11px;
            border: 1px solid #e2e8f0;
        }
        .total-final {
            background-color: #f0fdf4;
            font-weight: bold;
            font-size: 12.5px;
            color: #166534;
        }
        .payment-tag {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .tag-paid { background-color: #dcfce7; color: #166534; }
        .tag-unpaid { background-color: #fee2e2; color: #991b1b; }
        .tag-partial { background-color: #fef3c7; color: #92400e; }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="vertical-align: top; width: 65%;">
                <div class="clinic-title">{{ $tenant->name }}</div>
                <div class="clinic-meta">
                    {{ $tenant->settings['address'] ?? 'Cabinet Médical' }} &bull; {{ $tenant->settings['city'] ?? 'Algérie' }}
                </div>
                <div class="clinic-meta">
                    Tél : {{ $tenant->settings['phone'] ?? '023123456' }}
                </div>
            </td>
            <td style="vertical-align: top; text-align: right; width: 35%;">
                <div style="font-size: 11px; font-weight: bold; color: #334155;">FACTURE / REÇU MÉDICAL</div>
                <div style="font-size: 10px; color: #0284c7; font-weight: bold;">N° {{ $invoice->invoice_number }}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 3px;">
                    Date : {{ \Carbon\Carbon::parse($invoice->issued_date)->format('d/m/Y') }}
                </div>
            </td>
        </tr>
    </table>

    <div class="invoice-badge">
        REÇU D'HONORAIRES MÉDICAUX
    </div>

    <!-- Info Grid -->
    <table class="info-grid">
        <tr>
            <td style="width: 50%;">
                <div class="info-label">Facturé à (Patient)</div>
                <div class="info-val">{{ $patient->first_name }} {{ $patient->last_name }}</div>
                <div style="font-size: 10px; color: #475569; margin-top: 2px;">
                    Tél : {{ $patient->phone }} &bull; Tuteur : {{ $patient->guardian_name ?? 'Autonome' }}
                </div>
            </td>
            <td style="width: 50%;">
                <div class="info-label">Mode & Statut de Paiement</div>
                <div style="margin-top: 2px;">
                    <span class="payment-tag {{ $invoice->payment_status === 'paid' ? 'tag-paid' : ($invoice->payment_status === 'partially_paid' ? 'tag-partial' : 'tag-unpaid') }}">
                        {{ $invoice->payment_status === 'paid' ? 'PAYÉ (SOLDE RÉGLÉ)' : ($invoice->payment_status === 'partially_paid' ? 'PAIEMENT PARTIEL' : 'NON PAYÉ') }}
                    </span>
                </div>
                <div style="font-size: 10px; color: #475569; margin-top: 4px;">
                    Mode : <strong>{{ strtoupper($invoice->payment_method) }}</strong> (Espèces / BaridiMob / Virement)
                </div>
            </td>
        </tr>
    </table>

    <!-- Services Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%;">Désignation de l'Acte / Consultation</th>
                <th style="width: 15%; text-align: center;">Qté</th>
                <th style="width: 18%; text-align: right;">Tarif Unitaire (DZD)</th>
                <th style="width: 17%; text-align: right;">Total (DZD)</th>
            </tr>
        </thead>
        <tbody>
            @if(!empty($invoice->items) && is_array($invoice->items))
                @foreach($invoice->items as $item)
                    <tr>
                        <td>{{ $item['description'] ?? 'Acte Médical' }}</td>
                        <td style="text-align: center;">{{ $item['quantity'] ?? 1 }}</td>
                        <td style="text-align: right; font-family: monospace;">{{ number_format($item['unit_price'] ?? 0, 2, ',', ' ') }}</td>
                        <td style="text-align: right; font-family: monospace; font-weight: bold;">{{ number_format(($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0), 2, ',', ' ') }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td>Séance de consultation clinique</td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right; font-family: monospace;">{{ number_format($invoice->total_amount, 2, ',', ' ') }}</td>
                    <td style="text-align: right; font-family: monospace; font-weight: bold;">{{ number_format($invoice->total_amount, 2, ',', ' ') }}</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- Totals -->
    <table class="total-box">
        <tr>
            <td style="color: #475569;">Total Honoraires :</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold;">{{ number_format($invoice->total_amount, 2, ',', ' ') }} DZD</td>
        </tr>
        <tr>
            <td style="color: #475569;">Montant Réglé :</td>
            <td style="text-align: right; font-family: monospace; color: #16a34a; font-weight: bold;">{{ number_format($invoice->paid_amount, 2, ',', ' ') }} DZD</td>
        </tr>
        <tr class="total-final">
            <td>Solde Restant Dû :</td>
            <td style="text-align: right; font-family: monospace;">{{ number_format(max(0, $invoice->total_amount - $invoice->paid_amount), 2, ',', ' ') }} DZD</td>
        </tr>
    </table>

    <div style="margin-top: 30px; font-size: 10px; color: #64748b; text-align: center;">
        Ce document fait office de reçu officiel d'honoraires pour le remboursement auprès de la sécurité sociale (CNAS / CASNOS) et mutuelles.
    </div>

    <div class="footer">
        {{ $tenant->name }} &bull; Facturation ClinicSaaS &bull; Page 1/1
    </div>

</body>
</html>
