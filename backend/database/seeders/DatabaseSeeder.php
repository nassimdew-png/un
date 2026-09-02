<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\ClinicalAssessment;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Tenant;
use App\Models\TherapySession;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Superadmin
        User::create([
            'name' => 'Super Administrateur',
            'email' => 'superadmin@clinic-saas.dz',
            'phone' => '0550000000',
            'password' => Hash::make('password123'),
            'role' => 'superadmin',
            'is_active' => true,
        ]);

        // 2. Tenant 1: Orthophonie Alger
        $tenant1 = Tenant::create([
            'name' => 'Cabinet Orthophonie Alger',
            'subdomain' => 'elbiar-ortho',
            'type' => 'orthophony',
            'status' => 'active',
            'subscription_meta' => ['plan' => 'pro', 'max_users' => 10, 'expires_at' => '2027-12-31'],
            'settings' => [
                'city' => 'Alger',
                'commune' => 'El Biar',
                'address' => '12 Rue des Frères Bouadou, El Biar, Alger',
                'phone' => '023123456',
                'currency' => 'DZD',
            ],
        ]);

        $admin1 = User::create([
            'tenant_id' => $tenant1->id,
            'name' => 'Dr. Amina Benali (Admin)',
            'email' => 'admin@elbiar-ortho.dz',
            'phone' => '0551112233',
            'password' => Hash::make('password123'),
            'role' => 'clinic_admin',
            'specialty_license_number' => 'ORTHO-DZ-16-001',
            'is_active' => true,
        ]);

        $ortho1 = User::create([
            'tenant_id' => $tenant1->id,
            'name' => 'Yasmine Khelil (Orthophoniste)',
            'email' => 'ortho1@elbiar-ortho.dz',
            'phone' => '0552223344',
            'password' => Hash::make('password123'),
            'role' => 'orthophonist',
            'specialty_license_number' => 'ORTHO-DZ-16-045',
            'is_active' => true,
        ]);

        $p1 = Patient::create([
            'tenant_id' => $tenant1->id,
            'first_name' => 'Yanis',
            'last_name' => 'Meziani',
            'birth_date' => '2019-04-15',
            'gender' => 'male',
            'guardian_name' => 'Karim Meziani (Père)',
            'phone' => '0661234567',
            'emergency_contact' => '0770123456',
            'kiosk_pin' => '123456',
            'anamnesis_data' => [
                'consultation_reason' => 'Retard de langage et de parole',
                'medical_history' => 'Otites séro-muqueuses récidivantes',
                'speech_assessment' => 'Trouble de l articulation sur /s/ et /ch/',
            ],
        ]);

        $p2 = Patient::create([
            'tenant_id' => $tenant1->id,
            'first_name' => 'Inès',
            'last_name' => 'Boukhalfa',
            'birth_date' => '2017-09-20',
            'gender' => 'female',
            'guardian_name' => 'Fatima Boukhalfa (Mère)',
            'phone' => '0662345678',
            'emergency_contact' => '0555678901',
            'kiosk_pin' => '234567',
            'anamnesis_data' => [
                'consultation_reason' => 'Dyslexie et dysorthographie',
                'medical_history' => 'Développement psychomoteur normal',
                'speech_assessment' => 'Difficultés en voie phonologique, inversion b/d',
            ],
        ]);

        $p3 = Patient::create([
            'tenant_id' => $tenant1->id,
            'first_name' => 'Adel',
            'last_name' => 'Saadi',
            'birth_date' => '2016-11-03',
            'gender' => 'male',
            'guardian_name' => 'Mourad Saadi',
            'phone' => '0663456789',
            'kiosk_pin' => '345678',
            'anamnesis_data' => ['consultation_reason' => 'Bégaiement tonico-clonique'],
        ]);

        // Assessments for Tenant 1
        ClinicalAssessment::create([
            'tenant_id' => $tenant1->id,
            'patient_id' => $p1->id,
            'specialist_id' => $ortho1->id,
            'type' => 'orthophony_bilan',
            'title' => 'Bilan Phonologique et Articulatoire Complet',
            'assessment_date' => '2026-08-01',
            'results_data' => [
                'phonologie_test' => 'Sigmatisme interdental marqué sur /s/, /z/',
                'vocabulaire_score' => 'Percentile 25 (Retard lexical modéré)',
                'comprehension_syntaxique' => 'Score 18/20 (Norme normale)',
            ],
            'diagnostic_conclusion' => 'Retard de parole et trouble articulatoire isolé sans atteinte de la compréhension.',
            'recommendations' => 'Séances d orthophonie hebdomadaires (2x/semaine) axées sur le renforcement praxique.',
        ]);

        // Therapy Sessions for Tenant 1
        TherapySession::create([
            'tenant_id' => $tenant1->id,
            'patient_id' => $p1->id,
            'specialist_id' => $ortho1->id,
            'session_date' => '2026-08-10 10:00:00',
            'duration_minutes' => 45,
            'specialty' => 'orthophony',
            'progress_notes' => 'Travail du phonème /s/ en position initiale. Bonne participation de l enfant.',
            'exercises_targeted' => ['Loto des sons', 'Praxies labiales'],
            'attendance_status' => 'present',
        ]);

        // Appointments for Tenant 1
        $app1 = Appointment::create([
            'tenant_id' => $tenant1->id,
            'patient_id' => $p1->id,
            'specialist_id' => $ortho1->id,
            'appointment_date' => date('Y-m-d') . ' 10:00:00',
            'status' => 'confirmed',
            'type' => 'therapy_session',
            'notes' => 'Séance hebdomadaire de rééducation articulatoire',
        ]);

        $app2 = Appointment::create([
            'tenant_id' => $tenant1->id,
            'patient_id' => $p2->id,
            'specialist_id' => $admin1->id,
            'appointment_date' => date('Y-m-d', strtotime('+1 day')) . ' 14:00:00',
            'status' => 'scheduled',
            'type' => 'follow_up',
            'notes' => 'Suivi de lecture et fluence',
        ]);

        $app3 = Appointment::create([
            'tenant_id' => $tenant1->id,
            'patient_id' => $p3->id,
            'specialist_id' => $ortho1->id,
            'appointment_date' => date('Y-m-d', strtotime('+2 days')) . ' 11:30:00',
            'status' => 'scheduled',
            'type' => 'therapy_session',
            'notes' => 'Exercices de fluence et contrôle respiratoire',
        ]);

        // Invoices for Tenant 1
        Invoice::create([
            'tenant_id' => $tenant1->id,
            'patient_id' => $p1->id,
            'appointment_id' => $app1->id,
            'invoice_number' => 'FAC-2026-0001',
            'total_amount' => 3500.00,
            'paid_amount' => 3500.00,
            'payment_status' => 'paid',
            'payment_method' => 'cash',
            'issued_date' => date('Y-m-d'),
            'items' => [
                ['description' => 'Séance de rééducation orthophonique (45 min)', 'quantity' => 1, 'unit_price' => 3500.00],
            ],
        ]);

        Invoice::create([
            'tenant_id' => $tenant1->id,
            'patient_id' => $p2->id,
            'appointment_id' => $app2->id,
            'invoice_number' => 'FAC-2026-0002',
            'total_amount' => 8000.00,
            'paid_amount' => 4000.00,
            'payment_status' => 'partially_paid',
            'payment_method' => 'baridimob',
            'issued_date' => date('Y-m-d'),
            'due_date' => date('Y-m-d', strtotime('+15 days')),
            'items' => [
                ['description' => 'Bilan initial du langage écrit (Lecture & Dyslexie)', 'quantity' => 1, 'unit_price' => 8000.00],
            ],
        ]);

        // 3. Tenant 2: Psychologie Oran
        $tenant2 = Tenant::create([
            'name' => 'Clinique Psychologie Oran',
            'subdomain' => 'oran-psy',
            'type' => 'psychology',
            'status' => 'active',
            'subscription_meta' => ['plan' => 'standard', 'max_users' => 5, 'expires_at' => '2027-06-30'],
            'settings' => [
                'city' => 'Oran',
                'commune' => 'Akid Lotfi',
                'address' => 'Boulevard Millenium, Akid Lotfi, Oran',
                'phone' => '041987654',
                'currency' => 'DZD',
            ],
        ]);

        $admin2 = User::create([
            'tenant_id' => $tenant2->id,
            'name' => 'Dr. Bilal Mansouri (Admin)',
            'email' => 'admin@oran-psy.dz',
            'phone' => '0554445566',
            'password' => Hash::make('password123'),
            'role' => 'clinic_admin',
            'specialty_license_number' => 'PSY-DZ-31-042',
            'is_active' => true,
        ]);

        $psyP1 = Patient::create([
            'tenant_id' => $tenant2->id,
            'first_name' => 'Nour',
            'last_name' => 'Zitouni',
            'birth_date' => '2005-06-12',
            'gender' => 'female',
            'phone' => '0666789012',
            'kiosk_pin' => '678901',
            'anamnesis_data' => ['consultation_reason' => 'Trouble anxieux généralisé et stress scolaire (Bac)'],
        ]);

        $appOran = Appointment::create([
            'tenant_id' => $tenant2->id,
            'patient_id' => $psyP1->id,
            'specialist_id' => $admin2->id,
            'appointment_date' => date('Y-m-d') . ' 16:00:00',
            'status' => 'confirmed',
            'type' => 'therapy_session',
            'notes' => 'Séance TCC restructuration cognitive',
        ]);

        Invoice::create([
            'tenant_id' => $tenant2->id,
            'patient_id' => $psyP1->id,
            'appointment_id' => $appOran->id,
            'invoice_number' => 'FAC-2026-0001',
            'total_amount' => 4500.00,
            'paid_amount' => 4500.00,
            'payment_status' => 'paid',
            'payment_method' => 'baridimob',
            'issued_date' => date('Y-m-d'),
            'items' => [
                ['description' => 'Séance de psychothérapie TCC (50 min)', 'quantity' => 1, 'unit_price' => 4500.00],
            ],
        ]);

        // 4. Tenant 3: Pluridisciplinaire Constantine
        $tenant3 = Tenant::create([
            'name' => 'Centre Pluridisciplinaire Constantine',
            'subdomain' => 'constantine-sante',
            'type' => 'multidisciplinary',
            'status' => 'trial',
            'subscription_meta' => ['plan' => 'trial', 'max_users' => 15, 'expires_at' => '2026-09-30'],
            'settings' => [
                'city' => 'Constantine',
                'commune' => 'Sidi Mabrouk',
                'address' => 'Cité 500 Logements, Sidi Mabrouk, Constantine',
                'phone' => '031456789',
                'currency' => 'DZD',
            ],
        ]);

        $admin3 = User::create([
            'tenant_id' => $tenant3->id,
            'name' => 'Dr. Tarek Benaissa (Admin)',
            'email' => 'admin@constantine-sante.dz',
            'phone' => '0556667788',
            'password' => Hash::make('password123'),
            'role' => 'clinic_admin',
            'is_active' => true,
        ]);

        $pMulti = Patient::create([
            'tenant_id' => $tenant3->id,
            'first_name' => 'Wassim',
            'last_name' => 'Guerfi',
            'birth_date' => '2016-05-10',
            'gender' => 'male',
            'phone' => '0661112233',
            'guardian_name' => 'Farid Guerfi',
            'kiosk_pin' => '112233',
            'anamnesis_data' => ['consultation_reason' => 'Suivi combiné Orthophonie + Psychologie'],
        ]);

        Appointment::create([
            'tenant_id' => $tenant3->id,
            'patient_id' => $pMulti->id,
            'specialist_id' => $admin3->id,
            'appointment_date' => date('Y-m-d') . ' 11:00:00',
            'status' => 'confirmed',
            'type' => 'assessment',
            'notes' => 'Bilan initial pluridisciplinaire',
        ]);
    }
}
