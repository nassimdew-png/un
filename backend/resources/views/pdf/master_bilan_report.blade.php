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
                &bull; {{ $isArabic ? 'الولادة:' : 'Accouchement:' }} {{ $perinatal['delivery_type'] === 'cesarean' ? ($isArabic ? 'قيصرية' : 'Césarienne') : ($isArabic ? 'طبيعية' : 'Voie basse') }}<br>
                &bull; {{ $isArabic ? 'صرخة الولادة:' : 'Cri initial:' }} {{ $perinatal['birth_cry'] === 'immediate' ? ($isArabic ? 'فورية' : 'Immédiat') : ($isArabic ? 'متأخرة/مساعدة' : 'Différé') }}<br>
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
        {{ $isArabic ? '5. نتائج المقاييس والاختبارات السريرية' : '5. Évaluations Psychométriques & Orthophoniques' }}
    </div>
    @if(!empty($assessments) && count($assessments) > 0)
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 30%;">{{ $isArabic ? 'اسم الاختبار / المقياس' : 'Test / Échelle' }}</th>
                <th style="width: 20%;">{{ $isArabic ? 'تاريخ الإجراء' : 'Date de Passation' }}</th>
                <th style="width: 50%;">{{ $isArabic ? 'الدرجات المعيارية والملاحظات السريرية' : 'Scores & Conclusion Partielle' }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($assessments as $item)
            <tr>
                <td><strong>{{ $item['title'] ?? $item['type'] ?? 'Test' }}</strong></td>
                <td>{{ !empty($item['assessment_date']) ? \Carbon\Carbon::parse($item['assessment_date'])->format('d/m/Y') : '--' }}</td>
                <td>
                    {{ $item['diagnostic_conclusion'] ?? $item['recommendations'] ?? ($isArabic ? 'تم إجراء الاختبار وفق المعايير الإكلينيكية' : 'Passation standardisée.') }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
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
            <p><strong>{{ $isArabic ? 'التحليل السريري التركيبي:' : 'Synthèse Globale:' }}</strong> {!! nl2br(e($bilan->clinical_summary)) !!}</p>
        @endif

        @if(!empty($bilan->psychometric_analysis))
            <p><strong>{{ $isArabic ? 'تحليل نتائج المقاييس:' : 'Analyse des Résultats:' }}</strong> {!! nl2br(e($bilan->psychometric_analysis)) !!}</p>
        @endif

        @if(!empty($bilan->strengths_weaknesses))
            <p><strong>{{ $isArabic ? 'نقاط القوة والضعف:' : 'Profil des Forces & Faiblesses:' }}</strong> {!! nl2br(e($bilan->strengths_weaknesses)) !!}</p>
        @endif

        @if(!empty($bilan->diagnosis_codes))
            <div style="background-color: #f1f5f9; padding: 6px; border-left: 3px solid #0d9488; margin-top: 6px;">
                <strong>{{ $isArabic ? 'التشخيص المقترح (DSM-5 / CIM-11):' : 'Conclusion Diagnostique (DSM-5 / CIM-11) :' }}</strong><br>
                <span style="font-weight: bold; color: #0f766e;">{{ $bilan->diagnosis_codes }}</span>
            </div>
        @endif
    </div>

    <!-- 10. Therapeutic Project & Plan -->
    <div class="section-header">
        {{ $isArabic ? '7. المشروع العلاجي والتوصيات' : '7. Projet Thérapeutique & Préconisations' }}
    </div>
    <div class="content-box">
        {!! nl2br(e($bilan->therapeutic_project ?? ($isArabic ? 'يوصى ببدء حصص تكفل أرطوفوني/نفسي بمعدل حصتين أسبوعياً مع متابعة أسرية ومدرسية منتظمة.' : 'Prise en charge orthophonique préconisée à raison de 2 séances hebdomadaires avec guidance parentale.'))) !!}
    </div>

    <!-- 11. Signatures & Official Stamp -->
    <table class="stamp-table">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 15px;">
                <div style="font-size: 9.5px; color: #64748b;">
                    {{ $isArabic ? 'تحرر هذا التقرير للإدلاء به واستعماله في حدود ما يسمح به القانون والسر المهني الطبي.' : 'Ce compte-rendu est établi sous le sceau du secret professionnel pour faire valoir ce que de droit.' }}
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: center;">
                <div style="font-weight: bold; font-size: 10.5px; color: #0f766e; margin-bottom: 5px;">
                    {{ $isArabic ? 'توقيع وخاتم الأخصائي المعالج' : 'Signature & Cachet du Praticien' }}
                </div>
                <div class="stamp-box">
                    <br><br>
                    {{ $specialist->name ?? ($tenant->name ?? 'Le Praticien') }}
                </div>
            </td>
        </tr>
    </table>

</body>
</html>
