<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('knowledge_base_articles')) {
            Schema::create('knowledge_base_articles', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('clinic_id')->nullable()->index();
                $table->string('source_url', 500)->index();
                $table->string('title')->nullable();
                $table->longText('content');
                $table->integer('tokens_count')->default(0);
                $table->timestamp('last_crawled_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('support_conversations')) {
            Schema::create('support_conversations', function (Blueprint $table) {
                $table->id();
                $table->string('session_id', 100)->index();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('role', 30)->default('user'); // user, assistant, system
                $table->text('message');
                $table->json('sources')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('support_conversations');
        Schema::dropIfExists('knowledge_base_articles');
    }
};
