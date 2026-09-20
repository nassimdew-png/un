<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Reçu d'Honoraires - {{ $invoice->invoice_number }}</title>
    <style>
        @page {
            margin: 24px 28px;
            font-family: 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
        }
        body {
            font-size: 11px;
            line-height: 1.4;
            color: #0f172a;
            direction: ltr;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .clinic-title-fr {
            font-size: 15px;
            font-weight: bold;
            color: #0f766e;
            text-transform: uppercase;
        }
        .clinic-title-ar {
            font-size: 13px;
            font-weight: bold;
            color: #1e293b;
            margin-top: 2px;
        }
        .clinic-meta {
            font-size: 9.5px;
            color: #64748b;
            margin-top: 2px;
        }
        .receipt-badge {
            background-color: #0f766e;
            color: #ffffff;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            padding: 6px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 14px;
        }
        .info-grid {
            width: 100%;
            margin-bottom: 14px;
            border-collapse: collapse;
        }
        .info-grid td {
            padding: 7px 10px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .info-label {
            font-weight: bold;
            color: #475569;
            font-size: 9.5px;
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
            margin-top: 12px;
            margin-bottom: 12px;
        }
        .items-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
            font-size: 9.5px;
            text-align: left;
            padding: 6px 10px;
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
        }
        .items-table td {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
            font-size: 10.5px;
        }
        .total-box {
            width: 48%;
            margin-left: auto;
            border-collapse: collapse;
            margin-top: 8px;
        }
        .total-box td {
            padding: 5px 10px;
            font-size: 10.5px;
            border: 1px solid #e2e8f0;
        }
        .total-final {
            background-color: #f0fdf4;
            font-weight: bold;
            font-size: 11.5px;
            color: #166534;
        }
        .payment-tag {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 9.5px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .tag-paid { background-color: #dcfce7; color: #166534; }
        .tag-unpaid { background-color: #fee2e2; color: #991b1b; }
        .tag-partial { background-color: #fef3c7; color: #92400e; }
        .legal-notice {
            margin-top: 22px;
            padding: 8px 12px;
            background-color: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 4px;
            font-size: 9px;
            color: #475569;
            text-align: center;
            line-height: 1.5;
        }
        .signature-box {
            margin-top: 20px;
            width: 100%;
        }
        .signature-box td {
            width: 50%;
            vertical-align: top;
            padding: 5px 10px;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 8.5px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 5px;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="vertical-align: top; width: 62%;">
                <div class="clinic-title-fr">{{ $tenant->header_title_fr ?: $tenant->name }}</div>
                @if(!empty($tenant->header_title_ar))
                    <div class="clinic-title-ar">{{ $tenant->header_title_ar }}</div>
                @endif
                <div class="clinic-meta">
                    {{ $tenant->address ?: 'Cabinet Médical & Rééducation' }}
                    @if(!empty($tenant->city)) &bull; {{ $tenant->city }} @endif
                    @if(!empty($tenant->wilaya)) &bull; W. {{ $tenant->wilaya }} @endif
                </div>
                <div class="clinic-meta">
                    Tél / Téléphone : {{ $tenant->phone ?: '023 00 00 00' }}
                </div>
            </td>
            <td style="vertical-align: top; text-align: right; width: 38%;">
                <div style="font-size: 11px; font-weight: bold; color: #334155;">
                    @if($invoice->invoice_type === 'b2b_subscription' || !empty($invoice->company_name))
                        FACTURE COMMERCIALE & FISCALE (B2B) / فاتورة تجارية وضريبية
                    @else
                        REÇU D'HONORAIRES / وصل أتعاب
                    @endif
                </div>
                <div style="font-size: 11px; color: #0f766e; font-weight: bold; font-family: monospace;">N° {{ $invoice->invoice_number }}</div>
                <div style="font-size: 9.5px; color: #64748b; margin-top: 3px;">
                    Date d'émission : {{ \Carbon\Carbon::parse($invoice->issued_date)->format('d/m/Y') }}
                </div>
            </td>
        </tr>
    </table>

    <div class="receipt-badge">
        @if($invoice->invoice_type === 'b2b_subscription' || !empty($invoice->company_name))
            FACTURE COMMERCIALE & FISCALE (SOUSCRIPTION SAAS) &bull; فاتورة تجارية وضريبية معتمدة لاشتراك العيادة
        @else
            REÇU D'HONORAIRES MÉDICAUX & DE RÉÉDUCATION &bull; وصل أداء الأتعاب
        @endif
    </div>

    <!-- Info Grid -->
    <table class="info-grid">
        <tr>
            <td style="width: 50%;">
                @if($invoice->invoice_type === 'b2b_subscription' || !empty($invoice->company_name))
                    <div class="info-label">Client / Établissement (المؤسسة أو العيادة المستفيدة)</div>
                    <div class="info-val">{{ $invoice->company_name ?: ($patient->first_name . ' ' . $patient->last_name) }}</div>
                    <div style="font-size: 9.5px; color: #334155; margin-top: 4px; font-family: monospace;">
                        <strong>NIF / Identifiant Fiscal :</strong> {{ $invoice->tax_id ?: '—' }}<br>
                        <strong>RC / Registre de Commerce :</strong> {{ $invoice->trade_register ?: '—' }} &bull; <strong>NIS :</strong> {{ $invoice->nis_number ?: '—' }}
                    </div>
                    @if($invoice->subscription_plan || $invoice->billing_period)
                        <div style="font-size: 9px; color: #0f766e; margin-top: 3px; font-weight: bold;">
                            Formule : {{ $invoice->subscription_plan ?: 'Pro / SaaS' }} &bull; Période : {{ $invoice->billing_period ?: 'Annuel' }}
                            @if($invoice->period_start && $invoice->period_end)
                                (Du {{ \Carbon\Carbon::parse($invoice->period_start)->format('d/m/Y') }} au {{ \Carbon\Carbon::parse($invoice->period_end)->format('d/m/Y') }})
                            @endif
                        </div>
                    @endif
                @else
                    <div class="info-label">Patient / المريض</div>
                    <div class="info-val">{{ $patient->first_name }} {{ $patient->last_name }}</div>
                    <div style="font-size: 9.5px; color: #475569; margin-top: 3px;">
                        Tél : {{ $patient->phone ?: '—' }} &bull; Tuteur : {{ $patient->guardian_name ?: 'Autonome' }}
                    </div>
                    @if($patient->birth_date)
                        <div style="font-size: 9.5px; color: #64748b;">
                            Né(e) le : {{ \Carbon\Carbon::parse($patient->birth_date)->format('d/m/Y') }}
                        </div>
                    @endif
                @endif
            </td>
            <td style="width: 50%;">
                <div class="info-label">Règlement / طريقة وحالة الدفع</div>
                <div style="margin-top: 2px;">
                    <span class="payment-tag {{ $invoice->payment_status === 'paid' ? 'tag-paid' : ($invoice->payment_status === 'partially_paid' ? 'tag-partial' : 'tag-unpaid') }}">
                        @if($invoice->payment_status === 'paid')
                            PAYÉ EN TOTALITÉ (SOLDE RÉGLÉ ✓)
                        @elseif($invoice->payment_status === 'partially_paid')
                            PAIEMENT PARTIEL (RESTE DÛ)
                        @else
                            NON RÉGLÉ (EN ATTENTE)
                        @endif
                    </span>
                </div>
                <div style="font-size: 9.5px; color: #475569; margin-top: 4px;">
                    Mode : <strong>{{ strtoupper($invoice->payment_method) }}</strong> (Espèces / BaridiMob / Virement)
                </div>
            </td>
        </tr>
    </table>

    <!-- Services Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 52%;">Désignation de la Prestation / طبيعة الخدمة أو الباقة المفوترة</th>
                <th style="width: 12%; text-align: center;">Qté</th>
                <th style="width: 18%; text-align: right;">Prix Unitaire (DZD)</th>
                <th style="width: 18%; text-align: right;">Total (DZD)</th>
            </tr>
        </thead>
        <tbody>
            @if(!empty($invoice->items) && is_array($invoice->items))
                @foreach($invoice->items as $item)
                    <tr>
                        <td>
                            <strong>{{ $item['description'] ?? 'Séance de consultation clinique' }}</strong>
                        </td>
                        <td style="text-align: center; font-family: monospace;">{{ $item['quantity'] ?? 1 }}</td>
                        <td style="text-align: right; font-family: monospace;">{{ number_format($item['unit_price'] ?? 0, 2, ',', ' ') }}</td>
                        <td style="text-align: right; font-family: monospace; font-weight: bold;">{{ number_format(($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0), 2, ',', ' ') }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td><strong>{{ $invoice->invoice_type === 'b2b_subscription' ? 'Abonnement Plateforme SaaS PsyPro' : 'Séance de consultation & rééducation clinique' }}</strong></td>
                    <td style="text-align: center; font-family: monospace;">1</td>
                    <td style="text-align: right; font-family: monospace;">{{ number_format($invoice->total_amount, 2, ',', ' ') }}</td>
                    <td style="text-align: right; font-family: monospace; font-weight: bold;">{{ number_format($invoice->total_amount, 2, ',', ' ') }}</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- Totals Table -->
    <table class="total-box">
        @if($invoice->invoice_type === 'b2b_subscription' || !empty($invoice->company_name))
            <tr>
                <td style="color: #475569;">Total Hors Taxes (Montant HT) :</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold;">{{ number_format($invoice->subtotal_ht ?: $invoice->total_amount, 2, ',', ' ') }} DZD</td>
            </tr>
            <tr>
                <td style="color: #475569;">TVA ({{ (float)($invoice->tax_rate ?? 0) }}%) :</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold;">{{ number_format($invoice->tax_amount ?? 0, 2, ',', ' ') }} DZD</td>
            </tr>
            <tr style="background-color: #f8fafc; font-weight: bold;">
                <td style="color: #0f172a;">Total TTC (Toutes Taxes Comprises) :</td>
                <td style="text-align: right; font-family: monospace;">{{ number_format($invoice->total_amount, 2, ',', ' ') }} DZD</td>
            </tr>
        @else
            <tr>
                <td style="color: #475569;">Total Honoraires (الإجمالي) :</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold;">{{ number_format($invoice->total_amount, 2, ',', ' ') }} DZD</td>
            </tr>
        @endif
        <tr>
            <td style="color: #475569;">Montant Réglé (المبلغ المسدد) :</td>
            <td style="text-align: right; font-family: monospace; color: #16a34a; font-weight: bold;">{{ number_format($invoice->paid_amount, 2, ',', ' ') }} DZD</td>
        </tr>
        <tr class="total-final">
            <td>Solde Restant Dû (المتبقي) :</td>
            <td style="text-align: right; font-family: monospace;">{{ number_format(max(0, $invoice->total_amount - $invoice->paid_amount), 2, ',', ' ') }} DZD</td>
        </tr>
    </table>

    <!-- Legal Notice -->
    <div class="legal-notice">
        @if($invoice->invoice_type === 'b2b_subscription' || !empty($invoice->company_name))
            <strong>Facture Commerciale & Fiscale Conforme :</strong> Ce document fait office de facture officielle B2B pour la souscription aux services informatiques en ligne (SaaS) et l'accès à la plateforme PsyPro. Valable pour la déductibilité fiscale et la comptabilité d'entreprise selon la réglementation algérienne.<br>
            فاتورة تجارية وضريبية رسمية تثبت الاشتراك في خدمات المنصة السحابية ومعتمدة للأغراض المحاسبية والجبائية.
        @else
            <strong>Attestation de Règlement des Honoraires :</strong> Ce document fait office de reçu officiel d'honoraires pour le remboursement auprès des organismes de sécurité sociale (CNAS / CASNOS) et mutuelles d'assurance.<br>
            وثيقة رسمية تثبت أداء أتعاب الفحص والتأهيل السريري لغرض الاستفادة من التعويض لدى هيئات الضمان الاجتماعي وشركات التأمين.
        @endif
    </div>

    <!-- Stamp & Signature Area -->
    <table class="signature-box">
        <tr>
            <td style="text-align: left;">
                <div style="font-size: 9.5px; color: #64748b;">Cachet et Signature du Praticien :</div>
                <div style="margin-top: 35px; font-size: 9px; color: #94a3b8; font-style: italic;">
                    {{ $tenant->name }} &bull; Document Médical Confidentiel
                </div>
            </td>
            <td style="text-align: right;">
                <div style="font-size: 9.5px; color: #64748b;">Fait à {{ $tenant->city ?: 'Alger' }}, le {{ \Carbon\Carbon::parse($invoice->issued_date)->format('d/m/Y') }}</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        {{ $tenant->name }} &bull; Plateforme PsyPro ClinicSaaS &bull; Facture N° {{ $invoice->invoice_number }}
    </div>

</body>
</html>
