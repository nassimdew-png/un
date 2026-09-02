#!/usr/bin/env bash
set -e

echo "=== [1/6] Creating Migrations for Phase 5 ==="
cd /var/www/clinic-saas/backend

cat << 'EOF' > database/migrations/2026_01_01_000009_create_appointments_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('specialist_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('appointment_date');
            $table->enum('status', ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])->default('scheduled');
            $table->enum('type', ['initial_consultation', 'follow_up', 'assessment', 'therapy_session'])->default('follow_up');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
EOF

cat << 'EOF' > database/migrations/2026_01_01_000010_create_invoices_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->string('invoice_number');
            $table->decimal('total_amount', 10, 2);
            $table->decimal('paid_amount', 10, 2)->default(0.00);
            $table->enum('payment_status', ['unpaid', 'partially_paid', 'paid'])->default('unpaid');
            $table->enum('payment_method', ['cash', 'card', 'bank_transfer', 'baridimob'])->default('cash');
            $table->date('issued_date');
            $table->date('due_date')->nullable();
            $table->json('items');
            $table->timestamps();

            $table->unique(['tenant_id', 'invoice_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
EOF

echo "=== [2/6] Creating Models ==="
cat << 'EOF' > app/Models/Appointment.php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Appointment extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'specialist_id',
        'appointment_date',
        'status',
        'type',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'specialist_id');
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class, 'appointment_id');
    }
}
EOF

cat << 'EOF' > app/Models/Invoice.php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'appointment_id',
        'invoice_number',
        'total_amount',
        'paid_amount',
        'payment_status',
        'payment_method',
        'issued_date',
        'due_date',
        'items',
    ];

    protected function casts(): array
    {
        return [
            'issued_date' => 'date',
            'due_date' => 'date',
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'items' => 'array',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }
}
EOF

cat << 'EOF' > app/Models/Patient.php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'first_name',
        'last_name',
        'birth_date',
        'gender',
        'guardian_name',
        'phone',
        'emergency_contact',
        'kiosk_pin',
        'anamnesis_data',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'anamnesis_data' => 'array',
        ];
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(ClinicalAssessment::class, 'patient_id');
    }

    public function therapySessions(): HasMany
    {
        return $this->hasMany(TherapySession::class, 'patient_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'patient_id');
    }
}
EOF

cat << 'EOF' > app/Models/User.php
<?php

namespace App\Models;

use App\Models\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'phone',
        'password',
        'role',
        'specialty_license_number',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(ClinicalAssessment::class, 'specialist_id');
    }

    public function therapySessions(): HasMany
    {
        return $this->hasMany(TherapySession::class, 'specialist_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'specialist_id');
    }
}
EOF

echo "=== [3/6] Creating Invoice Receipt Blade View ==="
cat << 'EOF' > resources/views/pdf/invoice_receipt.blade.php
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
EOF

echo "=== [4/6] Creating Controllers (Appointments, Invoices, Kiosk) ==="
cat << 'EOF' > app/Http/Controllers/Api/AppointmentController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    /**
     * List appointments (tenant-scoped with date/specialist filters).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Appointment::with(['patient', 'specialist', 'invoice']);

        if ($startDate = $request->query('start_date')) {
            $query->whereDate('appointment_date', '>=', $startDate);
        }

        if ($endDate = $request->query('end_date')) {
            $query->whereDate('appointment_date', '<=', $endDate);
        }

        if ($specialistId = $request->query('specialist_id')) {
            $query->where('specialist_id', $specialistId);
        }

        if ($patientId = $request->query('patient_id')) {
            $query->where('patient_id', $patientId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $appointments = $query->orderBy('appointment_date', 'asc')->paginate((int) $request->query('per_page', 50));

        return response()->json($appointments);
    }

    /**
     * Store a new appointment.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'specialist_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date',
            'type' => 'required|in:initial_consultation,follow_up,assessment,therapy_session',
            'status' => 'nullable|in:scheduled,confirmed,completed,cancelled,no_show',
            'notes' => 'nullable|string',
        ]);

        $validated['status'] = $validated['status'] ?? 'scheduled';

        $appointment = Appointment::create($validated);

        return response()->json([
            'message' => 'Rendez-vous planifié avec succès.',
            'appointment' => $appointment->load(['patient', 'specialist']),
        ], 201);
    }

    /**
     * Display appointment details.
     */
    public function show(string $id): JsonResponse
    {
        $appointment = Appointment::with(['patient', 'specialist', 'invoice'])->findOrFail($id);

        return response()->json([
            'appointment' => $appointment,
        ]);
    }

    /**
     * Update appointment or status.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'appointment_date' => 'sometimes|required|date',
            'specialist_id' => 'sometimes|required|exists:users,id',
            'type' => 'sometimes|required|in:initial_consultation,follow_up,assessment,therapy_session',
            'status' => 'sometimes|required|in:scheduled,confirmed,completed,cancelled,no_show',
            'notes' => 'nullable|string',
        ]);

        $appointment->update($validated);

        return response()->json([
            'message' => 'Rendez-vous mis à jour.',
            'appointment' => $appointment->load(['patient', 'specialist']),
        ]);
    }

    /**
     * Delete appointment.
     */
    public function destroy(string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->delete();

        return response()->json([
            'message' => 'Rendez-vous supprimé.',
        ]);
    }
}
EOF

cat << 'EOF' > app/Http/Controllers/Api/InvoiceController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class InvoiceController extends Controller
{
    /**
     * List invoices with financial metrics summary.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['patient', 'appointment']);

        if ($patientId = $request->query('patient_id')) {
            $query->where('patient_id', $patientId);
        }

        if ($status = $request->query('payment_status')) {
            $query->where('payment_status', $status);
        }

        $totalBilled = (clone $query)->sum('total_amount');
        $totalPaid = (clone $query)->sum('paid_amount');
        $unpaidBalance = $totalBilled - $totalPaid;

        $invoices = $query->latest('issued_date')->paginate((int) $request->query('per_page', 25));

        return response()->json([
            'invoices' => $invoices,
            'summary' => [
                'total_billed' => (float) $totalBilled,
                'total_paid' => (float) $totalPaid,
                'unpaid_balance' => (float) $unpaidBalance,
            ],
        ]);
    }

    /**
     * Store new invoice with auto invoice number.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|in:unpaid,partially_paid,paid',
            'payment_method' => 'nullable|in:cash,card,bank_transfer,baridimob',
            'issued_date' => 'required|date',
            'due_date' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();
        $tenantId = $user->tenant_id;

        // Auto-generate invoice number: FAC-YYYY-XXXX
        $year = date('Y');
        $count = Invoice::withoutGlobalScopes()->where('tenant_id', $tenantId)->whereYear('issued_date', $year)->count() + 1;
        $validated['invoice_number'] = sprintf('FAC-%s-%04d', $year, $count);

        $validated['paid_amount'] = $validated['paid_amount'] ?? 0.00;
        if (!isset($validated['payment_status'])) {
            if ($validated['paid_amount'] >= $validated['total_amount']) {
                $validated['payment_status'] = 'paid';
            } elseif ($validated['paid_amount'] > 0) {
                $validated['payment_status'] = 'partially_paid';
            } else {
                $validated['payment_status'] = 'unpaid';
            }
        }

        $validated['payment_method'] = $validated['payment_method'] ?? 'cash';

        $invoice = Invoice::create($validated);

        return response()->json([
            'message' => 'Facture créée avec succès.',
            'invoice' => $invoice->load(['patient', 'appointment']),
        ], 201);
    }

    /**
     * Display invoice.
     */
    public function show(string $id): JsonResponse
    {
        $invoice = Invoice::with(['patient', 'appointment'])->findOrFail($id);

        return response()->json([
            'invoice' => $invoice,
        ]);
    }

    /**
     * Update invoice payment.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'paid_amount' => 'sometimes|required|numeric|min:0',
            'payment_status' => 'sometimes|required|in:unpaid,partially_paid,paid',
            'payment_method' => 'sometimes|required|in:cash,card,bank_transfer,baridimob',
            'due_date' => 'nullable|date',
        ]);

        $invoice->update($validated);

        return response()->json([
            'message' => 'Facture mise à jour.',
            'invoice' => $invoice->load(['patient', 'appointment']),
        ]);
    }

    /**
     * Delete invoice.
     */
    public function destroy(string $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();

        return response()->json([
            'message' => 'Facture supprimée.',
        ]);
    }

    /**
     * Generate Receipt PDF.
     */
    public function generatePdf(string $id): Response
    {
        $invoice = Invoice::with(['patient', 'appointment', 'tenant'])->findOrFail($id);

        $pdf = Pdf::loadView('pdf.invoice_receipt', [
            'invoice' => $invoice,
            'patient' => $invoice->patient,
            'tenant' => $invoice->tenant,
        ]);

        $fileName = 'Recu_' . $invoice->invoice_number . '.pdf';

        return $pdf->stream($fileName);
    }
}
EOF

cat << 'EOF' > app/Http/Controllers/Api/KioskController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KioskController extends Controller
{
    /**
     * Touchscreen Kiosk PIN check-in for patients in waiting room.
     */
    public function checkIn(Request $request): JsonResponse
    {
        $request->validate([
            'kiosk_pin' => 'required|string|size:6',
            'subdomain' => 'nullable|string',
        ]);

        $subdomain = $request->input('subdomain') ?: $request->header('X-Tenant-Subdomain') ?: 'elbiar-ortho';

        $tenant = Tenant::where('subdomain', $subdomain)->first();

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Cabinet introuvable.',
            ], 404);
        }

        // Find patient by PIN in tenant
        $patient = Patient::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('kiosk_pin', $request->kiosk_pin)
            ->first();

        if (!$patient) {
            return response()->json([
                'success' => false,
                'message' => 'Code PIN invalide. Veuillez vérifier auprès de l accueil.',
            ], 404);
        }

        // Check today's appointment
        $today = date('Y-m-d');
        $appointment = Appointment::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('patient_id', $patient->id)
            ->whereDate('appointment_date', $today)
            ->first();

        if ($appointment) {
            $appointment->update(['status' => 'confirmed']);
        }

        return response()->json([
            'success' => true,
            'message' => sprintf('Bienvenue %s %s ! Votre arrivée a été signalée.', $patient->first_name, $patient->last_name),
            'patient' => [
                'name' => $patient->first_name . ' ' . $patient->last_name,
                'appointment_time' => $appointment ? date('H:i', strtotime($appointment->appointment_date)) : 'Consultation du jour',
                'status' => 'Arrivée confirmée en salle d attente',
            ],
            'clinic' => $tenant->name,
        ]);
    }
}
EOF

echo "=== [5/6] Updating API Routes ==="
cat << 'EOF' > routes/api.php
<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClinicalAssessmentController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\KioskController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\TherapySessionController;
use Illuminate\Support\Facades\Route;

// Public Authentication & Kiosk Check-In
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});

Route::post('/kiosk/check-in', [KioskController::class, 'checkIn'])->name('kiosk.checkin');

// Protected Multi-Tenant API
Route::middleware(['auth:sanctum', 'tenant.active'])->group(function () {
    // Auth Session
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
    });

    // Patients Management
    Route::apiResource('patients', PatientController::class);

    // Clinical Assessments & PDF Generation
    Route::get('assessments/{id}/pdf', [ClinicalAssessmentController::class, 'generatePdf'])->name('assessments.pdf');
    Route::apiResource('assessments', ClinicalAssessmentController::class);

    // Therapy & Rehabilitation Sessions
    Route::apiResource('sessions', TherapySessionController::class);

    // Smart Appointments Scheduling
    Route::apiResource('appointments', AppointmentController::class);

    // Billing, Invoicing & Receipts PDF
    Route::get('invoices/{id}/pdf', [InvoiceController::class, 'generatePdf'])->name('invoices.pdf');
    Route::apiResource('invoices', InvoiceController::class);
});
EOF

echo "=== [6/6] Updating Database Seeder with Appointments & Invoices ==="
cat << 'EOF' > database/seeders/DatabaseSeeder.php
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
EOF

echo "=== Running Migrations and Seeding ==="
php artisan migrate:fresh --seed --force

echo "=== Backend Phase 5 Completed ==="
