<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Make patient_id nullable in invoices table
        try {
            DB::statement('ALTER TABLE invoices MODIFY patient_id BIGINT UNSIGNED NULL;');
        } catch (\Throwable $e) {
            // Ignore if already nullable or DB engine specific
        }

        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'invoice_type')) {
                $table->string('invoice_type')->default('clinical_receipt')->after('appointment_id');
            }
            if (!Schema::hasColumn('invoices', 'company_name')) {
                $table->string('company_name')->nullable()->after('invoice_type');
            }
            if (!Schema::hasColumn('invoices', 'tax_id')) {
                $table->string('tax_id')->nullable()->after('company_name'); // NIF / VAT ID
            }
            if (!Schema::hasColumn('invoices', 'trade_register')) {
                $table->string('trade_register')->nullable()->after('tax_id'); // RC
            }
            if (!Schema::hasColumn('invoices', 'nis_number')) {
                $table->string('nis_number')->nullable()->after('trade_register'); // NIS
            }
            if (!Schema::hasColumn('invoices', 'subscription_ref')) {
                $table->string('subscription_ref')->nullable()->after('nis_number');
            }
            if (!Schema::hasColumn('invoices', 'subscription_plan')) {
                $table->string('subscription_plan')->nullable()->after('subscription_ref');
            }
            if (!Schema::hasColumn('invoices', 'billing_period')) {
                $table->string('billing_period')->nullable()->after('subscription_plan');
            }
            if (!Schema::hasColumn('invoices', 'period_start')) {
                $table->date('period_start')->nullable()->after('billing_period');
            }
            if (!Schema::hasColumn('invoices', 'period_end')) {
                $table->date('period_end')->nullable()->after('period_start');
            }
            if (!Schema::hasColumn('invoices', 'subtotal_ht')) {
                $table->decimal('subtotal_ht', 12, 2)->nullable()->after('total_amount');
            }
            if (!Schema::hasColumn('invoices', 'tax_rate')) {
                $table->decimal('tax_rate', 5, 2)->nullable()->default(0.00)->after('subtotal_ht');
            }
            if (!Schema::hasColumn('invoices', 'tax_amount')) {
                $table->decimal('tax_amount', 12, 2)->nullable()->default(0.00)->after('tax_rate');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $columns = [
                'invoice_type',
                'company_name',
                'tax_id',
                'trade_register',
                'nis_number',
                'subscription_ref',
                'subscription_plan',
                'billing_period',
                'period_start',
                'period_end',
                'subtotal_ht',
                'tax_rate',
                'tax_amount',
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('invoices', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
