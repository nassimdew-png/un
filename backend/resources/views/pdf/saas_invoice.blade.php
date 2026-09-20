<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Facture B2B SaaS - {{ $invoice->invoice_number }}</title>
    <style>
        @page {
            margin: 24px 28px;
            font-family: 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
        }
        body {
            font-size: 11px;
            line-height: 1.45;
            color: #0f172a;
            direction: ltr;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .logo-title {
            font-size: 20px;
            font-weight: 800;
            color: #0369a1;
            letter-spacing: -0.5px;
        }
        .logo-subtitle {
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }
        .invoice-title-block {
            text-align: right;
        }
        .invoice-title-fr {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
        }
        .invoice-number {
            font-size: 12px;
            font-weight: 700;
            color: #0284c7;
            margin-top: 2px;
        }
        .paid-badge {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff;
            font-size: 9.5px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            margin-top: 4px;
        }
        .parties-table {
            width: 100%;
            margin-bottom: 16px;
            border-collapse: collapse;
        }
        .party-box {
            width: 48%;
            vertical-align: top;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 12px;
        }
        .party-header {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #0284c7;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-bottom: 6px;
        }
        .party-name {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
        }
        .party-detail {
            font-size: 10px;
            color: #475569;
            line-height: 1.4;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 16px;
            border-collapse: collapse;
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
        }
        .meta-table td {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
            font-size: 10px;
        }
        .meta-label {
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            background-color: #f1f5f9;
            width: 25%;
        }
        .meta-val {
            font-weight: 600;
            color: #0f172a;
            width: 25%;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        .items-table th {
            background-color: #0369a1;
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 8px 10px;
            text-align: left;
            border: 1px solid #0369a1;
        }
        .items-table td {
            padding: 9px 10px;
            border: 1px solid #e2e8f0;
            font-size: 10.5px;
            vertical-align: top;
        }
        .item-title {
            font-weight: 700;
            color: #0f172a;
            font-size: 11px;
        }
        .item-desc {
            font-size: 9.5px;
            color: #64748b;
            margin-top: 3px;
            line-height: 1.35;
        }
        .totals-table {
            width: 48%;
            margin-left: auto;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .totals-table td {
            padding: 6px 10px;
            border: 1px solid #e2e8f0;
            font-size: 10.5px;
        }
        .total-final {
            background-color: #f0fdf4;
            font-weight: 800;
            color: #15803d;
            font-size: 12px;
        }
        .stamp-section {
            width: 100%;
            margin-top: 10px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 12px;
        }
        .stamp-box {
            width: 48%;
            margin-left: auto;
            border: 2px dashed #0369a1;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
            background-color: #f8fafc;
        }
        .stamp-title {
            font-size: 10.5px;
            font-weight: 800;
            color: #0369a1;
            text-transform: uppercase;
        }
        .stamp-sub {
            font-size: 9px;
            color: #64748b;
            margin-top: 2px;
        }
        .stamp-verified {
            font-size: 10px;
            font-weight: 700;
            color: #059669;
            margin-top: 4px;
        }
        .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 8.5px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="vertical-align: middle;">
                <div class="logo-title">PsyPro Enterprise</div>
                <div class="logo-subtitle">Plateforme Médicale & Scribe Clinique Intelligent</div>
                <div style="font-size: 9px; color: #475569; margin-top: 2px;">SARL PsyPro SaaS Tech DZ • NIF: 002416000000032 • RC: 16/00-0987654</div>
            </td>
            <td class="invoice-title-block" style="vertical-align: middle;">
                <div class="invoice-title-fr">Facture d'Abonnement</div>
                <div class="invoice-number">{{ $invoice->invoice_number }}</div>
                <div class="paid-badge">Facture Acquittée • مسددة</div>
            </td>
        </tr>
    </table>

    <!-- Parties (Fournisseur & Client) -->
    <table class="parties-table">
        <tr>
            <td class="party-box">
                <div class="party-header">Prestataire SaaS (Émetteur)</div>
                <div class="party-name">SARL PsyPro SaaS Tech DZ</div>
                <div class="party-detail"><strong>Plateforme:</strong> PsyPro Cloud ClinicCockpit</div>
                <div class="party-detail"><strong>Adresse:</strong> Boulevard des Martyrs, Alger, Algérie</div>
                <div class="party-detail"><strong>Support:</strong> support@psypro.tech | +213 (0) 550 00 00 00</div>
                <div class="party-detail"><strong>Paiement reçu via:</strong> {{ strtoupper($invoice->payment_method ?? 'BaridiMob / CCP') }}</div>
            </td>
            <td style="width: 4%;"></td>
            <td class="party-box">
                <div class="party-header">Client B2B (Souscripteur)</div>
                <div class="party-name">{{ $clinic->name ?? 'Clinique Médicale' }}</div>
                <div class="party-detail"><strong>Responsable:</strong> {{ $owner->name ?? 'Médecin Directeur' }}</div>
                <div class="party-detail"><strong>Sous-domaine:</strong> https://{{ $clinic->subdomain ?? 'clinic' }}.psypro.tech</div>
                <div class="party-detail"><strong>Wilaya / Ville:</strong> {{ $clinic->wilaya_code ?? 'Alger' }}, Algérie</div>
                <div class="party-detail"><strong>Email:</strong> {{ $owner->email ?? $clinic->email ?? 'N/A' }}</div>
            </td>
        </tr>
    </table>

    <!-- Metadata Grid -->
    <table class="meta-table">
        <tr>
            <td class="meta-label">Date d'Émission</td>
            <td class="meta-val">{{ \Carbon\Carbon::parse($invoice->created_at ?? now())->format('d/m/Y') }}</td>
            <td class="meta-label">Cycle de Facturation</td>
            <td class="meta-val">
                @if(($invoice->billing_cycle ?? '') === 'annual')
                    Annuel (12 Mois - Économie 20%)
                @else
                    Mensuel (30 Jours)
                @endif
            </td>
        </tr>
        <tr>
            <td class="meta-label">Période de Validité</td>
            <td class="meta-val" colspan="3">
                Du <strong>{{ \Carbon\Carbon::parse($invoice->period_start ?? now())->format('d/m/Y') }}</strong>
                au <strong>{{ \Carbon\Carbon::parse($invoice->period_end ?? now()->addMonth())->format('d/m/Y') }}</strong>
            </td>
        </tr>
    </table>

    <!-- Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 55%;">Désignation du Service SaaS</th>
                <th style="width: 15%; text-align: center;">Durée</th>
                <th style="width: 15%; text-align: right;">Prix Unitaire</th>
                <th style="width: 15%; text-align: right;">Total Net</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <div class="item-title">
                        Abonnement PsyPro ClinicSaaS - Formule {{ $plan->name_ar ?? $plan->name ?? 'Pro Cockpit' }}
                    </div>
                    <div class="item-desc">
                        Accès complet à la suite clinique : القمرة المباشرة (SOAP, CBT, SUDS), بنك الروائز المقننة الـ 18, عيادة التطبيب عن بعد والسبورة التفاعلية, شاشة الاستقبال Kiosk الذاتية, وبوابة الأولياء والمرضى (Magic Link).
                    </div>
                </td>
                <td style="text-align: center; font-weight: 600;">
                    {{ ($invoice->billing_cycle ?? '') === 'annual' ? '12 Mois' : '1 Mois' }}
                </td>
                <td style="text-align: right; font-weight: 600;">
                    {{ number_format($invoice->original_amount_dzd ?? $invoice->amount_dzd, 2) }} DZD
                </td>
                <td style="text-align: right; font-weight: 700;">
                    {{ number_format($invoice->original_amount_dzd ?? $invoice->amount_dzd, 2) }} DZD
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Totals Table -->
    <table class="totals-table">
        <tr>
            <td style="font-weight: 700; color: #475569;">Sous-total HT:</td>
            <td style="text-align: right; font-weight: 600;">{{ number_format($invoice->original_amount_dzd ?? $invoice->amount_dzd, 2) }} DZD</td>
        </tr>
        @if(!empty($invoice->discount_amount_dzd) && $invoice->discount_amount_dzd > 0)
        <tr>
            <td style="font-weight: 700; color: #0284c7;">Remise Code Promo ({{ $invoice->coupon_code }}):</td>
            <td style="text-align: right; font-weight: 700; color: #0284c7;">- {{ number_format($invoice->discount_amount_dzd, 2) }} DZD</td>
        </tr>
        @endif
        <tr>
            <td style="font-weight: 700; color: #475569;">TVA (0% Exonération SaaS):</td>
            <td style="text-align: right; font-weight: 600;">0.00 DZD</td>
        </tr>
        <tr class="total-final">
            <td>Montant Total Réglé (TTC):</td>
            <td style="text-align: right;">{{ number_format($invoice->amount_dzd, 2) }} DZD</td>
        </tr>
    </table>

    <!-- Stamp & Signature -->
    <div class="stamp-section">
        <div class="stamp-box">
            <div class="stamp-title">SARL PsyPro SaaS Tech DZ</div>
            <div class="stamp-sub">Service Facturation & Relations B2B</div>
            <div class="stamp-verified">✓ PAIEMENT VÉRIFIÉ & FACTURE ACQUITTÉE</div>
            <div style="font-size: 8.5px; color: #64748b; margin-top: 3px;">Document généré électroniquement avec valeur légale probante.</div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        PsyPro Enterprise Cloud • Plateforme de Gestion Médicale et Clinique SaaS en Algérie 🇩🇿 • SARL PsyPro SaaS Tech DZ au capital de 10.000.000 DZD • www.psypro.tech
    </div>

</body>
</html>
