<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Compte-Rendu Clinique - {{ $assessment->title }}</title>
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
        .report-title-badge {
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
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #0369a1;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-top: 14px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .results-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
            font-size: 10px;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
        }
        .results-table td {
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            font-size: 11px;
        }
        .conclusion-box {
            background-color: #f0fdf4;
            border-left: 3.5px solid #16a34a;
            padding: 10px 12px;
            margin-top: 8px;
            border-radius: 2px;
            font-size: 11px;
            color: #14532d;
        }
        .recommendation-box {
            background-color: #eff6ff;
            border-left: 3.5px solid #2563eb;
            padding: 10px 12px;
            margin-top: 8px;
            border-radius: 2px;
            font-size: 11px;
            color: #1e3a8a;
        }
        .signature-table {
            width: 100%;
            margin-top: 24px;
            border-collapse: collapse;
        }
        .signature-box {
            border: 1px dashed #94a3b8;
            padding: 12px;
            height: 70px;
            text-align: center;
            border-radius: 4px;
            background-color: #fafafa;
        }
        .stamp-text {
            font-size: 9px;
            color: #64748b;
            font-style: italic;
            margin-top: 40px;
        }
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
                    Tél : {{ $tenant->settings['phone'] ?? '023123456' }} &bull; Email : {{ $specialist->email }}
                </div>
            </td>
            <td style="vertical-align: top; text-align: right; width: 35%;">
                <div style="font-size: 11px; font-weight: bold; color: #334155;">RÉPUBLIQUE ALGÉRIENNE</div>
                <div style="font-size: 10px; color: #64748b;">Espace Santé &bull; Dossier N° {{ $patient->id }}</div>
                <div style="font-size: 10px; color: #0284c7; font-weight: bold; margin-top: 4px;">
                    Date : {{ \Carbon\Carbon::parse($assessment->assessment_date)->format('d/m/Y') }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Title Badge -->
    <div class="report-title-badge">
        {{ $assessment->title }}
    </div>

    <!-- Patient & Specialist Info -->
    <table class="info-grid">
        <tr>
            <td style="width: 50%;">
                <div class="info-label">Informations du Patient</div>
                <div class="info-val">{{ $patient->first_name }} {{ $patient->last_name }}</div>
                <div style="font-size: 10.5px; color: #475569; margin-top: 2px;">
                    Né(e) le : {{ \Carbon\Carbon::parse($patient->birth_date)->format('d/m/Y') }} 
                    ({{ $patient->gender === 'male' ? 'Masculin' : 'Féminin' }})
                </div>
                <div style="font-size: 10.5px; color: #475569;">
                    Tuteur / Contact : {{ $patient->guardian_name ?? 'Majeur' }} &bull; {{ $patient->phone }}
                </div>
            </td>
            <td style="width: 50%;">
                <div class="info-label">Praticien Responsable</div>
                <div class="info-val">{{ $specialist->name }}</div>
                <div style="font-size: 10.5px; color: #475569; margin-top: 2px;">
                    Rôle : {{ ucfirst($specialist->role) }}
                </div>
                <div style="font-size: 10.5px; color: #0284c7; font-weight: 600;">
                    N° Agrément / Licence : {{ $specialist->specialty_license_number ?? 'ORTHO/PSY-DZ' }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Structured Results -->
    <div class="section-title">1. Résultats Détaillés de l'Évaluation</div>
    
    @if(!empty($assessment->results_data) && is_array($assessment->results_data))
        <table class="results-table">
            <thead>
                <tr>
                    <th style="width: 40%;">Domaine / Épreuve</th>
                    <th style="width: 60%;">Observations & Scores Cliniques</th>
                </tr>
            </thead>
            <tbody>
                @foreach($assessment->results_data as $key => $value)
                    <tr>
                        <td style="font-weight: 600; color: #334155;">{{ ucwords(str_replace('_', ' ', $key)) }}</td>
                        <td>
                            @if(is_array($value))
                                <ul style="margin: 0; padding-left: 14px;">
                                    @foreach($value as $k => $v)
                                        <li><strong>{{ ucwords(str_replace('_', ' ', $k)) }}:</strong> {{ is_array($v) ? json_encode($v) : $v }}</li>
                                    @endforeach
                                </ul>
                            @else
                                {{ $value }}
                            @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p style="font-style: italic; color: #64748b;">Aucune grille spécifique renseignée pour ce bilan.</p>
    @endif

    <!-- Diagnostic Conclusion -->
    <div class="section-title">2. Conclusion Clinique & Diagnostic</div>
    <div class="conclusion-box">
        <strong>Diagnostic :</strong><br>
        {{ $assessment->diagnostic_conclusion ?? 'Diagnostic clinique établi selon les épreuves standardisées.' }}
    </div>

    <!-- Recommendations -->
    <div class="section-title">3. Préconisations & Projet Thérapeutique</div>
    <div class="recommendation-box">
        <strong>Recommandations :</strong><br>
        {{ $assessment->recommendations ?? 'Poursuite des séances de prise en charge hebdomadaires.' }}
    </div>

    <!-- Signatures -->
    <table class="signature-table">
        <tr>
            <td style="width: 55%; vertical-align: bottom;">
                <div style="font-size: 10px; color: #64748b;">
                    Document officiel généré par le système <strong>ClinicSaaS DZ</strong>.<br>
                    Authenticité vérifiable sous le code d'identification #{{ $assessment->id }}-{{ substr($assessment->tenant_id, 0, 8) }}.
                </div>
            </td>
            <td style="width: 45%; vertical-align: top;">
                <div class="signature-box">
                    <div style="font-size: 11px; font-weight: bold; color: #1e293b;">Signature & Cachet du Praticien</div>
                    <div style="font-size: 10px; color: #0284c7; margin-top: 2px;">{{ $specialist->name }}</div>
                    <div class="stamp-text">Cachet officiel de la clinique</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        {{ $tenant->name }} &bull; Système Médical ClinicSaaS &bull; Page 1/1
    </div>

</body>
</html>
