<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('system_error_diagnostics')) {
            Schema::create('system_error_diagnostics', function (Blueprint $table) {
                $table->id();
                $table->string('exception_class');
                $table->text('message');
                $table->string('file');
                $table->integer('line');
                $table->longText('stack_trace')->nullable();
                $table->text('code_context')->nullable();
                $table->longText('ai_diagnosis')->nullable();
                $table->longText('proposed_patch')->nullable();
                $table->longText('suggested_code')->nullable();
                $table->string('status', 30)->default('pending'); // pending, reviewed, applied, dismissed
                $table->string('severity', 20)->default('high'); // critical, high, medium, low
                $table->integer('occurrences_count')->default(1);
                $table->timestamp('last_seen_at')->nullable();
                $table->timestamps();

                $table->index(['file', 'line', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_error_diagnostics');
    }
};
