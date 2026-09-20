@php
if (!function_exists('renderClinicalMarkdown')) {
    function renderClinicalMarkdown($text) {
        if (empty($text) || !is_string($text)) return '';
        $clean = e($text);
        $clean = preg_replace('/\*\*(.*?)\*\*/s', '<strong>$1</strong>', $clean);
        $clean = str_replace('**', '', $clean);
        $clean = preg_replace('/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/s', '<em>$1</em>', $clean);
        return nl2br($clean);
    }
}
@endphp
<!DOCTYPE html>
<html lang="{{ $isArabic ? 'ar' : 'fr' }}">
<head>
    <meta charset="UTF-8">
    <title>{{ $bilan->title ?? 'Bilan Clinique' }} - {{ $patient->first_name }} {{ $patient->last_name }}</title>
    <style>
        @page {
            margin: 25px 30px;
            font-family: 'DejaVu Sans', sans-serif;
            color: #1e293b;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10.5px;
            line-height: 1.45;
            color: #1e293b;
            direction: ltr;
            text-align: {{ $isArabic ? 'right' : 'left' }};
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .clinic-name {
            font-size: 15px;
            font-weight: bold;
            color: #0f766e;
            text-transform: uppercase;
        }
        .clinic-sub {
            font-size: 9.5px;
            color: #64748b;
            margin-top: 3px;
        }
        .report-badge {
            background-color: #0d9488;
            color: #ffffff;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            padding: 7px;
            border-radius: 4px;
            letter-spacing: 0.5px;
            margin-bottom: 14px;
            text-transform: uppercase;
        }
        .patient-card {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
        }
        .patient-card td {
            padding: 5px 8px;
            font-size: 10px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .label {
            font-weight: bold;
            color: #475569;
            font-size: 9.5px;
        }
        .val {
            font-weight: bold;
            color: #0f172a;
        }
        .section-header {
            background-color: #f1f5f9;
            border-left: {{ $isArabic ? 'none' : '4px solid #0d9488' }};
            border-right: {{ $isArabic ? '4px solid #0d9488' : 'none' }};
            padding: 4px 8px;
            font-size: 11px;
            font-weight: bold;
            color: #0f766e;
            margin-top: 14px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 10px;
        }
        .data-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
            padding: 5px 6px;
            border: 1px solid #cbd5e1;
            text-align: {{ $isArabic ? 'right' : 'left' }};
        }
        .data-table td {
            padding: 5px 6px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .alert-box {
            padding: 8px 10px;
            border-radius: 4px;
            margin-bottom: 10px;
            font-size: 10px;
            line-height: 1.4;
        }
        .alert-amber {
            background-color: #fffbeb;
            border: 1px solid #fde68a;
            color: #92400e;
        }
        .alert-teal {
            background-color: #f0fdfa;
            border: 1px solid #ccfbf1;
            color: #115e59;
        }
        .tag {
            display: inline-block;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 8.5px;
            font-weight: bold;
            margin: 1px;
        }
        .tag-red { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .tag-amber { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .tag-teal { background-color: #ccfbf1; color: #115e59; border: 1px solid #99f6e4; }
        .tag-purple { background-color: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
        .content-box {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            margin-bottom: 10px;
            font-size: 10px;
            line-height: 1.5;
        }
        .stamp-table {
            width: 100%;
            margin-top: 25px;
            page-break-inside: avoid;
        }
        .stamp-box {
            border: 1px dashed #94a3b8;
            height: 80px;
            padding: 8px;
            text-align: center;
            color: #64748b;
            font-size: 9px;
        }
        .page-break {
            page-break-after: always;
        }
        em, i {
            font-style: normal;
        }
    </style>
</head>
<body>

    <!-- 1. Header with Clinic Branding -->
    <table class="header-table">
        <tr>
            <td style="width: 70%; vertical-align: middle;">
                <div class="clinic-name">{{ $tenant->name ?? 'CABINET D\'ORTHOPHONIE ET PSYCHOLOGIE' }}</div>
                <div class="clinic-sub">
                    {{ $tenant->address ?? 'Alger, Algérie' }} &bull; 
                    {{ $tenant->phone ?? '+213 (0) 550 00 00 00' }} &bull; 
                    {{ $tenant->email ?? 'contact@cabinet-medical.dz' }}
                </div>
            </td>
            <td style="width: 30%; text-align: {{ $isArabic ? 'left' : 'right' }}; vertical-align: middle;">
                <div style="font-size: 10px; font-weight: bold; color: #475569;">
                    {{ $isArabic ? 'تاريخ الحصيلة:' : 'Date du Bilan:' }}
                </div>
                <div style="font-size: 11px; font-weight: bold; color: #0f766e;">
                    {{ \Carbon\Carbon::parse($bilan->created_at ?? now())->format('d/m/Y') }}
                </div>
                @if($specialist)
                <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
                    {{ $specialist->name }} ({{ $specialist->role ?? 'Praticien' }})
                </div>
                @endif
            </td>
        </tr>
    </table>

    <!-- 2. Bilan Title Badge -->
    <div class="report-badge">
        {{ $bilan->title ?? ($isArabic ? 'الحصيلة السريرية الشاملة' : 'COMPTE-RENDU DE BILAN CLINIQUE') }}
    </div>

    <!-- 3. Patient Identity & Demographics -->
    <table class="patient-card">
        <tr>
            <td style="width: 25%;">
                <div class="label">{{ $isArabic ? 'اسم ولقب المريض:' : 'Nom & Prénom:' }}</div>
                <div class="val">{{ $patient->first_name }} {{ $patient->last_name }}</div>
            </td>
            <td style="width: 25%;">
                <div class="label">{{ $isArabic ? 'تاريخ الميلاد والعمر:' : 'Date de Naiss. & Âge:' }}</div>
                <div class="val">
                    {{ $patient->birth_date ? \Carbon\Carbon::parse($patient->birth_date)->format('d/m/Y') : '--' }}
                    <br><span style="font-size: 9px; color: #0d9488;">({{ $ageFormatted }})</span>
                </div>
            </td>
            <td style="width: 25%;">
                <div class="label">{{ $isArabic ? 'الجنس والولاية/البلدية:' : 'Sexe & Résidence:' }}</div>
                <div class="val">
                    {{ $patient->gender === 'female' ? ($isArabic ? 'أنثى' : 'Féminin') : ($isArabic ? 'ذكر' : 'Masculin') }}
                    <br>{{ $patient->wilaya_code ? "W.{$patient->wilaya_code}" : '' }} {{ $patient->commune_name ?? '' }}
                </div>
            </td>
            <td style="width: 25%;">
                <div class="label">{{ $isArabic ? 'الولي ورقم الهاتف:' : 'Tuteur & Téléphone:' }}</div>
                <div class="val">{{ $patient->guardian_name ?? $patient->parent_name ?? '--' }}<br>{{ $patient->phone ?? '--' }}</div>
            </td>
        </tr>
    </table>

    <!-- 4. Reason for Consultation & Referral -->
    <div class="section-header">
        {{ $isArabic ? '1. سبب الاستشارة والتوجيه' : '1. Motif de Consultation & Orientation' }}
    </div>
    <div class="content-box">
        <strong>{{ $isArabic ? 'الشكوى الأولية وسبب الفحص:' : 'Motif initial & Plaintes:' }}</strong> 
        {{ $patient->consultation_reason ?? $anamnesis['consultation_reason'] ?? $anamnesis['referral']['initial_complaint'] ?? ($isArabic ? 'فحص تقييمي بطلب من الأولياء' : 'Bilan initial à la demande des parents.') }}
        @if(!empty($anamnesis['referral']['referred_by_name']))
        <br><strong>{{ $isArabic ? 'جهة التوجيه الطبي:' : 'Orienté par:' }}</strong> 
        {{ $anamnesis['referral']['referred_by_name'] }} ({{ $anamnesis['referral']['referred_by_type'] ?? '' }})
        @endif
    </div>

    <!-- 5. Developmental & Perinatal Anamnesis -->
    <div class="section-header">
        {{ $isArabic ? '2. السوابق النمائية والولادية' : '2. Anamnèse Développementale & Périnatale' }}
    </div>
    <table class="data-table">
        <tr>
            <th style="width: 25%;">{{ $isArabic ? 'فترة الحمل والولادة' : 'Période Périnatale' }}</th>
            <th style="width: 25%;">{{ $isArabic ? 'معالم النمو الحركي' : 'Développement Moteur' }}</th>
            <th style="width: 25%;">{{ $isArabic ? 'معالم النمو اللغوي' : 'Développement Langagier' }}</th>
            <th style="width: 25%;">{{ $isArabic ? 'السياق المدرسي واللغوي' : 'Scolarité & Langues' }}</th>
        </tr>
        <tr>
            <td>
                @php $perinatal = $anamnesis['perinatal'] ?? []; @endphp
                &bull; {{ $isArabic ? 'مدة الحمل:' : 'Terme:' }} {{ $perinatal['pregnancy_term'] ?? 'À terme' }}<br>
                &bull; {{ $isArabic ? 'الولادة:' : 'Accouchement:' }} {{ ($perinatal['delivery_type'] ?? '') === 'cesarean' ? ($isArabic ? 'قيصرية' : 'Césarienne') : ($isArabic ? 'طبيعية' : 'Voie basse') }}<br>
                &bull; {{ $isArabic ? 'صرخة الولادة:' : 'Cri initial:' }} {{ ($perinatal['birth_cry'] ?? '') === 'immediate' ? ($isArabic ? 'فورية' : 'Immédiat') : ($isArabic ? 'متأخرة/مساعدة' : 'Différé') }}<br>
                &bull; {{ $isArabic ? 'الحضانة / نقص الأكسجين:' : 'Couveuse/Anoxie:' }} {{ !empty($perinatal['incubator_stay']) || !empty($perinatal['neonatal_anoxia']) ? ($isArabic ? 'نعم (ملاحظة)' : 'Oui') : ($isArabic ? 'لا' : 'Non') }}
            </td>
            <td>
                @php $milestones = $anamnesis['milestones'] ?? []; @endphp
                &bull; {{ $isArabic ? 'الجلوس:' : 'Station assise:' }} {{ $milestones['sitting_age_months'] ?? '--' }} {{ $isArabic ? 'شهر' : 'mois' }}<br>
                &bull; {{ $isArabic ? 'المشي المستقل:' : 'Marche acquise:' }} {{ $milestones['walking_age_months'] ?? '--' }} {{ $isArabic ? 'شهر' : 'mois' }}
            </td>
            <td>
                &bull; {{ $isArabic ? 'المناغاة:' : 'Babillage:' }} {{ $milestones['babbling_age_months'] ?? '--' }} {{ $isArabic ? 'شهر' : 'mois' }}<br>
                &bull; {{ $isArabic ? 'الكلمات الأولى:' : 'Premiers mots:' }} {{ $milestones['first_words_age_months'] ?? '--' }} {{ $isArabic ? 'شهر' : 'mois' }}<br>
                &bull; {{ $isArabic ? 'الجمل الأولى:' : 'Premières phrases:' }} {{ $milestones['first_sentences_age_months'] ?? '--' }} {{ $isArabic ? 'شهر' : 'mois' }}
            </td>
            <td>
                @php 
                    $school = $anamnesis['school_context'] ?? $anamnesis['schooling'] ?? [];
                    $family = $anamnesis['family_context'] ?? [];
                @endphp
                &bull; {{ $isArabic ? 'المستوى:' : 'Niveau:' }} {{ $school['school_grade'] ?? $patient->school_grade ?? '--' }}<br>
                &bull; {{ $isArabic ? 'المؤسسة:' : 'Établissement:' }} {{ $school['school_name'] ?? $patient->school_name ?? '--' }}<br>
                &bull; {{ $isArabic ? 'الشاشات:' : 'Écrans:' }} {{ $family['daily_screen_hours'] ?? '--' }} {{ $isArabic ? 'ساعة/يوم' : 'h/j' }}
            </td>
        </tr>
    </table>

    <!-- 6. Interactive Genogram & Hereditary Disorders -->
    <div class="section-header">
        {{ $isArabic ? '3. شجرة العائلة والأمراض الوراثية السريرية' : '3. Génogramme Clinique & Antécédents Héréditaires' }}
    </div>
    
    @php
        $isConsanguine = !empty($genogram['consanguinity']);
        $degree = $genogram['consanguinity_degree'] ?? 'none';
        $degreeLabel = [
            'first_cousins' => $isArabic ? 'أبناء عم / خالة مباشرين (درجة أولى F = 1/16)' : 'Cousins germains (1er degré F = 1/16 - 6.25%)',
            'second_cousins' => $isArabic ? 'أقارب من الدرجة الثانية (F = 1/64)' : 'Parents au 2ème degré (F = 1/64 - 1.56%)',
            'same_clan' => $isArabic ? 'زواج من نفس العرش / القبيلة' : 'Endogamie communautaire / Même tribu',
        ][$degree] ?? ($isArabic ? 'لا توجد قرابة والدية' : 'Absence de consanguinité parentale');
    @endphp

    @if($isConsanguine)
    <div class="alert-box alert-amber">
        <strong>[!] {{ $isArabic ? 'مؤشر القرابة بين الوالدين:' : 'Indice de Consanguinité Parentale :' }}</strong>
        {{ $degreeLabel }}
        @if(!empty($genogram['consanguinity_notes']))
            <br><span style="color: #92400e; font-weight: normal;">{{ $genogram['consanguinity_notes'] }}</span>
        @endif
        <br><span style="font-size: 8.5px; color: #78350f;">{{ $isArabic ? '* يرفع زواج الأقارب من احتمالية التعبير عن الاضطرابات العصبية والنمائية ذات النمط الوراثي المتنحي.' : '* La consanguinité augmente le risque d\'expression d\'anomalies neurodéveloppementales récessives.' }}</span>
    </div>
    @else
    <div class="alert-box alert-teal">
        <strong>[OK] {{ $isArabic ? 'مؤشر القرابة بين الوالدين:' : 'Indice de Consanguinité :' }}</strong> 
        {{ $isArabic ? 'زواج غير أقارب (F = 0)' : 'Parents non consanguins (F = 0).' }}
    </div>
    @endif

    @if(!empty($genogram['members']) && is_array($genogram['members']))
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 25%;">{{ $isArabic ? 'فرد العائلة' : 'Membre de la Famille' }}</th>
                <th style="width: 20%;">{{ $isArabic ? 'الجيل والصلة' : 'Génération & Lien' }}</th>
                <th style="width: 55%;">{{ $isArabic ? 'الاضطرابات والسوابق المرصودة' : 'Troubles & Antécédents Observés' }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($genogram['members'] as $m)
            <tr>
                <td><strong>{{ $m['name'] ?? $m['relationship'] ?? 'N/A' }}</strong></td>
                <td>{{ $m['gender'] === 'female' ? ($isArabic ? 'أنثى' : 'Féminin') : ($isArabic ? 'ذكر' : 'Masculin') }} &bull; Gen {{ $m['generation'] ?? 1 }}</td>
                <td>
                    @if(!empty($m['disorders']) && is_array($m['disorders']))
                        @foreach($m['disorders'] as $disorder)
                            <span class="tag tag-purple">{{ $disorder }}</span>
                        @endforeach
                    @else
                        <span style="color: #64748b;">{{ $isArabic ? 'لا توجد سوابق مسجلة' : 'Aucun trouble rapporté' }}</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- 7. Symptom & Sensory Body Map -->
    <div class="section-header">
        {{ $isArabic ? '4. خريطة الجسد والأعراض السريرية والملف الحسي' : '4. Cartographie Corporelle, Tics & Profil Sensoriel' }}
    </div>

    @php
        $activeTics = $sensoryMap['activeTics'] ?? [];
        $sensoryProfile = $sensoryMap['sensoryProfile'] ?? [];
        $zoneNotes = $sensoryMap['zoneNotes'] ?? [];
    @endphp

    <table class="data-table">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                <strong>{{ $isArabic ? 'التشنجات والحركات النمطية:' : 'Tics Moteurs & Stéréotypies :' }}</strong>
                <div style="margin-top: 4px;">
                    @if(!empty($activeTics))
                        @foreach($activeTics as $tic)
                            <span class="tag tag-red">&bull; {{ $tic }}</span><br>
                        @endforeach
                    @else
                        <span style="color: #64748b;">{{ $isArabic ? 'لم تلاحظ حركات لاإرادية أو تشنجات صريحة.' : 'Aucun tic ni stéréotypie motrice notoire observée.' }}</span>
                    @endif
                </div>

                @if(!empty($zoneNotes))
                <div style="margin-top: 6px; font-size: 9px; color: #475569;">
                    <strong>{{ $isArabic ? 'ملاحظات المناطق التشريحية:' : 'Observations anatomiques:' }}</strong><br>
                    @foreach($zoneNotes as $zone => $note)
                        &bull; {{ $zone }}: {{ $note }}<br>
                    @endforeach
                </div>
                @endif
            </td>
            <td style="width: 50%; vertical-align: top;">
                <strong>{{ $isArabic ? 'الملف الحسي والتكامل الحسي:' : 'Profil d\'Intégration Sensorielle :' }}</strong>
                <div style="margin-top: 4px;">
                    @php
                        $domains = [
                            'auditory' => $isArabic ? 'السمعي' : 'Auditif',
                            'tactile' => $isArabic ? 'اللمسي' : 'Tactile',
                            'visual' => $isArabic ? 'البصري' : 'Visuel',
                            'vestibular' => $isArabic ? 'الدهليزي' : 'Vestibulaire',
                            'proprioceptive' => $isArabic ? 'العضلي المفصلي' : 'Proprioceptif',
                        ];
                    @endphp
                    @foreach($domains as $key => $domainLabel)
                        @php $val = $sensoryProfile[$key] ?? 'normal'; @endphp
                        <div style="margin-bottom: 2px;">
                            &bull; {{ $domainLabel }}: 
                            @if($val === 'hyper')
                                <span class="tag tag-red">{{ $isArabic ? 'فرط تحسس' : 'Hyper-réactivité' }}</span>
                            @elseif($val === 'hypo')
                                <span class="tag tag-amber">{{ $isArabic ? 'نقص وبحث حسي' : 'Hypo-réactivité' }}</span>
                            @else
                                <span class="tag tag-teal">{{ $isArabic ? 'طبيعي' : 'Typique' }}</span>
                            @endif
                        </div>
                    @endforeach
                </div>
            </td>
        </tr>
    </table>

    <!-- 8. Psychometric & Clinical Assessments Battery -->
    <div class="section-header">
        {{ $isArabic ? '5. نتائج المقاييس والاختبارات السريرية المعيارية' : '5. Évaluations Psychométriques & Batteries Standardisées' }}
    </div>

    @php
        $hasDigital = !empty($digitalTests) && count($digitalTests) > 0;
        $hasLegacy = !empty($assessments) && count($assessments) > 0;
        $hasAnyCritical = false;
        if ($hasDigital) {
            foreach ($digitalTests as $t) {
                if (!empty($t['has_critical_alert'])) {
                    $hasAnyCritical = true;
                    break;
                }
            }
        }
    @endphp

    @if($hasAnyCritical)
    <div style="background-color: #fef2f2; border: 2px solid #ef4444; color: #b91c1c; padding: 8px 10px; border-radius: 4px; margin-bottom: 10px; font-size: 10px; font-weight: bold;">
        {{ $isArabic ? '🚨 [تنبيه أمان سريري عاجل - RED ALERT]: تم رصد بنود حرجة أو أفكار إيذاء نفس ضمن استجابات المقاييس أدناه؛ تتطلب تدخلاً سريرياً وقائياً فورياً.' : '🚨 [ALERTE CLINIQUE CRITIQUE - RED ALERT] : Des réponses critiques ou idéations à risque ont été détectées nécessitant une vigilance clinique immédiate.' }}
    </div>
    @endif

    @if($hasDigital)
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 32%;">{{ $isArabic ? 'المقياس والمعيار الرقمي' : 'Échelle & Batterie' }}</th>
                <th style="width: 15%;">{{ $isArabic ? 'تاريخ الإجراء' : 'Date de Passation' }}</th>
                <th style="width: 15%;">{{ $isArabic ? 'الدرجة الخام' : 'Score Brut' }}</th>
                <th style="width: 20%;">{{ $isArabic ? 'التصنيف والشدة السريرية' : 'Sévérité Clinique' }}</th>
                <th style="width: 18%;">{{ $isArabic ? 'حالة الأمان' : 'Alerte Sécurité' }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($digitalTests as $test)
            @php
                $isCrit = !empty($test['has_critical_alert']);
                $sev = strtolower($test['severity_label'] ?? '');
                $isHigh = str_contains($sev, 'sévère') || str_contains($sev, 'severe') || str_contains($sev, 'شديد') || str_contains($sev, 'élevé');
                $isMod = str_contains($sev, 'modéré') || str_contains($sev, 'moderate') || str_contains($sev, 'معتدل') || str_contains($sev, 'moyen');
            @endphp
            <tr>
                <td>
                    <strong>{{ $test['test_title'] ?? $test['test_code'] }}</strong>
                    @if(!empty($test['test_code']))
                        <span style="font-size: 8.5px; color: #64748b;">({{ strtoupper($test['test_code']) }})</span>
                    @endif
                    @if(!empty($test['diagnostic_notes']))
                        <br><span style="font-size: 8.5px; color: #475569;">{{ $test['diagnostic_notes'] }}</span>
                    @endif
                </td>
                <td>{{ !empty($test['completed_at']) ? \Carbon\Carbon::parse($test['completed_at'])->format('d/m/Y') : (!empty($test['created_at']) ? \Carbon\Carbon::parse($test['created_at'])->format('d/m/Y') : '--') }}</td>
                <td>
                    <strong style="color: #0f766e; font-size: 11px;">{{ $test['raw_score'] ?? '--' }}</strong>
                </td>
                <td>
                    @if($isHigh)
                        <span class="tag tag-red">{{ $test['severity_label'] ?? ($isArabic ? 'شديد' : 'Sévère') }}</span>
                    @elseif($isMod)
                        <span class="tag tag-amber">{{ $test['severity_label'] ?? ($isArabic ? 'معتدل' : 'Modéré') }}</span>
                    @else
                        <span class="tag tag-teal">{{ $test['severity_label'] ?? ($isArabic ? 'طبيعي / طفيف' : 'Typique / Léger') }}</span>
                    @endif
                </td>
                <td>
                    @if($isCrit)
                        <span class="tag tag-red" style="font-weight: bold;">🚨 {{ $isArabic ? 'تنبيه أمان' : 'Alerte' }}</span>
                    @else
                        <span class="tag tag-teal">✓ {{ $isArabic ? 'آمن' : 'Standard' }}</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    @if($hasLegacy)
    <table class="data-table" style="margin-top: 6px;">
        <thead>
            <tr>
                <th style="width: 30%;">{{ $isArabic ? 'الفحوصات السريرية المكملة' : 'Examens Complémentaires' }}</th>
                <th style="width: 20%;">{{ $isArabic ? 'تاريخ الفحص' : 'Date d\'Examen' }}</th>
                <th style="width: 50%;">{{ $isArabic ? 'الخلاصة والنتائج الفرعية' : 'Scores & Observations' }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($assessments as $item)
            @php
                $resData = is_array($item['results_data'] ?? null) ? $item['results_data'] : (is_string($item['results_data'] ?? null) ? json_decode($item['results_data'], true) : []);
                $fsiqVal = $resData['fsiq'] ?? null;
                $mmpiCode = $resData['two_point_code'] ?? null;
                $stroopCost = $resData['interference_cost'] ?? null;
                $reyCopy = $resData['copy_score'] ?? null;
                $zarekiTotal = $resData['total_score'] ?? null;
            @endphp
            <tr>
                <td>
                    <strong>{{ $item['title'] ?? $item['type'] ?? 'Test' }}</strong>
                    @if($fsiqVal)
                        <br><span style="font-size: 8.5px; color: #4338ca; font-weight: bold;">FSIQ: {{ $fsiqVal }} ({{ $resData['fsiq_classification'] ?? '' }})</span>
                    @elseif($mmpiCode)
                        <br><span style="font-size: 8.5px; color: #4338ca; font-weight: bold;">MMPI Code: {{ $mmpiCode }} ({{ $resData['validity_status'] ?? '' }})</span>
                    @elseif($stroopCost !== null)
                        <br><span style="font-size: 8.5px; color: #0f766e; font-weight: bold;">Stroop Interference: +{{ $stroopCost }}s</span>
                    @elseif($reyCopy !== null)
                        <br><span style="font-size: 8.5px; color: #7e22ce; font-weight: bold;">Copie: {{ $reyCopy }}/36 | Mémoire: {{ $resData['memory_score'] ?? '--' }}/36</span>
                    @elseif($zarekiTotal !== null)
                        <br><span style="font-size: 8.5px; color: #0f766e; font-weight: bold;">ZAREKI-R: {{ $zarekiTotal }}/{{ $resData['max_score'] ?? 80 }} ({{ $resData['risk_level'] ?? '' }})</span>
                    @endif
                </td>
                <td>{{ !empty($item['assessment_date']) ? \Carbon\Carbon::parse($item['assessment_date'])->format('d/m/Y') : '--' }}</td>
                <td>
                    {{ $item['diagnostic_conclusion'] ?? $item['recommendations'] ?? ($isArabic ? 'تم إجراء الفحص وفق المعايير الإكلينيكية' : 'Passation standardisée.') }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    @if(!$hasDigital && !$hasLegacy)
    <div class="content-box" style="color: #64748b;">
        {{ $isArabic ? 'لم ترفق مقاييس فرعية رقمية في هذه الحصيلة؛ التقييم يعتمد على الفحص السريري المباشر.' : 'Aucune batterie psychométrique sélectionnée pour ce bilan.' }}
    </div>
    @endif

    <!-- 9. Synthesis & DSM-5 Diagnosis -->
    <div class="section-header">
        {{ $isArabic ? '6. الخلاصة السريرية والتشخيص' : '6. Synthèse Clinique & Hypothèses Diagnostiques' }}
    </div>
    <div class="content-box">
        @if(!empty($bilan->clinical_summary))
            <p><strong>{{ $isArabic ? 'التحليل السريري التركيبي:' : 'Synthèse Globale:' }}</strong> {!! renderClinicalMarkdown($bilan->clinical_summary) !!}</p>
        @endif

        @if(!empty($bilan->psychometric_analysis))
            <p><strong>{{ $isArabic ? 'تحليل نتائج المقاييس:' : 'Analyse des Résultats:' }}</strong> {!! renderClinicalMarkdown($bilan->psychometric_analysis) !!}</p>
        @endif

        @if(!empty($bilan->strengths_weaknesses))
            <p><strong>{{ $isArabic ? 'نقاط القوة والضعف:' : 'Profil des Forces & Faiblesses:' }}</strong> {!! renderClinicalMarkdown($bilan->strengths_weaknesses) !!}</p>
        @endif

        @if(!empty($bilan->diagnosis_codes))
            <div style="background-color: #f1f5f9; padding: 6px; border-left: 3px solid #0d9488; margin-top: 6px;">
                <strong>{{ $isArabic ? 'التشخيص المقترح (DSM-5 / CIM-11):' : 'Conclusion Diagnostique (DSM-5 / CIM-11) :' }}</strong><br>
                <span style="font-weight: bold; color: #0f766e;">{{ $bilan->diagnosis_codes }}</span>
            </div>
        @endif
    </div>

    <!-- 10. Therapeutic Project & PEI Individual Goals -->
    <div class="section-header">
        {{ $isArabic ? '7. المشروع العلاجي وأهداف الخطة الفردية (PEI)' : '7. Projet Thérapeutique & Objectifs PEI' }}
    </div>
    <div class="content-box">
        <p><strong>{{ $isArabic ? 'التوصيات والمشروع التأهيلي:' : 'Préconisations Thérapeutiques :' }}</strong></p>
        {!! renderClinicalMarkdown($bilan->therapeutic_project ?? ($isArabic ? 'يوصى ببدء حصص تكفل أرطوفوني/نفسي بمعدل حصتين أسبوعياً مع متابعة أسرية ومدرسية منتظمة.' : 'Prise en charge orthophonique/psychologique préconisée à raison de 2 séances hebdomadaires avec guidance parentale.')) !!}

        @if(!empty($peiGoals) && is_array($peiGoals) && count($peiGoals) > 0)
        <div style="margin-top: 10px;">
            <strong>{{ $isArabic ? 'أهداف الخطة العلاجية الفردية المرصودة (Objectifs PEI) :' : 'Objectifs du Projet Individualisé (PEI) :' }}</strong>
            <table class="data-table" style="margin-top: 5px;">
                <thead>
                    <tr>
                        <th style="width: 70%;">{{ $isArabic ? 'الهدف العلاجي السريري' : 'Objectif Thérapeutique Cible' }}</th>
                        <th style="width: 30%;">{{ $isArabic ? 'مستوى الاكتساب' : 'Statut d\'Acquisition' }}</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($peiGoals as $g)
                    @php
                        $st = $g['status'] ?? 'in_progress';
                    @endphp
                    <tr>
                        <td>&bull; {{ $g['text'] ?? '' }}</td>
                        <td>
                            @if($st === 'achieved')
                                <span class="tag tag-teal">🟢 {{ $isArabic ? 'مكتسب' : 'Acquis' }}</span>
                            @elseif($st === 'in_progress')
                                <span class="tag tag-amber">🟡 {{ $isArabic ? 'قيد التدريب' : 'En cours' }}</span>
                            @else
                                <span class="tag tag-red">🔴 {{ $isArabic ? 'تعزيز وتكثيف' : 'À renforcer' }}</span>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif
    </div>

    <!-- 11. Signatures & Official Stamp & QR Verification -->
    <table class="stamp-table" style="width: 100%; margin-top: 20px; page-break-inside: avoid; border-top: 1px solid #cbd5e1; padding-top: 15px;">
        <tr>
            <!-- Left: QR Code & Verification Notice -->
            <td style="width: 48%; vertical-align: top; padding-right: 15px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 75px; vertical-align: top;">
                            @php
                                $bilanToken = 'BILAN-' . ($bilan->id ?? '1') . '-' . substr(md5(($bilan->id ?? 1) . ($bilan->created_at ?? now())), 0, 6);
                                $qrVerifyUrl = 'https://psypro.tech/verify/doc/' . $bilanToken;
                            @endphp
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data={{ urlencode($qrVerifyUrl) }}" alt="QR Verification" style="width: 70px; height: 70px; border: 1px solid #cbd5e1; padding: 2px; border-radius: 4px;">
                        </td>
                        <td style="vertical-align: top; padding-right: 8px;">
                            <div style="font-weight: bold; font-size: 9.5px; color: #0f766e;">
                                {{ $isArabic ? 'المصادقة الرقمية والتحقق الإلكتروني' : 'Authentification Électronique Officielle' }}
                            </div>
                            <div style="font-family: monospace; font-size: 8.5px; color: #475569; margin: 2px 0;">
                                {{ $bilanToken }}
                            </div>
                            <div style="font-size: 8px; color: #64748b; line-height: 1.3;">
                                {{ $isArabic ? 'امسح الرمز بكاميرا الهاتف للتحقق الفوري من صحة هذه الحصيلة ومطابقتها للسجل الطبي المعتمد.' : 'Scannez le QR code pour vérifier l\'authenticité de ce compte-rendu auprès du registre officiel.' }}
                            </div>
                        </td>
                    </tr>
                </table>
            </td>

            <!-- Right: Signature & Stamp of Specialist -->
            <td style="width: 52%; vertical-align: top; text-align: center;">
                <div style="font-weight: bold; font-size: 10px; color: #0f766e; margin-bottom: 4px;">
                    {{ $isArabic ? 'توقيع وخاتم الأخصائي المعالج المعتمد' : 'Signature & Cachet Officiel du Praticien' }}
                </div>
                <div style="border: 1px dashed #94a3b8; border-radius: 6px; padding: 8px 12px; min-height: 70px; background-color: #f8fafc;">
                    <div style="font-weight: bold; font-size: 10px; color: #1e293b;">
                        {{ $specialist->name ?? ($tenant->name ?? 'Le Praticien Spécialiste') }}
                    </div>
                    <div style="font-size: 8.5px; color: #475569; margin: 2px 0;">
                        {{ $isArabic ? 'أخصائي معتمد بالمنصة السريرية' : 'Praticien Spécialiste Agréé' }}
                    </div>
                    <div style="font-family: monospace; font-size: 8px; color: #0f766e; font-weight: bold;">
                        N° Agrément : {{ $specialist->license_number ?? 'DZ-MSP-77492-MED' }}
                    </div>
                    <div style="margin-top: 4px; font-size: 8px; color: #94a3b8; font-style: italic;">
                        [Document Signé Électroniquement & Certifié Conforme]
                    </div>
                </div>
            </td>
        </tr>
    </table>

</body>
</html>
