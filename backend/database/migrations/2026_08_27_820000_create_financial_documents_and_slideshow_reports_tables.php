<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('financial_documents')) {
            Schema::create('financial_documents', function (Blueprint $table) {
                $table->id();
                $table->string('clinic_id', 100)->index();
                $table->string('type', 50)->default('expense_receipt'); // invoice, expense_receipt, bank_statement
                $table->string('vendor_name')->nullable();
                $table->string('invoice_number')->nullable();
                $table->date('invoice_date')->nullable();
                $table->decimal('total_amount', 12, 2)->default(0);
                $table->decimal('tax_amount', 12, 2)->default(0);
                $table->string('currency', 10)->default('DZD');
                $table->string('category', 50)->default('medical_supplies'); // materials, medical_supplies, rent, utilities, software, marketing, other
                $table->string('status', 30)->default('extracted'); // extracted, reconciled, discrepancy
                $table->string('file_path')->nullable();
                $table->json('raw_extracted_data')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('slideshow_reports')) {
            Schema::create('slideshow_reports', function (Blueprint $table) {
                $table->id();
                $table->string('clinic_id', 100)->index();
                $table->string('title');
                $table->string('period', 50)->default('this_month');
                $table->json('slides_json');
                $table->json('summary_kpis')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('slideshow_reports');
        Schema::dropIfExists('financial_documents');
    }
};
