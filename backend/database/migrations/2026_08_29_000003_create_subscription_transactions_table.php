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
        Schema::create('subscription_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('clinic_id')->index();
            $table->string('plan_id'); // 'starter', 'pro', 'annual_vip'
            $table->decimal('amount', 10, 2);
            $table->enum('payment_method', ['baridimob', 'ccp', 'chargily'])->default('baridimob');
            $table->string('receipt_image_path')->nullable();
            $table->string('transaction_reference')->nullable();
            $table->enum('payment_status', ['pending', 'paid', 'rejected'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->string('approved_by')->nullable();
            $table->string('invoice_number')->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_transactions');
    }
};
