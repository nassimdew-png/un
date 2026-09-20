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
        // 1. Enhance tenants table with sovereign control columns
        if (Schema::hasTable('tenants')) {
            Schema::table('tenants', function (Blueprint $table) {
                if (!Schema::hasColumn('tenants', 'is_quarantined')) {
                    $table->boolean('is_quarantined')->default(false)->after('status');
                }
                if (!Schema::hasColumn('tenants', 'quarantine_reason')) {
                    $table->text('quarantine_reason')->nullable()->after('is_quarantined');
                }
                if (!Schema::hasColumn('tenants', 'quarantined_at')) {
                    $table->timestamp('quarantined_at')->nullable()->after('quarantine_reason');
                }
                if (!Schema::hasColumn('tenants', 'quarantined_by')) {
                    $table->unsignedBigInteger('quarantined_by')->nullable()->after('quarantined_at');
                }
                if (!Schema::hasColumn('tenants', 'feature_overrides')) {
                    $table->json('feature_overrides')->nullable()->after('custom_overrides');
                }
                if (!Schema::hasColumn('tenants', 'quota_overrides')) {
                    $table->json('quota_overrides')->nullable()->after('feature_overrides');
                }
                if (!Schema::hasColumn('tenants', 'is_sandbox_clone')) {
                    $table->boolean('is_sandbox_clone')->default(false)->after('quota_overrides');
                }
                if (!Schema::hasColumn('tenants', 'cloned_from_tenant_id')) {
                    $table->string('cloned_from_tenant_id', 64)->nullable()->after('is_sandbox_clone');
                }
                if (!Schema::hasColumn('tenants', 'churn_risk_score')) {
                    $table->unsignedTinyInteger('churn_risk_score')->default(0)->after('cloned_from_tenant_id');
                }
                if (!Schema::hasColumn('tenants', 'churn_risk_level')) {
                    $table->string('churn_risk_level', 32)->default('low')->after('churn_risk_score');
                }
                if (!Schema::hasColumn('tenants', 'last_activity_at')) {
                    $table->timestamp('last_activity_at')->nullable()->after('churn_risk_level');
                }
            });
        }

        // 2. Create tenant_data_snapshots table for tenant-specific backups and compliance bundles
        if (!Schema::hasTable('tenant_data_snapshots')) {
            Schema::create('tenant_data_snapshots', function (Blueprint $table) {
                $table->id();
                $table->string('clinic_id', 64)->index();
                $table->string('snapshot_type', 32)->default('full_json'); // full_json, clinical_only, settings_only
                $table->string('file_path', 255);
                $table->string('file_name', 255);
                $table->unsignedBigInteger('size_bytes')->default(0);
                $table->unsignedInteger('records_count')->default(0);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->string('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tenant_data_snapshots')) {
            Schema::dropIfExists('tenant_data_snapshots');
        }

        if (Schema::hasTable('tenants')) {
            Schema::table('tenants', function (Blueprint $table) {
                $columns = [
                    'is_quarantined',
                    'quarantine_reason',
                    'quarantined_at',
                    'quarantined_by',
                    'feature_overrides',
                    'quota_overrides',
                    'is_sandbox_clone',
                    'cloned_from_tenant_id',
                    'churn_risk_score',
                    'churn_risk_level',
                    'last_activity_at'
                ];
                foreach ($columns as $col) {
                    if (Schema::hasColumn('tenants', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
